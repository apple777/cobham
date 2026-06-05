/**
 * Created by Emerald on 3/12/14.
 */
require([ '/js/api.js','/js/lib/d3.min.js','/js/lib/jquery.js','/js/convert.js','/js/scheduler.js','/js/lib/jquery-jsPlumb.js','/js/lib/jquery-ui.js','/js/util.js','/js/lib/underscore.js','/js/lib/tipsy.js','/js/lib/jquery_cookie.js','/js/lib/jquery.blockUI.js'],
    function (api,d3,$,convert,scheduler ) {
    var USERNAME = $.cookie('username');
    var USERACCESS = $.cookie('userAccess');
    var OPERATORS;
    console.log("---------");
    var temp = $.cookie('operatorCook');
    if((typeof temp != 'undefined')){
        console.log("=============");
        console.log(temp);
        OPERATORS =$.parseJSON($.cookie('operatorCook'));
    }
    console.log("---------");
    var layerCount;
    var unfilteredConnectionList;
    var totalNodeList;
    var nodeAPOIList;
    var nodeMTDIList;
    var nodeMSDHList;
    var nodeSectorList;
    var nodeRemoteList;
    var sectgrpList;
    var zoneList;
    var sectorWidth = 30;
    var sectorHeight = 30;
    var fixedWidth = 100;
    var fixedPopupWidth = 500;
    var APOIHeight = 27;
    var APOIPopupHeight = 138;
    var MTDIHeight = 10;
    var MTDIPopupHeight = 48;
    var MSDHHeight = 9;
    var MSDHPopupHeight = 51;
    var remoteWidth = 25;
    var remoteHeight = 37;
    var zoneWidth = 25;
    var zoneHeight = 37;
    var sectorLayer = 1;
    var APOILayer = 2;
    var MTDILayer = 3;
    var MSDHLayer = 4;
    var remoteLayer =5;
    var rackList;
    var imgMap ={"APOI":"/images/icons/APOI_bigicon.png","MTDI":"/images/icons/MTDI_bigicon.png","MSDH":"/images/icons/MSDH_bigicon.png"};
    var nodeSizeMap = {"APOI":3,"MTDI":1,"MSDH":1}
    //var viewMode = $.cookie('viewMode');
    var totalOtherNodeList;
    var displayedNode;
    var topologyList;
    //var svgNode = $.parseXML("http://192.168.171.35/images/icons/APOI_bigicon.svg/");
    //get data
    var nodeOrder = {};
    var rackIDgeneral;
    var scale;
    var zone;
    var msdhX=[];
    var mtdiX=[];
    var apoiX=[];
    var screenResStatus;
    var sectRed = false;
    var sectorsAlarm = [];
    var cellsAlarm = [];
    var cellresList;
    var rfrangesList;
    var rfConns=[];
    var conns=[];
    var bundles=[];
    var bandList=[];
    var maxChain ={};
    var prm;

    api.exe({
        cmd:'bands --json',
        dataType:'json',
        onSuccess:function(o){
            bandList = o.ajaxdata.bands;
        }
    });

    //sort list by NodeOrder
    var acc = 1;
    nodeOrder = {};
    function parseBundleGroup(BUNDLEGROUP){
        $.each(BUNDLEGROUP,function(key,value){
        //console.log("value.nodes",value.nodes);
            $.each(value.nodes,function(key1,value1){
                //var tmpNode = _.findWhere(totalNodeList, {"ID": value1.ID});
                //if(tmpNode && tmpNode["Node Type"] && tmpNode["Node Type"].indexOf("RRU") != -1){
                   //console.log for DIG_CONN_ order
                   //console.log("value1: ",value1.ID,acc);
                   // inject for global object
                   nodeOrder[value1.ID]=acc;
                   acc++;
                //}
            })
        })
    }


    // global jqueryui settings
    $("#right_side_bar").accordion({ collapsible: true, heightStyle: "content", autoHeight: false });
    $(".aRack").accordion({ collapsible: true });


    function getData(viewMode){
        console.log("getdata");
        console.log(viewMode)
        layerCount =0;
        totalNodeList =[];
        var totalSectorNodeList;
        totalOtherNodeList =[];
        //remove layer header and append new one when update drawing
        scheduler.remove({cmd:'SECTGRP -o '+$("#operator_list").val()+' list --sectors && sector -o '+$("#operator_list").val()+' --json'});
        scheduler.add( sec(20), {
            cmd:'SECTGRP -o '+$("#operator_list").val()+' list --sectors && sector -o '+$("#operator_list").val()+' --json',
            dataType:'text',
            callOnDiff:true,
            onSuccess:function(o){
                nodeSectorList=[];
                sectgrpList =[];
                totalSectorNodeList=[];
                var sectorgrpSector = o.ajaxdata.split("\n").map($.trim).filter(function(line) { return line != "" });
                var sectorgrp = _.without(sectorgrpSector,sectorgrpSector[sectorgrpSector.length-1]);
                var sectorList = $.parseJSON(sectorgrpSector[sectorgrpSector.length-1]).sector;
                $.each(sectorgrp,function(index, group){
                    var groupName = group.substring(group.indexOf('"')+1,group.lastIndexOf('"'));
                    var groupid = $.trim(group.substring(12,group.indexOf(":")));
                    var sectorNodeList = (group.substring(group.lastIndexOf('"')+2, group.length)).split(" ");
                    var groupSectorList =[];
                    var sectorIDList =[];
                    $.each(sectorNodeList,function(key,value)
                    {
                        $.each(sectorList,function(i, sector){
                            if(value === sector.SectorID){
                                _.extend(sector,{"ID":sector.SectorID,"depth":2,"layer":sectorLayer,"width":sectorWidth,"height":sectorHeight,"Node Type":"VIRT_SECT"});
                                groupSectorList.push(sector);
                                sectorIDList.push(sector.SectorID);
                            }
                        })
                    })
                    //this is a list of sectgrp name, to use for move sector to group
                    if (groupSectorList.length > 0){
                    sectgrpList.push({"sectgrp":groupName,"sectorList":sectorIDList});
                    nodeSectorList.push({"ID": "sectgrp_"+$("#operator_list").val()+"_"+groupid,"name": groupName,"Node Type":"SECTGRP","layer": sectorLayer, "depth":1, "width":sectorWidth, "height":sectorHeight, "expand":false, "Comm":"0", "Status":"0", "children":groupSectorList});
                    totalSectorNodeList.push({"ID": "sectgrp_"+$("#operator_list").val()+"_"+groupid,"name": groupName,"Node Type":"SECTGRP","layer": sectorLayer, "depth":1, "width":sectorWidth, "height":sectorHeight, "expand":false,"Comm":"0","Status":"0","children":groupSectorList});
                    }
                });
                $('g#SECTGRP_overall-status').remove();
                svgGroup.selectAll("g.SECTGRP").remove();
                //console.log(nodeSectorList);
                if(nodeSectorList.length>0){
                    drawTopology(nodeSectorList);
                }
                totalNodeList = _.union(totalSectorNodeList, totalOtherNodeList);
            }
        })


        scheduler.remove({cmd:'zone -o '+$("#operator_list").val()+' list --nodes && topology -o '+$("#operator_list").val()+' --json && rack topology --json'});
        scheduler.add( sec(20), {
            cmd:'zone -o '+$("#operator_list").val()+' list --nodes && topology -o '+$("#operator_list").val()+' --json && rack topology --json',
            callOnDiff:true,
            onSuccess:function(o){
                nodeAPOIList =[];
                nodeMTDIList =[];
                nodeMSDHList =[];
                nodeRemoteList =[];
                //list to use for zone selected menu in side bar
                zoneList =[];
                totalOtherNodeList=[];
                var zoneTopology = o.ajaxdata.split("\n").map($.trim).filter(function(line) { return line != ""});
                zone = _.without(zoneTopology,zoneTopology[zoneTopology.length-1],zoneTopology[zoneTopology.length-2])
                topologyList = $.parseJSON(zoneTopology[zoneTopology.length-2]).nodes;
                rackList = $.parseJSON(zoneTopology[zoneTopology.length-1]).Racks;
                var remoteList = _.filter(topologyList,function(node){
                    if(node["Node Type"].indexOf("RRU") != -1){
                        return node
                    }
                });
                //sort rack list
                // order = -, present last in the row
                rackList.sort(function (a, b) {
                    if(a.Order !="-"&& b.Order !="-") {
                        if (a.Order > b.Order) {
                            return 1;
                        }
                        if (a.Order < b.Order) {
                            return -1;
                        }
                    }else if(a.Order =="-"&& b.Order !="-"){
                        return 1;
                    }else if(a.Order !="-"&& b.Order =="-"){
                        return -1;
                    }
                    return 0;
                });

                //call rack command and populate rack
                $.each(rackList,function(i,rack){
                    $.each(rack.Units,function(j, unit){
                        $.each(topologyList,function(k, node){
                            if(unit.ID !=undefined && unit.ID == node.ID){
                                if(unit["Node Type"].indexOf("APOI") != -1){
                                    _.extend(unit,node,{"layer":APOILayer,"width": fixedWidth,"height": APOIHeight,"popup_width": fixedPopupWidth,"popup_height": APOIPopupHeight});
                                }else if(unit["Node Type"].indexOf("MTDI") != -1){
                                    _.extend(unit,node,{"layer":MTDILayer,"width": fixedWidth,"height": MTDIHeight,"popup_width": fixedPopupWidth,"popup_height": MTDIPopupHeight});
                                }else if(unit["Node Type"].indexOf("MSDH") != -1){
                                    _.extend(unit,node,{"layer":MSDHLayer,"width": fixedWidth,"height": MSDHHeight,"popup_width": fixedPopupWidth,"popup_height": MSDHPopupHeight});
                                }
                            }
                        })
                    })
                })
                //run through topology command to add more details of sector in
                $.each(nodeSectorList,function(i, value){
                    $.each(value.children,function(key, sector){
                        $.each(topologyList,function(index,node){
                            if(node.ID === sector.SectorID){
                                _.extend(sector,node);
                            }
                        })
                    })
                })

                _.filter(topologyList,function(node){
                    if(node["Node Type"].indexOf("APOI") != -1){
                        _.extend(node,{"layer":APOILayer,"width": fixedWidth,"height": APOIHeight,"popup_width": fixedPopupWidth,"popup_height": APOIPopupHeight});
                        nodeAPOIList.push(node);
                        totalOtherNodeList.push(node);
                    }else if(node["Node Type"].indexOf("MTDI") != -1){
                        _.extend(node,{"layer":MTDILayer,"width": fixedWidth,"height": MTDIHeight,"popup_width": fixedPopupWidth,"popup_height": MTDIPopupHeight});
                        nodeMTDIList.push(node);
                        totalOtherNodeList.push(node);
                    }else if(node["Node Type"].indexOf("MSDH") != -1){
                        _.extend(node,{"layer":MSDHLayer,"width": fixedWidth,"height": MSDHHeight,"popup_width": fixedPopupWidth,"popup_height": MSDHPopupHeight});
                        nodeMSDHList.push(node);
                        totalOtherNodeList.push(node);
                    }
                });

                $.each(zone,function(index, zone){
                    var zoneName = zone.substring(zone.indexOf('"')+1,zone.lastIndexOf('"'));
                    var zoneid = $.trim(zone.substring(zone.indexOf("zone")+5,zone.indexOf(":")));
                    var zoneNodeList = (zone.substring(zone.lastIndexOf('"')+2, zone.length)).split(" ");
                    var zoneRemoteList =[];
                    var remoteIDList=[];
                    $.each(zoneNodeList,function(key,value)
                    {
                        $.each(remoteList,function(i, remote){
                            if(value === remote.ID){
                                _.extend(remote,{"depth":2,"layer":remoteLayer,"width":remoteWidth,"height":remoteHeight});
                                zoneRemoteList.push(remote);
                                remoteIDList.push(remote.ID);
                            }
                        })
                    })
                    zoneList.push({"zoneName":zoneName,"remoteList":remoteIDList});
                        if (zoneRemoteList.length > 0){
                        if(_.findWhere(zoneRemoteList,{"Comm":"1"})){
                            nodeRemoteList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false,"Comm":"1", "Status":"1", "children":zoneRemoteList});
                            totalOtherNodeList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false, "Comm":"1", "Status":"1","children":zoneRemoteList});
                        }else  if(_.findWhere(zoneRemoteList,{"Comm":"-"})){
                            nodeRemoteList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false,"Comm":"-", "Status":"-", "children":zoneRemoteList});
                            totalOtherNodeList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false, "Comm":"-","Status":"-","children":zoneRemoteList});
                        }else if(_.findWhere(zoneRemoteList,{"Status":"0"}) &&_.findWhere(zoneRemoteList,{"Comm":"0"})){
                            nodeRemoteList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false,"Comm":"0", "Status":"0", "children":zoneRemoteList});
                            totalOtherNodeList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false, "Comm":"0","Status":"0","children":zoneRemoteList});
                        }else if(_.findWhere(zoneRemoteList,{"Status":"1"}) && _.findWhere(zoneRemoteList,{"Comm":"0"})){
                            nodeRemoteList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false,"Comm":"0", "Status":"1", "children":zoneRemoteList});
                            totalOtherNodeList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false, "Comm":"0","Status":"1","children":zoneRemoteList});
                        }else if(_.findWhere(zoneRemoteList,{"Status":"2"}) &&_.findWhere(zoneRemoteList,{"Comm":"0"})){
                            nodeRemoteList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false,"Comm":"0", "Status":"2", "children":zoneRemoteList});
                            totalOtherNodeList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false, "Comm":"0","Status":"2","children":zoneRemoteList});
                        }else if(_.findWhere(zoneRemoteList,{"Status":"3"}) && _.findWhere(zoneRemoteList,{"Comm":"0"})){
                            nodeRemoteList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false,"Comm":"0", "Status":"3", "children":zoneRemoteList});
                            totalOtherNodeList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false, "Comm":"0","Status":"3","children":zoneRemoteList});
                        }else if(_.findWhere(zoneRemoteList,{"Status":"4"}) &&_.findWhere(zoneRemoteList,{"Comm":"0"})){
                            nodeRemoteList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false,"Comm":"0", "Status":"4", "children":zoneRemoteList});
                            totalOtherNodeList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false, "Comm":"0","Status":"4","children":zoneRemoteList});
                        }else{
                            nodeRemoteList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false,"Comm":"-", "Status":"-", "children":zoneRemoteList});
                            totalOtherNodeList.push({"ID": "zone_"+$("#operator_list").val()+"_"+zoneid,"name": zoneName,"Node Type":"ZONE", "layer": remoteLayer, "depth":1, "width":zoneWidth,"height":zoneHeight, "expand":false, "Comm":"-","Status":"-","children":zoneRemoteList});
                        }
                    }
                });
                //sort all list by NodeOrder
                nodeAPOIList = _.sortBy(nodeAPOIList,"NodeOrder");
                nodeMTDIList = _.sortBy(nodeMTDIList,"NodeOrder")
                nodeMSDHList = _.sortBy(nodeMSDHList,"NodeOrder")
                //sort all arrays: array is sorted
                $('.layer_header:not(g#SECTGRP_overall-status)').remove();
                svgGroup.selectAll("g:not(.SECTGRP):not(.SECTGRP_layer_header)").remove();

                if(viewMode =="topology") {
                    console.log("draw topology");
                    if (nodeAPOIList.length > 0) {
                        drawTopology(nodeAPOIList);
                    }
                    if (nodeMTDIList.length > 0) {
                        drawTopology(nodeMTDIList);
                    }
                    if (nodeMSDHList.length > 0) {
                        drawTopology(nodeMSDHList, "NodeOrder");
                    }
                    if (nodeRemoteList.length > 0) {
                        drawTopology(nodeRemoteList);
                    }
                }else if(viewMode=="rack"){
                    //if rackList is empty, we show topology view
                    if(rackList.length > 0) {
                        console.log("draw rack");
                        //create rack here
                        createRackHolder(rackList);

                        getSlotHeight(rackList);

                        //calculate max height of rack and scale down rack accordingly
                        var rackWidth = 170;
                        var maxRackHeight = rackContainer.node().getBBox().height;
                        var maxAllowedHeight = wHeight/5*3 +25 //enlargement 25 || padding 100;
                        scale = maxAllowedHeight/maxRackHeight;
                        if(scale > 1)
                            scale = 1;
                        //calculate total width of rack holder with scale to make sure scale svg will be drawn on central of screen
                        var rackWidthWithScale = rackContainer.node().getBBox().width * scale;
                        var rackMarginRight = (wWidth - wMargin.right*2 - rackWidthWithScale) /2 - rackContainer.node().getBBox().x; + rackWidthWithScale/2 ;
                        //only apply scale when the rack is bigger than the container, scale is set to 1 if rack stays within placeholder

                        if(scale < 1) {
                            rackContainer.attr("transform",
                                    "translate(" + Number(rackMarginRight) + "," + Number(nodeHeight + layerPadding) + "), " +
                                    "scale (" + scale + ")")
                        }else{
                            rackContainer.attr("transform",
                                    "translate(" + Number(rackMarginRight) + "," + Number(2 * layerPadding + 2 * nodeHeight - 150 +50*scale) + "), " +
                                    "scale (" + scale + ")")
                        }

                        if (nodeRemoteList.length > 0) {
                            drawTopology(nodeRemoteList);
                        }
                    }else{
                        //draw topology instead
                        if (nodeAPOIList.length > 0) {
                            drawTopology(nodeAPOIList);
                        }
                        if (nodeMTDIList.length > 0) {
                            drawTopology(nodeMTDIList);
                        }
                        if (nodeMSDHList.length > 0) {
                            drawTopology(nodeMSDHList, "NodeOrder");
                        }
                        if (nodeRemoteList.length > 0) {
                            drawTopology(nodeRemoteList);
                        }
                        //set view mode to topology
                        $('#display_filter_list').val('topology');
                        //set cookie to topology
                        $.removeCookie('viewMode',{ path: '/' });
                        $.cookie('viewMode', $('#display_filter_list').val(), { expires: 7, path: '/' });
                    }
                }
                totalNodeList = _.union(totalSectorNodeList, totalOtherNodeList);

                displayZoom();
            }
        })

        scheduler.remove({cmd:"connections -o "+$('#operator_list').val()+" --json"});
        scheduler.add( sec(20), {
            cmd:'connections -o '+$("#operator_list").val()+' --json',
            callOnDiff:true,
            onSuccess:function(o){
                if(o.ajaxdata != "") {
                    unfilteredConnectionList = $.parseJSON(o.ajaxdata);
                    // parseBundleGroup RRU
                    parseBundleGroup(unfilteredConnectionList.BUNDLEGROUP)
                    unfilteredConnectionList = _.union(unfilteredConnectionList.rf_connections, unfilteredConnectionList.connections);
                }
            }
        })

        //this to clear out schedule to call for old operator
        $.each(OPERATORS,function(i,operator){
            scheduler.remove({ cmd:'RFROUTE PROFILES -o '+operator.SysName+' --json'});
        })

        scheduler.add(sec(3),{
            cmd:'RFROUTE PROFILES -o '+$("#operator_list").val()+' --json',
            callOnDiff:true,
            //dataType:'json',
            onSuccess:function(o){
                 var rfrouteList = $.parseJSON(o.ajaxdata);
                 $("#routing_setup_select").empty();
                 $("#routing_setup_select").text(rfrouteList.Active);
                 api.exe({
                  cmd: 'get_rrc_message ' + $("#operator_list").val(),
                  dataType: 'text',
                  async: false,
                  onSuccess: function (e) {
                     var status = 0;
                     if(e.ajaxdata.indexOf("Error") != -1)
                        status = 1;
                     setLedColor('#routing-setup-led',status);
                     if (status == 0) {
                        $('#setup-message').text('Routing profile setup is OK');
                        $('#routing-setup-detail').hide();
                        $('#routing-setup-btn-panel').hide();
                        $('#routing_setup').removeClass('setup-error');
                     }else {
                        $('#setup-message').text('Error in activating routing profile');
                        $('#routing-setup-detail').show();
                        //$('#routing-setup-btn-panel').hide();
                        $('#routing_setup').addClass('setup-error');
                        //$('#last-setup').text(convert.epoch2slashedDDMMYYYY(rfrouteList.LastError));
                        $('#setup-msg').text(e.ajaxdata);
                     }
                  }
                 })
            }
        })
    }




    var duration = 300;
    var wMargin = {
        right: 20,
        left:20,
        bottom: 50,
        top:20
    };
    var popupMargin = {
        right: 100,
        left:5,
        bottom: 20,
        top:20
    };


    var wWidth = 0;
    var wHeight = 0;
    var nodeHeight = 0;
    var layerPadding = 0;
    var popupWidth = 0;
    var popupHeight = 0;
    //update all dimension data of the screen in case window was resized
    function updateScreenSize(){
        wWidth = $(window).width();
        wHeight = $(window).height() - 98;
        //detect resolution on small screen
        if (wHeight < 768){
            screenResStatus = 30;
        }else{
            screenResStatus = 10;
        }
        nodeHeight = 30;
        layerPadding =(wHeight - nodeHeight*5)/6;
        popupWidth = wWidth - 20;
        popupHeight = wHeight - (wHeight*0.05);
        $('#topology-container').width(wWidth);
        $('#topology-container').height(wHeight);
        $('#popup').css('width',popupWidth);
        $('#popup').css('height',popupHeight);
    }
    updateScreenSize();


        var zoomListener = d3.behavior.zoom().scaleExtent([0.8, 5]).on("zoom", zoom);
        var popupZoomListener = d3.behavior.zoom().scaleExtent([0.2, 6]).on("zoom", popupZoom);
        var svg = d3.select("#topology-container").append("svg")
            .attr("id","content")
            .attr("class","container")
            .attr("width", $('#topology-container').width())
            .attr("height", $('#topology-container').height())
            .attr("transform", "translate(0,0)")
            .call(zoomListener);

        svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "#f5f5f5");

        //red gradient
        var red = svg.append("svg:defs")
            .append("svg:radialGradient")
            .attr("id","red")
            .attr("cx","50%")
            .attr("cy","50%")
            .attr("fx","50%")
            .attr("fy","50%")
            .attr("spreadMethod","pad")
        red.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#f58869")
            .attr("stop-opacity", 1);

        red.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#fd0303")
            .attr("stop-opacity", 1);

        //orange gradient
        var orange = svg.append("svg:defs")
            .append("svg:radialGradient")
            .attr("id","orange")
            .attr("cx","50%")
            .attr("cy","50%")
            .attr("fx","50%")
            .attr("fy","50%")
            .attr("spreadMethod","pad")
        orange.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffc080")
            .attr("stop-opacity", 1);

        orange.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#fda003")
            .attr("stop-opacity", 1);

        //yellow gradient
        var yellow = svg.append("svg:defs")
            .append("svg:radialGradient")
            .attr("id","yellow")
            .attr("cx","50%")
            .attr("cy","50%")
            .attr("fx","50%")
            .attr("fy","50%")
            .attr("spreadMethod","pad")
        yellow.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffff99")
            .attr("stop-opacity", 1);

        yellow.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#ffd701")
            .attr("stop-opacity", 1);

        //white gradient
        var white = svg.append("svg:defs")
            .append("svg:radialGradient")
            .attr("id","white")
            .attr("cx","50%")
            .attr("cy","50%")
            .attr("fx","50%")
            .attr("fy","50%")
            .attr("spreadMethod","pad")
        white.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffffff")
            .attr("stop-opacity", 1);

        white.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#dddddd")
            .attr("stop-opacity", 1);

        //green gradient
        var green = svg.append("svg:defs")
            .append("svg:radialGradient")
            .attr("id","green")
            .attr("cx","50%")
            .attr("cy","50%")
            .attr("fx","50%")
            .attr("fy","50%")
            .attr("spreadMethod","pad");
        green.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#9ecd5e")
            .attr("stop-opacity", 1);

        green.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#5ca301")
            .attr("stop-opacity", 1);
        //grey gradient
        var grey = svg.append("svg:defs")
            .append("svg:radialGradient")
            .attr("id","grey")
            .attr("cx","50%")
            .attr("cy","50%")
            .attr("fx","50%")
            .attr("fy","50%")
            .attr("spreadMethod","pad");
        grey.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#c3c3c3")
            .attr("stop-opacity", 1);

        grey.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#8f8f8f")
            .attr("stop-opacity", 1);

        //shadow
        var shadow = svg.append("svg:defs")
            .append("svg:filter")
            .attr("id","shadow")
            .attr("x",0)
            .attr("y",0)
            .attr("width","200%")
            .attr("height","200%");
        shadow.append("feOffset")
            .attr("result", "offOut")
            .attr("in", "SourceAlpha")
            .attr("dx", 1)
            .attr("dy", 1);
        shadow.append("feGaussianBlur")
            .attr("result", "blurOut")
            .attr("in", "offOut")
            .attr("stdDeviation", 1);
        shadow.append("feBlend")
            .attr("in", "SourceGraphic")
            .attr("in2", "blurOut")
            .attr("mode", "normal");

        //red shadow for lost communication node
        /*
         <filter id="f4" x="0" y="0" width="200%" height="200%">
         <feOffset result="offOut" in="SourceGraphic" dx="20" dy="20" />
         <feColorMatrix result="matrixOut" in="offOut" type="matrix"
         values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />
         <feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="10" />
         <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
         filterUnits="objectBoundingBox"
         </filter>
         <animate id="animation1"
         attributeName="opacity"
         from="0" to="1" dur="1s"
         begin="0s;animation2.end" />
         <animate id="animation2"
         attributeName="opacity"
         from="1" to="0" dur="1s"
         begin="animation1.end" />
         */
        var red_shadow = svg.append("svg:defs")
            .append("svg:filter")
            .attr("id","red_shadow")
            .attr("x",0)
            .attr("y",0)
            .attr("width","200%")
            .attr("height","200%");
        red_shadow.append("feOffset")
            .attr("result", "offOut")
            .attr("in", "SourceAlpha")
            .attr("dx",3)
            .attr("dy",3)
        var feColorMatrix = red_shadow.append("feColorMatrix")
            .attr("type", "matrix")
            .attr("in", "offOut")
            .attr("result","matrixOut")
            .attr("values", "1 0 0 0 0.3 0  0 0 0  0 0 0 0 0 0 0  0 0 0.9 0")
        var animate1 = feColorMatrix.append("animate")
        animate1.attr("attributeName","values")
        animate1.attr("repeatCount","indefinite")
        animate1.attr("from","1 0 0 0 0.3 0  0 0 0  0 0 0 0 0 0 0  0 0 0.9 0")
        animate1.attr("to","1 0 0 0 0.3 0  0 0 0  0 0 0 0 0 0 0  0 0 0 0")
        animate1.attr("dur","1s")
        var animate2 = feColorMatrix.append("animate")
        animate2.attr("attributeName","values")
        animate1.attr("repeatCount","indefinite")
        animate2.attr("from","1 0 0 0 0.3 0  0 0 0  0 0 0 0 0 0 0  0 0 0 0")
        animate2.attr("to","1 0 0 0 0.3 0  0 0 0  0 0 0 0 0 0 0  0 0 0.9 0")
        animate2.attr("dur","1s")
        red_shadow.append("feGaussianBlur")
            .attr("result", "coloredBlur")
            .attr("stdDeviation", 5);
        red_shadow.append("feBlend")
            .attr("in", "SourceGraphic")
            .attr("mode", "normal");
        /*
         red_shadow.append("svg:animate")
         .attr('id',"animation1")
         .attr("attributeName", "opacity")
         .attr("from", "0")
         .attr("to", "1")
         .attr("dur","1s")
         .attr("begin", "0s;animation2.end")
         red_shadow.append("svg:animate")
         .attr('id',"animation2")
         .attr("attributeName", "opacity")
         .attr("from", "1")
         .attr("to", "0")
         .attr("dur","1s")
         .attr("begin", "0s;animation1.end")*/


        var selected_shadow = svg.append("svg:defs")
            .append("svg:filter")
            .attr("id","selected_shadow")
            .attr("x",0)
            .attr("y",0)
            .attr("width","200%")
            .attr("height","200%");
        selected_shadow.append("feOffset")
            .attr("result", "offOut")
            .attr("in", "SourceAlpha")
            .attr("dx",10)
            .attr("dy",10)
        var feColorMatrix = selected_shadow.append("feColorMatrix")
            .attr("type", "matrix")
            .attr("in", "offOut")
            .attr("result","matrixOut")
            .attr("values", "0 0 0 0 0 0 0 0 0.1 0 0 0 0 0.9 0 0 0 0 1 0")
        selected_shadow.append("feGaussianBlur")
            .attr("result", "coloredBlur")
            .attr("stdDeviation", 5);
        selected_shadow.append("feBlend")
            .attr("in", "SourceGraphic")
            .attr("mode", "normal");



        var svgGroup = svg.append("g");

        var svgPopupContainer = d3.select("#popup_content").append("svg")
            .attr("width", "100%")
            .attr("height","100%")
            .attr("transform", "translate(0,0)")
        //.call(popupZoomListener);
        var svgPopup = svgPopupContainer.append("g").attr('id','g_popup_content');




    function zoom() {
        if(!$('#popup').is(':visible')) {
            svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            svgGroup.selectAll("circle").attr("r", (7 / d3.event.scale));
            //show sector group and zone label first due to space concern
            if (d3.event.scale > 1.5 && d3.event.scale < 3) {
                svgGroup.selectAll("text.grp_label").style("visibility", "visible");
                svgGroup.selectAll("text.grp_label").attr("font-size", (1 / d3.event.scale) + "em");
            } else if (d3.event.scale > 3) {
                svgGroup.selectAll("text.device_label").style("visibility", "visible");
                svgGroup.selectAll("text.device_label").attr("font-size", (1 / d3.event.scale) + "em");
                svgGroup.selectAll("text.grp_label").attr("font-size", (1 / d3.event.scale) + "em");
            }else {
                svgGroup.selectAll("text.device_label, text.grp_label").style("visibility", "hidden");
            }
        }
    }
    function popupZoom() {
        svgPopup.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        svgPopup.selectAll("circle").attr("r", 7 / d3.event.scale);
        svgPopup.selectAll("path").style("stroke-width", 5 / d3.event.scale);
    }
    // when window resize, redraw topology

    function resizedw(){
        updateScreenSize();
        $('#popup').hide();
        //svg.attr("width", wWidth - wMargin.right).attr("height", wHeight - wMargin.bottom);
        //redraw

        getData($.cookie('viewMode'));
        /*
         $('g#SECTGRP_overall-status').remove();
         svgGroup.selectAll("g.SECTGRP").remove();
        if(nodeSectorList != undefined && nodeSectorList.length>0){
            drawTopology(nodeSectorList);
        }
        $('.layer_header:not(g#SECTGRP_overall-status)').remove();
        svgGroup.selectAll("g:not(.SECTGRP):not(.SECTGRP_layer_header)").remove();
        if(nodeAPOIList != undefined && nodeAPOIList.length>0){
            drawTopology(nodeAPOIList);
        }
        if(nodeMTDIList != undefined && nodeMTDIList.length>0) {
            drawTopology(nodeMTDIList);
        }
        if(nodeMSDHList != undefined && nodeMSDHList.length>0){
            drawTopology(nodeMSDHList);
        }
        if(nodeRemoteList != undefined && nodeRemoteList.length>0){
            drawTopology(nodeRemoteList);
        }
        */
    }
    //make sure to wait till the resize end then update drawing
    var doit;
    window.onresize = function(){
        console.log("am i resizing?")
        clearTimeout(doit);
        doit = setTimeout(resizedw, 500);
    };

    function getNodeID(node){
        var nodeID
        if(node.indexOf(":") == -1){
            nodeID = node;
        }else {
            nodeID = node.substring(0, node.indexOf(":"));
        }
        return nodeID;
    }
    function getSlotID(node){
        var slotID
        if(node.indexOf(":") == -1){
            slotID = "";
        }else {
            slotID = node.substring(node.indexOf(":")+1,node.length);
        }
        return slotID;
    }

    function getLocalConnection(n){
        var connections = [{"node":[],"conn":[]}];
        if(n["Node Type"] !="SECTGRP" && n["Node Type"] !="ZONE"){
            connections[0].node.push(n);
        }else{


        //acc1 = n.children.length+1;
        acc1 = 30;
        for (var i = 0; i < n.children.length; i++) {
            if(n.children[i]["Node Type"] && n.children[i]["Node Type"].indexOf("RRU") != -1){


            if(n.children[i].ID && nodeOrder[n.children[i].ID])
                n.children[i].NodeOrder = nodeOrder[n.children[i].ID];
            else
                n.children[i].NodeOrder = acc1++;
            //console.log("n.children[i]",n.children[i].ID,n.children[i].NodeOrder);
            }
        }
        //console.log("n.children",n.children)



            $.each(n.children,function(i,child){
                connections[0].node.push(child);
            })
        }
        //console.log(unfilteredConnectionList);
        $.each(connections[0].node,function(index,node){
            $.each(unfilteredConnectionList, function(key, conn){
                if(conn.ID.indexOf("RF") !=-1){
                    if(node.ID === getNodeID(conn.conn[0]["From"])){
                        _.filter(totalNodeList,function(value){
                            if(value.children !=undefined && value.children.length>0){
                                $.each(value.children,function(i,child){
                                    if(child.ID ===getNodeID(conn.conn[0]["To"])){
                                        connections[0].conn.push({"id":conn.ID,"type":conn.Type,"source":node, "sourceSlot":getSlotID(conn.conn[0]["From"]),"target":child,"targetSlot":getSlotID(conn.conn[0]["To"])});
                                        connections[0].node.push(child);
                                    }
                                })
                            }else{
                                if(value.ID === getNodeID(conn.conn[0]["To"])){
                                    connections[0].conn.push({"id":conn.ID,"type":conn.Type,"source":node,"sourceSlot":getSlotID(conn.conn[0]["From"]),"target":value,"targetSlot":getSlotID(conn.conn[0]["To"])});
                                    connections[0].node.push(value);
                                }
                            }
                        });

                    }else if(node.ID === getNodeID(conn.conn[0]["To"])){
                        _.filter(totalNodeList,function(value){
                            if(value["Node Type"] ==="SECTGRP" && value.children.length>0){
                                $.each(value.children,function(i,child){
                                    if(child.SectorID ===getNodeID(conn.conn[0]["From"])){
                                        connections[0].conn.push({"id":conn.ID,"type":conn.Type,"source":child, "sourceSlot":getSlotID(conn.conn[0]["From"]),"target":node,"targetSlot":getSlotID(conn.conn[0]["To"])});
                                        connections[0].node.push(child);
                                    }
                                })
                            }else{
                                if(value.ID === getNodeID(conn.conn[0]["From"])){
                                    connections[0].conn.push({"id":conn.ID,"type":conn.Type,"source":value,"sourceSlot":getSlotID(conn.conn[0]["From"]),"target":node,"targetSlot":getSlotID(conn.conn[0]["To"])});
                                    connections[0].node.push(value);
                                }
                            }
                        });
                    }
                }else{
                    if(node.ID === getNodeID(conn["Node X"])){
                        _.filter(totalNodeList,function(value){
                            if(value.children !=undefined && value.children.length>0){
                                //this is a case of MSDH connect to RRU
                                $.each(value.children,function(i,child){
                                    if(child.ID ===getNodeID(conn["Node Y"])){
                                        connections[0].conn.push({"id":conn.ID,"source":node,"sourceSlot":getSlotID(conn["Node X"]),"target":child,"targetSlot":getSlotID(conn["Node Y"])});
                                        connections[0].node.push(child);
                                        //check if this child is chained with other RRU
                                        $.each(unfilteredConnectionList, function(key2, conn2){
                                            if(conn2.ID.indexOf("RF") === -1 && child.ID ===getNodeID(conn2["Node X"])){
                                                var targetNode={};
                                                $.each(totalNodeList,function(j,node){
                                                    if(node.children !=undefined && node.children.length>0) {
                                                        $.each(node.children, function (k, nodeChild) {
                                                            if (node.children != undefined && nodeChild.ID === getNodeID(conn2["Node Y"])) {
                                                                targetNode = nodeChild;
                                                            }
                                                        })
                                                    }

                                                })
                                                connections[0].conn.push({"id":conn2.ID,"source":child,"sourceSlot":getSlotID(conn2["Node X"]),"target":targetNode,"targetSlot":getSlotID(conn2["Node Y"])});
                                                connections[0].node.push(targetNode);
                                            }
                                        })
                                    }
                                })
                            }else{
                                if(value.ID === getNodeID(conn["Node Y"])){
                                    connections[0].conn.push({"id":conn.ID,"source":node,"sourceSlot":getSlotID(conn["Node X"]),"target":value,"targetSlot":getSlotID(conn["Node Y"])});
                                    connections[0].node.push(value);
                                }
                            }
                        });

                    }else if(node.ID === getNodeID(conn["Node Y"])){
                        _.filter(totalNodeList,function(value){
                            if(value.children !=undefined && value.children.length>0){
                                $.each(value.children,function(i,child){
                                    if(child.ID ===getNodeID(conn["Node X"])){
                                        connections[0].conn.push({"id":conn.ID,"source":child,"sourceSlot":getSlotID(conn["Node X"]),"target":node,"targetSlot":getSlotID(conn["Node Y"])});
                                        connections[0].node.push(child);
                                    }
                                })
                            }else{
                                if(value.ID === getNodeID(conn["Node X"])){
                                    connections[0].conn.push({"id":conn.ID,"source":value,"sourceSlot":getSlotID(conn["Node X"]),"target":node,"targetSlot":getSlotID(conn["Node Y"])});
                                    connections[0].node.push(value);
                                }
                            }
                        });

                    }
                }
            })
        })
        var uniqueConn= connections[0].conn.uniqueObjects();
        var uniqueNode= _.sortBy(connections[0].node.uniqueObjects(),'NodeOrder'); // sort node by NodeOrder to avoid that nodes are displayed randomly on screen
        //connections[0].conn = uniqueConn;
        //connections[0].node = uniqueNode;
        //console.log(uniqueConn);
        //console.log(uniqueNode);
        return {node:uniqueNode,conn:uniqueConn};
    }
    function costumeMTDI(documentFragment, node) {
        if(node["Node Type"] != "MTDI-S"){
            return;
        }

        var MTDISlots = ["_", "false", "false", "false", "false"];
        var MTDISlotsNumType = ["_", "0", "0", "0", "0"];
        var MTDISlotsType = ["_", "0", "0", "0", "0"];
        var index = 1;
        var node_rf_range_data = _.where(rfrangesList, {
           ID: node.ID
        });
        if (node_rf_range_data[0] !== undefined) {
           if (node_rf_range_data[0].Ranges.length > 0) {
               $.each(node_rf_range_data[0].Ranges, function (index, val) {
                   $.each(bandList, function (i, value) {
                        var res = value.FullName;
                        var desc = res.split(" ");
                        fontgan = desc[2].length;
                        if (desc[2] == 'Band'){
                            type = "";
                        }else{
                            type = desc[2];
                            //console.log(desc[2].length)
                        }
                        if(value.Band == val.Type){
                            //console.log(i, value.FullName);
                            val.Band = val.Band.replace("1:","");
                            MTDISlots[val.Band] = "true";
                            MTDISlotsNumType[val.Band] = desc[0];
                            MTDISlotsType[val.Band] = type;
                        }
                    })
               });
           }
        }

        for (index = 1; index < MTDISlots.length; index++) {
            if (MTDISlots[index] === "false") {
                var slotNum = index;

                var grayColor = "#aeacb6";
                // var pathLine = documentFragment.getElementById("Slot" + slotNum);
                // pathLine.style.fill = grayColor;
                var rectLine = documentFragment.getElementById("Slot" + slotNum);
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById("Slot" + slotNum);
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById("Slot" + slotNum);
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById("Slot" + slotNum);
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                // var textField = documentFragment.getElementById("Slot" + slotNum + "Text");
                // textField.style.fill = "green";
            }else {
                var slotNum = index;

                var textField = documentFragment.getElementById("Slot" + slotNum + "Text");
                var textField2 = documentFragment.getElementById("Slot" + slotNum + "Text2");
                if(MTDISlotsType[slotNum].length == 3){
                    textField2.style.fontSize = "12px";
                } else if (MTDISlotsType[slotNum].length > 2) {
                    textField2.style.fontSize = "9px";
                }else{
                    textField2.style.fontSize = "16px";
                }
                var bandText = document.createTextNode(MTDISlotsNumType[slotNum]);
                var bandText2 = document.createTextNode(MTDISlotsType[slotNum]);
                textField.appendChild(bandText);
                textField2.appendChild(bandText2);
              }
        }
        // var MTDINumDisp = documentFragment.getElementById("MTDINumText");
        // var MTDINumber= node.Tag.replace("MTDI-", "");

        // var MTDIName = document.createTextNode(MTDINumber);
        // MTDINumDisp.appendChild(MTDIName);
    }

    function costumeAPOI(documentFragment, node) {
        if(node["Node Type"] != "APOI-S"){
            return;
        }

        var APOISlots = ["_", "false", "false", "false", "false", "false", "false", "false", "false"];
        var APOISlotsType = ["_", "0", "0", "0", "0", "0", "0", "0", "0"];
        var index = 1;
        var node_rf_range_data = _.where(rfrangesList, {
           ID: node.ID
        });
        if (node_rf_range_data[0] !== undefined) {
           if (node_rf_range_data[0].Ranges.length > 0) {
               $.each(node_rf_range_data[0].Ranges, function (index, val) {
                   APOISlots[val.Band] = "true";
                   APOISlotsType[val.Band] = val.Type;
               });
           }
        }

        for (index = 1; index < APOISlots.length; index++) {
            if (APOISlots[index] === "false") {
                var slotNum = index;
                var grayColor = "rgb(200,205,200)";

                var pathLine = documentFragment.getElementById("Slot" + slotNum);
                pathLine.style.fill = grayColor;
                var rectLine = documentFragment.getElementById(slotNum + ":SECT-UL1");
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById(slotNum + ":SECT-UL2");
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById(slotNum + ":SECT-DL1");
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById(slotNum + ":SECT-DL2");
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById(slotNum + ":DL1");
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById(slotNum + ":DL2");
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById(slotNum + ":UL1");
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                rectLine = documentFragment.getElementById(slotNum + ":UL2");
                rectLine.style.fill = grayColor;
                rectLine.style.opacity = "1";
                var textField = documentFragment.getElementById("Slot" + slotNum + "Text");
                textField.style.fill = "green";
            }else {
                var slotNum = index;

                var textField = documentFragment.getElementById("Slot" + slotNum + "Text");
                var bandText = document.createTextNode(APOISlotsType[slotNum]);

                textField.appendChild(bandText);
              }
        }
        var APOINumDisp = documentFragment.getElementById("APOINumText");
        var APOINumber= node.Tag.replace("APOI-", "");

        var APOIName = document.createTextNode(APOINumber);
        APOINumDisp.appendChild(APOIName);
    }


    function drawLocalConnection(node){
        //update dimension detail in case the screen was resized
        updateScreenSize()
        //disable zoom while drawing popup screen
        svgPopupContainer.call(d3.behavior.zoom().on("zoom", null));
        //for firefox to refresh before loading new data
        svgPopup.selectAll("*").remove();
        var connectionList;
        //connectionList = getLocalConnection(node);
        connectionList = getLocalConnection(node);

        //console.log(connectionList);
        connectionList.node = _.groupBy(connectionList.node,function(value){
            return value.layer;
        });

        if(node["Node Type"] == "SECTGRP"){
            $('#popup_header_text').text("Local connection of BTS port group "+ node.ID);
        }else if(node["Node Type"] == "ZONE"){
            $('#popup_header_text').text("Local connection of zone "+ node.ID);
        }else{
            $('#popup_header_text').text("Local connection of node "+ node.ID);
        }
        $('#popup').show();
        if($.cookie('viewMode') =="topology"){
            $('#left_side_bar').addClass('none');
        }else{
            $('#left_side_bar').removeClass('none');
        }
        //reset translate and scale of popup window
        for (var j = 0; j < 2; j++)
        {
        popupZoomListener.translate([0, 0]);
        popupZoomListener.scale(1);
        svgPopup.attr("transform", "translate(0,10) scale(1)");
         var layerCount = 0;
         //go through each node from the connection list node and sort out the scale for each node
         $.each(connectionList.node, function (index, layer) {
            var allowedWidth;
            var widthRatio;
            var totalWidth;
            var totalHeight;
            //apply different scale for sector and remotes, make bigger APOI, MTDI, and MSDH
            if (layer[0]["Node Type"].indexOf("VIRT_SECT") === -1 && layer[0]["Node Type"].indexOf("RRU") === -1) {
                allowedWidth = ((popupWidth - popupMargin.right) / layer.length - 6);
                widthRatio = allowedWidth / (layer[0].popup_width);
                totalWidth = 0;
                if (widthRatio >= 1) {
                    totalWidth = (layer[0].popup_width) + ((popupWidth - popupMargin.right) - (layer[0].popup_width * layer.length)) / layer.length / 2;
                    totalHeight = layer[0].popup_height;
                } else if (widthRatio < 1 && widthRatio > 0.5) {
                    //totalWidth = allowedWidth;
                    totalWidth = layer[0].popup_width;
                    totalHeight = layer[0].popup_height;
                } else {
                    totalWidth = layer[0].popup_width;
                    totalHeight = layer[0].popup_height;
                    //widthRatio = 0.5;
                }
            } else {
                allowedWidth = ((popupWidth - popupMargin.right) / layer.length - 6);
                widthRatio = allowedWidth / layer[0].width;
                totalWidth = 30;
                totalHeight = layer[0].height;
                if (widthRatio >= 1) {
                    //totalWidth = layer[0].width + ((wWidth - wMargin.right) - (layer[0].width * layer.length)) / layer.length / 2;
                } else if (widthRatio < 1 && widthRatio > 0.5) {
                    //totalWidth = allowedWidth;
                } else {
                    //totalWidth = layer[0].width / 2;
                    widthRatio = 0.5;
                }
            }

            //go through each layer and move nodes on screen to its own layer (sector, APOI, MTDI, MSDH, RRU)
            if ((layer[0]["Node Type"].indexOf("RRU") == -1) && (layer[0]["Node Type"].indexOf("VIRT_SECT") == -1))
            {
               var counter = 0;
               layer.forEach(function (d) {
                   d.x = counter * (totalWidth + 200) + popupMargin.right + totalWidth / 2;
                   if (layer[counter]["Node Type"].indexOf("MSDH") != -1)
                   {
                     msdhX[layer[counter]["ID"]] = d.x;
                   }
                   else if (layer[counter]["Node Type"].indexOf("MTDI") != -1)
                   {
                     mtdiX[layer[counter]["ID"]] = d.x;
                   }
                   else if (layer[counter]["Node Type"].indexOf("APOI") != -1)
                   {
                     apoiX[layer[counter]["ID"]] = d.x;
                   }
                   d.y = popupHeight / 3 * layerCount + 70; //3 layer nodes
                   counter++;
               })
            }
            else if (layer[0]["Node Type"].indexOf("VIRT_SECT") != -1)
            {
               var counter = 0;
               MTDI_BTS = {};
               SECT_IND = {};
               layer.forEach(function (d) {
                  d.x=30;
                  d.y=30;
                  for(var k = 0; k < rfConns.length; k ++)
                  {
                     if (rfConns[k].conn[0]["From"] != layer[counter]["ID"])
                        continue;

                     d.x = 0;

                     var to = rfConns[k].conn[0]["To"].split(":");
                     var toType = rfConns[k].conn[0]["ToType"];
                     var from = rfConns[k].conn[0]["From"];
                     var port = 0;
                     var yShift = 0;
                     if (toType.indexOf("MSDH") != -1)
                     {
                        yShift = 80;
                        port = Number.parseInt(to[1]);
                        var msdh = to[0];
                        if (msdhX[msdh] != undefined)
                           d.x = msdhX[msdh] - 200 + ((port - 1) * 35);
                           SECT_IND[from] = port;
                     }
                     else if (toType.indexOf("APOI") != -1)
                     {
                        yShift = 40;
                        port = Number.parseInt(to[1]);
                        var apoi = to[0];
                        var key = to[0] +":"+to[1];
                        parsePort = port * 2;
                        if(!MTDI_BTS[key])
                        {
                            port = parsePort - 1;
                            MTDI_BTS[key] = 1;
                        }
                        else
                        {
                            port = parsePort;
                        }
                        if (apoiX[apoi] != undefined) {
                            d.x = apoiX[apoi] - 350 + ((port - 1) * 40);
                            SECT_IND[from] = port;
                        }
                        //console.log("APOI" ,from,port,d.x);
                     }
                     else if (toType.indexOf("MTDI") != -1)
                     {
                        // MTDI TO BTS
                        yShift = 50;
                        slot = to[2];
                        port = to[3];
                        var parsePort = Number.parseInt(port.slice(2));
                        if(parsePort == 2)
                            parsePort = 3;
                        if(!MTDI_BTS[to+":"+parsePort])
                        {
                            port = parsePort;
                            MTDI_BTS[to+":"+parsePort] = 1
                        }
                        else
                        {
                            port = parsePort + 1
                        }
                        var mtdi = to[0];
                        if (mtdiX[mtdi] != undefined) {
                            // support on 16 BTS per mtdi
                            d.x = mtdiX[mtdi] - 300 + ((slot - 1) * 4 + port) * 35;
                            SECT_IND[from] = ((slot - 1) * 4 + port);
                        }
                     }
                     else
                        console.log("d.x Error!!!");
                     d.y = popupHeight / 3 * layerCount + 100 - yShift;
                  }
                  counter++;
               })
            }
            else //RRU
            {
               var counter = 0;
               layer.forEach(function (d) {
                  d.x = 0 + ((counter%2) * 30);
                  d.y = 75 + (Math.floor(counter/2)*50);
                  counter++;
               })

               for(var k = 0; k < bundles.length; k++)
               {
                  yShift = 30;
                  var arr;
                  var port;
                  var nodeCounter = 0;
                  for(var l = 0; l < conns.length; l++)
                  {
                     arr = conns[l]['Node Y'].split(":");
                     if (arr[0] == bundles[k].nodes[0].ID)
                     {
                        arr = conns[l]['Node X'].split(":");
                        port = arr[2];
                        break;
                     }
                  }
                  for(var m = 0; m < bundles[k].nodes.length; m++)
                  {
                     var counter = 0;
                     layer.forEach(function (d) {
                        if (bundles[k].nodes[m].ID == layer[counter]["ID"])
                        {
                            msdh = arr[0];
                            if (msdhX[msdh] != undefined) {
                                d.x = msdhX[msdh] - 350 + ((port - 1) * 50);
                            }
                            d.y = popupHeight / 3 * layerCount + yShift + (nodeCounter * 70);
                            nodeCounter++;
                        }
                        counter++;
                     })
                  }
               }
            }

          if (j == 1)
          {
            layerCount++;
            if (layer[0]["Node Type"].indexOf("MSDH") != -1) {
                localNode = svgPopup.selectAll("g.popup_MSDH")
                    .data(layer.filter(function (d) {
                        return d.ID;
                    }));
            } else if (layer[0]["Node Type"].indexOf("RRU") != -1) {
                localNode = svgPopup.selectAll("g.popup_RRU")
                    .data(layer.filter(function (d) {
                        return d.ID;
                    }));
            } else {
                localNode = svgPopup.selectAll("g.popup_" + layer[0]["Node Type"])
                    .data(layer.filter(function (d) {
                        return d.ID || d.SectorID;
                    }));
            }

            var popupLayout = localNode.enter().append("g")
                .attr("id", function (d) {
                    return "popup_" + d.ID;
                })
                    // NodeOrder for debug
                    .attr("idb", function (d) {
                        return "NodeOrder" + d.NodeOrder + "";
                    })

                .attr("class", function (d) {
                    if (d["Node Type"].indexOf("MSDH") != -1) {
                        return "popup_MSDH popup_nodes";
                    } else if (d["Node Type"].indexOf("RRU") != -1) {
                        return "popup_RRU popup_nodes";
                    } else {
                        return "popup_" + d["Node Type"] + " popup_nodes"
                    }
                })
                .attr("cursor", "pointer")
                .attr("data-id", function (d) {
                    return d.ID;
                })
                .attr("data-node-type", function (d) {
                    return d["Node Type"];
                })
                .attr("data-tag", function (d) {
                    return d["Tag"];
                })
                .attr("transform", function (d) {
                    return "translate(" + popupWidth / 2 + "," + 100 + ")"
                })
                .on('click', function (d) {
                    displayNodeDetails(d);
                    //displayNodeDetails(d);
                });
            if (layer[0]["Node Type"].indexOf("APOI") === -1 && layer[0]["Node Type"].indexOf("MTDI") === -1 && layer[0]["Node Type"].indexOf("MSDH") === -1) {
                popupLayout.append("svg:image")
                    .attr("xlink:href", function (d) {
                        if (d["Node Type"].indexOf("VIRT_SECT") != -1) {
                            return ("../images/icons/sector_icon.png")
                        }
                        else if (d["Node Type"].indexOf("RRU40") != -1) {
                            return ("../images/icons/RRU40_bigicon.png")
                        }
                        else if (d["Node Type"].indexOf("RRU") != -1) {
                            return ("../images/icons/RRU_bigicon.png")
                        }
                    })
                    .attr("id", function (d) {
                        return "popup_" + d.ID + "_img";
                    })
                    .attr("class", function (d) {
                        return "popup_" + d["Node Type"] + "_img"
                    })
                    .attr("data-id", function(d){
                        return d.ID;
                    })
                    .attr("data-node-type", function(d){
                        return d["Node Type"];
                    })
                    .attr("data-location", function(d){
                        return d["Location"];
                    })
                    .attr('x', totalWidth / 2 * (-1))
                    .attr('y', function (d) {
                        if (d["Node Type"].indexOf("VIRT_SECT") === -1 && d["Node Type"].indexOf("RRU") === -1) {
                            return d.popup_height / 2 * (-1);
                        } else {
                            return d.height / 2 * (-1)
                        }
                    })
                    .attr("width", totalWidth)
                    .attr("height", totalHeight)
                    .style("filter", function(d){
                        if(d.Comm == "1"){
                            return "url(#red_shadow)";
                        }else{
                            if(displayedNode != null)
                                if(d.ID != displayedNode.ID)
                                    return "url(#shadow)";
                                else
                                    return "none";

                        }
                    })
                    .on('click', function (d) {
                        var list = $('#popup').find("g").removeAttr("style");
                        $('#popup').find("#popup_" + d.ID).attr("style", "filter: url(#selected_shadow)");
                    })
                //add led to sector and RRU
                popupLayout.append("svg:circle")
                    .attr("id", function (d) {
                        return "popup_" + d.ID + "_led";
                    })
                    .attr("class", function (d) {
                        if (d["Node Type"].indexOf("VIRT_SECT") != -1){
                            for (var i = 0; i < sectorsAlarm.length; i++){
                              if (d.ID == sectorsAlarm[i])
                                 return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led red";
                            }
                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led green";
                        }else{
                           if(d.Comm === "-"){
                               return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led grey";
                           }else if(d.Comm === "1"){
                               return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led green";
                           }else if(d.Comm === "0" && d.Status ==="0"){
                               return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led red";
                           }else if(d.Comm === "0" && d.Status ==="1"){
                               return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led orange";
                           }else if(d.Comm === "0" && d.Status ==="2"){
                               return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led yellow";
                           }else if(d.Comm === "0" && d.Status ==="3"){
                               return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led white";
                           }else if(d.Comm === "0" && d.Status ==="4"){
                               return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led green";
                           }else{
                               return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led grey";
                           }
                        }
                    })
                    .attr("cx", function (d) {
                        if (d["Node Type"].indexOf("VIRT_SECT") === -1 && d["Node Type"].indexOf("RRU") === -1) {
                            //if (widthRatio > 1) {
                            return d.popup_width / 2 - 1;
                            /*} else {
                             return d.popup_width * widthRatio / 2 - 50;
                             }*/
                        } else {
                            if (widthRatio > 1) {
                                return d.width / 2 - 1;
                            } else {
                                return d.width * widthRatio / 2 - 1;
                            }
                        }
                    })
                    .attr("cy", function (d) {
                        if (d["Node Type"].indexOf("VIRT_SECT") === -1 && d["Node Type"].indexOf("RRU") === -1) {
                            if (widthRatio > 1) {
                                return d.popup_height / 2 * (-1);
                            } else {
                                return d.popup_height / 2 * widthRatio * (-1);
                            }
                        } else {
                            if (widthRatio > 1) {
                                return d.height / 2 * (-1);
                            } else {
                                return d.height / 2 * widthRatio * (-1);
                            }
                        }
                    })
                    .attr("r", function (d) {
                        if (widthRatio > 1) {
                            return 8;
                        } else {
                            return 8 * widthRatio;
                        }
                    })
                    .style("fill", function (d) {
                        if(d.Comm === "-"){
                            return "url(#grey)";
                        }else if(d.Comm === "1"){
                            return "url(#red)";
                        }else if(d.Comm === "0" && d.Status ==="0"){
                            return "url(#red)";
                        }else if(d.Comm === "0" && d.Status ==="1"){
                            return "url(#orange)";
                        }else if(d.Comm === "0" && d.Status ==="2"){
                            return "url(#yellow)";
                        }else if(d.Comm === "0" && d.Status ==="3"){
                            return "url(#white)";
                        }else if(d.Comm === "0" && d.Status ==="4"){
                            return "url(#green)";
                        }else{
                            return "url(#grey)";
                        }
                    })
            } else {
                var svgFile;
                if (layer[0]["Node Type"].indexOf("APOI") != -1) {
                    svgFile = "../images/icons/APOI_bigicon.svg";
                } else if (layer[0]["Node Type"].indexOf("MTDI") != -1) {
                    svgFile = "../images/icons/MTDI_bigicon.svg";
                } else if (layer[0]["Node Type"].indexOf("MSDH") != -1) {
                    svgFile = "../images/icons/MSDH_bigicon.svg";
                }
                popupLayout.each(function (d, i) {
                    d3.xml(svgFile,
                        function (error, documentFragment) {
                            if (error) {
                                console.log(error);
                                return;
                            }
                            var svgImg = documentFragment
                                .getElementsByTagName("g")[0];
                            // to access node inside popupLayout for that layer ===> popupLayout[0][i])

                            if (layer[0]["Node Type"].indexOf("APOI") !== -1) {
                                costumeAPOI(documentFragment, layer[0]);
                            }
                            if (layer[0]["Node Type"].indexOf("MTDI") !== -1) {
                                costumeMTDI(documentFragment, layer[i]);
                            }
                            popupLayout[0][i].appendChild(svgImg);

                            svgImg.onclick = function (e) {
                                var list = $('#popup').find("g").removeAttr("style");
                                document.getElementById("popup_" + d.ID + "_img").setAttribute("style", "filter: url(#selected_shadow)");
                            }

                            popupLayout.select("g")
                                .attr("id", function (d) {
                                    return "popup_" + d.ID + "_img";
                                })
                                .attr("class", function (d) {
                                    //return "popup_" + d["Node Type"] + "_img"
                                    return "popup_" + d["Node Type"] + " popup_nodes_img"
                                })
                                .attr('x', totalWidth / 2 * (-1))
                                .attr('y', function (d) {
                                    return d.popup_height / 2 * (-1);
                                })
                                .attr("width", totalWidth)
                                .attr("height", totalHeight)

                                .attr("data-id", function (d) {
                                    return d.ID;
                                })
                                .attr("data-node-type", function (d) {
                                    return d["Node Type"];
                                })
                                .attr("transform", function (d) {
                                    //if(widthRatio >1){
                                    return "translate(" + d.popup_width / 2 * (-1) + "," + d.popup_height / 2 * (-1) + ") scale(" + d.popup_width / 800 + ")";
                                    /*}else{
                                     return "translate(" + d.popup_width / 2 * (-1) + "," + d.popup_height / 2 * (-1) + ") scale(" + widthRatio*d.popup_width/800 +")";
                                     }*/

                                })
                                .style("filter", function(d){
                                    if(d.Comm == "1"){
                                        return "url(#red_shadow)";
                                    }else{
                                        if(displayedNode != null)
                                            if(d.ID != displayedNode.ID)
                                                return "url(#shadow)";
                                            else
                                                return "url(#selected_shadow)";
                                    }
                                })
                            //add led to APOI, MTDI and MSDH
                            popupLayout.append("svg:circle")
                                .attr("id", function (d) {
                                    return "popup_" + d.ID + "_led";
                                })
                                .attr("class", function (d) {
                                    if (d["Node Type"].indexOf("MSDH-M") === -1) {
                                        if(d.Comm === "-"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led grey";
                                        }else if(d.Comm === "1"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led green";
                                        }else if(d.Comm === "0" && d.Status ==="0"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led red";
                                        }else if(d.Comm === "0" && d.Status ==="1"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led orange";
                                        }else if(d.Comm === "0" && d.Status ==="2"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led yellow";
                                        }else if(d.Comm === "0" && d.Status ==="3"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led white";
                                        }else if(d.Comm === "0" && d.Status ==="4"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led green";
                                        }else{
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led grey";
                                        }
                                    } else {
                                        if(d.Status === "-"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led grey";
                                        }else if(d.Status ==="0"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led red";
                                        }else if(d.Status ==="1"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led orange";
                                        }else if(d.Status ==="2"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led yellow";
                                        }else if(d.Status ==="3"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led white";
                                        }else if(d.Status ==="4"){
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led green";
                                        }else{
                                            return "popup_led popup_" + d["Node Type"] + "_" + d.ID + "_led led grey";
                                        }
                                    }
                                })
                                .attr("cx", function (d) {
                                    if (d["Node Type"].indexOf("VIRT_SECT") === -1 && d["Node Type"].indexOf("RRU") === -1) {
                                        //if (widthRatio > 1) {
                                        return d.popup_width / 2 - 1;
                                        /*} else {
                                         return d.popup_width * widthRatio / 2 - 50;
                                         }*/
                                    } else {
                                        if (widthRatio > 1) {
                                            return d.width / 2 - 1;
                                        } else {
                                            return d.width * widthRatio / 2 - 1;
                                        }
                                    }
                                })
                                .attr("cy", function (d) {
                                    if (d["Node Type"].indexOf("VIRT_SECT") === -1 && d["Node Type"].indexOf("RRU") === -1) {
                                        if (widthRatio > 1) {
                                            return d.popup_height / 2 * (-1);
                                        } else {
                                            return d.popup_height / 2 * widthRatio * (-1);
                                        }
                                    } else {
                                        if (widthRatio > 1) {
                                            return d.height / 2 * (-1);
                                        } else {
                                            return d.height / 2 * widthRatio * (-1);
                                        }
                                    }
                                })
                                .attr("r", function (d) {
                                    if (widthRatio > 1) {
                                        return 8;
                                    } else {
                                        return 8 * widthRatio;
                                    }
                                })
                                .style("fill", function (d) {
                                    if (d["Node Type"].indexOf("MSDH-M") === -1) {
                                        if(d.Comm === "-"){
                                            return "url(#grey)";
                                        }else if(d.Comm === "1"){
                                            return "url(#red)";
                                        }else if(d.Comm === "0" && d.Status ==="0"){
                                            return "url(#red)";
                                        }else if(d.Comm === "0" && d.Status ==="1"){
                                            return "url(#orange)";
                                        }else if(d.Comm === "0" && d.Status ==="2"){
                                            return "url(#yellow)";
                                        }else if(d.Comm === "0" && d.Status ==="3"){
                                            return "url(#white)";
                                        }else if(d.Comm === "0" && d.Status ==="4"){
                                            return "url(#green)";
                                        }else{
                                            return "url(#grey)";
                                        }
                                    } else {
                                        if(d.Status === "-"){
                                            return "url(#grey)";
                                        }else if(d.Status === "0"){
                                            return "url(#red)";
                                        }else if(d.Status === "1"){
                                            return "url(#orange)";
                                        }else if(d.Status === "2"){
                                            return "url(#yellow)";
                                        }else if(d.Status === "3"){
                                            return "url(#white)";
                                        }else if(d.Status === "4"){
                                            return "url(#green)";
                                        }else{
                                            return "url(#grey)";
                                        }
                                    }
                                })
                                if(displayedNode != undefined){
                                    if(popupLayout[0][i].__data__.ID == displayedNode.ID){
                                        var list = $('#popup').find("g").removeAttr("style");
                                        document.getElementById("popup_" + displayedNode.ID + "_img").setAttribute("style", "filter: url(#selected_shadow)");
                                    }
                                }
                        })

                })
            }

            // Transition nodes to their new position.
            if (layer[0]["Node Type"].indexOf("MSDH") != -1) {
                var popupLayoutUpdate = svgPopup.selectAll("g.popup_MSDH")
                    .transition()
                    .duration(duration)
                    .attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });
            } else if (layer[0]["Node Type"].indexOf("RRU") != -1) {
                var popupLayoutUpdate = svgPopup.selectAll("g.popup_RRU")
                    .transition()
                    .duration(duration)
                    .attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });
            } else {
                var popupLayoutUpdate = svgPopup.selectAll("g.popup_" + layer[0]["Node Type"])
                    .transition()
                    .duration(duration)
                    .attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });
            }
          }
         })
        }

        setTimeout(function () {
            var count = 0;

            //michael 20/4/16

            //sort list of DIG_CONN by target.NodeOrder
            var sort1 = function (nestedObj, prop, arr) {
                arr.sort(function (a, b) {
                    if (a[nestedObj][prop] < b[nestedObj][prop]) {
                        return -1;
                    } else if (a[nestedObj][prop] > b[nestedObj][prop]) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            };

            sort1("target","ID", connectionList.conn);
            $.each(connectionList.conn, function (index, conn) {
            var portID = conn.sourceSlot.split(":")[1];
                //console.log(conn.source.ID);
                var sourceNode = document.getElementById("popup_" + conn.source.ID);
                var sourceHeight = sourceNode.getBBox().height;
                var sourceWidth;
                var targetWidth;
                if (conn.source["Node Type"].indexOf('VIRT_SECT') === -1 && conn.source["Node Type"].indexOf('RRU') === -1) {
                    sourceWidth = conn.source.popup_width;
                } else {
                    sourceWidth = conn.source.width;
                }

                var source_x = +sourceNode.getAttribute('x');
                var source_y = +sourceNode.getAttribute('y');
                var source_ctm = sourceNode.getCTM();
                var sourceCoords = getScreenCoords(source_x, source_y, source_ctm);
                var targetNode = document.getElementById("popup_" + conn.target.ID);
                var targetHeight = targetNode.getBBox().height;
                if (conn.target["Node Type"].indexOf('VIRT_SECT') === -1 && conn.target["Node Type"].indexOf('RRU') === -1) {
                    targetWidth = conn.target.popup_width;
                } else {
                    targetWidth = conn.target.width;
                }
                var target_x = +targetNode.getAttribute('x');
                var target_y = +targetNode.getAttribute('y');
                var target_ctm = targetNode.getCTM();
                var targetCoords = getScreenCoords(target_x, target_y, target_ctm);
                svgPopup.append("svg:path")
                    .attr("transform", "translate(0,-10)")
                    .attr("id", "conn_" + conn.source.ID + "-" + conn.sourceSlot + "_" + conn.target.ID + "-" + conn.targetSlot)
                    .attr('class', 'connection')
                    .attr('from', conn.source["Node Type"])
                    .attr('from-id', conn.source.ID)
                    .attr('from-port-id', conn.sourceSlot)
                    .attr('to', conn.target["Node Type"])
                    .attr('to-id', conn.target.ID)
                    .attr('to-port-id', conn.targetSlot)
                    .attr('conn-type', conn.type)
                    .attr('conn-id', conn.id)
                    .style("stroke", "grey")
                    .style("stroke-linecap", "round")
                    .style("stroke-width", 5)
                    .style("fill", "none")
                    .style("cursor", "pointer")
                    .attr("d", function () {

                    //michael 20/4/16

                    //offset for sourceCoords x - to MSDH / form MSDH
                    var portIDoffset = sourceCoords.x;
                    if(portID % 2 == 0)
                        portIDoffset += 6;
                        if (conn.source["Node Type"].indexOf('VIRT_SECT') != -1) {
                          idx = SECT_IND[conn.source["SectorID"]];
                          if(idx == undefined)
                              idx = 12;
                            if(idx > 11)
                                idx = 17-idx;
                            return "M" + getSlotPosition(conn.source, sourceCoords.x, sourceWidth, conn.sourceSlot) + " " + Number(sourceCoords.y + sourceHeight / 2 - 5)
                                + " V" + Number(((sourceCoords.y + sourceHeight / 2)-85 + screenResStatus + (12-idx)*8 ) + (((targetCoords.y - targetHeight / 2) - (sourceCoords.y + sourceHeight / 2))*0.4))
                                + " H" + getSlotPosition(conn.target, targetCoords.x, targetWidth, conn.targetSlot)
                                + " V" + Number(targetCoords.y - targetHeight / 2 + 5)
                        } else if (conn.target["Node Type"].indexOf('RRU') != -1) {
                            if (conn.source["Node Type"].indexOf('RRU') != -1) {
                                return "M" + getSlotPosition(conn.source, sourceCoords.x, sourceWidth, conn.sourceSlot) + " " + Number(sourceCoords.y - sourceHeight / 2 +5)
                                    + " V" + Number((sourceCoords.y + sourceHeight / 2 - 56))
                                    + " H" + getSlotPosition(conn.target, targetCoords.x + 31, targetWidth, conn.targetSlot)
                                    + " V" + Number(targetCoords.y - 44)   // targetHeight
                                    + " H" + getSlotPosition(conn.target, targetCoords.x, targetWidth, conn.targetSlot)
                                    + " V" + Number(targetCoords.y - targetHeight / 2 +5)
                            }else {
                                if(portID < 11){
                                    return "M" + getSlotPosition(conn.source, portIDoffset, sourceWidth, conn.sourceSlot) + " " + Number(sourceCoords.y + sourceHeight / 2 - 10)
                                        + " V" + Number((sourceCoords.y + sourceHeight / 2 + 8*portID) + (((targetCoords.y - targetHeight - 222 / 2) - (sourceCoords.y + sourceHeight / 2)) / 2))
                                        + " H" + getSlotPosition(conn.target, targetCoords.x, targetWidth, conn.targetSlot)
                                        + " V" + Number(targetCoords.y - targetHeight / 2 + 5)
                                }else{
                                    return "M" + getSlotPosition(conn.source, portIDoffset, sourceWidth, conn.sourceSlot) + " " + Number(sourceCoords.y + sourceHeight / 2 - 10)
                                        + " V" + Number((sourceCoords.y + sourceHeight / 2 + 8*(18-portID)) + (((targetCoords.y - targetHeight - 222 / 2) - (sourceCoords.y + sourceHeight / 2)) / 2))
                                        + " H" + getSlotPosition(conn.target, targetCoords.x, targetWidth, conn.targetSlot)
                                        + " V" + Number(targetCoords.y - targetHeight / 2 + 5)
                                }
                            }
                        } else if (conn.source["Node Type"].indexOf('MSDH') != -1 && conn.target["Node Type"].indexOf('MSDH') != -1) {
                            return "M" + getSlotPosition(conn.source, sourceCoords.x, sourceWidth, conn.sourceSlot) + " " + Number(sourceCoords.y + sourceHeight / 2 - 40)
                                + " V" + Number((sourceCoords.y + sourceHeight / 2) - 170 + index*10)
                                + " H" + getSlotPosition(conn.target, targetCoords.x, targetWidth, conn.targetSlot)
                                + " V" + Number(targetCoords.y - targetHeight / 2 + 5)
                        } else if (conn.source["Node Type"].indexOf('APOI')!= -1) {
                            return "M" + getSlotPosition(conn.source, sourceCoords.x, sourceWidth, conn.sourceSlot) + " " + Number(sourceCoords.y + sourceHeight / 2 - 10)
                                + " V" + Number((sourceCoords.y + sourceHeight / 2 + index*6) + (((targetCoords.y - targetHeight / 2) - (sourceCoords.y + sourceHeight / 2)) / 2))
                                + " H" + getSlotPosition(conn.target, targetCoords.x, targetWidth, conn.targetSlot)
                                + " V" + Number(targetCoords.y - targetHeight / 2 + 10)
                         } else if (conn.source["Node Type"].indexOf('MSDH')!= -1 && conn.target["Node Type"].indexOf('MTDI') != -1) {
                          idx = conn.sourceSlot;
                          portIDx = idx.split(":");
                          portID = portIDx[1];
                          if(portID == undefined)
                              portID = 12;
                            if(portID > 2)
                                portID = 17-portID;
                            return "M" + getSlotPosition(conn.source, sourceCoords.x, sourceWidth, conn.sourceSlot) + " " + Number(sourceCoords.y + sourceHeight / 2 - 48)
                                + " V" + Number(((sourceCoords.y + 44 + sourceHeight / 2) -100 + (12-portID)*8 ) + (((targetCoords.y - targetHeight / 2) - (sourceCoords.y + sourceHeight / 2)) / 2))
                                + " H" + getSlotPosition(conn.target, targetCoords.x, targetWidth, conn.targetSlot)
                                + " V" + Number(targetCoords.y - targetHeight / 2 + 45)
                        } else if (conn.source["Node Type"].indexOf('MTDI')!= -1) {
                            return "M" + getSlotPosition(conn.source, sourceCoords.x, sourceWidth, conn.sourceSlot) + " " + Number(sourceCoords.y + sourceHeight / 2 - 10)
                                + " V" + Number((sourceCoords.y + 44 + sourceHeight / 2) + (((targetCoords.y - targetHeight / 2) - (sourceCoords.y + sourceHeight / 2)) / 2))
                                + " H" + getSlotPosition(conn.target, targetCoords.x, targetWidth, conn.targetSlot)
                                + " V" + Number(targetCoords.y - targetHeight / 2 + 52)
                        }else {
                            return "M" + getSlotPosition(conn.source, portIDoffset, sourceWidth, conn.sourceSlot) + " " + Number(sourceCoords.y - sourceHeight / 2 +10)
                                + " V" + Number((sourceCoords.y - 25 + sourceHeight / 2 + index*6) + (((targetCoords.y - targetHeight / 2) - (sourceCoords.y - sourceHeight / 2)) / 2))
                                + " H" + getSlotPosition(conn.target, targetCoords.x, targetWidth, conn.targetSlot)
                                + " V" + Number(targetCoords.y + targetHeight / 2 -5)
                        }
                    })
                    .on('mouseover', function () {
                        d3.select(this).style("stroke", "#c6168d");
                        //reorder path, move path to front
                        this.parentNode.appendChild(this);
                        var toPortID = $(this).attr("to-port-id");
                        var fromPortID = $(this).attr("from-port-id");
                        d3.select("g[data-id='" + $(this).attr("from-id") + "']").select("rect[id='" + $(this).attr("from-port-id") + "']").style("opacity", "0.8");
                        d3.select("g[data-id='" + $(this).attr("to-id") + "']").select("rect[id='" + $(this).attr("to-port-id") + "']").style("opacity", "0.8");
                        //highlight the other port as well
                        var otherToPort;
                        var otherFromPort;
                        if (toPortID.indexOf("DL") != -1) {
                            otherToPort = toPortID.substring(0, toPortID.indexOf("DL")) + "UL" + toPortID.charAt(toPortID.length - 1);
                        } else {
                            otherToPort = toPortID.substring(0, toPortID.indexOf("UL")) + "DL" + toPortID.charAt(toPortID.length - 1);
                        }
                        d3.select("g[data-id='" + $(this).attr("to-id") + "']").select("rect[id='" + otherToPort + "']").style("opacity", "0.8");

                        if (fromPortID.indexOf("DL") != -1) {
                            otherFromPort = fromPortID.substring(0, fromPortID.indexOf("DL")) + "UL" + fromPortID.charAt(fromPortID.length - 1);
                        } else {
                            otherFromPort = fromPortID.substring(0, fromPortID.indexOf("UL")) + "DL" + fromPortID.charAt(fromPortID.length - 1);
                        }
                        d3.select("g[data-id='" + $(this).attr("from-id") + "']").select("rect[id='" + otherFromPort + "']").style("opacity", "0.8");

                    })
                    .on('mouseout', function () {
                        d3.select(this).style("stroke", "grey");
                        var toPortID = $(this).attr("to-port-id");
                        var fromPortID = $(this).attr("from-port-id");
                        d3.select("g[data-id='" + $(this).attr("from-id") + "']").select("rect[id='" + $(this).attr("from-port-id") + "']").style("opacity", "0");
                        d3.select("g[data-id='" + $(this).attr("to-id") + "']").select("rect[id='" + $(this).attr("to-port-id") + "']").style("opacity", "0");
                        //highlight the other port as well
                        var otherToPort;
                        var otherFromPort;
                        if (toPortID.indexOf("DL") != -1) {
                            otherToPort = toPortID.substring(0, toPortID.indexOf("DL")) + "UL" + toPortID.charAt(toPortID.length - 1);
                        } else {
                            otherToPort = toPortID.substring(0, toPortID.indexOf("UL")) + "DL" + toPortID.charAt(toPortID.length - 1);
                        }
                        d3.select("g[data-id='" + $(this).attr("to-id") + "']").select("rect[id='" + otherToPort + "']").style("opacity", "0");

                        if (fromPortID.indexOf("DL") != -1) {
                            otherFromPort = fromPortID.substring(0, fromPortID.indexOf("DL")) + "UL" + fromPortID.charAt(fromPortID.length - 1);
                        } else {
                            otherFromPort = fromPortID.substring(0, fromPortID.indexOf("UL")) + "DL" + fromPortID.charAt(fromPortID.length - 1);
                        }
                        d3.select("g[data-id='" + $(this).attr("from-id") + "']").select("rect[id='" + otherFromPort + "']").style("opacity", "0");
                    })
                    .on('click', function () {
                        return displayPathDetails(this)
                    })
                count++;
            })

            svgPopup.selectAll("path.slot")
                .on("mouseover", function () {

                })
                .on('mouseout', function () {
                    // d3.select(this).style("opacity", "0");
                })
            svgPopup.selectAll("rect.port")
                .on("mouseover", function () {
                    // d3.select(this).style("opacity", "0.8");
                    var to = $(this.parentNode).attr('data-id');
                    var toPortID = $(this).attr('id');
                    var toPath = d3.select("path[to-id='" + to + "'][to-port-id='" + toPortID + "']");
                    var from = $(this.parentNode).attr('data-id');
                    var fromPortID = $(this).attr('id');
                    var fromPath = d3.select("path[from-id='" + from + "'][from-port-id='" + fromPortID + "']");
                    //if roll over other UL or DL port, as well highlight path
                    toPath.style("stroke", "#c6168d");
                    var otherToPort;
                    var otherFromPort;
                    if (toPortID.indexOf("DL") != -1) {
                        otherToPort = toPortID.substring(0, toPortID.indexOf("DL")) + "UL" + toPortID.charAt(toPortID.length - 1);
                    } else {
                        otherToPort = toPortID.substring(0, toPortID.indexOf("UL")) + "DL" + toPortID.charAt(toPortID.length - 1);
                    }
                    var otherToPath = d3.select("path[to-id='" + to + "'][to-port-id='" + otherToPort + "']");
                    d3.select("path[to-id='" + to + "'][to-port-id='" + otherToPort + "']").style("stroke", "#c6168d");

                    fromPath.style("stroke", "#c6168d");
                    if (fromPortID.indexOf("DL") != -1) {
                        otherFromPort = fromPortID.substring(0, fromPortID.indexOf("DL")) + "UL" + fromPortID.charAt(fromPortID.length - 1);
                    } else {
                        otherFromPort = fromPortID.substring(0, fromPortID.indexOf("UL")) + "DL" + fromPortID.charAt(fromPortID.length - 1);
                    }
                    var otherFromPath = d3.select("path[from-id='" + from + "'][from-port-id='" + otherFromPort + "']");
                    d3.select("path[from-id='" + from + "'][from-port-id='" + otherFromPort + "']").style("stroke", "#c6168d");
                    //bring path to front path[0][0] is to access the real path returned inside an array
                    if (toPath[0][0] != null) {
                        toPath[0][0].parentNode.appendChild(toPath[0][0]);
                        //highlight the destination port
                        var id = $(toPath[0][0]).attr("from-id");
                        var port = $(toPath[0][0]).attr("from-port-id");
                        var otherPort;
                        if (port.indexOf("DL") != -1) {
                            otherPort = port.substring(0, port.indexOf("DL")) + "UL" + port.charAt(port.length - 1);
                        } else {
                            otherPort = port.substring(0, port.indexOf("UL")) + "DL" + port.charAt(port.length - 1);
                        }
                        d3.select("g[data-id='" + id + "']").select("rect[id='" + port + "']").style("opacity", "0.8");
                        //hightlight the other UL or DL port and of the destination port
                        if ($(toPath[0][0]).attr("conn-type") != undefined) {
                            d3.select("g[data-id='" + to + "']").select("rect[id='" + otherToPort + "']").style("opacity", "0.8");
                            d3.select("g[data-id='" + id + "']").select("rect[id='" + otherPort + "']").style("opacity", "0.8");
                        }
                    }
                    if (otherToPath[0][0] != null) {
                        otherToPath[0][0].parentNode.appendChild(otherToPath[0][0]);
                        //highlight the destination port
                        var id = $(otherToPath[0][0]).attr("from-id");
                        var port = $(otherToPath[0][0]).attr("from-port-id");
                        var otherPort;
                        if (port.indexOf("DL") != -1) {
                            otherPort = port.substring(0, port.indexOf("DL")) + "UL" + port.charAt(port.length - 1);
                        } else {
                            otherPort = port.substring(0, port.indexOf("UL")) + "DL" + port.charAt(port.length - 1);
                        }
                        d3.select("g[data-id='" + id + "']").select("rect[id='" + port + "']").style("opacity", "0.8");
                        //hightlight the other UL or DL port
                        if ($(otherToPath[0][0]).attr("conn-type") != undefined) {
                            d3.select("g[data-id='" + to + "']").select("rect[id='" + otherToPort + "']").style("opacity", "0.8");
                            d3.select("g[data-id='" + id + "']").select("rect[id='" + otherPort + "']").style("opacity", "0.8");
                        }
                    }
                    if (fromPath[0][0] != null) {
                        fromPath[0][0].parentNode.appendChild(fromPath[0][0]);
                        //highlight the destination port
                        var id = $(fromPath[0][0]).attr("to-id");
                        var port = $(fromPath[0][0]).attr("to-port-id");
                        var otherPort;
                        if (port.indexOf("DL") != -1) {
                            otherPort = port.substring(0, port.indexOf("DL")) + "UL" + port.charAt(port.length - 1);
                        } else {
                            otherPort = port.substring(0, port.indexOf("UL")) + "DL" + port.charAt(port.length - 1);
                        }
                        d3.select("g[data-id='" + id + "']").select("rect[id='" + port + "']").style("opacity", "0.8");
                        if ($(fromPath[0][0]).attr("conn-type") != undefined) {
                            d3.select("g[data-id='" + from + "']").select("rect[id='" + otherFromPort + "']").style("opacity", "0.8");
                            d3.select("g[data-id='" + id + "']").select("rect[id='" + otherPort + "']").style("opacity", "0.8");
                        }
                    }
                    if (otherFromPath[0][0] != null) {
                        otherFromPath[0][0].parentNode.appendChild(otherFromPath[0][0]);
                        //highlight the destination port
                        var id = $(otherFromPath[0][0]).attr("to-id");
                        var port = $(otherFromPath[0][0]).attr("to-port-id");
                        var otherPort;
                        if (port.indexOf("DL") != -1) {
                            otherPort = port.substring(0, port.indexOf("DL")) + "UL" + port.charAt(port.length - 1);
                        } else {
                            otherPort = port.substring(0, port.indexOf("UL")) + "DL" + port.charAt(port.length - 1);
                        }
                        d3.select("g[data-id='" + id + "']").select("rect[id='" + port + "']").style("opacity", "0.8");
                        //hightlight the other UL or DL port
                        if ($(otherFromPath[0][0]).attr("conn-type") != undefined) {
                            d3.select("g[data-id='" + from + "']").select("rect[id='" + otherFromPort + "']").style("opacity", "0.8");
                            d3.select("g[data-id='" + id + "']").select("rect[id='" + otherPort + "']").style("opacity", "0.8");
                        }
                    }
                })
                .on('mouseout', function () {
                    //d3.select(this).style("opacity", "0")
                    var to = $(this.parentNode).attr('data-id');
                    var toPortID = $(this).attr('id');
                    var toPath = d3.select("path[to-id='" + to + "'][to-port-id='" + toPortID + "']");
                    var from = $(this.parentNode).attr('data-id');
                    var fromPortID = $(this).attr('id');
                    var fromPath = d3.select("path[from-id='" + from + "'][from-port-id='" + fromPortID + "']");
                    //if roll over other UL or DL port, as well highlight path
                    toPath.style("stroke", "grey");
                    var otherToPort;
                    var otherFromPort;
                    if (toPortID.indexOf("DL") != -1) {
                        otherToPort = toPortID.substring(0, toPortID.indexOf("DL")) + "UL" + toPortID.charAt(toPortID.length - 1);
                    } else {
                        otherToPort = toPortID.substring(0, toPortID.indexOf("UL")) + "DL" + toPortID.charAt(toPortID.length - 1);
                    }
                    var otherToPath = d3.select("path[to-id='" + to + "'][to-port-id='" + otherToPort + "']");
                    d3.select("path[to-id='" + to + "'][to-port-id='" + otherToPort + "']").style("stroke", "grey");

                    fromPath.style("stroke", "grey");
                    if (fromPortID.indexOf("DL") != -1) {
                        otherFromPort = fromPortID.substring(0, fromPortID.indexOf("DL")) + "UL" + fromPortID.charAt(fromPortID.length - 1);

                    } else {
                        otherFromPort = fromPortID.substring(0, fromPortID.indexOf("UL")) + "DL" + fromPortID.charAt(fromPortID.length - 1);
                    }
                    var otherFromPath = d3.select("path[from-id='" + from + "'][from-port-id='" + otherFromPort + "']");
                    d3.select("path[from-id='" + from + "'][from-port-id='" + otherFromPort + "']").style("stroke", "grey");
                    //bring path to front path[0][0] is to access the real path returned inside an array
                    if (toPath[0][0] != null) {
                        toPath[0][0].parentNode.appendChild(toPath[0][0]);
                        //highlight the destination port
                        var id = $(toPath[0][0]).attr("from-id");
                        var port = $(toPath[0][0]).attr("from-port-id");
                        var otherPort;
                        if (port.indexOf("DL") != -1) {
                            otherPort = port.substring(0, port.indexOf("DL")) + "UL" + port.charAt(port.length - 1);
                        } else {
                            otherPort = port.substring(0, port.indexOf("UL")) + "DL" + port.charAt(port.length - 1);
                        }
                        d3.select("g[data-id='" + id + "']").select("rect[id='" + port + "']").style("opacity", "0");
                        //hightlight the other UL or DL port
                        if ($(toPath[0][0]).attr("conn-type") != undefined) {
                            d3.select("g[data-id='" + to + "']").select("rect[id='" + otherToPort + "']").style("opacity", "0");
                            d3.select("g[data-id='" + id + "']").select("rect[id='" + otherPort + "']").style("opacity", "0");
                        }
                    }
                    if (otherToPath[0][0] != null) {
                        otherToPath[0][0].parentNode.appendChild(otherToPath[0][0]);
                        //highlight the destination port
                        var id = $(otherToPath[0][0]).attr("from-id");
                        var port = $(otherToPath[0][0]).attr("from-port-id");
                        var otherPort;
                        if (port.indexOf("DL") != -1) {
                            otherPort = port.substring(0, port.indexOf("DL")) + "UL" + port.charAt(port.length - 1);
                        } else {
                            otherPort = port.substring(0, port.indexOf("UL")) + "DL" + port.charAt(port.length - 1);
                        }
                        d3.select("g[data-id='" + id + "']").select("rect[id='" + port + "']").style("opacity", "0");
                        //hightlight the other UL or DL port
                        if ($(otherToPath[0][0]).attr("conn-type") != undefined) {
                            d3.select("g[data-id='" + to + "']").select("rect[id='" + otherToPort + "']").style("opacity", "0");
                            d3.select("g[data-id='" + id + "']").select("rect[id='" + otherPort + "']").style("opacity", "0");
                        }
                    }
                    if (fromPath[0][0] != null) {
                        fromPath[0][0].parentNode.appendChild(fromPath[0][0]);
                        //highlight the destination port
                        var id = $(fromPath[0][0]).attr("to-id");
                        var port = $(fromPath[0][0]).attr("to-port-id");
                        var otherPort;
                        if (port.indexOf("DL") != -1) {
                            otherPort = port.substring(0, port.indexOf("DL")) + "UL" + port.charAt(port.length - 1);
                        } else {
                            otherPort = port.substring(0, port.indexOf("UL")) + "DL" + port.charAt(port.length - 1);
                        }
                        d3.select("g[data-id='" + id + "']").select("rect[id='" + port + "']").style("opacity", "0");
                        if ($(fromPath[0][0]).attr("conn-type") != undefined) {
                            d3.select("g[data-id='" + from + "']").select("rect[id='" + otherFromPort + "']").style("opacity", "0");
                            d3.select("g[data-id='" + id + "']").select("rect[id='" + otherPort + "']").style("opacity", "0");
                        }
                    }
                    if (otherFromPath[0][0] != null) {
                        otherFromPath[0][0].parentNode.appendChild(otherFromPath[0][0]);
                        //highlight the destination port
                        var id = $(otherFromPath[0][0]).attr("to-id");
                        var port = $(otherFromPath[0][0]).attr("to-port-id");
                        var otherPort;
                        if (port.indexOf("DL") != -1) {
                            otherPort = port.substring(0, port.indexOf("DL")) + "UL" + port.charAt(port.length - 1);
                        } else {
                            otherPort = port.substring(0, port.indexOf("UL")) + "DL" + port.charAt(port.length - 1);
                        }
                        d3.select("g[data-id='" + id + "']").select("rect[id='" + port + "']").style("opacity", "0");
                        //hightlight the other UL or DL port
                        if ($(otherFromPath[0][0]).attr("conn-type") != undefined) {
                            d3.select("g[data-id='" + from + "']").select("rect[id='" + otherFromPort + "']").style("opacity", "0");
                            d3.select("g[data-id='" + id + "']").select("rect[id='" + otherPort + "']").style("opacity", "0");
                        }
                    }
                })

            //display tooltip for port and slot
            $('rect.port').tipsy({
                gravity: 's',
                html: true,
                title: function () {
                    return $(this).attr("id");
                }
            });
            $('.popup_nodes').tipsy({
                gravity: 's',
                html: true,
                title: function () {
                    return "ID: "+ $(this).attr("data-tag") +"<br>Node Type: "+$(this).attr("data-node-type");
                }
            });
            $('path.slot').tipsy({
                gravity: 's',
                html: true,
                title: function () {
                    return $(this).attr("id");
                }
            });

            // count of greatest RRU chains and set scale mode
            if(node["Node Type"] == "ZONE"){
                if(maxChain > 9){
                    popupZoomListener.translate([0, 0]);
                    popupZoomListener.scale(0.8);
                    svgPopup.transition()
                            .duration(555)
                            .attr("transform", "translate(0,10) scale(0.8)");
                }
            }
        }, 500)


        $('#popup').find("g").removeAttr("style");
        if(document.getElementById("popup_" + node.ID + "_img") != null)
            document.getElementById("popup_" + node.ID + "_img").setAttribute("style", "filter: url(#selected_shadow)");
        //enable zooming only all connections have been drawn on the page
        //or else it may cause missalignment
        setTimeout(function(){
            svgPopupContainer.call(popupZoomListener);
        },1000)

        //display node being clicked in detailed information panel
        //except sector group and zone
        if(node["Node Type"]!="SECTGRP" && node["Node Type"]!="ZONE") {
            displayNodeDetails(node);
        }
    }

    //this function is to calculate roughly the position of slot for each type of devices
    //this is to show the connection to the slot position on the detail view
    function getSlotPosition(node,xCoor, width, slotNo){
        var slotCoor;
        //if(slotNo != undefined && slotNo != "" && slotNo.indexOf("MAIN") === -1 && slotNo.indexOf("INTERCONN") === -1){
        if(node["Node Type"].indexOf("VIRT_SECT") != -1) {
            slotCoor= Number(xCoor);
        }else if(node["Node Type"].indexOf("APOI") != -1) {
            if(slotNo.indexOf("SECT") !=-1){
                if(slotNo.charAt(slotNo.length-1) === "1"){
                    slotCoor = Number((xCoor - width / 2) + ((width - width*0.0625 -width*0.19) / 8 * Number(slotNo.charAt(0))));
                }else{
                    slotCoor = Number((xCoor - width / 2) + ((width - width*0.0625 -width*0.19) / 8 * Number(slotNo.charAt(0))) + 10);
                }
            }else{
                slotCoor = Number((xCoor - width / 2) + ((width - width*0.0625 -width*0.19) / 8 * Number(slotNo.charAt(0))) + 10);
            }
        }else if(node["Node Type"].indexOf("MTDI") != -1) {
            if(slotNo === undefined || slotNo === ""){
                slotCoor= Number(xCoor);
            }else{
                if(slotNo.charAt(0) === "1"){
                    if(slotNo.charAt(slotNo.length-1) === "1") {
                        slotCoor = Number((xCoor - width / 2) + ((width - width*0.3 -width*0.09) / 4 * Number(slotNo.charAt(2))) + 100);
                    }else{
                        slotCoor = Number((xCoor - width / 2) + ((width - width*0.3 -width*0.09) / 4 * Number(slotNo.charAt(2))) + 120);
                    }
                }else if(slotNo.charAt(0) === "2"){
                    if (slotNo.charAt(slotNo.length - 1) === "1") {
                        slotCoor = Number((xCoor - width / 2) + ((width - width*0.3 -width*0.09) / 4 * Number(slotNo.charAt(2))) + 100);
                    } else {
                        slotCoor = Number((xCoor - width / 2) + ((width - width*0.3 -width*0.09) / 4 * Number(slotNo.charAt(2))) + 120);
                    }
                }else{
                    if (slotNo.charAt(slotNo.length - 1) === "1") {
                        slotCoor = Number((xCoor - width / 2) + 55);
                    } else {
                        slotCoor = Number((xCoor - width / 2) + 70);
                    }
                }
            }
        }else if(node["Node Type"].indexOf("MSDH") != -1) {
            if(slotNo === undefined || slotNo === ""){
                slotCoor= Number(xCoor);
            }else{
                //display port as DL0 and UL0 for VIRT_SECT
                var slotNumber = slotNo.substring(slotNo.indexOf(":")+1,slotNo.length);
                var position = parseInt(Number(slotNumber-1)/2);
                slotCoor = Number((xCoor - width / 2) + ((width - width*0.6 -width*0.169) / 8 * position) + 300);
                if(slotNo.slice(-2) == "L0"){
                    var parseSlot = slotNo.split(":");
                    var slotNumber = parseSlot[0];
                    var position = parseInt(Number(slotNumber-1)/2);
                    slotCoor = Number((xCoor - width / 2) + ((width - width*0.6 -width*0.19) / 8 * position) + 300);
                }
            }
        }else if(node["Node Type"].indexOf("RRU") != -1) {
            //display port as AUX:1 and MAIN:2
            if(slotNo === undefined || slotNo === ""){
                slotCoor= Number(xCoor);
            }else{
                if (slotNo.charAt(slotNo.length - 1) === "1") {
                    slotCoor = Number((xCoor - width / 2) + 5);
                } else {
                    slotCoor = Number((xCoor - width / 2) + 15);
                }
            }
        }else{
            slotCoor= Number(xCoor);
        }
        return slotCoor;
    }

    // turn var by following functions in order to enlarge racks
    function getRackWidth(rackList)
    {
        if(rackList.length <= 3){ return 360;
        }else if (rackList.length >= 3) {return 260;}
    }

    function getRackScale(rackList)
    {
        var maxLen=12;
        for(acc=0;acc<rackList.length;acc++){
            maxLen  =  Math.max(rackList[acc].Size,maxLen);
        }
        if(maxLen == 12){
            return 1;
        }
        else if(maxLen == 24){
            return 0.8;
        }
        else if(maxLen == 42){
            return 0.5;
        }
        return 1;
    }

    function getNodeWidth(rackList)
    {
        if(rackList.length <= 3){ return 340;
        }else if (rackList.length >= 3) {return 240;}
    }

    function getSlotHeight(rackList)
    {
        if(rackList.length <= 3){ return 35;
        }else if (rackList.length >= 3) {return 25;}
    }

    function createRackHolder(rackList){
        //create header
        headerLayer = svgGroup.append("g")
            .attr("id","rack_overall-status")
            .attr("class",function() {
                return "layer_header";
            })
        headerLayer.append("rect")
            .attr("width","100%")
            .attr("height","30px")
            .attr("x",0)
            .attr("y",((1+layerCount) * layerPadding + 2 *nodeHeight -70))
            .style('fill','rgba(137, 150, 160, 0.5)');
        headerLayer.append("svg:text")
            .attr("x",30)
            .attr("y",((1+layerCount) * layerPadding + 2 *nodeHeight -50))
            .text("System Rack")
            .style('fill','#666');
        headerLayer.append("svg:circle")
            .attr("id",'rack_overall-status-led')
            .attr("class", function(d){
                //get overall status led
                var className ='';
                $.each(rackList, function(i,rack){
                    var highest_severity = 4;
                    $.each(rack.Units, function(j,node){
                        if(node.Comm === "1"){
                            highest_severity = 0;
                        }else if(node.Comm === "0" && node.Status ==="0"){
                            highest_severity = 0;
                        }else if(node.Comm === "0" && node.Status ==="1"){
                            if(highest_severity > 1){
                                highest_severity = 1;
                            }
                        }else if(node.Comm === "0" && node.Status ==="2"){
                            if(highest_severity > 2){
                                highest_severity = 2;
                            }
                        }else if(node.Comm === "0" && node.Status ==="3"){
                            if(highest_severity > 3){
                                highest_severity = 3;
                            }
                        }else if(node.Comm === "0" && node.Status ==="4"){
                            if(highest_severity > 4){
                                highest_severity = 4;
                            }
                        }else if(node.Comm === "-" && node.Status ==="1"){
                            highest_severity = 0;
                        }
                    })
                    if(highest_severity == 0)
                        className = "overall-status-led led red";
                    else if(highest_severity == 1)
                        className = "overall-status-led led orange";
                    else if(highest_severity == 2)
                        className = "overall-status-led led yellow";
                    else if(highest_severity == 3)
                        className = "overall-status-led led white";
                    else if(highest_severity == 4)
                        className = "overall-status-led led green";
                })
                return className;
            })
            .attr("cx","98%")
            .attr("cy",(1+layerCount) * layerPadding + 2 *nodeHeight -55)
            .attr("r", 7)
            .style("fill",function(){
                var status ='';
                $.each(rackList, function(i,rack){
                    if(rackList[i].Units.length == 0){
                        //console.log("true");
                        status = "url(#green)";
                    }else{
                    $.each(rack.Units, function(j,node){
                            if(node.Comm === "1"){
                                status = "url(#red)";
                                return false;
                            }else if(node.Comm === "0" && node.Status ==="0"){
                                status = "url(#red)";
                                return false;
                            }else if(node.Comm === "0" && node.Status ==="1"){
                                status = "url(#orange)";
                                return false;
                            }else if(node.Comm === "0" && node.Status ==="2"){
                                status = "url(#yellow)";
                                return false;
                            }else if(node.Comm === "0" && node.Status ==="3"){
                                status = "url(#white)";
                                return false;
                            }else if(node.Comm === "0" && node.Status ==="4"){
                                status = "url(#green)";
                                return false;
                            }else if(node.Comm === "-" && node.Status ==="1"){
                                status = "url(#red)";
                                return false;
                            }else if(node.Comm === "-" && node.Status !="1"){
                                status = "url(#grey)";
                            }else{
                                status = "url(#grey)";
                            }
                        })
                        return false;
                    }

                })
                return status;
            })

        //start to draw each rack with nodes in it
        var counter =0;
        var rackWidth = getRackWidth(rackList);
        // getRackScale for state machine in 12/24/42 rack size
        var scale = getRackScale(rackList);
        var rackMargin = ((wWidth - wMargin.right*2) - (rackWidth * rackList.length)) /rackList.length /2;

        //height of rack is from end of sect grp area to start of remotes area
        var rackHeight = Number((wHeight - 3*30)/5*3 - 100);
        rackContainer = svgGroup.append("g")
            .attr("id","rack_container")
            .attr("width",'100%')
            .attr("height",'100%')
        $.each (rackList,function(j,rack){
            rackEnter = rackContainer.append("g")
                .attr("id","rack_"+rack.RackID)
                .attr("class", "rack")
                .attr("width",rackWidth+ 'px')
                .attr("height",rackHeight+ 'px')
                .attr("size", rack.Size)
                .attr("tag", rack.Tag)
                .attr("transform", function() {
                    // scale for state machine in 12/24/42 rack size
                    console.log(rack.Tag,Number(counter * (wWidth / (rackList.length + 1) ) - rackWidth/2));
                    return "translate(" +  Number(counter * (wWidth*(1/scale) / (rackList.length + 1) )/* - rackWidth/2 */) + ")"
                    //return "translate(" +  Number(counter * (wWidth*2 / (rackList.length + 1) ) - rackWidth/rackList.length) + ")"
                    // return "translate(" +  Number(counter * (rackWidth +rackMargin*2) + wMargin.right + rackMargin) + ")"
                })
            var aRack = rackEnter.append("g")
                .attr("width", rackWidth+ 'px')
                .attr("height", rackHeight+ 'px')

            var rackTblHolder = aRack.append("g")
                        .attr('class',"rackTable")
                        .attr('width',rackWidth + 'px')
                        .attr('height',rackHeight+ 'px')
            rackTblHolder.append("svg:text")
                .attr("x",rackWidth/3)
                .attr("y",0)
                .text(rack.Tag)
                .style('fill','#000')
                .style('font-weight','bold')
                .style('font-size','16px');
            var rackTbl = rackTblHolder.append("g")
                                .attr('id','tbl_rack_'+rack.RackID)
                                .attr('class','rack')
                                .attr('width',rackWidth+ 'px')
                                .attr('height',rackHeight+ 'px')
            //populate node in rack
            //global variables in createRackHolder
            var nodeWidth = getNodeWidth(rackList);
            var nodeMargin = 10;
            var slotHeight = getSlotHeight(rackList);
            for( var i =1; i<=rack.Size; i++) {
                var node = _.findWhere(rack.Units,{"Slot":i})
                if(node != undefined){
                    var thisNode = _.findWhere(totalOtherNodeList, {"ID": node.ID});
                    var nodeSize = node.Size;

                    if(thisNode !=undefined ){
                        //append slot with node
                        //svgGroup.select('#rack-' + rack.RackID + '-slot-' + node.Slot).append(populateNode(thisNode, rack.RackID, node.Slot,false));
                        var ID = 'rack-' + rack.RackID + '-slot-' + node.Slot + '-row'
                         //console.log(   "-------------------------- ", 'svg-'+ID);
                        var rackNodes = rackTbl.selectAll("g.rackNode")
                            .data(rack.Units.filter(function(theNode){
                                return _.findWhere(totalOtherNodeList, {"ID": theNode.ID})
                            }))

                        rackNodeEnter = rackNodes.enter().append('g')
                            .attr('height', function(d) {
                                return d.Size * slotHeight +"px"
                            })
                            .attr('width', rackWidth + 'px')
                            .attr('id',function(d){
                               return 'svg-'+'rack-' + rack.RackID + '-slot-' + d.Slot + '-row'
                               // return d.ID
                            })
                            .attr('name',function(d){
                                return 'svg-'+'rack-' + rack.RackID + '-slot-' + d.Slot + '-row'
                            })
                            .attr('class',function(d){
                                return "rackNode"
                            })

                        rackNodeEnter.append('rect')
                            .attr('id', function(d){
                                return 'rack-' + rack.RackID + '-slot-' + d.Slot + '-row'
                            })
                            .attr('class', 'rackSlot')
                            .attr('height', function(d) {
                                return d.Size * slotHeight +"px"
                            })
                            .attr('width', rackWidth + 'px')
                            .attr('x', '0')
                            .attr('y', function(d){
                                return d.Slot * slotHeight
                            })
                            .attr('rackid', rack.RackID)
                            .attr('slotid', function(d){
                                return d.Slot;
                            })
                            .attr("fill", "#f5f5f5")
                            .style("stroke-width", "1px")
                            .style("stroke", "black")

                            // var svgNode;
                            // var svgFile = '';
                            // if (thisNode["Node Type"].indexOf("APOI") != -1) {
                            //     svgFile = "../images/icons/APOI_bigicon.svg";
                            // } else if (thisNode["Node Type"].indexOf("MTDI") != -1) {
                            //     svgFile = "../images/icons/MTDI_bigicon.svg";
                            // } else if (thisNode["Node Type"].indexOf("MSDH") != -1) {
                            //     svgFile = "../images/icons/MSDH_bigicon.svg";
                            // }

                            var rackNodes2 = rackTbl.selectAll("g.rackNode")
                            // todo selector otuside from loop
                            var rackNodes31 = document.getElementById('svg-'+ID);
                            var svgNode;
                            var svgFile = '';
                            if (thisNode["Node Type"].indexOf("APOI") != -1) {
                                  var tmp;
                                  $.ajax({
                                    url:"/images/icons/APOI_bigicon.svg/",
                                    async: false,
                                    success:function(data) {
                                      tmp= data.getElementsByTagName("svg")[0];
                                    }
                                  });
                                  rackNodes31.appendChild(tmp);
                                  costumeAPOI(tmp, thisNode);

                            } else if (thisNode["Node Type"].indexOf("MTDI") != -1) {
                                  var tmp;
                                  $.ajax({
                                    url:"/images/icons/MTDI_bigicon.svg/",
                                    async: false,
                                    success:function(data) {
                                      tmp= data.getElementsByTagName("svg")[0];
                                    }
                                  });
                                  rackNodes31.appendChild(tmp);
                                  costumeMTDI(tmp, thisNode);

                            } else if (thisNode["Node Type"].indexOf("MSDH") != -1) {
                                  var tmp;
                                  $.ajax({
                                    url:"/images/icons/MSDH_bigicon.svg/",
                                    async: false,
                                    success:function(data) {
                                      tmp= data.getElementsByTagName("svg")[0];
                                    }
                                  });
                                  rackNodes31.appendChild(tmp);
                            }
                            //console.log('svg-'+ID);

                            //rackNodes2[0][0].appendChild(svgNode);
                            //select all svg element at this loop (within external svg file) and apply attrs
                            rackNodes2.select("svg")
                                .attr("id",function(d){
                                    return d.ID+'_svg'
                                })
                                .attr("class", function(d){
                                    return d["Node Type"] + "_svg rackNodeUnit"
                                })
                                .attr("data-id", function(d){
                                   return d.ID;
                                })
                                .attr("data-node-type", function(d){
                                    return d["Node Type"];
                                })
                                .attr("data-location", function(d){
                                    return d["Location"];
                                })
                                .attr('x',nodeMargin)
                                .attr('y',function(d){
                                    return d.Slot * slotHeight
                                })
                                .attr("width",nodeWidth+"px")
                                .attr("height", function(d) {
                                    return d.Size * slotHeight +"px"
                                })
                                .on('click',function(d){
                                    drawLocalConnection(d);
                                    drawARack(rack.RackID,d);
                                    //highlight the slot with thisNode
                                    $('#popup-rack-' + rack.RackID + '-slot-' + d.Slot).addClass('highlightedSlot');
                                })

                            rackNodes2.selectAll("rect.port")
                                .on("mouseover", function () {
                                    //display tooltip for port and slot
                                    $('rect.port').tipsy({
                                        gravity: 's',
                                        html: true,
                                        title: function () {
                                            return $(this).attr("id");
                                        }
                                    });
                                    $('path.slot').tipsy({
                                        gravity: 's',
                                        html: true,
                                        title: function () {
                                            return $(this).attr("id");
                                        }
                                    });
                                }) // eof tipsy

                        //}) // eof ajax / d3.xml

                        //console.log('svg-'+ID);

                        //draw the led
                        rackNodeEnter.append("svg:circle")
                            .attr("id",function(d){
                                return d.ID+"_led"
                            })
                            .attr("class", function(d){
                                if(d["Node Type"].indexOf("MSDH") === -1) {
                                    if(d.Comm === "-"){
                                        return d["Node Type"]+"_"+d.ID+"_led led grey";
                                    }else if(d.Comm === "1"){
                                        return d["Node Type"]+"_"+d.ID+"_led led green";
                                    }else if(d.Comm === "0" && d.Status ==="0"){
                                        return d["Node Type"]+"_"+d.ID+"_led led red";
                                    }else if(d.Comm === "0" && d.Status ==="1"){
                                        return d["Node Type"]+"_"+d.ID+"_led led orange";
                                    }else if(d.Comm === "0" && d.Status ==="2"){
                                        return d["Node Type"]+"_"+d.ID+"_led led yellow";
                                    }else if(d.Comm === "0" && d.Status ==="3"){
                                        return d["Node Type"]+"_"+d.ID+"_led led white";
                                    }else if(d.Comm === "0" && d.Status ==="4"){
                                        return d["Node Type"]+"_"+d.ID+"_led led green";
                                    }else{
                                        return d["Node Type"]+"_"+d.ID+"_led led grey";
                                    }
                                } else {
                                    if(d.Status === "-"){
                                        return d["Node Type"]+"_"+d.ID+"_led led grey";
                                    }else if(d.Status === "0"){
                                        return d["Node Type"]+"_"+d.ID+"_led led red";
                                    }else if(d.Status === "1"){
                                        return d["Node Type"]+"_"+d.ID+"_led led orange";
                                    }else if(d.Status === "2"){
                                        return d["Node Type"]+"_"+d.ID+"_led led yellow";
                                    }else if(d.Status === "3"){
                                        return d["Node Type"]+"_"+d.ID+"_led led white";
                                    }else if(d.Status === "4"){
                                        return d["Node Type"]+"_"+d.ID+"_led led green";
                                    }else{
                                        return d["Node Type"]+"_"+d.ID+"_led led grey";
                                    }
                                }
                            })
                            .attr('x',0)
                            .attr('y',function(d){
                                return d.Slot * slotHeight
                            })
                            .attr("cx",Number(nodeWidth + 15) +"px")
                            .attr("cy",function(d){
                                return Number(d.Slot*slotHeight + 5)+"px"
                            })
                            .attr("r", 5)
                            .style("fill",function(d){
                                if(d["Node Type"].indexOf("MSDH") === -1) {
                                    if(d.Comm === "-"){
                                        return "url(#grey)";
                                    }else if(d.Comm === "1"){
                                        return "url(#red)";
                                    }else if(d.Comm === "0" && d.Status ==="0"){
                                        return "url(#red)";
                                    }else if(d.Comm === "0" && d.Status ==="1"){
                                        return "url(#orange)";
                                    }else if(d.Comm === "0" && d.Status ==="2"){
                                        return "url(#yellow)";
                                    }else if(d.Comm === "0" && d.Status ==="3"){
                                        return "url(#white)";
                                    }else if(d.Comm === "0" && d.Status ==="4"){
                                        return "url(#green)";
                                    }else{
                                        return "url(#grey)";
                                    }
                                } else {
                                    if(d.Status === "-"){
                                        return "url(#grey)";
                                    }else if(d.Status === "0"){
                                        return "url(#red)";
                                    }else if(d.Status === "1"){
                                        return "url(#orange)";
                                    }else if(d.Status === "2"){
                                        return "url(#yellow)";
                                    }else if(d.Status === "3"){
                                        return "url(#white)";
                                    }else if(d.Status === "4"){
                                        return "url(#green)";
                                    }else{
                                        return "url(#grey)";
                                    }
                                }
                            })
                    } else{
                            //append slot with BLANK node
                            //this case node is BLANK
                        rackTbl.append('rect')
                            .attr('id', 'rack-' + rack.RackID + '-slot-' + i + '-row')
                            .attr('class', 'rackSlot')
                            .attr('height', slotHeight* nodeSize+ 'px')
                            .attr('width', rackWidth + 'px')
                            .attr('x', 0)
                            .attr('y', i * slotHeight)
                            .attr('rackid', rack.RackID)
                            .attr('slotid', i)
                            .attr("fill", "#f5f5f5")
                            .style("stroke-width", "1px")
                            .style("stroke", "black");

                        var textStr;
                        if(node.IP == "-")
                           textStr = node.Tag;
                        else{
                           var targetStr;
                           if(node.IP.substring(0, 5) == "10.0."){
                              var split = node.IP.split('.');
                              var k = parseInt(split[2]);
                              var s = parseInt(split[3]);
                              var port = 10000 + ((k-2)*256) + s;
                              targetStr = "http://"+window.location.hostname+":"+port;
                           }else{
                              targetStr = "http://"+node.IP;
                           }
                           textStr = '<a target="_blank" href="'+targetStr+'">'+node.Tag+'</a>';
                        }

                        rackTblHolder.append("svg:text")
                            .attr("x",(rackWidth/3))
                            .attr("y",i*slotHeight + nodeSize * slotHeight/2 +3) //make sure text stay in middle of slot
                            .html(textStr)
                            .style('fill','#666')
                            .style('font-weight','bold')
                            .style('font-size','1.2em');
                    }
                    //check the node size, disable slot which are occupied by this node
                    if(nodeSize>1) {
                        i = i + nodeSize - 1;
                        continue;
                    }
                }else{
                    //append empty slot
                    rackTbl.append('rect')
                        .attr('id', 'rack-' + rack.RackID + '-slot-' + i + '-row')
                        .attr('class', 'rackSlot')
                        .attr('height', slotHeight+ 'px')
                        .attr('width', rackWidth + 'px')
                        .attr('x', '0')
                        .attr('y', i * slotHeight)
                        .attr('rackid', rack.RackID)
                        .attr('slotid', i)
                        .attr("fill", "#f5f5f5")
                        .style("stroke-width", "1px")
                        .style("stroke", "black")
                }
            }

            /*
            var rackHtml ='<g class="aRack"><g class="rack_label"><text>#'+rack.RackID+' - '+rack.Tag+'</text> </g>';
            rackHtml +='<g id="tbl_rack_'+rack.RackID+'" class="rack">';
            for( var i =1; i<=rack.Size; i++){
                rackHtml += '<g id = "rack-'+rack.RackID+'-slot-'+i+'-row">' +
                    '<g id = "rack-'+rack.RackID+'-slot-'+i+'" data-rackid = "'+rack.RackID+'" data-slotid="'+i+'" class="rackSlot"></g></g>';
            }
            rackHtml +='</g></g>';
            aRack.append(rackHtml);*/

            //add rack container holder stroke
            rackTbl.append('rect')
                .attr('id', 'rackStrokeContainer')
                .attr('class', 'rackContainer')
                .attr('height', (i * slotHeight)-slotHeight+4)
                .attr('width', rackWidth +4+ 'px')
                .attr('x', '-2')
                .attr('y', slotHeight-2)
                .attr('rackid', rack.RackID)
                .attr('slotid', i)
                .attr("fill", "none")
                //.attr("fill-opacity", "0")
                .style("stroke-width", "4px")
                .style("stroke", "grey")

            counter++;

        })
    }



        $(document).on('click','#prev',function(){
            return drawARackArrow(-1);
        })

        $(document).on('click','#next',function(){
            return drawARackArrow(1);
        })

        function drawARackArrow(isNext){
                indexes = $.map(rackList, function(obj, index) {
                    if(obj.RackID == rackIDgeneral) {
                        return index;
                    }
                })
            firstIndex = indexes[0];
            acc = (firstIndex+isNext)%rackList.length
            if(acc < 0 || acc > rackList.length -1 )
            acc = rackList.length -1;
            var acc=rackList[acc].RackID;
            drawARack(acc);
            updateScreenSize()
            //disable zoom while drawing popup screen
            svgPopupContainer.call(d3.behavior.zoom().on("zoom", null));
            //for firefox to refresh before loading new data
            svgPopup.selectAll("*").remove();
            $("#right_side_bar").hide();
            return false;
        }



    /*this function is to draw a rack and its nodes for popup window display*/
    function drawARack(rackid){
        console.log("draw a rack-id:",rackid)
        $('#left_side_bar_content').empty();
        var thisRack = _.findWhere(rackList,{"RackID":rackid})

        // turn to globle var for drawARackArrow();
        rackIDgeneral = rackid

        var rack ='<div class="aRack"><div class="rack_label"><span>#'+rackid+' - '+thisRack.Tag+'</span> </div>';
        rack +='<table class="rack">';

        for( var i =1; i<=thisRack.Size; i++){
            rack += '<tr id = "popup-rack-'+rackid+'-slot-'+i+'-row">' +
                '<td id = "popup-rack-'+rackid+'-slot-'+i+'" data-rackid = "'+rackid+'" data-slotid="'+i+'" class="rackSlot"></td></td>'
            '</tr>';
        }

        rack +='</table></div>';

        $('#left_side_bar_content').append("<span id='prev' title='Previous Rack' class='ui-widget-header ui-icon ui-icon-triangle-1-w'> </span>");
        $('#left_side_bar_content').append("<span id='next' title='Next Rack' class='ui-widget-header ui-icon ui-icon-triangle-1-e'> </span>");

        $('#left_side_bar_content').append(rack);
        //append nodes to that rack
        $.each(thisRack.Units,function(i, node){
            var thisNode = _.findWhere(totalOtherNodeList, {"ID": node.ID});
            var nodeSize = node.Size;
            if (thisNode != undefined) {
                $('#popup-rack-' + thisRack.RackID + '-slot-' + node.Slot).append(populateNode(thisNode, thisRack.RackID, node.Slot,true));
            } else {
                //this case node is BLANK
                thisNode = node;
                $('#popup-rack-' + thisRack.RackID + '-slot-' + node.Slot).append(populateNode(thisNode, thisRack.RackID, node.Slot,true));
                //check out the node height and display accordingly
                var nodeHeight = node.Size * 15 //asumming height of 1 unit height node
                $('#popup-rack-' + thisRack.RackID + '-slot-' + node.Slot).css('line-height', nodeHeight + 'px');

            }
            //check the node size, disable slot which are occupied by this node
            if (nodeSize > 1) {
                for (var i = 1; i < nodeSize; i++) {
                    $('#popup-rack-' + thisRack.RackID + '-slot-' + Number(node.Slot + i) + '-row').hide();
                }
            }
            $('#left_side_bar').show();
        })
        $(".aRack").accordion({ collapsible: true });
    }
    function populateNode(node,rackID,slotID,isPopup){
        var imgSrc;
        var nodeHtml;
        if(node["Node Type"] != "BLANK") {
            if (node["Node Type"].indexOf("APOI") != -1) {
              var tmp;
              $.ajax({
                url:"/images/icons/APOI_bigicon.svg/",
                async: false,
                success:function(data) {
                  tmp= data.getElementsByTagName("svg")[0];
                }
              });
              costumeAPOI(tmp, node);
            } else if (node["Node Type"].indexOf("MTDI") != -1) {
              var tmp;
              $.ajax({
                url:"/images/icons/MTDI_bigicon.svg/",
                async: false,
                success:function(data) {
                  tmp= data.getElementsByTagName("svg")[0];
                }
              });
              costumeMTDI(tmp, node);
            } else if (node["Node Type"].indexOf("MSDH") != -1) {
              var tmp;
              $.ajax({
                url:"/images/icons/MSDH_bigicon.svg/",
                async: false,
                success:function(data) {
                  tmp= data.getElementsByTagName("svg")[0];
                }
              });
            }
            tmp.setAttribute("width", "190px");
            tmp.setAttribute("height", "100%");
            if(!isPopup) {
                nodeHtml = '<div id="' + node.ID + '" class="node_placeholder" nodeType="' + node["Node Type"] + '" tag="' + node.Tag + '" ' +
                    'data-rackid="' + rackID + '" data-slotid="' + slotID + '"' +
                    'title="ID: ' + node.ID + '"> ' +
                    '<span> ' +tmp.outerHTML + ' </span>';
            }else{
                nodeHtml = '<div id="' + node.ID + '" class="popup_node_placeholder" nodeType="' + node["Node Type"] + '" tag="' + node.Tag + '" ' +
                    'data-rackid="' + rackID + '" data-slotid="' + slotID + '"' +
                    'title="ID: ' + node.ID + '"> ' +
                    '<span> ' +tmp.outerHTML + ' </span>';
            }

            if(node.Comm === "1"){
                nodeHtml += '<div class="node icon led red round"></div>';
            }else if(node.Comm === "0" && node.Status ==="1"){
                nodeHtml += '<div class="node icon led red round"></div>';
            }else if(node.Comm === "-" && node.Status ==="1"){
                nodeHtml += '<div class="node icon led red round"></div>';
            }else if(node.Comm === "-" && node.Status !="1"){
                nodeHtml += '<div class="node icon led grey round"></div>';
            }else if(node.Comm === "0" && node.Status ==="0"){
                nodeHtml += '<div class="node icon led green round"></div>';
            }else{
                //else(node.Comm === "0") // green
                nodeHtml += '<div class="node icon led green round"></div>';
            }
            nodeHtml +='</div>';
        }else{
            if(rackID === undefined) {
                //this is to populate node for system node panel
                // but it's blank type so don't draw anything
            }else{
                if(!isPopup) {
                    //this is to populate node for rack
                    nodeHtml = '<div id="' + rackID + '-' + node.Position + '" class="node_placeholder" nodeType="' + node["Node Type"] + '" tag="' + node.Tag + '" ' +
                        'data-rackid="' + rackID + '" data-slotid="' + slotID + '" data-size ="' + node.Size + '"' +
                        'title="ID: ' + node.Tag + '"> ' +
                        '<div class="icon controller"></div> ' + node.Tag;
                }else{
                    //this is to populate node for rack
                    nodeHtml = '<div id="' + rackID + '-' + node.Position + '" class="popup_node_placeholder" nodeType="' + node["Node Type"] + '" tag="' + node.Tag + '" ' +
                        'data-rackid="' + rackID + '" data-slotid="' + slotID + '" data-size ="' + node.Size + '"' +
                        'title="ID: ' + node.Tag + '"> ' +
                        '<div class="icon controller"></div> ' + node.Tag;
                }
            }
        }

        return nodeHtml;
    }

    function drawTopology(list){
        var maxLabelLength =0;
        var allowedWidth;
        var widthRatio;
        var totalWidth =0;


        if(list[0] != undefined) {
            if (list[0]["Node Type"].indexOf("SECTGRP") != -1 || list[0]["Node Type"].indexOf("ZONE") != -1) {
                $.each(list, function (i, obj) {
                    maxLabelLength = Math.max(obj.name.length, maxLabelLength);
                })
                allowedWidth = ((wWidth - wMargin.right) / list.length - wMargin.left);
                if (allowedWidth > maxLabelLength) {
                    totalWidth = allowedWidth
                } else {
                    allowedWidth = maxLabelLength * 4.5 + 10;
                    totalWidth = allowedWidth;
                }
            } else {
                allowedWidth = ((wWidth - wMargin.right) / list.length - wMargin.left);
                widthRatio = allowedWidth / list[0].width;
                if (widthRatio >= 1) {
                    //totalWidth = list[0].width + ((wWidth - wMargin.right) - (list[0].width * list.length))/list.length/2;
                    totalWidth = allowedWidth
                } else if (widthRatio > 0.3 && widthRatio < 1) {
                    totalWidth = allowedWidth;
                } else {
                    totalWidth = list[0].width * 0.3;
                }
            }
        }


        headerLayer = svgGroup.append("g")
            .attr("id",list[0]["Node Type"] +"_overall-status")
            .attr("class",function() {
                if (list[0]["Node Type"] === 'SECTGRP') {
                    return "layer_header SECTGRP_layer_header";
                }else{
                    return "layer_header";
                }
            })
        headerLayer.append("rect")
            .attr("width","100%")
            .attr("height","30px")
            .attr("x",0)
            //offset y only for layer 5
            //.attr("y",(list[0].layer+layerCount) * layerPadding + list[0].layer *nodeHeight -150)
           .attr("y",function(){
                //if(list[0].layer+layerCount!=5) || (list[0]["Node Type"].indexOf("ZONE") != -1){
                if(list[0].layer+layerCount!=5){
                    return (list[0].layer+layerCount) * layerPadding + list[0].layer *nodeHeight -150;
                }else{
                    return (list[0].layer+layerCount) * layerPadding + list[0].layer *nodeHeight -50;
                }
            })
            .style('fill','rgba(137, 150, 160, 0.5)');

        headerLayer.append("svg:text")
            .attr("x",30)
            //offset y only for layer 5
            //.attr("y",(list[0].layer+layerCount) * layerPadding + list[0].layer *nodeHeight -130)
            .attr("y",function(){
                if(list[0].layer+layerCount!=5){
                    return (list[0].layer+layerCount) * layerPadding + list[0].layer *nodeHeight -130;
                }else{
                    return (list[0].layer+layerCount) * layerPadding + list[0].layer *nodeHeight -32;
                }
            })

            .text(function(){
                if(list[0]["Node Type"] ==="SECTGRP"){
                    return "BTS Port Group";
                }else if(list[0]["Node Type"].indexOf("APOI") != -1){
                    return "Axell Point of Interface";
                }else if(list[0]["Node Type"].indexOf("MTDI") != -1){
                    return "Multi Technology Digital Interface";
                }else if(list[0]["Node Type"].indexOf("MSDH") != -1){
                    return "Multi Sector Digital Hub";
                }else if(list[0]["Node Type"].indexOf("ZONE") != -1){
                    return "idRemote";
                }
            })
            .style('fill','#666');
        headerLayer.append("svg:circle")
            .attr("id",list[0]["Node Type"] +'_overall-status-led')
            .attr("class", function(d){
                //get overall status led
                var className ='';
                var highest_severity = 4;
                $.each(list, function(i,node){
                    if(node.Comm === "1"){
                        highest_severity = 0;
                    }else if(node.Comm === "0" && node.Status ==="0"){
                        if(node["Node Type"].indexOf("SECTGRP") != -1){
                            if(sectRed)
                              highest_severity = 0;
                            else
                              highest_severity = 4;
                        }
                        else{
                            highest_severity = 0;
                        }
                    }else if(node.Comm === "0" && node.Status ==="1"){
                        if(highest_severity > 1){
                            highest_severity = 1;
                        }
                    }else if(node.Comm === "0" && node.Status ==="2"){
                        if(highest_severity > 2){
                            highest_severity = 2;
                        }
                    }else if(node.Comm === "0" && node.Status ==="3"){
                        if(highest_severity > 3){
                            highest_severity = 3;
                        }
                    }else if(node.Comm === "0" && node.Status ==="4"){
                        if(highest_severity > 4){
                            highest_severity = 4;
                        }
                    }else if(node.Comm === "-" && node.Status ==="1"){
                        highest_severity = 0;
                    }
                })
                if(highest_severity == 0)
                    className = "overall-status-led led red";
                else if(highest_severity == 1)
                    className = "overall-status-led led orange";
                else if(highest_severity == 2)
                    className = "overall-status-led led yellow";
                else if(highest_severity == 3)
                    className = "overall-status-led led white";
                else if(highest_severity == 4)
                    className = "overall-status-led led green";
                return className;
            })
            .attr("cx","98%")
            //offset y only for layer 5
            //.attr("cy",(list[0].layer+layerCount) * layerPadding + list[0].layer *nodeHeight -135)
            .attr("cy",function(){
                if(list[0].layer+layerCount!=5){
                    return (list[0].layer+layerCount) * layerPadding + list[0].layer *nodeHeight -135;
                }else{
                    return (list[0].layer+layerCount) * layerPadding + list[0].layer *nodeHeight -35;
                }
            })

            .attr("r", 7)
            .style("fill",function(){
                var status ='';
                $.each(list, function(i,node){
                    if(node.Comm === "1"){
                        status = "url(#red)";
                        return false;
                    }else if(node.Comm === "0" && node.Status ==="0"){
                        if(node["Node Type"].indexOf("SECTGRP") != -1){
                            status = "url(#green)";
                            return false;
                        }
                        status = "url(#red)";
                        return false;
                    }else if(node.Comm === "0" && node.Status ==="1"){
                        status = "url(#orange)";
                        return false;
                    }else if(node.Comm === "0" && node.Status ==="2"){
                        status = "url(#yellow)";
                        return false;
                    }else if(node.Comm === "0" && node.Status ==="3"){
                        status = "url(#white)";
                        return false;
                    }else if(node.Comm === "0" && node.Status ==="4"){
                        status = "url(#green)";
                        return false;
                    }else if(node.Comm === "-" && node.Status !="1"){
                        status = "url(#grey)";
                    }else{
                        status = "url(#grey)";
                    }
                })
                return status;
            })
        //$('#'+list[0]["Node Type"] +"_overall-status").append('<div id="'+list[0]["Node Type"] +'_overall-status-led" class="overall-status led round"></div>');
        //set overall status led
        //setOverallLed(list);



        if(list[0]["Node Type"].indexOf("MSDH") !=-1){
            node = svgGroup.selectAll("g.MSDH")
                .data(list.filter(function(d) {
                    return d.ID;
                }));
        }else{
            node = svgGroup.selectAll("g."+list[0]["Node Type"])
                .data(list.filter(function(d) {
                    return d.ID;
                }));
        }
        //create svg place holder
        var nodeEnter = node.enter().append("g")
            .attr("id",function(d){
                if(d["Node Type"].indexOf("SECTGRP") !=-1){
                    return "SECTGRP_"+ d.ID;
                }else if(d["Node Type"].indexOf("ZONE") !=-1){
                    return "ZONE_"+ d.ID;
                }else{
                    return d.ID
                }
            })
            .attr("class", function(d){
                if(d["Node Type"].indexOf("MSDH") !=-1){
                    return "MSDH nodes";
                }else{
                    return d["Node Type"]+ " nodes"
                }
            })
            .attr("node-type", function(d){
                return d["Node Type"];
            })
            .attr("node-type", function(d){
                return d["Node Type"];
            })
            .attr("transform", function(d) {
                return "translate(" +  wWidth/2 + "," + 0 + ")";
            })
            .attr("cursor","pointer")
            .on('click', function(d){
                //Enter to popup.
                if(this.classList === undefined || !this.classList.contains("disabled")){
                    if(d.children ===undefined || d.children.length >0) {
                        // get count of largest rru chain per zone
                        if(d.children !==undefined ){
                            maxChain = 0;
                            for(var i = 0; i < d.children.length; i++)
                            {
                                for(var k = 0; k < bundles.length; k++)
                                {
                                    for(var m = 0; m < bundles[k].nodes.length; m++)
                                    {
                                        if (bundles[k].nodes[m].ID == d.children[i].ID)
                                        {
                                            if (bundles[k].nodes.length > maxChain)
                                                maxChain = bundles[k].nodes.length;
                                        }
                                    }
                                }
                            }
                        }
                        return drawLocalConnection(d);
                    }else{
                        axellPopUp("This group is empty");
                    }
                }
            });
        //append images
        nodeEnter.append("svg:image")
            .attr("xlink:href",function(d){
                if(d["Node Type"].indexOf("APOI")!=-1){
                    return ( "../images/icons/APOI_bigicon.png")
                }else if(d["Node Type"].indexOf("MTDI") !=-1){
                    return ("../images/icons/MTDI_bigicon.png")
                }else if(d["Node Type"].indexOf("MSDH")!=-1){
                    return ("../images/icons/MSDH_bigicon.png")
                }else if(d["Node Type"].indexOf("SECTGRP")!=-1){
                    return ("../images/icons/sectgrp_icon.png")
                }else if(d["Node Type"].indexOf("ZONE")!=-1){
                    return ("../images/icons/zone_icon.png")
                }})
            .attr("id",function(d){
                return d.ID+'_img'
            })
            .attr("class", function(d){
                return d["Node Type"] + "_img"
            })
            .attr("data-id", function(d){
                if(d["Node Type"].indexOf("SECTGRP")!=-1 ||d["Node Type"].indexOf("ZONE")!=-1){
                    return d.name;
                }else{
                    return d.ID;
                }
            })
            .attr("data-node-type", function(d){
                return d["Node Type"];
            })
            .attr("data-location", function(d){
                return d["Location"];
            })
            .attr('x',totalWidth/2 * (-1))
            .attr('y',function(d){

                if(list[0].layer+layerCount!=5){
                    return d.height/2 * (-1);
                }else{
                    return d.height-50 * (-1);
                }

            })


            .attr("width",totalWidth)
            .attr("height",function(d){
                return d.height})
            .style("filter", function(d){
                if (d.Comm === "1") {
                    return "url(#red_shadow)";
                } else {
                    if(displayedNode != null)
                        if(d.ID != displayedNode.ID)
                            return "url(#shadow)";
                        else
                            return "url(#selected_shadow)";

                }
            })
            .style("opacity", function(d){
                if(d["Node Type"].indexOf("SECTGRP")!=-1 || d["Node Type"].indexOf("ZONE")!=-1) {
                    if (d.children.length === 0) {
                        return "0.4";
                    }
                }
            })
        //draw the led
        nodeEnter.append("svg:circle")
            .attr("id",function(d){
                return d.ID+"_led"
            })
            .attr("class", function(d){
                if(d["Node Type"].indexOf("MSDH") === -1) {
                    if(d.Comm === "-"){
                        return d["Node Type"]+"_"+d.ID+"_led led grey";
                    }else if(d.Comm === "1"){
                        return d["Node Type"]+"_"+d.ID+"_led led green";
                    }else if(d.Comm === "0" && d.Status ==="0"){
                        if(d["Node Type"].indexOf("SECTGRP")!=-1){
                            if(sectRed)
                              return d["Node Type"]+"_"+d.ID+"_led led red";
                            else
                              return d["Node Type"]+"_"+d.ID+"_led led green";
                        }
                        return d["Node Type"]+"_"+d.ID+"_led led red";
                    }else if(d.Comm === "0" && d.Status ==="1"){
                        return d["Node Type"]+"_"+d.ID+"_led led orange";
                    }else if(d.Comm === "0" && d.Status ==="2"){
                        return d["Node Type"]+"_"+d.ID+"_led led yellow";
                    }else if(d.Comm === "0" && d.Status ==="3"){
                        return d["Node Type"]+"_"+d.ID+"_led led white";
                    }else if(d.Comm === "0" && d.Status ==="4"){
                        return d["Node Type"]+"_"+d.ID+"_led led green";
                    }else{
                        return d["Node Type"]+"_"+d.ID+"_led led grey";
                    }
                } else {
                    if(d.Status === "-"){
                        return d["Node Type"]+"_"+d.ID+"_led led grey";
                    }else if(d.Status ==="0"){
                        return d["Node Type"]+"_"+d.ID+"_led led red";
                    }else if(d.Status ==="1"){
                        return d["Node Type"]+"_"+d.ID+"_led led orange";
                    }else if(d.Status ==="2"){
                        return d["Node Type"]+"_"+d.ID+"_led led yellow";
                    }else if(d.Status ==="3"){
                        return d["Node Type"]+"_"+d.ID+"_led led white";
                    }else if(d.Status ==="4"){
                        return d["Node Type"]+"_"+d.ID+"_led led green";
                    }else{
                        return d["Node Type"]+"_"+d.ID+"_led led grey";
                    }
                }
            })
            .attr("cx",function(d){
                if(widthRatio<1){
                    return totalWidth/2;
                }else{
                    return d.width/2;
                }
            })
            //offset cy only for layer 5
            .attr("cy",function(d){
                if(widthRatio<1) {
                    return d.height * 0.25 * (-1);
                }else{

                    if(widthRatio<1) {
                        return d.height * 0.25 * (-1);
                    }else{
                        if (list[0].layer+layerCount!=5) {
                            return d.height *0.5 *(-1);
                        }else{
                            return d.width -125 *0.5 *(-1);
                        }
                    }

                }
            })
            .attr("r", 7)
            .style("fill",function(d){
                if(d["Node Type"].indexOf("MSDH") === -1) {
                    if(d.Comm === "-"){
                        return "url(#grey)";
                    }else if(d.Comm === "1"){
                        return "url(#red)";
                    }else if(d.Comm === "0" && d.Status ==="0"){
                        if(d["Node Type"].indexOf("SECTGRP")!=-1){
                            if(d.children.length === 0) { //when sector group empty, return led grey
                                return "url(#grey)";
                            }
                            else{
                                return "url(#green)";
                            }
                        }
                        return "url(#red)";
                    }else if(d.Comm === "0" && d.Status ==="1"){
                        return "url(#orange)";
                    }else if(d.Comm === "0" && d.Status ==="2"){
                        return "url(#yellow)";
                    }else if(d.Comm === "0" && d.Status ==="3"){
                        return "url(#white)";
                    }else if(d.Comm === "0" && d.Status ==="4"){
                        return "url(#green)";
                    }else{
                        return "url(#grey)";
                    }
                } else {
                    if(d.Status === "-"){
                        return "url(#grey)";
                    }else if(d.Status === "0"){
                        return "url(#red)";
                    }else if(d.Status === "1"){
                        return "url(#orange)";
                    }else if(d.Status === "2"){
                        return "url(#yellow)";
                    }else if(d.Status === "3"){
                        return "url(#white)";
                    }else if(d.Status === "4"){
                        return "url(#green)";
                    }else{
                        return "url(#grey)";
                    }
                }
            })
        //add text when zoom
        if(list[0]["Node Type"].indexOf("SECTGRP")!=-1){
            nodeEnter.append("svg:text")
                .text(function(d) {
                    return d.name;
                })
                .attr("class", function(d){
                    return d["Node Type"] + "_label grp_label"
                })
                .attr("x",0)
                .attr("y",-20) // bottom 130
                .attr("font-size","1em")
                .attr("text-anchor","middle")
                .style("visibility", "hidden");
        }else if(list[0]["Node Type"].indexOf("ZONE")!=-1){
            nodeEnter.append("svg:text")
                .text(function(d) {
                    return d.name;
                })
                .attr("class", function(d){
                    return d["Node Type"] + "_label grp_label"
                })
                .attr("x",0)
                .attr("y",80) // bottom 130
                .attr("font-size","1em")
                .attr("text-anchor","middle")
                .style("visibility", "hidden");
        }else{
            nodeEnter.append("svg:text")
                .text(function(d) {
                    return "ID: "+d.ID;
                })
                .attr("class", "device_label")
                .attr("x",0)
                .attr("y",-21)
                .attr("font-size","1em")
                .attr("text-anchor","middle")
                .style("visibility", "hidden");
            nodeEnter.append("svg:text")
                .text(function(d) {
                    return "Node Type: "+d["Node Type"];
                })
                .attr("class", "device_label")
                .attr("x",0)
                .attr("y",-18)
                .attr("font-size","1em")
                .attr("text-anchor","middle")
                .style("visibility", "hidden");
            nodeEnter.append("svg:text")
                .text(function(d) {
                    return "Tag: "+d["Tag"];
                })
                .attr("class", "device_label")
                .attr("x",0)
                .attr("y",-15)
                .attr("font-size","1em")
                .attr("text-anchor","middle")
                .style("visibility", "hidden");
        }
        var counter =0;
        list.forEach(function(d){
            if((counter * (totalWidth+10) + wMargin.right + totalWidth/2) >= (wWidth - wMargin.right)){
                layerCount ++;
                counter =0; //refresh counter to display sector in new row
                d.x =counter * (totalWidth+10) + wMargin.right + totalWidth/2;
            }else{
                d.x =counter * (totalWidth+10) + wMargin.right + totalWidth/2;
            }
            counter++;
            d.y = (d.layer+layerCount) * nodeHeight + d.layer *layerPadding - 70;
        })
        //display tooltip for the title
        $('image').tipsy({
            gravity: 's',
            html: true,
            title: function() {
                //display as SECTOR GROUP instead of SECTGRP
                if($(this).attr("data-node-type") ==="SECTGRP") {
                    return 'ID: ' + $(this).attr("data-id") + '<br> Node Type: BTS PORT GROUP ';
                }else if($(this).attr("data-node-type") ==="ZONE") {
                    return 'ID: ' + $(this).attr("data-id") + '<br> '+$(this).attr("data-node-type");
                }else{
                  if($.cookie('viewMode') =="topology"){
                    //tooltip for topology
                    return 'ID: ' + $(this).attr("data-id") + '<br> Node Type: ' + $(this).attr("data-node-type")+'<br> '+$(this).attr('data-location') ;
                  }else{
                    //tooltip for rackview
                    return 'ID: ' + $(this).parent().parent().attr("data-id") + '<br> Node Type: ' + $(this).parent().parent().attr("data-node-type")+'<br> '+$(this).parent().parent().attr('data-location') ;
                  }
                }
            }
        });
        //set system status led
        setSystemStatusLed();

        // Transition nodes to their new position.

        if(list[0]["Node Type"].indexOf("MSDH") !=-1){
            var nodeUpdate = svgGroup.selectAll("g.MSDH")
                .transition()
                .duration(duration)
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
        }else{
            var nodeUpdate = svgGroup.selectAll("g."+list[0]["Node Type"])
                .transition()
                .duration(duration)
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
        }
    }
    function setSystemStatusLed(){
/*        if(_.flatten(svgGroup.selectAll(".led.red")).length>0){   // need to remove comment - changed to solve alarms issue
            $('#system_status_led').removeClass('green');
            $('#system_status_led').addClass('red');
        }else{
            $('#system_status_led').removeClass('red');
            $('#system_status_led').addClass('green');
        }   */
    }
    /*
    function setOverallLed(list){
        if(_.findWhere(list, {"Comm":"1"})) {
            $('#' + list[0]["Node Type"] + "_overall-status-led").addClass('red');
        }else if(_.findWhere(list, {"Comm":"0"}) && _.findWhere(list, {"Status":"1"})){
            $('#'+list[0]["Node Type"] +"_overall-status-led").addClass('red');
        }else if(_.findWhere(list, {"Comm":"0"}) && _.findWhere(list, {"Status":"0"})){
            $('#'+list[0]["Node Type"] +"_overall-status-led").addClass('green');
        }
    }
    */
    function blinkRedLed(){
        //make red led blink
        var BLINK_DELAY=300;
        var redLeds = null;
        function onTick () {
            if ( !redLeds ) {
                //find all the red leds
                redLeds = $( ".led.red" );
                svgGroup.selectAll(".led.red").classed( "off",true).style("fill","url(#grey)");
                svgPopup.selectAll(".led.red").classed( "off",true).style("fill","url(#grey)");
                svgGroup.selectAll(".led.orange").classed( "off",true).style("fill","url(#grey)");
                svgPopup.selectAll(".led.orange").classed( "off",true).style("fill","url(#grey)");
                svgGroup.selectAll(".led.yellow").classed( "off",true).style("fill","url(#grey)");
                svgPopup.selectAll(".led.yellow").classed( "off",true).style("fill","url(#grey)");
                svgGroup.selectAll(".led.white").classed( "off",true).style("fill","url(#grey)");
                svgPopup.selectAll(".led.white").classed( "off",true).style("fill","url(#grey)");
            } else {
                //turn the previous leds on again by removing the "off" class
                svgGroup.selectAll(".led.red").classed( "off",false ).style("fill","url(#red)");
                svgPopup.selectAll(".led.red").classed( "off",false ).style("fill","url(#red)");
                svgGroup.selectAll(".led.orange").classed( "off",true).style("fill","url(#orange)");
                svgPopup.selectAll(".led.orange").classed( "off",true).style("fill","url(#orange");
                svgGroup.selectAll(".led.yellow").classed( "off",true).style("fill","url(#yellow)");
                svgPopup.selectAll(".led.yellow").classed( "off",true).style("fill","url(#yellow)");
                svgGroup.selectAll(".led.white").classed( "off",true).style("fill","url(#white)");
                svgPopup.selectAll(".led.white").classed( "off",true).style("fill","url(#white)");
                //use the variable as a flag for the next round of execution
                redLeds = null;
            }
            setTimeout( onTick, BLINK_DELAY );
        }
        setTimeout( onTick, BLINK_DELAY );
    }
    //converts node positions into positions on screen.
    function getScreenCoords(x, y, ctm) {
        //console.log(ctm.e +" "+x +" "+ctm.a);
        //console.log(ctm.f +" "+y +" "+ctm.d);
        var xn = ctm.e + x*ctm.a;
        var yn = ctm.f + y*ctm.d;
        return { x: xn, y: yn };
    }

    $(document).ready(function() {
        api.exe({
            cmd: getAttr('mdl'),
            onSuccess: function (o) {
                var mdl = o.ajaxdata;
                if (mdl === "MSDH-M") {
                    if (OPERATORS.length > 0) {
                        $.each(OPERATORS, function (key, value) {
                            $('#operator_list').append($('<option>', {
                                value: value.SysName,
                                text: value.FullName
                            }));
                        })
                        //if there is current operator found in cookie, update operator select to be current operator
                        if($.cookie('currentOperator') !=null) {
                            $('#operator_list option[value=' + $.cookie('currentOperator') + ']').attr("selected", "selected");
                        }else{
                            $('#operator_list option[value=' + $('#operator_list select:first').val() + ']').attr("selected", "selected");
                            $.cookie('currentOperator', $('#operator_list').val(), { expires: 7, path: '/' });
                        }
                        getData($.cookie('viewMode'));
                    } else {
                        if(USERNAME === 'sysadmin') {
                            window.location.href = '/target/initial_setup';
                        }else{
                            axellPopUp("User does not belong to any operator");
                        }
                    }
                    UpdateRfrangesList();
                    UpdateConnections();
                    UpdateCellresList();
                    UpdateSectorAlarm();
                } else if (mdl === "MSDH-S") {
                    window.location.href = '/target/status';
                }
                axshCall( "get prm", function ( out, err ) {
                  if ( err ) {
                      console.error( "Could not read prm attribute: " + err );
                      return;
                  }
                  prm = out;        
                });
            },
            onError: function (err) {
                console.log(err.errorThrown);
            }
        })
        blinkRedLed();
        updateScreenSize();
        //hide popup window
        $('#popup').hide();
        $.removeCookie('operator', { path: '/' });
        $('#username').text($.cookie('username'));


        //set viewmode into a cookie for keeping track of
        //if there is current operator found in cookie, update operator select to be current operator
        if($.cookie('viewMode') !=null) {
            $('#display_filter_list option[value=' + $.cookie('viewMode') + ']').attr("selected", "selected");
        }else{
            $('#display_filter_list option[value=' + $('#display_filter_list select:first').val() + ']').attr("selected", "selected");
            $.cookie('viewMode', $('#display_filter_list').val(), { expires: 7, path: '/' });
        }
        //on change view mode
        $('#display_filter_list').change(function(){
            $.removeCookie('viewMode',{ path: '/' });
            $.cookie('viewMode', $('#display_filter_list').val(), { expires: 7, path: '/' });
            getData($.cookie('viewMode'));
        })

        /*
        //on click on nodes in rack
        $(document).on('click','g.rackNode',function(){
            var thisNode = _.findWhere(totalOtherNodeList, {"ID": $(this).attr('id')});
            drawLocalConnection(thisNode);
            displayedNode = thisNode;
            drawARack($(this).data('rackid'),thisNode);
            //highlight the slot with thisNode
            $('#popup-rack-' + $(this).data('rackid') + '-slot-' + $(this).data('slotid')).addClass('highlightedSlot');
        })
        */
        //on click on nodes in rack
        $(document).on('click','.popup_node_placeholder',function(){
            var thisNode = _.findWhere(totalOtherNodeList, {"ID": $(this).attr('id')});
            if(thisNode!=undefined) {
                drawLocalConnection(thisNode);
                displayedNode = thisNode;
                $('#left_side_bar').show();
                //highlight the slot with thisNode
                $('.rackSlot').removeClass('highlightedSlot');
                $('#popup-rack-' + $(this).data('rackid') + '-slot-' + $(this).data('slotid')).addClass('highlightedSlot');
            }
        })

        //if session storage for mdl exist then use it to check if target is MSDH-M or slave
        //if not exist then call for it
        /*
        if(! sessionStorage.getItem( 'header-get-mdl' ) ) {
            api.exe({
                cmd: 'get mdl',
                onSuccess: function (o) {
                    var MDL = o.ajaxdata;
                    if (MDL === "MSDH-M") {
                        if (OPERATORS.length > 0) {
                            $.each(OPERATORS, function (key, value) {
                                $('#operator_list').append($('<option>', {
                                    value: value.SysName,
                                    text: value.FullName
                                }));
                            })
                            //if there is current operator found in cookie, update operator select to be current operator
                            if($.cookie('currentOperator') !=null) {
                                $('#operator_list option[value=' + $.cookie('currentOperator') + ']').attr("selected", "selected");
                            }else{
                                $('#operator_list option[value=' + $('#operator_list select:first').val() + ']').attr("selected", "selected");
                                $.cookie('currentOperator', $('#operator_list').val(), { expires: 7, path: '/' });
                            }
                            getData();
                        } else {
                            if(USERNAME === 'sysadmin') {
                                window.location.href = '/target/initial_setup';
                            }else{
                                axellPopUp("User does not belong to any operator");
                            }
                        }
                    } else if (MDL === "MSDH-S") {
                        window.location.href = '/target/status';
                    }
                }
            })
        }else{
            if (sessionStorage.getItem( 'header-get-mdl' ) === "MSDH-M") {
                if (OPERATORS.length > 0) {
                    $.each(OPERATORS, function (key, value) {
                        $('#operator_list').append($('<option>', {
                            value: value.SysName,
                            text: value.FullName
                        }));
                    })
                    //if there is current operator found in cookie, update operator select to be current operator
                    if($.cookie('currentOperator') !=null) {
                        $('#operator_list option[value=' + $.cookie('currentOperator') + ']').attr("selected", "selected");
                    }else{
                        $('#operator_list option[value=' + $('#operator_list select:first').val() + ']').attr("selected", "selected");
                        $.cookie('currentOperator', $('#operator_list').val(), { expires: 7, path: '/' });
                    }
                    getData();
                } else {
                    if(USERNAME === 'sysadmin') {
                        window.location.href = '/target/initial_setup';
                    }else{
                        axellPopUp("User does not belong to any operator");
                    }
                }
            } else if (sessionStorage.getItem( 'header-get-mdl' ) === "MSDH-S") {
                window.location.href = '/target/status';
            }
        }
        */
        //$.cookie('operator', $('#operator_list').val(), { expires: 7, path: '/' });
        $( "#operator_list" ).change(function() {
            api.exe({
                cmd:'RFROUTE PROFILES -o '+$("#operator_list").val()+' --json',
                dataType:'json',
                onSuccess:function(o){
                    var rfrouteList = $.parseJSON(o.ajaxdata);
                    $("#routing_setup_select").empty();
                    $("#routing_setup_select").text(rfrouteList.Active);
                    api.exe({
                     cmd: 'get_rrc_message ' + $("#operator_list").val(),
                     dataType: 'text',
                     async: false,
                     onSuccess: function (e) {
                        var status = 0;
                        if(e.ajaxdata.indexOf("Error") != -1)
                           status = 1;
                        setLedColor('#routing-setup-led',status);
                        if (status == 0) {
                           $('#setup-message').text('Routing profile setup is OK');
                           $('#routing-setup-detail').hide();
                           $('#routing-setup-btn-panel').hide();
                           $('#routing_setup').removeClass('setup-error');
                        }else {
                           $('#setup-message').text('Error in activating routing profile');
                           $('#routing-setup-detail').show();
                           //$('#routing-setup-btn-panel').hide();
                           $('#routing_setup').addClass('setup-error');
                           //$('#last-setup').text(convert.epoch2slashedDDMMYYYY(rfrouteList.LastError));
                           $('#setup-msg').text(e.ajaxdata);
                        }
                     }
                    })
                }
            })
            $.removeCookie('currentOperator',{ path: '/' });
            $.cookie('currentOperator', $('#operator_list').val(), { expires: 7, path: '/' });
            getData($.cookie('viewMode'));
            UpdateConnections();
            UpdateCellresList();
            UpdateSectorAlarm();
        })

        //when hover over the profile name, slide down routing setup status panel
        $('#routing-setup-panel').hide();
        //if RO user, disabled clear alarm for set up routing panel
        if(USERACCESS =="RO") {
            $('#clear-routing-setup-ala-btn').addClass('disabled');
        }
        $('#routing_setup').hover(function(){
            $('#routing-setup-panel').stop().slideDown();
        },function(){
            $('#routing-setup-panel').slideUp();
        })
        //click on clear setup alarm
        /*$('#clear-routing-setup-ala-btn').click(function(){
            if(!$(this).hasClass('disabled')) {
                api.exe({
                    cmd: 'clear_routing_alarm ' + $("#operator_list").val(),
                    onSuccess: function () {
                        //refresh the setup route panel details
                        api.exe({
                            cmd: 'RFROUTE PROFILES -o ' + $("#operator_list").val() + ' --json',
                            dataType: 'json',
                            onSuccess: function (o) {
                                //display rfsetup status on page
                                setLedColor('#routing-setup-led', o.ajaxdata.RoutingStatus);
                                if (o.ajaxdata.RoutingStatus != 1) {
                                    if (o.ajaxdata.Active == "disabled"){
                                      setLedColor('#routing-setup-led','grey');
                                      $('#setup-message').text('Routing profile setup is DEFAULT');
                                    }else{
                                      $('#setup-message').text('Routing profile setup is OK');
                                    }
                                    $('#routing-setup-detail').hide();
                                    $('#routing-setup-btn-panel').hide();
                                    $('#routing_setup').removeClass('setup-error');
                                } else {
                                    $('#setup-message').text('Error in activating routing profile');
                                    $('#routing-setup-detail').show();
                                    $('#routing-setup-btn-panel').hide();
                                    $('#routing_setup').addClass('setup-error');
                                    $('#last-setup').text(convert.epoch2slashedDDMMYYYY(o.ajaxdata.LastError));
                                    $('#setup-msg').text(o.ajaxdata.AlarmMessage);
                                }
                            }
                        })
                    },
                    onError: function (err) {
                        axellPopUp(err.errorThrown);
                    }
                })
            }
        })*/
        $('#clear-routing-setup-ala-btn').click(function(){
            setLedColor('#routing-setup-led', 0);
            $('#setup-message').text('Routing profile setup is OK');
            $('#routing-setup-detail').hide();
            $('#routing-setup-btn-panel').hide();
            $('#routing_setup').removeClass('setup-error');
        })

        $(document).on("click", function(event){
            //function when click outside popup window,
            var clickTarget =  $('g.nodes').add($('g.popup_nodes')).add($('.popup_rect')).add($('#popup_hide_button'))
                .add($('#popup')).add($('.rack')).add($('.node_placeholder')).add($('#right_side_bar_show_button')).add($('#right_side_bar'))
                .add($('#left_side_bar_show_button')).add($('#left_side_bar')).add($('.ui-dialog'));
            if (!clickTarget.is(event.target) && clickTarget.has(event.target).length === 0){
                svgPopup.selectAll("g.popup_nodes").remove();
                svgPopup.selectAll("path.connection").remove();
                svgPopup.selectAll("text.slotNumber").remove();
                $('#popup').hide();
                //refresh sidebar content
                $('#right_side_bar_header_text').empty();
                $('#right_side_bar_header_text').text("Node details");
                $('#right_side_bar_content').empty();
                $('#right_side_bar_content').text("Please select node or hover over part of node");
            }

        })

        $(document).on("click","#popup_hide_button", function(){
            svgPopup.selectAll("g.popup_nodes").remove();
            svgPopup.selectAll("path.connection").remove();
            svgPopup.selectAll("text.slotNumber").remove();
            $('#popup').hide();
            //refresh sidebar content
            $('#right_side_bar_header_text').empty();
            $('#right_side_bar_header_text').text("Node details");
            $('#right_side_bar_content').empty();
            $('#right_side_bar_content').text("Please select node or hover over part of node");
        })

        //delete sector
        $(document).on('click','.delete_sector_btn',function(){
            if(!$(this).hasClass('disabled')) {
                var $this = $(this);
                axellConfirm("alert","Warning","Do you really want to delete this BTS port?", function () {
                    api.exe({
                        cmd: "SECTOR -o " + $("#operator_list").val() + " DELETE " + $this.attr("data-sector-id"),
                        onSuccess: function () {
                            axellPopUp("BTS port " + $this.attr("data-sector-id") + " has been deleted successfully");
                            $('#popup').hide();
                            getData($.cookie('viewMode'));
                        }
                    })
                })
            }
        })


        //if select sectgroup list, move sector to that list
        $(document).on('change','#sectgrp-select',function(){
            var $this =$(this);
            api.exe({
                cmd:'SECTGRP -o '+$("#operator_list").val()+' MOVE '+$this.attr("data-sector-id")+' "'+$this.val()+'"',
                onSuccess:function(){
                    axellPopUp("BTS port "+ $this.attr("data-sector-id")+" has been moved to "+ $this.val());
                    $('#popup').hide();
                    getData($.cookie('viewMode'));
                }
            })
        })

        //if select zone list, move remote to that zone
        $(document).on('change','#zone-select',function(){
            var $this =$(this);
            var kMove = undefined;
            for(var k = 0; k < bundles.length; k ++)
            {
               for(var m = 0; m < bundles[k].nodes.length; m++)
               {
                  if (bundles[k].nodes[m].ID == $this.attr("data-remote-id"))
                     kMove = k;
               }
            }
            if (kMove != undefined)
            {
               for(var m = 0; m < bundles[kMove].nodes.length; m++)
               {
                  api.exe({
                      cmd:'ZONE -o '+$("#operator_list").val()+' MOVE '+bundles[kMove].nodes[m].ID+' "'+$this.val()+'"',
                      onSuccess:function(){
                      }
                  })
               }
               axellPopUp("Chain "+ kMove+" has been moved to "+ $this.val());
               $('#popup').hide();
               getData($.cookie('viewMode'));
            }
            else
            {
               api.exe({
                   cmd:'ZONE -o '+$("#operator_list").val()+' MOVE '+$this.attr("data-remote-id")+' "'+$this.val()+'"',
                   onSuccess:function(){
                       axellPopUp("BTS port "+ $this.attr("data-remote-id")+" has been moved to "+ $this.val());
                       $('#popup').hide();
                       getData($.cookie('viewMode'));
                   }
               })
            }
        })
        //if delete connection button on click
        $(document).on('click','.delete_conn',function(){
            var $this =$(this);
            if(!$this.hasClass('disabled')) {
                axellConfirm("alert","Warning","Do you really want to delete this connection?", function () {
                    api.exe({
                        cmd: 'connections -o ' + $("#operator_list").val() + ' DEL ' + $this.attr("data-conn-id"),
                        onSuccess: function () {
                            axellPopUp("Connection " + $this.attr("data-conn-id") + " has been deleted successfully");
                            $('#popup').hide();
                            getData($.cookie('viewMode'));
                        }
                    })
                })
            }
        })
        //if update order of node
        $(document).on('change','#node_order',function(){
            var $this = $(this);
            api.exe({
                cmd:'topology -o '+$("#operator_list").val()+' --order '+$this.data('node-serial') +' '+$this.val(),
                onSuccess:function(){
                    //refresh topology
                    axellPopUp("Node " + $this.data('node-serial') + " has been updated to position "+$this.val());
                    $('#popup').hide();
                    getData($.cookie('viewMode'));
                },
                onError:function(err){
                    axellPopUp(err.errorThrown);
                }
            })
        })


        //if delete node button on click
        $(document).on('click','.delete_node',function(){
            var $this =$(this);
            if(!$this.hasClass('disabled')) {
                axellConfirm("alert","Warning","Do you really want to delete this node?", function () {
                    $.blockUI({
                        fadeIn: 1000,
                        timeout: 10000,
                        onBlock: function() {
                          api.exe({
                              cmd: 'NODE CHECK ' + $this.attr("data-node-id"),
                              onSuccess: function () {
                                  axellPopUp("Node " + $this.attr("data-node-id") + " has been deleted successfully");
                                  $('#popup').hide();
                                  getData($.cookie('viewMode'));
                                  api.exe({
                                    cmd: "delete_serials_opers " + $this.attr("data-node-id"),
                                    dataType: 'text',
                                    async: false,
                                    onSuccess: function (o) {
                                       console.log(o.ajaxdata);
                                    }
                                  })
                              },
                              onError: function (err) {
                                 $.unblockUI();
                                 //axellPopUp(err.errorThrown);
                                 axellConfirm("alert","Warning","There are some configurations for this node. Do you really want to delete this node and it's configurations?", function () {
                                      $.blockUI({
                                          fadeIn: 1000,
                                          timeout: 10000,
                                          onBlock: function() {
                                            api.exe({
                                                cmd: 'NODE DELETE ' + $this.attr("data-node-id"),
                                                onSuccess: function () {
                                                    axellPopUp("Node " + $this.attr("data-node-id") + " has been deleted successfully");
                                                    $('#popup').hide();
                                                    getData($.cookie('viewMode'));
                                                    api.exe({
                                                      cmd: "delete_serials_opers " + $this.attr("data-node-id"),
                                                      dataType: 'text',
                                                      async: false,
                                                      onSuccess: function (o) {
                                                         console.log(o.ajaxdata);
                                                      }
                                                    })
                                                },
                                                onError: function (err) {
                                                   axellPopUp(err.errorThrown);
                                                }
                                            })
                                          }
                                      })
                                 })
                              }
                          })
                        }
                    })
                })
            }
        })

        //if delete digital connection button on click
        $(document).on('click','.delete_dig_conn',function(){
            var $this =$(this);
            if(!$this.hasClass('disabled')) {
                var timeout = 1;//seconds

                $('#disable_connection_dialog').dialog({
                    modal: true,
                    width:500,
                    title: "Disable digital connection",
                    open: function() {
                        $('#hour').empty();
                        $('#minute').empty();
                        $('#minute').prop('disabled',false);
                        for(var i=0;i<=24;i++) {
                            $('#hour').append('<option>' + i + '</option>');
                        }
                        for(var i=0;i<=59;i++){
                            $('#minute').append('<option>' + i + '</option>');
                        }
                        $('#hour').val('1');
                        $('#minute').val('0');
                        $(document).on('change','#hour',function(){
                            if($(this).val() == 24){
                                $('#minute').val('0');
                                $('#minute').prop('disabled',true);
                            }else if($(this).val() == 0) {
                                if($('#minute').val() == 0) {
                                    $('#minute').val('1');
                                }
                                $('#minute').prop('disabled',false);
                            }else{
                                $('#minute').prop('disabled',false);
                            }
                        })
                        $(document).on('change','#minute',function(){
                            if($(this).val() == 0){
                                if($('#hour').val() == 0){
                                    axellPopUp("Minimum timeout is 1 minute.");
                                    $(this).val("1");
                                }
                            }else{
                                $('#minute').prop('disabled',false);
                            }
                        })
                    },
                    buttons: {
                        Cancel:function(){
                            $(this).dialog('close')
                        },
                        Disable: function() {
                            var hour = $('#hour').val();
                            var minute = $('#minute').val();
                            timeout= Number(hour*3600 + minute*60);
                            api.exe({
                                cmd: 'connections -o ' + $("#operator_list").val() + ' DISABLE ' + $this.attr("data-port-id") +' '+timeout,
                                onSuccess: function () {
                                    axellPopUp("Connection to CPRI port number " + $this.attr("data-port-id") + " has been disabled for " +hour +" hour(s) "+minute+" minute(s)");
                                    $('#popup').hide();
                                    getData($.cookie('viewMode'));
                                },
                                onError:function(err){
                                    axellPopUp(err.errorThrown);
                                }
                            })
                            $(this).dialog('close')
                        }
                    }
                });
                $('#disable_connection_dialog').dialog('open');
            }
        })
        $(document).on('click','.refresh_connection',function(){
            var $this = $(this);
            axellConfirm("info","Notice","Are you sure you want to refresh all the connections in the system?",function(){
               $.blockUI({
                  fadeIn: 1000,
                  timeout: 180000,
                  onBlock: function() {
                     var ipadd = $this.data("nodeip");
                     api.exe({
                       cmd:"refresh_connections "+ipadd,
                       onSuccess:function(){
                           //axellPopUp("Refreshing all connections...");
                       },
                       onError:function(err){
                           //axellPopUp(err.errorThrown);
                       }
                     })
                  }
               })
            })
        })
        $(document).on('click','.import_configuration',function(){
            var $this = $(this);
            axellConfirm("info","Notice","Are you sure you want to import general configuration from current MSDH to remote MSDH?",function(){
               $.blockUI({
                  fadeIn: 1000,
                  timeout: 60000,
                  onBlock: function() {
                     var ip = $this.data("nodeip");
                     api.exe({
                       cmd:"copy_configuration "+ip+" 1",
                       onSuccess:function(){
                           axellPopUp("General configuration is imported");
                           $.unblockUI();
                           axellConfirm("info","Notice","Are you sure you also want to import BTS port configuration from current MSDH to remote MSDH? All configuration will be overwritten",function(){
                              $.blockUI({
                                 fadeIn: 1000,
                                 timeout: 60000,
                                 onBlock: function() {
                                    var ip = $this.data("nodeip");
                                    api.exe({
                                      cmd:"copy_configuration "+ip+" 2",
                                      onSuccess:function(){
                                          axellPopUp("BTS port configuration is imported");
                                          $.unblockUI();
                                      },
                                      onError:function(err){
                                          axellPopUp(err.errorThrown);
                                          $.unblockUI();
                                      }
                                    })
                                 }
                              })
                           })
                       },
                       onError:function(err){
                           axellPopUp(err.errorThrown);
                           $.unblockUI();
                       }
                     })
                  }
               })
            })
        })
        //find group by name
        $(document).on('click','.view',function(){
            if(displayedNode["Node Type"] && displayedNode["Node Type"].indexOf("RRU") != -1){
                var _zone = "";
                $.each(zoneList,function(key,zone){
                    if(_.contains(zone.remoteList,displayedNode.ID)) {
                        _zone = zone.zoneName;
                    }
                })
                if(_zone != ""){
                    var x = $('[data-id="'+_zone+'"]')[0].__data__;
                    //get count of rru chains and scale if return the largest
                    if(x.children !==undefined ){
                        maxChain = 0;
                        for(var i = 0; i < x.children.length; i++)
                        {
                            for(var k = 0; k < bundles.length; k++)
                            {
                                for(var m = 0; m < bundles[k].nodes.length; m++)
                                {
                                    if (bundles[k].nodes[m].ID == x.children[i].ID)
                                    {
                                        if (bundles[k].nodes.length > maxChain)
                                            maxChain = bundles[k].nodes.length;
                                    }
                                }
                            }
                        }
                    }

                    if(x["Node Type"] == "ZONE")
                        drawLocalConnection(x);
                    else {
                        x = $('[data-id="'+_zone+'"]')[1].__data__;
                        if(x["Node Type"] == "ZONE")
                        drawLocalConnection(x);
                    }
                }
            }else{
                drawLocalConnection(displayedNode);
            }
            return false;
        })

        $(document).on('click', '.identify', function(){
            var $this = $(this);
            var identify_id = $this.data('node-id');
            if(!$this.hasClass('disabled'))
            {
                api.exe({
                    cmd: 'identify ' + identify_id + ' 30',
                    onSuccess: function () {
                        console.log("Executing identify on node with id: " + identify_id);

                    },
                    onError: function (err) {
                        console.log(err.errorThrown);
                    }
                })
            }
        });

    })

    function displayZoom(){
        var parameters = location.search.substring(1).split("&");
        if (parameters.length > 1)
        {
           var temp = parameters[0].split("=");
           var NodeType = unescape(temp[1]);
           temp = parameters[1].split("=");
           var ID = unescape(temp[1]);
           temp = parameters[2].split("=");
           var Status = unescape(temp[1]);
           temp = parameters[3].split("=");
           var Comm = unescape(temp[1]);
           temp = parameters[4].split("=");
           var Tag = unescape(temp[1]);
           if (NodeType.indexOf('VIRT_SECT') != -1)
           {
              temp = parameters[5].split("=");
              var BtsTag = unescape(temp[1]);
              temp = parameters[6].split("=");
              var Band = unescape(temp[1]);
              temp = parameters[7].split("=");
              var Conn = unescape(temp[1]);
              temp = parameters[8].split("=");
              var Duplex = unescape(temp[1]);
              temp = parameters[9].split("=");
              var LowerBandDl = unescape(temp[1]);
              temp = parameters[10].split("=");
              var UpperBandDl = unescape(temp[1]);
              temp = parameters[11].split("=");
              var Operator = unescape(temp[1]);
              temp = parameters[12].split("=");
              var SectorId = unescape(temp[1]);
           }
           else
           {
              temp = parameters[5].split("=");
              var Location = unescape(temp[1]);
              temp = parameters[6].split("=");
              var System = unescape(temp[1]);
              temp = parameters[7].split("=");
              var Common = unescape(temp[1]);
              temp = parameters[8].split("=");
              var Target = unescape(temp[1]);
              temp = parameters[9].split("=");
              var IP = unescape(temp[1]);
           }

           var depth;
           var height;
           var layer;
           var popup_height;
           var popup_width;
           var width;
           var x;
           var y;

           if(NodeType.indexOf('APOI') != -1)
           {
               height = 27;
               layer = 2;
               popup_height = 138;
               popup_width = 500;
               width = 100;
               x = 567;
               y = 352;
           }
           else if(NodeType.indexOf('MSDH') != -1)
           {
               height = 9;
               layer = 4;
               popup_height = 51;
               popup_width = 500;
               width = 100;
               x = 567;
               y = 352;
           }
           else if(NodeType.indexOf('MTDI') != -1)
           {
               height = 10;
               layer = 3;
               popup_height = 48;
               popup_width = 500;
               width = 100;
               x = 396;
               y = 70;
           }
           else if(NodeType.indexOf('RRU') != -1)
           {
               height = 37;
               layer = 5;
               popup_height = 0;
               popup_width = 0;
               width = 25;
               x = 674;
               y = 312;
           }
           else if(NodeType.indexOf('VIRT_SECT') != -1)
           {
               depth = 2;
               height = 30;
               layer = 1;
               width = 25;
               x = 230;
               y = 30;
           }

           $.blockUI({
               fadeIn: 1000,
               timeout: 5000,
               onBlock: function() {
                 setTimeout(function() {
                    if (NodeType.indexOf('VIRT_SECT') != -1){
                       drawLocalConnection({"BTS Tag":BtsTag,"Band":Band,"Comm":Comm,"Common":"-","Conn":Conn,"Cres":"-","Duplex":Duplex,"ID":ID,"IP":"-","Location":"-",
                       "LowerBandDL":LowerBandDl,"Node Type":NodeType,"Operator":Operator,"Route":"-","SectorID":SectorId,"Status":Status,"System":"-","Tag":Tag,
                       "Target":"-","UpperBandDL":UpperBandDl,"depth":depth,"height":height,"layer":layer,"width":width,"x":x,"y":y});
                    }else if (NodeType.indexOf('RRU') == -1){
                       drawLocalConnection({"Comm":Comm,"Common":Common,"Cres":"-","ID":ID,"IP":IP,"Location":Location,
                       "Node Type":NodeType,"NodeOrder":"-","Route":"-","Status":Status,"System":System,"Tag":Tag,
                       "Target":Target,"height":height,"layer":layer,"popup_height":popup_height,"popup_width":popup_width,"width":width,"x":x,"y":y});
                    }else{
                       var _zone = "";
                       $.each(zoneList,function(key,zone){
                          if(_.contains(zone.remoteList,ID)) {
                              _zone = zone.zoneName;
                          }
                       })
                       if(_zone != ""){
                            var x = $('[data-id="'+_zone+'"]')[0].__data__;
                            //get count of rru chains and scale if return the largest
                            if(x.children !==undefined ){
                                maxChain = 0;
                                for(var i = 0; i < x.children.length; i++)
                                {
                                    for(var k = 0; k < bundles.length; k++)
                                    {
                                        for(var m = 0; m < bundles[k].nodes.length; m++)
                                        {
                                            if (bundles[k].nodes[m].ID == x.children[i].ID)
                                            {
                                                if (bundles[k].nodes.length > maxChain)
                                                    maxChain = bundles[k].nodes.length;
                                            }
                                        }
                                    }
                                }
                            }
                          if(x["Node Type"] == "ZONE")
                              drawLocalConnection(x);
                          else {
                              x = $('[data-id="'+_zone+'"]')[1].__data__;
                              if(x["Node Type"] == "ZONE")
                              drawLocalConnection(x);
                          }
                       }
                    }
                    var list = $('#popup').find("g").removeAttr("style");
                    $('#popup').find("#popup_" + ID).attr("style", "filter: url(#selected_shadow)");
                    $.unblockUI();
                 }, 1000);
               }
           })
        }
    }

    function displayPathDetails(path){
      var len = "-";
      api.exe({
         cmd: "get_remote_measurements_sfp " + $(path).attr("to-id"),
         dataType: 'json',
         async: false,
         onSuccess: function (o) {
			  $.each(o.ajaxdata.sfps,function(key, value){
               if(value.remoteSerial == $(path).attr("from-id")){
				      var dlink = parseInt(value.cpriDelay);
				      if (dlink <= 0){
					      len = "-";
				      }else if (dlink < 1000){
					      len = dlink + "m";
				      }else if (dlink > 1000){
					       len = dlink/1000 + "km";
				      }else if (dlink == null){
					      len = "-";
				      }else{
					      len = dlink + "m";
				      }
               }
           })

           $('#right_side_bar_content').empty();
           $('#right_side_bar_header_text').text("Connection from "+$(path).attr("from-id")+" to "+ $(path).attr("to-id") );
           var html ="";
           html +='<table class="type1">';
           if($(path).attr("conn-type") !=undefined){
               html += '<caption>'+$(path).attr("conn-type")+' - '+$(path).attr("conn-id")+'</caption>';
           }else{
               html += '<caption>'+$(path).attr("conn-id")+'</caption>';
           }
           html += '<tr><th colspan="2">Source: '+$(path).attr("from")+'</th><th colspan="2">Destination: '+$(path).attr("to")+'</th><th colspan="1">Link Length</th></tr>';
           html += '<tr><th>Serial</th><th>Port ID</th><th>Serial</th><th>Port ID</th><th>Length</th></tr>';
           html += '<tr><td rowspan="2">'+$(path).attr("from-id")+'</td>';
           if($(path).attr("from-port-id").indexOf("INTERCONN") !=-1){
               html += '<td>' + $(path).attr("from-port-id").substring($(path).attr("from-port-id").lastIndexOf(":")+1,$(path).attr("from-port-id").length) + '</td>';
           }else {
               html += '<td>' + $(path).attr("from-port-id") + '</td>';
           }
           html += '<td rowspan="2">'+$(path).attr("to-id")+'</td>';
           if($(path).attr("from-port-id").indexOf("INTERCONN") !=-1){
               html += '<td>' + $(path).attr("to-port-id").substring($(path).attr("to-port-id").lastIndexOf(":")+1,$(path).attr("to-port-id").length) + '</td>';
           }else {
               html += '<td>' + $(path).attr("to-port-id") + '</td>';
           }
           if($(path).attr("conn-type") ==="DLUL") {
               var otherFromPort="";
               var otherToPort="";
               if($(path).attr("from") != "VIRT_SECT") {
                   if ($(path).attr("from-port-id").indexOf("DL") != -1) {
                       otherFromPort = $(path).attr("from-port-id").substring(0, $(path).attr("from-port-id").indexOf("DL")) + "UL" + $(path).attr("from-port-id").charAt($(path).attr("from-port-id").length - 1);
                   } else {
                       otherFromPort = $(path).attr("from-port-id").substring(0, $(path).attr("from-port-id").indexOf("UL")) + "DL" + $(path).attr("from-port-id").charAt($(path).attr("from-port-id").length - 1);
                   }
               }
               var otherToPort;
               if ($(path).attr("to-port-id").indexOf("DL") != -1) {
                   otherToPort = $(path).attr("to-port-id").substring(0, $(path).attr("to-port-id").indexOf("DL")) + "UL" + $(path).attr("to-port-id").charAt($(path).attr("to-port-id").length - 1);
               } else {
                   otherToPort = $(path).attr("to-port-id").substring(0, $(path).attr("to-port-id").indexOf("UL")) + "DL" + $(path).attr("to-port-id").charAt($(path).attr("to-port-id").length - 1);
               }
               html += '<tr><td>' + otherFromPort + '</td>';
               html += '<td>' + otherToPort + '</td>';
           }
           html += '<td rowspan="2">'+len+'</td></tr>';
           html += '</table>';
           if($(path).attr("conn-id").indexOf('RF') != -1){
               // html += "<div id='right_side_bar_button_panel'><a class='delete_conn button' data-conn-id='"+$(path).attr("conn-id")+"'> Delete connection </a></div>"
           }else if($(path).attr("from").indexOf("MSDH") !=-1 || $(path).attr("to").indexOf("MSDH") !=-1){
               var msdhPort ="";
               if($(path).attr("from").indexOf("MSDH") !=-1){
                   msdhPort = $(path).attr("from-port-id").substring($(path).attr("from-port-id").indexOf(":")+1, $(path).attr("from-port-id").length);
               }else if($(path).attr("to").indexOf("MSDH") !=-1){
                   msdhPort = $(path).attr("to-port-id").substring($(path).attr("from-port-id").indexOf(":")+1, $(path).attr("to-port-id").length);
               }
               //html += "<div id='right_side_bar_button_panel'><a class='delete_dig_conn button' data-port-id='"+msdhPort+"'> Disable connection </a></div>"
           }
           $('#right_side_bar_content').append(html);
           $("#right_side_bar").show();
         }
      })
    }

    function right_side_bar_header_text(node) {
        if(node["Node Type"].indexOf("VIRT_SECT") != -1){
            $('#right_side_bar_header_text').text('BTS ' + node["BTS Tag"]);
        }else if(node["Node Type"].indexOf("APOI") != -1){
            $('#right_side_bar_header_text').text('APOI '+ node.ID);
        }else if(node["Node Type"].indexOf("MTDI") != -1){
            $('#right_side_bar_header_text').text('MTDI '+ node.ID);
        }else if(node["Node Type"].indexOf("MSDH") != -1){
            $('#right_side_bar_header_text').text('MSDH '+ node.ID);
        }else if(node["Node Type"].indexOf("RRU40") != -1){
            $('#right_side_bar_header_text').text('RRU40 '+ node.ID);
        }else if(node["Node Type"].indexOf("RRU") != -1){
            $('#right_side_bar_header_text').text('RRU '+ node.ID);
        }
    }

    function right_side_bar_node_desc(node) {
        var img="";
        var content_node_desc_html="";
        $('#right_side_bar_content_node_desc').empty().hide();
        if(node["Node Type"].indexOf("VIRT_SECT") !== -1){
            img = "sector";
        }else if (node["Node Type"].indexOf("APOI") !== -1){
            img = "APOI";
        }else if (node["Node Type"].indexOf("MTDI") !== -1){
            img = "MTDI";
        }else if (node["Node Type"].indexOf("MSDH") !== -1){
            img = "MSDH";
        }
        else if (node["Node Type"].indexOf("RRU40") !== -1){
            img = "RRU40";
        }
        else if (node["Node Type"].indexOf("RRU") !== -1){
            img = "RRU";
        }
        content_node_desc_html += '<div class="side_bar_icon"><img src="../images/icons/'+img+'_icon.png"/></div>';
        content_node_desc_html += '<label>Model: </label><span>'+node["Node Type"]+'</span>';
        if(node["Node Type"] != 'VIRT_SECT' )
        {
            content_node_desc_html += "<label>Status: </label>";
            switch(node.Status)
            {
                case '0':
                    content_node_desc_html += "<div class='led round red'>";
                    break;
                case '1':
                    content_node_desc_html += "<div class='led round orange'>";
                    break;
                case '2':
                    content_node_desc_html += "<div class='led round yellow'>";
                    break;
                case '3':
                    content_node_desc_html += "<div class='led round white'>";
                    break;
                case '4':
                    content_node_desc_html += "<div class='led round green'>";
                    break;
                case '-':
                    content_node_desc_html += "<div class='led round grey'>";
                    break;
            }
            content_node_desc_html += "</div><br>";

            if(node["Node Type"].indexOf("MSDH-M") === -1) {
                content_node_desc_html += "<label>Comm Status: </label>";
                switch(node.Comm)
                {
                    case '0':
                        content_node_desc_html += "<div class='led round green'>";
                        break;
                    case '1':
                        content_node_desc_html += "<div class='led round red'>";
                        break;
                    case '-':
                        content_node_desc_html += "<div class='led round grey'>";
                        break;
                }
                content_node_desc_html += "</div><br>";
            }

            if(node["Node Type"].indexOf("APOI") === -1) {
                content_node_desc_html += "<label>Route Status: </label>";
                switch (node.Route) {
                    case '0':
                        content_node_desc_html += "<div class='led round green'>";
                        break;
                    case '1':
                        content_node_desc_html += "<div class='led round green'>";
                        break;
                    case '-':
                        content_node_desc_html += "<div class='led round grey'>";
                        break;
                }
                content_node_desc_html += "</div><br>";
            }

            if(node["Node Type"].indexOf("MSDH") === -1 && node["Node Type"].indexOf("APOI") === -1){
                content_node_desc_html += "<label>Cell Resource Status: </label>";
                switch(node.Cres)
                {
                    case '0':
                        content_node_desc_html += "<div class='led round green'>";
                        break;
                    case '1':
                        content_node_desc_html += "<div class='led round green'>";
                        break;
                    case '-':
                        content_node_desc_html += "<div class='led round grey'>";
                        break;
                }
                content_node_desc_html += "</div><br>";
            }
            content_node_desc_html += "<label>System: </label><span>"+node.System+"</span>";

            if(node["Node Type"].indexOf("APOI") === -1) {
                var targetSwv = node.Target.split(" ");
                content_node_desc_html += "<label>Common: </label><span>" + node.Common + "</span>";
                content_node_desc_html += "<label>Target: </label><span>" + targetSwv[1] + "</span><br>";
                content_node_desc_html += "<label>Location Tag: </label><span>" + node.Location + "</span>";
            }
            content_node_desc_html += "<label>Tag: </label><span>"+node.Tag+"</span>";
            content_node_desc_html += "<label>IP: </label><span>"+node.IP+"</span>";

            if(node["Node Type"].indexOf('RRU') ===-1){
                content_node_desc_html +=
                    "<label>Node Order: </label>" +
                    "<select data-node-serial='"+node.ID+"' id='node_order'></select>" +
                    "<div class='icon help' title='Set order for node to be displayed on main topology page'></div>";
            }
            
            if(USERACCESS === "superuser")
            {
                if(node["Node Type"].indexOf("RRU") !=-1){
                   content_node_desc_html += "<label>Move to zone: </label><select id='zone-select' data-remote-id='"+node.ID+"'>";
                   //append sectgrp list
                   $.each(zoneList,function(key,zone){
                       if(_.contains(zone.remoteList,node.ID)) {
                           content_node_desc_html += "<option val='" + zone.zoneName + "' selected='selected'>" + zone.zoneName + "</option>";
                       }else{
                           content_node_desc_html += "<option val='" + zone.zoneName + "'>" + zone.zoneName + "</option>";
                       }
                   })
                   content_node_desc_html +="</select>";
                }

               var cloneExist = false;
               if (node["Node Type"].indexOf("APOI") != -1)
               {
                  for (i = 0; i < topologyList.length; i++)
                  {
                     if ((topologyList[i]["Node Type"].indexOf("APOI") != -1) && (topologyList[i]['Comm'] == 1) && (topologyList[i]['ID'] != node.ID))
                     {
                        cloneExist = true;
                        break;
                     }
                  }
               }
               else if (node["Node Type"].indexOf("MTDI") != -1)
               {
                  for (i = 0; i < topologyList.length; i++)
                  {
                     if ((topologyList[i]["Node Type"].indexOf("MTDI") != -1) && (topologyList[i]['Comm'] == 1) && (topologyList[i]['ID'] != node.ID))
                     {
                        var node_rf_range_data = _.where(rfrangesList, {ID: node.ID});
                        var clone_node_rf_range_data = _.where(rfrangesList, {ID: topologyList[i]['ID']});
                        var sameBands = true;
                        $.each(node_rf_range_data[0].Ranges, function (index1, val1){
                           var bandExist = false;
                           $.each(clone_node_rf_range_data[0].Ranges, function (index2, val2){
                              if (val1.Type == val2.Type)
                                 bandExist = true;
                           })
                           if (!bandExist)
                              sameBands = false;
                        });
                        if (sameBands)
                        {
                           cloneExist = true;
                           break;
                        }
                     }
                  }
               }
               else if (node["Node Type"].indexOf("RRU40") != -1)
               {
                  for (i = 0; i < topologyList.length; i++)
                  {
                     if ((topologyList[i]["Node Type"].indexOf("RRU40") != -1) && (topologyList[i]['Comm'] == 1) && (topologyList[i]['ID'] != node.ID))
                     {
                        var node_rf_range_data = _.where(rfrangesList, {ID: node.ID});
                        var clone_node_rf_range_data = _.where(rfrangesList, {ID: topologyList[i]['ID']});
                        var sameBands = true;
                        $.each(node_rf_range_data[0].Ranges, function (index1, val1){
                           var bandExist = false;
                           $.each(clone_node_rf_range_data[0].Ranges, function (index2, val2){
                              if (val1.Type == val2.Type)
                                 bandExist = true;
                           })
                           if (!bandExist)
                              sameBands = false;
                        });
                        if (sameBands)
                        {
                           cloneExist = true;
                           break;
                        }
                     }
                  }
               }
               else if (node["Node Type"].indexOf("RRU") != -1)
               {
                  for (i = 0; i < topologyList.length; i++)
                  {
                     if ((topologyList[i]["Node Type"].indexOf("RRU") != -1) && (topologyList[i]["Node Type"].indexOf("RRU40") == -1) && (topologyList[i]['Comm'] == 1) && (topologyList[i]['ID'] != node.ID))
                     {
                        var node_rf_range_data = _.where(rfrangesList, {ID: node.ID});
                        var clone_node_rf_range_data = _.where(rfrangesList, {ID: topologyList[i]['ID']});
                        var sameBands = true;
                        $.each(node_rf_range_data[0].Ranges, function (index1, val1){
                           var bandExist = false;
                           $.each(clone_node_rf_range_data[0].Ranges, function (index2, val2){
                              if (val1.Type == val2.Type)
                                 bandExist = true;
                           })
                           if (!bandExist)
                              sameBands = false;
                        });
                        if (sameBands)
                        {
                           cloneExist = true;
                           break;
                        }
                     }
                  }
               }

               if (cloneExist)
               {
                  content_node_desc_html +=
                       "<label>Clone Configuration: </label>" +
                       "<select id='selCloneConf'></select>" +
                       "<button type='button' style='height:30px' id='btnCloneConf'>Clone</button>";
               }
            }
        }

        if(node["Node Type"].indexOf("VIRT_SECT") != -1){
            var sector = node;
            var desc;
            $.each(bandList, function (i, value) {
               if(value.Band == sector["Band"]){
                  desc = value.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "");
               }
            })
            content_node_desc_html += "<label>Operator: </label><span>"+sector["Operator"]+"</span>";
            content_node_desc_html += "<label>Band: </label><span>"+desc+"</span>";
            content_node_desc_html += "<label>Lower DL: </label><span>"+convert.hz2mhz(sector["LowerBandDL"], true)+"</span>";
            content_node_desc_html += "<label>Upper DL: </label><span>"+convert.hz2mhz(sector["UpperBandDL"], true)+"</span>";
            content_node_desc_html += "<label>Duplex Spacing: </label><span>"+convert.hz2mhz(sector["Duplex"], true)+"</span>";
            content_node_desc_html += "<label>Connection Type: </label><span>"+sector["Conn"]+"</span>";
            content_node_desc_html += "<label>Tag: </label><span>"+sector["Tag"]+"</span>";
            content_node_desc_html += "<label>BTS Tag: </label><span>"+sector["BTS Tag"]+"</span>";
            content_node_desc_html += "<label>BTS ID: </label><span>"+sector["ID"]+"</span>";
            content_node_desc_html += "<label>Move to group: </label><select id='sectgrp-select' data-sector-id='"+sector.ID+"'>";
            //append sectgrp list
            $.each(sectgrpList,function(key,groupName){
                if(_.contains(groupName.sectorList,sector.ID)) {
                    content_node_desc_html += "<option val='" + groupName.sectgrp + "' selected='selected'>" + groupName.sectgrp + "</option>";
                }else{
                    content_node_desc_html += "<option val='" + groupName.sectgrp + "'>" + groupName.sectgrp + "</option>";
                }
            })
            content_node_desc_html +="</select>";
        }

        $('#right_side_bar_content_node_desc').append(content_node_desc_html).show();

        if(USERACCESS === "superuser")
        {
           if (node["Node Type"].indexOf("APOI") != -1)
           {
               for (i = 0; i < topologyList.length; i++)
               {
                  if ((topologyList[i]["Node Type"].indexOf("APOI") != -1) && (topologyList[i]['Comm'] == 1) && (topologyList[i]['ID'] != node.ID))
                  {
                     $('#selCloneConf').append($('<option>', {
                          value: topologyList[i]["ID"],
                          text: topologyList[i]["ID"]
                     }))
                  }
               }
           }
           else if (node["Node Type"].indexOf("MTDI") != -1)
           {
               for (i = 0; i < topologyList.length; i++)
               {
                  if ((topologyList[i]["Node Type"].indexOf("MTDI") != -1) && (topologyList[i]['Comm'] == 1) && (topologyList[i]['ID'] != node.ID))
                  {
                     var node_rf_range_data = _.where(rfrangesList, {ID: node.ID});
                     var clone_node_rf_range_data = _.where(rfrangesList, {ID: topologyList[i]['ID']});
                     var sameBands = true;
                     $.each(node_rf_range_data[0].Ranges, function (index1, val1){
                        var bandExist = false;
                        $.each(clone_node_rf_range_data[0].Ranges, function (index2, val2){
                           if (val1.Type == val2.Type)
                              bandExist = true;
                        })
                        if (!bandExist)
                           sameBands = false;
                     });
                     if (sameBands)
                     {
                        $('#selCloneConf').append($('<option>', {
                             value: topologyList[i]["ID"],
                             text: topologyList[i]["ID"]
                        }))
                     }
                  }
               }
           }
           else if (node["Node Type"].indexOf("RRU40") != -1)
           {
               for (i = 0; i < topologyList.length; i++)
               {
                  if ((topologyList[i]["Node Type"].indexOf("RRU40") != -1) && (topologyList[i]['Comm'] == 1) && (topologyList[i]['ID'] != node.ID))
                  {
                     var node_rf_range_data = _.where(rfrangesList, {ID: node.ID});
                     var clone_node_rf_range_data = _.where(rfrangesList, {ID: topologyList[i]['ID']});
                     var sameBands = true;
                     $.each(node_rf_range_data[0].Ranges, function (index1, val1){
                        var bandExist = false;
                        $.each(clone_node_rf_range_data[0].Ranges, function (index2, val2){
                           if (val1.Type == val2.Type)
                              bandExist = true;
                        })
                        if (!bandExist)
                           sameBands = false;
                     });
                     if (sameBands)
                     {
                        $('#selCloneConf').append($('<option>', {
                             value: topologyList[i]["ID"],
                             text: topologyList[i]["ID"]
                        }))
                     }
                  }
               }
           }
           else if (node["Node Type"].indexOf("RRU") != -1)
           {
               for (i = 0; i < topologyList.length; i++)
               {
                  if ((topologyList[i]["Node Type"].indexOf("RRU") != -1) && (topologyList[i]["Node Type"].indexOf("RRU40") == -1) && (topologyList[i]['Comm'] == 1) && (topologyList[i]['ID'] != node.ID))
                  {
                     var node_rf_range_data = _.where(rfrangesList, {ID: node.ID});
                     var clone_node_rf_range_data = _.where(rfrangesList, {ID: topologyList[i]['ID']});
                     var sameBands = true;
                     $.each(node_rf_range_data[0].Ranges, function (index1, val1){
                        var bandExist = false;
                        $.each(clone_node_rf_range_data[0].Ranges, function (index2, val2){
                           if (val1.Type == val2.Type)
                              bandExist = true;
                        })
                        if (!bandExist)
                           sameBands = false;
                     });
                     if (sameBands)
                     {
                        $('#selCloneConf').append($('<option>', {
                             value: topologyList[i]["ID"],
                             text: topologyList[i]["ID"]
                        }))
                     }
                  }
               }
           }
        }

        $("#btnCloneConf").click(function(e) {
           axellConfirm("info","Notice","After successfully clone operation, node " + $('#selCloneConf').val() + " will be deleted.", function () {
              $.blockUI({
                  fadeIn: 1000,
                  timeout: 20000,
                  onBlock: function() {
                      api.exe({
                        cmd: "delete_serials_opers " + node.ID,
                        dataType: 'text',
                        async: false,
                        onSuccess: function (e) {
                            console.log(e.ajaxdata);
                            api.exe({
                              cmd: "change_serials_opers " + $('#selCloneConf').val() + " " + node.ID,
                              dataType: 'text',
                              async: false,
                              onSuccess: function (o) {
                                 console.log(o.ajaxdata);
                                 axellPopUp(o.ajaxdata);
                                 if (o.ajaxdata == "Clone operation completed successfully.") {
                                      api.exe({
                                          cmd: "delete_serials_opers " + $('#selCloneConf').val(),
                                          dataType: 'text',
                                          async: false,
                                          onSuccess: function (e) {
                                             console.log(e.ajaxdata);
                                             api.exe({
                                                cmd: "NODE DELETE " + $('#selCloneConf').val(),
                                                onSuccess: function () {
                                                   console.log("Node " + $('#selCloneConf').val() + " has been deleted successfully");
                                                   //axellPopUp("Node " + $('#selCloneConf').val() + " has been deleted successfully");
                                                   $('#popup').hide();
                                                   getData($.cookie('viewMode'));
                                                },
                                                onError: function (err) {
                                                   axellPopUp(err.errorThrown);
                                                }
                                             })
                                          }
                                      })
                                 }
                              }
                            })
                        }
                      })
                  }
              })
           })
        })


        //append number to node order select menu based on total number of that node type found
        function appendOrderSelect(node){
            var count = _.filter(totalNodeList, function(n) {
                return n["Node Type"].indexOf(node["Node Type"].substring(0,3)) !=-1;
            }).length;
            for(var i=1; i<= count;i++){
                $('#node_order').append($('<option>', {
                    value: i,
                    text: i
                }))
            }
            $('#node_order').val(node.NodeOrder);
        }
        if(node["Node Type"].indexOf("RRU") !=-1 || node["Node Type"] != "VIRT_SECT"){
            appendOrderSelect(node);
        }
    }

    function right_side_bar_buttons(node) {
        $('#left_side_bar').show();
        var content_buttons_html="";
        $('#right_side_bar_content_buttons').empty().hide();
        if(node["Node Type"] === "MSDH-M"){
            content_buttons_html += "<div id='view_node_btn'>";
            content_buttons_html += "<a class='view button' >Zoom</a>";
            content_buttons_html += "<a href='/target/status' target='_blank' class='button' >Login</a>";
            content_buttons_html += "<a class='identify button' data-node-id=LOCAL" + ">Identify</a>"
            if(USERACCESS === "superuser") {
                content_buttons_html += "<a class='refresh_connection button' data-node-id='" + node.ID + "' data-nodeip=''>Refresh Connections</a>";
            }
            content_buttons_html +="</div>";
        }else if(node["Node Type"] === "MSDH-R"){
            content_buttons_html += "<div id='view_node_btn'>";
            //content_buttons_html += "<a class='view button' >Zoom</a>";
            content_buttons_html += "<a href='http://" + node.Location +"' target='_blank' class='button' >Login</a>";
            if(USERACCESS === "superuser") {
               if((prm == 1) || (prm == 2)){
                  content_buttons_html += "<a class='import_configuration button' data-node-id='"+node.ID+"' data-nodeip='"+node.IP+"'>Import Configuration</a>";
               }
            }
            content_buttons_html +="</div>";
        }else {
            if (node.IP != '-' && node.Comm != "1") {
                if(node.IP === "127.0.0.1") { //add it in for MWC, if the ip is local host, link back to topology page
                    content_buttons_html += "<div id='view_node_btn'><a href='/target' class='button' >Login</a>"
                    if(node["Node Type"].indexOf("RRU") === -1) {
                        content_buttons_html += "<a class='identify button' data-node-id='" + node.ID + "'>Identify</a>"
                    }
                }else if(node.IP.substring(0, 5) == "10.0.") { //add link via proxy
                    var split = node.IP.split('.');
                    var k = parseInt(split[2]);
                    var s = parseInt(split[3]);
                    var port = 10000 + ((k-2)*256) + s;
                    content_buttons_html += "<div id='view_node_btn'>";
                    content_buttons_html += "<a class='view button'>Zoom</a>";
                    content_buttons_html += "<a href='http://" + window.location.hostname +":"+port  +"' target='_blank' class='button' >Login</a>"
                    content_buttons_html += "<a href='http://" + window.location.hostname +":"+port  +"/target/spectrum' target='_blank' class='button' >Spectrum</a>"
                    if(node["Node Type"].indexOf("RRU") === -1) {
                        content_buttons_html += "<a class='identify button' data-node-id='" + node.ID + "'>Identify</a>"
                    }
                }else{
                    content_buttons_html += "<div id='view_node_btn'><a href='http://" + node.IP + "' target='_blank' class='button' >Login</a>"
                    if(node["Node Type"].indexOf("RRU") === -1) {
                        content_buttons_html += "<a class='identify button' data-node-id='" + node.ID + "'>Identify</a>"
                    }
                }
            } else if (node.IP != '-' && node.Comm === "1") {
                content_buttons_html += "<div id='view_node_btn'><a class='button disabled'>Login</a>"
                if(node["Node Type"].indexOf("RRU") === -1) {
                    content_buttons_html += "<a class='identify button disabled' data-node-idip='" + node.ID + "'>Identify</a>"
                }
            }
            if(USERACCESS === "superuser"){
                /*if(node["Node Type"] === "MSDH-S") {
                    content_buttons_html += "<a class='refresh_connection button' data-node-id='"+node.ID+"' data-nodeip='"+node.IP+"'>Refresh Connections</a>";
                }*/
                if(node["Node Type"] === "MSDH-S" || node["Node Type"].indexOf("MTDI") !=-1 || node["Node Type"].indexOf("RRU") !=-1)
                {
                    content_buttons_html += "<a class='delete_node button' data-node-id='"+node.ID+"'>Delete</a>"
                }
            }
            content_buttons_html += "</div>";
        }
        $('#right_side_bar_content_buttons').append(content_buttons_html).show();
    }

    function right_side_bar_connections(node) {
        //again this is an awful way to do things but seen as we do it like this everywhere else already why not keep going :)
        var header_connections_html="";
        var content_connections_html="";
        $('#right_side_bar_header_connections').empty().hide();
        $('#right_side_bar_content_connections').empty().hide();
        if(node["Node Type"] != 'APOI-S') {
            if(node["Node Type"] === 'VIRT_SECT') {
                //find connections starting from that sector
                var sectorConnList =[];
                $.each(unfilteredConnectionList,function(key,conn){
                    if(conn.ID.indexOf("RF") !=-1){
                        $.each(conn.conn, function (index, value) {
                            if (value.From === node.ID) {
                                sectorConnList.push(value);
                            }
                        })
                    }
                })

                //if have connections then show this table
                if(sectorConnList.length>0) {
                    header_connections_html += "<table class='type4 side-bar-table'><caption>Connections</caption>";
                    header_connections_html += "<tr><th>Serial Number</th><th>Node Type</th><th>Slot</th><th>Port</th></tr>";
                    header_connections_html += "</table>";
                    content_connections_html += "<table class='type4'>";
                    $.each(sectorConnList, function (index, val) {
                        content_connections_html += "<tr><td>" + val.To.substring(0, val.To.indexOf(":")) + "</td>";
                        content_connections_html += "<td>" + val["ToType"] + "</td>";
                        content_connections_html += "<td>" + val.To.substring(val.To.indexOf(":") + 1, val.To.lastIndexOf(":")) + "</td>";
                        content_connections_html += "<td>" + val.To.substring(val.To.lastIndexOf(":") + 1, val.To.length) + "</td></tr>";
                    });

                    for(var k = 0; k < rfConns.length; k ++)
                    {
                        if (rfConns[k].conn[0]["From"] != node["ID"])
                           continue;

                        var toType = rfConns[k].conn[0]["ToType"];
                        if (toType.indexOf("APOI") != -1)
                        {
                           var to = rfConns[k].conn[0]["To"].split(":");
                           var apoi = to[0];
                           var apoiPort = to[1];
                           for(var l = 0; l < rfConns.length; l ++)
                           {
                              var from = rfConns[l].conn[0]["From"].split(":");
                              if ((apoi != from[0]) || (apoiPort != from[1]))
                                 continue;

                              to = rfConns[l].conn[0]["To"].split(":");
                              var port = to[1] + ":" + to[2];
                              var mtdi = to[0];
                              var dir = to[3];
                              content_connections_html += "<tr><td>" + mtdi + "</td>";
                              content_connections_html += "<td>" + rfConns[l].conn[0]["ToType"] + "</td>";
                              content_connections_html += "<td>" + port + "</td>";
                              content_connections_html += "<td>" + dir + "</td></tr>";
                           }
                        }
                    }

                    content_connections_html += "</table>";
                }
            } else {
                var node_conn_data = _.filter(unfilteredConnectionList, function(data){
                    if(data["Node X"] == node.ID || data["Node Y"] == node.ID)
                    {
                        return data;
                    }
                });
                if(node_conn_data.length > 0)
                {
                    var count = 0;
                    header_connections_html += "<table class='type4 side-bar-table'><caption>Digital Connections</caption>";
                    header_connections_html += "<tr><th>MSDH Port</th><th>To</th><th>Capacity Used</th></tr>";
                    header_connections_html += "</table>";
                    content_connections_html += "<table class='type4'>";
                    $.each(node_conn_data,function(index,val){
                        count++;
                        content_connections_html += "<tr><td>"+count+"</td><td>"+val["Node Y"].substring(0,4)+"</td><td>"+val.UserLinkCap+"</td></tr>";
                    });
                    content_connections_html += "</table>";
                }
            }
        }
        if('' != header_connections_html) $('#right_side_bar_header_connections').append(header_connections_html).show();
        if('' != content_connections_html) $('#right_side_bar_content_connections').append(content_connections_html).show();
    }

    function right_side_bar_cell_resources(node) {
        var header_cell_resources_html = "";
        var content_cell_resources_html = "";
        var content_buttons_html = "";
        header_cell_resources_html = "<label>Cell Resources</label>";
        $('#right_side_bar_header_cell_resources').empty().hide();
        $('#right_side_bar_content_cell_resources').empty().hide();
        if(node["Node Type"].indexOf("VIRT_SECT") == -1) {
            return;
        }
        acc = 0;
        var cres_row = 30;
        var classChanger;
        var classChangerList = ["showScroll","hideScroll"];
        content_cell_resources_html +=
           "<table id=node_cell_resources_table class='tmpValue'>" +
               "<col width='42%'>" +
               "<col width='58%'>" +
               "<col width='28%'>" +
               "<col width='38%'>" +
               "<tr>" +
                   "<th>Tag</th>" +
                   "<th>Tech</th>" +
                   "<th>Start</th>" +
                   "<th>Stop</th>" +
               "</tr>";
        var cell_res = _.where(cellresList, {SectorID: node.ID});
        if(cell_res.length > 0)
        {
           $.each(cell_res,function(index,val){
               var clr = "#eeedef";
               for (var i = 0; i < cellsAlarm.length; i++){
                  if (val["ResID"] == cellsAlarm[i]){
                     clr = "red";
                     break;
                  }
               }
               acc++;
               content_cell_resources_html += '<tr><td style="background-color:'+clr+'">'+val["Tag"]+'</td>';
               content_cell_resources_html += '<td style="background-color:'+clr+'">'+val["Tech"]+'</td>';
               content_cell_resources_html += '<td style="background-color:'+clr+'">'+convert.hz2mhz(val["StartDL"])+'</td>';
               content_cell_resources_html += '<td style="background-color:'+clr+'">'+convert.hz2mhz(val["StopDL"])+'</td></tr>';
           });
           var cal = acc * cres_row;
           $('#node_cell_resources_table').height(cal);
           content_cell_resources_html += "</table>";
           content_buttons_html += "<div id='view_node_btn'><a href ='/target/cellresource/index.html?sectorid="+node.ID+"' class='button'>BTS Port Information</a>";
        }
        else
        {
           //if user is read only, disabled delete functionality
           if(USERACCESS ==="RO"){
               content_buttons_html += "<div id='view_node_btn'><a class='button delete_sector_btn disabled' data-sector-id='"+node.ID+"' >Delete BTS Port</a>" +
                   "<a href ='/target/cellresource/index.html?sectorid="+node.ID+"' class='button'>BTS Port Information</a>";
           }else {
               content_buttons_html += "<div id='view_node_btn'><a class='button delete_sector_btn' data-sector-id='"+node.ID+"' >Delete BTS Port</a>" +
                   "<a href ='/target/cellresource/index.html?sectorid="+node.ID+"' class='button'>BTS Port Information</a>";
           }

        }

        var noConn = true;
        $.each(unfilteredConnectionList, function(key,value){
           if(value.conn !=undefined) {
               $.each(value.conn, function (i, nodeConn) {
                   if (nodeConn.From === node.ID) {
                       //console.log('found node');
                       noConn = false;
                       return noConn;
                   }
               })
           }
           return noConn;
        })

        if(!noConn){
           content_buttons_html += "</div>"
        } else {
           //if user is read only, disabled delete functionality
           if(USERACCESS ==="RO"){
               content_buttons_html += "<a class='button disabled'>Connection</a></div>";
           }else {
               content_buttons_html += "<a href ='/target/conn_wizard/index.html?sectorid="+node.ID+"&band="+node["Band"]+"&conntype="+node["Conn"]+"&virtual=false"+"' class='button'>Connection</a></div>";
           }
        }

        $('#right_side_bar_content_buttons').append(content_buttons_html).show();
        if(acc > 11) {
           classChanger = classChangerList[0];
           content_cell_resources_html = content_cell_resources_html.replace("tmpValue",classChanger);
        }else{
           classChanger = classChangerList[1];
           content_cell_resources_html = content_cell_resources_html.replace("tmpValue",classChanger);
        }
        $('#right_side_bar_container_cell_resources').append([header_cell_resources_html,content_cell_resources_html]).show();
    }

    function right_side_bar_rf_ranges(node) {
       var header_rf_ranges_html="";
       var content_rf_ranges_html="";
       $('#right_side_bar_header_rf_ranges').empty().hide();
       $('#right_side_bar_content_rf_ranges').empty().hide();
       var node_rf_range_data = _.where(rfrangesList, {ID: node.ID});
       if(node_rf_range_data[0] != undefined)
       {
           if(node_rf_range_data[0].Ranges.length > 0) {
               header_rf_ranges_html =
                   "<label>RF Ranges</label>";
               content_rf_ranges_html =
                   "<table class='type4'>" +
                       "<col width='28%'>" +
                       "<col width='36%'>" +
                       "<col width='36%'>" +
                       "<tr>" +
                           "<th>Band</th>" +
                           "<th>DL (MHz)</th>" +
                           "<th>UL (MHz)</th>" +
                       "</tr>";
                $.each(node_rf_range_data[0].Ranges, function (index, val) {
                    $.each(bandList, function (i, value) {
                        //console.log(i, value.Band);
                        var res = value.FullName;
                        var desc = res.replace("MHz ", "").replace("Band", "").replace("BAND", "");
                        //equal bands to rfranges
                        if(value.Band == val.Type){
                        content_rf_ranges_html +=
                           "<tr class='band_row'>" +
                               "<td class='band_col'>" + desc + "</td>" +
                               "<td>" + (val.LowerDL/1000000).toFixed(2) + "-" + (val.UpperDL/1000000).toFixed(2) + " </td>" +
                               "<td>" + (val.LowerUL/1000000).toFixed(2) + "-" + (val.UpperUL/1000000).toFixed(2) + " </td>" +
                           "</tr>";

                        }
                    })
               });
               content_rf_ranges_html += "</table>";

               $('#right_side_bar_container_rf_ranges').append([header_rf_ranges_html,content_rf_ranges_html]).show();
           }
       }
    }

    function right_side_bar_active_alarms(node) {
        var header_active_alarms_html ="";
        var content_active_alarms_html ="";
        header_active_alarms_html = "<label>Active Alarms</label>";
        $('#right_side_bar_header_active_alarms').empty().hide();
        $('#right_side_bar_content_active_alarms').empty().hide();
        if(node["Node Type"].indexOf("VIRT_SECT") !== -1){
            return;
        }
        var command = "alarms dump --json";
        var alarmsID = node.ID;
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (out) {

                acc = 0;
                var cres_row = 30;
                var classChanger;
                var classChangerList = ["showScroll","hideScroll"];
                var show = 0;
                content_active_alarms_html +=
                    "<table id=node_alarms_table class='tmpValue'>" +
                        "<col width='42%'>" +
                        "<col width='58%'>" +
                        "<tr>" +
                            "<th>Date And Time</th>" +
                            "<th>Description</th>" +
                        "</tr>";
                        var isHide = true;
                        $("#right_side_bar_container_active_alarms").hide();
                $.each(out.ajaxdata.alarms, function (i, top) {

                    if(top.REPID === alarmsID && (top.OPERATOR == $.cookie('currentOperator') || top.OPERATOR == '-')){
                        acc++;
                        isHide = false;
                        show = 1;
                        content_active_alarms_html +=
                            "<tr>" +
                                "<td>" + top.TIMESTAMP + "</td>" +
                                "<td>" + top.DESCRIPTION + "</td>" +
                            "</tr>";
                    }
                })
                if (show == 1){
                    $("#right_side_bar_container_active_alarms").show();
                }
                var cal = acc * cres_row;
                $('#node_alarms_table').height(cal);
                content_active_alarms_html += "</table>";

                classChanger = classChangerList[0];
                content_active_alarms_html = content_active_alarms_html.replace("tmpValue",classChanger);
                if(!isHide)
                  $('#right_side_bar_container_active_alarms').append([header_active_alarms_html,content_active_alarms_html]).show();
            }
        })
        scheduler.remove({cmd:command})
        scheduler.add( sec(3),{
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (out) {
                var isHide = true;
                $("#right_side_bar_container_active_alarms").hide();
                var node_alarms_table = $('#node_alarms_table');
                node_alarms_table.children().remove();
                node_alarms_table.append("<col width='42%'><col width='58%'><tr><th>Date And Time</th><th>Description</th></tr>");

                var show = 0;
                $.each(out.ajaxdata.alarms, function (i, top) {

                    if(top.REPID === alarmsID && (top.OPERATOR == $.cookie('currentOperator') || top.OPERATOR == '-')){
                        acc++;
                        isHide = false;
                        show = 1;
                        node_alarms_table.append("<tr>" +
                            "<td>" + top.TIMESTAMP + "</td>" +
                            "<td>" + top.DESCRIPTION + "</td>" +
                            "</tr>");
                    }
                })
                if (show == 1)
                    $('#right_side_bar_container_active_alarms').show();

            }
       })
    }


    function addScrollbarToTable(tableHeader, tableContent) {
        var right_side_bar = $('#right_side_bar');
        var right_side_bar_container_active_alarms = $('#right_side_bar_container_active_alarms');
        var right_side_bar_container_cell_resources = $('#right_side_bar_container_cell_resources');
        var right_side_bar_container_rf_ranges = $('#right_side_bar_container_rf_ranges');
        right_side_bar_container_active_alarms.accordion({ collapsible: true,  activate: function( event, ui ) {
        var right_side_bar_container_active_alarms_table = $("#right_side_bar_container_active_alarms table");
        right_side_bar_container_active_alarms_table.bind(event, function() {});
        }});
        right_side_bar_container_cell_resources.accordion({ collapsible: true,  activate: function( event, ui ) {
        var right_side_bar_container_cell_resources_table = $("#right_side_bar_container_cell_resources table");
        right_side_bar_container_cell_resources_table.bind(event, function() {});
        }});
        // bind/force vertical scrollbar - regular css scroll not respond.
        right_side_bar_container_rf_ranges.accordion({ collapsible: true });
        var right_side_bar_top = right_side_bar.offset().top;
        var right_side_bar_height = right_side_bar.outerHeight();
        var header_bottom = tableHeader.offset().top + tableHeader.outerHeight();
        var content_height = right_side_bar_height - (header_bottom - right_side_bar_top)-1;
        tableContent.css('max-height', content_height+'px');
    }
    function displayNodeDetails(node){
        var right_side_bar = $("#right_side_bar");
        var right_side_bar_content = $('#right_side_bar_content');
        var right_side_bar_content_html =
            "<div id='right_side_bar_content_node_desc'></div>" +
            "<div id='right_side_bar_content_buttons'></div>" +
            "<div id='right_side_bar_header_scroll'></div>" +
            "<div id='right_side_bar_content_scroll'>" +
                "<div id='right_side_bar_container_active_alarms'></div>" +
                "<div id='right_side_bar_header_connections'></div>" +
                "<div id='right_side_bar_content_connections'></div>" +
                "<div id='right_side_bar_container_cell_resources'></div>" +
                "<div id='right_side_bar_container_rf_ranges'></div>" +
            "</div>";

        displayedNode = node;
        right_side_bar.hide();
        right_side_bar_content.empty().append(right_side_bar_content_html);

        right_side_bar_header_text(node);
        right_side_bar_node_desc(node);
        right_side_bar_active_alarms(node);
        right_side_bar_buttons(node);
        right_side_bar_connections(node);
        right_side_bar_cell_resources(node);
        right_side_bar_rf_ranges(node);

        right_side_bar.show();
        addScrollbarToTable($('#right_side_bar_header_scroll'), $('#right_side_bar_content_scroll'));
        // addScrollbarToTable($('#right_side_bar_header_active_alarms'), $('#right_side_bar_content_active_alarms'));
    }

    function UpdateSectorAlarm(){
      sectorsAlarm.length = 0;
      cellsAlarm.length = 0;
      sectRed = false;
      api.exe({
          cmd:'alarms dump --oper ' + $.cookie('currentOperator') + ' --json',
          dataType:'json',
          async: false,
          onSuccess:function(e){
             $.each(e.ajaxdata.alarms, function (i, alarm){
               if (alarm.ATTR == "PIN"){
                  var arr = alarm.ID.split("_");
                  var cell = arr[1];
                  $.each(cellresList, function (i, cellres){
                     arr = cellres.ResID.split("_");
                     if (cell == arr[1]){
                        sectorsAlarm.push(cellres.SectorID);
                        cellsAlarm.push(cellres.ResID);
                        sectRed = true;
                      }
                  })
               }
             })
          }
      });
    }

    function UpdateCellresList(){
      api.exe({
          cmd:'cellres -o '+$('#operator_list').val()+' --json',
          dataType:'json',
          async: false,
          onSuccess:function(o){
            cellresList = o.ajaxdata.cellres;
          }
      });
    }

    function UpdateRfrangesList(){
      api.exe({
          cmd:'rfranges --json',
          dataType:'json',
          async: false,
          onSuccess:function(o){
            rfrangesList = o.ajaxdata.nodes;
          }
      });
    }

    function UpdateConnections(){
      api.exe({
         cmd: "connections -o " + $("#operator_list").val() + " --json",
         dataType: 'json',
         async: false,
         onSuccess: function (o) {
             $.each(o.ajaxdata.BUNDLEGROUP, function (i, top) {
                 bundles[i] = top;
             })
             $.each(o.ajaxdata.connections, function (i, top) {
                 conns[i] = top;
             })
             $.each(o.ajaxdata.rf_connections, function (i, top) {
                 rfConns[i] = top;
             })
         }
      })
    }
})
