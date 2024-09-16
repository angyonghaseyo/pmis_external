import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
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
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        salutation: 'Mr',
        company: '',
        teams: [],
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleTeamChange = (team) => {
        setFormData(prevState => ({
            ...prevState,
            teams: prevState.teams.includes(team)
                ? prevState.teams.filter(t => t !== team)
                : [...prevState.teams, team]
        }));
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

    const validateForm = () => {
        if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName || !formData.company) {
            setError('Please fill in all required fields.');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password should be at least 6 characters long');
            return false;
        }
        if (formData.teams.length === 0) {
            setError('Please select at least one team');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
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
                displayName: `${formData.salutation} ${formData.firstName} ${formData.lastName}`,
                photoURL: photoURL
            });

            // Check if company exists and update or create accordingly
            const companyRef = doc(db, 'companies', formData.company);
            const companyDoc = await getDoc(companyRef);

            if (companyDoc.exists()) {
                // Company exists, increment user count
                await updateDoc(companyRef, {
                    userCount: increment(1)
                });
            } else {
                // Company doesn't exist, create new company document
                await setDoc(companyRef, {
                    name: formData.company,
                    userCount: 1
                });
            }

            // Store additional user info in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                salutation: formData.salutation,
                photoURL: photoURL,
                company: formData.company,
                teams: formData.teams,
                userType: 'Admin',
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
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
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
                            name="salutation"
                            value={formData.salutation}
                            onChange={handleChange}
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
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="First Name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Last Name*</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
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
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Enter your company name"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password*</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password*</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
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
                                    checked={formData.teams.includes(team)}
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