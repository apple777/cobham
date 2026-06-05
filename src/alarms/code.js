require([ '/js/api.js' ], function ( api ) {
    //{{OPTIONS
    //** The interval to check for new logs
    var CHECK_NEW_LOGS_INTERVAL = 5000;
    
    var isSlave=false;
    var isMaster=false;
    
    var alarmsDB=[];
    var tableRows=[];
    var tableRowIP=[];
    var filterOptions=[];
    
    var sorter = "Source";
    var filter = "All";
    
    var timeSort = 1;
    var sourceSort = 1;
    var descriptionSort = 1;

    var selectedIP;
    var selectedRow;
    var selectedRowId;
    
    var sort_by = function(field, reverse, primer){
        var key = function (x) {return primer ? primer(x[field]) : x[field]};

        return function (a,b) {
            var A = key(a), B = key(b);
            return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1,1][+!!reverse];                  
        }
    }

    function getAlarms(){
        var command = "alarms logs --json";
        var length = alarmsDB.length;
        for(var x=0; x < length; x++){
            alarmsDB.pop();
        }
        
        api.exe({
            cmd: command,
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.logs, function (i, log) {
                    alarmsDB[i] = log;
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
        var filterOptionsList = document.getElementById('filter_colomn');
        var length = filterOptionsList.length;
        for(var x=0; x < length; x++){
            filterOptionsList[0] = null;
        }
        var optionsLength = filterOptions.length;
        for(var x=0; x < optionsLength; x++){
            filterOptions.pop();
        }
    }
    
    function createAlarmsTable() {
        tableRows.splice(0,tableRows.length);
        var trCount = 0;

        $("#filter_colomn").append("<option>All</option>");
        
        for(var i = 0; i < alarmsDB.length; i ++){
            var found = 0;
            for(var j =0; j < filterOptions.length; j ++){
                if(alarmsDB[i]['REPID'] === filterOptions[j]){
                    found = 1;
                }
            }
            if(!found){
                filterOptions[filterOptions.length] = alarmsDB[i]['REPID'];
                var option = $("<option>" + alarmsDB[i]['REPID'] + "</option>");
                $("#filter_colomn").append(option);
            }
        }

        if(sorter === "Time"){
            alarmsDB.sort(sort_by('TIMESTAMP',timeSort,function(ee){return ee.toUpperCase()}))
        }
        else if(sorter === "Source"){
            alarmsDB.sort(sort_by('REPID', sourceSort,function(ee){return ee.toUpperCase()}))
        }
        else if(sorter === "Description"){
            alarmsDB.sort(sort_by('DESCRIPTION', descriptionSort,function(ee){return ee.toUpperCase()}))
        }
        else {
            alarmsDB.sort(sort_by('TIMESTAMP',1,function(ee){return ee.toUpperCase()}))
        }
        
        for(var i = 0; i < alarmsDB.length; i ++) {
            if(filter != "All"){
                if(alarmsDB[i]['REPID'] != filter){
                    continue;
                }
            }
            var row = $("<tr />");
            $( "#alarms-table" ).append( row );
            row.append($("<td>" + (i+1) + "</td>"));
            row.append($("<td>" + alarmsDB[i]['REPID'] + "</td>"));
            row.append($("<td>" + alarmsDB[i]['DESCRIPTION'] + "</td>"));
            row.append($("<td>" + alarmsDB[i]['TIMESTAMP'] + "</td>"));

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
    
    //this runs when the page is loaded and ready
    $( document ).ready( function (e) {
        sorter = "";
        document.getElementById("Source").onclick = function(e){
            sorter = "Source";
            sourceSort = (sourceSort == 1) ? 0 : 1;
            logdumpAlarm();
        }
          
        document.getElementById("Description").onclick = function(e){
            sorter = "Description";
            descriptionSort = (descriptionSort == 1) ? 0 : 1;
            logdumpAlarm();
        }
          
        document.getElementById("Date and Time").onclick = function(e){
            sorter = "Time";
            timeSort = (timeSort == 1) ? 0 : 1;
            logdumpAlarm();
        }
          
        document.getElementById("alarms_filter").onclick = function(e){
            filter = document.getElementById("filter_colomn").value;
            logdumpAlarm();
        }
        
        $('#login_button').addClass('disabled');

        document.getElementById("login_button").onclick = function(e){
            // should be more generic 
            if(selectedIP === "10.0.0.1" || selectedIP === "10.0.0.2"){
                window.location.href = '/target/status';
                return;
            }
            
            var split = selectedIP.split('.');
            var s = parseInt(split[3]);
            var port = 10000 + s;
            window.open("http://" + window.location.hostname + ":" + port, "_blank");
        }

        document.getElementById("clear_button").onclick = function(e){
            // confirm delete
            axellConfirm("info","Notice","Are you sure you want to permanently delete all system logs?", function () {
                api.exe({
                    // delete command
                    cmd: "alarms logsclear",
                })
            }, function () {
                return;
            });
            logdumpAlarm();
        }

        
        document.getElementById("export_button").onclick = function (e) {
            axellConfirm("info","Notice","Do you want to download a .csv file describing the system logs?", function () {
                var row;
                row = "Index,Source,Description,Date And Time\n";

                for(var i = 0; i < tableRows.length; i ++) {
                    row+= i  + ",";
                    row+= alarmsDB[i]['REPID']  + ",";
                    row+= alarmsDB[i]['DESCRIPTION']  + ",";
                    row+= alarmsDB[i]['TIMESTAMP']  + "\n";
                }
                download("Logs.csv",row);
            })
        }


        logdumpAlarm();

        setInterval( logdumpAlarm, CHECK_NEW_LOGS_INTERVAL );
    });
});
