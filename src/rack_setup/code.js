/**
 * Created by Emerald on 3/12/14.
 */
require([ '/js/api.js','/js/lib/d3.min.js','/js/lib/jquery.js','/js/convert.js','/js/scheduler.js','/js/lib/jquery-jsPlumb.js','/js/lib/jquery-ui.js','/js/util.js','/js/lib/underscore.js','/js/lib/tipsy.js','/js/lib/jquery_cookie.js'],
    function (api,d3,$,convert,scheduler ) {
    var USERNAME = $.cookie('username');
    var USERACCESS = $.cookie('userAccess');
    var OPERATORS =$.parseJSON($.cookie('operatorCook'));
    var CURRENTOP =$.cookie('currentOperator');
    var layerCount;
    var totalNodeList;
    var nodeAPOIList;
    var nodeMTDIList;
    var nodeMSDHList;
    var imgMap ={"APOI":"/images/icons/APOI_bigicon.png","MTDI":"/images/icons/MTDI_bigicon.png","MSDH":"/images/icons/MSDH_bigicon.png"};
    var nodeSizeMap = {"APOI":3,"MTDI":1,"MSDH":1}
    var rackList=[];

    function ipValid(ip){
		var ipArr = ip.split(".");
      if(ipArr.length != 4)
         return false;
      for(var i = 0; i < ipArr.length; i++){
         if(ipArr[i] == "")
            return false;
         else if(isNaN(ipArr[i]))
            return false;
         else if((ipArr[i] < 0) || (ipArr[i] > 255))
            return false;
      }
      return true;
    }
    function labelValid(label){
		var labelArr = label.split(" ");
      if(labelArr.length > 1)
         return false;
      return true;
    }

    //get data
    function getData(){
        layerCount =0;
        scheduler.remove({cmd:'topology -o '+CURRENTOP+' --json && rack topology --json'});
        scheduler.add( 500, {
            cmd:'topology -o '+CURRENTOP+' --json && rack topology --json',
            callOnDiff:true,
            onSuccess:function(o){
                nodeAPOIList =[];
                nodeMTDIList =[];
                nodeMSDHList =[];
                totalNodeList =[];
                var topologyRack = o.ajaxdata.split("\n").map($.trim).filter(function(line) { return line != ""});
                var topologyList = $.parseJSON(topologyRack[0]).nodes;
                rackList = $.parseJSON(topologyRack[1]).Racks;
                //filter out sector and remotes
                topologyList = _.filter(topologyList,function(node){
                    return node["Node Type"].indexOf("VIRT_SECT") === -1 && node["Node Type"].indexOf("RRU") === -1
                })
                //call rack command and populate rack

                //filter out nodes which is not existing in the rack to be display on system node view
                var unassignedNode =_.difference(_.pluck(topologyList,"ID"), _.pluck(_.flatten(_.pluck(rackList,"Units")),"ID"));
                console.log(unassignedNode)
                $.each(unassignedNode,function(i, unassigned){
                    if(_.findWhere(topologyList,{"ID":unassigned})["Node Type"].indexOf("APOI") != -1){
                        nodeAPOIList.push(_.findWhere(topologyList,{"ID":unassigned}));
                        totalNodeList.push(_.findWhere(topologyList,{"ID":unassigned}));
                    }else if(_.findWhere(topologyList,{"ID":unassigned})["Node Type"].indexOf("MTDI") != -1){
                        nodeMTDIList.push(_.findWhere(topologyList,{"ID":unassigned}));
                        totalNodeList.push(_.findWhere(topologyList,{"ID":unassigned}));
                    } else if(_.findWhere(topologyList,{"ID":unassigned})["Node Type"].indexOf("MSDH") != -1){
                        nodeMSDHList.push(_.findWhere(topologyList,{"ID":unassigned}));
                        totalNodeList.push(_.findWhere(topologyList,{"ID":unassigned}));
                    }
                })
                //sort all list by NodeOrder
                //and draw node on system node panel
                nodeAPOIList = _.sortBy(nodeAPOIList,"NodeOrder");
                nodeMTDIList = _.sortBy(nodeMTDIList,"NodeOrder");
                nodeMSDHList = _.sortBy(nodeMSDHList,"NodeOrder");
                if(nodeAPOIList.length>0){
                    drawSysnode(nodeAPOIList);
                }else{
                    //clear out the container of apoi in system node panel if list is empty
                    $('#apoi-placeholder').empty();
                }

                if(nodeMTDIList.length>0) {
                    drawSysnode(nodeMTDIList);
                }else{
                    //clear out the container of mtdi in system node panel if list is empty
                    $('#mtdi-placeholder').empty();
                }

                if(nodeMSDHList.length>0){
                    drawSysnode(nodeMSDHList,"NodeOrder");
                }else{
                    //clear out the container of msdh in system node panel if list is empty
                    $('#msdh-placeholder').empty();
                }

                //append to rack panel
                $('#racks-holder').empty();
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
                $.each(rackList,function(i, rack){
                    createRack(rack.RackID,rack.Size,rack.Tag,rack.Order);
                    //add element to rack
                    $.each(rack.Units, function(j, node){
                        var thisNode = _.findWhere(topologyList,{"ID":node.ID});
                        if(thisNode != undefined && node.ID === thisNode.ID){
                            _.extend(thisNode,node);
                        }

                        var nodeSize = node.Size;
                        if(thisNode !=undefined) {
                            $('#rack-' + rack.RackID + '-slot-' + node.Slot).append(populateNode(thisNode, rack.RackID, node.Slot));
                            //remove config button for this slot, config is only to config empty slot
                            $('#rack-'+rack.RackID+'-slot-'+node.Slot+'-row').find('.slot_config').empty();
                        }else{
                            //this case node is BLANK
                            thisNode = node;
                            $('#rack-' + rack.RackID + '-slot-' + node.Slot).append(populateNode(thisNode, rack.RackID, node.Slot));
                            //check out the node height and display accordingly
                            var nodeHeight = node.Size * 15 //asumming height of 1 unit height node
                            $('#rack-' + rack.RackID + '-slot-' + node.Slot).css('line-height',nodeHeight+'px');

                        }
                        //check the node size, disable slot which are occupied by this node
                        if(nodeSize>1) {
                            for (var i = 1; i < nodeSize; i++) {
                                $('#rack-' + rack.RackID + '-slot-' + Number(node.Slot + i)+'-row').hide();
                            }
                        }
                    })
                })

                $('.node_placeholder')
                    .draggable({
                        revert: 'invalid',
                        helper:'clone',
                        cursor:'move'
                    })

            }
        })

    }

    function drawSysnode(list){
        var $placeholder='';
        if(list[0]["Node Type"].indexOf("APOI") !=-1){
            $('#apoi-placeholder').empty();
            $placeholder = $('#apoi-placeholder');
        }else if(list[0]["Node Type"].indexOf("MTDI") !=-1){
            $('#mtdi-placeholder').empty();
            $placeholder = $('#mtdi-placeholder');
        }else if(list[0]["Node Type"].indexOf("MSDH") !=-1){
            $('#msdh-placeholder').empty();
            $placeholder = $('#msdh-placeholder');
        }

        //append nodes
        $.each(list, function(i, node){
            $placeholder.append(populateNode(node));
        })
        /*
        $('.node_placeholder')
            .draggable({
                revert: true,
                helper: "clone"
            })*/
    }

    function createRack(rackid, unitHeight, tag,order){
        var rack ='<div class="aRack"><div class="rack_label"><span>#'+rackid+' - '+tag+'</span> ' +
                    '<div class="icon setting rack_config" rackid="'+rackid+'" tag="'+tag+'" order="'+order+'" title="Rack configuration"></div></div>';
            rack +='<table id="rack_'+rackid+'" class="rack">';
        for( var i =1; i<=unitHeight; i++){
            rack += '<tr id = "rack-'+rackid+'-slot-'+i+'-row">' +
                        '<td id = "rack-'+rackid+'-slot-'+i+'" data-rackid = "'+rackid+'" data-slotid="'+i+'" class="rackSlot"></td>' +
                        '<td class="slot_config"><div data-rackid = "'+rackid+'" data-slotid="'+i+'" class="icon setting_small" style="width:15px; height:13px" title="Slot configuration"></div></td>'
                    '</tr>';
        }
        rack +='</table></div>';
        $('#racks-holder').append(rack);
        $('.rackSlot')
            .droppable({
                accept: ".node_placeholder",
                helper: "clone",
                greedy:true,
                hoverClass: "ui-state-hover",
                over:function(event,ui){
                    var $this = $(this);
                    var clone = $(ui.helper);
                    clone.addClass('ui-draggable-helper');
                    clone.text("Move to slot " + $this.data('slotid'));
                },
                drop: function (event, ui) {
                    var $this = $(this);
                    //element insert into rack
                    //UNIT INSERT <RackID> <Slot> <Unit Size> <Unit Type> [ <Serial> ]
                    var slotid = $this.data('slotid');
                    var rackid = $this.data('rackid');
                    var nodeid = ui.draggable.attr('id');
                    var nodeType= ui.draggable.attr('nodetype').substring(0,4);
                    var nodeSize = nodeSizeMap[ui.draggable.attr('nodetype').substring(0,4)];
                    var nodeRack = ui.draggable.data('rackid');
                    var nodeSlot = ui.draggable.data('slotid');
                    if(nodeRack ===undefined && nodeSlot ===undefined) {
                        api.exe({
                            cmd: 'RACK UNIT INSERT ' + rackid + ' ' + slotid + ' ' + nodeSize + ' ' + nodeType + ' ' + nodeid,
                            onSuccess: function (o) {
                                getData();
                            },
                            onError: function (err) {
                                axellPopUp(err.errorThrown);
                            }
                        })
                    }else{
                        //UNIT MOVE <RackID> <Slot> <newRackID> <newSlot>
                        api.exe({
                            cmd: 'RACK UNIT MOVE ' + nodeRack + ' ' + nodeSlot + ' ' + rackid + ' ' + slotid,
                            onSuccess: function (o) {
                                getData();
                            },
                            onError: function (err) {
                                axellPopUp(err.errorThrown);
                            }
                        })
                    }
                }
            })
    }

    function populateNode(node,rackID,slotID){
        var imgSrc;
        var nodeHtml;
        if(node["Node Type"] != "BLANK") {
            if (node["Node Type"].indexOf("APOI") != -1) {
                imgSrc = imgMap["APOI"];
            } else if (node["Node Type"].indexOf("MTDI") != -1) {
                imgSrc = imgMap["MTDI"];
            } else if (node["Node Type"].indexOf("MSDH") != -1) {
                imgSrc = imgMap["MSDH"];
            }
            if(rackID === undefined) {
                //this is to populate node for system node panel
                nodeHtml = '<div id="' + node.ID + '" class="node_placeholder" nodeType="' + node["Node Type"] + '" tag="' + node.Tag + '" ' +
                    'title="ID: ' + node.ID + '| Drag me to rack"> ' +
                    '<img src="' + imgSrc + '" width= "100px" />';
            }else{
                //this is to populate node for rack
                nodeHtml = '<div id="' + node.ID + '" class="node_placeholder" nodeType="' + node["Node Type"] + '" tag="' + node.Tag + '" ' +
                    'data-rackid="'+rackID+'" data-slotid="'+slotID+'" data-size ="'+node.Size+'"'+
                    'title="ID: ' + node.ID + '| Remove me from rack by dragging me to System Nodes panel"> ' +
                    '<img src="' + imgSrc + '" width= "100px" />';
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
                nodeHtml += '<div class="node icon led grey round"></div>';
            }
            nodeHtml +='</div>';
        }else{
            if(rackID === undefined) {
                //this is to populate node for system node panel
                // but it's blank type so don't draw anything
            }else{
                //this is to populate node for rack
                nodeHtml = '<div id="'+ rackID+'-'+node.Position + '" class="node_placeholder" nodeType="' + node["Node Type"] + '" tag="' + node.Tag + '" ' +
                    'data-rackid="'+rackID+'" data-slotid="'+slotID+'" data-size ="'+node.Size+'"'+
                    'title="ID: ' + node.Tag + '"> ' +
                    '<div class="icon controller"></div> '+node.Tag;
            }
        }


        return nodeHtml;
    }

    $(document).ready(function() {
        getData();
        $('.nodes_placeholder')
            .draggable({
                revert: 'invalid'
            })
            .droppable({
                accept: ".node_placeholder",
                greedy:true,
                hoverClass: "ui-state-hover",
                drop: function (event, ui) {
                    //element remove from rack
                    //UNIT REMOVE <RackID> <Slot>
                    var rackid = ui.draggable.data("rackid");
                    var slotid = ui.draggable.data("slotid");
                    //only remove if the item come from rack
                    if(rackid !=undefined && slotid !=undefined) {
                        api.exe({
                            cmd: 'RACK UNIT REMOVE ' + rackid + ' ' + slotid,
                            onSuccess: function (o) {
                                getData();
                            },
                            onError: function (err) {
                                axellPopUp(err.errorThrown);
                            }
                        })
                    }
                }
            })

        $(document).on('dragstart','.node_placeholder',function(){
            var rackid = $(this).data("rackid");
            var slotid = $(this).data("slotid");
            var nodeSize = $(this).data("size");
            //check the node size, disable slot which are occupied by this node
            if (nodeSize > 1) {
                for (var i = 1; i < nodeSize; i++) {
                    $('#rack-' + rackid + '-slot-' + Number(slotid + i) + '-row').show();

                    $('#rack-' + rackid + '-slot-' + Number(slotid + i) + '-row').droppable({
                        accept: ".node_placeholder",
                        helper: "clone",
                        greedy: true,
                        hoverClass: "ui-state-hover"
                    })
                }
            }
        })
        /*
        $(document).on('dragstop','.node_placeholder',function(){
            console.log("dafsafa")
            var rackid = $(this).data("rackid");
            var slotid = $(this).data("slotid");
            var nodeSize = $(this).data("size");
            console.log(nodeSize)
            //check the node size, disable slot which are occupied by this node
            if (nodeSize > 1) {
                for (var i = 1; i < nodeSize; i++) {
                    $('#rack-' + rackid + '-slot-' + Number(slotid + i) + '-row').show();
                }
            }
        })
*/
        $('#add_rack_dialog').dialog({
            width:400,
            modal:true,
            resizable:false,
            autoOpen:false,
            buttons:{
                'Cancel':function(){
                    $('#add_rack_dialog').dialog('close');
                },
                'Add':function(){
                    //add rack
                    //RACK ADD <Size> <Tag>
                    var rackSize = $('#rack_unit_height_select').val();
                    var rackTag = $('#rack_tag').val();
                    if(rackSize === ""){
                        axellPopUp("Please choose a rack size");
                    }else if(rackTag ===""){
                        axellPopUp("Please fill in a tag for this rack");
                    }else{
                        api.exe({
                            cmd:'RACK ADD '+rackSize+' "'+rackTag+'"',
                            onSuccess:function(o){
                                //refresh view
                                getData();
                                $('#add_rack_dialog').dialog('close');
                            },
                            onError:function(err){
                                axellPopUp(err.errorThrown);
                            }
                        })
                    }

                }
            }
        })


        $(document).on('click','.rack_config',function(){
            var $this = $(this);
            var orderIsUpdated = false;
            var tagIsUpdated = false;
            $('#set_rack_order_dialog').dialog({
                width : 400,
                modal:true,
                resizable : false,
                autoOpen : false,
                buttons: {
                    'Cancel': function () {
                        $('#set_rack_order_dialog').dialog( 'close' );
                    },
                    'Update' : function () {
                        //set order for rack
                        //RACK ORDER <RackID> <Order>
                        if(orderIsUpdated && $('#rack_order_select').val() !="-" && !tagIsUpdated) {
                            api.exe({
                                cmd: 'RACK ORDER ' + $this.attr('rackid') + ' ' + $('#rack_order_select').val(),
                                onSuccess: function () {
                                    getData();
                                    $('#set_rack_order_dialog').dialog( 'close' );
                                },
                                onError:function(err){
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        }
                        //set tag for rack
                        //RACK TAG <RackID> <Tag>
                        else if(tagIsUpdated && !orderIsUpdated){
                            api.exe({
                                cmd: 'RACK TAG ' + $this.attr('rackid') + ' "' + $('#rack_tag_edit').val()+'"',
                                onSuccess: function () {
                                    getData();
                                    $('#set_rack_order_dialog').dialog( 'close' );
                                },
                                onError:function(err){
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        }else if(orderIsUpdated && tagIsUpdated && $('#rack_order_select').val() !="-"){
                            api.exe({
                                cmd: 'RACK ORDER ' + $this.attr('rackid') + ' ' + $('#rack_order_select').val(),
                                onSuccess: function () {
                                    api.exe({
                                        cmd: 'RACK TAG ' + $this.attr('rackid') + ' "' + $('#rack_tag_edit').val()+'"',
                                        onSuccess: function () {
                                            getData();
                                            $('#set_rack_order_dialog').dialog( 'close' );
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
                    },
                    'Delete Rack':function(){
                        axellConfirm("alert","Warning","When you delete a rack, the information of the units in the rack will be removed as well. " +
                            "Are you sure you want to delete the whole rack?",function(){
                            //RACK DELETE <RackID>
                            api.exe({
                                cmd: 'RACK DELETE ' + $this.attr('rackid'),
                                onSuccess: function () {
                                    getData();
                                    $('#set_rack_order_dialog').dialog( 'close' );
                                },
                                onError:function(err){
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        })
                    }
                },
                open:function() {
                    $(":button:contains('Update')").prop("disabled", true).addClass("ui-state-disabled");
                    $('#rack_tag_edit').val($this.attr('tag'));
                    $('#rack_order_select').empty();
                    $('#rack_order_select').append('<option value="">Select</option>');
                    for (var i = 1; i <= rackList.length; i++) {
                        $('#rack_order_select').append('<option value="' + i + '">' + i + '</option>');
                    }
                    if ($this.attr('order') != "-"){
                        $('#rack_order_select').val($this.attr('order'));
                    }else{
                        $('#rack_order_select').val("");
                    }

                    $('#rack_order_select').change(function(){
                        orderIsUpdated = true;
                        $(":button:contains('Update')").prop("disabled", false).removeClass("ui-state-disabled");
                    })
                    $('#rack_tag_edit').keydown(function(){
                        tagIsUpdated = true;
                        $(":button:contains('Update')").prop("disabled", false).removeClass("ui-state-disabled");
                    })
                }
            })
            $('#set_rack_order_dialog').dialog('open');
            $('#set_rack_order_dialog').dialog('option','title','Configuration: Rack '+ $this.attr('rackid'));
        })
        $(document).on('click','.setting_small',function(){
            var $this = $(this);
            var thisSlot = $this.data('slotid');
            var thisRack = $this.data('rackid');

            $('#config_slot_dialog').dialog({
                width:400,
                modal:true,
                resizable:false,
                autoOpen:false,
                buttons:{
                    'Cancel':function(){
                        $('#config_slot_dialog').dialog('close');
                    },
                    'Save':function(){
                        //set slot height
                        //if slot is empty
                        //RACK UNIT INSERT <RackID> <Slot> <Size> <Type> < [Serial] | [Tag] > <IP>
                        var slotLabel = $('#slot_label').val();
                        if(!labelValid(slotLabel)){
                           axellPopUp("Label cannot contain spaces");
                           return;
                        }
                        var slotIP;
                        if($('#slot_ip').val() == "")
                           slotIP = "-";
                        else{
                           slotIP = $('#slot_ip').val();
                           if(!ipValid(slotIP)){
                              axellPopUp("Please set valid IP");
                              return;
                           }
                        }
                        if(_.findWhere(_.findWhere(rackList,{"RackID":thisRack}).Units,{"Slot":thisSlot}) ===undefined){
                            api.exe({
                                cmd:'RACK UNIT INSERT '+thisRack +' '+ thisSlot +' '+$('#slot_unit_height').val() +' BLANK "'+slotLabel+'" '+slotIP,
                                onSuccess:function(){
                                    getData();
                                    $('#config_slot_dialog').dialog('close');
                                },
                                onError:function(err){
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        }
                        //if slot is occupied
                        //update slot tag
                        //UNIT TAG <RackID> <Slot> <Unit tag> <IP>
                        else{
                            api.exe({
                                cmd:'RACK UNIT TAG '+thisRack +' '+ thisSlot +' "'+slotLabel+'" '+slotIP,
                                onSuccess:function(){
                                    getData();
                                    $('#config_slot_dialog').dialog('close');
                                },
                                onError:function(err){
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        }


                    },
                    'Remove Unit':function(){
                        axellConfirm("info","Notice",'Are you sure you want to remove this unit from the rack?',function(){
                            api.exe({
                                cmd: 'RACK UNIT REMOVE ' + thisRack + ' ' + thisSlot,
                                onSuccess: function (o) {
                                    getData();
                                    $('#config_slot_dialog').dialog('close');
                                },
                                onError: function (err) {
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        })
                    }
                },
                open:function(){
                    $(":button:contains('Save')").prop("disabled", true).addClass("ui-state-disabled");
                    $('#slot_unit_height').val("");
                    $('#slot_unit_height').prop('disabled', false);
                    $('#slot_label').val("");
                    $('#slot_ip').val("");
                    var thisBlankNode = _.findWhere(_.findWhere(rackList,{"RackID":thisRack}).Units,{"Slot":thisSlot});
                    console.log( $(":button:contains('Remove')"))
                    if(thisBlankNode!=undefined) {
                        $('#slot_unit_height').val(thisBlankNode.Size);
                        $('#slot_label').val(thisBlankNode.Tag);
                        if(thisBlankNode.IP == "-")
                           $('#slot_ip').val("");
                        else
                           $('#slot_ip').val(thisBlankNode.IP);
                        $('#slot_unit_height').prop('disabled', true);
                        $(":button:contains('Remove')").button().show();;
                    }else{
                        $(":button:contains('Remove')").button().hide();;
                    }
                    $('#slot_label').keydown(function(){
                        $(":button:contains('Save')").prop("disabled", false).removeClass("ui-state-disabled");
                    })
                    $('#slot_ip').keydown(function(){
                        $(":button:contains('Save')").prop("disabled", false).removeClass("ui-state-disabled");
                    })
                }
            })
            $('#config_slot_dialog').dialog('open');
            $('#config_slot_dialog').dialog('option','title','Configuration: Rack '+ $(this).data('rackid') +' - Slot '+ $(this).data('slotid'));
        })

        $('#add_rack_btn').click(function(){
            $('#add_rack_dialog').dialog('open');
            $('#add_rack_dialog').dialog('option','title','Add new rack');
        })
        $('#sysnode-container').add('#racks-holder').tooltip({
            content: function(callback) {
                callback($(this).prop('title').replace('|', '<br />'));
            }
        });
    })
})



