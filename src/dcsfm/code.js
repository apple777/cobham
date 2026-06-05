//-------------------------------------------------------------------------------------------------
/**
 * This is the control that contains the channel selectors. It has some methods that can be used
 * externally to control its appearance and heavior
 */
radioface={
	//** the key code for detele key
	DELETE_KEY_CODE:46,
	//** the key code for enter key
	ENTER_KEY_CODE:13,
	//** code of the left mouse button
	LEFT_MOUSE_BUTTON:1,
	//** width of the channel selector
	CHANNEL_SELECTOR_WIDTH:16,
	//** maximum number of channels that can exist in the radioface
	NUM_CHANNELS:23,
	//** maximum height of the indicator (the blue rectangle inside the channel selector)
	MAX_INDICATOR_HEIGHT:44,
	//** minimum value for the "top" attribute of the indicator (the blue rectangle inside the channel selector)
	MIN_INDICATOR_TOP:101,
	//** minimum "top" of the threshold (the little red line that shows the threshold on the indicator)
	MIN_THRESHOLD_TOP:99,
	//** maximum "top" of the threshold (the little red line that shows the threshold on the indicator)
	MAX_THRESHOLD_TOP:144,
	//** minimum frequency that is possible on the radioface
	MIN_FREQ:88.0,
	//** maximum frequency that is possible on the radioface
	MAX_FREQ:108.0,
	//** minimum position that a channel selector can be on the radioface. This is the offset from the center of the channel selector to the left side of radioface
	MIN_CH_SELECTOR_POS:80,
	//** maximum position that a channel selector can be on the radioface. This is the offset from the center of the channel selector to the left side of radioface
	MAX_CH_SELECTOR_POS:880,
	//** the id for the radioface control. see initialize()
	id:null,
	//** this is the jquery variable pointing to ratio control it is equal to $(id). see initialize()
	face:null,
	//** returns the channel id of a specific channel number
	getChannelId:function(chNum){
		return "channel-selector-"+chNum;
	},
	//** returns the jquery that point to the channel indicated with a specific channel number
	getChannelJquery:function(chNum){
		return $("#channel-selector-"+chNum);
	},
	//** returns the number for the selected channel or returns 0 if no channel is selected
	getSelectedChannelNum:function(){
		var selector=$(".channel-selector.selected");
		if(selector.size()==0){
			return 0;
		}else if(selector.size()==1){
			return selector.attr("title");
		}else{
			console.error("More than one channel selector happen to be selected!");
			return selector.first().attr("title");
		}
	},
	//** returns the number for the moving channel or returns 0 if no channel is moving
	getMovingChannelNum:function(){
		var selector=$(".channel-selector.moving");
		if(selector.size()==0){
			return 0;
		}else if(selector.size()==1){
			return selector.attr("title");
		}else{
			console.error("More than one channel selector happen to be moving!");
			return selector.first().attr("title");
		}
	},
	//** removes a channel that is indicated with a specific number
	removeChannel:function(chNum){
		if(typeof chNum=="undefined"){
			chNum=radioface.getSelectedChannelNum();
			if(chNum==0){
				axellPopUp("No channel is selected");
			}
		}
		if(confirm("Remove the selected channel?")){
			radioface.getChannelJquery(chNum).hide();
			crf[chNum] = 0;
			crf_changed = true;
			alc[chNum] = -100;
			alc_changed = true;
			$("#apply-changes").removeClass("disabled").addClass("active");
		}
	},
	//** this is the first method from radioface to be called. it initializes the control and creates the channel indicators
	initialize:function(id,numChannels){
		radioface.id=id;
		face=$("#"+id);
		console.log("Radio face initialized. Number of channels: "+numChannels+", Id: "+id);
		if(face.size()!=1)console.error("There is not exactly one instance of radioface ("+face.size()+")");
		//this is a keyboard even handler that allows the user to delete a channel selector by pressing DELETE key and add one by pressing ENTER
		face.keydown(function(e) {
			console.log("Key pressed on radioface: "+e.which);
			switch(e.which){
			case radioface.DELETE_KEY_CODE:
				radioface.removeChannel();
				break;
			case radioface.ENTER_KEY_CODE:
				radioface.addChannel();
				break;				
			}
		});
		//this event handler is called when user double clicks on the radioface. It finds the frequency for the current cursor position and tries to add the channel
		face.dblclick(function(e) {
			var freq=radioface.posToFreq(radioface.posInRadioFace(e.pageX));
			freq=putInLimits(freq,radioface.MIN_FREQ,radioface.MAX_FREQ);
			radioface.addChannel(freq);
		});
		//this event handler is called when user moves the mouse over the radioface. It is responsible for moving the channel selector.
		face.mousemove(function(e){
			var freq=radioface.posToFreq(radioface.posInRadioFace(e.pageX));
			freq=putInLimits(freq,radioface.MIN_FREQ,radioface.MAX_FREQ);
			$("#current-frequency-value").text(freq);
			var movingCh=radioface.getMovingChannelNum();
			if((e.which!=radioface.LEFT_MOUSE_BUTTON)||(movingCh==0))return;
			radioface.moveChannel(movingCh,freq);
		});
		//this event handler is called when the mouse enters radioface
		face.mouseenter(function(e) {
			$("#current-frequency").show();
		});
		//this event handler is called when the mouse leaves radioface
		face.mouseleave(function(e) {
			$("#current-frequency").hide();
		});
		for(var chNum=1;chNum<=radioface.NUM_CHANNELS;chNum++){
			var chId=radioface.getChannelId(chNum);
			var val=newElement("div",chId+"-val","value",chNum);
			var indicator=newElement("div",chId+"-indicator","indicator");
			var threshold=newElement("div",chId+"-threshold","threshold");
			var chSelector=newElement("div",chId,"channel-selector");
			chSelector.append(val,indicator,threshold);
			chSelector.css("z-index",chNum);
			//save the channel number in the tooltip. It will be used later in mouse click.
			chSelector.attr("title",chNum);
			face.append(chSelector);
		}
		console.log("Channel selector width: "+radioface.CHANNEL_SELECTOR_WIDTH);
		
		var $channelSelectors=$(".channel-selector");
		//this event handler is called when the mouse button is just pressed down on a channel selector. It adds the "selected" and "moving" classes to that channel selector
		$channelSelectors.mousedown(function(e) {
			$(".channel-selector.selected").removeClass("selected");
			$(this).addClass("selected moving");
			ch_id=parseInt($(this).attr('id').substring(17));
			current_channel = ch_id;
			var freq=radioface.posToFreq(radioface.posInRadioFace(e.pageX));
			freq=putInLimits(freq,radioface.MIN_FREQ,radioface.MAX_FREQ);
			$("#ch-freq-value").text(freq);
			$("#current-frequency-value").text(freq);
			$("#ch-attenuation-value").val(attenuation[ch_id]);
			$("#alc-level-slider").sliderAxl( "value", alc[ch_id]);
			$("#ch-input-level-value").text(input_level[ch_id]);
		});
		//this event handler is called when the mouse button is just released on a channel selector. It removes the "moving" class from that channel selector
		$channelSelectors.mouseup(function(e) {
			//it remains selected even though not "moving" anymore.
			$(".channel-selector.moving").removeClass("moving");
			var freq=radioface.posToFreq(radioface.posInRadioFace(e.pageX));
			freq=putInLimits(freq,radioface.MIN_FREQ,radioface.MAX_FREQ);
			if ($("#ch-freq-value").text() != freq)
			{
				freq_changed = true;
				$("#apply-changes").removeClass("disabled").addClass("active");
			}
			$("#ch-freq-value").text(freq);
		});
	},
	//** sets the indicator on the channel selector. the value is percentage-based
	setChannelIndicator:function(chNum,percent){
		percent=putInLimits(percent,0,100);
		var height=percent*(radioface.MAX_INDICATOR_HEIGHT)/100;
		var top=radioface.MAX_INDICATOR_HEIGHT-height+radioface.MIN_INDICATOR_TOP;
		var chan=radioface.getChannelJquery(chNum);
		chan.children(".indicator").css("height",height).css("top",top).attr("title",percent+"%");
	},
	//** sets the threshold on a channel selector. the value is percentage-based
	setChannelThreshold:function(chNum,percent){
		percent=putInLimits(percent,0,100);
		var top=radioface.MIN_THRESHOLD_TOP+((100-percent)*(radioface.MAX_THRESHOLD_TOP-radioface.MIN_THRESHOLD_TOP)/100);
		var chan=radioface.getChannelJquery(chNum);
		chan.children(".threshold").css("top",top).attr("title",percent+"%");
	},
	/**
	 * This moves a specified selector to the position that indicates a specified frequency
	 * Note: this function doesn't check if the freq is within the required range
	 */
	moveChannel:function(chNum,freq){
		var chSelector=radioface.getChannelJquery(chNum);
		var centerX=radioface.freqToPos(freq);
		var caption=freq.toString();
		if(caption.indexOf(".")==-1)caption+=".0";
		chSelector.css("left",centerX-(radioface.CHANNEL_SELECTOR_WIDTH/2));
		chSelector.children(".value").text(caption);
	},
	/**
	 * Adds a new channel to the radioface by unhiding one of the available channels
	 * @param freq (optional) where to add the channel
	 */
	addChannel:function(freq){
		if(typeof freq=="undefined"){//if freq is not given ask for it mentioning the range
			freq=prompt("New channel frequency ["+radioface.MIN_FREQ+"-"+radioface.MAX_FREQ+"]");
		}else{//if freq is given, just show it as a confirmation but allow editing as well
			freq=prompt("Adding channel (MHz):",freq);
		}
		//did the user press cancel?
		if(freq===null){
			return;//do nothing!
		}
		freq=parseFloat(freq,10);
		if(isNaN(freq)){
			axellPopUp("Could not convert frequency to a number. Please provide a number between "+radioface.MIN_FREQ+" to "+radioface.MAX_FREQ+" (inclusive)");
			return;
		}else if((freq<radioface.MIN_FREQ)||(freq>radioface.MAX_FREQ)){
			axellPopUp("Please choose a frequency between "+radioface.MIN_FREQ+" and "+radioface.MAX_FREQ);
			return;
		}//check if any selector is available
		var newCh=0;
		for(var i=1;i<=radioface.NUM_CHANNELS;i++){
			if(!radioface.getChannelJquery(i).is(":visible")){
				newCh=i;
				break;
			}
		}
		//check if any selector found
		if(newCh==0){
			axellPopUp("No more channels are available. All "+radioface.NUM_CHANNELS+" channels are used. Please delete or use current channels");
			return;
		}else{
			//ok now we have our selector
			current_channel = newCh;
			$(".channel-selector").removeClass("moving selected");
			radioface.moveChannel(newCh,freq);
			radioface.getChannelJquery(newCh).show().addClass("selected");
			$("#ch-freq-value").text(freq);
			$("#ch-attenuation-value").val(attenuation[newCh]);
			$("#alc-level-slider").sliderAxl( "value", alc[newCh]);
			$("#ch-input-level-value").text(input_level[newCh]);
			crf[newCh] = 1;
			crf_changed = true;
			freq_changed = true;
			$("#apply-changes").removeClass("disabled").addClass("active");
		}
	},
	//** returns the X position of the mouse relative to the left side of the radioface
	posInRadioFace:function(mouseX){
		var position=face.position();
		return mouseX-position.left;	
	},
	//** Converts a mouse X position to frequency
	posToFreq:function(pos){
		return roundToDigits(radioface.MIN_FREQ+((pos-radioface.MIN_CH_SELECTOR_POS)*(radioface.MAX_FREQ-radioface.MIN_FREQ)/(radioface.MAX_CH_SELECTOR_POS-radioface.MIN_CH_SELECTOR_POS)),1);
	},
	//** Converts a frequency to a mouse X position
	freqToPos:function(freq){
		return radioface.MIN_CH_SELECTOR_POS+((freq-radioface.MIN_FREQ)*(radioface.MAX_CH_SELECTOR_POS-radioface.MIN_CH_SELECTOR_POS)/(radioface.MAX_FREQ-radioface.MIN_FREQ));
	}
}
//-------------------------------------------------------------------------------------------------
//** Event handler for when the Add Channel button is pressed
function onAddChannel(){
	radioface.addChannel();
}

