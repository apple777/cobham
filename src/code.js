window.location.hred = '/target';
//{{OPTIONS
//** The interval for calculating roundtrip (in seconds). It will be shown as a tooltip on the software version
var ROUNDTRIP_CALC_INTERVAL = 10;
//}}OPTIONS
/*
$( document ).ajaxStart( function () {
    console.log( 'Starting an ajax request while no other request is in progress' );
}).ajaxStop( function () {
    console.log( 'Stopping the last ajax request in the queue' );
});
*/
//** Opens the requested url in the <iframe>
function showPage( url ) {
	$("iframe#contents").removeAttr( "src" ).attr( "src", url );
}

//** This event listener runs every time the iframe contents is loaded
$( '#contents').on( 'load', function () {
	setStatus();
});

//** this function calcuates the round trip and shows the result on screen
function calculateRoundTrip () {
	var t1 = new Date().getTime();
	//calculate the roundtrip every 10 seconds and show it as a caption on the software version
	axshCall( "roundtrip", function ( out, err ) {
		if ( err ) {
            $( '#roundtrip-icon' ).removeClass( 'r1 r2 r3 r4 r5').addClass( 'r0').attr( 'title', 'No connection to the server (' + err + ')' );
			console.warn( "Could not calculate roundtrip time: " + err );
		} else {
			var t2 = new Date().getTime();
			var delta = t2 - t1;
			console.log( "Roundtrip: " + delta + "ms" );
			$( '#roundtrip-icon' ).attr( "title", "Roundtrip: " + delta + "ms" );
            if ( delta < 750 ) {
                $( '#roundtrip-icon' ).removeClass( 'r0 r1 r2 r3 r4').addClass( 'r5');
            }else if ( delta < 2000 ) {
                $( '#roundtrip-icon' ).removeClass( 'r0 r1 r2 r3 r5').addClass( 'r4');
            }else if ( delta < 5000 ) {
                $( '#roundtrip-icon' ).removeClass( 'r0 r1 r2 r4 r5').addClass( 'r3');
            }else if ( delta < 10000 ) {
                $( '#roundtrip-icon' ).removeClass( 'r0 r1 r3 r4 r5').addClass( 'r2');
            }else {
                $( '#roundtrip-icon' ).removeClass( 'r0 r2 r3 r4 r5').addClass( 'r1');
            }
		}
		setTimeout( calculateRoundTrip, sec( ROUNDTRIP_CALC_INTERVAL ) );
	});
}
//-------------------------------------------------------------------------
/**
 * This runs when the page is loaded
 */
$(document).ready(function(e) {
	$("#popup-frame").hide();
	showPage( "/target/" );
	$( "#toplogo" ).attr( "title", "© " + (new Date()).getFullYear() + " Axell Wireless AB. All rights reserved.");
	axshCall("get swv",function(out,err){
		if(err){
			console.error("Could not get the software versions: "+err);
		}else{
			$("#software-version").text( "Ver: " + out);
		}
		setStatus();
	});
	calculateRoundTrip();
});
