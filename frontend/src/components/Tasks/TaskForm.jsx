import React, { useCallback } from 'react';
import { COMMON_STYLES, TYPOGRAPHY, SPACING, BORDER_RADIUS, PRIORITY_OPTIONS, CATEGORY_OPTIONS } from '../../styles/theme';

export function TaskForm({
    title,
    onTitleChange,
    priority,
    onPriorityChange,
    category,
    onCategoryChange,
    dueDate,
    onDueDateChange,
    onSubmit,
    onKeyPress,
    loading,
}) {
    // Use useCallback to prevent unnecessary re-renders
    const handleTitleChange = useCallback((e) => onTitleChange(e.target.value), [onTitleChange]);
    const handlePriorityChange = useCallback((e) => onPriorityChange(e.target.value), [onPriorityChange]);
    const handleCategoryChange = useCallback((e) => onCategoryChange(e.target.value), [onCategoryChange]);
    const handleDueDateChange = useCallback((e) => onDueDateChange(e.target.value), [onDueDateChange]);

    const labelStyle = {
        display: 'block',
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: 'var(--color-text-muted)',
        marginBottom: SPACING.xs,
    };

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
            style={{ marginBottom: SPACING.md }}
            aria-label="Add new task form"
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: SPACING.md,
                }}
            >
                <div>
                    <label htmlFor="task-title" style={labelStyle}>
                        Task Title
                    </label>
                    <input
                        id="task-title"
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        onKeyPress={onKeyPress}
                        placeholder="Enter a new task..."
                        style={{
                            width: '100%',
                            padding: SPACING.sm,
                            border: '2px solid var(--color-gray-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: TYPOGRAPHY.fontSize.base,
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                        }}
                        disabled={loading}
                        aria-required="true"
                        aria-describedby="task-title-hint"
                    />
                    <span id="task-title-hint" style={{ display: 'none' }}>
                        Press Enter to quickly add task
                    </span>
                </div>

                <div>
                    <label htmlFor="task-priority" style={labelStyle}>
                        Priority
                    </label>
                    <select
                        id="task-priority"
                        value={priority}
                        onChange={handlePriorityChange}
                        style={{
                            width: '100%',
                            padding: SPACING.sm,
                            border: '2px solid var(--color-gray-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: TYPOGRAPHY.fontSize.base,
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                        }}
                        disabled={loading}
                        aria-label="Select task priority"
                    >
                        {PRIORITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="task-category" style={labelStyle}>
                        Category
                    </label>
                    <select
                        id="task-category"
                        value={category}
                        onChange={handleCategoryChange}
                        style={{
                            width: '100%',
                            padding: SPACING.sm,
                            border: '2px solid var(--color-gray-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: TYPOGRAPHY.fontSize.base,
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                        }}
                        disabled={loading}
                        aria-label="Select task category"
                    >
                        {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="task-due-date" style={labelStyle}>
                        Due Date
                    </label>
                    <input
                        id="task-due-date"
                        type="date"
                        value={dueDate}
                        onChange={handleDueDateChange}
                        style={{
                            width: '100%',
                            padding: SPACING.sm,
                            border: '2px solid var(--color-gray-border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: TYPOGRAPHY.fontSize.base,
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                        }}
                        disabled={loading}
                        aria-label="Select due date"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                    width: '100%',
                    padding: `${SPACING.sm} ${SPACING.lg}`,
                    backgroundColor: loading ? 'var(--color-gray)' : 'var(--color-primary)',
                    color: loading ? 'var(--color-text-muted)' : 'var(--color-text-white)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: TYPOGRAPHY.fontSize.base,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'var(--transition-normal)',
                }}
                aria-busy={loading}
                aria-label={loading ? 'Adding task...' : 'Add task'}
            >
                {loading ? 'Adding...' : 'Add Task'}
            </button>
        </form>
    );
}
