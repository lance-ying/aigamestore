import { GUEST_NEEDS, ROOM_STATES, gameState } from './globals.js';

export class Guest {
  constructor(p, x, y, need, patience) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.need = need;
    this.maxPatience = patience;
    this.patience = patience;
    this.waiting = true;
    this.beingServed = false;
    this.satisfied = false;
    this.size = 30;
    this.color = this.getColorForNeed(need);
    this.serviceStartTime = 0;
    this.serviceDuration = 0;
    this.assignedRoom = null;
    this.alpha = 0;
    this.fadeInSpeed = 10;
  }

  getColorForNeed(need) {
    switch(need) {
      case GUEST_NEEDS.CHECKIN: return [100, 150, 255];
      case GUEST_NEEDS.FOOD: return [255, 150, 100];
      case GUEST_NEEDS.CLEANING: return [150, 255, 150];
      default: return [200, 200, 200];
    }
  }

  update(deltaTime) {
    // Fade in animation
    if (this.alpha < 255) {
      this.alpha += this.fadeInSpeed;
      if (this.alpha > 255) this.alpha = 255;
    }

    if (this.waiting && !this.beingServed) {
      this.patience -= deltaTime;
      if (this.patience <= 0) {
        this.patience = 0;
        return 'dissatisfied';
      }
    }

    if (this.beingServed) {
      const elapsed = Date.now() - this.serviceStartTime;
      if (elapsed >= this.serviceDuration) {
        this.satisfied = true;
        this.waiting = false;
        return 'satisfied';
      }
    }

    return 'waiting';
  }

  startService(duration) {
    this.beingServed = true;
    this.serviceStartTime = Date.now();
    this.serviceDuration = duration;
  }

  draw() {
    const p = this.p;
    p.push();
    
    // Draw guest shape with fade in
    p.fill(...this.color, this.alpha);
    p.stroke(0, this.alpha);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size, this.size);
    
    // Draw face
    p.fill(255, this.alpha);
    p.noStroke();
    p.ellipse(this.x - 6, this.y - 4, 4, 4); // left eye
    p.ellipse(this.x + 6, this.y - 4, 4, 4); // right eye
    
    // Draw thought bubble if waiting
    if (this.waiting && !this.beingServed) {
      this.drawThoughtBubble();
    }
    
    // Draw patience bar
    if (this.waiting && !this.beingServed) {
      this.drawPatienceBar();
    }
    
    // Draw service progress if being served
    if (this.beingServed) {
      this.drawServiceProgress();
    }
    
    p.pop();
  }

  drawThoughtBubble() {
    const p = this.p;
    p.push();
    
    // Bubble
    p.fill(255, 255, 255, this.alpha * 0.9);
    p.stroke(0, this.alpha);
    p.strokeWeight(1);
    p.ellipse(this.x + 20, this.y - 25, 30, 30);
    p.ellipse(this.x + 15, this.y - 15, 10, 10);
    p.ellipse(this.x + 12, this.y - 10, 5, 5);
    
    // Icon based on need
    p.fill(0, this.alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    
    if (this.need === GUEST_NEEDS.CHECKIN) {
      p.text('🛏', this.x + 20, this.y - 25);
    } else if (this.need === GUEST_NEEDS.FOOD) {
      p.text('🍽', this.x + 20, this.y - 25);
    } else if (this.need === GUEST_NEEDS.CLEANING) {
      p.text('🧹', this.x + 20, this.y - 25);
    }
    
    p.pop();
  }

  drawPatienceBar() {
    const p = this.p;
    const barWidth = 40;
    const barHeight = 5;
    const x = this.x - barWidth / 2;
    const y = this.y + 20;
    
    p.push();
    
    // Background
    p.fill(60, this.alpha);
    p.noStroke();
    p.rect(x, y, barWidth, barHeight);
    
    // Patience fill
    const fillWidth = (this.patience / this.maxPatience) * barWidth;
    const patiencePercent = this.patience / this.maxPatience;
    
    if (patiencePercent > 0.5) {
      p.fill(100, 255, 100, this.alpha);
    } else if (patiencePercent > 0.25) {
      p.fill(255, 200, 0, this.alpha);
    } else {
      p.fill(255, 50, 50, this.alpha);
    }
    
    p.rect(x, y, fillWidth, barHeight);
    
    p.pop();
  }

  drawServiceProgress() {
    const p = this.p;
    const elapsed = Date.now() - this.serviceStartTime;
    const progress = Math.min(elapsed / this.serviceDuration, 1);
    
    const barWidth = 40;
    const barHeight = 5;
    const x = this.x - barWidth / 2;
    const y = this.y + 20;
    
    p.push();
    
    // Background
    p.fill(60, this.alpha);
    p.noStroke();
    p.rect(x, y, barWidth, barHeight);
    
    // Progress fill
    const fillWidth = progress * barWidth;
    p.fill(100, 200, 255, this.alpha);
    p.rect(x, y, fillWidth, barHeight);
    
    p.pop();
  }

  isPointInside(px, py) {
    const dist = this.p.dist(px, py, this.x, this.y);
    return dist < this.size / 2;
  }
}

