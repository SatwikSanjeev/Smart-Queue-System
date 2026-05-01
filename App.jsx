import { useState, useEffect, useRef } from "react";

const API = "http://localhost:4000/api";
const WS_URL = "ws://localhost:4000";
const SERVICE_ID = "counter-1";

export default function App() {
  const [queue, setQueue] = useState([]);
  const [name, setName] = useState("");
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("Connecting...");
  const [latency, setLatency] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      setStatus("Connected");
      socket.send(JSON.stringify({ type: "subscribe", serviceId: SERVICE_ID }));
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event === "queue_update" || data.event === "queue_snapshot") {
        setQueue(data.queue);
        if (data.timestamp) setLatency(Date.now() - data.timestamp);
      }
    };

    socket.onclose = () => setStatus("Disconnected");
    return () => socket.close();
  }, []);

  const joinQueue = async () => {
    if (!name.trim()) return alert("Enter your name.");
    const res = await fetch(`${API}/queue/${SERVICE_ID}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setTicket(data.ticket);
    setName("");
  };

  const serveNext = async () => {
    await fetch(`${API}/queue/${SERVICE_ID}/next`, { method: "POST" });
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1>🎟 Smart Queue System</h1>
      <p>WebSocket Status: <strong>{status}</strong> {latency && `| Latency: ${latency}ms`}</p>

      <div style={{ marginBottom: 20 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          style={{ padding: 8, marginRight: 8, width: 200 }}
        />
        <button onClick={joinQueue} style={{ padding: "8px 16px" }}>Join Queue</button>
        <button onClick={serveNext} style={{ padding: "8px 16px", marginLeft: 8, background: "#28a745", color: "#fff", border: "none" }}>
          Serve Next
        </button>
      </div>

      {ticket && (
        <div style={{ background: "#e8f5e9", padding: 12, borderRadius: 6, marginBottom: 16 }}>
          <strong>Your Ticket:</strong> {ticket.ticketId} — Position #{ticket.position}
        </div>
      )}

      <h3>Live Queue ({queue.length} waiting)</h3>
      {queue.length === 0 ? (
        <p style={{ color: "#888" }}>Queue is empty.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ padding: 8, textAlign: "left" }}>#</th>
              <th style={{ padding: 8, textAlign: "left" }}>Ticket</th>
              <th style={{ padding: 8, textAlign: "left" }}>Name</th>
              <th style={{ padding: 8, textAlign: "left" }}>Joined At</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((t) => (
              <tr key={t.ticketId} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: 8 }}>{t.position}</td>
                <td style={{ padding: 8 }}>{t.ticketId}</td>
                <td style={{ padding: 8 }}>{t.name}</td>
                <td style={{ padding: 8 }}>{new Date(t.joinedAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
