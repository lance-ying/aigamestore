// controls.js - Input handling

import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';
import { createLevelItems } from './entities.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transition controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.level },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      gameState.gamePhase = GAME_PHASES.SHOP;
      gameState.shopSelection = 0;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.SHOP },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.SHOP) {
      // Continue to next level
      startNextLevel(p);
    }
  }
  
  if (p.keyCode === 27) { // ESC - Pause/Unpause
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p);
  }
  
  // Shop controls
  if (gameState.gamePhase === GAME_PHASES.SHOP) {
    handleShopInput(p);
  }
  
  return false; // Prevent default
}

function handleGameplayInput(p) {
  if (p.keyCode === 32) { // SPACE - Deploy claw
    if (gameState.clawState === "SWINGING") {
      gameState.clawState = "DEPLOYING";
    }
  }
  
  if (p.keyCode === 68) { // D - Use dynamite
    if (gameState.dynamiteCount > 0 && gameState.grabbedItem) {
      // Destroy the grabbed item
      gameState.grabbedItem.destroy();
      gameState.grabbedItem = null;
      gameState.dynamiteCount--;
      
      // Visual feedback could be added here
      p.logs.game_info.push({
        data: { action: "dynamite_used", dynamiteLeft: gameState.dynamiteCount },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (p.keyCode === 83) { // S - Use strength potion
    if (gameState.strengthPotionCount > 0 && !gameState.strengthActive) {
      gameState.strengthActive = true;
      gameState.strengthTimeLeft = 10; // 10 seconds
      gameState.strengthPotionCount--;
      
      p.logs.game_info.push({
        data: { action: "strength_potion_used", potionsLeft: gameState.strengthPotionCount },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function handleShopInput(p) {
  if (p.keyCode === 38) { // UP
    gameState.shopSelection = Math.max(0, gameState.shopSelection - 1);
  }
  
  if (p.keyCode === 40) { // DOWN
    gameState.shopSelection = Math.min(1, gameState.shopSelection + 1);
  }
  
  if (p.keyCode === 32) { // SPACE - Buy
    const items = ["DYNAMITE", "STRENGTH_POTION"];
    const selected = items[gameState.shopSelection];
    
    if (selected === "DYNAMITE") {
      const price = 100;
      if (gameState.money >= price) {
        gameState.money -= price;
        gameState.dynamiteCount++;
        
        p.logs.game_info.push({
          data: { action: "purchase", item: "dynamite", price },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (selected === "STRENGTH_POTION") {
      const price = 150;
      if (gameState.money >= price) {
        gameState.money -= price;
        gameState.strengthPotionCount++;
        
        p.logs.game_info.push({
          data: { action: "purchase", item: "strength_potion", price },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

function startNextLevel(p) {
  gameState.level++;
  gameState.target += 100;
  gameState.timeLeft = 60;
  gameState.money = 0;
  
  // Clear old items
  gameState.items.forEach(item => item.destroy());
  gameState.items = [];
  
  // Create new items
  gameState.items = createLevelItems(p);
  
  // Reset claw
  gameState.clawState = "SWINGING";
  gameState.clawAngle = 0;
  gameState.clawDirection = 1;
  gameState.clawLength = 0;
  gameState.grabbedItem = null;
  
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.level, target: gameState.target },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetGame(p) {
  gameState.level = 1;
  gameState.money = 0;
  gameState.target = 500;
  gameState.timeLeft = 60;
  gameState.dynamiteCount = 0;
  gameState.strengthPotionCount = 0;
  gameState.strengthActive = false;
  gameState.strengthTimeLeft = 0;
  
  // Clear items
  gameState.items.forEach(item => item.destroy());
  gameState.items = [];
  
  // Create new items
  gameState.items = createLevelItems(p);
  
  gameState.clawState = "SWINGING";
  gameState.clawAngle = 0;
  gameState.clawDirection = 1;
  gameState.clawLength = 0;
  gameState.grabbedItem = null;
  
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START, action: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}