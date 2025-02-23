// game.js

// Global variables for the player, enemy, target, game state and environmental elements.
let player, enemy, target;
let gameState = "playing"; // "playing", "won", or "lost"

// Environment Agent: Global clouds array for moving cloud effects.
let clouds = [];

// ------------------------
// Central Agent: Game Initialization and Overall Logic
// ------------------------
function initializeGame() {
  gameState = "playing";
  
  // Initialize the player at the center of the canvas
  player = new Player(width / 2, height / 2, 20, color(0, 0, 255));
  
  // Initialize the enemy at a random edge (ensuring it's not too close to the player)
  let ex, ey;
  if (random() < 0.5) {
    // spawn along left or right edge
    ex = random() < 0.5 ? 0 + 20 : width - 20;
    ey = random(20, height - 20);
  } else {
    // spawn along top or bottom edge
    ex = random(20, width - 20);
    ey = random() < 0.5 ? 0 + 20 : height - 20;
  }
  enemy = new Enemy(ex, ey, 20, color(255, 0, 0));
  
  // Initialize the target randomly within the canvas (avoid edges)
  target = new Target(random(40, width - 40), random(40, height - 40), 15, color(0, 255, 0));
}

function setup() {
  createCanvas(800, 600);
  initializeGame();
  initEnvironment();
}

function draw() {
  background(220);
  
  // Environment Agent: Update and draw environmental effects.
  updateEnvironment();
  drawEnvironment();

  if (gameState === "playing") {
    // Update and show player
    player.update();
    player.show();
    
    // Update and show enemy (simple AI that chases the player with gradually increasing speed)
    enemy.update(player);
    enemy.show();
    
    // Show the target
    target.show();

    // Check for winning: if player reaches the target
    if (player.collidesWith(target)) {
      gameState = "won";
    }

    // Check for losing: if enemy touches the player
    if (player.collidesWith(enemy)) {
      gameState = "lost";
    }
    
    // Display instructions
    fill(0);
    textSize(16);
    text("Use arrow keys or WASD to move. Press space to dash (if moving).", 10, height - 20);
  } else {
    // End game messages with restart instructions
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(0);
    if (gameState === "won") {
      text("Congratulations! You reached the target!", width / 2, height / 2);
    } else if (gameState === "lost") {
      text("Game Over! The enemy caught you.", width / 2, height / 2);
    }
    textSize(18);
    text("Press 'R' to restart.", width / 2, height / 2 + 40);
  }
}

// ------------------------
// Character Agent: Player Class with Enhanced Dash Trail Effect
// ------------------------
class Player {
  constructor(x, y, r, col) {
    this.pos = createVector(x, y);
    this.r = r;
    this.col = col;
    this.speed = 3;
    // For dash functionality
    this.dashDistance = 75;
    this.dashCooldown = 0; // in frames
    // Last nonzero movement vector (for dash)
    this.lastMove = createVector(0, 0);
    // Dash trail effect storage: each element has a position and an alpha value.
    this.dashTrail = [];
  }
  
