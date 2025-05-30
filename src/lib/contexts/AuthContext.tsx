"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { signInWithGoogle, logoutUser } from '../firebase/firebaseUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => null,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log('[AUTH] Auth state changed:', authUser ? `${authUser.displayName} (${authUser.email})` : 'No user');
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      console.log('[AUTH] Attempting to sign in with Google');
      const user = await signInWithGoogle();
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      return null;
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
