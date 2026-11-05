"use client";

import { OrderPayment } from "./OrderPayment";

/** Dev preview only: the payment page with a quote, a filled bank block and placeholder values. */
export function BankPreview() {
  return <OrderPayment reference="AX-TEST0001" business="[Бизнесийн нэр]" amount={1500000} bank={{ name: "[Банк]", account: "[Дансны дугаар]", holder: "[Хүлээн авагч]" }} />;
}
