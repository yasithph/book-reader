# Commit and Push

Commit all changes and push to remote. Do NOT include any co-author or AI attribution.

## Instructions

1. Run `git status` to see all changes
2. Run `git diff --staged` and `git diff` to understand the changes
3. Run `git log --oneline -5` to see recent commit style
4. Stage all changes with `git add -A`
5. Create a commit with a clear, concise message that:
   - Summarizes what changed (not how)
   - Uses imperative mood ("Add feature" not "Added feature")
   - Does NOT include any co-author line
   - Does NOT mention Claude, AI, or any assistant
6. Push to the current branch with `git push`

## Commit Message Format

```
<type>: <short description>

<optional body with more details>
```

Types: feat, fix, refactor, style, docs, chore, test

## Example

```
feat: Add minimalist book reader UI with Deep Ink theme
```
