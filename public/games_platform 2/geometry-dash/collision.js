import { PLAYER_MODES, SCROLL_SPEED } from './globals.js';

export function checkCollisions(p, player, obstacles, portals, gameState) {
  // Check for obstacle collisions
  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i];
    if (p.collideRectRect(
      player.x, player.y, player.width, player.height,
      obstacle.x, obstacle.y, obstacle.width, obstacle.height
    )) {
      console.log(`Collision detected with obstacle ${i}, type: ${obstacle.type}, isFirst: ${i === 0}`);
      
      // Special case for ground platform - don't die (ground platform is the first obstacle)
      if (i === 0) {
        console.log("Ground platform collision - no death");
        continue;
      }

      // Only kill player for dangerous obstacle types
      if (obstacle.type === 'spike' || obstacle.type === 'ceiling') {
        console.log(`Deadly collision with ${obstacle.type} - player dies`);
        player.die();
        return true;
      }

      // Allow landing on block platforms when colliding from above while falling
      if (obstacle.type === 'block') {
        try {
          const prevBottom = (player.y - player.velocityY) + player.height;
          const currBottom = player.y + player.height;
          const platformTop = obstacle.y;
          const platformBottom = obstacle.y + obstacle.height;
          const prevTop = (player.y - player.velocityY);

          // Horizontal sweep info to resolve side collisions
          const prevX = player.x - SCROLL_SPEED;
          const prevRight = prevX + player.width;
          const currLeft = player.x;
          const currRight = player.x + player.width;

          if (player.mode === PLAYER_MODES.CUBE) {
            // Landing from above
            if (prevBottom <= platformTop && currBottom >= platformTop && player.velocityY >= 0) {
              player.y = platformTop - player.height;
              player.velocityY = 0;
              player.onGround = true;
              player.isJumping = false;
              player.rotation = 0;
              console.log(`Landed on platform ${i}`);
              continue;
            }

            // Hitting the underside while moving upward
            if (player.velocityY < 0 && prevTop >= platformBottom && (player.y) <= platformBottom) {
              player.y = platformBottom;
              player.velocityY = 0;
              console.log(`Bumped head on platform ${i}`);
              continue;
            }

            // Side collision resolution (treat blocks as solid walls)
            if (prevRight <= obstacle.x && currRight > obstacle.x) {
              // Came from left, push to left of block
              player.x = obstacle.x - player.width;
              console.log(`Pushed left due to side collision on platform ${i}`);
              continue;
            } else if (prevX >= obstacle.x + obstacle.width && currLeft < obstacle.x + obstacle.width) {
              // Came from right, push to right of block (rare)
              player.x = obstacle.x + obstacle.width;
              console.log(`Pushed right due to side collision on platform ${i}`);
              continue;
            }
          }
        } catch (err) {
          console.log('Platform collision resolution failed; defaulting to non-death block collision', err);
        }

        console.log("Block collision - no death");
        continue;
      }

      // If we get here, it's an unknown obstacle type
      console.log(`Unknown obstacle type: ${obstacle.type} - player dies`);
      player.die();
      return true;
    }
  }
  
  // Check for portal collisions
  for (const portal of portals) {
    if (p.collideRectRect(
      player.x, player.y, player.width, player.height,
      portal.x, portal.y, portal.width, portal.height
    )) {
      player.changeMode(portal.targetMode);
    }
  }
  
  // Check if player reached the end
  if (player.x >= gameState.level.endX) {
    return 'win';
  }
  
  // Check if player fell below the level
  if (player.y > p.height + 100) {
    console.log("Player fell below level - dies");
    player.die();
    return true;
  }
  
  return false;
}

