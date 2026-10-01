import React from 'react';
import { useGame } from '../context/GameContext';
import {
  Sparkles,
  Layers,
  BookOpen,
  ArrowUpCircle,
  X,
  Coins,
  AlertCircle,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface FacilitiesModalProps {
  onClose: () => void;
}

export const FacilitiesModal: React.FC<FacilitiesModalProps> = ({ onClose }) => {
  const { state, weeklyRent, upgradeFacility } = useGame();

  const handleClose = () => {
    sound.playTap();
    onClose();
  };

  const handleUpgrade = (id: string) => {
    const success = upgradeFacility(id);
    if (!success) {
      sound.playFail();
    }
  };

  const facilityIcons: Record<string, React.ReactNode> = {
    cauldron: <Layers className="w-5 h-5 text-indigo-500" />,
    slot_boost: <Sparkles className="w-5 h-5 text-amber-500" />,
    library: <BookOpen className="w-5 h-5 text-sky-500" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3">
      <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full text-slate-800 shadow-2xl border border-amber-200 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-slate-150">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">アトリエ施設強化</h3>
              <span className="text-[10px] text-slate-500 font-semibold">
                設備投資で工房の生産力と冒険効率を底上げ
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Financial Status Bar */}
        <div className="bg-amber-50 rounded-2xl p-2.5 mb-3 flex items-center justify-between border border-amber-200/70 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-700">現在の所持金:</span>
            <span className="font-mono font-black text-amber-900">
              {state.gold.toLocaleString()} G
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>週次維持費: {weeklyRent}G</span>
          </div>
        </div>

        {/* Facilities List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {state.facilities.map((facility) => {
            const upgradeCost = facility.baseUpgradeCost * facility.level;
            const isMax = facility.level >= facility.maxLevel;
            const canAfford = state.gold >= upgradeCost && !isMax;

            return (
              <div
                key={facility.id}
                className="p-3 rounded-2xl border border-slate-150 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    {facilityIcons[facility.id]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{facility.name}</span>
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-md">
                        Lv.{facility.level}
                      </span>
                      {isMax && (
                        <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded-md">
                          MAX
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.2 rounded-md border border-sky-200">
                        {facility.id === 'cauldron'
                          ? `スロット枠: ${facility.level + 1}枠`
                          : facility.id === 'slot_boost'
                          ? `1枠の調合量: ${facility.level}個`
                          : `RP獲得効率: x${facility.level}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-1">
                      {facility.description}
                    </p>
                    <div className="text-[10px] text-amber-800 font-semibold mt-1">
                      週次維持費: +{facility.weeklyCostPerLevel * facility.level}G/週
                    </div>
                  </div>
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => handleUpgrade(facility.id)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all ${
                    isMax
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : canAfford
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>{isMax ? '最大' : '強化'}</span>
                  </div>
                  {!isMax && (
                    <span className="text-[9px] font-mono tabular-nums opacity-90">
                      {upgradeCost}G
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-150 shrink-0 text-center">
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md active:scale-98 transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
