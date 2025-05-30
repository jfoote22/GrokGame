// Import the global type definitions

import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  limit,
  setDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  // Add scopes if needed
  provider.addScope('email');
  provider.addScope('profile');
  
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('Successfully signed in with Google', result.user.displayName);
    return result.user;
  } catch (error: any) {
    // Check for specific errors
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Sign-in popup was closed by the user');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.log('Sign-in popup request was cancelled');
    } else {
      console.error("Error signing in with Google", error);
    }
    throw error;
  }
};

// Helpers for data conversion
const prepareDataForFirestore = (data: any) => {
  // Create a deep copy to avoid modifying the original
  const prepared = JSON.parse(JSON.stringify(data));
  
  // Convert Date objects to Firestore Timestamps
  Object.keys(prepared).forEach(key => {
    if (prepared[key] instanceof Date) {
      prepared[key] = Timestamp.fromDate(prepared[key]);
    } else if (prepared[key] && typeof prepared[key] === 'object' && !(prepared[key] instanceof Timestamp)) {
      prepared[key] = prepareDataForFirestore(prepared[key]);
    }
  });
  
  return prepared;
};

const convertFromFirestore = (doc: any) => {
  const data = doc.data();
  
  // Convert Firestore Timestamps back to JavaScript Dates
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate();
    } else if (data[key] && typeof data[key] === 'object') {
      data[key] = convertDates(data[key]);
    }
  });
  
  return {
    id: doc.id,
    ...data
  };
};

const convertDates = (obj: any) => {
  if (!obj) return obj;
  
  Object.keys(obj).forEach(key => {
    if (obj[key] instanceof Timestamp) {
      obj[key] = obj[key].toDate();
    } else if (obj[key] && typeof obj[key] === 'object') {
      obj[key] = convertDates(obj[key]);
    }
  });
  
  return obj;
};

