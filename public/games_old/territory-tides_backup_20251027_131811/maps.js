export const mapData = {
  1: {
    name: "The First Stand",
    territories: [
      { id: 0, name: "North Vale", coords: [[50, 50], [150, 50], [150, 120], [50, 120]], adjacentIds: [1, 3], ownerId: 0, armies: 5 },
      { id: 1, name: "East Ridge", coords: [[150, 50], [250, 50], [250, 120], [150, 120]], adjacentIds: [0, 2, 4], ownerId: 0, armies: 4 },
      { id: 2, name: "South Peak", coords: [[250, 50], [350, 50], [350, 120], [250, 120]], adjacentIds: [1, 5], ownerId: 0, armies: 3 },
      { id: 3, name: "West Harbor", coords: [[50, 120], [150, 120], [150, 200], [50, 200]], adjacentIds: [0, 4, 6], ownerId: 0, armies: 4 },
      { id: 4, name: "Central Plains", coords: [[150, 120], [250, 120], [250, 200], [150, 200]], adjacentIds: [1, 3, 5, 7], ownerId: 0, armies: 6 },
      { id: 5, name: "East Coast", coords: [[250, 120], [350, 120], [350, 200], [250, 200]], adjacentIds: [2, 4, 8], ownerId: 1, armies: 3 },
      { id: 6, name: "Southwest Bay", coords: [[50, 200], [150, 200], [150, 280], [50, 280]], adjacentIds: [3, 7], ownerId: 0, armies: 3 },
      { id: 7, name: "South Valley", coords: [[150, 200], [250, 200], [250, 280], [150, 280]], adjacentIds: [4, 6, 8], ownerId: 1, armies: 4 },
      { id: 8, name: "Southeast Point", coords: [[250, 200], [350, 200], [350, 280], [250, 280]], adjacentIds: [5, 7], ownerId: 1, armies: 5 }
    ],
    continents: [
      { id: 0, name: "Northern Lands", territoryIds: [0, 1, 2], bonusArmies: 2 },
      { id: 1, name: "Southern Seas", territoryIds: [6, 7, 8], bonusArmies: 2 }
    ],
    playerStarts: [
      { playerId: 0, territoryIds: [0, 1, 2, 3, 4, 6] },
      { playerId: 1, territoryIds: [5, 7, 8] }
    ]
  },
  2: {
    name: "Continental Clash",
    territories: [
      { id: 0, name: "Iceland", coords: [[50, 30], [100, 30], [100, 70], [50, 70]], adjacentIds: [1, 5], ownerId: 0, armies: 3 },
      { id: 1, name: "Scandinavia", coords: [[100, 30], [180, 30], [180, 80], [100, 80]], adjacentIds: [0, 2, 6], ownerId: 0, armies: 4 },
      { id: 2, name: "Moscow", coords: [[180, 30], [260, 30], [260, 80], [180, 80]], adjacentIds: [1, 3, 7], ownerId: 1, armies: 5 },
      { id: 3, name: "Ural", coords: [[260, 30], [340, 30], [340, 80], [260, 80]], adjacentIds: [2, 4, 8], ownerId: 1, armies: 4 },
      { id: 4, name: "Siberia", coords: [[340, 30], [420, 30], [420, 80], [340, 80]], adjacentIds: [3, 9], ownerId: 1, armies: 3 },
      { id: 5, name: "Britain", coords: [[50, 80], [130, 80], [130, 140], [50, 140]], adjacentIds: [0, 6, 10], ownerId: 0, armies: 4 },
      { id: 6, name: "Northern Europe", coords: [[130, 80], [220, 80], [220, 140], [130, 140]], adjacentIds: [1, 5, 7, 11], ownerId: 0, armies: 5 },
      { id: 7, name: "Ukraine", coords: [[220, 80], [300, 80], [300, 140], [220, 140]], adjacentIds: [2, 6, 8, 12], ownerId: 1, armies: 4 },
      { id: 8, name: "Afghanistan", coords: [[300, 80], [380, 80], [380, 140], [300, 140]], adjacentIds: [3, 7, 9, 13], ownerId: 2, armies: 4 },
      { id: 9, name: "China", coords: [[380, 80], [460, 80], [460, 140], [380, 140]], adjacentIds: [4, 8, 14], ownerId: 2, armies: 5 },
      { id: 10, name: "Western Europe", coords: [[50, 140], [130, 140], [130, 200], [50, 200]], adjacentIds: [5, 11, 15], ownerId: 0, armies: 3 },
      { id: 11, name: "Southern Europe", coords: [[130, 140], [220, 140], [220, 200], [130, 200]], adjacentIds: [6, 10, 12, 16], ownerId: 0, armies: 4 },
      { id: 12, name: "Middle East", coords: [[220, 140], [300, 140], [300, 200], [220, 200]], adjacentIds: [7, 11, 13, 17], ownerId: 2, armies: 5 },
      { id: 13, name: "India", coords: [[300, 140], [380, 140], [380, 200], [300, 200]], adjacentIds: [8, 12, 14, 18], ownerId: 2, armies: 4 },
      { id: 14, name: "Southeast Asia", coords: [[380, 140], [460, 140], [460, 200], [380, 200]], adjacentIds: [9, 13], ownerId: 2, armies: 3 },
      { id: 15, name: "North Africa", coords: [[50, 200], [150, 200], [150, 260], [50, 260]], adjacentIds: [10, 16], ownerId: 0, armies: 2 },
      { id: 16, name: "Egypt", coords: [[150, 200], [250, 200], [250, 260], [150, 260]], adjacentIds: [11, 15, 17], ownerId: 1, armies: 3 },
      { id: 17, name: "East Africa", coords: [[250, 200], [350, 200], [350, 260], [250, 260]], adjacentIds: [12, 16, 18], ownerId: 1, armies: 4 },
      { id: 18, name: "South Africa", coords: [[350, 200], [450, 200], [450, 260], [350, 260]], adjacentIds: [13, 17], ownerId: 2, armies: 3 }
    ],
    continents: [
      { id: 0, name: "Europe", territoryIds: [0, 1, 2, 5, 6, 7, 10, 11], bonusArmies: 5 },
      { id: 1, name: "Asia", territoryIds: [3, 4, 8, 9, 13, 14], bonusArmies: 7 },
      { id: 2, name: "Africa", territoryIds: [15, 16, 17, 18], bonusArmies: 3 }
    ],
    playerStarts: [
      { playerId: 0, territoryIds: [0, 1, 5, 6, 10, 11, 15] },
      { playerId: 1, territoryIds: [2, 3, 7, 16, 17] },
      { playerId: 2, territoryIds: [4, 8, 9, 12, 13, 14, 18] }
    ]
  },
  3: {
    name: "Global Gauntlet",
    territories: [
      { id: 0, name: "Alaska", coords: [[20, 50], [70, 50], [70, 90], [20, 90]], adjacentIds: [1, 3], ownerId: 0, armies: 3 },
      { id: 1, name: "Northwest Territory", coords: [[70, 50], [120, 50], [120, 90], [70, 90]], adjacentIds: [0, 2, 4], ownerId: 1, armies: 3 },
      { id: 2, name: "Greenland", coords: [[120, 50], [170, 50], [170, 90], [120, 90]], adjacentIds: [1, 5], ownerId: 0, armies: 2 },
      { id: 3, name: "Alberta", coords: [[20, 90], [70, 90], [70, 130], [20, 130]], adjacentIds: [0, 4, 6], ownerId: 1, armies: 4 },
      { id: 4, name: "Ontario", coords: [[70, 90], [120, 90], [120, 130], [70, 130]], adjacentIds: [1, 3, 5, 7], ownerId: 0, armies: 3 },
      { id: 5, name: "Quebec", coords: [[120, 90], [170, 90], [170, 130], [120, 130]], adjacentIds: [2, 4, 8], ownerId: 2, armies: 3 },
      { id: 6, name: "Western US", coords: [[20, 130], [70, 130], [70, 170], [20, 170]], adjacentIds: [3, 7, 9], ownerId: 1, armies: 4 },
      { id: 7, name: "Eastern US", coords: [[70, 130], [120, 130], [120, 170], [70, 170]], adjacentIds: [4, 6, 8, 10], ownerId: 0, armies: 5 },
      { id: 8, name: "Central America", coords: [[120, 130], [170, 130], [170, 170], [120, 170]], adjacentIds: [5, 7, 11], ownerId: 2, armies: 3 },
      { id: 9, name: "Venezuela", coords: [[20, 170], [70, 170], [70, 210], [20, 210]], adjacentIds: [6, 10, 12], ownerId: 1, armies: 3 },
      { id: 10, name: "Brazil", coords: [[70, 170], [120, 170], [120, 210], [70, 210]], adjacentIds: [7, 9, 11, 13], ownerId: 3, armies: 4 },
      { id: 11, name: "Peru", coords: [[120, 170], [170, 170], [170, 210], [120, 210]], adjacentIds: [8, 10, 14], ownerId: 2, armies: 3 },
      { id: 12, name: "Argentina", coords: [[20, 210], [70, 210], [70, 250], [20, 250]], adjacentIds: [9, 13], ownerId: 3, armies: 2 },
      { id: 13, name: "North Africa", coords: [[70, 210], [120, 210], [120, 250], [70, 250]], adjacentIds: [10, 12, 15, 16], ownerId: 3, armies: 4 },
      { id: 14, name: "Iceland", coords: [[170, 50], [220, 50], [220, 90], [170, 90]], adjacentIds: [11, 15], ownerId: 0, armies: 2 },
      { id: 15, name: "Great Britain", coords: [[170, 90], [220, 90], [220, 130], [170, 130]], adjacentIds: [13, 14, 16, 17], ownerId: 2, armies: 3 },
      { id: 16, name: "Western Europe", coords: [[170, 130], [220, 130], [220, 170], [170, 170]], adjacentIds: [13, 15, 18], ownerId: 3, armies: 3 },
      { id: 17, name: "Scandinavia", coords: [[220, 50], [270, 50], [270, 90], [220, 90]], adjacentIds: [15, 18, 20], ownerId: 1, armies: 3 },
      { id: 18, name: "Northern Europe", coords: [[220, 90], [270, 90], [270, 130], [220, 130]], adjacentIds: [16, 17, 19, 21], ownerId: 2, armies: 4 },
      { id: 19, name: "Southern Europe", coords: [[220, 130], [270, 130], [270, 170], [220, 170]], adjacentIds: [18, 22, 23], ownerId: 3, armies: 3 },
      { id: 20, name: "Ukraine", coords: [[270, 50], [320, 50], [320, 90], [270, 90]], adjacentIds: [17, 21, 24], ownerId: 1, armies: 4 },
      { id: 21, name: "Ural", coords: [[270, 90], [320, 90], [320, 130], [270, 130]], adjacentIds: [18, 20, 24, 25], ownerId: 2, armies: 3 },
      { id: 22, name: "Egypt", coords: [[270, 130], [320, 130], [320, 170], [270, 170]], adjacentIds: [19, 23, 26], ownerId: 3, armies: 3 },
      { id: 23, name: "East Africa", coords: [[270, 170], [320, 170], [320, 210], [270, 210]], adjacentIds: [19, 22, 26, 27], ownerId: 3, armies: 2 },
      { id: 24, name: "Siberia", coords: [[320, 50], [370, 50], [370, 90], [320, 90]], adjacentIds: [20, 21, 28], ownerId: 1, armies: 3 },
      { id: 25, name: "Afghanistan", coords: [[320, 90], [370, 90], [370, 130], [320, 130]], adjacentIds: [21, 26, 28, 29], ownerId: 2, armies: 4 },
      { id: 26, name: "Middle East", coords: [[320, 130], [370, 130], [370, 170], [320, 170]], adjacentIds: [22, 23, 25, 29], ownerId: 3, armies: 4 },
      { id: 27, name: "South Africa", coords: [[320, 170], [370, 170], [370, 210], [320, 210]], adjacentIds: [23, 26], ownerId: 3, armies: 2 },
      { id: 28, name: "China", coords: [[370, 50], [420, 50], [420, 90], [370, 90]], adjacentIds: [24, 25, 29, 30], ownerId: 1, armies: 5 },
      { id: 29, name: "India", coords: [[370, 90], [420, 90], [420, 130], [370, 130]], adjacentIds: [25, 26, 28, 31], ownerId: 2, armies: 4 },
      { id: 30, name: "Mongolia", coords: [[420, 50], [470, 50], [470, 90], [420, 90]], adjacentIds: [28, 32], ownerId: 1, armies: 3 },
      { id: 31, name: "Siam", coords: [[420, 90], [470, 90], [470, 130], [420, 130]], adjacentIds: [29, 32], ownerId: 2, armies: 3 },
      { id: 32, name: "Japan", coords: [[470, 50], [520, 50], [520, 90], [470, 90]], adjacentIds: [30, 31], ownerId: 1, armies: 4 },
      { id: 33, name: "Indonesia", coords: [[420, 130], [470, 130], [470, 170], [420, 170]], adjacentIds: [31, 34], ownerId: 2, armies: 2 },
      { id: 34, name: "New Guinea", coords: [[470, 130], [520, 130], [520, 170], [470, 170]], adjacentIds: [33, 35], ownerId: 1, armies: 2 },
      { id: 35, name: "Eastern Australia", coords: [[470, 170], [520, 170], [520, 210], [470, 210]], adjacentIds: [34, 36], ownerId: 1, armies: 3 },
      { id: 36, name: "Western Australia", coords: [[420, 170], [470, 170], [470, 210], [420, 210]], adjacentIds: [33, 35], ownerId: 1, armies: 2 }
    ],
    continents: [
      { id: 0, name: "North America", territoryIds: [0, 1, 2, 3, 4, 5, 6, 7, 8], bonusArmies: 5 },
      { id: 1, name: "South America", territoryIds: [9, 10, 11, 12], bonusArmies: 2 },
      { id: 2, name: "Europe", territoryIds: [14, 15, 16, 17, 18, 19, 20], bonusArmies: 5 },
      { id: 3, name: "Africa", territoryIds: [13, 22, 23, 26, 27], bonusArmies: 3 },
      { id: 4, name: "Asia", territoryIds: [21, 24, 25, 28, 29, 30, 31, 32], bonusArmies: 7 },
      { id: 5, name: "Australia", territoryIds: [33, 34, 35, 36], bonusArmies: 2 }
    ],
    playerStarts: [
      { playerId: 0, territoryIds: [0, 2, 4, 7, 14] },
      { playerId: 1, territoryIds: [1, 3, 6, 9, 17, 20, 24, 28, 30, 32, 34, 35, 36] },
      { playerId: 2, territoryIds: [5, 8, 11, 15, 18, 21, 25, 29, 31, 33] },
      { playerId: 3, territoryIds: [10, 12, 13, 16, 19, 22, 23, 26, 27] }
    ]
  }
};