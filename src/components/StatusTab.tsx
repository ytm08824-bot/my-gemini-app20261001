import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { StatKey, EquipmentSlot } from '../types/game';
import { ITEMS, POUCH_GEARS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  Swords,
  Heart,
  Zap,
  Shield,
  Eye,
  Activity,
  Wrench,
  Wind,
  Book,
  Users,
  Sparkles,
  Plus,
  ChevronRight,
  X,
  Briefcase,
  Award,
  Check,
} from 'lucide-react';
import { sound } from '../utils/sound';

export const StatusTab: React.FC = () => {
  const {
    state,
    effectiveLeo,
    upgradeLeoStat,
    getStatUpgradeCost,
    equipItem,
    unequipItem,
    equipPouchGear,
    learnPerk,
  } = useGame();

  const [activeEquipSlot, setActiveEquipSlot] = useState<EquipmentSlot | null>(null);
  const [showPouchPicker, setShowPouchPicker] = useState<boolean>(false);

  const currentPouchGear =
    POUCH_GEARS[state.equippedPouch] || POUCH_GEARS['pouch_starter'];

  const statsConfig: {
    key: StatKey;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    isDerived?: boolean;
  }[] = [
    {
      key: 'hp',
      label: 'HP (生命力)',
      description: '戦闘時の耐久力。0になると冒険失敗・緊急帰還。',
      icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />,
      color: 'text-rose-600',
    },
    {
      key: 'maxStamina',
      label: '体力 (スタミナ)',
      description: '冒険の一歩ごとに消費。最大体力 = 20 + (頑健 + 身体操作力) × 0.5',
      icon: <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />,
      color: 'text-amber-600',
      isDerived: true,
    },
    {
      key: 'atk',
      label: '攻撃力 (ATK)',
      description: '魔物に与える直接ダメージ量。武器によっても向上。',
      icon: <Swords className="w-4 h-4 text-red-500" />,
      color: 'text-red-600',
    },
    {
      key: 'def',
      label: '防御力 (DEF)',
      description: '魔物から受ける被ダメージを軽減。防具で強化可能。',
      icon: <Shield className="w-4 h-4 text-blue-500" />,
      color: 'text-blue-600',
    },
    {
      key: 'observation',
      label: '観察力',
      description: '隠された宝箱や希少採取スポットの発見、トラップの見破り。',
      icon: <Eye className="w-4 h-4 text-teal-500" />,
      color: 'text-teal-600',
    },
    {
      key: 'endurance',
      label: '頑健',
      description: '毒や環境熱波への耐性、最大体力の上昇に寄与。',
      icon: <Activity className="w-4 h-4 text-orange-500" />,
      color: 'text-orange-600',
    },
    {
      key: 'dexterity',
      label: '身体技巧力',
      description: '鍵開け、細工の解除、精密なダンジョン仕掛けの突破。',
      icon: <Wrench className="w-4 h-4 text-emerald-500" />,
      color: 'text-emerald-600',
    },
    {
      key: 'mobility',
      label: '身体操作力',
      description: '身軽な跳躍、罠の緊急回避、最大体力の上昇に寄与。',
      icon: <Wind className="w-4 h-4 text-cyan-500" />,
      color: 'text-cyan-600',
    },
    {
      key: 'knowledge',
      label: '知識',
      description: '古代象形文字の読解、魔導結界の論理解除、魔物の弱点把握。',
      icon: <Book className="w-4 h-4 text-indigo-500" />,
      color: 'text-indigo-600',
    },
    {
      key: 'social',
      label: '社交',
      description: '商人との値切り交渉、ギルドでの評判、依頼報酬の増加。',
      icon: <Users className="w-4 h-4 text-purple-500" />,
      color: 'text-purple-600',
    },
  ];

  const handleUpgrade = (key: StatKey) => {
    const success = upgradeLeoStat(key);
    if (!success) {
      sound.playFail();
    }
  };

  // Filter available equipment in inventory
  const availableEquipments = Object.entries(state.inventory)
    .filter(([itemId, count]) => {
      const item = ITEMS[itemId];
      return item && item.type === 'equipment' && item.equipSlot === activeEquipSlot && count > 0;
    })
    .map(([itemId]) => ITEMS[itemId]);

  return (
    <div className="pb-24 pt-2 px-3 max-w-lg mx-auto space-y-4">
      {/* Leo Character Header */}
      <section className="bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 rounded-3xl p-4 border border-rose-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 rounded-2xl overflow-hidden shrink-0 border-2 border-rose-400 bg-rose-100 shadow-xs">
            <img
              src="/src/assets/images/character_leo_portrait_1790577806510.jpg"
              alt="レオ"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-rose-950">レオの能力育成</h2>
              <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.2 rounded-full">
                前衛軽戦士
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              冒険で得たEXPを消費して、各能力値を個別に鍛錬できます。
            </p>
          </div>
        </div>

        <div className="text-right shrink-0 bg-white/90 border border-rose-200 px-3 py-1.5 rounded-2xl shadow-2xs">
          <span className="text-[10px] text-slate-500 block font-bold">保有経験値</span>
          <span className="text-sm font-black text-rose-600 font-mono tabular-nums flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            {state.leo.exp}
          </span>
        </div>
      </section>

      {/* Equipment Slots */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-extrabold text-slate-800">装備品見直し</h3>
          </div>
          <span className="text-[11px] text-slate-500">タップで装備変更</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['weapon', 'armor', 'accessory'] as const).map((slotKey) => {
            const equippedId = state.equipped[slotKey];
            const item = equippedId ? ITEMS[equippedId] : null;
            const slotName = slotKey === 'weapon' ? '武器' : slotKey === 'armor' ? '防具' : '装飾品';

            return (
              <button
                key={slotKey}
                onClick={() => {
                  sound.playTap();
                  setActiveEquipSlot(slotKey);
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all active:scale-98 flex flex-col justify-between min-h-[75px] ${
                  item
                    ? 'bg-rose-50/50 border-rose-200 shadow-2xs hover:bg-rose-50'
                    : 'bg-slate-50 border-dashed border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold text-slate-400">{slotName}</span>
                  {item && <ItemIcon name={item.icon} className="w-4 h-4" />}
                </div>
                <div className="mt-1">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {item ? item.name : '未装備'}
                  </div>
                  <div className="text-[9px] text-slate-500 truncate mt-0.5">
                    {item
                      ? Object.entries(item.equipStats || {})
                          .map(([k, v]) => `${k.toUpperCase()} +${v}`)
                          .join(', ')
                      : '変更'}
                  </div>
                </div>
              </button>
            );
          })}

          {/* 4th slot: Pouch Gear */}
          <button
            onClick={() => {
              sound.playTap();
              setShowPouchPicker(true);
            }}
            className="p-2.5 rounded-2xl border text-left transition-all active:scale-98 flex flex-col justify-between min-h-[75px] bg-amber-50/50 border-amber-200 shadow-2xs hover:bg-amber-50"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold text-amber-700">ポーチ装備</span>
              <Briefcase className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-1">
              <div className="text-xs font-black text-slate-900 truncate">
                {currentPouchGear.name}
              </div>
              <div className="text-[9px] text-amber-700/80 font-mono font-bold truncate mt-0.5">
                薬{currentPouchGear.capacity.potion} 食{currentPouchGear.capacity.food} 品{currentPouchGear.capacity.consumable} 装{currentPouchGear.capacity.gadget}
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Perks (特技) Section */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-extrabold text-slate-800">レオの特技習得</h3>
          </div>
          <span className="text-[11px] text-slate-500">能力値条件 ＆ EXP消費</span>
        </div>

        <div className="space-y-2">
          {state.perks.map((perk) => {
            const isLearned = perk.level > 0;
            const isMax = perk.level >= perk.maxLevel;
            const nextLevel = perk.level + 1;
            const expCost = perk.requiredExp * nextLevel;

            // Check if stats requirements are met
            const statReqs = Object.entries(perk.requiredStats).map(([k, reqVal]) => {
              const currentVal = effectiveLeo[k as StatKey] || 0;
              const isMet = currentVal >= (reqVal || 0);
              const label =
                k === 'dexterity'
                  ? '身体技巧'
                  : k === 'observation'
                  ? '観察'
                  : k === 'mobility'
                  ? '身体操作'
                  : k === 'knowledge'
                  ? '知識'
                  : k === 'endurance'
                  ? '頑健'
                  : k;
              return { label, reqVal, currentVal, isMet };
            });

            const allStatsMet = statReqs.every((r) => r.isMet);
            const canAfford = state.leo.exp >= expCost;
            const canLearn = !isMax && allStatsMet && canAfford;

            return (
              <div
                key={perk.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isLearned
                    ? 'bg-amber-50/40 border-amber-200/80'
                    : 'bg-slate-50/50 border-slate-150'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{perk.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          isMax
                            ? 'bg-amber-500 text-white'
                            : isLearned
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isMax ? 'MASTER' : isLearned ? `Lv.${perk.level}` : '未習得'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                      {perk.description}
                    </p>

                    {/* Stat Requirements */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[9px] text-slate-400 font-bold">要件:</span>
                      {statReqs.map((sr) => (
                        <span
                          key={sr.label}
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md font-semibold border ${
                            sr.isMet
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {sr.label} {sr.reqVal} (現{sr.currentVal})
                        </span>
                      ))}
                    </div>
                  </div>

                  {!isMax ? (
                    <button
                      disabled={!canLearn}
                      onClick={() => learnPerk(perk.id)}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center min-w-[70px] ${
                        canLearn
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>{isLearned ? '強化' : '習得'}</span>
                      <span className="text-[9px] font-mono opacity-90">{expCost} EXP</span>
                    </button>
                  ) : (
                    <div className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-amber-700" />
                      <span>習得済</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 10 Stats Breakdown & Upgrades */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-extrabold text-slate-800">レオの個別能力値</h3>
          </div>
          <span className="text-[11px] text-slate-500">EXPで個別成長</span>
        </div>

        <div className="space-y-2">
          {statsConfig.map((stat) => {
            const currentVal = effectiveLeo[stat.key];
            const baseVal = state.leo[stat.key];
            const equipBonus = currentVal - baseVal;
            const cost = stat.isDerived ? 0 : getStatUpgradeCost(stat.key);
            const canUpgrade = !stat.isDerived && state.leo.exp >= cost;

            return (
              <div
                key={stat.key}
                className="p-2.5 rounded-2xl border border-slate-150 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center shrink-0">
                    {stat.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{stat.label}</span>
                      <span className="text-xs font-black font-mono tabular-nums text-slate-900">
                        {currentVal}
                        {equipBonus > 0 && (
                          <span className="text-[10px] text-emerald-600 font-bold ml-1">
                            (+{equipBonus})
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight truncate">
                      {stat.description}
                    </p>
                  </div>
                </div>

                {!stat.isDerived ? (
                  <button
                    disabled={!canUpgrade}
                    onClick={() => handleUpgrade(stat.key)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                      canUpgrade
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-2xs active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="flex items-center gap-0.5">
                      <Plus className="w-3 h-3" />
                      <span>{stat.key === 'hp' ? '+5' : '+1'}</span>
                    </span>
                    <span className="text-[9px] font-mono tabular-nums opacity-90">
                      {cost} EXP
                    </span>
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 px-2">
                    自動連動
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Equipment Drawer Modal */}
      {activeEquipSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full text-slate-800 shadow-2xl border border-rose-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Swords className="w-4 h-4 text-rose-500" />
                {activeEquipSlot === 'weapon'
                  ? '武器を選択'
                  : activeEquipSlot === 'armor'
                  ? '防具を選択'
                  : '装飾品を選択'}
              </h3>
              <button
                onClick={() => setActiveEquipSlot(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {state.equipped[activeEquipSlot] && (
                <button
                  onClick={() => {
                    unequipItem(activeEquipSlot);
                    setActiveEquipSlot(null);
                  }}
                  className="w-full p-2.5 rounded-2xl border border-dashed border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  装備を外す
                </button>
              )}

              {availableEquipments.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  所持品に対応する装備がありません。商店で購入できます。
                </div>
              ) : (
                availableEquipments.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      equipItem(activeEquipSlot, item.id);
                      setActiveEquipSlot(null);
                    }}
                    className="w-full p-3 rounded-2xl border border-slate-200 hover:bg-rose-50/50 hover:border-rose-300 text-left transition-all active:scale-98 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ItemIcon name={item.icon} className="w-5 h-5" />
                      <div>
                        <div className="text-xs font-black text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pouch Gear Picker Modal */}
      {showPouchPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full text-slate-800 shadow-2xl border border-amber-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>ポーチ装備の変更</span>
              </h3>
              <button
                onClick={() => setShowPouchPicker(false)}
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
                      setShowPouchPicker(false);
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
              onClick={() => setShowPouchPicker(false)}
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
