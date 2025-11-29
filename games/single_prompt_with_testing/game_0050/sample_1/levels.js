import { COLORS } from './globals.js';

export const LEVELS = [
    // Easy Levels
    {
        id: 0,
        name: "Training Ground",
        difficulty: "Easy",
        worldWidth: 800,
        worldHeight: 600,
        winCondition: 70,
        bots: [
            {id: 2, x: 600, y: 150, color: COLORS.ENEMY_1, territoryColor: COLORS.ENEMY_1_TERRITORY}
        ]
    },
    {
        id: 1,
        name: "First Battle",
        difficulty: "Easy",
        worldWidth: 900,
        worldHeight: 650,
        winCondition: 75,
        bots: [
            {id: 2, x: 700, y: 150, color: COLORS.ENEMY_1, territoryColor: COLORS.ENEMY_1_TERRITORY},
            {id: 3, x: 200, y: 500, color: COLORS.ENEMY_2, territoryColor: COLORS.ENEMY_2_TERRITORY}
        ]
    },
    
    // Medium Levels
    {
        id: 2,
        name: "Three Fronts",
        difficulty: "Medium",
        worldWidth: 1100,
        worldHeight: 750,
        winCondition: 80,
        bots: [
            {id: 2, x: 900, y: 150, color: COLORS.ENEMY_1, territoryColor: COLORS.ENEMY_1_TERRITORY},
            {id: 3, x: 200, y: 600, color: COLORS.ENEMY_2, territoryColor: COLORS.ENEMY_2_TERRITORY},
            {id: 4, x: 900, y: 600, color: COLORS.ENEMY_3, territoryColor: COLORS.ENEMY_3_TERRITORY}
        ]
    },
    {
        id: 3,
        name: "Contested Territory",
        difficulty: "Medium",
        worldWidth: 1200,
        worldHeight: 800,
        winCondition: 85,
        bots: [
            {id: 2, x: 1000, y: 150, color: COLORS.ENEMY_1, territoryColor: COLORS.ENEMY_1_TERRITORY},
            {id: 3, x: 200, y: 650, color: COLORS.ENEMY_2, territoryColor: COLORS.ENEMY_2_TERRITORY},
            {id: 4, x: 1000, y: 650, color: COLORS.ENEMY_3, territoryColor: COLORS.ENEMY_3_TERRITORY}
        ]
    },
    
    // Hard Levels
    {
        id: 4,
        name: "The Gauntlet",
        difficulty: "Hard",
        worldWidth: 1400,
        worldHeight: 900,
        winCondition: 85,
        bots: [
            {id: 2, x: 1200, y: 150, color: COLORS.ENEMY_1, territoryColor: COLORS.ENEMY_1_TERRITORY},
            {id: 3, x: 200, y: 750, color: COLORS.ENEMY_2, territoryColor: COLORS.ENEMY_2_TERRITORY},
            {id: 4, x: 1200, y: 750, color: COLORS.ENEMY_3, territoryColor: COLORS.ENEMY_3_TERRITORY},
            {id: 5, x: 700, y: 150, color: COLORS.ENEMY_4, territoryColor: COLORS.ENEMY_4_TERRITORY}
        ]
    },
    {
        id: 5,
        name: "Ultimate Challenge",
        difficulty: "Hard",
        worldWidth: 1600,
        worldHeight: 1000,
        winCondition: 90,
        bots: [
            {id: 2, x: 1400, y: 150, color: COLORS.ENEMY_1, territoryColor: COLORS.ENEMY_1_TERRITORY},
            {id: 3, x: 200, y: 850, color: COLORS.ENEMY_2, territoryColor: COLORS.ENEMY_2_TERRITORY},
            {id: 4, x: 1400, y: 850, color: COLORS.ENEMY_3, territoryColor: COLORS.ENEMY_3_TERRITORY},
            {id: 5, x: 800, y: 150, color: COLORS.ENEMY_4, territoryColor: COLORS.ENEMY_4_TERRITORY},
            {id: 6, x: 800, y: 850, color: COLORS.ENEMY_5, territoryColor: COLORS.ENEMY_5_TERRITORY}
        ]
    }
];