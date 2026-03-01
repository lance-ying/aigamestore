// Custom Impulse-based Physics Engine
import { Vec2, clamp, verticesToAxes, projectPolygon } from './math_utils.js';
import { gameState, GRAVITY, AIR_RESISTANCE, FRICTION, RESTITUTION, PHYSICS_SUBSTEPS } from './globals.js';

// --- Shape Definitions ---
export const SHAPE_TYPE = {
    BOX: 0,
    CIRCLE: 1
};

export class Shape {
    constructor(type, offsetX, offsetY) {
        this.type = type;
        this.offset = new Vec2(offsetX || 0, offsetY || 0); // Offset from body COM
    }
}

export class BoxShape extends Shape {
    constructor(width, height, offsetX, offsetY) {
        super(SHAPE_TYPE.BOX, offsetX, offsetY);
        this.width = width;
        this.height = height;
    }
    
    // Get vertices in world space
    getVertices(pos, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const hw = this.width / 2;
        const hh = this.height / 2;
        
        // Local corners
        const localVerts = [
            new Vec2(-hw, -hh),
            new Vec2(hw, -hh),
            new Vec2(hw, hh),
            new Vec2(-hw, hh)
        ];
        
        // Transform to world
        return localVerts.map(v => {
            // Apply rotation + offset rotation + position
            const rx = v.x + this.offset.x;
            const ry = v.y + this.offset.y;
            return new Vec2(
                pos.x + (rx * cos - ry * sin),
                pos.y + (rx * sin + ry * cos)
            );
        });
    }
}

export class CircleShape extends Shape {
    constructor(radius, offsetX, offsetY) {
        super(SHAPE_TYPE.CIRCLE, offsetX, offsetY);
        this.radius = radius;
    }
    
    getWorldCenter(pos, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec2(
            pos.x + (this.offset.x * cos - this.offset.y * sin),
            pos.y + (this.offset.x * sin + this.offset.y * cos)
        );
    }
}

// --- Rigid Body ---
let nextBodyId = 0;
export class Body {
    constructor(x, y, isStatic = false) {
        this.id = nextBodyId++;
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(0, 0);
        this.force = new Vec2(0, 0);
        
        this.angle = 0;
        this.angVel = 0;
        this.torque = 0;
        
        this.isStatic = isStatic;
        this.mass = 0;
        this.invMass = 0;
        this.inertia = 0;
        this.invInertia = 0;
        
        this.shapes = []; // Compound shapes
        this.restitution = RESTITUTION;
        this.friction = FRICTION;
        this.color = [255, 255, 255];
    }
    
    addShape(shape) {
        this.shapes.push(shape);
        this.recalculateMass();
    }
    
    recalculateMass() {
        if (this.isStatic) {
            this.mass = Infinity;
            this.invMass = 0;
            this.inertia = Infinity;
            this.invInertia = 0;
            return;
        }
        
        // Simplified mass calculation based on area
        let totalMass = 0;
        let totalInertia = 0;
        
        for (const s of this.shapes) {
            let m = 0;
            let i = 0;
            if (s.type === SHAPE_TYPE.BOX) {
                m = s.width * s.height * 0.01; // Density factor
                i = m * (s.width*s.width + s.height*s.height) / 12;
            } else {
                m = Math.PI * s.radius * s.radius * 0.01;
                i = m * s.radius * s.radius / 2;
            }
            
            // Parallel axis theorem for offset
            const distSq = s.offset.magSq();
            i += m * distSq;
            
            totalMass += m;
            totalInertia += i;
        }
        
        this.mass = totalMass;
        this.invMass = totalMass > 0 ? 1 / totalMass : 0;
        this.inertia = totalInertia;
        this.invInertia = totalInertia > 0 ? 1 / totalInertia : 0;
    }
    
    applyForce(f) {
        this.force = this.force.add(f);
    }
    
    integrate(dt) {
        if (this.isStatic) return;
        
        // Linear
        const acc = this.force.mult(this.invMass);
        acc.y += GRAVITY; // Apply gravity directly
        this.vel = this.vel.add(acc.mult(dt));
        this.vel = this.vel.mult(AIR_RESISTANCE);
        this.pos = this.pos.add(this.vel.mult(dt));
        
        // Angular
        const angAcc = this.torque * this.invInertia;
        this.angVel += angAcc * dt;
        this.angVel *= AIR_RESISTANCE;
        this.angle += this.angVel * dt;
        
        // Clear forces
        this.force = new Vec2(0, 0);
        this.torque = 0;
        
        // World bounds check (simple kill floor)
        if (this.pos.y > 1000) {
           // Mark for deletion or just let it fall forever
        }
    }
}

// --- Collision System ---

