// input.js - Input handling and automated testing

import { gameState, GAME_PHASES, PLAYING_SUBSTATES } from './globals.js';
import { initializeGame, advanceToNextLevel, checkLevelObjectives } from './progression.js';
import { initiateCombat, processCombatTurn, exitCombat } from './combat.js';
import { getResourceIcon } from './map.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      initializeGame();
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    gameState.gamePhase = GAME_PHASES.START;
    p.logs.game_info.push({
      data: { phase: "START", action: "restart" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Playing phase controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handlePlayingInput(p, key, keyCode);
  }
}

function handlePlayingInput(p, key, keyCode) {
  if (gameState.playingSubstate === PLAYING_SUBSTATES.EXPLORE) {
    handleExploreInput(p, key, keyCode);
  } else if (gameState.playingSubstate === PLAYING_SUBSTATES.CITY_MENU) {
    handleCityMenuInput(p, key, keyCode);
  } else if (gameState.playingSubstate === PLAYING_SUBSTATES.COMBAT) {
    handleCombatInput(p, key, keyCode);
  } else if (gameState.playingSubstate === PLAYING_SUBSTATES.LEVEL_COMPLETE) {
    if (keyCode === 32) { // SPACE
      advanceToNextLevel();
    }
  }
}

function handleExploreInput(p, key, keyCode) {
  const player = gameState.player;
  if (!player) return;
  
  const moveSpeed = 10;
  
  // Move player
  if (keyCode === 37 || keyCode === 65) { // LEFT or A
    player.x -= moveSpeed;
    gameState.cameraX -= moveSpeed;
  } else if (keyCode === 39 || keyCode === 68) { // RIGHT or D
    player.x += moveSpeed;
    gameState.cameraX += moveSpeed;
  } else if (keyCode === 38 || keyCode === 87) { // UP or W
    player.y -= moveSpeed;
    gameState.cameraY -= moveSpeed;
  } else if (keyCode === 40 || keyCode === 83) { // DOWN or S
    player.y += moveSpeed;
    gameState.cameraY += moveSpeed;
  }
  
  // Interactions
  if (keyCode === 32) { // SPACE
    tryInteractWithNearestObject(p);
  }
  
  if (keyCode === 90) { // Z
    // Check if near city center
    const cityDist = Math.sqrt((gameState.mapState.cityCenter.x - player.x) ** 2 + 
                                (gameState.mapState.cityCenter.y - player.y) ** 2);
    if (cityDist < 60) {
      gameState.playingSubstate = PLAYING_SUBSTATES.CITY_MENU;
      gameState.menuSelection = 0;
    }
  }
}

function handleCityMenuInput(p, key, keyCode) {
  const buildingCount = 4;
  
  if (keyCode === 38 || keyCode === 87) { // UP or W
    gameState.menuSelection = (gameState.menuSelection - 1 + buildingCount) % buildingCount;
  } else if (keyCode === 40 || keyCode === 83) { // DOWN or S
    gameState.menuSelection = (gameState.menuSelection + 1) % buildingCount;
  }
  
  if (keyCode === 32) { // SPACE
    tryUpgradeBuilding(p, gameState.menuSelection);
  }
  
  if (keyCode === 90 || keyCode === 27) { // Z or ESC
    gameState.playingSubstate = PLAYING_SUBSTATES.EXPLORE;
  }
}

function handleCombatInput(p, key, keyCode) {
  if (!gameState.combatData) return;
  
  if (gameState.combatData.combatOver) {
    if (keyCode === 32) { // SPACE
      exitCombat();
    }
    return;
  }
  
  const aliveHeroes = gameState.combatData.heroes.filter(h => h.currentHP > 0);
  const aliveEnemies = gameState.combatData.enemies.filter(e => e.isAlive());
  
  if (keyCode === 38 || keyCode === 87) { // UP or W
    if (gameState.combatData.isPlayerTurn) {
      gameState.combatData.selectedHero = Math.max(0, gameState.combatData.selectedHero - 1);
    }
  } else if (keyCode === 40 || keyCode === 83) { // DOWN or S
    if (gameState.combatData.isPlayerTurn) {
      gameState.combatData.selectedHero = Math.min(aliveHeroes.length - 1, gameState.combatData.selectedHero + 1);
    }
  } else if (keyCode === 37 || keyCode === 65) { // LEFT or A
    if (gameState.combatData.isPlayerTurn) {
      gameState.combatData.selectedEnemy = Math.max(0, gameState.combatData.selectedEnemy - 1);
    }
  } else if (keyCode === 39 || keyCode === 68) { // RIGHT or D
    if (gameState.combatData.isPlayerTurn) {
      gameState.combatData.selectedEnemy = Math.min(aliveEnemies.length - 1, gameState.combatData.selectedEnemy + 1);
    }
  }
  
  if (keyCode === 32) { // SPACE
    if (gameState.combatData.isPlayerTurn) {
      processCombatTurn();
      
      // Auto-advance enemy turns
      setTimeout(() => {
        if (gameState.combatData && !gameState.combatData.isPlayerTurn && !gameState.combatData.combatOver) {
          processCombatTurn();
        }
      }, 500);
    }
  }
}

function tryInteractWithNearestObject(p) {
  const player = gameState.player;
  if (!player) return;
  
  const interactRadius = 60;
  
  // Check resource nodes
  for (const node of gameState.mapState.resourceNodes) {
    if (!node.available) continue;
    
    const dist = Math.sqrt((node.x - player.x) ** 2 + (node.y - player.y) ** 2);
    if (dist < interactRadius) {
      gatherResource(p, node);
      gameState.turnCount++;
      checkLevelObjectives();
      return;
    }
  }
  
  // Check combat zones
  for (const zone of gameState.mapState.combatZones) {
    if (zone.defeated) continue;
    
    const dist = Math.sqrt((zone.x - player.x) ** 2 + (zone.y - player.y) ** 2);
    if (dist < interactRadius) {
      initiateCombat(zone);
      return;
    }
  }
}

function gatherResource(p, node) {
  const amount = node.amount;
  gameState.resources[node.type] += amount;
  gameState.score += amount * 5;
  
  // Create animation
  const resourceIndex = node.type === "ice" ? 0 : node.type === "wood" ? 1 : 2;
  const screenX = node.x - gameState.cameraX + 300;
  const screenY = node.y - gameState.cameraY + 200;
  gameState.animations.push({
    type: "resource_collect",
    startX: screenX,
    startY: screenY,
    icon: getResourceIcon(node.type),
    resourceIndex,
    timer: 30
  });
  
  node.available = false;
}

function tryUpgradeBuilding(p, buildingIndex) {
  const buildingKeys = ["cityCenter", "storage", "barracks", "heroHall"];
  const buildingKey = buildingKeys[buildingIndex];
  
  const costs = [
    { ice: 100, wood: 50 },
    { ice: 50, wood: 80 },
    { wood: 100, food: 50 },
    { ice: 80, food: 80 }
  ];
  
  const cost = costs[buildingIndex];
  const currentLevel = gameState.cityBuildings[buildingKey];
  
  // Check if can afford
  let canAfford = true;
  for (const [resource, amount] of Object.entries(cost)) {
    const requiredAmount = amount * (currentLevel + 1);
    if (gameState.resources[resource] < requiredAmount) {
      canAfford = false;
      break;
    }
  }
  
  if (canAfford) {
    // Deduct resources
    for (const [resource, amount] of Object.entries(cost)) {
      gameState.resources[resource] -= amount * (currentLevel + 1);
    }
    
    // Upgrade building
    gameState.cityBuildings[buildingKey]++;
    gameState.score += 100;
    gameState.turnCount++;
    
    // Check for hero recruitment unlock
    if (buildingKey === "heroHall" && gameState.cityBuildings[buildingKey] <= 3) {
      const heroToRecruit = gameState.heroes.find(h => !h.isRecruited && h.id > 0);
      if (heroToRecruit) {
        heroToRecruit.isRecruited = true;
      }
    }
    
    checkLevelObjectives();
  }
}

// Automated testing
export function updateAutomatedTesting(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  if (gameState.controlMode === "TEST_1") {
    // Basic testing: Navigate through game states
    if (gameState.gamePhase === GAME_PHASES.START && p.frameCount % 60 === 0) {
      handleKeyPressed(p, '', 13); // ENTER
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING && p.frameCount % 120 === 0) {
      // Gather some resources
      const node = gameState.mapState.resourceNodes.find(n => n.available);
      if (node) {
        gatherResource(p, node);
      }
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win test: Fast-forward through game
    if (gameState.gamePhase === GAME_PHASES.START) {
      handleKeyPressed(p, '', 13); // ENTER
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.frameCount % 10 === 0) {
        // Max out resources
        gameState.resources.ice = 10000;
        gameState.resources.wood = 10000;
        gameState.resources.food = 10000;
        
        // Max out buildings
        gameState.cityBuildings.cityCenter = 5;
        gameState.cityBuildings.storage = 5;
        gameState.cityBuildings.barracks = 5;
        gameState.cityBuildings.heroHall = 5;
        
        // Level up all heroes
        gameState.heroes.forEach(h => {
          if (h.isRecruited) {
            h.level = 10;
            h.maxHP = 300;
            h.currentHP = 300;
            h.atk = 100;
            h.def = 50;
          }
        });
        
        // Complete all combat zones
        gameState.mapState.combatZones.forEach(z => z.defeated = true);
        
        checkLevelObjectives();
      }
      
      if (gameState.playingSubstate === PLAYING_SUBSTATES.LEVEL_COMPLETE && p.frameCount % 60 === 0) {
        advanceToNextLevel();
      }
    }
  }
}