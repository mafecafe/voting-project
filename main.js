import "./style.css";

//import beeswarm from "./beeswarm_layout";
//beeswarm()

// import dotstrip from "./dotstrip_layout";
// dotstrip()

// import circularLayout from "./circular_layout";
// circularLayout()

import radialChart from "./radial_chart";
radialChart("semi");

document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    radialChart(btn.dataset.mode);
  });
});
