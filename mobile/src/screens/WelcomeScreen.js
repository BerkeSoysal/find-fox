import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import ConnectionStatus from '../components/ConnectionStatus';
import { useGame } from '../context/GameContext';
import { generateRandomName } from '../utils/nameGenerator';
import theme from '../constants/theme';

export default function WelcomeScreen({ navigation }) {
    const { state, actions } = useGame();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        actions.getPublicRooms();
    }, []);

    // Navigate to lobby when room is joined/created
    useEffect(() => {
        console.log('WelcomeScreen: phase=', state.phase, 'roomCode=', state.roomCode);
        if (state.phase === 'lobby' && state.roomCode) {
            navigation.replace('Lobby');
        }
    }, [state.phase, state.roomCode]);

    const onRefresh = () => {
        setRefreshing(true);
        actions.getPublicRooms();
        setTimeout(() => setRefreshing(false), 500);
    };

    const handleJoinPublicRoom = (roomCode) => {
        // Generate a random name when joining from public rooms list
        const playerName = generateRandomName();
        actions.joinRoom(roomCode, playerName);
    };

    const renderPublicRoom = ({ item }) => (
        <Pressable
            style={styles.publicRoomItem}
            onPress={() => handleJoinPublicRoom(item.roomCode)}
        >
            <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{item.roomName || item.roomCode}</Text>
                <Text style={styles.roomDetails}>
                    {item.roomName ? `${item.roomCode} • ` : ''}Lobby • {item.playerCount}/{item.maxPlayers} players
                </Text>
            </View>
            <View style={styles.joinBtnSmall}>
                <Text style={styles.joinBtnSmallText}>Join →</Text>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <ConnectionStatus status={state.connectionStatus} />

            <GlassCard style={styles.card}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>🦊</Text>
                    <Text style={styles.title}>Fox Game</Text>
                    <Text style={styles.tagline}>Find the imposter who doesn't know the word!</Text>
                    <View style={styles.onlineBadge}>
                        <Text style={styles.onlineBadgeText}>🌐 Online Multiplayer</Text>
                    </View>
                </View>

                <View style={styles.buttons}>
                    <Pressable onPress={() => navigation.navigate('CreateRoom')}>
                        <LinearGradient
                            colors={[theme.colors.foxGradientStart, theme.colors.foxGradientEnd]}
                            style={styles.primaryBtn}
                        >
                            <Text style={styles.primaryBtnText}>Create Game</Text>
                        </LinearGradient>
                    </Pressable>

                    <Pressable
                        style={styles.secondaryBtn}
                        onPress={() => navigation.navigate('JoinRoom')}
                    >
                        <Text style={styles.secondaryBtnText}>Join Game</Text>
                    </Pressable>
                </View>

                <View style={styles.publicRoomsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🌐 Public Rooms</Text>
                        <Pressable onPress={onRefresh}>
                            <Text style={styles.refreshBtn}>Refresh ⟳</Text>
                        </Pressable>
                    </View>

                    <View style={styles.publicRoomsList}>
                        {state.publicRooms.length === 0 ? (
                            <Text style={styles.noRoomsText}>No public rooms found</Text>
                        ) : (
                            <FlatList
                                data={state.publicRooms}
                                keyExtractor={(item) => item.roomCode}
                                renderItem={renderPublicRoom}
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                        tintColor={theme.colors.foxOrange}
                                    />
                                }
                                style={styles.roomList}
                            />
                        )}
                    </View>
                </View>
            </GlassCard>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bgPrimary,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    card: {
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    logo: {
        fontSize: 80,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.fontSize.xxxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.foxOrange,
        marginBottom: theme.spacing.sm,
    },
    tagline: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.lg,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    onlineBadge: {
        backgroundColor: theme.colors.accentBlue,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    onlineBadgeText: {
        color: '#fff',
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
    },
    buttons: {
        width: '100%',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    primaryBtn: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
    },
    secondaryBtn: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.bgGlass,
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
    },
    publicRoomsSection: {
        width: '100%',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
    },
    refreshBtn: {
        color: theme.colors.foxOrange,
        fontWeight: theme.fontWeight.semibold,
    },
    publicRoomsList: {
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        maxHeight: 180,
        minHeight: 60,
    },
    noRoomsText: {
        color: theme.colors.textMuted,
        textAlign: 'center',
        padding: theme.spacing.lg,
    },
    roomList: {
        maxHeight: 180,
    },
    publicRoomItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    roomInfo: {
        flex: 1,
    },
    roomName: {
        color: theme.colors.foxOrange,
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.bold,
    },
    roomDetails: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.xs,
    },
    joinBtnSmall: {
        backgroundColor: theme.colors.bgGlass,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    joinBtnSmallText: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
    },
});
