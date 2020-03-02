/*
{"id":"foo","label":"Foo","date":{"$$date":1582755161331},"backlinks":["<a href=\"/journal/290432fa-2e6f-4a46-abb9-1861cd17314d\">Foo causes Bar</a>","<a href=\"/journal/cb51650d-5aa6-41e1-95d9-15fb4e87292e\">Foo isA Blah</a>"],"_id":"cxo7mAtA67NaTa06","bodylist":["Foo is a crucial topic in the domain of nonsense."]}

  Topic Structure
  {
    id: the node's id - can be a slug or a uuid
    date: date value
    label: the topic's label
    backlinks: list of backlink hrefs
    bodylist: list of text objects, each of which becomes an AIR journal entry
       - has been processed for wikilinks and other items
    urllist: list of URLs associated with this topic
    sourceId: relations only
    targetId: relations only
    source: href to source (subject) relations only
    target: href to target (object) relations only
  }

  Journal Entry Structure
  {
    id:
    date:
    text: in an AIR entry, this is processed for wikilinks
    subj: triple journal entry only
    pred: triple journal entry only
    obj: triple journal entry only
    urllist: urls if any
    notes: triple journal entry only
  }
*/
var journalDB = require('../journal_database');
var TopicModel = require('./topic_model');
var topicDB = require('../topic_database');
var uuid = require('uuid');
var slugUtil = require('../slug');
var linker = require('./linker');
var JournalModel,
    instance;
/**
 * JournalModel provides a kind of DSL for the platform
 */
JournalModel = function() {
  var self = this;

  /**
   * Form a journal entry and construct the backlinks for
   * the subject, predicate, and object
   * @param subject
   * @param predicate
   * @param object
   * @param url
   * @param notes
   * @param callback {err, dat}
   */
  self.processTriple = function(subject, predicate, object, url, notes, callback) {
    var uid = uuid.v4();
    var json = {};
    var subjectSlug = slugUtil.toSlug(subject);
    var objectSlug = slugUtil.toSlug(object);
    var predicateSlug = subjectSlug+slugUtil.toSlug(predicate)+objectSlug;
    var triple = subject+" "+predicate+" "+object;
    json.text = linker.setHrefs(subject, subjectSlug, object, objectSlug, predicate, predicateSlug);
    json.subj = subject;
    json.pred = predicate;
    json.obj = object;
    json.date = new Date();
    if (url) {
      var ul = [];
      ul.push(url);
      json.urllist = ul;
    }
    json.bodylist = [];
    if (notes) {
      //TODO process notes for wikilinks
      json.bodylist.push(notes);
    }
    json.id = uid;
    //process the topics
    TopicModel.processTopic(subject, subjectSlug, url, triple, uid);
    TopicModel.processTopic(object, objectSlug, url, triple, uid);
    var predlabel = subject+" "+predicate+" "+object;
    TopicModel.processPredicate(predlabel, predicateSlug, 
                                subject, subjectSlug,
                                object, objectSlug,
                                url, triple, uid);
    // persist the journal entry
    journalDB.put(json, function(err, dat) {
      console.info("ProcessTriple", err, dat);
      return callback(err, dat);
    });

  };

  /**
   * List journal tries
   * @param callback { err, data }
   */
  self.list = function(callback) {
    journalDB.list(function(err, data) {
      return callback(err, data);
    });
  };

  /**
   * Return a topic identified by <code>id</code>
   * @param id 
   * @param { err, data }
   */
  self.getTopic = function(id, callback) {
    topicDB.get(id, function(err, data) {
      return callback(err, data);
    });
  };

  /**
   * Return a specific journal entry identified by <code>id</code>
   * @param id 
   * @param callback { err, data }
   */
  self.getJournalEntry = function(id, callback) {
    console.info("NM-GJ", id);
    journalDB.get(id, function(err, data) {
      console.info("NM-GJ-1", err, data);
      return callback(err, data);
    });
  };

  /**
   * Add another AIR (addressable information resource) or URL
   * to a topic identified by <code>id</code>
   * @param id 
   * @param body the AIR
   * @param url optional
   * @param callback { err }
   */
  self.updateTopic = function(id, url, body, callback) {
    
    topicDB.updateTopic(id, url, body, function(err) {
      return callback(err);
    });
  };

  
  self.processTopics = function(topiclist, url, text, id) {
    console.info('ProcessTopics', topiclist, id, text);
    var json;
    var i;
    for (i in topiclist) {
      json = topiclist[i];
      console.info('PT-1', json);
      TopicModel.processTopic(json.label, 
                              json.slug,
                              url,
                              text,
                              id
                              );
    }
  };

  /**
   * Create a new AIR - text topic
   * @param content which may have wikilinks
   * @param url optional
   * @param callback { err, data }
   */
  self.newAIR = function(content, url, callback) {
    linker.resolveWikiLinks(content, function(body, topiclist) {
      var uid = uuid.v4();
      var json = {};
      json.id = uid;
      json.text = body;
      json.date = new Date();
      if (url) {
        var ul = [];
        ul.push(url);
        json.urllist = ul;
      }
      // we now have an AIR ready to persist
      // and possible a list of topics to process
      journalDB.put(json, function(err, dat) {
        var len = topiclist.length;
        console.info("newAIR", err, dat, len, topiclist);
        if (len > 0) {
          console.info("newAir-1");
          self.processTopics(topiclist, url, body, uid);
          return callback(err, dat);
        } else {
          console.info('newAir-2');
          return callback(err, dat);
        }
      });
    });
  };
};

if (!instance) {
  instance = new JournalModel();
}
module.exports = instance;