// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null, // Not used in this game, but required by spec
  entities: [], // All game entities
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Game-specific state
  currentStyleId: 0,
  unlockedStyles: [0],
  beatboxers: [],
  availableIcons: [],
  discoveredCombos: new Set(),
  levelProgress: 0,
  satisfactionMeter: 100,
  lastInteractionTime: 0,
  
  // UI state
  focusedIconIndex: -1,
  focusedBeatboxerIndex: -1,
  pickedUpIcon: null,
  
  // Recording state
  isRecording: false,
  recordingBuffer: [],
  isPlayingBack: false,
  playbackIndex: 0,
  playbackStartTime: 0,
  
  // Level completion state
  showLevelComplete: false,
  levelCompleteTimer: 0,
  
  // Animation state
  comboAnimationActive: false,
  comboAnimationTimer: 0,
  lastDiscoveredCombo: null,
};

// Musical styles/levels configuration
export const STYLES = [
  {
    id: 0,
    name: "Alpha Mix",
    beatboxerCount: 4,
    iconCount: 10,
    requiredCombos: 3,
    combos: [
      { icons: [0, 2, 5], name: "Basic Beat" },
      { icons: [1, 3, 7], name: "Echo Flow" },
      { icons: [4, 6, 8], name: "Rhythm Wave" }
    ],
    colors: { bg: [40, 50, 80], accent: [100, 150, 255] }
  },
  {
    id: 1,
    name: "Little Miss",
    beatboxerCount: 5,
    iconCount: 12,
    requiredCombos: 5,
    combos: [
      { icons: [0, 3, 6], name: "Percussive Pulse" },
      { icons: [1, 4, 8], name: "Syncopation" },
      { icons: [2, 5, 9], name: "Beat Drop" },
      { icons: [0, 7, 10], name: "Rhythm Master" },
      { icons: [3, 6, 11], name: "Miss Groove" }
    ],
    colors: { bg: [80, 40, 70], accent: [255, 100, 200] }
  },
  {
    id: 2,
    name: "Sunrise",
    beatboxerCount: 6,
    iconCount: 14,
    requiredCombos: 7,
    combos: [
      { icons: [0, 4, 8], name: "Morning Light" },
      { icons: [1, 5, 9], name: "Harmony Rise" },
      { icons: [2, 6, 10], name: "Vocal Blend" },
      { icons: [3, 7, 11], name: "Melodic Dawn" },
      { icons: [0, 8, 12], name: "Bright Start" },
      { icons: [1, 9, 13], name: "Golden Hour" },
      { icons: [4, 10, 13], name: "Sunrise Symphony" }
    ],
    colors: { bg: [80, 60, 40], accent: [255, 200, 100] }
  },
  {
    id: 3,
    name: "The Love",
    beatboxerCount: 8,
    iconCount: 16,
    requiredCombos: 10,
    combos: [
      { icons: [0, 5, 10], name: "Deep Emotion" },
      { icons: [1, 6, 11], name: "Heartbeat" },
      { icons: [2, 7, 12], name: "Soul Connection" },
      { icons: [3, 8, 13], name: "Passion Wave" },
      { icons: [4, 9, 14], name: "Tender Moment" },
      { icons: [0, 10, 15], name: "Love Song" },
      { icons: [1, 11, 15], name: "Emotional Depth" },
      { icons: [5, 10, 14], name: "Romantic Melody" },
      { icons: [2, 8, 15], name: "Heart & Soul" },
      { icons: [3, 9, 13, 15], name: "True Love" }
    ],
    colors: { bg: [60, 40, 60], accent: [200, 100, 200] }
  },
  {
    id: 4,
    name: "Brazil",
    beatboxerCount: 8,
    iconCount: 18,
    requiredCombos: 12,
    combos: [
      { icons: [0, 6, 12], name: "Samba Beat" },
      { icons: [1, 7, 13], name: "Carnival" },
      { icons: [2, 8, 14], name: "Bossa Nova" },
      { icons: [3, 9, 15], name: "Tropical Rhythm" },
      { icons: [4, 10, 16], name: "Rio Nights" },
      { icons: [5, 11, 17], name: "Beach Party" },
      { icons: [0, 12, 17], name: "Brazilian Soul" },
      { icons: [1, 13, 16], name: "Exotic Groove" },
      { icons: [2, 14, 15], name: "Fiesta" },
      { icons: [6, 12, 16], name: "Capoeira" },
      { icons: [8, 14, 17], name: "Amazon Dreams" },
      { icons: [0, 6, 12, 17], name: "Grand Master Combo" }
    ],
    colors: { bg: [40, 80, 50], accent: [150, 255, 100] }
  }
];

export const ICON_TYPES = ['beat', 'effect', 'melody', 'voice'];
export const ICON_COLORS = {
  beat: [255, 100, 100],
  effect: [100, 255, 100],
  melody: [100, 100, 255],
  voice: [255, 255, 100]
};

export const SATISFACTION_DECAY_RATE = 0.05; // per second
export const SATISFACTION_IDLE_THRESHOLD = 10000; // milliseconds
export const COMBO_ANIMATION_DURATION = 120; // frames
export const LEVEL_COMPLETE_DURATION = 180; // frames