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
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
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
    <div className="settings-profile">
      <h2 className="page-title">Profile</h2>
      <div className="profile-form">
        <h3>User Profile</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="profilePhoto">Profile Photo</label>
            <input type="file" id="profilePhoto" name="profilePhoto" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name*</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name*</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              name="company"
              value={profile.company}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="userType">User Type</label>
            <input
              type="text"
              id="userType"
              name="userType"
              value={profile.userType}
              readOnly
            />
          </div>
          <div className="form-group">
            <label>Teams</label>
            <div className="teams-list">
              {profile.teams.map((team, index) => (
                <span key={index} className="team-tag">{team}</span>
              ))}
            </div>
          </div>
          <button type="submit" className="submit-button">Save changes</button>
        </form>
      </div>
    </div>
  );
};

export default SettingsProfile;