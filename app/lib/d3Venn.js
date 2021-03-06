"use strict";

import d3 from "d3";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;
// import venn from "./venn/venn.js";
import fociLayout from "./d3-foci/src/foci.js";
// import vennForce from "./";

import _ from "lodash";

const D2R = Math.PI / 180;

import { generateData } from "./misc.js";

// console.log("generateData", generateData(10, 120));
// function position() {
//   this.style("left", function(d) { return d.x + "px"; })
//       .style("top", function(d) { return d.y + "px"; })
//       .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
//       .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
// }

// Array.prototype.last = function() {
//     if (this.length > 0) return this[this.length-1];
//     else return null;
// };


// var groupPath = function(d) {
//     return "M" +
//       d3.geom.hull(d.values.map(function(i) { return [i.x, i.y]; }))
//         .join("L")
//     + "Z";
// };

// var groupFill = function(d, i) { return d3.scale.category10()(i & 3); };
//
// function backgroundArc(radius) {
//   return d3.svg.arc()
//            .innerRadius(radius)
//            .outerRadius(radius - 1)
//            .startAngle(0)
//            .endAngle(2 * Math.PI);
// }
//
// function labelArc(innerRadius, outerRadius) {
//   return d3.svg.arc()
//            .innerRadius(innerRadius)
//            .outerRadius(outerRadius)
//            .startAngle(0)
//            .endAngle(2 * Math.PI);
// }
//
// function cropLen(string) {
//   if (string.length > 13) return string.substring(0, 14).concat("...");
//   else return string;
// }


// var groupFill = function(d, i) { return fill(i & 3); };
// var fill = d3.scale.category10();


