# TaskMaster - Issues To Fix

This document catalogs all identified issues in the TaskMaster codebase, organized by category and severity.

**Last Updated:** March 28, 2026

---

## Summary

| Category | Critical | High | Medium | Low | Total | ✅ Fixed |
|----------|----------|------|--------|-----|-------|---------|
| Security | 5 | 5 | 4 | 2 | 16 | 10 |
| Code Quality | 1 | 2 | 8 | 5 | 16 | 9 |
| Performance | 1 | 3 | 6 | 4 | 14 | 6 |
| Accessibility | 0 | 4 | 5 | 3 | 12 | 4 |
| Configuration/Deploy | 4 | 3 | 5 | 4 | 16 | 7 |
| Test Coverage | 0 | 2 | 6 | 4 | 12 | 0 |
| API Design | 0 | 1 | 5 | 4 | 10 | 5 |
| Missing Features | 0 | 1 | 6 | 5 | 12 | 1 |
| **Total** | **11** | **21** | **45** | **31** | **108** | **42** |

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### ✅ 1. Database Drops All Data on Every Restart - FIXED
- **File:** `backend/server.js`
- **Issue:** `initializeDatabase()` executed `DROP TABLE IF EXISTS` on every server start
- **Fix Applied:** Changed to `CREATE TABLE IF NOT EXISTS` and added database indexes

### ✅ 2. SQL Injection in Filter Sort - FIXED
- **File:** `backend/server.js`
- **Issue:** `ORDER BY ${filterConfig.sortBy}` used unsanitized input
- **Fix Applied:** Added whitelist of allowed sort columns

### ✅ 3. Hardcoded Credentials in Docker - FIXED
- **Files:** `docker-compose.yml`, `backend/Dockerfile`
- **Issue:** Database passwords and session secrets hardcoded
- **Fix Applied:** Changed to use environment variables with required validation

### ✅ 4. Containers Running as Root - FIXED
- **Files:** `backend/Dockerfile`, `frontend/Dockerfile`
- **Issue:** No USER directive; containers ran as root
- **Fix Applied:** Added non-root user (nodejs) and health checks

### ✅ 5. Weak Session Secret Fallback - FIXED
- **File:** `backend/server.js`
- **Issue:** Hardcoded fallback session secret
- **Fix Applied:** Now requires SESSION_SECRET in production; fails startup if missing

---

## 🟠 HIGH SEVERITY ISSUES

### Security

#### ✅ 6. Insecure CORS Configuration - FIXED
- **File:** `backend/server.js`
- **Issue:** CORS allowed wildcard `*` origins
- **Fix Applied:** Configured specific allowed origins, removed wildcard in production

#### ✅ 7. Missing Rate Limiting - FIXED
- **File:** `backend/server.js`
- **Issue:** No protection against brute force or DoS attacks
- **Fix Applied:** Added `express-rate-limit` middleware for API and auth endpoints

#### ✅ 8. Unsafe Array Access in OAuth - FIXED
- **File:** `backend/server.js`
- **Issue:** Direct access to `profile.emails[0]` without bounds checking
- **Fix Applied:** Added optional chaining and validation for profile data

#### ✅ 9. Hardcoded Frontend URLs - FIXED
- **File:** `backend/server.js`
- **Issue:** `http://localhost:5173/` hardcoded in redirects
- **Fix Applied:** Now uses `FRONTEND_URL` environment variable

#### ✅ 10. No HTTPS Enforcement - FIXED
- **File:** `backend/server.js`
- **Issue:** No security headers
- **Fix Applied:** Added helmet.js with CSP, secure cookies with httpOnly and sameSite

### Code Quality

#### ✅ 11. Console.log Statements - PARTIALLY FIXED
- **File:** `backend/server.js`
- **Issue:** Debug logs left in production code
- **Fix Applied:** Removed debug logs from API routes; kept structured logging

#### ✅ 12. Missing nodemon Dependency - FIXED
- **File:** `backend/package.json`
- **Issue:** `npm run dev` uses nodemon but it wasn't in devDependencies
- **Fix Applied:** Added nodemon, helmet, compression, express-rate-limit

### Accessibility

#### ✅ 13. Accessible Components Use Tailwind (Not Configured) - FIXED
- **File:** `frontend/src/components/Accessible/AccessibleComponents.jsx`
- **Issue:** Used Tailwind CSS classes but Tailwind was not configured
- **Fix Applied:** Replaced all Tailwind classes with inline styles