export class Room {
  constructor(p, x, y, width, height, id) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.id = id;
    this.state = ROOM_STATES.EMPTY;
    this.guest = null;
    this.cleaningProgress = 0;
  }

  update(deltaTime) {
    if (this.state === ROOM_STATES.CLEANING) {
      // Cleaning handled by Monica staff member
    }
  }

  draw() {
    const p = this.p;
    p.push();
    
    // Room background
    let fillColor = [240, 230, 190];
    if (this.state === ROOM_STATES.OCCUPIED) {
      fillColor = [200, 220, 240];
    } else if (this.state === ROOM_STATES.DIRTY) {
      fillColor = [180, 170, 150];
    } else if (this.state === ROOM_STATES.CLEANING) {
      fillColor = [200, 240, 200];
    }
    
    p.fill(...fillColor);
    p.stroke(80);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Room number
    p.fill(80);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(10);
    p.text(this.id, this.x + 5, this.y + 5);
    
    // Room icon based on state
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    
    if (this.state === ROOM_STATES.EMPTY) {
      p.text('🛏', this.x + this.width / 2, this.y + this.height / 2);
    } else if (this.state === ROOM_STATES.OCCUPIED) {
      p.text('😊', this.x + this.width / 2, this.y + this.height / 2);
    } else if (this.state === ROOM_STATES.DIRTY) {
      p.text('💨', this.x + this.width / 2, this.y + this.height / 2);
    } else if (this.state === ROOM_STATES.CLEANING) {
      p.text('✨', this.x + this.width / 2, this.y + this.height / 2);
    }
    
    p.pop();
  }

  isPointInside(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }
}

export class Kitchen {
  constructor(p, x, y, width, height, stoves) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.stoves = stoves;
    this.busyStoves = 0;
    this.cookingGuests = [];
  }

  update(deltaTime) {
    // Update cooking progress
    for (let i = this.cookingGuests.length - 1; i >= 0; i--) {
      const guest = this.cookingGuests[i];
      if (guest.satisfied) {
        this.cookingGuests.splice(i, 1);
        this.busyStoves--;
      }
    }
  }

  canCook() {
    return this.busyStoves < this.stoves;
  }

  startCooking(guest) {
    if (this.canCook()) {
      this.cookingGuests.push(guest);
      this.busyStoves++;
      return true;
    }
    return false;
  }

  draw() {
    const p = this.p;
    p.push();
    
    // Kitchen background
    p.fill(150, 200, 150);
    p.stroke(80);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Kitchen label
    p.fill(80);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text('KITCHEN', this.x + this.width / 2, this.y + 5);
    
    // Draw stoves
    const stoveSize = 15;
    const spacing = 20;
    const startX = this.x + (this.width - (this.stoves * spacing)) / 2;
    
    for (let i = 0; i < this.stoves; i++) {
      const sx = startX + i * spacing;
      const sy = this.y + this.height / 2;
      
      if (i < this.busyStoves) {
        p.fill(255, 100, 50); // Active stove
      } else {
        p.fill(100, 100, 100); // Inactive stove
      }
      
      p.noStroke();
      p.rect(sx, sy, stoveSize, stoveSize);
      
      // Flame effect if busy
      if (i < this.busyStoves) {
        p.fill(255, 200, 0);
        p.triangle(sx + stoveSize/2, sy - 5, sx + 2, sy, sx + stoveSize - 2, sy);
      }
    }
    
    p.pop();
  }

  isPointInside(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }
}

