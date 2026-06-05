//{{OPTIONS
/**
 * The delay before re-reading RSP (in miliseconds)
 */
var RSP_REREAD_DELAY=2100;
/**
 * The delay before re-reading Attenuation values (in miliseconds)
 */
var ATTENUATION_REREAD_DELAY=10000;
/**
 * The delay before re-reading OLV and ILV (in miliseconds)
 */
var INPUT_LEVELS_REREAD_DELAY=2500;
/**
 * The delay before re-reading temperatures (in miliseconds)
 */
var TEMPERATURES_REREAD_DELAY=4000;
/**
 * The delay before re-reading node list (in miliseconds)
 */
var NODES_REREAD_DELAY=10000;
//}}OPTIONS

/**
 * Initializes the attenuation controls
 */
function initAttenuationControls(){
	//Sets the list of values for the attenuation list
	$("select.attenuation").each(function(index, element) {
		//According to the specification for ATD attribute: "Interval is 0 to 21 dB in 3 dB steps."
		for(var i=0;i<=21;i+=3){
			$option=$(document.createElement("option"));
			$option.text(i).val(i);//set both text and val
			$(this).append($option);
		}        
		element.onchange=onAttenuationChange;
    });
}

/**
 * Event handler that is called whenever an attenuation select is changed
 */
function onAttenuationChange(){
	var val=$(this).val();
	if(confirm("Are you sure you want to change the attenuation to "+val+"?")){
		var id=$(this).attr("id");
		if(!id){
			console.error("Could not find the id of the <select> element");
			return;
		}
		// id can be either "rack_R_poi_ulatt_P_att" or "rack_R_poi_dlatt_P_att" where R and P are rack number and POI number respectively
		var e=id.match(/rack_(.)_poi_(.)latt_(.)_att/);
		if(!e){
			console.error("Could not parse the id of the <select> element");
			return;
		}
		var rack=e[1];
		var poi=e[3];
		//one character for holding "u" for ATU and "d" for ATD
		var ud=e[2].toLowerCase();
		//command format according to spec is: SET ATD <Rack J>:<RF Slot K> <Atten X>  or SET ATU <Rack J>:<RF Slot K> <Atten X>
		axshCall(_N("set at"+ud+" "+rack+":"+poi+" "+val),function(output,err){
			if(err){
				console.error( "Could not set attenuations: " + err );
			}else{
				//now that the attenuation is set, update the GUI with the latest values
				updateAttenuations();
			}
		});
	}else{
		//reload all attenuation values to show the old value
		updateAttenuations();
	}
}

/**
 * Updates the temperatures using GET TEL in the GUI
 */
function processTel ( out, err ){
	if(err){
		console.error("Could not read temperatures: "+err);
	}else{
		var e=split2(out);
		$("#system-temp-val").text(e[0]);
	}
}

/**
 * Gets a character and adjusts the corresponding POI unit in the specified rack
 * @param ch the character that describes this POI it can be 1 for splitter, 2 for combiner and 3 for level control (just as defined by IHU). if it's dash "-" the whole column will be removed.
 * @param r rack number. 1..4
 * @param p which POI is it? 1..4
 */
function setPoi(ch,r,p){
	if(ch=="1"){//it's a splitter
		var icon=$(document.createElement("div")).addClass("icon splitter").attr("title","Splitter");
		$("#rack_"+r+"_poi_icon_"+p).append(icon);
		$("#rack_"+r+"_poi_type_"+p).text("Splitter").attr("title","Splitter");
		//splitters don't have uplink stuff. remove them!
		$("#rack_"+r+"_poi_ulatt_"+p).children().remove();
		$("#rack_"+r+"_poi_ulinputlevel_"+p).children().remove();
	}else if(ch=="2"){//it's a combiner
		var icon=$(document.createElement("div")).addClass("icon combiner").attr("title","Combiner");
		$("#rack_"+r+"_poi_icon_"+p).append(icon);
		$("#rack_"+r+"_poi_type_"+p).text("Combiner").attr("title","Combiner");
		//combiner don't have downlink stuff. remove them!
		$("#rack_"+r+"_poi_dlatt_"+p).children().remove();
		$("#rack_"+r+"_poi_dlinputlevel_"+p).children().remove();
		$("#rack_"+r+"_poi_dlInputlevelstatus_"+p).children().remove();
	}else if(ch=="3"){//it's a level control
		var icon=$(document.createElement("div")).addClass("icon levelcontrol").attr("title","Level Control");
		$("#rack_"+r+"_poi_icon_"+p).append(icon);
		$("#rack_"+r+"_poi_type_"+p).text("L.C.").attr("title","Level Control");
		//level control has both the uplink and downlink stuff!
	}else if(ch=="0"){
		//remove the entire column
		$("table#rack_"+r+"_poi td.column_"+p).remove();
	}else{
		console.error("Invalid POI descriptor character passed to setPoi: '"+ch+"', rack="+r+", POI="+p);
	}
}

