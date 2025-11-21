// game.js - Main game logic

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { LEVELS } from './levels.js';
import { Candy, OmNom, Star, Rope, AirCushion, Bubble, Hazard, Wall } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { setupInputHandling } from './input.js';
import { renderStartScreen, renderPausedOverlay, renderGameOver, renderGameUI, handleGameOverInput } from './ui.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine and world
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 1;

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

    // Load high scores from localStorage
    const savedHighScores = localStorage.getItem('cutTheRopeHighScores');
    if (savedHighScores) {
      gameState.highScores = JSON.parse(savedHighScores);
    } else {
      gameState.highScores = [0, 0, 0, 0, 0];
    }

    const savedBestStars = localStorage.getItem('cutTheRopeBestStars');
    if (savedBestStars) {
      gameState.bestStars = JSON.parse(savedBestStars);
    } else {
      gameState.bestStars = [0, 0, 0, 0, 0];
    }

    setupCollisionHandling(p);
    setupInputHandling(p);
  };

  p.draw = function() {
    Engine.update(gameState.engine, 1000 / 60);

    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        updateGame(p);
        renderGame(p);
        renderGameUI(p);
        break;
      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderGameUI(p);
        renderPausedOverlay(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        handleGameOverInput(p);
        break;
    }
  };
});

function updateGame(p) {
  if (gameState.candy) {
    gameState.candy.update();
  }
  
  if (gameState.omNom) {
    gameState.omNom.update();
  }
  
  gameState.stars.forEach(star => star.update());
  gameState.ropes.forEach(rope => {
    rope.update();
    if (rope.cut && rope.cutAnimation >= 0.5 && rope.constraint) {
      World.remove(gameState.world, rope.constraint);
      rope.constraint = null;
    }
  });
  gameState.airCushions.forEach(cushion => cushion.update());
  gameState.bubbles.forEach(bubble => bubble.update());
}

function renderGame(p) {
  p.background(135, 206, 235); // Sky blue

  // Render walls
  gameState.walls.forEach(wall => wall.render());
  
  // Render hazards
  gameState.hazards.forEach(hazard => hazard.render());
  
  // Render air cushions
  gameState.airCushions.forEach(cushion => cushion.render());
  
  // Render ropes
  gameState.ropes.forEach(rope => rope.render());
  
  // Render stars
  gameState.stars.forEach(star => star.render());
  
  // Render bubbles
  gameState.bubbles.forEach(bubble => bubble.render());
  
  // Render candy
  if (gameState.candy) {
    gameState.candy.render();
  }
  
  // Render Om Nom
  if (gameState.omNom) {
    gameState.omNom.render();
  }
}

export function loadLevel(p, levelIndex) {
  // Clear existing entities
  if (gameState.world) {
    World.clear(gameState.world, false);
  }

  gameState.entities = [];
  gameState.ropes = [];
  gameState.stars = [];
  gameState.airCushions = [];
  gameState.bubbles = [];
  gameState.hazards = [];
  gameState.walls = [];
  gameState.starsCollected = [false, false, false];
  gameState.score = 0;
  gameState.magicFingerUsed = false;

  const level = LEVELS[levelIndex];
  
  // Create candy
  gameState.candy = new Candy(p, level.candy.x, level.candy.y);
  World.add(gameState.world, gameState.candy.body);
  gameState.entities.push(gameState.candy);
  gameState.player = gameState.candy;

  // Create Om Nom
  gameState.omNom = new OmNom(p, level.omNom.x, level.omNom.y);
  World.add(gameState.world, gameState.omNom.body);
  gameState.entities.push(gameState.omNom);

  // Create stars
  level.stars.forEach((starData, index) => {
    const star = new Star(p, starData.x, starData.y, index);
    World.add(gameState.world, star.body);
    gameState.stars.push(star);
    gameState.entities.push(star);
  });

  // Create ropes
  level.ropes.forEach(ropeData => {
    let bodyA, bodyB, pointA, pointB;
    
    if (ropeData.bodyA === "candy") {
      bodyA = gameState.candy.body;
      pointA = { x: 0, y: 0 };
    }
    
    if (ropeData.bodyB === "static") {
      bodyB = null;
      pointB = ropeData.pointB;
    }
    
    const rope = new Rope(p, bodyA, bodyB, pointA, pointB);
    World.add(gameState.world, rope.constraint);
    gameState.ropes.push(rope);
  });

  // Create walls
  level.walls.forEach(wallData => {
    const wall = new Wall(p, wallData.x, wallData.y, wallData.width, wallData.height);
    World.add(gameState.world, wall.body);
    gameState.walls.push(wall);
    gameState.entities.push(wall);
  });

  // Create air cushions
  level.airCushions.forEach(cushionData => {
    const cushion = new AirCushion(p, cushionData.x, cushionData.y, cushionData.width, cushionData.height);
    World.add(gameState.world, cushion.body);
    gameState.airCushions.push(cushion);
    gameState.entities.push(cushion);
  });

  // Create bubbles
  level.bubbles.forEach(bubbleData => {
    const bubble = new Bubble(p, bubbleData.x, bubbleData.y, bubbleData.radius);
    World.add(gameState.world, bubble.body);
    gameState.bubbles.push(bubble);
    gameState.entities.push(bubble);
  });

  // Create hazards
  level.hazards.forEach(hazardData => {
    const hazard = new Hazard(p, hazardData.x, hazardData.y, hazardData.points);
    World.add(gameState.world, hazard.body);
    gameState.hazards.push(hazard);
    gameState.entities.push(hazard);
  });

  p.logs.game_info.push({
    data: { event: "level_loaded", level: levelIndex },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetGame(p) {
  gameState.currentLevel = 0;
  gameState.totalStarsCollected = 0;
  
  if (gameState.world) {
    World.clear(gameState.world, false);
  }
  
  gameState.entities = [];
  gameState.ropes = [];
  gameState.stars = [];
  gameState.airCushions = [];
  gameState.bubbles = [];
  gameState.hazards = [];
  gameState.walls = [];
  gameState.candy = null;
  gameState.omNom = null;
  gameState.score = 0;
  gameState.starsCollected = [false, false, false];
  gameState.magicFingerUsed = false;

  p.logs.game_info.push({
    data: { event: "game_reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Expose globally
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
    
    // TEST_1: Load first level and cut first rope automatically
    if (gameState.gamePhase === "START") {
      gameState.currentLevel = 0;
      loadLevel(gameInstance._renderer, 0);
      gameState.gamePhase = "PLAYING";
      gameState.levelStartTime = Date.now();
      
      setTimeout(() => {
        if (gameState.ropes.length > 0) {
          gameState.ropes[0].cutRope();
        }
      }, 1000);
    }
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
    
    // TEST_2: Win scenario - teleport candy to Om Nom
    if (gameState.gamePhase === "START") {
      gameState.currentLevel = 0;
      loadLevel(gameInstance._renderer, 0);
      gameState.gamePhase = "PLAYING";
      gameState.levelStartTime = Date.now();
      
      setTimeout(() => {
        if (gameState.candy && gameState.omNom) {
          Body.setPosition(gameState.candy.body, {
            x: gameState.omNom.x,
            y: gameState.omNom.y
          });
        }
      }, 500);
    }
  }
};