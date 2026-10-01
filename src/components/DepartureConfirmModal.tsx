import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { GatheringField, Dungeon } from '../types/game';
import { ITEMS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  Backpack,
  Compass,
  Landmark,
  Heart,
  Zap,
  Swords,
  Shield,
  Plus,
  X,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Footprints,
  Layers,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface DepartureConfirmModalProps {
  mode: 'gathering' | 'dungeon';
  field?: GatheringField;
  dungeon?: Dungeon;
  onConfirm: () => void;
  onClose: () => void;
}

export const DepartureConfirmModal: React.FC<DepartureConfirmModalProps> = ({
  mode,
  field,
  dungeon,
  onConfirm,
  onClose,
}) => {
  const { state, effectiveLeo, setPouchSlot } = useGame();
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);

  // Available consumable/potion/throwable items from inventory
  const availableItems = Object.entries(state.inventory)
    .filter(([itemId, count]) => {
      const item = ITEMS[itemId];
      return (
        item &&
        (item.type === 'potion' || item.type === 'offensive') &&
        count > 0
      );
    })
    .map(([itemId]) => ITEMS[itemId]);

  const handleSelectPouchItem = (slotIdx: number, itemId: string | null) => {
    setPouchSlot(slotIdx, itemId);
    setActiveSlotIdx(null);
  };

  const handleStart = () => {
    sound.playTap();
    onConfirm();
  };

  const handleCancel = () => {
    sound.playTap();
    onClose();
  };

  const destinationName = mode === 'gathering' ? field?.name : dungeon?.name;
  const isPouchEmpty = state.pouch.every((id) => !id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3">
      <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full text-slate-800 shadow-2xl border border-amber-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-150 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                mode === 'gathering'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}
            >
              {mode === 'gathering' ? (
                <Compass className="w-5 h-5" />
              ) : (
                <Landmark className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">冒険出撃の準備確認</h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                行先と携帯ポーチのアイテムを確認してください
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-0.5">
          {/* Destination Banner */}
          <div
            className={`p-3.5 rounded-2xl border ${
              mode === 'gathering'
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black">{destinationName}</span>
                  {mode === 'dungeon' && dungeon && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200/60">
                      ダンジョンLv.{dungeon.recommendedLevel}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                  {mode === 'gathering' ? field?.description : dungeon?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
              {mode === 'gathering' && field && (
                <>
                  <span className="flex items-center gap-1 font-semibold">
                    <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                    全 {field.totalSteps} 歩
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    歩行消費 {field.staminaCostPerStep} / 歩
                  </span>
                </>
              )}
              {mode === 'dungeon' && dungeon && (
                <>
                  <span className="flex items-center gap-1 font-semibold">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    全 {dungeon.floorsCount} 階層
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    歩行消費 2 / 歩
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Leo Status Overview */}
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                出撃者: レオ
              </span>
              <span className="text-[10px] text-slate-500">万全の状態で出撃</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono font-bold">
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[9px] text-rose-500 font-sans">最大HP</div>
                <div className="text-slate-900">{effectiveLeo.maxHp}</div>
              </div>
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[9px] text-amber-500 font-sans">最大体力</div>
                <div className="text-slate-900">{effectiveLeo.maxStamina}</div>
              </div>
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[9px] text-red-500 font-sans">攻撃力</div>
                <div className="text-slate-900">{effectiveLeo.atk}</div>
              </div>
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[9px] text-blue-500 font-sans">防御力</div>
                <div className="text-slate-900">{effectiveLeo.def}</div>
              </div>
            </div>
          </div>

          {/* Adventure Pouch Management */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Backpack className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-900">冒険携帯ポーチ (4枠)</h4>
              </div>
              <span className="text-[10px] text-slate-500">タップしてアイテム変更</span>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              冒険中、HPが40%以下または体力が40%以下になると<strong>自動で服用</strong>されます（手動タップ使用も可）。
            </p>

            <div className="grid grid-cols-4 gap-2">
              {state.pouch.map((itemId, idx) => {
                const item = itemId ? ITEMS[itemId] : null;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      sound.playTap();
                      setActiveSlotIdx(idx);
                    }}
                    className={`p-2 rounded-2xl border text-center transition-all active:scale-95 flex flex-col items-center justify-center min-h-[64px] ${
                      item
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs hover:bg-emerald-50'
                        : 'bg-slate-50 border-dashed border-slate-250 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {item ? (
                      <>
                        <ItemIcon name={item.icon} className="w-5 h-5 mb-1 shrink-0" />
                        <span className="text-[10px] font-black text-emerald-950 truncate w-full">
                          {item.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-slate-300 mb-0.5" />
                        <span className="text-[10px] text-slate-400 font-semibold">セット</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {isPouchEmpty && (
              <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>ポーチが空です。回復薬やスタミナ薬をセットすると安全に冒険できます。</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-150 shrink-0 space-y-2">
          <button
            onClick={handleStart}
            className={`w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 ${
              mode === 'gathering'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-600/25'
            }`}
          >
            <span>出撃開始 (1日経過)</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleCancel}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            戻る
          </button>
        </div>
      </div>

      {/* Item Selection Drawer */}
      {activeSlotIdx !== null && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm w-full text-slate-800 shadow-2xl border border-emerald-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-slate-150">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Backpack className="w-4 h-4 text-emerald-600" />
                ポーチスロット #{activeSlotIdx + 1} の選択
              </h3>
              <button
                onClick={() => setActiveSlotIdx(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {state.pouch[activeSlotIdx] && (
                <button
                  onClick={() => handleSelectPouchItem(activeSlotIdx, null)}
                  className="w-full p-2.5 rounded-2xl border border-dashed border-slate-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                >
                  ポーチから外す (所持品へ戻す)
                </button>
              )}

              {availableItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  所持品にポーションやスタミナ薬がありません。<br />
                  工房で調合するか商店で購入できます。
                </div>
              ) : (
                availableItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPouchItem(activeSlotIdx, item.id)}
                    className="w-full p-3 rounded-2xl border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-300 text-left transition-all active:scale-98 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ItemIcon name={item.icon} className="w-6 h-6 shrink-0" />
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          {item.name}{' '}
                          <span className="font-mono text-emerald-700 font-bold ml-1">
                            (所持: {state.inventory[item.id]})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => setActiveSlotIdx(null)}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
