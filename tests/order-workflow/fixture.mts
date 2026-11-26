import { createServer } from "node:http";
import { createServer as smtpServer } from "node:net";
import { randomUUID } from "node:crypto";
import { workflowDatabase, workflowAdmin } from "./database";
import { generateQuotation } from "../../src/lib/order-workflow/pricing";
import { OWNER_PRICING } from "../../src/lib/order-workflow/defaults";
const db = await workflowDatabase(),
  messages: string[] = [];
await db.query("insert into auth.users values($1)", [workflowAdmin]);
await db.query("insert into admin_users(user_id)values($1)", [workflowAdmin]);
const sampleId = randomUUID(),
  sampleToken = "fixture-order-token-".padEnd(32, "x");
const answers = {
  qPages: "1",
  q1: "Fixture customer",
  q2: "Fixture website",
  q3: "Studio",
  q4: "88000000",
  q5: "fixture@example.invalid",
  q12: "Бизнесийн танилцуулга",
  q13: ["Бизнесээ танилцуулах"],
  q17: "#112233",
  q19: "Minimal",
  q23: ["Нүүр"],
  q25: "Fixture studio introduction",
  q28: ["Монгол"],
  q29: ["Шаардлагагүй"],
  q30: ["Утас"],
  q32: "Үнэгүй веб хаяг хүснэ",
  q34: "Тодорхойгүй",
  q38: "Имэйл",
  q39: true,
};
await db.query(
  "insert into website_orders(id,idempotency_key,payload_hash,reference,full_name,email,phone,business_name,preferred_channel,answers,consent_text_version,consent_processing)values($1,$2,$3,'AX-WORKFLOW','Fixture customer','fixture@example.invalid','88000000','Fixture website','email',$4,'test',true)",
  [sampleId, randomUUID(), "a".repeat(64), { schema_version: 1, ...answers }],
);
await db.query("select website_order_initialize($1,$2,$3)", [
  sampleId,
  sampleToken,
  generateQuotation(answers, OWNER_PRICING),
]);
for (let i = 0; i < 6; i++) {
  const id = randomUUID();
  await db.query(
    "insert into templates(id,slug,title,category,price,is_free,status,sort_order,short_description)values($1,$2,$3,$4,$5,$6,'draft',$7,'Fixture catalogue item')",
    [
      id,
      "workflow-template-" + i,
      "Fixture template " + i,
      ["Notion", "Canva", "Excel"][i % 3],
      i % 2 ? 1000 : 0,
      i % 2 === 0,
      i,
    ],
  );
  await db.query(
    "insert into template_files(template_id,external_url)values($1,'https://example.invalid/fixture')",
    [id],
  );
  await db.query("update templates set status='published' where id=$1", [id]);
}
let rejectNext = false,
  quotationAvailable = true;
