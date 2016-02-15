import Fluxxor from "fluxxor";
import _ from "lodash";

import constants from "../constants";

var BuzzwordStore = Fluxxor.createStore({
  initialize: function() {
    this.loading = false;
    this.error = null;
    this.words = {};

    this.bindActions(
      constants.LOAD_BUZZ, this.onLoadBuzz,
      constants.LOAD_BUZZ_SUCCESS, this.onLoadBuzzSuccess,
      constants.LOAD_BUZZ_FAIL, this.onLoadBuzzFail,

      constants.ADD_BUZZ, this.onAddBuzz,
      constants.ADD_BUZZ_SUCCESS, this.onAddBuzzSuccess,
      constants.ADD_BUZZ_FAIL, this.onAddBuzzFail
    );
  },

  onLoadBuzz: function() {
    this.loading = true;
    this.emit("change");
  },

  onLoadBuzzSuccess: function(payload) {
    this.loading = false;
    this.error = null;

    this.words = payload.words.reduce(function(acc, word) {
      var clientId = _.uniqueId();
      acc[clientId] = {id: clientId, word: word, status: "OK"};
      return acc;
    }, {});
    this.emit("change");
  },

  onLoadBuzzFail: function(payload) {
    this.loading = false;
    this.error = payload.error;
    this.emit("change");
  },

  onAddBuzz: function(payload) {
    var word = {id: payload.id, word: payload.word, status: "ADDING"};
    this.words[payload.id] = word;
    this.emit("change");
  },

  onAddBuzzSuccess: function(payload) {
    this.words[payload.id].status = "OK";
    this.emit("change");
  },

  onAddBuzzFail: function(payload) {
    this.words[payload.id].status = "ERROR";
    this.words[payload.id].error = payload.error;
    this.emit("change");
  }
});

export default BuzzwordStore;
