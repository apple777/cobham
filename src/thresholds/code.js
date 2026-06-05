require([ '/js/api.js', '/js/format.js', '/js/lib/handlebars.js', '/js/lib/underscore.js', '/js/handlebars-helpers.js' ],
function ( api, format, Handlebars, _ ) {

    var severity_select_options = '<option val="Critical">Critical</option><option val="Major">Major</option><option val="Minor">Minor</option><option val="Info">Info</option><option val="Discard">Discard</option>'
    var severity_select_options_devices = '<option val="On">On</option><option val="Off">Off</option>'
    
    var USERACCESS = $.cookie('userAccess');
    
    var advanced = 0;
    
    var temp_low = 1;
    var temp_hi = 4;
    var temp_low_range = 2;
    var temp_hi_range = 3;
    var temp_scroll_change = false;
 
    var alarmsCmd = [];
    var measCmdHi = "";
    var measCmdLo = "";

    var dryContId = [];

    var mdl;
    
     /***
      * This function is used to show technician more options.
      * keyCode: ALT+SHIFT+T
      */
    var map = {18: false, 16: false, 84: false};
    function techPermissions()
    {
         $(document).keydown(function(e) {
             if (e.keyCode in map) {
                 map[e.keyCode] = true;
                 if (map[18] && map[16] && map[84]) {
                     axellInput("");
                     map = {18: false, 16: false, 84: false};
                 }
             }
         }).keyup(function(e) {
             if (e.keyCode in map) {
                 map[e.keyCode] = false;
             }
         });
    }

    function axellInput(message_string) {
       // Dialog here
       $('<form>'+message_string+'<input type="text" style="z-index:10000" name="name" autofocus><br></form>').dialog({
           title: "Technician Password ",
           modal: true,
           buttons: {
               'OK': function () {
                   var name = $('input[name="name"]').val();
                     if(name == "deko"){
                           document.getElementById("DryContact").style.visibility = "visible";
                           for(var i = 0; i < dryContId.length; i++)                                        
                              document.getElementById(dryContId[i]).style.visibility = "visible";
                           $(this).dialog('close');
                           //alert("ok");
                     }else{
                           $(this).dialog('close');
                           //alert("not ok");
                     }
               },
               'Cancel': function () {
                   $(this).dialog('close');
               }
           }
       });
    };

    function set_severity(id){
        var split = id.split('_');
        var attr = split[0];
        var hwenum = split[1];

        var severity = document.getElementById(id + "_select").value;
        var sev_num = 0;
        
        if ((severity == 'Critical') || (severity == 'On')){
            document.getElementById(id + "_select").style.backgroundColor="#FF0000";
            sev_num = 0;
        }
        else if (severity == 'Major'){
            document.getElementById(id + "_select").style.backgroundColor="#FF8800";
            sev_num = 1;
        }
        else if (severity == 'Minor'){
            document.getElementById(id + "_select").style.backgroundColor="#FFFF00";
            sev_num = 2;
        }
        else if (severity == 'Info'){
            document.getElementById(id + "_select").style.backgroundColor="#FFFFFF";
            sev_num = 3;
        }
        else if ((severity == 'Discard') || (severity == 'Off')){
            document.getElementById(id + "_select").style.backgroundColor="#1166FF";
            sev_num = 4;
        }

        var cont;
        if (document.getElementById(id + "_checkbox").checked)
            cont = 1;
        else
            cont = 0;

        
        /*var command;
        command = "alarms severity set " + attr + " -" + hwenum + " " + sev_num;
        api.exe({
            cmd: command,
            async: false,
        })*/
        alarmsCmd.push("alarms severity set " + attr + " -" + hwenum + " " + sev_num + " " + cont);        
    }

    function set_select_color(id){
        if ((document.getElementById(id + "_select").value == 'Critical') || (document.getElementById(id + "_select").value == 'On')){
            document.getElementById(id + "_select").style.backgroundColor="#FF0000";
        }
        else if (document.getElementById(id + "_select").value == 'Major'){
            document.getElementById(id + "_select").style.backgroundColor="#FF8800";
        }
        else if (document.getElementById(id + "_select").value == 'Minor'){
            document.getElementById(id + "_select").style.backgroundColor="#FFFF00";
        }
        else if (document.getElementById(id + "_select").value == 'Info'){
            document.getElementById(id + "_select").style.backgroundColor="#FFFFFF";
        }
        else if ((document.getElementById(id + "_select").value == 'Discard') || (document.getElementById(id + "_select").value == 'Off')){
            document.getElementById(id + "_select").style.backgroundColor="#1166FF";
        }
    }

    $( '#apply-button' ).click( function ( e ) {
        for(var i = 0; i < alarmsCmd.length; i++){
           api.exe({
               cmd: alarmsCmd[i],
               async: false,
           })
        }
        alarmsCmd.length = 0;

        if(measCmdLo != ""){
           api.exe({
               cmd: measCmdLo,
               async: false,
           })
           measCmdLo = "";
        } 
        if(measCmdHi != ""){
           api.exe({
               cmd: measCmdHi,
               async: false,
           })
           measCmdHi = "";
        } 
    });

    //** register the event listener for apply button
    $( '#advanced-button' ).click( function ( e ) {
        var button = document.getElementById('advanced-button');
        if(advanced == true){
            button.innerText = "Advanced";
            advanced = false;
        }
        else{
            button.innerText = "Basic";
            advanced = true;
        }
        showSeverities();
    });
    
    function showSliders(){
        var row;
        row = $('<tr id="slider"/>');
        $('#sliders-table').append(row);
        row.append($("<td>Controller Temperature Alarm</td>"));
        row.append($("<td id='CTA_min'>" + temp_low + "</td>"));
        row.append($("<td><div id='CTA_slider' class='default-filter-slider'></div></td>")); 
        row.append($("<td id='CTA_max'>" + temp_hi + "</td>"));

        var $slider = $('#CTA_slider').slider({
            min: temp_low_range,//lowerRange is always zero for this kind of slider
            max: temp_hi_range,
            step: 0.2,
            range: true,
            values: [ temp_low, temp_hi ],
            disabled: false,
            slide: function ( event, ui ) {
                if ( ( ui.values[0] > ui.values[1] ) || ( ui.values[1] < ui.values[0] ) ) {
                    return false;
                }
                var CTA_min = document.getElementById('CTA_min');
                var CTA_max = document.getElementById('CTA_max');
                CTA_min.innerText = ( ui.values[ 0 ] ).toFixed( 1 );
                CTA_max.innerText = ( ui.values[ 1 ] ).toFixed( 1 );
                temp_low = ui.values[ 0 ];
                temp_hi = ui.values[ 1 ];
                temp_scroll_change = true;
            }
        }).addClass( 'slider-with-nominal' );        
    }
    
    
    function showSeverities(){
        var table = document.getElementById('severity-table');
        var rowsNum = table.rows.length;
        for(var i = rowsNum-1; i > 0; i --){
            table.deleteRow(i);
        }
        
        document.getElementById("DryContact").style.visibility = "hidden";
        dryContId.length = 0;

        var command = "alarms severity --json";
        var isAdvanced = false;
        var skipRow = false;
        api.exe({
            cmd: command, //'topology --json',
            dataType: 'json',
            onSuccess: function (o) {
                $.each(o.ajaxdata.SEVERITIES, function (i, sev) {
                    var row;
                    skipRow = false;
                    if(sev['ATTR'] == '_'){
                        if(sev['HWENUM'] == 'A'){
                            isAdvanced = true;
                            if(advanced == true){
                                row = $('<tr id="sev_header' + sev['DESC'] +'"/>');
                            }
                            else{
                                skipRow = true;
                            }
                        }
                        else{
                            row = $('<tr id="sev_header' + sev['DESC'] +'"/>');
                            isAdvanced = false;
                        }
                        if(skipRow == false){
                            $('#severity-table').append(row);
                            row.append($('<td class="separator" colspan="10"><div title></div>' + sev['DESC'] + '</td>'));
                        }
                    }
                    else {
                        if(isAdvanced){
                            if(advanced == true){
                                row = $('<tr id="sev_line_' + i +'"/>');
                            }
                            else{
                                skipRow = true;
                            }
                        }
                        else{
                            row = $('<tr id="sev_line_' + i +'"/>');
                        }
                        if(skipRow == false){
                            $('#severity-table').append(row);
                            row.append($("<td>" + sev['ATTR']  + "</td>"));
                            row.append($("<td>" + sev['HWENUM']  + "</td>"));
                            row.append($("<td>" + sev['DESC']  + "</td>"));
                            if((mdl.indexOf("MTDI") != -1) || (mdl.indexOf("RRU") != -1)){
                              row.append($('<td> <select id="'+ sev['ATTR'] +'_' + sev['HWENUM'] + '_select" class="selector">' + severity_select_options_devices  + "</select></td>"));
                              if(sev['TEXT'] == "Discard")
                                 document.getElementById(sev['ATTR'] + "_" + sev['HWENUM'] + "_select").value = "Off";
                              else
                                 document.getElementById(sev['ATTR'] + "_" + sev['HWENUM'] + "_select").value = "On";
                            }else{
                              row.append($('<td> <select id="'+ sev['ATTR'] +'_' + sev['HWENUM'] + '_select" class="selector">' + severity_select_options  + "</select></td>"));
                              document.getElementById(sev['ATTR'] + "_" + sev['HWENUM'] + "_select").value = sev['TEXT'];
                            }
                            set_select_color(sev['ATTR'] + "_" + sev['HWENUM']);
                            row.append($('<td><input type="checkbox" id="'+ sev['ATTR'] +'_' + sev['HWENUM'] + '_checkbox"/></td>'));
                            if(sev['CONT'] == 1)
                              document.getElementById(sev['ATTR'] + "_" + sev['HWENUM'] + "_checkbox").checked = true;
                            else
                              document.getElementById(sev['ATTR'] + "_" + sev['HWENUM'] + "_checkbox").checked = false;
                            document.getElementById(sev['ATTR'] + "_" + sev['HWENUM'] + "_checkbox").style.visibility = "hidden";
                            dryContId.push(sev['ATTR'] + "_" + sev['HWENUM'] + "_checkbox");
                            
                            if(USERACCESS !='superuser'){
                                document.getElementById(sev['ATTR'] + "_" + sev['HWENUM'] + "_select").disabled = true;
                            }
                            else{
                                document.getElementById(sev['ATTR'] + "_" + sev['HWENUM'] + "_select").onchange = function() {set_severity(sev['ATTR'] + "_" + sev['HWENUM'])};
                                document.getElementById(sev['ATTR'] + "_" + sev['HWENUM'] + "_checkbox").onchange = function() {set_severity(sev['ATTR'] + "_" + sev['HWENUM'])};
                            }
                        }
                    }
                })
            }
        })
    }
    
    function updateScroll(){
        if(temp_scroll_change == true){
            /*api.exe({
                cmd : 'measurements set TEMP FPGA 1 MIN ' + temp_low
            });*/
            measCmdLo = "measurements set TEMP FPGA 1 MIN " + temp_low;
            /*api.exe({
                cmd : 'measurements set TEMP FPGA 1 MAX ' + temp_hi
            });*/
            measCmdHi = "measurements set TEMP FPGA 1 MAX " + temp_hi;
            temp_scroll_change = false;
        }
        
        setTimeout(updateScroll, 1000);
    }
    
    $(document).ready(function(){
        var button = document.getElementById('advanced-button');
        button.innerText = "Advanced";
    
        techPermissions();

        document.getElementById("DryContact").style.visibility = "hidden";

        api.exe({
            cmd: getAttr('mdl'),
            onSuccess: function (o) {
                mdl = o.ajaxdata;
            },
            onError: function (err) {
                console.log(err.errorThrown);
            }
        })

        api.exe({
            cmd : 'measurements get tem full',
            onSuccess : function (o) {
                var data = $.parseJSON(o.ajaxdata);
				temp_low_range = parseInt(data.TEMP_MIN);
				temp_hi_range = parseInt(data.TEMP_MAX);
                temp_low = parseInt(data.TEMP_LO);
                temp_hi = parseInt(data.TEMP_HI);
				showSliders();
				showSeverities();
            }
        });
        setTimeout(updateScroll, 1000);
    })
});
