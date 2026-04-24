import { useEffect, useState } from 'react';
import { changeMyPassword, getMyProfile, getMyReservations, updateMyProfile } from '../api/service';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reservations, setReservations] = useState([]);
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

    if (user?.role === 'CUSTOMER') {
      getMyReservations()
        .then((res) => setReservations(res.data || []))
        .catch(() => setErr('Failed to load reservation history'));
    }
  }, [user?.role]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPrevious = (reservation) => {
    const reservationDate = new Date(reservation.reservationDate);
    return (
      reservationDate < today
      || reservation.status === 'COMPLETED'
      || reservation.status === 'CANCELLED'
    );
  };

  const previousReservations = reservations.filter(isPrevious);
  const upcomingReservations = reservations.filter((reservation) => !isPrevious(reservation));

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const res = await updateMyProfile({ fullName });
      setProfile(res.data);
      setFullName(res.data.fullName || '');
      updateUser({ fullName: res.data.fullName });
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
        <p>Name: <strong>{profile?.fullName || user?.fullName || user?.username}</strong></p>
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

      {user?.role === 'CUSTOMER' && (
        <div className="card">
          <h3>My Reservations</h3>
          {upcomingReservations.length === 0 ? (
            <p>No upcoming reservations.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meal</th>
                    <th>Guests</th>
                    <th>Seating</th>
                    <th>Table</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>{reservation.reservationDate}</td>
                      <td>{reservation.mealType?.replaceAll('_', ' ')}</td>
                      <td>{reservation.guestCount}</td>
                      <td>{reservation.seatingPreference?.replaceAll('_', ' ')}</td>
                      <td>{reservation.assignedTable || '-'}</td>
                      <td>{reservation.status?.replaceAll('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {user?.role === 'CUSTOMER' && (
        <div className="card">
          <h3>Previous Reservations</h3>
          {previousReservations.length === 0 ? (
            <p>No previous reservations yet.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Meal</th>
                    <th>Guests</th>
                    <th>Seating</th>
                    <th>Table</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previousReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>{reservation.reservationDate}</td>
                      <td>{reservation.mealType?.replaceAll('_', ' ')}</td>
                      <td>{reservation.guestCount}</td>
                      <td>{reservation.seatingPreference?.replaceAll('_', ' ')}</td>
                      <td>{reservation.assignedTable || '-'}</td>
                      <td>{reservation.status?.replaceAll('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}
    </div>
  );
}

export default ProfilePage;
