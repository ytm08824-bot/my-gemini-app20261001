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
    <div className="pb-24 pt-2 px-3 max-w-lg mx-auto space-y-4">
      {/* Trophy & Goal Header */}
      <section className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-4 shadow-sm border border-indigo-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400 fill-amber-300" />
            <h2 className="text-sm font-extrabold tracking-wide">伝説のダンジョン制覇目標</h2>
          </div>
          <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
            踏破 {clearedCount} / {state.dungeons.length}
          </span>
        </div>
        <p className="text-xs text-indigo-200 leading-relaxed">
          姉妹の生涯の夢は、最奥に神話の竜が眠る「星霜の回廊」の制覇。
          遺跡や回廊を攻略して腕を磨き、伝説の頂へ挑みましょう！
        </p>
      </section>

      {/* Dungeon List */}
      <section className="space-y-3">
        {state.dungeons.map((dungeon) => {
          const isLocked = !dungeon.isUnlocked;
          const isCleared = dungeon.isCleared;
          const rewardItem = ITEMS[dungeon.clearRewardItem];

          return (
            <div
              key={dungeon.id}
              className={`rounded-3xl p-4 border transition-all ${
                isLocked
                  ? 'bg-slate-100/80 border-slate-200 opacity-70'
                  : 'bg-white shadow-sm border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      isLocked
                        ? 'bg-slate-200 text-slate-400'
                        : isCleared
                        ? 'bg-amber-100 text-amber-600 border border-amber-300'
                        : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="w-5 h-5" />
                    ) : isCleared ? (
                      <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                    ) : (
                      <Landmark className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">{dungeon.name}</h3>
                      {isCleared && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                          <CheckCircle className="w-3 h-3 text-amber-600" />
                          踏破済
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        全 {dungeon.floorsCount} 階層
                      </span>
                      <span>·</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                        ダンジョンLv.{dungeon.recommendedLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {dungeon.description}
              </p>

              {/* Specs & Gimmick hint */}
              {!isLocked && (
                <div className="bg-slate-50 rounded-2xl p-2.5 mb-3 space-y-1.5 text-[11px] text-slate-600 border border-slate-150">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Dices className="w-3.5 h-3.5 text-indigo-500" />
                      仕掛け・トラップ
                    </span>
                    <span className="text-slate-500">能力値 + 1d6判定で突破</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Skull className="w-3.5 h-3.5 text-rose-500" />
                      最深層の主
                    </span>
                    <span className="text-slate-700 font-bold">
                      {dungeon.floors[dungeon.floors.length - 1].boss?.name || '強敵'}
                    </span>
                  </div>
                  {rewardItem && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        踏破特別報酬
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-900 font-bold">
                        <ItemIcon name={rewardItem.icon} className="w-3 h-3" />
                        {rewardItem.name}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Button */}
              {isLocked ? (
                <div className="w-full py-2.5 rounded-2xl bg-slate-200 text-slate-500 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>前のダンジョンをクリアすると解放</span>
                </div>
              ) : (
                <button
                  onClick={() => handleStart(dungeon)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <Landmark className="w-4 h-4" />
                  <span>ダンジョンに挑む (1日経過)</span>
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
