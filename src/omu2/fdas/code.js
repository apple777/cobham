/**
 * These constants are used for resolving the strings in MDL to the frequencies in MHz
 */
var MDL_FREQ = {
	"07":"700",
	"08":"850",
	"09":"900",
	"17":"1700",
	"18":"1800",
	"19":"1900",
	"21":"2100",
	"22":"2200",
	"26":"2600"
}

var MDL_UL = {
	"U":" Upper",
	"u":" Upper",
	"L":" Lower",
	"l":" Lower"
}
//** descriptor for how to parse the result of GET FDS ALL
var FDS_ALL_DESC = [
	{
		name:"NoOfBands",
		type:"charr"
	},
	{
		name:"FAM",
		type:"charr"
	},
	{
		name:"RFMUTE-DISABLE",
		type:"charr"
	},
	{
		name:"FAS",
		type:"charr"
	},
	{
		name:"FAU",
		type:"charr"
	},
	{
		name:"AUS",
		type:"charr"
	},
	{
		name:"ATU1",
		type:"int"
	},
	{
		name:"ATU2",
		type:"int"
	},
	{
		name:"ATU3",
		type:"int"
	},
	{
		name:"ATU4",
		type:"int"
	},
	{
		name:"ATD1",
		type:"int"
	},
	{
		name:"ATD2",
		type:"int"
	},
	{
		name:"ATD3",
		type:"int"
	},
	{
		name:"ATD4",
		type:"int"
	},
	{
		name:"AUO",
		type:"str"
	},
	{
		name:"LVU1",
		type:"str"
	},
	{
		name:"LVU2",
		type:"str"
	},
	{
		name:"LVU3",
		type:"str"
	},
	{
		name:"LVU4",
		type:"str"
	},
	{
		name:"LVD1",
		type:"str"
	},
	{
		name:"LVD2",
		type:"str"
	},
	{
		name:"LVD3",
		type:"str"
	},
	{
		name:"LVD4",
		type:"str"
	},
	{
		name:"OLC",
		type:"str"
	},
	{
		name:"FCO",
		type:"charr"
	},
	{
		name:"CRC",
		type:"charr"
	},
	{
		name:"FDT",
		type:"charr"
	},
	{
		name:"FDP",
		type:"charr"
	},
	{
		name:"FRP",
		type:"charr"
	},
	{
		name:"FRX",
		type:"charr"
	},
	{
		name:"FTX",
		type:"charr"
	},
	{
		name:"FSZ",
		type:"charr"
	},
	{
		name:"FD",
		type:"charr"
	},
	{
		name:"FSU",
		type:"charr"
	},
	{
		name:"FSD",
		type:"charr"
	},
	{
		name:"FSM",
		type:"charr"
	},
	{
		name:"FUM",
		type:"charr"
	},
	{
		name:"FDM",
		type:"charr"
	},
	{
		name:"OCM",
		type:"charr"
	}
];

//** this is a utility function that is used to show or hide an led based on a "0" or "1" value (that comes from AUS for example)
function showHideLed ( query, status ) {
	switch( status ) {
	case "0": $( query ).hide(); setLedColor( query, "0" ); break;
	case "1": $( query ).show(); break;
	default: console.debug( "Invalid status parameter passed to showHideLed(): " + quote( status ) ); break;
	}
}

