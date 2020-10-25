'use strict';

const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo');
const fs= require('fs');
const path = require('path');

/**
 * @typedef {import('../lib/application').Application} Application
 */
/** PluginCfg
  * @typedef {Object} PluginCfg
  * @property {string} package - plugin require path
  * @property {String} name - plugin name
  * @property {String} serverType - plugin use serverType
  * @property {Object} cfg - plugin config
  */

 /** Cfg
  * @typedef {Object} SexAppCfg
  * @property {string} name - app name
  * @property {PluginCfg[]} plugins - 插件
  */



/**
 * BaseApp is a base class that can be extended.
 */
class BaseApp {

  constructor( pomelo ){

    this.pomelo = pomelo;

    /** @type {Application} */
    this.app = pomelo.createApp();

    /** @type {string} Server ID */
    this.serverId = this.app.serverId;

    /** @type {string} Server Type */
    this.serverType = this.app.serverType;
    
    /** @type {SexAppCfg} */
    this.cfg = {};

    this.routeFun = {};

    this.routeFileCTime = 0;  // route file change Time

    process.on('uncaughtException', (err) =>{
      let szErr = err.stack.toString();
      if(szErr.indexOf('read ECONNRESET') !== -1){
        return;
      }
        console.error(' Caught exception: ' + szErr);
        let szPre = "\n\n ----- 1: " + this.serverId + " " + (new Date());
        logger.warn(szPre + szErr);
    });

    if( typeof(this.preLoadCfg) === 'function' ){
      this.preLoadCfg();
    }

  
    let cfgPath = this.app.getCfgPath('config.js');
    if( fs.existsSync( cfgPath ) ){
      let cfgFun = require( cfgPath );
      this.cfg = cfgFun( this.app );

      this.setupSet();

      this.setupPlugin();

      this.setupConfigs();

      this.setupFilters();

      this.setupComponent();

      this.setupRoute();
    }

    if( typeof(this.preStart) === 'function' ){
      this.preStart();
    }

    this.app.start();

    if( typeof(this.postStart) === 'function' ){
      this.postStart();
    }
  }

  setRouteFunction( routeType, fn){
    this.routeFun[ routeType] = fn;
  }

  /** setup some set 
   * 
   */
  setupSet(){
    const {cfg,app} = this;

    if( typeof(cfg.name) === 'string' ){
      this.app.set('name', this.cfg.name);
    }

    if( cfg.connectorConfig ){
      app.configure(() =>{
        app.set('connectorConfig',
        {
            connector : this.pomelo.connectors[cfg.connectorConfig.connectors],
            transports: cfg.connectorConfig.transports,
            disconnectOnTimeout: (cfg.connectorConfig.disconnectOnTimeout === true),
            heartbeat : cfg.connectorConfig.heartbeat,
            timeout   : cfg.connectorConfig.timeout,
            // enable useProto
            useProtobuf: (cfg.connectorConfig.useProtobuf === true),
            useDict: (cfg.connectorConfig.useDict === true)
        });
      });
    }

    app.set('errorHandler', this.errorHandler);
  }

  /**
   * setup plugin
   */
  setupPlugin(){
    const {cfg, app} = this;
    if( Array.isArray(cfg.plugins) === false || cfg.plugins.length === 0 ) {
      return;
    }

    for( let it of cfg.plugins ){
      let load = false;
      if( !it.serverType || it.serverType === '' ){
        load = true;
      } else {
        if( contains( this.serverType, it.serverType ) ){
          load = true;
        }
      }

      if( load === true ){
        let plug = require( it.package );
        app.use(plug, it.cfg);
      }
    }
  }


  setupConfigs (){
    const {cfg, app} = this;
    if( Array.isArray(cfg.configs) === false || cfg.configs.length === 0 ) {
      return;
    }

    for( let it of cfg.configs ){
      let load = false;
      if( !it.serverType || it.serverType === '' ){
        load = true;
      } else {
        if( contains( this.serverType, it.serverType ) ){
          load = true;
        }
      }

      //console.log( '--- cfg,', it.name, load, it.serverType, this.serverType  );
      if( load === true ){
        app.loadConfig(it.name, app.getCfgPath( it.cfg));
      }
    }
  }

  setupComponent(){
    const {cfg, app} = this;
    if( Array.isArray(cfg.components) === false || cfg.components.length === 0 ) {
      return;
    }

    let base = this.app.getBase();
    base = path.join(base,'app/components');
    for( let it of cfg.components ){
      let load = false;
      if( !it.serverType || it.serverType === '' ){
        load = true;
      } else {
        if( contains( this.serverType, it.serverType ) ){
          load = true;
        }
      }

      if( load === true ){
        let compPath = path.join( base, it.name );
        let comp = require( compPath );
        
        let cfgDef = {};
        if( typeof(it.serverTypeNick) === 'string' && it.serverTypeNick.length > 0 ){
          cfgDef[it.serverTypeNick] = this.serverType;
        }

        if( typeof(it.serverIdNick) === 'string' && it.serverIdNick.length > 0 ){
          cfgDef[it.serverIdNick] = this.serverId;
        }

        let cfgComp = it.cfg? it.cfg: {};
        cfgComp = { ...cfgComp,...cfgDef};

        app.load( comp, cfgComp );
        //console.log( '---', this.serverType, it.name, cfgComp );

      }
    }

  }

