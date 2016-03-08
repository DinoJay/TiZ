"use strict";

import React from "react";
import ReactDOM from "react-dom";
// import _ from "lodash";

// import Graph from "./components/Graph";
// import Venn from "./components/Venn";
import TagCloud from "./components/TagCloud";
// import DocPile from "./components/DocPile";
// import Timeline from "./components/Timeline";

import {makePanels, makeStyle} from "./lib/misc";

require("./style/style.less");

var data2 = require("json!./stores/data_30_10.json");

const App = React.createClass({

  getDefaultProps: function() {
    return {
      width: 1340,
      height: 900,
      padX: 20,
      padY: 20,
      uiWidth: 200,
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
    var panels = makePanels(this.props.width, this.props.height,
                            this.props.margin, this.props.uiWidth,
                            this.props.padX, this.props.padY);
    console.log("panels", panels);
    return {
      panels: panels,
      data: null
    };
  },

  onHover: function() {

  },

  render: function() {
    var panels = this.state.panels;
    var styleTopUI = makeStyle(panels.topUI, "#2ECC40");
    var styleCenterUI = makeStyle(panels.centerUI, "#FF4136" );
    var styleBottomUI = makeStyle(panels.bottomUI, "#0074D9" );

    console.log("styleTopUI", styleTopUI);
    return (
      <div className="cont">
        <svg id="svg" height={900}></svg>
        <div style={styleTopUI}> </div>
        <div style={styleCenterUI}> </div>
        <div style={styleBottomUI}> </div>
        <div className="overlay">
          <TagCloud
            width={this.props.width}
            height={this.props.height}
            margin={this.props.margin}
            panels={this.state.panels}
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
