import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupPhysicsEvents() {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      // Ball hitting bumper - extra bounce
      if ((bodyA.label === 'ball' && bodyB.label === 'bumper') ||
          (bodyA.label === 'bumper' && bodyB.label === 'ball')) {
        // The restitution in body definition handles this
      }
    });
  });
}

export function checkBallsInBuckets() {
  const balls = gameState.balls;
  const buckets = gameState.buckets;
  
  // Reset bucket counts
  buckets.forEach(bucket => {
    bucket.count = 0;
  });
  
  // Check each ball
  balls.forEach(ball => {
    if (!ball.inBucket) {
      buckets.forEach((bucket, idx) => {
        if (bucket.checkBall(ball)) {
          ball.inBucket = true;
          ball.bucketId = idx;
        }
      });
    }
    
    if (ball.inBucket && ball.bucketId >= 0) {
      buckets[ball.bucketId].count++;
    }
  });
}

export function checkLevelComplete() {
  const allBallsAtRest = gameState.balls.every(ball => ball.isAtRest());
  
  if (!allBallsAtRest || gameState.balls.length < gameState.ballsToFire) {
    return false;
  }
  
  checkBallsInBuckets();
  
  const allBucketsFilled = gameState.buckets.every(bucket => {
    return bucket.count >= bucket.required;
  });
  
  return allBucketsFilled;
}