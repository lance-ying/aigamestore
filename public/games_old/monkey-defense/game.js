import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, START_MONEY, START_LIVES, MAX_WAVES, TOWER_TYPES, gameState, getGameState } from './globals.js';
import { Tower, Balloon, Projectile, generatePath, generateWave } from './entities.js';
import { game_testing_controller } from './automated_testing_controller.js';

// Particle system for visual effects
class Particle {
  constructor(x, y, color, vx, vy) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx || (Math.random() - 0.5) * 4;
    this.vy = vy || (Math.random() - 0.5) * 4 - 2;
    this.life = 60;
    this.maxLife = 60;
    this.size = Math.random() * 4 + 2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life--;
    return this.life <= 0;
  }
  
  draw(p) {
    p.push();
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size);
    p.pop();
  }
}

// Initialize p5 instance
const p5 = window.p5;
let gameInstance = new p5(p => {
  // Particle array
  const particles = [];
  
  // Initialize logs (write-only)
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };

  // Add particles
  function addParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, color));
    }
  }

  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Initialize game path
    gameState.path = generatePath(p);
    
    // Log game start
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  };

  // Draw function
  p.draw = function() {
    // Nice gradient background
    drawGradientBackground();
    
    // Game state handling
    switch(gameState.gamePhase) {
      case "START":
        drawStartScreen();
        break;
      case "PLAYING":
        updateGame();
        drawGame();
        break;
      case "PAUSED":
        drawGame();
        drawPauseScreen();
        break;
      case "GAME_OVER_WIN":
        drawGame();
        drawGameOverScreen(true);
        break;
      case "GAME_OVER_LOSE":
        drawGame();
        drawGameOverScreen(false);
        break;
    }
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].update()) {
        particles.splice(i, 1);
      } else {
        particles[i].draw(p);
      }
    }
    
    // Handle automated testing
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
      gameState.framesSinceLastAction++;
      const action = window.game_testing_controller(gameState);
      if (action !== null) {
        handleAutomatedAction(action);
      }
    }
  };

  // Draw gradient background
  function drawGradientBackground() {
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
      const c = p.lerpColor(p.color(60, 140, 80), p.color(40, 90, 50), inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
  }

  // Handle automated action
  function handleAutomatedAction(keyCode) {
    // Simulate key press
    switch(keyCode) {
      case 37: // Left arrow
        moveCursor(-GRID_SIZE, 0);
        break;
      case 39: // Right arrow
        moveCursor(GRID_SIZE, 0);
        break;
      case 38: // Up arrow
        moveCursor(0, -GRID_SIZE);
        break;
      case 40: // Down arrow
        moveCursor(0, GRID_SIZE);
        break;
      case 32: // Space
        placeTower();
        break;
      case 90: // Z
        cycleTower();
        break;
      case 16: // Shift
        upgradeTower();
        break;
      case 13: // Enter - Start wave
        startWave();
        break;
    }
    
    // Log the action
    p.logs.inputs.push({
      "input_type": "keyPressed",
      "data": { key: String.fromCharCode(keyCode), keyCode: keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }

  // Start screen
  function drawStartScreen() {
    drawGradientBackground();
    
    // Draw path
    drawPath();
    
    // Title with glow effect
    p.push();
    p.drawingContext.shadowBlur = 20;
    p.drawingContext.shadowColor = 'rgba(255, 215, 0, 0.8)';
    p.fill(255, 215, 0);
    p.textSize(42);
    p.textStyle(p.BOLD);
    p.text("🐵 MONKEY DEFENSE 🎯", CANVAS_WIDTH / 2, 80);
    p.pop();
    
    // Instructions with nice styling
    p.fill(255, 255, 255, 240);
    p.textSize(16);
    p.textStyle(p.NORMAL);
    p.text("Defend against 15 waves of balloons!", CANVAS_WIDTH / 2, 130);
    p.textSize(14);
    p.text("Place towers strategically to pop balloons", CANVAS_WIDTH / 2, 160);
    p.text("Don't let balloons reach the exit!", CANVAS_WIDTH / 2, 180);
    
    // Start prompt with pulsing effect
    const pulseAlpha = 200 + Math.sin(p.frameCount * 0.1) * 55;
    p.fill(255, 215, 0, pulseAlpha);
    p.textSize(22);
    p.textStyle(p.BOLD);
    p.text("⚡ PRESS ENTER TO START ⚡", CANVAS_WIDTH / 2, 320);
    
    // Draw a monkey logo
    drawMonkeyLogo(CANVAS_WIDTH / 2, 250);
  }

  // Monkey logo for start screen with better styling
  function drawMonkeyLogo(x, y) {
    p.push();
    p.translate(x, y);
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(2, 4, 52, 52);
    
    // Body with gradient effect
    p.fill(139, 69, 19);
    p.stroke(80, 40, 10);
    p.strokeWeight(2);
    p.ellipse(0, 0, 50, 50);
    
    // Ears
    p.ellipse(-20, -20, 20, 20);
    p.ellipse(20, -20, 20, 20);
    
    // Face
    p.fill(222, 184, 135);
    p.ellipse(0, 0, 30, 30);
    
    // Eyes with shine
    p.fill(0);
    p.noStroke();
    p.ellipse(-8, -5, 7, 7);
    p.ellipse(8, -5, 7, 7);
    p.fill(255);
    p.ellipse(-7, -6, 2, 2);
    p.ellipse(9, -6, 2, 2);
    
    // Mouth
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    p.arc(0, 5, 15, 10, 0, p.PI);
    
    p.pop();
  }

  // Game over screen with better styling
  function drawGameOverScreen(isWin) {
    p.push();
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (isWin) {
      // Victory with glow
      p.drawingContext.shadowBlur = 30;
      p.drawingContext.shadowColor = 'rgba(0, 255, 0, 0.8)';
      p.fill(0, 255, 0);
      p.textSize(48);
      p.textStyle(p.BOLD);
      p.text("🎉 VICTORY! 🎉", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      p.drawingContext.shadowBlur = 0;
      
      p.fill(255, 255, 200);
      p.textSize(18);
      p.textStyle(p.NORMAL);
      p.text("You defended against all waves!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else {
      // Game over with red glow
      p.drawingContext.shadowBlur = 30;
      p.drawingContext.shadowColor = 'rgba(255, 0, 0, 0.8)';
      p.fill(255, 50, 50);
      p.textSize(48);
      p.textStyle(p.BOLD);
      p.text("💥 GAME OVER 💥", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      p.drawingContext.shadowBlur = 0;
      
      p.fill(255, 200, 200);
      p.textSize(18);
      p.textStyle(p.NORMAL);
      p.text("The balloons broke through your defense", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text("Final Score: " + gameState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    
    const pulseAlpha = 200 + Math.sin(p.frameCount * 0.1) * 55;
    p.fill(255, 215, 0, pulseAlpha);
    p.textSize(22);
    p.textStyle(p.BOLD);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    p.pop();
  }

  // Pause screen
  function drawPauseScreen() {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.drawingContext.shadowBlur = 20;
    p.drawingContext.shadowColor = 'rgba(255, 255, 255, 0.5)';
    p.fill(255);
    p.textSize(36);
    p.textStyle(p.BOLD);
    p.text("⏸ PAUSED ⏸", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.drawingContext.shadowBlur = 0;
    
    p.textSize(16);
    p.textStyle(p.NORMAL);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.pop();
  }

  // Game update
  function updateGame() {
    // Update wave timer
    if (gameState.waveStarted) {
      gameState.waveTimer++;
      
      // Spawn balloons from current wave (start spawning after 30 frames, then every 30 frames)
      if (gameState.waveTimer >= 30 && gameState.waveTimer % 30 === 0 && gameState.currentWaveBalloons.length > 0) {
        const balloon = gameState.currentWaveBalloons.shift();
        // Initialize balloon position at the start of the path
        if (gameState.path.length > 0) {
          balloon.x = gameState.path[0].x;
          balloon.y = gameState.path[0].y;
        }
        gameState.entities.balloons.push(balloon);
      }
      
      // Check if wave is complete
      const activeBalloonsCount = gameState.entities.balloons.filter(b => !b.popped).length;
      if (activeBalloonsCount === 0 && gameState.currentWaveBalloons.length === 0) {
        gameState.waveStarted = false;
        gameState.wave++;
        gameState.waveTimer = 0;
        
        // Check for win condition
        if (gameState.wave > MAX_WAVES) {
          gameState.gamePhase = "GAME_OVER_WIN";
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": { score: gameState.score },
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        }
      }
    }
    
    // Update towers
    for (const tower of gameState.entities.towers) {
      const income = tower.update(p, gameState.entities.balloons, gameState.entities.projectiles);
      if (income > 0) {
        gameState.money += income;
      }
    }
    
    // Update balloons
    for (let i = gameState.entities.balloons.length - 1; i >= 0; i--) {
      const balloon = gameState.entities.balloons[i];
      
      if (balloon.popped) {
        // Add pop particles
        addParticles(balloon.x, balloon.y, balloon.config.color, 8);
        gameState.entities.balloons.splice(i, 1);
        continue;
      }
      
      const reachedEnd = balloon.update(p, gameState.path);
      
      if (reachedEnd) {
        gameState.lives -= 1;
        gameState.entities.balloons.splice(i, 1);
        
        // Check for lose condition
        if (gameState.lives <= 0) {
          gameState.gamePhase = "GAME_OVER_LOSE";
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": { score: gameState.score },
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        }
      }
    }
    
    // Update projectiles
    for (let i = gameState.entities.projectiles.length - 1; i >= 0; i--) {
      const projectile = gameState.entities.projectiles[i];
      let shouldRemove = projectile.update();
      
      // Check for hits
      for (const balloon of gameState.entities.balloons) {
        if (!balloon.popped && projectile.checkHit(p, balloon)) {
          const reward = balloon.takeDamage(projectile.damage);
          if (balloon.popped) {
            gameState.money += reward;
            gameState.score += reward;
          }
          
          // Remove non-explosive projectiles after hit
          if (!projectile.explosive && !projectile.exploded) {
            shouldRemove = true;
            break;
          }
        }
      }
      
      if (shouldRemove) {
        gameState.entities.projectiles.splice(i, 1);
      }
    }
    
    // Find hovered tower
    gameState.cursor.hoveredTower = null;
    for (const tower of gameState.entities.towers) {
      if (p.dist(gameState.cursor.x, gameState.cursor.y, tower.x, tower.y) < 20) {
        gameState.cursor.hoveredTower = tower;
        break;
      }
    }
    
    // Log player info
    p.logs.player_info.push({
      "screen_x": gameState.cursor.x,
      "screen_y": gameState.cursor.y,
      "game_x": gameState.cursor.x,
      "game_y": gameState.cursor.y,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }

  // Game drawing
  function drawGame() {
    drawGradientBackground();
    
    // Draw grass texture
    drawGrassTexture();
    
    // Draw path
    drawPath();
    
    // Draw towers
    for (const tower of gameState.entities.towers) {
      tower.draw(p);
    }
    
    // Draw balloons
    for (const balloon of gameState.entities.balloons) {
      if (!balloon.popped) {
        balloon.draw(p);
      }
    }
    
    // Draw projectiles
    for (const projectile of gameState.entities.projectiles) {
      projectile.draw(p);
    }
    
    // Draw UI
    drawUI();
    
    // Draw cursor
    drawCursor();
  }

  // Draw grass texture
  function drawGrassTexture() {
    p.push();
    p.noStroke();
    p.randomSeed(42);
    for (let i = 0; i < 200; i++) {
      const x = p.random(CANVAS_WIDTH);
      const y = p.random(CANVAS_HEIGHT);
      p.fill(40, p.random(80, 120), 40, 60);
      p.ellipse(x, y, 3, 3);
    }
    p.pop();
  }

  // Draw the path with better styling
  function drawPath() {
    p.push();
    
    // Outer border (darker)
    p.noFill();
    p.stroke(60, 40, 20);
    p.strokeWeight(36);
    p.beginShape();
    for (const point of gameState.path) {
      p.vertex(point.x, point.y);
    }
    p.endShape();
    
    // Main path
    p.stroke(140, 100, 60);
    p.strokeWeight(32);
    p.beginShape();
    for (const point of gameState.path) {
      p.vertex(point.x, point.y);
    }
    p.endShape();
    
    // Lighter center line
    p.stroke(180, 140, 90);
    p.strokeWeight(28);
    p.beginShape();
    for (const point of gameState.path) {
      p.vertex(point.x, point.y);
    }
    p.endShape();
    
    // Center detail lines
    p.stroke(200, 160, 110, 150);
    p.strokeWeight(2);
    p.strokeCap(p.ROUND);
    p.beginShape();
    for (const point of gameState.path) {
      p.vertex(point.x, point.y - 5);
    }
    p.endShape();
    p.beginShape();
    for (const point of gameState.path) {
      p.vertex(point.x, point.y + 5);
    }
    p.endShape();
    
    p.pop();
  }

  // Draw UI elements with better styling
  function drawUI() {
    p.push();
    
    // Top bar with gradient and shadow
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
    const gradient = p.drawingContext.createLinearGradient(0, 0, 0, 45);
    gradient.addColorStop(0, 'rgba(40, 40, 40, 0.95)');
    gradient.addColorStop(1, 'rgba(25, 25, 25, 0.95)');
    p.drawingContext.fillStyle = gradient;
    p.drawingContext.fillRect(0, 0, CANVAS_WIDTH, 45);
    p.drawingContext.shadowBlur = 0;
    
    // Money with icon and glow
    p.fill(255, 215, 0);
    p.textSize(18);
    p.textAlign(p.LEFT, p.CENTER);
    p.textStyle(p.BOLD);
    p.text("💰 $" + gameState.money, 20, 22);
    
    // Lives with heart icon
    p.fill(255, 100, 100);
    p.text("❤️ " + gameState.lives, 120, 22);
    
    // Wave info
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    if (gameState.waveStarted) {
      p.text("🌊 Wave " + gameState.wave + "/" + MAX_WAVES, CANVAS_WIDTH / 2, 22);
    } else if (gameState.wave <= MAX_WAVES) {
      p.fill(100, 255, 100);
      p.text("⚡ Press ENTER for Wave " + gameState.wave + "/" + MAX_WAVES, CANVAS_WIDTH / 2, 22);
    }
    
    // Score
    p.fill(100, 200, 255);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text("⭐ " + gameState.score, CANVAS_WIDTH - 20, 22);
    
    // Bottom bar with gradient
    const bottomGradient = p.drawingContext.createLinearGradient(0, CANVAS_HEIGHT - 45, 0, CANVAS_HEIGHT);
    bottomGradient.addColorStop(0, 'rgba(25, 25, 25, 0.95)');
    bottomGradient.addColorStop(1, 'rgba(40, 40, 40, 0.95)');
    p.drawingContext.fillStyle = bottomGradient;
    p.drawingContext.fillRect(0, CANVAS_HEIGHT - 45, CANVAS_WIDTH, 45);
    
    // Selected tower info with better styling
    p.fill(255, 255, 255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    const towerConfig = TOWER_TYPES[gameState.cursor.selectedTower];
    p.text("🏰 " + towerConfig.name, 20, CANVAS_HEIGHT - 25);
    
    p.fill(255, 215, 0);
    p.textSize(14);
    p.text("$" + towerConfig.cost, 20, CANVAS_HEIGHT - 10);
    
    // Instructions
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(200, 200, 200);
    p.textSize(12);
    p.text("Press Z to change tower", CANVAS_WIDTH - 20, CANVAS_HEIGHT - 22);
    
    p.pop();
  }

  // Draw cursor with improved visuals
  function drawCursor() {
    p.push();
    
    // Check if cursor is over path
    let isOverPath = false;
    for (let i = 0; i < gameState.path.length - 1; i++) {
      const point1 = gameState.path[i];
      const point2 = gameState.path[i + 1];
      
      const dist = distanceToLineSegment(
        gameState.cursor.x, gameState.cursor.y,
        point1.x, point1.y,
        point2.x, point2.y
      );
      
      if (dist < 20) {
        isOverPath = true;
        break;
      }
    }
    
    // Draw placement preview
    if (!gameState.cursor.hoveredTower && !isOverPath) {
      const towerConfig = TOWER_TYPES[gameState.cursor.selectedTower];
      
      // Range circle with glow
      p.noFill();
      p.stroke(255, 255, 255, 100);
      p.strokeWeight(2);
      p.ellipse(gameState.cursor.x, gameState.cursor.y, towerConfig.range * 2);
      
      // Inner glow
      p.stroke(255, 255, 255, 50);
      p.strokeWeight(1);
      p.ellipse(gameState.cursor.x, gameState.cursor.y, towerConfig.range * 2 - 4);
      
      // Tower preview with shadow
      p.drawingContext.shadowBlur = 8;
      p.drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
      p.fill(...towerConfig.color, 180);
      p.stroke(255, 255, 255, 180);
      p.strokeWeight(2);
      p.ellipse(gameState.cursor.x, gameState.cursor.y, 18, 18);
      p.drawingContext.shadowBlur = 0;
      
      // Show if can afford
      if (gameState.money < towerConfig.cost) {
        p.stroke(255, 50, 50);
        p.strokeWeight(3);
        p.line(
          gameState.cursor.x - 18, gameState.cursor.y - 18,
          gameState.cursor.x + 18, gameState.cursor.y + 18
        );
        p.line(
          gameState.cursor.x + 18, gameState.cursor.y - 18,
          gameState.cursor.x - 18, gameState.cursor.y + 18
        );
      }
    }
    
    // Show upgrade info for hovered tower
    if (gameState.cursor.hoveredTower) {
      const tower = gameState.cursor.hoveredTower;
      
      // Tooltip background with shadow
      p.drawingContext.shadowBlur = 10;
      p.drawingContext.shadowColor = 'rgba(0, 0, 0, 0.6)';
      p.fill(30, 30, 30, 240);
      p.stroke(100, 100, 255);
      p.strokeWeight(2);
      p.rect(gameState.cursor.x + 15, gameState.cursor.y - 40, 130, 55, 5);
      p.drawingContext.shadowBlur = 0;
      
      p.fill(255, 255, 100);
      p.textSize(13);
      p.textAlign(p.LEFT, p.TOP);
      p.textStyle(p.BOLD);
      p.text(tower.config.name + " ⭐" + tower.level, gameState.cursor.x + 20, gameState.cursor.y - 35);
      
      // Upgrade info
      p.textStyle(p.NORMAL);
      p.textSize(11);
      p.fill(200, 200, 200);
      p.text("Upgrade: $" + tower.config.upgradePrice, gameState.cursor.x + 20, gameState.cursor.y - 18);
      
      // Can upgrade indicator
      if (tower.canUpgrade(gameState.money)) {
        p.fill(100, 255, 100);
        p.text("✓ Press SHIFT", gameState.cursor.x + 20, gameState.cursor.y - 2);
      } else {
        p.fill(255, 100, 100);
        p.text("✗ Cannot afford", gameState.cursor.x + 20, gameState.cursor.y - 2);
      }
    }
    
    // Cursor box with glow effect
    const glowSize = 2 + Math.sin(p.frameCount * 0.1) * 1;
    p.drawingContext.shadowBlur = glowSize * 3;
    p.drawingContext.shadowColor = 'rgba(255, 255, 255, 0.8)';
    p.noFill();
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.rect(gameState.cursor.x - 12, gameState.cursor.y - 12, 24, 24, 3);
    p.drawingContext.shadowBlur = 0;
    
    // Inner accent
    p.stroke(255, 255, 100, 150);
    p.strokeWeight(1);
    p.rect(gameState.cursor.x - 10, gameState.cursor.y - 10, 20, 20, 2);
    
    p.pop();
  }

  // Move cursor
  function moveCursor(dx, dy) {
    gameState.cursor.x = p.constrain(gameState.cursor.x + dx, 20, CANVAS_WIDTH - 20);
    gameState.cursor.y = p.constrain(gameState.cursor.y + dy, 50, CANVAS_HEIGHT - 50);
  }

  // Function to calculate distance from point to line segment
  function distanceToLineSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return p.dist(px, py, x1, y1);
    
    let param = dot / lenSq;
    
    if (param < 0) {
      return p.dist(px, py, x1, y1);
    } else if (param > 1) {
      return p.dist(px, py, x2, y2);
    } else {
      const xx = x1 + param * C;
      const yy = y1 + param * D;
      return p.dist(px, py, xx, yy);
    }
  }

  // Place tower
  function placeTower() {
    if (gameState.cursor.hoveredTower) return;
    
    let isOverPath = false;
    for (let i = 0; i < gameState.path.length - 1; i++) {
      const point1 = gameState.path[i];
      const point2 = gameState.path[i + 1];
      
      const dist = distanceToLineSegment(
        gameState.cursor.x, gameState.cursor.y,
        point1.x, point1.y,
        point2.x, point2.y
      );
      
      if (dist < 20) {
        isOverPath = true;
        break;
      }
    }
    
    if (isOverPath) return;
    
    const towerConfig = TOWER_TYPES[gameState.cursor.selectedTower];
    if (gameState.money >= towerConfig.cost) {
      const tower = new Tower(gameState.cursor.selectedTower, gameState.cursor.x, gameState.cursor.y);
      gameState.entities.towers.push(tower);
      gameState.money -= towerConfig.cost;
      
      // Add placement particles
      addParticles(gameState.cursor.x, gameState.cursor.y, [100, 255, 100], 15);
    }
  }

  // Cycle tower type
  function cycleTower() {
    const types = Object.keys(TOWER_TYPES);
    let currentIndex = types.indexOf(gameState.cursor.selectedTower);
    currentIndex = (currentIndex + 1) % types.length;
    gameState.cursor.selectedTower = types[currentIndex];
  }

  // Upgrade tower
  function upgradeTower() {
    if (gameState.cursor.hoveredTower) {
      const tower = gameState.cursor.hoveredTower;
      if (tower.canUpgrade(gameState.money)) {
        const cost = tower.upgrade();
        gameState.money -= cost;
        
        // Add upgrade particles
        addParticles(tower.x, tower.y, [255, 215, 0], 20);
      }
    }
  }

  // Start wave function
  function startWave() {
    if (!gameState.waveStarted && gameState.wave <= MAX_WAVES) {
      gameState.waveStarted = true;
      gameState.waveTimer = 0;
      gameState.currentWaveBalloons = generateWave(gameState.wave);
    }
  }

  // Reset game
  function resetGame() {
    gameState.entities.towers = [];
    gameState.entities.balloons = [];
    gameState.entities.projectiles = [];
    gameState.money = START_MONEY;
    gameState.lives = START_LIVES;
    gameState.score = 0;
    gameState.wave = 1;
    gameState.waveStarted = false;
    gameState.waveTimer = 0;
    gameState.currentWaveBalloons = [];
    gameState.cursor.selectedTower = "DART";
    gameState.cursor.hoveredTower = null;
    
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }

  // Key pressed handler
  p.keyPressed = function() {
    p.logs.inputs.push({
      "input_type": "keyPressed",
      "data": { key: p.key, keyCode: p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    if (gameState.controlMode !== "HUMAN") return;
    
    switch(gameState.gamePhase) {
      case "START":
        if (p.keyCode === 13) {
          gameState.gamePhase = "PLAYING";
          resetGame();
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": {},
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        }
        break;
      case "PLAYING":
        if (p.keyCode === 27) {
          gameState.gamePhase = "PAUSED";
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": {},
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        } else if (p.keyCode === 13) {
          startWave();
        } else if (p.keyCode === 37) {
          moveCursor(-GRID_SIZE, 0);
        } else if (p.keyCode === 39) {
          moveCursor(GRID_SIZE, 0);
        } else if (p.keyCode === 38) {
          moveCursor(0, -GRID_SIZE);
        } else if (p.keyCode === 40) {
          moveCursor(0, GRID_SIZE);
        } else if (p.keyCode === 32) {
          placeTower();
        } else if (p.keyCode === 90) {
          cycleTower();
        } else if (p.keyCode === 16) {
          upgradeTower();
        }
        break;
      case "PAUSED":
        if (p.keyCode === 27) {
          gameState.gamePhase = "PLAYING";
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": {},
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        }
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        if (p.keyCode === 82) {
          gameState.gamePhase = "START";
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": {},
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        }
        break;
    }
  };

  // Key released handler
  p.keyReleased = function() {
    p.logs.inputs.push({
      "input_type": "keyReleased",
      "data": { key: p.key, keyCode: p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  };
  
  // Expose addParticles globally for entities
  window.addGameParticles = addParticles;
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Set control mode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.framesSinceLastAction = 0;
  
  gameInstance.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": { controlMode: mode },
    "framecount": gameInstance.frameCount,
    "timestamp": Date.now()
  });
  
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else {
    document.getElementById(mode.toLowerCase() + '_ModeBtn').classList.add('active');
  }
};

window.getGameState = getGameState;