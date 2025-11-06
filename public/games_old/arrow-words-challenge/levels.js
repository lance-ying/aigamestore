// levels.js - Level data definitions

export const LEVELS = [
  // Level 1: Simple 3-letter words (5x5 grid)
  {
    id: 1,
    name: "The Basics",
    gridSize: { rows: 5, cols: 5 },
    maxTime: 180, // 3 minutes
    hintCost: 50,
    cells: [
      [{ type: 'clue', text: 'Feline pet', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Canine pet', dir: 'down' }, { type: 'blocked' }, { type: 'clue', text: 'Hot drink', dir: 'down' }, { type: 'blocked' }],
      [{ type: 'clue', text: 'Flying mammal', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }]
    ],
    solution: [
      ['X', 'C', 'A', 'T', 'X'],
      ['X', 'D', 'X', 'T', 'X'],
      ['X', 'B', 'A', 'T', 'X'],
      ['X', 'O', 'X', 'E', 'X'],
      ['X', 'G', 'X', 'A', 'X']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'CAT' },
      { clue: { row: 2, col: 0 }, dir: 'right', answer: 'BAT' },
      { clue: { row: 1, col: 1 }, dir: 'down', answer: 'DOG' },
      { clue: { row: 1, col: 3 }, dir: 'down', answer: 'TEA' }
    ]
  },
  
  // Level 2: 4-letter words (6x6 grid)
  {
    id: 2,
    name: "Building Blocks",
    gridSize: { rows: 6, cols: 6 },
    maxTime: 300, // 5 minutes
    hintCost: 75,
    cells: [
      [{ type: 'clue', text: 'Reading material', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Body of water', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Opposite of hot', dir: 'down' }],
      [{ type: 'clue', text: 'Opposite of stop', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Red fruit', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Ruler of a kingdom', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }]
    ],
    solution: [
      ['X', 'B', 'O', 'O', 'K', 'X'],
      ['X', 'O', 'X', 'O', 'X', 'C'],
      ['X', 'S', 'T', 'A', 'R', 'T'],
      ['X', 'T', 'A', 'P', 'P', 'L'],
      ['X', 'Q', 'U', 'E', 'E', 'N'],
      ['X', 'O', 'X', 'L', 'X', 'D']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'BOOK' },
      { clue: { row: 2, col: 0 }, dir: 'right', answer: 'START' },
      { clue: { row: 3, col: 2 }, dir: 'right', answer: 'APPL' },
      { clue: { row: 4, col: 0 }, dir: 'right', answer: 'QUEEN' },
      { clue: { row: 1, col: 1 }, dir: 'down', answer: 'BOSTQ' },
      { clue: { row: 1, col: 5 }, dir: 'down', answer: 'CTLN' }
    ]
  },
  
  // Level 3: 5-letter words (7x7 grid)
  {
    id: 3,
    name: "Word Master",
    gridSize: { rows: 7, cols: 7 },
    maxTime: 420, // 7 minutes
    hintCost: 100,
    cells: [
      [{ type: 'clue', text: 'Opposite of night', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Precipitation', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Yellow citrus', dir: 'down' }, { type: 'blocked' }],
      [{ type: 'clue', text: 'Frozen water', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Bird home', dir: 'right' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Large body of water', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }]
    ],
    solution: [
      ['X', 'L', 'I', 'G', 'H', 'T', 'X'],
      ['X', 'R', 'X', 'I', 'X', 'L', 'X'],
      ['X', 'F', 'R', 'O', 'S', 'T', 'X'],
      ['X', 'A', 'X', 'R', 'N', 'E', 'S'],
      ['X', 'O', 'C', 'E', 'A', 'N', 'X'],
      ['X', 'I', 'X', 'L', 'X', 'E', 'X'],
      ['X', 'N', 'X', 'S', 'X', 'T', 'X']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'LIGHT' },
      { clue: { row: 2, col: 0 }, dir: 'right', answer: 'FROST' },
      { clue: { row: 3, col: 4 }, dir: 'right', answer: 'NES' },
      { clue: { row: 4, col: 0 }, dir: 'right', answer: 'OCEAN' },
      { clue: { row: 1, col: 1 }, dir: 'down', answer: 'RRAIN' },
      { clue: { row: 1, col: 5 }, dir: 'down', answer: 'LEMON' }
    ]
  },
  
  // Level 4: Mixed lengths (8x8 grid)
  {
    id: 4,
    name: "Challenge Mode",
    gridSize: { rows: 8, cols: 8 },
    maxTime: 540, // 9 minutes
    hintCost: 125,
    cells: [
      [{ type: 'clue', text: 'Water falling from sky', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Flying insect', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Green vegetable', dir: 'down' }, { type: 'blocked' }, { type: 'clue', text: 'Large mammal', dir: 'down' }],
      [{ type: 'clue', text: 'Musical instrument', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Light color', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Fast land animal', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }]
    ],
    solution: [
      ['X', 'S', 'T', 'O', 'R', 'M', 'X', 'X'],
      ['X', 'B', 'X', 'O', 'X', 'P', 'X', 'B'],
      ['X', 'P', 'I', 'A', 'N', 'O', 'X', 'E'],
      ['X', 'E', 'X', 'W', 'P', 'I', 'N', 'K'],
      ['X', 'C', 'H', 'E', 'E', 'T', 'X', 'A'],
      ['X', 'H', 'X', 'L', 'X', 'A', 'X', 'R'],
      ['X', 'A', 'X', 'S', 'X', 'T', 'X', 'S'],
      ['X', 'T', 'X', 'T', 'X', 'O', 'X', 'E']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'STORM' },
      { clue: { row: 2, col: 0 }, dir: 'right', answer: 'PIANO' },
      { clue: { row: 3, col: 4 }, dir: 'right', answer: 'PINK' },
      { clue: { row: 4, col: 0 }, dir: 'right', answer: 'CHEET' },
      { clue: { row: 1, col: 1 }, dir: 'down', answer: 'BEECHAT' },
      { clue: { row: 1, col: 5 }, dir: 'down', answer: 'POTATO' },
      { clue: { row: 1, col: 7 }, dir: 'down', answer: 'BEARS' }
    ]
  },
  
  // Level 5: Expert (8x8 grid, complex)
  {
    id: 5,
    name: "Expert Challenge",
    gridSize: { rows: 8, cols: 8 },
    maxTime: 720, // 12 minutes
    hintCost: 150,
    cells: [
      [{ type: 'clue', text: 'Large African animal', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Sweet dessert', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Stringed instrument', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Tall plant', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Blue planet', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Hot season', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }]
    ],
    solution: [
      ['X', 'E', 'L', 'E', 'P', 'H', 'A', 'N'],
      ['X', 'C', 'X', 'L', 'X', 'V', 'X', 'T'],
      ['X', 'P', 'L', 'A', 'N', 'T', 'X', 'S'],
      ['X', 'A', 'X', 'E', 'E', 'A', 'R', 'T'],
      ['X', 'S', 'U', 'M', 'M', 'E', 'R', 'H'],
      ['X', 'T', 'X', 'R', 'X', 'R', 'X', 'E'],
      ['X', 'R', 'X', 'S', 'X', 'N', 'X', 'R'],
      ['X', 'Y', 'X', 'T', 'X', 'S', 'X', 'S']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'ELEPHANT' },
      { clue: { row: 2, col: 0 }, dir: 'right', answer: 'PLANT' },
      { clue: { row: 3, col: 4 }, dir: 'right', answer: 'EART' },
      { clue: { row: 4, col: 0 }, dir: 'right', answer: 'SUMMER' },
      { clue: { row: 1, col: 1 }, dir: 'down', answer: 'CPASTRY' },
      { clue: { row: 1, col: 5 }, dir: 'down', answer: 'HTERNS' }
    ]
  }
];