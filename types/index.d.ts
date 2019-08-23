/// <reference types="node" />

export interface SexPomeloServer
{
  /** Server's ID */
  id: String


}



export interface SexPomeloLogger
{

}

export interface SexPomeloSessionService
{
  //getByUid(session.uid):
}


export interface SexPomeloApplication {

  /** name -> component map*/
  components:Object;



  /**
   * Get application base path
   *
   *  // cwd: /home/game/
   *  pomelo start
   *  // app.getBase() -> /home/game
   *
   * @return {String} application base path
   */
  getBase() : String

  /**
   * Override require method in application
   *
   * @param {String} relative path of file
   */
  require(ph) : String

  /**
   * Configure logger with {$base}/config/log4js.json
   * 
   * @param {SexPomeloLogger} logger sex-pomelo-logger instance without configuration

   */
  configureLogger( logger ):void

  /**
   * add a filter to before and after filter
   *
   * @param {Object} filter provide before and after filter method.
   *                        A filter should have two methods: before and after.
   */
  filter(filter):void

  /**
   * Load component
   *
   * @param  {String} name    (optional) name of the component
   * @param  {Object} component component instance or factory function of the component
   * @param  {[type]} opts    (optional) construct parameters for the factory function
   * @return {SexPomeloApplication}     app instance for chain invoke
   */
  load (name, component, opts): SexPomeloApplication


  /**
   * Set the route function for the specified server type.
   *
   * Examples:
   *
   *  app.route('area', routeFunc);
   *
   *  let routeFunc = function(session, msg, app, cb) {
   *    // all request to area would be route to the first area server
   *    let areas = app.getServersByType('area');
   *    cb(null, areas[0].id);
   *  };
   *
   * @param  {String} serverType server type string
   * @param  {Function} routeFunc  route function. routeFunc(session, msg, app, cb)
   * @return {SexPomeloApplication}     current application instance for chain invoking
   */
  route(serverType, routeFunc) : SexPomeloApplication


  /**
   * Start application. It would load the default components and start all the loaded components.
   *
   * @param  {Function} cb callback function
   */
  start (cb):void


  /**
   * Stop components.
   *
   * @param  {Boolean} force whether stop the app immediately
   */
  stop(force):void


  /**
   * Assign `setting` to `val`, or return `setting`'s value.
   *
   * Example:
   *
   *  app.set('key1', 'value1');
   *  app.get('key1');  // 'value1'
   *  app.key1;         // undefined
   *
   *  app.set('key2', 'value2', true);
   *  app.get('key2');  // 'value2'
   *  app.key2;         // 'value2'
   *
   * @param {String} setting the setting of application
   * @param {String} val the setting's value
   * @param {Boolean} attach whether attach the settings to application
   * @return {SexPomeloApplication|Mixed} for chaining, or the setting value
   */
  set(setting, val, attach):SexPomeloApplication


  /**
   * Get property from setting
   *
   * @param {String} setting application setting
   * @return {String|Mixed} val
   */
  get (setting):String


  /**
   * Check if `setting` is enabled.
   *
   * @param {String} setting application setting
   * @return {Boolean}
   */
  enabled (setting):Boolean

  /**
   * Check if `setting` is disabled.
   *
   * @param {String} setting application setting
   * @return {Boolean}
   */
  disabled(setting):Boolean


  /**
   * Enable `setting`.
   *
   * @param {String} setting application setting
   * @return {SexPomeloApplication} for chaining
   */
  enable(setting):SexPomeloApplication

  /**
   * Disable `setting`.
   *
   * @param {String} setting application setting
   * @return {SexPomeloApplication} for chaining
   */
  disable(setting):SexPomeloApplication


