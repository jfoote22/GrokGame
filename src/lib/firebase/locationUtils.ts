import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  getDoc,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";

export interface UserLocation {
  userId: string;
  displayName?: string;
  email?: string;
  location: {
    lat: number;
    lng: number;
  };
  isSharing: boolean;
  lastUpdated: Date;
  isOnline: boolean;
}

export interface UserProfile {
  userId: string;
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
  lastUpdated: Date;
}

// Calculate distance between two coordinates in kilometers
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Save user's current location and sharing status
export async function shareUserLocation(
  userId: string, 
  displayName: string | null,
  email: string | null,
  location: { lat: number; lng: number }
): Promise<void> {
  try {
    const userLocationData: UserLocation = {
      userId,
      displayName: displayName || undefined,
      email: email || undefined,
      location,
      isSharing: true,
      lastUpdated: new Date(),
      isOnline: true
    };

    await setDoc(doc(db, 'user_locations', userId), {
      ...userLocationData,
      lastUpdated: Timestamp.fromDate(new Date())
    });

    console.log('[LocationUtils] User location shared successfully');
  } catch (error) {
    console.error('[LocationUtils] Error sharing location:', error);
    throw error;
  }
}

// Stop sharing user's location
export async function stopSharingLocation(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'user_locations', userId), {
      isSharing: false,
      isOnline: false,
      lastUpdated: Timestamp.fromDate(new Date())
    });

    console.log('[LocationUtils] Stopped sharing location');
  } catch (error) {
    console.error('[LocationUtils] Error stopping location share:', error);
    throw error;
  }
}

// Save/update user's profile and privacy settings
export async function saveUserProfile(
  userId: string,
  modularInfo: UserProfile['modularInfo'],
  privacy: UserProfile['privacy']
): Promise<void> {
  try {
    const userProfileData: UserProfile = {
      userId,
      modularInfo,
      privacy,
      lastUpdated: new Date()
    };

    await setDoc(doc(db, 'user_profiles', userId), {
      ...userProfileData,
      lastUpdated: Timestamp.fromDate(new Date())
    }, { merge: true });

    console.log('[LocationUtils] User profile saved successfully');
  } catch (error) {
    console.error('[LocationUtils] Error saving profile:', error);
    throw error;
  }
}

// Listen for nearby users in real-time
export function listenForNearbyUsers(
  currentUserId: string,
  currentLocation: { lat: number; lng: number },
  maxDistanceKm: number = 10, // Default 10km radius
  onUsersUpdate: (users: any[]) => void
): () => void {
  console.log('[LocationUtils] Starting to listen for nearby users...');
  
  // Query for users who are sharing their location and are online
  const q = query(
    collection(db, 'user_locations'),
    where('isSharing', '==', true),
    where('isOnline', '==', true),
    orderBy('lastUpdated', 'desc'),
    limit(50) // Limit to prevent excessive data usage
  );

  return onSnapshot(q, async (snapshot) => {
    try {
      const nearbyUsers: any[] = [];
      
      for (const docSnap of snapshot.docs) {
        const locationData = docSnap.data() as any;
        
        // Skip current user
        if (locationData.userId === currentUserId) continue;
        
        // Convert Firestore timestamp back to Date
        if (locationData.lastUpdated?.toDate) {
          locationData.lastUpdated = locationData.lastUpdated.toDate();
        }
        
        // Calculate distance
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          locationData.location.lat,
          locationData.location.lng
        );
        
        // Only include users within the specified radius
        if (distance <= maxDistanceKm) {
          // Get user's profile data
          try {
            const profileDocRef = doc(db, 'user_profiles', locationData.userId);
            const profileSnap = await getDoc(profileDocRef);
            const profileData = profileSnap.exists() ? profileSnap.data() : null;
            
            const user = {
              id: locationData.userId,
              location: locationData.location,
              isOnline: locationData.isOnline,
              lastSeen: locationData.lastUpdated,
              distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
              displayName: locationData.displayName,
              modularInfo: profileData?.modularInfo || {},
              privacy: profileData?.privacy || {
                showHobbies: false,
                showRelationshipGoals: false,
                showAgeRange: false,
                showCurrentMood: false,
                showAvailability: false,
                showInterests: false
              }
            };
            
            nearbyUsers.push(user);
          } catch (profileError) {
            console.warn('[LocationUtils] Could not fetch profile for user:', locationData.userId);
          }
        }
      }
      
      // Sort by distance (closest first)
      nearbyUsers.sort((a, b) => a.distance - b.distance);
      
      console.log(`[LocationUtils] Found ${nearbyUsers.length} nearby users`);
      onUsersUpdate(nearbyUsers);
      
    } catch (error) {
      console.error('[LocationUtils] Error processing nearby users:', error);
      onUsersUpdate([]);
    }
  });
}

// Mark user as online/offline
export async function updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'user_locations', userId), {
      isOnline,
      lastUpdated: Timestamp.fromDate(new Date())
    });
  } catch (error) {
    console.error('[LocationUtils] Error updating online status:', error);
  }
}

// Clean up old offline users (call this periodically)
export async function cleanupOfflineUsers(): Promise<void> {
  // This would be implemented as a cloud function in production
  // For now, we'll just mark users as offline if they haven't updated in 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  try {
    const q = query(
      collection(db, 'user_locations'),
      where('lastUpdated', '<', Timestamp.fromDate(fiveMinutesAgo)),
      where('isOnline', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { isOnline: false });
    });
    
    await batch.commit();
    console.log(`[LocationUtils] Marked ${snapshot.docs.length} users as offline`);
  } catch (error) {
    console.error('[LocationUtils] Error cleaning up offline users:', error);
  }
} 