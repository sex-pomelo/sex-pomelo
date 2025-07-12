'use strict';

/**
 * Interface for classes that Filter
 *
 * @interface Filter
 */

/**
 * Before filter
 *
 * @function
 * @name Filter#before
 * @param {object} msg message 
 * @param {object} session 
 * @param {function} next callback Function 
 */

 /**
 * After filter
 *
 * @function
 * @name Filter#after
 * @param {object} err 
 * @param {object} msg 
 * @param {object} session 
 * @param {object} resp 
 * @param {function} next 
 */



/**
 * BaseFilter is a filter base class that can be extended.
 * @class
 * @implements {Filter}
 */
class BaseFilter {

  /** Before filter
   * @param {object} msg message 
   * @param {object} session 
   * @param {function} next callback Function 
   */
  before (msg, session, next) { 
    next();
  }
  
  /** After filter
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

module.exports = { BaseFilter };
