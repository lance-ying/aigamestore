import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GROUND_HEIGHT,
  CHECKPOINT_INTERVAL
} from './globals.js';
import { Spike, Platform, Checkpoint, FinishLine } from './entities.js';

export class Level {
  constructor(levelLength) {
    this.length = levelLength;
    this.obstacles = [];
    this.checkpoints = [];
    this.finishLine = null;
  }

  generate(p) {
    // Clear any existing obstacles
    this.obstacles = [];
    this.checkpoints = [];
    
    // Generate a series of obstacles with increasing difficulty
    let x = CANVAS_WIDTH + 200; // Start a bit off-screen
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
    
    // Create initial empty space for the player to get ready
    x += 300;
    
    // Create checkpoints at regular intervals
    let checkpointId = 0;
    
    // Main level generation loop
    while (x < this.length) {
      // Add checkpoint if needed
      if (x % CHECKPOINT_INTERVAL < 100 && x > CANVAS_WIDTH + 500) {
        this.checkpoints.push(new Checkpoint(x, groundY - 100, checkpointId));
        checkpointId++;
        x += 200; // Add some space after checkpoint
        continue;
      }
      
      // Determine what to generate based on position in level (difficulty increases)
      const progress = x / this.length; // 0 to 1 indicating level progress
      
      // Random obstacle generation with difficulty scaling
      const rand = p.random();
      
      if (rand < 0.3) { // Single spike
        this.obstacles.push(new Spike(x, groundY - 15));
        x += 100 + p.random(-20, 20);
      } else if (rand < 0.5) { // Double spike
        this.obstacles.push(new Spike(x, groundY - 15));
        this.obstacles.push(new Spike(x + 40, groundY - 15));
        x += 150 + p.random(-10, 30);
      } else if (rand < 0.65) { // Triple spike (harder)
        this.obstacles.push(new Spike(x, groundY - 15));
        this.obstacles.push(new Spike(x + 40, groundY - 15));
        this.obstacles.push(new Spike(x + 80, groundY - 15));
        x += 200 + p.random(-10, 30);
      } else if (rand < 0.75) { // Platform
        const platformWidth = p.random(80, 150);
        const platformHeight = groundY - p.random(60, 120);
        this.obstacles.push(new Platform(x + platformWidth/2, platformHeight, platformWidth));
        
        // Maybe add spikes on the platform
        if (p.random() > 0.5 && progress > 0.3) {
          this.obstacles.push(new Spike(x + platformWidth/2, platformHeight - 15));
        }
        
        x += platformWidth + 100;
      } else if (rand < 0.85) { // Platform with gap
        const platformWidth = p.random(80, 150);
        const platformHeight = groundY - p.random(60, 120);
        this.obstacles.push(new Platform(x + platformWidth/2, platformHeight, platformWidth));
        
        // Add gap
        x += platformWidth + p.random(60, 120) * (1 + progress);
        
        // Add second platform
        const platform2Width = p.random(80, 150);
        this.obstacles.push(new Platform(x + platform2Width/2, platformHeight, platform2Width));
        
        x += platform2Width + 100;
      } else { // Spike series with varying spacing
        const count = Math.floor(p.random(3, 6 + progress * 4));
        const spacing = p.random(50, 80 - progress * 20);
        
        for (let i = 0; i < count; i++) {
          this.obstacles.push(new Spike(x + i * spacing, groundY - 15));
        }
        
        x += count * spacing + 100;
      }
      
      // Add random spacing between obstacle groups
      x += p.random(100, 200) * (1 - progress * 0.5); // Less space as level progresses
    }
    
    // Add finish line at the end
    this.finishLine = new FinishLine(this.length, groundY - 100);
    
    return this;
  }

  getAllEntities() {
    return [...this.obstacles, ...this.checkpoints, this.finishLine];
  }
  
  reset() {
    // Reset checkpoint states
    for (const checkpoint of this.checkpoints) {
      checkpoint.reached = false;
    }
  }
}