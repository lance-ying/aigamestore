// player.js
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.speed = 3;
    this.direction = 'down';
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(p, keys, gamePhase) {
    if (gamePhase !== 'INVESTIGATION') return;
    
    let moving = false;
    
    if (keys[37]) { // Left
      this.x -= this.speed;
      this.direction = 'left';
      moving = true;
    }
    if (keys[39]) { // Right
      this.x += this.speed;
      this.direction = 'right';
      moving = true;
    }
    if (keys[38]) { // Up
      this.y -= this.speed;
      this.direction = 'up';
      moving = true;
    }
    if (keys[40]) { // Down
      this.y += this.speed;
      this.direction = 'down';
      moving = true;
    }

    // Constrain to canvas
    this.x = p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, CANVAS_HEIGHT - this.height / 2 - 30);

    // Animation
    if (moving) {
      this.animTimer++;
      if (this.animTimer > 10) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw character (anime-style detective)
    // Head
    p.fill(255, 220, 180);
    p.ellipse(0, -15, 20, 22);
    
    // Hair
    p.fill(60, 40, 30);
    p.arc(0, -18, 22, 20, p.PI, p.TWO_PI);
    p.triangle(-8, -15, -10, -25, -6, -20);
    p.triangle(8, -15, 10, -25, 6, -20);
    
    // Eyes
    p.fill(0);
    p.ellipse(-4, -15, 3, 4);
    p.ellipse(4, -15, 3, 4);
    
    // Body
    p.fill(40, 40, 80);
    p.rect(-8, -5, 16, 18, 2);
    
    // Arms
    const armOffset = p.sin(this.animFrame * 0.5) * 2;
    p.fill(255, 220, 180);
    p.ellipse(-10, 0 + armOffset, 6, 12);
    p.ellipse(10, 0 - armOffset, 6, 12);
    
    // Legs
    const legOffset = p.sin(this.animFrame) * 3;
    p.fill(30, 30, 50);
    p.rect(-6, 13, 5, 12 + legOffset, 2);
    p.rect(1, 13, 5, 12 - legOffset, 2);
    
    p.pop();
  }

  getScreenPos() {
    return { screen_x: this.x, screen_y: this.y };
  }

  getGamePos() {
    return { game_x: this.x, game_y: this.y };
  }
}