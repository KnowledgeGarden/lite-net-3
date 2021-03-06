"use strict";
const toSlug = require('../slug');

class Linker {

  /**
   * A term might be surrounded with html, e.g. <b>, <i>
   * @param term 
   * @returns cleaned up term
   */
  cleanTerm(term) {
    if (term.startsWith('<')) {
      let result = term;
      let where = result.indexOf('>');
      if (where > -1) {
        result = result.substring((where+1));
        where = result.indexOf('<');
        if (where > -1) {
          result = result.substring(0, where);
        }
        return result;
      }
    } else {
      return term;
    }
  }

  /**
   * Given a term --> topic,
   * create an href for it.
   * @param term 
   * @return href
   */
  getHref(term, slug) {
    
    const result = `<a href="/topic/${slug}">${term}</a>`;
    return result;
  };
  //////////////////////////////////
  // This is complex:
  // We are walking through a block of text to be added to a
  //  topic node. If we see a Wikilink, we must do the following:
  //  a) convert that term to an href
  //  b) fire up the backlink to this block of text
  //    which technically means that the block of text must have
  //    its own ID,
  //    OR,it means that this entire topic represents the backlink
  //
  //////////////////////////////////
  /**
   * Given some text, look for Wikilinks.
   * Where found, convert those to hrefs and reconstruct the
   * text including the hrefs.
   * Returns the revised text (with hrefs, if any) and a list
   * of topics and their slugs found, if any
   * @param text 
   */
  resolveWikiLinks(text) {
    console.info('LINKER', text);
    const topiclist = []; // topic is a json object with label and slug
    let result = "";
    let begin = text.indexOf("[[");
    if (begin > -1) {
      result = `${text.substring(0, begin)} `;
    }
    let end = 0;
    let term;
    let slug;
    let jsonT;
    //loop if there is any [[ found
    while (begin > -1) {
      begin += 2;
      //find the end
      end = text.indexOf("]]", begin);
      if (end > -1) { // end found
        term = text.substring(begin, end).trim();
        console.info('LINKER-1', begin, end, term, text);
        term = this.cleanTerm(term);
        //ALL wikilinks are to Topics
        slug = `TOP_${toSlug(term)}`;
        // add href to result
        result += `${this.getHref(term, slug)} `;
        jsonT = {};
        jsonT.label = term;
        jsonT.slug = slug;
        topiclist.push(jsonT);
        end += 2;
        begin = text.indexOf("[[", end);
        console.info('LINKER-2', begin, end, text.length, term, text);
        if (begin === -1 && (end) < text.length) {
          //add remainder, if any
          result += text.substring(end);
        } else if (begin > -1 && end < text.length) {
          //add gap from last end+2
          result += `${text.substring((end), begin)} `;
        }
      } else { // proper end not found - error condition
        throw new Error("Open Wikilink with improper or no Closing Wikilink-missing ]]");
      }
    }
    if (result === "") { // if nothing found, just return the text
      result = text;
    }
    return {body: result.trim(), topiclist};
  };

  /**
   * Craft a triple for viewing as 3 hrefs
   * @param subject
   * @param sSlug
   * @param object
   * @param oSlug
   * @param predicate
   * @param pSlug
   * @return
   */
  setHrefs(subject, sSlug, object, oSlug, predicate, pSlug) {
    let result = "";
    const sHref = `<a href="/topic/${sSlug}">${subject}</a>`;
    const oHref = `<a href="/topic/${oSlug}">${object}</a>`;
    const pHref = `<a href="/topic/${pSlug}">${predicate}</a>`;
    result += `${sHref} `;
    result += `${pHref} `;
    result += ` ${oHref}`;
    return result;
  };
  
};

const  instance = new Linker();
module.exports = instance;
