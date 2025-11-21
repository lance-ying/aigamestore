// input.js - Input handling

import { KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_Z, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CONTROL_HUMAN } from './globals.js';
import { useAudioLure, sealVent, startReboot } from './systems.js';

export function handleKeyPressed(p, gameState) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions (human only)
  if (gameState.controlMode === CONTROL_HUMAN) {
    if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      startGame(p, gameState);
      return;
    }
    
    if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.noLoop();
      return;
    }
    
    if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.loop();
      return;
    }
    
    if (p.keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
      restartGame(p, gameState);
      return;
    }
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === PHASE_PLAYING) {
    processGameplayInput(p, gameState, p.keyCode);
  }
}

export function processGameplayInput(p, gameState, keyCode) {
  if (keyCode === KEY_Z) {
    // Toggle tablet
    gameState.tabletOpen = !gameState.tabletOpen;
    if (!gameState.tabletOpen) {
      gameState.selectedSystem = null;
    }
  }
  
  if (!gameState.tabletOpen) return;
  
  if (keyCode === KEY_LEFT) {
    if (gameState.selectedSystem === null) {
      // Navigate cameras
      gameState.selectedCamera = Math.max(0, gameState.selectedCamera - 1);
    } else if (gameState.selectedSystem === 'vents') {
      // No left/right in vents, just seal
    } else if (gameState.selectedSystem === 'maintenance') {
      // Navigate systems to reboot
    }
  }
  
  if (keyCode === KEY_RIGHT) {
    if (gameState.selectedSystem === null) {
      // Navigate cameras
      gameState.selectedCamera = Math.min(5, gameState.selectedCamera + 1);
    }
  }
  
  if (keyCode === KEY_UP || keyCode === KEY_DOWN) {
    // Cycle through menu options
    const modes = [null, 'audio', 'vents', 'maintenance'];
    let currentIndex = modes.indexOf(gameState.selectedSystem);
    
    if (keyCode === KEY_UP) {
      currentIndex = (currentIndex - 1 + modes.length) % modes.length;
    } else {
      currentIndex = (currentIndex + 1) % modes.length;
    }
    
    gameState.selectedSystem = modes[currentIndex];
  }
  
  if (keyCode === KEY_SPACE) {
    activateCurrentSystem(p, gameState);
  }
}

export function activateCurrentSystem(p, gameState) {
  if (gameState.selectedSystem === 'audio') {
    // Use audio lure on current camera
    useAudioLure(gameState, gameState.selectedCamera);
  } else if (gameState.selectedSystem === 'vents') {
    // Seal random vent (left or right based on arrow)
    const vent = p.random() < 0.5 ? 'left' : 'right';
    sealVent(gameState, vent);
  } else if (gameState.selectedSystem === 'maintenance') {
    // Find broken system and reboot it
    const systems = ['audio', 'camera', 'ventilation'];
    for (const sys of systems) {
      if (!gameState.systems[sys].working) {
        startReboot(gameState, sys);
        break;
      }
    }
  }
}

export function startGame(p, gameState) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.timeElapsed = 0;
  gameState.currentHour = 0;
  gameState.audioLureUsed = 0;
  gameState.ventSealsUsed = 0;
  
  // Initialize player and springtrap
  const Player = window.Player;
  const Springtrap = window.Springtrap;
  
  gameState.player = new Player();
  gameState.springtrap = new Springtrap();
  gameState.springtrap.setDifficulty(gameState.currentNight);
  
  // Reset systems
  gameState.systems.audio.working = true;
  gameState.systems.audio.cooldown = 0;
  gameState.systems.camera.working = true;
  gameState.systems.camera.cooldown = 0;
  gameState.systems.ventilation.working = true;
  gameState.systems.ventilation.cooldown = 0;
  
  gameState.vents.left.sealed = false;
  gameState.vents.left.cooldown = 0;
  gameState.vents.right.sealed = false;
  gameState.vents.right.cooldown = 0;
  
  gameState.tabletOpen = false;
  gameState.selectedCamera = 0;
  gameState.selectedSystem = null;
  gameState.phantomTimer = 0;
  gameState.phantomActive = false;
  gameState.rebootingSystem = null;
  gameState.rebootProgress = 0;
  
  gameState.entities = [];
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", night: gameState.currentNight },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame(p, gameState) {
  gameState.gamePhase = PHASE_START;
  gameState.currentNight = 1;
  gameState.timeElapsed = 0;
  gameState.player = null;
  gameState.springtrap = null;
  gameState.entities = [];
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}