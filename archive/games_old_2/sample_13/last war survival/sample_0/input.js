// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER } from './globals.js';
import { HERO_CONFIG } from './config.js';
import { Hero } from './entities.js';
import { collectResources, upgradeStructure, upgradeHero } from './basebuilding.js';
import { initCombat } from './combat.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame();
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.loop();
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER) {
      restartGame();
    }
  } else if (keyCode === 16) { // Shift (pause)
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.loop();
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (gameState.gameSubState === 'COMBAT') {
      handleCombatInput(p, key, keyCode);
    } else if (gameState.gameSubState === 'BASE_BUILDING') {
      handleBaseInput(p, key, keyCode);
    }
  }
}

function handleCombatInput(p, key, keyCode) {
  // Hero selection
  if (keyCode === 87) { // W
    if (gameState.unlockedHeroes.length > 0) {
      gameState.selectedHeroType = gameState.unlockedHeroes[0];
    }
  } else if (keyCode === 65) { // A
    if (gameState.unlockedHeroes.length > 1) {
      gameState.selectedHeroType = gameState.unlockedHeroes[1];
    }
  } else if (keyCode === 83) { // S
    if (gameState.unlockedHeroes.length > 2) {
      gameState.selectedHeroType = gameState.unlockedHeroes[2];
    }
  }
  
  // Lane selection
  if (keyCode === 38) { // Arrow Up
    gameState.selectedLane = (gameState.selectedLane - 1 + 3) % 3;
  } else if (keyCode === 40) { // Arrow Down
    gameState.selectedLane = (gameState.selectedLane + 1) % 3;
  }
  
  // Deploy hero
  if (keyCode === 32) { // Space
    deployHero();
  }
}

function handleBaseInput(p, key, keyCode) {
  // Collect resources
  if (keyCode === 32) { // Space
    collectResources();
  }
}

function deployHero() {
  if (!gameState.selectedHeroType) return;
  
  const config = HERO_CONFIG[gameState.selectedHeroType];
  
  // Check cost
  if (gameState.gold < config.cost) return;
  
  // Check cooldown
  if (gameState.heroCooldowns[gameState.selectedHeroType] > 0) return;
  
  // Check lane capacity (max 5 heroes per lane)
  const heroesInLane = gameState.heroes.filter(h => h.lane === gameState.selectedLane).length;
  if (heroesInLane >= 5) return;
  
  // Deploy hero
  gameState.gold -= config.cost;
  gameState.heroCooldowns[gameState.selectedHeroType] = config.cooldown;
  
  const hero = new Hero(gameState.selectedHeroType, gameState.selectedLane, gameState.heroLevels[gameState.selectedHeroType]);
  gameState.heroes.push(hero);
  
  gameState.selectedHeroType = null;
}

function startGame() {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.gameSubState = 'BASE_BUILDING';
  
  // Initialize game
  gameState.gold = 150;
  gameState.supplies = 50;
  gameState.baseHP = 100;
  gameState.maxBaseHP = 100;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  gameState.structures.resourceGenerator.level = 1;
  gameState.structures.trainingFacility.level = 1;
  gameState.structures.commandCenter.level = 1;
  
  gameState.unlockedHeroes = ['INFANTRY', 'MEDIC'];
  gameState.heroLevels = {
    'INFANTRY': 1,
    'ENGINEER': 0,
    'MEDIC': 1
  };
  
  gameState.accumulatedGold = 0;
  gameState.accumulatedSupplies = 0;
  gameState.resourceTimer = 0;
  
  // Load high score
  const savedHighScore = localStorage.getItem('lastWarHighScore');
  if (savedHighScore) {
    gameState.highScore = parseInt(savedHighScore);
  }
  
  // Log game start
  window.gameInstance.logs.game_info.push({
    data: { phase: gameState.gamePhase, subState: gameState.gameSubState },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function restartGame() {
  gameState.gamePhase = PHASE_START;
  gameState.gameSubState = 'MENU';
  
  // Log restart
  window.gameInstance.logs.game_info.push({
    data: { phase: gameState.gamePhase, action: "restart" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

export function handleMouseClicked(p, mouseX, mouseY) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  if (gameState.gameSubState === 'BASE_BUILDING') {
    // Check structure upgrade buttons
    const structures = [
      { name: 'resourceGenerator', x: 50, y: 150 },
      { name: 'trainingFacility', x: 220, y: 150 },
      { name: 'commandCenter', x: 390, y: 150 }
    ];
    
    for (const struct of structures) {
      const data = gameState.structures[struct.name];
      if (data.level < data.maxLevel) {
        if (mouseX >= struct.x + 10 && mouseX <= struct.x + 110 &&
            mouseY >= struct.y + 60 && mouseY <= struct.y + 90) {
          upgradeStructure(struct.name);
          return;
        }
      }
    }
    
    // Check hero upgrade buttons
    let x = 20;
    const y = 295;
    for (const heroType of gameState.unlockedHeroes) {
      if (mouseX >= x + 5 && mouseX <= x + 80 &&
          mouseY >= y + 40 && mouseY <= y + 62) {
        upgradeHero(heroType);
        return;
      }
      x += 95;
    }
    
    // Check collect resources button
    if (mouseX >= p.width / 2 - 100 && mouseX <= p.width / 2 + 100 &&
        mouseY >= 140 && mouseY <= 175) {
      collectResources();
      return;
    }
    
    // Check start combat button
    if (mouseX >= p.width - 160 && mouseX <= p.width - 10 &&
        mouseY >= p.height - 50 && mouseY <= p.height - 10) {
      gameState.gameSubState = 'COMBAT';
      initCombat();
      return;
    }
  }
}

// AI testing controls
export function executeTestAction(action) {
  if (action.type === 'startGame') {
    startGame();
  } else if (action.type === 'selectHero') {
    gameState.selectedHeroType = action.heroType;
  } else if (action.type === 'selectLane') {
    gameState.selectedLane = action.lane;
  } else if (action.type === 'deployHero') {
    deployHero();
  } else if (action.type === 'collectResources') {
    collectResources();
  } else if (action.type === 'upgradeStructure') {
    upgradeStructure(action.structure);
  } else if (action.type === 'startCombat') {
    gameState.gameSubState = 'COMBAT';
    initCombat();
  } else if (action.type === 'wait') {
    // Just wait, do nothing
  }
}