//** Event handler for when the Remove Channel button is pressed
function onRemoveChannel(){
	radioface.removeChannel();
}

//** Event handler for when the Apply Changes button is pressed
function onApplyChanges(){
	console.log("Applying changes...");
	if(freq_changed){
		var set = "set ffm";
		for(var i=1;i<=radioface.NUM_CHANNELS;i++){
			if(radioface.getChannelJquery(i).is(":visible"))
				set += " "+i+" "+Math.round(parseFloat(radioface.getChannelJquery(i).children(".value").text())*100);
		}
		axshCall(set,function(out,err){
			if(err) console.error("Could not set ffm: "+err);
		});
	}
	if(crf_changed){
		var set = "set crf";
		for (i=1; i<=24; i++)
			set += " "+i+" "+crf[i];
		axshCall(set,function(out,err){
			if(err) console.error("Could not set crf: "+err);
		});
	}
	if(attenuation_changed){
		var set = "set afm";
		for (i=1; i<=24; i++)
			set += " "+i+" "+attenuation[i];
		axshCall(set,function(out,err){
			if(err) console.error("Could not set afm: "+err);
		});
	}
	if(alc_changed){
		var set = "set lfm";
		for (i=1; i<=24; i++)
			set += " "+i+" "+alc[i];
		axshCall(set,function(out,err){
			if(err) console.error("Could not set lfm: "+err);
		});
	}
	$("#apply-changes").removeClass("active").addClass("disabled");
	axshCall( _N( "get lfm" ), processLfm );
	axshCall( _N( "get afm" ), processAfm );
	axshCall( _N( "get ifm" ), processIfm );
	axshCall( _N( "get crf" ), processCrf );
	axshCall( _N( "get ffm" ), processFfm );
}