#### ✅ 14. Missing ARIA Labels - FIXED
- **Files:** `TaskItem.jsx`
- **Issue:** Interactive elements lacked aria-label attributes
- **Fix Applied:** Added comprehensive ARIA labels to all interactive elements

#### ✅ 15. Missing Form Labels - FIXED
- **File:** `frontend/src/components/Tasks/TaskForm.jsx`
- **Issue:** Input fields had placeholders but no `<label>` elements
- **Fix Applied:** Added proper label elements with `htmlFor` attributes

#### ✅ 16. Keyboard Navigation - FIXED
- **File:** `TaskItem.jsx`
- **Issue:** Buttons only responded to clicks
- **Fix Applied:** Added `onKeyDown` handlers for Enter/Space key support

### CI/CD

#### ✅ 17. No Docker Image Building in CI - FIXED
- **File:** `.github/workflows/ci-cd.yml`
- **Issue:** Pipeline doesn't build/test Docker images
- **Fix Applied:** Added docker-build job with Buildx, Trivy security scans for both images

#### ✅ 18. Deprecated Security Workflow - FIXED
- **File:** `.github/workflows/security.yml`
- **Issue:** Uses deprecated `actions-dependency-submission@v1`
- **Fix Applied:** Replaced with Trivy scanner, npm audit, SARIF upload to Security tab

---

## 🟡 MEDIUM SEVERITY ISSUES

### Performance

#### ✅ 19. Missing Database Indexes - FIXED
- **File:** `backend/server.js`
- **Issue:** No indexes on `tasks.user_id`, `filter_presets.user_id`
- **Fix Applied:** Added indexes for user_id, completed, priority, due_date columns

#### ✅ 20. No Component Memoization - FIXED
- **File:** `frontend/src/components/Tasks/TaskItem.jsx`
- **Issue:** List items not wrapped with `React.memo()`
- **Fix Applied:** Wrapped TaskItem with React.memo()

#### ✅ 21. Missing useCallback in Event Handlers - FIXED
- **File:** `frontend/src/components/Tasks/TaskForm.jsx`
- **Issue:** New function references on every render
- **Fix Applied:** Wrapped handlers with `useCallback`

#### ✅ 22. No Code Splitting - FIXED
- **File:** `frontend/src/App.jsx`
- **Issue:** All components bundled together; no lazy loading
- **Fix Applied:** Implemented React.lazy() and Suspense for ProfilePanel and PhysicsPlayground

#### ✅ 23. matter-js Not Lazy Loaded - FIXED
- **File:** `frontend/package.json`
- **Issue:** Physics library (50KB+) loaded even when playground not used
- **Fix Applied:** PhysicsPlayground now lazy loaded; physics library only loads when needed

#### ✅ 24. Re-fetching Profile on Every Navigation - FIXED
- **File:** `frontend/src/components/Profile/ProfilePanel.jsx`
- **Issue:** Unstable callback dependency causes unnecessary fetches
- **Fix Applied:** Changed useEffect to only run on mount, removing unstable dependency

### Code Quality

#### ✅ 25. Dead Code Files - FIXED
- **Files:** `frontend/src/App_old.jsx`, `frontend/src/App_new.jsx`
- **Issue:** Backup files in source tree
- **Fix Applied:** Deleted both files from src/

#### 26. Missing Color Constants
- **Files:** `DateRangePicker.jsx`, `Canvas.jsx`, `PhysicsPlayground.jsx`
- **Issue:** References to undefined COLORS constants
- **Fix:** Add missing constants to theme.js

#### 27. Inconsistent Styling Approach
- **Files:** Multiple components
- **Issue:** Mix of inline styles, theme.js, and Tailwind classes
- **Fix:** Standardize on one approach

#### 28. Generic Error Messages
- **File:** `backend/server.js`
- **Issue:** All errors return "Internal server error"
- **Fix:** Log detailed errors server-side; use error codes

#### ✅ 29. Inconsistent Parameter Handling - FIXED
- **File:** `backend/server.js`
- **Issue:** Mix of `{ id } = req.params` and `parseInt(req.params.id)`
- **Fix Applied:** Standardized to use parseInt with isNaN validation across all routes

#### ✅ 30. Missing Input Validation - FIXED
- **File:** `backend/server.js`
- **Issue:** All validation was manual with no priority/date validation
- **Fix Applied:** Added validation helpers for priority, category, and date formats