  /**
   * Configure callback for the specified env and server type.
   * When no env is specified that callback will
   * be invoked for all environments and when no type is specified
   * that callback will be invoked for all server types.
   *
   * Examples:
   *
   *  app.configure(function(){
   *    // executed for all envs and server types
   *  });
   *
   *  app.configure('development', function(){
   *    // executed development env
   *  });
   *
   *  app.configure('development', 'connector', function(){
   *    // executed for development env and connector server type
   *  });
   *
   * @param {String} env application environment
   * @param {Function} fn callback function
   * @param {String} type server type
   * @return {SexPomeloApplication} for chaining
   */
  configure(env, type, fn):SexPomeloApplication


  /**
   * Register admin modules. Admin modules is the extends point of the monitor system.
   *
   * @param {String} module (optional) module id or provoided by module.moduleId
   * @param {Object} module module object or factory function for module
   * @param {Object} opts construct parameter for module
   */
  registerAdmin(moduleId, module, opts):void

  /**
   * Use plugin.
   *
   * @param  {Object} plugin plugin instance
   * @param  {[type]} opts    (optional) construct parameters for the factory function

   */
  use(plugin, opts):void

  /**
   * Application transaction. Transcation includes conditions and handlers, if conditions are satisfied, handlers would be executed.
   * And you can set retry times to execute handlers. The transaction log is in file logs/transaction.log.
   *
   * @param {String} name transaction name
   * @param {Object} conditions functions which are called before transaction
   * @param {Object} handlers functions which are called during transaction
   * @param {Number} retry retry times to execute handlers if conditions are successfully executed

  */
  transaction(name, conditions, handlers, retry):void


  /**
   * Get master server info.
   *
   * @return {Object} master server info, {id, host, port}

  */
  getMaster():Object


  /**
   * Get current server info.
   *
   * @return {Object} current server info, {id, serverType, host, port}
   */
  getCurServer():Object


  /**
   * Get current server id.
   *
   * @return {String|Number} current server id from servers.json

  */
  getServerId():String|Number

  /**
   * Get current server type.
   *
   * @return {String|Number} current server type from servers.json
   */
  getServerType():String|Number

  /**
   * Get all the current server infos.
   *
   * @return {Object} server info map, key: server id, value: server info

   */
  getServers():Object;



  /**
   * Get all server infos from servers.json.
   *
   * @return {Object} server info map, key: server id, value: server info
   */
  getServersFromConfig():Object;

  /**
   * Get all the server type.
   *
   * @return {Array} server type list
   */
  getServerTypes():Array;

  /**
   * Get server info by server id from current server cluster.
   *
   * @param  {String} serverId server id
   * @return {Object} server info or undefined
   */
  getServerById(serverId):Object;

  /**
   * Get server info by server id from servers.json.
   *
   * @param  {String} serverId server id
   * @return {Object} server info or undefined
   */

  getServerFromConfig(serverId):Object;

  /**
   * Get server infos by server type.
   *
   * @param  {String} serverType server type
   * @return {Array}      server info list
   */
  getServersByType(serverType):Array;

  /**
   * Check the server whether is a frontend server
   *
   * @param  {server}  server server info. it would check current server
   *            if server not specified
   * @return {Boolean}
   *
   */
  isFrontend(server):Boolean;

  /**
   * Check the server whether is a backend server
   *
   * @param  {server}  server server info. it would check current server
   *            if server not specified
   * @return {Boolean}
   */
  isBackend(server):Boolean;

  /**
   * Check whether current server is a master server
   *
   * @return {Boolean}
   */
  isMaster():Boolean;

  /**
   * Add new server info to current application in runtime.
   *
   * @param {Array} servers new server info list
   */
  addServers(servers):void

  /**
   * Remove server info from current application at runtime.
   *
   * @param  {Array} ids server id list
   */
  removeServers(ids):void;

  /**
   * Replace server info from current application at runtime.
   *
   * @param  {Object} server id map
   */
  replaceServers(servers):void;

  /**
   * Add crons from current application at runtime.
   *
   * @param  {Array} crons new crons would be added in application

  */
  addCrons(crons):void;

  /**
   * Remove crons from current application at runtime.
   *
   * @param  {Array} crons old crons would be removed in application
   */
  removeCrons(crons):void;



}

export function createApp(opts: object): SexPomeloApplication;