//** Processes the result of GET FDS ALL
function processFdsAll ( out, err ) {
	if ( err ) {
		console.error( "Could not read FDS ALL: " + err );
		return;
	}
	var result = parsePackage( out, FDS_ALL_DESC );
	if ( result == null ) {
		console.debug( "Could not parse the output of FDS ALL: " + out );
		return;
	}

	//single LEDs in the general panel
	setLedColor( "#rcv-optical-level-led", result.FRX );
	setLedColor( "#transmitted-optical-level-led", result.FTX );
	setLedColor( "#pilot-tone-gen-synth-led", result.FSZ );
	setLedColor( "#rcv-pilot-tone-lvl-led", result.FRP );
	setLedColor( "#opto-matching-led", result.OCM );
	
	//attenuations
	$( "#band1-ul-attenuation-select" ).val( result.ATU1 );
	$( "#band2-ul-attenuation-select" ).val( result.ATU2 );
	$( "#band3-ul-attenuation-select" ).val( result.ATU3 );
	$( "#band4-ul-attenuation-select" ).val( result.ATU4 );

	$( "#band1-dl-attenuation-select" ).val( result.ATD1 );
	$( "#band2-dl-attenuation-select" ).val( result.ATD2 );
	$( "#band3-dl-attenuation-select" ).val( result.ATD3 );
	$( "#band4-dl-attenuation-select" ).val( result.ATD4 );
	
	//power buttons
	setPwrBtn( "#band1-ul-power-pbtn", result.LVU1 );
	setPwrBtn( "#band2-ul-power-pbtn", result.LVU2 );
	setPwrBtn( "#band3-ul-power-pbtn", result.LVU3 );
	setPwrBtn( "#band4-ul-power-pbtn", result.LVU4 );

	setPwrBtn( "#band1-dl-power-pbtn", result.LVD1 );
	setPwrBtn( "#band2-dl-power-pbtn", result.LVD2 );
	setPwrBtn( "#band3-dl-power-pbtn", result.LVD3 );
	setPwrBtn( "#band4-dl-power-pbtn", result.LVD4 );
	
	//optoloss compensation
	$("#optoloss-compensation-val").text( result.OLC );
		
	//board comm	
	setLedColor( "#board1-comm-led", result.FCO[0] );
	setLedColor( "#board2-comm-led", result.FCO[1] );

	//board crc
	setLedColor( "#board1-crc-led", result.CRC[0] );
	setLedColor( "#board2-crc-led", result.CRC[1] );

	//board psu
	setLedColor("#board1-psu-led",result.FDP[0]);
	setLedColor("#board2-psu-led",result.FDP[1]);
	
	//board temp
	setLedColor("#board1-temp-led",result.FDT[0]);
	setLedColor("#board2-temp-led",result.FDT[1]);
	
	//band sysmute
	setLedColor("#band1-sysmute-led",result.FSM[0]);
	setLedColor("#band2-sysmute-led",result.FSM[1]);
	setLedColor("#band3-sysmute-led",result.FSM[2]);
	setLedColor("#band4-sysmute-led",result.FSM[3]);

	//band ul usermute
	setLedColor("#band1-ul-usermute-led",result.FUM[0]);
	setLedColor("#band2-ul-usermute-led",result.FUM[1]);
	setLedColor("#band3-ul-usermute-led",result.FUM[2]);
	setLedColor("#band4-ul-usermute-led",result.FUM[3]);

	//band dl usermute
	setLedColor("#band1-dl-usermute-led",result.FDM[0]);
	setLedColor("#band2-dl-usermute-led",result.FDM[1]);
	setLedColor("#band3-dl-usermute-led",result.FDM[2]);
	setLedColor("#band4-dl-usermute-led",result.FDM[3]);
	
	//are the saturaions shown? only if all four are disabled should you disable the row otherwise display it
	if( result.AUS[0] === "0" && result.AUS[1] === "0" && result.AUS[2] === "0" && result.AUS[3] === "0" ) {
		//hide the entire row
		$( "#ul-ampsat" ).hide();
		//turn all leds off
		setLedColor( "#band1-ul-ampsat-led", "0" );
		setLedColor( "#band2-ul-ampsat-led", "0" );
		setLedColor( "#band3-ul-ampsat-led", "0" );
		setLedColor( "#band4-ul-ampsat-led", "0" );
	} else {
		if ( com.axl.page.detail.isAdvanced() ) {
			$( "#ul-ampsat" ).show();
		}
		//set the led visibilities individually
		showHideLed( "#band1-ul-ampsat-led", result.AUS[0] );
		showHideLed( "#band2-ul-ampsat-led", result.AUS[1] );
		showHideLed( "#band3-ul-ampsat-led", result.AUS[2] );
		showHideLed( "#band4-ul-ampsat-led", result.AUS[3] );
		//band ul ampsat
		setLedColor( "#band1-ul-ampsat-led", result.FSU[0] );
		setLedColor( "#band2-ul-ampsat-led", result.FSU[1] );
		setLedColor( "#band3-ul-ampsat-led", result.FSU[2] );
		setLedColor( "#band4-ul-ampsat-led", result.FSU[3] );
	}

	//band dl ampsat
	setLedColor( "#band1-dl-ampsat-led", result.FSD[0] );
	setLedColor( "#band2-dl-ampsat-led", result.FSD[1] );
	setLedColor( "#band3-dl-ampsat-led", result.FSD[2] );
	setLedColor( "#band4-dl-ampsat-led", result.FSD[3] );
	
	//band dl output
	setLedColor("#band1-dl-output-led",result.FD[0]);
	setLedColor("#band2-dl-output-led",result.FD[1]);
	setLedColor("#band3-dl-output-led",result.FD[2]);
	setLedColor("#band4-dl-output-led",result.FD[3]);
	
	//Take care of overall leds
	setLedColor( "#band1-overall-led", $( "#bandstable .band1 .led.red:not(.round)" ).length > 0 ? "red" : "green" );
	setLedColor( "#band2-overall-led", $( "#bandstable .band2 .led.red:not(.round)" ).length > 0 ? "red" : "green" );
	setLedColor( "#bands-overall-led", getLedColor( "#band1-overall-led", "string" ) == "red" || getLedColor( "#band1-overall-led", "string" ) == "red" ? "red" : "green" );
	setLedColor( "#general-overall-led", $( "#generaltable .led.red" ).length > 0 ? "red" : "green" );

	//expand rows with erroneus LEDs in them
	$( "#bandstable tr" ).each( function ( index, element) {
		if ( $(this).find( ".led.red:not(.round)" ).length > 0 ) {
			$(this).show();
		}
	});
	
	if ( getLedColor( "#general-overall-led", "string" ) == "red" ) {
		$( "#generaltable .row2" ).show();
	}
}

