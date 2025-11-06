// levels.js - Level definitions and puzzle logic

export const LEVEL_DATA = [
  {
    id: 0,
    name: "The Seed",
    year: "1860",
    character: "James Vanderboom",
    description: "Plant the seed that will grow into the family tree",
    hotspots: [
      { id: 'seed', x: 200, y: 250, w: 40, h: 40, type: 'item', name: 'Seed', collected: false },
      { id: 'soil', x: 300, y: 300, w: 80, h: 60, type: 'interact', name: 'Soil Patch', state: 'empty' },
      { id: 'water', x: 450, y: 200, w: 50, h: 50, type: 'item', name: 'Watering Can', collected: false },
      { id: 'tree', x: 300, y: 150, w: 60, h: 100, type: 'goal', name: 'Young Tree', visible: false }
    ],
    solution: ['seed', 'soil', 'water', 'soil'],
    secrets: [{ id: 'hidden_coin', x: 100, y: 350, found: false }]
  },
  {
    id: 1,
    name: "The Roots",
    year: "1889",
    character: "Mary Vanderboom",
    description: "Strengthen the roots to support the growing tree",
    hotspots: [
      { id: 'shovel', x: 150, y: 300, w: 40, h: 50, type: 'item', name: 'Shovel', collected: false },
      { id: 'roots', x: 300, y: 320, w: 100, h: 50, type: 'interact', name: 'Roots', state: 'weak' },
      { id: 'fertilizer', x: 500, y: 280, w: 45, h: 45, type: 'item', name: 'Fertilizer', collected: false },
      { id: 'bucket', x: 400, y: 150, w: 40, h: 50, type: 'item', name: 'Bucket', collected: false }
    ],
    solution: ['shovel', 'roots', 'fertilizer', 'roots', 'bucket', 'roots'],
    secrets: [{ id: 'hidden_locket', x: 550, y: 100, found: false }]
  },
  {
    id: 2,
    name: "The Branches",
    year: "1920",
    character: "Albert Vanderboom",
    description: "Guide the branches to grow in harmony",
    hotspots: [
      { id: 'pruners', x: 100, y: 200, w: 45, h: 45, type: 'item', name: 'Pruning Shears', collected: false },
      { id: 'branch_left', x: 200, y: 150, w: 80, h: 40, type: 'interact', name: 'Left Branch', state: 'overgrown' },
      { id: 'branch_right', x: 400, y: 150, w: 80, h: 40, type: 'interact', name: 'Right Branch', state: 'overgrown' },
      { id: 'rope', x: 500, y: 300, w: 40, h: 40, type: 'item', name: 'Rope', collected: false }
    ],
    solution: ['pruners', 'branch_left', 'pruners', 'branch_right', 'rope', 'branch_left'],
    secrets: [{ id: 'hidden_photograph', x: 300, y: 50, found: false }]
  },
  {
    id: 3,
    name: "The Leaves",
    year: "1950",
    character: "Emma Vanderboom",
    description: "Nurture the leaves to capture sunlight",
    hotspots: [
      { id: 'ladder', x: 80, y: 250, w: 50, h: 80, type: 'item', name: 'Ladder', collected: false },
      { id: 'leaves', x: 300, y: 100, w: 120, h: 80, type: 'interact', name: 'Leaves', state: 'wilted' },
      { id: 'spray', x: 520, y: 320, w: 40, h: 50, type: 'item', name: 'Plant Spray', collected: false },
      { id: 'sun_crystal', x: 450, y: 80, w: 35, h: 35, type: 'item', name: 'Sun Crystal', collected: false }
    ],
    solution: ['ladder', 'leaves', 'spray', 'leaves', 'sun_crystal', 'leaves'],
    secrets: [{ id: 'hidden_key', x: 50, y: 150, found: false }]
  },
  {
    id: 4,
    name: "The Fruit",
    year: "1980",
    character: "Laura Vanderboom",
    description: "Harvest the fruit of the family tree to complete the cycle",
    hotspots: [
      { id: 'basket', x: 100, y: 300, w: 50, h: 50, type: 'item', name: 'Basket', collected: false },
      { id: 'fruit_1', x: 250, y: 120, w: 30, h: 30, type: 'interact', name: 'Golden Fruit', state: 'ripe' },
      { id: 'fruit_2', x: 350, y: 140, w: 30, h: 30, type: 'interact', name: 'Silver Fruit', state: 'ripe' },
      { id: 'altar', x: 480, y: 280, w: 70, h: 60, type: 'interact', name: 'Family Altar', state: 'empty' }
    ],
    solution: ['basket', 'fruit_1', 'basket', 'fruit_2', 'basket', 'altar'],
    secrets: [{ id: 'hidden_letter', x: 570, y: 200, found: false }]
  }
];

export function getLevelData(levelIndex) {
  return LEVEL_DATA[levelIndex] || null;
}

export function checkPuzzleSolution(levelData, interactions) {
  if (!levelData || !levelData.solution) return false;
  
  const solution = levelData.solution;
  if (interactions.length < solution.length) return false;
  
  for (let i = 0; i < solution.length; i++) {
    if (interactions[i] !== solution[i]) {
      return false;
    }
  }
  
  return true;
}