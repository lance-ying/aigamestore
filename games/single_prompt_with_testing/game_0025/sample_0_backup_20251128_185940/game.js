// game.js - Main game file

import { 
  gameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  resetGameState,
  ROD_UPGRADES
} from './globals.js';

import { Player } from './player.js';
import { FishingLine } from './fishingLine.js';
import { WaterArea, Tree, Rock } from './environment.js';
import { drawStartScreen, drawGameOverScreen, drawUI, drawShop } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  let lastLoggedPlayerX = 0;
  let lastLoggedPlayerY = 0;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize environment
    initializeEnvironment(p);
    
    // Initialize player
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
    gameState.entities.push(gameState.player);
    
    // Log initial state
    logGameInfo(p, "Game initialized", { phase: gameState.gamePhase });
    logPlayerInfo(p);
  };

  p.draw = function() {
    // Apply automated testing controls if not in HUMAN mode
    if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === GAME_PHASES.PLAYING) {
      applyAutomatedControls(p);
    }

    // Render based on game phase
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        drawGameplay(p);
        break;
        
      case GAME_PHASES.PAUSED:
        drawGameplay(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameplay(p);
        drawGameOverScreen(p);
        break;
    }
  };

  function drawGameplay(p) {
    // Background
    p.background(100, 160, 100);
    
    // Draw environment
    for (let entity of gameState.entities) {
      if (entity.type === 'water') entity.draw(p);
    }
    
    for (let entity of gameState.entities) {
      if (entity.type === 'tree' || entity.type === 'rock') entity.draw(p);
    }
    
    // Update and draw player
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.player.update(p);
      
      // Log player position changes
      const dx = Math.abs(gameState.player.x - lastLoggedPlayerX);
      const dy = Math.abs(gameState.player.y - lastLoggedPlayerY);
      if (dx > 5 || dy > 5) {
        logPlayerInfo(p);
        lastLoggedPlayerX = gameState.player.x;
        lastLoggedPlayerY = gameState.player.y;
      }
    }
    
    gameState.player.draw(p);
    
    // Update and draw fishing line
    if (gameState.fishingLine) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.fishingLine.update(p);
        
        // Check if fishing is complete
        if (gameState.fishingLine.state === 'caught') {
          if (gameState.fishingLine.caughtFish) {
            gameState.fishingLine.caughtFish.displayUntil = p.frameCount + 120;
          }
          gameState.fishingLine = null;
          
          // Check win condition
          if (gameState.fishJournal.size >= 10) {
            gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
            logGameInfo(p, "Game won", { 
              phase: GAME_PHASES.GAME_OVER_WIN,
              fishCaught: gameState.totalFishCaught,
              journalComplete: true
            });
          }
        }
      }
      
      if (gameState.fishingLine) {
        gameState.fishingLine.draw(p);
      }
    }
    
    // Draw UI
    drawUI(p);
    
    // Draw shop overlay
    if (gameState.shopOpen) {
      drawShop(p);
    }
  }

  function initializeEnvironment(p) {
    // Clear existing environment entities
    gameState.entities = gameState.entities.filter(e => e.type === 'player');
    gameState.waterAreas = [];
    gameState.trees = [];
    gameState.rocks = [];
    
    // Create water areas
    const water1 = new WaterArea(50, 80, 200, 120);
    const water2 = new WaterArea(350, 100, 200, 140);
    const water3 = new WaterArea(150, 250, 300, 100);
    
    gameState.waterAreas.push(water1, water2, water3);
    gameState.entities.push(water1, water2, water3);
    
    // Create trees
    const trees = [
      new Tree(100, 250),
      new Tree(520, 200),
      new Tree(300, 80),
      new Tree(450, 320)
    ];
    
    gameState.trees.push(...trees);
    gameState.entities.push(...trees);
    
    // Create rocks
    const rocks = [
      new Rock(280, 200, 15),
      new Rock(80, 350, 12),
      new Rock(500, 350, 14)
    ];
    
    gameState.rocks.push(...rocks);
    gameState.entities.push(...rocks);
  }

  function applyAutomatedControls(p) {
    const action = get_automated_testing_action(gameState);
    
    if (action && action.keys) {
      // Reset velocities
      gameState.player.velocityX = 0;
      gameState.player.velocityY = 0;
      
      // Apply movement
      const isSprinting = action.keys.includes(16);
      if (action.keys.includes(37)) gameState.player.move('LEFT', isSprinting);
      if (action.keys.includes(39)) gameState.player.move('RIGHT', isSprinting);
      if (action.keys.includes(38)) gameState.player.move('UP', isSprinting);
      if (action.keys.includes(40)) gameState.player.move('DOWN', isSprinting);
      
      // Handle space (fishing)
      if (action.keys.includes(32)) {
        handleSpace(p);
      }
      
      // Handle Z (shop)
      if (action.keys.includes(90)) {
        handleShop(p);
      }
    }
  }

  function handleSpace(p) {
    if (gameState.fishingLine) {
      if (gameState.fishingLine.state === 'biting' || gameState.fishingLine.state === 'waiting') {
        gameState.fishingLine.reel();
      }
    } else if (gameState.player.canFish()) {
      castLine(p);
    }
  }

  function castLine(p) {
    const currentRod = ROD_UPGRADES[gameState.rodLevel];
    const castDistance = currentRod.castRange;
    
    // Find nearest water
    let nearestWater = null;
    let minDist = Infinity;
    
    for (let water of gameState.waterAreas) {
      const centerX = water.x + water.width / 2;
      const centerY = water.y + water.height / 2;
      const dist = Math.sqrt(
        Math.pow(gameState.player.x - centerX, 2) +
        Math.pow(gameState.player.y - centerY, 2)
      );
      
      if (dist < minDist) {
        minDist = dist;
        nearestWater = water;
      }
    }
    
    if (nearestWater) {
      const targetX = p.constrain(
        nearestWater.x + nearestWater.width / 2 + p.random(-30, 30),
        nearestWater.x + 20,
        nearestWater.x + nearestWater.width - 20
      );
      const targetY = p.constrain(
        nearestWater.y + nearestWater.height / 2 + p.random(-20, 20),
        nearestWater.y + 20,
        nearestWater.y + nearestWater.height - 20
      );
      
      gameState.fishingLine = new FishingLine(p, gameState.player.x, gameState.player.y - 10, targetX, targetY);
      gameState.entities.push(gameState.fishingLine);
    }
  }

  function handleShop(p) {
    if (!gameState.fishingLine) {
      gameState.shopOpen = !gameState.shopOpen;
      
      if (gameState.shopOpen) {
        // Try to buy next rod upgrade
        const nextLevel = gameState.rodLevel + 1;
        if (nextLevel < ROD_UPGRADES.length) {
          const nextRod = ROD_UPGRADES[nextLevel];
          if (gameState.money >= nextRod.cost) {
            gameState.money -= nextRod.cost;
            gameState.rodLevel = nextLevel;
            logGameInfo(p, "Rod upgraded", { 
              rodLevel: gameState.rodLevel,
              rodName: ROD_UPGRADES[gameState.rodLevel].name
            });
          }
        }
      }
    }
  }

  p.keyPressed = function() {
    logInput(p, "keyPressed", p.key, p.keyCode);
    
    // Phase transition keys
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        resetGameState();
        logGameInfo(p, "Game started", { phase: GAME_PHASES.PLAYING });
      }
      return;
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo(p, "Game paused", { phase: GAME_PHASES.PAUSED });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo(p, "Game resumed", { phase: GAME_PHASES.PLAYING });
      }
      return;
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        resetGameState();
        initializeEnvironment(p);
        logGameInfo(p, "Game restarted", { phase: GAME_PHASES.START });
      }
      return;
    }
    
    // Gameplay keys (only in PLAYING phase and HUMAN mode)
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === 'HUMAN') {
      if (p.keyCode === 32) { // SPACE
        handleSpace(p);
      }
      
      if (p.keyCode === 90) { // Z
        handleShop(p);
      }
    }
  };

  p.keyReleased = function() {
    logInput(p, "keyReleased", p.key, p.keyCode);
  };

  function logGameInfo(p, message, data) {
    p.logs.game_info.push({
      message,
      data,
      frameCount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logInput(p, inputType, key, keyCode) {
    p.logs.inputs.push({
      input_type: inputType,
      data: { key, keyCode },
      frameCount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logPlayerInfo(p) {
    if (gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        frameCount: p.frameCount
      });
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};