import { CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, LANE_POSITIONS } from './globals.js';

// Draw the background
export function drawBackground(p, speed) {
  p.background(50, 50, 80);
  
  // Draw the train tracks
  const trackWidth = LANE_WIDTH * 0.2;
  for (let i = 0; i < 3; i++) {
    // Draw track
    p.fill(100);
    p.rect(LANE_POSITIONS[i] - trackWidth / 2, 0, trackWidth, CANVAS_HEIGHT);
    
    // Draw track lines
    p.stroke(150);
    p.strokeWeight(2);
    for (let y = (p.frameCount * speed) % 30 - 30; y < CANVAS_HEIGHT; y += 30) {
      p.line(LANE_POSITIONS[i] - trackWidth / 2, y, LANE_POSITIONS[i] + trackWidth / 2, y);
    }
  }
  
  // Draw lane dividers
  p.stroke(200, 200, 0);
  p.strokeWeight(3);
  p.line(LANE_WIDTH, 0, LANE_WIDTH, CANVAS_HEIGHT);
  p.line(LANE_WIDTH * 2, 0, LANE_WIDTH * 2, CANVAS_HEIGHT);
  p.noStroke();
}

// Draw the player
export function drawPlayer(p, player) {
  p.push();
  if (player.isSliding) {
    // Draw sliding player (lower height)
    p.fill(0, 150, 255);
    p.rect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    
    // Draw slide animation
    p.fill(100, 200, 255, 150);
    p.rect(player.x - player.width / 2 - 5, player.y - player.height / 2, player.width + 10, player.height);
  } else {
    // Draw normal player
    p.fill(0, 150, 255);
    p.rect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    
    // Draw player details
    p.fill(0, 100, 200);
    p.rect(player.x - player.width / 3, player.y - player.height / 4, player.width * 2/3, player.height / 2);
  }
  
  // Draw jump animation if jumping
  if (player.isJumping) {
    p.fill(100, 200, 255, 150);
    p.ellipse(player.x, player.y + player.height / 2, player.width + 10, 20);
  }
  p.pop();
}

// Draw obstacles
export function drawObstacles(p, obstacles) {
  p.push();
  for (const obstacle of obstacles) {
    const drawY = obstacle.getActualY();
    
    if (obstacle.type === 'train') {
      // Draw train
      p.fill(220, 50, 50);
      p.rect(obstacle.x - obstacle.width / 2, drawY - obstacle.height / 2, obstacle.width, obstacle.height);
      
      // Draw train details
      p.fill(150, 30, 30);
      p.rect(obstacle.x - obstacle.width / 2, drawY - obstacle.height / 2, obstacle.width, obstacle.height / 4);
      p.fill(250, 250, 150);
      p.rect(obstacle.x - obstacle.width / 3, drawY - obstacle.height / 6, obstacle.width / 4, obstacle.height / 3);
    } else if (obstacle.type === 'barrier') {
      // Draw barrier
      p.fill(200, 150, 50);
      p.rect(obstacle.x - obstacle.width / 2, drawY - obstacle.height / 2, obstacle.width, obstacle.height);
      
      // Draw barrier details
      p.stroke(150, 100, 50);
      p.strokeWeight(2);
      p.line(obstacle.x - obstacle.width / 2, drawY, obstacle.x + obstacle.width / 2, drawY);
      p.noStroke();
      
      // Draw UP arrow indicator for jump obstacles
      if (drawY > 50 && drawY < CANVAS_HEIGHT - 50) {
        p.fill(0, 255, 0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.text("↑", obstacle.x, drawY - obstacle.height);
      }
    } else if (obstacle.type === 'tunnel') {
      // Draw tunnel
      p.fill(100, 100, 100);
      p.rect(obstacle.x - obstacle.width / 2, drawY - obstacle.height / 2, obstacle.width, obstacle.height);
      
      // Draw tunnel details
      p.fill(70, 70, 70);
      p.rect(obstacle.x - obstacle.width / 2 + 5, drawY - obstacle.height / 2, obstacle.width - 10, obstacle.height);
      
      // Draw DOWN arrow indicator for slide obstacles
      if (drawY > 50 && drawY < CANVAS_HEIGHT - 50) {
        p.fill(255, 255, 0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.text("↓", obstacle.x, drawY + obstacle.height);
      }
    }
  }
  p.pop();
}

// Draw coins
export function drawCoins(p, coins, frameCount) {
  p.push();
  for (const coin of coins) {
    if (!coin.collected) {
      // Draw coin with pulsing animation
      const pulse = 1 + 0.1 * Math.sin(frameCount * 0.1);
      p.fill(255, 215, 0);
      p.ellipse(coin.x, coin.y, coin.radius * 2 * pulse);
      
      // Draw coin details
      p.fill(200, 170, 0);
      p.ellipse(coin.x, coin.y, coin.radius * pulse);
    }
  }
  p.pop();
}

// Draw UI elements
export function drawUI(p, gameState) {
  p.push();
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 20, 20);
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, 20, 50);
  
  // Draw speed indicator
  p.text(`Speed: ${gameState.speed.toFixed(1)}`, CANVAS_WIDTH - 150, 20);
  
  // Draw pause indicator if needed
  if (gameState.gamePhase === "PAUSED") {
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 20, 20);
  }
  p.pop();
}

// Draw start screen
export function drawStartScreen(p) {
  p.push();
  p.background(50, 50, 80);
  
  // Draw title
  p.fill(0, 150, 255);
  p.textSize(40);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("SUBWAY DASH", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  
  // Draw instructions
  p.fill(255);
  p.textSize(20);
  p.text("Dodge obstacles, collect coins, and run as far as you can!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Draw controls
  p.textSize(16);
  p.text("LEFT/RIGHT: Change lanes", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text("UP: Jump over barriers", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
  p.text("DOWN: Slide under tunnels", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  
  // Draw start prompt
  p.fill(255, 215, 0);
  p.textSize(24);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  p.pop();
}

// Draw game over screen
export function drawGameOverScreen(p, gameState) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    // Draw win message
    p.fill(0, 255, 0);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  } else {
    // Draw lose message
    p.fill(255, 50, 50);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  }
  
  // Draw final score
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Draw restart prompt
  p.fill(255, 215, 0);
  p.textSize(24);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  p.pop();
}