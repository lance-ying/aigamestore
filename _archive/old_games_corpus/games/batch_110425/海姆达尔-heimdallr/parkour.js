// parkour.js - Parkour mode logic
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  render(p, cameraX) {
    p.push();
    p.fill(80, 80, 120);
    p.stroke(100, 100, 150);
    p.strokeWeight(2);
    p.rect(this.x - cameraX, this.y, this.width, this.height);
    
    // Surface detail
    p.stroke(120, 120, 180, 100);
    p.strokeWeight(1);
    for (let i = 0; i < this.width; i += 20) {
      p.line(this.x - cameraX + i, this.y, this.x - cameraX + i, this.y + this.height);
    }
    p.pop();
  }
}

export class Obstacle {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'spike', 'laser', 'gap'
  }
  
  render(p, cameraX) {
    p.push();
    
    if (this.type === 'spike') {
      p.fill(255, 50, 50);
      p.stroke(200, 0, 0);
      p.strokeWeight(2);
      
      // Draw spikes
      const numSpikes = Math.floor(this.width / 15);
      p.beginShape();
      for (let i = 0; i <= numSpikes; i++) {
        const baseX = this.x - cameraX + i * 15;
        p.vertex(baseX, this.y + this.height);
        p.vertex(baseX + 7.5, this.y);
      }
      p.vertex(this.x - cameraX + this.width, this.y + this.height);
      p.endShape(p.CLOSE);
    } else if (this.type === 'laser') {
      p.fill(255, 0, 0, 150);
      p.stroke(255, 100, 100);
      p.strokeWeight(3);
      p.rect(this.x - cameraX, this.y, this.width, this.height);
      
      // Laser beam effect
      p.stroke(255, 0, 0, 200);
      p.strokeWeight(2);
      p.line(this.x - cameraX, this.y + this.height / 2, 
             this.x - cameraX + this.width, this.y + this.height / 2);
    }
    
    p.pop();
  }
}

export class DataFragment {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.collected = false;
    this.rotation = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }
  
  update() {
    this.rotation += 0.05;
    this.pulsePhase += 0.1;
  }
  
  render(p, cameraX) {
    if (this.collected) return;
    
    p.push();
    const renderX = this.x - cameraX;
    const pulse = Math.sin(this.pulsePhase) * 3;
    
    p.translate(renderX, this.y);
    p.rotate(this.rotation);
    
    // Outer glow
    p.fill(0, 255, 255, 50);
    p.noStroke();
    p.rect(-this.size / 2 - 5, -this.size / 2 - 5, this.size + 10 + pulse, this.size + 10 + pulse);
    
    // Core
    p.fill(0, 255, 255);
    p.stroke(100, 255, 255);
    p.strokeWeight(2);
    p.rect(-this.size / 2, -this.size / 2, this.size, this.size);
    
    // Inner detail
    p.fill(255);
    p.noStroke();
    p.rect(-this.size / 4, -this.size / 4, this.size / 2, this.size / 2);
    
    p.pop();
  }
}

export function initializeParkourLevel(chapter) {
  gameState.platforms = [];
  gameState.obstacles = [];
  gameState.dataFragments = [];
  gameState.collectedFragments = 0;
  gameState.levelComplete = false;
  gameState.cameraX = 0;
  
  // Starting platform
  gameState.platforms.push(new Platform(0, 350, 200, 50));
  gameState.checkpointX = 0;
  
  if (chapter === 0) {
    // Chapter 1 parkour: Basic obstacles
    buildLevel1();
    gameState.totalFragments = 5;
  } else if (chapter === 1) {
    // Chapter 2 parkour: More challenging
    buildLevel2();
    gameState.totalFragments = 7;
  } else {
    // Chapter 3 parkour: Final challenge
    buildLevel3();
    gameState.totalFragments = 10;
  }
}

