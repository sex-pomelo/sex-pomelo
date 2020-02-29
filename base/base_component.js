'use strict';

/**
 * @typedef {import('../lib/application').Application} Application
 */

 /**
 * Interface for classes that Component
 *
 * @interface Component
 */

/**
 * Component lifecycle callback, start
 *
 * @function
 * @name Component#start
 * @param {Function} cb
 * @return {Void}
 */

 /**
 * Component lifecycle callback, afterStart
 *
 * @function
 * @name Component#afterStart
 * @param {Function} cb
 * @return {Void}
 */

 /**
 * Component lifecycle callback, stop
 *
 * @function
 * @name Component#stop
 * @param {Boolean}  force whether stop the component immediately
 * @param {Function}  cb
 * @return {Void}
 */


/**
 * BaseComponent is a base class that can be extended.
 * @class
 * @implements {Component}
 */
class BaseComponent {

  /** constructor BaseComponent
   * 
   * @param {Application} app current application context
   * @param {object} opts component opts
   */
  constructor(app,opts){
    this.app = app;
  }

  /**
	 * Component lifecycle callback
	 * @param {Function} cb
	 * @return {Void}
	 */
	start (cb) {
		process.nextTick(cb);
	}

	/**
	 * Component lifecycle callback
	 * @param {Function} cb
	 * @return {Void}
	 */
	afterStart(cb) {
		process.nextTick(cb);
	}

	/**
	 * Component lifecycle function
	 * @param {Boolean}  force whether stop the component immediately
	 * @param {Function}  cb
	 * @return {Void}
	 */
	stop(force, cb) {
		process.nextTick(cb);
	}
}

module.exports = BaseComponent;