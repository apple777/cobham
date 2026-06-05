/* Flot plugin for drawing all elements of a plot on the canvas.

Copyright (c) 2007-2013 IOLA and Ole Laursen.
Licensed under the MIT license.

Flot normally produces certain elements, like axis labels and the legend, using
HTML elements. This permits greater interactivity and customization, and often
looks better, due to cross-browser canvas text inconsistencies and limitations.

It can also be desirable to render the plot entirely in canvas, particularly
if the goal is to save it as an image, or if Flot is being used in a context
where the HTML DOM does not exist, as is the case within Node.js. This plugin
switches out Flot's standard drawing operations for canvas-only replacements.

Currently the plugin supports only axis labels, but it will eventually allow
every element of the plot to be rendered directly to canvas.

The plugin supports these options:

{
    canvas: boolean
}

The "canvas" option controls whether full canvas drawing is enabled, making it
possible to toggle on and off. This is useful when a plot uses HTML text in the
browser, but needs to redraw with canvas text when exporting as an image.

*/

(function ($) {

    var options = {
        canvas: true
    };

    var render, getTextInfo, addText;

    function init(plot, classes) {

        var Canvas = classes.Canvas;

        // We only want to replace the functions once; the second time around
        // we would just get our new function back.  This whole replacing of
        // prototype functions is a disaster, and needs to be changed ASAP.

        if (render == null) {
            getTextInfo = Canvas.prototype.getTextInfo,
            addText = Canvas.prototype.addText,
            render = Canvas.prototype.render;
        }

        // Finishes rendering the canvas, including overlaid text

        Canvas.prototype.render = function () {

            if (!plot.getOptions().canvas) {
                return render.call(this);
            }

            var context = this.context,
                cache = this._textCache;

            // For each text layer, render elements marked as active

            context.save();
            context.textBaseline = "middle";

            for (var layerKey in cache) {
                if (Object.prototype.hasOwnProperty.call(cache, layerKey)) {
                    var layerCache = cache[layerKey];
                    for (var styleKey in layerCache) {
                        if (Object.prototype.hasOwnProperty.call(layerCache, styleKey)) {
                            var styleCache = layerCache[styleKey],
                                updateStyles = true;
                            for (var key in styleCache) {
                                if (Object.prototype.hasOwnProperty.call(styleCache, key)) {

                                    var info = styleCache[key],
                                        positions = info.positions,
                                        lines = info.lines;

                                    // Since every element at this level of the cache have the
                                    // same font and fill styles, we can just change them once
                                    // using the values from the first element.

                                    if (updateStyles) {
                                        context.fillStyle = info.font.color;
                                        context.font = info.font.definition;
                                        updateStyles = false;
                                    }

                                    for (var i = 0, position; position = positions[i]; i++) {
                                        if (position.active) {
                                            for (var j = 0, line; line = position.lines[j]; j++) {
                                                context.fillText(lines[j].text, line[0], line[1]);
                                            }
                                        } else {
                                            positions.splice(i--, 1);
                                        }
                                    }

                                    if (positions.length === 0) {
                                        delete styleCache[key];
                                    }
                                }
                            }
                        }
                    }
                }
            }

            context.restore();
        };

        // Creates (if necessary) and returns a text info object.
        //
        // When the canvas option is set, the object looks like this:
        //
        // {
        //     width: Width of the text's bounding box.
        //     height: Height of the text's bounding box.
        //     positions: Array of positions at which this text is drawn.
        //     lines: [{
        //         height: Height of this line.
        //         widths: Width of this line.
        //         text: Text on this line.
        //     }],
        //     font: {
        //         definition: Canvas font property string.
        //         color: Color of the text.
        //     },
        // }
        //
        // The positions array contains objects that look like this:
        //
        // {
        //     active: Flag indicating whether the text should be visible.
        //     lines: Array of [x, y] coordinates at which to draw the line.
        //     x: X coordinate at which to draw the text.
        //     y: Y coordinate at which to draw the text.
        // }

        Canvas.prototype.getTextInfo = function (layer, text, font, angle, width) {

            if (!plot.getOptions().canvas) {
                return getTextInfo.call(this, layer, text, font, angle, width);
            }

            var textStyle, layerCache, styleCache, info;

            // Cast the value to a string, in case we were given a number

            text = "" + text;

            // If the font is a font-spec object, generate a CSS definition

            if (typeof font === "object") {
                textStyle = font.style + " " + font.variant + " " + font.weight + " " + font.size + "px " + font.family;
            } else {
                textStyle = font;
            }

            // Retrieve (or create) the cache for the text's layer and styles

            layerCache = this._textCache[layer];

            if (layerCache == null) {
                layerCache = this._textCache[layer] = {};
            }

            styleCache = layerCache[textStyle];

            if (styleCache == null) {
                styleCache = layerCache[textStyle] = {};
            }

            info = styleCache[text];

            if (info == null) {

                var context = this.context;

                // If the font was provided as CSS, create a div with those
                // classes and examine it to generate a canvas font spec.

                if (typeof font !== "object") {

                    var element = $("<div>&nbsp;</div>")
                        .css("position", "absolute")
                        .addClass(typeof font === "string" ? font : null)
                        .appendTo(this.getTextLayer(layer));

                    font = {
                        lineHeight: element.height(),
                        style: element.css("font-style"),
                        variant: element.css("font-variant"),
                        weight: element.css("font-weight"),
                        family: element.css("font-family"),
                        color: element.css("color")
                    };

                    // Setting line-height to 1, without units, sets it equal
                    // to the font-size, even if the font-size is abstract,
                    // like 'smaller'.  This enables us to read the real size
                    // via the element's height, working around browsers that
                    // return the literal 'smaller' value.

                    font.size = element.css("line-height", 1).height();

                    element.remove();
                }

                textStyle = font.style + " " + font.variant + " " + font.weight + " " + font.size + "px " + font.family;

                // Create a new info object, initializing the dimensions to
                // zero so we can count them up line-by-line.

                info = styleCache[text] = {
                    width: 0,
                    height: 0,
                    positions: [],
                    lines: [],
                    font: {
                        definition: textStyle,
                        color: font.color
                    }
                };

                context.save();
                context.font = textStyle;

                // Canvas can't handle multi-line strings; break on various
                // newlines, including HTML brs, to build a list of lines.
                // Note that we could split directly on regexps, but IE < 9 is
                // broken; revisit when we drop IE 7/8 support.

                var lines = (text + "").replace(/<br ?\/?>|\r\n|\r/g, "\n").split("\n");

                for (var i = 0; i < lines.length; ++i) {

                    var lineText = lines[i],
                        measured = context.measureText(lineText);

                    info.width = Math.max(measured.width, info.width);
                    info.height += font.lineHeight;

                    info.lines.push({
                        text: lineText,
                        width: measured.width,
                        height: font.lineHeight
                    });
                }

                context.restore();
            }

            return info;
        };

        // Adds a text string to the canvas text overlay.

        Canvas.prototype.addText = function (layer, x, y, text, font, angle, width, halign, valign) {

            if (!plot.getOptions().canvas) {
                return addText.call(this, layer, x, y, text, font, angle, width, halign, valign);
            }

            var info = this.getTextInfo(layer, text, font, angle, width),
                positions = info.positions,
                lines = info.lines;

            // Text is drawn with baseline 'middle', which we need to account
            // for by adding half a line's height to the y position.

            y += info.height / lines.length / 2;

            // Tweak the initial y-position to match vertical alignment

            if (valign === "middle") {
                y = Math.round(y - info.height / 2);
            } else if (valign === "bottom") {
                y = Math.round(y - info.height);
            } else {
                y = Math.round(y);
            }

            // FIXME: LEGACY BROWSER FIX
            // AFFECTS: Opera < 12.00

            // Offset the y coordinate, since Opera is off pretty
            // consistently compared to the other browsers.

            if (!!(window.opera && window.opera.version().split(".")[0] < 12)) {
                y -= 2;
            }

            // Determine whether this text already exists at this position.
            // If so, mark it for inclusion in the next render pass.

            for (var i = 0, position; position = positions[i]; i++) {
                if (position.x === x && position.y === y) {
                    position.active = true;
                    return;
                }
            }

            // If the text doesn't exist at this position, create a new entry

            position = {
                active: true,
                lines: [],
                x: x,
                y: y
            };

            positions.push(position);

            // Fill in the x & y positions of each line, adjusting them
            // individually for horizontal alignment.

            for (var j = 0, line; line = lines[j]; j++) {
                if (halign === "center") {
                    position.lines.push([Math.round(x - line.width / 2), y]);
                } else if (halign === "right") {
                    position.lines.push([Math.round(x - line.width), y]);
                } else {
                    position.lines.push([Math.round(x), y]);
                }
                y += line.height;
            }
        };
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: "canvas",
        version: "1.0"
    });

})(jQuery);


