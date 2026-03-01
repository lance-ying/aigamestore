import { CANVAS_WIDTH, CANVAS_HEIGHT, KEY, gameState, resetGame, getGameState, nextLevel, resetToLevel1 } from './globals.js';
import { Player, Enemy, Bullet, Obstacle, Pickup, ExtractionPoint, WeaponPickup, Particle } from './entities.js';
import { generateLevel } from './level.js';
import { drawUI, drawStartScreen, drawGameOverScreen } from './ui.js';
import { setupInputHandlers, keys, startGame, pauseGame, resumeGame } from './input.js';

function checkPointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
  return pointX >= rectX && pointY >= rectY && 
         pointX <= rectX + rectWidth && pointY <= rectY + rectHeight;
}

window.getGameState = getGameState;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Only the Human Mode button remains, so only activate it
  const activeButton = document.getElementById("humanModeBtn");
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

// New: Function to handle full game restart to PLAYING phase
export function restartGameAndPlay(p, isAutoRestart = false) {
    // Clear any pending auto-restart, whether this is manual or auto
    if (gameState.autoRestartTimeoutId) {
        clearTimeout(gameState.autoRestartTimeoutId);
        gameState.autoRestartTimeoutId = null;
    }
    gameState.autoRestartScheduled = false;

    resetToLevel1(); // Resets current level to 1, calls resetGame() which sets player to null
    gameState.gamePhase = "PLAYING"; // Set phase to PLAYING. The p.draw loop will then create the player and level.

    p.logs.game_info.push({
        "game_status": gameState.gamePhase,
        "data": { "restartType": isAutoRestart ? "auto" : "manual", "level": gameState.currentLevel },
        "framecount": p.frameCount,
        "timestamp": Date.now()
    });
}


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
    // Set background theme based on level
    // Level 1: Forest (Dark Green)
    // Level 2: Sea (Dark Blue)
    // Level 3: Base (Dark Gray - Original)
    // Level 4: Wasteland (Dark Brown)
    const themeIndex = (gameState.currentLevel - 1) % 4;
    
    if (themeIndex === 0) {
      p.background(25, 40, 25); // Forest
    } else if (themeIndex === 1) {
      p.background(20, 30, 50); // Sea
    } else if (themeIndex === 2) {
      p.background(30); // Base
    } else {
      p.background(45, 35, 25); // Wasteland
    }
    
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
        
      case "PLAYING":
        // Only HUMAN mode remains, so no special handling for other control modes
        
        // This block initializes player and level when entering PLAYING phase
        // or when player somehow becomes null (e.g. after resetGame() from nextLevel() or fullRestart())
        if (!gameState.player) {
          resetGame(); // Ensure all game objects are cleared
          generateLevel(p);
          gameState.player = new Player(gameState.level.width / 2, gameState.level.height / 2);
        }
        
        gameState.timeElapsed += 1/60;
        
        // Handle input - only keyboard input (keys object from input.js) for HUMAN mode
        let inputKeys = keys;
        
        gameState.player.update(p, inputKeys);
        
        p.logs.player_info.push({
          "screen_x": gameState.player.x - gameState.level.cameraX,
          "screen_y": gameState.player.y - gameState.level.cameraY,
          "game_x": gameState.player.x,
          "game_y": gameState.player.y,
          "framecount": p.frameCount,
          "timestamp": Date.now()
        });
        
        if (gameState.extractionPointObj) {
          gameState.extractionPointObj.update(p);
          
          if (p.dist(gameState.player.x, gameState.player.y, 
                      gameState.extractionPoint.x, gameState.extractionPoint.y) < 40) {
            
            // Check win condition: Reached extraction AND enough kills
            if (gameState.enemiesKilled >= gameState.requiredKills) {
              gameState.gamePhase = "GAME_OVER_WIN";
              gameState.score += 1000;
              
              p.logs.game_info.push({
                "game_status": gameState.gamePhase,
                "data": { "score": gameState.score },
                "framecount": p.frameCount,
                "timestamp": Date.now()
              });
            } else {
              // Show hint that more kills are needed
              p.push();
              p.fill(255, 50, 50);
              p.textSize(20);
              p.textAlign(p.CENTER, p.CENTER);
              p.text("ELIMINATE MORE ENEMIES TO EXTRACT!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4);
              p.pop();
            }
          }
        }
        
        for (let i = gameState.pickups.length - 1; i >= 0; i--) {
          const pickup = gameState.pickups[i];
          pickup.update(p);
          
          if (p.dist(gameState.player.x, gameState.player.y, pickup.x, pickup.y) < gameState.player.radius + pickup.radius) {
            if (pickup.type === "health") {
              gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30);
            } else if (pickup.type === "ammo") {
              // Add to reserve ammo instead of just filling clip
              const weapon = gameState.player.weapons[gameState.player.currentWeapon];
              weapon.reserveAmmo = Math.min(weapon.maxReserveAmmo, weapon.reserveAmmo + weapon.maxAmmo * 2);
              gameState.player.reserveAmmo = weapon.reserveAmmo;
              
              // Also fill current clip if possible
              if (gameState.player.ammo < gameState.player.maxAmmo) {
                 // But reload logic handles this usually, let's just add to reserve to force reload mechanic usage
                 // Or we can be nice and fill the clip too? Let's stick to reserve to make it "scarce" feeling
              }
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
        
        // Helper function for explosions
        const createExplosion = (x, y, radius, damage) => {
          // Visual effect
          p.push();
          p.noStroke();
          p.fill(255, 100, 0, 150);
          p.circle(x - gameState.level.cameraX, y - gameState.level.cameraY, radius * 2);
          p.fill(255, 200, 0, 200);
          p.circle(x - gameState.level.cameraX, y - gameState.level.cameraY, radius);
          p.pop();
          
          // Damage enemies
          for (const enemy of gameState.enemies) {
            const dist = p.dist(x, y, enemy.x, enemy.y);
            if (dist < radius + enemy.radius) {
              // Calculate falloff damage
              const damageFactor = 1 - (dist / (radius + enemy.radius));
              const actualDamage = Math.ceil(damage * damageFactor);
              
              const killed = enemy.takeDamage(actualDamage);
              if (killed && !enemy.dead) { // Prevent double counting
                enemy.dead = true;
                // We'll handle removal in the main loop or mark for removal
              }
            }
          }
        };

        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
          const enemy = gameState.enemies[i];
          if (enemy.dead) { // Handle explosion kills
             gameState.enemies.splice(i, 1);
             gameState.enemiesKilled++;
             gameState.score += 100; // Simplified score for explosion kills
             continue;
          }
          
          enemy.update(p, gameState.player);
          
          for (let j = gameState.bullets.length - 1; j >= 0; j--) {
            const bullet = gameState.bullets[j];
            if (p.dist(enemy.x, enemy.y, bullet.x, bullet.y) < enemy.radius + bullet.radius) {
              let killed = false;
              
              if (bullet.type === "rocket") {
                createExplosion(bullet.x, bullet.y, bullet.explosionRadius, bullet.explosionDamage);
                killed = enemy.takeDamage(bullet.damage); // Direct hit damage
              } else {
                killed = enemy.takeDamage(bullet.damage);
                // Spawn impact particles
                if (bullet.type === "laser") {
                  for (let k = 0; k < 8; k++) {
                    gameState.particles.push(new Particle(bullet.x, bullet.y, [0, 255, 255], 3, 4, 15));
                  }
                } else {
                  for (let k = 0; k < 5; k++) {
                    gameState.particles.push(new Particle(bullet.x, bullet.y, [255, 200, 0], 2, 3, 10));
                  }
                }
              }
              
              if (killed || enemy.dead) {
                if (!enemy.dead) { // If not already dead from explosion
                    gameState.enemies.splice(i, 1);
                    gameState.enemiesKilled++;
                    
                    // Score based on enemy type
                    if (enemy.type === "elite") gameState.score += 200;
                    else if (enemy.type === "heavy") gameState.score += 300;
                    else if (enemy.type === "scout") gameState.score += 150;
                    else if (enemy.type === "sniper") gameState.score += 250;
                    else if (enemy.type === "tank") gameState.score += 400;
                    else gameState.score += 100;
                    
                    if (Math.random() < 0.3) {
                      const pickupType = Math.random() < 0.4 ? "health" : "ammo";
                      gameState.pickups.push(new Pickup(enemy.x, enemy.y, pickupType));
                    }
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
          
          let hitObstacle = false;
          for (const obstacle of gameState.obstacles) {
            if (checkPointInRect(bullet.x, bullet.y, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
              if (bullet.type === "rocket") {
                createExplosion(bullet.x, bullet.y, bullet.explosionRadius, bullet.explosionDamage);
              } else {
                // Spawn wall hit particles
                if (bullet.type === "laser") {
                  for (let k = 0; k < 5; k++) {
                    gameState.particles.push(new Particle(bullet.x, bullet.y, [0, 255, 255], 2, 3, 10));
                  }
                } else {
                  for (let k = 0; k < 3; k++) {
                    gameState.particles.push(new Particle(bullet.x, bullet.y, [200, 200, 200], 1.5, 2, 10));
                  }
                }
              }
              gameState.bullets.splice(i, 1);
              hitObstacle = true;
              break;
            }
          }
          
          if (!hitObstacle && remove && i < gameState.bullets.length) {
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
        
        // Update and draw particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
          const particle = gameState.particles[i];
          const dead = particle.update();
          if (dead) {
            gameState.particles.splice(i, 1);
          } else {
            particle.draw(p);
          }
        }
        
        if (gameState.extractionPointObj) {
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
        // Draw particles (freeze them)
        for (const particle of gameState.particles) {
          particle.draw(p);
        }

        if (gameState.extractionPointObj) {
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
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        p.push();
        p.tint(255, 100);
        
        if (gameState.extractionPointObj) {
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

        // New: Auto-restart logic
        if (!gameState.autoRestartScheduled) {
            gameState.autoRestartScheduled = true;
            gameState.autoRestartTimeoutId = setTimeout(() => { // Using global setTimeout
                restartGameAndPlay(p, true); // Trigger auto-restart
            }, 1000); // 1 second
        }
        break;
    }
  };
});

window.gameInstance = gameInstance;

// Expose level loading functions for dev mode
window.loadLevel = function(levelNum) {
  const state = getGameState();
  if (state) {
    state.currentLevel = levelNum;
    resetGame();
    if (window.gameInstance) {
      generateLevel(window.gameInstance);
      state.player = new Player(state.level.width / 2, state.level.height / 2);
      state.gamePhase = "PLAYING";
    }
  }
};