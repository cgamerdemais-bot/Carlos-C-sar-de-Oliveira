import React from 'react';
import { GameState, Upgrades, SkinId, HatId } from '../types';
import { PRICES } from '../constants';

interface GameHUDProps {
  gameState: GameState;
  onStartGame: () => void;
  onOpenShop: () => void;
  onBuyUpgrade: (type: keyof Upgrades) => void;
  onBuyLife: () => void;
  onCosmeticAction: (type: 'skin' | 'hat', id: string) => void;
  onTogglePause: () => void;
  onRetreat: () => void;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ 
  gameState, 
  onStartGame, 
  onOpenShop, 
  onBuyUpgrade,
  onBuyLife,
  onCosmeticAction,
  onTogglePause,
  onRetreat,
  onToggleMute
}) => {
  const { status, gold, upgrades, coinsCollected, totalCoins, level, lives, cosmetics, muted, secretUnlocked } = gameState;

  // --- MENU STATE ---
  if (status === 'menu') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto select-none">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2 drop-shadow-lg">
          ADVENTURE
        </h1>
        <h2 className="text-4xl font-bold text-slate-300 mb-12 tracking-widest">IN THE VOID</h2>
        
        <div className="flex gap-6 mb-12">
          <button 
            onClick={onStartGame}
            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xl rounded shadow-[0_4px_0_rgb(21,128,61)] active:shadow-[0_2px_0_rgb(21,128,61)] active:translate-y-1 transition-all"
          >
            PLAY
          </button>
          <button 
            onClick={onOpenShop}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xl rounded shadow-[0_4px_0_rgb(180,83,9)] active:shadow-[0_2px_0_rgb(180,83,9)] active:translate-y-1 transition-all"
          >
            SHOP
          </button>
        </div>

        <div className="text-yellow-400 font-bold text-2xl flex items-center gap-2 bg-slate-800 px-6 py-2 rounded-full border border-slate-700">
          <span>Gold:</span>
          <span>{gold}</span>
          <div className="w-4 h-4 rounded-full bg-yellow-400 animate-pulse" />
        </div>
      </div>
    );
  }

  // --- SHOP STATE ---
  if (status === 'shop') {
    return (
      <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center pointer-events-auto overflow-y-auto">
        <div className="flex flex-col items-center max-w-4xl w-full py-8">
            <h2 className="text-4xl font-bold text-amber-400 mb-4">THE VOID SHOP</h2>
            
            <div className="text-yellow-400 font-bold text-2xl mb-8 flex items-center gap-2 sticky top-0 bg-slate-900/95 py-2 px-4 rounded-full border border-yellow-600 z-10">
            Current Gold: {gold}
            </div>

            {/* UPGRADES */}
            <h3 className="text-2xl font-bold text-white mb-4 w-full px-8 border-b border-slate-700 pb-2">Upgrades</h3>
            <div className="grid grid-cols-2 gap-4 w-full px-8 mb-8">
                <ShopItem 
                    title="Extra Life" 
                    desc="+1 Life (Consumable)" 
                    price={PRICES.EXTRA_LIFE} 
                    owned={false}
                    canAfford={gold >= PRICES.EXTRA_LIFE}
                    onBuy={onBuyLife}
                />
                <ShopItem 
                    title="Sharpened Sword" 
                    desc="Deals 2 Damage per hit" 
                    price={PRICES.SHARP_SWORD} 
                    owned={upgrades.sharpSword}
                    canAfford={gold >= PRICES.SHARP_SWORD}
                    onBuy={() => onBuyUpgrade('sharpSword')}
                />
                <ShopItem 
                    title="Triple Jump" 
                    desc="Jump 3 times in mid-air" 
                    price={PRICES.TRIPLE_JUMP} 
                    owned={upgrades.tripleJump}
                    canAfford={gold >= PRICES.TRIPLE_JUMP}
                    onBuy={() => onBuyUpgrade('tripleJump')}
                />
                <ShopItem 
                    title="Down Strike" 
                    desc="Hold DOWN + ATTACK in air to Pogo" 
                    price={PRICES.DOWN_STRIKE} 
                    owned={upgrades.downStrike}
                    canAfford={gold >= PRICES.DOWN_STRIKE}
                    onBuy={() => onBuyUpgrade('downStrike')}
                />
            </div>

            {/* COSMETICS */}
            <h3 className="text-2xl font-bold text-white mb-4 w-full px-8 border-b border-slate-700 pb-2">Cosmetics (5g each)</h3>
            
            <div className="w-full px-8 mb-8">
                <h4 className="text-slate-400 font-bold mb-2">Skins</h4>
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <CosmeticItem title="Default Green" type="skin" id="default" price={0} cosmetics={cosmetics} gold={gold} onAction={onCosmeticAction} />
                    <CosmeticItem title="Midnight Blue" type="skin" id="midnight" price={5} cosmetics={cosmetics} gold={gold} onAction={onCosmeticAction} />
                    <CosmeticItem title="Crimson Red" type="skin" id="crimson" price={5} cosmetics={cosmetics} gold={gold} onAction={onCosmeticAction} />
                    <CosmeticItem title="Golden Boy" type="skin" id="golden" price={5} cosmetics={cosmetics} gold={gold} onAction={onCosmeticAction} />
                </div>
                
                {secretUnlocked && (
                  <>
                    <h4 className="text-amber-400 font-black mb-2 animate-pulse">SECRET UNLOCKED</h4>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <CosmeticItem 
                          title="The Legend" 
                          type="skin" 
                          id="legend" 
                          price={PRICES.LEGEND_SKIN} 
                          cosmetics={cosmetics} 
                          gold={gold} 
                          onAction={onCosmeticAction} 
                        />
                    </div>
                  </>
                )}

                <h4 className="text-slate-400 font-bold mb-2">Hats</h4>
                <div className="grid grid-cols-4 gap-4">
                    <CosmeticItem title="No Hat" type="hat" id="none" price={0} cosmetics={cosmetics} gold={gold} onAction={onCosmeticAction} />
                    <CosmeticItem title="Top Hat" type="hat" id="tophat" price={5} cosmetics={cosmetics} gold={gold} onAction={onCosmeticAction} />
                    <CosmeticItem title="Crown" type="hat" id="crown" price={5} cosmetics={cosmetics} gold={gold} onAction={onCosmeticAction} />
                    <CosmeticItem title="Halo" type="hat" id="halo" price={5} cosmetics={cosmetics} gold={gold} onAction={onCosmeticAction} />
                </div>
            </div>

            <button 
            onClick={() => onRetreat()} 
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded mb-8"
            >
            BACK TO MENU
            </button>
        </div>
      </div>
    );
  }

  // --- PLAYING / PAUSED / GAMEOVER / SECRET_BOSS HUD ---
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-600 shadow-xl backdrop-blur-sm flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-sky-400">
            {status === 'secret_boss' ? 'SECRET BOSS' : `Level ${level}`}
          </h1>
          <div className="flex items-center gap-4">
             {/* Lives */}
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold text-lg">Lives:</span>
              <div className="flex gap-1">
                {[...Array(Math.max(0, lives))].map((_, i) => (
                  <span key={i} className="text-red-500 text-xl">♥</span>
                ))}
              </div>
            </div>
            {/* Gold */}
            <div className="flex items-center gap-1 text-yellow-400 font-bold border-l border-slate-600 pl-4">
               <span>${gold}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
            {/* Pause Button */}
            {(status === 'playing' || status === 'secret_boss') && (
                <button 
                    onClick={onTogglePause}
                    className="bg-slate-800/80 p-3 rounded-lg border border-slate-600 hover:bg-slate-700 active:translate-y-1 transition-all pointer-events-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                    </svg>
                </button>
            )}

            {status !== 'secret_boss' && (
                <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-600 shadow-xl backdrop-blur-sm flex flex-col items-end">
                    <div className="text-xl font-bold flex items-center gap-2">
                        <span className="text-amber-400">Coins:</span>
                        <span className={coinsCollected === totalCoins ? "text-green-400" : "text-white"}>
                        {coinsCollected} / {totalCoins}
                        </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        {coinsCollected === totalCoins ? "DOOR UNLOCKED!" : "Collect all to unlock door"}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Pause Menu Overlay */}
      {status === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto z-50">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 shadow-2xl text-center w-80 animate-in fade-in zoom-in duration-200">
            <h2 className="text-3xl font-bold text-white mb-8 tracking-wider">PAUSED</h2>
            <div className="flex flex-col gap-4">
                <button 
                    onClick={onTogglePause}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-lg"
                >
                    RESUME
                </button>
                <button 
                    onClick={onRetreat}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-lg"
                >
                    RETREAT
                </button>
                 <button 
                    onClick={onToggleMute}
                    className={`w-full py-3 text-white font-bold rounded text-lg border-2 ${muted ? 'bg-slate-600 border-slate-500' : 'bg-slate-700 border-slate-500 hover:bg-slate-600'}`}
                >
                    {muted ? 'SOUND: OFF' : 'SOUND: ON'}
                </button>
            </div>
            <p className="mt-6 text-xs text-slate-400">Retreating saves your Gold.</p>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {status === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto z-50">
          <div className="bg-slate-800 p-8 rounded-2xl border-2 border-red-500 shadow-2xl text-center max-w-md animate-in fade-in zoom-in duration-300">
            <h2 className="text-5xl font-black text-red-500 mb-4 tracking-wider">GAME OVER</h2>
            <div className="text-xl mb-4 text-slate-300">
              You ran out of lives.
            </div>
            <div className="text-lg text-slate-400 mb-2">
              Reached Level: <span className="text-white font-bold">{level}</span>
            </div>
            <div className="text-lg text-yellow-400 font-bold">
              Gold Collected: {gold}
            </div>
            <div className="mt-8 text-sm text-slate-500 animate-pulse">
              Returning to Shop...
            </div>
          </div>
        </div>
      )}

      {/* Controls Hint */}
      {status === 'playing' && level === 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-800/60 px-6 py-3 rounded-full text-sm text-slate-300 whitespace-nowrap">
          <span className="font-bold text-white">Arrows</span> Move • 
          <span className="font-bold text-white ml-2">Space</span> Jump • 
          <span className="font-bold text-white ml-2">Z</span> Attack •
          <span className="font-bold text-white ml-2">ESC</span> Pause
          {upgrades.downStrike && (
             <span className="text-yellow-300 ml-2 border-l border-slate-500 pl-2">
               Air + Down + Z: Down Strike
             </span>
          )}
        </div>
      )}
    </div>
  );
};