﻿/*
* Canvas2Image v0.1
* Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk
* MIT License [http://www.opensource.org/licenses/mit-license.php]
*/

var Canvas2Image = (function () {

    // check if we have canvas support
    var bHasCanvas = false;
    var oCanvas = document.createElement("canvas");
    if (!!oCanvas.getContext && !!oCanvas.getContext("2d")) {
        bHasCanvas = true;
    }

    // no canvas, bail out.
    if (!bHasCanvas) {
        return {
            saveAsBMP: function () { },
            saveAsPNG: function () { },
            saveAsJPEG: function () { }
        }
    }

    var bHasImageData = !!oCanvas.getContext && !!oCanvas.getContext("2d").getImageData;
    var bHasDataURL = !!(oCanvas.toDataURL);
    var bHasBase64 = !!(window.btoa);

    var strDownloadMime = "image/octet-stream";

    // ok, we're good
    var readCanvasData = function (oCanvas) {
        var iWidth = parseInt(oCanvas.width);
        var iHeight = parseInt(oCanvas.height);
        return oCanvas.getContext("2d").getImageData(0, 0, iWidth, iHeight);
    }

    // base64 encodes either a string or an array of charcodes
    var encodeData = function (data) {
        var strData = "";
        if (typeof data == "string") {
            strData = data;
        } else {
            var aData = data;
            for (var i = 0; i < aData.length; i++) {
                strData += String.fromCharCode(aData[i]);
            }
        }
        return btoa(strData);
    }

    // creates a base64 encoded string containing BMP data
    // takes an imagedata object as argument
    var createBMP = function (oData) {
        var aHeader = [];

        var iWidth = oData.width;
        var iHeight = oData.height;

        aHeader.push(0x42); // magic 1
        aHeader.push(0x4D);

        var iFileSize = iWidth * iHeight * 3 + 54; // total header size = 54 bytes
        aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
        aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
        aHeader.push(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
        aHeader.push(iFileSize % 256);

        aHeader.push(0); // reserved
        aHeader.push(0);
        aHeader.push(0); // reserved
        aHeader.push(0);

        aHeader.push(54); // dataoffset
        aHeader.push(0);
        aHeader.push(0);
        aHeader.push(0);

        var aInfoHeader = [];
        aInfoHeader.push(40); // info header size
        aInfoHeader.push(0);
        aInfoHeader.push(0);
        aInfoHeader.push(0);

        var iImageWidth = iWidth;
        aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
        aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
        aInfoHeader.push(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
        aInfoHeader.push(iImageWidth % 256);

        var iImageHeight = iHeight;
        aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
        aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
        aInfoHeader.push(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
        aInfoHeader.push(iImageHeight % 256);

        aInfoHeader.push(1); // num of planes
        aInfoHeader.push(0);

        aInfoHeader.push(24); // num of bits per pixel
        aInfoHeader.push(0);

        aInfoHeader.push(0); // compression = none
        aInfoHeader.push(0);
        aInfoHeader.push(0);
        aInfoHeader.push(0);

        var iDataSize = iWidth * iHeight * 3;
        aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
        aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
        aInfoHeader.push(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
        aInfoHeader.push(iDataSize % 256);

        for (var i = 0; i < 16; i++) {
            aInfoHeader.push(0); // these bytes not used
        }

        var iPadding = (4 - ((iWidth * 3) % 4)) % 4;

        var aImgData = oData.data;

        var strPixelData = "";
        var y = iHeight;
        do {
            var iOffsetY = iWidth * (y - 1) * 4;
            var strPixelRow = "";
            for (var x = 0; x < iWidth; x++) {
                var iOffsetX = 4 * x;

                strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 2]);
                strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX + 1]);
                strPixelRow += String.fromCharCode(aImgData[iOffsetY + iOffsetX]);
            }
            for (var c = 0; c < iPadding; c++) {
                strPixelRow += String.fromCharCode(0);
            }
            strPixelData += strPixelRow;
        } while (--y);

        var strEncoded = encodeData(aHeader.concat(aInfoHeader)) + encodeData(strPixelData);

        return strEncoded;
    }


    // sends the generated file to the client
    var saveFile = function (strData) {
        document.location.href = strData;
    }

    var makeDataURI = function (strData, strMime) {
        return "data:" + strMime + ";base64," + strData;
    }

    // generates a <img> object containing the imagedata
    var makeImageObject = function (strSource) {
        var oImgElement = document.createElement("img");
        oImgElement.src = strSource;
        return oImgElement;
    }

    var scaleCanvas = function (oCanvas, iWidth, iHeight) {
        if (iWidth && iHeight) {
            var oSaveCanvas = document.createElement("canvas");
            oSaveCanvas.width = iWidth;
            oSaveCanvas.height = iHeight;
            oSaveCanvas.style.width = iWidth + "px";
            oSaveCanvas.style.height = iHeight + "px";

            var oSaveCtx = oSaveCanvas.getContext("2d");

            oSaveCtx.drawImage(oCanvas, 0, 0, oCanvas.width, oCanvas.height, 0, 0, iWidth, iHeight);
            return oSaveCanvas;
        }
        return oCanvas;
    }

    return {

        saveAsPNG: function (oCanvas, bReturnImg, iWidth, iHeight) {
            if (!bHasDataURL) {
                return false;
            }
            var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);
            var strData = oScaledCanvas.toDataURL("image/png");
            if (bReturnImg) {
                return makeImageObject(strData);
            } else {
                saveFile(strData.replace("image/png", strDownloadMime));
            }
            return true;
        },

        saveAsJPEG: function (oCanvas, bReturnImg, iWidth, iHeight) {
            if (!bHasDataURL) {
                return false;
            }

            var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);
            var strMime = "image/jpeg";
            var strData = oScaledCanvas.toDataURL(strMime);

            // check if browser actually supports jpeg by looking for the mime type in the data uri.
            // if not, return false
            if (strData.indexOf(strMime) != 5) {
                return false;
            }

            if (bReturnImg) {
                return makeImageObject(strData);
            } else {
                saveFile(strData.replace(strMime, strDownloadMime));
            }
            return true;
        },

        saveAsBMP: function (oCanvas, bReturnImg, iWidth, iHeight) {
            if (!(bHasImageData && bHasBase64)) {
                return false;
            }

            var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight);

            var oData = readCanvasData(oScaledCanvas);
            var strImgData = createBMP(oData);
            if (bReturnImg) {
                return makeImageObject(makeDataURI(strImgData, "image/bmp"));
            } else {
                saveFile(makeDataURI(strImgData, strDownloadMime));
            }
            return true;
        }
    };

})();

