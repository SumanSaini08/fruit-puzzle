import { useState, useEffect } from 'react';
import { LeaderboardEntry, TournamentPlayer, BoosterInventory } from '../types';
import { SIMULATED_LEADERBOARD, SIMULATED_TOURNAMENT } from '../utils';

interface LeaderboardAndTournamentProps {
    playerName: string;
    bestScore: number;
    unlockedLevel: number;
    winStreak: number;
    piggyBankCount: number;
    onResetPiggyBank: () => void;
    onAddBoosters: (rewards: Partial<BoosterInventory>) => void;
    onClose: () => void;
    playSynthSound: (type: 'swap' | 'match' | 'bomb' | 'bolt' | 'win') => void;
    onAddCoins?: (amount: number) => void;
    onAddGoldBars?: (amount: number) => void;
    onAddLives?: (amount: number) => void;
}

export default function LeaderboardAndTournament({
    playerName,
    bestScore,
    unlockedLevel,
    winStreak,
    piggyBankCount,
    onResetPiggyBank,
    onAddBoosters,
    onClose,
    playSynthSound,
    onAddCoins,
    onAddGoldBars,
    onAddLives
}: LeaderboardAndTournamentProps) {
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'tournament' | 'piggy' | 'events'>('leaderboard');
    const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntry[]>([]);
    const [tournamentList, setTournamentList] = useState<TournamentPlayer[]>([]);
    const [hasClaimedTournament, setHasClaimedTournament] = useState<boolean>(false);
    const [claimedEvents, setClaimedEvents] = useState<string[]>([]);

    // Load event claims on mount
    useEffect(() => {
        const saved = localStorage.getItem('fp_event_claims_v1');
        if (saved) {
            try {
                setClaimedEvents(JSON.parse(saved));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const saveEventClaim = (eventId: string) => {
        const next = [...claimedEvents, eventId];
        setClaimedEvents(next);
        localStorage.setItem('fp_event_claims_v1', JSON.stringify(next));
    };

    const claimEventReward = (eventId: string) => {
        if (claimedEvents.includes(eventId)) return;

        playSynthSound('win');
        saveEventClaim(eventId);

        if (eventId === 'level_3') {
            if (onAddCoins) onAddCoins(200);
            if (onAddGoldBars) onAddGoldBars(5);
            alert("Congrats! You claimed the Level 3 Milestone Reward: 200 Coins 🪙 & 5 Gold Bars 🧈! 🎉");
        } else if (eventId === 'streak_2') {
            if (onAddCoins) onAddCoins(300);
            onAddBoosters({ hammer: 1 });
            alert("Congrats! You claimed the Streak Challenge Reward: 300 Coins 🪙 & 1x Lollipop Hammer 🍭! 🎉");
        } else if (eventId === 'score_master') {
            if (onAddCoins) onAddCoins(500);
            if (onAddGoldBars) onAddGoldBars(15);
            if (onAddLives) onAddLives(1);
            alert("Congrats! You claimed the Score Master Challenge Reward: 505 Coins 🪙, 15 Gold Bars 🧈 & 1 Extra Life ❤️! 🎉");
        }
    };

    // Sync user metrics with default lists
    useEffect(() => {
        // Map user to standard arrays
        const usersLeaderboard = SIMULATED_LEADERBOARD.map(entry => {
            if (entry.isUser) {
                return {
                    ...entry,
                    name: playerName + " (You)",
                    level: unlockedLevel,
                    score: Math.max(bestScore, unlockedLevel * 450)
                };
            }
            return entry;
        }).sort((a, b) => b.score - a.score);

        // Re-calculate ranks
        const rankedLeaderboard = usersLeaderboard.map((item, index) => ({
            ...item,
            rank: index + 1
        }));

        setLeaderboardList(rankedLeaderboard);

        // Tournament mapping
        const userTourney = SIMULATED_TOURNAMENT.map(p => {
            if (p.isUser) {
                return {
                    ...p,
                    name: playerName + " (You)",
                    score: bestScore + (unlockedLevel * 180)
                };
            }
            return p;
        }).sort((a, b) => b.score - a.score);

        const rankedTourney = userTourney.map((item, idx) => ({
            ...item,
            rank: idx + 1
        }));

        setTournamentList(rankedTourney);
    }, [playerName, bestScore, unlockedLevel]);

    const handleClaimCup = () => {
        if (hasClaimedTournament) return;
        playSynthSound('win');
        onAddBoosters({ bomb: 1, bolt: 1, hammer: 1 });
        setHasClaimedTournament(true);
        alert("Awesome! You claimed the tournament Bronze Medal: 1x Bomb, 1x Bolt, and 1x Lollipop Hammer! 🏆");
    };

    const handleSmashPiggy = () => {
        if (piggyBankCount < 50) {
            alert("Your Piggy Bank requires at least 50 Gold Bars to break! Keep clear levels to earn more.");
            return;
        }
        playSynthSound('bomb');
        onAddBoosters({ hammer: 1, colorBomb: 2, stripedWrapped: 1 });
        onResetPiggyBank();
        alert("KAAA-BOOOM! 🐖💰 You smashed the Piggy Bank and collected: 1x Lollipop Hammer, 2x Color Candy, and 1x Striped Candy!");
    };

    return (
        <div id="competitive-modal-overlay" className="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 rounded-[2.5rem]">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-5 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col max-h-[85vh] overflow-y-auto">
                
                {/* Close Button & Header */}
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-black bg-gradient-to-r from-purple-500 to-rose-500 bg-clip-text text-transparent uppercase tracking-wider">
                        🏆 SWEET CHALLENGES
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center text-sm font-black active:scale-90"
                    >
                        ✕
                    </button>
                </div>

                {/* Tab selections */}
                <div className="grid grid-cols-4 gap-1 mb-4 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl text-center text-[9px] font-black tracking-tight">
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`py-1.5 rounded-lg transition-all ${activeTab === 'leaderboard' ? 'bg-purple-600 text-white shadow' : 'text-gray-550 hover:text-purple-600 dark:text-zinc-300'}`}
                    >
                        🏆 RANK
                    </button>
                    <button
                        onClick={() => setActiveTab('tournament')}
                        className={`py-1.5 rounded-lg transition-all ${activeTab === 'tournament' ? 'bg-purple-600 text-white shadow' : 'text-gray-550 hover:text-purple-600 dark:text-zinc-300'}`}
                    >
                        🏁 TOURNY
                    </button>
                    <button
                        onClick={() => setActiveTab('piggy')}
                        className={`py-1.5 rounded-lg transition-all ${activeTab === 'piggy' ? 'bg-purple-600 text-white shadow' : 'text-gray-550 hover:text-purple-600 dark:text-zinc-300'}`}
                    >
                        🐖 PIGGY
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`py-1.5 rounded-lg transition-all ${activeTab === 'events' ? 'bg-purple-600 text-white shadow' : 'text-gray-550 hover:text-purple-600 dark:text-zinc-300'}`}
                    >
                        🎁 EVENT
                    </button>
                </div>

                {/* Tab Content 1: Global Rank Leaderboard */}
                {activeTab === 'leaderboard' && (
                    <div className="flex flex-col flex-grow">
                        {/* Win Streak banner */}
                        <div className="bg-rose-50 dark:bg-zinc-800/40 border border-rose-100 dark:border-zinc-800 p-2.5 rounded-2xl mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl animate-bounce">🔥</span>
                                <div>
                                    <span className="text-xs font-black text-rose-600 dark:text-rose-450 uppercase block">WIN STREAK BENEFIT</span>
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Streak: {winStreak} Level consecutive wins!</span>
                                </div>
                            </div>
                            {winStreak >= 2 ? (
                                <span className="bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase">1X BOOSTER ONSTART</span>
                            ) : (
                                <span className="text-[9px] text-gray-400">Wins to unlock</span>
                            )}
                        </div>

                        <div className="space-y-1.5 overflow-y-auto max-h-[44vh] pr-1">
                            {leaderboardList.map((entry) => (
                                <div 
                                    key={entry.rank}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                        entry.isUser 
                                            ? 'bg-purple-500 text-white border-transparent shadow shadow-purple-200' 
                                            : 'bg-white dark:bg-zinc-850 text-gray-800 dark:text-zinc-200 border-zinc-100 dark:border-zinc-800/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                                            entry.rank === 1 ? 'bg-yellow-400 text-black' : entry.rank === 2 ? 'bg-zinc-300 text-black' : 'bg-transparent text-gray-500 dark:text-zinc-400'
                                        }`}>
                                            {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                                        </span>
                                        <span className="text-base leading-none">{entry.avatar}</span>
                                        <span className="text-xs font-black truncate max-w-[130px]">{entry.name}</span>
                                    </div>
                                    <div className="text-right text-[10px] font-bold">
                                        <span className="block opacity-90">{entry.score} pts</span>
                                        <span className="text-[8px] opacity-75">LVL {entry.level}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab Content 2: Simulated Weekend Cup Tournament */}
                {activeTab === 'tournament' && (
                    <div className="flex flex-col flex-grow">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 rounded-2xl mb-3 text-center shadow-md">
                            <span className="text-2xl block">🍩</span>
                            <span className="text-xs font-black uppercase tracking-wider block mt-1">Gummy Bear Champion Cup</span>
                            <span className="text-[9px] opacity-90 block">Time Left: 2d 14h | Daily Standings</span>
                        </div>

                        <div className="space-y-1.5 mb-3 overflow-y-auto max-h-[30vh]">
                            {tournamentList.map((player) => (
                                <div 
                                    key={player.rank}
                                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold leading-none ${
                                        player.isUser 
                                            ? 'bg-amber-100 dark:bg-amber-950/60 border border-amber-300 text-amber-900 dark:text-amber-200' 
                                            : 'bg-zinc-50 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold w-4 text-center">{player.rank}</span>
                                        <span>{player.avatar}</span>
                                        <span className="truncate max-w-[150px]">{player.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black">{player.score}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            disabled={hasClaimedTournament}
                            onClick={handleClaimCup}
                            className={`w-full py-3 font-black text-xs rounded-xl shadow uppercase tracking-wider transition-all ${
                                hasClaimedTournament
                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed opacity-60'
                                    : 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:brightness-110 active:scale-95'
                            }`}
                        >
                            {hasClaimedTournament ? "🏅 CUP REWARD CLAIMED" : "🎁 CLAIM TOURNAMENT MEDAL!"}
                        </button>
                    </div>
                )}

                {/* Tab Content 3: Smart Piggy Bank */}
                {activeTab === 'piggy' && (
                    <div className="flex flex-col items-center py-4 text-center">
                        <span className="text-5xl filter drop-shadow animate-bounce">🐖</span>
                        <h4 className="text-lg font-black mt-3 text-pink-600 dark:text-pink-400">
                            SWEET PIGGY BANK
                        </h4>
                        
                        <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-[280px] mt-2 leading-relaxed">
                            Collect golden bars from clearing levels! When you reach 50 gold bars, you can smash the piggy bank to unlock extra boosters completely free!
                        </p>

                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-100 dark:bg-zinc-950 px-4 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 my-4">
                            <div className="flex justify-between text-xs font-extrabold text-zinc-650 dark:text-zinc-350 mb-1.5">
                                <span>Gold Bars: 🪙 {piggyBankCount}</span>
                                <span>Target: 50 / 100</span>
                            </div>
                            <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    style={{ width: `${Math.min(100, (piggyBankCount / 100) * 100)}%` }}
                                    className="h-full bg-gradient-to-r from-pink-500 to-amber-500 rounded-full transition-all duration-500"
                                ></div>
                            </div>
                        </div>

                        <button
                            disabled={piggyBankCount < 50}
                            onClick={handleSmashPiggy}
                            className={`w-full py-4 text-white font-black text-sm rounded-xl shadow-lg transition-all ${
                                piggyBankCount < 50
                                    ? 'bg-gray-250 dark:bg-zinc-805 text-gray-400 dark:text-zinc-650 cursor-not-allowed opacity-45'
                                    : 'bg-gradient-to-r from-red-500 to-rose-600 animate-pulse hover:scale-103'
                            }`}
                        >
                            🛠️ SMASH PIGGY BANK (🪙{piggyBankCount})
                        </button>
                    </div>
                )}

                {/* Tab Content 4: Event Rewards */}
                {activeTab === 'events' && (
                    <div className="flex flex-col flex-grow text-left">
                        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white p-3 rounded-2xl mb-3 text-center shadow-md">
                            <span className="text-2xl block animate-bounce">🎁</span>
                            <span className="text-xs font-black uppercase tracking-wider block mt-1">Daily Event & Milestones</span>
                            <span className="text-[9px] opacity-90 block">Play daily to hit milestones & claim rewards!</span>
                        </div>

                        <div className="space-y-3 mb-1 overflow-y-auto max-h-[35vh]">
                            {/* EVENT 1: Level 3 Milestone */}
                            <div className="bg-white/80 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white uppercase">🌟 Level 3 Challenger</span>
                                    <span className="text-[10px] font-bold text-gray-500">
                                        {unlockedLevel >= 3 ? "COMPLETED!" : `${unlockedLevel} / 3`}
                                    </span>
                                </div>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                                    <div 
                                        style={{ width: `${Math.min(100, (unlockedLevel / 3) * 100)}%` }}
                                        className="h-full bg-pink-500 rounded-full"
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] mt-1">
                                    <span className="text-zinc-500 font-bold">Reward: 🪙 200 + 🧈 5</span>
                                    {claimedEvents.includes('level_3') ? (
                                        <span className="text-gray-400 font-extrabold">CLAIMED ✅</span>
                                    ) : (
                                        <button
                                            disabled={unlockedLevel < 3}
                                            onClick={() => claimEventReward('level_3')}
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide text-white transition-all ${
                                                unlockedLevel >= 3 
                                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 active:scale-95 shadow-sm' 
                                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                                            }`}
                                        >
                                            CLAIM
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* EVENT 2: Streak Challenge */}
                            <div className="bg-white/80 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white uppercase">🔥 Streak Master</span>
                                    <span className="text-[10px] font-bold text-gray-505">
                                        {winStreak >= 2 ? "COMPLETED!" : `${winStreak} / 2`}
                                    </span>
                                </div>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                                    <div 
                                        style={{ width: `${Math.min(100, (winStreak / 2) * 100)}%` }}
                                        className="h-full bg-amber-500 rounded-full"
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] mt-1">
                                    <span className="text-zinc-505 font-bold">Reward: 🪙 300 + 🍭 Hammer</span>
                                    {claimedEvents.includes('streak_2') ? (
                                        <span className="text-gray-400 font-extrabold">CLAIMED ✅</span>
                                    ) : (
                                        <button
                                            disabled={winStreak < 2}
                                            onClick={() => claimEventReward('streak_2')}
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide text-white transition-all ${
                                                winStreak >= 2 
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 active:scale-95 shadow-sm' 
                                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                                            }`}
                                        >
                                            CLAIM
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* EVENT 3: Score Master Challenge */}
                            <div className="bg-white/80 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white uppercase">🍒 Score Master (3k pts)</span>
                                    <span className="text-[10px] font-bold text-gray-505">
                                        {bestScore >= 3000 ? "COMPLETED!" : `${bestScore} / 3000`}
                                    </span>
                                </div>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                                    <div 
                                        style={{ width: `${Math.min(100, (bestScore / 3000) * 100)}%` }}
                                        className="h-full bg-emerald-500 rounded-full"
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] mt-1">
                                    <span className="text-zinc-505 font-bold">Reward: 🪙 500 + 🧈 15 + ❤️ 1</span>
                                    {claimedEvents.includes('score_master') ? (
                                        <span className="text-gray-400 font-extrabold">CLAIMED ✅</span>
                                    ) : (
                                        <button
                                            disabled={bestScore < 3000}
                                            onClick={() => claimEventReward('score_master')}
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide text-white transition-all ${
                                                bestScore >= 3000 
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 active:scale-95 shadow-sm' 
                                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                                            }`}
                                        >
                                            CLAIM
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
