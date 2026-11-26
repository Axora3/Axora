import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOrderDraft, readOrderDraft } from "../../src/lib/order/draft";

const draft = { v: 1, answers: { q1: "Бат", q39: true }, step: 2, maxStep: 3, showLinks: false, idemKey: "00000000-0000-4000-8000-000000000001", builderSig: "", fileNames: ["лого.png"] };
test("order drafts restore valid Cyrillic data but never restore consent", () => {
  const result = parseOrderDraft(draft);
  assert.equal(result?.answers.q1, "Бат");
  assert.equal(result?.answers.q39, undefined);
  assert.equal(draft.answers.q39, true);
  assert.deepEqual(result?.fileNames, ["лого.png"]);
});
test("damaged draft shapes and unsafe steps are rejected", () => {
  for (const raw of [{ v: 1, answers: {} }, { ...draft, step: -1 }, { ...draft, step: 200 }, { ...draft, step: NaN }, { ...draft, fileNames: null }, { ...draft, answers: { q1: {} } }, { ...draft, idemKey: "bad" }]) assert.equal(parseOrderDraft(raw), null);
});
test("blocked storage getters and malformed JSON leave a usable empty form", () => {
  assert.equal(readOrderDraft(() => { throw new Error("blocked"); }, "draft"), null);
  assert.equal(readOrderDraft(() => ({ getItem: () => "{" }), "draft"), null);
});
