// dom utilities

var DOCUMENT_BODY = document.getElementsByTagName('body')[0];

exports.createDom = function (type, className, parent) {
	parent = parent || DOCUMENT_BODY;
	var dom = document.createElement(type);
	parent.appendChild(dom);
	if (className) dom.className = className;
	return dom;
};

exports.createDiv = function (className, parent) {
	return exports.createDom('div', className, parent);
};

exports.removeDom = function (dom, parent) {
	parent = parent || DOCUMENT_BODY;
	parent.removeChild(dom);
};

exports.makeButton = function (dom, onClic) {
	dom.addEventListener('mousedown', function (e) {
		e.stopPropagation();
		e.preventDefault();
		onClic(e, dom);
	});
	return dom;
};

function startDrag(dom, e) {
	var d = document;

	rect = dom.getBoundingClientRect();

	var startX = e.clientX - rect.left;
	var startY = e.clientY - rect.top;

	function dragMove(e) {
		e.preventDefault();
		dom.style.left = (e.clientX - startX) + 'px';
		dom.style.top  = (e.clientY - startY) + 'px';
	}

	function dragEnd(e) {
		e.preventDefault();
		d.removeEventListener('mouseup',   dragEnd);
		d.removeEventListener('mousemove', dragMove);
	}

	d.addEventListener('mousemove', dragMove, false);
	d.addEventListener('mouseup',   dragEnd,  false);
}

exports.makeDragable = function (dom, target) {
	target = target || dom;
	dom.addEventListener('mousedown', function (e) {
		e.stopPropagation();
		e.preventDefault();
		startDrag(target, e);
	});
	return dom;
}