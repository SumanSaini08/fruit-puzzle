import { useState, useEffect, useRef } from 'react';
import { LevelConfig, BoosterInventory } from './types';
import { getLevelConfig } from './utils';
import DailyRewardsAndSpin from './components/DailyRewardsAndSpin';
import LeaderboardAndTournament from './components/LeaderboardAndTournament';
import SupportChat from './components/SupportChat';
import LevelPreSetupModal from './components/LevelPreSetupModal';


const i18n = {
    en: {
        login_title: "Welcome! Enter your name to start.",
        enter_name: "Player Name",
        start_game: "START GAME",
        best_score: "Best Score",
        level_reached: "Level",
        play: "PLAY",
        settings: "Settings",
        tutorial: "How to Play",
        exit: "Exit",
        select_level: "Select Level",
        score: "Score",
        time: "Time",
        target: "Target",
        paused: "GAME PAUSED",
        resume: "RESUME",
        restart: "RESTART",
        home: "HOME",
        final_score: "Final Score",
        next_level: "NEXT LEVEL",
        dark_mode: "Dark Mode",
        sound: "Sound Effects",
        close: "CLOSE",
        got_it: "GOT IT!",
        tut_1: "Swap adjacent fruits to match 3+ in a row.",
        tut_2: "Match 4 to create a Juice Fruit that clears rows/cols.",
        tut_3: "Hit the target score before time runs out."
    },
    hi: {
        login_title: "स्वागत है! शुरू करने के लिए अपना नाम लिखें।",
        enter_name: "खिलाड़ी का नाम",
        start_game: "गेम शुरू करें",
        best_score: "सर्वश्रेष्ठ स्कोर",
        level_reached: "स्तर",
        play: "खेलें",
        settings: "सेटिंग्स",
        tutorial: "कैसे खेलें",
        exit: "बाहर निकलें",
        select_level: "स्तर चुनें",
        score: "स्कोर",
        time: "समय",
        target: "लक्ष्य",
        paused: "खेल रुका हुआ",
        resume: "जारी रखें",
        restart: "दोबारा शुरू करें",
        home: "होम",
        final_score: "कुल स्कोर",
        next_level: "अगला स्तर",
        dark_mode: "डार्क मोड",
        sound: "ध्वनि प्रभाव",
        close: "बंद करें",
        got_it: "समझ गया!",
        tut_1: "एक ही प्रकार के 3+ फल मिलाने के लिए अदला-बदली करें।",
        tut_2: "4 मिलाने पर एक जूस फल बनता है जो पूरी लाइन हटा देता है।",
        tut_3: "समय समाप्त होने से पहले लक्ष्य स्कोर तक पहुँचें।"
    }
};

type Language = 'en' | 'hi';

interface GameState {
    playerName: string;
    bestScore: number;
    unlockedLevel: number;
    currentLevel: number;
    score: number;
    targetScore: number;
    timeRemaining: number;
    isPaused: boolean;
    settings: {
        theme: 'light' | 'dark';
        sound: boolean;
    };
}

interface TilePos {
    r: number;
    c: number;
}

const FRUIT_TYPES = ['apple', 'orange', 'grapes', 'banana', 'blueberry', 'kiwi'];
const BOARD_SIZE = 8;

