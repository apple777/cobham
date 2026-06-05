require([ '/js/api.js' ], function ( api ) {
    //{{OPTIONS
    //** The interval to check for new logs
    var CHECK_NEW_LOGS_INTERVAL = 30000;
    var USERACCESS = $.cookie('userAccess');
    
    var isSlave=false;
    var isMaster=false;
    
    var alarmsDB=[];
    var tableRows=[];
    var tableRowIP=[];
    var filterOptions=[];
    
    var sorter = "Source";
    var filterSource = "";
    var filterText = "";
    var filterStatusCritical = true;
    var filterStatusMajor = true;
    var filterStatusMinor = true;
    var filterStatusInfo = true;
    var filterStatusEvent = true;
    var filterStatusClear = true;
    
    var timeSort = 0;
    var sourceSort = 1;
    var attribSort = 1;
    var descriptionSort = 1;
    var severitySort = 0;
    var tagSort = 1;
    
    var selectedIP;
    var selectedRow;
    var selectedRowId;
    
    var USERNAME = $.cookie('username');
    var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
    var OPERATOR = OPERATORLIST[0];
    var operatorName;
    
    var sort_by = function(field, reverse, primer){
        if(field=='SEVERITY'){
            var key = function (x) {
                var severityText = x.SEVERITY;
                if (severityText == 'Critical')        return 0;
                if (severityText == 'Major')            return 1;
                if (severityText == 'Minor')         return 2;
                if (severityText == 'Info')            return 3;
            };
        }
        else{
            var key = function (x) {return primer ? primer(x[field]) : x[field]};
        }
        
        return function (a,b) {
            var A = key(a), B = key(b);
            return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1,1][+!!reverse];                  
        }
    }

    function getAlarms(){
        var command;
        
        if(USERNAME != 'sysadmin'){
			operatorName = OPERATOR.SysName;
            command = "alarms dump --json --oper " + operatorName;
        }
        else{
            command = "alarms dump --json";
        }
        
        var length = alarmsDB.length;
        for(var x=0; x < length; x++){
            alarmsDB.pop();
        }
        
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.alarms, function (i, alarm) {
                    alarmsDB[i] = alarm;
              })
            }
        })
    }

    function hideAlarms() {
        var alarmsTableContent = document.getElementById('alarms-table');
        var rows = alarmsTableContent.getElementsByTagName('tr');
        var rowsCount = rows.length;
        for(var x=rowsCount - 1; x > 0; x--){
            alarmsTableContent.deleteRow(x);
        }
    }
    
    function createAlarmsTable() {
        tableRows.splice(0,tableRows.length);
        var trCount = 0;

        var index = 1;
        
        if(sorter === "Time"){
            alarmsDB.sort(sort_by('TIMESTAMP',timeSort,function(ee){return ee.toUpperCase()}))
        }
        else if(sorter === "Source"){
            alarmsDB.sort(sort_by('REPID', sourceSort,function(ee){return ee.toUpperCase()}))
        }
        else if(sorter === "Attrib"){
            alarmsDB.sort(sort_by('ATTR', attribSort,function(ee){return ee.toUpperCase()}))
        }
        else if(sorter === "Tag"){
            alarmsDB.sort(sort_by('TAG', tagSort,function(ee){return ee.toUpperCase()}))
        }
        else if(sorter === "Description"){
            alarmsDB.sort(sort_by('DESCRIPTION', descriptionSort,function(ee){return ee.toUpperCase()}))
        }
        else if(sorter === "Severity"){
            alarmsDB.sort(sort_by('SEVERITY', severitySort,function(ee){return ee.toUpperCase()}))
        }
        else {
            alarmsDB.sort(sort_by('TIMESTAMP',1,function(ee){return ee.toUpperCase()}))
        }
        
        for(var i = 0; i < alarmsDB.length; i ++) {
            if(!filterStatusCritical){
               if((alarmsDB[i]['STATUS'] == 1) && 
                  (alarmsDB[i]['SEVERITY'] == 'Critical'))
                  continue;
            }
            if(!filterStatusMajor){
               if((alarmsDB[i]['STATUS'] == 1) && 
                  (alarmsDB[i]['SEVERITY'] == 'Major'))
                  continue;
            }
            if(!filterStatusMinor){
               if((alarmsDB[i]['STATUS'] == 1) && 
                  (alarmsDB[i]['SEVERITY'] == 'Minor'))
                  continue;
            }
            if(!filterStatusInfo){
               if((alarmsDB[i]['STATUS'] == 1) && 
                  (alarmsDB[i]['SEVERITY'] == 'Info'))
                  continue;
            }
            if(!filterStatusEvent){
               if(alarmsDB[i]['STATUS'] == 2)
                  continue;
            }
            if(!filterStatusClear){
               if(alarmsDB[i]['STATUS'] == 0)
                  continue;
            }
            if(filterSource != ""){
               if(filterSource.toUpperCase().indexOf(alarmsDB[i]['REPID'].toUpperCase()) == -1)
                    continue;
            }
            if(filterText != ""){
               if(alarmsDB[i]['DESCRIPTION'].toUpperCase().indexOf(filterText.toUpperCase()) == -1)
                  continue;
            }

            var severity_bg;
            
            if(alarmsDB[i]['SEVERITY'] == 'Critical') severity_bg = '#FF0000';
            if(alarmsDB[i]['SEVERITY'] == 'Major') severity_bg = '#FF8800';
            if(alarmsDB[i]['SEVERITY'] == 'Minor') severity_bg = '#FFFF00';
            if(alarmsDB[i]['SEVERITY'] == 'Info') severity_bg = '#FFFFFF';
            if(alarmsDB[i]['SEVERITY'] == 'Discard') continue;

            var row = $("<tr />");
            $( "#alarms-table" ).append( row );
            row.append($("<td>" + (index++) + "</td>"));
//            row.append($('<td style="background-color: ' + severity_bg + ';text-align:center"> <font style="color:black">' + alarmsDB[i]['SEVERITY'] + "</font></td>"));
            row.append($('<td><div style="border:1px solid #000;background-color: ' + severity_bg + ';text-align:center;margin:5px"> <font style="color:black">' + alarmsDB[i]['SEVERITY'] + "</font></div></td>"));
            row.append($("<td>" + alarmsDB[i]['TIMESTAMP'] + "</td>"));
            row.append($("<td>" + alarmsDB[i]['OPERATOR'] + "</td>"));
            row.append($("<td>" + alarmsDB[i]['ATTR'] + "</td>"));
            row.append($("<td>" + alarmsDB[i]['REPID'] + "</td>"));
            row.append($("<td>" + alarmsDB[i]['TAG'] + "</td>"));
            row.append($("<td>" + alarmsDB[i]['DESCRIPTION'] + "</td>"));

            tableRows[trCount] = row;
            tableRowIP[trCount] = alarmsDB[i]['IP'];
            
            if(selectedRowId != 0){
                if(i == (selectedRowId -1)){
                    row.toggleClass( "active" );
                    selectedRow = row;
                }
            }

            
            trCount++;
        }
        $('#alarms-table tr').click( function ( e ) {
            if($(this).context.rowIndex == 0)
                return;
            $('#login_button').removeClass('disabled');
            $('#zoom_button').removeClass('disabled');
            selectedIP = tableRowIP[e.currentTarget.rowIndex-1];
            $( this ).toggleClass( "active" );
            if(selectedRow != null){
                selectedRow.toggleClass( "active" );
            }
            selectedRow = $( this );
            selectedRowId = selectedRow.context.rowIndex;
        })
    }

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    function logdumpAlarm () {  
        getAlarms();
        hideAlarms();
        createAlarmsTable();
    }
    
    function raiseTestAlarm(){
        var command;
        if(USERNAME != 'sysadmin'){
			operatorName = OPERATOR.SysName;
            command = "alarms addoper " + operatorName + " TEST TEST TEST T Test Alarm.";
        }
        else{
            command = "alarms addoper - TEST TEST TEST T Test Alarm.";
        }

        api.exe({
            cmd: command,
            async: false,
            onSuccess: function (o) {
                axellPopUp("Test Alarm Raised.");
                setTimeout(function(){location.reload();},3000)
            }
        })
    }

    function clearTestAlarm(){
        var command;
        if(USERNAME != 'sysadmin'){
			operatorName = OPERATOR.SysName;
            command = "alarms removeoper " + operatorName + " TEST TEST TEST T";
        }
        else{
            command = "alarms removeoper - TEST TEST TEST T Test Alarm Cleared.";
        }
        
        api.exe({
            cmd: command,
            async: false,
            onSuccess: function (o) {
                axellPopUp("Test Alarm Cleared.");
                setTimeout(function(){location.reload();},3000)                
            }
        })
    }
    
    
    //this runs when the page is loaded and ready
    $( document ).ready( function (e) {
        sorter = "Time";
        document.getElementById("Source").onclick = function(e){
            sorter = "Source";
            sourceSort = (sourceSort == 1) ? 0 : 1;
            logdumpAlarm();
        }
          
        document.getElementById("Attrib").onclick = function(e){
            sorter = "Attrib";
            attribSort = (attribSort == 1) ? 0 : 1;
            logdumpAlarm();
        }
          
        document.getElementById("Tag").onclick = function(e){
            sorter = "Tag";
            tagSort = (tagSort == 1) ? 0 : 1;
            logdumpAlarm();
        }
          
        document.getElementById("Description").onclick = function(e){
            sorter = "Description";
            descriptionSort = (descriptionSort == 1) ? 0 : 1;
            logdumpAlarm();
        }
          
        document.getElementById("Severity").onclick = function(e){
            sorter = "Severity";
            severitySort = (severitySort == 1) ? 0 : 1;
            logdumpAlarm();
        }
          
        document.getElementById("Date and Time").onclick = function(e){
            sorter = "Time";
            timeSort = (timeSort == 1) ? 0 : 1;
            logdumpAlarm();
        }
          
        document.getElementById("filter_btn").onclick = function(e){
            $("#popup_filter_setting").dialog("open");
        }
        
        $('#popup_filter_setting').dialog({
            width : 400,
            height : 300,
            resizable : false,
            autoOpen : false,
            modal: true,
            title : "Filter Settings",
            buttons:{
                /*'Cancel': function () {
                  $(this).dialog('close');
                },*/
                'Filter' : function () {
                  filterSource = document.getElementById("filter_source").value;
                  filterText = document.getElementById("filter_text").value;
                  filterStatusCritical = document.getElementById("checkCritical").checked;
                  filterStatusMajor = document.getElementById("checkMajor").checked;
                  filterStatusMinor = document.getElementById("checkMinor").checked;
                  filterStatusInfo = document.getElementById("checkInfo").checked;
                  filterStatusEvent = document.getElementById("checkEvent").checked;
                  filterStatusClear = document.getElementById("checkClear").checked;
                  logdumpAlarm();
                  $(this).dialog('close');
                },
                'Clear All' : function () {
                  document.getElementById("filter_source").value = "";
                  document.getElementById("filter_text").value = "";
                  document.getElementById("checkCritical").checked = true;
                  document.getElementById("checkMajor").checked = true;
                  document.getElementById("checkMinor").checked = true;
                  document.getElementById("checkInfo").checked = true;
                  document.getElementById("checkEvent").checked = true;
                  document.getElementById("checkClear").checked = true;
                }
            }
        })

        $('#login_button').addClass('disabled');
        $('#zoom_button').addClass('disabled');
        if(USERACCESS !="superuser"){
            $('#raise_button').addClass('disabled');
            $('#clear_button').addClass('disabled');
            $('#clear_alarms_button').addClass('disabled');
        }

        $( '#raise_button' ).click(function() {
            raiseTestAlarm();
        })

        $( '#clear_button' ).click(function() {
            clearTestAlarm();
        })

        document.getElementById("clear_alarms_button").onclick = function(e){
            if((USERACCESS =="RW")||(USERACCESS =="superuser")){
                // confirm delete
                axellConfirm("info","Notice","Are you sure you want to permanently delete all alarms?", function () {
                    api.exe({
                        // delete command
                        cmd: "alarms clear",
                        onSuccess: function(){
                            logdumpAlarm();
                        }
                    })
                }, function () {
                    return;
                });
            }
        }

        document.getElementById("login_button").onclick = function(e){
            // should be more generic
            if(selectedIP === "10.0.0.1" || selectedIP === "10.0.0.2" ){
                window.location.href = '/target/status';
                return;
            }
            
            var split = selectedIP.split('.');
            var k = parseInt(split[2]);
            var s = parseInt(split[3]);
            var port = 10000 + ((k-2)*256) + s;
            window.open("http://" + window.location.hostname + ":" + port, "_blank");
        }

        document.getElementById("zoom_button").onclick = function(e){
			  operatorName = OPERATOR.SysName;
           api.exe({
               cmd: "topology -o " + operatorName + " --json",
               dataType: 'json',
               async: false,
               onSuccess: function (o) {
                   $.each(o.ajaxdata.nodes, function (i, top) {
                       if (top['ID'] == alarmsDB[selectedRowId-1]['REPID']){
                           window.open("/target/index.html?Node Type="+top['Node Type']+
                                                                "&ID="+top['ID']+
                                                                "&Status="+top['Status']+
                                                                "&Comm="+top['Comm']+
                                                                "&Tag="+top['Tag']+
                                                                "&Location="+top['Location']+
                                                                "&System="+top['System']+
                                                                "&Common="+top['Common']+
                                                                "&Target="+top['Target']+
                                                                "&IP="+top['IP'], "_blank");
                       }
                   })
               }
           })
        }
        

        document.getElementById("export_button").onclick = function (e) {
            axellConfirm("info","Notice","Do you want to download a .csv file describing the system alarms?", function () {
                var row;
                row = "Index,Severity,Date And Time,Operator,Attribute,Tag,Source,Description\n";

                for(var i = 0; i < tableRows.length; i ++) {
                    row+= (i + 1)  + "  ,";
                    row+= alarmsDB[i]['SEVERITY'] + ",";
                    row+= alarmsDB[i]['TIMESTAMP'] + ",";
                    row+= alarmsDB[i]['OPERATOR'] + ",";
                    row+= alarmsDB[i]['ATTR']  + ",";
                    row+= alarmsDB[i]['TAG']  + ",";
                    row+= alarmsDB[i]['REPID']  + ",";
                    row+= alarmsDB[i]['DESCRIPTION']  + "\n";
                }
                download("Alarms.csv",row);
            })
        }


        logdumpAlarm();

        setInterval( logdumpAlarm, CHECK_NEW_LOGS_INTERVAL );
    });
});
