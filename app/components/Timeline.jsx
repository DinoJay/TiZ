import React from "react";
import d3Timeline from "../lib/d3Timeline.js";
import ReactDOM from "react-dom";

var Timeline = React.createClass({
  getDefaultProps: function() {
    return {
      width:  null,
      height: null,
      margin: null,
      data:   null
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
    var tw = this.props.margin.left + this.props.width + this.props.margin.right;
    return (
      <div id="timeline" className="" style={{height: this.props.height}}>
        <svg width={tw} height={this.props.height}>
          <g transform={"translate(" + this.props.margin.left + "," + this.props.margin.top + ")"}> </g>
        </svg>
      </div>
    );
  }
});

export default Timeline;
