// Design System Variables - These will be set via CSS variables in index.css
// Semantic color mappings for consistent theming
export const SEMANTIC_COLORS = {
    // Primary colors
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primary-hover)',

    // Secondary colors
    secondary: 'var(--color-secondary)',
    secondaryHover: 'var(--color-secondary-hover)',

    // Status colors
    danger: 'var(--color-danger)',
    dangerHover: 'var(--color-danger-hover)',
    warning: 'var(--color-warning)',
    warningHover: 'var(--color-warning-hover)',
    success: 'var(--color-success)',
    successHover: 'var(--color-success-hover)',

    // Neutral colors
    gray: 'var(--color-gray)',
    grayLight: 'var(--color-gray-light)',
    grayBorder: 'var(--color-gray-border)',

    // Text colors
    textDark: 'var(--color-text-dark)',
    textMuted: 'var(--color-text-muted)',
    textLight: 'var(--color-text-light)',
    textWhite: 'var(--color-text-white)',

    // Background colors
    bgPrimary: 'var(--color-bg-primary)',
    bgSecondary: 'var(--color-bg-secondary)',
    bgError: 'var(--color-bg-error)',
    bgErrorDark: 'var(--color-bg-error-dark)',

    // Priority colors (keep for backward compatibility)
    priorityHigh: 'var(--color-priority-high)',
    priorityMedium: 'var(--color-priority-medium)',
    priorityLow: 'var(--color-priority-low)',
};

// Spacing scale (8px base)
export const SPACING = {
    xs: '4px',    // 0.5rem
    sm: '8px',    // 1rem
    md: '16px',   // 2rem
    lg: '24px',   // 3rem
    xl: '32px',   // 4rem
    xxl: '48px',  // 6rem
};

// Border radius scale
export const BORDER_RADIUS = {
    sm: '4px',    // 0.5rem
    md: '6px',    // 0.75rem
    lg: '8px',    // 1rem
    xl: '12px',   // 1.5rem
};

// Typography scale
export const TYPOGRAPHY = {
    fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    fontSize: {
        xs: '12px',   // 0.75rem
        sm: '14px',   // 0.875rem
        base: '16px', // 1rem
        lg: '18px',   // 1.125rem
        xl: '20px',   // 1.25rem
        '2xl': '24px',// 1.5rem
        '3xl': '30px',// 1.875rem
    },
    fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semiBold: 600,
        bold: 700,
        extraBold: 800,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

// Priority labels
export const PRIORITY_OPTIONS = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
];

// Category options
export const CATEGORY_OPTIONS = [
    { value: 'general', label: 'General' },
    { value: 'learning', label: 'Learning' },
    { value: 'development', label: 'Development' },
    { value: 'deployment', label: 'Deployment' },
    { value: 'personal', label: 'Personal' },
    { value: 'work', label: 'Work' },
];

// Helper function for priority color (maintained for backward compatibility)
export const getPriorityColor = (priority) => {
    switch (priority) {
        case 'high':
            return 'var(--color-priority-high)';
        case 'medium':
            return 'var(--color-priority-medium)';
        case 'low':
            return 'var(--color-priority-low)';
        default:
            return 'var(--color-primary)';
    }
};

// Common styles updated to use design system
export const COMMON_STYLES = {
    input: {
        padding: SPACING.sm,
        border: `2px solid var(--color-gray-border)`,
        borderRadius: BORDER_RADIUS.md,
        fontSize: TYPOGRAPHY.fontSize.base,
        width: '100%',
        boxSizing: 'border-box',
    },
    button: {
        border: 'none',
        borderRadius: BORDER_RADIUS.md,
        cursor: 'pointer',
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semiBold,
        transition: 'all 0.2s ease',
    },
    card: {
        padding: SPACING.md,
        margin: `${SPACING.sm} 0`,
        borderRadius: BORDER_RADIUS.lg,
        border: '1px solid var(--color-gray-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        boxShadow: 'var(--color-shadow)',
        transition: 'all 0.2s ease',
    },
    shadow: {
        sm: 'var(--color-shadow)',
        md: 'var(--color-shadow-hover)',
        lg: '0 8px 24px var(--color-shadow-hover)',
    },
};
