// Generate random 2-word name for players
const adjectives = ['Happy', 'Swift', 'Bright', 'Calm', 'Eager', 'Fuzzy', 'Jolly', 'Brave', 'Gentle', 'Proud', 'Lucky', 'Mighty'];
const nouns = ['Rabbit', 'Fox', 'Panda', 'Eagle', 'Tiger', 'Bear', 'Lion', 'Hawk', 'Wolf', 'Dolphin', 'Badger', 'Otter'];

export function generateRandomName() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
}
