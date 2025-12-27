/**
 * Fox Game - Core Game Logic
 */

const GameState = {
    // Game phases
    PHASES: {
        SETUP: 'setup',
        TOPIC: 'topic',
        ROLE_REVEAL: 'role_reveal',
        WORD_REVEAL: 'word_reveal',
        HINT_WRITING: 'hint_writing',
        FOX_PEEK: 'fox_peek',
        HINTS_REVEAL: 'hints_reveal',
        VOTING: 'voting',
        ESCAPE: 'escape',
        RESULTS: 'results'
    },

    // Current state
    phase: 'setup',
    players: [],
    foxIndex: -1,
    selectedTopic: null,
    selectedWord: null,
    words: [],
    hints: {},
    votes: {},
    scores: {},
    currentHintPlayer: 0,
    timer: null,
    timeRemaining: 0,
    peekHintPlayer: null,

    /**
     * Initialize or reset game
     */
    init() {
        this.phase = this.PHASES.SETUP;
        this.players = [];
        this.foxIndex = -1;
        this.selectedTopic = null;
        this.selectedWord = null;
        this.words = [];
        this.hints = {};
        this.votes = {};
        this.currentHintPlayer = 0;
        this.peekHintPlayer = null;
        if (this.timer) clearInterval(this.timer);
    },

    /**
     * Add a player
     */
    addPlayer(name) {
        if (name && name.trim() && this.players.length < 8) {
            const trimmedName = name.trim();
            if (!this.players.includes(trimmedName)) {
                this.players.push(trimmedName);
                if (!this.scores[trimmedName]) {
                    this.scores[trimmedName] = 0;
                }
                return true;
            }
        }
        return false;
    },

    /**
     * Remove a player
     */
    removePlayer(index) {
        if (index >= 0 && index < this.players.length) {
            this.players.splice(index, 1);
        }
    },

    /**
     * Set topic and start game
     */
    startGame(topicKey) {
        if (this.players.length < 3) return false;

        const pack = getPack(topicKey);
        if (!pack) return false;

        this.selectedTopic = topicKey;
        this.words = [...pack.words];

        // Select random fox
        this.foxIndex = Math.floor(Math.random() * this.players.length);

        // Select random secret word
        const wordIndex = Math.floor(Math.random() * this.words.length);
        this.selectedWord = this.words[wordIndex];

        // Reset hints and votes
        this.hints = {};
        this.votes = {};
        this.currentHintPlayer = 0;

        // Select random player for fox to peek at (not the fox)
        const nonFoxPlayers = this.players.filter((_, i) => i !== this.foxIndex);
        this.peekHintPlayer = nonFoxPlayers[Math.floor(Math.random() * nonFoxPlayers.length)];

        this.phase = this.PHASES.ROLE_REVEAL;
        return true;
    },

    /**
     * Get current fox player name
     */
    getFoxName() {
        return this.players[this.foxIndex];
    },

    /**
     * Check if player is the fox
     */
    isFox(playerName) {
        return this.players[this.foxIndex] === playerName;
    },

    /**
     * Submit a hint
     */
    submitHint(playerName, hint) {
        this.hints[playerName] = hint.trim() || '(no hint)';
    },

    /**
     * Submit a vote
     */
    submitVote(voterName, suspectName) {
        this.votes[voterName] = suspectName;
    },

    /**
     * Get voting results
     */
    getVotingResults() {
        const voteCounts = {};
        Object.values(this.votes).forEach(suspect => {
            voteCounts[suspect] = (voteCounts[suspect] || 0) + 1;
        });
        return voteCounts;
    },

    /**
     * Determine if fox was caught
     * Returns: { caught: boolean, consensus: boolean, findersCount: number, finders: string[] }
     */
    determineFoxCaught() {
        const voteCounts = this.getVotingResults();
        const foxName = this.getFoxName();
        const foxVotes = voteCounts[foxName] || 0;
        const totalVoters = Object.keys(this.votes).length;

        // Find who voted for the fox
        const finders = Object.entries(this.votes)
            .filter(([voter, suspect]) => suspect === foxName)
            .map(([voter]) => voter);

        // Consensus = majority voted for fox
        const consensus = foxVotes > totalVoters / 2;

        return {
            caught: consensus,
            consensus: consensus,
            findersCount: finders.length,
            finders: finders
        };
    },

    /**
     * Fox attempts escape by guessing word
     */
    attemptEscape(guessedWord) {
        return guessedWord === this.selectedWord;
    },

    /**
     * Calculate and apply scores
     */
    calculateScores(foxCaught, foxEscaped, finders) {
        const foxName = this.getFoxName();
        const scoreChanges = {};

        this.players.forEach(p => scoreChanges[p] = 0);

        if (!foxCaught) {
            // Fox not caught (no consensus) - fox gets 3 points
            scoreChanges[foxName] = 3;

            // If exactly 1 person found the fox, they get 2 bonus points
            if (finders.length === 1) {
                scoreChanges[finders[0]] = 2;
            }
        } else if (foxEscaped) {
            // Fox caught but escaped - fox gets 2 points
            scoreChanges[foxName] = 2;
        } else {
            // Fox caught and didn't escape - everyone else gets 1 point
            this.players.forEach(p => {
                if (p !== foxName) {
                    scoreChanges[p] = 1;
                }
            });
        }

        // Apply score changes
        Object.entries(scoreChanges).forEach(([player, change]) => {
            this.scores[player] = (this.scores[player] || 0) + change;
        });

        return scoreChanges;
    },

    /**
     * Start timer
     */
    startTimer(seconds, onTick, onComplete) {
        this.timeRemaining = seconds;
        if (this.timer) clearInterval(this.timer);

        onTick(this.timeRemaining);

        this.timer = setInterval(() => {
            this.timeRemaining--;
            onTick(this.timeRemaining);

            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);
                onComplete();
            }
        }, 1000);
    },

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    /**
     * Get sorted scores
     */
    getSortedScores() {
        return Object.entries(this.scores)
            .filter(([player]) => this.players.includes(player))
            .sort((a, b) => b[1] - a[1]);
    }
};
