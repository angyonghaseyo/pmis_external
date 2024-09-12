import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signOut } from './firebaseConfig';
import { Globe, Bell, LogOut, User } from 'lucide-react';
import './Header.css';

function Header() {
    const [user, setUser] = useState(null);
    const [language, setLanguage] = useState('EN');
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
        // Here you would typically trigger a language change in your app
        // For example: i18n.changeLanguage(e.target.value);
    };

    return (
        <header className="app-header">
            <div className="logo">
                <Link to="/">🚢 Oceania PMIS</Link>
            </div>
            <nav>
                {user ? (
                    <>
                        <div className="nav-item">
                            <Globe size={20} />
                            <select
                                value={language}
                                onChange={handleLanguageChange}
                                className="language-select"
                            >
                                <option value="EN">EN</option>
                                <option value="FR">FR</option>
                                <option value="ES">ES</option>
                            </select>
                        </div>
                        <div className="nav-item">
                            <Bell size={20} />
                        </div>
                        <div className="nav-item user-menu">
                            <img
                                src={user.photoURL || "/default-avatar.png"}
                                alt="User avatar"
                                className="user-avatar"
                            />
                            <div className="user-dropdown">
                                <Link to="/profile" className="dropdown-item">
                                    <User size={16} />
                                    Profile
                                </Link>
                                <button onClick={handleLogout} className="dropdown-item">
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-button">Login</Link>
                        <div className="nav-item">
                            <Globe size={20} />
                            <select
                                value={language}
                                onChange={handleLanguageChange}
                                className="language-select"
                            >
                                <option value="EN">EN</option>
                                <option value="FR">FR</option>
                                <option value="ES">EM</option>
                            </select>
                        </div>
                    </>
                )}
            </nav>
        </header>
    );
}

export default Header;