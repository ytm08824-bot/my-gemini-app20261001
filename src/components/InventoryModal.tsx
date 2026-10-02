import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ItemType, Item } from '../types/game';
import { ITEMS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  Package,
  X,
  Swords,
  HeartPulse,
  Leaf,
  Coins,
  Sparkles,
  Info,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface InventoryModalProps {
  onClose: () => void;
}

type FilterCategory = 'all' | 'equipment' | 'potion' | 'food' | 'consumable' | 'gadget' | 'material' | 'valuable';

export const InventoryModal: React.FC<InventoryModalProps> = ({ onClose }) => {
  const { state } = useGame();
  const [filter, setFilter] = useState<FilterCategory>('all');

  const handleClose = () => {
    sound.playTap();
    onClose();
  };

  // Build inventory list with item details
  const inventoryList = Object.entries(state.inventory)
    .filter(([_, count]) => count > 0)
    .map(([itemId, count]) => {
      const item = ITEMS[itemId];
      return {
        item,
        count,
      };
    })
    .filter((entry): entry is { item: Item; count: number } => Boolean(entry.item));

  // Category counts
  const countAll = inventoryList.reduce((acc, curr) => acc + curr.count, 0);
  const countEquipment = inventoryList
    .filter((e) => e.item.type === 'equipment')
    .reduce((acc, curr) => acc + curr.count, 0);
  const countPotion = inventoryList
    .filter((e) => e.item.type === 'potion')
    .reduce((acc, curr) => acc + curr.count, 0);
  const countFood = inventoryList
    .filter((e) => e.item.type === 'food')
    .reduce((acc, curr) => acc + curr.count, 0);
  const countConsumable = inventoryList
    .filter((e) => e.item.type === 'consumable' || e.item.type === 'offensive')
    .reduce((acc, curr) => acc + curr.count, 0);
  const countGadget = inventoryList
    .filter((e) => e.item.type === 'gadget')
    .reduce((acc, curr) => acc + curr.count, 0);
  const countMaterial = inventoryList
    .filter((e) => e.item.type === 'material')
    .reduce((acc, curr) => acc + curr.count, 0);
  const countValuable = inventoryList
    .filter((e) => e.item.type === 'valuable')
    .reduce((acc, curr) => acc + curr.count, 0);

  // Filtered items
  const filteredItems = inventoryList.filter(({ item }) => {
    if (filter === 'all') return true;
    if (filter === 'equipment') return item.type === 'equipment';
    if (filter === 'potion') return item.type === 'potion';
    if (filter === 'food') return item.type === 'food';
    if (filter === 'consumable') return item.type === 'consumable' || item.type === 'offensive';
    if (filter === 'gadget') return item.type === 'gadget';
    if (filter === 'material') return item.type === 'material';
    if (filter === 'valuable') return item.type === 'valuable';
    return true;
  });

  const categories: { key: FilterCategory; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all', label: 'すべて', icon: <Package className="w-3.5 h-3.5" />, count: countAll },
    { key: 'potion', label: '薬', icon: <HeartPulse className="w-3.5 h-3.5" />, count: countPotion },
    { key: 'food', label: '食糧', icon: <Package className="w-3.5 h-3.5" />, count: countFood },
    { key: 'consumable', label: 'アイテム', icon: <Sparkles className="w-3.5 h-3.5" />, count: countConsumable },
    { key: 'gadget', label: 'ガジェット', icon: <Sparkles className="w-3.5 h-3.5" />, count: countGadget },
    { key: 'equipment', label: '装備', icon: <Swords className="w-3.5 h-3.5" />, count: countEquipment },
    { key: 'material', label: '素材', icon: <Leaf className="w-3.5 h-3.5" />, count: countMaterial },
    { key: 'valuable', label: '換金', icon: <Coins className="w-3.5 h-3.5" />, count: countValuable },
  ];

  const getRarityBadge = (rarity: number) => {
    switch (rarity) {
      case 4:
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 3:
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 2:
        return 'bg-sky-100 text-sky-700 border-sky-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getCategoryLabel = (type: ItemType) => {
    switch (type) {
      case 'equipment':
        return '装備品';
      case 'potion':
        return 'ポーション';
      case 'food':
        return '食料品';
      case 'consumable':
      case 'offensive':
        return '冒険アイテム';
      case 'gadget':
        return 'ガジェット';
      case 'material':
        return '素材';
      case 'valuable':
        return '換金財宝';
      default:
        return 'アイテム';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3">
      <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full text-slate-800 shadow-2xl border border-amber-200 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-slate-150">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">所持品一覧</h3>
              <span className="text-[10px] text-slate-500 font-semibold">
                合計 {countAll} 個の所持品
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filters Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0 scrollbar-none text-xs">
          {categories.map((cat) => {
            const isActive = filter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  sound.playTap();
                  setFilter(cat.key);
                }}
                className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs scale-102'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded-md ${
                    isActive ? 'bg-purple-700 text-purple-100' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Item Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              このジャンルの所持品はありません
            </div>
          ) : (
            filteredItems.map(({ item, count }) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-slate-150 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2.5"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <ItemIcon name={item.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{item.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${getRarityBadge(
                          item.rarity
                        )}`}
                      >
                        {'★'.repeat(item.rarity)}
                      </span>
                      <span className="text-[9px] font-bold bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded-md">
                        {getCategoryLabel(item.type)}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-tight mt-1">
                      {item.description}
                    </p>

                    {/* Stats & Effects preview */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px]">
                      {item.effectValue && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          {item.type === 'potion' ? `効果値: +${item.effectValue}` : `威力: ${item.effectValue}`}
                        </span>
                      )}

                      {item.equipStats && (
                        <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                          {Object.entries(item.equipStats)
                            .map(([k, v]) => `${k.toUpperCase()} +${v}`)
                            .join(', ')}
                        </span>
                      )}

                      <span className="text-amber-800 font-mono font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        売値: {item.sellPrice}G
                      </span>
                    </div>
                  </div>
                </div>

                {/* Count badge */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-black font-mono tabular-nums text-slate-900 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs block">
                    x{count}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-150 shrink-0 text-center">
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md active:scale-98 transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
