# TileMap

Pixelbox has a built-in `TileMap` component.
A TileMap consist of:
 - A tilesheet
 - A grid of sprites from the tilesheet, each sprite can be flipped or rotated
 - A name


TileMap are easily created and edited easily using the MapEditor. Various scripts, called *tile brush*, are available to modify TileMap, and it is possible to program your own *tile brush*.

The *assets* directory should contain a `maps.json` file in which TileMap are stored. Any number of maps can be created, and you can organise the map within *map folders*. To create a new TileMap from the editor: locate the `maps.json` file in the *Assets window* and click on it to open the contextual menu. Select *New map* to create an empty map. Open the map in the *MapEditor window* by double click on its file. From this window, you can change its name, size and draw tiles using current *tile brush*.


A maps created this way is retrived in the game code by its name using the `getMap` function. The tile map can then be drawn on screen (or in another Texture), modified, copied, pasted, resized, etc.

TileMap can be used to render a level made of sprites, or just to store game data.


## Get or create a TileMap

Get a tile by its name by using `getMap` function. The name id the full path to the map.
```javascript
var map = getMap('mapName');
```

To create new maps, you need to require the `TileMap` module. The constructor takes the size of the map in tiles and create an empty map. The following example create a new map of 16 by 16 tiles:
```javascript
var TileMap = require('TileMap');
var map = new TileMap(16, 16);
```

## TileMap properties

- `name`: map name
- `width`: map width in tiles
- `height`: map height in tiles
- `items`
- `texture`

## Draw map

To draw the map on screen at position `(x, y)` you use one of the following methods:
```javascript
map.draw(x, y);  // draw map on screen using map's draw method
draw(map, x, y); // draw map on screen, using global draw
texture.draw(map, x, y); // draw a map on a texture
```

The map's tilesheet can be changed using the `setTilesheet` method and passing it an image, sprite or texture.
```javascript
map.setTilesheet(tilesheet);
```

## Access and modify map's tiles
TileMap store its tiles as a 2D array of `Tile`.

A `Tile` have the following attributes:
- `x`: Abscissa coordinate of the tile in the map.
- `y`: Ordinate coordinate of the tile in the map. Vertical axis is oriented from top to bottom.
- `sprite`: Sprite index of the tile. This is a number between 0 and 255.
- `flipH`: a boolean encoding if the tile is horizontally flipped.
- `flipV`: a boolean encoding if the tile is vertically flipped.
- `flipR`: a boolean encoding if the tile is rotated.
- `flagA`: a boolean flag for user.
- `flagB`: a boolean flag for user.


This 2D array is accessible on the `items` property of the TileMap, but you should get or set tiles using the following methods:

`TileMap.get` returns the tile at position [x, y] or `null` if this position is empty.
```javascript
map.get(x, y);
```

`TileMap.set` add a tile at position [x, y] with the specified attributes.
Only `x`, `y` and `sprite` are required, everything else is optional.
```javascript
map.set(x, y, sprite, flipH, flipV, flipR, flagA, flagB);
```

`TileMap.remove` remove the tile at specified position.
```javascript
map.remove(x, y);
```

`TileMap.find` let you search for all the tiles with specified properties.
The `sprite` parameter can be `null`, in which case the function will return
the positions where there are no tiles.
```javascript
map.find(sprite, flagA, flagB);
```

## Modifying maps

A map can be resized or reset.

```javascript
map.resize(width, height); // resize the map (size unit is tiles)
map.clear(); // Reset the whole map content by setting all its tiles to null
```


```javascript
var mapCopy = map.copy(x, y, width, height); // copy this map to a new one.
               // x, y, width, height can be specified to copy only a rectangular part of the map.
map.paste(mapCopy, x, y, merge); // paste map data in the map at position offset [x, y].
               // if 'merge' flag is set, then null tiles will not overwrite current map tile.
```


## Methods

- `resize(width, height)`
- `redraw()`
- `release()`
- `save()`
- `load(mapDefinition)`

## Transform component

- `flipH()`
- `flipV()`
- `flipR()`
- `flipC()`
- `trim()`
