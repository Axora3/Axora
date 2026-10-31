export const PROJECT_STATUSES = ["planning", "in_progress", "review", "completed", "on_hold", "cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: string }> = {
  planning: { label: "Төлөвлөж байна", tone: "var(--ax-info)" },
  in_progress: { label: "Хийгдэж байна", tone: "var(--ax-success)" },
  review: { label: "Хянуулж байна", tone: "var(--ax-brand)" },
  completed: { label: "Дууссан", tone: "var(--ax-primary)" },
  on_hold: { label: "Түр зогссон", tone: "var(--ax-warn)" },
  cancelled: { label: "Цуцалсан", tone: "var(--ax-muted)" },
};

export const CONTACT_STATUSES = ["new", "answered", "closed"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS: Record<ContactStatus, { label: string; tone: string }> = {
  new: { label: "Шинэ", tone: "var(--ax-info)" },
  answered: { label: "Хариулсан гэж тэмдэглэсэн", tone: "var(--ax-success)" },
  closed: { label: "Хаасан", tone: "var(--ax-muted)" },
};

export const NOTIFICATION_TYPES: Record<string, string> = {
  new_order: "Веб захиалга",
  new_template_request: "Загварын хүсэлт",
  payment_confirmed_manual: "Төлбөр гараар баталгаажсан",
  payment_review: "Төлбөр шалгах",
  new_contact_message: "Холбоо барих",
};
