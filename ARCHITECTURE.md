# Architecture

React/Vite frontend -> Nginx -> Express API -> MongoDB

Authentication uses short-lived access JWTs plus rotating refresh tokens stored in an HTTP-only cookie. Sessions are persisted in MongoDB and refresh-token hashes are stored rather than raw refresh tokens.

Core domain collections:

- users
- sessions
- events
- teams
- projects
- judge invitations
- judge assignments
- scores

The public gallery is unauthenticated. Submission, team and judging operations use backend role middleware. Judge score queries derive the judge identity from the authenticated token rather than from a query parameter

The application intentionally keeps fixture IDs as strings while using MongoDB ObjectIds for internal relationships allowing the official fixture file to be imported without forcing its structure to become the internal schema
