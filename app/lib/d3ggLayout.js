"use strict";

import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;

import _ from "lodash";

import {
  width,
  height,
  margin
  // makeEdges,
  // DOC_URL,
  // EMAIL_URL,
  // CALENDAR_URL,
  // relationColors,
  // NOTE_URL,
  // facets,
  // getDepth
} from "./misc.js";

const D2R = Math.PI / 180;

var NODE_RAD = 20;
// var NODE_PADDING = 20;
var LABEL_OFFSET = 15;
// var INIT_RAD_LAYOUT = 150;
// var INIT_NODE_PADDING = 20;

function position() {
  this.style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}

Array.prototype.last = function() {
    if (this.length > 0) return this[this.length-1];
    else return null;
};

function backgroundArc(radius) {
  return d3.svg.arc()
           .innerRadius(radius)
           .outerRadius(radius - 1)
           .startAngle(0)
           .endAngle(2 * Math.PI);
}

function labelArc(innerRadius, outerRadius) {
  return d3.svg.arc()
           .innerRadius(innerRadius)
           .outerRadius(outerRadius)
           .startAngle(0)
           .endAngle(2 * Math.PI);
}

function cropLen(string) {
  if (string.length > 13) return string.substring(0, 14).concat("...");
  else return string;
}


// var groupFill = function(d, i) { return fill(i & 3); };
// var fill = d3.scale.category10();


