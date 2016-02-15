import d3 from "d3";
import moment from "moment";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;
import d3Wordcloud from "./d3Wordcloud";

Array.prototype.indexOfObj = function arrayObjectIndexOf(property, value) {
    for (var i = 0, len = this.length; i < len; i++) {
        if (this[i][property] === value) return i;
    }
    return -1;
};

import {
  margin,
  width,
  height

} from "../lib/misc.js";

// TODO: global var bad
const force = d3.layout.force()
              .charge(d => d.selected ? (- Math.pow(d.width + 75, 2)) : 0)
              .gravity(0)
              .friction(0.4)
              .theta(1);


function dragstart(d, force) {
  console.log("drag start");
  d.selected = false;
  d.drag = true;
  force.stop();
  // force.friction(0);
  // d.fixed = true;
  // force.stop(); // stops the force auto positioning before you start dragging
}

function dragmove(d, node) {
  console.log("drag move");
  d.px += d3.event.dx ;
  d.py += d3.event.dy;
  d.x += d3.event.x - d.width / 2;
  d.y += d3.event.y - d.height / 2;

  node
    .style("left", d => d.x + "px")
    .style("top", d => d.y + "px");

  // tickTime(); // this is the key to make it work together with updating both px,py,x,y on d !
}

 function dragend(d, force) {
    console.log("drag end");
    d.drag = false;
    force.friction(0.4);
    force.start();
  // d.fixed = false;
        // d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        // tick();
        // force.resume();
    }

var linkedByIndex = new function() {
  return {
    index: {},
    init: function(links) {
      links.forEach(d => this.index[d.source + "," + d.target] = true);
    },
    isConnected: function(a, b) {
        return this.index[a.index + "," + b.index] || this.index[b.index + "," + a.index];
    }
  };
};

function collide(data, alpha, padding) {
  var quadtree = d3.geom.quadtree(data);
  return function(d) {
      var r = d.width + padding,
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;
      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.width + padding + quad.point.width;

          if (l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}

function collide2(data, alpha, padding) {
  var quadtree = d3.geom.quadtree(data);
  return function(d) {
    var offset = d.selected ? padding + 200 : padding;
    var r = d.width + offset,
        nx1 = d.x - r,
        nx2 = d.x + r;
        // ny1 = d.y - r,
        // ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            // y = d.y - quad.point.y,
            l = Math.sqrt(x * x),
            r = d.width + offset + quad.point.width;

        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          // d.y -= y *= l;
          quad.point.x += x;
          // quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1; // || y1 > ny2 || y2 < ny1;
    });
  };
}

function tickTime(node, xScale, yScale) {
  return function(e) {
    node.data().filter(d => !d.drag).forEach(d => {
      var axisPoint = {
          x: xScale(d.name),
          y: yScale(d.name)
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
      .style("left", d => d.x + "px")
      .style("top", d => d.y + "px");

  };
}


function create(el, props, state) {

  var drag = d3.behavior.drag()
          .on("dragstart", d => dragstart(d, force))
          .on("drag", d => dragmove(d, node))
          .on("dragend", d => dragend(d, force));

  var xScale = d3.scale.ordinal()
    .domain(nodes.map(d => d.name))
    .rangeRoundBands([margin.left, width - margin.right], 0, 0);

  var yScale = d3.scale.ordinal()
    .domain(nodes.map(d => d.name))
    .rangeRoundBands([height - margin.bottom, margin.top], 0, 0);

  var div = d3.select(el);
  // var svg = d3.select(el).select("svg");
  var nodes = state.data.nodes;//.slice(0, 20);
  nodes.forEach(d => d.selected = false);
  nodes.forEach(d => d.drag = false);

  force.nodes(nodes);
  linkedByIndex.init(state.data.links);

  var node = div.selectAll(".doc")
    .data(nodes);

  node.enter()
    .call(function() {

      var container = this
        .insert("div", ":first-child")
        .attr("class", "tooltip")
        .attr("z-index", (d, i) => -i )
        .append("span")
        .attr("class", "content")
        // .call(force.drag);
        .call(drag);

      container.append("div")
        // .attr("class", "title")
        .append("h4")
        .text(d => d.name);

      container
        // .append("div")
        // .attr("class", "sub-content")
        .append("div")
        .attr("class", "live-example")
        .append("iframe")
        .attr("class", "link-preview")
        .attr("src", "http://www.w3schools.com");
        // .attr("onload", function() {
        //   console.log("iframe loaded");
        //   force.start();
        // });



        // .append("svg")
        // .call(function() {
        //   var p = d3.select(".sub-content").node();
        //   // console.log("parent", p);
        //   var w = p.getBoundingClientRect().width;
        //   var h = p.getBoundingClientRect().height;
        //   console.log("w", w, "h", h);
        //   d3Wordcloud.bind(this)([
        //     ".NET", "Silverlight", "jQuery", "CSS3", "HTML5",
        //     "JavaScript", "SQL","C#"
        //   ], w, h);
        // });


      // subcontent
      //   .append("p")
      //   .attr("class", "date")
      //   .append("span")
      //   .attr("class", "text-muted")
      //   .text("Date: ");
      //
      // subcontent.select(".date")
      //   .append("span")
      //   .text(d => moment(d.date).format("MMMM Do YYYY, h:mm:ss a"));
      //
      // subcontent
      //   .append("p")
      //   .attr("class", "task")
      //   .append("span")
      //   .attr("class", "text-muted")
      //   .text("Tasks: ");
      //
      // subcontent.select(".task")
      //   .append("span")
      //   .text("task");

      container.each(function(d){
        d.height = this.getBoundingClientRect().height;
        d.width = this.getBoundingClientRect().width;
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

      container
        .on("mouseover", d => {
          if (d.drag) return;
          if (force.alpha() > 0.1) return;
          // force.on("tick", tickDetail(node, xScale, yScale));
          !d.selected ? d.selected = true : d.selected = false;
          console.log("force alpha", force.alpha());
          // d.fixed = true;
          force.start();
        })
        .on("mouseout", d => {
          if (d.drag) return;
          if (force.alpha() > 0.1) return;

          d.selected = false;
          // d.fixed = false;
          force.start();
        });
  });

  force.start();
  // force.links(tmpLinks);
  force.nodes(nodes);

  // used to scale node index to x position
  force
    .on("tick", tickTime(node, xScale, yScale));

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
  return {
    force: force,
    update: update,
    create: create
  };
};

export default d3TimeLine;
