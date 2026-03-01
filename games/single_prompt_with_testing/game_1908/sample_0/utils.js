/**
 * utils.js
 * Helper functions for easing, math, and general utilities.
 */

// Easing functions
export const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOutElastic: x => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
};

// Object Pooling Helper
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }

    acquire() {
        if (this.pool.length > 0) {
            const item = this.pool.pop();
            this.resetFn(item);
            return item;
        }
        return this.createFn();
    }

    release(item) {
        this.pool.push(item);
    }
}

export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}