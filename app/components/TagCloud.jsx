import React from "react";
import d3TagCloud from "../lib/d3TagCloud";
import _ from "lodash";
import ReactDOM from "react-dom";
import d3 from "d3";

var TagCloud = React.createClass({
  getDefaultProps: function() {
    return {
      // width: 600,
      // height: 600,
      // margin: {},
      data: []
      // path: []
    };
  },

  getInitialState: function() {
    var docs = this.props.data.documents;
    docs.forEach(d => {
      // d.fixed = true;
      d.type = "doc";
    });

    var flatData = _.flatten(docs.map(d => {
        return d.tags.map(t => {
          var dCopy = _.cloneDeep(d);
          dCopy.tag = t;
          return dCopy;
        });
    }));

    var tagData = d3.nest()
      .key(d => d.tag)
      .entries(flatData);

    tagData.forEach(d => {
      d.id = d.key;
      d.type = "tag";
    });

    var data = docs.concat(tagData);

    var edges = _.flatten(tagData.map(source => source.values.map(target => {
      return {
        id: source.id + "-" + target.id,
        source: data.findIndex(d => d.id === source.id),
        target: data.findIndex(d => d.id === target.id)};
    })));

    return {
      data: data,
      edges: edges
    };
  },

  // componentDidUpdate: function() {
  //   if (this.props.filter) {
  //     var docs = this.state.data.filter(d => d.kind === this.props.filter);
  //     var links = linkedByIndex.init(docs, this.props.data.links);
  //     // TODO: this.state does not exist
  //     d3TagCloud.update(this.props,
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
    d3TagCloud.create(el, this.props, this.state);
    // d3TagCloud.update(el, this.props, this.state);
  },

  render: function() {
    // TODO: margin convention
    return (
<div id="tagCloud" style={{height: this.props.height,
                           width: this.props.width}}>
      </div>
    );
  }
});

export default TagCloud;
