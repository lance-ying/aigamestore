// game_logic.js - Core game logic

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  SECONDS_PER_HOUR,
  TARGET_FPS,
  START_HOUR,
  END_HOUR,
  INITIAL_POWER,
  POWER_DRAIN_BASE,
  POWER_PER_DOOR,
  POWER_PER_VENT,
  POWER_PER_HOSE,
  POWER_GENERATOR_COST,
  POWER_GENERATOR_GAIN,
  POWER_BOOST_GAIN,
  PRIZE_ITEMS,
  ANIMATRONIC_TYPES
} from './globals.js';
import { Animatronic } from './animatronic.js';
import { Player } from './player.js';

let p5Instance = null;

export function initGame(p) {
  p5Instance = p;
  
  // Initialize player
  gameState.player = new Player();
  
  // Initialize animatronics (simplified set for gameplay)
  gameState.animatronics = [
    new Animatronic("DOOR_LEFT", 5),
    new Animatronic("DOOR_RIGHT", 5),
    new Animatronic("VENT_LEFT", 7),
    new Animatronic("VENT_RIGHT", 7),
    new Animatronic("HOSE_LEFT", 6),
    new Animatronic("HOSE_RIGHT", 6),
    new Animatronic("MUSIC_BOX", 8),
    new Animatronic("CAMERA_LEFT", 4),
    new Animatronic("CAMERA_RIGHT", 4)
  ];
}

