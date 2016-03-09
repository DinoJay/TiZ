"use strict";

import React from "react";
import ReactDOM from "react-dom";
// import _ from "lodash";

// import Graph from "./components/Graph";
// import Venn from "./components/Venn";
import Vis from "./components/Vis";
// import DocPile from "./components/DocPile";
// import Timeline from "./components/Timeline";

import { makePanels, makeStyle } from "./lib/misc";

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

    var styleTop = makeStyle(panels.top, "#2ECC40");
    var styleCenter = makeStyle(panels.center, "#FF4136" );
    var styleBottom = makeStyle(panels.bottom, "#0074D9" );

    var styleTopUI = makeStyle(panels.topUI, "#2ECC40");
    var styleCenterUI = makeStyle(panels.centerUI, "#FF4136" );
    var styleBottomUI = makeStyle(panels.bottomUI, "#0074D9" );


    var style = {
                 top: styleTop,
                 center: styleCenter,
                 bottom: styleBottom,
                 topUI: styleTopUI,
                 centerUI: styleCenterUI,
                 bottomUI: styleBottomUI
                };
    return {
      panels: panels,
      style: style,
      data: null
    };
  },

  onHover: function() {

  },

  render: function() {
    return (
      <div className="cont">
          <Vis
            width={this.props.width}
            height={this.props.height}
            margin={this.props.margin}
            style= {this.state.style}
            panels={this.state.panels}
            data={data2}/>
      </div>
    );
  },

  componentDidMount: function() {
  }
});

ReactDOM.render(<App/>, document.querySelector("#myApp"));
