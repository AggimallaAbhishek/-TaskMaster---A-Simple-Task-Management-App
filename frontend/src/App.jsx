import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth, useTasks, useFilter, useProfile } from './hooks';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthPanel } from './components/Auth/AuthPanel';
import { LoginPage } from './components/Auth/LoginPage';
import { TaskForm } from './components/Tasks/TaskForm';
import { TaskList } from './components/Tasks/TaskList';
import { SkipToMainContent } from './components/Accessible';
import apiClient from './api/client';
import { COLORS } from './styles/theme';

// Lazy load heavy components
const ProfilePanel = lazy(() => import('./components/Profile/ProfilePanel').then(module => ({ default: module.ProfilePanel })));
const PhysicsPlayground = lazy(() => import('./components/Playground/PhysicsPlayground').then(module => ({ default: module.PhysicsPlayground })));

const API_URL =
    import.meta.env.VITE_API_URL ||
    'https://taskmaster-a-simple-task-management-app.onrender.com';

function AppContent() {
    const { user, loading: authLoading, login, logout, error: authError } = useAuth();
    const { profile, loading: profileLoading, error: profileError, fetchProfile, updateProfile, deleteAvatar } = useProfile();
    const [tasks, setTasks] = useState([]);
    const { loading, error, setError, fetchTasks, addTask, updateTask, deleteTask } = useTasks(
        tasks,
        setTasks,
        user
    );

    // Page navigation state
    const [currentPage, setCurrentPage] = useState('tasks'); // 'tasks' or 'playground'

    // Profile panel state
    const [showProfilePanel, setShowProfilePanel] = useState(false);

    // New task form state
    const [newTask, setNewTask] = useState('');
    const [newPriority, setNewPriority] = useState('medium');
    const [newCategory, setNewCategory] = useState('general');
    const [newDueDate, setNewDueDate] = useState('');

    // Edit mode state
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editData, setEditData] = useState({
        title: '',
        priority: 'medium',
        category: 'general',
        dueDate: '',
    });

    // Filter and sort
    const {
        filter,
        setFilter,
        sortBy,
        setSortBy,
        sortDirection,
        setSortDirection,
        filteredAndSortedTasks,
        resetFilters,
    } = useFilter(tasks);

    // Fetch tasks when user logs in
    useEffect(() => {
        if (user) {
            fetchTasks();
            fetchProfile();
        }
    }, [user, fetchTasks, fetchProfile]);

    // Handle add task
    const handleAddTask = async () => {
        const task = await addTask({
            title: newTask,
            priority: newPriority,
            category: newCategory,
            dueDate: newDueDate || null,
        });

        if (task) {
            setNewTask('');
            setNewPriority('medium');
            setNewCategory('general');
            setNewDueDate('');
        }
    };

    // Handle key press for add task
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    };

    // Handle edit start
    const handleEditStart = (task) => {
        setEditingTaskId(task.id);
        setEditData({
            title: task.title,
            priority: task.priority,
            category: task.category,
            dueDate: task.due_date ? task.due_date.split('T')[0] : '',
        });
    };

    // Handle edit save
    const handleEditSave = async (taskId) => {
        await updateTask(taskId, {
            title: editData.title,
            priority: editData.priority,
            category: editData.category,
            dueDate: editData.dueDate || null,
        });
        setEditingTaskId(null);
        setEditData({
            title: '',
            priority: 'medium',
            category: 'general',
            dueDate: '',
        });
    };

    // Handle toggle complete
    const handleToggleComplete = async (taskId) => {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
            await updateTask(taskId, { completed: !task.completed });
        }
    };

    if (authLoading) {
        return (
            <div
                style={{
                    padding: '20px',
                    textAlign: 'center',
                    fontFamily: 'Arial',
                }}
            >
                <p>Loading...</p>
            </div>
        );
    }

    // Show login page when not authenticated
    if (!user) {
        return (
            <LoginPage
                onGoogleLogin={login}
                loading={authLoading}
                error={authError}
            />
        );
    }

    // Show main app when authenticated
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            <SkipToMainContent mainId="main-content" />

            <AuthPanel
                user={user}
                loading={authLoading}
                onLogin={login}
                onLogout={logout}
                onSettings={() => setShowProfilePanel(true)}
            />

            <div
                style={{
                    flex: 1,
                    padding: '20px',
                    maxWidth: '1000px',
                    margin: '0 auto',
                    width: '100%',
                }}
            >

            {/* Page Navigation Buttons */}
            {user && (
                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '20px',
                        justifyContent: 'center',
                    }}
                >
                    <button
                        onClick={() => setCurrentPage('tasks')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: currentPage === 'tasks' ? COLORS.PRIMARY : COLORS.GRAY,
                            color: COLORS.TEXT_WHITE,
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: currentPage === 'tasks' ? 'bold' : 'normal',
                            transition: 'background-color 0.2s ease',
                        }}
                    >
                        📋 Tasks
                    </button>
                    <button
                        onClick={() => setCurrentPage('playground')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: currentPage === 'playground' ? COLORS.PRIMARY : COLORS.GRAY,
                            color: COLORS.TEXT_WHITE,
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: currentPage === 'playground' ? 'bold' : 'normal',
                            transition: 'background-color 0.2s ease',
                        }}
                    >
                        🎮 Physics Playground
                    </button>
                </div>
            )}

            <main id="main-content">
                {currentPage === 'playground' ? (
                    <Suspense fallback={
                        <div style={{ padding: '40px', textAlign: 'center', color: COLORS.TEXT_MUTED }}>
                            Loading playground...
                        </div>
                    }>
                        <PhysicsPlayground />
                    </Suspense>
                ) : (
                    <>
                        <TaskForm
                            title={newTask}
                            onTitleChange={setNewTask}
                            priority={newPriority}
                            onPriorityChange={setNewPriority}
                            category={newCategory}
                            onCategoryChange={setNewCategory}
                            dueDate={newDueDate}
                            onDueDateChange={setNewDueDate}
                            onSubmit={handleAddTask}
                            onKeyPress={handleKeyPress}
                            loading={loading}
                        />

                        <TaskList
                            tasks={tasks}
                            loading={loading}
                            error={error}
                            filter={filter}
                            onFilterChange={setFilter}
                            sortBy={sortBy}
                            onSortByChange={setSortBy}
                            sortDirection={sortDirection}
                            onSortDirectionChange={setSortDirection}
                            onResetFilters={resetFilters}
                            filteredAndSortedTasks={filteredAndSortedTasks}
                            editingTaskId={editingTaskId}
                            editData={editData}
                            onEditStart={handleEditStart}
                            onEditChange={setEditData}
                            onEditSave={handleEditSave}
                            onEditCancel={() => {
                                setEditingTaskId(null);
                                setEditData({
                                    title: '',
                                    priority: 'medium',
                                    category: 'general',
                                    dueDate: '',
                                });
                            }}
                            onToggleComplete={handleToggleComplete}
                            onUpdate={updateTask}
                            onDelete={deleteTask}
                            apiUrl={API_URL}
                            onRetry={fetchTasks}
                        />
                    </>
                )}
            </main>

            {/* Profile Settings Modal */}
            {user && showProfilePanel && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowProfilePanel(false)}
                    role="presentation"
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px',
                            }}
                        >
                            <h2>Profile Settings</h2>
                            <button
                                onClick={() => setShowProfilePanel(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: '0',
                                    color: COLORS.TEXT_MUTED,
                                }}
                                aria-label="Close profile settings"
                            >
                                ×
                            </button>
                        </div>

                        <Suspense fallback={
                            <div style={{ padding: '20px', textAlign: 'center', color: COLORS.TEXT_MUTED }}>
                                Loading profile...
                            </div>
                        }>
                            <ProfilePanel
                                profile={profile}
                                loading={profileLoading}
                                error={profileError}
                                onFetch={fetchProfile}
                                onUpdate={async (updates) => {
                                    await updateProfile(updates);
                                    setShowProfilePanel(false);
                                }}
                            />
                        </Suspense>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
}
