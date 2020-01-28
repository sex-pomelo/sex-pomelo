'use strict';

/**
 * @typedef {import('../lib/application').Application} Application
 */

/**
 * BaseGameRemote is a base class that can be extended.
 */
class BaseGameRemote {

  /**
   * 
   * @param {Application} app 
   */
  constructor(app){
    this.app = app;
  }
}

module.exports = BaseGameRemote;
