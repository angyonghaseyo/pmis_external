import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { auth, storage, db } from './firebaseConfig';
import './AuthForms.css';

const teams = [
  'Assets and Facilities',
  'Manpower',
  'Vessel Visits',
  'Port Operations and Resources',
  'Cargos',
  'Financial',
  'Customs and Trade Documents'
];

function SignUpForm() {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [salutation, setSalutation] = useState('Mr');
    const [company, setCompany] = useState('');
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validateForm = () => {
        if (!email || !firstName || !lastName || !password || !confirmPassword || !company) {
            setError('Please fill in all required fields.');
            return false;
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return false;
        }
        if (password.length < 6) {
            setError('Password should be at least 6 characters long');
            return false;
        }
        if (selectedTeams.length === 0) {
            setError('Please select at least one team');
            return false;
        }
        return true;
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError("File size should not exceed 5MB");
                return;
            }
            setPhotoFile(file);
        }
    };

    const handleTeamChange = (team) => {
        setSelectedTeams(prevTeams => 
            prevTeams.includes(team)
                ? prevTeams.filter(t => t !== team)
                : [...prevTeams, team]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Upload photo if provided
            let photoURL = '';
            if (photoFile) {
                const storageRef = ref(storage, `profile_photos/${user.uid}`);
                await uploadBytes(storageRef, photoFile);
                photoURL = await getDownloadURL(storageRef);
            }

            // Update user profile
            await updateProfile(user, {
                displayName: `${salutation} ${firstName} ${lastName}`,
                photoURL: photoURL
            });

            // Store additional user info in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                firstName: firstName,
                lastName: lastName,
                salutation: salutation,
                photoURL: photoURL,
                company: company,
                teams: selectedTeams,
                userType: 'admin',
                createdAt: new Date()
            });

            // Navigate to home page or dashboard
            navigate('/');
        } catch (error) {
            console.error("Error during sign up:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form">
            <h2>🚢 Oceania PMIS</h2>
            <p>Set up your account</p>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email Address*</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="bob@oceaniaport.com"
                        required
                    />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="profilePhoto">Profile Photo</label>
                        <input
                            type="file"
                            id="profilePhoto"
                            onChange={handlePhotoChange}
                            accept="image/*"
                        />
                        <small>Recommended size: 210 x 50 px. Max size: 5MB</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="salutation">Salutation</label>
                        <select
                            id="salutation"
                            value={salutation}
                            onChange={(e) => setSalutation(e.target.value)}
                            required
                        >
                            <option value="Mr">Mr</option>
                            <option value="Mrs">Mrs</option>
                            <option value="Ms">Ms</option>
                            <option value="Dr">Dr</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="firstName">First Name*</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First Name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Last Name*</label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last Name"
                            required
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="company">Company*</label>
                    <input
                        type="text"
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Enter your company name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password*</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password*</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Teams*</label>
                    <div className="teams-container">
                        {teams.map((team) => (
                            <div key={team} className="team-checkbox">
                                <input
                                    type="checkbox"
                                    id={team}
                                    checked={selectedTeams.includes(team)}
                                    onChange={() => handleTeamChange(team)}
                                />
                                <label htmlFor={team}>{team}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>
            <p className="auth-switch">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </div>
    );
}

export default SignUpForm;