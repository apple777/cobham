/**
 * This function is called whenever a powerbutton is clicked
 * @param ud a string that can be either "u" for uplink or "d" for downlink
 */
function onPwrBtn ( ud ) {
	if ( DBG && ud !== "u" && ud !== "d" ) {
		console.debug("The ud parameter has an invalid value: " + quote( ud ) );
		return;
	}
	var id = "#" + ud + "l-amp-pwr";
	var cmd = "set lv" + ud + " ";
	var currState = getPwrBtn( id );
	switch ( currState ) {
	case true:
		//button is ON, the user wants to turn it OFF
		if ( !confirm( "Are you sure you want to turn off the Amplifier?" ) ) {
			//user didn't confirm, nothing to do
			return;
		}else{
			cmd += " 0";
			break;
		}
	case false:
		//button is off and user wants to turn it on
		cmd += " 1";
		break;
	default:
		//the status of the buton is unknown
		console.debug( "Invalid button state: " + currState );
		return;
	}
	axshCall( _N( cmd ), function ( out, err ) {
		if ( err ) {
			alert ( "Could not set the power: " + err );
			return;
		} else {
			var nextState = !currState;
			setPwrBtn( id, nextState );
			if( nextState ) {
				$( "#" + ud + "l-freq-indicator" ).removeClass( "off" );
			} else {
				$( "#" + ud + "l-freq-indicator" ).addClass( "off" );
			}
		}
	} );
}

/**
 * This function is called whenever an attenuation value is changed
 * @param ud a string that can be either "u" for uplink or "d" for downlink
 */
function onChangeAtten ( ud ) {
	if ( DBG && ud !== "u" && ud !== "d" ) {
		console.debug("The ud parameter has an invalid value: " + quote( ud ) );
		return;
	}
	var selectElement = $( "#" + ud + "l-att" );
	//what attribute? is it "atu" or "atd"?
	var attr = "at" + ud;
	var val = selectElement.val();
	if ( !confirm( "Do you want to change the attenuation to " + val + "?" ) ) {
		//user didn't confirm the action. revert to the previous value
		axshCall( _N( "get " + attr ), function ( out, err ) {
			if ( err ) {
				console.error( "Failed to get the old attenuation value: " + err );
			} else {
				selectElement.val( out );
			}
		});
		return;
	}
	selectElement.prop( "disabled", true );
	axshCall( _N( "set " + attr + " " + val ), function ( out, err ) {
		selectElement.prop( "disabled", false );
		if ( err ) {
			axellPopUp( "Could not set attenuation: " + err );
			//error happend while trying to set the value. revert to old values.
			axshCall( _N( "get " + attr ), function ( out, err ) {
				if ( err ) {
					console.error( "Failed to get the old attenuation value: " + err );
				} else {
					selectElement.val( out );
				}
			});
		}
	});
}

/**
 * This function is executed when the OLA button is pressed for a band.
 * @param number a number from 1 to 4 that indicates the fiber optic number
 */
