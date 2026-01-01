import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../constants/theme';

export default function ConnectionStatus({ status }) {
    const getStatusColor = () => {
        switch (status) {
            case 'connected':
                return theme.colors.success;
            case 'connecting':
                return theme.colors.warning;
            default:
                return theme.colors.danger;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            default:
                return 'Disconnected';
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.text}>{getStatusText()}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.bgGlass,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
        zIndex: 100,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    text: {
        color: theme.colors.textSecondary,
        fontSize: 12,
    },
});
