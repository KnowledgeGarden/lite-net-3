/**A utility file to convert a term to a slug */
var slugify = require('slugify')
var Slugger;
var instance;

Slugger = function() {
  var self = this;

  self.toSlug = function(term) {
    // by making it lower case, we trap the same term
    // no matter whether caps are involved.
    var tx = term.toLowerCase();
    return slugify(tx, '_');
  };


};

if (!instance) {
  instance = new Slugger();
}
module.exports = instance;