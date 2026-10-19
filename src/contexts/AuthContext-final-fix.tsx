import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  GoogleAuthProvider,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();
// Force fresh auth without loops
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider mounted');
    console.log('🌐 Current URL:', window.location.href);
    
    const failsafeTimer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth timeout - forcing loading=false');
        setLoading(false);
      }
    }, 15000);

    // CRITICAL: Check for redirect result IMMEDIATELY on page load
    const handleRedirectResult = async () => {
      try {
        console.log('🔍 Checking redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result?.user) {
          console.log('✅ AUTH SUCCESS via redirect:', result.user.email);
          setUser(result.user);
          setLoading(false);
          clearTimeout(failsafeTimer);
          return true;
        } else {
          console.log('ℹ️ No redirect result found');
          return false;
        }
      } catch (error: any) {
        console.error('❌ Redirect error:', error);
        
        // Clear loading state on error
        setLoading(false);
        clearTimeout(failsafeTimer);
        
        // Show user-friendly error
        alert(`Auth Error: ${error.message || 'Login failed'}`);
        return false;
      }
    };

    // Check redirect result first, then set up listener
    handleRedirectResult().then((handled) => {
      if (!handled) {
        // Set up auth state listener only if no redirect was processed
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('👤 Auth state:', user ? user.email : 'Not logged in');
          setUser(user);
          setLoading(false);
          clearTimeout(failsafeTimer);
        });

        return () => {
          unsubscribe();
          clearTimeout(failsafeTimer);
        };
      }
    });

    return () => {
      clearTimeout(failsafeTimer);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Starting Google sign-in...');
      setLoading(true);
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('📱 Mobile detected: Using redirect');
        // For mobile: always redirect, never popup
        await signInWithRedirect(auth, googleProvider);
        // Page will reload, so this line won't execute
      } else {
        console.log('🖥️ Desktop: Trying popup first');
        try {
          // Desktop: try popup first
          const result = await signInWithPopup(auth, googleProvider);
          console.log('✅ Popup success:', result.user.email);
          setLoading(false);
        } catch (popupError: any) {
          if (popupError.code === 'auth/popup-blocked') {
            console.log('Popup blocked, using redirect...');
            await signInWithRedirect(auth, googleProvider);
          } else {
            throw popupError;
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Sign-in failed:', error);
      setLoading(false);
      
      let message = 'Login failed';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Login cancelled';
      } else if (error.message) {
        message = error.message;
      }
      
      alert(`Login Error: ${message}`);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log('✅ Logged out');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};