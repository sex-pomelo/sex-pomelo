"use strict";

/**
 * @file Pomelo
 * Copyright(c) 2012 xiechengchao <xiecc@163.com>
 * MIT Licensed
 */

const fs = require('fs');
const path = require('path');
const Application = require('./application');
const Package = require('../package');


/**
 * The Auto loaded filters
 * @typedef {object} AutoFilters
 * @property {Function} serial
 * @property {Function} time 
 * @property {Function} timeout 
 * @property {Function} toobusy
 */

 /**
 * The Auto loaded filters
 * @typedef {object} AutoRpcFilters
 * @property {Function} rpcLog
 * @property {Function} toobusy
 */

 /**
 * The connectors 
 * @typedef {object} DefaultConnectors
 * @property {string} sioconnector
 * @property {string} hybridconnector
 * @property {string} udpconnector
 * @property {string} mqttconnector
 */


/**
 * @class
 */
class Pomelo{
  constructor(){
    
    /** @type {Application} */
    this.app = null;

    /**
     * Framework version.
     */
    this.version = Package.version;

    /**
     * Event definitions that would be emitted by app.event
     */
    this.events = require('./util/events');

    /**
     * auto loaded components
     */
    this.components = {};

    /**
     * auto loaded filters
     * @type AutoFilters
     */
    this.filters = {};

    /**
     * auto loaded rpc filters
     * @type AutoRpcFilters
     */
    this.rpcFilters = {};

    /**
     * connectors
     * @type DefaultConnectors
     */
    this.connectors = {};
    //this.connectors.__defineGetter__('sioconnector', load.bind(null, './connectors/sioconnector'));
    //this.connectors.__defineGetter__('hybridconnector', load.bind(null, './connectors/hybridconnector'));
    //this.connectors.__defineGetter__('udpconnector', load.bind(null, './connectors/udpconnector'));
    //this.connectors.__defineGetter__('mqttconnector', load.bind(null, './connectors/mqttconnector'));

    Object.defineProperty(this.connectors, 'sioconnector', {enumerable: true,
      get: function(){return load.bind(null, './connectors/sioconnector')();}
    });

    Object.defineProperty(this.connectors, 'hybridconnector', {enumerable: true,
      get: function(){return load.bind(null, './connectors/hybridconnector')();}
    });

    Object.defineProperty(this.connectors, 'udpconnector', {enumerable: true,
      get: function(){return load.bind(null, './connectors/udpconnector')();}
    });

    Object.defineProperty(this.connectors, 'mqttconnector', {enumerable: true,
      get: function(){return load.bind(null, './connectors/mqttconnector')();}
    });

    /**
     * pushSchedulers
     */
    this.pushSchedulers = {};
    //this.pushSchedulers.__defineGetter__('direct', load.bind(null, './pushSchedulers/direct'));
    //this.pushSchedulers.__defineGetter__('buffer', load.bind(null, './pushSchedulers/buffer'));

    Object.defineProperty(this.pushSchedulers, 'direct', {enumerable: true,
      get: function(){return load.bind(null, './pushSchedulers/direct')();}
    });

    Object.defineProperty(this.pushSchedulers, 'buffer', {enumerable: true,
      get: function(){return load.bind(null, './pushSchedulers/buffer')();}
    });
    

    this.loadInit();
  }

  loadInit(){
    let Pomelo = this;
    /**
     * Auto-load bundled components with getters.
     */
    fs.readdirSync(__dirname + '/components').forEach(function (filename) {
      if (!/\.js$/.test(filename)) {
        return;
      }
      let name = path.basename(filename, '.js');
      let _load = load.bind(null, './components/', name);
      //Pomelo.components.__defineGetter__(name, _load);
      //Pomelo.__defineGetter__(name, _load);

      Object.defineProperty(Pomelo.components, name, {enumerable: true,value: _load(),});
      Object.defineProperty(Pomelo, name, {enumerable: true,value: _load(),});
    });

    fs.readdirSync(__dirname + '/filters/handler').forEach(function (filename) {
      if (!/\.js$/.test(filename)) {
        return;
      }
      let name = path.basename(filename, '.js');
      let _load = load.bind(null, './filters/handler/', name);
      
      //Pomelo.filters.__defineGetter__(name, _load);
      //Pomelo.__defineGetter__(name, _load);
      Object.defineProperty(Pomelo.filters, name, {enumerable: true, value: _load(),});
      Object.defineProperty(Pomelo, name, {enumerable: true, value: _load(),});
    });


    fs.readdirSync(__dirname + '/filters/rpc').forEach(function (filename) {
      if (!/\.js$/.test(filename)) {
        return;
      }
      let name = path.basename(filename, '.js');
      let _load = load.bind(null, './filters/rpc/', name);
      //Pomelo.rpcFilters.__defineGetter__(name, _load);
      Object.defineProperty(Pomelo.rpcFilters, name, {enumerable: true,value: _load(),});
    });
  }


  /**
   * Create an pomelo application.
   *
   * 
   * @memberOf Pomelo
   * @api public
   * 
   */
  createApp (opts) {
    let app = new Application();
    app.init(opts);
    this.app = app;
    return app;
  }

};


module.exports = new Pomelo();


function load(path, name) {
  if (name) {
    return require(path + name);
  }
  return require(path);
}
