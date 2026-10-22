import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "/Users/idris/Documents/ChatGPT/Hackathon Accel AI";
const buildDir = path.join(workspaceDir, ".codex-build/foxhound-pitch");
const outputDir = path.join(workspaceDir, "output");
const skillDir = "/Users/idris/.codex/plugins/cache/openai-primary-runtime/presentations/26.1020.11127/skills/presentations";
const finalPath = path.join(outputDir, "foxhound-one-slide-pitch-final.pptx");
const pythonExecutable = "/Users/idris/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = deck.slides.add();
slide.background.fill = "#09111F";

function box({ x, y, w, h, fill = "none", line = "none", radius = "rounded-lg", name }) {
  return slide.shapes.add({
    geometry: "roundRect",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: line === "none" ? 0 : 1 },
    borderRadius: radius,
  });
}

function textBox(text, { x, y, w, h, size = 20, color = "#F8FAFC", bold = false, font = "Arial", align = "left", name }) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = { fontFamily: font, fontSize: size, bold, color, alignment: align };
  return shape;
}

textBox("FOXHOUND", { x: 64, y: 42, w: 180, h: 26, size: 14, bold: true, color: "#FB923C", name: "brand" });
textBox("Customer feedback, prioritized for founders", { x: 64, y: 74, w: 900, h: 58, size: 38, bold: true, name: "title" });
textBox("From raw comments to clear product decisions", { x: 66, y: 137, w: 720, h: 32, size: 20, color: "#A8B3C7", name: "subtitle" });
box({ x: 1044, y: 48, w: 172, h: 36, fill: "#FB923C", line: "#FB923C", name: "pitch-tag" });
textBox("ONE-SLIDE PITCH", { x: 1056, y: 57, w: 148, h: 20, size: 12, bold: true, color: "#09111F", align: "center", name: "pitch-tag-text" });

// Before and after evidence.
textBox("BEFORE", { x: 64, y: 205, w: 130, h: 26, size: 15, bold: true, color: "#FB923C", name: "before-label" });
textBox("A chronological inbox", { x: 64, y: 238, w: 300, h: 34, size: 25, bold: true, name: "before-title" });
textBox("“The dashboard is slow.”\n\n“Can I export to CSV?”\n\n“Please add dark mode.”", { x: 64, y: 288, w: 305, h: 150, size: 19, color: "#CBD5E1", name: "raw-feedback" });
textBox("Every comment requires manual review. Related signals remain separated.", { x: 64, y: 454, w: 315, h: 72, size: 17, color: "#8391A8", name: "baseline" });

// Data layer.
box({ x: 405, y: 196, w: 466, h: 400, fill: "#101C30", line: "#263853", name: "data-layer" });
textBox("THE DATA LAYER IN ACTION", { x: 435, y: 220, w: 390, h: 24, size: 14, bold: true, color: "#FB923C", name: "data-label" });
textBox("The same batch becomes structured evidence", { x: 435, y: 253, w: 390, h: 60, size: 27, bold: true, name: "data-title" });

const steps = [
  ["01", "PostgreSQL", "Raw feedback stays stored"],
  ["02", "Data", "Clean, normalize, validate"],
  ["03", "AI", "Cluster, summarize, score"],
  ["04", "Dashboard", "Ranked themes for review"],
];
steps.forEach(([number, label, detail], index) => {
  const y = 334 + index * 46;
  textBox(number, { x: 435, y, w: 42, h: 24, size: 14, bold: true, color: "#FB923C", name: `step-${number}` });
  textBox(label, { x: 486, y: y - 2, w: 146, h: 27, size: 17, bold: true, name: `step-label-${number}` });
  textBox(detail, { x: 637, y, w: 196, h: 24, size: 14, color: "#A8B3C7", name: `step-detail-${number}` });
});
textBox("Evidence: every feedback ID must appear exactly once. Invalid service responses are rejected, and raw submissions survive downstream failures.", { x: 435, y: 523, w: 398, h: 58, size: 14, color: "#DDE5F0", name: "evidence" });

// Audience, timing, and acquisition.
textBox("WHO", { x: 912, y: 205, w: 100, h: 22, size: 14, bold: true, color: "#FB923C", name: "who-label" });
textBox("Founder-led SaaS teams drowning in scattered customer feedback", { x: 912, y: 234, w: 304, h: 78, size: 23, bold: true, name: "who-copy" });

textBox("WHY NOW", { x: 912, y: 337, w: 120, h: 22, size: 14, bold: true, color: "#FB923C", name: "why-label" });
textBox("AI makes analysis affordable. Structured data and explainable scoring make the output usable.", { x: 912, y: 366, w: 304, h: 76, size: 18, color: "#CBD5E1", name: "why-copy" });

textBox("FIRST USERS", { x: 912, y: 469, w: 140, h: 22, size: 14, bold: true, color: "#FB923C", name: "gtm-label" });
textBox("Recruit 5 SaaS founders through accelerators and founder communities. Import their latest feedback, then run weekly review sessions.", { x: 912, y: 498, w: 304, h: 92, size: 18, color: "#CBD5E1", name: "gtm-copy" });

box({ x: 64, y: 616, w: 1152, h: 2, fill: "#263853", line: "#263853", radius: "rounded-none", name: "footer-rule" });
textBox("Foxhound turns raw customer feedback into clear, prioritized insights founders can act on.", { x: 64, y: 638, w: 920, h: 34, size: 22, bold: true, name: "pitch-line" });
textBox("Go-to-market plan is proposed", { x: 996, y: 646, w: 220, h: 22, size: 12, color: "#718096", align: "right", name: "disclosure" });

const preview = await deck.export({ slide, format: "png", scale: 1 });
await fs.writeFile(path.join(buildDir, "slide-01.png"), new Uint8Array(await preview.arrayBuffer()));

const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, "container_tools/artifact_tool_utils.mjs")).href);
const candidatePath = path.join(buildDir, "candidate.pptx");
await (await PresentationFile.exportPptx(deck)).save(candidatePath);
const result = await finalizePresentation({
  explicitTotalSlideCount: 1,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable,
  integrityValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: ["Aptos"] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, "validation-final.json"),
});
console.log(JSON.stringify(result));
