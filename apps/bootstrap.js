"use strict";
const owner = require('../config/owner');
const userDB = require('./user_database');
const topicDB = require('./topic_database');
const AdminModel = require('./models/admin_model');

class Bootstrap {
  constructor() {
    console.info("Bootstrap-1", AdminModel);
  }

  async migrateTransclusions() {
    console.info('Migrating Transclusions');
    //Not using this
    //For every href entry in backlinks array
    // if it is an href. find the journal id and substitute that into
    // a new array  journal/
    
   /* topicDB.find({}, function(err, data) {
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
     
    });*/
    return true;
  };

  /**
   * @param { done }
   */
  async validateUserDB() {
    console.debug('validateUserDB');
    const empty = await userDB.isEmpty();
    console.info('BootstrapCheck', empty);
    if (!empty) {
      await AdminModel.signup(
        owner.email,
        owner.handle,
        owner.fullName,
        owner.password);
    } else {
      console.log('Not Bootstrapped');
    }
    return true;
  };

  async bootstrap() {
    console.debug('bootstrap');
    const done = await this.validateUserDB();
    return await this.migrateTransclusions();
  };

};

const instance = new Bootstrap();
async function bootstrap() {
  await instance.bootstrap();
}
module.exports = bootstrap;
