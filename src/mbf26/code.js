//Descriptor for how to parse the result of GET ALL command
var ALL_DESC = [
	{//0
		name: "RID",
		type: "-"
	},
	{//1
		name: "MsgNo",
		type: "-"
	},
	{//2
		name: "MsgTyp",
		type: "-"
	},
	{//3
		name: "Date",
		type: "-"
	},
	{//4
		name: "Timestamp",
		type: "-"
	},
	{//5
		name: "IHU",
		type: "-"
	},
	{//6
		name: "ATD1",
		type: "str"
	},
	{//7
		name: "ATD2",
		type: "str"
	},
	{//8
		name: "ATU",
		type: "str"
	},
	{//9
		name: "AMD",
		type: "charr"
	},
	{//10
		name: "AMU",
		type: "ch"
	},
	{//11
		name: "ANT",
		type: "ch"
	},
	{//12
		name: "BBU",
		type: "ch"
	},
	{//13
		name: "COM",
		type: "charr"
	},
	{//14
		name: "CRC",
		type: "charr"
	},
	{//15
		name: "PDL",
		type: "charr"
	},
	{//16
		name: "PW2",
		type: "charr"
	},
	{//17
		name: "RBT",
		type: "charr"
	},
	{//18
		name: "RXO",
		type: "charr"
	},
	{//19
		name: "RXP",
		type: "charr"
	},
	{//20
		name: "RXQ",
		type: "ch"
	},
	{//21
		name: "SZP",
		type: "charr"
	},
	{//22
		name: "TEM",
		type: "ch"
	},
	{//23
		name: "TXO",
		type: "charr"
	},
	{//24
		name: "EX",
		type: "charr"
	},
	{//25
		name: "DOO",
		type: "ch"
	},
	{//26
		name: "NMP",
		type: "int"
	},
	{//27
		name: "RCH",
		type: "-"
	}
];

/**
 * Updates the majority of LEDs (and some more stuff) from the GET ALL command
 */
