// game.js - Main game file

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CONTROL_HUMAN,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_Z,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  ROOM_OFFSET_X,
  ROOM_OFFSET_Y,
  ROOM_WIDTH,
  ROOM_HEIGHT,
  FLOORS_COUNT
} from './globals.js';

import { Player } from './entities.js';
import { Dungeon } from './dungeon.js';
import { spawnEnemiesInRoom, spawnItemInRoom, checkRoomCleared, drawRoom } from './room_manager.js';
import { drawStartScreen, drawPausedIndicator, drawGameOverScreen, drawHUD } from './ui.js';
import { distance } from './utils.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

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
    if (gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.currentRoom.x,
        game_y: gameState.currentRoom.y,
        framecount: p.frameCount
      });
    }
  }

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    logGameInfo({ phase: "SETUP", message: "Game initialized" });
  };

  p.draw = function() {
    p.background(20, 15, 15);

    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p, gameState);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame();
      renderGame();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderGame();
      drawPausedIndicator(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGame();
      drawGameOverScreen(p, gameState);
    }

    // Handle automated testing
    if (gameState.controlMode !== CONTROL_HUMAN && gameState.gamePhase === PHASE_PLAYING) {
      handleAutomatedControl();
    }
  };

  function startGame() {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.currentFloor = 0;
    gameState.score = 0;
    gameState.roomsCleared = 0;
    gameState.bossDefeated = false;
    
    // Initialize dungeon
    gameState.dungeon = new Dungeon(gameState.currentFloor, p);
    gameState.currentRoom = { x: 2, y: 2 };
    
    // Initialize player
    gameState.player = new Player(
      ROOM_OFFSET_X + ROOM_WIDTH / 2,
      ROOM_OFFSET_Y + ROOM_HEIGHT / 2
    );
    
    // Clear arrays
    gameState.entities = [gameState.player];
    gameState.tears = [];
    gameState.enemies = [];
    gameState.items = [];
    gameState.pickups = [];
    gameState.particles = [];
    
    // Mark start room as visited
    const startRoom = gameState.dungeon.getRoom(2, 2);
    if (startRoom) {
      startRoom.visited = true;
      startRoom.cleared = true;
    }
    
    logGameInfo({ phase: "START_GAME", floor: gameState.currentFloor });
  }

  function updateGame() {
    if (!gameState.player || !gameState.dungeon) return;

    const currentRoom = gameState.dungeon.getRoom(gameState.currentRoom.x, gameState.currentRoom.y);
    if (!currentRoom) return;

    // First visit to room
    if (!currentRoom.visited) {
      currentRoom.visited = true;
      spawnEnemiesInRoom(currentRoom, gameState.currentFloor, p, gameState);
      spawnItemInRoom(currentRoom, p, gameState);
    }

    // Update player
    gameState.player.update(p, gameState);

    // Update tears
    for (let i = gameState.tears.length - 1; i >= 0; i--) {
      gameState.tears[i].update(p, gameState);
      if (!gameState.tears[i].active) {
        gameState.tears.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      if (gameState.enemies[i].active) {
        gameState.enemies[i].update(p, gameState);
      } else {
        gameState.enemies.splice(i, 1);
      }
    }

    // Update items
    for (let i = gameState.items.length - 1; i >= 0; i--) {
      gameState.items[i].update(p, gameState);
      if (gameState.items[i].collected) {
        gameState.items.splice(i, 1);
      }
    }

    // Update pickups
    for (let i = gameState.pickups.length - 1; i >= 0; i--) {
      gameState.pickups[i].update(p, gameState);
      if (!gameState.pickups[i].active) {
        gameState.pickups.splice(i, 1);
      }
    }

    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const particle = gameState.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      if (particle.life <= 0) {
        gameState.particles.splice(i, 1);
      }
    }

    // Check room cleared
    checkRoomCleared(currentRoom, gameState);

    // Check room transitions
    if (currentRoom.cleared) {
      checkRoomTransition();
    }

    // Check win/lose conditions
    if (gameState.player.health <= 0) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      logGameInfo({ phase: "GAME_OVER_LOSE", score: gameState.score });
    }

    if (gameState.bossDefeated && gameState.currentFloor >= FLOORS_COUNT - 1) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      logGameInfo({ phase: "GAME_OVER_WIN", score: gameState.score });
    } else if (gameState.bossDefeated) {
      // Next floor
      gameState.currentFloor++;
      gameState.dungeon = new Dungeon(gameState.currentFloor, p);
      gameState.currentRoom = { x: 2, y: 2 };
      gameState.bossDefeated = false;
      
      const startRoom = gameState.dungeon.getRoom(2, 2);
      if (startRoom) {
        startRoom.visited = true;
        startRoom.cleared = true;
      }
      
      gameState.player.x = ROOM_OFFSET_X + ROOM_WIDTH / 2;
      gameState.player.y = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;
      gameState.tears = [];
      gameState.enemies = [];
      gameState.items = [];
      gameState.pickups = [];
      
      logGameInfo({ phase: "NEXT_FLOOR", floor: gameState.currentFloor });
    }

    // Log player position periodically
    if (p.frameCount % 30 === 0) {
      logPlayerInfo();
    }
  }

  function checkRoomTransition() {
    const player = gameState.player;
    const currentRoom = gameState.dungeon.getRoom(gameState.currentRoom.x, gameState.currentRoom.y);
    
    if (!currentRoom) return;

    // Check door collisions
    if (currentRoom.doors.top && player.y < ROOM_OFFSET_Y + 10) {
      changeRoom(0, -1);
    } else if (currentRoom.doors.bottom && player.y > ROOM_OFFSET_Y + ROOM_HEIGHT - 10) {
      changeRoom(0, 1);
    } else if (currentRoom.doors.left && player.x < ROOM_OFFSET_X + 10) {
      changeRoom(-1, 0);
    } else if (currentRoom.doors.right && player.x > ROOM_OFFSET_X + ROOM_WIDTH - 10) {
      changeRoom(1, 0);
    }
  }

  function changeRoom(dx, dy) {
    const newX = gameState.currentRoom.x + dx;
    const newY = gameState.currentRoom.y + dy;
    const newRoom = gameState.dungeon.getRoom(newX, newY);
    
    if (!newRoom) return;

    gameState.currentRoom.x = newX;
    gameState.currentRoom.y = newY;

    // Position player at opposite door
    if (dx === -1) {
      gameState.player.x = ROOM_OFFSET_X + ROOM_WIDTH - 30;
    } else if (dx === 1) {
      gameState.player.x = ROOM_OFFSET_X + 30;
    } else if (dy === -1) {
      gameState.player.y = ROOM_OFFSET_Y + ROOM_HEIGHT - 30;
    } else if (dy === 1) {
      gameState.player.y = ROOM_OFFSET_Y + 30;
    }

    // Clear tears
    gameState.tears = [];
    gameState.enemies = [];
    gameState.items = [];
    gameState.pickups = [];

    logGameInfo({ 
      phase: "ROOM_CHANGE", 
      room_x: gameState.currentRoom.x, 
      room_y: gameState.currentRoom.y 
    });
  }

  function renderGame() {
    const currentRoom = gameState.dungeon.getRoom(gameState.currentRoom.x, gameState.currentRoom.y);
    if (!currentRoom) return;

    // Draw room
    drawRoom(currentRoom, p, gameState);

    // Draw particles
    for (const particle of gameState.particles) {
      p.fill(...particle.color, (particle.life / 30) * 255);
      p.noStroke();
      p.circle(particle.x, particle.y, 4);
    }

    // Draw items
    for (const item of gameState.items) {
      item.draw(p);
    }

    // Draw pickups
    for (const pickup of gameState.pickups) {
      pickup.draw(p);
    }

    // Draw tears
    for (const tear of gameState.tears) {
      tear.draw(p);
    }

    // Draw enemies
    for (const enemy of gameState.enemies) {
      if (enemy.active) {
        enemy.draw(p);
      }
    }

    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
    }

    // Draw HUD
    drawHUD(p, gameState);
  }

  function handleAutomatedControl() {
    if (typeof window.get_automated_testing_action === 'function') {
      const action = window.get_automated_testing_action(gameState);
      
      if (action) {
        gameState.keysPressed.clear();
        
        if (action.left) gameState.keysPressed.add(KEY_LEFT);
        if (action.right) gameState.keysPressed.add(KEY_RIGHT);
        if (action.up) gameState.keysPressed.add(KEY_UP);
        if (action.down) gameState.keysPressed.add(KEY_DOWN);
        if (action.shoot) gameState.keysPressed.add(KEY_SPACE);
        if (action.sprint) gameState.keysPressed.add(KEY_SHIFT);
        if (action.special) gameState.keysPressed.add(KEY_Z);

        handleMovement();
      }
    }
  }

  function handleMovement() {
    if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) return;

    let dx = 0;
    let dy = 0;

    if (gameState.keysPressed.has(KEY_LEFT)) dx -= 1;
    if (gameState.keysPressed.has(KEY_RIGHT)) dx += 1;
    if (gameState.keysPressed.has(KEY_UP)) dy -= 1;
    if (gameState.keysPressed.has(KEY_DOWN)) dy += 1;

    if (dx !== 0 || dy !== 0) {
      gameState.player.move(dx, dy, p, gameState);
      gameState.lastShootDir = { x: dx, y: dy };
    }

    if (gameState.keysPressed.has(KEY_SPACE)) {
      gameState.player.shoot(p, gameState);
    }

    if (gameState.keysPressed.has(KEY_Z)) {
      gameState.player.useSpecial(p, gameState);
    }
  }

  p.keyPressed = function() {
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });

    if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      startGame();
    } else if (p.keyCode === KEY_ESC) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        logGameInfo({ phase: "PAUSED" });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        logGameInfo({ phase: "RESUMED" });
      }
    } else if (p.keyCode === KEY_R) {
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
          gameState.gamePhase === PHASE_PLAYING ||
          gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_START;
        gameState.player = null;
        gameState.dungeon = null;
        logGameInfo({ phase: "RESTART" });
      }
    }

    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.keysPressed.add(p.keyCode);
      handleMovement();
    }
  };

  p.keyReleased = function() {
    logInput("keyReleased", { key: p.key, keyCode: p.keyCode });
    gameState.keysPressed.delete(p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = document.getElementById(mode === CONTROL_HUMAN ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};