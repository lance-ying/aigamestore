// levels.js - Level definitions

export const LEVELS = [
  {
    name: "Level 1: Introduction to Ropes",
    difficulty: "Very Easy",
    candy: { x: 300, y: 100 },
    omNom: { x: 300, y: 350 },
    ropes: [
      { bodyA: "candy", bodyB: "static", pointB: { x: 300, y: 50 } }
    ],
    stars: [
      { x: 300, y: 200 }
    ],
    walls: [
      { x: 300, y: 390, width: 600, height: 20 }
    ],
    airCushions: [],
    bubbles: [],
    hazards: [],
    parTime: 10
  },
  {
    name: "Level 2: Double Rope Drop",
    difficulty: "Easy",
    candy: { x: 200, y: 100 },
    omNom: { x: 450, y: 350 },
    ropes: [
      { bodyA: "candy", bodyB: "static", pointB: { x: 200, y: 50 } },
      { bodyA: "candy", bodyB: "static", pointB: { x: 350, y: 150 } }
    ],
    stars: [
      { x: 300, y: 150 },
      { x: 400, y: 250 }
    ],
    walls: [
      { x: 300, y: 390, width: 600, height: 20 }
    ],
    airCushions: [],
    bubbles: [],
    hazards: [],
    parTime: 15
  },
  {
    name: "Level 3: Air Cushion Introduction",
    difficulty: "Medium",
    candy: { x: 150, y: 100 },
    omNom: { x: 500, y: 350 },
    ropes: [
      { bodyA: "candy", bodyB: "static", pointB: { x: 150, y: 50 } }
    ],
    stars: [
      { x: 200, y: 200 },
      { x: 350, y: 150 },
      { x: 450, y: 250 }
    ],
    walls: [
      { x: 300, y: 390, width: 600, height: 20 },
      { x: 100, y: 200, width: 150, height: 20 }
    ],
    airCushions: [
      { x: 300, y: 330, width: 60, height: 30 }
    ],
    bubbles: [],
    hazards: [],
    parTime: 20
  },
  {
    name: "Level 4: Bubble Ascent & Pop",
    difficulty: "Medium-Hard",
    candy: { x: 150, y: 300 },
    omNom: { x: 450, y: 100 },
    ropes: [
      { bodyA: "candy", bodyB: "static", pointB: { x: 150, y: 350 } }
    ],
    stars: [
      { x: 150, y: 200 },
      { x: 300, y: 150 },
      { x: 400, y: 200 }
    ],
    walls: [
      { x: 300, y: 390, width: 600, height: 20 }
    ],
    airCushions: [],
    bubbles: [
      { x: 150, y: 320, radius: 30 }
    ],
    hazards: [
      { x: 250, y: 200, points: [[0, -15], [15, 15], [-15, 15]] },
      { x: 350, y: 250, points: [[0, -15], [15, 15], [-15, 15]] }
    ],
    parTime: 25
  },
  {
    name: "Level 5: Combined Challenge",
    difficulty: "Hard",
    candy: { x: 100, y: 150 },
    omNom: { x: 500, y: 100 },
    ropes: [
      { bodyA: "candy", bodyB: "static", pointB: { x: 100, y: 100 } },
      { bodyA: "candy", bodyB: "static", pointB: { x: 200, y: 200 } }
    ],
    stars: [
      { x: 150, y: 250 },
      { x: 300, y: 200 },
      { x: 450, y: 250 }
    ],
    walls: [
      { x: 300, y: 390, width: 600, height: 20 },
      { x: 250, y: 300, width: 100, height: 20 },
      { x: 400, y: 200, width: 100, height: 20 }
    ],
    airCushions: [
      { x: 250, y: 270, width: 60, height: 30 }
    ],
    bubbles: [
      { x: 150, y: 280, radius: 30 }
    ],
    hazards: [
      { x: 350, y: 330, points: [[0, -15], [15, 15], [-15, 15]] }
    ],
    parTime: 30
  }
];