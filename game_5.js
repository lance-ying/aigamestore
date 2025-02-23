// game.js

// Global variables for our game
let player;
let enemies = [];
let bullets = [];
let gameOver = false;
let gameWin = false;
let lastShotTime = 0;
const shotCooldown = 300; // milliseconds between shots
let gameState = "start"; // "start", "playing", "gameOver", "gameWin"

function setup() {
  createCanvas(800, 600);
  resetGame();
}

function resetGame() {
  gameOver = false;
  gameWin = false;
  // Reset arrays
  player = new Player(width / 2, height / 2);
  enemies = [];
  bullets = [];
  lastShotTime = 0;
  // Create 2 enemy agents positioned at opposite corners
  enemies.push(new Enemy(80, 80));
  enemies.push(new Enemy(width - 80, height - 80));
  // Set game state to playing if not in intro
  if (gameState !== "start") {
    gameState = "playing";
  }
}

function draw() {
  // Change background based on gameState for visual feedback.
  if (gameState === "start") {
    background(50);
    drawIntro();
  } else if (gameState === "playing") {
    background(30);
    // Game area border
    stroke(255);
    noFill();
    rect(0, 0, width, height);
  
    // Update and show the player
    player.update();
    player.show();
  
    // Update and show enemies and enemy bullets
    for (let i = enemies.length - 1; i >= 0; i--) {
      let enemy = enemies[i];
      enemy.update();
      enemy.show();
      enemy.tryToShoot();
    }
  
    // Update and show bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      let b = bullets[i];
      b.update();
      b.show();
  
      // Remove bullets that are off screen
      if (b.offScreen()) {
        bullets.splice(i, 1);
        continue;
      }
  
      // Check collisions between bullets and agents
      // Player bullet collisions with enemies
      if (b.owner === "player") {
        for (let j = enemies.length - 1; j >= 0; j--) {
          let enemy = enemies[j];
          if (collides(b, enemy)) {
            enemy.health -= 50;
            enemy.isHit = true;
            bullets.splice(i, 1);
            if (enemy.health <= 0) {
              enemies.splice(j, 1);
            }
            break;
          }
        }
      }
  
      // Enemy bullet collisions with player
      if (b.owner === "enemy") {
        if (collides(b, player)) {
          player.health -= 20;
          bullets.splice(i, 1);
          break;
        }
      }
    }
  
    // Display UI elements
    displayUI();
  
    // Check victory and failure conditions
    if (enemies.length === 0) {
      gameWin = true;
      gameState = "gameWin";
    }
    if (player.health <= 0) {
      gameOver = true;
      gameState = "gameOver";
    }
  } else {
    // End game state: Display success or failure message with instructions to restart.
    background(20);
    textAlign(CENTER, CENTER);
    textSize(32);
    noStroke();
    fill(255);
    if (gameWin) {
      text("Mission Accomplished! You Win!", width / 2, height / 2 - 20);
    } else if (gameOver) {
      text("Game Over! You have been defeated.", width / 2, height / 2 - 20);
    }
    textSize(18);
    text("Press R to restart", width / 2, height / 2 + 20);
  }
}

// Introductory screen with story narrative and instructions
function drawIntro() {
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(22);
  const narrative = "In the age before memory, when the lands of Aranthis thrummed with magic and mystery, a time of legends was born...\n\n" +
                    "In a remote valley shrouded by mists and ancient oaks, you awaken with no recollection of who you are—yet an undeniable pull calls you to destiny.\n\n" +
                    "Press ENTER to begin your odyssey.";
  text(narrative, width / 2, height / 2);
}

// Display UI elements like health bar and instructions
function displayUI() {
  fill(255);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text("Health: " + player.health, 10, 10);
  text("Enemies Remaining: " + enemies.length, 10, 30);
  text("Arrow keys to move.\nW, A, S, D to aim.\nSPACE to shoot.", 10, 50);
}

// Detect collision between a bullet and an agent (player or enemy)
// Both bullet and agent are considered circles
function collides(b, agent) {
  let d = dist(b.pos.x, b.pos.y, agent.pos.x, agent.pos.y);
  return d < (b.size + agent.size) / 2;
}

