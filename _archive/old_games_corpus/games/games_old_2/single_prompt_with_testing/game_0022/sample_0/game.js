// game.js
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  gameState,
  WORLD_SIZE,
  BUILDING_COUNT,
  ENEMY_COUNT,
  EVAC_X,
  EVAC_Y,
  EVAC_SIZE,
  BUILDING_INTERACTION_RANGE
} from './globals.js';
import { Player } from './player.js';
import { Building } from './building.js';
import { Enemy } from './enemy.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input_handler.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;
let gameInstance = new p5(p => {
  let renderer;
  let inputHandler;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    renderer = new Renderer(p);
    inputHandler = new InputHandler(p);
    
    // Initialize game state
    initGame();
  };
  
  function initGame() {
    // Create player
    gameState.player = new Player(200, 200);
    
    // Create buildings
    gameState.buildings = [];
    for (let i = 0; i < BUILDING_COUNT; i++) {
      const x = p.random(200, WORLD_SIZE - 200);
      const y = p.random(200, WORLD_SIZE - 200);
      gameState.buildings.push(new Building(x, y, p));
    }
    
    // Create enemies
    gameState.enemies = [];
    for (let i = 0; i < ENEMY_COUNT; i++) {
      const x = p.random(400, WORLD_SIZE - 400);
      const y = p.random(400, WORLD_SIZE - 400);
      gameState.enemies.push(new Enemy(x, y, p));
    }
    
    // Create evacuation point
    gameState.evacuationPoint = {
      x: EVAC_X,
      y: EVAC_Y,
      size: EVAC_SIZE
    };
    
    // Reset counters
    gameState.buildingsScavenged = 0;
    gameState.enemiesDefeated = 0;
    gameState.score = 0;
    gameState.lastTime = Date.now();
    
    // Combine entities
    gameState.entities = [gameState.player, ...gameState.buildings, ...gameState.enemies];
  }
  
  p.draw = function() {
    // Render based on game phase
    renderer.render(gameState);
    
    // Update game logic if playing
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame();
    }
  };
  
  function updateGame() {
    // Calculate delta time
    const currentTime = Date.now();
    const deltaTime = (currentTime - gameState.lastTime) / 1000;
    gameState.lastTime = currentTime;
    
    // Get inputs
    let inputs;
    if (gameState.controlMode === "HUMAN") {
      inputHandler.updateFromKeyboard();
      inputs = inputHandler.getInputs();
    } else {
      const action = get_automated_testing_action(gameState);
      inputHandler.updateFromAutomatedTesting(action);
      inputs = inputHandler.getInputs();
    }
    
    // Update player
    const prevX = gameState.player.x;
    const prevY = gameState.player.y;
    
    gameState.player.update(deltaTime, inputs);
    
    // Log player position if changed
    if (prevX !== gameState.player.x || prevY !== gameState.player.y) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
    
    // Update enemies
    for (let enemy of gameState.enemies) {
      if (!enemy.dead) {
        enemy.update(gameState.player, p);
      }
    }
    
    // Check player attacks
    if (gameState.player.attacking) {
      const attackPoint = gameState.player.getAttackPoint();
      
      for (let enemy of gameState.enemies) {
        if (enemy.dead) continue;
        
        if (enemy.checkHit(attackPoint.x, attackPoint.y, 30)) {
          enemy.takeDamage(25);
          if (enemy.dead) {
            gameState.enemiesDefeated++;
            gameState.score += 100;
          }
        }
      }
    }
    
    // Check building interactions (auto-scavenge when near)
    for (let building of gameState.buildings) {
      if (building.canScavenge(gameState.player.x, gameState.player.y)) {
        const loot = building.scavenge(gameState.player, p);
        if (loot) {
          gameState.buildingsScavenged++;
          gameState.score += 50;
        }
      }
    }
    
    // Check win condition (reached evacuation point)
    const dx = gameState.evacuationPoint.x - gameState.player.x;
    const dy = gameState.evacuationPoint.y - gameState.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < EVAC_SIZE) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, reason: "evacuation" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    // Check lose conditions
    if (gameState.player.health <= 0 || 
        gameState.player.hunger <= 0 || 
        gameState.player.thirst <= 0 || 
        gameState.player.radiation >= 100) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { 
          phase: PHASE_GAME_OVER_LOSE,
          health: gameState.player.health,
          hunger: gameState.player.hunger,
          thirst: gameState.player.thirst,
          radiation: gameState.player.radiation
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        gameState.gamePhase = PHASE_PLAYING;
        gameState.lastTime = Date.now();
        p.logs.game_info.push({
          data: { phase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: PHASE_PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        gameState.lastTime = Date.now();
        p.logs.game_info.push({
          data: { phase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        gameState.gamePhase = PHASE_START;
        initGame();
        p.logs.game_info.push({
          data: { phase: PHASE_START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 
                   'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  
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
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};