// Vector and Math Utilities for Physics

export class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    mult(s) { return new Vec2(this.x * s, this.y * s); }
    div(s) { return new Vec2(this.x / s, this.y / s); }
    
    dot(v) { return this.x * v.x + this.y * v.y; }
    cross(v) { return this.x * v.y - this.y * v.x; }
    
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    magSq() { return this.x * this.x + this.y * this.y; }
    
    normalize() {
        const m = this.mag();
        return m === 0 ? new Vec2(0, 0) : this.div(m);
    }
    
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }
    
    copy() { return new Vec2(this.x, this.y); }
    dist(v) { return this.sub(v).mag(); }
}

export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// SAT (Separating Axis Theorem) Helpers
export function verticesToAxes(vertices) {
    const axes = [];
    for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i];
        const p2 = vertices[(i + 1) % vertices.length];
        const edge = p2.sub(p1);
        axes.push(new Vec2(-edge.y, edge.x).normalize());
    }
    return axes;
}

export function projectPolygon(vertices, axis) {
    let min = Infinity;
    let max = -Infinity;
    for (const v of vertices) {
        const proj = v.dot(axis);
        if (proj < min) min = proj;
        if (proj > max) max = proj;
    }
    return { min, max };
}