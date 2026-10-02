import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import {
  GatheringField,
  Dungeon,
  Enemy,
  Gimmick,
  LogEntry,
  DiceResultType,
  PouchCategory,
  PouchState,
  AilmentType,
} from '../types/game';
import { ITEMS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  Heart,
  Zap,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Footprints,
  Shield,
  Sword,
  Sparkles,
  Dices,
  Backpack,
  AlertTriangle,
  CheckCircle2,
  Crown,
  BookOpen,
  Flame,
  Wind,
  Droplets,
  Crosshair,
  Tent,
  ShieldCheck,
  Eye,
  Bomb,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface AdventureModalProps {
  mode: 'gathering' | 'dungeon';
  field?: GatheringField;
  dungeon?: Dungeon;
  onClose: () => void;
}

interface ActiveAilment {
  type: AilmentType;
  level: number;
  turnsRemaining: number;
}

export const AdventureModal: React.FC<AdventureModalProps> = ({
  mode,
  field,
  dungeon,
  onClose,
}) => {
  const {
    effectiveLeo,
    state,
    advanceDay,
    modifyInventory,
    addExp,
    addGold,
    addRp,
    clearDungeon,
    updatePouch,
    unlockMaterial,
  } = useGame();

  // Active status
  const [currentHp, setCurrentHp] = useState<number>(effectiveLeo.hp);
  const [currentStamina, setCurrentStamina] = useState<number>(effectiveLeo.maxStamina);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currentFloorIndex, setCurrentFloorIndex] = useState<number>(0);
  const [explorationPoints, setExplorationPoints] = useState<number>(0);

  // Status Ailments (Phase 2)
  const [ailments, setAilments] = useState<ActiveAilment[]>([]);

  // Adventure pouch active copy
  const [pouch, setPouch] = useState<PouchState>(() =>
    JSON.parse(JSON.stringify(state.pouch))
  );
  const [activePouchTab, setActivePouchTab] = useState<PouchCategory>('potion');

  // Accumulated rewards
  const [obtainedItems, setObtainedItems] = useState<Record<string, number>>({});
  const [earnedExp, setEarnedExp] = useState<number>(0);
  const [earnedGold, setEarnedGold] = useState<number>(0);
  const [earnedRp, setEarnedRp] = useState<number>(0);

  // States
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // 1, 2, 4
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [finishReason, setFinishReason] = useState<
    'completed' | 'cleared' | 'hp_zero' | 'stamina_zero' | 'retreated'
  >('completed');

  // Active Battle State
  const [activeEnemy, setActiveEnemy] = useState<Enemy | null>(null);
  const [enemyHp, setEnemyHp] = useState<number>(0);

  // Active Gimmick State
  const [activeGimmick, setActiveGimmick] = useState<Gimmick | null>(null);
  const [diceState, setDiceState] = useState<{
    rolling: boolean;
    rollValue: number | null;
    totalBonus: number;
    totalResult: number | null;
    outcomeType: DiceResultType | null;
  } | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helpers for Perks & Gadgets
  const getPerkLevel = (effectType: string): number => {
    const p = state.perks?.find(
      (perk) => perk.effectType === effectType || perk.id === effectType || perk.id === `perk_${effectType}`
    );
    return p && typeof p.level === 'number' && p.level > 0 ? p.level : 0;
  };

  const hasGadget = (gadgetId: string): boolean => {
    return (pouch.gadget || []).some((id) => id === gadgetId);
  };

  const getAilmentInfo = (type: AilmentType) => {
    switch (type) {
      case 'poison':
        return {
          name: '毒',
          desc: '毎行動時に毒素ダメージを受ける',
          icon: Droplets,
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 ring-purple-300/60',
        };
      case 'paralysis':
        return {
          name: '麻痺',
          desc: '戦闘時25%の確率で行動不能',
          icon: Zap,
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 ring-amber-300/60',
        };
      case 'frostbite':
        return {
          name: '凍傷',
          desc: '歩行体力消費+1、攻防15%低下',
          icon: Wind,
          badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300 ring-cyan-300/60',
        };
    }
  };

  const addLog = (
    text: string,
    type: LogEntry['type']
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        text,
        type,
        timestamp: Date.now(),
      },
    ]);
  };

  // Helper: Gain item with instant Ancient Parchment to RP conversion and material unlocking
  const PARCHMENT_RP_VALUE = 25; // 羊皮紙1枚につき25RPに即座変換
  const gainItem = (itemId: string, count: number = 1, prefix: string = '') => {
    const itemObj = ITEMS[itemId];
    const itemName = itemObj?.name || itemId;

    // Register unlocked material in atelier
    unlockMaterial(itemId);

    setObtainedItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + count,
    }));

    if (itemId === 'ancient_parchment') {
      const rpGain = count * PARCHMENT_RP_VALUE;
      setEarnedRp((prev) => prev + rpGain);
      sound.playDiceSuccess();
      addLog(
        `📜【古代解読】${prefix}【${itemName}】x${count} を解析！即座に研究ポイント +${rpGain} RP を獲得！`,
        'success'
      );
    } else {
      addLog(`${prefix}【${itemName}】${count > 1 ? `x${count}` : ''}を手に入れた！`, 'harvest');
    }
  };

  // Scroll to bottom of log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Start initialization log
  useEffect(() => {
    if (mode === 'gathering' && field) {
      addLog(`【出発】${field.name}での採取を開始した！`, 'info');
    } else if (mode === 'dungeon' && dungeon) {
      addLog(`【潜入】${dungeon.name}の第1層に足を踏み入れた！`, 'info');
    }

    // Report active gadgets
    const activeGadgetNames = (state.pouch.gadget || [])
      .filter(Boolean)
      .map((id) => ITEMS[id!]?.name)
      .filter(Boolean);
    if (activeGadgetNames.length > 0) {
      addLog(`🧰【ガジェット装備】常時発動: ${activeGadgetNames.join('、')}`, 'gadget');
    }

    // Report active perks
    const activePerkList = (state.perks || []).filter((p) => p.level > 0);
    if (activePerkList.length > 0) {
      addLog(
        `⚡【習得特技】発動準備完了: ${activePerkList.map((p) => `${p.name} Lv${p.level}`).join('、')}`,
        'perk'
      );
    }
  }, []);

  // Try Inflicting Status Ailment with Resistance Check
  const tryInflictAilment = (type: AilmentType, level: number = 1, source: string) => {
    const detoxLv = getPerkLevel('detox');
    const hasTalisman = hasGadget('warding_talisman');

    // Base resistance: Leo's Endurance + Knowledge + Talisman + Detox perk
    const resistRoll =
      effectiveLeo.endurance * 2.2 +
      effectiveLeo.knowledge * 1.5 +
      (hasTalisman ? 35 : 0) +
      (detoxLv > 0 ? detoxLv * 15 : 0);
    const resistChance = Math.min(85, Math.max(10, Math.round(resistRoll)));

    if (Math.random() * 100 < resistChance) {
      sound.playShield();
      if (detoxLv > 0) {
        addLog(
          `🛡️【特技：解毒術 Lv${detoxLv}】体内の毒素を素早く分解し、${source}による【${getAilmentInfo(type).name}】を防ぎ切った！`,
          'perk'
        );
      } else {
        addLog(
          `🛡️【耐性発揮】頑健な体躯と薬学知識により、${source}による【${getAilmentInfo(type).name}】を防ぎ切った！`,
          'success'
        );
      }
      return;
    }

    sound.playAilment();
    const info = getAilmentInfo(type);
    setAilments((prev) => {
      const existing = prev.find((a) => a.type === type);
      if (existing) {
        return prev.map((a) =>
          a.type === type
            ? {
                ...a,
                level: Math.max(a.level, level),
                turnsRemaining: Math.max(a.turnsRemaining, 3 + level),
              }
            : a
        );
      }
      return [...prev, { type, level, turnsRemaining: 3 + level }];
    });

    addLog(
      `⚠️【状態異常】レオは${source}により【${info.name} Lv${level}】にかかってしまった！(${info.desc})`,
      'ailment'
    );

    // Auto-cure check if medicine in pouch
    autoCureAilment(type);
  };

  // Automatic Ailment Cure Check
  const autoCureAilment = (targetType?: AilmentType): boolean => {
    for (const cat of ['consumable', 'potion'] as PouchCategory[]) {
      const list = pouch[cat] || [];
      for (let i = 0; i < list.length; i++) {
        const itemId = list[i];
        if (!itemId) continue;
        const item = ITEMS[itemId];
        if (item?.cureAilments && item.cureAilments.length > 0) {
          if (!targetType || item.cureAilments.includes(targetType)) {
            usePouchItem(cat, i, 'auto');
            return true;
          }
        }
      }
    }
    return false;
  };

  // Use Pouch Item
  const usePouchItem = (
    category: PouchCategory,
    slotIdx: number,
    trigger: 'manual' | 'auto' | 'emergency' = 'manual'
  ) => {
    const itemId = pouch[category]?.[slotIdx];
    if (!itemId) return false;

    const item = ITEMS[itemId];
    if (!item) return false;

    sound.playHeal();
    const tag =
      trigger === 'emergency'
        ? '【緊急使用】'
        : trigger === 'auto'
        ? '【自動使用】'
        : '【携帯品使用】';

    // 1. HP Recovery
    if (
      item.hpRecovery ||
      item.type === 'potion' ||
      item.id === 'potion_small' ||
      item.id === 'potion_high' ||
      item.id === 'panacea_elixir'
    ) {
      const healAmount = item.hpRecovery || item.effectValue || 35;
      setCurrentHp((prev) => Math.min(effectiveLeo.maxHp, prev + healAmount));
      addLog(`${tag}レオはポーチの【${item.name}】を使い、HPが ${healAmount} 回復した！`, 'heal');
    }

    // 2. Stamina Recovery
    if (
      item.staminaRecovery ||
      item.type === 'food' ||
      item.id === 'stamina_tonic' ||
      item.id === 'warming_balm'
    ) {
      const staminaAmount = item.staminaRecovery || item.effectValue || 15;
      setCurrentStamina((prev) => Math.min(effectiveLeo.maxStamina, prev + staminaAmount));
      addLog(`${tag}レオはポーチの【${item.name}】を口にし、体力が ${staminaAmount} 回復した！`, 'heal');
    }

    // 3. Elixir Vital full heal
    if (item.id === 'elixir_vital') {
      setCurrentHp(effectiveLeo.maxHp);
      setCurrentStamina(effectiveLeo.maxStamina);
      addLog(`${tag}レオはポーチの【${item.name}】を飲み、HPと体力が全快した！`, 'heal');
    }

    // 4. Cure Ailments
    if (item.cureAilments && item.cureAilments.length > 0) {
      const curedNames = item.cureAilments.map((t) => getAilmentInfo(t).name).join('・');
      setAilments((prev) => prev.filter((a) => !item.cureAilments!.includes(a.type)));
      addLog(`✨【解毒治癒】${item.name}の浄化作用により、${curedNames}が全快した！`, 'heal');
    }

    // 5. Battle Throwables
    if (activeEnemy) {
      if (item.id === 'bomb_fire' || item.id === 'throwing_knife') {
        sound.playHit();
        const dmg = item.effectValue || (item.id === 'bomb_fire' ? 45 : 28);
        const nextHp = Math.max(0, enemyHp - dmg);
        setEnemyHp(nextHp);
        addLog(`💣【投擲】レオはポーチの【${item.name}】を投げつけた！${activeEnemy.name}に ${dmg} ダメージ！`, 'battle');
      } else if (item.id === 'bomb_ice') {
        sound.playHit();
        const dmg = item.effectValue || 35;
        const nextHp = Math.max(0, enemyHp - dmg);
        setEnemyHp(nextHp);
        addLog(`❄️【極冷投擲】レオはポーチの【${item.name}】を炸裂させた！${activeEnemy.name}に ${dmg} ダメージ！`, 'battle');
      } else if (item.id === 'smoke_bomb_poison') {
        sound.playHit();
        const dmg = 20;
        const nextHp = Math.max(0, enemyHp - dmg);
        setEnemyHp(nextHp);
        addLog(`☠️【猛毒拡散】レオはポーチの【${item.name}】を放った！猛烈な毒霧が${activeEnemy.name}を蝕み ${dmg} ダメージ！`, 'battle');
      } else if (item.id === 'talisman_exorcism') {
        sound.playDiceSuccess();
        const dmg = item.effectValue || 65;
        const nextHp = Math.max(0, enemyHp - dmg);
        setEnemyHp(nextHp);
        addLog(`☀️【退魔破邪】神聖な護符が光を放ち激しく炸裂！${activeEnemy.name}に ${dmg} の神聖特大ダメージ！`, 'battle');
      } else if (item.id === 'thunder_orb') {
        sound.playHit();
        const dmg = item.effectValue || 45;
        const nextHp = Math.max(0, enemyHp - dmg);
        setEnemyHp(nextHp);
        addLog(`⚡【放電投擲】レオはポーチの【${item.name}】を投じた！高圧電流が奔り、${activeEnemy.name}に ${dmg} ダメージ！`, 'battle');
      } else if (item.id === 'smoke_bomb') {
        sound.playEvade();
        setActiveEnemy(null);
        setEnemyHp(0);
        addLog(`💨【煙幕フラスコ】濃密な白煙を撒き散らし、${activeEnemy.name}から確実に離脱した！`, 'info');
      }
    }

    setPouch((prev) => {
      const catList = [...prev[category]];
      catList[slotIdx] = null;
      return {
        ...prev,
        [category]: catList,
      };
    });
    return true;
  };

  // Check and Auto-Use Food when stamina drops <= 40% (or <= 12)
  const autoUseStaminaFood = (staminaVal: number): boolean => {
    const threshold = Math.max(12, Math.round(effectiveLeo.maxStamina * 0.4));
    if (staminaVal <= threshold) {
      const foodSlotIdx = (pouch.food || []).findIndex(Boolean);
      if (foodSlotIdx !== -1) {
        return usePouchItem('food', foodSlotIdx, 'auto');
      }
      const potionSlotIdx = (pouch.potion || []).findIndex(
        (id) => id === 'stamina_tonic' || id === 'elixir_vital'
      );
      if (potionSlotIdx !== -1) {
        return usePouchItem('potion', potionSlotIdx, 'auto');
      }
    }
    return false;
  };

  // Check and Auto-Use HP Potion when HP drops <= 40% (or <= 18)
  const autoUseHpPotion = (hpVal: number): boolean => {
    const threshold = Math.max(18, Math.round(effectiveLeo.maxHp * 0.4));
    if (hpVal <= threshold) {
      const slotIdx = (pouch.potion || []).findIndex(
        (id) => id && (ITEMS[id]?.hpRecovery || ITEMS[id]?.type === 'potion')
      );
      if (slotIdx !== -1) {
        return usePouchItem('potion', slotIdx, 'auto');
      }
    }
    return false;
  };

  // Turn Loop Engine
  useEffect(() => {
    if (isFinished || isPaused) return;

    const intervalTime = Math.max(250, 1100 / speed);

    timerRef.current = setTimeout(() => {
      resolveStep();
    }, intervalTime);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    isFinished,
    isPaused,
    speed,
    currentHp,
    currentStamina,
    activeEnemy,
    enemyHp,
    activeGimmick,
    diceState,
    currentStep,
    currentFloorIndex,
    explorationPoints,
    ailments,
  ]);

  // Main Step Resolver
  const resolveStep = () => {
    // 0. Auto-check HP and Stamina recoveries before action
    autoUseStaminaFood(currentStamina);
    autoUseHpPotion(currentHp);

    // 1. Tick Ailments (Poison damage & Natural healing)
    if (ailments.length > 0) {
      const detoxLv = getPerkLevel('detox');
      const hasTalisman = hasGadget('warding_talisman');

      // Poison Tick Damage
      const poisonAilment = ailments.find((a) => a.type === 'poison');
      if (poisonAilment) {
        const poisonMitigation = detoxLv > 0 ? detoxLv : 0;
        const poisonDmg = Math.max(2, poisonAilment.level * 3 - poisonMitigation);
        setCurrentHp((prev) => Math.max(0, prev - poisonDmg));
        addLog(`🟣【毒の蝕み】毒素が体内を巡り、レオは ${poisonDmg} ダメージを受けた！`, 'danger');
      }

      // Natural recovery roll for each ailment
      const cureChance =
        0.15 +
        effectiveLeo.endurance * 0.015 +
        (detoxLv > 0 ? detoxLv * 0.12 : 0) +
        (hasTalisman ? 0.25 : 0);

      setAilments((prev) => {
        const nextList: ActiveAilment[] = [];
        prev.forEach((a) => {
          if (Math.random() < cureChance) {
            sound.playHeal();
            addLog(`🌿【自然治癒】強靭な代謝により【${getAilmentInfo(a.type).name}】が完治した！`, 'heal');
          } else {
            const nextTurns = a.turnsRemaining - 1;
            if (nextTurns > 0) {
              nextList.push({ ...a, turnsRemaining: nextTurns });
            } else {
              addLog(`⌛【効果消滅】${getAilmentInfo(a.type).name}の効果が自然に薄れ、平常に戻った。`, 'info');
            }
          }
        });
        return nextList;
      });
    }

    // Check stamina exhaustion with emergency rescue
    if (currentStamina <= 0) {
      const foodRescueSlot = (pouch.food || []).findIndex(Boolean);
      if (foodRescueSlot !== -1) {
        usePouchItem('food', foodRescueSlot, 'emergency');
        return;
      }
      const potionRescueSlot = (pouch.potion || []).findIndex(
        (id) => id === 'stamina_tonic' || id === 'elixir_vital'
      );
      if (potionRescueSlot !== -1) {
        usePouchItem('potion', potionRescueSlot, 'emergency');
        return;
      }
      sound.playFail();
      addLog('レオの体力が尽き疲労困憊…！これ以上の探索は危険なため撤退します。', 'danger');
      setFinishReason('stamina_zero');
      setIsFinished(true);
      return;
    }

    // Check HP death with emergency rescue
    if (currentHp <= 0) {
      const potionRescueSlot = (pouch.potion || []).findIndex(
        (id) => id && (ITEMS[id]?.hpRecovery || ITEMS[id]?.type === 'potion')
      );
      if (potionRescueSlot !== -1) {
        usePouchItem('potion', potionRescueSlot, 'emergency');
        return;
      }
      sound.playFail();
      addLog('レオのHPが尽きて力尽きた…！安全圏へと緊急帰還します。', 'danger');
      setFinishReason('hp_zero');
      setIsFinished(true);
      return;
    }

    // 2. If currently in Battle
    if (activeEnemy) {
      handleBattleStep();
      return;
    }

    // 3. If currently in Gimmick
    if (activeGimmick) {
      handleGimmickStep();
      return;
    }

    // 4. Normal Exploration Step
    if (mode === 'gathering' && field) {
      handleGatheringStep();
    } else if (mode === 'dungeon' && dungeon) {
      handleDungeonStep();
    }
  };

  // Gathering step logic
  const handleGatheringStep = () => {
    if (!field) return;

    // Stamina calculation (Frostbite adds +1 cost, Stamina Conserve Perk may reduce cost to 0)
    const hasFrostbite = ailments.some((a) => a.type === 'frostbite');
    let staminaCost = field.staminaCostPerStep + (hasFrostbite ? 1 : 0);

    const conserveLv = getPerkLevel('stamina_conserve');
    if (conserveLv > 0) {
      const conserveChance = conserveLv * 0.18 + effectiveLeo.mobility * 0.005;
      if (Math.random() < conserveChance) {
        sound.playPerk();
        staminaCost = 0;
        addLog(`👟【特技：歩行省力術】軽快なステップによりスタミナを消費せずに前進！`, 'perk');
      }
    }

    const nextStamina = Math.max(0, currentStamina - staminaCost);
    setCurrentStamina(nextStamina);
    autoUseStaminaFood(nextStamina);

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Camp kit bonus every 6 steps in field
    if (hasGadget('camp_kit') && nextStep % 6 === 0) {
      sound.playHeal();
      const healHp = 15;
      const healStam = 10;
      setCurrentHp((prev) => Math.min(effectiveLeo.maxHp, prev + healHp));
      setCurrentStamina((prev) => Math.min(effectiveLeo.maxStamina, prev + healStam));
      addLog(`⛺【携帯野営具】小休止して野営食を補給！(HP+${healHp}, 体力+${healStam})`, 'gadget');
    }

    // Check completion of gathering route
    if (nextStep >= field.totalSteps) {
      sound.playVictory();
      addLog(`【採取完了】${field.name}の全行程を踏破し、採取袋がいっぱいになった！`, 'success');
      setFinishReason('completed');
      setIsFinished(true);
      return;
    }

    // 38% enemy encounter, 62% harvest
    const roll = Math.random();
    if (roll < 0.38 && field.enemies.length > 0) {
      // Encounter enemy
      const enemyTemplate = field.enemies[Math.floor(Math.random() * field.enemies.length)];
      const spawnedEnemy: Enemy = JSON.parse(JSON.stringify(enemyTemplate));

      // Hunter's shortbow gadget先制攻撃
      if (hasGadget('hunters_shortbow') && Math.random() < 0.45) {
        sound.playHit();
        const bowDmg = 20 + Math.floor(Math.random() * 6);
        spawnedEnemy.hp = Math.max(1, spawnedEnemy.hp - bowDmg);
        addLog(`🏹【狩人の小型短弓】素早く腰の短弓を放ち先制射撃！${spawnedEnemy.name}に ${bowDmg} ダメージ！`, 'gadget');
      }

      setActiveEnemy(spawnedEnemy);
      setEnemyHp(spawnedEnemy.hp);
      sound.playHit();
      addLog(`魔物【${spawnedEnemy.name}】が現れた！身構えろ！`, 'battle');
    } else {
      // Harvest item
      const itemHarvested = pickFromPool(field.harvestPool);
      if (itemHarvested) {
        sound.playTap();
        gainItem(itemHarvested, 1, '草むらをかき分け、');

        // Scavenger Perk bonus drop check
        const scavengerLv = getPerkLevel('scavenger');
        if (scavengerLv > 0) {
          const scavengerChance = scavengerLv * 0.18 + effectiveLeo.observation * 0.005;
          if (Math.random() < scavengerChance) {
            sound.playPerk();
            gainItem(itemHarvested, 1, `👁️【特技：目利き採取 Lv${scavengerLv}】隠れた良質素材を見抜き、追加で`);
          }
        }

        // Magnifier gadget bonus find
        if (hasGadget('magnifier') && Math.random() < 0.2) {
          gainItem(itemHarvested, 1, `🔍【精密ルーペ】微細な結晶の群生を発見！さらに`);
        }
      }
    }
  };

  // Dungeon step logic
  const handleDungeonStep = () => {
    if (!dungeon) return;
    const floor = dungeon.floors[currentFloorIndex];
    if (!floor) return;

    // Deduct stamina (dungeons take 2 stamina per step, +1 if frostbite)
    const hasFrostbite = ailments.some((a) => a.type === 'frostbite');
    let staminaCost = 2 + (hasFrostbite ? 1 : 0);

    const conserveLv = getPerkLevel('stamina_conserve');
    if (conserveLv > 0) {
      const conserveChance = conserveLv * 0.18 + effectiveLeo.mobility * 0.005;
      if (Math.random() < conserveChance) {
        sound.playPerk();
        staminaCost = 0;
        addLog(`👟【特技：歩行省力術】迷宮の段差を流れるように跳び越え、体力消費なし！`, 'perk');
      }
    }

    const nextStamina = Math.max(0, currentStamina - staminaCost);
    setCurrentStamina(nextStamina);
    autoUseStaminaFood(nextStamina);

    // Add exploration points
    const epGain = 20 + Math.floor(Math.random() * 10);
    const newEp = Math.min(floor.maxExplorationPoints, explorationPoints + epGain);
    setExplorationPoints(newEp);

    // Check if floor reached 100%
    if (newEp >= floor.maxExplorationPoints) {
      // Check if this floor has boss!
      if (floor.boss && !activeEnemy) {
        setActiveEnemy(JSON.parse(JSON.stringify(floor.boss)));
        setEnemyHp(floor.boss.maxHp);
        sound.playHit();
        addLog(`！！！最深部の広間に到達！【${floor.boss.name}】が立ちはだかる！`, 'battle');
        return;
      }

      // If no boss or boss already defeated, descend to next floor!
      if (currentFloorIndex + 1 < dungeon.floorsCount) {
        sound.playVictory();
        const nextFloor = currentFloorIndex + 1;
        setCurrentFloorIndex(nextFloor);
        setExplorationPoints(0);
        addLog(
          `【階段発見】下層への階段を見つけた！${dungeon.floors[nextFloor].name}へと降りていく。`,
          'success'
        );

        // Camp kit / Luxury camp bonus when descending floor
        if (hasGadget('gadget_luxury_camp')) {
          sound.playHeal();
          setCurrentHp((prev) => Math.min(effectiveLeo.maxHp, prev + 40));
          setCurrentStamina((prev) => Math.min(effectiveLeo.maxStamina, prev + 30));
          addLog(`⛺【高級冒険キャンプ】安全地帯で極上の休息！HP+40 / 体力+30 回復！`, 'gadget');
        } else if (hasGadget('camp_kit')) {
          sound.playHeal();
          setCurrentHp((prev) => Math.min(effectiveLeo.maxHp, prev + 20));
          setCurrentStamina((prev) => Math.min(effectiveLeo.maxStamina, prev + 15));
          addLog(`⛺【携帯野営具】階段の踊り場で一息つき、HP+20 / 体力+15 回復！`, 'gadget');
        }
        return;
      } else {
        // Dungeon Completely Cleared!
        sound.playVictory();
        clearDungeon(dungeon.id);
        addLog(`【迷宮踏破！】${dungeon.name}を完全制覇した！偉大なる勝利だ！`, 'success');
        setFinishReason('cleared');
        setIsFinished(true);
        return;
      }
    }

    // Step Event: Gimmick (32%), Enemy (35%), Harvest/Treasure (33%)
    const eventRoll = Math.random();
    if (eventRoll < 0.32 && floor.gimmicks.length > 0) {
      // Gimmick triggered!
      const gimmick = floor.gimmicks[Math.floor(Math.random() * floor.gimmicks.length)];
      setActiveGimmick(gimmick);
      sound.playDiceShake();
      addLog(`【仕掛け発見】${gimmick.title}が現れた！(${gimmick.statName}判定)`, 'gimmick');
    } else if (eventRoll < 0.67 && floor.enemies.length > 0) {
      // Enemy battle!
      const enemyTemplate = floor.enemies[Math.floor(Math.random() * floor.enemies.length)];
      const spawned = JSON.parse(JSON.stringify(enemyTemplate));

      // Heavy Crossbow / Hunter's shortbow gadget
      if (hasGadget('gadget_heavy_crossbow') && Math.random() < 0.7) {
        sound.playHit();
        const bowDmg = 35 + Math.floor(Math.random() * 10);
        spawned.hp = Math.max(1, spawned.hp - bowDmg);
        addLog(`🏹【上位連射ボウガン】重厚な連射矢が先制炸裂！${spawned.name}に ${bowDmg} の大ダメージ！`, 'gadget');
      } else if (hasGadget('hunters_shortbow') && Math.random() < 0.45) {
        sound.playHit();
        const bowDmg = 20 + Math.floor(Math.random() * 6);
        spawned.hp = Math.max(1, spawned.hp - bowDmg);
        addLog(`🏹【狩人の小型短弓】遭遇と同時に矢を射ち抜いた！${spawned.name}に ${bowDmg} ダメージ！`, 'gadget');
      }

      // Ancient Dictionary weakness scan
      if (hasGadget('ancient_dictionary')) {
        addLog(`📖【古代語辞書】${spawned.name}の生態と弱点を把握！(レオの与ダメージ+4)`, 'gadget');
      }

      setActiveEnemy(spawned);
      setEnemyHp(spawned.maxHp);
      sound.playHit();
      addLog(`徘徊する【${spawned.name}】が襲いかかってきた！`, 'battle');
    } else {
      // Dungeon treasure / material
      const harvested = pickFromPool(floor.harvestPool);
      if (harvested) {
        sound.playTap();
        gainItem(harvested, 1, '瓦礫の隙間から');

        // Scavenger Perk bonus drop check
        const scavengerLv = getPerkLevel('scavenger');
        if (scavengerLv > 0) {
          const scavengerChance = scavengerLv * 0.18 + effectiveLeo.observation * 0.005;
          if (Math.random() < scavengerChance) {
            sound.playPerk();
            gainItem(harvested, 1, `👁️【特技：目利き採取 Lv${scavengerLv}】追加で`);
          }
        }
      }
    }
  };

  // Turn-based Battle Step
  const handleBattleStep = () => {
    if (!activeEnemy) return;

    autoUseHpPotion(currentHp);

    // Check Paralysis: 25% chance Leo cannot act
    const isParalyzed = ailments.some((a) => a.type === 'paralysis');
    if (isParalyzed && Math.random() < 0.25) {
      sound.playHit();
      addLog(`⚡【麻痺発作】レオは身体が痺れて攻撃の機を逸してしまった！`, 'danger');
    } else {
      // 1. Leo Attacks Enemy
      // Base attack calculation
      const hasDictionary = hasGadget('ancient_dictionary');
      const hasFrostbite = ailments.some((a) => a.type === 'frostbite');
      const atkBonus = hasDictionary ? 4 : 0;
      const effectiveAtk = hasFrostbite ? Math.round(effectiveLeo.atk * 0.85) : effectiveLeo.atk;

      let leoDmg = Math.max(
        3,
        Math.round(effectiveAtk + atkBonus - activeEnemy.def * 0.5 + Math.random() * 4)
      );

      // Strong Strike & Critical Master Perk (Crit) Check
      const strongStrikeLv = getPerkLevel('strong_strike');
      const critMasterLv = getPerkLevel('critical_master');
      const hasCritPerk = strongStrikeLv > 0 || critMasterLv > 0;
      const perkCritBonus =
        (strongStrikeLv > 0 ? strongStrikeLv * 0.08 : 0) +
        (critMasterLv > 0 ? critMasterLv * 0.1 : 0);
      const critChance = perkCritBonus + effectiveLeo.dexterity * 0.005;
      const isCrit = Math.random() < critChance;

      if (isCrit) {
        sound.playDiceCritical();
        const multiplier =
          1.5 +
          (strongStrikeLv > 0 ? strongStrikeLv * 0.2 : 0) +
          (critMasterLv > 0 ? critMasterLv * 0.25 : 0);
        leoDmg = Math.round(leoDmg * multiplier);
        if (hasCritPerk) {
          const perkName =
            critMasterLv > 0
              ? `特技：会心の極意 Lv${critMasterLv}`
              : `特技：痛打 Lv${strongStrikeLv}`;
          addLog(
            `⚡【${perkName}】急所を貫く痛烈な一太刀！${activeEnemy.name}に ${leoDmg} ダメージ！`,
            'perk'
          );
        } else {
          addLog(
            `⚡【会心の一撃！】レオの鋭い一撃が急所を捉えた！${activeEnemy.name}に ${leoDmg} ダメージ！`,
            'battle'
          );
        }
      } else {
        sound.playSlash();
        addLog(`レオの連撃！${activeEnemy.name}に ${leoDmg} ダメージを与えた！`, 'battle');
      }

      const nextEnemyHp = Math.max(0, enemyHp - leoDmg);
      setEnemyHp(nextEnemyHp);

      // Check Enemy Defeated
      if (nextEnemyHp <= 0) {
        sound.playVictory();
        addLog(`【討伐】${activeEnemy.name}を打ち倒した！`, 'success');

        // Rewards
        setEarnedExp((prev) => prev + activeEnemy.expReward);
        setEarnedGold((prev) => prev + activeEnemy.goldReward);

        // Drops
        activeEnemy.dropItems.forEach((drop) => {
          if (Math.random() <= drop.chance) {
            gainItem(drop.itemId, 1, 'モンスター固有ドロップ');
          }
        });

        // If this was the dungeon final boss, trigger clear!
        const currentFloor = dungeon?.floors[currentFloorIndex];
        const isFinalBoss =
          currentFloor?.boss &&
          currentFloor.boss.id === activeEnemy.id &&
          currentFloorIndex + 1 === dungeon?.floorsCount;

        setActiveEnemy(null);

        if (isFinalBoss && dungeon) {
          clearDungeon(dungeon.id);
          sound.playDiceCritical();
          addLog(`【伝説達成】最深層の主を撃破！${dungeon.name}を完全踏破した！`, 'success');
          setFinishReason('cleared');
          setIsFinished(true);
        }
        return;
      }
    }

    // 2. Enemy attacks Leo
    // Check Evasion & Acrobat Perk (0 damage) - Only if learned (level > 0)!
    const evasionLv = getPerkLevel('evasion');
    const acrobatLv = getPerkLevel('acrobat');
    if (evasionLv > 0 || acrobatLv > 0) {
      const evadeChance =
        (evasionLv > 0 ? evasionLv * 0.08 : 0) +
        (acrobatLv > 0 ? acrobatLv * 0.12 : 0) +
        effectiveLeo.mobility * 0.004;
      if (Math.random() < evadeChance) {
        sound.playEvade();
        const perkName =
          acrobatLv > 0
            ? `特技：軽身のアクロバット Lv${acrobatLv}`
            : `特技：見切り Lv${evasionLv}`;
        addLog(
          `💨【${perkName}】華麗な身のこなしで攻撃を完全に回避！(ダメージ0)`,
          'perk'
        );
        return;
      }
    } else {
      // Natural dodge based purely on high mobility (not a perk)
      const naturalDodgeChance = effectiveLeo.mobility * 0.004;
      if (Math.random() < naturalDodgeChance) {
        sound.playEvade();
        addLog(`💨【回避】レオは素早いステップで敵の攻撃をかわした！(ダメージ0)`, 'battle');
        return;
      }
    }

    // Check Parry Perk (50% damage reduction) - ONLY if learned (level > 0)!
    const parryLv = getPerkLevel('parry');
    let isParried = false;
    if (parryLv > 0) {
      const parryChance = parryLv * 0.12 + effectiveLeo.dexterity * 0.005;
      if (Math.random() < parryChance) {
        isParried = true;
      }
    }

    const hasFrostbite = ailments.some((a) => a.type === 'frostbite');
    const effectiveDef = hasFrostbite ? Math.round(effectiveLeo.def * 0.85) : effectiveLeo.def;

    // Iron Body Perk flat reduction (only if learned!)
    const ironBodyLv = getPerkLevel('iron_body');
    const ironBodyMitigation = ironBodyLv > 0 ? ironBodyLv * 3 : 0;

    let enemyDmg = Math.max(
      1,
      Math.round(activeEnemy.atk - effectiveDef * 0.4 + Math.random() * 3) - ironBodyMitigation
    );

    if (isParried && parryLv > 0) {
      sound.playShield();
      enemyDmg = Math.max(1, Math.round(enemyDmg * 0.5));
      addLog(
        `🛡️【特技：受け流し Lv${parryLv}】武器の刃先で衝撃を逃し、被ダメージを半減！(${enemyDmg}ダメージに抑制)`,
        'perk'
      );
    } else {
      sound.playHit();
      addLog(`${activeEnemy.name}の反撃！レオは ${enemyDmg} ダメージを受けた！`, 'danger');
    }

    const nextLeoHp = Math.max(0, currentHp - enemyDmg);
    setCurrentHp(nextLeoHp);

    // Enemy Ailment Infliction Check
    if (activeEnemy.inflictAilment && nextLeoHp > 0) {
      if (Math.random() < activeEnemy.inflictAilment.chance) {
        tryInflictAilment(
          activeEnemy.inflictAilment.type,
          activeEnemy.inflictAilment.level,
          activeEnemy.name
        );
      }
    }

    if (nextLeoHp <= 0) {
      const rescueSlot = (pouch.potion || []).findIndex(
        (id) => id && (ITEMS[id]?.hpRecovery || ITEMS[id]?.type === 'potion')
      );
      if (rescueSlot !== -1) {
        usePouchItem('potion', rescueSlot, 'emergency');
        return;
      }
      sound.playFail();
      addLog('レオは力尽きた…！安全圏へと緊急帰還します。', 'danger');
      setFinishReason('hp_zero');
      setIsFinished(true);
    } else {
      autoUseHpPotion(nextLeoHp);
    }
  };

  // Gimmick Resolution with 1d6 Dice Roll & 6 Stats Integration
  const handleGimmickStep = () => {
    if (!activeGimmick) return;

    if (!diceState) {
      // Start rolling dice!
      sound.playDiceRoll();

      // Stat bonus calculation with gadget bonuses
      let statBonus = Math.floor(effectiveLeo[activeGimmick.requiredStat] / 2);
      if (activeGimmick.requiredStat === 'observation' && hasGadget('magnifier')) {
        statBonus += 2;
      }
      if (activeGimmick.requiredStat === 'knowledge' && hasGadget('ancient_dictionary')) {
        statBonus += 2;
      }
      if (activeGimmick.requiredStat === 'endurance' && hasGadget('warding_talisman')) {
        statBonus += 2;
      }
      if (hasGadget('gadget_auto_compass')) {
        statBonus += 2;
      }

      const roll = Math.floor(Math.random() * 6) + 1; // 1d6 (1 to 6)
      const total = roll + statBonus;
      const diff = total - activeGimmick.difficulty;

      let outcome: DiceResultType = 'success';
      if (roll === 6 || diff >= 4) {
        outcome = 'critical_success';
      } else if (diff >= 0) {
        outcome = 'success';
      } else if (diff >= -2) {
        outcome = 'partial_failure';
      } else if (roll === 1 || diff <= -5) {
        outcome = 'critical_failure';
      } else {
        outcome = 'failure';
      }

      setDiceState({
        rolling: false,
        rollValue: roll,
        totalBonus: statBonus,
        totalResult: total,
        outcomeType: outcome,
      });

      // Apply Outcome Effects
      if (outcome === 'critical_success') {
        sound.playDiceCritical();
        const bonusExp = Math.round(activeGimmick.successExp * 1.5);
        setEarnedExp((prev) => prev + bonusExp);
        if (activeGimmick.successGold) {
          setEarnedGold((prev) => prev + activeGimmick.successGold! * 2);
        }
        addLog(
          `【判定：大成功！】出目${roll}+補正${statBonus}=${total} (難度${activeGimmick.difficulty})！${activeGimmick.criticalSuccessBonus || '最高の成果を収めた！'}`,
          'success'
        );
        if (activeGimmick.successReward) {
          gainItem(
            activeGimmick.successReward.itemId,
            activeGimmick.successReward.count * 2,
            '仕掛けの隠し底から'
          );
        }
      } else if (outcome === 'success') {
        sound.playDiceSuccess();
        setEarnedExp((prev) => prev + activeGimmick.successExp);
        if (activeGimmick.successGold) {
          setEarnedGold((prev) => prev + activeGimmick.successGold!);
        }
        addLog(
          `【判定：成功！】出目${roll}+補正${statBonus}=${total} (難度${activeGimmick.difficulty})！見事に仕掛けを突破した！`,
          'success'
        );
        if (activeGimmick.successReward) {
          gainItem(
            activeGimmick.successReward.itemId,
            activeGimmick.successReward.count,
            '仕掛けから'
          );
        }
      } else if (outcome === 'partial_failure') {
        sound.playTap();
        const acrobatLv = getPerkLevel('acrobat');
        let dmg = activeGimmick.partialDamage || 4;
        if (acrobatLv > 0) dmg = Math.max(1, Math.round(dmg * 0.5));
        setCurrentHp((prev) => Math.max(1, prev - dmg));
        setEarnedExp((prev) => prev + Math.round(activeGimmick.successExp * 0.5));
        addLog(
          `【判定：軽失敗】出目${roll}+補正${statBonus}=${total}。なんとか切り抜けたが、${dmg}の小ダメージを受けた。`,
          'danger'
        );
      } else if (outcome === 'critical_failure') {
        sound.playFail();
        const acrobatLv = getPerkLevel('acrobat');
        let dmg = (activeGimmick.failureDamage || 8) * 2;
        if (acrobatLv > 0) dmg = Math.max(2, Math.round(dmg * 0.5));
        setCurrentHp((prev) => Math.max(0, prev - dmg));
        addLog(
          `【判定：大失敗！】出目${roll}+補正${statBonus}=${total}！罠が暴発し、${dmg}の甚大なダメージ！`,
          'danger'
        );
        if (activeGimmick.failureAilment) {
          tryInflictAilment(
            activeGimmick.failureAilment.type,
            activeGimmick.failureAilment.level + 1,
            activeGimmick.title
          );
        }
      } else {
        sound.playFail();
        const acrobatLv = getPerkLevel('acrobat');
        let dmg = activeGimmick.failureDamage || 8;
        if (acrobatLv > 0) dmg = Math.max(1, Math.round(dmg * 0.5));
        setCurrentHp((prev) => Math.max(0, prev - dmg));
        addLog(
          `【判定：失敗】出目${roll}+補正${statBonus}=${total}。解除に失敗し、${dmg}のダメージを受けた。`,
          'danger'
        );
        if (activeGimmick.failureAilment) {
          tryInflictAilment(
            activeGimmick.failureAilment.type,
            activeGimmick.failureAilment.level,
            activeGimmick.title
          );
        }
      }
    } else {
      // Clear gimmick after step
      setActiveGimmick(null);
      setDiceState(null);
    }
  };

  // Helper: Weighted pool picker
  const pickFromPool = (pool: { itemId: string; weight: number }[]): string | null => {
    if (!pool.length) return null;
    const totalWeight = pool.reduce((acc, p) => acc + p.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of pool) {
      if (rand < item.weight) return item.itemId;
      rand -= item.weight;
    }
    return pool[0].itemId;
  };

  // Safe Retreat Action
  const handleRetreat = () => {
    sound.playTap();
    addLog('レオは安全を最優先にし、持ち帰れる荷物をまとめて帰路についた。', 'info');
    setFinishReason('retreated');
    setIsFinished(true);
  };

  // Finish & Collect All Rewards
  const handleCompleteAndReturn = () => {
    sound.playVictory();

    // 0. Sync remaining pouch items so consumed items are saved back to state
    updatePouch(pouch);

    // 1. Add all collected items to inventory
    Object.entries(obtainedItems).forEach(([itemId, count]) => {
      modifyInventory(itemId, count);
    });

    // 2. Add EXP, Gold, and RP
    if (earnedExp > 0) addExp(earnedExp);
    if (earnedGold > 0) addGold(earnedGold);
    if (earnedRp > 0) addRp(earnedRp);

    // 3. Advance Day (triggers rent, greenhouse, and alchemy progress)
    advanceDay();

    onClose();
  };

  // Log style color classes
  const getLogClass = (type: LogEntry['type']) => {
    switch (type) {
      case 'battle':
        return 'text-rose-600 bg-rose-50/70 border-rose-200';
      case 'harvest':
        return 'text-emerald-700 bg-emerald-50/70 border-emerald-200';
      case 'gimmick':
        return 'text-indigo-700 bg-indigo-50/70 border-indigo-200';
      case 'heal':
        return 'text-cyan-700 bg-cyan-50/70 border-cyan-200';
      case 'danger':
        return 'text-red-700 font-bold bg-red-100/80 border-red-300';
      case 'success':
        return 'text-amber-800 font-bold bg-amber-50/80 border-amber-300';
      case 'perk':
        return 'text-amber-950 font-bold bg-amber-100/90 border-amber-400 shadow-2xs';
      case 'gadget':
        return 'text-sky-950 font-bold bg-sky-100/90 border-sky-300 shadow-2xs';
      case 'ailment':
        return 'text-purple-950 font-bold bg-purple-100/90 border-purple-300 shadow-2xs';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / effectiveLeo.maxHp) * 100)));
  const staminaPercent = Math.max(
    0,
    Math.min(100, Math.round((currentStamina / effectiveLeo.maxStamina) * 100))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full h-[92vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden border border-amber-200">
        {/* Top Header */}
        <div
          className={`text-white p-3 sm:p-3.5 flex items-center justify-between shrink-0 shadow-xs transition-colors ${
            mode === 'dungeon'
              ? 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-800'
              : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}
        >
          <div className="min-w-0 flex-1 mr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Footprints className="w-4 h-4 text-amber-200 shrink-0" />
              <h2 className="text-sm sm:text-base font-black tracking-wide truncate">
                {mode === 'gathering' ? field?.name : dungeon?.name}
              </h2>

              {/* 迷宮攻略モーダル用：現在階の大きな表示 */}
              {mode === 'dungeon' && dungeon && (
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-amber-300/80 px-2.5 py-0.5 rounded-xl shadow-inner">
                  <span className="text-[10px] text-amber-300 font-black tracking-wider uppercase">
                    階層
                  </span>
                  <span className="font-mono text-base sm:text-lg font-black text-amber-300 drop-shadow-xs leading-none">
                    B{currentFloorIndex + 1}F
                  </span>
                  <span className="text-[10px] text-white/70 font-bold leading-none">
                    / B{dungeon.floorsCount || dungeon.floors.length}F
                  </span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-amber-100/90 mt-0.5 truncate font-medium">
              {mode === 'gathering'
                ? `進捗: ${currentStep} / ${field?.totalSteps || 0} 歩`
                : `${dungeon?.floors[currentFloorIndex]?.name || `第${currentFloorIndex + 1}層`} (探索度 ${explorationPoints}%)`}
            </div>
          </div>

          {/* Speed & Pause controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg bg-black/25 hover:bg-black/40 text-white active:scale-95 transition-transform border border-white/20"
              title={isPaused ? '再開' : '一時停止'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                sound.playTap();
                setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1));
              }}
              className="px-2 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-white font-mono font-bold text-xs active:scale-95 transition-transform flex items-center gap-0.5 border border-white/20"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>{speed}x</span>
            </button>
          </div>
        </div>

        {/* Status Display Area (HP, Stamina, Ailments, Gadgets, Pouch) */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 shrink-0 space-y-2">
          {/* Leo Status Bars */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* HP */}
            <div>
              <div className="flex items-center justify-between font-bold mb-1 text-[11px]">
                <span className="flex items-center gap-1 text-rose-600">
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                  HP
                </span>
                <span className="font-mono tabular-nums text-slate-700">
                  {currentHp}/{effectiveLeo.maxHp}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    hpPercent <= 30
                      ? 'bg-rose-600 animate-pulse'
                      : hpPercent <= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Stamina */}
            <div>
              <div className="flex items-center justify-between font-bold mb-1 text-[11px]">
                <span className="flex items-center gap-1 text-amber-600">
                  <Zap className="w-3.5 h-3.5 fill-amber-500" />
                  体力
                </span>
                <span className="font-mono tabular-nums text-slate-700">
                  {currentStamina}/{effectiveLeo.maxStamina}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    staminaPercent <= 25 ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${staminaPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Active Status Ailments Row (Phase 2) */}
          {ailments.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-black text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                異常:
              </span>
              {ailments.map((a) => {
                const info = getAilmentInfo(a.type);
                const IconComponent = info.icon;
                return (
                  <div
                    key={a.type}
                    title={`${info.name}: ${info.desc}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ring-1 animate-pulse shadow-2xs ${info.badgeClass}`}
                  >
                    <IconComponent className="w-3 h-3 shrink-0" />
                    <span>{info.name} Lv{a.level}</span>
                    <span className="text-[9px] opacity-75 font-mono">({a.turnsRemaining}T)</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Gadgets & Perks Status Bar (Phase 2) */}
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 overflow-x-auto gap-2">
            <div className="flex items-center gap-1 shrink-0 text-slate-500 font-bold">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>所持品効果:</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {hasGadget('hunters_shortbow') && (
                <span className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-black whitespace-nowrap">
                  🏹 先制射撃
                </span>
              )}
              {hasGadget('magnifier') && (
                <span className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-black whitespace-nowrap">
                  🔍 観察+2
                </span>
              )}
              {hasGadget('ancient_dictionary') && (
                <span className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-black whitespace-nowrap">
                  📖 知識+2・弱点
                </span>
              )}
              {hasGadget('warding_talisman') && (
                <span className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-black whitespace-nowrap">
                  🛡️ 異常耐性
                </span>
              )}
              {hasGadget('camp_kit') && (
                <span className="bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-black whitespace-nowrap">
                  ⛺ 野営回復
                </span>
              )}

              {/* Active perks */}
              {(state.perks || [])
                .filter((p) => p.level > 0)
                .map((p) => (
                  <span
                    key={p.id}
                    className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-black whitespace-nowrap"
                  >
                    ⚡{p.name} Lv{p.level}
                  </span>
                ))}
            </div>
          </div>

          {/* Dungeon Exploration Progress Gauge (if in Dungeon) */}
          {mode === 'dungeon' && (
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                <span>階層踏破進捗 (探検ポイント)</span>
                <span className="font-mono tabular-nums">{explorationPoints}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${explorationPoints}%` }}
                />
              </div>
            </div>
          )}

          {/* Pouch Quick Tap row */}
          <div className="pt-1.5 border-t border-slate-200/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">
                  <Backpack className="w-3.5 h-3.5 text-emerald-600" />
                  携帯ポーチ
                </span>
                <span className="text-[9px] text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded-md font-bold border border-amber-200">
                  自動服用対応
                </span>
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-1">
                {(['potion', 'food', 'consumable', 'gadget'] as PouchCategory[]).map((cat) => {
                  const itemsInCat = (pouch[cat] || []).filter(Boolean).length;
                  const label = cat === 'potion' ? '薬' : cat === 'food' ? '食' : cat === 'consumable' ? '品' : '装';
                  const isActive = activePouchTab === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActivePouchTab(cat)}
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-black transition-all ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {label} ({itemsInCat})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {(pouch[activePouchTab] || []).length === 0 ? (
                <div className="text-[10px] text-slate-400 py-1">スロットなし</div>
              ) : (
                (pouch[activePouchTab] || []).map((itemId, idx) => {
                  const it = itemId ? ITEMS[itemId] : null;
                  const isStaminaLow = currentStamina <= effectiveLeo.maxStamina * 0.4;
                  const isHpLow = currentHp <= effectiveLeo.maxHp * 0.4;
                  const isPotion = activePouchTab === 'potion';
                  const isFood = activePouchTab === 'food';
                  const isConsumable = activePouchTab === 'consumable';
                  const isAilmentCure = it?.cureAilments && ailments.length > 0;
                  const shouldPulse =
                    (isPotion && isHpLow) ||
                    (isFood && isStaminaLow) ||
                    (isConsumable && !!activeEnemy) ||
                    isAilmentCure;

                  return (
                    <button
                      key={idx}
                      disabled={!it || isFinished || activePouchTab === 'gadget'}
                      onClick={() => usePouchItem(activePouchTab, idx, 'manual')}
                      title={it ? `${it.name} (タップで使用)` : '空'}
                      className={`h-7 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all shrink-0 ${
                        it
                          ? shouldPulse
                            ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-400/50 animate-pulse'
                            : 'bg-white border-amber-300 text-amber-900 shadow-2xs hover:bg-amber-50 active:scale-95'
                          : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {it ? (
                        <>
                          <ItemIcon name={it.icon} className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[80px]">{it.name}</span>
                          {activePouchTab === 'gadget' && (
                            <span className="text-[8px] bg-cyan-100 text-cyan-800 px-1 rounded-sm">常時</span>
                          )}
                        </>
                      ) : (
                        '空'
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Center Encounter Stage (Battle / Gimmick Dice Roll / Walking) */}
        <div className="p-3 bg-gradient-to-b from-amber-50/50 to-white shrink-0 border-b border-slate-200">
          {activeEnemy ? (
            /* Active Battle View */
            <div className="bg-rose-50/80 rounded-2xl p-3 border border-rose-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    ⚔️
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-rose-950">{activeEnemy.name}</h4>
                      {activeEnemy.inflictAilment && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold border border-purple-200">
                          {getAilmentInfo(activeEnemy.inflictAilment.type).name}攻撃
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-rose-600 font-semibold">
                      ATK {activeEnemy.atk} · DEF {activeEnemy.def}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-rose-800 tabular-nums">
                    HP {enemyHp}/{activeEnemy.maxHp}
                  </span>
                </div>
              </div>

              {/* Enemy HP Bar */}
              <div className="w-full h-2.5 bg-rose-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 transition-all duration-200 rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, (enemyHp / activeEnemy.maxHp) * 100))}%`,
                  }}
                />
              </div>

              {/* Battle Throw Quick Actions (Phase 2) */}
              <div className="flex items-center gap-1 pt-1 overflow-x-auto">
                <span className="text-[9px] font-bold text-rose-800 shrink-0">即時投擲:</span>
                {(pouch.consumable || []).map((itemId, idx) => {
                  if (!itemId) return null;
                  const it = ITEMS[itemId];
                  if (!it) return null;
                  const isCombatUsable =
                    it.id === 'bomb_fire' ||
                    it.id === 'throwing_knife' ||
                    it.id === 'smoke_bomb' ||
                    it.cureAilments;
                  if (!isCombatUsable) return null;

                  return (
                    <button
                      key={idx}
                      onClick={() => usePouchItem('consumable', idx, 'manual')}
                      className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-white border border-rose-300 text-rose-900 shadow-2xs hover:bg-rose-100 active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      <ItemIcon name={it.icon} className="w-3 h-3 text-rose-600" />
                      <span>{it.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : activeGimmick ? (
            /* Active Gimmick & Dice View */
            <div className="bg-indigo-50/90 rounded-2xl p-3 border border-indigo-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                      仕掛け発動
                    </span>
                    <span className="text-[9px] font-bold text-indigo-700 bg-white border border-indigo-200 px-1.5 py-0.2 rounded-md">
                      {activeGimmick.statName}判定
                    </span>
                    {activeGimmick.failureAilment && (
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md">
                        失敗時: {getAilmentInfo(activeGimmick.failureAilment.type).name}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-indigo-950 mt-1">
                    {activeGimmick.title}
                  </h4>
                  <p className="text-[11px] text-indigo-800 leading-tight mt-0.5">
                    {activeGimmick.description}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-indigo-300 shadow-sm flex flex-col items-center justify-center shrink-0">
                  <Dices className="w-4 h-4 text-indigo-500 mb-0.5" />
                  <span className="text-[9px] font-bold text-indigo-900">
                    難度 {activeGimmick.difficulty}
                  </span>
                </div>
              </div>

              {diceState && (
                <div className="bg-white rounded-xl p-2 text-center border border-indigo-200 shadow-inner flex items-center justify-around">
                  <div className="text-xs font-bold text-slate-700">
                    出目 <span className="text-base text-indigo-600 font-mono">{diceState.rollValue}</span>
                  </div>
                  <span className="text-slate-400">+</span>
                  <div className="text-xs font-bold text-slate-700">
                    {activeGimmick.statName}補正{' '}
                    <span className="text-base text-indigo-600 font-mono">
                      +{diceState.totalBonus}
                    </span>
                  </div>
                  <span className="text-slate-400">=</span>
                  <div className="text-xs font-bold text-slate-900">
                    計 <span className="text-base font-black font-mono">{diceState.totalResult}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Relaxed Exploration View */
            <div className="flex items-center justify-between text-xs py-1 px-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-amber-500 animate-bounce" />
                <span className="font-semibold text-slate-700">
                  レオは周囲を警戒しながら前進中…
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {earnedRp > 0 && (
                  <span className="text-sky-700 font-bold flex items-center gap-1 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded-md">
                    <BookOpen className="w-3 h-3 text-sky-600" />
                    <span>+{earnedRp} RP</span>
                  </span>
                )}
                <span className="text-emerald-700 font-bold">
                  獲得素材: {Object.values(obtainedItems).reduce((a, b) => a + b, 0)}個
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Text Log Stream */}
        <div
          ref={logContainerRef}
          className="flex-1 p-3 overflow-y-auto space-y-1.5 bg-slate-50/70 font-sans text-xs"
        >
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-2 rounded-xl border text-[11px] leading-relaxed transition-all shadow-2xs ${getLogClass(
                log.type
              )}`}
            >
              {log.text}
            </div>
          ))}
        </div>

        {/* Bottom Actions Bar (During Run) */}
        {!isFinished && (
          <div className="p-3 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between gap-2">
            <button
              onClick={handleRetreat}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>荷物を持って帰還</span>
            </button>

            <span className="text-[11px] text-slate-500 font-medium">
              ※帰還しても入手した素材・EXP・RPはすべて持ち帰れます
            </span>
          </div>
        )}

        {/* Results Modal Overlay (When Finished) */}
        {isFinished && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm p-5 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="text-center my-3">
                {finishReason === 'cleared' ? (
                  <div className="inline-flex p-3 rounded-full bg-amber-100 text-amber-600 mb-2 border border-amber-300 shadow-sm animate-bounce">
                    <Crown className="w-8 h-8 fill-amber-400" />
                  </div>
                ) : finishReason === 'completed' ? (
                  <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600 mb-2 border border-emerald-300 shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="inline-flex p-3 rounded-full bg-rose-100 text-rose-600 mb-2 border border-rose-300 shadow-sm">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                )}

                <h3 className="text-lg font-black text-slate-900">
                  {finishReason === 'cleared'
                    ? '🎉 迷宮完全踏破！'
                    : finishReason === 'completed'
                    ? '🌿 採取大成功！'
                    : finishReason === 'retreated'
                    ? '⛺ 無事に帰還完了'
                    : '⚠️ 疲労による緊急帰還'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  1日が経過し、アトリエの設備やレオの体力が整います。
                </p>
              </div>

              {/* Summary Metrics */}
              <div className={`grid gap-2 my-3 ${earnedRp > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="bg-amber-50 rounded-2xl p-2.5 sm:p-3 border border-amber-200 text-center shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-bold">獲得経験値</div>
                  <div className="text-sm sm:text-base font-black text-amber-700 font-mono tabular-nums">
                    +{earnedExp} EXP
                  </div>
                </div>
                <div className="bg-amber-50 rounded-2xl p-2.5 sm:p-3 border border-amber-200 text-center shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-bold">獲得ゴールド</div>
                  <div className="text-sm sm:text-base font-black text-amber-700 font-mono tabular-nums">
                    +{earnedGold} G
                  </div>
                </div>
                {earnedRp > 0 && (
                  <div className="bg-sky-50 rounded-2xl p-2.5 sm:p-3 border border-sky-200 text-center shadow-2xs">
                    <div className="text-[10px] text-sky-700 font-bold flex items-center justify-center gap-1">
                      <BookOpen className="w-3 h-3 text-sky-600" />
                      <span>獲得RP</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-sky-700 font-mono tabular-nums">
                      +{earnedRp} RP
                    </div>
                  </div>
                )}
              </div>

              {/* Harvested Items List */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-3">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>持ち帰りアイテム</span>
                  <span className="text-[10px] text-slate-500">
                    全 {Object.values(obtainedItems).reduce((a, b) => a + b, 0)} 個
                  </span>
                </div>
                {Object.keys(obtainedItems).length === 0 ? (
                  <div className="text-center py-3 text-xs text-slate-400">
                    持ち帰ったアイテムはありません
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    {Object.entries(obtainedItems).map(([id, count]) => {
                      const item = ITEMS[id];
                      const isParchment = id === 'ancient_parchment';
                      return (
                        <div
                          key={id}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                            isParchment
                              ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-300/60'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item && <ItemIcon name={item.icon} className="w-3.5 h-3.5" />}
                            <span className="text-[11px] font-bold text-slate-800 truncate">
                              {item?.name || id}
                            </span>
                            {isParchment && (
                              <span className="text-[9px] font-black text-sky-700 bg-sky-100 px-1 py-0.2 rounded shrink-0">
                                RP変換済
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono font-bold text-amber-900 shrink-0">
                            x{count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action Return Button */}
            <button
              onClick={handleCompleteAndReturn}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-lg shadow-amber-500/25 active:scale-98 transition-all"
            >
              アイテムをしまってアトリエへ帰還 (1日終了)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
