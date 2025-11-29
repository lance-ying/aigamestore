// environment.js - Level environments and obstacles
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function createLevelEnvironment(p, Matter, engine, level) {
  const Bodies = Matter.Bodies;
  const World = Matter.World;
  
  const obstacles = [];
  
  // Create boundaries (walls, floor, ceiling)
  const ground = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 20, { 
    isStatic: true,
    restitution: 0.5
  });
  
  const ceiling = Bodies.rectangle(CANVAS_WIDTH / 2, 10, CANVAS_WIDTH, 20, { 
    isStatic: true,
    restitution: 0.5
  });
  
  const leftWall = Bodies.rectangle(10, CANVAS_HEIGHT / 2, 20, CANVAS_HEIGHT, { 
    isStatic: true,
    restitution: 0.5
  });
  
  const rightWall = Bodies.rectangle(CANVAS_WIDTH - 10, CANVAS_HEIGHT / 2, 20, CANVAS_HEIGHT, { 
    isStatic: true,
    restitution: 0.5
  });
  
  World.add(engine.world, [ground, ceiling, leftWall, rightWall]);
  obstacles.push({ body: ground, type: 'boundary' });
  obstacles.push({ body: ceiling, type: 'boundary' });
  obstacles.push({ body: leftWall, type: 'boundary' });
  obstacles.push({ body: rightWall, type: 'boundary' });
  
  if (level === 2) {
    // Obstacle Course - add blocks and ramp
    const block1 = Bodies.rectangle(150, CANVAS_HEIGHT - 60, 40, 40, { 
      isStatic: true,
      restitution: 0.8
    });
    const block2 = Bodies.rectangle(450, CANVAS_HEIGHT - 60, 40, 40, { 
      isStatic: true,
      restitution: 0.8
    });
    const ramp = Bodies.rectangle(300, CANVAS_HEIGHT - 50, 100, 20, { 
      isStatic: true,
      restitution: 0.6,
      angle: -0.3
    });
    
    World.add(engine.world, [block1, block2, ramp]);
    obstacles.push({ body: block1, type: 'block' });
    obstacles.push({ body: block2, type: 'block' });
    obstacles.push({ body: ramp, type: 'ramp' });
    
  } else if (level === 3) {
    // Gravity Chamber - add gravity zones (visual only, applied in update)
    obstacles.push({ 
      type: 'gravityZone',
      x: 150, y: CANVAS_HEIGHT - 60, 
      width: 100, height: 100,
      force: { x: 0, y: -0.001 }
    });
    obstacles.push({ 
      type: 'gravityZone',
      x: 450, y: CANVAS_HEIGHT - 60, 
      width: 100, height: 100,
      force: { x: 0, y: 0.0015 }
    });
    
  } else if (level === 4) {
    // Weapon Mastery Arena - moving platforms
    const platform1 = Bodies.rectangle(200, 200, 80, 15, { 
      isStatic: true,
      restitution: 0.7
    });
    const platform2 = Bodies.rectangle(400, 150, 80, 15, { 
      isStatic: true,
      restitution: 0.7
    });
    
    World.add(engine.world, [platform1, platform2]);
    obstacles.push({ 
      body: platform1, 
      type: 'movingPlatform',
      baseY: 200,
      moveSpeed: 0.02
    });
    obstacles.push({ 
      body: platform2, 
      type: 'movingPlatform',
      baseY: 150,
      moveSpeed: 0.03,
      phase: Math.PI
    });
  }
  
  return obstacles;
}

export function updateEnvironment(p, Matter, obstacles, frameCount) {
  const Body = Matter.Body;
  
  for (let obstacle of obstacles) {
    if (obstacle.type === 'movingPlatform') {
      const phase = obstacle.phase || 0;
      const newY = obstacle.baseY + Math.sin((frameCount * obstacle.moveSpeed) + phase) * 50;
      Body.setPosition(obstacle.body, { 
        x: obstacle.body.position.x, 
        y: newY 
      });
    }
  }
}

export function applyEnvironmentForces(Matter, buddy, obstacles) {
  const Body = Matter.Body;
  
  for (let obstacle of obstacles) {
    if (obstacle.type === 'gravityZone') {
      const center = buddy.getCenter();
      
      if (center.x > obstacle.x && center.x < obstacle.x + obstacle.width &&
          center.y > obstacle.y && center.y < obstacle.y + obstacle.height) {
        
        for (let part of buddy.parts) {
          Body.applyForce(part, part.position, obstacle.force);
        }
      }
    }
  }
}

export function drawEnvironment(p, obstacles) {
  p.push();
  
  for (let obstacle of obstacles) {
    if (obstacle.type === 'boundary') {
      p.fill(80);
      p.stroke(50);
      p.strokeWeight(2);
      const pos = obstacle.body.position;
      const bounds = obstacle.body.bounds;
      const w = bounds.max.x - bounds.min.x;
      const h = bounds.max.y - bounds.min.y;
      p.rectMode(p.CENTER);
      p.rect(pos.x, pos.y, w, h);
      
    } else if (obstacle.type === 'block') {
      p.fill(120, 80, 40);
      p.stroke(80, 50, 20);
      p.strokeWeight(2);
      const pos = obstacle.body.position;
      p.rectMode(p.CENTER);
      p.rect(pos.x, pos.y, 40, 40);
      
    } else if (obstacle.type === 'ramp') {
      p.fill(100, 70, 30);
      p.stroke(60, 40, 10);
      p.strokeWeight(2);
      const pos = obstacle.body.position;
      p.push();
      p.translate(pos.x, pos.y);
      p.rotate(obstacle.body.angle);
      p.rectMode(p.CENTER);
      p.rect(0, 0, 100, 20);
      p.pop();
      
    } else if (obstacle.type === 'movingPlatform') {
      p.fill(150, 150, 200);
      p.stroke(100, 100, 150);
      p.strokeWeight(2);
      const pos = obstacle.body.position;
      p.rectMode(p.CENTER);
      p.rect(pos.x, pos.y, 80, 15, 3);
      
    } else if (obstacle.type === 'gravityZone') {
      p.noFill();
      p.stroke(100, 200, 255, 100);
      p.strokeWeight(3);
      p.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Draw arrows indicating gravity direction
      const arrowY = obstacle.force.y < 0 ? -1 : 1;
      p.fill(100, 200, 255, 150);
      p.noStroke();
      const centerX = obstacle.x + obstacle.width / 2;
      const centerY = obstacle.y + obstacle.height / 2;
      
      for (let i = 0; i < 3; i++) {
        const ay = centerY + arrowY * i * 15;
        p.triangle(
          centerX, ay,
          centerX - 5, ay - arrowY * 8,
          centerX + 5, ay - arrowY * 8
        );
      }
    }
  }
  
  p.pop();
}