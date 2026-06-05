require([ '/js/api.js', '/js/lib/d3.min.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js', '/js/util.js','/js/lib/handlebars.js','/js/handlebars-helpers.js','/js/lib/jquery-ui.js','/js/lib/chosen.jquery.min.js','/js/lib/jquery.blockUI.js', '../routing/routingevents.js', '../routing/routingutil.js', '../routing/routingmore.js'],
    function (api, d3, convert, console, _, $,util) {
        window.params = getUrlParams ();
        window.PROFILENAME = params.profile;
        window.MODE = $.cookie('mode');
        window.OPERATOR = $.cookie('currentOperator');
        window.lowCapacityConnectionColor ="#00b300";
        window.mediumCapacityConnectionColor ="#e6e600";
        window.highCapacityConnectionColor ="#cc0000";       
        window.user_last_active = new Date();        
        window.filtered_rru_cellres = [];
        window.filtered_cellresList = [];
        window.filtered_rru_cellres = [];
        window.filtered_zone = [];
        window.original_cres_list = [];
        window.original_rru_cellres = [];
        window.original_bands = [];
        window.routeList=[];
        window.zoneList = [];
        window.conflicting_cell_res = [];
        window.timeoutTime = 5000;
        window.expand_all = false;
        window.registeredRfrangeList=[];
        window.isChanged = false;
        window.rfquotaList=[];
        window.rfNominalList=[];
        window.originalRFOffset =[];
        window.rfCellresLevelPerRemote = [];
        window.default_operator_rf_quotas =[];
        window.rruMinPowerLevel=0;
        window.rruMaxPowerLevel = 100;
        window.rruMinALCNominalPowerLevel=-10;
        window.rruMaxALCNominalPowerLevel = 10;
        window.rruMinGainNominalPowerLevel=-20;
        window.rruMaxGainNominalPowerLevel = 10;
        window.cellresMinALCPowerLevel = 0;
        window.cellresMaxALCPowerLevel =100;
        window.cellresMinGainPowerLevel = -20;
        window.cellresMaxGainPowerLevel = 25;
        window.cellresDefaultALCPowerLevel = -15;
        window.cellresDefaultGainPowerLevel = 0;
        window.cellresDefaultDlAlarmThreshold = -5;
        window.cellresDefaultUlAlarmThreshold = -5;
        window.cellresDefaultUlLevel = -120;
        window.sectorList = [];
        window.bundleList = [];
        window.showGainMgmtBtn = true;
        window.rfrangePowerList=[];
        window.rfrangeSlotList=[];
        window.rruBundleList = [];
        window.rruByOrder = [];
        window.cpriCapa = [];
        window.dspCapa = [];
    
        window.rruSelectorsValues = [];
        
        window.conf_error_occured = false;
        window.conf_error_message = "";
        //Tag helper
        window.sectorToMTDIList = {};

        window.conn=[];
        window.rfConn=[];

        var rfValue=[];

        window.ShowTimeOutWarningAndReturn = ShowTimeOutWarningAndReturn;
        function ShowTimeOutWarningAndReturn()
        {
            if(user_last_active != null)
            {
                var dif = user_last_active.getTime() - new Date().getTime();
                var seconds = Math.abs(dif / 1000);
                if(seconds < 300)
                {
                    var lock_status = null;
                    MakeALockRequest();
                }
                else
                {
                    //display dialog saying its about to timeout
                    seconds * 60;
                    var diff = new Date() - last_lock_time;
                    var mm = Math.floor(diff / 1000 / 60);
                    mm = 10 - mm;
                    if(mm <= 0)
                    {
                        mm =0;
                    }
                    $('#timeout_span').text(mm);

                    if(!$("#dialog_timer").dialog( "isOpen" ))
                    {
                        $('#dialog_timer').dialog("open");
                    }
                }
            }
            setTimeout(ShowTimeOutWarningAndReturn, timeoutTime);
        }

        window.MakeALockRequest = MakeALockRequest;
        function MakeALockRequest()
        {
            /*api.exe({
                cmd:'RFROUTE -o '+OPERATOR+' ' + PROFILENAME + ' LOCK',
                dataType:'text',
                async:true,
                onSuccess:function(o){
                    //do nothing just hide the timeout dialog
                    last_lock_time = new Date();
                },
                onError:function(o){
                    displayFailedToLock();
                }
            });*/
        }

        function displayFailedToLock()
        {
            $("#dialog_del").dialog('option', 'buttons', {
                "Ok": function () {
                    window.location = '/target/profiles/';
                }
            });
            $("#dialog_del").dialog("open");
        }


        /************************** all parse functions **************************/

        function RequestRfMesaurements()
        {
            if((MODE ==="view") || (MODE ==="edit"))
            {
                if(MODE ==="view")
                {
                   axshCall( "get prm", function ( out, err ) {
                      if ( err ) {
                        console.error( "Could not read prm attribute: " + err );
                        return;
                      }
                      if((out == 11) || (out == 22)){        
                         axshCall( "get redactive", function ( out, err ) {
                           if ( err ) {
                              console.error( "Could not read redactive attribute: " + err );
                              return;
                           }
                           if(out == 1){ 
                              $("#mode_status").text("Active");
                              $('#mode_status').css('color', "green");
                           }else{
                              $("#mode_status").text("Mute");
                              $('#mode_status').css('color', "red");
                           }
                         });
                      }else{
                        $('#mode_div').hide();
                      }
                   });
                }else{
                  $('#mode_div').hide();
                }

                api.exe({
                    cmd: 'rfmeasurement -o ' + OPERATOR + ' --json',
                    dataType: 'json',
                    onSuccess: function (e) {
                        $('.rfm_indicator').hide();
                        //console.log(e);
                        //e.ajaxdata = $.parseJSON(e.ajaxdata);
                        for (var i = 0; i < e.ajaxdata.Nodes.length; i++) {
                            var nodeData = e.ajaxdata.Nodes[i];
                            if (nodeData.Node != "") {
                                for (var l = 0; l < nodeData.Composite.length; l++) {
                                    var selector = '#rfm_' + l + '_indicator_' + nodeData.Node;
                                    var selector2 = '#rfmMore_' + l + '_' + nodeData.Node;
                                    var sel2 = '#rfm_indicator_title_' + l + '_' + nodeData.Node;
                                    var sel22 = '#rfmMore_indicator_title_' + l + '_' + nodeData.Node;

                                    if(nodeData.Composite[l].CompositeOutput == "")
                                    {
                                        $(sel2).html("-");
                                    }else {
                                        var OldRange = (30 - -30);
                                        var NewRange = (100 - 0);
                                        var NewValue = (((nodeData.Composite[l].CompositeOutput - -30) * NewRange) / OldRange) + 0;
                                        if(_.isNaN(NewValue))
                                        {
                                            NewValue = 0;
                                        }
                                        NewValue = Math.round( NewValue * 10) / 10;
                                        //SetProgBarVal(selector, NewValue);
                                        //$(sel2).html("" + nodeData.Composite[l].Band);
                                        $(selector2).html(" " + nodeData.Composite[l].CompositeOutput + " dBm");
                                    }
                                }
                                for (var x = 0; x < nodeData.PerCellResource.length; x++) {
                                    var selectorLocal = '#per_cell_local_' + nodeData.PerCellResource[x].CellRes + '_' + nodeData.Node;
                                    var selectorRemote = '#per_cell_remote_' + nodeData.PerCellResource[x].CellRes + '_' + nodeData.Node;
                                    var details = "";
                                    var colorLocal;
                                    var colorRemote;
                                    var numLocal;
                                    var numRemote;
                                    var strLocal;
                                    var strRemote;
                                    var Alc;
                                    var ULGainOffset;
                                    
                                    if (nodeData.PerCellResource[x]["DL Level"] != "") {
                                        var tmp = Number(nodeData.PerCellResource[x]["DL Level"])
                                        if(tmp > 100)
                                        {
                                            colorLocal = "grey";   
                                            tmp /= 100;
                                            var tmp2 = parseFloat(tmp).toFixed(1);                                            
                                            numLocal = tmp2;                                          
                                        }
                                        else 
                                        {
                                            colorLocal = "green";   
                                            numLocal = nodeData.PerCellResource[x]["DL Level"];
                                        }
                                        if (numLocal < -120){
                                            numLocal /= 100;
                                            colorLocal = "grey";   
                                        }
                                        
                                        if (numLocal == -120){
                                           strLocal = 'User Mute'; 
                                        }else{
                                           strLocal = numLocal; 
                                        } 
                                       
                                        if (numLocal >= -25){
                                           $(selectorLocal).css({"color":colorLocal,"font-size":"10px","font-weight":"bold"});
                                           $(selectorLocal).prev("input").hide();
                                        }else if(numLocal == -120){
                                           $(selectorLocal).css({"color":"red","font-size":"10px","font-weight":"normal"});
                                           $(selectorLocal).prev("input").hide();
                                        }else{
                                           $(selectorLocal).css({"color":"grey","font-size":"8px","font-weight":"normal"});
                                           $(selectorLocal).prev("input").hide();
                                        }
                                    } else {
                                        strLocal = "-";
                                    }

                                    if (nodeData.PerCellResource[x]["PairOutputLevel"] != "-") {
                                       if (nodeData.PerCellResource[x]["PairOutputLevel"] != "") {
                                           var tmp = Number(nodeData.PerCellResource[x]["PairOutputLevel"])
                                           if(tmp > 100)
                                           {
                                               colorRemote = "grey";   
                                               tmp /= 100;
                                               var tmp2 = parseFloat(tmp).toFixed(1);                                            
                                               numRemote = tmp2;                                          
                                           }
                                           else 
                                           {
                                               colorRemote = "green";   
                                               numRemote = nodeData.PerCellResource[x]["PairOutputLevel"];
                                           } 
                                           if (numRemote < -120){
                                               numRemote /= 100;
                                               colorRemote = "grey"; 
                                           }

                                           if (numRemote == -120){
                                               strRemote = 'User Mute'; 
                                           }else{
                                               strRemote = numRemote; 
                                           }
                                           
                                           if (numRemote >= -25){
                                              $(selectorRemote).css({"color":colorRemote,"font-size":"10px","font-weight":"bold"});
                                              $(selectorRemote).prev("input").hide();
                                           }else if(numRemote == -120){
                                               $(selectorRemote).css({"color":"red","font-size":"10px","font-weight":"normal"});
                                               $(selectorRemote).prev("input").hide();
                                           }else{
                                              $(selectorRemote).css({"color":"grey","font-size":"8px","font-weight":"normal"});
                                              $(selectorRemote).prev("input").hide();
                                           }
                                       } else {
                                           strRemote = "";
                                       }
                                    } else {
                                        strRemote = "";
                                    }

                                    $.each(rfCellresLevelPerRemote,function(i, value){
                                        var rru_band = null 
                                        if(rfCellresLevelPerRemote[i] != null){
                                           if(_.findWhere(filtered_cellresList,{"ResID":rfCellresLevelPerRemote[i].CellRes}) != undefined)
                                             rru_band = _.findWhere(filtered_cellresList,{"ResID":rfCellresLevelPerRemote[i].CellRes}).Band//$(this).attr('band')
                                        }

                                        if(rfCellresLevelPerRemote[i].Destinations == nodeData.Node && rfCellresLevelPerRemote[i].CellRes == nodeData.PerCellResource[x].CellRes ){
                                            // for tooltip
                                            if(rru_band != null) 
                                            {
                                               Alc = AlcOffsetTodBm(rfCellresLevelPerRemote[i].ALCOffset,nodeData.Node,rru_band)
                                               ULGainOffset = rfCellresLevelPerRemote[i].ULGainOffset
                                            }
                                        }
                                    })

                                    //console.log(default_operator_rf_quotas)
                                    $(selectorLocal).html(strLocal+' ');
                                    if (strLocal != "-")
                                        if (isNaN(Alc)){
                                            $(selectorLocal).prop('title', 'DL: '+numLocal + ' dBm \nUL: '+nodeData.PerCellResource[x]["UL Level"]+' dBm');
                                        }else{
                                            if (ULGainOffset == 0){
                                                $(selectorLocal).prop('title', 'DL: '+numLocal + ' dBm \nUL: '+nodeData.PerCellResource[x]["UL Level"]+' dBm \nSettings \nDL: '+Alc+' dBm \n');
                                            }else{
                                                $(selectorLocal).prop('title', 'DL: '+numLocal + ' dBm \nUL: '+nodeData.PerCellResource[x]["UL Level"]+' dBm \nSettings \nDL: '+Alc+' dBm \nGain Offset: '+ULGainOffset+' dBm \n');
                                            }
                                        }
                                    if (strRemote != ""){
                                       $(selectorRemote).html('('+strRemote+') ');
                                       if (strRemote != "-")
                                          $(selectorRemote).prop('title', 'Redundant: '+numRemote + ' dBm');
                                    }
                                }
                            }
                        }

                        for (var i = 0; i < e.ajaxdata.OverallResource.length; i++)
                        {
                            var nodeData = e.ajaxdata.OverallResource[i];
                            var leddata = "#cres_pow_"+nodeData.CellRes;
                            var strDownlink = nodeData["DL Level"];
                            if(strDownlink == -120)
                              strDownlink = "User Mute";
                            var strUplink = nodeData["UL Level"];
                            if(strUplink == -120)
                              strUplink = "User Mute";
                            $(leddata).prop('title', 'Downlink: '+strDownlink+' Uplink: '+strUplink);
                            $(leddata).removeClass("led gray").removeClass("led green").removeClass("led red");
                            if (isNaN(parseInt(nodeData["DL Level"])))
                                $(leddata).addClass("led red unblink");
                            else {
                                var rfCompare = -60;
                                if (rfValue[nodeData.CellRes] != undefined)
                                    rfCompare = rfValue[nodeData.CellRes];
                                if ((parseInt(nodeData["DL Level"]) > rfCompare) && (parseInt(nodeData["DL Level"]) > -45))
                                    $(leddata).addClass("led green");
                                else
                                    $(leddata).addClass("led red unblink");
                            }
                        }
                        setTimeout(function () {
                            RequestRfMesaurements();
                        }, 10000);
                    }
                });
            }
            else
            {
                $( ".rfm_progress_indicator" ).each(function() {
                    $( this ).hide();
                });
            }
        }

        //setTimeout(function(){ RequestRfMesaurements(); }, 10000);

        /************************** all Render functions **************************/

        //6 more functions

        function confirmExit()
        {
            return "You have attempted to leave this page.  If you have made any changes to the fields without clicking the Save button, your changes will be lost.  Are you sure you want to exit this page?";
        }

        window.UnlockProfile = UnlockProfile;
        function UnlockProfile()
        {
            api.exe({
                cmd:'RFROUTE -o '+OPERATOR+' '+ PROFILENAME + ' UNLOCK',
                dataType:'text',
                async: false,
                onSuccess:function(o){
                    window.location = '/target/profiles/';
                },
                onError:function(o)
                {
                    window.location = '/target/profiles/';
                }
            })
        }

        window.ShowConfirmBackDialog = ShowConfirmBackDialog;
        function ShowConfirmBackDialog(){
            if(AnyChanges())
            {
                $("#confirm_back").dialog('option', 'buttons', {
                    "Yes": function () {
                        UnlockProfile();
                    },
                    "Cancel": function () {
                        $("#confirm_back").dialog("close");
                    }
                });
                $("#confirm_back").dialog("open");
            }
            else
            {
                UnlockProfile();
            }
        }

        window.openFilterSetting = openFilterSetting;
        function openFilterSetting(){
            var selectedSectorList =[];
            var foundSectorList=[];
            var foundBandCellresList=[];
            var foundTechCellresList=[];
            var foundSectorCellresList=[];
            var cellresList=[];
            var selectedCellresList =[];
            var foundCellresList=[];
            var unroutedCellresList=[];
            var selectedZoneList =[];

            if ($.cookie('filtered_zone') != undefined){
               filtered_zone = $.cookie('filtered_zone');
            }

            $('#num_of_selected_sector').parent().hide();
            $('#num_of_selected_cellres').parent().hide();
            $('#num_of_selected_zone').parent().hide();

            function deselectAllSector(){
                $('select#sector option').prop('selected', false);
                $('#sector_selected_list').empty();
                $("#sector").trigger('chosen:updated');
                selectedSectorList=[];
                foundSectorCellresList=cellresList;
                //$('#num_of_selected_sector').text(selectedSectorList.length.toString());
                $("#sector").trigger('chosen:updated');
                $("#sector").trigger('chosen:close');
                //update found cell res list and unrouted cellres list when sector change
                updateCellresResult(true);
                //once deselect sector, deselect celres as well
                $('#cellres_selected_list').empty();
                selectedCellresList=[];
                //$('#num_of_selected_cellres').text(selectedCellresList.length.toString());
                $('#num_of_selected_sector').parent().hide();
                $('#num_of_selected_cellres').parent().hide();
                $("#cellres").trigger('chosen:updated');
                $("#cellres").trigger('chosen:close');
            }

            function deselectAllCellres(){
                $('select#cellres option').prop('selected', false);
                $('#cellres_selected_list').empty();
                $("#cellres").trigger('chosen:updated');
                selectedCellresList=[];
                $('#num_of_selected_cellres').text(selectedCellresList.length.toString());
                $('#num_of_selected_cellres').parent().hide();
                $("#cellres").trigger('chosen:close');
            }

            function deselectAllZone(){
                $('select#zone option').prop('selected', false);
                $('#zone_selected_list').empty();
                $("#zone").trigger('chosen:updated');
                selectedZoneList=[];
                $('#num_of_selected_zone').parent().hide();
                $("#zone").trigger('chosen:close');
            }

            function updateCellresResult(needRefresh){
                //recalculate found cellres list and unrouted cell res list when sector changed
                foundCellresList = _.intersection(_.flatten(foundBandCellresList),_.flatten(foundTechCellresList));
                unroutedCellresList = _.intersection(_.difference(_.pluck(cellresList,'ResID'),_.pluck(routeList,'CellRes')), _.pluck(foundCellresList,'ResID'));
                $('#num_of_unrouted_cellres').text(unroutedCellresList.length.toString());
                if(needRefresh){
                    refreshCellresList(_.flatten(foundCellresList));
                }
            }

            function updateSelectedCellresResult(removedSector){
                //update selected cellres when user removes sector individually
                var removedCelresList = _.pluck(_.where(cellresList,{"SectorID":removedSector}),'ResID');
                $.each(removedCelresList,function(i,celres){
                    $('li#'+celres).remove();
                    $('#cellres option[value="'+celres+'"]').prop('selected', false);
                })

                selectedCellresList = _.difference(selectedCellresList, _.pluck(_.where(cellresList,{"SectorID":removedSector}),'ResID'));
                if(selectedCellresList.length===0){
                    $('#num_of_selected_cellres').parent().hide();
                }else{
                    $('#num_of_selected_cellres').parent().show();
                    $('#num_of_selected_cellres').text(selectedCellresList.length.toString());
                }
                $("#cellres").trigger('chosen:updated');
            }

            //display band checkboxes
            var checkboxes = '';
            $.each(registeredRfrangeList, function (key, range) {
                $.each(original_bands, function (key, band) {
                    if (range.Band === band.Band) {
                        checkboxes += '<div><input type="checkbox" name="band" value="' + band.Band + '" checked/> ' + band.FullName + '</div>';
                    }
                })
            })
            $('#bands_select').append(checkboxes);
            //display technologies checkboxes
            api.exe({
                cmd:'TECHNOLOGIES --json',
                dataType:'json',
                onSuccess:function(e){
                    var checkboxes = '';
                    for(var i = 0; i < e.ajaxdata.technologies.length; i++)
                    {
                        checkboxes += '<div><input type="checkbox" name="tech" value="'+e.ajaxdata.technologies[i].Tech+'" checked/> '+e.ajaxdata.technologies[i].Desc+'</div>';
                    }
                    $('#tech_select').append(checkboxes);
                }
            });
            //get cellres list and display dropdown search list
            api.exe({
                cmd:'cellres -o '+OPERATOR+' --json',
                dataType:'json',
                onSuccess:function(e){
                    refreshCellresList(e.ajaxdata.cellres);
                    cellresList = e.ajaxdata.cellres;
                    foundBandCellresList=cellresList;
                    foundTechCellresList=cellresList;
                    foundSectorCellresList=cellresList;
                    original_cres_list = e.ajaxdata.cellres;
                    $('#total_record').text(Number(cellresList.length));
                    if(cellresList.length>200)
                    {
                        $("#filter_settings").show();
                    }
                    else
                    {
                        $('#filter_settings').hide();
                        foundCellresList = _.intersection(_.flatten(foundBandCellresList), _.flatten(foundTechCellresList), _.flatten(foundSectorCellresList));
                        if ($.cookie('filtered_cellresList') != undefined){
                           filtered_cellresList = JSON.parse($.cookie('filtered_cellresList'));
                        }else{
                           filtered_cellresList = foundCellresList;
                        }
                        //note - filter only first column!
                        //filtered_cellresList = _.sortBy(filtered_cellresList,"SectorID");
                        //loadPages();
                        //GenerateDefaultViewHtml();
                        // get unrouted list of cellresource
                        api.exe({
                            cmd:'RFROUTE -o '+ OPERATOR +' '+PROFILENAME+' --json',
                            dataType:'json',
                            onSuccess:function(e){
                                routeList = e.ajaxdata.Routes;
                                unroutedCellresList = _.difference(_.pluck(cellresList,'ResID'),_.pluck(routeList,'CellRes'));
                                $('#num_of_unrouted_cellres').text(unroutedCellresList.length.toString());
                                $('#route_name').text(e.ajaxdata.Profile);
                                $('#tag').val(e.ajaxdata.Tag);
                                routingProfileTag = e.ajaxdata.Tag;
                                $('#tag').prop('disabled', true);
                                $.each(e.ajaxdata.RFMonitoring,function(i, value){
                                  rfValue[value.CellRes] = value.DLAlrThr;
                                })
                                loadPages();
                                //originalRFOffset = e.ajaxdata.RFOffsets;
                                rfCellresLevelPerRemote = e.ajaxdata.RFOffsets;
                            }
                        });
                    }
                }
            })

            //get sector list and display dropdown search list
            api.exe({
                cmd:'sector -o '+OPERATOR+' --json',
                dataType:'json',
                onSuccess:function(e){
                    refreshSectorList(e.ajaxdata.sector);
                    sectorList = e.ajaxdata.sector;
                    foundSectorList=sectorList;
                }
            });

            $(document).off("click",'.icon.minmaxbutton')
                .on("click",'.icon.minmaxbutton',function(){
                var name = $(this).attr('title');
                var isChain = false;
                if(name.indexOf('chain_') != -1)
                  isChain = true;
                if (isChain)
                {
                    name = name.slice(name.indexOf("chain_")+6);
                    var cascade = name.slice(name.indexOf("_")+1);
                    k = Number.parseInt(cascade)-1;

                    if($(this).hasClass('maximize')){
                        document.getElementById('zoneWrapper_' + name).setAttribute('style', 'width:'+ 10 * conn[k].nodes.length +'em');
                        for(var i = 1; i < conn[k].nodes.length; i ++){
                          $('#remoteHead_' + conn[k].nodes[i].ID).show();
                          $('#remote_' + conn[k].nodes[i].ID).show();
                        }
                        for(var i =0; i< filtered_cellresList.length; i++)
                        {
                          $('#' + filtered_cellresList[i].ResID + '_' + conn[k].nodes[0].ID).show();
                        }
                        $('#node_checker_' + conn[k].nodes[0].ID).show();
                        $('#more_details_' + conn[k].nodes[0].ID).show();
                        $('#tag_' + conn[k].nodes[0].ID).show();
                        document.getElementById('indicators_' + conn[k].nodes[0].ID).removeAttribute('style');
                        $(this).removeClass('maximize').addClass('minimize2');

                        var zoneChild = document.getElementById('zoneWrapper_' + name);
                        var str = document.getElementById("zoneWrapper_"+zoneChild.getAttribute("parentid")).getAttribute('style');
                        var res = str.split(":")[1];
                        currentWidth = parseInt(res); 
                        document.getElementById("zoneWrapper_"+zoneChild.getAttribute("parentid")).setAttribute('style', 'width:'+ (currentWidth+(conn[k].nodes.length-1)*10) +'em');
                        /*
                        //show parent of son
                        var parentName = document.getElementById('zoneWrapper_' + name).getAttribute("parentid")
                        var elm = $('[id^=zoneWrapper_'+parentName+']');
                        elm[0].firstChild.setAttribute('style', 'visibility:visible');
                        */
                        console.log("show,son,if",conn[k].nodes.length);

                   }else{
                        document.getElementById('zoneWrapper_' + name).setAttribute('style', 'width:10em');
                        for(var i = 1; i < conn[k].nodes.length; i ++){
                          $('#remoteHead_' + conn[k].nodes[i].ID).hide();
                          $('#remote_' + conn[k].nodes[i].ID).hide();
                        }
                        for(var i =0; i< filtered_cellresList.length; i++)
                        {
                          //$('#' + filtered_cellresList[i].ResID + '_' + conn[k].nodes[0].ID).hide();
                        }
                        //$('#node_checker_' + conn[k].nodes[0].ID).hide();
                        //$('#more_details_' + conn[k].nodes[0].ID).hide();
                        //document.getElementById('remoteHead_' + conn[k].nodes[0].ID).setAttribute('style', 'vertical-align:top');
                        //document.getElementById('indicators_' + conn[k].nodes[0].ID).setAttribute('style', 'margin-top:3.5em');
                        //$('#tag_' + conn[k].nodes[0].ID).hide();
                        $(this).addClass('maximize2').removeClass('minimize');
                        $(this).removeClass('minimize2').addClass('maximize');

                        var zoneChild = document.getElementById('zoneWrapper_' + name);
                        var str = document.getElementById("zoneWrapper_"+zoneChild.getAttribute("parentid")).getAttribute('style');
                        var res = str.split(":")[1];
                        currentWidth = parseInt(res); 
                        document.getElementById("zoneWrapper_"+zoneChild.getAttribute("parentid")).setAttribute('style', 'width:'+ (currentWidth-(conn[k].nodes.length-1)*10) +'em');
                        /*                        
                        //hide parent of son
                        var parentName = document.getElementById('zoneWrapper_' + name).getAttribute("parentid")
                        var elm = $('[id^=zoneWrapper_'+parentName+']');
                        elm[0].firstChild.setAttribute('style', 'visibility:hidden');
                        */
                        console.log("hide,son,else",conn[k].nodes.length);

                   }                        
                }
                else
                {
                   var zoneIndex = 0;
                   for(var z = 0; z < zoneList.length; z++)
                   {
                     if (zoneList[z].ZoneName == name)
                     {
                        zoneIndex = z;
                        break;
                     }
                   }
                   var zone = _.findWhere(zoneList,{ZoneName:name});
                   var sector = _.findWhere(sectorList,{SectorID: name});
                   // zone minmaxbutton
                   if(zone != null){
                           var zone_nodes = zone.ZoneNodes;

                           if($(this).hasClass('maximize')){
                               var nodeCount = 0;
                               var kEnd = 1;
                               if (conn.length > 0){
                                 kEnd = conn.length;
                               }
                               for(var k = 0; k < kEnd; k ++) 
                               {
                                 var mEnd = 1;
                                 if (conn.length > 0){
                                   mEnd = conn[k].nodes.length;
                                 }
                                 for(var m = 0; m < mEnd; m++) 
                                 {
                                    for (var i = 0; i < zone_nodes.length; i++)
                                    {
                                       var node_id = zone_nodes[i];
                                       if (conn.length == 0 || conn[k].nodes[m].ID == node_id)
                                          nodeCount++;
                                    }
                                 }
                               }

                                //var nodeCount = 0;
                                var elements = $(".zoneWrapper")//.find("[parentid='" + name + "']");
                                for (var i = elements.length - 1; i >= 0; i--) {
                                    if(name == elements[i].attributes[2].nodeValue){
                                        //console.log(elements[i].attributes[0].nodeValue,elements[i].attributes[1].nodeValue);
                                        elements[i].setAttribute('style', 'width:'+ 10 * elements[i].attributes[1].nodeValue +'em');
                                        //console.log("elements[i]: ",elements[i])
                                        $(elements[i]).find(".icon").removeClass('maximize').addClass('minimize');
                                    }
                                }

                               document.getElementById('zoneWrapper_' + name).setAttribute('style', 'width:'+ 10 * nodeCount +'em');
                               
                               for(var i = 1; i < zone_nodes.length; i ++){
                                   $('#remoteHead_' + zone_nodes[i]).show();
                                   $('#remote_' + zone_nodes[i]).show();
                               }


                               for(var i =0; i< filtered_cellresList.length; i++)
                               {
                                   $('#' + filtered_cellresList[i].ResID + '_' + zone_nodes[0]).show();
                               }
                               $('#node_checker_' + zone_nodes[0]).show();
                               $('#more_details_' + zone_nodes[0]).show();
                               $('#tag_' + zone_nodes[0]).show();
                               if (document.getElementById('indicators_' + zone_nodes[0]) != undefined)
                                 document.getElementById('indicators_' + zone_nodes[0]).removeAttribute('style');
                               $('[id^=zoneWrapper_'+zoneIndex+'_]').show();

                               $(this).removeClass('maximize').addClass('minimize2');

                               //console.log("zoneParents: ",zoneParents);

                               var elm = $('[id^=zoneWrapper_'+zoneIndex+'_]');
                               
                               if (elm[0] != undefined){
                                  for (var j = 0; j < elm[0].childNodes.length; j++) {
                                       elm[0].childNodes[j].setAttribute('style', 'visibility:visible');
                                   }
                                }
                                // hide -/+ collapse on one child
                                if (elm[0] != undefined){
                                    for (var k = 0; k < elm.length; k++) {
                                        if(elm[k].attributes[1].value == 1){
                                            elm[k].childNodes[0].setAttribute('style', 'visibility:hidden');
                                        }
                                    }
                                }
                                console.log("show,parent,if",zone_nodes.length);
                           }else{
                               document.getElementById('zoneWrapper_' + name).setAttribute('style', 'width:10em');
                               for(var i = 1; i < zone_nodes.length; i ++){
                                   $('#remoteHead_' + zone_nodes[i]).hide();
                                   $('#remote_' + zone_nodes[i]).hide();
                               }
                               for(var i =0; i< filtered_cellresList.length; i++)
                               {
                                   //$('#' + filtered_cellresList[i].ResID + '_' + zone_nodes[0]).hide();
                               }
                               //$('#node_checker_' + zone_nodes[0]).hide();
                               //$('#more_details_' + zone_nodes[0]).hide();
                               //document.getElementById('remoteHead_' + zone_nodes[0]).setAttribute('style', 'vertical-align:top');
                               //document.getElementById('indicators_' + zone_nodes[0]).setAttribute('style', 'margin-top:3.5em');
                               //$('#tag_' + zone_nodes[0]).hide();
                               //this error
                               //$('[id^=zoneWrapper_'+zoneIndex+'_]').hide();
                               var elm = $('[id^=zoneWrapper_'+zoneIndex+'_]');

                                if (conn.length > 0)
                                 elm[0].setAttribute('style', 'width:'+ 10 +'em');
                                //console.log(elm.length)
                                for (var i = 1; i < elm.length; i++) {
                                    elm[i].setAttribute('style', 'display:none');
                                    for (var j = 0; j < elm[0].childNodes.length; j++) {
                                        elm[0].childNodes[j].setAttribute('style', 'visibility:hidden');
                                    }
                                }

                                //in case that: one chain in zone
                                if(elm.length == 1){
                                    for (var j = 0; j < elm[0].childNodes.length; j++) {
                                        elm[0].childNodes[j].setAttribute('style', 'visibility:hidden');
                                    }
                                }    

                                // in case that: hide chain and then zone 
                                if(elm.length != 0){
                                    //console.log(elm.length ,"elm.length != 0 " );
                                    for(var i = 1; i < zone_nodes.length; i ++){
                                        $('#remoteHead_' + zone_nodes[0]).show();
                                        $('#remote_' + zone_nodes[0]).show();
                                    }
                                }
                                //console.log(elm[0].childNodes);
                                $(this).addClass('maximize').removeClass('minimize2');
                                $(this).removeClass('minimize').addClass('maximize2');

                                console.log("hide,parent,else",zone_nodes.length);

                           }                        
                       }    
                   else if (sector != null){
                       var maxim = $(this).hasClass('maximize');
                       for(var i =0; i< filtered_cellresList.length; i++)
                       {
                           var obj = $('#' + filtered_cellresList[i].ResID + '_' + sector.SectorID + '_row');
                           if (obj != null){
                               maxim ? obj.show() : obj.hide();
                               for(var z=0; z< zoneList.length; z++)
                               {
                                   for (var rruIndex = 0; rruIndex < zoneList[z].ZoneNodes.length; rruIndex++) {
                                       var node_id = zoneList[z].ZoneNodes[rruIndex];
                                       var box = $('#' + filtered_cellresList[i].ResID + '_' + node_id + sector.SectorID +'_box');
                                       maxim ? box.show() : box.hide();
                                   }
                               }
                           }
                       }
                       if (maxim){
                           $(this).removeClass('maximize').addClass('minimize');
                       }
                       else {
                           $(this).addClass('maximize').removeClass('minimize');
                       }
                   }
                }
            })
            
            /* start sector list dropdown behavior */
            $("#sector").chosen({
                disable_search_threshold: 10,
                no_results_text: "No BTS port found!",
                width: "350px",
                placeholder_text_multiple: "Select sectors",
                search_contains:true,
                display_selected_options:false
            });

            //select all on click
            $(document).on('click','.sector.select',function(){
                foundSectorCellresList=[];
                var ids=[];
                $('td#sector-cell').find(".chosen-container").find('.active-result').each(function () { ids.push(parseInt($(this).attr('data-option-array-index'))); });
                $(ids).each(function () {
                    $($('#sector option')[this]).attr('selected', 'selected');
                    $('#sector_selected_list').append("<li class='selected_list' id="+$($('#sector option')[this]).val()+">"+$($('#sector option')[this]).val()+"<div class='sector icon error'></div></li>")
                    selectedSectorList.push($($('#sector option')[this]).val());
                    foundSectorCellresList.push(_.where(cellresList,{"SectorID":$($('#sector option')[this]).val()}));
                });
                $.each(selectedSectorList,function(key,value){
                    foundSectorCellresList.push(_.where(cellresList,{"SectorID":value}));
                })
                //update found cell res list and unrouted cellres list when sector change
                updateCellresResult(true);
                $('#num_of_selected_sector').parent().show();
                $('#num_of_selected_sector').text(selectedSectorList.length.toString());
                $("#sector").trigger('chosen:updated');
                $("#sector").trigger('chosen:close');
            });

            //deselect all on click
            $(document).on('click','.sector.deselect',function(){
                deselectAllSector();
            });

            //append select all and deselect all into dropdown
            $('#sector').on('chosen:showing_dropdown', function(evt, params) {
                $('.select_btn_panel').remove();
                var btn_panel = "<div class='select_btn_panel'><a class='button sector select'>Select all</a><a class='button sector deselect'>Deselect all</a></div>"
                $('.chosen-drop').prepend(btn_panel);
            })

            //when select single option
            $('#sector').on('change', function(evt, params) {
                foundSectorCellresList=[];
                $('#sector_selected_list').append("<li class='selected_list' id='"+params.selected+"'>"+params.selected+"<div class='sector icon error'></div></li>");
                selectedSectorList.push(params.selected);
                $.each(selectedSectorList,function(key,value){
                    foundSectorCellresList.push(_.where(cellresList,{"SectorID":value}));
                })
                $('#num_of_selected_sector').parent().show();
                $('#num_of_selected_sector').text(selectedSectorList.length.toString());
                $("#sector").trigger('chosen:updated');
                //update found cell res list and unrouted cellres list when sector change
                updateCellresResult(true);
            });

            //cancel select sector
            $(document).on('click','.sector.icon.error',function(){
                foundSectorCellresList=[];
                $(this).parent().remove();
                var index = selectedSectorList.indexOf($(this).parent().attr('id'));
                selectedSectorList.splice(index, 1);

                //update found sector cell resource list when remove selected sector
                if(selectedSectorList.length ===0){
                    foundSectorCellresList = cellresList;
                    $('#num_of_selected_sector').parent().hide();
                }else{
                    $('#num_of_selected_sector').parent().show();
                    $('#num_of_selected_sector').text(selectedSectorList.length.toString());
                    $.each(selectedSectorList,function(key,value){
                        foundSectorCellresList.push(_.where(cellresList,{"SectorID":value}));
                    })
                }
                $('#sector option[value="'+$(this).parent().attr('id')+'"]').prop('selected', false);
                $("#sector").trigger('chosen:updated');

                //update found cell res list and unrouted cellres list when sector change
                updateCellresResult(false);

                //update the selected list displayed for celres when particular sector is removed
                updateSelectedCellresResult('sector',$(this).parent().attr('id'));
            })
            /*end sector list drop down behavior */

            /* start zone list dropdown behavior */
            $("#zone").chosen({
                disable_search_threshold: 10,
                no_results_text: "No zone found!",
                width: "350px",
                placeholder_text_multiple: "Select zones",
                search_contains:true,
                display_selected_options:false
            });

            //select all on click
            $(document).on('click','.zone.select',function(){
                var ids=[];
                $('td#zone-cell').find(".chosen-container").find('.active-result').each(function () { ids.push(parseInt($(this).attr('data-option-array-index'))); });
                $(ids).each(function () {
                    $($('#zone option')[this]).attr('selected', 'selected');
                    $('#zone_selected_list').append("<li class='selected_list' id="+$($('#zone option')[this]).val()+">"+$($('#zone option')[this]).val()+"<div class='zoneErr icon error'></div></li>")
                    selectedZoneList.push($($('#zone option')[this]).val());
                });
                //update found cell res list and unrouted cellres list when sector change
                $('#num_of_selected_zone').parent().show();
                $('#num_of_selected_zone').text(selectedZoneList.length.toString());
                $("#zone").trigger('chosen:updated');
                $("#zone").trigger('chosen:close');
            });

            //deselect all on click
            $(document).on('click','.zone.deselect',function(){
                deselectAllZone();
            });

            //append select all and deselect all into dropdown
            $('#zone').on('chosen:showing_dropdown', function(evt, params) {
                $('.select_btn_panel').remove();
                var btn_panel = "<div class='select_btn_panel'><a class='button zone select'>Select all</a><a class='button zone deselect'>Deselect all</a></div>"
                $('.chosen-drop').prepend(btn_panel);
            })

            //when select single option
            $('#zone').on('change', function(evt, params) {
                $('#zone_selected_list').append("<li class='selected_list' id='"+params.selected+"'>"+params.selected+"<div class='zoneErr icon error'></div></li>");
                selectedZoneList.push(params.selected);
                $('#num_of_selected_zone').parent().show();
                $('#num_of_selected_zone').text(selectedZoneList.length.toString());
                $("#zone").trigger('chosen:updated');
            });

            //cancel select sector
            $(document).on('click','.zoneErr.icon.error',function(){
                $(this).parent().remove();
                var index = selectedZoneList.indexOf($(this).parent().attr('id'));
                selectedZoneList.splice(index, 1);

                //update found sector cell resource list when remove selected sector
                if(selectedZoneList.length ===0){
                    $('#num_of_selected_zone').parent().hide();
                }else{
                    $('#num_of_selected_zone').parent().show();
                    $('#num_of_selected_zone').text(selectedZoneList.length.toString());
                }
                $('#zone option[value="'+$(this).parent().attr('id')+'"]').prop('selected', false);
                $("#zone").trigger('chosen:updated');
            })
            /*end zone list drop down behavior */

            /* start cellres list dropdown behavior */
            $("#cellres").chosen({
                disable_search_threshold: 10,
                no_results_text: "No cell resource found!",
                width: "350px",
                placeholder_text_multiple: "Select cell resources",
                search_contains:true,
                display_selected_options:false
            });

            //select all cell resource on click
            $(document).on('click','.cellres.select',function(){
                var ids=[];
                $('td#cellres-cell').find(".chosen-container").find('.active-result').each(function () { ids.push(parseInt($(this).attr('data-option-array-index'))); });
                $(ids).each(function () {
                    $($('#cellres option')[this]).attr('selected', 'selected');
                    $('#cellres_selected_list').append("<li class='selected_list' id="+$($('#cellres option')[this]).val()+">"+$($('#cellres option')[this]).val()+"<div class='cellres icon error'></div></li>")
                    selectedCellresList.push($($('#cellres option')[this]).val())
                });
                $('#num_of_selected_cellres').parent().show();
                $('#num_of_selected_cellres').text(selectedCellresList.length.toString());
                $("#cellres").trigger('chosen:updated');
                $("#cellres").trigger('chosen:close');
            });

            //deselect all cell resource on click
            $(document).on('click','.cellres.deselect',function(){
                deselectAllCellres();
            });

            //when select single cell resource option
            $('#cellres').on('change', function(evt, params) {
                $('#cellres_selected_list').append("<li class='selected_list' id='"+params.selected+"'>"+params.selected+"<div class='cellres icon error'></div></li>");
                $('#num_of_selected_cellres').parent().show();
                selectedCellresList.push(params.selected);
                $('#num_of_selected_cellres').text(selectedCellresList.length.toString());
                $("#cellres").trigger('chosen:updated');
            });

            //append select all and deselect all into dropdown
            $('#cellres').on('chosen:showing_dropdown', function(evt, params) {
                $('.select_btn_panel').remove();
                var btn_panel = "<div class='select_btn_panel'><a class='button cellres select'>Select all</a>" +
                                "<a class='button cellres deselect'>Deselect all</a>" +
                                "<label><input type='checkbox' name='unrouted' value='unrouted'> Unrouted only</label></div>"
                $('.chosen-drop').prepend(btn_panel);
            })

            //TODO: unrouted checkbox on click function
            $(document).on('click','input[name="unrouted"]',function(){

                if($(this).is(':checked')){
                    var tempArr=[];
                    $.each(unroutedCellresList,function(i,v){
                        $.each(cellresList,function(key,value){
                            if(v === value.ResID){
                                tempArr.push(value);
                            }
                        })
                    })
                    refreshCellresList(tempArr);
                    $('#cellres').trigger('chosen:updated');
                }else{
                    refreshCellresList(foundCellresList);
                    $('#cellres').trigger('chosen:updated');
                }
            })
            //cancel select sector
            $(document).on('click','.cellres.icon.error',function(){
                $(this).parent().remove();
                var index = selectedCellresList.indexOf($(this).parent().attr('id'));
                selectedCellresList.splice(index, 1);
                if(selectedCellresList.length===0){
                    $('#num_of_selected_cellres').parent().hide();
                }else{
                    $('#num_of_selected_cellres').parent().show();
                    $('#num_of_selected_cellres').text(selectedCellresList.length.toString());
                }
                $('#cellres option[value="'+$(this).parent().attr('id')+'"]').prop('selected', false);
                $("#cellres").trigger('chosen:updated');
            })
            /*end sector list drop down behavior */
            $(document).on('click','input[name="band"]',function() {
                if ($('input[name="band"]:checked').length === 0) {
                    foundSectorList = [];
                    foundBandCellresList = [];
                } else {
                    //band are all checked as default ==> create foundSectorList and foundBandCellresList based on band checked
                    if ($(this).is(':checked')) {
                        foundSectorList = _.union(foundSectorList,_.where(sectorList, {"Band": $(this).val()}));
                        foundBandCellresList = _.union(foundBandCellresList,_.where(cellresList, {"Band": $(this).val()}));
                    } else {
                        foundSectorList = _.difference(foundSectorList,_.flatten(_.where(sectorList, {"Band": $(this).val()})));
                        foundBandCellresList= _.difference(foundBandCellresList, _.flatten(_.where(cellresList, {"Band": $(this).val()})));
                        //in case sector and cell res have been selected but band and tech change
                        //need to remove inappropriate selected sector and cellres then update the total
                        updateSelectedCellresResult("band", _.where(sectorList, {"Band": $(this).val()}));
                    }
                }
                refreshSectorList(_.flatten(foundSectorList));
                updateCellresResult(true);
                //if sector and cellres has been selected, update band and technology checkbox will refresh all of them, deselect all sector and cellres
                deselectAllCellres();
                deselectAllSector();
            })

            $(document).on('click','input[name="tech"]',function() {
                if ($('input[name="tech"]:checked').length === 0) {
                    foundTechCellresList = [];
                } else {
                    //band are all checked as default ==> create foundSectorList and foundBandCellresList based on band checked
                    if ($(this).is(':checked')) {
                        foundTechCellresList = _.union(foundTechCellresList,_.where(cellresList, {"Tech": $(this).val()}));
                    } else {
                        foundTechCellresList= _.difference(foundTechCellresList, _.flatten(_.where(cellresList, {"Tech": $(this).val()})));
                        //in case sector and cell res have been selected but band and tech change
                        //need to remove inappropriate selected sector and cellres then update the total
                        updateSelectedCellresResult("tech", $(this).val());
                    }
                }
                updateCellresResult(true);
                //if sector and cellres has been selected, update band and technology checkbox will refresh all of them, deselect all sector and cellres
                deselectAllCellres();
                deselectAllSector();
            })

            $('#filter').click(function(){
                filtered_zone = selectedZoneList;
                $.removeCookie('filtered_zone');
                $.cookie('filtered_zone', filtered_zone);
                if (selectedCellresList.length === 0) {
                    foundCellresList = _.intersection(_.flatten(foundBandCellresList), _.flatten(foundTechCellresList), _.flatten(foundSectorCellresList));
                    filtered_cellresList = foundCellresList;
                } else {
                    var tempArr = [];
                    $.each(selectedCellresList, function (i, v) {
                        $.each(cellresList, function (key, value) {
                            if (v === value.ResID) {
                                tempArr.push(value);
                            }
                        })
                    })
                    filtered_cellresList = tempArr;
                }
                $.removeCookie('filtered_cellresList');
                $.cookie('filtered_cellresList', JSON.stringify(filtered_cellresList));
                if(filtered_cellresList.length>0) {
                    $('#displayed_record').text(Number(filtered_cellresList.length));
                    $('#start_filter').dialog('open');
                    loadPages();
                    $("#filter_settings").hide();
                }
            })
        }

        window.AnyChanges = AnyChanges;
        function AnyChanges()
        {
            var MSG = "There is unsaved changes. Are you sure you want to leave this page?";
            var askUser = false;
            if(isChanged) {
                api.exe({
                    cmd: "RFROUTE -o " + OPERATOR + ' ' + PROFILENAME + " --json",
                    dataType: "json",
                    async: false,
                    onSuccess: function (o) {
                        var rfroute = o.ajaxdata;
                        var rfroutes_to_add = [];
                        //TODO: add in selected list, this is not working with the new filtering
                        $('input[type=checkbox]').each(function () {
                            //sList += "(" + $(this).val() + "-" + (this.checked ? "checked" : "not checked") + ")";
                            if ($(this).hasClass('remote_checkbox')) {
                                if (this.checked) {
                                    var res = this.id.split("_");
                                    var objex = {};
                                    objex.cres = res[0] + "_" + res[1];
                                    objex.rru_serial = res[2];
                                    rfroutes_to_add.push(objex);
                                }
                            }
                        });
                        var grouped_rfroutes = _.groupBy(rfroutes_to_add, function (ojj) {
                            return ojj.cres
                        });

                        var existing_cres = _.pluck(rfroute.Routes,'CellRes');
                        var gui_cres = _.uniq(_.pluck(rfroutes_to_add, 'cres'));
                        if(_.difference(existing_cres,gui_cres).length != 0)
                        {
                            askUser = true;
                        }
                        if(!askUser)
                        {
                        $.each(grouped_rfroutes, function (key, value) {
                            var nodes_to_cres = "";
                            if(!askUser)
                            {
                                $.each(value, function (key2, value2) {
                                    nodes_to_cres += value2.rru_serial + " ";
                                })
                                var find = _.findWhere(rfroute.Routes,{'CellRes':key});
                                if(find)
                                {
                                    //all is ok now check the nodes
                                    if(nodes_to_cres.trim() != find.Destinations.trim())
                                    {
                                        //something is different
                                        askUser = true;
                                    }
                                }
                                else
                                {
                                    //something is different
                                    askUser = true;
                                }
                            }
                            else
                            {
                                //break the loop
                                return false;
                            }
                        })
                        }

                    }
                });
            }
            if(askUser)
            {
                return MSG;
            }
            else
            {
                return ;
            }
        }

        var routingProfileTag = "";
        $( document ).ready(function() {

            //load: js/routingevents.js
            setTimeout(function(){
                routingEvents(api);
            },100)

        });

        window.loadPages = loadPages;
        function loadPages(){
            api.exe({
                cmd:"zone -o "+OPERATOR+" list --nodes",
                onSuccess:function(o){
                    ParseZoneData(o);
                    api.exe({
                        cmd:"topology -o "+OPERATOR+" --json",
                        dataType:"json",
                        onSuccess:function(e){
                            /*
                            api.exe({
                                cmd:'mimobuddy -o '+OPERATOR+' --json',
                                dataType:'json',
                                async:false,
                                onSuccess:function(z){*/
                            api.exe({
                                cmd:"connections -o "+OPERATOR+" --json",
                                dataType:"json",
                                async:false,
                                onSuccess:function(d){
                                    parseCPRIQuota(d.ajaxdata.connections);
                                    //console.log(d.ajaxdata.connections);
                                    //console.log("d.ajaxdata.BUNDLEGROUP",d.ajaxdata.BUNDLEGROUP);
                                    parseBundleGroup(d.ajaxdata.BUNDLEGROUP); //parse json
                                    parseSectorToMTDI(d.ajaxdata.rf_connections);
                                    //console.log(d.ajaxdata.rf_connections);
                                    api.exe({
                                        cmd:"filterquota -o "+OPERATOR+" ALLOCATED RRU --json",
                                        dataType:"json",
                                        onSuccess:function(a){
                                            api.exe({
                                                cmd:"filterquota -o "+OPERATOR+" USED RRU --json",
                                                dataType:"json",
                                                onSuccess:function(b){
                                                    parseFilterQuota(a,b);
                                                    api.exe({
                                                        cmd:"rfranges --json",
                                                        dataType:"json",
                                                        async:false,
                                                        onSuccess:function(r){
                                                            parseRFRangesConflict(r.ajaxdata.nodes);
                                                            topologyList = e.ajaxdata;
                                                            CreateCresConflictingFrequencies();
                                                            ParseRoutes(routeList);
                                                            //parseMIMOBuddy(d);
                                                            //parseBundlegroup(d);
                                                            GenerateDefaultViewHtml();
                                                            RequestRfMesaurements();
                                                        }
                                                    });
                                                }
                                            })
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            })
            //store rfpower quota for each band in an array
            /*api.exe({
                cmd: 'bands --json',
                dataType: 'json',
                async: false,
                onSuccess: function (o) {
                    var bandList=[];
                    var default_rf_quotas_cmd ="";
                    $.each(o.ajaxdata.bands, function (i, band) {
                        bandList.push(band.Band);
                    })
                    //topology_command = 'topology -o ' + operator.SysName + ' --json';
                    $.each(bandList, function (j, band) {
                        default_rf_quotas_cmd += 'opset rfquota ' + OPERATOR +' default'+ ' ' + band;
                        if (j != bandList.length - 1) {
                            default_rf_quotas_cmd += " & ";
                        }
                    })
                    api.exe({
                        cmd: default_rf_quotas_cmd,
                        async: false,
                        onSuccess:function(o){
                            var objects = o.ajaxdata.split('\n');
                            for (var j = 0; j < objects.length; j++) {
                                if (objects[j].indexOf("quota") >= 0) {
                                    var def_quota = objects[j].match(/\d+\.\d{0,2}/);
                                    default_operator_rf_quotas.push({"Band":bandList[j],"RFQuota":Number(def_quota)});
                                }
                            }
                        },
                        onError:function(err){
                            axellPopUp(err.errorThrown)
                        }
                    })
                },
                onError:function (err) {
                    axellPopUp(err.errorThrown);
                }
            })*/
            $.each(rfquotaList, function (i, val) {
                default_operator_rf_quotas.push({"Band":val.Band,"RFQuota":val.Quota});
            })
        }

        function px(input) {
            var emSize = parseFloat($("body").css("font-size"));
            return (input / emSize);
        }

    })
