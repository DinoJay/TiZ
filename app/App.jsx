// polyfills es6 functions
// import "babel-core/polyfill";

import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

// import Graph from "./components/Graph";
// import Venn from "./components/Venn";
import TagCloud from "./components/TagCloud";
// import DocPile from "./components/DocPile";
// import Timeline from "./components/Timeline";

require("./style/style.less");

var data2 = require("json!./stores/data_30_10.json");

const App = React.createClass({

  getDefaultProps: function() {
    return {
      width: 1230,
      height: 800,
      margin: {
        left: 25,
        right: 25,
        top: 25,
        bottom: 25
      },
      data: []
    };
  },

  getInitialState: function() {
    console.log("data2", data2);
    return {
      suggestBuzzword: "",
      path: [],
      data: null
    };
  },

  onHover: function() {

  },

  render: function() {
    return (
      <div className="cont">
      {/* TODO: fix length */}
        <svg id="svg" height={900}></svg>
        <div className="overlay">
          <TagCloud
            width={this.props.width}
            height={this.props.height}
            margin={this.props.margin}
            data={data2}/>
        </div>

      {/* <Venn */}
      {/*   width={this.props.width} */}
      {/*   height={this.props.height} */}
      {/*   data={data2} */}
      {/*   margin={this.props.margin} */}
      {/* /> */}

        <div id="canvas">
        </div>
      </div>
    );
  },

  componentDidMount: function() {
  }
});

ReactDOM.render(<App/>, document.querySelector("#myApp"));
