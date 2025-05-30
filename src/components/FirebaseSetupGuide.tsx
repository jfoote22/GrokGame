"use client";

import { useState } from 'react';

interface FirebaseSetupGuideProps {
  initialTab?: 'firestore' | 'authentication' | 'storage';
}

export default function FirebaseSetupGuide({ initialTab = 'firestore' }: FirebaseSetupGuideProps) {
  const [activeTab, setActiveTab] = useState<'firestore' | 'authentication' | 'storage'>(initialTab);

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg mt-4">
      <h2 className="text-lg font-semibold text-white mb-4">Firebase Setup Guide</h2>
      
      <div className="mb-4 flex border-b border-gray-700">
        <button 
          className={`px-4 py-2 ${activeTab === 'firestore' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('firestore')}
        >
          Firestore Rules
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'authentication' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('authentication')}
        >
          Authentication
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'storage' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('storage')}
        >
          Storage
        </button>
      </div>
      
      {activeTab === 'firestore' && (
        <div>
          <p className="text-sm text-gray-300 mb-3">
            Your Firestore security rules might be too restrictive. Go to the Firebase Console, navigate to Firestore Database, and click on the "Rules" tab. Update your rules to include:
          </p>
          
          <div className="bg-gray-900 p-3 rounded-md overflow-x-auto mb-4">
            <pre className="text-xs text-green-400 whitespace-pre">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /coupons/{couponId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
    
    // Allow authenticated users to write to the permission_tests collection
    match /permission_tests/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}`}
            </pre>
          </div>
          
          <p className="text-sm text-gray-300 mb-2">
            After updating the rules, click "Publish" to apply the changes. Then refresh this page and try again.
          </p>
        </div>
      )}
      
      {activeTab === 'authentication' && (
        <div>
          <p className="text-sm text-gray-300 mb-3">
            Make sure Google Authentication is properly set up in your Firebase project:
          </p>
          
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300 mb-4">
            <li>Go to the Firebase Console and select your project</li>
            <li>Navigate to "Authentication" from the left sidebar</li>
            <li>Click on the "Sign-in method" tab</li>
            <li>Enable "Google" as a sign-in provider</li>
            <li>Add your domain to the "Authorized domains" list if you're hosting the app on a custom domain</li>
          </ol>
          
          <p className="text-sm text-gray-300">
            After configuring authentication, sign out and sign back in to refresh your authentication tokens.
          </p>
        </div>
      )}
      
      {activeTab === 'storage' && (
        <div>
          <p className="text-sm text-gray-300 mb-3">
            If you're using Firebase Storage for images or files, make sure your storage rules allow authenticated users to read and write:
          </p>
          
          <div className="bg-gray-900 p-3 rounded-md overflow-x-auto mb-4">
            <pre className="text-xs text-green-400 whitespace-pre">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
            </pre>
          </div>
          
          <p className="text-sm text-gray-300">
            These rules allow any authenticated user to read and write to your storage bucket. For production, you might want to implement more restrictive rules.
          </p>
        </div>
      )}
    </div>
  );
} 