/**
 * This function is called whenever a powerbutton is clicked
 * @param updown a string that can be either "up" or "down" standing for uplink or downlink
 * @param band the number for the band that its power is being changed
 */
function onPwrBtn(updown,band){
	var id=null;
	var cmd=null;
	switch(updown.toLowerCase()){
	case "up":
		id="#ul-amp-pwr-"+band;
		cmd="set lvu "+band;
		break;
	case "down":
		id="#dl-amp-pwr-"+band;
		cmd="set lvd "+band;
		break;
	default:
		axellPopUp("The updown parameter has an invalid value: "+updown);
		return;
	}
	var currState=getPwrBtn(id);
	switch(currState){
	case true:
		//button is ON, the user wants to turn it OFF
		if(!confirm("Are you sure you want to turn off the Amplifier?")){
			return;//nothing to do
		}else{
			cmd+=" 0";
			break;
		}
	case false:
		//button is off and user wants to turn it on
		cmd+=" 1";
		break;
	default:
		//the status of the buton is unknown
		axellPopUp("Invalid button state.");
		return;
	}
	axshCall(_N(cmd),function(out,err){
		if(err){
			axellPopUp("Could not set the power: "+err);
			return;
		}else{
			setPwrBtn(id,!currState);
		}			
	});
}

/**
 * This function is called whenever an attenuation value is changed
 * @param band the number for the band that its attenuation is being changed
 */
function onChangeAtu(band){
	function reloadValues(){axshCall(_N("get atu"),processAtu)}
	var selectElement=$("#ul-att-"+band);
	var val=selectElement.val();
	if(confirm("Do you want to change the attenuation to "+val+"?")){
		selectElement.prop("disabled",true);
		axshCall(_N("set atu "+band+" "+val),function(out,err){
			if(err)axellPopUp("Could not set ATU: "+err);
			reloadValues();
			selectElement.prop("disabled",false);
		});
	}else{
		reloadValues();
	}
}

/**
 * This function is called whenever an attenuation value is changed
 * @param band the number for the band that its attenuation is being changed
 */
function onChangeAtd(band){
	function reloadValues(){axshCall(_N("get atd"),processAtd)}
	var selectElement=$("#dl-att-"+band);
	var val=selectElement.val();
	if(confirm("Do you want to change the attenuation to "+val+"?")){
		selectElement.prop("disabled",true);
		axshCall(_N("set atd "+band+" "+val),function(out,err){
			if(err)axellPopUp("Could not set ATD: "+err);
			reloadValues();
			selectElement.prop("disabled",false);
		});
	}else{
		reloadValues();
	}
}

/**
 * This function is executed when the OLA button is pressed for a band.
 * @param number a number from 1 to 4 that indicates the fiber optic number
 */
