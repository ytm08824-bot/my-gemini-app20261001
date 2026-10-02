import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Item, PouchCategory } from '../types/game';
import { ITEMS, FIELD_SHOP_ITEMS, POUCH_GEARS } from '../data/initialData';
import { ItemIcon } from './ItemIcon';
import {
  ShoppingBag,
  Coins,
  X,
  Sparkles,
  Layers,
  Lock,
  CheckCircle2,
  Package,
  Info,
  Briefcase,
  HeartPulse,
  Utensils,
  Bomb,
  Compass,
  Swords,
  Shield,
  Crown,
  Wrench,
  Flame,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface ShopBuyModalProps {
  onClose: () => void;
}

type MainTab = 'pouch_items' | 'materials' | 'equipments' | 'pouches';
type PouchSubFilter = 'all' | 'potion' | 'food' | 'consumable' | 'gadget';
type EquipSubFilter = 'all' | 'weapon' | 'armor' | 'accessory';

export const ShopBuyModal: React.FC<ShopBuyModalProps> = ({ onClose }) => {
  const {
    state,
    effectiveLeo,
    buyShopMaterial,
    buyPouchGear,
    buyItem,
  } = useGame();

  const [mainTab, setMainTab] = useState<MainTab>('pouch_items');
  const [pouchFilter, setPouchFilter] = useState<PouchSubFilter>('all');
  const [equipFilter, setEquipFilter] = useState<EquipSubFilter>('all');
  const [purchasedItemId, setPurchasedItemId] = useState<string | null>(null);

  // Social bargaining discount rate: up to 20% OFF
  const discountRate = Math.min(0.2, Math.max(0, (effectiveLeo.social - 8) * 0.015));
  const discountPercent = Math.round(discountRate * 100);

  const getItemPrice = (basePrice: number): number => {
    return Math.max(1, Math.round(basePrice * (1 - discountRate)));
  };

  const clearedDungeonsCount = state.dungeons.filter((d) => d.isCleared).length;

  // 1. Material Shop: Only normal field materials
  const allFieldItemKeys = Object.keys(FIELD_SHOP_ITEMS);
  const unlockedFieldItems = allFieldItemKeys.filter((id) => state.unlockedMaterials.includes(id));
  const lockedFieldCount = allFieldItemKeys.length - unlockedFieldItems.length;

  // 2. Pouch Items: Items matching potion, food, consumable, gadget that have buyPrice
  const allPouchItems = Object.values(ITEMS).filter(
    (item) =>
      typeof item.buyPrice === 'number' &&
      ['potion', 'food', 'consumable', 'gadget'].includes(item.pouchCategory || item.type)
  );

  const filteredPouchItems = allPouchItems.filter((item) => {
    if (pouchFilter === 'all') return true;
    const cat = item.pouchCategory || item.type;
    return cat === pouchFilter;
  });

  // 3. Equipment Items: Weapons, Armors, Accessories
  const allEquipItems = Object.values(ITEMS).filter(
    (item) => item.type === 'equipment' && typeof item.buyPrice === 'number'
  );

  const filteredEquipItems = allEquipItems.filter((item) => {
    if (equipFilter === 'all') return true;
    return item.equipSlot === equipFilter;
  });

  // Handle Material purchase from daily stock
  const handleBuyMaterial = (itemId: string, count: number = 1) => {
    const itemConf = FIELD_SHOP_ITEMS[itemId];
    if (!itemConf) return;
    const unitPrice = getItemPrice(itemConf.buyPrice);
    const success = buyShopMaterial(itemId, count, unitPrice);
    if (success) {
      setPurchasedItemId(itemId);
      setTimeout(() => setPurchasedItemId(null), 1000);
    } else {
      sound.playFail();
    }
  };

  // Handle Item purchase (pouch items & equipment)
  const handleBuyItem = (item: Item, count: number = 1) => {
    const basePrice = item.buyPrice || 0;
    const unitPrice = getItemPrice(basePrice);
    const success = buyItem(item.id, count, unitPrice);
    if (success) {
      sound.playCoin();
      setPurchasedItemId(item.id);
      setTimeout(() => setPurchasedItemId(null), 1000);
    } else {
      sound.playFail();
    }
  };

  // Handle Pouch Gear purchase
  const handleBuyPouch = (gearId: string) => {
    const success = buyPouchGear(gearId);
    if (success) {
      sound.playVictory();
      setPurchasedItemId(gearId);
      setTimeout(() => setPurchasedItemId(null), 1200);
    } else {
      sound.playFail();
    }
  };

  const handleClose = () => {
    sound.playTap();
    onClose();
  };

  const getPouchIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-amber-700" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-emerald-700" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-cyan-700" />;
      case 'Wrench':
        return <Wrench className="w-5 h-5 text-orange-700" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-indigo-700" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-yellow-600" />;
      default:
        return <Package className="w-5 h-5 text-amber-600" />;
    }
  };

  const getCategoryBadge = (item: Item) => {
    const cat = item.pouchCategory || item.type;
    switch (cat) {
      case 'potion':
        return (
          <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded border border-rose-200 flex items-center gap-0.5">
            <HeartPulse className="w-2.5 h-2.5 text-rose-600" />
            <span>薬品ポーチ枠</span>
          </span>
        );
      case 'food':
        return (
          <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5">
            <Utensils className="w-2.5 h-2.5 text-amber-700" />
            <span>食料ポシェット枠</span>
          </span>
        );
      case 'consumable':
        return (
          <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200 flex items-center gap-0.5">
            <Bomb className="w-2.5 h-2.5 text-purple-600" />
            <span>消耗品ポーチ枠</span>
          </span>
        );
      case 'gadget':
        return (
          <span className="text-[9px] font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded border border-cyan-200 flex items-center gap-0.5">
            <Compass className="w-2.5 h-2.5 text-cyan-600" />
            <span>ガジェット枠</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-5 sm:pt-9 p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-4 sm:p-5 max-w-lg w-full text-slate-800 shadow-2xl border border-amber-200 h-[88vh] max-h-[720px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-150 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900">ギルド資材・備品商店</h3>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md border border-amber-200">
                  {state.day}日目 在庫補充済
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">
                ポーチ携行品・日替わり素材・装備品・上位ポーチ販売
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Gold balance badge */}
            <div className="bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-mono tabular-nums text-xs font-black text-amber-900">
                {state.gold.toLocaleString()} G
              </span>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-transform"
              title="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Social Bargaining Banner */}
        {discountPercent > 0 && (
          <div className="mt-2.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-purple-500/10 rounded-xl border border-purple-200 flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-1.5 text-purple-950 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>レオの社交値による値引き交渉適用中！</span>
            </div>
            <span className="text-purple-800 font-black font-mono">
              全品 -{discountPercent}% OFF
            </span>
          </div>
        )}

        {/* 4 Main Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-xs my-2.5 shrink-0">
          <button
            onClick={() => {
              sound.playTap();
              setMainTab('pouch_items');
            }}
            className={`py-2 px-1 rounded-xl font-black transition-all text-center flex items-center justify-center gap-1 text-[11px] ${
              mainTab === 'pouch_items'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>ポーチ用品</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setMainTab('materials');
            }}
            className={`py-2 px-1 rounded-xl font-black transition-all text-center flex items-center justify-center gap-1 text-[11px] ${
              mainTab === 'materials'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>採取素材</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setMainTab('equipments');
            }}
            className={`py-2 px-1 rounded-xl font-black transition-all text-center flex items-center justify-center gap-1 text-[11px] ${
              mainTab === 'equipments'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>装備品</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setMainTab('pouches');
            }}
            className={`py-2 px-1 rounded-xl font-black transition-all text-center flex items-center justify-center gap-1 text-[11px] ${
              mainTab === 'pouches'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>上位ポーチ</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
          {/* ========================================================== */}
          {/* TAB 1: POUCH ITEMS (薬品・食糧・消耗攻撃具・ガジェット) */}
          {/* ========================================================== */}
          {mainTab === 'pouch_items' && (
            <div className="space-y-2.5">
              {/* Category sub-filters matching Pouch Categories */}
              <div className="flex items-center gap-1 bg-amber-50/80 p-1 rounded-xl text-[10px] border border-amber-200/80 overflow-x-auto">
                <button
                  onClick={() => {
                    sound.playTap();
                    setPouchFilter('all');
                  }}
                  className={`py-1 px-2 rounded-lg font-bold transition-all shrink-0 ${
                    pouchFilter === 'all'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  すべて ({allPouchItems.length})
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    setPouchFilter('potion');
                  }}
                  className={`py-1 px-2 rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 ${
                    pouchFilter === 'potion'
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'text-rose-700 hover:bg-rose-100/60'
                  }`}
                >
                  <HeartPulse className="w-3 h-3" />
                  <span>薬品 (ポーション)</span>
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    setPouchFilter('food');
                  }}
                  className={`py-1 px-2 rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 ${
                    pouchFilter === 'food'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-amber-800 hover:bg-amber-100/60'
                  }`}
                >
                  <Utensils className="w-3 h-3" />
                  <span>食料品 (フード)</span>
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    setPouchFilter('consumable');
                  }}
                  className={`py-1 px-2 rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 ${
                    pouchFilter === 'consumable'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-purple-800 hover:bg-purple-100/60'
                  }`}
                >
                  <Bomb className="w-3 h-3" />
                  <span>消耗攻撃具</span>
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    setPouchFilter('gadget');
                  }}
                  className={`py-1 px-2 rounded-lg font-bold transition-all flex items-center gap-1 shrink-0 ${
                    pouchFilter === 'gadget'
                      ? 'bg-cyan-600 text-white shadow-2xs'
                      : 'text-cyan-800 hover:bg-cyan-100/60'
                  }`}
                >
                  <Compass className="w-3 h-3" />
                  <span>ガジェット</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {filteredPouchItems.map((item) => {
                  const basePrice = item.buyPrice || 0;
                  const effectivePrice = getItemPrice(basePrice);
                  const canAffordSingle = state.gold >= effectivePrice;
                  const canAffordFive = state.gold >= effectivePrice * 5;
                  const ownedCount = state.inventory[item.id] || 0;
                  const isJustPurchased = purchasedItemId === item.id;
                  const isStackable = item.type !== 'gadget';

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isJustPurchased
                          ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                          : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                          <ItemIcon name={item.icon} className="w-5 h-5 text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-900">{item.name}</span>
                            {getCategoryBadge(item)}
                            {ownedCount > 0 && (
                              <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                所持: {ownedCount}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-600 mt-0.5 leading-snug break-words">
                            {item.description}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex items-center gap-1 text-xs font-mono font-black text-amber-900">
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                              <span>{effectivePrice.toLocaleString()} G</span>
                            </div>
                            {discountPercent > 0 && (
                              <span className="text-[10px] font-mono line-through text-slate-400">
                                {basePrice.toLocaleString()} G
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Buy Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isStackable && (
                          <button
                            disabled={!canAffordFive}
                            onClick={() => handleBuyItem(item, 5)}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-[10px] active:scale-95 transition-all shadow-2xs ${
                              canAffordFive
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                            title="5個まとめ買い"
                          >
                            +5個
                          </button>
                        )}
                        <button
                          disabled={!canAffordSingle}
                          onClick={() => handleBuyItem(item, 1)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-2xs ${
                            canAffordSingle
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          購入
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: NORMAL FIELD MATERIALS (日替わり採取素材) */}
          {/* ========================================================== */}
          {mainTab === 'materials' && (
            <div className="space-y-2.5">
              {/* Rules description notice box */}
              <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-[11px]">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>素材ショップの仕入れルール</span>
                </div>
                <ul className="text-[10px] text-amber-900/90 space-y-0.5 list-disc list-inside font-medium leading-relaxed">
                  <li>
                    <strong>採取連動:</strong> フィールドで一度でも採取・入手した「通常素材」のみが陳列されます。
                  </li>
                  <li>
                    <strong>日替わり在庫制限:</strong> 毎日日付更新（冒険からの帰還）時に一定数補充されます。
                  </li>
                  <li>
                    <strong>迷宮踏破ボーナス:</strong> 迷宮踏破数（現在 <strong className="font-mono">{clearedDungeonsCount}</strong> 箇所）に応じて各素材の日々の入荷上限がUP！
                  </li>
                  <li className="text-amber-800">
                    ※ 魔物ドロップ素材や迷宮専用の超レア素材は店頭販売対象外です（現地調達のみ）。
                  </li>
                </ul>
              </div>

              {/* Unlocked materials list */}
              {unlockedFieldItems.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  まだフィールドで採取した素材がありません。採取地へ冒険に出かけましょう！
                </div>
              ) : (
                <div className="space-y-2">
                  {unlockedFieldItems.map((itemId) => {
                    const item = ITEMS[itemId];
                    const itemConf = FIELD_SHOP_ITEMS[itemId];
                    if (!item || !itemConf) return null;

                    const currentStock = state.shopStock[itemId] || 0;
                    const maxStock = itemConf.baseStock + clearedDungeonsCount * 2;
                    const basePrice = itemConf.buyPrice;
                    const effectivePrice = getItemPrice(basePrice);
                    const canAffordSingle = state.gold >= effectivePrice && currentStock >= 1;
                    const canAffordFive = state.gold >= effectivePrice * 5 && currentStock >= 5;
                    const ownedCount = state.inventory[itemId] || 0;
                    const isJustPurchased = purchasedItemId === itemId;

                    return (
                      <div
                        key={itemId}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                          isJustPurchased
                            ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                            <ItemIcon name={item.icon} className="w-5 h-5 text-slate-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-slate-900">{item.name}</span>
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                                採取素材
                              </span>
                              {ownedCount > 0 && (
                                <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  所持: {ownedCount}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-600 mt-0.5 leading-snug break-words">
                              {item.description}
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-xs font-mono font-black text-amber-900">
                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                <span>{effectivePrice.toLocaleString()} G</span>
                              </div>
                              {discountPercent > 0 && (
                                <span className="text-[10px] font-mono line-through text-slate-400">
                                  {basePrice.toLocaleString()} G
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-mono font-black ${
                                  currentStock > 0 ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                本日残り: {currentStock}/{maxStock}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Buy Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {currentStock >= 5 && (
                            <button
                              disabled={!canAffordFive}
                              onClick={() => handleBuyMaterial(itemId, 5)}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-[10px] active:scale-95 transition-all shadow-2xs ${
                                canAffordFive
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              }`}
                              title="5個まとめ買い"
                            >
                              +5個
                            </button>
                          )}
                          <button
                            disabled={!canAffordSingle}
                            onClick={() => handleBuyMaterial(itemId, 1)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-2xs ${
                              currentStock === 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : canAffordSingle
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {currentStock === 0 ? '本日完売' : '購入'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Locked placeholder info */}
              {lockedFieldCount > 0 && (
                <div className="mt-3 p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-1">
                  <div className="text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>未入荷の通常素材（あと {lockedFieldCount}種）</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    新たな採取地を開拓し、現地で素材を入手すると店頭仕入れが開始されます。
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: EQUIPMENTS (武器・防具・装飾品) */}
          {/* ========================================================== */}
          {mainTab === 'equipments' && (
            <div className="space-y-2.5">
              {/* Sub-filter */}
              <div className="flex items-center gap-1 bg-amber-50/80 p-1 rounded-xl text-[10px] border border-amber-200/80 overflow-x-auto">
                <button
                  onClick={() => {
                    sound.playTap();
                    setEquipFilter('all');
                  }}
                  className={`py-1 px-2.5 rounded-lg font-bold transition-all ${
                    equipFilter === 'all'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  すべて ({allEquipItems.length})
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    setEquipFilter('weapon');
                  }}
                  className={`py-1 px-2.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    equipFilter === 'weapon'
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'text-rose-700 hover:bg-rose-100/60'
                  }`}
                >
                  <Swords className="w-3 h-3" />
                  <span>武器</span>
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    setEquipFilter('armor');
                  }}
                  className={`py-1 px-2.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    equipFilter === 'armor'
                      ? 'bg-indigo-500 text-white shadow-2xs'
                      : 'text-indigo-700 hover:bg-indigo-100/60'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>防具</span>
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    setEquipFilter('accessory');
                  }}
                  className={`py-1 px-2.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    equipFilter === 'accessory'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-purple-800 hover:bg-purple-100/60'
                  }`}
                >
                  <Crown className="w-3 h-3" />
                  <span>装飾品</span>
                </button>
              </div>

              {/* Equipments list */}
              <div className="space-y-2">
                {filteredEquipItems.map((item) => {
                  const basePrice = item.buyPrice || 0;
                  const effectivePrice = getItemPrice(basePrice);
                  const canAfford = state.gold >= effectivePrice;
                  const ownedCount = state.inventory[item.id] || 0;
                  const isEquipped =
                    state.equipped.weapon === item.id ||
                    state.equipped.armor === item.id ||
                    state.equipped.accessory === item.id;
                  const isJustPurchased = purchasedItemId === item.id;

                  const slotName =
                    item.equipSlot === 'weapon'
                      ? '武器'
                      : item.equipSlot === 'armor'
                      ? '防具'
                      : '装飾品';

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isJustPurchased
                          ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                          : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                          <ItemIcon name={item.icon} className="w-5 h-5 text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-900">{item.name}</span>
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                              {slotName}
                            </span>
                            {isEquipped ? (
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                                装備中
                              </span>
                            ) : ownedCount > 0 ? (
                              <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                所持: {ownedCount}
                              </span>
                            ) : null}
                          </div>

                          <p className="text-[10px] text-slate-600 mt-0.5 leading-snug break-words">
                            {item.description}
                          </p>

                          {/* Stats Row */}
                          {item.equipStats && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] font-mono font-bold text-slate-600">
                              {Object.entries(item.equipStats).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="bg-slate-100 px-1 py-0.2 rounded text-[9px] text-slate-700"
                                >
                                  {k.toUpperCase()} +{v}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex items-center gap-1 text-xs font-mono font-black text-amber-900">
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                              <span>{effectivePrice.toLocaleString()} G</span>
                            </div>
                            {discountPercent > 0 && (
                              <span className="text-[10px] font-mono line-through text-slate-400">
                                {basePrice.toLocaleString()} G
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => handleBuyItem(item, 1)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-2xs shrink-0 ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        購入
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: POUCH GEAR (ポーチセット本体) */}
          {/* ========================================================== */}
          {mainTab === 'pouches' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-[11px]">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>上位ポーチセットの購入と装備</span>
                </div>
                <p className="text-[10px] text-amber-900 leading-relaxed font-medium">
                  購入すると<strong>自動的に即時装備</strong>されます。
                  以前のポーチに入っていた携帯アイテムは、すべて<strong>インベントリに安全に全数退避</strong>されます。
                </p>
              </div>

              {Object.values(POUCH_GEARS).map((gear) => {
                const isOwned = state.ownedPouchGears.includes(gear.id);
                const isEquipped = state.equippedPouch === gear.id;
                const isLocked = clearedDungeonsCount < gear.requiredDungeonsCleared;
                const basePrice = gear.buyPrice;
                const effectivePrice = getItemPrice(basePrice);
                const canAfford = state.gold >= effectivePrice;
                const isJustPurchased = purchasedItemId === gear.id;

                return (
                  <div
                    key={gear.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isJustPurchased
                        ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                        : isEquipped
                        ? 'bg-emerald-50/80 border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                        : isOwned
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : isLocked
                        ? 'bg-slate-100/70 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 shadow-xs hover:border-amber-300'
                    }`}
                  >
                    {/* Top Row: Icon, Title & Pricing */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center shrink-0">
                          {getPouchIcon(gear.icon)}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black text-slate-900">{gear.name}</h4>
                            {isEquipped && (
                              <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.2 rounded-md flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> 装備中
                              </span>
                            )}
                            {isOwned && !isEquipped && (
                              <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-md">
                                所持済
                              </span>
                            )}
                            {isLocked && (
                              <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-md border border-rose-200 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> 迷宮踏破 {gear.requiredDungeonsCleared}箇所で陳列
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-600 mt-0.5 leading-snug break-words">
                            {gear.description}
                          </p>
                        </div>
                      </div>

                      {/* Pricing or Status Badge */}
                      <div className="shrink-0 text-right">
                        {!isOwned && !isLocked && (
                          <div className="flex items-center justify-end gap-1 text-xs font-mono font-black text-amber-900">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            <span>{effectivePrice.toLocaleString()} G</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Capacity Grid Bar */}
                    <div className="mt-2.5 pt-2 border-t border-slate-150 grid grid-cols-4 gap-1.5 text-center">
                      <div className="bg-rose-50/80 rounded-lg p-1 border border-rose-200/80">
                        <div className="text-[9px] text-rose-700 font-bold">回復薬</div>
                        <div className="text-xs font-black text-rose-950 font-mono">
                          {gear.capacity.potion}枠
                        </div>
                      </div>
                      <div className="bg-amber-50/80 rounded-lg p-1 border border-amber-200/80">
                        <div className="text-[9px] text-amber-700 font-bold">食糧</div>
                        <div className="text-xs font-black text-amber-950 font-mono">
                          {gear.capacity.food}枠
                        </div>
                      </div>
                      <div className="bg-purple-50/80 rounded-lg p-1 border border-purple-200/80">
                        <div className="text-[9px] text-purple-700 font-bold">消耗品</div>
                        <div className="text-xs font-black text-purple-950 font-mono">
                          {gear.capacity.consumable}枠
                        </div>
                      </div>
                      <div className="bg-cyan-50/80 rounded-lg p-1 border border-cyan-200/80">
                        <div className="text-[9px] text-cyan-700 font-bold">ガジェット</div>
                        <div className="text-xs font-black text-cyan-950 font-mono">
                          {gear.capacity.gadget}枠
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {!isOwned && (
                      <div className="mt-2.5 flex justify-end">
                        <button
                          disabled={isLocked || !canAfford}
                          onClick={() => handleBuyPouch(gear.id)}
                          className={`px-4 py-1.5 rounded-xl font-black text-xs active:scale-95 transition-all shadow-xs flex items-center gap-1 ${
                            isLocked
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{isLocked ? '迷宮未踏破のため陳列前' : canAfford ? '購入して即時装備' : '資金不足'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