// Subcomponent for Upgrade Item
const ShopItem: React.FC<{
    title: string; 
    desc: string; 
    price: number; 
    owned: boolean; 
    canAfford: boolean;
    onBuy: () => void;
}> = ({ title, desc, price, owned, canAfford, onBuy }) => (
    <div className={`p-4 rounded-lg border-2 flex flex-col gap-2 relative ${owned ? 'border-green-500 bg-green-900/20' : 'border-slate-600 bg-slate-800'}`}>
        <div className="flex justify-between items-start">
            <h3 className={`font-bold ${owned ? 'text-green-400' : 'text-white'}`}>{title}</h3>
            {owned && <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold">OWNED</span>}
        </div>
        <p className="text-xs text-slate-400 flex-grow">{desc}</p>
        {!owned ? (
            <button 
                onClick={onBuy}
                disabled={!canAfford}
                className={`w-full py-2 rounded font-bold mt-2 ${
                    canAfford 
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
                Buy ${price}
            </button>
        ) : (
            <div className="w-full py-2 text-center text-green-500 font-bold mt-2 text-sm">
                Active
            </div>
        )}
    </div>
);

// Subcomponent for Cosmetic Item
const CosmeticItem: React.FC<{
    title: string;
    type: 'skin' | 'hat';
    id: string;
    price: number;
    cosmetics: any;
    gold: number;
    onAction: (type: 'skin' | 'hat', id: string) => void;
}> = ({ title, type, id, price, cosmetics, gold, onAction }) => {
    const isOwned = type === 'skin' ? cosmetics.ownedSkins.includes(id) : cosmetics.ownedHats.includes(id);
    const isEquipped = type === 'skin' ? cosmetics.currentSkin === id : cosmetics.currentHat === id;
    const canAfford = gold >= price;

    return (
        <div className={`p-3 rounded-lg border-2 flex flex-col gap-2 ${isEquipped ? 'border-amber-400 bg-amber-900/20' : 'border-slate-700 bg-slate-800'}`}>
            <div className="font-bold text-sm text-center text-white">{title}</div>
            
            {isEquipped ? (
                <div className="w-full py-1 text-center bg-amber-500 text-black font-bold text-xs rounded">EQUIPPED</div>
            ) : isOwned ? (
                <button 
                    onClick={() => onAction(type, id)}
                    className="w-full py-1 text-center bg-slate-600 hover:bg-slate-500 text-white font-bold text-xs rounded"
                >
                    EQUIP
                </button>
            ) : (
                <button 
                    onClick={() => onAction(type, id)}
                    disabled={!canAfford}
                    className={`w-full py-1 text-center font-bold text-xs rounded ${
                        canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-slate-700 text-slate-500'
                    }`}
                >
                    Buy ${price}
                </button>
            )}
        </div>
    );
};