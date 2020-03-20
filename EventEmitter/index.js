function EventEmitter() {
	this._events = {};
};

module.exports = EventEmitter;

EventEmitter.listenerCount = function (emitter, event) {
	var handlers = emitter._events[event];
	return handlers ? handlers.length : 0;
};

EventEmitter.prototype.on = function (event, fn) {
	if (typeof fn !== 'function') throw new TypeError('Tried to register non-function as event handler: ' + event);

	// we emit first, because if event is "newListener" it would go recursive
	// this.emit('newListener', event, fn);

	var allHandlers = this._events;
	var eventHandlers = allHandlers[event];
	if (eventHandlers === undefined) {
		// first event handler for this event type
		allHandlers[event] = [fn];
	} else {
		eventHandlers.push(fn);
	}

	return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prototype.once = function (event, fn) {
	if (!fn.once) {
		fn.once = 1;
	} else {
		fn.once += 1;
	}

	return this.on(event, fn);
};

EventEmitter.prototype.removeListener = function (event, handler) {
	var handlers = this._events[event];
	if (handlers !== undefined) {
		var index = handlers.indexOf(handler);
		if (index === -1) {
			console.warn('No event listener registered', event, handler)
			return this;
		}
		handlers.splice(index, 1);
		if (handlers.length === 0) delete this._events[event];
	}
	return this;
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function (event) {
	if (event) {
		delete this._events[event];
	} else {
		this._events = {};
	}
	return this;
};

EventEmitter.prototype.hasListeners = function (event) {
	return this._events[event] !== undefined;
};

EventEmitter.prototype.listeners = function (event) {
	var handlers = this._events[event];
	if (handlers !== undefined) return handlers.slice();

	return [];
};

EventEmitter.prototype.emit = function (event) {
	var handlers = this._events[event];
	if (handlers === undefined) return false;

	// copy handlers into a new array, so that handler removal doesn't affect array length
	handlers = handlers.slice();

	var hadListener = false;

	// copy all arguments, but skip the first (the event name)
	var args = [];
	for (var i = 1; i < arguments.length; i++) {
		args.push(arguments[i]);
	}

	for (var i = 0, len = handlers.length; i < len; i++) {
		var handler = handlers[i];

		handler.apply(this, args);
		hadListener = true;

		if (handler.once) {
			if (handler.once > 1) {
				handler.once--;
			} else {
				delete handler.once;
			}

			this.removeListener(event, handler);
		}
	}

	return hadListener;
};