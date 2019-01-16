"use strict";

const ConnectionService = require('../common/service/connectionService');

/**
 * Connection component for statistics connection status of frontend servers
 */
module.exports = function(app) {
  return new Component(app);
};

let Component = function(app) {
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
};

Component.prototype.name = '__connection__';
