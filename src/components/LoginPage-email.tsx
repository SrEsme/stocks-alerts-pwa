import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isResetPassword) {
        await resetPassword(email);
        alert('Password reset email sent! Check your inbox.');
        setIsResetPassword(false);
        setEmail('');
      } else if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      let errorMessage = 'An error occurred';
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already registered';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Try again later.';
          break;
        default:
          errorMessage = err.message || 'Authentication failed';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 13.5L8.5 8L12.5 12L21 3.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 3.5H21V7.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 20.5H21"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="login-title">Stock Alerts</h1>
        <p className="login-subtitle">Get notified when your stocks hit target prices</p>

        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </span>
            <span className="feature-text">Real-time price monitoring</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </span>
            <span className="feature-text">Instant notifications</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </span>
            <span className="feature-text">Works on any device</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              disabled={isLoading}
            />
          </div>

          {!isResetPassword && (
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="form-input"
                disabled={isLoading}
              />
            </div>
          )}

          {isSignUp && !isResetPassword && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>
          )}

          <button 
            type="submit"
            className="email-signin-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="btn-spinner"></div>
            ) : isResetPassword ? (
              'Send Reset Email'
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>

          <div className="auth-links">
            {!isResetPassword ? (
              <>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setIsSignUp(!isSignUp)}
                  disabled={isLoading}
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </button>
                
                {!isSignUp && (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setIsResetPassword(true);
                      setPassword('');
                    }}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setIsResetPassword(false);
                  setEmail('');
                }}
                disabled={isLoading}
              >
                Back to sign in
              </button>
            )}
          </div>
        </form>

        <p className="login-terms">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      <div className="login-background">
        <div className="bg-gradient"></div>
        <div className="bg-pattern"></div>
      </div>
    </div>
  );
};