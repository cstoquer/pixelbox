# Bleeper

Bleeper component can be activated from the `Components` tab of the `Project settings` panel.
Note that Bleeper depends on the *AudioManager* component.

## Usage

There are several ways to play Bleeper sounds:

### Named sounds
If the sound is named, it is accessible on the `assets` global, and automatically added to AudioManager.
```js
// from assets global
assets.bleeper.mySound.play(volume, panoramic, pitch); // all parameters optionnals

// using audioManager
sfx('mySound', volume, panoramic, pitch); // using default channel
audioManager.playSound('sfx', 'mySound', volume, panoramic, pitch);
```

### Using bleeper module
Bleeper module exposes an array of all sounds defined in the program.
```js
var bleeper = require('pixelbox/bleeper');
bleeper.sounds[3].play(volume, panoramic, pitch);
```
