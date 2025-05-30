# Coupon Management System

A full-featured coupon management application that allows users to create, edit, and view coupons on a map. Built with Next.js, TypeScript, Firebase, and Google Maps.

## Features

- 🔐 Google Authentication
- 🗺️ Interactive map with coupon locations
- 📱 Responsive design
- 🎨 Dark mode interface
- 🔍 Filter coupons by location
- 📅 Date and time scheduling
- 🖼️ AI-generated images for coupons
- 🎭 3D model generation

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd coupon-management-system
npm install
```

### 2. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup steps
3. Enable the following services:
   - Authentication (with Google sign-in method)
   - Firestore Database
   - Storage

### 3. Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Under "Your apps", click the web app icon (</>) to create a new web app
3. Register the app with a nickname (e.g., "Coupon Management System")
4. Copy the firebaseConfig values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Configure Environment Variables

1. Create a `.env.local` file in the root of your project:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"

# Replicate API Key (optional, for 3D model generation)
REPLICATE_API_TOKEN="YOUR_REPLICATE_API_TOKEN"
```

### 5. Set Up Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select your existing Firebase project
3. Enable the Maps JavaScript API
4. Create an API key and restrict it to your domain
5. Add the API key to your `.env.local` file

### 6. Configure Firebase Security Rules

#### Firestore Database Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /coupons/{couponId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

#### Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Optional: Replicate API for 3D Models

If you want to use the 3D model generation feature:

1. Create an account at [Replicate](https://replicate.com/)
2. Get an API token from your account settings
3. Add the token to your `.env.local` file

## Build for Production

```bash
npm run build
npm start
```

## Deployment

This application can be deployed on Vercel, Netlify, or any other Next.js-compatible hosting platform. Make sure to configure the environment variables on your hosting platform.

## License

MIT