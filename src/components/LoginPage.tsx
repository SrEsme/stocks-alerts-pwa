import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const ArrowIcon = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M10 4l6 6-6 6" /></svg>;

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
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Email is already registered',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many failed attempts. Try again later.',
      };
      setError(messages[err.code] || err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="brand" href="#top" aria-label="Stock Alerts home">
          <span className="brand-mark"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 16 5-5 4 3 8-9M15 5h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span>stock<span className="brand-accent">alerts</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a className="nav-cta" href="#account">{isSignUp ? 'Create account' : 'Sign in'} <ArrowIcon /></a>
        </nav>
      </header>

      <section className="landing-hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> Your market watch, made personal</div>
          <h1>Good timing<br />starts with <span>your targets.</span></h1>
          <p>Set the price that matters to you. Stock Alerts keeps watch over stocks and crypto, so you can focus on everything else.</p>
          <div className="hero-actions">
            <a className="primary-cta" href="#account">Start tracking <ArrowIcon /></a>
            <a className="text-cta" href="#features">Explore the app <span>↓</span></a>
          </div>
          <div className="hero-note"><span className="note-check">✓</span> Your watchlist. Your levels. Your call.</div>
        </div>

        <div className="product-stage" aria-label="Preview of the Stock Alerts dashboard">
          <div className="stage-glow" />
          <div className="dashboard-window">
            <div className="dashboard-topbar"><div className="window-dots"><i /><i /><i /></div><span>APP PREVIEW</span><span className="live-indicator"><i /> DEMO DATA</span></div>
            <div className="dashboard-content">
              <div className="dashboard-heading"><div><span className="tiny-label">MONDAY, OCTOBER 19</span><h2>Your watchlist</h2></div><span className="avatar">A</span></div>
              <div className="market-summary"><div><span className="tiny-label">TRACKING</span><strong>08 <small>assets</small></strong></div><div className="summary-divider" /><div><span className="tiny-label">PRICE ALERTS</span><strong>03 <small>active</small></strong></div><div className="summary-spark"><svg viewBox="0 0 100 36" preserveAspectRatio="none"><path d="M0 30 C14 29 17 11 28 18S43 27 51 14 66 20 73 8 88 16 100 2" /></svg></div></div>
              <div className="watchlist-title"><span>ON YOUR RADAR</span><span>View all ↗</span></div>
              <div className="asset-row"><span className="asset-icon apple">A</span><div className="asset-name"><strong>Apple</strong><small>AAPL · Stock</small></div><div className="asset-price"><strong>$248.50</strong><small className="positive">+1.24%</small></div><div className="mini-chart green"><svg viewBox="0 0 74 28"><path d="M1 23 12 17 20 20 30 10 40 15 50 7 61 11 73 2" /></svg></div></div>
              <div className="asset-row"><span className="asset-icon bitcoin">₿</span><div className="asset-name"><strong>Bitcoin</strong><small>BTC · Crypto</small></div><div className="asset-price"><strong>$108,240</strong><small className="positive">+2.08%</small></div><div className="mini-chart green"><svg viewBox="0 0 74 28"><path d="M1 21 12 23 20 14 30 19 40 9 50 13 61 5 73 2" /></svg></div></div>
              <div className="asset-row"><span className="asset-icon nvidia">N</span><div className="asset-name"><strong>NVIDIA</strong><small>NVDA · Stock</small></div><div className="asset-price"><strong>$182.16</strong><small className="negative">−0.36%</small></div><div className="mini-chart red"><svg viewBox="0 0 74 28"><path d="M1 5 12 8 20 4 30 14 40 11 50 20 61 15 73 25" /></svg></div></div>
              <div className="alert-preview"><span className="alert-bell">⌁</span><span><strong>Price alert</strong><small>NVDA reaches your $180 target</small></span><span className="alert-tag">NEAR TARGET</span></div>
            </div>
          </div>
          <div className="floating-card"><span className="floating-icon">↗</span><span><small>ALERT TRIGGERED</small><strong>BTC crossed $108k</strong></span><span className="floating-check">✓</span></div>
          <div className="stage-caption"><span className="caption-line" /> A clearer view of what you’re watching</div>
        </div>
      </section>

      <section className="proof-strip" aria-label="App capabilities">
        <span><b>01</b> Stocks & crypto</span><i />
        <span><b>02</b> Price alerts</span><i />
        <span><b>03</b> Personal watchlists</span><i />
        <span><b>04</b> Built for mobile</span>
      </section>

      <section className="features-section" id="features">
        <div className="section-intro"><span className="section-kicker">A LITTLE MORE CLARITY</span><h2>Keep your eye on<br />what <em>matters.</em></h2><p>One focused place to follow the assets you care about and the prices you’ve picked.</p></div>
        <div className="feature-grid">
          <article className="feature-card feature-card-large"><div className="feature-illustration target-art"><span className="target-ring ring-one" /><span className="target-ring ring-two" /><span className="target-ring ring-three" /><span className="target-center">◎</span><span className="target-tag">$180.00</span></div><span className="card-number">01 / SET A LEVEL</span><h3>Alerts that match your plan.</h3><p>Choose a target above or below the current price and add a note to remember why it matters.</p></article>
          <article className="feature-card"><div className="feature-illustration assets-art"><span className="coin coin-btc">₿</span><span className="coin coin-eth">◆</span><span className="stock-tile">AAPL</span><span className="asset-arrow">↗</span></div><span className="card-number">02 / ONE WATCHLIST</span><h3>Stocks and crypto, together.</h3><p>Keep your favourite tickers and digital assets close at hand.</p></article>
          <article className="feature-card"><div className="feature-illustration notes-art"><span className="note-sheet"><i /><i /><i /><b>MY THESIS</b></span><span className="note-pin">✳</span><span className="note-line">A plan worth keeping</span></div><span className="card-number">03 / YOUR CONTEXT</span><h3>Remember the thinking.</h3><p>Add a thesis, entry price, and target to the assets on your watchlist.</p></article>
        </div>
      </section>

      <section className="how-section" id="how-it-works"><div><span className="section-kicker">GET STARTED IN MINUTES</span><h2>Simple by design.</h2></div><div className="steps"><div><span>1</span><p><strong>Add an asset</strong><small>Find a stock or supported crypto.</small></p></div><div><span>2</span><p><strong>Pick your price</strong><small>Set the level you want to watch.</small></p></div><div><span>3</span><p><strong>Get back to your day</strong><small>We’ll keep an eye on your alerts.</small></p></div></div></section>

      <section className="account-section" id="account">
        <div className="account-copy"><span className="section-kicker">YOUR MARKETS, YOUR WAY</span><h2>Ready when<br />you are.</h2><p>Sign in to your account or create one to start building a personal watchlist.</p><div className="account-benefit"><span>✓</span> Your data stays connected to your account</div><div className="account-benefit"><span>✓</span> Access your watchlist across devices</div></div>
        <div className="account-card">
          <div className="account-card-head"><span className="account-card-mark">↗</span><span className="section-kicker">{isResetPassword ? 'ACCOUNT RECOVERY' : isSignUp ? 'GET STARTED' : 'WELCOME BACK'}</span></div>
          <h3>{isResetPassword ? 'Reset your password' : isSignUp ? 'Create your account' : 'Sign in to Stock Alerts'}</h3>
          <p className="account-hint">{isResetPassword ? 'We’ll email you a reset link.' : isSignUp ? 'Start keeping an eye on your targets.' : 'Your watchlist is right where you left it.'}</p>
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error" role="alert">{error}</div>}
            {isSignUp && !isResetPassword && <label className="landing-field"><span>Name <small>OPTIONAL</small></span><input type="text" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isLoading} /></label>}
            <label className="landing-field"><span>Email address</span><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} /></label>
            {!isResetPassword && <label className="landing-field"><span>Password</span><input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={isLoading} /></label>}
            <button type="submit" className="account-submit" disabled={isLoading}>{isLoading ? <span className="btn-spinner" /> : isResetPassword ? 'Send reset email' : isSignUp ? 'Create account' : 'Sign in'} {!isLoading && <ArrowIcon />}</button>
          </form>
          <div className="account-links">
            {!isResetPassword ? <><button type="button" onClick={() => setIsSignUp(!isSignUp)} disabled={isLoading}>{isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>{!isSignUp && <button type="button" onClick={() => { setIsResetPassword(true); setPassword(''); }} disabled={isLoading}>Forgot password?</button>}</> : <button type="button" onClick={() => { setIsResetPassword(false); setEmail(''); }} disabled={isLoading}>Back to sign in</button>}
          </div>
          <p className="account-disclaimer">Stock Alerts is a personal tracking tool. It does not provide investment advice.</p>
        </div>
      </section>

      <footer className="landing-footer"><a className="brand" href="#top"><span className="brand-mark"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 16 5-5 4 3 8-9M15 5h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span><span>stock<span className="brand-accent">alerts</span></span></a><span>Made for watching, not worrying.</span><span>© 2026 Stock Alerts</span></footer>
    </main>
  );
};
