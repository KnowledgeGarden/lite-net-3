"use strict";
const Datastore = require('nedb-promises');

class UserDatabase {
  constructor() {
    this.db = new Datastore({ filename: './data/users' , autoload: true });
    console.info('Database '+this.db);
  }

  /**
   * Persist an account
   * @param struct
   */
  async saveAccount(struct) {
    return await this.db.insert(struct);
  };

  /**
   * Report {@code true} if database is empty
   */
  async isEmpty() {
    const doc = await this.db.find({});
    console.info("UserEmpty", doc);
    return (doc && doc.length > 0);
  };

  /**
   * Return an account or {@code null}
   * @param email
   */
  async fetchAccount(email) {
    return await this.db.findOne({ email });
  }
}

const instance = new UserDatabase();
module.exports = instance;
