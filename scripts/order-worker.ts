import { flushOrderEmails } from "../src/lib/order-workflow/email";
import { recoverPendingQuotations } from "../src/lib/order-workflow/recovery";
async function run() {
  const quotations = await recoverPendingQuotations(10);
  return { quotations, ...(await flushOrderEmails(10)) };
}
run()
  .then(console.log)
  .catch(() => {
    console.error("Order email worker failed");
    process.exitCode = 1;
  });
