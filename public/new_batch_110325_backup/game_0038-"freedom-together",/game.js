// game.js
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, ALIEN_WORDS } from './globals.js';
import { createRoomObjects } from './objects.js';
import { Character } from './character.js';
import { NarrativeEngine } from './narrative.js';
import { DictionaryUI, GameUI } from './ui.js';
import { drawStartScreen, drawPausedOverlay, drawGameOverScreen } from './screens.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let roomObjects = [];
  let character = null;
  let narrative = null;
  let dictionaryUI = null;
  let gameUI = null;
  
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize game objects
    roomObjects = createRoomObjects(p);
    character = new Character(300, 180, p);
    narrative = new NarrativeEngine();
    dictionaryUI = new DictionaryUI(p);
    gameUI = new GameUI(p);
    
    gameState.entities = roomObjects;
    gameState.player = character;
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: "INITIALIZED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(220, 210, 190);
    
    // Handle different game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p, narrative);
      return;
    }
    
    // Draw game environment
    gameUI.drawTimeIndicator();
    
    // Draw room
    drawRoom();
    
    // Draw objects
    for (let i = 0; i < roomObjects.length; i++) {
      roomObjects[i].draw(i === gameState.selectedObjectIndex && !gameState.dictionaryOpen);
    }
    
    // Update and draw character
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      character.update();
    }
    character.draw();
    
    // Draw UI
    gameUI.drawHUD();
    dictionaryUI.draw();
    
    // Draw pause overlay
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPausedOverlay(p);
    }
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        handleAutomatedInput(action);
      }
    }
  };
  
  function drawRoom() {
    // Floor
    p.fill(180, 160, 140);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
    
    // Walls
    p.fill(200, 190, 170);
    p.rect(0, 35, CANVAS_WIDTH, CANVAS_HEIGHT - 135);
    
    // Floor tiles
    p.stroke(160, 140, 120);
    p.strokeWeight(1);
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      p.line(x, CANVAS_HEIGHT - 100, x, CANVAS_HEIGHT);
    }
    for (let y = CANVAS_HEIGHT - 100; y < CANVAS_HEIGHT; y += 40) {
      p.line(0, y, CANVAS_WIDTH, y);
    }
  }
  
  p.keyPressed = function() {
    const key = p.key;
    const keyCode = p.keyCode;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase controls
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame();
      }
      return;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        restartGame();
      }
      return;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Only allow gameplay inputs during PLAYING phase
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    // Dictionary toggle
    if (keyCode === 90) { // Z
      gameState.dictionaryOpen = !gameState.dictionaryOpen;
      return;
    }
    
    // Handle dictionary input
    if (gameState.dictionaryOpen) {
      dictionaryUI.handleInput(key, keyCode);
      return;
    }
    
    // Object navigation
    if (keyCode === 37) { // LEFT
      gameState.selectedObjectIndex = (gameState.selectedObjectIndex - 1 + roomObjects.length) % roomObjects.length;
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedObjectIndex = (gameState.selectedObjectIndex + 1) % roomObjects.length;
    }
    
    // Interact with object
    if (keyCode === 32) { // SPACE
      interactWithObject();
    }
  };
  
  function handleAutomatedInput(action) {
    if (!action) return;
    
    // Log automated input
    p.logs.inputs.push({
      input_type: "automated",
      data: action,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Dictionary toggle
    if (action.keyCode === 90) {
      gameState.dictionaryOpen = !gameState.dictionaryOpen;
      return;
    }
    
    // Handle dictionary input
    if (gameState.dictionaryOpen) {
      dictionaryUI.handleInput(action.key, action.keyCode);
      return;
    }
    
    // Object navigation
    if (action.keyCode === 37) {
      gameState.selectedObjectIndex = (gameState.selectedObjectIndex - 1 + roomObjects.length) % roomObjects.length;
    } else if (action.keyCode === 39) {
      gameState.selectedObjectIndex = (gameState.selectedObjectIndex + 1) % roomObjects.length;
    }
    
    // Interact
    if (action.keyCode === 32) {
      interactWithObject();
    }
  }
  
  function interactWithObject() {
    const obj = roomObjects[gameState.selectedObjectIndex];
    
    // Discover word
    if (!obj.discovered) {
      obj.discovered = true;
      
      const wordInfo = {
        alienWord: obj.alienWord,
        context: obj.englishName,
        day: gameState.currentDay
      };
      
      gameState.discoveredWords.push(wordInfo);
      gameState.score += 5;
      
      // Character responds
      character.speak(`${obj.alienWord}!`, 120);
    } else {
      // Re-reveal word
      character.speak(`${obj.alienWord}...`, 100);
    }
    
    // Advance time
    gameState.interactionCount++;
    
    if (gameState.interactionCount % 3 === 0) {
      const gameEnded = narrative.advanceTime();
      
      if (gameEnded) {
        endGame();
      } else {
        // Update character mood and dialogue
        gameState.characterMood = narrative.determineCharacterMood();
        const dialogue = narrative.getCharacterDialogue("interaction");
        character.speak(dialogue, 180);
      }
    }
    
    // Log player info
    p.logs.player_info.push({
      screen_x: character.x,
      screen_y: character.y,
      game_x: character.x,
      game_y: character.y,
      framecount: p.frameCount
    });
  }
  
  function startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.currentDay = 1;
    gameState.timeOfDay = "morning";
    gameState.score = 0;
    gameState.selectedObjectIndex = 0;
    gameState.discoveredWords = [];
    gameState.playerDictionary = {};
    gameState.dictionaryOpen = false;
    gameState.interactionCount = 0;
    gameState.characterMood = "neutral";
    
    // Reset objects
    for (let obj of roomObjects) {
      obj.discovered = false;
    }
    
    // Initial greeting
    character.speak(narrative.getCharacterDialogue("greeting"), 200);
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", day: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function endGame() {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    // Bonus points for dictionary completion
    gameState.score += Object.keys(gameState.playerDictionary).length * 15;
    
    p.logs.game_info.push({
      data: { 
        phase: "GAME_OVER_WIN",
        finalScore: gameState.score,
        wordsLearned: Object.keys(gameState.playerDictionary).length
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function restartGame() {
    gameState.gamePhase = GAME_PHASES.START;
    
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}, document.body);

window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else {
    document.getElementById(`${mode.toLowerCase()}_ModeBtn`).classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};