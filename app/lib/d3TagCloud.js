import fociLayout from "./d3-foci/src/foci.js";
import d3 from "d3";
import _ from "lodash";
import d3MeasureText from "d3-measure-text"; d3MeasureText.d3 = d3;

import "d3-geom-concavehull";

import ClipperLib from "js-clipper";

function straight_skeleton(polyRaw, spacing) {
    // http://stackoverflow.com/a/11970006/796832
    // Accompanying Fiddle: http://jsfiddle.net/vqKvM/35/

    var poly = polyRaw.map(a => {
      return {x: a[0], y: a[1]};
    });
    var resulting_path = [];
    var N = poly.length;
    var mi, mi1, li, li1, ri, ri1, si, si1, Xi1, Yi1;

    console.log("poly", poly);

    for(var i = 0; i < N; i++)
    {
        mi = (poly[(i+1) % N].y - poly[i].y)/(poly[(i+1) % N].x - poly[i].x);
        mi1 = (poly[(i+2) % N].y - poly[(i+1) % N].y)/(poly[(i+2) % N].x - poly[(i+1) % N].x);
        li = Math.sqrt((poly[(i+1) % N].x - poly[i].x)*(poly[(i+1) % N].x - poly[i].x)+(poly[(i+1) % N].y - poly[i].y)*(poly[(i+1) % N].y - poly[i].y));
        li1 = Math.sqrt((poly[(i+2) % N].x - poly[(i+1) % N].x)*(poly[(i+2) % N].x - poly[(i+1) % N].x)+(poly[(i+2) % N].y - poly[(i+1) % N].y)*(poly[(i+2) % N].y - poly[(i+1) % N].y));
        ri = poly[i].x+spacing*(poly[(i+1) % N].y - poly[i].y)/li;
        ri1 = poly[(i+1) % N].x+spacing*(poly[(i+2) % N].y - poly[(i+1) % N].y)/li1;
        si = poly[i].y-spacing*(poly[(i+1) % N].x - poly[i].x)/li;
        si1 = poly[(i+1) % N].y-spacing*(poly[(i+2) % N].x - poly[(i+1) % N].x)/li1;
        Xi1 = (mi1*ri1-mi*ri+si-si1)/(mi1-mi);
        Yi1 = (mi*mi1*(ri1-ri)+mi1*si-mi*si1)/(mi1-mi);
        // Correction for vertical lines
        if(poly[(i+1) % N].x - poly[i % N].x==0)
        {
            Xi1 = poly[(i+1) % N].x + spacing*(poly[(i+1) % N].y - poly[i % N].y)/Math.abs(poly[(i+1) % N].y - poly[i % N].y);
            Yi1 = mi1*Xi1 - mi1*ri1 + si1;
        }
        if(poly[(i+2) % N].x - poly[(i+1) % N].x==0 )
        {
            Xi1 = poly[(i+2) % N].x + spacing*(poly[(i+2) % N].y - poly[(i+1) % N].y)/Math.abs(poly[(i+2) % N].y - poly[(i+1) % N].y);
            Yi1 = mi*Xi1 - mi*ri + si;
        }

        //console.log("mi:", mi, "mi1:", mi1, "li:", li, "li1:", li1);
        //console.log("ri:", ri, "ri1:", ri1, "si:", si, "si1:", si1, "Xi1:", Xi1, "Yi1:", Yi1);

        resulting_path.push({
            x: Xi1,
            y: Yi1
        });
    }

    return [resulting_path.map(d => [d.x, d.y]).filter(d => d[0] && d[1])];
}


function taffyEdges(d, nodeSourceSize, nodeTargetSize, midpointSize) {
    var diffX = d.target.ys - d.source.ys;
    var diffY = d.target.xs - d.source.xs;

    var angle0 = ( Math.atan2( diffY, diffX ) + ( Math.PI / 2 ) );
    var angle1 = angle0 - ( Math.PI / 2 );
    var angle2 = angle0 + ( Math.PI / 2 );

    var x1 = d.source.xs + (nodeSourceSize * Math.cos(angle1));
    var y1 = d.source.ys - (nodeSourceSize * Math.sin(angle1));
    var x2 = d.source.xs + (nodeSourceSize * Math.cos(angle2));
    var y2 = d.source.ys - (nodeSourceSize * Math.sin(angle2));

    var x3 = d.target.xs + (nodeTargetSize * Math.cos(angle2));
    var y3 = d.target.ys - (nodeTargetSize * Math.sin(angle2));
    var x4 = d.target.xs + (nodeTargetSize * Math.cos(angle1));
    var y4 = d.target.ys - (nodeTargetSize * Math.sin(angle1));

    var mx1 = d.source.xs + (midpointSize * Math.cos(angle1));
    var my1 = d.source.ys - (midpointSize * Math.sin(angle1));
    var mx2 = d.source.xs + (midpointSize * Math.cos(angle2));
    var my2 = d.source.ys - (midpointSize * Math.sin(angle2));

    var mx3 = d.target.xs + (midpointSize * Math.cos(angle1));
    var my3 = d.target.ys - (midpointSize * Math.sin(angle1));
    var mx4 = d.target.xs + (midpointSize * Math.cos(angle2));
    var my4 = d.target.ys - (midpointSize * Math.sin(angle2));

    var midY2 = (my1 + my3) / 2;
    var midX2 = (mx1 + mx3) / 2;
    var midY1 = (my2 + my4) / 2;
    var midX1 = (mx2 + mx4) / 2;

    return "M" + x1 + "," + y1 + "L" + x2 + "," + y2 + " L " + midX1 + "," + midY1 + " L " + x3 + "," + y3 + " L " + x4 + "," + y4 + " L " + midX2 + "," + midY2 + "z";
}

