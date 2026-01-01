/**
 * WebSocket service for Fox Game
 * Handles real-time communication with the game server
 */

// Configure server URL - change this for production
// NOTE: On Android emulator, localhost refers to the emulator itself, not host machine
// Use your machine's local IP address for development
const SERVER_URL = __DEV__
    ? 'ws://192.168.100.155:3001'  // Development - use local network IP
    : 'wss://find-fox.fly.dev';  // Production

class SocketService {
    constructor() {
        this.ws = null;
        this.playerId = null;
        this.roomCode = null;
        this.isHost = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.pingInterval = null;
        this.listeners = {};
        this.socketType = null;
    }

    // Event subscription
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Connect to WebSocket server
    connect() {
        return new Promise((resolve, reject) => {
            console.log('Connecting to', SERVER_URL);

            this.ws = new WebSocket(SERVER_URL);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.startPing();
                this.emit('connect');
                resolve();
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.stopPing();
                this.emit('disconnect');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('error', error);
                reject(error);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
        });
    }

    // Handle incoming messages
    handleMessage(data) {
        let message;
        try {
            message = JSON.parse(data);
        } catch (e) {
            console.error('Invalid message:', data);
            return;
        }

        console.log('Received:', message.type, message);

        switch (message.type) {
            case 'ROOM_CREATED':
                this.playerId = message.playerId;
                this.roomCode = message.roomCode;
                this.isHost = true;
                this.emit('roomCreated', message);
                break;

            case 'ROOM_JOINED':
                this.playerId = message.playerId;
                this.roomCode = message.roomCode;
                this.isHost = message.playerId === message.hostId;
                this.emit('roomJoined', message);
                break;

            case 'PLAYER_JOINED':
                this.emit('playerJoined', message);
                break;

            case 'PLAYER_DISCONNECTED':
                this.emit('playerDisconnected', message);
                break;

            case 'PLAYER_LEFT':
                this.emit('playerLeft', message);
                break;

            case 'GAME_STARTED':
                this.emit('gameStarted', message);
                break;

            case 'PHASE_CHANGE':
                this.emit('phaseChange', message);
                break;

            case 'HINT_SUBMITTED':
                this.emit('hintSubmitted', message);
                break;

            case 'PEEK_HINT_UPDATE':
                this.emit('peekHintUpdate', message);
                break;

            case 'TIMER_UPDATED':
                this.emit('timerUpdated', message);
                break;

            case 'VOTE_SUBMITTED':
                this.emit('voteSubmitted', message);
                break;

            case 'FOX_CAUGHT':
                this.emit('foxCaught', message);
                break;

            case 'ESCAPE_PHASE':
                this.emit('escapePhase', message);
                break;

            case 'GAME_OVER':
                this.emit('gameOver', message);
                break;

            case 'RETURN_TO_LOBBY':
                this.emit('returnToLobby', message);
                break;

            case 'PUBLIC_ROOMS_LIST':
                this.emit('publicRoomsList', message.rooms);
                break;

            case 'PLAYER_UPDATED':
                this.emit('playerUpdated', message);
                break;

            case 'FULL_SYNC':
                this.playerId = message.data.playerId;
                this.roomCode = message.data.roomCode;
                this.isHost = message.data.playerId === message.data.hostId;
                this.emit('fullSync', message.data);
                break;

            case 'ERROR':
                console.error('Server error:', message.message);
                this.emit('error', new Error(message.message));
                break;

            case 'PONG':
                // Heartbeat response
                break;
        }
    }

    // Send message to server
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Sending:', message.type, message);
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('Cannot send message, socket not open:', message.type);
        }
    }

    // API methods
    createRoom(playerName, isPublic = false, maxPlayers = 6, roomName = null) {
        this.send({
            type: 'CREATE_ROOM',
            playerName,
            isPublic,
            maxPlayers,
            roomName
        });
    }

    getPublicRooms() {
        this.send({ type: 'GET_PUBLIC_ROOMS' });
    }

    setTimerDuration(duration) {
        this.send({ type: 'SET_TIMER', duration });
    }

    joinRoom(roomCode, playerName = null) {
        console.log(`Joining room ${roomCode}...`);
        this.socketType = 'join';
        this.roomCode = roomCode.toUpperCase();
        this.send({
            type: 'JOIN_ROOM',
            roomCode: this.roomCode,
            playerName
        });
    }

    rejoinRoom(roomCode, playerId) {
        console.log(`Rejoining room ${roomCode} with player ID ${playerId}...`);
        this.socketType = 'rejoin';
        this.roomCode = roomCode.toUpperCase();
        this.playerId = playerId;
        this.send({
            type: 'REJOIN_ROOM',
            roomCode: this.roomCode,
            playerId
        });
    }

    updateName(newName) {
        this.send({ type: 'UPDATE_NAME', newName });
    }

    startGame(topic) {
        this.send({ type: 'START_GAME', topic });
    }

    hintTyping(hint) {
        this.send({ type: 'HINT_TYPING', hint });
    }

    submitHint(hint) {
        this.send({ type: 'SUBMIT_HINT', hint });
    }

    submitVote(targetId) {
        this.send({ type: 'SUBMIT_VOTE', targetId });
    }

    escapeGuess(word) {
        this.send({ type: 'ESCAPE_GUESS', word });
    }

    playAgain() {
        this.send({ type: 'PLAY_AGAIN' });
    }

    leaveGame() {
        this.send({ type: 'LEAVE_GAME' });
    }

    // Heartbeat
    startPing() {
        this.pingInterval = setInterval(() => {
            this.send({ type: 'PING' });
        }, 30000);
    }

    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
            setTimeout(() => {
                this.connect().catch(() => { });
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    disconnect() {
        this.stopPing();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.playerId = null;
        this.roomCode = null;
        this.isHost = false;
    }

    // Reset local state without disconnecting socket
    resetState() {
        this.playerId = null;
        this.roomCode = null;
        this.isHost = false;
    }
}

// Singleton instance
export const socket = new SocketService();
export default socket;
