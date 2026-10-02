import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Item } from '../types/game';
import { ITEMS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  Coins,
  X,
  Sparkles,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface ShopSellModalProps {
  onClose: () => void;
}

export const ShopSellModal: React.FC<ShopSellModalProps> = ({ onClose }) => {
  const { state, effectiveLeo, sellItem } = useGame();
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'valuable' | 'material' | 'potion' | 'equipment'
  >('all');

  // Social bargaining bonus rate: up to 20% extra gold
  const bonusRate = Math.min(0.2, Math.max(0, (effectiveLeo.social - 8) * 0.015));
  const bonusPercent = Math.round(bonusRate * 100);

  const getItemSellPrice = (basePrice: number): number => {
    return Math.max(1, Math.round(basePrice * (1 + bonusRate)));
  };

  const inventoryItems = Object.entries(state.inventory)
    .filter(([_, count]) => count > 0)
    .map(([itemId, count]) => ({
      item: ITEMS[itemId],
      count,
    }))
    .filter((entry) => Boolean(entry.item));

  const filteredItems = inventoryItems.filter(({ item }) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'potion') {
      return item.type === 'potion' || item.type === 'food';
    }
    return item.type === categoryFilter;
  });

  // Valuable items for bulk selling
  const valuableItems = inventoryItems.filter(
    (entry) => entry.item.type === 'valuable'
  );

  const totalValuablesGold = valuableItems.reduce(
    (acc, entry) => acc + getItemSellPrice(entry.item.sellPrice) * entry.count,
    0
  );

  const handleClose = () => {
    sound.playTap();
    onClose();
  };

  const handleBulkSellValuables = () => {
    sound.playCoin();
    valuableItems.forEach((entry) => {
      sellItem(entry.item.id, entry.count);
    });
  };

  const handleSell = (item: Item, count: number = 1) => {
    const success = sellItem(item.id, count);
    if (success) {
      sound.playCoin();
    } else {
      sound.playFail();
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-12 p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full text-slate-800 shadow-2xl border border-emerald-200 h-[82vh] max-h-[660px] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-150 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">アイテム売却</h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                採集素材や換金用財宝を高価買い取り
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Gold balance badge */}
            <div className="bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-mono tabular-nums text-xs font-black text-amber-900">
                {state.gold.toLocaleString()} G
              </span>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
              title="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Social Bargaining Bonus Banner */}
        {bonusPercent > 0 && (
          <div className="mt-2.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 rounded-xl border border-emerald-200 flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>社交値による買取査定ボーナス適用中！</span>
            </div>
            <span className="text-emerald-800 font-black font-mono">
              全品 +{bonusPercent}% UP
            </span>
          </div>
        )}

        {/* Bulk Sell Valuables Banner (if any) */}
        {valuableItems.length > 0 && (
          <div className="mt-2 bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/15 p-3 rounded-2xl border border-amber-300 flex items-center justify-between gap-2 shrink-0 shadow-2xs">
            <div className="min-w-0">
              <div className="text-xs font-black text-amber-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">換金用インゴット・財宝があります！</span>
              </div>
              <div className="text-[11px] text-amber-900 mt-0.5">
                合計換金額:{' '}
                <strong className="font-mono font-bold">
                  {totalValuablesGold.toLocaleString()} G
                </strong>
                {bonusPercent > 0 && (
                  <span className="text-[9px] text-emerald-700 font-bold ml-1">
                    (ボーナス込)
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleBulkSellValuables}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs active:scale-95 transition-all shrink-0"
            >
              一括換金
            </button>
          </div>
        )}

        {/* Filter Categories */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs my-2.5 shrink-0 overflow-x-auto">
          {(
            [
              { key: 'all', label: 'すべて' },
              { key: 'valuable', label: '換金財宝' },
              { key: 'material', label: '素材' },
              { key: 'potion', label: '薬品・食料' },
              { key: 'equipment', label: '装備' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                sound.playTap();
                setCategoryFilter(key);
              }}
              className={`flex-1 py-1.5 px-1 rounded-lg font-bold transition-all text-center whitespace-nowrap ${
                categoryFilter === key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Inventory Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              売却できる所持品がありません。
            </div>
          ) : (
            filteredItems.map(({ item, count }) => {
              const basePrice = item.sellPrice || 0;
              const effectivePrice = getItemSellPrice(basePrice);
              const totalGain = effectivePrice * count;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                    item.type === 'valuable'
                      ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300/40 shadow-xs'
                      : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <ItemIcon name={item.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-slate-900">{item.name}</span>
                        <span className="text-[10px] text-slate-600 font-bold bg-white px-1.5 py-0.2 rounded-md border border-slate-200">
                          所持: {count}
                        </span>
                        {item.type === 'valuable' && (
                          <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded border border-amber-200">
                            換金専用
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-600 mt-0.5 leading-snug break-words">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-1 mt-1 text-xs font-mono font-black text-emerald-800">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>単価 {effectivePrice.toLocaleString()} G</span>
                        {bonusPercent > 0 && (
                          <span className="text-[9px] text-emerald-600 font-bold ml-1">
                            (+{bonusPercent}% UP)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sell Buttons (1x and All) */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleSell(item, 1)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs active:scale-95 transition-all"
                    >
                      1個売却
                    </button>

                    {count > 1 && (
                      <button
                        onClick={() => handleSell(item, count)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[10px] border border-emerald-300 active:scale-95 transition-all"
                        title={`全${count}個を売却 (${totalGain.toLocaleString()} G)`}
                      >
                        すべて売却
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
