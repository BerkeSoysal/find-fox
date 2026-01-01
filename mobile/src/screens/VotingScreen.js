import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import WordGrid from '../components/WordGrid';
import { useGame } from '../context/GameContext';
import theme from '../constants/theme';

export default function VotingScreen({ navigation }) {
    const { state, actions } = useGame();
    const [selectedVote, setSelectedVote] = useState(null);

    // Navigate based on phase
    useEffect(() => {
        if (state.phase === 'escape') {
            if (state.isFox) {
                navigation.replace('Escape');
            } else {
                navigation.replace('WaitingEscape');
            }
        } else if (state.phase === 'results') {
            navigation.replace('Results');
        } else if (state.phase === 'lobby') {
            navigation.replace('Lobby');
        } else if (state.phase === 'welcome') {
            navigation.replace('Welcome');
        }
    }, [state.phase, state.isFox]);

    const handleVote = (playerId) => {
        if (!state.hasSubmittedVote) {
            setSelectedVote(playerId);
        }
    };

    const handleSubmit = () => {
        if (selectedVote && !state.hasSubmittedVote) {
            actions.submitVote(selectedVote);
        }
    };

    const votesSubmitted = state.players.filter(p => p.hasVoted).length;
    const totalPlayers = state.players.length;
    const progressPercent = totalPlayers > 0 ? (votesSubmitted / totalPlayers) * 100 : 0;

    // Other players (can't vote for yourself)
    const otherPlayers = state.players.filter(p => p.id !== state.playerId);

    // Build hint map
    const hintMap = {};
    (state.hints || []).forEach(h => {
        hintMap[h.playerId] = h.hint;
    });

    // Waiting players
    const waitingPlayers = state.players.filter(p => !p.hasVoted);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <GlassCard>
                {/* Progress */}
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        {votesSubmitted} / {totalPlayers} votes cast
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

                {/* Submitted Message */}
                {state.hasSubmittedVote ? (
                    <View style={styles.submittedMessage}>
                        <Text style={styles.checkIcon}>✓</Text>
                        <Text style={styles.submittedTitle}>Vote Submitted!</Text>
                        <Text style={styles.submittedSubtitle}>Waiting for other players...</Text>
                        <View style={styles.waitingPlayers}>
                            {waitingPlayers.map(p => (
                                <Text key={p.id} style={styles.waitingPlayer}>{p.name}</Text>
                            ))}
                        </View>
                    </View>
                ) : (
                    /* Vote Input Area */
                    <View style={styles.inputArea}>
                        <Text style={styles.voteTitle}>Who is the Fox?</Text>

                        <View style={styles.voteOptions}>
                            {otherPlayers.map(player => {
                                const isSelected = player.id === selectedVote;
                                const hint = hintMap[player.id] || '(no hint)';

                                return (
                                    <Pressable
                                        key={player.id}
                                        style={[styles.voteBtn, isSelected && styles.voteBtnSelected]}
                                        onPress={() => handleVote(player.id)}
                                    >
                                        <Text style={[styles.voteBtnName, isSelected && styles.voteBtnNameSelected]}>
                                            {player.name}
                                        </Text>
                                        <Text style={[styles.voteBtnHint, isSelected && styles.voteBtnHintSelected]}>
                                            "{hint}"
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Pressable
                            onPress={handleSubmit}
                            disabled={!selectedVote}
                        >
                            <LinearGradient
                                colors={selectedVote
                                    ? [theme.colors.foxGradientStart, theme.colors.foxGradientEnd]
                                    : [theme.colors.bgCard, theme.colors.bgCard]
                                }
                                style={[styles.submitBtn, !selectedVote && styles.submitBtnDisabled]}
                            >
                                <Text style={[styles.submitBtnText, !selectedVote && styles.submitBtnTextDisabled]}>
                                    Confirm Vote
                                </Text>
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
    voteTitle: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.base,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    voteOptions: {
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    voteBtn: {
        backgroundColor: theme.colors.bgCard,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
    },
    voteBtnSelected: {
        backgroundColor: theme.colors.accentBlue,
        borderColor: theme.colors.accentBlue,
    },
    voteBtnName: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        marginBottom: theme.spacing.xs,
    },
    voteBtnNameSelected: {
        color: '#fff',
    },
    voteBtnHint: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        fontStyle: 'italic',
    },
    voteBtnHintSelected: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    submitBtn: {
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
    },
    submitBtnTextDisabled: {
        color: theme.colors.textMuted,
    },
});
