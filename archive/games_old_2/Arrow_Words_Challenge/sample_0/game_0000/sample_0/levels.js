// levels.js - Level data definitions

export const LEVELS = [
  // Level 1: The Basics (6x6 grid)
  {
    id: 1,
    name: "The Basics",
    gridSize: { rows: 6, cols: 6 },
    maxTime: 180, // 3 minutes
    hintCost: 50,
    cells: [
      [{ type: 'clue', text: 'Feline', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'clue', text: 'Insect', dir: 'down' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'clue', text: 'Canine', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Color', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Hot', dir: 'down' }],
      [{ type: 'clue', text: 'Cold', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Bird', dir: 'right' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }]
    ],
    solution: [
      ['C', 'A', 'T', 'B', 'E', 'E'],
      ['D', 'O', 'G', 'N', 'T', 'S'],
      ['B', 'R', 'E', 'T', 'U', 'U'],
      ['I', 'C', 'E', 'D', 'N', 'N'],
      ['B', 'E', 'D', 'B', 'O', 'W'],
      ['B', 'D', 'B', 'U', 'L', 'L']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'CAT' },
      { clue: { row: 1, col: 0 }, dir: 'right', answer: 'DOG' },
      { clue: { row: 3, col: 0 }, dir: 'right', answer: 'ICED' },
      { clue: { row: 4, col: 4 }, dir: 'right', answer: 'OWL' },
      { clue: { row: 0, col: 3 }, dir: 'down', answer: 'BENT' },
      { clue: { row: 2, col: 1 }, dir: 'down', answer: 'RED' },
      { clue: { row: 2, col: 5 }, dir: 'down', answer: 'SUN' }
    ]
  },
  
  // Level 2: Building Blocks (9x9 grid)
  {
    id: 2,
    name: "Building Blocks",
    gridSize: { rows: 9, cols: 9 },
    maxTime: 300, // 5 minutes
    hintCost: 75,
    cells: [
      [{ type: 'clue', text: 'Planet', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Fruit', dir: 'down' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Ocean', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Metal', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Tree', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Food', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'clue', text: 'City', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Animal', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Sport', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Month', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Color', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }]
    ],
    solution: [
      ['E', 'A', 'R', 'T', 'H', 'B', 'A', 'P', 'P'],
      ['B', 'T', 'L', 'A', 'I', 'I', 'R', 'O', 'N'],
      ['O', 'A', 'K', 'S', 'B', 'R', 'P', 'N', 'L'],
      ['P', 'L', 'B', 'R', 'E', 'A', 'D', 'E', 'E'],
      ['P', 'A', 'R', 'I', 'S', 'T', 'Z', 'N', 'A'],
      ['A', 'N', 'R', 'E', 'G', 'T', 'E', 'N', 'P'],
      ['J', 'U', 'N', 'E', 'B', 'R', 'B', 'N', 'P'],
      ['U', 'T', 'O', 'S', 'G', 'R', 'E', 'E', 'N'],
      ['N', 'I', 'N', 'T', 'E', 'R', 'R', 'A', 'L']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'EARTH' },
      { clue: { row: 1, col: 5 }, dir: 'right', answer: 'IRON' },
      { clue: { row: 2, col: 0 }, dir: 'right', answer: 'OAKS' },
      { clue: { row: 3, col: 2 }, dir: 'right', answer: 'BREAD' },
      { clue: { row: 4, col: 0 }, dir: 'right', answer: 'PARIS' },
      { clue: { row: 5, col: 5 }, dir: 'right', answer: 'TEN' },
      { clue: { row: 6, col: 0 }, dir: 'right', answer: 'JUNE' },
      { clue: { row: 7, col: 4 }, dir: 'right', answer: 'GREEN' },
      { clue: { row: 0, col: 6 }, dir: 'down', answer: 'APP' },
      { clue: { row: 1, col: 1 }, dir: 'down', answer: 'TALANT' },
      { clue: { row: 4, col: 6 }, dir: 'down', answer: 'ZEBRA' }
    ]
  },
  
  // Level 3: Interconnections (12x12 grid - simplified version)
  {
    id: 3,
    name: "Interconnections",
    gridSize: { rows: 8, cols: 8 },
    maxTime: 480, // 8 minutes
    hintCost: 100,
    cells: [
      [{ type: 'clue', text: 'Country', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Tool', dir: 'down' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Season', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Liquid', dir: 'right' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Vehicle', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Number', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'clue', text: 'Gem', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Fast', dir: 'down' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Dance', dir: 'right' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Room', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }]
    ],
    solution: [
      ['I', 'T', 'A', 'L', 'Y', 'H', 'H', 'A'],
      ['N', 'A', 'U', 'T', 'O', 'O', 'I', 'L'],
      ['T', 'R', 'A', 'I', 'N', 'W', 'A', 'L'],
      ['E', 'A', 'S', 'E', 'V', 'E', 'N', 'L'],
      ['R', 'U', 'B', 'Y', 'S', 'Q', 'R', 'A'],
      ['N', 'T', 'E', 'E', 'N', 'T', 'A', 'P'],
      ['S', 'T', 'U', 'D', 'Y', 'W', 'C', 'P'],
      ['T', 'U', 'M', 'N', 'E', 'R', 'E', 'L']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'ITALY' },
      { clue: { row: 1, col: 5 }, dir: 'right', answer: 'OIL' },
      { clue: { row: 2, col: 0 }, dir: 'right', answer: 'TRAIN' },
      { clue: { row: 3, col: 2 }, dir: 'right', answer: 'SEVEN' },
      { clue: { row: 4, col: 0 }, dir: 'right', answer: 'RUBYS' },
      { clue: { row: 5, col: 5 }, dir: 'right', answer: 'TAP' },
      { clue: { row: 6, col: 0 }, dir: 'right', answer: 'STUDY' },
      { clue: { row: 0, col: 6 }, dir: 'down', answer: 'HALL' },
      { clue: { row: 1, col: 1 }, dir: 'down', answer: 'AUTUMN' },
      { clue: { row: 4, col: 6 }, dir: 'down', answer: 'RACE' }
    ]
  },
  
  // Level 4: Lexical Labyrinth (simplified)
  {
    id: 4,
    name: "Lexical Labyrinth",
    gridSize: { rows: 8, cols: 8 },
    maxTime: 720, // 12 minutes
    hintCost: 125,
    cells: [
      [{ type: 'clue', text: 'Science', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Leader', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Music', dir: 'down' }, { type: 'blocked' }, { type: 'clue', text: 'Big', dir: 'down' }],
      [{ type: 'clue', text: 'Build', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Write', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Light', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Think', dir: 'right' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Power', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }]
    ],
    solution: [
      ['P', 'H', 'Y', 'S', 'I', 'C', 'S', 'L'],
      ['R', 'E', 'A', 'D', 'E', 'O', 'P', 'A'],
      ['C', 'R', 'E', 'A', 'T', 'E', 'S', 'R'],
      ['O', 'O', 'A', 'U', 'T', 'H', 'O', 'R'],
      ['B', 'R', 'I', 'G', 'H', 'T', 'L', 'G'],
      ['R', 'I', 'G', 'O', 'R', 'S', 'I', 'D'],
      ['E', 'N', 'E', 'R', 'G', 'Y', 'D', 'E'],
      ['A', 'T', 'E', 'R', 'S', 'T', 'E', 'A']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'PHYSICS' },
      { clue: { row: 2, col: 0 }, dir: 'right', answer: 'CREATES' },
      { clue: { row: 3, col: 2 }, dir: 'right', answer: 'AUTHOR' },
      { clue: { row: 4, col: 0 }, dir: 'right', answer: 'BRIGHT' },
      { clue: { row: 5, col: 6 }, dir: 'right', answer: 'ID' },
      { clue: { row: 6, col: 0 }, dir: 'right', answer: 'ENERGY' },
      { clue: { row: 1, col: 1 }, dir: 'down', answer: 'HERO' },
      { clue: { row: 1, col: 5 }, dir: 'down', answer: 'COST' },
      { clue: { row: 1, col: 7 }, dir: 'down', answer: 'LARGE' }
    ]
  },
  
  // Level 5: Master Architect (simplified)
  {
    id: 5,
    name: "Master Architect",
    gridSize: { rows: 10, cols: 10 },
    maxTime: 1080, // 18 minutes
    hintCost: 150,
    cells: [
      [{ type: 'clue', text: 'Galaxy', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }],
      [{ type: 'blocked' }, { type: 'clue', text: 'Ancient', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Math', dir: 'down' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'clue', text: 'Royal', dir: 'down' }],
      [{ type: 'clue', text: 'Complete', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Journey', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Mystery', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Art', dir: 'right' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Wisdom', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'clue', text: 'Nature', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }],
      [{ type: 'clue', text: 'Future', dir: 'right' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }],
      [{ type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }, { type: 'blocked' }, { type: 'empty' }]
    ],
    solution: [
      ['U', 'N', 'I', 'V', 'E', 'R', 'S', 'E', 'S', 'K'],
      ['N', 'O', 'M', 'A', 'D', 'U', 'M', 'P', 'I', 'I'],
      ['F', 'I', 'N', 'I', 'S', 'H', 'E', 'D', 'N', 'N'],
      ['I', 'N', 'V', 'O', 'Y', 'A', 'G', 'E', 'S', 'G'],
      ['E', 'N', 'I', 'G', 'M', 'A', 'T', 'I', 'C', 'D'],
      ['N', 'I', 'G', 'H', 'T', 'S', 'O', 'L', 'O', 'I'],
      ['K', 'N', 'O', 'W', 'L', 'E', 'D', 'G', 'E', 'O'],
      ['N', 'O', 'W', 'L', 'O', 'R', 'G', 'A', 'N', 'I'],
      ['A', 'D', 'V', 'A', 'N', 'C', 'E', 'D', 'S', 'C'],
      ['D', 'V', 'A', 'N', 'C', 'E', 'D', 'S', 'T', 'S']
    ],
    words: [
      { clue: { row: 0, col: 0 }, dir: 'right', answer: 'UNIVERSES' },
      { clue: { row: 2, col: 0 }, dir: 'right', answer: 'FINISHED' },
      { clue: { row: 3, col: 2 }, dir: 'right', answer: 'VOYAGES' },
      { clue: { row: 4, col: 0 }, dir: 'right', answer: 'ENIGMATIC' },
      { clue: { row: 5, col: 8 }, dir: 'right', answer: 'OI' },
      { clue: { row: 6, col: 0 }, dir: 'right', answer: 'KNOWLEDGE' },
      { clue: { row: 7, col: 4 }, dir: 'right', answer: 'ORGAN' },
      { clue: { row: 8, col: 0 }, dir: 'right', answer: 'ADVANCED' },
      { clue: { row: 1, col: 1 }, dir: 'down', answer: 'ONION' },
      { clue: { row: 1, col: 5 }, dir: 'down', answer: 'RULES' },
      { clue: { row: 1, col: 9 }, dir: 'down', answer: 'KINGDOM' }
    ]
  }
];