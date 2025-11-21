// game.js - Main game file

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_SIZE,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  UNIT_WARRIOR,
  UNIT_ARCHER,
  UNIT_SORCERER
} from './globals.js';

import { LEVELS, getLevelConfig } from './levels.js';
import { Unit, UNIT_STATS } from './units.js';
import { Structure } from './structures.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let testController = null;
let lastUpdateTime = 0;

// Load high score from localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  const savedHighScore = window.localStorage.getItem('pixelFortressSiege_highScore');
  if (savedHighScore) {
    gameState.highScore = parseInt(savedHighScore, 10);
  }
}

function saveHighScore() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('pixelFortressSiege_highScore', gameState.highScore.toString());
  }
}

function initLevel(p, levelNumber) {
  const config = getLevelConfig(levelNumber);
  if (!config) {
    console.error('Invalid level number:', levelNumber);
    return;
  }
  
  gameState.levelNumber = levelNumber;
  gameState.playerGold = config.startingGold;
  gameState.goldPerSecond = config.goldPerSecond;
  gameState.activePlayerUnits = [];
  gameState.activeEnemyUnits = [];
  gameState.playerStructures = [];
  gameState.enemyStructures = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.entities = [];
  gameState.currentWave = 0;
  gameState.totalWaves = config.waves.length;
  gameState.waveTimer = 0;
  gameState.waveSpawnDelay = config.waves[0].delay * 1000;
  gameState.waveActive = false;
  gameState.lastGoldGenTime = Date.now();
  gameState.levelStartTime = Date.now();
  gameState.deploymentCursorPos = { x: 2, y: 10 };
  gameState.selectedUnitType = UNIT_WARRIOR;
  
  // Create player structures
  for (const structData of config.playerStructures) {
    const struct = new Structure(
      structData.type,
      structData.gridX,
      structData.gridY,
      structData.hp,
      true
    );
    gameState.playerStructures.push(struct);
    gameState.entities.push(struct);
  }
  
  // Create enemy structures
  for (const structData of config.enemyStructures) {
    const struct = new Structure(
      structData.type,
      structData.gridX,
      structData.gridY,
      structData.hp,
      false
    );
    gameState.enemyStructures.push(struct);
    gameState.entities.push(struct);
  }
  
  // Set player reference to Town Hall
  gameState.player = gameState.playerStructures.find(s => s.type === 'TOWN_HALL');
  
  // Log level start
  p.logs.game_info.push({
    data: { event: 'LEVEL_START', level: levelNumber },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Log player info
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function spawnWave(p, waveIndex) {
  const config = getLevelConfig(gameState.levelNumber);
  if (!config || waveIndex >= config.waves.length) return;
  
  const wave = config.waves[waveIndex];
  
  // Spawn units at the right edge
  for (const unitGroup of wave.units) {
    for (let i = 0; i < unitGroup.count; i++) {
      const spawnX = 28 + Math.floor(p.random(-1, 2));
      const spawnY = 5 + Math.floor(p.random(0, 10));
      
      const unit = new Unit(unitGroup.type, spawnX, spawnY, false);
      gameState.activeEnemyUnits.push(unit);
      gameState.entities.push(unit);
    }
  }
  
  gameState.currentWave++;
  gameState.waveActive = true;
  
  // Set timer for next wave
  if (gameState.currentWave < config.waves.length) {
    gameState.waveSpawnDelay = config.waves[gameState.currentWave].delay * 1000;
    gameState.waveTimer = 0;
  }
  
  p.logs.game_info.push({
    data: { event: 'WAVE_SPAWN', wave: gameState.currentWave },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function deployUnit(p, unitType, gridX, gridY) {
  const config = getLevelConfig(gameState.levelNumber);
  if (!config) return false;
  
  const cost = config.unitCosts[unitType];
  if (cost === 999 || gameState.playerGold < cost) return false;
  
  // Check if in deployment zone
  const zone = config.deploymentZone;
  if (gridX < zone.x || gridX >= zone.x + zone.width ||
      gridY < zone.y || gridY >= zone.y + zone.height) {
    return false;
  }
  
  // Deduct gold and create unit
  gameState.playerGold -= cost;
  const unit = new Unit(unitType, gridX, gridY, true);
  gameState.activePlayerUnits.push(unit);
  gameState.entities.push(unit);
  
  p.logs.game_info.push({
    data: { event: 'UNIT_DEPLOYED', type: unitType, cost: cost },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

function updateGame(p, deltaTime) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Handle test controller
  if (gameState.controlMode !== 'HUMAN' && testController) {
    const action = testController.getAction(p, deltaTime);
    if (action) {
      if (action.type === 'DEPLOY') {
        gameState.selectedUnitType = action.unitType;
        deployUnit(p, action.unitType, gameState.deploymentCursorPos.x, gameState.deploymentCursorPos.y);
      } else if (action.type === 'MOVE_CURSOR') {
        if (action.direction === 'UP') {
          gameState.deploymentCursorPos.y = Math.max(0, gameState.deploymentCursorPos.y - 1);
        } else if (action.direction === 'DOWN') {
          gameState.deploymentCursorPos.y = Math.min(19, gameState.deploymentCursorPos.y + 1);
        }
      }
    }
  }
  
  // Generate gold
  const now = Date.now();
  const goldGenInterval = 1000; // 1 second
  if (now - gameState.lastGoldGenTime >= goldGenInterval) {
    gameState.playerGold += gameState.goldPerSecond;
    gameState.lastGoldGenTime = now;
  }
  
  // Update wave spawning
  if (gameState.currentWave < gameState.totalWaves) {
    gameState.waveTimer += deltaTime;
    if (gameState.waveTimer >= gameState.waveSpawnDelay) {
      spawnWave(p, gameState.currentWave);
    }
  }
  
  // Update all units
  const allUnits = [...gameState.activePlayerUnits, ...gameState.activeEnemyUnits];
  
  for (const unit of gameState.activePlayerUnits) {
    unit.update(p, deltaTime, gameState.enemyStructures, gameState.activeEnemyUnits, gameState.projectiles);
  }
  
  for (const unit of gameState.activeEnemyUnits) {
    unit.update(p, deltaTime, gameState.playerStructures, gameState.activePlayerUnits, gameState.projectiles);
  }
  
  // Update structures
  for (const struct of gameState.enemyStructures) {
    struct.update(p, deltaTime, gameState.activePlayerUnits, gameState.projectiles);
  }
  
  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    
    if (!proj.alive) {
      gameState.projectiles.splice(i, 1);
      continue;
    }
    
    // Move projectile
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < proj.speed) {
      // Hit target
      if (proj.target && proj.target.alive && proj.target.hp > 0) {
        proj.target.takeDamage(proj.damage, p);
        
        // AOE damage
        if (proj.aoe) {
          const targets = proj.isPlayer ? gameState.activeEnemyUnits : gameState.activePlayerUnits;
          for (const target of targets) {
            if (target === proj.target || !target.alive) continue;
            const tdx = target.x - proj.targetX;
            const tdy = target.y - proj.targetY;
            const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
            if (tdist <= proj.aoeRadius) {
              target.takeDamage(proj.damage * 0.5, p);
            }
          }
        }
      }
      proj.alive = false;
    } else {
      proj.x += (dx / dist) * proj.speed;
      proj.y += (dy / dist) * proj.speed;
    }
  }
  
  // Remove dead units and award points
  for (let i = gameState.activePlayerUnits.length - 1; i >= 0; i--) {
    const unit = gameState.activePlayerUnits[i];
    if (!unit.alive && unit.deathAnimation >= 1) {
      gameState.activePlayerUnits.splice(i, 1);
      const index = gameState.entities.indexOf(unit);
      if (index > -1) gameState.entities.splice(index, 1);
    }
  }
  
  for (let i = gameState.activeEnemyUnits.length - 1; i >= 0; i--) {
    const unit = gameState.activeEnemyUnits[i];
    if (!unit.alive && unit.deathAnimation >= 1) {
      // Award points for killing enemy units
      if (unit.type === 'GOBLIN') gameState.playerScore += 10;
      else if (unit.type === 'BARBARIAN') gameState.playerScore += 20;
      else if (unit.type === 'GIANT') gameState.playerScore += 50;
      
      gameState.activeEnemyUnits.splice(i, 1);
      const index = gameState.entities.indexOf(unit);
      if (index > -1) gameState.entities.splice(index, 1);
    }
  }
  
  // Remove dead structures and award points
  for (let i = gameState.enemyStructures.length - 1; i >= 0; i--) {
    const struct = gameState.enemyStructures[i];
    if (!struct.alive && struct.deathAnimation >= 1) {
      // Award points for destroying structures
      if (struct.type === 'CANNON' || struct.type === 'ARCHER_TOWER') {
        gameState.playerScore += 100;
      } else if (struct.type === 'BARRACKS') {
        gameState.playerScore += 250;
      } else if (struct.type === 'FORTRESS') {
        gameState.playerScore += 500;
      }
      
      // Award gold for destroying structures
      gameState.playerGold += 50;
      
      gameState.enemyStructures.splice(i, 1);
      const index = gameState.entities.indexOf(struct);
      if (index > -1) gameState.entities.splice(index, 1);
    }
  }
  
  // Check lose condition - Town Hall destroyed
  if (gameState.player && (!gameState.player.alive || gameState.player.hp <= 0)) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    
    // Update high score
    if (gameState.playerScore > gameState.highScore) {
      gameState.highScore = gameState.playerScore;
      saveHighScore();
    }
    
    p.logs.game_info.push({
      data: { event: 'GAME_OVER', reason: 'TOWN_HALL_DESTROYED', score: gameState.playerScore },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check win condition - all enemy structures and units destroyed
  const primaryStructuresRemaining = gameState.enemyStructures.filter(s => 
    s.alive && (s.type === 'BARRACKS' || s.type === 'FORTRESS')
  ).length;
  
  const enemyUnitsRemaining = gameState.activeEnemyUnits.filter(u => u.alive).length;
  
  if (primaryStructuresRemaining === 0 && enemyUnitsRemaining === 0 && gameState.currentWave >= gameState.totalWaves) {
    // Level complete
    gameState.playerScore += 500; // Level bonus
    
    if (gameState.levelNumber < LEVELS.length) {
      // More levels to go
      p.logs.game_info.push({
        data: { event: 'LEVEL_COMPLETE', level: gameState.levelNumber, score: gameState.playerScore },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Auto-advance to next level after a delay
      setTimeout(() => {
        if (gameState.gamePhase === PHASE_PLAYING) {
          initLevel(p, gameState.levelNumber + 1);
        }
      }, 3000);
      
      gameState.gamePhase = PHASE_PAUSED; // Temporary pause for transition
    } else {
      // Final level complete - WIN
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      
      if (gameState.playerScore > gameState.highScore) {
        gameState.highScore = gameState.playerScore;
        saveHighScore();
      }
      
      p.logs.game_info.push({
        data: { event: 'GAME_WIN', score: gameState.playerScore },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function drawGame(p) {
  // Background
  p.background(40, 50, 30);
  
  // Draw grid
  p.stroke(50, 60, 40);
  p.strokeWeight(1);
  for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Draw deployment zone highlight
  if (gameState.gamePhase === PHASE_PLAYING) {
    const config = getLevelConfig(gameState.levelNumber);
    if (config) {
      p.fill(100, 150, 100, 30);
      p.noStroke();
      p.rect(
        config.deploymentZone.x * GRID_SIZE,
        config.deploymentZone.y * GRID_SIZE,
        config.deploymentZone.width * GRID_SIZE,
        config.deploymentZone.height * GRID_SIZE
      );
    }
  }
  
  // Draw structures
  for (const struct of gameState.playerStructures) {
    struct.draw(p);
  }
  for (const struct of gameState.enemyStructures) {
    struct.draw(p);
  }
  
  // Draw units
  for (const unit of gameState.activePlayerUnits) {
    unit.draw(p);
  }
  for (const unit of gameState.activeEnemyUnits) {
    unit.draw(p);
  }
  
  // Draw projectiles
  for (const proj of gameState.projectiles) {
    p.fill(...proj.color);
    p.noStroke();
    p.circle(proj.x, proj.y, 6);
  }
  
  // Draw deployment cursor
  if (gameState.gamePhase === PHASE_PLAYING) {
    const cursorX = gameState.deploymentCursorPos.x * GRID_SIZE;
    const cursorY = gameState.deploymentCursorPos.y * GRID_SIZE;
    const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
    
    p.stroke(255, 255, 255, 200 * pulse);
    p.strokeWeight(3);
    p.noFill();
    p.rect(cursorX, cursorY, GRID_SIZE, GRID_SIZE);
  }
  
  // Draw UI
  drawUI(p);
}

function drawUI(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(255);
  p.noStroke();
  
  // Level indicator
  p.text(`LEVEL: ${gameState.levelNumber}`, 10, 10);
  
  // Wave indicator
  if (gameState.gamePhase === PHASE_PLAYING) {
    const waveText = gameState.currentWave < gameState.totalWaves ?
      `WAVE: ${gameState.currentWave}/${gameState.totalWaves}` :
      `WAVE: ${gameState.totalWaves}/${gameState.totalWaves} - CLEAR!`;
    p.textAlign(p.CENTER, p.TOP);
    p.text(waveText, CANVAS_WIDTH / 2, 10);
  }
  
  // Gold and score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`GOLD: ${Math.floor(gameState.playerGold)}`, CANVAS_WIDTH - 10, 10);
  p.text(`SCORE: ${gameState.playerScore.toString().padStart(6, '0')}`, CANVAS_WIDTH - 10, 30);
  
  // Unit selection panel
  if (gameState.gamePhase === PHASE_PLAYING) {
    const config = getLevelConfig(gameState.levelNumber);
    if (config) {
      const panelY = CANVAS_HEIGHT - 60;
      const panelHeight = 55;
      
      p.fill(30, 30, 30, 200);
      p.rect(0, panelY, CANVAS_WIDTH, panelHeight);
      
      // Draw unit options
      const units = [
        { type: UNIT_WARRIOR, key: 'W', cost: config.unitCosts.WARRIOR },
        { type: UNIT_ARCHER, key: 'A', cost: config.unitCosts.ARCHER },
        { type: UNIT_SORCERER, key: 'S', cost: config.unitCosts.SORCERER }
      ];
      
      for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        if (unit.cost === 999) continue;
        
        const x = 60 + i * 120;
        const y = panelY + 10;
        const size = 30;
        
        // Highlight selected
        if (gameState.selectedUnitType === unit.type) {
          p.stroke(255, 200, 50);
          p.strokeWeight(3);
          p.noFill();
          p.rect(x - size / 2 - 5, y - 5, size + 10, size + 10);
        }
        
        // Draw unit icon
        const stats = UNIT_STATS[unit.type];
        p.fill(...stats.color);
        p.noStroke();
        
        if (unit.type === UNIT_WARRIOR) {
          p.rect(x - size / 2, y, size, size);
        } else if (unit.type === UNIT_ARCHER) {
          p.circle(x, y + size / 2, size);
        } else if (unit.type === UNIT_SORCERER) {
          p.triangle(x, y, x - size / 2, y + size, x + size / 2, y + size);
        }
        
        // Draw cost
        const canAfford = gameState.playerGold >= unit.cost;
        p.fill(...(canAfford ? [255, 255, 255] : [150, 150, 150]));
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(12);
        p.text(`${unit.key}: ${unit.cost}g`, x, y + size + 5);
      }
    }
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED && gameState.levelNumber <= LEVELS.length) {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.fill(255, 255, 100);
    p.text('PAUSED', CANVAS_WIDTH - 10, 50);
  }
}

function drawStartScreen(p) {
  p.background(20, 30, 20);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 100);
  p.textSize(36);
  p.text('PIXEL FORTRESS SIEGE', CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text('Deploy units to destroy the enemy fortress', CANVAS_WIDTH / 2, 130);
  p.text('while defending your Town Hall!', CANVAS_WIDTH / 2, 150);
  
  p.textSize(12);
  p.text('CONTROLS:', CANVAS_WIDTH / 2, 190);
  p.text('Arrow Keys - Move deployment cursor', CANVAS_WIDTH / 2, 210);
  p.text('W/A/S - Select Warrior/Archer/Sorcerer', CANVAS_WIDTH / 2, 230);
  p.text('Space - Deploy unit at cursor', CANVAS_WIDTH / 2, 250);
  p.text('ESC - Pause/Unpause', CANVAS_WIDTH / 2, 270);
  p.text('R - Restart game', CANVAS_WIDTH / 2, 290);
  
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  
  if (gameState.highScore > 0) {
    p.fill(150, 200, 255);
    p.textSize(14);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 370);
  }
}

function drawGameOverScreen(p) {
  p.background(20, 20, 30);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text('VICTORY!', CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text('You conquered all fortresses!', CANVAS_WIDTH / 2, 180);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('DEFEAT', CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text('Your Town Hall was destroyed!', CANVAS_WIDTH / 2, 180);
  }
  
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`FINAL SCORE: ${gameState.playerScore}`, CANVAS_WIDTH / 2, 240);
  
  if (gameState.playerScore === gameState.highScore && gameState.highScore > 0) {
    p.fill(255, 200, 50);
    p.textSize(16);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, 270);
  }
  
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 330);
}

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { event: 'GAME_INIT', phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    lastUpdateTime = Date.now();
  };
  
  p.draw = function() {
    const now = Date.now();
    const deltaTime = now - lastUpdateTime;
    lastUpdateTime = now;
    
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p, deltaTime);
      drawGame(p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      drawGame(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // ENTER - Start game
    if (p.keyCode === 13) {
      if (gameState.gamePhase === PHASE_START) {
        gameState.gamePhase = PHASE_PLAYING;
        gameState.playerScore = 0;
        initLevel(p, 1);
        
        p.logs.game_info.push({
          data: { event: 'GAME_START' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { event: 'GAME_PAUSED' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        lastUpdateTime = Date.now();
        p.logs.game_info.push({
          data: { event: 'GAME_RESUMED' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R - Restart
    if (p.keyCode === 82) {
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { event: 'GAME_RESTART' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (gameState.gamePhase === PHASE_PLAYING) {
      // Arrow keys - Move cursor
      if (p.keyCode === 37) { // LEFT
        gameState.deploymentCursorPos.x = Math.max(0, gameState.deploymentCursorPos.x - 1);
      } else if (p.keyCode === 39) { // RIGHT
        gameState.deploymentCursorPos.x = Math.min(29, gameState.deploymentCursorPos.x + 1);
      } else if (p.keyCode === 38) { // UP
        gameState.deploymentCursorPos.y = Math.max(0, gameState.deploymentCursorPos.y - 1);
      } else if (p.keyCode === 40) { // DOWN
        gameState.deploymentCursorPos.y = Math.min(19, gameState.deploymentCursorPos.y + 1);
      }
      
      // W - Select Warrior
      if (p.key === 'w' || p.key === 'W') {
        gameState.selectedUnitType = UNIT_WARRIOR;
      }
      
      // A - Select Archer
      if (p.key === 'a' || p.key === 'A') {
        gameState.selectedUnitType = UNIT_ARCHER;
      }
      
      // S - Select Sorcerer
      if (p.key === 's' || p.key === 'S') {
        gameState.selectedUnitType = UNIT_SORCERER;
      }
      
      // Space - Deploy unit
      if (p.keyCode === 32) {
        deployUnit(
          p,
          gameState.selectedUnitType,
          gameState.deploymentCursorPos.x,
          gameState.deploymentCursorPos.y
        );
      }
    }
    
    return false;
  };
});

// Expose game instance
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  if (mode !== 'HUMAN') {
    testController = new TestController(mode);
  } else {
    testController = null;
  }
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { event: 'CONTROL_MODE_CHANGE', mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};