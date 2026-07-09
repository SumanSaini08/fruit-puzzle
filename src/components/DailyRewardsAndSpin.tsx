import { useState, useEffect } from 'react';
import { BoosterInventory } from '../types';

interface DailyRewardsAndSpinProps {
    inventory: BoosterInventory;
    onAddBoosters: (rewards: Partial<BoosterInventory>) => void;
    onClose: () => void;
    soundEnabled: boolean;
    playSynthSound: (type: 'swap' | 'match' | 'bomb' | 'bolt' | 'win') => void;
    onAddCoins?: (amount: number) => void;
    onAddGoldBars?: (amount: number) => void;
    onAddLives?: (amount: number) => void;
}

const WHEEL_PRIZES = [
    { label: "🍒 BOMB", icon: "🍒", key: "bomb" as keyof BoosterInventory },
    { label: "⚡ BOLT", icon: "⚡", key: "bolt" as keyof BoosterInventory },
    { label: "🍬 COLOR BOMB", icon: "🌈", key: "colorBomb" as keyof BoosterInventory },
    { label: "🍭 HAMMER", icon: "🍭", key: "hammer" as keyof BoosterInventory },
    { label: "🎁 LUCKY CANDY", icon: "🍀", key: "luckyCandy" as keyof BoosterInventory },
    { label: "🧤 SMART HAND", icon: "🧤", key: "hand" as keyof BoosterInventory },
    { label: "💥 STRIPED", icon: "🌟", key: "stripedWrapped" as keyof BoosterInventory },
    { label: "➕ EXTRA TIME", icon: "⏰", key: "extraMoves" as keyof BoosterInventory },
];

