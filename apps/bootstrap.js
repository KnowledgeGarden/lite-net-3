var owner = require('../config/owner');
var userDB = require('./user_database');
var topicDB = require('./topic_database');
var AdminModel = require('./models/admin_model');
var Bootstrap;
var instance;

Bootstrap = function() {
  var self = this;
  console.info("Bootstrap-1", AdminModel);

  self.migrateTransclusions = function(callback) {
    console.info('Migrating Transclusions');
    //TODO
    //For every href entry in backlinks array
    // if it is an href. find the journal id and substitute that into
    // a new array  journal/
    
    topicDB.find({}, function(err, data) {
      console.info('Migrate-1', err, data);
      var backlinks;
      var newLinks = [];
      var found = false;
      var where;
      var theLink;
    data.forEach(function(topic) {
      console.info('Migrate-2', topic);
       backlinks = topic.backlinks;
        found = false;
        backlinks.forEach(function(link) {
          theLink = link;
          if (theLink.startsWith('<a')) {
            where = theLink.indexOf('rnal/');
            theLink = theLink.substring((where+5));
            where = theLink.indexOf("\">");
            theLink = theLink.substring(0, where);
            //theLink is now the journal Id
            console.info('Migrate-3', link, theLink);
            newLinks.push(theLink);
            found = true;
          }
        });
        if (found) {
          console.log('Migrate-4', topic);
          topicDB.replaceBacklinks(topic._id, newLinks, function(err, data){
            //
          });
        }
      });
     
    });
    return callback(true);
    
  };

  /**
   * @param { done }
   */
  self.validateUserDB = function(callback) {
    userDB.isEmpty(function(truth) {
      console.info('BootstrapCheck', truth);
      if (!truth) {
        AdminModel.signup(
          owner.email,
          owner.handle,
          owner.fullName,
          owner.password, function(err) {
            console.log('Bootstrapped');
            return callback(true);
          });
      } else {
        console.log('Not Bootstrapped');
        return callback(true);
      }
    });
  };

  self.bootstrap = function() {
    self.validateUserDB(function(done) {
      self.migrateTransclusions(function(did) {
        return;
      });
    });
  };

};

if (!instance) {
  instance = new Bootstrap();
}

module.exports = instance;