export default function App() {
    // Persistent profile state loading
    const [currentLang, setCurrentLang] = useState<Language>('en');
    const [screen, setScreen] = useState<'login' | 'home' | 'level-selection' | 'game-screen'>('login');
    const [modal, setModal] = useState<'game-over' | 'pause' | 'settings' | 'tutorial' | null>(null);

    const [playerName, setPlayerName] = useState('Muskan');
    const [bestScore, setBestScore] = useState(0);
    const [unlockedLevel, setUnlockedLevel] = useState(1);
    const [levelTab, setLevelTab] = useState(0); // 0: 1-25, 1: 26-50, 2: 51-75, 3: 76-100
    
    // Win Streak and Piggy bank persistence
    const [winStreak, setWinStreak] = useState(0);
    const [piggyBankCount, setPiggyBankCount] = useState(10);
    
    // Slide 10: Rewards, Coins, Gold Bars, Bonus Lives
    const [coins, setCoins] = useState(1000);
    const [goldBars, setGoldBars] = useState(50);
    const [lives, setLives] = useState(5);
    const [lastLifeTime, setLastLifeTime] = useState<number>(Date.now());
    const [livesModalOpen, setLivesModalOpen] = useState(false);
    const [timeTick, setTimeTick] = useState(0);

    // Coins collection claim states
    const [lastCoinClaimTime, setLastCoinClaimTime] = useState<number>(0);
    const [coinFeedback, setCoinFeedback] = useState<string | null>(null);

    const [boosterInventory, setBoosterInventory] = useState<BoosterInventory>({
        bomb: 3,
        bolt: 3,
        colorBomb: 1,
        stripedWrapped: 1,
        extraMoves: 2,
        luckyCandy: 1,
        hammer: 2,
        hand: 2
    });

    // Sub-menus panels flags
    const [showDailyBonus, setShowDailyBonus] = useState(false);
    const [showRankings, setShowRankings] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [showPreSetup, setShowPreSetup] = useState(false);
    const [pendingLevelNum, setPendingLevelNum] = useState<number>(1);

    // Active Level State
    const [currentLevel, setCurrentLevel] = useState(1);
    const [activeLevelConfig, setActiveLevelConfig] = useState<LevelConfig | null>(null);
    const [score, setScore] = useState(0);
    const [targetScore, setTargetScore] = useState(500);
    const [timeRemaining, setTimeRemaining] = useState(60);
    const [movesRemaining, setMovesRemaining] = useState(25);
    const [isPaused, setIsPaused] = useState(false);

    // Gesture/dragging tracking references
    const dragStartRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);

    // Dynamic level modes grids
    const [jellyGrid, setJellyGrid] = useState<number[][]>([]); // 0: no jelly, 1: frosted jelly layer
    const [collectedIngredients, setCollectedIngredients] = useState<number>(0);
    const [activeCandyOrders, setActiveCandyOrders] = useState<{ fruitIndex: number; target: number; current: number }[]>([]);
    const [rapidsClearedCount, setRapidsClearedCount] = useState<number>(0);

    // Manual item powerup states
    const [activeManualPowerup, setActiveManualPowerup] = useState<'hammer' | 'hand' | null>(null);
    const [handSelectedTile, setHandSelectedTile] = useState<TilePos | null>(null);
    
    // Settings state
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [bgmEnabled, setBgmEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    // Board state
    const [board, setBoard] = useState<number[][]>([]);
    const [selectedTile, setSelectedTile] = useState<TilePos | null>(null);
    const [activePowerup, setActivePowerup] = useState<'bomb' | 'bolt' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [isHeavyShaking, setIsHeavyShaking] = useState(false);
    const [matchingSplash, setMatchingSplash] = useState<string | null>(null);

    // Audio Context state
    const audioCtxRef = useRef<AudioContext | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Background Music (BGM) References
    const bgmSagaRef = useRef<HTMLAudioElement | null>(null);
    const bgmLevelRef = useRef<HTMLAudioElement | null>(null);
    const bgmGameRef = useRef<HTMLAudioElement | null>(null);

    // Initialize HTML5 Audio elements
    useEffect(() => {
        const saga = new Audio("/candy_crush_saga_rin.mp3");
        saga.loop = true;
        bgmSagaRef.current = saga;

        const lvl = new Audio("/candy_crush_level.mp3");
        lvl.loop = true;
        bgmLevelRef.current = lvl;

        const game = new Audio("/vidssave.com candy crush old memories ☺☺☺ 256KBPS.mp3");
        game.loop = true;
        bgmGameRef.current = game;

        return () => {
            saga.pause();
            lvl.pause();
            game.pause();
        };
    }, []);

    // Function to apply active background music selection and states
    const updateBgm = () => {
        const saga = bgmSagaRef.current;
        const lvl = bgmLevelRef.current;
        const game = bgmGameRef.current;

        if (!saga || !lvl || !game) return;

        // If background music is disabled, completely silence and pause everything
        if (!bgmEnabled) {
            saga.pause();
            lvl.pause();
            game.pause();
            return;
        }

        // Determine correct track matching screen lifecycle state
        let targetTrack: HTMLAudioElement | null = null;

        if (showPreSetup) {
            // "jab koi level open kara to us time candy_crush _level.mp3 level select karna tk yahi sound rahni chyia"
            targetTrack = lvl;
        } else if (screen === 'game-screen' && modal !== 'game-over') {
            // "uska baad jab game start ho tb vidssave.comcandy crush old memories 256KBPS.mp3 ka name sa sound ye tnbb tk chln i chyia jab tk game over na ho"
            targetTrack = game;
        } else {
            // "jab hm game open karta ha tb tk/level select na kare tab tak yahi chalega"
            targetTrack = saga;
        }

        // Apply audio play & pause/reset
        [saga, lvl, game].forEach(track => {
            if (track === targetTrack) {
                if (track.paused) {
                    track.play().catch(err => {
                        // Browsers block autoplay until first user gesture
                        console.log("Autoplay check:", err.message);
                    });
                }
            } else {
                track.pause();
                track.currentTime = 0; // Reset to beginning so it restarts on next entry
            }
        });
    };

    // Watcher to sync BGM state with app state
    useEffect(() => {
        updateBgm();
    }, [soundEnabled, bgmEnabled, screen, showPreSetup, modal]);

    // Handle initial browser gesture to start audio
    useEffect(() => {
        const handleUserGesture = () => {
            updateBgm();
        };
        document.addEventListener('click', handleUserGesture, { once: true });
        document.addEventListener('touchstart', handleUserGesture, { once: true });
        return () => {
            document.removeEventListener('click', handleUserGesture);
            document.removeEventListener('touchstart', handleUserGesture);
        };
    }, [soundEnabled, bgmEnabled, screen, showPreSetup, modal]);

    // Load state from localStorage on Mount
    useEffect(() => {
        const saved = localStorage.getItem('fruit_puzzle_save');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.playerName) setPlayerName(parsed.playerName);
                if (parsed.bestScore) setBestScore(parsed.bestScore);
                if (parsed.unlockedLevel) setUnlockedLevel(parsed.unlockedLevel);
                if (parsed.winStreak !== undefined) setWinStreak(parsed.winStreak);
                if (parsed.piggyBankCount !== undefined) setPiggyBankCount(parsed.piggyBankCount);
                if (parsed.boosterInventory) setBoosterInventory(parsed.boosterInventory);
                if (parsed.difficulty !== undefined) setDifficulty(parsed.difficulty);
                
                // Load Slide 10 states
                if (parsed.coins !== undefined) setCoins(parsed.coins);
                if (parsed.goldBars !== undefined) setGoldBars(parsed.goldBars);
                if (parsed.lives !== undefined) setLives(parsed.lives);
                if (parsed.lastLifeTime !== undefined) setLastLifeTime(parsed.lastLifeTime);

                if (parsed.settings) {
                    if (parsed.settings.theme) setTheme(parsed.settings.theme);
                    if (parsed.settings.sound !== undefined) setSoundEnabled(parsed.settings.sound);
                    if (parsed.settings.vibration !== undefined) setVibrationEnabled(parsed.settings.vibration);
                    if (parsed.settings.bgm !== undefined) setBgmEnabled(parsed.settings.bgm);
                }
                setScreen('home-screen' as any === 'home-screen' ? 'home' : 'login');
            } catch (e) {
                console.error("Failed to parse game data", e);
            }
        }
    }, []);

    // Slide 10: Clock Tick & Life Regeneration Periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeTick(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (lives >= 5) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const timeDiff = now - lastLifeTime;
            const restoreAmount = Math.floor(timeDiff / (15 * 60 * 1000));
            if (restoreAmount > 0) {
                const nextLives = Math.min(5, lives + restoreAmount);
                const nextLastLifeTime = lastLifeTime + (restoreAmount * 15 * 60 * 1000);
                setLives(nextLives);
                setLastLifeTime(nextLastLifeTime);
                saveProfileData(
                    playerName, bestScore, unlockedLevel, theme, soundEnabled,
                    winStreak, piggyBankCount, boosterInventory, vibrationEnabled,
                    difficulty, bgmEnabled, coins, goldBars, nextLives, nextLastLifeTime
                );
            }
        }, 8000);
        return () => clearInterval(interval);
    }, [lives, lastLifeTime, playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, boosterInventory, vibrationEnabled, difficulty, bgmEnabled, coins, goldBars]);

    const getLifeCountdown = () => {
        if (lives >= 5) return "";
        const elapsed = Date.now() - lastLifeTime;
        const remainingMs = (15 * 60 * 1000) - (elapsed % (15 * 60 * 1000));
        const remSecs = Math.max(0, Math.floor(remainingMs / 1000));
        const mins = Math.floor(remSecs / 60);
        const secs = remSecs % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const getCoinClaimCooldown = () => {
        const cooldownPeriod = 30 * 1000; // 30 seconds cooldown for instant test, keeping it fun
        const elapsed = Date.now() - lastCoinClaimTime;
        if (elapsed >= cooldownPeriod) return 0;
        return Math.max(0, Math.ceil((cooldownPeriod - elapsed) / 1000));
    };

    const handleCollectCoins = () => {
        const cooldown = getCoinClaimCooldown();
        if (cooldown > 0) return;
        
        setLastCoinClaimTime(Date.now());
        setCoins(prev => {
            const next = prev + 250;
            saveProfileData(
                playerName, bestScore, unlockedLevel, theme, soundEnabled,
                winStreak, piggyBankCount, boosterInventory, vibrationEnabled,
                difficulty, bgmEnabled, next, goldBars, lives, lastLifeTime
            );
            return next;
        });
        
        playSynthSound('win');
        
        setCoinFeedback("🎉 +250 FREE COINS!");
        setTimeout(() => {
            setCoinFeedback(null);
        }, 2200);
    };

    // Save profile when core states change
    const saveProfileData = (
        updatedName = playerName, 
        updatedBest = bestScore, 
        updatedUnlocked = unlockedLevel, 
        updatedTheme = theme, 
        updatedSound = soundEnabled,
        updatedStreak = winStreak,
        updatedPiggy = piggyBankCount,
        updatedBoot = boosterInventory,
        updatedVibration = vibrationEnabled,
        updatedDifficulty = difficulty,
        updatedBgmEnabled = bgmEnabled,
        updatedCoins = coins,
        updatedGoldBars = goldBars,
        updatedLives = lives,
        updatedLastLifeTime = lastLifeTime
    ) => {
        const payload = {
            playerName: updatedName,
            bestScore: updatedBest,
            unlockedLevel: updatedUnlocked,
            winStreak: updatedStreak,
            piggyBankCount: updatedPiggy,
            boosterInventory: updatedBoot,
            difficulty: updatedDifficulty,
            coins: updatedCoins,
            goldBars: updatedGoldBars,
            lives: updatedLives,
            lastLifeTime: updatedLastLifeTime,
            settings: {
                theme: updatedTheme,
                sound: updatedSound,
                vibration: updatedVibration,
                bgm: updatedBgmEnabled
            }
        };
        localStorage.setItem('fruit_puzzle_save', JSON.stringify(payload));
    };

    const handleAddBoosters = (rewards: Partial<BoosterInventory>) => {
        setBoosterInventory(prev => {
            const next = { ...prev };
            Object.keys(rewards).forEach(k => {
                const key = k as keyof BoosterInventory;
                if (next[key] !== undefined) {
                    next[key] += (rewards[key] || 0);
                }
            });
            saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, next, vibrationEnabled, difficulty, bgmEnabled, coins, goldBars, lives, lastLifeTime);
            return next;
        });
    };

    const handleAddCoins = (amount: number) => {
        setCoins(prev => {
            const next = prev + amount;
            saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, boosterInventory, vibrationEnabled, difficulty, bgmEnabled, next, goldBars, lives, lastLifeTime);
            return next;
        });
    };

    const handleAddGoldBars = (amount: number) => {
        setGoldBars(prev => {
            const next = prev + amount;
            saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, boosterInventory, vibrationEnabled, difficulty, bgmEnabled, coins, next, lives, lastLifeTime);
            return next;
        });
    };

    const handleAddLives = (amount: number) => {
        setLives(prev => {
            const next = Math.min(5, prev + amount);
            const nextLastLifeTime = next >= 5 ? Date.now() : lastLifeTime;
            setLastLifeTime(nextLastLifeTime);
            saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, boosterInventory, vibrationEnabled, difficulty, bgmEnabled, coins, goldBars, next, nextLastLifeTime);
            return next;
        });
    };

    // Apply Theme and classes to root HTML element
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Active timer loop when in play and unpaused
    useEffect(() => {
        let timer: any = null;
        if (screen === 'game-screen' && !isPaused && !modal) {
            timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        endActiveGame(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [screen, isPaused, modal]);

    // Active moves watcher - trigger Game Over if moves reach zero and win is pending
    useEffect(() => {
        if (screen === 'game-screen' && !isPaused && !modal && movesRemaining === 0) {
            // Wait 1.5s grace period so any running cascades or matches finish animating
            const delayCheck = setTimeout(() => {
                if (screen === 'game-screen' && !isPaused && !modal) {
                    endActiveGame(false);
                }
            }, 1500);
            return () => clearTimeout(delayCheck);
        }
    }, [movesRemaining, screen, isPaused, modal]);

    // Win condition watcher
    useEffect(() => {
        if (screen === 'game-screen' && activeLevelConfig) {
            let isWon = false;
            const mode = activeLevelConfig.mode;
            
            if (mode === 'score') {
                isWon = score >= targetScore;
            } else if (mode === 'jelly') {
                const totalJelliesLeft = jellyGrid.reduce((sum, row) => sum + row.reduce((acc, cell) => acc + cell, 0), 0);
                isWon = totalJelliesLeft === 0 && score >= Math.round(targetScore * 0.4);
            } else if (mode === 'ingredient') {
                isWon = collectedIngredients >= (activeLevelConfig.ingredientsToDrop || 1);
            } else if (mode === 'order') {
                const areOrdersPending = activeCandyOrders.some(ord => ord.current < ord.target);
                isWon = !areOrdersPending;
            } else if (mode === 'rainbow-rapids') {
                isWon = rapidsClearedCount >= (activeLevelConfig.rapidsCount || 4);
            } else if (mode === 'mixed') {
                const totalJelliesLeft = jellyGrid.reduce((sum, row) => sum + row.reduce((acc, cell) => acc + cell, 0), 0);
                const needMoreDragons = collectedIngredients < (activeLevelConfig.ingredientsToDrop || 1);
                const areOrdersPending = activeCandyOrders.some(ord => ord.current < ord.target);
                isWon = totalJelliesLeft === 0 && !needMoreDragons && !areOrdersPending;
            }

            if (isWon) {
                endActiveGame(true);
            }
        }
    }, [score, targetScore, screen, jellyGrid, collectedIngredients, activeCandyOrders, rapidsClearedCount, activeLevelConfig]);

    // Tab pager auto-focus tracker to automatically open/unlock the next level's group page
    useEffect(() => {
        if (unlockedLevel > 0) {
            const correctTab = Math.min(3, Math.floor((unlockedLevel - 1) / 25));
            setLevelTab(correctTab);
        }
    }, [unlockedLevel]);

    // Helper to synthesise sound
    const playSynthSound = (type: 'swap' | 'match' | 'bomb' | 'bolt' | 'win') => {
        // Trigger device physical vibration feedback if enabled
        if (vibrationEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
            try {
                if (type === 'swap') {
                    navigator.vibrate(35);
                } else if (type === 'match') {
                    navigator.vibrate(55);
                } else if (type === 'bomb') {
                    navigator.vibrate([120, 50, 120]);
                } else if (type === 'bolt') {
                    navigator.vibrate([80, 45, 80]);
                } else if (type === 'win') {
                    navigator.vibrate([100, 50, 100, 60, 200]);
                }
            } catch (err) {
                console.log("Tactile vibration feedback blocked or unsupported:", err);
            }
        }

        if (!soundEnabled) return;
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const now = ctx.currentTime;

            if (type === 'swap') {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.type = 'triangle';
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'match') {
                // Play a gorgeous major chord harmony! (C5, E5, G5, C6)
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    osc.type = 'sine';
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    osc.frequency.setValueAtTime(freq, now + idx * 0.04);
                    gainNode.gain.setValueAtTime(0.12 / notes.length, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
                    
                    osc.start(now);
                    osc.stop(now + 0.35);
                });
            } else if (type === 'bomb') {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.type = 'sawtooth';
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);

                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.45);
            } else if (type === 'bolt') {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.type = 'triangle';
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);

                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'win') {
                // Play a wonderful uplifting win chime sequence!
                const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    osc.type = 'sine';
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    gainNode.gain.setValueAtTime(0.15 / notes.length, now + idx * 0.08);
                    gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.6 + idx * 0.08);
                    
                    osc.start(now);
                    osc.stop(now + 0.6 + idx * 0.08);
                });
            }
        } catch (e) {
            console.log("Audio synthesis error:", e);
        }
    };

    // Particles factory
    const createPopParticles = (r: number, c: number, val?: number) => {
        const boardEl = document.getElementById('game-board');
        const tileEl = document.getElementById(`tile-${r}-${c}`);
        if (!boardEl || !tileEl) return;

        const boardRect = boardEl.getBoundingClientRect();
        const tileRect = tileEl.getBoundingClientRect();
        const x = tileRect.left + tileRect.width / 2 - boardRect.left;
        const y = tileRect.top + tileRect.height / 2 - boardRect.top;

        const colors = ['#ef4444', '#f97316', '#a855f7', '#facc15', '#3b82f6', '#22c55e'];
        const burstColor = (val !== undefined && val >= 0 && val < colors.length) ? colors[val] : colors[Math.floor(Math.random() * colors.length)];

        // Create color-coordinated shockwave circle
        const wave = document.createElement('div');
        wave.className = 'pop-shockwave';
        wave.style.left = `${x}px`;
        wave.style.top = `${y}px`;
        wave.style.setProperty('--wave-color', burstColor);
        boardEl.appendChild(wave);
        setTimeout(() => wave.remove(), 500);

        // Spawn 14 vibrant sparks
        for (let i = 0; i < 14; i++) {
            const part = document.createElement('div');
            part.className = 'particle';
            const size = Math.random() * 7 + 6;
            part.style.width = `${size}px`;
            part.style.height = `${size}px`;
            part.style.backgroundColor = burstColor;
            part.style.boxShadow = `0 0 6px ${burstColor}, 0 0 12px ${burstColor}`;
            part.style.left = `${x}px`;
            part.style.top = `${y}px`;

            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 75 + 30;
            const mx = Math.cos(angle) * dist;
            const my = Math.sin(angle) * dist;

            part.style.setProperty('--mx', `${mx}px`);
            part.style.setProperty('--my', `${my}px`);

            boardEl.appendChild(part);
            setTimeout(() => part.remove(), 700);
        }
    };

    // Mega Bomb Blast factory when matching 4+ fruits
    const createMegaBombBlast = (r: number, c: number) => {
        const boardEl = document.getElementById('game-board');
        const tileEl = document.getElementById(`tile-${r}-${c}`);
        if (!boardEl || !tileEl) return;

        const boardRect = boardEl.getBoundingClientRect();
        const tileRect = tileEl.getBoundingClientRect();
        const x = tileRect.left + tileRect.width / 2 - boardRect.left;
        const y = tileRect.top + tileRect.height / 2 - boardRect.top;

        // 1. Spawning large circular shockwave expander ring
        const wave = document.createElement('div');
        wave.className = 'mega-shockwave';
        wave.style.left = `${x}px`;
        wave.style.top = `${y}px`;
        boardEl.appendChild(wave);
        setTimeout(() => wave.remove(), 650);

        // 2. Spawn 24 mega sparkling fiery particles
        const colors = ['#f43f5e', '#fb923c', '#fbbf24', '#facc15', '#ef4444', '#ffffff', '#e11d48'];
        for (let i = 0; i < 28; i++) {
            const part = document.createElement('div');
            part.className = 'mega-particle';
            const size = Math.random() * 14 + 10; // Large particles
            part.style.width = `${size}px`;
            part.style.height = `${size}px`;
            part.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            part.style.left = `${x}px`;
            part.style.top = `${y}px`;
            part.style.borderRadius = '50%';

            const angle = (i / 28) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
            const dist = Math.random() * 130 + 60; // Farther throw
            const mx = Math.cos(angle) * dist;
            const my = Math.sin(angle) * dist;

            part.style.setProperty('--mx', `${mx}px`);
            part.style.setProperty('--my', `${my}px`);

            boardEl.appendChild(part);
            setTimeout(() => part.remove(), 800);
        }
    };

    const handleProfileSubmit = () => {
        const trimmed = playerName.trim();
        if (!trimmed) return;
        setPlayerName(trimmed);
        saveProfileData(trimmed);
        setScreen('home');
        playSynthSound('swap');
    };

    const handleExit = () => {
        setScreen('login');
        playSynthSound('swap');
    };

    const launchLevel = (levelNum: number) => {
        if (lives <= 0) {
            setLivesModalOpen(true);
            return;
        }
        setPendingLevelNum(levelNum);
        setShowPreSetup(true);
    };

    const startGameWithBoosters = (
        levelNum: number, 
        boosters: { colorBomb: boolean; stripedWrapped: boolean; extraMoves: boolean; luckyCandy: boolean }
    ) => {
        const config = getLevelConfig(levelNum);
        setActiveLevelConfig(config);
        setShowPreSetup(false);

        // Consume booster inventory
        const nextInv = { ...boosterInventory };
        if (boosters.colorBomb) nextInv.colorBomb = Math.max(0, nextInv.colorBomb - 1);
        if (boosters.stripedWrapped) nextInv.stripedWrapped = Math.max(0, nextInv.stripedWrapped - 1);
        if (boosters.extraMoves) nextInv.extraMoves = Math.max(0, nextInv.extraMoves - 1);
        if (boosters.luckyCandy) nextInv.luckyCandy = Math.max(0, nextInv.luckyCandy - 1);
        setBoosterInventory(nextInv);
        saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, nextInv);

        // Core stats setup
        setCurrentLevel(levelNum);
        setScore(0);

        // Adjust parameters depending on setting difficulty
        let difficultyScoreMultiplier = 1.0;
        let difficultyMovesMultiplier = 1.0;
        let difficultyTimeMultiplier = 1.0;

        if (difficulty === 'easy') {
            difficultyScoreMultiplier = 0.75; // 25% lower requirement
            difficultyMovesMultiplier = 1.25; // 25% more moves
            difficultyTimeMultiplier = 1.25; // 25% more clock time
        } else if (difficulty === 'hard') {
            difficultyScoreMultiplier = 1.35; // 35% higher requirement
            difficultyMovesMultiplier = 0.8;  // 20% fewer moves
            difficultyTimeMultiplier = 0.8;  // 20% less clock time
        }

        setTargetScore(Math.round(config.targetScore * difficultyScoreMultiplier));
        
        // Time Remaining + extra time/moves booster
        const baseTime = config.timeLimit;
        const finalTime = Math.round((baseTime + (boosters.extraMoves ? 30 : 0)) * difficultyTimeMultiplier);
        setTimeRemaining(finalTime);

        // Standard Match-3 level gives 25 moves base, +5 extra count from booster!
        const finalMoves = Math.round((25 + (boosters.extraMoves ? 5 : 0)) * difficultyMovesMultiplier);
        setMovesRemaining(finalMoves);

        setIsPaused(false);
        setActivePowerup(null);
        setSelectedTile(null);
        setModal(null);
        setActiveManualPowerup(null);
        setHandSelectedTile(null);
        setCollectedIngredients(0);
        setRapidsClearedCount(0);

        // Set candy orders state
        if (config.candyOrders) {
            setActiveCandyOrders(config.candyOrders.map(o => ({ ...o, current: 0 })));
        } else {
            setActiveCandyOrders([]);
        }

        // Setup Jelly 8x8 Grid
        const jellies = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
        if (config.mode === 'jelly' || config.mode === 'mixed') {
            const numJellies = config.jellyCount || 8;
            let jelliesPlaced = 0;
            // Place jellies in center rows
            for (let r = 2; r <= 5; r++) {
                for (let c = 1; c <= 6; c++) {
                    if (jelliesPlaced < numJellies) {
                        jellies[r][c] = 1;
                        jelliesPlaced++;
                    }
                }
            }
        }
        setJellyGrid(jellies);

        // Generate Board Matrix
        generateBoardForConfig(config, boosters);
        setScreen('game-screen');
    };

    const generateBoardForConfig = (config: LevelConfig, boosters: { colorBomb: boolean; stripedWrapped: boolean; luckyCandy: boolean }) => {
        let mat: number[][] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            mat[r] = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                mat[r][c] = Math.floor(Math.random() * FRUIT_TYPES.length);
            }
        }

        // Special Board Obstacles: Rapids Mud Blockers (88)
        if (config.mode === 'rainbow-rapids') {
            const count = config.rapidsCount || 6;
            let placed = 0;
            while (placed < count) {
                const r = Math.floor(Math.random() * (BOARD_SIZE - 2)) + 1; // avoid top-bottom rows
                const c = Math.floor(Math.random() * BOARD_SIZE);
                if (mat[r][c] !== 88) {
                    mat[r][c] = 88;
                    placed++;
                }
            }
        }

        // Special Board Obstacles: Ingredients dragons (99)
        if (config.mode === 'ingredient' || config.mode === 'mixed') {
            const drops = config.ingredientsToDrop || 1;
            for (let i = 0; i < Math.min(drops, 2); i++) {
                const col = 2 + i * 3;
                mat[0][col] = 99; // place ingredient at row 0
            }
        }

        // Keep shuffling standard fruits (0 to 5) to prevent starting matches
        let attempts = 0;
        while (checkIsHavingMatches(mat) && attempts < 100) {
            attempts++;
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (mat[r][c] < 6) { // only shuffle normal fruits
                        mat[r][c] = Math.floor(Math.random() * FRUIT_TYPES.length);
                    }
                }
            }
        }

        // Starting Pre-Level Booster overlays: Color Candy (RAINBOW index 10)
        if (boosters.colorBomb) {
            mat[4][3] = 10; // place pre-level color candy bomb
        }

        // Lucky candy pre-level helper: replaces another cell with extra bomb value 11 (striped)
        if (boosters.luckyCandy || boosters.stripedWrapped) {
            mat[3][4] = 11; 
        }

        setBoard(mat);
    };

    const checkIsHavingMatches = (matrix: number[][]): boolean => {
        // Rows
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE - 2; c++) {
                if (matrix[r][c] !== -1 && matrix[r][c] === matrix[r][c+1] && matrix[r][c] === matrix[r][c+2]) {
                    return true;
                }
            }
        }
        // Columns
        for (let c = 0; c < BOARD_SIZE; c++) {
            for (let r = 0; r < BOARD_SIZE - 2; r++) {
                if (matrix[r][c] !== -1 && matrix[r][c] === matrix[r+1][c] && matrix[r][c] === matrix[r+2][c]) {
                    return true;
                }
            }
        }
        return false;
    };

    const findMatchPositions = (matrix: number[][]): TilePos[] => {
        const matched = new Set<string>();

        // Rows check
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE - 2; c++) {
                if (matrix[r][c] !== -1 && matrix[r][c] === matrix[r][c+1] && matrix[r][c] === matrix[r][c+2]) {
                    matched.add(`${r},${c}`);
                    matched.add(`${r},${c+1}`);
                    matched.add(`${r},${c+2}`);
                }
            }
        }

        // Column check
        for (let c = 0; c < BOARD_SIZE; c++) {
            for (let r = 0; r < BOARD_SIZE - 2; r++) {
                if (matrix[r][c] !== -1 && matrix[r][c] === matrix[r+1][c] && matrix[r][c] === matrix[r+2][c]) {
                    matched.add(`${r},${c}`);
                    matched.add(`${r+1},${c}`);
                    matched.add(`${r+2},${c}`);
                }
            }
        }

        return Array.from(matched).map(str => {
            const [r, c] = str.split(',').map(Number);
            return { r, c };
        });
    };

    // Gesture swipe drag detection to slide sideways (lateral) or up/down
    const handleDragStart = (r: number, c: number, x: number, y: number) => {
        if (isPaused || modal || isAnimating) return;
        
        // Touch interaction also warms up AudioContext inside the user action event loop
        if (soundEnabled) {
            try {
                if (!audioCtxRef.current) {
                    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                const ctx = audioCtxRef.current;
                if (ctx.state === 'suspended') {
                    ctx.resume();
                }
            } catch (e) {
                console.log(e);
            }
        }
        
        dragStartRef.current = { r, c, x, y };
    };

    const handleDragMove = (r: number, c: number, x: number, y: number) => {
        if (!dragStartRef.current || isPaused || modal || isAnimating) return;
        const start = dragStartRef.current;
        if (start.r !== r || start.c !== c) return;

        const dx = x - start.x;
        const dy = y - start.y;
        const minDistance = 25; // drag threshold in pixels

        if (Math.abs(dx) > minDistance || Math.abs(dy) > minDistance) {
            let targetR = r;
            let targetC = c;

            if (Math.abs(dx) > Math.abs(dy)) {
                // Dragged sideways (horizontal movement)
                targetC = dx > 0 ? c + 1 : c - 1;
            } else {
                // Dragged vertically (up/down movement)
                targetR = dy > 0 ? r + 1 : r - 1;
            }

            // Immediately invalidate drag tracking so we don't swap repeatedly
            dragStartRef.current = null;

            // Trigger swap action if coordinates are in boundaries
            if (targetR >= 0 && targetR < BOARD_SIZE && targetC >= 0 && targetC < BOARD_SIZE) {
                swapAndResolve(r, c, targetR, targetC);
            }
        }
    };

    const handleDragEnd = () => {
        dragStartRef.current = null;
    };

    // Perform Swapping mechanism
    const handleTileClick = (r: number, c: number) => {
        if (isPaused || modal || isAnimating) return;

        // Warm up and verify AudioContext is running
        if (soundEnabled) {
            try {
                if (!audioCtxRef.current) {
                    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                const ctx = audioCtxRef.current;
                if (ctx.state === 'suspended') {
                    ctx.resume();
                }
            } catch (e) {
                console.log(e);
            }
        }

        // Lollipop Hammer booster handling
        if (activeManualPowerup === 'hammer') {
            playSynthSound('bomb');
            createPopParticles(r, c, board[r][c]);
            const nextB = board.map(row => [...row]);
            nextB[r][c] = -1;
            
            setBoosterInventory(prev => {
                const next = { ...prev, hammer: Math.max(0, prev.hammer - 1) };
                saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, next);
                return next;
            });

            setActiveManualPowerup(null);
            setMatchingSplash("🔨 LOLLIPOP SMASHED CELL!");
            setTimeout(() => setMatchingSplash(null), 1250);

            processMatchedTiles(nextB, []);
            return;
        }

        // Free Switch Hand booster handling
        if (activeManualPowerup === 'hand') {
            if (!handSelectedTile) {
                setHandSelectedTile({ r, c });
            } else {
                const dist = Math.abs(handSelectedTile.r - r) + Math.abs(handSelectedTile.c - c);
                if (dist === 1) {
                    setIsAnimating(true);
                    playSynthSound('swap');

                    const nextB = board.map(row => [...row]);
                    const tmp = nextB[handSelectedTile.r][handSelectedTile.c];
                    nextB[handSelectedTile.r][handSelectedTile.c] = nextB[r][c];
                    nextB[r][c] = tmp;

                    setBoard(nextB);

                    setBoosterInventory(prev => {
                        const next = { ...prev, hand: Math.max(0, prev.hand - 1) };
                        saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, next);
                        return next;
                    });

                    setActiveManualPowerup(null);
                    setHandSelectedTile(null);
                    setMatchingSplash("🖐️ FREE HAND REPOSITIONED CELLS!");
                    setTimeout(() => setMatchingSplash(null), 1250);

                    const matches = findMatchPositions(nextB);
                    if (matches.length > 0) {
                        processMatchedTiles(nextB, matches);
                    } else {
                        setIsAnimating(false);
                    }
                } else {
                    setHandSelectedTile({ r, c });
                }
            }
            return;
        }

        // Perform standard powerups
        if (activePowerup) {
            executePowerup(r, c);
            return;
        }

        if (!selectedTile) {
            setSelectedTile({ r, c });
        } else {
            const distance = Math.abs(selectedTile.r - r) + Math.abs(selectedTile.c - c);
            if (distance === 1) {
                swapAndResolve(selectedTile.r, selectedTile.c, r, c);
            }
            setSelectedTile(null);
        }
    };

    const swapAndResolve = async (r1: number, c1: number, r2: number, c2: number) => {
        setIsAnimating(true);
        playSynthSound('swap');

        // Consume one move
        setMovesRemaining(prev => Math.max(0, prev - 1));

        // Swap board items
        const nextBoard = board.map(row => [...row]);
        const tmp = nextBoard[r1][c1];
        nextBoard[r1][c1] = nextBoard[r2][c2];
        nextBoard[r2][c2] = tmp;

        setBoard(nextBoard);

        // 1. Color Candy Bomb (Index 10) matching check
        const isColorSwap = nextBoard[r1][c1] === 10 || nextBoard[r2][c2] === 10;
        if (isColorSwap) {
            // Determine which candy index to wipe from grid
            const targetColor = nextBoard[r1][c1] === 10 ? nextBoard[r2][c2] : nextBoard[r1][c1];
            const wipeList: TilePos[] = [];
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (nextBoard[r][c] === targetColor || nextBoard[r][c] === 10) {
                        wipeList.push({ r, c });
                    }
                }
            }
            playSynthSound('bolt');
            setMatchingSplash("🌈 COLOR CANDY RAINBOW BLAST!");
            setTimeout(() => setMatchingSplash(null), 1200);

            await processMatchedTiles(nextBoard, wipeList);
            return;
        }

        // Find standard match sequences
        const matches = findMatchPositions(nextBoard);

        if (matches.length > 0) {
            await processMatchedTiles(nextBoard, matches);
        } else {
            // Revert back if swap yielded no combinations
            setTimeout(() => {
                const revertBoard = nextBoard.map(row => [...row]);
                const tmp2 = revertBoard[r1][c1];
                revertBoard[r1][c1] = revertBoard[r2][c2];
                revertBoard[r2][c2] = tmp2;
                setBoard(revertBoard);
                setIsAnimating(false);
            }, 300);
        }
    };

    const processMatchedTiles = async (currBoard: number[][], matches: TilePos[]) => {
        const isMegaBomb = matches.length >= 4;

        if (isMegaBomb) {
            playSynthSound('bomb');
            setIsHeavyShaking(true);
            setTimeout(() => setIsHeavyShaking(false), 380);

            const customBadges = [
                `💥 MATCH ${matches.length} MEGA BLAST!`,
                `🔥 BANANA SPLASH BLAST!`,
                `👑 FRUIT BOMB COMBINATION!`,
                `✨ MATCH ${matches.length} COSMIC POP!`,
                `⚡ EXTREME JUICE EXPLOSION!`
            ];
            const chosenBadge = customBadges[Math.floor(Math.random() * customBadges.length)];
            setMatchingSplash(chosenBadge);
            setTimeout(() => setMatchingSplash(null), 1200);

            const centerIndex = Math.floor(matches.length / 2);
            const centerTile = matches[centerIndex];
            createMegaBombBlast(centerTile.r, centerTile.c);

            matches.forEach((m, idx) => {
                const tileEl = document.getElementById(`tile-${m.r}-${m.c}`);
                if (tileEl) tileEl.classList.add('match-anim');
                if (idx !== centerIndex) {
                    setTimeout(() => {
                        createPopParticles(m.r, m.c, currBoard[m.r][m.c]);
                    }, idx * 30);
                }
            });
        } else {
            playSynthSound('match');
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 250);

            matches.forEach(m => {
                createPopParticles(m.r, m.c, currBoard[m.r][m.c]);
                const tileEl = document.getElementById(`tile-${m.r}-${m.c}`);
                if (tileEl) tileEl.classList.add('match-anim');
            });
        }

        // Increment Score
        const multiplier = isMegaBomb ? 25 : 15;
        setScore(prev => prev + matches.length * multiplier);

        // A. Update Candy store orders progress counters
        if (activeCandyOrders.length > 0) {
            setActiveCandyOrders(prev => {
                return prev.map(ord => {
                    let totalMatchesOfThisColor = 0;
                    matches.forEach(m => {
                        if (currBoard[m.r][m.c] === ord.fruitIndex) {
                            totalMatchesOfThisColor++;
                        }
                    });
                    if (totalMatchesOfThisColor > 0) {
                        return { ...ord, current: Math.min(ord.target, ord.current + totalMatchesOfThisColor) };
                    }
                    return ord;
                });
            });
        }

        // B. Clear Frosted Jellies grids if match falls on covered square
        let jellyClearedSomething = false;
        setJellyGrid(prevJelly => {
            const nextGrid = prevJelly.map(row => [...row]);
            matches.forEach(m => {
                if (nextGrid[m.r][m.c] === 1) {
                    nextGrid[m.r][m.c] = 0;
                    jellyClearedSomething = true;
                }
            });
            return nextGrid;
        });
        if (jellyClearedSomething) {
            playSynthSound('match');
        }

        // C. Shatter mud obstacles (88) adjacent to match coordinates
        const adjs = new Set<string>();
        matches.forEach(m => {
            const dirs = [
                { r: m.r - 1, c: m.c },
                { r: m.r + 1, c: m.c },
                { r: m.r, c: m.c - 1 },
                { r: m.r, c: m.c + 1 }
            ];
            dirs.forEach(d => {
                if (d.r >= 0 && d.r < BOARD_SIZE && d.c >= 0 && d.c < BOARD_SIZE) {
                    adjs.add(`${d.r},${d.c}`);
                }
            });
        });

        // Mark matched indices to -1
        const cleanBoard = currBoard.map(row => [...row]);
        matches.forEach(m => {
            cleanBoard[m.r][m.c] = -1;
        });

        // Shatter neighbor muds
        let mudsShattered = 0;
        adjs.forEach(str => {
            const [r, c] = str.split(',').map(Number);
            if (cleanBoard[r][c] === 88) {
                cleanBoard[r][c] = -1;
                mudsShattered++;
                createPopParticles(r, c, 5); // gold splashes
            }
        });
        if (mudsShattered > 0) {
            setRapidsClearedCount(p => p + mudsShattered);
        }

        await new Promise(resolve => setTimeout(resolve, 400));

        // Shift down and refill gravity
        for (let c = 0; c < BOARD_SIZE; c++) {
            let emptySpaces = 0;
            for (let r = BOARD_SIZE - 1; r >= 0; r--) {
                if (cleanBoard[r][c] === -1) {
                    emptySpaces++;
                } else if (emptySpaces > 25) {
                    // safeguard
                } else if (emptySpaces > 0) {
                    cleanBoard[r + emptySpaces][c] = cleanBoard[r][c];
                    cleanBoard[r][c] = -1;
                }
            }
            for (let r = 0; r < emptySpaces; r++) {
                // Determine whether to roll a rare Gummi Dragon (index 99)
                const isDragMode = activeLevelConfig?.mode === 'ingredient' || activeLevelConfig?.mode === 'mixed';
                const needDragons = collectedIngredients < (activeLevelConfig?.ingredientsToDrop || 0);
                const hasDragOnBoard = cleanBoard.some(row => row.includes(99));
                const rollDrag = isDragMode && needDragons && !hasDragOnBoard && Math.random() < 0.15;

                if (rollDrag) {
                    cleanBoard[r][c] = 99; // Spawn Dragon
                } else {
                    cleanBoard[r][c] = Math.floor(Math.random() * FRUIT_TYPES.length);
                }
            }
        }

        // Post-shifter collection of Bottom-Row Gummi Dragons (99)
        let collectedDragonsThisCascade = 0;
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (cleanBoard[BOARD_SIZE - 1][c] === 99) {
                cleanBoard[BOARD_SIZE - 1][c] = -1;
                collectedDragonsThisCascade++;
                createPopParticles(BOARD_SIZE - 1, c, 2); // purple fireworks
            }
        }

        if (collectedDragonsThisCascade > 0) {
            setCollectedIngredients(prev => prev + collectedDragonsThisCascade);
            playSynthSound('win');

            // Slide column items down one more time to fill the collected dragon's vacancy
            for (let c = 0; c < BOARD_SIZE; c++) {
                let emptySpaces = 0;
                for (let r = BOARD_SIZE - 1; r >= 0; r--) {
                    if (cleanBoard[r][c] === -1) {
                        emptySpaces++;
                    } else if (emptySpaces > 0) {
                        cleanBoard[r + emptySpaces][c] = cleanBoard[r][c];
                        cleanBoard[r][c] = -1;
                    }
                }
                for (let r = 0; r < emptySpaces; r++) {
                    cleanBoard[r][c] = Math.floor(Math.random() * FRUIT_TYPES.length);
                }
            }
        }

        setBoard(cleanBoard);

        // Clear animations classes
        matches.forEach(m => {
            const tileEl = document.getElementById(`tile-${m.r}-${m.c}`);
            if (tileEl) tileEl.classList.remove('match-anim');
        });

        // Trigger cascade combos
        const cascadeMatches = findMatchPositions(cleanBoard);
        if (cascadeMatches.length > 0) {
            setTimeout(() => {
                processMatchedTiles(cleanBoard, cascadeMatches);
            }, 250);
        } else {
            setIsAnimating(false);
        }
    };

    // Interactive powerups
    const activateBooster = (type: 'bomb' | 'bolt') => {
        if (isPaused || modal) return;
        setActivePowerup(type);
    };

    const executePowerup = async (targetR: number, targetC: number) => {
        const boosterType = activePowerup;
        setActivePowerup(null);

        if (!boosterType) return;
        setIsAnimating(true);

        let targetCells: TilePos[] = [];
        if (boosterType === 'bomb') {
            playSynthSound('bomb');
            // Blast 3x3
            for (let r = targetR - 1; r <= targetR + 1; r++) {
                for (let c = targetC - 1; c <= targetC + 1; c++) {
                    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                        targetCells.push({ r, c });
                    }
                }
            }
        } else if (boosterType === 'bolt') {
            playSynthSound('bolt');
            // Blast row & column
            for (let i = 0; i < BOARD_SIZE; i++) {
                targetCells.push({ r: targetR, c: i });
                targetCells.push({ r: i, c: targetC });
            }
        }

        // Explode
        await processMatchedTiles(board, targetCells);
    };

    // Shuffle board manually
    const shuffleBoard = () => {
        if (isPaused || modal || isAnimating) return;
        playSynthSound('swap');

        const matrix: number[][] = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            matrix[r] = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                matrix[r][c] = Math.floor(Math.random() * FRUIT_TYPES.length);
            }
        }

        setBoard(matrix);

        // Check chain matches on random shuffle
        const chain = findMatchPositions(matrix);
        if (chain.length > 0) {
            setTimeout(() => {
                processMatchedTiles(matrix, chain);
            }, 400);
        }
    };

    const endActiveGame = (isWin: boolean) => {
        setIsPaused(true);
        playSynthSound(isWin ? 'win' : 'bomb');

        // Read hi score
        let nextBest = bestScore;
        if (score > bestScore) {
            nextBest = score;
            setBestScore(score);
        }

        let nextUnlocked = unlockedLevel;
        if (isWin && currentLevel >= unlockedLevel) {
            nextUnlocked = Math.min(100, currentLevel + 1);
            setUnlockedLevel(nextUnlocked);
        }

        // Win streak booster stack adjustment
        const nextStreak = isWin ? winStreak + 1 : 0;
        setWinStreak(nextStreak);

        // Add 12 Gold bars into Piggy Bank on level clears
        const nextPiggy = isWin ? Math.min(100, piggyBankCount + 12) : piggyBankCount;
        setPiggyBankCount(nextPiggy);

        // Slide 10: Deduct 1 life if lost, grant Coins if won
        let nextLives = lives;
        let nextLastLifeTime = lastLifeTime;
        if (!isWin) {
            nextLives = Math.max(0, lives - 1);
            setLives(nextLives);
            if (lives === 5 && nextLives < 5) {
                nextLastLifeTime = Date.now();
                setLastLifeTime(nextLastLifeTime);
            }
        }

        let nextCoins = coins;
        if (isWin) {
            nextCoins = coins + 50;
            setCoins(nextCoins);
        }

        saveProfileData(
            playerName, nextBest, nextUnlocked, theme, soundEnabled, nextStreak, nextPiggy, boosterInventory,
            vibrationEnabled, difficulty, bgmEnabled, nextCoins, goldBars, nextLives, nextLastLifeTime
        );
        setModal('game-over');
    };

    const togglePause = () => {
        if (modal === 'pause') {
            setModal(null);
            setIsPaused(false);
        } else {
            setIsPaused(true);
            setModal('pause');
        }
    };

    const handleRetry = () => {
        setModal(null);
        launchLevel(currentLevel);
    };

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        saveProfileData(playerName, bestScore, unlockedLevel, nextTheme, soundEnabled);
    };

    const toggleSoundSetting = () => {
        const nextSound = !soundEnabled;
        setSoundEnabled(nextSound);
        saveProfileData(playerName, bestScore, unlockedLevel, theme, nextSound);
    };

    const handleNextLevel = () => {
        setModal(null);
        launchLevel(currentLevel + 1);
    };

    const handleHomeRedirect = () => {
        setModal(null);
        setScreen('home');
    };

    const getFruitSVG = (typeIndex: number) => {
        const fruit = FRUIT_TYPES[typeIndex];
        switch(fruit) {
            case 'apple':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
                        <defs>
                            <radialGradient id={`appleGrad-${typeIndex}`} cx="35%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#ff7b7b" />
                                <stop offset="40%" stopColor="#ff1a1a" />
                                <stop offset="85%" stopColor="#b30000" />
                                <stop offset="100%" stopColor="#550000" />
                            </radialGradient>
                            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8ce99a" />
                                <stop offset="100%" stopColor="#2b8a3e" />
                            </linearGradient>
                        </defs>
                        <path d="M 50 20 C 55 5, 75 5, 70 25 C 60 25, 55 25, 50 20 Z" fill="url(#leafGrad)" />
                        <path d="M 50 30 Q 52 13 45 8" fill="none" stroke="#5c3e35" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M 50 31 C 30 27, 13 41, 13 64 C 13 84, 33 94, 50 89 C 67 94, 87 84, 87 64 C 87 41, 70 27, 50 31 Z" fill={`url(#appleGrad-${typeIndex})`} />
                        <ellipse cx="32" cy="45" rx="9" ry="5" transform="rotate(-25 32 45)" fill="#ffffff" opacity="0.65" />
                        <ellipse cx="30" cy="42" rx="3" ry="1.5" transform="rotate(-25 30 42)" fill="#ffffff" opacity="0.8" />
                    </svg>
                );
            case 'orange':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
                        <defs>
                            <radialGradient id={`orangeGrad-${typeIndex}`} cx="35%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#ffdf7a" />
                                <stop offset="50%" stopColor="#ff9f1a" />
                                <stop offset="85%" stopColor="#e65c00" />
                                <stop offset="100%" stopColor="#8a3700" />
                            </radialGradient>
                        </defs>
                        <circle cx="50" cy="53" r="38" fill={`url(#orangeGrad-${typeIndex})`} />
                        <circle cx="34" cy="40" r="1.2" fill="#7a3d00" opacity="0.3"/>
                        <circle cx="46" cy="35" r="1.2" fill="#7a3d00" opacity="0.3"/>
                        <circle cx="28" cy="55" r="1.2" fill="#7a3d00" opacity="0.3"/>
                        <circle cx="62" cy="38" r="1.2" fill="#7a3d00" opacity="0.3"/>
                        <circle cx="68" cy="52" r="1.2" fill="#7a3d00" opacity="0.3"/>
                        <circle cx="55" cy="67" r="1.2" fill="#7a3d00" opacity="0.3"/>
                        <path d="M 47 16 L 53 16 L 50 20 Z" fill="#2d5a27"/>
                        <circle cx="50" cy="16" r="2.5" fill="#5c3e35" />
                        <path d="M 23 41 A 28 28 0 0 1 45 20" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" opacity="0.45" />
                    </svg>
                );
            case 'grapes':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
                        <defs>
                            <radialGradient id={`grapeGrad-${typeIndex}`} cx="30%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#e2b4ff" />
                                <stop offset="35%" stopColor="#9d4edd" />
                                <stop offset="85%" stopColor="#5a189a" />
                                <stop offset="100%" stopColor="#1f003d" />
                            </radialGradient>
                        </defs>
                        <path d="M 50 15 Q 56 4 64 10 Q 66 18 50 21" fill="none" stroke="#5c3e35" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M 50 21 L 50 44" fill="none" stroke="#5c3e35" strokeWidth="4" />
                        <circle cx="38" cy="40" r="11" fill={`url(#grapeGrad-${typeIndex})`} />
                        <circle cx="62" cy="40" r="11" fill={`url(#grapeGrad-${typeIndex})`} />
                        <circle cx="50" cy="48" r="11" fill={`url(#grapeGrad-${typeIndex})`} />
                        <circle cx="32" cy="56" r="11" fill={`url(#grapeGrad-${typeIndex})`} />
                        <circle cx="68" cy="56" r="11" fill={`url(#grapeGrad-${typeIndex})`} />
                        <circle cx="50" cy="65" r="11" fill={`url(#grapeGrad-${typeIndex})`} />
                        <circle cx="41" cy="74" r="11" fill={`url(#grapeGrad-${typeIndex})`} />
                        <circle cx="59" cy="74" r="11" fill={`url(#grapeGrad-${typeIndex})`} />
                        <circle cx="50" cy="83" r="11" fill={`url(#grapeGrad-${typeIndex})`} />
                        <ellipse cx="46" cy="60" rx="2.5" ry="1.2" transform="rotate(-30 46 60)" fill="#fff" opacity="0.55" />
                        <ellipse cx="36" cy="69" rx="2.5" ry="1.2" transform="rotate(-30 36 69)" fill="#fff" opacity="0.55" />
                        <ellipse cx="46" cy="78" rx="2.5" ry="1.2" transform="rotate(-30 46 78)" fill="#fff" opacity="0.55" />
                    </svg>
                );
            case 'banana':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]">
                        <defs>
                            <linearGradient id={`bananaGrad-${typeIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fef08a" />
                                <stop offset="15%" stopColor="#facc15" />
                                <stop offset="55%" stopColor="#eab308" />
                                <stop offset="85%" stopColor="#ca8a04" />
                                <stop offset="100%" stopColor="#854d0e" />
                            </linearGradient>
                        </defs>
                        {/* Outlined deep gold-amber body */}
                        <path 
                            d="M 21 26 Q 36 86, 86 61 Q 53 71, 23 31 Z" 
                            fill={`url(#bananaGrad-${typeIndex})`} 
                            stroke="#3f1e00" 
                            strokeWidth="3.2" 
                            strokeLinejoin="round" 
                        />
                        {/* Shaded bottom side */}
                        <path 
                            d="M 23 31 Q 53 71, 86 61 Q 56 65, 24 35 Z" 
                            fill="#78350f" 
                            opacity="0.32" 
                        />
                        {/* Stem */}
                        <path 
                            d="M 21 26 L 19 19 Q 16 16, 13 19 L 23 31 Z" 
                            fill="#4d7c0f" 
                            stroke="#1a2e05" 
                            strokeWidth="2.5" 
                            strokeLinejoin="round" 
                        />
                        {/* Dark tip */}
                        <path 
                            d="M 86 61 Q 89 59, 90 56 L 84 55 Z" 
                            fill="#3c1d00" 
                            stroke="#1d0a00" 
                            strokeWidth="1.2" 
                        />
                        {/* Intense sheen highlight */}
                        <path 
                            d="M 29 39 Q 49 72, 76 62" 
                            fill="none" 
                            stroke="#ffffff" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            opacity="0.6" 
                        />
                    </svg>
                );
            case 'blueberry':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
                        <defs>
                            <radialGradient id={`berryGrad-${typeIndex}`} cx="35%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#93c5fd" />
                                <stop offset="35%" stopColor="#3b82f6" />
                                <stop offset="75%" stopColor="#1d4ed8" />
                                <stop offset="100%" stopColor="#0e1236" />
                            </radialGradient>
                        </defs>
                        <circle cx="50" cy="55" r="38" fill={`url(#berryGrad-${typeIndex})`} />
                        <g transform="translate(50, 22)">
                            <path d="M 0 -8 L 3 -2 L 9 -3 L 5 2 L 7 8 L 0 5 L -7 8 L -5 2 L -9 -3 L -3 -2 Z" fill="#152b6e" />
                            <circle cx="0" cy="0" r="3" fill="#0b1124" />
                        </g>
                        <ellipse cx="36" cy="42" rx="9" ry="4.5" transform="rotate(-20 36 42)" fill="#ffffff" opacity="0.45" />
                    </svg>
                );
            case 'kiwi':
                return (
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
                        <defs>
                            <radialGradient id={`kiwiFlesh-${typeIndex}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#f8fafc" />
                                <stop offset="35%" stopColor="#bbf7d0" />
                                <stop offset="70%" stopColor="#4ade80" />
                                <stop offset="90%" stopColor="#166534" />
                                <stop offset="100%" stopColor="#3b1b02" />
                            </radialGradient>
                        </defs>
                        <circle cx="50" cy="50" r="41" fill="#78350f" stroke="#451a03" strokeWidth="2" />
                        <circle cx="50" cy="50" r="37" fill={`url(#kiwiFlesh-${typeIndex})`} />
                        <ellipse cx="50" cy="50" rx="9.5" ry="7.5" fill="#ffffff" opacity="0.95" />
                        <g stroke="#ffffff" strokeWidth="1.2" opacity="0.4">
                            <line x1="50" y1="50" x2="50" y2="21" />
                            <line x1="50" y1="50" x2="50" y2="79" />
                            <line x1="50" y1="50" x2="21" y2="50" />
                            <line x1="50" y1="50" x2="79" y2="50" />
                            <line x1="50" y1="50" x2="30" y2="30" />
                            <line x1="50" y1="50" x2="70" y2="70" />
                            <line x1="50" y1="50" x2="30" y2="70" />
                            <line x1="50" y1="50" x2="70" y2="30" />
                        </g>
                        <g fill="#171717">
                            <circle cx="50" cy="37" r="1.3" />
                            <circle cx="50" cy="63" r="1.3" />
                            <circle cx="37" cy="50" r="1.3" />
                            <circle cx="63" cy="50" r="1.3" />
                            <circle cx="41" cy="41" r="1.3" />
                            <circle cx="59" cy="59" r="1.3" />
                            <circle cx="41" cy="59" r="1.3" />
                            <circle cx="59" cy="41" r="1.3" />
                            <circle cx="45" cy="38" r="1.2" />
                            <circle cx="55" cy="62" r="1.2" />
                            <circle cx="38" cy="45" r="1.2" />
                            <circle cx="62" cy="55" r="1.2" />
                        </g>
                        <path d="M 23 33 A 28 28 0 0 1 45 18" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
                    </svg>
                );
            default:
                if (typeIndex === 10) {
                    return (
                        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                            <span className="text-lg">🌈</span>
                        </div>
                    );
                }
                if (typeIndex === 11) {
                    return (
                        <div className="w-11 h-11 bg-gradient-to-br from-amber-400 via-rose-400 to-yellow-300 rounded-full flex items-center justify-center border-2 border-dashed border-white shadow-md">
                            <span className="text-lg">🌟</span>
                        </div>
                    );
                }
                if (typeIndex === 88) {
                    return (
                        <div className="w-11 h-11 bg-gradient-to-b from-stone-600 to-stone-850 rounded-xl flex items-center justify-center border-2 border-stone-500 shadow-md">
                            <span className="text-lg">🧱</span>
                        </div>
                    );
                }
                if (typeIndex === 99) {
                    return (
                        <div className="w-11 h-11 bg-gradient-to-b from-indigo-700 via-rose-600 to-violet-600 rounded-full flex items-center justify-center border-2 border-amber-400 shadow-lg animate-bounce">
                            <span className="text-xl">🐉</span>
                        </div>
                    );
                }
                return null;
        }
    };

    const strings = i18n[currentLang];

    return (
        <div ref={containerRef} className="fruit-world-bg transition-colors duration-500 w-full min-h-screen flex items-center justify-center p-4">
            
            <div id="app" className="relative w-full max-w-md min-h-[92vh] md:h-[95vh] md:max-h-[850px] flex flex-col justify-between p-4 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_22px_50px_rgba(0,0,0,0.15)] border-2 border-zinc-100 dark:border-zinc-800/80 overflow-y-auto md:overflow-hidden scroll-behavior-smooth transition-all duration-300">
                
                {/* Floating Coin Claim Toast */}
                {coinFeedback && (
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 through-amber-500 to-yellow-300 text-zinc-950 px-5 py-2.5 rounded-full font-black text-[13px] tracking-wide shadow-[0_10px_25px_rgba(245,158,11,0.4)] flex items-center gap-1.5 border-2 border-white animate-bounce pointer-events-none">
                        <span>🪙</span> <span>{coinFeedback}</span>
                    </div>
                )}

                {/* Floating Background Particles */}
                <div className="absolute inset-0 pointer-events-none opacity-25 z-0">
                    <div className="absolute top-10 left-10 text-3xl floating" style={{ animationDelay: '0s' }}>✨</div>
                    <div className="absolute top-1/3 right-12 text-2xl floating" style={{ animationDelay: '1.5s' }}>🌟</div>
                    <div className="absolute bottom-1/4 left-16 text-3xl floating" style={{ animationDelay: '0.8s' }}>✨</div>
                    <div className="absolute bottom-10 right-20 text-4xl floating" style={{ animationDelay: '2.2s' }}>🍒</div>
                </div>

                <div className="w-full h-full flex-grow flex flex-col justify-center items-center z-10 overflow-y-auto">
                    
                    {/* LOGIN SCREEN */}
                    {screen === 'login' && (
                        <div id="login-screen" className="w-full flex flex-col items-center gap-6 text-center bg-white/80 dark:bg-zinc-900/90 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-white/50 dark:border-zinc-800">
                            <div className="flex gap-2 justify-center text-5xl mb-1 filter drop-shadow-lg">
                                <span>🍎</span><span>🍊</span><span> Kiwi</span>
                            </div>
                            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 bg-clip-text text-transparent floating drop-shadow-sm">
                                Fruit Puzzle
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 font-semibold">{strings.login_title}</p>
                            
                            <div className="w-full text-left">
                                <label className="block text-gray-500 dark:text-gray-400 text-xs uppercase font-extrabold tracking-wider mb-2 ml-1">
                                    {strings.enter_name}
                                </label>
                                <input 
                                    type="text" 
                                    id="player-name-input" 
                                    className="w-full px-6 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-500 dark:border-zinc-700 dark:bg-zinc-800/80 outline-none text-lg font-bold text-gray-800 dark:text-white transition-all text-center shadow-inner" 
                                    placeholder="Type your name here..." 
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleProfileSubmit} 
                                className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-extrabold text-2xl rounded-2xl shadow-lg glow-pink hover:brightness-110 active:scale-95 transition-all"
                            >
                                {strings.start_game}
                            </button>
                            
                            <div className="flex gap-4 mt-2">
                                <button 
                                    onClick={() => setCurrentLang('en')} 
                                    className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${currentLang === 'en' ? 'bg-pink-500 text-white' : 'bg-pink-100 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 hover:bg-pink-200'}`}
                                >
                                    English
                                </button>
                                <button 
                                    onClick={() => setCurrentLang('hi')} 
                                    className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${currentLang === 'hi' ? 'bg-pink-500 text-white' : 'bg-pink-100 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 hover:bg-pink-200'}`}
                                >
                                    हिंदी
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ACTIONS / HOME SCREEN */}
                    {screen === 'home' && (
                        <div id="home-screen" className="w-full flex flex-col gap-5 bg-white/70 dark:bg-zinc-900/80 p-5 rounded-[2.5rem] backdrop-blur-xl shadow-2xl border border-white/50 dark:border-zinc-800/50 font-sans">
                            
                            {/* Coins & Lives Status Bar */}
                            <div className="bg-zinc-100/90 dark:bg-zinc-950 p-3 rounded-2xl flex items-center justify-between shadow-inner border border-zinc-200/50 dark:border-zinc-800/80">
                                <div className="flex gap-2 text-[11px] font-black tracking-tight text-gray-700 dark:text-zinc-200">
                                    <div className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                                        <span>❤️</span>
                                        <span className="text-zinc-900 dark:text-zinc-100">{lives}</span>
                                        {lives < 5 && <span className="text-[8px] font-bold text-rose-500 animate-pulse ml-0.5 bg-rose-50 dark:bg-rose-950/40 px-1 rounded">{getLifeCountdown()}</span>}
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                                        <span>🪙</span>
                                        <span className="text-zinc-900 dark:text-zinc-100">{coins}</span>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
                                        <span>🧈</span>
                                        <span className="text-amber-500">{goldBars}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Coins Collect / Free Coins Reward Box */}
                            <div className="relative bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 p-3.5 rounded-3xl shadow-md text-white border-2 border-yellow-200/40 overflow-hidden">
                                <div className="absolute inset-0 bg-white/10 opacity-30 z-0 animate-pulse"></div>
                                <div className="relative z-10 flex items-center justify-between gap-2 text-left">
                                    <div>
                                        <span className="text-[10px] tracking-wider font-extrabold uppercase text-yellow-105 block pb-0.5">
                                            {currentLang === 'hi' ? 'मुफ़्त उपहार' : 'FREE COINS GIFT'}
                                        </span>
                                        <span className="text-sm font-black uppercase text-white block">
                                            {currentLang === 'hi' ? 'सिक्का संग्रह क्षेत्र' : 'Coins Collect Area'}
                                        </span>
                                    </div>
                                    
                                    <button 
                                        onClick={handleCollectCoins}
                                        disabled={getCoinClaimCooldown() > 0}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow active:scale-95 transition-all ${
                                            getCoinClaimCooldown() > 0
                                                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border-transparent cursor-not-allowed'
                                                : 'bg-white text-amber-600 hover:scale-[1.03] cursor-pointer animate-bounce'
                                        }`}
                                    >
                                        {getCoinClaimCooldown() > 0 ? (
                                            `⏳ ${getCoinClaimCooldown()}s`
                                        ) : (
                                            currentLang === 'hi' ? 'सिक्का संग्रह 🪙' : 'COLLECT 🪙'
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-gray-400 dark:text-gray-500 text-xs uppercase font-extrabold tracking-widest">Welcome Back</p>
                                <h2 className="text-3xl font-black text-pink-600 dark:text-pink-400 mt-1">
                                    Hi, <span id="display-name" className="underline decoration-wavy decoration-yellow-400">{playerName}</span>! 👋
                                </h2>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-zinc-800/40 dark:to-zinc-800/60 p-4 rounded-3xl text-center border border-pink-100/50 dark:border-zinc-700/50 shadow-sm">
                                    <p className="text-xs font-bold uppercase text-pink-400">{strings.best_score}</p>
                                    <p id="best-score-val" className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{bestScore}</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-zinc-800/40 dark:to-zinc-800/60 p-4 rounded-3xl text-center border border-purple-100/50 dark:border-zinc-700/50 shadow-sm">
                                    <p className="text-xs font-bold uppercase text-purple-400">{strings.level_reached}</p>
                                    <p id="level-reached-val" className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{unlockedLevel}</p>
                                </div>
                            </div>

                            {/* Play Button */}
                            <button 
                                onClick={() => setScreen('level-selection')} 
                                className="w-full py-6 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white font-black text-3xl rounded-2xl shadow-xl glow-pink hover:scale-[1.02] active:scale-95 transition-all tracking-wider"
                            >
                                {strings.play}
                            </button>

                            {/* Nav menu */}
                            <div className="grid grid-cols-3 gap-2 w-full mt-2">
                                <button 
                                    onClick={() => setModal('settings')} 
                                    className="py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl text-xs font-black shadow-md tracking-wider uppercase transition-all"
                                >
                                    {strings.settings}
                                </button>
                                <button 
                                    onClick={() => setModal('tutorial')} 
                                    className="py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl text-xs font-black shadow-md tracking-wider uppercase transition-all"
                                >
                                    {strings.tutorial}
                                </button>
                                <button 
                                    onClick={handleExit} 
                                    className="py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-2xl text-xs font-black shadow-md tracking-wider uppercase transition-all"
                                >
                                    {strings.exit}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* LEVEL SELECTION SCREEN */}
                    {screen === 'level-selection' && (
                        <div id="level-selection" className="w-full flex flex-col h-full">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <button 
                                    onClick={() => setScreen('home')} 
                                    className="bg-white/90 dark:bg-zinc-800 p-2.5 px-4 rounded-2xl shadow-md text-gray-800 dark:text-white font-black text-xs active:scale-90 hover:scale-[1.03] border border-zinc-200 dark:border-zinc-700 transition-all font-sans"
                                >
                                    ⬅️ {currentLang === 'hi' ? 'पीछे' : 'Back'}
                                </button>
                                <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">{strings.select_level}</h2>
                                <div className="w-12"></div>
                            </div>

                            {/* Top Stats and quick Coins Collect row inside Level Selection page too */}
                            <div className="bg-zinc-100/90 dark:bg-zinc-950 p-2 rounded-2xl flex items-center justify-between shadow-inner border border-zinc-200/50 dark:border-zinc-800/85 mb-3 text-[10px] font-black font-sans">
                                <div className="flex gap-2 text-gray-700 dark:text-zinc-200">
                                    <div className="bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg">
                                        <span>❤️ {lives}</span>
                                        {lives < 5 && <span className="text-[7.5px] text-rose-500 ml-1 animate-pulse">{getLifeCountdown()}</span>}
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg">
                                        <span>🪙 {coins}</span>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg">
                                        <span>🧈 {goldBars}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleCollectCoins}
                                    disabled={getCoinClaimCooldown() > 0}
                                    className={`px-3 py-1 rounded-lg text-[8px] tracking-wide active:scale-95 transition-all ${
                                        getCoinClaimCooldown() > 0
                                            ? 'bg-zinc-250 dark:bg-zinc-800 text-zinc-500'
                                            : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-900 animate-bounce'
                                    }`}
                                >
                                    {getCoinClaimCooldown() > 0 ? `⏳ ${getCoinClaimCooldown()}s` : (currentLang === 'hi' ? 'मिलेगा 🪙' : 'COLLECT 🪙')}
                                </button>
                            </div>

                            {/* Paging tabs for 100 levels organized in beautiful tab boxes */}
                            <div className="grid grid-cols-4 gap-2 mb-4 px-1 text-[10px] font-black tracking-wide font-sans">
                                {[0, 1, 2, 3].map((tabIndex) => {
                                    const minL = tabIndex * 25 + 1;
                                    const maxL = (tabIndex + 1) * 25;
                                    const isActive = levelTab === tabIndex;
                                    const hasUnlockedInTab = unlockedLevel >= minL;
                                    
                                    return (
                                        <button
                                            key={tabIndex}
                                            onClick={() => setLevelTab(tabIndex)}
                                            className={`py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border text-center ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)] border-transparent scale-105'
                                                    : hasUnlockedInTab
                                                    ? 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750'
                                                    : 'bg-zinc-100 dark:bg-zinc-900/40 text-gray-400 dark:text-zinc-650 border-transparent opacity-60 cursor-not-allowed'
                                            }`}
                                        >
                                            {minL}-{maxL}
                                        </button>
                                    );
                                })}
                            </div>

                            <div id="levels-grid" className="grid grid-cols-4 gap-3 p-4 overflow-y-auto max-h-[64vh] min-h-[50vh] bg-zinc-100/90 dark:bg-zinc-950 rounded-[2rem] shadow-inner border-2 border-zinc-300 dark:border-zinc-800/90 font-sans">
                                {Array.from({ length: 25 }).map((_, idx) => {
                                    const lvlNum = levelTab * 25 + idx + 1;
                                    if (lvlNum > 100) return null;
                                    const isLocked = lvlNum > unlockedLevel;
                                    
                                    // Fun fruit theme decorations for level boxes
                                    const fruitIcons = ['🍒', '🍋', '🍇', '🍌', '🫐', '🥝', '🍎', '🍊', '🍓', '🍑', '🍍'];
                                    const signatureFruit = fruitIcons[lvlNum % fruitIcons.length];

                                    // Render gorgeous gradients based on level groups!
                                    let gradientStyle = "from-pink-500 to-rose-600 text-white font-sans";
                                    if (lvlNum > 25 && lvlNum <= 50) {
                                        gradientStyle = "from-amber-400 to-orange-500 text-white font-sans";
                                    } else if (lvlNum > 50 && lvlNum <= 75) {
                                        gradientStyle = "from-purple-500 to-indigo-600 text-white font-sans";
                                    } else if (lvlNum > 75) {
                                        gradientStyle = "from-emerald-400 to-teal-600 text-white font-sans";
                                    }

                                    return (
                                        <button 
                                            key={lvlNum}
                                            disabled={isLocked}
                                            onClick={() => launchLevel(lvlNum)}
                                            className={`relative w-full aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 font-black transition-all border shadow-sm ${
                                                isLocked 
                                                    ? 'bg-zinc-200/80 dark:bg-zinc-900 border-zinc-350 dark:border-zinc-800 text-zinc-500 dark:text-zinc-650 cursor-not-allowed opacity-70' 
                                                    : `bg-gradient-to-br ${gradientStyle} border-white/40 dark:border-zinc-700/60 active:scale-95 hover:scale-[1.08] hover:shadow-md`
                                            }`}
                                        >
                                            {/* Decoration fruit in top right */}
                                            {!isLocked && (
                                                <span className="absolute top-1 right-1 text-[10px] opacity-90 select-none">
                                                    {signatureFruit}
                                                </span>
                                            )}

                                            {/* Little top badge label */}
                                            <span className={`text-[8px] uppercase tracking-wider ${isLocked ? 'text-zinc-400' : 'text-white/80'}`}>
                                                LVL
                                            </span>

                                            {/* Level Number */}
                                            {isLocked ? (
                                                <span className="text-xs font-bold my-0.5 opacity-55">🔒</span>
                                            ) : (
                                                <span className="text-lg font-extrabold tracking-tight filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.2)]">
                                                    {lvlNum}
                                                </span>
                                            )}

                                            {/* Bottom play label */}
                                            <div className="text-[7px] uppercase tracking-wider">
                                                {isLocked ? (
                                                    <span className="font-semibold text-zinc-400">LOCK</span>
                                                ) : (
                                                    <span className="font-black px-1 rounded bg-white/25">PLAY</span>
                                                )}
                                            </div>
                                            
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ACTIVE GAME SCREEN */}
                    {screen === 'game-screen' && (
                        <div id="game-screen" className="w-full flex flex-col h-full">
                            
                            {/* Game Header Metrics summary */}
                            <div className="grid grid-cols-5 gap-1.5 p-2 bg-white/85 dark:bg-zinc-900/90 rounded-3xl mb-4 shadow-lg border border-white/40 dark:border-zinc-800/80 text-center">
                                <button 
                                    onClick={togglePause} 
                                    className="flex items-center justify-center p-2 bg-rose-100 hover:bg-rose-200 dark:bg-zinc-800 rounded-2xl text-lg transition-all shadow-sm shrink-0"
                                >
                                    ⏸️
                                </button>
                                
                                <div className="bg-pink-50 dark:bg-zinc-800/60 rounded-2xl flex flex-col items-center justify-center py-1 px-0.5">
                                    <span className="text-[8px] uppercase font-black text-pink-400">{strings.score}</span>
                                    <span id="current-score" className="text-sm md:text-base font-black text-rose-600 dark:text-rose-400 leading-none">{score}</span>
                                </div>

                                <div className="bg-purple-100/70 dark:bg-purple-950/30 rounded-2xl flex flex-col items-center justify-center py-1 px-0.5 border border-purple-200/50 dark:border-purple-800/40 animate-pulse">
                                    <span className="text-[8px] uppercase font-black text-purple-600 dark:text-purple-300">
                                        {currentLang === 'hi' ? 'चालें' : 'Moves'}
                                    </span>
                                    <span id="moves-display" className="text-base font-extrabold text-purple-700 dark:text-purple-400 leading-none">{movesRemaining}</span>
                                </div>
                                
                                <div className="bg-amber-50 dark:bg-zinc-800/60 rounded-2xl flex flex-col items-center justify-center py-1 px-0.5">
                                    <span className="text-[8px] uppercase font-black text-amber-500">{strings.time}</span>
                                    <span id="timer-display" className="text-sm md:text-base font-black text-amber-600 dark:text-amber-400 leading-none">{timeRemaining}s</span>
                                </div>
                                
                                <div className="bg-emerald-50 dark:bg-zinc-800/60 rounded-2xl flex flex-col items-center justify-center py-1 px-0.5">
                                    <span className="text-[8px] uppercase font-black text-emerald-500">{strings.target}</span>
                                    <span id="target-score" className="text-sm md:text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">{targetScore}</span>
                                </div>
                            </div>

                            {/* Dynamic Goal Objective banner */}
                            {activeLevelConfig && (
                                <div id="active-goal-banner" className="bg-purple-600/10 dark:bg-purple-900/20 px-3.5 py-2.5 rounded-2xl mb-3 border border-purple-500/20 flex flex-wrap items-center justify-between text-xs font-black shrink-0">
                                    <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 uppercase text-[10px] tracking-wide">
                                        <span>🎯 Level {activeLevelConfig.levelNum} Goal:</span>
                                        <span className="text-purple-600 dark:text-purple-400 font-extrabold">{activeLevelConfig.mode}</span>
                                    </div>
                                    
                                    {/* Detail indicators */}
                                    <div className="text-right text-zinc-750 dark:text-zinc-300">
                                        {activeLevelConfig.mode === 'score' && (
                                            <span>Score {score} / {targetScore}</span>
                                        )}
                                        {activeLevelConfig.mode === 'jelly' && (
                                            <div className="flex items-center gap-1 font-bold col-span-2">
                                                <span>🧊 Jellies left:</span>
                                                <span className="bg-pink-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse">
                                                    {jellyGrid.reduce((sum, r) => sum + r.reduce((s, val) => s + val, 0), 0)}
                                                </span>
                                            </div>
                                        )}
                                        {activeLevelConfig.mode === 'ingredient' && (
                                            <div className="flex items-center gap-1 font-bold col-span-2">
                                                <span>🐉 Dragons:</span>
                                                <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black">
                                                    {collectedIngredients} / {activeLevelConfig.ingredientsToDrop || 1}
                                                </span>
                                            </div>
                                        )}
                                        {activeLevelConfig.mode === 'order' && (
                                            <div className="flex gap-1.5 select-none text-[9px] font-black col-span-2">
                                                {activeCandyOrders.map((ord, idx) => (
                                                    <span key={idx} className="bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-emerald-400 text-zinc-855 dark:text-zinc-200 flex items-center gap-0.5">
                                                        {ord.fruitIndex === 0 ? '🍎' : ord.fruitIndex === 1 ? '🍊' : ord.fruitIndex === 2 ? '🍇' : ord.fruitIndex === 3 ? '🍌' : ord.fruitIndex === 4 ? '🫐' : '🥝'} {ord.current}/{ord.target}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {activeLevelConfig.mode === 'rainbow-rapids' && (
                                            <div className="flex items-center gap-1 font-bold col-span-2">
                                                <span>🧱 Mud Blockers:</span>
                                                <span className="bg-teal-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black">
                                                    {rapidsClearedCount} / {activeLevelConfig.rapidsCount || 4}
                                                </span>
                                            </div>
                                        )}
                                        {activeLevelConfig.mode === 'mixed' && (
                                            <div className="flex gap-2 text-[9px] font-black items-center col-span-2">
                                                <span>🧊 Jellies: {jellyGrid.reduce((sum, r) => sum + r.reduce((s, val) => s + val, 0), 0)}</span>
                                                <span>🐉 Dragons: {collectedIngredients}/{activeLevelConfig.ingredientsToDrop || 1}</span>
                                                {activeCandyOrders.length > 0 && (
                                                    <span>🛒 Orders: {activeCandyOrders.filter(o=>o.current >= o.target).length}/{activeCandyOrders.length}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Main Active interactive grid board */}
                            <div className="flex-grow flex items-center justify-center relative my-auto">
                                {(activePowerup || activeManualPowerup) && (
                                    <div id="powerup-alert" className="absolute top-2 px-4 py-2 bg-yellow-405 text-zinc-900 border border-yellow-200 font-extrabold rounded-full text-[10px] shadow-lg animate-bounce z-30 tracking-wider">
                                        {activePowerup === 'bomb' && "💣 SELECT TILE FOR CHERRY BOMB!"}
                                        {activePowerup === 'bolt' && "⚡ SELECT TILE FOR JUICE BOLT!"}
                                        {activeManualPowerup === 'hammer' && "🔨 TAP CELL TO BREAK IT WITH LOLLIPOP!"}
                                        {activeManualPowerup === 'hand' && (!handSelectedTile ? "🖐️ CHOOSE A CELL FOR FREE HAND SWITCH!" : "🖐️ SELECT A NEIGHBOR TILE TO SWAP!")}
                                    </div>
                                )}

                                {matchingSplash && (
                                    <div id="matching-splash-notif" className="absolute pointer-events-none z-40 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-black text-sm px-6 py-2.5 rounded-2xl shadow-[0_8px_20px_rgba(239,68,68,0.4)] border border-yellow-250 uppercase tracking-widest bomb-match-badge whitespace-nowrap">
                                        {matchingSplash}
                                    </div>
                                )}
                                
                                <div 
                                    id="game-board" 
                                    className={`game-grid-container relative w-full grid grid-cols-8 grid-rows-8 gap-1.5 bg-zinc-100/90 dark:bg-zinc-950/80 p-2.5 rounded-[2rem] shadow-[inset_0_4px_12px_rgba(0,0,0,0.08)] border-4 border-zinc-200/65 dark:border-zinc-800/90 touch-none select-none ${isHeavyShaking ? 'board-heavy-shake' : isShaking ? 'board-shake' : ''}`}
                                >
                                    {board.map((row, r) => 
                                        row.map((val, c) => {
                                            const isSel = selectedTile?.r === r && selectedTile?.c === c;
                                            const isHandSel = handSelectedTile?.r === r && handSelectedTile?.c === c;
                                            const hasJelly = jellyGrid[r] && jellyGrid[r][c] === 1;

                                            return (
                                                <div 
                                                    key={`${r}-${c}`}
                                                    id={`tile-${r}-${c}`}
                                                    onClick={() => handleTileClick(r, c)}
                                                    onMouseDown={(e) => handleDragStart(r, c, e.clientX, e.clientY)}
                                                    onMouseMove={(e) => { if (e.buttons === 1) handleDragMove(r, c, e.clientX, e.clientY); }}
                                                    onMouseUp={handleDragEnd}
                                                    onTouchStart={(e) => { const t = e.touches[0]; handleDragStart(r, c, t.clientX, t.clientY); }}
                                                    onTouchMove={(e) => { const t = e.touches[0]; handleDragMove(r, c, t.clientX, t.clientY); }}
                                                    onTouchEnd={handleDragEnd}
                                                    className={`fruit-tile w-full h-full flex items-center justify-center p-1 relative bg-white dark:bg-zinc-800 rounded-xl border transition-all duration-200 select-none cursor-grab active:cursor-grabbing touch-none ${
                                                        isSel ? 'selected ring-2 ring-pink-500 scale-105' : ''
                                                    } ${isHandSel ? 'ring-2 ring-purple-500 scale-105 animate-pulse bg-purple-50' : ''} ${
                                                        val === 88 ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                                                    } border-zinc-300/40 dark:border-zinc-700/60 shadow-[0_2.5px_4px_rgba(0,0,0,0.06)] hover:scale-[1.05]`}
                                                >
                                                    {/* Ice jelly frost gloss */}
                                                    {hasJelly && (
                                                        <div className="absolute inset-0 bg-pink-100/50 dark:bg-pink-900/30 border-2 border-pink-400 rounded-xl pointer-events-none z-15 flex items-center justify-center">
                                                            <div className="text-[10px] animate-pulse">🧊</div>
                                                        </div>
                                                    )}

                                                    {/* Outer fruit element */}
                                                    {val !== -1 ? (
                                                        <div key={`${r}-${c}-${val}`} className="w-full h-full fruit-enter flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] pointer-events-none">
                                                            {getFruitSVG(val)}
                                                        </div>
                                                    ) : (
                                                        <div className="w-1.5 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full opacity-40"></div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Bottom Panel controls: Lives and Boosters */}
                            <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-white/70 dark:bg-zinc-900/80 rounded-3xl shadow-lg border border-white/40 dark:border-zinc-800/50">
                                {/* Simulated static tracker */}
                                <div className="flex flex-col items-center justify-center bg-rose-50/50 dark:bg-zinc-800/40 p-2 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider mb-1">LIVES</span>
                                    <div className="flex gap-1 text-base text-rose-500 drop-shadow-sm">
                                        <span>❤️</span><span>❤️</span><span>❤️</span><span>❤️</span><span>❤️</span>
                                    </div>
                                </div>

                                {/* Active Boosters */}
                                <div className="flex justify-around items-center bg-purple-50/50 dark:bg-zinc-800/40 px-1 py-1 rounded-2xl w-full gap-1">
                                    {/* Bomb */}
                                    <button 
                                        id="booster-bomb" 
                                        onClick={() => activateBooster('bomb')} 
                                        className={`group flex flex-col items-center relative active:scale-95 transition-all ${activePowerup === 'bomb' ? 'scale-110 brightness-110 outline-2 outline-yellow-450 rounded-full' : ''}`}
                                    >
                                        <div className="w-9 h-9 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center text-base shadow-lg border-2 border-white transition-all transform group-hover:scale-105">🍒</div>
                                        <span className="text-[8px] mt-0.5 font-bold text-rose-600 dark:text-rose-400">BOMB</span>
                                        <div className="absolute -top-1 -right-1 bg-yellow-450 text-black font-black text-[7px] px-1 py-0.5 rounded-full border border-white shadow">1</div>
                                    </button>
                                    
                                    {/* juice bolt */}
                                    <button 
                                        id="booster-bolt" 
                                        onClick={() => activateBooster('bolt')} 
                                        className={`group flex flex-col items-center relative active:scale-95 transition-all ${activePowerup === 'bolt' ? 'scale-110 brightness-110 outline-2 outline-yellow-450 rounded-full' : ''}`}
                                    >
                                        <div className="w-9 h-9 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center text-base shadow-lg border-2 border-white transition-all transform group-hover:scale-105">⚡</div>
                                        <span className="text-[8px] mt-0.5 font-bold text-amber-600 dark:text-amber-400">BOLT</span>
                                        <div className="absolute -top-1 -right-1 bg-yellow-450 text-black font-black text-[7px] px-1 py-0.5 rounded-full border border-white shadow">1</div>
                                    </button>

                                    {/* Lollipop Hammer */}
                                    <button 
                                        onClick={() => {
                                            if (boosterInventory.hammer > 0) {
                                                setActiveManualPowerup(activeManualPowerup === 'hammer' ? null : 'hammer');
                                                setActivePowerup(null);
                                                setHandSelectedTile(null);
                                            } else {
                                                setMatchingSplash("⚠️ NEED HAMMER!");
                                                setTimeout(()=>setMatchingSplash(null), 1200);
                                            }
                                        }} 
                                        className={`group flex flex-col items-center relative active:scale-95 transition-all ${activeManualPowerup === 'hammer' ? 'scale-110 brightness-110 outline-2 outline-yellow-450 rounded-full' : ''}`}
                                    >
                                        <div className="w-9 h-9 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center text-base shadow-lg border-2 border-white transition-all transform group-hover:scale-105">🔨</div>
                                        <span className="text-[8px] mt-0.5 font-bold text-teal-600 dark:text-teal-400">HAMMER</span>
                                        <div className="absolute -top-1 -right-1 bg-yellow-450 text-black font-black text-[7px] px-1 py-0.5 rounded-full border border-white shadow">{boosterInventory.hammer}</div>
                                    </button>

                                    {/* Swapping Hand */}
                                    <button 
                                        onClick={() => {
                                            if (boosterInventory.hand > 0) {
                                                setActiveManualPowerup(activeManualPowerup === 'hand' ? null : 'hand');
                                                setActivePowerup(null);
                                                setHandSelectedTile(null);
                                            } else {
                                                setMatchingSplash("⚠️ NEED HAND!");
                                                setTimeout(()=>setMatchingSplash(null), 1200);
                                            }
                                        }} 
                                        className={`group flex flex-col items-center relative active:scale-95 transition-all ${activeManualPowerup === 'hand' ? 'scale-110 brightness-110 outline-2 outline-yellow-450 rounded-full' : ''}`}
                                    >
                                        <div className="w-9 h-9 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center text-base shadow-lg border-2 border-white transition-all transform group-hover:scale-105">🖐️</div>
                                        <span className="text-[8px] mt-0.5 font-bold text-orange-600 dark:text-orange-400">HAND</span>
                                        <div className="absolute -top-1 -right-1 bg-yellow-450 text-black font-black text-[7px] px-1 py-0.5 rounded-full border border-white shadow">{boosterInventory.hand}</div>
                                    </button>

                                    {/* Shuffle mixer */}
                                    <button 
                                        onClick={shuffleBoard} 
                                        className="group flex flex-col items-center active:scale-95 transition-all"
                                    >
                                        <div className="w-9 h-9 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center text-base shadow-lg border-2 border-white transition-all transform group-hover:scale-105">🔄</div>
                                        <span className="text-[8px] mt-0.5 font-bold text-indigo-600 dark:text-indigo-400">MIX</span>
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}

                </div>

                {/* MODALS OVERLAYS (PORTED FROM STATIC SYSTEM) */}
                {modal !== null && (
                    <div id="modal-overlay" className="absolute inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6 rounded-[2.5rem]">
                        
                        {/* GAME OVER MODAL */}
                        {modal === 'game-over' && (
                            <div id="game-over-modal" className="modal bg-white dark:bg-zinc-900 w-full max-w-xs p-8 rounded-[2.5rem] text-center shadow-2xl border border-white/30">
                                <h2 id="go-title" className={`text-4xl font-black mb-2 ${score >= targetScore ? 'text-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent' : 'text-red-500 bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent'}`}>
                                    {score >= targetScore 
                                        ? (currentLang === 'hi' ? "स्तर पूरा!" : "LEVEL CLEAR!") 
                                        : (currentLang === 'hi' ? "समय समाप्त!" : "TIME OUT!")
                                    }
                                </h2>
                                <p id="go-msg" className="text-gray-500 dark:text-gray-400 mb-6 font-semibold">
                                    {score >= targetScore 
                                        ? (currentLang === 'hi' ? "शानदार प्रदर्शन!" : "Excellent matching, fruit master!") 
                                        : (currentLang === 'hi' ? "दुबारा कोशिश करें!" : "So close! Give it another try.")
                                    }
                                </p>
                                
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between p-4 bg-rose-50 dark:bg-zinc-800 rounded-2xl border border-rose-100/50">
                                        <span className="font-extrabold text-rose-500">{strings.final_score}</span>
                                        <span id="go-score" className="font-black text-rose-600 dark:text-rose-400 text-lg">{score}</span>
                                    </div>
                                    <div className="flex justify-between p-4 bg-purple-50 dark:bg-zinc-800 rounded-2xl border border-purple-100/50">
                                        <span className="font-extrabold text-purple-500">{strings.best_score}</span>
                                        <span id="go-best" className="font-black text-purple-600 dark:text-purple-400 text-lg">{bestScore}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {score >= targetScore ? (
                                        <button 
                                            onClick={handleNextLevel} 
                                            className="py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg text-lg tracking-wider active:scale-95 transition-all"
                                        >
                                            {strings.next_level}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleRetry} 
                                            className="py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg text-lg tracking-wider active:scale-95 transition-all"
                                        >
                                            {currentLang === 'hi' ? "फिर से खेलें" : "RETRY"}
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleHomeRedirect} 
                                        className="py-4 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 font-extrabold rounded-2xl hover:bg-gray-200 transition-all"
                                    >
                                        {strings.home}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PAUSE MODAL */}
                        {modal === 'pause' && (
                            <div id="pause-modal" className="modal bg-white dark:bg-zinc-900 w-full max-w-xs p-8 rounded-[2.5rem] text-center shadow-2xl border border-white/30">
                                <h2 className="text-3xl font-black text-purple-505 mb-6 text-purple-500">{strings.paused}</h2>
                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={togglePause} 
                                        className="py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black rounded-2xl shadow-lg text-lg tracking-wider active:scale-95 transition-all"
                                    >
                                        {strings.resume}
                                    </button>
                                    <button 
                                        onClick={handleRetry} 
                                        className="py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg text-lg tracking-wider active:scale-95 transition-all"
                                    >
                                        {strings.restart}
                                    </button>
                                    <button 
                                        onClick={handleHomeRedirect} 
                                        className="py-4 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 font-extrabold rounded-2xl hover:bg-gray-200 transition-all"
                                    >
                                        {strings.home}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SETTINGS MODAL */}
                        {modal === 'settings' && (
                            <div id="settings-modal" className="modal bg-white dark:bg-zinc-900 w-full max-w-xs p-8 rounded-[2.5rem] shadow-2xl border border-white/30">
                                <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-6 text-center">{strings.settings}</h2>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="font-extrabold text-gray-700 dark:text-gray-300">{strings.dark_mode}</span>
                                        <button 
                                            id="theme-toggle" 
                                            onClick={toggleTheme} 
                                            className="w-14 h-8 bg-gray-300 dark:bg-pink-500 rounded-full relative transition-colors"
                                        >
                                            <div className="w-6 h-6 bg-white rounded-full absolute left-1 top-1 transition-transform dark:translate-x-6" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-extrabold text-gray-700 dark:text-gray-300">{strings.sound}</span>
                                        <button 
                                            onClick={toggleSoundSetting} 
                                            id="sound-btn" 
                                            className={`px-5 py-2 text-white rounded-xl text-sm font-black shadow-md ${soundEnabled ? 'bg-pink-500' : 'bg-gray-400'}`}
                                        >
                                            {soundEnabled ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-extrabold text-gray-700 dark:text-gray-300">
                                            {currentLang === 'hi' ? 'बैकग्राउंड म्यूजिक' : 'Background Music'}
                                        </span>
                                        <button 
                                            onClick={() => {
                                                const nextBgm = !bgmEnabled;
                                                setBgmEnabled(nextBgm);
                                                saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, boosterInventory, vibrationEnabled, difficulty, nextBgm);
                                            }} 
                                            id="bgm-btn" 
                                            className={`px-5 py-2 text-white rounded-xl text-sm font-black shadow-md ${bgmEnabled ? 'bg-pink-500' : 'bg-gray-400'}`}
                                        >
                                            {bgmEnabled ? 'ON' : 'OFF'}
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-extrabold text-gray-700 dark:text-gray-300">
                                            {currentLang === 'hi' ? 'वाइब्रेशन (Viberat)' : 'Vibration'}
                                        </span>
                                        <button 
                                            onClick={() => {
                                                const nextVibe = !vibrationEnabled;
                                                setVibrationEnabled(nextVibe);
                                                saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, boosterInventory, nextVibe, difficulty);
                                                if (nextVibe && typeof navigator !== 'undefined' && navigator.vibrate) {
                                                    navigator.vibrate(50);
                                                }
                                            }} 
                                            id="vibration-toggle" 
                                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${vibrationEnabled ? 'bg-pink-500' : 'bg-gray-300 dark:bg-zinc-700'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 ${vibrationEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                        <span className="font-extrabold text-sm text-gray-700 dark:text-gray-300 text-center">
                                            {currentLang === 'hi' ? 'कठिनाई (Difficulty)' : 'Difficulty Level'}
                                        </span>
                                        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200/40 dark:border-zinc-700/50">
                                            {(['easy', 'medium', 'hard'] as const).map((mode) => {
                                                const isActive = difficulty === mode;
                                                const labels = {
                                                    easy: currentLang === 'hi' ? 'आसान' : 'Easy',
                                                    medium: currentLang === 'hi' ? 'सामान्य' : 'Medium',
                                                    hard: currentLang === 'hi' ? 'कठिन' : 'Hard'
                                                };
                                                let activeBgStyle = "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black shadow-sm scale-102";
                                                if (mode === 'easy' && isActive) {
                                                    activeBgStyle = "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-sm scale-102";
                                                } else if (mode === 'hard' && isActive) {
                                                    activeBgStyle = "bg-gradient-to-r from-purple-600 to-rose-605 text-white font-black shadow-sm scale-102";
                                                }

                                                return (
                                                    <button
                                                        key={mode}
                                                        onClick={() => {
                                                            setDifficulty(mode);
                                                            saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, piggyBankCount, boosterInventory, vibrationEnabled, mode);
                                                            if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
                                                                navigator.vibrate(35);
                                                            }
                                                        }}
                                                        className={`py-2 text-[10px] font-black rounded-xl uppercase transition-all duration-200 outline-none select-none text-center ${
                                                            isActive 
                                                                ? activeBgStyle
                                                                : 'bg-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                                                        }`}
                                                    >
                                                        {labels[mode]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setModal(null)} 
                                    className="mt-6 w-full py-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-2xl font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider transition-all"
                                >
                                    {strings.close}
                                </button>
                            </div>
                        )}

                        {/* TUTORIAL MODAL */}
                        {modal === 'tutorial' && (
                            <div id="tutorial-modal" className="modal bg-white dark:bg-zinc-900 w-full max-w-sm p-6 rounded-[2.5rem] shadow-2xl max-h-[85vh] overflow-y-auto border border-white/30">
                                <h2 className="text-2xl font-black text-purple-600 dark:text-pink-500 mb-4 text-center tracking-tight flex items-center justify-center gap-2">
                                    🎮 {strings.tutorial}
                                </h2>
                                
                                <div className="space-y-4 text-xs text-gray-705 dark:text-gray-300">
                                    {currentLang === 'hi' ? (
                                        <>
                                            <div className="bg-purple-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-purple-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-purple-600 dark:text-pink-400 mb-1 text-[13px]">1. फलों को मिलाएं (Match Jewels)</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">पास के किन्हीं दो फलों को आपस में बदलें (Swap)। एक जैसी 3 या अधिक फलों की लाइन बनने पर वे नष्ट हो जाएंगी और आपको पॉइंट्स मिलेंगे।</p>
                                            </div>

                                            <div className="bg-pink-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-pink-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-pink-500 dark:text-pink-400 mb-1 text-[13px]">2. जूस और बम फल (Special Candies)</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">यदि आप 4 फल मिलाते हैं, तो एक विशेष फल बनता है। इसे स्वाइप करने पर बोर्ड की पूरी रो (Row) या कॉलम (Column) ब्लास्ट हो जाती है।</p>
                                            </div>

                                            <div className="bg-blue-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-blue-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-blue-500 dark:text-blue-400 mb-1 text-[13px]">3. जादुई बूस्टर्स का उपयोग करें (Use Boosters)</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">नीचे दिए गए टूल जैसे: हैमर टूल 🔨 से किसी भी फल को सीधे फोड़ें, या हैंड टूल ✋ से किन्हीं दो फलों की जगह बदलें बिना मैच किये!</p>
                                            </div>

                                            <div className="bg-amber-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-amber-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-amber-500 dark:text-amber-400 mb-1 text-[13px]">4. लेवल पूरा करने की शर्तें (Complete Goals)</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">हर लेवल का एक लक्ष्य (Target Score) होता है। चालें (Moves) या समय खत्म होने से पहले लक्ष्य पूरा करें।</p>
                                            </div>

                                            <div className="bg-emerald-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-emerald-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-emerald-500 dark:text-emerald-400 mb-1 text-[13px]">5. कठिनाई स्तर (Difficulty Settings)</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">गियर बटन पर क्लिक कर सेटिंग्स में जाएं, जहाँ आप Easy (आसान), Medium (सामान्य) या Hard (कठिन) गेम खेल सकते हैं!</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-purple-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-purple-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-purple-600 dark:text-pink-400 mb-1 text-[13px]">1. Swap & Match Fruits</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">Swipe or tap adjacent fruits to switch places. Match 3 or more fruits of the same type in a row or column to clear them and score points.</p>
                                            </div>

                                            <div className="bg-pink-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-pink-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-pink-500 dark:text-pink-400 mb-1 text-[13px]">2. Create Special Candies</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">Combine 4 or more matching fruits to synthesize powerful Juice/Bomb fruits that can vaporize whole lines instantly!</p>
                                            </div>

                                            <div className="bg-blue-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-blue-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-blue-500 dark:text-blue-400 mb-1 text-[13px]">3. Exploit Super Boosters</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">Run into tough boards? Use our Hammer 🔨 tool to smash any tiles, or Hands ✋ tool to swap two fruits without needing matches!</p>
                                            </div>

                                            <div className="bg-amber-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-amber-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-amber-500 dark:text-amber-400 mb-1 text-[13px]">4. Reach Goals in Time</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">Different levels feature targets like high scores, jelly cleaning, and collecting distinct ingredients before running out of moves/time.</p>
                                            </div>

                                            <div className="bg-emerald-50/50 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-emerald-100/50 dark:border-zinc-700/50">
                                                <h3 className="font-black text-emerald-500 dark:text-emerald-400 mb-1 text-[13px]">5. Difficulty Level</h3>
                                                <p className="leading-relaxed font-semibold text-gray-600 dark:text-zinc-300">Navigate to settings, select Easy, Medium, or Hard modes to adjust speed and target score multipliers on the fly!</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button 
                                    onClick={() => setModal(null)} 
                                    className="mt-6 w-full py-4.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white rounded-2xl font-black shadow-lg text-sm uppercase tracking-wider transition-all"
                                >
                                    {strings.got_it}
                                </button>
                            </div>
                        )}

                    </div>
                )}

                {/* DAILY BONUS MODAL OVERLAY */}
                {showDailyBonus && (
                    <DailyRewardsAndSpin 
                        onClose={() => setShowDailyBonus(false)}
                        inventory={boosterInventory}
                        onAddBoosters={handleAddBoosters}
                        soundEnabled={soundEnabled}
                        playSynthSound={playSynthSound}
                        onAddCoins={handleAddCoins}
                        onAddGoldBars={handleAddGoldBars}
                        onAddLives={handleAddLives}
                    />
                )}

                {/* LEADERBOARD & EVENTS OVERLAY */}
                {showRankings && (
                    <LeaderboardAndTournament 
                        onClose={() => setShowRankings(false)}
                        playerName={playerName}
                        bestScore={bestScore}
                        unlockedLevel={unlockedLevel}
                        winStreak={winStreak}
                        piggyBankCount={piggyBankCount}
                        onResetPiggyBank={() => {
                            setPiggyBankCount(0);
                            saveProfileData(playerName, bestScore, unlockedLevel, theme, soundEnabled, winStreak, 0, boosterInventory, vibrationEnabled, difficulty, bgmEnabled, coins, goldBars, lives, lastLifeTime);
                        }}
                        onAddBoosters={handleAddBoosters}
                        playSynthSound={playSynthSound}
                        onAddCoins={handleAddCoins}
                        onAddGoldBars={handleAddGoldBars}
                        onAddLives={handleAddLives}
                    />
                )}

                {/* HELP DESK SUPPORT CHAT OVERLAY */}
                {showSupport && (
                    <SupportChat 
                        playerName={playerName}
                        onClose={() => setShowSupport(false)}
                        soundEnabled={soundEnabled}
                        playSynthSound={playSynthSound}
                    />
                )}

                {/* LEVEL LAUNCH PRE-SETUP MODAL */}
                {showPreSetup && pendingLevelNum !== undefined && (
                    <LevelPreSetupModal 
                        levelConfig={getLevelConfig(pendingLevelNum)}
                        inventory={boosterInventory}
                        onClose={() => setShowPreSetup(false)}
                        onStartGame={(boosters) => startGameWithBoosters(pendingLevelNum, boosters)}
                    />
                )}

            </div>
        </div>
    );
}
