/**
 * animations.js
 * Handles tweening, camera shake, and smooth transitions.
 */

import { gameState } from './globals.js';
import { lerp } from './utils.js';

class Tween {
    constructor(target, property, endValue, duration, easing = 'linear') {
        this.target = target;
        this.property = property;
        this.startValue = target[property];
        this.endValue = endValue;
        this.duration = duration; // in frames
        this.currentTime = 0;
        this.easing = easing;
        this.finished = false;
    }

    update() {
        if (this.finished) return;
        
        this.currentTime++;
        const t = Math.min(1, this.currentTime / this.duration);
        
        let easedT = t;
        if (this.easing === 'easeOut') {
            easedT = 1 - Math.pow(1 - t, 3);
        } else if (this.easing === 'easeInOut') {
            easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        }

        this.target[this.property] = lerp(this.startValue, this.endValue, easedT);

        if (this.currentTime >= this.duration) {
            this.target[this.property] = this.endValue;
            this.finished = true;
        }
    }
}

export class AnimationManager {
    constructor() {
        this.tweens = [];
        this.screenShake = 0;
    }

    addTween(target, property, endValue, duration, easing) {
        this.tweens.push(new Tween(target, property, endValue, duration, easing));
    }

    shake(amount) {
        this.screenShake = amount;
    }

    update() {
        // Update tweens
        for (let i = this.tweens.length - 1; i >= 0; i--) {
            this.tweens[i].update();
            if (this.tweens[i].finished) {
                this.tweens.splice(i, 1);
            }
        }

        // Update shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.9; // decay
            if (this.screenShake < 0.5) this.screenShake = 0;
        }
    }

    applyCamera(p) {
        if (this.screenShake > 0) {
            const rx = (Math.random() - 0.5) * this.screenShake;
            const ry = (Math.random() - 0.5) * this.screenShake;
            p.translate(rx, ry);
        }
    }
}

export const animationSystem = new AnimationManager();