import React from 'react';
import { COMMON_STYLES, TYPOGRAPHY, SPACING } from '../../styles/theme';

export function AuthPanel({ user, loading, onLogin, onLogout, onSettings, onToggleTheme, isDarkMode }) {
    return (
        <header
            style={{
                background: 'linear-gradient(135deg, var(--color-header-start) 0%, var(--color-header-end) 100%)',
                color: 'var(--color-text-white)',
                padding: `${SPACING.lg} ${SPACING.xl}`,
                boxShadow: 'var(--color-shadow)',
                marginBottom: `${SPACING.xl}`,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    gap: `${SPACING.md}`,
                    flexWrap: 'wrap',
                    padding: `0 ${SPACING.md}`,
                }}
            >
                <h1 style={{
                    fontFamily: TYPOGRAPHY.fontFamily,
                    fontSize: TYPOGRAPHY.fontSize['3xl'],
                    fontWeight: TYPOGRAPHY.fontWeight.bold,
                    margin: 0,
                    background: 'linear-gradient(to right, var(--color-text-white), var(--color-text-light))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    TaskMaster 🚀
                </h1>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: `${SPACING.sm}`,
                        flexWrap: 'wrap',
                    }}
                >
                    {loading ? (
                        <span style={{
                            fontSize: TYPOGRAPHY.fontSize.sm,
                            fontStyle: 'italic',
                            color: 'var(--color-text-muted)',
                        }}>
                            Checking authentication...
                        </span>
                    ) : (
                        <>
                            {onToggleTheme && (
                                <button
                                    onClick={onToggleTheme}
                                    style={{
                                        padding: `${SPACING.sm} ${SPACING.md}`,
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        fontSize: TYPOGRAPHY.fontSize.base,
                                        fontWeight: TYPOGRAPHY.fontWeight.medium,
                                        transition: 'var(--transition-normal)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: `${SPACING.xs}`,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'var(--color-input-focus)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'var(--color-bg-secondary)';
                                    }}
                                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                                    title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                                >
                                    {isDarkMode ? '☀️' : '🌙'}
                                    <span>{isDarkMode ? 'Light' : 'Dark'}</span>
                                </button>
                            )}
                            {user ? (
                                <>
                                    <span style={{
                                        fontSize: TYPOGRAPHY.fontSize.base,
                                        color: 'var(--color-text-primary)',
                                    }}>
                                        Welcome, <strong>{user.username}</strong>
                                    </span>
                                    {onSettings && (
                                        <button
                                            onClick={onSettings}
                                            style={{
                                                padding: `${SPACING.sm} ${SPACING.md}`,
                                                backgroundColor: 'var(--color-bg-secondary)',
                                                color: 'var(--color-text-primary)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer',
                                                fontSize: TYPOGRAPHY.fontSize.base,
                                                fontWeight: TYPOGRAPHY.fontWeight.medium,
                                                transition: 'var(--transition-normal)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: `${SPACING.xs}`,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = 'var(--color-input-focus)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'var(--color-bg-secondary)';
                                            }}
                                            aria-label="Open profile settings"
                                        >
                                            ⚙️
                                            <span>Settings</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={onLogout}
                                        style={{
                                            padding: `${SPACING.sm} ${SPACING.md}`,
                                            backgroundColor: 'var(--color-danger)',
                                            color: 'var(--color-text-white)',
                                            border: 'none',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            fontSize: TYPOGRAPHY.fontSize.base,
                                            fontWeight: TYPOGRAPHY.fontWeight.medium,
                                            transition: 'var(--transition-normal)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: `${SPACING.xs}`,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = 'var(--color-danger-hover)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'var(--color-danger)';
                                        }}
                                    >
                                        🚪
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onLogin}
                                    style={{
                                        padding: `${SPACING.sm} ${SPACING.lg}`,
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'var(--color-text-white)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        fontSize: TYPOGRAPHY.fontSize.base,
                                        fontWeight: TYPOGRAPHY.fontWeight.semibold,
                                        transition: 'var(--transition-normal)',
                                        boxShadow: 'var(--color-shadow)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: `${SPACING.xs}`,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = 'var(--color-primary-hover)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'var(--color-primary)';
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
