// levels.js - Level configurations
import { BIRD_TYPES, MATERIAL_TYPES } from './globals.js';

export const LEVELS = [
  {
    level: 1,
    name: "Introduction to Fling",
    birds: [BIRD_TYPES.RED, BIRD_TYPES.RED, BIRD_TYPES.RED],
    pigs: [
      { x: 400, y: 320, boss: false },
      { x: 450, y: 320, boss: false },
      { x: 425, y: 260, boss: false }
    ],
    blocks: [
      { x: 400, y: 340, w: 80, h: 15, material: MATERIAL_TYPES.WOOD },
      { x: 450, y: 340, w: 80, h: 15, material: MATERIAL_TYPES.WOOD },
      { x: 425, y: 280, w: 100, h: 15, material: MATERIAL_TYPES.WOOD },
      { x: 380, y: 300, w: 15, h: 60, material: MATERIAL_TYPES.WOOD },
      { x: 470, y: 300, w: 15, h: 60, material: MATERIAL_TYPES.WOOD }
    ]
  },
  {
    level: 2,
    name: "Stone Foundations",
    birds: [BIRD_TYPES.RED, BIRD_TYPES.RED, BIRD_TYPES.YELLOW],
    pigs: [
      { x: 380, y: 300, boss: false },
      { x: 450, y: 300, boss: false },
      { x: 415, y: 240, boss: false },
      { x: 480, y: 320, boss: false }
    ],
    blocks: [
      { x: 380, y: 340, w: 60, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 450, y: 340, w: 60, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 480, y: 340, w: 60, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 350, y: 310, w: 20, h: 60, material: MATERIAL_TYPES.STONE },
      { x: 510, y: 310, w: 20, h: 60, material: MATERIAL_TYPES.STONE },
      { x: 415, y: 260, w: 100, h: 15, material: MATERIAL_TYPES.WOOD },
      { x: 415, y: 220, w: 80, h: 15, material: MATERIAL_TYPES.WOOD },
      { x: 380, y: 280, w: 15, h: 40, material: MATERIAL_TYPES.WOOD },
      { x: 450, y: 280, w: 15, h: 40, material: MATERIAL_TYPES.WOOD }
    ]
  },
  {
    level: 3,
    name: "Glass House",
    birds: [BIRD_TYPES.RED, BIRD_TYPES.YELLOW, BIRD_TYPES.BLUE],
    pigs: [
      { x: 380, y: 310, boss: false },
      { x: 450, y: 310, boss: false },
      { x: 500, y: 310, boss: false },
      { x: 415, y: 250, boss: false },
      { x: 470, y: 250, boss: false }
    ],
    blocks: [
      { x: 380, y: 330, w: 50, h: 15, material: MATERIAL_TYPES.GLASS },
      { x: 450, y: 330, w: 50, h: 15, material: MATERIAL_TYPES.GLASS },
      { x: 500, y: 330, w: 50, h: 15, material: MATERIAL_TYPES.GLASS },
      { x: 355, y: 295, w: 15, h: 70, material: MATERIAL_TYPES.GLASS },
      { x: 405, y: 295, w: 15, h: 70, material: MATERIAL_TYPES.GLASS },
      { x: 425, y: 295, w: 15, h: 70, material: MATERIAL_TYPES.GLASS },
      { x: 475, y: 295, w: 15, h: 70, material: MATERIAL_TYPES.GLASS },
      { x: 525, y: 295, w: 15, h: 70, material: MATERIAL_TYPES.GLASS },
      { x: 415, y: 270, w: 60, h: 15, material: MATERIAL_TYPES.WOOD },
      { x: 470, y: 270, w: 60, h: 15, material: MATERIAL_TYPES.WOOD },
      { x: 442, y: 230, w: 100, h: 15, material: MATERIAL_TYPES.GLASS }
    ]
  },
  {
    level: 4,
    name: "Fortified Pigpen",
    birds: [BIRD_TYPES.RED, BIRD_TYPES.YELLOW, BIRD_TYPES.BLUE, BIRD_TYPES.BLACK],
    pigs: [
      { x: 400, y: 310, boss: false },
      { x: 480, y: 310, boss: false },
      { x: 440, y: 240, boss: false },
      { x: 520, y: 280, boss: false },
      { x: 440, y: 180, boss: true }
    ],
    blocks: [
      { x: 400, y: 340, w: 70, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 480, y: 340, w: 70, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 520, y: 340, w: 50, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 365, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 435, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 445, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 515, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 555, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 440, y: 260, w: 100, h: 15, material: MATERIAL_TYPES.WOOD },
      { x: 520, y: 260, w: 60, h: 15, material: MATERIAL_TYPES.WOOD },
      { x: 410, y: 235, w: 15, h: 50, material: MATERIAL_TYPES.GLASS },
      { x: 470, y: 235, w: 15, h: 50, material: MATERIAL_TYPES.GLASS },
      { x: 440, y: 200, w: 80, h: 15, material: MATERIAL_TYPES.STONE }
    ]
  },
  {
    level: 5,
    name: "The Royal Guard",
    birds: [BIRD_TYPES.RED, BIRD_TYPES.YELLOW, BIRD_TYPES.BLUE, BIRD_TYPES.BLACK, BIRD_TYPES.BLACK],
    pigs: [
      { x: 380, y: 310, boss: false },
      { x: 440, y: 310, boss: false },
      { x: 500, y: 310, boss: false },
      { x: 410, y: 250, boss: false },
      { x: 470, y: 250, boss: false },
      { x: 530, y: 280, boss: false },
      { x: 440, y: 160, boss: true }
    ],
    blocks: [
      { x: 380, y: 340, w: 60, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 440, y: 340, w: 60, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 500, y: 340, w: 60, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 530, y: 340, w: 60, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 350, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 410, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 470, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 530, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 560, y: 305, w: 20, h: 70, material: MATERIAL_TYPES.STONE },
      { x: 380, y: 270, w: 80, h: 15, material: MATERIAL_TYPES.STONE },
      { x: 500, y: 270, w: 80, h: 15, material: MATERIAL_TYPES.STONE },
      { x: 410, y: 230, w: 15, h: 40, material: MATERIAL_TYPES.GLASS },
      { x: 470, y: 230, w: 15, h: 40, material: MATERIAL_TYPES.GLASS },
      { x: 380, y: 250, w: 15, h: 40, material: MATERIAL_TYPES.WOOD },
      { x: 500, y: 250, w: 15, h: 40, material: MATERIAL_TYPES.WOOD },
      { x: 440, y: 210, w: 100, h: 20, material: MATERIAL_TYPES.STONE },
      { x: 440, y: 180, w: 120, h: 15, material: MATERIAL_TYPES.STONE },
      { x: 410, y: 165, w: 15, h: 30, material: MATERIAL_TYPES.STONE },
      { x: 470, y: 165, w: 15, h: 30, material: MATERIAL_TYPES.STONE }
    ]
  }
];