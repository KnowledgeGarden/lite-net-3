var topicDB = require('../topic_database');
var TopicModel,
    instance;

TopicModel = function() {
  var self = this;

    /**
   * Add another AIR (addressable information resource) or URL
   * to a topic identified by <code>id</code>
   * @param id 
   * @param body the AIR
   * @param url optional
   * @param callback { err }
   */
  self.updateTopic = function(id, url, body, callback) {
    console.info('UpdateTopic', id, url, body);
    //fetch the topic
    topicDB.get(id, function(err, data) {
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
        topicDB.delete(data._id, function(err, numRemoved) {
          console.info('RemTopic', id, err, numRemoved);
          // insert the new one
          topicDB.put(data, function(err, dat) {
            console.info('UpdateTopic-4', err, dat);
            //topicDB.compact(function(erx)  {
              //NO: compacting messes up backlinks - not sure why
              return callback(err, dat);
            //});
            
          });
        });
      } else {
        return callback(err);
      }
    });
  };

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
  self.processTopic = function(term, slug, url, content, id, userId, userHandle) {
    console.info("ProcessTopic", term, slug, '|', content, '|', url, id);
    topicDB.get(slug, function(err, data) {
      console.info('ProcessTopic-1', err, data);
      if (data) {
        console.info('ProcessTopic-1a', content);
        if (content) {
          self.updateTopic(slug, url, content, function(err) {
            topicDB.addBacklink(slug, id, function(err) {
              console.info("ABL", err);
            });
          });
        } else {
          topicDB.addBacklink(slug, id, function(err) {
            console.info("ABL-1", err);
          });
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
        topicDB.put(json, function(err, dat) {
          console.info('ProceessTopic-2', err, dat);
        });
      }
    });
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
  self.processPredicate = function(predicate, predicateSlug, type,
                                   subject, subjectSlug,
                                   object, objectSlug,
                                   url,
                                   content, id,
                                   userId, userHandle) {
    console.info("ProcessPredicate", predicate, predicateSlug, url, id);
    topicDB.get(predicateSlug, function(err, data) {
      console.info('ProcessPredicate-1', err, data);
      if (data) {
        self.updateTopic(predicateSlug, url, content, function(err) {
          topicDB.addBacklink(predicateSlug, id, function(err) {
            console.info("BBL", err);
          });
        });
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
        topicDB.put(json, function(err, dat) {
          console.info('ProcessPredicate-2', err, dat);
        });
      }
    });
  };

  self.ajaxFindLabel = function(q, callback) {
  
    var rx = new RegExp(q, 'i');
    console.info("TMajax", rx);
    topicDB.find({ label: { $regex: rx } }, function (err, docs) {
      console.info('AjaxFind', err, docs);
      var json = {};
      var lx = [];
      
      for (var i=0; i<docs.length; i++) {
        lx.push(docs[i].label);
      }
      json.options = lx;
      return callback(err, json);
    });
  };

};

if (!instance) {
  instance = new TopicModel();
}
module.exports = instance;