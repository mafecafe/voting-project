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
console.log(svg);

function createScatter(data) {
   
    //  Set csv columns to use for the different dimensions
    var xKey = "freedom_score";
    var rKey = "population";
    var colorKey = "freedom_status";

    // Scales
    // Get minimum and maximum values of each cvs column in the dataset
    var xMinMax = d3.extent(data, function (d) {
      return +d[xKey] || 0;
    });
    var rMinMax = d3.extent(data, function (d) {
      return +d[rKey] || 0;
    });

    console.log("Extent:", xMinMax);

    // Scale to map the circles on the canvas
    var xScale = d3.scaleLinear().domain(xMinMax).range([0, chartWidth]).nice();

    var rScale = d3.scaleLinear().domain(rMinMax).range([5, 100])
    
    // Set the color scales for the chart
    // Get the categorical values in the dataset
    var categories =  data.map(function(d) {return d[colorKey];});
    var uniqueCategories = [...new Set(categories)];
    // Create the color scale
    var colorScale = d3.scaleOrdinal(uniqueCategories, d3.schemeTableau10);

    svg.append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(${margins.left}, ${chartHeight + margins.top})`)
      .call(d3.axisBottom(xScale).tickSize(-1 * chartHeight));

    
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

    circleUpdate.attr("cy", function(d, i) {return 200;}); 
    
    circleUpdate.attr("r", function (d, i) {return rScale(d[rKey] || 0);});
    
    circleUpdate.style("fill", function(d, i) {return colorScale(d[colorKey] || "#ededed");});

    circleUpdate.style("fill-opacity", 0.5);
};


d3.csv("./data-voting.csv").then(function (data) {
    console.log(data);
    createScatter(data);
});