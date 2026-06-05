require([ '/js/api.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js','/js/convert.js','/js/util.js','/js/lib/jquery-ui.js','/js/lib/jquery_cookie.js'],
    function (api, convert, console, _, $,convert,util) {
        var unassignedList =[];
        var zoneList =[];
        var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
        var USERACCESS = $.cookie('userAccess');
        var expandedZone=[];
        var bundles=[];

        function UpdateConnections(){
         api.exe({
            cmd: "connections -o " + $("#operator_name").val() + " --json",
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.BUNDLEGROUP, function (i, top) {
                    bundles[i] = top;
                })
            }
         })
        }

        function DrawZone(zoneID,zoneName,zoneNodes,topologyData, isUnassignedZone)
        {
            var html = "<table class='zoneTable' data-zonename='"+zoneName+"' data-zoneid='"+zoneID+"'>";

            if(isUnassignedZone){
                if (zoneNodes.length > 0) {
                    expandedZone.push(zoneID);
                    html += "<tr><td colspan='5' class='zoneHeader' title='Number of remote: "+zoneNodes.length+"'><span class='zoneNameDetail'><div class='icon minimize' data-zoneid='"+zoneID+"' data-zonename='" + zoneName + "'></div> " + zoneName  + "</span>" +
                        "<span class='remote_num'> -  Number of remotes: " + zoneNodes.length +"</span></td>";
                }else{
                    expandedZone = _.without(expandedZone,zoneID);
                    html += "<tr><td colspan='5' class='zoneHeader' title='Number of remote: "+zoneNodes.length+"'><span class='zoneNameDetail'><div class='icon maximize' data-zoneid='"+zoneID+"' data-zonename='" + zoneName + "'></div> " + zoneName + "</span>" +
                        "<span class='remote_num'> -  Number of remotes: " + zoneNodes.length +"</span></td>";
                }
                html += "<td class='zoneHead' colspan='1'></td></tr>"
            }else {
                if (zoneNodes.length > 0) {
                    html += "<tr><td colspan='5' class='zoneHeader' title='Number of remote: "+zoneNodes.length+"'><span class='zoneNameDetail'><div class='icon maximize' data-zoneid='"+zoneID+"' data-zonename='" + zoneName + "' ></div> " + zoneName + "</span>" +
                        "<span class='remote_num'> -  Number of remotes: " + zoneNodes.length +"</span></td>";
                }else{
                    expandedZone = _.without(expandedZone,zoneID);
                    html += "<tr><td colspan='5' class='zoneHeader' title='Number of remote: "+zoneNodes.length+"'><span class='zoneNameDetail'><div class='icon maximize' data-zoneid='"+zoneID+"' data-zonename='" + zoneName + "' ></div> " + zoneName + "</span>"+
                        "<span class='remote_num'> -  Number of remotes: " + zoneNodes.length +"</span></td>";
                }
                html += "<td class='zoneHead' colspan='1'><div class='icon editwhite editZoneBtn' data-id='" + zoneName + "' title='Edit Zone Name'></div>"
                if(USERACCESS === "RO"){
                    html += "<div class='icon close' data-id='" + zoneName + "' title='Delete Zone'></div></td></tr>";
                }else{
                    if (zoneNodes.length === 0) {
                        html += "<div class='icon error deleteZoneBtn' data-id='" + zoneName + "' title='Delete Zone'></div></td></tr>";
                    } else if(zoneNodes.length > 0) {
                        html += "<div class='icon close' data-id='" + zoneName + "' title='Delete Zone'></div></td></tr>";
                    }
                }
            }
            if (zoneNodes.length > 0) {
                html += "<tr class ='"+zoneID+"_rows zoneRow' data-zoneid='"+zoneID+"' data-zonename= '"+ zoneName+"'>" +
                    "<th></th>" +
                    "<th>ID</th>" +
                    "<th>Tag</th>" +
                    "<th>Location Tag</th>" +
                    "<th>View Node</th>" +
                    "<th>Move To Zone</th>" +
                    "</tr>"
                for (var i = 0; i < zoneNodes.length; i++) {
                    var nodeData = _.findWhere(topologyData.ajaxdata.nodes, {ID: zoneNodes[i]});

                    var split = nodeData.IP.split('.');
                    var s = parseInt(split[3]);
                    var port = 10000 + s;

                    html += "<tr class='"+zoneID+"_rows zoneRow' data-id='" + zoneNodes[i] + "' data-zoneid='"+zoneID+"' data-zonename='" + zoneName + "'>" +
                        "<td><img src='/images/icons/RRU_icon.png' class='RRU' data-id='" + zoneNodes[i] + "' data-zoneid='"+zoneID+"' data-zonename='" + zoneName + "'/></td>" +
                        "<td>" + zoneNodes[i] + "</td>" +
                        "<td>" + nodeData.Tag + "</td>" +
                        "<td>" + nodeData.Location + "</td>" +
                        "<td><a href='http://" + window.location.hostname +":"+ port  +"' target='_blank' title='View node'><div class='icon magnifying_glass'></div></a></td>" +
                        "<td><select data-id='" + zoneNodes[i] + "' data-zoneid='"+zoneID+"' data-zonename = '" + zoneName + "' class='moveZone'></select></td></tr>";
                }

            }
            html += "</table>";

            if(isUnassignedZone)
            {
                $('#unassigned_content').html(html);
            }
            else
            {
                $('#zone_content').append(html);
            }
            if(USERACCESS == "RO"){
                $('.moveZone').attr('disabled',true);
                $('.editwhite').addClass('disabled');
            }
        }

        function RenderZones()
        {
            if($('#operator_name').val() != 'all')
            {
                var operName = $('#operator_name').val();
                $.removeCookie('currentOperator',{ path: '/' });
                $.cookie('currentOperator', operName, { expires: 7, path: '/' });
                zoneList = [];
                api.exe(
                    {
                    cmd: 'topology -o '+operName+' --json',
                        dataType :'json',
                    onSuccess:function(k){
                        api.exe({
                            cmd:'zone -o '+operName+' list --nodes',
                            onSuccess:function(o){
                                var tmpZoneList = o.ajaxdata.split('\n');
                                $('#zone_content').html('');
                                tmpZoneList.splice(-1,1);
                                for(var i=0; i< tmpZoneList.length; i++)
                                {
                                    var zoneNameCut = tmpZoneList[i].indexOf(':');
                                    var zoneData = tmpZoneList[i].substring(zoneNameCut+2,tmpZoneList[i].length);
                                    var zoneName = zoneData.match(/"(.*?)"/)[1];

                                    var zoneNodes = [];
                                    if(zoneData.length >= (zoneName.length + 2)+4)
                                    {
                                        var res = zoneData.replace('\"'+zoneName+'\" ', "").trim();
                                         zoneNodes = res.split(' ');
                                    }
                                    if($.inArray(zoneName, zoneList) <= -1)
                                    {
                                        zoneList.push(zoneName);
                                    }
                                    if(zoneName === "Unassigned")
                                    {
                                        DrawZone(i,zoneName,zoneNodes,k,true);
                                    }
                                    else
                                    {
                                        DrawZone(i,zoneName,zoneNodes,k,false);
                                    }
                                    var c = {};
                                    $( ".zoneRow" ).draggable(
                                        {
                                            helper: function(event) {
                                                return $( "<div class='dragged_item'><img src='/images/icons/RRU_icon.png' class='RRU'/>  "+$(this).data('id')+" - "+$(this).data('zonename')+ "</div>" );
                                            },
                                            cursor: "move",
                                            cursorAt: { top: 0, left: 0 },
                                            start: function(event, ui) {
                                                c.tr = this;
                                                c.helper = ui.helper;
                                            }
                                        });
                                    $( ".zoneTable" ).droppable({
                                        tolerance: 'pointer',
                                        hoverClass: "ui-state-hover",
                                        drop: function( event, ui ) {
                                            $( this ).addClass( "ui-state-highlight" );
                                            var inventor = ui.draggable.text();
                                            var $this = $(this);
                                            $this.find("input").val(inventor.substring(0,5));
                                            $(c.tr).remove();
                                            $(c.helper).remove();

                                            var kMove = undefined;
                                            for(var k = 0; k < bundles.length; k ++) 
                                            {
                                                for(var m = 0; m < bundles[k].nodes.length; m++) 
                                                {
                                                   if (bundles[k].nodes[m].ID == $(ui.draggable).data('id'))
                                                      kMove = k;
                                                }
                                            }
                                            if (kMove != undefined)
                                            {
                                                for(var m = 0; m < bundles[kMove].nodes.length; m++) 
                                                {
                                                   api.exe({
                                                       cmd:'ZONE -o '+$("#operator_name").val()+' MOVE '+bundles[kMove].nodes[m].ID+' "'+$this.data('zonename')+'"',
                                                       onSuccess:function(){
                                                           expandedZone.push($this.data('zoneid'));
                                                       }
                                                   })
                                                }
                                                RenderZones();
                                                axellPopUp("Chain "+ kMove+" has been moved to "+ $this.data('zonename'));
                                            }
                                            else
                                            {
                                                api.exe(
                                                   {
                                                       cmd: 'zone -o '+$('#operator_name').val()+' move ' + $(ui.draggable).data('id') + ' \"' + $this.data('zonename')+'\"',
                                                       onSuccess:function(){
                                                           //add to expanded zone to expand the zone list
                                                           expandedZone.push($this.data('zoneid'));
                                                           RenderZones();
                                                       },
                                                       onError: function(o){
                                                           axellPopUp(o.errorThrown);
                                                           RenderZones();
                                                       }
                                                   });
                                            } 


                                            //$(this).doSomething();

                                            // do something with the draggable item

                                            //alert("draggable orig zone name "+$(ui.draggable).data('zonename') + " dropped zonename " + $(this).data('zonename'));
                                            //$( this )
                                            //    .addClass( "ui-state-highlight" )
                                            //    .html( "Dropped!" );
                                        },
                                        accept:function(el) {

                                            var acceptable = $(el).data('zonename') != $(this).data('zonename');
                                            return acceptable;

                                        }
                                    });
                                }
                                renderZoneList();
                                $('.zoneRow:not(".Unassigned_rows")').hide();
                                //go through expanded zone list and open expanded zone
                                $.each(expandedZone,function(i, zoneID){
                                    $(".icon[data-zoneid='"+zoneID+"']").removeClass('maximize').addClass('minimize');
                                    $("."+zoneID+"_rows").show();
                                })
                            }
                        });
                    }
                });
            };
        }
        function renderZoneList(){
            var html='<option value="">Select</option>';
            for(var i=0; i< zoneList.length; i++){
                html += "<option value='" + zoneList[i] + "'>" + zoneList[i] + "</option>";
            }
            $('.moveZone').each(function(){
                $(this).append(html);
                //remove option to move to its own group
                $(this).find("option[value='"+$(this).data('zonename')+"']").remove();
            })
        }

        $(document).ready(function(){
            // check if user has RO right
            if(USERACCESS == "RO"){
                $('#newZoneBtn').addClass('disabled');
                $('#clearZonesBtn').addClass('disabled');
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

            UpdateConnections();

            $(document).on('click','.deleteZoneBtn',function(){
                if(!$(this).hasClass('disabled')) {
                    var zoneName = $(this).data('id');
                    axellConfirm("info","Notice","Are you sure you want to delete " + zoneName, function () {
                        //if yes we come here:
                        api.exe(
                            {
                                cmd: 'zone -o ' + $('#operator_name').val() + ' remove \"' + zoneName + '\"',
                                onSuccess: function (o) {
                                    RenderZones();
                                },
                                onError: function (o) {
                                    axellPopUp(o.errorThrown);
                                }
                            });

                    })
                }
            });

            $(document).on('change','.moveZone',function(){
                var nodeId = $(this).data('id');
                var currentZoneName = $(this).val();
                axellConfirm("info","Notice","Are you sure you want to move this remote and all it's chain to zone: "+ currentZoneName,function() {
                  var kMove = undefined;
                  for(var k = 0; k < bundles.length; k ++) 
                  {
                     for(var m = 0; m < bundles[k].nodes.length; m++) 
                     {
                        if (bundles[k].nodes[m].ID == nodeId)
                           kMove = k;
                     }
                  }
                  if (kMove != undefined)
                  {
                     for(var m = 0; m < bundles[kMove].nodes.length; m++) 
                     {
                        api.exe({
                            cmd:'ZONE -o '+$("#operator_name").val()+' MOVE '+bundles[kMove].nodes[m].ID+' "'+currentZoneName+'"',
                            onSuccess:function(){
                                expandedZone.push(zoneList.indexOf(currentZoneName));
                            }
                        })
                     }
                     RenderZones();
                     axellPopUp("Chain "+ kMove+" has been moved to "+ currentZoneName);
                  }
                  else
                  {
                    api.exe(
                        {
                            cmd: 'zone -o ' + $('#operator_name').val() + ' move ' + nodeId + ' \"' + currentZoneName + '\"',
                            onSuccess: function (o) {
                                //expand the zone that the remote is moved to
                                expandedZone.push(zoneList.indexOf(currentZoneName));
                                RenderZones();
                            },
                            onError: function (o) {
                                axellPopUp(o.errorThrown);
                            }
                        });
                  }
                })
            });

            $(document).on('click','.editZoneBtn',function(){
                if(!$(this).hasClass('disabled')) {
                    var nodeId = $(this).data('id');

                    $('#dialogdivName').remove();
                    var newDiv = $(document.createElement('div'));
                    newDiv.attr("id", "dialogdivName");
                    var html = "";
                    html += "<span>New Name:</span><input id='newZoneName' value='"+nodeId+"' />"
                    newDiv.html(html);
                    newDiv.dialog({buttons: {
                        Rename: function () {
                            if (ZoneNameValidate($('#newZoneName').val())){
                                api.exe(
                                    {
                                        cmd: 'zone -o ' + $('#operator_name').val() + ' rename  \"' + nodeId + '\" \"' + $('#newZoneName').val() + '\"',
                                        onSuccess: function (o) {
                                            newDiv.dialog("close");
                                            RenderZones();
                                        },
                                        onError: function (o) {
                                            newDiv.dialog("close");
                                            axellPopUp(o.errorThrown);
                                        }
                                    });
                            }
                            else {
                                axellPopUp("Zone Name should start from letter and no spaces. and with a maximum length of 12 characters");
                            }                            
                        },
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }});

                    var xxx = -1;
                }
            });

            $(document).on('click','#newZoneBtn',function(){
                if(!$(this).hasClass('disabled')) {
                    var nodeId = $(this).data('id');

                    $('#dialogdivNewZone').remove();
                    var newDiv = $(document.createElement('div'));
                    newDiv.attr("id", "dialogdivNewZone");
                    var html = "";
                    html += "<span>Zone Name:</span><input id='createZoneName'/>"
                    newDiv.html(html);
                    newDiv.dialog({buttons: {
                        Create: function () {
                            if (ZoneNameValidate($('#createZoneName').val())) {
                                api.exe(
                                    {
                                        cmd: 'zone -o ' + $('#operator_name').val() + ' add  \"' + $('#createZoneName').val() + '\"',
                                        onSuccess: function (o) {
                                            newDiv.dialog("close");
                                            RenderZones();
                                        },
                                        onError: function (o) {
                                            newDiv.dialog("close");
                                            axellPopUp(o.errorThrown);
                                        }
                                    });
                            }
                            else {
                                axellPopUp("Zone Name should start from letter and no spaces. and with a maximum length of 12 characters");
                            }
                        },
                        Cancel: function () {
                            $(this).dialog("close");
                        }
                    }});
                }
            });

            $(document).on('click','#clearZonesBtn',function(){
                if(!$(this).hasClass('disabled')) {
                    api.exe({
                      cmd: 'zone -o ' + $('#operator_name').val() + ' clear',
                      onSuccess: function (o) {
                          RenderZones();
                      },
                      onError: function (o) {
                          axellPopUp(o.errorThrown);
                      }
                    });
                }
            });

            function ZoneNameValidate(str)
            {
               if (str.length == 0)
                  return false;
               else if (str.indexOf(" ") != -1)
                  return false;
               else if ((str.charCodeAt(0) >= 48) && (str.charCodeAt(0) <= 57))
                  return false;
               else if ((str.length > 12))
                  return false;

               return true;
            }

            RenderZones();

            $(document).on('click','.icon.maximize',function(){
                //add to expanded zone to expand the zone which are clicked to expand
                expandedZone.push($(this).data('zoneid'));
                var zoneID = $(this).data('zoneid');
                //var zoneName = $(this).attr('data-zonename').replace(/\s/g,".");//in case zone name has space, create a class called with that
                $("."+zoneID+"_rows").show();
                $(this).removeClass('maximize').addClass('minimize');
            })
            $(document).on('click','.icon.minimize',function(){
                //add to expanded zone to expand the zone which are clicked to expand
                expandedZone = _.without(expandedZone,$(this).data('zoneid'));
                var zoneID = $(this).data('zoneid');
                //var zoneName = $(this).attr('data-zonename').replace(/\s/g,".");
                $("."+zoneID+"_rows").hide();
                $(this).removeClass('minimize').addClass('maximize');
            })

            $('#operator_name').change(function(){
               UpdateConnections();
               RenderZones();
            });
        });
    })
