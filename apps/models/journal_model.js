/*
{"id":"foo","label":"Foo","date":{"$$date":1582755161331},"backlinks":["<a href=\"/journal/290432fa-2e6f-4a46-abb9-1861cd17314d\">Foo causes Bar</a>","<a href=\"/journal/cb51650d-5aa6-41e1-95d9-15fb4e87292e\">Foo isA Blah</a>"],"_id":"cxo7mAtA67NaTa06","bodylist":["Foo is a crucial topic in the domain of nonsense."]}

  Topic Structure
  {
    id: the node's id - can be a slug or a uuid
    date: date value
    userHandle:
    userId:
    label: the topic's label
    backlinks: list of backlink hrefs ** Changing to list of Journal IDs
    bodylist: list of text objects, each of which becomes an AIR journal entry
       - has been processed for wikilinks and other items
    urllist: list of URLs associated with this topic
    sourceId: relations only
    targetId: relations only
    source: href to source (subject) relations only
    target: href to target (object) relations only
  }
  example topic
{
	"id": "TOP_backlinks",
	"userId": "7563c26a-319b-4652-b9ea-0b8cfee34b0b",
	"userHandle": "Joe",
	"nodeType": "topic",
	"label": "Backlinks",
	"date": {
		"$$date": 1584130903110
	},
	"urllist": [],
	"backlinks": ["<a href=\"/journal/JNL_bfb2fdad-69ec-41ba-864c-cad1d8c5f16a\"><p>Testing [[Backlinks]]<br></p></a>"],
	"_id": "BY8d6yU8fAkajCzH"
}

  Journal Entry Structure
  {
    id:
    date:
    userHandle:
    userId:
    raw: raw text without hrefs
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
var bootstrap = require('../bootstrap');

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
  //validate user database and other bootstrap functions
  bootstrap.bootstrap();

  /**
   * For a given {@code topic}, populate its backlinks
   * @param topic
   * @param callback { done }
   */
  self.populateBacklinks = function(topic, callback) {
    console.info('Populating', topic);
    var backlinks = topic.backlinks;
    var newLinks = [];
    var theLink;
    backlinks.forEach(function(jnlId) {
      //TODO might want to include sorting
      console.log('Populating-1', jnlId);
      journalDB.find({ id: jnlId}, function(err, data) {
        var dx = data[0];
        console.log('Populating-2', err, data, dx.raw);

        //data is the entire journal entry
        //We want raw; for now, href the whole thing
        //TODO add an image for the href
        theLink = "<a href=\"/journal/"+jnlId+"\">"+dx.raw+"</a>";
        newLinks.push(theLink);
        console.log('Populating-3', err, newLinks);

      });
      topic.backlinks = newLinks;
      console.info('Populated', topic);
      
    });
    return callback(true);

  };

  /**
   * Form a journal entry and construct the backlinks for
   * the subject, predicate, and object
   * @param subject
   * @param predicate
   * @param object
   * @param url
   * @param notes
   * @param userId
   * @param userHandle
   * @param callback {err, dat}
   */
  self.processTriple = function(subject, predicate, object, url, notes,
                                userId, userHandle, callback) {
    var uid = 'JNL_'+uuid.v4();
    var json = {};
    var subjectSlug = 'TOP_'+slugUtil.toSlug(subject);
    var objectSlug = 'TOP_'+slugUtil.toSlug(object);
    var predicateSlug = 'TOP_'+subjectSlug+slugUtil.toSlug(predicate)+objectSlug;
    var triple = subject+" "+predicate+" "+object;
    json.raw = subject+' '+predicate+' '+object;
    json.text = linker.setHrefs(subject, subjectSlug, object, objectSlug, predicate, predicateSlug);
    json.subj = subject;
    json.pred = predicate;
    json.obj = object;
    json.date = new Date();
    json.userId = userId;
    json.userHandle = userHandle;
    if (url) {
      var ul = [];
      ul.push(url);
      json.urllist = ul;
    }
    json.bodylist = [];
    if (notes) {
      linker.resolveWikiLinks(notes, function(err, body, topiclist) {
        if (err) {
          return (err, null, null);
        }
        json.bodylist.push(body);
        json.id = uid;
        //process the topics
        TopicModel.processTopic(subject, subjectSlug, url, triple, uid, userId, userHandle);
        TopicModel.processTopic(object, objectSlug, url, triple, uid, userId, userHandle);
        var predlabel = subject+" "+predicate+" "+object;
        TopicModel.processPredicate(predlabel, predicateSlug, predicate,
                                    subject, subjectSlug,
                                    object, objectSlug,
                                    url, triple, uid, userId, userHandle);
        // persist the journal entry
        journalDB.put(json, function(err, dat) {
          console.info("ProcessTriple", err, dat);
          var len = topiclist.length;
          console.info("PT-1", err, dat, len, topiclist);
          if (len > 0) {
            self.processTopics(topiclist, url, notes, uid, userId, userHandle);
          } 
          return callback(err, dat);
        });
      });
    } else {
      json.id = uid;
      //process the topics
      TopicModel.processTopic(subject, subjectSlug, url, triple, uid, userId, userHandle);
      TopicModel.processTopic(object, objectSlug, url, triple, uid, userId, userHandle);
      var predlabel = subject+" "+predicate+" "+object;
      TopicModel.processPredicate(predlabel, predicateSlug, predicate,
                                  subject, subjectSlug,
                                  object, objectSlug,
                                  url, triple, uid, userId, userHandle);
      // persist the journal entry
      journalDB.put(json, function(err, dat) {
        console.info("ProcessTriple", err, dat);
        return callback(err, dat);
      });
    }

  };

  self.listByURL = function(url, callback) {
    journalDB.findByURL(url, function(err, data) {
      return callback(err, data);
    });
  };

  /**
   * List journal entries
   * TODO needs pagination
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
      self.populateBacklinks(data, function(done) {
        return callback(err, data);
      });
      
    });
  };

  self.ajaxFindLabel = function(q, callback) {
    console.log('JournalAjax', q);
    TopicModel.ajaxFindLabel(q, function(err, data) {
      console.info('JMajax', err, data);
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

  
  self.processTopics = function(topiclist, url, text, id, userId, userHandle) {
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
                              id, userId, userHandle
                              );
    }
  };

  /**
   * Create a new AIR - text topic
   * @param content which may have wikilinks
   * @param url optional
   * @param userId
   * @param userHandle
   * @param callback { err, data }
   */
  self.newAIR = function(content, url, userId, userHandle, callback) {
    var json = {};
    json.raw = content;
    linker.resolveWikiLinks(content, function(err, body, topiclist) {
      if (err) {
        return callback(err);
      }
      var uid = 'JNL_'+uuid.v4();
      json.id = uid;
      json.userId = userId;
      json.userHandle = userHandle;
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
          self.processTopics(topiclist, url, content, uid, userId, userHandle);
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