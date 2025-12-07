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
        // The player is visually at fixed X, but Y changes based on flip
        // We use project3D to place the player in the tunnel "space" at z=50 (close to camera)
        
        const playerZ = 50;
        const radius = TUNNEL_RADIUS - 30; // Slightly inside the walls
        
        // Interpolate Y position for smooth flip
        // Bottom is roughly angle PI/2, Top is -PI/2
        let angle = Math.PI / 2; // Bottom
        
        if (this.isFlipping) {
            const start = this.isTop ? Math.PI / 2 : -Math.PI / 2;
            const end = this.isTop ? -Math.PI / 2 : Math.PI / 2;
            // Simple ease
            const t = this.flipProgress;
            // Linear lerp for angle is effectively moving along the circle, 
            // but we want a straight line jump visually or arc? Let's do straight line.
            // Actually, visually moving straight up/down is less dizzying.
        } else {
            angle = this.isTop ? -Math.PI / 2 : Math.PI / 2;
        }

        // Determine 2D screen coordinates
        // We render the player simply at the bottom or top center of screen
        // because the tunnel rotates around US.
        
        // However, to integrate with the 3D look, let's calculate the "World Y"
        // Bottom Y is +radius, Top Y is -radius.
        let worldY = radius;
        if (this.isTop) worldY = -radius;
        if (this.isFlipping) {
             // Lerp between radius and -radius
             const startY = this.isTop ? radius : -radius;
             const endY = this.isTop ? -radius : radius;
             worldY = startY + (endY - startY) * this.flipProgress;
        }

        const proj = project3D(0, worldY, playerZ);
        
        p.push();
        p.translate(proj.x, proj.y);
        
        // Draw Player Shape (Triangle/Ship)
        p.fill(this.color);
        p.stroke(255);
        p.strokeWeight(2);
        
        const size = 15;
        if (this.isTop) {
            p.triangle(-size, -size, size, -size, 0, size); // Pointing down
        } else {
            p.triangle(-size, size, size, size, 0, -size); // Pointing up
        }
        
        // Update collision poly for debugging/physics
        // A simple rect around center
        this.collisionPoly = [
            p.createVector(proj.x - size, proj.y - size),
            p.createVector(proj.x + size, proj.y - size),
            p.createVector(proj.x + size, proj.y + size),
            p.createVector(proj.x - size, proj.y + size)
        ];
        
        p.pop();
        
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
        if (this.z < 10) return; // Too close to render
        
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
            // We store obstacles on the "current" segment's exit side usually
            // Visualizing the wall between i and i+1
            
            // The logic: walls[i] represents the panel at index i.
            // Vertices i and i+1 form the panel i.
            
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
            
            // Cull Back-faces? No, wireframe style or transparent.
            // Simple depth sorting is handled by drawing order (back to front in game loop).
            
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
            
            // If Obstacle (Bump), we might need collision logic here if this is the active segment
            // We'll handle collision in a separate pass, but for visuals:
            if (type === 1) {
                // Draw a "bump" sticking out
                // Simple X on the panel
                p.stroke(255, 0, 0);
                p.line(poly[0].x, poly[0].y, poly[2].x, poly[2].y);
                p.line(poly[1].x, poly[1].y, poly[3].x, poly[3].y);
            }
        }
    }
}