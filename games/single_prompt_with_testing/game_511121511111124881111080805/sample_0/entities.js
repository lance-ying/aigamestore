// entities.js - Entity classes for the game

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WALK_SPEED, SPRINT_SPEED, 
         MAX_STAMINA, STAMINA_DRAIN_RATE, STAMINA_REGEN_RATE, VILLAGER_PATROL_SPEED,
         VILLAGER_CHASE_SPEED, VILLAGER_DETECTION_RANGE, VILLAGER_CHASE_RANGE,
         VILLAGER_CATCH_RANGE, ITEM_TYPES, COLORS, TASK_DEFINITIONS } from './globals.js';
import { checkRectCollision, isPointInRect } from './physics.js';

// ============================================================================
// GOOSE PLAYER CLASS
// ============================================================================
export class Goose {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 25;
        this.radius = 15;
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.isSprinting = false;
        this.isMoving = false;
        
        // Stamina
        this.stamina = MAX_STAMINA;
        
        // Animation
        this.walkCycle = 0;
        this.neckAngle = 0;
        this.neckBob = 0;
        
        // Item carrying
        this.carrying = null;
        
        // State tracking
        this.lastPosition = { x: x, y: y };
        
        gameState.player = this;
        gameState.entities.push(this);
    }
    
    update(p, keys) {
        // Reset movement flags
        this.isMoving = false;
        this.vx = 0;
        this.vy = 0;
        
        // Check sprint key
        this.isSprinting = keys[16] === true; // Shift key
        
        // Determine speed
        let speed = WALK_SPEED;
        if (this.isSprinting && this.stamina > 0) {
            speed = SPRINT_SPEED;
            this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN_RATE);
        } else {
            // Regenerate stamina when not sprinting
            this.stamina = Math.min(MAX_STAMINA, this.stamina + STAMINA_REGEN_RATE);
        }
        
        // Movement input
        if (keys[37]) { // Left
            this.vx = -speed;
            this.facing = -1;
            this.isMoving = true;
        }
        if (keys[39]) { // Right
            this.vx = speed;
            this.facing = 1;
            this.isMoving = true;
        }
        if (keys[38]) { // Up
            this.vy = -speed;
            this.isMoving = true;
        }
        if (keys[40]) { // Down
            this.vy = speed;
            this.isMoving = true;
        }
        
        // Normalize diagonal movement
        if (this.vx !== 0 && this.vy !== 0) {
            const factor = 1 / Math.sqrt(2);
            this.vx *= factor;
            this.vy *= factor;
        }
        
        // Store old position for collision resolution
        const oldX = this.x;
        const oldY = this.y;
        
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // World bounds
        this.x = p.constrain(this.x, this.radius, gameState.worldWidth - this.radius);
        this.y = p.constrain(this.y, this.radius, gameState.worldHeight - this.radius);
        
        // Check collisions with obstacles
        const collided = this.checkObstacleCollisions();
        if (collided) {
            // Resolve collision by reverting position
            this.x = oldX;
            this.y = oldY;
        }
        
        // Update animation
        if (this.isMoving) {
            this.walkCycle += 0.3;
            this.neckBob = Math.sin(this.walkCycle) * 2;
        } else {
            this.neckBob *= 0.8; // Smooth decay
        }
        
        // Log position if moved significantly
        if (Math.abs(this.x - this.lastPosition.x) > 5 || 
            Math.abs(this.y - this.lastPosition.y) > 5) {
            this.logPosition(p);
            this.lastPosition.x = this.x;
            this.lastPosition.y = this.y;
        }
        
        // Check item pickup/drop
        if (keys[90]) { // Z key
            if (!this.zPressed) {
                this.zPressed = true;
                this.handleItemInteraction();
            }
        } else {
            this.zPressed = false;
        }
    }
    
    checkObstacleCollisions() {
        for (const obstacle of gameState.obstacles) {
            if (checkRectCollision(
                this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
            )) {
                return true;
            }
        }
        return false;
    }
    
    handleItemInteraction() {
        if (this.carrying) {
            // Drop the item
            this.dropItem();
        } else {
            // Try to pick up an item
            this.pickupItem();
        }
    }
    
    pickupItem() {
        for (const item of gameState.items) {
            if (!item.pickedUp && !item.isBeingCarried) {
                const dist = Math.sqrt(
                    Math.pow(this.x - item.x, 2) + 
                    Math.pow(this.y - item.y, 2)
                );
                
                if (dist < 30) {
                    this.carrying = item;
                    item.isBeingCarried = true;
                    item.pickedUp = true;
                    
                    // Alert the item's owner
                    if (item.owner) {
                        item.owner.alertToTheft(item);
                    }
                    break;
                }
            }
        }
    }
    
    dropItem() {
        if (this.carrying) {
            this.carrying.x = this.x;
            this.carrying.y = this.y;
            this.carrying.isBeingCarried = false;
            
            // Check if dropped at task target
            this.carrying.checkTaskCompletion();
            
            this.carrying = null;
        }
    }
    
    honk(p) {
        const currentTime = p.millis();
        if (currentTime - gameState.lastHonkTime > gameState.honkCooldown) {
            gameState.lastHonkTime = currentTime;
            
            // Create honk effect
            gameState.honkEffects.push(new HonkEffect(this.x, this.y));
            
            // Alert nearby villagers
            for (const villager of gameState.villagers) {
                const dist = Math.sqrt(
                    Math.pow(this.x - villager.x, 2) + 
                    Math.pow(this.y - villager.y, 2)
                );
                
                if (dist < 100) {
                    villager.startleFromHonk();
                }
            }
        }
    }
    
    logPosition(p) {
        if (p.logs && p.logs.player_info) {
            p.logs.player_info.push({
                screen_x: this.x,
                screen_y: this.y,
                game_x: this.x,
                game_y: this.y,
                carrying: this.carrying ? this.carrying.type : null,
                stamina: this.stamina,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    render(p) {
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - gameState.cameraY;
        
        p.push();
        p.translate(screenX, screenY);
        
        // Flip if facing left
        if (this.facing < 0) {
            p.scale(-1, 1);
        }
        
        // Draw body
        p.fill(...COLORS.GOOSE_WHITE);
        p.noStroke();
        p.ellipse(0, 0, 35, 25);
        
        // Draw neck
        p.push();
        p.translate(-10, this.neckBob);
        p.rotate(-0.3);
        p.fill(...COLORS.GOOSE_WHITE);
        p.rect(-3, -8, 6, 16);
        
        // Draw head
        p.translate(0, -12);
        p.ellipse(0, 0, 14, 12);
        
        // Draw beak
        p.fill(...COLORS.GOOSE_BEAK);
        p.beginShape();
        p.vertex(-7, 0);
        p.vertex(-12, -2);
        p.vertex(-12, 2);
        p.endShape(p.CLOSE);
        
        // Draw eye
        p.fill(...COLORS.GOOSE_EYE);
        p.circle(-2, -2, 3);
        
        p.pop();
        
        // Draw tail
        p.fill(...COLORS.GOOSE_WHITE);
        p.triangle(12, -3, 20, -5, 18, 3);
        
        // Draw legs (animated)
        const legOffset = Math.sin(this.walkCycle) * 3;
        p.stroke(...COLORS.GOOSE_BEAK);
        p.strokeWeight(2);
        p.line(-6, 10, -6, 14 + legOffset);
        p.line(2, 10, 2, 14 - legOffset);
        
        // Draw feet
        p.noStroke();
        p.fill(...COLORS.GOOSE_BEAK);
        p.ellipse(-6, 14 + legOffset, 6, 3);
        p.ellipse(2, 14 - legOffset, 6, 3);
        
        p.pop();
        
        // Draw stamina bar
        if (this.stamina < MAX_STAMINA) {
            const barWidth = 30;
            const barHeight = 4;
            const barX = screenX - barWidth / 2;
            const barY = screenY - 25;
            
            p.fill(100, 0, 0);
            p.rect(barX, barY, barWidth, barHeight);
            
            p.fill(0, 200, 0);
            p.rect(barX, barY, barWidth * (this.stamina / MAX_STAMINA), barHeight);
        }
    }
}

// ============================================================================
// VILLAGER CLASS
// ============================================================================
export class Villager {
    constructor(x, y, patrolPoints, ownedItem = null) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        this.radius = 15;
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        this.facing = 1;
        
        // Patrol behavior
        this.patrolPoints = patrolPoints;
        this.currentPatrolIndex = 0;
        this.patrolSpeed = VILLAGER_PATROL_SPEED;
        
        // State
        this.state = 'patrol'; // patrol, chase, returning
        this.alertLevel = 0; // 0 = calm, 1 = alert, 2 = chasing
        
        // Chase behavior
        this.chaseTarget = null;
        this.stolenItem = null;
        
        // Owned item
        this.ownedItem = ownedItem;
        if (ownedItem) {
            ownedItem.owner = this;
        }
        
        // Animation
        this.walkCycle = 0;
        this.armSwing = 0;
        
        // Appearance
        this.clothesColor = [
            COLORS.VILLAGER_CLOTHES_1,
            COLORS.VILLAGER_CLOTHES_2,
            COLORS.VILLAGER_CLOTHES_3
        ][Math.floor(Math.random() * 3)];
        
        gameState.villagers.push(this);
        gameState.entities.push(this);
    }
    
    update(p) {
        switch (this.state) {
            case 'patrol':
                this.updatePatrol();
                break;
            case 'chase':
                this.updateChase();
                break;
            case 'returning':
                this.updateReturning();
                break;
            case 'startled':
                this.updateStartled();
                break;
        }
        
        // Apply movement
        this.x += this.vx;
        this.y += this.vy;
        
        // Update facing based on velocity
        if (this.vx > 0.1) {
            this.facing = 1;
        } else if (this.vx < -0.1) {
            this.facing = -1;
        }
        
        // Update animation
        if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
            this.walkCycle += 0.2;
            this.armSwing = Math.sin(this.walkCycle) * 15;
        } else {
            this.armSwing *= 0.8;
        }
        
        // Decay alert level
        if (this.alertLevel > 0 && this.state === 'patrol') {
            this.alertLevel = Math.max(0, this.alertLevel - 0.01);
        }
    }
    
    updatePatrol() {
        if (!this.patrolPoints || this.patrolPoints.length === 0) return;
        
        const target = this.patrolPoints[this.currentPatrolIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 10) {
            // Reached patrol point, move to next
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            // Move towards patrol point
            this.vx = (dx / dist) * this.patrolSpeed;
            this.vy = (dy / dist) * this.patrolSpeed;
        }
        
        // Check if player has our item
        if (this.ownedItem && gameState.player.carrying === this.ownedItem) {
            this.alertToTheft(this.ownedItem);
        }
    }
    
    updateChase() {
        if (!gameState.player || !gameState.player.carrying) {
            // Lost the thief or they dropped the item
            this.state = 'returning';
            this.stolenItem = null;
            return;
        }
        
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > VILLAGER_CHASE_RANGE) {
            // Player escaped, give up
            this.state = 'returning';
            this.alertLevel = 1;
            this.stolenItem = null;
        } else if (dist < VILLAGER_CATCH_RANGE) {
            // Caught the goose!
            this.catchThief();
        } else {
            // Chase the player
            this.vx = (dx / dist) * VILLAGER_CHASE_SPEED;
            this.vy = (dy / dist) * VILLAGER_CHASE_SPEED;
        }
    }
    
    updateReturning() {
        // Return to patrol
        const target = this.patrolPoints[this.currentPatrolIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 10) {
            this.state = 'patrol';
            this.alertLevel = 0;
        } else {
            this.vx = (dx / dist) * this.patrolSpeed;
            this.vy = (dy / dist) * this.patrolSpeed;
        }
    }
    
    updateStartled() {
        // Startled animation - jump back
        this.startledTimer--;
        if (this.startledTimer <= 0) {
            this.state = 'patrol';
        }
        
        // Move away from goose
        if (gameState.player) {
            const dx = this.x - gameState.player.x;
            const dy = this.y - gameState.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                this.vx = (dx / dist) * 2;
                this.vy = (dy / dist) * 2;
            }
        }
    }
    
    alertToTheft(item) {
        this.state = 'chase';
        this.alertLevel = 2;
        this.stolenItem = item;
        this.chaseTarget = gameState.player;
    }
    
    catchThief() {
        // Recover the item
        if (gameState.player.carrying === this.stolenItem) {
            gameState.player.dropItem();
            
            // Return item to original position
            if (this.ownedItem) {
                this.ownedItem.returnToOriginal();
            }
        }
        
        this.state = 'returning';
        this.stolenItem = null;
    }
    
    startleFromHonk() {
        if (this.state === 'patrol') {
            this.state = 'startled';
            this.startledTimer = 30; // frames
            this.alertLevel = 1;
        }
    }
    
    render(p) {
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - gameState.cameraY;
        
        p.push();
        p.translate(screenX, screenY);
        
        // Flip if facing left
        if (this.facing < 0) {
            p.scale(-1, 1);
        }
        
        // Draw shadow
        p.fill(0, 0, 0, 50);
        p.ellipse(0, 18, 25, 8);
        
        // Draw legs
        const legOffset = Math.sin(this.walkCycle) * 4;
        p.fill(...COLORS.VILLAGER_CLOTHES_1);
        p.rect(-8, 5, 6, 12);
        p.rect(2, 5, 6, 12);
        
        // Draw shoes
        p.fill(60, 40, 20);
        p.ellipse(-5, 17 + legOffset * 0.5, 8, 4);
        p.ellipse(5, 17 - legOffset * 0.5, 8, 4);
        
        // Draw body
        p.fill(...this.clothesColor);
        p.rect(-10, -10, 20, 18, 3);
        
        // Draw arms (swinging)
        p.push();
        p.translate(-10, -5);
        p.rotate(this.armSwing * 0.01);
        p.fill(...COLORS.VILLAGER_SKIN);
        p.rect(0, 0, 4, 12);
        p.pop();
        
        p.push();
        p.translate(10, -5);
        p.rotate(-this.armSwing * 0.01);
        p.fill(...COLORS.VILLAGER_SKIN);
        p.rect(-4, 0, 4, 12);
        p.pop();
        
        // Draw head
        p.fill(...COLORS.VILLAGER_SKIN);
        p.circle(0, -15, 16);
        
        // Draw hair
        p.fill(...COLORS.VILLAGER_HAIR);
        p.arc(0, -15, 16, 16, p.PI, 0);
        
        // Draw eyes
        p.fill(255);
        p.circle(-4, -15, 4);
        p.circle(4, -15, 4);
        
        p.fill(0);
        const eyeOffset = this.state === 'chase' ? 2 : 0;
        p.circle(-4 + eyeOffset, -15, 2);
        p.circle(4 + eyeOffset, -15, 2);
        
        // Draw mouth based on state
        p.noFill();
        p.stroke(0);
        p.strokeWeight(1);
        if (this.state === 'chase') {
            p.arc(0, -12, 8, 8, 0, p.PI); // Angry frown
        } else if (this.state === 'startled') {
            p.circle(0, -11, 4); // Surprised O
        } else {
            p.arc(0, -12, 6, 4, 0, p.PI); // Neutral
        }
        
        p.pop();
        
        // Draw alert indicator
        if (this.alertLevel > 0) {
            p.push();
            p.fill(255, 200 - this.alertLevel * 100, 0, this.alertLevel * 255);
            p.noStroke();
            const exclamationY = screenY - 30 - Math.sin(gameState.frameCount * 0.1) * 3;
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(20);
            p.text('!', screenX, exclamationY);
            p.pop();
        }
    }
}

