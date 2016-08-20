// helper functions

exports.clip = function (value, min, max) {
	return Math.min(max, Math.max(min, value));
};

exports.copyObject = function (from, to) {
	for (var key in from) {
		to[key] = from[key];
	}
};