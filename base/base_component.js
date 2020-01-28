'use strict';

/**
 * @typedef {import('../lib/application').Application} Application
 */


/**
 * BaseComponent is a base class that can be extended.
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
	 * @interface
	 * @param {Function} cb
	 * @return {Void}
	 */
	start (cb) {
		process.nextTick(cb);
	}

	/**
	 * Component lifecycle callback
	 * @interface
	 * @param {Function} cb
	 * @return {Void}
	 */
	afterStart(cb) {
		process.nextTick(cb);
	}

	/**
	 * Component lifecycle function
	 * @interface
	 * @param {Boolean}  force whether stop the component immediately
	 * @param {Function}  cb
	 * @return {Void}
	 */
	stop(force, cb) {
		process.nextTick(cb);
	}
}

module.exports = BaseComponent;