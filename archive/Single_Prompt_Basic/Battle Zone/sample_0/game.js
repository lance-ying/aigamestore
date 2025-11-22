import { CANVAS_WIDTH, CANVAS_HEIGHT, KEY, gameState, resetGame, getGameState } from './globals.js';
import { Player, Enemy, Bullet, Obstacle, Pickup, ExtractionPoint } from './entities.js';
import { generateLevel } from './level.js';
import { drawUI, drawStartScreen, drawGameOverScreen } from './ui.js';
import { setupInputHandlers, keys, handleAutomatedInputs, startGame, pauseGame, resumeGame, resetToStart } from './input.js';
import { game_testing_controller } from './automated_testing_controller.js';

// Helper function for point in rectangle collision detection
function checkPointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
  return pointX >= rectX && pointX <= rectX + rectWidth && 
         pointY >= rectY && pointY <= rectY + rectHeight;
}

// Make getGameState globally accessible
window.getGameState = getGameState;

// Set control mode function (for test buttons)
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  const activeButton = document.getElementById(mode === "HUMAN" ? "humanModeBtn" : `test_${mode.split('_')[1]}_ModeBtn`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
  
  // Log control mode change
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
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize the logs
    p.logs = {
      "game_info": [],
      "player_info": [],
      "inputs": []
    };
    
    // Set initial game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    
    // Setup input handlers
    setupInputHandlers(p);
    
    // Log initial game state
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  };
  
  // Draw function - main game loop
  p.draw = function() {
    p.background(30);
    
    // Handle game state
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
        
      case "PLAYING":
        // Handle automated inputs if not in HUMAN mode
        if (gameState.controlMode !== "HUMAN") {
          handleAutomatedInputs(p);
        }
        
        // Initialize level and player if not already done
        if (!gameState.player) {
          resetGame();
          generateLevel(p);
          gameState.player = new Player(gameState.level.width / 2, gameState.level.height / 2);
        }
        
        // Update game time
        gameState.timeElapsed += 1/60; // Add 1/60th of a second
        
        // Update player
        gameState.player.update(p, keys);
        
        // Log player info
        p.logs.player_info.push({
          "screen_x": gameState.player.x - gameState.level.cameraX,
          "screen_y": gameState.player.y - gameState.level.cameraY,
          "game_x": gameState.player.x,
          "game_y": gameState.player.y,
          "framecount": p.frameCount,
          "timestamp": Date.now()
        });
        
        // Update extraction point if it exists
        if (gameState.mission === "extraction" && gameState.extractionPointObj) {
          gameState.extractionPointObj.update(p);
          
          // Check if player reached extraction point
          if (p.dist(gameState.player.x, gameState.player.y, 
                      gameState.extractionPoint.x, gameState.extractionPoint.y) < 40) {
            gameState.gamePhase = "GAME_OVER_WIN";
            gameState.score += 1000; // Bonus for extraction
            
            // Log game status change
            p.logs.game_info.push({
              "game_status": gameState.gamePhase,
              "data": { "score": gameState.score },
              "framecount": p.frameCount,
              "timestamp": Date.now()
            });
          }
        }
        
        // Update pickups
        for (let i = gameState.pickups.length - 1; i >= 0; i--) {
          const pickup = gameState.pickups[i];
          pickup.update(p);
          
          // Check collision with player
          if (p.dist(gameState.player.x, gameState.player.y, pickup.x, pickup.y) < gameState.player.radius + pickup.radius) {
            // Apply pickup effect
            if (pickup.type === "health") {
              gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30);
            } else if (pickup.type === "ammo") {
              gameState.player.ammo = gameState.player.maxAmmo;
              gameState.player.reloading = false;
            }
            
            // Remove pickup
            gameState.pickups.splice(i, 1);
            gameState.score += 50;
          }
        }
        
        // Update enemies
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
          const enemy = gameState.enemies[i];
          enemy.update(p, gameState.player);
          
          // Check collision with player bullets
          for (let j = gameState.bullets.length - 1; j >= 0; j--) {
            const bullet = gameState.bullets[j];
            if (p.dist(enemy.x, enemy.y, bullet.x, bullet.y) < enemy.radius + bullet.radius) {
              // Enemy hit
              const killed = enemy.takeDamage();
              if (killed) {
                gameState.enemies.splice(i, 1);
                gameState.enemiesKilled++;
                gameState.score += enemy.type === "elite" ? 200 : 100;
                
                // Check win condition for elimination mission
                if (gameState.mission === "elimination" && gameState.enemiesKilled >= gameState.requiredKills) {
                  gameState.gamePhase = "GAME_OVER_WIN";
                  gameState.score += 500; // Bonus for elimination
                  
                  // Log game status change
                  p.logs.game_info.push({
                    "game_status": gameState.gamePhase,
                    "data": { "score": gameState.score },
                    "framecount": p.frameCount,
                    "timestamp": Date.now()
                  });
                }
                
                // Chance to drop pickup
                if (Math.random() < 0.3) {
                  const pickupType = Math.random() < 0.4 ? "health" : "ammo";
                  gameState.pickups.push(new Pickup(enemy.x, enemy.y, pickupType));
                }
              }
              
              // Remove bullet
              gameState.bullets.splice(j, 1);
              break;
            }
          }
        }
        
        // Update player bullets
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
          const bullet = gameState.bullets[i];
          const remove = bullet.update();
          
          // Check collision with obstacles
          for (const obstacle of gameState.obstacles) {
            if (checkPointInRect(bullet.x, bullet.y, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
              gameState.bullets.splice(i, 1);
              break;
            }
          }
          
          // Remove if out of bounds
          if (remove && i < gameState.bullets.length) {
            gameState.bullets.splice(i, 1);
          }
        }
        
        // Update enemy bullets
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
          const bullet = gameState.enemyBullets[i];
          const remove = bullet.update();
          
          // Check collision with player
          if (p.dist(gameState.player.x, gameState.player.y, bullet.x, bullet.y) < gameState.player.radius + bullet.radius) {
            gameState.player.takeDamage(bullet.damage);
            gameState.enemyBullets.splice(i, 1);
            continue;
          }
          
          // Check collision with obstacles
          for (const obstacle of gameState.obstacles) {
            if (checkPointInRect(bullet.x, bullet.y, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
              gameState.enemyBullets.splice(i, 1);
              break;
            }
          }
          
          // Remove if out of bounds
          if (remove && i < gameState.enemyBullets.length) {
            gameState.enemyBullets.splice(i, 1);
          }
        }
        
        // Draw level elements
        // Draw extraction point if applicable
        if (gameState.mission === "extraction" && gameState.extractionPointObj) {
          gameState.extractionPointObj.draw(p);
        }
        
        // Draw obstacles
        for (const obstacle of gameState.obstacles) {
          obstacle.draw(p);
        }
        
        // Draw pickups
        for (const pickup of gameState.pickups) {
          pickup.draw(p);
        }
        
        // Draw enemies
        for (const enemy of gameState.enemies) {
          enemy.draw(p);
        }
        
        // Draw player
        gameState.player.draw(p);
        
        // Draw bullets
        for (const bullet of gameState.bullets) {
          bullet.draw(p);
        }
        
        for (const bullet of gameState.enemyBullets) {
          bullet.draw(p);
        }
        
        // Draw UI
        drawUI(p);
        break;
        
      case "PAUSED":
        // Draw the paused game state
        
        // Draw level elements
        if (gameState.mission === "extraction" && gameState.extractionPointObj) {
          gameState.extractionPointObj.draw(p);
        }
        
        for (const obstacle of gameState.obstacles) {
          obstacle.draw(p);
        }
        
        for (const pickup of gameState.pickups) {
          pickup.draw(p);
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
        
        // Draw UI with pause indicator
        drawUI(p);
        
        // Draw semi-transparent overlay
        p.fill(0, 100);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        // Draw the game over screen
        
        // Draw level elements faded in background
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
        
        for (const enemy of gameState.enemies) {
          enemy.draw(p);
        }
        
        if (gameState.player) {
          gameState.player.draw(p);
        }
        
        p.pop();
        
        // Draw game over UI
        drawGameOverScreen(p, gameState.gamePhase === "GAME_OVER_WIN");
        break;
    }
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;