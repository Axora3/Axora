import { EcosystemProcessor } from "../src/lib/ecosystem/processor";
import { safeCode } from "../src/lib/ecosystem/security";
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});
const once = process.argv.includes("--once");
async function main() {
  do {
    try {
      const result = await new EcosystemProcessor().tick();
      console.log(JSON.stringify(result));
      if (!result.processed && !once)
        await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (e) {
      console.error(JSON.stringify({ code: safeCode(e) }));
      if (once) process.exitCode = 1;
      else await new Promise((resolve) => setTimeout(resolve, 15000));
    }
  } while (!once && !stopping);
}
void main().catch((e) => {
  console.error(JSON.stringify({ code: safeCode(e) }));
  process.exitCode = 1;
});
