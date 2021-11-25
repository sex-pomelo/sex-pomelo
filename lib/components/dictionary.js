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
    }
   
    if(fs.existsSync(p)) {
      this.userDicPath = p;
    }
  }


  start(cb) {

    let userDict = {
      route: {},
      notify:[]
    };

    try{
      let szUserDict = fs.readFileSync( this.userDicPath );
      let userDictT = JSON.parse( szUserDict );
      let typeRoute = typeof(userDictT.route);
      let typeNotify = typeof(userDictT.notify);

      if( (typeRoute !== 'undefined') && (typeRoute !== 'object') ) {
        throw Error('error route format');
      }

      if( (typeNotify !== 'undefined') && (typeRoute !== 'object') && ((typeNotify instanceof Array) === false) ) {
        throw Error('error notify format');
      }

      userDict = userDictT;
    }catch(err) {
      console.warn('--- dictionary err', err);
    }

    let cntTypes = 0;
    if( userDict.route !== undefined ) {
      for( let serType in userDict.route ) {
        // check server type group
        let serTypeT = this.app.get(serType);
        if( serTypeT ) {
          this.cusRouteMap[serTypeT] = userDict.route[serType];
          cntTypes++;
        } else {
          this.cusRouteMap[serType] = userDict.route[serType];
          cntTypes++;
        }
      }
    }


    let servers = this.app.get('servers');
    let routes = [];
  
    if( cntTypes > 0) {
      for(let serverType in servers) {
        let cusRoute = this.getCustomRoute(serverType);
        if( cusRoute.length > 0 ) {
          for( let it of cusRoute ) {
            routes.push(`${serverType}.${it}`);
          }
        }
      }
    }
  
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
    if(userDict.notify !== undefined) {
      abbr = routes.length + 1;
      for(i = 0; i < userDict.notify.length; i++) {
        let route = userDict.notify[i];
  
        this.abbrs[abbr] = route;
        this.dict[route] = abbr;
        abbr++;
      }
    }
  
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
