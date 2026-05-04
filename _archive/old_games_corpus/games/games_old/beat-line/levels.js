// levels.js - Level definitions and configurations

export const LEVELS = [
  {
    name: "Morning Glade",
    speed: 2,
    trackWidth: 80,
    color: [100, 200, 150],
    backgroundColor: [200, 230, 255],
    turnPoints: [
      { distance: 300, direction: "DOWN", timing: 2000, perfect: 50 },
      { distance: 600, direction: "RIGHT", timing: 4000, perfect: 50 },
      { distance: 900, direction: "DOWN", timing: 6000, perfect: 50 },
      { distance: 1200, direction: "RIGHT", timing: 8000, perfect: 50 },
      { distance: 1500, direction: "DOWN", timing: 10000, perfect: 50 },
      { distance: 1800, direction: "LEFT", timing: 12000, perfect: 50 }
    ],
    obstacles: [
      { distance: 450, lane: 0, type: "static", width: 30, height: 30 },
      { distance: 750, lane: 1, type: "static", width: 30, height: 30 },
      { distance: 1050, lane: 0, type: "static", width: 30, height: 30 }
    ],
    endDistance: 2000,
    bpm: 100
  },
  {
    name: "City Rush",
    speed: 3,
    trackWidth: 60,
    color: [150, 150, 200],
    backgroundColor: [100, 100, 120],
    turnPoints: [
      { distance: 250, direction: "DOWN", timing: 1500, perfect: 40 },
      { distance: 450, direction: "RIGHT", timing: 2700, perfect: 40 },
      { distance: 600, direction: "DOWN", timing: 3600, perfect: 40 },
      { distance: 750, direction: "LEFT", timing: 4500, perfect: 40 },
      { distance: 950, direction: "DOWN", timing: 5700, perfect: 40 },
      { distance: 1150, direction: "RIGHT", timing: 6900, perfect: 40 },
      { distance: 1350, direction: "DOWN", timing: 8100, perfect: 40 },
      { distance: 1550, direction: "RIGHT", timing: 9300, perfect: 40 },
      { distance: 1750, direction: "DOWN", timing: 10500, perfect: 40 }
    ],
    obstacles: [
      { distance: 350, lane: 1, type: "static", width: 25, height: 25 },
      { distance: 525, lane: 0, type: "moving", width: 25, height: 25, moveSpeed: 1, moveRange: 30 },
      { distance: 675, lane: 1, type: "static", width: 25, height: 25 },
      { distance: 850, lane: 0, type: "static", width: 25, height: 25 },
      { distance: 1050, lane: 1, type: "moving", width: 25, height: 25, moveSpeed: 1.5, moveRange: 25 },
      { distance: 1250, lane: 0, type: "static", width: 25, height: 25 },
      { distance: 1450, lane: 1, type: "moving", width: 25, height: 25, moveSpeed: 1.2, moveRange: 30 },
      { distance: 1650, lane: 0, type: "static", width: 25, height: 25 }
    ],
    endDistance: 2000,
    bpm: 130
  },
  {
    name: "Abstract Dream",
    speed: 4,
    trackWidth: 50,
    color: [200, 100, 200],
    backgroundColor: [40, 20, 60],
    turnPoints: [
      { distance: 200, direction: "DOWN", timing: 1000, perfect: 30 },
      { distance: 350, direction: "RIGHT", timing: 1750, perfect: 30 },
      { distance: 470, direction: "DOWN", timing: 2350, perfect: 30 },
      { distance: 590, direction: "LEFT", timing: 2950, perfect: 30 },
      { distance: 710, direction: "DOWN", timing: 3550, perfect: 30 },
      { distance: 850, direction: "RIGHT", timing: 4250, perfect: 30 },
      { distance: 970, direction: "DOWN", timing: 4850, perfect: 30 },
      { distance: 1090, direction: "RIGHT", timing: 5450, perfect: 30 },
      { distance: 1210, direction: "DOWN", timing: 6050, perfect: 30 },
      { distance: 1350, direction: "LEFT", timing: 6750, perfect: 30 },
      { distance: 1470, direction: "DOWN", timing: 7350, perfect: 30 },
      { distance: 1610, direction: "RIGHT", timing: 8050, perfect: 30 }
    ],
    obstacles: [
      { distance: 275, lane: 1, type: "moving", width: 20, height: 20, moveSpeed: 2, moveRange: 20 },
      { distance: 410, lane: 0, type: "static", width: 20, height: 20 },
      { distance: 530, lane: 1, type: "moving", width: 20, height: 20, moveSpeed: 2.5, moveRange: 15 },
      { distance: 650, lane: 0, type: "static", width: 20, height: 20 },
      { distance: 780, lane: 1, type: "moving", width: 20, height: 20, moveSpeed: 2, moveRange: 20 },
      { distance: 910, lane: 0, type: "static", width: 20, height: 20 },
      { distance: 1030, lane: 1, type: "moving", width: 20, height: 20, moveSpeed: 2.5, moveRange: 15 },
      { distance: 1150, lane: 0, type: "static", width: 20, height: 20 },
      { distance: 1280, lane: 1, type: "moving", width: 20, height: 20, moveSpeed: 2, moveRange: 20 },
      { distance: 1410, lane: 0, type: "static", width: 20, height: 20 },
      { distance: 1540, lane: 1, type: "moving", width: 20, height: 20, moveSpeed: 2.5, moveRange: 15 }
    ],
    endDistance: 1800,
    bpm: 160
  }
];