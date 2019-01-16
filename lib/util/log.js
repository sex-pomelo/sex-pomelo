"use strict";

const logger = require('@sex-pomelo/sex-pomelo-logger');

/**
 * Configure pomelo logger
 */
module.exports.configure = function(app, filename) {
  let serverId = app.getServerId();
  let base = app.getBase();
  logger.configure(filename, {serverId: serverId, base: base});
};
