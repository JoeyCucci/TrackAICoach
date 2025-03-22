import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BikeDetailsScreen from './screens/BikeDetailsScreen';
import TrackDataScreen from './screens/TrackDataScreen';
import LiveTrackingScreen from './screens/LiveTrackingScreen';
import RideAnalysisScreen from './screens/RideAnalysisScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="BikeDetails">
        <Stack.Screen name="BikeDetails" component={BikeDetailsScreen} options={{ title: 'Track AI Coach - Bike Details' }} />
        <Stack.Screen name="TrackData" component={TrackDataScreen} options={{ title: 'Track AI Coach - Track Data' }} />
        <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Track AI Coach - Live Tracking' }} />
        <Stack.Screen name="RideAnalysis" component={RideAnalysisScreen} options={{ title: 'Track AI Coach - Ride Analysis' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}