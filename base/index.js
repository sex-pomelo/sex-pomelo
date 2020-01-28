
/**
 * @namespace SexPomelo
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
