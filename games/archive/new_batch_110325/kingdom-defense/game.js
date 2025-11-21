import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_TYPES } from './globals.js';
import { generatePath, drawPath } from './path.js';
import { Hero } from './hero.js';
import { WaveManager } from './waveManager.js';
import { Tower, placeTower, canPlaceTower } from './tower.js';
import { drawUI, drawStartScreen, drawPausedScreen, drawGameOverScreen } from './ui.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;
let gameInstance = new p5(p => {
  let waveManager;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize game
    initGame();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  function initGame() {
    gameState.path = generatePath();
    gameState.hero = new Hero();
    gameState.player = gameState.hero; // For compatibility
    waveManager = new WaveManager();
    
    gameState.entities = [gameState.hero];
    gameState.enemies = [];
    gameState.towers = [];
    gameState.projectiles = [];
    gameState.effects = [];
    
    gameState.score = 0;
    gameState.gold = 150;
    gameState.lives = 20;
    gameState.maxLives = 20;
    gameState.currentWave = 0;
    gameState.totalWaves = 10;
    gameState.waveInProgress = false;
    gameState.waveTimer = 180; // 3 seconds before first wave
    gameState.selectedTowerType = 1;
    gameState.selectedTower = null;
    gameState.enemiesSpawnedThisWave = 0;
    gameState.enemiesKilledThisWave = 0;
    gameState.totalEnemiesThisWave = 0;
    gameState.framesSinceWaveStart = 0;
  }
  
  p.draw = function() {
    p.background(40, 60, 40);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
      return;
    }
    
    // Draw game
    drawPath(p, gameState.path);
    
    // Get inputs
    const inputs = getInputs();
    
    // Update game state
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(inputs);
    }
    
    // Draw entities
    for (let enemy of gameState.enemies) {
      if (enemy.alive) enemy.draw(p);
    }
    
    for (let tower of gameState.towers) {
      tower.draw(p);
    }
    
    for (let projectile of gameState.projectiles) {
      if (projectile.alive) projectile.draw(p);
    }
    
    if (gameState.hero) {
      gameState.hero.draw(p);
    }
    
    // Draw tower placement preview
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      drawTowerPreview(p);
    }
    
    drawUI(p);
    
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPausedScreen(p);
    }
  };
  
  function getInputs() {
    if (gameState.controlMode !== "HUMAN") {
      return get_automated_testing_action(gameState);
    }
    
    return {
      up: p.keyIsDown(38),
      down: p.keyIsDown(40),
      left: p.keyIsDown(37),
      right: p.keyIsDown(39),
      place: false, // Handled in keyPressed
      upgrade: false, // Handled in keyPressed
      ability: false, // Handled in keyPressed
      selectTower: 0 // Handled in keyPressed
    };
  }
  
  function updateGame(inputs) {
    // Update hero
    if (gameState.hero) {
      gameState.hero.update(inputs);
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.hero.x,
          screen_y: gameState.hero.y,
          game_x: gameState.hero.x,
          game_y: gameState.hero.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Update wave manager
    if (!gameState.waveInProgress && gameState.currentWave < gameState.totalWaves) {
      gameState.waveTimer--;
      if (gameState.waveTimer <= 0) {
        waveManager.startWave();
      }
    }
    
    if (gameState.waveInProgress) {
      waveManager.update();
    }
    
    // Update enemies
    for (let enemy of gameState.enemies) {
      if (enemy.alive) {
        enemy.update();
        
        // Apply poison damage
        if (enemy.poisoned) {
          enemy.poisonDuration--;
          if (enemy.poisonDuration % 15 === 0) {
            enemy.takeDamage(enemy.poisonDamage || 2);
          }
          if (enemy.poisonDuration <= 0) {
            enemy.poisoned = false;
          }
        }
      }
    }
    
    // Clean up dead enemies
    gameState.enemies = gameState.enemies.filter(e => e.alive || e.pathProgress < 1.0);
    
    // Update towers
    for (let tower of gameState.towers) {
      tower.update(p);
    }
    
    // Update projectiles
    for (let projectile of gameState.projectiles) {
      if (projectile.alive) {
        projectile.update();
      }
    }
    gameState.projectiles = gameState.projectiles.filter(proj => proj.alive);
    
    // Handle automated testing actions
    if (gameState.controlMode !== "HUMAN") {
      handleAutomatedActions(inputs);
    }
    
    // Check game over conditions
    if (gameState.lives <= 0) {
      setGamePhase(GAME_PHASES.GAME_OVER_LOSE);
    } else if (gameState.currentWave >= gameState.totalWaves && !gameState.waveInProgress) {
      const aliveEnemies = gameState.enemies.filter(e => e.alive).length;
      if (aliveEnemies === 0) {
        setGamePhase(GAME_PHASES.GAME_OVER_WIN);
      }
    }
  }
  
  function handleAutomatedActions(inputs) {
    // Tower selection
    if (inputs.selectTower > 0 && inputs.selectTower <= 4) {
      gameState.selectedTowerType = inputs.selectTower;
    }
    
    // Tower placement
    if (inputs.place) {
      const positions = [
        { x: 120, y: 150 },
        { x: 180, y: 200 },
        { x: 280, y: 200 },
        { x: 350, y: 150 },
        { x: 420, y: 200 },
        { x: 480, y: 280 },
        { x: 200, y: 280 },
        { x: 400, y: 100 }
      ];
      
      for (let pos of positions) {
        if (canPlaceTower(pos.x, pos.y)) {
          gameState.cursorX = pos.x;
          gameState.cursorY = pos.y;
          placeTower(pos.x, pos.y, gameState.selectedTowerType);
          break;
        }
      }
    }
    
    // Tower upgrade
    if (inputs.upgrade && gameState.selectedTower) {
      gameState.selectedTower.upgrade();
    }
    
    // Hero ability
    if (inputs.ability && gameState.hero && gameState.hero.abilityReady) {
      gameState.hero.useAbility();
    }
  }
  
  function drawTowerPreview(p) {
    const config = TOWER_TYPES[gameState.selectedTowerType];
    const canAfford = gameState.gold >= config.cost;
    const validPlacement = canPlaceTower(gameState.cursorX, gameState.cursorY);
    
    p.push();
    
    // Draw range indicator
    p.fill(255, 255, 255, 20);
    p.noStroke();
    p.circle(gameState.cursorX, gameState.cursorY, config.range * 2);
    
    // Draw tower preview
    const alpha = (canAfford && validPlacement) ? 150 : 80;
    p.fill(...config.color, alpha);
    p.stroke(0, alpha);
    p.strokeWeight(2);
    
    const size = 20;
    if (gameState.selectedTowerType === 1) {
      p.triangle(
        gameState.cursorX, gameState.cursorY - size / 2,
        gameState.cursorX - size / 2, gameState.cursorY + size / 2,
        gameState.cursorX + size / 2, gameState.cursorY + size / 2
      );
    } else if (gameState.selectedTowerType === 2) {
      p.circle(gameState.cursorX, gameState.cursorY, size);
    } else if (gameState.selectedTowerType === 3) {
      p.rect(gameState.cursorX - size / 2, gameState.cursorY - size / 2, size, size);
    } else if (gameState.selectedTowerType === 4) {
      p.circle(gameState.cursorX, gameState.cursorY, size + 2);
    }
    
    p.pop();
  }
  
  function setGamePhase(newPhase) {
    gameState.gamePhase = newPhase;
    p.logs.game_info.push({
      data: { phase: newPhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        setGamePhase(GAME_PHASES.PLAYING);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        setGamePhase(GAME_PHASES.PAUSED);
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        setGamePhase(GAME_PHASES.PLAYING);
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        initGame();
        setGamePhase(GAME_PHASES.START);
      }
    }
    
    // Gameplay controls (only in PLAYING phase)
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      if (p.keyCode >= 49 && p.keyCode <= 52) { // 1-4 keys
        gameState.selectedTowerType = p.keyCode - 48;
      } else if (p.keyCode === 32) { // SPACE
        placeTower(gameState.cursorX, gameState.cursorY, gameState.selectedTowerType);
      } else if (p.keyCode === 16) { // SHIFT
        if (gameState.selectedTower) {
          gameState.selectedTower.upgrade();
        }
      } else if (p.keyCode === 90) { // Z
        if (gameState.hero && gameState.hero.abilityReady) {
          gameState.hero.useAbility();
        }
      }
    }
    
    return false;
  };
  
  p.mouseMoved = function() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.cursorX = p.mouseX;
      gameState.cursorY = p.mouseY;
    }
  };
  
  p.mouseClicked = function() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Check if clicking on existing tower to select
      for (let tower of gameState.towers) {
        const dx = p.mouseX - tower.x;
        const dy = p.mouseY - tower.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          // Deselect all towers
          for (let t of gameState.towers) {
            t.selected = false;
          }
          tower.selected = true;
          gameState.selectedTower = tower;
          return;
        }
      }
      
      // Otherwise, deselect
      for (let t of gameState.towers) {
        t.selected = false;
      }
      gameState.selectedTower = null;
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};