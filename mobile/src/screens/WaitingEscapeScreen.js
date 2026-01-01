import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import GlassCard from '../components/GlassCard';
import WordGrid from '../components/WordGrid';
import { useGame } from '../context/GameContext';
import theme from '../constants/theme';

export default function WaitingEscapeScreen({ navigation }) {
    const { state } = useGame();

    // Navigate based on phase
    useEffect(() => {
        if (state.phase === 'results') {
            navigation.replace('Results');
        } else if (state.phase === 'lobby') {
            navigation.replace('Lobby');
        } else if (state.phase === 'welcome') {
            navigation.replace('Welcome');
        }
    }, [state.phase]);

    // Find fox name
    const fox = state.players.find(p => p.id === state.foxId);
    const foxName = fox ? fox.name : 'The Fox';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <GlassCard style={styles.card}>
                <View style={styles.waitingAnimation}>
                    <Text style={styles.foxIcon}>🦊</Text>
                </View>
                <Text style={styles.title}>{foxName} was caught!</Text>
                <Text style={styles.subtitle}>Waiting for escape attempt...</Text>

                <View style={styles.wordGridSection}>
                    <Text style={styles.sectionLabel}>Word Grid</Text>
                    <WordGrid
                        words={state.words}
                        secretWord={state.secretWord}
                        showSecret={true}
                    />
                </View>
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
        flexGrow: 1,
        justifyContent: 'center',
    },
    card: {
        alignItems: 'center',
    },
    waitingAnimation: {
        marginBottom: theme.spacing.lg,
    },
    foxIcon: {
        fontSize: 80,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.base,
        marginBottom: theme.spacing.xl,
    },
    wordGridSection: {
        width: '100%',
    },
    sectionLabel: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.sm,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
});
