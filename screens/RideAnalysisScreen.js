import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform } from 'react-native';

export default function RideAnalysisScreen({ route }) {
  const { bikeDetails, testData, avgHPE, testDuration, laps, lapTimes, maxSpeed, corneringScore, accelHistory, startCoords, totalDistance, totalTime, movingTime, numJumps, cornerSpeeds, brakingEvents, accelEvents, jumpDurations } = route.params;

  // Ensure lapTimes is an array
  const safeLapTimes = Array.isArray(lapTimes) ? lapTimes : [];

  // Calculate session score based on lap time improvement
  const sessionScore = safeLapTimes.length > 1 
    ? Math.min(100, Math.round(((safeLapTimes[0] - safeLapTimes[safeLapTimes.length - 1]) / safeLapTimes[0]) * 100))
    : 0;
  const lapTimeImprovement = safeLapTimes.length > 1 ? ((safeLapTimes[0] - safeLapTimes[safeLapTimes.length - 1]) / safeLapTimes[0] * 100).toFixed(1) : 0;
  const progress = lapTimeImprovement > 0 ? Math.min(100, Math.round(lapTimeImprovement)) : 0;

  // Real feedback based on accel data
  const corneringFeedback = corneringScore < 0.3 ? 'Cornering: Increase ground speed in corners' : 'Cornering: Reduce airtime for better control';
  const throttleConsistency = accelHistory.length > 0 ? (accelHistory.reduce((sum, entry) => sum + entry.speed, 0) / accelHistory.length).toFixed(2) : 0;
  const throttleFeedback = `Throttle consistency: ${throttleConsistency} m/s. ${throttleConsistency < 1 ? 'Smooth out acceleration.' : 'Good control!'}`;

  // Calculate metrics
  const avgSpeed = totalTime > 0 ? ((totalDistance / totalTime) * 2.24).toFixed(1) : '0.0';
  const avgMovingSpeed = movingTime > 0 ? ((totalDistance / movingTime) * 2.24).toFixed(1) : '0.0';
  const bestLapTime = safeLapTimes.length > 0 ? Math.min(...safeLapTimes).toFixed(1) : '0.0';
  const avgLapTime = safeLapTimes.length > 0 ? (safeLapTimes.reduce((sum, val) => sum + val, 0) / safeLapTimes.length).toFixed(1) : '0.0';
  const brakingEfficiency = brakingEvents.length > 0 
    ? (brakingEvents.reduce((sum, val) => sum + val, 0) / brakingEvents.length).toFixed(2) 
    : '0.00';
  const accelEfficiency = accelEvents.length > 0 
    ? (accelEvents.reduce((sum, val) => sum + val, 0) / accelEvents.length).toFixed(2) 
    : '0.00';
  const avgCornerSpeed = cornerSpeeds.length > 0 
    ? ((cornerSpeeds.reduce((sum, val) => sum + val, 0) / cornerSpeeds.length) * 2.24).toFixed(1) 
    : '0.0';
  const avgAirTime = numJumps > 0 ? (airTime / numJumps).toFixed(1) : '0.0';
  const maxAirTime = jumpDurations.length > 0 ? Math.max(...jumpDurations).toFixed(1) : '0.0';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Track AI Coach - Ride Analysis</Text>
      <Text style={styles.subHeader}>Track: {bikeDetails.track}</Text>
      <Text style={styles.subHeader}>Date: {bikeDetails.date}</Text>
      <Text style={styles.subHeader}>Start Coordinates: {startCoords ? `${startCoords.latitude.toFixed(6)}, ${startCoords.longitude.toFixed(6)}` : 'N/A'}</Text>
      <Text>Laps Completed: {laps}</Text>
      <Text>Best Lap: {bestLapTime} s</Text>
      <Text>Avg Lap Time: {avgLapTime} s</Text>
      <Text>Lap Times Consistency: ({safeLapTimes.length > 0 ? safeLapTimes.map(t => t.toFixed(1)).join('-') : 'N/A'})</Text>
      <Text>Avg Speed: {avgSpeed} mph</Text>
      <Text>Avg Moving Speed: {avgMovingSpeed} mph</Text>
      <Text>Max Speed: {(maxSpeed * 2.24).toFixed(1)} mph</Text>
      <Text>Braking Efficiency: {brakingEfficiency} m/s²</Text>
      <Text>Accel Efficiency: {accelEfficiency} m/s²</Text>
      <Text>Average Corner Speeds: {avgCornerSpeed} mph</Text>
      <Text>Avg Air Time: {avgAirTime} s</Text>
      <Text>Max Air (Ht): {maxAirTime} s</Text>
      <Text>Session Score (Lap Time Improvement): {sessionScore}/100</Text>
      <Text>Progress (Lap Time Improvement): {progress}%</Text>
      <Text>{corneringFeedback}</Text>
      <Text>{throttleFeedback}</Text>
      <Text>Duration: {testDuration} min</Text>
      <Text>Avg HPE: {avgHPE} m</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
});