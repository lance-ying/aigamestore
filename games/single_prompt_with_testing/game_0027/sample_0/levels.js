// levels.js - Level definitions

import { TYPE_BABA, TYPE_WALL, TYPE_ROCK, TYPE_FLAG, TYPE_GRASS, TYPE_WATER } from './globals.js';
import { WORD_NOUN, WORD_IS, WORD_PROPERTY } from './globals.js';

export const LEVELS = [
  {
    name: "FIRST STEPS",
    entities: [
      { type: TYPE_BABA, x: 2, y: 5 },
      { type: TYPE_FLAG, x: 12, y: 5 },
      { type: TYPE_WALL, x: 5, y: 3 },
      { type: TYPE_WALL, x: 5, y: 4 },
      { type: TYPE_WALL, x: 5, y: 5 },
      { type: TYPE_WALL, x: 5, y: 6 },
      { type: TYPE_WALL, x: 5, y: 7 },
      { type: TYPE_WALL, x: 9, y: 3 },
      { type: TYPE_WALL, x: 9, y: 4 },
      { type: TYPE_WALL, x: 9, y: 5 },
      { type: TYPE_WALL, x: 9, y: 6 },
      { type: TYPE_WALL, x: 9, y: 7 }
    ],
    wordBlocks: [
      { wordType: WORD_NOUN, word: "BABA", x: 1, y: 1 },
      { wordType: WORD_IS, word: "IS", x: 2, y: 1 },
      { wordType: WORD_PROPERTY, word: "YOU", x: 3, y: 1 },
      { wordType: WORD_NOUN, word: "FLAG", x: 11, y: 1 },
      { wordType: WORD_IS, word: "IS", x: 12, y: 1 },
      { wordType: WORD_PROPERTY, word: "WIN", x: 13, y: 1 },
      { wordType: WORD_NOUN, word: "WALL", x: 6, y: 8 },
      { wordType: WORD_IS, word: "IS", x: 7, y: 8 },
      { wordType: WORD_PROPERTY, word: "STOP", x: 8, y: 8 }
    ]
  },
  {
    name: "CHANGE YOURSELF",
    entities: [
      { type: TYPE_BABA, x: 2, y: 5 },
      { type: TYPE_ROCK, x: 7, y: 5 },
      { type: TYPE_FLAG, x: 12, y: 5 },
      { type: TYPE_WALL, x: 5, y: 2 },
      { type: TYPE_WALL, x: 5, y: 3 },
      { type: TYPE_WALL, x: 5, y: 4 },
      { type: TYPE_WALL, x: 5, y: 5 },
      { type: TYPE_WALL, x: 5, y: 6 },
      { type: TYPE_WALL, x: 5, y: 7 },
      { type: TYPE_WALL, x: 5, y: 8 }
    ],
    wordBlocks: [
      { wordType: WORD_NOUN, word: "BABA", x: 1, y: 1 },
      { wordType: WORD_IS, word: "IS", x: 2, y: 1 },
      { wordType: WORD_PROPERTY, word: "YOU", x: 3, y: 1 },
      { wordType: WORD_NOUN, word: "FLAG", x: 11, y: 1 },
      { wordType: WORD_IS, word: "IS", x: 12, y: 1 },
      { wordType: WORD_PROPERTY, word: "WIN", x: 13, y: 1 },
      { wordType: WORD_NOUN, word: "WALL", x: 6, y: 8 },
      { wordType: WORD_IS, word: "IS", x: 7, y: 8 },
      { wordType: WORD_PROPERTY, word: "STOP", x: 8, y: 8 },
      { wordType: WORD_NOUN, word: "ROCK", x: 7, y: 2 },
      { wordType: WORD_IS, word: "IS", x: 7, y: 3 },
      { wordType: WORD_PROPERTY, word: "PUSH", x: 7, y: 4 }
    ]
  },
  {
    name: "ADVANCED PUZZLES",
    entities: [
      { type: TYPE_BABA, x: 2, y: 5 },
      { type: TYPE_ROCK, x: 7, y: 5 },
      { type: TYPE_FLAG, x: 12, y: 2 },
      { type: TYPE_GRASS, x: 7, y: 7 },
      { type: TYPE_GRASS, x: 8, y: 7 },
      { type: TYPE_WATER, x: 10, y: 5 },
      { type: TYPE_WATER, x: 11, y: 5 }
    ],
    wordBlocks: [
      { wordType: WORD_NOUN, word: "BABA", x: 1, y: 1 },
      { wordType: WORD_IS, word: "IS", x: 2, y: 1 },
      { wordType: WORD_PROPERTY, word: "YOU", x: 3, y: 1 },
      { wordType: WORD_NOUN, word: "FLAG", x: 11, y: 8 },
      { wordType: WORD_IS, word: "IS", x: 12, y: 8 },
      { wordType: WORD_PROPERTY, word: "WIN", x: 13, y: 8 },
      { wordType: WORD_NOUN, word: "ROCK", x: 5, y: 1 },
      { wordType: WORD_IS, word: "IS", x: 6, y: 1 },
      { wordType: WORD_PROPERTY, word: "PUSH", x: 7, y: 1 },
      { wordType: WORD_NOUN, word: "WATER", x: 5, y: 5 },
      { wordType: WORD_IS, word: "IS", x: 5, y: 6 },
      { wordType: WORD_PROPERTY, word: "SINK", x: 5, y: 7 },
      { wordType: WORD_NOUN, word: "GRASS", x: 1, y: 8 },
      { wordType: WORD_IS, word: "IS", x: 2, y: 8 },
      { wordType: WORD_PROPERTY, word: "STOP", x: 3, y: 8 }
    ]
  }
];