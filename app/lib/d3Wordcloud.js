var d3 = require("d3"),
    cloud = require("d3-cloud");

var fill = d3.scale.category20();

function wordcloud(words, weight, height) {
  var svg = this;
  var layout = cloud()
      .size([weight, height])
      .words(words.map(d => {
        return {text: d, size: 20, test: "haha"};
      }))
      .padding(5)
      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .font("Impact")
      .fontSize(function(d) { return d.size; })
      .on("end", function (words) {
        svg
          .attr("width", layout.size()[0])
          .attr("height", layout.size()[1])
          .append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + ","
              + layout.size()[1] / 2 + ")")
          .selectAll("text")
            .data(words)
          .enter().append("text")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; });
  });
  layout.start();
}

export default wordcloud;

// function draw(words) {
//   d3.select("body").append("svg")
//       .attr("width", layout.size()[0])
//       .attr("height", layout.size()[1])
//     .append("g")
//       .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
//     .selectAll("text")
//       .data(words)
//     .enter().append("text")
//       .style("font-size", function(d) { return d.size + "px"; })
//       .style("font-family", "Impact")
//       .style("fill", function(d, i) { return fill(i); })
//       .attr("text-anchor", "middle")
//       .attr("transform", function(d) {
//         return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
//       })
//       .text(function(d) { return d.text; });
// }
