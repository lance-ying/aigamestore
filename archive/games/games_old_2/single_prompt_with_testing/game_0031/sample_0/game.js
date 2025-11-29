// game.js - Main game file
import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  KEY_ENTER, 
  KEY_ESC, 
  KEY_R,
  ROUTE_STOPS,
  ROUTE_TIME_LIMIT
} from './globals.js';

import { Bus } from './bus.js';
import { BusStop } from './busStop.js';
import { Obstacle } from './obstacle.js';
import { Road } from './road.js';
import { Passenger } from './passenger.js';
import { drawStartScreen, drawPauseOverlay, drawGameOverScreen, drawHUD, drawRouteArrow } from './ui.js';
import { initializeRoute, updateRouteProgress, checkWinCondition, checkLoseCondition, handleCollisions } from './gameLogic.js';
import { getCurrentInput } from './inputHandler.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let bus;
  let busStops = [];
  let obstacles = [];
  let road;
  let passengers = [];

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
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game objects
    road = new Road(p);
    
    // Create bus stops from route data
    for (let i = 0; i < ROUTE_STOPS.length; i++) {
      const stop = ROUTE_STOPS[i];
      busStops.push(new BusStop(p, stop.x, stop.y, stop.name, i));
    }
    
    // Create obstacles
    obstacles.push(new Obstacle(p, 200, 50, 50, 60, 'building'));
    obstacles.push(new Obstacle(p, 400, 50, 50, 60, 'building'));
    obstacles.push(new Obstacle(p, 150, 220, 20, 30, 'tree'));
    obstacles.push(new Obstacle(p, 450, 220, 20, 30, 'tree'));
    obstacles.push(new Obstacle(p, 250, 200, 25, 15, 'car'));
    obstacles.push(new Obstacle(p, 350, 340, 25, 15, 'car'));
  };

  p.draw = function() {
    p.background(40, 60, 40);
    
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      // Draw game world
      road.draw(p);
      
      // Draw obstacles
      for (let obstacle of obstacles) {
        obstacle.draw(p);
      }
      
      // Draw bus stops
      const nextStop = gameState.currentRoute?.[gameState.routeProgress];
      for (let stop of busStops) {
        stop.draw(p, stop === nextStop);
      }
      
      // Draw route arrow to next stop
      if (bus && nextStop) {
        drawRouteArrow(p, bus.x, bus.y, nextStop.x, nextStop.y);
      }
      
      // Draw and update passengers
      for (let i = passengers.length - 1; i >= 0; i--) {
        passengers[i].update();
        passengers[i].draw(p);
        if (passengers[i].done) {
          passengers.splice(i, 1);
        }
      }
      
      // Update and draw bus
      if (bus) {
        const input = getCurrentInput(p);
        bus.update(input);
        bus.draw(p);
        
        // Log player position periodically
        if (p.frameCount % 30 === 0) {
          p.logs.player_info.push({
            screen_x: bus.x,
            screen_y: bus.y,
            game_x: bus.x,
            game_y: bus.y,
            framecount: p.frameCount
          });
        }
      }
      
      // Update game logic
      if (bus) {
        updateRouteProgress(p, bus, busStops, passengers);
        handleCollisions(bus, obstacles);
      }
      
      // Update timer
      gameState.timeRemaining--;
      
      // Check conditions
      checkWinCondition();
      checkLoseCondition();
      
      // Draw HUD
      drawHUD(p);
      
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      // Draw game state (frozen)
      road.draw(p);
      for (let obstacle of obstacles) {
        obstacle.draw(p);
      }
      for (let stop of busStops) {
        stop.draw(p, false);
      }
      for (let passenger of passengers) {
        passenger.draw(p);
      }
      if (bus) {
        bus.draw(p);
      }
      drawHUD(p);
      drawPauseOverlay(p);
      
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      // Draw final game state
      road.draw(p);
      for (let obstacle of obstacles) {
        obstacle.draw(p);
      }
      for (let stop of busStops) {
        stop.draw(p, false);
      }
      if (bus) {
        bus.draw(p);
      }
      drawHUD(p);
      drawGameOverScreen(p, gameState.gamePhase === PHASE_GAME_OVER_WIN);
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
    
    if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      // Start game
      gameState.gamePhase = PHASE_PLAYING;
      gameState.timeRemaining = ROUTE_TIME_LIMIT;
      
      // Create bus
      bus = new Bus(p, 100, 150);
      bus.p = p;
      gameState.player = bus;
      gameState.entities = [bus];
      
      // Initialize route
      initializeRoute(p, busStops);
      
      // Log game start
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING, message: "Game started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
    } else if (p.keyCode === KEY_ESC) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: PHASE_PAUSED, message: "Game paused" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { phase: PHASE_PLAYING, message: "Game resumed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
    } else if (p.keyCode === KEY_R) {
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        // Reset to start screen
        gameState.gamePhase = PHASE_START;
        gameState.routeProgress = 0;
        gameState.passengers = 0;
        gameState.timeRemaining = ROUTE_TIME_LIMIT;
        gameState.stopTimer = 0;
        gameState.atStop = false;
        gameState.currentStopIndex = -1;
        
        // Reset stops
        for (let stop of busStops) {
          stop.visited = false;
          stop.waitingPassengers = p.floor(p.random(3, 8));
        }
        
        passengers = [];
        bus = null;
        gameState.player = null;
        gameState.entities = [];
        
        p.logs.game_info.push({
          data: { phase: PHASE_START, message: "Game restarted" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};