var current_channel = -1;
var attenuation = new Array(25);
var attenuation_changed = false;
var input_level = new Array(25);
var crf = new Array(25);
var alc = new Array(25);
var alc_changed = false;
var freq_changed = false;
var crf_changed = false;

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

//** Process the result of GET TEL
function processTel ( out, err ) {
	if(err){
		console.error("Could not read temperatures: "+err);
	}else{
		var e=split2(out);
		$("#systemtemperaturevalue").text(e[0]);
	}
}

//** Process the result of GET TAG
function processTag ( out, err ) {
	if(err){
		console.error("Could not read tag: "+err);
	}else{
		$("#tag-val").text(out);
	}
}

//** Process the result of GET RSP
function processRsp ( out, err ) {
	if(err){
		console.error("Could not read rsp: "+err);
	}else{
		if (out[30]=='1') setLedColor("#systemtemperatureled","red");
		else setLedColor("#systemtemperatureled","green");
		if (out[37]=='1') setLedColor("#door-led","red");
		else setLedColor("#door-led","green");
		if (out[32]=='1') setLedColor("#ext-1-led","red");
		else setLedColor("#ext-1-led","green");
		if (out[33]=='1') setLedColor("#ext-2-led","red");
		else setLedColor("#ext-2-led","green");
		if (out[34]=='1') setLedColor("#ext-3-led","red");
		else setLedColor("#ext-3-led","green");
		if (out[35]=='1') setLedColor("#ext-4-led","red");
		else setLedColor("#ext-4-led","green");

		if ((out[2]=='1') || (out[3]=='1') || (out[4]=='1')) setLedColor("#psu1comm","red");
		else setLedColor("#psu1comm","green");
		if (out[20]=='1') setLedColor("#psu1temp","red");
		else setLedColor("#psu1temp","green");
		if (out[18]=='1') setLedColor("#psu1inputpower","red");
		else setLedColor("#psu1inputpower","green");
		if (out[0]=='1') setLedColor("#psu1battery","red");
		else setLedColor("#psu1battery","green");
		if (out[16]=='1') setLedColor("#psu1pw1","red");
		else setLedColor("#psu1pw1","green");
		if (out[18]=='1') setLedColor("#psu1pw2","red");
		else setLedColor("#psu1pw2","green");
		if (out[20]=='1') setLedColor("#psu1pw3","red");
		else setLedColor("#psu1pw3","green");
		if ((out[22]=='1') || (out[23]=='1') || (out[24]=='1')) setLedColor("#psu1pw4","red");
		else setLedColor("#psu1pw4","green");
		if (out[3]=='1') setLedColor("#refgencomm","red");
		else setLedColor("#refgencomm","green");
		if (out[23]=='1') setLedColor("#refgenpw3","red");
		else setLedColor("#refgenpw3","green");
	}
	setOverallLeds();
}

