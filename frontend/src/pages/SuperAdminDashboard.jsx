import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [message, setMessage] = useState(null);

  const [editId, setEditId] = useState(null);

  async function fetchAdmins() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/auth/admins');
      setAdmins(res.data?.admins || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  const canSubmit = useMemo(() => {
    if (!form.username || !form.email) return false;
    if (!editId && !form.password) return false;
    return true;
  }, [form, editId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      if (editId) {
        const payload = { username: form.username, email: form.email };
        if (form.password) payload.password = form.password;

        await api.put(`/api/auth/admins/${editId}`, payload);
        setMessage('Admin updated successfully');
      } else {
        await api.post('/api/auth/admins', form);
        setMessage('Admin created successfully');
      }

      setForm({ username: '', email: '', password: '' });
      setEditId(null);
      await fetchAdmins();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Operation failed');
    }
  };

  const onEdit = (admin) => {
    setMessage(null);
    setError(null);
    setEditId(admin.user_id);
    setForm({
      username: admin.username || '',
      email: admin.email || '',
      password: '',
    });
  };

  const onCancelEdit = () => {
    setEditId(null);
    setForm({ username: '', email: '', password: '' });
    setMessage(null);
    setError(null);
  };

  const onDelete = async (adminId) => {
    setMessage(null);
    setError(null);
    if (!window.confirm('Delete this admin?')) return;

    try {
      await api.delete(`/api/auth/admins/${adminId}`);
      setMessage('Admin deleted successfully');
      if (editId === adminId) onCancelEdit();
      await fetchAdmins();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to delete admin');
    }
  };

  return (
    <div className="container">
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Manage Admins</h2>
          <div style={{ color: 'var(--muted)' }}>{user?.email || user?.name}</div>
        </div>
        <button className="btn danger" onClick={logout}>Logout</button>
      </div>

      {message ? <div className="alert ok">{message}</div> : null}
      {error ? <div className="alert err">{error}</div> : null}

      <div style={{ height: 16 }} />

      {/* Admin create/update */}
      <div className="card">
        <h3>{editId ? 'Edit Admin' : 'Create Admin'}</h3>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="label">Username</label>
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Password {editId ? '(leave blank to keep unchanged)' : ''}</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editId ? '••••••••' : ''}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn primary" type="submit" disabled={!canSubmit}>
              {editId ? 'Save Changes' : 'Create Admin'}
            </button>
            {editId ? (
              <button className="btn" type="button" onClick={onCancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div style={{ height: 16 }} />

      {/* Existing admins */}
      <div className="card">
        <h3>Existing Admins</h3>

        {loading ? <div>Loading...</div> : null}
        {!loading && admins.length === 0 ? <div style={{ color: 'var(--muted)' }}>No admins found.</div> : null}

        <div className="row">
          {admins.map((a) => (
            <div key={a.user_id} className="card" style={{ flex: 1, minWidth: 260 }}>
              <h4 style={{ marginTop: 0 }}>@{a.username}</h4>
              <p style={{ wordBreak: 'break-word' }}>{a.email}</p>
              <p style={{ color: 'var(--muted)' }}>role: {a.role}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button className="btn" type="button" onClick={() => onEdit(a)}>
                  Edit
                </button>
                <button className="btn danger" type="button" onClick={() => onDelete(a.user_id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System settings placeholder (super-admin only) */}
      <div style={{ height: 16 }} />
      <div className="card">
        <h3>System Settings</h3>
        <div style={{ color: 'var(--muted)' }}>
          System configuration is restricted to Super Admin.
        </div>
      </div>
    </div>
  );
}

