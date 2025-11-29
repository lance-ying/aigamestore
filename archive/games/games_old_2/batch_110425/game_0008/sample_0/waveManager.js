// waveManager.js - Enemy wave spawning and management

import { gameState, MAP_WIDTH, MAP_HEIGHT, ENEMY_STATS } from './globals.js';
import { Enemy } from './entities.js';

let waveTimer = 0;
let enemiesThisWave = 0;
let enemiesSpawned = 0;
const WAVE_DELAY = 300; // 5 seconds between waves
const ENEMIES_PER_WAVE = 8;

export function initWaves() {
  waveTimer = WAVE_DELAY;
  enemiesThisWave = 0;
  enemiesSpawned = 0;
  gameState.wave = 0;
}

export function updateWaves(p) {
  waveTimer--;
  
  if (waveTimer <= 0 && gameState.wave < gameState.totalWaves) {
    startNextWave(p);
  }
  
  // Spawn enemies gradually during wave
  if (enemiesSpawned < enemiesThisWave) {
    if (waveTimer % 30 === 0) { // Spawn every 0.5 seconds
      spawnEnemy(p);
      enemiesSpawned++;
    }
  }
}

function startNextWave(p) {
  gameState.wave++;
  enemiesThisWave = ENEMIES_PER_WAVE + (gameState.wave - 1) * 3;
  enemiesSpawned = 0;
  waveTimer = 600; // Time to complete wave
  
  // Log wave start
  p.logs.game_info.push({
    data: { phase: "WAVE_START", wave: gameState.wave },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function spawnEnemy(p) {
  // Determine enemy type based on wave
  let type = 'basic';
  const rand = p.random();
  
  if (gameState.wave >= 3) {
    if (rand < 0.3) type = 'tank';
    else if (rand < 0.6) type = 'fast';
  } else if (gameState.wave >= 2) {
    if (rand < 0.4) type = 'fast';
  }
  
  // Spawn from right side at various Y positions
  const spawnX = MAP_WIDTH - 50;
  const spawnY = p.random(100, MAP_HEIGHT - 100);
  
  const enemy = new Enemy(spawnX, spawnY, type);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
}

export function isWaveActive() {
  return gameState.enemies.length > 0 || enemiesSpawned < enemiesThisWave;
}

export function allWavesComplete() {
  return gameState.wave >= gameState.totalWaves && !isWaveActive();
}