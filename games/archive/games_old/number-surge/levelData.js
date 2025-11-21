// levelData.js - Level definitions and configurations

export const LEVELS = [
  {
    level: 1,
    name: "The Warm-Up",
    trackLength: 1200,
    scrollSpeed: 2,
    backgroundColor: [135, 206, 235],
    numberBlocks: [
      { x: 150, y: -100, value: 2 },
      { x: 300, y: -150, value: 3 },
      { x: 450, y: -200, value: 1 },
      { x: 200, y: -280, value: 4 },
      { x: 400, y: -350, value: 5 },
      { x: 250, y: -420, value: 8 },
      { x: 350, y: -500, value: 3 }
    ],
    obstacles: [
      { type: "ditch", x: 200, y: -250, width: 100, height: 20 },
      { type: "ditch", x: 350, y: -450, width: 80, height: 20 }
    ],
    walls: [20]
  },
  {
    level: 2,
    name: "Growing Pains",
    trackLength: 1400,
    scrollSpeed: 2.5,
    backgroundColor: [144, 238, 144],
    numberBlocks: [
      { x: 180, y: -80, value: 5 },
      { x: 320, y: -140, value: 7 },
      { x: 420, y: -180, value: 10 },
      { x: 150, y: -240, value: 12 },
      { x: 450, y: -300, value: 8 },
      { x: 250, y: -360, value: 15 },
      { x: 350, y: -420, value: 18 },
      { x: 200, y: -500, value: 20 },
      { x: 400, y: -580, value: 10 },
      { x: 300, y: -650, value: 14 },
      { x: 180, y: -720, value: 16 }
    ],
    obstacles: [
      { type: "ditch", x: 220, y: -200, width: 100, height: 20 },
      { type: "saw", x: 380, y: -350, radius: 25, moveSpeed: 1, moveRange: 80 },
      { type: "ditch", x: 300, y: -550, width: 120, height: 20 },
      { type: "saw", x: 200, y: -680, radius: 25, moveSpeed: 1.2, moveRange: 100 }
    ],
    walls: [50, 75]
  },
  {
    level: 3,
    name: "The Gauntlet",
    trackLength: 1600,
    scrollSpeed: 3,
    backgroundColor: [255, 165, 0],
    numberBlocks: [
      { x: 160, y: -70, value: 10 },
      { x: 340, y: -120, value: 15 },
      { x: 440, y: -180, value: 18 },
      { x: 200, y: -250, value: 20 },
      { x: 400, y: -320, value: 22 },
      { x: 280, y: -390, value: 25 },
      { x: 380, y: -460, value: 12 },
      { x: 180, y: -540, value: 28 },
      { x: 420, y: -620, value: 30 },
      { x: 250, y: -700, value: 16 },
      { x: 350, y: -780, value: 32 },
      { x: 200, y: -860, value: 35 },
      { x: 450, y: -940, value: 20 }
    ],
    obstacles: [
      { type: "ditch", x: 250, y: -150, width: 100, height: 20 },
      { type: "saw", x: 320, y: -280, radius: 28, moveSpeed: 1.5, moveRange: 120 },
      { type: "ditch", x: 180, y: -420, width: 140, height: 20 },
      { type: "saw", x: 420, y: -550, radius: 28, moveSpeed: 1.3, moveRange: 100 },
      { type: "ditch", x: 300, y: -720, width: 100, height: 20 },
      { type: "saw", x: 250, y: -850, radius: 28, moveSpeed: 1.6, moveRange: 140 }
    ],
    walls: [100, 150, 200]
  },
  {
    level: 4,
    name: "Precision Paths",
    trackLength: 1900,
    scrollSpeed: 3.5,
    backgroundColor: [138, 43, 226],
    numberBlocks: [
      { x: 170, y: -60, value: 20 },
      { x: 350, y: -110, value: 25 },
      { x: 430, y: -170, value: 30 },
      { x: 220, y: -240, value: 28 },
      { x: 380, y: -320, value: 35 },
      { x: 260, y: -400, value: 32 },
      { x: 410, y: -480, value: 38 },
      { x: 190, y: -570, value: 40 },
      { x: 360, y: -660, value: 25 },
      { x: 280, y: -750, value: 42 },
      { x: 420, y: -840, value: 30 },
      { x: 200, y: -930, value: 45 },
      { x: 380, y: -1020, value: 48 },
      { x: 300, y: -1110, value: 35 },
      { x: 240, y: -1180, value: 50 }
    ],
    obstacles: [
      { type: "ditch", x: 260, y: -140, width: 90, height: 20 },
      { type: "saw", x: 300, y: -250, radius: 30, moveSpeed: 1.8, moveRange: 150 },
      { type: "ditch", x: 350, y: -380, width: 110, height: 20 },
      { type: "saw", x: 230, y: -500, radius: 30, moveSpeed: 2, moveRange: 130 },
      { type: "ditch", x: 270, y: -650, width: 100, height: 20 },
      { type: "saw", x: 400, y: -780, radius: 30, moveSpeed: 1.7, moveRange: 140 },
      { type: "ditch", x: 220, y: -920, width: 120, height: 20 },
      { type: "saw", x: 320, y: -1050, radius: 30, moveSpeed: 2.1, moveRange: 160 }
    ],
    walls: [250, 300, 350, 400]
  },
  {
    level: 5,
    name: "Number Master",
    trackLength: 2200,
    scrollSpeed: 4,
    backgroundColor: [220, 20, 60],
    numberBlocks: [
      { x: 160, y: -50, value: 30 },
      { x: 360, y: -100, value: 35 },
      { x: 440, y: -160, value: 40 },
      { x: 210, y: -230, value: 38 },
      { x: 390, y: -310, value: 42 },
      { x: 270, y: -400, value: 45 },
      { x: 420, y: -490, value: 48 },
      { x: 180, y: -590, value: 50 },
      { x: 370, y: -690, value: 35 },
      { x: 290, y: -790, value: 52 },
      { x: 430, y: -890, value: 40 },
      { x: 200, y: -990, value: 55 },
      { x: 380, y: -1090, value: 58 },
      { x: 310, y: -1190, value: 45 },
      { x: 240, y: -1290, value: 60 },
      { x: 400, y: -1390, value: 50 },
      { x: 280, y: -1480, value: 62 }
    ],
    obstacles: [
      { type: "ditch", x: 270, y: -130, width: 85, height: 20 },
      { type: "saw", x: 310, y: -240, radius: 32, moveSpeed: 2.2, moveRange: 170 },
      { type: "ditch", x: 360, y: -380, width: 100, height: 20 },
      { type: "saw", x: 240, y: -520, radius: 32, moveSpeed: 2.4, moveRange: 150 },
      { type: "ditch", x: 280, y: -680, width: 110, height: 20 },
      { type: "saw", x: 410, y: -820, radius: 32, moveSpeed: 2.1, moveRange: 160 },
      { type: "ditch", x: 230, y: -970, width: 130, height: 20 },
      { type: "saw", x: 330, y: -1110, radius: 32, moveSpeed: 2.5, moveRange: 180 },
      { type: "ditch", x: 300, y: -1270, width: 100, height: 20 },
      { type: "saw", x: 250, y: -1420, radius: 32, moveSpeed: 2.3, moveRange: 170 }
    ],
    walls: [450, 500, 550, 600, 650]
  }
];

export function getLevelData(levelNumber) {
  return LEVELS[levelNumber - 1] || null;
}