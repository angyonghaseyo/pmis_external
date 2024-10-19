import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const decodedToken = jwtDecode(token);
            setUser({ email: decodedToken.email, accessRights: decodedToken.accessRights, enrolledPrograms: decodedToken?.enrolledPrograms, company: decodedToken?.company, token });
        }
    }, []);

    const login = (token) => {
        const decodedToken = jwtDecode(token);
        localStorage.setItem('authToken', token);
        setUser({ email: decodedToken.email, accessRights: decodedToken.accessRights, token });
        navigate('/home');
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);