require([ '/js/api.js','/js/lib/jquery.js','/js/lib/jquery-ui.js','/js/lib/underscore.js'], function ( api,$ ) {

    var OPERATOR = $.cookie('currentOperator');
    var USERACCESS = $.cookie('userAccess');
    function populateMSDHRTable(){
        $('#msdhr_table').empty();
        api.exe({
            cmd: 'topology -o '+OPERATOR+' --json',
            dataType: 'json',
            onSuccess: function (o) {
                var MSDHRList = _.where(o.ajaxdata.nodes,{"Node Type":"MSDH-R"});
                if(MSDHRList.length>0) {
                    var tr = "<tr><th> <div class='icon id'></div> Serial</th><th><div class='icon tag'></div> Tag</th>" +
                        "<th><div class='icon software-version'></div> Software Version</th><th><div class='icon ip'></div> IP</th><th><div class='icon location'></div> Location</th>";
                    if (USERACCESS === "superuser") {
                        tr += "<th></th>";
                    }
                    tr += "</tr>";

                    $.each(MSDHRList,function(i,v){
                        tr +="<tr>";
                        tr +="<td>"+ v.ID+"</td>";
                        tr +="<td>"+ v.Tag+"</td>";
                        tr +="<td>"+ v.System+"</td>";
                        tr +="<td>"+ v.IP+"</td>";
                        tr +="<td>"+ v.Location+"</td>";
                        if(USERACCESS ==="superuser") {
                            tr += "<td><a class='button delete_btn' id='delete_msdhr_" + v.ID + "' data-id='" + v.ID + "'>Delete</a></td>";
                        }
                        tr += "</tr>";
                    })
                    $('#msdhr_table').append(tr);
                }
            }
        })

    }

    $(document).ready(function() {

        api.exe({
            cmd: 'get_internal_ip',
            dataType: 'text',
            async: false,
            onSuccess: function (o) {
               var remoteIp;
               if (o.ajaxdata == "10.0.0.1")
                  remoteIp = "10.0.0.2";
               else
                  remoteIp = "10.0.0.1";
               $('#msdhr_ip').val(remoteIp);
            },
            onError: function (o) {
            }
        })

        $('#add_msdhr_dialog').hide();
        //if system admin then display add MSDHR button
        if(USERACCESS ==="superuser"){
            $('#button_panel').prepend('<a class="button" id="add_msdhr">Add MSDH</a>');
        }
        populateMSDHRTable();
        $('#add_msdhr').click(function(){
            $('#add_msdhr_dialog').dialog('open');
        })

        //click on delete button
        $(document).on('click','.delete_btn',function(){
            if(!$(this).hasClass('disabled')) {
                var $this = $(this);
                axellConfirm("alert","Warning","Do you really want to delete this MSDH-R?", function () {
                    //cmd delete msdhr MSDHR DELETE <MSDHR ID>
                    console.log('MSDHR DELETE ' + $this.attr('data-id'));
                    api.exe({
                        cmd: 'MSDHR DELETE ' + $this.attr('data-id') +" -f",
                        onError: function (e) {
                            axellPopUp("Error delelte MSDH-R with ID " + $this.attr('data-id') + " " + e.errorThrown);
                        },
                        onSuccess: function (o) {
                            //refresh MSDHR table
                            populateMSDHRTable();
                        }
                    })
                })
            }
        })
        //define add apoi dialog
        $('#add_msdhr_dialog').dialog({
            width : 450,
            height:'auto',
            modal:true,
            resizable : false,
            autoOpen : false,
            buttons: {
                'Cancel': function () {
                    $(this).dialog('close');
                },
                'Add MSDH': function () {
                    //cmd to add msdhr MSDHR ADD <IP Address>
                    if ($('#msdhr_ip').val() != "") {
                        console.log('MSDHR ADD ' + $('#msdhr_ip').val());
                        $.blockUI({ 
                           fadeIn: 1000, 
                           timeout: 30000, 
                           onBlock: function() { 
                             api.exe({
                                 cmd: 'MSDHR ADD ' + $('#msdhr_ip').val(),
                                 onError: function (e) {
                                     axellPopUp(e.errorThrown);
                                     $.unblockUI();
                                 },
                                 onSuccess: function (o) {
                                     //refresh MSDHR table
                                     populateMSDHRTable();
                                     $.unblockUI();
                                 }
                             })
                           } 
                        }) 
                    }
                    $(this).dialog('close');
                }
            }
        })

    });
});

