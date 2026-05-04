export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  highScores: {},
  gamePhase: "START",
  controlMode: "HUMAN",
  currentMiniGame: null,
  menuSelection: 0,
  miniGameState: null,
  framesSinceStart: 0,
  totalGamesPlayed: 0
};

export const MINI_GAMES = [
  { id: 0, name: "Hoop Fever", icon: "🏀", difficulty: 1 },
  { id: 1, name: "Formula Race", icon: "🏎️", difficulty: 1 },
  { id: 2, name: "Penalty Shot", icon: "⚽", difficulty: 1 },
  { id: 3, name: "Home Run Derby", icon: "⚾", difficulty: 1 },
  { id: 4, name: "Speed Skate", icon: "⛸️", difficulty: 2 },
  { id: 5, name: "Surf Master", icon: "🏄", difficulty: 2 },
  { id: 6, name: "Tennis Ace", icon: "🎾", difficulty: 2 },
  { id: 7, name: "Ski Jump", icon: "⛷️", difficulty: 3 },
  { id: 8, name: "Boxing Ring", icon: "🥊", difficulty: 3 },
  { id: 9, name: "Golf Pro", icon: "⛳", difficulty: 3 },
  { id: 10, name: "Archery King", icon: "🎯", difficulty: 4 },
  { id: 11, name: "Hurdle Sprint", icon: "🏃", difficulty: 4 }
];

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;