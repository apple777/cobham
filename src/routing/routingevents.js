require([ '/js/api.js','/js/util.js', '/js/convert.js',],
    function (api, util, convert) {

        var routesAdd = [];
        var routesRemove = [];

        var bandsList=[];
        api.exe({
           cmd:'bands --json',
           dataType:'json',
           onSuccess:function(o){
               bandsList = o.ajaxdata.bands;
           }  
        });

        function download(filename, text) {
           var element = document.createElement('a');
           element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
           element.setAttribute('download', filename);

           element.style.display = 'none';
           document.body.appendChild(element);

           element.click();

           document.body.removeChild(element);
        }

        window.routingEvents = routingEvents;
        function routingEvents(api){

                    var dialogIsChanged = false;
                    var levelIsChanged = false;
                    
                    var bandsCompare = 10;


                    $('#save').addClass('disabled');
                    $(document).on("click",".node_checker",function(event) {
                        conf_error_occured = false;
                        var nodeId = event.target.id.replace("node_checker_","");
                        var toggleMe = $('.remote_checkbox');
                        var quickLy = $('.remote_checkbox').find("[node-id='" + nodeId + "']");
                        for(var i=0; i < toggleMe.length; i++)
                        {
                            if(toggleMe[i].attributes['node-id'].value == nodeId && $('#'+toggleMe[i].id).is(":visible") )
                            {
                                if($('#'+toggleMe[i].id).prop("checked") != $('#'+event.target.id).prop("checked")) {
                                    $('#' + toggleMe[i].id).click();
                                    if (conf_error_occured == true){
                                        return;
                                    }
                                }
                            }
                        }
                        // setCapacity();
                    });
                    $(document).on("click",".cres_checker",function(event) {
                        $.blockUI({ 
                            fadeIn: 1000, 
                            timeout: 60000, 
                            onBlock: function() { 
                                conf_error_occured = false;
                                var cresId = event.target.id.replace("cres_checker_","");
                                var toggleMe = $('.remote_checkbox');
                                var quickLy = $('.remote_checkbox').find("[cellres-id='" + cresId + "']");
                                for(var i=0; i < toggleMe.length; i++)
                                {
                                    if(toggleMe[i].attributes['cellres-id'].value == cresId && $('#'+toggleMe[i].id).is(":visible") )
                                    {
                                        if($('#'+toggleMe[i].id).prop("checked") != $('#'+event.target.id).prop("checked")) {
                                            $('#' + toggleMe[i].id).click();
                                            if (conf_error_occured == true){
                                                return;
                                            }
                                            $.unblockUI();
                                        }
                                    }
                                }
                                // setCapacity();
                            } 
                        });
                    });                    
                    $( "#tag" ).keypress(function() {
                        if($("#tag").val() != routingProfileTag)
                        {
                            $('#save').removeClass('disabled');
                        }
                    });

                    if(MODE == "view")
                    {
                        $('#save').hide();
                        $('#delete').hide();
                        $('#general_config').hide();
                    }
                    $("#dialog_del").dialog({
                        modal: true,
                        bgiframe: true,
                        width: 300,
                        height: 200,
                        autoOpen: false
                    });
                    $("#dialog_timer").dialog({
                        modal: true,
                        bgiframe: true,
                        width: 300,
                        height: 200,
                        autoOpen: false
                    });
                    $("#confirm_back").dialog({
                        modal: true,
                        bgiframe: true,
                        width: 300,
                        height: 200,
                        autoOpen: false
                    });
                    $('#start_filter').dialog({
                        modal: true,
                        bgiframe: true,
                        width: 200,
                        height: 100,
                        autoOpen: false
                    });

                    //check if there is any registeredRFrange
                    //if don't not allow to fiddle with this page
                    //send them back to topology mwuahaha
                    api.exe({
                        cmd:'bands --json',
                        dataType:'json',
                        onSuccess:function(o){
                            original_bands = o.ajaxdata.bands;
                            api.exe({
                                cmd: 'rfranges --json',
                                dataType: 'json',
                                onSuccess: function (e) {
                                    var rfrangeList = e.ajaxdata.nodes;
                                    registeredRfrangeList=[];
                                    $.each(rfrangeList, function (key, node) {
                                        if(node.NodeType.indexOf("MTDI") != -1){
                                            $.each(node.Ranges,function(i, range){
                                                $.each(original_bands, function (key, band) {
                                                    if (range.Type === band.Band) {
                                                        registeredRfrangeList.push({"Band":band.Band,"FullName":band.FullName,"LowerDownLink":band.LowerDL,"UpperDownLink":band.UpperDL,"Duplex":band.Duplex})
                                                    }
                                                })

                                            })
                                        }
                                        else if(node.NodeType.indexOf("RRU") != -1){
                                            var id = node.ID
                                            $.each(node.Ranges,function(i, range){                                                                                    
                                                    //rfrangePowerList.push({"ID":id,"Band":range.Band,"OutputPower":range.OutputPower})
                                                    rfrangePowerList[id+":"+range.Type] = range.OutputPower
                                                    rfrangeSlotList.push(id+","+range.Band + "|"+range.Type);
                                            })
                                        }                                
                                    })
                                    registeredRfrangeList = registeredRfrangeList.uniqueObjects();
                                    if(registeredRfrangeList.length>0) {
                                        openFilterSetting();
                                    }else{
                                        axellPopUp("Routing cannot be edited when there is no valid hardware registered in the system.<br>You will be redirected to the main page in a short while");
                                        setTimeout(function () {
                                            window.location.href = "/target";
                                        }, 10000);
                                    }
                                }
                            })
                        }
                    });

                    api.exe({
                        cmd:'rf_quota -o '+OPERATOR +' --json',
                        dataType:'json',
                        onSuccess:function(o){
                            rfquotaList = o.ajaxdata.RFQUOTA;
                        },
                        onError:function(err){
                            console.log(err.errorThrown);
                        }
                    })

                    api.exe({
                        cmd:'rfnominal -o '+OPERATOR +' --json',
                        dataType:'json',
                        onSuccess:function(o){
                            rfNominalList = o.ajaxdata.RRU;
                        },
                        onError:function(err){
                            console.log(err.errorThrown);
                        }
                    })
                    
                    conn.length = 0;
                    rfConn.length = 0;
                    api.exe({
                        cmd: "connections -o " + OPERATOR + " --json",
                        dataType: 'json',
                        async: false,
                        onSuccess: function (o) {
                            $.each(o.ajaxdata.BUNDLEGROUP, function (i, top) {
                                conn[i] = top;
                            })
                            $.each(o.ajaxdata.rf_connections, function (i, top) {
                                rfConn[i] = top;
                            })
                        }
                    })

                    //click event on more details of each cell resources
                    $(document).on('click','.cres_details',function(){
                        //console.log("dialog");

                        var x = "";
                        var $this = $(this);
                        var index = $this.attr('index');
                        var sectorDetails = _.findWhere(sectorList,{SectorID: filtered_cellresList[index].SectorID});
                        var rfValue = -70;

                        dialogIsChanged =false;

                        //set up popup window for rf power level
                        $('#power_monitoring').dialog({
                            modal: true,
                            bgiframe: true,
                            width: 1000,
                            autoOpen: false,
                            open:function(){

                                 api.exe({
                                    cmd:'RFROUTE -o '+ OPERATOR +' '+PROFILENAME+' GETPW '+filtered_cellresList[index].ResID+' --json',
                                    async:false, // need to get this done before other things below
                                    dataType:'json',
                                    onSuccess:function(e){
                                       rfValue = e.ajaxdata.DlAlrThr;
                                    },
                                    onError:function(e){
                                    }
                                 }); 

                                 $(".ui-dialog-buttonpane button:contains('Save')").button("disable",true);
                                 $('#power_monitoring').empty();
                                 var html='<table id="rf_power_table" class="type4">';

                                 html += '<tr><th colspan="'+Number(topologyList.nodes.length+2)+'" >' + _.findWhere(topologyList.nodes,{ID: sectorToMTDIList[sectorDetails.SectorID]}).Tag + '('+ _.findWhere(topologyList.nodes,{ID: sectorToMTDIList[sectorDetails.SectorID]}).IP +') Band: ' + sectorDetails.Band + ' Range: ' + sectorDetails.LowerBandDL + '-' + sectorDetails.UpperBandDL + '</th></tr>';

                                 html += '<tr><th>' + filtered_cellresList[index].Tag +'</th><th>'+

                                 '<div class="rru_cellres_setting_header"><span>Input Power Monitoring [dBm]</span></div></th>';

                                 html += '<td id="' + x + '_' + x + '" class="rru_cellres_setting_cell"  nodeid="'+x+'" band="'+x+'" cellresid="'+x+'">';

                                 html += '<div class="rru_cellres_setting">' +
                                    
                                 '<div id="cellres_alr_' + x + '" class="rru_cellres_alr_setting_slider" cellresid="' + x + '" nodeid="'+x+'" band="'+x+'"></div>' +
                                 '<input id="cellres_alr_input_' + x + '" class="rru_cellres_alr_setting_input" cellresid="' + x + '" nodeid="'+x+'" band="'+x+'" type="text"/>dBm</div>';
                                 html += '</td>';

                                 html += '</tr>';
                                 html += '</table>';

                                 //console.log(html);
                                $(".ui-dialog-buttonpane button:contains('Cancel')").css("float","right");
                                $(".ui-dialog-buttonpane button:contains('Save')").css("float","right");

                                 $('#power_monitoring').append(html);
                                 $("#cellres_alr_input_" + x).val(rfValue);
                                 $('.rru_cellres_alr_setting_slider').slider({
                                    range: "min",
                                    step: 0.1,
                                    min: -70,
                                    max: 0,
                                    value: rfValue,
                                    slide:function(event, ui){
                                        //console.log(ui.value);
                                        $("#cellres_alr_input_" + x).val(ui.value);
                                        $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                        dialogIsChanged = true;
                                    }
                                 })
                                 $('.rru_cellres_alr_setting_input').change(function(){
                                    if ($(this).val() > 0 || $(this).val() < Number(-70)) {
                                        axellPopUp('Please enter valid Power Monitoring in dBm');
                                        $(this).val(-70);
                                    }
                                    if(isNaN($(this).val())){
                                        axellPopUp("Please fill in a valid setting");
                                        $(this).val(0);
                                    }else {
                                        $(this).closest('td').find('.rru_cellres_alr_setting_slider').slider('value', $(this).val());
                                        $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                        dialogIsChanged = true;
                                    }
                                 })
                                 if (MODE === "view") {
                                    //$('.rru_cellres_alr_setting_slider').slider('disable');
                                    //$('.rru_cellres_alr_setting_input').prop('disabled',true);
                                 }
                            },
                            beforeClose:function(){
                                if(dialogIsChanged){
                                    if(confirm("There are changes detected. Are you sure you want to discard the changes?")){
                                        return true;
                                    }else{
                                        return false;
                                    }
                                }else{
                                    return true;
                                }
                            },
                            buttons:{
                                /*
                                'Reset to default':function(){
                                    //TODO: reset all to default value
                                    //same as default --> disabled button
                                },
                                */
                                'Login':function(){
                                    var ip = _.findWhere(topologyList.nodes,{ID: sectorToMTDIList[sectorDetails.SectorID]}).IP;
                                    var split = ip.split('.');
                                    var k = parseInt(split[2]);
                                    var s = parseInt(split[3]);
                                    var port = 10000 + ((k-2)*256) + s;
                                    window.open("http://" + window.location.hostname + ":" + port, "_blank");
                                },
                                'Zoom':function(){
                                    window.open("/target/index.html?Node Type="+"VIRT_SECT"+
                                                                  "&ID="+sectorDetails['SectorID']+
                                                                  "&Status="+"0"+
                                                                  "&Comm="+"0"+
                                                                  "&Tag="+sectorDetails['Tag']+
                                                                  "&BTS Tag="+sectorDetails['BTS Tag']+
                                                                  "&Band="+sectorDetails['Band']+
                                                                  "&Conn="+sectorDetails['Conn']+
                                                                  "&Duplex="+sectorDetails['Duplex']+
                                                                  "&LowerBandDL="+sectorDetails['LowerBandDL']+
                                                                  "&UpperBandDL="+sectorDetails['UpperBandDL']+
                                                                  "&Operator="+sectorDetails['Operator']+
                                                                  "&SectorID="+sectorDetails['SectorID'], "_blank");
                                },
                                'Cancel':function(){
                                    $(this).dialog('close');
                                },
                                'Save':function(){
                                     dialogIsChanged =false;
                                     api.exe({
                                         cmd:'RFROUTE -o '+OPERATOR+' '+PROFILENAME+' SETPW '+filtered_cellresList[index].ResID+' '+$("#cellres_alr_input_" + x).val()+' '+0,
                                         onSuccess:function(){

                                         },
                                         onError:function(err){
                                             axellPopUp(err.errorThrown);
                                         }
                                     })
                                     $(this).dialog('close');
                                     //XXXXX update values on main page 
                                }
                            }
                        }); // eod dialog

                        $('#power_monitoring').dialog('open');

                    }) // eof event click

                    //click event on more details of each remotes
                    $(document).on('click','.more_details',function(){
                        dialogIsChanged =false;
                        levelIsChanged =false;
                        if(isChanged)
                        {
                            console.log("Save last changes before remote editing");
                            axellPopUp("Please save last changes before editing.");
                            return;
                        }
                        var $this = $(this);
                        var node_rfquota_list = _.where(rfquotaList,{"Node":$this.attr('nodeid')});
                        //set up popup window for rf power level

                        var zoneIndex;
                        var rruIndex;
                        for (var z=0; z< zoneList.length; z++)
                        {
                           for (var rruInd = 0; rruInd < zoneList[z].ZoneNodes.length; rruInd++)
                           {
                              if (zoneList[z].ZoneNodes[rruInd] == $this.attr('nodeid'))
                              {
                                 zoneIndex = z;
                                 rruIndex = rruInd;
                                 break; 
                              }
                           }
                        }

                        $('#rf_power_level').dialog({
                            modal: true,
                            bgiframe: true,
                            width: 1500,
                            autoOpen: false,
                            open:function(){
                                //call rfroute to update on RFOffset level
                                api.exe({
                                    cmd:'RFROUTE -o '+ OPERATOR +' '+PROFILENAME+' --json',
                                    async:false, // need to get this done before other things below
                                    dataType:'json',
                                    onSuccess:function(e){
                                        //get the original rfoffset
                                        originalRFOffset = e.ajaxdata.RFOffsets;
                                        originalRoutes = e.ajaxdata.Routes;
                                        rfCellresLevelPerRemote = [];
                                        //save the rfoffset that users play with before saving
                                        $.each(originalRFOffset,function(i, value){
                                            var Slot = 0;
                                            if (originalRoutes != undefined){
                                               for(var i = 0; i < originalRoutes.length; i ++){
                                                   if((originalRoutes[i].CellRes == value.CellRes) && (originalRoutes[i].Destinations == value.Destinations)){
                                                       Slot = originalRoutes[i].Band;
                                                   }
                                               }
                                            }
                                            if(_.findWhere(filtered_cellresList,{"ResID":value.CellRes}) != undefined)
                                               rfCellresLevelPerRemote.push({"CellRes": value.CellRes, "Destinations": value.Destinations, "Band": _.findWhere(filtered_cellresList,{"ResID":value.CellRes}).Band,"ALCOffset":value.ALCOffset , "ULGainOffset": value.ULGainOffset , "DLAlrThr": value.DLAlrThr , "ULAlrThr": value.ULAlrThr , "ULLevel": value.ULLevel , "Slot": Slot});
                                        })
                                        rfCellresLevelPerRemote = rfCellresLevelPerRemote.uniqueObjects();
                                    }
                                });

                                $(".ui-dialog-buttonpane button:contains('Cancel')").css("float","right");
                                $(".ui-dialog-buttonpane button:contains('Save')").css("float","right");
                                
                                $(".ui-dialog-buttonpane button:contains('Save')").button("disable",true);
                                $(".ui-dialog-buttonpane button:contains('Reset')").button("disable",true);
                                $('#rf_power_level').empty();
                                var html='<table id="rf_power_table" class="type4">';
                                var remoteID = $this.attr('nodeid');
                                html+='<tr><th colspan="'+Number(node_rfquota_list.length+2)+'" class="rf_power_table_header"><div class="icon remote"></div>' +
                                    $this.parent().attr('data-rru_title') + '</th></tr>';
                                html+='<tr><th colspan="2">' +
                                    '<div style="display:inline-block;width:100%;"><span style="float:right; padding-right: 10px;">Band </span></div>' +

                                    //'<div style="display:inline-block;width:100%;"><span style="float:right;padding-right: 10px;">Active Composite Output Power </span></div>' +
                                    '<div style="display:inline-block;width:100%;"><span style="float:right;padding-right: 10px;">Unused Output Power </span></div>' +
                                    '<div style="display:inline-block;width:100%;"><span style="float:right;padding-right: 10px;">Minimize / Maximize Power </span></div>' +
                                    '</th>';
                                var countme = 0;
                                var device_bands = [];
                                for(var k = 0; k < rfrangeSlotList.length; k++){
                                    var rfrangeSlotListTokens = rfrangeSlotList[k].split("|");
                                    var rfrangeSlotListDevice = rfrangeSlotListTokens[0].split(",");
                                    if (rfrangeSlotListDevice[0] == remoteID){
                                        var bandNum = rfrangeSlotListDevice[1].split(":");
                                        device_bands.push(rfrangeSlotListTokens[1] + "_" + bandNum[1]);
                                    }
                                }
                                
                                bandsCompare = 10;
                                var bandsInDevice = [];
                                for (var l = 0; l < device_bands.length; l ++){
                                    var device_band_freq = device_bands[l].split("_")[0];
                                    for (var i = 0; i < bandsInDevice.length; i ++){
                                       if(Math.abs(bandsInDevice[i] - device_band_freq) < 10)
                                          bandsCompare = 1;
                                    }
                                    bandsInDevice.push(device_band_freq);
                                }

                                for (var l =0; l < device_bands.length; l ++){
                                    var device_band_freq = device_bands[l].split("_")[0];
                                    var device_band_slot = device_bands[l].split("_")[1];
                                    var desc;
                                    $.each(bandsList,function(index, value){
                                       if (value.Band == device_band_freq)
                                          desc = value.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "");
                                    })
                                    html += '<th><div class="icon freq-range"></div>' + desc + ':' + device_band_slot +
                                        //'<div><div class="icon output"></div><span id="rfmMore_'+ countme + '_' +  remoteID + '">-</span></div>' +
                                        '<div class="unused_alc_allocation"><div class="icon unused" title="Unused Output Power"></div> <span id="unused_alc_percentage_'+device_band_freq+ '_' + device_band_slot + '" band="'+device_band_freq+'"></span></div>' + '<button type="button" style="height: 20px !important;padding: 0px;margin-left: 0px" id="minpower_'+l+'">min</button>' + '<button type="button" style="height: 20px !important;padding: 0px;margin-left: 4px" id="maxpower_'+l+'">max</button>' +
                                        '</th>';
                                    countme ++;
                                }

                                //display cellres which was routed to this remote if any
                                //first set up all cell in the table as place holder
                                if(_.findWhere(filtered_rru_cellres,{"rru_id":$this.attr('nodeid')})) {
                                    $.each(_.findWhere(filtered_rru_cellres, {"rru_id": $this.attr('nodeid')}).cres_list, function (i, cellres) {
                                        var psExist = false;
                                        for(var k = 0; k < device_bands.length; k++){
                                           var device_band_freq = device_bands[k].split("_")[0];
                                           var device_band_slot = device_bands[k].split("_")[1];
                                           for(var l = 0; l < rfCellresLevelPerRemote.length; l ++){
                                                if ((rfCellresLevelPerRemote[l].Destinations == remoteID) && (rfCellresLevelPerRemote[l].CellRes == cellres) && (Math.abs(rfCellresLevelPerRemote[l].Band - device_band_freq) < bandsCompare)){
                                                    if((rfCellresLevelPerRemote[l].Slot == "(null)") || ((rfCellresLevelPerRemote[l].Slot != "(null)") && (rfCellresLevelPerRemote[l].Slot == device_band_slot))){
                                                       $.each(bandsList,function(index, value){
                                                         if ((value.Band == device_band_freq) && (value.PS == "1"))
                                                            psExist = true;
                                                       })
                                                    }
                                                }
                                           }   
                                        }
                                        if(_.findWhere(filtered_cellresList,{"ResID":cellres}) != undefined){
                                           html += '<tr><th>' + _.findWhere(filtered_cellresList,{"ResID":cellres}).Tag +'</th><th>'+
                                               '<div class="rru_cellres_setting_header" style="margin-bottom:5px;"><span>Output Power [dBm]</span></div>' +
                                               '<div class="rru_cellres_setting_header" style="margin-bottom:5px;"><span>UL/DL Gain Offset [dB]</span></div>' +
                                               '<div class="rru_cellres_setting_header" style="margin-bottom:5px;"><span>Output Power Monitoring [dBm]</span></div>';
                                           //if (psExist)
                                           if((_.findWhere(filtered_cellresList,{"ResID":cellres}).Tech == "NBFM") || (_.findWhere(filtered_cellresList,{"ResID":cellres}).Tech == "TETRA"))
                                             html += '<div class="rru_cellres_setting_header" style="margin-bottom:5px;"><span>UL Squelch Level [dBm]</span></div>';
                                           html += '</th>';
                                           for(var k = 0; k < device_bands.length; k++){
                                               html += '<td id="' + cellres + '_' + device_bands[k] + '" class="rru_cellres_setting_cell"  nodeid="'+$this.attr('nodeid')+'" band="'+device_bands[k]+'" cellresid="'+cellres+'">';
                                               var device_band_freq = device_bands[k].split("_")[0];
                                               var device_band_slot = device_bands[k].split("_")[1];
                                               for(var l = 0; l < rfCellresLevelPerRemote.length; l ++){
                                                   if ((rfCellresLevelPerRemote[l].Destinations == remoteID) && (rfCellresLevelPerRemote[l].CellRes == cellres) && (Math.abs(rfCellresLevelPerRemote[l].Band - device_band_freq) < bandsCompare)){
                                                       if((rfCellresLevelPerRemote[l].Slot == "(null)") || ((rfCellresLevelPerRemote[l].Slot != "(null)") && (rfCellresLevelPerRemote[l].Slot == device_band_slot))){
                                                           html += '<div class="rru_cellres_setting">' +
                                                               '<div id="cellres_alc_' + cellres + '" class= "rru_cellres_alc_setting_slider" cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+device_bands[k]+'"></div>' +
                                                               '<input id= "cellres_alc_input_' + cellres + '" class="rru_cellres_alc_setting_input"    cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+device_bands[k]+'" type="text"/>dBm</div>';
                                                           html += '<div class="rru_cellres_setting">' + //new code - hide agc div
                                                               '<div id="cellres_gain_' + cellres + '" class= "rru_cellres_gain_setting_slider" cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+device_bands[k]+'"></div>' +
                                                               '<input id= "cellres_gain_input_' + cellres + '" class="rru_cellres_gain_setting_input"  cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+device_bands[k]+'" type="text"/> dB </div>';
                                                           html += '<div class="rru_cellres_setting">' +
                                                               '<div id="cellres_alr_' + cellres + '" class= "rru_cellres_alr_setting_slider" cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+device_bands[k]+'"></div>' +
                                                               '<input id= "cellres_alr_input_' + cellres + '" class="rru_cellres_alr_setting_input"    cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+device_bands[k]+'" type="text"/>dBm</div>';
                                                           //$.each(bandsList,function(index, value){
                                                             //if ((value.Band == device_band_freq) && (value.PS == "1"))
                                                             if((_.findWhere(filtered_cellresList,{"ResID":cellres}).Tech == "NBFM") || (_.findWhere(filtered_cellresList,{"ResID":cellres}).Tech == "TETRA"))
                                                             {
                                                               html += '<div class="rru_cellres_setting">' +
                                                               '<div id="cellres_level_' + cellres + '" class= "rru_cellres_level_setting_slider" cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+device_bands[k]+'"></div>' +
                                                               '<input id= "cellres_level_input_' + cellres + '" class="rru_cellres_level_setting_input"    cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+device_bands[k]+'" type="text"/>dBm</div>';
                                                             }
                                                           //})
                                                       }
                                                   }
                                               }                                
                                               html += '</td>';
                                           }
                                           html += '</tr>';
                                        }
                                    })
                                }
                                html += '</table>';

                                $('#rf_power_level').append(html);

                                $("button[id^=minpower_]").click(function(e){	
                                    var id = this.id;
                                    id = id.slice(id.indexOf("_")+1);
                                    var device_band_freq = device_bands[id].split("_")[0];
                                    var quota = _.findWhere(default_operator_rf_quotas,{"Band":device_band_freq}).RFQuota; 
                                    $.each(_.findWhere(filtered_rru_cellres, {"rru_id": $this.attr('nodeid')}).cres_list, function (i, cres) {
                                        for(var l = 0; l < rfCellresLevelPerRemote.length; l ++){
                                           if ((rfCellresLevelPerRemote[l].Destinations == remoteID) && (rfCellresLevelPerRemote[l].CellRes == cres) && 
                                               (Math.abs(rfCellresLevelPerRemote[l].Band - device_band_freq) < bandsCompare)){
                                              var uiValue = alcdBmToPercentage(0,quota,device_band_freq,$this.attr('nodeid'));
                                              $('#cellres_alc_' + cres).slider('value', uiValue);
                                              $('#cellres_alc_input_' + cres).val(0);
                                              _.findWhere(rfCellresLevelPerRemote,{"Destinations":$this.attr('nodeid'),"CellRes":cres}).ALCOffset = percentageToAlcOffset(uiValue,quota,$this.attr('nodeid'),device_band_freq).toString();
                                              $('#cellres_gain_' + cres).slider('value', 0);
                                              $('#cellres_gain_input_' + cres).val(0);
                                              _.findWhere(rfCellresLevelPerRemote,{"Destinations":$this.attr('nodeid'),"CellRes":cres}).ULGainOffset = 0;
                                           }
                                        }
                                    })
                                    $('#unused_alc_percentage_'+ device_bands[id]).text((100).toFixed(1)+"%");
                                    $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                    dialogIsChanged = true;
                                })
                                $("button[id^=maxpower_]").click(function(e){	
                                    var id = this.id;
                                    id = id.slice(id.indexOf("_")+1);
                                    var cellCounter = 0;
                                    var device_band_freq = device_bands[id].split("_")[0];
                                    $.each(_.findWhere(filtered_rru_cellres, {"rru_id": $this.attr('nodeid')}).cres_list, function (i, cres) {
                                        for(var l = 0; l < rfCellresLevelPerRemote.length; l ++){
                                           if ((rfCellresLevelPerRemote[l].Destinations == remoteID) && (rfCellresLevelPerRemote[l].CellRes == cres) && 
                                               (Math.abs(rfCellresLevelPerRemote[l].Band - device_band_freq) < bandsCompare)){
                                               cellCounter++;
                                           }
                                        }
                                    })
                                    var powerList = rfrangePowerList[$this.attr('nodeid')+":"+device_band_freq];
                                    var quota = _.findWhere(default_operator_rf_quotas,{"Band":device_band_freq}).RFQuota; 
                                    var maxPower = (powerList / 10.0) + (10 * Math.log(quota/100) / Math.log(10));
                                    maxPower = Math.round(maxPower);
                                    var power = (maxPower - (10 * Math.log(cellCounter)/Math.log(10))).toFixed(1);
                                    $.each(_.findWhere(filtered_rru_cellres, {"rru_id": $this.attr('nodeid')}).cres_list, function (i, cres) {
                                        for(var l = 0; l < rfCellresLevelPerRemote.length; l ++){
                                           if ((rfCellresLevelPerRemote[l].Destinations == remoteID) && (rfCellresLevelPerRemote[l].CellRes == cres) && 
                                               (Math.abs(rfCellresLevelPerRemote[l].Band - device_band_freq) < bandsCompare)){
                                              var uiValue = alcdBmToPercentage(power,quota,device_band_freq,$this.attr('nodeid'));
                                              $('#cellres_alc_' + cres).slider('value', uiValue);
                                              $('#cellres_alc_input_' + cres).val(power);
                                              _.findWhere(rfCellresLevelPerRemote,{"Destinations":$this.attr('nodeid'),"CellRes":cres}).ALCOffset = percentageToAlcOffset(uiValue,quota,$this.attr('nodeid'),device_band_freq).toString();
                                              $('#cellres_gain_' + cres).slider('value', 0);
                                              $('#cellres_gain_input_' + cres).val(0);
                                              _.findWhere(rfCellresLevelPerRemote,{"Destinations":$this.attr('nodeid'),"CellRes":cres}).ULGainOffset = 0;
                                           }
                                        }
                                    })
                                    $('#unused_alc_percentage_'+ device_bands[id]).text((0).toFixed(1)+"%");
                                    $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                    dialogIsChanged = true;
                                })

                                //set up slider for cellres
                                //set up slider for cellres alc slider and gain slider with diff min max
                                $('.rru_cellres_alc_setting_slider').slider({
                                    range: "min",
                                    step: 0.1,
                                    min: cellresMinALCPowerLevel,
                                    max: cellresMaxALCPowerLevel,
                                    slide:function(event, ui){
                                        var allocatedCap= 0;
                                        $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                        //remove warning icon
                                        $('.rru_cellres_setting:first-child .icon').remove();
                                        //make sure the slider cannot go over the the max - sum of the rest of the alc's percentage of the same band
                                        var this_band = $(this).attr("band");
                                        $.each($(this).closest('table').find('.rru_cellres_alc_setting_slider[band='+ this_band +']').not(this),function(){
                                           var rru_id = $this.attr('nodeid')
                                           var rru_band = $(this).attr('band').split("_")[0];
                                           var alcIndBm = percentageToAlcdBm(Number($(this).slider('value').toFixed(1)),_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id).toFixed(1);
                                           var split = $(this).attr('id').split('_');
                                           var id = "cellres_gain_"+split[2]+"_"+split[3];
                                           var gainOffset = Number($('#'+id).slider('value').toFixed(1));
                                           if (gainOffset < 0)
                                             gainOffset = 0;
                                           alcIndBm = Number(alcIndBm) + gainOffset;
                                           allocatedCap = allocatedCap + alcdBmToPercentage(alcIndBm,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id);
                                        })
                                        var rru_id = $this.attr('nodeid')
                                        var rru_band = $(this).attr('band').split("_")[0];
                                        var alcIndBm = percentageToAlcdBm(ui.value,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id).toFixed(1);
                                        var split = $(this).attr('id').split('_');
                                        var id = "cellres_gain_"+split[2]+"_"+split[3];
                                        var gainOffset = Number($('#'+id).slider('value').toFixed(1));
                                        if (gainOffset < 0)
                                          gainOffset = 0;
                                        alcIndBm = Number(alcIndBm) + gainOffset;
                                        allocatedCap = allocatedCap + alcdBmToPercentage(alcIndBm,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id);
                                        if (allocatedCap > cellresMaxALCPowerLevel) {
                                            allocatedCap = cellresMaxALCPowerLevel;
                                            dialogIsChanged = true;
                                            return false;
                                        }else{
                                            var rru_id = $this.attr('nodeid')
                                            var rru_band = $(this).attr('band').split("_")[0];
                                            $(this).parent().find('.rru_cellres_alc_setting_slider').val(ui.value);
                                            $('#unused_alc_percentage_'+ $(this).attr('band') ).text((cellresMaxALCPowerLevel-allocatedCap).toFixed(1)+"%");
                                            var alcIndBm = percentageToAlcdBm(ui.value,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id).toFixed(1);
                                            $(this).parent().find('.rru_cellres_alc_setting_input').val(alcIndBm);
                                            //add value into rfcellresLevel list in order to save later
                                            if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                                rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'),"Band":rru_band, "ALCOffset":ui.value.toFixed(1) , "ULGainOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ULGainOffset})
                                            }else{
                                                var rru_id = $this.attr('nodeid')
                                                var rru_band = $(this).attr('band').split("_")[0];
                                                _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ALCOffset = percentageToAlcOffset(ui.value.toFixed(1),_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_id,rru_band).toString();//rru_band,$(this).attr('nodeid')
                                            }
                                            dialogIsChanged = true;
                                        }
                                    }
                                })
                                $('.rru_cellres_gain_setting_slider').slider({
                                    range: "min",
                                    step:0.1,
                                    min: cellresMinGainPowerLevel,
                                    max: cellresMaxGainPowerLevel,
                                    slide: function( event, ui ) {
                                        var allocatedCap = 0;
                                        //$('#save').removeClass('disabled');
                                        //isChanged = true;
                                        $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                        var this_band = $(this).attr("band");
                                        $.each($(this).closest('table').find('.rru_cellres_gain_setting_slider[band='+ this_band +']').not(this),function(){
                                           var rru_id = $this.attr('nodeid')
                                           var rru_band = $(this).attr('band').split("_")[0];
                                           var gainOffset = Number($(this).slider('value').toFixed(1));
                                           if (gainOffset < 0)
                                             gainOffset = 0;
                                           var split = $(this).attr('id').split('_');
                                           var id = "cellres_alc_"+split[2]+"_"+split[3];
                                           var alc = Number($('#'+id).slider('value').toFixed(1));
                                           var alcIndBm = percentageToAlcdBm(alc,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id).toFixed(1);
                                           alcIndBm = Number(alcIndBm) + gainOffset;
                                           allocatedCap = allocatedCap + alcdBmToPercentage(alcIndBm,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id);
                                        })
                                        var rru_id = $this.attr('nodeid')
                                        var rru_band = $(this).attr('band').split("_")[0];
                                        var gainOffset = ui.value;
                                        if (gainOffset < 0)
                                          gainOffset = 0;
                                        var split = $(this).attr('id').split('_');
                                        var id = "cellres_alc_"+split[2]+"_"+split[3];
                                        var alc = Number($('#'+id).slider('value').toFixed(1));
                                        var alcIndBm = percentageToAlcdBm(alc,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id).toFixed(1);
                                        alcIndBm = Number(alcIndBm) + gainOffset;
                                        allocatedCap = allocatedCap + alcdBmToPercentage(alcIndBm,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id);
                                        if ((ui.value > 0) && (allocatedCap > cellresMaxALCPowerLevel)) {
                                            allocatedCap = cellresMaxALCPowerLevel;
                                            dialogIsChanged = true;
                                            return false;
                                        }else{
                                           $(this).parent().find('.rru_cellres_gain_setting_input').val(ui.value);
                                           //add value into rfcellresLevel list in order to save later
                                           $('#unused_alc_percentage_'+ $(this).attr('band') ).text((cellresMaxALCPowerLevel-allocatedCap).toFixed(1)+"%");
                                           if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                               var rru_band = $(this).attr('band').split("_")[0];
                                               rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'), "Band":rru_band,"ALCOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ALCOffset, "ULGainOffset": ui.value.toFixed(1)})
                                           }else{
                                               _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ULGainOffset = ui.value.toFixed(1);
                                           }
                                           dialogIsChanged = true;
                                        }
                                    }
                                })
                                $('.rru_cellres_alr_setting_slider').slider({
                                    range: "min",
                                    step: 0.1,
                                    min: -70,
                                    max: 30,
                                    slide:function(event, ui){
                                        var allocatedCap= 0;
                                        $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                        //remove warning icon
                                        $('.rru_cellres_setting:first-child .icon').remove();
                                        //make sure the slider cannot go over the the max - sum of the rest of the alc's percentage of the same band
                                        //var this_band = $(this).attr("band");
                                        //$.each($(this).closest('table').find('.rru_cellres_alr_setting_slider[band='+ this_band +']').not(this),function(){
                                        //   allocatedCap = allocatedCap + Number($(this).slider('value').toFixed(1));
                                        //})
                                        //allocatedCap = (allocatedCap + ui.value);
                                        //if (allocatedCap > cellresMaxALCPowerLevel) {
                                        //    allocatedCap = cellresMaxALCPowerLevel;
                                        //    dialogIsChanged = true;
                                        //    return false;
                                        //}else{
                                            var rru_id = $this.attr('nodeid')
                                            var rru_band = $(this).attr('band').split("_")[0];
                                            $(this).parent().find('.rru_cellres_alr_setting_slider').val(ui.value);
                                            //$('#unused_alc_percentage_'+ $(this).attr('band') ).text((cellresMaxALCPowerLevel-allocatedCap).toFixed(1)+"%");
                                            //var alcIndBm = percentageToAlcdBm(ui.value,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id).toFixed(1);
                                            $(this).parent().find('.rru_cellres_alr_setting_input').val(ui.value);
                                            //add value into rfcellresLevel list in order to save later
                                            if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                                rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'),"Band":rru_band, "DLAlrThr":ui.value.toFixed(1) , "ULGainOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ULGainOffset})
                                            }else{
                                                _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).DLAlrThr = ui.value.toFixed(1);      //percentageToAlcOffset(ui.value.toFixed(1),_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_id,rru_band).toString();//rru_band,$(this).attr('nodeid')
                                            }
                                            dialogIsChanged = true;
                                        //}
                                    }
                                })
                                $('.rru_cellres_level_setting_slider').slider({
                                    range: "min",
                                    step: 0.1,
                                    min: -110,
                                    max: 0,
                                    slide:function(event, ui){
                                        var allocatedCap= 0;
                                        $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                        //remove warning icon
                                        $('.rru_cellres_setting:first-child .icon').remove();
                                        //make sure the slider cannot go over the the max - sum of the rest of the alc's percentage of the same band
                                        //var this_band = $(this).attr("band");
                                        //$.each($(this).closest('table').find('.rru_cellres_alr_setting_slider[band='+ this_band +']').not(this),function(){
                                        //   allocatedCap = allocatedCap + Number($(this).slider('value').toFixed(1));
                                        //})
                                        //allocatedCap = (allocatedCap + ui.value);
                                        //if (allocatedCap > cellresMaxALCPowerLevel) {
                                        //    allocatedCap = cellresMaxALCPowerLevel;
                                        //    dialogIsChanged = true;
                                        //    return false;
                                        //}else{
                                            var rru_id = $this.attr('nodeid')
                                            var rru_band = $(this).attr('band').split("_")[0];
                                            $(this).parent().find('.rru_cellres_level_setting_slider').val(ui.value);
                                            //$('#unused_alc_percentage_'+ $(this).attr('band') ).text((cellresMaxALCPowerLevel-allocatedCap).toFixed(1)+"%");
                                            //var alcIndBm = percentageToAlcdBm(ui.value,_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_band,rru_id).toFixed(1);
                                            $(this).parent().find('.rru_cellres_level_setting_input').val(ui.value);
                                            //add value into rfcellresLevel list in order to save later
                                            if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                                rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'),"Band":rru_band, "ULLevel":ui.value.toFixed(1) , "ULGainOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ULGainOffset})
                                            }else{
                                                _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ULLevel = ui.value.toFixed(1);      //percentageToAlcOffset(ui.value.toFixed(1),_.findWhere(default_operator_rf_quotas,{"Band":rru_band}).RFQuota,rru_id,rru_band).toString();//rru_band,$(this).attr('nodeid')
                                            }
                                            dialogIsChanged = true;
                                            levelIsChanged = true;
                                        //}
                                    }
                                })
                                //set value for slider of cellres
                                var defaultALC ="0.0";
                                var defaultGain ="0.0";
                                var defaultALR ="-70.0";
                                var defaultLEVEL ="-85.0";
                                var totalAlcPercentage =0;
                                $.each(_.findWhere(filtered_rru_cellres, {"rru_id": $this.attr('nodeid')}).cres_list, function (i, cres) {
                                    var cresDetail = _.findWhere(rfCellresLevelPerRemote,{"Destinations":$this.attr('nodeid'),"CellRes":cres});
                                    var operatorRFQuota = null;
                                    if(_.findWhere(filtered_cellresList,{"ResID":cres}) != undefined)
                                       operatorRFQuota = _.findWhere(default_operator_rf_quotas,{"Band": _.findWhere(filtered_cellresList,{"ResID":cres}).Band}).RFQuota;
                                    var rru_id = $this.attr('nodeid');
                                    var rru_band = null;
                                    if(_.findWhere(filtered_cellresList,{"ResID":cres}) != undefined)
                                       rru_band = _.findWhere(filtered_cellresList,{"ResID":cres}).Band//$(this).attr('band')
                                    if(cresDetail !=undefined){
                                        if(rru_band != null){
                                           totalAlcPercentage +=AlcOffsetToPercentage(Number(cresDetail.ALCOffset),operatorRFQuota,rru_band,rru_id);
                                           $('#cellres_alc_' + cres).slider('value', AlcOffsetToPercentage(Number(cresDetail.ALCOffset),operatorRFQuota,rru_band,rru_id).toFixed(1));
                                           //$('#cellres_alc_' + cres).slider('value', cresDetail.ALCOffset);
                                           $('#cellres_alc_input_' + cres).val(AlcOffsetTodBm(cresDetail.ALCOffset,rru_id,rru_band));
                                        }
                                        //$('#cellres_alc_input_' + cres).val(cresDetail.ALCOffset);
                                        //console.log($('#cellres_alc_input_' + cres).val());
                                        $('#cellres_gain_' + cres).slider('value', cresDetail.ULGainOffset);
                                        $('#cellres_gain_input_' + cres).val(cresDetail.ULGainOffset);
                                        $('#cellres_alr_' + cres).slider('value', cresDetail.DLAlrThr);
                                        $('#cellres_alr_input_' + cres).val(cresDetail.DLAlrThr);
                                        $('#cellres_level_' + cres).slider('value', cresDetail.ULLevel);
                                        $('#cellres_level_input_' + cres).val(cresDetail.ULLevel);
                                    }else {
                                        originalRFOffset.push({"CellRes":cres,"Destinations":$this.attr('nodeid'),"ALCOffset":defaultALC,"ULGainOffset":defaultGain,"DLAlrThr":defaultALR,"ULLevel":defaultLEVEL});
                                        $('#cellres_alc_' + cres).slider('value', defaultALC);
                                        $('#cellres_alc_input_' + cres).val(defaultALC);
                                        $('#cellres_gain_' + cres).slider('value', defaultGain);
                                        $('#cellres_gain_input_' + cres).val(defaultGain);
                                        $('#cellres_alr_' + cres).slider('value', defaultALR);
                                        $('#cellres_alr_input_' + cres).val(defaultALR);
                                        $('#cellres_level_' + cres).slider('value', defaultLEVEL);
                                        $('#cellres_level_input_' + cres).val(defaultLEVEL);
                                    }
                                })

                                //set number for unused alc percentage per band
                                for(var bandsCount = 0; bandsCount < rfrangeSlotList.length; bandsCount ++){
                                    var rfrangeSlotListTokens = rfrangeSlotList[bandsCount].split("|");
                                    var rru_band = rfrangeSlotListTokens[1];
                                    var tokens = rfrangeSlotListTokens[0].split(",");
                                    var band_slot = [];
                                    band_slot = tokens[1].split(":");
                                    var band_num = band_slot[1];
                                    var totalUseALCPerBand =0;
                                    var operatorRFQuota = _.findWhere(default_operator_rf_quotas,{"Band": rru_band}).RFQuota;
                                    $.each(rfCellresLevelPerRemote,function(i, cres){
                                        //check if the power output is within the same band, same node destination and the cellres is in the list of cellres routed to that node
                                        if(rru_band == cres.Band
                                            && cres.Slot == band_num
                                            && cres.Destinations == $this.attr('nodeid')
                                            && _.contains(_.findWhere(filtered_rru_cellres,{"rru_id":$this.attr('nodeid')}).cres_list,cres.CellRes)){
                                            var rru_id = $this.attr('nodeid')
                                            totalUseALCPerBand += AlcOffsetToPercentage(Number(cres.ALCOffset),operatorRFQuota,rru_band,rru_id);
                                            console.log("percentage of output power route to "+$this.attr('nodeid')+" "+cres.Band+" "+cres.CellRes+" "+AlcOffsetToPercentage(Number(cres.ALCOffset),operatorRFQuota,rru_band,rru_id))
                                        }
                                    })
                                    if(totalUseALCPerBand > 100 || totalUseALCPerBand =="Infinity"){
                                        $('#unused_alc_percentage_'+rru_band + '_' + band_num).text("Output power exceeds");
                                        console.log("output power % has reach "+ totalUseALCPerBand)
                                        $('.rru_cellres_alc_setting_slider[band="'+rru_band+'"]').slider('value',0);
                                        $('.rru_cellres_alc_setting_input[band="'+rru_band+'"]').val("-");
                                        $('.rru_cellres_setting_cell[band="'+rru_band+'"]').find('.rru_cellres_setting:first-child').append('<div class="icon warning" title="Exceed allocated output power"></div>');
                                    }else{
                                        $('#unused_alc_percentage_'+rru_band + '_' + band_num).text((100 - totalUseALCPerBand).toFixed(1) + "%");
                                    }
                                }
                                
                                //in case input text box on change
                                $('.rru_cellres_alc_setting_input').change(function(){
                                    // cellresMinALCPowerLevel, cellresMaxALCPowerLevel
                                    $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                    if(isNaN($(this).val())){
                                        axellPopUp("Please fill in a valid setting");
                                        $(this).val(defaultALC);
                                    }else {
                                        var rru_id = $this.attr('nodeid');
                                        var rru_band = $(this).attr('band').split("_")[0];
                                        var rru_band1 = $(this).attr('band');
                                        var split = $(this).attr('id').split('_');
                                        var id = "cellres_gain_input_"+split[3]+"_"+split[4];
                                        var gainOffset = Number($('#'+id).val());
                                        if (gainOffset < 0)
                                           gainOffset = 0;
                                        var allocation = alcdBmToPercentage((Number($(this).val()) + gainOffset),
                                                                            _.findWhere(default_operator_rf_quotas, {"Band":rru_band}).RFQuota,
                                                                            rru_band,
                                                                            rru_id);
                                        var alcInput = alcdBmToPercentage((Number($(this).val())),
                                                                            _.findWhere(default_operator_rf_quotas, {"Band":rru_band}).RFQuota,
                                                                            rru_band,
                                                                            rru_id);
                                        var allocatedCap = 0;
                                        _rru_band = rru_band1; 
                                        var acc = 1;
                                        $.each($(this).closest('table').find('.rru_cellres_alc_setting_input[band="'+_rru_band+'"]').not($(this).closest('td').find('.rru_cellres_alc_setting_input')),function(){
                                            var rru_id = $this.attr('nodeid')
                                            var rru_band = $(this).attr('band').split("_")[0];
                                            var split = $(this).attr('id').split('_');
                                            var id = "cellres_gain_input_"+split[3]+"_"+split[4];
                                            var gainOffset = Number($('#'+id).val());
                                            if (gainOffset < 0)
                                               gainOffset = 0;
                                            val1 = alcdBmToPercentage((Number($(this).val()) + gainOffset),
                                                                    _.findWhere(default_operator_rf_quotas, {"Band":rru_band}).RFQuota,
                                                                    rru_band,
                                                                    rru_id);
                                            allocatedCap = Number(allocatedCap + val1); 
                                            acc++;
                                        })

                                        if((cellresMaxALCPowerLevel - Math.round(allocatedCap)) < allocation){
                                            axellPopUp('Please enter valid Output Power in dBm');
                                            $(this).closest('td').find('.rru_cellres_alc_setting_slider').slider('value',((0.0)));
                                            $(this).val(0.0);
                                            if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                                var rru_band = $(this).attr('band').split("_")[0];                                        
                                                rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'), "Band":rru_band,"ALCOffset":$(this).val() , "ULGainOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ULGainOffset})
                                            }else{
                                                _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ALCOffset = $(this).val();
                                            }
                                            $('#unused_alc_percentage').text(0+"%");
                                            dialogIsChanged = true;
                                        }else{
                                            $(this).closest('td').find('.rru_cellres_alc_setting_slider').slider('value', Number(alcInput));
                                            allocatedCap += Number(allocation);
                                            $('#unused_alc_percentage_'+$(this).attr("band")).text((cellresMaxALCPowerLevel-allocatedCap).toFixed(1)+"%");
                                            if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                                var rru_band = $(this).attr('band').split("_")[0];                                        
                                                rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'),"Band":rru_band, "ALCOffset":$(this).val(), "ULGainOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ULGainOffset})
                                            }else{
                                                var rru_band = $(this).attr('band').split("_")[0];                                        
                                                var ALCOffset = percentageToAlcOffset(alcInput, _.findWhere(default_operator_rf_quotas, {"Band":rru_band}).RFQuota, rru_id, rru_band).toString();
                                                _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'), "Destinations": $(this).attr('nodeid')}).ALCOffset = ALCOffset;
                                                                                     
                                            }
                                            dialogIsChanged = true;
                                        }
                                    }
                                })
                                $('.rru_cellres_gain_setting_input').change(function(){
                                    $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                    if(isNaN($(this).val())){
                                        axellPopUp("Please fill in a valid setting");
                                        $(this).val(defaultGain);
                                    }else if($(this).val() < cellresMinGainPowerLevel || $(this).val() > cellresMaxGainPowerLevel){
                                        axellPopUp("Please fill in a valid setting for gain offset. It should be in the range of "+cellresMinGainPowerLevel+" to "+cellresMaxGainPowerLevel+" with one decimal point ");
                                        $(this).val(defaultGain);
                                    }else {
                                        var rru_id = $this.attr('nodeid');
                                        var rru_band = $(this).attr('band').split("_")[0];
                                        var rru_band1 = $(this).attr('band');
                                        var split = $(this).attr('id').split('_');
                                        var id = "cellres_alc_input_"+split[3]+"_"+split[4];
                                        var alcIndBm = Number($('#'+id).val());
                                        var gainOffset = Number($(this).val());
                                        if (gainOffset < 0)
                                           gainOffset = 0;
                                        var allocation = alcdBmToPercentage((alcIndBm + gainOffset),
                                                                            _.findWhere(default_operator_rf_quotas, {"Band":rru_band}).RFQuota,
                                                                            rru_band,
                                                                            rru_id);
                                        var allocatedCap = 0;
                                        _rru_band = rru_band1; 
                                        var acc = 1;
                                        $.each($(this).closest('table').find('.rru_cellres_gain_setting_input[band="'+_rru_band+'"]').not($(this).closest('td').find('.rru_cellres_gain_setting_input')),function(){
                                            var rru_id = $this.attr('nodeid')
                                            var rru_band = $(this).attr('band').split("_")[0];
                                            var split = $(this).attr('id').split('_');
                                            var id = "cellres_alc_input_"+split[3]+"_"+split[4];
                                            var alcIndBm = Number($('#'+id).val());
                                            var gainOffset = Number($(this).val());
                                            if (gainOffset < 0)
                                               gainOffset = 0;
                                            val1 = alcdBmToPercentage((alcIndBm + gainOffset),
                                                                    _.findWhere(default_operator_rf_quotas, {"Band":rru_band}).RFQuota,
                                                                    rru_band,
                                                                    rru_id);
                                            allocatedCap = Number(allocatedCap + val1); 
                                            acc++;
                                        })

                                        if(((cellresMaxALCPowerLevel - Math.round(allocatedCap)) < allocation) && ($(this).val() > 0)){
                                            axellPopUp('Please enter valid Gain Offset in dB');
                                            $(this).closest('td').find('.rru_cellres_gain_setting_slider').slider('value',((0.0)));
                                            $(this).val(0.0);
                                            _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ULGainOffset = $(this).val();
                                            $('#unused_alc_percentage').text(0+"%");
                                            dialogIsChanged = true;
                                        }else{
                                            $(this).closest('td').find('.rru_cellres_gain_setting_slider').slider('value', $(this).val());
                                            allocatedCap += Number(allocation);
                                            $('#unused_alc_percentage_'+$(this).attr("band")).text((cellresMaxALCPowerLevel-allocatedCap).toFixed(1)+"%");
                                            _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ULGainOffset = $(this).val();
                                            dialogIsChanged = true;
                                        }
                                    }
                                })
                                //in case input text box on change
                                $('.rru_cellres_alr_setting_input').change(function(){
                                    $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                    if(isNaN($(this).val())){
                                        axellPopUp("Please fill in a valid setting");
                                        $(this).val(defaultALR);
                                    }else if($(this).val() < -70 || $(this).val() > 30){
                                        axellPopUp("Please fill in a valid setting for output power. It should be in the range of -70 to 30 with one decimal point ");
                                        $(this).val(defaultALR);
                                    }else {
                                        $(this).closest('td').find('.rru_cellres_alr_setting_slider').slider('value', $(this).val());
                                        _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'), "Destinations": $(this).attr('nodeid')}).DLAlrThr = $(this).val();
                                        dialogIsChanged = true;
                                    }
                                })
                                $('.rru_cellres_level_setting_input').change(function(){
                                    $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                    if(isNaN($(this).val())){
                                        axellPopUp("Please fill in a valid setting");
                                        $(this).val(defaultLEVEL);
                                    }else if($(this).val() < -110 || $(this).val() > 0){
                                        axellPopUp("Please fill in a valid setting for squelch level. It should be in the range of -110 to 0 with one decimal point ");
                                        $(this).val(defaultLEVEL);
                                    }else {
                                        $(this).closest('td').find('.rru_cellres_level_setting_slider').slider('value', $(this).val());
                                        _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'), "Destinations": $(this).attr('nodeid')}).ULLevel = $(this).val();
                                        dialogIsChanged = true;
                                        levelIsChanged = true;
                                    }
                                })

                                if (MODE === "view") {
                                    $('.rru_cellres_alc_setting_slider').slider('disable');
                                    $('.rru_cellres_gain_setting_slider').slider('disable');
                                    //$('.rru_cellres_alr_setting_slider').slider('disable');
                                    //$('.rru_cellres_level_setting_slider').slider('disable');
                                    $('.rru_cellres_alc_setting_input').prop('disabled',true);
                                    $('.rru_cellres_gain_setting_input').prop('disabled',true);
                                    //$('.rru_cellres_alr_setting_input').prop('disabled',true);
                                    //$('.rru_cellres_level_setting_input').prop('disabled',true);
                                    for (var l = 0; l < device_bands.length; l++){
                                       $('#maxpower_'+l).prop('disabled',true);
                                       $('#minpower_'+l).prop('disabled',true);
                                       $('#maxpower_'+l).addClass('disabled');
                                       $('#minpower_'+l).addClass('disabled');
                                    }
                                }

                                for(var k = 0; k < device_bands.length; k++){
                                   var allocatedCap = 0;
                                   $.each($(this).find('.rru_cellres_alc_setting_slider[band='+ device_bands[k] +']').not(this),function(){
                                      allocatedCap = allocatedCap + Number($(this).slider('value').toFixed(1));
                                   })
                                   $('#unused_alc_percentage_'+ device_bands[k]).text((cellresMaxALCPowerLevel-allocatedCap).toFixed(1)+"%");
                                }
                              
                            },
                            beforeClose:function(){
                                if(dialogIsChanged){
                                    if(confirm("There are changes detected. Are you sure you want to discard the changes?")){
                                        return true;
                                    }else{
                                        return false;
                                    }
                                }else{
                                    return true;
                                }
                            },
                            buttons:{
                                /*
                                'Reset to default':function(){
                                    //TODO: reset all to default value
                                    //same as default --> disabled button
                                },
                                */
                                'Login':function(){
                                    var ip = _.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['IP'];
                                    var split = ip.split('.');
                                    var k = parseInt(split[2]);
                                    var s = parseInt(split[3]);
                                    var port = 10000 + ((k-2)*256) + s;
                                    window.open("http://" + window.location.hostname + ":" + port, "_blank");
                                },
                                'Zoom':function(){
                                    window.open("/target/index.html?Node Type="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['Node Type']+
                                                                  "&ID="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['ID']+
                                                                  "&Status="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['Status']+
                                                                  "&Comm="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['Comm']+
                                                                  "&Tag="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['Tag']+
                                                                  "&Location="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['Location']+
                                                                  "&System="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['System']+
                                                                  "&Common="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['Common']+         
                                                                  "&Target="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['Target']+
                                                                  "&IP="+_.findWhere(topologyList.nodes,{ID:zoneList[zoneIndex].ZoneNodes[rruIndex]})['IP'], "_blank");
                                },
                                'Cancel':function(){
                                    $(this).dialog('close');
                                },
                                'Save':function(){
                                    dialogIsChanged =false;
                                    $(".ui-dialog-buttonpane button:contains('Save')").button("disable");
                                    //setRF
                                    //RFROUTE <Profile> SETRF < NodeSerial > < CellRes > < ALC Offset > < UL Gain Offset>
                                    console.log(rfCellresLevelPerRemote);
                                    $.each(_.where(rfCellresLevelPerRemote,{"Destinations":$this.attr('nodeid')}),function(i, cellres){
                                        api.exe({
                                            //cmd:'RFROUTE -o '+OPERATOR+' '+PROFILENAME+' SETRF '+$this.attr('nodeid')+' '+cellres.CellRes+' '+cellres.ALCOffset+' '+cellres.ULGainOffset,
                                            cmd:'RFROUTE -o '+OPERATOR+' '+PROFILENAME+' SETRF '+$this.attr('nodeid')+' '+cellres.CellRes+' '+cellres.ALCOffset+' '+cellres.ULGainOffset+' '+ cellres.DLAlrThr+' '+cellres.ULAlrThr+' '+cellres.ULLevel,
                                            onSuccess:function(){

                                            },
                                            onError:function(err){
                                                axellPopUp(err.errorThrown);
                                            }
                                        })
                                    })
                                    if ((MODE === "view") && levelIsChanged) {
                                        api.exe({
                                            cmd:'CELLRES -o '+OPERATOR+' sync_to_rru '+$this.attr('nodeid')+' '+PROFILENAME,
                                            onSuccess:function(){

                                            },
                                            onError:function(err){
                                                axellPopUp(err.errorThrown);
                                            }
                                        })
                                    }
                                    $(this).dialog('close');
                                    //XXXXX update values on main page 
                                }
                            }
                        });
                        $('#rf_power_level').dialog('open');
                    })

                    $(document).on('change','.slot_select', function(){
                        var sel = document.getElementById($(this).attr('id'));
                        rruSelectorsValues.push($(this).attr('id') + '|' + sel[sel.selectedIndex].text);
                    })
                    
                    $(document).on('click','#hide_btn',function(){
                        $("#filter_settings").hide();
                    })
                    $('#filter_setting_btn').click(function(){
                        $("#filter_settings").show();
                    })

                    $("#dialog_del").hide();
                    $('#confirm_back').hide();
                    //leave page without save change
                    window.onbeforeunload = function(){
                        return AnyChanges();
                    }

                    $(document).on('click', '.remote_checkbox' , function() {
                        //remove class disabled
                        $('#save').removeClass('disabled');
                        isChanged = true;
                        var node_data = _.findWhere(filtered_rru_cellres,{rru_id:$(this).attr('node-id')});
                        if(node_data.bundleList.length > 10)
                        {

                        } else {
                        var mimo_buddy_node_data = ""//_.findWhere(filtered_rru_cellres,{rru_id:node_data.mimo_buddy});
                        if($(this).is(':checked')){
                            //if the cellres is not in the cellres list of the remote then add it in
                            //check all other cellres which has conflicted frequency with that cellres and block them
                            //update the dsp and cpri quota
                            var found_conflict = false;
                            if(_.contains(node_data.cres_list,$(this).attr('cellres-id'))
                                || _.contains(node_data.conflict_list,$(this).attr('cellres-id'))
                                //|| _.contains(node_data.mimo_conflict_list,$(this).attr('cellres-id'))
                                || _.contains(node_data.incompatible_quota_list,$(this).attr('cellres-id'))
                                || _.contains(node_data.incompatible_cellres_list,$(this).attr('cellres-id'))) {
                                found_conflict = true;
                            }
                            if(!found_conflict) {
                                node_data.cres_list.push($(this).attr('cellres-id'));
                                node_data.cres_list = _.uniq(node_data.cres_list);
                                _.extend(node_data.conflict_list, _.pluck(GetConflicts(node_data.rru_id), "ResID"));

                                var found_in_zone = false;
                                for(var i = 0; i < node_data.bundleList.length; i ++){
                                    var bundle_node_data = _.findWhere(filtered_rru_cellres,{"rru_id":node_data.bundleList[i]});
                                    if (bundle_node_data != null){
                                        for (var j = 0; j < bundle_node_data.cres_list.length; j ++){
                                            if(bundle_node_data.cres_list[j] == $(this).attr('cellres-id')){
                                                found_in_zone = true;
                                            }
                                        }
                                        var bundle_node_cres = _.findWhere(bundle_node_data,{"rru_id":node_data.bundleList[i]});
                                    }
                                }
                                if(!found_in_zone){
                                    getInsufficientQuota(node_data.rru_id, $(this).attr('cellres-id'), true);
                                }
                            }
                        }else{
                            //if this cres exists in cres list => recalculated used filter allocation
                            if(_.contains(node_data.cres_list,$(this).attr('cellres-id')))
                            {
                                getInsufficientQuota(node_data.rru_id, $(this).attr('cellres-id'), false);
                                node_data.cres_list = _.without(node_data.cres_list,$(this).attr('cellres-id'));
                                node_data.conflict_list = _.without(_.pluck(GetConflicts(node_data.rru_id),"ResID"),$(this).attr('cellres-id'));
                            }
                        }

                        if(setCapacity() == false){
                            $(this).prop('checked', false);
                            node_data.cres_list = _.without(node_data.cres_list,$(this).attr('cellres-id'));
                            axellPopUp(conf_error_message);
                            conf_error_occured = true;
                        }

                        if($(this).is(':checked')){
                            var routeFound = false;
                            for (var i = 0; i < routesRemove.length; i++)
                            {
                              if (routesRemove[i] == this.id)
                              {
                                 delete routesRemove[i];
                                 routeFound = true; 
                                 break;
                              }
                            }
                            if (!routeFound)
                              routesAdd.push(this.id);
                        }else{
                            var routeFound = false;
                            for (var i = 0; i < routesAdd.length; i++)
                            {
                              if (routesAdd[i] == this.id)
                              {
                                 delete routesAdd[i];
                                 routeFound = true; 
                                 break;
                              }
                            }
                            if (!routeFound)
                              routesRemove.push(this.id);
                        }

                        //after updating the data of rru accordingly, re render the node to populate the change
                        var row_data = ReRenderNodeColumn($(this).attr('node-id'),$(this).attr('zone-id'));
                        $('#remote_'+$(this).attr('node-id')).html(row_data);
                        RenderSingleCres($(this).attr('cellres-id'));
                        $('#cres_selections').html(RenderCresSelectionRows());
                        //cheating way to fix the max width of the first two row, add an empty column after the last column populated
                        $('#cres_selections').find('th:last-child').after('<th></th>');
                        $('#remote_'+$(this).attr('node-id')).find('td:last-child').after('<td></td>');
                    } //EOif
                    });

                    $(document).on('click', '.zone_checkbox' , function() {
                        $('#save').removeClass('disabled');
                        isChanged = true;
                        var zone_nodes = _.findWhere(zoneList,{ZoneID:$(this).attr('zone-id')});
                        var mimo_buddy_nodes=[];
                        for(var i=0; i< zone_nodes.ZoneNodes.length; i++)
                        {
                            var node_data = _.findWhere(filtered_rru_cellres,{rru_id:zone_nodes.ZoneNodes[i]});
                            //find  mimo buddy if available
                            var mimo_buddy_node_data = _.findWhere(filtered_rru_cellres,{rru_id:node_data.mimo_buddy});
                            mimo_buddy_nodes.push(node_data.mimo_buddy);
                            if($(this).is(':checked')){
                                var found_conflict = false;
                                if(_.contains(node_data.cres_list,$(this).attr('cellres-id'))
                                    || _.contains(node_data.conflict_list,$(this).attr('cellres-id'))
                                    || _.contains(node_data.mimo_conflict_list,$(this).attr('cellres-id'))
                                    || _.contains(node_data.incompatible_quota_list,$(this).attr('cellres-id'))
                                    || _.contains(node_data.incompatible_cellres_list,$(this).attr('cellres-id'))) {
                                    found_conflict = true;
                                }
                                if(!found_conflict){
                                    node_data.cres_list.push($(this).attr('cellres-id'));
                                    //if this cres is not already in the cres_list ==> new cres added, then recalculate used filter allocation
                                    getInsufficientQuota(node_data.rru_id, $(this).attr('cellres-id'), true);
                                    node_data.cres_list= _.uniq(node_data.cres_list);
                                    node_data.conflict_list = _.pluck(GetConflicts(node_data.rru_id),"ResID");

                                    if(mimo_buddy_node_data){
                                        if(_.findWhere(filtered_cellresList, {ResID:$(this).attr('cellres-id')}).MIMO ==="A,B"){
                                            mimo_buddy_node_data.cres_list.push($(this).attr('cellres-id'));
                                            mimo_buddy_node_data.cres_list = _.uniq(mimo_buddy_node_data.cres_list);
                                            if(!_.contains(mimo_buddy_node_data.cres_list,$(this).attr('cellres-id')))
                                            {
                                                getInsufficientQuota(mimo_buddy_node_data.rru_id, $(this).attr('cellres-id'), true);
                                                _.extend(mimo_buddy_node_data.conflict_list,_.pluck(GetConflicts(mimo_buddy_node_data.rru_id),"ResID"));
                                            }
                                        }else{
                                            mimo_buddy_node_data.mimo_conflict_list.push($(this).attr('cellres-id'));
                                            _.extend(mimo_buddy_node_data.conflict_list,_.pluck(GetConflicts(mimo_buddy_node_data.rru_id),"ResID"));
                                            mimo_buddy_node_data.conflict_list.push($(this).attr('cellres-id'));
                                        }
                                    }
                                }
                            }else{
                                //if this cres exists in cres list => recalculated used filter allocation
                                if(_.contains(node_data.cres_list,$(this).attr('cellres-id')))
                                {
                                    getInsufficientQuota(node_data.rru_id, $(this).attr('cellres-id'), false);
                                    //then remove it from cres list later
                                    node_data.cres_list = _.without(node_data.cres_list,$(this).attr('cellres-id'));
                                    node_data.conflict_list = _.without(_.pluck(GetConflicts(node_data.rru_id),"ResID"),$(this).attr('cellres-id'));
                                }

                                if(mimo_buddy_node_data && !_.contains(mimo_buddy_nodes, node_data.rru_id)){
                                    if(_.findWhere(filtered_cellresList, {ResID:$(this).attr('cellres-id')}).MIMO ==="A,B"){
                                        getInsufficientQuota(mimo_buddy_node_data.rru_id, $(this).attr('cellres-id'), false);
                                        mimo_buddy_node_data.cres_list = _.without(mimo_buddy_node_data.cres_list,$(this).attr('cellres-id'));
                                        mimo_buddy_node_data.conflict_list = _.without(_.pluck(GetConflicts(mimo_buddy_node_data.rru_id),"ResID"),$(this).attr('cellres-id'));
                                    }else {
                                        mimo_buddy_node_data.cres_list = _.without(mimo_buddy_node_data.cres_list,$(this).attr('cellres-id'));
                                        mimo_buddy_node_data.mimo_conflict_list = _.without(mimo_buddy_node_data.mimo_conflict_list,$(this).attr('cellres-id'));
                                        mimo_buddy_node_data.conflict_list = _.without(_.pluck(GetConflicts(mimo_buddy_node_data.rru_id),"ResID"),$(this).attr('cellres-id'));
                                    }
                                }
                            }
                            var row_data = ReRenderNodeColumn(zone_nodes.ZoneNodes[i],zone_nodes.ZoneID);
                            $('#remote_'+zone_nodes.ZoneNodes[i]).html(row_data);
                            if(mimo_buddy_node_data){
                                var row_data = ReRenderNodeColumn(node_data.mimo_buddy,$(this).attr('zone-id'));
                                $('#remote_'+node_data.mimo_buddy).html(row_data);
                            }
                        }
                        //cheating way to fix the max width of the first two row, add an empty column after the last column populated
                        //$('#tr_'+zone_nodes.ZoneNodes[i]).find('td:last-child').after('<td></td>');
                        RenderSingleCres($(this).attr('cellres-id'));
                        $('#cres_selections').html(RenderCresSelectionRows());
                        //cheating way to fix the max width of the first two row, add an empty column after the last column populated
                        $('#cres_selections').find('th:last-child').after('<th></th>');
                        $('#zone_'+zone_nodes.ZoneID).find('th:last-child').after('<th></th>');
                        setCapacity();
                    });

                    $(document).on('click', '.selectAll' , function(event) {
                        $('#save').removeClass('disabled');
                        isChanged = true;
                        var mimo_buddy_nodes=[];
                        if($(this).is(':checked'))
                        {
                            var found_conflict = false;
                            for(var y=0; y< filtered_rru_cellres.length; y++)
                            {
                                //loop all rru's see if any are in conflict for this cres
                                //conflict,mimo conflict or incompatible quotalist, or incompatible rf range
                                if(_.contains(filtered_rru_cellres[y].conflict_list,$(this).attr('cellres-id'))
                                    || _.contains(filtered_rru_cellres[y].mimo_conflict_list,$(this).attr('cellres-id'))
                                    || _.contains(filtered_rru_cellres[y].incompatible_quota_list,$(this).attr('cellres-id'))
                                    || _.contains(filtered_rru_cellres[y].incompatible_cpri_list,$(this).attr('cellres-id'))
                                    || _.contains(filtered_rru_cellres[y].incompatible_cellres_list,$(this).attr('cellres-id')))
                                {
                                    $(this).attr("checked", false);
                                    found_conflict = true;
                                }
                            }
                            if(!found_conflict)
                            {
                                for(var t=0; t< filtered_rru_cellres.length; t++)
                                {
                                    //find  mimo buddy if available
                                    var mimo_buddy_node_data = _.findWhere(filtered_rru_cellres,{rru_id:filtered_rru_cellres[t].mimo_buddy});
                                    mimo_buddy_nodes.push(filtered_rru_cellres[t].mimo_buddy);
                                    if(!_.contains(filtered_rru_cellres[t].cres_list,$(this).attr('cellres-id')))
                                    {
                                        filtered_rru_cellres[t].cres_list.push($(this).attr('cellres-id'));
                                        //if this cres is not already in the cres_list, then recalculate used filter allocation
                                        getInsufficientQuota(filtered_rru_cellres[t].rru_id, $(this).attr('cellres-id'), true);
                                        filtered_rru_cellres[t].cres_list = _.uniq(filtered_rru_cellres[t].cres_list);
                                        filtered_rru_cellres[t].conflict_list = _.pluck(GetConflicts(filtered_rru_cellres[t].rru_id),"ResID");

                                    }
                                    if(mimo_buddy_node_data && !_.contains(mimo_buddy_nodes, filtered_rru_cellres[t].rru_id)){
                                        mimo_buddy_node_data.cres_list.push($(this).attr('cellres-id'));
                                        mimo_buddy_node_data.cres_list = _.uniq(mimo_buddy_node_data.cres_list);
                                        if(_.findWhere(filtered_cellresList, {ResID:$(this).attr('cellres-id')}).MIMO ==="A,B"){
                                            if(!_.contains(mimo_buddy_node_data.cres_list,$(this).attr('cellres-id')))
                                            {
                                                getInsufficientQuota(mimo_buddy_node_data.rru_id, $(this).attr('cellres-id'), true);
                                                //mimo_buddy_node_data.conflict_list = _.pluck(GetConflicts(mimo_buddy_node_data.rru_id),"ResID");
                                                _.extend(mimo_buddy_node_data.conflict_list,_.pluck(GetConflicts(mimo_buddy_node_data.rru_id),"ResID"));
                                                //mimo_buddy_node_data.conflict_list = _.uniq(mimo_buddy_node_data.conflict_list);
                                            }
                                        }else{
                                            mimo_buddy_node_data.mimo_conflict_list.push($(this).attr('cellres-id'));
                                            _.extend(mimo_buddy_node_data.conflict_list,_.pluck(GetConflicts(mimo_buddy_node_data.rru_id),"ResID"));
                                            mimo_buddy_node_data.conflict_list.push($(this).attr('cellres-id'));
                                            //mimo_buddy_node_data.conflict_list = _.uniq(mimo_buddy_node_data.conflict_list);
                                        }
                                    }
                                    var zoneid='';
                                    $.each(zoneList,function(i,zone){
                                        if(_.findWhere(zone.ZoneNodes,filtered_rru_cellres[t].rru_id)){
                                            zoneid = zone.ZoneID;
                                        }
                                    })
                                    var row_data = ReRenderNodeColumn(filtered_rru_cellres[t].rru_id,zoneid);
                                    $('#remote_'+filtered_rru_cellres[t].rru_id).html(row_data);
                                    //cheating way to add more column at the end of routing page
                                   // $('#div_'+filtered_rru_cellres[t].rru_id).find('td:last-child').after('<td></td>');
                                }
                            }
                        }else{
                            for(var z=0; z< filtered_rru_cellres.length; z++)
                            {
                                var mimo_buddy_node_data = _.findWhere(filtered_rru_cellres,{rru_id:filtered_rru_cellres[z].mimo_buddy});
                                //if found this cellres in the cres_list, then recalculate used filter allocation
                                if(_.contains(filtered_rru_cellres[z].cres_list,$(this).attr('cellres-id'))) {
                                    getInsufficientQuota(filtered_rru_cellres[z].rru_id, $(this).attr('cellres-id'), false);
                                    //remove this cell res from cres_list if found
                                    filtered_rru_cellres[z].cres_list = _.uniq(_.without(filtered_rru_cellres[z].cres_list,$(this).attr('cellres-id')));
                                    var plucked = _.pluck(GetConflicts(filtered_rru_cellres[z].rru_id),"ResID");
                                    var plucked_without = _.without(plucked,$(this).attr('cellres-id'));
                                    filtered_rru_cellres[z].conflict_list = _.uniq(plucked_without);
                                }

                                if(mimo_buddy_node_data && !_.contains(mimo_buddy_nodes, filtered_rru_cellres[z].rru_id)){

                                    if(_.findWhere(filtered_cellresList, {ResID:$(this).attr('cellres-id')}).MIMO ==="A,B"){
                                        getInsufficientQuota(mimo_buddy_node_data.rru_id, $(this).attr('cellres-id'), false);
                                        mimo_buddy_node_data.cres_list = _.without(mimo_buddy_node_data.cres_list,$(this).attr('cellres-id'));
                                        mimo_buddy_node_data.conflict_list = _.without(_.pluck(GetConflicts(mimo_buddy_node_data.rru_id),"ResID"),$(this).attr('cellres-id'));
                                    }else {
                                        mimo_buddy_node_data.cres_list = _.without(mimo_buddy_node_data.cres_list,$(this).attr('cellres-id'));
                                        mimo_buddy_node_data.mimo_conflict_list = _.without(mimo_buddy_node_data.mimo_conflict_list,$(this).attr('cellres-id'));
                                        mimo_buddy_node_data.conflict_list = _.without(_.pluck(GetConflicts(mimo_buddy_node_data.rru_id),"ResID"),$(this).attr('cellres-id'));
                                    }
                                }
                                //console.error(filtered_rru_cellres[z].rru_id);
                                var zoneid='';
                                $.each(zoneList,function(i,zone){
                                    if(_.findWhere(zone.ZoneNodes,filtered_rru_cellres[z].rru_id)){
                                        zoneid = zone.ZoneID;
                                    }
                                })
                                var row_data = ReRenderNodeColumn(filtered_rru_cellres[z].rru_id,zoneid);
                                $('#remote_'+filtered_rru_cellres[z].rru_id).html(row_data);
                                //cheating way to add more column at the end of routing page
                                $('#tr_'+filtered_rru_cellres[z].rru_id).find('td:last-child').after('<td></td>');
                            }
                        }
                        $('#cres_selections').html(RenderCresSelectionRows());
                        //cheating way to add more column at the end of routing page
                        $('#cres_selections').find('th:last-child').after('<th></th>');
                        setCapacity();
                    });

                    $('#back').click(function()
                    {
                        if(MODE == "view")
                        {
                            window.location = '/target/profiles/';
                        }
                        else
                        {
                            ShowConfirmBackDialog();
                        }
                    });

                    if(MODE==="edit" || MODE =="copyToNew" || MODE == "new"){
                        $('body').bind('mousedown keydown mousemove', function(event) {
                            if($("#dialog_timer").dialog( "isOpen" ))
                            {
                                $('#dialog_timer').dialog("close");
                                MakeALockRequest();
                            }
                            user_last_active = new Date();
                        });
                        var timeoutTimer = setTimeout(ShowTimeOutWarningAndReturn, timeoutTime);

                        api.exe({
                            cmd:'RFROUTE -o '+OPERATOR+' '+ PROFILENAME + ' LOCK',
                            dataType:'text',
                            onSuccess:function(o){
                                last_lock_time = new Date();
                            },
                            onError:function(o)
                            {
                                displayFailedToLock();
                            }
                        })
                    }

                    //save function
                    $('#save').click(function()
                    {
                        $.blockUI({ 
                            fadeIn: 1000, 
                            timeout: 60000, 
                            onBlock: function() { 
                                if(!$(this).hasClass('disabled')) {
                                    //this nesting ajax sucks but will work for the impending demo @ mwc
                                    if (!util.validateTag($('#tag').val())) {
                                        axellPopUp("Please fill in a valid profile tag. Profile name should be 0-50 characters long and only contain [a-z0-9-_], space is allowed");
                                    }else {
                                        api.exe({
                                            cmd: "RFROUTE -o " + OPERATOR + ' ' + PROFILENAME + " TAG \"" + $('#tag').val() + "\"",
                                            dataType: "text",
                                            onSuccess: function (o) {
                                                api.exe({
                                                    cmd: "RFROUTE -o " + OPERATOR + ' ' + PROFILENAME + " --json",
                                                    dataType: "json",
                                                    onSuccess: function (o) {
                                                        var rfOffsets = o.ajaxdata.RFOffsets;
                                                        var rfroute = o.ajaxdata;
                                                        for (var i = 0; i < routesRemove.length; i++)
                                                        {
                                                           if (routesRemove[i] == undefined)
                                                               continue;

                                                           var res = routesRemove[i].split("_");
                                                           var objex = {};
                                                           objex.cres = res[0] + "_" + res[1];
                                                           objex.rru_serial = res[2];
                                                           $.each(rfroute.Routes, function (key, value) {
                                                               if((objex.cres == value.CellRes) && (objex.rru_serial == value.Destinations)){
                                                                  var del_str = "RFROUTE -o " + OPERATOR + ' ' + rfroute.Profile + " DELROUTE " + value.RouteNo;
                                                                  api.exe({
                                                                      cmd: del_str,
                                                                      async: false,
                                                                      dataType: "text",
                                                                      onSuccess: function (o) {
                                                                      }
                                                                  });
                                                               }
                                                           });
                                                        }
                                                        routesRemove.length = 0;

                                                        var rfroutes_to_add = [];
                                                        //TODO: add in selected list, this is not working with the new filtering
                                                        /*$('input[type=checkbox]').each(function () {
                                                            //sList += "(" + $(this).val() + "-" + (this.checked ? "checked" : "not checked") + ")";
                                                            if ($(this).hasClass('remote_checkbox')) {
                                                                if (this.checked)*/                                                                 
                                                        for (var i = 0; i < routesAdd.length; i++)
                                                        {
                                                           if (routesAdd[i] == undefined)
                                                               continue;

                                                           //var res = this.id.split("_");
                                                           var res = routesAdd[i].split("_");
                                                           var objex = {};
                                                           var ALCset = false;
                                                           objex.cres = res[0] + "_" + res[1];
                                                           objex.rru_serial = res[2];
                                                           $.each(rfOffsets, function (key, value) {
                                                               if((objex.cres == value.CellRes) && (objex.rru_serial == value.Destinations)){
                                                                   objex.alu_offset = value.ALCOffset;
                                                                   objex.ul_gainOffset = value.ULGainOffset;
                                                                   objex.dl_alr_thr = value.DLAlrThr;
                                                                   objex.ul_alr_thr = value.ULAlrThr;
                                                                   objex.ul_level = value.ULLevel;
                                                                   ALCset = true;
                                                               }
                                                           })
                                                           if(ALCset == false){
                                                                   objex.alu_offset = cellresDefaultALCPowerLevel;
                                                                   objex.ul_gainOffset = cellresDefaultGainPowerLevel;
                                                                   objex.dl_alr_thr = cellresDefaultDlAlarmThreshold;
                                                                   objex.ul_alr_thr = cellresDefaultUlAlarmThreshold;
                                                                   objex.ul_level = cellresDefaultUlLevel;
                                                           }
                                                           rfroutes_to_add.push(objex);
                                                        }
                                                        routesAdd.length = 0;
                                                            //}
                                                        //});
                                                        var grouped_rfroutes = _.groupBy(rfroutes_to_add, function (ojj) {
                                                            return ojj.cres
                                                        });
                                                        $.each(grouped_rfroutes, function (key, value) {
                                                            var nodes_to_cres = "";
                                                            $.each(value, function (key2, value2) {
                                                                var add_str;
                                                                var findSelector = document.getElementById('slot_sel_' + value2.cres + '_' + value2.rru_serial);
                                                                if(findSelector != null){
                                                                    var selector_text = findSelector[findSelector.selectedIndex].value;
                                                                    var cell_slot = selector_text;
                                                                    add_str = "RFROUTE -o " + OPERATOR + ' ' + rfroute.Profile + " ADDROUTE " + key + " " + value2.rru_serial + " " + cell_slot;
                                                                }
                                                                else {
                                                                    add_str = "RFROUTE -o " + OPERATOR + ' ' + rfroute.Profile + " ADDROUTE " + key + " " + value2.rru_serial;
                                                                }
                                                                api.exe({
                                                                    cmd: add_str,
                                                                    async: false,
                                                                    dataType: "text",
                                                                    onSuccess: function (o) {

                                                                    }
                                                                });
                                                                var set_str = "RFROUTE -o " + OPERATOR + ' ' + rfroute.Profile + ' SETRF ' + value2.rru_serial + ' ' + key + ' ' + value2.alu_offset + ' ' + value2.ul_gainOffset + ' ' + value2.dl_alr_thr + ' ' + value2.ul_alr_thr + ' ' + value2.ul_level;
                                                                api.exe({
                                                                    cmd: set_str,
                                                                    async: false,
                                                                    dataType: "text",
                                                                    onSuccess: function (o) {

                                                                    }
                                                                });
                                                            })
                                                        })
                                                        $('#save').addClass('disabled');
                                                        isChanged = false;
                                                        $.unblockUI();
                                                    }
                                                });
                                            },
                                            onError: function (o) {
                                                var xxx = -1;
                                            }
                                        });
                                    }
                                }
                            } 
                        }); 
                    });

                    // delete function
                    $('#delete').click(function()
                    {
                        axellConfirm("alert","Warning","Do you really want to delete profile " + PROFILENAME + "?<br /><br />" +
                        "After successfully deleting profile " + PROFILENAME + " you will be redirected back to routing profiles page.", function () {
                            $.blockUI({  
                                fadeIn: 1000, 
                                timeout:   2000, 
                                onBlock: function() { 
                                    api.exe({
                                        cmd: "RFROUTE -o " + OPERATOR + ' ' + PROFILENAME + " DELETE",
                                        onSuccess: function () {
                                            UnlockProfile();
                                            // window.location = '/target/profiles/';
                                        },
                                        onError: function (err) {
                                            axellPopUp(err.errorThrown);
                                        }
                                    })
                                } 
                            }); 
                        })
                    })

                    $('#txt_gain_offset').change(function(){
                       if(isNaN($(this).val())){
                            axellPopUp("Please fill in a valid setting");
                            $(this).val(0);
                        }else if($(this).val() < -20 || $(this).val() > 25){
                            axellPopUp("Please fill in a valid setting for gain offset. It should be in the range of -20 to 25 with one decimal point ");
                            $(this).val(0);
                        }
                    })
                    $('#txt_power_monitoring').change(function(){
                        if(isNaN($(this).val())){
                            axellPopUp("Please fill in a valid setting");
                            $(this).val(-70);
                        }else if($(this).val() < -70 || $(this).val() > 30){
                            axellPopUp("Please fill in a valid setting for output power. It should be in the range of -70 to 30 with one decimal point ");
                            $(this).val(-70);
                        }
                    })
                    $('#txt_squelch_Level').change(function(){
                        if(isNaN($(this).val())){
                            axellPopUp("Please fill in a valid setting");
                            $(this).val(-85);
                        }else if($(this).val() < -110 || $(this).val() > 0){
                            axellPopUp("Please fill in a valid setting for squelch level. It should be in the range of -110 to 0 with one decimal point ");
                            $(this).val(-85);
                        }
                    })

                    $('#export').click(function() {
                       api.exe({
                           cmd:'RFROUTE -o '+ OPERATOR +' '+PROFILENAME+' --json',
                           async:false,
                           dataType:'json',
                           onSuccess:function(e){
                               var row = "Profile," + PROFILENAME + "\n";
                               for (var rru = 0; rru < rruByOrder.length; rru++)
                               {
                                  row += "\nSerial,Tag,Location,CPRI (%),DSP (%)\n";
                                  row += rruByOrder[rru] + "," + _.findWhere(topologyList.nodes,{ID:rruByOrder[rru]}).Tag + "," + _.findWhere(topologyList.nodes,{ID:rruByOrder[rru]}).Location + "," + cpriCapa[rruByOrder[rru]].toFixed(2) + "," + dspCapa[rruByOrder[rru]].toFixed(2) + "\n";
                                  row += "\nCell Name,Ranges,Output Power (dbm),Gain Offset (db),SquelchLevel\n";
                                  $.each(e.ajaxdata.RFOffsets,function(i, value){
                                      if(rruByOrder[rru] == value.Destinations){
                                         var ulLevelStr = "-";
                                         //$.each(bandsList,function(index, val){
                                           //if ((val.Band == _.findWhere(filtered_cellresList,{"ResID":value.CellRes}).Band) && (val.PS == "1"))
                                           if((_.findWhere(filtered_cellresList,{"ResID":value.CellRes}).Tech == "NBFM") || (_.findWhere(filtered_cellresList,{"ResID":value.CellRes}).Tech == "TETRA"))
                                             ulLevelStr = value.ULLevel;
                                         //})
                                         row +=  _.findWhere(filtered_cellresList,{"ResID":value.CellRes}).Tag + "," + convert.hz2mhz(_.findWhere(filtered_cellresList,{"ResID":value.CellRes}).StartDL) + "MHz-" + convert.hz2mhz(_.findWhere(filtered_cellresList,{"ResID":value.CellRes}).StopDL) + "MHz," + AlcOffsetTodBm(value.ALCOffset,value.Destinations,_.findWhere(filtered_cellresList,{"ResID":value.CellRes}).Band) + "," + value.ULGainOffset + "," + ulLevelStr + "\n";
                                      }
                                  })
                               }

                               download(PROFILENAME+".csv", row);
                           }
                       });
                    })

                    $('#general_config').click(function() {
                        $("#popup_general_config").dialog("open");
                    })

                    $('#popup_general_config').dialog({
                        width : 400,
                        height : 300,
                        resizable : false,
                        autoOpen : false,
                        title : "General Settings",
                        buttons:{
                            'Apply' : function () {
                              axellConfirm("info","Notice","Are you sure you want to set these parameters to all RRUs?", function () {
                                 api.exe({
                                    cmd:'RFROUTE -o '+ OPERATOR +' '+PROFILENAME+' --json',
                                    async:false, // need to get this done before other things below
                                    dataType:'json',
                                    onSuccess:function(e){
                                        //get the original rfoffset
                                        originalRFOffset = e.ajaxdata.RFOffsets;
                                        originalRoutes = e.ajaxdata.Routes;
                                        rfCellresLevelPerRemote = [];
                                        //save the rfoffset that users play with before saving
                                        $.each(originalRFOffset,function(i, value){
                                            var Slot = 0;
                                            if (originalRoutes != undefined){
                                               for(var i = 0; i < originalRoutes.length; i ++){
                                                   if((originalRoutes[i].CellRes == value.CellRes) && (originalRoutes[i].Destinations == value.Destinations)){
                                                       Slot = originalRoutes[i].Band;
                                                   }
                                               }
                                            }
                                            rfCellresLevelPerRemote.push({"CellRes": value.CellRes, "Destinations": value.Destinations, "Band": _.findWhere(filtered_cellresList,{"ResID":value.CellRes}).Band,"ALCOffset":value.ALCOffset , "ULGainOffset": value.ULGainOffset , "DLAlrThr": value.DLAlrThr , "ULAlrThr": value.ULAlrThr , "ULLevel": value.ULLevel , "Slot": Slot});
                                        })
                                        rfCellresLevelPerRemote = rfCellresLevelPerRemote.uniqueObjects();
                                    }
                                 });

                                 for(var z = 0; z < zoneList.length; z++)
                                 {
                                    for(var rruIndex = 0; rruIndex < zoneList[z].ZoneNodes.length; rruIndex++)
                                    {
                                       var nodeId = zoneList[z].ZoneNodes[rruIndex];
                                       
                                       var device_bands = [];
                                       for(var k = 0; k < rfrangeSlotList.length; k++){
                                          var rfrangeSlotListTokens = rfrangeSlotList[k].split("|");
                                          var rfrangeSlotListDevice = rfrangeSlotListTokens[0].split(",");
                                          if (rfrangeSlotListDevice[0] == nodeId){
                                              var bandNum = rfrangeSlotListDevice[1].split(":");
                                              device_bands.push(rfrangeSlotListTokens[1] + "_" + bandNum[1]);
                                          }
                                       }

                                       if (document.getElementById("radio_outputpower_max").checked){
                                          for(var k = 0; k < device_bands.length; k++){
                                             var cellCounter = 0;
                                             var device_band_freq = device_bands[k].split("_")[0];
                                             $.each(_.findWhere(filtered_rru_cellres, {"rru_id": nodeId}).cres_list, function (i, cres) {
                                                 for(var l = 0; l < rfCellresLevelPerRemote.length; l ++){
                                                    if ((rfCellresLevelPerRemote[l].Destinations == nodeId) && (rfCellresLevelPerRemote[l].CellRes == cres) && 
                                                        (Math.abs(rfCellresLevelPerRemote[l].Band - device_band_freq) < bandsCompare)){
                                                        cellCounter++;
                                                    }
                                                 }
                                             })
                                             var powerList = rfrangePowerList[nodeId+":"+device_band_freq];
                                             var quota = _.findWhere(default_operator_rf_quotas,{"Band":device_band_freq}).RFQuota; 
                                             var maxPower = (powerList / 10.0) + (10 * Math.log(quota/100) / Math.log(10));
                                             maxPower = Math.round(maxPower);
                                             var power = (maxPower - (10 * Math.log(cellCounter)/Math.log(10))).toFixed(1);
                                             $.each(_.findWhere(filtered_rru_cellres, {"rru_id": nodeId}).cres_list, function (i, cres) {
                                                 for(var l = 0; l < rfCellresLevelPerRemote.length; l ++){
                                                    if ((rfCellresLevelPerRemote[l].Destinations == nodeId) && (rfCellresLevelPerRemote[l].CellRes == cres) && 
                                                        (Math.abs(rfCellresLevelPerRemote[l].Band - device_band_freq) < bandsCompare)){
                                                       var uiValue = alcdBmToPercentage(power,quota,device_band_freq,nodeId);
                                                       _.findWhere(rfCellresLevelPerRemote,{"Destinations":nodeId,"CellRes":cres}).ALCOffset = percentageToAlcOffset(uiValue,quota,nodeId,device_band_freq).toString();
                                                    }
                                                 }
                                             })    
                                          }
                                       }else if (document.getElementById("radio_outputpower_min").checked){
                                          for(var k = 0; k < device_bands.length; k++){
                                             var device_band_freq = device_bands[k].split("_")[0];
                                             var quota = _.findWhere(default_operator_rf_quotas,{"Band":device_band_freq}).RFQuota; 
                                             $.each(_.findWhere(filtered_rru_cellres, {"rru_id": nodeId}).cres_list, function (i, cres) {
                                                 for(var l = 0; l < rfCellresLevelPerRemote.length; l ++){
                                                    if ((rfCellresLevelPerRemote[l].Destinations == nodeId) && (rfCellresLevelPerRemote[l].CellRes == cres) && 
                                                        (Math.abs(rfCellresLevelPerRemote[l].Band - device_band_freq) < bandsCompare)){
                                                       var uiValue = alcdBmToPercentage(0,quota,device_band_freq,nodeId);
                                                       _.findWhere(rfCellresLevelPerRemote,{"Destinations":nodeId,"CellRes":cres}).ALCOffset = percentageToAlcOffset(uiValue,quota,nodeId,device_band_freq).toString();
                                                    }
                                                 }
                                             })
                                          }
                                       }

                                       $.each(_.where(rfCellresLevelPerRemote,{"Destinations":nodeId}),function(i, cellres){
                                           var gainOffset = $("#txt_gain_offset").val();
                                           var powerMonitoring = $("#txt_power_monitoring").val();
                                           var squelchLevel = -120;
                                           if((_.findWhere(filtered_cellresList,{"ResID":cellres.CellRes}).Tech == "NBFM") || (_.findWhere(filtered_cellresList,{"ResID":cellres.CellRes}).Tech == "TETRA"))
                                             squelchLevel = $("#txt_squelch_Level").val();
                                           api.exe({
                                               cmd:'RFROUTE -o '+OPERATOR+' '+PROFILENAME+' SETRF '+nodeId+' '+cellres.CellRes+' '+cellres.ALCOffset+' '+gainOffset+' '+ powerMonitoring+' '+cellres.ULAlrThr+' '+squelchLevel,
                                               onSuccess:function(){

                                               },
                                               onError:function(err){
                                                   axellPopUp(err.errorThrown);
                                               }
                                           })
                                       })
                                    }
                                 }                     
                                 for(var i = 0; i < filtered_cellresList.length; i++)
                                 {
                                    var DlAlrThr = $("#txt_dl_alr_thr").val();
                                    api.exe({
                                      cmd:'RFROUTE -o '+OPERATOR+' '+PROFILENAME+' SETPW '+filtered_cellresList[i].ResID+' '+DlAlrThr+' '+0,
                                      onSuccess:function(){

                                      },
                                      onError:function(err){
                                          axellPopUp(err.errorThrown);
                                      }
                                    })
                                 }                     
                              })

                              $(this).dialog('close');
                            }
                        }
                    })

                    $(document).on('click', '#collapse_expand_zones_btn' , function(event) {
                        for(var zone_index = 0; zone_index < zoneList.length; zone_index ++){
                            if(zoneList[zone_index].ZoneName != '&nbsp;'){
                                $('#' + zoneList[zone_index].ZoneName + '_icon').click();
                            }                
                        }
                    });
                    
                    $(document).on('click', '#collapse_expand_cells_btn' , function(event) {
                        if(filtered_cellresList.length > 0){
                           $('#' + filtered_cellresList[0].SectorID + '_icon').click();
                           for(var i = 1; i < filtered_cellresList.length; i ++){
                               if(filtered_cellresList[i].SectorID != filtered_cellresList[i-1].SectorID){
                                   $('#' + filtered_cellresList[i].SectorID + '_icon').click();
                               }                
                           }
                        }
                    });
                    
                    $.each($.parseJSON($.cookie('operatorCook')),function(key,value){
                        if(value.SysName === OPERATOR){
                            $('#operator_name').text(value.FullName);
                        }
                    })

                    //mouse over on mimo pair icon
                    $(document).off('mouseover','.mimo_buddy')
                        .on('mouseover','.mimo_buddy',function(){
                            $('#'+$(this).attr('mimo_buddy')+'_mimo_buddy').removeClass('mimo_buddy').addClass('highlighted_mimo_buddy');
                            $(this).removeClass('mimo_buddy').addClass('highlighted_mimo_buddy');
                    })
                    $(document).off('mouseout','.highlighted_mimo_buddy')
                        .on('mouseout','.highlighted_mimo_buddy',function(){
                            $('#'+$(this).attr('mimo_buddy')+'_mimo_buddy').addClass('mimo_buddy').removeClass('highlighted_mimo_buddy');
                            $(this).addClass('mimo_buddy').removeClass('highlighted_mimo_buddy');
                    })
                    //RequestRfMesaurements();

        }

});
