import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { database, adminId } from "./helpers";
export const fixtureToken = "fixture-ecosystem-service-" + "x".repeat(40);
export async function fixture(port = 0) {
  const db = await database();
  const customers = new Map<string, Record<string, unknown>>(),
    projects = new Map<string, Record<string, unknown>>(),
    invoices = new Map<string, Record<string, unknown>>(),
    payments = new Map<string, Record<string, unknown>>();
  const cached = new Map<string, { body: string; result: unknown }>();
  let dashboardAvailable = false;
  const orderId = randomUUID();
  await db.query(
    "insert into website_orders(id,full_name,email,phone,business_name,reference,answers)values($1,$2,$3,$4,$5,$6,$7)",
    [
      orderId,
      "Fixture Customer",
      "fixture@example.invalid",
      "99999999",
      "Fixture Website",
      "TEST-ORDER-1",
      {},
    ],
  );
  function send(res: ServerResponse, data: unknown, status = 200) {
    res.writeHead(status, {
      "content-type": "application/json",
      "content-range": Array.isArray(data)
        ? `0-${Math.max(0, data.length - 1)}/${data.length}`
        : "*/*",
    });
    res.end(JSON.stringify(data));
  }
  async function body(req: IncomingMessage) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const value = Buffer.concat(chunks).toString();
    return value ? JSON.parse(value) : {};
  }
  function sub(req: IncomingMessage) {
    try {
      return JSON.parse(
        Buffer.from(
          String(req.headers.authorization).split(".")[1] || "",
          "base64url",
        ).toString(),
      ).sub;
    } catch {
      return null;
    }
  }
  const server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url!, "http://fixture");
      const path = u.pathname;
      if (path === "/auth/v1/user") {
        const id = sub(req);
        if (id !== adminId)
          return send(res, { message: "fixture auth denied" }, 401);
        return send(res, {
          id: adminId,
          aud: "authenticated",
          role: "authenticated",
          email: "admin@example.invalid",
          created_at: "2026-11-11T00:00:00Z",
          app_metadata: {},
          user_metadata: {},
        });
      }
      if (path.startsWith("/rest/v1/rpc/")) {
        const name = path.split("/").at(-1)!;
        const payload = await body(req);
        if (name === "is_admin") return send(res, sub(req) === adminId);
        if (name === "hit_rate_limit") return send(res, true);
        if (!/^ecosystem_(command|claim|finish|settle|tick)$/.test(name))
          return send(res, { code: "PGRST202" }, 404);
        const keys = Object.keys(payload);
        if (keys.some((k) => !/^p_[a-z_]+$/.test(k)))
          throw Error("invalid RPC arg");
        const call =
          "public." +
          name +
          "(" +
          keys.map((k, i) => k + "=> $" + (i + 1)).join(",") +
          ")";
        if (name === "ecosystem_claim")
          return send(
            res,
            (await db.query("select * from " + call, Object.values(payload)))
              .rows,
          );
        const r = await db.query<{ value: unknown }>(
          "select " + call + " as value",
          Object.values(payload),
        );
        return send(res, r.rows[0]?.value ?? null);
      }
      if (path.startsWith("/rest/v1/")) {
        const table = path.split("/").at(-1)!;
        if (
          !/^(ecosystem_[a-z_]+|website_orders|website_projects)$/.test(table)
        )
          return send(res, []);
        if (req.method === "POST") {
          const payload = await body(req);
          const list = Array.isArray(payload) ? payload : [payload];
          for (const row of list) {
            const keys = Object.keys(row);
            if (keys.some((k) => !/^[a-z_]+$/.test(k)))
              throw Error("invalid column");
            let sql = `insert into ${table}(${keys.join(",")})values(${keys.map((_, i) => "$" + (i + 1)).join(",")})`;
            const conflict = u.searchParams.get("on_conflict");
            if (conflict) {
              if (!/^[a-z_,]+$/.test(conflict)) throw Error("invalid conflict");
              sql +=
                "on conflict(" +
                conflict +
                ")do update set " +
                keys
                  .filter((k) => !conflict.split(",").includes(k))
                  .map((k) => k + "=excluded." + k)
                  .join(",");
            }
            await db.query(sql, Object.values(row));
          }
          return send(res, list, 201);
        }
        const columns = u.searchParams.get("select") || "*";
        if (!/^[a-z_,*]+$/.test(columns)) throw Error("invalid select");
        const values: unknown[] = [];
        const filters: string[] = [];
        for (const [k, v] of u.searchParams) {
          if (
            !/^[a-z_]+$/.test(k) ||
            ["select", "order", "limit", "offset"].includes(k)
          )
            continue;
          if (v.startsWith("eq.")) {
            values.push(v.slice(3));
            filters.push(k + "=$" + values.length);
          }
          if (v === "is.null") filters.push(k + " is null");
        }
        let sql =
          "select " +
          columns +
          " from " +
          table +
          (filters.length ? " where " + filters.join(" and ") : "");
        const order = u.searchParams.get("order");
        if (order && /^[a-z_]+\.(asc|desc)$/.test(order))
          sql += " order by " + order.replace(".", " ");
        sql +=
          " limit " +
          Math.min(1000, Number(u.searchParams.get("limit") || 100));
        const rows = (await db.query(sql, values)).rows;
        return send(
          res,
          String(req.headers.accept).includes("vnd.pgrst.object")
            ? (rows[0] ?? null)
            : rows,
        );
      }
      if (path.startsWith("/factory/")) {
        if (req.headers.authorization !== "Bearer " + fixtureToken)
          return send(res, { code: "unauthorized" }, 401);
        if (path === "/factory/api/state")
          return send(res, {
            orders: [...customers.values()],
            projects: [...projects.values()],
            templates: [
              {
                id: "fixture-template",
                name: "TEST FIXTURE ONLY",
                status: "incomplete",
                commit: null,
              },
            ],
            jobs: [],
            providers: {
              codex: false,
              "claude-code": false,
              "codex+claude-code": false,
              custom: false,
            },
          });
        if (path === "/factory/api/orders" && req.method === "POST") {
          const b = await body(req),
            key = String(req.headers["idempotency-key"]),
            old = cached.get(key);
          if (old) {
            if (old.body !== JSON.stringify(b))
              return send(res, { code: "conflict" }, 409);
            return send(res, old.result);
          }
          const o = {
            id: randomUUID(),
            externalId: b.externalId,
            answers: b.answers,
            analysis: {
              spec: null,
              missing: [
                {
                  field: "content",
                  code: "fixture_question",
                  question: "TEST FIXTURE: missing content",
                },
              ],
              matches: [],
            },
          };
          customers.set(o.id, o);
          cached.set(key, { body: JSON.stringify(b), result: o });
          return send(res, o);
        }
        const options = path.match(
          /^\/factory\/api\/orders\/([^/]+)\/options$/,
        );
        if (options) {
          const o = customers.get(options[1]!);
          return o
            ? send(res, { ...(o.analysis as object), templates: [] })
            : send(res, { code: "not_found" }, 404);
        }
        const generate = path.match(
          /^\/factory\/api\/orders\/([^/]+)\/generate$/,
        );
        if (generate) {
          const o = customers.get(generate[1]!);
          if (!o) return send(res, { code: "not_found" }, 404);
          const p = {
            id: randomUUID(),
            orderId: o.id,
            siteId: (o.answers as Record<string, unknown>).siteId,
            status: "awaiting_approval",
            sourceHash: "a".repeat(64),
            commit: "b".repeat(40),
            qa: { evidence: "TEST FIXTURE ONLY" },
            preview: {
              id: "dpl_fixture",
              url: "https://fixture-preview.vercel.app",
              sourceHash: "a".repeat(64),
              status: "READY",
              accessibleAt: new Date().toISOString(),
            },
            approval: null,
            delivery: null,
            lastError: null,
          };
          projects.set(p.id, p);
          return send(res, p);
        }
        const action = path.match(
          /^\/factory\/api\/projects\/([^/]+)\/(approve|confirm)$/,
        );
        if (action) {
          const p = projects.get(action[1]!);
          if (!p) return send(res, { code: "not_found" }, 404);
          const b = await body(req);
          if (action[2] === "approve") {
            p.status = "awaiting_delivery_confirmation";
            p.approval = {
              actor: "test-fixture",
              sourceHash: p.sourceHash,
              at: new Date().toISOString(),
            };
          } else {
            p.status = "delivered";
            p.delivery = p.delivery ?? {
              reference: b.reference,
              actor: "test-fixture",
              at: new Date().toISOString(),
            };
          }
          return send(res, p);
        }
        return send(res, { code: "not_found" }, 404);
      }
      if (path.startsWith("/dashboard/")) {
        if (!dashboardAvailable)
          return send(res, { code: "contract_unavailable" }, 404);
        if (req.method === "GET") {
          const id = path.split("/").at(-1)!;
          const row = (
            await db.query<{
              id: string;
              customer_id: string;
              business_type: string;
              enabled_modules: string[];
              last_successful_sync: string;
            }>("select * from ecosystem_sites where id=$1", [id])
          ).rows[0];
          if (!row) return send(res, { code: "not_found" }, 404);
          const mapping = (
            await db.query<{ spreadsheet_id: string }>(
              "select spreadsheet_id from ecosystem_sheet_mappings where site_id=$1",
              [id],
            )
          ).rows[0];
          return send(res, {
            site_id: id,
            customer_ref: row.customer_id,
            business_type: row.business_type,
            enabled_modules: row.enabled_modules,
            status: "ready",
            spreadsheet_id: mapping?.spreadsheet_id,
            integration_status: "connected",
            last_successful_sync: new Date().toISOString(),
            configuration_version: 1,
          });
        }
        const b = await body(req);
        if (path.endsWith("/access"))
          return send(res, {
            site_id: b.site_id,
            customer_ref: b.customer_ref,
            dashboard_user_id: null,
            status: "invited",
            delivery_confirmed_at: b.delivery_confirmed_at,
          });
        return send(res, {
          site_id: b.site_id,
          customer_ref: b.customer_ref,
          business_type: b.business_type,
          enabled_modules: b.enabled_modules,
          status: "ready",
          spreadsheet_id: "fixture-sheet-" + b.site_id,
          integration_status: "connected",
          last_successful_sync: new Date().toISOString(),
          configuration_version: 1,
        });
      }
      if (path.startsWith("/provider/")) {
        if (req.headers.authorization !== "Bearer " + fixtureToken)
          return send(res, { code: "unauthorized" }, 401);
        if (path === "/provider/invoices") {
          const b = await body(req),
            key = String(req.headers["idempotency-key"]);
          const old = cached.get("invoice:" + key);
          if (old) return send(res, old.result);
          const result = {
            id: "provider_" + randomUUID().replaceAll("-", ""),
            payment_url: "https://fixture-pay.example.invalid/checkout",
          };
          invoices.set(result.id, { ...b, ...result });
          cached.set("invoice:" + key, { body: JSON.stringify(b), result });
          return send(res, result);
        }
        const id = path.split("/").at(-1)!;
        return payments.has(id)
          ? send(res, payments.get(id))
          : send(res, { code: "not_found" }, 404);
      }
      return send(res, { code: "not_found" }, 404);
    } catch (e) {
      const error = e as { code?: string; message?: string };
      send(
        res,
        {
          code: error.code || "P0001",
          message: error.message || "fixture_failure",
        },
        400,
      );
    }
  });
  await new Promise<void>((resolve) =>
    server.listen(port, "127.0.0.1", resolve),
  );
  const address = server.address();
  if (!address || typeof address === "string") throw Error("fixture address");
  const base = "http://127.0.0.1:" + address.port;
  return {
    db,
    base,
    orderId,
    payments,
    invoices,
    enableDashboard: () => {
      dashboardAvailable = true;
    },
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.close();
    },
  };
}
