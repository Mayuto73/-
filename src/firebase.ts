import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import aiStudioConfig from '../firebase-applet-config.json';

const environmentConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
};

// Vercelなどで環境変数が設定されている場合はそちらを優先し、そうでない場合はAI Studioの設定を利用します
const activeConfig = environmentConfig.projectId ? environmentConfig : aiStudioConfig;

const app = initializeApp(activeConfig);
export const db = getFirestore(app, environmentConfig.projectId ? undefined : aiStudioConfig.firestoreDatabaseId);
export const auth = getAuth(app);
