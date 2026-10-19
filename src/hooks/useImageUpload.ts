import { useState, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

interface UseImageUploadOptions {
  userId: string;
  folder?: string;
}

interface UseImageUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadImage: (file: File) => Promise<string>;
  deleteImage: (imageUrl: string) => Promise<void>;
}

export function useImageUpload({ userId, folder = 'watchlist' }: UseImageUploadOptions): UseImageUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image must be less than 5MB');
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${userId}/${folder}/${timestamp}.${extension}`;
      const storageRef = ref(storage, filename);

      // Upload file
      setProgress(50);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      setProgress(90);

      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);

      setProgress(100);
      return downloadUrl;
    } catch (err: any) {
      console.error('Error uploading image:', err);
      const errorMessage = err.message || 'Failed to upload image';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [userId, folder]);

  const deleteImage = useCallback(async (imageUrl: string): Promise<void> => {
    if (!imageUrl) return;

    try {
      // Extract path from URL
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    } catch (err: any) {
      // Ignore errors if file doesn't exist
      console.warn('Could not delete image:', err.message);
    }
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadImage,
    deleteImage,
  };
}
