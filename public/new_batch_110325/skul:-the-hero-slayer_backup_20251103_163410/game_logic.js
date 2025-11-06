// game_logic.js
import { gameState, GAME_PHASES, ROOMS_TO_WIN } from './globals.js';
import { Player, Enemy } from './entities.js';

export function initializeGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.roomsCleared = 0;
  gameState.currentRoom = 0;
  gameState.darkQuartz = 0;
  gameState.enemiesInRoom = 0;
  gameState.roomComplete = false;
  gameState.transitionTimer = 0;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.items = [];
  gameState.skulls = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.lastAttackTime = 0;
  gameState.lastDashTime = 0;
  gameState.keysPressed = {};
  gameState.positionHistory = [];
}

export function startGame(p) {
  gameState.player = new Player(100, 300);
  gameState.entities.push(gameState.player);
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.score = 0;
  gameState.roomsCleared = 0;
  gameState.currentRoom = 0;
  gameState.darkQuartz = 0;
  gameState.roomComplete = false;
  gameState.transitionTimer = 0;
  
  // Clear all entities except player
  gameState.enemies = [];
  gameState.items = [];
  gameState.skulls = [];
  gameState.projectiles = [];
  gameState.particles = [];
  
  // Start first room
  startNewRoom(p);
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, message: "Game Started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function startNewRoom(p) {
  gameState.currentRoom++;
  gameState.roomComplete = false;
  gameState.transitionTimer = 0;
  
  // Clear previous room entities
  gameState.enemies = [];
  gameState.items = gameState.items.filter(item => item.collected);
  gameState.skulls = gameState.skulls.filter(skull => skull.collected);
  gameState.projectiles = [];
  
  // Spawn enemies based on room number
  const enemyCount = 3 + gameState.currentRoom;
  gameState.enemiesInRoom = enemyCount;
  
  for (let i = 0; i < enemyCount; i++) {
    const x = p.random(100, 500);
    const y = p.random(200, 300);
    const type = Math.floor(p.random(0, 3));
    const enemy = new Enemy(x, y, type);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  
  p.logs.game_info.push({
    data: { room: gameState.currentRoom, enemies: enemyCount },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Update all entities
  if (gameState.player) {
    gameState.player.update(p);
    
    // Log player position periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
      
      // Track position history for automated testing
      gameState.positionHistory.push({ x: gameState.player.x, y: gameState.player.y, frame: p.frameCount });
      if (gameState.positionHistory.length > 100) {
        gameState.positionHistory.shift();
      }
    }
  }
  
  // Update enemies
  for (let enemy of gameState.enemies) {
    enemy.update(p);
    enemy.checkPlayerCollision();
  }
  
  // Update projectiles
  for (let projectile of gameState.projectiles) {
    projectile.update();
    projectile.checkEnemyCollision();
  }
  
  // Update items
  for (let item of gameState.items) {
    item.update();
    item.checkCollection();
  }
  
  // Update skulls
  for (let skull of gameState.skulls) {
    skull.update();
    skull.checkCollection();
  }
  
  // Update particles
  for (let particle of gameState.particles) {
    particle.update();
  }
  
  // Clean up dead entities
  gameState.enemies = gameState.enemies.filter(e => !e.dead);
  gameState.projectiles = gameState.projectiles.filter(p => !p.dead);
  gameState.items = gameState.items.filter(i => !i.collected);
  gameState.skulls = gameState.skulls.filter(s => !s.collected);
  gameState.particles = gameState.particles.filter(p => !p.dead);
  
  // Check room completion
  if (gameState.enemies.length === 0 && !gameState.roomComplete) {
    gameState.roomComplete = true;
    gameState.roomsCleared++;
    gameState.score += 100;
    gameState.transitionTimer = 120;
    
    p.logs.game_info.push({
      data: { message: "Room Cleared", roomsCleared: gameState.roomsCleared },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Handle room transition
  if (gameState.roomComplete) {
    gameState.transitionTimer--;
    if (gameState.transitionTimer <= 0) {
      if (gameState.roomsCleared >= ROOMS_TO_WIN) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        gameState.permanentDarkQuartz += gameState.darkQuartz;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Victory!" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        startNewRoom(p);
      }
    }
  }
  
  // Check game over
  if (gameState.player && gameState.player.health <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    gameState.permanentDarkQuartz += gameState.darkQuartz;
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game Over" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function handleInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (!gameState.player) return;
  
  let action = null;
  
  // Get action based on control mode
  if (gameState.controlMode === "HUMAN") {
    // Human input is handled in keyPressed/keyReleased
    // Here we process continuous key states
    let moveDir = 0;
    if (gameState.keysPressed[37]) moveDir = -1; // LEFT
    if (gameState.keysPressed[39]) moveDir = 1;  // RIGHT
    
    gameState.player.move(moveDir);
    
    if (gameState.keysPressed[38]) { // UP
      gameState.player.jump();
    }
    
  } else {
    // Automated testing mode
    const get_automated_testing_action = window.get_automated_testing_action;
    if (get_automated_testing_action) {
      action = get_automated_testing_action(gameState);
      
      if (action) {
        // Process action
        let moveDir = 0;
        if (action.left) moveDir = -1;
        if (action.right) moveDir = 1;
        gameState.player.move(moveDir);
        
        if (action.up) {
          gameState.player.jump();
        }
        
        if (action.space && Date.now() - gameState.lastAttackTime > gameState.player.currentSkull.attackSpeed) {
          gameState.player.attack(p);
          gameState.lastAttackTime = Date.now();
        }
        
        if (action.shift && Date.now() - gameState.lastDashTime > 1000) {
          gameState.player.dash();
          gameState.lastDashTime = Date.now();
        }
        
        if (action.z) {
          gameState.player.swapSkull();
        }
      }
    }
  }
}