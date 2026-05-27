import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAFN-RlhoUlFhHGkKuCmVVR8vCOhlGY0O4",
  authDomain: "jibun-d879b.firebaseapp.com",
  projectId: "jibun-d879b",
  storageBucket: "jibun-d879b.firebasestorage.app",
  messagingSenderId: "1088686861183",
  appId: "1:1088686861183:web:cf49f3849cdbae8994c84a",
  measurementId: "G-JLHE620JB9"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);
