import "./style.css";

import * as d3 from "d3";
import { create } from "d3";

var svg = d3.select("svg");
var margins = { top: 20, bottom: 20, left: 50, right: 10 };

var svgWidth = svg.attr("width");
var svgHeight = svg.attr("height");
var chartWidth = svgWidth - margins.left - margins.right;
var chartHeight = svgHeight - margins.top - margins.bottom;
console.log("svgHeight", svgHeight);

function createScatter(data) {
   
    //  Set csv columns to use for the different dimensions
    var xKey = "2022_pop";
    var yKey = "2022_gdp_pc";
    var rKey = "2022_pop";
    var colorKey = "Region";

    // Scales
    // Get minimum and maximum values of each cvs column in the dataset
    var xMinMax = d3.extent(data, function (d) {
      return +d[xKey] || 0;
    });
    var yMinMax = d3.extent(data, function (d) {
      return +d[yKey] || 0;
    });

    console.log("Extent:", xMinMax, yMinMax);

    // Scale to map the circles on the canvas
    var xScale = d3.scaleLinear().domain(xMinMax).range([0, chartWidth]).nice();
    var yScale = d3.scaleLinear().domain(yMinMax).range([chartHeight, 0]).nice();
    
    // Set the color scales for the chart
    // Get the categorical values in the dataset
    var regions =  data.map(function(d) {return d[colorKey];});
    var uniqueRegions = [...new Set(regions)];
    // Create the color scale
    var colorScale = d3.scaleOrdinal(uniqueRegions, d3.schemeTableau10);

    svg.append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(${margins.left}, ${chartHeight + margins.top})`)
      .call(d3.axisBottom(xScale).tickSize(-1 * chartHeight));

    svg.append("g")
      .classed("y-axis", true)
      .attr("transform", `translate(${margins.left}, ${margins.top})`)
      .call(d3.axisLeft(yScale).tickSize(-1 * chartWidth));
    
      // Create a g element that contains all the circles
    var g = svg
        .append("g").attr("id", "container") // Creates a g element on the HTML qwith ID 'container'
        .style("transform", `translate(${margins.left}px, ${margins.top}px)`);

    console.log(g)

    // Create the circles and bind them to the data
    var circle = g.selectAll("circle").data(data);
    var circleEnter = circle.enter().append("circle");
    var circleUpdate = circle.merge(circleEnter);
    circleUpdate.exit().remove();

    // Update the attributes of the circles
    circleUpdate.attr("cx", function (d, i) {return xScale(d[xKey] || 0);}); 

    circleUpdate.attr("cy", function(d, i) {return yScale(d[yKey] || 0);}); 
    
    circleUpdate.attr("r", function (d, i) {return Math.sqrt(50);});
    
    circleUpdate.style("fill", function(d, i) {return colorScale(d[colorKey] || "#ededed");});
};


d3.csv("./data-wb.csv").then(function (data) {
    console.log(data);
    createScatter(data);
});