  setupFilters(){
    const {cfg, app} = this;
    if( Array.isArray(cfg.filters) === false || cfg.filters.length === 0 ) {
      return;
    }

    let base = this.app.getBase();
    for( let it of cfg.filters ){
      let load = false;
      if( !it.serverType || it.serverType === '' ){
        load = true;
      } else {
        if( contains( this.serverType, it.serverType ) ){
          load = true;
        }
      }

      if( load === true ){
        let isInterFilter = false;
        let filterPath = path.join( base, it.package );
        if( fs.existsSync( filterPath) === false){
          filterPath += '.js';
          if( fs.existsSync( filterPath ) === false ){
            if( this.pomelo.filters[it.package] ){
              isInterFilter = true;
            }
          }
        }

        let paras = it.argv ? it.argv : [];

        if( isInterFilter === false ){
          let f = require( filterPath );
          app.filter(f(... paras));
        } else {
          let f = this.pomelo.filters[it.package];
          app.filter( f(... paras) );
        }
      }

      //console.log( '--- filter', load, this.serverType, it.package );
    }

  }

  setupRoute(){
    const {cfg, app} = this;
    const { route:rCfg } = cfg;
    if( typeof(rCfg) !== 'object' ) {
      return;
    }

    let basePath = app.getBase();
    let routeJsonFile = app.getCfgPath(rCfg.cfg);

    if( contains( this.serverType, rCfg.serverType ) === false ){
      // virtual load RouteFun
      if( rCfg.routeFunc ) {
        for( let rType in rCfg.routeFunc ){
          this.routeFun[rType] = require( path.join( basePath, rCfg.routeFunc[rType]) );          
        }
      }

      this.checkRoute(rCfg, () =>{
        this.routeFun = {};
        if( rCfg.routeFunc ) {
          for( let rType in rCfg.routeFunc ){
            let maJs = require.resolve( path.join( basePath, rCfg.routeFunc[rType]));
            delete require.cache[ maJs ];
          }
        }
      });

      return;
    }

    // load RouteFun
    if( rCfg.routeFunc ) {
      for( let rType in rCfg.routeFunc ){
        this.routeFun[rType] = require( path.join( basePath, rCfg.routeFunc[rType]) );
      }
    }
    
    if( rCfg.checkInterval > 1000 ){
      this.setRoute(rCfg.cfg);
      setInterval( ()=>{ this.setRoute(rCfg.cfg);}, rCfg.checkInterval );
    } else {
      this.setRoute(rCfg.cfg);
    }
  }

  checkRoute(rCfg, cb){
    const {app} = this;
    let routeJsonFile = app.getCfgPath(rCfg.cfg);

    fs.readFile( routeJsonFile,(err,data) =>{
      if( !err ){
        let routeJson = JSON.parse(data);
        let ignoreSer = routeJson.ignoreSer;
        if( !ignoreSer ){
          return;
        }

        if( contains( this.serverType, ignoreSer ) === false ){
          for( let rType in routeJson.route){
            if( routeJson.route[rType].indexOf( this.serverType) !== -1 ){
              if( this.routeFun[rType] ) {
                cb();
                return;
              }
            }
          }

          logger.error(`xxxxxxxx ${this.serverType} route not defined!`);
          process.exit(2);
        }
      } else {
        logger.error(err.toString());
        process.exit(2);
      }
    });
  }

  /** Setup route
   * @param {string} cfgFile route json config file name
   * 
   */
  async setRoute( cfgFile ){
    const {app} = this;

    try{
      let stat = await fs.promises.stat(app.getCfgPath(cfgFile) );
      if( this.routeFileCTime === stat.mtimeMs){
        return;
      }

      this.routeFileCTime = stat.mtimeMs;

      let routeJson = await app.getCfg( cfgFile, true );
      let routes = app.get('__routes__');
      for( let rType in routeJson.route){
        if( this.routeFun[rType] ){
          for( let ser of routeJson.route[rType] ){
            let set = (!routes || !routes[ser]) ? true : false;
            if( set === true ){
              app.route(ser, this.routeFun[rType]);
              logger.info( '--- set route', this.serverType, ser, this.routeFun[rType] );
            }
          }
        }
      }
    } catch (err) {
      logger.error(err.toString());
    }
  }

  errorHandler( err,msg,resp,session,next ){
    let szPre = "\n\n ----- 2: " + this.serverId + " " + (new Date());
    logger.warn(szPre + err.stack);
    next(null,{code:500,error:false,data:''});
  }
};

let contains = function(str, settings) {
  if(!settings) {
      return false;
  }

  let exclude = ( settings.charAt(0) === '!' );
  let ts = settings.split("|");
  if( exclude ){
      ts[0] = ts[0].substr(1);
  }

  return exclude?(ts.indexOf(str) === -1) : (ts.indexOf(str) !== -1);
};

module.exports = BaseApp;
