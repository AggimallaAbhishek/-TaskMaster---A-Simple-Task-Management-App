import React from 'react';
import { TaskItem } from './TaskItem';
import { FilterPanel } from '../Filters/FilterPanel';
import { COMMON_STYLES, TYPOGRAPHY, SPACING } from '../../styles/theme';

export function TaskList({
    tasks,
    loading,
    error,
    filter,
    onFilterChange,
    sortBy,
    onSortByChange,
    sortDirection,
    onSortDirectionChange,
    onResetFilters,
    filteredAndSortedTasks,
    editingTaskId,
    editData,
    onEditStart,
    onEditChange,
    onEditSave,
    onEditCancel,
    onToggleComplete,
    onUpdate,
    onDelete,
    apiUrl,
    onRetry,
}) {
    return (
        <div>
            <h2 style={{
                fontSize: TYPOGRAPHY.fontSize.lg,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: 'var(--color-text-dark)',
                marginBottom: SPACING.md,
            }}>
                Your Tasks ({tasks.length})
            </h2>

            {error && (
                <div
                    style={{
                        backgroundColor: 'var(--color-bg-error)',
                        color: 'var(--color-bg-error-dark)',
                        padding: SPACING.md,
                        borderRadius: 'var(--radius-md)',
                        marginBottom: SPACING.lg,
                        border: '1px solid var(--color-gray-border)',
                    }}
                >
                    <strong>Error:</strong> {error}
                    <button
                        onClick={onRetry}
                        style={{
                            marginLeft: SPACING.sm,
                            padding: `${SPACING.xs} ${SPACING.sm}`,
                            backgroundColor: 'var(--color-bg-error-dark)',
                            color: 'var(--color-text-white)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            fontSize: TYPOGRAPHY.fontSize.sm,
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading ? (
                <p style={{
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                }}>
                    Loading tasks...
                </p>
            ) : (
                <>
                    <FilterPanel
                        filter={filter}
                        onFilterChange={onFilterChange}
                        sortBy={sortBy}
                        onSortByChange={onSortByChange}
                        sortDirection={sortDirection}
                        onSortDirectionChange={onSortDirectionChange}
                        onReset={onResetFilters}
                    />

                    {filteredAndSortedTasks.length === 0 ? (
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--color-text-muted)',
                            fontSize: TYPOGRAPHY.fontSize.base,
                        }}>
                            {tasks.length === 0
                                ? 'No tasks yet. Create one to get started!'
                                : 'No tasks match your filters.'}
                        </p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {filteredAndSortedTasks.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    isEditing={editingTaskId === task.id}
                                    editData={editData}
                                    onEditStart={() => onEditStart(task)}
                                    onEditChange={onEditChange}
                                    onEditSave={() =>
                                        onEditSave(task.id)
                                    }
                                    onEditCancel={onEditCancel}
                                    onToggleComplete={() =>
                                        onToggleComplete(task.id)
                                    }
                                    onDelete={() => onDelete(task.id)}
                                />
                            ))}
                        </ul>
                    )}
                </>
            )}

            <p
                style={{
                    marginTop: SPACING.lg,
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    color: 'var(--color-text-muted)',
                }}
            >
                <strong>Backend URL:</strong> {apiUrl}
            </p>
        </div>
    );
}
