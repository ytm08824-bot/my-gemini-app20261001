import React from 'react';
import { useGame } from '../context/GameContext';
import { Dungeon } from '../types/game';
import { ITEMS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  Landmark,
  Crown,
  Lock,
  CheckCircle,
  Skull,
  Dices,
  Layers,
  ChevronRight,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface DungeonTabProps {
  onStartDungeon: (dungeon: Dungeon) => void;
}

export const DungeonTab: React.FC<DungeonTabProps> = ({ onStartDungeon }) => {
  const { state } = useGame();

  const handleStart = (dungeon: Dungeon) => {
    sound.playTap();
    onStartDungeon(dungeon);
  };

  const clearedCount = state.dungeons.filter((d) => d.isCleared).length;

  return (
    <div className="pb-24 pt-2 px-3 max-w-lg mx-auto space-y-4 select-none">
      {/* Trophy & Goal Header */}
      <section className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 text-white rounded-3xl p-4 shadow-md border border-indigo-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400 fill-amber-300 animate-pulse" />
            <h2 className="text-sm font-black tracking-wide">全20迷宮 制覇への道</h2>
          </div>
          <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30 font-mono">
            踏破 {clearedCount} / {state.dungeons.length}
          </span>
        </div>
        <p className="text-xs text-indigo-200 leading-relaxed font-medium">
          目指すは最深第30階層に神話竜アルカディウスが座す、第20迷宮「星霜の深淵回廊」。
          未踏破の迷宮は伝聞のみが伝わる謎に包まれています。踏破して全情報を解き明かしましょう！
        </p>
      </section>

      {/* Dungeon List */}
      <section className="space-y-3">
        {state.dungeons.map((dungeon, index) => {
          const isLocked = !dungeon.isUnlocked;
          const isCleared = dungeon.isCleared;
          const isLegendary = dungeon.id === 'dungeon_legendary';
          const rewardItem = ITEMS[dungeon.clearRewardItem];

          return (
            <div
              key={dungeon.id}
              className={`rounded-3xl p-4 border transition-all ${
                isLocked
                  ? 'bg-slate-100/70 border-slate-200 opacity-60'
                  : isCleared
                  ? 'bg-white shadow-sm border-amber-200/90 ring-1 ring-amber-300/30'
                  : isLegendary
                  ? 'bg-gradient-to-br from-purple-950/20 via-white to-amber-50/30 border-purple-300 shadow-md ring-1 ring-purple-400/40'
                  : 'bg-white shadow-sm border-slate-200 hover:border-indigo-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      isLocked
                        ? 'bg-slate-200 text-slate-400'
                        : isCleared
                        ? 'bg-amber-100 text-amber-600 border border-amber-300'
                        : isLegendary
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xs'
                        : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-slate-400" />
                    ) : isCleared ? (
                      <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                    ) : isLegendary ? (
                      <Crown className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
                    ) : (
                      <Landmark className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        No.{index + 1}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 truncate">
                        {isLocked ? '？？？ (封印中)' : dungeon.name}
                      </h3>
                      {isCleared ? (
                        <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full flex items-center gap-0.5 border border-amber-200">
                          <CheckCircle className="w-3 h-3 text-amber-600" />
                          踏破済
                        </span>
                      ) : !isLocked ? (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.2 rounded-full border border-indigo-200">
                          調査可能
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      {isLocked ? (
                        <span className="text-slate-400 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          階層数：？？
                        </span>
                      ) : !isCleared ? (
                        <span className="text-indigo-700 font-bold flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          階層数：？ 階層 (未踏破)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-700 font-bold">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          全 {dungeon.floorsCount} 階層 (完全踏破)
                        </span>
                      )}
                      <span>·</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded-md border border-indigo-200/60 font-mono text-[10px]">
                        推奨Lv.{dungeon.recommendedLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description: Rumor if uncleared, Full details if cleared */}
              <div className="mb-3">
                {isLocked ? (
                  <p className="text-xs text-slate-400 italic leading-relaxed bg-slate-50 p-2.5 rounded-2xl border border-dashed border-slate-200">
                    前の迷宮を踏破することで、ギルドに集まる伝聞や情報が解禁されます。
                  </p>
                ) : !isCleared ? (
                  <div className="p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-150 text-indigo-950 space-y-1">
                    <div className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>冒険者ギルドの伝聞</span>
                    </div>
                    <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                      {dungeon.rumorDescription || `「${dungeon.name}」に関する断片的な目撃情報のみが伝わっている。`}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-2xl border border-slate-150">
                    {dungeon.description}
                  </p>
                )}
              </div>

              {/* Specs & Boss/Reward details: Masked if uncleared, fully revealed if cleared */}
              {!isLocked && (
                <div className="bg-slate-50 rounded-2xl p-2.5 mb-3 space-y-1.5 text-[11px] text-slate-600 border border-slate-150">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <Dices className="w-3.5 h-3.5 text-indigo-500" />
                      仕掛け・試練
                    </span>
                    <span className="text-slate-500">能力値 + 1d6判定で突破</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <Skull className="w-3.5 h-3.5 text-rose-500" />
                      最深層の主
                    </span>
                    <span
                      className={`font-bold ${
                        isCleared ? 'text-slate-900' : 'text-slate-400 italic'
                      }`}
                    >
                      {isCleared
                        ? dungeon.floors[dungeon.floors.length - 1]?.boss?.name || '深奥の強敵'
                        : '？？？ (踏破で開示)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      踏破特別報酬
                    </span>
                    {isCleared && rewardItem ? (
                      <span className="inline-flex items-center gap-1 text-amber-900 font-bold">
                        <ItemIcon name={rewardItem.icon} className="w-3 h-3" />
                        {rewardItem.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium italic">？？？ (初回踏破時獲得)</span>
                    )}
                  </div>
                </div>
              )}

              {/* Button */}
              {isLocked ? (
                <div className="w-full py-2.5 rounded-2xl bg-slate-200 text-slate-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>前の迷宮を制覇すると情報解禁</span>
                </div>
              ) : (
                <button
                  onClick={() => handleStart(dungeon)}
                  className={`w-full py-3 rounded-2xl text-white font-black text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 ${
                    isLegendary
                      ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-amber-600 hover:from-purple-800 hover:to-amber-700 shadow-purple-900/30'
                      : isCleared
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/25'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-600/25'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span>
                    {isLegendary
                      ? '伝説の迷宮に挑戦する (1日経過)'
                      : isCleared
                      ? '再探索に出撃する (1日経過)'
                      : '未踏の迷宮に挑む (1日経過)'}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};
