import d3 from "d3";
// import _ from "lodash";
import {getRandomIntInclusive} from "./misc";

// function pythag(r, b, coord) {
//     var hyp2 = Math.pow(radius, 2);
//     // r += nodeBaseRad;
//
//     // force use of b coord that exists in circle to avoid sqrt(x<0)
//     b = Math.min(w - r - strokeWidth, Math.max(r + strokeWidth, b));
//
//     var b2 = Math.pow((b - radius), 2),
//         a = Math.sqrt(hyp2 - b2);
//
//     // radius - sqrt(hyp^2 - b^2) < coord < sqrt(hyp^2 - b^2) + radius
//     coord = Math.max(radius - a + r + strokeWidth,
//                 Math.min(a + radius - r - strokeWidth, coord));
//
//     return coord;
// }



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


function radial(d, alpha, radius, energy, center) {
    const D2R = Math.PI / 180;
    var angle = Math.atan2(( d.y + d.width) - center.x, ( d.x + d.width) - center.y);
    console.log("angle", angle);
    // var currentAngleRadians = angle * D2R;
    // console.log("radians", currentAngleRadians);

    var radialPoint = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
    };

    var affectSize = alpha * energy;

    d.x += (radialPoint.x - d.x) * affectSize;
    d.y += (radialPoint.y - d.y) * affectSize;
}

function boundMargin(node, width, height, margin) {
  var halfHeight = node.height / 2,
      halfWidth = node.width / 2;

  if (node.x - halfWidth < margin.left) {
          node.x = halfWidth + margin.left;
  }
  if (node.x + halfWidth > (width - margin.right)) {
          node.x = (width - margin.right) - halfWidth;
  }

  if (node.y - halfHeight < margin.top) {
          node.y = halfHeight + margin.top;
  }
  if (node.y + halfHeight > (height - margin.bottom)) {
          node.y = (height - margin.bottom) - halfHeight;
  }
}

function boundY(node, height) {
  var halfHeight = node.height / 2;

  if (node.y + halfHeight > height ) {
          node.y = height - halfHeight;
  }
}

function boundX(node, width ) {
  var halfWidth = node.width / 2;
  if (node.x + halfWidth > width ) {
          node.x = width - halfWidth;
  }
}

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
            l = Math.sqrt(x * x + y * y);

            lx = (absX - xSpacing) / l;
            ly = (absY - ySpacing) / l;

            // the one that"s barely within the bounds probably triggered the collision
            if (Math.abs(lx) > Math.abs(ly)) {
                    lx = 0;
            } else {
                    ly = 0;
            }

            node.x -= x *= lx * energy;
            node.y -= y *= ly * energy;
            quad.point.x += x * energy;
            quad.point.y += y * energy;

            updated = true;
        }
      }
      return updated;
    };
}

