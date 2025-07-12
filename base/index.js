const { BaseApp } = require('./base_app');
const { BaseComponent } = require('./base_component');
const { BaseFilter } = require('./base_filter');
const { BaseGameHandler } = require('./base_game_handler');
const { BaseGameRemote } = require('./base_game_remote');
const { BaseLifecycle } = require('./base_lifecycle');
const { BaseCron } = require('./base_cron');
const Application  = require('../lib/application');


/**
 * @namespace SexPomelo
 */

module.exports = {
    /** sex-pomelo App base class 
     * @member {SexPomelo} SexPomelo#BaseApp
     * @since 2.2.26
     */
    BaseApp,

    /** sex-pomelo component base class
     * @member {SexPomelo} SexPomelo#BaseComponent
     * @since 2.2.15
     */
    BaseComponent,

    /** sex-pomelo filter base class
     * @member {SexPomelo} SexPomelo#BaseFilter
     * @since 2.2.15
     */
    BaseFilter,

    /** sex-pomelo gameHandler base class
     * @member {SexPomelo} SexPomelo#GameHandler
     * @since 2.2.15
     */
    BaseGameHandler,

    /** sex-pomelo gameRemote base class
     * @member {SexPomelo} SexPomelo#GameRemote
     * @since 2.2.15
     */
    BaseGameRemote,

    /** sex-pomelo lifecycle base class
     * @member {SexPomelo} SexPomelo#Lifecycle
     * @since 2.2.15
     */
    BaseLifecycle,

    /** sex-pomelo cron base content
     * @member {SexPomelo} SexPomelo#Cron
     * @since 2.2.15
     */
    Cron: BaseCron,

    /** sex-pomelo application
     * @member {SexPomelo} SexPomelo#Application
     * @since 2.2.15
     */
    Application,
};
