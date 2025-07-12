/** 
 * i18n 组件类型定义
 * 用于多语言支持，提供文本翻译能力。
 */
declare class SexPomeloI18n {
    /**
     * 构造函数
     * @param app 应用实例
     * @param opts 配置项
     */
    constructor(app: any, opts: any);
    /**
     * 按默认语言翻译文本
     * @param msg 文本key
     * @param paras 占位参数
     * @returns 翻译后的文本
     */
    tr(msg: string, ...paras: any[]): string;
    /**
     * 按指定语言翻译文本
     * @param locale 语言代码或session对象
     * @param msg 文本key
     * @param paras 占位参数
     * @returns 翻译后的文本
     */
    tr1(locale: string | any, msg: string, ...paras: any[]): string;
}

/**
 * Connector 组件类型定义
 * 负责客户端连接、消息收发、加密等。
 */
declare class Connector {
    constructor(app: any, opts: any);
    start(cb: Function): void;
    afterStart(cb: Function): void;
    stop(force: boolean, cb: Function): void;
    send(reqId: number, route: string, msg: any, recvs: any[], opts: any, cb: Function): void;
    setPubKey(id: string, key: any): void;
    getPubKey(id: string): any;
}

/**
 * Session 组件类型定义
 * 管理前端会话，代理SessionService所有方法。
 */
declare class ComponentSession {
    constructor(app: any, opts: any);
    name: string;
    service: any;
}

/**
 * Channel 组件类型定义
 * 管理频道，代理ChannelService所有方法。
 */
declare class ChannelService {
    constructor(app: any, opts: any);
    start(cb: Function): void;
    createChannel(name: string): any;
    getChannel(name: string, create?: boolean): any;
    destroyChannel(name: string): void;
    pushMessageByUids(route: string, msg: any, uids: any[], opts: any, cb: Function): void;
    broadcast(stype: string, route: string, msg: any, opts: any, cb: Function): void;
}

/**
 * BackendSession 组件类型定义
 * 管理后端会话，代理BackendSessionService所有方法。
 */
declare class BackendSessionService {
    constructor(app: any);
    create(opts: any): any;
    get(frontendId: string, sid: string, cb: Function): void;
    getByUid(frontendId: string, uid: string, cb: Function): void;
    kickBySid(frontendId: string, sid: number, reason: string, cb: Function): void;
    kickByUid(frontendId: string, uid: string, reason: string, cb: Function): void;
    bind(frontendId: string, sid: number, uid: string, cb: Function): void;
    unbind(frontendId: string, sid: number, uid: string, cb: Function): void;
    push(frontendId: string, sid: number, key: string, value: any, cb: Function): void;
    pushAll(frontendId: string, sid: number, settings: any, cb: Function): void;
}

/**
 * Connection 组件类型定义
 * 统计连接状态，代理ConnectionService所有方法。
 */
declare class Connection {
    constructor(app: any);
    name: string;
    service: any;
}

/**
 * Server 组件类型定义
 * 服务器启动、停止、消息处理等。
 */
declare class ServerComp {
    constructor(app: any, opts: any);
    name: string;
    start(cb: Function): void;
    afterStart(cb: Function): void;
    stop(force: boolean, cb: Function): void;
    handle(msg: any, session: any, cb: Function): void;
    globalHandle(msg: any, session: any, cb: Function): void;
}

/**
 * Protobuf 组件类型定义
 * 用于protobuf协议的编解码。
 */
declare class ComponentProtobuf {
    constructor(app: any, opts: any);
    name: string;
    encode(key: string, msg: any): any;
    encode2Bytes(key: string, msg: any): any;
    decode(key: string, msg: any): any;
    getProtos(): any;
    getVersion(): string;
    setProtos(type: string, path: string): void;
    stop(force: boolean, cb: Function): void;
}

/**
 * Dictionary 组件类型定义
 * 路由字典管理，支持自定义路由。
 */
declare class ComponentDictionary {
    constructor(app: any, opts: any);
    name: string;
    start(cb: Function): void;
    getDict(): any;
    getRouteNum(route: string): number;
    getAbbrs(): any;
    getAbbr(routeNum: number): string;
    getVersion(): string;
    getCustomRoute(serType: string): string[];
}

/**
 * PushScheduler 组件类型定义
 * 消息推送调度。
 */
declare class ComponentPushScheduler {
    constructor(app: any, opts: any);
    name: string;
    afterStart(cb: Function): void;
    stop(force: boolean, cb: Function): void;
    schedule(reqId: number, route: string, msg: any, recvs: any[], opts: any, cb: Function): void;
}

/**
 * Remote 组件类型定义
 * 远程服务加载与生命周期管理。
 */
declare class ComponentRemote {
    constructor(app: any, opts: any);
    name: string;
    start(cb: Function): void;
    stop(force: boolean, cb: Function): void;
}

/**
 * Master 组件类型定义
 * master进程相关，负责集群管理。
 */
declare class MasterComp {
    constructor(app: any, opts: any);
    name: string;
    start(cb: Function): void;
    stop(force: boolean, cb: Function): void;
}

/**
 * Monitor 组件类型定义
 * 监控进程相关，负责监控与重连。
 */
declare class MonitorComp {
    constructor(app: any, opts: any);
    name: string;
    start(cb: Function): void;
    stop(force: boolean, cb: Function): void;
    reconnect(masterInfo: any): void;
}