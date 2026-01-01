import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import { useGame } from '../context/GameContext';
import { generateRandomName } from '../utils/nameGenerator';
import theme from '../constants/theme';

export default function JoinRoomScreen({ navigation }) {
    const { state, actions } = useGame();
    const [playerName, setPlayerName] = useState(generateRandomName());
    const [roomCode, setRoomCode] = useState('');

    useEffect(() => {
        if (state.phase === 'lobby' && state.roomCode) {
            navigation.replace('Lobby');
        }
    }, [state.phase, state.roomCode]);

    const handleJoin = () => {
        if (roomCode.trim().length !== 4) {
            return;
        }
        actions.joinRoom(roomCode.trim().toUpperCase(), playerName.trim() || null);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <GlassCard>
                    <Text style={styles.title}>👥 Join Game</Text>
                    <Text style={styles.subtitle}>Enter the room code to join</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Your Name</Text>
                        <TextInput
                            style={styles.input}
                            value={playerName}
                            onChangeText={setPlayerName}
                            placeholder="Enter your name..."
                            placeholderTextColor={theme.colors.textMuted}
                            maxLength={20}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Room Code</Text>
                        <TextInput
                            style={[styles.input, styles.codeInput]}
                            value={roomCode}
                            onChangeText={(text) => setRoomCode(text.toUpperCase())}
                            placeholder="ABCD"
                            placeholderTextColor={theme.colors.textMuted}
                            maxLength={4}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
                    </View>

                    <Pressable onPress={handleJoin}>
                        <LinearGradient
                            colors={[theme.colors.foxGradientStart, theme.colors.foxGradientEnd]}
                            style={styles.primaryBtn}
                        >
                            <Text style={styles.primaryBtnText}>Join Room</Text>
                        </LinearGradient>
                    </Pressable>

                    <Pressable
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backBtnText}>← Back</Text>
                    </Pressable>
                </GlassCard>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bgPrimary,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xl,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        marginBottom: theme.spacing.sm,
    },
    input: {
        backgroundColor: theme.colors.bgCard,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.base,
    },
    codeInput: {
        textAlign: 'center',
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: 8,
    },
    primaryBtn: {
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
    },
    backBtn: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.bgGlass,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    backBtnText: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.medium,
    },
});
