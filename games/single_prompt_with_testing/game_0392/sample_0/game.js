import { 
  gameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_AREA_X,
  GAME_AREA_WIDTH,
  getGameState,
  setControlMode 
} from './globals.js';
import { Player } from './player.js';
import { WaveManager } from './wave_manager.js';
import { renderUI } from './ui.js';
import { renderStartScreen, renderGameOverScreen, renderPausedIndicator } from './screens.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let waveManager;
  
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
    
    // Initialize key states
    p.keyStates = {};
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(10, 10, 30);
    
    gameState.frameCount = p.frameCount;
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        updateGame();
        renderGame();
        break;
        
      case GAME_PHASES.PAUSED:
        renderGame();
        renderPausedIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGame();
        renderGameOverScreen(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
        break;
    }
  };
  
  function initGame() {
    // Reset game state
    gameState.player = new Player(p, GAME_AREA_X + GAME_AREA_WIDTH / 2, CANVAS_HEIGHT - 60);
    gameState.entities = [gameState.player];
    gameState.bullets = [];
    gameState.enemyBullets = [];
    gameState.items = [];
    gameState.particles = [];
    gameState.enemies = [];
    gameState.ufos = [];
    gameState.score = 0;
    gameState.lives = 3;
    gameState.spellCards = 2;
    gameState.power = 1.0;
    gameState.venturer = { red: 0, blue: 0, green: 0 };
    gameState.wave = 0;
    gameState.waveTimer = 0;
    gameState.invincibilityTimer = 0;
    gameState.ufoActive = false;
    gameState.lifeFragments = 0;
    gameState.spellFragments = 0;
    gameState.pointItemValue = 1000;
    
    waveManager = new WaveManager(p);
    
    // Log player initial state
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
  
  function updateGame() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      p.keyStates[37] = action.left;   // LEFT
      p.keyStates[39] = action.right;  // RIGHT
      p.keyStates[38] = action.up;     // UP
      p.keyStates[40] = action.down;   // DOWN
      p.keyStates[90] = action.shoot;  // Z
      p.keyStates[16] = action.slow;   // SHIFT
      
      if (action.spell && gameState.spellCards > 0) {
        useSpellCard();
      }
    }
    
    // Update player
    if (gameState.player) {
      const prevX = gameState.player.x;
      const prevY = gameState.player.y;
      
      gameState.player.slowMode = p.keyStates[16]; // Shift
      gameState.player.update();
      
      // Shooting
      if (p.keyStates[90]) { // Z key
        gameState.player.shoot(gameState.bullets);
      }
      
      // Log position changes
      if (prevX !== gameState.player.x || prevY !== gameState.player.y) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Update invincibility
    if (gameState.invincibilityTimer > 0) {
      gameState.invincibilityTimer--;
    }
    
    // Update wave manager
    if (waveManager) {
      waveManager.update();
      
      // Check win condition
      if (waveManager.isComplete()) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Update bullets
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
      const bullet = gameState.bullets[i];
      bullet.update();
      
      if (!bullet.active) {
        gameState.bullets.splice(i, 1);
        continue;
      }
      
      // Check collisions with enemies
      for (let enemy of gameState.enemies) {
        if (!enemy.active) continue;
        const dist = p.dist(bullet.x, bullet.y, enemy.x, enemy.y);
        if (dist < enemy.radius + bullet.radius) {
          enemy.takeDamage(bullet.damage);
          bullet.active = false;
          break;
        }
      }
      
      // Check collisions with UFOs
      for (let ufo of gameState.ufos) {
        if (!ufo.active) continue;
        const dist = p.dist(bullet.x, bullet.y, ufo.x, ufo.y);
        if (dist < ufo.radius + bullet.radius) {
          ufo.takeDamage(bullet.damage);
          bullet.active = false;
          break;
        }
      }
    }
    
    // Update enemy bullets
    for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = gameState.enemyBullets[i];
      bullet.update();
      
      if (!bullet.active) {
        gameState.enemyBullets.splice(i, 1);
        continue;
      }
      
      // Check collision with player
      if (gameState.invincibilityTimer === 0 && gameState.player) {
        const hitbox = gameState.player.getHitbox();
        const dist = p.dist(bullet.x, bullet.y, hitbox.x, hitbox.y);
        if (dist < hitbox.radius + bullet.radius) {
          playerHit();
          gameState.enemyBullets.splice(i, 1);
        }
      }
    }
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = gameState.enemies[i];
      enemy.update();
      
      if (!enemy.active) {
        gameState.enemies.splice(i, 1);
      }
    }
    
    // Update UFOs
    for (let i = gameState.ufos.length - 1; i >= 0; i--) {
      const ufo = gameState.ufos[i];
      ufo.update();
      
      if (!ufo.active) {
        gameState.ufos.splice(i, 1);
        if (gameState.ufos.length === 0) {
          gameState.ufoActive = false;
        }
      }
    }
    
    // Update items
    for (let i = gameState.items.length - 1; i >= 0; i--) {
      const item = gameState.items[i];
      item.update(gameState.player);
      
      if (!item.active) {
        gameState.items.splice(i, 1);
        continue;
      }
      
      // Check collection
      if (gameState.player) {
        const dist = p.dist(item.x, item.y, gameState.player.x, gameState.player.y);
        if (dist < item.collectRadius) {
          item.collect();
          gameState.items.splice(i, 1);
        }
      }
    }
  }
  
  function renderGame() {
    // Game area background
    p.push();
    p.fill(15, 15, 45);
    p.noStroke();
    p.rect(GAME_AREA_X, 0, GAME_AREA_WIDTH, CANVAS_HEIGHT);
    
    // Grid pattern
    p.stroke(30, 30, 60, 100);
    for (let x = GAME_AREA_X; x < GAME_AREA_X + GAME_AREA_WIDTH; x += 40) {
      p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      p.line(GAME_AREA_X, y, GAME_AREA_X + GAME_AREA_WIDTH, y);
    }
    p.pop();
    
    // Render items
    for (let item of gameState.items) {
      item.render();
    }
    
    // Render enemy bullets
    for (let bullet of gameState.enemyBullets) {
      bullet.render();
    }
    
    // Render enemies
    for (let enemy of gameState.enemies) {
      enemy.render();
    }
    
    // Render UFOs
    for (let ufo of gameState.ufos) {
      ufo.render();
    }
    
    // Render player bullets
    for (let bullet of gameState.bullets) {
      bullet.render();
    }
    
    // Render player
    if (gameState.player) {
      // Invincibility flash
      if (gameState.invincibilityTimer === 0 || p.frameCount % 10 < 5) {
        gameState.player.render();
      }
    }
    
    // Render UI
    renderUI(p);
  }
  
  function useSpellCard() {
    if (gameState.spellCards > 0) {
      gameState.spellCards--;
      gameState.invincibilityTimer = 180;
      
      // Clear all enemy bullets
      gameState.enemyBullets = [];
      
      // Damage all enemies
      for (let enemy of gameState.enemies) {
        enemy.takeDamage(100);
      }
      
      // Damage all UFOs
      for (let ufo of gameState.ufos) {
        ufo.takeDamage(25);
      }
    }
  }
  
  function playerHit() {
    gameState.lives--;
    gameState.invincibilityTimer = 180;
    
    // Lose one option
    if (gameState.player.options > 1) {
      gameState.player.options--;
    }
    
    // Restore spell cards to minimum 2
    if (gameState.spellCards < 2) {
      gameState.spellCards = 2;
    }
    
    // Clear bullets
    gameState.enemyBullets = [];
    
    if (gameState.lives <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  p.keyPressed = function() {
    const key = p.keyCode;
    
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: key },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.keyStates[key] = true;
    
    // Game phase transitions
    if (key === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        initGame();
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (key === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (key === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Spell card (Space key)
    if (key === 32 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      useSpellCard();
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    const key = p.keyCode;
    
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: key },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.keyStates[key] = false;
    return false;
  };
});

window.gameInstance = gameInstance;