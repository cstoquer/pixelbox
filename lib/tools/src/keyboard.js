var EventEmitter = require('../../common/EventEmitter');
var Panel        = require('./Panel.js');

var buttons = new EventEmitter();
buttons.shift   = false;
buttons.control = false;
buttons.alt     = false;

var keyMap = {
	16: 'shift',
	17: 'control',
	18: 'alt'
};

function keyChange(e, isPressed) {
	var key = keyMap[e.keyCode];
	if (key) buttons[key] = isPressed;

	// keyboard shortcuts
	var ctrlKey = isPressed && navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey;
	switch (e.keyCode) {
		case 83 : ctrlKey && Panel.currentSelectedPanel && Panel.currentSelectedPanel.save(); break; // S key : save
		case 90 : ctrlKey && Panel.currentSelectedPanel && Panel.currentSelectedPanel.undo(); break; // Z key : undo
		case 16 : buttons.emit('shift', isPressed); break;
		case 18 : buttons.emit('alt',   isPressed); break;
		case 32 : buttons.emit('space', isPressed); break;
		case 88 : buttons.emit('x',     isPressed); break;
		case 67 : buttons.emit('c',     isPressed); break;
		case 86 : buttons.emit('v',     isPressed); break;
	}
}

window.addEventListener('keydown', function onKeyPressed(e) { keyChange(e, true);  });
window.addEventListener('keyup',   function onKeyRelease(e) { keyChange(e, false); });

module.exports = buttons;