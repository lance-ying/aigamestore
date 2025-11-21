const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Events } = Matter;

import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Candy, Monster, Star, Rope, Bubble, AirCushion, Platform } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { getLevelData } from './levels.js';

function initializeGame(p) {
  // Clear previous entities
  gameState.entities = [];
  gameState.ropes = [];
  gameState.devices = [];
  gameState.stars = [];
  gameState.monsters = [];
  gameState.selectableItems = [];
  
  // Get level data
  const levelData = getLevelData(gameState.currentLevel, p);
  
  // Create platforms
  levelData.platforms.forEach(plat => {
    const platform = new Platform(p, plat.x, plat.y, plat.width, plat.height);
    gameState.entities.push(platform);
  });
  
  // Create candy
  gameState.candy = new Candy(p, levelData.candy.x, levelData.candy.y);
  gameState.entities.push(gameState.candy);
  
  // Create ropes
  levelData.ropes.forEach(ropeData => {
    const rope = new Rope(p, ropeData.x1, ropeData.y1, ropeData.x2, ropeData.y2, ropeData.attachToCandy);
    if (rope.attachToCandy) {
      rope.attachCandy(gameState.candy);
    }
    gameState.ropes.push(rope);
    gameState.selectableItems.push({ type: 'rope', item: rope });
  });
  
  // Create devices
  if (levelData.devices) {
    levelData.devices.forEach(deviceData => {
      let device;
      if (deviceData.type === 'bubble') {
        device = new Bubble(p, deviceData.x, deviceData.y);
      } else if (deviceData.type === 'cushion') {
        device = new AirCushion(p, deviceData.x, deviceData.y, deviceData.width);
      }
      if (device) {
        gameState.devices.push(device);
        gameState.selectableItems.push({ type: 'device', item: device });
      }
    });
  }
  
  // Create stars
  levelData.stars.forEach(starData => {
    const star = new Star(p, starData.x, starData.y);
    gameState.stars.push(star);
    gameState.entities.push(star);
  });
  
  // Create monsters
  levelData.monsters.forEach(monsterData => {
    const monster = new Monster(p, monsterData.x, monsterData.y, monsterData.type);
    gameState.monsters.push(monster);
    gameState.entities.push(monster);
  });
  
  // Reset game state
  gameState.starsCollected = 0;
  gameState.monstersEaten = 0;
  gameState.selectedIndex = 0;
  gameState.levelStartTime = p.millis();
  gameState.testActionTimer = 0;
  gameState.testPhase = 0;
  
  // Update selection
  updateSelection();
}

function updateSelection() {
  gameState.selectableItems.forEach(s => s.item.selected = false);
  if (gameState.selectableItems.length > 0) {
    const selectedItem = gameState.selectableItems[gameState.selectedIndex];
    if (selectedItem && selectedItem.item) {
      selectedItem.item.selected = true;
    }
  }
}

