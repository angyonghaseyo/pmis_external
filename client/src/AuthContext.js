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
            console.log("Decoded ", decodedToken)
            setUser({
                email: decodedToken.email, accessRights: decodedToken.accessRights, enrolledPrograms: decodedToken?.enrolledPrograms, company: decodedToken?.company, photoURL: decodedToken?.photo,
                firstName: decodedToken.firstName, token
            });
        }
    }, []);

    const login = (token) => {
        const decodedToken = jwtDecode(token);
        localStorage.setItem('authToken', token);
        setUser({
            email: decodedToken.email, accessRights: decodedToken.accessRights, enrolledPrograms: decodedToken?.enrolledPrograms, company: decodedToken?.company, photoURL: decodedToken?.photo,
            firstName: decodedToken.firstName, token
        }); navigate('/home');
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        navigate('/login');
    };
    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3001/user-profile?email=${user.email}`);
            if (!response.ok) {
                throw new Error('Error fetching user profile');
            }
            const userProfile = await response.json();

            // Update the user state with additional profile data
            setUser(prevUser => ({
                ...prevUser,
                ...userProfile
            }));
            console.log("latest")
            console.log(userProfile.photoURL)

        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, fetchUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext);