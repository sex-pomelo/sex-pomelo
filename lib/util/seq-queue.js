'use strict';
const EventEmitter = require('events');

const DEFAULT_TIMEOUT = 3000;
const INIT_ID = 0;
const EVENT_CLOSED = 'closed';
const EVENT_DRAINED = 'drained';

/**
 * Instance a new queue
 *
 * @param {number} timeout a global timeout for new queue
 * @class
 * @constructor
 */
class SeqQueue extends EventEmitter
{
    constructor(timeout)
    {
        super();
        if (timeout && timeout > 0)
        {
            this.timeout = timeout;
        }
        else
        {
            this.timeout = DEFAULT_TIMEOUT;
        }

        this.status = SeqQueueManager.STATUS_IDLE;
        this.curId = INIT_ID;
        this.queue = [];
    }

    /**
     * Add a task into queue.
     *
     * @param fn new request
     * @param onTimeout callback when task timeout
     * @param timeout timeout for current request. take the global timeout if this is invalid
     * @returns true or false
     */
    push(fn, onTimeout, timeout)
    {
        if (this.status !== SeqQueueManager.STATUS_IDLE && this.status !== SeqQueueManager.STATUS_BUSY)
        {
            // ignore invalid status
            return false;
        }

        if (typeof fn !== 'function')
        {
            throw new Error('fn should be a function.');
        }
        this.queue.push({
            fn        : fn,
            ontimeout : onTimeout,
            timeout   : timeout});

        if (this.status === SeqQueueManager.STATUS_IDLE)
        {
            this.status = SeqQueueManager.STATUS_BUSY;
            process.nextTick(this._next.bind(this), this.curId);
        }
        return true;
    }

    /**
     * Close queue
     *
     * @param {boolean} force if true will close the queue immediately else will execute the rest task in queue
     */
    close(force)
    {
        if (this.status !== SeqQueueManager.STATUS_IDLE && this.status !== SeqQueueManager.STATUS_BUSY)
        {
            // ignore invalid status
            return;
        }

        if (force)
        {
            this.status = SeqQueueManager.STATUS_DRAINED;
            if (this.timerId)
            {
                clearTimeout(this.timerId);
                this.timerId = undefined;
            }
            this.emit(EVENT_DRAINED);
        }
        else
        {
            this.status = SeqQueueManager.STATUS_CLOSED;
            this.emit(EVENT_CLOSED);
        }
    }

    /**
     * Invoke next task
     *
     * @param {String|Number} tid last executed task id
     * @api private
     */
    _next(tid)
    {
        if (tid !== this.curId || this.status !== SeqQueueManager.STATUS_BUSY && this.status !== SeqQueueManager.STATUS_CLOSED)
        {
            // ignore invalid next call
            return;
        }

        if (this.timerId)
        {
            clearTimeout(this.timerId);
            this.timerId = undefined;
        }

        const task = this.queue.shift();
        if (!task)
        {
            if (this.status === SeqQueueManager.STATUS_BUSY)
            {
                this.status = SeqQueueManager.STATUS_IDLE;
                this.curId++;	// modify curId to invalidate timeout task
            }
            else
            {
                this.status = SeqQueueManager.STATUS_DRAINED;
                this.emit(EVENT_DRAINED);
            }
            return;
        }
        task.id = ++this.curId;

        let timeout = task.timeout > 0 ? task.timeout : this.timeout;
        timeout = timeout > 0 ? timeout : DEFAULT_TIMEOUT;
        this.timerId = setTimeout(() =>
        {
            process.nextTick(this._next.bind(this), task.id);
            this.emit('timeout', task);
            if (task.ontimeout)
            {
                task.ontimeout();
            }
        }, timeout);

        try
        {
            task.fn({
                done : () =>
                {
                    const res = task.id === this.curId;
                    process.nextTick(this._next.bind(this), task.id);
                    return res;
                }
            });
        }
        catch (err)
        {
            this.emit('error', err, task);
            process.nextTick(this._next.bind(this), task.id);
        }
    }
}



/**
 * Queue manager.
 *
 * @module
 */
const SeqQueueManager = module.exports;

/**
 * Queue status: idle, welcome new tasks
 *
 * @const
 * @type {number}
 * @memberOf SeqQueueManager
 */
SeqQueueManager.STATUS_IDLE = 0;

/**
 * Queue status: busy, queue is working for some tasks now
 *
 * @const
 * @type {number}
 * @memberOf SeqQueueManager
 */
SeqQueueManager.STATUS_BUSY = 1;

/**
 * Queue status: closed, queue has closed and would not receive task any more
 * 					and is processing the remaining tasks now.
 *
 * @const
 * @type {number}
 * @memberOf SeqQueueManager
 */
SeqQueueManager.STATUS_CLOSED = 2;

/**
 * Queue status: drained, queue is ready to be destroy
 *
 * @const
 * @type {number}
 * @memberOf SeqQueueManager
 */
SeqQueueManager.STATUS_DRAINED = 3;

/**
 * Create Sequence queue
 *
 * @param  {number} timeout a global timeout for the new queue instance
 * @return {object}         new queue instance
 * @memberOf SeqQueueManager
 */
SeqQueueManager.createQueue = function(timeout)
{
    return new SeqQueue(timeout);
};
