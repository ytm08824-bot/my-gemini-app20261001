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
} from '../types/game';
import {
  INITIAL_LEO_STATS,
  ITEMS,
  INITIAL_RECIPES,
  INITIAL_FACILITIES,
  INITIAL_DUNGEONS,
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
  setPouchSlot: (index: number, itemId: string | null) => void;
  updatePouch: (newPouch: (string | null)[]) => void;
  buyItem: (itemId: string, count: number) => boolean;
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
    pouch: ['potion_small', 'potion_small', 'stamina_tonic', null],
    inventory: {
      herb: 6,
      clean_water: 4,
      potion_small: 3,
      stamina_tonic: 2,
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
        const recipes = (parsed.recipes || INITIAL_RECIPES).map((r: Recipe) => ({
          ...r,
          resultCount: 1,
          timeDays: Math.max(1, r.timeDays || 1),
        }));

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

        return {
          ...getInitialState(),
          ...parsed,
          facilities,
          recipes,
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

  // Compute Effective Leo Stats with equipment
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

    // Recompute Max Stamina based on endurance + mobility: 20 + (endurance + mobility) * 0.5
    const computedMaxStamina = Math.round(20 + (base.endurance + base.mobility) * 0.5);
    base.stamina = Math.min(base.stamina, computedMaxStamina);

    return {
      ...base,
      maxStamina: computedMaxStamina,
    };
  }, [state.leo, state.equipped]);

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
          totalAdventurersCompleted: prev.totalAdventurersCompleted + 1,
        };
      }

      return {
        ...prev,
        day: nextDay,
        leo: newLeo,
        inventory: newInventory,
        alchemySlots: newSlots,
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

  // Pouch
  const setPouchSlot = (index: number, itemId: string | null) => {
    sound.playTap();
    setState((prev) => {
      const newPouch = [...prev.pouch];
      const oldItem = newPouch[index];
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

      newPouch[index] = itemId;

      return {
        ...prev,
        pouch: newPouch,
        inventory: newInv,
      };
    });
  };

  const updatePouch = (newPouch: (string | null)[]) => {
    setState((prev) => ({
      ...prev,
      pouch: newPouch,
    }));
  };

  // Buy & Sell
  const buyItem = (itemId: string, count: number): boolean => {
    const item = ITEMS[itemId];
    if (!item || !item.buyPrice) return false;
    const cost = item.buyPrice * count;
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

      // Unlock next dungeon if first or second was cleared
      if (dungeonId === 'dungeon_ruins') {
        const next = updatedDungeons.find((d) => d.id === 'dungeon_academy');
        if (next) next.isUnlocked = true;
      } else if (dungeonId === 'dungeon_academy') {
        const next = updatedDungeons.find((d) => d.id === 'dungeon_legendary');
        if (next) next.isUnlocked = true;
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
        setPouchSlot,
        updatePouch,
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
