"use strict";

const ConnectionService = require('../common/service/connectionService');
const Application = require('../application');


class Connection{

  /**
   * 
   * @param {Application} app 
   */
  constructor(app){
    this.name = '__connection__';
    this.app = app;
    this.service = new ConnectionService(app);

    // proxy the service methods except the lifecycle interfaces of component
    let method, self = this;

    let getFun = function(m) {
      return (function() {
            return function() {
              return self.service[m].apply(self.service, arguments);
            };
      })();
    };

    for(let m in this.service) {
      if(m !== 'start' && m !== 'stop') {
        method = this.service[m];
        if(typeof method === 'function') {
          this[m] = getFun(m);
        }
      }
    }

    // ES6 gen function
    for (let m of Object.getOwnPropertyNames(Object.getPrototypeOf(this.service))) {
      if (!(this.service[m] instanceof Function) || m === 'constructor' 
        || m === 'start' || m === 'stop' ){ 
        continue;
      }
      
      this[m] = getFun(m);
    }
  }
}



/**
 * Connection component for statistics connection status of frontend servers
 */
module.exports = function(app) {
  return new Connection(app);
};

