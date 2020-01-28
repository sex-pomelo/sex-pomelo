'use strict';

/**
 * @typedef {import('../lib/application').Application} Application
 */

/**
 * BaseGameHandler is a base class that can be extended.
 */
class BaseGameHandler {

  /**
   * 
   * @param {Application} app 
   */
  constructor(app){
    this.app = app;
  }
}

module.exports = BaseGameHandler;
