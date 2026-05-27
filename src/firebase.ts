import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import aiStudioConfig from '../firebase-applet-config.json';

const environmentConfig = {
  projectId: import.meta.env.jibun-d879b,
  appId: import.meta.env.1:1088686861183:web:cf49f3849cdbae8994c84a,
  apiKey: import.meta.env.AIzaSyAFN-RlhoUlFhHGkKuCmVVR8vCOhlGY0O4,
  authDomain: import.meta.env.jibun-d879b.firebaseapp.com,
};

// Vercelなどで環境変数が設定されている場合はそちらを優先し、そうでない場合はAI Studioの設定を利用します
const activeConfig = environmentConfig.projectId ? environmentConfig : aiStudioConfig;

const app = initializeApp(activeConfig);
export const db = getFirestore(app, environmentConfig.projectId ? undefined : aiStudioConfig.firestoreDatabaseId);
export const auth = getAuth(app);
