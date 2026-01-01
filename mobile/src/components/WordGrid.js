import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../constants/theme';

export default function WordGrid({ words, secretWord, showSecret = false, selectable = false, selectedWord, onSelectWord }) {
    return (
        <View style={styles.grid}>
            {words.map((word, index) => {
                const isSecret = word === secretWord;
                const isSelected = word === selectedWord;
                const showAsSecret = showSecret && isSecret;

                if (selectable) {
                    return (
                        <Pressable
                            key={index}
                            onPress={() => onSelectWord(word)}
                            style={({ pressed }) => [
                                styles.wordCard,
                                isSelected && styles.selectedCard,
                                pressed && styles.pressedCard,
                            ]}
                        >
                            <Text style={[styles.wordText, isSelected && styles.selectedText]}>
                                {word}
                            </Text>
                        </Pressable>
                    );
                }

                if (showAsSecret) {
                    return (
                        <LinearGradient
                            key={index}
                            colors={[theme.colors.foxGradientStart, theme.colors.foxGradientEnd]}
                            style={[styles.wordCard, styles.secretCard]}
                        >
                            <Text style={[styles.wordText, styles.secretText]}>{word}</Text>
                        </LinearGradient>
                    );
                }

                return (
                    <View key={index} style={styles.wordCard}>
                        <Text style={styles.wordText}>{word}</Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginVertical: theme.spacing.lg,
    },
    wordCard: {
        width: '23%',
        backgroundColor: theme.colors.bgCard,
        borderWidth: 2,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    secretCard: {
        borderColor: theme.colors.foxOrange,
    },
    selectedCard: {
        backgroundColor: theme.colors.accentBlue,
        borderColor: theme.colors.accentBlue,
    },
    pressedCard: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    wordText: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        textAlign: 'center',
    },
    secretText: {
        color: '#fff',
    },
    selectedText: {
        color: '#fff',
    },
});