/**
 * Reads the IHU (Intalled Hardware Units) property and updates the graphical user interface accordingly.
 * This process removes the nodes from DOM so if things are added to the rack, the page should be refreshed.
 */
function processIhu(){
	axshCall(_N("get ihu"),function(out,err){
		if(err){
			console.error("Could not get installed hardware units (IHU): " + err );
			return;
		}
		/*
		0. RACK 1
		1. POI 1:1
		2. POI 1:2
		3. POI 1:3
		4. POI 1:4
		5. FiberOptic 1:1
		6. FiberOptic 1:2
		7. FiberOptic 1:3
		8. FiberOptic 1:4
		9. FiberOptic 1:5
		10. FiberOptic 1:6
		11. FiberOptic 1:7
		12. FiberOptic 1:8
		13. RCB 1
		14. PSU 1:1
		15. PSU1:2
		
		RACK 2
		POI 2:1
		POI 2:2
		POI 2:3
		POI 2:4
		FiberOptic 2:1
		FiberOptic 2:2
		FiberOptic 2:3
		FiberOptic 2:4
		FiberOptic 2:5
		FiberOptic 2:6
		FiberOptic 2:7
		FiberOptic 2:8
		RCB 2
		PSU 2:1
		PSU2:2
		
		RACK 3
		POI 3:1
		POI 3:2
		POI 3:3
		POI 3:4
		FiberOptic 3:1
		FiberOptic 3:2
		FiberOptic 3:3
		FiberOptic 3:4
		FiberOptic 3:5
		FiberOptic 3:6
		FiberOptic 3:7
		FiberOptic 3:8
		RCB 3
		PSU 3:1
		PSU3:2
		
		RACK 4
		POI 4:1
		POI 4:2
		POI 4:3
		POI 4:4
		FiberOptic 4:1
		FiberOptic 4:2
		FiberOptic 4:3
		FiberOptic 4:4
		FiberOptic 4:5
		FiberOptic 4:6
		FiberOptic 4:7
		FiberOptic 4:8
		RCB 4
		PSU 4:1
		PSU4:2
		
		For POI modules:
			0 means not installed
			1 means installed and is a Splitter
			2 means installed and is a Combiner
			3 means installed and is a Level Control board

		For other components:
			0 means module is not installed.
			1 means module is installed.
		*/
		var counter=0;
		for(var r=1;r<=4;r++){
			//Does rack exist?
			if(out.charAt(counter)=="0"){
				$("#rack_"+r).remove();
				counter+=17;
				continue;
			} else {
				counter++;
			}
			//{{take care of all the devices within one rack
			//set the POI type
			for(var p=1;p<=4;p++){
				setPoi(out.charAt(counter),r,p);
				counter++;
			}
			//fiber optics
			for(var f=1;f<=8;f++){
				if(out.charAt(counter)=="0"){//this fiber optic module does not exist
					$("table#rack_"+r+"_fom td.column_"+f).remove();
				}
				counter++;
			}
			//RCB
			if(out.charAt(counter)=="0"){
				$("#rack_"+r+"_iconbar").remove("div.iconcontainer");
			}
			counter++;
			if(out.charAt(counter)=="0"){
				$("#rack_"+r+"_rackpsu1_container").remove();
			}
			counter++;
			if(out.charAt(counter)=="0"){
				$("#rack_"+r+"_rackpsu2_container").remove();
			}
			counter++;
			//}}take care of all the devices within one rack
			counter++;//to skip the space character before the data for the next rach starts
		}
	});
}

/**
 * Processes the output that comes from the RSP command
 */
