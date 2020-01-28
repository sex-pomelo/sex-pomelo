'use strict';

/**
 * @typedef {import('../lib/application').Application} Application
 */

/**
 * BaseCron is a base class that can be extended.
 */
class BaseCron {

  /**
   * 
   * @param {Application} app 
   */
  constructor(app){
    this.app = app;
  }
}

module.exports = BaseCron;
