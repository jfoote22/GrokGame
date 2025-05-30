"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Coupon } from "@/lib/models/coupon";
import ModelViewer from "@/components/ModelViewer";

interface MapSelectorProps {
  selectedLocation: { lat: number; lng: number };
  onLocationSelected: (location: { lat: number; lng: number }) => void;
  coupons?: Coupon[]; // Added coupons prop
}

// Default map container style
const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px'
};

// Default map options
const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  mapTypeControlOptions: {
    style: 2, // HORIZONTAL_BAR
    position: 1, // TOP_LEFT
    mapTypeIds: ['roadmap', 'satellite']
  },
  fullscreenControl: false,
  clickableIcons: true,
};

// Base dark mode styles (always applied)
const baseDarkModeStyles = [
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#2D4263" }]
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#2D2D2D" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#555555" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#3A3A3A" }]
  }
];

// Style settings to hide all text labels
const hideLabelsStyle = [
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  }
];

// SVG path for coupon marker icon (without the Google-dependent properties)
const couponIconPath = "M21.41,11.58l-9-9C12.05,2.22,11.55,2,11,2H4C2.9,2,2,2.9,2,4v7c0,0.55,0.22,1.05,0.59,1.42l9,9 C11.95,21.78,12.45,22,13,22s1.05-0.22,1.41-0.59l7-7C21.78,14.05,22,13.55,22,13S21.78,11.95,21.41,11.58z M5.5,7 C4.67,7,4,6.33,4,5.5S4.67,4,5.5,4S7,4.67,7,5.5S6.33,7,5.5,7z";