function buildLevel1() {
  let x = 250;
  
  // Platform sequence with gaps
  gameState.platforms.push(new Platform(x, 350, 150, 50));
  gameState.dataFragments.push(new DataFragment(x + 75, 300));
  x += 200;
  
  gameState.platforms.push(new Platform(x, 320, 120, 50));
  x += 170;
  
  // Spike obstacle
  gameState.platforms.push(new Platform(x, 350, 180, 50));
  gameState.obstacles.push(new Obstacle(x + 20, 305, 60, 45, 'spike'));
  gameState.dataFragments.push(new DataFragment(x + 140, 300));
  x += 230;
  
  // Jump section
  gameState.platforms.push(new Platform(x, 300, 100, 50));
  gameState.dataFragments.push(new DataFragment(x + 50, 250));
  x += 150;
  
  gameState.platforms.push(new Platform(x, 350, 150, 50));
  x += 200;
  
  // Laser section
  gameState.platforms.push(new Platform(x, 350, 200, 50));
  gameState.obstacles.push(new Obstacle(x + 50, 250, 5, 100, 'laser'));
  gameState.dataFragments.push(new DataFragment(x + 150, 300));
  x += 250;
  
  // Final platform
  gameState.platforms.push(new Platform(x, 350, 150, 50));
  gameState.dataFragments.push(new DataFragment(x + 75, 300));
  x += 200;
  
  // End marker
  gameState.platforms.push(new Platform(x, 350, 200, 50));
  gameState.levelEndX = x + 100;
}

function buildLevel2() {
  let x = 250;
  
  // Complex platform sequence
  gameState.platforms.push(new Platform(x, 350, 120, 50));
  gameState.dataFragments.push(new DataFragment(x + 60, 300));
  x += 170;
  
  gameState.platforms.push(new Platform(x, 300, 100, 50));
  x += 150;
  
  gameState.platforms.push(new Platform(x, 350, 130, 50));
  gameState.obstacles.push(new Obstacle(x + 20, 305, 50, 45, 'spike'));
  gameState.dataFragments.push(new DataFragment(x + 100, 300));
  x += 180;
  
  // Elevated section
  gameState.platforms.push(new Platform(x, 250, 120, 50));
  gameState.dataFragments.push(new DataFragment(x + 60, 200));
  x += 170;
  
  gameState.platforms.push(new Platform(x, 280, 100, 50));
  x += 150;
  
  // Drop with spikes
  gameState.platforms.push(new Platform(x, 350, 180, 50));
  gameState.obstacles.push(new Obstacle(x + 40, 305, 40, 45, 'spike'));
  gameState.obstacles.push(new Obstacle(x + 120, 305, 40, 45, 'spike'));
  gameState.dataFragments.push(new DataFragment(x + 90, 270));
  x += 230;
  
  // Laser gauntlet
  gameState.platforms.push(new Platform(x, 350, 250, 50));
  gameState.obstacles.push(new Obstacle(x + 80, 250, 5, 100, 'laser'));
  gameState.obstacles.push(new Obstacle(x + 170, 250, 5, 100, 'laser'));
  gameState.dataFragments.push(new DataFragment(x + 50, 300));
  gameState.dataFragments.push(new DataFragment(x + 200, 300));
  x += 300;
  
  // Final stretch
  gameState.platforms.push(new Platform(x, 350, 200, 50));
  gameState.dataFragments.push(new DataFragment(x + 100, 300));
  x += 250;
  
  gameState.platforms.push(new Platform(x, 350, 200, 50));
  gameState.levelEndX = x + 100;
}

function buildLevel3() {
  let x = 250;
  
  // Challenging start
  gameState.platforms.push(new Platform(x, 330, 100, 50));
  gameState.dataFragments.push(new DataFragment(x + 50, 280));
  x += 150;
  
  gameState.platforms.push(new Platform(x, 280, 90, 50));
  x += 140;
  
  gameState.platforms.push(new Platform(x, 230, 100, 50));
  gameState.dataFragments.push(new DataFragment(x + 50, 180));
  x += 150;
  
  // Spike valley
  gameState.platforms.push(new Platform(x, 350, 200, 50));
  gameState.obstacles.push(new Obstacle(x + 30, 305, 50, 45, 'spike'));
  gameState.obstacles.push(new Obstacle(x + 120, 305, 50, 45, 'spike'));
  gameState.dataFragments.push(new DataFragment(x + 85, 270));
  x += 250;
  
  // High platforms with lasers
  gameState.platforms.push(new Platform(x, 250, 120, 50));
  gameState.obstacles.push(new Obstacle(x + 60, 150, 5, 100, 'laser'));
  gameState.dataFragments.push(new DataFragment(x + 30, 200));
  x += 170;
  
  gameState.platforms.push(new Platform(x, 300, 100, 50));
  x += 150;
  
  gameState.platforms.push(new Platform(x, 350, 150, 50));
  gameState.obstacles.push(new Obstacle(x + 50, 305, 50, 45, 'spike'));
  gameState.dataFragments.push(new DataFragment(x + 120, 300));
  x += 200;
  
  // Technical section
  gameState.platforms.push(new Platform(x, 320, 80, 50));
  x += 130;
  
  gameState.platforms.push(new Platform(x, 270, 80, 50));
  gameState.dataFragments.push(new DataFragment(x + 40, 220));
  x += 130;
  
  gameState.platforms.push(new Platform(x, 330, 100, 50));
  x += 150;
  
  // Final gauntlet
  gameState.platforms.push(new Platform(x, 350, 300, 50));
  gameState.obstacles.push(new Obstacle(x + 50, 305, 40, 45, 'spike'));
  gameState.obstacles.push(new Obstacle(x + 130, 250, 5, 100, 'laser'));
  gameState.obstacles.push(new Obstacle(x + 210, 305, 40, 45, 'spike'));
  gameState.dataFragments.push(new DataFragment(x + 90, 270));
  gameState.dataFragments.push(new DataFragment(x + 170, 270));
  gameState.dataFragments.push(new DataFragment(x + 250, 300));
  x += 350;
  
  // Victory platform
  gameState.platforms.push(new Platform(x, 350, 200, 50));
  gameState.levelEndX = x + 100;
}

