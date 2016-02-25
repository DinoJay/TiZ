import React from "react";
import d3Timeline from "../lib/d3DocPile";
import ReactDOM from "react-dom";

var Timeline = React.createClass({
  getDefaultProps: function() {
    return {
      width:  null,
      height: null,
      margin: null,
      data:   null,
      yOffset: null
    };
  },

  getInitialState: function() {
    console.log("props.data", this.props.data);
    return {data: this.props.data};
  },

  componentDidMount: function() {
    var el = ReactDOM.findDOMNode(this);
    d3Timeline.create(el, this.props, this.state);
    // d3Timeline.update(el, this.props, this.state.data);
  },

  componentDidUpdate: function() {
    // var el = ReactDOM.findDOMNode(this);
    // d3Timeline.update(el, this.props, this.state);
  },

  render: function() {
    return (
    <div id="docPile" style={{height: this.props.height}}>
    </div>
    );
  }
});

export default Timeline;
