"use strict";
var userDB = require('../user_database');
var uuid = require('uuid');
var bcrypt = require('bcrypt-nodejs');
const util = require('util');

class AdminModel {

  constructor() {
    this.hash = util.promisify(bcrypt.hash);
    this.compare = util.promisify(bcrypt.compare);
  }

  /**
   * Register a new account
   * @param email
   * @param handle
   * @param fullName
   * @param password
   */
  async signup(email, handle, fullName, password) {
    console.info("Signup", email, handle, fullName);
    const hash = await this.hash(password, null, null);
    console.info("Signup 2", hash);
    const account = await userDB.saveAccount({
        id: uuid.v4(),
        pwd: hash,
        email,
        handle,
        fullName,
    });
    console.info("Signup 3", account);
    return account
  };

  /**
   * Authenticate a user
   * @param email
   * @param password
   */
  async authenticate(email, password) {
    console.log("AdminModel.authenticate", email, password);
    const json = await userDB.fetchAccount(email);
    console.log("AdminModel.authenticate-1", email, json);
    if (!json) {
        throw new Error("No account for "+email);
    }
    const success = await this.compare(password, json.pwd);
    return {success, handle: json.handle, userId: json.id};
  }
}

const instance = new AdminModel();
module.exports = instance;