function collide(data, alpha, padding) {
  var quadtree = d3.geom.quadtree(data);
  return function(d) {
    var offset = 0 + padding; //d.selected ? padding + 200 : padding;
    var r = d.width + offset,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.width + offset + quad.point.width;

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


// function lineData(d){ var straightLine = d3.svg.line().interpolate("bundle")
//           .x(d => d.x)
//           .y(d => d.y);
//
//   var points = [
//       {x: d.source.x - (NODE_RAD - LABEL_OFFSET), y: d.source.y},
//       {x: d.target.x, y: d.target.y}
//   ];
//   return straightLine(points);
// }

function ticker(docNode, width, height) {

  function moveToCenter(alpha, energy) {
      var affectSize = alpha * energy;
      return function(d) {
          d.x = d.x + ((d.center.x - d.width / 2) - d.x) * affectSize;
          d.y = d.y + ((d.center.y - d.height / 2) - d.y) * affectSize;
      };
  }

  function bindTo(size, maxVal, coord){
    return Math.max(size, Math.min(maxVal - size, coord));
  }


    // Move nodes toward cluster focus.
  return function(e) {
    // docNode
    //   .each(collide(docNode.data(), e.alpha, 0));

    docNode.each(moveToCenter(e.alpha, 0.5));
    docNode
      // TODO: bounding box
      .style("left", d => bindTo(d.width, width, d.x) + "px")
      .style("top", d => bindTo(d.height - 100, height, d.y) + "px");
      // .style("left", d => d.x + "px")
      // .style("top", d => d.y + "px");

    // docNode.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
    // docNode
    //   .attr("cx", function(d) { return d.x; })
    //   .attr("cy", function(d) { return d.y; });
  };

    // data
    //   .forEach(collide(data, 0.06, -50));

    // tagNode.each(d => {
    //   if (d.selected) {
    //     d.values.forEach((n, i) => {
    //       n.angle = n.angle || 360 / d.values.length * i;
    //       radial(n, 400, e.alpha, 0.9, {x: d.x, y: d.y});
    //     });
    //   }
    // });

    // d3.select("#vis-cont svg").selectAll(".hull")
    //     .data(d3.nest()
    //             .key(d => d.tag)
    //             .entries(data)
    //           )
    //       .attr("d", groupPath)
    //     .enter().insert("path", "circle")
    //       .attr("class", "hull")
    //       .style("fill", groupFill)
    //       .style("stroke", groupFill)
    //       .style("stroke-width", 100)
    //       .style("stroke-linejoin", "round")
    //       .style("opacity", .2)
    //       .attr("d", groupPath);

    // tagNode.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

    // tagNode.each(moveToCenter(e.alpha));
    // tagNode
    //   .style("left", d => d.x + "px")
    //   .style("top", d => d.y + "px");



    // link
    //   .attr("x1", function(d) { return d.source.x; })
    //   .attr("y1", function(d) { return d.source.y; })
    //   .attr("x2", function(d) { return d.target.x; })
    //   .attr("y2", function(d) { return d.target.y; });

    // link.attr("d", d => {
    //   // TODO
    //   // if (!d.target.centerX) console.log("d no centerX func", d.target);
    //   var sourceX =  d.source.x; // + d.source.width / 2;
    //   var sourceY =  d.source.y; // + d.source.height / 2;
    //   var targetX = d.target.x; // + d.target.width / 2;
    //   var targetY = d.target.y; // + d.target.height / 2;
    //
    //   return "M" + sourceX + "," + sourceY
    //           + " " + targetX + "," + targetY;
    // });
  // };
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

  var div = d3.select(el);
  var svg = div.select("svg");
  var genData = generateData(4, 120);
  // console.log("genData", genData);
  // console.log("props.wh", props.width, props.height);
  var foci = fociLayout()
                .clusterSize((size) => 1 * size / 60)
                .sets(state.data)
                .size([props.width - 100, props.height - 100])
                .charge(d => - d.size / 8)
                .linkStrength(1)
                // .linkDistance(50)
                .startForce();


  // console.log("foci sets", foci.sets());
  var docData = foci.data();
  console.log("foci sets", foci.sets().entries());

  var docNode = div.selectAll(".doc")
    .data(docData, d => d.id);

  // var vennArea = svg.selectAll("g.venn-area")
  //     .data(foci.sets().values(), function(d) {
  //       return d.__key__;
  //     });
  //
  // var vennEnter = vennArea.enter()
  //   .append("g")
  //   .attr("class", function(d) {
  //     return "venn-area venn-" +
  //       (d.sets.length == 1 ? "circle" : "intersection");
  //   })
  //   .attr("fill", function() {
  //     return "red"; //colors(i)
  //   });
  //
  // vennEnter.append("path")
  //   .attr("class", "venn-area-path");
  //
  // vennEnter.append("circle")
  //   .attr("class", "inner")
  //   .attr("fill", "grey");
  //
  // vennEnter.append("text")
  //   .attr("class", "label")
  //   .attr("text-anchor", "middle")
  //   .attr("dy", ".35em")
  //   .text("SAAS");
  //
  // vennArea.selectAll("path.venn-area-path").transition()
  //   .duration(300)
  //   .attr("opacity", "0.7")
  //   .attrTween("d", function(d) {
  //     return d.d;
  //   });
  //
  // vennArea.selectAll("path.venn-area-path").transition()
  //       // .duration(isFirstLayout ? 0 : test.duration())
  //       .attr("opacity", 0.5)
  //       .attrTween("d", function(d) {
  //         return d.d;
  //       });
  // //we need to rebind data so that parent data propagetes to child nodes (otherwise, updating parent has no effect on child.__data__ property)
  // vennArea.selectAll("text.label").data(function(d) {
  //     return [d];
  //   })
  //   .text(function(d) {
  //     return d.__key__;
  //   })
  //   .attr("x", function(d) {
  //     return d.center.x;
  //   })
  //   .attr("y", function(d) {
  //     return d.center.y;
  //   });
  //
  // //we need to rebind data so that parent data propagetes to child nodes (otherwise, updating parent has no effect on child.__data__ property)
  // vennArea.selectAll("circle.inner").data(function(d) {
  //     return [d];
  //   }).transition()
  //   .duration(10)
  //   .attr("opacity", 0.7)
  //   .attr("cx", function(d) {
  //     return d.center.x;
  //   })
  //   .attr("cy", function(d) {
  //     return d.center.y;
  //   })
  //   .attr("r", function(d) {
  //     return d.innerRadius;
  //   });

  div.selectAll("tag.span.content")
     .data(foci.sets().values().filter(d => d.nodes.length > 0))
     .enter()
     .insert("div", ":first-child")
     // .attr("class", "txt")
     .attr("class", "tag")
     .append("span")
     .attr("class", "content")
     .style("left", d => d.x + "px")
     .style("top", d => d.y + "px")
     .text(d => d.sets.join(", "));

  docNode
    .enter()
    .call(function() {
      var doc = this
        .insert("div", ":first-child")
        .attr("class", "doc")
        .append("span")
        .attr("class", "content")
        .style("background", d => d.tag === "personal" ? "#FF851B" : "#e5f5f9")
        // .style("background", "#FF851B")
        .on("click", d => console.log(d.tags));
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



    // need this so that nodes always on top
  // var circleContainer = svg.selectAll("g.venn-circle-container")
  //     .data(foci.sets().values(), function(d) {
  //       return d.__key__;
  //     });
  //
  // circleContainer.enter()
  //     .insert("g", ":first-child")
  //     .attr("class", "venn-circle-container")
  //     .attr("fill", function(d) {
  //       return "black";
  //     });

  // var points = circleContainer.selectAll("circle.node")
  //     .data(function(d) {
  //       return d.nodes;
  //     }, function(d) {
  //       return d.id;
  //     });
  //
  // points.enter()
  //       .insert("circle", ":first-child")
  //       .attr("r", 10)
  //       .attr("class", "node")
  //       .attr("fill", "black");
  //
  // console.log("points", points);

  // docNode.enter()
  //   .append("circle")
  //   .attr("r", 10)
  //   .attr("class", "node");

  this.force.nodes(docData);
  this.force.on("tick", ticker(docNode, props.width, props.height));
  this.force.start();

  // tagNode
  //   .enter()
  //   .call(function() {
  //     var tag = this
  //       .insert("div", ":first-child")
  //       .attr("class", "tag")
  //       // .attr("z-index", (d, i) => -i )
  //       .append("span")
  //       .attr("class", "content");
  //       // .call(force.drag);
  //       // .call(drag);
  //
  //     tag.append("div")
  //       .append("h4")
  //       .text(d => d.key);
  //
  //     tag
  //       .append("div")
  //       .attr("class", "live-example");
  //       // .append("iframe")
  //       // .attr("class", "link-preview")
  //       // .attr("src", "http://www.w3schools.com");
  //     tag.each(function(d){
  //       d.height = this.getBoundingClientRect().height;
  //       d.width = this.getBoundingClientRect().width;
  //       d.x2 = function() {
  //         return this.x + d.width;
  //       };
  //       d.y2 = function() {
  //         return this.y + d.height;
  //       };
  //       d.centerX = function() {
  //         return this.x + d.width / 2;
  //       };
  //       d.centerY = function() {
  //         return this.y - d.height / 2;
  //       };
  //     });
  //   });
  //
  //   this.force.on("tick", ticker(setData, tagNode, null, null));
  //   this.force.start();


  // var edges = _.flatten(tagData.map(source => source.values.map(target => {
  //   return {
  //     id: source.id + "-" + target.id,
  //     source: allData.findIndex(d => d.id === source.id),
  //     target: allData.findIndex(d => d.id === target.id)};
  // })));
  //
  // edges.forEach(l => l.value = edges.filter(e => e.target === l.target)
  //                                   .length);
  //
  // console.log("edges", edges);
  // console.log("edges filter", edges.filter(e => e.value > 1));
  //
  // var div = d3.select(el);
  // var svg = div.select("svg");
  //
  // // var div = d3.select(el).append("div");
  //
  // this.force.size([props.width, props.height]);
  //
  // var tagNode = div.selectAll(".tag")
  //   .data(tagData, d => d.id);
  //
  // var docNode = div.selectAll(".doc")
  //   .data(docData, d => d.id);
  //
  // tagNode
  //   .enter()
  //   .call(function() {
  //     var tag = this
  //       .insert("div", ":first-child")
  //       .attr("class", "tag")
  //       // .attr("z-index", (d, i) => -i )
  //       .append("span")
  //       .attr("class", "content");
  //       // .call(force.drag);
  //       // .call(drag);
  //
  //     tag.append("div")
  //       .append("h4")
  //       .text(d => d.key);
  //
  //     tag
  //       .append("div")
  //       .attr("class", "live-example");
  //       // .append("iframe")
  //       // .attr("class", "link-preview")
  //       // .attr("src", "http://www.w3schools.com");
  //     tag.each(function(d){
  //       d.height = this.getBoundingClientRect().height;
  //       d.width = this.getBoundingClientRect().width;
  //       d.x2 = function() {
  //         return this.x + d.width;
  //       };
  //       d.y2 = function() {
  //         return this.y + d.height;
  //       };
  //       d.centerX = function() {
  //         return this.x + d.width / 2;
  //       };
  //       d.centerY = function() {
  //         return this.y - d.height / 2;
  //       };
  //     });
  //   });
  //
  //
  // tagNode.exit().remove();
  // docNode.exit().remove();
  //
  // console.log("docNode", docNode.data());
  // d3.layout.pack()
  //     .sort(null)
  //     .padding(0)
  //     .size([props.width, props.height])
  //     .children(d => d.values)
  //     .value(d => 20)
  //     // .radius(400)
  //     .nodes({values: tagData});
  //
  //
  // // var svg = d3.select(el).append("svg")
  // //             .attr("width", margin.left + width + margin.right)
  // //             .attr("height", margin.top + height + margin.bottom);
  //
  // var link = svg.selectAll(".link")
  //       .data(edges#<{(| , d => d.source.title + "-" + d.target.title |)}>#);
  //
  // link
  //   .enter()
  //   .insert("path", ":first-child")
  //   .attr("class", "link")
  //   .style("stroke-width", d => d.source.selected ? 10 : 1)
  //   .style("stroke", "#999");
  //
  // link.exit().remove();
  //
  // this.force.nodes(allData);
  // this.force.links(edges);
  // this.force.on("tick", ticker(allData, d3.selectAll("empty"), docNode, link));
  // this.force.start();
  // // console.log("force nodes", this.force.nodes().map(d => d.id));
  // // console.log("force links", this.force.links());
  d3.selectAll(".doc").on("click", d => console.log("d", d.center));
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
                .charge(- 5)
                .gravity(0);
                // .friction(0.9
                // .linkDistance(l => {
                //   console.log("link", l);
                //   var len = l.source.values ? l.source.values.length : 0;
                //   return len > 1 ? l.source.values.length : 0;
                // })
                // .linkStrength(0)
                // .linkDistance(l => {
                //   // var len = l.source.values ? l.source.values.length : 0;
                //   return l.value > 1 ? 500 : 0;
                // });
  return {
    force: force,
    update: update,
    create: create
  };
};

export default d3ggLayout;