// ============================================================================
// ITEM CLASS
// ============================================================================
export class Item {
    constructor(x, y, type, taskId = null) {
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.originalY = y;
        this.type = type;
        this.taskId = taskId;
        
        this.width = 15;
        this.height = 15;
        this.radius = 10;
        
        // State
        this.pickedUp = false;
        this.isBeingCarried = false;
        this.owner = null;
        
        // Animation
        this.bobOffset = Math.random() * Math.PI * 2;
        
        gameState.items.push(this);
        gameState.entities.push(this);
    }
    
    update(p) {
        if (this.isBeingCarried && gameState.player && gameState.player.carrying === this) {
            // Follow player when carried
            this.x = gameState.player.x;
            this.y = gameState.player.y - 20;
        }
    }
    
    checkTaskCompletion() {
        if (!this.taskId) return;
        
        // Find the task
        for (const task of gameState.tasks) {
            if (task.id === this.taskId && !task.completed) {
                // Check if item is at target location
                const dist = Math.sqrt(
                    Math.pow(this.x - task.targetX, 2) + 
                    Math.pow(this.y - task.targetY, 2)
                );
                
                if (dist < 40) {
                    task.completed = true;
                    gameState.tasksCompleted++;
                    gameState.score += 100;
                    
                    // Create celebration particles
                    for (let i = 0; i < 20; i++) {
                        gameState.particles.push(new Particle(this.x, this.y, 'celebration'));
                    }
                    
                    // Check win condition
                    if (gameState.tasksCompleted >= gameState.totalTasks) {
                        gameState.gamePhase = "GAME_OVER_WIN";
                    }
                }
            }
        }
    }
    
