import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import theme from '../constants/theme';

export default function TimerBar({ duration, onComplete, label = 'Time Remaining' }) {
    const [remaining, setRemaining] = useState(duration);
    const animatedWidth = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        if (duration <= 0) return;

        setRemaining(duration);
        animatedWidth.setValue(100);

        // Animate the bar
        Animated.timing(animatedWidth, {
            toValue: 0,
            duration: duration * 1000,
            useNativeDriver: false,
        }).start();

        // Countdown
        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onComplete?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [duration]);

    if (duration <= 0) return null;

    const getBarColor = () => {
        if (remaining <= 5) return theme.colors.danger;
        if (remaining <= 10) return theme.colors.warning;
        return theme.colors.foxOrange;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>{label}</Text>
                <Text style={[styles.countdown, remaining <= 5 && styles.countdownDanger]}>
                    {remaining}
                </Text>
            </View>
            <View style={styles.barContainer}>
                <Animated.View
                    style={[
                        styles.barFill,
                        {
                            width: animatedWidth.interpolate({
                                inputRange: [0, 100],
                                outputRange: ['0%', '100%'],
                            }),
                            backgroundColor: getBarColor(),
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    label: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
    },
    countdown: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
    },
    countdownDanger: {
        color: theme.colors.danger,
    },
    barContainer: {
        height: 6,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: theme.borderRadius.full,
    },
});
