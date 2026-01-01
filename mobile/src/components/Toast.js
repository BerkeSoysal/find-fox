import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import theme from '../constants/theme';

export default function Toast({ message, visible, type = 'error', onHide }) {
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(3000),
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onHide?.();
            });
        }
    }, [visible]);

    if (!visible && !message) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return theme.colors.success;
            case 'warning':
                return theme.colors.warning;
            default:
                return theme.colors.danger;
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY }], backgroundColor: getBackgroundColor() },
            ]}
        >
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        zIndex: 1000,
    },
    message: {
        color: '#fff',
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.medium,
        textAlign: 'center',
    },
});
