import * as d3 from "d3";

const statusColors = {
  Free: "#44bba4",
  "Partly Free": "#f4a93b",
  "Not Free": "#e8545a",
};

function barColor(d) {
  if (!d.has_election) return "#ddd";
  return statusColors[d.freedom_status] || "#ccc";
}

// Geometry presets
const modes = {
  semi: {
    angleRange: [-Math.PI / 2, Math.PI / 2],
    innerRadius: 40,
    outerRadius: 260,
    labelMargin: 90,
    viewBox(or, lm) {
      const w = (or + lm) * 2;
      const h = or + lm + 30;
      return [-(w / 2), -(or + lm), w, h];
    },
    gridArc: (startA, endA) => [startA, endA],
    labelFlip: (a) => a < 0,
    labelAnchor: (a) => (a < 0 ? "end" : "start"),
  },
  full: {
    angleRange: [0, 2 * Math.PI],
    innerRadius: 80,
    outerRadius: 265,
    labelMargin: 90,
    viewBox(or, lm) {
      const s = (or + lm) * 2;
      return [-(s / 2), -(s / 2), s, s];
    },
    gridArc: () => [0, 2 * Math.PI],
    labelFlip: (a) => a >= Math.PI,
    labelAnchor: (a) => (a < Math.PI ? "start" : "end"),
  },
};

let cachedData = null;
let tooltip = null;

export default function radialChart(mode = "semi") {
  const cfg = modes[mode];
  const { innerRadius, outerRadius, labelMargin } = cfg;

  const svg = d3
    .select(".poster-chart svg")
    .attr("viewBox", cfg.viewBox(outerRadius, labelMargin))
    .style("font-family", "'Inter', sans-serif");

  // Clear previous render
  svg.selectAll("*").remove();

  // Shared tooltip (create once)
  if (!tooltip) {
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  if (cachedData) {
    render(svg, cachedData, cfg);
    return;
  }

  d3.csv("./data-radial.csv").then((raw) => {
    cachedData = raw
      .map((d) => ({
        country: d.country,
        iso: d.iso,
        region: d.region,
        internet_pct: +d.internet_pct,
        has_election: d.has_election === "TRUE",
        freedom_status: d.freedom_status,
        election_type: d.election_type,
      }))
      .filter((d) => d.internet_pct > 0)
      .sort((a, b) => a.internet_pct - b.internet_pct);

    render(svg, cachedData, cfg);
  });
}

function render(svg, data, cfg) {
  const { innerRadius, outerRadius } = cfg;
  const barWidth = 2.5;

  const angle = d3
    .scaleBand()
    .domain(data.map((d) => d.iso))
    .range(cfg.angleRange)
    .padding(0.08);

  const y = d3.scaleRadial().domain([0, 100]).range([innerRadius, outerRadius]);

  // --- Gridlines ---
  const gridTicks = [25, 50, 75, 100];
  const [arcStart, arcEnd] = cfg.gridArc(...cfg.angleRange);

  const gridArc = d3
    .arc()
    .innerRadius((d) => y(d) - 0.2)
    .outerRadius((d) => y(d) + 0.2)
    .startAngle(arcStart)
    .endAngle(arcEnd);

  svg
    .append("g")
    .selectAll("path")
    .data(gridTicks)
    .join("path")
    .attr("d", gridArc)
    .attr("fill", "none")
    .attr("stroke", "#e8e5de")
    .attr("stroke-width", 0.5);

  // Grid labels
  svg
    .append("g")
    .selectAll("text")
    .data(gridTicks)
    .join("text")
    .attr("x", arcStart === 0 ? 0 : -8)
    .attr("y", (d) => -y(d))
    .attr("text-anchor", arcStart === 0 ? "middle" : "end")
    .attr("dy", arcStart === 0 ? -3 : "0.35em")
    .attr("fill", "#c0bab0")
    .attr("font-size", "8px")
    .text((d) => d + "%");

  // Inner baseline arc
  const baseArc = d3
    .arc()
    .innerRadius(innerRadius - 0.2)
    .outerRadius(innerRadius + 0.2)
    .startAngle(arcStart)
    .endAngle(arcEnd);

  svg.append("path").attr("d", baseArc()).attr("fill", "#e8e5de");

  // --- Bars ---
  const bars = svg
    .append("g")
    .selectAll("line")
    .data(data)
    .join("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", (d) => -(y(d.internet_pct) - innerRadius))
    .attr("transform", (d) => {
      const a = angle(d.iso) + angle.bandwidth() / 2;
      return `rotate(${(a * 180) / Math.PI}) translate(0,${-innerRadius})`;
    })
    .attr("stroke", barColor)
    .attr("stroke-width", barWidth)
    .attr("stroke-linecap", "round")
    .attr("opacity", (d) => (d.has_election ? 0.9 : 0.2))
    .style("cursor", "pointer");

  // --- Tooltip ---
  function showTip(event, d) {
    const e = event.touches ? event.touches[0] : event;
    d3.select(event.currentTarget).attr("stroke-width", 5).attr("opacity", 1);

    let html = `<strong>${d.country}</strong><br>Internet: ${d.internet_pct}%`;
    if (d.has_election) {
      html += `<br>Election: ${d.election_type}`;
      if (d.freedom_status) html += `<br>Status: ${d.freedom_status}`;
    }

    tooltip
      .html(html)
      .style("left", e.pageX + 14 + "px")
      .style("top", e.pageY - 14 + "px")
      .transition()
      .duration(100)
      .style("opacity", 1);
  }

  function moveTip(event) {
    const e = event.touches ? event.touches[0] : event;
    tooltip.style("left", e.pageX + 14 + "px").style("top", e.pageY - 14 + "px");
  }

  function hideTip(event, d) {
    d3.select(event.currentTarget)
      .attr("stroke-width", barWidth)
      .attr("opacity", d.has_election ? 0.9 : 0.2);
    tooltip.transition().duration(120).style("opacity", 0);
  }

  bars
    .on("mouseenter", showTip)
    .on("mousemove", moveTip)
    .on("mouseleave", hideTip)
    .on("touchstart", (event, d) => {
      event.preventDefault();
      showTip(event, d);
    })
    .on("touchend", hideTip);

  // --- Labels (election countries only) ---
  svg
    .append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(data.filter((d) => d.has_election))
    .join("text")
    .attr("text-anchor", (d) => {
      const a = angle(d.iso) + angle.bandwidth() / 2;
      return cfg.labelAnchor(a);
    })
    .attr("transform", (d) => {
      const a = angle(d.iso) + angle.bandwidth() / 2;
      const r = y(d.internet_pct) + 5;
      const deg = (a * 180) / Math.PI - 90;
      const flip = cfg.labelFlip(a);
      return `rotate(${deg}) translate(${r},0) rotate(${flip ? 180 : 0})`;
    })
    .attr("fill", "#aaa")
    .attr("font-size", "7px")
    .attr("font-weight", 400)
    .attr("dy", "0.35em")
    .text((d) => d.country);
}