    returnToOriginal() {
        this.x = this.originalX;
        this.y = this.originalY;
        this.pickedUp = false;
        this.isBeingCarried = false;
    }
    
    render(p) {
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - gameState.cameraY + Math.sin(gameState.frameCount * 0.05 + this.bobOffset) * 2;
        
        if (this.isBeingCarried) return; // Don't render separately if being carried
        
        p.push();
        p.translate(screenX, screenY);
        
        // Draw based on type
        switch (this.type) {
            case ITEM_TYPES.HAT:
                this.drawHat(p);
                break;
            case ITEM_TYPES.BELL:
                this.drawBell(p);
                break;
            case ITEM_TYPES.RADIO:
                this.drawRadio(p);
                break;
            case ITEM_TYPES.BASKET:
                this.drawBasket(p);
                break;
            case ITEM_TYPES.RAKE:
                this.drawRake(p);
                break;
            case ITEM_TYPES.KEYS:
                this.drawKeys(p);
                break;
            case ITEM_TYPES.GLASSES:
                this.drawGlasses(p);
                break;
            case ITEM_TYPES.THERMOS:
                this.drawThermos(p);
                break;
        }
        
        p.pop();
    }
    
    drawHat(p) {
        p.fill(...COLORS.ITEM_HAT);
        p.noStroke();
        p.ellipse(0, 5, 20, 6);
        p.rect(-8, -5, 16, 10);
        p.ellipse(0, -5, 16, 8);
    }
    
