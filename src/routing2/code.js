require([ '/js/api.js', '/js/lib/d3.min.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js', '/js/util.js','/js/lib/handlebars.js','/js/handlebars-helpers.js','/js/lib/jquery-ui.js','/js/lib/chosen.jquery.min.js'],
    function (api, d3, convert, console, _, $,util) {
        var params = getUrlParams ();
        var PROFILENAME = params.profile;
        var MODE = $.cookie('mode');
        var OPERATOR = $.cookie('currentOperator');
        var lowCapacityConnectionColor ="#00b300";
        var mediumCapacityConnectionColor ="#e6e600";
        var highCapacityConnectionColor ="#cc0000";
        var user_last_active = new Date();
        var filtered_cellresList = [];
        var filtered_rru_cellres = [];
        var original_cres_list = [];
        var original_rru_cellres = [];
        var original_bands = [];
        var routeList=[];
        var zoneList = [];
        var conflicting_cell_res = [];
        var timeoutTime = 5000;
        var expand_all = false;
        var registeredRfrangeList=[];
        var isChanged = false;
        var rfquotaList=[];
        var rfNominalList=[];
        var originalRFOffset =[];
        var rfCellresLevelPerRemote = [];
        var default_operator_rf_quotas =[];
        var rruMinPowerLevel=0;
        var rruMaxPowerLevel = 100;
        var rruMinALCNominalPowerLevel=-10;
        var rruMaxALCNominalPowerLevel = 10;
        var rruMinGainNominalPowerLevel=-20;
        var rruMaxGainNominalPowerLevel = 10;
        var cellresMinALCPowerLevel = 0;
        var cellresMaxALCPowerLevel =100;
        var cellresMinGainPowerLevel = -10;
        var cellresMaxGainPowerLevel =0;
        var sectorList = [];
        var showGainMgmtBtn = true;

        function ShowTimeOutWarningAndReturn()
        {
            //axellPopUp();
            //poll for the unlock
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

        function MakeALockRequest()
        {
            api.exe({
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
            });
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
                            console.log(conflicting_cell_res)
                        }
                    }
                }
            }
        }

        function ParseZoneData(o)
        {
            zoneList=[];
            var zone_data = o.ajaxdata.split("\n").map($.trim).filter(function(line) { return line != "" });
            //removes the uncommisioned zone
            //zone_data.shift();
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
                            filtered_rru_cellres.push({rru_id:zoneNodeList[zn],cres_list:[],conflict_list:[],mimo_conflict_list:[],incompatible_quota_list:[],incompatible_cellres_list:[]});
                            original_rru_cellres.push({rru_id:zoneNodeList[zn],cres_list:[],conflict_list:[],mimo_conflict_list:[],incompatible_quota_list:[],incompatible_cellres_list:[]});
                        }
                    }
                    zoneList.push({ZoneNodes:zoneNodeList, ZoneID:zoneid, ZoneName:zoneName, ZoneExpanded:false});
                }
            }
        }

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
                            console.log(conflicting_cell_res,{ResID:cres});
                            filtered_rru_cellres.push({rru_id:destinations[x],cres_list:[cres],conflict_list:[_.pluck(_.findWhere(conflicting_cell_res,{ResID:cres}).Conflicts,"ResID")],incompatible_quota_list:[],incompatible_cpri_list:[],incompatible_cellres_list:[]});
                            original_rru_cellres.push({rru_id:destinations[x],cres_list:[cres],conflict_list:[_.pluck(_.findWhere(conflicting_cell_res,{ResID:cres}).Conflicts,"ResID")],incompatible_quota_list:[],incompatible_cpri_list:[],incompatible_cellres_list:[]});
                        }
                    }
                }
            }
            var xxx = -1;
        }

        function parseMIMOBuddy(o){
            //add mimo conflicted rru to rru array
            console.log(filtered_cellresList)
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

        function GenerateDefaultViewHtml()
        {
            //ObjectsToBeFiltered(selected_band,selected_sector,selected_tech);
            var html_to_render = RenderTableHtml();
            $('#routing_table').empty();
            $('#routing_table').html(html_to_render);
            setCapacity();

            //cheating way to fix the max width of the first two row, add an empty column after the last column populated
            $('#routing_table').find('tr').each(function(){
                $(this).find('th:last-child').after('<th></th>');
                $(this).find('td:last-child').after('<td></td>');
            });
            $('#start_filter').dialog('close');
            //make alternate color for table header
            $("#routing_table tr.zone_header:even").addClass('odd');
            $("#routing_table tr.zone_header:odd").addClass('even');
        }


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

        /*function ReRenderNodeRow(node_id,zone_id)
        {
            //loop all cell res and reset each checkbox for the node_id
            var tag="";
            if(_.findWhere(topologyList.nodes,{ID:node_id}) != undefined){
                tag = _.findWhere(topologyList.nodes,{ID:node_id}).Tag;
            }
            var rru_data = _.findWhere(filtered_rru_cellres,{"rru_id":node_id});

            //if remote has mimo buddy, add in icon next to remotes
            if (rru_data.mimo_buddy != undefined) {
                //if flag show gain management btn is true, then show the btn
                if(!showGainMgmtBtn) {
                    var remoteRow ='<div > '+node_id+' - '+ tag +' <div id = "'+node_id+'_mimo_buddy" mimo_buddy = "'+_.findWhere(filtered_rru_cellres, {'rru_id':node_id}).mimo_buddy+'" class="icon mimo_buddy" title="MIMO partner pair with '+_.findWhere(filtered_rru_cellres, {'rru_id':node_id}).mimo_buddy+'"></div></div>' +
                    '<div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_'+node_id+'" class="cpri_progress_indicator"></div></div>' +
                    '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_'+node_id+'" class="dsp_progress_indicator"></div></div></div>';
                }else {
                    var remoteRow = '<div > ' + node_id + ' - ' + tag + ' <div class="more_details icon" data-nodeid="' + node_id + '" title="More settings"></div> <div id = "' + node_id + '_mimo_buddy" mimo_buddy = "' + _.findWhere(filtered_rru_cellres, {'rru_id': node_id}).mimo_buddy + '" class="icon mimo_buddy" title="MIMO partner pair with ' + _.findWhere(filtered_rru_cellres, {'rru_id': node_id}).mimo_buddy + '"></div></div>' +
                        '<div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_' + node_id + '" class="cpri_progress_indicator"></div></div>' +
                        '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_' + node_id + '" class="dsp_progress_indicator"></div></div></div>';
                }
            }else{
                //if flag show gain management btn is true, then show the btn
                if(!showGainMgmtBtn) {
                    var remoteRow ='<div >'+node_id+' - '+ tag +' </div><div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_'+node_id+'" class="cpri_progress_indicator"></div></div>' +
                    '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_'+node_id+'" class="dsp_progress_indicator"></div></div></div>';
                }else {
                    var remoteRow = '<div >' + node_id + ' - ' + tag + ' <div class="more_details icon setting" data-nodeid="' + node_id + '" title="More settings"></div><div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_' + node_id + '" class="cpri_progress_indicator"></div></div>' +
                        '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_' + node_id + '" class="dsp_progress_indicator"></div></div></div>';
                }
            }

            if(rru_data)
            {
                for(var i=0; i<filtered_cellresList.length; ++i) {
                    var checked_val = "";
                    //check if cell resource is in incompatible in frequency range with rru
                    //if yes, block the checkbox
                    if (_.contains(rru_data.incompatible_cellres_list, filtered_cellresList[i].ResID)) {
                        remoteRow += '<div> <div class="icon rf-conflict" title="Incompatible radio frequency range with remote ' + node_id + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                        remoteRow += '</div>';
                    }
                    //check if remote has any filter quota and cpri quota
                    else if(rru_data.alloc_CPRI_capacity == 0 && rru_data.allocated_filter_quota != 0){
                        remoteRow += '<div><div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                        remoteRow += '</div>';
                    }else if(rru_data.allocated_filter_quota == 0 && rru_data.alloc_CPRI_capacity != 0){
                        remoteRow += '<div><div class="icon dsp-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + ' zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                        remoteRow += '</div>';
                    }else if(rru_data.allocated_filter_quota == 0 && rru_data.alloc_CPRI_capacity == 0){
                        remoteRow += '<div>' +
                            '<div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + ' node-id="' + node_id +'" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>'+
                            '<div class="icon dsp-over-capacity" title="Insufficient filter quota for remote ' + node_id + ' node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>';
                    }else {
                        //if route to one of the mimo enabled remote -->block routing to the other mimo remote
                        //if yes block cell res
                        if (_.contains(rru_data.mimo_conflict_list, filtered_cellresList[i].ResID)) {
                            //console.log("contain in mimo conflict list");
                            checked_val = "checked='checked'";
                            remoteRow += '<div><div class="icon mimo-conflict" title="Cell resource is routed to MIMO partner ' + rru_data.mimo_buddy + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID +'"></div>';
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
                                    remoteRow += '<div><div class="icon overlap-conflict" title="Frequency overlaps with ' + matches[0] + '" node-id="' + node_id + ' zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>"';
                                } else {
                                    remoteRow += '<div><div class="icon overlap-conflict" title="Frequency overlaps with MIMO partner" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>"';
                                }
                            } else {
                                //check if there's over capacity for filter quota and cpri
                                if (_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && !_.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)) {
                                    remoteRow += '<div><div class="icon dsp-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + ' zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                    remoteRow += '</div>';
                                } else if (!_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && _.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)) {
                                    remoteRow += '<div><div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                    remoteRow += '</div>';
                                }else if(_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && _.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)){
                                    remoteRow += '<div>' +
                                        '<div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + ' node-id="' + node_id +'" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>'+
                                        '<div class="icon dsp-over-capacity" title="Insufficient filter quota for remote ' + node_id + ' node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>';

                                }else if (_.contains(rru_data.cres_list, filtered_cellresList[i].ResID))
                                {
                                    //everything is checked, go ahead and route the cellres to the remote
                                    checked_val = "checked='checked'";
                                    remoteRow += '<div><input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                    if (MODE === "view") {
                                        remoteRow += '" disabled="true"/></div>';
                                    }
                                    else {
                                        remoteRow += '"/></div>';
                                    }
                                }else {
                                    //console.log("place holder");
                                    remoteRow += '<div><input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                    if (MODE === "view") {
                                        remoteRow += '" disabled="true"/></div>';
                                    }
                                    else {
                                        remoteRow += '"/></div>';
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return remoteRow;
        }*/

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




        function ReRenderZoneRow(zone_id)
        {
            var zone_nodes = _.findWhere(zoneList,{ZoneID:zone_id});
            //console.log(zone_nodes);
            var zoneRow = '<div><div class="icon minmaxbutton ';
            if(zone_nodes.ZoneExpanded)
            {
                zoneRow += "minimize";
            }
            else
            {
                zoneRow += "maximize";
            }
            zoneRow += '"></div><span>'+zone_nodes.ZoneName+'</span></div>' +
            '<div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_'+zone_nodes.ZoneID+'" class="cpri_progress_indicator"></div></div>' +
                '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_'+zone_nodes.ZoneID+'" class="dsp_progress_indicator"></div></div></div>';
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
                        zoneList
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

                zoneRow += '<div><input id="'+filtered_cellresList[i].ResID+'_'+zone_nodes.ZoneID+'" type="checkbox" '+summary_check+' zone-id ="'+zone_nodes.ZoneID+'" cellres-id ="'+filtered_cellresList[i].ResID+'" class="zone_checkbox"';
                if(MODE ==="view"){
                    zoneRow += ' disabled="true"/></div>';
                }
                else
                {
                    zoneRow += '/></div>';
                }

            }

            zoneRow += '</div>';

            return zoneRow;
        }

        function RenderCresHeadings()
        {
            var resp = "<div class='rotate'><b><span>Cell Resource Tag</span></b><!--<div class='icon number'></div>--></div>";

            return resp;
        }

        function RenderCresRows()
        {
            var zone_id = 0;
            var resp = "";
            for(var i =0; i< filtered_cellresList.length; i++)
            {
                resp += "<div class='cellResRow' title='"+filtered_cellresList[i].Tag+"\nRange: " + convert.hz2mhz(filtered_cellresList[i].StartDL) + "MHz - " + convert.hz2mhz(filtered_cellresList[i].StopDL)+"MHz' style='height:"+rowHeight+"'><span>"+filtered_cellresList[i].Tag+"</span>";
                if(filtered_cellresList[i].MIMO === "A,B"){
                    resp += filtered_cellresList[i].ResID.substring(filtered_cellresList[i].ResID.indexOf("_")+1,filtered_cellresList[i].ResID.length)+"<br/><div class='icon mimo' title='MIMO Cell Resource Input "+filtered_cellresList[i].MIMO+"'></div></div>";
                }else{
                    //resp += filtered_cellresList[i].ResID.substring(filtered_cellresList[i].ResID.indexOf("_")+1,filtered_cellresList[i].ResID.length)+"</div>";
                    resp += "</div>";
                }


            }
            return resp;
        }

        function RenderCresFreqHeadings()
        {
            var resp = "<div class='rotate'>Band/ Technology</div>";


            return resp;
        }

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

        function RenderCresSectorHeadings()
        {
            var resp = "<div class='rotate'>BTS port <div class='icon number'></div></div>";

            return resp;
        }

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

        function RenderCresSelectionHeadings()
        {
            return "<div class='rotate'> <b> <span>Select All</span></b></div>";
        }

        function RenderCresSelectionRows()
        {
            var resp = "";
            for( var i=0; i<filtered_cellresList.length; i++ )
            {
                resp += RenderSingleCres(filtered_cellresList[i].ResID);
            }

            return resp;
        }

        function RenderTableHtml()
        {
            var resp = '';
            //ObjectsToBeFiltered(selected_band,selected_sector,selected_tech);
            checked_val = '';
            //RenderLayout();
            var zonesAndNodes = RenderZonesAndRRUHeadings();
            $('#routingZoneNames').append(zonesAndNodes.zones);
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
            /*$('.routingZoneRRUHeading').height();*/

            //refreshTable();
            /*resp += ;
            resp += RenderCresFreqHeadings();
            resp += RenderCresSectorHeadings();
            resp += "<tr id='cres_selections'>"
            resp += RenderCresSelections();
            resp +="</tr>";


            for( var l=0; l < zoneList.length; ++l)
            {
                //to handle very weird case --> probably bug in humungosaur
                //nodes found in zone list but not found in topology list
                var nodeExist=true;
                for(var k=0; k < zoneList[l].ZoneNodes.length; k++) {
                    if(_.findWhere(topologyList.nodes, {"ID": zoneList[l].ZoneNodes[k]}) === undefined){
                        nodeExist =false;
                    }else{
                        nodeExist =true;
                    }
                }
                if(nodeExist){
                    var zoneRow = '<tr id="zone_'+zoneList[l].ZoneID+'" class="zone_header">';
                    zoneRow += ReRenderZoneRow(zoneList[l].ZoneID);
                    resp+=zoneRow;
                    for(var k=0; k < zoneList[l].ZoneNodes.length; k++)
                    {
                        remoteRow ='<tr id="tr_'+zoneList[l].ZoneNodes[k]+'" style="display:none;" >';
                        //'<td >'+zoneList[l].ZoneNodes[k]+' - '+ _.findWhere(topologyList.nodes,{ID:zoneList[l].ZoneNodes[k]}).Tag+'</td><td><div id ="capacity_indicator_'+zoneList[l].ZoneNodes[k]+'" class="progress_indicator"></div></td>';
                        var row_html = ReRenderNodeRow(zoneList[l].ZoneNodes[k],zoneList[l].ZoneID);
                        remoteRow+= row_html;
                        remoteRow += '</tr>';
                        resp += remoteRow;
                    }
                }

            }*/
            return resp;
        }

        /*function CalculateNodeCapacity(node_id)
        {
            var node_link_cap = 0;
            var alloc_cap_count = 0;

            var usuage = -1;
            var node_data = _.findWhere(filtered_rru_cellres,{rru_id:node_id});
            if(node_data)
            {
                for(var i=0; i< node_data.cres_list; i++)
                {
                    usuage += _.findWhere(filtered_cellresList,node_data.cres_list[i]).LinkCap;
                }
            }

            return usuage;
        }*/

        function confirmExit()
        {
            return "You have attempted to leave this page.  If you have made any changes to the fields without clicking the Save button, your changes will be lost.  Are you sure you want to exit this page?";
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

            progressbar.progressbar( "option", {
                value: Math.floor( value )
            });
            $(selector).prop('title', 'Usage: '+Math.floor( value )+'%');
        }

        function setCapacity(){
            //$('.capacity_indicator').empty();
            $('.dsp_progress_indicator').progressbar({
                value: false
            });
            $('.cpri_progress_indicator').progressbar({
                value: false
            });
            var arry_of_node_capacitys = [];
            var arry_of_node_quotas = [];
            for(var i=0; i< filtered_rru_cellres.length; i++ )
            {
                //set cpri indicator
                var capacity_selector = "#capacity_indicator_"+filtered_rru_cellres[i].rru_id;
                var node_link_cap = 0;
                //var filtered_cell_res = _.where(routing_objs[i].CellResNodes,{CresNode:routing_objs[i].ZoneNodes[l]});
                for(var g =0; g< filtered_rru_cellres[i].cres_list.length; g++)
                {
                    if(!_.contains(filtered_rru_cellres[i].mimo_conflict_list,filtered_rru_cellres[i].cres_list[g])){
                        if(_.findWhere(filtered_cellresList,{ResID:filtered_rru_cellres[i].cres_list[g]}) !=undefined){
                            node_link_cap += parseInt(_.findWhere(filtered_cellresList,{ResID:filtered_rru_cellres[i].cres_list[g]}).LinkCap);
                        }
                    }
                }
                //calculate capacity for rru in bundle group
                for(var h =0; h< filtered_rru_cellres[i].mimo_conflict_list.length; h++)
                {
                    if(!_.contains(filtered_rru_cellres[i].cres_list,filtered_rru_cellres[i].cres_list[h])) {
                        if (_.findWhere(filtered_cellresList, {ResID: filtered_rru_cellres[i].mimo_conflict_list[h]}) != undefined) {
                            node_link_cap += parseInt(_.findWhere(filtered_cellresList, {ResID: filtered_rru_cellres[i].mimo_conflict_list[h]}).LinkCap);
                        }
                    }
                }
                var node_capa = filtered_rru_cellres[i].alloc_CPRI_capacity? ((node_link_cap / filtered_rru_cellres[i].alloc_CPRI_capacity) *100) : 0;
                //update used cpri cap based on cellres list routed to certain rru
                _.findWhere(filtered_rru_cellres,{rru_id:filtered_rru_cellres[i].rru_id}).used_CPRI_capacity = node_link_cap;
                arry_of_node_capacitys.push({rru_id:filtered_rru_cellres[i].rru_id, node_cap:node_capa});
                //console.log(filtered_rru_cellres)
                SetProgBarVal(capacity_selector,node_capa);

                //set dsp indicator
                var dsp_capacity_selector = "#dsp_capacity_indicator_"+filtered_rru_cellres[i].rru_id;
                var node_filter_quota = 0;
                //var filtered_cell_res = _.where(routing_objs[i].CellResNodes,{CresNode:routing_objs[i].ZoneNodes[l]});
                for(var g =0; g< filtered_rru_cellres[i].cres_list.length; g++)
                {
                    if(!_.contains(filtered_rru_cellres[i].mimo_conflict_list,filtered_rru_cellres[i].cres_list[g])){
                        if(_.findWhere(filtered_cellresList,{ResID:filtered_rru_cellres[i].cres_list[g]}) !=undefined){
                            node_filter_quota += parseInt(_.findWhere(filtered_cellresList,{ResID:filtered_rru_cellres[i].cres_list[g]}).FilterQuota);
                        }
                    }
                }
                //calculate capacity for rru in bundle group
                for(var h =0; h< filtered_rru_cellres[i].mimo_conflict_list.length; h++)
                {
                    if(!_.contains(filtered_rru_cellres[i].cres_list,filtered_rru_cellres[i].cres_list[h])) {
                        if (_.findWhere(filtered_cellresList, {ResID: filtered_rru_cellres[i].mimo_conflict_list[h]}) != undefined) {
                            node_filter_quota += parseInt(_.findWhere(filtered_cellresList, {ResID: filtered_rru_cellres[i].mimo_conflict_list[h]}).FilterQuota);
                        }
                    }
                }
                var node_quota = filtered_rru_cellres[i].allocated_filter_quota? ((node_filter_quota / filtered_rru_cellres[i].allocated_filter_quota) *100) : 0;
                //update used cpri cap based on cellres list routed to certain rru
                _.findWhere(filtered_rru_cellres,{rru_id:filtered_rru_cellres[i].rru_id}).used_filter_quota = node_filter_quota;
                arry_of_node_quotas.push({rru_id:filtered_rru_cellres[i].rru_id, node_quota:node_quota});
                SetProgBarVal(dsp_capacity_selector,node_quota);
            }

            for(var b=0;b<zoneList.length; b++)
            {
                //set zone's cpri indicator
                var arry_node_data = _.filter(arry_of_node_capacitys,function(node_cap_data)
                {
                    if(_.contains(zoneList[b].ZoneNodes,node_cap_data.rru_id))
                    {
                        return node_cap_data;
                    }
                });
                var max_arry_node_data = _.max(_.pluck(arry_node_data,'node_cap'));
                var zone_selector = "#capacity_indicator_"+zoneList[b].ZoneID;
                SetProgBarVal(zone_selector,max_arry_node_data);

                //set zone's dsp indicator
                var arry_node_dsp_data = _.filter(arry_of_node_quotas,function(node_quota_data)
                {
                    if(_.contains(zoneList[b].ZoneNodes,node_quota_data.rru_id))
                    {
                        return node_quota_data;
                    }
                });
                var max_arry_node_dsp_data = _.max(_.pluck(arry_node_dsp_data,'node_quota'));
                var dsp_zone_selector = "#dsp_capacity_indicator_"+zoneList[b].ZoneID;
                SetProgBarVal(dsp_zone_selector,max_arry_node_dsp_data);
                for(var x=0; x < filtered_cellresList.length; x++)
                {
                    var zone_indeterminate = "#"+filtered_cellresList[x].ResID+"_"+zoneList[b].ZoneID;
                    if($(zone_indeterminate).data('indeterminate'))
                    {
                        $(zone_indeterminate).prop("indeterminate", true);
                    }
                }
            }
        }

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
        /* filtering functions*/
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

            $('#num_of_selected_sector').parent().hide();
            $('#num_of_selected_cellres').parent().hide();

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
                    if(MODE==="view")
                    {
                        $('#tag').prop('disabled', true);
                    }
                    //originalRFOffset = e.ajaxdata.RFOffsets;
                    //rfCellresLevelPerRemote = e.ajaxdata.RFOffsets;
                }
            });

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
                if(filtered_cellresList.length>0) {
                    $('#displayed_record').text(Number(filtered_cellresList.length));
                    $('#start_filter').dialog('open');
                    loadPages();
                    $("#filter_settings").hide();
                }
            })

            /* TODO filtering remote and zone
            //get remote ID and tag list
            api.exe({
                cmd:'topology -o '+OPERATOR+' --json',
                dataType:'json',
                onSuccess:function(e){
                    var remoteList=[];
                    var remoteNodes = _.filter(e.ajaxdata.nodes,function(node){
                        if(node["Node Type"].indexOf("RRU") !=-1){
                            return node;
                        }
                    })
                    $.each(remoteNodes,function(key, value){
                        remoteList.push(value.ID+" - "+value.Location);
                    })
                    $( "#remote" ).autocomplete({
                        source: remoteList,
                        select: function( event, ui ) {
                            $('#remote_selected_list').append("<li class='selected_list'>"+ui.item.value.substring(0,ui.item.value.indexOf("-")-1)+"<div class='icon error'></div></li>")
                            ui.item.value ="";
                        }
                    });
                }
            });
            //get zone list
            api.exe({
                cmd:"zone -o "+OPERATOR+" list --nodes",
                onSuccess:function(o){
                    var zone_data = o.ajaxdata.split("\n").map($.trim).filter(function(line) { return line != "" });
                    //removes the uncommisioned zone
                    zone_data.shift();
                    var zoneList=[];
                    for(var i=0; i<zone_data.length; i++ )
                    {
                        zoneList.push(zone_data[i].substring(zone_data[i].indexOf('"')+1,zone_data[i].lastIndexOf('"')));
                    }
                    $( "#zone" ).autocomplete({
                        source: zoneList,
                        select: function( event, ui ) {
                            $('#zone_selected_list').append("<li class='selected_list'>"+ui.item.value+"<div class='icon error'></div></li>")
                            ui.item.value ="";
                        }
                    });
                }
            })
            */
            $("#filter_settings").show();
        }
        /*end of filtering functions*/


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


        $( document ).ready(function() {
            $('#save').addClass('disabled');
            if(MODE == "view")
            {
                $('#save').hide();
                $('#delete').hide();
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

            //click event on more details of each remotes
            $(document).on('click','.more_details',function(){
                var $this = $(this);
                var node_rfquota_list = _.where(rfquotaList,{"Node":$this.attr('nodeid')});
                var dialogIsChanged = false;
                //set up popup window for rf power level
                $('#rf_power_level').dialog({
                    modal: true,
                    bgiframe: true,
                    width: 950,
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
                                //save the rfoffset that users play with before saving
                                $.each(originalRFOffset,function(i, value){
                                    rfCellresLevelPerRemote.push({"CellRes": value.CellRes, "Destinations": value.Destinations, "Band": _.findWhere(filtered_cellresList,{"ResID":value.CellRes}).Band,"ALCOffset":value.ALCOffset , "ULGainOffset": value.ULGainOffset});
                                })
                                rfCellresLevelPerRemote = rfCellresLevelPerRemote.uniqueObjects();
                            }
                        });

                        $(".ui-dialog-buttonpane button:contains('Save')").button("disable",true);
                        $(".ui-dialog-buttonpane button:contains('Reset')").button("disable",true);
                        $('#rf_power_level').empty();
                        var html='<table id="rf_power_table" class="type4">';
                        html+='<tr><th colspan="'+Number(node_rfquota_list.length+2)+'" class="rf_power_table_header"><div class="icon remote"></div> idRemote '+$this.attr('nodeid')+'</th></tr>';
                        html+='<tr><th colspan="2"></th>';
                        $.each(node_rfquota_list, function (k, quota) {
                            html += '<th><div class="icon freq-range"></div>' + quota.Band + '<div class="unused_alc_allocation"><div class="icon unused" title="Unused Output Power"></div> <span id="unused_alc_percentage_'+quota.Band+'" band="'+quota.Band+'"></span></div></th>'
                        })
                        //display Power Level quota per band relative
                        /*
                        html+='</tr><tr><th>Power Quota</th>';
                        $.each(node_rfquota_list, function (k, quota) {
                            html += '<th><div id="rru_default_'+quota.Band+'" band="'+quota.Band+'" nodeid="'+$this.attr('nodeid')+'" class="rru_default_slider"></div>' +
                                '<input id="rru_default_input_'+quota.Band+'" class="rru_default_input" type="text"/> dBm</th>';
                        })
                        html += '</tr>';
                        */
                        //display nominal Power Level quota per band
                        /*
                        html+='<tr><th>Nominal Power Level</th>';
                        $.each(rfNominalList, function (k, nominalquota) {
                            $.each(node_rfquota_list, function (k, quota) {
                                if (nominalquota.Band === quota.Band) {
                                    html += '<th class="rru_nominal_cell" nodeid="'+$this.attr('nodeid')+'" band="'+nominalquota.Band+'">';
                                    html += '<div class="rru_nominal">' +
                                        '<span>ALC DL </span><div id="rru_nominal_alc_' + nominalquota.Band + '" class= "rru_nominal_alc_slider"></div>' +
                                        '<input id= "rru_nominal_alc_input_' + nominalquota.Band + '" class="rru_nominal_input" type="text"/> dBm</div>';
                                    html += '<div class="rru_nominal">' +
                                        '<span>Gain UL </span><div id="rru_nominal_gain_' + nominalquota.Band + '" class= "rru_nominal_gain_slider"></div>' +
                                        '<input id= "rru_nominal_gain_input_' + nominalquota.Band + '" class="rru_nominal_input" type="text"/> dB </div>';
                                    html += '</th>';
                                }
                            })
                        })
                        html += '</tr>';
                        */
                        //display cellres which was routed to this remote if any
                        //first set up all cell in the table as place holder
                        if(_.findWhere(filtered_rru_cellres,{"rru_id":$this.attr('nodeid')})) {
                            $.each(_.findWhere(filtered_rru_cellres, {"rru_id": $this.attr('nodeid')}).cres_list, function (i, cellres) {
                                html += '<tr><th>' + cellres +'</th><th>'+
                                    '<div class="rru_cellres_setting_header"><span>Output Power [dBm]</span></div>' +
                                    '<div class="rru_cellres_setting_header"><span>UL/DL Gain Offset [dB]</span></div></th>';
                                $.each(node_rfquota_list, function (k, quota) {
                                    html += '<td id="' + cellres + '_' + quota.Band + '" class="rru_cellres_setting_cell"  nodeid="'+$this.attr('nodeid')+'" band="'+quota.Band+'" cellresid="'+cellres+'">';
                                    if (_.findWhere(filtered_cellresList, {"ResID": cellres}).Band === quota.Band) {
                                        html += '<div class="rru_cellres_setting">' +
                                            //'<span>ALC Level </span><div id="cellres_alc_' + cellres + '" class= "rru_cellres_alc_setting_slider" cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+quota.Band+'"></div>' +
                                            '<div id="cellres_alc_' + cellres + '" class= "rru_cellres_alc_setting_slider" cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+quota.Band+'"></div>' +
                                            '<input id= "cellres_alc_input_' + cellres + '" class="rru_cellres_alc_setting_input"    readonly  cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+quota.Band+'" type="text"/>dBm</div>';
                                        html += '<div class="rru_cellres_setting">' + //new code - hide agc div
                                            '<div id="cellres_gain_' + cellres + '" class= "rru_cellres_gain_setting_slider" cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+quota.Band+'"></div>' +
                                            '<input id= "cellres_gain_input_' + cellres + '" class="rru_cellres_gain_setting_input" readonly cellresid="' + cellres + '" nodeid="'+$this.attr('nodeid')+'" band="'+quota.Band+'" type="text"/> dB </div>';
                                    }
                                    html += '</td>';
                                })
                                html += '</tr>';
                            })
                        }
                        html += '</table>';

                        $('#rf_power_level').append(html);

                        //set up slider for rru
                        /*
                        $('.rru_default_slider').slider({
                            range: "min",
                            step:0.1,
                            min: rruMinPowerLevel,
                            max: rruMaxPowerLevel,
                            slide: function( event, ui ) {
                                $('#save').removeClass('disabled');
                                isChanged = true;
                                $(this).parent().find('.rru_default_input').val(ui.value.toFixed(1));
                            }
                        })
                        //set value for slider of rru
                        $.each(node_rfquota_list,function(i,quota){
                            $('#rru_default_'+quota.Band).slider('value',quota.Quota.toFixed(1));
                            $('#rru_default_input_'+quota.Band).val(quota.Quota.toFixed(1));
                        })
                        //disabled setting value of rru
                        $('.rru_default_slider').slider( "option", "disabled", true );
                        $('.rru_default_input').prop("disabled", true);
                        */
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

                                //make sure the slider cannot go over the the max - sum of the rest of the alc's percentage of the same band
                                $.each($(this).closest('table').find('.rru_cellres_alc_setting_slider[band='+$(this).attr("band")+']').not(this),function(){
                                    allocatedCap = Number(allocatedCap + $(this).slider('value'));
                                })
                                allocatedCap = (allocatedCap + ui.value);
                                if (allocatedCap > cellresMaxALCPowerLevel) {
                                    allocatedCap = cellresMaxALCPowerLevel;
                                    dialogIsChanged = true;
                                    return false;
                                }else{
                                    $(this).parent().find('.rru_cellres_alc_setting_slider').val(ui.value);
                                    $('#unused_alc_percentage_'+$(this).attr("band")).text((cellresMaxALCPowerLevel-allocatedCap).toFixed(1)+"%");
                                    $(this).parent().find('.rru_cellres_alc_setting_input').val(percentageToAlcdBm(ui.value,_.findWhere(default_operator_rf_quotas,{"Band":$(this).attr('band')}).RFQuota));
                                    console.log(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}));
                                    //add value into rfcellresLevel list in order to save later
                                    if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                        rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'),"Band":$(this).attr('band'), "ALCOffset":ui.value.toFixed(1) , "ULGainOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ULGainOffset})
                                    }else{
                                        _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ALCOffset = percentageToAlcOffset(ui.value.toFixed(1),_.findWhere(default_operator_rf_quotas,{"Band":$(this).attr('band')}).RFQuota).toString();

                                    }
                                    console.log(rfCellresLevelPerRemote)
                                    dialogIsChanged = true;
                                }
                            }/*,
                            stop: function( event, ui ) {
                                //$('#save').removeClass('disabled');
                                //isChanged = true;
                                $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                $(this).parent().find('.rru_cellres_alc_setting_input').val(ui.value.toFixed(1));
                                //add value into rfcellresLevel list in order to save later
                                if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                    rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'), "ALCOffset":ui.value.toFixed(1) , "ULGainOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ULGainOffset})
                                }else{
                                    _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid')}).ALCOffset = ui.value.toFixed(1);
                                }
                                dialogIsChanged = true;
                            }*/
                        })

                        $('.rru_cellres_gain_setting_slider').slider({
                            range: "min",
                            step:0.1,
                            min: cellresMinGainPowerLevel,
                            max: cellresMaxGainPowerLevel,
                            slide: function( event, ui ) {
                                //$('#save').removeClass('disabled');
                                //isChanged = true;
                                $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                $(this).parent().find('.rru_cellres_gain_setting_input').val(ui.value);
                                //add value into rfcellresLevel list in order to save later
                                if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                    rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'), "Band":$(this).attr('band'),"ALCOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ALCOffset, "ULGainOffset": ui.value.toFixed(1)})
                                }else{
                                    _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ULGainOffset = ui.value.toFixed(1);
                                }
                                dialogIsChanged = true;
                            }
                        })

                        //set value for slider of cellres
                        var defaultALC ="0.0";
                        var defaultGain ="0.0";
                        var totalAlcPercentage =0;
                        $.each(_.findWhere(filtered_rru_cellres, {"rru_id": $this.attr('nodeid')}).cres_list, function (i, cres) {
                            var cresDetail = _.findWhere(rfCellresLevelPerRemote,{"Destinations":$this.attr('nodeid'),"CellRes":cres});
                            var operatorRFQuota = _.findWhere(default_operator_rf_quotas,{"Band": _.findWhere(filtered_cellresList,{"ResID":cres}).Band}).RFQuota;
                            if(cresDetail !=undefined){
                                totalAlcPercentage +=AlcOffsetToPercentage(Number(cresDetail.ALCOffset),operatorRFQuota);
                                $('#cellres_alc_' + cres).slider('value', AlcOffsetToPercentage(Number(cresDetail.ALCOffset),operatorRFQuota));
                                //$('#cellres_alc_' + cres).slider('value', cresDetail.ALCOffset);
                                $('#cellres_alc_input_' + cres).val(AlcOffsetTodBm(cresDetail.ALCOffset));
                                //$('#cellres_alc_input_' + cres).val(cresDetail.ALCOffset);
                                $('#cellres_gain_' + cres).slider('value', cresDetail.ULGainOffset);
                                $('#cellres_gain_input_' + cres).val(cresDetail.ULGainOffset);
                            }else {
                                originalRFOffset.push({"CellRes":cres,"Destinations":$this.attr('nodeid'),"ALCOffset":defaultALC,"ULGainOffset":defaultGain});
                                $('#cellres_alc_' + cres).slider('value', defaultALC);
                                $('#cellres_alc_input_' + cres).val(defaultALC);
                                $('#cellres_gain_' + cres).slider('value', defaultGain);
                                $('#cellres_gain_input_' + cres).val(defaultGain);
                            }
                        })
                        //set number for unused alc percentage per band
                        $.each(node_rfquota_list, function (k, quota) {
                            var totalUseALCPerBand =0;
                            var operatorRFQuota = _.findWhere(default_operator_rf_quotas,{"Band": quota.Band}).RFQuota;
                            $.each(rfCellresLevelPerRemote,function(i, cres){
                                if(quota.Band == cres.Band){
                                    totalUseALCPerBand += AlcOffsetToPercentage(Number(cres.ALCOffset),operatorRFQuota);
                                }
                            })
                            $('#unused_alc_percentage_'+quota.Band).text(100 - totalUseALCPerBand + "%");
                        })

                        //in case input text box on change
                        $('.rru_cellres_alc_setting_input').change(function(){
                            $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                            if(isNaN($(this).val())){
                                axellPopUp("Please fill in a valid setting");
                                $(this).val(defaultALC);
                            /*}else if($(this).val() < cellresMinALCPowerLevel || $(this).val() > cellresMaxALCPowerLevel){
                                axellPopUp("Please fill in a valid setting for ALC offset. It should be in the range of -10 to 10 with one decimal point ");
                                $(this).val(defaultALC);*/
                            }else {
                                var allocatedCap =0;
                                $.each($(this).closest('table').find('.rru_cellres_alc_setting_input').not($(this).closest('td').find('.rru_cellres_alc_setting_input')),function(){
                                    allocatedCap =Number(allocatedCap + $(this).val());
                                    console.log(allocatedCap)
                                })
                                //if allocated more than total 100%, alert
                                if((cellresMaxALCPowerLevel-allocatedCap) < $(this).val()){
                                    axellPopUp('Please enter valid capacity in percentage');
                                    $(this).closest('td').find('.rru_cellres_alc_setting_slider').slider('value',((cellresMaxALCPowerLevel-allocatedCap)));
                                    $(this).val(cellresMaxALCPowerLevel-allocatedCap);
                                    //add value into rfcellresLevel list in order to save later
                                    if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                        rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'), "Band":$(this).attr('band'),"ALCOffset":$(this).val() , "ULGainOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ULGainOffset})
                                    }else{
                                        _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ALCOffset = $(this).val();
                                    }
                                    $('#unused_alc_percentage').text(0+"%");
                                    dialogIsChanged = true;
                                }else{
                                    $(this).closest('td').find('.rru_cellres_alc_setting_slider').slider('value',$(this).val());
                                    //add the keyed in value to allocated cap
                                    allocatedCap += Number($(this).val());
                                    $('#unused_alc_percentage').text((cellresMaxALCPowerLevel-allocatedCap)+"%");

                                    //add value into rfcellresLevel list in order to save later
                                    if(_.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}) === undefined) {
                                        rfCellresLevelPerRemote.push({"CellRes": $(this).attr('cellresid'), "Destinations": $(this).attr('nodeid'),"Band":$(this).attr('band'), "ALCOffset":$(this).val() , "ULGainOffset": _.findWhere(originalRFOffset, {"CellRes": $(this).attr('cellresid')}).ULGainOffset})
                                    }else{
                                        _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ALCOffset = dBmToAlcOffset($(this).val());
                                    }
                                    dialogIsChanged = true;
                                }

                            }
                        })
                        $('.rru_cellres_gain_setting_input').change(function(){
                            if(isNaN($(this).val())){
                                axellPopUp("Please fill in a valid setting");
                                $(this).val(defaultGain);
                            }else if($(this).val() < cellresMinGainPowerLevel || $(this).val() > cellresMaxGainPowerLevel){
                                axellPopUp("Please fill in a valid setting for gain offset. It should be in the range of -10 to 0 with one decimal point ");
                                $(this).val(defaultGain);
                            }else {
                                $(".ui-dialog-buttonpane button:contains('Save')").button("enable");
                                _.findWhere(rfCellresLevelPerRemote,{"CellRes":$(this).attr('cellresid'),"Destinations": $(this).attr('nodeid')}).ULGainOffset = $(this).val();
                                dialogIsChanged = true;
                            }
                        })

                        //set up slider for rru nominal power level
                        /*
                        $('.rru_nominal_alc_slider').slider({
                            range: "min",
                            step:0.1,
                            min: rruMinALCNominalPowerLevel,
                            max: rruMaxALCNominalPowerLevel,
                            slide: function( event, ui ) {
                                $('#save').removeClass('disabled');
                                isChanged = true;
                                $(this).parent().find('.rru_nominal_input').val(ui.value.toFixed(1));
                            }
                        })

                        $('.rru_nominal_gain_slider').slider({
                            range: "min",
                            step:0.1,
                            min: rruMinGainNominalPowerLevel,
                            max: rruMaxGainNominalPowerLevel,
                            slide: function( event, ui ) {
                                $('#save').removeClass('disabled');
                                isChanged = true;
                                $(this).parent().find('.rru_nominal_input').val(ui.value.toFixed(1));
                            }
                        })

                        //set value for slider of rru
                        $.each(rfNominalList,function(i,quota){
                            $.each(node_rfquota_list,function(j,node){
                                if(quota.Band === node.Band) {
                                    $('#rru_nominal_alc_' + quota.Band).slider('value', (quota.DL_ALC_Offset/10).toFixed(1));
                                    $('#rru_nominal_alc_input_' + quota.Band).val((quota.DL_ALC_Offset/10).toFixed(1));
                                    $('#rru_nominal_gain_' + quota.Band).slider('value', quota.UL_Gain_Offset/10);
                                    $('#rru_nominal_gain_input_' + quota.Band).val((quota.UL_Gain_Offset/10).toFixed(1));
                                }
                            })
                        })

                        //event handler when slider on change
                        $('.rru_nominal_input').change(function(){
                            console.log('rru nominal level on change');
                        })
                         */
                        if (MODE === "view") {
                            $('.rru_cellres_alc_setting_slider').slider('disable');
                            $('.rru_cellres_gain_setting_slider').slider('disable');
                            $('.rru_cellres_alc_setting_input').prop('disabled',true);
                            $('.rru_cellres_gain_setting_input').prop('disabled',true);
                        }
                        console.log(rfCellresLevelPerRemote);
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
                                    cmd:'RFROUTE -o '+OPERATOR+' '+PROFILENAME+' SETRF '+$this.attr('nodeid')+' '+cellres.CellRes+' '+cellres.ALCOffset+' '+cellres.ULGainOffset,
                                    onSuccess:function(){

                                    },
                                    onError:function(err){
                                        axellPopUp(err.errorThrown);
                                    }
                                })
                            })
                            $(this).dialog('close');
                        }
                    }
                });
                $('#rf_power_level').dialog('open');
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
                //find  mimo buddy if available
                var mimo_buddy_node_data = _.findWhere(filtered_rru_cellres,{rru_id:node_data.mimo_buddy});
                if($(this).is(':checked')){
                    //if the cellres is not in the cellres list of the remote then add it in
                    //check all other cellres which has conflicted frequency with that cellres and block them
                    //update the dsp and cpri quota
                    var found_conflict = false;
                    if(_.contains(node_data.cres_list,$(this).attr('cellres-id'))
                        || _.contains(node_data.conflict_list,$(this).attr('cellres-id'))
                        || _.contains(node_data.mimo_conflict_list,$(this).attr('cellres-id'))
                        || _.contains(node_data.incompatible_quota_list,$(this).attr('cellres-id'))
                        || _.contains(node_data.incompatible_cellres_list,$(this).attr('cellres-id'))) {
                        found_conflict = true;

                    }
                    if(!found_conflict) {
                        node_data.cres_list.push($(this).attr('cellres-id'));
                        node_data.cres_list = _.uniq(node_data.cres_list);
                        _.extend(node_data.conflict_list, _.pluck(GetConflicts(node_data.rru_id), "ResID"));
                        //node_data.conflict_list = _.uniq(node_data.conflict_list);
                        getInsufficientQuota(node_data.rru_id, $(this).attr('cellres-id'), true);
                        if (mimo_buddy_node_data) {
                            //get the list of mimo cell resource
                            // if those cell resources are in incompatible quota or cpri capacity of a mimo enabled remote, add them to mimo conflict list of its buddy as well
                            $.each(_.where(filtered_cellresList,{"MIMO":"A,B"}),function(i, mimoCellres){
                                if(_.contains(node_data.incompatible_quota_list,mimoCellres.ResID) || _.contains(node_data.incompatible_cpri_list,mimoCellres.ResID)){
                                    mimo_buddy_node_data.mimo_conflict_list.push(mimoCellres.ResID);
                                }
                            })

                            //after adding new cellres to rru cellres list, move on to check if the remote has a mimo buddy
                            // if the rru has a mimo buddy the cellres is mimo_enabled then route the cellres to mimo buddy as well
                            // if the rru has a mimo buddy but the cellres is not mimo enabled, block routing that cellres to the mimo buddy.
                            if (_.findWhere(filtered_cellresList, {ResID: $(this).attr('cellres-id')}).MIMO === "A,B") {
                                //add cellres into cellres list only if the cellres is mimo enabled and be able to route to both
                                mimo_buddy_node_data.cres_list.push($(this).attr('cellres-id'));
                                mimo_buddy_node_data.cres_list = _.uniq(mimo_buddy_node_data.cres_list);
                                //check conflict for mimo buddy as well
                                _.extend(mimo_buddy_node_data.conflict_list, _.pluck(GetConflicts(mimo_buddy_node_data.rru_id), "ResID"));
                                getInsufficientQuota(mimo_buddy_node_data.rru_id, $(this).attr('cellres-id'), true);
                            } else {
                                //or else add the cellres to mimo_conflict_list to block user from routing them
                                mimo_buddy_node_data.mimo_conflict_list.push($(this).attr('cellres-id'));
                                _.extend(mimo_buddy_node_data.conflict_list, _.pluck(GetConflicts(mimo_buddy_node_data.rru_id), "ResID"));
                                mimo_buddy_node_data.conflict_list.push($(this).attr('cellres-id'));
                            }
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

                    if(mimo_buddy_node_data){
                        //get the list of mimo cell resource
                        // if those cell resources are in incompatible quota or cpri capacity of a mimo enabled remote, add them to mimo conflict list of its buddy as well
                        $.each(_.where(filtered_cellresList,{"MIMO":"A,B"}),function(i, mimoCellres){
                            if(!_.contains(node_data.incompatible_quota_list,mimoCellres.ResID) && !_.contains(node_data.incompatible_cpri_list,mimoCellres.ResID)){
                                mimo_buddy_node_data.mimo_conflict_list = _.without(mimo_buddy_node_data.mimo_conflict_list,mimoCellres.ResID);
                            }
                        })
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
                //after updating the data of rru accordingly, re render the node to populate the change
                var row_data = ReRenderNodeColumn($(this).attr('node-id'),$(this).attr('zone-id'));
                $('#div_'+$(this).attr('node-id')).html(row_data);
                if(mimo_buddy_node_data){
                    var row_data = ReRenderNodeColumn(node_data.mimo_buddy,$(this).attr('zone-id'));
                    $('#div_'+node_data.mimo_buddy).html(row_data);
                }

                $('#zone_'+$(this).attr('zone-id')).html(ReRenderZoneRow($(this).attr('zone-id')));
                $('#zone_'+$(this).attr('zone-id')).find('th:last-child').after('<th></th>');
                RenderSingleCres($(this).attr('cellres-id'));
                $('#cres_selections').html(RenderCresSelectionRows());

                //cheating way to fix the max width of the first two row, add an empty column after the last column populated
                $('#cres_selections').find('th:last-child').after('<th></th>');
                $('#div_'+$(this).attr('node-id')).find('td:last-child').after('<td></td>');

                setCapacity();
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
                    $('#div_'+zone_nodes.ZoneNodes[i]).html(row_data);
                    if(mimo_buddy_node_data){
                        var row_data = ReRenderNodeColumn(node_data.mimo_buddy,$(this).attr('zone-id'));
                        $('#div_'+node_data.mimo_buddy).html(row_data);
                    }
                }

                //cheating way to fix the max width of the first two row, add an empty column after the last column populated
                $('#tr_'+zone_nodes.ZoneNodes[i]).find('td:last-child').after('<td></td>');
                $('#zone_'+zone_nodes.ZoneID).html(ReRenderZoneRow(zone_nodes.ZoneID));
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
                //$('#zone_'+$(this).attr('zone-id')).html(ReRenderZoneRow($(this).attr('zone-id')));
                //RenderSingleCres($(this).attr('cellres-id'));
                $('#cres_selections').html(RenderCresSelectionRows());
                //cheating way to add more column at the end of routing page
                $('#cres_selections').find('th:last-child').after('<th></th>');
                for(var d=0;d < zoneList.length; d++)
                {
                    $('#zone_'+zoneList[d].ZoneID).html(ReRenderZoneRow(zoneList[d].ZoneID));
                    //cheating way to add more column at the end of routing page
                    $('#zone_'+zoneList[d].ZoneID).find('th:last-child').after('<th></th>');
                }
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

            $(document).off("click",'.icon.minmaxbutton')
                .on("click",'.icon.minmaxbutton',function(){
                    var zone_id = $(this).parent().parent().attr("id");
                    var reg = new RegExp("zone_","g");
                    zone_id = zone_id.replace(reg, "");
                    var zone_data = _.findWhere(zoneList,{ZoneID:zone_id});
                    if(zone_data)
                    {
                        if(zone_data.ZoneExpanded)
                        {
                            zone_data.ZoneExpanded = false;
                            $(this).removeClass("minimize").addClass("maximize");
                            $(this).parent().parent().nextUntil('tr.zone_header').slideUp("fast");

                        }
                        else
                        {
                            zone_data.ZoneExpanded = true;
                            $(this).removeClass("maximize").addClass("minimize");
                            $(this).parent().parent().nextUntil('tr.zone_header').slideDown("fast");
                        }
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
                                        var rfroute = o.ajaxdata;
                                        $.each(rfroute.Routes, function (key, value) {
                                            var del_str = "RFROUTE -o " + OPERATOR + ' ' + rfroute.Profile + " DELROUTE " + value.RouteNo;
                                            api.exe({
                                                cmd: del_str,
                                                async: false,
                                                dataType: "text",
                                                onSuccess: function (o) {
                                                }
                                            });
                                        });
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
                                        $.each(grouped_rfroutes, function (key, value) {
                                            var nodes_to_cres = "";
                                            $.each(value, function (key2, value2) {
                                                nodes_to_cres += value2.rru_serial + " ";
                                            })
                                            var add_str = "RFROUTE -o " + OPERATOR + ' ' + rfroute.Profile + " ADDROUTE " + key + " " + nodes_to_cres;
                                            api.exe({
                                                cmd: add_str,
                                                async: false,
                                                dataType: "text",
                                                onSuccess: function (o) {

                                                }
                                            });
                                        })
                                        $('#save').addClass('disabled');
                                        isChanged = false;
                                    }
                                });
                            },
                            onError: function (o) {
                                var xxx = -1;
                            }
                        });
                    }
                }
            });

            // delete function
            $('#delete').click(function()
            {
               axellConfirm("alert","Warning","Do you really want to delete profile " + PROFILENAME + "?<br /><br />" +
               "After successfully deleting profile " + PROFILENAME + " you will be redirected back to routing profiles page.", function () {
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
               })
            })

            $(document).on('click', '#collapse_expand_btn' , function(event) {
               for(var i=0; i < zoneList.length; i++)
               {
                   var zone_data = zoneList[i];
                   var selector= $('#zone_'+zone_data.ZoneID);
                    if(zone_data)
                    {
                        if(expand_all)
                        {
                            zone_data.ZoneExpanded = false;
                            $(selector).find('.icon').removeClass("minimize").addClass("maximize");
                            $(selector).nextUntil('tr.zone_header').slideUp("fast");

                        }
                        else
                        {
                            zone_data.ZoneExpanded = true;
                            $(selector).find('.icon').removeClass("maximize").addClass("minimize");
                            $(selector).nextUntil('tr.zone_header').slideDown("fast");

                        }

                    }
               }
                expand_all = !expand_all;
                //make alternate color for table header
                $("#routing_table tr.zone_header:even").addClass('odd');
                $("#routing_table tr.zone_header:odd").addClass('even');
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
        });

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
                                                            parseMIMOBuddy(d);
                                            GenerateDefaultViewHtml();
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
            api.exe({
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
            })


            //$('#routingCellResColumns').width($('#routing_content').width()*0.15);
            //$('#routingZoneRRUHeading').width($('#routing_content').width());
            //$('#spacer').css({'left':0, float:'left'});
            //$('#routingZoneNames').height($('#spacer').height()/2);

            //$('#routingZoneNames').css({'left':$('#spacer').width()});
            //$('#routingNodeNames').css({'margin-top':$('#routingZoneNames').height()});
            //$('#routingNodeNames').height($('#spacer').height()/2);

            //$('#routingNodeNames').css({'left':$('#spacer').width()});
            //$('#routingCellResNames').width($('#routing_content').width()*0.03);
            //$('#routingCellResBands').width($('#routing_content').width()*0.03);
            //$('#routingCresSectors').width($('#routing_content').width()*0.03);
            //$('#routingCresSelections').width($('#routing_content').width()*0.03);



            //$('#routingCellResNames').css({'margin-top':$('#spacer').height()});

           /* $('#routingCellResNames').height($('#routing_content').height());
            $('#routingCellResNames').css({'left':0,float:'left'});
            $('#routingCellResNames').height($('#routing_content').height());
            $('#routingCellResBands').height($('#routing_content').height());
            $('#routingCresSectors').height($('#routing_content').height());
            $('#routingCresSelections').height($('#routing_content').height());




            $('#routingCheckboxes').height($('#routing_content').height() - $('#spacer').height());
            $('#routingZoneNames').width($('#routing_content').width()*0.1);
            $('#routingNodeNames').width($('#routing_content').width()*0.1);
            $('#routingCheckboxes').width($('#routing_content').width()*0.1);
            $('#routingCheckboxes').css({float:'left','left':0});*/
        }

        var zone_width = 150;
        var rowHeight = 30;
        function RenderZonesAndRRUHeadings()
        {
            var resp = {};
            resp.zones = "";
            resp.nodes = "";

            for(var z=0; z< zoneList.length; z++)
            {

                var zone_nodes = zoneList[z];
                                //console.log(zone_nodes);
                var zoneWidth = 17*zone_nodes.ZoneNodes.length;
                var zoneRow = '<div class="zoneWrapper" style="width:'+zoneWidth+'em; padding-left:'+(zoneWidth/2)/2+'em"><div><div class="icon minmaxbutton ';
                if(zone_nodes.ZoneExpanded)
                {
                    zoneRow += "minimize";
                }
                else
                {
                    zoneRow += "maximize";
                }
                zoneRow += '"></div><b><span>'+zone_nodes.ZoneName+'</span></b></div>' +
                    '<div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_'+zone_nodes.ZoneID+'" class="cpri_progress_indicator"></div></div>' +
                    '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_'+zone_nodes.ZoneID+'" class="dsp_progress_indicator"></div></div></div>';
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
                            zoneList
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

                    /*zoneRow += '<div><input id="'+filtered_cellresList[i].ResID+'_'+zone_nodes.ZoneID+'" type="checkbox" '+summary_check+' zone-id ="'+zone_nodes.ZoneID+'" cellres-id ="'+filtered_cellresList[i].ResID+'" class="zone_checkbox"';
                    if(MODE ==="view"){
                        zoneRow += ' disabled="true"/></div>';
                    }
                    else
                    {
                        zoneRow += '/></div>';
                    }*/

                }

                zoneRow += '</div>';
                zoneRow += '</div>';
                //return zoneRow;

                resp.zones += zoneRow;




















                //resp.zones += "<div class='zoneColHeader' style='width:"+zone_width * zoneList[z].ZoneNodes.length+"px'><span class='zoneName'>" + zoneList[z].ZoneName + "</span></div>";
                for (var rruIndex = 0; rruIndex < zoneList[z].ZoneNodes.length; rruIndex++)
                {
                    var node_id = zoneList[z].ZoneNodes[rruIndex];
                    var zone_id = zoneList[z].ZoneID;
                    if(_.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]}) != undefined){
                        tag = _.findWhere(topologyList.nodes,{ID:zoneList[z].ZoneNodes[rruIndex]}).Tag;
                    }
                    var rru_data = _.findWhere(filtered_rru_cellres,{"rru_id":node_id});
                    var remoteRow = '';
                    if (rru_data.mimo_buddy != undefined) {
                        //if flag show gain management btn is true, then show the btn
                        if(!showGainMgmtBtn) {
                            remoteRow ='<div class="remoteHead" id="remoteHead_'+node_id+'" > '+node_id+' - '+ tag +' <div id = "'+node_id+'_mimo_buddy" mimo_buddy = "'+_.findWhere(filtered_rru_cellres, {'rru_id':node_id}).mimo_buddy+'" class="icon mimo_buddy" title="MIMO partner pair with '+_.findWhere(filtered_rru_cellres, {'rru_id':node_id}).mimo_buddy+'"></div></div>' +
                                '<div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_'+node_id+'" class="cpri_progress_indicator"></div></div>' +
                                '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_'+node_id+'" class="dsp_progress_indicator"></div></div></div></div>';
                        }else {
                            remoteRow = '<div class="remoteHead" id="remoteHead_'+node_id+'" > ' + node_id + ' - ' + tag + ' <div class="more_details icon" data-nodeid="' + node_id + '" title="More settings"></div> <div id = "' + node_id + '_mimo_buddy" mimo_buddy = "' + _.findWhere(filtered_rru_cellres, {'rru_id': node_id}).mimo_buddy + '" class="icon mimo_buddy" title="MIMO partner pair with ' + _.findWhere(filtered_rru_cellres, {'rru_id': node_id}).mimo_buddy + '"></div></div>' +
                                '<div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_' + node_id + '" class="cpri_progress_indicator"></div></div>' +
                                '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_' + node_id + '" class="dsp_progress_indicator"></div></div></div></div>';
                        }
                    }else{
                        //if flag show gain management btn is true, then show the btn
                        if(!showGainMgmtBtn) {
                            remoteRow ='<div class="remoteHead" id="remoteHead_'+node_id+'">'+node_id+' - '+ tag +' </div><div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_'+node_id+'" class="cpri_progress_indicator"></div></div>' +
                                '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_'+node_id+'" class="dsp_progress_indicator"></div></div></div></div>';
                        }else {
                            remoteRow = '<div class="remoteHead" id="remoteHead_'+node_id+'" ><b><span>' + node_id + ' - ' + tag + '</span></b> <div class="more_details icon setting" data-nodeid="' + node_id + '" title="More settings"></div><div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_' + node_id + '" class="cpri_progress_indicator"></div></div>' +
                                '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_' + node_id + '" class="dsp_progress_indicator"></div></div></div></div>';
                        }
                    }
                    /*if(rru_data)
                    {
                        for(var i=0; i<filtered_cellresList.length; ++i) {
                            var checked_val = "";
                            //check if cell resource is in incompatible in frequency range with rru
                            //if yes, block the checkbox
                            if (_.contains(rru_data.incompatible_cellres_list, filtered_cellresList[i].ResID)) {
                                remoteRow += '<div> <div class="icon rf-conflict" title="Incompatible radio frequency range with remote ' + node_id + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                remoteRow += '</div>';
                            }
                            //check if remote has any filter quota and cpri quota
                            else if(rru_data.alloc_CPRI_capacity == 0 && rru_data.allocated_filter_quota != 0){
                                remoteRow += '<div><div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                remoteRow += '</div>';
                            }else if(rru_data.allocated_filter_quota == 0 && rru_data.alloc_CPRI_capacity != 0){
                                remoteRow += '<div><div class="icon dsp-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + ' zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                remoteRow += '</div>';
                            }else if(rru_data.allocated_filter_quota == 0 && rru_data.alloc_CPRI_capacity == 0){
                                remoteRow += '<div>' +
                                    '<div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + ' node-id="' + node_id +'" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>'+
                                    '<div class="icon dsp-over-capacity" title="Insufficient filter quota for remote ' + node_id + ' node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>';
                            }else {
                                //if route to one of the mimo enabled remote -->block routing to the other mimo remote
                                //if yes block cell res
                                if (_.contains(rru_data.mimo_conflict_list, filtered_cellresList[i].ResID)) {
                                    //console.log("contain in mimo conflict list");
                                    checked_val = "checked='checked'";
                                    remoteRow += '<div><div class="icon mimo-conflict" title="Cell resource is routed to MIMO partner ' + rru_data.mimo_buddy + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID +'"></div>';
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
                                            remoteRow += '<div><div class="icon overlap-conflict" title="Frequency overlaps with ' + matches[0] + '" node-id="' + node_id + ' zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></td>"';
                                        } else {
                                            remoteRow += '<div><div class="icon overlap-conflict" title="Frequency overlaps with MIMO partner" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></td>"';
                                        }
                                    } else {
                                        //check if there's over capacity for filter quota and cpri
                                        if (_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && !_.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)) {
                                            remoteRow += '<div><div class="icon dsp-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + ' zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                            remoteRow += '</div>';
                                        } else if (!_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && _.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)) {
                                            remoteRow += '<div><div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                            remoteRow += '</div>';
                                        }else if(_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && _.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)){
                                            remoteRow += '<div>' +
                                                '<div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + ' node-id="' + node_id +'" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>'+
                                                '<div class="icon dsp-over-capacity" title="Insufficient filter quota for remote ' + node_id + ' node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>';

                                        }else if (_.contains(rru_data.cres_list, filtered_cellresList[i].ResID))
                                        {
                                            //everything is checked, go ahead and route the cellres to the remote
                                            checked_val = "checked='checked'";
                                            remoteRow += '<div><input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                            if (MODE === "view") {
                                                remoteRow += '" disabled="true"/></div>';
                                            }
                                            else {
                                                remoteRow += '"/></div>';
                                            }
                                        }else {
                                            //console.log("place holder");
                                            remoteRow += '<div><input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                            if (MODE === "view") {
                                                remoteRow += '" disabled="true"/></div>';
                                            }
                                            else {
                                                remoteRow += '"/></div>';
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }*/
                    resp.nodes += remoteRow;
                }
            }
            return resp;
        }

        function ReRenderNodeColumn(node_id,zone_id)
        {
            var tag="";
            if(_.findWhere(topologyList.nodes,{ID:node_id}) != undefined){
                tag = _.findWhere(topologyList.nodes,{ID:node_id}).Tag;
            }
            var rru_data = _.findWhere(filtered_rru_cellres,{"rru_id":node_id});
            var remoteRow = '';
            /*if (rru_data.mimo_buddy != undefined)
            {
                //if flag show gain management btn is true, then show the btn
                if(!showGainMgmtBtn) {
                    var remoteRow ='<div > '+node_id+' - '+ tag +' <div id = "'+node_id+'_mimo_buddy" mimo_buddy = "'+_.findWhere(filtered_rru_cellres, {'rru_id':node_id}).mimo_buddy+'" class="icon mimo_buddy" title="MIMO partner pair with '+_.findWhere(filtered_rru_cellres, {'rru_id':node_id}).mimo_buddy+'"></div></td>' +
                        '<div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_'+node_id+'" class="cpri_progress_indicator"></div></div>' +
                        '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_'+node_id+'" class="dsp_progress_indicator"></div></div></div>';
                }else {
                    var remoteRow = '<div > ' + node_id + ' - ' + tag + ' <div class="more_details icon" data-nodeid="' + node_id + '" title="More settings"></div> <div id = "' + node_id + '_mimo_buddy" mimo_buddy = "' + _.findWhere(filtered_rru_cellres, {'rru_id': node_id}).mimo_buddy + '" class="icon mimo_buddy" title="MIMO partner pair with ' + _.findWhere(filtered_rru_cellres, {'rru_id': node_id}).mimo_buddy + '"></div></td>' +
                        '<div><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_' + node_id + '" class="cpri_progress_indicator"></div></div>' +
                        '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_' + node_id + '" class="dsp_progress_indicator"></div></div></div>';
                }
            }else{
                //if flag show gain management btn is true, then show the btn
                if(!showGainMgmtBtn) {
                    var remoteRow ='<div >'+node_id+' - '+ tag +' </td><td><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_'+node_id+'" class="cpri_progress_indicator"></div></div>' +
                        '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_'+node_id+'" class="dsp_progress_indicator"></div></div></div>';
                }else {
                    var remoteRow = '<div >' + node_id + ' - ' + tag + ' <div class="more_details icon setting" data-nodeid="' + node_id + '" title="More settings"></td><td><div class="cpri_indicator"><span class="indicator_title">CPRI</span><div id ="capacity_indicator_' + node_id + '" class="cpri_progress_indicator"></div></div>' +
                        '<div class="dsp_indicator"><span class="indicator_title">DSP</span><div id ="dsp_capacity_indicator_' + node_id + '" class="dsp_progress_indicator"></div></div></div>';
                }
            }*/
            if(rru_data)
            {
                for(var i=0; i<filtered_cellresList.length; ++i) {
                    var checked_val = "";
                    //check if cell resource is in incompatible in frequency range with rru
                    //if yes, block the checkbox
                    if (_.contains(rru_data.incompatible_cellres_list, filtered_cellresList[i].ResID)) {
                        remoteRow += '<div class="gridDiv"> <div class="icon rf-conflict" title="Incompatible radio frequency range with remote ' + node_id + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                        remoteRow += '</div>';
                    }
                    //check if remote has any filter quota and cpri quota
                    else if(rru_data.alloc_CPRI_capacity == 0 && rru_data.allocated_filter_quota != 0){
                        remoteRow += '<div class="gridDiv"><div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                        remoteRow += '</div>';
                    }else if(rru_data.allocated_filter_quota == 0 && rru_data.alloc_CPRI_capacity != 0){
                        remoteRow += '<div class="gridDiv"><div class="icon dsp-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + ' zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                        remoteRow += '</div>';
                    }else if(rru_data.allocated_filter_quota == 0 && rru_data.alloc_CPRI_capacity == 0){
                        remoteRow += '<div class="gridDiv">' +
                            '<div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + ' node-id="' + node_id +'" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>'+
                            '<div class="icon dsp-over-capacity" title="Insufficient filter quota for remote ' + node_id + ' node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>';
                    }else {
                        //if route to one of the mimo enabled remote -->block routing to the other mimo remote
                        //if yes block cell res
                        if (_.contains(rru_data.mimo_conflict_list, filtered_cellresList[i].ResID)) {
                            //console.log("contain in mimo conflict list");
                            checked_val = "checked='checked'";
                            remoteRow += '<div class="gridDiv"><div class="icon mimo-conflict" title="Cell resource is routed to MIMO partner ' + rru_data.mimo_buddy + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID +'"></div>';
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
                                    remoteRow += '<div class="gridDiv"><div class="icon overlap-conflict" title="Frequency overlaps with ' + matches[0] + '" node-id="' + node_id + ' zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></td>"';
                                } else {
                                    remoteRow += '<div class="gridDiv"><div class="icon overlap-conflict" title="Frequency overlaps with MIMO partner" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></td>"';
                                }
                            } else {
                                //check if there's over capacity for filter quota and cpri
                                if (_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && !_.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)) {
                                    remoteRow += '<div class="gridDiv"><div class="icon dsp-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + ' zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                    remoteRow += '</div>';
                                } else if (!_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && _.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)) {
                                    remoteRow += '<div class="gridDiv"><div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                    remoteRow += '</div>';
                                }else if(_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && _.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)){
                                    remoteRow += '<div class="gridDiv">' +
                                        '<div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + ' node-id="' + node_id +'" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>'+
                                        '<div class="icon dsp-over-capacity" title="Insufficient filter quota for remote ' + node_id + ' node-id="' + node_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>';

                                }else if (_.contains(rru_data.cres_list, filtered_cellresList[i].ResID))
                                {
                                    //everything is checked, go ahead and route the cellres to the remote
                                    checked_val = "checked='checked'";
                                    remoteRow += '<div class="gridDiv"><input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                    if (MODE === "view") {
                                        remoteRow += '" disabled="true"/></div>';
                                    }
                                    else {
                                        remoteRow += '"/></div>';
                                    }
                                }else {
                                    //console.log("place holder");
                                    remoteRow += '<div class="gridDiv"><input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                    if (MODE === "view") {
                                        remoteRow += '" disabled="true"/></div>';
                                    }
                                    else {
                                        remoteRow += '"/></div>';
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return remoteRow;
        }


        function RenderNodeCollumns(rru_data,zone_id)
        {
            var resp = '';

            var node_id = rru_data.rru_id;
            for(var i =0; i< filtered_cellresList.length; i++)
            {
                var checked_val = "";
                if (_.contains(rru_data.incompatible_cellres_list, filtered_cellresList[i].ResID))
                {
                    resp += '<div class="gridDiv" style="height:'+rowHeight+'"><div class="icon rf-conflict" title="Incompatible radio frequency range of Cell Resource: ' + filtered_cellresList[i].ResID + ' with Remote Node: ' +rru_data.rru_id +'" node-id="' + rru_data.rru_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID+'"></div></div>';
                }
                //check if the remote has any filter + cpri quota
                else if(rru_data.alloc_CPRI_capacity == 0 && rru_data.allocated_filter_quota != 0)
                {
                    resp += '<div class="gridDiv"><div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for Remote Node: ' +filtered_rru_cellres[i].rru_id +'" node-id="' + rru_data.rru_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + cell_res_data.ResID+'"></div></div>';
                }
                else if(rru_data.alloc_CPRI_capacity == 0 && rru_data.alloc_CPRI_capacity != 0)
                {
                    resp += '<div class="gridDiv"><div class="icon dsp-over-capacity" title="Insufficient Filter capacity for Remote Node: ' +filtered_rru_cellres[i].rru_id +'" node-id="' + rru_data.rru_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + cell_res_data.ResID+'"></div></div>';
                }
                else if(rru_data.allocated_filter_quota == 0 && rru_data.alloc_CPRI_capacity == 0)
                {
                    resp += '<div class="gridDiv"><div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for Remote Node: ' +filtered_rru_cellres[i].rru_id +'" node-id="' + rru_data.rru_id + '" zone-id ="'+ zone_id + '" cellres-id ="' + cell_res_data.ResID+'"></div></div>';
                }
                else
                {
                    if (_.contains(rru_data.mimo_conflict_list, filtered_cellresList[i].ResID)) {
                        //console.log("contain in mimo conflict list");
                        checked_val = "checked='checked'";
                        resp += '<div class="gridDiv"><div class="icon mimo-conflict" title="Cell resource is routed to MIMO partner ' + rru_data.mimo_buddy + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID +'"></div>';
                        resp += '</div>';
                        //if not contain, behave normally
                    } else {
                        if (_.contains(rru_data.conflict_list, filtered_cellresList[i].ResID)) {
                            //console.log("contain in conflict list");
                            var conflicts = _.findWhere(conflicting_cell_res, {ResID: filtered_cellresList[i].ResID});
                            //check if the conflict is with MIMO partner
                            var matches = _.intersection(rru_data.cres_list, _.pluck(conflicts.Conflicts, "ResID"));
                            if (matches[0] != undefined) {
                                resp += '<div class="gridDiv"><div class="icon overlap-conflict" title="Frequency overlaps with ' + matches[0] + '" node-id="' + node_id + ' zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>"';
                            } else {
                                resp += '<div class="gridDiv"><div class="icon overlap-conflict" title="Frequency overlaps with MIMO partner" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>"';
                            }
                        }
                        else {
                            if (_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && !_.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)) {
                                resp += '<div class="gridDiv"><div class="icon dsp-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + ' zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                resp += '</div>';
                            } else if (!_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && _.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)) {
                                resp += '<div class="gridDiv"><div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + '" node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>';
                                resp += '</div>';
                            } else if (_.contains(rru_data.incompatible_quota_list, filtered_cellresList[i].ResID) && _.contains(rru_data.incompatible_cpri_list, filtered_cellresList[i].ResID)) {
                                resp += '<div class="gridDiv">' +
                                    '<div class="icon cpri-over-capacity" title="Insufficient CPRI capacity for remote ' + node_id + ' node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div>' +
                                    '<div class="icon dsp-over-capacity" title="Insufficient filter quota for remote ' + node_id + ' node-id="' + node_id + '" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"></div></div>';

                            } else if (_.contains(rru_data.cres_list, filtered_cellresList[i].ResID)) {
                                //everything is checked, go ahead and route the cellres to the remote
                                checked_val = "checked='checked'";
                                resp += '<div class="gridDiv"><input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                if (MODE === "view") {
                                    resp += '" disabled="true"/></div>';
                                }
                                else {
                                    resp += '"/></div>';
                                }
                            } else {
                                //console.log("place holder");
                                resp += '<div class="gridDiv"><input id="' + filtered_cellresList[i].ResID + '_' + node_id + '" node-id="' + node_id + '" type="checkbox"' + checked_val + ' class="remote_checkbox" zone-id ="' + zone_id + '" cellres-id ="' + filtered_cellresList[i].ResID + '"';
                                if (MODE === "view") {
                                    resp += '" disabled="true"/></div>';
                                }
                                else {
                                    resp += '"/></div>';
                                }
                            }
                        }
                        //resp += '<div class="gridDiv"><input type="checkbox"/></div>';
                    }
                }
            }
            return resp;
        }

        function RenderCheckboxes()
        {
            var resp = '';
            for(var z=0; z< zoneList.length; z++)
            {
                for (var rruIndex = 0; rruIndex < zoneList[z].ZoneNodes.length; rruIndex++) {
                    var node_id = zoneList[z].ZoneNodes[rruIndex];
                    var zone_id = zoneList[z].ZoneID;
                    if (_.findWhere(topologyList.nodes, {ID: zoneList[z].ZoneNodes[rruIndex]}) != undefined) {
                        tag = _.findWhere(topologyList.nodes, {ID: zoneList[z].ZoneNodes[rruIndex]}).Tag;
                    }
                    var rru_data = _.findWhere(filtered_rru_cellres, {"rru_id": node_id});
                    //check if rru is in incompatible frequency range with cell res
                    resp += '<div id="remote_'+ rru_data.rru_id + '" class="rruCol" style="width:' + zone_width + 'px">';
                    resp += RenderNodeCollumns(rru_data,zone_id);
                    resp += '</div>'
                }
            }
            return resp;
        }


    })
