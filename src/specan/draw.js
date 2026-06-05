/**
 * This module just does the drawing operations. The colors and line widths are defined here.
 */
define([ './spectrumdata.js', '/js/convert.js', '/js/lib/underscore.js', '/js/util.js' ], function ( spectrumdata, convert, _, util ) {

    //OPTIONS
    var BACKGROUND_COLOR = 'BLACK';
    var FONT_FAMILY = 'arial';
    var GRID_COLOR = '#ccc';
    var AVERAGE_GRAPH_COLOR = 'yellow';
    var AVERAGE_GRAPH_WIDTH = 3;
    var PEAK_GRAPH_COLOR = '#859c2c';
    var PEAK_GRAPH_WIDTH = 2;
    var CURSOR_COLOR = '#ff2233';
    var CURSOR_WIDTH = 2;
    var X_GRID = 10;
    var Y_GRID = 13;
    var PADDING = 80.5;
    var NUMBER_MARGIN = 10;
    var PEAK_DIAMOND_WIDTH = 10;
    var PEAK_DIAMOND_HEIGHT = 15;
    var PEAK_DIAMOND_COLOR = 'yellow';
    var CURSOR_CIRCLE_RADIOUS = 5;

    //variables
    var freqToPixel = new convert.RangeConvertion();
    var width_gr;
    var height_gr;
    var x_space;
    var y_space;
    var width;
    var height;
    var start;
    var stop;
    var center;
    var span;
    //the values from the data
    var data;
    var values;
    var canvas;
    var ctx;
    var cursorX;
    var freqConvertor;
    var amplConvertor;

    function init ( canvasElement ) {
        canvas = canvasElement;
        resize();
        //poll data from spectrumdata and draw it on a regular basis
        util.callEvery( 100, redraw );
    }

    /** clears the area */
    function clear() {
        ctx.clearRect( 0, 0, width, height );
    }

    /** draws the background */
    function background () {
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect( 0, 0, width, height );
    }

    /** draws the grid and the axis */
    function grid () {
        var x, y, x1, y1, x2, y2, gx, gy;
        ctx.lineWidth = 1;
        ctx.strokeStyle = GRID_COLOR;
        ctx.beginPath();
        for ( gx = 0; gx <= X_GRID; gx++ ) {
            x = ( gx * x_space ) + PADDING;
            y1 = PADDING;
            y2 = height - PADDING;
            ctx.moveTo( x, y1 );
            ctx.lineTo( x, y2 );
        }
        for ( gy = 0; gy <= Y_GRID; gy++ ) {
            x1 = PADDING;
            x2 = width - PADDING;
            y = ( gy * y_space ) + PADDING;
            ctx.moveTo( x1, y );
            ctx.lineTo( x2, y );
        }
        ctx.stroke();
        //draw a frame around the grid area
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo( PADDING, PADDING );
        ctx.lineTo( width - PADDING, PADDING );
        ctx.lineTo( width - PADDING, height - PADDING );
        ctx.lineTo( PADDING, height - PADDING );
        ctx.closePath();
        ctx.stroke();
    }

    /** put the numbers in the grid */
    function gridNums () {
        ctx.fillStyle = GRID_COLOR;
        for ( var gy = 0; gy <= Y_GRID; gy++ ) {
            ctx.textAlign = 'right';
            ctx.fillText( gy ? ( gy * -10 ).toString() : 'dBm', PADDING - NUMBER_MARGIN, PADDING + ( gy * y_space ) );
            //ctx.textAlign = 'left';
            //ctx.fillText( ( gy * -10 ).toString(), width - PADDING + NUMBER_MARGIN, PADDING + ( gy * y_space ) );
        }
        //put the start, stop, center and span on the grid
        ctx.textAlign = 'left';
        ctx.fillText( 'Start: ' + convert.hz2mhz( start, true ), NUMBER_MARGIN, height - NUMBER_MARGIN);
        var timeOffset = (( convert.epoch2date( data[ 'completed' ] * 1000 ) ).getTimezoneOffset()) *60000;
        ctx.fillText( convert.date2slashedDDMMYYYY( convert.epoch2date(( data[ 'completed' ] * 1000 ) + timeOffset )), NUMBER_MARGIN, PADDING / 2);
        ctx.textAlign = 'right';
        ctx.fillText( spectrumdata.getLink() === 'UL' ? 'Uplink' : 'Downlink' , width - NUMBER_MARGIN, PADDING / 2 );
        ctx.fillText( 'Stop: ' + convert.hz2mhz( stop, true ), width - NUMBER_MARGIN, height - NUMBER_MARGIN);
        ctx.textAlign = 'center';
        ctx.fillText( 'Center: ' + convert.hz2mhz( center , true ), width / 2, height - NUMBER_MARGIN);
        ctx.fillText( 'Span: ' + convert.hz2mhz( span, true ) + ' / Raster: ' + data[ 'sra' ] + ' kHz', width / 2, PADDING / 2 );
    }

    /** draw the frequency data */
    function frequencies() {
        if ( values && values.length >= 2 ) {
            ctx.lineJoin = 'round';

            //draw the peak data
            ctx.lineWidth = PEAK_GRAPH_WIDTH;
            ctx.strokeStyle = PEAK_GRAPH_COLOR;
            ctx.beginPath();
            ctx.moveTo( freqConvertor.convert( start ), amplConvertor.convert( values[ 0 ] ) );
            for ( var i = 0; i < values.length; i++ ) {
                ctx.lineTo( freqConvertor.convert( values[ i ].freq ), amplConvertor.convert( values[ i ].peak ) );
            }
            ctx.stroke();

            //draw the average data on top of that
            ctx.lineWidth = AVERAGE_GRAPH_WIDTH;
            ctx.strokeStyle = AVERAGE_GRAPH_COLOR;
            ctx.beginPath();
            ctx.moveTo( freqConvertor.convert( start ), amplConvertor.convert( values[ 0 ] ) );
            for ( var i = 0; i < values.length; i++ ) {
                ctx.lineTo( freqConvertor.convert( values[ i ].freq ), amplConvertor.convert( values[ i ].level ) );
            }
            ctx.stroke();
        }
    }

    /** sets the cursor
     * @param [cursorPosX] {number} the cursor position
     */
    function setCursor ( cursorPosX ) {
        if ( cursorPosX !== cursorX ) {
            if ( cursorPosX ) {
                cursorX = convert.putInLimits( cursorPosX, PADDING, width - PADDING );
            } else {
                cursorX = null;
            }
            redraw();
        }
    }

    /** draws the current peak */
    function drawPeakDiamond () {
        var maxIndex = spectrumdata.getCurrMaxIndex();
        if ( maxIndex > -1 ) {
            var freqX = freqConvertor.convert( data.values[ maxIndex].freq );
            var lvlY = amplConvertor.convert( data.values[ maxIndex ].level );
            ctx.lineWidth = CURSOR_WIDTH;
            ctx.strokeStyle = PEAK_DIAMOND_COLOR;
            ctx.beginPath();
            ctx.moveTo( freqX, lvlY );
            ctx.lineTo( freqX - PEAK_DIAMOND_WIDTH / 2, lvlY - PEAK_DIAMOND_HEIGHT / 2 );
            ctx.lineTo( freqX, lvlY - PEAK_DIAMOND_HEIGHT );
            ctx.lineTo( freqX + PEAK_DIAMOND_WIDTH / 2, lvlY - PEAK_DIAMOND_HEIGHT / 2 );
            ctx.lineTo( freqX, lvlY );
            ctx.closePath();
            ctx.stroke();
        }
    }


    /** draws the cursor line under the mouse */
    function cursor () {
        if ( cursorX ) {
            var closestPoint = spectrumdata.getClosestValue( freqConvertor.reverse( cursorX ));
            var timeOffset = (convert.epoch2date( closestPoint.time * 1000 )).getTimezoneOffset() *60000;
            if ( closestPoint ) {

                var x = freqConvertor.convert( closestPoint.freq );
                var yLevel = amplConvertor.convert( closestPoint.level );
                var yPeak = amplConvertor.convert( closestPoint.peak );

                ctx.lineWidth = CURSOR_WIDTH;
                //the peak line if necessary
                if ( yPeak !== yLevel ) {
                    ctx.strokeStyle = PEAK_GRAPH_COLOR;
                    ctx.fillStyle = PEAK_GRAPH_COLOR;
                    ctx.beginPath();
                    ctx.moveTo( PADDING, yPeak );
                    ctx.lineTo( width - PADDING + NUMBER_MARGIN, yPeak );
                    ctx.stroke();
                    //the cursor circle
                    ctx.beginPath();
                    ctx.arc( x, yPeak, CURSOR_CIRCLE_RADIOUS, 0, 2 * Math.PI, false);
                    ctx.fill();
                    //number for the average data
                    ctx.textAlign = 'left';
                    ctx.fillText( closestPoint.peak.toFixed( 1 ), width - PADDING + NUMBER_MARGIN, yPeak );
                }
                //peak date and time
                ctx.fillStyle = PEAK_GRAPH_COLOR;
                ctx.textAlign = 'center';
                ctx.fillText( convert.epoch2slashedDDMMYYYY( closestPoint.time * 1000 + timeOffset), x, PADDING - NUMBER_MARGIN );
                //the line for average data
                ctx.strokeStyle = AVERAGE_GRAPH_COLOR;
                ctx.fillStyle = AVERAGE_GRAPH_COLOR;
                ctx.beginPath();
                ctx.moveTo( PADDING, yLevel );
                ctx.lineTo( width - PADDING + NUMBER_MARGIN, yLevel );
                ctx.stroke();
                //the cursor circle
                ctx.beginPath();
                ctx.arc( x, yLevel, CURSOR_CIRCLE_RADIOUS, 0, 2 * Math.PI, false);
                ctx.fill();
                //number for the average data
                ctx.textAlign = 'left';
                ctx.fillText( closestPoint.level.toFixed( 1 ), width - PADDING + NUMBER_MARGIN, yLevel );
                //the frequency for the cursor line
                ctx.textAlign = 'center';
                ctx.fillText( convert.hz2mhz( closestPoint.freq, true ), x, height - ( PADDING / 2));
                //the vertical peak like
                ctx.strokeStyle = CURSOR_COLOR;
                ctx.beginPath();
                ctx.moveTo( x, PADDING );
                ctx.lineTo( x, height - PADDING + NUMBER_MARGIN );
                ctx.stroke();
            }
        }
    }

    /** refreshes the view */
    function redraw() {
        if ( !ctx ) {
            //if the canvas context isn't there, try to re-adjust it
            resize();
            return;
        }
        clear();
        data = spectrumdata.getData();
        if ( data && data[ 'completed' ] && data[ 'completed' ] !== 0 && data[ 'values' ] && data[ 'values' ].length ) {
            background();
            values = data.values;
            start = values[0].freq;
            stop = values[ values.length - 1 ].freq;
            center = ( start + stop ) / 2;
            span = stop - start;

            freqConvertor = new convert.RangeConvertion( start, stop, PADDING, width - PADDING );
            amplConvertor = new convert.RangeConvertion( -130, 0, height - PADDING, PADDING );

            grid();
            gridNums();
            frequencies();
            drawPeakDiamond();
            cursor();
        }
    }

    function resize () {
        ctx = canvas.getContext( '2d' );
        width = canvas.width;
        height = canvas.height;
        //noinspection JSUnresolvedVariable
        ctx.font = ( Math.min( width, height ) / 40 ) + 'px ' + FONT_FAMILY;
        //width and height of the grid
        width_gr = width - 2 * PADDING;
        height_gr = height - 2 * PADDING;
        //the spacing between lines in grid
        x_space = width_gr / X_GRID;
        y_space = height_gr / Y_GRID;
        //the converter
        freqToPixel.setDst( PADDING, width - PADDING );
        //set the -l parameter of spectrumdata command to have "lagom" number of elements. 5 means get data for every 5 pixel in the diagram
        spectrumdata.setMax( freqToPixel.getDstSpan() / 5 );
        redraw();
    }

    /**
     *
     * @param fileName a file name without extension. This name will be suggested to the user when saving
     */
    function save ( fileName ) {
        if ( !ctx ) {
            axellPopUp( 'The spectrum analyzer is not initialized yet' );
            return;
        }
        fileName = fileName || 'spectrum analyzer';
        //toBlob() is a method that's defined in filesaver.js that is included in the index.html
        //noinspection JSUnresolvedFunction
        canvas.toBlob( function( blob ) {
            var timestamp = convert.date2compact( convert.epoch2date( util.getEpoch() ) ) || '';
            saveAs( blob, fileName + ' ' + timestamp + '.png' );
        });
        //apparently the above call messes with the native canvas object. so call the resize() method to set things up again
        resize();
    }

    return {
        init : init,
        redraw : redraw,
        resize : resize,
        setCursor : setCursor,
        save : save
    };
});
