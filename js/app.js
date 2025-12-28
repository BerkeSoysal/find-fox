/**
 * Fox Game - Online Multiplayer App Controller
 */

const App = {
    // Local state
    players: [],
    isFox: false,
    timerDuration: 15,
    secretWord: null,
    words: [],
    hints: [],
    selectedTopic: null,
    selectedVote: null,
    escapeGuess: null,
    hasSubmittedHint: false,
    hasSubmittedVote: false,
    peekPlayerId: null,
    peekPlayerName: null,

    // Timer state
    timers: {},

    /**
     * Start a countdown timer
     */
    startTimer(name, seconds, onComplete) {
        // Clear any existing timer with this name
        this.stopTimer(name);

        let remaining = seconds;
        const timerBar = document.getElementById(`${name}-timer-bar`);
        const timerText = document.getElementById(`${name}-timer-text`);

        const updateTimer = () => {
            if (timerBar) {
                const percent = (remaining / seconds) * 100;
                timerBar.style.width = percent + '%';
                if (remaining <= 5) {
                    timerBar.classList.add('danger');
                } else if (remaining <= 10) {
                    timerBar.classList.add('warning');
                }
            }
            if (timerText) {
                timerText.textContent = remaining;
            }
        };

        updateTimer();

        this.timers[name] = setInterval(() => {
            remaining--;
            updateTimer();

            if (remaining <= 0) {
                this.stopTimer(name);
                if (onComplete) onComplete();
            }
        }, 1000);
    },

    /**
     * Stop a timer
     */
    stopTimer(name) {
        if (this.timers[name]) {
            clearInterval(this.timers[name]);
            delete this.timers[name];
        }
    },

    /**
     * Stop all timers
     */
    stopAllTimers() {
        Object.keys(this.timers).forEach(name => this.stopTimer(name));
    },

    /**
     * Initialize app
     */
    async init() {
        this.setupSocketHandlers();
        this.updateConnectionStatus('connecting');

        try {
            await Socket.connect();
            this.updateConnectionStatus('connected');

            // Check if there is a room code in the URL
            this.checkUrlForRoom();
        } catch (error) {
            this.updateConnectionStatus('disconnected');
            this.showError('Failed to connect to server');
        }

        // Listen for back/forward buttons
        window.addEventListener('popstate', () => this.checkUrlForRoom());
    },

    /**
     * Check current URL for a room code and update UI
     */
    checkUrlForRoom() {
        const path = window.location.pathname.substring(1).toUpperCase();
        // If it looks like a room code (4 chars)
        if (path.length === 4 && /^[A-Z0-9]+$/.test(path)) {
            // Fill join input and show join screen
            const codeInput = document.getElementById('room-code-input');
            if (codeInput) codeInput.value = path;
            this.showJoinRoom();
        } else if (path === '') {
            // Root path - show welcome unless we are already in a game
            // (We don't want to force welcome if they are already in lobby/game)
            const activeScreen = document.querySelector('.screen.active');
            if (!activeScreen || activeScreen.id === 'join-room-screen' || activeScreen.id === 'create-room-screen') {
                this.showWelcome();
            }
        }
    },

    /**
     * Setup socket event handlers
     */
    setupSocketHandlers() {
        Socket.onConnect = () => {
            this.updateConnectionStatus('connected');
        };

        Socket.onDisconnect = () => {
            this.updateConnectionStatus('disconnected');
        };

        Socket.onError = (error) => {
            this.showError(error.message || 'Connection error');
        };

        Socket.onRoomCreated = (data) => {
            this.showLobby(data);
        };

        Socket.onRoomJoined = (data) => {
            this.showLobby(data);
        };

        Socket.onPlayerJoined = (data) => {
            this.updateLobbyPlayers(data.players);
        };

        Socket.onPlayerDisconnected = (data) => {
            this.updateLobbyPlayers(data.players);
        };

        Socket.onGameStarted = (data) => {
            this.handleGameStarted(data);
        };

        Socket.onPhaseChange = (data) => {
            this.handlePhaseChange(data);
        };

        Socket.onHintSubmitted = (data) => {
            this.updateHintProgress(data);
        };

        Socket.onPeekHintUpdate = (data) => {
            this.updatePeekHint(data);
        };

        Socket.onTimerUpdated = (data) => {
            this.timerDuration = data.duration;
            this.updateTimerUI();
        };



        Socket.onVoteSubmitted = (data) => {
            this.updateVoteProgress(data);
        };

        Socket.onFoxCaught = (data) => {
            this.showWaitingEscape(data);
        };

        Socket.onEscapePhase = (data) => {
            this.showEscapePhase(data);
        };

        Socket.onGameOver = (data) => {
            this.showResults(data);
        };

        Socket.onReturnToLobby = (data) => {
            this.returnToLobby(data);
        };

        Socket.onPublicRoomsList = (rooms) => {
            this.renderPublicRooms(rooms);
        };
    },

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connection-status');
        const textEl = statusEl.querySelector('.status-text');

        statusEl.className = 'connection-status ' + status;

        switch (status) {
            case 'connected':
                textEl.textContent = 'Connected';
                break;
            case 'connecting':
                textEl.textContent = 'Connecting...';
                break;
            case 'disconnected':
                textEl.textContent = 'Disconnected';
                break;
        }
    },

    /**
     * Show error toast
     */
    showError(message) {
        const toast = document.getElementById('error-toast');
        const msgEl = document.getElementById('error-message');
        msgEl.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    /**
     * Show a specific screen
     */
    showScreen(screenId) {
        this.stopAllTimers();
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    /**
     * Show welcome screen
     */
    showWelcome() {
        if (window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
        }
        this.showScreen('welcome-screen');
        Socket.getPublicRooms();
    },

    /**
     * Show create room screen
     */
    showCreateRoom() {
        this.showScreen('create-room-screen');
        document.getElementById('host-name-input').focus();
    },

    /**
     * Show join room screen
     */
    showJoinRoom() {
        this.showScreen('join-room-screen');
        document.getElementById('room-code-input').focus();
    },

    /**
     * Create a new room
     */
    createRoom() {
        const name = document.getElementById('host-name-input').value.trim();
        const isPublic = document.getElementById('room-public-toggle').checked;
        const maxPlayers = parseInt(document.getElementById('max-players-range').value);

        if (!name) {
            this.showError('Please enter your name');
            return;
        }
        Socket.createRoom(name, isPublic, maxPlayers);
    },

    /**
     * Join an existing room
     */
    joinRoom() {
        const code = document.getElementById('room-code-input').value.trim().toUpperCase();
        const name = document.getElementById('join-name-input').value.trim();

        if (!code || code.length !== 4) {
            this.showError('Please enter a valid 4-character room code');
            return;
        }
        if (!name) {
            this.showError('Please enter your name');
            return;
        }

        Socket.joinRoom(code, name);
    },

    /**
     * Show lobby
     */
    showLobby(data) {
        document.getElementById('lobby-room-code').textContent = data.roomCode;
        this.timerDuration = data.timerDuration || 15;
        this.updateLobbyPlayers(data.players);
        this.renderTopicGrid();
        this.updateTimerUI();

        // Update URL to include room code without reloading
        if (window.location.pathname.substring(1).toUpperCase() !== data.roomCode) {
            window.history.pushState({ roomCode: data.roomCode }, '', `/${data.roomCode}`);
        }

        // Show appropriate controls
        if (Socket.isHost) {
            document.getElementById('host-controls').style.display = 'block';
            document.getElementById('host-timer-settings').style.display = 'block';
            document.getElementById('guest-message').style.display = 'none';
            document.getElementById('guest-timer-status').style.display = 'none';
        } else {
            document.getElementById('host-controls').style.display = 'none';
            document.getElementById('host-timer-settings').style.display = 'none';
            document.getElementById('guest-message').style.display = 'block';
            document.getElementById('guest-timer-status').style.display = 'block';
        }

        this.showScreen('lobby-screen');
    },

    /**
     * Update lobby players list
     */
    updateLobbyPlayers(players) {
        this.players = players;
        const container = document.getElementById('lobby-players');

        container.innerHTML = players.map(p => `
      <div class="lobby-player ${p.connected ? '' : 'disconnected'}">
        <span class="player-status-dot ${p.connected ? 'online' : 'offline'}"></span>
        <span class="player-name">${p.name} <span class="player-score-inline">(${p.score || 0} pts)</span></span>
        ${p.isHost ? '<span class="host-badge">HOST</span>' : ''}
      </div>
    `).join('');

        // Update status text
        const statusEl = document.getElementById('lobby-status');
        const connectedCount = players.filter(p => p.connected).length;

        if (connectedCount < 3) {
            statusEl.textContent = `Need ${3 - connectedCount} more player(s) to start`;
        } else {
            statusEl.textContent = `${connectedCount} players ready!`;
        }

        // Update start button
        const startBtn = document.getElementById('lobby-start-btn');
        if (startBtn) {
            startBtn.disabled = connectedCount < 3 || !this.selectedTopic;
            startBtn.textContent = connectedCount < 3
                ? `Start Game (${3 - connectedCount} more needed)`
                : 'Start Game 🎮';
        }
    },

    /**
     * Render topic selection grid
     */
    renderTopicGrid() {
        const grid = document.getElementById('lobby-topic-grid');
        const topics = getAllTopics();

        grid.innerHTML = topics.map(t => `
      <button class="topic-btn" data-topic="${t.key}" onclick="App.selectTopic('${t.key}')">
        <span class="topic-icon">${t.icon}</span>
        ${t.name}
      </button>
    `).join('');
    },

    /**
     * Select topic
     */
    selectTopic(key) {
        this.selectedTopic = key;
        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.topic === key);
        });

        // Update start button
        const startBtn = document.getElementById('lobby-start-btn');
        const connectedCount = this.players.filter(p => p.connected).length;
        startBtn.disabled = connectedCount < 3 || !this.selectedTopic;
    },

    /**
     * Copy room code to clipboard
     */
    copyRoomCode() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const hint = document.querySelector('.copy-hint');
            hint.textContent = 'Link Copied!';
            setTimeout(() => {
                hint.textContent = 'Tap to copy link';
            }, 2000);
        });
    },

    /**
     * Start game from lobby (host)
     */
    startGameFromLobby() {
        if (!this.selectedTopic) {
            this.showError('Please select a topic');
            return;
        }
        Socket.startGame(this.selectedTopic);
    },

    /**
     * Set timer duration (host only)
     */
    setTimer(duration) {
        if (!Socket.isHost) return;
        this.timerDuration = duration;
        this.updateTimerUI();
        Socket.setTimerDuration(duration);
    },

    /**
     * Update timer selection UI
     */
    updateTimerUI() {
        // Update host buttons
        document.querySelectorAll('.timer-opt').forEach(btn => {
            const duration = parseInt(btn.dataset.duration);
            btn.classList.toggle('selected', duration === this.timerDuration);
        });

        // Update guest display
        const display = document.getElementById('lobby-timer-display');
        if (display) {
            display.textContent = this.timerDuration === 0 ? 'No Timer' : `${this.timerDuration}s`;
        }
    },

    /**
     * Render public rooms list
     */
    renderPublicRooms(rooms) {
        const list = document.getElementById('public-rooms-list');
        if (!list) return;

        if (!rooms || rooms.length === 0) {
            list.innerHTML = '<p class="text-muted text-center py-md">No public rooms found</p>';
            return;
        }

        list.innerHTML = rooms.map(room => `
            <div class="public-room-item" onclick="App.joinPublicRoom('${room.roomCode}')">
                <div class="room-info">
                    <span class="room-code-tag">${room.roomCode}</span>
                    <span class="player-count-tag">Lobby • ${room.playerCount}/${room.maxPlayers} players</span>
                </div>
                <button class="btn btn-secondary btn-small">Join →</button>
            </div>
        `).join('');
    },

    /**
     * Join room from public list
     */
    joinPublicRoom(code) {
        const codeInput = document.getElementById('room-code-input');
        if (codeInput) codeInput.value = code;
        this.showJoinRoom();
    },

    /**
     * Handle game started
     */
    handleGameStarted(data) {
        this.isFox = data.isFox;
        this.words = data.words;
        this.secretWord = data.secretWord;
        this.players = data.players;
        this.timerDuration = data.timerDuration || 0;
        this.hasSubmittedHint = false;
        this.hasSubmittedVote = false;

        // Store peek info if fox
        if (data.peekPlayerId) {
            this.peekPlayerId = data.peekPlayerId;
            this.peekPlayerName = data.peekPlayerName;
        }

        this.showHintInput();
    },

    /**
     * Render word grid into a container
     */
    renderWordGrid(containerId, showSecret = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = this.words.map(word => {
            const isSecret = word === this.secretWord;
            const classes = ['word-card'];
            if (showSecret && isSecret) classes.push('secret-word');

            return `<div class="${classes.join(' ')}">${word}</div>`;
        }).join('');
    },

    /**
     * Clear game state
     */
    clearGameState() {
        this.isFox = false;
        this.words = [];
        this.secretWord = null;
        this.peekPlayerId = null;
        this.peekPlayerName = null;
        this.hasSubmittedHint = false;
        this.hasSubmittedVote = false;
    },

    /**
     * Handle phase change
     */
    handlePhaseChange(data) {
        switch (data.phase) {
            case 'hint_writing':
                // Store peek info if fox
                if (data.peekPlayerId) {
                    this.peekPlayerId = data.peekPlayerId;
                    this.peekPlayerName = data.peekPlayerName;
                }
                this.showHintInput();
                break;
            case 'voting':
                if (data.hints) {
                    this.hints = data.hints;
                }
                this.showVotingInput(data.players);
                break;
        }
    },

    /**
     * Show hint input
     */
    showHintInput() {
        document.getElementById('hint-count').textContent = '0';
        document.getElementById('hint-total').textContent = this.players.length;
        document.getElementById('hint-progress-bar').style.width = '0%';
        document.getElementById('hint-input').value = '';
        document.getElementById('hint-submitted-message').style.display = 'none';
        document.getElementById('hint-input-area').style.display = 'block';

        // Render word grid (always visible)
        this.renderWordGrid('hint-word-grid', !this.isFox);

        // Show role reminder for non-fox, or fox peek section for fox
        const reminder = document.getElementById('your-word-reminder');
        const foxPeekSection = document.getElementById('fox-peek-section');
        const hintStandings = document.getElementById('hint-standings');

        // Render mini standings
        if (hintStandings) {
            hintStandings.innerHTML = `
                <div class="standings-mini mb-md">
                    <p class="standings-title">Current Standings</p>
                    <div class="standings-list">
                        ${this.players.sort((a, b) => b.score - a.score).map(p => `
                            <div class="standing-item">
                                <span>${p.name}</span>
                                <span class="standing-score">${p.score || 0} pts</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (this.isFox) {
            reminder.innerHTML = `
                <div class="role-badge mb-sm"><span class="role-icon-small">🦊</span> You are the FOX!</div>
                <div class="role-instruction mb-sm">You don't know the word. Try to blend in!</div>
                <span class="fox-warning">Fake it till you make it!</span>
            `;

            // Show realtime peek section for fox
            if (foxPeekSection && this.peekPlayerName) {
                foxPeekSection.style.display = 'block';
                document.getElementById('peek-player-name').textContent = this.peekPlayerName;
                document.getElementById('live-peek-hint').innerHTML =
                    '<span class="typing-indicator">waiting for them to type...</span>';
            }
        } else {
            reminder.innerHTML = `
                <div class="role-badge mb-sm"><span class="role-icon-small">👤</span> You are NOT the FOX</div>
                <div class="role-instruction mb-sm">Help the others find the fox!</div>
                <div class="secret-word-highlight">The word is: <strong>${this.secretWord}</strong></div>
            `;
            if (foxPeekSection) foxPeekSection.style.display = 'none';
        }

        this.showScreen('hint-screen');
        document.getElementById('hint-input').focus();

        // Start timer for hint writing if enabled
        const timerContainer = document.getElementById('hint-timer');
        if (this.timerDuration > 0) {
            if (timerContainer) timerContainer.style.display = 'block';
            this.startTimer('hint', this.timerDuration, () => {
                if (!this.hasSubmittedHint) {
                    this.submitHint();
                }
            });
        } else {
            if (timerContainer) timerContainer.style.display = 'none';
        }
    },

    /**
     * Handle hint typing (send realtime updates)
     */
    onHintTyping(value) {
        // Send typing updates to server (for fox to see)
        Socket.hintTyping(value);
    },

    /**
     * Update peek hint (realtime, fox only)
     */
    updatePeekHint(data) {
        const container = document.getElementById('live-peek-hint');
        if (container) {
            if (data.hint && data.hint.trim()) {
                container.innerHTML = `<span class="peek-text">"${data.hint}"</span>`;
            } else {
                container.innerHTML = '<span class="typing-indicator">waiting for them to type...</span>';
            }
        }
    },

    /**
     * Submit hint
     */
    submitHint() {
        if (this.hasSubmittedHint) return;

        const hint = document.getElementById('hint-input').value.trim() || '(no hint)';
        Socket.submitHint(hint);
        this.hasSubmittedHint = true;

        // Stop the hint timer
        this.stopTimer('hint');

        // Show submitted message
        document.getElementById('hint-submitted-message').style.display = 'flex';
        document.getElementById('hint-input-area').style.display = 'none';

        // Hide fox peek section after submitting
        const foxPeekSection = document.getElementById('fox-peek-section');
        if (foxPeekSection) foxPeekSection.style.display = 'none';
    },

    /**
     * Update hint progress
     */
    updateHintProgress(data) {
        this.players = data.players;
        document.getElementById('hint-count').textContent = data.hintsCount;
        document.getElementById('hint-total').textContent = data.totalPlayers;

        const percent = (data.hintsCount / data.totalPlayers) * 100;
        document.getElementById('hint-progress-bar').style.width = percent + '%';

        // Update waiting list
        const waitingPlayers = data.players.filter(p => !p.hasHint);
        const waitingEl = document.getElementById('hint-waiting-players');
        if (waitingEl) {
            waitingEl.innerHTML = waitingPlayers.map(p =>
                `<span class="waiting-player">${p.name}</span>`
            ).join('');
        }
    },

    /**
     * Show hints reveal
     */
    showHintsReveal(data) {
        this.hints = data.hints;

        // Render word grid
        this.renderWordGrid('reveal-word-grid', !this.isFox);

        const container = document.getElementById('all-hints');
        container.innerHTML = data.hints.map(h => `
      <div class="hint-item">
        <span class="hint-player">${h.playerName}:</span>
        <span class="hint-text">${h.hint}</span>
      </div>
    `).join('');

        document.getElementById('reveal-host-controls').style.display = 'none';
        document.getElementById('reveal-guest-message').style.display = 'none';

        this.showScreen('reveal-screen');
    },

    /**
     * Start voting (host)
     */
    startVoting() {
        Socket.startVoting();
    },

    /**
     * Show voting input
     */
    showVotingInput(players) {
        this.players = players || this.players;
        this.selectedVote = null;
        this.hasSubmittedVote = false;

        document.getElementById('vote-count').textContent = '0';
        document.getElementById('vote-total').textContent = this.players.length;
        document.getElementById('vote-progress-bar').style.width = '0%';
        document.getElementById('vote-submitted-message').style.display = 'none';
        document.getElementById('vote-input-area').style.display = 'block';
        document.getElementById('submit-vote-btn').disabled = true;

        // Render word grid
        this.renderWordGrid('vote-word-grid', !this.isFox);

        // Build a map of player hints for easy lookup
        const hintMap = {};
        if (this.hints && this.hints.length) {
            this.hints.forEach(h => {
                hintMap[h.playerId] = h.hint;
            });
        }

        // Filter out self - can't vote for yourself
        const otherPlayers = this.players.filter(p => p.id !== Socket.playerId);

        const container = document.getElementById('vote-options');
        container.innerHTML = otherPlayers.map(p => {
            const hint = hintMap[p.id] || '(no hint)';
            return `
              <button class="vote-btn vote-btn-with-hint" data-player-id="${p.id}" 
                      onclick="App.selectVote('${p.id}')">
                <div class="vote-player-name">${p.name}</div>
                <div class="vote-player-hint">"${hint}"</div>
              </button>
            `;
        }).join('');

        this.showScreen('voting-screen');
    },

    /**
     * Select a vote
     */
    selectVote(playerId) {
        this.selectedVote = playerId;
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.playerId === playerId);
        });
        document.getElementById('submit-vote-btn').disabled = false;
    },

    /**
     * Submit vote
     */
    submitVote() {
        if (!this.selectedVote || this.hasSubmittedVote) return;

        Socket.submitVote(this.selectedVote);
        this.hasSubmittedVote = true;

        // Stop the vote timer
        this.stopTimer('vote');

        document.getElementById('vote-submitted-message').style.display = 'flex';
        document.getElementById('vote-input-area').style.display = 'none';
    },

    /**
     * Update vote progress
     */
    updateVoteProgress(data) {
        this.players = data.players;
        document.getElementById('vote-count').textContent = data.votesCount;
        document.getElementById('vote-total').textContent = data.totalPlayers;

        const percent = (data.votesCount / data.totalPlayers) * 100;
        document.getElementById('vote-progress-bar').style.width = percent + '%';

        // Update waiting list
        const waitingPlayers = data.players.filter(p => !p.hasVoted);
        const waitingEl = document.getElementById('vote-waiting-players');
        if (waitingEl) {
            waitingEl.innerHTML = waitingPlayers.map(p =>
                `<span class="waiting-player">${p.name}</span>`
            ).join('');
        }
    },

    /**
     * Show waiting for escape (non-fox players)
     */
    showWaitingEscape(data) {
        document.getElementById('caught-fox-name').textContent =
            `${data.foxName} was caught!`;

        // Render word grid
        this.renderWordGrid('waiting-escape-word-grid', true);

        this.showScreen('waiting-escape-screen');
    },

    /**
     * Show escape phase (fox only)
     */
    showEscapePhase(data) {
        this.words = data.words;
        this.escapeGuess = null;

        const grid = document.getElementById('escape-word-grid');
        grid.innerHTML = data.words.map(word => `
      <div class="word-card selectable" data-word="${word}" 
           onclick="App.selectEscapeWord('${word}')">
        ${word}
      </div>
    `).join('');

        document.getElementById('escape-btn').disabled = true;
        this.showScreen('escape-screen');
    },

    /**
     * Select escape word
     */
    selectEscapeWord(word) {
        this.escapeGuess = word;
        document.querySelectorAll('#escape-word-grid .word-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.word === word);
        });
        document.getElementById('escape-btn').disabled = false;
    },

    /**
     * Attempt escape
     */
    attemptEscape() {
        if (!this.escapeGuess) return;
        this.stopTimer('escape');
        Socket.escapeGuess(this.escapeGuess);
    },

    /**
     * Show results
     */
    showResults(data) {
        // Store the secret word from results
        this.secretWord = data.secretWord;

        let icon, title, message;

        switch (data.result) {
            case 'fox_wins':
                icon = '🦊';
                title = 'Fox Wins!';
                if (data.finders.length === 1) {
                    message = `${data.foxName} wasn't caught! But ${data.finders[0]} was suspicious.`;
                } else {
                    message = `${data.foxName} successfully blended in! No consensus reached.`;
                }
                break;
            case 'fox_escapes':
                icon = '🦊✨';
                title = 'Fox Escapes!';
                message = `${data.foxName} was caught but correctly guessed "${data.secretWord}"!`;
                break;
            case 'fox_caught':
                icon = '🎉';
                title = 'Fox Caught!';
                message = `${data.foxName} was the fox and failed to guess the word "${data.secretWord}"!`;
                break;
        }

        document.getElementById('result-icon').textContent = icon;
        document.getElementById('result-title').textContent = title;
        document.getElementById('result-message').textContent = message;

        // Show details
        const details = document.getElementById('result-details');
        details.innerHTML = `
      <div class="hint-item">
        <span class="hint-player">The Fox was:</span>
        <span class="hint-text">${data.foxName} 🦊</span>
      </div>
      <div class="hint-item">
        <span class="hint-player">The word was:</span>
        <span class="hint-text">${data.secretWord}</span>
      </div>
    `;

        // Render word grid with secret revealed
        this.renderWordGrid('results-word-grid', true);

        // Render scoreboard
        const scoreboard = document.getElementById('scoreboard');
        scoreboard.innerHTML = data.scores.map(s => {
            const changeHtml = s.change > 0
                ? `<span class="score-change positive">+${s.change}</span>`
                : '';

            return `
        <div class="score-row ${s.isFox ? 'fox-row' : ''}">
          <span class="score-name">
            ${s.isFox ? '🦊 ' : ''}${s.playerName}
          </span>
          <span class="score-value">${s.score}${changeHtml}</span>
        </div>
      `;
        }).join('');

        // Show appropriate controls
        if (Socket.isHost) {
            document.getElementById('results-host-controls').style.display = 'block';
            document.getElementById('results-guest-message').style.display = 'none';
        } else {
            document.getElementById('results-host-controls').style.display = 'none';
            document.getElementById('results-guest-message').style.display = 'block';
        }

        this.showScreen('results-screen');
    },

    /**
     * Play again (host)
     */
    playAgain() {
        Socket.playAgain();
    },

    /**
     * Return to lobby
     */
    returnToLobby(data) {
        this.selectedTopic = null;
        this.isFox = false;
        this.secretWord = null;
        this.hasSubmittedHint = false;
        this.hasSubmittedVote = false;
        this.peekPlayerId = null;
        this.peekPlayerName = null;

        this.updateLobbyPlayers(data.players);
        this.renderTopicGrid();

        // Reset topic selection UI
        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Show appropriate controls
        if (Socket.isHost) {
            document.getElementById('host-controls').style.display = 'block';
            document.getElementById('guest-message').style.display = 'none';
        } else {
            document.getElementById('host-controls').style.display = 'none';
            document.getElementById('guest-message').style.display = 'block';
        }

        this.showScreen('lobby-screen');
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
