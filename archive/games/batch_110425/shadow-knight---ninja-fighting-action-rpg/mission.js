// mission.js - Mission management functions
import { gameState, MISSIONS, PHASE_PLAYING, PHASE_MISSION_COMPLETE, PHASE_UPGRADE_SCREEN, PHASE_GAME_OVER_WIN, TARGET_FPS } from './globals.js';
import { Enemy } from './enemy.js';

export function startMission(missionIndex) {
  if (missionIndex >= MISSIONS.length) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    return;
  }

  const mission = MISSIONS[missionIndex];
  gameState.currentMission = missionIndex;
  gameState.enemies = [];
  gameState.goldDrops = [];
  gameState.missionStartTime = Date.now();

  // Heal player
  gameState.playerStats.health = gameState.playerStats.maxHealth;

  // Spawn enemies
  const isFinalBoss = missionIndex === MISSIONS.length - 1;
  const enemyCount = mission.enemies;
  
  for (let i = 0; i < enemyCount; i++) {
    const x = 400 + i * 80;
    const enemy = new Enemy(x, 100, {
      health: mission.enemyHealth,
      damage: mission.enemyDamage,
      gold: Math.floor(mission.gold / enemyCount),
      isBoss: isFinalBoss && i === 0
    });
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }

  gameState.gamePhase = PHASE_PLAYING;
}

export function checkMissionComplete() {
  const allEnemiesDead = gameState.enemies.every(e => e.dead && e.deathTimer > 30);
  
  if (allEnemiesDead && gameState.enemies.length > 0) {
    gameState.gamePhase = PHASE_MISSION_COMPLETE;
    setTimeout(() => {
      gameState.gamePhase = PHASE_UPGRADE_SCREEN;
    }, 2000);
    return true;
  }
  
  return false;
}

export function handleUpgradeSelection(action) {
  const upgradeCost = 50;
  
  if (action === 'upgrade_attack' && gameState.goldCollected >= upgradeCost) {
    gameState.goldCollected -= upgradeCost;
    gameState.playerStats.attackLevel++;
    gameState.playerStats.attackDamage *= 1.05;
    return true;
  }
  
  if (action === 'upgrade_health' && gameState.goldCollected >= upgradeCost) {
    gameState.goldCollected -= upgradeCost;
    gameState.playerStats.healthLevel++;
    gameState.playerStats.maxHealth *= 1.05;
    gameState.playerStats.health = gameState.playerStats.maxHealth;
    return true;
  }
  
  return false;
}

export function proceedToNextMission() {
  const nextMission = gameState.currentMission + 1;
  
  if (nextMission >= MISSIONS.length) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  } else {
    startMission(nextMission);
  }
}