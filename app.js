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
  .then(([wholePopulation, statesPopulation]) => {
    const wholePopulationGrouped = groupByKey(wholePopulation.data, "Nation");
    const statesPopulationGrouped = groupByKey(statesPopulation.data, "State");
    visualize(wholePopulationGrouped);
    visualize(statesPopulationGrouped);
    const options = wholePopulationGrouped.concat(statesPopulationGrouped);
    addSelect(options);
    selectHandler();

    function selectHandler() {
      d3.select("body").selectAll("figure").classed("unselected", false);
      let filterState = document.getElementById("select").value;
      d3.select("body")
        .selectAll("figure")
        .data(options)
        .filter((d) => {
          if (filterState) return !(d.key == filterState);
          else return false;
        })
        .classed("unselected", true);
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

    function addSelect(options) {
      d3.select("select")
        .on("change", () => selectHandler())
        .selectAll("option")
        .data(options)
        .enter()
        .append("option");
      d3.select("select")
        .selectAll("option")
        .data(options)
        .text((opt) => opt.key);
    }

    function visualize(data, parent = "body") {
      for (let state of data) {
        visualizeOne(state.key, state.values, parent);
      }

      function visualizeOne(key, values, parent) {
        keyFormatted = key.toLowerCase().replace(/\s/g, "-");

        // ENTER
        d3.select(parent)
          .append("figure")
          .attr("id", keyFormatted)
          .append("figcapture")
          .attr("class", "title")
          .text(`${key} Population`);

        d3.select(`#${keyFormatted}`).append("div").attr("class", "diagram");

        d3.select(`#${keyFormatted}`)
          .select("div.diagram")
          .selectAll("div.item")
          .data(values)
          .enter()
          .append("div")
          .attr("class", "item")
          .append("div")
          .attr("class", "data")
          .append("span");

        // UPDATE
        function getMaxYearsPopulation(years) {
          let populations = [];
          for (let year of years) {
            populations.push(year.Population);
          }
          //console.log(d3.max(populations));
          return d3.max(populations);
        }
        let scale = d3.scale
          .linear()
          .domain([0, getMaxYearsPopulation(values)])
          .range([0, 250]);

        d3.select(`#${keyFormatted}`)
          .select("div.diagram")
          .selectAll("div.item")
          .data(values)
          .select("div.data")
          .style("width", (d) => {
            return scale(d.Population) + "px";
          })
          .select("span")
          .text((d) => {
            return d.Population.toLocaleString();
          });

        d3.select(`#${keyFormatted}`)
          .select("div.diagram")
          .selectAll("div.item")
          .data(values)
          .append("div")
          .attr("class", "year")
          .text((d) => d.Year);
      }
    }
  })
  .catch((err) => {
    d3.select("body").append("h1").attr("class", "title").text("ERROR :(");
    d3.select("body").append("h2").attr("class", "title").text(err);
  });
