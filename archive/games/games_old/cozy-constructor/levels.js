// levels.js - Level configurations

export const LEVELS = [
  {
    levelNumber: 1,
    name: "The Basics - Desk Setup",
    gridSize: 10,
    timeLimit: 90,
    items: [
      { id: 0, name: "Desk", color: [139, 90, 43], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0],
        [0, 1], [1, 1], [2, 1], [3, 1]
      ]] },
      { id: 1, name: "Chair", color: [70, 130, 180], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] },
      { id: 2, name: "Lamp", color: [255, 215, 0], shapes: [[
        [0, 0]
      ]] },
      { id: 3, name: "Plant", color: [34, 139, 34], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] }
    ],
    rules: [
      { type: "ALL_PLACED", message: "Place all items" },
      { type: "NO_OVERLAP", message: "No overlapping items" }
    ]
  },
  {
    levelNumber: 2,
    name: "Cozy Corner - Small Living Room",
    gridSize: 12,
    timeLimit: 120,
    items: [
      { id: 0, name: "Sofa", color: [139, 90, 90], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1]
      ]] },
      { id: 1, name: "Coffee Table", color: [160, 82, 45], shapes: [[
        [0, 0], [1, 0], [2, 0],
        [0, 1], [1, 1], [2, 1]
      ]] },
      { id: 2, name: "Rug", color: [188, 143, 143], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3]
      ]] },
      { id: 3, name: "Plant", color: [34, 139, 34], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] },
      { id: 4, name: "Side Table", color: [139, 90, 43], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] }
    ],
    rules: [
      { type: "ALL_PLACED", message: "Place all items" },
      { type: "NO_OVERLAP", message: "No overlapping items" },
      { type: "RUG_UNDER", itemIds: [0, 1], rugId: 2, message: "Rug must be under Sofa and Coffee Table" }
    ]
  },
  {
    levelNumber: 3,
    name: "The Office - Strategic Placement",
    gridSize: 15,
    timeLimit: 150,
    items: [
      { id: 0, name: "Large Desk", color: [101, 67, 33], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2]
      ]] },
      { id: 1, name: "Office Chair", color: [70, 130, 180], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] },
      { id: 2, name: "Bookshelf", color: [139, 69, 19], shapes: [[
        [0, 0], [1, 0], [2, 0]
      ]] },
      { id: 3, name: "Monitor", color: [25, 25, 25], shapes: [[
        [0, 0], [1, 0]
      ]] },
      { id: 4, name: "Filing Cabinet", color: [105, 105, 105], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] },
      { id: 5, name: "Lamp", color: [255, 215, 0], shapes: [[
        [0, 0]
      ]] },
      { id: 6, name: "Plant", color: [34, 139, 34], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] }
    ],
    rules: [
      { type: "ALL_PLACED", message: "Place all items" },
      { type: "NO_OVERLAP", message: "No overlapping items" },
      { type: "AGAINST_WALL", itemId: 0, message: "Large Desk must be against a wall" },
      { type: "ON_TOP", itemId: 3, baseId: 0, message: "Monitor must be on Large Desk" }
    ]
  },
  {
    levelNumber: 4,
    name: "Tricky Shapes - Irregular & Limited Space",
    gridSize: 15,
    timeLimit: 180,
    items: [
      { id: 0, name: "L-Sofa", color: [139, 90, 90], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0],
        [0, 1], [1, 1], [2, 1], [3, 1],
        [0, 2], [1, 2]
      ]] },
      { id: 1, name: "Corner Shelf", color: [160, 82, 45], shapes: [[
        [0, 0], [1, 0], [2, 0],
        [0, 1],
        [0, 2]
      ]] },
      { id: 2, name: "Coffee Table", color: [139, 90, 43], shapes: [[
        [0, 0], [1, 0], [2, 0],
        [0, 1], [1, 1], [2, 1]
      ]] },
      { id: 3, name: "TV Stand", color: [80, 80, 80], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0]
      ]] },
      { id: 4, name: "Plant", color: [34, 139, 34], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] },
      { id: 5, name: "Rug", color: [188, 143, 143], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0],
        [0, 1], [1, 1], [2, 1], [3, 1],
        [0, 2], [1, 2], [2, 2], [3, 2]
      ]] }
    ],
    rules: [
      { type: "ALL_PLACED", message: "Place all items" },
      { type: "NO_OVERLAP", message: "No overlapping items" },
      { type: "IN_ZONE", zoneX: 2, zoneY: 2, zoneW: 11, zoneH: 11, message: "All items must fit in the marked zone" }
    ]
  },
  {
    levelNumber: 5,
    name: "Grand Design - Master Planner",
    gridSize: 18,
    timeLimit: 180,
    items: [
      { id: 0, name: "Large Desk", color: [101, 67, 33], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2]
      ]] },
      { id: 1, name: "Monitor", color: [25, 25, 25], shapes: [[
        [0, 0], [1, 0]
      ]] },
      { id: 2, name: "Sofa", color: [139, 90, 90], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1]
      ]] },
      { id: 3, name: "Rug", color: [188, 143, 143], shapes: [[
        [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
        [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3]
      ]] },
      { id: 4, name: "Bookshelf", color: [139, 69, 19], shapes: [[
        [0, 0], [1, 0], [2, 0],
        [0, 1], [1, 1], [2, 1]
      ]] },
      { id: 5, name: "Coffee Table", color: [160, 82, 45], shapes: [[
        [0, 0], [1, 0], [2, 0],
        [0, 1], [1, 1], [2, 1]
      ]] },
      { id: 6, name: "Chair", color: [70, 130, 180], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] },
      { id: 7, name: "Plant", color: [34, 139, 34], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] },
      { id: 8, name: "Side Table", color: [139, 90, 43], shapes: [[
        [0, 0], [1, 0],
        [0, 1], [1, 1]
      ]] }
    ],
    rules: [
      { type: "ALL_PLACED", message: "Place all items" },
      { type: "NO_OVERLAP", message: "No overlapping items" },
      { type: "AGAINST_WALL", itemId: 0, message: "Large Desk against wall" },
      { type: "ON_TOP", itemId: 1, baseId: 0, message: "Monitor on Large Desk" },
      { type: "RUG_UNDER", itemIds: [2, 5], rugId: 3, message: "Rug under Sofa and Coffee Table" },
      { type: "AGAINST_WALL", itemId: 4, message: "Bookshelf against wall" }
    ]
  }
];