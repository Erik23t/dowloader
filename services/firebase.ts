// @ts-ignore
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  serverTimestamp as firestoreServerTimestamp, 
  increment 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  listAll, 
  getMetadata 
} from 'firebase/storage';

// Safe environment variable access
const getEnv = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    return import.meta.env[key] || fallback;
  } catch (e) {
    return fallback;
  }
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY", "AIzaSyB2FukhQvj7u3KiKC_gz0640qti79Watg4"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN", "loja-chekout.firebaseapp.com"),
  databaseURL: getEnv("VITE_FIREBASE_DATABASE_URL", "https://loja-chekout-default-rtdb.firebaseio.com"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID", "loja-chekout"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET", "loja-chekout.firebasestorage.app"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "128109279057"),
  appId: getEnv("VITE_FIREBASE_APP_ID", "1:128109279057:web:4282124b3387836599c570"),
  measurementId: "G-7XNR3DWTFB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Explicit Bucket Initialization (CRITICAL for this project)
export const storage = getStorage(app, "gs://armazenamento1-ba1e");

export type User = FirebaseUser;

export interface FileItem {
  name: string;
  fullPath: string;
  url: string;
  isImage: boolean;
  size: number;
}

export interface UserData {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  storageUsed: number;
  fileCount: number;
  createdAt: any;
  lastLogin?: any;
}

const sanitizeFileName = (name: string): string => {
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const nameWithoutExt = parts.join('.');
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  return ext ? `${cleanName}.${ext}` : cleanName;
};

// Helper for serverTimestamp
export const getServerTimestamp = () => firestoreServerTimestamp();

// --- AUTH FUNCTIONS ---

export const loginUser = async (email: string, pass: string): Promise<UserCredential> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  
  if (userCredential.user) {
    const userRef = doc(db, "users", userCredential.user.uid);
    try {
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        await updateDoc(userRef, { lastLogin: getServerTimestamp() });
      } else {
        await setDoc(userRef, {
          email: email,
          role: email.includes('admin') ? 'admin' : 'user',
          storageUsed: 0,
          fileCount: 0,
          createdAt: getServerTimestamp(),
          lastLogin: getServerTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.warn("Firestore sync skipped (login)", e);
    }
  }
  return userCredential;
};

export const registerUser = async (email: string, pass: string): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  if (user) {
    const role = email === 'ediran@admin.com' ? 'admin' : 'user';
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: getServerTimestamp(),
      lastLogin: getServerTimestamp(),
      role: role,
      storageUsed: 0,
      fileCount: 0
    });
  }

  return userCredential;
};

export const logoutUser = () => {
  return signOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// --- ADMIN FUNCTIONS ---

export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: UserData[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        uid: docSnap.id,
        email: data.email || 'No Email',
        role: data.role || 'user',
        storageUsed: data.storageUsed || 0,
        fileCount: data.fileCount || 0,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin
      });
    });
    return users;
  } catch (error) {
    console.error("Admin fetch error:", error);
    throw error;
  }
};

// --- STORAGE FUNCTIONS ---

export const uploadFile = (
  userId: string,
  file: File, 
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileName = `${Date.now()}_${sanitizeFileName(file.name)}`;
    // Path: users/{userId}/{fileName}
    const path = `users/${userId}/${fileName}`;
    const storageRef = ref(storage, path);
    
    const metadata = {
      contentType: file.type,
      customMetadata: { 
        'uploadedBy': userId,
        'originalName': file.name
      }
    };
    
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          
          const userRef = doc(db, "users", userId);
          await setDoc(userRef, {
            storageUsed: increment(file.size),
            fileCount: increment(1)
          }, { merge: true });

          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

export const deleteFile = async (fullPath: string, fileSize: number = 0): Promise<void> => {
  const pathParts = fullPath.split('/');
  if (pathParts[0] !== 'users' || pathParts.length < 3) {
    throw new Error("Invalid path");
  }
  const userId = pathParts[1]; 

  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);

  if (userId) {
    const userRef = doc(db, "users", userId);
    try {
      if (fileSize > 0) {
        await updateDoc(userRef, {
          storageUsed: increment(-fileSize),
          fileCount: increment(-1)
        });
      } else {
        // Fallback simple decrement if size unknown
        await updateDoc(userRef, {
          fileCount: increment(-1)
        });
      }
    } catch(e) {
      // Ignora erro de contagem
    }
  }
};

export const listFiles = async (userId: string): Promise<FileItem[]> => {
  try {
    const listRef = ref(storage, `users/${userId}/`);
    const res = await listAll(listRef);

    const filePromises = res.items.map(async (itemRef) => {
      try {
        const [url, metadata] = await Promise.all([
          getDownloadURL(itemRef),
          getMetadata(itemRef)
        ]);
        
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url: url,
          isImage: metadata.contentType?.startsWith('image/') || false,
          size: metadata.size
        };
      } catch (err) {
        return null;
      }
    });

    const results = await Promise.all(filePromises);
    const validFiles = results.filter((item): item is FileItem => item !== null);
    
    // Self-healing stats
    const totalRealSize = validFiles.reduce((acc, f) => acc + f.size, 0);
    const userRef = doc(db, "users", userId);
    setDoc(userRef, { 
      storageUsed: totalRealSize,
      fileCount: validFiles.length
    }, { merge: true }).catch(() => {});

    return validFiles;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return [];
    }
    throw error;
  }
};