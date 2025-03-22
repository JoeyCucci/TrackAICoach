import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Platform } from 'react-native';

export default function BikeDetailsScreen({ navigation }) {
  const [track, setTrack] = useState('High Point Mt. Morris');
  const [date, setDate] = useState('6/18/2025');
  const [make, setMake] = useState('Yamaha');
  const [model, setModel] = useState('YZ250F');
  const [frontTire, setFrontTire] = useState('MX34 (80/100-21)');
  const [rearTire, setRearTire] = useState('MX34 (120/80-19)');
  const [frontSprocket, setFrontSprocket] = useState('13');
  const [rearSprocket, setRearSprocket] = useState('49');
  const [mapTune, setMapTune] = useState('race');
  const [engineDisp, setEngineDisp] = useState('450cc');

  const bikeDetails = { track, date, make, model, frontTire, rearTire, frontSprocket, rearSprocket, mapTune, engineDisp };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Track AI Coach - Bike Details</Text>
      <TextInput style={styles.input} value={track} onChangeText={setTrack} placeholder="Track" />
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="Date" />
      <TextInput style={styles.input} value={make} onChangeText={setMake} placeholder="Bike Make" />
      <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Bike Model" />
      <TextInput style={styles.input} value={frontTire} onChangeText={setFrontTire} placeholder="Front Tire" />
      <TextInput style={styles.input} value={rearTire} onChangeText={setRearTire} placeholder="Rear Tire" />
      <TextInput style={styles.input} value={frontSprocket} onChangeText={setFrontSprocket} placeholder="Front Sprocket" />
      <TextInput style={styles.input} value={rearSprocket} onChangeText={setRearSprocket} placeholder="Rear Sprocket" />
      <TextInput style={styles.input} value={mapTune} onChangeText={setMapTune} placeholder="Map Tune" />
      <TextInput style={styles.input} value={engineDisp} onChangeText={setEngineDisp} placeholder="Engine Displacement" />
      <Button title="Next" onPress={() => navigation.navigate('TrackData', { bikeDetails })} color="#800080" />
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
  input: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});