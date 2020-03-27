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
       - in a topic, bodylist is an array
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
    //notes: triple journal entry only
    bodylist: a single text object in a journal entry
  }
*/
const journalDB = require('../journal_database');
const TopicModel = require('./topic_model');

const topicDB = require('../topic_database');
const uuid = require('uuid');
const toSlug = require('../slug');
const linker = require('./linker');
/**
 * JournalModel provides a kind of DSL for the platform
 */
class JournalModel {
  /**
   * For a given {@code topic}, populate its backlinks
   * @param topic
   */
  async populateBacklinks(topic) {
    console.info('Populating', topic);
    const backlinks = topic.backlinks;
    let theLink;
    //var jnlId;
 
    console.info("StartBacks", backlinks.length);
    const promises = backlinks.map((jnlId)=>
      new Promise(async (resolve, reject) => {
        try {
          const data = await journalDB.find({ id: jnlId});
          const dx = data[0];
          console.log('Populating-2', data, dx.raw);
  
          //data is the entire journal entry
          //We want raw; for now, href the whole thing
          //TODO add an image for the href
          resolve(`<a href="/journal/${jnlId}">${dx.raw}</a>`);
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
    const uid = `JNL_${uuid.v4()}`;
    const json = {};
    const subjectSlug = `TOP_${toSlug(subject)}`;
    const objectSlug = `TOP_${toSlug(object)}`;
    const predicateSlug = `TOP_${subjectSlug}${toSlug(predicate)}${objectSlug}`;
    const triple = `${subject} ${predicate} ${object}`;
    json.raw = `${subject} ${predicate} ${object}`;
    json.text = linker.setHrefs(subject, subjectSlug, object, objectSlug, predicate, predicateSlug);
    json.subj = subject;
    json.pred = predicate;
    json.obj = object;
    json.date = new Date();
    json.userId = userId;
    json.userHandle = userHandle;
    if (url) {
      const ul = [];
      ul.push(url);
      json.urllist = ul;
    }
    //json.bodylist = [];
    if (notes) {
      const {body, topiclist} = linker.resolveWikiLinks(notes);
      console.info('ProcessTriple-1', body, topiclist);
      json.bodylist = body; //push(body);
      json.id = uid;
      //process the topics
      TopicModel.processTopic(subject, subjectSlug, url, null, uid, userId, userHandle);
      TopicModel.processTopic(object, objectSlug, url, null, uid, userId, userHandle);
      const predlabel = `${subject} ${predicate} ${object}`;
      await TopicModel.processPredicate(predlabel, predicateSlug, predicate,
                                  subject, subjectSlug,
                                  object, objectSlug,
                                  url, triple, uid, userId, userHandle);
      // persist the journal entry
      const dat = await journalDB.put(json);
      console.info("ProcessTriple", dat);
      const len = topiclist.length;
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
      const predlabel = `${subject} ${predicate} ${object}`;
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
   * @param limit
   * @param skip
   */
  async list(limit, skip) {
    return await journalDB.list(limit, skip);
  };

  /**
   * List topics
   * @param limit
   * @param skip
   */
  async listTopics(limit, skip) {
    return await TopicModel.listTopics(limit, skip);
  };

  /**
   * Return a topic identified by <code>id</code>
   * @param id 
   */
  async getTopic(id) {
    const data = await TopicModel.getTopic(id);
    console.info('JnlModel.getTopic', data);
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

  async updateJournalEntry(id, content, userId, userHandle, isTriple) {
    console.info("JournalModel.updateJournalEntry", isTriple);
    const {body, topiclist} = linker.resolveWikiLinks(content);
    const jnl = await journalDB.get(id);
    var notes = jnl.notes;
    if (notes) {

    }
    await journalDB.updateJournalText(id, body, isTriple);
    if (topiclist.length > 0) {
      console.info("updateJournal-1");
      await this.processTopics(topiclist, null, null, id, userId, userHandle);
      return;
    } else {
      return;
    }
  };

  async processTopics(topiclist, url, text, id, userId, userHandle) {
    console.info('ProcessTopics', topiclist, id, text);
    let json;
    let i;
    const promises = topiclist.map(
      (json)=> TopicModel.processTopic(
        json.label, json.slug, url, text,
        id, userId, userHandle)
      )
    await Promise.allSettled(promises);
  };

  /**
   * Create a new AIR - text topic
   * @param content which may have wikilinks
   * @param url optional
   * @param userId
   * @param userHandle
   */
  async newAIR(content, url, userId, userHandle) {
    const json = {};
    json.raw = content;
    console.info('NewAirJnl-1', content, url);
    const {body, topiclist} = linker.resolveWikiLinks(content);
    console.info('NewAirJnl-2', body, topiclist);
    const uid = `JNL_${uuid.v4()}`;
    json.id = uid;
    json.userId = userId;
    json.userHandle = userHandle;
    json.text = body;
    json.date = new Date();
    if (url) {
      const ul = [];
      ul.push(url);
      json.urllist = ul;
    }
    // we now have an AIR ready to persist
    // and possible a list of topics to process
    const dat = await journalDB.put(json);
    const len = topiclist.length;
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
module.exports = instance;
