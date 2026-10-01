import React from 'react';
import { Home, Compass, Landmark, FlaskConical, Swords, ShoppingBag } from 'lucide-react';
import { sound } from '../utils/sound';

export type TabKey = 'home' | 'gather' | 'dungeon' | 'alchemy' | 'status' | 'shop';

interface BottomNavProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'home', label: '拠点', icon: <Home className="w-5 h-5" />, color: 'text-amber-500' },
    { key: 'gather', label: '採取', icon: <Compass className="w-5 h-5" />, color: 'text-emerald-500' },
    { key: 'dungeon', label: '迷宮', icon: <Landmark className="w-5 h-5" />, color: 'text-indigo-500' },
    { key: 'alchemy', label: '調合', icon: <FlaskConical className="w-5 h-5" />, color: 'text-sky-500' },
    { key: 'status', label: '育成', icon: <Swords className="w-5 h-5" />, color: 'text-rose-500' },
    { key: 'shop', label: '商店', icon: <ShoppingBag className="w-5 h-5" />, color: 'text-amber-600' },
  ];

  const handleTabClick = (key: TabKey) => {
    sound.playTap();
    onSelectTab(key);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200/80 shadow-lg pb-safe">
      <div className="grid grid-cols-6 max-w-lg mx-auto h-16 items-center px-1">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] py-1 transition-all ${
                isActive ? 'scale-105 font-bold' : 'opacity-65 hover:opacity-100 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-100/80 shadow-xs' : 'bg-transparent'
                }`}
              >
                <div className={isActive ? tab.color : 'text-slate-600'}>{tab.icon}</div>
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${
                  isActive ? 'text-amber-900 font-bold' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