// var defaultHull = hull.concaveHull();

// import {getRandomIntInclusive} from "./misc";

var radiusOf = () => 20;
var minNodeSize = 0;

var alpha = 1000,
    offset = function(a,dx,dy) {
        return a.map(function(d) { return [d[0]+dx,d[1]+dy]; });
    },

    dsq = function(a,b) {
        var dx = a[0]-b[0], dy = a[1]-b[1];
        return dx*dx+dy*dy;
    },

    asq = alpha*alpha;

    // well, this is where the "magic" happens..


function rectCircleColliding(circle, rect, init){

    // var distX = Math.abs(circle.x - rect.x);
    // var distY = Math.abs(circle.y - rect.y);

    var center = {
        x: circle.x - (rect.x),
        y: circle.y - (rect.y)
    };

    // check circle position inside the rectangle quadrant
    var side = {
        x: Math.abs (center.x) - rect.width / 2,
        y: Math.abs (center.y) - rect.height / 2
      };


    // if (side.x < circle.r && side.y < circle.r) {
    //   console.log("side", side);
    //   // return { bounce: false };
    // } // inside

    if (side.x > circle.r) return { bounce: false };
    if (side.y > circle.r) return { bounce: false };


    var dx = 0, dy = 0;
    if (side.x <= 0 || side.y <=0) {
      if (Math.abs (side.x) < circle.r && side.y < 0)
      {
        dx = center.x*side.x < 0 ? 1 : -1;
      }
      else if (Math.abs (side.y) < circle.r && side.x < 0)
      {
        dy = center.y*side.y < 0 ? 1 : -1;
      }

      return { bounce: init, x:dx, y:dy };
    }

    // circle is near the corner
    var bounce = side.x*side.x + side.y*side.y  < circle.r*circle.r;
    if (!bounce) return { bounce:false };

    var norm = Math.sqrt (side.x*side.x+side.y*side.y);
    dx = center.x < 0 ? 1 : -1;
    dy = center.y < 0 ? 1 : -1;
    return { bounce:true, x: dx*side.x/norm, y: dy*side.y/norm };

}

// function radial(d, alpha, radius, energy, center) {
//     const D2R = Math.PI / 180;
//     var angle = Math.atan2(( d.y + d.width) - center.x, ( d.x + d.width) - center.y);
//     console.log("angle", angle);
//     // var currentAngleRadians = angle * D2R;
//     // console.log("radians", currentAngleRadians);
//
//     var radialPoint = {
//         x: center.x + radius * Math.cos(angle),
//         y: center.y + radius * Math.sin(angle)
//     };
//
//     var affectSize = alpha * energy;
//
//     d.x += (radialPoint.x - d.x) * affectSize;
//     d.y += (radialPoint.y - d.y) * affectSize;
// }


// function boundMargin(node, width, height, margin) {
//   var halfHeight = node.height / 2,
//       halfWidth = node.width / 2;
//
//   if (node.x - halfWidth < margin.left) {
//           node.x = halfWidth + margin.left;
//   }
//   if (node.x + halfWidth > (width - margin.right)) {
//           node.x = (width - margin.right) - halfWidth;
//   }
//
//   if (node.y - halfHeight < margin.top) {
//           node.y = halfHeight + margin.top;
//   }
//   if (node.y + halfHeight > (height - margin.bottom)) {
//           node.y = (height - margin.bottom) - halfHeight;
//   }
// }

function boundPanel(node, coord, energy) {
  var halfHeight = node.height / 2,
      halfWidth = node.width / 2;

  if (node.x - halfWidth < coord.left) {
          node.x = (halfWidth * energy)+ coord.left;
  }
  if (node.x + halfWidth > (coord.right)) {
          node.x = coord.right - (halfWidth * energy);
  }

  if (node.y - halfHeight < coord.top) {
          node.y = (halfHeight * energy) + coord.top;
  }
  if (node.y + halfHeight > coord.bottom) {
          node.y = coord.bottom - (halfHeight * energy);
  }
}

