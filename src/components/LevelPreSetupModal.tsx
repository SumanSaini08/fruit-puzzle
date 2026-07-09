import { useState } from 'react';
import { LevelConfig, BoosterInventory } from '../types';

interface LevelPreSetupModalProps {
    levelConfig: LevelConfig;
    inventory: BoosterInventory;
    onClose: () => void;
    onStartGame: (selectedBoosters: {
        colorBomb: boolean;
        stripedWrapped: boolean;
        extraMoves: boolean;
        luckyCandy: boolean;
    }) => void;
}

export default function LevelPreSetupModal({
    levelConfig,
    inventory,
    onClose,
    onStartGame
}: LevelPreSetupModalProps) {
    const [colorBomb, setColorBomb] = useState(false);
    const [stripedWrapped, setStripedWrapped] = useState(false);
    const [extraMoves, setExtraMoves] = useState(false);
    const [luckyCandy, setLuckyCandy] = useState(false);

    const toggleBooster = (type: 'colorBomb' | 'stripedWrapped' | 'extraMoves' | 'luckyCandy') => {
        if (type === 'colorBomb') {
            if (!colorBomb && inventory.colorBomb <= 0) {
                alert("You don't have a Color Bomb booster! Win some on the Spin Wheel.");
                return;
            }
            setColorBomb(!colorBomb);
        } else if (type === 'stripedWrapped') {
            if (!stripedWrapped && inventory.stripedWrapped <= 0) {
                alert("You don't have a Striped Capsule booster! Claim one from Daily Rewards.");
                return;
            }
            setStripedWrapped(!stripedWrapped);
        } else if (type === 'extraMoves') {
            if (!extraMoves && inventory.extraMoves <= 0) {
                alert("You don't have an Extra Time booster! Settle one on claims.");
                return;
            }
            setExtraMoves(!extraMoves);
        } else if (type === 'luckyCandy') {
            if (!luckyCandy && inventory.luckyCandy <= 0) {
                alert("You don't have a Lucky Candy booster!");
                return;
            }
            setLuckyCandy(!luckyCandy);
        }
    };

    const handlePlayClick = () => {
        onStartGame({
            colorBomb,
            stripedWrapped,
            extraMoves,
            luckyCandy
        });
    };

    return (
        <div id="level-pre-setup-overlay" className="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 rounded-[2.5rem]">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-6 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
                
                {/* Close handle */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-zinc-805 px-2 py-1 rounded">
                        PRE-LEVEL SETUP
                    </span>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-850 text-gray-500 dark:text-zinc-400 flex items-center justify-center text-sm font-black active:scale-90"
                    >
                        ✕
                    </button>
                </div>

                {/* Level info */}
                <div className="text-center mb-4">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                        LEVEL {levelConfig.levelNum}
                    </h3>
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-wider mt-1">
                        MODE: {levelConfig.mode}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-400 mt-2 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-150/40 dark:border-zinc-850">
                        {levelConfig.description}
                    </p>
                </div>

                {/* Level Goal displayers */}
                <div className="bg-purple-50/50 dark:bg-zinc-850/50 p-3 rounded-2xl border border-purple-100/50 dark:border-zinc-800 mb-4">
                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block mb-1">
                        Targets to complete:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-black text-zinc-700 dark:text-zinc-300">
                        <div className="p-1 px-2.5 bg-white dark:bg-zinc-900 rounded-lg flex items-center gap-1.5 justify-start">
                            <span>🎯</span>
                            <span>Score {levelConfig.targetScore}</span>
                        </div>
                        <div className="p-1 px-2.5 bg-white dark:bg-zinc-900 rounded-lg flex items-center gap-1.5 justify-start">
                            <span>⏰</span>
                            <span>Time {levelConfig.timeLimit}s</span>
                        </div>
                        
                        {/* Jelly Level goals */}
                        {(levelConfig.mode === 'jelly' || levelConfig.mode === 'mixed') && (
                            <div className="col-span-2 p-1.5 px-2.5 bg-pink-100/70 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300 rounded-lg flex items-center gap-1.5">
                                <span>🧊 jellies:</span>
                                <span>{levelConfig.jellyCount} frosted blocks to shatter!</span>
                            </div>
                        )}

                        {/* Ingredient drop goals */}
                        {(levelConfig.mode === 'ingredient' || levelConfig.mode === 'mixed') && (
                            <div className="col-span-2 p-1.5 px-2.5 bg-amber-100/70 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 rounded-lg flex items-center gap-1.5">
                                <span>🐉 dragon drops:</span>
                                <span>Deliver {levelConfig.ingredientsToDrop} Gummi Dragons to the bottom row!</span>
                            </div>
                        )}

                        {/* Candy orders */}
                        {(levelConfig.mode === 'order' || levelConfig.mode === 'mixed') && levelConfig.candyOrders && (
                            <div className="col-span-2 p-1.5 px-2.5 bg-emerald-100/70 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 rounded-lg flex flex-col gap-1 items-start">
                                <span className="text-[10px] uppercase font-bold text-emerald-600">Candy Shop Orders:</span>
                                <div className="flex gap-2 text-[10px]">
                                    {levelConfig.candyOrders.map((ord, idx) => (
                                        <span key={idx} className="bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-emerald-300">
                                            {ord.fruitIndex === 0 ? '🍎' : ord.fruitIndex === 1 ? '🍊' : ord.fruitIndex === 2 ? '🍇' : ord.fruitIndex === 3 ? '🍌' : ord.fruitIndex === 4 ? '🫐' : '🥝'} match {ord.target}x
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rapids count */}
                        {levelConfig.mode === 'rainbow-rapids' && (
                            <div className="col-span-2 p-1.5 px-2.5 bg-teal-100/70 dark:bg-teal-950/20 text-teal-700 dark:text-teal-350 rounded-lg flex items-center gap-1.5">
                                <span>🧱 land blockers:</span>
                                <span>Clear {levelConfig.rapidsCount} blocks along the rapids!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pre-Level Booster Selector */}
                <div className="mb-5">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        CHOOSE STARTING BOOSTERS:
                    </span>
                    <div className="space-y-1.5">
                        {/* 1. Color Bomb */}
                        <button
                            onClick={() => toggleBooster('colorBomb')}
                            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-black transition-all ${
                                colorBomb 
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow' 
                                    : 'bg-white dark:bg-zinc-850 text-gray-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🌈</span>
                                <div className="text-left">
                                    <span className="block leading-none">Color Candy Booster</span>
                                    <span className={`text-[9px] font-medium ${colorBomb ? 'text-pink-100' : 'text-gray-400'}`}>Get a Rainbow fruit to clear colors!</span>
                                </div>
                            </div>
                            <span className="bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-400 px-2 py-0.5 rounded text-[10px]">{inventory.colorBomb} left</span>
                        </button>

                        {/* 2. Striped Wrapped */}
                        <button
                            onClick={() => toggleBooster('stripedWrapped')}
                            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-black transition-all ${
                                stripedWrapped 
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow' 
                                    : 'bg-white dark:bg-zinc-850 text-gray-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🌟</span>
                                <div className="text-left">
                                    <span className="block leading-none">Striped + Wrapped</span>
                                    <span className={`text-[9px] font-medium ${stripedWrapped ? 'text-pink-100' : 'text-gray-400'}`}>Start with striped Row/Col clearness!</span>
                                </div>
                            </div>
                            <span className="bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-400 px-2 py-0.5 rounded text-[10px]">{inventory.stripedWrapped} left</span>
                        </button>

                        {/* 3. Extra Time */}
                        <button
                            onClick={() => toggleBooster('extraMoves')}
                            className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-black transition-all ${
                                extraMoves 
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow' 
                                    : 'bg-white dark:bg-zinc-850 text-gray-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">⏰</span>
                                <div className="text-left">
                                    <span className="block leading-none">Extra Time Bonus (+30s)</span>
                                    <span className={`text-[9px] font-medium ${extraMoves ? 'text-pink-100' : 'text-gray-400'}`}>Gain emergency extra 30s to the clock!</span>
                                </div>
                            </div>
                            <span className="bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-400 px-2 py-0.5 rounded text-[10px]">{inventory.extraMoves} left</span>
                        </button>
                    </div>
                </div>

                {/* Confirm Play button */}
                <button
                    onClick={handlePlayClick}
                    className="w-full py-4.5 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white font-black text-xl rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all text-center"
                >
                    🍭 CRUSH LEVEL {levelConfig.levelNum}!
                </button>

            </div>
        </div>
    );
}