    drawBell(p) {
        p.fill(...COLORS.ITEM_METAL);
        p.stroke(0);
        p.strokeWeight(1);
        p.beginShape();
        p.vertex(-6, -8);
        p.vertex(6, -8);
        p.vertex(8, 5);
        p.vertex(-8, 5);
        p.endShape(p.CLOSE);
        p.circle(0, 8, 4);
    }
    
    drawRadio(p) {
        p.fill(80, 80, 80);
        p.rect(-10, -8, 20, 16, 2);
        p.fill(40, 40, 40);
        p.rect(-8, -6, 16, 8);
        p.fill(200);
        p.circle(-5, 5, 3);
        p.circle(5, 5, 3);
        p.stroke(150);
        p.line(-8, -12, -10, -15);
        p.line(8, -12, 10, -15);
    }
    
    drawBasket(p) {
        p.fill(...COLORS.ITEM_WOOD);
        p.stroke(120, 90, 60);
        p.strokeWeight(1);
        p.rect(-8, -6, 16, 12, 2);
        p.arc(0, -6, 12, 8, p.PI, 0);
        p.line(-6, -3, -6, 3);
        p.line(0, -3, 0, 3);
        p.line(6, -3, 6, 3);
    }
    
    drawRake(p) {
        p.stroke(...COLORS.ITEM_WOOD);
        p.strokeWeight(2);
        p.line(0, -15, 0, 8);
        p.strokeWeight(3);
        p.stroke(100);
        p.line(-8, 8, 8, 8);
        p.strokeWeight(1);
        for (let i = -6; i <= 6; i += 4) {
            p.line(i, 8, i, 12);
        }
    }
    
