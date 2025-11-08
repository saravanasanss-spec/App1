// Firebase Configuration
// Replace with your Firebase project credentials

const firebaseConfig = {
    // TODO: Replace with your Firebase project config
    // Get this from: Firebase Console -> Project Settings -> General -> Your apps
    apiKey: "AIzaSyA38tT5SS0qRfT8o1wZfzNO6oOaHO_uQ8k",
  authDomain: "testbillproject-97d32.firebaseapp.com",
  projectId: "testbillproject-97d32",
  storageBucket: "testbillproject-97d32.firebasestorage.app",
  messagingSenderId: "398561260831",
  appId: "1:398561260831:web:e87a6d37c155753e322c2a",
  measurementId: "G-TMXRN95CNH"
};

// Initialize Firebase (only if Firebase SDK is loaded)
let db = null;
let firebaseInitialized = false;

if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        firebaseInitialized = true;
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
} else {
    console.warn('Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
}

