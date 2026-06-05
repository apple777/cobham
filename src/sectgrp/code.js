require([ '/js/api.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js','/js/convert.js','/js/util.js','/js/lib/jquery-ui.js','/js/lib/jquery_cookie.js'],
    function (api, convert, console, _, $,convert,util) {
        var sectorList =[];
        var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
        var expandedGrp=[];
        var USERACCESS = $.cookie('userAccess');
        var bandList=[];

        api.exe({
           cmd:'bands --json',
           dataType:'json',
           onSuccess:function(o){
               bandList = o.ajaxdata.bands;
           }  
        });

        function DrawGrp(grpID,grpName,grpNodes,sectorData,cellresData,connData, isUnassignedGrp)
        {
            var html = "<table class='grpTable' data-grpname='"+grpName+"' data-grpid='"+grpID+"'>";
            if(isUnassignedGrp){
                if (grpNodes.length > 0) {
                    expandedGrp.push(grpID);
                    html += "<tr><td colspan='6' class='grpHeader' title='Number of sector: "+grpNodes.length+"'><span class='grpNameDetail'><div class='icon minimize' data-grpid='"+grpID+"' data-grpname='" + grpName + "'></div> " + grpName  + "</span>" +
                        "<span class='remote_num'> -  Number of sectors: " + grpNodes.length +"</span></td>";
                }else{
                    expandedGrp = _.without(expandedGrp,grpID);
                    html += "<tr><td colspan='5' class='grpHeader' title='Number of sector: "+grpNodes.length+"'><span class='grpNameDetail'><div class='icon maximize' data-grpid='"+grpID+"' data-grpname='" + grpName + "'></div> " + grpName + "</span>" +
                        "<span> -  Number of sectors: " + grpNodes.length +"</span></td>";
                }
                html += "<td class='grpHead' colspan='1'></td></tr>"
            }else {
                if (grpNodes.length > 0) {
                    html += "<tr><td colspan='6' class='grpHeader' title='Number of sector: "+grpNodes.length+"'><span class='grpNameDetail'><div class='icon maximize' data-grpid='"+grpID+"' data-grpname='" + grpName + "' ></div> " + grpName + "</span>" +
                        "<span class='remote_num'> -  Number of sectors: " + grpNodes.length +"</span></td>";
                }else{
                    expandedGrp = _.without(expandedGrp,grpID);
                    html += "<tr><td colspan='5' class='grpHeader' title='Number of sector: "+grpNodes.length+"'><span class='grpNameDetail'><div class='icon maximize' data-grpid='"+grpID+"' data-grpname='" + grpName + "' ></div> " + grpName + "</span>"+
                        "<span> -  Number of sectors: " + grpNodes.length +"</span></td>";
                }
                html += "<td class='grpHead' colspan='1'><div class='icon editwhite editGrpBtn' data-id='" + grpName + "' title='Edit Group Name'></div>"
                if(USERACCESS === "RO"){
                    html += "<div class='icon close' data-id='" + grpName + "' title='Delete Group'></div></td></tr>";
                }else{
                    if (grpNodes.length === 0) {
                        html += "<div class='icon error deleteGrpBtn' data-id='" + grpName + "' title='Delete Group'></div></td></tr>";
                    } else {
                        html += "<div class='icon close' data-id='" + grpName + "' title='Delete Group'></div></td></tr>";
                    }
                }

            }
            if (grpNodes.length > 0) {
                var hasConnection = false;
                var conencted_serial = '';
                var conencted_ports = '';
                html += "<tr class ='"+grpID+"_rows grpRow' data-grpid='"+grpID+"' data-grpname= '"+ grpName+"'>" +
                    "<th></th>" +
                    "<th class='tagCol'>Tag</th>" +
                    "<th class='btsTagCol'>Base Station Tag</th>" +
                    "<th class='btsBandCol'>BTS Band</th>" +
                    "<th>Number of Cell Resources</th>" +
                    "<th>Move To Group</th><th></th>" +
                    "</tr>"
                for (var i = 0; i < grpNodes.length; i++) {
                    hasConnection = false;
                    $.each(connData,function(j, conn){
                        $.each(conn.conn,function (k, connection){
                            if(connection.From == grpNodes[i])   {
                                conencted_serial = connection.To.split(':', 1);
                                conencted_ports = connection.To.split(/:(.+)?/)[1];
                                hasConnection = true;
                                return false;
                            }
                        })
                    })
                    var nodeData = _.findWhere(sectorData.ajaxdata.sector, {SectorID: grpNodes[i]});
                    if(nodeData == undefined)
                        continue;
                    var cellres = _.where(cellresData.ajaxdata.cellres, {SectorID: grpNodes[i]});
                    console.log(hasConnection)
                    var desc;
                    $.each(bandList, function (i, value) {
                        if(value.Band == nodeData["Band"]){
                           desc = value.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "");
                        }
                    })
                    html += "<tr title='" + "Sector ID: " + grpNodes[i] + "\n" + "Attached to: " + conencted_serial + "\n" + "Port: " + conencted_ports +
                            "' + class='"+grpID+"_rows grpRow' data-id='" + grpNodes[i] + "' data-grpid='"+grpID+"' data-grpname='" + grpName + "'>" +
                        "<td><img src='/images/icons/sector_icon.png' class='sector' data-id='" + grpNodes[i] + "' data-grpid='"+grpID+"' data-grpname='" + grpName + "'/></td>" +
                        "<td class='tagCol'>" + nodeData.Tag + "</td>" +
                        "<td class='btsTagCol'>" + nodeData["BTS Tag"] + "</td>" +
                        "<td class='btsBandCol'>" + desc + "</td>" +
                        "<td>" + cellres.length+ "</td>" +
                        "<td><select data-id='" + grpNodes[i] + "' data-grpid='"+grpID+"' data-grpname = '" + grpName + "' class='moveGrp'></select></td>";
                    if(USERACCESS === "superuser") {
                        if (cellres.length === 0 && !hasConnection) {
                            html += "<td class='button_col'> " +
                                "<a class='button' href='../conn_wizard/index.html?sectorid=" + grpNodes[i] + "&band=" + _.findWhere(sectorData.ajaxdata.sector, {SectorID: grpNodes[i]}).Band + "&conntype=" + _.findWhere(sectorData.ajaxdata.sector, {SectorID: grpNodes[i]}).Conn + "&virtual=false" + "'>Connection</a>" +
                                "<a data-id='" + grpNodes[i] + "' class='button delete_sector'>Delete</a> " +
                                "<a class='button' href='../cellresource/index.html?sectorid=" + grpNodes[i] + "'>BTS Port Information</a></td></tr>";
                        } else if (cellres.length === 0 && hasConnection) {
                            html += "<td class='button_col'> " +
                                "<a data-id='" + grpNodes[i] + "' class='button delete_sector'>Delete</a> " +
                                "<a class='button' href='../cellresource/index.html?sectorid=" + grpNodes[i] + "'>BTS Port Information</a></td></tr>";
                        } else if (cellres.length != 0 && !hasConnection) {
                            html += "<td class='button_col'> " +
                                "<a class='button' href='../conn_wizard/index.html?sectorid=" + grpNodes[i] + "&band=" + _.findWhere(sectorData.ajaxdata.sector, {SectorID: grpNodes[i]}).Band + "&conntype=" + _.findWhere(sectorData.ajaxdata.sector, {SectorID: grpNodes[i]}).Conn + "&virtual=false" + "'>Connection</a>" +
                                "<a class='button' href='../cellresource/index.html?sectorid=" + grpNodes[i] + "'>BTS Port Information</a></td></tr>";
                        } else {
                            html += "<td class='button_col'><a class='button' href='../cellresource/index.html?sectorid=" + grpNodes[i] + "'>BTS Port Information</a></td></tr>";
                        }
                    }else{
                        html += "<td class='button_col'><a class='button' href='../cellresource/index.html?sectorid=" + grpNodes[i] + "'>BTS Port Information</a></td></tr>";
                    }
                }

            }
            html += "</table>";

            if(isUnassignedGrp)
            {
                $('#unassigned_content').html(html);
            }
            else
            {
                $('#grp_content').append(html);
            }
            if(USERACCESS == "RO"){
                $('.moveGrp').attr('disabled',true);
                $('.editwhite').addClass('disabled');
                $('.delete_sector').addClass('disabled');
            }

        }

        function RenderGroup()
        {
            if($('#operator_name').val() != 'all')
            {
                var operName = $('#operator_name').val();
                //current Operator cookies is to remember user's operator choice across pages
                $.removeCookie('currentOperator',{ path: '/' });
                $.cookie('currentOperator', operName, { expires: 7, path: '/' });
                sectorList = [];
                api.exe({
                    cmd: 'sector -o '+operName+' --json',
                    dataType :'json',
                    onSuccess:function(k){
                        api.exe({
                            cmd: 'cellres -o '+operName+' --json',
                            dataType :'json',
                            onSuccess:function(cellres){
                                api.exe({
                                    cmd: 'sectgrp -o ' + operName + ' list --sectors',
                                    onSuccess: function (o) {
                                        api.exe({
                                            cmd: 'connections -o ' + operName + ' --json',
                                            dataType:'json',
                                            onSuccess: function (conn) {
                                                var connectionList = conn.ajaxdata.rf_connections;
                                                var tmpGrpList = o.ajaxdata.split('\n');
                                                $('#grp_content').html('');
                                                //tmpGrpList.pop(); //somehow there is an extra line after last sector group so need to remove it
                                                tmpGrpList.splice(-1, 1);
                                                for (var i = 0; i < tmpGrpList.length; i++) {
                                                    var grpNameCut = tmpGrpList[i].indexOf(':');
                                                    var grpData = tmpGrpList[i].substring(grpNameCut + 2, tmpGrpList[i].length);
                                                    var grpName = grpData.match(/"(.*?)"/)[1];

                                                    var grpNodes = [];
                                                    if (grpData.length >= (grpName.length + 2) + 4) {
                                                        var res = grpData.replace('\"' + grpName + '\" ', "").trim();
                                                        grpNodes = res.split(' ');
                                                    }
                                                    if ($.inArray(grpName, sectorList) <= -1) {
                                                        sectorList.push(grpName);
                                                    }
                                                    if (grpName === "Unassigned") {
                                                        DrawGrp(i, grpName, grpNodes, k, cellres,connectionList, true);
                                                    }
                                                    else {
                                                        DrawGrp(i, grpName, grpNodes, k, cellres,connectionList, false);
                                                    }

                                                    var c = {};
                                                    $(".grpRow").draggable(
                                                        {
                                                            helper: function (event) {
                                                                return $("<div class='dragged_item'><img src='/images/icons/sector_icon.png' class='sector'/>  " + $(this).data('id') + " - " + $(this).data('grpname') + "</div>");
                                                            },
                                                            cursor: "move",
                                                            cursorAt: { top: 0, left: 0 },
                                                            start: function (event, ui) {
                                                                c.tr = this;
                                                                c.helper = ui.helper;
                                                            }
                                                        });
                                                    $(".grpTable").droppable({
                                                        tolerance: 'pointer',
                                                        hoverClass: "ui-state-hover",
                                                        drop: function (event, ui) {
                                                            $(this).addClass("ui-state-highlight");
                                                            var inventor = ui.draggable.text();
                                                            var $this = $(this);
                                                            $this.find("input").val(inventor.substring(0, 5));
                                                            $(c.tr).remove();
                                                            $(c.helper).remove();
                                                            api.exe(
                                                                {
                                                                    cmd: 'sectgrp -o ' + $('#operator_name').val() + ' move ' + $(ui.draggable).data('id') + ' \"' + $this.data('grpname') + '\"',
                                                                    onSuccess: function () {
                                                                        //add to expanded group to expand the group list
                                                                        expandedGrp.push($this.data('grpid'));
                                                                        RenderGroup();
                                                                    },
                                                                    onError: function (o) {
                                                                        axellPopUp(o.errorThrown);
                                                                        RenderGroup();
                                                                    }
                                                                });
                                                        },
                                                        accept: function (el) {

                                                            var acceptable = $(el).data('grpname') != $(this).data('grpname');
                                                            return acceptable;

                                                        }
                                                    });
                                                }
                                                renderGrpList();
                                                $('.grpRow:not(".Unassigned_rows")').hide();
                                                //go through expanded group list and open expanded group
                                                $.each(expandedGrp, function (i, grpID) {
                                                    $(".icon[data-grpid='" + grpID + "']").removeClass('maximize').addClass('minimize');
                                                    $("." + grpID + "_rows").show();
                                                })
                                            }
                                        });
                                    }
                                })
                            }
                        });
                    }
                });
            };
        }
        function renderGrpList(){
            var html='<option value="">Select</option>';
            for(var i=0; i< sectorList.length; i++){
                html += "<option value='" + sectorList[i] + "'>" + sectorList[i] + "</option>";
            }
            $('.moveGrp').each(function(){
                $(this).append(html);
                //remove option to move to its own group
                $(this).find("option[value='"+$(this).data('grpname')+"']").remove();
            })
        }

        $(document).ready(function(){
            // check if user has RO right
            if(USERACCESS == "RO"){
                $('#newGrpBtn').addClass('disabled');
                $('#add_sector').addClass('disabled');
                $('#add_sector_virtual').addClass('disabled');
            }
            if(USERACCESS != "superuser"){
                $('#add_sector').addClass('disabled');
                $('#add_sector_virtual').addClass('disabled');
            }
            $.each(OPERATORLIST, function (key, value) {
                $('#operator_name').append($('<option>', {
                    value: value.SysName,
                    text : value.FullName
                }));
            });
            if($.cookie('currentOperator') !=null) {
                $('#operator_name option[value=' + $.cookie('currentOperator') + ']').attr("selected", "selected");
            }else{
                $('#operator_name option[value=' + $('#operator_name select:first').val() + ']').attr("selected", "selected");
                $.cookie('currentOperator', $('#operator_name').val(), { expires: 7, path: '/' });
            }
            //if user is read only, disabled all functionalities
            $.each(OPERATORLIST, function(key, value){
                if(value.SysName === $('#operator_name').val() && value.Access ==="RO"){
                    $('#newRouteBtn').addClass('disabled');
                }
                /*else if($('#operator_name option:selected').val() === 'all'){
                    $('#newRouteBtn').addClass('disabled');
                    $('#newRouteBtn').attr('title', "Please choose the operator");
                }*/
            })

            api.exe({
               cmd: 'get_sector_virtual',
               dataType: 'text',
               async: false,
               onSuccess: function (o) {
                  if (o.ajaxdata == 0)
                     $('#add_sector_virtual').addClass('hidden');
               },
               onError: function (o) {
                     $('#add_sector_virtual').addClass('hidden');
               }
            })

            $('#add_sector').click(function(){
                if(!$(this).hasClass('disabled')){
                    window.location.href= "/target/sector";
                }
            })
            $('#add_sector_virtual').click(function(){
                if(!$(this).hasClass('disabled')){
                    window.location.href= "/target/sector/index.html?virtual=true&virtual=true";
                }
            })
            $(document).on('click','.deleteGrpBtn',function(){
                if(!$(this).hasClass('disabled')) {
                    var grpName = $(this).data('id');
                    axellConfirm("info","Notice","Are you sure you want to delete " + grpName, function () {
                        //if yes we come here:
                        api.exe(
                            {
                                cmd: 'sectgrp -o ' + $('#operator_name').val() + ' remove \"' + grpName + '\"',
                                onSuccess: function (o) {
                                    RenderGroup();
                                },
                                onError: function (o) {
                                    axellPopUp(o.errorThrown);
                                }
                            });

                    })
                }
            });
            //delete sector with no cell res
            $(document).on('click','.delete_sector',function(){
                if(!$(this).hasClass('disabled')) {
                    var sectorID = $(this).data('id');
                    axellConfirm("info","Notice","Are you sure you want to delete " + sectorID, function () {
                        //if yes we come here:
                        api.exe({
                            cmd: 'sector -o ' + $('#operator_name').val() + ' delete \"' + sectorID + '\"',
                            onSuccess: function (o) {
                                RenderGroup();
                            },
                            onError: function (o) {
                                axellPopUp(o.errorThrown);
                            }
                        });
                    })
                }
            });

            $(document).on('change','.moveGrp',function(){
                var nodeId = $(this).data('id');
                var currentGrpName = $(this).val();
                axellConfirm("info","Notice","Are you sure you want to move this sector to group: "+ $(this).val(),function() {
                    api.exe(
                        {
                            cmd: 'sectgrp -o ' + $('#operator_name').val() + ' move ' + nodeId + ' \"' + currentGrpName + '\"',
                            onSuccess: function (o) {
                                //expand the zone that the remote is moved to
                                expandedGrp.push(sectorList.indexOf(currentGrpName));
                                RenderGroup();
                            },
                            onError: function (o) {
                                axellPopUp(o.errorThrown);
                            }
                        });
                })
            });

            $(document).on('click','.editGrpBtn',function(){
                if(!$(this).hasClass('disabled')) {
                    var nodeId = $(this).data('id');

                    $('#dialogdivName').remove();
                    var newDiv = $(document.createElement('div'));
                    newDiv.attr("id", "dialogdivName");
                    var html = "";
                    html += "<span>New Name:</span><input id='newGrpName'/>"
                    newDiv.html(html);
                    newDiv.dialog({buttons: {
                        Rename: function () {
                            if ($('#newZoneName').val() != "") {
                                api.exe(
                                    {
                                        cmd: 'sectgrp -o ' + $('#operator_name').val() + ' rename  \"' + nodeId + '\" \"' + $('#newGrpName').val() + '\"',
                                        onSuccess: function (o) {
                                            newDiv.dialog("close");
                                            RenderGroup();
                                        },
                                        onError: function (o) {
                                            newDiv.dialog("close");
                                            axellPopUp(o.errorThrown);
                                        }
                                    });
                            }
                        },
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }});

                    var xxx = -1;
                }
            });

            $(document).on('click','#newGrpBtn',function(){
                if(!$(this).hasClass('disabled')) {
                    var nodeId = $(this).data('id');

                    $('#dialogdivNewZone').remove();
                    var newDiv = $(document.createElement('div'));
                    newDiv.attr("id", "dialogdivNewZone");
                    var html = "";
                    html += "<span>Group Name:</span><input id='createGrpName'/>"
                    newDiv.html(html);
                    newDiv.dialog({buttons: {
                        Create: function () {

                            api.exe(
                                {
                                    cmd: 'sectgrp -o ' + $('#operator_name').val() + ' add  \"' + $('#createGrpName').val() + '\"',
                                    onSuccess: function (o) {
                                        newDiv.dialog("close");
                                        RenderGroup();
                                    },
                                    onError: function (o) {
                                        newDiv.dialog("close");
                                        axellPopUp(o.errorThrown);
                                    }
                                });
                        },
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }});
                }
            });

            RenderGroup();
            $(document).on('click','.icon.maximize',function(){
                //add to expanded group to expand the group which are clicked to expand
                expandedGrp.push($(this).data('grpid'));
                var grpID = $(this).data('grpid');
                $("."+grpID+"_rows").show();
                $(this).removeClass('maximize').addClass('minimize');
            })
            $(document).on('click','.icon.minimize',function(){
                //add to expanded group to expand the group which are clicked to expand
                expandedGrp = _.without(expandedGrp,$(this).data('grpid'));
                var grpID = $(this).data('grpid');
                $("."+grpID+"_rows").hide();
                $(this).removeClass('minimize').addClass('maximize');
            })

            $('#operator_name').change(function(){
                RenderGroup();
            });
        });
    })
