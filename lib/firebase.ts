// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCQc1bkQ77D_b3fcjbMCYuDIPo2nVnLM10",
    authDomain: "expanse-c7a7d.firebaseapp.com",
    projectId: "expanse-c7a7d",
    storageBucket: "expanse-c7a7d.firebasestorage.app",
    messagingSenderId: "661110599744",
    appId: "1:661110599744:web:0ba0ddf22d9b5e15332fa5",
    measurementId: "G-1DSF6BD8WW"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, db, auth, analytics };
