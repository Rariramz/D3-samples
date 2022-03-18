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
    visualize(wholePopulation);
    const groupedData = groupByKey(statesPopulation.data, "Slug State");
    addSelect(["usa"].concat(groupedData));
    visualize(groupedData);

    function selectHandler() {
      d3.select("body").selectAll("figure").classed("unselected", false);
      let filterState = document.getElementById("select").value;
      d3.select("body")
        .selectAll("figure")
        .data([wholePopulation].concat(groupedData))
        .filter((d) => {
          if (filterState && filterState !== "All")
            return !(d.key == filterState);
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
        .text((opt) => opt.key || "All");
    }

    function visualize(data, filterState = null, parent = "body") {
      if (Array.isArray(data)) {
        for (let state of data) {
          visualizeOne(state.key, state.values, parent);
        }
      } else {
        visualizeOne("usa", data.data, parent);
      }

      function visualizeOne(key, values, parent) {
        // ENTER
        d3.select(parent)
          .append("figure")
          .attr("id", key)
          .append("figcapture")
          .attr("class", "title")
          .text(`${key.toUpperCase()} Population`);

        d3.select(`#${key}`).append("div").attr("class", "diagram");

        d3.select(`#${key}`)
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

        d3.select(`#${key}`)
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

        d3.select(`#${key}`)
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