export class Reception {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw() {
    const p = this.p;
    p.push();
    
    // Reception desk
    p.fill(100, 150, 200);
    p.stroke(80);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Bell icon
    p.fill(255, 215, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text('🔔', this.x + this.width / 2, this.y + this.height / 2);
    
    p.pop();
  }

  isPointInside(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }
}

export class Staff {
  constructor(p, x, y, name, icon) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.name = name;
    this.icon = icon;
    this.busy = false;
    this.size = 30;
    this.taskStartTime = 0;
    this.taskDuration = 0;
    this.assignedRoom = null;
  }

  update(deltaTime) {
    if (this.busy) {
      const elapsed = Date.now() - this.taskStartTime;
      if (elapsed >= this.taskDuration) {
        this.finishTask();
      }
    }
  }

  startTask(duration, room = null) {
    this.busy = true;
    this.taskStartTime = Date.now();
    this.taskDuration = duration;
    this.assignedRoom = room;
  }

  finishTask() {
    this.busy = false;
    if (this.assignedRoom) {
      this.assignedRoom.state = ROOM_STATES.EMPTY;
      this.assignedRoom = null;
    }
  }

  draw() {
    const p = this.p;
    p.push();
    
    // Staff background
    if (this.busy) {
      p.fill(255, 200, 100);
    } else {
      p.fill(200, 200, 200);
    }
    
    p.stroke(80);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size, this.size);
    
    // Staff icon
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(this.icon, this.x, this.y);
    
    // Name label
    p.textSize(10);
    p.fill(80);
    p.text(this.name, this.x, this.y + 25);
    
    // Progress bar if busy
    if (this.busy) {
      this.drawTaskProgress();
    }
    
    p.pop();
  }

  drawTaskProgress() {
    const p = this.p;
    const elapsed = Date.now() - this.taskStartTime;
    const progress = Math.min(elapsed / this.taskDuration, 1);
    
    const barWidth = 40;
    const barHeight = 5;
    const x = this.x - barWidth / 2;
    const y = this.y + 35;
    
    p.push();
    
    // Background
    p.fill(60);
    p.noStroke();
    p.rect(x, y, barWidth, barHeight);
    
    // Progress fill
    const fillWidth = progress * barWidth;
    p.fill(100, 200, 255);
    p.rect(x, y, fillWidth, barHeight);
    
    p.pop();
  }

  isPointInside(px, py) {
    const dist = this.p.dist(px, py, this.x, this.y);
    return dist < this.size / 2;
  }
}

export class FloatingText {
  constructor(p, x, y, text, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.startY = y;
    this.text = text;
    this.color = color;
    this.alpha = 255;
    this.lifetime = 1500;
    this.age = 0;
  }

  update(deltaTime) {
    this.age += deltaTime;
    this.y = this.startY - (this.age / this.lifetime) * 40;
    this.alpha = 255 * (1 - this.age / this.lifetime);
    return this.age >= this.lifetime;
  }

  draw() {
    const p = this.p;
    p.push();
    p.fill(...this.color, this.alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.textStyle(p.BOLD);
    p.text(this.text, this.x, this.y);
    p.pop();
  }
}