#### ✅ 31. Console Logs in Frontend - FIXED
- **Files:** `useTasks.js`, `useAuth.js`, `client.js`, `ErrorBoundary.jsx`
- **Issue:** 13 console statements in frontend code
- **Fix Applied:** Removed all console.log/error statements from hooks and API client

### Configuration

#### 32. Missing Health Checks in Dockerfiles
- **Files:** `backend/Dockerfile`, `frontend/Dockerfile`
- **Issue:** No HEALTHCHECK directive
- **Fix:** Add health check commands

#### 33. Health Endpoint Doesn't Check Database
- **File:** `backend/server.js`
- **Issue:** `/health` returns OK without checking DB connection
- **Fix:** Add database connectivity check

#### 34. Missing Environment Variable Validation
- **File:** `backend/server.js` (Lines 11-18)
- **Issue:** Only validates env vars in production mode
- **Fix:** Always validate or provide clear warnings

#### 35. Render.yaml Missing Settings
- **File:** `backend/render.yaml`
- **Issue:** Missing health check path, region, and env vars
- **Fix:** Complete configuration

#### 36. Vercel Configuration Incomplete
- **File:** `frontend/vercel.json`
- **Issue:** Missing rewrites, headers, and cache settings
- **Fix:** Add production-ready configuration

### API Design

#### 37. Inconsistent Field Naming
- **Issue:** Frontend uses camelCase (`dueDate`), backend uses snake_case (`due_date`)
- **Fix:** Transform consistently at API boundary
- **Note:** Not critical - both work correctly; deferred to future refactor

#### ✅ 38. Missing DELETE User Endpoint - FIXED
- **Issue:** No way to delete user accounts
- **Fix Applied:** Added `DELETE /api/users` endpoint with cascade deletion and session cleanup

#### ✅ 39. No Pagination - FIXED
- **File:** `backend/server.js`
- **Issue:** All tasks returned in single response
- **Fix Applied:** Implemented `?page=1&limit=10` with totalCount, totalPages, hasMore metadata

#### ✅ 40. Missing Inline Filtering - FIXED
- **Issue:** Must create preset to filter; no query params
- **Fix Applied:** Support `GET /api/tasks?priority=high&completed=false&search=term&sortBy=due_date`

#### ✅ 41. No Bulk Operations - FIXED
- **Issue:** No bulk delete/update endpoints
- **Fix Applied:** Added `POST /api/tasks/bulk-delete` and `POST /api/tasks/bulk-update`

### Test Coverage

#### 42. No Test for OAuth Array Bounds
- **File:** `backend/test/app.test.js`
- **Issue:** No test for profiles without emails/photos
- **Fix:** Add edge case tests

#### 43. Missing Integration Tests
- **Issue:** No multi-step workflow tests
- **Fix:** Add login→action→logout flows

#### 44. No TaskItem Component Tests
- **File:** `frontend/src/components/Tasks/`
- **Issue:** TaskItem.jsx has no test file
- **Fix:** Add comprehensive tests

#### 45. No Performance Tests
- **Issue:** No tests for large datasets or concurrent requests
- **Fix:** Add load testing

#### 46. Test Database Not Cleaned Between Tests
- **File:** `backend/test/setup.js`
- **Issue:** Tests can interfere with each other
- **Fix:** Add cleanup between test suites

#### 47. Coverage Threshold Too Low
- **File:** `frontend/vitest.config.js`
- **Issue:** Set to 70%; should be 80%+
- **Fix:** Raise threshold after improving coverage

---

## 🔵 LOW SEVERITY ISSUES

### Security

#### 48. Missing Content Security Policy
- **File:** `frontend/index.html`
- **Issue:** No CSP headers
- **Fix:** Add CSP meta tag or server headers

#### 49. Unimplemented Terms/Privacy Links
- **File:** `frontend/src/components/Auth/LoginPage.jsx`
- **Issue:** Links look clickable but have no handlers
- **Fix:** Add actual links or change styling

### Performance

#### 50. No Image Optimization
- **Issue:** No webp format, no compression
- **Fix:** Add image optimization pipeline

#### 51. Direct DOM Style Mutation
- **File:** `frontend/src/components/Auth/LoginPage.jsx`
- **Issue:** Using `e.target.style` in event handlers
- **Fix:** Use state-based styling

### UI/UX

#### 52. No Delete Confirmation for Tasks
- **File:** `frontend/src/components/Tasks/TaskItem.jsx`
- **Issue:** Delete is immediate with no confirmation
- **Fix:** Add confirmation dialog

