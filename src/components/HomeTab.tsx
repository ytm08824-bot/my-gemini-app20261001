import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TabKey } from './BottomNav';
import { FacilitiesModal } from './FacilitiesModal';
import { InventoryModal } from './InventoryModal';
import {
  Sparkles,
  FlaskConical,
  MessageCircle,
  HelpCircle,
  Swords,
  Package,
  Calendar,
  Home as HomeIcon,
  AlertCircle,
  CheckCircle2,
  Volume2,
  VolumeX,
  RotateCcw,
  Coins,
  X,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface HomeTabProps {
  onNavigate: (tab: TabKey) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onNavigate }) => {
  const {
    state,
    weeklyRent,
    daysUntilRent,
    resetGame,
    soundEnabled,
    toggleSound,
  } = useGame();

  const [selectedSister, setSelectedSister] = useState<'leo' | 'primula'>('leo');
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);
  const [showFacilitiesModal, setShowFacilitiesModal] = useState<boolean>(false);
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [tapEffect, setTapEffect] = useState<{ x: number; y: number } | null>(null);

  const isRentAffordable = state.gold >= weeklyRent;

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  // Dialogue lines
  const leoQuotes = [
    '指導役！今日も早く冒険に出ようぜ！伝説のダンジョンが私達を待ってるんだ！',
    'ふふん、私の身のこなしならどんな罠も楽勝だよ！…あっ、可愛い子猫みっけ！',
    'プリムラのポーション、すごく助かるんだ。あの子の錬金術は私が守る！',
    '冒険で手に入れた素材、プリムラに渡して新しいアイテムを作ってもらおう！',
    '体力が減ったら無理せず撤退するのも一流の技法…って、指導役に教わったもんね！',
    '指導役、お腹すいたなー！今日の夕飯はプリムラ特製のシチューかな？',
  ];

  const primulaQuotes = [
    '指導役さん、お疲れ様です。調合スロットの準備はいつでも万全ですよ。',
    'お姉ちゃんが怪我をしないように、回復薬や探索道具をたくさん用意しますね。',
    '本棚の古文書を研究すれば、新しい調合レシピを解読できるはずです…！',
    '今週の家賃と施設費は大丈夫でしょうか…？計画的にお金を用意しておきますね。',
    '調合スロットに材料を仕込んでおけば、お姉ちゃんの冒険中に完成しますよ！',
    '指導役さんの期待に応えられるよう、もっと立派な錬金術師になります！',
  ];

  const currentQuotes = selectedSister === 'leo' ? leoQuotes : primulaQuotes;
  const currentQuote = currentQuotes[quoteIndex % currentQuotes.length];

  // Advance dialogue on character or bubble tap
  const handleDialogueNext = (e?: React.MouseEvent) => {
    sound.playTap();
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTapEffect({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setTimeout(() => setTapEffect(null), 600);
    }
    setQuoteIndex((prev) => (prev + 1) % currentQuotes.length);
  };

  // Toggle sister
  const handleSwitchSister = () => {
    sound.playTap();
    const nextSister = selectedSister === 'leo' ? 'primula' : 'leo';
    setSelectedSister(nextSister);
    setQuoteIndex(0);
  };

  const bgImage =
    selectedSister === 'leo'
      ? '/src/assets/images/home_bg_leo_1790669078447.png'
      : '/src/assets/images/home_bg_primula_1790646358772.jpg';

  const otherSister = selectedSister === 'leo' ? 'primula' : 'leo';
  const otherSisterName = otherSister === 'leo' ? 'レオ' : 'プリムラ';
  const otherSisterAvatar =
    otherSister === 'leo'
      ? '/src/assets/images/character_leo_portrait_1790577806510.jpg'
      : '/src/assets/images/character_primula_portrait_1790577820699.jpg';

  return (
    <div className="relative min-h-[calc(100vh-64px)] h-[calc(100dvh-64px)] flex flex-col justify-between pb-2 overflow-hidden select-none">
      {/* 1: Character Fullscreen Background (100% Brightness & Saturation, No Dark Filters) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          key={selectedSister}
          src={bgImage}
          alt={selectedSister === 'leo' ? 'レオ' : 'プリムラ'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-all duration-700 ease-out"
        />

        {/* 2: Social Game Scrims (Edge-only subtle gradients: Top & Bottom only. Center is completely clean) */}
        {/* Top Scrim (for Header & Status readability) */}
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/40 via-black/15 to-transparent pointer-events-none" />
        {/* Bottom Scrim (for Dialogue & Action buttons readability) */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/45 via-black/15 to-transparent pointer-events-none" />

        {/* 3: Atelier-Style Sunlight & Light Leak (Soft golden glow & komorebi effects) */}
        {/* Main top-right light leak */}
        <div
          className="absolute -top-16 -right-16 w-80 h-80 rounded-full pointer-events-none blur-2xl opacity-75"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(254,240,138,0.45) 35%, rgba(251,191,36,0.2) 60%, transparent 80%)',
            mixBlendMode: 'screen',
          }}
        />
        {/* Secondary gentle canopy light beam */}
        <div
          className="absolute -top-8 right-12 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-50"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,240,0.6) 0%, rgba(253,230,138,0.25) 40%, transparent 70%)',
            mixBlendMode: 'screen',
          }}
        />
        {/* Soft top-left ambient warm glow */}
        <div
          className="absolute -top-12 -left-12 w-64 h-64 rounded-full pointer-events-none blur-2xl opacity-45"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(254,243,199,0.3) 35%, transparent 70%)',
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* Interactive Character Touch Zone (Center screen tap triggers dialogue) */}
      <div
        onClick={handleDialogueNext}
        className="absolute inset-x-0 top-24 bottom-56 z-10 cursor-pointer flex items-center justify-center"
        title="タップで会話"
      >
        {tapEffect && (
          <div
            className="absolute pointer-events-none w-16 h-16 -ml-8 -mt-8 rounded-full border-2 border-amber-300/80 bg-amber-200/30 animate-ping"
            style={{ left: tapEffect.x, top: tapEffect.y }}
          />
        )}
      </div>

      {/* Top Floating HUD (Social Game Header) */}
      <header className="relative z-20 pt-2.5 px-2.5 space-y-2">
        {/* Top Header Row: Day & System Controls */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Day / Location Badge */}
          <div className="flex items-center gap-1.5">
            <div className="bg-white/90 backdrop-blur-md text-amber-950 border border-amber-300/80 px-3 py-1 rounded-2xl flex items-center gap-1.5 shadow-md text-xs font-black">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>第 {state.day} 日</span>
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 bg-white/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/60 shadow-xs">
              拠点アトリエ
            </span>
          </div>

          {/* System Control Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Story & Lore */}
            <button
              onClick={() => {
                sound.playTap();
                setShowStoryModal(true);
              }}
              className="bg-white/80 hover:bg-white active:scale-95 backdrop-blur-md text-amber-800 border border-amber-300/60 p-1.5 rounded-xl transition-all shadow-md"
              title="物語と指南"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              aria-label={soundEnabled ? '消音' : '音声を有効化'}
              className="bg-white/80 hover:bg-white active:scale-95 backdrop-blur-md text-slate-700 border border-white/80 p-1.5 rounded-xl transition-all shadow-md"
              title={soundEnabled ? '消音にする' : '音声を有効化'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 opacity-50 text-slate-400" />
              )}
            </button>

            {/* Reset Game */}
            <button
              onClick={() => {
                sound.playTap();
                setShowResetConfirm(true);
              }}
              aria-label="データ初期化"
              className="bg-white/80 hover:bg-rose-50 active:scale-95 backdrop-blur-md text-rose-600 border border-rose-300/60 p-1.5 rounded-xl transition-all shadow-md"
              title="データ初期化"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resources Bar (G / EXP / RP) */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* Gold */}
          <div className="bg-white/88 backdrop-blur-md border border-amber-300/80 rounded-2xl px-2.5 py-1.5 shadow-md flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] text-amber-800 font-bold uppercase tracking-wider leading-none">
                所持金
              </div>
              <div className="font-mono tabular-nums text-amber-950 font-black text-xs truncate mt-0.5">
                {state.gold.toLocaleString()}
                <span className="text-[9px] font-normal text-amber-800 ml-0.5">G</span>
              </div>
            </div>
          </div>

          {/* EXP */}
          <div className="bg-white/88 backdrop-blur-md border border-rose-300/80 rounded-2xl px-2.5 py-1.5 shadow-md flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] text-rose-800 font-bold uppercase tracking-wider leading-none">
                レオEXP
              </div>
              <div className="font-mono tabular-nums text-rose-950 font-black text-xs truncate mt-0.5">
                {state.leo.exp}
                <span className="text-[9px] font-normal text-rose-800 ml-0.5">Pt</span>
              </div>
            </div>
          </div>

          {/* RP */}
          <div className="bg-white/88 backdrop-blur-md border border-sky-300/80 rounded-2xl px-2.5 py-1.5 shadow-md flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-sky-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] text-sky-800 font-bold uppercase tracking-wider leading-none">
                研究RP
              </div>
              <div className="font-mono tabular-nums text-sky-950 font-black text-xs truncate mt-0.5">
                {state.researchPoints}
                <span className="text-[9px] font-normal text-sky-800 ml-0.5">Pt</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Middle Floating Widgets: Partner Switcher (Right) */}
      <div className="relative z-20 px-2.5 flex justify-end">
        {/* Social Game Partner Switcher Button */}
        <button
          onClick={handleSwitchSister}
          className="group flex items-center gap-2 bg-white/90 hover:bg-white active:scale-95 backdrop-blur-md border border-amber-300/80 hover:border-amber-400 px-3 py-1.5 rounded-full shadow-lg transition-all"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-400 bg-amber-50 shrink-0 shadow-inner">
            <img
              src={otherSisterAvatar}
              alt={otherSisterName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="text-left">
            <div className="text-[9px] font-extrabold text-amber-700 flex items-center gap-0.5 leading-none">
              <RefreshCw className="w-2.5 h-2.5 group-hover:rotate-180 transition-transform duration-500 text-amber-600" />
              <span>キャラ切替</span>
            </div>
            <div className="text-xs font-black text-slate-800 leading-tight mt-0.5">
              {otherSisterName}へ
            </div>
          </div>
        </button>
      </div>

      {/* Bottom Floating Section (Dialogue Bubble, Rent Banner & 3 Action Buttons) */}
      <footer className="relative z-20 px-3 space-y-2 mt-auto">
        {/* Dialogue Balloon (Social Game Visual Novel Style) */}
        <div
          onClick={handleDialogueNext}
          className={`cursor-pointer rounded-2xl p-3.5 backdrop-blur-md border shadow-lg transition-all active:scale-[0.99] ${
            selectedSister === 'leo'
              ? 'bg-white/40 hover:bg-white/50 border-rose-300/70 hover:border-rose-400 text-slate-900'
              : 'bg-white/40 hover:bg-white/50 border-sky-300/70 hover:border-sky-400 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            {/* Character Title / Name Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow-xs ${
                  selectedSister === 'leo'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white'
                    : 'bg-gradient-to-r from-sky-500 to-sky-600 text-white'
                }`}
              >
                {selectedSister === 'leo' ? 'レオ (姉)' : 'プリムラ (妹)'}
              </span>
              <span className="text-[10px] text-slate-700 font-bold">
                {selectedSister === 'leo'
                  ? `前衛軽戦士 · HP ${state.leo.hp}/${state.leo.maxHp}`
                  : `錬金術師見習い · 釜稼働 ${
                      state.alchemySlots.filter((s) => s.status !== 'empty').length
                    }/${state.alchemySlots.length}`}
              </span>
            </div>

            {/* Hint to tap */}
            <div className="flex items-center gap-1 text-[10px] text-amber-800 font-bold animate-pulse">
              <MessageCircle className="w-3 h-3 text-amber-700" />
              <span>タップで会話</span>
            </div>
          </div>

          {/* Dialogue Text */}
          <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-relaxed pl-1 drop-shadow-xs">
            「{currentQuote}」
          </p>
        </div>

        {/* Weekly Rent Banner (Compact Floating Bar) */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 border border-amber-300/80 shadow-md flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
              <HomeIcon className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-600 font-bold">次回家賃・生活費</span>
                <span className="font-mono font-black text-amber-900 text-xs tabular-nums">
                  {weeklyRent} G
                </span>
              </div>
              <div className="text-[9px] text-slate-500 truncate">
                基本家賃 100G + 施設費 {weeklyRent - 100}G
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 border ${
                daysUntilRent <= 2
                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>あと{daysUntilRent === 0 ? '本日！' : `${daysUntilRent}日`}</span>
            </span>

            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-0.5 border ${
                isRentAffordable
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {isRentAffordable ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>準備OK</span>
                </>
              ) : (
                <span>不足!</span>
              )}
            </span>
          </div>
        </div>

        {/* 3 Main Atelier Action Buttons (Rich Social Game Style) */}
        <div className="grid grid-cols-3 gap-2">
          {/* 1: アトリエ強化 */}
          <button
            onClick={() => {
              sound.playTap();
              setShowFacilitiesModal(true);
            }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white p-2.5 shadow-lg shadow-amber-900/20 border border-amber-200/80 active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-1 min-h-[68px]"
          >
            <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Sparkles className="w-5 h-5 text-amber-100 drop-shadow-xs group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black tracking-wide drop-shadow-xs">アトリエ強化</span>
            <span className="text-[9px] text-amber-100/90 font-medium">設備・スロット</span>
          </button>

          {/* 2: 育成 */}
          <button
            onClick={() => {
              sound.playTap();
              onNavigate('status');
            }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 text-white p-2.5 shadow-lg shadow-rose-900/20 border border-rose-200/80 active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-1 min-h-[68px]"
          >
            <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Swords className="w-5 h-5 text-rose-100 drop-shadow-xs group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black tracking-wide drop-shadow-xs">育成</span>
            <span className="text-[9px] text-rose-100/90 font-medium">能力値・装備</span>
          </button>

          {/* 3: 所持品 */}
          <button
            onClick={() => {
              sound.playTap();
              setShowInventoryModal(true);
            }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 text-white p-2.5 shadow-lg shadow-indigo-900/20 border border-indigo-200/80 active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-1 min-h-[68px]"
          >
            <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Package className="w-5 h-5 text-indigo-100 drop-shadow-xs group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black tracking-wide drop-shadow-xs">所持品</span>
            <span className="text-[9px] text-indigo-100/90 font-medium">アイテム確認</span>
          </button>
        </div>
      </footer>

      {/* Facilities Upgrade Modal */}
      {showFacilitiesModal && (
        <FacilitiesModal onClose={() => setShowFacilitiesModal(false)} />
      )}

      {/* Inventory Categorized Modal */}
      {showInventoryModal && (
        <InventoryModal onClose={() => setShowInventoryModal(false)} />
      )}

      {/* Story & Lore Modal */}
      {showStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-stone-900 rounded-3xl p-5 max-w-sm w-full text-stone-100 shadow-2xl border border-amber-400/40 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2.5">
              <h3 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                物語とゲームの進め方
              </h3>
              <button
                onClick={() => setShowStoryModal(false)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-stone-300 leading-relaxed space-y-2.5">
              <p>
                <strong className="text-amber-300">【あらすじ】</strong>
                <br />
                あなたは若くして引退した一流の元冒険者。ギルドの相談役として暮らす中、伝説のダンジョン攻略を夢見る新人の姉妹――短い赤髪と赤目が特徴の前衛戦士「レオ」と、穏やかで勉強熱心な錬金術師の妹「プリムラ」を預かることになった。
              </p>
              <p>
                <strong className="text-amber-300">【1日のサイクル】</strong>
                <br />
                冒険（採取フィールドやダンジョン）に出撃すると1日が経過します。
                仕込んでおいた調合品が完成し、レオの体力・HPが全快します。
              </p>
              <p>
                <strong className="text-amber-300">【週次家賃（7日ごと）】</strong>
                <br />
                7日ごとに基本家賃（100G）と施設の維持費が引き落とされます。冒険で得た素材や錬金したアイテムを商店で売却し、資金を維持しましょう！
              </p>
              <p>
                <strong className="text-amber-300">【育成とダンジョン攻略】</strong>
                <br />
                倒した魔物のEXPでレオのステータスを伸ばし、プリムラの錬金術で強力なポーションを持参させて、最深部に眠る伝説の迷宮の踏破を目指しましょう！
              </p>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowStoryModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-amber-950/60 active:scale-98 transition-all"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-stone-900 rounded-3xl p-5 max-w-xs w-full text-stone-100 shadow-2xl border border-rose-500/40">
            <h3 className="text-base font-bold text-rose-300 mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-400" />
              データをリセットしますか？
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              冒険の記録、レオの成長、錬金レシピ、所持金が初期状態に戻ります。この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs"
              >
                キャンセル
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-950/60 active:scale-98 transition-all"
              >
                リセット実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
