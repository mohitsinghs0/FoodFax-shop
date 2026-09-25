import React, { memo } from 'react';
import { MenuItem } from '../types';
import { Edit2, Trash2, Clock, Sparkles } from 'lucide-react';

interface MemoizedMenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
}

const areMenuItemPropsEqual = (
  prevProps: MemoizedMenuItemCardProps,
  nextProps: MemoizedMenuItemCardProps
): boolean => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.isAvailable === nextProps.item.isAvailable &&
    prevProps.item.isVeg === nextProps.item.isVeg &&
    prevProps.item.tag === nextProps.item.tag &&
    prevProps.item.preparationTimeMinutes === nextProps.item.preparationTimeMinutes &&
    prevProps.item.imageUrl === nextProps.item.imageUrl &&
    prevProps.item.description === nextProps.item.description
  );
};

export const MemoizedMenuItemCard = memo<MemoizedMenuItemCardProps>(
  ({ item, onEdit, onDelete, onToggleAvailability }) => {
    return (
      <div
        className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
          item.isAvailable
            ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
            : 'bg-slate-900/50 border-slate-800/60 opacity-60'
        }`}
      >
        {/* Left Info: Veg icon, Name, Tag, Description, Price */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm text-[8px] font-black border ${
                item.isVeg
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-red-500 text-red-400'
              }`}
            >
              ●
            </span>
            <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
            {item.tag && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                {item.tag}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-xs text-slate-400 line-clamp-1 mb-1.5">{item.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs">
            <span className="font-extrabold text-orange-400 text-sm">₹{item.price}</span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {item.preparationTimeMinutes} min
            </span>
          </div>
        </div>

        {/* Right Controls: Availability switch, Edit, Delete */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Availability Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              role="switch"
              aria-checked={item.isAvailable}
              onClick={() => onToggleAvailability(item.id, !item.isAvailable)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                item.isAvailable ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  item.isAvailable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              {item.isAvailable ? 'In Stock' : 'Sold Out'}
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => onEdit(item)}
              title="Edit dish"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              title="Delete dish"
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  },
  areMenuItemPropsEqual
);

MemoizedMenuItemCard.displayName = 'MemoizedMenuItemCard';
