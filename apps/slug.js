"use strict";
/**A utility file to convert a term to a slug */
var slugify = require('slugify')

function toSlug(term) {
  // by making it lower case, we trap the same term
  // no matter whether caps are involved.
  var tx = term.toLowerCase();
  return slugify(tx, '_');
};

module.exports = toSlug;
