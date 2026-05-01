# Smart Queue Management System

A real-time queue management system built with **React.js**, **Node.js**, and **WebSockets**, designed to reduce physical wait times at public service counters.

## Features

- Real-time queue updates via WebSocket (sub-100ms latency)
- Ticket generation with unique IDs and position tracking
- REST API for queue operations (join, serve, status)
- Live latency display on the frontend
- Automated regression test suite (Jest + Supertest)

## Architecture

```
smart-queue-system/
├── backend/
│   ├── server.js        # Express + WebSocket server
│   └── package.json
├── frontend/
│   └── src/
│       └── App.jsx      # React frontend
├── tests/
│   └── queue.test.js    # API regression tests
└── README.md
```

## Getting Started

### Backend

```bash
cd backend
npm install
npm start         # runs on port 4000
npm test          # runs Jest test suite
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # Vite dev server
```

## API Reference

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| POST   | `/api/queue/:id/init`           | Initialize service queue |
| POST   | `/api/queue/:id/join`           | Join queue (body: name)  |
| POST   | `/api/queue/:id/next`           | Serve next in queue      |
| GET    | `/api/queue/:id`                | Get queue snapshot       |
| GET    | `/health`                       | Health check             |

## WebSocket Events

| Event            | Direction       | Description                    |
|------------------|-----------------|--------------------------------|
| `connected`      | Server → Client | Confirms connection            |
| `subscribe`      | Client → Server | Subscribe to a service queue   |
| `queue_update`   | Server → Client | Broadcast on any queue change  |
| `queue_snapshot` | Server → Client | Full queue on subscription     |

## Test Results

```
PASS tests/queue.test.js
  Queue API
    ✓ POST /api/queue/:id/init  — initializes empty queue
    ✓ POST /api/queue/:id/join  — adds ticket with correct fields
    ✓ POST /api/queue/:id/join  — rejects missing name
    ✓ GET  /api/queue/:id       — returns current queue
    ✓ POST /api/queue/:id/next  — serves and removes front of queue
    ✓ GET  /health              — returns ok status
    ✓ POST /api/queue/:id/next  — 404 on empty queue

Test Suites: 1 passed | Tests: 7 passed
```

## Tech Stack

- **Backend:** Node.js, Express.js, ws (WebSocket)
- **Frontend:** React.js (Vite)
- **Testing:** Jest, Supertest
- **Version Control:** Git
