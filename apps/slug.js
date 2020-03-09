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

      //https://stackoverflow.com/questions/1137436/what-are-useful-javascript-methods-that-extends-built-in-objects/1137579#1137579
      String.prototype.replaceAll = function(search, replace)
      {
          //if replace is not sent, return original string otherwise it will
          //replace search string with 'undefined'.
          if (replace === undefined) {
              return this.toString();
          }
      
          return this.replace(new RegExp('[' + search + ']', 'g'), replace);
      };
  /**
   * 
   * @param {*} str 
   * @returns
   */
  self.replaceAll = function(str, search, replace) {
    return str.replaceAll(search, replace);
  };  
};

if (!instance) {
  instance = new Slugger();
}
module.exports = instance;