import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socket from '../services/socket';

// Initial state
const initialState = {
    connectionStatus: 'disconnected', // 'connected', 'connecting', 'disconnected'
    playerId: null,
    roomCode: null,
    roomName: null,
    hostId: null,
    isHost: false,
    players: [],
    phase: 'welcome', // 'welcome', 'lobby', 'hint_writing', 'voting', 'escape', 'results'
    isFox: false,
    secretWord: null,
    words: [],
    hints: [],
    votes: [],
    timerDuration: 15,
    peekPlayerId: null,
    peekPlayerName: null,
    peekHint: '',
    hasSubmittedHint: false,
    hasSubmittedVote: false,
    selectedTopic: null,
    publicRooms: [],
    isPublic: false,
    maxPlayers: 6,
    // Results state
    lastResult: null,
    foxId: null,
    foxName: null,
    escapeGuess: null,
    finders: [],
    scores: [],
};

// Action types
const ActionTypes = {
    SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
    SET_ROOM_DATA: 'SET_ROOM_DATA',
    SET_PLAYERS: 'SET_PLAYERS',
    SET_GAME_STATE: 'SET_GAME_STATE',
    SET_PHASE: 'SET_PHASE',
    SET_HINTS: 'SET_HINTS',
    SET_VOTES: 'SET_VOTES',
    SET_TIMER_DURATION: 'SET_TIMER_DURATION',
    SET_PEEK_HINT: 'SET_PEEK_HINT',
    SET_SUBMITTED_HINT: 'SET_SUBMITTED_HINT',
    SET_SUBMITTED_VOTE: 'SET_SUBMITTED_VOTE',
    SET_SELECTED_TOPIC: 'SET_SELECTED_TOPIC',
    SET_PUBLIC_ROOMS: 'SET_PUBLIC_ROOMS',
    SET_RESULTS: 'SET_RESULTS',
    RESET_GAME: 'RESET_GAME',
    FULL_SYNC: 'FULL_SYNC',
    RESET_ALL: 'RESET_ALL',
};

// Reducer
function gameReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_CONNECTION_STATUS:
            return { ...state, connectionStatus: action.payload };

        case ActionTypes.SET_ROOM_DATA:
            return {
                ...state,
                roomCode: action.payload.roomCode,
                roomName: action.payload.roomName,
                hostId: action.payload.hostId,
                playerId: action.payload.playerId || state.playerId,
                isHost: action.payload.isHost,
                timerDuration: action.payload.timerDuration || state.timerDuration,
                isPublic: action.payload.isPublic || false,
                maxPlayers: action.payload.maxPlayers || 6,
                phase: 'lobby',
            };

        case ActionTypes.SET_PLAYERS:
            return { ...state, players: action.payload };

        case ActionTypes.SET_GAME_STATE:
            return {
                ...state,
                isFox: action.payload.isFox,
                secretWord: action.payload.secretWord,
                words: action.payload.words,
                peekPlayerId: action.payload.peekPlayerId,
                peekPlayerName: action.payload.peekPlayerName,
                phase: action.payload.phase || state.phase,
                hasSubmittedHint: false,
                hasSubmittedVote: false,
            };

        case ActionTypes.SET_PHASE:
            return { ...state, phase: action.payload };

        case ActionTypes.SET_HINTS:
            return { ...state, hints: action.payload };

        case ActionTypes.SET_VOTES:
            return { ...state, votes: action.payload };

        case ActionTypes.SET_TIMER_DURATION:
            return { ...state, timerDuration: action.payload };

        case ActionTypes.SET_PEEK_HINT:
            return { ...state, peekHint: action.payload };

        case ActionTypes.SET_SUBMITTED_HINT:
            return { ...state, hasSubmittedHint: action.payload };

        case ActionTypes.SET_SUBMITTED_VOTE:
            return { ...state, hasSubmittedVote: action.payload };

        case ActionTypes.SET_SELECTED_TOPIC:
            return { ...state, selectedTopic: action.payload };

        case ActionTypes.SET_PUBLIC_ROOMS:
            return { ...state, publicRooms: action.payload };

        case ActionTypes.SET_RESULTS:
            return {
                ...state,
                lastResult: action.payload.result,
                foxId: action.payload.foxId,
                foxName: action.payload.foxName,
                secretWord: action.payload.secretWord,
                escapeGuess: action.payload.escapeGuess,
                finders: action.payload.finders,
                scores: action.payload.scores,
                phase: 'results',
            };

        case ActionTypes.RESET_GAME:
            return {
                ...state,
                isFox: false,
                secretWord: null,
                hints: [],
                votes: [],
                hasSubmittedHint: false,
                hasSubmittedVote: false,
                selectedTopic: null,
                peekPlayerId: null,
                peekPlayerName: null,
                peekHint: '',
                phase: 'lobby',
            };

        case ActionTypes.FULL_SYNC:
            return {
                ...state,
                ...action.payload,
            };

        case ActionTypes.RESET_ALL:
            return {
                ...initialState,
                connectionStatus: state.connectionStatus,
            };

        default:
            return state;
    }
}

