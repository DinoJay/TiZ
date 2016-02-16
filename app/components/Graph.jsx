import React from "react";
import d3ggLayout from "../lib/d3ggLayout.js";
import _ from "lodash";
import ReactDOM from "react-dom";
import d3 from "d3";

import {
  margin,
  width,
  height

} from "../lib/misc.js";

var linkedByIndex = new function() {
  return {
    index: {},
    nodes: [],
    init: function(nodes, links) {
      links.forEach(l => this.index[l.source + "," + l.target] = l);
      this.nodes = nodes;
      return this;
    },
    nbs: function(a, type) {
      var nbs = [];
      this.nodes.forEach(b => {
        if (a.i !== b.i && this.index[a.i + "," + b.i]) {
          b.linkedBy = this.index[a.i + "," + b.i];
          if (b.linkedBy.type === type) nbs.push(b);
          else if (!type) nbs.push(b);
        }
      });
      return nbs;
    }
  };
};

var Graph = React.createClass({
  getDefaultProps: function() {
    return {
      width: width,
      height: height,
      margin: margin,
      data: [],
      path: []
    };
  },

  getInitialState: function() {

    var docs = this.props.data.documents;

    docs.forEach((d, i) => {
      // important
      d.selected = false;
      d.i = i;
      d.dim = 1;
      d.offset = 0;
      d.nbs = [];
      d.isNb = false;
      d.radius = 30;
      return d;
    });

    var flatData = _.flatten(docs.map(d => {
        return d.tags.map(t => {
          var dCopy = _.cloneDeep(d);
          dCopy.tag = t;
          return dCopy;
        });
    }));

    var docsByTag = d3.nest()
      .key(d => d.tag)
      .entries(flatData);

    docsByTag.forEach((d, i) => {
      // important
      d.tag = d.key;
      d.id = d.key;
      d.selected = false;
      d.i = i;
      d.dim = 1;
      d.offset = 0;
      d.nbs = [];
      d.isNb = false;
      d.radius = 20;
      return d;
    });

    console.log("tag data", docsByTag.filter(d => d.values.length > 0));
    var inbox = docsByTag.find(d => d.key === "INBOX");
    var personal = docsByTag.find(d => d.key === "personal");

    console.log("personal", personal);
    console.log("inbox", inbox);

    // console.log("inbox email", inbox.values.find(d => d.id === "1504552ed9258f19"));
    return {
      data: [personal, inbox],
      linkedByIndex: linkedByIndex
    };
  },

  // componentDidUpdate: function() {
  //   if (this.props.filter) {
  //     var docs = this.state.data.filter(d => d.kind === this.props.filter);
  //     var links = linkedByIndex.init(docs, this.props.data.links);
  //     // TODO: this.state does not exist
  //     d3ggLayout.update(this.props,
  //                       {
  //                         linkedByIndex: links,
  //                         data: docs,
  //                         nbs: []
  //                       },
  //                       this.state.that);
  //   }
  // },

  componentDidMount: function() {
    var el = ReactDOM.findDOMNode(this);
    d3ggLayout.create(el, this.props, this.state);
    d3ggLayout.update(el, this.props, this.state);
  },

  render: function() {
    return (
      <div id="vis-cont">
        <svg width={margin.left + width + margin.right}
            height={margin.top + height + margin.bottom}></svg>
      </div>
    );
  }
});

export default Graph;
