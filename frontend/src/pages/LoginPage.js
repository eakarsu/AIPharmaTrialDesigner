import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const DEMO_EMAIL = process.env.REACT_APP_DEMO_EMAIL || '';
const DEMO_PASSWORD = process.env.REACT_APP_DEMO_PASSWORD || '';
const DEMO_LOGIN_ENABLED = process.env.REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true' && Boolean(DEMO_EMAIL && DEMO_PASSWORD);

function LoginPage({ onLogin }) {
  const loginLock = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoLoginBusy, setDemoLoginBusy] = useState(false);
  const navigate = useNavigate();

  const submitCredentials = async (loginEmail, loginPassword) => {
    if (loginLock.current) return;
    loginLock.current = true;
    setError(null);
    setLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (onLogin) onLogin(res.user, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      loginLock.current = false;
      setLoading(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    return submitCredentials(email, password);
  };

  const onDemoLogin = async () => {
    if (!DEMO_LOGIN_ENABLED || loginLock.current) return;
    loginLock.current = true;
    setDemoLoginBusy(true);
    setError(null);
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setLoading(true);
    try {
      const res = await login(DEMO_EMAIL, DEMO_PASSWORD);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (onLogin) onLogin(res.user, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      loginLock.current = false;
      setLoading(false);
      setDemoLoginBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <h1>Trial Designer</h1>
          <p>AI Pharma Studio</p>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <div className="ai-error" style={{ marginBottom: 12 }}>{error}</div>}
        {DEMO_LOGIN_ENABLED && <button type="button" className="btn" onClick={onDemoLogin} disabled={demoLoginBusy || loading} style={{ width: '100%', marginBottom: 10 }}>
          Log In as Demo
        </button>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
