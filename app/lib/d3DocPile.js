import d3 from "d3";
// import $ from "jquery";
import {xy} from "./misc";
// import moment from "moment";
// import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;
// import d3Wordcloud from "./d3Wordcloud";

Array.prototype.indexOfObj = function arrayObjectIndexOf(property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
};

// TODO: global var bad

function dragstart(d, force) {
  d.selected = false;
  d.drag = true;
  force.stop();
  // force.friction(0);
  // d.fixed = true;
  // force.stop(); // stops the force auto positioning before you start dragging
}

function dragmove(d, node) {
  d.px += d3.event.dx ;
  d.py += d3.event.dy;
  d.x += d3.event.x - d.width / 2;
  d.y += d3.event.y - d.height / 2;

  node
    .style("left", d => d.x + "px")
    .style("top", d => d.y + "px");

  // ticker(); // this is the key to make it work together with updating both px,py,x,y on d !
}

 function dragend(d, force) {
    d.drag = false;
    force.friction(0.4);
    force.start();
  // d.fixed = false;
        // d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        // tick();
        // force.resume();
    }

// var linkedByIndex = new function() {
//   return {
//     index: {},
//     init: function(links) {
//       links.forEach(d => this.index[d.source + "," + d.target] = true);
//     },
//     isConnected: function(a, b) {
//         return this.index[a.index + "," + b.index] || this.index[b.index + "," + a.index];
//     }
//   };
// };

// function collide2(data, alpha, padding) {
//   var quadtree = d3.geom.quadtree(data);
//   return function(d) {
//     var offset = d.selected ? padding + 200 : padding;
//     var r = d.width + offset,
//         nx1 = d.x - r,
//         nx2 = d.x + r;
//         // ny1 = d.y - r,
//         // ny2 = d.y + r;
//     quadtree.visit(function(quad, x1, y1, x2) {
//       if (quad.point && (quad.point !== d)) {
//         var x = d.x - quad.point.x,
//             // y = d.y - quad.point.y,
//             l = Math.sqrt(x * x),
//             r = d.width + offset + quad.point.width;
//
//         if (l < r) {
//           l = (l - r) / l * alpha;
//           d.x -= x *= l;
//           // d.y -= y *= l;
//           quad.point.x += x;
//           // quad.point.y += y;
//         }
//       }
//       return x1 > nx2 || x2 < nx1; // || y1 > ny2 || y2 < ny1;
//     });
//   };
// }

function ticker(node, xScale, height) {
  return function(e) {
    node.data().filter(d => !d.drag).forEach(d => {
      var axisPoint = {
          x: xScale(d.id),
          y: height / 2
      };

    var affectSize = e.alpha * 1.5;
    d.x += (axisPoint.x - d.x) * affectSize;
    d.y += (axisPoint.y - d.y) * affectSize;
    });

    // node.data().forEach(d => {
    //   d.y = Math.max(1000, Math.min(d.y - 100, d.x));
    // });
    // node.each(collide2(node.data(), 0.1, 20));

    node
      .style("transform", d => "translate(" + d.x + "px" + "," + d.y + "px)");
      // .style("left", d => d.x + "px");
      // .style("top", d => d.y + "px");
  };
}

function create(el, props, state) {

  var force = this.force;

  var drag = d3.behavior.drag()
          .on("dragstart", d => dragstart(d, force))
          .on("drag", d => dragmove(d, node))
          .on("dragend", d => dragend(d, force));

  var docData = state.data.documents;

  docData.forEach(d => d.selected = false);
  docData.forEach(d => d.drag = false);

  var xScale = d3.scale.ordinal()
    .domain(docData.map(d => d.id))
    .rangeRoundBands([props.margin.left, props.width + props.margin.left]);

  // var yScale = d3.scale.ordinal()
  //   .domain(docData.map(d => d.id))
  //   .rangeRoundBands([props.height - props.margin.bottom,
  //                     props.margin.top], 0, 0);

  var div = d3.select(el);
  // var svg = d3.select(el).select("svg");

  force.nodes(docData);
  // linkedByIndex.init(state.data.links);

  var node = div.selectAll(".doc")
    .data(docData, d => d.id);

  node.enter()
    .call(function() {
      var doc = this
        .insert("div", ":first-child")
        .attr("class", "doc")
        .append("span")
        .attr("class", "content")
        .style("background", d => d.tag === "personal" ? "#FF851B" : "#e5f5f9");
        // .style("background", "#FF851B")
        // .call(force.drag);
        // .call(drag);

      doc.append("div")
        .append("h4");
        // .text(d => d.title);

      doc
        .append("div")
          .attr("class", "live-example")
          // .style("z-index", d => d.z )
        .append("iframe")
          .attr("class", "link-preview");
          // .attr("src", "http://www.w3schools.com");
        doc.each(function(d){
          d.height = this.getBoundingClientRect().height;
          d.width = this.getBoundingClientRect().width;

          d.hx = () => xy(this).x;
          d.hy = () => xy(this).y;
        });
      doc.each(function(d){
        d.height = this.getBoundingClientRect().height;
        d.width = this.getBoundingClientRect().width;
        d.svgY = function() {
          return props.yOffset(this.y);
        };

        d.x2 = function() {
          return this.x + d.width;
        };
        d.y2 = function() {
          return this.y + d.height;
        };
        d.centerX = function() {
          return this.x + d.width / 2;
        };
        d.centerY = function() {
          return this.y + d.height / 2;
        };

      });

      doc
        .on("mouseover", d => {
          d3.selectAll(".line").data([]);
          // d3.selectAll(".line").exit().remove();

          if (d.drag) return;
          if (force.alpha() > 0.1) return;
          // force.on("tick", tickDetail(node, xScale, yScale));
          !d.selected ? d.selected = true : d.selected = false;
          // d.fixed = true;
          force.start();


          console.log("d.tags", d.tags);
          var targets = d3.selectAll(".word")
                          .filter(e => d.tags.indexOf(e.key) !== -1);

          // var pos = $(targets[0]);
          console.log("targets", targets);

          var lines = d3.select("#svg").selectAll(".line")
                           .data(targets.data());

          lines.enter()
           .append("line")
             .attr("class", "line")
             .attr("x1", d.hx())
             .attr("y1", d.hy())
             .attr("x2", e => e.hx())
             .attr("y2", e => e.hy());

        })
        .on("mouseout", d => {
          d3.selectAll(".line").remove();
          if (d.drag) return;
          if (force.alpha() > 0.1) return;

          d.selected = false;
          // d.fixed = false;
          force.start();
        });
  });

  force.start();
  // force.links(tmpLinks);
  // force.nodes(docData);

  // used to scale node index to x position
  force
    .on("tick", ticker(node, xScale, props.height));

  // d3.selectAll("*").on("click", d => console.log(d));

  node.exit()
    .remove();

}

function update(el, props, state) {
  var svg = d3.select(el).select("svg");
  var node = svg.selectAll("g.group");
  node.style("opacity", d => d.selected ? 1 : 0.5);
}

const d3TimeLine = new function(){
  const force = d3.layout.force()
                .charge(d => d.selected ? (- Math.pow(d.width + 75, 2)) : 0)
                .gravity(0)
                .friction(0.4)
                .theta(1);
  return {
    force: force,
    update: update,
    create: create
  };
};

export default d3TimeLine;