const smtp = smtpServer((socket) => {
  let buffer = "",
    data = false,
    mail = "";
  socket.write("220 fixture SMTP\r\n");
  socket.on("data", (chunk) => {
    buffer += chunk.toString();
    while (buffer.includes("\r\n")) {
      const n = buffer.indexOf("\r\n"),
        line = buffer.slice(0, n);
      buffer = buffer.slice(n + 2);
      if (data) {
        if (line === ".") {
          data = false;
          if (rejectNext) {
            rejectNext = false;
            socket.write("451 fixture temporary failure\r\n");
          } else {
            messages.push(mail);
            socket.write("250 accepted\r\n");
          }
          mail = "";
        } else mail += line + "\r\n";
        continue;
      }
      if (/^EHLO|HELO/.test(line))
        socket.write("250-fixture\r\n250 AUTH PLAIN LOGIN\r\n");
      else if (/^AUTH/.test(line)) socket.write("235 authenticated\r\n");
      else if (/^DATA/.test(line)) {
        data = true;
        socket.write("354 send data\r\n");
      } else if (/^QUIT/.test(line)) {
        socket.end("221 bye\r\n");
      } else socket.write("250 ok\r\n");
    }
  });
});
smtp.listen(43436, "127.0.0.1");
const ident = (s: string) => {
  if (!/^[a-z_][a-z_0-9]*$/.test(s)) throw Error("identifier");
  return '"' + s + '"';
};
const tableNames = new Set(
  (
    await db.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname='public'",
    )
  ).rows.map((r) => r.tablename),
);
let catalog: {
  delay?: number;
  hold?: boolean;
  error?: boolean;
  empty?: boolean;
} = {};
let workflowAvailable = true;
const server = createServer(async (req, res) => {
  // Loopback QA transport only. These credentials/tokens are never valid in Supabase.
  if (
    ["http://localhost:43435", "http://127.0.0.1:43437"].includes(
      String(req.headers.origin),
    )
  ) {
    res.setHeader("Access-Control-Allow-Origin", String(req.headers.origin));
    res.setHeader(
      "Access-Control-Allow-Headers",
      "authorization,apikey,content-type,x-client-info,x-supabase-api-version",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const send = (value: unknown, status = 200, count?: number) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Range": `0-${Math.max(0, (count ?? 0) - 1)}/${count ?? 0}`,
    });
    res.end(JSON.stringify(value));
  };
  const read = async () => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString() || "{}");
  };
  const u = new URL(req.url!, "http://fixture");
  let sub = "";
  try {
    sub =
      JSON.parse(
        Buffer.from(
          String(req.headers.authorization).split(".")[1] ?? "",
          "base64url",
        ).toString(),
      ).sub ?? "";
  } catch {}
  const service = req.headers.apikey === "fixture-service-role-key",
    admin = sub === workflowAdmin;
  try {
    if (u.pathname === "/__fixture")
      return send({ orderId: sampleId, token: sampleToken, answers, messages });
    if (u.pathname === "/__legacy") {
      const paid = (await read()).paid === true,
        id = randomUUID(),
        token = randomUUID().replaceAll("-", "");
      await db.query(
        "insert into website_orders(id,idempotency_key,payload_hash,reference,full_name,email,phone,business_name,preferred_channel,answers,consent_text_version,consent_processing,quote_amount,payment_token,payment_status,paid_at)values($1,$2,$3,$4,'Legacy fixture','fixture@example.invalid','88000000','Legacy fixture','email',$5,'test',true,555000,$6,$7,case when $7='paid' then now() else null end)",
        [
          id,
          randomUUID(),
          "a".repeat(64),
          "AX-LEGACY-" + id.slice(0, 8),
          { schema_version: 1 },
          token,
          paid ? "paid" : "unpaid",
        ],
      );
      return send({ orderId: id, token });
    }
    if (u.pathname === "/__workflow_available") {
      workflowAvailable = (await read()).available === true;
      return send({ ok: true });
    }
    if (u.pathname === "/__catalog") {
      catalog = await read();
      return send({ ok: true });
    }
    if (u.pathname === "/__fail_email") {
      rejectNext = true;
      return send({ ok: true });
    }
    if (u.pathname === "/__quotation_settings") {
      quotationAvailable = (await read()).available === true;
      return send({ available: quotationAvailable });
    }
    if (u.pathname === "/__order_state") {
      const id = u.searchParams.get("id");
      const row = (
        await db.query(
          "select id,answers,payment_status,quote_amount,workflow_managed from website_orders where id=$1",
          [id],
        )
      ).rows[0];
      const quotes = (
        await db.query(
          "select id from website_order_quotes where order_id=$1",
          [id],
        )
      ).rows;
      const attachments = (
        await db.query("select id from order_attachments where order_id=$1", [
          id,
        ])
      ).rows;
      return send({
        order: row,
        quotes: quotes.length,
        attachments: attachments.length,
      });
    }
    if (u.pathname === "/auth/v1/user")
      return admin
        ? send({
            id: workflowAdmin,
            aud: "authenticated",
            role: "authenticated",
            email: "admin@example.invalid",
            created_at: "2026-11-25T00:00:00Z",
            app_metadata: {},
            user_metadata: {},
          })
        : send({ message: "Unauthorized" }, 401);
    if (u.pathname === "/auth/v1/token") {
      const credentials = await read();
      if (
        !(
          credentials.email === "admin@example.invalid" &&
          credentials.password === "fixture-admin-only-2026"
        ) &&
        !(
          u.searchParams.get("grant_type") === "refresh_token" &&
          credentials.refresh_token === "fixture-refresh"
        )
      )
        return send({ message: "Invalid QA credentials" }, 400);
      const token =
        [
          { alg: "HS256", typ: "JWT" },
          {
            sub: workflowAdmin,
            aud: "authenticated",
            role: "authenticated",
            exp: Math.floor(Date.now() / 1000) + 7200,
          },
        ]
          .map((v) => Buffer.from(JSON.stringify(v)).toString("base64url"))
          .join(".") +
        "." +
        Buffer.from("fixture-only-signature").toString("base64url");
      return send({
        access_token: token,
        refresh_token: "fixture-refresh",
        token_type: "bearer",
        expires_in: 7200,
        user: {
          id: workflowAdmin,
          email: "admin@example.invalid",
          aud: "authenticated",
          role: "authenticated",
          created_at: "2026-11-25T00:00:00Z",
          app_metadata: {},
          user_metadata: {},
        },
      });
    }
    if (u.pathname === "/auth/v1/logout") return send({});
    if (u.pathname.startsWith("/rest/v1/rpc/")) {
      const name = u.pathname.split("/").at(-1)!;
      if (!workflowAvailable && name.startsWith("website_order_"))
        return send({ code: "PGRST202" }, 404);
      if (name === "is_admin") return send(admin);
      if (!/^(website_order_|create_website_order$|hit_rate_limit$)/.test(name))
        return send({ code: "PGRST202" }, 404);
      const input = await read(),
        keys = Object.keys(input),
        args = keys.map((k, i) => ident(k) + "=> $" + (i + 1)).join(",");
      const result = await db.transaction(async (tx) => {
        await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
          sub,
        ]);
        await tx.exec(
          "set local role " +
            (service ? "service_role" : admin ? "authenticated" : "anon"),
        );
        return tx.query<{ v: unknown }>(
          `select public.${ident(name)}(${args}) v`,
          Object.values(input),
        );
      });
      return send(result.rows[0]?.v);
    }
    if (u.pathname.startsWith("/rest/v1/")) {
      const table = u.pathname.split("/").at(-1)!;
      if (table === "templates") {
        while (catalog.hold)
          await new Promise((resolve) => setTimeout(resolve, 20));
        if (catalog.delay)
          await new Promise((resolve) => setTimeout(resolve, catalog.delay));
        if (catalog.error)
          return send({ code: "fixture_catalog_failure" }, 503);
        if (catalog.empty) return send([]);
      }
      if (table === "website_workflow_settings" && !quotationAvailable)
        return send(
          {
            code: "PGRST205",
            message: "Quotation settings migration unavailable",
          },
          404,
        );
      if (!tableNames.has(table))
        return send(
          { code: "PGRST205", message: "Table absent in disposable QA schema" },
          404,
        );
      if (req.method !== "GET" && req.method !== "HEAD")
        return send({ code: "fixture_readonly" }, 405);
      const params: unknown[] = [],
        where: string[] = [];
      for (const [key, value] of u.searchParams) {
        if (["select", "order", "limit", "offset", "or", "and"].includes(key))
          continue;
        const [op, ...tail] = value.split("."),
          v = tail.join(".");
        if (op === "eq") {
          params.push(key === "workflow_managed" ? v === "true" : v);
          where.push(
            (key === "answers->>quotation_requested"
              ? "answers->>'quotation_requested'"
              : ident(key)) +
              "=$" +
              params.length,
          );
        } else if (op === "in") {
          params.push(v.replace(/^\(|\)$/g, "").split(","));
          where.push(`${ident(key)}::text=any($${params.length}::text[])`);
        } else if (op === "is" && v === "null")
          where.push(ident(key) + " is null");
      }
      const order = (u.searchParams.get("order") ?? "")
        .split(",")
        .filter(Boolean)
        .map((x) => {
          const [k, d] = x.split(".");
          return ident(k) + (d === "desc" ? " desc" : " asc");
        });
      const limit = Math.min(
        1000,
        Math.max(1, Number(u.searchParams.get("limit") ?? 1000)),
      );
      const selection = u.searchParams.get("select") ?? "*";
      const columns =
        selection === "*" || selection.includes("(")
          ? "*"
          : selection.split(",").map(ident).join(",");
      const result = await db.transaction(async (tx) => {
        await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
          sub,
        ]);
        await tx.exec(
          "set local role " +
            (service ? "service_role" : admin ? "authenticated" : "anon"),
        );
        return tx.query<Record<string, unknown>>(
          `select ${columns} from public.${ident(table)}${where.length ? " where " + where.join(" and ") : ""}${order.length ? " order by " + order.join(",") : ""} limit ${limit}`,
          params,
        );
      });
      const accept = req.headers.accept ?? "";
      return send(
        accept.includes("vnd.pgrst.object")
          ? (result.rows[0] ?? null)
          : result.rows,
        200,
        result.rows.length,
      );
    }
    send({ code: "missing" }, 404);
  } catch (e) {
    send(
      {
        code: (e as { code?: string }).code ?? "fixture_error",
        message: (e as Error).message,
      },
      400,
    );
  }
});
server.listen(43434, "127.0.0.1", () =>
  console.log("Order workflow disposable fixture ready"),
);
const shutdown = () => {
  server.close();
  smtp.close();
  void db.close();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