// function boundY(node, height) {
//   var halfHeight = node.height / 2;
//
//   if (node.y + halfHeight > height ) {
//           node.y = height - halfHeight;
//   }
// }

// function boundX(node, width ) {
//   var halfWidth = node.width / 2;
//   if (node.x + halfWidth > width ) {
//           node.x = width - halfWidth;
//   }
// }

function collide(node, padding, energy) {
    return function(quad) {
      var updated = false;
      if (quad.point && (quad.point !== node)) {
        var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                xSpacing = (quad.point.width + node.width + padding) / 2,
                ySpacing = (quad.point.height + node.height + padding) / 2,
                absX = Math.abs(x),
                absY = Math.abs(y),
                l,
                lx,
                ly;

        if (absX < xSpacing && absY < ySpacing) {
            l = Math.sqrt(x * x + y * y) * energy;

            lx = (absX - xSpacing) / l;
            ly = (absY - ySpacing) / l;

            // the one that"s barely within the bounds probably triggered the collision
            if (Math.abs(lx) > Math.abs(ly)) {
                    lx = 0;
            } else {
                    ly = 0;
            }

            node.x -= x *= lx;
            node.y -= y *= ly;
            quad.point.x += x;
            quad.point.y += y;

            updated = true;
        }
      }
      return updated;
    };
}

