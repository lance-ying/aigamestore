// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Character, WallMaiden } from './character.js';
import { initializeBattle } from './battle.js';
import { renderGame } from './rendering.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
    
    // Initialize party
    const mule = new WallMaiden("Mule", 1, 1);
    const warrior = new Character("Warrior", 1, 2);
    warrior.attack = 18;
    warrior.hp = 110;
    warrior.maxHp = 110;
    
    const mage = new Character("Mage", 2, 1);
    mage.magic = 20;
    mage.attack = 10;
    mage.maxMp = 70;
    mage.mp = 70;
    
    gameState.party = [mule, warrior, mage];
    gameState.entities = [...gameState.party];
    gameState.player = mule;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: mule.x,
      screen_y: mule.y,
      game_x: mule.gridX,
      game_y: mule.gridY,
      framecount: p.frameCount
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      processAutomatedInput(p);
    }
    
    // Start battle when entering PLAYING phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.enemies.length === 0) {
      initializeBattle(gameState.currentFloor);
    }
    
    // Render
    renderGame(p);
    
    // Log player position changes
    if (gameState.player && p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.gridX,
        game_y: gameState.player.gridY,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
});

// Expose game instance
window.gameInstance = gameInstance;

// Control mode switching
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

export default gameInstance;