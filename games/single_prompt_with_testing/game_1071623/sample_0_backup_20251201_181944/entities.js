import { gameState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { checkRectCollision, checkCircleRectCollision, checkCircleCollision } from './physics.js';
import { isKeyPressed, INPUT } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
    }
}

export class Particle extends Entity {
    constructor(x, y, color, speed, life) {
        super(x, y, 4, 4);
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.w = Math.max(0, (this.life / this.maxLife) * 5);
        if (this.life <= 0) this.markedForDeletion = true;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], (this.life / this.maxLife) * 255);
        p.rect(this.x, this.y, this.w, this.w);
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.speed = 0.5;
        this.maxSpeed = 6;
        this.jumpForce = -11;
        this.dashSpeed = 15;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        
        this.onGround = false;
        this.onWall = false; // -1 left, 1 right, 0 no
        this.isDead = false;
        this.facing = 1;
        
        this.state = "IDLE"; // IDLE, RUN, JUMP, WALL_SLIDE, DASH
    }

    update(p) {
        if (this.isDead) return;

        // Input handling
        let left = false;
        let right = false;
        let up = false;
        let down = false;
        let jump = false;
        let dash = false;
        let sprint = false;

        // Check for automated testing input override
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.left) left = true;
                if (action.right) right = true;
                if (action.up) up = true;
                if (action.down) down = true;
                if (action.jump) jump = true;
                if (action.dash) dash = true;
            }
        } else {
            left = isKeyPressed(INPUT.LEFT);
            right = isKeyPressed(INPUT.RIGHT);
            up = isKeyPressed(INPUT.UP);
            down = isKeyPressed(INPUT.DOWN);
            jump = isKeyPressed(INPUT.SPACE);
            dash = isKeyPressed(INPUT.Z);
            sprint = isKeyPressed(INPUT.SHIFT);
        }

        // Movement Physics
        if (this.dashTimer > 0) {
            this.dashTimer--;
            this.vy = 0; // Anti-gravity during dash
            this.vx = this.facing * this.dashSpeed;
            // Spawn dash particles
            if (p.frameCount % 2 === 0) {
                gameState.particles.push(new Particle(this.x + this.w/2, this.y + this.h/2, [255, 255, 255], 5, 20));
            }
        } else {
            // Normal Movement
            let acc = this.speed * (sprint ? 1.5 : 1);
            if (!this.onGround) acc *= 0.5; // Less control in air

            if (left) {
                this.vx -= acc;
                this.facing = -1;
            }
            if (right) {
                this.vx += acc;
                this.facing = 1;
            }

            // Friction
            this.vx *= this.onGround ? gameState.friction : gameState.airResistance;

            // Gravity
            if (this.onWall && this.vy > 0 && !this.onGround) {
                this.vy += gameState.gravity * 0.3; // Wall slide friction
                if (this.vy > 3) this.vy = 3;
            } else {
                this.vy += gameState.gravity;
            }
            
            // Fast fall
            if (down && !this.onGround) {
                this.vy += 0.5;
            }

            // Cap velocity
            const cap = sprint ? this.maxSpeed * 1.5 : this.maxSpeed;
            this.vx = Math.max(-cap, Math.min(cap, this.vx));
            this.vy = Math.min(20, this.vy); // Terminal velocity

            // Jump
            if (jump) {
                if (this.onGround) {
                    this.vy = this.jumpForce;
                    this.onGround = false;
                    this.spawnDust(p);
                } else if (this.onWall) {
                    // Wall jump
                    this.vy = this.jumpForce;
                    this.vx = -this.onWall * 8; // Kick off wall
                    this.onWall = 0;
                    this.spawnDust(p);
                }
            }

            // Dash
            if (dash && this.dashCooldown <= 0) {
                this.dashTimer = 10;
                this.dashCooldown = 40;
                // Dash sound visual
                gameState.shake = 5;
            }
            if (this.dashCooldown > 0) this.dashCooldown--;
        }

        // Update Position X
        this.x += this.vx;
        this.handleCollisions(true);

        // Update Position Y
        this.y += this.vy;
        this.onGround = false;
        this.handleCollisions(false);

        // Check Hazards
        this.checkHazards();

        // Check Goal
        if (gameState.goal && checkRectCollision(this, gameState.goal)) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }

        // Leave trail
        if (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1) {
            if (Math.random() > 0.8) {
                gameState.particles.push(new Particle(this.x + this.w/2, this.y + this.h, COLORS.blood, 1, 60));
            }
        }
        
        // Log player info
        if(p.frameCount % 5 === 0) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                state: this.state,
                frame: p.frameCount
            });
        }
    }

    handleCollisions(horizontal) {
        // Reset wall state before checking
        if (horizontal) this.onWall = 0;

        for (let platform of gameState.platforms) {
            if (checkRectCollision(this, platform)) {
                if (horizontal) {
                    if (this.vx > 0) {
                        this.x = platform.x - this.w;
                        this.onWall = 1; // Right wall
                    } else if (this.vx < 0) {
                        this.x = platform.x + platform.w;
                        this.onWall = -1; // Left wall
                    }
                    this.vx = 0;
                    // Cancel dash on wall hit
                    this.dashTimer = 0;
                } else {
                    if (this.vy > 0) { // Landing
                        this.y = platform.y - this.h;
                        this.onGround = true;
                        this.vy = 0;
                    } else if (this.vy < 0) { // Ceiling
                        this.y = platform.y + platform.h;
                        this.vy = 0;
                    }
                }
            }
        }

        // World Bounds
        if (this.y > gameState.worldHeight + 100) {
            this.die();
        }
    }

    checkHazards() {
        // Check Sawblades
        for (let hazard of gameState.hazards) {
            let hit = false;
            if (hazard.type === 'SAW') {
                // Circle collision
                let cx = hazard.x;
                let cy = hazard.y;
                // Simple box to circle check
                // Closest point
                let testX = cx;
                let testY = cy;
                if (cx < this.x) testX = this.x;
                else if (cx > this.x + this.w) testX = this.x + this.w;
                if (cy < this.y) testY = this.y;
                else if (cy > this.y + this.h) testY = this.y + this.h;
                
                let dist = Math.sqrt(Math.pow(cx - testX, 2) + Math.pow(cy - testY, 2));
                if (dist < hazard.r) hit = true;
            }

            if (hit) {
                if (this.dashTimer > 0) {
                    // Dash doesn't destroy sawblades, only enemies.
                    // But maybe allow phasing through? No, SMB logic: sawblade = death.
                    this.die();
                } else {
                    this.die();
                }
            }
        }

        // Check Enemies
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            let enemy = gameState.enemies[i];
            if (checkRectCollision(this, enemy)) {
                if (this.dashTimer > 0) {
                    // Kill enemy
                    enemy.die();
                    gameState.score += 100;
                    gameState.shake = 10;
                    // Tiny bounce
                    this.vy = -5;
                } else {
                    this.die();
                }
            }
        }
    }

    spawnDust(p) {
        for(let i=0; i<5; i++) {
            gameState.particles.push(new Particle(this.x + this.w/2, this.y + this.h, [200, 200, 200], 2, 20));
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        gameState.deaths++;
        gameState.gamePhase = "GAME_OVER_LOSE";
        
        // Explosion of meat
        for(let i=0; i<20; i++) {
            gameState.particles.push(new Particle(this.x + this.w/2, this.y + this.h/2, COLORS.meat, 10, 100));
        }
    }

    render(p) {
        if (this.isDead) return;

        p.push();
        p.translate(this.x + this.w/2, this.y + this.h/2);
        
        // Squash and stretch
        let stretchX = 1;
        let stretchY = 1;
        if (Math.abs(this.vy) > 1) {
            stretchX = 0.8;
            stretchY = 1.2;
        } else if (Math.abs(this.vx) > 1) {
            stretchX = 1.1;
            stretchY = 0.9;
        }
        
        // Dash distortion
        if (this.dashTimer > 0) {
            stretchX = 1.5;
            stretchY = 0.6;
        }

        p.scale(stretchX * this.facing, stretchY);

        // Body
        p.fill(COLORS.meat);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.w, this.h, 4);

        // Face
        p.fill(255);
        p.ellipse(4, -2, 8, 8); // Right eye
        p.ellipse(-4, -2, 8, 8); // Left eye
        
        p.fill(0);
        p.ellipse(4 + (this.vx * 0.1), -2, 3, 3);
        p.ellipse(-4 + (this.vx * 0.1), -2, 3, 3);

        // Mouth
        p.noFill();
        p.stroke(50, 0, 0);
        p.strokeWeight(1);
        if (this.dashTimer > 0) {
            p.rect(0, 5, 8, 4); // Gritting teeth
        } else {
            p.arc(0, 4, 8, 5, 0, p.PI);
        }

        p.pop();
    }
}

