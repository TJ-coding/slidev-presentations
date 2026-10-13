/*
 * diagram.js — bi-encoder: two encodings per item, scores by dot product.
 *
 * Message: the bi-encoder computes just two encodings per item — every
 * hypothesis-reference pair is then scored by ONE dot product, with no model
 * call inside the score matrix.
 */
import * as d3 from "d3";
import { theme, FONT } from "./theme.js";

export const meta = { width: 1400, height: 700, title: "Bi-encoder score matrix" };

export default function draw(svgNode, ctx) {
  const t = ctx.theme || theme(ctx.dark);
  const { width: W, height: H } = ctx;
  const svg = d3.select(svgNode);
  svg.selectAll("*").remove();

  // ---- "data": the embeddings actually shown, scores truly computed --------
  // one shared encoder => all embeddings live in the same space (dim 4 here)
  const eYhat = [ // e(ŷ_i), rows of the matrix
    [0.9, 0.1, 0.3, 0.2],
    [0.1, 0.8, 0.2, 0.1],
    [0.4, 0.5, 0.6, 0.3],
    [0.2, 0.3, 0.1, 0.9],
  ];
  const eY = [ // e(y_j), columns of the matrix
    [0.7, 0.2, 0.1, 0.05],
    [0.1, 0.3, 0.8, 0.1],
    [0.05, 0.2, 0.3, 0.85],
  ];
  const dot = (a, b) => d3.sum(d3.range(a.length), (k) => a[k] * b[k]);
  const U = eYhat.map((h) => eY.map((r) => dot(h, r)));
  const uMin = d3.min(U, (r) => d3.min(r));
  const uMax = d3.max(U, (r) => d3.max(r));

  // ---- geometry -------------------------------------------------------------
  const BW = 150, BH = 46;           // item / embedding box size
  const hypY = [120, 180, 240, 300]; // ŷ rows
  const refY = [455, 510, 565];      // y rows (clear of the bottom band)
  const encX = 250, encY = 340, encW = 180, encH = 130;
  const embX = 520;
  const mX = 740, mY = 250, CS = 64; // matrix origin + cell size
  const LM = 40;                     // left margin

  // arrow marker (defined once)
  svg.append("defs").append("marker")
    .attr("id", "arrow").attr("viewBox", "0 0 10 10")
    .attr("refX", 9).attr("refY", 5)
    .attr("markerWidth", 7).attr("markerHeight", 7)
    .attr("orient", "auto")
    .append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", t.neutral);

  const arrowPath = (x1, y1, x2, y2) => `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;

  // ---- titles ---------------------------------------------------------------
  svg.append("text")
    .attr("x", LM).attr("y", 40)
    .attr("font-family", FONT.sans).attr("font-size", 21).attr("font-weight", 700)
    .attr("fill", t.ink)
    .text("Bi-encoder: two encodings per item — pairs scored by dot product");
  svg.append("text")
    .attr("x", LM).attr("y", 68)
    .attr("font-family", FONT.sans).attr("font-size", 16)
    .attr("fill", t.inkMuted)
    .text("Every entry of u is uᵢⱼ = e(ŷᵢ) · e(yⱼ) — one scalar, no model calls inside the matrix.");

  // ---- streams: arrows first (under the boxes) -------------------------------
  const streams = svg.append("g");
  // hyp items -> encoder
  hypY.forEach((y, i) => {
    streams.append("path")
      .attr("d", arrowPath(LM + BW, y + BH / 2, encX, encY + 30 + i * 22))
      .attr("fill", "none").attr("stroke", t.neutral).attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");
  });
  // ref items -> encoder
  refY.forEach((y, i) => {
    streams.append("path")
      .attr("d", arrowPath(LM + BW, y + BH / 2, encX, encY + encH - 30 - i * 22))
      .attr("fill", "none").attr("stroke", t.neutral).attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");
  });
  // encoder -> hyp embeddings
  hypY.forEach((y) => {
    streams.append("path")
      .attr("d", arrowPath(encX + encW, encY + 45, embX, y + BH / 2))
      .attr("fill", "none").attr("stroke", t.neutral).attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");
  });
  // encoder -> ref embeddings
  refY.forEach((y) => {
    streams.append("path")
      .attr("d", arrowPath(encX + encW, encY + encH - 45, embX, y + BH / 2))
      .attr("fill", "none").attr("stroke", t.neutral).attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");
  });

  // ---- item boxes (hypotheses = blue, pseudo-references = orange) -----------
  const items = svg.append("g");
  const itemData = [
    ...hypY.map((y, i) => ({ x: LM, y, label: `ŷ${["₁", "₂", "₃", "₄"][i]}`, kind: "hyp" })),
    ...refY.map((y, i) => ({ x: LM, y, label: `y${["₁", "₂", "₃"][i]}`, kind: "ref" })),
  ];
  items.selectAll("rect.item").data(itemData).join("rect")
    .attr("x", (d) => d.x).attr("y", (d) => d.y)
    .attr("width", BW).attr("height", BH).attr("rx", 7)
    .attr("fill", (d) => (d.kind === "hyp" ? t.positiveFill : t.negativeFill))
    .attr("stroke", (d) => (d.kind === "hyp" ? t.positive : t.negative))
    .attr("stroke-width", 1.5);
  items.selectAll("text.item").data(itemData).join("text")
    .attr("x", (d) => d.x + BW / 2).attr("y", (d) => d.y + BH / 2)
    .attr("text-anchor", "middle").attr("dominant-baseline", "central")
    .attr("font-family", FONT.sans).attr("font-size", 16)
    .attr("fill", t.ink)
    .text((d) => d.label);

  // stream captions
  items.append("text")
    .attr("x", LM).attr("y", hypY[0] - 16)
    .attr("font-family", FONT.sans).attr("font-size", 15).attr("font-weight", 700)
    .attr("fill", t.positive)
    .text("hypotheses ŷᵢ");
  items.append("text")
    .attr("x", LM).attr("y", refY[0] - 16)
    .attr("font-family", FONT.sans).attr("font-size", 15).attr("font-weight", 700)
    .attr("fill", t.negative)
    .text("pseudo-references yⱼ");

  // ---- shared encoder box (the emphasis mark) --------------------------------
  const enc = svg.append("g");
  enc.append("rect")
    .attr("x", encX).attr("y", encY).attr("width", encW).attr("height", encH)
    .attr("rx", 10)
    .attr("fill", t.panel).attr("stroke", t.inkMuted).attr("stroke-width", 2);
  enc.append("text")
    .attr("x", encX + encW / 2).attr("y", encY + 52)
    .attr("text-anchor", "middle")
    .attr("font-family", FONT.sans).attr("font-size", 17).attr("font-weight", 700)
    .attr("fill", t.ink)
    .text("shared bi-encoder");
  enc.append("text")
    .attr("x", encX + encW / 2).attr("y", encY + 80)
    .attr("text-anchor", "middle")
    .attr("font-family", FONT.sans).attr("font-size", 14)
    .attr("fill", t.inkMuted)
    .text("e(·) — same weights");
  enc.append("text")
    .attr("x", encX + encW / 2).attr("y", encY + 102)
    .attr("text-anchor", "middle")
    .attr("font-family", FONT.sans).attr("font-size", 14)
    .attr("fill", t.inkMuted)
    .text("one pass per item");

  // ---- embedding boxes --------------------------------------------------------
  const embs = svg.append("g");
  const embData = [
    ...hypY.map((y, i) => ({ x: embX, y, label: `e(ŷ${["₁", "₂", "₃", "₄"][i]})`, kind: "hyp" })),
    ...refY.map((y, i) => ({ x: embX, y, label: `e(y${["₁", "₂", "₃"][i]})`, kind: "ref" })),
  ];
  embs.selectAll("rect.emb").data(embData).join("rect")
    .attr("x", (d) => d.x).attr("y", (d) => d.y)
    .attr("width", BW).attr("height", BH).attr("rx", 7)
    .attr("fill", (d) => (d.kind === "hyp" ? t.positiveFill : t.negativeFill))
    .attr("stroke", (d) => (d.kind === "hyp" ? t.positive : t.negative))
    .attr("stroke-width", 1.5);
  embs.selectAll("text.emb").data(embData).join("text")
    .attr("x", (d) => d.x + BW / 2).attr("y", (d) => d.y + BH / 2)
    .attr("text-anchor", "middle").attr("dominant-baseline", "central")
    .attr("font-family", FONT.sans).attr("font-size", 16)
    .attr("fill", t.ink)
    .text((d) => d.label);
  embs.append("text")
    .attr("x", embX).attr("y", hypY[0] - 16)
    .attr("font-family", FONT.sans).attr("font-size", 15).attr("font-weight", 700)
    .attr("fill", t.inkMuted)
    .text("embeddings (one per item)");
  embs.append("text")
    .attr("x", embX).attr("y", refY[0] - 16)
    .attr("font-family", FONT.sans).attr("font-size", 15).attr("font-weight", 700)
    .attr("fill", t.inkMuted)
    .text("embeddings (one per item)");

  // ---- "every pair" dashed arrows into the matrix -----------------------------
  const pairs = svg.append("g");
  pairs.append("path")
    .attr("d", arrowPath(embX + BW + 18, hypY[0] + BH / 2, mX - 4, mY - 6))
    .attr("fill", "none").attr("stroke", t.neutral).attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "5,4").attr("marker-end", "url(#arrow)");
  pairs.append("path")
    .attr("d", arrowPath(embX + BW + 18, refY[refY.length - 1] + BH / 2, mX + 8, mY + 4 * CS - 2))
    .attr("fill", "none").attr("stroke", t.neutral).attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "5,4").attr("marker-end", "url(#arrow)");
  pairs.append("text")
    .attr("x", mX + 20).attr("y", mY - 40)
    .attr("font-family", FONT.sans).attr("font-size", 14)
    .attr("fill", t.inkMuted)
    .text("all n × m pairs, no encoder in the loop");

  // ---- score matrix u_ij -------------------------------------------------------
  const mat = svg.append("g");
  // column headers (pseudo-references)
  eY.forEach((_, j) => {
    mat.append("text")
      .attr("x", mX + j * CS + CS / 2).attr("y", mY - 18)
      .attr("text-anchor", "middle")
      .attr("font-family", FONT.sans).attr("font-size", 15).attr("font-weight", 700)
      .attr("fill", t.negative)
      .text(`y${["₁", "₂", "₃"][j]}`);
  });
  // row labels (hypotheses)
  eYhat.forEach((_, i) => {
    mat.append("text")
      .attr("x", mX - 12).attr("y", mY + i * CS + CS / 2)
      .attr("text-anchor", "end").attr("dominant-baseline", "central")
      .attr("font-family", FONT.sans).attr("font-size", 15).attr("font-weight", 700)
      .attr("fill", t.positive)
      .text(`ŷ${["₁", "₂", "₃", "₄"][i]}`);
  });
  // cells: fill = score, border = rule; per-row max highlighted green
  const cells = [];
  U.forEach((row, i) => {
    const rowMax = d3.max(row);
    row.forEach((v, j) => cells.push({ i, j, v, max: v === rowMax }));
  });
  const cellG = mat.selectAll("g.cell").data(cells).join("g")
    .attr("transform", (d) => `translate(${mX + d.j * CS},${mY + d.i * CS})`);
  cellG.append("rect")
    .attr("width", CS - 3).attr("height", CS - 3)
    .attr("rx", 4)
    .attr("fill", (d) => d3.interpolateRgbBasis([t.panel, t.positive])(
      0.25 + 0.75 * (d.v - uMin) / (uMax - uMin)
    ))
    .attr("stroke", (d) => (d.max ? t.emphasis : t.rule))
    .attr("stroke-width", (d) => (d.max ? 2.5 : 1));
  cellG.append("text")
    .attr("x", (CS - 3) / 2).attr("y", (CS - 3) / 2)
    .attr("text-anchor", "middle").attr("dominant-baseline", "central")
    .attr("font-family", FONT.sans).attr("font-size", (d) => (d.max ? 15 : 14))
    .attr("font-weight", (d) => (d.max ? 700 : 400))
    .attr("fill", (d) => (d.v > (uMin + uMax) / 2 ? "#FFFFFF" : t.ink))
    .text((d) => d.v.toFixed(2));
  // matrix caption
  mat.append("text")
    .attr("x", mX).attr("y", mY + 4 * CS + 24)
    .attr("font-family", FONT.sans).attr("font-size", 16).attr("font-weight", 700)
    .attr("fill", t.ink)
    .text("uᵢⱼ = e(ŷᵢ) · e(yⱼ)");
  mat.append("text")
    .attr("x", mX).attr("y", mY + 4 * CS + 46)
    .attr("font-family", FONT.sans).attr("font-size", 14)
    .attr("fill", t.inkMuted)
    .text("one dot product per pair · green = row max");

  // ---- side callout: what is (and is not) in the loop --------------------------
  const cx = mX + 3 * CS + 28, cy = mY + 10, cw = W - LM - cx, chh = 140;
  mat.append("rect")
    .attr("x", cx).attr("y", cy).attr("width", cw).attr("height", chh)
    .attr("rx", 8).attr("fill", t.emphasisFill).attr("stroke", t.emphasis)
    .attr("stroke-width", 1.5);
  mat.append("text")
    .attr("x", cx + 18).attr("y", cy + 34)
    .attr("font-family", FONT.sans).attr("font-size", 17).attr("font-weight", 700)
    .attr("fill", t.ink)
    .text("No model calls inside the matrix");
  mat.append("text")
    .attr("x", cx + 18).attr("y", cy + 64)
    .attr("font-family", FONT.sans).attr("font-size", 15)
    .attr("fill", t.ink)
    .text("encoder runs: 2 per item (n + m total)");
  mat.append("text")
    .attr("x", cx + 18).attr("y", cy + 90)
    .attr("font-family", FONT.sans).attr("font-size", 15)
    .attr("fill", t.ink)
    .text("pair scoring: 1 dot product — matrix is");
  mat.append("text")
    .attr("x", cx + 18).attr("y", cy + 116)
    .attr("font-family", FONT.sans).attr("font-size", 15)
    .attr("fill", t.ink)
    .text("pure linear algebra, hostable cheaply");

  // ---- bottom takeaway band -----------------------------------------------------
  svg.append("rect")
    .attr("x", LM).attr("y", H - 76).attr("width", W - 2 * LM).attr("height", 48)
    .attr("rx", 8).attr("fill", t.lightbg ?? "#F0F4F8").attr("stroke", "none");
  svg.append("text")
    .attr("x", LM + 22).attr("y", H - 46)
    .attr("font-family", FONT.sans).attr("font-size", 16)
    .attr("fill", t.ink)
    .text("Amortised encoding, trivial scoring: the expensive model runs once per item; every uᵢⱼ after that is free.");
}
