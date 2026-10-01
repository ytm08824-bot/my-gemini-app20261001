import React from 'react';
import { useGame } from '../context/GameContext';
import { GATHERING_FIELDS, ITEMS } from '../data/initialData';
import { GatheringField } from '../types/game';
import { ItemIcon } from './ItemIcon';
import {
  Compass,
  Footprints,
  Sparkles,
  Zap,
  Sword,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface GatherTabProps {
  onStartGathering: (field: GatheringField) => void;
}

export const GatherTab: React.FC<GatherTabProps> = ({ onStartGathering }) => {
  const { effectiveLeo } = useGame();

  const handleStart = (field: GatheringField) => {
    sound.playTap();
    onStartGathering(field);
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-lg mx-auto space-y-4">
      {/* Field List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-extrabold text-slate-800">採取フィールド選択</h2>
          </div>
          <span className="text-[11px] text-slate-500">
            レオ (体力 {effectiveLeo.maxStamina})
          </span>
        </div>

        {GATHERING_FIELDS.map((field) => {
          return (
            <div
              key={field.id}
              className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 overflow-hidden relative"
            >
              <div
                className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${field.bgGradient}`}
              />

              <div className="flex items-start justify-between gap-2 mt-1 mb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{field.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-snug mt-1">
                    {field.description}
                  </p>
                </div>
              </div>

              {/* Specs & Drops info */}
              <div className="grid grid-cols-2 gap-2 my-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Footprints className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px]">
                    全 {field.totalSteps} 歩 · 消費 {field.staminaCostPerStep}/歩
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Sword className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[11px] truncate">
                    出現: {field.enemies.map((e) => e.name).join(', ')}
                  </span>
                </div>
              </div>

              {/* Harvest Pool Preview */}
              <div className="bg-slate-50 rounded-2xl p-2 mb-3">
                <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>採取できる素材</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {field.harvestPool.map((pool) => {
                    const item = ITEMS[pool.itemId];
                    if (!item) return null;
                    return (
                      <span
                        key={pool.itemId}
                        className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] text-slate-700 font-medium"
                      >
                        <ItemIcon name={item.icon} className="w-3 h-3" />
                        <span>{item.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleStart(field)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Footprints className="w-4 h-4" />
                <span>採取に出発する (1日経過)</span>
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
};
