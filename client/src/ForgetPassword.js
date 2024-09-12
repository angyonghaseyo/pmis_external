import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, sendPasswordResetEmail } from './firebaseConfig';
import './AuthForms.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error sending reset email:', error);
            switch (error.code) {
                case 'auth/user-not-found':
                    setError('No user found with this email address.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address. Please check and try again.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many requests. Please try again later.');
                    break;
                default:
                    setError('Failed to send reset email. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleTryAgain = () => {
        setIsSubmitted(false);
        setEmail('');
    };

    if (isSubmitted) {
        return (
            <div className="auth-form">
                <h2>🚢 Oceania PMIS</h2>
                <p>Forgot Password?</p>
                <p>Reset password instructions have been sent to your inbox!</p>
                <p>Please check your email and follow the instructions to reset your password.</p>
                <button className="auth-button" onClick={handleTryAgain}>Send Again</button>
                <p>
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        );
    }

    return (
        <div className="auth-form">
            <h2>🚢 Oceania PMIS</h2>
            <p>Forgot Password?</p>
            <p>Enter your email address and we will send you instructions to reset your password.</p>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email Address*</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                    />
                </div>
                <button type="submit" className="auth-button" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
            <p>
                Remember your password? <Link to="/login">Back to Login</Link>
            </p>
        </div>
    );
}

export default ForgotPassword;