//** sets the overall leds
function setOverallLeds () {
	setLedColor( "#psu1-overall-led" , $( ".psu1-component div.led.red" ).exists() ? "red" : "green" );
	setLedColor( "#ref-gen-overall-led" , $( ".ref-gen div.led.red" ).exists() ? "red" : "green" );
	setLedColor( "#misc-status-overall-led", $( "#powerstatus div.led.red" ).exists() ? "red" : "green" );
	setLedColor( "#general-status-overall-led", $( "#general-panel-contents div.led.red" ).exists() ? "red" : "green" );
}

//** Process the result of GET CFM
function processCfm ( out, err ) {
	if(err){
		console.error("Could not read cfm: "+err);
	}else{
		$("#cfm-val").text(out);
	}
}

//** Process the result of GET LFM
function processLfm ( out, err ) {
	if(err){
		console.error("Could not read lfm: "+err);
	}else{
		var e=split2(out);
		for(var i=1;i<=24;i++){
			alc[i] = parseInt(e[i*2-1]);
		}
	}
}

//** Process the result of GET AFM
function processAfm ( out, err ) {
	if(err){
		console.error("Could not read afm: "+err);
	}else{
		var e=split2(out);
		for(var i=1;i<=24;i++){
			attenuation[i] = parseInt(e[i*2-1]);
		}
	}
}

