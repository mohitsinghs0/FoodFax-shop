import React, { useState, useMemo } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { MenuItem } from '../types';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  Pencil, 
  Leaf, 
  Flame, 
  Layers, 
  X,
  Clock,
  Tag,
  Check,
  Sparkles
} from 'lucide-react';
import { CategoryManagerModal } from './CategoryManagerModal';

interface MenuScreenProps {
  onOpenAddItem: (itemToEdit?: MenuItem) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onOpenAddItem }) => {
  const { 
    menuItems, 
    menuCategories, 
    toggleItemAvailability, 
    deleteMenuItem, 
    assignItemTag,
    assignItemCategory,
    setActiveScreen 
  } = useOwnerApp();

  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [quickTagItem, setQuickTagItem] = useState<MenuItem | null>(null);

  const availableTags = [
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

  // Filtered dishes
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (selectedCatId !== 'all' && item.categoryId !== selectedCatId) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.tag && item.tag.toLowerCase().includes(q))
      );
    });
  }, [menuItems, selectedCatId, searchQuery]);

  return (
    <div className="flex-1 bg-[#0B0F19] text-[#F8FAFC] pb-24 relative select-none flex flex-col">
      {/* Top App Bar */}
      <div className="px-4 py-3.5 border-b border-[#131B2E] flex items-center justify-between bg-[#0B0F19]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className="p-1 -ml-1 text-white hover:text-[#F97316] transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h2 className="text-[17px] font-black tracking-tight text-white">
            Menu Management
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Header Add Dish Quick Button */}
          <button
            onClick={() => onOpenAddItem()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
            title="Add New Dish"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Item</span>
          </button>

          {/* Manage Categories Button */}
          <button
            onClick={() => setShowCategoryManager(true)}
            className="flex items-center gap-1 p-1.5 px-2.5 rounded-xl bg-[#131B2E] border border-[#23304A] text-[#94A3B8] hover:text-white hover:border-[#F97316] transition cursor-pointer text-xs font-semibold"
            title="Manage Categories"
          >
            <Layers className="w-4 h-4 text-[#F97316]" />
            <span className="hidden sm:inline">Categories</span>
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-3 lg:py-6 space-y-3.5 lg:space-y-5 max-w-md lg:max-w-7xl mx-auto w-full">
        {/* Search Bar */}
        <div className="relative max-w-md lg:max-w-xl">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes by name, tag, description..."
            className="w-full bg-[#131B2E] border border-[#23304A] focus:border-[#F97316] rounded-[14px] pl-10 pr-4 py-3 text-xs text-white placeholder-[#64748B] outline-none font-medium transition"
          />
        </div>

        {/* Category Pills Header with direct '+ Manage' button */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
          <button
            onClick={() => setSelectedCatId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border cursor-pointer ${
              selectedCatId === 'all'
                ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                : 'border-[#23304A] bg-[#131B2E] text-[#94A3B8] hover:text-white'
            }`}
          >
            All Dishes ({menuItems.length})
          </button>

          {menuCategories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            const count = menuItems.filter((i) => i.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                    : 'border-[#23304A] bg-[#131B2E] text-[#94A3B8] hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75 font-normal">({count})</span>
              </button>
            );
          })}

          {/* Quick Category Manager Pill */}
          <button
            onClick={() => setShowCategoryManager(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border border-dashed border-[#F97316]/50 bg-[#F97316]/5 text-[#F97316] hover:bg-[#F97316]/15 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Manage Categories</span>
          </button>
        </div>

        {/* Menu Items List */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-[#94A3B8] flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#131B2E] border border-[#23304A] flex items-center justify-center text-[#F97316] mb-3">
              <Plus className="w-7 h-7 stroke-[2]" />
            </div>
            <p className="text-sm font-semibold text-white">No dishes found in this category</p>
            <p className="text-xs text-[#64748B] mt-1 mb-5">Tap below to add a new dish to your menu</p>
            <button
              onClick={() => onOpenAddItem()}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Your First Dish</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 lg:gap-4 pt-1">
            {filteredItems.map((item) => {
              const itemCat = menuCategories.find((c) => c.id === item.categoryId);

              return (
                <div
                  key={item.id}
                  className="bg-[#131B2E] border border-[#23304A] hover:border-[#334668] transition rounded-[20px] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Square Veg Icon + Name & Price */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-[14px] bg-[#0B0F19] border border-[#23304A] flex items-center justify-center shrink-0">
                        {item.isVeg ? (
                          <Leaf className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Flame className="w-6 h-6 text-rose-500 fill-rose-500/20" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[15px] font-bold text-white capitalize truncate leading-tight">
                            {item.name}
                          </h4>
                          {/* Tag badge (e.g. Starters, Main Course, Beverages, Bestseller) */}
                          {item.tag && item.tag !== 'None' && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{item.tag}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                          <span className="font-extrabold text-[#F97316]">
                            ₹{item.price}
                          </span>
                          <span className="text-[#94A3B8] flex items-center gap-1 font-medium text-[11px]">
                            <Clock className="w-3 h-3 text-[#94A3B8]" />
                            {item.preparationTimeMinutes || 15}m prep
                          </span>
                          {itemCat && (
                            <span className="text-[#64748B] text-[11px] font-medium border-l border-[#23304A] pl-2 truncate max-w-[100px]">
                              {itemCat.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Toggle Switch & In Stock Label */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        onClick={() => toggleItemAvailability(item.id, !item.isAvailable)}
                        className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                          item.isAvailable ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span
                        className={`text-[11px] font-semibold ${
                          item.isAvailable ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row Actions: Assign Tag, Edit & Delete Icons */}
                  <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-[#23304A]/40">
                    {/* Quick Tag Button */}
                    <button
                      onClick={() => setQuickTagItem(item)}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#94A3B8] hover:text-[#F97316] bg-[#0B0F19] px-2.5 py-1 rounded-lg border border-[#23304A] transition cursor-pointer"
                    >
                      <Tag className="w-3 h-3 text-[#F97316]" />
                      <span>{item.tag && item.tag !== 'None' ? item.tag : 'Assign Tag'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenAddItem(item)}
                        className="p-1.5 text-[#94A3B8] hover:text-white transition cursor-pointer rounded-lg hover:bg-[#0B0F19]"
                        title="Edit dish"
                      >
                        <Pencil className="w-4 h-4 stroke-[2]" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 text-rose-500 hover:text-rose-400 transition cursor-pointer rounded-lg hover:bg-rose-500/10"
                        title="Delete dish"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Button "+ Add Dish / Item" */}
      <div className="sticky bottom-4 lg:bottom-6 left-0 right-0 max-w-md lg:max-w-lg mx-auto px-4 z-20 pointer-events-none flex justify-center mt-6">
        <button
          onClick={() => onOpenAddItem()}
          className="pointer-events-auto bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm px-6 py-3.5 rounded-[18px] shadow-xl shadow-orange-950/60 flex items-center gap-2 transition active:scale-95 cursor-pointer border border-orange-400/20"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add Dish / Item</span>
        </button>
      </div>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManagerModal
          onClose={() => setShowCategoryManager(false)}
          onSelectCategory={(catId) => {
            setSelectedCatId(catId);
          }}
        />
      )}

      {/* Quick Tag Assignment Modal */}
      {quickTagItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#131B2E] border border-[#23304A] rounded-[24px] max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#23304A] pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#F97316]" />
                <h4 className="text-sm font-black text-white">Assign Tag to Dish</h4>
              </div>
              <button
                onClick={() => setQuickTagItem(null)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#94A3B8]">
              Select a tag for <strong className="text-white">"{quickTagItem.name}"</strong>:
            </p>

            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
              {availableTags.map((t) => {
                const isSelected = (quickTagItem.tag || 'None') === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={async () => {
                      const newTag = t === 'None' ? undefined : t;
                      await assignItemTag(quickTagItem.id, newTag);
                      setQuickTagItem(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#F97316] text-white border-[#F97316] shadow-md shadow-orange-950/40'
                        : 'bg-[#0B0F19] text-[#94A3B8] border-[#23304A] hover:text-white hover:border-[#384969]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#23304A] flex justify-end">
              <button
                onClick={() => setQuickTagItem(null)}
                className="px-4 py-2 rounded-xl bg-[#0B0F19] text-xs font-bold text-[#94A3B8] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131B2E] border border-[#23304A] rounded-[24px] p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">Delete Dish?</h3>
            <p className="text-xs text-[#94A3B8] mt-1.5">
              Are you sure you want to remove &quot;{itemToDelete.name}&quot; from your menu?
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#0B0F19] text-[#94A3B8] font-bold text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = itemToDelete.id;
                  setItemToDelete(null);
                  await deleteMenuItem(id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

