"use strict";
var topicDB = require('../topic_database');

class TopicModel {

    /**
   * Add another AIR (addressable information resource) or URL
   * to a topic identified by <code>id</code>
   * @param id 
   * @param body the AIR
   * @param url optional
   */
  async updateTopic(id, url, body) {
    console.info('UpdateTopic', id, url, body);
    //fetch the topic
    const data = await topicDB.get(id);
    console.info('UpdateTopic-1', data);
    //update the topic using treating arrays as sets (no duplicates)
    var somelist;
    var madeChanges = false;
    if (url) {
      somelist = data.urllist;
      if (!somelist) {
        somelist = [];
        somelist.push(url);
        madeChanges = true;
      } else if (!somelist.includes(url)) {
        madeChanges = true;
        somelist.push(url);
      }
      data.urllist = somelist;
    }
    if (body) {
      somelist = data.bodylist;
      if (!somelist) {
        somelist = [];
        somelist.push(body);
        madeChanges = true;
      }
      else if (!somelist.includes(body)) {
        somelist.push(body);
        madeChanges = true;
      }
      data.bodylist = somelist;
    }
    if (madeChanges) {
      console.info('UpdateTopic-3', data);
      //delete the old one
      const numRemoved = await topicDB.delete(data._id);
      console.info('RemTopic', id, numRemoved);
      // insert the new one
      const dat = await topicDB.put(data);
      console.info('UpdateTopic-4', dat);
      //await topicDB.compact();
      //NO: compacting messes up backlinks - not sure why
      return dat;
    }
  }

  /**
   * Process a term which is a topic
   *  either make a new node from that term if not exists
   *  else add backlink to it with the content and its id
   * @param term
   * @param slug
   * @param url
   * @param content of the journal entry
   * @param id of the journal entry
   * @param userId
   * @param userHandle
   */
  async processTopic(term, slug, url, content, id, userId, userHandle) {
    console.info("ProcessTopic", term, slug, '|', content, '|', url, id);
    const data = await topicDB.get(slug);
    console.info('ProcessTopic-1', data);
    if (data) {
      console.info('ProcessTopic-1a', content);
      if (content) {
        await this.updateTopic(slug, url, content);
        await topicDB.addBacklink(slug, id);
      } else {
        await topicDB.addBacklink(slug, id);
      }
    } else {
      var json = {};
      if (slug.startsWith('TOP')) {
        json.id = slug;
      } else {
        json.id = 'TOP_'+slug;
      }
      json.userId = userId;
      json.userHandle = userHandle;
      json.nodeType = 'topic';
      json.label = term;
      json.date = new Date();
      json.urllist = [];
      if (url) {
        json.urllist.push(url);
      }
      json.backlinks = [];
      json.backlinks.push(id);
      const dat = await topicDB.put(json);
      console.info('ProceessTopic-2', dat);
    }
  };

  /**
   * Process a term which is a predicate - also a topic
   * @param predicate 
   * @param predicateSlug
   * @param type the predicate type - not its slug
   * @param subject 
   * @param subjectSlug
   * @param object 
   * @param objectSlug
   * @param url
   * @param content the journal entry itself
   * @param id the journal entry id
   * @param userId
   * @param userHandle
   */
  async processPredicate(predicate, predicateSlug, type,
                                   subject, subjectSlug,
                                   object, objectSlug,
                                   url,
                                   content, id,
                                   userId, userHandle) {
    console.info("ProcessPredicate", predicate, predicateSlug, url, id);
    const data = await topicDB.get(predicateSlug);
    console.info('ProcessPredicate-1', data);
    if (data) {
      await this.updateTopic(predicateSlug, url, content);
      await topicDB.addBacklink(predicateSlug, id);
    } else {
      var json = {};
      if (predicateSlug.startsWith('TOP')) {
        json.id = predicateSlug;
      } else {
        json.id = 'TOP_'+predicateSlug;
      }
      json.userId = userId;
      json.userHandle = userHandle;
      json.nodeType = 'relation';
      json.type = type;
      json.label = predicate;
      json.date = new Date();
      json.source = "<a href=\"/topic/"+subjectSlug+"\">"+subject+"</a>"
      json.target = "<a href=\"/topic/"+objectSlug+"\">"+object+"</a>"
      json.sourceId = subjectSlug;
      json.targetId = objectSlug;
      json.backlinks = [];
      json.urllist = [];
      if (url) {
        json.urllist.push(url);
      }

      json.backlinks.push(id);
      const dat = await topicDB.put(json);
      console.info('ProcessPredicate-2', dat);
    }
  };

  async ajaxFindLabel(q) {
  
    var rx = new RegExp(q, 'i');
    console.info("TMajax", rx);
    const docs = await topicDB.find({ label: { $regex: rx } });
    console.info('AjaxFind', docs);
    var json = {};
    var lx = [];
    
    for (var i=0; i<docs.length; i++) {
      lx.push(docs[i].label);
    }
    json.options = lx;
    return json;
  };

}

const  instance = new TopicModel();
module.exports = instance;
