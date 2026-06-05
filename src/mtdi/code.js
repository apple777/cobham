require([ '/general/general.js', '/js/console.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/assign.js', '/js/util.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js', '/js/lib/handlebars.js', '/js/handlebars-helpers.js', '/js/led.js' ],
    function ( general, console, api, scheduler, convert, assign, util, $, _ ) {
        var OPERATOR = $.parseJSON($.cookie('operatorCook'));
        var MAXWIDTH = 800;
        var MAXHEIGHT = 45;
        var SAFE_MARGIN = 60000;
        var MARGIN = 0;
        var allCellresList =[];
        var allLevelList =[];
        var bandList=[];
        //hardcode data for cell resource table
		var USERNAME = $.cookie('username');
		var USERACCESS = $.cookie('userAccess');

		var activePorts = [];

		var hisLOS = [];
		var hisLOF = [];
		var hisRAI = [];

		var cpri_advanced = false;
		var cpriforceValues = {'0':'Disable','1':'Enable'};

        $(document).ready(function(){
            api.exe({
              cmd:'bands --json',
              dataType:'json',
              onSuccess:function(o){
                  bandList = o.ajaxdata.bands;
              }  
            });
            //populate list of operator
            if(OPERATOR.length >1){
                $('#operator_name').append($('<option>', {
                    value: 'all',
                    text : 'All'
                }));
            }
            $.each(OPERATOR, function (key, value) {
                $('#operator_name').append($('<option>', {
                    value: value.SysName,
                    text : value.FullName
                }));
            });
            //parse to cellres command based on options selected in operator list
            var selectedOperator =[];
            if($('#operator_name').val() === 'all') {
                $.each(OPERATOR, function (i, operator) {
                    selectedOperator.push(operator.SysName);
                })
            }else{
                selectedOperator.push($('#operator_name').val());
            }
            populateCellres(selectedOperator);
            //event handle when select operator
            $('#operator_name').change(function(){
                var selectedOperator =[];
                if($('#operator_name').val() === 'all') {
                    $.each(OPERATOR, function (i, operator) {
                        selectedOperator.push(operator.SysName);
                    })
                }else{
                    selectedOperator.push($('#operator_name').val());
                }
                populateCellres(selectedOperator);
            })

            //load the general panel
            general.init( '#general-panel-placeholder' );
            Handlebars.replaceTemplate( '#ic-status-template', { "module": [1,2]} );
            //Handlebars.replaceTemplate( '#subsystem-template', { "board": [1,2]} );
            Handlebars.replaceTemplate( '#rf-status-template', { "band": [1,2,3,4]} );

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
		
			scheduler.add( sec(3), {
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

			scheduler.add( sec(3), {

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
							$('#ic'+value.id+'-rxloss-val').text("");
							$('#ic'+value.id+'-txloss-val').text("");

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

		scheduler.add( sec(3), {

			cmd: 'mtdistatus --json',
			callOnDiff:true,
			onSuccess:function(o){

				// parse SFP Data
				var mtdistatus = $.parseJSON(o.ajaxdata);
				$.each(mtdistatus.Bands,function(key, band){
					if(band.Installed ==="YES"){
						$('#radio-'+band.No+'-ism').addClass('used');
					}else if(band.Installed ==="NO"){
						$('#radio-'+band.No+'-ism').addClass('unused');
						// dim out column which has uninstalled module
						$('td.radio'+band.No+',th.radio'+band.No).children().css("opacity","0.3","important");
					}else{
						$('#radio-'+band.No+'-ism').removeClass('icon');
					}
					var str;
					if (band.Band == 2301)
					   str = "2300L";
					else if (band.Band == 2302)
					   str = "2300H";
					else
					   str = band.Band;
					$.each(bandList, function (i, value) {
					   if (value.Band == band.Band){
						  str = value.FullName;
						  str = str.replace("MHz ", "").replace("Band", "").replace("BAND", "");
					   }
					})
 					$('#radio-'+band.No+'-band').text(str);
					setLedColor('#radio-'+band.No+'-comm',band.Comm);
					setLedColor('#radio-'+band.No+'-adc',band.ADC);
					setLedColor('#radio-'+band.No+'-dac',band.DAC);
					setLedColor('#radio-'+band.No+'-crc',band.FwStatus);
					setLedColor('#radio-'+band.No+'-szu',band.SynthUL);
					setLedColor('#radio-'+band.No+'-szd',band.SynthDL);
					setLedColor('#radio-'+band.No+'-umt',band.UserMute);
					setLedColor('#radio-'+band.No+'-smt',band.SystemMute);
					setLedColor('#radio-'+band.No+'-temp-led',band.Temperature);
					setLedColor('#radio-'+band.No+'-psu-1',band.Power1);
					setLedColor('#radio-'+band.No+'-psu-2',band.Power2);
					setLedColor('#radio-'+band.No+'-psu-3',band.Power3);
					setLedColor('#radio-'+band.No+'-psu-4',band.Power4);
					$('#radio-'+band.No+'-temp-val').text(band.TempLevel);
					$('#radio-'+band.No+'-psu-1-val').text(band.Power1Level);
					$('#radio-'+band.No+'-psu-2-val').text(band.Power2Level);
					$('#radio-'+band.No+'-psu-3-val').text(band.Power3Level);
					$('#radio-'+band.No+'-psu-4-val').text(band.Power4Level);

					if(1 == band.LEDstatus1) {
						setLedColor('#radio-'+band.No+'-led-1',"green");
						$('#radio-'+band.No+'-led-1').removeClass('blinking');
					} else if((2 == band.LEDstatus1) || (3 == band.LEDstatus1)) {
						setLedColor('#radio-'+band.No+'-led-1',"green");
						$('#radio-'+band.No+'-led-1').addClass('blinking');
					} else {
						// LED is off or in an unknown state.
						setLedColor('#radio-'+band.No+'-led-1',"grey");
						$('#radio-'+band.No+'-led-1').removeClass('blinking');
					}

					if(1 == band.LEDstatus2) {
						setLedColor('#radio-'+band.No+'-led-2',"green");
						$('#radio-'+band.No+'-led-2').addClass('blinking');
					} else if((2 == band.LEDstatus2) || (3 == band.LEDstatus2)) {
						setLedColor('#radio-'+band.No+'-led-2',"green");
						$('#radio-'+band.No+'-led-2').removeClass('blinking');
					} else {
						// LED is off or in an unknown state.
						setLedColor('#radio-'+band.No+'-led-2',"grey");
						$('#radio-'+band.No+'-led-2').removeClass('blinking');
					}

					//set overall status for each module
					if ($( "#radio-table .radio"+band.No+" .led.red:not(.round)" ).length > 0) {
						setLedColor( "#radio-"+band.No+"-overall-led", "red");
					} else if ($( "#radio-table .radio"+band.No+" .led.red:not(.round)" ).length === 0 && band.Installed ==="NO"){
						setLedColor( "#radio-"+band.No+"-overall-led", "grey");
					}else{
						setLedColor( "#radio-"+band.No+"-overall-led", "green");
					}
					//setLedColor( "#radio-"+band.No+"-overall-led", $( "#radio-table .radio-"+band.No+" .led.red:not(.round)" ).length > 0 ? "red" : "green" );

					axshCall('rf_on_off '+band.No+' 2',function(out,err){
						if(out.charAt(0)=="0"){
						    //rf is disabled
							setLedColor('#radio-'+band.No+'-overall-led',"red");
						}else if(out.charAt(0)=="1"){
						    //rf is enabled
							setLedColor('#radio-'+band.No+'-overall-led',"green");							
						}else{
						    //console.error("Cannot understand the result of rf_on_off");
						}
					})
				})
			}
		});
			

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

			//run every 2 seconds to check the status of all panel and open the error row
            updateOverallLed();
            toggleBlinkingLeds();
            $('.advanced').hide();
            $( '#basic-btn' ).click( function () {
                $( '.advanced' ).hide();
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

            // flags for hidden table_row
            var table_row_flag1 = $("tr").hasClass("advanced_flag1");
            //var table_row_flag2 = $("tr").hasClass("advanced_flag2");
            //console.log(table_row_flag1);

            if(table_row_flag1 == true){
                $(".advanced_flag1").hide();
                //$(".advanced_flag2").hide();
            }

            //on click: cellres_details
            $(document).on('click', '.cres_details',function(){
                var cresID = $(this).attr('cres-id');
                var operator = $(this).attr('operator');
                if(cresID == "all"){
                   $('#cellres_all_settings').dialog({
                       autoOpen:false,
                       width:450,
                       height:100,
                       modal:true,
                       buttons:[
                           {
                               text: "Clear Measurement History",
                               click: function () {
                                   axellConfirm("alert","Warning","Do you really want to clear measurement history?", function () {
                                      //clear history
                                      //CELLRES -o <operator> --CLEAR_DB <ResID>
                                      api.exe({
                                          cmd:'CELLRES -o '+operator+' --CLEAR_DB '+cresID,
                                          onSuccess:function(){
                                              axellPopUp("Measurement history of all cell resources has been cleared");
                                          },
                                          onError:function(err){
                                              axellPopUp(err.errorThrown);
                                          }
                                      })
                                   })
                                   $(this).dialog("close");
                               }
                           },
                           {
                               text: "Show RF Measurements",
                               click: function () {
                                   window.open('/target/rfmeasurements/index.html?operator='+operator+'&cresid='+cresID, "_blank");
                                   $(this).dialog("close");
                               }
                           }
                       ],
                       title:"All cell resources settings"
                   })
                   $.ui.dialog.prototype._focusTabbable = function(){}; //to remove autofocus on buttons
                   $('#cellres_all_settings').dialog('open');
                }else{
                   $('#cellres_gain_settings').dialog({
                       autoOpen:false,
                       width:450,
                       modal:true,
                       buttons:[
                           {
                               text: "Clear Measurement History",
                               click: function () {
                                   axellConfirm("alert","Warning","Do you really want to clear measurement history?", function () {
                                      //clear history
                                      //CELLRES -o <operator> --CLEAR_DB <ResID>
                                      api.exe({
                                          cmd:'CELLRES -o '+operator+' --CLEAR_DB '+cresID,
                                          onSuccess:function(){
                                              axellPopUp("Measurement history of cell resource "+cresID+" has been cleared");
                                          },
                                          onError:function(err){
                                              axellPopUp(err.errorThrown);
                                          }
                                      })
                                   })
                                   $(this).dialog("close");
                               }
                           },
                           {
                               text: "Show RF Measurements",
                               click: function () {
                                   window.open('/target/rfmeasurements/index.html?operator='+operator+'&cresid='+cresID, "_blank");
                                   $(this).dialog("close");
                               }
                           }
                       ],
                       open:function(){
                           $('#alcLevel').text(_.findWhere(allLevelList,{"CellRes":cresID}).lastMaxLeveldBm);
                           $('#gainLevel').text(_.findWhere(allCellresList,{"ResID":cresID}).StartCellresTxGain);
                           $('#manualLevel').text(_.findWhere(allCellresList,{"ResID":cresID}).CellresManualLevel);
                          // $('#refLevel').text(_.findWhere(allCellresList,{"ResID":cresID}).StartRxRefLevel);
                       },
                       title:_.findWhere(allCellresList,{"ResID":cresID}).Tag+ " settings"
                   })
                   $.ui.dialog.prototype._focusTabbable = function(){}; //to remove autofocus on buttons
                   $('#cellres_gain_settings').dialog('open');
                }
            })

			/**
			 * Reads the status of the "RF Mute" from rf_on_off cmd.
			 * Send -120 dBm to rru column at routing 
			 */
			function getRFMute(){
			    api.exe({
			        cmd: 'mtdistatus --json',
			        callOnDiff:true,
			        onSuccess:function(o){
			            //refresh everything
			            var status = $.parseJSON(o.ajaxdata);
			            $.each(status.Bands,function(key, band){
			                if(band.Installed ==="YES"){
			                    axshCall('rf_on_off '+band.No+' 2',function(out,err){
			                        if(err){
			                            axellPopUp("Could not get the button value. Please make sure you are connected to the controller.");
			                            console.error("Failed to get RF Mute attribute: "+err);
			                            return;
			                        } 
			                        var $btn=$("div#powerbutton-"+band.No+"-rfmute");
			                        out=$.trim(out);
			                        if(out.charAt(0)=="0"){
			                            //rf is disabled
			                            $btn.removeClass("off").addClass("on");
			                        }else if(out.charAt(0)=="1"){
			                            //rf is enabled
			                            $btn.removeClass("on").addClass("off");
			                        }else{
			                            //console.error("Cannot understand the result of rf_on_off");
			                        }
			                    });
			                }else{
			                    $('td.rfmute'+band.No+',th.rfmute'+band.No).children().css("opacity","0.3","important");
			                    $('td.rfmute'+band.No+',th.rfmute'+band.No).children().addClass('disabled'); 
			                }
			            })
			        }
			    })
			}
			getRFMute();

			if(USERNAME === 'sysadmin'){

			    $("div[id$=-rfmute]").click( function (e){
			        if(!$(this).hasClass('disabled')) {
			            var $this = $(this);
			            $this.attr("class");
			            var band = $this.attr("id")
			            var band_id = band.split("-");          
			            //off is green button and RF is on
			            if($this.hasClass("on")){
			                $this.removeClass("on").addClass("off");
			                //if it button is already on, turn it off
			                //axellConfirm("alert","Warning","Turning off the RF communications may disconnect you permanently and unable to change it via the web interface. Are you sure you want to continue?",function(){
			                    axshCall('rf_on_off '+band_id[1]+' 1',function(out,err){
			                        if(err){
			                            console.error("Could not update the RF attribute");
			                        }else{
			                            //now read the status from server to show if the set command was successfull
			                            //getRFMute();
			                        }
			                    });
			                //},function () {
			                //})
			            }else if($this.hasClass("off")){
			                $this.removeClass("off").addClass("on");
			                //on is red button and RF is off
			                axellConfirm("alert","Warning","This operation will RF Mute all the cells in the band. Are you sure you want to continue?",function(){                
			                    axshCall('rf_on_off '+band_id[1]+' 0',function(out,err){
			                        //now read the status from server to show if the set command was successfull                  
			                        if(err){
			                            //the button is not initialized
			                            console.error("The button is not initialized yet. (set rf_on_off has failed)"); 
			                        }else{
			                            //now read the status from server to show if the set command was successfull
			                            //getRFMute();
			                        }
			                    }); 
			                },function () {
			                    $this.removeClass("on").addClass("off");
			                })              
			            }

			        }else{
			            axellPopUp("You are not authorized to make change.")
			        }
			    })
			}
        })


        //----------------------------------------------------------------------------------------------------------


        function configBand(selector, start,stop,rfstart,rfstop){
            $(selector).append( '<div class="freq-indicator-range-min freq-indicator-range">' + convert.hz2mhz(start) + 'MHz</div>' );
            $(selector).append( '<div class="freq-indicator-range-max freq-indicator-range">' + convert.hz2mhz(stop) + 'MHz</div>' );
            $(selector).append( '<div class="rflevel-indicator-range-min rflevel-indicator-range">' + rfstart + 'dBm</div>' );
            $(selector).append( '<div class="rflevel-indicator-range-max rflevel-indicator-range">' + rfstop + 'dBm</div>' );
        }

        function addCellres(converter,selector, start,stop,key){
            var startPx = converter.convert( start );
            var stopPx = converter.convert( stop );
            //$(selector).append('<div class="ul-band-freq-indicator-bar band-freq-indicator-bar" data-number="' + (key+1) + '" data-du="uplink">' + (key+1) + '</div>');
            var target;
            if(selector.indexOf('ul') != -1){
                target = $('<div id="ul-freq-indicator-bar-'+key+'" class="freq-indicator-bar freq-indicator-bar-'+key+'" data-number="' + key + '"></div>');
            }else if(selector.indexOf('dl') != -1){
                target = $('<div id="dl-freq-indicator-bar-'+key+'" class="freq-indicator-bar freq-indicator-bar-'+key+'" data-number="' + key + '"></div>');
            }

            //target.css('height',realLevel*MAXHEIGHT/maxLevel);
            target.css( 'left', startPx ).width( stopPx - startPx )
                .attr( 'data-start', start)
                .attr( 'data-stop', stop )
                .attr( 'title', 'Frequency Range: '+convert.hz2mhz(start,true) + '-' + convert.hz2mhz(stop,true));
            target.addClass('disabled');
            $(selector).append(target);
            //create tooltip for all icons
            /*
            $('.freq-indicator-bar').tooltip({
                content: function (callback) {
                    callback($(this).prop('title').replace(new RegExp("\\|", "g"), '<br />'));
                },
                close:function(){
                    $('.ui-tooltip-content').parent().remove();
                }
            })
            */
        }

        function populateCellres(operatorList) {
            $('#cellres_spectrum_display').empty();
            var cellresCmd ='';
            $.each(operatorList, function (i, operator) {
                if (i < operatorList.length - 1) {
                    cellresCmd += 'cellres -o ' + operator + ' --json & ';
                } else {
                    cellresCmd += 'cellres -o ' + operator + ' --json';
                }
                scheduler.remove({cmd:'cellres -o '+operator+' --json'});
            })

            scheduler.add(sec(2), {
                cmd: cellresCmd,
                callOnDiff: true,
                onSuccess: function (o) {
                    //refresh alc cellres list when call new cellres
                    allCellresList =[];
                    var operatorCellresList = [];
                    $.each(o.ajaxdata.split('\n').map($.trim).filter(function (line) {
                        return line != ""
                    }), function (i, value) {
                        if ($.parseJSON(value).cellres.length > 0) {
                            operatorCellresList.push(_.groupBy($.parseJSON(value).cellres, function (cellres) {
                                return cellres.BoardNumber
                            }));
                        }
                    })
                    api.exe({
                        cmd: 'bands --json',
                        dataType: 'json',
                        onSuccess: function (e) {
                            var bands = e.ajaxdata.bands;
                            $.each(operatorCellresList, function (i, operatorCellres) {
                                $.each(operatorCellres, function (key, band) {
                                    //700 ranges
                                    //DL 728-757
                                    //UL 698-716 and 776-778
                                    $.each(band, function (key1, cellres) {
                                        $.each(bands, function (key2, bandDetails) {
                                            //if (bandDetails.LowerDL <= cellres.StartDL && bandDetails.UpperDL >= cellres.StopDL) {
                                            if (bandDetails.Band === band[0].Band) {
                                                //only for band 800 eu uplink is higher than downlink
                                                if ((bandDetails.Band === "800") || (bandDetails.Band === "801")) {
                                                    _.extend(cellres, {"BandStartDL": bandDetails.LowerDL, "BandStopDL": bandDetails.UpperDL,
                                                        "BandStartUL": (Number(bandDetails.LowerDL) + Number(bandDetails.Duplex)), "BandStopUL": (Number(bandDetails.UpperDL) + Number(bandDetails.Duplex)),
                                                        "StartUL": (Number(cellres.StartDL) + Number(bandDetails.Duplex)), "StopUL": (Number(cellres.StopDL) + Number(bandDetails.Duplex))})

                                                }else if(bandDetails.Band === "700"){
                                                    if(cellres.StartDL >= 728000000 && cellres.StartDL < 746000000) {
                                                        _.extend(cellres, {"BandStartDL": bandDetails.LowerDL, "BandStopDL": bandDetails.UpperDL,
                                                            "BandStartUL": (Number(bandDetails.LowerDL) - Number(bandDetails.Duplex)), "BandStopUL": (Number(bandDetails.UpperDL) + Number(bandDetails.Duplex)),
                                                            "StartUL": (Number(cellres.StartDL) - Number(bandDetails.Duplex)), "StopUL": (Number(cellres.StopDL) - Number(bandDetails.Duplex))})
                                                    }else if (cellres.StartDL >= 746000000){
                                                        _.extend(cellres, {"BandStartDL": bandDetails.LowerDL, "BandStopDL": bandDetails.UpperDL,
                                                            "BandStartUL": (Number(bandDetails.LowerDL) - Number(bandDetails.Duplex)), "BandStopUL": (Number(bandDetails.UpperDL) + Number(bandDetails.Duplex)),
                                                            "StartUL": (Number(cellres.StartDL) + Number(bandDetails.Duplex)), "StopUL": (Number(cellres.StopDL) + Number(bandDetails.Duplex))})
                                                    }
                                                }else {
                                                    _.extend(cellres, {"BandStartDL": bandDetails.LowerDL, "BandStopDL": bandDetails.UpperDL,
                                                        "BandStartUL": (Number(bandDetails.LowerDL) - Number(bandDetails.Duplex)), "BandStopUL": (Number(bandDetails.UpperDL) - Number(bandDetails.Duplex)),
                                                        "StartUL": (Number(cellres.StartDL) - Number(bandDetails.Duplex)), "StopUL": (Number(cellres.StopDL) - Number(bandDetails.Duplex))})
                                                }
                                            }
                                        })
                                    })
                                })
                            })
                            console.log(operatorCellresList)
                            //set up placeholders first
                            var tempOperatorList =[];
                            if (!_.isEmpty(operatorCellresList)) {
                                //clear out div before updating new info
                                $('#cellres_spectrum_display').empty();
                                //set up placeholders
                                //first create a temp operator list to group operators of cellres list
                                $.each(operatorCellresList,function (k,cellresList){
                                    tempOperatorList.push(_.map(cellresList,function(x){
                                        return x[0].Operator;
                                    })[0]);
                                })
                                var tablehtml ='';
                                $.each(tempOperatorList, function (i, op) {
                                    var operator = _.findWhere(OPERATOR,{"SysName":op});

                                    if (operatorCellresList[i] != undefined) {
                                        tablehtml += '<div class="panel"><div class="header"> Cell Resource <div class="headericons"><div cres-id="all" class="cres_details icon setting advanced" title="All cell resource settings" operator="'+operator.SysName+'"></div></div></div>';
                                        tablehtml += '<table id="' + operator.SysName + '_cellres_tbl" class="type1 cellres_tbl">';
                                        tablehtml += '<caption>' + operator.FullName + ' - Cell Resource</caption>';
                                        $.each(operatorCellresList[i], function (bandNo, band) {
                                            tablehtml += ' <tr><th rowspan="2" id="' + operator.SysName + '_celres_band_' + bandNo + '" class="band-col"><div class="icon antenna2"></div> ' + bandNo + '</th>' +
                                                '<th class="uldl-col"><div class="icon uplink"></div> Uplink</th>' +
                                                '<td id="' + operator.SysName + '_celres_band_ul_spectrum_' + bandNo + '"><div id ="' + operator.SysName + '_rru-band-freq-ul-indicator-' + bandNo + '" class="freq-indicator"></div>' +
                                                '<div id ="' + operator.SysName + '_rru-band-ul-table-' + bandNo + '"></div></td>' +
                                                '</tr>';
                                            tablehtml += '<tr><th class="uldl-col"><div class="icon downlink"></div> Downlink</th>' +
                                                '<td id="' + operator.SysName + '_celres_band_dl_spectrum_' + bandNo + '"><div id ="' + operator.SysName + '_rru-band-freq-dl-indicator-' + bandNo + '" class="freq-indicator"></div>' +
                                                '<div id ="' + operator.SysName + '_rru-band-dl-table-' + bandNo + '"></div></td>' +
                                                '</tr>';
                                            tablehtml += '<tr class="advanced"><th colspan="2"></th><td><div id="' + operator.SysName + '_celres_band_spectrum_tbl_' + bandNo + '"></div></td></tr>';
                                        })
                                        tablehtml += '</table>';
                                        tablehtml += '</div>';
                                    }
                                })
                                $('#cellres_spectrum_display').append(tablehtml);

                                //draw cellres spectrum on that placeholders which are set up
                                //find the maximum range that max width represents
                                $.each(tempOperatorList, function (i, op) {
                                    var operator = _.findWhere(OPERATOR,{"SysName":op});
                                    if (operatorCellresList[i] != undefined) {
                                        var maxRangeDLItem = _.max(operatorCellresList[i], function (band) {
                                            return band[0].BandStopDL - band[0].BandStartDL;
                                        });
                                        var maxRangeDL = maxRangeDLItem[0].BandStopDL - maxRangeDLItem[0].BandStartDL;
                                        var maxRangeULItem = _.max(operatorCellresList[i], function (band) {
                                            return band[0].BandStopUL - band[0].BandStartUL;
                                        });
                                        var maxRangeUL = maxRangeULItem[0].BandStopUL - maxRangeULItem[0].BandStartUL;
                                        $.each(operatorCellresList[i], function (bandNo, band) {
                                            configBand('#' + operator.SysName + '_rru-band-freq-ul-indicator-' + bandNo, band[0].BandStartUL, band[0].BandStopUL, -110, 10); //rf level input for rru is from -110 to 0
                                            configBand('#' + operator.SysName + '_rru-band-freq-dl-indicator-' + bandNo, band[0].BandStartDL, band[0].BandStopDL, -30, 40);//rf level output for rru is from 0 to 40
                                            //scale freq indicator to the band that has maximum range
                                            $('#' + operator.SysName + '_rru-band-freq-ul-indicator-' + bandNo).css('width', (MAXWIDTH / maxRangeUL) * (band[0].BandStopUL - band[0].BandStartUL));
                                            $('#' + operator.SysName + '_rru-band-freq-dl-indicator-' + bandNo).css('width', (MAXWIDTH / maxRangeDL) * (band[0].BandStopDL - band[0].BandStartDL));
                                            //set maximum range 80px right from minimum range
                                            var width_ul = $('#' + operator.SysName + '_rru-band-freq-ul-indicator-' + bandNo).width();
                                            var width_dl = $('#' + operator.SysName + '_rru-band-freq-dl-indicator-' + bandNo).width();
                                            if(width_dl < 300){
                                                $('.freq-indicator-range-max').css('right', -110); 
                                            }
                                            var html = '<table id="' + operator.SysName + '_band_' + bandNo + '" class="type1"><tr class="celres-header-row"><th width="8%">ID</th><th>Tag</th><th>Lower Downlink</th><th>Upper Downlink</th><th>Lower Uplink</th><th>Upper Uplink</th><th>RF Level UL</th><th>RF Level DL</th>';
                                            //var maxLevelUL = _.max(band, function(cellres){ return cellres.LevelUL; }).LevelUL;
                                            //var maxLevelDL = _.max(band, function(cellres){ return cellres.LevelDL; }).LevelDL;
                                            converterDL = new convert.RangeConvertion(Number(band[0].BandStartDL) - SAFE_MARGIN, Number(band[0].BandStopDL) + SAFE_MARGIN, MARGIN, (MAXWIDTH / maxRangeDL) * (Number(band[0].BandStopDL) - Number(band[0].BandStartDL)) - MARGIN);
                                            converterUL = new convert.RangeConvertion(Number(band[0].BandStartUL) - SAFE_MARGIN, Number(band[0].BandStopUL) + SAFE_MARGIN, MARGIN, (MAXWIDTH / maxRangeUL) * (Number(band[0].BandStopUL) - Number(band[0].BandStartUL)) - MARGIN);
                                            $.each(band, function (key, cellres) {
                                                //add all cellres to this list to get data of cellres in dialog
                                                allCellresList.push(cellres);
                                                if (band.length > 0) {
                                                    addCellres(converterUL, '#' + operator.SysName + '_rru-band-freq-ul-indicator-' + bandNo, cellres.StartUL, cellres.StopUL, operator.SysName + '_' + cellres.ResID);
                                                    addCellres(converterDL, '#' + operator.SysName + '_rru-band-freq-dl-indicator-' + bandNo, cellres.StartDL, cellres.StopDL, operator.SysName + '_' + cellres.ResID);
													var str = cellres.ResID;
													var res = str.split("_"); 
													var str2 = cellres.Tag;
													resQuotesOut = str2.replace(/['"]+/g, '')
													resDots = resQuotesOut.slice(0, 13)
													if(str2.length>14){
														showandhide = '<td title="'+resQuotesOut+'" >' + resDots + '...</td>'
													}else{
														showandhide = '<td>' + resQuotesOut + '</td>'
													}
                                                    html += '<tr class="table_row ' + operator.SysName + '_' + cellres.ResID + '-row">' +
                                                        '<td>' + res[1] + ' <div cres-id="'+cellres.ResID+'" class="cres_details icon setting" title="Cell resource settings" operator="'+operator.SysName+'"></div></td>' +
                                                        showandhide +
                                                        '<td>' + convert.hz2mhz(cellres.StartDL) + ' MHz</td>' +
                                                        '<td>' + convert.hz2mhz(cellres.StopDL) + ' MHz</td><td>' + convert.hz2mhz(cellres.StartUL) + ' MHz</td>' +
                                                        '<td>' + convert.hz2mhz(cellres.StopUL) + ' MHz</td><td><div class="numerical"><span id="' + operator.SysName + '_' + cellres.ResID + '_levelUL"></span>' + ' dBm </div></td>' +
                                                        '<td><div class="numerical"><span id="' + operator.SysName + '_' + cellres.ResID + '_levelDL"></span>' + ' dBm</div></td></tr>';

                                                }
                                            })
                                            html += '</table>';
                                            $('#' + operator.SysName + '_celres_band_spectrum_tbl_' + bandNo).append(html);

                                        })
                                    }
                                    setHoverEvents();
                                    $('.advanced').hide();
                                })
                            }
                        }
                    })
                    updateRFLevel(operatorList);
                }
            })
        }

        function updateRFLevel(operatorList){
            $.each(OPERATOR,function(i, op){
                //refresh command called
                scheduler.remove({cmd:'rflevels -o '+op.SysName+' --json'});
            })
            $.each(operatorList,function(i,operator) {
                scheduler.add(sec(1), {
                    cmd: 'rflevels -o ' + operator + ' --json',
                    callOnDiff: true,
                    onSuccess: function (e) {
                        allLevelList =[];
                        var rflevel = $.parseJSON(e.ajaxdata).PerCellResource;
                        $.each(rflevel, function (key2, level) {
                            allLevelList.push(level);
                            //find the indicator bar and update the height
                            //if rf level reports out of range, draw the bar to the max
                            var levelDL = level["DL Level"].indexOf("<")!=-1 ? Number(level["DL Level"].replace("<","")) : Number(level["DL Level"]);
                            var levelUL = level["UL Level"].indexOf("<")!=-1 ? Number(level["UL Level"].replace("<","")) : Number(level["UL Level"]);
                            $('#dl-freq-indicator-bar-' + operator + '_' + level.CellRes).css('height', convertRFLevel(40, -30, levelDL,MAXHEIGHT));
                            $('#ul-freq-indicator-bar-' + operator + '_' + level.CellRes).css('height', convertRFLevel(10, -110, levelUL,MAXHEIGHT));
                            $('#' + operator + '_' + level.CellRes + '_levelUL').text(level["UL Level"]);
                            $('#' + operator + '_' + level.CellRes + '_levelDL').text(level["DL Level"]);
                            if (level["DL Level"] == -30) {
                                $('#dl-freq-indicator-bar-' + operator + '_' + level.CellRes).addClass('zero');
                            } else {
                                $('#dl-freq-indicator-bar-' + operator + '_' + level.CellRes).removeClass('zero');
                            }
                            if (level["UL Level"] == -110) {
                                $('#ul-freq-indicator-bar-' + operator + '_' + level.CellRes).addClass('zero');
                            } else {
                                $('#ul-freq-indicator-bar-' + operator + '_' + level.CellRes).removeClass('zero');
                            }
                        })
                    }
                })
            })
        }

        function convertRFLevel(highLevel, lowLevel ,measuredLevel,maxHeight){

            var levelRange = highLevel - lowLevel;
            var convertedLevel =  measuredLevel - lowLevel;

            var levelHeight;
            if(measuredLevel < lowLevel){
                levelHeight =0;
            }else{
                levelHeight = (maxHeight / levelRange) * convertedLevel;
            }
            return levelHeight;
        }

        function setHoverEvents () {
            $( '.freq-indicator-bar').hover( function () {
                var number = $( this ).attr( 'data-number' );
                var oper_key = $( this ).attr( 'data-number').substring(0,1);
                $( '.' + number + '-row').addClass( 'focused-row');
                $( '#' + oper_key + '_legend').addClass( 'focused');
            }, function () {
                var number = $( this ).attr( 'data-number' );
                var oper_key = $( this ).attr( 'data-number').substring(0,1);
                $( '.' + number + '-row').removeClass( 'focused-row');
                $( '#' + oper_key + '_legend').removeClass( 'focused');
            });

            //revert highlight from table to bar
            $( '.table_row').hover( function () {
                var className = $( this ).attr( 'class');
                var number = className.substring(className.indexOf(" ")+1,className.length-4);
                var oper_key = className.substring(className.indexOf(" ")+1,className.indexOf(" ")+2);
                $( '.freq-indicator-bar-' + number).addClass( 'focused');
                $( '#' + oper_key + '_legend').addClass( 'focused');
            }, function () {
                var className = $( this ).attr( 'class');
                var number = className.substring(className.indexOf(" ")+1,className.length-4);
                var oper_key = className.substring(className.indexOf(" ")+1,className.indexOf(" ")+2);
                $( '.freq-indicator-bar-' + number).removeClass( 'focused');
                $( '#' + oper_key + '_legend').removeClass( 'focused');
            });
        }
    });
