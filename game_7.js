// game.js

let player, enemy;
let platforms = [];
let gems = [];
let spikes = []; // Hazard array: deadly environmental traps
let score = 0;
let totalGems = 5;
let gameTimer = 60; // seconds
let timeElapsed = 0;
let gameState = "intro"; // "intro", "playing", "gameOver", "levelComplete"
let bonusScore = 0; // bonus score for timely completion

// Ambient particle system for environmental effects
let ambientParticles = [];

// Raindrops for subtle rain effect
let raindrops = [];

// function preload() {
//   // Preload sound assets (removed)
// }

function setup() {
  createCanvas(800, 400);
  textFont('Helvetica', 16);
  // Initialize game objects
  initGame();
}

function initGame() {
  // Create player (the controllable agent)
  player = new Player(50, height - 100);
  // Create enemy (non-controllable agent)
  enemy = new Enemy(600, height - 100);
  // Reset arrays and variables
  platforms = [];
  gems = [];
  spikes = [];
  
  // Create platforms
  // Ground platform
  platforms.push(new Platform(0, height - 50, width, 50));
  // Floating platforms
  platforms.push(new Platform(150, 280, 150, 20));
  platforms.push(new Platform(400, 200, 150, 20));
  platforms.push(new Platform(650, 150, 100, 20));

  // Create gems (collectable items) placed on platforms
  gems.push(new Gem(200, 280 - 15));
  gems.push(new Gem(475, 200 - 15));
  gems.push(new Gem(700, 150 - 15));
  gems.push(new Gem(100, height - 50 - 15));
  gems.push(new Gem(750, height - 50 - 15));

  // Create spikes on a couple of platforms as hazardous traps
  spikes.push(new Spike(250, 280 - 10, 30, 10)); // on first floating platform
  spikes.push(new Spike(500, 200 - 10, 30, 10)); // on second floating platform

  score = 0;
  totalGems = 5;
  timeElapsed = 0;
  gameTimer = 60;
  bonusScore = 0;

  // Initialize ambient particles for background effect (increased count for more mystique)
  ambientParticles = [];
  for (let i = 0; i < 40; i++) {
    ambientParticles.push(new Particle(random(width), random(height), random(0.3, 1)));
  }
  
  // Initialize raindrops for environmental rain effect
  raindrops = [];
  for (let i = 0; i < 50; i++) {
    raindrops.push(new Raindrop(random(width), random(-height, 0), random(4, 7)));
  }
}

function draw() {
  // Draw a dark gradient-like background
  background(30, 30, 50);
  
  // Draw rain effect
  drawRain();
  
  // Update and display ambient particles
  for (let particle of ambientParticles) {
    particle.update();
    particle.show();
  }
  
  if (gameState === "intro") {
    displayIntro();
  } else if (gameState === "playing") {
    playGame();
  } else {
    endGame();
  }
}

function drawRain() {
  for (let drop of raindrops) {
    drop.update();
    drop.show();
  }
}

function displayIntro() {
  // Display the updated narrative and instructions to start the game
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(22);
  text("Elyndria: Shattered Echoes", width / 2, height / 2 - 120);
  
  textSize(16);
  let narrative = "In the twilight of shattered echoes, Elyndria's rain-soaked ruins whisper forgotten legends. \n" +
    "Once a sanctuary brimming with ancient magic and nature's embrace, its crumbling arches and moss-clad relics \n" +
    "now harbor both secrets and perils. The remnants of the Shadow Lord have cursed every stone, yet hidden among \n" +
    "the mist and falling rain lie sacred gems—the keys to renewing Elyndria's lost brilliance. \n" +
    "As the chosen wanderer, you must brave the relentless downpour, recover each gem, and evade deadly snares. \n" +
    "Every second saved fuels ancient power, for in this realm of sorrow and splintered light, \n" +
    "time itself is both a foe and an ally. \n\n" +
    "Use arrow keys or A/D to move, UP/Space/W to jump. \n" +
    "Avoid spikes, enemies, and the relentless countdown. Press 'S' to embrace your perilous destiny.";
  text(narrative, width / 2, height / 2 - 40);
}

