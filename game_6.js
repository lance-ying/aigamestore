// game.js

// Global variables and game settings
let canvasWidth = 800;
let canvasHeight = 600;

let gameState = "playing"; // "playing", "won", or "lost"

// Timer in seconds
let totalTime = 60; 
let remainingTime = totalTime;

let lastTime; // to track deltaTime manually

// Introduction overlay variables
let introTimer = 5000; // in milliseconds
let showIntro = true;

// Token settings & array (the primary objective is to collect all tokens)
let tokens = [];
const totalTokens = 5;
const tokenRadius = 10;

// Hazard settings & array (moving obstacles that reduce health if hit)
let hazards = [];
const totalHazards = 3;
const hazardRadius = 25;

// Player object with properties and movement parameters
let player = {
  x: canvasWidth / 2,
  y: canvasHeight / 2,
  radius: 20,
  baseSpeed: 3,
  speed: 3,
  health: 100,
  score: 0,
  isDashing: false,
  dashDuration: 300, // milliseconds
  dashCooldown: 1000, // milliseconds
  dashTimer: 0,
  cooldownTimer: 0,
  color: "#4CAF50"
};

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  // Initialize timer
  remainingTime = totalTime;
  lastTime = millis();

  // Create tokens at random positions
  for (let i = 0; i < totalTokens; i++) {
    tokens.push({
      x: random(tokenRadius, canvasWidth - tokenRadius),
      y: random(tokenRadius, canvasHeight - tokenRadius),
      collected: false
    });
  }

  // Create hazards with random positions and directions
  for (let i = 0; i < totalHazards; i++) {
    let angle = random(TWO_PI);
    let speed = random(1, 3);
    hazards.push({
      x: random(hazardRadius, canvasWidth - hazardRadius),
      y: random(hazardRadius, canvasHeight - hazardRadius),
      radius: hazardRadius,
      dx: cos(angle) * speed,
      dy: sin(angle) * speed,
      color: "#E91E63"
    });
  }
}

function draw() {
  let currentTime = millis();
  let delta = currentTime - lastTime;
  lastTime = currentTime;
  
  // If showing intro, display narrative overlay
  if (showIntro) {
    let alphaVal = map(introTimer, 0, 5000, 0, 255);
    fill(255, 255, 255, alphaVal);
    textAlign(CENTER, TOP);
    textSize(20);
    text("In the twilight of an age long past, the Kingdom of Elysara lay cradled between towering ancient forests and shimmering crystal lakes. Rumors spoke of a power buried deep under the earth, guarded by forgotten spirits...", canvasWidth / 2, 10);
    introTimer -= delta;
    if (introTimer <= 0) {
      showIntro = false;
    }
  }
  
  // Dynamic background color based on remaining time
  let startColor = color('#1a237e');
  let endColor = color('#000000');
  let bgColor = lerpColor(startColor, endColor, (totalTime - remainingTime) / totalTime);
  background(bgColor);
  
  if (gameState === "playing") {
    // Update the countdown timer (in seconds)
    remainingTime -= delta / 1000;
    
    // Check game failure if time expires
    if (remainingTime <= 0) {
      gameState = "lost";
      remainingTime = 0;
    }
    
    // Handle player movement input from arrow keys and WASD for smooth motion
    updatePlayer(delta);
    
    // Update hazards
    updateHazards(delta);
    
    // Check collisions between player and tokens/hazards
    checkCollisions();

    // Check win condition: all tokens collected
    if (player.score === totalTokens) {
      gameState = "won";
    }
    // Check health failure condition
    if (player.health <= 0) {
      gameState = "lost";
    }
  }
  
  // Draw tokens with glowing effect
  drawTokens();
  
  // Draw hazards
  drawHazards();
  
  // Draw the player
  drawPlayer();
  
  // Draw the HUD (health, score, timer, instructions)
  drawHUD();

  // Add a subtle fog overlay for atmospheric effect
  push();
  noStroke();
  fill(200, 200, 200, 20);
  rect(0, 0, canvasWidth, canvasHeight);
  pop();
  
  // If game over or won, display appropriate message.
  if (gameState === "won") {
    fill(0, 255, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("Level Complete – Bonus Achieved!", canvasWidth / 2, canvasHeight / 2);
    noLoop();
  } else if (gameState === "lost") {
    fill(255, 0, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    if (player.health <= 0) {
      text("Out of Health – Try Again!", canvasWidth / 2, canvasHeight / 2);
    } else {
      text("Out of Time – Try Again!", canvasWidth / 2, canvasHeight / 2);
    }
    noLoop();
  }
}

// -----------------------------------------------------------------------------------------------------------------
// Update functions

function updatePlayer(delta) {
  // Movement keys: Arrow keys and/or WASD
  let xDir = 0;
  let yDir = 0;
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // LEFT or A
    xDir -= 1;
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // RIGHT or D
    xDir += 1;
  }
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // UP or W
    yDir -= 1;
  }
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // DOWN or S
    yDir += 1;
  }
  
  // Normalize diagonal movement so speed isn't faster when moving diagonally.
  if (xDir !== 0 || yDir !== 0) {
    let mag = sqrt(xDir * xDir + yDir * yDir);
    xDir /= mag;
    yDir /= mag;
  }
  
  // Handle dash cooldown and dash duration timers
  if (player.cooldownTimer > 0) {
    player.cooldownTimer -= delta;
    if (player.cooldownTimer < 0) {
      player.cooldownTimer = 0;
    }
  }
  if (player.isDashing) {
    player.dashTimer -= delta;
    if (player.dashTimer <= 0) {
      // End dash: reset speed back to normal and start cooldown
      player.isDashing = false;
      player.speed = player.baseSpeed;
      player.cooldownTimer = player.dashCooldown;
    }
  }
  
  // Update player position based on current speed
  player.x += xDir * player.speed;
  player.y += yDir * player.speed;
  
  // Constrain player to canvas boundaries
  player.x = constrain(player.x, player.radius, canvasWidth - player.radius);
  player.y = constrain(player.y, player.radius, canvasHeight - player.radius);
}

