// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      console.log("Attempting login with:", email); // debug
      const res = await login({ email, password });
      console.log("Login response:", res); // debug

      const user = res?.user || res?.data?.user;
      const role = user?.role || user?.type;

      setSuccess('Login successful');
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      console.error("Login error:", err); // debug
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 440, margin: '60px auto' }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>

        {success && <div className="alert ok">{success}</div>}
        {error && <div className="alert err">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          <button
            className="btn primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <p style={{ marginTop: 14, color: 'var(--muted)' }}>
            No account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}