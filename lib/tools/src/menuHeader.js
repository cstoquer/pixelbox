var assetLoader = require('../../components/assetLoader');
var domUtils    = require('../../components/domUtils');
var createDom   = domUtils.createDom;
var createDiv   = domUtils.createDiv;
var removeDom   = domUtils.removeDom;
var makeButton  = domUtils.makeButton;

var HEADER_HEIGHT = 25;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
// commands
function archiveBuild() {
	assetLoader.sendRequest({ command: 'build.createArchive' }, function (error) {
		if (error) return alert(error);
	});
}

function openFolder(folder) {
	assetLoader.sendRequest({ command: 'folder.open', folder: folder });
}

function cascadePanels() {
	var toolbox = window.toolbox;
	var posX = 0;
	var posY = HEADER_HEIGHT;
	for (var toolId in toolbox) {
		var tool = toolbox[toolId];
		if (!tool._isPanel) continue;
		tool.setPosition(posX, posY);
		posX += 30;
		posY += 30;
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var MENU_TEMPLATE = [
	// {
	// 	label: 'Pixelbox',
	// 	submenu: [
	// 		{ label: 'About', click: function () { console.log('About'); } },
	// 		//--------------------------------------------------------
	// 		{ type: 'separator' },
	// 		{ label: 'Import tools' },
	// 		{ label: 'Update', click: function () { console.log('Update'); } },
	// 		{ label: 'Quit',   click: function () { console.log('Quit'); }, accelerator: 'CmdOrCtrl+Q' }
	// 	]
	// },
	{
		label: 'View',
		submenu: [
			// TODO: automaticaly create from toolbox
			{ label: 'Assets',       type: 'checkbox', checked: true },
			{ label: 'Map editor',   type: 'checkbox', checked: true },
			{ label: 'Tilesheet',    type: 'checkbox', checked: true },
			{ label: 'Palette',      type: 'checkbox', checked: true },
			{ label: 'Custom tools', type: 'checkbox', checked: true },
			//--------------------------------------------------------
			{ type: 'separator' },
			{ label: 'Cascade', click: cascadePanels },
			// { label: 'Close all' },
		]
	},
	{
		label: 'Project',
		submenu: [
			{ label: 'Settings',    click: function () { console.log('Settings'); }   },
			//--------------------------------------------------------
			{ type: 'separator' },
			{ label: 'Build archive', click: archiveBuild    },
			// { label: 'Build executable', click: function () { console.log('Executable'); } },
			//--------------------------------------------------------
			{ type: 'separator' },
			{ label: 'Open src',    click: function () { openFolder('src'); }     },
			{ label: 'Open assets', click: function () { openFolder('assets'); }  },
			{ label: 'Open audio',  click: function () { openFolder('audio'); }   },
		]
	}
];

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
var menuBar = createDiv('menuHeader', null);
menuBar._currentSubmenu = null;
var closedAt = 0;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function closeCurrentSubmenu() {
	if (!menuBar._currentSubmenu) return;
	menuBar._currentSubmenu.style.display = 'none';
	menuBar._currentSubmenu = null;
	closedAt = Date.now();
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function addItemInSubmenu(subItem, submenuContainer) {
	if (subItem.type === 'separator') {
		createDiv('submenuSeparator', submenuContainer);
		return;
	}
	var subItemBtn = createDiv('submenuItem', submenuContainer);
	subItemBtn.innerText = subItem.label;
	
	makeButton(subItemBtn, function onClick() {
		subItem.click && subItem.click();
		closeCurrentSubmenu();
	});
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function addItemInMenuBar(item) {
	if (!item.label) return;
	var itemBtn = createDiv('menuItem', menuBar);
	itemBtn.innerText = item.label;

	var submenu = item.submenu;
	if (submenu) {
		var submenuContainer = createDiv('submenu', itemBtn);
		submenuContainer.style.display = 'none';
		for (var i = 0; i < submenu.length; i++) {
			addItemInSubmenu(submenu[i], submenuContainer);
		}
	}

	function openSubMenu() {
		// closing submenu
		if (menuBar._currentSubmenu === submenuContainer) {
			closeCurrentSubmenu();
			return;
		}

		closeCurrentSubmenu();
		menuBar._currentSubmenu = submenuContainer;
		submenuContainer.style.display = '';
	}

	makeButton(itemBtn, function onClick() {
		openSubMenu();
		item.click && item.click();
	});

	itemBtn.addEventListener('mouseleave', closeCurrentSubmenu);
	itemBtn.addEventListener('mouseenter', function () {
		if (Date.now() < closedAt + 300) openSubMenu();
	});
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function createMenuFromTemplate(template) {
	for (var i = 0; i < template.length; i++) {
		var item = template[i];
		addItemInMenuBar(item);
	}
} 

createMenuFromTemplate(MENU_TEMPLATE);
