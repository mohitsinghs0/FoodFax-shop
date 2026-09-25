import React, { useState, useMemo, useCallback } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { MenuItem, MenuCategory } from '../types';
import { MemoizedMenuItemCard } from '../components/MemoizedMenuItemCard';
import { 
  Plus, 
  Search, 
  X, 
  UtensilsCrossed, 
  FolderPlus,
  Trash2,
  Layers,
  AlertTriangle
} from 'lucide-react';

interface MenuScreenProps {
  onOpenAddItem: (itemToEdit?: MenuItem) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onOpenAddItem }) => {
  const { menuItems, menuCategories, toggleItemAvailability, deleteMenuItem, addCategory, deleteCategory, isOffline } = useOwnerApp();
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showManageCatModal, setShowManageCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<MenuCategory | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Memoized category counts for pill badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: menuItems.length };
    menuItems.forEach((item) => {
      if (item.categoryId) {
        counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [menuItems]);

  // Memoized filtered dish items
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

  // Memoized callbacks passed to item cards
  const handleToggleAvailability = useCallback((id: string, isAvailable: boolean) => {
    toggleItemAvailability(id, isAvailable);
  }, [toggleItemAvailability]);

  // Trigger in-app custom modal instead of blocked window.confirm
  const handleDeleteDish = useCallback((id: string) => {
    const item = menuItems.find((i) => i.id === id);
    if (item) {
      setItemToDelete(item);
    }
  }, [menuItems]);

  const handleConfirmDeleteDish = async () => {
    if (itemToDelete) {
      const id = itemToDelete.id;
      const itemName = itemToDelete.name;
      setItemToDelete(null);
      await deleteMenuItem(id);
      setToastMessage(`"${itemName}" deleted from menu & IndexedDB cache`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (categoryToDelete) {
      const id = categoryToDelete.id;
      const catName = categoryToDelete.name;
      setCategoryToDelete(null);
      if (selectedCatId === id) {
        setSelectedCatId('all');
      }
      await deleteCategory(id);
      setToastMessage(`Category "${catName}" deleted successfully`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleEditDish = useCallback((item: MenuItem) => {
    onOpenAddItem(item);
  }, [onOpenAddItem]);

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      const name = newCatName.trim();
      await addCategory(name);
      setNewCatName('');
      setShowAddCatModal(false);
      setToastMessage(`Category "${name}" created`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-24 p-4 max-w-4xl mx-auto">
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Menu &amp; Kitchen Inventory</h2>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
            <span>{menuItems.length} dishes across {menuCategories.length} categories</span>
            <span>&bull;</span>
            <span className="text-emerald-400 font-semibold">IndexedDB Offline Ready</span>
            {isOffline && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                Offline
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => onOpenAddItem()}
          className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dish / Item</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dishes by name or description..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCatId('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            selectedCatId === 'all'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All ({categoryCounts['all'] || 0})
        </button>

        {menuCategories.map((cat) => {
          const isSelected = selectedCatId === cat.id;
          const count = categoryCounts[cat.id] || 0;
          return (
            <div key={cat.id} className="relative group flex items-center shrink-0">
              <button
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-950 pr-2'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{cat.name}</span>
                <span className="opacity-75 text-[10px]">({count})</span>
              </button>
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoryToDelete(cat);
                  }}
                  className="ml-1 p-1 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition"
                  title={`Delete category "${cat.name}"`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => setShowAddCatModal(true)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 flex items-center gap-1 whitespace-nowrap transition shrink-0"
          title="Create a new category"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>+ Category</span>
        </button>

        <button
          onClick={() => setShowManageCatModal(true)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 whitespace-nowrap transition shrink-0"
          title="Manage and delete categories"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Manage</span>
        </button>
      </div>

      {/* Menu Items List Rendered via MemoizedMenuItemCard */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <UtensilsCrossed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-300">No dishes found</h4>
          <p className="text-xs text-slate-500 mt-1">Tap &apos;Add Dish / Item&apos; to create a new entry</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <MemoizedMenuItemCard
              key={item.id}
              item={item}
              onEdit={handleEditDish}
              onDelete={handleDeleteDish}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCategorySubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Menu Category</h3>
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category Title</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Tandoori Platters, Beverages"
                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none"
                autoFocus
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-950"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Categories Modal (View & Delete Categories) */}
      {showManageCatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Manage Menu Categories</h3>
                <p className="text-xs text-slate-400">View or delete categories from your store</p>
              </div>
              <button
                onClick={() => setShowManageCatModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {menuCategories.map((c) => {
                const count = categoryCounts[c.id] || 0;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{c.name}</h4>
                      <span className="text-[11px] text-slate-400">
                        {count} dish{count !== 1 ? 'es' : ''} assigned
                      </span>
                    </div>
                    <button
                      onClick={() => setCategoryToDelete(c)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                      title={`Delete category "${c.name}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowManageCatModal(false);
                  setShowAddCatModal(true);
                }}
                className="text-xs font-bold text-orange-400 hover:text-orange-300"
              >
                + Add New Category
              </button>
              <button
                onClick={() => setShowManageCatModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom In-App Modal for Deleting Dish Items (Replaces blocked window.confirm) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Dish?</h3>
                <p className="text-[11px] text-slate-400">Permanent removal from menu</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">"{itemToDelete.name}"</strong> (₹{itemToDelete.price})? It will be deleted from customer view and store records.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteDish}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-950 transition"
              >
                Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom In-App Modal for Deleting Categories */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Category?</h3>
                <p className="text-[11px] text-slate-400">"{categoryToDelete.name}"</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Dishes currently in this category will not be deleted, but will become <strong className="text-white">Uncategorized</strong>.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Keep Category
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-950 transition"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
