import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ITEMS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  Scroll,
  Coins,
  BookOpen,
  CheckCircle2,
  Lock,
  X,
  PackageCheck,
  Sparkles,
  Info,
  Gift,
} from 'lucide-react';
import { sound } from '../utils/sound';
import { Quest } from '../types/game';

interface QuestBoardModalProps {
  onClose: () => void;
}

export const QuestBoardModal: React.FC<QuestBoardModalProps> = ({ onClose }) => {
  const { state, effectiveLeo, claimQuestReward } = useGame();
  const [filter, setFilter] = useState<'all' | 'ready' | 'claimed'>('all');
  const [celebratingQuestId, setCelebratingQuestId] = useState<string | null>(null);

  // Calculate social tip rate
  const socialBonusRate = Math.min(
    0.25,
    Math.max(0, (effectiveLeo.social - 8) * 0.015)
  );
  const socialBonusPercent = Math.round(socialBonusRate * 100);

  const clearedDungeonsCount = state.dungeons.filter((d) => d.isCleared).length;

  const handleDeliver = (questId: string) => {
    const success = claimQuestReward(questId);
    if (success) {
      setCelebratingQuestId(questId);
      setTimeout(() => setCelebratingQuestId(null), 1500);
    } else {
      sound.playFail();
    }
  };

  const handleClose = () => {
    sound.playTap();
    onClose();
  };

  // Only quests whose target item has been obtained OR its recipe researched are unlocked/posted!
  const isQuestAvailable = (q: Quest) => {
    if (
      typeof q.requiredDungeonsCleared === 'number' &&
      clearedDungeonsCount < q.requiredDungeonsCleared
    ) {
      return false;
    }

    const hasEverObtained =
      state.unlockedMaterials.includes(q.targetItemId) ||
      (state.inventory[q.targetItemId] || 0) > 0;
    const isRecipeResearched = state.recipes.some(
      (r) => r.resultItemId === q.targetItemId && r.isResearched
    );

    return hasEverObtained || isRecipeResearched;
  };

  const availableQuests = (state.quests || []).filter(isQuestAvailable);

  // Filter quests
  const filteredQuests = availableQuests.filter((q) => {
    const currentCount = state.inventory[q.targetItemId] || 0;
    const isReady = !q.isClaimed && currentCount >= q.targetCount;

    if (filter === 'ready') return isReady;
    if (filter === 'claimed') return q.isClaimed;
    return true;
  });

  const readyCount = availableQuests.filter((q) => {
    const currentCount = state.inventory[q.targetItemId] || 0;
    return !q.isClaimed && currentCount >= q.targetCount;
  }).length;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-10 p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full text-slate-800 shadow-2xl border border-amber-200 h-[86vh] max-h-[680px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-150 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900">ギルド依頼掲示板</h3>
                {readyCount > 0 && (
                  <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-bounce shadow-xs">
                    {readyCount}件納品可
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">
                採取・調合品を納品して資金と研究ポイント(RP)を獲得
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* Social Tip Rate Banner */}
        {socialBonusPercent > 0 && (
          <div className="mt-2.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-purple-500/10 rounded-xl border border-purple-200 flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-1.5 text-purple-950 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>レオの社交交渉: 依頼人からの謝礼金UP中</span>
            </div>
            <span className="text-purple-800 font-black font-mono">
              +{socialBonusPercent}% UP
            </span>
          </div>
        )}

        {/* Quest Rules Notice */}
        <div className="mt-2 px-3 py-1.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[10px] text-amber-900 font-medium flex items-center gap-1.5 shrink-0">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>一度でも採取・入手した素材や、研究完了済みの調合品の依頼が届きます。</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs my-2.5 shrink-0">
          <button
            onClick={() => {
              sound.playTap();
              setFilter('all');
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            受注可能 ({availableQuests.length})
          </button>
          <button
            onClick={() => {
              sound.playTap();
              setFilter('ready');
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1 ${
              filter === 'ready'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>納品可能</span>
            {readyCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-emerald-700 text-[10px] font-black flex items-center justify-center">
                {readyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              sound.playTap();
              setFilter('claimed');
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
              filter === 'claimed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            達成済 ({availableQuests.filter((q) => q.isClaimed).length})
          </button>
        </div>

        {/* Quest List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
          {filteredQuests.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-slate-400 space-y-1">
              <Scroll className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
              {filter === 'ready' ? (
                <>
                  <p className="font-bold text-slate-600">すぐに納品可能な依頼はありません</p>
                  <p className="text-[11px] text-slate-400">
                    採取地で素材を集めるか、アトリエで調合を行って納品しましょう！
                  </p>
                </>
              ) : filter === 'claimed' ? (
                <p>まだ達成済みの依頼はありません。</p>
              ) : (
                <>
                  <p className="font-bold text-slate-600">現在受注可能な依頼はありません</p>
                  <p className="text-[11px] text-slate-400">
                    採取地へ冒険するか、新たな調合レシピを研究すると依頼が届きます。
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredQuests.map((quest) => {
              const targetItem = ITEMS[quest.targetItemId];
              const ownedCount = state.inventory[quest.targetItemId] || 0;
              const hasEnough = ownedCount >= quest.targetCount;

              const bonusGold = Math.round(quest.rewardGold * socialBonusRate);
              const totalGold = quest.rewardGold + bonusGold;
              const isCelebrating = celebratingQuestId === quest.id;

              return (
                <div
                  key={quest.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCelebrating
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
                      : quest.isClaimed
                      ? 'bg-slate-50/60 border-slate-200 opacity-60'
                      : hasEnough
                      ? 'bg-emerald-50/40 border-emerald-300 shadow-xs ring-1 ring-emerald-300/40'
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  {/* Top: Client & Title */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded-md border border-amber-200">
                          {quest.client}
                        </span>
                        {quest.isClaimed ? (
                          <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" />
                            本日達成済
                          </span>
                        ) : hasEnough ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 border border-emerald-300">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            納品可能！
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-xs font-black text-slate-900 mt-1">
                        {quest.title}
                      </h4>
                    </div>

                    {/* Target Item Badge */}
                    {targetItem && (
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl shrink-0 border border-slate-200">
                        <ItemIcon name={targetItem.icon} className="w-4 h-4" />
                        <div className="text-[10px] font-bold">
                          <span className="text-slate-600">{targetItem.name}</span>
                          <span
                            className={`ml-1 font-mono font-black ${
                              hasEnough ? 'text-emerald-600' : 'text-slate-800'
                            }`}
                          >
                            {ownedCount}/{quest.targetCount}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
                    {quest.description}
                  </p>

                  {/* Rewards Row & Action Button */}
                  <div className="pt-2 border-t border-slate-150 flex items-center justify-between gap-2 flex-wrap">
                    {/* Rewards Summary */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="text-[10px] text-slate-500 font-bold">報酬:</span>
                      <span className="font-bold text-amber-700 flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200">
                        <Coins className="w-3 h-3 text-amber-500" />
                        <span className="font-mono font-black">{totalGold} G</span>
                        {bonusGold > 0 && (
                          <span className="text-[9px] text-purple-700 font-bold ml-0.5">
                            (+{bonusGold})
                          </span>
                        )}
                      </span>

                      {typeof quest.rewardRp === 'number' && quest.rewardRp > 0 && (
                        <span className="font-bold text-sky-700 flex items-center gap-0.5 bg-sky-50 px-1.5 py-0.5 rounded-lg border border-sky-200">
                          <BookOpen className="w-3 h-3 text-sky-600" />
                          <span className="font-mono font-black">+{quest.rewardRp} RP</span>
                        </span>
                      )}

                      {quest.rewardItems &&
                        quest.rewardItems.map((rItem, i) => {
                          const itemObj = ITEMS[rItem.itemId];
                          return (
                            <span
                              key={i}
                              className="font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-200 text-[10px]"
                            >
                              <Gift className="w-3 h-3 text-emerald-600" />
                              <span>{itemObj?.name || rItem.itemId}</span>
                              <span className="font-mono font-black">x{rItem.count}</span>
                            </span>
                          );
                        })}
                    </div>

                    {/* Action Button */}
                    <div>
                      {quest.isClaimed ? (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          納品完了
                        </span>
                      ) : hasEnough ? (
                        <button
                          onClick={() => handleDeliver(quest.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>納品して受取</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs">
                          素材不足 (あと {quest.targetCount - ownedCount}個)
                        </span>
                      )}
                    </div>
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
