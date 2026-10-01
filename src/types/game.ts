export type StatKey =
  | 'hp'
  | 'maxStamina'
  | 'atk'
  | 'def'
  | 'observation'   // 観察力 (宝箱・採取)
  | 'endurance'     // 頑健 (耐久・体力計算)
  | 'dexterity'     // 身体技巧力 (罠解除・仕掛け)
  | 'mobility'      // 身体操作力 (回避・体力計算)
  | 'knowledge'     // 知識 (弱点・古代文字)
  | 'social';       // 社交 (交渉・買物)

export interface LeoStats {
  level: number;
  exp: number;
  maxHp: number;
  hp: number;
  maxStamina: number;
  stamina: number;
  atk: number;
  def: number;
  observation: number;
  endurance: number;
  dexterity: number;
  mobility: number;
  knowledge: number;
  social: number;
}

export type ItemType = 'material' | 'potion' | 'offensive' | 'equipment' | 'valuable';

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  icon: string;
  rarity: 1 | 2 | 3 | 4;
  sellPrice: number;
  buyPrice?: number;
  effectValue?: number;
  equipSlot?: EquipmentSlot;
  equipStats?: Partial<Record<StatKey, number>>;
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface Recipe {
  id: string;
  name: string;
  resultItemId: string;
  resultCount: number;
  category: 'recovery' | 'battle' | 'valuable' | 'equipment';
  researchCostRp: number;
  isResearched: boolean;
  ingredients: { itemId: string; count: number }[];
  timeDays: number; // 調合所要日数 (最低1日。冒険1回/1日経過で完成)
}

export interface AlchemySlot {
  slotIndex: number;
  recipeId: string | null;
  status: 'empty' | 'crafting' | 'completed';
  turnsRemaining: number;
}

export interface Facility {
  id: 'cauldron' | 'slot_boost' | 'library';
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseUpgradeCost: number;
  weeklyCostPerLevel: number;
  icon: string;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  expReward: number;
  goldReward: number;
  dropItems: { itemId: string; chance: number }[];
  icon: string;
}

export type DiceResultType = 'critical_success' | 'success' | 'partial_failure' | 'failure' | 'critical_failure';

export interface Gimmick {
  id: string;
  title: string;
  description: string;
  requiredStat: StatKey;
  statName: string;
  difficulty: number;
  successExp: number;
  successReward?: { itemId: string; count: number };
  successGold?: number;
  partialDamage?: number;
  failureDamage?: number;
  criticalSuccessBonus?: string;
  criticalFailureDamage?: number;
}

export interface GatheringField {
  id: string;
  name: string;
  description: string;
  recommendedLevel: number;
  staminaCostPerStep: number;
  totalSteps: number;
  enemies: Enemy[];
  harvestPool: { itemId: string; weight: number }[];
  bgGradient: string;
  icon: string;
}

export interface DungeonFloor {
  floorNumber: number;
  name: string;
  maxExplorationPoints: number;
  enemies: Enemy[];
  gimmicks: Gimmick[];
  harvestPool: { itemId: string; weight: number }[];
  boss?: Enemy;
}

export interface Dungeon {
  id: string;
  name: string;
  description: string;
  recommendedLevel: number;
  floorsCount: number;
  floors: DungeonFloor[];
  bgGradient: string;
  icon: string;
  isUnlocked: boolean;
  isCleared: boolean;
  clearRewardItem: string;
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'info' | 'battle' | 'harvest' | 'gimmick' | 'heal' | 'danger' | 'success';
  timestamp: number;
}

export interface GameState {
  day: number;
  gold: number;
  researchPoints: number;
  leo: LeoStats;
  equipped: {
    weapon: string | null;
    armor: string | null;
    accessory: string | null;
  };
  pouch: (string | null)[]; // Max 4 slots for items to carry
  inventory: Record<string, number>; // itemId -> count
  recipes: Recipe[];
  alchemySlots: AlchemySlot[];
  facilities: Facility[];
  dungeons: Dungeon[];
  trophies: string[];
  totalAdventurersCompleted: number;
}
