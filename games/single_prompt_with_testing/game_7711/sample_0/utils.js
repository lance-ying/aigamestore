/**
 * utils.js
 * Mathematical helpers, Hexagon logic, and general utilities.
 */

import { CONFIG, gameState } from './globals.js';

// --- Math Helpers ---

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

export function distSq(x1, y1, x2, y2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}

// --- Hexagon Math (Axial Coordinates) ---
// We use "Flat topped" hexagons.
// q = x axis, r = z axis (in cube coords) -> q, r storage
// conversion to pixel x,y

export class HexMath {
    static hexToPixel(q, r) {
        const size = CONFIG.GRID_SIZE;
        const x = size * (3/2 * q);
        const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
        return { x, y };
    }

    static pixelToHex(x, y) {
        const size = CONFIG.GRID_SIZE;
        const q = (2/3 * x) / size;
        const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
        return HexMath.hexRound(q, r);
    }

    static hexRound(q, r) {
        let s = -q - r;
        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);

        const q_diff = Math.abs(rq - q);
        const r_diff = Math.abs(rr - r);
        const s_diff = Math.abs(rs - s);

        if (q_diff > r_diff && q_diff > s_diff) {
            rq = -rr - rs;
        } else if (r_diff > s_diff) {
            rr = -rq - rs;
        }
        
        return { q: rq, r: rr };
    }

    // Offset coordinates (Odd-Q)
    // Used for array storage and cursor movement
    static axialToOffset(q, r) {
        const col = q;
        const row = r + (q - (q & 1)) / 2;
        return { col, row };
    }

    static offsetToAxial(col, row) {
        const q = col;
        const r = row - (col - (col & 1)) / 2;
        return { q, r };
    }

    static distance(h1, h2) {
        return (Math.abs(h1.q - h2.q) 
              + Math.abs(h1.q + h1.r - h2.q - h2.r) 
              + Math.abs(h1.r - h2.r)) / 2;
    }

    static getNeighbors(q, r) {
        const directions = [
            {q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1},
            {q: -1, r: 0}, {q: -1, r: 1}, {q: 0, r: 1}
        ];
        return directions.map(d => ({ q: q + d.q, r: r + d.r }));
    }
}

// --- Drawing Helpers ---

export function drawHex(p, x, y, size, mode = "stroke", color = 255) {
    p.push();
    p.translate(x, y);
    if (mode === "fill") {
        p.fill(color);
        p.noStroke();
    } else {
        p.noFill();
        p.stroke(color);
        p.strokeWeight(2);
    }
    
    p.beginShape();
    for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i;
        const vx = size * Math.cos(angle);
        const vy = size * Math.sin(angle);
        p.vertex(vx, vy);
    }
    p.endShape(p.CLOSE);
    p.pop();
}

export function drawHealthBar(p, entity, yOffset = -20) {
    if (!entity.hp || !entity.maxHp) return;
    
    const w = 30;
    const h = 4;
    const x = entity.pixelX - w/2;
    const y = entity.pixelY + yOffset;
    
    p.noStroke();
    p.fill(50);
    p.rect(x, y, w, h);
    
    const pct = entity.hp / entity.maxHp;
    if (pct > 0.5) p.fill(0, 255, 0);
    else if (pct > 0.25) p.fill(255, 200, 0);
    else p.fill(255, 0, 0);
    
    p.rect(x, y, w * pct, h);
}