// game_logic.js - Core game logic

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';
import { Player } from './player.js';

let p;

export function initGameLogic(p5Instance) {
  p = p5Instance;
}

export function startGame() {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.player = new Player();
  gameState.entities = [gameState.player];
  gameState.currentRoom = "entrance";
  gameState.inventory = [];
  gameState.selectedInventoryIndex = -1;
  gameState.visitedRooms = new Set(["entrance"]);
  gameState.solvedPuzzles = new Set();
  gameState.unlockedDoors = new Set();
  gameState.score = 0;
  gameState.puzzlesSolved = 0;
  gameState.roomsExplored = 1;
  gameState.photos = [];
  gameState.hintsUsed = 0;
  gameState.hintCooldown = 0;
  gameState.inventoryOpen = false;
  gameState.mapOpen = false;
  gameState.cursorX = 300;
  gameState.cursorY = 200;
  gameState.hoveredHotspot = null;
  gameState.hoveredButton = null;
  gameState.lastSaveFrame = 0;
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, action: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  logPlayerInfo();
}

export function pauseGame() {
  gameState.gamePhase = PHASE_PAUSED;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PAUSED, action: "game_paused" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function unpauseGame() {
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, action: "game_unpaused" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame() {
  gameState.gamePhase = PHASE_START;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START, action: "game_restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame() {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update hint cooldown
  if (gameState.hintCooldown > 0) {
    gameState.hintCooldown--;
  }
  
  // Auto-save check
  if (p.frameCount - gameState.lastSaveFrame >= gameState.saveInterval) {
    autoSave();
  }
  
  // Update entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
  
  // Check win condition
  if (gameState.solvedPuzzles.has("throne_secret")) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, action: "game_won" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  if (p.frameCount % 60 === 0) {
    logPlayerInfo();
  }
}

function autoSave() {
  gameState.lastSaveFrame = p.frameCount;
  // In a real game, would save to localStorage
}

function logPlayerInfo() {
  if (!gameState.player) return;
  
  p.logs.player_info.push({
    screen_x: gameState.cursorX,
    screen_y: gameState.cursorY,
    game_x: gameState.cursorX,
    game_y: gameState.cursorY,
    framecount: p.frameCount
  });
}