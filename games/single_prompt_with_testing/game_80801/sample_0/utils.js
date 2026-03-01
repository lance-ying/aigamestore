import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { COLORS } from './globals.js';

// Helper to get random item from array
export function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random number in range
export function getRandomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Helper to get a random color from the main gameplay colors
export function getRandomGameColor() {
    const gameColors = [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW];
    return getRandomElement(gameColors);
}

// Linear interpolation
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Clamp value
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Check AABB vs Sphere collision roughly (treating box as sphere for simplicity or checking bounds)
// For this game, specific collision functions in physics.js are better.