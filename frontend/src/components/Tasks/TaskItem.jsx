import React, { useState } from 'react';
import { COMMON_STYLES, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/theme';

function TaskItemComponent({
    task,
    isEditing,
    editData,
    onEditStart,
    onEditChange,
    onEditSave,
    onEditCancel,
    onToggleComplete,
    onDelete,
}) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Handle keyboard events for edit and delete buttons
    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        onDelete();
        setShowDeleteConfirm(false);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    if (isEditing) {
        return (
            <li
                style={{
                    ...COMMON_STYLES.card,
                    backgroundColor: '#fff9e6',
                    border: `2px solid ${COLORS.WARNING}`,
                }}
                role="listitem"
                aria-label={`Editing task: ${task.title}`}
            >
                <div style={{ display: 'grid', gap: '10px' }}>
                    <label htmlFor={`edit-title-${task.id}`} style={{ display: 'none' }}>
                        Task title
                    </label>
                    <input
                        id={`edit-title-${task.id}`}
                        type="text"
                        value={editData.title}
                        onChange={(e) =>
                            onEditChange({
                                ...editData,
                                title: e.target.value,
                            })
                        }
                        style={{
                            ...COMMON_STYLES.input,
                        }}
                        aria-label="Edit task title"
                    />

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '10px',
                        }}
                    >
                        <label htmlFor={`edit-priority-${task.id}`} style={{ display: 'none' }}>
                            Priority
                        </label>
                        <select
                            id={`edit-priority-${task.id}`}
                            value={editData.priority}
                            onChange={(e) =>
                                onEditChange({
                                    ...editData,
                                    priority: e.target.value,
                                })
                            }
                            style={COMMON_STYLES.input}
                            aria-label="Edit task priority"
                        >
                            {PRIORITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        <label htmlFor={`edit-category-${task.id}`} style={{ display: 'none' }}>
                            Category
                        </label>
                        <select
                            id={`edit-category-${task.id}`}
                            value={editData.category}
                            onChange={(e) =>
                                onEditChange({
                                    ...editData,
                                    category: e.target.value,
                                })
                            }
                            style={COMMON_STYLES.input}
                            aria-label="Edit task category"
                        >
                            {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        <label htmlFor={`edit-date-${task.id}`} style={{ display: 'none' }}>
                            Due date
                        </label>
                        <input
                            id={`edit-date-${task.id}`}
                            type="date"
                            value={editData.dueDate}
                            onChange={(e) =>
                                onEditChange({
                                    ...editData,
                                    dueDate: e.target.value,
                                })
                            }
                            style={COMMON_STYLES.input}
                            aria-label="Edit due date"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onEditSave}
                            onKeyDown={(e) => handleKeyDown(e, onEditSave)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: COLORS.SUCCESS,
                                color: COLORS.TEXT_WHITE,
                                ...COMMON_STYLES.button,
                            }}
                            aria-label="Save task changes"
                        >
                            Save
                        </button>
                        <button
                            onClick={onEditCancel}
                            onKeyDown={(e) => handleKeyDown(e, onEditCancel)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: COLORS.GRAY,
                                color: COLORS.TEXT_WHITE,
                                ...COMMON_STYLES.button,
                            }}
                            aria-label="Cancel editing"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </li>
        );
    }

    const priorityColor = getPriorityColor(task.priority);

    return (
        <li
            style={{
                ...COMMON_STYLES.card,
                backgroundColor: task.completed ? '#e8f5e9' : '#fff',
                opacity: task.completed ? 0.7 : 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.2s',
            }}
            onDoubleClick={onEditStart}
            role="listitem"
            aria-label={`Task: ${task.title}, Priority: ${task.priority}, ${task.completed ? 'Completed' : 'Not completed'}`}
        >
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={onToggleComplete}
                        style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                        }}
                        aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                    />
                    <strong
                        style={{
                            textDecoration: task.completed
                                ? 'line-through'
                                : 'none',
                            color: task.completed ? COLORS.TEXT_MUTED : COLORS.TEXT_DARK,
                        }}
                    >
                        {task.title}
                    </strong>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                        fontSize: '12px',
                        color: COLORS.TEXT_MUTED,
                    }}
                >
                    <span
                        style={{
                            backgroundColor: priorityColor,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '3px',
                        }}
                        aria-label={`Priority: ${task.priority}`}
                    >
                        {task.priority}
                    </span>
                    <span aria-label={`Category: ${task.category}`}>{task.category}</span>
                    {task.due_date && (
                        <span aria-label={`Due date: ${new Date(task.due_date).toLocaleDateString()}`}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                    )}
                    <span aria-label={`Task ID: ${task.id}`}>#{task.id}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
                <button
                    onClick={onEditStart}
                    onKeyDown={(e) => handleKeyDown(e, onEditStart)}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: COLORS.PRIMARY,
                        color: COLORS.TEXT_WHITE,
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}
                    aria-label={`Edit task: ${task.title}`}
                    title={`Edit task: ${task.title}`}
                >
                    Edit
                </button>
                <button
                    onClick={handleDeleteClick}
                    onKeyDown={(e) => handleKeyDown(e, handleDeleteClick)}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: COLORS.DANGER,
                        color: COLORS.TEXT_WHITE,
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}
                    aria-label={`Delete task: ${task.title}`}
                    title={`Delete task: ${task.title}`}
                >
                    Delete
                </button>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteConfirm && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={cancelDelete}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-confirm-title"
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            maxWidth: '400px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 id="delete-confirm-title" style={{ marginTop: 0, color: COLORS.TEXT }}>
                            Delete Task?
                        </h3>
                        <p style={{ color: COLORS.TEXT_MUTED }}>
                            Are you sure you want to delete "{task.title}"? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                onClick={cancelDelete}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: COLORS.BG_SECONDARY,
                                    color: COLORS.TEXT,
                                    border: `1px solid ${COLORS.BORDER}`,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                                autoFocus
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: COLORS.DANGER,
                                    color: COLORS.TEXT_WHITE,
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </li>
    );
}

// Memoize component to prevent unnecessary re-renders
export const TaskItem = React.memo(TaskItemComponent);
