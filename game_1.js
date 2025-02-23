// game.js

// Global variables
let player;
let enemy;
let gameState; // "playing", "gameover", "win"
let startTime;
let dashActive = false; // flag for dash activation

// Constants
const PLAYER_RADIUS = 20;
const ENEMY_RADIUS = 20;
const PLAYER_SPEED = 3;
const DASH_FACTOR = 3;  // multiplier for dash
const WIN_TIME = 30000; // win after 30 seconds in milliseconds

function setup() {
  createCanvas(600, 400);
  resetGame();
}

function resetGame() {
  // Set initial positions: center for player, random for enemy
  player = createVector(width / 2, height / 2);
  enemy = {
    pos: createVector(random(ENEMY_RADIUS, width - ENEMY_RADIUS), random(ENEMY_RADIUS, height - ENEMY_RADIUS)),
    vel: createVector(random(-2, 2), random(-2, 2))
  };
  gameState = "playing";
  startTime = millis();
}

function draw() {
  background(51);
  
  // Game states
  if(gameState === "playing"){
    // Update player position based on input
    let move = createVector(0, 0);

    // Arrow keys
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
    // WASD keys
    if (keyIsDown(65)) { // A key
      move.x -= 1;
    }
    if (keyIsDown(68)) { // D key
      move.x += 1;
    }
    if (keyIsDown(87)) { // W key
      move.y -= 1;
    }
    if (keyIsDown(83)) { // S key
      move.y += 1;
    }
    
    if (move.mag() > 0) {
      move.normalize();
      // If dash is activated (by spacebar) then enhance the movement for this frame.
      let speed = dashActive ? PLAYER_SPEED * DASH_FACTOR : PLAYER_SPEED;
      dashActive = false; // turn off dash after using it
      move.mult(speed);
      player.add(move);
      // Constrain within the canvas
      player.x = constrain(player.x, PLAYER_RADIUS, width - PLAYER_RADIUS);
      player.y = constrain(player.y, PLAYER_RADIUS, height - PLAYER_RADIUS);
    }
    
    // Update enemy position, bouncing off walls
    enemy.pos.add(enemy.vel);
    if (enemy.pos.x < ENEMY_RADIUS || enemy.pos.x > width - ENEMY_RADIUS) {
      enemy.vel.x *= -1;
      enemy.pos.x = constrain(enemy.pos.x, ENEMY_RADIUS, width - ENEMY_RADIUS);
    }
    if (enemy.pos.y < ENEMY_RADIUS || enemy.pos.y > height - ENEMY_RADIUS) {
      enemy.vel.y *= -1;
      enemy.pos.y = constrain(enemy.pos.y, ENEMY_RADIUS, height - ENEMY_RADIUS);
    }
    
    // Check collision between player and enemy (simple circle collision)
    let d = dist(player.x, player.y, enemy.pos.x, enemy.pos.y);
    if (d < PLAYER_RADIUS + ENEMY_RADIUS) {
      gameState = "gameover";
    }
    
    // Check win condition: survive for WIN_TIME milliseconds
    let elapsed = millis() - startTime;
    if (elapsed >= WIN_TIME) {
      gameState = "win";
    }
    
    // Display elapsed time
    fill(255);
    textSize(16);
    text("Time: " + floor(elapsed / 1000) + " s", 10, 20);
  }
  
  // Draw player and enemy
  noStroke();
  fill(0, 255, 0);
  ellipse(player.x, player.y, PLAYER_RADIUS * 2);
  
  fill(255, 0, 0);
  ellipse(enemy.pos.x, enemy.pos.y, ENEMY_RADIUS * 2);
  
  // If game over or win, display overlay text
  if (gameState === "gameover") {
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(32);
    text("Game Over", width / 2, height / 2 - 20);
    textSize(16);
    text("Press Space to Restart", width / 2, height / 2 + 20);
  } else if (gameState === "win") {
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(32);
    text("You Win!", width / 2, height / 2 - 20);
    textSize(16);
    text("Press Space to Restart", width / 2, height / 2 + 20);
  }
}

function keyPressed() {
  if (key === ' ') {
    // If game is in playing state, space is used to dash; if game over or win, restart the game.
    if (gameState === "playing") {
      dashActive = true;
    } else if (gameState === "gameover" || gameState === "win") {
      resetGame();
    }
  }
}