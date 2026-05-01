const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// In-memory queue store
let queues = {}; // { serviceId: [ { ticketId, name, status, joinedAt } ] }
let ticketCounter = 1;

// Broadcast updated queue to all connected clients
function broadcast(serviceId) {
  const payload = JSON.stringify({
    event: "queue_update",
    serviceId,
    queue: queues[serviceId] || [],
    timestamp: Date.now(),
  });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(payload);
  });
}

// REST: Create or reset a service queue
app.post("/api/queue/:serviceId/init", (req, res) => {
  const { serviceId } = req.params;
  queues[serviceId] = [];
  broadcast(serviceId);
  res.json({ message: `Queue for service '${serviceId}' initialized.` });
});

// REST: Join queue
app.post("/api/queue/:serviceId/join", (req, res) => {
  const { serviceId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required." });

  if (!queues[serviceId]) queues[serviceId] = [];

  const ticket = {
    ticketId: `TKT-${String(ticketCounter++).padStart(4, "0")}`,
    name,
    status: "waiting",
    joinedAt: new Date().toISOString(),
    position: queues[serviceId].length + 1,
  };

  queues[serviceId].push(ticket);
  broadcast(serviceId);
  res.status(201).json({ ticket, queueLength: queues[serviceId].length });
});

// REST: Serve next in queue
app.post("/api/queue/:serviceId/next", (req, res) => {
  const { serviceId } = req.params;
  if (!queues[serviceId] || queues[serviceId].length === 0) {
    return res.status(404).json({ error: "Queue is empty." });
  }

  const served = queues[serviceId].shift();
  served.status = "served";

  // Re-index positions
  queues[serviceId].forEach((t, i) => (t.position = i + 1));
  broadcast(serviceId);
  res.json({ served, remaining: queues[serviceId].length });
});

// REST: Get queue status
app.get("/api/queue/:serviceId", (req, res) => {
  const { serviceId } = req.params;
  res.json({
    serviceId,
    queue: queues[serviceId] || [],
    length: (queues[serviceId] || []).length,
  });
});

// REST: Health check
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// WebSocket connection handler
wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ event: "connected", message: "Smart Queue WebSocket ready." }));

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      // Client can subscribe to a specific serviceId
      if (msg.type === "subscribe" && msg.serviceId) {
        ws.send(
          JSON.stringify({
            event: "queue_snapshot",
            serviceId: msg.serviceId,
            queue: queues[msg.serviceId] || [],
          })
        );
      }
    } catch (e) {
      ws.send(JSON.stringify({ event: "error", message: "Invalid message format." }));
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Smart Queue server running on port ${PORT}`));

module.exports = { app, server };
