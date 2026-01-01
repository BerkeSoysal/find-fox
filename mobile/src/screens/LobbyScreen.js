import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import PlayerList from '../components/PlayerList';
import TopicGrid from '../components/TopicGrid';
import { useGame } from '../context/GameContext';
import socket from '../services/socket';
import theme from '../constants/theme';

const TIMER_OPTIONS = [
    { label: 'No Timer', value: 0 },
    { label: '10s', value: 10 },
    { label: '15s', value: 15 },
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
];

export default function LobbyScreen({ navigation }) {
    const { state, actions } = useGame();
    const [localName, setLocalName] = useState('');

    // Navigate away based on phase
    useEffect(() => {
        if (state.phase === 'hint_writing') {
            navigation.replace('Hint');
        } else if (state.phase === 'welcome') {
            navigation.replace('Welcome');
        }
    }, [state.phase]);

    // Find current player name for editing
    useEffect(() => {
        const me = state.players.find(p => p.id === state.playerId);
        if (me) {
            setLocalName(me.name);
        }
    }, [state.players, state.playerId]);

    const handleShareRoom = async () => {
        try {
            await Share.share({
                message: `Join my Fox Game room!\nRoom Code: ${state.roomCode}\nhttps://find-fox.fly.dev/${state.roomCode}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleLeaveGame = () => {
        Alert.alert(
            'Leave Room',
            'Are you sure you want to leave?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: () => {
                        actions.leaveGame();
                        navigation.replace('Welcome');
                    },
                },
            ]
        );
    };

    const handleNameChange = (newName) => {
        if (newName.trim() && newName !== localName) {
            setLocalName(newName);
            actions.updateName(newName.trim());
        }
    };

    const connectedCount = state.players.filter(p => p.connected).length;
    const canStart = connectedCount >= 3 && state.selectedTopic;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <GlassCard>
                {/* Room Info */}
                <View style={styles.roomCodeDisplay}>
                    <Text style={styles.roomLabel}>Room</Text>
                    <Text style={styles.roomName}>{state.roomName || 'Unnamed Room'}</Text>
                    <Text style={styles.codeLabel}>Code</Text>
                    <Pressable onPress={handleShareRoom}>
                        <Text style={styles.roomCode}>{state.roomCode}</Text>
                        <Text style={styles.copyHint}>Tap to share link</Text>
                    </Pressable>
                </View>

                {/* Players */}
                <Text style={styles.sectionTitle}>👥 Players</Text>
                <PlayerList
                    players={state.players}
                    currentPlayerId={state.playerId}
                    onNameChange={handleNameChange}
                    showScores={true}
                />

                <Text style={styles.statusText}>
                    {connectedCount < 3
                        ? `Need ${3 - connectedCount} more player(s) to start`
                        : `${connectedCount} players ready!`
                    }
                </Text>

                {/* Timer Settings (Host Only) */}
                {state.isHost && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⏱️ Round Timer</Text>
                        <View style={styles.timerOptions}>
                            {TIMER_OPTIONS.map((opt) => {
                                const isSelected = opt.value === state.timerDuration;
                                if (isSelected) {
                                    return (
                                        <Pressable key={opt.value} onPress={() => actions.setTimer(opt.value)}>
                                            <LinearGradient
                                                colors={[theme.colors.foxGradientStart, theme.colors.foxGradientEnd]}
                                                style={[styles.timerBtn, styles.timerBtnSelected]}
                                            >
                                                <Text style={styles.timerBtnTextSelected}>{opt.label}</Text>
                                            </LinearGradient>
                                        </Pressable>
                                    );
                                }
                                return (
                                    <Pressable
                                        key={opt.value}
                                        style={styles.timerBtn}
                                        onPress={() => actions.setTimer(opt.value)}
                                    >
                                        <Text style={styles.timerBtnText}>{opt.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Timer Display (Non-Host) */}
                {!state.isHost && (
                    <View style={styles.guestTimerStatus}>
                        <Text style={styles.timerDisplayText}>
                            ⏱️ Timer: {state.timerDuration === 0 ? 'No Timer' : `${state.timerDuration}s`}
                        </Text>
                    </View>
                )}

                {/* Host Controls */}
                {state.isHost && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📚 Choose Topic</Text>
                        <TopicGrid
                            selectedTopic={state.selectedTopic}
                            onSelectTopic={actions.selectTopic}
                        />

                        <Pressable
                            onPress={() => actions.startGame()}
                            disabled={!canStart}
                        >
                            <LinearGradient
                                colors={canStart
                                    ? [theme.colors.foxGradientStart, theme.colors.foxGradientEnd]
                                    : [theme.colors.bgCard, theme.colors.bgCard]
                                }
                                style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
                            >
                                <Text style={[styles.startBtnText, !canStart && styles.startBtnTextDisabled]}>
                                    {connectedCount < 3
                                        ? `Start Game (${3 - connectedCount} more needed)`
                                        : 'Start Game 🎮'
                                    }
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                )}

                {/* Guest Message */}
                {!state.isHost && (
                    <View style={styles.guestMessage}>
                        <Text style={styles.guestMessageText}>Waiting for host to start the game...</Text>
                    </View>
                )}

                {/* Leave Button */}
                <Pressable style={styles.leaveBtn} onPress={handleLeaveGame}>
                    <Text style={styles.leaveBtnText}>Leave Room</Text>
                </Pressable>
            </GlassCard>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bgPrimary,
    },
    content: {
        padding: theme.spacing.lg,
        paddingTop: 60,
    },
    roomCodeDisplay: {
        alignItems: 'center',
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
    },
    roomLabel: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
    },
    roomName: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        marginBottom: theme.spacing.sm,
    },
    codeLabel: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        marginTop: theme.spacing.sm,
    },
    roomCode: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: 4,
    },
    copyHint: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.xs,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
    sectionTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.lg,
    },
    statusText: {
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.lg,
    },
    section: {
        marginTop: theme.spacing.xl,
    },
    timerOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        justifyContent: 'center',
    },
    timerBtn: {
        backgroundColor: theme.colors.bgGlass,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    timerBtnSelected: {
        borderColor: theme.colors.foxOrange,
    },
    timerBtnText: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
    },
    timerBtnTextSelected: {
        color: '#fff',
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
    },
    guestTimerStatus: {
        marginTop: theme.spacing.xl,
        alignItems: 'center',
    },
    timerDisplayText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.base,
    },
    startBtn: {
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },
    startBtnDisabled: {
        opacity: 0.5,
    },
    startBtnText: {
        color: '#fff',
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
    },
    startBtnTextDisabled: {
        color: theme.colors.textSecondary,
    },
    guestMessage: {
        marginTop: theme.spacing.xl,
        alignItems: 'center',
    },
    guestMessageText: {
        color: theme.colors.textMuted,
    },
    leaveBtn: {
        marginTop: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)',
        alignItems: 'center',
    },
    leaveBtnText: {
        color: theme.colors.danger,
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.medium,
    },
});
