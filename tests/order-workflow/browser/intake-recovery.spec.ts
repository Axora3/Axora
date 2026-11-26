import { test, expect } from "@playwright/test";
test.use({ extraHTTPHeaders: { "x-forwarded-for": "192.0.2.31" } });

test("saved intake succeeds while quotation migration is unavailable and recovers once without duplicate orders", async ({
  request,
}) => {
  const fixture = await (
    await request.get("http://127.0.0.1:43434/__fixture")
  ).json();
  const body = {
    idempotencyKey: crypto.randomUUID(),
    answers: { ...fixture.answers, q21: "Байхгүй" },
    builder: null,
    attachments: [
      { clientRef: "pending-logo", field: "q22", name: "logo.png", size: 32 },
    ],
    meta: { website: "", startedAt: Date.now() - 15000 },
  };
  await request.post("http://127.0.0.1:43434/__quotation_settings", {
    data: { available: false },
  });
  let created;
  try {
    const first = await request.post("/api/orders", { data: body });
    expect(first.status(), await first.text()).toBe(201);
    created = await first.json();
    expect(created.ok).toBe(true);
    expect(created.quotationStatus).toBe("pending");
    expect(created.trackingUrl).toBeUndefined();
    expect(created.uploadGrant).toBeTruthy();
    expect(created.uploads).toHaveLength(1);
    expect(created.uploads[0].attachmentId).toBeTruthy();
    const second = await request.post("/api/orders", { data: body });
    expect(second.status()).toBe(200);
    const duplicate = await second.json();
    expect(duplicate.orderId).toBe(created.orderId);
    expect(duplicate.quotationStatus).toBe("pending");
    const state = await (
      await request.get(
        "http://127.0.0.1:43434/__order_state?id=" + created.orderId,
      )
    ).json();
    expect(state.order.answers.quotation_requested).toBe(true);
    expect(state.quotes).toBe(0);
    expect(state.attachments).toBe(1);
  } finally {
    await request.post("http://127.0.0.1:43434/__quotation_settings", {
      data: { available: true },
    });
  }
  const job = await request.post("/api/jobs/orders", {
    headers: {
      Authorization: "Bearer fixture-order-job-secret-xxxxxxxxxxxxxxxxxxxxxxxx",
    },
  });
  expect(job.status(), await job.text()).toBe(200);
  expect((await job.json()).quotations.recovered).toBe(1);
  const retry = await request.post("/api/orders", { data: body });
  expect(retry.status()).toBe(200);
  const ready = await retry.json();
  expect(ready.orderId).toBe(created.orderId);
  expect(ready.quotationStatus).toBe("ready");
  expect(ready.trackingUrl).toMatch(/^\/order\/pay\/[A-Za-z0-9_-]{32}$/);
  const final = await (
    await request.get(
      "http://127.0.0.1:43434/__order_state?id=" + created.orderId,
    )
  ).json();
  expect(final.quotes).toBe(1);
  expect(final.attachments).toBe(1);
});
