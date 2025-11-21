import { gameState } from './globals.js';
import { craftItem, getAvailableRecipes } from './crafting.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame(p);
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING") {
    if (p.keyCode === 16) { // SHIFT - toggle crafting
      gameState.craftingMenuOpen = !gameState.craftingMenuOpen;
      if (gameState.craftingMenuOpen) {
        gameState.selectedRecipe = 0;
      }
    }
    
    if (gameState.craftingMenuOpen) {
      const recipes = getAvailableRecipes();
      
      if (p.keyCode === 38) { // UP
        gameState.selectedRecipe = Math.max(0, gameState.selectedRecipe - 1);
      } else if (p.keyCode === 40) { // DOWN
        gameState.selectedRecipe = Math.min(recipes.length - 1, gameState.selectedRecipe + 1);
      } else if (p.keyCode === 90) { // Z - craft
        if (recipes[gameState.selectedRecipe]) {
          craftItem(recipes[gameState.selectedRecipe]);
        }
      }
    }
  }
}

export function getPlayerInputs(p) {
  if (gameState.controlMode !== "HUMAN") {
    return getAutomatedInputs();
  }
  
  return {
    left: p.keyIsDown(37),
    right: p.keyIsDown(39),
    up: p.keyIsDown(38),
    down: p.keyIsDown(40),
    jump: p.keyIsDown(32),
    mining: p.keyIsDown(90),
  };
}

function getAutomatedInputs() {
  if (typeof window.get_automated_testing_action !== 'function') {
    return { left: false, right: false, up: false, down: false, jump: false, mining: false };
  }
  
  const action = window.get_automated_testing_action(gameState);
  return action || { left: false, right: false, up: false, down: false, jump: false, mining: false };
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  // Initialize player
  const Player = p.window.Player;
  gameState.player = new Player(gameState.spawnX, gameState.spawnY);
  gameState.entities = [gameState.player];
  
  gameState.playerHealth = 100;
  gameState.playerMaxHealth = 100;
  gameState.score = 0;
  gameState.time = 0;
  gameState.enemies = [];
  
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = "START";
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.playerInventory = {};
  gameState.score = 0;
  gameState.time = 0;
  gameState.bossesDefeated = [];
  gameState.unlockedRecipes = ["wooden_pickaxe", "wooden_sword", "stone_pickaxe", "stone_sword"];
  gameState.craftingMenuOpen = false;
  gameState.selectedRecipe = 0;
  
  // Regenerate world
  const generateWorld = p.window.generateWorld;
  gameState.blocks = generateWorld(p);
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}