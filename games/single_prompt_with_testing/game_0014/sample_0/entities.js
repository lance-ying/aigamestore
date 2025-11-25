// entities.js
import { 
  PLAYER_SIZE, PLAYER_SPEED, PLAYER_SPRINT_SPEED, 
  PLAYER_MAX_HEALTH, PLAYER_MAX_STAMINA, PLAYER_MAX_ENERGY,
  STAMINA_DRAIN_RATE, STAMINA_REGEN_RATE, ENERGY_DRAIN_RATE, ENERGY_REGEN_RATE,
  WORLD_WIDTH, WORLD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.health = PLAYER_MAX_HEALTH;
    this.stamina = PLAYER_MAX_STAMINA;
    this.energy = PLAYER_MAX_ENERGY;
    this.vx = 0;
    this.vy = 0;
    this.isSprinting = false;
    this.isShielded = false;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.interactionCooldown = 0;
  }

  update() {
    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Keep player in bounds
    this.x = Math.max(this.size, Math.min(WORLD_WIDTH - this.size, this.x));
    this.y = Math.max(this.size, Math.min(WORLD_HEIGHT - this.size, this.y));

    // Stamina management
    if (this.isSprinting && (this.vx !== 0 || this.vy !== 0)) {
      this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN_RATE);
    } else {
      this.stamina = Math.min(PLAYER_MAX_STAMINA, this.stamina + STAMINA_REGEN_RATE);
    }

    // Energy management for shield
    if (this.isShielded) {
      this.energy = Math.max(0, this.energy - ENERGY_DRAIN_RATE);
      if (this.energy <= 0) {
        this.isShielded = false;
      }
    } else {
      this.energy = Math.min(PLAYER_MAX_ENERGY, this.energy + ENERGY_REGEN_RATE);
    }

    // Invulnerability timer
    if (this.invulnerable) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }

    // Interaction cooldown
    if (this.interactionCooldown > 0) {
      this.interactionCooldown--;
    }

    // Health regeneration when above 50%
    if (this.health > 50 && this.health < PLAYER_MAX_HEALTH) {
      this.health = Math.min(PLAYER_MAX_HEALTH, this.health + 0.05);
    }
  }

  move(dx, dy) {
    const speed = (this.isSprinting && this.stamina > 0) ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
    
    // Normalize diagonal movement
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude > 0) {
      this.vx = (dx / magnitude) * speed;
      this.vy = (dy / magnitude) * speed;
    } else {
      this.vx = 0;
      this.vy = 0;
    }
  }

  takeDamage(amount) {
    if (this.isShielded || this.invulnerable) {
      return false;
    }
    this.health = Math.max(0, this.health - amount);
    this.invulnerable = true;
    this.invulnerableTimer = 30; // 0.5 seconds of invulnerability
    return true;
  }

  draw(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    // Shield effect
    if (this.isShielded) {
      p.noFill();
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(3);
      p.circle(screenX, screenY, this.size * 3);
    }

    // Player body (invulnerability flicker)
    if (!this.invulnerable || Math.floor(p.frameCount / 5) % 2 === 0) {
      p.fill(255, 220, 100);
      p.stroke(200, 180, 80);
      p.strokeWeight(2);
      p.circle(screenX, screenY, this.size * 2);

      // Player face/direction indicator
      p.fill(50);
      p.noStroke();
      p.circle(screenX - 5, screenY - 3, 4);
      p.circle(screenX + 5, screenY - 3, 4);
      
      // Sprint indicator
      if (this.isSprinting && this.stamina > 0) {
        p.stroke(255, 100, 100);
        p.strokeWeight(2);
        p.noFill();
        p.arc(screenX, screenY, this.size * 2.5, this.size * 2.5, 0, p.PI);
      }
    }

    p.pop();
  }
}

export class MemoryFragment {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.size = 15;
    this.type = type; // "joy", "sorrow", "mystery"
    this.collected = false;
    this.pulseOffset = Math.random() * 1000;
    this.value = 1;
  }

  draw(p, camera) {
    if (this.collected) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    const pulse = Math.sin((p.frameCount + this.pulseOffset) * 0.05) * 3;

    p.push();
    p.noStroke();
    
    // Glow effect
    const colors = {
      joy: [255, 200, 50, 100],
      sorrow: [100, 150, 255, 100],
      mystery: [200, 100, 255, 100]
    };
    
    const color = colors[this.type] || [255, 255, 255, 100];
    p.fill(...color);
    p.circle(screenX, screenY, this.size * 2 + pulse);

    // Core
    p.fill(color[0], color[1], color[2], 255);
    p.circle(screenX, screenY, this.size + pulse / 2);

    // Inner sparkle
    p.fill(255, 255, 255, 200);
    p.circle(screenX - 3, screenY - 3, 5);

    p.pop();
  }
}

export class NPC {
  constructor(x, y, npcType) {
    this.x = x;
    this.y = y;
    this.size = 18;
    this.type = npcType; // "friendly", "wise", "troubled"
    this.hasInteracted = false;
    this.dialogue = this.getDialogue();
    this.color = this.getColor();
    this.animOffset = Math.random() * 1000;
  }

