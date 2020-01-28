'use strict';

const Application = require('../lib/application');

/**
 * BaseLifecycle is a base class that can be extended.
 */
class BaseLifecycle {

  /** lifeCycle Before Startup
   * 
   * @param {Application} app 
   * @param {Function} cb 
   */
  static beforeStartup (app, cb) {
    // do some operations after application start up
    cb();
  }
  
  /** lifeCycle Before Startup
   * 
   * @param {Application} app 
   * @param {Function} cb 
   */
  static afterStartup (app, cb) {
    // do some operations after application start up
    cb();
  }
  
  /** lifeCycle Before Startup
   * 
   * @param {Application} app 
   * @param {Function} cb 
   */
  static beforeShutdown(app, cb) {
    // do some operations after application start up
    cb();
  }
  
  /** lifeCycle Before Startup
   * 
   * @param {Application} app 
   * @param {Function} cb 
   */
  static afterStartAll(app) {
    // do some operations after all applications start up
  }
}

module.exports = { BaseLifecycle };
