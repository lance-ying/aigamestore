// game.js

// Global Variables
let player;
let enemy;
let projectiles = [];
let playerDir; // Last movement direction for shooting
let gameState = "start"; // "start", "playing", "gameOver", "gameWin"

// Environment narrative and instructions
const introText = "In a mystical arena ruled by ancient magic, you are the chosen guardian of a long-lost artifact.\n" +
  "A rogue enemy roams the realm, threatening the balance of power.\n\n" +
  "Objective: Dodge the enemy and defeat it by shooting projectiles.\n" +
  "Use Arrow Keys or WASD to move. Hold SHIFT to dash.\n" +
  "Press SPACE to shoot. Press any key to begin.";
  
function setup() {
  createCanvas(600, 400);
  initializeGame();
}

// Initialize/restart game variables
function initializeGame() {
  // Initialize player properties
  player = {
    pos: createVector(width / 2, height - 50),
    size: 30,
    speed: 4  // Normal speed; dashing multiplies this value
  };
  // Default shooting direction: upward.
  playerDir = createVector(0, -1);

  // Initialize enemy properties
  enemy = {
    pos: createVector(random(50, width - 50), random(50, height / 2)),
    size: 30,
    speed: 2,
    dir: p5.Vector.random2D()
  };
  
  // Clear projectiles array
  projectiles = [];
  gameState = "start";
}

function draw() {
  // Draw a mystical background with a gradient effect
  drawBackground();
  
  if (gameState === "start") {
    drawIntro();
  } else if (gameState === "playing") {
    updateGame();
  }
  
  // Always draw player, enemy, and projectiles for visual consistency
  drawPlayer();
  drawEnemy();
  drawProjectiles();
  
  // Draw game messages based on the state
  if (gameState === "gameOver") {
    drawMessage("Game Over!\nClick to restart.");
  }
  if (gameState === "gameWin") {
    drawMessage("You Win!\nClick to restart.");
  }
}

function drawBackground() {
  // Create a dark gradient background to evoke a mystical atmosphere
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0.2, 0.6);
    let c = lerpColor(color(10, 10, 30), color(40, 0, 60), inter);
    stroke(c);
    line(0, y, width, y);
  }
}

function drawIntro() {
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  let lines = introText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], width / 2, height / 2 - 60 + i * 20);
  }
}

function updateGame() {
  updatePlayer();
  updateEnemy();
  updateProjectiles();
  checkCollisions();
}

// Update player's position based on arrow keys or WASD, including dash with SHIFT.
function updatePlayer() {
  let direction = createVector(0, 0);
  
  // Check arrow keys or WASD for movement
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // 65 = 'a'
    direction.x -= 1;
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // 68 = 'd'
    direction.x += 1;
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // 87 = 'w'
    direction.y -= 1;
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // 83 = 's'
    direction.y += 1;
  }
  
  // Calculate current speed. Holding SHIFT causes a dash effect.
  let currentSpeed = player.speed;
  if (keyIsDown(SHIFT)) {
    currentSpeed *= 2;
  }
  
  // If there is movement, update the player's position and record the direction.
  if (direction.mag() > 0) {
    direction.normalize();
    playerDir = direction.copy();
    player.pos.add(p5.Vector.mult(direction, currentSpeed));
  }
  
  // Constrain the player within the canvas
  player.pos.x = constrain(player.pos.x, player.size / 2, width - player.size / 2);
  player.pos.y = constrain(player.pos.y, player.size / 2, height - player.size / 2);
}

// Update the enemy's position.
function updateEnemy() {
  // Occasionally change enemy's random direction every second
  if (frameCount % 60 === 0) { 
    let angleChange = random(-PI / 4, PI / 4);
    enemy.dir.rotate(angleChange);
    enemy.dir.normalize();
  }
  
  enemy.pos.add(p5.Vector.mult(enemy.dir, enemy.speed));
  
  // Bounce off the walls
  if (enemy.pos.x < enemy.size / 2 || enemy.pos.x > width - enemy.size / 2) {
    enemy.dir.x *= -1;
  }
  if (enemy.pos.y < enemy.size / 2 || enemy.pos.y > height - enemy.size / 2) {
    enemy.dir.y *= -1;
  }
  
  // Constrain inside the canvas
  enemy.pos.x = constrain(enemy.pos.x, enemy.size / 2, width - enemy.size / 2);
  enemy.pos.y = constrain(enemy.pos.y, enemy.size / 2, height - enemy.size / 2);
}

// Update projectiles: move them and remove if off-screen.
function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];
    proj.pos.add(proj.vel);
    // Remove projectile if it goes off-screen.
    if (proj.pos.x < 0 || proj.pos.x > width || proj.pos.y < 0 || proj.pos.y > height) {
      projectiles.splice(i, 1);
    }
  }
}

// Check collisions: player-enemy and projectile-enemy.
function checkCollisions() {
  // Collision between player and enemy results in game over.
  if (dist(player.pos.x, player.pos.y, enemy.pos.x, enemy.pos.y) < (player.size + enemy.size) / 2) {
    gameState = "gameOver";
  }
  
  // Collision between any projectile and the enemy results in a win.
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];
    if (dist(proj.pos.x, proj.pos.y, enemy.pos.x, enemy.pos.y) < (proj.size + enemy.size) / 2) {
      gameState = "gameWin";
      projectiles.splice(i, 1);
      break;
    }
  }
}

// Draw the player as a blue circle.
function drawPlayer() {
  fill(0, 0, 255);
  noStroke();
  ellipse(player.pos.x, player.pos.y, player.size);
}

// Draw the enemy as a red circle.
function drawEnemy() {
  fill(255, 0, 0);
  noStroke();
  ellipse(enemy.pos.x, enemy.pos.y, enemy.size);
}

// Draw all projectiles as yellow circles.
function drawProjectiles() {
  fill(255, 255, 0);
  noStroke();
  for (let proj of projectiles) {
    ellipse(proj.pos.x, proj.pos.y, proj.size);
  }
}

// Display centered end-game messages.
function drawMessage(msg) {
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(msg, width / 2, height / 2);
}

// Handle key presses: start game or shoot projectile.
function keyPressed() {
  if (gameState === "start") {
    gameState = "playing";
  } else if (gameState === "playing" && key === " ") {
    // Set projectile properties
    let projSpeed = 6;
    let velocity = playerDir.copy();
    if (velocity.mag() === 0) {
      velocity = createVector(0, -1);
    }
    velocity.normalize().mult(projSpeed);
    
    // Create projectile at player's position
    let projectile = {
      pos: createVector(player.pos.x, player.pos.y),
      vel: velocity,
      size: 10
    };
    projectiles.push(projectile);
  }
}

// Restart the game when the mouse is pressed during gameOver or gameWin.
function mousePressed() {
  if (gameState === "gameOver" || gameState === "gameWin") {
    initializeGame();
  }
}