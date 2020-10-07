"use strict";

const util = require('util');
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const transactionLogger = require('@sex-pomelo/sex-pomelo-logger').getLogger('transaction-log', __filename);
const transactionErrorLogger = require('@sex-pomelo/sex-pomelo-logger').getLogger('transaction-error-log', __filename);

let manager = module.exports;

manager.transaction = function(name, conditions, handlers, retry) {
	if(!retry) {
    retry = 1;
  }
  if(typeof name !== 'string') {
    logger.error('transaction name is error format, name: %s.', name);
    return;
  }
  if(typeof conditions !== 'object' || typeof handlers !== 'object') {
    logger.error('transaction conditions parameter is error format, conditions: %j, handlers: %j.', conditions, handlers);
    return;
  }

  let cmethods=[] ,dmethods=[], cnames=[], dnames=[];
  for(let key in conditions) {
    if(typeof key !== 'string' || typeof conditions[key] !== 'function') {
      logger.error('transaction conditions parameter is error format, condition name: %s, condition function: %j.', key, conditions[key]);
      return;
    }
    cnames.push(key);
    cmethods.push(conditions[key]);
  }

  
  (async () => {
    let i = 0;
    try{
      // check conds
      for( let method of cmethods ){
        if( util.types.isAsyncFunction( method ) ){
          await method();
        } else {
          await util.promisify( method )();
        }

        transactionLogger.info('[%s]:[%s] condition is executed.', name, cnames[i]);
        i++;
      }

      // execute handlers
      process.nextTick( async function() {
        for(let key in handlers) {
          if(typeof key !== 'string' || typeof handlers[key] !== 'function') {
            logger.error('transcation handlers parameter is error format, handler name: %s, handler function: %j.', key, handlers[key]);
            return;
          }
          dnames.push(key);
          dmethods.push(handlers[key]);
        }

        let flag = true;
        let times = retry;

        // do retry if failed util retry times
        while( retry > 0 && flag ){
          let j = 0;
          try{
            retry--;

            for( let method of dmethods ){
              if( util.types.isAsyncFunction( method ) ){
                await method();
              } else {
                await util.promisify( method )();
              }

              transactionLogger.info('[%s]:[%s] handler is executed.', name, dnames[j]);
              j++;
            }

            flag = false;
            process.nextTick(function() {
              transactionLogger.info('[%s] all conditions and handlers are executed successfully.', name);
            });

          } catch ( errHandler ){
            process.nextTick(function() {
              transactionLogger.error('[%s]:[%s]:[%s] handler is executed with err: %j.', name, dnames[--j], times-retry, errHandler.stack);
              let log = {
                name: name,
                method: dnames[j],
                retry: times-retry,
                time: Date.now(),
                type: 'handler',
                description: errHandler.stack
              };
              transactionErrorLogger.error(JSON.stringify(log));
            });
          }

        }
      });
    } catch (err) {
      process.nextTick(function() {
        transactionLogger.error('[%s]:[%s] condition is executed with err: %j.', name, cnames[--i], err.stack);
        let log = {
          name: name,
          method: cnames[i],
          time: Date.now(),
          type: 'condition',
          description: err.stack
        };
        transactionErrorLogger.error(JSON.stringify(log));
      });
    }
  })();

};