# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a single-page web application that provides an integrated productivity interface combining time awareness, task management, focus timing, and quick website access. The application is built entirely with vanilla HTML, CSS, and JavaScript, requiring no build tools, frameworks, or backend services.

### Architecture Philosophy

The design follows a component-based architecture where each major feature (Greeting, Focus Timer, Task List, Quick Links) is implemented as a self-contained module with clear responsibilities. All components share a common data persistence layer that abstracts Local Storage operations.

### Key Design Decisions

1. **No Framework Approach**: Using vanilla JavaScript ensures zero dependencies, fast load times, and maximum browser compatibility
2. **Local Storage as Single Source of Truth**: All application state persists to Local Storage immediately on change, eliminating the need for explicit save actions
3. **Component Isolation**: Each component manages its own DOM elements and state, communicating through a shared storage interface
4. **Immediate UI Updates**: All user actions result in immediate DOM updates followed by asynchronous persistence

## Architecture

### System Structure

```
┌─────────────────────────────────────────────────────────┐
│                    index.html                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │           Dashboard Container (DOM)               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │ │
│  │  │ Greeting │ │  Focus   │ │   Task List      │ │ │
│  │  │Component │ │  Timer   │ │   Component      │ │ │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────┐│ │
│  │  │      Quick Links Component                   ││ │
│  │  └──────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   app.js (main)                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  GreetingModule    │  TimerModule                 │ │
│  │  TaskModule        │  QuickLinksModule            │ │
│  └───────────────────────────────────────────────────┘ │
│                          │                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │           StorageManager                          │ │
│  │  - getTasks()      - saveTasks()                  │ │
│  │  - getLinks()      - saveLinks()                  │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Browser Local Storage API                  │
│  Keys: "tasks", "quickLinks"                            │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**GreetingModule**
- Displays current time in 12-hour format with AM/PM
- Displays current date with day of week
- Updates time display every second
- Determines and displays time-based greeting (morning/afternoon/evening/night)

**TimerModule**
- Manages 25-minute countdown timer state
- Updates timer display every second when running
- Handles start, stop, and reset controls
- Disables start button when timer is active

**TaskModule**
- Renders task list from storage
- Handles task creation with validation
- Manages task editing (inline edit mode)
- Toggles task completion status
- Deletes tasks
- Persists all changes to Local Storage

**QuickLinksModule**
- Renders quick link buttons from storage
- Handles link creation with validation
- Opens URLs in new tabs
- Deletes links
- Persists all changes to Local Storage

**StorageManager**
- Provides abstraction over Local Storage API
- Handles JSON serialization/deserialization
- Validates data on retrieval
- Clears invalid data automatically
- Uses consistent key naming ("tasks", "quickLinks")

## Components and Interfaces

### StorageManager Interface

```javascript
const StorageManager = {
  // Task operations
  getTasks(): Task[]
  saveTasks(tasks: Task[]): void
  
  // Quick link operations
  getLinks(): QuickLink[]
  saveLinks(links: QuickLink[]): void
  
  // Internal helpers
  _getItem(key: string): any | null
  _setItem(key: string, value: any): void
  _validateTasks(data: any): boolean
  _validateLinks(data: any): boolean
}
```

### GreetingModule Interface

```javascript
const GreetingModule = {
  init(): void
  updateTime(): void
  getGreeting(hour: number): string
  formatTime(date: Date): string
  formatDate(date: Date): string
}
```

### TimerModule Interface

```javascript
const TimerModule = {
  init(): void
  start(): void
  stop(): void
  reset(): void
  tick(): void
  updateDisplay(): void
  
  // State
  duration: number        // milliseconds remaining
  isRunning: boolean
  intervalId: number | null
}
```

### TaskModule Interface

```javascript
const TaskModule = {
  init(): void
  loadTasks(): void
  renderTasks(): void
  addTask(text: string): void
  editTask(id: string): void
  saveEdit(id: string, newText: string): void
  cancelEdit(id: string): void
  toggleComplete(id: string): void
  deleteTask(id: string): void
  
  // State
  tasks: Task[]
  editingTaskId: string | null
}
```

### QuickLinksModule Interface

```javascript
const QuickLinksModule = {
  init(): void
  loadLinks(): void
  renderLinks(): void
  addLink(name: string, url: string): void
  openLink(url: string): void
  deleteLink(id: string): void
  
  // State
  links: QuickLink[]
}
```

### Event Handling

Each module attaches event listeners during initialization:

- **GreetingModule**: Sets up `setInterval` for time updates (1000ms)
- **TimerModule**: Attaches click handlers to start/stop/reset buttons
- **TaskModule**: Uses event delegation on task list container for edit/delete/toggle actions; attaches submit handler to add task form
- **QuickLinksModule**: Uses event delegation on links container for delete actions; attaches submit handler to add link form; attaches click handlers to link buttons

### Initialization Flow

1. DOM Content Loaded event fires
2. StorageManager initializes (no setup needed)
3. GreetingModule.init() - starts time update interval
4. TimerModule.init() - sets initial display to 25:00
5. TaskModule.init() - loads tasks from storage, renders, attaches event listeners
6. QuickLinksModule.init() - loads links from storage, renders, attaches event listeners

## Data Models

### Task Model

```javascript
{
  id: string,          // UUID v4 or timestamp-based unique identifier
  text: string,        // Task description (non-empty, trimmed)
  completed: boolean,  // Completion status
  createdAt: number    // Unix timestamp (milliseconds)
}
```

**Validation Rules:**
- `id`: Must be unique string
- `text`: Must be non-empty after trimming whitespace
- `completed`: Must be boolean
- `createdAt`: Must be positive number

### QuickLink Model

```javascript
{
  id: string,     // UUID v4 or timestamp-based unique identifier
  name: string,   // Display name for the link (non-empty, trimmed)
  url: string     // Valid URL (non-empty, trimmed)
}
```

**Validation Rules:**
- `id`: Must be unique string
- `name`: Must be non-empty after trimming whitespace
- `url`: Must be non-empty after trimming whitespace (browser will handle URL validation on click)

### Local Storage Schema

**Key: "tasks"**
```json
[
  {
    "id": "1234567890",
    "text": "Complete project documentation",
    "completed": false,
    "createdAt": 1704067200000
  }
]
```

**Key: "quickLinks"**
```json
[
  {
    "id": "0987654321",
    "name": "GitHub",
    "url": "https://github.com"
  }
]
```

### Invalid Data Handling

When loading from Local Storage:
1. Attempt to parse JSON
2. If parse fails → return empty array, clear storage key
3. If parse succeeds but data is not an array → return empty array, clear storage key
4. If array contains invalid items → filter out invalid items, save cleaned array
5. Valid items must have all required fields with correct types


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Applicability of Property-Based Testing

This application is primarily a UI-driven system with significant DOM manipulation, Local Storage side effects, and event handling. Most functionality is best tested with example-based unit tests and integration tests. However, several pure functions exist that benefit from property-based testing:

- **Formatting functions**: Time and date formatting, timer display formatting
- **Validation functions**: Input validation for tasks and links, data structure validation
- **State transformation logic**: Task completion toggling

The properties below focus on these pure functions. UI interactions, DOM manipulation, and Local Storage operations will be tested with example-based unit tests.

### Property 1: Time Format Validity

*For any* valid Date object, the formatted time string SHALL match the 12-hour format pattern "HH:MM AM" or "HH:MM PM" where HH is 01-12 and MM is 00-59.

**Validates: Requirements 1.1**

### Property 2: Date Format Completeness

*For any* valid Date object, the formatted date string SHALL contain the day of week name, month name, and day number.

**Validates: Requirements 1.2**

### Property 3: Greeting Matches Time of Day

*For any* hour value (0-23), the greeting function SHALL return:
- "Good morning" for hours 5-11
- "Good afternoon" for hours 12-16
- "Good evening" for hours 17-20
- "Good night" for hours 21-23 and 0-4

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 4: Timer Display Format Validity

*For any* non-negative duration in milliseconds, the formatted timer string SHALL match the pattern "MM:SS" where MM is 00-99 and SS is 00-59.

**Validates: Requirements 3.4**

### Property 5: Whitespace Task Rejection

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), the task validation SHALL reject the input as invalid.

**Validates: Requirements 5.3**

### Property 6: Task Completion Toggle Idempotence

*For any* task, toggling completion status twice SHALL return the task to its original completion state (toggle is its own inverse).

**Validates: Requirements 7.1, 7.3**

### Property 7: Invalid Task Data Rejection

*For any* data structure that is not an array, or is an array containing objects missing required fields (id, text, completed, createdAt) or with incorrect types, the task validation function SHALL return false.

**Validates: Requirements 9.3**

### Property 8: Whitespace Link Rejection

*For any* name or URL string composed entirely of whitespace characters, the link validation SHALL reject the input as invalid.

**Validates: Requirements 10.3**

### Property 9: Invalid Link Data Rejection

*For any* data structure that is not an array, or is an array containing objects missing required fields (id, name, url) or with incorrect types, the link validation function SHALL return false.

**Validates: Requirements 11.3**


## Error Handling

### Local Storage Errors

**Scenario**: Local Storage is unavailable (disabled, quota exceeded, private browsing mode)

**Handling**:
- Wrap all `localStorage.setItem()` calls in try-catch blocks
- Log errors to console for debugging
- Continue operation in memory-only mode
- Display no error message to user (graceful degradation)

**Implementation**:
```javascript
try {
  localStorage.setItem(key, value);
} catch (e) {
  console.error('Local Storage unavailable:', e);
  // Continue with in-memory state
}
```

### Invalid Data Recovery

**Scenario**: Local Storage contains corrupted or invalid data

**Handling**:
1. Attempt to parse JSON
2. If parse fails → return empty array, clear the storage key
3. If data is not an array → return empty array, clear the storage key
4. If array contains invalid items → filter out invalid items, save cleaned array back to storage
5. Log validation failures to console

**Validation Criteria**:
- Tasks: Must have `id` (string), `text` (non-empty string), `completed` (boolean), `createdAt` (number)
- Links: Must have `id` (string), `name` (non-empty string), `url` (non-empty string)

### Input Validation

**Empty Input Handling**:
- Trim all user input before validation
- Reject empty or whitespace-only strings silently (no error message)
- Do not add invalid items to state or storage
- Clear input fields after rejection

**No Error Messages**: Per requirements, the application does not display error messages for invalid input. Invalid submissions are simply ignored.

### Timer Edge Cases

**Timer at Zero**:
- When duration reaches 0, automatically stop the timer
- Clear the interval to prevent negative values
- Keep display at "00:00"

**Multiple Start Clicks**:
- Disable start button when timer is running
- Prevent multiple intervals from being created

### DOM Element Safety

**Missing Elements**:
- All DOM queries should check for null before manipulation
- Use optional chaining or null checks: `element?.classList.add()`
- Log warnings if expected elements are missing

### Browser Compatibility

**Unsupported Features**:
- Application requires Local Storage API (available in all modern browsers)
- No fallback for browsers without Local Storage
- No polyfills needed for vanilla JavaScript features used

## Testing Strategy

### Overview

The testing approach combines **example-based unit tests** for specific scenarios and UI interactions with **property-based tests** for pure functions that benefit from comprehensive input coverage.

### Unit Testing

**Framework**: Jest (or similar JavaScript testing framework)

**Coverage Areas**:

1. **Component Initialization**
   - Verify each module initializes correctly
   - Verify event listeners are attached
   - Verify initial state is correct

2. **UI Interactions**
   - Button clicks trigger correct state changes
   - Form submissions create/update data
   - Edit mode toggles correctly
   - Delete actions remove items

3. **DOM Manipulation**
   - Verify correct elements are created/updated/removed
   - Verify CSS classes are applied correctly
   - Verify button disabled states

4. **Local Storage Integration**
   - Mock Local Storage API
   - Verify save operations call `setItem` with correct data
   - Verify load operations call `getItem` and parse results
   - Verify error handling when Local Storage fails

5. **Timer Mechanics**
   - Use fake timers (Jest's `jest.useFakeTimers()`)
   - Verify interval is created on start
   - Verify interval is cleared on stop/reset
   - Verify duration decrements correctly

6. **Edge Cases**
   - Empty input rejection
   - Invalid data recovery
   - Timer at zero auto-stop
   - Missing DOM elements

**Example Unit Tests**:
- "should add task when valid text is submitted"
- "should not add task when empty text is submitted"
- "should toggle task completion status"
- "should delete task and update storage"
- "should load tasks from Local Storage on init"
- "should handle invalid Local Storage data gracefully"
- "should start timer and create interval"
- "should stop timer and preserve current duration"
- "should reset timer to 25 minutes"

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Test Organization**: Each property test must include a comment tag referencing the design document property:

```javascript
// Feature: todo-list-life-dashboard, Property 1: Time Format Validity
fc.assert(
  fc.property(fc.date(), (date) => {
    const formatted = GreetingModule.formatTime(date);
    return /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(formatted);
  }),
  { numRuns: 100 }
);
```

**Property Tests to Implement**:

1. **Property 1: Time Format Validity**
   - Generator: `fc.date()`
   - Assertion: Output matches regex `^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$`

2. **Property 2: Date Format Completeness**
   - Generator: `fc.date()`
   - Assertion: Output contains day name, month name, and day number

3. **Property 3: Greeting Matches Time of Day**
   - Generator: `fc.integer({ min: 0, max: 23 })`
   - Assertion: Greeting matches expected value for hour range

4. **Property 4: Timer Display Format Validity**
   - Generator: `fc.integer({ min: 0, max: 6000000 })` (0 to 100 minutes in ms)
   - Assertion: Output matches regex `^[0-9]{2}:[0-5][0-9]$`

5. **Property 5: Whitespace Task Rejection**
   - Generator: `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))`
   - Assertion: Validation returns false or addTask does not add item

6. **Property 6: Task Completion Toggle Idempotence**
   - Generator: `fc.record({ id: fc.string(), text: fc.string(), completed: fc.boolean(), createdAt: fc.integer() })`
   - Assertion: `toggle(toggle(task)).completed === task.completed`

7. **Property 7: Invalid Task Data Rejection**
   - Generator: `fc.oneof(fc.string(), fc.integer(), fc.object(), fc.array(fc.object()))`
   - Assertion: Validation returns false for non-array or invalid array items

8. **Property 8: Whitespace Link Rejection**
   - Generator: `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))`
   - Assertion: Validation returns false or addLink does not add item

9. **Property 9: Invalid Link Data Rejection**
   - Generator: `fc.oneof(fc.string(), fc.integer(), fc.object(), fc.array(fc.object()))`
   - Assertion: Validation returns false for non-array or invalid array items

### Integration Testing

**Scope**: End-to-end user workflows

**Approach**: Manual testing or automated browser testing (Playwright/Cypress)

**Test Scenarios**:
1. Complete task workflow: add → edit → mark complete → delete
2. Complete link workflow: add → use (verify new tab) → delete
3. Timer workflow: start → pause → resume → reset
4. Data persistence: add items → refresh page → verify items still present
5. Invalid data recovery: corrupt Local Storage → refresh → verify clean state

### Visual Testing

**Scope**: UI appearance and layout

**Approach**: Manual visual inspection against design requirements

**Checklist**:
- Clear visual hierarchy with distinct sections
- Minimum 14px font size for body text
- Consistent spacing between components
- WCAG AA color contrast ratios (4.5:1 for normal text)
- Responsive layout (if applicable)

### Test Coverage Goals

- **Unit Test Coverage**: 80%+ line coverage for JavaScript code
- **Property Test Coverage**: All 9 correctness properties implemented
- **Integration Test Coverage**: All major user workflows
- **Visual Test Coverage**: All design requirements verified

### Testing Workflow

1. **Development**: Write unit tests alongside implementation
2. **Property Tests**: Implement after core functions are complete
3. **Integration Tests**: Run after all components are integrated
4. **Visual Tests**: Perform before final release
5. **Regression**: Run all tests before any code changes

