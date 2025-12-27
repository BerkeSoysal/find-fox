/**
 * Word Packs - 16 words per topic
 */
const WORD_PACKS = {
    animals: {
        name: 'Animals',
        icon: '🦁',
        words: ['Lion', 'Eagle', 'Dolphin', 'Elephant', 'Tiger', 'Penguin', 'Giraffe', 'Wolf',
            'Bear', 'Shark', 'Owl', 'Fox', 'Rabbit', 'Snake', 'Monkey', 'Whale']
    },
    food: {
        name: 'Food',
        icon: '🍕',
        words: ['Pizza', 'Sushi', 'Burger', 'Pasta', 'Tacos', 'Steak', 'Salad', 'Ramen',
            'Curry', 'Sandwich', 'Soup', 'Ice Cream', 'Pancakes', 'Fries', 'Chicken', 'Rice']
    },
    sports: {
        name: 'Sports',
        icon: '⚽',
        words: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Golf', 'Boxing', 'Skiing', 'Rugby',
            'Baseball', 'Hockey', 'Volleyball', 'Cycling', 'Surfing', 'Wrestling', 'Archery', 'Fencing']
    },
    movies: {
        name: 'Movies',
        icon: '🎬',
        words: ['Titanic', 'Avatar', 'Inception', 'Frozen', 'Joker', 'Matrix', 'Gladiator', 'Shrek',
            'Jaws', 'Rocky', 'Alien', 'Psycho', 'Bambi', 'Grease', 'Minions', 'Up']
    },
    countries: {
        name: 'Countries',
        icon: '🌍',
        words: ['Japan', 'France', 'Brazil', 'Egypt', 'Canada', 'Italy', 'Mexico', 'India',
            'Greece', 'Sweden', 'Kenya', 'Spain', 'Turkey', 'Peru', 'China', 'Norway']
    },
    jobs: {
        name: 'Jobs',
        icon: '👔',
        words: ['Doctor', 'Teacher', 'Chef', 'Pilot', 'Artist', 'Lawyer', 'Farmer', 'Actor',
            'Nurse', 'Police', 'Firefighter', 'Engineer', 'Writer', 'Dentist', 'Astronaut', 'DJ']
    },
    places: {
        name: 'Places',
        icon: '🏛️',
        words: ['Beach', 'Museum', 'Airport', 'Hospital', 'Library', 'Stadium', 'Casino', 'Zoo',
            'Church', 'School', 'Prison', 'Farm', 'Theater', 'Gym', 'Mall', 'Restaurant']
    },
    objects: {
        name: 'Objects',
        icon: '📦',
        words: ['Phone', 'Mirror', 'Clock', 'Lamp', 'Chair', 'Umbrella', 'Camera', 'Piano',
            'Bicycle', 'Telescope', 'Hammer', 'Candle', 'Book', 'Wallet', 'Glasses', 'Key']
    },
    emotions: {
        name: 'Emotions',
        icon: '😊',
        words: ['Happy', 'Sad', 'Angry', 'Scared', 'Excited', 'Confused', 'Proud', 'Jealous',
            'Nervous', 'Relaxed', 'Bored', 'Surprised', 'Tired', 'Hopeful', 'Grateful', 'Anxious']
    }
};

/**
 * Get a random word pack
 */
function getRandomPack() {
    const keys = Object.keys(WORD_PACKS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return { key: randomKey, ...WORD_PACKS[randomKey] };
}

/**
 * Get specific word pack
 */
function getPack(key) {
    return WORD_PACKS[key] || null;
}

/**
 * Get all available topics
 */
function getAllTopics() {
    return Object.entries(WORD_PACKS).map(([key, pack]) => ({
        key,
        name: pack.name,
        icon: pack.icon
    }));
}
