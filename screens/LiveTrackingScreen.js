import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ScrollView, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import MapView, { Polyline } from 'react-native-maps';

export default function LiveTrackingScreen({ route, navigation }) {
  const { bikeDetails, weather, trackData } = route.params;
  const [gpsData, setGpsData] = useState(null);
  const [accelData, setAccelData] = useState(null);
  const [fusedPos, setFusedPos] = useState(null);
  const [lastGpsTime, setLastGpsTime] = useState(null);
  const [lastGpsPos, setLastGpsPos] = useState(null);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentHPE, setCurrentHPE] = useState(null);
  const [avgHPE, setAvgHPE] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [path, setPath] = useState([]);
  const [laps, setLaps] = useState(0);
  const [lapTimes, setLapTimes] = useState([]);
  const [lastLapTime, setLastLapTime] = useState(null);
  const [startPos, setStartPos] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [startCoords, setStartCoords] = useState(null);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [airTime, setAirTime] = useState(0);
  const [corneringScore, setCorneringScore] = useState([]);
  const [accelHistory, setAccelHistory] = useState([]);
  const [isAirborne, setIsAirborne] = useState(false);
  const [airborneStartTime, setAirborneStartTime] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [movingTime, setMovingTime] = useState(0);
  const [numJumps, setNumJumps] = useState(0);
  const [cornerSpeeds, setCornerSpeeds] = useState([]);
  const [brakingEvents, setBrakingEvents] = useState([]);
  const [accelEvents, setAccelEvents] = useState([]);
  const [lastSpeed, setLastSpeed] = useState(0);
  const [jumpDurations, setJumpDurations] = useState([]); // Already defined

  // Haversine formula to calculate distance between two GPS points (in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const calculateHPE = (gps, fused) => {
    if (!gps || !fused) return null;
    const latDiff = gps.latitude - fused.lat;
    const lonDiff = gps.longitude - fused.lon;
    const cosLat = Math.cos(gps.latitude * Math.PI / 180);
    const hpe = 111000 * Math.sqrt(latDiff * latDiff + (lonDiff * lonDiff * cosLat * cosLat));
    return hpe.toFixed(2);
  };

  const grokFeedback = (hpe) => {
    if (!hpe) return 'Waiting for data...';
    const hpeValue = parseFloat(hpe);
    if (hpeValue < 2) return 'Great tracking! HPE is low—keep it steady.';
    if (hpeValue < 10) return 'Good job! HPE is moderate—watch for sharp turns.';
    return 'HPE is high—slow down or check GPS signal for better accuracy.';
  };

  const simpleFusion = (accel, dt) => {
    if (!lastGpsPos || !gpsData || isPaused) return;

    const now = Date.now();
    const timeSinceGps = (now - lastGpsTime) / 1000;
    const newVelocity = timeSinceGps < 1 ? { x: 0, y: 0 } : {
      x: velocity.x + accel.x * dt,
      y: velocity.y + accel.y * dt,
    };
    setVelocity(newVelocity);

    // Use GPS speed if available, otherwise fall back to accelerometer-based speed
    const speed = gpsData.speed && gpsData.speed >= 0 ? gpsData.speed : Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y);
    setMaxSpeed(prev => Math.max(prev, speed));

    // Update total time and moving time
    if (isTesting) {
      setTotalTime((prev) => prev + dt);
      if (speed > 0.5) {
        setMovingTime((prev) => prev + dt);
      }
    }

    // Calculate distance traveled since last GPS update
    if (lastGpsPos && gpsData) {
      const distance = calculateDistance(
        lastGpsPos.lat,
        lastGpsPos.lon,
        gpsData.latitude,
        gpsData.longitude
      );
      setTotalDistance((prev) => prev + distance);
    }

    // Calculate acceleration/deceleration for braking and accel efficiency
    if (lastSpeed !== null && gpsData.speed !== null && gpsData.speed >= 0) {
      const acceleration = (gpsData.speed - lastSpeed) / dt;
      if (acceleration < -0.5) {
        setBrakingEvents(prev => [...prev, Math.abs(acceleration)].slice(-100));
      } else if (acceleration > 0.5) {
        setAccelEvents(prev => [...prev, acceleration].slice(-100));
      }
    }
    setLastSpeed(gpsData.speed || 0);

    // Airtime detection with threshold
    if (accel.z < 0.5) {
      if (!isAirborne) {
        setIsAirborne(true);
        setAirborneStartTime(now);
      } else if (now - airborneStartTime >= 500) {
        setAirTime(prev => prev + dt);
      }
    } else if (accel.z > 0.8) {
      if (isAirborne && (now - airborneStartTime) >= 500) {
        const jumpDuration = (now - airborneStartTime) / 1000; // Convert to seconds
        setJumpDurations(prev => [...prev, jumpDuration]);
        setNumJumps(prev => prev + 1);
      }
      setIsAirborne(false);
      setAirborneStartTime(null);
    }

    // Cornering efficiency and speeds
    const turnIntensity = Math.sqrt(accel.x * accel.x + accel.y * accel.y);
    if (turnIntensity > 0.5) {
      setCorneringScore(prev => [...prev, turnIntensity].slice(-100));
      setCornerSpeeds(prev => [...prev, speed].slice(-100));
    }

    setAccelHistory(prev => [...prev, { x: accel.x, y: accel.y, z: accel.z, speed }].slice(-100));

    const dLat = (newVelocity.y * dt) / 111000;
    const dLon = (newVelocity.x * dt) / (111000 * Math.cos(gpsData.latitude * Math.PI / 180));

    if (!lastUpdateTime || (now - lastUpdateTime) >= 100) {
      const newFusedPos = {
        lat: gpsData.latitude + dLat,
        lon: gpsData.longitude + dLon,
      };
      setFusedPos(newFusedPos);
      setLastUpdateTime(now);

      if (isTesting && gpsData) {
        const hpe = calculateHPE(gpsData, newFusedPos);
        setCurrentHPE(hpe);
        setFeedback(grokFeedback(hpe));
        setTestData(prev => {
          const newData = [...prev, { time: now, gps: gpsData, fused: newFusedPos, hpe: parseFloat(hpe) }];
          const totalHPE = newData.reduce((sum, entry) => sum + entry.hpe, 0);
          setAvgHPE((totalHPE / newData.length).toFixed(2));
          return newData;
        });

        if (startPos && Math.abs(gpsData.latitude - startPos.latitude) < 0.0001 && Math.abs(gpsData.longitude - startPos.longitude) < 0.0001 && laps > 0) {
          const lapTime = (now - startTime) / 1000;
          setLapTimes(prev => [...prev, lapTime]);
          setLastLapTime(lapTime);
          setLaps(prev => prev + 1);
          setStartTime(now);
        }
      }
    }
  };

  useEffect(() => {
    let subscription;

    (async () => {
      try {
        if (Platform.OS === 'web') {
          setError('Location services not supported on web');
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsData({ latitude: 'No Permission', longitude: 'N/A' });
          return;
        }

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 0 },
          (location) => {
            if (location && location.coords) {
              setGpsData(location.coords);
              setLastGpsTime(Date.now());
              setLastGpsPos({ lat: location.coords.latitude, lon: location.coords.longitude });
              setFusedPos({ lat: location.coords.latitude, lon: location.coords.longitude });
              setVelocity({ x: 0, y: 0 });
              if (isTesting && !isPaused) {
                setPath(prev => [...prev, { latitude: location.coords.latitude, longitude: location.coords.longitude }]);
              }
            }
          }
        );

        Accelerometer.setUpdateInterval(10);
        Accelerometer.addListener((data) => {
          setAccelData(data);
          if (lastGpsTime) {
            const now = Date.now();
            const dt = (now - lastGpsTime) / 1000;
            simpleFusion(data, dt);
          }
        });
      } catch (err) {
        setError(err.message);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
      Accelerometer.removeAllListeners();
    };
  }, [lastGpsTime, isTesting, isPaused]);

  const startTest = () => {
    setTestData([]);
    setAvgHPE(null);
    setPath([]);
    setLaps(0);
    setLapTimes([]);
    setLastLapTime(null);
    setMaxSpeed(0);
    setAirTime(0);
    setCorneringScore([]);
    setAccelHistory([]);
    setIsAirborne(false);
    setAirborneStartTime(null);
    setTotalDistance(0);
    setTotalTime(0);
    setMovingTime(0);
    setNumJumps(0);
    setCornerSpeeds([]);
    setBrakingEvents([]);
    setAccelEvents([]);
    setLastSpeed(0);
    setJumpDurations([]); // Reset jump durations
    setStartPos(gpsData ? { latitude: gpsData.latitude, longitude: gpsData.longitude } : null);
    setStartTime(Date.now());
    setStartCoords(gpsData ? { latitude: gpsData.latitude, longitude: gpsData.longitude } : null);
    setIsTesting(true);
    setIsPaused(false);
    console.log('Test started');
  };

  const pauseTest = () => {
    setIsPaused(true);
  };

  const resumeTest = () => {
    setIsPaused(false);
  };

  const stopTest = () => {
    setIsTesting(false);
    setIsPaused(false);
    // Navigate even if testData is empty to avoid undefined params
    const avg = testData.length > 0 ? (testData.reduce((sum, entry) => sum + entry.hpe, 0) / testData.length).toFixed(2) : '0.0';
    const testDuration = testData.length > 0 ? ((testData[testData.length - 1].time - testData[0].time) / 1000 / 60).toFixed(1) : '0.0';
    navigation.navigate('RideAnalysis', { 
      bikeDetails, 
      weather, 
      trackData,
      testData: testData || [], 
      avgHPE: avg, 
      testDuration, 
      laps, 
      lapTimes: lapTimes || [],
      maxSpeed, 
      airTime, 
      corneringScore: corneringScore.length > 0 ? corneringScore.reduce((sum, val) => sum + val, 0) / corneringScore.length : 0,
      accelHistory: accelHistory || [],
      startCoords: startCoords || { latitude: 0, longitude: 0 },
      totalDistance: totalDistance || 0,
      totalTime: totalTime || 0,
      movingTime: movingTime || 0,
      numJumps: numJumps || 0,
      cornerSpeeds: cornerSpeeds || [],
      brakingEvents: brakingEvents || [],
      accelEvents: accelEvents || [],
      jumpDurations: jumpDurations || [] // Ensure jumpDurations is always defined
    });
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  // Calculate metrics
  const avgCorneringEfficiency = corneringScore.length > 0 
    ? (corneringScore.reduce((sum, val) => sum + val, 0) / corneringScore.length).toFixed(2) 
    : '0.00';
  const avgSpeed = totalTime > 0 ? ((totalDistance / totalTime) * 2.24).toFixed(1) : '0.0';
  const avgMovingSpeed = movingTime > 0 ? ((totalDistance / movingTime) * 2.24).toFixed(1) : '0.0';
  const bestLapTime = lapTimes.length > 0 ? Math.min(...lapTimes).toFixed(1) : '0.0';
  const avgLapTime = lapTimes.length > 0 ? (lapTimes.reduce((sum, val) => sum + val, 0) / lapTimes.length).toFixed(1) : '0.0';
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Track AI Coach - Live Tracking</Text>
        <Text style={styles.subHeader}>Track: {bikeDetails.track}</Text>
        <Text style={styles.subHeader}>Date: {bikeDetails.date}</Text>
        {gpsData && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: gpsData.latitude,
              longitude: gpsData.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Polyline
              coordinates={path}
              strokeColor="#FF0000"
              strokeWidth={3}
            />
          </MapView>
        )}
        <Text>Avg Speed: {avgSpeed} mph</Text>
        <Text>Avg Moving Speed: {avgMovingSpeed} mph</Text>
        <Text>Max Speed: {(maxSpeed * 2.24).toFixed(1)} mph</Text>
        <Text>Laps Complete: {laps}</Text>
        <Text>Fast Lap Time: {bestLapTime} s</Text>
        <Text>Avg Lap Time: {avgLapTime} s</Text>
        <Text>Braking Efficiency: {brakingEfficiency} m/s²</Text>
        <Text>Accel Efficiency: {accelEfficiency} m/s²</Text>
        <Text>Average Corner Speeds: {avgCornerSpeed} mph</Text>
        <Text>Avg Air Time: {avgAirTime} s</Text>
        <Text>Max Air (Ht): {maxAirTime} s</Text>
        <Text>HPE: {currentHPE ? `${currentHPE} m` : 'N/A'}</Text>
        <Text>Avg HPE: {avgHPE ? `${avgHPE} m` : 'N/A'}</Text>
        <Text style={styles.feedback}>Grok Feedback: {feedback}</Text>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <Button title="Pause" onPress={pauseTest} disabled={!isTesting || isPaused} color="#FFFF00" />
          <Button title="Start" onPress={startTest} disabled={isTesting} color="#00FF00" />
          <Button title="Stop" onPress={stopTest} disabled={!isTesting} color="#FF0000" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00CED1',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
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
  map: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  feedback: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#00CED1',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});