/* Flot plugin that adds a function to allow user save the current graph as an image
    by right clicking on the graph and then choose "Save image as ..." to local disk.

Copyright (c) 2013 http://zizhujy.com.
Licensed under the MIT license.

Usage:
    Inside the <head></head> area of your html page, add the following lines:
    
    <script type="text/javascript" src="http://zizhujy.com/Scripts/base64.js"></script>
    <script type="text/javascript" src="http://zizhujy.com/Scripts/drawing/canvas2image.js"></script>
    <script type="text/javascript" src="http://zizhujy.com/Scripts/flot/jquery.flot.saveAsImage.js"></script>

    Now you are all set. Right click on your flot canvas, you will see the "Save image as ..." option.

Online examples:
    http://zizhujy.com/FunctionGrapher is using it, you can try right clicking on the function graphs and
    you will see you can save the image to local disk.

Dependencies:
    This plugin references the base64.js and canvas2image.js.

Customizations:
    The default behavior of this plugin is dynamically creating an image from the flot canvas, and then puts the 
    image above the flot canvas. If you want to add some css effects on to the dynamically created image, you can
    apply whatever css styles on to it, only remember to make sure the css class name is set correspondingly by 
    the options object of this plugin. You can also customize the image format through this options object:

    options: {
        imageClassName: "canvas-image",
        imageFormat: "png"
    }

*/

