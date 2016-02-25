import d3 from "d3";
// import _ from "lodash";
import {getRandomIntInclusive} from "./misc";

function checkBounds(node, width, height, margin) {
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
  const allData = state.data,
        tagData = allData.filter(d => d.type === "tag"),
        docData = allData.filter(d => d.type === "doc"),
        edges   = state.edges,
        height  = props.height,
        width   = props.width,
        margin  = props.margin,
        force   = this.force;

  const div = d3.select(el),
        svg = d3.select("#svg"),
        g = svg.append("g");

  console.log("props", props);
  console.log("state", state);

  tagData.forEach((d, i) => {
    // d.x = width / 2;
    // d.x = Math.cos(i / 1 * 2 * Math.PI) * 300 + width/3 + Math.random();
    d.y = getRandomIntInclusive(0, height);
    //Math.sin(i / 1 * 2 * Math.PI) * 100 + 100 + Math.random();
  });

  force.nodes(allData);
  force.links(edges);
  force.size([props.width, props.height]);

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
          .call(force.drag);

        this.each(function(d){
          d.height = Math.ceil(this.getBoundingClientRect().height);
          d.width = Math.ceil(this.getBoundingClientRect().width);
        });

       this
          .style("transform", d => "translate(" + (-d.width / 2) + "px," + (-d.height/ 2) + "px)");
     });

  var doc = div.selectAll(".doc")
    .data(docData, d => d.id);

  doc.enter()
    .insert("div", ":first-child")
    .call(function() {

    var xScale = d3.scale.ordinal()
      .domain(docData.map(d => d.id))
      .rangeRoundBands([props.margin.left, props.width + props.margin.left]);

      // TODO: cleanUp
      var doc = this
        .attr("class", "doc")
        .append("span")
        .attr("class", "content");
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
          //
      this.each(function(d){
        d.height = this.getBoundingClientRect().height;
        d.width = this.getBoundingClientRect().width;
      });

      this.each(function(d){
        d.height = this.getBoundingClientRect().height;
        d.width = this.getBoundingClientRect().width;
        d.fx = xScale(d.id);

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
          if (d.drag) return;
          if (force.alpha() > 0.1) return;
          !d.selected ? d.selected = true : d.selected = false;
          force.start();

          console.log("d.tags", d.tags);
          var targets = d3.selectAll(".word")
                          .filter(e => d.tags.indexOf(e.key) !== -1);

          console.log("targets", targets);

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


  g
    .attr("class", "x axis")
    .attr("transform", "translate(0," + 600 + ")")
    .call(function() {
      var xTimeScale = d3.time.scale()
          .domain(d3.extent(docData , d => new Date(d.createdDate)))
          .rangeRound([margin.left, width - margin.right] );

      var xAxis = d3.svg.axis()
          .scale(xTimeScale);

      xAxis(this);

      this.selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");


      this.selectAll(".dot")
        .data(docData, d => d.id)
        .enter()
        .append("circle")
        .call(function() {
          this
            .attr("class", "dot")
            .attr("r", 3.5)
            .attr("cx", d => xTimeScale(new Date(d.createdDate)))
            .attr("cy", 0)
            .style("fill", "red");
        });
    });

  var link = svg.selectAll(".link")
        .data(edges, d => d.id)
      .enter().append("path")
        .attr("class", "link");

  force.on("tick", function(e) {
    // function moveToPos(pos, alpha, energy) {
    //     var affectSize = alpha * energy;
    //     return function(d) {
    //         d.x = d.x + (pos.x - d.x) * affectSize;
    //         d.y = d.y + (pos.y - d.y) * affectSize;
    //     };
    // }
    // function moveToY(y, alpha, energy) {
    //     var affectSize = alpha * energy;
    //     return function(d) {
    //         d.y = d.y + (y - d.y) * affectSize;
    //     };
    // }

    var q = d3.geom.quadtree(tagData);
    tagData.forEach(d => {
      q.visit(collide(d, 10, 1));
      checkBounds(d, width, 400, margin);
    });

    // tag.each(moveToPos({x: width/2, y: height / 6 }, e.alpha, eW));

    doc.filter(d => !d.drag).each(d => {
      var affectSize = e.alpha * 1;
      d.x += (d.fx - d.x) * affectSize;
      d.y += (props.height / 2 - d.y) * affectSize;
    });

    tag
      .style("left", d => d.x + "px")
      .style("top", d => d.y + "px");

    doc
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

  this.force.start();
}



const d3TagCloud = new function(){
  var force = d3.layout.force()
                .charge(d => {
                  if (d.type === "doc")
                    return d.selected ? (- d.width * 4) : 0;
                  else return 0;
                })
                .linkStrength(0.01)
                .linkDistance(50)
                .chargeDistance(100)
                .gravity(0)
                .friction(0.7);
                // .theta(1);
  return {
    force: force,
    update: null,
    create: create
  };
};

export default d3TagCloud;
