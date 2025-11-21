import { CANVAS_WIDTH, CANVAS_HEIGHT, KEY, gameState, resetGame, getGameState, nextLevel } from './globals.js';
import { Player, Enemy, Bullet, Obstacle, Pickup, ExtractionPoint, WeaponPickup } from './entities.js';
import { generateLevel } from './level.js';
import { drawUI, drawStartScreen, drawGameOverScreen } from './ui.js';
import { setupInputHandlers, keys, handleAutomatedInputs, startGame, pauseGame, resumeGame, resetToStart } from './input.js';
import { game_testing_controller } from './automated_testing_controller.js';

function checkPointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
  return pointX >= rectX && pointX <= rectX + rectWidth && 
         pointY >= rectY && pointY <= rectY + rectHeight;
}

window.getGameState = getGameState;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  const activeButton = document.getElementById(mode === "HUMAN" ? "humanModeBtn" : `test_${mode.split('_')[1]}_ModeBtn`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
  
  if (window.gameInstance && window.gameInstance.logs) {
    window.gameInstance.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": { "controlMode": mode },
      "framecount": window.gameInstance.frameCount,
      "timestamp": Date.now()
    });
  }
};

const p5 = window.p5;
let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    p.logs = {
      "game_info": [],
      "player_info": [],
      "inputs": []
    };
    
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    
    setupInputHandlers(p);
    
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  };
  
  p.draw = function() {
    p.background(30);
    
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
        
      case "PLAYING":
        // Only use automated testing controller for non-RL, non-HUMAN modes
        if (gameState.controlMode !== "HUMAN" && gameState.controlMode !== "RL") {
          handleAutomatedInputs(p);
        }
        
        if (!gameState.player) {
          resetGame();
          generateLevel(p);
          gameState.player = new Player(gameState.level.width / 2, gameState.level.height / 2);
        }
        
        gameState.timeElapsed += 1/60;
        
        // Handle input - RL mode takes precedence over other input methods
        let inputKeys = keys;
        
        if (window.gymAPI && window.gymAPI.isRLMode && window.gymAPI.isRLMode()) {
          // RL mode active - read actions from RL agent
          const rlAction = window.gymAPI.getRLAction();
          
          // Convert action object to keys format (string properties, not keycodes)
          inputKeys = {
            left: rlAction.left || false,
            right: rlAction.right || false,
            up: rlAction.up || false,
            down: rlAction.down || false,
            shoot: rlAction.shoot || false,
            sprint: rlAction.sprint || false,
            crouch: rlAction.crouch || false,
          };
        }
        // Otherwise use normal keyboard input (keys object from input.js)
        
        gameState.player.update(p, inputKeys);
        
        p.logs.player_info.push({
          "screen_x": gameState.player.x - gameState.level.cameraX,
          "screen_y": gameState.player.y - gameState.level.cameraY,
          "game_x": gameState.player.x,
          "game_y": gameState.player.y,
          "framecount": p.frameCount,
          "timestamp": Date.now()
        });
        
        if (gameState.mission === "extraction" && gameState.extractionPointObj) {
          gameState.extractionPointObj.update(p);
          
          if (p.dist(gameState.player.x, gameState.player.y, 
                      gameState.extractionPoint.x, gameState.extractionPoint.y) < 40) {
            gameState.gamePhase = "GAME_OVER_WIN";
            gameState.score += 1000;
            
            p.logs.game_info.push({
              "game_status": gameState.gamePhase,
              "data": { "score": gameState.score },
              "framecount": p.frameCount,
              "timestamp": Date.now()
            });
          }
        }
        
        for (let i = gameState.pickups.length - 1; i >= 0; i--) {
          const pickup = gameState.pickups[i];
          pickup.update(p);
          
          if (p.dist(gameState.player.x, gameState.player.y, pickup.x, pickup.y) < gameState.player.radius + pickup.radius) {
            if (pickup.type === "health") {
              gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30);
            } else if (pickup.type === "ammo") {
              gameState.player.ammo = gameState.player.maxAmmo;
              gameState.player.weapons[gameState.player.currentWeapon].ammo = gameState.player.ammo;
              gameState.player.reloading = false;
            }
            
            gameState.pickups.splice(i, 1);
            gameState.score += 50;
          }
        }
        
        // Handle weapon pickups
        for (let i = gameState.weaponPickups.length - 1; i >= 0; i--) {
          const weaponPickup = gameState.weaponPickups[i];
          weaponPickup.update(p);
          
          if (p.dist(gameState.player.x, gameState.player.y, weaponPickup.x, weaponPickup.y) < gameState.player.radius + weaponPickup.radius) {
            gameState.player.pickupWeapon(weaponPickup.weaponType);
            gameState.weaponPickups.splice(i, 1);
            gameState.score += 100;
          }
        }
        
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
          const enemy = gameState.enemies[i];
          enemy.update(p, gameState.player);
          
          for (let j = gameState.bullets.length - 1; j >= 0; j--) {
            const bullet = gameState.bullets[j];
            if (p.dist(enemy.x, enemy.y, bullet.x, bullet.y) < enemy.radius + bullet.radius) {
              const killed = enemy.takeDamage(bullet.damage);
              if (killed) {
                gameState.enemies.splice(i, 1);
                gameState.enemiesKilled++;
                
                // Score based on enemy type
                if (enemy.type === "elite") gameState.score += 200;
                else if (enemy.type === "heavy") gameState.score += 300;
                else if (enemy.type === "scout") gameState.score += 150;
                else if (enemy.type === "sniper") gameState.score += 250;
                else gameState.score += 100;
                
                if (gameState.mission === "elimination" && gameState.enemiesKilled >= gameState.requiredKills) {
                  gameState.gamePhase = "GAME_OVER_WIN";
                  gameState.score += 500;
                  
                  p.logs.game_info.push({
                    "game_status": gameState.gamePhase,
                    "data": { "score": gameState.score },
                    "framecount": p.frameCount,
                    "timestamp": Date.now()
                  });
                }
                
                if (Math.random() < 0.3) {
                  const pickupType = Math.random() < 0.4 ? "health" : "ammo";
                  gameState.pickups.push(new Pickup(enemy.x, enemy.y, pickupType));
                }
              }
              
              gameState.bullets.splice(j, 1);
              break;
            }
          }
        }
        
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
          const bullet = gameState.bullets[i];
          const remove = bullet.update();
          
          for (const obstacle of gameState.obstacles) {
            if (checkPointInRect(bullet.x, bullet.y, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
              gameState.bullets.splice(i, 1);
              break;
            }
          }
          
          if (remove && i < gameState.bullets.length) {
            gameState.bullets.splice(i, 1);
          }
        }
        
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
          const bullet = gameState.enemyBullets[i];
          const remove = bullet.update();
          
          if (p.dist(gameState.player.x, gameState.player.y, bullet.x, bullet.y) < gameState.player.radius + bullet.radius) {
            gameState.player.takeDamage(bullet.damage);
            gameState.enemyBullets.splice(i, 1);
            continue;
          }
          
          for (const obstacle of gameState.obstacles) {
            if (checkPointInRect(bullet.x, bullet.y, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
              gameState.enemyBullets.splice(i, 1);
              break;
            }
          }
          
          if (remove && i < gameState.enemyBullets.length) {
            gameState.enemyBullets.splice(i, 1);
          }
        }
        
        if (gameState.mission === "extraction" && gameState.extractionPointObj) {
          gameState.extractionPointObj.draw(p);
        }
        
        for (const obstacle of gameState.obstacles) {
          obstacle.draw(p);
        }
        
        for (const pickup of gameState.pickups) {
          pickup.draw(p);
        }
        
        for (const weaponPickup of gameState.weaponPickups) {
          weaponPickup.draw(p);
        }
        
        for (const enemy of gameState.enemies) {
          enemy.draw(p);
        }
        
        gameState.player.draw(p);
        
        for (const bullet of gameState.bullets) {
          bullet.draw(p);
        }
        
        for (const bullet of gameState.enemyBullets) {
          bullet.draw(p);
        }
        
        drawUI(p);
        break;
        
      case "PAUSED":
        if (gameState.mission === "extraction" && gameState.extractionPointObj) {
          gameState.extractionPointObj.draw(p);
        }
        
        for (const obstacle of gameState.obstacles) {
          obstacle.draw(p);
        }
        
        for (const pickup of gameState.pickups) {
          pickup.draw(p);
        }
        
        for (const weaponPickup of gameState.weaponPickups) {
          weaponPickup.draw(p);
        }
        
        for (const enemy of gameState.enemies) {
          enemy.draw(p);
        }
        
        if (gameState.player) {
          gameState.player.draw(p);
        }
        
        for (const bullet of gameState.bullets) {
          bullet.draw(p);
        }
        
        for (const bullet of gameState.enemyBullets) {
          bullet.draw(p);
        }
        
        drawUI(p);
        
        p.fill(0, 100);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        p.push();
        p.tint(255, 100);
        
        if (gameState.mission === "extraction" && gameState.extractionPointObj) {
          gameState.extractionPointObj.draw(p);
        }
        
        for (const obstacle of gameState.obstacles) {
          obstacle.draw(p);
        }
        
        for (const pickup of gameState.pickups) {
          pickup.draw(p);
        }
        
        for (const weaponPickup of gameState.weaponPickups) {
          weaponPickup.draw(p);
        }
        
        for (const enemy of gameState.enemies) {
          enemy.draw(p);
        }
        
        if (gameState.player) {
          gameState.player.draw(p);
        }
        
        p.pop();
        
        drawGameOverScreen(p, gameState.gamePhase === "GAME_OVER_WIN");
        break;
    }
  };
});

window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.level = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode

// Expose level loading functions for dev mode