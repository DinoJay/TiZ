// polyfills es6 functions
// import "babel-core/polyfill";

import React from "react";
import ReactDOM from "react-dom";
import Fluxxor from "fluxxor";
import _ from "lodash";

import BuzzwordStore from "./stores/BuzzwordStore";
import BuzzwordActions from "./actions/BuzzActions";

import Graph from "./components/Graph";
import Timeline from "./components/Timeline";

require("./style/style.less");

var fakeData = require("json!./lib/fakeData.json");
var data2 = require("json!./stores/data_30_10.json");

const stores = {
  BuzzwordStore: new BuzzwordStore()
};

const actions = BuzzwordActions;

const flux = new Fluxxor.Flux(stores, actions);

flux.on("dispatch", function(type, payload) {
  if (console && console.log) {
    console.log("[Dispatch]", type, payload);
  }
});

const FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

const App = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin("BuzzwordStore")],

  getDefaultProps: function() {
    return {
      widthTotal: 1400,
      heightTotal: 1400,
      margin: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      data: []
    };
  },

  getInitialState: function() {
    return {
      suggestBuzzword: "",
      width: ( this.props.widthTotal - this.props.margin.left
              - this.props.margin.right ),
      height: (this.props.heightTotal - this.props.margin.top
               - this.props.margin.bottom),
      path: [],
      data: fakeData
    };
  },

  getStateFromFlux: function() {
    var store = this.getFlux().store("BuzzwordStore");
    return {
      loading: store.loading,
      error: store.error,
      words: _.values(store.words)
    };
  },

  render: function() {
    return (
      <div>
      {/* <Timeline/> */}

        <Graph
          width={this.state.width}
          height={this.state.height}
          data={data2}
          margin={this.props.margin}
        />

      </div>
    );
  },

  componentDidMount: function() {
    this.getFlux().actions.loadBuzz();
  },

  handleSuggestedWordChange: function(e) {
    this.setState({suggestBuzzword: e.target.value});
  },

  handleSubmitForm: function(e) {
    e.preventDefault();
    if (this.state.suggestBuzzword.trim()) {
      this.getFlux().actions.addBuzz(this.state.suggestBuzzword);
      this.setState({suggestBuzzword: ""});
    }
  }
});

const Word = React.createClass({
  render: function() {
    var statusText, statusStyle = {};
    switch(this.props.word.status) {
    case "OK":
      statusText = "";
      break;
    case "ADDING":
      statusText = "adding...";
      statusStyle = { color: "#ccc" };
      break;
    case "ERROR":
      statusText = "error: " + this.props.word.error;
      statusStyle = { color: "red" };
      break;
    }

    return (
      <li key={this.props.word.word}>
        {this.props.word.word} <span style={statusStyle}>{statusText}</span>
      </li>
    );
  }
});

ReactDOM.render(<App flux={flux}/>, document.querySelector("#myApp"));
