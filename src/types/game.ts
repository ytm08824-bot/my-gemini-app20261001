export type StatKey =
  | 'hp'
  | 'maxStamina'
  | 'atk'
  | 'def'
  | 'observation'   // 観察力 (宝箱・採取)
  | 'endurance'     // 頑健 (耐久・体力計算・状態異常耐性)
  | 'dexterity'     // 身体技巧力 (罠解除・仕掛け・会心)
  | 'mobility'      // 身体操作力 (回避・体力計算)
  | 'knowledge'     // 知識 (弱点・古代文字・解毒)
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

// 携帯ポーチカテゴリ
export type PouchCategory = 'potion' | 'food' | 'consumable' | 'gadget';

export interface PouchCapacity {
  potion: number;     // ポーションベルト (最大10)
  food: number;       // 食糧ポシェット (最大8)
  consumable: number; // アイテムポーチ (最大8)
  gadget: number;     // ガジェットポーチ (最大3)
}

export interface PouchState {
  potion: (string | null)[];
  food: (string | null)[];
  consumable: (string | null)[];
  gadget: (string | null)[];
}

// 装備型ポーチセット
export interface PouchGear {
  id: string;
  name: string;
  description: string;
  capacity: PouchCapacity;
  buyPrice: number;
  sellPrice: number;
  requiredDungeonsCleared: number;
  icon: string;
}

// 状態異常種別
export type AilmentType = 'poison' | 'paralysis' | 'frostbite';

export interface StatusAilment {
  type: AilmentType;
  level: number;
  name: string;
  description: string;
}

// 特技（Perk）
export interface Perk {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  requiredStats: Partial<Record<StatKey, number>>;
  requiredExp: number;
  effectType: 'strong_strike' | 'parry' | 'evasion' | 'detox' | 'scavenger' | 'stamina_conserve' | string;
  icon: string;
}

// 依頼（Quest）
export interface Quest {
  id: string;
  title: string;
  client: string;
  description: string;
  targetItemId: string;
  targetCount: number;
  rewardGold: number;
  rewardRp?: number;
  rewardItems?: { itemId: string; count: number }[];
  isCompleted: boolean;
  isClaimed: boolean;
  requiredDungeonsCleared?: number;
  isRepeatable?: boolean;
}

export type ItemType =
  | 'material'
  | 'potion'
  | 'food'
  | 'consumable'
  | 'gadget'
  | 'equipment'
  | 'valuable'
  | 'pouch_gear'
  | 'offensive'; // backwards compat

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  pouchCategory?: PouchCategory;
  icon: string;
  rarity: 1 | 2 | 3 | 4;
  sellPrice: number;
  buyPrice?: number;
  effectValue?: number;
  hpRecovery?: number;
  staminaRecovery?: number;
  cureAilments?: AilmentType[];
  gadgetType?: string;
  gadgetBonus?: { stat?: StatKey; value?: number; special?: string };
  pouchCapacity?: PouchCapacity;
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
  isDiscovered?: boolean; // 素材発見連動: 必要素材を入手すると研究可能に
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
  inflictAilment?: { type: AilmentType; chance: number; level: number };
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
  failureAilment?: { type: AilmentType; level: number };
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
  requiredDungeonsCleared?: number;
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
  rumorDescription?: string; // 未踏破時の伝聞テキスト
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
  type: 'info' | 'battle' | 'harvest' | 'gimmick' | 'heal' | 'danger' | 'success' | 'perk' | 'ailment' | 'gadget';
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
  equippedPouch: string; // PouchGear id (初期は 'pouch_starter')
  ownedPouchGears: string[];
  pouch: PouchState; // 4カテゴリ構成
  perks: Perk[];
  quests: Quest[];
  unlockedMaterials: string[];
  shopStock: Record<string, number>; // itemId -> remaining stock for the day
  inventory: Record<string, number>; // itemId -> count
  recipes: Recipe[];
  alchemySlots: AlchemySlot[];
  facilities: Facility[];
  dungeons: Dungeon[];
  trophies: string[];
  totalAdventurersCompleted: number;
}
