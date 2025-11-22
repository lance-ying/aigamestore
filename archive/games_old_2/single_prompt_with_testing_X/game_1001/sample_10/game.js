import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES, getGameState } from './globals.js';
import { Player } from './entities.js';
import { generateRoom, loadRoom, checkRoomTransition } from './world.js';
import { checkCollisions } from './collision.js';
import { handleKeyPressed, handleKeyReleased, handleMovement } from './input.js';
import { renderStartScreen, renderGame, renderGameOver } from './render.js';
import { runTests } from './tests.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.player = new Player(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.currentRoom = { x: 0, y: 0 };
    gameState.roomData = {};
    
    // Load starting room (this will populate entities)
    loadRoom(p, 0, 0);
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, event: "init" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle different game phases
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        // Run automated tests if in test mode
        if (gameState.controlMode !== "HUMAN") {
          runTests();
        }
        
        // Handle input
        handleMovement(p);
        
        // Update entities
        if (gameState.player) {
          gameState.player.update();
          
          // Log player info periodically
          if (p.frameCount % 30 === 0) {
            p.logs.player_info.push({
              screen_x: gameState.player.x,
              screen_y: gameState.player.y,
              game_x: gameState.player.x + gameState.currentRoom.x * CANVAS_WIDTH,
              game_y: gameState.player.y + gameState.currentRoom.y * CANVAS_HEIGHT,
              framecount: p.frameCount
            });
          }
        }
        
        for (const entity of gameState.entities) {
          if (entity && entity.active && entity.update) {
            entity.update();
          }
        }
        
        // Update projectiles
        for (const proj of gameState.projectiles) {
          if (proj.active) {
            proj.update();
          }
        }
        
        // Update particles
        for (const particle of gameState.particles) {
          if (particle.active) {
            particle.update();
          }
        }
        
        // Remove inactive entities
        gameState.entities = gameState.entities.filter(e => e.active);
        gameState.projectiles = gameState.projectiles.filter(p => p.active);
        gameState.particles = gameState.particles.filter(p => p.active);
        
        // Check collisions
        checkCollisions(p);
        
        // Check room transitions
        checkRoomTransition(p);
        
        // Check win/lose conditions
        if (gameState.player && !gameState.player.active) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
          p.logs.game_info.push({
            data: { phase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        
        // Win condition: defeat 2 bosses and collect treasures
        if (gameState.bossesDefeated >= 2 && gameState.dungeonTreasures >= 2) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          p.logs.game_info.push({
            data: { phase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        
        // Render
        renderGame(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderGame(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };

  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};