import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { GatheringField, Dungeon, PouchCategory } from '../types/game';
import { ITEMS, POUCH_GEARS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  Backpack,
  Compass,
  Landmark,
  Zap,
  Plus,
  X,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Footprints,
  Layers,
  Wand2,
  Trash2,
  Briefcase,
  Cookie,
  HeartPulse,
  Bomb,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface DepartureConfirmModalProps {
  mode: 'gathering' | 'dungeon';
  field?: GatheringField;
  dungeon?: Dungeon;
  onConfirm: () => void;
  onClose: () => void;
}

const CATEGORY_CONFIG: Record<
  PouchCategory,
  {
    name: string;
    sub: string;
    icon: any;
    color: string;
    badgeBg: string;
    itemDesc: string;
  }
> = {
  potion: {
    name: 'ポーションベルト',
    sub: '液体ポーション類 (HP回復)',
    icon: HeartPulse,
    color: 'text-rose-600',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
    itemDesc: 'HPが低下した際に自動服用されます',
  },
  food: {
    name: '食糧ポシェット',
    sub: 'スタミナ回復食料品',
    icon: Cookie,
    color: 'text-amber-600',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
    itemDesc: '体力が低下した際に自動喫食されます',
  },
  consumable: {
    name: 'アイテムポーチ',
    sub: '爆弾・投擲具・解毒薬・護符',
    icon: Bomb,
    color: 'text-violet-600',
    badgeBg: 'bg-violet-50 border-violet-200 text-violet-800',
    itemDesc: '戦闘時に手動タップで投擲・使用できます',
  },
  gadget: {
    name: 'ガジェットポーチ',
    sub: '探索補助具 (非消耗品)',
    icon: Compass,
    color: 'text-cyan-600',
    badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    itemDesc: '所持しているだけで判定補正や特殊効果を発揮',
  },
};

export const DepartureConfirmModal: React.FC<DepartureConfirmModalProps> = ({
  mode,
  field,
  dungeon,
  onConfirm,
  onClose,
}) => {
  const {
    state,
    effectiveLeo,
    setPouchCategorySlot,
    autoFillPouchCategory,
    clearPouchCategory,
    equipPouchGear,
  } = useGame();

  const [activeCategory, setActiveCategory] = useState<PouchCategory>('potion');
  const [activeSlotIdx, setActiveSlotIdx] = useState<{
    category: PouchCategory;
    index: number;
  } | null>(null);

  const [showGearPicker, setShowGearPicker] = useState<boolean>(false);

  const currentGear =
    POUCH_GEARS[state.equippedPouch] || POUCH_GEARS['pouch_starter'];

  // Available items in inventory for the currently selected slot category
  const getAvailableItemsForCategory = (cat: PouchCategory) => {
    return Object.entries(state.inventory)
      .filter(([itemId, count]) => {
        if (count <= 0) return false;
        const item = ITEMS[itemId];
        if (!item) return false;
        if (cat === 'potion')
          return item.pouchCategory === 'potion' || item.type === 'potion';
        if (cat === 'food')
          return item.pouchCategory === 'food' || item.type === 'food';
        if (cat === 'consumable')
          return (
            item.pouchCategory === 'consumable' ||
            item.type === 'consumable' ||
            item.type === 'offensive'
          );
        if (cat === 'gadget')
          return item.pouchCategory === 'gadget' || item.type === 'gadget';
        return false;
      })
      .map(([itemId]) => ITEMS[itemId]);
  };

  const handleSelectSlotItem = (
    category: PouchCategory,
    index: number,
    itemId: string | null
  ) => {
    setPouchCategorySlot(category, index, itemId);
    setActiveSlotIdx(null);
  };

  const handleAutoFillAll = () => {
    sound.playTap();
    (['potion', 'food', 'consumable', 'gadget'] as PouchCategory[]).forEach(
      (cat) => {
        autoFillPouchCategory(cat);
      }
    );
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
  const isPouchEmpty = (['potion', 'food', 'consumable', 'gadget'] as PouchCategory[]).every(
    (cat) => (state.pouch[cat] || []).every((id) => !id)
  );

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
                行先と携帯ポーチのカテゴリ装備を確認
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

          {/* Equipped Pouch Gear Banner */}
          <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-amber-800" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-950 truncate">
                    {currentGear.name}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-200/70 text-amber-900">
                    装備中
                  </span>
                </div>
                <div className="text-[10px] text-amber-800/80 truncate">
                  薬{currentGear.capacity.potion} · 食{currentGear.capacity.food} · 品{currentGear.capacity.consumable} · 装{currentGear.capacity.gadget}
                </div>
              </div>
            </div>

            {state.ownedPouchGears.length > 1 && (
              <button
                onClick={() => setShowGearPicker(true)}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-[10px] font-black hover:bg-amber-100/60 active:scale-95 transition-all shrink-0"
              >
                ポーチ変更
              </button>
            )}
          </div>

          {/* Categorized Pouch Management */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Backpack className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-900">
                  冒険携帯ポーチ (4カテゴリ編成)
                </h4>
              </div>
              <button
                onClick={handleAutoFillAll}
                className="px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black flex items-center gap-1 active:scale-95 transition-all"
              >
                <Wand2 className="w-3 h-3" />
                <span>全自動補充</span>
              </button>
            </div>

            {/* Category Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl">
              {(['potion', 'food', 'consumable', 'gadget'] as PouchCategory[]).map(
                (cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const slots = state.pouch[cat] || [];
                  const filledCount = slots.filter(Boolean).length;
                  const maxCap = currentGear.capacity[cat] || slots.length;
                  const isActive = activeCategory === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        sound.playTap();
                        setActiveCategory(cat);
                      }}
                      className={`py-1.5 px-1 rounded-xl text-center transition-all ${
                        isActive
                          ? 'bg-white shadow-xs font-black text-slate-900'
                          : 'text-slate-500 font-bold hover:text-slate-700'
                      }`}
                    >
                      <div className="text-[10px] flex items-center justify-center gap-0.5">
                        <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                        <span>{cat === 'potion' ? '薬' : cat === 'food' ? '食' : cat === 'consumable' ? '品' : '装'}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {filledCount}/{maxCap}
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            {/* Active Category Header & Subtext */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span>{CATEGORY_CONFIG[activeCategory].name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold border ${CATEGORY_CONFIG[activeCategory].badgeBg}`}
                  >
                    最大 {currentGear.capacity[activeCategory]} 枠
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {CATEGORY_CONFIG[activeCategory].itemDesc}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => autoFillPouchCategory(activeCategory)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold active:scale-95 transition-all"
                  title="このカテゴリを所持品から自動補充"
                >
                  補充
                </button>
                <button
                  onClick={() => clearPouchCategory(activeCategory)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                  title="このカテゴリを全て外す"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Slots for current category */}
            <div className="grid grid-cols-4 gap-2">
              {(state.pouch[activeCategory] || []).map((itemId, idx) => {
                const item = itemId ? ITEMS[itemId] : null;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      sound.playTap();
                      setActiveSlotIdx({ category: activeCategory, index: idx });
                    }}
                    className={`p-2 rounded-2xl border text-center transition-all active:scale-95 flex flex-col items-center justify-center min-h-[64px] ${
                      item
                        ? 'bg-amber-50/80 border-amber-300 shadow-2xs hover:bg-amber-100/70'
                        : 'bg-slate-50 border-dashed border-slate-250 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {item ? (
                      <>
                        <ItemIcon
                          name={item.icon}
                          className="w-5 h-5 mb-1 shrink-0"
                        />
                        <span className="text-[10px] font-black text-amber-950 truncate w-full">
                          {item.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-slate-300 mb-0.5" />
                        <span className="text-[10px] text-slate-400 font-semibold">
                          #{idx + 1}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {isPouchEmpty && (
              <div className="text-[10px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  ポーチが全て空です。ポーションや食料品をセットすると安全に冒険できます。
                </span>
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
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm w-full text-slate-800 shadow-2xl border border-amber-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-slate-150">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Backpack className="w-4 h-4 text-emerald-600" />
                <span>
                  {CATEGORY_CONFIG[activeSlotIdx.category].name} #{activeSlotIdx.index + 1}
                </span>
              </h3>
              <button
                onClick={() => setActiveSlotIdx(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {state.pouch[activeSlotIdx.category]?.[activeSlotIdx.index] && (
                <button
                  onClick={() =>
                    handleSelectSlotItem(
                      activeSlotIdx.category,
                      activeSlotIdx.index,
                      null
                    )
                  }
                  className="w-full p-2.5 rounded-2xl border border-dashed border-slate-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                >
                  ポーチから外す (所持品へ戻す)
                </button>
              )}

              {getAvailableItemsForCategory(activeSlotIdx.category).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  所持品に対象アイテムがありません。<br />
                  工房で調合するか商店で購入できます。
                </div>
              ) : (
                getAvailableItemsForCategory(activeSlotIdx.category).map(
                  (item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        handleSelectSlotItem(
                          activeSlotIdx.category,
                          activeSlotIdx.index,
                          item.id
                        )
                      }
                      className="w-full p-3 rounded-2xl border border-slate-200 hover:bg-amber-50/50 hover:border-amber-300 text-left transition-all active:scale-98 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ItemIcon
                          name={item.icon}
                          className="w-6 h-6 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            {item.name}{' '}
                            <span className="font-mono text-amber-700 font-bold ml-1">
                              (所持: {state.inventory[item.id]})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    </button>
                  )
                )
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

      {/* Pouch Gear Switcher Modal */}
      {showGearPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm w-full text-slate-800 shadow-2xl border border-amber-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-slate-150">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>ポーチ装備の変更</span>
              </h3>
              <button
                onClick={() => setShowGearPicker(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-3">
              ※ポーチを変更すると、現在ポーチに入っているアイテムは全て所持品へ戻されます。
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {state.ownedPouchGears.map((gearId) => {
                const gear = POUCH_GEARS[gearId];
                if (!gear) return null;
                const isEquipped = state.equippedPouch === gearId;

                return (
                  <button
                    key={gearId}
                    disabled={isEquipped}
                    onClick={() => {
                      equipPouchGear(gearId);
                      setShowGearPicker(false);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isEquipped
                        ? 'bg-amber-100/70 border-amber-400 text-amber-950 font-black ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 active:scale-98'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>{gear.name}</span>
                        {isEquipped && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-900 font-bold">
                            装備中
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {gear.description}
                      </div>
                      <div className="text-[10px] text-amber-700 font-mono font-bold mt-1">
                        薬{gear.capacity.potion} · 食{gear.capacity.food} · 品{gear.capacity.consumable} · 装{gear.capacity.gadget}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowGearPicker(false)}
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