export function updateParkourMode(p) {
  // Update camera to follow player
  const targetCameraX = gameState.player.x - CANVAS_WIDTH / 3;
  gameState.cameraX = Math.max(0, targetCameraX);
  
  // Update data fragments
  for (let fragment of gameState.dataFragments) {
    fragment.update();
  }
  
  // Check level completion
  if (gameState.player.x > gameState.levelEndX && !gameState.levelComplete) {
    gameState.levelComplete = true;
    gameState.segmentComplete = true;
  }
}

export function renderParkourMode(p) {
  p.push();
  
  // Background - cyberpunk city
  const bgGradient = p.drawingContext.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGradient.addColorStop(0, '#1a0033');
  bgGradient.addColorStop(1, '#330066');
  p.drawingContext.fillStyle = bgGradient;
  p.drawingContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Background buildings (parallax)
  p.fill(20, 20, 60, 150);
  p.noStroke();
  for (let i = 0; i < 10; i++) {
    const bx = (i * 120 - gameState.cameraX * 0.3) % CANVAS_WIDTH;
    const bh = 100 + (i % 3) * 50;
    p.rect(bx, CANVAS_HEIGHT - bh, 80, bh);
    
    // Building windows
    p.fill(255, 255, 0, 100);
    for (let wy = CANVAS_HEIGHT - bh + 20; wy < CANVAS_HEIGHT; wy += 20) {
      for (let wx = bx + 10; wx < bx + 70; wx += 15) {
        if (Math.random() > 0.5) {
          p.rect(wx, wy, 8, 12);
        }
      }
    }
    p.fill(20, 20, 60, 150);
  }
  
  // Render platforms
  for (let platform of gameState.platforms) {
    platform.render(p, gameState.cameraX);
  }
  
  // Render obstacles
  for (let obstacle of gameState.obstacles) {
    obstacle.render(p, gameState.cameraX);
  }
  
  // Render data fragments
  for (let fragment of gameState.dataFragments) {
    fragment.render(p, gameState.cameraX);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // HUD
  renderParkourHUD(p);
  
  p.pop();
}

function renderParkourHUD(p) {
  // Health bar
  p.fill(100, 0, 0);
  p.noStroke();
  p.rect(20, 20, 200, 20);
  p.fill(0, 255, 0);
  const healthWidth = (gameState.player.health / gameState.player.maxHealth) * 200;
  p.rect(20, 20, healthWidth, 20);
  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  p.rect(20, 20, 200, 20);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text('HEALTH', 20, 5);
  
  // Data fragments collected
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`DATA: ${gameState.collectedFragments}/${gameState.totalFragments}`, CANVAS_WIDTH - 20, 20);
  
  // Chapter info
  p.textAlign(p.LEFT, p.TOP);
  p.text(`CH ${gameState.currentChapter + 1}`, 20, 50);
  
  // Sprint indicator
  if (gameState.player.sprinting) {
    p.fill(255, 255, 0);
    p.text('SPRINT', 20, 70);
  }
  
  // Slide indicator
  if (gameState.player.sliding) {
    p.fill(0, 255, 255);
    p.text('SLIDE', 20, 90);
  }
}