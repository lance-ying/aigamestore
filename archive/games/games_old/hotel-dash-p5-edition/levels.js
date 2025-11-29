// Level configurations
export const LEVELS = [
  {
    level: 1,
    name: "The Grand Opening",
    rooms: 3,
    kitchenStoves: 1,
    guestArrivalInterval: [5000, 7000],
    guestPatience: 20000,
    serviceTimes: {
      checkin: 3000,
      cook: 5000,
      clean: 7000
    },
    targetCoins: 300,
    timeLimit: 120000,
    maxDissatisfied: 2,
    guestNeeds: ["CHECKIN", "FOOD"]
  },
  {
    level: 2,
    name: "Lunch Rush",
    rooms: 5,
    kitchenStoves: 1,
    guestArrivalInterval: [4000, 6000],
    guestPatience: 18000,
    serviceTimes: {
      checkin: 2500,
      cook: 4000,
      clean: 6000
    },
    targetCoins: 600,
    timeLimit: 150000,
    maxDissatisfied: 3,
    guestNeeds: ["CHECKIN", "FOOD"]
  },
  {
    level: 3,
    name: "Peak Season",
    rooms: 7,
    kitchenStoves: 2,
    guestArrivalInterval: [3000, 5000],
    guestPatience: 15000,
    serviceTimes: {
      checkin: 2000,
      cook: 3000,
      clean: 5000
    },
    targetCoins: 1000,
    timeLimit: 180000,
    maxDissatisfied: 4,
    guestNeeds: ["CHECKIN", "FOOD", "CLEANING"]
  },
  {
    level: 4,
    name: "The Executive Stay",
    rooms: 9,
    kitchenStoves: 2,
    guestArrivalInterval: [2500, 4000],
    guestPatience: 12000,
    serviceTimes: {
      checkin: 1500,
      cook: 2500,
      clean: 4000
    },
    targetCoins: 1500,
    timeLimit: 200000,
    maxDissatisfied: 5,
    guestNeeds: ["CHECKIN", "FOOD", "CLEANING"]
  },
  {
    level: 5,
    name: "Grand Finale",
    rooms: 10,
    kitchenStoves: 2,
    guestArrivalInterval: [2000, 3500],
    guestPatience: 10000,
    serviceTimes: {
      checkin: 1000,
      cook: 2000,
      clean: 3500
    },
    targetCoins: 2000,
    timeLimit: 220000,
    maxDissatisfied: 5,
    guestNeeds: ["CHECKIN", "FOOD", "CLEANING"]
  }
];