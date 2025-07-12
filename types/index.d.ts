
import Application from "../lib/application";



/** 路由参数 */
declare interface RouteArg {
    /** id */
    id: number;
    /** 类型 */
    type: number;
    /** 是否压缩路由 */
    compressRoute: number;
    /** 路由 */
    route: number;
    /** 是否压缩 */
    compressGzip: number;
    /**  数据体 */
    body: {
        /** 数据 */
        data: number[];
        /** 服务器名 */
        serName: string;
    };
}

/** 路由信息 */
declare interface RouteMsg {
    /** 命名空间 */
    namespace: string;
    /** 服务类型 */
    serverType: string;
    /** 服务 */
    service: string;
    /** 方法 */
    method: string;
    /** 参数 */
    args: RouteArg[];
}


declare interface IFilterHandler {
    before: (msg: any, session: any, next: any) => void;
    after: (err: any, msg: any, session: any, resp: any, next: any) => void;
}

declare interface IFilterRpc {
    before: (serverId: any, msg: any, opts: any, next: any) => void;
    after: (serverId: any, msg: any, opts: any, next: any) => void;
}


declare interface IConnector {
    start: (cb: any) => void;
    stop: (force: any, cb: any) => void;

    encode: (reqId: any, route: any, msgBody: any) => any;
    decode: (msg: any) => any;
}


/** 
 * Pomelo 框架主实例类型定义
 * 该模块默认导出为 Pomelo 单例实例
 */
declare class Pomelo {
    /** 
     * 当前 Pomelo 应用实例 
     */
    app: Application | null;

    /** 
     * 框架版本号 
     */
    version: string;

    /** 
     * 事件定义，app.event 会触发的事件集合 
     */
    events: any;

    /** 
     * 自动加载的组件集合，键为组件名，值为组件实例 
     */
    components: { [key: string]: any };

    /** 
     * 自动加载的 handler 过滤器集合 
     */
    filters:  Record< string, IFilterHandler>;

    /** 
     * 自动加载的 rpc 过滤器集合 
     */
    rpcFilters: Record< string, IFilterRpc>;

    /** 
     * 内置连接器集合，支持 sioconnector、hybridconnector、udpconnector、mqttconnector 
     */
    connectors: {
        sioconnector: IConnector;
        hybridconnector: IConnector;
        udpconnector: IConnector;
        mqttconnector: IConnector;
        [key: string]: IConnector;
    };

    /** 
     * 推送调度器集合，支持 direct、buffer 
     */
    pushSchedulers: {
        direct: any;
        buffer: any;
        [key: string]: any;
    };

    /** 
     * 自动加载所有组件和过滤器 
     */
    loadInit(): void;

    /** 
     * 创建 Pomelo 应用实例
     * @param opts 初始化参数
     * @returns Application 实例
     */
    createApp(opts?: any): Application;
}

/** 
 * 默认导出 Pomelo 实例
 */
declare const pomelo: Pomelo;
export = pomelo;


export { Application };