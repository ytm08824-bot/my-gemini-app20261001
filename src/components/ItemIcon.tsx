import React from 'react';
import {
  Leaf,
  Droplets,
  Sparkles,
  Gem,
  Diamond,
  Scroll,
  Flame,
  HeartPulse,
  Heart,
  Zap,
  FlaskConical,
  Bomb,
  Coins,
  Crown,
  Sword,
  Crosshair,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Compass,
  Package,
} from 'lucide-react';

interface ItemIconProps {
  name: string;
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Leaf':
      return <Leaf className={`${className} text-emerald-500`} />;
    case 'Droplets':
      return <Droplets className={`${className} text-sky-500`} />;
    case 'Sparkles':
      return <Sparkles className={`${className} text-amber-400`} />;
    case 'Gem':
      return <Gem className={`${className} text-slate-400`} />;
    case 'Sparkle':
      return <Sparkles className={`${className} text-slate-300`} />;
    case 'Diamond':
      return <Diamond className={`${className} text-indigo-400`} />;
    case 'Scroll':
      return <Scroll className={`${className} text-amber-600`} />;
    case 'Flame':
      return <Flame className={`${className} text-rose-500`} />;
    case 'HeartPulse':
      return <HeartPulse className={`${className} text-rose-500`} />;
    case 'Heart':
      return <Heart className={`${className} text-rose-500 fill-rose-500`} />;
    case 'Zap':
      return <Zap className={`${className} text-amber-500 fill-amber-500`} />;
    case 'FlaskConical':
      return <FlaskConical className={`${className} text-emerald-500`} />;
    case 'Bomb':
      return <Bomb className={`${className} text-orange-500`} />;
    case 'Coins':
      return <Coins className={`${className} text-amber-500`} />;
    case 'Crown':
      return <Crown className={`${className} text-amber-400 fill-amber-300`} />;
    case 'Sword':
      return <Sword className={`${className} text-red-500`} />;
    case 'Crosshair':
      return <Crosshair className={`${className} text-teal-500`} />;
    case 'Shield':
      return <Shield className={`${className} text-blue-500`} />;
    case 'ShieldAlert':
      return <ShieldAlert className={`${className} text-emerald-600`} />;
    case 'ShieldCheck':
      return <ShieldCheck className={`${className} text-indigo-600`} />;
    case 'Compass':
      return <Compass className={`${className} text-purple-500`} />;
    default:
      return <Package className={`${className} text-amber-700`} />;
  }
};
