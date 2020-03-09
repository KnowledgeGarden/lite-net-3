var userDB = require('../user_database');

var instance;
var AdminModel;

AdminModel = function() {
  var self = this;

};

if (!instance) {
  instance = new AdminModel();
}
module.exports = instance;