/** @noSelfInFile */

/**
* @type Texture
* Not directly accessible
*/
declare type Texture = {}

/**
* @type Image
* Not directly accessible
*/
declare type Image = {}

/**
* @type Canvas
* Not directly accessible
*/
declare type Canvas = {}

/**
* @type Map
* Not directly accessible
*/
declare type Map = {}

/**
* clear screen with current paper color
*/
declare function cls():void

/**
* Draw a tile in Texture using the current tilesheet. Draw sprite number tile on screen at pixel position (x, y) flipH and flipV can be used to flip sprites horizontally or vertically, flipR adds a 90 degree clockwise rotation
* @param tile tile index (number between 0 and 255)
* @param [x] x position in pixels
* @param [y] y position in pixels
* @param [flipH] if set, the tile is horizontally flipped
* @param [flipV] if set, the tile is vertically flipped
* @param [flipR] if set, the tile rotated by 90 degree
*/
declare function sprite(tile:number, x?:number, y?:number, flipH?:boolean, flipV?:boolean, flipR?:boolean):void

/**
 * Draw an image (or anything drawable) in the texture
 * @param element thing to draw in the texture
 * @param [x] x coordinate of where to draw the image. The value is offseted by Texture's camera position
 * @param [y] y coordinate of where to draw the image. The value is offseted by Texture's camera position
 * @param [flipH] if set, the image is horizontally flipped
 * @param [flipV] if set, the image is vertically flipped
 * @param [flipR]: if set, the image rotated by 90 degree
 */
declare function draw(element:(Image|Canvas|Texture|Map), x?:number, y?:number, flipH?:boolean, flipV?:boolean, flipR?:boolean):void

/**
 * Set default tilesheet for all Textures
 * @param tilesheet - tilesheet to use
 */
declare function tilesheet(tilesheet:Image | Texture | Map):void

/**
 * Draw an outlined rectangle, using current PEN color.
 * Drawing is offset by Texture's camera.
 * @param x x coordinate of rectangle upper left corner
 * @param y y coordinate of rectangle upper left corner
 * @param w rectangle width
 * @param h rectangle height
 */
declare function rect(x:number, y:number, w:number, h:number):void

/**
 * Draw a filled rectangle, using current PAPER color.
 * Drawing is offset by Texture's camera.
 *
 * The minimum size of a filled rectangle is 2.
 * If `w` or `h` is smaller than 2, nothing is drawn.
 *
 * @param x x coordinate of rectangle upper left corner
 * @param y y coordinate of rectangle upper left corner
 * @param w rectangle width
 * @param h rectangle height
 */
declare function rectf(x:number, y:number, w:number, h:number):void

/**
 * Set camera position
 * @param [x] camera x position in pixels, default is 0
 * @param [y] camera y position in pixels, default is 0
 */
declare function camera(x?:number, y?:number):void

/**
 * Print text. A position in pixel can be specified. If you do so, the text
 * will be drawn at specified position plus camera offset. If not, the text is
 * printed at current cursor position and wil wrap and make screen scroll down
 * when cursor reach the texture bottom.
 *
 * @param str text to be printed
 * @param [x] text x position in pixel
 * @param [y] text y position in pixel
 */
declare function print(str:string, x?:number, y?:number):void

/**
 * Same as print and add a go to the next line.
 * @param str text to be printed
 */
declare function println(str:string):void

/**
 * Set cursor position for the text.
 * @param i cursor x position in character size (4 pixels)
 * @param j cursor y position in character size (6 pixels)
 */
declare function locate(i:number, j:number):void

/**
 * Set PEN color index. This color is used when printing text in the texture,
 * and for outline when drawing shapes.
 * @param colorId pen color index in the palette
 */
declare function pen(colorId:number):void

/** Set PAPER color index. This color is used for fill when drawing shapes
 * or when clearing the texture (cls)
 * @param colorId pen color index in the palette
 */
declare function paper(colorId:number):void

/**
 * @class btn
 * @property btn.A     - A button
 * @property btn.B     - B button
 * @property btn.X     - X button
 * @property btn.Y     - Y button
 * @property btn.lb    - left bumper button
 * @property btn.rb    - right bumper button
 * @property btn.lt    - left trigger button
 * @property btn.rt    - right trigger button
 * @property btn.back  - back button
 * @property btn.start - start button
 * @property btn.lp    - first axis push button
 * @property btn.rp    - second axis push button
 * @property btn.up    - directional pad up button
 * @property btn.down  - directional pad down button
 * @property btn.left  - directional pad left button
 * @property btn.right - directional pad right button
 */
declare class btn {
    static A:boolean;
    static B:boolean;
    static X:boolean;
    static Y:boolean;
    static lb:boolean;
    static rb:boolean;
    static lt:boolean;
    static rt:boolean;
    static back:boolean;
    static start:boolean;
    static lp:boolean;
    static rp:boolean;
    static up:boolean;
    static down:boolean;
    static left:boolean;
    static right:boolean;
}
/**
 * Checks if a button has been pressed
 * @class btnp
 *
*/
declare class btnp extends btn {}
/**
 * Checks if a button has been released
 * @class btnr
 *
*/
declare class btnr extends btn {}

/**
 * Plan a sound file
 * @param sound Sound file
*/
declare function sfx(sound:any):void

/**
 * Play music.mp3
 * @param sound Sound file
*/
declare function music(sound:any):void

/**
 * Clamps a value between min and max
 * @param value number
 * @param min minimum value
 * @param max maximum value
*/
declare function clamp(value:number, min:number, max:number):void

/**
 * Return a character from code n
 * @param n character code
 * @returns character
*/
declare function chr$(n:number):character

/**
 * Return a random integer between 0 and n
 * @param n Max number range
 * @returns number
*/
declare function random(n:number):number

/**
 * Child inherits from class Parent
 * @param Child Max number range
 * @param Parent Max number range
*/
declare function inherits(Child:class, Parent:class):void
