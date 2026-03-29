import React from 'react';
import { COLORS } from '../../styles/theme';

export function AuthPanel({ user, loading, onLogin, onLogout, onSettings, onToggleTheme, isDarkMode }) {
    return (
        <header
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '40px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    gap: '20px',
                    flexWrap: 'wrap',
                }}
            >
                <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>
                    TaskMaster 🚀
                </h1>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                    }}
                >
                    {loading ? (
                        <span style={{ fontSize: '14px', fontStyle: 'italic' }}>
                            Checking authentication...
                        </span>
                    ) : (
                        <>
                            {onToggleTheme && (
                                <button
                                    onClick={onToggleTheme}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.5)',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                    }}
                                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                    title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                                >
                                    {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                                </button>
                            )}
                            {user ? (
                                <>
                                    <span style={{ fontSize: '14px' }}>
                                        Welcome, <strong>{user.username}</strong>
                                    </span>
                                    {onSettings && (
                                        <button
                                            onClick={onSettings}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: 500,
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                            }}
                                            aria-label="Open profile settings"
                                        >
                                            ⚙️ Settings
                                        </button>
                                    )}
                                    <button
                                        onClick={onLogout}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.5)',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                        }}
                                    >
                                        🚪 Logout
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onLogin}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#4285F4',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        transition: 'background-color 0.2s ease',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#357AE8';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#4285F4';
                                    }}
                                >
                                    Login with Google
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
