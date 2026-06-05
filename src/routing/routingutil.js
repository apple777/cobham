        /************************** all calculations functions **************************/

        window.ConvertdBToLin = ConvertdBToLin;
        function ConvertdBToLin(dB)
        {
            if(dB == 0)
            {
                return(0);
            }
            else
            {
                return(Math.pow(10,dB/10));
            }
        }

        window.ConvertLinTodBm = ConvertLinTodBm;
        function ConvertLinTodBm(Lin)
        {
            if(Lin == 0)
            {
                return(0);
            }
            else
            {
                return(10 * Math.log(Lin)/Math.log(10));
            }
        }

        window.GetMaxPower = GetMaxPower;
        function GetMaxPower(nodeid,band)
        {
        }

        window.CalcRruMaxPowerPerOperator = CalcRruMaxPowerPerOperator;
        function CalcRruMaxPowerPerOperator(operatorQuota,nodeid,band)
        {
            var rruMaxPowerPerOperatordB;
            var rruMaxPowerPerOperatorLin;
            var max;

            if(operatorQuota == 0)
            {
                rruMaxPowerPerOperatordB = 0;
                rruMaxPowerPerOperatorLin = 0;
            }
            else
            {
                max = rfrangePowerList[nodeid+":"+band]
                rruMaxPowerPerOperatordB = max/10.0 + 10 * Math.log(operatorQuota/100)/Math.log(10);
                rruMaxPowerPerOperatorLin = ConvertdBToLin(rruMaxPowerPerOperatordB);
                rruMaxPowerPerOperatordB = Math.round(rruMaxPowerPerOperatordB);
                rruMaxPowerPerOperatorLin = Math.round(rruMaxPowerPerOperatorLin);
            }
            return rruMaxPowerPerOperatorLin;

        }

        window.AlcOffsetTodBm = AlcOffsetTodBm;
        function AlcOffsetTodBm(alc,nodeid,band)
        {
            var max;
            var retval;
            max = rfrangePowerList[nodeid+":"+band]
            retval = (Number(alc) + max/10.0).toFixed(1);
            return retval;
        }

        window.dBmToAlcOffset = dBmToAlcOffset;
        function dBmToAlcOffset(dBm,nodeid,band)
        {
            var max;
            max = rfrangePowerList[nodeid+":"+band]
            return dBm - max/10.0;
        }

        //to be displayed to user
        window.percentageToAlcdBm = percentageToAlcdBm;
        function percentageToAlcdBm(per,operatorQuota,band,nodeid)
        {
            var lin;
            var dbm;
            var rruMaxPowerPerOperatorLin = CalcRruMaxPowerPerOperator(operatorQuota,nodeid,band);
            lin = rruMaxPowerPerOperatorLin * per / 100;
            dbm = ConvertLinTodBm(lin);
            return(dbm);
        }

        //to be displayed to user
        window.alcdBmToPercentage = alcdBmToPercentage;
        function alcdBmToPercentage(AlcdBm,operatorQuota,band,nodeid)
        {
            var lin;
            var percentage;
            var rruMaxPowerPerOperatorLin = CalcRruMaxPowerPerOperator(operatorQuota,nodeid,band);
            lin = ConvertdBToLin(AlcdBm);
            percentage = (100 * lin) / rruMaxPowerPerOperatorLin;
            return(percentage);
        }

        //to convert percentage to alc offset to send to back end
        window.percentageToAlcOffset = percentageToAlcOffset;
        function percentageToAlcOffset(per,operatorQuota,nodeid,band)
        {
            var lin;
            var db;
            var rruMaxPowerPerOperatorLin = CalcRruMaxPowerPerOperator(operatorQuota,nodeid,band);
            lin = rruMaxPowerPerOperatorLin * per / 100;
            db = ConvertLinTodBm(lin);
            max = rfrangePowerList[nodeid+":"+band]
            return((db - max/10.0).toFixed(1));
        }

        window.AlcOffsetToPercentage = AlcOffsetToPercentage;
        function AlcOffsetToPercentage(alcOffset,operatorQuota,band,nodeid)
        {
            var alc;
            var lin;
            var per;

            if(operatorQuota == 0){
                per = 0;
            }else{
                var rruMaxPowerPerOperatorLin = CalcRruMaxPowerPerOperator(operatorQuota,nodeid,band);
                max = rfrangePowerList[nodeid+":"+band]
                alc = max/10.0 + alcOffset;
                lin = ConvertdBToLin(alc);
                per = lin / rruMaxPowerPerOperatorLin * 100;
            }
            return(per);
        }

        /************************** all Render functions **************************/

        window.RenderSingleCres = RenderSingleCres;
        function RenderSingleCres(cres_id)
        {
            var resp = '';
            var summary_check = '';
            var selectAllRow ='';

            var cres_nodes = _.filter(filtered_rru_cellres, function(num){
                if(_.contains(num.cres_list,cres_id)){
                    return num;
                }});
            var zones_maxed_for_cres = _.filter(zoneList, function(num2){
                var nodes_in_cres_and_zone = _.intersection(_.pluck(cres_nodes,'rru_id'),num2.ZoneNodes);
                if(nodes_in_cres_and_zone.length === num2.ZoneNodes.length )
                {
                    return num2;
                }});
            var disable_state = "";
            if(zones_maxed_for_cres.length == zoneList.length)
            {
                summary_check='checked="checked"';
            }
            else
            {
                //not all the zones are on
                var counter = 0;
                var any_conflicts = false;
                for(var y=0; y< filtered_rru_cellres.length; y++)
                {
                    //loop all rru's see if any are in conflict for this cres
                    if(_.contains(filtered_rru_cellres[y].conflict_list,cres_id)
                        || _.contains(filtered_rru_cellres[y].mimo_conflict_list,cres_id)
                        || _.contains(filtered_rru_cellres[y].incompatible_cellres_list,cres_id)
                        || _.contains(filtered_rru_cellres[y].incompatible_quota_list,cres_id)
                        || _.contains(filtered_rru_cellres[y].incompatible_cpri_list,cres_id)
                        ||filtered_rru_cellres[y].alloc_CPRI_capacity == 0
                        || filtered_rru_cellres[y].alloc_filter_capacity==0)
                    {
                        //if so then the cres must not be able to be toggled on/off
                        any_conflicts = true;
                    }
                }
                if(any_conflicts)
                {
                    //we can turn all the checkboxes on
                    disable_state = "disabled='true'";
                }
            }

            selectAllRow += '<div class="capacityCell" id="th_'+cres_id+'"><input id="'+cres_id+'_selectAll" type="checkbox" '+summary_check+' ' + disable_state +' class="selectAll" cellres-id="'+cres_id+'"';
            if(MODE ==="view")
            {
                selectAllRow += ' disabled="true"/></div>';
            }
            else
            {
                selectAllRow += '/></div>';
            }
            resp += selectAllRow;
            return resp;
        }

        //function RequestRfMesaurements()

        window.RenderCresHeadings = RenderCresHeadings;
        function RenderCresHeadings()
        {
            var resp = '<div class="zoneWrapperTitle" style="height:12em;width:17em"><div style="margin-top:1em"><b><span style="margin-top:1em; padding-left:1em; color:#666666; font-size:14px">Zone Names</span></b></div><div style="position:absolute;bottom:1em; "><b><span style="padding-left:1em; color:#666666;font-size:14px">Cell Resource Tags</span></b></div></div>';
            return resp;
        }

        //function RenderCresRows()

        window.RenderCresFreqHeadings = RenderCresFreqHeadings;
        function RenderCresFreqHeadings()
        {
            var resp = "<div class='rotate'>Band/ Technology</div>";
            return resp;
        }

        window.RenderCresFreqRows = RenderCresFreqRows;
        function RenderCresFreqRows()
        {
            var resp = "";
            for( var i=0; i<filtered_cellresList.length; i++ )
            {
                resp += "<div class='bandCell'>" +
                    "<div class='freq_band' title='Band "+filtered_cellresList[i].Band+" MHz'>"+filtered_cellresList[i].Band+"</div> " +
                    "<div class='band_icon_container'> " +
                    "<div class='band_icon "+filtered_cellresList[i].Tech+"' title='Technology "+filtered_cellresList[i].Tech+"'></div>" +
                    "</div></div>";
            }
            return resp;
        }

        window.RenderCresSectorHeadings = RenderCresSectorHeadings;
        function RenderCresSectorHeadings()
        {
            var resp = "<div class='rotate'>BTS port <div class='icon number'></div></div>";
            return resp;
        }

        window.RenderCresSectorRows = RenderCresSectorRows;
        function RenderCresSectorRows()
        {
            var resp = "";
            for( var i=0; i<filtered_cellresList.length; i++ )
            {
                var sector_data = _.findWhere(sectorList,{'SectorID':filtered_cellresList[i].SectorID});
                resp += "<div class='btsCell' title='" + sector_data.Tag + "\nBTS Tag: " + sector_data['BTS Tag'] +"'>"
                    + filtered_cellresList[i].SectorID.substring(filtered_cellresList[i].SectorID.indexOf("_")+1,filtered_cellresList[i].SectorID.length) +"</div>";
            }
            return resp;
        }

        window.RenderCresSelectionHeadings = RenderCresSelectionHeadings;
        function RenderCresSelectionHeadings()
        {
            return "<div class='rotate'> <b> <span>Select All</span></b></div>";
        }

        window.RenderCresSelectionRows = RenderCresSelectionRows;
        function RenderCresSelectionRows()
        {
            var resp = "";
            for( var i=0; i<filtered_cellresList.length; i++ )
            {
                resp += RenderSingleCres(filtered_cellresList[i].ResID);
            }
            return resp;
        }

        //10 more functions

        window.RenderZonesAndRRUHeadings = RenderZonesAndRRUHeadings;
        function RenderZonesAndRRUHeadings()
        {
            var resp = {};
            resp.zones = "";
            resp.cascades = "";
            resp.nodes = "";
            var zoneRow = '';
            var zoneToggle = 0;
            rruByOrder.length = 0;
            for(var z=0; z< zoneList.length; z++)
            {
                var zone_nodes = zoneList[z];
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
                     for (var i = 0; i < zoneList[z].ZoneNodes.length; i++)
                     {
                        var node_id = zoneList[z].ZoneNodes[i];
                        if (conn.length == 0 || conn[k].nodes[m].ID == node_id)
                           nodeCount++;
                     }
                  }
                }
                
                var zoneWidth = 10*nodeCount;
                var zoneName = zone_nodes.ZoneName;

                zoneRow += '<div id="zoneWrapper_' + zoneName + '" class="zoneWrapper" childid="'+zoneList[z].ZoneNodes+'" style="width:'+zoneWidth+'em" title="'+zone_nodes.ZoneName+'">';
                if(zoneName == "Unassigned1"){
                    zone_nodes.ZoneName = "&nbsp;";
                    zoneRow += '<div id=zone_name_header_name><b><span>' + zone_nodes.ZoneName + '</span></b></div>';
                }
                else{
                    if(zoneName == "Unassigned"){
                        /* visibility: hidden; */
                    }
                    zoneRow += '<div id="' + zone_nodes.ZoneName + '_icon" float:"left" title="' + zone_nodes.ZoneName + '" class="icon minmaxbutton maximize"></div><b>'+zoneName+'</b>'
                
                    if(zone_nodes.ZoneName.length > 5 && zone_nodes.ZoneNodes.length == 1)
                    {
                        zoneName = zone_nodes.ZoneName.substr(0, 5) + "...";
                    }
                    else
                    {
                        zoneName = zone_nodes.ZoneName.substr(0, 5*(zone_nodes.ZoneNodes.length));
                    }
                }
                
                for( var i=0; i<filtered_cellresList.length; i++ )
                {
                    var summary_check ='';

                    var enabled_counter = 0;
                    for(var l=0; l< zone_nodes.ZoneNodes.length; l++)
                    {
                        var node_data = _.findWhere(filtered_rru_cellres,{rru_id:zone_nodes.ZoneNodes[l]});
                        if(_.contains(node_data.conflict_list,filtered_cellresList[i].ResID)
                            || _.contains(node_data.mimo_conflict_list,filtered_cellresList[i].ResID)
                            || _.contains(node_data.incompatible_cellres_list,filtered_cellresList[i].ResID)
                            || _.contains(node_data.incompatible_quota_list,filtered_cellresList[i].ResID)
                            || _.contains(node_data.incompatible_cpri_list,filtered_cellresList[i].ResID)
                            || node_data.alloc_CPRI_capacity == 0 || node_data.alloc_filter_capacity==0)
                        {
                            summary_check = "disabled='true'";
                            break;
                        }
                        else
                        {
                            if(_.contains(node_data.cres_list,filtered_cellresList[i].ResID))
                            {
                                enabled_counter++;
                            }
                            if(enabled_counter >= zone_nodes.ZoneNodes.length )
                            {
                                summary_check = "checked='checked'";
                            }
                            else if(enabled_counter > 0)
                            {
                                summary_check = "data-indeterminate='true'";
                            }
                        }
                    }
                }
                zoneRow += '</div>';

                var cascadeRow = '';
                var kEnd = 1;
                if (conn.length > 0){
                  kEnd = conn.length;
                }
                for(var k = 0; k < kEnd; k ++) 
                {
                 if(zoneToggle > 1)
                    zoneToggle = 0;
                 var usedToggle = false;
                 var newCascade = true;
                 var mEnd = 1;
                 if (conn.length > 0){
                   mEnd = conn[k].nodes.length;
                 }
                 for(var m = 0; m < mEnd; m++) 
                 {

                  for (var rruIndex = 0; rruIndex < zoneList[z].ZoneNodes.length; rruIndex++)
                  {
                    var node_id = zoneList[z].ZoneNodes[rruIndex];
                    if (conn.length > 0 && conn[k].nodes[m].ID != node_id)
                        continue;

                    rruByOrder.push(node_id);

                    if (newCascade)
                    {
                        newCascade = false;
                        var nCounter = nodeCount;
                        if (conn.length > 0){
                           nCounter = conn[k].nodes.length;
                        }
                        var cascadeWidth = 10*nCounter;
                        cascadeRow += '<div id="zoneWrapper_' + z + '_' + (k+1) + '" nodeCounter="'+nCounter+'" parentid="'+zoneList[z].ZoneName+'" class="zoneWrapper" style="width:'+cascadeWidth+'em" title="'+z+'_'+(k+1)+'">';
                        cascadeRow += '<div id=cascade_"' + z + '_' + (k+1) + '_icon" float:"left" title="' + 'chain_' + z + '_' + (k+1) + '" class="icon minmaxbutton minimize2"></div><b></b>'
                        cascadeRow += '</div>';
                    }

                    usedToggle = true;
                    var zone_id = zoneList[z].ZoneID;
                    var rru_tmp;
                    var rru_location = '';
                    var rru_location_lb = '';
                    var rru_ip = '';
                    var rru_ip_lb = '';
                    if(_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]}) != undefined){
                        if (_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]}).Tag !="") {
                            tag = _.findWhere(topologyList.nodes, {ID: zoneList[z].ZoneNodes[rruIndex]}).Tag;
                        }else{
                            tag = node_id;
                        }
                        if (_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]}).Location !="Not configured") {
                            rru_tmp = _.findWhere(topologyList.nodes, {ID: zoneList[z].ZoneNodes[rruIndex]}).Location;
                            rru_location = ' : ' +rru_tmp;
                            rru_location_lb = '\nLocation: ' +rru_tmp;
                        }
                        if (_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]}).IP !="") {
                            rru_tmp = _.findWhere(topologyList.nodes, {ID: zoneList[z].ZoneNodes[rruIndex]}).IP;
                            rru_ip = ' : ' +rru_tmp;
                            rru_ip_lb = '\nIP: ' +rru_tmp;
                        }
                    }
                    //console.log("rfquotaList",rfquotaList);
                    var node_rfquota_list = _.findWhere(rfquotaList,{"Node":rruIndex});

                    var rru_data = _.findWhere(filtered_rru_cellres,{"rru_id":node_id});
                    var remoteRow = '';
                    var rru_title = tag + rru_location + " : " + node_id + rru_ip;
                    var rru_title_lb = "Tag: " + tag + rru_location_lb + "\n" + "NodeID: " + node_id + rru_ip_lb;
                    if (rru_data.mimo_buddy != undefined) {
                        remoteRow = '<div class="remoteHead ' + (zoneToggle == 0 ? "zoneColColour1": "zoneColColour2") +'" id="remoteHead_'+node_id +
                            '" data-rru_title="' + rru_title +
                            '" title="' + rru_title_lb +
                            '<div id="more_details_' + node_id + '" class="more_details icon setting" data-nodeid="' + node_id + '" title="More settings" nodeid="' + node_id + '"></div>' +
                            '<div id="indicators_' + node_id + '"><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_' + node_id + '" class="cpri_progress_indicator"></div></div>' +
                            '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_' + node_id + '" class="dsp_progress_indicator"></div></div>';
                            if (MODE != "view")
                            remoteRow +='<div class="node_cres_checker"><input class="node_checker" type="checkbox" id ="node_checker_' + node_id + '" title="Toggle all zone\'s cell resources"/></div>'
                            remoteRow +='<div><span>[dBm]</span></div>';
                            remoteRow +='</div></div>';
                    }else{

                        var hrefstr = "/target/index.html?Node Type="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['Node Type']+
                                                        "&ID="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['ID']+
                                                        "&Status="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['Status']+
                                                        "&Comm="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['Comm']+
                                                        "&Tag="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['Tag']+
                                                        "&Location="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['Location']+
                                                        "&System="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['System']+
                                                        "&Common="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['Common']+         
                                                        "&Target="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['Target']+
                                                        "&IP="+_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]})['IP'];

                        remoteRow = '<div class="remoteHead ' + (zoneToggle == 0 ? "zoneColColour1": "zoneColColour2") + '" id="remoteHead_' + node_id +
                            '" data-rru_title="' + rru_title +
                            '" title="' + rru_title_lb + '" ><div style="height:40px;" id="tag_' + node_id + '"><a target="_blank" href="' + hrefstr + '">'+ tag + '</a></div>' +
                            '<div id="more_details_' + node_id + '" class="more_details icon setting" data-nodeid="' + node_id + '" title="More settings" nodeid="' + node_id + '"></div><div id="indicators_' + node_id + '">' +
                            '<div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_' + node_id + '" class="cpri_progress_indicator"></div></div>' +
                            '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_' + node_id + '" class="dsp_progress_indicator"></div></div>';
                            if (MODE != "view")
                            remoteRow +='<div class="node_cres_checker"><input class="node_checker" type="checkbox" id ="node_checker_' + node_id + '" title="Toggle all zone\'s cell resources"/></div>' 
                            remoteRow +='<div><span>[dBm]</span></div>';
                            remoteRow +='</div></div>';
                    }
                    resp.nodes += remoteRow;
                  }
                 }
                 if (usedToggle)
                  zoneToggle++;
                }
                cascadeRow += '</div>';
                resp.cascades += cascadeRow;
            }
            zoneRow += '</div>';
            resp.zones += zoneRow;
            return resp;
        }

        window.ReRenderNodeColumn = ReRenderNodeColumn;
        function ReRenderNodeColumn(node_id,zone_id)
        {
            //console.log(node_id,zone_id);
            var tag="";
            if(_.findWhere(topologyList.nodes,{ID:node_id}) != undefined){
                tag = _.findWhere(topologyList.nodes,{ID:node_id}).Tag;
            }
            var rru_data = _.findWhere(filtered_rru_cellres,{"rru_id":node_id});
            var remoteRow = '';

            var activeOrNot = '';
            if (MODE === "view") {
                activeOrNot = 'activeYes';
            }
            else
            {
                activeOrNot = 'activeNo';
            }
            if(rru_data)
            {
                var sect = "";
                for(var i=0; i<filtered_cellresList.length; ++i) {
                //console.log(rru_data.mimo_conflict_list);
                    if(filtered_cellresList[i].SectorID != sect){
                        remoteRow += '<div class="boxRowBlue">&nbsp;</div>'
                        sect = filtered_cellresList[i].SectorID;
                    }

                    var num_of_options = 0;
                    var options = [];
                    for(var bandsCount = 0; bandsCount < rfrangeSlotList.length; bandsCount ++){
                        var rfrangeSlotListTokens = rfrangeSlotList[bandsCount].split("|");
                        var rru_band = rfrangeSlotListTokens[1];
                        var tokens = rfrangeSlotListTokens[0].split(",");
                        var band_slot = [];
                        band_slot = tokens[1].split(":");
                        var band_num = band_slot[1];
                        if((tokens[0] == rru_data.rru_id) && (rru_band == filtered_cellresList[i].Band)){
                            options[num_of_options] = filtered_cellresList[i].Band + "_" +band_num;
                            num_of_options++;
                        }
                    }
                    
                    var checked_val = "";
                    //check if cell resource is in incompatible in frequency range with rru
                    //if yes, block the checkbox
                    if (_.contains(rru_data.incompatible_cellres_list, filtered_cellresList[i].ResID)) {
                            // align with more_details buttons
                            if (MODE === "view") {
                                remoteRow += '<div id="' + filtered_cellresList[i].ResID + '_' + node_id + filtered_cellresList[i].SectorID + '_box" class="gridDiv '+activeOrNot+'"><div class="icon rf-conflict" title="Incompatible radio frequency range with remote ' + node_id + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                            }else{
                                remoteRow += '<div id="' + filtered_cellresList[i].ResID + '_' + node_id + filtered_cellresList[i].SectorID + '_box" class="gridDiv '+activeOrNot+'"><div class="icon rf-conflict" title="Incompatible radio frequency range with remote ' + node_id + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                            }
                        remoteRow += '<span class="smalldbmText" id="per_cell_local_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';
                        remoteRow += '<span class="smalldbmText" id="per_cell_remote_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';
                        remoteRow += '</div>';
                    }
                    else {
                        //if route to one of the mimo enabled remote -->block routing to the other mimo remote
                        //if yes block cell res
                        if (_.contains(rru_data.mimo_conflict_list, filtered_cellresList[i].ResID)) {
                            //console.log("contain in mimo conflict list");
                            checked_val = "checked='checked'";
                            remoteRow += '<div id="' + filtered_cellresList[i].ResID + '_' + node_id + filtered_cellresList[i].SectorID + '_box" class="gridDiv '+activeOrNot+'"><div class="icon mimo-conflict" title="Cell resource is routed to MIMO partner ' + rru_data.mimo_buddy + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID +'"></div>';
                            remoteRow += '<span class="smalldbmText" id="per_cell_local_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';
                            remoteRow += '<span class="smalldbmText" id="per_cell_remote_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';
                            remoteRow += '</div>';
                            //if not contain, behave normally
                        } else {
                            //if there is conflict found with added cellres
                            if (_.contains(rru_data.conflict_list, filtered_cellresList[i].ResID)) {
                                //console.log("contain in conflict list");
                                var conflicts = _.findWhere(conflicting_cell_res, {ResID: filtered_cellresList[i].ResID});
                                //check if the conflict is with MIMO partner
                                var matches = _.intersection(rru_data.cres_list, _.pluck(conflicts.Conflicts, "ResID"));
                                if (matches[0] != undefined) {
                                    var tagTmp = "";
                                    for(var j=0; j<filtered_cellresList.length; j++) {
                                       if (matches[0] == filtered_cellresList[j].ResID){
                                          tagTmp = filtered_cellresList[j].Tag;
                                          break;
                                       }
                                    }
                                    remoteRow += '<div id="' + filtered_cellresList[i].ResID + '_' + node_id + filtered_cellresList[i].SectorID + '_box" class="gridDiv '+activeOrNot+'"><div class="icon overlap-conflict" title="Frequency overlaps with ' + tagTmp + '" node-id="' + node_id + ' zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                } else {
                                    remoteRow += '<div id="' + filtered_cellresList[i].ResID + '_' + node_id + filtered_cellresList[i].SectorID + '_box" class="gridDiv '+activeOrNot+'"><div class="icon overlap-conflict" title="Frequency overlaps with MIMO partner" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                }
                                remoteRow += '<span class="smalldbmText" id="ol_per_cell_local_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';
                                remoteRow += '<span class="smalldbmText" id="ol_per_cell_remote_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';
                                remoteRow += "</div>";
                            } else {
                                if (_.contains(rru_data.cres_list, filtered_cellresList[i].ResID))
                                {
                                    //everything is checked, go ahead and route the cellres to the remote
                                    checked_val = "checked='checked'";
                                    remoteRow += '<div id="' + filtered_cellresList[i].ResID + '_' + node_id + filtered_cellresList[i].SectorID + '_box" class="gridDiv '+activeOrNot+'">';
                                    if (MODE != "view") {
                                        if(num_of_options <2) {
                                            remoteRow += '&nbsp;';
                                        }
                                    }
                                    remoteRow += '<input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                    if (MODE === "view") {
                                        remoteRow += '" disabled="true"/>';
                                        remoteRow += '<span class="smalldbmText" id="per_cell_local_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';                        
                                        remoteRow += '<span class="smalldbmText" id="per_cell_remote_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';                                    
                                    } else {
                                        remoteRow += '"/>';
                                        if(num_of_options > 1){
                                            var confOption = null;
                                            for(var j = 0; j < rruSelectorsValues.length; j ++){
                                                var selector_tokens = rruSelectorsValues[j].split("|");
                                                var selector_name = selector_tokens[0];
                                                if (selector_name == 'slot_sel_' + filtered_cellresList[i].ResID + "_" + node_id ){
                                                    confOption = selector_tokens[1];
                                                }
                                            }
                                            if(confOption == null){
                                                for (var j= 0; j < routeList.length; j ++){
                                                    if((routeList[j].CellRes == filtered_cellresList[i].ResID) && 
                                                       (routeList[j].Destinations == node_id)){
                                                        if(routeList[j].Band != null){
                                                            confOption = filtered_cellresList[i].Band + "_" +routeList[j].Band;
                                                        }
                                                    }
                                                }
                                            }
                                            
                                            remoteRow += '<select onchange="set_save_button()" class="slot_select" id="slot_sel_'+filtered_cellresList[i].ResID+'_'+node_id+'" style="font-size:11px;width:10px !important; height:18px;min-width:34px;max-width:50px">';
                                            for(var options_count = 0; options_count < num_of_options; options_count ++){
                                                var selectedText = confOption == options[options_count] ? " selected" : "";
                                                var tokens = options[options_count].split("_");
                                                remoteRow += '<option' + selectedText +' value='+ tokens[1] +'>' + tokens[1] + ':' + tokens[0] + '</option>';
                                            }
                                            remoteRow += '</select>';
                                        }
                                    }
                                    remoteRow += "</div>";
                                }else {
                                    //console.log("place holder");
                                    remoteRow += '<div id="' + filtered_cellresList[i].ResID + '_' + node_id + filtered_cellresList[i].SectorID + '_box" class="gridDiv '+activeOrNot+'">';
                                    if (MODE != "view") {
                                        if(num_of_options <2) {
                                            remoteRow += '&nbsp;';
                                        }
                                    }
                                    remoteRow += '<input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                    if (MODE === "view") {
                                        remoteRow += '" disabled="true"/>';
                                        remoteRow += '<span class="smalldbmText" id="per_cell_local_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';
                                        remoteRow += '<span class="smalldbmText" id="per_cell_remote_'+filtered_cellresList[i].ResID+'_'+node_id+'"></span>';
                                    }
                                    else {
                                        remoteRow += '"/>';
                                        if(num_of_options > 1){
                                            var confOption = null;
                                            for(var j = 0; j < rruSelectorsValues.length; j ++){
                                                var selector_tokens = rruSelectorsValues[j].split("|");
                                                var selector_name = selector_tokens[0];
                                                if (selector_name == 'slot_sel_' + filtered_cellresList[i].ResID + "_" + node_id ){
                                                    confOption = selector_tokens[1];
                                                }
                                            }
                                            if(confOption == null){
                                                for (var j= 0; j < routeList.length; j ++){
                                                    if((routeList[j].CellRes == filtered_cellresList[i].ResID) && 
                                                       (routeList[j].Destinations == node_id)){
                                                        if(routeList[j].Band != null){
                                                            confOption = filtered_cellresList[i].Band + "_" +routeList[j].Band;
                                                        }
                                                    }
                                                }
                                            }
                                            
                                            remoteRow += '<select onchange="set_save_button()" class="slot_select" id="slot_sel_'+filtered_cellresList[i].ResID+'_'+node_id+'" style="font-size:11px;width:10px !important; height:18px;min-width:34px;max-width:50px">';
                                            for(var options_count = 0; options_count < num_of_options; options_count ++){
                                                var selectedText = confOption    == options[options_count] ? " selected" : "";
                                                var tokens = options[options_count].split("_");
                                                remoteRow += '<option' + selectedText +' value='+ tokens[1] +'>' + tokens[1] + ':' + tokens[0] + '</option>';
                                            }
                                            remoteRow += '</select>';
                                        }
                                    }
                                    remoteRow += "</div>";
                                }
                            }
                        }
                    }
                }
            }
            return remoteRow;
        }

        window.RenderNodeCollumns = RenderNodeCollumns;
        function RenderNodeCollumns(rru_data,zone_id)
        {
            var resp = '';
            var node_id = rru_data.rru_id;
            var nodeExist = false;

            if (conn.length == 0){
               nodeExist = true;
            }else{
               for(var k = 0; k < conn.length; k ++) 
               {
                  for(var m = 0; m < conn[k].nodes.length; m++) 
                  {
                     if (conn[k].nodes[m].ID == node_id)
                     {
                        nodeExist = true;
                        break;
                     }
                  }
                  if (nodeExist)
                     break;
               }
            }

            if (nodeExist)
               return ReRenderNodeColumn(node_id, zone_id);

            return resp;
        }

        window.RenderCheckboxes = RenderCheckboxes;
        function RenderCheckboxes()
        {
            var resp = '';
            var zoneToggle = 0;
            for(var z=0; z< zoneList.length; z++)
            {
                var kEnd = 1;
                if (conn.length > 0){
                  kEnd = conn.length;
                }
                for(var k = 0; k < kEnd; k ++) 
                {
                    if(zoneToggle > 1)
                       zoneToggle = 0;
                    var mEnd = 1;
                    if (conn.length > 0){
                       mEnd = conn[k].nodes.length;
                    }
                    for(var m = 0; m < mEnd; m++) 
                    {
                        for (var rruIndex = 0; rruIndex < zoneList[z].ZoneNodes.length; rruIndex++) {
                            var node_id = zoneList[z].ZoneNodes[rruIndex];
                            var zone_id = zoneList[z].ZoneID;
                            
                            if (conn.length > 0 && conn[k].nodes[m].ID != node_id)
                                continue;

                            if (_.findWhere(topologyList.nodes, {ID: zoneList[z].ZoneNodes[rruIndex]}) != undefined) {
                                tag = _.findWhere(topologyList.nodes, {ID: zoneList[z].ZoneNodes[rruIndex]}).Tag;
                            }
                            var rru_data = _.findWhere(filtered_rru_cellres, {"rru_id": node_id});
                            //console.log("rru_data.rru_id:",rru_data.rru_id , rru_data);
                            //check if rru is in incompatible frequency range with cell res\
                            resp += '<div id="remote_'+ rru_data.rru_id + '" class="rruCol ' + (zoneToggle ==0 ? "zoneCol1":"zoneCol2") +'">';
                            resp += RenderNodeCollumns(rru_data,zone_id);
                            resp += '</div>'
                        }
                    }
                    zoneToggle ++;
                }
            }
            return resp;
        }
        
        /************************** all parse functions **************************/

        window.ParseZoneData = ParseZoneData;
        function ParseZoneData(o)
        {
            zoneList=[];
            var zone_data = o.ajaxdata.split("\n").map($.trim).filter(function(line) { return line != "" });
            //removes the uncommisioned zone
            for(var i=0; i<zone_data.length; i++ )
            {
                var zoneName = zone_data[i].substring(zone_data[i].indexOf('"')+1,zone_data[i].lastIndexOf('"'));
                var zoneid_data = zone_data[i].split(/\s+/);
                var zoneid = zoneid_data[1].replace(":","");
                var zoneNodeList = (zone_data[i].substring(zone_data[i].lastIndexOf('"')+2, zone_data[i].length)).split(" ");
                if(zoneNodeList[0] != "")
                {
                    for(var zn =0; zn < zoneNodeList.length; ++zn)
                    {
                        if(!_.findWhere(filtered_rru_cellres,{rru_id:zoneNodeList[zn]}))
                        {
                            filtered_rru_cellres.push({rru_id:zoneNodeList[zn],cres_list:[],conflict_list:[],mimo_conflict_list:[],incompatible_quota_list:[],incompatible_cellres_list:[], bundleList: []});
                            original_rru_cellres.push({rru_id:zoneNodeList[zn],cres_list:[],conflict_list:[],mimo_conflict_list:[],incompatible_quota_list:[],incompatible_cellres_list:[], bundleList: []});
                        }
                    }
                    if(filtered_zone.length == 0){
                        zoneList.push({ZoneNodes:zoneNodeList, ZoneID:zoneid, ZoneName:zoneName, ZoneExpanded:false});
                    }else{
                        for(var j = 0; j < filtered_zone.length; j++){
                           if(filtered_zone[j] == zoneid){
                              zoneList.push({ZoneNodes:zoneNodeList, ZoneID:zoneid, ZoneName:zoneName, ZoneExpanded:false});
                           }
                        }
                    }
                }
            }
            refreshZoneList(zoneList);
        }

        window.ParseRoutes = ParseRoutes;
        function ParseRoutes(routeList)
        {
            for(var i=0; i< routeList.length; i++)
            {
                var destinations=routeList[i].Destinations.split(" ");
                for(var x =0; x< destinations.length; x++)
                {
                    var routing_data =_.findWhere(filtered_rru_cellres,{rru_id:destinations[x]});
                    var cres = routeList[i].CellRes;
                    _.extend(cres,{valid:true, reason:""});
                    if(routing_data)
                    {
                        //the rru exists in the list
                        routing_data.cres_list.push(cres);
                        routing_data.cres_list= _.uniq(routing_data.cres_list);
                        routing_data.conflict_list = _.pluck(GetConflicts(routing_data.rru_id),"ResID");
                        //_.pluck(_.findWhere(conflicting_cell_res,{ResID:cres}).Conflicts,"ResID");
                    }
                    else
                    {
                        //the rru does not exist lets add it
                        if(destinations[x] != "")
                        {
                            console.log("parse route")
                            console.log(_.findWhere(conflicting_cell_res,{ResID:cres}))
                            if(_.findWhere(conflicting_cell_res,{ResID:cres}) !=undefined) {
                                filtered_rru_cellres.push({rru_id: destinations[x], cres_list: [cres], conflict_list: [_.pluck(_.findWhere(conflicting_cell_res, {ResID: cres}).Conflicts, "ResID")], mimo_conflict_list:[], incompatible_quota_list: [], incompatible_cpri_list: [], incompatible_cellres_list: [], bundleList: []});
                                original_rru_cellres.push({rru_id: destinations[x], cres_list: [cres], conflict_list: [_.pluck(_.findWhere(conflicting_cell_res, {ResID: cres}).Conflicts, "ResID")], mimo_conflict_list:[],incompatible_quota_list: [], incompatible_cpri_list: [], incompatible_cellres_list: [], bundleList: []});
                            }else{
                                filtered_rru_cellres.push({rru_id: destinations[x], cres_list: [cres], conflict_list: [], mimo_conflict_list:[], incompatible_quota_list: [], incompatible_cpri_list: [], incompatible_cellres_list: [], bundleList: []});
                                original_rru_cellres.push({rru_id: destinations[x], cres_list: [cres], conflict_list: [], mimo_conflict_list:[], incompatible_quota_list: [], incompatible_cpri_list: [], incompatible_cellres_list: [], bundleList: []});
                            }
                        }
                    }
                }
            }
            var xxx = -1;
        }

        window.parseBundleGroup = parseBundleGroup;
        function parseBundleGroup(BUNDLEGROUP){
            //add BundleGroup to bundleList array
            $.each(BUNDLEGROUP,function(key,value){
            bundleList[key.groupid]=value; // system groups
              //loop over node list and update bundle ID
                if(value.nodes.length>1) {

                    var rruTmp = [];
                    for(var i =0; i < value.nodes.length;i++) {
                      
                      if(_.findWhere(filtered_rru_cellres, {rru_id: value.nodes[i].ID}))

                        rruBundleList[value.nodes[i].ID] = value.groupid; // rru of system group

                        rruTmp.push(value.nodes[i].ID);
                        //console.log(_.findWhere(filtered_rru_cellres, {rru_id: value.nodes[i].ID}).bundleID);
                    }

                  for(var i =0; i < value.nodes.length;i++) {
                       //console.log(rruTmp);
                        rruTmp1 = rruTmp.slice(0);
                        rruTmp1.splice( i, 1 );
                        //console.log(rruTmp1);
                        if(_.findWhere(filtered_rru_cellres, {rru_id: value.nodes[i].ID}) !=undefined) 
                           _.findWhere(filtered_rru_cellres, {rru_id: value.nodes[i].ID}).bundleList = rruTmp1;
                        //console.log("value.nodes[i]",_.findWhere(filtered_rru_cellres, {rru_id: value.nodes[i].ID}));
                    }
                }
            })
        }

        window.parseMIMOBuddy = parseMIMOBuddy;
        //function disabled
        function parseMIMOBuddy(o){
            //add mimo conflicted rru to rru array
            $.each(o.ajaxdata.BUNDLEGROUP,function(key,value){
                if(value.nodes.length>1) {
                    for(var i =0; i< value.nodes.length;i++) {
                        if(i !=value.nodes.length-1) {
                            _.findWhere(filtered_rru_cellres, {rru_id: value.nodes[i].ID}).mimo_buddy = value.nodes[i + 1].ID;
                        }else {
                            _.findWhere(filtered_rru_cellres, {rru_id: value.nodes[i].ID}).mimo_buddy = value.nodes[0].ID;
                        }
                    }
                    //go through mimobuddy list, add mimo conflict cellres in to  mimo_conflict_list
                    $.each(value.nodes,function(i, node){
                        if(_.findWhere(filtered_rru_cellres, {rru_id: node.ID}) !=undefined) {
                            var buddyNodeID = _.findWhere(filtered_rru_cellres, {rru_id: node.ID}).mimo_buddy;
                            var cresListOfBuddyNode = _.findWhere(filtered_rru_cellres, {rru_id: buddyNodeID}).cres_list;
                            _.findWhere(filtered_rru_cellres, {rru_id: node.ID}).mimo_conflict_list = cresListOfBuddyNode;
                        }
                    })
                }
            })
        }

        window.parseCPRIQuota = parseCPRIQuota;
        function parseCPRIQuota(connectionList){
            //add allocated filter quota and used filter quota to each rru
            $.each(connectionList,function(key,conn){
                $.each(filtered_rru_cellres,function(i, rru){
                    if(conn["Node Y"].indexOf(rru["rru_id"]) !=-1){
                       // _.extend(rru,{"alloc_CPRI_capacity":conn.UserLinkCap},{"used_CPRI_capacity":conn.UserAllocCap});
                        _.extend(rru,{"alloc_CPRI_capacity":conn.UserLinkCap},{"used_CPRI_capacity":0}); //set to 0 as initialization
                    }else if(conn["Node X"].indexOf(rru["rru_id"]) !=-1 && conn["Node Y"].indexOf("MSDH") !=-1){ //in case the connection order is switched
                       // _.extend(rru,{"alloc_CPRI_capacity":conn.UserLinkCap},{"used_CPRI_capacity":conn.UserAllocCap});
                        _.extend(rru,{"alloc_CPRI_capacity":conn.UserLinkCap},{"used_CPRI_capacity":0});//set to 0 as initialization
                    }
                })
            })
        }

        window.parseFilterQuota = parseFilterQuota;
        function parseFilterQuota(allocated,used){
            //add allocated filter quota and used filter quota to each rru
            $.each(allocated.ajaxdata.FILTERQUOTA,function(key,value){
                _.findWhere(filtered_rru_cellres,{rru_id:value.Node}).allocated_filter_quota = value.Quota;
            })
            $.each(used.ajaxdata.FILTERQUOTA,function(key,value){
                //this if is to avoid refreshing of used_filter_quota when user refilters cellresources while some of the route have been checked
                if(_.findWhere(filtered_rru_cellres,{rru_id:value.Node}).used_filter_quota === undefined) {
                    //_.findWhere(filtered_rru_cellres, {rru_id: value.Node}).used_filter_quota = value.Quota;
                    _.findWhere(filtered_rru_cellres, {rru_id: value.Node}).used_filter_quota = 0;//set to 0 as initialization
                }
            })
        }

        window.parseRFRangesConflict = parseRFRangesConflict;
        function parseRFRangesConflict(rfrangeList){
            //add rfrange conflict cellres to each rru
            $.each(rfrangeList,function(index, rru){
                if(rru.NodeType.indexOf("RRU")!=-1) {
                    var compatible_cellres_list = [];
                    $.each(rru.Ranges, function (i, range) {
                        $.each(filtered_cellresList, function (key, cellres) {
                            if (range.LowerDL <= cellres.StartDL && range.UpperDL >= cellres.StopDL) {
                                compatible_cellres_list.push(cellres.ResID);
                            }
                        })
                    })
                    _.findWhere(filtered_rru_cellres, {rru_id: rru.ID}).incompatible_cellres_list = _.difference(_.pluck(filtered_cellresList,"ResID"),compatible_cellres_list);
                }
            })
        }

        window.parseSectorToMTDI = parseSectorToMTDI;
        function parseSectorToMTDI(connectionList){
            //allocated sector to MTDI
            $.each(connectionList,function(key,conn){
            sectorToMTDIList[conn.conn[0].From]= conn.conn[0].To.split(":")[0];
            //console.log(sectorToMTDIList);
            })
        }
