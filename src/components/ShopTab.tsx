import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ITEMS } from '../data/initialData';
import {
  ShoppingBag,
  Coins,
  Sparkles,
  ArrowRight,
  Store,
  MessageCircle,
  Heart,
  Scroll,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../utils/sound';
import { ShopBuyModal } from './ShopBuyModal';
import { ShopSellModal } from './ShopSellModal';
import { QuestBoardModal } from './QuestBoardModal';

// Fiona's dialogue lines (Young shopkeeper, admirer of the player "相談役", cares for the sisters, loves sweets & slacking off)
const FIONA_DIALOGUES = [
  'いらっしゃいませ、相談役！ふふ、今日も会えて嬉しいです。何かお探しのものはありますか？',
  '採取地で一度でも見つけた通常素材なら、問屋から毎朝仕入れて店頭に並べられますよ！迷宮を踏破するほど毎日の仕入れ上限もアップします！',
  '街のギルド依頼掲示板、新しい依頼が届いてますよ！アトリエで姉妹が調合したお薬や食糧を納品すると、高額ゴールドや研究素材が貰えます！',
  '迷宮を踏破していくと、ギルド特注の上位ポーチセットや探検リュックも店頭に並ぶようになりますからね！',
  '相談役が現役冒険者だった頃の記録、私、ギルド資料室で何度も読み返したんですよ。本当に憧れだったんです！',
  '私のこの黒髪……昔、相談役が「艶があって綺麗だね」って褒めてくれたこと、ずっと大切に覚えてるんです。',
  'レオちゃんは今日も元気に素振りしてましたか？あの子、無理しがちですから……相談役、優しく見守ってあげてくださいね。',
  '素材や戦利品の買い取りなら任せてください！相談役が集めてきてくれた品なら、査定も気合いを入れて頑張っちゃいます。',
  'ねえ相談役、次のギルド買い出し……こっそり一緒に行きませんか？駅前の焼き菓子屋さん、新作のタルトが出たみたいで！',
  'ギルド長が席を外してる今がチャンスです……ふふっ、お茶請けの蜂蜜クッキー、相談役にも半分あげちゃいますね。',
  '相談役がお怪我でもしたら、私……心配で仕事が手につかなくなっちゃいます。回復薬は必ず多めに持っていってくださいね！',
  '用事がなくても、こうしてお顔を見せてくださるだけで元気が湧いてきます。……またすぐ、会いに来てくれますよね？',
];

export const ShopTab: React.FC = () => {
  const { state } = useGame();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);

  // Dialogue index (starts at 0: Welcome dialogue whenever visiting the shop)
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [tapEffect, setTapEffect] = useState<{ x: number; y: number } | null>(null);

  // Valuable items ready for cash-in
  const inventoryEntries = Object.entries(state.inventory)
    .filter(([_, count]) => count > 0)
    .map(([itemId, count]) => ({
      item: ITEMS[itemId],
      count,
    }))
    .filter((entry) => Boolean(entry.item));

  const valuableItems = inventoryEntries.filter((entry) => entry.item.type === 'valuable');
  const totalValuablesGold = valuableItems.reduce(
    (acc, entry) => acc + entry.item.sellPrice * entry.count,
    0
  );

  // Ready Quests count (only for available quests where target item is unlocked or researched)
  const clearedDungeonsCount = state.dungeons.filter((d) => d.isCleared).length;
  const readyQuestsCount = (state.quests || []).filter((q) => {
    if (q.isClaimed) return false;
    if (
      typeof q.requiredDungeonsCleared === 'number' &&
      clearedDungeonsCount < q.requiredDungeonsCleared
    ) {
      return false;
    }
    const hasEverObtained =
      state.unlockedMaterials.includes(q.targetItemId) ||
      (state.inventory[q.targetItemId] || 0) > 0;
    const isRecipeResearched = state.recipes.some(
      (r) => r.resultItemId === q.targetItemId && r.isResearched
    );
    if (!hasEverObtained && !isRecipeResearched) return false;

    const currentCount = state.inventory[q.targetItemId] || 0;
    return currentCount >= q.targetCount;
  }).length;

  const handleOpenBuy = () => {
    sound.playTap();
    setShowBuyModal(true);
  };

  const handleOpenSell = () => {
    sound.playTap();
    setShowSellModal(true);
  };

  const handleOpenQuest = () => {
    sound.playTap();
    setShowQuestModal(true);
  };

  const handleNextDialogue = (e?: React.MouseEvent) => {
    sound.playTap();
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setTapEffect({ x, y });
      setTimeout(() => setTapEffect(null), 600);
    }
    setDialogueIndex((prev) => (prev + 1) % FIONA_DIALOGUES.length);
  };

  const currentDialogue = FIONA_DIALOGUES[dialogueIndex];

  return (
    <div className="relative min-h-[calc(100vh-64px)] h-[calc(100dvh-64px)] max-w-lg mx-auto flex flex-col overflow-hidden select-none">
      {/* 1: Sticky Top Header */}
      <header className="sticky top-0 z-20 shrink-0 bg-white/95 backdrop-blur-md border-b border-amber-200/90 shadow-xs px-3.5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Store className="w-4 h-4 text-amber-100" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-amber-950 truncate">街の冒険者ギルド商店</h2>
            <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full border border-amber-300/60 shadow-2xs shrink-0">
              営業中
            </span>
          </div>
        </div>

        {/* Gold balance badge */}
        <div className="shrink-0 bg-amber-50/90 border border-amber-300/80 px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1">
          <span className="text-[9px] text-amber-800 font-bold hidden sm:inline">所持金:</span>
          <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-amber-950 font-mono tabular-nums">
            {state.gold.toLocaleString()} G
          </span>
        </div>
      </header>

      {/* 2: Background & Middle Interactive Area */}
      <div className="relative flex-1 overflow-hidden flex flex-col justify-between pb-64">
        {/* Fullscreen Shop Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/src/assets/images/shop_bg.png"
            alt="ギルド商店背景"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />

          {/* Scrims */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/60 via-black/30 to-transparent pointer-events-none" />

          {/* Soft Golden Sunlight / Light Leak Effect */}
          <div
            className="absolute -top-16 -right-16 w-80 h-80 rounded-full pointer-events-none blur-2xl opacity-70"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(254,240,138,0.45) 35%, rgba(251,191,36,0.2) 60%, transparent 80%)',
              mixBlendMode: 'screen',
            }}
          />
        </div>

        {/* Interactive Touch Zone for Background */}
        <div
          onClick={handleNextDialogue}
          className="absolute inset-x-0 top-0 bottom-60 z-10 cursor-pointer flex items-center justify-center"
          title="画面タップで会話"
        >
          {tapEffect && (
            <div
              className="absolute pointer-events-none w-16 h-16 -ml-8 -mt-8 rounded-full border-2 border-amber-300/80 bg-amber-200/30 animate-ping"
              style={{ left: tapEffect.x, top: tapEffect.y }}
            />
          )}
        </div>

        {/* Upper Floating Notices (Quests & Valuables) */}
        <div className="relative z-15 p-3 space-y-2 pointer-events-auto">
          {/* Quests Ready Banner */}
          {readyQuestsCount > 0 && (
            <div
              onClick={handleOpenQuest}
              className="cursor-pointer bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-emerald-300 shadow-md flex items-center justify-between gap-2.5 active:scale-[0.99] transition-transform animate-pulse"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Scroll className="w-3.5 h-3.5 text-emerald-100" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-black text-emerald-950 flex items-center gap-1">
                    <span className="truncate">納品可能なギルド依頼があります！</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-emerald-800 font-medium truncate">
                    {readyQuestsCount}件の依頼で報奨金や研究ポイントを受取可能です
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-0.5 border border-emerald-300/70 shadow-2xs">
                掲示板へ <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          )}

          {/* Valuables Banner */}
          {valuableItems.length > 0 && (
            <div
              onClick={handleOpenSell}
              className="cursor-pointer bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-amber-300 shadow-md flex items-center justify-between gap-2.5 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-black text-amber-950 flex items-center gap-1">
                    <span className="truncate">換金用の財宝があります！</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-amber-900 font-medium truncate">
                    売却メニューから <strong className="font-mono font-bold">{totalValuablesGold.toLocaleString()} G</strong> に一括換金できます
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-0.5 border border-amber-300/70 shadow-2xs">
                売却へ <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3: Bottom Fixed Area: Dialogue Balloon + 3 Action Cards */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-3 pb-2 pt-3 bg-gradient-to-t from-black/65 via-black/35 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
          {/* Fiona Dialogue Balloon */}
          <div
            onClick={handleNextDialogue}
            className="cursor-pointer bg-white/45 hover:bg-white/55 active:scale-[0.99] backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-amber-300/70 shadow-lg text-slate-900 transition-all select-none"
            title="タップで会話送り"
          >
            <div className="flex items-center justify-between mb-1">
              {/* Character Badge */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black bg-gradient-to-r from-amber-600 to-amber-700 text-white px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                  <span>フィオナ</span>
                  <Heart className="w-2.5 h-2.5 text-rose-200 fill-rose-200" />
                </span>
                <span className="text-[10px] text-amber-950 font-bold">
                  ギルド商店 看板娘
                </span>
              </div>

              {/* Tap Hint */}
              <div className="flex items-center gap-1 text-[10px] text-amber-800 font-bold animate-pulse">
                <MessageCircle className="w-3 h-3 text-amber-700" />
                <span>タップで会話</span>
              </div>
            </div>

            {/* Dialogue text */}
            <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-relaxed pl-0.5 min-h-[36px] flex items-center drop-shadow-xs">
              「{currentDialogue}」
            </p>
          </div>

          {/* 3 Action Cards Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1: 購入 */}
            <button
              onClick={handleOpenBuy}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white p-2.5 shadow-lg shadow-amber-950/30 border border-amber-200/80 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 min-h-[58px]"
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <ShoppingBag className="w-4 h-4 text-white drop-shadow-xs group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-center">
                <div className="text-[11px] font-black tracking-wide drop-shadow-xs">商店で購入</div>
                <div className="text-[9px] text-amber-100 font-medium">ポーチ・素材・装備</div>
              </div>
            </button>

            {/* 2: 売却 */}
            <button
              onClick={handleOpenSell}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white p-2.5 shadow-lg shadow-emerald-950/30 border border-emerald-200/80 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 min-h-[58px]"
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Coins className="w-4 h-4 text-white drop-shadow-xs group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-center">
                <div className="text-[11px] font-black tracking-wide drop-shadow-xs">所持品売却</div>
                <div className="text-[9px] text-emerald-100 font-medium">換金・査定UP</div>
              </div>
            </button>

            {/* 3: 依頼掲示板 */}
            <button
              onClick={handleOpenQuest}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-slate-800 text-white p-2.5 shadow-lg shadow-indigo-950/30 border border-indigo-200/80 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 min-h-[58px]"
            >
              {readyQuestsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-ping" />
              )}
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Scroll className="w-4 h-4 text-white drop-shadow-xs group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-center">
                <div className="text-[11px] font-black tracking-wide drop-shadow-xs">依頼掲示板</div>
                <div className="text-[9px] text-purple-200 font-medium">
                  {readyQuestsCount > 0 ? `${readyQuestsCount}件受取可` : '街の依頼'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && <ShopBuyModal onClose={() => setShowBuyModal(false)} />}

      {/* Sell Modal */}
      {showSellModal && <ShopSellModal onClose={() => setShowSellModal(false)} />}

      {/* Quest Board Modal */}
      {showQuestModal && <QuestBoardModal onClose={() => setShowQuestModal(false)} />}
    </div>
  );
};
