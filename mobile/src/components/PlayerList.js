import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../constants/theme';

export default function PlayerList({ players, currentPlayerId, onNameChange, showScores = false }) {
    return (
        <View style={styles.container}>
            {players.map((player) => {
                const isMe = player.id === currentPlayerId;
                const isHost = player.isHost;

                return (
                    <View
                        key={player.id}
                        style={[
                            styles.playerRow,
                            isMe && styles.playerMe,
                            !player.connected && styles.playerDisconnected,
                        ]}
                    >
                        <View style={[styles.statusDot, player.connected ? styles.online : styles.offline]} />
                        <View style={styles.playerInfo}>
                            {isMe && onNameChange ? (
                                <TextInput
                                    style={styles.nameInput}
                                    value={player.name}
                                    onChangeText={onNameChange}
                                    onBlur={() => onNameChange(player.name)}
                                    maxLength={20}
                                    placeholder="Your name"
                                    placeholderTextColor={theme.colors.textMuted}
                                />
                            ) : (
                                <Text style={styles.playerName}>{player.name}</Text>
                            )}
                            {showScores && (
                                <Text style={styles.scoreText}>({player.score || 0} pts)</Text>
                            )}
                        </View>
                        {isHost && (
                            <LinearGradient
                                colors={[theme.colors.foxGradientStart, theme.colors.foxGradientEnd]}
                                style={styles.hostBadge}
                            >
                                <Text style={styles.hostText}>HOST</Text>
                            </LinearGradient>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: theme.spacing.sm,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
    },
    playerMe: {
        borderWidth: 1,
        borderColor: theme.colors.foxOrange,
    },
    playerDisconnected: {
        opacity: 0.5,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: theme.spacing.md,
    },
    online: {
        backgroundColor: theme.colors.success,
    },
    offline: {
        backgroundColor: theme.colors.textMuted,
    },
    playerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerName: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.medium,
    },
    nameInput: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.foxOrange,
        paddingVertical: 2,
        flex: 1,
    },
    scoreText: {
        color: theme.colors.foxOrange,
        fontSize: theme.fontSize.sm,
        marginLeft: theme.spacing.sm,
        opacity: 0.8,
    },
    hostBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
    },
    hostText: {
        color: '#fff',
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
    },
});
