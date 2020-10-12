
/**
 * @namespace SexPomelo
 */

 /** 路由Arg
  * @typedef {Object} RouteArg
  * @property {number} id - id
  * @property {number} type - 类型
  * @property {number} compressRoute - 是否压缩路由
  * @property {number} route - 路由
  * @property {number} compressGzip - 是否压缩
  * @property {object} body - 数据体
  * @property {number[]} body.data - 数据
  * @property {string} body.serName - 服务器名
  */


 /** 路由信息
 * 
 * @typedef {Object} RouteMsg
 * @property {string} namespace - 命名空间
 * @property {string} serverType - 服务类型
 * @property {string} service - 服务
 * @property {string} method - 方法
 * @property {RouteArg[]} args - 参数
 */


/** sex-pomelo application
 * @member {SexPomelo} SexPomelo#Application
 * @since 2.2.15
 */
exports.Application = require('../lib/application');



 /** sex-pomelo gameHandler base class
 * @member {SexPomelo} SexPomelo#GameHandler
 * @since 2.2.15
 */
exports.GameHandler = require('./base_game_handler');


 /** sex-pomelo gameRemote base class
 * @member {SexPomelo} SexPomelo#GameRemote
 * @since 2.2.15
 */
exports.GameRemote = require('./base_game_remote');

 /** sex-pomelo lifecycle base class
 * @member {SexPomelo} SexPomelo#Lifecycle
 * @since 2.2.15
 */
exports.Lifecycle = require('./base_lifecycle').BaseLifecycle;

 /** sex-pomelo cron base content
 * @member {SexPomelo} SexPomelo#Cron
 * @since 2.2.15
 */
exports.Cron = require('./base_cron');

 /** sex-pomelo component base content
 * @member {SexPomelo} SexPomelo#BaseComponent
 * @since 2.2.15
 */
exports.BaseComponent = require('./base_component');

 /** sex-pomelo filter base class
 * @member {SexPomelo} SexPomelo#BaseFilter
 * @since 2.2.15
 */
exports.BaseFilter = require('./base_filter');

 /** sex-pomelo App base class
 * @member {SexPomelo} SexPomelo#BaseApp
 * @since 2.2.26
 */
exports.BaseApp = require('./base_app');
