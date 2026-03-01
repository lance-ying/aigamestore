import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Procedurally generate textures using Canvas API
function createTexture(color, noiseType = 'noise') {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    // Add noise/pattern
    if (noiseType === 'noise') {
        for (let i = 0; i < 400; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = Math.random() * 4;
            const h = Math.random() * 4;
            ctx.fillRect(x, y, w, h);
        }
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = Math.random() * 2;
            const h = Math.random() * 2;
            ctx.fillRect(x, y, w, h);
        }
    } else if (noiseType === 'brick') {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.lineWidth = 2;
        for (let y = 0; y < size; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(size, y);
            ctx.stroke();
            const offset = (y / 16) % 2 === 0 ? 0 : 16;
            for (let x = offset; x < size; x += 32) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + 16);
                ctx.stroke();
            }
        }
    } else if (noiseType === 'wood') {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for(let i=0; i<8; i++) {
            ctx.fillRect(i*8 + 2, 0, 4, size);
        }
    } else if (noiseType === 'leaf') {
        ctx.fillStyle = '#2d6e32';
        ctx.fillRect(0,0,size,size);
        for(let i=0; i<200; i++) {
             ctx.fillStyle = `rgba(40, 150, 40, ${Math.random() * 0.5})`;
             ctx.fillRect(Math.random()*size, Math.random()*size, 4, 4);
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter; // Pixelated look
    return texture;
}

export const textureManager = {
    dirt: null,
    stone: null,
    wood: null,
    brick: null,
    leaf: null,
    gold: null,
    
    init() {
        this.dirt = createTexture('#8B4513', 'noise');
        this.stone = createTexture('#7d7d7d', 'noise');
        this.wood = createTexture('#855E42', 'wood');
        this.brick = createTexture('#A03020', 'brick');
        this.leaf = createTexture('#2d6e32', 'leaf');
        this.gold = createTexture('#FFD700', 'brick');
    },

    getMaterial(type) {
        switch(type) {
            case 1: return new THREE.MeshLambertMaterial({ map: this.dirt });
            case 2: return new THREE.MeshLambertMaterial({ map: this.stone });
            case 3: return new THREE.MeshLambertMaterial({ map: this.wood });
            case 4: return new THREE.MeshLambertMaterial({ map: this.brick });
            case 5: return new THREE.MeshLambertMaterial({ map: this.leaf, transparent: false }); 
            case 6: return new THREE.MeshLambertMaterial({ map: this.gold });
            default: return new THREE.MeshLambertMaterial({ color: 0xff00ff });
        }
    }
};