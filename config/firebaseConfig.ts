import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyDbGPToe9ip8Ozi0bYDFEdTPeVw27stKis',
  appId: '1:471981177559:web:e50a964ed89d9c2396ce92',
  messagingSenderId: '471981177559',
  projectId: 'expenseflow-ykb45',
  storageBucket: 'expenseflow-ykb45.firebasestorage.app',
  // Add platform-specific client IDs for native apps
  ...Platform.select({
    ios: {
      // Use the iOS client ID from your GoogleService-Info.plist
      // You might need to fetch this from your Firebase project settings
      // and add it here or handle it through native configuration
      // For now, I'll keep your placeholder, but you'll need the actual value
      iosClientId: 'YOUR_IOS_CLIENT_ID',
      iosBundleId: 'com.oweme.app', // Use the bundle ID from your app
    },
    android: {
      // Use the Android client ID from your google-services.json
      // You might need to fetch this from your Firebase project settings
      // and add it here or handle it through native configuration
      // For now, I'll keep your placeholder, but you'll need the actual value
      androidClientId: 'AIzaSyDY6sr6tYPvaBHhGO_WNK7R-pIkquUaFLI', // Your Android client ID
    },
  }),
  authDomain: 'expenseflow-ykb45.firebaseapp.com',
  measurementId: 'G-MEASUREMENT_ID'
};

let app: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

authInstance = getAuth(app);
dbInstance = getFirestore(app);

// Attempt to enable Firestore offline persistence
// Note: IndexedDB persistence is for web. For React Native,
// you might consider using AsyncStorage-based persistence if needed.
// This part might need adjustment based on your mobile offline strategy.
try {
  if (Platform.OS === 'web') { // Apply persistence only for web in this config
    enableIndexedDbPersistence(dbInstance, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
      .then(() => {
        console.log("Firebase Firestore offline persistence enabled.");
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore offline persistence failed or already enabled: ", err.message);
        } else if (err.code === 'unimplemented') {
          console.warn("Firestore offline persistence not supported in this browser environment.");
        } else {
          console.error("Firestore offline persistence failed with error: ", err);
        }
      });
  } else {
    // Implement AsyncStorage-based persistence or other mobile offline strategy here if needed
    console.log("Firestore offline persistence for mobile requires different implementation.");
  }
} catch (error) {
    console.error("Error initializing Firestore offline persistence: ", error);
}

export { app, authInstance as auth, dbInstance as db };