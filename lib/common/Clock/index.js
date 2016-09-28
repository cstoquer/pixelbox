//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// simple clock divider utility class
function Clock(m) {
	this.m = m || 1;
	this.i = 0;
}
module.exports = Clock;

Clock.prototype.tick = function(n) {
	this.i += n || 1;
	if (this.i > this.m) {
		this.i = 0;
		return true;
	}
	return false;
};
Clock.prototype.tic = Clock.prototype._tick; // deprecated

/*Object.defineProperty(Clock.prototype, 'tick', {
	get: function () { return this._tick(); },
	set: function () {}
});*/