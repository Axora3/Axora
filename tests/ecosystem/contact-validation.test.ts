import { test } from "node:test";
import assert from "node:assert/strict";
import { contactError, phoneOrEmailError } from "../../src/lib/requests/validation";
import { ALL_FIELDS, checkField } from "../../src/lib/order/questions";

test("letters mixed into phone numbers are rejected consistently", () => {
  const field = ALL_FIELDS.find(f => f.id === "q4")!;
  for (const value of ["abc88001234", "8800<script>1234", "8800/1234"]) {
    assert.notEqual(contactError("phone", value), "");
    assert.notEqual(phoneOrEmailError(value), "");
    assert.notEqual(checkField(field, { q4: value }), "");
  }
});
test("formatted local/international phone numbers and valid emails remain valid", () => {
  for (const value of ["88001234", "8800 1234", "+976 (8800) 1234", "+1-202-555-0123"]) {
    assert.equal(contactError("phone", value), "");
    assert.equal(phoneOrEmailError(value), "");
  }
  assert.equal(phoneOrEmailError("бат@example.mn"), "");
});
