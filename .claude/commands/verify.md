# Verify Changes

Please verify all the changes you just made, look for security bugs, performance bottlenecks and edge cases. Only give me the green light if you're 100% sure this is production ready code.

## Instructions

1. Run `git diff` to see all uncommitted changes
2. Read every changed file fully to understand the context
3. Perform a thorough review checking for:

### Security
- SQL injection, XSS, or other injection vulnerabilities
- Missing authentication or authorization checks
- Sensitive data exposure
- Unsafe use of user input

### Performance
- Unnecessary re-renders or state updates
- Missing memoization where needed
- N+1 queries or redundant API calls
- Large data processing without pagination

### Edge Cases
- Null/undefined handling
- Empty states
- Race conditions
- Error handling gaps
- Concurrent user scenarios

### Code Quality
- Type safety issues
- Dead code or unused imports
- Inconsistent patterns with the rest of the codebase
- Missing loading/error states

4. Report findings with file paths and line numbers
5. Only give the green light if everything passes. If issues are found, list them clearly with severity (critical/warning/info)
