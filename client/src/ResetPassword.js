import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, confirmPasswordReset, verifyPasswordResetCode } from './firebaseConfig';
import './AuthForms.css';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetSuccessful, setResetSuccessful] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const oobCode = new URLSearchParams(location.search).get('oobCode');
        if (oobCode) {
            verifyPasswordResetCode(auth, oobCode)
                .then((email) => setEmail(email))
                .catch((error) => {
                    console.error('Error verifying reset code:', error);
                    setError('Invalid or expired reset link. Please try again.');
                });
        } else {
            setError('No reset code found. Please try resetting your password again.');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        const oobCode = new URLSearchParams(location.search).get('oobCode');

        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setResetSuccessful(true);
        } catch (error) {
            console.error('Error resetting password:', error);
            setError('Failed to reset password. Please try again.');
        }
    };

    if (resetSuccessful) {
        return (
            <div className="auth-form">
                <h2>🚢 Oceania PMIS</h2>
                <p>Reset Password</p>
                <p>Reset Password successful!</p>
                <button onClick={() => navigate('/login')} className="auth-button">
                    Proceed to Login
                </button>
            </div>
        );
    }

    return (
        <div className="auth-form">
            <h2>🚢 Oceania PMIS</h2>
            <p>Reset Password</p>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        readOnly
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password*</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password*"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password*</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password*"
                        required
                    />
                </div>
                <button type="submit" className="auth-button">Reset Password</button>
            </form>
        </div>
    );
};

export default ResetPassword;