; (function ($, Canvas2Image) {
    var imageCreated = null;
    var mergedCanvas = null;
    var theClasses = null;

    function init(plot, classes) {
        theClasses = classes;
        plot.hooks.bindEvents.push(bindEvents);
        plot.hooks.shutdown.push(shutdown);

        $("#snapshot").click(function(e){                                                                                                                                                             
                                                                                                                                                                                           
          mergedCanvas = mergeCanvases(plot);                                                                                                                                                         
          var image = mergedCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
          window.location.href=image;                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                    
        })                                                                                                                                                                                           

        function bindEvents(plot, eventHolder) {
            eventHolder.mousedown(onMouseDown);
        }

        function shutdown(plot, eventHolder) {
            eventHolder.unbind("mousedown", onMouseDown);
        }

        function onMouseDown(e) {
            if (e.button == 2) {
                // Open an API in Canvas2Image, in case you would need to call
                // it to delete the dynamically created image.
                //Canvas2Image.deleteStaleCanvasImage = deleteStaleCanvasImage;
                //deleteStaleCanvasImage(plot, mergedCanvas);
                //mergedCanvas = mergeCanvases(plot);
                //createImageFromCanvas(mergedCanvas, plot, plot.getOptions().imageFormat);
                // For ubuntu chrome:
                //setTimeout(function () { deleteStaleCanvasImage(plot, mergedCanvas); }, 500);
            }
        }
    }

    function onMouseUp(plot) {
        setTimeout(function () { deleteStaleCanvasImage(plot, mergedCanvas); }, 100);
    }

    function deleteStaleCanvasImage(plot, mergedCanvas) {
        //$(plot.getCanvas()).parent().find("img." + plot.getOptions().imageClassName).unbind("mouseup", onMouseUp).remove();
        $(imageCreated).unbind("mouseup", onMouseUp).remove();
        if (!!mergedCanvas) {
            $(mergedCanvas).remove();
        }
        $(".mergedCanvas").remove();
    }
    
    function mergeCanvases(plot) {
        
        var theMergedCanvas = plot.getCanvas();

        if (!!theClasses) {
            theMergedCanvas = new theClasses.Canvas("mergedCanvas", plot.getPlaceholder());
            var mergedContext = theMergedCanvas.context;
            var plotCanvas = plot.getCanvas();
            
            theMergedCanvas.element.height = plotCanvas.height;
            theMergedCanvas.element.width = plotCanvas.width;
            
            mergedContext.restore();

            $(theMergedCanvas).css({
                "visibility": "hidden",
                "z-index": "-100",
                "position": "absolute"
            });

            var $canvases = $(plot.getPlaceholder()).find("canvas").not('.mergedCanvas');
            $canvases.each(function(index, canvas) {
                mergedContext.drawImage(canvas, 0, 0);
            });

            return theMergedCanvas.element;
        }

        return theMergedCanvas;
    }

    function createImageFromCanvas(canvas, plot, format) {
        if (!canvas) {
            canvas = plot.getCanvas();
        }
        
        var img = null;
        switch (format.toLowerCase()) {
            case "png":
                img = Canvas2Image.saveAsPNG(canvas, format);
                break;
            case "bmp":
                img = Canvas2Image.saveAsBMP(canvas, format);
                break;
            case "jpeg":
                img = Canvas2Image.saveAsJPEG(canvas, format);
                break;
            default:
                break;
        }

        if (!img) {
            img = Canvas2Image.saveAsPNG(canvas, "png");
        }

        if (!img) {
            img = Canvas2Image.saveAsPNG(canvas, "bmp");
        }

        if (!img) {
            img = Canvas2Image.saveAsJPEG(canvas, "jpeg");
        }

        if (!img) {
            alert(plot.getOptions().notSupportMessage || "Oh Sorry, but this browser is not capable of creating image files, please use PRINT SCREEN key instead!");
            return false;
        }

        $(img).attr("class", plot.getOptions().imageClassName);
        $(img).css({ "border": $(canvas).css("border"), "z-index": "9999", "position": "absolute" });
        $(img).insertBefore($(canvas));
        $(img).mouseup(plot, onMouseUp);

        imageCreated = img;
    }

    var options = {
        imageClassName: "canvas-image",
        imageFormat: "png"
    };

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'saveAsImage',
        version: '1.6'
    });

})(jQuery, Canvas2Image);
