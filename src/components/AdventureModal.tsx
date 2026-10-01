import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import {
  GatheringField,
  Dungeon,
  DungeonFloor,
  Enemy,
  Gimmick,
  LogEntry,
  StatKey,
  DiceResultType,
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
} from 'lucide-react';
import { sound } from '../utils/sound';

interface AdventureModalProps {
  mode: 'gathering' | 'dungeon';
  field?: GatheringField;
  dungeon?: Dungeon;
  onClose: () => void;
}

export const AdventureModal: React.FC<AdventureModalProps> = ({
  mode,
  field,
  dungeon,
  onClose,
}) => {
  const { effectiveLeo, state, advanceDay, modifyInventory, addExp, addGold, addRp, clearDungeon, updatePouch } =
    useGame();

  // Active status
  const [currentHp, setCurrentHp] = useState<number>(effectiveLeo.hp);
  const [currentStamina, setCurrentStamina] = useState<number>(effectiveLeo.maxStamina);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currentFloorIndex, setCurrentFloorIndex] = useState<number>(0);
  const [explorationPoints, setExplorationPoints] = useState<number>(0);

  // Adventure pouch active copy
  const [pouch, setPouch] = useState<(string | null)[]>([...state.pouch]);

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

  const addLog = (
    text: string,
    type: 'info' | 'battle' | 'harvest' | 'gimmick' | 'heal' | 'danger' | 'success'
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

  // Helper: Gain item with instant Ancient Parchment to RP conversion
  const PARCHMENT_RP_VALUE = 25; // 羊皮紙1枚につき25RPに即座変換
  const gainItem = (itemId: string, count: number = 1, prefix: string = '') => {
    const itemObj = ITEMS[itemId];
    const itemName = itemObj?.name || itemId;

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
  }, []);

  // Use Pouch Item
  const usePouchItem = (slotIdx: number, trigger: 'manual' | 'auto' | 'emergency' = 'manual') => {
    const itemId = pouch[slotIdx];
    if (!itemId) return false;

    const item = ITEMS[itemId];
    if (!item) return false;

    sound.playHeal();
    const tag =
      trigger === 'emergency'
        ? '【緊急服用】'
        : trigger === 'auto'
        ? '【自動服用】'
        : '【携帯薬使用】';

    if (item.id === 'potion_small' || item.id === 'potion_high') {
      const healAmount = item.effectValue || 35;
      setCurrentHp((prev) => Math.min(effectiveLeo.maxHp, prev + healAmount));
      addLog(`${tag}レオはポーチの【${item.name}】を飲み、HPが ${healAmount} 回復した！`, 'heal');
    } else if (item.id === 'stamina_tonic') {
      const staminaAmount = item.effectValue || 15;
      setCurrentStamina((prev) => Math.min(effectiveLeo.maxStamina, prev + staminaAmount));
      addLog(`${tag}レオはポーチの【${item.name}】を飲み、体力が ${staminaAmount} 回復した！`, 'heal');
    } else if (item.id === 'elixir_vital') {
      setCurrentHp(effectiveLeo.maxHp);
      setCurrentStamina(effectiveLeo.maxStamina);
      addLog(`${tag}レオはポーチの【${item.name}】を飲み、HPと体力が全快した！`, 'heal');
    } else if (item.id === 'bomb_fire') {
      if (activeEnemy) {
        sound.playHit();
        const dmg = item.effectValue || 45;
        setEnemyHp((prev) => Math.max(0, prev - dmg));
        addLog(`火炎フラスコを投擲！${activeEnemy.name}に ${dmg} の炎熱大ダメージ！`, 'battle');
      }
    }

    setPouch((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
    return true;
  };

  // Check and Auto-Use Stamina Tonic when stamina drops <= 40% (or <= 12)
  const autoUseStaminaTonic = (staminaVal: number): boolean => {
    const threshold = Math.max(12, Math.round(effectiveLeo.maxStamina * 0.4));
    if (staminaVal <= threshold) {
      const slotIdx = pouch.findIndex(
        (id) => id === 'stamina_tonic' || id === 'elixir_vital'
      );
      if (slotIdx !== -1) {
        return usePouchItem(slotIdx, 'auto');
      }
    }
    return false;
  };

  // Check and Auto-Use HP Potion when HP drops <= 40% (or <= 18)
  const autoUseHpPotion = (hpVal: number): boolean => {
    const threshold = Math.max(18, Math.round(effectiveLeo.maxHp * 0.4));
    if (hpVal <= threshold) {
      const slotIdx = pouch.findIndex(
        (id) => id === 'potion_small' || id === 'potion_high' || id === 'elixir_vital'
      );
      if (slotIdx !== -1) {
        return usePouchItem(slotIdx, 'auto');
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
  ]);

  // Main Step Resolver
  const resolveStep = () => {
    // 0. Auto-check HP and Stamina recoveries before action
    autoUseStaminaTonic(currentStamina);
    autoUseHpPotion(currentHp);

    // Check stamina exhaustion with emergency last-second rescue
    if (currentStamina <= 0) {
      const rescueSlot = pouch.findIndex(
        (id) => id === 'stamina_tonic' || id === 'elixir_vital'
      );
      if (rescueSlot !== -1) {
        usePouchItem(rescueSlot, 'emergency');
        return;
      }
      sound.playFail();
      addLog('レオの体力が尽き疲労困憊…！これ以上の探索は危険なため撤退します。', 'danger');
      setFinishReason('stamina_zero');
      setIsFinished(true);
      return;
    }

    // Check HP death with emergency last-second rescue
    if (currentHp <= 0) {
      const rescueSlot = pouch.findIndex(
        (id) => id === 'potion_small' || id === 'potion_high' || id === 'elixir_vital'
      );
      if (rescueSlot !== -1) {
        usePouchItem(rescueSlot, 'emergency');
        return;
      }
      sound.playFail();
      addLog('レオのHPが尽きて力尽きた…！安全圏へと緊急帰還します。', 'danger');
      setFinishReason('hp_zero');
      setIsFinished(true);
      return;
    }

    // 1. If currently in Battle
    if (activeEnemy) {
      handleBattleStep();
      return;
    }

    // 2. If currently in Gimmick
    if (activeGimmick) {
      handleGimmickStep();
      return;
    }

    // 3. Normal Exploration Step
    if (mode === 'gathering' && field) {
      handleGatheringStep();
    } else if (mode === 'dungeon' && dungeon) {
      handleDungeonStep();
    }
  };

  // Gathering step logic
  const handleGatheringStep = () => {
    if (!field) return;

    // Deduct stamina
    const nextStamina = Math.max(0, currentStamina - field.staminaCostPerStep);
    setCurrentStamina(nextStamina);

    // Auto-check stamina recovery
    autoUseStaminaTonic(nextStamina);

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Check completion of gathering route
    if (nextStep >= field.totalSteps) {
      sound.playVictory();
      addLog(`【採取完了】${field.name}の全行程を踏破し、採取袋がいっぱいになった！`, 'success');
      setFinishReason('completed');
      setIsFinished(true);
      return;
    }

    // 40% enemy encounter, 60% harvest
    const roll = Math.random();
    if (roll < 0.38 && field.enemies.length > 0) {
      // Encounter enemy
      const enemyTemplate = field.enemies[Math.floor(Math.random() * field.enemies.length)];
      const spawnedEnemy: Enemy = JSON.parse(JSON.stringify(enemyTemplate));
      setActiveEnemy(spawnedEnemy);
      setEnemyHp(spawnedEnemy.maxHp);
      sound.playHit();
      addLog(`魔物【${spawnedEnemy.name}】が現れた！身構えろ！`, 'battle');
    } else {
      // Harvest item
      const itemHarvested = pickFromPool(field.harvestPool);
      if (itemHarvested) {
        sound.playTap();
        gainItem(itemHarvested, 1, '草むらをかき分け、');
      }
    }
  };

  // Dungeon step logic
  const handleDungeonStep = () => {
    if (!dungeon) return;
    const floor = dungeon.floors[currentFloorIndex];
    if (!floor) return;

    // Deduct stamina (dungeons take 2 stamina per step)
    const nextStamina = Math.max(0, currentStamina - 2);
    setCurrentStamina(nextStamina);

    // Auto-check stamina recovery
    autoUseStaminaTonic(nextStamina);

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

    // Step Event: Gimmick (30%), Enemy (35%), Harvest/Treasure (35%)
    const eventRoll = Math.random();
    if (eventRoll < 0.35 && floor.gimmicks.length > 0) {
      // Gimmick triggered!
      const gimmick = floor.gimmicks[Math.floor(Math.random() * floor.gimmicks.length)];
      setActiveGimmick(gimmick);
      sound.playDiceShake();
      addLog(`【仕掛け発見】${gimmick.title}が現れた！(${gimmick.statName}判定)`, 'gimmick');
    } else if (eventRoll < 0.7 && floor.enemies.length > 0) {
      // Enemy battle!
      const enemyTemplate = floor.enemies[Math.floor(Math.random() * floor.enemies.length)];
      const spawned = JSON.parse(JSON.stringify(enemyTemplate));
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
      }
    }
  };

  // Turn-based Battle Step
  const handleBattleStep = () => {
    if (!activeEnemy) return;

    autoUseHpPotion(currentHp);

    // 1. Leo attacks
    sound.playSlash();
    const leoDmg = Math.max(3, Math.round(effectiveLeo.atk - activeEnemy.def * 0.5 + Math.random() * 4));
    const nextEnemyHp = Math.max(0, enemyHp - leoDmg);
    setEnemyHp(nextEnemyHp);
    addLog(`レオの連撃！${activeEnemy.name}に ${leoDmg} ダメージを与えた！`, 'battle');

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
          gainItem(drop.itemId, 1, 'ドロップ品');
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

    // 2. Enemy attacks Leo
    sound.playHit();
    const enemyDmg = Math.max(2, Math.round(activeEnemy.atk - effectiveLeo.def * 0.4 + Math.random() * 3));
    const nextLeoHp = Math.max(0, currentHp - enemyDmg);
    setCurrentHp(nextLeoHp);
    addLog(`${activeEnemy.name}の反撃！レオは ${enemyDmg} ダメージを受けた！`, 'danger');

    if (nextLeoHp <= 0) {
      const rescueSlot = pouch.findIndex(
        (id) => id === 'potion_small' || id === 'potion_high' || id === 'elixir_vital'
      );
      if (rescueSlot !== -1) {
        usePouchItem(rescueSlot, 'emergency');
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

  // Gimmick Resolution with 1d6 Dice Roll
  const handleGimmickStep = () => {
    if (!activeGimmick) return;

    if (!diceState) {
      // Start rolling dice!
      sound.playDiceRoll();
      const statBonus = Math.floor(effectiveLeo[activeGimmick.requiredStat] / 2);
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
            '仕掛けの隠し箱から'
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
        const dmg = activeGimmick.partialDamage || 4;
        setCurrentHp((prev) => Math.max(1, prev - dmg));
        setEarnedExp((prev) => prev + Math.round(activeGimmick.successExp * 0.5));
        addLog(
          `【判定：軽失敗】出目${roll}+補正${statBonus}=${total}。なんとか切り抜けたが、${dmg}の小ダメージを受けた。`,
          'danger'
        );
      } else if (outcome === 'critical_failure') {
        sound.playFail();
        const dmg = (activeGimmick.failureDamage || 8) * 2;
        setCurrentHp((prev) => Math.max(0, prev - dmg));
        addLog(
          `【判定：大失敗！】出目${roll}+補正${statBonus}=${total}！罠が暴発し、${dmg}の甚大なダメージ！`,
          'danger'
        );
      } else {
        sound.playFail();
        const dmg = activeGimmick.failureDamage || 8;
        setCurrentHp((prev) => Math.max(0, prev - dmg));
        addLog(
          `【判定：失敗】出目${roll}+補正${statBonus}=${total}。解除に失敗し、${dmg}のダメージを受けた。`,
          'danger'
        );
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

    // 3. Advance Day (triggers greenhouse harvest, alchemy progress, and week rent check!)
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
      <div className="bg-white rounded-3xl max-w-md w-full h-[92vh] max-h-[800px] flex flex-col shadow-2xl overflow-hidden border border-amber-200">
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

        {/* Meters (HP, Stamina, Floor/Progress) */}
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
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-700 flex items-center gap-1">
                <Backpack className="w-3.5 h-3.5 text-emerald-600" />
                携帯ポーチ
              </span>
              <span className="text-[9px] text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded-md font-bold border border-amber-200">
                自動使用対応
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {pouch.map((itemId, idx) => {
                const it = itemId ? ITEMS[itemId] : null;
                const isStaminaItem = it && (it.id === 'stamina_tonic' || it.id === 'elixir_vital');
                const isHpItem = it && (it.id === 'potion_small' || it.id === 'potion_high' || it.id === 'elixir_vital');
                const isLowStamina = currentStamina <= effectiveLeo.maxStamina * 0.4;
                const isLowHp = currentHp <= effectiveLeo.maxHp * 0.4;
                const shouldPulse = (isStaminaItem && isLowStamina) || (isHpItem && isLowHp);

                return (
                  <button
                    key={idx}
                    disabled={!it || isFinished}
                    onClick={() => usePouchItem(idx, 'manual')}
                    title={it ? `${it.name} (タップで使用 / HP・体力低下時自動)` : '空'}
                    className={`h-7 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
                      it
                        ? shouldPulse
                          ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-400/50 animate-pulse'
                          : 'bg-white border-amber-300 text-amber-900 shadow-2xs hover:bg-amber-50 active:scale-95'
                        : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {it ? (
                      <>
                        <ItemIcon name={it.icon} className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[65px]">{it.name}</span>
                      </>
                    ) : (
                      '空'
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Center Encounter Stage (Battle / Gimmick Dice Roll / Walking) */}
        <div className="p-3 bg-gradient-to-b from-amber-50/50 to-white shrink-0 border-b border-slate-200">
          {activeEnemy ? (
            /* Active Battle View */
            <div className="bg-rose-50/80 rounded-2xl p-3 border border-rose-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    ⚔️
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-950">{activeEnemy.name}</h4>
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
              <div className="w-full h-2.5 bg-rose-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 transition-all duration-200 rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, (enemyHp / activeEnemy.maxHp) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : activeGimmick ? (
            /* Active Gimmick & Dice View */
            <div className="bg-indigo-50/90 rounded-2xl p-3 border border-indigo-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-extrabold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                    仕掛け発動
                  </span>
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
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>荷物を持って帰還</span>
            </button>

            <span className="text-[11px] text-slate-500">
              ※帰還しても入手した素材・EXPは持ち帰れます
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
