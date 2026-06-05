require([ '/general/general.js', '/js/console.js', '/js/api.js', '/js/scheduler.js', '/js/convert.js', '/js/util.js', '/js/lib/jquery.js', '/js/lib/underscore.js', '/js/lib/jquery-ui.js', '/js/lib/handlebars.js', '/js/handlebars-helpers.js', '/js/led.js','/js/lib/tipsy.js' ],
	function ( general, console, api, scheduler, convert, util, $, _ ) {
        var OPERATOR = $.parseJSON($.cookie('operatorCook'));
        var MAXWIDTH = 800;
        var MAXHEIGHT = 45;
        var SAFE_MARGIN = 60000;
        var MARGIN = 0;
        var USERNAME = $.cookie('username');
    
        $(document).ready(function(){

            /*api.exe({
               cmd: 'device getall --json',
               dataType: 'json',
               async: false,
               onSuccess: function (o) {
                  var Devices = o.ajaxdata.Devices;
                  if (Devices.length > 1)
                     window.location.assign("/target/site");
               }
            });*/

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
            //temp hide
            $('#operator_name').prev().hide();
            $('#operator_name').hide();
            //load the general panel
            general.init( '#general-panel-placeholder' );
            Handlebars.replaceTemplate( '#ic-status-template', { "module": [1,2]} );
            Handlebars.replaceTemplate( '#rf-status-template', { "band": [1,2,3,4]} );
            // new alarms api
            scheduler.add( sec(3), {
                cmd: 'measurements dump env --json',
                callOnDiff:true,
                onSuccess:function(o){
                    //refresh everything
                    //$('.deactivate_cell').empty();

                    var envMeas = $.parseJSON(o.ajaxdata);

                    setLedColor("#tem-led",             envMeas.TEMP_FPGA_1_ALRM);

                    // Clocks
                    setLedColor("#ic-recovered-clock",  envMeas.SZR_FPGACL1_1_ALRM);
                    setLedColor("#clock-main-led",      envMeas.SZR_MAINCL1_1_ALRM);
                    setLedColor("#clock-eth-led",       envMeas.SZR_ETHCLK1_1_ALRM);

                    // Power Alarms
                    setLedColor("#1V0-led",             envMeas.PW9_PMU_1_ALRM);
                    setLedColor("#1V5-led",             envMeas.PW8_PMU_1_ALRM);
                    setLedColor("#1V8-led",             envMeas.PW7_PMU_1_ALRM);
                    setLedColor("#2V5-led",             envMeas.PW6_PMU_1_ALRM);
                    setLedColor("#5V0-led",             envMeas.PW4_PMU_1_ALRM);
                    setLedColor("#12V0_1-led",          envMeas.PW2_PMU_1_ALRM);
                    setLedColor("#12V0_2-led",          envMeas.PW2_PMU_2_ALRM);
                    setLedColor("#24V0-led",            envMeas.PW1_PMU_1_ALRM);
                    setLedColor("#28V0-led",            envMeas.PW1_PMU_1_ALRM);

                    // Current Alarms
                    setLedColor("#current1-led",        envMeas.CU1_PMU_1_ALRM);
                    setLedColor("#current2-led",        envMeas.CU2_PMU_1_ALRM);

                    // Power Levels             
                    $('#1V0-val').text(                 envMeas.PW9_PMU_1);
                    $('#1V5-val').text(                 envMeas.PW8_PMU_1);
                    $('#1V8-val').text(                 envMeas.PW7_PMU_1);
                    $('#2V5-val').text(                 envMeas.PW6_PMU_1);
                    $('#5V0-val').text(                 envMeas.PW4_PMU_1);
                    $('#12V0_1-val').text(              envMeas.PW2_PMU_1);
                    $('#12V0_2-val').text(              envMeas.PW2_PMU_2);
                    $('#24V0-val').text(                envMeas.PW1_PMU_1);
                    $('#28V0-val').text(                envMeas.PW1_PMU_1);

                    // Current Levels
                    $('#current1-val').text(            envMeas.CU1_PMU_1);
                    $('#current2-val').text(            envMeas.CU2_PMU_1);

                    // FPGA Power Supply Alarms
                    setLedColor("#Int-led",             envMeas.PW9_FPGA_INT_ALRM);
                    setLedColor("#Aux-led",             envMeas.PW7_FPGA_AUX_ALRM);
                    setLedColor("#BRAM-led",            envMeas.PW9_FPGA_BRAM_ALRM);
                    setLedColor("#PINT-led",            envMeas.PW9_FPGA_PINT_ALRM);
                    setLedColor("#PAUX-led",            envMeas.PW7_FPGA_PAUX_ALRM);
                    setLedColor("#O_DDR-led",           envMeas.PW8_FPGA_O_DDR_ALRM);

                    // FPGA Power Supply Values
                    $('#Int-val').text(                 envMeas.PW9_FPGA_INT);
                    $('#Aux-val').text(                 envMeas.PW7_FPGA_AUX);
                    $('#BRAM-val').text(                envMeas.PW9_FPGA_BRAM);
                    $('#PINT-val').text(                envMeas.PW9_FPGA_PINT);
                    $('#PAUX-val').text(                envMeas.PW7_FPGA_PAUX);
                    $('#O_DDR-val').text(               envMeas.PW8_FPGA_O_DDR);

                    // External Alarms and Door
                    setLedColor("#ex1-led",             envMeas.EX1_CTRL_1_ALRM);
                    setLedColor("#ex2-led",             envMeas.EX2_CTRL_1_ALRM);
                    setLedColor("#ex3-led",             envMeas.EX3_CTRL_1_ALRM);
                    setLedColor("#ex4-led",             envMeas.EX4_CTRL_1_ALRM);

                    //hidden due to: Invalid color value passed to setLedColor: ""
                    setLedColor("#doo-led",             envMeas.DOO_CTRL_0_ALRM);

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
                }
            });

            scheduler.add( sec(3), {
                cmd: 'dobrstatus --json',
                callOnDiff:true,
                onSuccess:function(o){
                    //refresh everything
                    $('.deactivate_cell').empty();
                    $('.linkstate_cell').empty();
                    var dobrstatus = $.parseJSON(o.ajaxdata);
                    //update rf table details
                    $.each(dobrstatus.Bands,function(key, band){
                        if(band.Installed ==="YES"){
                            $('#radio-'+band.No+'-ism').addClass('used');
                        }else if(band.Installed ==="NO"){
                            $('#radio-'+band.No+'-ism').addClass('unused');
                            // dim out column which has uninstalled module
                            $('td.radio'+band.No+',th.radio'+band.No).children().css("opacity","0.3","important");
                        }else{
                            $('#radio-'+band.No+'-ism').removeClass('icon');
                        }
                        $('#radio-'+band.No+'-band').text(band.Band);
                        setLedColor('#radio-'+band.No+'-comm',band.Comm);
                        setLedColor('#radio-'+band.No+'-adc',band.ADC);
                        setLedColor('#radio-'+band.No+'-dac',band.DAC);
                        setLedColor('#radio-'+band.No+'-crc',band.FwStatus);
                        setLedColor('#radio-'+band.No+'-szu',band.SynthUL);
                        setLedColor('#radio-'+band.No+'-szd',band.SynthDL);
                        setLedColor('#radio-'+band.No+'-umt',band.UserMute);
                        setLedColor('#radio-'+band.No+'-smt',band.SystemMute);
                        setLedColor('#radio-'+band.No+'-vswrd',band.DlSwr);
                        setLedColor('#radio-'+band.No+'-vswru',band.UlSwr);
                        $('#radio-'+band.No+'-opl').text(band.CompOutput);

                        //hidden due to: Invalid color value passed to setLedColor: ""
                        setLedColor('#radio-'+band.No+'-vswr-led',band.VSWR);
                        setLedColor('#radio-'+band.No+'-temp-led',band.Temperature);
                        setLedColor('#radio-'+band.No+'-psu-1',band.Power1);
                        setLedColor('#radio-'+band.No+'-psu-2',band.Power2);
                        setLedColor('#radio-'+band.No+'-psu-3',band.Power3);
                        setLedColor('#radio-'+band.No+'-psu-4',band.Power4);
                        $('#radio-'+band.No+'-vswr-val').text(band.VSWRLevel);
                        $('#radio-'+band.No+'-temp-val').text(band.TempLevel);
                        $('#radio-'+band.No+'-psu-1-val').text(band.Power1Level);
                        $('#radio-'+band.No+'-psu-2-val').text(band.Power2Level);
                        $('#radio-'+band.No+'-psu-3-val').text(band.Power3Level);
                        $('#radio-'+band.No+'-psu-4-val').text(band.Power4Level);
                        //set overall status for each band
                        //set overall status for each module
                        if ($( "#radio-table .radio"+band.No+" .led.red:not(.round)" ).length > 0) {
                            setLedColor( "#radio-"+band.No+"-overall-led", "red");
                        } else if ($( "#radio-table .radio"+band.No+" .led.red:not(.round)" ).length === 0 && band.Installed==="NO"){
                            setLedColor( "#radio-"+band.No+"-overall-led", "grey");
                        }else{
                            setLedColor( "#radio-"+band.No+"-overall-led", "green");
                        }
                        //setLedColor( "#radio-"+band.No+"-overall-led", $( "#radio-table .radio-"+band.No+" .led.red:not(.round)" ).length > 0 ? "red" : "green" );
                    })

                    setLedColor("#node-summary-status",dobrstatus.AlarmsLed);
                    $('th.th-position').find('.icon').remove();
                    //add clock link and hops icons to correspondent module
                    $('#ic-status th#band'+dobrstatus.Ref_Link).append(' <div class="icon clock-link" title="Link being used as clock reference. |Hops to master: '+dobrstatus.Ref_Hops+'"></div>');

                    //run through all modules and update info
                    $('ic-ism').remove();
                    //hide the row of deactivate button
                    $('tr.deactivate_port').hide();
                    $.each(dobrstatus.Modules,function(key, value) {
                        if(value.Installed ==="YES"){
                            $('#ic'+value.No+'-ism').removeClass('unused').addClass('used');
                            //check if the module is supported
                            if (value.Supported === "YES") {
                                $('#ic' + value.No + '-usm').removeClass('unused').addClass('used');
                                $('td.ic' + value.No + ',th.ic' + value.No).children().css("opacity", "1.0", "important");
                                //check if the links tate is deactivated or activated or whatever it is
                                if(value.Link_State !="DEACTIVATED" && value.Link_State !="-") {
                                    if(value.Link_State !="M-UP" && value.Link_State !="S-UP") {
                                        //append btn in
                                        $('#ic' + value.No + '_deactivate_cell').append('<a id="'+value.No+'-disable-mod" class="button disable_module" data-moduleid='+value.No+'> Deactivate Port </a>' +
                                            '<div class="icon help" title="When removing a module it must also be disabled. New modules plugged in will automatically be added, and alarm parameters monitored first time the link has come up."></div>');
                                        //show the row of deactivate button
                                        $('#ic' + value.No + '_deactivate_cell').closest('tr').show();
                                    }
                                    $('td.ic' + value.No + ',th.ic' + value.No).children().css("opacity", "1.0", "important");
                                }else if(value.Link_State ==="DEACTIVATED"){
                                    //if the port is deactivated, dim out the whole module
                                    $('td.ic'+value.No+',th.ic'+value.No).children().css("opacity","0.3","important");
                                }
                                //not showing link state icon if it's activated
                                if(value.Link_State != "ACTIVATED") {
                                    //to display link state icons
                                    $('#ic' + value.No + '-linkst').append('<div class="icon ' + value.Link_State.toLowerCase() + '"></div>');
                                }
                            } else if (value.Supported === "NO") {
                                $('#ic' + value.No + '-usm').removeClass('used');
                                $('#ic' + value.No + '-usm').addClass('redcross');
                                // dim out column which has unsupported module
                                $('td.ic' + value.No + ',th.ic' + value.No).children().css("opacity", "0.3", "important");
                            }
                        }else if(value.Installed ==="NO"){//now the module is not installed, so display the icon accordingly and dim out the module
                            $('#ic' + value.No + '-ism').removeClass('used').addClass('unused');
                            $('#ic' + value.No + '-usm').removeClass('used').removeClass('redcross').addClass('unused');
                            // dim out column which has uninstalled module
                            $('td.ic'+value.No+',th.ic'+value.No).children().css("opacity","0.3","important");
                        }else{ //in case it return me - then remove the icon class
                            $('#ic'+value.No+'-ism').removeClass('icon');
                        }
                        setLedColor('#ic' + value.No + '-rem', value.Remote_Power_Supply);
                        $('#ic' + value.No + '-ser').text(value.Remote_ID);
                        setLedColor('#ic' + value.No + '-digi', value.Digital_Link);
                        setLedColor('#ic' + value.No + '-rf', value.RF_Stream);
                        setLedColor('#ic' + value.No + '-comm', value.Communication);
                        setLedColor('#ic' + value.No + '-temp-led', value.Temperature);
                        setLedColor('#ic' + value.No + '-power-led', value.Power);
                        setLedColor('#ic' + value.No + '-current-led', value.Current);
                        setLedColor('#ic' + value.No + '-txopto-led', value.Tx_Opto);
                        setLedColor('#ic' + value.No + '-rxopto-led', value.Rx_Opto);
                        $('#ic' + value.No + '-temp-val').text(value.TempLevel);
                        $('#ic' + value.No + '-power-val').text(value.PwrLevel);
                        $('#ic' + value.No + '-current-val').text(value.CurrLevel);
                        $('#ic' + value.No + '-txopto-val').text(value.TxLevel);
                        $('#ic' + value.No + '-rxopto-val').text(value.Level);

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
                                $('tr#supported').show();
                            }
                        } else {
                            // No module installed, no LED to twinkle.
                            setLedColor("#ic" + value.No + "-overall-led", "grey");
                        }
                    })

                    //on event of click to disable module
                    $('.disable_module').click(function(){
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
                        $('tr#deactivate_port').remove();
                    }
                    //create tooltip for all icons
                    /*
                    $('.icon').tooltip({
                        content: function (callback) {
                            callback($(this).prop('title').replace(new RegExp("\\|", "g"), '<br />'));
                        },
                        close:function(){
                            $(".ui-tooltip-content").parent().remove();
                        }
                    })
                    */
                }
            });
            //run every 2 seconds to check the status of all panel and open the error row
            updateOverallLed();

            $( '#basic-btn' ).click( function () {
                $( '.advanced' ).hide();
                return false;
            });

            $( '#advanced-btn' ).click( function () {
                $( '.advanced' ).show();
                return false;
            });

            $( '.advanced' ).hide();
        })

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
                    var operatorCellresList = [];
                    $.each(o.ajaxdata.split('\n').map($.trim).filter(function (line) {
                        return line != ""
                    }), function (i, value) {
                        operatorCellresList.push(_.groupBy($.parseJSON(value).cellres, function (cellres) {
                            return cellres.BoardNumber;
                        }));
                    })
                    api.exe({
                        cmd: 'bands --json',
                        dataType: 'json',
                        onSuccess: function (e) {
                            var bands = e.ajaxdata.bands;
                            $.each(operatorCellresList, function (i, operatorCellres) {
                                $.each(operatorCellres, function (key, band) {
                                    $.each(band, function (key1, cellres) {
                                        $.each(bands, function (key2, bandDetails) {
                                            //if (bandDetails.LowerDL <= cellres.StartDL && bandDetails.UpperDL >= cellres.StopDL) {
                                            if (bandDetails.Band === band[0].Band) {
                                                //only for band 800 eu uplink is higher than downlink
                                                if (bandDetails.Band === "800") {
                                                    _.extend(cellres, {"BandStartDL": bandDetails.LowerDL, "BandStopDL": bandDetails.UpperDL,
                                                        "BandStartUL": (Number(bandDetails.LowerDL) + Number(bandDetails.Duplex)), "BandStopUL": (Number(bandDetails.UpperDL) + Number(bandDetails.Duplex)),
                                                        "StartUL": (Number(cellres.StartDL) + Number(bandDetails.Duplex)), "StopUL": (Number(cellres.StopDL) + Number(bandDetails.Duplex))})
                                                }else if(bandDetails.Band === "700"){
                                                    if(cellres.StartDL >= 728000000 && cellres.StartDL <746000000) {
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
                            if (!_.isEmpty(operatorCellresList)) {
                                //clear out div before updating new info
                                $('#cellres_spectrum_display').empty();
                                //set up placeholders
                                var tablehtml = '';
                                /*$.each(operatorList, function (i, op) {
                                    var operator = _.findWhere(OPERATOR,{"SysName":op});
                                    if (!_.isEmpty(operatorCellresList[i])) {
                                        tablehtml += '<div class="panel"><div class="header"> Cell Resource</div>';
                                        tablehtml += '<table id="' + operator.SysName + '_cellres_tbl" class="type1 cellres_tbl">';
                                        tablehtml += '<caption>' + operator.FullName + ' - Cell Resource</caption>';
                                        $.each(operatorCellresList[i], function (bandNo, band) {
                                            tablehtml += ' <tr><th rowspan="2" id="' + operator.SysName + '_celres_band_' + bandNo + '" class="band-col"><div class="icon antenna2"></div> ' + bandNo + '</th>' +
                                                '<th class="uldl-col"><div class="icon uplink"></div> Uplink</th>' +
                                                '<td id="' + operator.SysName + '_celres_band_ul_spectrum_' + bandNo + '"><div id ="' + operator.SysName + '_dobr-band-freq-ul-indicator-' + bandNo + '" class="freq-indicator"></div>' +
                                                '<div id ="' + operator.SysName + '_dobr-band-ul-table-' + bandNo + '"></div></td>' +
                                                '</tr>';
                                            tablehtml += '<tr><th class="uldl-col"><div class="icon downlink"></div> Downlink</th>' +
                                                '<td id="' + operator.SysName + '_celres_band_dl_spectrum_' + bandNo + '"><div id ="' + operator.SysName + '_dobr-band-freq-dl-indicator-' + bandNo + '" class="freq-indicator"></div>' +
                                                '<div id ="' + operator.SysName + '_dobr-band-dl-table-' + bandNo + '"></div></td>' +
                                                '</tr>';
                                            tablehtml += '<tr class="advanced"><th colspan="2"></th><td><div id="' + operator.SysName + '_celres_band_spectrum_tbl_' + bandNo + '"></div></td></tr>';
                                        })

                                        tablehtml += '</table>';
                                        tablehtml += '</div>';
                                    }
                                })*/
                                $('#cellres_spectrum_display').append(tablehtml);
                                //draw cellres spectrum
                                //find the maximum range that max width represents
                                $.each(operatorList, function (i, op) {
                                    var operator = _.findWhere(OPERATOR,{"SysName":op});
                                    if (!_.isEmpty(operatorCellresList[i])) {
                                        var maxRangeDLItem = _.max(operatorCellresList[i], function (band) {
                                            return band[0].BandStopDL - band[0].BandStartDL;
                                        });
                                        var maxRangeDL = maxRangeDLItem[0].BandStopDL - maxRangeDLItem[0].BandStartDL;
                                        var maxRangeULItem = _.max(operatorCellresList[i], function (band) {
                                            return band[0].BandStopUL - band[0].BandStartUL;
                                        });
                                        var maxRangeUL = maxRangeULItem[0].BandStopUL - maxRangeULItem[0].BandStartUL;
                                        //console.log(cellresList);
                                        $.each(operatorCellresList[i], function (bandNo, band) {
                                            configBand('#' + operator.SysName + '_dobr-band-freq-ul-indicator-' + bandNo, band[0].BandStartUL, band[0].BandStopUL, -110, 0); //rf level input for dobr is from -110 to 0
                                            configBand('#' + operator.SysName + '_dobr-band-freq-dl-indicator-' + bandNo, band[0].BandStartDL, band[0].BandStopDL, 0, 40);//rf level output for dobr is from 0 to 40
                                            //scale freq indicator to the band that has maximum range
                                            $('#' + operator.SysName + '_dobr-band-freq-ul-indicator-' + bandNo).css('width', (MAXWIDTH / maxRangeUL) * (band[0].BandStopUL - band[0].BandStartUL));
                                            $('#' + operator.SysName + '_dobr-band-freq-dl-indicator-' + bandNo).css('width', (MAXWIDTH / maxRangeDL) * (band[0].BandStopDL - band[0].BandStartDL));
                                            var html = '<table id="' + operator.SysName + '_band_' + bandNo + '" class="type1 advanced"><tr class="celres-header-row"><th>ID</th><th>Tag</th><th>Lower Downlink</th><th>Upper Downlink</th><th>Lower Uplink</th><th>Upper Uplink</th><th>RF Level UL</th><th>RF Level DL</th>';
                                            //var maxLevelUL = _.max(band, function(cellres){ return cellres.LevelUL; }).LevelUL;
                                            //var maxLevelDL = _.max(band, function(cellres){ return cellres.LevelDL; }).LevelDL;
                                            converterDL = new convert.RangeConvertion(Number(band[0].BandStartDL) - SAFE_MARGIN, Number(band[0].BandStopDL) + SAFE_MARGIN, MARGIN, (MAXWIDTH / maxRangeDL) * (Number(band[0].BandStopDL) - Number(band[0].BandStartDL)) - MARGIN);
                                            converterUL = new convert.RangeConvertion(Number(band[0].BandStartUL) - SAFE_MARGIN, Number(band[0].BandStopUL) + SAFE_MARGIN, MARGIN, (MAXWIDTH / maxRangeUL) * (Number(band[0].BandStopUL) - Number(band[0].BandStartUL)) - MARGIN);
                                            $.each(band, function (key, cellres) {
                                                if (band.length > 0) {
                                                    addCellres(converterUL, '#' + operator.SysName + '_dobr-band-freq-ul-indicator-' + bandNo, cellres.StartUL, cellres.StopUL, operator.SysName + '_' + cellres.ResID);
                                                    addCellres(converterDL, '#' + operator.SysName + '_dobr-band-freq-dl-indicator-' + bandNo, cellres.StartDL, cellres.StopDL, operator.SysName + '_' + cellres.ResID);
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
                                                        '<td>' + res[1] + '</td>' + 
                                                        showandhide + 
                                                        '<td>' + convert.hz2mhz(cellres.StartDL) + ' MHz</td>' +
                                                        '<td>' + convert.hz2mhz(cellres.StopDL) + ' MHz</td><td>' + convert.hz2mhz(cellres.StartUL) + ' MHz</td>' +
                                                        '<td>' + convert.hz2mhz(cellres.StopUL) + ' MHz</td><td><div class="numerical"><span id="' + operator.SysName + '_' + cellres.ResID + '_levelUL"></span>' + ' dBm </div></td><td><div class="numerical"><span id="' + operator.SysName + '_' + cellres.ResID + '_levelDL"></span>' + ' dBm</div></td></tr>';

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
                scheduler.add(sec(1),{
                    cmd: 'rflevels -o ' + operator + ' --json',
                    callOnDiff:true,
                    onSuccess: function (e) {
                        var rflevel = $.parseJSON(e.ajaxdata).PerCellResource;
                        $.each(rflevel, function (key2, level) {
                            //find the indicator bar and update the height
                            //if rf level reports out of range, draw the bar to the max
                            $('#ul-freq-indicator-bar-' + operator + '_' + level.CellRes).css('height', Number(level["UL Level"]) >0 ? (110*MAXHEIGHT/110) : ((110 + Number(level["UL Level"])) * MAXHEIGHT / 110));
                            $('#dl-freq-indicator-bar-' + operator + '_' + level.CellRes).css('height', Number(level["DL Level"]) >40 ? (40 * MAXHEIGHT / 40) : (Number(level["DL Level"]) * MAXHEIGHT / 40));
                            $('#'+operator+'_'+level.CellRes+'_levelUL').text(level["UL Level"]);
                            $('#'+operator+'_'+level.CellRes+'_levelDL').text(level["DL Level"]);
                            if(level["UL Level"] == -110){
                                $('#ul-freq-indicator-bar-'+operator+'_'+level.CellRes).addClass('zero');
                            }else{
                                $('#ul-freq-indicator-bar-'+operator+'_'+level.CellRes).removeClass('zero');
                            }
                            if(level["DL Level"] == 0){
                                $('#dl-freq-indicator-bar-'+operator+'_'+level.CellRes).addClass('zero');
                            }else{
                                $('#dl-freq-indicator-bar-'+operator+'_'+level.CellRes).removeClass('zero');
                            }
                        })
                    }
                })
            })
        }

        function configBand(selector, start,stop,rfstart,rfstop){
            $(selector).append( '<div class="freq-indicator-range-min freq-indicator-range">' + convert.hz2mhz(start) + 'MHz</div>' );
            $(selector).append( '<div class="freq-indicator-range-max freq-indicator-range">' + convert.hz2mhz(stop) + 'MHz</div>' );
            $(selector).append( '<div class="rflevel-indicator-range-min rflevel-indicator-range">' + rfstart + 'dBm</div>' );
            $(selector).append( '<div class="rflevel-indicator-range-max rflevel-indicator-range">' + rfstop + 'dBm</div>' );
        }

        function addCellres(converter,selector, start,stop,key){
            /*
            var realLevel;
            if(level <0){
                realLevel = maxLevel - Math.abs(level);
            }else{
                realLevel = level;
            }
            */
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
            //if no input or output level, add zero class in
            //bad way to say if the level is minimum then add class zero to it
            /*
            if((maxLevel == 40 && level == 0) || (maxLevel == 110 && level == -110)){
                target.addClass('zero');
            }
            */
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

        function setHoverEvents () {
            $( '.freq-indicator-bar').hover( function () {
                var number = $( this ).attr( 'data-number' );
                var oper_key = $( this ).attr( 'data-number').substring(0,$( this ).attr( 'data-number').indexOf("_")-1);
                $( '.' +number + '-row').addClass( 'focused-row');
                //$( '#' + oper_key + '_legend').addClass( 'focused');
            }, function () {
                var number = $( this ).attr( 'data-number' );
                var oper_key = $( this ).attr( 'data-number').substring(0,$( this ).attr( 'data-number').indexOf("_")-1);
                $( '.' +number + '-row').removeClass( 'focused-row');
                //$( '#' + oper_key + '_legend').removeClass( 'focused');
            });

            //revert highlight from table to bar
            $( '.table_row').hover( function () {
                var className = $( this ).attr( 'class');
                var number = className.substring(className.indexOf(" ")+1,className.length-4);
                //var oper_key = className.substring(className.indexOf(" ")+1,className.indexOf(" ")+2);
                $( '.freq-indicator-bar-' + number).addClass( 'focused');
                //$( '#' + oper_key + '_legend').addClass( 'focused');
            }, function () {
                var className = $( this ).attr( 'class');
                var number = className.substring(className.indexOf(" ")+1,className.length-4);
                //var oper_key = className.substring(className.indexOf(" ")+1,className.indexOf(" ")+2);
                $( '.freq-indicator-bar-' + number).removeClass( 'focused');
                //$( '#' + oper_key + '_legend').removeClass( 'focused');
            });
        }
	});
