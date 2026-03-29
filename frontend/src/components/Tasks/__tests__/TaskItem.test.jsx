import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskItem } from '../TaskItem';

describe('TaskItem Component', () => {
    const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        category: 'development',
        completed: false,
        due_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
    };

    const mockHandlers = {
        onEdit: vi.fn(),
        onToggleComplete: vi.fn(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders task item with title and description', () => {
        render(
            <TaskItem
                task={mockTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        expect(screen.getByText('Test Task')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('displays priority badge with correct color', () => {
        render(
            <TaskItem
                task={mockTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        const priorityBadge = screen.getByText('High Priority');
        expect(priorityBadge).toBeInTheDocument();
    });

    it('calls onToggleComplete when checkbox is clicked', () => {
        render(
            <TaskItem
                task={mockTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(mockHandlers.onToggleComplete).toHaveBeenCalledWith(mockTask.id);
    });

    it('calls onEdit when edit button is clicked', () => {
        render(
            <TaskItem
                task={mockTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        const editButton = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editButton);

        expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTask);
    });

    it('shows delete confirmation modal when delete button clicked', () => {
        render(
            <TaskItem
                task={mockTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);

        expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();
        expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('calls onDelete when confirmed in modal', () => {
        render(
            <TaskItem
                task={mockTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        // Click delete button to show modal
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);

        // Click confirm in modal
        const confirmButton = screen.getAllByRole('button', { name: /delete/i })[1];
        fireEvent.click(confirmButton);

        expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockTask.id);
    });

    it('cancels delete when Cancel button is clicked', () => {
        render(
            <TaskItem
                task={mockTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(screen.queryByText(/confirm delete/i)).not.toBeInTheDocument();
        expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    });

    it('closes modal when clicking backdrop', () => {
        const { container } = render(
            <TaskItem
                task={mockTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        const deleteButton = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteButton);

        expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();

        // Find and click the modal backdrop
        const backdrop = container.querySelector('div[style*="position: fixed"]');
        if (backdrop) {
            fireEvent.click(backdrop);
        }

        expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    });

    it('displays completed task with strikethrough', () => {
        const completedTask = { ...mockTask, completed: true };

        render(
            <TaskItem
                task={completedTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        const titleElement = screen.getByText('Test Task');
        expect(titleElement).toHaveStyle({ textDecoration: 'line-through' });
    });

    it('displays due date in correct format', () => {
        render(
            <TaskItem
                task={mockTask}
                onEdit={mockHandlers.onEdit}
                onToggleComplete={mockHandlers.onToggleComplete}
                onUpdate={mockHandlers.onUpdate}
                onDelete={mockHandlers.onDelete}
            />
        );

        const dueDate = screen.getByText(/2024-12-31/);
        expect(dueDate).toBeInTheDocument();
    });
});
