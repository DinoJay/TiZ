import _ from "lodash";
import faker from "faker";

var BuzzwordClient = {
  load: function(success, failure) {
    setTimeout(function() {
      success(_.range(10).map(faker.company.catchPhrase));
      console.log("failure", failure);
    }, 1000);
  },

  submit: function(word, success, failure) {
    setTimeout(function() {
      if (Math.random() > 0.5) {
        success(word);
      } else {
        failure("Failed to " + faker.company.bs());
      }
    }, Math.random() * 1000 + 500);
  }
};

export default BuzzwordClient;
