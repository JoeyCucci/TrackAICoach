import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Platform } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';

export default function TrackDataScreen({ route, navigation }) {
  const { bikeDetails } = route.params;
  const [weather, setWeather] = useState({ humidity: 'N/A', temp: 'N/A' }); // Removed elevation
  const [trackCondition, setTrackCondition] = useState('');
  const [ruts, setRuts] = useState('');
  const [weatherError, setWeatherError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null); // Store GPS location

  useEffect(() => {
    const getLocationAndWeather = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setWeatherError('Location permission denied');
          setWeather({ humidity: '63%', temp: '87F' }); // Fallback mock data
          return;
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location.coords);

        // Fetch weather data using current location
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.coords.latitude}&lon=${location.coords.longitude}&appid=7ebac427a86e6976a7af06d73a4d5538&units=imperial`
        );
        setWeather({
          humidity: `${response.data.main.humidity}%`,
          temp: `${Math.round(response.data.main.temp)}F`,
        });
        setWeatherError(null);
      } catch (err) {
        console.error('Weather fetch error:', err.message);
        console.error('Error details:', err.response ? err.response.data : 'No response data');
        setWeather({ humidity: '63%', temp: '87F' }); // Fallback mock data
        setWeatherError(err.response ? err.response.data.message : err.message);
      }
    };
    getLocationAndWeather();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Track AI Coach - Weather/Track Data</Text>
      <Text style={styles.subHeader}>Track: {bikeDetails.track}</Text>
      <Text style={styles.subHeader}>Date: {bikeDetails.date}</Text>
      {weatherError && <Text style={styles.error}>Weather Error: {weatherError}</Text>}
      <Text>Humidity: {weather.humidity}</Text>
      <Text>Temp: {weather.temp}</Text>
      <Text>Track Condition:</Text>
      <TextInput
        style={styles.input}
        value={trackCondition}
        onChangeText={setTrackCondition}
        placeholder="Enter track condition (e.g., dry, muddy)"
      />
      <Text>Ruts (1-5):</Text>
      <TextInput
        style={styles.input}
        value={ruts}
        onChangeText={setRuts}
        placeholder="Enter ruts rating (1-5)"
        keyboardType="numeric"
      />
      <Button title="Next" onPress={() => navigation.navigate('LiveTracking', { bikeDetails, weather, trackData: { trackCondition, ruts } })} color="#800080" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#00CED1',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  error: {
    color: '#FF0000',
    marginBottom: 10,
  },
});