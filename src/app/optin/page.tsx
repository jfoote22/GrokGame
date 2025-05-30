"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/Header';
import ModularInfoPanel from '@/components/ModularInfoPanel';
import OptinMap from '@/components/OptinMap';
import {
  shareUserLocation,
  stopSharingLocation,
  saveUserProfile,
  listenForNearbyUsers,
  updateUserOnlineStatus,
  cleanupOfflineUsers
} from '@/lib/firebase/locationUtils';

export interface OptinUser {
  id: string;
  location: { lat: number; lng: number };
  isOnline: boolean;
  lastSeen: Date;
  distance?: number;
  displayName?: string;
  modularInfo: {
    hobbies?: string[];
    relationshipGoals?: string[];
    ageRange?: string;
    currentMood?: string;
    availability?: string;
    interests?: string[];
  };
  privacy: {
    showHobbies: boolean;
    showRelationshipGoals: boolean;
    showAgeRange: boolean;
    showCurrentMood: boolean;
    showAvailability: boolean;
    showInterests: boolean;
  };
}

export default function OptinPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Location state
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [locationError, setLocationError] = useState("");

  // User profile state
  const [modularInfo, setModularInfo] = useState({
    hobbies: [] as string[],
    relationshipGoals: [] as string[],
    ageRange: "",
    currentMood: "",
    availability: "open to chat",
    interests: [] as string[]
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showHobbies: false,
    showRelationshipGoals: false,
    showAgeRange: false,
    showCurrentMood: false,
    showAvailability: false,
    showInterests: false
  });

  // Real-time nearby users (no more mock data!)
  const [nearbyUsers, setNearbyUsers] = useState<OptinUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<OptinUser | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Filter settings
  const [filters, setFilters] = useState({
    ageRanges: [] as string[],
    moods: [] as string[],
    availability: [] as string[],
    hobbies: [] as string[],
    interests: [] as string[],
    relationshipGoals: [] as string[]
  });
  const [filtersEnabled, setFiltersEnabled] = useState(false);

  // Filtered users based on current filters
  const filteredUsers = React.useMemo(() => {
    if (!filtersEnabled) return nearbyUsers;
    
    return nearbyUsers.filter(nearbyUser => {
      // Age range filter
      if (filters.ageRanges.length > 0 && nearbyUser.privacy.showAgeRange) {
        if (!nearbyUser.modularInfo.ageRange || !filters.ageRanges.includes(nearbyUser.modularInfo.ageRange)) {
          return false;
        }
      }
      
      // Mood filter
      if (filters.moods.length > 0 && nearbyUser.privacy.showCurrentMood) {
        if (!nearbyUser.modularInfo.currentMood || !filters.moods.includes(nearbyUser.modularInfo.currentMood)) {
          return false;
        }
      }
      
      // Availability filter
      if (filters.availability.length > 0 && nearbyUser.privacy.showAvailability) {
        if (!nearbyUser.modularInfo.availability || !filters.availability.includes(nearbyUser.modularInfo.availability)) {
          return false;
        }
      }
      
      // Hobbies filter (user must have at least one matching hobby)
      if (filters.hobbies.length > 0 && nearbyUser.privacy.showHobbies) {
        if (!nearbyUser.modularInfo.hobbies || !nearbyUser.modularInfo.hobbies.some(hobby => filters.hobbies.includes(hobby))) {
          return false;
        }
      }
      
      // Interests filter (user must have at least one matching interest)
      if (filters.interests.length > 0 && nearbyUser.privacy.showInterests) {
        if (!nearbyUser.modularInfo.interests || !nearbyUser.modularInfo.interests.some(interest => filters.interests.includes(interest))) {
          return false;
        }
      }
      
      // Relationship goals filter (user must have at least one matching goal)
      if (filters.relationshipGoals.length > 0 && nearbyUser.privacy.showRelationshipGoals) {
        if (!nearbyUser.modularInfo.relationshipGoals || !nearbyUser.modularInfo.relationshipGoals.some(goal => filters.relationshipGoals.includes(goal))) {
          return false;
        }
      }
      
      return true;
    });
  }, [nearbyUsers, filters, filtersEnabled]);

  // Toggle filter for a specific category
  const toggleFilter = (category: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      ageRanges: [],
      moods: [],
      availability: [],
      hobbies: [],
      interests: [],
      relationshipGoals: []
    });
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Save user profile whenever it changes
  useEffect(() => {
    if (user) {
      saveUserProfile(user.uid, modularInfo, privacySettings).catch(error => {
        console.error('Error saving profile:', error);
      });
    }
  }, [user, modularInfo, privacySettings]);

  // Get user's current location and start sharing
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    if (!user) {
      setLocationError("You must be logged in to share location.");
      return;
    }

    setLocationError("");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        try {
          setCurrentLocation(location);
          
          // Save location to database
          await shareUserLocation(
            user.uid,
            user.displayName,
            user.email,
            location
          );
          
          setIsLocationSharing(true);
          console.log("[OptinPage] Started sharing location:", location);
          
          // Start listening for nearby users
          startListeningForNearbyUsers(location);
          
          // Set up periodic location updates (every 30 seconds)
          locationUpdateIntervalRef.current = setInterval(async () => {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const newLocation = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
                };
                setCurrentLocation(newLocation);
                await shareUserLocation(user.uid, user.displayName, user.email, newLocation);
              },
              (error) => console.warn('Location update failed:', error),
              { enableHighAccuracy: false, timeout: 10000 }
            );
          }, 30000);
          
        } catch (error) {
          console.error('Error starting location sharing:', error);
          setLocationError('Failed to start location sharing. Please try again.');
        }
      },
      (error) => {
        setLocationError(error.message);
        setIsLocationSharing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Stop sharing location
  const stopLocationSharing = async () => {
    if (!user) return;
    
    try {
      // Stop listening for nearby users
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      // Clear location update interval
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      
      // Update database
      await stopSharingLocation(user.uid);
      
      setIsLocationSharing(false);
      setCurrentLocation(null);
      setNearbyUsers([]);
      console.log("[OptinPage] Stopped sharing location");
      
    } catch (error) {
      console.error('Error stopping location sharing:', error);
      setLocationError('Failed to stop location sharing.');
    }
  };

  // Start listening for nearby users
  const startListeningForNearbyUsers = (location: { lat: number; lng: number }) => {
    if (!user) return;
    
    setIsLoadingUsers(true);
    
    // Stop any existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    // Start new listener
    unsubscribeRef.current = listenForNearbyUsers(
      user.uid,
      location,
      10, // 10km radius
      (users) => {
        setNearbyUsers(users);
        setIsLoadingUsers(false);
        console.log(`[OptinPage] Updated nearby users: ${users.length} found`);
      }
    );
  };

  // Toggle privacy setting
  const togglePrivacySetting = (setting: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Update modular info
  const updateModularInfo = (field: keyof typeof modularInfo, value: any) => {
    setModularInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Center map on user location and select them
  const centerMapOnUser = (nearbyUser: OptinUser) => {
    setSelectedUser(nearbyUser);
    // Scroll to the map section smoothly
    document.querySelector('.lg\\:col-span-2')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, []);

  // Mark user as online when component mounts and offline when unmounting
  useEffect(() => {
    if (user && isLocationSharing) {
      updateUserOnlineStatus(user.uid, true);
      
      return () => {
        updateUserOnlineStatus(user.uid, false);
      };
    }
  }, [user, isLocationSharing]);

  // Periodic cleanup of offline users (every 2 minutes)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanupOfflineUsers();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(cleanupInterval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Opt In</h1>
          <p className="text-gray-300">
            Share your location and connect with like-minded people nearby. Privacy first - nothing is shared by default.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Modular Info Controls */}
          <div className="lg:col-span-1">
            <ModularInfoPanel
              modularInfo={modularInfo}
              privacySettings={privacySettings}
              onUpdateModularInfo={updateModularInfo}
              onTogglePrivacy={togglePrivacySetting}
              isLocationSharing={isLocationSharing}
              onStartLocationSharing={getCurrentLocation}
              onStopLocationSharing={stopLocationSharing}
              locationError={locationError}
            />
          </div>

          {/* Right Panel - Map */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white mb-2">Live Map</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isLocationSharing ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-300">
                      {isLocationSharing ? 'Broadcasting location' : 'Location sharing off'}
                    </span>
                  </div>
                  <div className="text-gray-400">
                    {isLoadingUsers ? 'Loading...' : `${nearbyUsers.length} people nearby`}
                  </div>
                </div>
              </div>
              
              <OptinMap
                currentLocation={currentLocation}
                nearbyUsers={filteredUsers}
                selectedUser={selectedUser}
                onUserSelected={setSelectedUser}
                isLocationSharing={isLocationSharing}
              />
            </div>

            {/* Filter Section */}
            <div className="bg-gray-800 rounded-lg p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Filters</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={clearAllFilters}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setFiltersEnabled(!filtersEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      filtersEnabled ? 'bg-blue-500' : 'bg-gray-500'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        filtersEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {filtersEnabled ? (
                <div className="space-y-4">
                  {/* Results Summary */}
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-300">
                      Showing {filteredUsers.length} of {nearbyUsers.length} people
                      {Object.values(filters).some(arr => arr.length > 0) && (
                        <span className="text-blue-400 ml-1">
                          (filters active)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Age Range Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Age Range</h3>
                    <div className="flex flex-wrap gap-2">
                      {['teens', '20s', '30s', '40s', '50s', '60+'].map(range => (
                        <button
                          key={range}
                          onClick={() => toggleFilter('ageRanges', range)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            filters.ageRanges.includes(range)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Availability</h3>
                    <div className="flex flex-wrap gap-2">
                      {['open to chat', 'busy', 'available for quick chat', 'do not disturb', 'looking for activity partner', 'free for coffee', 'working'].map(status => (
                        <button
                          key={status}
                          onClick={() => toggleFilter('availability', status)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            filters.availability.includes(status)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Current Mood</h3>
                    <div className="flex flex-wrap gap-2">
                      {['😊', '😎', '🤔', '😴', '🔥', '🌟', '☕', '🎵', '📚', '🏃‍♂️', '🎨', '🌱', '💡', '🎯', '⚡', '🌈', '🧘‍♀️', '🍕', '🎮', '✨'].map(mood => (
                        <button
                          key={mood}
                          onClick={() => toggleFilter('moods', mood)}
                          className={`w-8 h-8 rounded-lg text-lg transition-colors ${
                            filters.moods.includes(mood)
                              ? 'bg-yellow-600 ring-2 ring-yellow-400'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Hobbies Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Hobbies</h3>
                    <div className="flex flex-wrap gap-2">
                      {['hiking', 'photography', 'cooking', 'reading', 'gaming', 'music', 'dancing', 'traveling', 'fitness', 'art', 'writing', 'sports', 'yoga', 'meditation'].map(hobby => (
                        <button
                          key={hobby}
                          onClick={() => toggleFilter('hobbies', hobby)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            filters.hobbies.includes(hobby)
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {hobby}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Interests Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {['tech', 'art', 'music', 'food', 'travel', 'books', 'movies', 'fitness', 'nature', 'science', 'business', 'education'].map(interest => (
                        <button
                          key={interest}
                          onClick={() => toggleFilter('interests', interest)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            filters.interests.includes(interest)
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Relationship Goals Filter */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Looking For</h3>
                    <div className="flex flex-wrap gap-2">
                      {['friendship', 'dating', 'networking', 'collaboration', 'mentorship', 'activity partner', 'travel buddy', 'study group', 'casual hangout'].map(goal => (
                        <button
                          key={goal}
                          onClick={() => toggleFilter('relationshipGoals', goal)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${
                            filters.relationshipGoals.includes(goal)
                              ? 'bg-pink-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-700 rounded-lg">
                  <div className="text-2xl mb-2">🔍</div>
                  <p className="text-gray-300 mb-2">Filters are disabled</p>
                  <p className="text-sm text-gray-400">Enable filters to find people who match your preferences</p>
                </div>
              )}
            </div>

            {/* Nearby People List - moved to right panel */}
            <div className="bg-gray-800 rounded-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-white mb-4">Nearby People</h2>
              
              {!isLocationSharing ? (
                <div className="text-center p-6 bg-gray-700 rounded-lg">
                  <div className="text-4xl mb-2">📍</div>
                  <p className="text-gray-300 mb-2">Location sharing is disabled</p>
                  <p className="text-sm text-gray-400">Enable location sharing to see nearby people</p>
                </div>
              ) : nearbyUsers.length === 0 ? (
                <div className="text-center p-6 bg-gray-700 rounded-lg">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-gray-300 mb-2">No people nearby right now</p>
                  <p className="text-sm text-gray-400">Check back later or try a different location</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => {
                    const visibleInfoCount = Object.values(user.privacy).filter(Boolean).length;
                    let privacyLevel = 'Private';
                    let privacyColor = 'bg-gray-600';
                    
                    if (visibleInfoCount >= 4) {
                      privacyLevel = 'Very Open';
                      privacyColor = 'bg-green-600';
                    } else if (visibleInfoCount >= 2) {
                      privacyLevel = 'Moderate';
                      privacyColor = 'bg-yellow-600';
                    } else if (visibleInfoCount >= 1) {
                      privacyLevel = 'Minimal';
                      privacyColor = 'bg-red-600';
                    }

                    return (
                      <div 
                        key={user.id} 
                        className="bg-gray-700 rounded-lg overflow-hidden border-l-4 border-purple-500 transition hover:bg-gray-650"
                      >
                        {/* User Header */}
                        <div className="flex justify-between items-center p-4">
                          <div className="flex items-center">
                            {/* Privacy Level Indicator */}
                            <span className={`mr-3 px-2 py-1 ${privacyColor} text-white rounded text-xs font-medium`}>
                              {privacyLevel}
                            </span>
                            
                            {/* Mood Icon */}
                            {user.privacy.showCurrentMood && user.modularInfo.currentMood && (
                              <div className="mr-3 w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center text-2xl">
                                {user.modularInfo.currentMood}
                              </div>
                            )}
                            
                            <div>
                              <h3 className="font-semibold text-lg text-white">Anonymous User</h3>
                              {user.privacy.showAvailability && user.modularInfo.availability && (
                                <p className={`text-sm ${user.modularInfo.availability === 'open to chat' ? 'text-green-400' : 'text-yellow-400'}`}>
                                  {user.modularInfo.availability}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Wave Button */}
                            <button
                              onClick={() => console.log('Wave sent to', user.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm flex items-center"
                            >
                              👋 Wave
                            </button>
                            
                            {/* Ping Button */}
                            <button
                              onClick={() => console.log('Ping sent to', user.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-md text-sm flex items-center"
                            >
                              📍 Ping
                            </button>

                            {/* Center on Map Button */}
                            <button
                              onClick={() => centerMapOnUser(user)}
                              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-md text-sm flex items-center"
                              title="View on map"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View on Map
                            </button>
                          </div>
                        </div>
                        
                        {/* User Details */}
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-3">
                              {user.privacy.showAgeRange && user.modularInfo.ageRange && (
                                <div className="bg-gray-800 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-400 mb-1">Age Range</h4>
                                  <p className="text-white">{user.modularInfo.ageRange}</p>
                                </div>
                              )}
                              
                              {user.privacy.showRelationshipGoals && user.modularInfo.relationshipGoals && user.modularInfo.relationshipGoals.length > 0 && (
                                <div className="bg-gray-800 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-400 mb-2">Looking For</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {user.modularInfo.relationshipGoals.map((goal, index) => (
                                      <span key={index} className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                                        {goal}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Right Column: Interests & Hobbies */}
                            <div className="space-y-3">
                              {user.privacy.showHobbies && user.modularInfo.hobbies && user.modularInfo.hobbies.length > 0 && (
                                <div className="bg-gray-800 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-400 mb-2">Hobbies</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {user.modularInfo.hobbies.map((hobby, index) => (
                                      <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                                        {hobby}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {user.privacy.showInterests && user.modularInfo.interests && user.modularInfo.interests.length > 0 && (
                                <div className="bg-gray-800 rounded-lg p-3">
                                  <h4 className="text-sm font-medium text-gray-400 mb-2">Interests</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {user.modularInfo.interests.map((interest, index) => (
                                      <span key={index} className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                                        {interest}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Distance and Status Info */}
                          <div className="mt-3 pt-3 border-t border-gray-600 flex justify-between items-center text-sm">
                            <div className="text-gray-400">
                              {user.isOnline ? (
                                <span className="flex items-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                  Online now
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                                  Last seen: {user.lastSeen.toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-400">
                              Sharing {visibleInfoCount} of 6 info types
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected User Info Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Nearby Person</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedUser.privacy.showAgeRange && selectedUser.modularInfo.ageRange && (
                  <div>
                    <span className="text-gray-400">Age Range: </span>
                    <span className="text-white">{selectedUser.modularInfo.ageRange}</span>
                  </div>
                )}
                
                {selectedUser.privacy.showCurrentMood && selectedUser.modularInfo.currentMood && (
                  <div>
                    <span className="text-gray-400">Current Mood: </span>
                    <span className="text-white text-lg">{selectedUser.modularInfo.currentMood}</span>
                  </div>
                )}
                
                {selectedUser.privacy.showAvailability && selectedUser.modularInfo.availability && (
                  <div>
                    <span className="text-gray-400">Availability: </span>
                    <span className={`${selectedUser.modularInfo.availability === 'open to chat' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {selectedUser.modularInfo.availability}
                    </span>
                  </div>
                )}
                
                {selectedUser.privacy.showHobbies && selectedUser.modularInfo.hobbies && selectedUser.modularInfo.hobbies.length > 0 && (
                  <div>
                    <span className="text-gray-400">Hobbies: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedUser.modularInfo.hobbies.map((hobby, index) => (
                        <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedUser.privacy.showRelationshipGoals && selectedUser.modularInfo.relationshipGoals && selectedUser.modularInfo.relationshipGoals.length > 0 && (
                  <div>
                    <span className="text-gray-400">Looking for: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedUser.modularInfo.relationshipGoals.map((goal, index) => (
                        <span key={index} className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedUser.privacy.showInterests && selectedUser.modularInfo.interests && selectedUser.modularInfo.interests.length > 0 && (
                  <div>
                    <span className="text-gray-400">Interests: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedUser.modularInfo.interests.map((interest, index) => (
                        <span key={index} className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  👋 Wave
                </button>
                <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                  📍 Ping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 