function processRsp(out,err){
	if(err){
		console.error("Could not read the statuses (RSP): "+err);
		return;
	}
	var e_bat,e_com_rcb,e_com_split,e_com_comb,e_com_poi,e_com_fo_rack_1,e_com_fo_rack_2,e_com_fo_rack_3,e_com_fo_rack_4,e_crc,e_nco,e_psu,e_pw1,e_pw2,e_pw3,e_pw4,e_rbt,e_rxo,e_szp,e_tem,e_txo,e_ild,e_ext;
	//Field numbers and examples:
	//1 2    3                4        5        6        7        8             9      10 11   12      14        15       16         18       19   20
	//0 000- 000-000-000----- 00000011 11000000 0100001- --11---- 0000000000000 000000 00 0000 00000 0 000000000 00000000 00000000 1 00000000 0000 0000
	var e=out.match(/(.) (....) (................) (........) (........) (........) (........) (.............) (......) (..) (....) (.....) (.) (.........) (........) (........) (.) (........) (....) (....)/);
	/*
	1. BAT
	2. COM-RCB
	3. COM-POI
	4. COM-FO Rack 1
	5. COM-FO Rack 2
	6. COM-FO Rack 3
	7. COM-FO Rack 4
	8. CRC
	9. NCO
	10. PSU
	11. PW2
	12. PW3
	13. PW4
	14. RBT
	15. RXO
	16. SZP
	17. TEM
	18. TXO
	19. ILD
	20. EX1/EX2/EX3/EX4>
	*/
	if(!e){
		console.error("Could not parse RSP: "+out);
		return;
	}
	e_bat=e[1];
	e_com_rcb=e[2];
	e_com_poi=e[3];
	e_com_fo_rack_1=e[4];
	e_com_fo_rack_2=e[5];
	e_com_fo_rack_3=e[6];
	e_com_fo_rack_4=e[7];
	e_crc=binSt2st(e[8]);
	e_nco=binSt2st(e[9]);
	e_psu=binSt2st(e[10]);
	e_pw2=e[11];
	e_pw3=binSt2st(e[12]);
	e_pw4=e[13];
	e_rbt=binSt2st(e[14]);
	e_rxo=binSt2st(e[15]);
	e_szp=binSt2st(e[16]);
	e_tem=e[17];
	e_txo=binSt2st(e[18]);
	e_ild=binSt2st(e[19]);
	e_ext=e[20];

	//BAT (battery)
	setLedColor("#rack_1_rackbattery_led",status2led(e_bat));
	$("#rack_2_rackbattery_container").remove();
	$("#rack_3_rackbattery_container").remove();
	$("#rack_4_rackbattery_container").remove();

	//COM-RCB (rack communication board)
	for(var i=1;i<=4;i++){
		setLedColor("#rack_"+i+"_rackcomm_led",status2led(e_com_rcb.charAt(i-1)));
	}

	//COM-POI (communication with point of interaction)
	var counter=0;
	for(var r=1;r<=4;r++){
		for(var p=1;p<=4;p++){
			setLedColor("#rack_"+r+"_poi_comm_"+p+"_led",status2led(e_com_poi.charAt(counter)));
			counter++;
		}
	}
	
	//COM-FO Rack 1 (communication with fiber optic modules in rack 1)
	for(var s=1;s<=8;s++){
		setLedColor("#rack_1_fom_comm_"+s+"_led",status2led(e_com_fo_rack_1.charAt(s-1)));
	}	

	//COM-FO Rack 2 (communication with fiber optic modules in rack 2)
	for(var s=1;s<=8;s++){
		setLedColor("#rack_2_fom_comm_"+s+"_led",status2led(e_com_fo_rack_2.charAt(s-1)));
	}
	
	//COM-FO Rack 3 (communication with fiber optic modules in rack 3)
	for(var s=1;s<=8;s++){
		setLedColor("#rack_3_fom_comm_"+s+"_led",status2led(e_com_fo_rack_3.charAt(s-1)));
	}
	
	//COM-FO Rack 4 (communication with fiber optic modules in rack 4)
	for(var s=1;s<=8;s++){
		setLedColor("#rack_4_fom_comm_"+s+"_led",status2led(e_com_fo_rack_4.charAt(s-1)));
	}
	
	//CRC (firmware CRC)
	var counter=0;
	for(var r=1;r<=4;r++){
		setLedColor("#rack_"+r+"_rackfirmware_led",status2led(e_crc.charAt(counter)));
		counter++;
	}
	for(var r=1;r<=4;r++){
		for(var p=1;p<=4;p++){
			setLedColor("#rack_"+r+"_poi_firmware_"+p+"_led",status2led(e_crc.charAt(counter)));
			counter++;
		}
	}
	for(var r=1;r<=4;r++){
		for(var s=1;s<=8;s++){
			setLedColor("#rack_"+r+"_fom_firmware_"+s+"_led",status2led(e_crc.charAt(counter)));
			counter++;
		}
	}
	

	//NCO (status of communication with remote nodes)
	//Node communications are updated via "nodes -w" command in updateNodes()
	
	//PSU (power supply unit status)
	var counter=0;
	for(var r=1;r<=4;r++){
		for(var psu=1;psu<=2;psu++){
			setLedColor("#rack_"+r+"_rackpsu"+psu+"_led",e_psu[counter]);
			counter++;
		}
	}
	
	//OMU mark 2 doesn't have power1
	$("#rack_1_rackpower1_container").remove();
	$("#rack_2_rackpower1_container").remove();
	$("#rack_3_rackpower1_container").remove();
	$("#rack_4_rackpower1_container").remove();

	//PW2 (power2)
	var counter=0;
	for(var r=1;r<=4;r++){
		setLedColor("#rack_"+r+"_rackpower2_led",status2led(e_pw2.charAt(counter)));
		counter++;
	}
	
	//PW3 (power3)
	var counter=0;
	for(var r=1;r<=4;r++){
		setLedColor("#rack_"+r+"_rackpower3_led",status2led(e_pw3.charAt(counter)));
		counter++;
	}
	for(var r=1;r<=4;r++){
		for(var p=1;p<=4;p++){
			setLedColor("#rack_"+r+"_poi_power3_"+p+"_led",status2led(e_pw3.charAt(counter)));
			counter++;
		}
	}
	
	//PW4 (power4)
	setLedColor("#rack_1_rackpower4_led",status2led(e_pw4.charAt(0)));
	$("#rack_2_rackpower4_container").remove();
	$("#rack_3_rackpower4_container").remove();
	$("#rack_4_rackpower4_container").remove();

	//RBT (radio board temperature)
	var counter=0;
	for(var r=1;r<=4;r++){
		setLedColor("#rack_"+r+"_racktemp_led",status2led(e_rbt.charAt(counter)));
		counter++;
	}
	for(var r=1;r<=4;r++){
		for(var s=1;s<=8;s++){
			setLedColor("#rack_"+r+"_fom_temperature_"+s+"_led",status2led(e_rbt.charAt(counter)));
			counter++;
		}
	}
	
	//RXO (received optical level)
	var counter=0;
	for(var r=1;r<=4;r++){
		for(var s=1;s<=8;s++){
			setLedColor("#rack_"+r+"_fom_rxopto_"+s+"_led",status2led(e_rxo.charAt(counter)));
			counter++;
		}
	}
	
	//SZP (synthesizer lock status for pilot tone generator)
	var counter=0;
	for(var r=1;r<=4;r++){
		for(var s=1;s<=8;s++){
			setLedColor("#rack_"+r+"_fom_pilotsynth_"+s+"_led",status2led(e_szp.charAt(counter)));
			counter++;
		}
	}
	//TEM (temperature status)
	setLedColor("#systemtemperatureled",e_tem);

	//TXO (transmitted optical level)
	var counter=0;
	for(var r=1;r<=4;r++){
		for(var s=1;s<=8;s++){
			setLedColor("#rack_"+r+"_fom_txopto_"+s+"_led",status2led(e_txo.charAt(counter)));
			counter++;
		}
	}

	//ILD(input level downlink)
	var counter=0;
	for(var r=1;r<=4;r++){
		for(var p=1;p<=4;p++){
			setLedColor("#rack_"+r+"_poi_inputlevelstatus_"+p+"_led",status2led(e_ild.charAt(counter)));
			counter++;
		}
	}

	//EX1/EX2/EX3/EX4
	for(var i=1;i<=4;i++){
		setLedColor("#ext"+i+"leddiv",status2led(e_ext.charAt(i-1)));
	}
	
	//now set the overall status LED's
	updateOverallLeds();
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
 * This reads all the input levels for the Points of Interest
 */
function processIlv ( out, err ) {
	if(err){
		console.error("Could not retrieve ILV attribute: "+err);
		return;
	}
	ilv=split2(out);
	if ( !ilv ) {
		console.error( "Could not parse ILV" );
		return;
	}
	var counter=0;
	for(var r=1;r<=4;r++){
		for(var p=1;p<=4;p++){
			$("#rack_"+r+"_poi_dlinputlevel_"+p+"_val").text(ilv[counter]);
			counter++;
		}
	}
}

/**
 * Updates the list of nodes and their comm and status leds
 */
function processNodes ( out, err ) {
	//process possible errors
	if(err){
		console.error("Could not get the list of nodes: "+err);
		return;
	}
	//now parse the output of the nodes command
	var lines=split2(out,"\n");
	//update the number of nodes that is shown in the caption
	if(lines.length==0){
		console.error("Error parsing the output of the nodes command: '"+out+"'");
		return;
	}else if(lines.length==0){
	}else{
		$("#nodelist caption").text(lines.length+" node(s)");
	}
	//now update the page
	for(var r=1;r<=4;r++){
		for(var s=1;s<=8;s++){
			$("#rack_"+r+"_fom_ncontrol_"+s).empty();
		}
	}
	for ( var i = 0; i < lines.length; i++ ) {
		/* every line contains N followed by GET NIN N*/
		var e = splitSQ( lines[i] );
		//if could not parse the line, it must be a development error
		if ( e === null ) {
			console.warn( "Could not parse this line from output of the nodes command: " + lines[i] );
			continue;
		}
		/**
		Output of nodes -w has the following format:
		0. Node number
		1. Serial number
		2. Node Status
		3. Node Communication
		4. Mode
		5. Rack number
		6. Slot number
		7. Repeater type/Model
		8. Tag
		9. "System Version Common Version Target Version"
		10. Description
		11. state
		*/
		//TODO: Use NNO attribute instead of assuming node number 0 for current node.
		//skip node number 0. That is the current controller!
		if ( e[1] == "0" ) {
			continue;
		}
		//set leds for node status and communication
		setLedColor( "#rack_" + e[5] + "_fom_nstatus_" + e[6] + "_led", e[2] );
		setLedColor( "#rack_" + e[5] + "_fom_ncomm_" + e[6] + "_led", e[3] );
		//create the node control button and add it to the right place
		var node = $( document.createElement( "a" ) );
		node.addClass( "nodenumber" ).text( e[0] ).attr( "title", "Type: " + e[7] + "     Tag: " + e[8] );
		$( "#rack_" + e[5] + "_fom_ncontrol_" + e[6] ).append( node );
	}
	//now set the overall status LED's
	updateOverallLeds();
}

/**
 * This reads all the input levels for the Fiber Optic Units
 */
function processOlv(out,err){
	if(err){
		console.error("Could not retrieve OLV attribute: "+err);
		return;
	}
	olv=split2(out);
	var counter=0;
	for(var r=1;r<=4;r++){
		for(var s=1;s<=8;s++){
			$("#rack_"+r+"_fom_rxoptolevel_"+s+"_val").text(olv[counter]);
			counter++;
		}
	}
}

//** Processes the result of GET MDL
function processMdl ( out, err ) {
	if ( err ) {
		console.error( "Could not read MDL (model): " + err );
		return;
	} else {
		$( "#mdl-val" ).text( out );
	}
}

//** Processes the result of GET RID
function processRid ( out, err ) {
	if ( err ) {
		console.error( "Could not read RID (repeater id): " + err );
		return;
	} else {
		$( "#rid-val" ).text( out );
	}
}

/**
 * This function updates all the overal status LEDs and expands all the rows with errors
 */
function updateOverallLeds() {
	//put all the overall leds to an undefined status
	setLedColor( ".led.round" );
	
	//for every rack
	for ( var r = 1; r <= 4; r++ ) {
        //let's initially assume there is no error unless proven otherwise
		var rackHasRedLed = false;
		//for every POI column
		for ( var p = 1; p <= 4; p++ ) {
            if ( $("#rack_" + r + "_poi .column_" + p + " div.led.green").exists () ) {
                setLedColor( "#rack_" + r + "_poi_overallstatus_" + p + "_led", "green");
			} else if ( $("#rack_" + r + "_poi .column_" + p + " div.led.red").exists () ) {
                setLedColor( "#rack_" + r + "_poi_overallstatus_" + p + "_led", "red");
                rackHasRedLed = true;
            } else {
				setLedColor( "#rack_" + r + "_poi_overallstatus_" + p + "_led", "grey" );
			}
		}
		//for every FOM column
		for ( var s = 1; s <= 8; s++ ) {
			if ( $("#rack_" + r + "_fom .column_" + s + " div.led.green").exists () ) {
				setLedColor( "#rack_" + r + "_fom_overallstatus_" + s + "_led", "green");
            } else if ( $("#rack_" + r + "_fom .column_" + s + " div.led.red").exists () ) {
				setLedColor( "#rack_" + r + "_fom_overallstatus_" + s + "_led", "red");
				rackHasRedLed = true;
			} else {
				setLedColor( "#rack_" + r + "_fom_overallstatus_" + s + "_led", "grey");
			}
		}
		//leds on the rack title bar
		if( $("#rack_" + r + "_iconbar div.led.red").exists() ) {
			rackHasRedLed = true;
		}
		//now set the rack overall led
		setLedColor("#rack_" + r + "_overallstatus", rackHasRedLed ? 'red' : 'green' );
	}
	
	//exapnd the rack icons for every one of them that has a red led
	$( ".iconcontainer" ).each( function () {
		//if any of them contains a red led, show it (even in basic mode)
		if( $( this ).children( ".led.red" ).exists() ) {
			$( this ).show();
		}
	});
	
	//stupid loop to expand all the rows with a red LED in them
	$( "tr" ).each( function ( index, element ) {
		if ( $( element ).find( ".led.red" ).exists() ) {
			$( element ).show();
		}
	});
	
	//general overal led
	setLedColor( "#generaloverallstatusled", $( "#generalstatus .led.red" ).length > 0 ? "1" : "0" );
}

/**
 * This function reads the latest attenuation values from the controller and updates the web interface accordingly
 */
function updateAttenuations(){
	//get the attenuation values from the server
	axshCall(_N("get atu"),function(atu,err){
		if(err){
			setTimeout("updateAttenuations()",ATTENUATION_REREAD_DELAY);
			console.error("Could not get the ATD attribute: "+err);
			return;
		}
		axshCall(_N("get atd"),function(atd,err){
			setTimeout("updateAttenuations()",ATTENUATION_REREAD_DELAY);
			if(err){
				console.error("Could not get the ATD attribute: "+err);
				return;
			}
			atu=split2(atu);
			atd=split2(atd);
			var counter=0;
			for(var r=1;r<=4;r++){
				for(var p=1;p<=4;p++){
					setAttSelect("#rack_"+r+"_poi_ulatt_"+p+"_att",atu[counter]);
					setAttSelect("#rack_"+r+"_poi_dlatt_"+p+"_att",atd[counter]);
					counter++;
				}
			}
		});
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

$(document).ready(function(e) {
    //if the path for the current page contains the string 'nodes'
    if ( /nodes/.test( document.location.toString() ) ) {
        $( '#ola-button' ).hide();
    } else {
        $( '#ola-button' ).show();
    }

	$("div.pagecontainer").append(makeRack(1));
	$("div.pagecontainer").append(makeRack(2));
	$("div.pagecontainer").append(makeRack(3));
	$("div.pagecontainer").append(makeRack(4));
	//removeColumns("rack_1_fom",[2,3,4,5]);
	
	//{{Trying to put dBm on the title bar
	$("div.numerical span.unit").remove();
	for(var r=1;r<=4;r++){
		var dBm=$(document.createElement("span"));
		dBm.css("font-size","75%").text("(dBm)");
		$("tr#rack_"+r+"_fom_rxoptolevel th").append(dBm);
	}
	//}}Trying to put dBm on the title bar

	//assign this code to every node number that is going to be created on this page
	$("a.nodenumber").delegate("click",function(evt){
		gotoPage("/nodes");
	});
	//set the advanced/basic mode
	com.axl.page.detail.update();
	//remove elements for non-existing hardware
	processIhu();
	//and now it's time to initiate the page updation process
	axshCallInterval( sec(  6 ), _N( "get rsp" ), processRsp );
	axshCallInterval( sec( 10 ), _N( "get tel" ), processTel );
	axshCallInterval( sec( 20 ), _N( "nodesw"  ), processNodes);
	axshCallInterval( sec(  8 ), _N( "get ilv" ), processIlv );
	axshCallInterval( sec(  7 ), _N( "get olv" ), processOlv );
	axshCallInterval( sec( 20 ), _N( "get ltg" ), processLtg );
	axshCallInterval( sec( 30 ), _N( "get tag" ), processTag );
	axshCallInterval( sec( 60 ), _N( "get mdl" ), processMdl );
	axshCallInterval( sec( 60 ), _N( "get rid" ), processRid );
	axshCallInterval( sec( 60 ), _N( "get ead 1" ), processEad1 );
	axshCallInterval( sec( 60 ), _N( "get ead 2" ), processEad2 );
	axshCallInterval( sec( 60 ), _N( "get ead 3" ), processEad3 );
	axshCallInterval( sec( 60 ), _N( "get ead 4" ), processEad4 );

	initAttenuationControls();
	updateAttenuations();
});