  update() {
    let move = createVector(0, 0);
    
    // Arrow keys and WASD controls
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // LEFT or 'a'
      move.x = -1;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // RIGHT or 'd'
      move.x = 1;
    }
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // UP or 'w'
      move.y = -1;
    }
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // DOWN or 's'
      move.y = 1;
    }
    
    // Normalize movement if any key is pressed
    if (move.mag() !== 0) {
      move.normalize();
      // Save the last nonzero movement for dash purposes.
      this.lastMove = move.copy();
    }
    
    // Update player position based on speed
    this.pos.add(p5.Vector.mult(move, this.speed));
    
    // Keep player inside the canvas boundaries
    this.pos.x = constrain(this.pos.x, this.r, width - this.r);
    this.pos.y = constrain(this.pos.y, this.r, height - this.r);
    
    // Cooldown timer for dash (if > 0, decrement it)
    if (this.dashCooldown > 0) {
      this.dashCooldown--;
    }
    
    // Update dash trail effects: decrease alpha and remove faded trails.
    for (let i = this.dashTrail.length - 1; i >= 0; i--) {
      this.dashTrail[i].alpha -= 5;
      if (this.dashTrail[i].alpha <= 0) {
        this.dashTrail.splice(i, 1);
      }
    }
  }
  
  show() {
    // Draw dash trail effects
    noStroke();
    for (let trail of this.dashTrail) {
      let rCol = red(this.col);
      let gCol = green(this.col);
      let bCol = blue(this.col);
      fill(rCol, gCol, bCol, trail.alpha);
      ellipse(trail.pos.x, trail.pos.y, this.r * 2);
    }
    
    // Draw the player
    fill(this.col);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }
  
  dash() {
    // Only dash if a movement direction exists and dash is not on cooldown.
    if (this.lastMove.mag() !== 0 && this.dashCooldown === 0) {
      // Perform dash by moving the player quickly in the last direction.
      let dashVector = p5.Vector.mult(this.lastMove, this.dashDistance);
      this.pos.add(dashVector);
      // Ensure player does not dash out of boundaries
      this.pos.x = constrain(this.pos.x, this.r, width - this.r);
      this.pos.y = constrain(this.pos.y, this.r, height - this.r);
      // Add a dash trail marker at the new position
      this.dashTrail.push({ pos: this.pos.copy(), alpha: 200 });
      // Set dash cooldown (e.g., 120 frames = 2 seconds at 60fps)
      this.dashCooldown = 120;
    }
  }
  
  // Check collision with a circular object (enemy) or target (we treat target as a circle for simplicity)
  collidesWith(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    return d < this.r + other.r;
  }
}

// ------------------------
// Central Agent: Enemy Class with Gradually Increasing Speed
// ------------------------
class Enemy {
  constructor(x, y, r, col) {
    this.pos = createVector(x, y);
    this.r = r;
    this.col = col;
    this.speed = 2;
  }
  
  update(player) {
    // Calculate vector toward the player.
    let direction = p5.Vector.sub(player.pos, this.pos);
    if (direction.mag() !== 0) {
      direction.normalize().mult(this.speed);
      this.pos.add(direction);
    }
    
    // Gradually increase enemy speed to boost challenge over time.
    this.speed += 0.001;
    
    // Keep enemy inside the canvas boundaries.
    this.pos.x = constrain(this.pos.x, this.r, width - this.r);
    this.pos.y = constrain(this.pos.y, this.r, height - this.r);
  }
  
  show() {
    fill(this.col);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }
  
  // For collision detection, we mimic the same property as the player.
  get posObj() {
    return this.pos;
  }
}

// ------------------------
// Central Agent: Target Class
// ------------------------
class Target {
  constructor(x, y, r, col) {
    this.pos = createVector(x, y);
    this.r = r;
    this.col = col;
  }
  
  show() {
    fill(this.col);
    noStroke();
    // Draw as a rectangle for variation
    rectMode(CENTER);
    rect(this.pos.x, this.pos.y, this.r * 2, this.r * 2);
  }
}

// ------------------------
// Environment Agent: Cloud and Scenery Functions
// ------------------------
function initEnvironment() {
  // Initialize clouds with random positions, speeds, and sizes.
  clouds = [];
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: random(width),
      y: random(50, 200),
      speed: random(0.3, 1),
      size: random(60, 120)
    });
  }
}

function updateEnvironment() {
  // Update cloud positions for a drifting effect.
  for (let cloud of clouds) {
    cloud.x += cloud.speed;
    if (cloud.x - cloud.size / 2 > width) {
      cloud.x = -cloud.size / 2;
      cloud.y = random(50, 200);
      cloud.speed = random(0.3, 1);
      cloud.size = random(60, 120);
    }
  }
}

function drawEnvironment() {
  // Draw moving clouds
  noStroke();
  fill(255, 255, 255, 200);
  for (let cloud of clouds) {
    ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6);
  }
  
  // Draw simple ground hills as scenery
  fill(100, 200, 100);
  rect(0, height - 50, width, 50);
}

// ------------------------
// Input Handling: Dash and Restart
// ------------------------
function keyPressed() {
  // Dash functionality for the player when playing.
  if (key === ' ' && gameState === "playing") {
    player.dash();
  }
  
  // Restart the game when not playing by pressing 'R' or 'r'.
  if ((key === 'r' || key === 'R') && gameState !== "playing") {
    initializeGame();
  }
}