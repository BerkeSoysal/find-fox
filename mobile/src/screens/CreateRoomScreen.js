import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Switch, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import GlassCard from '../components/GlassCard';
import { useGame } from '../context/GameContext';
import { generateRandomName } from '../utils/nameGenerator';
import theme from '../constants/theme';

export default function CreateRoomScreen({ navigation }) {
    const { state, actions } = useGame();
    const [hostName, setHostName] = useState(generateRandomName());
    const [roomName, setRoomName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [maxPlayers, setMaxPlayers] = useState(6);

    useEffect(() => {
        if (state.phase === 'lobby' && state.roomCode) {
            navigation.replace('Lobby');
        }
    }, [state.phase, state.roomCode]);

    const handleCreate = () => {
        if (!hostName.trim()) {
            return;
        }
        actions.createRoom(hostName.trim(), isPublic, maxPlayers, roomName.trim() || null);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <GlassCard>
                    <Text style={styles.title}>🎮 Create Game</Text>
                    <Text style={styles.subtitle}>Enter your name to host a game</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Your Name</Text>
                        <TextInput
                            style={styles.input}
                            value={hostName}
                            onChangeText={setHostName}
                            placeholder="Enter your name..."
                            placeholderTextColor={theme.colors.textMuted}
                            maxLength={20}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Room Name (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={roomName}
                            onChangeText={setRoomName}
                            placeholder="e.g. My Awesome Room"
                            placeholderTextColor={theme.colors.textMuted}
                            maxLength={30}
                        />
                    </View>

                    <View style={styles.formRow}>
                        <View style={styles.formGroupHalf}>
                            <Text style={styles.label}>Privacy</Text>
                            <View style={styles.toggleContainer}>
                                <Text style={[styles.toggleText, !isPublic && styles.toggleTextActive]}>
                                    🔒 Private
                                </Text>
                                <Switch
                                    value={isPublic}
                                    onValueChange={setIsPublic}
                                    trackColor={{ false: theme.colors.bgCard, true: theme.colors.foxOrange }}
                                    thumbColor="#fff"
                                />
                                <Text style={[styles.toggleText, isPublic && styles.toggleTextActive]}>
                                    🌐 Public
                                </Text>
                            </View>
                        </View>

                        <View style={styles.formGroupHalf}>
                            <Text style={styles.label}>Max Players: {maxPlayers}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={3}
                                maximumValue={6}
                                step={1}
                                value={maxPlayers}
                                onValueChange={(val) => setMaxPlayers(Math.round(val))}
                                minimumTrackTintColor={theme.colors.foxOrange}
                                maximumTrackTintColor={theme.colors.bgCard}
                                thumbTintColor={theme.colors.foxOrange}
                            />
                        </View>
                    </View>

                    <Pressable onPress={handleCreate}>
                        <LinearGradient
                            colors={[theme.colors.foxGradientStart, theme.colors.foxGradientEnd]}
                            style={styles.primaryBtn}
                        >
                            <Text style={styles.primaryBtnText}>Create Room</Text>
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
    formGroupHalf: {
        flex: 1,
    },
    formRow: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
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
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
    },
    toggleText: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.xs,
    },
    toggleTextActive: {
        color: theme.colors.textPrimary,
    },
    slider: {
        width: '100%',
        height: 40,
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
