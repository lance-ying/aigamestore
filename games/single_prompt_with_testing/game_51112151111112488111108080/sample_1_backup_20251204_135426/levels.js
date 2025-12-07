import { TYPES } from './types.js';

// Level Data Format:
// width, height (should match grid)
// List of entities: { x, y, type }

export const LEVELS = [
    {
        id: 0,
        name: "01 - START",
        data: [
            // Rules: BABA IS YOU
            {x: 4, y: 4, type: TYPES.TEXT_BABA},
            {x: 5, y: 4, type: TYPES.TEXT_IS},
            {x: 6, y: 4, type: TYPES.TEXT_YOU},
            
            // Rules: FLAG IS WIN
            {x: 4, y: 6, type: TYPES.TEXT_FLAG},
            {x: 5, y: 6, type: TYPES.TEXT_IS},
            {x: 6, y: 6, type: TYPES.TEXT_WIN},
            
            // Rules: WALL IS STOP
            {x: 4, y: 8, type: TYPES.TEXT_WALL},
            {x: 5, y: 8, type: TYPES.TEXT_IS},
            {x: 6, y: 8, type: TYPES.TEXT_STOP},
            
            // Objects
            {x: 10, y: 8, type: TYPES.BABA},
            {x: 18, y: 8, type: TYPES.FLAG},
            
            // Walls
            {x: 14, y: 6, type: TYPES.WALL},
            {x: 14, y: 7, type: TYPES.WALL},
            {x: 14, y: 8, type: TYPES.WALL},
            {x: 14, y: 9, type: TYPES.WALL},
            {x: 14, y: 10, type: TYPES.WALL}
        ]
    },
    {
        id: 1,
        name: "02 - BROKEN",
        data: [
             // BABA IS YOU
            {x: 2, y: 2, type: TYPES.TEXT_BABA},
            {x: 3, y: 2, type: TYPES.TEXT_IS},
            {x: 4, y: 2, type: TYPES.TEXT_YOU},
            
            // FLAG IS WIN
            {x: 16, y: 2, type: TYPES.TEXT_FLAG},
            {x: 17, y: 2, type: TYPES.TEXT_IS},
            {x: 18, y: 2, type: TYPES.TEXT_WIN},
            
            // WALL IS STOP (Breakable)
            {x: 10, y: 12, type: TYPES.TEXT_WALL},
            {x: 11, y: 12, type: TYPES.TEXT_IS},
            {x: 12, y: 12, type: TYPES.TEXT_STOP}, // Player must push this
            
            // Objects
            {x: 4, y: 8, type: TYPES.BABA},
            
            // Walls enclosure
            {x: 12, y: 6, type: TYPES.WALL},
            {x: 12, y: 7, type: TYPES.WALL},
            {x: 12, y: 8, type: TYPES.WALL},
            {x: 12, y: 9, type: TYPES.WALL},
            
            {x: 18, y: 8, type: TYPES.FLAG}
        ]
    },
    {
        id: 2,
        name: "03 - CHANGE",
        data: [
            // BABA IS YOU
            {x: 2, y: 2, type: TYPES.TEXT_BABA},
            {x: 3, y: 2, type: TYPES.TEXT_IS},
            {x: 4, y: 2, type: TYPES.TEXT_YOU},
            
            // ROCK IS PUSH
            {x: 2, y: 4, type: TYPES.TEXT_ROCK},
            {x: 3, y: 4, type: TYPES.TEXT_IS},
            {x: 4, y: 4, type: TYPES.TEXT_PUSH},

            // Setup for ROCK IS BABA
            {x: 10, y: 4, type: TYPES.TEXT_ROCK},
            {x: 11, y: 4, type: TYPES.TEXT_IS},
            // Missing BABA text, player must fetch it
            
            {x: 14, y: 2, type: TYPES.TEXT_BABA}, // Loose Text
            
            // FLAG IS WIN
            {x: 18, y: 12, type: TYPES.TEXT_FLAG},
            {x: 19, y: 12, type: TYPES.TEXT_IS},
            {x: 20, y: 12, type: TYPES.TEXT_WIN},
            
            // Scene
            {x: 5, y: 8, type: TYPES.BABA},
            
            // A wall of water or something preventing BABA but maybe accessible by transformed rock?
            // Simple: Wall blocks path. Rock is on other side?
            // No, make Rock accessible.
            {x: 10, y: 8, type: TYPES.ROCK},
            
            // Flag is behind water. WATER IS STOP.
            {x: 15, y: 12, type: TYPES.WATER},
            {x: 16, y: 12, type: TYPES.WATER},
            {x: 17, y: 12, type: TYPES.WATER},
            
            {x: 18, y: 14, type: TYPES.TEXT_WATER},
            {x: 19, y: 14, type: TYPES.TEXT_IS},
            {x: 20, y: 14, type: TYPES.TEXT_STOP}
        ]
    }
];