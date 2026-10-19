import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export const LoginPage = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'Email o contrasenya incorrectes.',
        'auth/user-not-found': 'No s’ha trobat cap compte amb aquest correu.',
        'auth/wrong-password': 'La contrasenya no és correcta.',
        'auth/too-many-requests': 'Hi ha hagut massa intents. Torna-ho a provar més tard.'
      };
      setError(messages[code || ''] || 'No s’ha pogut iniciar la sessió. Torna-ho a provar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-mark" aria-hidden="true">↗</div>
        <h1>Stock Alerts</h1>
        <label htmlFor="login-email">Correu electrònic</label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          placeholder="nom@exemple.com"
          value={email}
          onChange={event => setEmail(event.target.value)}
          required
          disabled={loading}
        />
        <label htmlFor="login-password">Contrasenya</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Contrasenya"
          value={password}
          onChange={event => setPassword(event.target.value)}
          required
          disabled={loading}
        />
        {error && <p className="login-error" role="alert">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Iniciant sessió…' : 'Inicia sessió'}</button>
      </form>
    </main>
  );
};
