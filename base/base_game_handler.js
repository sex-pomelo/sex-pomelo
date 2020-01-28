'use strict';

const Application = require('../lib/application');

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
