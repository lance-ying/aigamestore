// game.js
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, GAME_PHASES, TILE_SIZE, MELEE_RANGE } from './globals.js';
import { Player, Enemy, Wall } from './entities.js';
import { generateLevel } from './level_generator.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  let lastLoggedPlayerState = { x: 0, y: 0 };

  function logGameInfo(data) {
    p.logs.game_info.push({
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logInput(inputType, data) {
    p.logs.inputs.push({
      input_type: inputType,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logPlayerInfo() {
    if (!gameState.player) return;
    
    const player = gameState.player;
    const dx = Math.abs(player.x - lastLoggedPlayerState.x);
    const dy = Math.abs(player.y - lastLoggedPlayerState.y);
    
    if (dx > 5 || dy > 5) {
      p.logs.player_info.push({
        screen_x: player.x - gameState.camera.x,
        screen_y: player.y - gameState.camera.y,
        game_x: player.x,
        game_y: player.y,
        framecount: p.frameCount
      });
      lastLoggedPlayerState = { x: player.x, y: player.y };
    }
  }

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    gameState.gamePhase = GAME_PHASES.START;
    logGameInfo({ phase: "START" });
  };

  function initGame() {
    gameState.entities = [];
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.walls = [];
    gameState.currentFloor = 0;
    gameState.score = 0;
    gameState.kills = 0;
    gameState.roomsCleared = 0;

    loadFloor(0);
    
    logGameInfo({ phase: "PLAYING", floor: 0 });
  }

  function loadFloor(floorNum) {
    gameState.currentFloor = floorNum;
    
    const level = generateLevel(floorNum, p);
    
    gameState.walls = level.walls;
    gameState.entities = [...level.walls];
    
    // Create player
    gameState.player = new Player(level.playerSpawn.x, level.playerSpawn.y);
    gameState.entities.push(gameState.player);
    
    // Create enemies
    gameState.enemies = [];
    gameState.bullets = [];
    
    for (let spawn of level.enemySpawns) {
      const enemy = new Enemy(spawn.x, spawn.y, spawn.patrol);
      gameState.enemies.push(enemy);
      gameState.entities.push(enemy);
    }
    
    // Update camera
    updateCamera();
  }

  function updateCamera() {
    if (!gameState.player) return;
    
    gameState.camera.x = gameState.player.x - CANVAS_WIDTH / 2;
    gameState.camera.y = gameState.player.y - CANVAS_HEIGHT / 2;
    
    // Clamp camera
    gameState.camera.x = p.constrain(gameState.camera.x, 0, CANVAS_WIDTH * 3 - CANVAS_WIDTH);
    gameState.camera.y = p.constrain(gameState.camera.y, 0, CANVAS_HEIGHT * 3 - CANVAS_HEIGHT);
  }

  function handleInput() {
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action && gameState.gamePhase === GAME_PHASES.PLAYING) {
        handleKeyPress(action.keyCode, action.key);
      }
      return;
    }
  }

  function handleKeyPress(keyCode, key) {
    if (!gameState.player || !gameState.player.isAlive) return;
    
    let dx = 0;
    let dy = 0;
    
    if (keyCode === 38 || keyCode === 87) { // Up or W
      dy = -1;
    } else if (keyCode === 40 || keyCode === 83) { // Down or S
      dy = 1;
    } else if (keyCode === 37 || keyCode === 65) { // Left or A
      dx = -1;
    } else if (keyCode === 39 || keyCode === 68) { // Right or D
      dx = 1;
    }
    
    if (dx !== 0 || dy !== 0) {
      gameState.player.move(dx, dy, gameState.walls, p);
    }
    
    // Sprint
    if (keyCode === 16) { // Shift
      gameState.player.isSprinting = true;
    }
    
    // Melee
    if (keyCode === 32 && gameState.player.isAlive) { // Space
      const hit = gameState.player.meleeAttack(gameState.enemies, p);
      if (hit) {
        logInput("melee", { success: true });
      }
    }
    
    // Shoot
    if ((keyCode === 90 || key === 'z') && gameState.player.isAlive) { // Z
      const shot = gameState.player.shoot(gameState.bullets, p);
      if (shot) {
        logInput("shoot", { ammo: gameState.player.ammo });
      }
    }
  }

  p.keyPressed = function() {
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        initGame();
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo({ phase: "PAUSED" });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo({ phase: "PLAYING" });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        logGameInfo({ phase: "START" });
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleKeyPress(p.keyCode, p.key);
    }
  };

  p.keyReleased = function() {
    if (p.keyCode === 16) { // Shift
      if (gameState.player) {
        gameState.player.isSprinting = false;
      }
    }
  };

  function updateGame() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

    handleInput();

    // Update player
    if (gameState.player && gameState.player.isAlive) {
      gameState.player.update(p);
      
      // Check continuous movement keys
      if (gameState.controlMode === "HUMAN") {
        let dx = 0;
        let dy = 0;
        
        if (p.keyIsDown(38) || p.keyIsDown(87)) dy = -1;
        if (p.keyIsDown(40) || p.keyIsDown(83)) dy = 1;
        if (p.keyIsDown(37) || p.keyIsDown(65)) dx = -1;
        if (p.keyIsDown(39) || p.keyIsDown(68)) dx = 1;
        
        if (dx !== 0 || dy !== 0) {
          gameState.player.move(dx, dy, gameState.walls, p);
        }
      }
    }

    // Update enemies
    for (let enemy of gameState.enemies) {
      if (enemy.isAlive && gameState.player) {
        enemy.update(gameState.player, gameState.walls, gameState.bullets, p);
      }
    }

    // Update bullets
    for (let bullet of gameState.bullets) {
      if (bullet.isActive) {
        bullet.update(gameState.walls, p);
        
        // Check collision with player
        if (!bullet.isPlayerBullet && gameState.player && gameState.player.isAlive) {
          const dist = p.dist(bullet.x, bullet.y, gameState.player.x, gameState.player.y);
          if (dist < 10) {
            gameState.player.takeDamage();
            bullet.isActive = false;
            
            if (!gameState.player.isAlive) {
              gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
              logGameInfo({ phase: "GAME_OVER_LOSE", score: gameState.score });
            }
          }
        }
        
        // Check collision with enemies
        if (bullet.isPlayerBullet) {
          for (let enemy of gameState.enemies) {
            if (enemy.isAlive) {
              const dist = p.dist(bullet.x, bullet.y, enemy.x, enemy.y);
              if (dist < 10) {
                enemy.takeDamage();
                bullet.isActive = false;
                break;
              }
            }
          }
        }
      }
    }

    // Clean up inactive bullets
    gameState.bullets = gameState.bullets.filter(b => b.isActive);
    gameState.entities = gameState.entities.filter(e => {
      if (e instanceof Enemy) return e.isAlive;
      if (e.isActive !== undefined) return e.isActive;
      return true;
    });

    // Check win condition
    const aliveEnemies = gameState.enemies.filter(e => e.isAlive).length;
    if (aliveEnemies === 0 && gameState.player && gameState.player.isAlive) {
      if (gameState.currentFloor < gameState.totalFloors - 1) {
        // Next floor
        gameState.score += 500;
        loadFloor(gameState.currentFloor + 1);
        logGameInfo({ phase: "NEXT_FLOOR", floor: gameState.currentFloor });
      } else {
        // Win!
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        logGameInfo({ phase: "GAME_OVER_WIN", score: gameState.score });
      }
    }

    updateCamera();
    logPlayerInfo();
  }

  function renderStartScreen() {
    p.background(20, 10, 25);
    
    // Animated background
    for (let i = 0; i < 20; i++) {
      const x = (p.frameCount * 2 + i * 100) % (CANVAS_WIDTH + 100);
      const y = 50 + i * 20;
      p.fill(255, 50, 100, 30);
      p.noStroke();
      p.rect(x - 100, y, 80, 5);
    }
    
    // Title
    p.fill(255, 50, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("NEON MIAMI", CANVAS_WIDTH / 2, 80);
    
    p.textSize(20);
    p.fill(255, 200, 220);
    p.text("OPERATION: BLOODLINE", CANVAS_WIDTH / 2, 120);
    
    // Description
    p.textSize(14);
    p.fill(200, 200, 220);
    const desc = "Clear all floors of hostile operatives.\nOne hit kills. Plan your approach.";
    p.text(desc, CANVAS_WIDTH / 2, 180);
    
    // Instructions
    p.textSize(12);
    p.fill(150, 150, 200);
    p.textAlign(p.LEFT, p.CENTER);
    const instructions = [
      "ARROW KEYS - Move",
      "SHIFT - Sprint (louder)",
      "SPACE - Melee attack",
      "Z - Shoot (limited ammo)",
      "ESC - Pause"
    ];
    
    for (let i = 0; i < instructions.length; i++) {
      p.text(instructions[i], 150, 240 + i * 20);
    }
    
    // Start prompt
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
    p.fill(255, 100, 150, alpha);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }

  function renderPlayingScreen() {
    // Background
    p.background(30, 25, 35);
    
    // Grid pattern
    p.stroke(50, 45, 55);
    p.strokeWeight(1);
    const gridSize = 40;
    const offsetX = -gameState.camera.x % gridSize;
    const offsetY = -gameState.camera.y % gridSize;
    
    for (let x = offsetX; x < CANVAS_WIDTH; x += gridSize) {
      p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = offsetY; y < CANVAS_HEIGHT; y += gridSize) {
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Render walls
    for (let wall of gameState.walls) {
      wall.render(p, gameState.camera);
    }
    
    // Render bullets
    for (let bullet of gameState.bullets) {
      if (bullet.isActive) {
        bullet.render(p, gameState.camera);
      }
    }
    
    // Render enemies
    for (let enemy of gameState.enemies) {
      if (enemy.isAlive) {
        enemy.render(p, gameState.camera);
      }
    }
    
    // Render player
    if (gameState.player && gameState.player.isAlive) {
      gameState.player.render(p, gameState.camera);
    }
    
    // UI
    renderUI();
  }

  function renderUI() {
    // Score
    p.fill(255, 200, 220);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`SCORE: ${gameState.score}`, 10, 10);
    p.text(`KILLS: ${gameState.kills}`, 10, 30);
    p.text(`FLOOR: ${gameState.currentFloor + 1}/${gameState.totalFloors}`, 10, 50);
    
    // Ammo
    if (gameState.player) {
      p.text(`AMMO: ${gameState.player.ammo}`, 10, 70);
      
      // Health (visual indicator)
      if (gameState.player.isAlive) {
        p.fill(255, 50, 100);
        p.rect(10, 90, 20, 20);
      }
    }
    
    // Enemies remaining
    const aliveEnemies = gameState.enemies.filter(e => e.isAlive).length;
    p.fill(255, 100, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`TARGETS: ${aliveEnemies}`, CANVAS_WIDTH - 10, 10);
  }

  function renderPausedScreen() {
    renderPlayingScreen();
    
    // Overlay
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Text
    p.fill(255, 200, 220);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(14);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }

  function renderGameOverScreen() {
    p.background(20, 10, 25);
    
    const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
    
    // Title
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.fill(isWin ? 100 : 255, isWin ? 255 : 50, isWin ? 100 : 50);
    p.text(isWin ? "MISSION COMPLETE" : "MISSION FAILED", CANVAS_WIDTH / 2, 120);
    
    // Stats
    p.textSize(20);
    p.fill(200, 200, 220);
    p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    p.text(`KILLS: ${gameState.kills}`, CANVAS_WIDTH / 2, 230);
    p.text(`FLOOR REACHED: ${gameState.currentFloor + 1}/${gameState.totalFloors}`, CANVAS_WIDTH / 2, 260);
    
    // Restart prompt
    p.textSize(18);
    const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
    p.fill(255, 200, 220, alpha);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }

  p.draw = function() {
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen();
        break;
      case GAME_PHASES.PLAYING:
        updateGame();
        renderPlayingScreen();
        break;
      case GAME_PHASES.PAUSED:
        renderPausedScreen();
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen();
        break;
    }
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};