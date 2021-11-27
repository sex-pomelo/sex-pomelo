"use strict";

/**
 * @file Component for monitor.
 * Load and start monitor client.
 */
const Monitor = require('../monitor/monitor');
const BaseComp = require('../../base/base_component');

/**
 * @typedef {import('../application').Application} Application
 */

/**
 * Monitor component class
 * @typedef {MonitorComp} MonitorComp
 * @ignore
 */

/**
 * @class
 * @implements {Component}
 */
class MonitorComp extends BaseComp{
/**
 *
   * @param {Application} app current application context
   * @param {object} opts component opts
 */
  constructor(app, opts){
    super(app, opts);
    this.name = '__monitor__';
    this.monitor = new Monitor(app, opts);
  }


  start (cb) {
    this.monitor.start(cb);
  }

  stop(force, cb) {
    this.monitor.stop(cb);
  }

  reconnect(masterInfo) {
    this.monitor.reconnect(masterInfo);
  }
}



/**
 * Component factory function
 *
 * @param  {Object} app  current application context
 * @return {Object}      component instances
 */
module.exports = function(app, opts) {
  return new MonitorComp(app, opts);
};