//** descriptor for how to parse the result of GET FDS SLV
var FDS_SLV_DESC = [
	{
		name:"OPL_UL_1",
		type:"str"
	},
	{
		name:"OPL_UL_2",
		type:"str"
	},
	{
		name:"OPL_UL_3",
		type:"str"
	},
	{
		name:"OPL_UL_4",
		type:"str"
	},
	{
		name:"OPL_DL_1",
		type:"str"
	},
	{
		name:"OPL_DL_2",
		type:"str"
	},
	{
		name:"OPL_DL_3",
		type:"str"
	},
	{
		name:"OPL_DL_4",
		type:"str"
	},
	{
		name:"Sat_UL",
		type:"charr"
	},
	{
		name:"Sat_DL",
		type:"charr"
	},
	{
		name:"Pwr_Master",
		type:"str"
	},
	{
		name:"Pwr_Slave",
		type:"str"
	},
	{
		name:"Temp_Master",
		type:"str"
	},
	{
		name:"Temp_Slave",
		type:"str"
	},
	{
		name:"RX_Opto",
		type:"str"
	},
	{
		name:"RX_Pilot",
		type:"str"
	}
];

//** This is a utility function that is used in processFdsSlv for setting the icon for the Saturation Status
function setSatIcon ( selector, ch ) {
	switch ( ch ) {
	case "0":
		$( selector ).removeClass( "saturated" ).addClass( "unsaturated" ).attr( "title", "Amplifier is working normally" );
		break;
	case "1":
		$( selector ).removeClass( "unsaturated" ).addClass( "saturated" ).attr( "title", "Amplifier is saturated" );
		break;
	case "-":
		$( selector ).removeClass( "saturated unsaturated" ).attr( "title", "Amplifier saturation status is not determined" );
		break;
	default:
		$( selector ).removeClass( "saturated unsaturated" ).attr( "title", "Invalid amplifier saturation status character: " + quote( ch ) );
		console.debug( "Cannot understand the character passed to setSatIcon(): " + quote( ch ) );
	}
}

