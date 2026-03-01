/**
 * Game entities: Player, Tunnel Segments, Obstacles.
 */
import { 
    gameState, 
    COLORS, 
    TUNNEL_RADIUS, 
    OCTAGON_SIDES, 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT,
    logGameEvent
} from './globals.js';
import { project3D, getOctagonVertices, normalizeAngle } from './math_utils.js';

// ----- PLAYER -----
export class Player {
    constructor() {
        this.width = 30;
        this.height = 30;
        this.isTop = false; // false = floor (bottom), true = ceiling (top)
        this.flipProgress = 0; // 0 to 1 for animation
        this.isFlipping = false;
        
        // 2D projected collision polygon
        this.collisionPoly = [];
        
        // Visuals
        this.color = [...COLORS.PLAYER];
    }

    flip() {
        if (!this.isFlipping) {
            this.isFlipping = true;
            this.isTop = !this.isTop;
            // Animation handled in update
        }
    }

    update() {
        // Handle flip animation
        if (this.isFlipping) {
            this.flipProgress += 0.1;
            if (this.flipProgress >= 1) {
                this.flipProgress = 0;
                this.isFlipping = false;
            }
        }
    }

    render(p) {
        // Calculate position based on flip state
        const playerZ = 50;
        const radius = TUNNEL_RADIUS - 30; // Slightly inside the walls
        
        // Interpolate Y position for smooth flip
        let worldY = radius;
        if (this.isTop) worldY = -radius;
        if (this.isFlipping) {
             // Lerp between radius and -radius
             const startY = this.isTop ? radius : -radius;
             const endY = this.isTop ? -radius : radius;
             worldY = startY + (endY - startY) * this.flipProgress;
        }

        // Define 3D Ship Vertices in Local Space
        // Ship pointing forward (Z+) and up/down based on position
        // Local Origin is the center of the ship
        
        const size = 15;
        const length = 30;
        
        // Vertices: Nose, TailLeft, TailRight, Cockpit
        // Nose is further into the tunnel (higher Z)
        // We want the ship to point "Up" towards the center of the tunnel visually.
        // In local space, if Y is Down, -Y is Up.
        
        const localVerts = [
            { x: 0, y: 0, z: length/2 },           // Nose (Forward)
            { x: -size/2, y: 0, z: -length/2 },    // Tail Left
            { x: size/2, y: 0, z: -length/2 },     // Tail Right
            { x: 0, y: -size/2, z: -length/2 }     // Cockpit/Top (Up relative to ship body)
        ];
        
        // If we are on the top, we want to flip the ship 180 degrees so it points down to center
        let baseRotation = 0;
        if (this.isTop) baseRotation = Math.PI;
        
        // Apply Rotations and Translation
        const transformedVerts = localVerts.map(v => {
            // 1. Apply Base Rotation (Flip upside down if on ceiling)
            let x1 = v.x * Math.cos(baseRotation) - v.y * Math.sin(baseRotation);
            let y1 = v.x * Math.sin(baseRotation) + v.y * Math.cos(baseRotation);
            let z1 = v.z;
            
            // 2. Apply Tunnel Rotation (Roll)
            // We rotate around the Z axis to match the tunnel tilt
            const rot = gameState.tunnelRotation;
            let x2 = x1 * Math.cos(rot) - y1 * Math.sin(rot);
            let y2 = x1 * Math.sin(rot) + y1 * Math.cos(rot);
            let z2 = z1;
            
            // 3. Translate to World Position
            // The player stays visually at the bottom (or top) center of the screen X=0
            // So we just add the worldY offset
            return {
                x: x2,
                y: y2 + worldY, 
                z: z2 + playerZ
            };
        });
        
        // Project to 2D
        const projVerts = transformedVerts.map(v => project3D(v.x, v.y, v.z));
        
        // Draw Ship
        p.push();
        p.stroke(255);
        p.strokeWeight(1);
        p.fill(this.color);
        
        // Draw Faces (Tetrahedron)
        // 1. Bottom (Nose, TailLeft, TailRight)
        p.beginShape();
        p.vertex(projVerts[0].x, projVerts[0].y);
        p.vertex(projVerts[1].x, projVerts[1].y);
        p.vertex(projVerts[2].x, projVerts[2].y);
        p.endShape(p.CLOSE);
        
        // 2. Left Side (Nose, TailLeft, Cockpit)
        p.fill(this.color[0] + 20, this.color[1] + 20, this.color[2] + 20); // Highlight
        p.beginShape();
        p.vertex(projVerts[0].x, projVerts[0].y);
        p.vertex(projVerts[1].x, projVerts[1].y);
        p.vertex(projVerts[3].x, projVerts[3].y);
        p.endShape(p.CLOSE);
        
        // 3. Right Side (Nose, TailRight, Cockpit)
        p.fill(this.color[0] - 20, this.color[1] - 20, this.color[2] - 20); // Shadow
        p.beginShape();
        p.vertex(projVerts[0].x, projVerts[0].y);
        p.vertex(projVerts[2].x, projVerts[2].y);
        p.vertex(projVerts[3].x, projVerts[3].y);
        p.endShape(p.CLOSE);
        
        // 4. Back (TailLeft, TailRight, Cockpit)
        p.fill(this.color[0] - 40, this.color[1] - 40, this.color[2] - 40); // Darker
        p.beginShape();
        p.vertex(projVerts[1].x, projVerts[1].y);
        p.vertex(projVerts[2].x, projVerts[2].y);
        p.vertex(projVerts[3].x, projVerts[3].y);
        p.endShape(p.CLOSE);
        
        p.pop();
        
        // Update collision poly for debugging/physics
        // Use the projected bounding box or just the main triangle
        this.collisionPoly = [
            p.createVector(projVerts[1].x, projVerts[1].y),
            p.createVector(projVerts[2].x, projVerts[2].y),
            p.createVector(projVerts[3].x, projVerts[3].y)
        ];
        
        // Log player state occasionally
        if (p.frameCount % 60 === 0) {
            logGameEvent(p, 'player', { 
                isTop: this.isTop, 
                rotation: gameState.tunnelRotation 
            });
        }
    }
}

