/**
 * Fox Game - WebSocket Server
 * Real-time online multiplayer server for the Fox Game
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Word packs (same as client)
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

// Game phases
const PHASES = {
    LOBBY: 'lobby',
    ROLE_REVEAL: 'role_reveal',
    HINT_WRITING: 'hint_writing',
    VOTING: 'voting',
    ESCAPE: 'escape',
    RESULTS: 'results'
};

// Room storage
const rooms = new Map();

// Generate unique room code
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (rooms.has(code));
    return code;
}

// Generate unique player ID
function generatePlayerId() {
    return 'p_' + Math.random().toString(36).substr(2, 9);
}

// Create a new room
function createRoom(hostId, hostName, isPublic = false, maxPlayers = 6, roomName = null) {
    const code = generateRoomCode();
    const room = {
        code,
        name: roomName || `${hostName}'s Room`,
        hostId,
        phase: PHASES.LOBBY,
        players: new Map(),
        topic: null,
        words: [],
        secretWord: null,
        foxId: null,
        hints: new Map(),
        votes: new Map(),
        scores: new Map(),
        peekPlayerId: null,
        escapeGuess: null,
        roundNumber: 0,
        lastResult: null,
        lastFinders: [],
        lastScoreChanges: null,
        timerDuration: 15, // Default 15 seconds
        isPublic,
        maxPlayers: Math.min(Math.max(parseInt(maxPlayers) || 6, 3), 6)
    };

    room.players.set(hostId, {
        id: hostId,
        name: hostName,
        connected: true,
        ws: null
    });
    room.scores.set(hostId, 0);

    rooms.set(code, room);
    return room;
}

// Get room by code
function getRoom(code) {
    return rooms.get(code?.toUpperCase());
}

// Broadcast to all players in a room
function broadcast(room, message, excludeId = null) {
    const data = JSON.stringify(message);
    room.players.forEach((player, playerId) => {
        if (playerId !== excludeId && player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(data);
        }
    });
}

// Send to specific player
function sendTo(room, playerId, message) {
    const player = room.players.get(playerId);
    if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
    }
}

// Get players list for client
function getPlayersList(room) {
    return Array.from(room.players.entries()).map(([id, p]) => ({
        id,
        name: p.name,
        connected: p.connected,
        isHost: id === room.hostId,
        hasHint: room.hints.has(id),
        hasVoted: room.votes.has(id),
        score: room.scores.get(id) || 0
    }));
}

// Get room data for sync
function getRoomData(room) {
    return {
        roomCode: room.code,
        roomName: room.name,
        hostId: room.hostId,
        players: getPlayersList(room),
        timerDuration: room.timerDuration,
        isPublic: room.isPublic,
        maxPlayers: room.maxPlayers
    };
}

function getFullSyncData(room, playerId) {
    return {
        roomCode: room.code,
        roomName: room.name,
        hostId: room.hostId,
        playerId: playerId,
        phase: room.phase,
        players: getPlayersList(room),
        timerDuration: room.timerDuration,
        isPublic: room.isPublic,
        maxPlayers: room.maxPlayers,
        // Game state
        topic: room.topic,
        words: room.words,
        secretWord: (room.phase === PHASES.RESULTS || playerId !== room.foxId) ? room.secretWord : null,
        isFox: playerId === room.foxId,
        hints: Array.from(room.hints.entries()).map(([pid, hint]) => ({ playerId: pid, hint })),
        votes: Array.from(room.votes.entries()).map(([pid, v]) => ({ playerId: pid, targetId: v })),
        roundNumber: room.roundNumber,
        // End game details for Results screen re-sync
        lastResult: room.lastResult,
        lastFinders: room.lastFinders,
        lastScoreChanges: room.lastScoreChanges ? Array.from(room.lastScoreChanges.entries()).map(([pid, change]) => ({ playerId: pid, change })) : [],
        foxId: room.foxId,
        peekPlayerId: playerId === room.foxId ? room.peekPlayerId : null,
        peekPlayerName: playerId === room.foxId ? room.players.get(room.peekPlayerId)?.name : null,
        escapeGuess: room.escapeGuess
    };
}

// Get all public lobby rooms
function getPublicRooms() {
    const list = [];
    rooms.forEach(room => {
        if (room.isPublic && room.phase === PHASES.LOBBY) {
            list.push({
                roomCode: room.code,
                roomName: room.name,
                playerCount: room.players.size,
                maxPlayers: room.maxPlayers
            });
        }
    });
    return list;
}

// Start a new game round
function startGame(room, topic) {
    const pack = WORD_PACKS[topic];
    if (!pack) return false;

    room.topic = topic;
    room.words = [...pack.words];
    room.secretWord = room.words[Math.floor(Math.random() * room.words.length)];
    room.hints.clear();
    room.votes.clear();
    room.escapeGuess = null;
    room.roundNumber++;

    // Select random fox
    const playerIds = Array.from(room.players.keys());
    room.foxId = playerIds[Math.floor(Math.random() * playerIds.length)];

    // Select random player for fox peek (not the fox)
    const nonFoxIds = playerIds.filter(id => id !== room.foxId);
    room.peekPlayerId = nonFoxIds[Math.floor(Math.random() * nonFoxIds.length)];

    room.phase = PHASES.HINT_WRITING;

    // Send personalized role reveals and transition directly to hints
    room.players.forEach((player, playerId) => {
        const isFox = playerId === room.foxId;
        const peekPlayerName = isFox ? room.players.get(room.peekPlayerId)?.name : null;
        const peekPlayerId = isFox ? room.peekPlayerId : null;

        sendTo(room, playerId, {
            type: 'GAME_STARTED',
            phase: PHASES.HINT_WRITING,
            isFox,
            words: room.words,
            secretWord: isFox ? null : room.secretWord,
            players: getPlayersList(room),
            topic: room.topic,
            peekPlayerId,
            peekPlayerName,
            timerDuration: room.timerDuration
        });
    });

    return true;
}

// Move to hint writing phase
function startHintPhase(room) {
    room.phase = PHASES.HINT_WRITING;

    // Tell everyone except fox to start writing hints
    broadcast(room, {
        type: 'PHASE_CHANGE',
        phase: PHASES.HINT_WRITING,
        players: getPlayersList(room),
        peekPlayerName: null
    }, room.foxId);

    // Tell fox who they're peeking at (realtime hint watching)
    const peekPlayerName = room.players.get(room.peekPlayerId)?.name;
    sendTo(room, room.foxId, {
        type: 'PHASE_CHANGE',
        phase: PHASES.HINT_WRITING,
        players: getPlayersList(room),
        peekPlayerId: room.peekPlayerId,
        peekPlayerName: peekPlayerName
    });
}

// Handle realtime hint typing (sent to fox only)
function handleHintTyping(room, playerId, hint) {
    // Only send to fox if this is the player they're peeking at
    if (playerId === room.peekPlayerId) {
        sendTo(room, room.foxId, {
            type: 'PEEK_HINT_UPDATE',
            hint: hint || ''
        });
    }
}

// Submit a hint
function submitHint(room, playerId, hint) {
    room.hints.set(playerId, hint || '(no hint)');

    // Broadcast progress
    broadcast(room, {
        type: 'HINT_SUBMITTED',
        playerId,
        hintsCount: room.hints.size,
        totalPlayers: room.players.size,
        players: getPlayersList(room)
    });

    // Check if all hints are in - go directly to voting phase
    if (room.hints.size === room.players.size) {
        startVotingPhase(room);
    }
}

// Fox peek phase removed - fox now sees hints in realtime during hint writing

// Start voting phase
function startVotingPhase(room) {
    room.phase = PHASES.VOTING;
    room.votes.clear();

    const allHints = [];
    room.players.forEach((player, playerId) => {
        allHints.push({
            playerId,
            playerName: player.name,
            hint: room.hints.get(playerId) || '(no hint)'
        });
    });

    broadcast(room, {
        type: 'PHASE_CHANGE',
        phase: PHASES.VOTING,
        players: getPlayersList(room),
        hints: allHints
    });
}

// Submit a vote
function submitVote(room, voterId, targetId) {
    room.votes.set(voterId, targetId);

    broadcast(room, {
        type: 'VOTE_SUBMITTED',
        voterId,
        votesCount: room.votes.size,
        totalPlayers: room.players.size,
        players: getPlayersList(room)
    });

    // Check if all votes are in
    if (room.votes.size === room.players.size) {
        processVotingResults(room);
    }
}

// Process voting results
function processVotingResults(room) {
    const voteCounts = new Map();
    room.votes.forEach((targetId) => {
        voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
    });

    const foxVotes = voteCounts.get(room.foxId) || 0;
    const totalVoters = room.votes.size;
    const foxCaught = foxVotes > totalVoters / 2;

    // Find who voted for the fox
    const finders = [];
    room.votes.forEach((targetId, voterId) => {
        if (targetId === room.foxId) {
            finders.push(voterId);
        }
    });

    if (foxCaught) {
        // Fox was caught - give them a chance to escape
        room.phase = PHASES.ESCAPE;

        // Send escape phase to fox
        sendTo(room, room.foxId, {
            type: 'ESCAPE_PHASE',
            phase: PHASES.ESCAPE,
            words: room.words,
            caught: true
        });

        // Tell others fox was caught
        broadcast(room, {
            type: 'FOX_CAUGHT',
            phase: PHASES.ESCAPE,
            foxName: room.players.get(room.foxId)?.name,
            message: 'Fox was caught! Waiting for escape attempt...'
        }, room.foxId);
    } else {
        // Fox wasn't caught
        const scoreChanges = calculateScores(room, false, false, finders);
        showResults(room, 'fox_wins', scoreChanges, finders);
    }
}

// Fox attempts escape
function attemptEscape(room, guess) {
    room.escapeGuess = guess;
    const escaped = guess === room.secretWord;

    const finders = [];
    room.votes.forEach((targetId, voterId) => {
        if (targetId === room.foxId) {
            finders.push(voterId);
        }
    });

    const scoreChanges = calculateScores(room, true, escaped, finders);
    const result = escaped ? 'fox_escapes' : 'fox_caught';
    showResults(room, result, scoreChanges, finders);
}

// Calculate scores
function calculateScores(room, foxCaught, foxEscaped, finders) {
    const scoreChanges = new Map();

    room.players.forEach((_, playerId) => {
        scoreChanges.set(playerId, 0);
    });

    if (!foxCaught) {
        // Fox not caught - fox gets 3 points
        scoreChanges.set(room.foxId, 3);

        // If exactly 1 person found the fox, they get 2 bonus points
        if (finders.length === 1) {
            scoreChanges.set(finders[0], 2);
        }
    } else if (foxEscaped) {
        // Fox caught but escaped - fox gets 2 points
        scoreChanges.set(room.foxId, 2);
    } else {
        // Fox caught and didn't escape - everyone else gets 1 point
        room.players.forEach((_, playerId) => {
            if (playerId !== room.foxId) {
                scoreChanges.set(playerId, 1);
            }
        });
    }

    // Apply score changes
    scoreChanges.forEach((change, playerId) => {
        const current = room.scores.get(playerId) || 0;
        room.scores.set(playerId, current + change);
    });

    return scoreChanges;
}

// Show results
function showResults(room, result, scoreChanges, finders) {
    room.phase = PHASES.RESULTS;
    room.lastResult = result;
    room.lastFinders = finders.map(id => room.players.get(id)?.name || 'Unknown');
    room.lastScoreChanges = scoreChanges;

    const scores = [];
    room.players.forEach((player, playerId) => {
        scores.push({
            playerId,
            playerName: player.name,
            score: room.scores.get(playerId) || 0,
            change: scoreChanges.get(playerId) || 0,
            isFox: playerId === room.foxId
        });
    });

    scores.sort((a, b) => b.score - a.score);

    broadcast(room, {
        type: 'GAME_OVER',
        phase: PHASES.RESULTS,
        result,
        foxId: room.foxId,
        foxName: room.players.get(room.foxId)?.name,
        secretWord: room.secretWord,
        escapeGuess: room.escapeGuess,
        finders: finders.map(id => room.players.get(id)?.name),
        scores,
        players: getPlayersList(room)
    });
}

// Return to lobby
function returnToLobby(room) {
    room.phase = PHASES.LOBBY;
    room.hints.clear();
    room.votes.clear();
    room.foxId = null;
    room.secretWord = null;
    room.escapeGuess = null;

    broadcast(room, {
        type: 'RETURN_TO_LOBBY',
        phase: PHASES.LOBBY,
        players: getPlayersList(room)
    });
}

// Handle player disconnect
function handleDisconnect(room, playerId) {
    const player = room.players.get(playerId);
    if (player) {
        player.connected = false;
        player.ws = null;

        broadcast(room, {
            type: 'PLAYER_DISCONNECTED',
            playerId,
            playerName: player.name,
            players: getPlayersList(room)
        });

        // If in lobby and no connected players, clean up room after delay
        const connectedCount = Array.from(room.players.values()).filter(p => p.connected).length;
        if (connectedCount === 0) {
            setTimeout(() => {
                const currentRoom = rooms.get(room.code);
                if (currentRoom) {
                    const stillConnected = Array.from(currentRoom.players.values()).filter(p => p.connected).length;
                    if (stillConnected === 0) {
                        rooms.delete(room.code);
                        console.log(`Room ${room.code} deleted (all players left)`);
                    }
                }
            }, 300000); // 5 minute cleanup delay
        }
    }
}

// Create HTTP server for serving static files
const httpServer = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0]; // Remove query strings

    // Static file mapping
    let filePath = urlPath === '/' ? '/index.html' : urlPath;

    // Check if the path is a 4-character room code (e.g., /ABCD)
    // We only do this if it's not a root path and has no extension
    const pathParts = urlPath.split('/').filter(p => p);
    if (pathParts.length === 1 && pathParts[0].length === 4 && !path.extname(urlPath)) {
        filePath = '/index.html';
    }

    const absolutePath = path.join(__dirname, filePath);
    const ext = path.extname(absolutePath);

    const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon'
    };

    fs.readFile(absolutePath, (err, data) => {
        if (err) {
            // If file not found, still serve index.html for SPA routing
            fs.readFile(path.join(__dirname, 'index.html'), (err2, data2) => {
                if (err2) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data2);
            });
            return;
        }
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        res.end(data);
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (ws) => {
    let playerId = null;
    let roomCode = null;

    console.log('New connection');

    ws.on('message', (data) => {
        let message;
        try {
            message = JSON.parse(data);
        } catch (e) {
            console.error('Invalid message:', data);
            return;
        }

        console.log('Received:', message.type);

        switch (message.type) {
            case 'CREATE_ROOM': {
                playerId = generatePlayerId();
                const room = createRoom(playerId, message.playerName, message.isPublic, message.maxPlayers, message.roomName);
                roomCode = room.code;

                const player = room.players.get(playerId);
                player.ws = ws;

                ws.send(JSON.stringify({
                    type: 'ROOM_CREATED',
                    roomCode: room.code,
                    roomName: room.name,
                    playerId,
                    players: getPlayersList(room),
                    timerDuration: room.timerDuration,
                    isPublic: room.isPublic,
                    maxPlayers: room.maxPlayers
                }));

                console.log(`Room ${room.code} ("${room.name}") created by ${message.playerName}`);
                break;
            }

            case 'GET_PUBLIC_ROOMS': {
                ws.send(JSON.stringify({
                    type: 'PUBLIC_ROOMS_LIST',
                    rooms: getPublicRooms()
                }));
                break;
            }

            case 'SET_TIMER': {
                const room = getRoom(roomCode);
                if (!room || playerId !== room.hostId) return;

                room.timerDuration = parseInt(message.duration);
                console.log(`Room ${room.code} timer set to ${room.timerDuration}s`);

                broadcast(room, {
                    type: 'TIMER_UPDATED',
                    duration: room.timerDuration
                });
                break;
            }

            case 'REJOIN_ROOM': {
                const room = getRoom(message.roomCode);
                if (!room) {
                    ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
                    return;
                }

                const player = room.players.get(message.playerId);
                if (!player) {
                    ws.send(JSON.stringify({ type: 'ERROR', message: 'Session expired' }));
                    return;
                }

                // Update session
                playerId = player.id;
                roomCode = room.code;
                player.ws = ws;
                player.connected = true;

                ws.send(JSON.stringify({
                    type: 'FULL_SYNC',
                    data: getFullSyncData(room, playerId)
                }));

                broadcast(room, {
                    type: 'PLAYER_UPDATED',
                    players: getPlayersList(room)
                }, playerId);

                console.log(`${player.name} rejoined room ${roomCode}`);
                break;
            }

            case 'JOIN_ROOM': {
                const room = getRoom(message.roomCode);

                if (!room) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Room not found'
                    }));
                    return;
                }

                if (room.phase !== PHASES.LOBBY) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Game already in progress'
                    }));
                    return;
                }

                if (room.players.size >= room.maxPlayers) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Room is full'
                    }));
                    return;
                }

                // Check for duplicate name and auto-resolve
                let finalName = message.playerName || '';
                if (!finalName || finalName.trim() === '') {
                    const count = room.players.size + 1;
                    finalName = `Player ${count}`;
                }

                // Ensure name is unique by appending number if needed
                let originalName = finalName;
                let suffix = 2;
                const existingNames = Array.from(room.players.values()).map(p => p.name.toLowerCase());

                while (existingNames.includes(finalName.toLowerCase())) {
                    finalName = `${originalName} ${suffix}`;
                    suffix++;
                }

                const name = finalName; // Use the resolved unique name

                playerId = generatePlayerId();
                roomCode = room.code;

                room.players.set(playerId, {
                    id: playerId,
                    name: name,
                    connected: true,
                    ws
                });
                room.scores.set(playerId, 0);

                ws.send(JSON.stringify({
                    type: 'ROOM_JOINED',
                    roomCode: room.code,
                    roomName: room.name,
                    playerId,
                    hostId: room.hostId,
                    players: getPlayersList(room),
                    timerDuration: room.timerDuration
                }));

                broadcast(room, {
                    type: 'PLAYER_JOINED',
                    playerId,
                    playerName: name,
                    players: getPlayersList(room)
                }, playerId);

                console.log(`${name} joined room ${room.code}`);
                break;
            }

            case 'UPDATE_NAME': {
                const room = getRoom(roomCode);
                if (!room) return;

                const player = room.players.get(playerId);
                if (!player) return;

                const newName = message.newName?.trim();
                if (!newName || newName.length > 20) return;

                // Only allow name change in Lobby or Results phase
                if (room.phase !== PHASES.LOBBY && room.phase !== PHASES.RESULTS) {
                    return;
                }

                // Check if name is taken
                const existingNames = Array.from(room.players.values())
                    .filter(p => p.id !== playerId)
                    .map(p => p.name.toLowerCase());

                if (existingNames.includes(newName.toLowerCase())) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Name already taken'
                    }));
                    return;
                }

                const oldName = player.name;
                player.name = newName;

                console.log(`Player ${playerId} changed name: ${oldName} -> ${newName}`);

                broadcast(room, {
                    type: 'PLAYER_UPDATED',
                    players: getPlayersList(room)
                });
                break;
            }

            case 'START_GAME': {
                const room = getRoom(roomCode);
                if (!room || playerId !== room.hostId) return;

                if (room.players.size < 3) {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Need at least 3 players'
                    }));
                    return;
                }

                startGame(room, message.topic);
                console.log(`Game started in room ${roomCode} with topic ${message.topic}`);
                break;
            }

            case 'READY_FOR_HINTS': {
                const room = getRoom(roomCode);
                if (!room) return;

                // When all players confirm they've seen their role, start hint phase
                // For simplicity, host triggers this
                if (playerId === room.hostId && room.phase === PHASES.ROLE_REVEAL) {
                    startHintPhase(room);
                }
                break;
            }

            case 'HINT_TYPING': {
                const room = getRoom(roomCode);
                if (!room || room.phase !== PHASES.HINT_WRITING) return;

                handleHintTyping(room, playerId, message.hint);
                break;
            }

            case 'SUBMIT_HINT': {
                const room = getRoom(roomCode);
                if (!room || room.phase !== PHASES.HINT_WRITING) return;

                submitHint(room, playerId, message.hint);
                console.log(`${room.players.get(playerId)?.name} submitted hint`);
                break;
            }

            case 'START_VOTING': {
                const room = getRoom(roomCode);
                if (!room) return;

                if (playerId === room.hostId && room.phase === PHASES.HINTS_REVEAL) {
                    startVotingPhase(room);
                }
                break;
            }

            case 'SUBMIT_VOTE': {
                const room = getRoom(roomCode);
                if (!room || room.phase !== PHASES.VOTING) return;

                submitVote(room, playerId, message.targetId);
                console.log(`${room.players.get(playerId)?.name} voted`);
                break;
            }

            case 'ESCAPE_GUESS': {
                const room = getRoom(roomCode);
                if (!room || playerId !== room.foxId || room.phase !== PHASES.ESCAPE) return;

                attemptEscape(room, message.word);
                console.log(`Fox guessed: ${message.word}`);
                break;
            }

            case 'PLAY_AGAIN': {
                const room = getRoom(roomCode);
                if (!room || playerId !== room.hostId) return;

                returnToLobby(room);
                break;
            }

            case 'LEAVE_GAME': {
                const room = getRoom(roomCode);
                if (!room) return;

                const player = room.players.get(playerId);
                if (!player) return;

                console.log(`${player.name} left room ${roomCode}`);

                // Remove player
                room.players.delete(playerId);
                room.scores.delete(playerId);
                room.hints.delete(playerId);
                room.votes.delete(playerId);

                // If room is empty, delete it
                if (room.players.size === 0) {
                    rooms.delete(roomCode);
                    console.log(`Room ${roomCode} deleted (empty)`);
                    return;
                }

                // Handle Host Delegation
                let hostChanged = false;
                if (playerId === room.hostId) {
                    // Map preserves insertion order, so the first key is the next player
                    const nextHostId = room.players.keys().next().value;
                    if (nextHostId) {
                        room.hostId = nextHostId;
                        hostChanged = true;
                        console.log(`Host delegated to ${room.players.get(nextHostId).name} in room ${roomCode}`);
                    }
                }

                // Broadcast update
                broadcast(room, {
                    type: 'PLAYER_LEFT',
                    leftPlayerId: playerId,
                    players: getPlayersList(room),
                    newHostId: hostChanged ? room.hostId : null
                });
                break;
            }

            case 'PING': {
                ws.send(JSON.stringify({ type: 'PONG' }));
                break;
            }
        }
    });

    ws.on('close', () => {
        console.log('Connection closed');
        if (roomCode && playerId) {
            const room = getRoom(roomCode);
            if (room) {
                handleDisconnect(room, playerId);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`\n🦊 Fox Game Server running!`);
    console.log(`   HTTP:      http://localhost:${PORT}`);
    console.log(`   WebSocket: ws://localhost:${PORT}`);
    console.log(`\n   Open http://localhost:${PORT} in your browser to play!\n`);
});
