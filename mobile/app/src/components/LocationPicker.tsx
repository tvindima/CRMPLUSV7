import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialLocation?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

export default function LocationPicker({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
}: LocationPickerProps) {
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 38.7223, // Lisboa default
    longitude: initialLocation?.longitude || -9.1393,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [markerPosition, setMarkerPosition] = useState({
    latitude: initialLocation?.latitude || 38.7223,
    longitude: initialLocation?.longitude || -9.1393,
  });

  const [selectedAddress, setSelectedAddress] = useState(initialLocation?.address || '');
  const [loading, setLoading] = useState(false);

  const mapRef = useRef<MapView>(null);

  // Obter localização atual do utilizador
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // Pedir permissões
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Permita acesso à localização para usar esta funcionalidade');
        return;
      }

      // Obter posição
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Atualizar mapa
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setMarkerPosition({ latitude, longitude });

      // Animar mapa
      mapRef.current?.animateToRegion(newRegion, 500);

      // Reverse geocoding (obter endereço)
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses[0]) {
        const addr = addresses[0];
        const fullAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.country || ''}`.trim();
        setSelectedAddress(fullAddress);
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Não foi possível obter a localização atual');
    } finally {
      setLoading(false);
    }
  };

  // Quando seleciona no autocomplete
  const handlePlaceSelect = (data: any, details: any) => {
    if (!details) return;

    const { lat, lng } = details.geometry.location;
    const address = details.formatted_address || data.description;

    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setRegion(newRegion);
    setMarkerPosition({ latitude: lat, longitude: lng });
    setSelectedAddress(address);

    mapRef.current?.animateToRegion(newRegion, 500);
  };

  // Quando arrasta o marker no mapa
  const handleMarkerDragEnd = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });

    try {
      // Reverse geocoding
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses[0]) {
        const addr = addresses[0];
        const fullAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.country || ''}`.trim();
        setSelectedAddress(fullAddress);
      }
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
    }
  };

  // Confirmar seleção
  const handleConfirm = () => {
    if (!selectedAddress) {
      Alert.alert('Endereço Necessário', 'Por favor, selecione uma localização');
      return;
    }

    onSelectLocation({
      address: selectedAddress,
      latitude: markerPosition.latitude,
      longitude: markerPosition.longitude,
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#ef4444" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escolher Localização</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Ionicons name="checkmark" size={28} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Search Bar com Autocomplete */}
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="Pesquisar morada..."
            fetchDetails={true}
            onPress={handlePlaceSelect}
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'AIzaSyBkz8z8z8z8z8z8z8z8z8z8z8z8z8z',
              language: 'pt',
              components: 'country:pt', // Só Portugal
            }}
            styles={{
              container: {
                flex: 0,
              },
              textInput: {
                backgroundColor: '#1a1f2e',
                color: '#fff',
                fontSize: 15,
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 50,
              },
              listView: {
                backgroundColor: '#1a1f2e',
                borderRadius: 12,
                marginTop: 4,
              },
              row: {
                backgroundColor: '#1a1f2e',
                padding: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#2d3748',
              },
              description: {
                color: '#fff',
                fontSize: 14,
              },
              poweredContainer: {
                display: 'none',
              },
            }}
            textInputProps={{
              placeholderTextColor: '#6b7280',
              autoFocus: false,
              returnKeyType: 'search',
            }}
            enablePoweredByContainer={false}
            nearbyPlacesAPI="GooglePlacesSearch"
            debounce={300}
          />

          {/* Botão Localização Atual */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#00d9ff" />
            ) : (
              <Ionicons name="locate" size={24} color="#00d9ff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Mapa */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton={false}
          mapType="standard"
        >
          <Marker
            coordinate={markerPosition}
            draggable
            onDragEnd={handleMarkerDragEnd}
            pinColor="#00d9ff"
          >
            <View style={styles.customMarker}>
              <Ionicons name="location" size={40} color="#00d9ff" />
            </View>
          </Marker>
        </MapView>

        {/* Endereço Selecionado */}
        {selectedAddress ? (
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={20} color="#00d9ff" />
            <Text style={styles.addressText} numberOfLines={2}>
              {selectedAddress}
            </Text>
          </View>
        ) : null}

        {/* Instruções */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            📍 Arraste o pin para ajustar a localização exata
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  confirmButton: {
    padding: 4,
  },
  searchContainer: {
    padding: 16,
    zIndex: 10,
  },
  currentLocationButton: {
    position: 'absolute',
    right: 24,
    top: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressContainer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
  },
  instructions: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(26, 31, 46, 0.9)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
