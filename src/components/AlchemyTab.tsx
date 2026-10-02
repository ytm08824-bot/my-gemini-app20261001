import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Recipe, Item, StatKey } from '../types/game';
import { ITEMS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  FlaskConical,
  Flame,
  BookOpen,
  Sparkles,
  CheckCircle,
  Clock,
  Plus,
  X,
  AlertCircle,
  Shield,
  Heart,
  Zap,
  Coins,
  Swords,
} from 'lucide-react';
import { sound } from '../utils/sound';

export const AlchemyTab: React.FC = () => {
  const {
    state,
    researchRecipe,
    assignAlchemySlot,
    collectAlchemySlot,
    cancelAlchemySlot,
  } = useGame();

  const slotBoostLevel = state.facilities.find((f) => f.id === 'slot_boost')?.level || 1;
  const getCraftCount = (recipe: Recipe) => recipe.resultCount * slotBoostLevel;

  const [activeSlotModal, setActiveSlotModal] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<
    'all' | 'recovery' | 'battle' | 'valuable' | 'equipment'
  >('all');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Handle slot assign
  const handleAssign = (slotIndex: number, recipeId: string) => {
    const success = assignAlchemySlot(slotIndex, recipeId);
    if (success) {
      setActiveSlotModal(null);
      setNoticeMessage(null);
    } else {
      sound.playFail();
    }
  };

  const handleQuickAssign = (recipeId: string) => {
    const emptySlot = state.alchemySlots.find((s) => s.status === 'empty');
    if (emptySlot) {
      sound.playTap();
      handleAssign(emptySlot.slotIndex, recipeId);
    } else {
      sound.playFail();
      setNoticeMessage('調合スロットが満杯です。冒険に出撃して完成させるか、アトリエ強化でスロットを拡張してください。');
      setTimeout(() => setNoticeMessage(null), 4000);
    }
  };

  const handleResearch = (recipeId: string) => {
    const success = researchRecipe(recipeId);
    if (!success) {
      sound.playFail();
    }
  };

  const researchedRecipes = state.recipes.filter((r) => r.isResearched);
  const unresearchedRecipes = state.recipes.filter((r) => !r.isResearched && r.isDiscovered);
  const undiscoveredCount = state.recipes.filter((r) => !r.isResearched && !r.isDiscovered).length;

  const filteredResearched = researchedRecipes.filter((r) =>
    filterCategory === 'all' ? true : r.category === filterCategory
  );

  const hasEmptySlot = state.alchemySlots.some((s) => s.status === 'empty');

  // Render item effect / performance badge
  const renderItemEffectBadge = (item: Item) => {
    if (item.id === 'stamina_tonic') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
          <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
          効果: 体力 +{item.effectValue || 15} 回復
        </span>
      );
    }
    if (item.id === 'elixir_vital') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-teal-600" />
          効果: HP +60 & 体力 +20 回復
        </span>
      );
    }
    if (item.type === 'potion') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
          <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
          効果: HP +{item.effectValue || 35} 回復
        </span>
      );
    }
    if (item.type === 'offensive') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 shrink-0">
          <Swords className="w-2.5 h-2.5 text-orange-600" />
          性能: 敵単体に {item.effectValue || 18} ダメージ
        </span>
      );
    }
    if (item.type === 'equipment' && item.equipStats) {
      const statLabels: Record<string, string> = {
        atk: 'ATK',
        def: 'DEF',
        hp: 'HP',
        maxStamina: '体力',
        observation: '観察力',
        endurance: '頑健',
        dexterity: '身体技巧',
        mobility: '身体操作',
        knowledge: '知識',
        social: '社交',
      };
      const statsText = Object.entries(item.equipStats)
        .map(([k, v]) => `${statLabels[k] || k}+${v}`)
        .join(' ');
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
          <Shield className="w-2.5 h-2.5 text-indigo-600" />
          性能: {statsText}
        </span>
      );
    }
    if (item.type === 'valuable') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
          <Coins className="w-2.5 h-2.5 text-amber-600" />
          換金用: 売却 {item.sellPrice} G
        </span>
      );
    }
    return null;
  };

  return (
    <div className="pb-24 pt-1.5 px-3 max-w-lg mx-auto space-y-3">
      {/* Primula's Atelier Header (Slim & Compact) */}
      <section className="bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-blue-500/10 rounded-2xl p-2.5 sm:p-3 border border-sky-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-sky-400 bg-sky-100 shadow-2xs">
            <img
              src="/src/assets/images/character_primula_portrait_1790577820699.jpg"
              alt="プリムラ"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-black text-sky-950 truncate">プリムラの錬金工房</h2>
              <span className="text-[9px] font-bold bg-sky-200 text-sky-900 px-1.5 py-0.2 rounded-full shrink-0">
                見習い錬金術師
              </span>
            </div>
            <p className="text-[10px] text-slate-600 truncate mt-0.5">
              レシピを仕込んで冒険に出ると、1日経過後に完成します（所要: 1日）。
            </p>
          </div>
        </div>
      </section>

      {/* Cauldron Slots (Compact Compressed Panel) */}
      <section className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-sky-500" />
            <h3 className="text-xs font-black text-slate-800">調合スロット</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
            全 {state.alchemySlots.length} 枠 (1枠 {slotBoostLevel}個)
          </span>
        </div>

        {noticeMessage && (
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Compact 2-column or Multi-slot Grid */}
        <div className="grid grid-cols-2 gap-2">
          {state.alchemySlots.map((slot) => {
            const recipe = slot.recipeId
              ? state.recipes.find((r) => r.id === slot.recipeId)
              : null;
            const resultItem = recipe ? ITEMS[recipe.resultItemId] : null;

            if (slot.status === 'completed' && resultItem) {
              return (
                <div
                  key={slot.slotIndex}
                  className="p-2 rounded-xl bg-amber-50/90 border border-amber-300 ring-2 ring-amber-300/40 shadow-2xs flex flex-col justify-between min-h-[74px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ItemIcon name={resultItem.icon} className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-black text-slate-900 truncate">
                      {resultItem.name} x{recipe ? getCraftCount(recipe) : 1}
                    </span>
                  </div>
                  <button
                    onClick={() => collectAlchemySlot(slot.slotIndex)}
                    className="w-full py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-[10px] shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>完成！受取 (+RP)</span>
                  </button>
                </div>
              );
            }

            if (slot.status === 'crafting' && resultItem) {
              return (
                <div
                  key={slot.slotIndex}
                  className="p-2 rounded-xl bg-sky-50/80 border border-sky-300 flex flex-col justify-between min-h-[74px]"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ItemIcon name={resultItem.icon} className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-800 truncate">
                        {resultItem.name} x{recipe ? getCraftCount(recipe) : 1}
                      </span>
                    </div>
                    <button
                      onClick={() => cancelAlchemySlot(slot.slotIndex)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 shrink-0"
                      title="仕込み中止 (材料返還)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded">
                    <Clock className="w-2.5 h-2.5 text-sky-600" />
                    <span>冒険に出撃後に完成</span>
                  </div>
                </div>
              );
            }

            // Empty Slot
            return (
              <button
                key={slot.slotIndex}
                onClick={() => {
                  sound.playTap();
                  setActiveSlotModal(slot.slotIndex);
                }}
                className="p-2 rounded-xl border border-dashed border-sky-300 hover:border-sky-400 bg-sky-50/30 hover:bg-sky-50/70 flex flex-col items-center justify-center min-h-[74px] active:scale-95 transition-all group"
              >
                <div className="flex items-center gap-1 text-sky-700 group-hover:scale-105 transition-transform">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">スロット #{slot.slotIndex + 1}</span>
                </div>
                <span className="text-[9px] text-sky-600/80 font-medium mt-0.5">
                  レシピを仕込む
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Researched Recipes Section (修得済みレシピの仕込み) */}
      <section className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-black text-slate-800">習得済みレシピ</h3>
          </div>
          {/* Category filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
            {(['all', 'recovery', 'battle', 'valuable', 'equipment'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                  filterCategory === cat
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat === 'all'
                  ? 'すべて'
                  : cat === 'recovery'
                  ? '回復'
                  : cat === 'battle'
                  ? '戦闘'
                  : cat === 'valuable'
                  ? '換金'
                  : '装備'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredResearched.map((recipe) => {
            const resultItem = ITEMS[recipe.resultItemId];
            if (!resultItem) return null;

            const canCraft = recipe.ingredients.every(
              (ing) => (state.inventory[ing.itemId] || 0) >= ing.count
            );

            return (
              <div
                key={recipe.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2.5"
              >
                <div className="min-w-0 flex items-start gap-2.5 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <ItemIcon name={resultItem.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* Row 1: Name & Quantity */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">
                        {recipe.name} x{getCraftCount(recipe)}
                      </span>
                      <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                        所要: 1日
                      </span>
                    </div>

                    {/* Row 2: Effect / Performance Additional Notation */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {renderItemEffectBadge(resultItem)}
                      <p className="text-[10px] text-slate-500 truncate">
                        {resultItem.description}
                      </p>
                    </div>

                    {/* Row 3: Ingredients row */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recipe.ingredients.map((ing) => {
                        const itemObj = ITEMS[ing.itemId];
                        const inStock = state.inventory[ing.itemId] || 0;
                        const isSufficient = inStock >= ing.count;
                        return (
                          <span
                            key={ing.itemId}
                            className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded ${
                              isSufficient
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span>{itemObj?.name || ing.itemId}</span>
                            <span className="font-mono font-bold">
                              {inStock}/{ing.count}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Craft Action Button */}
                <button
                  disabled={!canCraft}
                  onClick={() => handleQuickAssign(recipe.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    !canCraft
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : !hasEmptySlot
                      ? 'bg-slate-300 text-slate-600 hover:bg-slate-400'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs active:scale-95'
                  }`}
                >
                  {!canCraft
                    ? '素材不足'
                    : !hasEmptySlot
                    ? '枠満杯'
                    : '仕込む'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recipe Research Tree (未解読のレシピ研究) */}
      <section className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-black text-slate-800">未解読のレシピ研究</h3>
          </div>
          <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
            保有 RP: {state.researchPoints}
          </span>
        </div>

        {unresearchedRecipes.length === 0 ? (
          <div className="text-center py-4 px-2 bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-600 font-bold">
              {undiscoveredCount > 0
                ? '現在研究可能なレシピはありません。'
                : 'すべてのレシピの研究が完了しています！'}
            </p>
            {undiscoveredCount > 0 && (
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                ※冒険に出て未知の素材を採取・初入手すると、プリムラが新たな調合レシピ（未解読）をひらめきます！(未発見: {undiscoveredCount}種)
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {unresearchedRecipes.map((recipe) => {
              const resultItem = ITEMS[recipe.resultItemId];
              const canResearch = state.researchPoints >= recipe.researchCostRp;

              return (
                <div
                  key={recipe.id}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{recipe.name}</span>
                      {resultItem && renderItemEffectBadge(resultItem)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      必要素材:{' '}
                      {recipe.ingredients
                        .map((ing) => `${ITEMS[ing.itemId]?.name || ing.itemId}x${ing.count}`)
                        .join(' · ')}
                    </div>
                  </div>

                  <button
                    disabled={!canResearch}
                    onClick={() => handleResearch(recipe.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                      canResearch
                        ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-2xs active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>研究 ({recipe.researchCostRp} RP)</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Select Recipe to Assign Modal */}
      {activeSlotModal !== null && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-14 p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm w-full text-slate-800 shadow-2xl border border-sky-200 h-[75vh] max-h-[600px] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-150 shrink-0">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-sky-500" />
                スロット #{activeSlotModal + 1} に仕込む
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  調合量 {slotBoostLevel}個
                </span>
              </h3>
              <button
                onClick={() => setActiveSlotModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-500 my-2 shrink-0">
              仕込んだアイテムは冒険に出撃して1日経過すると完成します。
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {researchedRecipes.map((recipe) => {
                const resultItem = ITEMS[recipe.resultItemId];
                const canCraft = recipe.ingredients.every(
                  (ing) => (state.inventory[ing.itemId] || 0) >= ing.count
                );

                return (
                  <button
                    key={recipe.id}
                    disabled={!canCraft}
                    onClick={() => handleAssign(activeSlotModal, recipe.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                      canCraft
                        ? 'bg-white hover:bg-sky-50 border-slate-200 active:scale-98 shadow-2xs'
                        : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {resultItem && <ItemIcon name={resultItem.icon} className="w-5 h-5 shrink-0 mt-0.5" />}
                      <div className="truncate flex-1">
                        <div className="text-xs font-black text-slate-900 truncate">
                          {recipe.name} x{getCraftCount(recipe)}
                        </div>
                        {resultItem && (
                          <div className="mt-0.5">
                            {renderItemEffectBadge(resultItem)}
                          </div>
                        )}
                        <div className="text-[9px] text-slate-500 truncate mt-0.5">
                          {recipe.ingredients
                            .map((ing) => `${ITEMS[ing.itemId]?.name} (${state.inventory[ing.itemId] || 0}/${ing.count})`)
                            .join(', ')}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-black shrink-0 ${
                        canCraft ? 'text-sky-600' : 'text-slate-400'
                      }`}
                    >
                      {canCraft ? '仕込む' : '素材不足'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
