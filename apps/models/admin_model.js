var userDB = require('../user_database');
var uuid = require('uuid');
var bcrypt = require('bcrypt-nodejs');
var instance;
var AdminModel;

AdminModel = function() {
  var self = this;

  /**
   * Register a new account
   * @param email
   * @param handle
   * @param fullName
   * @param password
   * @param callback { err }
   */
  self.signup = function(email, handle, fullName, password, callback) {
    console.info("Signup", email, handle, fullName);
    bcrypt.hash(password, null, null, function(err, hash) {
        var uStruct = {};
        uStruct.id = uuid.v4();
        uStruct.pwd = hash;
        uStruct.email = email;
        uStruct.handle = handle;
        uStruct.fullName = fullName;
        console.log("AdminModel.signup",uStruct);
        userDB.saveAccount(uStruct, function(err) {
            if (!err) {
                //TODO future feature
                //UserModel.newUser(constants.SYSTEM_USER, constants.SYSTEM_USER, uStruct.id, uStruct.handle, function(err) {
                    return callback(err);
                //});
            } else {
                return callback(err);
            }
        });
    });
  };

  /**
   * Authenticate a user
   * @param email
   * @param password
   * @param callback { err, truth, handle, id }
   */
  self.authenticate = function(email, password, callback) {
    console.log("AdminModel.authenticate", email, password);
    userDB.fetchAccount(email, function(err, json) {
        console.log("AdminModel.authenticate-1", email, json, err);
        if (json) {
            bcrypt.compare(password, json.pwd, function(err1, res) {
                return callback(err1, res, json.handle, json.id);
            });
        } else {
            return callback("Authentication issue: "+err, false, null, null);
        }

    });
};
};

if (!instance) {
  instance = new AdminModel();
}
module.exports = instance;