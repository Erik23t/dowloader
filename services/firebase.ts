// Fix: Use namespace import to resolve issue with initializeApp export in some environments
import * as firebaseApp from 'firebase/app';
import { getStorage, ref, listAll, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';

// Configuração fornecida pelo usuário
const firebaseConfig = {
  apiKey: "AIzaSyB2FukhQvj7u3KiKC_gz0640qti79Watg4",
  authDomain: "loja-chekout.firebaseapp.com",
  databaseURL: "https://loja-chekout-default-rtdb.firebaseio.com",
  projectId: "loja-chekout",
  storageBucket: "loja-chekout.firebasestorage.app",
  messagingSenderId: "128109279057",
  appId: "1:128109279057:web:3ad9bbf84bb2cba799c570",
  measurementId: "G-TC0XZHFTVM"
};

// Inicialização do App
// Fix: Access initializeApp from the namespace object and cast to any to avoid type errors
const app = (firebaseApp as any).initializeApp(firebaseConfig);

// Inicialização do Storage com o bucket explícito conforme solicitado
// CRÍTICO: Apontando para o bucket secundário
export const storage = getStorage(app, "gs://armazenamento1-ba1e");

export interface FileItem {
  name: string;
  fullPath: string;
  url: string;
  isImage: boolean;
}

/**
 * Função auxiliar para limpar nome do arquivo e evitar erros de caminho
 */
const sanitizeFileName = (name: string): string => {
  // Remove extensão para tratar separadamente
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const nameWithoutExt = parts.join('.');
  
  // Remove caracteres especiais e espaços
  const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return ext ? `${cleanName}.${ext}` : cleanName;
};

/**
 * Faz o upload de um arquivo para a raiz do bucket com metadados e progresso
 */
export const uploadFile = (
  file: File, 
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Cria um nome único com timestamp para evitar cache ou sobrescrita acidental
    const fileName = `${Date.now()}_${sanitizeFileName(file.name)}`;
    const storageRef = ref(storage, fileName);
    
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'uploadedBy': 'WebDashboard'
      }
    };

    console.log(`Iniciando upload de: ${fileName} para bucket secundário...`);
    
    // Usando uploadBytesResumable para suportar progresso
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
          console.log('Upload concluído, obtendo URL...');
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
 * Lista todos os arquivos da raiz do bucket configurado
 */
export const listFiles = async (): Promise<FileItem[]> => {
  try {
    const listRef = ref(storage, '/');
    const res = await listAll(listRef);

    const filePromises = res.items.map(async (itemRef) => {
      try {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url: url,
          isImage: isImageFile(itemRef.name)
        };
      } catch (err) {
        console.error(`Erro ao obter URL para ${itemRef.name}`, err);
        return null;
      }
    });

    const results = await Promise.all(filePromises);
    return results.filter((item): item is FileItem => item !== null);
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    throw error;
  }
};

const isImageFile = (filename: string): boolean => {
  // Remove parâmetros de query string se houver (embora filename do storage não tenha)
  const cleanName = filename.split('?')[0];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'];
  const ext = cleanName.split('.').pop()?.toLowerCase();
  return ext ? imageExtensions.includes(ext) : false;
};