//** enables or disables all the control on the page
function setEnDisControls( status ) {
	if ( status ) {
		setButtonEnDis( "#exec-btn", true );
		$( "#count-val" ).prop( "disabled", false );
		$( "#cmd-val" ).prop( "disabled", false );
	} else {
		setButtonEnDis( "#exec-btn", false );
		$( "#count-val" ).prop( "disabled", true );
		$( "#cmd-val" ).prop( "disabled", true );
	}
}

//** executes when the execution button is pressed
function onExec() {
	var progressBar = $( "#progress-bar" );
	if ( !getButtonEnDis( "#exec-btn") ) {
		return;
	}
	var cmd = $( "#cmd-val" ).val();
	var count = parseInt( $( "#count-val" ).val() );
	if ( count > 100 && !confirm( count + " is a big number. Are you sure?" ) ) {
		setEnDisControls( true );
		return;
	}
	setEnDisControls( false );
	$( "#progress-bar" ).show();
	progressBar.attr( "max", count );
	var counter = 1;
	var t1 = (new Date()).getTime();
	function run() {
		progressBar.val( counter );
		axshCall( cmd, function ( out, err ) {
			$( "#loop-val" ).text( counter + " of " + count );
			var t2 = (new Date()).getTime();
			var delta = t2 - t1;
			$( "#tot-time-val" ).text( delta + " ms" );
			$( "#avg-time-val" ).text( Math.round( delta / counter ) + " ms" );
			
			if ( err ) {
				axellPopUp( "Terminated because of error: " + err );
				setEnDisControls( true );
				return;
			}
			
			counter++;
			if ( counter <= count ) {
				run();
			} else {
				setEnDisControls( true );
				$( "#progress-bar" ).hide();
			}
		});
	}
	run();
}

//** event listener for the keypresses on the command box
function keyProcessor ( e ) {
	if ( ( e.which ? e.which : e.keyCode ) == 13 ) {
		onExec();
	}
}

//** This runs when the document is loaded and ready
$( document ).ready( function ( e ) {
    var params = getUrlParams();
	$( "#progress-bar" ).hide();
	if ( params.cmd ) {
		$( "#cmd-val" ).val( params.cmd );
	}
});