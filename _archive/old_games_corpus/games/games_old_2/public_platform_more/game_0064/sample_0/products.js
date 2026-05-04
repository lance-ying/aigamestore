// products.js - Product catalog and management

import { gameState } from './globals.js';

export const PRODUCT_CATEGORIES = {
  SNACKS: "Snacks",
  BEVERAGES: "Beverages",
  PREPARED: "Prepared Foods",
  HOUSEHOLD: "Household",
  TOBACCO: "Tobacco",
  MAGAZINE: "Magazines",
  LOTTERY: "Lottery"
};

export class Product {
  constructor(id, name, category, cost, price, demand, unlocked = true) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.cost = cost;
    this.price = price;
    this.demand = demand;
    this.unlocked = unlocked;
  }
  
  get profit() {
    return this.price - this.cost;
  }
}

export function createProductCatalog() {
  const products = [];
  let id = 0;
  
  // Snacks (20 products)
  const snacks = [
    ["Chips", 1, 2, 8],
    ["Candy Bar", 0.5, 1.5, 10],
    ["Gum", 0.3, 1, 6],
    ["Cookies", 1.5, 3, 7],
    ["Pretzels", 1, 2.5, 5],
    ["Beef Jerky", 2, 5, 6],
    ["Trail Mix", 2, 4, 5],
    ["Granola Bar", 1, 2, 7],
    ["Popcorn", 1.5, 3, 6],
    ["Crackers", 1, 2.5, 6],
    ["Nuts", 2.5, 5, 5],
    ["Dried Fruit", 2, 4, 4],
    ["Rice Cake", 1, 2, 4],
    ["Protein Bar", 1.5, 3.5, 6],
    ["Chocolate", 1, 2.5, 8],
    ["Mints", 0.5, 1.5, 5],
    ["Lollipop", 0.3, 1, 7],
    ["Caramel", 0.8, 2, 5],
    ["Wafers", 1, 2, 5],
    ["Gummies", 1, 2.5, 8]
  ];
  
  snacks.forEach(([name, cost, price, demand]) => {
    products.push(new Product(id++, name, PRODUCT_CATEGORIES.SNACKS, cost, price, demand, true));
  });
  
  // Beverages (20 products)
  const beverages = [
    ["Soda", 0.5, 2, 10],
    ["Water", 0.3, 1.5, 9],
    ["Energy Drink", 1, 3, 8],
    ["Juice", 1, 2.5, 7],
    ["Coffee", 0.5, 2, 8],
    ["Tea", 0.5, 2, 6],
    ["Sports Drink", 1, 2.5, 7],
    ["Milk", 1.5, 3, 5],
    ["Iced Coffee", 1, 3, 7],
    ["Lemonade", 0.8, 2.5, 6],
    ["Sparkling Water", 0.8, 2, 5],
    ["Vitamin Water", 1.2, 3, 6],
    ["Coconut Water", 1.5, 3.5, 4],
    ["Smoothie", 2, 4, 5],
    ["Beer", 1, 3, 6, false],
    ["Wine", 3, 8, 4, false],
    ["Seltzer", 0.8, 2.5, 6],
    ["Protein Shake", 2, 4.5, 5],
    ["Hot Chocolate", 0.8, 2.5, 5],
    ["Kombucha", 2, 4, 3, false]
  ];
  
  beverages.forEach(([name, cost, price, demand, unlocked = true]) => {
    products.push(new Product(id++, name, PRODUCT_CATEGORIES.BEVERAGES, cost, price, demand, unlocked));
  });
  
  // Prepared Foods (15 products)
  const prepared = [
    ["Hot Dog", 1, 3.5, 9],
    ["Pizza Slice", 2, 5, 8],
    ["Sandwich", 2.5, 6, 7],
    ["Burrito", 3, 7, 7],
    ["Taquito", 1, 3, 8],
    ["Roller Grill Item", 1.5, 4, 7],
    ["Nachos", 1.5, 4, 6],
    ["Breakfast Sandwich", 2, 5, 7],
    ["Fried Chicken", 3, 7, 6, false],
    ["Mac & Cheese", 2, 5, 5],
    ["Soup", 1.5, 4, 5],
    ["Salad", 3, 6, 4],
    ["Wings", 3, 6.5, 5, false],
    ["Pretzel", 1, 3, 6],
    ["Corn Dog", 1.5, 3.5, 7]
  ];
  
  prepared.forEach(([name, cost, price, demand, unlocked = true]) => {
    products.push(new Product(id++, name, PRODUCT_CATEGORIES.PREPARED, cost, price, demand, unlocked));
  });
  
  // Household (15 products)
  const household = [
    ["Tissue", 2, 4, 5],
    ["Paper Towel", 2.5, 5, 4],
    ["Soap", 1.5, 3.5, 5],
    ["Shampoo", 3, 6, 4],
    ["Toothpaste", 2, 4.5, 5],
    ["Deodorant", 2.5, 5, 4],
    ["Razor", 3, 6.5, 3],
    ["Battery", 2, 5, 6],
    ["Lighter", 0.5, 1.5, 7],
    ["Trash Bag", 3, 6, 3],
    ["Detergent", 4, 8, 3, false],
    ["Air Freshener", 2, 4, 4],
    ["Band-Aid", 1.5, 3.5, 4],
    ["Pain Relief", 3, 7, 5],
    ["Hand Sanitizer", 1, 2.5, 6]
  ];
  
  household.forEach(([name, cost, price, demand, unlocked = true]) => {
    products.push(new Product(id++, name, PRODUCT_CATEGORIES.HOUSEHOLD, cost, price, demand, unlocked));
  });
  
  // Tobacco (10 products)
  const tobacco = [
    ["Cigarettes", 4, 10, 8, false],
    ["Cigars", 3, 8, 4, false],
    ["Chewing Tobacco", 3, 7, 3, false],
    ["Vape", 5, 12, 6, false],
    ["Vape Juice", 3, 8, 5, false],
    ["Rolling Papers", 1, 3, 5, false],
    ["Pipe Tobacco", 4, 9, 2, false],
    ["Lighter Fluid", 2, 5, 3, false],
    ["Matches", 0.5, 1.5, 4],
    ["Nicotine Patch", 4, 10, 2, false]
  ];
  
  tobacco.forEach(([name, cost, price, demand, unlocked = true]) => {
    products.push(new Product(id++, name, PRODUCT_CATEGORIES.TOBACCO, cost, price, demand, unlocked));
  });
  
  // Magazines (10 products)
  const magazines = [
    ["News Magazine", 2, 5, 4],
    ["Sports Magazine", 2, 5, 5],
    ["Fashion Magazine", 2.5, 6, 4],
    ["Auto Magazine", 2, 5, 3],
    ["Tech Magazine", 2.5, 6, 4],
    ["Cooking Magazine", 2, 5, 3],
    ["Travel Magazine", 2.5, 6, 3],
    ["Celebrity Magazine", 2, 5, 6],
    ["Comics", 1.5, 4, 5],
    ["Puzzle Book", 1.5, 4, 4]
  ];
  
  magazines.forEach(([name, cost, price, demand, unlocked = true]) => {
    products.push(new Product(id++, name, PRODUCT_CATEGORIES.MAGAZINE, cost, price, demand, unlocked));
  });
  
  // Lottery (10 products)
  const lottery = [
    ["Scratch-Off $1", 0.5, 1, 9, false],
    ["Scratch-Off $2", 1, 2, 8, false],
    ["Scratch-Off $5", 2.5, 5, 6, false],
    ["Scratch-Off $10", 5, 10, 4, false],
    ["Daily Number", 0.5, 1, 7, false],
    ["Powerball", 1, 2, 8, false],
    ["Mega Millions", 1, 2, 7, false],
    ["Lucky Day", 0.5, 1, 6, false],
    ["Cash 5", 0.5, 1, 5, false],
    ["Pick 3", 0.5, 1, 6, false]
  ];
  
  lottery.forEach(([name, cost, price, demand, unlocked = true]) => {
    products.push(new Product(id++, name, PRODUCT_CATEGORIES.LOTTERY, cost, price, demand, unlocked));
  });
  
  return products;
}

export function initializeInventory() {
  const products = createProductCatalog();
  gameState.products = products;
  
  // Start with basic products in inventory
  gameState.inventory = [];
  products.slice(0, 20).forEach(product => {
    if (product.unlocked) {
      gameState.inventory.push({
        product: product,
        quantity: 10
      });
    }
  });
}

export function getUnlockedProducts() {
  return gameState.products.filter(p => p.unlocked);
}

export function unlockProduct(productId) {
  const product = gameState.products.find(p => p.id === productId);
  if (product) {
    product.unlocked = true;
    addMessage(`Unlocked: ${product.name}!`);
  }
}

export function addMessage(text) {
  gameState.messageQueue.push({
    text: text,
    time: gameState.gameTime
  });
}