"use client";

import { runAdminAction } from "@/lib/admin/action-client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addProjectMilestoneAction, createProjectForOrderAction, deleteProjectMilestoneAction, saveProjectAction, updateProjectMilestoneAction } from "@/app/admin/project-actions";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { PROJECT_STATUSES, PROJECT_STATUS, type ProjectStatus } from "@/lib/admin/projects";
import { useUnsavedChanges } from "./useUnsavedChanges";
import { btn, field } from "./ui";

export function CreateProjectButton({ orderId, projectId }: { orderId: string; projectId: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  if (projectId) return <Link href={`/admin/projects/${projectId}`} className={btn.ghost}>Төслийг нээх →</Link>;
  return <button type="button" className={btn.primary} disabled={pending} onClick={() => start(async () => {
    const result = await runAdminAction(() => createProjectForOrderAction(orderId));
    if (!result.ok) return toast({ kind: "err", text: result.message });
    toast({ kind: "ok", text: result.existing ? "Энэ захиалгад төсөл аль хэдийн байна." : "Төслийг үүсгэлээ." });
    router.push(`/admin/projects/${result.id}`);
    router.refresh();
  })}>{pending ? "Үүсгэж байна…" : "Энэ захиалгаар төсөл үүсгэх"}</button>;
}

type ProjectFormValues = { id: string; orderId: string; expected: string; status: ProjectStatus; description: string; startDate: string | null; targetDate: string | null; progress: number };

export function ProjectForm({ project }: { project: ProjectFormValues }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [values, setValues] = useState(project);
  const [saved, setSaved] = useState(JSON.stringify(project));
  useUnsavedChanges(JSON.stringify(values) !== saved);
  const patch = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  return <form className="flex flex-col gap-4" onSubmit={(event) => {
    event.preventDefault();
    start(async () => {
      const result = await runAdminAction(() => saveProjectAction({ ...values, startDate: values.startDate ?? "", targetDate: values.targetDate ?? "" }));
      if (!result.ok) return toast({ kind: "err", text: result.message, action: result.code === "conflict" ? { label: "Шинэчлэх", onClick: () => router.refresh() } : undefined });
      setValues((current) => ({ ...current, expected: result.updatedAt }));
      setSaved(JSON.stringify({ ...values, expected: result.updatedAt }));
      toast({ kind: "ok", text: "Төслийн мэдээлэл хадгалагдлаа." });
      router.refresh();
    });
  }}>
    <label className="flex flex-col gap-1.5"><span className={field.label}>Төслийн төлөв</span><select className={field.input} value={values.status} onChange={(event) => patch("status", event.target.value as ProjectStatus)}>{PROJECT_STATUSES.map((status) => <option key={status} value={status}>{PROJECT_STATUS[status].label}</option>)}</select></label>
    <label className="flex flex-col gap-1.5"><span className={field.label}>Төслийн тайлбар</span><textarea className={field.textarea} rows={5} maxLength={5000} value={values.description} onChange={(event) => patch("description", event.target.value)}/></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5"><span className={field.label}>Эхлэх огноо</span><input className={field.input} type="date" value={values.startDate ?? ""} onChange={(event) => patch("startDate", event.target.value || null)}/></label>
      <label className="flex flex-col gap-1.5"><span className={field.label}>Зорилтот дуусах огноо</span><input className={field.input} type="date" min={values.startDate ?? undefined} value={values.targetDate ?? ""} onChange={(event) => patch("targetDate", event.target.value || null)}/></label>
    </div>
    <label className="flex flex-col gap-1.5"><span className={field.label}>Явц · {values.progress}%</span><input type="range" min={0} max={100} step={5} value={values.progress} onChange={(event) => patch("progress", Number(event.target.value))}/></label>
    <button className={btn.primary} disabled={pending}>{pending ? "Хадгалж байна…" : "Төслийн мэдээлэл хадгалах"}</button>
  </form>;
}

export type Milestone = { id: string; project_id: string; title: string; description: string; due_on: string | null; completed_at: string | null; updated_at: string };

export function ProjectMilestones({ projectId, milestones }: { projectId: string; milestones: Milestone[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [remove, setRemove] = useState<Milestone | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDue, setNewDue] = useState("");

  function save(milestone: Milestone, form: HTMLFormElement) {
    const data = new FormData(form);
    setPendingId(milestone.id);
    start(async () => {
      const result = await runAdminAction(() => updateProjectMilestoneAction({
        id: milestone.id,
        projectId,
        expected: versions[milestone.id] ?? milestone.updated_at,
        title: String(data.get("title") ?? ""),
        description: String(data.get("description") ?? ""),
        dueOn: String(data.get("dueOn") ?? ""),
        completed: data.get("completed") === "on",
      }));
      setPendingId(null);
      if (!result.ok) return toast({ kind: "err", text: result.message, action: result.code === "conflict" ? { label: "Шинэчлэх", onClick: () => router.refresh() } : undefined });
      setVersions((current) => ({ ...current, [milestone.id]: result.updatedAt }));
      toast({ kind: "ok", text: "Үе шат хадгалагдлаа." });
      router.refresh();
    });
  }

  return <div className="flex flex-col gap-3">
    {milestones.length === 0 && <p className="text-sm text-muted">Төсөлд үе шат нэмээгүй байна.</p>}
    {milestones.map((milestone) => <form key={`${milestone.id}:${milestone.updated_at}`} className="flex flex-col gap-3 rounded-xl border border-line bg-sunken p-3" onSubmit={(event) => { event.preventDefault(); save(milestone, event.currentTarget); }}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
        <label className="flex flex-col gap-1"><span className={field.label}>Үе шат</span><input name="title" className={field.input} maxLength={160} defaultValue={milestone.title}/></label>
        <label className="flex flex-col gap-1"><span className={field.label}>Дуусгах өдөр</span><input name="dueOn" type="date" className={field.input} defaultValue={milestone.due_on ?? ""}/></label>
      </div>
      <label className="flex flex-col gap-1"><span className={field.label}>Тайлбар</span><textarea name="description" className={field.textarea} rows={2} maxLength={1200} defaultValue={milestone.description}/></label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><input name="completed" type="checkbox" defaultChecked={!!milestone.completed_at}/>Дууссан</label>
        <span className="flex flex-wrap gap-2"><button className={btn.ghost} disabled={pending}>{pendingId === milestone.id ? "Хадгалж байна…" : "Хадгалах"}</button><button type="button" className={btn.danger} onClick={() => setRemove(milestone)}>Хасах</button></span>
      </div>
    </form>)}

    <form className="grid gap-3 rounded-xl border border-dashed border-line-strong p-3" onSubmit={(event) => { event.preventDefault(); start(async () => {
      const result = await runAdminAction(() => addProjectMilestoneAction({ projectId, title: newTitle, description: newDescription, dueOn: newDue }));
      if (!result.ok) return toast({ kind: "err", text: result.message });
      setNewTitle(""); setNewDescription(""); setNewDue("");
      toast({ kind: "ok", text: "Үе шат нэмэгдлээ." }); router.refresh();
    }); }}>
      <h3 className="font-extrabold">Үе шат нэмэх</h3>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
        <label className="flex flex-col gap-1"><span className={field.label}>Нэр</span><input className={field.input} maxLength={160} required value={newTitle} onChange={(event) => setNewTitle(event.target.value)}/></label>
        <label className="flex flex-col gap-1"><span className={field.label}>Дуусгах өдөр</span><input className={field.input} type="date" value={newDue} onChange={(event) => setNewDue(event.target.value)}/></label>
      </div>
      <label className="flex flex-col gap-1"><span className={field.label}>Тайлбар</span><textarea className={field.textarea} rows={2} maxLength={1200} value={newDescription} onChange={(event) => setNewDescription(event.target.value)}/></label>
      <button className={`${btn.primary} self-start`} disabled={pending}>{pending ? "Нэмж байна…" : "Үе шат нэмэх"}</button>
    </form>

    <BottomSheet open={!!remove} onClose={() => setRemove(null)} title="Үе шатыг хасах уу?" description={remove?.title}>
      <div className="flex flex-col gap-3"><p className="text-sm leading-relaxed text-muted">Энэ үйлдэл түүхэнд бүртгэгдэнэ. Хассан үе шатыг сэргээх боломжгүй.</p><button type="button" className={btn.danger} disabled={pending} onClick={() => remove && start(async () => {
        const result = await runAdminAction(() => deleteProjectMilestoneAction({ id: remove.id, projectId, expected: versions[remove.id] ?? remove.updated_at }));
        if (!result.ok) return toast({ kind: "err", text: result.message });
        setRemove(null); toast({ kind: "ok", text: "Үе шат хасагдлаа." }); router.refresh();
      })}>{pending ? "Хасаж байна…" : "Үе шатыг хасах"}</button><button type="button" className={btn.ghost} onClick={() => setRemove(null)}>Болих</button></div>
    </BottomSheet>
  </div>;
}
