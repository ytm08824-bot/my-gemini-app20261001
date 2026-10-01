/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { BottomNav, TabKey } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { GatherTab } from './components/GatherTab';
import { DungeonTab } from './components/DungeonTab';
import { AlchemyTab } from './components/AlchemyTab';
import { StatusTab } from './components/StatusTab';
import { ShopTab } from './components/ShopTab';
import { DepartureConfirmModal } from './components/DepartureConfirmModal';
import { AdventureModal } from './components/AdventureModal';
import { RentModal } from './components/RentModal';
import { GatheringField, Dungeon } from './types/game';

const GameMain: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabKey>('home');

  // Pending departure confirmation (pouch setup)
  const [pendingDeparture, setPendingDeparture] = useState<{
    mode: 'gathering' | 'dungeon';
    field?: GatheringField;
    dungeon?: Dungeon;
  } | null>(null);

  // Active running adventure
  const [activeAdventure, setActiveAdventure] = useState<{
    mode: 'gathering' | 'dungeon';
    field?: GatheringField;
    dungeon?: Dungeon;
  } | null>(null);

  const handleRequestGathering = (field: GatheringField) => {
    setPendingDeparture({
      mode: 'gathering',
      field,
    });
  };

  const handleRequestDungeon = (dungeon: Dungeon) => {
    setPendingDeparture({
      mode: 'dungeon',
      dungeon,
    });
  };

  const handleConfirmDeparture = () => {
    if (pendingDeparture) {
      setActiveAdventure(pendingDeparture);
      setPendingDeparture(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex justify-center selection:bg-amber-400 selection:text-amber-950">
      {/* Smartphone frame container */}
      <div className="w-full max-w-md bg-stone-50 min-h-screen flex flex-col shadow-2xl relative border-x border-amber-900/10">
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'home' && <HomeTab onNavigate={setCurrentTab} />}
          {currentTab === 'gather' && (
            <GatherTab onStartGathering={handleRequestGathering} />
          )}
          {currentTab === 'dungeon' && (
            <DungeonTab onStartDungeon={handleRequestDungeon} />
          )}
          {currentTab === 'alchemy' && <AlchemyTab />}
          {currentTab === 'status' && <StatusTab />}
          {currentTab === 'shop' && <ShopTab />}
        </main>

        <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Departure Confirmation & Pouch Management Modal */}
        {pendingDeparture && (
          <DepartureConfirmModal
            mode={pendingDeparture.mode}
            field={pendingDeparture.field}
            dungeon={pendingDeparture.dungeon}
            onConfirm={handleConfirmDeparture}
            onClose={() => setPendingDeparture(null)}
          />
        )}

        {/* Adventure Engine Running Modal */}
        {activeAdventure && (
          <AdventureModal
            mode={activeAdventure.mode}
            field={activeAdventure.field}
            dungeon={activeAdventure.dungeon}
            onClose={() => setActiveAdventure(null)}
          />
        )}

        {/* Weekly Rent Settlement Modal */}
        <RentModal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameMain />
    </GameProvider>
  );
}
