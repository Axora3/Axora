import { isCalendarDate } from "@/lib/admin/dates";
import {
  schedulingPolicySchema,
  type Schedule,
  type SchedulingPolicy,
} from "./contracts";

export type Workload = {
  id: string;
  effortDays: number | null;
  remainingDays?: number | null;
  bufferDays?: number;
  deadline: string | null;
  earliestStart?: string | null;
  receivedAt: string;
  priority?: number;
};
export const ulaanbaatarDay = (now: Date) =>
  new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10);
function nextDay(day: string) {
  return new Date(Date.parse(day + "T12:00:00Z") + 86400000)
    .toISOString()
    .slice(0, 10);
}

/** A project consumes at most one workday per calendar working day. Capacity
 * uses the owner's parallel-project limit, never an invented hours/day rule. */
export function suggestSchedule(
  effortDays: number | null,
  workloads: Workload[],
  rawPolicy: SchedulingPolicy,
  now = new Date(),
): Schedule {
  const policy = schedulingPolicySchema.parse(rawPolicy),
    today = ulaanbaatarDay(now);
  const result: Schedule = {
    suggestedDeadline: null,
    suggestedStart: null,
    effortDays,
    workingDays: null,
    approximate: false,
    workloadCount: workloads.length,
    explanations: [],
  };
  if (
    !policy.enabled ||
    !policy.maxParallelProjects ||
    !policy.workingDays.length ||
    !effortDays ||
    !Number.isInteger(effortDays) ||
    effortDays < 1
  )
    return {
      ...result,
      approximate: true,
      explanations: [
        "Ажлын дүрэм эсвэл ажлын хэмжээ дутуу. Дуусах хугацааг админ нягталж сонгоно.",
      ],
    };
  const parallel = policy.maxParallelProjects,
    slots = new Map<string, Set<string>>();
  const working = (day: string) =>
    policy.workingDays.includes(
      new Date(day + "T12:00:00Z").getUTCDay() || 7,
    ) && !policy.holidays.includes(day);
  const reserve = (id: string, count: number, earliest: string) => {
    let first: string | null = null,
      last: string | null = null,
      day = earliest > today ? earliest : today;
    for (let n = 0; count > 0 && n < 3660; n++, day = nextDay(day)) {
      if (!working(day)) continue;
      const occupied = slots.get(day) ?? new Set<string>();
      if (occupied.size >= parallel && !occupied.has(id)) continue;
      occupied.add(id);
      slots.set(day, occupied);
      count--;
      first ??= day;
      last = day;
    }
    return { first, last: count > 0 ? null : last };
  };
  const queue = [...workloads].sort((a, b) =>
    policy.queueStrategy === "deadline"
      ? (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999") ||
        a.receivedAt.localeCompare(b.receivedAt)
      : policy.queueStrategy === "priority"
        ? (a.priority ?? 0) - (b.priority ?? 0) ||
          a.receivedAt.localeCompare(b.receivedAt)
        : a.receivedAt.localeCompare(b.receivedAt),
  );
  for (const job of queue) {
    let remaining = job.remainingDays ?? job.effortDays;
    if (remaining === null || !Number.isFinite(remaining) || remaining < 0) {
      result.approximate = true;
      result.explanations.push(
        "Зарим ажлын үлдсэн хэмжээ тодорхойгүй; амласан огноо хүртэл хүчин чадлыг болгоомжтой нөөцөлсөн.",
      );
      if (
        job.deadline &&
        isCalendarDate(job.deadline) &&
        job.deadline >= today
      ) {
        for (
          let day = today, n = 0;
          day <= job.deadline && n < 3660;
          day = nextDay(day), n++
        ) {
          if (!working(day)) continue;
          const set = slots.get(day) ?? new Set<string>();
          for (let i = 0; i < parallel; i++) set.add(`unknown-${job.id}-${i}`);
          slots.set(day, set);
        }
        continue;
      }
      return {
        ...result,
        approximate: true,
        explanations: [
          ...result.explanations,
          "Хэмжээ, хугацаагүй идэвхтэй төсөл байна. Огноог санал болгохын өмнө админ ажлын хэмжээг тодруулна.",
        ],
      };
    }
    remaining = Math.ceil(remaining) + (job.bufferDays ?? 0);
    const slot = reserve(
      job.id,
      remaining,
      job.earliestStart && isCalendarDate(job.earliestStart)
        ? job.earliestStart
        : today,
    );
    if (remaining && !slot.last)
      return {
        ...result,
        approximate: true,
        explanations: ["Дараалал тооцоолох хязгаараас хэтэрсэн."],
      };
    if (job.deadline && slot.last && slot.last > job.deadline) {
      result.approximate = true;
      result.explanations.push(
        "Одоогийн ачааллаар өмнөх амлалтад эрсдэл байна. Өмнөх огноог өөрчлөөгүй; админ дарааллыг нягтална.",
      );
    }
  }
  const allocation = reserve(
    "new-order",
    effortDays + policy.bufferWorkingDays,
    today,
  );
  if (!allocation.last)
    return {
      ...result,
      approximate: true,
      explanations: ["Хүчин чадалд багтах огноо олдсонгүй."],
    };
  return {
    ...result,
    suggestedStart: allocation.first,
    suggestedDeadline: allocation.last,
    workingDays: effortDays + policy.bufferWorkingDays,
    explanations: [
      ...new Set([
        ...result.explanations,
        `${workloads.length} төслийн үлдсэн ажил, зэрэг ${parallel} төслийн хүчин чадал, ${policy.bufferWorkingDays} ажлын өдрийн нөөц, ${policy.queueStrategy === "fifo" ? "FIFO" : "тохируулсан"} дарааллыг тооцсон.`,
      ]),
    ],
  };
}
