// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Ensure these environment variables are set in your .env.local file for local development
// And configured in your hosting environment for production
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;

if (typeof window !== "undefined") { // Ensure Firebase is initialized only on the client side
  if (!getApps().length) {
    if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) { // Basic check for config presence
        app = initializeApp(firebaseConfig);
    } else {
        console.warn("Firebase configuration is missing. Firebase App could not be initialized.");
        // @ts-ignore // Assign a dummy object if not initialized to prevent errors, handle this case in app logic
        app = {} 
    }
  } else {
    app = getApp();
  }
} else {
    // @ts-ignore // Assign a dummy object for server-side rendering
    app = {};
}


export { app };
