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
  fetch(
    "https://datausa.io/api/data?drilldowns=State&measures=Population&year=latest"
  )
    .then((res) => res.json())
    .catch((err) => {
      throw err;
    }),
])
  .then(([wholePopulation, statesPopulation, lastYearPopulation]) => {
    const selectorStatesPopulation = "#statesPopulation";
    const selectorYearsPopulation = "#yearsPopulation";
    const selectorPieChart = "#pieChart";

    const wholePopulationGrouped = groupByKey(wholePopulation.data, "Nation");
    const statesPopulationGrouped = groupByKey(statesPopulation.data, "State");
    visualizeStates(wholePopulationGrouped, selectorStatesPopulation);
    visualizeStates(statesPopulationGrouped, selectorStatesPopulation);
    const options = wholePopulationGrouped.concat(statesPopulationGrouped);
    addSelect(options);
    selectHandler();

    const lastYearPopulationGroupedByState = groupByKey(
      lastYearPopulation.data,
      "State"
    );
    visualizePie(lastYearPopulationGroupedByState, selectorPieChart);

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
        const marginBlock = 50;
        const marginLeft = 150;
        const marginRight = 50;
        let color = d3.scale.category10();
        const multiplier = 1000000;

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
        let xAxisLength = width - (marginLeft + marginRight);
        let yAxisLength = height - 2 * marginBlock;

        function getExtentYearsPopulations(states) {
          let populations = [];
          for (let state of states) {
            populations.push(state.Population);
          }
          return d3.extent(populations);
        }
        let scaleX = d3.scale
          .linear()
          .domain([0, getExtentYearsPopulations(values)[1] / multiplier])
          .range([0, xAxisLength]);
        let scaleY = d3.scale
          .ordinal()
          .rangeRoundBands([yAxisLength, 0], 0.1)
          .domain(
            values.map((d) => {
              return d.State;
            })
          );

        let xAxis = d3.svg.axis().scale(scaleX).orient("bottom").ticks(30);
        let yAxis = d3.svg.axis().scale(scaleY).orient("left");

        svg
          .append("g")
          .attr("class", "x-axis")
          .attr(
            "transform",
            `translate(${marginLeft}, ${height - marginBlock})`
          )
          .call(xAxis);
        svg
          .select(".x-axis")
          .append("text")
          .attr("x", xAxisLength + 10)
          .attr("y", 10)
          .attr("text-anchor", "start")
          .style("font-size", "1em")
          .text("mil");
        svg
          .append("g")
          .attr("class", "y-axis")
          .attr("transform", `translate(${marginLeft}, ${marginBlock})`)
          .call(yAxis);
        svg
          .select(".y-axis")
          .append("text")
          .attr("x", 0)
          .attr("y", -10)
          .attr("text-anchor", "end")
          .style("font-size", "1em")
          .text("States");

        d3.select(parent)
          .selectAll("g.x-axis g.tick")
          .append("line")
          .classed("grid-line", true)
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", -yAxisLength);

        /* создаем объект g с набором столбиков */
        svg
          .append("g")
          .attr("transform", `translate(${marginLeft}, ${marginBlock})`)
          .selectAll(".bar")
          .data(values)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", (d) => {
            return 0;
          })
          .attr("width", (d) => {
            return scaleX(d.Population / multiplier);
          })
          .attr("y", (d) => {
            return scaleY(d.State);
          })
          .attr("height", scaleY.rangeBand())
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

    function visualizePie(data, parent) {
      data = data.sort((a, b) =>
        a.values[0].Population > b.values[0].Population ? -1 : 1
      );

      if (data[11]) {
        let biggest = data.slice(1, 10);
        let others = { key: "Others", values: [{ Population: 0 }] };
        data.forEach((d) => {
          if (data.indexOf(d) > 10)
            others.values[0].Population += d.values[0].Population;
        });
        data = biggest.concat(others);
      }

      let figure = d3.select(parent).append("figure");
      figure
        .append("figcapture")
        .attr("class", "title")
        .text("USA Population 2019");
      let diagram = figure.append("div").attr("class", "diagram");

      const width = 500;
      const height = 300;
      const margin = 20;
      const color = d3.scale.category10();
      const radius = Math.min(width - 2 * margin, height - 2 * margin) / 2;

      let arc = d3.svg.arc().outerRadius(radius).innerRadius(0);

      let pie = d3.layout.pie().value((d) => d.values[0].Population);

      let svg = diagram
        .append("svg")
        .attr("class", "axis")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2 - margin}, ${height / 2})`);

      let g = svg
        .selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");

      g.append("path")
        .attr("d", arc)
        .style("fill", (d) => color(d.data.key));

      let legendTable = diagram
        .select("svg")
        .append("g")
        .attr("transform", `translate(0, ${margin})`)
        .attr("class", "legendTable");

      let legend = legendTable
        .selectAll(".legend")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,  ${i * 15})`);

      legend
        .append("rect")
        .attr("x", width - 10)
        .attr("y", 4)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function (d) {
          return color(d.data.key);
        });

      legend
        .append("text")
        .attr("x", width - 14)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function (d) {
          return d.data.key;
        });
    }
  })
  .catch((err) => {
    d3.select("body").append("h1").attr("class", "title").text("ERROR :(");
    d3.select("body").append("h2").attr("class", "title").text(err);
  });
