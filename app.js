Promise.all([
  fetch("https://datausa.io/api/data?drilldowns=Nation&measures=Population")
    .then((res) => res.json())
    .catch((err) => {
      throw err;
    }),
  fetch("https://datausa.io/api/data?drilldowns=State&measures=Population")
    .then((res) => res.json())
    .catch((err) => {
      throw err;
    }),
])
  .then(([obj_0, obj_1]) => {
    visualize("usa", obj_0.data, "USA Population");
    for (let state of groupByKey(obj_1.data, "Slug State")) {
      visualize(state.key, state.values, `${state.values[0].State} Population`);
    }

    function visualize(elementId, data, title, parentSelector = "body") {
      d3.select(parentSelector)
        .append("figure")
        .attr("id", elementId)
        .append("figcapture")
        .attr("class", "title")
        .text(title);

      d3.select(`#${elementId}`).append("div").attr("class", "diagram");

      // ENTER
      d3.select(`#${elementId}`)
        .select("div.diagram")
        .selectAll("div.item")
        .data(data)
        .enter()
        .append("div")
        .attr("class", "item")
        .append("div")
        .attr("class", "data")
        .append("span");

      // UPDATE
      let scale = d3.scale
        .linear()
        .domain([0, getMaxYearsPopulation(data)])
        .range([0, 250]);

      d3.select(`#${elementId}`)
        .select("div.diagram")
        .selectAll("div.item")
        .data(data)
        .selectAll("div.data")
        .style("width", (d) => {
          return scale(d.Population) + "px";
        })
        .select("span")
        .text((d) => d.Population.toLocaleString());

      d3.select(`#${elementId}`)
        .select("div.diagram")
        .selectAll("div.item")
        .data(data)
        .append("div")
        .attr("class", "year")
        .text((d) => d.Year);

      // EXIT
      d3.select(`#${elementId}`)
        .select("div.diagram")
        .selectAll("div.item")
        .data(data)
        .exit()
        .remove();

      function getMaxYearsPopulation(years) {
        let populations = [];
        for (let year of years) {
          populations.push(year.Population);
        }
        return d3.max(populations);
      }
    }

    function groupByKey(data, key) {
      const nest = d3
        .nest()
        .key((d) => {
          return d[key];
        })
        .entries(data);
      return nest;
    }
  })
  .catch((err) => {
    d3.select("body").append("h1").attr("class", "title").text("ERROR :(");
    d3.select("body").append("h2").attr("class", "title").text(err);
  });
