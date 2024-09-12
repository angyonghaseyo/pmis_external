import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import './AuthForms.css';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Login successful
            setLoading(false);
            navigate('/'); // Redirect to home page or dashboard
        } catch (error) {
            setLoading(false);
            switch (error.code) {
                case 'auth/user-not-found':
                    setError('No account found with this email. Please sign up.');
                    break;
                case 'auth/wrong-password':
                    setError('Incorrect password. Please try again.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address. Please check your email.');
                    break;
                case 'auth/user-disabled':
                    setError('This account has been disabled. Please contact support.');
                    break;
                default:
                    setError('Failed to log in. Please try again.');
            }
        }
    };

    return (
        <div className="auth-form">
            <h2>🚢 🚨Oceania PMIS</h2>
            <p>Sign in to your account</p>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email Address*</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address*"
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
                        placeholder="Password*"
                        required
                    />
                </div>
                <div className="forgot-password">
                    <Link to="/forgot-password">Forgot Password?</Link>
                </div>
                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p className="auth-switch">
                Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
        </div>
    );
}

export default LoginForm;