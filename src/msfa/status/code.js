require([ '/general/general.js', '/js/console.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/assign.js', '/js/util.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js', '/js/lib/handlebars.js', '/js/handlebars-helpers.js', '/js/led.js','/js/lib/tipsy.js' ],
	function ( general, console, api, scheduler, convert, assign, util, $, _ ) {
        var USERNAME = $.cookie('username');
		//load the general panel
		general.init( '#general-panel-placeholder' );

        //apply the template
        Handlebars.replaceTemplate( '#ic-status-template', { "odd-band": [1,3,5,7,9,11,13,15],"even-band": [2,4,6,8,10,12,14,16]} );
        Handlebars.replaceTemplate( '#activity-tbl-template', { "odd-band": [1,3,5,7,9,11,13,15],"even-band": [2,4,6,8,10,12,14,16]} );


		$( '#basic-btn' ).click( function () {
			$( '.advanced' ).hide();
			return false;
		});

		$( '#advanced-btn' ).click( function () {
			$( '.advanced' ).show();
			return false;
		});

		$( '.advanced' ).hide();
        $('#header').hide();


        scheduler.add( sec(3), {
            cmd: 'msfastatus --json',
            callOnDiff:true,
            onSuccess:function(o){
                //refresh everything
                $('.deactivate_cell').empty();
                $('.linkstate_cell').empty();
                var msdhstatus = $.parseJSON(o.ajaxdata);
                //update common led status and info on screen
                setLedColor("#clock-main-led",msdhstatus.Main);
                setLedColor("#clock-eth-led",msdhstatus.Ethernet);
                //power supply and current
                setLedColor("#1V0-led",msdhstatus.Power1V0);
                setLedColor("#1V5-led",msdhstatus.Power1V5);
                setLedColor("#1V8-led",msdhstatus.Power1V8);
                setLedColor("#2V5-led",msdhstatus.Power2V5);
                setLedColor("#5V0-led",msdhstatus.Power5V0);
                setLedColor("#12V0_1-led",msdhstatus.Power12V0_1);
                setLedColor("#12V0_2-led",msdhstatus.Power12V0_2);
                setLedColor("#24V0-led",msdhstatus.Power24V0);
                setLedColor("#current1-led",msdhstatus.Current1);
                setLedColor("#current2-led",msdhstatus.Current2);
                $('#1V0-val').text(msdhstatus.PowerLevel1V0);
                $('#1V5-val').text(msdhstatus.PowerLevel1V5);
                $('#1V8-val').text(msdhstatus.PowerLevel1V8);
                $('#2V5-val').text(msdhstatus.PowerLevel2V5);
                $('#5V0-val').text(msdhstatus.PowerLevel5V0);
                $('#12V0_1-val').text(msdhstatus.PowerLevel12V0_1);
                $('#12V0_2-val').text(msdhstatus.PowerLevel12V0_2);
                $('#24V0-val').text(msdhstatus.PowerLevel24V0);
                $('#current1-val').text(msdhstatus.CurrentLevel1);
                $('#current2-val').text(msdhstatus.CurrentLevel2);
                //FPGA power supply
                setLedColor("#Int-led",msdhstatus.Power1);
                setLedColor("#Aux-led",msdhstatus.Power2);
                setLedColor("#BRAM-led",msdhstatus.Power3);
                setLedColor("#PINT-led",msdhstatus.Power4);
                setLedColor("#PAUX-led",msdhstatus.Power5);
                setLedColor("#O_DDR-led",msdhstatus.Power6);
                $('#Int-val').text(msdhstatus.Power1Level);
                $('#Aux-val').text(msdhstatus.Power2Level);
                $('#BRAM-val').text(msdhstatus.Power3Level);
                $('#PINT-val').text(msdhstatus.Power4Level);
                $('#PAUX-val').text(msdhstatus.Power5Level);
                $('#O_DDR-val').text(msdhstatus.Power6Level);
                $('th.th-position').find('.icon').remove();
                setLedColor("#tem-led", msdhstatus.Temperature);
                $('#ic-status th#band'+msdhstatus.Ref_Link).append(' <div class="icon clock-link" title="Link being used as clock reference. |Hops to master: '+msdhstatus.Ref_Hops+'"></div>');

                //run through all modules
                $('ic-ism').remove();
                //hide the row of deactivate button
                $('tr.deactivate_port').hide();
                $.each(msdhstatus.Modules,function(key, value){
                    //append btn in
                    $('#ic' + value.No + '_deactivate_cell').append('<a id="'+value.No+'-disable-mod" class="button disable_module" data-moduleid='+value.No+'> Clear </a>' +
                      '<div class="icon help" title="Clear Port Alarms"></div>');
                    //show the row of deactivate button
                    //$('#ic' + value.No + '_deactivate_cell').closest('tr').show();
                    if(value.Installed ==="YES"){
                        $('#ic'+value.No+'-ism').removeClass('unused').addClass('used');
                        //check if the module is supported
                        if (value.Supported === "YES") {
                            $('#ic' + value.No + '-usm').removeClass('unused').addClass('used');//update supported icon
                            //check if the links state is deactivated or activated or whatever it is
                            if(value.Link_State !="DEACTIVATED" && value.Link_State !="-"){
                                //if the link state is not up, user can deactivate it from reporting error
                                if(value.Link_State !="M-UP" && value.Link_State !="S-UP") {
                                }
                                $('td.ic' + value.No + ',th.ic' + value.No).children().css("opacity", "1.0", "important");
                            }else if(value.Link_State ==="DEACTIVATED"){
                                //if the port is deactivated, dim out the whole module
                                $('td.ic' + value.No + ',th.ic' + value.No).children().css("opacity", "0.3", "important");
                            }
                            //not showing link state icon if it's activated
                            if(value.Link_State != "ACTIVATED") {
                                //to display link state icons
                                $('#ic' + value.No + '-linkst').append('<div class="icon ' + value.Link_State.toLowerCase() + '"></div>');
                            }
                        } else if (value.Supported === "NO") {
                            $('#ic' + value.No + '-usm').removeClass('used').addClass('redcross'); //update icon for supported
                            //if the port is not supported dim out the whole module
                            $('td.ic' + value.No + ',th.ic' + value.No).children().css("opacity", "0.3", "important");
                        }
                    }else if(value.Installed ==="NO"){ //now the module is not installed, so display the icon accordingly
                        $('#ic' + value.No + '-ism').removeClass('used').addClass('unused');
                        $('#ic' + value.No + '-usm').removeClass('used').removeClass('redcross').addClass('unused');
                        //if the port is deactivated, dim out the whole module
                        $('td.ic' + value.No + ',th.ic' + value.No).children().css("opacity", "0.3", "important");
                    }else{ //in case it return me - then remove the icon class
                        $('#ic'+value.No+'-ism').removeClass('icon');
                    }
                    setLedColor('#ic'+value.No+'-rem',value.Remote_Power_Supply);
                    $('#ic'+value.No+'-ser').text(value.Remote_ID);
                    setLedColor('#ic'+value.No+'-digi',value.Digital_Link);
                    setLedColor('#ic'+value.No+'-rf',value.RF_Stream);
                    setLedColor('#ic'+value.No+'-comm',value.Communication);
                    setLedColor('#ic'+value.No+'-temp-led',value.Temperature);
                    setLedColor('#ic'+value.No+'-power-led',value.Power);
                    setLedColor('#ic'+value.No+'-current-led',value.Current);
                    setLedColor('#ic'+value.No+'-txopto-led',value.Tx_Opto);
                    setLedColor('#ic'+value.No+'-rxopto-led',value.Rx_Opto);
                    $('#ic'+value.No+'-temp-val').text(value.TempLevel);
                    $('#ic'+value.No+'-power-val').text(value.PwrLevel);
                    $('#ic'+value.No+'-current-val').text(value.CurrLevel);
                    $('#ic'+value.No+'-txopto-val').text(value.TxLevel);
                    $('#ic'+value.No+'-rxopto-val').text(value.Level);

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

                //on event of click to disable module
                $(document).on('click','.disable_module',function(){
                    var $this = $(this);
                    if(!$this.hasClass('disabled')){
                        api.exe({
                            cmd:'deactivate_sfp '+$this.attr('data-moduleid'),
                            onSuccess:function(){

                            },
                            onError:function(err){
                                axellPopUp(err.errorThrown);
                            }
                        })
                    }
                })
                //only sysadmin can deactivate port
                if(USERNAME !="sysadmin"){
                    $('tr.deactivate_port').remove();
                }
                //create tooltip for all icons
                /*
                $('.icon').tooltip({
                    content: function (callback) {
                        callback($(this).prop('title').replace(new RegExp("\\|", "g"), '<br />'));
                    },
                    close:function(){
                        $(".ui-tooltip-content").parents('div').remove();
                    }
                })
                */

            }
        });
        updateOverallLed();
	});
