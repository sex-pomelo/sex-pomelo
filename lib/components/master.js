"use strict";

/**
 * @file Component for master.
 */
const Master = require('../master/master');
const Application = require('../application');

/**
 * @class
 * @implements {Component}
 */
class MasterComp{

  /**
  * Master component class
  *
  * @param {Application} app  current application context
  */
  constructor(app, opts){
    this.name = '__master__';
    this.master = new Master(app, opts);
  }

  /**
   * Component lifecycle function
   *
   * @param  {Function} cb
   * @return {Void}
   */
  start (cb) {
    this.master.start(cb);
  };

  /**
   * Component lifecycle function
   *
   * @param  {Boolean}   force whether stop the component immediately
   * @param  {Function}  cb
   * @return {Void}
   */
  stop  (force, cb) {
    this.master.stop(cb);
  }
}

/**
 * Component factory function
 *
 * @param  {Application} app  current application context
 * @return {MasterComp}      component instances
 */
module.exports = function (app, opts) {
	return new MasterComp(app, opts);
};