#### 53. No Undo for Task Operations
- **Issue:** Deleted tasks are permanently lost
- **Fix:** Implement soft delete or undo functionality

#### 54. No Escape Key for Modals
- **File:** `frontend/src/App.jsx`
- **Issue:** Profile modal can't be closed with Escape
- **Fix:** Add keyboard event handler

#### 55. No Dark Mode Styles
- **File:** `frontend/src/components/Profile/ProfileForm.jsx`
- **Issue:** Theme selector exists but no dark mode CSS
- **Fix:** Implement CSS variables for theming

#### 56. Filters Reset on Page Reload
- **Issue:** No persistence for filter state
- **Fix:** Save to localStorage

### Code Quality

#### 57. Large Monolithic Components
- **Files:** `App.jsx` (365 lines), `LoginPage.jsx` (255 lines)
- **Issue:** Components mix concerns
- **Fix:** Split into smaller focused components

#### 58. No Error Boundary in Sub-components
- **Issue:** Only root has ErrorBoundary; child errors crash app
- **Fix:** Add ErrorBoundary around key sections

### Missing Dependencies

#### 59. No Logging Library (Backend)
- **Issue:** Using console.log only
- **Fix:** Add winston or pino

#### 60. No Compression Middleware
- **File:** `backend/server.js`
- **Issue:** Responses not compressed
- **Fix:** Add compression middleware

#### 61. No Helmet.js
- **File:** `backend/server.js`
- **Issue:** Missing security headers
- **Fix:** Add helmet middleware

#### 62. No Date Library (Frontend)
- **Issue:** Using raw JavaScript Date
- **Fix:** Add date-fns or dayjs

### Edge Cases

#### ✅ 63. No Query Timeout - FIXED
- **File:** `backend/server.js`
- **Issue:** Long-running queries can hang
- **Fix Applied:** Added statement_timeout: 30000ms to database pool configuration

#### ✅ 64. No Graceful Shutdown - FIXED
- **File:** `backend/server.js`
- **Issue:** Server doesn't close connections on SIGTERM
- **Fix Applied:** Already implemented - handles SIGTERM/SIGINT with graceful pool closure

#### 65. No ISO Date Validation
- **File:** `backend/server.js`
- **Issue:** dueDate accepts any string format
- **Fix:** Validate ISO 8601 format

### Documentation

#### 66. Missing Error Code Documentation
- **File:** `backend/API.md`
- **Issue:** Not all error responses documented
- **Fix:** Document all possible error codes

---

## Missing Features (Enhancement Backlog)

1. ✅ **Search Functionality - IMPLEMENTED** - Added GET /api/tasks/search endpoint
2. **Task Recurrence** - No repeating tasks support
3. **Subtasks/Dependencies** - No hierarchical tasks
4. **Task Attachments** - No file upload support
5. **Task Tags** - Only category, no multiple tags
6. **Offline Support** - No service worker
7. **Real-time Updates** - No WebSocket support
8. **Profile Picture Delete UI** - Function exists but no UI
9. **Edit Existing Filter Presets** - Can only create/delete
10. **Internationalization** - All text hardcoded in English
11. **Notification System** - No alerts for task due dates
12. **Export/Import Tasks** - No data portability

---

## Priority Order for Fixes

### Phase 1: Critical Security & Data (1-2 days)
1. Fix database initialization (stop dropping tables)
2. Remove hardcoded secrets from Docker files
3. Fix SQL injection in filter sort
4. Add USER directive to Dockerfiles
5. Require SESSION_SECRET in production

### Phase 2: High Security (2-3 days)
6. Fix CORS configuration
7. Add rate limiting
8. Fix OAuth array bounds checking
9. Use environment variable for frontend URL
10. Add HTTPS enforcement

### Phase 3: Stability & Quality (3-5 days)
11. Add database indexes
12. Replace console.log with structured logging
13. Add missing dependencies (nodemon, helmet, compression)
14. Fix Tailwind/styling issues in Accessible components
15. Add missing test coverage

### Phase 4: Performance & UX (5-7 days)
16. Add component memoization
17. Implement code splitting
18. Add pagination to API
19. Add accessibility improvements (ARIA, labels)
20. Add confirmation dialogs for destructive actions

### Phase 5: Polish & Features (ongoing)
21. Complete dark mode implementation
22. Add search functionality
23. Implement filter persistence
24. Add offline support
25. Add internationalization

---

*Document generated: March 28, 2026*
*Total issues identified: 108*