// Context
const GameContext = createContext(null);

// Provider
export function GameProvider({ children }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const navigationRef = useRef(null);

    // Set navigation reference
    const setNavigationRef = useCallback((ref) => {
        navigationRef.current = ref;
    }, []);

    // Connect to socket
    useEffect(() => {
        dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: 'connecting' });

        socket.connect()
            .then(() => {
                dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: 'connected' });
            })
            .catch(() => {
                dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: 'disconnected' });
            });

        // Setup socket listeners
        const unsubscribers = [
            socket.on('connect', () => {
                dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: 'connected' });
            }),
            socket.on('disconnect', () => {
                dispatch({ type: ActionTypes.SET_CONNECTION_STATUS, payload: 'disconnected' });
            }),
            socket.on('roomCreated', (data) => {
                saveSession(data.roomCode, data.playerId);
                dispatch({
                    type: ActionTypes.SET_ROOM_DATA,
                    payload: {
                        roomCode: data.roomCode,
                        roomName: data.roomName,
                        hostId: data.playerId,  // Creator is host
                        playerId: data.playerId,
                        isHost: true,
                        timerDuration: data.timerDuration,
                        isPublic: data.isPublic,
                        maxPlayers: data.maxPlayers,
                    }
                });
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
            }),
            socket.on('roomJoined', (data) => {
                saveSession(data.roomCode, data.playerId);
                dispatch({
                    type: ActionTypes.SET_ROOM_DATA,
                    payload: {
                        roomCode: data.roomCode,
                        roomName: data.roomName,
                        hostId: data.hostId,
                        playerId: data.playerId,
                        isHost: data.playerId === data.hostId,
                        timerDuration: data.timerDuration,
                    }
                });
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
            }),
            socket.on('playerJoined', (data) => {
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
            }),
            socket.on('playerDisconnected', (data) => {
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
            }),
            socket.on('playerLeft', (data) => {
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
                // Check if host changed
                if (data.newHostId && data.newHostId === socket.playerId) {
                    socket.isHost = true;
                }
            }),
            socket.on('playerUpdated', (data) => {
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
            }),
            socket.on('timerUpdated', (data) => {
                dispatch({ type: ActionTypes.SET_TIMER_DURATION, payload: data.duration });
            }),
            socket.on('publicRoomsList', (rooms) => {
                dispatch({ type: ActionTypes.SET_PUBLIC_ROOMS, payload: rooms });
            }),
            socket.on('gameStarted', (data) => {
                dispatch({
                    type: ActionTypes.SET_GAME_STATE,
                    payload: {
                        isFox: data.isFox,
                        secretWord: data.secretWord,
                        words: data.words,
                        peekPlayerId: data.peekPlayerId,
                        peekPlayerName: data.peekPlayerName,
                        phase: 'hint_writing',
                    }
                });
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
                dispatch({ type: ActionTypes.SET_TIMER_DURATION, payload: data.timerDuration });
            }),
            socket.on('phaseChange', (data) => {
                if (data.phase === 'voting') {
                    dispatch({ type: ActionTypes.SET_HINTS, payload: data.hints || [] });
                }
                dispatch({ type: ActionTypes.SET_PHASE, payload: data.phase });
                if (data.players) {
                    dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
                }
                if (data.peekPlayerId) {
                    dispatch({
                        type: ActionTypes.SET_GAME_STATE,
                        payload: {
                            ...state,
                            peekPlayerId: data.peekPlayerId,
                            peekPlayerName: data.peekPlayerName,
                        }
                    });
                }
            }),
            socket.on('hintSubmitted', (data) => {
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
            }),
            socket.on('peekHintUpdate', (data) => {
                dispatch({ type: ActionTypes.SET_PEEK_HINT, payload: data.hint || '' });
            }),
            socket.on('voteSubmitted', (data) => {
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
            }),
            socket.on('foxCaught', (data) => {
                dispatch({ type: ActionTypes.SET_PHASE, payload: 'escape' });
            }),
            socket.on('escapePhase', (data) => {
                dispatch({ type: ActionTypes.SET_PHASE, payload: 'escape' });
            }),
            socket.on('gameOver', (data) => {
                dispatch({
                    type: ActionTypes.SET_RESULTS,
                    payload: {
                        result: data.result,
                        foxId: data.foxId,
                        foxName: data.foxName,
                        secretWord: data.secretWord,
                        escapeGuess: data.escapeGuess,
                        finders: data.finders,
                        scores: data.scores,
                    }
                });
            }),
            socket.on('returnToLobby', (data) => {
                dispatch({ type: ActionTypes.RESET_GAME });
                dispatch({ type: ActionTypes.SET_PLAYERS, payload: data.players });
            }),
            socket.on('fullSync', (data) => {
                handleFullSync(data, dispatch);
            }),
            socket.on('error', (error) => {
                console.error('Socket error:', error.message);
            }),
        ];

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, []);

    // Session management
    const saveSession = async (roomCode, playerId) => {
        try {
            await AsyncStorage.setItem(`fox_game_${roomCode}`, JSON.stringify({ roomCode, playerId }));
        } catch (e) {
            console.error('Error saving session:', e);
        }
    };

    const getSession = async (roomCode) => {
        try {
            const session = await AsyncStorage.getItem(`fox_game_${roomCode}`);
            return session ? JSON.parse(session) : null;
        } catch (e) {
            console.error('Error getting session:', e);
            return null;
        }
    };

    const clearSession = async (roomCode) => {
        try {
            await AsyncStorage.removeItem(`fox_game_${roomCode}`);
        } catch (e) {
            console.error('Error clearing session:', e);
        }
    };

    // Actions
    const actions = {
        createRoom: (playerName, isPublic, maxPlayers, roomName) => {
            socket.createRoom(playerName, isPublic, maxPlayers, roomName);
        },
        joinRoom: (roomCode, playerName) => {
            socket.joinRoom(roomCode, playerName);
        },
        rejoinRoom: async (roomCode) => {
            const session = await getSession(roomCode);
            if (session) {
                socket.rejoinRoom(roomCode, session.playerId);
                return true;
            }
            return false;
        },
        getPublicRooms: () => {
            socket.getPublicRooms();
        },
        setTimer: (duration) => {
            socket.setTimerDuration(duration);
        },
        selectTopic: (topic) => {
            dispatch({ type: ActionTypes.SET_SELECTED_TOPIC, payload: topic });
        },
        startGame: () => {
            if (state.selectedTopic) {
                socket.startGame(state.selectedTopic);
            }
        },
        updateName: (newName) => {
            socket.updateName(newName);
        },
        sendHintTyping: (hint) => {
            socket.hintTyping(hint);
        },
        submitHint: (hint) => {
            socket.submitHint(hint);
            dispatch({ type: ActionTypes.SET_SUBMITTED_HINT, payload: true });
        },
        submitVote: (targetId) => {
            socket.submitVote(targetId);
            dispatch({ type: ActionTypes.SET_SUBMITTED_VOTE, payload: true });
        },
        escapeGuess: (word) => {
            socket.escapeGuess(word);
        },
        playAgain: () => {
            socket.playAgain();
        },
        leaveGame: async () => {
            socket.leaveGame();
            if (state.roomCode) {
                await clearSession(state.roomCode);
            }
            socket.resetState();
            dispatch({ type: ActionTypes.RESET_ALL });
        },
        setNavigationRef,
    };

    return (
        <GameContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </GameContext.Provider>
    );
}

// Handle full sync from server (rejoin)
function handleFullSync(data, dispatch) {
    const hasSubmittedHint = data.hints?.some(h => h.playerId === data.playerId);
    const hasSubmittedVote = data.votes?.some(v => v.playerId === data.playerId);

    dispatch({
        type: ActionTypes.FULL_SYNC,
        payload: {
            roomCode: data.roomCode,
            roomName: data.roomName,
            hostId: data.hostId,
            playerId: data.playerId,
            isHost: data.playerId === data.hostId,
            players: data.players,
            phase: data.phase,
            isFox: data.isFox,
            secretWord: data.secretWord,
            words: data.words,
            hints: data.hints || [],
            votes: data.votes || [],
            timerDuration: data.timerDuration,
            peekPlayerId: data.peekPlayerId,
            peekPlayerName: data.peekPlayerName,
            hasSubmittedHint,
            hasSubmittedVote,
            selectedTopic: data.topic,
            isPublic: data.isPublic,
            maxPlayers: data.maxPlayers,
            lastResult: data.lastResult,
            foxId: data.foxId,
            finders: data.lastFinders || [],
        }
    });
}

// Hook
export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

export default GameContext;