function create(el, props, state) {
  const allData      = state.data,
        tagData      = allData.filter(d => d.type === "tag"),
        docData      = allData.filter(d => d.type === "doc"),
        timeData     = allData.filter(d => d.type === "date"),
        edges        = state.edges,
        height       = props.height,
        width        = props.width,
        margin       = props.margin,
        diameter     = 300,
        maxLeftX     = width / 2 - diameter / 2,
        // minRightX    = width / 2 + diameter / 2,
        // padding      = 40,
        force        = this.force;


  var drag = force.drag()
          .on("dragstart", () => state.drag = true)
          // .on("drag", d => dragmove(d))
          .on("dragend", () => state.drag = false);

  state.drag = false;
  state.init = true;

  const aSec = {
    x0: margin.left,
    y0: margin.top,
    x1: width / 2 - diameter / 2,
    y1: height / 2
  };
  aSec.cx = (aSec.x1 - aSec.x0) / 2;
  aSec.cy = (aSec.y1 - aSec.y0) / 2;


  const bSec = {
    x0: aSec.x1,
    y0: margin.top,
    x1: width / 2 + diameter / 2,
    y1: height / 2
  };
  bSec.cx = width / 2;
  bSec.cy = (bSec.y1 - bSec.y0) / 2;

  const cSec = {
    x0: bSec.x1,
    y0: margin.top,
    x1: width - margin.right,
    y1: height / 2
  };
  cSec.cx = cSec.x0 + (cSec.x1 - cSec.x0) / 2;
  cSec.cy = (cSec.y1 - cSec.y0) / 2;


  const dSec = {
    x0: margin.left,
    y0: height / 2,
    x1: width / 2 - diameter / 2,
    y1: height - margin.top
  };
  dSec.cx = dSec.x0 + (dSec.x1 - dSec.x0) / 2;
  dSec.cy = dSec.y0 + (dSec.y1 - dSec.y0) / 2;


  const eSec = {
    x0: aSec.x1,
    y0: height / 2,
    x1: width / 2 + diameter / 2,
    y1: height - margin.top
  };
  eSec.cx = width / 2;
  eSec.cy = eSec.y0 + (eSec.y1 - eSec.y0) / 2;


  const fSec = {
    x0: eSec.x1,
    y0: height / 2,
    x1: width - margin.right,
    y1: height - margin.top
  };
  fSec.cx = fSec.x0 + (fSec.x1 - fSec.x0) / 2;
  fSec.cy = fSec.y0 + (fSec.y1 - fSec.y0) / 2;


  const div = d3.select(el),
        svg = d3.select("#svg"),
        g = svg.append("g");

  console.log("props", props);
  console.log("state", state);

  // init positions
  tagData.forEach((d, i) => {
    // var m = i % 7 + 1;
    d.x = width / 2;
    d.y = height / 8 + Math.random();

    // d.y = getRandomIntInclusive(0, height);
    // d.x = Math.cos(i / m * 2 * Math.PI) * 100 + ( width / 4 - margin.left - margin.right) + Math.random();
    // d.y = Math.sin(i / m * 2 * Math.PI) * 100 + ( height / 4 - margin.bottom - margin.top)  + Math.random();
    svg.append("circle")
      .attr("cx", d.x)
      .attr("cy", d.y)
      .attr("r", 4)
      .attr("fill", "green");
    //Math.sin(i / 1 * 2 * Math.PI) * 100 + 100 + Math.random();
  });
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


  svg
  // make margins visible
    .call(function() {

      this
        .append("text")
        .attr("font-size", 30 + "px")
        .attr("fill", "black")
        .attr("x", aSec.cx)
        .attr("y", aSec.cy)
        .text("Dim A");

      this
        .append("text")
        .attr("font-size", 30 + "px")
        .attr("fill", "black")
        .attr("x", bSec.cx)
        .attr("y", bSec.cy)
        .text("Dim B");


      this
        .append("text")
        .attr("font-size", 30 + "px")
        .attr("fill", "black")
        .attr("x", cSec.cx)
        .attr("y", cSec.cy)
        .text("Dim C");

      this
        .append("text")
        .attr("font-size", 30 + "px")
        .attr("fill", "black")
        .attr("x", dSec.cx)
        .attr("y", dSec.cy)
        .text("Dim D");

      this
        .append("text")
        .attr("font-size", 30 + "px")
        .attr("fill", "black")
        .attr("x", eSec.cx)
        .attr("y", eSec.cy)
        .text("Dim E");

      this
        .append("text")
        .attr("font-size", 30 + "px")
        .attr("fill", "black")
        .attr("x", fSec.cx)
        .attr("y", fSec.cy)
        .text("Dim F");


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
      this
        .append("circle")
        .attr("class", "circle")
        // .style("width",  diameter + "px")
        // .style("height", diameter + "px")
        .style("cx", width / 2)
        .style("cy", height / 2)
        .style("r", diameter / 2)
        .style("stroke-width", 1)
        .style("stroke", "blue")
        .style("fill", "#eee");
        // .style("transform", "translate(" + (- diameter / 2) + "px,"
        //                     + (- diameter / 2) + "px)");

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
      this
        .append("line")
        .attr("class", "testline")
        .attr("x1", width / 2 + diameter / 2)
        .attr("y1", 0)
        .attr("x2", width / 2 + diameter / 2)
        .attr("y2", height);
    });


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
    .data(docData, d => d.id);

  doc.enter()
    .insert("div", ":first-child")
    .attr("class", "doc")
    .call(function() {

      this.each(function(d){
        d.height = Math.ceil(this.getBoundingClientRect().height);
        d.width = Math.ceil(this.getBoundingClientRect().width);
      });

      this
        .on("mouseover", d => {
          if (d.drag) return;
          if (force.alpha() > 0.1) return;
          !d.selected ? d.selected = true : d.selected = false;
          force.start();

          var targets = d3.selectAll(".word")
                          .filter(e => d.tags.indexOf(e.key) !== -1);


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
          force.start();
        });
  });

  var xTimeScale = d3.time.scale()
      .domain(d3.extent(timeData , d => d.date))
      .rangeRound([aSec.x0, cSec.x1] );

  g
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.bottom - 100) + ")")
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
        });

        this.style("transform",
          d => "translate(" + (-d.width / 2) + "px,"
          + (-d.height / 2) + "px)");
      });

  var link = svg.selectAll(".link")
        .data(edges, d => d.id)
      .enter().append("path")
        .attr("class", "link");


  var docWidth = d3.select(".doc").data()[0].width;
  var xLeftScale = d3.scale.ordinal()
    .domain(docData.map(d => d.id))
    .rangeRoundBands([aSec.x0, aSec.x1 - docWidth]);

  var xRightScale = d3.scale.ordinal()
    .domain(docData.map(d => d.id))
    .rangeRoundBands([cSec.x0, cSec.x1 - docWidth]);

  // render layout
  force.on("tick", function(e) {
    function moveToPos(d, pos, alpha, energy) {
        var affectSize = alpha * energy;
        d.x = d.x + (pos.x - d.x) * affectSize;
        d.y = d.y + (pos.y - d.y) * affectSize;
    }

    var q = d3.geom.quadtree(tagData);
    tagData.forEach(d => {
      q.visit(collide(d, 10, 1));
      var circle={x:width/2,y:height/2,r:diameter / 2};
      var collision = rectCircleColliding(circle, d, state.init);
      if (collision.bounce) {
        // console.log("point in circle", collision);
        d.x = d.x + (collision.x * d.x) * e.alpha;
        d.y = d.y + (collision.y * d.y) * e.alpha;
        // console.log("d.x", d.x, "d.y", d.y);
      }
      var maxHeight = height / 2 - d.height / 2 - 50;
      boundMargin(d, width, maxHeight, margin);
        // radial(d, e.alpha, diameter / 2, 1, {x: width / 2, y: height / 2});
    });

    // tag.each(moveToPos({x: width/2, y: height / 6 }, e.alpha, eW));

    doc.each((d, i) => {
      var x = i % 2 === 0 ? xLeftScale(d.id) : xRightScale(d.id);
      var y = height / 2  - d.height / 2;
      moveToPos(d, {x: x, y: y}, e.alpha, 1);

      boundY(d, height / 2 );

      var maxWidth = i % 2 === 0 ? maxLeftX : width - margin.right;
      boundX(d, maxWidth);
    });


    dot.each(d => {
      var affectSize = e.alpha * 1;
      d.x += (xTimeScale(d.date) - d.x) * affectSize;
      d.y += (height - margin.bottom - 100 - d.y) * affectSize;
    });

    tag
      .style("left", d => d.x + "px")
      .style("top", d => d.y + "px");

    doc
      .style("left", d => d.x + "px")
      .style("top", d => d.y + "px");

    dot
      .style("left", d => d.x + "px")
      .style("top", d => d.y + "px");

    link.attr("d", function(d) {
          return "M" + d.source.x + "," + d.source.y
              // + "S" + d[1].x + "," + d[1].y
              + " " + d.target.x + "," + d.target.y;
          // return "M" + d[0].x + "," + d[0].y
          //     + "S" + d[1].x + "," + d[1].y
          //     + " " + d[2].x + "," + d[2].y;
        });

  });

  force.start()
       .on("end", () => state.init = false);
}



const d3TagCloud = new function(){
  var force = d3.layout.force()
                .charge(d => {
                  if (d.type === "doc")
                    return d.selected ? (- 5000) : 0;
                  else return 0;
                })
                .linkStrength(0)
                .linkDistance(1000)
                .chargeDistance(200)
                .gravity(0)
                // .friction(0.4);
                .theta(1);
  return {
    force: force,
    update: null,
    create: create
  };
};

export default d3TagCloud;
