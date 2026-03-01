// automated_testing_controller.js - Automated testing strategies

import { gameState, CANVAS_WIDTH, distance } from './globals.js';

// TEST_1: Basic movement and collision testing
function getTest1Action() {
  if (!gameState.player) return null;

  const head = gameState.player.balls[0];
  if (!head) return null;

  // Find nearest collectible or avoid nearest brick
  let nearestCollectible = null;
  let minCollectibleDist = Infinity;

  for (const collectible of gameState.collectibles) {
    const dist = distance(head.x, head.y, collectible.x, collectible.y);
    if (dist < minCollectibleDist) {
      minCollectibleDist = dist;
      nearestCollectible = collectible;
    }
  }

  // Find nearest dangerous brick
  let nearestBrick = null;
  let minBrickDist = Infinity;

  for (const brick of gameState.bricks) {
    if (brick.value > gameState.player.getLength() * 0.5) {
      const dist = distance(head.x, head.y, brick.x, brick.y);
      if (dist < minBrickDist && dist < 150) {
        minBrickDist = dist;
        nearestBrick = brick;
      }
    }
  }

  // Priority: avoid dangerous bricks, then collect items
  if (nearestBrick && minBrickDist < 100) {
    // Move away from brick
    const brickCenterX = nearestBrick.x + nearestBrick.width / 2;
    if (head.x < brickCenterX) {
      return { keyCode: 37 }; // Left
    } else {
      return { keyCode: 39 }; // Right
    }
  }

  if (nearestCollectible) {
    // Move toward collectible
    if (head.x < nearestCollectible.x - 10) {
      return { keyCode: 39 }; // Right
    } else if (head.x > nearestCollectible.x + 10) {
      return { keyCode: 37 }; // Left
    }
  }

  // Stay centered if nothing to do
  if (head.x < CANVAS_WIDTH / 2 - 20) {
    return { keyCode: 39 }; // Right
  } else if (head.x > CANVAS_WIDTH / 2 + 20) {
    return { keyCode: 37 }; // Left
  }

  return null;
}

// TEST_2: Optimal play strategy to maximize survival and score
function getTest2Action() {
  if (!gameState.player) return null;

  const head = gameState.player.balls[0];
  if (!head) return null;

  const snakeLength = gameState.player.getLength();

  // Evaluate all potential targets
  const collectibles = gameState.collectibles.map(c => ({
    obj: c,
    x: c.x,
    y: c.y,
    value: c.value * 2, // Collectibles are valuable
    dist: distance(head.x, head.y, c.x, c.y),
    type: 'collectible'
  }));

  const bricks = gameState.bricks.map(b => ({
    obj: b,
    x: b.x + b.width / 2,
    y: b.y + b.height / 2,
    value: -b.value, // Bricks are costly
    dist: distance(head.x, head.y, b.x + b.width / 2, b.y + b.height / 2),
    type: 'brick',
    dangerous: b.value > snakeLength * 0.7
  }));

  // Find best target
  let bestTarget = null;
  let bestScore = -Infinity;

  for (const target of collectibles) {
    if (target.dist < 200) {
      const score = target.value / (target.dist + 1) * 10;
      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }
  }

  // Avoid dangerous bricks
  for (const brick of bricks) {
    if (brick.dangerous && brick.dist < 100) {
      const avoidScore = -100 / (brick.dist + 1);
      if (avoidScore < -10) {
        // Emergency avoidance
        const brickCenterX = brick.x;
        const leftSpace = brick.obj.x;
        const rightSpace = CANVAS_WIDTH - (brick.obj.x + brick.obj.width);

        if (leftSpace > rightSpace && head.x > brick.obj.x) {
          return { keyCode: 37 }; // Go left
        } else if (rightSpace > leftSpace && head.x < brick.obj.x + brick.obj.width) {
          return { keyCode: 39 }; // Go right
        }
      }
    }
  }

  // Move toward best target
  if (bestTarget) {
    if (head.x < bestTarget.x - 15) {
      return { keyCode: 39 }; // Right
    } else if (head.x > bestTarget.x + 15) {
      return { keyCode: 37 }; // Left
    }
  }

  // Look for safe paths through bricks
  const safeX = findSafestPath(head.x, bricks, snakeLength);
  if (safeX !== null) {
    if (head.x < safeX - 15) {
      return { keyCode: 39 }; // Right
    } else if (head.x > safeX + 15) {
      return { keyCode: 37 }; // Left
    }
  }

  // Default: stay in safe middle area
  const centerX = CANVAS_WIDTH / 2;
  if (head.x < centerX - 30) {
    return { keyCode: 39 }; // Right
  } else if (head.x > centerX + 30) {
    return { keyCode: 37 }; // Left
  }

  return null;
}

// Find safest path through obstacles
function findSafestPath(currentX, bricks, snakeLength) {
  const segments = 10;
  const segmentWidth = CANVAS_WIDTH / segments;
  const scores = new Array(segments).fill(0);

  // Score each horizontal segment
  for (let i = 0; i < segments; i++) {
    const segmentX = i * segmentWidth + segmentWidth / 2;
    let segmentScore = 100;

    // Check nearby bricks
    for (const brick of bricks) {
      if (brick.dist < 200) {
        const brickX = brick.x;
        const distToSegment = Math.abs(brickX - segmentX);

        if (distToSegment < segmentWidth * 2) {
          if (brick.dangerous) {
            segmentScore -= 50;
          } else {
            segmentScore -= brick.obj.value;
          }
        }
      }
    }

    scores[i] = segmentScore;
  }

  // Find best segment
  let bestSegment = 0;
  let bestScore = scores[0];
  for (let i = 1; i < segments; i++) {
    if (scores[i] > bestScore) {
      bestScore = scores[i];
      bestSegment = i;
    }
  }

  return bestSegment * segmentWidth + segmentWidth / 2;
}

// Main function to get automated testing action
export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action();
    case "TEST_2":
      return getTest2Action();
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;