function onOla ( number ) {
	if( DBG && number!=1 && number!=2 && number!=3 && number!=4 ) {
		console.debug( "Invalid band number passed to onAdjust(): " + number );
		return;
	}
	var btnId = "#fo" + number + "-ola-adjustment";
	setButtonEnDis( btnId, false );
	axshCall( _N( "act ola " + number ), function ( out, err ) {
		if ( err ) {
			axellPopUp( "Optical Loss Adjustment failed to initialize: " + err );
			setButtonEnDis( btnId, true );
			return;
		}
		axshCall( _N( "get ola " + number ), function ( out, err ) {
			setButtonEnDis( btnId, true );
			if( err ) {
				axellPopUp( "Could not get OLA attribute: " + err );
				return;
			}
			var successStatus = out.match( /^([01])\s/ );
			if ( successStatus == null ) {
				axellPopUp( "Could not parse the result of OLA attribute: " + out );
			} else {
				switch( successStatus[1] ) {
				case "0":
					axellPopUp( "Optical loss adjustment finished successfully." );
					break;
				case "1":
					var status = out.match( /\".*?\"/ );
					axellPopUp( "Optical loss adjustment failed: " + status );
					break;
				default:
					console.debug( "Error in regular expression when parsing the result of OLA: " + successStatus );
					break;
				}
			}
		});
	});
}

//** Descriptor for parsing the result of GET ALL
var ALL_DESC = [
	{
		name:"ATU",
		type:"str"
	},
	{
		name:"ATD",
		type:"str"
	},
	{
		name:"LVULVD",
		type:"charr"
	},
	{
		name:"AMUAMD",
		type:"charr"
	},
	{
		name:"ASD",
		type:"ch"
	},
	{
		name:"SZU",
		type:"ch"
	},
	{
		name:"PAD",
		type:"ch"
	},
	{
		name:"PDL",
		type:"ch"
	},
	{
		name:"RLD",
		type:"ch"
	},
	{
		name:"COM",
		type:"charr"
	},
	{
		name:"TEM",
		type:"ch"
	},
	{
		name:"RBT",
		type:"charr"
	},
	{
		name:"PTM",
		type:"charr"
	},
	{
		name:"BAT",
		type:"ch"
	},
	{
		name:"PW1",
		type:"charr"
	},
	{
		name:"PW2",
		type:"charr"
	},
	{
		name:"PW3",
		type:"charr"
	},
	{
		name:"PW4",
		type:"ch"
	},
	{
		name:"PSL",
		type:"ch"
	},
	{
		name:"RXO",
		type:"charr"
	},
	{
		name:"TXO",
		type:"charr"
	},
	{
		name:"SZP",
		type:"charr"
	},
	{
		name:"RXP",
		type:"charr"
	},
	{
		name:"EX",
		type:"charr"
	},
	{
		name:"DOO",
		type:"ch"
	},
	{
		name:"CRC",
		type:"charr"
	},
	{
		name:"RXQ",
		type:"ch"
	},
	{
		name:"RCH",
		type:"charr"
	},
	{
		name:"NMP",
		type:"ch"
	},
	{
		name:"FOM",
		type:"charr"
	},
	{
		name:"UNE",
		type:"ch"
	},
	{
		name:"UNO",
		type:"ch"
	},
	{
		name:"AUM",
		type:"ch"
	},
	{
		name:"UMT",
		type:"charr"
	}
];
/**
 * This function analyzes the output of the ALL attribute and updates the GUI accordingly
 */
function processAll ( out, err ) {
	if ( err ) {
		console.error( "Could not read ALL: " + err );
		return;
	}
	var all = parsePackage( out, ALL_DESC );
	if ( all === null ) {
		console.debug( "Could not parse the ALL attribute" );
		return;
	}
	// ATU & ATD
	setAttSelect( "#ul-att", all.ATU );
	setAttSelect( "#dl-att", all.ATD );

	// LVU & LVD
	if ( all.LVULVD[0] == "1" ) {
		setPwrBtn( "#ul-amp-pwr", "on" );
		$( "#ul-freq-indicator" ).removeClass( "off" );
	} else {
		setPwrBtn( "#ul-amp-pwr", "off" );
		$( "#ul-freq-indicator" ).addClass( "off" );
	}
	if ( all.LVULVD[1] == "1" ) {
		setPwrBtn( "#dl-amp-pwr", "on" );
		$( "#dl-freq-indicator" ).removeClass( "off" );
	} else {
		setPwrBtn( "#dl-amp-pwr", "off" );
		$( "#dl-freq-indicator" ).addClass( "off" );
	}

	
	// AMU & AMD
	setLedColor( "#ul-amp-led", all.AMUAMD[0] );
	setLedColor( "#dl-amp-led", all.AMUAMD[1] );

	// ASD
	setLedColor( "#dl-amp-sat-led", all.ASD );
	
	// SZU
	setLedColor( "#ul-synth-led", all.SZU );
	
	// PAD
	setLedColor( "#mcpa-gain-led", all.PAD );
	
	// PDL
	setLedColor( "#dl-pwr-lvl-led", all.PDL );
	
	//RLD
	setLedColor( "#mcpa-loss-led", all.RLD );
	
	// COM
	setLedColor( "#psu1-comm-led", all.COM[0] );
	setLedColor( "#psu2-comm-led", all.COM[1] );
	setLedColor( "#refgen-comm-led", all.COM[2] );
	setLedColor( "#tetra-comm-led", all.COM[3] );
	setLedColor( "#mcpa-comm-led", all.COM[4] );
	setLedColor( "#fo1-comm-led", all.COM[5] );
	setLedColor( "#fo2-comm-led", all.COM[6] );
	setLedColor( "#fo3-comm-led", all.COM[7] );
	setLedColor( "#fo4-comm-led", all.COM[8] );
	setLedColor( "#commux-comm-led", all.COM[9] );
	
	// TEM
	setLedColor( "#ctrl-temp-led", all.TEM );
	
	// RBT
	setLedColor( "#tetra-temp-led", all.RBT[0] );
	setLedColor( "#mcpa-temp-led", all.RBT[1] );
	setLedColor( "#fo1-temp-led", all.RBT[2] );
	setLedColor( "#fo2-temp-led", all.RBT[3] );
	setLedColor( "#fo3-temp-led", all.RBT[4] );
	setLedColor( "#fo4-temp-led", all.RBT[5] );
	
	// PTM 
	setLedColor( "#psu1-temp-led", all.PTM[0] );
	setLedColor( "#psu2-temp-led", all.PTM[1] );
	
	// BAT
	setLedColor( "#psu1-battery-led", all.BAT );
	
	// PW1
	setLedColor( "#psu1-pw1-led", all.PW1[0] );
	setLedColor( "#psu2-pw1-led", all.PW1[1] );
	setLedColor( "#mcpa-pw1-led", all.PW1[2] );

	// PW2
	setLedColor( "#psu1-pw2-led", all.PW2[0] );
	setLedColor( "#psu2-pw2-led", all.PW2[1] );
	setLedColor( "#tetra-pw2-led", all.PW2[2] );
	setLedColor( "#mcpa-pw2-led", all.PW2[3] );

	// PW3
	setLedColor( "#psu1-pw3-led", all.PW3[0] );
	setLedColor( "#psu2-pw3-led", all.PW3[1] );
	setLedColor( "#tetra-pw3-led", all.PW3[2] );
	setLedColor( "#mcpa-pw3-led", all.PW3[3] );
	setLedColor( "#refgen-pw3-led", all.PW3[4] );

	// PW4
	setLedColor( "#psu1-pw4-led", all.PW4 );

	// PSL
	setLedColor( "#psu1-input-power-led", all.PSL );
	
	// RXO
	setLedColor( "#fo1-rxopto-led", all.RXO[0] );
	setLedColor( "#fo2-rxopto-led", all.RXO[1] );
	setLedColor( "#fo3-rxopto-led", all.RXO[2] );
	setLedColor( "#fo4-rxopto-led", all.RXO[3] );

	// TXO
	setLedColor( "#fo1-txopto-led", all.TXO[0] );
	setLedColor( "#fo2-txopto-led", all.TXO[1] );
	setLedColor( "#fo3-txopto-led", all.TXO[2] );
	setLedColor( "#fo4-txopto-led", all.TXO[3] );
	
	// SZP
	setLedColor( "#fo1-pilotsynth-led", all.SZP[0] );
	setLedColor( "#fo2-pilotsynth-led", all.SZP[1] );
	setLedColor( "#fo3-pilotsynth-led", all.SZP[2] );
	setLedColor( "#fo4-pilotsynth-led", all.SZP[3] );

	// RXP
	setLedColor( "#fo1-rcv-pilot-level-led", all.RXP[0] );
	setLedColor( "#fo2-rcv-pilot-level-led", all.RXP[1] );
	setLedColor( "#fo3-rcv-pilot-level-led", all.RXP[2] );
	setLedColor( "#fo4-rcv-pilot-level-led", all.RXP[3] );

	// EX
	setLedColor( "#ext-1-led", all.EX[0] );
	setLedColor( "#ext-2-led", all.EX[1] );
	setLedColor( "#ext-3-led", all.EX[2] );
	setLedColor( "#ext-4-led", all.EX[3] );

	// DOO
	setLedColor( "#door-led", all.DOO );
	
	// CRC
	setLedColor( "#tetra-crc-led", all.CRC[0] );
	setLedColor( "#mcpa-crc-led", all.CRC[1] );
	setLedColor( "#fo1-crc-led", all.CRC[2] );
	setLedColor( "#fo2-crc-led", all.CRC[3] );
	setLedColor( "#fo3-crc-led", all.CRC[4] );
	setLedColor( "#fo4-crc-led", all.CRC[5] );
	setLedColor( "#commux-crc-led", all.CRC[6] );

	// RXQ
	if ( all.RXQ === "-" ) {
		$( ".rcv-data-quality" ).hide();
	} else {
		$( ".rcv-data-quality" ).show();
		setLedColor( "#rcv-data-quality-led", all.RXQ );
	}
	
	//NMP
	$( ".fo-commux-indicator" ).removeClass( "used" ).addClass( "unused" );
	$( "#fo" + all.NMP + "-commux-indicator" ).addClass( "used" );
	
	// UNE
	if ( all.UNE == "1" ) {
		$( "#uplink-noise-row" ).show();
	} else {
		$( "#uplink-noise-row" ).hide();
	}
	
	// UNO
	setLedColor( "#ul-amp-sat-led", all.UNO );
	
	// AUM
	if ( all.AUM == "1" ) {
		$( "#user-mute-row" ).show();
	} else {
		$( "#user-mute-row" ).hide();
	}

	// UMT Note: in this one exceptionally dl is before ul!
	setLedColor( "#dl-user-mute-led", all.UMT[0] );
	setLedColor( "#ul-user-mute-led", all.UMT[1] );
	
	//now set the overall leds
	setOverallLeds();
}

/**
 * Analyzes the output of the TEL command to set all the tempratures on the GUI
 */
function processTel ( out, err ) {
	if ( err ) {
		console.error ( "Could not get the TEL attibute: " + err);
		return;
	}

	//now try to parse it
	var e = split2( out );
	if ( !e ) {
		console.debug( "Could not parse output of get TEL command: " + quote( out) );
		return;
	}

	/*
	0. CTRL
	1. PSUP1
	2. PSUP2
	3. TETRA
	4. MCPA
	5. FOSLAVE1
	6. FOSLAVE2
	7. FOSLAVE3
	8. FOSLAVE4
	*/ 
	
	$( "#ctrl-temp-val" ).text( e[0] );
	
	//put the temperature values for power supply units on the tooltip of their LED. Not really important.
	$( "#psu-1-temp-cell" ).attr( "title", e[0] + "°C" );
	$( "#psu-2-temp-cell" ).attr( "title", e[1] + "°C" );
	$( "#tetra-temp-cell" ).attr( "title", e[2] + "°C" );
	$( "#mcpa-temp-cell"  ).attr( "title", e[3] + "°C" );
	
	$( "#fo1-temp-val" ).text( e[4] );
	$( "#fo2-temp-val" ).text( e[5] );
	$( "#fo3-temp-val" ).text( e[6] );
	$( "#fo4-temp-val" ).text( e[7] );
}

/**
 * This is a utility function used in processRft(). It gets a number, divides it by 10 and if it doesn't have any decimal points, adds ".0" to its end
 */
function oneDecimal ( n ) {
	var ret = parseInt( n );
	if ( typeof ret !== "number" || isNaN( ret ) ) {
		console.warn( "Could not convert RFT string to a number: " + quote( n ) );
		return n;
	} else {
		var decimal = ret % 10;
		if ( decimal == 0 ) {
			return ret / 10 + "." + decimal;
		} else {
			return ret / 10 + ".0";
		}
	}
}

/**
 * RFT stands for Radio Frequency Parameters for TETRA Radio Board
 */
function processRft ( out, err ) {
	if ( err ) {
		console.error( "Could not get RFT: " + err );
		return;
	}
	var e = split2( out );
	if ( !e ) {
		console.debug( "Could not parse RFT: " + quote( out ) );
		return;
	}	
	/*
	Output format:
	0. Lowest Detectable Output UL
	1. Lowest Detectable Output DL
	2. TERA MaxGain UL
	3. TERA MaxGain DL
	4. TERA MaxOutput UL
	5. TERA MaxOutput DL
	6. Lowest TERA Frequency UL
	7. Lowest TERA Frequency DL
	8. Highest TERA Frequency UL
	9. Highest TERA Frequency DL
	*/
	
	$( "#ul-freq-start" ).text( oneDecimal( e[6] ) );
	$( "#ul-freq-stop"  ).text( oneDecimal( e[8] ) );
	$( "#dl-freq-start" ).text( oneDecimal( e[7] ) );
	$( "#dl-freq-stop"  ).text( oneDecimal( e[9] ) );
}

/**
 * IPL stands for input power level and contains 8 numbers
 */
function processIpl ( out, err ) {
	if ( err ) {
		console.error( "Could not get IPL: " + err );
		return;
	}
	var e = split2( out );
	if ( !e ) {
		console.debug( "Could not parse IPL: " + quote( out ) );
		return;
	}	
	/* Output format
	0. IPL UL
	1. IPL DL
	*/
	$( "#ul-input-val" ).text( e[0] );
	$( "#dl-input-val" ).text( e[1] );
}

/**
 * OPL stands for output power level and contains 8 numbers.
 */
function processOpl ( out, err ) {
	if ( err ) {
		console.error( "Could not get OPL: " + err );
		return;
	}
	var e = split2( out );
	if ( !e ) {
		console.debug( "Could not parse OPL: '" + out + "'" );
		return;
	}	
	/* Output format
	0. OPL UL
	1. OPL DL
	*/
	$( "#ul-output-val" ).text( e[0] );
	$( "#dl-output-val" ).text( e[1] );
}

/**
 * OLV stands for optical level and contains 4 numbers.
 */
function processOlv ( out, err ) {
	if ( err ) {
		console.error( "Could not get OLV: " + err );
		return;
	}
	/*
	0. OLV1
	1. OLV2
	2. OLV3
	3. OLV4		
	*/
	var e = split2( out );
	if ( !e ) {
		console.error( "Could not parse OLV: " + quote( out) );
		return;
	}
	$( "#fo1-rxopto-val" ).text( e[0] );
	$( "#fo2-rxopto-val" ).text( e[1] );
	$( "#fo3-rxopto-val" ).text( e[2] );
	$( "#fo4-rxopto-val" ).text( e[3] );
}
/**
 * OLC stands for optical level compensation and contains 4 numbers.
 */
function processOlc ( out, err ) {
	if ( err ) {
		console.error( "Could not get OLC: " + err );
		return;
	}
	/*
	0. OLC1
	1. OLC2
	2. OLC3
	3. OLC4		
	*/
	var e = split2( out );
	if ( !e ) {
		console.error( "Could not parse OLC: " + quote( out ) );
		return;
	}
	$( "#fo1-ola-compensation-val" ).text( e[0] );
	$( "#fo2-ola-compensation-val" ).text( e[1] );
	$( "#fo3-ola-compensation-val" ).text( e[2] );
	$( "#fo4-ola-compensation-val" ).text( e[3] );
}

/**
 * Shows the external alarm description. Other functions wrap it to do the job.
 */
function processEad(n,out,err){
	if(err){
		console.error("Error when trying to get EAD "+n+": "+err);
		return;
	}else{
		$("#ext-"+n+"-desc").text(out);
	}
}
function processEad1(out,err){return processEad(1,out,err);}
function processEad2(out,err){return processEad(2,out,err);}
function processEad3(out,err){return processEad(3,out,err);}
function processEad4(out,err){return processEad(4,out,err);}

/**
 * Processes the receive pilot tone level
 */
function processPtl ( out, err ) {
	if ( err ) {
		console.error( "Error when trying to get PTL: " + err );
		return;
	}
	var e = split2( out );
	$( "#fo1-rcv-pilot-val" ).text( e[0] );
	$( "#fo2-rcv-pilot-val" ).text( e[1] );
	$( "#fo3-rcv-pilot-val" ).text( e[2] );
	$( "#fo4-rcv-pilot-val" ).text( e[3] );
}

/**
 * Processes the return loss level downlink
 */
function processRll ( out, err ) {
	if ( err ) {
		console.error( "Error when trying to get RLL: " + err );
		return;
	}

	$( "#dl-retloss-val" ).text( out );
}

/**
 * Processes the amplifier saturation level
 */
function processAsl ( out, err ) {
	if ( err ) {
		console.error( "Error when trying to get RLL: " + err );
		return;
	}
	switch ( out.charAt( 0 ) ) {
	case "1": $( "#band1-ul-ampsat-indicator" ).addClass( "saturation-yes" ).removeClass( "saturation-no" ).attr( "title", "Amplifier saturated" );break;
	case "0": $( "#band1-ul-ampsat-indicator" ).addClass( "saturation-no" ).removeClass( "saturation-yes" ).attr( "title", "Amplifier works in linear state" );break;
	case "-": $( "#band1-ul-ampsat-indicator" ).removeClass( "saturaion-yes saturation-no" ).addClass( "nothing" ).attr( "title", "Saturation alarm is disabled" );
	default:console.warn( "Value for ASL ignored: " + quote( out ) );
	}
	switch ( out.charAt( 1 ) ) {
	case "1": $( "#band1-dl-ampsat-indicator" ).addClass( "saturation-yes" ).removeClass( "saturation-no" ).attr( "title", "Amplifier saturated" );break;
	case "0": $( "#band1-dl-ampsat-indicator" ).addClass( "saturation-no" ).removeClass( "saturation-yes" ).attr( "title", "Amplifier works in linear state" );break;
	case "-": $( "#band1-dl-ampsat-indicator" ).removeClass( "saturaion-yes saturation-no" ).addClass( "nothing" ).attr( "title", "Saturation alarm is disabled" );
	default:console.warn( "Value for ASL ignored: " + quote( out ) );
	}
}
//** Processed the output of the IHU attribute
function processIhu ( out, err ) {
	if(err){
		axellPopUp( "Cannot read page layout: " + err );
		return;
	}
	//**this small utility function takes care of a class of devices based on their IHU value
	function devicePresent ( index, classSelector ) {
		switch ( out.charAt( index ) ) {
		case "1":
			//do nothing
			break;
		case "0":
			$( classSelector ).remove();
			break;
		default:
			console.debug( "An erronous character appeared in the output of IHU: " + out + ", index= " + index + ". Continuing to process IHU..." );
			break;
		}
	}
	/* Result of IHU has the following format:
	0. PSUP1
	1. PSUP2
	2. RefGen
	3. TETRA Radio Board // ESSENTIAL COMPONENT. THIS PART IS ALWAYS ASSUMED "1"
	4. TETRA MCPA        // ESSENTIAL COMPONENT. THIS PART IS ALWAYS ASSUMED "1"
	5. FiberOptic1
	6. FiberOptic2
	7. FiberOptic3
	8. FiberOptic4
	9. Communications Multiplexer
	*/
	devicePresent( 0, ".psu1-component" );
	devicePresent( 1, ".psu2-component" );
	devicePresent( 2, ".ref-gen-component" );
	
	devicePresent( 5, ".fo1" );
	devicePresent( 6, ".fo2" );
	devicePresent( 7, ".fo3" );
	devicePresent( 8, ".fo4" );
	devicePresent( 9, ".commux-component" );
}

/**
 * This function sets the state of the overall LEDs based on the statatus of their related LEDs
 */
function setOverallLeds () {
	setLedColor( "#general-status-overall-led", $( "#general-status-panel-contents .led.red" ).exists() );
	setLedColor( "#bands-status-overall-led", $( "#bands-status-panel-contents .led.red" ).exists() );
	
	var fo1Err = $( ".fo1 .led.red:not(.round)" ).exists();
	var fo2Err = $( ".fo2 .led.red:not(.round)" ).exists();
	var fo3Err = $( ".fo3 .led.red:not(.round)" ).exists();
	var fo4Err = $( ".fo4 .led.red:not(.round)" ).exists();
	
	setLedColor( "#fo1-overall-led", fo1Err );
	setLedColor( "#fo2-overall-led", fo2Err );
	setLedColor( "#fo3-overall-led", fo3Err );
	setLedColor( "#fo4-overall-led", fo4Err );
	setLedColor( "#fo-status-overall-led", fo1Err || fo1Err || fo1Err || fo1Err );

	var commoxErr = $( ".commux-component .led.red" ).exists();
	var psu1Err = $( ".psu1-component .led.red" ).exists();
	var psu2Err = $( ".psu2-component .led.red" ).exists();
	var refgenErr = $( ".ref-gen-component .led.red" ).exists();
	var miscOverallErr = commoxErr || psu1Err || psu2Err || refgenErr;
	
	setLedColor( "#commux-overall-led", commoxErr );
	setLedColor( "#psu1-overall-led", psu1Err );
	setLedColor( "#psu2-overall-led", psu2Err );
	setLedColor( "#ref-gen-overall-led", refgenErr );
	setLedColor( "#misc-status-overall-led", miscOverallErr );
	if ( miscOverallErr ) {
		$( "#powerstatus tr.advanced" ).show();
	}
	//expand all the rows with a red LED in them
	$( "tr" ).each( function ( index, element ) {
		if ( $( element ).find( ".led.red" ).exists() ) {
			$( element ).show();
		}
	});
}

/**
 * Shows the tag on screen
 */
function processTag ( out, err ) {
	if ( err ) {
		console.error( "Could not read TAG: " + err );
		return;
	}
	$( "#tag-val" ).text( out );
}

//** Processes the output of the LTG attribute (lock tag)
function processLtg ( out, err ) {
	if ( err ) {
		console.error( "Could not read LTG: " + err );
		return;
	}
	switch ( $.trim( out ) ) {
	case "0":
		//tag is unlocked
		$( "#lock-tag-button-icon" ).removeClass( "lock-white" ).addClass( "unlock-white" ).attr( "title", "Tag is editable" );
		break;
	case "1":
		//tag is locked
		$( "#lock-tag-button-icon" ).removeClass( "unlock-white" ).addClass( "lock-white" ).attr( "title", "Tag is not editable" );
		break;
	default:
		break;
	}
}

//** event handler for TAG lock button
function onLockTag () {
	//check if the button is already disabled
	if ( !getButtonEnDis( "#lock-tag-btn" ) ) {
		return;
	}
	setButtonEnDis( "#lock-tag-btn", false );
	axshCall( _N( "get ltg" ), function ( out, err ) {
		processLtg( out, err );
		if ( err ) {
			axellPopUp( "Could not read Tag lock status (LTG): " + err );
			setButtonEnDis( "#lock-tag-btn", true );
			return;
		}
		switch ( $.trim( out ) ) {
		case "1":
			if ( !confirm( "Editing the tag is locked. Are you sure you want to unlock it?" ) ) {
				setButtonEnDis( "#lock-tag-btn", true );
				return;
			}
			axshCall( _N( "set ltg 0" ), function ( out, err ) {
				setButtonEnDis( "#lock-tag-btn", true );
				if ( err ) {
					axellPopUp( "Could not unlock tag: " + err );
					return;
				} else {
					//tag is successfully unlocked!
					processLtg( "0", null );
				}
			});
			break;
		case "0":
			axshCall( _N( "set ltg 1" ), function ( out, err ) {
				setButtonEnDis( "#lock-tag-btn", true );
				if ( err ) {
					axellPopUp( "Failed to lock tag: " + err );
					return;
				} else {
					//tag is successfully locked!
					processLtg( "1", null );
				}
			});
			break;
		default:
			console.debug( "Could not understand the output of GET TAG: " + quote( out ) );
			setButtonEnDis( "#lock-tag-btn", true );
			break;
		}
	});
}

//** event handler for TAG
function onEditTag () {
	//if the button is disabled, do nothing
	if ( !getButtonEnDis( "#edit-tag-btn" ) ) {
		return;
	}
	var currTag = $.trim( $( "#tag-val" ).text() );
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
		axellPopUp( "Tag cannot contain quotation characters: \" \'" );
		return;
	}	
	//ok now the checks are passed
	setButtonEnDis( "#edit-tag-btn", false );
	$( "#tag-val" ).text( "..." );
	axshCall( _N( 'set tag "' + newTag + '"' ), function ( out, err ) {
		setButtonEnDis( "#edit-tag-btn", true );
		if ( err ) {
			$( "#tag-val" ).text( currTag );
			axellPopUp( "Failed to set tag: " + err );
		} else {
			$( "#tag-val" ).text( newTag );
			//and just to make sure, silently try to load tag again
			axshCall( _N( "get tag" ), function ( out, err ) {
				if ( !err ) {
					$( "#tag-val" ).text( out );
				}
			});
		}
	});
}

