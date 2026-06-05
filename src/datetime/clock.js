define([], function() {
    var FPS = 60;

    var PI = Math.PI;
    var PI2 = PI * 2;
    var PI_4 = PI / 4;
    var CONST = 2.25 * PI;

    var canvas;
    var width;
    var height;
    var width_2;
    var height_2;
    var diameter;
    var ctx;
    var intervalRet;

    //** initializes the clock
    function init ( id ) {
        canvas = document.getElementById( id );
        width = canvas.width;
        height = canvas.height;
        width_2 = width / 2;
        height_2 = height / 2;
        diameter = width / 2.5;
        ctx = canvas.getContext( '2d' );

        //redraws the clock face and hands based on the FPS
        if ( !intervalRet ) {
            intervalRet = setInterval( function () {
                drawFace();
                drawHands();
            },1000/FPS);
        }
    }

    //** draws the face of the clock
    function drawFace () {
        if ( drawFace.buffer ) {
            ctx.putImageData( drawFace.buffer, 0, 0 );
        } else {
            ctx.save();
            //draw the background
            ctx.fillStyle = '#EEE';
            ctx.beginPath();
            ctx.arc( width_2, height_2, diameter, 0, PI2 );
            ctx.fill();
            //draw the border
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 2;
            ctx.stroke();
            //draw the little border for ms
            ctx.strokeStyle = '#bbb';
            ctx.fillStyle = '#ddd';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc( width_2, height_2 + diameter * 0.4, diameter * 0.2, 0, PI2 );
            ctx.fill();
            ctx.stroke();
            //draw the numbers
            ctx.fillStyle = '#222';
            ctx.textAlign = 'center';
            ctx.font = '15px Arial';
            var numDiameter = diameter * 0.8;
            for ( var h = 1; h <= 12; h++ ) {
                var angel = PI - ( h * 2 * PI / 12 );
                var x = width_2 + numDiameter * Math.sin( angel );
                var y = height_2 + numDiameter * Math.cos( angel );
                ctx.fillText( h.toString(), x, y + 5 );
            }
            //draw the little minute bars
            var minStartDiameter = diameter * 0.9;
            var minEndDiameter = diameter * 1;
            ctx.strokeStyle = '#888';
            ctx.beginPath();
            for ( var m = 1; m <= 60; m++ ) {
                var angel = PI - ( m * 2 * PI / 60 );
                var x1 = width_2 + minStartDiameter * Math.sin( angel );
                var y1 = height_2 + minStartDiameter * Math.cos( angel );
                var x2 = width_2 + minEndDiameter * Math.sin( angel );
                var y2 = height_2 + minEndDiameter * Math.cos( angel );
                ctx.moveTo( x1, y1 );
                ctx.lineTo( x2, y2 );
            }
            ctx.stroke();
            drawFace.buffer = ctx.getImageData( 0, 0, width, height );
            ctx.restore();
        }
    }

    //draws one hand with a special length and angel
    function drawHand ( length, angel, centerX, centerY ) {
        ctx.beginPath();
        ctx.moveTo( centerX, centerY );
        angel = PI - angel;
        ctx.lineTo( centerX + length * Math.sin( angel ), centerY + length * Math.cos( angel ) );
        ctx.stroke();
    }

    //draws all hands
    function drawHands () {
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        var s = now.getSeconds();
        var ms = now.getMilliseconds();
        ctx.save();
        ctx.lineCap = 'round';

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#f00';
        drawHand( diameter * 0.2, ms * 2 * PI / 1000, width_2, height_2 + diameter * 0.4);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#111';
        drawHand( diameter * 0.6, ( h  + ( m / 60 ) )* 2 * PI / 12, width_2, height_2 );
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#222';
        drawHand( diameter * 0.8, ( m + s / 60 ) * 2 * PI / 60, width_2, height_2 );
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#f00';
        drawHand( diameter * 0.9, ( s + ms / 1000 ) * 2 * PI / 60, width_2, height_2 );

        ctx.restore();
    }

    //sets the time
    function setTime ( dateTime ) {
        var offset = dateTime.getTime() - ( new Date() ).getTime();
    }

    return {
        init : init,
        setTime : setTime
    }
});