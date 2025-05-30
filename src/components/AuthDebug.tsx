"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/hooks/useAuth';

export default function AuthDebug() {
  const { user, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      firebaseConfig: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Missing',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Missing',
      },
      user: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      } : null,
      loading
    };
    setDebugInfo(info);
  }, [user, loading]);

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg mt-4">
      <h3 className="text-lg font-semibold mb-3">🔍 Authentication Debug Info</h3>
      <pre className="text-sm overflow-auto bg-gray-900 p-3 rounded">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      
      <div className="mt-4 space-y-2">
        <h4 className="font-medium">Quick Checklist:</h4>
        <div className="text-sm space-y-1">
          <div className={`${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'text-green-400' : 'text-red-400'}`}>
            ✓ Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}
          </div>
          <div className={`${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'text-green-400' : 'text-red-400'}`}>
            ✓ Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Missing'}
          </div>
          <div className={`${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'text-green-400' : 'text-red-400'}`}>
            ✓ Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Missing'}
          </div>
        </div>
      </div>
    </div>
  );
} 