function create(el, props, state) {
  const allData  = state.data,
        tagData  = allData.filter(d => d.type === "tag"),
        docData  = allData.filter(d => d.type === "doc"),
        timeData = allData.filter(d => d.type === "date"),
        edges    = state.edges,
        height   = props.height,
        width    = props.width,
        margin   = props.margin,
        diameter = 300,
        panels   = props.panels,
        div      = d3.select(el).select("#center-panel"),
        svg      = d3.select("#svg"),
        g        = svg.append("g"),

        force        = this.force;

  const cont = svg.append("g")
    .attr("class", "graph")
    .attr("transform", "translate(" + panels.center.left + "," + panels.center.top + ")");
    // .call(zoomer); //Attach zoom behaviour.
    //
  docData.forEach(d => d.radius = 40);
  console.log("docData", docData);

  // Add a transparent background rectangle to catch
  // mouse events for the zoom behaviour.
  // Note that the rectangle must be inside the element (graph)
  // which has the zoom behaviour attached, but must be *outside*
  // the group that is going to be transformed.
  cont.append("rect")
      .attr("class", "overlay")
      .attr("width", panels.center.width)
      .attr("height", panels.center.height)

    //.style("fill", "none")
    //make transparent (vs black if commented-out)
    .style("pointer-events", "all");

  state.zoomScale = 1;

  var xScale = d3.scale.linear()
                 .domain([ 0, panels.center.width ])
                 .range([panels.center.left, panels.center.right]);

  var yScale = d3.scale.linear()
                 .domain([ 0, panels.center.height ])
                 .range([panels.center.top, panels.center.bottom]);

  var foci = fociLayout()
                // .clusterSize((size) => 1 * size)
                .gravity(0.01)
                .sets(docData)
                .size([panels.center.width, panels.center.height])
                .charge(function (d) {
                  if (this.hasConnections(d)) { console.log("hit connection"); return -10; }
                  else return -300;
                })
                .linkStrength(1)
                .linkDistance((l) => l.intersec.length > 0 ? 200 / (l.intersec.length*3) : 100000)
                .startForce();


  var clusteredDocs = foci.data();

  var drag = force.drag()
          .on("dragstart", () => state.drag = true)
          // .on("drag", d => dragmove(d))
          .on("dragend", () => state.drag = false);

  state.drag = false;
  state.init = true;

  console.log("props", props);
  console.log("state", state);

  // init positions
  (function initPositons(){
    tagData.forEach(d => {
      var m = 1;
      var i = Math.floor(Math.random() * m);
      // var m = i % 7 + 1;
      // d.x = panels.top.cx;
      // d.y = panels.top.cy + Math.random();

      // d.y = getRandomIntInclusive(0, height);
      d.x = Math.cos(i / m * 2 * Math.PI) * 1 + panels.top.cx + Math.random();
      d.y = Math.sin(i / m * 2 * Math.PI) * 1 + panels.top.cy  + Math.random();
      svg.append("circle")
        .attr("cx", d.x)
        .attr("cy", d.y)
        .attr("r", 4)
        .attr("fill", "green");
    });
  }());
  //
  // var x = Math.cos(1 / 1 * 2 * Math.PI) * 200 + width / 2 + Math.random();
  // var y = Math.sin(1 / 1 * 2 * Math.PI) * 200 + height / 2   + Math.random();
  //
  // svg.append("circle")
  //   .attr("cx", x)
  //   .attr("cy", y)
  //   .attr("r", 8)
  //   .attr("fill", "red");

  force.nodes(allData);
  force.links(edges);
  force.size([width, height]);


  (function marginLines() {
    svg
      .call(function() {

        this
          .append("line")
          .attr("class", "testline")
          .attr("x1", margin.left)
          .attr("y1", 0)
          .attr("x2", margin.left)
          .attr("y2", height);

        this
          .append("line")
          .attr("class", "testline")
          .attr("x1", width - margin.right)
          .attr("y1", 0)
          .attr("x2", width - margin.right)
          .attr("y2", height);

        this
          .append("line")
          .attr("class", "testline")
          .attr("x1", 0)
          .attr("y1", margin.top)
          .attr("x2", width)
          .attr("y2", margin.top);

        this
          .append("line")
          .attr("class", "testline")
          .attr("x1", 0)
          .attr("y1", height - margin.bottom)
          .attr("x2", width)
          .attr("y2", height - margin.bottom);


        // circle
        // this
        //   .append("circle")
        //   .attr("class", "circle")
        //   // .style("width",  diameter + "px")
        //   // .style("height", diameter + "px")
        //   .style("cx", width / 2)
        //   .style("cy", height / 2)
        //   .style("r", diameter / 2)
        //   .style("stroke-width", 1)
        //   .style("stroke", "blue")
        //   .style("fill", "#eee");
        //   // .style("transform", "translate(" + (- diameter / 2) + "px,"
        //   //                     + (- diameter / 2) + "px)");

        // center x line
        this
          .append("line")
          .attr("class", "testline")
          .attr("x1", 0)
          .attr("y1", height / 2)
          .attr("x2", width)
          .attr("y2", height / 2);

        // circle line
        this
          .append("line")
          .attr("class", "testline")
          .attr("x1", width / 2 - diameter / 2)
          .attr("y1", 0)
          .attr("x2", width / 2 - diameter / 2)
          .attr("y2", height);

        // circle line
        // this
        //   .append("line")
        //   .attr("class", "testline")
        //   .attr("x1", width / 2 + diameter / 2)
        //   .attr("y1", 0)
        //   .attr("x2", width / 2 + diameter / 2)
        //   .attr("y2", height);
        //
        // var docAreaString = "paper doc area";
        // this
        //   .append("text")
        //   .attr("font-size", 30 + "px")
        //   .attr("fill", "black")
        //   .attr("x", width / 2 - d3MeasureText(docAreaString).width)
        //   .attr("y", height / 2)
        //   .text("paper doc area");

        this
          .append("line")
          .attr("class", "testline")
          .attr("x1", panels.center.left)
          .attr("y1", panels.center.top)
          .attr("x2", panels.center.right)
          .attr("y2", panels.center.top);

        this
          .append("line")
          .attr("class", "testline")
          .attr("x1", panels.center.left)
          .attr("y1", panels.center.bottom)
          .attr("x2", panels.center.right)
          .attr("y2", panels.center.bottom);

    });
  }());

  var tag = div.selectAll("div.word")
     .data(tagData, d => d.key)
     .enter()
     .append("div")
     .call(function() {
        var wordScale = d3.scale.linear()
          .domain(d3.extent(tagData, d => d.values.length))
          .rangeRound([12, 30], 0, 0);

        this
          .attr("class", "word")
          .style("font-size", d => wordScale(d.values.length) + "px")
          .text(d => d.key)
          .call(drag);
          // .on("dragstart", () => {
          //                          console.log("state.drag");
          //                          state.drag = true; })
          // .on("dragend", () => state.drag = false);

        this.each(function(d){
          d.height = Math.ceil(this.getBoundingClientRect().height);
          d.width = Math.ceil(this.getBoundingClientRect().width);
        });

      this
          .style("transform", d => "translate(" + (-d.width / 2) + "px," + (-d.height/ 2) + "px)");

      // this.on("click", d => console.log("inside circle", ));

     });

  var doc = div.selectAll(".doc")
    .data(clusteredDocs, d => d.id);

  doc.enter()
    .insert("div", ":first-child")
    .attr("class", "doc")
    .call(function() {

      this.each(function(d){
        d.height = Math.ceil(this.getBoundingClientRect().height);
        d.width = Math.ceil(this.getBoundingClientRect().width);
        // d.fixed = true;
      });

      this.on("click", d => console.log(d.tags));
      this
        .on("mouseover", d => {
          if (d.drag) return;
          if (force.alpha() > 0.1) return;
          !d.selected ? d.selected = true : d.selected = false;
          // force.start();

          // var targets = d3.selectAll(".word")
          //                 .filter(e => d.tags.indexOf(e.key) !== -1);


          // var lines = d3.select("#svg").selectAll(".line")
          //                  .data(targets.data());
          //
          // lines.enter()
          //  .append("line")
          //    .attr("class", "line")
          //    .attr("x1", d.hx())
          //    .attr("y1", d.hy())
          //    .attr("x2", e => e.hx())
          //    .attr("y2", e => e.hy());

        })
        .on("mouseout", d => {
          // d3.selectAll(".line").remove();
          if (d.drag) return;
          if (force.alpha() > 0.1) return;

          // tagData.forEach(d => {
          //   d.fixed = false;
          //   d.x = d.px;
          //   d.y = d.py;
          // });

          d.selected = false;
          // d.fixed = false;
          // force.start();
        });
    }).call(force.drag);

  var dot = (function timeline() {
    var xTimeScale = d3.time.scale()
    .domain(d3.extent(timeData , d => d.date))
    .rangeRound([panels.bottom.left, panels.bottom.right] );

    g
    .attr("class", "x axis")
    .attr("transform", "translate(0," + panels.bottom.cy + ")")
    .call(function() {

      var xAxis = d3.svg.axis()
        .scale(xTimeScale);

      xAxis(this);

      this.selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    });

    // TODO: fix height
    var dot = div.selectAll(".dot")
    .data(timeData, d => d.id)
    .enter()
    .append("div")
    .call(function() {
      this.attr("class", "dot")
        .style("background", "red");

      this.each(function(d){
        d.height = Math.ceil(this.getBoundingClientRect().height);
        d.width = Math.ceil(this.getBoundingClientRect().width);
        d.xt = xTimeScale(d.date);
        d.yt = panels.bottom.cy;
      });

      this.style("transform",
                 d => "translate(" + (-d.width / 2) + "px," + (-d.height / 2) + "px)");
    });

    return dot;
  })();

// function polygon(d) {
//   return "M" + d.join("L") + "Z";
// }
//     var voronoi = d3.geom.voronoi()
//         .clipExtent([[0, 0], [panels.center.width, panels.center.height]]);
//
//
//     var vn = voronoi(tagSets.map(d => [d.x, d.y]));
//     // console.log("vn", vn);
//     var path = svg.append("g").attr("transform", "translate("+ [panels.center.left, panels.center.top] + ")")
//       .selectAll("path")
//         .data(vn, polygon);
//
//     path.enter().append("path")
//         .attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
//         .attr("d", polygon);

  //   var backdrop = svg.selectAll(".bd")
  //     .data(tagSets);
  //
  // backdrop.enter()
  //   .append("circle")
  //   .attr("class", "bd")
  //   .attr("r", d => d.size * 10)
  //   .attr("fill", "grey")
  //   .attr("cx", d => panels.center.left + d.center.x)
  //   .attr("cy", d => panels.center.top + d.center.y);

  // var link = svg.selectAll(".link")
  //       .data(edges, d => d.id)
  //     .enter().append("path")
  //       .attr("class", "link");

  var fociLinks = foci._fociLinks;

  console.log("fociLinks", fociLinks);

  var spreadFociNodes = fociLinks.map(l => {
      return l.source.nodes.concat(l.target.nodes);
  });

  var forceEdges = _.flattenDeep(fociLinks.map(l => {
      return l.source.nodes.map(s => {
        return l.target.nodes.map(t => {
          return {
            source: force.nodes().findIndex(d => d.id === s.id),
            target: force.nodes().findIndex(d => d.id === t.id),
            intersec: l.intersec
          };
        });
      });
  }));

  force.links(forceEdges);

  console.log("forceEdges", forceEdges);

  // var taffyEdge = svg
  //   .selectAll(".taffy")
  //     .data(force.links());
  //
  //   taffyEdge.enter()
  //     .append("path");

  // render layout
  (function applyTicker() {
    // var xLeftScale = d3.scale.ordinal()
    //   .domain(docData.map(d => d.id))
    //   .rangeRoundBands([panels.top.left, panels.top.right - docWidth]);
    //
    // var xRightScale = d3.scale.ordinal()
    //   .domain(docData.map(d => d.id))
    //   .rangeRoundBands([cSec.left, cSec.right - docWidth]);



    // var groupPathLess = function(d) {
    //     var fakePoints = [];
    //     d.forEach(function(e) {
    //       var x = xScale(e.x) + e.width / 2;
    //       var y = yScale(e.y) + e.height / 2;
    //       fakePoints = fakePoints.concat([   // "0.7071" is the sine and cosine of 45 degree for corner points.
    //            [(x), (y + (e.radius))],
    //            [(x + (0.7071 * (e.radius))), (y + (0.7071 * e.radius))],
    //            [(x + e.radius), (y)],
    //            [(x + (0.7071 * (e.radius))), (y - (0.7071 * e.radius))],
    //            [(x), (y - e.radius)],
    //            [(x - (0.7071 * (e.radius))), (y - (0.7071 * e.radius))],
    //            [(x - (e.radius)), (y)],
    //            [(x - (0.7071 * (e.radius))), (y + (0.7071 * e.radius))]
    //       ]);
    //     });
    //     return "M" + d3.geom.hull( fakePoints ).join("L") + "Z";
    // };


    function moveToPos(d, pos, affectSize) {
      // var affectSize = alpha * energy;
      d.x = d.x + (pos.x - d.x) * affectSize;
      d.y = d.y + (pos.y - d.y) * affectSize;
    }

    var zoomScale = d3.scale.linear()
                  .domain([0.1, 10])
                  .range([10, 40]);
    // var docWidth = d3.select(".doc").data()[0].width;
    // var docHeight = d3.select(".doc").data()[0].width;
    var tick = function(e) {
      doc.each(d => {
        d.xs = xScale(d.x);
        d.ys = yScale(d.y);
      });

      var q = d3.geom.quadtree(tagData);
        tagData.forEach(d => {
          q.visit(collide(d, 0, 100));
          var circle={x:width/2,y:height/2,r:diameter / 2};
          var collision = rectCircleColliding(circle, d, state.init);
          if (collision.bounce) {
            d.x = d.x + (collision.x * d.x) * e.alpha;
            d.y = d.y + (collision.y * d.y) * e.alpha;
          }
          boundPanel(d, panels.top, 1);
        });

      // tag.each(moveToPos({x: width/2, y: height / 6 }, e.alpha, eW));

      // var q2 = d3.geom.quadtree(clusteredDocs);
      doc.each(d => {
        // var x = i % 2 === 0 ? xLeftScale(d.id) : xRightScale(d.id);
        // var x = xScale(d.id);
        // var y = height / 2  - d.height / 2;
        moveToPos(d, {x: d.center.x, y: d.center.y},
                  e.alpha * 2);
        // d.fixed = true;
                  //
        // q2.visit(collide(d, 0, 1));
        // boundPanel(d, panels.center, 1);
      });

      dot.each(d => {
        var affectSize = e.alpha * 10;
        d.x += (d.xt - d.x) * affectSize;
        d.y += (d.yt - d.y) * affectSize;
      });

      tag
        .style("left", d => d.x + "px")
        .style("top", d => d.y + "px");

      // var docW = zoomScale(state.zoomScale);
      doc
        // .style("width", docW + "px")
        // .style("height", zoomScale(state.zoomScale) + "px")
        .style("left", d => xScale(d.x) + "px")
        .style("top", d => yScale(d.y) + "px");

      dot
        .style("left", d => d.x + "px")
        .style("top", d => d.y + "px");

      // link.attr("d", function(d) {
      //   return "M" + xScale(d.source.x) + "," + yScale( d.source.y )
      //       // + "S" + d[1].x + "," + d[1].y
      //       + " " + d.target.x + "," + d.target.y;
      //   // return "M" + d[0].x + "," + d[0].y
      //   //     + "S" + d[1].x + "," + d[1].y
      //   //     + " " + d[2].x + "," + d[2].y;
      // });

      // svg.selectAll(".group").remove();
      // svg.selectAll(".group")
      //     .data(groupNodes)
      //       .attr("d", groupPath)
      //     .enter().insert("path", "circle")
      //       .style("fill", "none")
      //       .style("stroke", "black")
      //       .style("stroke-width", 5)
      //       .style("stroke-linejoin", "round")
      //       .style("opacity", 0.4)
      //       .attr("class","group")
      //       .attr("d", groupPath);

      // svg.selectAll(".group").remove();
      // svg.selectAll(".allGroup")
      //     .data([docData])
      //       .attr("d", groupPath)
      //     .enter().insert("path", "circle")
      //       .style("fill", "none")
      //       .style("stroke", "black")
      //       .style("stroke-width", 5)
      //       .style("stroke-linejoin", "round")
      //       .style("opacity", 0.4)
      //       .attr("class","group")
      //       .attr("d", groupPath);

      // taffyEdge.attr("d", d => taffyEdges(d, 10, 10, 3));
    };

    force.on("tick", tick);
    force.start();
  })();


    var groupPath = function(d) {
        var fakePoints = [];
        d.forEach(function(e) {
          // var x = e.x; // + e.width / 2;
          // var y = e.y; // + e.height / 2;
          var x = xScale(e.x);
          var y = yScale(e.y);
          // console.log("x", e.x, "y", e.y);
          fakePoints = fakePoints.concat([   // "0.7071" is the sine and cosine of 45 degree for corner points.
               [(x), (y + (radiusOf(e) - minNodeSize))],
               [(x + (0.7071 * (radiusOf(e) - minNodeSize))), (y + (0.7071 * (radiusOf(e) - minNodeSize)))],
               [(x + (radiusOf(e) - minNodeSize)), (y)],
               [(x + (0.7071 * (radiusOf(e) - minNodeSize))), (y - (0.7071 * (radiusOf(e) - minNodeSize)))],
               [(x), (y - (radiusOf(e) - minNodeSize))],
               [(x - (0.7071 * (radiusOf(e) - minNodeSize))), (y - (0.7071 * (radiusOf(e) - minNodeSize)))],
               [(x - (radiusOf(e) - minNodeSize)), (y)],
               [(x - (0.7071 * (radiusOf(e) - minNodeSize))), (y + (0.7071 * (radiusOf(e) - minNodeSize)))]
          ]);
        });
        // var path = [{X:10,Y:10},{X:110,Y:10},{X:110,Y:110},{X:10,Y:110}];
        var hull = d3.geom.hull( fakePoints );
        var path = hull.map(d => {
          return {X: d[0], Y: d[1]};
        });
        var co = new ClipperLib.ClipperOffset(2, 0.25);
        co.AddPath(path, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
        console.log("co", co);
        var solution = new ClipperLib.Paths();
        co.Execute(solution, 50);
        console.log("sol", solution);
        var skel_hull = solution[0].map(d => [d.X, d.Y]);
        console.log("skel_hull", skel_hull);

        return "M" + skel_hull.join("L") + "Z";
        // return null;
    };
  force.on("end", () => {
    console.log("spreadFociNodes", spreadFociNodes);
    // var groupNodes = spreadFociNodes.map(d => d.values);
    var testCl = spreadFociNodes.find(d => d.length === 12);
    console.log("testCl", testCl);
    var tNodes = testCl.map(d => [xScale(d.x), yScale(d.y)]);
    var mesh = d3.geom.delaunay(offset(tNodes, 0, 0)).filter(function(t) {
        return dsq(t[0],t[1]) < asq && dsq(t[0],t[2]) < asq && dsq(t[1],t[2]) < asq;
    });
    console.log("mesh", mesh);
    console.log("groupNodes", tNodes);

    // svg.selectAll(".group").remove();
    // svg.selectAll(".group")
    //     .data(spreadFociNodes)
    //       .attr("d", groupPath)
    //     .enter().insert("path", "circle")
    //       .style("fill", "none")
    //       .style("stroke", "black")
    //       .style("stroke-width", 5)
    //       .style("stroke-linejoin", "round")
    //       .style("opacity", 0.4)
    //       .attr("class","group")
    //       .attr("d", groupPath);
    // var grouped = groupNodes.map(groupPath);
    // console.log("grouped", grouped);
    // console.log("groupNodes", groupNodes);
    //
      // svg.selectAll(".group").remove();
      // svg.selectAll(".group")
      //     .data([testCl])
      //       .attr("d", groupPath)
      //     .enter().insert("path", "circle")
      //       .style("fill", "none")
      //       .style("stroke", "black")
      //       .style("stroke-width", 5)
      //       .style("stroke-linejoin", "round")
      //       .style("opacity", 0.4)
      //       .attr("class","group")
      //       .attr("d", groupPath);
    //
    //

    // svg
    //   .selectAll(".contMesh")
    //     .data([mesh])
    //   .enter()
    //     .append("g")
    //     .attr("class", "contMesh")
    //     .selectAll(".mesh")
    //     .data(d => {
    //       var nodes = d.map(d => [xScale(d.x), yScale(d.y)]);
    //       console.log("nodes", nodes);
    //       var mesh = d3.geom.delaunay(nodes.filter(function(t) {
    //         return dsq(t[0],t[1]) < asq && dsq(t[0],t[2]) < asq && dsq(t[1],t[2]) < asq;
    //       }));
    //       console.log("mesh", mesh);
    //       return mesh;
    //     })
    //     .append("path")
    //     .attr("class", "mesh")
    //     .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
    //     .attr("fill", "black")
    //     .style("fill", "green")
    //     .style("stroke", "none")
    //     // .style("stroke-width", 5)
    //     .style("stroke-linejoin", "round")
    //     .style("opacity", 0.4);
    //   });

    // console.log("concave Hull", d3.layout.concaveHull);
    //

    svg
      .selectAll(".contMesh")
      .data([clusterData])
      .enter()
      .append("g")
      .attr("class", "contMesh")
      // .selectAll(".mesh")
      //   .data(l => {
      //     // var vertices = d.map(d => [xScale(d.x), yScale(d.y)]);
      //     var fakePoints = [];
      //
      //     l.forEach( d => {
      //       var x = xScale(d.x); // + e.width / 2;
      //       var y = yScale(d.y); // + e.height / 2;
      //       // var sx = xScale(l.source.x) + l.source.width / 2;
      //       // var sy = yScale(l.source.y) + l.source.height / 3;
      //
      //       // console.log("x", e.x, "y", e.y);
      //       var fac = 1;
      //       var exp = 0;
      //
      //       // var tx = xScale(l.target.x) + l.target.width / 2;
      //       // var ty = yScale(l.target.y) + l.target.height / 3;
      //
      //       fakePoints = fakePoints.concat([   // "0.7071" is the sine and cosine of 45 degree for corner points.
      //            [(x + (0.7071 * fac)), (y + (0.7071 * fac))],
      //            [(x + (0.7071 * fac)), (y - (0.7071 * fac))],
      //            [(x - (0.7071 * fac)), (y - (0.7071 * fac))],
      //            [(x - (0.7071 * fac)), (y + (0.7071 * fac))],
      //            [x, (y + fac + exp)],
      //            [(x + fac + exp), y],
      //            [x, (y - fac - exp)],
      //            [(x - fac - exp), y]
      //       ]);
      //
      //       // fakePoints = fakePoints.concat([   // "0.7071" is the sine and cosine of 45 degree for corner points.
      //       //      [(x + (0.7071 * fac)), (y + (0.7071 * 2 * fac))],
      //       //      [(x + (0.7071 * fac)), (y - (0.7071 * 2 * fac))],
      //       //      [(x - (0.7071 * fac)), (y - (0.7071 * 2 * fac))],
      //       //      [(x - (0.7071 * fac)), (y + (0.7071 * 2 * fac))],
      //       //      [x, (y + fac + exp)],
      //       //      [(x + fac + exp), y],
      //       //      [x, (y - fac - exp)],
      //       //      [(x - fac - exp), y]
      //       // ]);
      //       //
      //       });
      //       console.log("fakePoints", fakePoints);
      //       var retHull = d3.geom.hull(fakePoints);
      //       console.log("retHull", retHull);
      //       // var sH = retHull;
      //       // console.log("retHull", retHull);
      //       // console.log("scale Hull", sH);
      //       // l.h = retHull[0];
      //
      //       return retHull;//straight_skeleton(l.h, 10);
      //       // var tNodes = d.map(d => [xScale(d.x), yScale(d.y)]);
      //       // var mesh = d3.geom.delaunay(tNodes, 0, 0).filter(function(t) {
      //       //     return dsq(t[0],t[1]) < asq && dsq(t[0],t[2]) < asq && dsq(t[1],t[2]) < asq;
      //       // });
      //       // return mesh;
      //   })
      .append("path")
        .attr("class", "mesh")
        // .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
        .attr("d", groupPath)
        .style("fill", "none")
        // .attr("fill", "green")
        .style("stroke", "black")
        .attr("stroke-linejoin", "round");
        // .attr("stroke-width", 3)
        // .attr("opacity", 0.3);
        //
      });



  /*** Configure zoom behaviour ***/
  var zoomer = d3.behavior.zoom()
                  .scaleExtent([1,10])
          //allow 10 times zoom in or out
                  .on("zoom", zoom)
          //define the event handler function
          // TODO: change for resize
                  .x(xScale)
                  .y(yScale);

  var cHull = d3.geom.hull;//d3.layout.concaveHull().padding(30).distance(200);
  var clusterData = spreadFociNodes.find(d => d.length > 13);
  console.log("clusterData", clusterData);

  function zoom() {
      // console.log("zoom", d3.event.translate, d3.event.scale);
      state.zoomScale = d3.event.scale;
      console.log("zoomScale", state.zoomScale);
      console.log(doc.each(d => console.log(d.xs)));

      // d3.selectAll(".mesh")
      //   .attr("d", function(d) {
      //     var zH = straight_skeleton(d, 20 * d3.event.scale);
      //     return "M" + zH.join("L") + "Z";
      //   });
      // scaleFactor = d3.event.scale;
      // translation = d3.event.translate;

    svg
      .selectAll(".contMesh").remove();

      force.resume(); //update positions
  }

  div.call(zoomer);
}



const d3TagCloud = new function(){
  var force = d3.layout.force()
                .charge(d => {
                  if (d.type === "doc")
                    return 0;
                  else return -2;
                  // return 0;
                })
                .linkStrength(0)
                // .linkDistance(50)
                // .chargeDistance(200)
                .gravity(0)
                // .friction(0.4)
                .theta(1);
  // force = cola.d3adaptor()
          // .linkDistance(10);
          // .avoidOverlaps(true);
  return {
    force: force,
    update: null,
    create: create

  };
};

export default d3TagCloud;
