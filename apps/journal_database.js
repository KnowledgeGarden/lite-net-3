var Datastore = require('nedb')
var Database;
var instance;

Database = function() {
  var db = new Datastore({ filename: './data/journal' , autoload: true });
  console.info('Database '+db);
  var self = this;

  /**
   * Insert a journal entry
   * @param jsonDoc 
   * @param callback { err, newdoc }
   */
  self.put = function(jsonDoc, callback) {
    db.insert(jsonDoc, function (err, newDoc) {
      console.log("JournalPut", err, newDoc);
      return callback(err, newDoc);
    });
  };

  /**
   * Return a journal entry identified by <code>id</code>
   * @param id 
   * @param callback { err, data }
   */
  self.get = function(id, callback) {
    db.findOne({ id: id }, function (err, doc) {
      console.info("FindJournal", err, doc);
      return callback(err, doc);
    });
  };

  /**
   * Return a list of journal entries sorted on date latest on top
   * @param callback { err, data }
   */
  self.list = function(callback) {
    db.find({}).sort({ date: -1 }).exec(function (err, data) {
      console.info('NoteList', err, data);
      return callback(err, data);
    });
  };
};

if (!instance) {
  instance = new Database();
}
module.exports = instance;