function processAll ( out, err ) {
	if ( err ) {
		console.error( "Could not read RSP: " + err );
		return;
	}
	var ALL = parsePackage( out, ALL_DESC );
	if ( ALL == null ) {
		console.debug( "Could not parse the output of FDS ALL: " + out );
		return;
	}
	//---------------------ATD1
	setAttSelect( "#dl1-att", ALL.ATD1 );
	//---------------------ATD2
	setAttSelect( "#dl2-att", ALL.ATD2 );
	//---------------------ATU
	setAttSelect( "#ul-att", ALL.ATU );
	//---------------------AMD
	setLedColor( "#dl1-amp-led", ALL.AMD[0] );
	setLedColor( "#dl2-amp-led", ALL.AMD[1] );
	//---------------------AMU
	setLedColor( "#ul-amp-led", ALL.AMU );
	//---------------------ANT
	setLedColor( "#ant-led", ALL.ANT );
	//---------------------BBU
	setLedColor( "#bbu-led", ALL.BBU );
	//---------------------COM
	setLedColor( "#gib-com-led", ALL.COM[0] );
	setLedColor( "#fo1-com-led", ALL.COM[1] );
	setLedColor( "#fo2-com-led", ALL.COM[2] );
	setLedColor( "#fo3-com-led", ALL.COM[3] );
	setLedColor( "#fo4-com-led", ALL.COM[4] );
	setLedColor( "#commux-com-led", ALL.COM[5] );
	//---------------------CRC
	setLedColor( "#gib-crc-led", ALL.CRC[0] );
	setLedColor( "#fo1-crc-led", ALL.CRC[1] );
	setLedColor( "#fo2-crc-led", ALL.CRC[2] );
	setLedColor( "#fo3-crc-led", ALL.CRC[3] );
	setLedColor( "#fo4-crc-led", ALL.CRC[4] );
	setLedColor( "#commux-crc-led", ALL.CRC[5] );
	//---------------------PDL
	setLedColor( "#dl1-output-led", ALL.PDL[0] );
	setLedColor( "#dl2-output-led", ALL.PDL[1] );
	//---------------------PW2
	setLedColor( "#dl1-pw2-led", ALL.PW2[0] );
	setLedColor( "#dl2-pw2-led", ALL.PW2[1] );
	setLedColor( "#ul-pw2-led", ALL.PW2[2] );
	setLedColor( "#pwr-led", ALL.PW2[3] );
	//---------------------RBT
	setLedColor( "#gib-tmp-led", ALL.RBT[0] );
	setLedColor( "#fo1-temp-led", ALL.RBT[0] );
	setLedColor( "#fo2-temp-led", ALL.RBT[1] );
	setLedColor( "#fo3-temp-led", ALL.RBT[2] );
	setLedColor( "#fo4-temp-led", ALL.RBT[3] );
	//---------------------RXO
	setLedColor( "#fo1-rxopto-led", ALL.RXO[0] );
	setLedColor( "#fo2-rxopto-led", ALL.RXO[1] );
	setLedColor( "#fo3-rxopto-led", ALL.RXO[2] );
	setLedColor( "#fo4-rxopto-led", ALL.RXO[3] );
	//---------------------RXP
	setLedColor( "#fo1-rcv-pilot-level-led", ALL.RXP[0] );
	setLedColor( "#fo2-rcv-pilot-level-led", ALL.RXP[1] );
	setLedColor( "#fo3-rcv-pilot-level-led", ALL.RXP[2] );
	setLedColor( "#fo4-rcv-pilot-level-led", ALL.RXP[3] );
	//---------------------RXQ
	setLedColor( "#rcv-data-quality-led", ALL.RXQ );
	//---------------------SZP
	setLedColor( "#fo1-pilot-synth-led", ALL.SZP[0] );
	setLedColor( "#fo2-pilot-synth-led", ALL.SZP[1] );
	setLedColor( "#fo3-pilot-synth-led", ALL.SZP[2] );
	setLedColor( "#fo4-pilot-synth-led", ALL.SZP[3] );
	//---------------------TEM
	setLedColor( "#system-tmp-led", ALL.TEM );
	//---------------------TXO
	setLedColor( "#fo1-txopto-led", ALL.TXO[0] );
	setLedColor( "#fo2-txopto-led", ALL.TXO[1] );
	setLedColor( "#fo3-txopto-led", ALL.TXO[2] );
	setLedColor( "#fo4-txopto-led", ALL.TXO[3] );
	//---------------------EX
	setLedColor( "#ext-1-led", ALL.EX[0] );
	setLedColor( "#ext-2-led", ALL.EX[1] );
	setLedColor( "#ext-3-led", ALL.EX[2] );
	setLedColor( "#ext-4-led", ALL.EX[3] );
	//---------------------DOO
	setLedColor( "#door-led", ALL.DOO );
	//---------------------NMP
	$( ".commux-indicator" ).removeClass( "used" ).addClass( "unused" );
	$( ".commux-enabled" ).removeClass( "commux-enabled" );
	$( "#fo" + ALL.NMP + "-commux-indicator" ).addClass( "used" ).removeClass( "unused" );
	$( ".fo" + ALL.NMP ).addClass( "commux-enabled" );
	//now set the overall leds
	setOverallLeds();
}

/**
 * This function sets the state of the overall LEDs based on the statatus of their related LEDs
 */