//** Process the result of FDS SLV command
function processFdsSlv ( out, err ) {
	if ( err ) {
		console.error( "Could not read FDS SLV: " + err );
		return;
	}
	var result = parsePackage( out, FDS_SLV_DESC );
	if ( result == null ) {
		console.error( "Could not parse the output of FDS SLV: " + out );
		return;
	}

	//received level
	$( "#rcv-optical-level-val" ).text( result.RX_Opto );
	
	//temperature
	$( "#board1-temp-val" ).text( result.Temp_Master );
	$( "#board2-temp-val" ).text( result.Temp_Slave  );

	//power levels
	$( "#board1-psu-led" ).attr( "title", result.Pwr_Master + " V" );
	$( "#board2-psu-led" ).attr( "title", result.Pwr_Slave  + " V" );
	
	//uplink output
	$( "#band1-ul-output-val" ).text( result.OPL_UL_1 );
	$( "#band2-ul-output-val" ).text( result.OPL_UL_2 );
	$( "#band3-ul-output-val" ).text( result.OPL_UL_3 );
	$( "#band4-ul-output-val" ).text( result.OPL_UL_4 );
	
	$( "#band1-dl-output-val" ).text( result.OPL_DL_1 );
	$( "#band2-dl-output-val" ).text( result.OPL_DL_2 );
	$( "#band3-dl-output-val" ).text( result.OPL_DL_3 );
	$( "#band4-dl-output-val" ).text( result.OPL_DL_4 );

	//received pilot tone level
	$( "#rcv-pilot-tone-lvl-led" ).attr( "title", result.RX_Opto + "dBm");
	
	//amplifier saturation value
	setSatIcon( "#band1-ul-satval-led", result.Sat_UL[0] );
	setSatIcon( "#band2-ul-satval-led", result.Sat_UL[1] );
	setSatIcon( "#band3-ul-satval-led", result.Sat_UL[2] );
	setSatIcon( "#band4-ul-satval-led", result.Sat_UL[3] );
	setSatIcon( "#band1-dl-satval-led", result.Sat_DL[0] );
	setSatIcon( "#band2-dl-satval-led", result.Sat_DL[1] );
	setSatIcon( "#band3-dl-satval-led", result.Sat_DL[2] );
	setSatIcon( "#band4-dl-satval-led", result.Sat_DL[3] );
}

//** processes the result of GET FDS MDL
function processFdsMdl ( out, err ) {
	if ( err ) {
		console.error( "Error getting MDL" );
		return;
	}
	$( "#fiberdas-mdl-val" ).text( out );
	/* Spec:
	Reply for dual band units:
	MBF-20-D-<PowerRange1><Band1>[SubBand1]-<PowerRange2><Band2>[SubBand2]-S
	MBF-20-Q-<PowerRange1><Band1>[SubBand1]-<PowerRange2><Band2>[SubBand2][-<PowerRange3><Band3>[SubBand3]-<PowerRange4><Band4>[SubBand4]]-S
	*/
	var e = out.split( "-" );
	if ( e === null || e[0] !== "MBF" || e[1] !== "20" )  {
		console.error( "Could not parse the output of MDL: " + out );
		return;
	}
	//by default assume 2 bands
	var bands = null;
	switch ( e[2] ) {
        case "d":
        case "D":
            $( ".board2" ).hide();
            bands = 2;
            break;
        case "q":
        case "Q":
            $( ".board2" ).show();
            bands = 4;
            break;
        default:
            console.error( 'Could not parse the last part of the output of the MDL: ' + e[2] );
            return;
	}

	if ( bands === null ) {
		console.debug( "Could not find the number of bands from MDL " );
		return;
	}
	
	for ( var i = 1; i <= 4; i++ ) {
		var bandDescriptor = e[ i + 2 ];
		//if there is no band descriptor for this band or if it is XXXX, just fill it in with some generic stuff
		if ( !bandDescriptor || bandDescriptor === "XXXX" || i > bands ) {
			$( "#board" + i + "-prange-val" ).text( "?" );
			$( "#board" + i + "-freq-val" ).text( "?");
		} else {
			var b = bandDescriptor.match( /(\w\w)(\w\w)([LU]*)/i );
			if ( !b ) {
				console.debug( "Could not parse the band descriptor: " + bandDescriptor );
				$( "#board" + i + "-prange-val" ).text( "." );
				$( "#board" + i + "-freq-val" ).text(  "." );
			} else {
				var prange = b[1] ;
				var freq   = MDL_FREQ[ b[2] ] || ( b[2] + "00" );
				var ul     = MDL_UL[ b[3] ] || "";
				$( "#board" + i + "-prange-val" ).text( prange );
				$( "#board" + i + "-freq-val" ).text(  freq + " " + ul );
			}
		}
	}
}

