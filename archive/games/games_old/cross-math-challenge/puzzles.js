// puzzles.js - Puzzle definitions for all levels

export const puzzles = {
  1: {
    size: 3,
    grid: [
      [{ type: 'number', value: 2, fixed: true }, { type: 'operator', value: '+', fixed: true }, { type: 'empty' }],
      [{ type: 'operator', value: '+', fixed: true }, { type: 'empty', fixed: false }, { type: 'operator', value: '=', fixed: true }],
      [{ type: 'empty' }, { type: 'operator', value: '=', fixed: true }, { type: 'number', value: 6, fixed: true }]
    ],
    solution: [
      [{ row: 0, col: 2, value: 3 }, { row: 1, col: 1, value: 1 }, { row: 2, col: 0, value: 3 }]
    ]
  },
  2: {
    size: 4,
    grid: [
      [{ type: 'number', value: 3, fixed: true }, { type: 'operator', value: '*', fixed: true }, { type: 'empty' }, { type: 'operator', value: '=', fixed: true }],
      [{ type: 'operator', value: '-', fixed: true }, { type: 'empty', fixed: false }, { type: 'operator', value: '+', fixed: true }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'operator', value: '=', fixed: true }, { type: 'number', value: 8, fixed: true }, { type: 'empty' }],
      [{ type: 'operator', value: '=', fixed: true }, { type: 'number', value: 6, fixed: true }, { type: 'empty', fixed: false }, { type: 'empty' }]
    ],
    solution: [
      [{ row: 0, col: 2, value: 4 }, { row: 1, col: 1, value: 2 }, { row: 1, col: 3, value: 2 }, { row: 2, col: 0, value: 1 }, { row: 2, col: 3, value: 0 }, { row: 3, col: 2, value: 0 }, { row: 3, col: 3, value: 0 }]
    ]
  },
  3: {
    size: 5,
    grid: [
      [{ type: 'number', value: 8, fixed: true }, { type: 'operator', value: '/', fixed: true }, { type: 'empty' }, { type: 'operator', value: '+', fixed: true }, { type: 'number', value: 3, fixed: true }],
      [{ type: 'operator', value: '+', fixed: true }, { type: 'empty', fixed: false }, { type: 'operator', value: '*', fixed: true }, { type: 'empty' }, { type: 'operator', value: '=', fixed: true }],
      [{ type: 'empty' }, { type: 'operator', value: '=', fixed: true }, { type: 'number', value: 6, fixed: true }, { type: 'empty', fixed: false }, { type: 'empty' }],
      [{ type: 'operator', value: '-', fixed: true }, { type: 'empty', fixed: false }, { type: 'empty', fixed: false }, { type: 'operator', value: '=', fixed: true }, { type: 'empty' }],
      [{ type: 'operator', value: '=', fixed: true }, { type: 'number', value: 10, fixed: true }, { type: 'empty', fixed: false }, { type: 'empty', fixed: false }, { type: 'empty' }]
    ],
    solution: [
      [{ row: 0, col: 2, value: 2 }, { row: 1, col: 1, value: 2 }, { row: 1, col: 3, value: 2 }, { row: 2, col: 0, value: 12 }, { row: 2, col: 3, value: 0 }, { row: 2, col: 4, value: 0 }, { row: 3, col: 1, value: 2 }, { row: 3, col: 2, value: 0 }, { row: 3, col: 4, value: 0 }, { row: 4, col: 2, value: 0 }, { row: 4, col: 3, value: 0 }, { row: 4, col: 4, value: 0 }]
    ]
  },
  4: {
    size: 6,
    grid: [
      [{ type: 'number', value: 15, fixed: true }, { type: 'operator', value: '/', fixed: true }, { type: 'empty' }, { type: 'operator', value: '*', fixed: true }, { type: 'empty' }, { type: 'operator', value: '=', fixed: true }],
      [{ type: 'operator', value: '-', fixed: true }, { type: 'empty', fixed: false }, { type: 'operator', value: '+', fixed: true }, { type: 'empty' }, { type: 'operator', value: '-', fixed: true }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'operator', value: '=', fixed: true }, { type: 'number', value: 12, fixed: true }, { type: 'empty', fixed: false }, { type: 'empty', fixed: false }, { type: 'empty' }],
      [{ type: 'operator', value: '*', fixed: true }, { type: 'empty', fixed: false }, { type: 'empty', fixed: false }, { type: 'operator', value: '=', fixed: true }, { type: 'number', value: 18, fixed: true }, { type: 'empty' }],
      [{ type: 'empty' }, { type: 'operator', value: '=', fixed: true }, { type: 'empty', fixed: false }, { type: 'empty', fixed: false }, { type: 'empty', fixed: false }, { type: 'empty' }],
      [{ type: 'operator', value: '=', fixed: true }, { type: 'number', value: 20, fixed: true }, { type: 'empty', fixed: false }, { type: 'empty', fixed: false }, { type: 'empty', fixed: false }, { type: 'empty' }]
    ],
    solution: [
      [{ row: 0, col: 2, value: 3 }, { row: 0, col: 4, value: 2 }, { row: 1, col: 1, value: 5 }, { row: 1, col: 3, value: 7 }, { row: 1, col: 5, value: 0 }, { row: 2, col: 0, value: 10 }, { row: 2, col: 3, value: 0 }, { row: 2, col: 4, value: 0 }, { row: 2, col: 5, value: 0 }, { row: 3, col: 1, value: 2 }, { row: 3, col: 2, value: 0 }, { row: 3, col: 5, value: 0 }, { row: 4, col: 0, value: 0 }, { row: 4, col: 2, value: 0 }, { row: 4, col: 3, value: 0 }, { row: 4, col: 4, value: 0 }, { row: 4, col: 5, value: 0 }, { row: 5, col: 2, value: 0 }, { row: 5, col: 3, value: 0 }, { row: 5, col: 4, value: 0 }, { row: 5, col: 5, value: 0 }]
    ]
  }
};