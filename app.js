d3.json(
  "https://datausa.io/api/data?drilldowns=Nation&measures=Population",
  (err, data) => {
    console.log(data);
    visualize(data.data);
  }
);

function visualize(data) {
  // ENTER
  d3.select("div.diagram")
    .selectAll("div.item")
    .data(data)
    .enter()
    .append("div")
    .attr("class", "item")
    .append("div")
    .attr("class", "data")
    .append("span");

  // UPDATE
  d3.select("div.diagram")
    .selectAll("div.item")
    .data(data)
    .selectAll("div.data")
    .style("width", (d) => {
      return d.Population / 1000000 + "px";
    })
    .select("span")
    .text((d) => d.Population.toLocaleString());
  d3.select("div.diagram")
    .selectAll("div.item")
    .data(data)
    .append("div")
    .attr("class", "year")
    .text((d) => d.Year);

  // EXIT
  d3.select("div.diagram").selectAll("div.item").data(data).exit().remove();
}
