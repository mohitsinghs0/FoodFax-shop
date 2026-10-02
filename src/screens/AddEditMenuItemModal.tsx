import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { MenuItem, DEFAULT_MENU_CATEGORIES } from '../types';
import { 
  X, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Plus, 
  Image as ImageIcon, 
  Upload, 
  Camera, 
  Loader2 
} from 'lucide-react';

interface AddEditMenuItemModalProps {
  itemToEdit?: MenuItem | null;
  onClose: () => void;
}

export const AddEditMenuItemModal: React.FC<AddEditMenuItemModalProps> = ({
  itemToEdit,
  onClose,
}) => {
  const { menuCategories, saveMenuItem, deleteMenuItem, addCategory } = useOwnerApp();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [prepTime, setPrepTime] = useState('15');
  const [tag, setTag] = useState<string>('None');
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [showCustomTagInput, setShowCustomTagInput] = useState<boolean>(false);
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Predefined & standard tags requested: Starters, Main Course, Beverages, etc.
  const standardTags = [
    'None',
    'Starters',
    'Main Course',
    'Beverages',
    'Bestseller',
    "Chef's Special",
    'Must Try',
    'Spicy',
    'New',
    'Dessert',
    'Combos',
  ];

  // Ensure category dropdown is NEVER empty even on first launch or offline
  const availableCategories = useMemo(() => {
    if (menuCategories && menuCategories.length > 0) {
      return menuCategories;
    }
    return DEFAULT_MENU_CATEGORIES;
  }, [menuCategories]);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategoryId(itemToEdit.categoryId || (availableCategories[0]?.id ?? ''));
      setPrice(String(itemToEdit.price));
      setDescription(itemToEdit.description || '');
      setImageUrl(itemToEdit.imageUrl || '');
      setIsVeg(itemToEdit.isVeg);
      setIsAvailable(itemToEdit.isAvailable);
      setPrepTime(String(itemToEdit.preparationTimeMinutes));
      setTag(itemToEdit.tag || 'None');
    } else {
      if (!categoryId && availableCategories.length > 0) {
        setCategoryId(availableCategories[0].id);
      }
    }
  }, [itemToEdit, availableCategories, categoryId]);

  // Handle client-side image compression and upload via FileReader
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 800x800 for optimal loading & storage performance
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImageUrl(compressedDataUrl);
        } else {
          setImageUrl(event.target?.result as string);
        }
        setIsUploadingImage(false);
      };
      img.onerror = () => {
        setImageUrl(event.target?.result as string);
        setIsUploadingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      alert('Failed to read the selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleQuickAddCategory = async () => {
    const trimmed = quickCatName.trim();
    if (!trimmed) return;
    setIsAddingCat(true);
    try {
      await addCategory(trimmed);
      setQuickCatName('');
      setShowQuickAddCat(false);
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleDeleteDish = async () => {
    if (!itemToEdit?.id) return;
    setIsDeleting(true);
    try {
      await deleteMenuItem(itemToEdit.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await saveMenuItem({
      id: itemToEdit?.id,
      name: name.trim(),
      categoryId: categoryId || undefined,
      price: parseFloat(price) || 0,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      isVeg,
      isAvailable,
      preparationTimeMinutes: parseInt(prepTime, 10) || 15,
      tag: tag !== 'None' ? tag : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#131B2E] border border-[#23304A] rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto select-none">
        <div className="flex items-center justify-between border-b border-[#23304A] pb-3">
          <h3 className="text-base font-black text-white">
            {itemToEdit ? 'Edit Dish Details' : 'Add New Dish to Menu'}
          </h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dish Image Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
                <span>Dish Image / Menu Photo</span>
                <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileUpload}
            />

            {/* Image Preview or Upload Dropzone */}
            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#23304A] bg-[#0B0F19] group">
                <img
                  src={imageUrl}
                  alt={name || 'Dish preview'}
                  className="w-full h-36 object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Photo</span>
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 border border-emerald-500/30">
                  <Check className="w-3 h-3" />
                  <span>Image Uploaded</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#23304A] hover:border-orange-500/60 rounded-2xl p-4 bg-[#0B0F19]/60 hover:bg-[#0B0F19] transition cursor-pointer flex flex-col items-center justify-center text-center group"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    {isUploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-white">
                    {isUploadingImage ? 'Processing Image...' : 'Click to Upload Menu / Dish Image'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Take photo from camera or upload from gallery
                  </p>
                </div>

                {/* Alternative URL paste */}
                <div className="flex items-center justify-between text-[11px] px-1">
                  <span className="text-slate-500 font-semibold">Or use web image</span>
                  <button
                    type="button"
                    onClick={() => setImageInputMode(imageInputMode === 'url' ? 'upload' : 'url')}
                    className="font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
                  >
                    {imageInputMode === 'url' ? 'Hide URL input' : 'Paste Image Link (URL)'}
                  </button>
                </div>

                {imageInputMode === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 bg-[#0B0F19] border border-[#23304A] focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">Dish Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paneer Tikka Masala"
              className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-[#F97316] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-medium"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Menu Category *</label>
              <button
                type="button"
                onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{showQuickAddCat ? 'Hide' : 'New Category'}</span>
              </button>
            </div>

            <select
              value={categoryId}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  setShowQuickAddCat(true);
                } else {
                  setCategoryId(e.target.value);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
            >
              <option value="">Select Category (or Uncategorized)</option>
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__add_new__" className="text-orange-400 font-bold">
                ➕ + Add New Category...
              </option>
            </select>

            {/* Quick Inline Category Creator */}
            {showQuickAddCat && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-orange-500/30 flex gap-2 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={quickCatName}
                  onChange={(e) => setQuickCatName(e.target.value)}
                  placeholder="e.g. Desserts, Sandwiches, Cold Drinks"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-orange-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleQuickAddCategory}
                  disabled={isAddingCat || !quickCatName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition"
                >
                  {isAddingCat ? 'Adding...' : 'Add'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Price (₹) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="249"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Prep Time (Mins)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description &amp; Ingredients</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fresh cottage cheese cooked in creamy tomato gravy with aromatic fenugreek"
              className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none"
            />
          </div>

          {/* Veg / Non-Veg Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dietary Classification</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsVeg(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  isVeg
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>🟢</span>
                <span>Pure Vegetarian</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVeg(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  !isVeg
                    ? 'bg-red-500/15 border-red-500 text-red-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>🔴</span>
                <span>Non-Vegetarian</span>
              </button>
            </div>
          </div>

          {/* Item Tag & Dietary Classification */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Item Tag / Label (e.g. Starters, Main Course, Beverages)
              </label>
              <button
                type="button"
                onClick={() => setShowCustomTagInput(!showCustomTagInput)}
                className="text-[11px] font-bold text-orange-400 hover:text-orange-300 transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{showCustomTagInput ? 'Hide Custom' : 'Custom Tag'}</span>
              </button>
            </div>

            {/* Custom Tag Input */}
            {showCustomTagInput && (
              <div className="mb-2 p-2 rounded-xl bg-slate-950 border border-orange-500/30 flex gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="Enter custom tag (e.g. Keto, Special Chaat)..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const t = customTagInput.trim();
                    if (t) {
                      setTag(t);
                      setCustomTagInput('');
                      setShowCustomTagInput(false);
                    }
                  }}
                  disabled={!customTagInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition"
                >
                  Apply
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {standardTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    tag === t
                      ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
              {/* If active tag is custom and not in standard tags */}
              {tag && !standardTags.includes(tag) && (
                <button
                  type="button"
                  onClick={() => {}}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-orange-600 text-white border-orange-500 shadow-sm flex items-center gap-1"
                >
                  <span>{tag}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setTag('None');
                    }}
                    className="text-[10px] bg-orange-800 rounded-full w-3.5 h-3.5 flex items-center justify-center cursor-pointer hover:bg-orange-900"
                  >
                    ×
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-200">In Stock for Ordering</p>
              <p className="text-[11px] text-slate-400">Available to customers on menu</p>
            </div>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-lg shadow-orange-950 transition active:scale-95"
            >
              {itemToEdit ? 'Update Dish' : 'Save Dish'}
            </button>
          </div>

          {/* Delete Dish Button when Editing */}
          {itemToEdit && (
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Dish from Menu</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* In-app Delete Confirmation Modal */}
      {showDeleteConfirm && itemToEdit && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Delete Dish?</h4>
                <p className="text-[11px] text-slate-400">"{itemToEdit.name}"</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">"{itemToEdit.name}"</strong>? It will be permanently removed from customer view and IndexedDB local store.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDish}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-950 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