// Firestore functions
export const addDocument = async (collectionName: string, data: any, userId?: string) => {
  try {
    console.log(`[Firestore] Attempting to add document to ${collectionName}:`, data);
    
    // Check if user is authenticated when needed
    if (!userId && !auth.currentUser) {
      console.error('[Firestore] Error: No authenticated user found and no userId provided');
      throw new Error('Authentication required to add documents');
    }
    
    // Real Firebase implementation
    const preparedData = prepareDataForFirestore({
      ...data,
      createdAt: new Date(),
      userId: userId || (auth.currentUser ? auth.currentUser.uid : null)
    });
    
    console.log(`[Firestore] Prepared data with userId: ${preparedData.userId}`);
    
    // Check Firestore connection
    if (!db) {
      console.error('[Firestore] Error: Firestore instance is not initialized');
      throw new Error('Firestore connection error');
    }
    
    // Add document with error handling
    try {
      const docRef = await addDoc(collection(db, collectionName), preparedData);
      console.log(`[Firestore] Document added successfully with ID: ${docRef.id}`);
      return docRef;
    } catch (error) {
      console.error(`[Firestore] Error adding document to ${collectionName}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`[Firestore] Failed to add document to ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async (collectionName: string, userId?: string) => {
  // Real Firebase implementation
  let queryRef;
  
  if (userId) {
    // Get only documents that belong to the current user
    queryRef = query(collection(db, collectionName), where("userId", "==", userId));
  } else if (auth.currentUser) {
    // If no userId provided but user is logged in, get their documents
    queryRef = query(collection(db, collectionName), where("userId", "==", auth.currentUser.uid));
  } else {
    // Fallback to getting all documents (not recommended for production)
    queryRef = collection(db, collectionName);
  }
  
  const querySnapshot = await getDocs(queryRef);
  return querySnapshot.docs.map(doc => convertFromFirestore(doc));
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  // Real Firebase implementation
  const preparedData = prepareDataForFirestore({
    ...data,
    updatedAt: new Date()
  });
  return updateDoc(doc(db, collectionName, id), preparedData);
};

export const deleteDocument = async (collectionName: string, id: string) => {
  // Real Firebase implementation
  return deleteDoc(doc(db, collectionName, id));
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  // Real Firebase implementation
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Enhanced permission verification function to detect specific rule issues
export async function verifyFirestorePermissions() {
  try {
    console.log("Verifying Firestore permissions...");
    
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
      console.error("Firestore permission check failed: No authenticated user");
      return { 
        success: false, 
        userId: null, 
        canRead: false, 
        canWrite: false, 
        error: "Not authenticated",
        ruleIssue: "authentication" 
      };
    }

    console.log(`Checking permissions for user: ${user.uid}`);
    
    // Check if Firestore is initialized
    if (!db) {
      console.error("Firestore permission check failed: Firestore not initialized");
      return { 
        success: false, 
        userId: user.uid, 
        canRead: false, 
        canWrite: false, 
        error: "Firestore not initialized",
        ruleIssue: "initialization" 
      };
    }

    // Test write permission with timestamp (critical for rules validation)
    const testDocRef = doc(collection(db, "permission_tests"), `test_${user.uid}_${Date.now()}`);
    try {
      const testData = { 
        testField: "Testing write permission", 
        userId: user.uid,
        timestamp: new Date()
      };
      
      console.log("Attempting to write test document...", testData);
      await setDoc(testDocRef, testData);
      console.log("Write permission test successful");
      
      // Clean up test document
      await deleteDoc(testDocRef);
      console.log("Test document deleted");
      
      // Test read permission specifically on coupons collection
      try {
        const couponsQuery = query(
          collection(db, "coupons"),
          where("userId", "==", user.uid),
          limit(1)
        );
        await getDocs(couponsQuery);
        console.log("Read permission test successful for coupons");
        
        return { 
          success: true, 
          userId: user.uid, 
          canRead: true, 
          canWrite: true,
          ruleIssue: null
        };
      } catch (readError: any) {
        console.error("Read permission test failed:", readError);
        return { 
          success: false, 
          userId: user.uid, 
          canRead: false, 
          canWrite: true, 
          error: readError.message,
          ruleIssue: "read_rules"
        };
      }
    } catch (writeError: any) {
      console.error("Write permission test failed:", writeError);
      
      // Check if the error is related to security rules
      const errorMessage = writeError.message.toLowerCase();
      let ruleIssue = "unknown";
      
      if (errorMessage.includes("permission-denied") || errorMessage.includes("permission denied")) {
        ruleIssue = "write_rules";
      } else if (errorMessage.includes("not authenticated") || errorMessage.includes("unauthenticated")) {
        ruleIssue = "authentication";
      } else if (errorMessage.includes("not found") || errorMessage.includes("field") || errorMessage.includes("schema")) {
        ruleIssue = "schema_validation";
      }
      
      // Test read permission if write failed
      try {
        const couponsQuery = query(
          collection(db, "coupons"),
          where("userId", "==", user.uid),
          limit(1)
        );
        await getDocs(couponsQuery);
        console.log("Read permission test successful for coupons");
        
        return { 
          success: false, 
          userId: user.uid, 
          canRead: true, 
          canWrite: false, 
          error: writeError.message,
          ruleIssue
        };
      } catch (readError: any) {
        console.error("Read permission test also failed:", readError);
        
        // Check for read permission rule issues
        const readErrorMessage = readError.message.toLowerCase();
        if (readErrorMessage.includes("permission-denied") || readErrorMessage.includes("permission denied")) {
          ruleIssue = "all_rules";
        }
        
        return { 
          success: false, 
          userId: user.uid, 
          canRead: false, 
          canWrite: false, 
          error: writeError.message,
          ruleIssue
        };
      }
    }
  } catch (error: any) {
    console.error("Firestore permission verification failed with unexpected error:", error);
    return { 
      success: false, 
      userId: auth.currentUser?.uid || null, 
      canRead: false, 
      canWrite: false, 
      error: error.message,
      ruleIssue: "unexpected"
    };
  }
}
