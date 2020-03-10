var owner = require('../config/owner');
var userDB = require('./user_database');
var AdminModel = require('./models/admin_model');
var Bootstrap;
var instance;

Bootstrap = function() {
  var self = this;
  console.info("Bootstrap-1", AdminModel);
  self.bootstrap = function() {
    userDB.isEmpty(function(truth) {
      console.info('BootstrapCheck', truth);
      if (!truth) {
        AdminModel.signup(
          owner.email,
          owner.handle,
          owner.fullName,
          owner.password, function(err) {
            console.log('Bootstrapped');
          });
      } else {
        console.log('Not Bootstrapped');
      }
    });
  };
};

if (!instance) {
  instance = new Bootstrap();
}

module.exports = instance;