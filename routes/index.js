"use strict";
var express = require('express');
var helper = require('./helper');
var router = express.Router();

var JournalModel = require('../apps/models/journal_model');
var AdminModel = require('../apps/models/admin_model');

var config = require('../config/config');
var predicates;
var hbs = require('hbs');

hbs.registerHelper('toJSON', obj => {
  return JSON.stringify(obj, null);
});

function baseData(req) {
  var data = {};
  data.title = config.banner;
  data.canSignup = config.canSignup;
  data.isAuthenticated = helper.isAuthenticated(req);

  return data;
}

function validatePredicates() {
  if (!predicates) {
    var whichvocab = config.vocabulary;
    whichvocab = "../config/vocab/"+whichvocab+"/labels";
    predicates =  require(whichvocab);
    console.info('IndexPreds', predicates);
    console.info('IP2', predicates.terms[0]);
  }
}

/////////////////////
// User Accounts
/////////////////////

router.get('/signup', (req, res, next) => {
  var data = baseData(req);
  return res.render('signup_form', data);
});

router.get('/login', (req, res, next) => {
  console.info("login");
  var data = baseData(req);
  return res.render('login_form', data);
});

router.get('/logout', (req, res, next) => {
  var struct = {};
  req.session.theUser = null;
  req.session.theUserId = null;
  helper.logout(req);
  return res.redirect('/');
});

router.post('/signup', async (req, res, next) => {
  var email = req.body.email;
  var handle = req.body.handle;
  var fullName = req.body.fullname;
  var pwd = req.body.password;
  try {
    await AdminModel.signup(email, handle, fullName, pwd);
    console.log("Index.post",email,err);
    req.flash("success", "Signup succeeded");
    return res.redirect('/');
  } catch (err) {
    console.log("Index.post-2");
    req.flash("error", "Signup Problem: "+err);
    return res.redirect('/');       
  }
});

router.post('/login', async (req, res, next) => {
  var email = req.body.email;
  var password = req.body.password;
  //ip =  helper.checkIP(req, "login", "signup");
  try {
    const {success, handle, userId} = await AdminModel.authenticate(email, password);
    console.info("Authenticate", success, handle, userId);
    req.session.theUser = handle;
    req.session.theUserId = userId;
    req.session.theUserEmail = email;
    console.info("Authentication passed");
    req.flash("success", "Login succeeded");
    return res.redirect('/');
  } catch (err) {
    console.error(err);
    console.info("Authentication failed");
    req.flash("error", "Login failed");
    return res.redirect('/');
  }
});
//////////////////////////

/**
 * Ajax for typeahead
 */
router.get('/ajax/label', async (req, res, next) => {
  var q = req.query.query;
  console.info('Ajax', q);
  try {
    const data = await JournalModel.ajaxFindLabel(q);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.redirect('/');
  }
});

/* GET home page. */
router.get('/', helper.isPrivate, async (req, res, next) => {
  validatePredicates();
  try {
    const noteList = await JournalModel.list();
    var data = baseData(req);
    data.predicates = predicates;
    console.info('IP3', predicates.terms[0]);
    if (req.flash) {
      data.flashMsg = req.flash("error") || req.flash("success");
    }
    data.noteList = noteList;
    return res.render('index', data);
  } catch (err) {
    console.error(err);
    return res.redirect('/');
  }
});

router.get('/iframe', async (req, res, next) => {
  validatePredicates();
  var url = req.query.fName;
  console.info('IFRAME', url);
  try {
    const hits = await JournalModel.listByURL(url);
    var data = baseData(req);
    data.predicates = predicates;
    data.url = url;
    data.hits = hits;
    return res.render('iframe', data);
  } catch (err) {
    console.error(err);
    return res.redirect('/');
  }
});

router.get('/new_note_route', (req, res, next) => {
  console.info('NEW');
  var noteList = [];
  var x = {};
  x.details = '[[Foo]] causes [[Bar]]';
  noteList.push(x);
  var data = baseData(req);
  data.title = config.banner;
  data.noteList = noteList;
  data.isNew = true;
  return res.render('index', data);
});

