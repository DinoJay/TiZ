import d3 from "d3";
// import moment from "moment";
// import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;
// import d3Wordcloud from "./d3Wordcloud";

// var data = [{"date":"2012-03-20","total":3},{"date":"2012-03-21","total":8},{"date":"2012-03-22","total":2},{"date":"2012-03-23","total":10},{"date":"2012-03-24","total":3},{"date":"2012-03-25","total":20},{"date":"2012-03-26","total":12}];

function create(el, props, state) {
  var data = state.data.documents;
  var g = d3.select(el).select("svg g");

  var [min, max] = d3.extent(data, d => new Date(d.createdDate));

  console.log("max", max, "min", min);

  var x = d3.time.scale()
      .domain([min, max])
      .rangeRound([props.margin.left, props.width] );

  var xAxis = d3.svg.axis()
      .scale(x);

  g
    .attr("class", "x axis")
    .attr("transform", "translate(0," + 100 + ")")
    .call(xAxis)
  .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

  g.selectAll(".dot")
        .data(data)
      .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", d => x(new Date(d.createdDate)))
        .attr("cy", 0)
        .style("fill", "red");

}

function update(el, props, state) {
  // var svg = d3.select(el).select("svg");
  // var node = svg.selectAll("g.group");
  // node.style("opacity", d => d.selected ? 1 : 0.5);
}

const d3TimeLine = new function(){
  return {
    update: update,
    create: create
  };
};

export default d3TimeLine;