function collide(data, alpha, padding) {
  var quadtree = d3.geom.quadtree(data);
  return function(d) {
    var offset = d.selected ? padding + 200 : padding;
    var r = d.radius + offset,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + offset + quad.point.radius;

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

function radial(d, radius, alpha, energy, center) {
  var currentAngleRadians = d.angle * D2R;
  var radialPoint = {
    x: center.x + radius * Math.cos(currentAngleRadians),
    y: center.y + radius * Math.sin(currentAngleRadians)
  };

  var affectSize = alpha * energy;

  d.x += (radialPoint.x - d.x) * affectSize;
  d.y += (radialPoint.y - d.y) * affectSize;
}


function lineData(d){ var straightLine = d3.svg.line().interpolate("bundle")
          .x(d => d.x)
          .y(d => d.y);

  var points = [
      {x: d.source.x - (NODE_RAD - LABEL_OFFSET), y: d.source.y},
      {x: d.target.x, y: d.target.y}
  ];
  return straightLine(points);
}

function tick(tagNode, docNode, link) {
  return function(e) {
    // tagNode.data()
    //   .filter(d => !d.isNb)
    //   .forEach(collide(tagNode.data(), 0.1, NODE_RAD + LABEL_OFFSET));

    tagNode.each(d => {
      if (d.selected) {
        d.values.forEach((n, i) => {
          n.angle = n.angle || 360 / d.values.length * i;
          radial(n, 400, e.alpha, 0.9, {x: d.x, y: d.y});
        });
      }
    });

    // tagNode.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    tagNode
      .style("left", d => d.x + "px")
      .style("top", d => d.y + "px");

    docNode
      .style("left", d => d.x + "px")
      .style("top", d => d.y + "px");

    // link
    //   .attr("x1", function(d) { return d.source.x; })
    //   .attr("y1", function(d) { return d.source.y; })
    //   .attr("x2", function(d) { return d.target.x; })
    //   .attr("y2", function(d) { return d.target.y; });

    link.attr("d", d => {
      // TODO
      // if (!d.target.centerX) console.log("d no centerX func", d.target);
      var sourceX =  d.source.x; // + d.source.width / 2;
      var sourceY =  d.source.y; // + d.source.height / 2;
      var targetX = d.target.x; // + d.target.width / 2;
      var targetY = d.target.y; // + d.target.height / 2;

      return "M" + sourceX + "," + sourceY
              + " " + targetX + "," + targetY;
    });
  };
}

function contextMenu(d, props, state) {
  var allNbs = facets.map(type => {
    var nbs = state.linkedByIndex.nbs(d, type);
    var nbsByLinkValueDuplicates = _.flatten(nbs.map(d => {
      return d.linkedBy.value.map(v => {
        var dCopy = _.cloneDeep(d);
        dCopy.linkValue = v;
        dCopy.connectedByType = type;
        return dCopy;
      });
    })
  );
    var nestedNbs = d3.nest()
      .key(d => d.linkValue)
      .entries(nbsByLinkValueDuplicates);

    nestedNbs.forEach(d => d.facetType = type);

    return {key: type, children: nestedNbs};
  });

  var root = {key: "facets", children: allNbs};
  // break execution
  if (getDepth(root) === 2) return;

  var treemap = d3.layout.treemap()
    // TODO: size
    .size([150, 150])
    .sticky(true)
    .value(d => d.children ? d.children.length : 1);

  var cont = d3.select("#vis-cont")
    .insert("div")
    .attr("class", "context-menu")
    .style("position", "absolute")
    .style("left", d.x + "px")
    .style("top", (d.y  - (allNbs.length * 40)) + "px")
    .style("margin-top", -75 + "px")
    .style("display", "inline");

  cont.datum(root).selectAll(".tNode")
    .data(treemap.nodes)
    .enter()
    .append("div")
      .attr("class", "tNode")
      .call(position)
      .on("click", e => {
        d3.select(".context-menu").remove();
        d.nbs = state.linkedByIndex.nbs(d, e.facetType);
        d.nbs.forEach(d => d.isNb = true);
        this.force.start();
      })
      .style("background", d => !d.children ? relationColors[d.parent.key] : null)
      .text(d => !d.children && d.depth >= 2 ? d.key : null);
}

function create(el, props, state) {

  var docData = _.flatten(state.data.map(d => d.values));
  docData.forEach(d => d.type = "doc");
  var tagData = state.data;
  tagData.forEach(d => d.type = "tag");
  var data = _.uniqBy(tagData.concat(docData), "id");

  var edges = _.flatten(tagData.map(source => source.values.map(target => {
    return {
      id: source.id + "-" + target.id,
      source: data.findIndex(d => d.id === source.id),
      target: data.findIndex(d => d.id === target.id)};
  })));

  edges.forEach(l => l.value = edges.filter(e => e.target === l.target).length);

  console.log("edges", edges);
  console.log("edges filter", edges.filter(e => e.value > 1));

  var div = d3.select(el);
  var svg = div.select("svg");

  // var div = d3.select(el).append("div");

  this.force.size([props.width, props.height]);

  var tagNode = div.selectAll(".tag")
    .data(state.data, d => d.id);

  var docNode = div.selectAll(".doc")
    .data(docData, d => d.id);

  tagNode
    .enter()
    .call(function() {
      var tag = this
        .insert("div", ":first-child")
        .attr("class", "tag")
        // .attr("z-index", (d, i) => -i )
        .append("span")
        .attr("class", "content");
        // .call(force.drag);
        // .call(drag);

      tag.append("div")
        .append("h4")
        .text(d => d.key);

      tag
        .append("div")
        .attr("class", "live-example");
        // .append("iframe")
        // .attr("class", "link-preview")
        // .attr("src", "http://www.w3schools.com");
      tag.each(function(d){
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
          return this.y - d.height / 2;
        };
      });
    });

  docNode
    .enter()
    .call(function() {
      var doc = this
        .insert("div", ":first-child")
        .attr("class", "doc")
        // .attr("z-index", (d, i) => -i )
        .append("span")
        .attr("class", "content")
        .style("background", d => d.tag === "personal" ? "#FF851B" : "#e5f5f9")
        // .style("background", "#FF851B")
        .on("click", d => console.log(d));
        // .call(force.drag);
        // .call(drag);

      doc.append("div")
        .append("h4");
        // .text(d => d.title);

      doc
        .append("div")
        .attr("class", "live-example");
        // .append("iframe")
        // .attr("class", "link-preview")
        // .attr("src", "http://www.w3schools.com");
      doc.each(function(d){
        d.height = this.getBoundingClientRect().height;
        d.width = this.getBoundingClientRect().width;
        d.x2 = function() {
          return this.x + d.width;
        };
        d.y2 = function() {
          return this.y + d.height;
        };
        d.centerX = function() {
          return this.x + (d.width / 2);
        };
        d.centerY = function() {
          return this.y - d.height / 2;
        };
      });
    });

  tagNode.exit().remove();
  docNode.exit().remove();

  console.log("docNode", docNode.data());
  d3.layout.pack()
      .sort(null)
      .padding(0)
      .size([props.width, props.height])
      .children(function(d) { return d.values; })
      .value(function(d) { return 20; })
      // .radius(400)
      .nodes({values: tagData});


  // var svg = d3.select(el).append("svg")
  //             .attr("width", margin.left + width + margin.right)
  //             .attr("height", margin.top + height + margin.bottom);

  var link = svg.selectAll(".link")
        .data(edges/* , d => d.source.title + "-" + d.target.title */);

  link
    .enter()
    .insert("path", ":first-child")
    .attr("class", "link")
    .style("stroke-width", d => d.source.selected ? 10 : 1)
    .style("stroke", "#999");

  link.exit().remove();

  this.force.nodes(data);
  this.force.links(edges);
  this.force.on("tick", tick(tagNode, docNode, link));
  this.force.start();
  // console.log("force nodes", this.force.nodes().map(d => d.id));
  // console.log("force links", this.force.links());
}

function update(el, props, state) {
  var svg = d3.select("#vis-cont svg");
  var div = d3.select(el);

  var tagNode = div.selectAll(".tag");

  var docNode = div.selectAll(".doc");
  var edges = [];

  tagNode
    .on("click", d => {
      console.log("click", d);
      if (!d.selected) {
        d.fixed = true;
        d.selected = true;
        // props.path.push(d);
        // props.getPath(props.path);
        // tagNode.each(d => d.isNb = false);
        // contextMenu.bind(this)(d, props, state);
      } else {
        // d3.event.stopPropagation();
        if (!d.selected) return;
        // d3.select(".context-menu").remove();

        // if (props.path.last().id !== d.id) return;
        d.fixed = false;
        d.selected = false;

        // props.path.pop();
        }
    });

}

const d3ggLayout = new function(){
  var force = d3.layout.force()
                .charge(d => {
                  return d.type === "doc" ? - 1000 : 0;
                })
                // .charge(-1200)
                // // .gravity(0.2)
                // .friction(0.9
                // .linkDistance(l => {
                //   console.log("link", l);
                //   var len = l.source.values ? l.source.values.length : 0;
                //   return len > 1 ? l.source.values.length : 0;
                // })
                // .linkStrength(0)
                .linkDistance(l => {
                  // var len = l.source.values ? l.source.values.length : 0;
                  return l.value > 1 ? 500 : 100;
                });
  return {
    force: force,
    update: update,
    create: create
  };
};

export default d3ggLayout;