function setOverallLeds(){
	//if there is any red leds in this band (only <td> elements), turn the led red otherwise green
	setLedColor( "#dl1-overall-led", $( "#bands-status-panel td.dl1 .led.red" ).exists() ? "red" : "green" );
	setLedColor( "#dl2-overall-led", $( "#bands-status-panel td.dl2 .led.red" ).exists() ? "red" : "green" );
	setLedColor(  "#ul-overall-led", $( "#bands-status-panel td.ul  .led.red" ).exists() ? "red" : "green" );

	setLedColor( "#fo1-overall-led", $( "#fo-status-panel td.fo1 .led.red" ).exists() ? "red" : "green" );
	setLedColor( "#fo2-overall-led", $( "#fo-status-panel td.fo2 .led.red" ).exists() ? "red" : "green" );
	setLedColor( "#fo3-overall-led", $( "#fo-status-panel td.fo3 .led.red" ).exists() ? "red" : "green" );
	setLedColor( "#fo4-overall-led", $( "#fo-status-panel td.fo4 .led.red" ).exists() ? "red" : "green" );

	//if there is any red led in the contents of the panel, turn this overal led on otherwise green
	setLedColor( "#general-status-overall-led", $( "#general-status-panel .contents .led.red" ).exists() ? "red" : "green" );
	setLedColor( "#bands-status-overall-led"  , $( "#bands-status-panel   .contents .led.red" ).exists() || $( "#bands-headericons .led.red").exists() ? "red" : "green" );
	setLedColor( "#fo-status-overall-led"     , $( "#fo-status-panel      .contents .led.red" ).exists() || $( "#fo-headericons    .led.red").exists() ? "red" : "green" );

	//stupid loop to expand all the rows with a red LED in them
	$( "tr" ).each( function ( index, element ) {
		if ( $( this ).find( ".led.red" ).exists() ) {
			$( this ).show();
		}
	});
	//same stupid loop for the icon containers
	$( ".iconcontainer" ).each( function ( index, element ) {
		if ( $( this ).find( ".led.red" ).exists() ) {
			$( this ).show();
		}
	});
}


/**
 * OPL stands for output power level and contains 8 numbers.
 */
function processOpl ( out, err ) {
	if ( err ) {
		console.error( "Could not get OPL: " + err );
		return;
	}
	/*
	0. OPL DL1
	1. OPL DL2
	*/
	var e = split2( out );
	if ( !e ) {
		console.error( "Could not parse OPL: " + quote( out ) );
		return;
	}
	$( "#dl1-output-val").text( e[0] );
	$( "#dl2-output-val").text( e[1] );
}

/**
 * Analyzes the output of the TEL command to set all the tempratures on the GUI
 */
function processTel ( out, err ) {
	if ( err ) {
		console.error( "Could not get the TEL attibute: " + err );
		return;
	}

	//now try to parse it
	var e = split2( out );
	if ( !e ) {
		console.error( "Could not parse output of get TEL command: '" + out + "'" );
		return;
	}
	/*
	0. GIB Temperature
	1. FOSlave 1 Temperature
	2. FOSlave 2 Temperature
	3. FOSlave 3 Temperature
	4. FOSlave 4 Temperature
	*/
	$( "#system-tmp-val" ).text( e[0] );
	$( "#fo1-temp-val" ).text( e[1] );
	$( "#fo2-temp-val" ).text( e[2] );
	$( "#fo3-temp-val" ).text( e[3] );
	$( "#fo4-temp-val" ).text( e[4] );
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
	if( !e ) {
		console.error( "Could not parse OLV: " + quote(out) );
		return;
	}
	$( "#fo1-rxopto-val" ).text( e[0] );
	$( "#fo2-rxopto-val" ).text( e[1] );
	$( "#fo3-rxopto-val" ).text( e[2] );
	$( "#fo4-rxopto-val" ).text( e[3] );
}

/**
 * This function is a workaround that is used in processOlc.
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
	$( "#fo1-ola-comp-val" ).text( div10workAround( e[0] ) );
	$( "#fo2-ola-comp-val" ).text( div10workAround( e[1] ) );
	$( "#fo3-ola-comp-val" ).text( div10workAround( e[2] ) );
	$( "#fo4-ola-comp-val" ).text( div10workAround( e[3] ) );
}

/**
 * Shows the values of the uplink attenuation on screen
 */
function processAtu ( out, err ) {
	if ( err ) {
		console.error( "Could not read ATU: " + err );
		return;
	}
	setAttSelect( "#ul-att", out );
}

/**
 * Shows the values of the downlink attenuation on screen
 */
function processAtd ( out, err ) {
	if ( err ) {
		console.error( "Could not read ATD: " + err );
		return;
	}
	var e = split2( out );
	if ( !e ) {
		console.error( "Could not parse the output of the ATD: " + err );
		return;
	}
	//note: e is indexed from 0.
	setAttSelect( "#dl1-att", e[1] );
	setAttSelect( "#dl2-att", e[3] );
}

/**
 * Shows the external alarm description. Other functions wrap it to do the job.
 */
