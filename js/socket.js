/**
 * Fox Game - WebSocket Client
 * Handles real-time communication with the game server
 */

const Socket = {
    ws: null,
    playerId: null,
    roomCode: null,
    isHost: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    pingInterval: null,

    // Event handlers (set by App)
    onConnect: null,
    onDisconnect: null,
    onError: null,
    onRoomCreated: null,
    onRoomJoined: null,
    onPlayerJoined: null,
    onPlayerDisconnected: null,
    onGameStarted: null,
    onPhaseChange: null,
    onHintSubmitted: null,
    onPeekHintUpdate: null,
    onTimerUpdated: null,
    onHintsRevealed: null,
    onVoteSubmitted: null,
    onFoxCaught: null,
    onEscapePhase: null,
    onGameOver: null,
    onReturnToLobby: null,
    onPublicRoomsList: null,
    onPlayerUpdated: null,
    onFullSync: null,

    /**
     * Connect to WebSocket server
     */
    connect() {
        return new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host || 'localhost:3001';
            const url = `${protocol}//${host}`;

            console.log('Connecting to', url);

            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.startPing();
                if (this.onConnect) this.onConnect();
                resolve();
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.stopPing();
                if (this.onDisconnect) this.onDisconnect();
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                if (this.onError) this.onError(error);
                reject(error);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
        });
    },

    /**
     * Handle incoming messages
     */
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
                if (this.onRoomCreated) this.onRoomCreated(message);
                break;

            case 'ROOM_JOINED':
                this.playerId = message.playerId;
                this.roomCode = message.roomCode;
                this.isHost = message.playerId === message.hostId;
                if (this.onRoomJoined) this.onRoomJoined(message);
                break;

            case 'PLAYER_JOINED':
                if (this.onPlayerJoined) this.onPlayerJoined(message);
                break;

            case 'PLAYER_DISCONNECTED':
                if (this.onPlayerDisconnected) this.onPlayerDisconnected(message);
                break;

            case 'PLAYER_LEFT':
                // Treat same as disconnected for UI purposes usually, but might want custom logic
                if (this.onPlayerDisconnected) this.onPlayerDisconnected(message);
                break;

            case 'GAME_STARTED':
                if (this.onGameStarted) this.onGameStarted(message);
                break;

            case 'PHASE_CHANGE':
                if (this.onPhaseChange) this.onPhaseChange(message);
                break;

            case 'HINT_SUBMITTED':
                if (this.onHintSubmitted) this.onHintSubmitted(message);
                break;

            case 'PEEK_HINT_UPDATE':
                if (this.onPeekHintUpdate) this.onPeekHintUpdate(message);
                break;

            case 'TIMER_UPDATED':
                if (this.onTimerUpdated) this.onTimerUpdated(message);
                break;

            case 'HINTS_REVEALED':
                if (this.onHintsRevealed) this.onHintsRevealed(message);
                break;

            case 'VOTE_SUBMITTED':
                if (this.onVoteSubmitted) this.onVoteSubmitted(message);
                break;

            case 'FOX_CAUGHT':
                if (this.onFoxCaught) this.onFoxCaught(message);
                break;

            case 'ESCAPE_PHASE':
                if (this.onEscapePhase) this.onEscapePhase(message);
                break;

            case 'GAME_OVER':
                if (this.onGameOver) this.onGameOver(message);
                break;

            case 'RETURN_TO_LOBBY':
                if (this.onReturnToLobby) this.onReturnToLobby(message);
                break;

            case 'PUBLIC_ROOMS_LIST':
                if (this.onPublicRoomsList) this.onPublicRoomsList(message.rooms);
                break;

            case 'PLAYER_UPDATED':
                if (this.onPlayerUpdated) this.onPlayerUpdated(message);
                break;

            case 'FULL_SYNC':
                this.playerId = message.data.playerId;
                this.roomCode = message.data.roomCode;
                this.isHost = message.data.playerId === message.data.hostId;
                if (this.onFullSync) this.onFullSync(message.data);
                break;

            case 'ERROR':
                console.error('Server error:', message.message);
                if (this.onError) this.onError(new Error(message.message));
                break;

            case 'PONG':
                // Heartbeat response
                break;
        }
    },

    /**
     * Send message to server
     */
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Sending:', message.type, message);
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('Cannot send message, socket not open:', message.type);
        }
    },

    /**
     * Create a new room
     */
    createRoom(playerName, isPublic = false, maxPlayers = 6, roomName = null) {
        this.send({
            type: 'CREATE_ROOM',
            playerName,
            isPublic,
            maxPlayers,
            roomName
        });
    },

    /**
     * Request public rooms list
     */
    getPublicRooms() {
        this.send({
            type: 'GET_PUBLIC_ROOMS'
        });
    },

    /**
     * Set timer duration (host only)
     */
    setTimerDuration(duration) {
        this.send({
            type: 'SET_TIMER',
            duration
        });
    },

    /**
     * Join an existing room
     */
    joinRoom(roomCode, playerName = null) {
        console.log(`Joining room ${roomCode}...`);
        this.socketType = 'join';
        this.roomCode = roomCode.toUpperCase();
        this.send({
            type: 'JOIN_ROOM',
            roomCode: this.roomCode,
            playerName
        });
    },

    /**
     * Rejoin an existing room
     */
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
    },

    /**
     * Update player name
     */
    updateName(newName) {
        this.send({
            type: 'UPDATE_NAME',
            newName
        });
    },

    /**
     * Start the game (host only)
     */
    startGame(topic) {
        this.send({
            type: 'START_GAME',
            topic
        });
    },

    /**
     * Signal ready for hints phase
     */
    readyForHints() {
        this.send({
            type: 'READY_FOR_HINTS'
        });
    },

    /**
     * Send hint typing update (realtime for fox peek)
     */
    hintTyping(hint) {
        this.send({
            type: 'HINT_TYPING',
            hint
        });
    },

    /**
     * Submit a hint
     */
    submitHint(hint) {
        this.send({
            type: 'SUBMIT_HINT',
            hint
        });
    },

    /**
     * Start voting phase
     */
    startVoting() {
        this.send({
            type: 'START_VOTING'
        });
    },

    /**
     * Submit a vote
     */
    submitVote(targetId) {
        this.send({
            type: 'SUBMIT_VOTE',
            targetId
        });
    },

    /**
     * Fox escape guess
     */
    escapeGuess(word) {
        this.send({
            type: 'ESCAPE_GUESS',
            word
        });
    },

    /**
     * Play again (host only)
     */
    playAgain() {
        this.send({
            type: 'PLAY_AGAIN'
        });
    },

    /**
     * Leave the game
     */
    leaveGame() {
        this.send({
            type: 'LEAVE_GAME'
        });
        // Disconnect socket immediately after sending
        // setTimeout(() => this.disconnect(), 100);
        // Better to just clear local state in App, let socket stay open or close as needed logic in App
    },

    /**
     * Start ping interval
     */
    startPing() {
        this.pingInterval = setInterval(() => {
            this.send({ type: 'PING' });
        }, 30000);
    },

    /**
     * Stop ping interval
     */
    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    },

    /**
     * Attempt reconnection
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
            setTimeout(() => {
                this.connect().catch(() => { });
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    },

    /**
     * Disconnect
     */
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
};
