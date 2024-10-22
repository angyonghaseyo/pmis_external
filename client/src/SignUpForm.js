import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
            const formDataToSend = new FormData();
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('salutation', formData.salutation);
            formDataToSend.append('firstName', formData.firstName);
            formDataToSend.append('lastName', formData.lastName);
            formDataToSend.append('company', formData.company);
            formDataToSend.append('teams', JSON.stringify(formData.teams)); // Convert teams array to JSON string
            if (photoFile) {
                formDataToSend.append('photoFile', photoFile);
            }

            const response = await fetch('http://localhost:3003/register', {
                method: 'POST',
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error('Error during sign up');
            }

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