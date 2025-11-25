import { gameState } from './globals.js';

export function updateGame(p) {
  const player1 = gameState.player1;
  const player2 = gameState.player2;
  
  // Update keys
  for (let key of gameState.keys) {
    key.update();
    
    if (!key.collected) {
      // Check collision with both players
      const p1Collide = player1 && p1.checkPointCollision(key.x, key.y);
      const p2Collide = player2 && p2.checkPointCollision(key.x, key.y);
      
      if (p1Collide || p2Collide) {
        key.collected = true;
        gameState.keysCollected++;
        gameState.score += 100;
        
        p.logs.player_info.push({
          event: "key_collected",
          key_id: key.id,
          keys_collected: gameState.keysCollected,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Update doors
  for (let door of gameState.doors) {
    door.update();
  }
  
  // Update exit
  if (gameState.exit) {
    gameState.exit.update();
  }
  
  // Check if both players reached exit
  if (player1 && player2 && player1.isAlive && player2.isAlive) {
    if (gameState.exit) {
      const p1Distance = p.dist(player1.x + player1.width/2, player1.y + player1.height/2, 
                                gameState.exit.x, gameState.exit.y);
      const p2Distance = p.dist(player2.x + player2.width/2, player2.y + player2.height/2,
                                gameState.exit.x, gameState.exit.y);
      
      if (p1Distance < gameState.exit.size/2 && p2Distance < gameState.exit.size/2) {
        gameState.gamePhase = "GAME_OVER_WIN";
        gameState.score += 500;
        
        p.logs.game_info.push({
          event: "game_won",
          score: gameState.score,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Check if any player died
  if (player1 && !player1.isAlive || player2 && !player2.isAlive) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    
    p.logs.game_info.push({
      event: "game_lost",
      reason: "player_died",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Add platforms that block movement (locked doors)
  const blockingPlatforms = [...gameState.platforms];
  for (let door of gameState.doors) {
    if (door.blocksMovement()) {
      blockingPlatforms.push(door);
    }
  }
  
  return blockingPlatforms;
}

export function renderGame(p) {
  p.background(30, 40, 60);
  
  // Draw background gradient
  for (let i = 0; i < p.height; i++) {
    const inter = i / p.height;
    const c = p.lerpColor(p.color(30, 40, 60), p.color(60, 70, 100), inter);
    p.stroke(c);
    p.line(0, i, p.width, i);
  }
  
  // Draw stars
  p.randomSeed(12345);
  p.fill(255, 255, 255, 200);
  p.noStroke();
  for (let i = 0; i < 30; i++) {
    const x = p.random(p.width);
    const y = p.random(p.height);
    const size = p.random(1, 3);
    p.ellipse(x, y, size, size);
  }
  
  // Draw platforms
  for (let platform of gameState.platforms) {
    platform.display();
  }
  
  // Draw spikes
  for (let spike of gameState.spikes) {
    spike.display();
  }
  
  // Draw doors
  for (let door of gameState.doors) {
    door.display();
  }
  
  // Draw keys
  for (let key of gameState.keys) {
    key.display();
  }
  
  // Draw exit
  if (gameState.exit) {
    gameState.exit.display();
  }
  
  // Draw players
  if (gameState.player1) gameState.player1.display();
  if (gameState.player2) gameState.player2.display();
}