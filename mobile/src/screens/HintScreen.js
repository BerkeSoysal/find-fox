import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import WordGrid from '../components/WordGrid';
import TimerBar from '../components/TimerBar';
import { useGame } from '../context/GameContext';
import theme from '../constants/theme';

export default function HintScreen({ navigation }) {
    const { state, actions } = useGame();
    const [hint, setHint] = useState('');
    const [timerKey, setTimerKey] = useState(0);

    // Navigate based on phase
    useEffect(() => {
        if (state.phase === 'voting') {
            navigation.replace('Voting');
        } else if (state.phase === 'lobby') {
            navigation.replace('Lobby');
        } else if (state.phase === 'welcome') {
            navigation.replace('Welcome');
        }
    }, [state.phase]);

    // Reset timer when entering screen
    useEffect(() => {
        setTimerKey(prev => prev + 1);
    }, []);

    const handleHintChange = (text) => {
        setHint(text);
        actions.sendHintTyping(text);
    };

    const handleSubmit = () => {
        if (!state.hasSubmittedHint) {
            actions.submitHint(hint || '(no hint)');
        }
    };

    const handleTimerComplete = () => {
        if (!state.hasSubmittedHint) {
            handleSubmit();
        }
    };

    const hintsSubmitted = state.players.filter(p => p.hasHint).length;
    const totalPlayers = state.players.length;
    const progressPercent = totalPlayers > 0 ? (hintsSubmitted / totalPlayers) * 100 : 0;

    // Waiting players
    const waitingPlayers = state.players.filter(p => !p.hasHint);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <GlassCard>
                {/* Mini Standings */}
                <View style={styles.standings}>
                    <Text style={styles.standingsTitle}>Current Standings</Text>
                    {[...state.players]
                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                        .map((p) => (
                            <View key={p.id} style={styles.standingRow}>
                                <Text style={styles.standingName}>{p.name}</Text>
                                <Text style={styles.standingScore}>{p.score || 0} pts</Text>
                            </View>
                        ))}
                </View>

                {/* Timer */}
                {state.timerDuration > 0 && !state.hasSubmittedHint && (
                    <TimerBar
                        key={timerKey}
                        duration={state.timerDuration}
                        onComplete={handleTimerComplete}
                    />
                )}

                {/* Progress */}
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        {hintsSubmitted} / {totalPlayers} hints submitted
                    </Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                </View>

                {/* Word Grid */}
                <View style={styles.wordGridSection}>
                    <Text style={styles.sectionLabel}>Word Grid</Text>
                    <WordGrid
                        words={state.words}
                        secretWord={state.secretWord}
                        showSecret={!state.isFox}
                    />
                </View>

                {/* Fox Peek Section (Fox only) */}
                {state.isFox && state.peekPlayerName && !state.hasSubmittedHint && (
                    <View style={styles.foxPeek}>
                        <View style={styles.peekHeader}>
                            <Text style={styles.foxBadge}>🦊 Live Peek</Text>
                            <Text style={styles.peekPlayerName}>{state.peekPlayerName}</Text>
                        </View>
                        <View style={styles.peekHintContainer}>
                            {state.peekHint ? (
                                <Text style={styles.peekHintText}>"{state.peekHint}"</Text>
                            ) : (
                                <Text style={styles.typingIndicator}>waiting for them to type...</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Submitted Message */}
                {state.hasSubmittedHint ? (
                    <View style={styles.submittedMessage}>
                        <Text style={styles.checkIcon}>✓</Text>
                        <Text style={styles.submittedTitle}>Hint Submitted!</Text>
                        <Text style={styles.submittedSubtitle}>Waiting for other players...</Text>
                        <View style={styles.waitingPlayers}>
                            {waitingPlayers.map(p => (
                                <Text key={p.id} style={styles.waitingPlayer}>{p.name}</Text>
                            ))}
                        </View>
                    </View>
                ) : (
                    /* Hint Input Area */
                    <View style={styles.inputArea}>
                        {/* Role Reminder */}
                        <View style={styles.roleReminder}>
                            {state.isFox ? (
                                <>
                                    <View style={styles.roleBadge}>
                                        <Text style={styles.roleIcon}>🦊</Text>
                                        <Text style={styles.roleBadgeText}>You are the FOX!</Text>
                                    </View>
                                    <Text style={styles.roleInstruction}>You don't know the word. Try to blend in!</Text>
                                    <Text style={styles.foxWarning}>Fake it till you make it!</Text>
                                </>
                            ) : (
                                <>
                                    <View style={styles.roleBadge}>
                                        <Text style={styles.roleIcon}>👤</Text>
                                        <Text style={styles.roleBadgeText}>You are NOT the FOX</Text>
                                    </View>
                                    <Text style={styles.roleInstruction}>Help the others find the fox!</Text>
                                    <Text style={styles.secretWordHighlight}>
                                        The word is: <Text style={styles.secretWord}>{state.secretWord}</Text>
                                    </Text>
                                </>
                            )}
                        </View>

                        <TextInput
                            style={styles.hintInput}
                            value={hint}
                            onChangeText={handleHintChange}
                            placeholder="Write a subtle hint..."
                            placeholderTextColor={theme.colors.textMuted}
                            multiline
                            maxLength={100}
                        />

                        <Pressable onPress={handleSubmit}>
                            <LinearGradient
                                colors={[theme.colors.foxGradientStart, theme.colors.foxGradientEnd]}
                                style={styles.submitBtn}
                            >
                                <Text style={styles.submitBtnText}>Submit Hint ✓</Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                )}
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
    standings: {
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    standingsTitle: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.sm,
    },
    standingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    standingName: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.sm,
    },
    standingScore: {
        color: theme.colors.foxOrange,
        fontSize: theme.fontSize.sm,
    },
    progressContainer: {
        marginBottom: theme.spacing.lg,
    },
    progressText: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        marginBottom: theme.spacing.sm,
    },
    progressBar: {
        height: 6,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.foxOrange,
        borderRadius: theme.borderRadius.full,
    },
    wordGridSection: {
        marginBottom: theme.spacing.lg,
    },
    sectionLabel: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    foxPeek: {
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.foxOrange,
    },
    peekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    foxBadge: {
        color: theme.colors.foxOrange,
        fontWeight: theme.fontWeight.semibold,
    },
    peekPlayerName: {
        color: theme.colors.textSecondary,
    },
    peekHintContainer: {
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.md,
    },
    peekHintText: {
        color: theme.colors.textPrimary,
        fontStyle: 'italic',
    },
    typingIndicator: {
        color: theme.colors.textMuted,
        fontStyle: 'italic',
    },
    submittedMessage: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    checkIcon: {
        color: theme.colors.success,
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    submittedTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        marginBottom: theme.spacing.sm,
    },
    submittedSubtitle: {
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.lg,
    },
    waitingPlayers: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    waitingPlayer: {
        backgroundColor: theme.colors.bgCard,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    inputArea: {},
    roleReminder: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.bgCard,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        marginBottom: theme.spacing.sm,
    },
    roleIcon: {
        fontSize: 20,
        marginRight: theme.spacing.sm,
    },
    roleBadgeText: {
        color: theme.colors.textPrimary,
        fontWeight: theme.fontWeight.semibold,
    },
    roleInstruction: {
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    foxWarning: {
        color: theme.colors.foxOrange,
        fontWeight: theme.fontWeight.semibold,
    },
    secretWordHighlight: {
        color: theme.colors.textSecondary,
    },
    secretWord: {
        color: theme.colors.foxOrange,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
    },
    hintInput: {
        backgroundColor: theme.colors.bgCard,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.base,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: theme.spacing.lg,
    },
    submitBtn: {
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
    },
});
