# Task Manager

A REST API and client application built with Node.js, Express and SQLite.

## How to start the API

1. Install dependencies:
npm install

2. Start the server:
npm start

3. Open browser at:
http://localhost:3000

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | /tasks | Get all tasks |
| GET | /tasks/:id | Get one task |
| POST | /tasks | Create a task |
| PUT | /tasks/:id | Update a task |
| DELETE | /tasks/:id | Delete a task |

## How to run tests

npm test

## How to generate API docs

npm run docs

## Technologies used

- Node.js
- Express
- SQLite (better-sqlite3)
- TestCafe (testing)
- APIDoc (documentation)