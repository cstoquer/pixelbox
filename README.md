![pixelbox](https://cloud.githubusercontent.com/assets/2462139/12671050/6c0da564-c6b0-11e5-8a07-1380b8dddfaf.png)

A sandbox framework to fast-prototype pixel-based games.

[![Install with NPM](https://nodei.co/npm/pixelbox.png?downloads=true&stars=true)](https://nodei.co/npm/pixelbox/)

Pixelbox is pretty much inspired by [PICO8](http://www.lexaloffle.com/pico-8.php)

# Install

`npm install -g pixelbox`

# Use

Inside your new game project directory:

`pixelbox`

Pixelbox create a local server on port 3000 where your game is made available.
Just go to `http://localhost:3000/` with your web browser.
The application is rebuilt everytime you refresh the page in the browser.


At the first startup, pixelbox will create a set of files and directories:
```
assets/
 ├── spritesheet.png
 └── maps.json
audio/
build/
src/
 └── main.js
tools/
node_modules/
settings.json
index.html
```

 - `assets/` is where you put your game assets files (images, text files, JSON)
 - `audio/` is where you put sounds and music
 - `src/` is the source folder. `main.js` is the entry file of the game.

# Programming with pixelbox

Pixelbox provides:
 - a 128*128 pixels canvas in which you can `print` text and `draw` sprites.
 - a transparent asset loader
 - a keyboard inputs manager
 - an audio manager with transparent loading system
 - an automatic builder

pixelbox is also built-in with the following libraries and modules:
 - `tina.js` tweening and animation library
 - `EventEmitter` API compatible port of Node.js' EventEmitter to the browser
 - `inherits` inheritance utility function

### Program structure

Your game entry point is the `src/main.js` file.
If you provide a `exports.update` function, pixelbox will call it every frame.

Build is made using [browserify](http://browserify.org/) which give you access
to `require` and `exports` to easily modularize your project.
The project is automaticaly rebuilt everytime you refresh the game page in your 
web browser.

### Assets

Pixebox load all assets for you at startup.
All supported files you put inside the `assets/` directory will in an object `assets`.
The structure follow the structure of the directory. For instance, the file
file located in `assets/sprites/player.png` will be accessible with 
`assets.sprites.player`.

Supported files includes: 
 - images (`.png`, `.jpg`)
 - plain text files (`.txt`)
 - JSON formatted data (`.json`)

You directly have access to JSON content.

Because files are loaded inside `assets` object and refered wthout their extension,
you cannot have a file and a directory with the same name inside the same directory.

# Pixelbox API

### Graphics

 - `cls()` clear screen
 - `sprite(n, x, y [,flipH [,flipV [, flipR]]])` draw sprite number `n` on screen at pixel position `(x, y)`. `flipH` and `flipV` can be used to flip sprite horizontally or vertically, `flipR` to add a 90 degree clockwize rotation.
 - `draw(image, x, y)` draw an image or texture on screen at pixel position `(x, y)`
 - `spritesheet(image)` use image as spritesheet
 - `rect(x, y, w, h)` stroke a rectangle with pen color
 - `rectfill(x, y, w, h)` fill a rectangle with paper color

### Text

 - `print(text, [x, y])` if x, y is provided, print text at pixel position (x, y). 
else print text at cursor position.
 - `println(text)` print text and feed new line. 
When cursor reach the bottom of the screen, a vertical scroll is applied 
(just like it would happend in a terminal.)
 - `locate(i, j)` set cursor position at column i line j
 - `pen(colorId)` set text color to colorId in color palette
 - `paper(colorId)` set paper color to colorId in color palette.

### Controls

 - `btn` state of the buttons. available buttons are: `up`, `down`, `left`, `right`, `A`, `B`
 - `btnp` if button has been pressed in current frame
 - `btnr` if button has been released in current frame

### Sound

 - `sfx('sound');` play the sound.mp3 file in `audio/` folder
 - `music('bgm');` play the bgm.mp3 file in loop. If another music is already playing,
 it will fade in and out to the new music. If no soundId is provided, the music stops.

[AudioManager](https://github.com/Wizcorp/AudioManager) is the module that handle audio 
loading and playback. You have access to its instance on `audioManager`.

### Maps

Pixelbox has a built-in `Map` component. A map is a grid of sprites with a fast rendering system.
You can create and edit maps easily with pixelbox map editor (see the Tools section bellow).

#### Get map

```javascript
var map = assets.maps[0]; // get a map by its index
var map = getMap('mapName'); // get a map by its name
```

#### Draw map on screen

```javascript
map.draw(x, y);
draw(map, x, y);
```

#### Access map's sprites

```javascript
map.get(x, y); // returns the MapItem at position [x, y]. null if empty
map.set(x, y, sprite, flipH, flipV, flipR, flagA, flagB); // add a sprite
map.find(sprite, flagA, flagB); // find all items with specified properties
map.clear(); // reset the whole map content
```

#### Copy and clone maps

```javascript
map.copy(anotherMap); // copy anotherMap in map
var mapCopy = map.clone(); // make a copy of map
```


### Utility functions

 - `clip(value, min, max)` clip a value between min and max
 - `chr$(n)` return a character from code `n`.
 - `random(n)` return a random **integer** between 0 and n

# Tools

Tools are accessible at `http://localhost:3000/tools/`

![pixelbox_tools](https://cloud.githubusercontent.com/assets/2462139/12670965/d091a37e-c6af-11e5-8537-f82689f3496c.png)

## Assets browser
Displays assets and maps in a tree view.

## Map editor window

 - Draw sprites with the mouse.
 - Hold `Shift` to erase.
 - Hold `Alt` to scroll inside the map.

## Spritesheet window

display the spritesheet used by the map currently edited in the `Map editor` window.
Spritesheet is saved with the map. When a map is loaded, the spritesheet will be updated accordingly.
Images from `Assets browser` window can be drag and droped in the `Spritesheet` window.

From this window, you can select the sprite and its transformations flags to be used when editing the map.

## Custom tools
You can program your custom tools to be used inside the tools interface.
Custom tool scripts goes in the `tools` folder and will appears in the `Custom tools` window.

see [pixelbox-utilities](https://github.com/cstoquer/pixelbox-utilities/tree/master/tools) 
for code examples of custom tools.

# Deployment

When your game is ready, the files you should deploy are:
`assets`, `audio` and `build` folders along with the `index.html` file.

# Settings

`settings.json` file let you change pixelbox parameters:
 - sprite size. default is 8x8 pixels
 - pixel size. default is 4x4 pixels
 - canvas screen size. default is 128x128 pixels
 - color palette.