export function startGame() {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.currentHour = START_HOUR;
  gameState.framesSinceHourStart = 0;
  gameState.power = INITIAL_POWER;
  gameState.fazCoins = 0;
  gameState.score = 0;
  gameState.jumpscaresAvoided = 0;
  gameState.coinsCollected = 0;
  gameState.inventory = [];
  gameState.prizeCounterOpen = false;
  
  // Reset systems
  gameState.systems = {
    leftDoor: false,
    rightDoor: false,
    leftVent: false,
    rightVent: false,
    leftHose: false,
    rightHose: false,
    generator: false,
    musicBox: 100,
    leftCamera: false,
    rightCamera: false
  };
  
  gameState.activeEffects = {
    doorLockTimer: 0,
    ventSealTimer: 0
  };
  
  // Reset animatronics
  for (const anim of gameState.animatronics) {
    anim.reset();
  }
  
  // Reset player
  if (gameState.player) {
    gameState.player.alive = true;
    gameState.player.stress = 0;
  }
  
  gameState.testingData = {
    framesSurvived: 0,
    lastActionFrame: 0,
    positionHistory: []
  };
  
  // Log game start
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { phase: "PLAYING", event: "game_started" },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateGame() {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update time
  gameState.framesSinceHourStart++;
  const framesPerHour = SECONDS_PER_HOUR * TARGET_FPS;
  
  if (gameState.framesSinceHourStart >= framesPerHour) {
    gameState.currentHour++;
    gameState.framesSinceHourStart = 0;
    gameState.score += 100;
    
    // Check win condition
    if (gameState.currentHour >= END_HOUR) {
      gameOver(true);
      return;
    }
  }
  
  // Update power
  updatePower();
  
  // Check power depletion
  if (gameState.power <= 0) {
    gameState.power = 0;
    // Disable all systems
    for (const key in gameState.systems) {
      if (key !== "musicBox") {
        gameState.systems[key] = false;
      }
    }
  }
  
  // Update music box
  updateMusicBox();
  
  // Update active effects
  updateActiveEffects();
  
  // Update animatronics
  for (const anim of gameState.animatronics) {
    anim.update();
    
    // Check for jumpscare
    if (anim.checkAttack()) {
      gameOver(false);
      return;
    }
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
    
    // Log player info periodically
    if (p5Instance && p5Instance.frameCount % 60 === 0) {
      const pos = gameState.player.getPosition();
      p5Instance.logs.player_info.push({
        screen_x: pos.x,
        screen_y: pos.y,
        game_x: pos.x,
        game_y: pos.y,
        framecount: p5Instance.frameCount
      });
    }
  }
  
  // Update score
  gameState.score += 1;
  
  // Testing data
  gameState.testingData.framesSurvived++;
}

function updatePower() {
  let drain = POWER_DRAIN_BASE;
  
  // Add drain for active systems
  if (gameState.systems.leftDoor) drain += POWER_PER_DOOR;
  if (gameState.systems.rightDoor) drain += POWER_PER_DOOR;
  if (gameState.systems.leftVent) drain += POWER_PER_VENT;
  if (gameState.systems.rightVent) drain += POWER_PER_VENT;
  if (gameState.systems.leftHose) drain += POWER_PER_HOSE;
  if (gameState.systems.rightHose) drain += POWER_PER_HOSE;
  if (gameState.systems.leftCamera) drain += 0.02;
  if (gameState.systems.rightCamera) drain += 0.02;
  
  gameState.power = Math.max(0, gameState.power - drain);
}

function updateMusicBox() {
  if (gameState.systems.musicBox > 0) {
    gameState.systems.musicBox -= 0.15;
    if (gameState.systems.musicBox < 0) {
      gameState.systems.musicBox = 0;
    }
  }
}

function updateActiveEffects() {
  if (gameState.activeEffects.doorLockTimer > 0) {
    gameState.activeEffects.doorLockTimer--;
  }
  if (gameState.activeEffects.ventSealTimer > 0) {
    gameState.activeEffects.ventSealTimer--;
  }
}

export function toggleSystem(systemKey) {
  if (systemKey === "generator") {
    useGenerator();
  } else if (systemKey === "musicBox") {
    windMusicBox();
  } else {
    // Toggle boolean systems
    gameState.systems[systemKey] = !gameState.systems[systemKey];
  }
}

function useGenerator() {
  if (gameState.fazCoins >= POWER_GENERATOR_COST) {
    gameState.fazCoins -= POWER_GENERATOR_COST;
    gameState.power = Math.min(100, gameState.power + POWER_GENERATOR_GAIN);
  }
}

function windMusicBox() {
  gameState.systems.musicBox = Math.min(100, gameState.systems.musicBox + 30);
}

export function usePowerBoost() {
  if (gameState.power < 100) {
    gameState.power = Math.min(100, gameState.power + POWER_BOOST_GAIN);
  }
}

export function openPrizeCounter() {
  gameState.prizeCounterOpen = true;
  gameState.selectedPrizeIndex = 0;
}

export function closePrizeCounter() {
  gameState.prizeCounterOpen = false;
}

export function purchasePrizeItem() {
  if (gameState.selectedPrizeIndex >= 0 && gameState.selectedPrizeIndex < PRIZE_ITEMS.length) {
    const item = PRIZE_ITEMS[gameState.selectedPrizeIndex];
    
    if (gameState.fazCoins >= item.cost) {
      gameState.fazCoins -= item.cost;
      gameState.inventory.push(item);
      
      // Apply effect
      applyItemEffect(item.effect);
    }
  }
}

function applyItemEffect(effect) {
  switch (effect) {
    case "power_boost":
      gameState.power = Math.min(100, gameState.power + 20);
      break;
    case "door_lock":
      gameState.activeEffects.doorLockTimer = 300; // 5 seconds
      break;
    case "vent_seal":
      gameState.activeEffects.ventSealTimer = 300;
      break;
  }
}

export function changePrizeSelection(direction) {
  if (direction === "up") {
    gameState.selectedPrizeIndex = Math.max(0, gameState.selectedPrizeIndex - 1);
  } else if (direction === "down") {
    gameState.selectedPrizeIndex = Math.min(PRIZE_ITEMS.length - 1, gameState.selectedPrizeIndex + 1);
  }
}

function gameOver(won) {
  gameState.gamePhase = won ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
  
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase, 
        event: won ? "victory" : "defeat",
        score: gameState.score,
        hoursSurvived: gameState.currentHour
      },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function pauseGame() {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    
    if (p5Instance) {
      p5Instance.logs.game_info.push({
        data: { phase: "PAUSED", event: "game_paused" },
        framecount: p5Instance.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function resumeGame() {
  if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    
    if (p5Instance) {
      p5Instance.logs.game_info.push({
        data: { phase: "PLAYING", event: "game_resumed" },
        framecount: p5Instance.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function restartGame() {
  gameState.gamePhase = PHASE_START;
  
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { phase: "START", event: "game_restarted" },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}