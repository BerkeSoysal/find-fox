import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import CreateRoomScreen from '../screens/CreateRoomScreen';
import JoinRoomScreen from '../screens/JoinRoomScreen';
import LobbyScreen from '../screens/LobbyScreen';
import HintScreen from '../screens/HintScreen';
import VotingScreen from '../screens/VotingScreen';
import EscapeScreen from '../screens/EscapeScreen';
import WaitingEscapeScreen from '../screens/WaitingEscapeScreen';
import ResultsScreen from '../screens/ResultsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Welcome"
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    contentStyle: {
                        backgroundColor: '#0d0d12',
                    },
                }}
            >
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
                <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
                <Stack.Screen name="Lobby" component={LobbyScreen} />
                <Stack.Screen name="Hint" component={HintScreen} />
                <Stack.Screen name="Voting" component={VotingScreen} />
                <Stack.Screen name="Escape" component={EscapeScreen} />
                <Stack.Screen name="WaitingEscape" component={WaitingEscapeScreen} />
                <Stack.Screen name="Results" component={ResultsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
