// hex_lib.js
// Hexagonal grid mathematics (Axial Coordinates q, r)
// Flat-topped hexagons

import { HEX_SIZE } from './globals.js';

export class Hex {
    constructor(q, r) {
        this.q = q;
        this.r = r;
        this.s = -q - r;
    }

    static add(a, b) {
        return new Hex(a.q + b.q, a.r + b.r);
    }

    static subtract(a, b) {
        return new Hex(a.q - b.q, a.r - b.r);
    }

    static scale(a, k) {
        return new Hex(a.q * k, a.r * k);
    }

    static neighbor(hex, direction) {
        const directions = [
            new Hex(1, 0), new Hex(1, -1), new Hex(0, -1),
            new Hex(-1, 0), new Hex(-1, 1), new Hex(0, 1)
        ];
        return Hex.add(hex, directions[direction % 6]);
    }
    
    static neighbors(hex) {
        const results = [];
        for (let i = 0; i < 6; i++) {
            results.push(Hex.neighbor(hex, i));
        }
        return results;
    }

    static distance(a, b) {
        const vec = Hex.subtract(a, b);
        return (Math.abs(vec.q) + Math.abs(vec.q + vec.r) + Math.abs(vec.r)) / 2;
    }

    static toPixel(hex) {
        // Pointy-topped
        // x = size * sqrt(3) * (q + r/2)
        // y = size * 3/2 * r
        
        // Let's use Flat-topped for this game? 
        // Instructions example implied Pointy (Hoplite uses flat-topped usually? No, standard is usually pointy for vertical layout, flat for horizontal).
        // Let's stick to POINTY TOPPED as it fits the "Standard" math often used.
        // x = size * sqrt(3) * (q + r/2)
        // y = size * 3/2 * r
        const x = HEX_SIZE * Math.sqrt(3) * (hex.q + hex.r / 2);
        const y = HEX_SIZE * 3/2 * hex.r;
        return { x, y };
    }

    static fromPixel(x, y) {
        const q = (Math.sqrt(3)/3 * x - 1/3 * y) / HEX_SIZE;
        const r = (2/3 * y) / HEX_SIZE;
        return Hex.round(q, r);
    }

    static round(fracQ, fracR) {
        let q = Math.round(fracQ);
        let r = Math.round(fracR);
        let s = Math.round(-fracQ - fracR);
        const q_diff = Math.abs(q - fracQ);
        const r_diff = Math.abs(r - fracR);
        const s_diff = Math.abs(s - (-fracQ - fracR));

        if (q_diff > r_diff && q_diff > s_diff) {
            q = -r - s;
        } else if (r_diff > s_diff) {
            r = -q - s;
        }
        return new Hex(q, r);
    }
    
    static getKey(hex) {
        return `${hex.q},${hex.r}`;
    }
    
    static lerp(a, b, t) {
        return new Hex(
            a.q + (b.q - a.q) * t,
            a.r + (b.r - a.r) * t
        );
    }
    
    // Line drawing algorithm
    static line(a, b) {
        const N = Hex.distance(a, b);
        const results = [];
        const step = 1.0 / Math.max(N, 1);
        for (let i = 0; i <= N; i++) {
            results.push(Hex.roundLerp(a, b, step * i));
        }
        return results;
    }
    
    static roundLerp(a, b, t) {
        const q = a.q * (1 - t) + b.q * t;
        const r = a.r * (1 - t) + b.r * t;
        return Hex.round(q, r);
    }
}