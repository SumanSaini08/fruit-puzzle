export type LevelMode = 'score' | 'jelly' | 'ingredient' | 'order' | 'rainbow-rapids' | 'mixed';

export interface LevelConfig {
    levelNum: number;
    mode: LevelMode;
    targetScore: number;
    timeLimit: number;
    jellyCount?: number;
    ingredientsToDrop?: number;
    candyOrders?: { fruitIndex: number; target: number; current: number }[];
    rapidsCount?: number; // Number of water path blockers to clear
    description: string;
}

export interface BoosterInventory {
    bomb: number;
    bolt: number;
    colorBomb: number;
    stripedWrapped: number;
    extraMoves: number;
    luckyCandy: number;
    hammer: number;
    hand: number;
}

export interface FriendMessage {
    id: string;
    sender: string;
    avatar: string;
    text: string;
    time: string;
    hasGift?: boolean;
}

export interface TournamentPlayer {
    rank: number;
    name: string;
    score: number;
    avatar: string;
    isUser?: boolean;
}

export interface LeaderboardEntry {
    rank: number;
    name: string;
    level: number;
    score: number;
    avatar: string;
    isUser?: boolean;
}
