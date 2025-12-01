import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
        this.type = type; // 'chip', 'fire', 'text'
        this.text = "";
        this.color = [255, 255, 255];
        
        if (type === 'fire') {
            this.vy = -Math.random() * 3 - 1;
            this.color = [255, 100 + Math.random() * 100, 0];
        } else if (type === 'chip') {
            this.color = [0, 150, 255];
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'fire') {
            this.vx *= 0.95;
            this.life -= this.decay;
        } else if (this.type === 'chip') {
            this.vy += 0.2; // Gravity
            this.life -= this.decay;
        } else if (this.type === 'text') {
            this.vy = -1;
            this.life -= 0.01;
        }
    }
    
    render(p) {
        p.noStroke();
        const alpha = this.life * 255;
        
        if (this.type === 'text') {
            p.fill(255, 255, 255, alpha);
            p.textSize(20);
            p.text(this.text, this.x, this.y);
            return;
        }
        
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        
        if (this.type === 'fire') {
            p.rect(this.x, this.y, 4 * this.life, 4 * this.life);
        } else {
            p.circle(this.x, this.y, 6 * this.life);
        }
    }
}

export class Joker {
    constructor(id, name, desc, cost, rarity, effectFn) {
        this.id = id;
        this.name = name;
        this.description = desc;
        this.cost = cost;
        this.rarity = rarity; // Common, Uncommon, Rare
        this.effectFn = effectFn;
    }
    
    calculate(handType, playedCards, currentChips, currentMult) {
        return this.effectFn(handType, playedCards, currentChips, currentMult);
    }
}

// Joker Definitions
export const JOKER_DEFINITIONS = [
    new Joker('j_joker', 'Joker', '+4 Mult', 2, 'Common', (ht, pc, c, m) => ({ chips: c, mult: m + 4 })),
    new Joker('j_greedy', 'Greedy Joker', '+4 Mult per Heart', 5, 'Common', (ht, pc, c, m) => {
        const hearts = pc.filter(card => card.suit === 'Hearts').length;
        return { chips: c, mult: m + (hearts * 4) };
    }),
    new Joker('j_lusty', 'Lusty Joker', '+4 Mult per Heart', 5, 'Common', (ht, pc, c, m) => { // Actually hearts, greedy is diamonds usually? Let's simplify.
         // Let's make Greedy Diamonds
        const diamonds = pc.filter(card => card.suit === 'Diamonds').length;
        return { chips: c, mult: m + (diamonds * 4) };
    }),
    new Joker('j_wrathful', 'Wrathful Joker', '+4 Mult per Spade', 5, 'Common', (ht, pc, c, m) => {
        const spades = pc.filter(card => card.suit === 'Spades').length;
        return { chips: c, mult: m + (spades * 4) };
    }),
    new Joker('j_gluttenous', 'Gluttonous Joker', '+4 Mult per Club', 5, 'Common', (ht, pc, c, m) => {
        const clubs = pc.filter(card => card.suit === 'Clubs').length;
        return { chips: c, mult: m + (clubs * 4) };
    }),
    new Joker('j_sly', 'Sly Joker', '+50 Chips if Pair', 4, 'Uncommon', (ht, pc, c, m) => {
        return { chips: (ht.name === "Pair") ? c + 50 : c, mult: m };
    }),
    new Joker('j_banner', 'Banner', '+40 Chips for each discard remaining', 6, 'Common', (ht, pc, c, m) => {
        return { chips: c + (gameState.discardsLeft * 40), mult: m };
    }),
    new Joker('j_mystic', 'Mystic Summit', '+15 Mult when 0 discards remaining', 5, 'Common', (ht, pc, c, m) => {
        return { chips: c, mult: (gameState.discardsLeft === 0) ? m + 15 : m };
    }),
    new Joker('j_even', 'Even Steven', '+4 Mult for each even rank played', 5, 'Common', (ht, pc, c, m) => {
        const evens = pc.filter(card => ['2','4','6','8','10'].includes(card.rank)).length;
        return { chips: c, mult: m + (evens * 4) };
    }),
    new Joker('j_odd', 'Odd Todd', '+30 Chips for each odd rank played', 5, 'Common', (ht, pc, c, m) => {
        const odds = pc.filter(card => ['3','5','7','9','A'].includes(card.rank)).length;
        return { chips: c + (odds * 30), mult: m };
    })
];