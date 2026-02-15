import * as d3 from "d3";
import BeeswarmForce from "./beeswarm_force";

export default function beeswarm() {
    var svg = d3.select("svg");
    var margins = { top: 50, bottom: 50, left: 50, right: 10 };

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

        var rScale = d3.scaleLinear().domain(rMinMax).range([10, 200])

        // Set the color scales for the chart
        // Get the categorical values in the dataset
        var categories = data.map(function (d) { return d[colorKey]; });
        var uniqueCategories = [...new Set(categories)];
        // Create the color scale
        var colorScale = d3.scaleOrdinal(uniqueCategories, d3.schemeTableau10);

        // svg.append("g")
        //   .classed("x-axis", true)
        //   .attr("transform", `translate(${margins.left}, ${chartHeight + margins.top})`)
        //   .call(d3.axisBottom(xScale).tickSize(-1 * chartHeight));


        // Create a g element that contains all the circles
        var g = svg
            .append("g").attr("id", "container") // Creates a g element on the HTML qwith ID 'container'
            .style("transform", `translate(${margins.left}px, ${margins.top}px)`);

        console.log(g)

        const beeswarmLayout = BeeswarmForce()
            //.x((d) => xScale(d[xKey]))
            .x((d) => chartWidth / 2)
            .y(chartHeight / 2)
            .r((d) => 1 + rScale(d[rKey]));
        const beeswarm = beeswarmLayout(data);

        console.log(beeswarm);

        // Create the circles and bind them to the data
        var circle = g.selectAll("circle").data(beeswarm);
        var circleEnter = circle.enter().append("circle");
        var circleUpdate = circle.merge(circleEnter);
        circleUpdate.exit().remove();

        // Update the attributes of the circles
        circleUpdate.attr("cx", function (d, i) { return d.x }); //xScale(d[xKey] || 0);}); 

        circleUpdate.attr("cy", function (d, i) { return d.y }); // 200;}); 

        circleUpdate.attr("r", function (d, i) { return rScale(d.data[rKey] || 0); });

        circleUpdate.style("fill", function (d, i) { return colorScale(d.data[colorKey] || "#ededed"); });

        circleUpdate.style("fill-opacity", 0.5);

        circleUpdate.style("stroke", function (d, i) { return colorScale(d.data[colorKey] || "#ededed"); });

        circleUpdate.style("stroke-width", 1);
    };


    d3.csv("./data-voting.csv").then(function (data) {
        console.log(data);
        createScatter(data);
    });
}