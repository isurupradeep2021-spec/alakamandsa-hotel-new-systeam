import { useEffect, useState } from 'react';
import { changeMyPassword, getMyProfile, updateMyProfile } from '../api/service';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    getMyProfile()
      .then((res) => {
        setProfile(res.data);
        setFullName(res.data.fullName || '');
      })
      .catch(() => setErr('Failed to load profile'));
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const res = await updateMyProfile({ fullName });
      setProfile(res.data);
      setMsg('Profile updated successfully');
    } catch (error) {
      setErr(error.response?.data?.message || 'Profile update failed');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await changeMyPassword(pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      setMsg('Password changed successfully');
    } catch (error) {
      setErr(error.response?.data?.message || 'Password change failed');
    }
  };

  return (
    <div className="grid">
      <div className="card">
        <h3>My Profile</h3>
        <p>Username: <strong>{profile?.username || user?.username}</strong></p>
        <p>Role: <strong>{profile?.role || user?.role}</strong></p>
        <form className="toolbar" onSubmit={saveProfile}>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <button className="btn" type="submit">Update Name</button>
        </form>
      </div>

      <div className="card">
        <h3>Change Password</h3>
        <form className="form-grid" onSubmit={savePassword}>
          <input
            type="password"
            placeholder="Current Password"
            value={pwd.currentPassword}
            onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={pwd.newPassword}
            onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            required
          />
          <button className="btn" type="submit">Update Password</button>
        </form>
      </div>

      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
    </div>
  );
}

export default ProfilePage;