export default function DailyRewardsAndSpin({
    inventory,
    onAddBoosters,
    onClose,
    soundEnabled,
    playSynthSound,
    onAddCoins,
    onAddGoldBars,
    onAddLives
}: DailyRewardsAndSpinProps) {
    const [claimedDays, setClaimedDays] = useState<number[]>([]);
    const [currentDayClaimable, setCurrentDayClaimable] = useState<number>(1);
    const [spinDegrees, setSpinDegrees] = useState<number>(0);
    const [isSpinning, setIsSpinning] = useState<boolean>(false);
    const [wonPrize, setWonPrize] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'rewards' | 'wheel'>('wheel');

    // Load claim status
    useEffect(() => {
        const savedClaims = localStorage.getItem('fp_daily_claims_v1');
        if (savedClaims) {
            try {
                const parsed = JSON.parse(savedClaims);
                setClaimedDays(parsed.days || []);
                setCurrentDayClaimable(parsed.currentDay || 1);
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const saveClaims = (days: number[], current: number) => {
        setClaimedDays(days);
        setCurrentDayClaimable(current);
        localStorage.setItem('fp_daily_claims_v1', JSON.stringify({ days, currentDay: current }));
    };

    const handleClaimReward = (day: number) => {
        if (claimedDays.includes(day) || day !== currentDayClaimable) return;
        
        playSynthSound('win');
        // Specific booster rewards based on day
        const dayBoosters: { [key: number]: Partial<BoosterInventory> } = {
            1: { hammer: 1 },
            2: { bomb: 1 },
            3: { extraMoves: 1 },
            4: { luckyCandy: 1 },
            5: { bolt: 1 },
            6: { hand: 1 },
            7: { hammer: 2, colorBomb: 1 }
        };

        const rewards = dayBoosters[day] || { hammer: 1 };
        onAddBoosters(rewards);
        
        // Accumulate extra currencies based on Slide 10
        let extraText = "";
        if (day === 1 && onAddCoins) { onAddCoins(150); extraText += " + 150 🪙"; }
        if (day === 2 && onAddGoldBars) { onAddGoldBars(5); extraText += " + 5 🧈"; }
        if (day === 3 && onAddLives) { onAddLives(1); extraText += " + 1 ❤️"; }
        if (day === 4 && onAddGoldBars) { onAddGoldBars(10); extraText += " + 10 🧈"; }
        if (day === 5 && onAddCoins) { onAddCoins(250); extraText += " + 250 🪙"; }
        if (day === 6 && onAddGoldBars) { onAddGoldBars(15); extraText += " + 15 🧈"; }
        if (day === 7) {
            if (onAddCoins) onAddCoins(500);
            if (onAddGoldBars) onAddGoldBars(25);
            if (onAddLives) onAddLives(2);
            extraText += " + 500 🪙 + 25 🧈 + 2 ❤️";
        }
        
        const updatedDays = [...claimedDays, day];
        const nextDay = day === 7 ? 1 : day + 1;
        saveClaims(updatedDays, nextDay);

        const boosterText = Object.keys(rewards).map(k => `${rewards[k as keyof BoosterInventory]}x ${k}`).join(', ');
        alert(`Congratulations! You claimed your Day ${day} reward: ${boosterText}${extraText}! 🎁`);
    };

    const handleSpinWheel = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        setWonPrize(null);
        playSynthSound('bolt');

        // Spin multiple rotations + random stop angle
        const randomRotations = 5 + Math.floor(Math.random() * 5); // 5 to 9 rotations
        const segmentAngle = 360 / WHEEL_PRIZES.length;
        const targetIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
        
        // Calculate stop degrees (center of segment)
        // Adding subtraction to spin opposite or clockwise correctly
        const stopAngle = targetIndex * segmentAngle + (segmentAngle / 2);
        const totalDegrees = randomRotations * 360 + stopAngle;

        setSpinDegrees(totalDegrees);

        // Slow down trigger sound effects
        setTimeout(() => {
            const prize = WHEEL_PRIZES[targetIndex];
            
            // Random auxiliary reward for extra motivation and currency variety!
            let bonusText = "";
            const coinOrGold = Math.random() > 0.5;
            if (coinOrGold && onAddCoins) {
                const coinsAmt = 150;
                onAddCoins(coinsAmt);
                bonusText = ` & ${coinsAmt} Coins 🪙`;
            } else if (!coinOrGold && onAddGoldBars) {
                const goldAmt = 5;
                onAddGoldBars(goldAmt);
                bonusText = ` & ${goldAmt} Gold Bars 🧈`;
            } else if (onAddLives) {
                onAddLives(1);
                bonusText = ` & 1 Bonus Life ❤️`;
            }
            
            setWonPrize(`${prize.label}${bonusText}`);
            
            // Allocate prize
            onAddBoosters({ [prize.key]: 1 });
            playSynthSound('win');
            setIsSpinning(false);
        }, 3200);
    };

    return (
        <div id="daily-rewards-overlay" className="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 rounded-[2.5rem]">
            <div id="daily-rewards-container" className="bg-white dark:bg-zinc-900 w-full max-w-sm p-6 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col max-h-[85vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-black bg-gradient-to-r from-pink-500 to-amber-500 bg-clip-text text-transparent">
                        🍬 FREE BONUSES
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center text-sm font-black active:scale-90"
                    >
                        ✕
                    </button>
                </div>

                {/* Tab selector */}
                <div className="grid grid-cols-2 gap-2 mb-4 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-xl text-center">
                    <button
                        onClick={() => setActiveTab('wheel')}
                        className={`py-2 text-xs font-black rounded-lg transition-all ${activeTab === 'wheel' ? 'bg-pink-500 text-white shadow' : 'text-gray-500 dark:text-zinc-400 hover:text-pink-500'}`}
                    >
                        🎡 SPIN WHEEL
                    </button>
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={`py-2 text-xs font-black rounded-lg transition-all ${activeTab === 'rewards' ? 'bg-pink-500 text-white shadow' : 'text-gray-500 dark:text-zinc-400 hover:text-pink-500'}`}
                    >
                        📅 DAILY CLAIM
                    </button>
                </div>

                {/* Tab Content 1: Spin Wheel */}
                {activeTab === 'wheel' && (
                    <div id="tab-wheel" className="flex flex-col items-center py-2 flex-grow">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">
                            Spin the Lucky Wheel of Fruits!
                        </p>

                        {/* Animated Wheel Display container */}
                        <div className="relative w-52 h-52 mb-6">
                            {/* Wheel Pointer arrow */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-rose-500 rotate-45 z-30 shadow-md border-b-2 border-r-2 border-white rounded-tr-md"></div>
                            
                            {/* Inner Spin Canvas or Division box */}
                            <div 
                                style={{ 
                                    transform: `rotate(${-spinDegrees}deg)`,
                                    transition: isSpinning ? 'transform 3.2s cubic-bezier(0.1, 0.8, 0.15, 1)' : 'none'
                                }}
                                className="w-full h-full rounded-full border-4 border-amber-400 bg-gradient-to-br from-pink-400 to-purple-600 relative overflow-hidden shadow-lg"
                            >
                                {/* Core Segment boundaries */}
                                {WHEEL_PRIZES.map((p, idx) => {
                                    const rot = idx * 45;
                                    return (
                                        <div 
                                            key={idx}
                                            style={{ 
                                                transform: `rotate(${rot}deg)`,
                                                borderRight: '1px solid rgba(255,255,255,0.25)'
                                            }}
                                            className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left flex items-start justify-center pt-2 text-[10px]"
                                        >
                                            <div className="flex flex-col items-center rotate-4 translate-y-2 select-none">
                                                <span className="text-xl filter drop-shadow-sm">{p.icon}</span>
                                                <span className="font-extrabold text-[8px] text-white/95 leading-tight">{p.label.split(' ')[1] || p.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Glowing center peg */}
                                <div className="absolute inset-[38%] bg-amber-400 border-4 border-white rounded-full flex items-center justify-center shadow-lg z-20">
                                    <span className="text-base select-none">🍭</span>
                                </div>
                            </div>
                        </div>

                        {/* Won Badge splash */}
                        {wonPrize && (
                            <div className="mb-4 bg-amber-100 dark:bg-amber-950/50 px-5 py-2 rounded-2xl border border-amber-300 text-center animate-bounce">
                                <span className="text-xs font-black text-amber-800 dark:text-amber-300">🎉 WON PRIZE: {wonPrize}! 🍬</span>
                            </div>
                        )}

                        <button
                            disabled={isSpinning}
                            onClick={handleSpinWheel}
                            className={`w-full py-4 text-white font-black rounded-2xl shadow-lg transition-transform text-lg active:scale-95 ${
                                isSpinning 
                                    ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                                    : 'bg-gradient-to-r from-amber-500 via-pink-500 to-rose-500 hover:brightness-110'
                            }`}
                        >
                            {isSpinning ? "SPINNING CRUSH..." : "🎰 SPIN FOR FREE!"}
                        </button>
                    </div>
                )}

                {/* Tab Content 2: Daily Login Claims */}
                {activeTab === 'rewards' && (
                    <div id="tab-rewards" className="flex flex-col flex-grow py-1">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center mb-4">
                            Claim rewards consecutively to unlock mega prizes!
                        </p>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[1, 2, 3, 4, 5, 6].map((day) => {
                                const isClaimed = claimedDays.includes(day);
                                const isCurrent = day === currentDayClaimable;
                                
                                const dayRewards: { [key: number]: { icon: string; label: string } } = {
                                    1: { icon: "🍭", label: "Hammer" },
                                    2: { icon: "🍒", label: "Bomb" },
                                    3: { icon: "⏰", label: "+Time" },
                                    4: { icon: "🍀", label: "Lucky" },
                                    5: { icon: "⚡", label: "Bolt" },
                                    6: { icon: "🧤", label: "Smart" }
                                };

                                const info = dayRewards[day];

                                return (
                                    <button
                                        key={day}
                                        disabled={isClaimed || !isCurrent}
                                        onClick={() => handleClaimReward(day)}
                                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-between aspect-square transition-all ${
                                            isClaimed 
                                                ? 'bg-zinc-100 dark:bg-zinc-800/40 text-gray-400 border-zinc-200 dark:border-zinc-800 line-through opacity-60' 
                                                : isCurrent 
                                                ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white border-transparent shadow animate-pulse scale-102 hover:brightness-110' 
                                                : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 opacity-80'
                                        }`}
                                    >
                                        <span className="text-[8px] font-black uppercase">Day {day}</span>
                                        <span className="text-xl">{isClaimed ? "✔️" : info.icon}</span>
                                        <span className="text-[8px] font-extrabold truncate w-full text-center">{info.label}</span>
                                    </button>
                                );
                            })}

                            {/* Special Big Day 7 Mega Reward Box */}
                            <button
                                disabled={claimedDays.includes(7) || currentDayClaimable !== 7}
                                onClick={() => handleClaimReward(7)}
                                className={`col-span-3 p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                                    claimedDays.includes(7)
                                        ? 'bg-zinc-100 dark:bg-zinc-800/40 text-gray-400 border-zinc-200 dark:border-zinc-800 line-through opacity-60'
                                        : currentDayClaimable === 7
                                        ? 'bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 text-white border-transparent shadow-lg text-lg animate-bounce'
                                        : 'bg-purple-50 dark:bg-zinc-850 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-zinc-700'
                                }`}
                            >
                                <div className="text-left">
                                    <span className="text-[9px] font-black uppercase tracking-wider block">🎁 DAY 7 MEGA CHEST</span>
                                    <span className="text-[10px] font-bold opacity-85">Lollipop Hammer x2 + Color Candy!</span>
                                </div>
                                <span className="text-3xl leading-none">👑</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Info and current inventory status bar */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                        Current Booster Inventory:
                    </span>
                    <div className="flex justify-around text-xs font-extrabold text-zinc-600 dark:text-zinc-300">
                        <span>🍒 {inventory.bomb}</span>
                        <span>⚡ {inventory.bolt}</span>
                        <span>🌈 {inventory.colorBomb}</span>
                        <span>🍭 {inventory.hammer}</span>
                        <span>🧤 {inventory.hand}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
