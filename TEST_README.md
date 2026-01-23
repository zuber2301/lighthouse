# Lighthouse Test Suite

This document describes the comprehensive test suite for the Lighthouse employee recognition platform.

## Overview

The test suite covers all layers of the application:
- **Backend**: FastAPI with SQLAlchemy (Python)
- **Frontend**: React with Vite (JavaScript/TypeScript)
- **Database**: Model validation and migration tests

## Test Structure

```
tests/
├── conftest.py                 # Pytest fixtures and configuration
├── test_models.py             # Database model unit tests
├── test_platform_admin_api.py # Platform owner API integration tests
├── test_recognition_api.py    # Recognition API integration tests
├── test_recognition_service.py # Business logic service tests
└── test_tenancy.py            # Multi-tenancy tests (existing)

frontend/src/
├── features/admin/CreateTenantForm.test.jsx
├── hooks/useRecognitions.test.js
├── utils/navLinkClass.test.js
└── api/recognitions.test.js
```

## Backend Tests

### Running Backend Tests

```bash
# From project root
cd backend
python -m pytest

# With coverage
python -m pytest --cov=app --cov-report=html

# Specific test file
python -m pytest tests/test_models.py

# Run specific test
python -m pytest tests/test_models.py::TestUserModel::test_user_creation
```

### Test Categories

#### Unit Tests (`test_models.py`)
- Model creation and validation
- Enum values and constraints
- Relationship integrity
- Data type validation

#### Integration Tests (`test_*_api.py`)
- API endpoint testing with FastAPI TestClient
- Authentication and authorization
- Request/response validation
- Error handling

#### Service Tests (`test_*_service.py`)
- Business logic validation
- Database transactions
- Error scenarios
- Edge cases

### Fixtures

The `conftest.py` file provides reusable fixtures:
- `test_engine`: Async SQLite test database
- `db_session`: Database session with transaction rollback
- `platform_admin_user`, `tenant_admin_user`: Pre-created test users
- `test_tenant`: Test tenant with associated data
- `subscription_plan`: Test subscription plan

## Frontend Tests

### Running Frontend Tests

```bash
# From project root
cd frontend
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# UI mode (if @vitest/ui is installed)
npm run test:ui
```

### Test Categories

#### Component Tests
- React component rendering
- User interactions
- Form validation
- Error states

#### Hook Tests
- Custom hook logic
- State management
- API integration
- Error handling

#### Utility Tests
- Pure functions
- Data transformations
- CSS class generation

#### API Tests
- HTTP request/response mocking
- Error handling
- Data serialization

## Test Coverage

### Backend Coverage Goals
- Models: 90%+
- API endpoints: 85%+
- Services: 80%+
- Utilities: 95%+

### Frontend Coverage Goals
- Components: 80%+
- Hooks: 85%+
- Utilities: 95%+
- API functions: 90%+

## Continuous Integration

### GitHub Actions (Recommended)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm run install:all
      - name: Run tests
        run: npm test
```

## Test Data

### Seed Data
The test suite uses deterministic seed data:
- Platform owner user
- Test tenant with subdomain
- Subscription plans (Basic, Pro)
- Budget pools and allocations

### Mock Data
Frontend tests use mocked API responses to avoid external dependencies.

## Best Practices

### Backend Testing
1. Use descriptive test names with `test_*` prefix
2. Group related tests in classes
3. Use fixtures for reusable test data
4. Mock external services (email, payments)
5. Test both success and error scenarios
6. Validate database state after operations

### Frontend Testing
1. Use `@testing-library/react` for component testing
2. Mock API calls with `vi.fn()`
3. Test user interactions, not implementation details
4. Use `waitFor` for async operations
5. Test accessibility features
6. Mock browser APIs when needed

### General
1. Keep tests fast and isolated
2. Use meaningful assertions
3. Test edge cases and error conditions
4. Maintain test documentation
5. Run tests before committing

## Debugging Tests

### Backend
```bash
# Verbose output
pytest -v

# Stop on first failure
pytest -x

# Debug specific test
pytest --pdb tests/test_models.py::TestUserModel::test_user_creation
```

### Frontend
```bash
# Debug with browser
npm run test:ui

# Run single test file
npx vitest utils/navLinkClass.test.js
```

## Performance

### Test Execution Time
- Backend unit tests: < 30 seconds
- Backend integration tests: < 2 minutes
- Frontend tests: < 1 minute
- Full suite: < 5 minutes

### Optimization Tips
1. Use SQLite for fast database tests
2. Mock slow external services
3. Parallelize independent tests
4. Use fixtures to avoid setup repetition
5. Skip slow tests in development (`pytest -m "not slow"`)

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure 80%+ coverage for new code
3. Update this documentation
4. Run full test suite before PR
5. Add integration tests for API changes
6. Test both happy path and error scenarios

## Troubleshooting

### Common Issues

**Backend:**
- Import errors: Check `conftest.py` mocking
- Database errors: Ensure fixtures are used correctly
- Async issues: Use `pytest-asyncio`

**Frontend:**
- Mocking issues: Ensure all imports are mocked
- DOM testing: Use `screen` from testing-library
- Async operations: Use `waitFor` or `findBy*`

### Getting Help
1. Check existing test examples
2. Review testing-library documentation
3. Check pytest documentation
4. Ask in project discussions