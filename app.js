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
]).then(([wholePopulation, statesPopulation]) => {
  const selectorStatesPopulation = "#statesPopulation";
  const selectorYearsPopulation = "#yearsPopulation";

  const wholePopulationGrouped = groupByKey(wholePopulation.data, "Nation");
  const statesPopulationGrouped = groupByKey(statesPopulation.data, "State");
  visualizeStates(wholePopulationGrouped, selectorStatesPopulation);
  visualizeStates(statesPopulationGrouped, selectorStatesPopulation);
  const options = wholePopulationGrouped.concat(statesPopulationGrouped);
  addSelect(options);
  selectHandler();

  const statesPopulationGroupedByYear = groupByKey(
    statesPopulation.data,
    "Year"
  );
  visualizeYears(statesPopulationGroupedByYear, selectorYearsPopulation);
  yearsPopulation.addEventListener("click", (e) => {
    if (!(e.target.tagName == "BUTTON")) return;
    d3.select(selectorYearsPopulation)
      .selectAll("figure")
      .classed("unselected", false);
    let filterYear = e.target.innerHTML;
    d3.select(selectorYearsPopulation)
      .selectAll("figure")
      .data(statesPopulationGroupedByYear)
      .filter((d) => {
        if (filterYear) return !(d.key == filterYear);
        else return false;
      })
      .classed("unselected", true);
  });

  function visualizeYears(data, parent) {
    for (let year of data) {
      visualizeOne(
        year.key,
        year.values.sort((a, b) => (a.Population < b.Population ? -1 : 1)),
        parent
      );
    }

    function visualizeOne(key, values, parent) {
      keyFormatted = "_" + key.toLowerCase().replace(/\s/g, "-");

      const height = 1000;
      const width = 1200;
      const marginTop = 50;
      const marginBottom = 120;
      const marginInline = 100;
      let color = d3.scale.category10();

      d3.select(parent)
        .append("figure")
        .attr("id", keyFormatted)
        .append("figcapture")
        .attr("class", "title")
        .text(`${key} Population`);
      let diagram = d3
        .select(`#${keyFormatted}`)
        .append("div")
        .attr("class", "diagram");

      let svg = diagram
        .append("svg")
        .attr("class", "axis")
        .attr("width", width)
        .attr("height", height);

      // добавляем к оси отступы слева и справа
      let xAxisLength = width - 2 * marginInline;
      let yAxisLength = height - (marginTop + marginBottom);

      function getExtentYearsPopulations(states) {
        let populations = [];
        for (let state of states) {
          populations.push(state.Population);
        }
        return d3.extent(populations);
      }
      let scaleX = d3.scale
        .ordinal()
        .rangeRoundBands([0, xAxisLength + marginInline], 0.1)
        .domain(
          values.map((d) => {
            return d.State;
          })
        );
      let scaleY = d3.scale
        .linear()
        .domain([
          getExtentYearsPopulations(values)[0],
          getExtentYearsPopulations(values)[1],
        ])
        .range([yAxisLength, 0]);

      let xAxis = d3.svg.axis().scale(scaleX).orient("bottom");
      let yAxis = d3.svg.axis().scale(scaleY).orient("left");

      svg
        .append("g")
        .attr("class", "x-axis")
        .attr(
          "transform",
          `translate(${marginInline}, ${height - marginBottom})`
        )
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", -5)
        .style("text-anchor", "end")
        .attr("transform", "rotate(-90)");
      svg
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${marginInline}, ${marginTop})`)
        .call(yAxis);

      d3.select(parent)
        .selectAll("g.y-axis g.tick")
        .append("line")
        .classed("grid-line", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", xAxisLength)
        .attr("y2", 0);

      /* создаем объект g с набором столбиков */
      svg
        .append("g")
        .attr("transform", `translate(${marginInline}, 0)`)
        .selectAll(".bar")
        .data(values)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => {
          return scaleX(d.State);
        })
        .attr("width", scaleX.rangeBand())
        .attr("y", (d) => {
          return scaleY(d.Population);
        })
        .attr("height", (d) => {
          return height - scaleY(d.Population) - marginBottom;
        })
        .attr("fill", (d) => {
          return color(d.State);
        });
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

  function visualizeStates(data, parent = "body") {
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
      function getExtentYearsPopulations(years) {
        let populations = [];
        for (let year of years) {
          populations.push(year.Population);
        }
        return d3.extent(populations);
      }
      let scale = d3.scale
        .linear()
        .domain([
          getExtentYearsPopulations(values)[0],
          getExtentYearsPopulations(values)[1],
        ])
        .rangeRound([130, 230]);

      d3.select(`#${keyFormatted}`)
        .select("div.diagram")
        .selectAll("div.item")
        .data(values)
        .select("div.data")
        .style("min-width", (d) => {
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
});
// .catch((err) => {
//   d3.select("body").append("h1").attr("class", "title").text("ERROR :(");
//   d3.select("body").append("h2").attr("class", "title").text(err);
// });
