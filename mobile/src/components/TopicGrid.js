import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllTopics } from '../constants/wordPacks';
import theme from '../constants/theme';

export default function TopicGrid({ selectedTopic, onSelectTopic }) {
    const topics = getAllTopics();

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
            <View style={styles.grid}>
                {topics.map((topic) => {
                    const isSelected = topic.key === selectedTopic;

                    if (isSelected) {
                        return (
                            <Pressable key={topic.key} onPress={() => onSelectTopic(topic.key)}>
                                <LinearGradient
                                    colors={[theme.colors.foxGradientStart, theme.colors.foxGradientEnd]}
                                    style={[styles.topicBtn, styles.selectedBtn]}
                                >
                                    <Text style={styles.topicIcon}>{topic.icon}</Text>
                                    <Text style={[styles.topicName, styles.selectedText]}>{topic.name}</Text>
                                </LinearGradient>
                            </Pressable>
                        );
                    }

                    return (
                        <Pressable
                            key={topic.key}
                            onPress={() => onSelectTopic(topic.key)}
                            style={({ pressed }) => [
                                styles.topicBtn,
                                pressed && styles.pressedBtn,
                            ]}
                        >
                            <Text style={styles.topicIcon}>{topic.icon}</Text>
                            <Text style={styles.topicName}>{topic.name}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        marginVertical: theme.spacing.md,
    },
    grid: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    topicBtn: {
        backgroundColor: theme.colors.bgCard,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        minWidth: 90,
    },
    selectedBtn: {
        borderColor: theme.colors.foxOrange,
    },
    pressedBtn: {
        opacity: 0.8,
    },
    topicIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    topicName: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
    },
    selectedText: {
        color: '#fff',
    },
});