function playGame() {
  // Update timer 
  timeElapsed += deltaTime / 1000;
  gameTimer = max(60 - timeElapsed, 0);
  if (gameTimer <= 0) {
    gameState = "gameOver";
  }
  
  // Show HUD with clear success and failure criteria
  fill(255);
  textAlign(LEFT, TOP);
  text("Time Left: " + nf(gameTimer, 1, 2) + "s", 10, 10);
  text("Gems Collected: " + score + " / " + totalGems, 10, 30);
  text("Health: " + player.health, 10, 50);
  
  // Display platforms
  for (let p of platforms) {
    p.show();
  }
  
  // Display gems
  for (let gem of gems) {
    gem.show();
  }
  
  // Display spikes (environmental hazards)
  for (let spike of spikes) {
    spike.show();
  }
  
  // Update and display player & enemy
  player.update();
  player.applyGravity();
  player.checkPlatforms(platforms);
  player.show();
  
  enemy.update();
  enemy.show();
  
  // Check collision between player and gems
  for (let i = gems.length - 1; i >= 0; i--) {
    if (player.collects(gems[i])) {
      gems.splice(i, 1);
      score++;
    }
  }
  
  // Check collision between player and enemy (apply damage only if not invulnerable)
  if (player.hits(enemy)) {
    player.takeDamage(1, 20);
    if (player.health <= 0) {
      gameState = "gameOver";
    }
  }
  
  // Check collision between player and spikes (hazard collision)
  for (let spike of spikes) {
    if (player.hitsSpike(spike)) {
      player.takeDamage(1, 15);
      // Avoid multiple hits in one frame by breaking after detection
      break;
    }
  }
  
  // Success condition: All gems collected. Calculate bonus score for time efficiency.
  if (score === totalGems) {
    bonusScore = Math.floor(gameTimer * 10);
    gameState = "levelComplete";
  }
}

function endGame() {
  // Display end game messages
  textAlign(CENTER, CENTER);
  textSize(32);
  if (gameState === "gameOver") {
    fill(255, 50, 50);
    text("Game Over!", width / 2, height / 2 - 40);
  } else if (gameState === "levelComplete") {
    fill(50, 255, 50);
    text("Level Complete!", width / 2, height / 2 - 40);
    textSize(20);
    text("Bonus Time: " + nf(gameTimer, 1, 2) + " seconds remaining", width / 2, height / 2);
    text("Bonus Score: " + bonusScore, width / 2, height / 2 + 25);
  }
  textSize(18);
  fill(255);
  text("Press 'R' to Restart", width / 2, height / 2 + 60);
  noLoop();
}

function keyPressed() {
  if (gameState === "intro" && (key === 's' || key === 'S')) {
    gameState = "playing";
    loop();
  }
  if (gameState === "playing") {
    // Handle jump keys: Up arrow, space, or W
    if (keyCode === UP_ARROW || key === ' ' || key === 'w' || key === 'W') {
      player.jump();
    }
  }
  // Restart the game when "R" is pressed on game over or level complete
  if (gameState === "gameOver" || gameState === "levelComplete") {
    if (key === 'r' || key === 'R') {
      resetGame();
    }
  }
}

// Added keyReleased to allow variable jump height: releasing the jump key will cut the jump short.
function keyReleased() {
  if (gameState === "playing") {
    if (keyCode === UP_ARROW || key === ' ' || key === 'w' || key === 'W') {
      if (player.vel.y < -3) { 
        player.vel.y = -3;
      }
    }
  }
}

function resetGame() {
  initGame();
  gameState = "playing";
  loop();
}

// Particle Class for ambient environmental effects
class Particle {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = random(2, 5);
    this.alpha = random(100, 200);
  }
  
  update() {
    this.y += this.speed;
    // Reset particle to top if it goes off screen
    if (this.y > height) {
      this.y = -this.size;
      this.x = random(width);
    }
  }
  
  show() {
    noStroke();
    fill(255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
}

// Raindrop Class for rain effect
class Raindrop {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
  }
  
  update() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = random(-50, 0);
      this.x = random(width);
    }
  }
  
  show() {
    stroke(180, 180, 255, 150);
    line(this.x, this.y, this.x, this.y + 5);
  }
}

