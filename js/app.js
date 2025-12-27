/**
 * Fox Game - Online Multiplayer App Controller
 */

const App = {
    // Local state
    players: [],
    isFox: false,
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

    /**
     * Initialize app
     */
    async init() {
        this.setupSocketHandlers();
        this.updateConnectionStatus('connecting');

        try {
            await Socket.connect();
            this.updateConnectionStatus('connected');
        } catch (error) {
            this.updateConnectionStatus('disconnected');
            this.showError('Failed to connect to server');
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

        Socket.onHintsRevealed = (data) => {
            this.showHintsReveal(data);
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
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    /**
     * Show welcome screen
     */
    showWelcome() {
        this.showScreen('welcome-screen');
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
        if (!name) {
            this.showError('Please enter your name');
            return;
        }
        Socket.createRoom(name);
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
        this.updateLobbyPlayers(data.players);
        this.renderTopicGrid();

        // Show appropriate controls
        if (Socket.isHost) {
            document.getElementById('host-controls').style.display = 'block';
            document.getElementById('guest-message').style.display = 'none';
        } else {
            document.getElementById('host-controls').style.display = 'none';
            document.getElementById('guest-message').style.display = 'block';
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
        <span class="player-name">${p.name}</span>
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
        const code = document.getElementById('lobby-room-code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const hint = document.querySelector('.copy-hint');
            hint.textContent = 'Copied!';
            setTimeout(() => {
                hint.textContent = 'Tap to copy';
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
     * Handle game started
     */
    handleGameStarted(data) {
        this.isFox = data.isFox;
        this.words = data.words;
        this.secretWord = data.secretWord;
        this.players = data.players;
        this.hasSubmittedHint = false;
        this.hasSubmittedVote = false;

        this.showRoleReveal();
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
     * Show role reveal
     */
    showRoleReveal() {
        const content = document.getElementById('role-content');

        content.className = `role-reveal ${this.isFox ? 'role-fox' : ''}`;
        content.innerHTML = `
      <div class="role-icon">${this.isFox ? '🦊' : '👤'}</div>
      <h2 class="role-title">Your Role</h2>
      <p class="text-muted mb-xl">${this.isFox
                ? "You are the FOX! You don't know the word. Try to blend in!"
                : "You are NOT the fox. You'll see the word next."}</p>
      <button class="btn btn-primary btn-block" onclick="App.proceedFromRole()">
        ${this.isFox ? "I understand 🦊" : "Show me the word"}
      </button>
    `;

        this.showScreen('role-screen');
    },

    /**
     * Proceed from role reveal
     */
    proceedFromRole() {
        if (this.isFox) {
            // Fox goes directly to waiting/hint phase
            this.confirmRole();
        } else {
            // Show word to non-fox
            this.showWordReveal();
        }
    },

    /**
     * Show word reveal
     */
    showWordReveal() {
        document.getElementById('secret-word-display').textContent = this.secretWord;
        this.renderWordGrid('word-grid-display', true);
        this.showScreen('word-screen');
    },

    /**
     * Confirm role (ready for hints)
     */
    confirmRole() {
        // For host, trigger hint phase; for others, wait
        if (Socket.isHost) {
            Socket.readyForHints();
        }
        // Show hint screen immediately
        this.showHintInput();
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

        // Show word reminder for non-fox, or fox peek section for fox
        const reminder = document.getElementById('your-word-reminder');
        const foxPeekSection = document.getElementById('fox-peek-section');

        if (this.isFox) {
            reminder.innerHTML = '<span class="fox-warning">🦊 You don\'t know the word - fake it!</span>';

            // Show realtime peek section for fox
            if (foxPeekSection && this.peekPlayerName) {
                foxPeekSection.style.display = 'block';
                document.getElementById('peek-player-name').textContent = this.peekPlayerName;
                document.getElementById('live-peek-hint').innerHTML =
                    '<span class="typing-indicator">waiting for them to type...</span>';
            }
        } else {
            reminder.innerHTML = `The word is: <strong>${this.secretWord}</strong>`;
            if (foxPeekSection) foxPeekSection.style.display = 'none';
        }

        this.showScreen('hint-screen');
        document.getElementById('hint-input').focus();
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

        // Show appropriate controls
        if (Socket.isHost) {
            document.getElementById('reveal-host-controls').style.display = 'block';
            document.getElementById('reveal-guest-message').style.display = 'none';
        } else {
            document.getElementById('reveal-host-controls').style.display = 'none';
            document.getElementById('reveal-guest-message').style.display = 'block';
        }

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

        const container = document.getElementById('vote-options');
        container.innerHTML = this.players.map(p => {
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
