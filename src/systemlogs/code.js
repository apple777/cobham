require([ '/js/api.js' ], function ( api ) {
    //{{OPTIONS
    //** The interval to check for new logs
    var CHECK_NEW_LOGS_INTERVAL = 30000;
    var USERACCESS = $.cookie('userAccess');
    var isSlave=false;
    var isMaster=false;
    
    var alarmsDB=[];
    var tempAlarmsDB=[];
    var tableRows=[];
    var tableRowIP=[];
    var filterOptions=[];

    var logsDB=[];
    
    var sorter = "Source";
    var filterSource = "All";
    var filterText = "All";
    var filterStatusCritical = true;
    var filterStatusMajor = true;
    var filterStatusMinor = true;
    var filterStatusInfo = true;
    var filterStatusEvent = true;
    var filterStatusClear = true;
    
    var timeSort = 1;
    var sourceSort = 1;
    var descriptionSort = 1;
    var attribSort = 1;
    var tagSort = 1;

    var selectedIP;
    var selectedRow;
    var selectedRowId;
    
    var interval;
    
    var deviceSelfTag = "";
    var deviceSelfSer = "";
    
    var displayPage = 1;

    var serverPage = 0;
    var serverPageMax = 5;
    
    var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
    var OPERATOR = OPERATORLIST[0];
    var operatorName = OPERATOR.SysName;
    var USERNAME = $.cookie('username');

    
    var sort_by = function(field, reverse, primer){
        if(field=='TIMESTAMP'){
            var key = function (x) {
                var logTime = x.ID;
                var timeSplit = logTime.split("_");
                var sec, usec;
                if(timeSplit.length == 3){
                    sec = parseInt(timeSplit[1]);
                    usec = parseInt(timeSplit[2]);
                }
                else if(timeSplit.length == 4){
                    sec = parseInt(timeSplit[2]);
                    usec = parseInt(timeSplit[3]);
                }
                return ((sec % 1000000000) * 1000000) + usec;
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

    function copyPageAlarms(){

        var length = alarmsDB.length;
        for(var x=0; x < length; x++){
            alarmsDB.pop();
        }

        var max_log_num = (displayPage * 250 > tempAlarmsDB.length) ? tempAlarmsDB.length : displayPage * 250;
        var min_log_num = (displayPage - 1) * 250;

        var counter = 0;
        for(var x = min_log_num; x < max_log_num; x ++){
            alarmsDB[counter++] = tempAlarmsDB[x];
        }
    }

    function getAlarms(){

        var command;                
        
        length = tempAlarmsDB.length;
        for(var x=0; x < length; x++){
            tempAlarmsDB.pop();
        }
        
        var filterCritical = true;
        var filterMajor = true;
        var filterMinor = true;
        var filterInfo = true;
        var filterEvent = true;
        var filterClear = true;
        if(filterStatusCritical)
            filterCritical = 1;
        else
            filterCritical = 0;
        if(filterStatusMajor)
            filterMajor = 1;
        else
            filterMajor = 0;
        if(filterStatusMinor)
            filterMinor = 1;
        else
            filterMinor = 0;
        if(filterStatusInfo)
            filterInfo = 1;
        else
            filterInfo = 0;
        if(filterStatusEvent)
            filterEvent = 1;
        else
            filterEvent = 0;
        if(filterStatusClear)
            filterClear = 1;
        else
            filterClear = 0;

command = "alarms logs --json --page "+serverPage+" --filter "+filterCritical+" "+filterMajor+" "+filterMinor+" "+filterInfo+" "+filterEvent+" "+filterClear+" \""+filterSource+"\" \""+filterText+"\"";
        if(USERNAME != 'sysadmin')
            command += " --oper "+operatorName;
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
               $.each(o.ajaxdata.logs, function (i, log) {
                    tempAlarmsDB[i] = log;
               })
               for(var i = 0; i < tempAlarmsDB.length; i ++){
                  if(tempAlarmsDB[i].TAG == 'event'){
                      tempAlarmsDB[i].TAG = deviceSelfTag;
                      tempAlarmsDB[i].REPID = deviceSelfSer;
                  }
               }
        
               tempAlarmsDB.sort(sort_by('TIMESTAMP',0,function(ee){return ee.toUpperCase()}))        

               copyPageAlarms();

               if((tempAlarmsDB.length < 1000) || (USERNAME != 'sysadmin')){
                 $('#page_next').hide();
               }
               else{
                 $('#page_next').show();
               }
               if(tempAlarmsDB.length < 750){
                 $('#page_4_lo').hide();
               }
               else{
                 $('#page_4_lo').show();
               }
               if(tempAlarmsDB.length < 500){
                 $('#page_3_lo').hide();
               }
               else{
                 $('#page_3_lo').show();
               }
               if(tempAlarmsDB.length < 250){
                 $('#page_2_lo').hide();
               }
               else{
                 $('#page_2_lo').show();
               }
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
        var index = 0;
        
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
        else {
            alarmsDB.sort(sort_by('TIMESTAMP',0,function(ee){return ee.toUpperCase()}))
        }


        for(var i = 0 ; i < alarmsDB.length; i ++) {
            if(i >= alarmsDB.length){
                continue;
            }
            var row = $("<tr />");
            var fontColor = '';
            var indexNum = (index +1 + (displayPage-1)*250 + serverPage*1000);
            if(alarmsDB[i]['STATUS'] == 1){
                var severity_bg;
                if(alarmsDB[i]['SEVERITY'] == 'Critical') severity_bg = '#FF0000';
                else if(alarmsDB[i]['SEVERITY'] == 'Major') severity_bg = '#FF8800';
                else if(alarmsDB[i]['SEVERITY'] == 'Minor') severity_bg = '#FFFF00';
                else if(alarmsDB[i]['SEVERITY'] == 'Info') severity_bg = '#FFFFFF';
                else if(alarmsDB[i]['SEVERITY'] == 'Discard') continue;
                
                $( "#alarms-table" ).append( row );
                row.append($("<td>" + indexNum + "</td>"));
                index ++;
                row.append($('<td><div style="border:1px solid #000;background-color: ' + severity_bg + ';text-align:center;margin:5px"> <font style="color:black">' + alarmsDB[i]['SEVERITY'] + "</font></div></td>"));
            }

            else if(alarmsDB[i]['STATUS'] == 0){
                if(alarmsDB[i]['SEVERITY'] == 'Discard') continue;
                $( "#alarms-table" ).append( row );
                row.append($("<td>" + indexNum + "</td>"));
                index ++;
                row.append($('<td><div style="border:1px solid #000;background-color: #33FF88;text-align:center;margin:5px"> <font style="color:black">Clear</font></div></td>'));
            }

            else if(alarmsDB[i]['STATUS'] == 2){
                $( "#alarms-table" ).append( row );
                row.append($("<td>" + indexNum + "</td>"));
                index ++;
                row.append($('<td><div style="border:1px solid #000;background-color: #3388FF;text-align:center;margin:5px"> <font style="color:black">Event</font></div></td>'));
            }

            
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
        hideAlarms();
        getAlarms();
        createAlarmsTable();
    }
    
    function changePage(pageNum){
        displayPage = pageNum;
        $('#page_1_lo').removeClass('disabled');
        $('#page_2_lo').removeClass('disabled');
        $('#page_3_lo').removeClass('disabled');
        $('#page_4_lo').removeClass('disabled');

        $('#page_' + pageNum + '_lo').addClass('disabled');
    }
    
    $('#page_1_lo').click( function ( e ) {
        changePage(1);
        hideAlarms();
        copyPageAlarms();
        createAlarmsTable();
    })

    $('#page_2_lo').click( function ( e ) {
        changePage(2);
        hideAlarms();
        copyPageAlarms();
        createAlarmsTable();
    })

    $('#page_3_lo').click( function ( e ) {
        changePage(3);
        hideAlarms();
        copyPageAlarms();
        createAlarmsTable();
    })

    $('#page_4_lo').click( function ( e ) {
        changePage(4);
        hideAlarms();
        copyPageAlarms();
        createAlarmsTable();
    })

    $('#page_next').click( function ( e ) {
        serverPage++;
        /*if(serverPage == serverPageMax)
            serverPage = 0;*/
        for(var i = 1; i <= 4; i++)
            document.getElementById("page_"+i+"_lo").innerHTML = (serverPage*4)+i;
        changePage(1);
        logdumpAlarm();
    })

    
    //this runs when the page is loaded and ready
    $( document ).ready( function (e) {
        
        $('#page_1_lo').addClass('disabled');
        
        sorter = "";
        document.getElementById("Source").onclick = function(e){
            sorter = "Source";
            sourceSort = (sourceSort == 1) ? 0 : 1;
            hideAlarms();
            createAlarmsTable();
        }
          
        document.getElementById("Attrib").onclick = function(e){
            sorter = "Attrib";
            attribSort = (attribSort == 1) ? 0 : 1;
            hideAlarms();
            createAlarmsTable();
        }
          
        document.getElementById("Description").onclick = function(e){
            sorter = "Description";
            descriptionSort = (descriptionSort == 1) ? 0 : 1;
            hideAlarms();
            createAlarmsTable();
        }
          
        document.getElementById("Tag").onclick = function(e){
            sorter = "Tag";
            tagSort = (tagSort == 1) ? 0 : 1;
            hideAlarms();
            createAlarmsTable();
        }
          
        document.getElementById("Date and Time").onclick = function(e){
            sorter = "Time";
            timeSort = (timeSort == 1) ? 0 : 1;
            hideAlarms();
            createAlarmsTable();
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
                  if(filterSource == "")
                     filterSource = "All";
                  filterText = document.getElementById("filter_text").value;
                  if(filterText == "")
                     filterText = "All";
                  filterStatusCritical = document.getElementById("checkCritical").checked;
                  filterStatusMajor = document.getElementById("checkMajor").checked;
                  filterStatusMinor = document.getElementById("checkMinor").checked;
                  filterStatusInfo = document.getElementById("checkInfo").checked;
                  filterStatusEvent = document.getElementById("checkEvent").checked;
                  filterStatusClear = document.getElementById("checkClear").checked;
                  serverPage = 0;
                  for(var i = 1; i <= 4; i++)
                     document.getElementById("page_"+i+"_lo").innerHTML = (serverPage*4)+i;
                  changePage(1);
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

        document.getElementById("login_button").onclick = function(e){
            // should be more generic
            if(selectedIP === "10.0.0.1" || selectedIP === "10.0.0.2"){
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
        

        if((USERACCESS !="RW")&&(USERACCESS !="superuser")){
            $('#export_button').addClass('disabled');
        }
        if(USERACCESS !="superuser"){
            $('#clear_button').addClass('disabled');
        }


        document.getElementById("clear_button").onclick = function(e){
            if((USERACCESS =="RW")||(USERACCESS =="superuser")){
                // confirm delete
                axellConfirm("info","Notice","Are you sure you want to permanently delete all system logs?", function () {
                    api.exe({
                        // delete command
                        cmd: "alarms logsclear",
                        onSuccess: function(){
                           logdumpAlarm();
                        }
                    })
                }, function () {
                    return;
                });
            }
        }

        
        document.getElementById("export_button").onclick = function (e) {
            axellConfirm("info","Notice","Do you want to download a .csv file describing the system logs?", function () {
                var row;
                row = "Index,Status,Date And Time,Operator,Attribute,Source,Tag,Description\n";

                var command = "alarms logs --json";
                
                var length = logsDB.length;
                for(var x=0; x < length; x++){
                    logsDB.pop();
                }

                api.exe({
                    cmd: command,
                    dataType: 'json',
                    async: false,
                    onSuccess: function (o) {
                        $.each(o.ajaxdata.logs, function (i, log) {
                            logsDB[i] = log;
                        })
                
                        logsDB.sort(sort_by('TIMESTAMP',0,function(ee){return ee.toUpperCase()}))
                                                  
                        length = logsDB.length;
                        for(var i=0; i < length; i++){
                             row+= (i + 1)  + ",";
                             if(logsDB[i]['STATUS'] == 1){
                                 row+= logsDB[i]['SEVERITY'] + ",";    
                             }

                             else if(logsDB[i]['STATUS'] == 0){
                                 row+= "Clear,";    
                             }

                             else if(logsDB[i]['STATUS'] == 2){
                                 row+= "Event,";    
                             }
                             row+= logsDB[i]['TIMESTAMP']  + ",";
                             row+= logsDB[i]['OPERATOR'] + ",";
                             row+= logsDB[i]['ATTR']  + ",";
                             if(logsDB[i]['TAG'] == 'event'){
                                 logsDB[i]['TAG'] = deviceSelfTag;
                                 logsDB[i]['REPID'] = deviceSelfSer;
                             }
                             row+= logsDB[i]['REPID']  + ",";
                             row+= logsDB[i]['TAG']  + ",";
                             row+= logsDB[i]['DESCRIPTION']  + "\n";
                        }
                         
                        download("Logs.csv",row);
                    }
                })
            })
        }

        axshCall("get tag",function(selfTag,err){
            if(err){
                alert(err);
            }else{
                deviceSelfTag = selfTag;
                axshCall("get_serial",function(selfSer,err){
                    if(err){
                        alert(err);
                    }else{
                        deviceSelfSer = selfSer;
                        logdumpAlarm();

                        interval = setInterval( logdumpAlarm, CHECK_NEW_LOGS_INTERVAL );
                    }
                });
            }
        });

    });
});
