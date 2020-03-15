"use strict";
var Datastore = require('nedb-promises')

class Database {
  constructor() {
    this.db = new Datastore({ filename: './data/topics' , autoload: true });
    console.info('Database '+this.db);
  }

  /**
   * Insert a topic
   * @param jsonDoc the topic
   */
  async put(jsonDoc) {
    return await this.db.insert(jsonDoc);
  };

  /**
   * @param id 
   * @parm backlink
   */
  async addBacklink(id, backlink) {
    return await this.db.update({ id: id }, { $push: { backlinks: backlink } });
  };

  /**
   * For compacting as needed
   */
  async compact() {
    return await this.db.persistence.compactDatafile();
  };

  /**
   * Remove a topic identified by <code>_id</code>
   * @param _id 
   */
  async delete(_id) {
    return await this.db.remove({ _id: _id });
  };

  /**
   * @param id 
   */
  async get(id) {
    return await this.db.findOne({ id: id });
  };

  /**
   * General find support
   * @param query json
   */
  async find(query) {
    console.info('TDB', query);
    return await this.db.find(query);
  };

  /**
   * Find topics by URL
   * @param url
   */
  async findByURL(url) {
    return await this.find({ url: url });
  };

  /**
   * Replace a topic
   * @param newTopic
   */
  async replaceBacklinks(_id, backlinks) {
    numRep = await this.db.update({ _id: _id }, {$set:{ backlinks: backlinks }});
    console.info('ReplaceBacklinks', _id, backlinks, numRep);
    await this.db.persistence.compactDatafile();
    return numRep;
  };

  /**
   * Add in either {@code url}, or {@code body} or both
   * @param url  can be {@code null}
   * @param body can be {@code null}
   */
  async updateTopic(id, url, body) {
    //TODO rewrite this to avoid duplicates
    if (url) {
      await this.db.update({ id: id }, { $push: { urllist: url } }, {});
      await this.db.update({ id: id }, { $push: { bodylist: body } }, {});
    } else if (body) {
      await this.db.update({ id: id }, { $push: { bodylist: body } }, {});
    } else {
      throw new Error('TopicDatabas.updateTopic got nothing ', id);
    }
  };

};

const instance = new Database();
module.exports = instance;
