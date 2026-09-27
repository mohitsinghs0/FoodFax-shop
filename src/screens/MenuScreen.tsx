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
  Clock
} from 'lucide-react';

interface MenuScreenProps {
  onOpenAddItem: (itemToEdit?: MenuItem) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onOpenAddItem }) => {
  const { 
    menuItems, 
    menuCategories, 
    toggleItemAvailability, 
    deleteMenuItem, 
    setActiveScreen 
  } = useOwnerApp();

  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // Filtered dishes
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (selectedCatId !== 'all' && item.categoryId !== selectedCatId) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [menuItems, selectedCatId, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] pb-24 relative select-none">
      {/* Top App Bar matching Photo 3 */}
      <div className="px-4 py-3.5 border-b border-[#131B2E] flex items-center justify-between sticky top-0 bg-[#0B0F19] z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className="p-1 -ml-1 text-white hover:text-[#F97316] transition"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h2 className="text-[17px] font-black tracking-tight text-white">
            Menu Management
          </h2>
        </div>

        <button
          onClick={() => {}}
          className="p-1.5 text-[#94A3B8] hover:text-white transition"
          title="Categories"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3.5 max-w-md mx-auto">
        {/* Search Bar matching Photo 3 */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu dishes..."
            className="w-full bg-[#131B2E] border border-[#23304A] focus:border-[#F97316] rounded-[14px] pl-10 pr-4 py-3 text-xs text-white placeholder-[#64748B] outline-none font-medium transition"
          />
        </div>

        {/* Category Pills matching Photo 3 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
          <button
            onClick={() => setSelectedCatId('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
              selectedCatId === 'all'
                ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                : 'border-[#23304A] bg-[#131B2E] text-[#94A3B8] hover:text-white'
            }`}
          >
            All Dishes
          </button>
          {menuCategories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'border-[#F97316] bg-[#F97316]/10 text-[#F97316]'
                    : 'border-[#23304A] bg-[#131B2E] text-[#94A3B8] hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Menu Items List matching Photo 3 */}
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center text-[#94A3B8]">
            <p className="text-sm font-semibold">No dishes found in this category</p>
            <p className="text-xs text-[#64748B] mt-1">Tap below to add a new dish to your menu</p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#131B2E] border border-[#23304A] rounded-[20px] p-4 shadow-sm"
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
                      <h4 className="text-[15px] font-bold text-white capitalize truncate leading-tight">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="font-extrabold text-[#F97316]">
                          ₹{item.price}
                        </span>
                        <span className="text-[#94A3B8] flex items-center gap-1 font-medium text-[11px]">
                          <Clock className="w-3 h-3 text-[#94A3B8]" />
                          {item.preparationTimeMinutes || 15}m prep
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Toggle Switch & In Stock Label */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      onClick={() => toggleItemAvailability(item.id, !item.isAvailable)}
                      className={`w-12 h-7 rounded-full p-1 transition-colors ${
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

                {/* Bottom Row Actions: Edit & Delete Icons */}
                <div className="flex items-center justify-end gap-3 mt-2.5 pt-2 border-t border-[#23304A]/40">
                  <button
                    onClick={() => onOpenAddItem(item)}
                    className="p-1.5 text-[#94A3B8] hover:text-white transition"
                    title="Edit dish"
                  >
                    <Pencil className="w-4 h-4 stroke-[2]" />
                  </button>
                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-1.5 text-rose-500 hover:text-rose-400 transition"
                    title="Delete dish"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Button "+ Add Dish / Item" matching Photo 3 */}
      <div className="fixed bottom-16 sm:bottom-6 left-0 right-0 max-w-md mx-auto px-4 z-20 pointer-events-none flex justify-center">
        <button
          onClick={() => onOpenAddItem()}
          className="pointer-events-auto bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm px-6 py-3.5 rounded-[18px] shadow-xl shadow-orange-950/40 flex items-center gap-2 transition active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add Dish / Item</span>
        </button>
      </div>

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
