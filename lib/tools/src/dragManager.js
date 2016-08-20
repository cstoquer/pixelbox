var EventEmitter = require('../../common/EventEmitter');
var inherits     = require('../../common/inherits');
var createDiv    = require('../../common/domUtils').createDiv;

function DragManager() {
	EventEmitter.call(this);
	this.dummy = createDiv('dragItem');
	this.dummy.style.display = 'none';
	this.droppables = [];
}
inherits(DragManager, EventEmitter);
module.exports = new DragManager();

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
DragManager.prototype.startDrag = function (e, id, item, dummyContent) {
	var t = this;
	var d = document;

	var dummy = t.dummy;
	dummy.style.zIndex = zIndex + 1; // FIXME
	dummy.style.display = '';
	dummy.style.left = e.clientX + 'px';
	dummy.style.top  = e.clientY + 'px';

	if (dummyContent) dummy.appendChild(dummyContent);

	var currentDrop = null;

	function onDragEnter() {
		this._dropHandle.onDragEnter && this._dropHandle.onDragEnter(id, item);
		currentDrop = this;
	}

	function onDragLeave() {
		this._dropHandle.onDragLeave && this._dropHandle.onDragLeave(id, item);
		if (currentDrop === this) currentDrop = null;
	}

	for (var i = 0; i < t.droppables.length; i++) {
		var droppable = t.droppables[i];
		droppable.addEventListener('mouseenter', onDragEnter);
		droppable.addEventListener('mouseleave', onDragLeave);
		droppable._dropHandle.onDragStart && droppable._dropHandle.onDragStart(id, item);
	}

	t.emit('dragStart', id, item);

	function dragMove(e) {
		e.preventDefault();
		var x = e.clientX;
		var y = e.clientY;
		dummy.style.left = x + 'px';
		dummy.style.top  = y + 'px';
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
		if (dummyContent) dummy.removeChild(dummyContent);
		dummy.style.display = 'none';
		for (var i = 0; i < t.droppables.length; i++) {
			var droppable = t.droppables[i];
			droppable.removeEventListener('mouseenter', onDragEnter);
			droppable.removeEventListener('mouseleave', onDragLeave);
			droppable._dropHandle.onDragEnd && droppable._dropHandle.onDragEnd(id, item);
		}
		t.emit('dragEnd', id, item);
		currentDrop && currentDrop._dropHandle.drop && currentDrop._dropHandle.drop(id, item);
	}

	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
DragManager.prototype.setAsDroppable = function (dom, handle) {
	this.droppables.push(dom);
	dom._dropHandle = handle;
};

