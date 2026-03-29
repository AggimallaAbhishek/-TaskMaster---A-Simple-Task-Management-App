import React, { useState } from 'react';
import { COLORS } from '../../styles/theme';

export function LoginPage({ onGoogleLogin, loading, error, onShowTerms, onShowPrivacy }) {
    const [showLinks, setShowLinks] = useState(false);
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: 'white',
                }}
            >
                <h1 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 8px 0' }}>
                    TaskMaster 🚀
                </h1>
                <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                    Manage your tasks efficiently
                </p>
            </div>

            {/* Main Content */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px',
                }}
            >
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '48px 40px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        maxWidth: '400px',
                        width: '100%',
                    }}
                >
                    {/* Welcome Message */}
                    <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                        <h2
                            style={{
                                fontSize: '24px',
                                fontWeight: 600,
                                color: '#2c3e50',
                                margin: '0 0 12px 0',
                            }}
                        >
                            Welcome Back
                        </h2>
                        <p
                            style={{
                                fontSize: '14px',
                                color: '#666',
                                margin: 0,
                                lineHeight: 1.5,
                            }}
                        >
                            Sign in to your account to get started with managing your tasks
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div
                            style={{
                                backgroundColor: '#ffebee',
                                color: '#c62828',
                                padding: '12px 16px',
                                borderRadius: '6px',
                                marginBottom: '20px',
                                fontSize: '13px',
                                border: '1px solid #ef5350',
                            }}
                            role="alert"
                        >
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Google Login Button */}
                    <button
                        onClick={onGoogleLogin}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#4285F4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            opacity: loading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = '#357AE8';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = '#4285F4';
                            }
                        }}
                    >
                        {loading ? (
                            <>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        animation: 'spin 1s linear infinite',
                                    }}
                                >
                                    ⏳
                                </span>
                                Signing in...
                            </>
                        ) : (
                            <>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign in with Google
                            </>
                        )}
                    </button>

                    {/* Divider */}
                    <div
                        style={{
                            margin: '24px 0',
                            position: 'relative',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: 0,
                                right: 0,
                                height: '1px',
                                backgroundColor: '#ddd',
                            }}
                        />
                        <span
                            style={{
                                position: 'relative',
                                backgroundColor: 'white',
                                padding: '0 12px',
                                color: '#999',
                                fontSize: '13px',
                                fontWeight: 500,
                            }}
                        >
                            or continue as
                        </span>
                    </div>

                    {/* Demo Login Button */}
                    <button
                        onClick={() => onGoogleLogin(true)} // Pass true for demo mode
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: '#f5f5f5',
                            color: '#333',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: loading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = '#efefef';
                                e.target.style.borderColor = '#bbb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = '#f5f5f5';
                                e.target.style.borderColor = '#ddd';
                            }
                        }}
                    >
                        Demo Account
                    </button>

                    {/* Footer */}
                    <p
                        style={{
                            fontSize: '12px',
                            color: '#999',
                            textAlign: 'center',
                            marginTop: '24px',
                            lineHeight: 1.5,
                        }}
                    >
                        By signing in, you agree to our{' '}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onShowTerms?.();
                            }}
                            style={{
                                color: '#667eea',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: 'inherit',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.color = '#5568d3';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = '#667eea';
                            }}
                        >
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onShowPrivacy?.();
                            }}
                            style={{
                                color: '#667eea',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: 'inherit',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.color = '#5568d3';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = '#667eea';
                            }}
                        >
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>

            {/* Background Pattern */}
            <style>{`
                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
