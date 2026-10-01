import React from 'react';
import { useGame } from '../context/GameContext';
import { Coins, AlertCircle, CheckCircle, Home } from 'lucide-react';
import { sound } from '../utils/sound';

export const RentModal: React.FC = () => {
  const { activeRentEvent, dismissRentEvent } = useGame();

  if (!activeRentEvent) return null;

  const { amount, isPaid, day } = activeRentEvent;

  const handleClose = () => {
    sound.playTap();
    dismissRentEvent();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full text-slate-800 shadow-2xl border border-amber-200">
        <div className="text-center mb-4">
          <div
            className={`inline-flex p-3 rounded-full mb-2 ${
              isPaid
                ? 'bg-emerald-100 text-emerald-600 border border-emerald-300'
                : 'bg-rose-100 text-rose-600 border border-rose-300'
            }`}
          >
            {isPaid ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            【第 {day} 日】週次家賃・生活費の決済
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            7日間の共同生活が経過し、ギルドへの家賃と工房の維持費が引き落とされました。
          </p>
        </div>

        <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 mb-4 text-center">
          <div className="text-[11px] text-slate-500 font-bold">請求金額</div>
          <div className="text-xl font-black text-amber-900 font-mono tabular-nums">
            {amount} G
          </div>
          <div
            className={`text-xs font-bold mt-1 ${
              isPaid ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {isPaid
              ? '無事に今週分の支払いが完了しました！'
              : '所持金が不足し全額回収できませんでした…来週までに取り戻しましょう！'}
          </div>
        </div>

        {/* Sisters' remarks */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs space-y-2 mb-4">
          <div className="flex items-start gap-2">
            <span className="font-extrabold text-sky-600 shrink-0">プリムラ:</span>
            <p className="text-slate-700">
              {isPaid
                ? '「指導役さん、ありがとうございます！今週も家賃が払えてアトリエを維持できました。」'
                : '「うぅ…お金が足りないみたいです。私がもっと換金ポーションを作ってお手伝いしますね…！」'}
            </p>
          </div>
          <div className="flex items-start gap-2 pt-1.5 border-t border-slate-200/60">
            <span className="font-extrabold text-rose-600 shrink-0">レオ:</span>
            <p className="text-slate-700">
              {isPaid
                ? '「よしっ！これで来週も思いっきりダンジョンに突っ込めるな！」'
                : '「くっ、私の稼ぎが足りなかったか…！明日はもっとレアな素材を狩りまくってくるよ！」'}
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-98 transition-all"
        >
          次の一週間に向けて前進する
        </button>
      </div>
    </div>
  );
};
