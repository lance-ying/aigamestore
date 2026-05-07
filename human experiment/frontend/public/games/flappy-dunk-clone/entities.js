import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, Composite, Vector } = Matter;
import { gameState, GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
    constructor(x, y) {
        this.radius = GAME_CONFIG.PLAYER_RADIUS;
        
        // Create physics body
        this.body = Bodies.circle(x, y, this.radius, {
            label: 'player',
            restitution: 0.6, // Bouncy
            friction: 0.001,
            frictionAir: 0.01,
            density: 0.002
        });

        this.color = [255, 100, 100]; // Reddish orange
        this.wingAngle = 0;
        this.trail = []; // Stores previous positions for trail effect
    }

    update() {
        // Constant forward movement
        // We override x velocity to keep constant speed, but allow Y physics to act naturally
        Body.setVelocity(this.body, {
            x: GAME_CONFIG.PLAYER_SPEED_X,
            y: this.body.velocity.y
        });

        // Limit falling speed
        if (this.body.velocity.y > 15) {
            Body.setVelocity(this.body, { x: this.body.velocity.x, y: 15 });
        }

        // Update trail
        if (gameState.frameCount % 3 === 0) {
            this.trail.push({ x: this.body.position.x, y: this.body.position.y });
            if (this.trail.length > 10) this.trail.shift();
        }
    }

    flap() {
        // Apply upward impulse
        Body.setVelocity(this.body, {
            x: this.body.velocity.x,
            y: -8 // Instant velocity change feels snappier for this genre than applyForce
        });
        
        // Wing animation trigger could go here
    }

    render(p) {
        const pos = this.body.position;
        
        // Draw Trail
        p.push();
        p.noStroke();
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = p.map(i, 0, this.trail.length, 0, 150);
            p.fill(255, 255, 255, alpha);
            p.circle(t.x, t.y, this.radius * (i / this.trail.length));
        }
        p.pop();

        // Draw Body
        p.push();
        p.translate(pos.x, pos.y);
        p.rotate(this.body.velocity.y * 0.1); // Tilt based on vertical speed

        // Ball skin
        p.fill(this.color);
        p.stroke(255);
        p.strokeWeight(2);
        p.circle(0, 0, this.radius * 2);

        // Decorative stripes for basketball look
        p.noFill();
        p.stroke(200, 50, 50);
        p.arc(0, 0, this.radius * 2, this.radius * 2, 0, p.PI);
        p.line(-this.radius, 0, this.radius, 0);

        // Wings
        this.drawWings(p);

        p.pop();
    }

    drawWings(p) {
        const wingFlap = p.sin(gameState.frameCount * 0.5) * 15;
        const yVelOffset = p.constrain(this.body.velocity.y * 2, -10, 10); // Wings react to velocity
        
        p.fill(255);
        p.noStroke();
        
        // Draw wings on both sides
        const sides = [1, -1];
        for (let dir of sides) {
            p.push();
            p.scale(dir, 1); // Mirror for left wing
            p.scale(0.6); // Make wings smaller
            
            p.beginShape();
            p.vertex(this.radius - 5, 0);
            p.bezierVertex(this.radius + 10, -10 - wingFlap + yVelOffset, this.radius + 20, -15 - wingFlap + yVelOffset, this.radius + 25, 0 + yVelOffset);
            p.bezierVertex(this.radius + 15, 10 + yVelOffset, this.radius + 5, 5, this.radius - 5, 5);
            p.endShape(p.CLOSE);
            p.pop();
        }
    }
}

export class Hoop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.triggered = false;
        
        const rimWidth = 10;
        const rimHeight = 10;
        const hoopRadius = GAME_CONFIG.HOOP_RADIUS; // Opening width

        // 1. Front Rim (Collision)
        this.frontRim = Bodies.circle(x - hoopRadius, y, 5, {
            isStatic: true,
            label: 'rim',
            friction: 0.5,
            render: { fillStyle: '#aaa' }
        });

        // 2. Back Rim (Collision)
        this.backRim = Bodies.circle(x + hoopRadius, y, 5, {
            isStatic: true,
            label: 'rim',
            friction: 0.5,
            render: { fillStyle: '#aaa' }
        });

        // 3. Sensor (Trigger) - positioned slightly below rims
        this.sensor = Bodies.rectangle(x, y + 10, hoopRadius * 1.5, 10, {
            isStatic: true,
            isSensor: true,
            label: 'hoopSensor'
        });
        
        // Backboard removed as per request

        this.bodies = [this.frontRim, this.backRim, this.sensor];
    }

    addToWorld(world) {
        Composite.add(world, this.bodies);
    }

    removeFromWorld(world) {
        Composite.remove(world, this.bodies);
    }

    render(p) {
        // Draw Net
        p.push();
        p.translate(this.x, this.y);
        
        // Net visual
        p.stroke(255, 255, 255, 150);
        p.strokeWeight(1);
        p.noFill();
        p.beginShape();
        p.vertex(-GAME_CONFIG.HOOP_RADIUS, 0);
        p.vertex(-GAME_CONFIG.HOOP_RADIUS + 10, 40); // Net hanging down
        p.vertex(GAME_CONFIG.HOOP_RADIUS - 10, 40);
        p.vertex(GAME_CONFIG.HOOP_RADIUS, 0);
        p.endShape();
        
        // Cross stitching on net
        p.line(-GAME_CONFIG.HOOP_RADIUS + 5, 20, GAME_CONFIG.HOOP_RADIUS - 5, 20);
        
        // Draw Rims
        p.fill(200, 50, 0); // Orange rim
        p.noStroke();
        p.circle(-GAME_CONFIG.HOOP_RADIUS, 0, 10);
        p.circle(GAME_CONFIG.HOOP_RADIUS, 0, 10);

        // Backboard rendering removed

        p.pop();
    }
}

export class Particle {
    constructor(x, y, color) {
        this.pos = Vector.create(x, y);
        this.vel = Vector.create((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
        this.color = color;
    }

    update() {
        this.pos = Vector.add(this.pos, this.vel);
        this.vel.y += 0.1; // gravity
        this.life -= this.decay;
    }

    render(p) {
        if (this.life <= 0) return;
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.pos.x, this.pos.y, 4);
    }
}