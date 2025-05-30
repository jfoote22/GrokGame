"use client";

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { OptinUser } from '@/app/optin/page';

interface OptinMapProps {
  currentLocation: { lat: number; lng: number } | null;
  nearbyUsers: OptinUser[];
  selectedUser: OptinUser | null;
  onUserSelected: (user: OptinUser | null) => void;
  isLocationSharing: boolean;
}

// Default map container style
const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px'
};

// Default map center (San Francisco)
const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
};

// Dark mode map styles
const darkModeStyles = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#000000" }, { lightness: 13 }]
  },
  {
    featureType: "administrative",
    elementType: "geometry.fill",
    stylers: [{ color: "#000000" }]
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#144b53" }, { lightness: 14 }, { weight: 1.4 }]
  },
  {
    featureType: "landscape",
    elementType: "all",
    stylers: [{ color: "#08304b" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#0c4152" }, { lightness: 5 }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#000000" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0b434f" }, { lightness: 25 }]
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#000000" }]
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0b3d51" }, { lightness: 16 }]
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#000000" }]
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ color: "#146474" }]
  },
  {
    featureType: "water",
    elementType: "all",
    stylers: [{ color: "#021019" }]
  }
];

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: darkModeStyles,
  gestureHandling: 'cooperative'
};

export default function OptinMap({ 
  currentLocation, 
  nearbyUsers, 
  selectedUser, 
  onUserSelected, 
  isLocationSharing 
}: OptinMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredUser, setHoveredUser] = useState<OptinUser | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Center map on current location when it changes
  useEffect(() => {
    if (map && currentLocation) {
      map.panTo(currentLocation);
      map.setZoom(15);
    }
  }, [map, currentLocation]);

  // Generate a unique marker icon for each user based on their shared info
  const getUserMarkerIcon = (user: OptinUser) => {
    const visibleInfoCount = Object.values(user.privacy).filter(Boolean).length;
    let color = '#6B7280'; // Default gray
    
    if (visibleInfoCount >= 4) {
      color = '#10B981'; // Green - very open
    } else if (visibleInfoCount >= 2) {
      color = '#F59E0B'; // Yellow - moderately open
    } else if (visibleInfoCount >= 1) {
      color = '#EF4444'; // Red - minimal sharing
    }

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8
    };
  };

  const getCurrentLocationIcon = () => ({
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: '#3B82F6',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
    scale: 10
  });

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-white">Loading map...</div>
      </div>
    );
  }

  const mapCenter = currentLocation || defaultCenter;

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={currentLocation ? 15 : 10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onClick={() => onUserSelected(null)}
      >
        {/* Current user location marker */}
        {isLocationSharing && currentLocation && (
          <>
            <Marker
              position={currentLocation}
              icon={getCurrentLocationIcon()}
              title="Your location"
            />
            {/* Privacy circle around user */}
            <Circle
              center={currentLocation}
              radius={100} // 100 meter privacy radius
              options={{
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                strokeColor: '#3B82F6',
                strokeOpacity: 0.3,
                strokeWeight: 1
              }}
            />
          </>
        )}

        {/* Nearby users markers */}
        {nearbyUsers.map((user) => (
          <Marker
            key={user.id}
            position={user.location}
            icon={getUserMarkerIcon(user)}
            onClick={() => onUserSelected(user)}
            onMouseOver={() => setHoveredUser(user)}
            onMouseOut={() => setHoveredUser(null)}
            title="Click to view profile"
          />
        ))}

        {/* Info window for hovered user */}
        {hoveredUser && (
          <InfoWindow
            position={hoveredUser.location}
            onCloseClick={() => setHoveredUser(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -30),
              disableAutoPan: true
            }}
          >
            <div className="bg-gray-800 text-white p-3 rounded-lg min-w-[150px]">
              <div className="font-medium mb-2">Nearby Person</div>
              
              {hoveredUser.privacy.showCurrentMood && hoveredUser.modularInfo.currentMood && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{hoveredUser.modularInfo.currentMood}</span>
                  <span className="text-sm text-gray-300">mood</span>
                </div>
              )}
              
              {hoveredUser.privacy.showAvailability && hoveredUser.modularInfo.availability && (
                <div className="text-sm mb-1">
                  <span className={`${hoveredUser.modularInfo.availability === 'open to chat' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {hoveredUser.modularInfo.availability}
                  </span>
                </div>
              )}
              
              {hoveredUser.privacy.showAgeRange && hoveredUser.modularInfo.ageRange && (
                <div className="text-sm text-gray-300 mb-1">
                  {hoveredUser.modularInfo.ageRange}
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
                Click for more info
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map legend */}
      <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-90 rounded-lg p-3 text-white text-xs">
        <div className="font-medium mb-2">Map Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Very open (4+ shared)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Moderate (2-3 shared)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Minimal (1 shared)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Private (0 shared)</span>
          </div>
        </div>
      </div>

      {/* No location sharing message */}
      {!isLocationSharing && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-lg mb-2">📍</div>
            <div className="font-medium mb-1">Location sharing is off</div>
            <div className="text-sm text-gray-300">Enable location sharing to see nearby people</div>
          </div>
        </div>
      )}
    </div>
  );
} 