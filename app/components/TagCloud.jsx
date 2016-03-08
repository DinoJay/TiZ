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

    var tagsFlat = _.flatten(docs.map(d => {
        return d.tags.map(t => {
          var dCopy = _.cloneDeep(d);
          dCopy.tag = t;
          return dCopy;
        });
    }));

    var tagData = d3.nest()
      .key(d => d.tag)
      .entries(tagsFlat).map(d => {
                                    d.id = d.key;
                                    d.type = "tag";
                                    return d;
                                  });

    var timeData = d3.nest()
      .key(d => d.createdDate)
      .entries(docs).map(d => {
                                d.id = d.key;
                                d.date = new Date(d.key);
                                d.type = "date";
                                return d;
                              });


    var data = docs.concat(tagData, timeData);

    var tagEdges = _.flatten(tagData.map(target => target.values.map(source => {
      return {
        id: source.id + "-" + target.id,
        source: data.findIndex(d => d.id === source.id),
        target: data.findIndex(d => d.id === target.id)};
    })));

    var dateEdges = docs.map(source => {
      var target = timeData.find(d => d.id === source.createdDate);
      return ({
        id: source.id + "-" + target.id,
        source: data.findIndex(d => d.id === source.id),
        target: data.findIndex(d => d.id === target.id)
      });
    });


    return {
      data: data,
      edges: tagEdges.concat(dateEdges)
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
