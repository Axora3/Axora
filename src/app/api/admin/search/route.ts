import { checkAdmin } from "@/lib/admin/auth";
import { safeSearch } from "@/lib/admin/query";

/** Uses the same session-bound, RLS-protected sources as the five list pages. */
export async function GET(request: Request) {
  const auth = await checkAdmin();
  const headers = { "Cache-Control": "private, no-store" };
  if (auth.kind !== "ok")
    return Response.json(
      { error: "Админ эрх шаардлагатай." },
      { status: auth.kind === "anon" ? 401 : 403, headers },
    );
  const q = safeSearch(new URL(request.url).searchParams.get("q") ?? "");
  if (!q) return Response.json({ results: [], failed: [] }, { headers });
  const { db } = auth.ctx;
  const sources = [
    {
      category: "Захиалга",
      key: "orders",
      table: "website_orders",
      columns: "id,reference,business_name,full_name,created_at",
      fields: ["full_name", "business_name", "email", "phone", "reference"],
      title: "business_name",
      secondary: "reference",
      path: "/admin/orders/",
    },
    {
      category: "Хүсэлт",
      key: "requests",
      table: "template_requests",
      columns: "id,customer_name,contact_value,created_at",
      fields: ["customer_name", "contact_value"],
      title: "customer_name",
      secondary: "contact_value",
      path: "/admin/template-requests/",
    },
    {
      category: "Бүтээгдэхүүн",
      key: "templates",
      table: "templates",
      columns: "id,title,category,created_at",
      fields: ["title"],
      title: "title",
      secondary: "category",
      path: "/admin/templates/",
      suffix: "/edit",
    },
    {
      category: "Төсөл",
      key: "projects",
      table: "admin_project_overview",
      columns: "id,business_name,reference,description,updated_at",
      fields: ["description", "reference", "business_name", "full_name"],
      title: "business_name",
      secondary: "reference",
      path: "/admin/projects/",
    },
    {
      category: "Төлбөр",
      key: "payments",
      table: "template_requests",
      columns: "id,customer_name,contact_value,payment_status,created_at",
      fields: ["customer_name", "contact_value"],
      title: "customer_name",
      secondary: "contact_value",
      path: "/admin/template-requests/",
    },
  ];
  const batches = await Promise.allSettled(
    sources.map(async (source) => {
      const { data, error } = await db
        .from(source.table)
        .select(source.columns)
        .or(source.fields.map((field) => `${field}.ilike."*${q}*"`).join(","))
        .order(source.key === "projects" ? "updated_at" : "created_at", {
          ascending: false,
        })
        .limit(6)
        .abortSignal(request.signal);
      if (error) throw new Error(source.key);
      return (data ?? []).map((record) => {
        const row = record as unknown as Record<string, string | null>;
        const title = row[source.title] || row.id || source.category;
        const secondary = row[source.secondary] || "";
        const term = q.toLocaleLowerCase();
        const rank = [title, secondary, row.id ?? ""].some(
          (text) => text.toLocaleLowerCase() === term,
        )
          ? 0
          : title.toLocaleLowerCase().startsWith(term)
            ? 1
            : 2;
        return {
          key: `${source.key}:${row.id}`,
          kind: source.key,
          category: source.category,
          title,
          secondary,
          href: `${source.path}${encodeURIComponent(row.id!)}${source.suffix ?? ""}`,
          rank,
        };
      });
    }),
  );
  const failed = batches.flatMap((batch, i) =>
    batch.status === "rejected" ? [sources[i].category] : [],
  );
  const results = batches
    .flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 20);
  return Response.json({ results, failed }, { headers });
}
