// src/views/profile/Profile.jsx

import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../../controllers/profileController';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate         = useNavigate();

  const [name,     setName]     = useState(user?.name || '');
  const [phone,    setPhone]    = useState('');
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  // ── Fetch profile on mount ───────────────────────────────────────────────
  useEffect(() => {
    console.debug('[Profile] useEffect() → fetching profile');

    getMyProfile()
      .then((data) => {
        console.debug('[Profile] useEffect() → profile received:', data);
        setProfile(data);
        setName(data.name   || user?.name || '');
        setPhone(data.phone || '');
        // keep topbar/context in sync with the server value
        if (data.name && data.name !== user?.name) {
          updateUser({ name: data.name });
        }
      })
      .catch((err) => {
        console.error('[Profile] useEffect() → fetch error:', err.message);
        setError(err.message);
        setName(user?.name || '');
      })
      .finally(() => {
        setLoading(false);
        console.debug('[Profile] useEffect() → loading done');
      });
  }, []);

  // ── Save updated profile ─────────────────────────────────────────────────
  const handleSave = async () => {
    console.debug('[Profile] handleSave() → called with name:', name, 'phone:', phone);
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updated = await updateMyProfile({ name, phone });
      console.debug('[Profile] handleSave() → update success:', updated);
      setProfile(updated);
      setName(updated.name   || name);
      setPhone(updated.phone || phone);
      // update topbar name (context + storage)
      updateUser({ name: updated.name || name });
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('[Profile] handleSave() → update error:', err.message);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    console.debug('[Profile] handleLogout() → logging out');
    logout();
    navigate('/login');
  };

  // Resolved display values — API data takes priority over context
  const displayName  = profile?.name  || user?.name  || name;
  const displayRole  = profile?.role  || user?.role  || '';
  const displayEmail = profile?.email || user?.email || '';
  const initials     = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  // ── No UI change below ───────────────────────────────────────────────────
  return (
    <div className="card">
      <div className="profile-card">
        <div className="profile-avatar">{initials}</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {loading ? 'Loading...' : displayName}
          </div>
          <div style={{ color: '#8A8A94', fontSize: 13 }}>{displayRole}</div>
          <div style={{ color: '#8A8A94', fontSize: 13 }}>{displayEmail}</div>
        </div>
      </div>

      {error   && <div style={{ color: 'red',   fontSize: 13, marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', fontSize: 13, marginBottom: 8 }}>{success}</div>}

      <div className="form-group" style={{ maxWidth: 300 }}>
        <label>Display Name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ maxWidth: 300 }}>
        <label>Phone</label>
        <input
          className="input"
          value={phone}
          placeholder="9876543210"
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <button
        className="btn btn-primary"
        style={{ width: 'auto', marginTop: 10, marginRight: 10 }}
        onClick={handleSave}
        disabled={saving || loading}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>

      <button
        className="btn btn-danger"
        style={{ width: 'auto', marginTop: 10 }}
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}