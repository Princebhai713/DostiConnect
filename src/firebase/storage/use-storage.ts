'use client';

import { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase/provider';

export function useStorage() {
  const app = useFirebaseApp();
  const storage = getStorage(app);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      const storageRef = ref(storage, path);
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (uploadError) => {
          console.error("Upload error in hook:", uploadError);
          setError(uploadError.message);
          setIsUploading(false);
          reject(uploadError);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setIsUploading(false);
            resolve(downloadURL);
          } catch (urlError) {
            console.error("Error getting download URL:", urlError);
            setError((urlError as Error).message);
            setIsUploading(false);
            reject(urlError);
          }
        }
      );
    });
  };

  return { uploadFile, isUploading, uploadProgress, error };
}
