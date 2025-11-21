import { GRID_SIZE, DIRECTION, COMMAND_TYPES } from './globals.js';

export class Entity {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = gridY * GRID_SIZE + GRID_SIZE / 2;
    this.alive = true;
  }

  gridToScreen(gridPos) {
    return gridPos * GRID_SIZE + GRID_SIZE / 2;
  }

  screenToGrid(screenPos) {
    return Math.floor(screenPos / GRID_SIZE);
  }
}

export class Robot extends Entity {
  constructor(gridX, gridY, direction = DIRECTION.UP) {
    super(gridX, gridY);
    this.direction = direction;
    this.health = 3;
    this.commands = [];
    this.currentCommandIndex = 0;
    this.executionDelay = 0;
    this.animationProgress = 0;
    this.isExecuting = false;
    this.color = [100, 150, 255];
  }

  addCommand(commandType) {
    this.commands.push({ type: commandType, executed: false });
  }

  removeLastCommand() {
    if (this.commands.length > 0) {
      this.commands.pop();
    }
  }

  clearCommands() {
    this.commands = [];
    this.currentCommandIndex = 0;
    this.isExecuting = false;
    this.animationProgress = 0;
  }

  reset() {
    this.currentCommandIndex = 0;
    this.isExecuting = false;
    this.animationProgress = 0;
    this.executionDelay = 0;
    this.commands.forEach(cmd => cmd.executed = false);
  }

  executeNextCommand(enemies, gridCols, gridRows) {
    if (!this.alive || this.currentCommandIndex >= this.commands.length) {
      return false;
    }

    const command = this.commands[this.currentCommandIndex];
    
    if (command.executed) {
      return false;
    }

    if (this.executionDelay > 0) {
      this.executionDelay--;
      return true;
    }

    if (!this.isExecuting) {
      this.isExecuting = true;
      this.animationProgress = 0;
    }

    this.animationProgress += 0.1;

    if (this.animationProgress >= 1.0) {
      this.performCommand(command, enemies, gridCols, gridRows);
      command.executed = true;
      this.currentCommandIndex++;
      this.isExecuting = false;
      this.animationProgress = 0;
      this.executionDelay = 10;
    }

    return true;
  }

  performCommand(command, enemies, gridCols, gridRows) {
    switch (command.type) {
      case COMMAND_TYPES.MOVE_FORWARD:
        this.moveForward(gridCols, gridRows);
        break;
      case COMMAND_TYPES.TURN_LEFT:
        this.direction = (this.direction + 3) % 4;
        break;
      case COMMAND_TYPES.TURN_RIGHT:
        this.direction = (this.direction + 1) % 4;
        break;
      case COMMAND_TYPES.ATTACK:
        this.attackEnemies(enemies);
        break;
      case COMMAND_TYPES.WAIT:
        // Just wait, do nothing
        break;
    }
  }

  moveForward(gridCols, gridRows) {
    let newGridX = this.gridX;
    let newGridY = this.gridY;

    switch (this.direction) {
      case DIRECTION.UP:
        newGridY--;
        break;
      case DIRECTION.RIGHT:
        newGridX++;
        break;
      case DIRECTION.DOWN:
        newGridY++;
        break;
      case DIRECTION.LEFT:
        newGridX--;
        break;
    }

    if (newGridX >= 0 && newGridX < gridCols && newGridY >= 0 && newGridY < gridRows) {
      this.gridX = newGridX;
      this.gridY = newGridY;
      this.x = this.gridToScreen(this.gridX);
      this.y = this.gridToScreen(this.gridY);
    }
  }

  attackEnemies(enemies) {
    let targetX = this.gridX;
    let targetY = this.gridY;

    switch (this.direction) {
      case DIRECTION.UP:
        targetY--;
        break;
      case DIRECTION.RIGHT:
        targetX++;
        break;
      case DIRECTION.DOWN:
        targetY++;
        break;
      case DIRECTION.LEFT:
        targetX--;
        break;
    }

    enemies.forEach(enemy => {
      if (enemy.alive && enemy.gridX === targetX && enemy.gridY === targetY) {
        enemy.takeDamage(1);
      }
    });
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  update(p) {
    // Smooth position interpolation during animation
    if (this.isExecuting && this.animationProgress < 1.0) {
      const targetX = this.gridToScreen(this.gridX);
      const targetY = this.gridToScreen(this.gridY);
      this.x = p.lerp(this.x, targetX, 0.3);
      this.y = p.lerp(this.y, targetY, 0.3);
    }
  }

  draw(p) {
    if (!this.alive) return;

    p.push();
    p.translate(this.x, this.y);
    p.rotate((this.direction * Math.PI) / 2);

    // Robot body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(-12, -12, 24, 24, 3);

    // Direction indicator
    p.fill(255, 200, 100);
    p.triangle(0, -15, -6, -8, 6, -8);

    // Health indicator
    for (let i = 0; i < this.health; i++) {
      p.fill(0, 255, 0);
      p.noStroke();
      p.rect(-10 + i * 7, 8, 5, 3);
    }

    p.pop();
  }
}

export class Enemy extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY);
    this.health = 1;
    this.color = [255, 80, 80];
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  attackRobots(robots) {
    robots.forEach(robot => {
      if (robot.alive && Math.abs(robot.gridX - this.gridX) <= 1 && 
          Math.abs(robot.gridY - this.gridY) <= 1 &&
          !(robot.gridX === this.gridX && robot.gridY === this.gridY)) {
        robot.takeDamage(1);
      }
    });
  }

  draw(p) {
    if (!this.alive) return;

    p.push();
    p.translate(this.x, this.y);

    // Enemy body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    
    // Menacing shape
    p.beginShape();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const r = i % 2 === 0 ? 14 : 8;
      p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);

    // Eye
    p.fill(255, 255, 0);
    p.noStroke();
    p.ellipse(0, 0, 8, 8);
    p.fill(0);
    p.ellipse(0, 0, 4, 4);

    p.pop();
  }
}

export class Exit extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY);
    this.animationOffset = 0;
  }

  update(p) {
    this.animationOffset += 0.05;
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);

    // Animated portal effect
    for (let i = 0; i < 3; i++) {
      const size = 20 + i * 8 + Math.sin(this.animationOffset + i) * 3;
      const alpha = 255 - i * 60;
      p.fill(100, 255, 100, alpha);
      p.noStroke();
      p.ellipse(0, 0, size, size);
    }

    // Center
    p.fill(255);
    p.ellipse(0, 0, 8, 8);

    p.pop();
  }
}