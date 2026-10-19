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
// Force fresh login and account selection
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'online'
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider mounted');
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    // Much longer timeout for mobile devices
    const failsafeTimeout = 20000; // 20 seconds
    
    console.log(`📱 Device: iOS=${isIOS}, Standalone=${isStandalone}, Timeout=${failsafeTimeout}ms`);

    const failsafeTimer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth check timed out after 20s. Forcing loading=false.');
        setLoading(false);
      }
    }, failsafeTimeout);

    // Handle redirect result first
    const handleRedirectResult = async () => {
      try {
        console.log('🔍 Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('✅ SUCCESS: Signed in via redirect:', result.user.email);
          setUser(result.user);
          setLoading(false);
          clearTimeout(failsafeTimer);
          return true;
        } else {
          console.log('ℹ️ No redirect result found');
          return false;
        }
      } catch (error: any) {
        console.error('❌ Redirect result error:', error);
        // Show user-friendly error in UI
        if (error.code === 'auth/unauthorized-domain') {
          alert('🚨 Domain not authorized. Please contact support.');
        } else if (error.code === 'auth/popup-closed-by-user') {
          // Don't show error for user cancellation
          console.log('User cancelled login');
        } else {
          alert(`🚨 Login Error: ${error.message || 'Unknown error'}`);
        }
        setLoading(false);
        clearTimeout(failsafeTimer);
        return false;
      }
    };

    handleRedirectResult().then((redirectHandled) => {
      if (!redirectHandled) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('👤 Auth state change:', user ? `${user.email} (${user.uid.slice(0,8)}...)` : 'No user');
          setUser(user);
          setLoading(false);
          clearTimeout(failsafeTimer);
        });

        return () => {
          unsubscribe();
          clearTimeout(failsafeTimer);
        };
      } else {
        clearTimeout(failsafeTimer);
      }
    });

    return () => {
      clearTimeout(failsafeTimer);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (!auth.app.options.apiKey) throw new Error('Firebase API Key missing');
      
      setLoading(true);
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      console.log(`📱 Sign-in attempt - iOS: ${isIOS}, Standalone: ${isStandalone}, Mobile: ${isMobile}`);
      
      // ALWAYS use redirect for mobile devices - popups are unreliable
      if (isMobile || isIOS) {
        console.log('📱 Mobile device detected: Using Redirect (forced)');
        // Add a visual indicator that redirect is happening
        const loginBtn = document.querySelector('.google-signin-btn');
        if (loginBtn) {
          loginBtn.textContent = 'Redirecting to Google...';
        }
        
        // Give user time to see the message, then redirect
        setTimeout(async () => {
          try {
            await signInWithRedirect(auth, googleProvider);
          } catch (error: any) {
            console.error('Redirect failed:', error);
            setLoading(false);
            alert(`Redirect failed: ${error.message}`);
          }
        }, 1000);
        
      } else {
        console.log('🖥️ Desktop detected: Using Popup');
        try {
          const result = await signInWithPopup(auth, googleProvider);
          console.log('✅ Popup signin success:', result.user.email);
          setLoading(false);
        } catch (error: any) {
          if (error.code === 'auth/popup-blocked') {
            console.log('Popup blocked, falling back to redirect...');
            await signInWithRedirect(auth, googleProvider);
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Sign-in error:', error);
      setLoading(false);
      
      let errorMessage = 'Failed to sign in';
      
      switch (error.code) {
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up blocked. Trying redirect instead...';
          // Try redirect as fallback
          setTimeout(() => signInWithRedirect(auth, googleProvider), 1000);
          return;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in cancelled by user.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'Domain not authorized. Please contact support.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google sign-in is not enabled. Please contact support.';
          break;
        default:
          errorMessage = error.message || 'Unknown error occurred';
      }
      
      alert(`🚨 Login Error: ${errorMessage}`);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log('✅ Successfully logged out');
    } catch (error) {
      console.error('❌ Error signing out:', error);
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