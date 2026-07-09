import { LevelConfig, LevelMode, FriendMessage, TournamentPlayer, LeaderboardEntry } from './types';

// Deterministic levels 1 to 100 generator
export function getLevelConfig(levelNum: number): LevelConfig {
    const fruitIndex = levelNum % 6; // deterministic fruit selection
    const secondFruit = (levelNum + 2) % 6;

    let mode: LevelMode = 'score';
    let targetScore = levelNum * 350 + 200;
    let timeLimit = Math.min(180, 65 + (levelNum * 1.5));
    let jellyCount = 0;
    let ingredientsToDrop = 0;
    let candyOrders: { fruitIndex: number; target: number; current: number }[] | undefined = undefined;
    let rapidsCount = 0;
    let description = "Match and crush fruits to reach target score!";

    // Divide 100 levels sequentially or dynamically through level mode configurations
    if (levelNum === 1) {
        mode = 'score';
        targetScore = 300;
        timeLimit = 75;
        description = "Crush fruits to satisfy target score!";
    } else if (levelNum % 5 === 2) {
        // Jelly Levels
        mode = 'jelly';
        targetScore = levelNum * 300 + 400;
        // Total jelly tiles on board is dynamically correlated
        jellyCount = Math.min(32, 8 + (levelNum % 6) * 4);
        description = "Clear all frosted Jelly boxes by matching fruits over them!";
    } else if (levelNum % 5 === 3) {
        // Ingredient Drops (Gummi Dragon Levels)
        mode = 'ingredient';
        ingredientsToDrop = Math.min(5, 1 + Math.floor(levelNum / 20));
        targetScore = levelNum * 250 + 300;
        description = "Bring the legendary Gummi Dragons (🐉) down to the bottom row!";
    } else if (levelNum % 5 === 4) {
        // Candy Order Levels
        mode = 'order';
        candyOrders = [
            { fruitIndex, target: Math.min(45, 10 + (levelNum % 8) * 4), current: 0 },
            { fruitIndex: secondFruit, target: Math.min(40, 8 + (levelNum % 6) * 4), current: 0 }
        ];
        targetScore = levelNum * 200 + 300;
        description = `Satisfy the candy store orders by matching specific fruits!`;
    } else if (levelNum % 5 === 0) {
        // Rainbow Rapids (Water Path)
        mode = 'rainbow-rapids';
        rapidsCount = Math.min(10, 3 + (levelNum % 4) * 2);
        targetScore = levelNum * 250 + 400;
        description = "Clear the rainbow river path blocks (🧱) to open the Rainbow Rapids!";
    } else {
        // Mixed Mode (e.g., clearance + drops)
        mode = 'mixed';
        jellyCount = Math.min(14, 4 + (levelNum % 4) * 3);
        ingredientsToDrop = 1;
        candyOrders = [
            { fruitIndex: 3, target: Math.min(15, 6 + (levelNum % 4) * 2), current: 0 }
        ];
        targetScore = levelNum * 400 + 500;
        description = "Mixed Challenge! Clear Jellies + drop Gummi Dragons together!";
    }

    return {
        levelNum,
        mode,
        targetScore: Math.round(targetScore),
        timeLimit: Math.round(timeLimit),
        jellyCount,
        ingredientsToDrop,
        candyOrders,
        rapidsCount,
        description
    };
}

export const SUPPORT_FAQS = [
    {
        q: "How to clear frosted Jelly blocks?",
        a: "Simply swap and match fruits that are placed inside the frosted cell. Each match will shatter the frosting. Special powerups clear multiple jellies instantly!"
    },
    {
        q: "What do Gummi Dragons (🐉) do?",
        a: "These are special heavy ingredients! Swap them side-to-side to clear fruit paths and let them slip downwards. Once they hit the bottom row (r=7), they fly up into your inventory!"
    },
    {
        q: "What is Rainbow Rapids mode?",
        a: "In Rainbow Rapids, muddy land-blockers (🧱) are blocking the magical water. Match tiles next to these blockers to clean the path and let the beautiful rainbow river flow!"
    },
    {
        q: "How do pre-level boosters help?",
        a: "Activating boosters before starting guarantees that a Color Bomb (🍒/🍋) or Striped candies will be placed on your grid right from the first move!"
    },
    {
        q: "How do I win manual Lollipop Hammers?",
        a: "You can win them for free with the Daily Spin Wheel or by completing level milestones and securing consecutive Win Streaks!"
    }
];

export const INITIAL_FRIEND_MESSAGES: FriendMessage[] = [
    {
        id: "msg1",
        sender: "Pinky Sweet",
        avatar: "🐰",
        text: "Wow! You are playing exceptionally well! Sending you 1 Free Life ❤️",
        time: "Just now",
        hasGift: true
    },
    {
        id: "msg2",
        sender: "Dragon Cadet",
        avatar: "🐉",
        text: "My dragons need to reach the bottom! Thank you for clearing the path in level 13!",
        time: "10 mins ago"
    },
    {
        id: "msg3",
        sender: "Chef Gummy",
        avatar: "🐼",
        text: "Did you spin the fortune wheel today? I got a Lollipop Hammer!",
        time: "1 hour ago"
    },
    {
        id: "msg4",
        sender: "Candy King",
        avatar: "👑",
        text: "Let us climb the Leaderboard together! I will match your score tonight.",
        time: "Yesterday"
    }
];

export const SIMULATED_TOURNAMENT: TournamentPlayer[] = [
    { rank: 1, name: "Soda Pop Star 🥤", score: 8540, avatar: "🦊" },
    { rank: 2, name: "Cookie Monster 🍪", score: 7920, avatar: "🐻" },
    { rank: 3, name: "Muskan", score: 0, avatar: "🍎", isUser: true }, // will bind dynamically
    { rank: 4, name: "Jelly Squire 🍮", score: 6200, avatar: "🐸" },
    { rank: 5, name: "Marshmallow Kid ☁️", score: 4800, avatar: "🐣" }
];

export const SIMULATED_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, name: "Gummi Emperor 👑", level: 98, score: 395000, avatar: "🦁" },
    { rank: 2, name: "Choco Champion 🍫", level: 84, score: 320000, avatar: "🐯" },
    { rank: 3, name: "Sweet Toof 🍬", level: 67, score: 260400, avatar: "😺" },
    { rank: 4, name: "Fruit Master", level: 1, score: 0, avatar: "🍎", isUser: true }, // dynamic mapping
    { rank: 5, name: "Banana Splitter 🍌", level: 41, score: 142000, avatar: "🐒" },
    { rank: 6, name: "Licorice Lord 🖤", level: 29, score: 98500, avatar: "🦉" },
    { rank: 7, name: "Sour Sprinkles ✨", level: 18, score: 55400, avatar: "🐹" }
];
