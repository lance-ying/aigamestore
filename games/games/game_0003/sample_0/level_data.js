export const LEVELS = [
    {
        // Level 1: Intro
        width: 1200,
        height: 600,
        playerStart: { x: 50, y: 300 },
        platforms: [
            { x: 0, y: 350, w: 400, h: 50 }, // Start ground
            { x: 500, y: 300, w: 200, h: 20 }, // Bridge
            { x: 800, y: 350, w: 400, h: 50 }, // End ground
            { x: 200, y: 250, w: 100, h: 20 }, // Floating
            { x: 400, y: 150, w: 100, h: 20 }  // High
        ],
        hazards: [
            { x: 450, y: 380, w: 50, h: 50, type: 'spike' }, // Pit spike
            { x: 750, y: 380, w: 50, h: 50, type: 'spike' }
        ],
        collectibles: [
            { x: 250, y: 200 },
            { x: 450, y: 100 },
            { x: 600, y: 250 },
            { x: 900, y: 300 }
        ],
        exit: { x: 1100, y: 300 }
    },
    {
        // Level 2: Vertical Float
        width: 1000,
        height: 1000, // Taller
        playerStart: { x: 50, y: 900 },
        platforms: [
            { x: 0, y: 950, w: 300, h: 50 },
            { x: 200, y: 800, w: 100, h: 20 },
            { x: 50, y: 650, w: 100, h: 20 },
            { x: 300, y: 500, w: 400, h: 20 }, // Long mid plat
            { x: 0, y: 350, w: 200, h: 20 },
            { x: 300, y: 200, w: 100, h: 20 },
            { x: 600, y: 200, w: 400, h: 50 } // Goal plat
        ],
        hazards: [
            { x: 400, y: 480, w: 20, h: 20, type: 'spike' },
            { x: 500, y: 480, w: 20, h: 20, type: 'spike' },
            { x: 100, y: 950, w: 400, h: 40, type: 'spike' } // Floor lava simulation
        ],
        collectibles: [
            { x: 250, y: 750 },
            { x: 100, y: 600 },
            { x: 400, y: 400 },
            { x: 100, y: 300 },
            { x: 700, y: 150 }
        ],
        exit: { x: 900, y: 150 }
    },
    {
        // Level 3: Precision Dive
        width: 2000,
        height: 600,
        playerStart: { x: 50, y: 300 },
        platforms: [
            { x: 0, y: 350, w: 200, h: 50 },
            // Tube structure requiring deflate
            { x: 300, y: 200, w: 500, h: 20 }, // Ceiling
            { x: 300, y: 350, w: 500, h: 20 }, // Floor
            // Gap inside tube
            { x: 500, y: 330, w: 20, h: 20 }, // Bump
            // Post tube
            { x: 900, y: 400, w: 200, h: 20 },
            { x: 1200, y: 300, w: 100, h: 20 },
            { x: 1400, y: 200, w: 100, h: 20 },
            { x: 1600, y: 350, w: 400, h: 50 }
        ],
        hazards: [
            { x: 550, y: 335, w: 30, h: 30, type: 'spike' }, // Inside tube
            { x: 1000, y: 550, w: 500, h: 50, type: 'spike' } // Bottom pit
        ],
        collectibles: [
            { x: 400, y: 280 }, // In tube
            { x: 700, y: 280 }, // End of tube
            { x: 1250, y: 250 },
            { x: 1450, y: 150 }
        ],
        exit: { x: 1900, y: 300 }
    }
];