require([ '/js/api.js', '/js/convert.js',],
    function (api, convert) {
        window.sectorToMTDIList = {};

        /* filtering functions*/

        window.refreshSectorList = refreshSectorList;
        function refreshSectorList(list){
            $( "#sector").empty();
            var selOption ="";
            for(var i = 0; i < list.length; i++)
            {
                selOption +='<option value="'+list[i].SectorID+'">'+list[i].SectorID+" - "+list[i].Tag+'</option>';
            }
            $('#num_of_sector').text(list.length.toString());
            $( "#sector").append(selOption);
            $("#sector").trigger('chosen:updated');
        }

        window.refreshCellresList = refreshCellresList;
        function refreshCellresList(list){
            $( "#cellres").empty();
            var selOption ="";
            for(var i = 0; i < list.length; i++)
            {
                selOption +='<option value="'+list[i].ResID+'">'+list[i].ResID+" - "+list[i].Tag+'</option>';
            }
            $('#num_of_cellres').text(list.length.toString());
            $( "#cellres").append(selOption);
            $("#cellres").trigger('chosen:updated');
        }

        window.refreshZoneList = refreshZoneList;
        function refreshZoneList(list){
            $( "#zone").empty();
            var selOption ="";
            for(var i = 0; i < list.length; i++)
            {
                selOption +='<option value="'+list[i].ZoneID+'">'+list[i].ZoneID+" - "+list[i].ZoneName+'</option>';
            }
            $('#num_of_zone').text(list.length.toString());
            $( "#zone").append(selOption);
            $("#zone").trigger('chosen:updated');
        }


        /*end of filtering functions*/


        window.CreateCresConflictingFrequencies = CreateCresConflictingFrequencies;
        function CreateCresConflictingFrequencies()
        {
            for(var j=0; j<filtered_cellresList.length; j++)
            {
                for(var k =0; k< filtered_cellresList.length; k++)
                {
                    if(filtered_cellresList[j].StartDL > filtered_cellresList[k].StartDL && filtered_cellresList[j].StartDL < filtered_cellresList[k].StopDL
                        || filtered_cellresList[j].StartDL >= filtered_cellresList[k].StartDL && filtered_cellresList[j].StopDL <= filtered_cellresList[k].StopDL
                        || filtered_cellresList[j].StopDL > filtered_cellresList[k].StartDL && filtered_cellresList[j].StopDL < filtered_cellresList[k].StopDL
                        || filtered_cellresList[j].StartDL <= filtered_cellresList[k].StartDL && filtered_cellresList[j].StopDL >= filtered_cellresList[k].StopDL)
                    {
                        if(filtered_cellresList[j] != filtered_cellresList[k])
                        {
                            var does_it_exist = _.findWhere(conflicting_cell_res,{ResID:filtered_cellresList[j].ResID});
                            if(does_it_exist)
                            {
                                does_it_exist.Conflicts.push(filtered_cellresList[k]);
                            }
                            else
                            {
                                conflicting_cell_res.push({ResID:filtered_cellresList[j].ResID, Conflicts:[filtered_cellresList[k]]});
                            }
                        }
                    }
                }
            }
        }

        window.GenerateDefaultViewHtml = GenerateDefaultViewHtml;
        function GenerateDefaultViewHtml()
        {
            //check the incompatible cpri and filter quota here
            for(var i=0; i< filtered_rru_cellres.length; i++ ) {
                for (var g = 0; g < filtered_rru_cellres[i].cres_list.length; g++) {
                    if (!_.contains(filtered_rru_cellres[i].mimo_conflict_list, filtered_rru_cellres[i].cres_list[g])) {
                        if (_.findWhere(filtered_cellresList, {ResID: filtered_rru_cellres[i].cres_list[g]}) != undefined) {
                            getInsufficientQuota(filtered_rru_cellres[i].rru_id, filtered_rru_cellres[i].cres_list[g], true);
                        }
                    }
                }
            }
            //ObjectsToBeFiltered(selected_band,selected_sector,selected_tech);
            var html_to_render = RenderTableHtml();
            setCapacity();
            //cheating way to fix the max width of the first two row, add an empty column after the last column populated
            $('#start_filter').dialog('close');
            
            for(var zone_index = 0; zone_index < zoneList.length; zone_index ++){
                if(zoneList[zone_index].ZoneName != '&nbsp;'){
                    $('#' + zoneList[zone_index].ZoneName + '_icon').click();
                }                
            }
        }

        window.getInsufficientQuota = getInsufficientQuota;
        function getInsufficientQuota(node_id, cellres_id,isChecked){
            var node_data = _.findWhere(filtered_rru_cellres,{"rru_id":node_id});
            node_data.incompatible_quota_list =[];
            node_data.incompatible_cpri_list =[];
            if(isChecked){
                node_data.used_filter_quota = Number(node_data.used_filter_quota) + Number(_.findWhere(filtered_cellresList,{ResID:cellres_id}).FilterQuota);
                node_data.used_CPRI_capacity = Number(node_data.used_CPRI_capacity) + Number(_.findWhere(filtered_cellresList,{ResID:cellres_id}).LinkCap);
                //find quota of cellres
                $.each(_.difference(_.pluck(filtered_cellresList,'ResID'),node_data.cres_list),function(key, cellres){
                    var cellresDSPQuota = _.findWhere(filtered_cellresList,{ResID:cellres}).FilterQuota;
                    var cellresCPRIQuota = _.findWhere(filtered_cellresList,{ResID:cellres}).LinkCap;
                    if(cellresDSPQuota > (node_data.allocated_filter_quota - node_data.used_filter_quota)){
                        node_data.incompatible_quota_list.push(cellres);
                    }
                    if(cellresCPRIQuota > (node_data.alloc_CPRI_capacity - node_data.used_CPRI_capacity)){
                        node_data.incompatible_cpri_list.push(cellres);
                    }
                })
            }else{
                node_data.used_filter_quota = Number(node_data.used_filter_quota) - Number(_.findWhere(filtered_cellresList,{ResID:cellres_id}).FilterQuota);
                node_data.used_CPRI_capacity = Number(node_data.used_CPRI_capacity) - Number(_.findWhere(filtered_cellresList,{ResID:cellres_id}).LinkCap);
                //find quota of cellres
                $.each(_.difference(_.pluck(filtered_cellresList,'ResID'),node_data.cres_list),function(key, cellres){
                    var cellresDSPQuota = _.findWhere(filtered_cellresList,{ResID:cellres}).FilterQuota;
                    var cellresCPRIQuota = _.findWhere(filtered_cellresList,{ResID:cellres}).LinkCap;
                    if(cellresDSPQuota > (node_data.allocated_filter_quota - node_data.used_filter_quota)){
                        node_data.incompatible_quota_list.push(cellres);
                    }
                    if(cellresCPRIQuota > (node_data.alloc_CPRI_capacity - node_data.used_CPRI_capacity)){
                        node_data.incompatible_cpri_list.push(cellres);
                    }
                })
            }
        }

        window.RenderTableHtml = RenderTableHtml;
        function RenderTableHtml()
        {
            var resp = '';
            //ObjectsToBeFiltered(selected_band,selected_sector,selected_tech);
            checked_val = '';
            //RenderLayout();
            var zonesAndNodes = RenderZonesAndRRUHeadings();
            $('#routingZoneNames').empty();
            $('#routingCascadeNames').empty();
            $('#routingNodeNames').empty();
            $('#routingCellResNameHeading').empty();
            $('#routingCellResBandHeading').empty();
            $('#routingCresSectorHeading').empty();
            $('#routingCresSelectionHeading').empty();
            $('#routingCellResNameRows').empty();
            $('#routingCellResBandRows').empty();
            $('#routingCresSectorRows').empty();
            $('#routingCresSelectionRows').empty();
            $('#routingCheckboxes').empty();

            $('#routingZoneNames').append(zonesAndNodes.zones);
            $('#routingCascadeNames').append(zonesAndNodes.cascades);
            $('#routingNodeNames').append(zonesAndNodes.nodes);

            $('#routingCellResNameHeading').append(RenderCresHeadings());
            $('#routingCellResBandHeading').append(RenderCresFreqHeadings());
            $('#routingCresSectorHeading').append(RenderCresSectorHeadings());
            $('#routingCresSelectionHeading').append(RenderCresSelectionHeadings());

            $('#routingCellResNameRows').append(RenderCresRows());
            $('#routingCellResBandRows').append(RenderCresFreqRows());
            $('#routingCresSectorRows').append(RenderCresSectorRows());
            $('#routingCresSelectionRows').append(RenderCresSelectionRows());

            $('#routingCheckboxes').append(RenderCheckboxes());
            $('.cellResHeading').height($('#routing_content').height()*0.10);
            $('.cellResBandHeading').height($('#routing_content').height()*0.10);
            $('.cellResSectorHeadings').height($('#routing_content').height()*0.10);
            $('.cellResSelectionHeadings').height($('#routing_content').height()*0.10);
            return resp;
        }

        var rowHeight = 30;

        function RenderCresRows()
        {
            var zone_id = 0;
            var resp = "";

            var preSectorID = -1;
            var colorID;

            filtered_cellresList.sort(function(a,b){
                var keyA = a.SectorID.toLowerCase();
                var keyB = b.SectorID.toLowerCase();
                if(keyA < keyB){
                    return -1
                }
                if(keyA > keyB){
                    return 1
                }
                return 0;
            });
            
            var sect = "";
            
            for(var i =0; i< filtered_cellresList.length; i++)
            {
                var sectorDetails = _.findWhere(sectorList,{SectorID: filtered_cellresList[i].SectorID});
                if(filtered_cellresList[i].SectorID != sect){
                    if(sect != ""){
                        resp += '</div>'
                    }
                    resp += '<div id="' + filtered_cellresList[i].SectorID + '" class="cellResRowBlue" ><div id="' + filtered_cellresList[i].SectorID + '_icon" title="' + filtered_cellresList[i].SectorID + '" class="icon minmaxbutton minimize"></div><b>' + sectorDetails['Tag'] + '</b></div>'
                    sect = filtered_cellresList[i].SectorID;
                }
                var displayResID = filtered_cellresList[i].ResID.substring(filtered_cellresList[i].ResID.indexOf("_") + 1);
                var displayTag = "";
                if(filtered_cellresList[i].Tag != "" && filtered_cellresList[i].Tag != null &&  filtered_cellresList[i].Tag != undefined && filtered_cellresList[i].Tag != " ") {
                    displayTag = filtered_cellresList[i].Tag;
                }else{
                    displayTag = filtered_cellresList[i].ResID;
                }
                
                preSectorID = sectorDetails.SectorID

                var mtdiStr = "";
                for(var k = 0; k < rfConn.length; k ++) 
                {
                  if (rfConn[k].conn[0]["From"] != sectorDetails.SectorID)
                     continue;
                  
                  var toType = rfConn[k].conn[0]["ToType"];
                  if (toType.indexOf("APOI") != -1)
                  {
                     if(rfConn[k+1] == null)
                        continue;
                     var to = rfConn[k+1].conn[0]["To"].split(":");
                     var port = to[1] + ":" + to[2];
                     var mtdi = to[0];
                     mtdiStr = " / " + mtdi + ":" + port;
                  }
                }

                resp += "<div id='" + filtered_cellresList[i].ResID + "_" + sectorDetails.SectorID + "_row' class='cellResRowWhite' title='Tag:"+filtered_cellresList[i].Tag+"" +
                    "\nID: " + filtered_cellresList[i].ResID +
                    "\nTech: " + filtered_cellresList[i].Tech +
                    "\nManual DL Level: " + filtered_cellresList[i].AlcOffset + " dBm" +
                    "\nGain Offset: " + filtered_cellresList[i].StartCellresTxGain + " dB" +                    
                    "\nRange: " + convert.hz2mhz(filtered_cellresList[i].StartDL) + "MHz - " + convert.hz2mhz(filtered_cellresList[i].StopDL)+"MHz " +
                    "\nBand: " + filtered_cellresList[i].Band + "MHz" +
                    "\nBTS Port: " + sectorDetails.SectorID +
                    "\nBTS Tag: " + sectorDetails['BTS Tag'] +
                    "\nAttached to: " + sectorToMTDIList[sectorDetails.SectorID] + mtdiStr
                    if( _.findWhere(topologyList.nodes,{ID: sectorToMTDIList[sectorDetails.SectorID]}) != undefined){
                       resp += "\nTag: " + _.findWhere(topologyList.nodes,{ID: sectorToMTDIList[sectorDetails.SectorID]}).Tag +
                               "\nIP: " + _.findWhere(topologyList.nodes,{ID: sectorToMTDIList[sectorDetails.SectorID]}).IP
                    }else{
                       resp += "\nTag: undefined" +
                               "\nIP: undefined"
                    }
                    resp += "'" +
                    " style='height:"+rowHeight+"'><span id=cres_details_" + i + " class='cres_details icon setting float' data-index=" + i + " title='More settings' index=" + i+ "></span><div>"
                if((MODE==="view") || (MODE==="edit"))  
                    resp += "<div id='cres_pow_"+filtered_cellresList[i].ResID+"' class='led gray' title='Downlink:... Uplink:...'></div> ";
                if(MODE==="edit")
                    resp += "<input class='cres_checker' type='checkbox' id='cres_checker_"+filtered_cellresList[i].ResID+"' title='Toggle all RRU'>";

                var hrefstr = "/target/index.html?Node Type="+"VIRT_SECT"+
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
                                                "&SectorID="+sectorDetails['SectorID'];
                resp += '<b><a target="_blank" href="' + hrefstr + '">'+ displayTag +'</a></b></div>';
                toggleRedLeds.running = false;
                if(filtered_cellresList[i].MIMO === "A,B"){
                    resp += filtered_cellresList[i].ResID.substring(filtered_cellresList[i].ResID.indexOf("_")+1,filtered_cellresList[i].ResID.length)+"<br/><div class='icon mimo' title='MIMO Cell Resource Input "+filtered_cellresList[i].MIMO+"'></div></div>";
                }else{
                    //resp += filtered_cellresList[i].ResID.substring(filtered_cellresList[i].ResID.indexOf("_")+1,filtered_cellresList[i].ResID.length)+"</div>";
                    resp += "</div>";
                }
            }
                //resp += '</div>'
            return resp;
        }

        window.setCapacity = setCapacity;
        function setCapacity(){
            var CPRI_capacity_indicators_values = [];
            var DSP_capacity_indicators_values = [];
            
            var arry_of_node_capacitys = [];
            var arry_of_node_quotas = [];
            
            var conf_error = false;

            cpriCapa.length = 0;
            dspCapa.length = 0;

            for(var i=0; i< filtered_rru_cellres.length; i++ ) {
                if (filtered_rru_cellres[i].rru_id == null)
                  continue;
                //set cpri indicator
                var capacity_selector = "#capacity_indicator_" + filtered_rru_cellres[i].rru_id;
                var node_link_cap = 0;
                //var filtered_cell_res = _.where(routing_objs[i].CellResNodes,{CresNode:routing_objs[i].ZoneNodes[l]});
                for (var g = 0; g < filtered_rru_cellres[i].cres_list.length; g++) {
                    if (_.findWhere(filtered_cellresList, {ResID: filtered_rru_cellres[i].cres_list[g]}) != undefined) {
                            node_link_cap += parseInt(_.findWhere(filtered_cellresList, {ResID: filtered_rru_cellres[i].cres_list[g]}).LinkCap);
                        }
                }

                var bundle_cres = [];
                for (var h = 0; h < filtered_rru_cellres[i].bundleList.length; h++) {
                   var nodeId = filtered_rru_cellres[i].bundleList[h];
                   //console.log(nodeId);
                   var node_data = _.findWhere(filtered_rru_cellres,{rru_id:nodeId});
                   //console.log(node_data);
                   //console.log(node_data.cres_list);                   
                   for (var n = 0; n < node_data.cres_list.length; n++) {
                    if (!_.contains(filtered_rru_cellres[i].cres_list, node_data.cres_list[n])) {
                        var cres_found = false;
                         //console.log(node_data.cres_list[n]);
                         for(var c = 0; c < bundle_cres.length; c ++){
                             if(bundle_cres[c] == node_data.cres_list[n]){
                                 cres_found = true;
                             }
                         }
                         if ((_.findWhere(filtered_cellresList, {ResID:node_data.cres_list[n] }) != undefined) && (!cres_found)) {
                              bundle_cres.push(node_data.cres_list[n]);
                              node_link_cap += parseInt(_.findWhere(filtered_cellresList, {ResID:node_data.cres_list[n]}).LinkCap);
                        }
                       }
                   }
                }
                var node_capa = filtered_rru_cellres[i].alloc_CPRI_capacity? ((node_link_cap / filtered_rru_cellres[i].alloc_CPRI_capacity) *100) : 0;
                //update used cpri cap based on cellres list routed to certain rru
                _.findWhere(filtered_rru_cellres,{rru_id:filtered_rru_cellres[i].rru_id}).used_CPRI_capacity = node_link_cap;
                arry_of_node_capacitys.push({rru_id:filtered_rru_cellres[i].rru_id, node_cap:node_capa});
                //console.log(filtered_rru_cellres)
                cpriCapa[filtered_rru_cellres[i].rru_id] = node_capa;
                if(node_capa > 100){
                    conf_error = true;
                    conf_error_message = "Please update CPRI settings for " + filtered_rru_cellres[i].rru_id + ". exceeds 100%.";
                }
                else{
                    CPRI_capacity_indicators_values.push({selector:capacity_selector, node_cap:node_capa});                
                }
                // SetProgBarVal(capacity_selector,node_capa);
                //set dsp indicator
                var dsp_capacity_selector = "#dsp_capacity_indicator_"+filtered_rru_cellres[i].rru_id;
                var node_filter_quota = 0;
                //var filtered_cell_res = _.where(routing_objs[i].CellResNodes,{CresNode:routing_objs[i].ZoneNodes[l]});
                for(var g =0; g< filtered_rru_cellres[i].cres_list.length; g++)
                {
                    if(!_.contains(filtered_rru_cellres[i].bundleList,filtered_rru_cellres[i].cres_list[g])){
                        if(_.findWhere(filtered_cellresList,{ResID:filtered_rru_cellres[i].cres_list[g]}) !=undefined){
                            node_filter_quota += parseInt(_.findWhere(filtered_cellresList,{ResID:filtered_rru_cellres[i].cres_list[g]}).FilterQuota);
                        }
                    }
                }

                var bundle_dsp = [];
                for (var h = 0; h < filtered_rru_cellres[i].bundleList.length; h++) {
                   var nodeId = filtered_rru_cellres[i].bundleList[h];
                   //console.log(nodeId);
                   var node_data = _.findWhere(filtered_rru_cellres,{rru_id:nodeId});
                   for (var n = 0; n < node_data.cres_list.length; n++) {
                    if (!_.contains(filtered_rru_cellres[i].cres_list, node_data.cres_list[n])) {
                        var dsp_found = false;
                         //console.log(node_data.cres_list[n]);
                         for(var c = 0; c < bundle_dsp.length; c ++){
                             if(bundle_dsp[c] == node_data.cres_list[n]){
                                 dsp_found = true;
                             }
                         }
                         //console.log(node_data.cres_list[n]);
                         if ((_.findWhere(filtered_cellresList, {ResID:node_data.cres_list[n] }) != undefined) && (!dsp_found)) {
                              bundle_dsp.push(node_data.cres_list[n]);
                              node_filter_quota += parseInt(_.findWhere(filtered_cellresList, {ResID:node_data.cres_list[n]}).FilterQuota);
                         }
                       }
                   }
                }

                var node_quota = filtered_rru_cellres[i].allocated_filter_quota? ((node_filter_quota / filtered_rru_cellres[i].allocated_filter_quota) *100) : 0;
                //update used cpri cap based on cellres list routed to certain rru
                _.findWhere(filtered_rru_cellres,{rru_id:filtered_rru_cellres[i].rru_id}).used_filter_quota = node_filter_quota;
                arry_of_node_quotas.push({rru_id:filtered_rru_cellres[i].rru_id, node_quota:node_quota});
                dspCapa[filtered_rru_cellres[i].rru_id] = node_quota;
                if(node_quota > 100){
                    conf_error = true;
                    conf_error_message = "Please update DSP settings for " + filtered_rru_cellres[i].rru_id + ". exceeds 100%";
                }
                else{
                    DSP_capacity_indicators_values.push({selector:dsp_capacity_selector, node_quota:node_quota});
                }
            }
            
            if(!conf_error){
                $( ".dsp_progress_indicator" ).each(function() {
                    $( this ).progressbar({
                        value: false
                    });
                });

                $( ".cpri_progress_indicator" ).each(function() {
                    $( this ).progressbar({
                        value: false
                    });
                });

                $( ".rfm_progress_indicator" ).each(function() {
                    $( this ).progressbar({
                        value: false
                    });
                });

                for(var j = 0 ; j < CPRI_capacity_indicators_values.length; j ++){
                    SetProgBarVal(CPRI_capacity_indicators_values[j].selector, CPRI_capacity_indicators_values[j].node_cap);
                }
                for(var j = 0 ; j < DSP_capacity_indicators_values.length; j ++){
                    SetProgBarVal(DSP_capacity_indicators_values[j].selector, DSP_capacity_indicators_values[j].node_quota);
                }
            }
            else {
                return false;
            }
            return true;
        }

        function SetProgBarVal(selector,value)
        {
            progressbar = $( selector )
            progressbarValue = progressbar.find( ".ui-progressbar-value" );
            progressbarValue.css({
                "background": lowCapacityConnectionColor
            });
            if(value > 60)
            {
                progressbarValue.css({
                    "background": mediumCapacityConnectionColor
                });
            }
            if(value > 80)
            {
                progressbarValue.css({
                    "background": highCapacityConnectionColor
                });
            }

            progressbar.progressbar( "option", {
                value: Math.floor( value )
            });

            $(selector).prop('title', 'Usage: '+value.toFixed(2)+'%');
        }


        window.GetConflicts = GetConflicts;
        function GetConflicts(node_id)
        {
            var rru_data = _.findWhere(filtered_rru_cellres,{"rru_id":node_id});
            //find all the conflicts for the enabled cellres for this node
            var all_conflicts = [];
            if(rru_data)
            {
                for(var g=0; g<filtered_cellresList.length; ++g)
                {
                    if(filtered_cellresList[g])
                    {
                        if(_.contains(rru_data.cres_list,filtered_cellresList[g].ResID))
                        {
                            all_conflicts.push(_.findWhere(conflicting_cell_res,{ResID:filtered_cellresList[g].ResID}));
                        }
                    }
                }

                var ret = _.uniq(_.flatten(_.pluck(_.without(all_conflicts,undefined),"Conflicts")));
                return ret;
            }
            return [];
        }


        
});
