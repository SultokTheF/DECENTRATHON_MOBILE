import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { axiosInstance, endpoints } from '../api/apiClient';
import * as Location from 'expo-location';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MapViewDirections from 'react-native-maps-directions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CenterDetailScreenNavigationProp } from '@/src/types/types';

const GOOGLE_MAPS_APIKEY = 'AIzaSyBAVkETmTSFkRbC-Vix0DJ7HbjWYPQ8Xa8';

type MapScreenRouteProp = RouteProp<{ Map: { centerId?: number } }, 'Map'>;

const MapScreen: React.FC = () => {
  const route = useRoute<MapScreenRouteProp>();
  const navigation = useNavigation<CenterDetailScreenNavigationProp>();
  const { centerId } = route.params || {};
  const [centers, setCenters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(''); // For search input
  const [filteredCenters, setFilteredCenters] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destination, setDestination] = useState<{
    id: number;
    latitude: number;
    longitude: number;
    name: string;
    location: string;
    description: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING'>('DRIVING'); // Default mode is driving
  const [duration, setDuration] = useState<number | null>(null);
  const [region, setRegion] = useState<Region | undefined>(undefined);

  // Fetch centers from API
  const fetchCenters = async () => {
    try {
      const response = await axiosInstance.get(endpoints.CENTERS, {
        params: {
          page: 'all',
        },
      });
      setCenters(response.data);
      setFilteredCenters(response.data); // Initialize filtered centers
      setLoading(false);

      if (centerId) {
        const selectedCenter = response.data.find((center: any) => center.id === centerId);
        if (selectedCenter) {
          const initialRegion = {
            latitude: parseFloat(selectedCenter.latitude),
            longitude: parseFloat(selectedCenter.longitude),
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(initialRegion);
          setDestination({
            id: selectedCenter.id,
            latitude: parseFloat(selectedCenter.latitude),
            longitude: parseFloat(selectedCenter.longitude),
            name: selectedCenter.name,
            location: selectedCenter.location,
            description: selectedCenter.description,
          });
        }
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить центры');
      setLoading(false);
    }
  };

  // Request user's current location
  const getUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Доступ отклонен',
        'Для использования этой функции требуется разрешение на доступ к местоположению.'
      );
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  useEffect(() => {
    fetchCenters();
    getUserLocation();
  }, []);

  // Update region when userLocation is available and no centerId
  useEffect(() => {
    if (userLocation && !centerId) {
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [userLocation, centerId]);

  // Filter centers based on search query
  useEffect(() => {
    const filtered = centers.filter((center) =>
      center.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCenters(filtered);
  }, [searchQuery, centers]);

  // Handle marker press, update destination
  const handleMarkerPress = (center: any) => {
    setDestination({
      id: center.id,
      latitude: parseFloat(center.latitude),
      longitude: parseFloat(center.longitude),
      name: center.name,
      location: center.location,
      description: center.description,
    });
    setRegion({
      latitude: parseFloat(center.latitude),
      longitude: parseFloat(center.longitude),
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  // Handle transportation mode change and reset duration
  const handleModeChange = (mode: 'DRIVING' | 'WALKING') => {
    setTravelMode(mode); // Update the travel mode state properly
    setDuration(null); // Reset duration when mode changes
  };

  // Navigate to center detail when user clicks the button
  const handleNavigateToCenter = () => {
    if (destination) {
      navigation.navigate('Центр', { centerId: destination.id });
    }
  };

  if (loading) return <Text>Загрузка центров...</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск центров..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
        showsUserLocation={true}
      >
        {/* Markers for each center */}
        {filteredCenters.map((center) => (
          <Marker
            key={center.id}
            coordinate={{
              latitude: parseFloat(center.latitude),
              longitude: parseFloat(center.longitude),
            }}
            title={center.name}
            description={center.description}
            onPress={() => handleMarkerPress(center)} // Set destination when marker is pressed
          />
        ))}

        {/* Draw path from user's location to selected destination */}
        {userLocation && destination && (
          <MapViewDirections
            origin={userLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
            mode={travelMode === 'DRIVING' ? 'DRIVING' : 'WALKING'} // Ensure the correct mode is passed
            onReady={(result) => setDuration(result.duration)} // Capture estimated travel time
          />
        )}
      </MapView>

      {/* Bottom Card with Transportation Options */}
      {destination && (
        <View style={styles.bottomCard}>
          <Text style={styles.cardTitle}>{destination.name}</Text>
          <Text style={styles.cardSubtitle}>{destination.location}</Text>
          <View style={styles.transportOptions}>
            <TouchableOpacity
              style={[styles.optionButton, travelMode === 'DRIVING' && styles.activeButton]}
              onPress={() => handleModeChange('DRIVING')}
            >
              <Icon
                name="directions-car"
                size={24}
                color={travelMode === 'DRIVING' ? '#fff' : '#007aff'}
              />
              <Text
                style={travelMode === 'DRIVING' ? styles.activeOptionText : styles.optionText}
              >
                На машине
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionButton, travelMode === 'WALKING' && styles.activeButton]}
              onPress={() => handleModeChange('WALKING')}
            >
              <Icon
                name="directions-walk"
                size={24}
                color={travelMode === 'WALKING' ? '#fff' : '#007aff'}
              />
              <Text
                style={travelMode === 'WALKING' ? styles.activeOptionText : styles.optionText}
              >
                Пешком
              </Text>
            </TouchableOpacity>
          </View>

          {duration && (
            <Text style={styles.estimateText}>Время в пути: {Math.round(duration)} мин</Text>
          )}

          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigateToCenter}>
            <Text style={styles.navigateButtonText}>Перейти к центру</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    marginTop: 15,
    position: 'absolute',
    top: 20,
    left: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  searchInput: {
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  transportOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  optionButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007aff',
    backgroundColor: '#fff',
    flexDirection: 'row',
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  optionText: {
    fontSize: 14,
    color: '#007aff',
    marginLeft: 8,
  },
  activeOptionText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  estimateText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 10,
  },
  navigateButton: {
    marginTop: 20,
    backgroundColor: '#007aff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MapScreen;
