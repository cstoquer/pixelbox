//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @module gamepad
 *  @author Cedric Stoquer
 */
var MAPPING_BUTTONS = [
	'A', 'B', 'X', 'Y',           // buttons
	'lb', 'rb', 'lt','rt',        // bumpers and triggers
	'back', 'start',              // menu
	'lp', 'rp',                   // axis push
	'up', 'down', 'left', 'right' // dpad
];

var GAMEPAD_AVAILABLE = !!(navigator && navigator.getGamepads);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @class Gamepad
 *  @classdesc gamepad state
 *
 * @attribute {boolean} available - is gamepaad available
 * @property {object}  btn  - button state
 *
 * @property {boolean} btn.A     - A button
 * @property {boolean} btn.B     - B button
 * @property {boolean} btn.X     - X button
 * @property {boolean} btn.Y     - Y button
 * @property {boolean} btn.lb    - left bumper button
 * @property {boolean} btn.rb    - right bumper button
 * @property {boolean} btn.lt    - left trigger button
 * @property {boolean} btn.rt    - right trigger button
 * @property {boolean} btn.back  - back button
 * @property {boolean} btn.start - start button
 * @property {boolean} btn.lp    - first axis push button
 * @property {boolean} btn.rp    - second axis push button
 * @property {boolean} btn.up    - directional pad up button
 * @property {boolean} btn.down  - directional pad down button
 * @property {boolean} btn.left  - directional pad left button
 * @property {boolean} btn.right - directional pad right button
 *
 * @property {object}  btnp - button press.   This object has the same structure as `btn` but the value are true only on button press
 * @property {object}  btnr - button release. This object has the same structure as `btn` but the value are true only on button release
 * @property {number}  x - x axe value (first stick horizontal)
 * @property {number}  y - y axe value (first stick vertical)
 * @property {number}  z - z axe value (second stick horizontal)
 * @property {number}  w - w axe value (second stick vertical)
 * @property {number}  lt - left trigger analog value
 * @property {number}  rt - right trigger analog value
 */
function Gamepad() {
	this.available = false;

	// buttons
	this.btn  = {};
	this.btnp = {};
	this.btnr = {};

	// axes
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.w = 0;

	// trigger analog value
	this.lt = 0;
	this.rt = 0;

	this._setupButtons();
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
Gamepad.prototype._setupButtons = function () {
	for (var i = 0; i < MAPPING_BUTTONS.length; i++) {
		var key = MAPPING_BUTTONS[i];
		this.btn[key]  = false;
		this.btnp[key] = false;
		this.btnr[key] = false;
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// function gamepadHandler(event, connecting) {
// 	console.log('Gamepad event', connecting)
// 	var gamepad = event.gamepad;
// 	if (connecting) {
// 		gamepads[gamepad.index] = gamepad;
// 	} else {
// 		delete gamepads[gamepad.index];
// 	}
// }

// window.addEventListener("gamepadconnected",    function (e) { gamepadHandler(e, true);  }, false);
// window.addEventListener("gamepaddisconnected", function (e) { gamepadHandler(e, false); }, false);

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var GAMEPADS = [
	new Gamepad(),
	new Gamepad(),
	new Gamepad(),
	new Gamepad()
];

var ANY_GAMEPADS = new Gamepad();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function getAllGamepads() {
	// TODO: check frame number and return cached value if same frame
	var gamepads = navigator.getGamepads();

	for (var gamepadIndex = 0; gamepadIndex < 4; gamepadIndex++) {
		var gamepad = gamepads[gamepadIndex];
		var GAMEPAD = GAMEPADS[gamepadIndex];
		if (!gamepad) {
			GAMEPAD.available = false;
			continue;
		}

		GAMEPAD.available = true;

		// buttons
		for (var i = 0; i < MAPPING_BUTTONS.length; i++) {
			var key = MAPPING_BUTTONS[i];
			var button = gamepad.buttons[i].pressed;
			GAMEPAD.btnp[key] = !GAMEPAD.btn[key] &&  button;
			GAMEPAD.btnr[key] =  GAMEPAD.btn[key] && !button;
			GAMEPAD.btn[key]  =  button;
		}

		// axes
		GAMEPAD.x = gamepad.axes[0];
		GAMEPAD.y = gamepad.axes[1];
		GAMEPAD.z = gamepad.axes[2];
		GAMEPAD.w = gamepad.axes[3];

		// triggers
		GAMEPAD.lt = gamepad.buttons[6].value;
		GAMEPAD.rt = gamepad.buttons[7].value;
	}

	return GAMEPADS;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function getGamepadsFallback() {
	return GAMEPADS;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Get all gamepads states
 * @return {Gamepad[]} gamepads states
 */
exports.getGamepads = GAMEPAD_AVAILABLE ? getAllGamepads : getGamepadsFallback;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Get gamepad state
 * @param {number} inputId - id of the gamepad (number between 0 and 4)
 *                     fallback to keyboard access with -1 value (use with care)
 * @return {Gamepad} gamepad state
 */
exports.getGamepad = function (inputId) {
	if (inputId === -1) return window; // fallback to keyboard
	// TODO optimize this (only  get the relevant gamepad)
	return getAllGamepads()[inputId];
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Merge states of all gamepads and return a global gamepad state.
 *  This is usefull for 1 player games when you don't want to bother with
 *  gamepad configuration.
 *  @todo Only works for gamepad buttons. Analog values (aes and triggers) are not handled
 *
 * @return {Gamepad} gamepads merged state
 */
exports.getAnyGamepad = function () {
	exports.getGamepads();
	
	// buttons
	for (var i = 0; i < MAPPING_BUTTONS.length; i++) {
		var key = MAPPING_BUTTONS[i];
		ANY_GAMEPADS.btnp[key] = btnp[key] || GAMEPADS[0].btnp[key] || GAMEPADS[1].btnp[key] || GAMEPADS[2].btnp[key] || GAMEPADS[3].btnp[key];
		ANY_GAMEPADS.btnr[key] = btnr[key] || GAMEPADS[0].btnr[key] || GAMEPADS[1].btnr[key] || GAMEPADS[2].btnr[key] || GAMEPADS[3].btnr[key];
		ANY_GAMEPADS.btn[key]  = btn[key]  || GAMEPADS[0].btn[key]  || GAMEPADS[1].btn[key]  || GAMEPADS[2].btn[key]  || GAMEPADS[3].btn[key];
	}

	// TODO: axes and triggers

	return ANY_GAMEPADS;
}
