import { useState, useMemo, useEffect } from 'react';

/**
 * Custom hook for managing filtering and sorting of tasks
 * Persists filter state to localStorage
 */
export function useFilter(tasks) {
    // Load initial state from localStorage
    const getInitialFilter = () => {
        try {
            const saved = localStorage.getItem('taskmaster_filter');
            return saved ? JSON.parse(saved) : {
                search: '',
                priority: '',
                category: '',
                completed: '',
            };
        } catch {
            return {
                search: '',
                priority: '',
                category: '',
                completed: '',
            };
        }
    };

    const getInitialSort = () => {
        try {
            const saved = localStorage.getItem('taskmaster_sort');
            return saved ? JSON.parse(saved) : { sortBy: 'id', sortDirection: 'asc' };
        } catch {
            return { sortBy: 'id', sortDirection: 'asc' };
        }
    };

    const [filter, setFilter] = useState(getInitialFilter);
    const initialSort = getInitialSort();
    const [sortBy, setSortBy] = useState(initialSort.sortBy);
    const [sortDirection, setSortDirection] = useState(initialSort.sortDirection);

    // Persist filter to localStorage
    useEffect(() => {
        localStorage.setItem('taskmaster_filter', JSON.stringify(filter));
    }, [filter]);

    // Persist sort to localStorage
    useEffect(() => {
        localStorage.setItem('taskmaster_sort', JSON.stringify({ sortBy, sortDirection }));
    }, [sortBy, sortDirection]);

    const filteredAndSortedTasks = useMemo(() => {
        return tasks
            .filter((task) => {
                const matchesSearch = task.title
                    .toLowerCase()
                    .includes(filter.search.toLowerCase());
                const matchesPriority =
                    !filter.priority || task.priority === filter.priority;
                const matchesCategory =
                    !filter.category || task.category === filter.category;
                const matchesCompleted =
                    !filter.completed ||
                    task.completed.toString() === filter.completed;

                return (
                    matchesSearch &&
                    matchesPriority &&
                    matchesCategory &&
                    matchesCompleted
                );
            })
            .sort((a, b) => {
                if (sortBy === 'completed') {
                    return sortDirection === 'asc'
                        ? a.completed === b.completed
                            ? 0
                            : a.completed
                            ? 1
                            : -1
                        : a.completed === b.completed
                        ? 0
                        : a.completed
                        ? -1
                        : 1;
                }

                if (a[sortBy] < b[sortBy])
                    return sortDirection === 'asc' ? -1 : 1;
                if (a[sortBy] > b[sortBy])
                    return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
    }, [tasks, filter, sortBy, sortDirection]);

    const resetFilters = () => {
        const defaultFilter = {
            search: '',
            priority: '',
            category: '',
            completed: '',
        };
        setFilter(defaultFilter);
        setSortBy('id');
        setSortDirection('asc');
        localStorage.removeItem('taskmaster_filter');
        localStorage.removeItem('taskmaster_sort');
    };

    return {
        filter,
        setFilter,
        sortBy,
        setSortBy,
        sortDirection,
        setSortDirection,
        filteredAndSortedTasks,
        resetFilters,
    };
}
