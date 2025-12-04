import { initializeApp } from 'firebase/app';
import { getStorage, ref, listAll, getDownloadURL, uploadBytesResumable, deleteObject, getMetadata } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, updateDoc, increment, collection, getDocs, getDoc } from 'firebase/firestore';

// Configuração fornecida pelo usuário
const firebaseConfig = {
  apiKey: "AIzaSyB2FukhQvj7u3KiKC_gz0640qti79Watg4",
  authDomain: "loja-chekout.firebaseapp.com",
  databaseURL: "https://loja-chekout-default-rtdb.firebaseio.com",
  projectId: "loja-chekout",
  storageBucket: "loja-chekout.firebasestorage.app",
  messagingSenderId: "128109279057",
  appId: "1:128109279057:web:4282124b3387836599c570",
  measurementId: "G-7XNR3DWTFB"
};

// Inicialização do App
const app = initializeApp(firebaseConfig);

// Inicialização dos Serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

// Inicialização do Storage com o bucket explícito
export const storage = getStorage(app, "gs://armazenamento1-ba1e");

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

// --- AUTH FUNCTIONS ---

export const loginUser = async (email: string, pass: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  // Atualiza lastLogin
  const userRef = doc(db, "users", userCredential.user.uid);
  try {
    // Verifica se documento existe, se não, cria (para casos de admins manuais)
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
    } else {
      await setDoc(userRef, {
        email: email,
        role: email.includes('admin') ? 'admin' : 'user',
        storageUsed: 0,
        fileCount: 0,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    }
  } catch (e) {
    console.error("Erro ao atualizar login:", e);
  }
  return userCredential;
};

export const registerUser = async (email: string, pass: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Cria o documento do usuário no Firestore com contadores zerados
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    role: "user",
    storageUsed: 0,
    fileCount: 0
  });

  return userCredential;
};

export const logoutUser = () => {
  return firebaseSignOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// --- ADMIN FUNCTIONS ---

export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: UserData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email || 'Sem Email',
        role: data.role || 'user',
        storageUsed: data.storageUsed || 0,
        fileCount: data.fileCount || 0,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin
      });
    });
    return users;
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
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
    const path = `users/${userId}/${fileName}`;
    const storageRef = ref(storage, path);
    
    const metadata = {
      contentType: file.type,
      customMetadata: { 'uploadedBy': userId }
    };
    
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Erro upload:", error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          
          // ATUALIZAÇÃO ATÔMICA NO FIRESTORE: Incrementa uso e contagem
          const userRef = doc(db, "users", userId);
          // Usamos set com merge para garantir que campos existam
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
  // Extrai userId do path (users/{userId}/{file})
  const pathParts = fullPath.split('/');
  const userId = pathParts[1]; // O índice 1 deve ser o ID se o path for users/ID/file

  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);

  // Decrementa uso no Firestore se tivermos o ID e o tamanho
  if (userId && fileSize > 0) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      storageUsed: increment(-fileSize),
      fileCount: increment(-1)
    }).catch(e => console.warn("Erro ao atualizar stats:", e));
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
          isImage: isImageFile(itemRef.name),
          size: metadata.size
        };
      } catch (err) {
        return null;
      }
    });

    const results = await Promise.all(filePromises);
    const validFiles = results.filter((item): item is FileItem => item !== null);
    
    // Sincronização de segurança: atualiza o total calculado real se houver discrepância
    // Isso conserta dados legados
    const totalRealSize = validFiles.reduce((acc, f) => acc + f.size, 0);
    const userRef = doc(db, "users", userId);
    updateDoc(userRef, { 
      storageUsed: totalRealSize,
      fileCount: validFiles.length
    }).catch(() => {}); // Fire and forget update

    return validFiles;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return [];
    }
    throw error;
  }
};

const isImageFile = (filename: string): boolean => {
  const cleanName = filename.split('?')[0];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const ext = cleanName.split('.').pop()?.toLowerCase();
  return ext ? imageExtensions.includes(ext) : false;
};