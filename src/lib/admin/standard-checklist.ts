import "server-only";
import { createHash } from "node:crypto";

const TITLES = ["Анкетыг шалгах", "Захиалагчтай холбогдох", "Үнийн санал илгээх", "Дизайн батлуулах", "Веб сайт хөгжүүлэх", "Домэйн холбох", "Шалгаж хүлээлгэн өгөх"];

/** UUID v5 in the project's UUID namespace. Identical concurrent inserts
 * collide on the existing primary key rather than duplicating the checklist. */
export function standardChecklist(projectId: string) {
  return TITLES.map((title, index) => {
    const bytes = createHash("sha1").update(Buffer.from(projectId.replaceAll("-", ""), "hex")).update(`axora-standard-checklist:${index}`).digest().subarray(0, 16);
    bytes[6] = (bytes[6] & 0x0f) | 0x50;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString("hex");
    const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    return { id, project_id: projectId, title, sort_order: (index + 1) * 10 };
  });
}
