'use strict';

/**
 * BaseFilter is a filter base class that can be extended.
 */
class BaseFilter {

  /** Before filter
   * 
   * @param {object} msg message 
   * @param {object} session 
   * @param {function} next callback Function 
   */
  before (msg, session, next) { 
    next();
  }
  
  /** After filter
   * 
   * @param {object} err 
   * @param {object} msg 
   * @param {object} session 
   * @param {object} resp 
   * @param {function} next 
   */
  after (err, msg, session, resp, next) {
    next(err);
  }
}

module.exports = BaseFilter;