/**
 * Get page identified by its slug
 * /
router.get('/:id', helper.isPrivate, function(req, res, next) {
  var id = req.params.id;
  var data = baseData(req);
  data.id = id;
  return res.render('index', data);
});*/

router.post('/postAtriple', async (req, res, next) => {
  var subject = req.body.subject;
  var predicate = req.body.predicate;
  var object = req.body.object;
  var url = req.body.url;
  var notes = req.body.notes;
  var usr = req.session.theUser;
  var usrId = req.session.theUserId;
  console.info('PostTriple', subject, predicate, object, url, notes);
  try {
    const dat = await JournalModel.processTriple(subject, predicate, object, url, notes,
                               usrId, usr);
    console.log('BigTriple', dat);
    return res.redirect('/journal/'+dat.id);
  } catch (err) {
    console.error(err);
    req.flash("error", err);
    return res.redirect('/');
  }
});

/**
 * A post response which serves many purposes:
 * a: Update a topic with an added text object. That object
 * may have Wikilinks embedded in it.
 * b: A topic is a fresh text AIR journal entry
 * c: (future) A topic is a fresh text AIR but is a child
 *  node to another topic - a conversation tree node
 */
router.post('/posttopic', async (req, res, next) => {
  var body = req.body.body;
  var id = req.body.topicid;
  var parentId = req.body.parentid;
  var url = req.body.url;
  var usr = req.session.theUser;
  var usrId = req.session.theUserId;
  console.info("PostTopic", id, parentId, url, body);
  if (!id && !parentId && body) {
    try {
      const data = await JournalModel.newAIR(body, url, usrId, usr);
      return res.redirect('/journal/'+data.id);
    } catch (err) {
      console.error(err);
      req.flash("error", err);
      return res.redirect('/');
    }
  } else if (body || url) { // NOTE ignoring parentId for now
    try {
      await JournalModel.updateTopic(id, url, body);
      return res.redirect('/topic/'+id);
    } catch (err) {
      console.error(err);
      return res.redirect('/topic/'+id);
    }
  } else {
    //bad post - for now
    return res.redirect('/');
  }
});

router.post('/postjournaledit', async (req, res, next) => {
  var body = req.body.body;
  var id = req.body.id;
  var usr = req.session.theUser;
  var usrId = req.session.theUserId;
  //var url = req.body.url;
  console.info('JournalEdit', id, body);
  try {
    await JournalModel.updateJournalEntry(id, body, usrId, usr);
    return res.redirect('/journal/'+id);
  } catch (err) {
    console.error(err);
    req.flash("Error saving edited Journal: "+id);
    return res.redirect('/');
  }
});

router.get('/topic/:id', helper.isPrivate, async (req, res, next) => {
  var id = req.params.id;
  console.info("GetTopic", id);
  try {
    const data = await JournalModel.getTopic(id);
    console.info("GetTopic-2", data);
    var json = data;
    json.title = config.banner;
    json.canSignup = config.canSignup;
    json.isAuthenticated = helper.isAuthenticated(req);

    json.jsonSource = JSON.stringify(data);
    return res.render('topicview', json);
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot find Topic: "+id);
    return res.redirect('/');
  }
});

router.get('/journal/:id', helper.isPrivate, async (req, res, next) => {
  var id = req.params.id;
  var userId = req.session.theUserId;
  console.info("GetJournal", id);
  try {
    const data = await JournalModel.getJournalEntry(id);
    data.title = config.banner;
    data.canEdit = userId === data.userId;
    data.canSignup = config.canSignup;
    console.info("GetJournal-1", data);
    return res.render('journalview', data);
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot find Journal: "+id);
    return res.redirect('/');
  }
});

router.get('/journaledit/:id', async (req, res, next) => {
  var id = req.params.id;
  var userId = req.session.theUserId;

  try {
    const data = await JournalModel.getJournalEntry(id);
    var subj = data.subj;
    var isTriple = true;
    if (!subj) {
      isTriple = false;
      data.texttoedit = data.raw;
    } else {
      data.texttoedit = data.notes;
    }
    data.title = config.banner;
    data.canSignup = config.canSignup;
    return res.render('journal_edit_form', data);
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot find Journal to edit: "+id);
    return res.redirect('/');
  }
});

module.exports = router;