class Manifold {
    constructor(bodyA, bodyB, normal, depth, contact1, contact2, contactCount) {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.normal = normal; // From A to B
        this.depth = depth;
        this.contacts = [];
        if(contactCount > 0) this.contacts.push(contact1);
        if(contactCount > 1) this.contacts.push(contact2);
    }
}

// Check collision between two bodies
function checkCollision(bodyA, bodyB) {
    // Broadphase: AABB check could go here
    
    // Narrowphase: Check all shapes against all shapes
    for (const shapeA of bodyA.shapes) {
        for (const shapeB of bodyB.shapes) {
            let manifold = null;
            
            if (shapeA.type === SHAPE_TYPE.BOX && shapeB.type === SHAPE_TYPE.BOX) {
                manifold = checkPolygons(bodyA, shapeA, bodyB, shapeB);
            } else if (shapeA.type === SHAPE_TYPE.CIRCLE && shapeB.type === SHAPE_TYPE.CIRCLE) {
                manifold = checkCircles(bodyA, shapeA, bodyB, shapeB);
            } else if (shapeA.type === SHAPE_TYPE.BOX && shapeB.type === SHAPE_TYPE.CIRCLE) {
                manifold = checkPolygonCircle(bodyA, shapeA, bodyB, shapeB);
            } else if (shapeA.type === SHAPE_TYPE.CIRCLE && shapeB.type === SHAPE_TYPE.BOX) {
                manifold = checkPolygonCircle(bodyB, shapeB, bodyA, shapeA);
                if (manifold) manifold.normal = manifold.normal.mult(-1); // Flip normal
            }
            
            if (manifold) return manifold; // Just return the first collision for simplicity
        }
    }
    return null;
}

function checkCircles(bodyA, shapeA, bodyB, shapeB) {
    const centerA = shapeA.getWorldCenter(bodyA.pos, bodyA.angle);
    const centerB = shapeB.getWorldCenter(bodyB.pos, bodyB.angle);
    
    const diff = centerB.sub(centerA);
    const distSq = diff.magSq();
    const radiusSum = shapeA.radius + shapeB.radius;
    
    if (distSq >= radiusSum * radiusSum) return null;
    
    const dist = Math.sqrt(distSq);
    let normal;
    if (dist === 0) normal = new Vec2(0, 1);
    else normal = diff.div(dist);
    
    const depth = radiusSum - dist;
    const contact = centerA.add(normal.mult(shapeA.radius));
    
    return new Manifold(bodyA, bodyB, normal, depth, contact, null, 1);
}

function checkPolygons(bodyA, shapeA, bodyB, shapeB) {
    const vertsA = shapeA.getVertices(bodyA.pos, bodyA.angle);
    const vertsB = shapeB.getVertices(bodyB.pos, bodyB.angle);
    
    const axes = [...verticesToAxes(vertsA), ...verticesToAxes(vertsB)];
    let minOverlap = Infinity;
    let smallestAxis = null;
    
    for (const axis of axes) {
        const pA = projectPolygon(vertsA, axis);
        const pB = projectPolygon(vertsB, axis);
        
        if (pA.max < pB.min || pB.max < pA.min) return null; // Separated
        
        const overlap1 = pA.max - pB.min;
        const overlap2 = pB.max - pA.min;
        const overlap = Math.min(overlap1, overlap2);
        
        if (overlap < minOverlap) {
            minOverlap = overlap;
            smallestAxis = axis;
            // Ensure axis points from A to B
            const centerA = bodyA.pos;
            const centerB = bodyB.pos;
            const dir = centerB.sub(centerA);
            if (dir.dot(axis) < 0) {
                smallestAxis = axis.mult(-1);
            }
        }
    }
    
    // Simplification: Use center of overlap as contact point (not accurate but functional for game)
    // Finding exact contact points for Polygons is complex (Clipping). 
    // For this constraint, we approximate contact at the deepest vertex.
    
    let contactPoint = findDeepestPoint(vertsA, vertsB, smallestAxis);
    
    return new Manifold(bodyA, bodyB, smallestAxis, minOverlap, contactPoint, null, 1);
}

function findDeepestPoint(vertsA, vertsB, normal) {
    let minProj = Infinity;
    let deepest = new Vec2(0,0);
    // Find vertex in B that is most negative along normal (pointing from A to B)
    // Actually we want vertex in A that is furthest in direction of normal
    // OR vertex in B furthest in direction of -normal
    // Let's grab the vertex of B that is closest to A's center along the normal is wrong.
    // Standard: Find support point.
    
    // Simplification for stability: Average of all vertices of B inside A?
    // Let's just pick the vertex of B with the minimum projection along the normal
    const negNormal = normal.mult(-1);
    for (const v of vertsB) {
        const proj = v.dot(negNormal);
        if (proj < minProj) {
            minProj = proj;
            deepest = v;
        }
    }
    return deepest;
}

