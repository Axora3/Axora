import { fixture } from "./service-fixture";
void fixture(43234)
  .then((f) => {
    console.log("Synthetic ecosystem service fixture listening at " + f.base);
    const stop = () => {
      void f.close().then(() => process.exit(0));
    };
    process.on("SIGTERM", stop);
    process.on("SIGINT", stop);
  })
  .catch(() => {
    console.error("Fixture startup failed");
    process.exitCode = 1;
  });
