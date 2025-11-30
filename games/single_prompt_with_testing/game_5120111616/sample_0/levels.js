export const LEVELS = [
    {
        id: 1,
        name: "Simple Gap",
        budget: 1000,
        startX: -8,
        endX: 8,
        gapY: -2,
        anchors: [
            {x: -8, y: 0, z: 0},
            {x: -10, y: 0, z: 0}, // Extra ground
            {x: 8, y: 0, z: 0},
            {x: 10, y: 0, z: 0}
        ],
        vehicleStart: {x: -9, y: 1, z: 0},
        goalX: 9,
        terrain: [
            // Left Bank
            {x: -12, y: -5, w: 8, h: 5},
            {x: -8, y: -2.5, w: 4, h: 5},
            // Right Bank
            {x: 8, y: -2.5, w: 4, h: 5},
            {x: 12, y: -5, w: 8, h: 5}
        ]
    },
    {
        id: 2,
        name: "Wide Span",
        budget: 2500,
        startX: -12,
        endX: 12,
        gapY: -4,
        anchors: [
            {x: -12, y: 0, z: 0},
            {x: -12, y: -2, z: 0},
            {x: 12, y: 0, z: 0},
            {x: 12, y: -2, z: 0}
        ],
        vehicleStart: {x: -13, y: 1, z: 0},
        goalX: 13,
        terrain: [
             {x: -14, y: -5, w: 8, h: 10},
             {x: 14, y: -5, w: 8, h: 10}
        ]
    }
];