//** TODO: REMOVE THIS OLD FUNCTION. processes the result of GET FDS MDL
function processFdsMdlOld ( out, err ) {
	if ( err ) {
		console.error( "Error getting MDL" );
		return;
	}
	$( "#fiberdas-mdl-val" ).text( out );
	/* Spec:
	Reply for dual band units:
	MBF-20-D-<PowerRange1><Band1>[SubBand1]-<PowerRange2><Band2>[SubBand2]-S
	*/
	var e = out.match( /MBF-20-D-(\w\w)(\w\w)([LU]*)-(\w\w)(\w\w)([LU]*)/i );
	if ( e != null ) {
		//it is a dual band module. hide column 3 and 4
		$( ".board2" ).hide();
		
		$( "#board1-prange-val" ).text( e[1] );
		$( "#board2-prange-val" ).text( e[4] );
		$( "#board3-prange-val" ).text( "-" );
		$( "#board4-prange-val" ).text( "-" );
		$( "#board1-freq-val" ).text( MDL_FREQ[e[2]] + ( e[3] ? MDL_UL[e[3]] : "" ) );
		$( "#board2-freq-val" ).text( MDL_FREQ[e[5]] + ( e[6] ? MDL_UL[e[6]] : "" ) );
		$( "#board3-freq-val" ).text( "-" );
		$( "#board4-freq-val" ).text( "-" );
	} else {
		/* Spec:
		Reply for quad band units:
		MBF-20-Q-<PowerRange1><Band1>[SubBand1]-<PowerRange2><Band2>[SubBand2][-<PowerRange3><Band3>[SubBand3]-<PowerRange4><Band4>[SubBand4]]-S
		*/
		e = out.match( /MBF-20-Q-(\w\w)(\w\w)([LU]*)-(\w\w)(\w\w)([LU]*)-(\w\w)(\w\w)([LU]*)-(\w\w)(\w\w)([LU]*)/i );
		if ( e != null ) {
			//it's a quad band module. show column 3 and 4
			$( ".board2" ).show();
			
			$( "#board1-prange-val" ).text( e[1] );
			$( "#board2-prange-val" ).text( e[4] );
			$( "#board3-prange-val" ).text( e[7] );
			$( "#board4-prange-val" ).text( e[10] );
			$( "#board1-freq-val" ).text( MDL_FREQ[e[2]] + ( e[3] ? MDL_UL[e[3]] : "" ) );
			$( "#board2-freq-val" ).text( MDL_FREQ[e[5]] + ( e[6] ? MDL_UL[e[6]] : "" ) );
			$( "#board3-freq-val" ).text( MDL_FREQ[e[8]] + ( e[12] ? MDL_UL[e[12]] : "" ) );
			$( "#board4-freq-val" ).text( MDL_FREQ[e[11]] + ( e[15] ? MDL_UL[e[15]] : "" ) );
		} else {
			console.error( "Could not parse the output of GET MDL: " + out );
		}
	}
}
/**
 * This function is a workaround that is used in processFdsPdn.
 * It tries to convert its parameter to a number and divide it by 10 and return the result.
 * If it fails, it just returns the parameter intact. (it's useful when s is something like "-" )
 */
