import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Item } from '../types/game';
import { ITEMS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import { ShoppingBag, Coins, X, Check, Shield, Sparkles, Filter } from 'lucide-react';
import { sound } from '../utils/sound';

interface ShopBuyModalProps {
  onClose: () => void;
}

export const ShopBuyModal: React.FC<ShopBuyModalProps> = ({ onClose }) => {
  const { state, buyItem } = useGame();
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'equipment' | 'potion' | 'material'>('all');
  const [purchasedItemId, setPurchasedItemId] = useState<string | null>(null);

  const buyableItems = Object.values(ITEMS).filter((item) => typeof item.buyPrice === 'number');

  const filteredBuyables = buyableItems.filter((item) =>
    categoryFilter === 'all' ? true : item.type === categoryFilter
  );

  const handleClose = () => {
    sound.playTap();
    onClose();
  };

  const handleBuy = (item: Item, count: number = 1) => {
    const success = buyItem(item.id, count);
    if (success) {
      sound.playCoin();
      setPurchasedItemId(item.id);
      setTimeout(() => setPurchasedItemId(null), 1000);
    } else {
      sound.playFail();
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-12 p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full text-slate-800 shadow-2xl border border-amber-200 h-[80vh] max-h-[640px] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-150 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">アイテム購入</h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                冒険の必需品や装備を調達できます
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

        {/* Filter Categories */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs my-3 shrink-0">
          {(
            [
              { key: 'all', label: 'すべて' },
              { key: 'equipment', label: '装備品' },
              { key: 'potion', label: '薬品' },
              { key: 'material', label: '素材' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                sound.playTap();
                setCategoryFilter(key);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                categoryFilter === key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Items Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
          {filteredBuyables.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              該当するアイテムがありません。
            </div>
          ) : (
            filteredBuyables.map((item) => {
              const buyPrice = item.buyPrice || 0;
              const canAfford = state.gold >= buyPrice;
              const ownedCount = state.inventory[item.id] || 0;
              const isJustPurchased = purchasedItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                    isJustPurchased
                      ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-300'
                      : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <ItemIcon name={item.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                        {ownedCount > 0 && (
                          <span className="text-[10px] text-slate-500 font-semibold bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
                            所持: {ownedCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      disabled={!canAfford}
                      onClick={() => handleBuy(item, 1)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isJustPurchased ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>購入済</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5 text-amber-200" />
                          <span className="font-mono tabular-nums">{buyPrice} G</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="mt-3 pt-2 border-t border-slate-150 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>購入したアイテムはインベントリに即時反映されます</span>
          <button
            onClick={handleClose}
            className="text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
