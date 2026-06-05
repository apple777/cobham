	require([ '/general/general.js', '/js/console.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/assign.js', '/js/util.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js', '/js/lib/handlebars.js', '/js/handlebars-helpers.js', '/js/led.js','/js/lib/tipsy.js' ],
		function ( general, console, api, scheduler, convert, assign, util, $, _ ) {
			var USERNAME = $.cookie('username');
			var USERACCESS = $.cookie('userAccess');
			//load the general panel
			general.init( '#general-panel-placeholder' );

			//apply the template
			Handlebars.replaceTemplate( '#ic-status-template', { "odd-band": [1,3,5,7,9,11,13,15],"even-band": [2,4,6,8,10,12,14,16]} );
	//        Handlebars.replaceTemplate( '#activity-tbl-template', { "odd-band": [1,3,5,7,9,11,13,15],"even-band": [2,4,6,8,10,12,14,16]} );

			var activePorts = [];
		
			var hisLOS = [];
			var hisLOF = [];
			var hisRAI = [];

			var cpri_advanced = false;
			var cpriforceValues = {'0':'Disable','1':'Enable'};

			$( '#basic-btn' ).click( function () {
				$( '.advanced' ).hide();
				$( '.cpri_advanced' ).hide();
				return false;
			});

			$( '#advanced-btn' ).click( function () {
				if(USERNAME !== 'sysadmin') {
					$("tr#cpriforce").addClass('none');
				} else {
					$("tr#cpriforce").removeClass('none');
				}
				$( '.advanced' ).show();
				return false;
			});

			$( '.advanced' ).hide();
			$('#header').hide();
			$( '.cpri_advanced' ).hide();
		
			$(document).on('click','.cpri_show',function(){
				if(cpri_advanced == false){
					$( '.cpri_advanced' ).show();
					cpri_advanced = true;
					RefreshCpriAlarms();
				}
				else{
					$( '.cpri_advanced' ).hide();
					cpri_advanced = false;
				}
				return false;
			});

         $("#cpri_reset").click(function(e){	
            api.exe({
               cmd: 'measurements cpri clear',
               onSuccess: function (o)
               {
                 console.log("CPRI History Reset");
               },
               onError: function ()
               {
                 console.log(err.errorThrown);
               }
            });
         });
		
			scheduler.add( sec(20), {
				cmd: 'measurements dump env --json',
				callOnDiff:true,
				onSuccess:function(o){
					//refresh everything
	//                $('.deactivate_cell').empty();

					var envMeas = $.parseJSON(o.ajaxdata);

					setLedColor("#tem-led", 			envMeas.TEMP_FPGA_1_ALRM);

					// Clocks
					setLedColor("#ic-recovered-clock",	envMeas.SZR_FPGACL1_1_ALRM);
					setLedColor("#clock-main-led",		envMeas.SZR_MAINCL1_1_ALRM);
					setLedColor("#clock-eth-led",		envMeas.SZR_ETHCLK1_1_ALRM);

					// Power Alarms
					setLedColor("#1V0-led",				envMeas.PW9_PMU_1_ALRM);
					setLedColor("#1V5-led",				envMeas.PW8_PMU_1_ALRM);
					setLedColor("#1V8-led",				envMeas.PW7_PMU_1_ALRM);
					setLedColor("#2V5-led",				envMeas.PW6_PMU_1_ALRM);
					setLedColor("#5V0-led",				envMeas.PW4_PMU_1_ALRM);
					setLedColor("#12V0_1-led",			envMeas.PW2_PMU_1_ALRM);
					setLedColor("#12V0_2-led",			envMeas.PW2_PMU_2_ALRM);
					setLedColor("#24V0-led",			envMeas.PW1_PMU_1_ALRM);

					// Current Alarms
					setLedColor("#current1-led",		envMeas.CU1_PMU_1_ALRM);
					setLedColor("#current2-led",		envMeas.CU2_PMU_1_ALRM);

					// Power Levels				
					$('#1V0-val').text(					envMeas.PW9_PMU_1);
					$('#1V5-val').text(					envMeas.PW8_PMU_1);
					$('#1V8-val').text(					envMeas.PW7_PMU_1);
					$('#2V5-val').text(					envMeas.PW6_PMU_1);
					$('#5V0-val').text(					envMeas.PW4_PMU_1);
					$('#12V0_1-val').text(				envMeas.PW2_PMU_1);
					$('#12V0_2-val').text(				envMeas.PW2_PMU_2);
					$('#24V0-val').text(				envMeas.PW1_PMU_1);

					// Current Levels
					$('#current1-val').text(			envMeas.CU1_PMU_1);
					$('#current2-val').text(			envMeas.CU2_PMU_1);

					// FPGA Power Supply Alarms
					setLedColor("#Int-led",				envMeas.PW9_FPGA_INT_ALRM);
					setLedColor("#Aux-led",				envMeas.PW7_FPGA_AUX_ALRM);
					setLedColor("#BRAM-led",			envMeas.PW9_FPGA_BRAM_ALRM);
					setLedColor("#PINT-led",			envMeas.PW9_FPGA_PINT_ALRM);
					setLedColor("#PAUX-led",			envMeas.PW7_FPGA_PAUX_ALRM);
					setLedColor("#O_DDR-led",			envMeas.PW8_FPGA_O_DDR_ALRM);

					// FPGA Power Supply Values
					$('#Int-val').text(					envMeas.PW9_FPGA_INT);
					$('#Aux-val').text(					envMeas.PW7_FPGA_AUX);
					$('#BRAM-val').text(				envMeas.PW9_FPGA_BRAM);
					$('#PINT-val').text(				envMeas.PW9_FPGA_PINT);
					$('#PAUX-val').text(				envMeas.PW7_FPGA_PAUX);
					$('#O_DDR-val').text(				envMeas.PW8_FPGA_O_DDR);

					//add in explanation for link state
					$('.icon.m-up').attr("title","Link up as master");
					$('.icon.m-init').attr("title","Link is in initialization phase to be brought up as master");
					$('.icon.s-down').attr("title","Indicating no link up as slave");
					$('.icon.m-down').attr("title","Indicating no link up as master");
					$('.icon.s-up').attr("title","Link up as slave");
					$('.icon.s-init').attr("title","Link is in initialization phase to be brought up as slave");
					$('.icon.m-err').attr("title","Link has been up as master link, but is now in error");
					$('.icon.s-err').attr("title","Link has been up as slave link, but is now in error");
					$('.icon.m-lost').attr("title","Link is temporarily lost");
					$('.icon.s-lost').attr("title","Link is temporarily lost");
					$('.icon.m-estb').attr("title","Link has been lost and is re-negotiating");
					$('.icon.s-estb').attr("title","Link has been lost and is re-negotiating");
					$('.icon.deactivated').attr("title","The SFP+ is deactivated");

				}
			});



         function logEvent(atrr, text){
            var event_cmd="alarms eventoper " + $.cookie('currentOperator') + " " + atrr + " " + text;
            api.exe({
	            cmd: event_cmd,
	            async: false,
	            onSuccess: function (EOC) {
	            }
            })
         }

			function RefreshCpriAlarms()
			{
				api.exe({
					cmd: 'measurements dump cpri --json',
					dataType: 'json',
					onSuccess: function (o) {
						// parse SFP Data
						var cpriAlarms = o.ajaxdata;

						// go over all SFPs
						$.each(cpriAlarms.CPRIs,function(key, value){
                     var x = new Date(value.timestamp*1000);
                     $("#cpri_timestamp").text(x.getUTCDate() + "/" + (x.getUTCMonth()+1) + "/" + x.getUTCFullYear() + " " + x.getUTCHours() + ":" + x.getUTCMinutes());
							if(activePorts.length == 0){
								setLedColor("#ic" + value.id + "-CpriCurLOS", "grey");
								setLedColor("#ic" + value.id + "-CpriCurLOF", "grey");
								setLedColor("#ic" + value.id + "-CpriCurRAI", "grey");

                        $("#ic" + value.id + "-CpriHisLOS").text("");
                        $("#ic" + value.id + "-CpriHisLOF").text("");
                        $("#ic" + value.id + "-CpriHisRAI").text("");
								//setLedColor("#ic" + value.id + "-CpriHisLOS", "grey");
								//setLedColor("#ic" + value.id + "-CpriHisLOF", "grey");
								//setLedColor("#ic" + value.id + "-CpriHisRAI", "grey");
								hisLOS[value.id] = -1;
								hisLOF[value.id] = -1;
								hisRAI[value.id] = -1;
							}
							else{
								if(activePorts[value.id] == true){
									setLedColor("#ic" + value.id + "-CpriCurLOS", value.curLOS);
									setLedColor("#ic" + value.id + "-CpriCurLOF", value.curLOF);
									setLedColor("#ic" + value.id + "-CpriCurRAI", value.curRAI);

									if ((hisLOS[value.id] == null) || (hisLOS[value.id] == -1)) 
										hisLOS[value.id] = value.hisLOS;
									else if (value.curLOS == "2") 
										hisLOS[value.id] = 2;

									if ((hisLOF[value.id] == null) || (hisLOF[value.id] == -1)) 
										hisLOF[value.id] = value.hisLOF;
									else if (value.curLOF == "2") 
										hisLOF[value.id] = 2;
									
									if ((hisRAI[value.id] == null) || (hisRAI[value.id] == -1)) 
										hisRAI[value.id] = value.hisRAI;
									if (value.curRAI == "2") 
										hisRAI[value.id] = 2;
									
                           $("#ic" + value.id + "-CpriHisLOS").text(value.hisLOS);
                           $("#ic" + value.id + "-CpriHisLOF").text(value.hisLOF);
                           $("#ic" + value.id + "-CpriHisRAI").text(value.hisRAI);
									//setLedColor("#ic" + value.id + "-CpriHisLOS", hisLOS[value.id]);
									//setLedColor("#ic" + value.id + "-CpriHisLOF", hisLOF[value.id]);
									//setLedColor("#ic" + value.id + "-CpriHisRAI", hisRAI[value.id]);
								}
								else {
									setLedColor("#ic" + value.id + "-CpriCurLOS", "grey");
									setLedColor("#ic" + value.id + "-CpriCurLOF", "grey");
									setLedColor("#ic" + value.id + "-CpriCurRAI", "grey");

                           $("#ic" + value.id + "-CpriHisLOS").text("");
                           $("#ic" + value.id + "-CpriHisLOF").text("");
                           $("#ic" + value.id + "-CpriHisRAI").text("");
									//setLedColor("#ic" + value.id + "-CpriHisLOS", "grey");
									//setLedColor("#ic" + value.id + "-CpriHisLOF", "grey");
									//setLedColor("#ic" + value.id + "-CpriHisRAI", "grey");
									hisLOS[value.id] = -1;
									hisLOF[value.id] = -1;
									hisRAI[value.id] = -1;
								}
							}
						})
						if(cpri_advanced == true){
							setTimeout(function(){ RefreshCpriAlarms(); }, 1000);
						}
					}
				});
			}


//			setTimeout(function(){ RefreshCpriAlarms(); }, 2000);	   

			scheduler.add( sec(20), {

				cmd: 'measurements dump sfp --json',
				callOnDiff:true,
				onSuccess:function(o){

					// parse SFP Data
					var sfpMeas = $.parseJSON(o.ajaxdata);

					// Remove Clear buttons
					$('.deactivate_cell').empty();
					$('.linkstate_cell').empty();

					// set Enable/Disable CPRI ports controllers
               api.exe({
                  cmd: "linkstatus --json",
                  dataType: 'json',
                  async: false,
                  onSuccess: function (e) {
                      $.each(e.ajaxdata.linkstatus, function (i, value) {
	                     if(value["Link State"] != "-")
							      $('select#ic' + value.Link + '-cpriforce').val(1);
	                     else
							      $('select#ic' + value.Link + '-cpriforce').val(0);
                      })
                  }
               })

					// go over all SFPs
					$.each(sfpMeas.sfps,function(key, value){
						// for overall led
						var errorOnSfp = false;
						// add logic port number 0-15 for inputs
						$('#ic' + value.id + '-cpriforce').attr('data-id', value.id-1);
						
						// SFP is connected, and remote device is connected
						if((value.abs ==="0") && (value.remoteSerial != "")){

                     var val;

							activePorts[value.id] = true;
							// Add Clear Button
							if(USERACCESS != "RO")
							{
							   $('#ic' + value.id + '_deactivate_cell').append('<a id="'+value.id+'-disable-mod" class="button disable_module" data-moduleid='+value.id+'> Clear </a>' +
								 '<div class="icon help" title="Clear Port Alarms"></div>');
							}

							// set Serial and Type text and link to device
							$('#ic'+value.id+'-ser').text(value.remoteSerial + " - " + value.remoteType);

							var remIp = value.remoteIP.split(".");
                     var k = parseInt(remIp[0]);
                     var s = parseInt(remIp[1]);
							var URL = "http://" + window.location.hostname;
                     if(k > 0){
                        var port = 10000 + ((k-2)*256) + s;
							   URL = URL + ":" + port;
                     }

							var a = document.createElement('a');
							a.href = URL;
							a.target = "_blank";						

							var serialLink = document.getElementById('ic'+value.id+'-ser');
							serialLink.appendChild(a).appendChild(a.previousSibling);

							// set Installed & Supported indicators
							$('#ic' + value.id + '-ism').removeClass('unused').addClass('used');

							// set Communication indicator
							if(value.wave === "0"){
								setLedColor('#ic'+value.id+'-comm',"red");
								errorOnSfp = true;
							}
							else{
								setLedColor('#ic'+value.id+'-comm',"green");
							}

							// set SFP Rx Led & Value
							var Rx = value.Rx.split(" ");
                     val = Rx[0];
                     if((val < -100) || (val > 100))
                        val = "-";
							$('#ic'+value.id+'-rxopto-val').text(val);
							if((Rx[1] == "0")&&(Rx[2] == "0")){
								setLedColor('#ic'+value.id+'-rxopto-led',"green");
							}
							else{
								errorOnSfp = true;
								setLedColor('#ic'+value.id+'-rxopto-led',"red");
							}

							// set SFP Tx Led & Value
							var Tx = value.Tx.split(" ");
                     val = Tx[0];
                     if((val < -100) || (val > 100))
                        val = "-";
							$('#ic'+value.id+'-txopto-val').text(val);
							if((Tx[1] == "0")&&(Tx[2] == "0")){
								setLedColor('#ic'+value.id+'-txopto-led',"green");
							}
							else{
								errorOnSfp = true;
								setLedColor('#ic'+value.id+'-txopto-led',"red");
							}

                     val = value.rxLos;
                     if((val < -100) || (val > 100))
                        val = "-";
							$('#ic'+value.id+'-rxloss-val').text(val);
                     val = value.txLos;
                     if((val < -100) || (val > 100))
                        val = "-";
							$('#ic'+value.id+'-txloss-val').text(val);

							// set SFP Temperature Led & Value
							var Temp = value.Temp.split(" ");
                     val = Temp[0];
                     if((val < -100) || (val > 100))
                        val = "-";
							$('#ic'+value.id+'-temp-val').text(val);
							if((Temp[1] == "0")&&(Temp[2] == "0")){
								setLedColor('#ic'+value.id+'-temp-led',"green");
							}
							else{
								errorOnSfp = true;
								setLedColor('#ic'+value.id+'-temp-led',"red");
							}

							// set SFP Power Led & Value
							var Vcc = value.Vcc.split(" ");
                     val = Vcc[0];
                     if((val < -100) || (val > 100))
                        val = "-";
							$('#ic'+value.id+'-power-val').text(val);
							if((Vcc[1] == "0")&&(Vcc[2] == "0")){
								setLedColor('#ic'+value.id+'-power-led',"green");
							}
							else{
								errorOnSfp = true;
								setLedColor('#ic'+value.id+'-power-led',"red");
							}

							// set SFP Current Led & Value
							var Bias = value.Bias.split(" ");
                     val = Bias[0];
                     if((val < -100) || (val > 100))
                        val = "-";
							$('#ic'+value.id+'-current-val').text(val);
							if((Bias[1] == "0")&&(Bias[2] == "0")){
								setLedColor('#ic'+value.id+'-current-led',"green");
							}
							else{
								errorOnSfp = true;
								setLedColor('#ic'+value.id+'-current-led',"red");
							}

							// set SFP Digital length in meter or kilometer
							dlink = parseInt(value.cpriDelay);
							if (dlink <= 0){
	 							$('#ic'+value.id+'-cpriDelay').text("-");
	 						//less than	1000	
							}else if (dlink < 1000){
	 							$('#ic'+value.id+'-cpriDelay').text(dlink + " m");
							//greater than 1000
							}else if (dlink > 1000){
	 							 $('#ic'+value.id+'-cpriDelay').text(dlink/1000 + " km");
							}else if (dlink == null){
	 							$('#ic'+value.id+'-cpriDelay').text("-");
							}else{
	 							$('#ic'+value.id+'-cpriDelay').text(dlink + " m");
							}

							if (value.wave > 0)
								$('#ic'+value.id+'-wave').text(value.wave + " nm");

							// set link status indicator
							switch(value.Up) {
								case "M_UP":
									$('#ic' + value.id + '-linkst').append('<div class="icon m-up"></div>');
									setLedColor('#ic'+value.id+'-digi',"green");
									break;
								case "S_UP":
									$('#ic' + value.id + '-linkst').append('<div class="icon s-up"></div>');
									setLedColor('#ic'+value.id+'-digi',"green");
									break;
								case "M_INIT":
									$('#ic' + value.id + '-linkst').append('<div class="icon m-init"></div>');
									setLedColor('#ic'+value.id+'-digi',"red");
									errorOnSfp = true;
									break;
								case "S_INIT":
									$('#ic' + value.id + '-linkst').append('<div class="icon s-init"></div>');
									setLedColor('#ic'+value.id+'-digi',"red");
									errorOnSfp = true;
									break;
								case "M_DOWN":
									$('#ic' + value.id + '-linkst').append('<div class="icon m-down"></div>');
									setLedColor('#ic'+value.id+'-digi',"red");
									errorOnSfp = true;
									break;
								case "S_DOWN":
									$('#ic' + value.id + '-linkst').append('<div class="icon s-down"></div>');
									setLedColor('#ic'+value.id+'-digi',"red");
									errorOnSfp = true;
									break;
								default:
									$('#ic' + value.id + '-linkst').append('<div class="icon m-err"></div>');
									setLedColor('#ic'+value.id+'-digi',"red");
									errorOnSfp = true;
									break;
							}

							// set opacity for active SFP section
							$('td.ic' + value.id + ',th.ic' + value.id).children().css("opacity", "1", "important");

							// set overall indicator
							if(errorOnSfp == true){
								setLedColor('#ic'+value.id+'-overall-led',"red");
							}
							else{
								setLedColor('#ic'+value.id+'-overall-led',"green");							
							}

							// SFP is connected, and remote device is connected. set column disabled color (opacity)
							if((value.Up === "NO_MODULE") && (errorOnSfp == true)){
								setLedColor('#ic'+value.id+'-rxopto-led',"grey");
								setLedColor('#ic'+value.id+'-txopto-led',"grey");
								setLedColor('#ic'+value.id+'-temp-led',"grey");
								setLedColor('#ic'+value.id+'-power-led',"grey");
								setLedColor('#ic'+value.id+'-current-led',"grey");
								$('#ic'+value.id+'-temp-val').text("");
								$('#ic'+value.id+'-power-val').text("");
								$('#ic'+value.id+'-current-val').text("");
								$('#ic'+value.id+'-txopto-val').text("");
								$('#ic'+value.id+'-rxopto-val').text("");
								$('#ic'+value.id+'-txloss-val').text("");
								$('#ic'+value.id+'-rxloss-val').text("");

								$('td.ic' + value.id + ',th.ic' + value.id).children().css("opacity", "0.3", "important");
							}

					}//end of if SFP is connected, and remote device is connected
					else{
						// SFP is not connected
						if ((value.abs ==="0") || ((value.abs ==="1") && (value.wasUp ==="0"))){
							activePorts[value.id] = false;

							setLedColor('#ic'+value.id+'-overall-led',"grey");
							setLedColor('#ic'+value.id+'-digi',"grey");
							setLedColor('#ic'+value.id+'-comm',"grey");

							setLedColor('#ic'+value.id+'-overall-led',"grey");

							setLedColor('#ic'+value.id+'-rxopto-led',"grey");
							setLedColor('#ic'+value.id+'-txopto-led',"grey");
							setLedColor('#ic'+value.id+'-temp-led',"grey");
							setLedColor('#ic'+value.id+'-power-led',"grey");
							setLedColor('#ic'+value.id+'-current-led',"grey");

							$('#ic'+value.id+'-temp-val').text("");
							$('#ic'+value.id+'-power-val').text("");
							$('#ic'+value.id+'-current-val').text("");
							$('#ic'+value.id+'-txopto-val').text("");
							$('#ic'+value.id+'-rxopto-val').text("");
							$('#ic'+value.id+'-txloss-val').text("");
							$('#ic'+value.id+'-rxloss-val').text("");

							$('td.ic' + value.id + ',th.ic' + value.id).children().css("opacity", "0.3", "important");

							$('#ic' + value.id + '-ism').removeClass('icon');
						}
						// SFP is connected, but no Link
						else{
							activePorts[value.id] = true;

							if(value.wasUp === "1"){
								setLedColor('#ic'+value.id+'-overall-led',"red");
								setLedColor('#ic'+value.id+'-digi',"red");

								// set Communication indicator
								if(value.wave === "0"){
									setLedColor('#ic'+value.id+'-comm',"red");
								}
								else{
									setLedColor('#ic'+value.id+'-comm',"green");
								}

								// set Installed & Supported indicators
								$('#ic' + value.id + '-ism').removeClass('unused').addClass('used');
								$('#ic'+value.id+'-ser').text(value.remoteSerial + " - " + value.remoteType);
								setLedColor('#ic'+value.id+'-digi',"red");

								// set SFP Rx Led & Value
								var Rx = value.Rx.split(" ");
								$('#ic'+value.id+'-rxopto-val').text(Rx[0]);
								if((Rx[1] == "0")&&(Rx[2] == "0")){
									setLedColor('#ic'+value.id+'-rxopto-led',"green");
								}
								else{
									errorOnSfp = true;
									setLedColor('#ic'+value.id+'-rxopto-led',"red");
								}

								// set SFP Tx Led & Value
								var Tx = value.Tx.split(" ");
								$('#ic'+value.id+'-txopto-val').text(Tx[0]);
								if((Tx[1] == "0")&&(Tx[2] == "0")){
									setLedColor('#ic'+value.id+'-txopto-led',"green");
								}
								else{
									errorOnSfp = true;
									setLedColor('#ic'+value.id+'-txopto-led',"red");
								}

								$('#ic'+value.id+'-rxloss-val').text(value.rxLos);
								$('#ic'+value.id+'-txloss-val').text(value.txLos);

								// set SFP Temperature Led & Value
								var Temp = value.Temp.split(" ");
								$('#ic'+value.id+'-temp-val').text(Temp[0]);
								if((Temp[1] == "0")&&(Temp[2] == "0")){
									setLedColor('#ic'+value.id+'-temp-led',"green");
								}
								else{
									errorOnSfp = true;
									setLedColor('#ic'+value.id+'-temp-led',"red");
								}

								// set SFP Power Led & Value
								var Vcc = value.Vcc.split(" ");
								$('#ic'+value.id+'-power-val').text(Vcc[0]);
								if((Vcc[1] == "0")&&(Vcc[2] == "0")){
									setLedColor('#ic'+value.id+'-power-led',"green");
								}
								else{
									errorOnSfp = true;
									setLedColor('#ic'+value.id+'-power-led',"red");
								}

								// set SFP Current Led & Value
								var Bias = value.Bias.split(" ");
								$('#ic'+value.id+'-current-val').text(Bias[0]);
								if((Bias[1] == "0")&&(Bias[2] == "0")){
									setLedColor('#ic'+value.id+'-current-led',"green");
								}
								else{
									errorOnSfp = true;
									setLedColor('#ic'+value.id+'-current-led',"red");
								}

								$('td.ic' + value.id + ',th.ic' + value.id).children().css("opacity", "0.6", "important");

								// set link status indicator
								switch(value.Up) {
									case "M_UP":
										$('#ic' + value.id + '-linkst').append('<div class="icon m-up"></div>');
										setLedColor('#ic'+value.id+'-digi',"green");
										break;
									case "S_UP":
										$('#ic' + value.id + '-linkst').append('<div class="icon s-up"></div>');
										setLedColor('#ic'+value.id+'-digi',"green");
										break;
									case "M_INIT":
										$('#ic' + value.id + '-linkst').append('<div class="icon m-init"></div>');
										setLedColor('#ic'+value.id+'-digi',"red");
										errorOnSfp = true;
										break;
									case "S_INIT":
										$('#ic' + value.id + '-linkst').append('<div class="icon s-init"></div>');
										setLedColor('#ic'+value.id+'-digi',"red");
										errorOnSfp = true;
										break;
									case "M_DOWN":
										$('#ic' + value.id + '-linkst').append('<div class="icon m-down"></div>');
										setLedColor('#ic'+value.id+'-digi',"red");
										errorOnSfp = true;
										break;
									case "S_DOWN":
										$('#ic' + value.id + '-linkst').append('<div class="icon s-down"></div>');
										setLedColor('#ic'+value.id+'-digi',"red");
										errorOnSfp = true;
										break;
									default:
										$('#ic' + value.id + '-linkst').append('<div class="icon m-err"></div>');
										setLedColor('#ic'+value.id+'-digi',"red");
										errorOnSfp = true;
										break;
								}
							}
						}
					}

					//set overall status for each module
					if(value.Installed==="YES") {
						if(value.Supported==="YES") {
							if($("#ic-status .ic" + value.No + " .led.red:not(.round)").length > 0) {
								// We've found a red led somewhere, let's set overall status to red.
								setLedColor("#ic" + value.No + "-overall-led", "red");
							} else {
								// Everything looks fine.
								setLedColor("#ic" + value.No + "-overall-led", "green");
							}
						} else {
							// Someone tried to be smart and buy their own module, let's set overall status red.
							setLedColor("#ic" + value.No + "-overall-led", "red");
							if(value.No %2 === 0){
								$('tr#supported2').show();
							}else{
								$('tr#supported1').show();
							}
						}
					}else {
						// No module installed, no LED to twinkle.
						setLedColor("#ic" + value.No + "-overall-led", "grey");
					}
				})
			}
		});
		//on event of click to disable module
		$(document).on('click','.disable_module',function(){
			var $this = $(this);
			if(!$this.hasClass('disabled')){
				api.exe({
					cmd:'deactivate_sfp '+$this.attr('data-moduleid'),
					onSuccess:function(){
						hisLOS[$this.attr('data-moduleid')] = -1;
						hisLOF[$this.attr('data-moduleid')] = -1;
						hisRAI[$this.attr('data-moduleid')] = -1;
					},
					onError:function(err){
						axellPopUp(err.errorThrown);
					}
				})
			}
		})

        $.each(cpriforceValues,function(i, val){
            $( "[name$='-cpriforce']" ).append($('<option>', {
                value: i,
                text : val
            }));
        })

		//on event of change set Enable/Disable CPRI ports controllers
        $('.cpriforce').change(function () {
			var $this = $(this);
			//0-15
			var port = $this.attr('data-id');
			var portlogic = Number($this.attr('data-id'));
			//1-16
			var deactivate = portlogic+1;
			var val = $this.val();
	        axellConfirm("info","Notice","Are you sure you want to change setting? this action will affect CPRI connection",function(){
				// if Disable(0) CPRI_NO_MODULE else Enable(1) CPRI_AUTO 
				if(val == 0){
                   logEvent("ILS", "Disable on port "+(Number(port)+1));
	                api.exe({
	                    cmd:'cpri_force_port '+port+' CPRI_NO_MODULE',              
	                    onSuccess:function(){
	                        api.exe({
	                            cmd:'deactivate_sfp '+deactivate,
	                            onSuccess:function(){
	                            },
	                            onError:function(err){
	                                axellPopUp(err.errorThrown);
	                            }
	                        })
	                    },
	                    onError:function(err){
	                        axellPopUp(err.errorThrown);
	                    }
	                })
	        	}else{
                   logEvent("ILS", "Enable on port "+(Number(port)+1));
	                api.exe({
	                    cmd:'cpri_force_port '+port+' CPRI_AUTO',              
	                    onSuccess:function(){
	                        api.exe({
	                            cmd:'deactivate_sfp '+deactivate,
	                            onSuccess:function(){
	                            },
	                            onError:function(err){
	                                axellPopUp(err.errorThrown);
	                            }
	                        })
	                    },
	                    onError:function(err){
	                        axellPopUp(err.errorThrown);
	                    }
	                })
	            }
	        },function () {
				//if not change 
	        })
        });
		updateOverallLed();
	});

