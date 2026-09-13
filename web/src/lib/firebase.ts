import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyB-fAv16ipR0IlSN-rJCdW4TGnpCzjRIWo",
  authDomain: "meugerente-8ef4b.firebaseapp.com",
  projectId: "meugerente-8ef4b",
  storageBucket: "meugerente-8ef4b.firebasestorage.app",
  messagingSenderId: "401588269748",
  appId: "1:401588269748:web:f963da68bb657be79b9de1",
  measurementId: "G-EC1VDR80FJ"
};

// Singleton pattern
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const functions = getFunctions(app);

export const callFunction = (name: string) => httpsCallable(functions, name);

export default app;
