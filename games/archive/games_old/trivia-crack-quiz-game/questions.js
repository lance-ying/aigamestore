// questions.js - Question database

export const QUESTION_DATABASE = {
  Science: [
    { q: "What is the chemical symbol for water?", a: ["H2O", "CO2", "O2", "NaCl"], c: 0, d: 'easy' },
    { q: "What planet is known as the Red Planet?", a: ["Mars", "Venus", "Jupiter", "Saturn"], c: 0, d: 'easy' },
    { q: "What is the powerhouse of the cell?", a: ["Mitochondria", "Nucleus", "Ribosome", "Chloroplast"], c: 0, d: 'easy' },
    { q: "What gas do plants absorb from the atmosphere?", a: ["Carbon Dioxide", "Oxygen", "Nitrogen", "Hydrogen"], c: 0, d: 'easy' },
    { q: "What is the speed of light?", a: ["299,792 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], c: 0, d: 'medium' },
    { q: "What is the atomic number of Carbon?", a: ["6", "12", "8", "14"], c: 0, d: 'medium' },
    { q: "What particle has no electric charge?", a: ["Neutron", "Proton", "Electron", "Positron"], c: 0, d: 'medium' },
    { q: "What is the Heisenberg Uncertainty Principle?", a: ["Position and momentum cannot both be precisely known", "Energy is quantized", "Mass equals energy", "Time is relative"], c: 0, d: 'hard' },
    { q: "What is the half-life of Carbon-14?", a: ["5,730 years", "10,000 years", "1,000 years", "50,000 years"], c: 0, d: 'hard' },
    { q: "What phenomenon describes quantum entanglement?", a: ["Spooky action at a distance", "Wave-particle duality", "Superposition", "Tunneling"], c: 0, d: 'expert' }
  ],
  Sports: [
    { q: "How many players are on a soccer team?", a: ["11", "10", "9", "12"], c: 0, d: 'easy' },
    { q: "What sport uses a puck?", a: ["Ice Hockey", "Basketball", "Baseball", "Tennis"], c: 0, d: 'easy' },
    { q: "How many points is a touchdown worth?", a: ["6", "7", "3", "5"], c: 0, d: 'easy' },
    { q: "What country hosted the 2016 Olympics?", a: ["Brazil", "China", "UK", "Russia"], c: 0, d: 'easy' },
    { q: "Who has won the most Grand Slam titles?", a: ["Novak Djokovic", "Roger Federer", "Rafael Nadal", "Pete Sampras"], c: 0, d: 'medium' },
    { q: "What is the diameter of a basketball hoop?", a: ["18 inches", "15 inches", "20 inches", "16 inches"], c: 0, d: 'medium' },
    { q: "How long is an Olympic swimming pool?", a: ["50 meters", "25 meters", "100 meters", "75 meters"], c: 0, d: 'medium' },
    { q: "What year was the first modern Olympics?", a: ["1896", "1900", "1888", "1904"], c: 0, d: 'hard' },
    { q: "Who scored the 'Hand of God' goal?", a: ["Diego Maradona", "Pele", "Lionel Messi", "Ronaldo"], c: 0, d: 'hard' },
    { q: "What is the maximum break in snooker?", a: ["147", "180", "150", "200"], c: 0, d: 'expert' }
  ],
  Art: [
    { q: "Who painted the Mona Lisa?", a: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Donatello"], c: 0, d: 'easy' },
    { q: "What color is created by mixing red and blue?", a: ["Purple", "Green", "Orange", "Brown"], c: 0, d: 'easy' },
    { q: "What is a sculpture made from?", a: ["Various materials", "Only stone", "Only metal", "Only wood"], c: 0, d: 'easy' },
    { q: "Who painted 'Starry Night'?", a: ["Vincent van Gogh", "Claude Monet", "Pablo Picasso", "Salvador Dali"], c: 0, d: 'easy' },
    { q: "What art movement was Picasso associated with?", a: ["Cubism", "Impressionism", "Surrealism", "Realism"], c: 0, d: 'medium' },
    { q: "What is the Sistine Chapel famous for?", a: ["Ceiling frescoes", "Sculptures", "Architecture", "Paintings"], c: 0, d: 'medium' },
    { q: "Who painted 'The Persistence of Memory'?", a: ["Salvador Dali", "Pablo Picasso", "Henri Matisse", "Marc Chagall"], c: 0, d: 'medium' },
    { q: "What is chiaroscuro?", a: ["Light and shadow contrast", "Color mixing", "Sculpture technique", "Architecture style"], c: 0, d: 'hard' },
    { q: "Who created 'The Thinker' sculpture?", a: ["Auguste Rodin", "Michelangelo", "Donatello", "Bernini"], c: 0, d: 'hard' },
    { q: "What is the Bauhaus movement?", a: ["Design school", "Painting style", "Sculpture technique", "Music genre"], c: 0, d: 'expert' }
  ],
  Geography: [
    { q: "What is the capital of France?", a: ["Paris", "London", "Berlin", "Madrid"], c: 0, d: 'easy' },
    { q: "What is the largest ocean?", a: ["Pacific", "Atlantic", "Indian", "Arctic"], c: 0, d: 'easy' },
    { q: "What continent is Egypt in?", a: ["Africa", "Asia", "Europe", "South America"], c: 0, d: 'easy' },
    { q: "What is the tallest mountain?", a: ["Mount Everest", "K2", "Kilimanjaro", "Denali"], c: 0, d: 'easy' },
    { q: "What country has the most islands?", a: ["Sweden", "Indonesia", "Philippines", "Japan"], c: 0, d: 'medium' },
    { q: "What is the capital of Australia?", a: ["Canberra", "Sydney", "Melbourne", "Brisbane"], c: 0, d: 'medium' },
    { q: "What river flows through Paris?", a: ["Seine", "Thames", "Rhine", "Danube"], c: 0, d: 'medium' },
    { q: "What is the smallest country?", a: ["Vatican City", "Monaco", "Liechtenstein", "San Marino"], c: 0, d: 'hard' },
    { q: "What desert is the largest hot desert?", a: ["Sahara", "Arabian", "Gobi", "Kalahari"], c: 0, d: 'hard' },
    { q: "What is the capital of Kazakhstan?", a: ["Astana", "Almaty", "Bishkek", "Tashkent"], c: 0, d: 'expert' }
  ],
  Entertainment: [
    { q: "Who directed 'Titanic'?", a: ["James Cameron", "Steven Spielberg", "Martin Scorsese", "Ridley Scott"], c: 0, d: 'easy' },
    { q: "What movie features a character named Simba?", a: ["The Lion King", "Jungle Book", "Tarzan", "Madagascar"], c: 0, d: 'easy' },
    { q: "Who played Iron Man?", a: ["Robert Downey Jr.", "Chris Evans", "Chris Hemsworth", "Mark Ruffalo"], c: 0, d: 'easy' },
    { q: "What is the highest-grossing film?", a: ["Avatar", "Avengers Endgame", "Titanic", "Star Wars"], c: 0, d: 'easy' },
    { q: "Who composed the Star Wars theme?", a: ["John Williams", "Hans Zimmer", "Howard Shore", "Danny Elfman"], c: 0, d: 'medium' },
    { q: "What year was Netflix founded?", a: ["1997", "2000", "1995", "2002"], c: 0, d: 'medium' },
    { q: "Who won the first American Idol?", a: ["Kelly Clarkson", "Carrie Underwood", "Fantasia", "Ruben Studdard"], c: 0, d: 'medium' },
    { q: "What Hitchcock film features a shower scene?", a: ["Psycho", "Vertigo", "The Birds", "Rear Window"], c: 0, d: 'hard' },
    { q: "Who directed 'Pulp Fiction'?", a: ["Quentin Tarantino", "Martin Scorsese", "Coen Brothers", "Paul Thomas Anderson"], c: 0, d: 'hard' },
    { q: "What was the first feature-length animated film?", a: ["Snow White", "Fantasia", "Pinocchio", "Bambi"], c: 0, d: 'expert' }
  ],
  History: [
    { q: "Who was the first US President?", a: ["George Washington", "Thomas Jefferson", "John Adams", "Benjamin Franklin"], c: 0, d: 'easy' },
    { q: "What year did World War II end?", a: ["1945", "1944", "1946", "1943"], c: 0, d: 'easy' },
    { q: "Who discovered America in 1492?", a: ["Christopher Columbus", "Amerigo Vespucci", "Ferdinand Magellan", "Leif Erikson"], c: 0, d: 'easy' },
    { q: "What empire built Machu Picchu?", a: ["Inca", "Aztec", "Maya", "Olmec"], c: 0, d: 'easy' },
    { q: "What year did the Berlin Wall fall?", a: ["1989", "1987", "1990", "1991"], c: 0, d: 'medium' },
    { q: "Who was the first Holy Roman Emperor?", a: ["Charlemagne", "Otto I", "Frederick I", "Charles V"], c: 0, d: 'medium' },
    { q: "What was the Black Death?", a: ["Bubonic plague", "Smallpox", "Cholera", "Typhus"], c: 0, d: 'medium' },
    { q: "What year was the Magna Carta signed?", a: ["1215", "1066", "1300", "1400"], c: 0, d: 'hard' },
    { q: "Who was the last Tsar of Russia?", a: ["Nicholas II", "Alexander III", "Peter the Great", "Ivan the Terrible"], c: 0, d: 'hard' },
    { q: "What treaty ended World War I?", a: ["Treaty of Versailles", "Treaty of Paris", "Treaty of Ghent", "Treaty of Utrecht"], c: 0, d: 'expert' }
  ]
};

export function getQuestionsByCategory(category, difficulty = null) {
  const questions = QUESTION_DATABASE[category] || [];
  if (difficulty) {
    return questions.filter(q => q.d === difficulty);
  }
  return questions;
}

export function getRandomQuestion(category, difficulty = null, excludeIndices = []) {
  const questions = getQuestionsByCategory(category, difficulty);
  const available = questions.filter((_, idx) => !excludeIndices.includes(idx));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}