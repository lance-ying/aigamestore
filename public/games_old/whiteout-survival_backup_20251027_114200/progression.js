// progression.js - Level progression and objectives

import { gameState, LEVEL_DEFINITIONS, PLAYING_SUBSTATES } from './globals.js';
import { initializeMap } from './map.js';
import { createStartingHero, createRecruitableHero } from './hero.js';

export function checkLevelObjectives() {
  if (gameState.playingSubstate === PLAYING_SUBSTATES.LEVEL_COMPLETE) return;
  
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  if (!levelDef) return;
  
  const objectives = levelDef.objectives;
  let allMet = true;
  
  // Check resource objectives
  if (objectives.ice && gameState.resources.ice < objectives.ice) allMet = false;
  if (objectives.wood && gameState.resources.wood < objectives.wood) allMet = false;
  if (objectives.food && gameState.resources.food < objectives.food) allMet = false;
  
  // Check city center level
  if (objectives.cityCenterLevel && gameState.cityBuildings.cityCenter < objectives.cityCenterLevel) {
    allMet = false;
  }
  
  // Check hero count
  if (objectives.heroCount) {
    const recruitedCount = gameState.heroes.filter(h => h.isRecruited).length;
    if (recruitedCount < objectives.heroCount) allMet = false;
  }
  
  // Check building upgrades
  if (objectives.buildingUpgrades) {
    const totalUpgrades = Object.values(gameState.cityBuildings).reduce((a, b) => a + b, 0);
    if (totalUpgrades < objectives.buildingUpgrades) allMet = false;
  }
  
  // Check max hero level
  if (objectives.maxHeroLevel) {
    const maxLevel = Math.max(...gameState.heroes.filter(h => h.isRecruited).map(h => h.level));
    if (maxLevel < objectives.maxHeroLevel) allMet = false;
  }
  
  // Check defeated combat zones
  if (objectives.defeatedCombatZones) {
    for (const zoneId of objectives.defeatedCombatZones) {
      const zone = gameState.mapState.combatZones.find(z => z.id === zoneId);
      if (!zone || !zone.defeated) {
        allMet = false;
        break;
      }
    }
  }
  
  if (allMet) {
    completeLevel();
  }
}

export function completeLevel() {
  gameState.playingSubstate = PLAYING_SUBSTATES.LEVEL_COMPLETE;
  
  // Award level completion bonus
  gameState.score += 500;
  
  // Calculate speed bonus
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  if (levelDef.targetTurnCount && gameState.turnCount < levelDef.targetTurnCount) {
    const speedBonus = (levelDef.targetTurnCount - gameState.turnCount) * 10;
    gameState.score += speedBonus;
  }
}

export function advanceToNextLevel() {
  gameState.currentLevel++;
  gameState.turnCount = 0;
  
  if (gameState.currentLevel > 5) {
    // Game won!
    gameState.gamePhase = "GAME_OVER_WIN";
    gameState.score += 2000; // Final completion bonus
    saveHighScore(gameState.score);
  } else {
    // Initialize next level
    initializeMap(gameState.currentLevel);
    gameState.playingSubstate = PLAYING_SUBSTATES.EXPLORE;
  }
}

export function initializeGame() {
  // Reset game state
  gameState.resources = { ice: 0, wood: 0, food: 0 };
  gameState.cityBuildings = { cityCenter: 0, storage: 0, barracks: 0, heroHall: 0 };
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.turnCount = 0;
  gameState.selectedMapObject = null;
  gameState.hoveredObject = null;
  gameState.menuSelection = 0;
  gameState.combatData = null;
  gameState.animations = [];
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  
  // Create starting hero
  gameState.heroes = [createStartingHero()];
  
  // Create additional recruitable heroes
  for (let i = 1; i <= 6; i++) {
    gameState.heroes.push(createRecruitableHero(i));
  }
  
  // Initialize map
  initializeMap(1);
  
  // Set player reference
  gameState.player = {
    x: 300,
    y: 200,
    screenX: 300,
    screenY: 200
  };
  
  gameState.entities = [gameState.player];
  
  gameState.playingSubstate = PLAYING_SUBSTATES.EXPLORE;
  gameState.gamePhase = "PLAYING";
}

export function saveHighScore(score) {
  if (typeof localStorage === 'undefined') return;
  
  const highScores = getHighScores();
  highScores.push(score);
  highScores.sort((a, b) => b - a);
  highScores.splice(5); // Keep top 5
  
  localStorage.setItem('whiteoutSurvivalHighScores', JSON.stringify(highScores));
}

export function getHighScores() {
  if (typeof localStorage === 'undefined') return [];
  
  const stored = localStorage.getItem('whiteoutSurvivalHighScores');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}