// levels.js - Level definitions
export const LEVELS = {
  1: {
    name: "The Basics",
    screws: [
      {
        id: 1,
        startX: 150,
        startY: 200,
        pathCoordinates: [
          { x: 150, y: 200 },
          { x: 100, y: 200 }
        ],
        color: [180, 180, 190],
        blockingScrews: [2],
        blockedByScrews: []
      },
      {
        id: 2,
        startX: 300,
        startY: 200,
        pathCoordinates: [
          { x: 300, y: 200 },
          { x: 300, y: 150 }
        ],
        color: [160, 140, 120],
        blockingScrews: [],
        blockedByScrews: [1]
      },
      {
        id: 3,
        startX: 450,
        startY: 200,
        pathCoordinates: [
          { x: 450, y: 200 },
          { x: 500, y: 200 }
        ],
        color: [140, 140, 150],
        blockingScrews: [],
        blockedByScrews: []
      }
    ]
  },
  2: {
    name: "Interlocking Paths",
    screws: [
      {
        id: 1,
        startX: 150,
        startY: 150,
        pathCoordinates: [
          { x: 150, y: 150 },
          { x: 100, y: 120 }
        ],
        color: [180, 180, 190],
        blockingScrews: [2, 3],
        blockedByScrews: []
      },
      {
        id: 2,
        startX: 250,
        startY: 200,
        pathCoordinates: [
          { x: 250, y: 200 },
          { x: 250, y: 280 }
        ],
        color: [160, 140, 120],
        blockingScrews: [],
        blockedByScrews: [1]
      },
      {
        id: 3,
        startX: 350,
        startY: 200,
        pathCoordinates: [
          { x: 350, y: 200 },
          { x: 400, y: 180 }
        ],
        color: [140, 140, 150],
        blockingScrews: [4],
        blockedByScrews: [1]
      },
      {
        id: 4,
        startX: 450,
        startY: 150,
        pathCoordinates: [
          { x: 450, y: 150 },
          { x: 500, y: 100 }
        ],
        color: [170, 150, 140],
        blockingScrews: [],
        blockedByScrews: [3]
      },
      {
        id: 5,
        startX: 300,
        startY: 300,
        pathCoordinates: [
          { x: 300, y: 300 },
          { x: 250, y: 350 }
        ],
        color: [150, 150, 160],
        blockingScrews: [],
        blockedByScrews: []
      }
    ]
  },
  3: {
    name: "The Crossroads",
    screws: [
      {
        id: 1,
        startX: 200,
        startY: 150,
        pathCoordinates: [
          { x: 200, y: 150 },
          { x: 150, y: 100 }
        ],
        color: [180, 180, 190],
        blockingScrews: [3],
        blockedByScrews: []
      },
      {
        id: 2,
        startX: 300,
        startY: 100,
        pathCoordinates: [
          { x: 300, y: 100 },
          { x: 350, y: 80 }
        ],
        color: [160, 140, 120],
        blockingScrews: [4],
        blockedByScrews: [3]
      },
      {
        id: 3,
        startX: 250,
        startY: 200,
        pathCoordinates: [
          { x: 250, y: 200 },
          { x: 200, y: 250 }
        ],
        color: [140, 140, 150],
        blockingScrews: [2, 5],
        blockedByScrews: [1]
      },
      {
        id: 4,
        startX: 400,
        startY: 180,
        pathCoordinates: [
          { x: 400, y: 180 },
          { x: 450, y: 200 }
        ],
        color: [170, 150, 140],
        blockingScrews: [6],
        blockedByScrews: [2]
      },
      {
        id: 5,
        startX: 350,
        startY: 250,
        pathCoordinates: [
          { x: 350, y: 250 },
          { x: 400, y: 280 }
        ],
        color: [150, 150, 160],
        blockingScrews: [],
        blockedByScrews: [3]
      },
      {
        id: 6,
        startX: 450,
        startY: 300,
        pathCoordinates: [
          { x: 450, y: 300 },
          { x: 500, y: 320 }
        ],
        color: [165, 155, 145],
        blockingScrews: [],
        blockedByScrews: [4]
      },
      {
        id: 7,
        startX: 150,
        startY: 300,
        pathCoordinates: [
          { x: 150, y: 300 },
          { x: 100, y: 330 }
        ],
        color: [155, 145, 135],
        blockingScrews: [],
        blockedByScrews: []
      }
    ]
  },
  4: {
    name: "Tight Squeeze",
    screws: [
      {
        id: 1,
        startX: 120,
        startY: 120,
        pathCoordinates: [
          { x: 120, y: 120 },
          { x: 80, y: 90 }
        ],
        color: [180, 180, 190],
        blockingScrews: [2],
        blockedByScrews: []
      },
      {
        id: 2,
        startX: 200,
        startY: 100,
        pathCoordinates: [
          { x: 200, y: 100 },
          { x: 250, y: 80 }
        ],
        color: [160, 140, 120],
        blockingScrews: [3, 4],
        blockedByScrews: [1]
      },
      {
        id: 3,
        startX: 300,
        startY: 120,
        pathCoordinates: [
          { x: 300, y: 120 },
          { x: 350, y: 100 }
        ],
        color: [140, 140, 150],
        blockingScrews: [5],
        blockedByScrews: [2]
      },
      {
        id: 4,
        startX: 250,
        startY: 180,
        pathCoordinates: [
          { x: 250, y: 180 },
          { x: 200, y: 220 }
        ],
        color: [170, 150, 140],
        blockingScrews: [6],
        blockedByScrews: [2]
      },
      {
        id: 5,
        startX: 400,
        startY: 150,
        pathCoordinates: [
          { x: 400, y: 150 },
          { x: 450, y: 130 }
        ],
        color: [150, 150, 160],
        blockingScrews: [7],
        blockedByScrews: [3]
      },
      {
        id: 6,
        startX: 180,
        startY: 260,
        pathCoordinates: [
          { x: 180, y: 260 },
          { x: 150, y: 300 }
        ],
        color: [165, 155, 145],
        blockingScrews: [8],
        blockedByScrews: [4]
      },
      {
        id: 7,
        startX: 480,
        startY: 200,
        pathCoordinates: [
          { x: 480, y: 200 },
          { x: 520, y: 220 }
        ],
        color: [155, 145, 135],
        blockingScrews: [],
        blockedByScrews: [5]
      },
      {
        id: 8,
        startX: 300,
        startY: 280,
        pathCoordinates: [
          { x: 300, y: 280 },
          { x: 350, y: 310 }
        ],
        color: [175, 165, 155],
        blockingScrews: [9],
        blockedByScrews: [6]
      },
      {
        id: 9,
        startX: 420,
        startY: 300,
        pathCoordinates: [
          { x: 420, y: 300 },
          { x: 470, y: 330 }
        ],
        color: [145, 135, 125],
        blockingScrews: [],
        blockedByScrews: [8]
      }
    ]
  },
  5: {
    name: "Master Mechanic",
    screws: [
      {
        id: 1,
        startX: 100,
        startY: 100,
        pathCoordinates: [
          { x: 100, y: 100 },
          { x: 60, y: 70 }
        ],
        color: [180, 180, 190],
        blockingScrews: [2],
        blockedByScrews: []
      },
      {
        id: 2,
        startX: 180,
        startY: 100,
        pathCoordinates: [
          { x: 180, y: 100 },
          { x: 230, y: 80 }
        ],
        color: [160, 140, 120],
        blockingScrews: [3, 4],
        blockedByScrews: [1]
      },
      {
        id: 3,
        startX: 270,
        startY: 110,
        pathCoordinates: [
          { x: 270, y: 110 },
          { x: 320, y: 90 }
        ],
        color: [140, 140, 150],
        blockingScrews: [5],
        blockedByScrews: [2]
      },
      {
        id: 4,
        startX: 200,
        startY: 170,
        pathCoordinates: [
          { x: 200, y: 170 },
          { x: 160, y: 210 }
        ],
        color: [170, 150, 140],
        blockingScrews: [6, 7],
        blockedByScrews: [2]
      },
      {
        id: 5,
        startX: 360,
        startY: 130,
        pathCoordinates: [
          { x: 360, y: 130 },
          { x: 410, y: 110 }
        ],
        color: [150, 150, 160],
        blockingScrews: [8],
        blockedByScrews: [3]
      },
      {
        id: 6,
        startX: 140,
        startY: 240,
        pathCoordinates: [
          { x: 140, y: 240 },
          { x: 100, y: 280 }
        ],
        color: [165, 155, 145],
        blockingScrews: [],
        blockedByScrews: [4]
      },
      {
        id: 7,
        startX: 250,
        startY: 220,
        pathCoordinates: [
          { x: 250, y: 220 },
          { x: 290, y: 250 }
        ],
        color: [155, 145, 135],
        blockingScrews: [9],
        blockedByScrews: [4]
      },
      {
        id: 8,
        startX: 450,
        startY: 160,
        pathCoordinates: [
          { x: 450, y: 160 },
          { x: 500, y: 140 }
        ],
        color: [175, 165, 155],
        blockingScrews: [10],
        blockedByScrews: [5]
      },
      {
        id: 9,
        startX: 330,
        startY: 270,
        pathCoordinates: [
          { x: 330, y: 270 },
          { x: 380, y: 290 }
        ],
        color: [145, 135, 125],
        blockingScrews: [11],
        blockedByScrews: [7]
      },
      {
        id: 10,
        startX: 520,
        startY: 220,
        pathCoordinates: [
          { x: 520, y: 220 },
          { x: 560, y: 240 }
        ],
        color: [185, 175, 165],
        blockingScrews: [],
        blockedByScrews: [8]
      },
      {
        id: 11,
        startX: 420,
        startY: 310,
        pathCoordinates: [
          { x: 420, y: 310 },
          { x: 470, y: 340 }
        ],
        color: [135, 125, 115],
        blockingScrews: [],
        blockedByScrews: [9]
      }
    ]
  }
};