import { db, auth } from "../firebase";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { DailyLog, DaySchedule, WeekCheck, SemesterGoal } from "./types";

export const storage = getStorage();

export async function uploadPhoto(file: File): Promise<string> {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ext = file.name.split('.').pop();
  const fileName = `${auth.currentUser.uid}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  const storageRef = ref(storage, fileName);
  await uploadBytesResumable(storageRef, file);
  return await getDownloadURL(storageRef);
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Daily Logs
export async function saveDailyLog(log: DailyLog) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const path = `users/${auth.currentUser.uid}/dailyLogs`;
  
  try {
    await setDoc(doc(db, path, log.date), {
      ...log,
      userId: auth.currentUser.uid, // ensure standard
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  if (!auth.currentUser) return null;
  const path = `users/${auth.currentUser.uid}/dailyLogs`;
  
  try {
    const docSnap = await getDoc(doc(db, path, date));
    if (docSnap.exists()) {
      return docSnap.data() as DailyLog;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function getAllDailyLogs(): Promise<DailyLog[]> {
  if (!auth.currentUser) return [];
  const path = `users/${auth.currentUser.uid}/dailyLogs`;
  try {
    const q = query(collection(db, path), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DailyLog);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
    return [];
  }
}

// Schedules
export async function saveSchedules(schedules: DaySchedule[]) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const path = `users/${auth.currentUser.uid}/schedule`;
  
  try {
    const batch = writeBatch(db);
    schedules.forEach(schedule => {
      const docRef = doc(db, path, schedule.date);
      batch.set(docRef, { ...schedule, userId: auth.currentUser!.uid }, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getSchedule(date: string): Promise<DaySchedule | null> {
  if (!auth.currentUser) return null;
  const path = `users/${auth.currentUser.uid}/schedule`;
  
  try {
    const docSnap = await getDoc(doc(db, path, date));
    if (docSnap.exists()) {
      return docSnap.data() as DaySchedule;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function getWeekSchedules(startDate: string, endDate: string): Promise<DaySchedule[]> {
  if (!auth.currentUser) return [];
  const path = `users/${auth.currentUser.uid}/schedule`;
  try {
    const q = query(
      collection(db, path), 
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DaySchedule);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
    return [];
  }
}

// Week checks
export async function saveWeekCheck(check: WeekCheck) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const path = `users/${auth.currentUser.uid}/weekChecks`;
  try {
    await setDoc(doc(db, path, check.weekStartDate), {
      ...check,
      userId: auth.currentUser.uid
    }, { merge: true });
  } catch(e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
}

export async function getWeekCheck(weekStartDate: string): Promise<WeekCheck | null> {
  if (!auth.currentUser) return null;
  const path = `users/${auth.currentUser.uid}/weekChecks`;
  try {
    const snap = await getDoc(doc(db, path, weekStartDate));
    if (snap.exists()) return snap.data() as WeekCheck;
    return null;
  } catch(e) {
    handleFirestoreError(e, OperationType.GET, path);
    return null;
  }
}