function updateHazards(delta) {
  // Move hazards and bounce off walls
  hazards.forEach(h => {
    h.x += h.dx;
    h.y += h.dy;
    
    // Bounce horizontally
    if (h.x <= h.radius || h.x >= canvasWidth - h.radius) {
      h.dx *= -1;
      h.x = constrain(h.x, h.radius, canvasWidth - h.radius);
    }
    // Bounce vertically
    if (h.y <= h.radius || h.y >= canvasHeight - h.radius) {
      h.dy *= -1;
      h.y = constrain(h.y, h.radius, canvasHeight - h.radius);
    }
  });
}

function checkCollisions() {
  // Check collision with tokens
  tokens.forEach(token => {
    if (!token.collected) {
      let d = dist(player.x, player.y, token.x, token.y);
      if (d < player.radius + tokenRadius) {
        token.collected = true;
        player.score++;
        // You could add bonus effects or a sound effect here.
      }
    }
  });
  
  // Check collision with hazards - if collided, subtract health and add a penalty
  hazards.forEach(h => {
    let d = dist(player.x, player.y, h.x, h.y);
    if (d < player.radius + h.radius) {
      // Reduce health, but also ensure damage is applied only once per collision moment.
      player.health -= 0.5;
    }
  });
}

// -----------------------------------------------------------------------------------------------------------------
// Draw functions

function drawPlayer() {
  fill(player.color);
  noStroke();
  ellipse(player.x, player.y, player.radius * 2);
  
  // If in dash mode, overlay a visual indicator
  if (player.isDashing) {
    stroke(255, 255, 0);
    strokeWeight(3);
    noFill();
    ellipse(player.x, player.y, player.radius * 2 + 10);
  }
}

function drawTokens() {
  tokens.forEach(token => {
    if (!token.collected) {
      push();
      // Draw an outer glow effect for the mystical token
      noStroke();
      fill(255, 215, 0, 100);
      ellipse(token.x, token.y, tokenRadius * 2 + 10);
      // Draw the actual token
      fill(255, 215, 0);
      ellipse(token.x, token.y, tokenRadius * 2);
      pop();
    }
  });
}

function drawHazards() {
  hazards.forEach(h => {
    fill(h.color);
    noStroke();
    ellipse(h.x, h.y, h.radius * 2);
  });
}

function drawHUD() {
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  // Health
  text("Health: " + nf(player.health, 1, 0), 10, 10);
  // Score (tokens collected)
  text("Tokens: " + player.score + " / " + totalTokens, 10, 30);
  // Timer
  text("Time: " + nf(remainingTime, 1, 1) + "s", 10, 50);
  
  // Updated instructions with quest narrative tone
  text("Embark on your quest: Use Arrow Keys / WASD to move, Space Bar to dash", 10, canvasHeight - 30);
}

// -----------------------------------------------------------------------------------------------------------------
// Handle key pressed events

function keyPressed() {
  // Use the space bar to trigger a dash if cooldown is finished
  if (key === " " && !player.isDashing && player.cooldownTimer === 0 && gameState === "playing") {
    player.isDashing = true;
    player.speed = player.baseSpeed * 3; // Increase speed for dash
    player.dashTimer = player.dashDuration;
  }
}