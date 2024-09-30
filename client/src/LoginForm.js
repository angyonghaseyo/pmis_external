import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { 
    TextField, 
    Button, 
    Typography, 
    Alert, 
    CircularProgress, 
    Box, 
    Container, 
    Paper
} from '@mui/material';

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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user exists in the 'users' collection
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                throw new Error('No user profile found');
            }

            // If we reach here, the user is authenticated and has a profile in the 'users' collection
            // The App component will handle the redirection
        } catch (error) {
            console.error('Login error:', error);
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
        <Box>
            <Container maxWidth="xs">
                <Paper elevation={3} sx={{ padding: 4, width: '100%', mt: 8 }}>
                    <Typography component="h1" variant="h4" gutterBottom>
                        🚢  Oceania PMIS
                    </Typography>
                    <Typography component="h2" variant="h6" gutterBottom>
                        Sign in to your account
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Link to="/forgot-password" style={{ color: 'inherit' }}>Forgot Password?</Link>
                        </Box>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Login'}
                        </Button>
                        <Box sx={{ mt: 2 }}>
                            Don't have an account?{' '}
                            <Link to="/signup" style={{ color: 'inherit' }}>Sign up</Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default LoginForm;