  getColor() {
    const colors = {
      friendly: [100, 255, 150],
      wise: [150, 200, 255],
      troubled: [255, 150, 100]
    };
    return colors[this.type] || [200, 200, 200];
  }

  getDialogue() {
    const dialogues = {
      friendly: ["Thank you for your kindness!", "You bring light to this world!", "Your compassion is felt."],
      wise: ["Memories shape our reality.", "The portal awaits the worthy.", "Choose your path wisely."],
      troubled: ["Help... please help me...", "I've lost my way...", "Can you spare a moment?"]
    };
    const options = dialogues[this.type] || ["Hello traveler."];
    return options[Math.floor(Math.random() * options.length)];
  }

  draw(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    const bob = Math.sin((p.frameCount + this.animOffset) * 0.03) * 2;

    p.push();
    
    // Body
    p.fill(...this.color);
    p.stroke(this.color[0] - 50, this.color[1] - 50, this.color[2] - 50);
    p.strokeWeight(2);
    p.circle(screenX, screenY + bob, this.size * 2);

    // Face
    p.fill(50);
    p.noStroke();
    p.circle(screenX - 5, screenY - 2 + bob, 3);
    p.circle(screenX + 5, screenY - 2 + bob, 3);

    // Interaction indicator
    if (!this.hasInteracted) {
      p.fill(255, 255, 255, 150);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("!", screenX, screenY - this.size * 2 + bob);
    }

    p.pop();
  }
}

export class Hostile {
  constructor(x, y, hostileType) {
    this.x = x;
    this.y = y;
    this.size = 16;
    this.type = hostileType; // "wanderer", "chaser", "guard"
    this.vx = 0;
    this.vy = 0;
    this.speed = this.getSpeed();
    this.damage = 10;
    this.detectionRange = this.getDetectionRange();
    this.attackCooldown = 0;
    this.color = this.getColor();
    this.animOffset = Math.random() * 1000;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
  }

  getSpeed() {
    const speeds = { wanderer: 1, chaser: 2, guard: 0.8 };
    return speeds[this.type] || 1;
  }

  getDetectionRange() {
    const ranges = { wanderer: 150, chaser: 250, guard: 180 };
    return ranges[this.type] || 200;
  }

  getColor() {
    const colors = {
      wanderer: [255, 100, 100],
      chaser: [255, 50, 150],
      guard: [180, 80, 80]
    };
    return colors[this.type] || [255, 0, 0];
  }

  update(player) {
    // Calculate distance to player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (this.type === "chaser" && distance < this.detectionRange) {
      // Chase player
      this.vx = (dx / distance) * this.speed;
      this.vy = (dy / distance) * this.speed;
    } else if (this.type === "wanderer") {
      // Wander behavior
      this.wanderTimer--;
      if (this.wanderTimer <= 0) {
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderTimer = 60 + Math.random() * 120;
      }
      this.vx = Math.cos(this.wanderAngle) * this.speed;
      this.vy = Math.sin(this.wanderAngle) * this.speed;
    } else if (this.type === "guard") {
      // Stay mostly in place, slight movement
      this.vx *= 0.95;
      this.vy *= 0.95;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Keep in bounds
    this.x = Math.max(this.size, Math.min(WORLD_WIDTH - this.size, this.x));
    this.y = Math.max(this.size, Math.min(WORLD_HEIGHT - this.size, this.y));

    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }

  draw(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    const spike = Math.sin((p.frameCount + this.animOffset) * 0.1) * 2;

    p.push();
    
    // Body with spikes
    p.fill(...this.color);
    p.stroke(this.color[0] - 50, this.color[1] - 30, this.color[2] - 30);
    p.strokeWeight(2);
    
    // Draw spiky shape
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = this.size + spike + (i % 2 === 0 ? 5 : 0);
      const px = screenX + Math.cos(angle) * radius;
      const py = screenY + Math.sin(angle) * radius;
      p.vertex(px, py);
    }
    p.endShape(p.CLOSE);

    // Evil eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(screenX - 5, screenY - 3, 4);
    p.circle(screenX + 5, screenY - 3, 4);

    p.pop();
  }
}

export class Portal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50;
    this.active = false;
  }

  draw(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    
    // Portal rings
    for (let i = 0; i < 3; i++) {
      const rotation = (p.frameCount * 0.02 * (i % 2 === 0 ? 1 : -1)) + i;
      const size = this.size + i * 20;
      const alpha = this.active ? 200 : 100;
      
      p.noFill();
      p.stroke(150 + i * 30, 100 + i * 50, 255, alpha);
      p.strokeWeight(3);
      
      p.push();
      p.translate(screenX, screenY);
      p.rotate(rotation);
      p.ellipse(0, 0, size, size * 0.7);
      p.pop();
    }

    // Center
    if (this.active) {
      p.fill(200, 150, 255, 150);
      p.noStroke();
      p.circle(screenX, screenY, this.size * 0.6);
    }

    // Status text
    if (!this.active) {
      p.fill(255, 255, 255, 150);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("Collect 10 Memories", screenX, screenY + this.size + 15);
    } else {
      p.fill(255, 255, 100, 200);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text("Enter (SPACE)", screenX, screenY + this.size + 15);
    }

    p.pop();
  }
}