// levels.js - Level definitions and data

export const LEVEL_DATA = [
  {
    level: 1,
    moves: 8,
    categories: ["FRUITS", "COLORS"],
    words: {
      "FRUITS": ["APPLE", "BANANA", "ORANGE"],
      "COLORS": ["RED", "BLUE", "GREEN"]
    },
    initialBoard: ["FRUITS", null, "COLORS", null]
  },
  {
    level: 2,
    moves: 10,
    categories: ["ANIMALS", "VEHICLES"],
    words: {
      "ANIMALS": ["DOG", "CAT", "BIRD", "FISH"],
      "VEHICLES": ["CAR", "BIKE", "BOAT"]
    },
    initialBoard: [null, "ANIMALS", null, "VEHICLES"]
  },
  {
    level: 3,
    moves: 12,
    categories: ["SPORTS", "MUSIC", "FOOD"],
    words: {
      "SPORTS": ["SOCCER", "TENNIS"],
      "MUSIC": ["PIANO", "GUITAR", "DRUMS"],
      "FOOD": ["PIZZA", "PASTA"]
    },
    initialBoard: ["SPORTS", null, null, "MUSIC", null, "FOOD"]
  },
  {
    level: 4,
    moves: 15,
    categories: ["WEATHER", "EMOTIONS", "TOOLS"],
    words: {
      "WEATHER": ["RAIN", "SNOW", "WIND", "SUN"],
      "EMOTIONS": ["HAPPY", "SAD", "ANGRY"],
      "TOOLS": ["HAMMER", "SAW", "DRILL"]
    },
    initialBoard: [null, "WEATHER", null, null, "EMOTIONS", null, "TOOLS"]
  },
  {
    level: 5,
    moves: 18,
    categories: ["PLANETS", "GEMS", "TREES", "DRINKS"],
    words: {
      "PLANETS": ["MARS", "VENUS", "EARTH"],
      "GEMS": ["RUBY", "EMERALD"],
      "TREES": ["OAK", "PINE", "MAPLE"],
      "DRINKS": ["TEA", "COFFEE", "JUICE"]
    },
    initialBoard: ["PLANETS", null, null, "GEMS", null, "TREES", null, null, "DRINKS"]
  }
];

export function getLevelData(levelNum) {
  const index = (levelNum - 1) % LEVEL_DATA.length;
  return LEVEL_DATA[index];
}