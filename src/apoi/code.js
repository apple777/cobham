require([ '/js/api.js','/js/lib/jquery.js','/js/lib/jquery-ui.js','/js/lib/underscore.js'], function ( api,$ ) {

    var OPERATOR = $.cookie('currentOperator');
    var USERACCESS = $.cookie('userAccess');
    var IP ="";
    function populateAPOITable(){
        $('#apoi_table').empty();
        api.exe({
            cmd: 'topology -o '+OPERATOR+' --json',
            dataType: 'json',
            onSuccess: function (o) {
                var APOIList = _.where(o.ajaxdata.nodes,{"Node Type":"APOI-S"});
                if(APOIList.length>0) {
                    var tr = "<tr><th> <div class='icon id'></div> Serial</th><th><div class='icon tag'></div> Tag</th>" +
                        "<th><div class='icon software-version'></div> Software Version</th><th><div class='icon ip'></div> IP</th><th><div class='icon location'></div> Location</th>";
                    if (USERACCESS === "superuser") {
                        tr += "<th></th>";
                    }
                    tr += "</tr>";

                    $.each(APOIList,function(i,v){
                        tr +="<tr>";
                        tr +="<td>"+ v.ID+"</td>";
                        tr +="<td>"+ v.Tag+"</td>";
                        tr +="<td>"+ v.System+"</td>";
                        tr +="<td>"+ v.IP+"</td>";
                        tr +="<td>"+ v.Location+"</td>";
                        if(USERACCESS ==="superuser") {
                            tr += "<td><a class='button delete_btn' id='delete_apoi_" + v.ID + "' data-id='" + v.ID + "'>Delete</a></td>";
                        }
                        tr += "</tr>";
                    })
                    $('#apoi_table').append(tr);
                }
                //go through connections list to find which APOI has rf connection
                var connectedAPOI =[];
                api.exe({
                    cmd: 'connections -o '+OPERATOR+' --json',
                    dataType: 'json',
                    onSuccess: function (o) {
                        var rfconnections = o.ajaxdata.rf_connections;
                        $.each(rfconnections,function(i,conn){
                            if(conn.conn[0].ToType.indexOf("APOI") != -1){
                                connectedAPOI.push(conn.conn[0].To.substring(0,conn.conn[0].To.indexOf(":")));
                            }else if(conn.conn[0].FromType.indexOf("APOI") != -1){
                                connectedAPOI.push(conn.conn[0].From.substring(0,conn.conn[0].From.indexOf(":")));
                            }
                        })
                        $.each(connectedAPOI,function(i,id){
                            //$('.delete_btn[data-id="'+id+'"]').addClass('disabled').attr("title","This APOI has RF connection with other nodes in the system");
                        })
                    }
                })
            }
        })

    }

    $(document).ready(function() {
        $('#query_apoi_dialog').hide();
        $('#add_apoi_dialog').hide();
        $('#loading_dialog').hide();
        //if system admin then display add APOI button
        if(USERACCESS ==="superuser"){
            $('#button_panel').prepend('<a class="button" id="add_apoi">Add APOI</a>');
        }
        populateAPOITable();
        $('#add_apoi').click(function(){
            $('#query_apoi_dialog').dialog('open');
        })

        //click on delete button
        $(document).on('click','.delete_btn',function(){
            if(!$(this).hasClass('disabled')) {
                var $this = $(this);
                axellConfirm("alert","Warning","Do you really want to delete this APOI?", function () {
                    $.blockUI({ 
                        fadeIn: 1000, 
                        timeout: 10000, 
                        onBlock: function() { 
                          api.exe({
                              cmd: 'NODE CHECK ' + $this.attr("data-id"),
                              onSuccess: function () {
                                  populateAPOITable();
                                  api.exe({
                                    cmd: "delete_serials_opers " + $this.attr("data-id"),
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
                                 axellConfirm("alert","Warning","There are some configurations for this APOI. Do you really want to delete this APOI and it's configurations?", function () {
                                      $.blockUI({ 
                                          fadeIn: 1000, 
                                          timeout: 10000, 
                                          onBlock: function() { 
                                            api.exe({
                                                cmd: 'NODE DELETE ' + $this.attr("data-id"),
                                                onSuccess: function () {
                                                    populateAPOITable();
                                                    api.exe({
                                                      cmd: "delete_serials_opers " + $this.attr("data-id"),
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
        $('#loading_dialog').dialog({
            width : 300,
            height:'auto',
            modal:true,
            autoOpen:false
        })
        //define add apoi dialog
        $('#add_apoi_dialog').dialog({
            width : 450,
            height:'auto',
            modal:true,
            resizable : false,
            autoOpen : false,
            buttons: {
                'Cancel': function () {
                    $(this).dialog('close');
                },
                'Add APOI': function () {
                    //cmd to add apoi APOI ADD <IP Address>
                    console.log('APOI ADD ' + IP);
                    api.exe({
                        cmd: 'APOI ADD ' + IP,
                        onError: function (e) {
                            axellPopUp(e.errorThrown);
                        },
                        onSuccess: function (o) {
                            //refresh APOI table
                            populateAPOITable();
                        }
                    })
                    $(this).dialog('close');
                }
            }
        })
        //define query apoi dialog
        $('#query_apoi_dialog').dialog({
            width : 300,
            height:'auto',
            modal:true,
            resizable : false,
            autoOpen : false,
            buttons: {
                'Cancel': function () {
                    $(this).dialog('close');
                },
                'Retrieve data': function () {
                    $('#loading_dialog').dialog('open');
                    /*
                    setTimeout(function(){
                        $('#loading_dialog').dialog('close');
                    },1000)
                    */
                    //poll for new APOI using IP
                    //any IP format to validate?
                    if($('#apoi_ip').val() !=""){
                        IP = $('#apoi_ip').val();
                        api.exe({
                            cmd:'APOI QUERY '+$('#apoi_ip').val()+' --json',
                            onError:function(e){
                                $('#loading_dialog').dialog('close');
                                axellPopUp("Error querying APOI with IP "+$('#apoi_ip').val()+" "+ e.errorThrown);
                            },
                            onSuccess: function (o) {
                                $('#loading_dialog').dialog('close');
                                //display detailed of new APOI in another dialog
                                var apoi = $.parseJSON(o.ajaxdata);
                                //populate info in add apoi dialog
                                $('#apoi_name').text(apoi.Name);
                                setLedColor("#loc_id1",apoi.LocalID.charAt(0));
                                setLedColor("#loc_id2",apoi.LocalID.charAt(1));
                                $('#sys_id').text(apoi.SystemID);
                                $('#version').text(apoi.SoftwareVersion);
                                $('#slot1').text(apoi.Bands.Slot1);
                                $('#slot2').text(apoi.Bands.Slot2);
                                $('#slot3').text(apoi.Bands.Slot3);
                                $('#slot4').text(apoi.Bands.Slot4);
                                $('#slot5').text(apoi.Bands.Slot5);
                                $('#slot6').text(apoi.Bands.Slot6);
                                $('#slot7').text(apoi.Bands.Slot7);
                                $('#slot8').text(apoi.Bands.Slot8);
                                $('#add_apoi_dialog').dialog('open');

                            }
                        })
                    }
                    $(this).dialog('close');
                }
            }
        })

    });
});