function processEad ( n, out, err ) {
	if ( err ) {
		console.error( "Error when trying to get EAD " + n + ": " + err );
		return;
	}else{
		$( "#ext-" + n + "-desc" ).text( out );
	}
}
function processEad1 ( out, err ) { return processEad( 1, out, err ); }
function processEad2 ( out, err ) { return processEad( 2, out, err ); }
function processEad3 ( out, err ) { return processEad( 3, out, err ); }
function processEad4 ( out, err ) { return processEad( 4, out, err ); }

/**
 * Processes the receive pilot tone level
 */
function processPtl ( out, err ) {
	if ( err ) {
		console.error( "Error when trying to get PTL: " + err );
		return;
	}
	var e = split2( out );
	$( "#fo1-rcv-pilot-level-val" ).text( e[0] );
	$( "#fo2-rcv-pilot-level-val" ).text( e[1] );
	$( "#fo3-rcv-pilot-level-val" ).text( e[2] );
	$( "#fo4-rcv-pilot-level-val" ).text( e[3] );
}

//** Processes the output of IHU command which hides elements that don't exist in this particular device
function processIhu ( out, err ) {
	if(err){
		axellPopUp("Cannot read page layout. Please make sure you are connected to the repeater then refresh the page: "+err);
		return;
	}
	
	/* result of IHU has the following format:
	0. GIB
	1. FOSlave1
	2. FOSlave2
	3. FOSlave3
	4. FOSlave4
	5. ComMux
	*/
	devicePresent( out, 0, ".bands-status-panel", "GIB" );
	devicePresent( out, 1, ".fo1", "FO Slave 1" );
	devicePresent( out, 2, ".fo2", "FO Slave 2" );
	devicePresent( out, 3, ".fo3", "FO Slave 3" );
	devicePresent( out, 4, ".fo4", "FO Slave 4" );
	devicePresent( out, 5, ".commux-component", "Commux" );

	//ok now schedule repeated commands:
	axshCallInterval( sec(  30 ), _N( "get tag" ), processTag );//ok -t
	axshCallInterval( sec( 2.5 ), _N( "get all" ), processAll );//ok +t
	axshCallInterval( sec(  10 ), _N( "get tel" ), processTel );//ok +t
	axshCallInterval( sec(   3 ), _N( "get opl" ), processOpl );//ok +t
	axshCallInterval( sec(   3 ), _N( "get olv" ), processOlv );//ok +t
	axshCallInterval( sec(   3 ), _N( "get olc" ), processOlc );//ok +t
	axshCallInterval( sec(   9 ), _N( "get ptl" ), processPtl );//ok +t
	axshCallInterval( sec(  30 ), _N( "get ead 1" ), processEad1 );//ok +t
	axshCallInterval( sec(  30 ), _N( "get ead 2" ), processEad2 );//ok +t
	axshCallInterval( sec(  30 ), _N( "get ead 3" ), processEad3 );//ok +t
	axshCallInterval( sec(  30 ), _N( "get ead 4" ), processEad4 );//ok +t
	axshCallInterval( sec(   5 ), _N( "get ltg" ), processLtg );//ok -t
	axshCallInterval( sec(  15 ), _N( "get rid" ), processRid);//OK +t
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

//** event handler for RID
function onEditRid () {
	//if the button is disabled, do nothing
	if ( !getButtonEnDis( "#edit-rid-btn" ) ) {
		return;
	}
	var currRid = $.trim( $( "#rid-val" ).text() );
	if ( currRid === "..." ) {
		axellPopUp( "Repeater ID is not loaded yet. Please try again later or refresh the page." );
		return;
	}
	var newRid = prompt( "Edit Repater ID", currRid );
	if ( newRid === null ) {
		//user pressed cancel on the prompt dialogue
		return;
	}
	newRid = $.trim( newRid );
	if ( /["']/.test( newRid ) ) {
		axellPopUp( "Repeater ID cannot contain quotation characters: \" \'" );
		return;
	}	
	//ok now the checks are passed
	setButtonEnDis( "#edit-rid-btn", false );
	$( "#rid-val" ).text( "..." );
	axshCall( _N( 'set rid "' + newRid + '"' ), function ( out, err ) {
		setButtonEnDis( "#edit-rid-btn", true );
		if ( err ) {
			$( "#rid-val" ).text( currRid );
			axellPopUp( "Failed to set repeater id: " + err );
		} else {
			$( "#rid-val" ).text( newRid );
			//and just to make sure, silently try to load rid again
			axshCall( _N( "get rid" ), processRid );
		}
	});
}

/**
 * This function is called whenever an attenuation value is changed
 * @param id the id for the <select> element
 * @param attr can be "atd 1", "atd 2" or "atu"
 */
function onChangeAtt ( id, attr ) {
	var selectElement = $( "#" + id );
	var val = selectElement.val();
	if( confirm( "Do you want to change the attenuation to " + val + "?" ) ) {
		selectElement.prop( "disabled", true );
		axshCall( _N( "set " + attr + " " + val ), function ( out, err ) {
			selectElement.prop("disabled",false);
			if ( err ) {
				axellPopUp( "Could not set attenuation: " + err );
				//reload the attenuation values
				axshCall( "get atu", processAtu );
				axshCall( "get atd", processAtd );
			}
		});
	}else{
		//reload the attenuation values
		axshCall( "get atu", processAtu );
		axshCall( "get atd", processAtd );
	}
}

/**
 * This function is executed when the OLA button is pressed for a band.
 * @param number a number from 1 to 4 that indicates the fiber optic number
 */
function onAdjust ( number ) {
	if ( !number || number < 1 || number > 4 ) {
		console.debug( "Invalid band number passed to onAdjust(): " + number );
	}
	var btnId = "#fo" + number + "-ola-btn";
	if ( getButtonEnDis ( btnId ) == false ) {
		axellPopUp( "Ola already in progress" );
		return;
	}
	setButtonEnDis ( btnId, false );
	setStatus( "Optical Loss Adjustment on Fiber Optic " + number, true );
	axshCall( _N( "act ola " + number ), function ( out, err ) {
		if ( err ) {
			setButtonEnDis ( btnId, true );
			setStatus();
			axellPopUp( "Optical Loss Adjustment failed to initialize: " + err );
			return;
		}
		axshCall( _N( "get ola " + number ), function ( out, err ) {
			setButtonEnDis ( btnId, true );
			setStatus();
			if ( err ) {
				axellPopUp( "Could not get OLA attribute: " + err);
				return;
			}
			var successStatus = out.match( /^([01])\s/ );
			if ( successStatus == null ) {
				axellPopUp( "Could not parse the result of OLA attribute: " + out );
			} else {
				switch ( successStatus[1] ) {
				case "0":
					axellPopUp( "Optical loss adjustment finished successfully." );
					break;
				case "1":
					var status = out.match( /\".*?\"/ );
					if ( status !== null ) {
						axellPopUp( "Optical loss adjustment failed: " + status[1] );
					} else {
						axellPopUp( "Optical loss adjustment failed for unknown reason. Full message: " + out );
					}
					break;
				default:
					console.debug( "Error in regular expression when parsing the result of OLA: " + successStatus );
				}
			}
		});
	});
}

//** Processes the MDL attribute
function processMdl( out, err ) {
	if ( err ) {
		console.error( "Could not retrieve model (MDL): " + err );
	} else {
		$( "#mdl-val" ).text( out );
	}
}

//** Processes the RID attribute
function processRid( out, err ) {
	if ( err ) {
		console.error( "Could not retrieve repeater id (RID): " + err );
	} else {
		$( "#rid-val" ).text( out );
	}
}

/**
 * This runs when the page is loaded into browser
 */
$( document ).ready( function ( e ) {
	//go to basic mode in the beginning
	basicMode();
	//set the possible attenuation values in the <select> elements
	$( "select.attenuation" ).each( function ( index, element ) {
        for( var i = 0; i <= 15; i++ ) {
			$(this).append( "<option>" + i + "</option>" );
		}
    });
	//get page layout
	axshCall( _N("get ihu"), processIhu );
	axshCall( _N("get mdl"), processMdl);
});