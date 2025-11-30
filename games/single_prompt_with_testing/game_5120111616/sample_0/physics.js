import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, PHYSICS_SETTINGS } from './globals.js';

// Verlet Integration Physics Engine

export class PhysicsSystem {
    constructor() {
        this.gravity = new THREE.Vector3(0, PHYSICS_SETTINGS.GRAVITY, 0);
    }

    update(dt) {
        // Fixed timestep accumulator logic could go here, but for simplicity we use dt directly
        // usually passed as fixedTimeStep from game loop
        
        // 1. Update Nodes (Verlet)
        gameState.nodes.forEach(node => {
            if (node.isStatic) return;

            // F = ma => a = F/m (Assume mass = 1 for simplicity mostly)
            // Verlet: x(t+dt) = 2*x(t) - x(t-dt) + a*dt*dt
            
            const temp = node.position.clone();
            
            // Calculate velocity approximation
            const velocity = new THREE.Vector3().subVectors(node.position, node.oldPosition);
            velocity.multiplyScalar(PHYSICS_SETTINGS.DAMPING); // Friction/Air resistance
            
            // Apply Gravity
            const acceleration = this.gravity.clone();
            
            // Apply new position
            node.position.add(velocity);
            node.position.add(acceleration.multiplyScalar(dt * dt));
            
            node.oldPosition.copy(temp);
        });

        // 2. Apply Constraints (Links)
        // Multiple iterations for stability
        for (let i = 0; i < PHYSICS_SETTINGS.ITERATIONS; i++) {
            // Link Constraints
            gameState.links.forEach(link => {
                if (link.broken) return;
                this.solveLinkConstraint(link);
            });

            // Vehicle Constraints (Chassis shape, wheel attachment)
            if (gameState.vehicle) {
                gameState.vehicle.updateConstraints();
            }

            // Floor collision for nodes (simple ground plane at y = -10 if fell off)
            gameState.nodes.forEach(node => {
                if (node.position.y < -15) {
                    node.isStatic = true; // Stop processing if fell too far
                }
            });
        }
        
        // 3. Vehicle collisions with Roads
        if (gameState.vehicle) {
            this.handleVehicleRoadCollisions();
        }

        // 4. Calculate Stress
        this.calculateStress();
    }

    solveLinkConstraint(link) {
        const nodeA = link.nodeA;
        const nodeB = link.nodeB;
        
        const delta = new THREE.Vector3().subVectors(nodeB.position, nodeA.position);
        const currentLen = delta.length();
        
        if (currentLen === 0) return; // Prevent division by zero

        let diff;
        
        if (link.material.type === 'spring') {
            // Hooke's Law-ish for Verlet: just try to restore rest length but less rigidly?
            // Actually PolyBridge springs are just links that allow more stretching before breaking
            // But visually they compress/expand.
            // For stability, we'll treat them as softer constraints here by applying less correction
            const stiffness = 0.1; // Softer
            diff = (currentLen - link.length) / currentLen * stiffness;
        } else {
            // Rigid constraint
            diff = (currentLen - link.length) / currentLen;
        }

        const correction = delta.multiplyScalar(diff * 0.5); // Split correction between two nodes

        if (!nodeA.isStatic) {
            nodeA.position.add(correction);
        }
        if (!nodeB.isStatic) {
            nodeB.position.sub(correction);
        }
        
        // If one was static, apply double to the other? 
        // Standard Verlet box correction:
        if (nodeA.isStatic && !nodeB.isStatic) {
            nodeB.position.sub(correction); // Apply again to B to make up for A not moving
        } else if (!nodeA.isStatic && nodeB.isStatic) {
            nodeA.position.add(correction);
        }
    }

    handleVehicleRoadCollisions() {
        const vehicle = gameState.vehicle;
        if (!vehicle) return;

        // For each wheel
        vehicle.wheels.forEach(wheel => {
            let collided = false;
            
            // Check against all ROAD links
            gameState.links.forEach(link => {
                if (link.broken || link.material.type !== 'road') return;
                
                // Line segment AB
                const A = link.nodeA.position;
                const B = link.nodeB.position;
                const P = wheel.position;
                
                // Project P onto AB
                const AP = new THREE.Vector3().subVectors(P, A);
                const AB = new THREE.Vector3().subVectors(B, A);
                const ab2 = AB.lengthSq();
                const ap_dot_ab = AP.dot(AB);
                
                // Normalized distance t on line segment
                let t = ap_dot_ab / ab2;
                
                // Clamp t to segment
                // Extend slightly to prevent falling through cracks
                t = Math.max(0.0, Math.min(1.0, t));
                
                // Closest point on line
                const closest = new THREE.Vector3().copy(A).add(AB.multiplyScalar(t));
                
                const distVec = new THREE.Vector3().subVectors(P, closest);
                const dist = distVec.length();
                const radius = vehicle.wheelRadius;
                
                if (dist < radius) {
                    // Collision response
                    const penetration = radius - dist;
                    const normal = distVec.clone().normalize();
                    
                    // Move wheel out
                    wheel.position.add(normal.multiplyScalar(penetration));
                    
                    // Move road slightly (equal and opposite reaction) based on mass ratio?
                    // Road nodes are heavier/static-er usually, but let's push them a bit for realism stress
                    const force = normal.clone().multiplyScalar(-penetration * 0.5);
                    if (!link.nodeA.isStatic) link.nodeA.position.add(force.clone().multiplyScalar(1-t));
                    if (!link.nodeB.isStatic) link.nodeB.position.add(force.clone().multiplyScalar(t));
                    
                    // Friction / Driving Force
                    if (vehicle.enginePower > 0) {
                        // Tangent vector
                        const tangent = new THREE.Vector3(-normal.y, normal.x, 0).normalize();
                        // Assuming moving right
                        const moveDir = AB.clone().normalize();
                        if (moveDir.dot(new THREE.Vector3(1,0,0)) < 0) moveDir.negate();
                        
                        wheel.position.add(moveDir.multiplyScalar(vehicle.enginePower * 0.01));
                    }
                    
                    collided = true;
                }
            });
            wheel.onGround = collided;
        });
    }
    
    calculateStress() {
        gameState.links.forEach(link => {
            if (link.broken) return;
            
            const currentLen = link.nodeA.position.distanceTo(link.nodeB.position);
            const strain = Math.abs(currentLen - link.length) / link.length;
            
            link.stress = strain / (link.material.strength * 0.1); // Normalize stress
            
            // Break if too stressed
            // Max strain allowed before break. 
            // Road/Wood: ~10% stretch is instant break in simplified physics
            const maxStrain = 0.2 * link.material.strength; 
            
            if (strain > maxStrain) {
                this.breakLink(link);
            }
        });
    }
    
    breakLink(link) {
        link.broken = true;
        link.mesh.visible = false;
        // Optionally create particles
    }
}

export const physicsSystem = new PhysicsSystem();