function div10workAround ( s ) {
	var n = parseInt( s );
	if ( isNaN( n ) ) {
		return s;
	}
	if ( n % 10 == 0 ) {
		return ( n / 10 ).toString() + ".0";
	} else {
		return n / 10;
	}
}
//**processes the output of GET FDS PDN
function processFdsPdn ( out, err ) {
	if ( err ) {
		console.error( "Could not read FDS SLV: " + err );
		return;
	}
	var e = out.split( " " );
	if ( e == null || e.length != 4 ) {
		console.error( "Could not extract 4 elements from the output of GET PDN: " + quote( out ) );
		return;
	}
	$( "#band1-dl-nominalpwr-val" ).text( div10workAround( e[0] ) );
	$( "#band2-dl-nominalpwr-val" ).text( div10workAround( e[1] ) );
	$( "#band3-dl-nominalpwr-val" ).text( div10workAround( e[2] ) );
	$( "#band4-dl-nominalpwr-val" ).text( div10workAround( e[3] ) );
}

//** event handler for TAG
function onEditTag () {
	//if the button is disabled, do nothing
	if ( !getButtonEnDis( "#edit-tag-btn" ) ) {
		return;
	}
	var currTag = $.trim( $( "#fiberdas-tag-val" ).text() );
	if ( currTag === "..." ) {
		axellPopUp( "Tag is not loaded yet. Please try again later or refresh the page." );
		return;
	}
	var newTag = prompt( "Edit tag", currTag );
	if ( newTag === null ) {
		//user pressed cancel on the prompt dialogue
		return;
	}
	newTag = $.trim( newTag );
	if ( /["']/.test( newTag ) ) {
		axellPopUp( "Tag cannot contain quotation characters. \" \'" );
		return;
	}	
	//ok now the checks are passed
	setButtonEnDis( "#edit-tag-btn", false );
	$( "#fiberdas-tag-val" ).text( "..." );
	axshCall( _N( 'set fds tag "' + newTag + '"' ), function ( out, err ) {
		setButtonEnDis( "#edit-tag-btn", true );
		if ( err ) {
			$( "#fiberdas-tag-val" ).text( currTag );
			axellPopUp( "Failed to set tag: " + err );
		} else {
			$( "#fiberdas-tag-val" ).text( newTag );
		}
	});
}

//** Event handler for power buttons
function onPowerBtn ( element, status ) {
	var id = element.attr("id");
	if ( !id ) {
		console.error( "Power button doesn't have an id" );
		return;
	}
	var e = id.match( /band(\d)-(\w\w)-power-pbtn/ );
	if ( !e ) {
		console.error( "Could not parse the id of the power button" );
		return;
	}
	var n = e[1];
	var attr = null;
	switch ( e[2] ) {
		case "ul": attr = "lvu"; break;
		case "dl": attr = "lvd"; break;
		default: console.debug( "Invalud value for uplink/downlink section of the power button id: " + quote( e[2] ) ); return;
	}
	var val = status ? "0" : "1";
	element.pwrBtnAxl("");
	axshCall( _N( "set fds " + attr + " " + n + " " + val ), function ( out, err ) {
		if ( err ) {
			axellPopUp( "Failed to set the power: " + err );
		} else {
			//success!
			console.log( "Power successfully set to " + val );
			element.pwrBtnAxl( status ? "off" : "on" );
		}		
	});
}

//**this event listner is fired when the optical loss adjustment button is clicked
function onOla () {
	//if the button is disabled, optoloss adjustment is already in progress
	if ( !getButtonEnDis( "#optoloss-adjustment-btn" ) ) {
		return;
	}
	setButtonEnDis( "#optoloss-adjustment-btn", false );
	axshCall( _N( "act fds ola" ), function ( out, err ) {
		setButtonEnDis( "#optoloss-adjustment-btn", true );
		if ( err ) {
			axellPopUp( "Failed to adjust optical loss: " + err );
		} else {
			console.log( "Optoloss adjustment finished successfully" );
		}
	});
}

//** Event handler for RF Adjust buttons
function onRfAdjust ( chainNumber ) {
	var id = "#band" + chainNumber + "-rfadjustment-btn";
	setButtonEnDis( id, false );
	axshCall( _N( "ACT FDS RFSETUP START " + chainNumber ), function ( out, err ) {
		setButtonEnDis( id, true );
		if ( err ) {
			axellPopUp( "Failed to adjust RF: " + err );
		} else {
			console.log( "RF adjustment finished successfully" );
		}
	});
}

//** event handler for when an attenuation <select> element is changed
function onChangeAtt ( ud, chain ) {
	var id = "#band" + chain + "-" + ud + "-attenuation-select";
	$( id ).prop( "disabled", true );
	var attr = null;
	switch ( ud ) {
		case "ul":attr = "atu"; break;
		case "dl":attr = "atd"; break;
		default: console.debug( "Invalid ud parameter was passed to onChangeAtt(): " + ud );return;
	}
	var val = $( id ).val();
	axshCall( _N( "set fds " + attr + " " + chain + " " + val ), function ( out, err ) {
		$( id ).prop( "disabled", false );
		if ( err ) {
			axellPopUp( "Failed to set attenuation: " + err );
			//get the previous value and show it on the <select>
			axshCall( _N( "get " + attr + " " + chain ), function ( out, err ) {
				if ( !err ) {
					$( id ).val( out );
				}
			});
		} else {
			console.log( "Attenuation set successfully" );
		}
	});
}

/**
 * This runs when the document is loaded and ready
 */
$(document).ready(function(e) {
	$(".powerbutton").pwrBtnAxl( "onchange" , onPowerBtn );
	basicMode();
	/*{{demo code
	setStatus( "This is demo" );
	$(".led").removeClass("grey").addClass("green");
	$(".powerbutton").addClass("on");
	$("#fiberdastag").val("Sample Tag");
	$("#fiberdasmodel").text("FiberDAS");
	$("#fiberdasid").text("00-00-0000");
	$("select.attenuation").each(function(index, element) {
		for(var i=0;i<=21;i+=3){
			var option=$(document.createElement("option")).val(i).text(i);
			$(this).append(option);			
		}
	});
	$("div.numerical span.value").each(function(index, element) {
		$(this).text(rnd(15));
	});
	*/
	
	//put the default attenuation values
	$("select.attenuation").each(function(index, element) {
		for(var i=0;i<=15;i+=1){
			var option=$(document.createElement("option")).val(i).text(i);
			$(this).append(option);			
		}
	});
	
	//TODO: REMOVE THE FOLLOWING LINE. the animation effect on the saturation icons
	//setInterval( '$( ".saturation-yes" ).toggleClass( "anim" )', BLINK_DELAY );

	//now start the GET ALL command
	axshCallInterval( sec(  6 ),_N("get fds all"),processFdsAll);
	axshCallInterval( sec(  5 ),_N("get fds slv"),processFdsSlv);
	axshCallInterval( sec( 10 ),_N("get fds pdn"),processFdsPdn);
	axshCallInterval( sec( 60 ),_N("get fds tag"), function ( out, err ) {
		if ( err ) {
			console.error( "Error getting TAG" );
		} else {
			$( "#fiberdas-tag-val" ).text( out );
		}
	});
    axshCallInterval( sec( 30 ),_N("get fds mdl"), processFdsMdl);
	axshCallInterval( sec( 60 ),_N("get fds rid"), function ( out, err ) {
		if ( err ) {
			console.error( "Error getting RID" );
		} else {
			$( "#fiberdas-rid-val" ).text( out );
		}
	});

});