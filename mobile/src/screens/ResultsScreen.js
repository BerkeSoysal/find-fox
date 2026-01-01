import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import WordGrid from '../components/WordGrid';
import { useGame } from '../context/GameContext';
import theme from '../constants/theme';

export default function ResultsScreen({ navigation }) {
    const { state, actions } = useGame();

    // Navigate based on phase
    useEffect(() => {
        if (state.phase === 'lobby') {
            navigation.replace('Lobby');
        } else if (state.phase === 'welcome') {
            navigation.replace('Welcome');
        } else if (state.phase === 'hint_writing') {
            navigation.replace('Hint');
        }
    }, [state.phase]);

    const handlePlayAgain = () => {
        actions.playAgain();
    };

    const handleLeaveGame = () => {
        Alert.alert(
            'Leave Game',
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

    // Determine result display
    let icon, title, message;
    switch (state.lastResult) {
        case 'fox_wins':
            icon = '🦊';
            title = 'Fox Wins!';
            message = state.finders?.length === 1
                ? `${state.foxName} wasn't caught! But ${state.finders[0]} was suspicious.`
                : `${state.foxName} successfully blended in! No consensus reached.`;
            break;
        case 'fox_escapes':
            icon = '🦊✨';
            title = 'Fox Escapes!';
            message = `${state.foxName} was caught but correctly guessed "${state.secretWord}"!`;
            break;
        case 'fox_caught':
            icon = '🎉';
            title = 'Fox Caught!';
            message = `${state.foxName} was the fox and failed to guess the word "${state.secretWord}"!`;
            break;
        default:
            icon = '🎮';
            title = 'Game Over';
            message = '';
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <GlassCard style={styles.card}>
                <Text style={styles.resultIcon}>{icon}</Text>
                <Text style={styles.resultTitle}>{title}</Text>
                <Text style={styles.resultMessage}>{message}</Text>

                {/* Details */}
                <View style={styles.details}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>The Fox was:</Text>
                        <Text style={styles.detailValue}>{state.foxName} 🦊</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>The word was:</Text>
                        <Text style={styles.detailValue}>{state.secretWord}</Text>
                    </View>
                </View>

                {/* Word Grid */}
                <View style={styles.wordGridSection}>
                    <Text style={styles.sectionLabel}>Word Grid</Text>
                    <WordGrid
                        words={state.words}
                        secretWord={state.secretWord}
                        showSecret={true}
                    />
                </View>

                {/* Scoreboard */}
                <Text style={styles.sectionTitle}>🏆 Scoreboard</Text>
                <View style={styles.scoreboard}>
                    {[...(state.scores || [])]
                        .sort((a, b) => b.score - a.score)
                        .map((s, index) => {
                            const isMe = s.playerId === state.playerId;
                            return (
                                <View
                                    key={s.playerId}
                                    style={[
                                        styles.scoreRow,
                                        s.isFox && styles.foxRow,
                                        isMe && styles.meRow,
                                    ]}
                                >
                                    <Text style={styles.scoreRank}>#{index + 1}</Text>
                                    <Text style={styles.scoreName}>
                                        {s.isFox && '🦊 '}{s.playerName}
                                    </Text>
                                    <View style={styles.scoreValueContainer}>
                                        <Text style={styles.scoreValue}>{s.score}</Text>
                                        {s.change > 0 && (
                                            <Text style={styles.scoreChange}>+{s.change}</Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                </View>

                {/* Host Controls */}
                {state.isHost && (
                    <Pressable onPress={handlePlayAgain} style={styles.playAgainContainer}>
                        <LinearGradient
                            colors={[theme.colors.foxGradientStart, theme.colors.foxGradientEnd]}
                            style={styles.playAgainBtn}
                        >
                            <Text style={styles.playAgainBtnText}>Play Again</Text>
                        </LinearGradient>
                    </Pressable>
                )}

                {/* Guest Message */}
                {!state.isHost && (
                    <View style={styles.guestMessage}>
                        <Text style={styles.guestMessageText}>Waiting for host to start next round...</Text>
                    </View>
                )}

                {/* Leave Button */}
                <Pressable style={styles.leaveBtn} onPress={handleLeaveGame}>
                    <Text style={styles.leaveBtnText}>Leave Game</Text>
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
    card: {
        alignItems: 'center',
    },
    resultIcon: {
        fontSize: 64,
        marginBottom: theme.spacing.md,
    },
    resultTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    resultMessage: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.base,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    details: {
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        width: '100%',
        marginBottom: theme.spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.xs,
    },
    detailLabel: {
        color: theme.colors.textSecondary,
    },
    detailValue: {
        color: theme.colors.textPrimary,
        fontWeight: theme.fontWeight.semibold,
    },
    wordGridSection: {
        width: '100%',
        marginBottom: theme.spacing.lg,
    },
    sectionLabel: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        marginBottom: theme.spacing.md,
    },
    scoreboard: {
        width: '100%',
        marginBottom: theme.spacing.xl,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    foxRow: {
        borderWidth: 1,
        borderColor: theme.colors.foxOrange,
    },
    meRow: {
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
    },
    scoreRank: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        width: 30,
    },
    scoreName: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.medium,
        flex: 1,
    },
    scoreValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    scoreValue: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
    },
    scoreChange: {
        color: theme.colors.success,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
    },
    playAgainContainer: {
        width: '100%',
    },
    playAgainBtn: {
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
    },
    playAgainBtnText: {
        color: '#fff',
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
    },
    guestMessage: {
        marginTop: theme.spacing.md,
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
        width: '100%',
    },
    leaveBtnText: {
        color: theme.colors.danger,
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.medium,
    },
});