function resetGame(p) {
  // Clear Matter.js world
  World.clear(gameState.world, false);
  Events.off(gameState.engine);
  
  // Reset game state
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.gamePhase = GAME_PHASES.START;
  
  // Reinitialize physics
  setupCollisionHandling(p);
  
  p.logs.game_info.push({
    data: { event: 'game_reset', gamePhase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function updateGame(p) {
  // Update candy
  if (gameState.candy) {
    gameState.candy.update();
    
    // Check if candy fell off
    if (gameState.candy.collected && gameState.monstersEaten === 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.GAME_OVER_LOSE },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Update stars
  gameState.stars.forEach(star => star.update());
  
  // Update monsters
  gameState.monsters.forEach(monster => monster.update());
  
  // Update devices
  gameState.devices.forEach(device => device.update());
  
  // Update time
  gameState.timeElapsed = p.millis() - gameState.levelStartTime;
  
  // Automated testing logic
  if (gameState.controlMode === CONTROL_MODES.TEST_1) {
    gameState.testActionTimer++;
    
    if (gameState.testPhase === 0 && gameState.testActionTimer > 60) {
      // Cut first rope after 1 second
      if (gameState.ropes[0]) {
        gameState.ropes[0].cutRope();
        p.logs.game_info.push({
          data: { event: 'test_cut_rope', ropeIndex: 0 },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      gameState.testPhase = 1;
      gameState.testActionTimer = 0;
    }
    
    if (gameState.testPhase === 1 && gameState.testActionTimer > 120) {
      // Cut second rope if exists
      if (gameState.ropes[1]) {
        gameState.ropes[1].cutRope();
        p.logs.game_info.push({
          data: { event: 'test_cut_rope', ropeIndex: 1 },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      gameState.testPhase = 2;
    }
  }
  
  if (gameState.controlMode === CONTROL_MODES.TEST_2) {
    gameState.testActionTimer++;
    
    // Optimal sequence for level 1
    if (gameState.currentLevel === 1) {
      if (gameState.testPhase === 0 && gameState.testActionTimer > 30) {
        if (gameState.ropes[0]) {
          gameState.ropes[0].cutRope();
        }
        gameState.testPhase = 1;
      }
    }
    
    // Optimal sequence for level 2
    if (gameState.currentLevel === 2) {
      if (gameState.testPhase === 0 && gameState.testActionTimer > 40) {
        if (gameState.ropes[0]) {
          gameState.ropes[0].cutRope();
        }
        gameState.testPhase = 1;
        gameState.testActionTimer = 0;
      }
      if (gameState.testPhase === 1 && gameState.testActionTimer > 100) {
        // Activate bubble
        if (gameState.devices[0] && gameState.candy) {
          gameState.devices[0].activate(gameState.candy);
        }
        gameState.testPhase = 2;
      }
    }
  }
}

function renderStartScreen(p) {
  p.background(135, 206, 235);
  
  // Title
  p.fill(255, 100, 150);
  p.stroke(200, 50, 100);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Cut the Rope", CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(255);
  p.noStroke();
  p.text("Time Travel Edition", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(16);
  p.textAlign(p.LEFT);
  p.fill(50);
  
  const instructions = [
    "Guide the candy to feed both Om Nom and his ancestor!",
    "",
    "← → : Select rope or device",
    "SPACE : Cut rope / Activate device",
    "Collect all stars for bonus points!",
    "",
    "PRESS ENTER TO START"
  ];
  
  let y = 180;
  instructions.forEach(line => {
    if (line === "PRESS ENTER TO START") {
      p.textAlign(p.CENTER);
      p.fill(255, 200, 0);
      p.textSize(20);
      p.text(line, CANVAS_WIDTH / 2, y);
    } else {
      p.text(line, 50, y);
    }
    y += 25;
  });
  
  // Animated candy
  const candyX = CANVAS_WIDTH / 2 + Math.sin(p.frameCount * 0.05) * 30;
  const candyY = 140 + Math.cos(p.frameCount * 0.05) * 10;
  p.fill(255, 100, 150);
  p.stroke(255, 50, 100);
  p.strokeWeight(2);
  p.circle(candyX, candyY, 20);
}

function renderGame(p) {
  // Background
  p.background(135, 206, 235);
  
  // Draw level background decoration
  p.fill(100, 200, 100, 50);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render();
    }
  });
  
  // Render ropes
  gameState.ropes.forEach(rope => rope.render());
  
  // Render devices
  gameState.devices.forEach(device => device.render());
  
  // UI
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT);
  p.textSize(16);
  p.text(`Level: ${gameState.currentLevel}`, 10, 25);
  p.text(`Score: ${gameState.score}`, 10, 45);
  p.text(`Stars: ${gameState.starsCollected}/3`, 10, 65);
  
  // Selection indicator
  if (gameState.selectableItems.length > 0) {
    p.textAlign(p.RIGHT);
    p.text(`[${gameState.selectedIndex + 1}/${gameState.selectableItems.length}]`, CANVAS_WIDTH - 10, 25);
  }
  
  // Control mode indicator
  if (gameState.controlMode !== CONTROL_MODES.HUMAN) {
    p.fill(255, 200, 0);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text(`TEST MODE: ${gameState.controlMode}`, CANVAS_WIDTH / 2, 15);
  }
}

function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderGameOver(p) {
  p.background(135, 206, 235);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.stroke(isWin ? [50, 200, 50] : [200, 50, 50]);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "LEVEL COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.noStroke();
  p.fill(50);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 170);
  p.text(`Stars: ${gameState.starsCollected}/3`, CANVAS_WIDTH / 2, 210);
  
  // Star rating
  if (isWin) {
    const starY = 250;
    for (let i = 0; i < 3; i++) {
      const starX = CANVAS_WIDTH / 2 - 60 + i * 60;
      if (i < gameState.starsCollected) {
        p.fill(255, 215, 0);
        p.stroke(255, 180, 0);
      } else {
        p.fill(150);
        p.stroke(100);
      }
      p.strokeWeight(2);
      
      // Draw star
      p.push();
      p.translate(starX, starY);
      p.beginShape();
      for (let j = 0; j < 10; j++) {
        const angle = (j * p.TWO_PI) / 10;
        const radius = j % 2 === 0 ? 20 : 10;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        p.vertex(x, y);
      }
      p.endShape(p.CLOSE);
      p.pop();
    }
  }
  
  // Instructions
  p.fill(255, 200, 0);
  p.noStroke();
  p.textSize(20);
  
  if (isWin && gameState.currentLevel < 3) {
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 320);
  } else {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
}

// Create p5 instance
let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 0.5;
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup collision handling
    setupCollisionHandling(p);
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / 60);
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        updateGame(p);
        renderGame(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // ENTER - Start game or next level
    if (p.keyCode === 13) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
        if (gameState.currentLevel < 3) {
          gameState.currentLevel++;
          gameState.gamePhase = GAME_PHASES.PLAYING;
          initializeGame(p);
          p.logs.game_info.push({
            data: { event: 'next_level', level: gameState.currentLevel },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          resetGame(p);
        }
      }
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R - Restart
    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PLAYING) {
        resetGame(p);
      }
    }
    
    // Gameplay controls (only during PLAYING)
    if (gameState.gamePhase === GAME_PHASES.PLAYING && 
        gameState.controlMode === CONTROL_MODES.HUMAN) {
      
      // Arrow keys - Select
      if (p.keyCode === 37) { // LEFT
        gameState.selectedIndex = (gameState.selectedIndex - 1 + gameState.selectableItems.length) % gameState.selectableItems.length;
        updateSelection();
      }
      
      if (p.keyCode === 39) { // RIGHT
        gameState.selectedIndex = (gameState.selectedIndex + 1) % gameState.selectableItems.length;
        updateSelection();
      }
      
      // SPACE - Cut/Activate
      if (p.keyCode === 32) {
        if (gameState.selectableItems.length > 0) {
          const selected = gameState.selectableItems[gameState.selectedIndex];
          if (selected.type === 'rope') {
            selected.item.cutRope();
            p.logs.game_info.push({
              data: { event: 'rope_cut', index: gameState.selectedIndex },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          } else if (selected.type === 'device') {
            if (gameState.candy) {
              selected.item.activate(gameState.candy);
              p.logs.game_info.push({
                data: { event: 'device_activated', index: gameState.selectedIndex },
                framecount: p.frameCount,
                timestamp: Date.now()
              });
            }
          }
        }
      }
    }
    
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  if (Object.values(CONTROL_MODES).includes(mode)) {
    gameState.controlMode = mode;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const buttonMap = {
      'HUMAN': 'humanModeBtn',
      'TEST_1': 'test_1_ModeBtn',
      'TEST_2': 'test_2_ModeBtn'
    };
    
    const activeBtn = document.getElementById(buttonMap[mode]);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
    
    console.log(`Control mode set to: ${mode}`);
  }
};