/**
 * This runs when the page is loaded into browser
 */
$( document ).ready( function ( e ) {
	//go to basic mode in the beginning
	basicMode();
	//get page layout
	axshCall( _N( "get ihu" ), processIhu );
	//the animation effect on the saturation icons
	setInterval( '$( ".saturation-yes" ).toggleClass( "anim" )', BLINK_DELAY );

	//ok now schedule repeated commands:
	axshCallInterval( 2500,  _N( "get all" ), processAll );
	axshCallInterval( 2500,  _N( "get tel" ), processTel );
	axshCallInterval( 3000,  _N( "get rft" ), processRft );
	axshCallInterval( 3000,  _N( "get ipl" ), processIpl );
	axshCallInterval( 3000,  _N( "get opl" ), processOpl );
	axshCallInterval( 3000,  _N( "get olv" ), processOlv );
	axshCallInterval( 3000,  _N( "get olc" ), processOlc );
	axshCallInterval( 9000,  _N( "get ptl" ), processPtl );
	axshCallInterval( 5000,  _N( "get rll" ), processRll );
	axshCallInterval( 1000,  _N( "get asl" ), processAsl );
	axshCallInterval( 30000, _N( "get ead 1" ), processEad1 );
	axshCallInterval( 30000, _N( "get ead 2" ), processEad2 );
	axshCallInterval( 30000, _N( "get ead 3" ), processEad3 );
	axshCallInterval( 30000, _N( "get ead 4" ), processEad4 );
	axshCallInterval( sec( 5 ), _N( "get ltg" ), processLtg );
	axshCallInterval( sec( 30 ), _N( "get tag" ), processTag );
});