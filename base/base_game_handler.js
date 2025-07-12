'use strict';


/**
 * BaseGameHandler is a base class that can be extended.
 */
class BaseGameHandler {

  /**
   * 
   * @param {import('../types/index').Application} app - pomelo application instance
   */
  constructor(app){

    /** @type {import('../types/index').Application} */
    this.app = app;
  }
}

module.exports = { BaseGameHandler };
