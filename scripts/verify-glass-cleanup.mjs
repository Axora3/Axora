import { chromium, firefox, webkit } from "@playwright/test";
import fs from "node:fs/promises";

const output = "artifacts/glass-cleanup";
await fs.mkdir(output, { recursive: true });
const results = [];
const availability = [];
for (const [name, engine] of [["chrome", chromium], ["firefox", firefox], ["webkit", webkit]]) {
  let browser;
  try { browser = await engine.launch(name === "chrome" ? { channel: "chrome" } : {}); }
  catch { availability.push({ name, available: false, reason: "Browser executable unavailable; no browser installed by this check." }); continue; }
  availability.push({ name, available: true });
  for (const width of [320,360,375,390,430,768,1024,1440,1920]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://localhost:43111/", { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const inspect = () => {
      const header = document.querySelector(".ax-site-header");
      const dock = document.querySelector(".ax-mobile-dock");
      const h = header.getBoundingClientRect();
      const d = dock.getBoundingClientRect();
      const css = getComputedStyle(dock);
      return { headerTop: h.top, headerLeft: h.left, headerRadius: getComputedStyle(header).borderRadius,
        dockVisible: css.display !== "none", dockBottom: innerHeight-d.bottom, dockLeft:d.left, dockHeight:d.height, dockRadius:css.borderRadius,
        bodyPaddingBottom:getComputedStyle(document.body).paddingBottom,
        overflow:document.documentElement.scrollWidth>innerWidth,
        links:[...dock.querySelectorAll("a")].map(a=>a.getAttribute("href")), active:dock.querySelector('[aria-current="page"]')?.getAttribute("href"),
        dotOverlay:getComputedStyle(document.querySelector(".ax-global-background")).backgroundImage };
    };
    const top = await page.evaluate(inspect);
    await page.screenshot({ path: `${output}/${name}-${width}-top.png` });
    await page.evaluate(() => window.scrollTo(0,document.documentElement.scrollHeight));
    const bottom = await page.evaluate(inspect);
    await page.screenshot({ path: `${output}/${name}-${width}-footer.png` });
    const passed = !top.overflow && !bottom.overflow && top.headerTop >= 10 && bottom.headerTop >= 10 && top.bodyPaddingBottom === "0px" &&
      (!top.dockVisible || (top.dockBottom >= 8 && top.dockBottom <= 12 && top.dockLeft >= 12 && top.dockHeight === 68 && top.dockRadius === "28px")) && errors.length === 0;
    results.push({ name,width,top,bottom,errors,passed });
    if (width === 390) {
      await page.evaluate(() => window.scrollTo(0,0));
      await page.getByRole("button", { name: "Цэс нээх", exact:true }).click();
      await page.getByRole("dialog", { name: "Цэс", exact:true }).waitFor();
      await page.screenshot({ path:`${output}/${name}-menu.png` });
      await page.keyboard.press("Escape");
      await page.getByRole("dialog", { name:"Цэс", exact:true }).waitFor({ state:"detached" });
      await page.getByRole("navigation", { name:"Доод цэс" }).getByRole("link", { name:"Загварууд" }).click();
      await page.waitForURL("**/templates");
      await page.getByRole("navigation", { name:"Доод цэс" }).locator('a[aria-current="page"][href="/templates"]').waitFor();
    }
    await page.close();
  }
  await browser.close();
}
await fs.writeFile(`${output}/results.json`,JSON.stringify({ availability,results },null,2));
console.log(JSON.stringify({ availability,checks:results.length,failures:results.filter(r=>!r.passed) },null,2));
if(results.some(r=>!r.passed)) process.exitCode=1;
