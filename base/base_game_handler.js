'use strict';

const { EventEmitter } = require( 'events' );


/**
 * BaseGameHandler is a base class that can be extended.
 */
class BaseGameHandler extends EventEmitter {

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
