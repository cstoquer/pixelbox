# Pixelbox

A sandbox framework to fast-prototype pixel-based games.

[![Install with NPM](https://nodei.co/npm/pixelbox.png?downloads=true&stars=true)](https://nodei.co/npm/pixelbox/)

Pixelbox is pretty much inspired by [PICO8](http://www.lexaloffle.com/pico-8.php)

## Install

`npm install -g pixelbox`

## Use

Inside your new game project directory:

`pixelbox`

Pixelbox create a local server on port 3000 where your game is made available.
Just go to `http://localhost:3000/` with your web browser.
The application is rebuilt everytime you refresh the page in the browser.


At the first startup, pixelbox will create a set of files and directories:
```
assets/
audio/
build/
src/
  |- main.js
node_modules/
index.html
```

 - `assets/` is where you put your game assets files (images, text files, JSON)
 - `audio/` is where you put sounds and music
 - `src/` is the source folder. `main.js` is the entry file of the game.

## Pixelbox API

#### Program structure

Code is added in the `src/main.js`. If you provide a `exports.update` function,
pixelbox will call it every frame.

#### Assets
Pixebox load all assets for you at startup.
All supported files you put inside the `assets/` directory will in an object `assets`.
The structure follow the structure of the directory. For instance, the file
file located in `assets/images/sprites/player.png` will be accessible with 
`assets.images.sprites.player`.

Supported files includes: 
 - images (`.png`, `.jpg`)
 - plain text files (`.txt`)
 - JSON formatted data (`.json`)

You directly have access to JSON content.

Because files are loaded inside `assets` object and refered wthout their extension,
you cannot have a file and a directory with the same name inside the same directory.

#### Graphics

`cls()` clear screen

`sprite(n, x, y)` draw sprite number `n` on screen at pixel position `(x, y)`

`draw(image, x, y)` draw an image or texture on screen at pixel position `(x, y)`

`spritesheet(image)` use image as spritesheet

`rect(x, y, w, h)` stroke a rectangle with pen color

`rectfill(x, y, w, h)` fill a rectangle with paper color

#### Text

`print(text, [x, y])` if x, y is provided, print text at pixel position (x, y). 
else print text at cursor position.

`println(text)` print text and feed new line. 
When cursor reach the bottom of the screen, a vertical scroll is applied 
(just like it would happend in a terminal.)

`locate(i, j)` set cursor position at column i line j

`pen(colorId)` set text color to colorId in color palette

`paper(colorId)` set paper color to colorId in color palette.

#### Controls

`btn` state of the buttons. available buttons are: `up`, `down`, `left`, `right`, `A`, `B`

`btnp` if button has been pressed in current frame

`btnr` if button has been released in current frame

#### Sound
 - `sfx('sound');` play the sound.mp3 file in `audio/` folder
 - `music('bgm');` play the bgm.mp3 file in loop. If another music is already playing,
 it will fade in and out to the new music. If no soundId is provided, the music stops.

[AudioManger](https://github.com/Wizcorp/AudioManager) is the module that handle audio 
loading and playback. You have access to its instance on `audioManager`.

## Tools

TODO


## Deployement

When your game is ready, the files you should deploy are:
`assets`, `audio` and `build` folders along with the `index.html` file. 