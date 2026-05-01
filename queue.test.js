const request = require("supertest");
const { app, server } = require("../backend/server");

afterAll(() => server.close());

describe("Queue API", () => {
  const SERVICE = "test-service";

  test("POST /api/queue/:id/init  — initializes empty queue", async () => {
    const res = await request(app).post(`/api/queue/${SERVICE}/init`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(SERVICE);
  });

  test("POST /api/queue/:id/join  — adds ticket with correct fields", async () => {
    const res = await request(app)
      .post(`/api/queue/${SERVICE}/join`)
      .send({ name: "Satwik" });
    expect(res.statusCode).toBe(201);
    expect(res.body.ticket).toMatchObject({
      name: "Satwik",
      status: "waiting",
      position: 1,
    });
    expect(res.body.ticket.ticketId).toMatch(/^TKT-/);
  });

  test("POST /api/queue/:id/join  — rejects missing name", async () => {
    const res = await request(app).post(`/api/queue/${SERVICE}/join`).send({});
    expect(res.statusCode).toBe(400);
  });

  test("GET /api/queue/:id  — returns current queue", async () => {
    const res = await request(app).get(`/api/queue/${SERVICE}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.queue)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("POST /api/queue/:id/next  — serves and removes front of queue", async () => {
    // Add a second person
    await request(app).post(`/api/queue/${SERVICE}/join`).send({ name: "Ravi" });

    const res = await request(app).post(`/api/queue/${SERVICE}/next`);
    expect(res.statusCode).toBe(200);
    expect(res.body.served.status).toBe("served");
  });

  test("GET /health  — returns ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  test("POST /api/queue/:id/next  — 404 on empty queue", async () => {
    const emptyService = "empty-svc";
    await request(app).post(`/api/queue/${emptyService}/init`);
    const res = await request(app).post(`/api/queue/${emptyService}/next`);
    expect(res.statusCode).toBe(404);
  });
});