// Player class
class Player {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 40;
    this.health = 100;
    this.aim = createVector(0, -1);
    this.speed = 4;
    this.vel = createVector(0, 0);
  }
  
  update() {
    // Handle movement with arrow keys with inertia
    let move = createVector(0, 0);
    if (keyIsDown(LEFT_ARROW)) {
      move.x -= 1;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      move.x += 1;
    }
    if (keyIsDown(UP_ARROW)) {
      move.y -= 1;
    }
    if (keyIsDown(DOWN_ARROW)) {
      move.y += 1;
    }
    // Increase speed if SHIFT is held down
    let currentSpeed = keyIsDown(SHIFT) ? 6 : 4;
    if (move.mag() > 0) {
      move.setMag(currentSpeed);
    }
    // Apply inertia using linear interpolation
    this.vel = p5.Vector.lerp(this.vel, move, 0.2);
    this.pos.add(this.vel);
    
    // Constrain player within the canvas
    this.pos.x = constrain(this.pos.x, this.size / 2, width - this.size / 2);
    this.pos.y = constrain(this.pos.y, this.size / 2, height - this.size / 2);
  
    // Update shooting aim using W, A, S, D keys.
    let aimChange = createVector(0, 0);
    if (keyIsDown(87)) { // W key
      aimChange.y -= 1;
    }
    if (keyIsDown(83)) { // S key
      aimChange.y += 1;
    }
    if (keyIsDown(65)) { // A key
      aimChange.x -= 1;
    }
    if (keyIsDown(68)) { // D key
      aimChange.x += 1;
    }
    if (aimChange.mag() > 0) {
      this.aim = aimChange.copy().normalize();
    }
  }
  
  show() {
    // Change color based on health
    noStroke();
    if (this.health < 30) {
      fill(255, 50, 50);
    } else {
      fill(0, 150, 255);
    }
    ellipse(this.pos.x, this.pos.y, this.size);
    
    // Draw the shooting aim direction
    stroke(255);
    strokeWeight(2);
    let aimLineLength = this.size;
    line(this.pos.x, this.pos.y, this.pos.x + this.aim.x * aimLineLength, this.pos.y + this.aim.y * aimLineLength);
    
    // Refined cooldown indicator: a circular arc around the player
    noFill();
    stroke(255, 255, 0);
    strokeWeight(3);
    let cdProgress = constrain((millis() - lastShotTime) / shotCooldown, 0, 1);
    arc(this.pos.x, this.pos.y, this.size + 10, this.size + 10, -HALF_PI, -HALF_PI + TWO_PI * cdProgress);
  }
  
  shoot() {
    let bulletSpeed = 7;
    let vel = p5.Vector.mult(this.aim, bulletSpeed);
    bullets.push(new Bullet(this.pos.x, this.pos.y, vel, "player"));
  }
}

// Enemy class
class Enemy {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 35;
    this.health = 100;
    this.shootInterval = 1500;
    this.lastShot = millis();
    this.isHit = false;
  }
  
  update() {
    let direction = p5.Vector.sub(player.pos, this.pos);
    let distance = direction.mag();
    direction.normalize();
    // Slow down enemy if far from the player
    if (distance > 300) {
      direction.mult(0.3);
    } else {
      direction.mult(0.5);
      // Add a small random offset for unpredictability
      let randomOffset = p5.Vector.random2D().mult(0.3);
      direction.add(randomOffset);
    }
    this.pos.add(direction);
  }
  
  show() {
    noStroke();
    // Flash effect if hit
    if (this.isHit) {
      fill(255);
      this.isHit = false;
    } else {
      fill(255, 50, 50);
    }
    ellipse(this.pos.x, this.pos.y, this.size);
    
    // Simple health bar above the enemy
    fill(0);
    rect(this.pos.x - this.size / 2, this.pos.y - this.size, this.size, 5);
    fill(0, 255, 0);
    let healthWidth = map(this.health, 0, 100, 0, this.size);
    rect(this.pos.x - this.size / 2, this.pos.y - this.size, healthWidth, 5);
  }
  
  tryToShoot() {
    if (millis() - this.lastShot > this.shootInterval) {
      let bulletSpeed = 5;
      let direction = p5.Vector.sub(player.pos, this.pos);
      direction.normalize();
      direction.mult(bulletSpeed);
      bullets.push(new Bullet(this.pos.x, this.pos.y, direction, "enemy"));
      // 30% chance to shoot an extra bullet with a slight offset
      if (random(1) < 0.3) {
        let extraDir = direction.copy();
        extraDir.rotate(random(-0.2, 0.2));
        bullets.push(new Bullet(this.pos.x, this.pos.y, extraDir, "enemy"));
      }
      this.lastShot = millis();
    }
  }
}

// Bullet class
class Bullet {
  constructor(x, y, velocity, owner) {
    this.pos = createVector(x, y);
    this.vel = velocity;
    this.size = 10;
    this.owner = owner; // "player" or "enemy"
  }
  
  update() {
    this.pos.add(this.vel);
  }
  
  show() {
    noStroke();
    if (this.owner === "player") {
      fill(255, 255, 0);
    } else {
      fill(255, 100, 100);
    }
    ellipse(this.pos.x, this.pos.y, this.size);
  }
  
  offScreen() {
    return (this.pos.x < -this.size || this.pos.x > width + this.size ||
            this.pos.y < -this.size || this.pos.y > height + this.size);
  }
}

// Key pressed event to handle shooting, starting, and restarting the game.
function keyPressed() {
  if (gameState === "start" && keyCode === ENTER) {
    gameState = "playing";
  } else if (gameState === "playing") {
    if (key === ' ' && millis() - lastShotTime > shotCooldown) {
      player.shoot();
      lastShotTime = millis();
    }
  } else if ((gameState === "gameOver" || gameState === "gameWin") && key === 'r') {
    gameState = "playing";
    resetGame();
  }
}