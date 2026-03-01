import { gameState, MATERIALS, LEVEL_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Vec2 } from './physics.js';

export class Node {
    constructor(x, y, fixed = false) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.fixed = fixed;
        this.mass = fixed ? 0 : 1.0;
        this.radius = 4;
        this.joints = []; // Connected constraints
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.noStroke();
        if (this.fixed) {
            p.fill(200, 50, 50); // Red anchor
            p.rectMode(p.CENTER);
            p.rect(0, 0, 12, 12);
        } else {
            p.fill(255); // White joint
            p.circle(0, 0, this.radius * 2);
        }
        p.pop();
    }
}

export class Constraint {
    constructor(nodeA, nodeB, material) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.material = material;
        
        const matProps = MATERIALS[material];
        this.restLength = Math.sqrt((nodeA.x - nodeB.x)**2 + (nodeA.y - nodeB.y)**2);
        this.strength = matProps.strength;
        this.stiffness = matProps.stiffness || 1.0; // 1.0 is rigid, <1 is springy
        this.color = matProps.color;
        
        // For stress visualization
        this.currentStress = 0;
    }
    
    resolve() {
        const dx = this.nodeB.x - this.nodeA.x;
        const dy = this.nodeB.y - this.nodeA.y;
        const currentLen = Math.sqrt(dx*dx + dy*dy);
        
        if (currentLen === 0) return;
        
        // Calculate stress (deformation)
        const diff = (currentLen - this.restLength) / currentLen;
        
        this.currentStress = Math.abs((currentLen - this.restLength) / this.restLength) * 100; // purely visual metric scaling
        
        // Spring vs Rigid
        let scalar = diff * 0.5;
        if (this.material === "SPRING") {
            scalar *= this.stiffness;
        }
        
        const offsetX = dx * scalar;
        const offsetY = dy * scalar;
        
        if (!this.nodeA.fixed) {
            this.nodeA.x += offsetX;
            this.nodeA.y += offsetY;
        }
        if (!this.nodeB.fixed) {
            this.nodeB.x -= offsetX;
            this.nodeB.y -= offsetY;
        }
    }
    
    getStress() {
        const dx = this.nodeB.x - this.nodeA.x;
        const dy = this.nodeB.y - this.nodeA.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        // Stress is force / strength. Roughly proportional to stretch for rigid bodies.
        // We'll approximate stress as % deviation from rest length scaled by material factor
        const strain = Math.abs(dist - this.restLength);
        
        // This is a simplified stress model
        // Threshold is roughly 20% stretch for failure for normal mats
        // Steel stronger, Wood weaker.
        const maxStrain = this.strength * 0.2; 
        
        return strain / maxStrain; // > 1.0 means break
    }
    
    render(p) {
        p.push();
        
        // Color based on stress in simulation
        let c = p.color(this.color);
        if (gameState.subPhase === "SIMULATE") {
            const stress = Math.min(this.getStress(), 1.0);
            c = p.lerpColor(p.color(this.color), p.color(255, 0, 0), stress);
        }
        
        p.stroke(c);
        
        if (this.material === "ROAD") {
            p.strokeWeight(6);
            p.line(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y);
            p.stroke(255);
            p.strokeWeight(1);
            p.line(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y); // Lane marking
        } else if (this.material === "SPRING") {
            p.strokeWeight(2);
            // Draw zig zag
            this.drawZigZag(p, this.nodeA, this.nodeB);
        } else {
            // Wood/Steel
            p.strokeWeight(this.material === "STEEL" ? 4 : 3);
            p.line(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y);
        }
        p.pop();
    }
    
    drawZigZag(p, n1, n2) {
        const segs = 10;
        const dx = (n2.x - n1.x) / segs;
        const dy = (n2.y - n1.y) / segs;
        const nx = -(n2.y - n1.y) * 0.1; // Normal for amplitude
        const ny = (n2.x - n1.x) * 0.1;
        
        p.noFill();
        p.beginShape();
        p.vertex(n1.x, n1.y);
        for(let i=1; i<segs; i++) {
            let amp = (i % 2 === 0) ? 1 : -1;
            p.vertex(n1.x + dx*i + nx*amp, n1.y + dy*i + ny*amp);
        }
        p.vertex(n2.x, n2.y);
        p.endShape();
    }
}

