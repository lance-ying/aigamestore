// game.js - Main game file

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  SUBPHASE_OVERWORLD
} from './globals.js';
import { Player } from './player.js';
import { World } from './world.js';
import { Creo } from './creo.js';
import { renderGame } from './rendering.js';
import { handleKeyPressed, updatePlayerMovement, processAutomatedTestingInput } from './input.js';
import { updateBattleAnimation } from './battle.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let world;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize game state
    initializeGame(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { event: "GAME_INIT", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Update game
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p, world);
    }
    
    // Render
    renderGame(p, world);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode, world);
    }
  };
  
  function initializeGame(p) {
    // Create player
    gameState.player = new Player(50, 50);
    
    // Create world
    world = new World(p);
    
    // Store NPCs in gameState for testing
    gameState.entities = world.npcs;
    
    // Give player a starter Creo
    const starterSpecies = ["FLAMEPUP", "AQUATAIL", "LEAFLING"];
    const randomStarter = starterSpecies[Math.floor(Math.random() * starterSpecies.length)];
    const starterCreo = new Creo(randomStarter, 5);
    gameState.playerTeam.push(starterCreo);
    
    // Log player info
    logPlayerInfo(p);
  }
  
  function updateGame(p, world) {
    // Process automated testing input
    if (gameState.controlMode !== "HUMAN") {
      processAutomatedTestingInput(p, world);
    }
    
    // Update player
    if (gameState.subPhase === SUBPHASE_OVERWORLD) {
      if (gameState.controlMode === "HUMAN") {
        updatePlayerMovement(p, world);
      }
      gameState.player.update();
    }
    
    // Update battle animations
    if (gameState.inBattle) {
      updateBattleAnimation();
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      logPlayerInfo(p);
    }
  }
  
  function logPlayerInfo(p) {
    const player = gameState.player;
    if (player) {
      p.logs.player_info.push({
        screen_x: player.x,
        screen_y: player.y,
        game_x: player.x,
        game_y: player.y,
        framecount: p.frameCount
      });
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn", "test_4_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn",
    "TEST_4": "test_4_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};