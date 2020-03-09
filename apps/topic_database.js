var Datastore = require('nedb')
var Database;
var instance;

Database = function() {
  var db = new Datastore({ filename: './data/topics' , autoload: true });
  console.info('Database '+db);
  var self = this;

  /**
   * Insert a topic
   * @param jsonDoc the topic
   * @param callback { err, newDoc }
   */
  self.put = function(jsonDoc, callback) {
    db.insert(jsonDoc, function (err, newDoc) {
      return callback(err, newDoc);
    });
  };

  /**
   * @param id 
   * @parm backlink
   * @param callback { err }
   */
  self.addBacklink = function(id, backlink, callback) {
    db.update({ id: id }, { $push: { backlinks: backlink } }, {}, function (err) {
      return callback(err);
    });
  };

  /**
   * Remove a topic identified by <code>_id</code>
   * @param _id 
   * @param callback { err, numRemoved }
   */
  self.delete = function(_id, callback) {
    db.remove({ _id: _id }, {}, function (err, numRemoved) {
      return callback(err, numRemoved);
    });
  };

  /**
   * @param id 
   * @param callback { err, data}
   */
  self.get = function(id, callback) {
    db.findOne({ id: id }, function (err, doc) {
      console.info("FindTopic", err, doc);
      return callback(err, doc);
    });
  };

  self.find = function(query, callback) {
    console.info('TDB', query);
    db.find(query, function(err, data) {
      return callback(err, data);
    });
  };

  /**
   * Add in either {@code url}, or {@code body} or both
   * @param url  can be {@code null}
   * @param body can be {@code null}
   * @param callback { err }
   */
  self.updateTopic = function(id, url, body, callback) {
    //TODO rewrite this to avoid duplicates
    if (url) {
      db.update({ id: id }, { $push: { urllist: url } }, {}, function (err) {
        if (body) {
          db.update({ id: id }, { $push: { bodylist: body } }, {}, function (err) {
            return callback(err);
          });
        } else {
          return callback(err);
        }
      });
    } else if (body) {
      db.update({ id: id }, { $push: { bodylist: body } }, {}, function (err) {
        return callback(err);
      });
    } else {
      console.error('TopicDatabas.updateTopic got nothing ', id);
      return callback(null); //really, this is a dumb error: nothing sent here
    }
  };
  
};

if (!instance) {
  instance = new Database();
}
module.exports = instance;