export class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    render(p) {
        p.fill(COLORS.platform);
        p.noStroke();
        // Texture
        p.rect(this.x, this.y, this.w, this.h);
        
        // Highlight
        p.fill(COLORS.platform[0] + 20, COLORS.platform[1] + 20, COLORS.platform[2] + 20);
        p.rect(this.x, this.y, this.w, 4);
    }
}

export class Sawblade {
    constructor(x, y, r) {
        this.x = x;
        this.y = y; // Center
        this.r = r;
        this.type = 'SAW';
        this.angle = 0;
    }

    update() {
        this.angle += 0.2;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.angle);
        p.fill(COLORS.hazard);
        p.noStroke();
        p.ellipse(0, 0, this.r * 2);
        
        // Teeth
        p.fill(100);
        let teeth = 8;
        for (let i = 0; i < teeth; i++) {
            p.push();
            p.rotate((p.TWO_PI / teeth) * i);
            p.triangle(-5, -this.r, 5, -this.r, 0, -this.r - 10);
            p.pop();
        }
        
        // Center bolt
        p.fill(200);
        p.ellipse(0, 0, 10);
        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 25, 25);
        this.startX = x;
        this.patrolDist = 100;
        this.speed = 1;
        this.dir = 1;
        this.color = COLORS.enemy;
    }

    update() {
        this.x += this.speed * this.dir;
        if (Math.abs(this.x - this.startX) > this.patrolDist) {
            this.dir *= -1;
        }
        
        // Simple gravity in case placed in air
        this.vy += gameState.gravity;
        this.y += this.vy;
        
        // Platform collision
        let grounded = false;
        for (let platform of gameState.platforms) {
            if (checkRectCollision(this, platform)) {
                if (this.vy > 0) {
                    this.y = platform.y - this.h;
                    this.vy = 0;
                    grounded = true;
                }
            }
        }
    }

    die() {
        this.markedForDeletion = true;
        // Particles
        for(let i=0; i<10; i++) {
            gameState.particles.push(new Particle(this.x + this.w/2, this.y + this.h/2, [0, 0, 0], 5, 40));
        }
    }

    render(p) {
        p.fill(this.color);
        p.rect(this.x, this.y, this.w, this.h);
        // Evil eyes
        p.fill(255);
        p.rect(this.x + 4, this.y + 6, 6, 6);
        p.rect(this.x + 14, this.y + 6, 6, 6);
    }
}

export class Goal extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
    }

    render(p) {
        p.fill(COLORS.bandage);
        p.rect(this.x, this.y, this.w, this.h);
        // Smile
        p.fill(0);
        p.ellipse(this.x + 10, this.y + 10, 4);
        p.ellipse(this.x + 20, this.y + 10, 4);
        p.noFill();
        p.stroke(0);
        p.arc(this.x + 15, this.y + 20, 10, 5, 0, p.PI);
        
        // Help text
        p.noStroke();
        p.fill(255);
        p.textAlign(p.CENTER);
        p.textSize(10);
        p.text("HELP!", this.x + 15, this.y - 10 + Math.sin(p.frameCount * 0.1) * 5);
    }
}