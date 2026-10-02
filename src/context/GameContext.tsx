import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  GameState,
  LeoStats,
  StatKey,
  EquipmentSlot,
  Recipe,
  AlchemySlot,
  Facility,
  Dungeon,
  PouchCategory,
  PouchState,
  Perk,
  Quest,
} from '../types/game';
import {
  INITIAL_LEO_STATS,
  ITEMS,
  INITIAL_RECIPES,
  INITIAL_FACILITIES,
  INITIAL_DUNGEONS,
  POUCH_GEARS,
  INITIAL_PERKS,
  INITIAL_QUESTS,
  FIELD_SHOP_ITEMS,
} from '../data/initialData';
import { sound } from '../utils/sound';

interface RentEventData {
  amount: number;
  isPaid: boolean;
  day: number;
}

interface GameContextType {
  state: GameState;
  effectiveLeo: LeoStats;
  weeklyRent: number;
  daysUntilRent: number;
  activeRentEvent: RentEventData | null;
  dismissRentEvent: () => void;
  advanceDay: (adventureRewardText?: string) => void;
  upgradeFacility: (facilityId: string) => boolean;
  researchRecipe: (recipeId: string) => boolean;
  assignAlchemySlot: (slotIndex: number, recipeId: string) => boolean;
  collectAlchemySlot: (slotIndex: number) => boolean;
  cancelAlchemySlot: (slotIndex: number) => void;
  upgradeLeoStat: (statKey: StatKey) => boolean;
  getStatUpgradeCost: (statKey: StatKey) => number;
  equipItem: (slot: EquipmentSlot, itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  // Categorized Pouch & Gears
  equipPouchGear: (gearId: string) => boolean;
  buyPouchGear: (gearId: string) => boolean;
  setPouchCategorySlot: (category: PouchCategory, index: number, itemId: string | null) => void;
  setPouchSlot: (index: number, itemId: string | null) => void;
  updatePouch: (newPouch: PouchState | (string | null)[]) => void;
  autoFillPouchCategory: (category: PouchCategory) => void;
  clearPouchCategory: (category: PouchCategory) => void;
  // Perks, Quests & Shop
  learnPerk: (perkId: string) => boolean;
  claimQuestReward: (questId: string) => boolean;
  unlockMaterial: (materialId: string) => void;
  buyShopMaterial: (itemId: string, count: number, customUnitPrice?: number) => boolean;
  buyItem: (itemId: string, count: number, customUnitPrice?: number) => boolean;
  sellItem: (itemId: string, count: number) => boolean;
  modifyInventory: (itemId: string, delta: number) => void;
  addExp: (amount: number) => void;
  addGold: (amount: number) => void;
  addRp: (amount: number) => void;
  clearDungeon: (dungeonId: string) => void;
  resetGame: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

const STORAGE_KEY = 'adventurer_alchemist_save_v1';

const getInitialState = (): GameState => {
  return {
    day: 1,
    gold: 350,
    researchPoints: 40,
    leo: { ...INITIAL_LEO_STATS },
    equipped: {
      weapon: 'apprentice_dagger',
      armor: 'leather_vest',
      accessory: null,
    },
    equippedPouch: 'pouch_starter',
    ownedPouchGears: ['pouch_starter'],
    pouch: {
      potion: ['potion_small', 'potion_small', null],
      food: ['small_bread'],
      consumable: ['throwing_knife'],
      gadget: [null],
    },
    perks: JSON.parse(JSON.stringify(INITIAL_PERKS)),
    quests: JSON.parse(JSON.stringify(INITIAL_QUESTS)),
    unlockedMaterials: ['herb', 'clean_water', 'small_bread'],
    shopStock: {
      herb: 6,
      clean_water: 6,
      small_bread: 4,
    },
    inventory: {
      herb: 6,
      clean_water: 4,
      potion_small: 3,
      small_bread: 4,
      herb_bread: 2,
      throwing_knife: 2,
      magnifier: 1,
    },
    recipes: JSON.parse(JSON.stringify(INITIAL_RECIPES)),
    alchemySlots: [
      { slotIndex: 0, recipeId: null, status: 'empty', turnsRemaining: 0 },
      { slotIndex: 1, recipeId: null, status: 'empty', turnsRemaining: 0 },
    ],
    facilities: JSON.parse(JSON.stringify(INITIAL_FACILITIES)),
    dungeons: JSON.parse(JSON.stringify(INITIAL_DUNGEONS)),
    trophies: [],
    totalAdventurersCompleted: 0,
  };
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        const unlockedMaterials: string[] = parsed.unlockedMaterials || ['herb', 'clean_water', 'small_bread'];
        const clearedCount = (parsed.dungeons || []).filter((d: Dungeon) => d.isCleared).length;

        // Shop stock migration: replenish for all unlocked field materials
        const shopStock: Record<string, number> = { ...(parsed.shopStock || {}) };
        unlockedMaterials.forEach((mId) => {
          if (FIELD_SHOP_ITEMS[mId] && shopStock[mId] === undefined) {
            shopStock[mId] = FIELD_SHOP_ITEMS[mId].baseStock + clearedCount * 2;
          }
        });

        // Recipe discovery & ingredients migration
        const recipes = (parsed.recipes || INITIAL_RECIPES).map((r: Recipe) => {
          const initR = INITIAL_RECIPES.find((ir) => ir.id === r.id);
          const isDiscovered =
            r.isDiscovered ??
            r.isResearched ??
            initR?.isDiscovered ??
            r.ingredients.some((ing) => unlockedMaterials.includes(ing.itemId));
          return {
            ...r,
            resultCount: 1,
            timeDays: Math.max(1, r.timeDays || 1),
            ingredients: initR?.ingredients || r.ingredients,
            isDiscovered: Boolean(isDiscovered),
          };
        });

        // Migrate facilities: clean up deleted facilities, rename cauldron, ensure slot_boost
        let facilities: Facility[] = (parsed.facilities || INITIAL_FACILITIES)
          .filter((f: Facility) => (f.id as string) !== 'greenhouse' && (f.id as string) !== 'training')
          .map((f: Facility) => {
            if (f.id === 'cauldron') {
              return {
                ...f,
                name: 'スロット追加',
                description: '調合を行う仕込み枠を増設する。強化すると作成スロットが増加し、同時に複数の調合が可能になる。',
                icon: 'Layers',
              };
            }
            return f;
          });

        if (!facilities.some((f) => f.id === 'slot_boost')) {
          const defaultSlotBoost = INITIAL_FACILITIES.find((f) => f.id === 'slot_boost');
          if (defaultSlotBoost) {
            facilities.push({ ...defaultSlotBoost });
          }
        }

        // Pouch migration to 4 categories
        const equippedPouchId = parsed.equippedPouch || 'pouch_starter';
        const currentGear = POUCH_GEARS[equippedPouchId] || POUCH_GEARS['pouch_starter'];
        let migratedPouch: PouchState = {
          potion: Array(currentGear.capacity.potion).fill(null),
          food: Array(currentGear.capacity.food).fill(null),
          consumable: Array(currentGear.capacity.consumable).fill(null),
          gadget: Array(currentGear.capacity.gadget).fill(null),
        };

        if (Array.isArray(parsed.pouch)) {
          // Old flat array pouch
          for (const itId of parsed.pouch) {
            if (!itId) continue;
            const item = ITEMS[itId];
            const cat: PouchCategory = item?.pouchCategory || (item?.type === 'food' ? 'food' : item?.type === 'offensive' || item?.type === 'consumable' ? 'consumable' : item?.type === 'gadget' ? 'gadget' : 'potion');
            const emptyIdx = migratedPouch[cat].findIndex((x) => x === null);
            if (emptyIdx !== -1) {
              migratedPouch[cat][emptyIdx] = itId;
            } else {
              parsed.inventory = parsed.inventory || {};
              parsed.inventory[itId] = (parsed.inventory[itId] || 0) + 1;
            }
          }
        } else if (parsed.pouch && typeof parsed.pouch === 'object') {
          migratedPouch = {
            potion: Array.isArray(parsed.pouch.potion) ? parsed.pouch.potion : Array(currentGear.capacity.potion).fill(null),
            food: Array.isArray(parsed.pouch.food) ? parsed.pouch.food : Array(currentGear.capacity.food).fill(null),
            consumable: Array.isArray(parsed.pouch.consumable) ? parsed.pouch.consumable : Array(currentGear.capacity.consumable).fill(null),
            gadget: Array.isArray(parsed.pouch.gadget) ? parsed.pouch.gadget : Array(currentGear.capacity.gadget).fill(null),
          };
        }

        // Migrate perks: ensure all perks from INITIAL_PERKS exist
        const savedPerks: Perk[] = parsed.perks || [];
        const mergedPerks: Perk[] = INITIAL_PERKS.map((initP) => {
          const match = savedPerks.find((sp) => sp.id === initP.id);
          return match ? { ...initP, ...match } : { ...initP };
        });

        // Migrate quests: ensure all quests from INITIAL_QUESTS exist with clean definitions
        const savedQuests: Quest[] = parsed.quests || [];
        const mergedQuests: Quest[] = INITIAL_QUESTS.map((initQ) => {
          const match = savedQuests.find((sq) => sq.id === initQ.id);
          return match
            ? { ...initQ, isCompleted: Boolean(match.isCompleted), isClaimed: Boolean(match.isClaimed) }
            : { ...initQ };
        });

        // Migrate dungeons: ensure all 20 dungeons from INITIAL_DUNGEONS exist
        const savedDungeons: Dungeon[] = parsed.dungeons || [];
        const mergedDungeons: Dungeon[] = INITIAL_DUNGEONS.map((initD, idx) => {
          const match = savedDungeons.find((sd) => sd.id === initD.id);
          if (match) {
            return {
              ...initD,
              isUnlocked: match.isUnlocked,
              isCleared: match.isCleared,
            };
          }
          return {
            ...initD,
            isUnlocked: idx === 0,
          };
        });

        const ownedPouchGears: string[] = parsed.ownedPouchGears || ['pouch_starter'];

        return {
          ...getInitialState(),
          ...parsed,
          facilities,
          recipes,
          dungeons: mergedDungeons,
          equippedPouch: equippedPouchId,
          ownedPouchGears,
          pouch: migratedPouch,
          perks: mergedPerks,
          quests: mergedQuests,
          unlockedMaterials,
          shopStock,
          leo: { ...INITIAL_LEO_STATS, ...parsed.leo },
          equipped: { ...getInitialState().equipped, ...parsed.equipped },
        };
      }
    } catch (e) {
      console.error('Failed to load save', e);
    }
    return getInitialState();
  });

  const [activeRentEvent, setActiveRentEvent] = useState<RentEventData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Auto-save on state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }, [state]);

  const toggleSound = () => {
    sound.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      sound.playTap();
    }
  };

  // Compute maintenance cost and days until rent
  const weeklyRent = useMemo(() => {
    const base = 100;
    const facilityUpkeep = state.facilities.reduce((acc, f) => {
      return acc + (f.level - 1) * f.weeklyCostPerLevel;
    }, 0);
    return base + facilityUpkeep;
  }, [state.facilities]);

  const daysUntilRent = useMemo(() => {
    const remainder = state.day % 7;
    return remainder === 0 ? 0 : 7 - remainder;
  }, [state.day]);

  // Compute Effective Leo Stats with equipment & passive gadgets
  const effectiveLeo = useMemo<LeoStats>(() => {
    const base = { ...state.leo };
    const equipItems = [
      state.equipped.weapon ? ITEMS[state.equipped.weapon] : null,
      state.equipped.armor ? ITEMS[state.equipped.armor] : null,
      state.equipped.accessory ? ITEMS[state.equipped.accessory] : null,
    ].filter(Boolean);

    equipItems.forEach((item) => {
      if (!item?.equipStats) return;
      Object.entries(item.equipStats).forEach(([key, val]) => {
        const statK = key as StatKey;
        if (statK in base && typeof val === 'number') {
          (base as unknown as Record<string, number>)[statK] += val;
        }
      });
    });

    // Passive gadget bonuses from gadget pouch
    if (state.pouch?.gadget) {
      state.pouch.gadget.forEach((gId) => {
        if (!gId) return;
        const gItem = ITEMS[gId];
        if (gItem?.gadgetBonus?.stat && typeof gItem.gadgetBonus.value === 'number') {
          const statK = gItem.gadgetBonus.stat;
          if (statK in base) {
            (base as unknown as Record<string, number>)[statK] += gItem.gadgetBonus.value;
          }
        }
      });
    }

    // Recompute Max Stamina based on endurance + mobility: 20 + (endurance + mobility) * 0.5
    const computedMaxStamina = Math.round(20 + (base.endurance + base.mobility) * 0.5);
    base.stamina = Math.min(base.stamina, computedMaxStamina);

    return {
      ...base,
      maxStamina: computedMaxStamina,
    };
  }, [state.leo, state.equipped, state.pouch]);

  // Advance Day (called after returning from gathering or dungeon)
  const advanceDay = (_adventureRewardText?: string) => {
    setState((prev) => {
      const nextDay = prev.day + 1;
      const newInventory = { ...prev.inventory };

      // 1. Advance Alchemy Slots
      const newSlots = prev.alchemySlots.map((slot) => {
        if (slot.status === 'crafting' && slot.recipeId) {
          const rem = slot.turnsRemaining - 1;
          if (rem <= 0) {
            return { ...slot, turnsRemaining: 0, status: 'completed' as const };
          }
          return { ...slot, turnsRemaining: rem };
        }
        return slot;
      });

      // 2. Fully Restore Leo's HP and Stamina after resting
      const newLeo = {
        ...prev.leo,
        hp: prev.leo.maxHp,
        stamina: Math.round(20 + (prev.leo.endurance + prev.leo.mobility) * 0.5),
      };

      // 3. Replenish Shop Stock for unlocked normal field materials (scaled by cleared dungeons)
      const clearedDungeonsCount = prev.dungeons.filter((d) => d.isCleared).length;
      const nextShopStock: Record<string, number> = {};
      prev.unlockedMaterials.forEach((mId) => {
        if (FIELD_SHOP_ITEMS[mId]) {
          nextShopStock[mId] = FIELD_SHOP_ITEMS[mId].baseStock + clearedDungeonsCount * 2;
        }
      });

      // 4. Refresh repeatable claimed quests on daily advance
      const nextQuests = prev.quests.map((q) => {
        if (q.isClaimed && q.isRepeatable) {
          return { ...q, isCompleted: false, isClaimed: false };
        }
        return q;
      });

      // Check Rent payment (Day 7, 14, 21...)
      if (nextDay % 7 === 0) {
        // Rent due
        const dueAmount = weeklyRent;
        const canPay = prev.gold >= dueAmount;
        setActiveRentEvent({
          amount: dueAmount,
          isPaid: canPay,
          day: nextDay,
        });
        const finalGold = canPay ? prev.gold - dueAmount : Math.max(0, prev.gold - dueAmount);

        return {
          ...prev,
          day: nextDay,
          gold: finalGold,
          leo: newLeo,
          inventory: newInventory,
          alchemySlots: newSlots,
          shopStock: nextShopStock,
          quests: nextQuests,
          totalAdventurersCompleted: prev.totalAdventurersCompleted + 1,
        };
      }

      return {
        ...prev,
        day: nextDay,
        leo: newLeo,
        inventory: newInventory,
        alchemySlots: newSlots,
        shopStock: nextShopStock,
        quests: nextQuests,
        totalAdventurersCompleted: prev.totalAdventurersCompleted + 1,
      };
    });
  };

  const dismissRentEvent = () => {
    setActiveRentEvent(null);
  };

  // Facility Upgrades
  const upgradeFacility = (facilityId: string): boolean => {
    const facility = state.facilities.find((f) => f.id === facilityId);
    if (!facility || facility.level >= facility.maxLevel) return false;

    const cost = facility.baseUpgradeCost * facility.level;
    if (state.gold < cost) return false;

    sound.playCoin();

    setState((prev) => {
      const nextFacilities = prev.facilities.map((f) =>
        f.id === facilityId ? { ...f, level: f.level + 1 } : f
      );

      let nextSlots = [...prev.alchemySlots];
      // If cauldron was upgraded, add extra alchemy slot (Level 1: 2 slots, Level 2: 3 slots, etc.)
      if (facilityId === 'cauldron') {
        const newTargetSlots = facility.level + 2; // Level 2 -> 3 slots, Level 3 -> 4 slots
        while (nextSlots.length < newTargetSlots && nextSlots.length < 5) {
          nextSlots.push({
            slotIndex: nextSlots.length,
            recipeId: null,
            status: 'empty',
            turnsRemaining: 0,
          });
        }
      }

      return {
        ...prev,
        gold: prev.gold - cost,
        facilities: nextFacilities,
        alchemySlots: nextSlots,
      };
    });
    return true;
  };

  // Research Recipe
  const researchRecipe = (recipeId: string): boolean => {
    const recipe = state.recipes.find((r) => r.id === recipeId);
    if (!recipe || recipe.isResearched) return false;
    if (state.researchPoints < recipe.researchCostRp) return false;

    sound.playDiceSuccess();

    setState((prev) => ({
      ...prev,
      researchPoints: prev.researchPoints - recipe.researchCostRp,
      recipes: prev.recipes.map((r) =>
        r.id === recipeId ? { ...r, isResearched: true } : r
      ),
    }));
    return true;
  };

  // Assign Recipe to Cauldron Slot (requires at least 1 day/adventure)
  const assignAlchemySlot = (slotIndex: number, recipeId: string): boolean => {
    const recipe = state.recipes.find((r) => r.id === recipeId);
    if (!recipe || !recipe.isResearched) return false;

    const hasIngredients = recipe.ingredients.every(
      (ing) => (state.inventory[ing.itemId] || 0) >= ing.count
    );
    if (!hasIngredients) return false;

    sound.playAlchemyBubble();

    setState((prev) => {
      const newInv = { ...prev.inventory };
      recipe.ingredients.forEach((ing) => {
        newInv[ing.itemId] -= ing.count;
        if (newInv[ing.itemId] <= 0) delete newInv[ing.itemId];
      });

      const nextSlots = prev.alchemySlots.map((slot) => {
        if (slot.slotIndex === slotIndex) {
          return {
            ...slot,
            recipeId,
            status: 'crafting' as const,
            turnsRemaining: recipe.timeDays || 1,
          };
        }
        return slot;
      });

      return {
        ...prev,
        inventory: newInv,
        alchemySlots: nextSlots,
      };
    });
    return true;
  };

  // Collect Completed Alchemy Slot
  const collectAlchemySlot = (slotIndex: number): boolean => {
    const slot = state.alchemySlots.find((s) => s.slotIndex === slotIndex);
    if (!slot || slot.status !== 'completed' || !slot.recipeId) return false;

    const recipe = state.recipes.find((r) => r.id === slot.recipeId);
    if (!recipe) return false;

    sound.playCoin();

    setState((prev) => {
      const slotBoost = prev.facilities.find((f) => f.id === 'slot_boost');
      const yieldPerSlot = recipe.resultCount * (slotBoost ? slotBoost.level : 1);

      const newInv = { ...prev.inventory };
      newInv[recipe.resultItemId] = (newInv[recipe.resultItemId] || 0) + yieldPerSlot;

      const nextSlots = prev.alchemySlots.map((s) =>
        s.slotIndex === slotIndex
          ? { ...s, recipeId: null, status: 'empty' as const, turnsRemaining: 0 }
          : s
      );

      // RP bonus
      const library = prev.facilities.find((f) => f.id === 'library');
      const rpGain = 12 * (library ? library.level : 1);

      return {
        ...prev,
        researchPoints: prev.researchPoints + rpGain,
        inventory: newInv,
        alchemySlots: nextSlots,
      };
    });
    return true;
  };

  const cancelAlchemySlot = (slotIndex: number) => {
    setState((prev) => {
      const slot = prev.alchemySlots.find((s) => s.slotIndex === slotIndex);
      if (!slot || !slot.recipeId) return prev;
      const recipe = prev.recipes.find((r) => r.id === slot.recipeId);

      // Refund ingredients
      const newInv = { ...prev.inventory };
      if (recipe) {
        recipe.ingredients.forEach((ing) => {
          newInv[ing.itemId] = (newInv[ing.itemId] || 0) + ing.count;
        });
      }

      const nextSlots = prev.alchemySlots.map((s) =>
        s.slotIndex === slotIndex
          ? { ...s, recipeId: null, status: 'empty' as const, turnsRemaining: 0 }
          : s
      );

      return {
        ...prev,
        inventory: newInv,
        alchemySlots: nextSlots,
      };
    });
  };

  // Leo Stat Upgrades with EXP
  const getStatUpgradeCost = (statKey: StatKey): number => {
    const currentVal = state.leo[statKey];
    const initialVal = INITIAL_LEO_STATS[statKey];
    const delta = Math.max(0, currentVal - initialVal);
    if (statKey === 'hp') {
      return 15 + delta * 2;
    }
    return 20 + delta * 5;
  };

  const upgradeLeoStat = (statKey: StatKey): boolean => {
    const cost = getStatUpgradeCost(statKey);
    if (state.leo.exp < cost) return false;

    sound.playVictory();

    setState((prev) => {
      const currentVal = prev.leo[statKey];
      const addition = statKey === 'hp' ? 5 : 1;
      const newLeo = {
        ...prev.leo,
        exp: prev.leo.exp - cost,
        [statKey]: currentVal + addition,
      };

      if (statKey === 'hp') {
        newLeo.maxHp = prev.leo.maxHp + 5;
        newLeo.hp = newLeo.maxHp;
      }

      newLeo.maxStamina = Math.round(20 + (newLeo.endurance + newLeo.mobility) * 0.5);

      return {
        ...prev,
        leo: newLeo,
      };
    });
    return true;
  };

  // Equip / Unequip
  const equipItem = (slot: EquipmentSlot, itemId: string) => {
    sound.playTap();
    setState((prev) => {
      const prevEquipped = prev.equipped[slot];
      const newInv = { ...prev.inventory };

      // Deduct 1 from inventory
      if ((newInv[itemId] || 0) > 0) {
        newInv[itemId] -= 1;
        if (newInv[itemId] <= 0) delete newInv[itemId];
      }

      // Return old item to inventory if existed
      if (prevEquipped) {
        newInv[prevEquipped] = (newInv[prevEquipped] || 0) + 1;
      }

      return {
        ...prev,
        inventory: newInv,
        equipped: {
          ...prev.equipped,
          [slot]: itemId,
        },
      };
    });
  };

  const unequipItem = (slot: EquipmentSlot) => {
    sound.playTap();
    setState((prev) => {
      const prevEquipped = prev.equipped[slot];
      if (!prevEquipped) return prev;

      const newInv = { ...prev.inventory };
      newInv[prevEquipped] = (newInv[prevEquipped] || 0) + 1;

      return {
        ...prev,
        inventory: newInv,
        equipped: {
          ...prev.equipped,
          [slot]: null,
        },
      };
    });
  };

  // Pouch Gear & Categorized Pouch
  const equipPouchGear = (gearId: string): boolean => {
    const gear = POUCH_GEARS[gearId];
    if (!gear) return false;

    sound.playTap();
    setState((prev) => {
      // 1. Un-equip all current items in all 4 categories and return to inventory
      const newInv = { ...prev.inventory };
      const categories: PouchCategory[] = ['potion', 'food', 'consumable', 'gadget'];
      for (const cat of categories) {
        for (const it of prev.pouch[cat] || []) {
          if (it) {
            newInv[it] = (newInv[it] || 0) + 1;
          }
        }
      }

      // 2. Allocate fresh slots matching the gear's capacity
      const newPouch: PouchState = {
        potion: Array(gear.capacity.potion).fill(null),
        food: Array(gear.capacity.food).fill(null),
        consumable: Array(gear.capacity.consumable).fill(null),
        gadget: Array(gear.capacity.gadget).fill(null),
      };

      const owned = prev.ownedPouchGears.includes(gearId)
        ? prev.ownedPouchGears
        : [...prev.ownedPouchGears, gearId];

      return {
        ...prev,
        equippedPouch: gearId,
        ownedPouchGears: owned,
        pouch: newPouch,
        inventory: newInv,
      };
    });
    return true;
  };

  const setPouchCategorySlot = (category: PouchCategory, index: number, itemId: string | null) => {
    sound.playTap();
    setState((prev) => {
      const catList = [...(prev.pouch[category] || [])];
      const oldItem = catList[index];
      const newInv = { ...prev.inventory };

      if (oldItem) {
        newInv[oldItem] = (newInv[oldItem] || 0) + 1;
      }

      if (itemId) {
        if ((newInv[itemId] || 0) > 0) {
          newInv[itemId] -= 1;
          if (newInv[itemId] <= 0) delete newInv[itemId];
        }
      }

      catList[index] = itemId;

      return {
        ...prev,
        pouch: {
          ...prev.pouch,
          [category]: catList,
        },
        inventory: newInv,
      };
    });
  };

  // Backwards compatibility setPouchSlot (maps to potion belt)
  const setPouchSlot = (index: number, itemId: string | null) => {
    setPouchCategorySlot('potion', index, itemId);
  };

  const updatePouch = (newPouch: PouchState | (string | null)[]) => {
    setState((prev) => {
      if (Array.isArray(newPouch)) {
        return prev;
      }
      return {
        ...prev,
        pouch: newPouch,
      };
    });
  };

  const autoFillPouchCategory = (category: PouchCategory) => {
    sound.playTap();
    setState((prev) => {
      const catList = [...(prev.pouch[category] || [])];
      const newInv = { ...prev.inventory };

      for (let i = 0; i < catList.length; i++) {
        if (catList[i] === null) {
          const suitableEntry = Object.entries(newInv).find(([id, count]) => {
            if (count <= 0) return false;
            const it = ITEMS[id];
            if (!it) return false;
            if (category === 'potion') return it.pouchCategory === 'potion' || it.type === 'potion';
            if (category === 'food') return it.pouchCategory === 'food' || it.type === 'food';
            if (category === 'consumable') return it.pouchCategory === 'consumable' || it.type === 'consumable' || it.type === 'offensive';
            if (category === 'gadget') return it.pouchCategory === 'gadget' || it.type === 'gadget';
            return false;
          });

          if (suitableEntry) {
            const [id] = suitableEntry;
            catList[i] = id;
            newInv[id] -= 1;
            if (newInv[id] <= 0) delete newInv[id];
          }
        }
      }

      return {
        ...prev,
        pouch: {
          ...prev.pouch,
          [category]: catList,
        },
        inventory: newInv,
      };
    });
  };

  const clearPouchCategory = (category: PouchCategory) => {
    sound.playTap();
    setState((prev) => {
      const catList = [...(prev.pouch[category] || [])];
      const newInv = { ...prev.inventory };

      for (let i = 0; i < catList.length; i++) {
        const it = catList[i];
        if (it) {
          newInv[it] = (newInv[it] || 0) + 1;
          catList[i] = null;
        }
      }

      return {
        ...prev,
        pouch: {
          ...prev.pouch,
          [category]: catList,
        },
        inventory: newInv,
      };
    });
  };

  // Perks
  const learnPerk = (perkId: string): boolean => {
    const targetPerk = state.perks.find((p) => p.id === perkId);
    if (!targetPerk) return false;
    if (targetPerk.level >= targetPerk.maxLevel) return false;

    // Check stat requirements against effectiveLeo
    for (const [stat, val] of Object.entries(targetPerk.requiredStats)) {
      if ((effectiveLeo[stat as StatKey] || 0) < (val || 0)) {
        return false;
      }
    }

    const expCost = targetPerk.requiredExp * (targetPerk.level + 1);
    if (state.leo.exp < expCost) return false;

    sound.playLevelUp();
    setState((prev) => ({
      ...prev,
      leo: {
        ...prev.leo,
        exp: prev.leo.exp - expCost,
      },
      perks: prev.perks.map((p) => {
        if (p.id === perkId) {
          return { ...p, level: p.level + 1 };
        }
        return p;
      }),
    }));
    return true;
  };

  // Quests
  const claimQuestReward = (questId: string): boolean => {
    const quest = state.quests.find((q) => q.id === questId);
    if (!quest || quest.isClaimed) return false;

    const currentCount = state.inventory[quest.targetItemId] || 0;
    if (currentCount < quest.targetCount) return false;

    sound.playVictory();
    setState((prev) => {
      const newInv = { ...prev.inventory };
      newInv[quest.targetItemId] -= quest.targetCount;
      if (newInv[quest.targetItemId] <= 0) delete newInv[quest.targetItemId];

      const newUnlocked = [...prev.unlockedMaterials];
      if (quest.rewardItems) {
        for (const item of quest.rewardItems) {
          newInv[item.itemId] = (newInv[item.itemId] || 0) + item.count;
          if (!newUnlocked.includes(item.itemId)) {
            newUnlocked.push(item.itemId);
          }
        }
      }

      // Check recipe discoveries for newly unlocked reward items
      const nextRecipes = prev.recipes.map((recipe) => {
        if (recipe.isDiscovered) return recipe;
        const usesUnlocked = recipe.ingredients.some((ing) => newUnlocked.includes(ing.itemId));
        return usesUnlocked ? { ...recipe, isDiscovered: true } : recipe;
      });

      return {
        ...prev,
        gold: prev.gold + quest.rewardGold,
        researchPoints: prev.researchPoints + (quest.rewardRp || 0),
        inventory: newInv,
        unlockedMaterials: newUnlocked,
        recipes: nextRecipes,
        quests: prev.quests.map((q) =>
          q.id === questId ? { ...q, isCompleted: true, isClaimed: true } : q
        ),
      };
    });
    return true;
  };

  // Material Discovery & Shop Stock Initialization & Recipe Unlock Link
  const unlockMaterial = (materialId: string) => {
    setState((prev) => {
      const isAlreadyUnlocked = prev.unlockedMaterials.includes(materialId);
      const nextUnlocked = isAlreadyUnlocked
        ? prev.unlockedMaterials
        : [...prev.unlockedMaterials, materialId];

      const nextShopStock = { ...prev.shopStock };
      if (!isAlreadyUnlocked && FIELD_SHOP_ITEMS[materialId] && nextShopStock[materialId] === undefined) {
        const clearedCount = prev.dungeons.filter((d) => d.isCleared).length;
        nextShopStock[materialId] = FIELD_SHOP_ITEMS[materialId].baseStock + clearedCount * 2;
      }

      // Discover recipes that use this material
      let newlyDiscoveredCount = 0;
      const nextRecipes = prev.recipes.map((recipe) => {
        if (recipe.isDiscovered) return recipe;
        const usesMaterial = recipe.ingredients.some((ing) => ing.itemId === materialId);
        if (usesMaterial) {
          newlyDiscoveredCount++;
          return { ...recipe, isDiscovered: true };
        }
        return recipe;
      });

      if (newlyDiscoveredCount > 0) {
        sound.playPerk();
      }

      return {
        ...prev,
        unlockedMaterials: nextUnlocked,
        shopStock: nextShopStock,
        recipes: nextRecipes,
      };
    });
  };

  // Buy Normal Field Material from Daily Shop Stock
  const buyShopMaterial = (itemId: string, count: number, customUnitPrice?: number): boolean => {
    const itemConf = FIELD_SHOP_ITEMS[itemId];
    if (!itemConf) return false;
    const currentStock = state.shopStock[itemId] || 0;
    if (currentStock < count) return false;
    const unitPrice = typeof customUnitPrice === 'number' ? customUnitPrice : itemConf.buyPrice;
    const totalCost = unitPrice * count;
    if (state.gold < totalCost) return false;

    sound.playCoin();
    setState((prev) => ({
      ...prev,
      gold: prev.gold - totalCost,
      shopStock: {
        ...prev.shopStock,
        [itemId]: (prev.shopStock[itemId] || 0) - count,
      },
      inventory: {
        ...prev.inventory,
        [itemId]: (prev.inventory[itemId] || 0) + count,
      },
    }));
    return true;
  };

  // Buy & Equip Upgraded Pouch Gear from Shop
  const buyPouchGear = (gearId: string): boolean => {
    const gear = POUCH_GEARS[gearId];
    if (!gear) return false;
    if (state.ownedPouchGears.includes(gearId)) return false;

    const clearedCount = state.dungeons.filter((d) => d.isCleared).length;
    if (clearedCount < gear.requiredDungeonsCleared) return false;
    if (state.gold < gear.buyPrice) return false;

    sound.playCoin();

    // Return items from previous pouch into inventory
    const oldPouch = state.pouch;
    const returnedInventory = { ...state.inventory };
    (Object.keys(oldPouch) as PouchCategory[]).forEach((cat) => {
      oldPouch[cat].forEach((itemId) => {
        if (itemId) {
          returnedInventory[itemId] = (returnedInventory[itemId] || 0) + 1;
        }
      });
    });

    const newPouchState: PouchState = {
      potion: Array(gear.capacity.potion).fill(null),
      food: Array(gear.capacity.food).fill(null),
      consumable: Array(gear.capacity.consumable).fill(null),
      gadget: Array(gear.capacity.gadget).fill(null),
    };

    setState((prev) => ({
      ...prev,
      gold: prev.gold - gear.buyPrice,
      ownedPouchGears: [...prev.ownedPouchGears, gearId],
      equippedPouch: gearId,
      pouch: newPouchState,
      inventory: returnedInventory,
    }));
    return true;
  };

  // Buy & Sell General
  const buyItem = (itemId: string, count: number, customUnitPrice?: number): boolean => {
    const item = ITEMS[itemId];
    if (!item || !item.buyPrice) return false;
    const unitPrice = typeof customUnitPrice === 'number' ? customUnitPrice : item.buyPrice;
    const cost = unitPrice * count;
    if (state.gold < cost) return false;

    sound.playCoin();

    setState((prev) => ({
      ...prev,
      gold: prev.gold - cost,
      inventory: {
        ...prev.inventory,
        [itemId]: (prev.inventory[itemId] || 0) + count,
      },
    }));
    return true;
  };

  const sellItem = (itemId: string, count: number): boolean => {
    const item = ITEMS[itemId];
    const available = state.inventory[itemId] || 0;
    if (!item || available < count) return false;

    const gain = item.sellPrice * count;
    sound.playCoin();

    setState((prev) => {
      const newInv = { ...prev.inventory };
      newInv[itemId] -= count;
      if (newInv[itemId] <= 0) delete newInv[itemId];

      return {
        ...prev,
        gold: prev.gold + gain,
        inventory: newInv,
      };
    });
    return true;
  };

  const modifyInventory = (itemId: string, delta: number) => {
    setState((prev) => {
      const newInv = { ...prev.inventory };
      const current = newInv[itemId] || 0;
      const next = current + delta;
      if (next <= 0) {
        delete newInv[itemId];
      } else {
        newInv[itemId] = next;
      }
      return { ...prev, inventory: newInv };
    });
  };

  const addExp = (amount: number) => {
    setState((prev) => ({
      ...prev,
      leo: {
        ...prev.leo,
        exp: prev.leo.exp + amount,
      },
    }));
  };

  const addGold = (amount: number) => {
    setState((prev) => ({
      ...prev,
      gold: prev.gold + amount,
    }));
  };

  const addRp = (amount: number) => {
    setState((prev) => ({
      ...prev,
      researchPoints: prev.researchPoints + amount,
    }));
  };

  const clearDungeon = (dungeonId: string) => {
    setState((prev) => {
      const updatedDungeons = prev.dungeons.map((d, idx) => {
        if (d.id === dungeonId) {
          return { ...d, isCleared: true };
        }
        return d;
      });

      // Unlock next dungeon in sequence (for 20 dungeons)
      const clearedIndex = prev.dungeons.findIndex((d) => d.id === dungeonId);
      if (clearedIndex !== -1 && clearedIndex + 1 < updatedDungeons.length) {
        updatedDungeons[clearedIndex + 1].isUnlocked = true;
      }

      const clearedD = prev.dungeons.find((d) => d.id === dungeonId);
      const newTrophies = prev.trophies.includes(dungeonId)
        ? prev.trophies
        : [...prev.trophies, dungeonId];

      const newInv = { ...prev.inventory };
      if (clearedD?.clearRewardItem) {
        newInv[clearedD.clearRewardItem] = (newInv[clearedD.clearRewardItem] || 0) + 1;
      }

      return {
        ...prev,
        dungeons: updatedDungeons,
        trophies: newTrophies,
        inventory: newInv,
      };
    });
  };

  const resetGame = () => {
    sound.playTap();
    localStorage.removeItem(STORAGE_KEY);
    setState(getInitialState());
  };

  return (
    <GameContext.Provider
      value={{
        state,
        effectiveLeo,
        weeklyRent,
        daysUntilRent,
        activeRentEvent,
        dismissRentEvent,
        advanceDay,
        upgradeFacility,
        researchRecipe,
        assignAlchemySlot,
        collectAlchemySlot,
        cancelAlchemySlot,
        upgradeLeoStat,
        getStatUpgradeCost,
        equipItem,
        unequipItem,
        equipPouchGear,
        buyPouchGear,
        setPouchCategorySlot,
        setPouchSlot,
        updatePouch,
        autoFillPouchCategory,
        clearPouchCategory,
        learnPerk,
        claimQuestReward,
        unlockMaterial,
        buyShopMaterial,
        buyItem,
        sellItem,
        modifyInventory,
        addExp,
        addGold,
        addRp,
        clearDungeon,
        resetGame,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
