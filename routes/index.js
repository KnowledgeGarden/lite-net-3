"use strict";
const express = require('express');
const helper = require('./helper');
const router = express.Router();

const JournalModel = require('../apps/models/journal_model');
const AdminModel = require('../apps/models/admin_model');

const config = require('../config/config');
let predicates;
const hbs = require('hbs');

hbs.registerHelper('toJSON', obj => {
  return JSON.stringify(obj, null);
});

function baseData(req) {
  const data = {};
  data.title = config.banner;
  data.canSignup = config.canSignup;
  data.isAuthenticated = helper.isAuthenticated(req);

  return data;
}

function validatePredicates() {
  if (!predicates) {
    let whichvocab = config.vocabulary;
    whichvocab = `../config/vocab/${whichvocab}/labels`;
    predicates =  require(whichvocab);
    console.info('IndexPreds', predicates);
    console.info('IP2', predicates.terms[0]);
  }
}

/////////////////////
// User Accounts
/////////////////////

router.get('/signup', (req, res, next) => {
  const data = baseData(req);
  return res.render('signup_form', data);
});

router.get('/login', (req, res, next) => {
  console.info("login");
  const data = baseData(req);
  return res.render('login_form', data);
});

router.get('/logout', (req, res, next) => {
  const struct = {};
  req.session.theUser = null;
  req.session.theUserId = null;
  helper.logout(req);
  return res.redirect('/');
});

router.post('/signup', async (req, res, next) => {
  const email = req.body.email;
  const handle = req.body.handle;
  const fullName = req.body.fullname;
  const pwd = req.body.password;
  try {
    await AdminModel.signup(email, handle, fullName, pwd);
    console.log("Index.post",email,err);
    req.flash("success", "Signup succeeded");
    return res.redirect('/');
  } catch (err) {
    console.log("Index.post-2");
    req.flash("error", `Signup Problem: ${err}`);
    return res.redirect('/');       
  }
});

router.post('/login', async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
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
  const q = req.query.query;
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
    const data = baseData(req);
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
  const url = req.query.fName;
  console.info('IFRAME', url);
  try {
    const hits = await JournalModel.listByURL(url);
    const data = baseData(req);
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
  const noteList = [];
  const x = {};
  x.details = '[[Foo]] causes [[Bar]]';
  noteList.push(x);
  const data = baseData(req);
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
  const subject = req.body.subject;
  const predicate = req.body.predicate;
  const object = req.body.object;
  const url = req.body.url;
  const notes = req.body.notes;
  const usr = req.session.theUser;
  const usrId = req.session.theUserId;
  console.info('PostTriple', subject, predicate, object, url, notes);
  try {
    const dat = await JournalModel.processTriple(subject, predicate, object, url, notes,
                               usrId, usr);
    console.log('BigTriple', dat);
    return res.redirect(`/journal/${dat.id}`);
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
  const body = req.body.body;
  const id = req.body.topicid;
  const parentId = req.body.parentid;
  const url = req.body.url;
  const usr = req.session.theUser;
  const usrId = req.session.theUserId;
  console.info("PostTopic", id, parentId, url, body);
  if (!id && !parentId && body) {
    try {
      const data = await JournalModel.newAIR(body, url, usrId, usr);
      return res.redirect(`/journal/${data.id}`);
    } catch (err) {
      console.error(err);
      req.flash("error", err);
      return res.redirect('/');
    }
  } else if (body || url) { // NOTE ignoring parentId for now
    try {
      await JournalModel.updateTopic(id, url, body);
      return res.redirect(`/topic/${id}`);
    } catch (err) {
      console.error(err);
      return res.redirect(`/topic/${id}`);
    }
  } else {
    //bad post - for now
    return res.redirect('/');
  }
});

router.post('/postjournaledit', async (req, res, next) => {
  const body = req.body.body;
  const id = req.body.id;
  const isTriple = req.body.istriple;
  const usr = req.session.theUser;
  const usrId = req.session.theUserId;
  //var url = req.body.url;
  console.info('JournalEdit', id, body, isTriple);
  try {
    await JournalModel.updateJournalEntry(id, body, usrId, usr, isTriple);
    return res.redirect(`/journal/${id}`);
  } catch (err) {
    console.error(err);
    req.flash(`Error saving edited Journal: ${id}`);
    return res.redirect('/');
  }
});

router.get('/topic/:id', helper.isPrivate, async (req, res, next) => {
  const id = req.params.id;
  console.info("GetTopic", id);
  try {
    const data = await JournalModel.getTopic(id);
    console.info("GetTopic-2", data);
    const json = data;
    json.title = config.banner;
    json.canSignup = config.canSignup;
    json.isAuthenticated = helper.isAuthenticated(req);

    json.jsonSource = JSON.stringify(data);
    return res.render('topicview', json);
  } catch (err) {
    console.error(err);
    req.flash("error", `Cannot find Topic: ${id}`);
    return res.redirect('/');
  }
});

router.get('/journal/:id', helper.isPrivate, async (req, res, next) => {
  const id = req.params.id;
  const userId = req.session.theUserId;
  console.info("GetJournal", id);
  try {
    const data = await JournalModel.getJournalEntry(id);
    data.title = config.banner;
    data.canEdit = userId === data.userId;
    data.canSignup = config.canSignup;
    //migration from array to single string
    var bl = data.bodylist;
    if (bl && Array.isArray(bl)) {
      //heritage installations have just one entry
      // convert it back to a single string
      data.bodylist = bl[0];
    }
    console.info("GetJournal-1", data);
    return res.render('journalview', data);
  } catch (err) {
    console.error(err);
    req.flash("error", `Cannot find Journal: ${id}`);
    return res.redirect('/');
  }
});

router.get('/journaledit/:id', async (req, res, next) => {
  const id = req.params.id;
  
  try {
    const data = await JournalModel.getJournalEntry(id);
    const subj = data.subj;
    let isTriple = true;
    if (!subj) {
      isTriple = false;
      data.texttoedit = data.raw;
    } else {
      var bl = data.bodylist;
      if (bl && Array.isArray(bl)) {
        bl = bl[0];
      }
      data.texttoedit = bl;
    }
    data.isTriple = isTriple;
    data.title = config.banner;
    data.canSignup = config.canSignup;
    return res.render('journal_edit_form', data);
  } catch (err) {
    console.error(err);
    req.flash("error", `Cannot find Journal to edit: ${id}`);
    return res.redirect('/');
  }
});

module.exports = router;
