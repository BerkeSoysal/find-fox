import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import WordGrid from '../components/WordGrid';
import { useGame } from '../context/GameContext';
import theme from '../constants/theme';

export default function EscapeScreen({ navigation }) {
    const { state, actions } = useGame();
    const [selectedWord, setSelectedWord] = useState(null);

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

    const handleSelectWord = (word) => {
        setSelectedWord(word);
    };

    const handleSubmit = () => {
        if (selectedWord) {
            actions.escapeGuess(selectedWord);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <GlassCard style={styles.card}>
                <Text style={styles.foxIcon}>🦊</Text>
                <Text style={styles.title}>You've been caught!</Text>
                <Text style={styles.subtitle}>Guess the secret word to escape:</Text>

                <WordGrid
                    words={state.words}
                    selectable={true}
                    selectedWord={selectedWord}
                    onSelectWord={handleSelectWord}
                />

                <Pressable
                    onPress={handleSubmit}
                    disabled={!selectedWord}
                >
                    <LinearGradient
                        colors={selectedWord
                            ? [theme.colors.foxGradientStart, theme.colors.foxGradientEnd]
                            : [theme.colors.bgCard, theme.colors.bgCard]
                        }
                        style={[styles.submitBtn, !selectedWord && styles.submitBtnDisabled]}
                    >
                        <Text style={[styles.submitBtnText, !selectedWord && styles.submitBtnTextDisabled]}>
                            Make Your Guess
                        </Text>
                    </LinearGradient>
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
        flexGrow: 1,
        justifyContent: 'center',
    },
    card: {
        alignItems: 'center',
    },
    foxIcon: {
        fontSize: 80,
        marginBottom: theme.spacing.lg,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.base,
        marginBottom: theme.spacing.lg,
    },
    submitBtn: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xxl,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        marginTop: theme.spacing.lg,
        width: '100%',
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
