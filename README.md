# Pixelbox

Framework to fast prototyping pixel games.

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
 - `assets/` is where you put your game assets files (images, text files, JSON)
 - `audio/` is where you put sounds and music
 - `src` is the source folder. `main.js` is the entry file of the game.
 - `build`
 - `node_modules`
 - `index.html`

## Pixelbox API

In your game code, here the list of available functions and objects:

#### Assets
All supported files you put inside the `assets/` directory will be loaded in this
object. The structure follow the structure of the directory. For instance, the file
file located in `assets/images/sprites/player.png` will be accessible with 
`assets.images.sprites.player`.

Supported files includes: images (`.png`, `.jpg`), text (`.txt`), JSON (`.json`)

You directly have access to JSON content.

Because files are loaded inside `assets` object and refered wthout their extension,
you cannot have a file and a directory with the same name inside the same directory.

#### Sound
 - `sfx('sound');` play the sound.mp3 file in `audio/` folder
 - `music('bgm');` play the bgm.mp3 file in loop. If another music is already playing,
 it will fade in and out to the new music. If no soundId is provided, the music stops.


## Tools

TODO


## Deployement

When your game is ready, the files you should deploy are:
`assets`, `audio` and `build` folders along with the `index.html` file. 