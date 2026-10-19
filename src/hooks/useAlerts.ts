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
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Alert } from '../types';

export function useAlerts(userId?: string) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribeToAlerts = useCallback(() => {
    // Don't subscribe if no userId
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'alerts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const alertsData: Alert[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ticker: data.ticker || '',
            price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
            typeOfAlert: data.typeOfAlert || 'ge',
            status: data.status || 'active',
            assetType: data.assetType || 'stock',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            triggeredAt: data.triggeredAt?.toDate?.(),
            triggeredPrice: typeof data.triggeredPrice === 'number' ? data.triggeredPrice : undefined,
            userId: data.userId,
            note: data.note || undefined
          };
        });
        setAlerts(alertsData);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error('Error fetching alerts:', err);
        setError('Failed to load alerts');
        setLoading(false);
        setRefreshing(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    const unsubscribe = subscribeToAlerts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribeToAlerts]);

  // Manual refresh function for pull-to-refresh
  const refresh = useCallback(async () => {
    if (!userId) return;
    
    setRefreshing(true);
    
    // Force a fresh fetch
    try {
      const q = query(
        collection(db, 'alerts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const alertsData: Alert[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ticker: data.ticker || '',
          price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0,
          typeOfAlert: data.typeOfAlert || 'ge',
          status: data.status || 'active',
          assetType: data.assetType || 'stock',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          triggeredAt: data.triggeredAt?.toDate?.(),
          triggeredPrice: typeof data.triggeredPrice === 'number' ? data.triggeredPrice : undefined,
          userId: data.userId,
          note: data.note || undefined
        };
      });
      setAlerts(alertsData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing alerts:', err);
      setError('Failed to refresh alerts');
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const addAlert = useCallback(async (
    ticker: string,
    price: number,
    typeOfAlert: 'ge' | 'le',
    note?: string,
    assetType?: 'stock' | 'crypto'
  ) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      const alertData: any = {
        ticker: ticker.toUpperCase(),
        price,
        typeOfAlert,
        status: 'active',
        assetType: assetType || 'stock',
        createdAt: Timestamp.now(),
        userId
      };

      if (note?.trim()) {
        alertData.note = note.trim();
      }

      await addDoc(collection(db, 'alerts'), alertData);
    } catch (err) {
      console.error('Error adding alert:', err);
      throw new Error('Failed to create alert');
    }
  }, [userId]);

  const deleteAlert = useCallback(async (alertId: string) => {
    try {
      await deleteDoc(doc(db, 'alerts', alertId));
    } catch (err) {
      console.error('Error deleting alert:', err);
      throw new Error('Failed to delete alert');
    }
  }, []);

  const reactivateAlert = useCallback(async (alertId: string) => {
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        status: 'active',
        triggeredAt: null,
        triggeredPrice: null
      });
    } catch (err) {
      console.error('Error reactivating alert:', err);
      throw new Error('Failed to reactivate alert');
    }
  }, []);

  const updateAlert = useCallback(async (
    alertId: string,
    data: Partial<Pick<Alert, 'ticker' | 'price' | 'typeOfAlert' | 'note' | 'assetType'>>
  ) => {
    try {
      const updateData: any = { ...data };
      if (data.ticker) updateData.ticker = data.ticker.toUpperCase();
      // Allow setting note to empty string to clear it
      if ('note' in data) {
        updateData.note = data.note?.trim() || null;
      }

      await updateDoc(doc(db, 'alerts', alertId), updateData);
    } catch (err) {
      console.error('Error updating alert:', err);
      throw new Error('Failed to update alert');
    }
  }, []);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const triggeredAlerts = alerts.filter(a => a.status === 'triggered');

  return {
    alerts,
    activeAlerts,
    triggeredAlerts,
    loading,
    refreshing,
    error,
    refresh,
    addAlert,
    updateAlert,
    deleteAlert,
    reactivateAlert
  };
}
