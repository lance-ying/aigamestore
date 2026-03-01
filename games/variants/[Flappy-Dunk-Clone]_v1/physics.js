import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, Body, Composite } = Matter;
import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Particle } from './entities.js';

export function setupPhysics(engine) {
    // Configure gravity
    engine.world.gravity.y = 1.2; // Stronger gravity for snappy feel
    engine.world.gravity.x = 0;

    // Collision Event Handling
    Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;

        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;

            handleCollision(bodyA, bodyB);
        }
    });
}

function handleCollision(bodyA, bodyB) {
    // Identify bodies
    const isPlayerA = bodyA.label === 'player';
    const isPlayerB = bodyB.label === 'player';
    
    if (!isPlayerA && !isPlayerB) return;

    const playerBody = isPlayerA ? bodyA : bodyB;
    const otherBody = isPlayerA ? bodyB : bodyA;

    // 1. Ground Collision -> Bounce or Death
    if (otherBody.label === 'ground') {
        if (gameState.bounces > 0) {
            // Consume bounce and pop up
            gameState.bounces--;
            Body.setVelocity(playerBody, { x: playerBody.velocity.x, y: -12 });
            createBounceEffect(playerBody.position.x, playerBody.position.y + 15);
        } else {
            triggerGameOver();
        }
    }

    // 2. Hoop Sensor Collision -> Score
    if (otherBody.label === 'hoopSensor') {
        // Only score if falling downwards? 
        // For simplicity, just touching the sensor inside the hoop counts.
        // But to prevent cheating (coming from bottom), we check velocity Y.
        // Actually, Flappy Dunk allows touching, but let's check if player.velocity.y > 0 (falling)
        if (playerBody.velocity.y > 0) {
            scorePoint(otherBody);
        }
    }

    // 3. Bounce Supply Collision
    if (otherBody.label === 'bounceSupply') {
        collectSupply(otherBody);
    }
}

function triggerGameOver() {
    if (gameState.gamePhase !== 'PLAYING') return;
    
    gameState.gamePhase = 'GAME_OVER_LOSE';
    
    // Update high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
    }

    // Log death
    if (gameState.p5 && gameState.p5.logs) {
        gameState.p5.logs.game_info.push({
            event: 'death',
            score: gameState.score,
            timestamp: Date.now()
        });
    }
}

function scorePoint(sensorBody) {
    // Check if this sensor was already triggered
    // We can store a property on the body itself since Matter.js bodies are JS objects
    if (sensorBody.isTriggered) return;

    sensorBody.isTriggered = true;
    gameState.score++;

    // Add visual effect
    createScoreEffect(sensorBody.position.x, sensorBody.position.y);
}

function collectSupply(supplyBody) {
    if (supplyBody.isCollected) return;
    supplyBody.isCollected = true;

    gameState.bounces++;
    
    // Remove physics body immediately
    Composite.remove(gameState.world, supplyBody);

    // Effect
    createScoreEffect(supplyBody.position.x, supplyBody.position.y); // Reuse score effect (gold particles)
}

function createScoreEffect(x, y) {
    // Add particle burst
    if (gameState.p5) {
        for(let i=0; i<10; i++) {
            // Use Particle class to ensure update() method exists
            gameState.particles.push(new Particle(x, y, [255, 215, 0]));
        }
    }
}

function createBounceEffect(x, y) {
    if (gameState.p5) {
        for(let i=0; i<5; i++) {
            gameState.particles.push(new Particle(x, y, [200, 200, 200]));
        }
    }
}