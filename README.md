![pixelbox](https://cloud.githubusercontent.com/assets/2462139/12671050/6c0da564-c6b0-11e5-8a07-1380b8dddfaf.png)

A sandbox framework to fast-prototype tile-based games.


Pixelbox takes inspiration from fantasy consoles like [PICO8](http://www.lexaloffle.com/pico-8.php)
and game creation frameworks like Unity3D.

# Install

From version 2, Pixelbox package no longer includes the editor. Instead, the editor is now a much more easy-to-use standalone application that can be downloaded [here](https://cstoquer.itch.io/pixelbox).

# Use

Inside your new game project directory:

`pixelbox`

Pixelbox create a local server on port 3000 where your game is made available.
Just go to `http://localhost:3000/` with your web browser.
The application is rebuilt everytime you refresh the page in the browser.


A Pixelbox project have the following structure:
```
assets/
 ├── tilesheet.png
 └── maps.json
audio/
build/
src/
 └── main.js
tools/
node_modules/
project.pixelbox
package.json
index.html
```

 - `assets/` is where you put your game assets files (images, text files, JSON)
 - `audio/` is where you put sounds and music
 - `src/` is the source code folder, and `main.js` is the entry file of the game.

# Programming with pixelbox

Pixelbox provides:
 - A main screen canvas in which you can `print` text, `draw` tiles, sprites or images.
 - Automatic asset map generator and loader
 - Keyboard/gamepads inputs manager
 - Audio manager with automatic loading system


### Program structure

The game entry point is the `src/main.js` file.
If you provide a `exports.update` function, Pixelbox will call it every frame.

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

Pixelbox expose the following methods directly on the global scope:

### Graphics

 - `cls()` clear screen with *paper* color
 - `sprite(n, x, y [,flipH [,flipV [, flipR]]])` draw sprite number `n` on screen at pixel position `(x, y)`.
 `flipH` and `flipV` can be used to flip sprite horizontally or vertically, `flipR` adds a 90 degree clockwize rotation.
 - `draw(image, x, y [,flipH [,flipV [, flipR]]])` draw an *Image*, *Texture* or *Map* (tile map) on screen at pixel position `(x, y)`
 - `tilesheet(image)` change image used as default tilesheet
 - `rect(x, y, w, h)` stroke a rectangle with *pen* color
 - `rectfill(x, y, w, h)` fill a rectangle with *paper* color
 - `camera(x, y)` scroll add further drawing by provided position

### Text

Pixelbox has a predefined bitmap font that you can use to print text on screen or in textures.

 - `print(text, [x, y])` if x, y is provided, print text at pixel position (x, y).
else print text at cursor current position.
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

### Utility functions

 - `clamp(value, min, max)` clip a value between min and max
 - `chr$(n)` return a character from code `n`.
 - `random(n)` return a random **integer** between 0 and n
 - `inherits(Child, Parent)` make class *Child* inherits from class *Parent*

# Pixelbox components

### Texture

Texture is a basically a wrapper of an HTML canvas element that adds functionalities for Pixelbox rendering.

The main screen (accessible by the global variable `$screen`) is an instance of Texture and most of its methods
are accessible from the global scope.

To create new texture, you need to require the `Texture` module:
```javascript
var Texture = require('Texture');
var texture = new Texture(128, 128); // create a new texture of 128 by 128 pixels
```

#### Texture settings

```javascript
texture.resize(width, height);
texture.setPalette(palette);
texture.pen(colorIndex); // set PEN color index from palette (pen is used for text and stroke)
texture.paper(colorIndex); // set PAPER color index from palette (paper is used for fill)
texture.setTilesheet(tilesheet); // set tilesheet used for this texture
```

A tilesheet is an Image containing 256 sprites organized in a 16 x 16 grid
(the size of the tilesheet depend of the sprite size you set for your game).


#### Rendering

```javascript
texture.clear(); // clear texture (it become transparent)
texture.cls(); // clear screen (the whole texture is filled with the PAPER color)
texture.sprite(sprite, x, y, flipH, flipV, flipR); // draw a sprite from current tilesheet in the texture
texture.draw((img, x, y, flipH, flipV, flipR); // draw an image (or Texture or Map) in texture.
texture.rect(x, y, width, height); // stroke a rectangle
texture.rectfill(x, y, width, height); // fill a rectangle
```

#### Printing text

```javascript
texture.locate(i, j); // set text cursor to specified location
texture.print(text, x, y); // print some text
texture.println(text); // print some text and feed a new line
```

### Tile Maps

Pixelbox has a built-in `TileMap` component.
A TileMap consist of:
 - A name
 - A tilesheet. When the tilesheet is changed, the whole map will be redrawn with the new tilesheet.
 - A grid of sprites from the tilesheet plus few flags to flip or rotate sprites.

Once created, a tile map is rendered in one draw call only.

TileMap can be used to reder a level made of sprites, or just to store game data.

You can create tile maps from your game code; But usually, you will be using Pixelbox's
tools (see the Tools section bellow) to create and manage your maps as game assets.
A map can then be retrived by its name with Pixelbox's `getMap` function.
The tile map can then be drawn on screen (or in another Texture), modified, copied, pasted, resized, etc.

When stored in assets, the map is compressed to Pixelbox format to reduce file size.

#### Get tile map

```javascript
var map = getMap('mapName'); // get a tile map by its name
```

To create new maps, you need to require the `Map` module:
```javascript
var TileMap = require('TileMap');
var map = new TileMap(16, 16); // create a new tile map of 16 by 16 tiles
```

#### Draw map

```javascript
map.draw(x, y);  // draw map on screen at [x, y] position
draw(map, x, y); // idem, using the global draw function
texture.draw(map, x, y); // draw a map in another texture
map.setTilesheet(tilesheet); // set tilesheet to use for this map.
                             // The whole map is redrawn when calling this function.
```

#### Access map content

```javascript
map.get(x, y); // returns the Tile at position [x, y]. null if empty
map.set(x, y, tile, flipH, flipV, flipR, flagA, flagB); // add a tile
map.remove(x, y); // remove tile at position [x, y]. (set it to null)
map.find(tile, flagA, flagB); // find all tiles with specified properties
```

#### Modifying maps programatically

```javascript
map.resize(width, height); // resize the map (size unit is tiles)
map.clear(); // Reset the whole map content by setting all its tiles to null
var mapCopy = map.copy(x, y, width, height); // copy this map to a new one.
               // x, y, width, height can be specified to copy only a rectangular part of the map.
map.paste(mapCopy, x, y, merge); // paste map data in the map at position offset [x, y].
               // if 'merge' flag is set, then null tiles will not overwrite current map tile.
```

### Gamepad

The `gamepad` module allow easy access to gamepads if the browser supports it.
```javascript
getGamepads(); // get all gamepads state
getGamepad(id); // get gamepad state
getAnyGamepad(); // Merge states of all gamepads and return a global gamepad state.
```

the gamepad state returned by these function works like keyboard controls:
You get the state of each buttons, button presses and button release, plus the values of analog controls.

```javascript
var gamepad = require('gamepad'); // require the gamepad module
var state = gamepad.getGamepad(0); // get state of gamepad id 0

// buttons:
state.btn.A; // state of A button
state.btn.B; // state of B button
state.btn.X; // state of X button
state.btn.Y; // state of Y button
state.btn.start; // state of 'start' button
state.btn.back;  // state of 'back' button
state.btn.up;    // directionnal pad's up button
state.btn.down;  // directionnal pad's down button
state.btn.left;  // directionnal pad's left button
state.btn.right; // directionnal pad's right button
state.btn.lb; // left bumper button
state.btn.rb; // right bumper button
state.btn.lt; // left trigger button
state.btn.rt; // right trigger button

// button press and release.
// the structure is the same as state.btn but the values are true only
// on button press or release.
state.btnp; // button press
state.btnr; // button release

// analog values
state.x  // x axe value (first stick horizontal)
state.y  // y axe value (first stick vertical)
state.z  // z axe value (second stick horizontal)
state.w  // w axe value (second stick vertical)
state.lt // left trigger analog value
state.rt // right trigger analog value
```