//** Process the result of GET IFM
function processIfm ( out, err ) {
	if(err){
		console.error("Could not read ifm: "+err);
	}else{
		var e=split2(out);
		for(var i=1;i<=24;i++)
			input_level[i] = parseFloat(e[i-1]);
	}
}

//** Process the result of GET CRF
function processCrf ( out, err ) {
	if(err){
		console.error("Could not read crf: "+err);
	}else{
		for(var i=1;i<=24;i++)
			crf[i] = out[i-1];
	}
}

//** Process the result of GET FFM
function processFfm ( out, err ) {
	if(err){
		console.error("Could not read ffm: "+err);
	}else{
		var e=split2(out);
		var newCh=1;
		var first=true;
		for(var i=1;i<=24;i++){
			freq = parseFloat(e[i*2-1], 10)/100.0;
			radioface.moveChannel(newCh,freq);
			radioface.getChannelJquery(newCh).removeClass("selected");
			if(first && (freq != 0) && (crf[i] != 0)){
				first = false;
				current_channel = i;
				radioface.getChannelJquery(newCh).show().addClass("selected");
				$("#ch-freq-value").text(freq);
				$("#ch-attenuation-value").val(attenuation[i]);
				$("#alc-level-slider").sliderAxl( "value", alc[i]);
				$("#ch-input-level-value").text(input_level[i]);
			}
			if ((freq != 0) && (crf[i] != 0))
				radioface.getChannelJquery(newCh).show();
			newCh++;
		}
	}
}

//-------------------------------------------------------------------------------------------------
/**
 * This runs when the page is loaded into browser
 */
$(document).ready(function(e) {

	$("#alc-level-slider").sliderAxl( "onchange", function(val) {
		if (alc[current_channel] != Math.round(val))
		{
			alc_changed = true;
			$("#apply-changes").removeClass("disabled").addClass("active");
		}
		alc[current_channel] = Math.round(val);
	});
	$('#ch-attenuation-value').change(function(){
		if (attenuation[current_channel] != $(this).val())
		{
			attenuation_changed = true;
			$("#apply-changes").removeClass("disabled").addClass("active");
		}
		attenuation[current_channel] = $(this).val();
	})
	$("#current-frequency").hide();
	//go to advanced mode in the beginning
	advancedMode();
	// set title by actual Model Name
	axshCall( _N( "get mdl" ), function(out,err){if(!err)title.setTitle("Overview - "+out);});
	
	$("#apply-changes").addClass("disabled");
	
	radioface.initialize("radioface");
	
	axshCallInterval( sec( 10 ), _N( "get tel" ), processTel );
	axshCallInterval( sec( 60 ), _N( "get tag" ), processTag );
	axshCallInterval( sec(  7 ), _N( "get rsp" ), processRsp );
	axshCallInterval( sec( 30 ), _N( "get ead 1" ), processEad1 );
	axshCallInterval( sec( 30 ), _N( "get ead 2" ), processEad2 );
	axshCallInterval( sec( 30 ), _N( "get ead 3" ), processEad3 );
	axshCallInterval( sec( 30 ), _N( "get ead 4" ), processEad4 );
	axshCallInterval( sec( 10 ), _N( "get cfm" ), processCfm );
	axshCall( _N( "get lfm" ), processLfm );
	axshCall( _N( "get afm" ), processAfm );
	axshCall( _N( "get ifm" ), processIfm );
	axshCall( _N( "get crf" ), processCrf );
	axshCall( _N( "get ffm" ), processFfm );
});