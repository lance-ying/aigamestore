import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { resolveCircleRectCollision, checkCircleTriangleCollision } from './physics.js';
import { isKeyDown, KEYS } from './input.js';
import { createBurst } from './particles.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        // Physics properties
        this.radius = 20;
        this.baseRadius = 20;
        this.mass = 1;
        this.angle = 0; // For rolling animation
        
        // State
        this.state = 'NORMAL'; // NORMAL, INFLATED, DEFLATED
        this.onGround = false;
        
        // Visuals
        this.hairOffset = Math.random() * 100;
        this.color = { r: 0, g: 150, b: 200 };
    }

    update(p) {
        // 1. Input Handling & State determination
        let inputX = 0;
        let inflate = isKeyDown(KEYS.SPACE) || isKeyDown(KEYS.UP);
        let deflate = isKeyDown(KEYS.DOWN);
        let moveLeft = isKeyDown(KEYS.LEFT);
        let moveRight = isKeyDown(KEYS.RIGHT);

        if (moveLeft) inputX -= 1;
        if (moveRight) inputX += 1;

        // Update State
        if (inflate) {
            this.state = 'INFLATED';
            this.radius = p.lerp(this.radius, this.baseRadius * 1.3, 0.1);
        } else if (deflate) {
            this.state = 'DEFLATED';
            this.radius = p.lerp(this.radius, this.baseRadius * 0.8, 0.1);
        } else {
            this.state = 'NORMAL';
            this.radius = p.lerp(this.radius, this.baseRadius, 0.1);
        }

        // 2. Physics Constants based on State
        let gravity = gameState.gravity;
        let moveSpeed = 0.5;
        let maxSpeed = 8;
        let airResistance = 0.99;

        if (this.state === 'INFLATED') {
            gravity = 0.15; // Low gravity (float)
            moveSpeed = 0.2; // Harder to control in air
            airResistance = 0.95; // High drag
        } else if (this.state === 'DEFLATED') {
            gravity = 1.0; // Heavy
            moveSpeed = 0.3;
            maxSpeed = 12; // Fast fall
        }

        // 3. Apply Forces
        this.vx += inputX * moveSpeed;
        this.vy += gravity;

        // Apply Drag/Friction
        this.vx *= airResistance;
        this.vy *= airResistance;

        // Limit speed
        this.vx = p.constrain(this.vx, -maxSpeed, maxSpeed);
        
        // Rolling animation
        if (this.onGround) {
            this.angle += this.vx * 0.15;
        }

        // 4. Update Position
        this.x += this.vx;
        this.y += this.vy;

        // 5. Collision Detection
        this.onGround = false; // Reset, resolveCollision will set to true if floor hit
        
        // Collide with world bounds
        if (this.x < this.radius) { this.x = this.radius; this.vx *= -0.5; }
        if (this.x > gameState.worldWidth - this.radius) { this.x = gameState.worldWidth - this.radius; this.vx *= -0.5; }
        if (this.y > gameState.worldHeight + 200) { this.die(); return; } // Fell off world
        
        // Collide with platforms
        for (let platform of gameState.platforms) {
            if (platform.active) {
                resolveCircleRectCollision(this, platform);
            }
        }

        // Collide with closed doors
        for (let door of gameState.doors) {
            if (!door.isOpen) {
                resolveCircleRectCollision(this, door);
            }
        }

        // Collide with Hazards
        for (let hazard of gameState.hazards) {
            if (checkCircleTriangleCollision(this, hazard)) {
                this.die();
                return;
            }
        }

        // Collide with Coins
        for (let i = gameState.coins.length - 1; i >= 0; i--) {
            let coin = gameState.coins[i];
            let d = p.dist(this.x, this.y, coin.x, coin.y);
            if (d < this.radius + coin.radius) {
                coin.collect(p);
            }
        }

        // Collide with Switches
        for (let sw of gameState.switches) {
            let d = p.dist(this.x, this.y, sw.x, sw.y);
            if (d < this.radius + sw.radius) {
                sw.activate();
            }
        }

        // 6. Check Goal
        // Simple logic: if all coins collected, last door opens, or specific goal region
        // Here we just check if we hit the "Exit" region usually placed at end of level
        if (gameState.coinsCollectedInLevel >= gameState.totalCoinsInLevel) {
            // Check if player is near end of world or specific exit trigger
            // For simplicity, let's assume end of level is x > worldWidth - 100
            if (this.x > gameState.worldWidth - 100) {
                gameState.gamePhase = "LEVEL_COMPLETE";
            }
        }
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.angle);

        // Body color based on state
        let c = p.color(this.color.r, this.color.g, this.color.b);
        if (this.state === 'INFLATED') c = p.color(200, 100, 100);
        if (this.state === 'DEFLATED') c = p.color(100, 100, 200);
        
        p.fill(c);
        p.noStroke();
        p.circle(0, 0, this.radius * 2);

        // Render "Fur"
        p.stroke(p.red(c) - 30, p.green(c) - 30, p.blue(c) - 30);
        p.strokeWeight(1);
        let hairCount = 36;
        for (let i = 0; i < hairCount; i++) {
            let theta = (p.TWO_PI / hairCount) * i;
            let noiseVal = p.noise(i * 0.5, p.frameCount * 0.1);
            let r = this.radius + noiseVal * 5;
            let hx = p.cos(theta) * r;
            let hy = p.sin(theta) * r;
            p.line(p.cos(theta) * (this.radius * 0.5), p.sin(theta) * (this.radius * 0.5), hx, hy);
        }

        // Eyes
        p.fill(255);
        p.noStroke();
        p.ellipse(5, -5, 8, 8);
        p.ellipse(12, -5, 6, 6);
        p.fill(0);
        p.ellipse(6 + this.vx * 0.5, -5 + this.vy * 0.5, 3, 3);
        p.ellipse(13 + this.vx * 0.5, -5 + this.vy * 0.5, 2, 2);

        // Mustache
        p.noFill();
        p.stroke(255);
        p.strokeWeight(2);
        p.arc(0, 2, 20, 10, p.PI, 0);

        p.pop();
    }
}

