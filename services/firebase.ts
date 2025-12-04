import { initializeApp } from 'firebase/app';
import { getStorage, ref, listAll, getDownloadURL, uploadBytesResumable, deleteObject, getMetadata } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
// CRÍTICO: Apontando para o bucket secundário
export const storage = getStorage(app, "gs://armazenamento1-ba1e");

export interface FileItem {
  name: string;
  fullPath: string;
  url: string;
  isImage: boolean;
  size: number;
}

/**
 * Função auxiliar para limpar nome do arquivo
 */
const sanitizeFileName = (name: string): string => {
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const nameWithoutExt = parts.join('.');
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  return ext ? `${cleanName}.${ext}` : cleanName;
};

// --- AUTH FUNCTIONS ---

export const loginUser = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const registerUser = async (email: string, pass: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Cria o documento do usuário no Firestore
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    createdAt: serverTimestamp(),
    role: "user"
  });

  return userCredential;
};

export const logoutUser = () => {
  return firebaseSignOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// --- STORAGE FUNCTIONS (Updated for User Isolation) ---

/**
 * Faz o upload de um arquivo para a pasta do usuário
 */
export const uploadFile = (
  userId: string,
  file: File, 
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Cria um nome único na pasta do usuário: users/{uid}/{timestamp_nome}
    const fileName = `${Date.now()}_${sanitizeFileName(file.name)}`;
    const path = `users/${userId}/${fileName}`;
    const storageRef = ref(storage, path);
    
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'uploadedBy': userId
      }
    };

    console.log(`Iniciando upload para: ${path}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Erro detalhado ao fazer upload:", error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Remove um arquivo do Storage
 */
export const deleteFile = async (fullPath: string): Promise<void> => {
  console.log(`Tentando excluir arquivo no caminho: ${fullPath}`);
  const fileRef = ref(storage, fullPath);
  await deleteObject(fileRef);
  console.log(`Arquivo excluído com sucesso: ${fullPath}`);
};

/**
 * Lista todos os arquivos da pasta do usuário
 */
export const listFiles = async (userId: string): Promise<FileItem[]> => {
  try {
    // Lista apenas dentro da pasta do usuário
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
        console.error(`Erro ao obter dados para ${itemRef.name}`, err);
        return null;
      }
    });

    const results = await Promise.all(filePromises);
    return results.filter((item): item is FileItem => item !== null);
  } catch (error: any) {
    // Se a pasta não existir (usuário novo), o listAll pode lançar erro 404 em alguns casos,
    // ou simplesmente retornar vazio. Vamos tratar erro de objeto não encontrado como lista vazia.
    if (error.code === 'storage/object-not-found') {
      return [];
    }
    console.error("Erro ao listar arquivos:", error);
    throw error;
  }
};

const isImageFile = (filename: string): boolean => {
  const cleanName = filename.split('?')[0];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'];
  const ext = cleanName.split('.').pop()?.toLowerCase();
  return ext ? imageExtensions.includes(ext) : false;
};