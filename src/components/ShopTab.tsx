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
} from 'lucide-react';
import { sound } from '../utils/sound';
import { ShopBuyModal } from './ShopBuyModal';
import { ShopSellModal } from './ShopSellModal';

// Fiona's dialogue lines (Young shopkeeper, admirer of the player "相談役", cares for the sisters, loves sweets & slacking off)
const FIONA_DIALOGUES = [
  'いらっしゃいませ、相談役！ふふ、今日も会えて嬉しいです。何かお探しのものはありますか？',
  '相談役が現役冒険者だった頃の記録、私、ギルド資料室で何度も読み返したんですよ。本当に憧れだったんです！',
  '私のこの黒髪……昔、相談役が「艶があって綺麗だね」って褒めてくれたこと、ずっと大切に覚えてるんです。',
  'レオちゃんは今日も元気に素振りしてましたか？あの子、無理しがちですから……相談役、優しく見守ってあげてくださいね。',
  'プリムラちゃん用の良質な錬金試薬、奥にちゃんと取り置きしてありますよ。相談役の工房のためなら、えへへ、特別扱いです！',
  'ねえ相談役、次のギルド買い出し……こっそり一緒に行きませんか？駅前の焼き菓子屋さん、新作のタルトが出たみたいで！',
  'ギルド長が席を外してる今がチャンスです……ふふっ、お茶請けの蜂蜜クッキー、相談役にも半分あげちゃいますね。',
  '相談役がお怪我でもしたら、私……心配で仕事が手につかなくなっちゃいます。回復薬は必ず多めに持っていってくださいね！',
  '素材や戦利品の買い取りなら任せてください！相談役が集めてきてくれた品なら、査定も気合いを入れて頑張っちゃいます。',
  '用事がなくても、こうしてお顔を見せてくださるだけで元気が湧いてきます。……またすぐ、会いに来てくれますよね？',
  '商店の在庫整理って結構大変なんですけど……相談役とお話しできると思えば、毎日あっという間です！',
  '今度のアトリエの差し入れ、何がいいですか？街で評判の焼きリンゴを見かけて……相談役の喜ぶ顔が見たいなって。',
];

export const ShopTab: React.FC = () => {
  const { state } = useGame();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

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

  const handleOpenBuy = () => {
    sound.playTap();
    setShowBuyModal(true);
  };

  const handleOpenSell = () => {
    sound.playTap();
    setShowSellModal(true);
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
      {/* 1: Sticky Top Header (Store Dedicated Slim Header) */}
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
      <div className="relative flex-1 overflow-hidden flex flex-col justify-between pb-56">
        {/* Fullscreen Shop Background (starts right below header) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/src/assets/images/shop_bg.png"
            alt="ギルド商店背景"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />

          {/* Subtle Scrims */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/55 via-black/25 to-transparent pointer-events-none" />

          {/* Soft Golden Sunlight / Light Leak Effect */}
          <div
            className="absolute -top-16 -right-16 w-80 h-80 rounded-full pointer-events-none blur-2xl opacity-70"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(254,240,138,0.45) 35%, rgba(251,191,36,0.2) 60%, transparent 80%)',
              mixBlendMode: 'screen',
            }}
          />
          <div
            className="absolute -top-10 -left-10 w-64 h-64 rounded-full pointer-events-none blur-2xl opacity-40"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(254,243,199,0.3) 35%, transparent 70%)',
              mixBlendMode: 'screen',
            }}
          />
        </div>

        {/* Interactive Touch Zone for Background (Tapping anywhere in center advances dialogue) */}
        <div
          onClick={handleNextDialogue}
          className="absolute inset-x-0 top-0 bottom-52 z-10 cursor-pointer flex items-center justify-center"
          title="画面タップで会話"
        >
          {tapEffect && (
            <div
              className="absolute pointer-events-none w-16 h-16 -ml-8 -mt-8 rounded-full border-2 border-amber-300/80 bg-amber-200/30 animate-ping"
              style={{ left: tapEffect.x, top: tapEffect.y }}
            />
          )}
        </div>

        {/* Upper Floating Notice: Valuables Notification (if any) */}
        <div className="relative z-15 p-3 pointer-events-auto">
          {valuableItems.length > 0 && (
            <div
              onClick={handleOpenSell}
              className="cursor-pointer bg-white/92 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-amber-300 shadow-md flex items-center justify-between gap-2.5 active:scale-[0.99] transition-transform"
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

      {/* 3: Bottom Fixed Area: Dialogue Balloon + Action Buttons */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-3 pb-2 pt-4 bg-gradient-to-t from-black/60 via-black/25 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
          {/* Fiona Dialogue Balloon (Translucent Frosted Glass Visual Novel Style) */}
          <div
            onClick={handleNextDialogue}
            className="cursor-pointer bg-white/40 hover:bg-white/50 active:scale-[0.99] backdrop-blur-md rounded-2xl p-3 border border-amber-300/70 shadow-lg text-slate-900 transition-all select-none"
            title="タップで会話送り"
          >
            <div className="flex items-center justify-between mb-1.5">
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
            <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-relaxed pl-0.5 min-h-[38px] flex items-center drop-shadow-xs">
              「{currentDialogue}」
            </p>
          </div>

          {/* Action Buttons: 購入 & 売却 */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1: 購入ボタン */}
            <button
              onClick={handleOpenBuy}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white p-3 shadow-lg shadow-amber-950/30 border border-amber-200/80 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[54px]"
            >
              <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <ShoppingBag className="w-4 h-4 text-white drop-shadow-xs group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black tracking-wide drop-shadow-xs">商品を購入</div>
                <div className="text-[10px] text-amber-100 font-medium">装備・薬品・素材</div>
              </div>
            </button>

            {/* 2: 売却ボタン */}
            <button
              onClick={handleOpenSell}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white p-3 shadow-lg shadow-emerald-950/30 border border-emerald-200/80 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[54px]"
            >
              <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Coins className="w-4 h-4 text-white drop-shadow-xs group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black tracking-wide drop-shadow-xs">所持品を売却</div>
                <div className="text-[10px] text-emerald-100 font-medium">
                  {valuableItems.length > 0 ? '換金財宝あり！' : '素材・戦利品'}
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
    </div>
  );
};
