/**
 * line.js
 * Represents a transit line (collection of stations).
 */

import { COLORS, CONFIG } from './globals.js';
import { setStrokeColor } from './utils.js';

export class Line {
    constructor(index) {
        this.index = index;
        this.stations = []; // Array of Station objects
        this.isLoop = false;
        this.color = COLORS.LINES[index];
    }

    addStation(station) {
        // Prevent immediate duplicate
        if (this.stations.length > 0 && this.stations[this.stations.length - 1] === station) {
            return false;
        }
        this.stations.push(station);
        return true;
    }
    
    removeLastStation() {
        if (this.stations.length > 0) {
            this.stations.pop();
        }
    }

    render(p) {
        if (this.stations.length < 2) return;

        p.noFill();
        setStrokeColor(p, this.color);
        p.strokeWeight(CONFIG.LINE_WIDTH);
        p.strokeJoin(p.ROUND);
        p.strokeCap(p.ROUND);

        p.beginShape();
        this.stations.forEach(st => {
            p.vertex(st.x, st.y);
        });
        
        if (this.isLoop) {
            p.endShape(p.CLOSE);
        } else {
            p.endShape();
        }
        
        // Draw terminals (caps)
        if (!this.isLoop) {
            const start = this.stations[0];
            const end = this.stations[this.stations.length - 1];
            p.fill(255);
            p.strokeWeight(2);
            p.circle(start.x, start.y, 6);
            p.circle(end.x, end.y, 6);
        }
    }
}