function onAdjust(number){
	if((number!=1)&&(number!=2)&&(number!=3)&&(number!=4)){
		console.error("Invalid band number passed to onAdjust(): "+number);
	}
	var btnId="#fo"+number+"-ola-adjustment";
	setButtonEnDis(btnId,false);
	axshCall(_N("act ola "+number),function(out,err){
		if(err){
			axellPopUp("Optical Loss Adjustment failed to initialize: "+err);
			setButtonEnDis(btnId,true);
			return;
		}
		axshCall(_N("get ola "+number),function(out,err){
			setButtonEnDis(btnId,true);
			if(err){
				axellPopUp("Could not get OLA attribute: "+err);
				return;
			}
			var successStatus=out.match(/^([01])\s/);
			if(successStatus==null){
				axellPopUp("Could not parse the result of OLA attribute: "+out);
			}else{
				switch(successStatus[1]){
				case "0":
					axellPopUp("Optical loss adjustment finished successfully.");
					break;
				case "1":
					var status=out.match(/\".*?\"/);
					axellPopUp("Optical loss adjustment failed: "+status);
					break;
				default:
					console.error("Error in regular expression when parsing the result of OLA: "+successStatus);
				}
			}
		});
	});
}

/**
 * This function analyzes the output of the RSP attribute and adjusts a lot of LED's accordingly!
 */
function processRsp(out,err){
	if(err){
		console.error("Could not read RSP: "+err);
		return;
	}
	/*
	1:AMD     3:ASD      6:COM        7:CRC     8:MCS        10:PSL      13:PW2          15:PW4         17:RXO    19:RXQ  21:TEM     24:DOO 26:SMT        
	|   2:AMU |   4:BAT   |            |         |       9:PDL | 11:PTM    |    14:PW3     | 16:RBT       |  18:RXP |20:SZP|    23:EX  |      |    27:UMT
	|    |    |    |5:CMM |            |         |        |    | |  12:PW1 |      |        | |            |    |    | |    |22:TXO|    |25:ASU|    |
	|___ |___ |___ | |___ |___________ |________ |_______ |___ | |_ |_____ |_____ |_______ | |___________ |___ |___ | |___ | |___ |___ | |___ |___ |_______
	000- 000- 000- 0 000- 000000-01111 000-0---- 000000-- 000- 0 00 00000- 00000- 00000-0- 0 000-000-0--- 0--- 1--- - 0--- 0 0--- 0000 0 000- 000- 000-000-
	*/
	var e=out.match(/(....) (....) (....) (.) (....) (............) (.........) (........) (....) (.) (..) (......) (......) (........) (.) (............) (....) (....) (.) (....) (.) (....) (....) (.) (....) (....) (........)/);
	if(!e){
		console.error("Could not parse output of get RSP command: '"+out+"'");
		return;
	}
	
	//-------------1. AMD
	setLedColor("#dl-amp-1-led",e[1],0);
	setLedColor("#dl-amp-2-led",e[1],1);
	setLedColor("#dl-amp-3-led",e[1],2);
	setLedColor("#dl-amp-4-led",e[1],3);
	
	//-------------2. AMU
	setLedColor("#ul-amp-1-led",e[2],0);
	setLedColor("#ul-amp-2-led",e[2],1);
	setLedColor("#ul-amp-3-led",e[2],2);
	setLedColor("#ul-amp-4-led",e[2],3);

	//-------------3. ASD
	setLedColor("#dl-amp-sat-1-led",e[3],0);
	setLedColor("#dl-amp-sat-2-led",e[3],1);
	setLedColor("#dl-amp-sat-3-led",e[3],2);
	setLedColor("#dl-amp-sat-4-led",e[3],3);
	
	//-------------4. BAT
	setLedColor("#psu1battery",e[4]);
	
	//-------------5. CMM
	setLedColor("#mcpa-comm-1-led",e[5],0);
	setLedColor("#mcpa-comm-2-led",e[5],1);
	setLedColor("#mcpa-comm-3-led",e[5],2);
	setLedColor("#mcpa-comm-4-led",e[5],3);
	
	//-------------6. COM
	/*
	COM is 12 bytes:
	1. PSUP1 comm
	2. PSUP2 comm
	3. RefGen comm
	4. RadioUnit1 comm
	5. RadioUnit2 comm
	6. RadioUnit3 comm
	7. RadioUnit4 comm
	8. FiberOptic1 comm
	9. FiberOptic2 comm
	10. FiberOptic3 comm
	11. FiberOptic4 comm
	12. Comm.Multiplexer comm
	*/
	setLedColor("#psu1comm",e[6],0);
	setLedColor("#psu2comm",e[6],1);
	setLedColor("#refgencomm",e[6],2);
	setLedColor("#comm-1-led",e[6],3);
	setLedColor("#comm-2-led",e[6],4);
	setLedColor("#comm-3-led",e[6],5);
	setLedColor("#comm-4-led",e[6],6);
	setLedColor("#fo1-comm",e[6],7);
	setLedColor("#fo2-comm",e[6],8);
	setLedColor("#fo3-comm",e[6],9);
	setLedColor("#fo4-comm",e[6],10);
	setLedColor("#commuxcomm",e[6],11);

	//-------------7. CRC
	/*
	CRC is 9 bytes:
	1. RadioUnit1 CRC
	2. RadioUnit2 CRC
	3. RadioUnit3 CRC
	4. RadioUnit4 CRC
	5. FiberOptic1 CRC
	6. FiberOptic2 CRC
	7. FiberOptic3 CRC
	8. FiberOptic4 CRC
	9. Com Mux CRC
	*/
	setLedColor("#firmware-1-led",e[7],0);
	setLedColor("#firmware-2-led",e[7],1);
	setLedColor("#firmware-3-led",e[7],2);
	setLedColor("#firmware-4-led",e[7],3);
	setLedColor("#fo1-firmware",e[7],4);
	setLedColor("#fo2-firmware",e[7],5);
	setLedColor("#fo3-firmware",e[7],6);
	setLedColor("#fo4-firmware",e[7],7);
	setLedColor("#commuxfirmware",e[7],8);
	
	//-------------8. MCS
	setLedColor("#mcpa-fcond-1-led",e[8],0);
	setLedColor("#mcpa-cond-1-led",e[8],1);
	setLedColor("#mcpa-fcond-2-led",e[8],2);
	setLedColor("#mcpa-cond-2-led",e[8],3);
	setLedColor("#mcpa-fcond-3-led",e[8],4);
	setLedColor("#mcpa-cond-3-led",e[8],5);
	setLedColor("#mcpa-fcond-4-led",e[8],6);
	setLedColor("#mcpa-cond-4-led",e[8],7);
	
	//-------------9. PDL
	setLedColor("#dl-pwr-lvl-1-led",e[9],0);
	setLedColor("#dl-pwr-lvl-2-led",e[9],1);
	setLedColor("#dl-pwr-lvl-3-led",e[9],2);
	setLedColor("#dl-pwr-lvl-4-led",e[9],3);
	
	//-------------10. PSL
	setLedColor("#psu1inputpower",e[10]);
	
	//-------------11. PTM
	setLedColor("#psu1temp",e[11],0);
	setLedColor("#psu2temp",e[11],1);
	
	//-------------12. PW1
	setLedColor("#psu1pw1",e[12],0);
	setLedColor("#psu2pw1",e[12],1);
	setLedColor("#pw1-1-led",e[12],2);
	setLedColor("#pw1-2-led",e[12],3);
	setLedColor("#pw1-3-led",e[12],4);
	setLedColor("#pw1-4-led",e[12],5);

	//-------------13. PW2
	setLedColor("#psu1pw2",e[13],0);
	setLedColor("#psu2pw2",e[13],1);
	setLedColor("#pw2-1-led",e[13],2);
	setLedColor("#pw2-2-led",e[13],3);
	setLedColor("#pw2-3-led",e[13],4);
	setLedColor("#pw2-4-led",e[13],5);

	//-------------14. PW3
	setLedColor("#psu1pw3",e[14],0);
	setLedColor("#psu2pw3",e[14],1);
	setLedColor("#pw3-1-led",e[14],2);
	setLedColor("#pw3-2-led",e[14],3);
	setLedColor("#pw3-3-led",e[14],4);
	setLedColor("#pw3-4-led",e[14],5);
	setLedColor("#refgenpw3",e[14],6);
	setLedColor("#commuxpw3",e[14],7);

	//-------------15. PW4
	setLedColor("#psu1pw4",e[15]);

	//-------------16. RBT
	/*
	RBT is 12 bytes:
	1. RadioUnit1
	2. RadioUnit2
	3. RadioUnit3
	4. RadioUnit4
	5. MCPA 1
	6. MCPA 2
	7. MCPA 3
	8. MCPA 4
	9. FiberOptic1
	10. FiberOptic2
	11. FiberOptic3
	12. FiberOptic4
	*/
	setLedColor("#temp-1-led",e[16],0);
	setLedColor("#temp-2-led",e[16],1);
	setLedColor("#temp-3-led",e[16],2);
	setLedColor("#temp-4-led",e[16],3);

	setLedColor("#mcpa-1-temp-led",e[16],4);
	setLedColor("#mcpa-2-temp-led",e[16],5);
	setLedColor("#mcpa-3-temp-led",e[16],6);
	setLedColor("#mcpa-4-temp-led",e[16],7);

	setLedColor("#fo1-temp-led",e[16],8);
	setLedColor("#fo2-temp-led",e[16],9);
	setLedColor("#fo3-temp-led",e[16],10);
	setLedColor("#fo4-temp-led",e[16],11);

	//-------------17. RXO
	setLedColor("#fo1-rxopto-led",e[17],0);
	setLedColor("#fo2-rxopto-led",e[17],1);
	setLedColor("#fo3-rxopto-led",e[17],2);
	setLedColor("#fo4-rxopto-led",e[17],3);
	
	//-------------18. RXP
	setLedColor("#fo1-rcv-pilot-level",e[18],0);
	setLedColor("#fo2-rcv-pilot-level",e[18],1);
	setLedColor("#fo3-rcv-pilot-level",e[18],2);
	setLedColor("#fo4-rcv-pilot-level",e[18],3);

	//-------------19. RXQ
	setLedColor("#rcv-data-quality-led",e[19]);

	//-------------20. SZP
	setLedColor("#fo1-pilotsynth",e[20],0);
	setLedColor("#fo2-pilotsynth",e[20],1);
	setLedColor("#fo3-pilotsynth",e[20],2);
	setLedColor("#fo4-pilotsynth",e[20],3);

	//-------------21. TEM
	setLedColor("#systemtemperatureled",e[21]);

	//-------------22. TXO
	setLedColor("#fo1-txopto-led",e[22],0);
	setLedColor("#fo2-txopto-led",e[22],1);
	setLedColor("#fo3-txopto-led",e[22],2);
	setLedColor("#fo4-txopto-led",e[22],3);

	//-------------23. EXT1/EXT2/EXT3/EXT4
	setLedColor("#ext-1-led",e[23],0);
	setLedColor("#ext-2-led",e[23],1);
	setLedColor("#ext-3-led",e[23],2);
	setLedColor("#ext-4-led",e[23],3);

	//-------------24. DOO
	setLedColor("#door-led",e[24]);

	//-------------25. ASU
	setLedColor("#ul-amp-sat-1-led",e[25],0);
	setLedColor("#ul-amp-sat-2-led",e[25],1);
	setLedColor("#ul-amp-sat-3-led",e[25],2);
	setLedColor("#ul-amp-sat-4-led",e[25],3);

	//-------------26. SMT
	setLedColor("#sys-mute-1-led",e[26],0);
	setLedColor("#sys-mute-2-led",e[26],1);
	setLedColor("#sys-mute-3-led",e[26],2);
	setLedColor("#sys-mute-4-led",e[26],3);

	//-------------27. UMT
	setLedColor("#dl-user-mute-1-led",e[27],0);
	setLedColor("#dl-user-mute-2-led",e[27],1);
	setLedColor("#dl-user-mute-3-led",e[27],2);
	setLedColor("#dl-user-mute-4-led",e[27],3);
	
	setLedColor("#ul-user-mute-1-led",e[27],4);
	setLedColor("#ul-user-mute-2-led",e[27],5);
	setLedColor("#ul-user-mute-3-led",e[27],6);
	setLedColor("#ul-user-mute-4-led",e[27],7);

	//now set the overall leds
	setOverallLeds();
}

/**
 * This function sets the state of the overall LEDs based on the statatus of their related LEDs
 */
function setOverallLeds(){
	//if there is any red leds in this band (only <td> elements), turn the led red otherwise green
	setLedColor("#band1-overall-led",($("td.band1 div.led.red").exists())?"red":"green");
	setLedColor("#band2-overall-led",($("td.band2 div.led.red").exists())?"red":"green");
	setLedColor("#band3-overall-led",($("td.band3 div.led.red").exists())?"red":"green");
	setLedColor("#band4-overall-led",($("td.band4 div.led.red").exists())?"red":"green");

	setLedColor("#fo1-overall-led",($("td.fo1 div.led.red").exists())?"red":"green");
	setLedColor("#fo2-overall-led",($("td.fo2 div.led.red").exists())?"red":"green");
	setLedColor("#fo3-overall-led",($("td.fo3 div.led.red").exists())?"red":"green");
	setLedColor("#fo4-overall-led",($("td.fo4 div.led.red").exists())?"red":"green");

	setLedColor("#commux-overall-led",($(".commux-component div.led.red").exists())?"red":"green");

	setLedColor("#master-psu-overall-led",($("td.psu1-component div.led.red").exists())?"red":"green");

	setLedColor("#slave-psu-overall-led",($("td.psu2-component div.led.red").exists())?"red":"green");

	setLedColor("#ref-gen-overall-led",($("td.ref-gen-component div.led.red").exists())?"red":"green");
	
	//if there is any red led in the contents of the panel, turn this overal led on otherwise green
	setLedColor("#general-status-overall-led",($("#general-status-panel .contents div.led.red").exists())?"red":"green");
	setLedColor("#bands-status-overall-led",($("#bands-status-panel .contents div.led.red").exists())?"red":"green");
	setLedColor("#fo-status-overall-led",($("#fo-status-panel .contents div.led.red").exists())?"red":"green");
	setLedColor("#misc-status-overall-led",($("#misc-status-panel .contents div.led.red").exists())?"red":"green");
	
	/*
	if( $("#general-status-overall-led").hasClass("red") || $("#bands-status-overall-led").hasClass("red") || $("#fo-status-overall-led").hasClass("red") || $("#misc-status-overall-led").hasClass("red") ) {
		setLedColor("#mother-overall-status-led","red");
		$("#mother-overall-status-icon").removeClass().addClass("icon error");
		$("#mother-overall-status-description").text("One or more errors detected");
	} else {
		setLedColor("#mother-overall-status-led","green");
		$("#mother-overall-status-icon").removeClass().addClass("icon ok");
		$("#mother-overall-status-description").text("Status OK");
	}
	*/
	
	var numErr = $( "div.led.red:not(.round)" ).length;
	if ( numErr > 0 ) {
		setBadge( "home-badge", numErr );
	} else {
		setBadge( "home-badge");
	}
	
	//stupid loop to expand all the rows with a red LED in them
	$("tr").each(function(index, element){
		if($(element).find("div.led.red").exists()){
			$(element).show();
		}
	});
}

/**
 * Analyzes the output of the TEL command to set all the tempratures on the GUI
 */
function processTel(out,err){
	if(err){
		console.error("Could not get the TEL attibute: "+err);
		return;
	}
	
	//now try to parse it
	var e=split2(out);
	if(!e){
		console.error("Could not parse output of get TEL command: '"+out+"'");
		return;
	}
	/*
	0. CTRL
	1. PSUP1
	2. PSUP2
	3. Radio Board 1
	4. Radio Board 2
	5. Radio Board 3
	6. Radio Board 4
	7. MCPA1
	8. MCPA2
	9. MCPA3
	10. MCPA4
	11. FOSLAVE1
	12. FOSLAVE2
	13. FOSLAVE3
	14. FOSLAVE4
	*/ 
	
	$("#systemtemperaturevalue").text(e[0]);
	
	//put the temperature values for power supply units on the tooltip of their LED. Not really important.
	$("#psu-1-temp-cell").attr("title",e[1]+"°C");
	$("#psu-2-temp-cell").attr("title",e[2]+"°C");
	
	$("#temp-1-val").text(e[3]);
	$("#temp-2-val").text(e[4]);
	$("#temp-3-val").text(e[5]);
	$("#temp-4-val").text(e[6]);
	
	$("#mcpa-1-temp-val").text(e[7]);
	$("#mcpa-2-temp-val").text(e[8]);
	$("#mcpa-3-temp-val").text(e[9]);
	$("#mcpa-4-temp-val").text(e[10]);
	
	$("#fo1-temp-val").text(e[11]);
	$("#fo2-temp-val").text(e[12]);
	$("#fo3-temp-val").text(e[13]);
	$("#fo4-temp-val").text(e[14]);
}

/**
 * IPL stands for input power level and contains 8 numbers
 */
function processIpl(out,err){
	if(err){
		console.error("Could not get IPL: "+err);
		return;
	}
	/*
	0. IPL UL1
	1. IPL UL2
	2. IPL UL3
	3. IPL UL4
	4. IPL DL1
	5. IPL DL2
	6. IPL DL3
	7. IPL DL4
	*/
	var e=split2(out);
	if(!e){
		console.error("Could not parse IPL: '"+out+"'");
		return;
	}
	$("#ul-input-1-val").text(e[0]);
	$("#ul-input-2-val").text(e[1]);
	$("#ul-input-3-val").text(e[2]);
	$("#ul-input-4-val").text(e[3]);
	$("#dl-input-1-val").text(e[4]);
	$("#dl-input-2-val").text(e[5]);
	$("#dl-input-3-val").text(e[6]);
	$("#dl-input-4-val").text(e[7]);
}
/**
 * OPL stands for output power level and contains 8 numbers.
 */
function processOpl(out,err){
	if(err){
		console.error("Could not get OPL: "+err);
		return;
	}
	/*
	0. OPL UL1
	1. OPL UL2
	3. OPL UL3
	4. OPL UL4
	5. OPL DL1
	5. OPL DL1
	6. OPL DL1
	7. OPL DL1
	*/
	var e=split2(out);
	if(!e){
		console.error("Could not parse OPL: '"+out+"'");
		return;
	}
	$("#ul-output-1-val").text(e[0]);
	$("#ul-output-2-val").text(e[1]);
	$("#ul-output-3-val").text(e[2]);
	$("#ul-output-4-val").text(e[3]);
	$("#dl-output-1-val").text(e[4]);
	$("#dl-output-2-val").text(e[5]);
	$("#dl-output-3-val").text(e[6]);
	$("#dl-output-4-val").text(e[7]);
}
/**
 * OLV stands for optical level and contains 4 numbers.
 */
function processOlv(out,err){
	if(err){
		console.error("Could not get OLV: "+err);
		return;
	}
	/*
	0. OLV1
	1. OLV2
	2. OLV3
	3. OLV4		
	*/
	var e=split2(out);
	if(!e){
		console.error("Could not parse OLV: '"+out+"'");
		return;
	}
	$("#fo1-rxopto-val").text(e[0]);
	$("#fo2-rxopto-val").text(e[1]);
	$("#fo3-rxopto-val").text(e[2]);
	$("#fo4-rxopto-val").text(e[3]);
}
/**
 * OLC stands for optical level compensation and contains 4 numbers.
 */
function processOlc(out,err){
	if(err){
		console.error("Could not get OLC: "+err);
		return;
	}
	/*
	0. OLC1
	1. OLC2
	2. OLC3
	3. OLC4		
	*/
	var e=split2(out);
	if(!e){
		console.error("Could not parse OLC: '"+out+"'");
		return;
	}
	$("#fo1-ola-compensation").text(e[0]);
	$("#fo2-ola-compensation").text(e[1]);
	$("#fo3-ola-compensation").text(e[2]);
	$("#fo4-ola-compensation").text(e[3]);
}

/**
 * Shows the values of the uplink attenuation on screen
 */
function processAtu(out,err){
	if(err){
		console.error("Could not read ATU: "+err);
		return;
	}
	var e=split2(out);
	if(!e){
		console.error("Could not parse the output of the ATU: "+err);
		return;
	}
	//The odd-number elements in the result of ATU are band numbers which are not important. Only the even-number elements are important	
	setAttSelect("#ul-att-1",e[1]);
	setAttSelect("#ul-att-2",e[3]);
	setAttSelect("#ul-att-3",e[5]);
	setAttSelect("#ul-att-4",e[7]);
}

/**
 * Shows the values of the downlink attenuation on screen
 */
function processAtd(out,err){
	if(err){
		console.error("Could not read ATD: "+err);
		return;
	}
	var e=split2(out);
	if(!e){
		console.error("Could not parse the output of the ATD: "+err);
		return;
	}
	//The odd-number elements in the result of ATD are band numbers which are not important. Only the even-number elements are important
	setAttSelect("#dl-att-1",e[1]);
	setAttSelect("#dl-att-2",e[3]);
	setAttSelect("#dl-att-3",e[5]);
	setAttSelect("#dl-att-4",e[7]);
}

/**
 * Sets the OLA LED's
 */
function setOLA(){
	for(var i=1;i<=4;i++){
		axshCall(_N("get ola "+i),{"targetid":"fo"+i+"olaalarm"},function(out,err){
			if(err){
				console.error("Could not get ola: "+err);
				return;
			}else{
				setLedColor(data.targetid,status2led(out));
			}
		});
	}
}

/**
 * Shows the radio system identifier. Other functions wrap it to do the job.
 */
function processRsi(n,out,err){
	if(err){
		console.error("Error when trying to get RSI "+n+": "+err);
		return;
	}else{
		$("#rsysid-"+n).text(out);
	}
}
function processRsi1(out,err){return processRsi(1,out,err);}	
function processRsi2(out,err){return processRsi(2,out,err);}	
function processRsi3(out,err){return processRsi(3,out,err);}	
function processRsi4(out,err){return processRsi(4,out,err);}	

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
 * Shows the uplink output power level using LVU attribute
 */
function processLvu(out,err){
	if(err){
		console.error("Error when trying to get LVU: "+err);
		return;
	}
	var e=split2(out);
	if(!e){
		console.error("Could not parse the output of the LVU: "+err);
		return;
	}
	//The odd-number elements in the result are band numbers which are not important. Only the even-number elements are important
	setPwrBtn("#ul-amp-pwr-1",e[1]);
	setPwrBtn("#ul-amp-pwr-2",e[3]);
	setPwrBtn("#ul-amp-pwr-3",e[5]);
	setPwrBtn("#ul-amp-pwr-4",e[7]);
}

/**
 * Shows the downlink output power level using LVD attribute
 */
function processLvd(out,err){
	if(err){
		console.error("Error when trying to get LVD: "+err);
		return;
	}
	var e=split2(out);
	if(!e){
		console.error("Could not parse the output of the LVD: "+err);
		return;
	}
	//The odd-number elements in the result are band numbers which are not important. Only the even-number elements are important
	setPwrBtn("#dl-amp-pwr-1",e[1]);
	setPwrBtn("#dl-amp-pwr-2",e[3]);
	setPwrBtn("#dl-amp-pwr-3",e[5]);
	setPwrBtn("#dl-amp-pwr-4",e[7]);
}

/**
 * Sets the icon for commux (current communication path)
 */
function processNmp(out,err){
	if(err){
		console.error("Error when trying to get NMP: "+err);
		return;
	}
	var n=out.match(/^([1-4])/);
	switch(n[1]){
	case "1":
		$("#fo1-commux-indicator").removeClass("unused").addClass("used");
		$("#fo2-commux-indicator").removeClass("used").addClass("unused");
		$("#fo3-commux-indicator").removeClass("used").addClass("unused");
		$("#fo4-commux-indicator").removeClass("used").addClass("unused");
	break;
	case "2":
		$("#fo1-commux-indicator").removeClass("used").addClass("unused");
		$("#fo2-commux-indicator").removeClass("unused").addClass("used");
		$("#fo3-commux-indicator").removeClass("used").addClass("unused");
		$("#fo4-commux-indicator").removeClass("used").addClass("unused");
	break;
	case "3":
		$("#fo1-commux-indicator").removeClass("used").addClass("unused");
		$("#fo2-commux-indicator").removeClass("used").addClass("unused");
		$("#fo3-commux-indicator").removeClass("unused").addClass("used");
		$("#fo4-commux-indicator").removeClass("used").addClass("unused");
	break;
	case "4":
		$("#fo1-commux-indicator").removeClass("used").addClass("unused");
		$("#fo2-commux-indicator").removeClass("used").addClass("unused");
		$("#fo3-commux-indicator").removeClass("used").addClass("unused");
		$("#fo4-commux-indicator").removeClass("unused").addClass("used");
	break;
	default:
		axellPopUp("Could not parse the output of the NMP attribute: '"+out+"'");
	}
}

/**
 * Processes the receive pilot tone level
 */
function processPtl(out,err){
	if(err){
		console.error("Error when trying to get PTL: "+err);
		return;
	}
	var e=split2(out);
	$("#fo1-rcv-pilot-val").text(e[0]);
	$("#fo2-rcv-pilot-val").text(e[1]);
	$("#fo3-rcv-pilot-val").text(e[2]);
	$("#fo4-rcv-pilot-val").text(e[3]);
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
	axshCall( _N( "get ltg" ), function ( out, err ) {
		if ( err ) {
			axellPopUp( "Could not read Tag lock status (LTG): " + err );
			return;
		}
		switch ( $.trim( out ) ) {
		case "1":
			if ( !confirm( "Editing the tag is locked. Are you sure you want to unlock it?" ) ) {
				return;
			}
			axshCall( "set ltg 0", function ( out, err ) {
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
			axshCall( "set ltg 1", function ( out, err ) {
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
$(document).ready(function(e) {
	//go to basic mode in the beginning
	basicMode();
	//hide received data quality if it is a slave node
	axshCall(_N("get mdl"),function(out,err){
		if(err){
			//nothing serious, keep showing it anyway
			console.error("Could not get MDL: "+err);
			return;
		}
		console.log("MDL: "+out);
		if(!(/.*?S/i.test(out))){//if model ends with "s" (case insensitive) it is a slave node
			$(".slavespecific").hide();
		}
	});
	axshCall(_N("get aum"),function(out,err){
		if(err){
			//nothing serious, keep showing it anyway
			console.error("Could not get AUM: "+err);
			return;
		}
		switch($.trim(out)){
		case "1":
			console.log("Alarms will be posted for user mute.");
			break;
		case "0":
			console.log("No alarms will be posted for user mute.");
			$("tr#uplinkusermute").remove();
			$("tr#downlinkusermute").remove();
			break;
		default:
			console.error("Unexpected result for get AUM: "+quote(out));
		}
	});
	axshCall(_N("get aus"),function(out,err){
		if(err){
			//nothing serious, keep showing it anyway
			console.error("Could not get AUS: "+err);
			return;
		}
		var e=split2(out," ");
		//0 means no alarm is triggered when uplink amplifier is in saturation.
		//1 means alarm is triggered when uplink amplifier is in saturation.
		if(e[0]=="0")$("#ul-amp-sat-1").text("Disabled");
		if(e[1]=="0")$("#ul-amp-sat-2").text("Disabled");
		if(e[2]=="0")$("#ul-amp-sat-3").text("Disabled");
		if(e[3]=="0")$("#ul-amp-sat-4").text("Disabled");
	});
	axshCall(_N("get rmf"),function(out,err){
		if(err){
			//nothing serious, keep showing it anyway
			console.error("Could not get RMF: "+err);
			return;
		}
		switch($.trim(out)){
		case "1":
			console.log("System mutes can happen.");
			//let's see which chains can have the alarms
			axshCall(_N("get rmo"),function(out,err){
				if(err){
					console.error("Could not get RMO: "+err);
					return;
				}
				var e=split2(out," ");
				//0 means that global mute settings are used.
				//1 means that the global settings will be overridden and the mute functionality is disabled.
				if(e[0]=="1")$("#sys-mute-1").text("Disabled");
				if(e[1]=="1")$("#sys-mute-2").text("Disabled");
				if(e[2]=="1")$("#sys-mute-3").text("Disabled");
				if(e[3]=="1")$("#sys-mute-4").text("Disabled");
			});
			break;
		case "0":
			//no mute will happen in any of the chains
			console.log("No mute will happen in any of the chains.");
			$("tr#systemmute").remove();
			break;
		default:
			console.error("Unexpected result for get RMF: "+quote(out));
		}
	});
	//get page layout
	axshCall(_N("get ihu"),function(out,err){
		if(err){
			axellPopUp("Cannot read page layout. Please make sure you are connected to the repeater then refresh the page: "+err);
			return;
		}
		/**this small utility function takes care of a class of devices based on their IHU value*/
		function devicePresent(index,classSelector){
			switch(out.charAt(index)){
				case "1":break;//do nothing
				case "0":$(classSelector).remove();break;
				default:axellPopUp("An erronous character appeared in the output of IHU: "+out+", index= "+index);
			}
		}
		/* result of IHU has the following format:
		0. PSUP1
		1. PSUP2
		2. RefGen
		3. RadioUnit1
		4. RadioUnit2
		5. RadioUnit3
		6. RadioUnit4
		7. FiberOptic1
		8. FiberOptic2
		9. FiberOptic3
		10. FiberOptic4
		11. Communications Multiplexer
		*/
		devicePresent(0,".psu1-component");
		devicePresent(1,".psu2-component");
		devicePresent(2,".ref-gen-component");
		devicePresent(3,".band1");
		devicePresent(4,".band2");
		devicePresent(5,".band3");
		devicePresent(6,".band4");
		devicePresent(7,".fo1");
		devicePresent(8,".fo2");
		devicePresent(9,".fo3");
		devicePresent(10,".fo4");
		devicePresent(11,".commux-component");
		
		//ok now schedule repeated commands:
		axshCallInterval(2500,_N("get rsp"),processRsp);
		axshCallInterval(2500,_N("get tel"),processTel);
		axshCallInterval(3000,_N("get ipl"),processIpl);
		axshCallInterval(3000,_N("get opl"),processOpl);
		axshCallInterval(3000,_N("get olv"),processOlv);
		axshCallInterval(3000,_N("get olc"),processOlc);
		axshCallInterval(9000,_N("get ptl"),processPtl);
		axshCallInterval(30000,_N("get rsi 1"),processRsi1);
		axshCallInterval(30000,_N("get rsi 2"),processRsi2);
		axshCallInterval(30000,_N("get rsi 3"),processRsi3);
		axshCallInterval(30000,_N("get rsi 4"),processRsi4);
		axshCallInterval(30000,_N("get ead 1"),processEad1);
		axshCallInterval(30000,_N("get ead 2"),processEad2);
		axshCallInterval(30000,_N("get ead 3"),processEad3);
		axshCallInterval(30000,_N("get ead 4"),processEad4);
		axshCallInterval(6500,_N("get atu"),processAtu);
		axshCallInterval(6600,_N("get atd"),processAtd);
		axshCallInterval(10500,_N("get lvu"),processLvu);
		axshCallInterval(10600,_N("get lvd"),processLvd);
		axshCallInterval(8000,_N("get nmp"),processNmp);
		axshCallInterval( sec( 5 ), _N( "get ltg" ), processLtg );
		axshCallInterval( sec( 30 ), _N( "get tag" ), processTag );
	});
});