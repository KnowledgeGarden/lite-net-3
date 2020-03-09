var Datastore = require('nedb')
var instance;
var UserDatabase;

UserDatabase = function() {
  var db = new Datastore({ filename: './data/users' , autoload: true });
  console.info('Database '+db);  var self = this;
};

if (!instance) {
  instance = new UserDatabase();
}

module.exports = instance;