export class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.active = true;
        this.friction = 0.85;
    }

    render(p) {
        if (!this.active) return;
        p.fill(60, 50, 40);
        p.stroke(100, 90, 80);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height, 5);
        
        // Texture
        p.noStroke();
        p.fill(80, 70, 60);
        for(let i=10; i<this.width; i+=20) {
            p.circle(this.x + i, this.y + 5, 3);
        }
    }
}

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.initialY = y;
        this.radius = 12;
        this.collected = false;
        this.timer = Math.random() * 10;
    }

    collect(p) {
        if (this.collected) return;
        this.collected = true;
        gameState.coinsCollectedInLevel++;
        gameState.score += 100;
        createBurst(p, this.x, this.y, [255, 215, 0], 10);
        
        // Remove from array
        const idx = gameState.coins.indexOf(this);
        if (idx > -1) gameState.coins.splice(idx, 1);
    }

    render(p) {
        this.timer += 0.05;
        this.y = this.initialY + Math.sin(this.timer) * 5;
        
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.timer);
        p.fill(255, 215, 0);
        p.stroke(200, 150, 0);
        p.strokeWeight(2);
        p.circle(0, 0, this.radius * 2);
        p.fill(200, 150, 0);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("$", 0, 0);
        p.pop();
    }
}

export class Hazard {
    constructor(x, y, w, h, type = "SPIKE") {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type;
        
        // For collision (Triangle)
        this.x1 = x + w/2; this.y1 = y; // Tip
        this.x2 = x; this.y2 = y + h; // Bottom left
        this.x3 = x + w; this.y3 = y + h; // Bottom right
    }

    render(p) {
        p.fill(150, 0, 0);
        p.stroke(100, 0, 0);
        p.triangle(this.x1, this.y1, this.x2, this.y2, this.x3, this.y3);
    }
}

export class Switch {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.pressed = false;
        this.radius = 15;
    }

    activate() {
        if (this.pressed) return;
        this.pressed = true;
        // Find linked door
        let door = gameState.doors.find(d => d.id === this.id);
        if (door) door.open();
    }

    render(p) {
        p.fill(this.pressed ? 0 : 200, this.pressed ? 200 : 0, 0);
        p.stroke(255);
        p.strokeWeight(2);
        // Draw base
        p.rect(this.x - 15, this.y, 30, 10);
        // Draw button
        let h = this.pressed ? 5 : 15;
        p.rect(this.x - 10, this.y - h, 20, h);
    }
}

export class Door {
    constructor(x, y, w, h, id) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.id = id;
        this.isOpen = false;
        this.openHeight = 0;
    }

    open() {
        this.isOpen = true;
    }

    render(p) {
        if (this.isOpen && this.openHeight < this.height) {
            this.openHeight += 2;
        }
        
        let drawH = this.height - this.openHeight;
        if (drawH <= 0) return;

        p.fill(100, 100, 120);
        p.stroke(200);
        p.rect(this.x, this.y, this.width, drawH);
        
        // Lock symbol
        if (!this.isOpen) {
            p.fill(200, 0, 0);
            p.noStroke();
            p.circle(this.x + this.width/2, this.y + this.height/2, 10);
        }
    }
}