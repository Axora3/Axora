import type { SupabaseClient } from "@supabase/supabase-js";
import { AUDIT_ACTION, fmtDateTime, statusLabel } from "@/lib/admin/labels";
import { NoteForm } from "./forms";
import { LoadFailed } from "./ui";

/** Internal notes + audit-based history for one order or request. */
export async function NotesHistory({ db, entityType, entityId, meId }: { db: SupabaseClient; entityType: "order" | "template_request"; entityId: string; meId: string }) {
  const [notes, hist] = await Promise.all([
    db.from("admin_notes").select("id, body, author_id, created_at").eq("entity_type", entityType).eq("entity_id", entityId).order("created_at", { ascending: false }),
    db.from("admin_audit_log").select("id, actor_id, action, details, created_at").eq("entity_type", entityType).eq("entity_id", entityId).order("created_at", { ascending: false }).limit(50),
  ]);
  const who = (id: string | null) => (!id ? "Систем" : id === meId ? "Та" : `Админ ${id.slice(0, 6)}`);
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby={`notes-${entityId}`} className="flex flex-col gap-3">
        <h3 id={`notes-${entityId}`} className="text-base font-extrabold">
          Дотоод тэмдэглэл
        </h3>
        <NoteForm entityType={entityType} entityId={entityId} />
        {notes.error ? (
          <LoadFailed what="тэмдэглэлүүдийг" />
        ) : !notes.data?.length ? (
          <p className="text-sm text-muted">Одоогоор тэмдэглэл алга.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {notes.data.map((n) => (
              <li key={n.id} className="rounded-xl border border-line bg-bg p-3">
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{n.body}</p>
                <p className="mt-1.5 text-xs text-muted">
                  {who(n.author_id)} · {fmtDateTime(n.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby={`hist-${entityId}`} className="flex flex-col gap-2">
        <h3 id={`hist-${entityId}`} className="text-base font-extrabold">
          Түүх
        </h3>
        {hist.error ? (
          <LoadFailed what="түүхийг" />
        ) : !hist.data?.length ? (
          <p className="text-sm text-muted">Админ үйлдэл хараахан бүртгэгдээгүй.</p>
        ) : (
          <ol className="m-0 flex list-none flex-col p-0">
            {hist.data.map((h) => {
              const d = h.details as { from?: string; to?: string };
              return (
                <li key={h.id} className="border-l-2 border-line-mid py-2 pl-3 text-sm">
                  <strong>{AUDIT_ACTION[h.action] ?? h.action}</strong>
                  {d.from && d.to && (
                    <span>
                      {" "}
                      : {statusLabel(entityType, d.from)} → {statusLabel(entityType, d.to)}
                    </span>
                  )}
                  <span className="block text-xs text-muted">
                    {who(h.actor_id)} · {fmtDateTime(h.created_at)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
