"use strict";

const fs = require('fs');
const path = require('path');
const utils = require('../util/utils');
const Loader = require('pomelo-loader');
const pathUtil = require('../util/pathUtil');
const crypto = require('crypto');

module.exports = function(app, opts) {
  return new ComponentDictionary(app, opts);
};

/** Dictionary Component Class
 * 
 * @class
 * @implements {Component}
 * 
 * @param {import('./server').Application} app  current application context
 * @param {Object} opts construct parameters
 */
class ComponentDictionary
{
  constructor(app, opts) {
    this.name = '__dictionary__';

    this.app = app;
    this.dict = {};
    this.abbrs = {};
    this.userDicPath = null;
    this.version = "";
    this.customRoute = false;
  
    /**
     * @type {Object.< string, string[]>}
     */
    this.cusRouteMap = {
  
    };
  
  
    //Set user dictionary
    let p = path.join(app.getCfgPath('dictionary.json'));
    if(!!opts) {
      // user dict
      if( !!opts.dict ) {
        p = opts.dict;
      }
  
      this.customRoute = (opts.custom === true);
      if( this.customRoute === true ) {
        for( let serType in opts.route ) {
          let serTypeT = app.get(serType);
          if( serTypeT ) {
            this.cusRouteMap[serTypeT] = opts.route[serType];
          } else {
            this.cusRouteMap[serType] = opts.route[serType];
          }
        }
      }
    }
   
    if(fs.existsSync(p)) {
      this.userDicPath = p;
    }
  }


  start(cb) {
    let servers = this.app.get('servers');
    let routes = [];
  
    // let routeDictTmp = path.join(this.app.getCfgPath('dictionaryTmp.json'));
    // if( fs.exists(routeDictTmp) === false ){
          //Load all the handler files
        for(let serverType in servers) {
          if( this.customRoute === true ) {
            let cusRoute = this.getCustomRoute(serverType);
            if( cusRoute.length > 0 ) {
              for( let it of cusRoute ) {
                routes.push(`${serverType}.${it}`);
              }
            }
          } else {
            let p = pathUtil.getHandlerPath(this.app.getBase(), serverType);
            if(!p) {
              continue;
            }
  
            let handlers = Loader.load(p, this.app);
            for(let name in handlers) {
              let handler = handlers[name];
              for(let key in handler) {
                if(typeof(handler[key]) === 'function') {
                  routes.push(serverType + '.' + name + '.' + key);
                }
              }
            }
          }
        }
  
        /////////
    //     let p = routeDictTmp;
    //     fs.writeFile( p, JSON.stringify( {"ro":routes} ) );
    // }else{
    //     let rou = require(routeDictTmp);
    //     routes = rou.ro;
    // }
  
  
    //Sort the route to make sure all the routers abbr are the same in all the servers
    routes.sort();
    let abbr;
    let i;
    for(i = 0; i < routes.length; i++) {
      abbr = i + 1;
      this.abbrs[abbr] = routes[i];
      this.dict[routes[i]] = abbr;
    }
  
    //Load user dictionary
    if(!!this.userDicPath) {
      let userDic = require(this.userDicPath);
  
      abbr = routes.length + 1;
      for(i = 0; i < userDic.length; i++) {
        let route = userDic[i];
  
        this.abbrs[abbr] = route;
        this.dict[route] = abbr;
        abbr++;
      }
    }
  
    console.log( this.abbrs, this.dict );
    
    this.version = crypto.createHash('md5').update(JSON.stringify(this.dict)).digest('base64');
  
    utils.invokeCallback(cb);
  }


  getDict() {
    return this.dict;
  }
  
  getRouteNum(route) {
    return this.dict[route];
  }
  
  getAbbrs() {
    return this.abbrs;
  }
  
  getAbbr(routeNum) {
    return this.abbrs[routeNum];
  }
  
  getVersion() {
    return this.version;
  }
  
  getCustomRoute (serType) {
    for( let it in this.cusRouteMap ) {
      if( contains( serType, it ) === true ){
        return this.cusRouteMap[it];
      }
    }
    return [];
  }
}


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
