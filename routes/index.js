var express = require('express');
var router = express.Router();
//var fs = require('fs');
//var path = require('path');
var JournalModel = require('../apps/models/journal_model');
var config = require('../config/config');
var predicates;
var hbs = require('hbs');

hbs.registerHelper('toJSON', function(obj) {
  return JSON.stringify(obj, null);
});


function validatePredicates() {
  if (!predicates) {
    var whichvocab = config.vocabulary;
    whichvocab = "../config/vocab/"+whichvocab+"/labels";
    //var datapath = path.join(__dirname, whichvocab);
    //var f = fs.readFileSync(datapath, 'utf8');
    predicates =  require(whichvocab);
    /*var terms = predicates.terms;
    var x = [];
    for (var i = 0; i< terms.length; i++) {
      x.push(terms[i]);
    }
    predicates = x;*/
    console.info('IndexPreds', predicates);
    console.info('IP2', predicates.terms[0]);
  }
}

/**
 * Ajax for typeahead
 */
router.get('/ajax/label', function(req, res, next) {
  var q = req.query.query;
  console.info('Ajax', q);
  JournalModel.ajaxFindLabel(q, function(err, data) {
    return res.json(data);
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  validatePredicates();
  JournalModel.list(function(err, noteList) {
    var data = {};
    data.predicates = predicates;
    console.info('IP3', predicates.terms[0]);
    data.title = config.banner;
    data.noteList = noteList;
    return res.render('index', data);
  });
});

router.get('/iframe', function(req, res, next) {
  validatePredicates();
  var url = req.query.fName;
  console.info('IFRAME', url);
  var data = {};
  data.predicates = predicates;
  data.title = config.banner;
  data.url = url;
  return res.render('iframe', data);
});

router.get('/new_note_route', function(req, res, next) {
  console.info('NEW');
  var noteList = [];
  var x = {};
  x.details = '[[Foo]] causes [[Bar]]';
  noteList.push(x);
  var data = {};
  data.title = config.banner;
  data.noteList = noteList;
  data.isNew = true;
  return res.render('index', data);
});

/**
 * Get page identified by its slug
 */
router.get('/:id', function(req, res, next) {
  var id = req.params.id;
  var data = {};
  data.title = config.banner;
  data.id = id;
  return res.render('index', data);
});

router.post('/postAtriple', function(req, res, next) {
  var subject = req.body.subject;
  var predicate = req.body.predicate;
  var object = req.body.object;
  var url = req.body.url;
  var notes = req.body.notes;
  console.info('PostTriple', subject, predicate, object, url, notes);
  
  JournalModel.processTriple(subject, predicate, object, url, notes, function(err, dat) {
    console.log('BigTriple', dat);
      return res.redirect('/journal/'+dat.id);
    //});  
  });
});

/**
 * A post response which serves many purposes:
 * a: Update a topic with an added text object. That object
 * may have Wikilinks embedded in it.
 * b: A topic is a fresh text AIR journal entry
 * c: (future) A topic is a fresh text AIR but is a child
 *  node to another topic - a conversation tree node
 */
router.post('/posttopic', function(req, res, next) {
  var body = req.body.body;
  var id = req.body.topicid;
  var parentId = req.body.parentid;
  var url = req.body.url;
  console.info("PostTopic", id, parentId, url, body);
  if (!id && !parentId && body) {
    JournalModel.newAIR(body, url, function(err, data) {
      return res.redirect('/journal/'+data.id);
    });
  } else if (body || url) { // NOTE ignoring parentId for now
    JournalModel.updateTopic(id, url, body, function(err) {
      return res.redirect('/topic/'+id);
    });
  } else {
    //bad post - for now
    return res.redirect('/');
  }
});

router.get('/topic/:id', function(req, res, next) {
  var id = req.params.id;
  console.info("GetTopic", id);
  JournalModel.getTopic(id, function(err, data) {
    console.info("GetTopic-2", data);
    var json = data;
    json.title = config.banner;
    json.jsonSource = JSON.stringify(data);
    return res.render('topicview', json);
  });
});

router.get('/journal/:id', function(req, res, next) {
  var id = req.params.id;
  console.info("GetJournal", id);
  JournalModel.getJournalEntry(id, function(err, data) {
    data.title = config.banner;
    console.info("GetJournal-1", data);
    return res.render('journalview', data);
  });
});


module.exports = router;
