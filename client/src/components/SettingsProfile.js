import React, { useState, useEffect } from 'react';
import { updateUserProfile } from '../services/api';

const SettingsProfile = ({ user }) => {
  const [profile, setProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    userType: '',
    teams: []
  });

  useEffect(() => {
    if (user) {
      setProfile({
        email: user.email,
        firstName: user.displayName.split(' ')[0],
        lastName: user.displayName.split(' ')[1],
        company: 'Oceania Port',
        userType: 'Normal',
        teams: ['Assets and Facilities', 'Manpower', 'Vessel Visits']
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(profile);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Profile</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">User Profile</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Email Address*</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Profile Photo</label>
              <input type="file" className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block mb-2">First Name*</label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Last Name*</label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-2">Company</label>
              <input
                type="text"
                name="company"
                value={profile.company}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">User Type</label>
              <input
                type="text"
                name="userType"
                value={profile.userType}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                readOnly
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block mb-2">Teams</label>
            <div className="flex flex-wrap gap-2">
              {profile.teams.map((team, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {team}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsProfile;