"use strict";
const Datastore = require('nedb-promises')

class Database {
  constructor() {
    this.db = new Datastore({ filename: './data/journal' , autoload: true });
    console.info('Database '+this.db);
  }

  /**
   * Insert a journal entry
   * @param jsonDoc 
   */
  async put(jsonDoc) {
    return await this.db.insert(jsonDoc);
  }

  /**
   * Return a journal entry identified by <code>id</code>
   * @param id 
   */
  async get(id) {
    return await this.db.findOne({ id: id });
  }

  /**
   * Return a list of journal entries sorted on date latest on top
   */
  async list() {
    return await this.db.find({}).sort({ date: -1 });
  }

    /**
   * General find support
   * @param query json
   */
  async find(query) {
    console.info('JnlFind', query);
    return await this.db.find(query);
  }

  /**
   * Find topics by URL
   * @param url
   */
  async findByURL(url) {
    return await this.find({ urllist: url });
  }

};

const instance = new Database();
module.exports = instance;
