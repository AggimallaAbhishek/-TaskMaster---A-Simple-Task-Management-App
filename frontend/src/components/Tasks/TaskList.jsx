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
            <h2>Your Tasks ({tasks.length})</h2>

            {error && (
                <div
                    style={{
                        backgroundColor: COLORS.BG_ERROR,
                        color: COLORS.BG_ERROR_DARK,
                        padding: '15px',
                        borderRadius: '4px',
                        marginBottom: '20px',
                        border: `1px solid ${COLORS.GRAY_BORDER}`,
                    }}
                >
                    <strong>Error:</strong> {error}
                    <button
                        onClick={onRetry}
                        style={{
                            marginLeft: '10px',
                            padding: '5px 10px',
                            background: COLORS.BG_ERROR_DARK,
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading ? (
                <p>Loading tasks...</p>
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
                        <p style={{ textAlign: 'center', color: COLORS.TEXT_MUTED }}>
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
                    marginTop: '20px',
                    fontSize: '12px',
                    color: COLORS.TEXT_MUTED,
                }}
            >
                <strong>Backend URL:</strong> {apiUrl}
            </p>
        </div>
    );
}
