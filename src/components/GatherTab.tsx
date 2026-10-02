import React from 'react';
import { useGame } from '../context/GameContext';
import { GATHERING_FIELDS, ITEMS } from '../data/initialData';
import { GatheringField } from '../types/game';
import { ItemIcon } from './ItemIcon';
import {
  Compass,
  Footprints,
  Sparkles,
  Sword,
  Lock,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface GatherTabProps {
  onStartGathering: (field: GatheringField) => void;
}

export const GatherTab: React.FC<GatherTabProps> = ({ onStartGathering }) => {
  const { state, effectiveLeo } = useGame();

  const clearedCount = state.dungeons.filter((d) => d.isCleared).length;

  const handleStart = (field: GatheringField) => {
    sound.playTap();
    onStartGathering(field);
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-lg mx-auto space-y-4 select-none">
      {/* Header Info Banner */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-4 shadow-sm border border-emerald-700/50">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-300" />
            <h2 className="text-sm font-black tracking-wide">採取フィールド一覧 (全12地帯)</h2>
          </div>
          <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
            レオ体力: {effectiveLeo.stamina}/{effectiveLeo.maxStamina}
          </span>
        </div>
        <p className="text-xs text-emerald-200 leading-relaxed font-medium">
          迷宮の踏破数（現在 <strong className="font-mono text-white">{clearedCount}</strong> 箇所）に応じて、手つかずの広大な自然界への道が段階的に拓かれます。
        </p>
      </section>

      {/* Field List */}
      <section className="space-y-3">
        {GATHERING_FIELDS.map((field, index) => {
          const reqClears = field.requiredDungeonsCleared || 0;
          const isLocked = clearedCount < reqClears;

          return (
            <div
              key={field.id}
              className={`rounded-3xl p-4 border transition-all overflow-hidden relative ${
                isLocked
                  ? 'bg-slate-100/70 border-slate-200 opacity-65'
                  : 'bg-white shadow-sm border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${field.bgGradient}`}
              />

              <div className="flex items-start justify-between gap-2 mt-1 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      Area {index + 1}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 truncate">
                      {isLocked ? '？？？ (未踏の地)' : field.name}
                    </h3>
                    {!isLocked && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.2 rounded-full border border-emerald-200 font-mono">
                        推奨Lv.{field.recommendedLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-1">
                    {isLocked ? '周囲の迷宮を踏破することで、新たな街道と採取地への安全が確保されます。' : field.description}
                  </p>
                </div>
              </div>

              {/* Specs & Drops info (Only if unlocked) */}
              {!isLocked ? (
                <>
                  <div className="grid grid-cols-2 gap-2 my-2.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Footprints className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[11px]">
                        全 {field.totalSteps} 歩 · 消費 {field.staminaCostPerStep}/歩
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Sword className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="text-[11px] truncate">
                        生息: {field.enemies.map((e) => e.name).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Harvest Pool Preview */}
                  <div className="bg-slate-50 rounded-2xl p-2.5 mb-3 border border-slate-150">
                    <div className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>採取できる代表的な素材</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {field.harvestPool.map((pool) => {
                        const item = ITEMS[pool.itemId];
                        if (!item) return null;
                        return (
                          <span
                            key={pool.itemId}
                            className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] text-slate-800 font-bold shadow-2xs"
                          >
                            <ItemIcon name={item.icon} className="w-3 h-3 text-slate-600" />
                            <span>{item.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStart(field)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Footprints className="w-4 h-4" />
                    <span>採取に出発する (1日経過)</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </>
              ) : (
                <div className="mt-2.5 py-2.5 px-3 rounded-2xl bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>迷宮踏破 {reqClears}箇所以上で解放</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (現在 {clearedCount}/{reqClears})
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};
