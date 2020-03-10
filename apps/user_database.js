var Datastore = require('nedb')
var instance;
var UserDatabase;

UserDatabase = function() {
  var db = new Datastore({ filename: './data/users' , autoload: true });
  console.info('Database '+db);  var self = this;

  /**
   * Persist an account
   * @param struct
   * @param callback { err }
   */
  self.saveAccount = function(struct, callback) {
    db.insert(struct, function (err, newDoc) {
      return callback(err);
    });
  };

  /**
   * Report {@code true} if database is empty
   * @param callback { truth }
   */
  self.isEmpty = function(callback) {
    db.find({}, function(err, doc) {
      console.info("UserEmpty", err, doc);
      var truth = false;
      if (doc && doc.length > 0) {
        truth = true;
      }
      return callback(truth);
    });
  };

  /**
   * Return an account or {@code null}
   * @param email
   * @param callback { err, json }
   */
  self.fetchAccount = function(email, callback) {
    db.findOne({ email: email }, function (err, doc) {
      console.info("FetchAccount", err, doc);
      return callback(err, doc);
    });
  };
};

if (!instance) {
  instance = new UserDatabase();
}

module.exports = instance;
