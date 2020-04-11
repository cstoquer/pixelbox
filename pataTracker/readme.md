# Pata-Tracker

Tracker component can be activated from the `Components` tab of the `Project settings` panel.

## Usage

Pata-tracker is exposed as a `patatracker` global variable.
```js
patatracker.playSong(songNumber);
patatracker.stop();
```

Pata-Tracker automatically loads project album data (`assets/patatracker.json`).
If you need to load a different album, you can do it with the following API:
```js
patatracker.loadData(data);
```
