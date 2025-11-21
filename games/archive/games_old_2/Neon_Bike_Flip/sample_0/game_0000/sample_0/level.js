// level.js - Level generation and management
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Level {
  constructor(p, levelNumber, engine) {
    this.p = p;
    this.levelNumber = levelNumber;
    this.engine = engine;
    this.platforms = [];
    this.finishLine = null;
    
    this.generateLevel();
  }
  
  generateLevel() {
    const Matter = window.Matter;
    
    // Clear existing platforms
    for (let platform of this.platforms) {
      Matter.World.remove(this.engine.world, platform.body);
    }
    this.platforms = [];
    
    const levelDesigns = {
      1: this.generateLevel1.bind(this),
      2: this.generateLevel2.bind(this),
      3: this.generateLevel3.bind(this),
      4: this.generateLevel4.bind(this),
      5: this.generateLevel5.bind(this)
    };
    
    const generator = levelDesigns[this.levelNumber] || levelDesigns[1];
    generator();
  }
  
  generateLevel1() {
    // Level 1: The Rookie Ramp - Easy introduction
    const Matter = window.Matter;
    const segments = [
      // Starting platform
      { x: 100, y: 350, w: 300, h: 20, angle: 0 },
      // Gentle ramp up
      { x: 400, y: 330, w: 200, h: 20, angle: -0.1 },
      // Flat section
      { x: 650, y: 300, w: 200, h: 20, angle: 0 },
      // Small jump
      { x: 900, y: 320, w: 150, h: 20, angle: 0.15 },
      // Landing zone
      { x: 1100, y: 340, w: 200, h: 20, angle: 0 },
      // Another gentle ramp
      { x: 1350, y: 320, w: 200, h: 20, angle: -0.1 },
      // Final platform
      { x: 1600, y: 300, w: 300, h: 20, angle: 0 }
    ];
    
    this.createPlatforms(segments);
    this.finishLine = 1850;
  }
  
  generateLevel2() {
    // Level 2: Neon Ascent - Steeper ramps and longer jumps
    const Matter = window.Matter;
    const segments = [
      { x: 100, y: 350, w: 200, h: 20, angle: 0 },
      { x: 350, y: 320, w: 180, h: 20, angle: -0.2 },
      { x: 600, y: 280, w: 150, h: 20, angle: 0 },
      { x: 850, y: 310, w: 120, h: 20, angle: 0.3 },
      { x: 1050, y: 340, w: 150, h: 20, angle: 0 },
      { x: 1300, y: 300, w: 150, h: 20, angle: -0.15 },
      { x: 1550, y: 260, w: 150, h: 20, angle: 0 },
      { x: 1800, y: 290, w: 200, h: 20, angle: 0.15 },
      { x: 2100, y: 320, w: 250, h: 20, angle: 0 }
    ];
    
    this.createPlatforms(segments);
    this.finishLine = 2400;
  }
  
  generateLevel3() {
    // Level 3: Urban Sprawl - Multiple jumps and tighter landings
    const Matter = window.Matter;
    const segments = [
      { x: 100, y: 350, w: 200, h: 20, angle: 0 },
      { x: 350, y: 330, w: 120, h: 20, angle: -0.15 },
      { x: 550, y: 300, w: 100, h: 20, angle: 0 },
      { x: 750, y: 330, w: 100, h: 20, angle: 0.25 },
      { x: 950, y: 280, w: 100, h: 20, angle: -0.2 },
      { x: 1150, y: 250, w: 120, h: 20, angle: 0 },
      { x: 1400, y: 280, w: 100, h: 20, angle: 0.2 },
      { x: 1600, y: 310, w: 100, h: 20, angle: 0 },
      { x: 1850, y: 290, w: 120, h: 20, angle: -0.15 },
      { x: 2100, y: 260, w: 150, h: 20, angle: 0 },
      { x: 2400, y: 290, w: 200, h: 20, angle: 0.1 }
    ];
    
    this.createPlatforms(segments);
    this.finishLine = 2700;
  }
  
  generateLevel4() {
    // Level 4: Gravity's Gauntlet - High jumps and steep terrain
    const Matter = window.Matter;
    const segments = [
      { x: 100, y: 350, w: 200, h: 20, angle: 0 },
      { x: 350, y: 310, w: 150, h: 20, angle: -0.25 },
      { x: 580, y: 250, w: 100, h: 20, angle: 0 },
      { x: 850, y: 320, w: 100, h: 20, angle: 0.35 },
      { x: 1080, y: 230, w: 100, h: 20, angle: -0.3 },
      { x: 1300, y: 200, w: 80, h: 20, angle: 0 },
      { x: 1550, y: 270, w: 80, h: 20, angle: 0.3 },
      { x: 1780, y: 330, w: 100, h: 20, angle: 0 },
      { x: 2050, y: 300, w: 100, h: 20, angle: -0.2 },
      { x: 2300, y: 260, w: 120, h: 20, angle: 0 },
      { x: 2600, y: 290, w: 200, h: 20, angle: 0.1 }
    ];
    
    this.createPlatforms(segments);
    this.finishLine = 2900;
  }
  
  generateLevel5() {
    // Level 5: Master Stunt - Ultimate challenge
    const Matter = window.Matter;
    const segments = [
      { x: 100, y: 350, w: 180, h: 20, angle: 0 },
      { x: 330, y: 310, w: 100, h: 20, angle: -0.3 },
      { x: 520, y: 240, w: 80, h: 20, angle: 0 },
      { x: 750, y: 310, w: 70, h: 20, angle: 0.4 },
      { x: 950, y: 200, w: 70, h: 20, angle: -0.35 },
      { x: 1150, y: 170, w: 60, h: 20, angle: 0 },
      { x: 1400, y: 250, w: 70, h: 20, angle: 0.35 },
      { x: 1620, y: 320, w: 80, h: 20, angle: 0 },
      { x: 1900, y: 280, w: 70, h: 20, angle: -0.25 },
      { x: 2120, y: 230, w: 70, h: 20, angle: 0 },
      { x: 2400, y: 280, w: 80, h: 20, angle: 0.3 },
      { x: 2650, y: 330, w: 100, h: 20, angle: 0 },
      { x: 2900, y: 300, w: 150, h: 20, angle: -0.1 },
      { x: 3150, y: 270, w: 200, h: 20, angle: 0 }
    ];
    
    this.createPlatforms(segments);
    this.finishLine = 3450;
  }
  
  createPlatforms(segments) {
    const Matter = window.Matter;
    
    for (let seg of segments) {
      const body = Matter.Bodies.rectangle(seg.x, seg.y, seg.w, seg.h, {
        isStatic: true,
        angle: seg.angle,
        friction: 0.8,
        restitution: 0.1
      });
      
      this.platforms.push({
        body,
        x: seg.x,
        y: seg.y,
        w: seg.w,
        h: seg.h,
        angle: seg.angle
      });
      
      Matter.World.add(this.engine.world, body);
    }
  }
  
  render(p, cameraX, cameraY) {
    p.push();
    p.translate(-cameraX, -cameraY);
    
    // Render platforms
    for (let platform of this.platforms) {
      p.push();
      p.translate(platform.x, platform.y);
      p.rotate(platform.angle);
      
      // Neon ground effect
      p.stroke(0, 255, 100);
      p.strokeWeight(4);
      p.fill(10, 30, 20);
      p.rect(0, 0, platform.w, platform.h);
      
      // Inner glow
      p.stroke(0, 255, 100, 100);
      p.strokeWeight(2);
      p.noFill();
      p.rect(0, 0, platform.w - 4, platform.h - 4);
      
      p.pop();
    }
    
    // Render finish line
    if (this.finishLine) {
      p.stroke(255, 255, 0);
      p.strokeWeight(6);
      for (let i = 0; i < 400; i += 20) {
        p.line(this.finishLine, i, this.finishLine, i + 10);
      }
      
      // Finish text
      p.fill(255, 255, 0);
      p.noStroke();
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("FINISH", this.finishLine, 100);
    }
    
    p.pop();
  }
  
  checkFinish(bikeX) {
    return this.finishLine && bikeX >= this.finishLine;
  }
  
  cleanup() {
    const Matter = window.Matter;
    for (let platform of this.platforms) {
      Matter.World.remove(this.engine.world, platform.body);
    }
    this.platforms = [];
  }
}