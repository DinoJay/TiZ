import React from "react";
import d3Timeline from "../lib/d3Timeline.js";
import ReactDOM from "react-dom";

import {
  margin,
  width,
  height

} from "../lib/misc.js";

var data = require("json!./../stores/miserables.json");

var Timeline = React.createClass({
  getDefaultProps: function() {
    return {
      width: width,
      height: height,
      margin: margin
    };
  },

  getInitialState: function() {
    return {data: data};
  },

  componentDidMount: function() {
    var el = ReactDOM.findDOMNode(this);
    d3Timeline.create(el, this.props, this.state);
    // d3Timeline.update(el, this.props, this.state.data);
  },

  componentDidUpdate: function() {
    var el = ReactDOM.findDOMNode(this);
    d3Timeline.update(el, this.props, this.state);
  },

  render: function() {
    return (
      <div id="timeline-cont" className="scroll-wrapper size">
        {/* <svg width={margin.left + width + margin.right} */}
        {/*     height={margin.top + height + margin.bottom}></svg> */}
      </div>
    );
  }
});

export default Timeline;
