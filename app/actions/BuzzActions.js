import constants from "../constants";
import _ from "lodash";
import BuzzwordClient from "../lib/client_api";

var actions = {
  loadBuzz: function() {
    this.dispatch(constants.LOAD_BUZZ);

    BuzzwordClient.load(words => {
        this.dispatch(constants.LOAD_BUZZ_SUCCESS, {words: words});
    }, error => {
        this.dispatch(constants.LOAD_BUZZ_FAIL, {error: error});
      });

  },

  addBuzz: function(word) {
    var id = _.uniqueId();
    this.dispatch(constants.ADD_BUZZ, {id: id, word: word});

    BuzzwordClient.submit(word, () => {
      this.dispatch(constants.ADD_BUZZ_SUCCESS, {id: id});
    }, error => {
      this.dispatch(constants.ADD_BUZZ_FAIL, {id: id, error: error});
    });
  }
};

export default actions;