    drawKeys(p) {
        p.fill(...COLORS.ITEM_METAL);
        p.noStroke();
        p.circle(-5, 0, 8);
        p.circle(5, 0, 8);
        p.rect(-1, -2, 2, 12);
        p.rect(-6, -2, 2, 12);
        p.rect(-11, 10, 6, 2);
        p.rect(-1, 10, 6, 2);
    }
    
    drawGlasses(p) {
        p.noFill();
        p.stroke(60, 60, 60);
        p.strokeWeight(2);
        p.circle(-6, 0, 12);
        p.circle(6, 0, 12);
        p.line(0, 0, 0, 0);
    }
    
    drawThermos(p) {
        p.fill(180, 60, 60);
        p.noStroke();
        p.rect(-5, -10, 10, 18, 2);
        p.fill(150, 50, 50);
        p.rect(-5, -10, 10, 4);
        p.fill(220, 220, 220);
        p.rect(-4, -12, 8, 3);
    }
}

// ============================================================================
// OBSTACLE CLASS
// ============================================================================
export class Obstacle {
    constructor(x, y, width, height, type = 'fence') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        
        gameState.obstacles.push(this);
    }
    
    render(p) {
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - gameState.cameraY;
        
        p.push();
        
        switch (this.type) {
            case 'fence':
                this.drawFence(p, screenX, screenY);
                break;
            case 'building':
                this.drawBuilding(p, screenX, screenY);
                break;
            case 'hedge':
                this.drawHedge(p, screenX, screenY);
                break;
            case 'wall':
                this.drawWall(p, screenX, screenY);
                break;
        }
        
        p.pop();
    }
    
    drawFence(p, x, y) {
        p.fill(...COLORS.FENCE);
        p.noStroke();
        const posts = Math.ceil(this.width / 20);
        for (let i = 0; i <= posts; i++) {
            const postX = x + (i * this.width) / posts;
            p.rect(postX - 2, y, 4, this.height);
        }
        p.rect(x, y + this.height * 0.3, this.width, 4);
        p.rect(x, y + this.height * 0.7, this.width, 4);
    }
    
    drawBuilding(p, x, y) {
        // Building wall
        p.fill(...COLORS.BUILDING);
        p.stroke(0);
        p.strokeWeight(2);
        p.rect(x, y, this.width, this.height);
        
        // Windows
        p.fill(150, 200, 255);
        const windowSize = 15;
        const windowsX = Math.floor(this.width / 30);
        const windowsY = Math.floor(this.height / 30);
        for (let i = 0; i < windowsX; i++) {
            for (let j = 0; j < windowsY; j++) {
                p.rect(
                    x + 10 + i * 30,
                    y + 10 + j * 30,
                    windowSize,
                    windowSize
                );
            }
        }
    }
    
    drawHedge(p, x, y) {
        p.fill(60, 120, 50);
        p.noStroke();
        // Draw bumpy hedge
        const bumps = Math.ceil(this.width / 10);
        for (let i = 0; i < bumps; i++) {
            p.circle(x + i * 10, y + this.height / 2, this.height);
        }
    }
    
    drawWall(p, x, y) {
        p.fill(140, 130, 120);
        p.stroke(100, 90, 80);
        p.strokeWeight(1);
        p.rect(x, y, this.width, this.height);
        
        // Brick pattern
        const brickWidth = 20;
        const brickHeight = 8;
        for (let row = 0; row < this.height / brickHeight; row++) {
            for (let col = 0; col < this.width / brickWidth; col++) {
                const offset = (row % 2) * brickWidth / 2;
                p.line(
                    x + col * brickWidth + offset,
                    y + row * brickHeight,
                    x + col * brickWidth + offset,
                    y + (row + 1) * brickHeight
                );
            }
        }
    }
}