export default function MapSelector({ selectedLocation, onLocationSelected, coupons = [] }: MapSelectorProps) {
  // State for map type and label visibility
  const [mapType, setMapType] = useState<string>("roadmap");
  const [hideLabels, setHideLabels] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showInactiveCoupons, setShowInactiveCoupons] = useState(false);
  
  // Refs for timeout handling
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHoverTimeRef = useRef<number>(0);
  
  // Function to check if a coupon is currently active
  const isActiveCoupon = (coupon: Coupon): boolean => {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);
    
    // Set time for start and end dates based on coupon times
    const [startHour, startMinute] = (coupon.startTime || '00:00').split(':').map(Number);
    const [endHour, endMinute] = (coupon.endTime || '23:59').split(':').map(Number);
    
    startDate.setHours(startHour, startMinute, 0, 0);
    endDate.setHours(endHour, endMinute, 59, 999);
    
    return now >= startDate && now <= endDate;
  };

  // Filter coupons based on active status and toggle state
  const getFilteredCoupons = () => {
    if (showInactiveCoupons) {
      return coupons; // Show all coupons
    }
    return coupons.filter(coupon => isActiveCoupon(coupon)); // Show only active coupons
  };
  
  // Handle showing a coupon's info window
  const handleCouponHover = (coupon: Coupon) => {
    // Clear any hide timeout that might be in progress
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    const now = Date.now();
    lastHoverTimeRef.current = now;
    
    // If we already have a coupon selected, show the new one immediately
    if (selectedCoupon) {
      setSelectedCoupon(coupon);
      return;
    }
    
    // Otherwise, set it immediately
    setSelectedCoupon(coupon);
  };
  
  // Handle hiding a coupon's info window
  const handleCouponLeave = () => {
    // Set minimum display time to 0.5 seconds (500ms)
    const minDisplayTime = 500;
    const now = Date.now();
    const timeShown = now - lastHoverTimeRef.current;
    
    // Calculate how much longer to keep showing it to meet the minimum
    const timeToWait = Math.max(0, minDisplayTime - timeShown);
    
    // Set a timeout to hide it after the delay
    hideTimeoutRef.current = setTimeout(() => {
      setSelectedCoupon(null);
      hideTimeoutRef.current = null;
    }, timeToWait + 500); // Add 0.5 second after mouse leaves
  };
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);
  
  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  // State for map reference
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  // Combine styles based on current settings
  const getMapStyles = () => {
    if (mapType !== "roadmap") {
      return []; // No custom styles in satellite mode
    }
    
    return hideLabels 
      ? [...baseDarkModeStyles, ...hideLabelsStyle] // Dark mode with no labels
      : baseDarkModeStyles; // Dark mode with default labels
  };

  // Get custom marker icon with dynamic color based on discount and activity status
  // This is only called when Google Maps is loaded
  const getCouponIcon = (coupon: Coupon) => {
    // Marker component expects a valid icon object
    if (!isLoaded || typeof google === 'undefined') {
      return undefined; // Return undefined instead of null
    }
    
    const isActive = isActiveCoupon(coupon);
    
    // Determine color based on discount value
    let color = "#4285F4"; // Default blue
    
    if (coupon.discount.includes("BOGO") || coupon.discount.toLowerCase().includes("free")) {
      color = "#EA4335"; // Red for BOGO/free offers
    } else if (coupon.discount.includes("%")) {
      // Extract percentage value
      const percentMatch = coupon.discount.match(/(\d+)%/);
      if (percentMatch && percentMatch[1]) {
        const percent = parseInt(percentMatch[1]);
        if (percent >= 50) {
          color = "#FBBC04"; // Yellow for high discounts (≥50%)
        } else if (percent >= 25) {
          color = "#34A853"; // Green for medium discounts (25-49%)
        }
      }
    }
    
    return {
      path: couponIconPath,
      fillColor: color,
      fillOpacity: isActive ? 1 : 0.4, // Reduced opacity for inactive coupons
      strokeWeight: 1,
      strokeColor: isActive ? "#FFFFFF" : "#CCCCCC", // Lighter stroke for inactive
      scale: isActive ? 1.2 : 1.0, // Slightly smaller for inactive
      anchor: new google.maps.Point(12, 12),
    };
  };

  // Callback function when map loads
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Add listener for map type change
    if (map) {
      map.addListener('maptypeid_changed', () => {
        setMapType(map.getMapTypeId() as string);
      });
    }
  }, []);

  // Update map styles when settings change
  useEffect(() => {
    if (map) {
      map.setOptions({ styles: getMapStyles() });
    }
  }, [map, hideLabels, mapType]);

  // Callback function when map unmounts
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle map click events
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onLocationSelected({ lat, lng });
      
      // Clear any existing timeouts
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      
      // Immediately hide any info window
      setSelectedCoupon(null);
    }
  };

  // If the API is still loading, show a loading state
  if (loadError) {
    return (
      <div className="text-white bg-gray-800 rounded-lg p-4">
        <p>Error loading Google Maps: {loadError.message}</p>
      </div>
    );
  }

  // If the API is not loaded yet, show a loading state
  if (!isLoaded) {
    return (
      <div className="text-white bg-gray-800 rounded-lg p-4 flex items-center justify-center h-[400px]">
        <div className="w-10 h-10 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <style jsx global>{`
        @keyframes scaleUp {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .info-window-content {
          animation: scaleUp 0.2s ease-out forwards;
          transform-origin: bottom center;
        }
        
        /* Hide the Google Maps InfoWindow close button */
        .gm-ui-hover-effect {
          display: none !important;
        }
        
        /* Style the InfoWindow container */
        .gm-style .gm-style-iw-c {
          padding: 0 !important;
          border-radius: 12px !important;
          overflow: visible !important;
        }
        
        /* Hide the InfoWindow arrow */
        .gm-style .gm-style-iw-t::after {
          display: none !important;
        }
        
        .gm-style-iw-d {
          overflow: hidden !important;
          padding: 0 !important;
        }
      `}</style>
      
      <div className="relative">
        {/* Map visibility controls */}
        <div className="absolute right-2 top-2 z-10 bg-gray-900 bg-opacity-75 rounded p-1">
          <button 
            onClick={() => setHideLabels(!hideLabels)}
            className={`text-xs px-2 py-1 rounded ${
              hideLabels ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {hideLabels ? 'Show Labels' : 'Hide Labels'}
          </button>
        </div>

        <div className="mb-4 overflow-hidden rounded-lg">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={selectedLocation}
            zoom={10}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
            options={{
              ...defaultOptions,
              styles: getMapStyles()
            }}
            mapTypeId={mapType}
          >
            {/* Main selected location marker */}
            <Marker
              position={selectedLocation}
              draggable={true}
              onDragEnd={(e) => {
                if (e.latLng) {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  onLocationSelected({ lat, lng });
                }
              }}
            />

            {/* Render coupon markers */}
            {getFilteredCoupons().map((coupon) => (
              coupon.location && coupon.id ? (
                <Marker
                  key={coupon.id}
                  position={{
                    lat: coupon.location.lat,
                    lng: coupon.location.lng
                  }}
                  onMouseOver={() => handleCouponHover(coupon)}
                  onMouseOut={handleCouponLeave}
                  icon={getCouponIcon(coupon)}
                  title={coupon.name}
                />
              ) : null
            ))}

            {/* Info window for selected coupon */}
            {selectedCoupon && (
              <InfoWindow
                position={{
                  lat: selectedCoupon.location.lat,
                  lng: selectedCoupon.location.lng
                }}
                options={{
                  pixelOffset: new window.google.maps.Size(0, -10),
                  disableAutoPan: false,
                  maxWidth: 420,
                  minWidth: 420
                }}
              >
                <div 
                  className="bg-white pt-0 px-2 pb-2 w-[420px] min-w-[420px] max-w-[420px] rounded-lg shadow-lg info-window-content"
                  style={{ width: '420px', minWidth: '420px', maxWidth: '420px' }}
                  onMouseOver={() => {
                    // Clear any hide timeout when hovering over the info window
                    if (hideTimeoutRef.current) {
                      clearTimeout(hideTimeoutRef.current);
                      hideTimeoutRef.current = null;
                    }
                  }}
                  onMouseOut={handleCouponLeave}
                >
                  {/* Display 3D model if available */}
                  {selectedCoupon.modelUrl ? (
                    <div className="w-full mb-2 rounded-lg overflow-hidden bg-gray-900">
                      <ModelViewer 
                        glbUrl={selectedCoupon.modelUrl} 
                        alt={selectedCoupon.name}
                        poster={selectedCoupon.imageUrl}
                        height="240px"
                      />
                    </div>
                  ) : selectedCoupon.imageUrl ? (
                    <div className="w-full relative mb-2 rounded-lg overflow-hidden bg-gray-900" style={{ width: '420px', height: '240px' }}>
                      <img 
                        src={selectedCoupon.imageUrl} 
                        alt={selectedCoupon.name}
                        className="w-full h-full object-cover"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div className="w-full relative mb-2 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center" style={{ width: '420px', height: '240px' }}>
                      <p className="text-gray-500">No media available</p>
                    </div>
                  )}
                  
                  {/* Fixed width name container */}
                  <div className="w-full px-3 py-2 min-h-[40px] flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                    {/* Status indicator */}
                    <div className="flex items-center mb-1">
                      {(() => {
                        const isActive = isActiveCoupon(selectedCoupon);
                        return (
                          <>
                            <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-xs font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm text-center leading-relaxed max-w-full break-words">
                      {selectedCoupon.name}
                    </h3>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          Click on the map to select a location or drag the marker.
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowInactiveCoupons(!showInactiveCoupons)}
            className={`px-3 py-1 text-sm rounded-md transition ${
              showInactiveCoupons 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title={showInactiveCoupons ? 'Hide inactive coupons' : 'Show inactive coupons'}
          >
            {showInactiveCoupons ? 'Hide Inactive' : 'Show Inactive'}
          </button>
          <button 
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    onLocationSelected({ lat, lng });
                    if (map) {
                      map.panTo({ lat, lng });
                      map.setZoom(14);
                    }
                  },
                  (error) => {
                    console.error("Error getting current location:", error);
                  }
                );
              }
            }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
          >
            Use My Location
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-gray-400 mb-1">Latitude</label>
          <input
            type="number"
            value={selectedLocation.lat}
            onChange={(e) => {
              onLocationSelected({
                ...selectedLocation,
                lat: Number(e.target.value)
              });
            }}
            step="0.000001"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-gray-400 mb-1">Longitude</label>
          <input
            type="number"
            value={selectedLocation.lng}
            onChange={(e) => {
              onLocationSelected({
                ...selectedLocation,
                lng: Number(e.target.value)
              });
            }}
            step="0.000001"
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
} 