function checkPolygonCircle(bodyA, shapeA, bodyB, shapeB) {
    const vertsA = shapeA.getVertices(bodyA.pos, bodyA.angle);
    const centerB = shapeB.getWorldCenter(bodyB.pos, bodyB.angle);
    
    let minOverlap = Infinity;
    let normal = null;
    
    // Axes of polygon
    const axes = verticesToAxes(vertsA);
    // Axis from closest vertex to circle center
    let closestVert = null;
    let minDistSq = Infinity;
    
    for(const v of vertsA) {
        const d = v.sub(centerB).magSq();
        if(d < minDistSq) {
            minDistSq = d;
            closestVert = v;
        }
    }
    axes.push(closestVert.sub(centerB).normalize());
    
    for (const axis of axes) {
        // Project polygon
        const pA = projectPolygon(vertsA, axis);
        // Project circle
        const projC = centerB.dot(axis);
        const pB = { min: projC - shapeB.radius, max: projC + shapeB.radius };
        
        if (pA.max < pB.min || pB.max < pA.min) return null;
        
        const overlap1 = pA.max - pB.min;
        const overlap2 = pB.max - pA.min;
        const overlap = Math.min(overlap1, overlap2);
        
        if (overlap < minOverlap) {
            minOverlap = overlap;
            normal = axis;
            if (centerB.sub(bodyA.pos).dot(axis) < 0) {
                normal = axis.mult(-1);
            }
        }
    }
    
    const contact = centerB.sub(normal.mult(shapeB.radius));
    return new Manifold(bodyA, bodyB, normal, minOverlap, contact, null, 1);
}


function resolveCollision(m) {
    const a = m.bodyA;
    const b = m.bodyB;
    const normal = m.normal;
    const contact = m.contacts[0];
    
    // Relative velocity
    const ra = contact.sub(a.pos);
    const rb = contact.sub(b.pos);
    
    const raCrossN = ra.cross(normal);
    const rbCrossN = rb.cross(normal);
    
    const angVelA = a.angVel; // Scalar in 2D
    const angVelB = b.angVel;
    
    // V_rel = Vb + wb x rb - (Va + wa x ra)
    // Cross product in 2D: scalar x vector -> vector
    // w x r = (-w*r.y, w*r.x)
    const angLinVelA = new Vec2(-angVelA * ra.y, angVelA * ra.x);
    const angLinVelB = new Vec2(-angVelB * rb.y, angVelB * rb.x);
    
    const velA = a.vel.add(angLinVelA);
    const velB = b.vel.add(angLinVelB);
    const rv = velB.sub(velA);
    
    // Velocity along normal
    const contactVel = rv.dot(normal);
    
    // Do not resolve if velocities are separating
    if (contactVel > 0) return;
    
    // Impulse scalar
    const ran2 = raCrossN * raCrossN;
    const rbn2 = rbCrossN * rbCrossN;
    
    const invMassSum = a.invMass + b.invMass + (ran2 * a.invInertia) + (rbn2 * b.invInertia);
    if (invMassSum === 0) return;
    
    const e = Math.min(a.restitution, b.restitution);
    const j = -(1 + e) * contactVel / invMassSum;
    
    const impulse = normal.mult(j);
    
    // Apply impulse
    if (!a.isStatic) {
        a.vel = a.vel.sub(impulse.mult(a.invMass));
        a.angVel -= (ra.cross(impulse)) * a.invInertia;
    }
    if (!b.isStatic) {
        b.vel = b.vel.add(impulse.mult(b.invMass));
        b.angVel += (rb.cross(impulse)) * b.invInertia;
    }
    
    // Positional Correction (prevent sinking)
    const percent = 0.2; // Penetration percentage to correct
    const slop = 0.01; // Penetration allowance
    const correctionVal = Math.max(m.depth - slop, 0.0) / invMassSum * percent;
    const correction = normal.mult(correctionVal);
    
    if(!a.isStatic) a.pos = a.pos.sub(correction.mult(a.invMass));
    if(!b.isStatic) b.pos = b.pos.add(correction.mult(b.invMass));
}

export function updatePhysicsWorld(bodies, dt) {
    // 1. Integrate Forces
    for (const b of bodies) {
        b.integrate(dt);
    }
    
    // 2. Collision Detection & Resolution
    // Simple O(N^2) for now
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const A = bodies[i];
            const B = bodies[j];
            if (A.isStatic && B.isStatic) continue;
            
            const manifold = checkCollision(A, B);
            if (manifold) {
                resolveCollision(manifold);
            }
        }
    }
}