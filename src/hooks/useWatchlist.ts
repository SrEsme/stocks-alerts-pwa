import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import type { WatchlistItem } from '../types';

export function useWatchlist(userId?: string) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribeToWatchlist = useCallback(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'watchlist'),
      where('userId', '==', userId),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const watchlistData: WatchlistItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ticker: data.ticker || '',
            entryPrice: typeof data.entryPrice === 'number' ? data.entryPrice : parseFloat(data.entryPrice) || 0,
            targetPrice: typeof data.targetPrice === 'number' ? data.targetPrice : parseFloat(data.targetPrice) || 0,
            thesis: data.thesis || '',
            imageUrl: data.imageUrl || undefined,
            order: typeof data.order === 'number' ? data.order : 0,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            userId: data.userId
          };
        });
        setItems(watchlistData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching watchlist:', err);
        setError('Failed to load watchlist');
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    const unsubscribe = subscribeToWatchlist();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToWatchlist]);

  const addItem = useCallback(async (
    data: Omit<WatchlistItem, 'id' | 'order' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      // Get the max order to add at the end
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) + 1 : 0;

      await addDoc(collection(db, 'watchlist'), {
        ticker: data.ticker.toUpperCase(),
        entryPrice: data.entryPrice,
        targetPrice: data.targetPrice,
        thesis: data.thesis,
        imageUrl: data.imageUrl || null,
        order: maxOrder,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId
      });
    } catch (err) {
      console.error('Error adding watchlist item:', err);
      throw new Error('Failed to add to watchlist');
    }
  }, [userId, items]);

  const updateItem = useCallback(async (
    itemId: string,
    data: Partial<Omit<WatchlistItem, 'id' | 'createdAt' | 'userId'>>
  ) => {
    try {
      const updateData: any = { ...data, updatedAt: Timestamp.now() };
      if (data.ticker) updateData.ticker = data.ticker.toUpperCase();

      await updateDoc(doc(db, 'watchlist', itemId), updateData);
    } catch (err) {
      console.error('Error updating watchlist item:', err);
      throw new Error('Failed to update watchlist item');
    }
  }, []);

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'watchlist', itemId));
    } catch (err) {
      console.error('Error deleting watchlist item:', err);
      throw new Error('Failed to delete from watchlist');
    }
  }, []);

  const reorderItems = useCallback(async (reorderedItems: WatchlistItem[]) => {
    try {
      const batch = writeBatch(db);

      reorderedItems.forEach((item, index) => {
        const itemRef = doc(db, 'watchlist', item.id);
        batch.update(itemRef, { order: index });
      });

      await batch.commit();
    } catch (err) {
      console.error('Error reordering watchlist:', err);
      throw new Error('Failed to reorder watchlist');
    }
  }, []);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    reorderItems
  };
}