// ----- TUNNEL SEGMENT -----
export class TunnelSegment {
    constructor(z, index) {
        this.z = z;
        this.index = index;
        this.walls = new Array(8).fill(0); // 0 = Clear, 1 = Wall/Obstacle, 2 = Gap
        this.generated = false;
        
        // Procedural Generation
        if (index > 5) { // Leave first few segments clear
            this.generateObstacles();
        }
    }
    
    generateObstacles() {
        const r = Math.random();
        // Difficulty scaling
        const difficulty = gameState.difficultyLevel;
        const hazardChance = 0.3 + (difficulty * 0.05);
        
        if (r < hazardChance) {
            // Pick a random side
            const side = Math.floor(Math.random() * 8);
            
            // Type: 1 = Obstacle (Bump), 2 = Gap (Hole)
            const type = Math.random() > 0.7 ? 2 : 1;
            
            this.walls[side] = type;
            
            // Sometimes add a second obstacle
            if (Math.random() > 0.5) {
                const side2 = (side + 4) % 8; // Opposite side
                this.walls[side2] = Math.random() > 0.7 ? 2 : 1;
            }
        }
    }
    
    update(speed) {
        this.z -= speed;
    }
    
    render(p, nextSegment) {
        if (this.z < -500) return; // Too close to render (behind camera)
        
        // We need the rotation of the tunnel
        const rotation = gameState.tunnelRotation;
        
        // Get vertices for this ring and the next ring (to form walls)
        const currentVerts = getOctagonVertices(this.z, TUNNEL_RADIUS, rotation);
        const nextVerts = getOctagonVertices(nextSegment.z, TUNNEL_RADIUS, rotation);
        
        // Project to 2D
        const p1 = currentVerts.map(v => project3D(v.x, v.y, v.z));
        const p2 = nextVerts.map(v => project3D(v.x, v.y, v.z));
        
        p.strokeWeight(2);
        
        // Draw each face
        for (let i = 0; i < OCTAGON_SIDES; i++) {
            const nextI = (i + 1) % OCTAGON_SIDES;
            
            // Determine type of wall
            const type = this.walls[i];
            
            // Gap: Don't draw the floor panel
            if (type === 2) continue;
            
            // Define Quad coordinates
            const poly = [
                p.createVector(p1[i].x, p1[i].y),
                p.createVector(p1[nextI].x, p1[nextI].y),
                p.createVector(p2[nextI].x, p2[nextI].y),
                p.createVector(p2[i].x, p2[i].y)
            ];
            
            // Color based on alternating segments
            const isAlt = this.index % 2 === 0;
            const baseColor = isAlt ? COLORS.TUNNEL_FILL_1 : COLORS.TUNNEL_FILL_2;
            
            // Draw Wall Panel
            p.fill(baseColor);
            p.stroke(COLORS.TUNNEL_LINES);
            
            if (type === 1) {
                // Obstacle: Draw a distinct shape ON the panel or color it differently
                p.fill(COLORS.OBSTACLE);
            }
            
            p.beginShape();
            poly.forEach(v => p.vertex(v.x, v.y));
            p.endShape(p.CLOSE);
            
            // If Obstacle (Bump), draw extra visual
            if (type === 1) {
                p.stroke(255, 0, 0);
                p.line(poly[0].x, poly[0].y, poly[2].x, poly[2].y);
                p.line(poly[1].x, poly[1].y, poly[3].x, poly[3].y);
            }
        }
    }
}