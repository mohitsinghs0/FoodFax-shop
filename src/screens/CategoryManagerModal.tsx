import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { MenuCategory } from '../types';
import { 
  X, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  FolderPlus, 
  Tag, 
  AlertTriangle,
  Layers,
  UtensilsCrossed
} from 'lucide-react';

interface CategoryManagerModalProps {
  onClose: () => void;
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  onClose,
  onSelectCategory,
}) => {
  const { 
    menuCategories, 
    menuItems, 
    addCategory, 
    renameCategory, 
    deleteCategory 
  } = useOwnerApp();

  // Create state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit / Rename state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirmation state
  const [catToDelete, setCatToDelete] = useState<MenuCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search filter inside categories
  const [filterText, setFilterText] = useState('');

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    try {
      await addCategory(trimmed, newCatDesc.trim() || undefined);
      setNewCatName('');
      setNewCatDesc('');
    } finally {
      setIsCreating(false);
    }
  };

  // Start Editing
  const startEditing = (cat: MenuCategory) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
  };

  // Save Renamed Category
  const handleSaveRename = async (catId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    setIsUpdating(true);
    try {
      await renameCategory(catId, trimmed, editDesc.trim() || undefined);
      setEditingCatId(null);
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!catToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategory(catToDelete.id);
      setCatToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered categories
  const filteredCategories = menuCategories.filter((c) =>
    c.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#131B2E] border border-[#23304A] rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[92vh] flex flex-col select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23304A] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F97316]/15 text-[#F97316] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Menu Categories</h3>
              <p className="text-[11px] text-[#94A3B8]">
                Create, rename and organize menu groups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Category Card */}
        <div className="bg-[#0B0F19] border border-[#23304A] rounded-2xl p-3.5 shrink-0">
          <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
            <FolderPlus className="w-4 h-4 text-[#F97316]" />
            <span>Create New Category</span>
          </h4>
          <form onSubmit={handleAddCategory} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name (e.g. Starters, Beverages, Combos)..."
                className="flex-1 bg-[#131B2E] border border-[#23304A] focus:border-[#F97316] rounded-xl px-3 py-2 text-xs text-white outline-none font-medium placeholder-[#64748B]"
                required
              />
              <button
                type="submit"
                disabled={isCreating || !newCatName.trim()}
                className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer shadow-md shadow-orange-950/40"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isCreating ? 'Adding...' : 'Add'}</span>
              </button>
            </div>
            <input
              type="text"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              placeholder="Optional description (e.g. Crispy appetizers and finger food)"
              className="w-full bg-[#131B2E] border border-[#23304A]/60 focus:border-[#F97316] rounded-xl px-3 py-1.5 text-[11px] text-[#94A3B8] outline-none font-medium placeholder-[#64748B]"
            />
          </form>
        </div>

        {/* Existing Categories List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px]">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold px-1 mb-1">
            <span>All Categories ({menuCategories.length})</span>
            {menuCategories.length > 5 && (
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter..."
                className="bg-[#0B0F19] border border-[#23304A] rounded-lg px-2 py-0.5 text-[10px] text-white outline-none w-28"
              />
            )}
          </div>

          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-[#94A3B8] text-xs">
              No categories found. Create one above!
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const isEditing = editingCatId === cat.id;
              const itemCount = menuItems.filter((i) => i.categoryId === cat.id).length;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-[#0B0F19] border-2 border-[#F97316] space-y-2 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#F97316]">Rename Category</span>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="text-[11px] text-[#94A3B8] hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Category name"
                      className="w-full bg-[#131B2E] border border-[#23304A] focus:border-[#F97316] rounded-xl px-3 py-1.5 text-xs text-white outline-none font-bold"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full bg-[#131B2E] border border-[#23304A]/60 rounded-xl px-3 py-1 text-[11px] text-[#94A3B8] outline-none"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="px-3 py-1.5 rounded-lg bg-[#1E293B] text-xs text-[#94A3B8] font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveRename(cat.id)}
                        disabled={isUpdating || !editName.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-xs text-white font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isUpdating ? 'Saving...' : 'Save'}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="p-3 rounded-2xl bg-[#0B0F19] border border-[#23304A] hover:border-[#384969] transition flex items-center justify-between gap-3 group"
                >
                  <div 
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(cat.id);
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-white truncate">
                        {cat.name}
                      </h5>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#131B2E] border border-[#23304A] text-[#94A3B8]">
                        {itemCount} {itemCount === 1 ? 'dish' : 'dishes'}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditing(cat)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#131B2E] transition cursor-pointer"
                      title="Rename Category"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatToDelete(cat)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info / quick tags reference */}
        <div className="pt-2 border-t border-[#23304A] flex items-center justify-between text-[11px] text-[#94A3B8] shrink-0">
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Items can also be tagged directly</span>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#2A384F] text-xs font-bold text-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {catToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#131B2E] border border-[#23304A] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Delete Category?</h4>
                <p className="text-[11px] text-[#94A3B8]">"{catToDelete.name}"</p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{catToDelete.name}"</strong>? 
              Existing dishes in this category will remain safe in your menu under "All Dishes".
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-[#0B0F19] text-[#94A3B8] hover:text-white font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-red-950"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Category'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