export class Car {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 20;
        
        // Car Parts
        // Wheels
        this.wheels = [
            new Node(x - 15, y + 15),
            new Node(x + 15, y + 15)
        ];
        this.wheels.forEach(w => { w.radius = 8; w.mass = 5; });
        
        // Chassis (top body)
        this.chassis = [
            new Node(x - 15, y - 5),
            new Node(x + 15, y - 5)
        ];
        this.chassis.forEach(c => c.mass = 10);
        
        // Assemble all points
        this.nodes = [...this.wheels, ...this.chassis];
        
        // Internal Constraints (Rigid Body)
        this.constraints = [];
        const addRod = (n1, n2) => {
            this.constraints.push({
                n1, n2, 
                len: Math.sqrt((n1.x-n2.x)**2 + (n1.y-n2.y)**2)
            });
        };
        
        addRod(this.wheels[0], this.wheels[1]);
        addRod(this.chassis[0], this.chassis[1]);
        addRod(this.wheels[0], this.chassis[0]);
        addRod(this.wheels[1], this.chassis[1]);
        addRod(this.wheels[0], this.chassis[1]); // Cross bracing
        addRod(this.wheels[1], this.chassis[0]);
        
        this.speed = 1.5; // Motor speed - reduced for more realistic movement
        this.maxSpeed = 2.0; // Cap on speed
    }
    
    update() {
        // Only move car if BOTH wheels are properly grounded and stable
        const leftWheelGrounded = this.wheels[0].onGround;
        const rightWheelGrounded = this.wheels[1].onGround;
        
        // Check if car is relatively stable (not tilted too much)
        const wheelDist = Math.abs(this.wheels[0].y - this.wheels[1].y);
        const isStable = wheelDist < 15; // Allow some tilt but not too much
        
        // Only apply motor force if both wheels are grounded AND car is stable
        if (leftWheelGrounded && rightWheelGrounded && isStable) {
            // Apply speed to both wheels equally for smooth movement
            this.wheels.forEach(w => {
                // Calculate current velocity
                const vx = w.x - w.oldX;
                
                // Only accelerate if under max speed
                if (vx < this.maxSpeed) {
                    w.x += this.speed * 0.5; // Apply half to maintain verlet integration
                }
            });
        }
        
        // Calculate Center of Mass
        let sumX = 0, sumY = 0;
        this.nodes.forEach(n => { sumX += n.x; sumY += n.y; });
        this.x = sumX / this.nodes.length;
        this.y = sumY / this.nodes.length;
    }
    
    resolveConstraints() {
        // Maintain rigid body shape
        this.constraints.forEach(c => {
            const dx = c.n2.x - c.n1.x;
            const dy = c.n2.y - c.n1.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const diff = (dist - c.len) / dist;
            const ox = dx * diff * 0.5;
            const oy = dy * diff * 0.5;
            
            c.n1.x += ox;
            c.n1.y += oy;
            c.n2.x -= ox;
            c.n2.y -= oy;
        });
    }
    
    render(p) {
        // Draw Chassis
        p.push();
        p.fill(0, 100, 200);
        p.stroke(0);
        p.beginShape();
        p.vertex(this.chassis[0].x, this.chassis[0].y);
        p.vertex(this.chassis[1].x, this.chassis[1].y);
        p.vertex(this.wheels[1].x, this.wheels[1].y);
        p.vertex(this.wheels[0].x, this.wheels[0].y);
        p.endShape(p.CLOSE);
        
        // Draw Wheels
        p.fill(50);
        this.wheels.forEach(w => {
            p.circle(w.x, w.y, w.radius * 2);
            // Draw spoke to show rotation
            p.stroke(200);
            p.line(w.x, w.y, w.x + Math.cos(w.x * 0.1)*w.radius, w.y + Math.sin(w.x * 0.1)*w.radius);
        });
        p.pop();
    }
}