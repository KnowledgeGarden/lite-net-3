"use strict";
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
var toSlug = require('../slug');
var linker = require('./linker');
/**
 * JournalModel provides a kind of DSL for the platform
 */
class JournalModel {

  constructor() {
    //validate user database and other bootstrap functions
    this.inited = false;
  }

  async init() {
    if (!this.inited) {
      await bootstrap.bootstrap();
      this.inited = true;
    }
  }

  /**
   * For a given {@code topic}, populate its backlinks
   * @param topic
   */
  async populateBacklinks(topic) {
    console.info('Populating', topic);
    var backlinks = topic.backlinks;
    var theLink;
    //var jnlId;
 
    console.info("StartBacks", backlinks.length);
    const promises = backlinks.map((jnlId)=>
      new Promise(async (resolve, reject) => {
        try {
          const data = await journalDB.find({ id: jnlId});
          var dx = data[0];
          console.log('Populating-2', data, dx.raw);
  
          //data is the entire journal entry
          //We want raw; for now, href the whole thing
          //TODO add an image for the href
          resolve("<a href=\"/journal/"+jnlId+"\">"+dx.raw+"</a>");
        } catch (err) {
          console.error("error", err);
          reject(err);
        }
      }));
    console.log('PX', promises);
    const newLinks = await Promise.allSettled(promises);
    const links = newLinks.filter(x=>x.status == 'fulfilled').map(x=>x.value);
    console.log("promise.all", links);
    topic.backlinks = links;
    return topic;
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
   */
  async processTriple(subject, predicate, object, url, notes,
                                userId, userHandle) {
    var uid = 'JNL_'+uuid.v4();
    var json = {};
    var subjectSlug = 'TOP_'+toSlug(subject);
    var objectSlug = 'TOP_'+toSlug(object);
    var predicateSlug = 'TOP_'+subjectSlug+toSlug(predicate)+objectSlug;
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
      const {body, topiclist} = linker.resolveWikiLinks(notes);
      console.info('ProcessTriple-1', body, topiclist);
      json.bodylist.push(body);
      json.id = uid;
      //process the topics
      TopicModel.processTopic(subject, subjectSlug, url, null, uid, userId, userHandle);
      TopicModel.processTopic(object, objectSlug, url, null, uid, userId, userHandle);
      var predlabel = subject+" "+predicate+" "+object;
      await TopicModel.processPredicate(predlabel, predicateSlug, predicate,
                                  subject, subjectSlug,
                                  object, objectSlug,
                                  url, triple, uid, userId, userHandle);
      // persist the journal entry
      const dat = await journalDB.put(json);
      console.info("ProcessTriple", dat);
      var len = topiclist.length;
      console.info("PT-1", dat, len, topiclist);
      if (len > 0) {
        await this.processTopics(topiclist, url, null, uid, userId, userHandle);
      }
      return dat;
    } else {
      json.id = uid;
      //process the topics
      await TopicModel.processTopic(subject, subjectSlug, url, null, uid, userId, userHandle);
      await TopicModel.processTopic(object, objectSlug, url, null, uid, userId, userHandle);
      var predlabel = subject+" "+predicate+" "+object;
      await TopicModel.processPredicate(predlabel, predicateSlug, predicate,
                                  subject, subjectSlug,
                                  object, objectSlug,
                                  url, triple, uid, userId, userHandle);
      // persist the journal entry
      const dat = await journalDB.put(json);
      console.info("ProcessTriple", dat);
      return dat;
    }
  }

  async listByURL(url) {
    return await journalDB.findByURL(url);
  };

  /**
   * List journal entries
   * TODO needs pagination
   */
  async list() {
    return await journalDB.list();
  };

  /**
   * Return a topic identified by <code>id</code>
   * @param id 
   */
  async getTopic(id) {
    const data = await topicDB.get(id);
    return await this.populateBacklinks(data);
  };

  async ajaxFindLabel(q) {
    console.log('JournalAjax', q);
    return await TopicModel.ajaxFindLabel(q);
  };
  /**
   * Return a specific journal entry identified by <code>id</code>
   * @param id 
   */
  async getJournalEntry(id) {
    console.info("NM-GJ", id);
    return await journalDB.get(id);
  };

  /**
   * Add another AIR (addressable information resource) or URL
   * to a topic identified by <code>id</code>
   * @param id 
   * @param body the AIR
   * @param url optional
   */
  async updateTopic(id, url, body) {
    return await topicDB.updateTopic(id, url, body);
  };

  
  async processTopics(topiclist, url, text, id, userId, userHandle) {
    console.info('ProcessTopics', topiclist, id, text);
    var json;
    var i;
    for (i in topiclist) {
      json = topiclist[i];
      console.info('PT-1', json);
      await TopicModel.processTopic(json.label, 
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
   */
  async newAIR(content, url, userId, userHandle) {
    var json = {};
    json.raw = content;
    console.info('NewAirJnl-1', content, url);
    const {body, topiclist} = linker.resolveWikiLinks(content);
    console.info('NewAirJnl-2', body, topiclist);
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
    const dat = await journalDB.put(json);
    var len = topiclist.length;
    console.info("newAIR", dat, len, topiclist);
    if (len > 0) {
      console.info("newAir-1");
      await this.processTopics(topiclist, url, null, uid, userId, userHandle);
      return dat;
    } else {
      console.info('newAir-2');
      return dat;
    }
  }
}

const instance = new JournalModel();
async function getJournalModel() {
  await instance.init();
  return instance;
}
module.exports = getJournalModel;
