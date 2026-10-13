import * as d3 from "d3";
import { theme, FONT } from "./theme.js";

export const meta = { width: 1400, height: 700, title: "scaling" };

const NS = [8, 16, 32, 64, 128, 256];
const cross = (n) => n * n; // cross-encoder: pair n²hypotheses
const bi = (n) => 2 * n; // bi-encoder: encode queries+candidates once

export default function draw(svgNode, ctx) {
  const t = ctx.theme || theme(ctx.dark);
  const { width: W, height: H } = ctx;
  const svg = d3.select(svgNode);
  svg.selectAll("*").remove();

  // ---- geometry ------------------------------------------------------------
  const m = { top: 96, right: 250, bottom: 96, left: 130 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;

  const x = d3.scaleLog().domain([8, 256]).range([0, iw]);
  const y = d3.scaleLog().domain([10, 100000]).range([ih, 0]);

  const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

  // ---- guides / grid -------------------------------------------------------
  const yTicks = [10, 100, 1000, 10000, 100000];
  g.append("g")
    .selectAll("line.grid")
    .data(yTicks)
    .join("line")
    .attr("x1", 0)
    .attr("x2", iw)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .attr("stroke", t.grid)
    .attr("stroke-width", 1);

  // ---- axes ----------------------------------------------------------------
  const fmt = d3.format(",");
  g.append("g")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickValues(NS).tickSizeOuter(0))
    .call((s) => s.select(".domain").attr("stroke", t.rule))
    .call((s) => s.selectAll("line").attr("stroke", t.rule))
    .call((s) =>
      s
        .selectAll("text")
        .attr("fill", t.inkMuted)
        .attr("font-family", FONT.sans)
        .attr("font-size", 17)
    );

  g.append("g")
    .call(d3.axisLeft(y).tickValues(yTicks).tickSizeOuter(0).tickFormat(fmt))
    .call((s) => s.select(".domain").remove())
    .call((s) => s.selectAll("line").attr("stroke", t.grid))
    .call((s) =>
      s
        .selectAll("text")
        .attr("fill", t.inkMuted)
        .attr("font-family", FONT.sans)
        .attr("font-size", 17)
    );

  // axis titles
  g.append("text")
    .attr("x", iw / 2)
    .attr("y", ih + 62)
    .attr("text-anchor", "middle")
    .attr("font-family", FONT.sans)
    .attr("font-size", 19)
    .attr("fill", t.ink)
    .text("Number of hypotheses n (log scale)");

  g.append("text")
    .attr("transform", `translate(${-92},${ih / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("font-family", FONT.sans)
    .attr("font-size", 19)
    .attr("fill", t.ink)
    .text("Scoring calls (log scale)");

  // ---- curves --------------------------------------------------------------
  const pts = (fn) => NS.map((n) => [x(n), y(fn(n))]);
  const line = d3.line().curve(d3.curveMonotoneX);

  // bi-encoder: linear, blue, solid (the advocated approach)
  g.append("path")
    .datum(pts(bi))
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", t.positive)
    .attr("stroke-width", 3.5);

  // cross-encoder: quadratic, orange, dashed (the contrast)
  g.append("path")
    .datum(pts(cross))
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", t.negative)
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", "9 6");

  // ---- end-of-line labels (right side, clear of data) ----------------------
  const endLabels = [
    { label: "Cross-encoder (n²)", val: cross(256), color: t.negative, dash: "9 6" },
    { label: "Bi-encoder (2n)", val: bi(256), color: t.positive, dash: null },
  ];
  endLabels.forEach((d, i) => {
    const ey = y(d.val);
    // pigtail connector from curve end to label
    g.append("path")
      .attr(
        "d",
        `M${x(256)},${y(d.val)} h 22 q 14,0 14,-14 v -${i === 0 ? 16 : 40}`
      )
      .attr("fill", "none")
      .attr("stroke", d.color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", d.dash);
    g.append("text")
      .attr("x", x(256) + 46)
      .attr("y", ey - (i === 0 ? 38 : 62) + 24)
      .attr("font-family", FONT.sans)
      .attr("font-size", 20)
      .attr("font-weight", 700)
      .attr("fill", d.color)
      .text(d.label);
  });

  // ---- n = 128 highlight ---------------------------------------------------
  const hx = x(128);
  g.append("line")
    .attr("x1", hx)
    .attr("x2", hx)
    .attr("y1", y(cross(128)) - 14)
    .attr("y2", y(bi(128)))
    .attr("stroke", t.neutral)
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4 4");

  // markers
  g.append("circle")
    .attr("cx", hx)
    .attr("cy", y(cross(128)))
    .attr("r", 7)
    .attr("fill", t.negative)
    .attr("stroke", "white")
    .attr("stroke-width", 2.5);
  g.append("circle")
    .attr("cx", hx)
    .attr("cy", y(bi(128)))
    .attr("r", 7)
    .attr("fill", t.positive)
    .attr("stroke", "white")
    .attr("stroke-width", 2.5);

  // "64×" tag on the vertical gap
  const gapY = (y(cross(128)) + y(bi(128))) / 2;
  g.append("text")
    .attr("x", hx - 10)
    .attr("y", gapY + 7)
    .attr("text-anchor", "end")
    .attr("font-family", FONT.sans)
    .attr("font-size", 22)
    .attr("font-weight", 700)
    .attr("fill", t.ink)
    .text("64×");

  // callout card — in the empty band between the two curves, right of n=128
  const cw = 430,
    ch = 92,
    cx = 572,
    cy = 202;
  g.append("rect")
    .attr("x", cx)
    .attr("y", cy)
    .attr("width", cw)
    .attr("height", ch)
    .attr("rx", 10)
    .attr("fill", t.panel)
    .attr("stroke", t.positive)
    .attr("stroke-width", 2);
  const card = g
    .append("text")
    .attr("x", cx + 20)
    .attr("y", cy + 32)
    .attr("font-family", FONT.sans)
    .attr("font-size", 19)
    .attr("fill", t.ink);
  card.append("tspan").attr("font-weight", 700).text("n = 128");
  card.append("tspan").text("  ·  cross-encoder ");
  card.append("tspan").attr("font-weight", 700).attr("fill", t.negative).text("16,384");
  card.append("tspan").text(" calls");
  card
    .append("tspan")
    .attr("x", cx + 20)
    .attr("dy", 1.35 * 19)
    .text("           bi-encoder ");
  card.append("tspan").attr("font-weight", 700).attr("fill", t.positive).text("256");
  card.append("tspan").text(" calls — 64× fewer");

  // ---- title ----------------------------------------------------------------
  svg
    .append("text")
    .attr("x", m.left)
    .attr("y", 40)
    .attr("font-family", FONT.sans)
    .attr("font-size", 28)
    .attr("font-weight", 700)
    .attr("fill", t.ink)
    .text("Reranking cost: the cross-encoder incurs n² calls; the bi-encoder stays linear");
  svg
    .append("text")
    .attr("x", m.left)
    .attr("y", 70)
    .attr("font-family", FONT.sans)
    .attr("font-size", 20)
    .attr("fill", t.inkMuted)
    .text("Scoring calls needed as the hypothesis set grows");
}
