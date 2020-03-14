var express = require('express');
var helper = require('./helper');
var router = express.Router();

var JournalModel = require('../apps/models/journal_model');
var AdminModel = require('../apps/models/admin_model');

var config = require('../config/config');
var predicates;
var hbs = require('hbs');

hbs.registerHelper('toJSON', function(obj) {
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

/////////////////////
// User Accounts
/////////////////////

router.get('/signup', function(req, res, next) {
  var data = baseData(req);
  return res.render('signup_form', data);
});

router.get('/login', function(req, res, next) {
  console.info("login");
  var data = baseData(req);
  return res.render('login_form', data);
});

router.get('/logout', function(req, res, next) {
  var struct = {};
  req.session.theUser = null;
  req.session.theUserId = null;
  helper.logout(req);
  return res.redirect('/');
});

router.post('/signup', function(req, res, next) {
  var email = req.body.email,
      handle = req.body.handle,
      fullName = req.body.fullname,
      pwd = req.body.password;
  AdminModel.signup(email, handle, fullName, pwd, function(err) {
    console.log("Index.post",email,err);
    if (!err) {
      req.flash("success", "Signup succeeded");
      return res.redirect('/');
    } else {
      console.log("Index.post-2");
      req.flash("error", "Signup Problem: "+err);
      return res.redirect('/');       
    }
  });
});

router.post('/login', function(req, res, next) {
  var email = req.body.email,
      password = req.body.password;
      //ip =  helper.checkIP(req, "login", "signup");
  AdminModel.authenticate(email, password, function(err, truth, handle, userId) {
    console.info("Authenticate", err, truth, handle, userId);
    if (err) {
      req.flash("error", err);
    }
    if (truth) {
      req.session.theUser = handle;
      req.session.theUserId = userId;
      req.session.theUserEmail = email;
      console.info("Authentication passed");
      req.flash("success", "Login succeeded");
      return res.redirect('/');
    } else {
      console.info("Authentication failed");
      req.flash("error", "Login failed");
      return res.redirect('/');
    }
  });
});
//////////////////////////

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
router.get('/', helper.isPrivate, function(req, res, next) {
  validatePredicates();
  JournalModel.list(function(err, noteList) {
    var data = baseData(req);
    data.predicates = predicates;
    console.info('IP3', predicates.terms[0]);
    if (req.flash) {
      data.flashMsg = req.flash("error") || req.flash("success");
    }
    data.noteList = noteList;
    return res.render('index', data);
  });
});

router.get('/iframe', function(req, res, next) {
  validatePredicates();
  var url = req.query.fName;
  console.info('IFRAME', url);
  JournalModel.listByURL(url, function(err, hits) {
    var data = baseData(req);
    data.predicates = predicates;
    data.url = url;
    data.hits = hits;
    return res.render('iframe', data);
  });
  
});

router.get('/new_note_route', function(req, res, next) {
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
 */
router.get('/:id', helper.isPrivate, function(req, res, next) {
  var id = req.params.id;
  var data = baseData(req);
  data.id = id;
  return res.render('index', data);
});

router.post('/postAtriple', function(req, res, next) {
  var subject = req.body.subject;
  var predicate = req.body.predicate;
  var object = req.body.object;
  var url = req.body.url;
  var notes = req.body.notes;
  var usr = req.session.theUser;
  var usrId = req.session.theUserId;
  console.info('PostTriple', subject, predicate, object, url, notes);
  
  JournalModel.processTriple(subject, predicate, object, url, notes,
                             usrId, usr, function(err, dat) {
    if (err) {
      req.flash("error", err);
      return res.redirect('/');
    } else {                   
      console.log('BigTriple', dat);
      return res.redirect('/journal/'+dat.id);
    } 
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
  var usr = req.session.theUser;
  var usrId = req.session.theUserId;
  console.info("PostTopic", id, parentId, url, body);
  if (!id && !parentId && body) {
    JournalModel.newAIR(body, url, usrId, usr, function(err, data) {
      console.info('NewAirIndex', err, data);
      if (err) {
        req.flash("error", err);
        return res.redirect('/');
      } else {
        return res.redirect('/journal/'+data.id);
      }
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

router.get('/topic/:id', helper.isPrivate, function(req, res, next) {
  var id = req.params.id;
  console.info("GetTopic", id);
  JournalModel.getTopic(id, function(err, data) {
    console.info("GetTopic-2", data);
    if (data) {
      var json = data;
      json.title = config.banner;
      json.canSignup = config.canSignup;
      json.isAuthenticated = helper.isAuthenticated(req);

      json.jsonSource = JSON.stringify(data);
      return res.render('topicview', json);
    } else {
      req.flash("error", "Cannot find Topic: "+id);
      return res.redirect('/');
    }
  });
});

router.get('/journal/:id', helper.isPrivate, function(req, res, next) {
  var id = req.params.id;
  console.info("GetJournal", id);
  JournalModel.getJournalEntry(id, function(err, data) {
    if (data) {
      data.title = config.banner;
      data.canSignup = config.canSignup;
      console.info("GetJournal-1", data);
      return res.render('journalview', data);
    } else {
      req.flash("error", "Cannot find Journal: "+id);
      return res.redirect('/');
    }
  });
});



module.exports = router;
