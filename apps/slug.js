"use strict";
/**A utility file to convert a term to a slug */
const slugify = require('slugify');

function toSlug(term) {
  // by making it lower case, we trap the same term
  // no matter whether caps are involved.
  const tx = term.toLowerCase();
  return slugify(tx, '_');
};

module.exports = toSlug;
