// game.js

// Game states: "playing", "won", "lost"
let gameState = "playing";

// Agent properties
let agent;
const agentRadius = 20;
const normalSpeed = 2;
const dashSpeed = 8;
let dashTimer = 0;
const dashDuration = 10; // frames the dash lasts

// Key codes for WASD
const KEY_W = 87;
const KEY_A = 65;
const KEY_S = 83;
const KEY_D = 68;

// Goal area (green rectangle)
const goal = {
  x: 350,
  y: 350,
  w: 40,
  h: 40,
};

// Trap area (red rectangle)
// The player must avoid colliding with this area.
const trap = {
  x: 200,
  y: 150,
  w: 100,
  h: 100,
};

function setup() {
  createCanvas(400, 400);
  // Agent starts at a fixed point.
  agent = createVector(50, 200);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(240);

  // Draw goal area
  noStroke();
  fill(100, 255, 100);
  rect(goal.x, goal.y, goal.w, goal.h);

  // Draw trap area if game is still playing (or even after game over)
  fill(255, 100, 100);
  rect(trap.x, trap.y, trap.w, trap.h);

  if (gameState === "playing") {
    handleMovement();
    checkCollisions();
  }

  // Draw agent
  fill(100, 100, 255);
  ellipse(agent.x, agent.y, agentRadius * 2);

  // Display messages on winning or losing.
  if (gameState === "won") {
    fill(0);
    textSize(32);
    text("You Win!", width / 2, height / 2);
  } else if (gameState === "lost") {
    fill(0);
    textSize(32);
    text("Game Over", width / 2, height / 2);
  }
}

// Handles movement based on arrow keys and WASD.
// Space bar triggers a dash, temporarily increasing movement speed.
function handleMovement() {
  let moveX = 0;
  let moveY = 0;

  // Aggregate input from arrow keys
  if (keyIsDown(LEFT_ARROW)) {
    moveX -= 1;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    moveX += 1;
  }
  if (keyIsDown(UP_ARROW)) {
    moveY -= 1;
  }
  if (keyIsDown(DOWN_ARROW)) {
    moveY += 1;
  }

  // Aggregate input from WASD keys
  if (keyIsDown(KEY_A)) {
    moveX -= 1;
  }
  if (keyIsDown(KEY_D)) {
    moveX += 1;
  }
  if (keyIsDown(KEY_W)) {
    moveY -= 1;
  }
  if (keyIsDown(KEY_S)) {
    moveY += 1;
  }

  // Normalize movement so diagonal isn’t faster.
  let inputMagnitude = sqrt(moveX * moveX + moveY * moveY);
  if (inputMagnitude !== 0) {
    moveX /= inputMagnitude;
    moveY /= inputMagnitude;
  }

  // Determine current speed – dash if active.
  let currentSpeed = dashTimer > 0 ? dashSpeed : normalSpeed;
  // Apply the movement vector.
  agent.x += moveX * currentSpeed;
  agent.y += moveY * currentSpeed;

  // Decrease dash timer if active.
  if (dashTimer > 0) {
    dashTimer--;
  }

  // Keep agent within canvas boundaries.
  agent.x = constrain(agent.x, agentRadius, width - agentRadius);
  agent.y = constrain(agent.y, agentRadius, height - agentRadius);
}

// When space bar is pressed, initiate a dash if directional input is active.
function keyPressed() {
  if (gameState !== "playing") {
    // Allow restart if game is over.
    if (key === "r" || key === "R") {
      restartGame();
    }
    return;
  }
  // Check for space bar (either " " or keyCode 32)
  if (key === " " || keyCode === 32) {
    // Only dash if any movement key is pressed.
    if (
      keyIsDown(LEFT_ARROW) ||
      keyIsDown(RIGHT_ARROW) ||
      keyIsDown(UP_ARROW) ||
      keyIsDown(DOWN_ARROW) ||
      keyIsDown(KEY_W) ||
      keyIsDown(KEY_A) ||
      keyIsDown(KEY_S) ||
      keyIsDown(KEY_D)
    ) {
      dashTimer = dashDuration;
    }
  }
}

// Checks success and failure conditions.
function checkCollisions() {
  // Check if agent is inside the trap area.
  if (circleRectCollision(agent.x, agent.y, agentRadius, trap.x, trap.y, trap.w, trap.h)) {
    gameState = "lost";
  }
  
  // Check if the agent reaches the goal.
  if (agent.x > goal.x && agent.x < goal.x + goal.w &&
      agent.y > goal.y && agent.y < goal.y + goal.h) {
    gameState = "won";
  }
}

// Utility function for detecting collision between a circle and a rectangle.
function circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
  // Find the closest point to the circle within the rectangle
  let closestX = constrain(cx, rx, rx + rw);
  let closestY = constrain(cy, ry, ry + rh);
  
  // Calculate distance between circle's center and this closest point
  let distanceX = cx - closestX;
  let distanceY = cy - closestY;
  
  // If the distance is less than the circle's radius, there's an intersection.
  let distanceSquared = distanceX * distanceX + distanceY * distanceY;
  return distanceSquared < radius * radius;
}

// Restart the game by resetting variables.
function restartGame() {
  gameState = "playing";
  agent = createVector(50, 200);
  dashTimer = 0;
}