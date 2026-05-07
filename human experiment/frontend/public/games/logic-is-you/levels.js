import { TYPES } from './types.js';

// Level Data Format:
// width, height (should match grid)
// List of entities: { x, y, type }

export const LEVELS = [
    {
        id: 0,
        name: "01 - START",
        data: [
            // Rule: BABA IS YOU
            {x: 4, y: 3, type: TYPES.TEXT_BABA},
            {x: 5, y: 3, type: TYPES.TEXT_IS},
            {x: 6, y: 3, type: TYPES.TEXT_YOU},
            
            // Rule: FLAG IS ... WIN (Broken)
            {x: 14, y: 3, type: TYPES.TEXT_FLAG},
            {x: 15, y: 3, type: TYPES.TEXT_IS},
            // WIN is misaligned, player must push it
            {x: 16, y: 6, type: TYPES.TEXT_WIN},
            
            // Objects
            {x: 6, y: 8, type: TYPES.BABA},
            {x: 18, y: 8, type: TYPES.FLAG},
            
            // Decorative Walls
            {x: 10, y: 6, type: TYPES.WALL},
            {x: 10, y: 7, type: TYPES.WALL},
            {x: 10, y: 8, type: TYPES.WALL},
            {x: 10, y: 9, type: TYPES.WALL},
            {x: 10, y: 10, type: TYPES.WALL},
            
            // Rule: WALL IS STOP
            {x: 10, y: 12, type: TYPES.TEXT_WALL},
            {x: 11, y: 12, type: TYPES.TEXT_IS},
            {x: 12, y: 12, type: TYPES.TEXT_STOP}
        ]
    },
    {
        id: 1,
        name: "02 - BROKEN",
        data: [
            // BABA IS YOU
            {x: 3, y: 2, type: TYPES.TEXT_BABA},
            {x: 4, y: 2, type: TYPES.TEXT_IS},
            {x: 5, y: 2, type: TYPES.TEXT_YOU},
            
            // FLAG IS WIN
            {x: 16, y: 2, type: TYPES.TEXT_FLAG},
            {x: 17, y: 2, type: TYPES.TEXT_IS},
            {x: 18, y: 2, type: TYPES.TEXT_WIN},
            
            // WALL IS STOP (Blocking the path)
            {x: 9, y: 5, type: TYPES.TEXT_WALL},
            {x: 10, y: 5, type: TYPES.TEXT_IS},
            {x: 11, y: 5, type: TYPES.TEXT_STOP}, 
            
            // Objects
            {x: 5, y: 8, type: TYPES.BABA},
            {x: 20, y: 8, type: TYPES.FLAG},
            
            // Wall Barrier
            {x: 14, y: 0, type: TYPES.WALL},
            {x: 14, y: 1, type: TYPES.WALL},
            {x: 14, y: 2, type: TYPES.WALL},
            {x: 14, y: 3, type: TYPES.WALL},
            {x: 14, y: 4, type: TYPES.WALL},
            {x: 14, y: 5, type: TYPES.WALL},
            {x: 14, y: 6, type: TYPES.WALL},
            {x: 14, y: 7, type: TYPES.WALL},
            {x: 14, y: 8, type: TYPES.WALL},
            {x: 14, y: 9, type: TYPES.WALL},
            {x: 14, y: 10, type: TYPES.WALL},
            {x: 14, y: 11, type: TYPES.WALL},
            {x: 14, y: 12, type: TYPES.WALL},
            {x: 14, y: 13, type: TYPES.WALL},
            {x: 14, y: 14, type: TYPES.WALL},
            {x: 14, y: 15, type: TYPES.WALL}
        ]
    },
    {
        id: 2,
        name: "03 - CHANGE",
        data: [
            // Protected Rules Area (Top Left)
            // Walls enclosing rules
            {x: 6, y: 0, type: TYPES.WALL}, {x: 6, y: 1, type: TYPES.WALL}, {x: 6, y: 2, type: TYPES.WALL}, {x: 6, y: 3, type: TYPES.WALL},
            {x: 0, y: 3, type: TYPES.WALL}, {x: 1, y: 3, type: TYPES.WALL}, {x: 2, y: 3, type: TYPES.WALL}, {x: 3, y: 3, type: TYPES.WALL}, {x: 4, y: 3, type: TYPES.WALL}, {x: 5, y: 3, type: TYPES.WALL},

            // Safe Rules
            {x: 1, y: 0, type: TYPES.TEXT_BABA}, {x: 2, y: 0, type: TYPES.TEXT_IS}, {x: 3, y: 0, type: TYPES.TEXT_YOU},
            {x: 1, y: 1, type: TYPES.TEXT_FLAG}, {x: 2, y: 1, type: TYPES.TEXT_IS}, {x: 3, y: 1, type: TYPES.TEXT_WIN},
            {x: 1, y: 2, type: TYPES.TEXT_WALL}, {x: 2, y: 2, type: TYPES.TEXT_IS}, {x: 3, y: 2, type: TYPES.TEXT_STOP},

            // Play Area
            {x: 4, y: 8, type: TYPES.BABA},
            
            // Rock (Needs to become Flag)
            {x: 10, y: 8, type: TYPES.ROCK},
            
            // Active Rule: ROCK IS PUSH
            {x: 10, y: 12, type: TYPES.TEXT_ROCK},
            {x: 11, y: 12, type: TYPES.TEXT_IS},
            {x: 12, y: 12, type: TYPES.TEXT_PUSH},
            
            // Loose Text: FLAG
            {x: 10, y: 14, type: TYPES.TEXT_FLAG},
            
            // Decorative Walls for Room
            {x: 20, y: 5, type: TYPES.WALL}, {x: 20, y: 6, type: TYPES.WALL}, {x: 20, y: 7, type: TYPES.WALL}
        ]
    },
    {
        id: 3,
        name: "04 - BRIDGE",
        data: [
            // Protected Rules
            {x: 7, y: 0, type: TYPES.WALL}, {x: 7, y: 1, type: TYPES.WALL}, {x: 7, y: 2, type: TYPES.WALL}, {x: 7, y: 3, type: TYPES.WALL}, {x: 7, y: 4, type: TYPES.WALL}, {x: 7, y: 5, type: TYPES.WALL}, {x: 7, y: 6, type: TYPES.WALL},
            {x: 0, y: 6, type: TYPES.WALL}, {x: 1, y: 6, type: TYPES.WALL}, {x: 2, y: 6, type: TYPES.WALL}, {x: 3, y: 6, type: TYPES.WALL}, {x: 4, y: 6, type: TYPES.WALL}, {x: 5, y: 6, type: TYPES.WALL}, {x: 6, y: 6, type: TYPES.WALL},
            
            // Rules
            {x: 1, y: 0, type: TYPES.TEXT_BABA}, {x: 2, y: 0, type: TYPES.TEXT_IS}, {x: 3, y: 0, type: TYPES.TEXT_YOU},
            {x: 1, y: 1, type: TYPES.TEXT_FLAG}, {x: 2, y: 1, type: TYPES.TEXT_IS}, {x: 3, y: 1, type: TYPES.TEXT_WIN},
            {x: 1, y: 2, type: TYPES.TEXT_WATER}, {x: 2, y: 2, type: TYPES.TEXT_IS}, {x: 3, y: 2, type: TYPES.TEXT_SINK},
            {x: 1, y: 3, type: TYPES.TEXT_ROCK}, {x: 2, y: 3, type: TYPES.TEXT_IS}, {x: 3, y: 3, type: TYPES.TEXT_PUSH},
            {x: 1, y: 4, type: TYPES.TEXT_WALL}, {x: 2, y: 4, type: TYPES.TEXT_IS}, {x: 3, y: 4, type: TYPES.TEXT_STOP},

            // River (Double Width)
            // Column 14
            {x: 14, y: 0, type: TYPES.WATER}, {x: 14, y: 1, type: TYPES.WATER}, {x: 14, y: 2, type: TYPES.WATER}, {x: 14, y: 3, type: TYPES.WATER},
            {x: 14, y: 4, type: TYPES.WATER}, {x: 14, y: 5, type: TYPES.WATER}, {x: 14, y: 6, type: TYPES.WATER}, {x: 14, y: 7, type: TYPES.WATER},
            {x: 14, y: 8, type: TYPES.WATER}, {x: 14, y: 9, type: TYPES.WATER}, {x: 14, y: 10, type: TYPES.WATER}, {x: 14, y: 11, type: TYPES.WATER},
            {x: 14, y: 12, type: TYPES.WATER}, {x: 14, y: 13, type: TYPES.WATER}, {x: 14, y: 14, type: TYPES.WATER}, {x: 14, y: 15, type: TYPES.WATER},
            // Column 15
            {x: 15, y: 0, type: TYPES.WATER}, {x: 15, y: 1, type: TYPES.WATER}, {x: 15, y: 2, type: TYPES.WATER}, {x: 15, y: 3, type: TYPES.WATER},
            {x: 15, y: 4, type: TYPES.WATER}, {x: 15, y: 5, type: TYPES.WATER}, {x: 15, y: 6, type: TYPES.WATER}, {x: 15, y: 7, type: TYPES.WATER},
            {x: 15, y: 8, type: TYPES.WATER}, {x: 15, y: 9, type: TYPES.WATER}, {x: 15, y: 10, type: TYPES.WATER}, {x: 15, y: 11, type: TYPES.WATER},
            {x: 15, y: 12, type: TYPES.WATER}, {x: 15, y: 13, type: TYPES.WATER}, {x: 15, y: 14, type: TYPES.WATER}, {x: 15, y: 15, type: TYPES.WATER},
            
            // Rocks to push
            {x: 9, y: 6, type: TYPES.ROCK},
            {x: 10, y: 8, type: TYPES.ROCK},
            {x: 9, y: 10, type: TYPES.ROCK},
            
            // Player and Goal
            {x: 4, y: 8, type: TYPES.BABA},
            {x: 20, y: 8, type: TYPES.FLAG}
        ]
    },
    {
        id: 4,
        name: "05 - ALIGN",
        data: [
            // Protected Rules
            {x: 6, y: 0, type: TYPES.WALL}, {x: 6, y: 1, type: TYPES.WALL}, {x: 6, y: 2, type: TYPES.WALL}, {x: 6, y: 3, type: TYPES.WALL}, {x: 6, y: 4, type: TYPES.WALL}, {x: 6, y: 5, type: TYPES.WALL},
            {x: 0, y: 5, type: TYPES.WALL}, {x: 1, y: 5, type: TYPES.WALL}, {x: 2, y: 5, type: TYPES.WALL}, {x: 3, y: 5, type: TYPES.WALL}, {x: 4, y: 5, type: TYPES.WALL}, {x: 5, y: 5, type: TYPES.WALL},
            
            // Rules: Multi-Control
            {x: 1, y: 0, type: TYPES.TEXT_BABA}, {x: 2, y: 0, type: TYPES.TEXT_IS}, {x: 3, y: 0, type: TYPES.TEXT_YOU},
            {x: 1, y: 1, type: TYPES.TEXT_ROCK}, {x: 2, y: 1, type: TYPES.TEXT_IS}, {x: 3, y: 1, type: TYPES.TEXT_YOU},
            {x: 1, y: 2, type: TYPES.TEXT_FLAG}, {x: 2, y: 2, type: TYPES.TEXT_IS}, {x: 3, y: 2, type: TYPES.TEXT_WIN},
            {x: 1, y: 3, type: TYPES.TEXT_WALL}, {x: 2, y: 3, type: TYPES.TEXT_IS}, {x: 3, y: 3, type: TYPES.TEXT_STOP},
            
            // Characters
            {x: 3, y: 6, type: TYPES.BABA},
            {x: 3, y: 12, type: TYPES.ROCK},
            
            // Alignment Obstacles
            // Block Baba going DOWN (moves Rock only -> Spread increases)
            {x: 3, y: 7, type: TYPES.WALL},
            // Block Rock going UP (moves Baba only -> Spread increases)
            {x: 3, y: 11, type: TYPES.WALL},
            
            // Gate 1: x=12. Gaps at 5 and 13. Spread 8.
            {x: 12, y: 0, type: TYPES.WALL}, {x: 12, y: 1, type: TYPES.WALL}, {x: 12, y: 2, type: TYPES.WALL}, {x: 12, y: 3, type: TYPES.WALL}, {x: 12, y: 4, type: TYPES.WALL},
            // Gap at 5
            {x: 12, y: 6, type: TYPES.WALL}, {x: 12, y: 7, type: TYPES.WALL}, {x: 12, y: 8, type: TYPES.WALL}, {x: 12, y: 9, type: TYPES.WALL}, {x: 12, y: 10, type: TYPES.WALL}, {x: 12, y: 11, type: TYPES.WALL}, {x: 12, y: 12, type: TYPES.WALL},
            // Gap at 13
            {x: 12, y: 14, type: TYPES.WALL}, {x: 12, y: 15, type: TYPES.WALL},

            // Gate 2: x=18. Gap at 9.
            {x: 18, y: 0, type: TYPES.WALL}, {x: 18, y: 1, type: TYPES.WALL}, {x: 18, y: 2, type: TYPES.WALL}, {x: 18, y: 3, type: TYPES.WALL}, {x: 18, y: 4, type: TYPES.WALL}, {x: 18, y: 5, type: TYPES.WALL}, {x: 18, y: 6, type: TYPES.WALL}, {x: 18, y: 7, type: TYPES.WALL}, {x: 18, y: 8, type: TYPES.WALL}, 
            // Gap at 9
            {x: 18, y: 10, type: TYPES.WALL}, {x: 18, y: 11, type: TYPES.WALL}, {x: 18, y: 12, type: TYPES.WALL}, {x: 18, y: 13, type: TYPES.WALL},
            {x: 18, y: 14, type: TYPES.WALL}, {x: 18, y: 15, type: TYPES.WALL},
            
            // Goal
            {x: 21, y: 9, type: TYPES.FLAG}
        ]
    }
];