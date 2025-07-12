'use strict';



/**
 * Interface for classes that LifeCycle
 *
 * @interface LifeCycle
 */

/**
 * lifeCycle Before Startup
 *
 * @function
 * @name LifeCycle#beforeStartup
 * @param {import('../types/index').Application} app 
 * @param {Function} cb 
 */

 /**
 * lifeCycle After Startup
 *
 * @function
 * @name LifeCycle#afterStartup
 * @param {import('../types/index').Application} app 
 * @param {Function} cb 
 */

 /**
 * lifeCycle Before Shutdown
 *
 * @function
 * @name LifeCycle#beforeShutdown
 * @param {import('../types/index').Application} app 
 * @param {Function} cb 
 */

 /**
 * lifeCycle After Start All
 *
 * @function
 * @name LifeCycle#afterStartAll
 * @param {import('../types/index').Application} app 
 * @param {Function} cb 
 */


/**
 * BaseLifecycle is a base class that can be extended.
 * @class
 * @implements {LifeCycle}
 */
class BaseLifecycle {

  /** lifeCycle Before Startup
   * @param {import('../types/index').Application} app 
   * @param {Function} cb 
   */
  static beforeStartup (app, cb) {
    // do some operations after application start up
    cb();
  }
  
  /** lifeCycle After Startup
   * @param {import('../types/index').Application} app 
   * @param {Function} cb 
   */
  static afterStartup (app, cb) {
    // do some operations after application start up
    cb();
  }
  
  /** lifeCycle Before Shutdown
   * @param {import('../types/index').Application} app 
   * @param {Function} cb 
   */
  static beforeShutdown(app, cb) {
    // do some operations after application start up
    cb();
  }
  
  /** lifeCycle After Shutdown
   * @param {import('../types/index').Application} app 
   * @param {Function} cb 
   */
  static afterStartAll(app) {
    // do some operations after all applications start up
  }
}

module.exports = { BaseLifecycle };