// Player Class
class Player {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.w = 30;
    this.h = 50;
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.speed = 0.5; // acceleration for smoother movement
    this.maxSpeed = 3;
    this.jumpStrength = -8;
    this.onGround = false;
    this.health = 3;
    this.friction = 0.85; // friction coefficient for smooth deceleration
    // Invulnerability properties
    this.invulnerable = false;
    this.invulnerabilityDuration = 1000; // in milliseconds
    this.invulnerableTimer = 0;
    // Coyote time properties for jump forgiveness
    this.coyoteTime = 200; // milliseconds of allowable jump after leaving ground
    this.coyoteTimer = 0;
    // Double jump availability property
    this.canDoubleJump = false;
  }
  
  update() {
    // Manage invulnerability timer, decreasing based on deltaTime
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }
    
    // Reset horizontal acceleration
    this.acc.x = 0;
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // LEFT_ARROW or 'A'
      this.acc.x = -this.speed;
    } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // RIGHT_ARROW or 'D'
      this.acc.x = this.speed;
    }
    
    // Apply acceleration and update velocity with deltaTime influence
    this.vel.x += this.acc.x;
    // Apply friction if no horizontal input is provided
    if (this.acc.x === 0) {
      let frictionFactor = pow(this.friction, deltaTime / 16);
      this.vel.x *= frictionFactor;
    }
    // Limit horizontal velocity
    this.vel.x = constrain(this.vel.x, -this.maxSpeed, this.maxSpeed);
    
    this.pos.x += this.vel.x;
    this.pos.x = constrain(this.pos.x, 0, width - this.w);
  }
  
  applyGravity() {
    // Gravity effect; constant acceleration downwards
    this.vel.y += 0.4;
    // Terminal velocity to prevent excessive falling speed
    this.vel.y = constrain(this.vel.y, -Infinity, 12);
    this.pos.y += this.vel.y;
    if (this.pos.y + this.h > height) {
      this.pos.y = height - this.h;
      this.vel.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }
  
  jump() {
    // Allow jump if on ground or within coyote time window
    if (this.onGround || this.coyoteTimer > 0) {
      this.vel.y = this.jumpStrength;
      this.onGround = false;
      this.coyoteTimer = 0; // consume coyote time once the jump is executed
      this.canDoubleJump = true; // allow double jump after leaving ground initially
    }
    // Allow a double jump if not on ground and if available
    else if (this.canDoubleJump) {
      this.vel.y = this.jumpStrength;
      this.canDoubleJump = false;
    }
  }
  
  checkPlatforms(platforms) {
    // Check for collision with platforms from above
    for (let p of platforms) {
      if (this.pos.x + this.w > p.x && this.pos.x < p.x + p.w) {
        if (this.pos.y + this.h <= p.y + 10 &&
            this.pos.y + this.h + this.vel.y >= p.y) {
          this.pos.y = p.y - this.h;
          this.vel.y = 0;
          this.onGround = true;
          // Reset double jump availability when landing
          this.canDoubleJump = true;
        }
      }
    }
    // Update coyote timer: reset if on ground, else decrement by deltaTime
    if (this.onGround) {
      this.coyoteTimer = this.coyoteTime;
    } else {
      this.coyoteTimer = max(this.coyoteTimer - deltaTime, 0);
    }
  }
  
  collects(gem) {
    let closestX = constrain(gem.x, this.pos.x, this.pos.x + this.w);
    let closestY = constrain(gem.y, this.pos.y, this.pos.y + this.h);
    let d = dist(gem.x, gem.y, closestX, closestY);
    return d < gem.r;
  }
  
  hits(enemy) {
    return (
      this.pos.x < enemy.pos.x + enemy.w &&
      this.pos.x + this.w > enemy.pos.x &&
      this.pos.y < enemy.pos.y + enemy.h &&
      this.pos.y + this.h > enemy.pos.y
    );
  }
  
  // New method to check collision with spikes
  hitsSpike(spike) {
    return (
      this.pos.x < spike.x + spike.w &&
      this.pos.x + this.w > spike.x &&
      this.pos.y < spike.y + spike.h &&
      this.pos.y + this.h > spike.y
    );
  }
  
  // New method to apply damage with invulnerability check
  takeDamage(amount, pushback) {
    if (!this.invulnerable) {
      this.health -= amount;
      this.invulnerable = true;
      this.invulnerableTimer = this.invulnerabilityDuration;
      // Apply horizontal pushback and a slight upward knock-back
      this.pos.x = max(this.pos.x - pushback, 0);
      this.vel.y = -2;
    }
  }
  
  show() {
    push();
    // Blinking effect if invulnerable
    if (this.invulnerable && frameCount % 10 < 5) {
      fill(200, 200, 255, 150);
    } else {
      fill(50, 150, 255);
    }
    rect(this.pos.x, this.pos.y, this.w, this.h, 5);
    pop();
  }
}

// Enemy Class (non-controllable agent)
class Enemy {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.w = 30;
    this.h = 50;
    this.speed = 2;
    this.leftBound = x - 100;
    this.rightBound = x + 100;
    this.direction = 1;
    this.verticalOffset = 0;
    this.verticalDirection = 1;
    this.timer = 0; // timer for occasional dash
  }
  
  update() {
    // Horizontal patrol movement with occasional dash
    this.timer += deltaTime;
    if (this.timer > 2000) { // every 2 seconds dash for brief moment
      this.pos.x += this.speed * this.direction * 3;
      this.timer = 0;
    } else {
      this.pos.x += this.speed * this.direction;
    }
    if (this.pos.x <= this.leftBound || this.pos.x >= this.rightBound) {
      this.direction *= -1;
    }
    // Add a subtle vertical oscillation for dynamic effect
    this.verticalOffset += this.verticalDirection * 0.2;
    if (abs(this.verticalOffset) > 5) {
      this.verticalDirection *= -1;
    }
    this.pos.y = (height - 100) + this.verticalOffset;
  }
  
  show() {
    fill(255, 50, 50);
    rect(this.pos.x, this.pos.y, this.w, this.h, 5);
  }
}

// Platform Class
class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  show() {
    fill(100);
    rect(this.x, this.y, this.w, this.h);
  }
}

// Gem Class (collectable item)
class Gem {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 10;
  }
  
  show() {
    fill(255, 215, 0);
    ellipse(this.x, this.y, this.r * 2);
  }
}

// Spike Class (hazard)
class Spike {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  show() {
    fill(200, 0, 200);
    // Simple triangle to represent a spike
    triangle(this.x, this.y + this.h, this.x + this.w / 2, this.y, this.x + this.w, this.y + this.h);
  }
}