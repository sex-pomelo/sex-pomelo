'use strict';



/**
 * BaseGameRemote is a base class that can be extended.
 */
class BaseGameRemote {

  /**
   * 
   * @param {import('../types/index').Application} app 
   */
  constructor(app){
    /** @type {import('../types/index').Application} */
    this.app = app;
  }
}

module.exports = { BaseGameRemote };
