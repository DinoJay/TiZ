import d3 from "d3";
import cloud from "d3-cloud";

var fill = d3.scale.category20();

function wordcloud(words, width, height) {
  var svg = this;
  var layout = cloud()
      .size([width, height])
      .words(words.map(d => {
        d.text = d.key;
        d.size = d.values.length;
        return d;

      }))
      .padding(5)
      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .font("Impact")
      .fontSize(function(d) { return d.size * 3; })
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
            .attr("class", "word")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; });

      d3.selectAll(".word").each(d => {
        d.ox = layout.size()[0] / 2 + d.x;
        d.oy = layout.size()[1] / 2 + d.y;
      });
  });
  layout.start();
}

export default wordcloud;
