import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            localStorage.setItem('token', response.data.token);
            navigate('/');
        } catch (error) {
            console.error('Login error:', error.response ? error.response.data : error.message);
            setError(error.response ? error.response.data.error : 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs">
            <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
                <Typography component="h1" variant="h4" align="center" gutterBottom>
                    🚢 Oceania PMIS
                </Typography>
                <Typography component="h2" variant="h6" align="center" gutterBottom>
                    Sign in to your account
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} noValidate>
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
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: 'inherit' }}>Sign up</Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default LoginForm;