// ============================================================================
// PARTICLE CLASS
// ============================================================================
export class Particle {
    constructor(x, y, type = 'default') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4 - 2;
        this.lifetime = 60;
        this.age = 0;
        this.size = Math.random() * 4 + 2;
        
        if (type === 'celebration') {
            this.color = [
                [255, 200, 0],
                [255, 100, 200],
                [100, 200, 255],
                [100, 255, 100]
            ][Math.floor(Math.random() * 4)];
        } else {
            this.color = [200, 200, 200];
        }
        
        gameState.particles.push(this);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15; // Gravity
        this.vx *= 0.98; // Air resistance
        this.age++;
    }
    
    isDead() {
        return this.age >= this.lifetime;
    }
    
    render(p) {
        const alpha = 1 - (this.age / this.lifetime);
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - gameState.cameraY;
        
        p.fill(this.color[0], this.color[1], this.color[2], alpha * 255);
        p.noStroke();
        p.circle(screenX, screenY, this.size);
    }
}

// ============================================================================
// HONK EFFECT CLASS
// ============================================================================
export class HonkEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = 60;
        this.lifetime = 30;
        this.age = 0;
        
        gameState.honkEffects.push(this);
    }
    
    update() {
        this.age++;
        this.radius = p5.prototype.lerp(10, this.maxRadius, this.age / this.lifetime);
    }
    
    isDead() {
        return this.age >= this.lifetime;
    }
    
    render(p) {
        const alpha = 1 - (this.age / this.lifetime);
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - gameState.cameraY;
        
        p.noFill();
        p.stroke(255, 255, 0, alpha * 255);
        p.strokeWeight(3);
        p.circle(screenX, screenY, this.radius * 2);
        
        // Draw "HONK" text
        if (this.age < 15) {
            p.fill(255, 255, 0, alpha * 255);
            p.noStroke();
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            p.text('HONK!', screenX, screenY - 30);
        }
    }
}