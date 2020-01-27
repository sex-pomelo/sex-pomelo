'use strict';

const Application = require('../lib/application');

/**
 * BaseContextClass is a base class that can be extended,
 * it's instantiated in context level,
 * {@link Helper}, {@link Service} is extending it.
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
