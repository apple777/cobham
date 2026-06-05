require([ '/js/api.js','/js/util.js' ], function ( api, util ) {
    
    var filtersDB=[];
    var filterOptions=[];
    
    var filter = "All";
    
    var selectedRow;
    var selectedRowId;

    var linesNum = 16;

    var bandIndex=0;
    var bandIndexPair=0;
    var dl_ul_shift;
    var bandsDB=[];    
    var freqStart, freqStop;

    var maxDlPower = 24;
    var maxUlPower = 27;

    var changed=[];
    var lineError = [];
    for (var x = 1; x <= linesNum; x++) lineError[x] = 0;

    var fc_name=[];
    var fc_start=[];
    var fc_stop=[];
    var fc_bw=[];

    var checkboxCounter=0;
    var bandsFilters = {};

    var isChanged = false;

    function setRFMute(set , band , value)
    {
        //console.log("dobr_pa_control " + set +  " " +band+" " + value);
        res = 0;
        api.exe({
            cmd: "dobr_pa_control " + set +  " " +band+" " + value,
            dataType: 'text',
            async: false,
            onSuccess: function (o)
            {
                var response = o.ajaxdata;
                //console.log("dobr_pa_control: ",o);
                function configMethodDisabled () {
                    $( '#disEnRFMute' ).prop( 'checked',false )        
                }
                //set all inputs on
                function configMethodEnabled () {
                    $( '#disEnRFMute' ).prop( 'checked',true ) 
                }

                function configMethod(response){
                    switch ( response ) {
                    case "disabled":
                        configMethodDisabled();
                        break;
                    case "enabled":
                        configMethodEnabled();
                        break;
                    default:
                        console.error("Invalid argument to configMethod(): "+response);
                    }
                }

                configMethod( response ==1 ? 'enabled' : 'disabled' );
            return  response;
            }
        })
    }

    function setImop(set , band , value)
    {
        //console.log("imop_control " + set +  " " +band+" " + value);
        res = 0;
        api.exe({
            cmd: "imop_control " + set +  " " +band+" " + value,
            dataType: 'text',
            async: false,
            onSuccess: function (o)
            {
                var response = o.ajaxdata;
                //console.log("dobr_pa_control: ",o);
                function configMethodDisabled () {
                    $( '#disEnIMOP' ).prop( 'checked',false )
                    //Oscillation Prevention toggle coloum imop
                    $( "input[id^=imopEnable_]" ).attr('disabled','disabled');
                }
                //set all inputs on
                function configMethodEnabled () {
                    $( '#disEnIMOP' ).prop( 'checked',true ) 
                    $( "input[id^=imopEnable_]" ).removeAttr('disabled');
                }

                function configMethod(response){
                    switch ( response ) {
                    case "disabled":
                        configMethodDisabled();
                        break;
                    case "enabled":
                        configMethodEnabled();
                        break;
                    default:
                        console.error("Invalid argument to configMethod(): "+response);
                    }
                }

                configMethod( response ==1 ? 'enabled' : 'disabled' );
            return  response;
            }
        })
    }
    function getFilters()
    {
            //console.log("before setTimeout",new Date());
            for(var x=0; x < bandsDB.length; x++)
                bandsDB.pop();
            
            api.exe({
                cmd: "dobrstatus --json",
                dataType: 'json',
                async: false,
                onSuccess: function (o)
                {
                    $( "#module-tabs" ).empty();
                    var ind = 0;
                    $.each(o.ajaxdata.Bands, function (i, band)
                    {
                        if (band.Band != "-")
                        {
                            bandsDB[ind] = band;
                            var tab = '<li id="bandmodule-'+ind+'" class="wizard-step">'+band.Band+'</li>';
                            if (ind == bandIndex)
                                tab = '<li id="bandmodule-'+ind+'" class="wizard-step highlighted">'+band.Band+'</li>';
                            $( "#module-tabs" ).append( tab );
                            ind++;
                        }
                    })
                    $( "li[id^=bandmodule-]" ).click( function (e)
                    {
                        bandIndex = parseInt(this.id.substring(11));
                        //console.log(bandIndex);
                        getFilters();
                        createFiltersTable();
                        makeBinds();
                
                        setRFMute("GET" , bandsDB[bandIndex].No , " " )
                        setImop("GET" , bandsDB[bandIndex].No , " " )

                    });
                }
            })

            api.exe({
                cmd: "bands --json",
                dataType: 'json',
                async: false,
                onSuccess: function (o)
                {
                    $.each(o.ajaxdata.bands, function (i, band)
                    {
                        if (band.Band == bandsDB[bandIndex].Band)
                        {
                            freqStart = parseFloat(band.LowerDL)/1000000;
                            freqStop = parseFloat(band.UpperDL)/1000000;
                            dl_ul_shift = parseFloat(band.Duplex)/1000000;
                            if (band.Band == "800") dl_ul_shift = -dl_ul_shift;
                        }
                    })
                }
            })
            
            for(var x=0; x < filtersDB.length; x++)
                filtersDB.pop();
            for(var x=1; x <= linesNum; x++)
                filtersDB[x] = {'filter number':"filter"+x, 'Enable':0, 'operator':'-', 'Tech':'-',
                    'DL_start_freq':''+freqStart, 'DL_end_freq':''+freqStop, 'DL_max_power':'-',
                    'DL_max_gain':'-', 'meas_DL_rssi':'-', 'power_delta':'-', 'gain_delta':'-', 'meas_DL_ch_gain':'-',
                    'meas_UL_ch_gain':'-', 'meas_DL_ch_power':'-', 'imop_Enable':0};

            if(bandIndex%2 == 0){
                bandIndexPair = bandIndex+1;
            }else{
                bandIndexPair = bandIndex-1;    
            }    
            //console.log(bandIndexPair);

            if(bandsDB[bandIndexPair] != undefined){

                api.exe({
                    cmd: "dobr_filters get "+bandsDB[bandIndexPair].No+" --json",
                    dataType: 'json',
                    async: false,
                    onSuccess: function (o)
                    {
                        $.each(o.ajaxdata['band'+bandsDB[bandIndexPair].Band], function (i, filter)
                        {
                            var ind = filter['filter number'].substring(6);
                            filtersDB[ind] = filter;
                        })
                    }
                })

                checkboxCounter = 0;
                for (var i = 1; i <= linesNum; i++) {
                    if(filtersDB[i]['Enable'] == "1"){
                        checkboxCounter++;
                    }
                }

            }else{
                checkboxCounter = 0;
            }

            //console.log("checkboxCounterPair: ", checkboxCounter);

            for(var x=0; x < filtersDB.length; x++)
                filtersDB.pop();
            for(var x=1; x <= linesNum; x++)
                filtersDB[x] = {'filter number':"filter"+x, 'Enable':0, 'operator':'-', 'Tech':'-',
                    'DL_start_freq':''+freqStart, 'DL_end_freq':''+freqStop, 'DL_max_power':'-',
                    'DL_max_gain':'-', 'meas_DL_rssi':'-', 'power_delta':'-', 'gain_delta':'-', 'meas_DL_ch_gain':'-',
                    'meas_UL_ch_gain':'-', 'meas_DL_ch_power':'-', 'imop_Enable':0};

            // duplicate this api 
            api.exe({
                cmd: "dobr_filters get "+bandsDB[bandIndex].No+" --json",
                dataType: 'json',
                async: false,
                onSuccess: function (o)
                {
                    $.each(o.ajaxdata['band'+bandsDB[bandIndex].Band], function (i, filter)
                    {
                        var ind = filter['filter number'].substring(6);
                        filtersDB[ind] = filter;
                    })
                }
            })

            api.exe({
                cmd: "filterdump libraries",
                dataType: 'text',
                async: false,
                onSuccess: function (o)
                {
                    var libraryList = o.ajaxdata.split("\n").map($.trim).filter(function(line) { return line != "" });
                    var i=0;
                    $.each(libraryList,function(i, library){
                        var lib = library.split(" ");
                        fc_name[i] = lib[6];
                        fc_start[i] = parseInt(lib[4]) / 1000;
                        fc_stop[i] = parseInt(lib[5]) / 1000;
                        //fc_bw[i] = (fc_stop[i] - fc_start[i]) / (parseInt(lib[3]) - 1);
                        i++;
                    })
                }
            })
            for(var i = 0; i < fc_name.length; i++)
            {
               api.exe({
                   cmd: "filterdump filters " + (i+1),
                   dataType: 'text',
                   async: false,
                   onSuccess: function (o)
                   {
                     fc_bw[i] = o.ajaxdata.split(" ");
                   }
               })
            }
            //console.log("after setTimeout",new Date());

    }

    function setFilter(i)
    {
        changed[i] = i;
    }

    function sendLine(i)
    {   
        var str = $( "#operator_"+i ).val();
        var txt = "dobr_filters set ";
        txt += bandsDB[bandIndex].No + " ";
        txt += i + " ";     
        txt += str + " ";   
        //console.log($( "#operator_"+i ).val()+"clean space "+i+" ");
        txt += ($( "#enabled_"+i ).prop('checked')?1:0) + " ";
        txt += filtersDB[i]['Tech'] + " ";
        txt += $( "#freq_start_"+i ).val() + " ";
        txt += $( "#freq_stop_"+i ).val() + " ";
        txt += $( "#max_power_dl_"+i ).val() + " ";
        txt += $( "#max_gain_dl_"+i ).val() + " ";
        txt += $( "#power_delta_"+i ).val() + " ";
        txt += $( "#gain_delta_"+i ).val() + " ";
        txt += ($( "#imopEnable_"+i ).prop('checked')?1:0) + " ";        
        //txt += 0;

        // validation for Operator name field before sending to backend
        if(str === "" || !util.validateSpace(str)){
            axellPopUp("Please fill in a valid operator name. Operator name should be 1-10 characters long and only contain [a-zA-Z0-9_], no space is allowed")
            //return;
        }else{
            api.exe({
                cmd: txt,
                dataType: 'json',
                async: false,
                onSuccess: function (o)
                {
                    if (o.ajaxdata['DOBR FILTER'][0].Status == 'ERROR')
                    {
                        alert("ERROR! "+o.ajaxdata['DOBR FILTER'][0].Info);
                        lineError[i] = 1;
                    }
                }
            })
        } 
        //console.log($( "#operator_"+i ).val()+" clean space "+i+" ");
    }

    function sendFilters()
    {
        // $.blockUI({ 
        //     fadeIn: 1000, 
        //     timeout:   2000, 
        //     onBlock: function() { 

                for (var x = 1; x <= linesNum; x++) lineError[x] = 0;
                for (var i = 0; i < changed.length; i++)
                {
                    if (changed[i] === undefined) continue;
                    if (!$( "#enabled_"+changed[i] ).prop('checked'))
                        sendLine(parseInt(changed[i]));
                }
                for (var i = 0; i < changed.length; i++)        
                {
                    if (changed[i] === undefined) continue;
                    if ($( "#enabled_"+changed[i] ).prop('checked'))
                        sendLine(parseInt(changed[i]));
                }
                
                for (var i = 0; i < changed.length; i++)
                {
                    if (changed[i] === undefined) continue;
                    if (!$( "#imopEnable_"+changed[i] ).prop('checked'))
                        sendLine(parseInt(changed[i]));
                }
                for (var i = 0; i < changed.length; i++)        
                {
                    if (changed[i] === undefined) continue;
                    if ($( "#imopEnable_"+changed[i] ).prop('checked'))
                        sendLine(parseInt(changed[i]));
                }

                if (changed.length > 0)
                {
                    getFilters();
                    createFiltersTable();
                    makeBinds();
                    changed.length = 0; 
                }
        //     } 
        // }); 
    }

    function createFiltersTable()
    {
        var txt;

        $( "#filters-table tbody" ).empty();
        acc = 0;
        for(var i = 1; i <= linesNum ; i++)
        {
            var row = $("<tr class='table_row filter"+i+"' />");
            var isDecimalStart = parseFloat(filtersDB[i]['DL_start_freq'])-dl_ul_shift;           
            var isDecimalEnd = parseFloat(filtersDB[i]['DL_end_freq'])-dl_ul_shift;

            $( "#filters-table" ).append( row );
            
            var dis = (filtersDB[i]['Enable'] == "1")?"":" disabled";
            dis = '';

            var bw = ((parseFloat(filtersDB[i]['DL_end_freq']) - parseFloat(filtersDB[i]['DL_start_freq']))*1000).toFixed(0);
            
            // Index
            var ind = filtersDB[i]['filter number'].substring(6);
            if (lineError[i] == 0)
                row.append($("<td align=center>" + i + "</td>"));
            else
                row.append($("<td align=center style='background-color:red;'>" + i + "</td>"));
            // Operator
            txt  = "<td align=center><input id='operator_";
            txt += i;
            txt +="' type=text size=12 value=";
            txt += filtersDB[i]['operator'];
            txt += " style='width:55px;'";
            txt += dis;
            txt += "></td>";
            row.append($(txt));

            
            //console.log(filtersDB[i]['operator'],"'filtersDB[i]['operator']'")


            // Enabled
            txt  = "<td align=center>";
            if (filtersDB[i]['Enable'] == "1")
                txt += '<input id="enabled_'+i+'" type=checkbox checked>';
            else
                txt += '<input id="enabled_'+i+'" type=checkbox>';
            txt += "</td>";
            row.append($(txt));

            // imop Enabled
            txt  = "<td align=center>";
            if (filtersDB[i]['imop_Enable'] == "1")
                txt += '<input id="imopEnable_'+i+'" type=checkbox checked>';
            else
                txt += '<input id="imopEnable_'+i+'" type=checkbox>';
            txt += "</td>";
            row.append($(txt));
                        
            // Bandwidth
            row.append($("<td align=center><div id=bw_"+i+">" + bw + " (" + filtersDB[i]['Tech'][0] + ")" + "</div></td>"));
            
            // Freq Start DL
            txt  = "<td align=center><input type=text id='freq_start_";
            txt += i;
            txt += "' size=12 value=";
            txt += filtersDB[i]['DL_start_freq'];
            txt += " style='width:55px;'";
            txt += dis;
            txt += "></td>";
            row.append($(txt));
            
            // Freq Stop DL
            txt  = "<td align=center><input type=text id='freq_stop_";
            txt += i;
            txt += "' size=12 value=";
            txt += filtersDB[i]['DL_end_freq'];
            txt += " style='width:55px;'";
            txt += dis;
            txt += "></td>";
            row.append($(txt));
            
            // Max Power DL
            txt  = "<td align=center><select id='max_power_dl_";
            txt += i;
            txt += "' style='width:45px;'";
            txt += dis;
            txt += ">";
            for (var j = 24; j >= 0; j--)
                if (j == parseInt(filtersDB[i]['DL_max_power']))
                    txt += '<option value="' + j + '" selected>' + j + '</option>';
                else
                    txt += '<option value="' + j + '">' + j + '</option>';
            txt += "</td>";
            row.append($(txt));
            
            // Max Gain DL
            txt  = "<td align=center><select id='max_gain_dl_";
            txt += i;
            txt += "' style='width:45px;'";
            txt += dis;
            txt += ">";
            for (var j = 73; j >= 48; j--)
                if (j == parseInt(filtersDB[i]['DL_max_gain']))
                    txt += '<option value="' + j + '" selected>' + j + '</option>';
                else
                    txt += '<option value="' + j + '">' + j + '</option>';
            txt += "</td>";
            row.append($(txt));
            
            // Meas RSSI DL
            row.append($("<td align=center id=DL_rssi_"+i+">" + filtersDB[i]['meas_DL_rssi'] + "</td>"));
            
            // Meas Gain DL
            row.append($("<td align=center id=DL_gain_"+i+">" + filtersDB[i]['meas_DL_ch_gain'] + "</td>"));
            
            // Meas Power DL
            row.append($("<td align=center id=DL_power_"+i+">" + filtersDB[i]['meas_DL_ch_power'] + "</td>"));
            
            // Freq Start UL
            if((isDecimalStart+"").indexOf(".") == -1){
                row.append($("<td align=center id=UL_freq_start_"+i+">" + isDecimalStart + "</td>"));    
            }else{
                row.append($("<td align=center id=UL_freq_start_"+i+">" + isDecimalStart.toFixed(3) + "</td>"));
            }
            
            // Freq Stop UL
            if((isDecimalEnd+"").indexOf(".") == -1){
                row.append($("<td align=center id=UL_freq_stop_"+i+">" + isDecimalEnd + "</td>"));    
            }else{
                row.append($("<td align=center id=UL_freq_stop_"+i+">" + isDecimalEnd.toFixed(3) + "</td>"));
            }

            // Power Delta
            txt  = "<td align=center><select id='power_delta_"
            txt += i;
            txt += "' style='width:45px;'";
            txt += dis;
            txt += ">";
            for (var j = 10; j >= -10; j--)
                if (j == parseInt(filtersDB[i]['power_delta']))
                    txt += '<option value="' + j + '" selected>' + j + '</option>';
                else
                    txt += '<option value="' + j + '">' + j + '</option>';
            txt += "</td>";
            row.append($(txt));

            // Gain Delta
            txt  = "<td align=center><select id='gain_delta_"
            txt += i;
            txt += "' style='width:45px;'";
            txt += dis;
            txt += ">";
            for (var j = 0; j >= -10; j--)
                if (j == parseInt(filtersDB[i]['gain_delta']))
                    txt += '<option value="' + j + '" selected>' + j + '</option>';
                else
                    txt += '<option value="' + j + '">' + j + '</option>';
            txt += "</td>";
            row.append($(txt));
                        
            // Meas Gain UL
            row.append($("<td align=center id=UL_gain_"+i+">" + filtersDB[i]['meas_UL_ch_gain'] + "</td>"));

        }
        createFreqBar();

        $("[id^=enabled_]").click(function(e){  
            var id = this.id;
            var sumDl = 0;
            var sumUl = 0;
            var enCounter = 0;
            for(var i = 1; i <= linesNum ; i++)
            {
               if (document.getElementById("enabled_"+i).checked)
               {
                  enCounter++;
                  if (parseInt($("#max_power_dl_"+i).val()) > 0){
                     sumDl += Math.pow(10,(parseInt($("#max_power_dl_"+i).val())/10));
                     if (parseInt($("#power_delta_"+i).val()) > 0){
                        sumUl += Math.pow(10,((parseInt($("#max_power_dl_"+i).val())+parseInt($("#power_delta_"+i).val()))/10));
                     }
                  }
               }
            }
            if (Math.floor(sumDl) > Math.pow(10,(maxDlPower/10)))
            {
               document.getElementById(id).checked = false;
               axellPopUp("The selected output power is too strong, please reconfigure.");
            }
            else if (Math.floor(sumUl) > Math.ceil(Math.pow(10,(maxUlPower/10))))
            {
               document.getElementById(id).checked = false;
               axellPopUp("The selected uplink power is too strong, please reconfigure.");
            }
            //checkboxCounter -new var 
            if (checkboxCounter + enCounter > 16)
            {
               document.getElementById(id).checked = false;
               axellPopUp("Max filters should be 16.");
            }
        })

        $("[id^=max_power_dl_]").change(function(e){    
            var id = this.id;
            id = id.slice(id.indexOf("_")+1);
            id = id.slice(id.indexOf("_")+1);
            id = id.slice(id.indexOf("_")+1);
            var sumDl = 0;
            var sumUl = 0;
            for(var i = 1; i <= linesNum ; i++)
            {
               if (document.getElementById("enabled_"+i).checked)
               {
                  if (parseInt($("#max_power_dl_"+i).val()) > 0){
                     sumDl += Math.pow(10,(parseInt($("#max_power_dl_"+i).val())/10));
                     if (parseInt($("#power_delta_"+i).val()) > 0){
                        sumUl += Math.pow(10,((parseInt($("#max_power_dl_"+i).val())+parseInt($("#power_delta_"+i).val()))/10));
                     }
                  }
               }
            }
            if (Math.floor(sumDl) > Math.pow(10,(maxDlPower/10)))
            {
               document.getElementById("enabled_"+id).checked = false;
               axellPopUp("The selected output power is too strong, please reconfigure.");
            }
            else if (Math.floor(sumUl) > Math.ceil(Math.pow(10,(maxUlPower/10))))
            {
               document.getElementById("enabled_"+id).checked = false;
               axellPopUp("The selected uplink power is too strong, please reconfigure.");
            }
        })

        $("[id^=power_delta_]").change(function(e){    
            var id = this.id;
            id = id.slice(id.indexOf("_")+1);
            id = id.slice(id.indexOf("_")+1);
            var sumDl = 0;
            var sumUl = 0;
            for(var i = 1; i <= linesNum ; i++)
            {
               if (document.getElementById("enabled_"+i).checked)
               {
                  if (parseInt($("#max_power_dl_"+i).val()) > 0){
                     sumDl += Math.pow(10,(parseInt($("#max_power_dl_"+i).val())/10));
                     if (parseInt($("#power_delta_"+i).val()) > 0){
                        sumUl += Math.pow(10,((parseInt($("#max_power_dl_"+i).val())+parseInt($("#power_delta_"+i).val()))/10));
                     }
                  }
               }
            }
            if (Math.floor(sumDl) > Math.pow(10,(maxDlPower/10)))
            {
               document.getElementById("enabled_"+id).checked = false;
               axellPopUp("The selected output power is too strong, please reconfigure.");
            }
            else if (Math.floor(sumUl) > Math.ceil(Math.pow(10,(maxUlPower/10))))
            {
               document.getElementById("enabled_"+id).checked = false;
               axellPopUp("The selected uplink power is too strong, please reconfigure.");
            }
        })
    }

    function createFreqBar()
    {
        var colorArr = ['#726E20','#419138','#FF7900','#165788','#00A8B4','#662D91','#00A4F2','#1E1E1E','#0000FF','#556B2F','#A52A2A','#9ACD32','#9932CC','#4169E1','#191970','#FF4500','#A52A2A','#483D8B','#800000','#B22222','#FFA500','#FF4500','#A52A2A','#C71585','#6495ED','#8B008B','#000080','#4682B4','#419138','#FF6347','#8B4513'];        var div;
        var barSize = 1372;
        $( "#sector-band-freq-indicator" ).empty();
        div = $("<div class='freq-indicator-range-min freq-indicator-range'>"+freqStart+"MHz</div>");
        $( "#sector-band-freq-indicator" ).append( div );
        div = $("<div class='freq-indicator-range-max freq-indicator-range'>"+freqStop+"MHz</div>");
        $( "#sector-band-freq-indicator" ).append( div );
        var c = barSize / (freqStop-freqStart);
        

        operTable=[];
        var acc = 0;
        for (var i = 1; i <= linesNum; i++)
            if (filtersDB[i]['Enable'] == "1")
            {
                var oper = filtersDB[i].operator;
                var color;
                if(operTable[oper] == null)
                {
                    operTable[oper] = colorArr[acc++];
                }
                    color = operTable[oper];
                var start = parseFloat(filtersDB[i]['DL_start_freq']);
                var stop = parseFloat(filtersDB[i]['DL_end_freq']);
                if ( start >= stop) continue;
                var totalWidth = ((stop - start) * c);
                div  = "<div class='avail-range-indicator-bar' style='left: ";
                div += (stop - start) * c;
                div += "px; width: ";
                div += (start - freqStart) * c;
                div += "px;' title='";
                div += "Filter: ";
                div += i;
                div += "\n";
                div += start;
                div += " MHz-";
                div += stop;
                div += " MHz'>";
                div += "<div class='freq-indicator-bar filter"+i+"' data-number='filter"+i+"' style='width: ";
                div += totalWidth;
                div += "px; left: ";
                div += (start - freqStart) * c;
                div += "px; height: 70px; background-color: "+color+"'>";
                if(totalWidth < 66){
                    div += "<span class='leftStart'></span><span class='rightStop'></span>";
                }else{
                    div += "<span title='"+start+" MHz' class='leftStart'>"+start+"</span><span title='"+stop+" MHz' class='rightStop'>"+stop+"</span>";
                }
                div += "</div></div>";
                //div += "px; height: 45px; background-color: #419138;'></div></div>";
                $( "#sector-band-freq-indicator" ).append( $(div) );
            }
    }

    function getFilterType(bw)
    {
        var types=[];
        bw = Math.round(bw);
        for (var i=0; !(fc_name[i]===undefined); i++)
        {
            var skipType = true;
            for (var j = 0; j < fc_bw[i].length; j++)
            {
               if (bw == (fc_bw[i][j] / 1000))
               {
                  skipType = false;
                  break;
               }
            }
            if (skipType) continue;
            if (bw < fc_start[i]) continue;
            if (bw > fc_stop[i]) continue;
            types.push(fc_name[i]);
        }
        return types;
    }

    function chooseFilter(index, bw, ftypes)
    {
        var txt = "<form id='fdlg'>";
        for (var i=0; i<ftypes.length; i++)
        {
            txt += "<input type='radio' name='fchoose' value='"+ftypes[i]+"'> "+ftypes[i]+"<br>";
        }
        txt += "</form>";
        if ($('#fdialog').length == 0)
        {
            $(document.body).append('<div id="fdialog">'+txt+'</div>');
        } else {
            $('#fdialog').html(txt);
        }
        $( "#fdialog" ).dialog({
            title: 'Please choose filter type:',
            modal: true,
            autoOpen: false,
            buttons: {
                "Select": function()
                {
                    var type = $("#fdlg input[type='radio']:checked").val();
                    $( "#bw_"+index ).text(bw + " (" + type[0] + ")");
                    filtersDB[index]['Tech'] = type;
                    $( this ).dialog( "close" );
                }
            }
        });
        $( "#fdialog" ).dialog("open");
    }

    function makeBinds()
    {

        //blockUI here for each band change

        $( "#apply-button" ).unbind();
        $( "#apply-button" ).click( function ()
        {
            $.blockUI({ 
                fadeIn: 1000, 
                timeout:   2000, 
                onBlock: function() { 
                    sendFilters();
                    if (isChanged){
                        setRFMute("SET" , bandsDB[bandIndex].No , document.getElementById("disEnRFMute").checked?1:0 )
                        setImop("SET" , bandsDB[bandIndex].No , document.getElementById("disEnIMOP").checked?1:0 )
                    }
                    setRFMute("GET" , bandsDB[bandIndex].No , " " )
                    setImop("GET" , bandsDB[bandIndex].No , " " )
                } 
            }); 
        });
        
        $( "#refresh-button" ).unbind();
        $( "#refresh-button" ).click( function ()
        {
            $.blockUI({ 
                fadeIn: 1000, 
                timeout:   2000, 
                onBlock: function() { 
                    for (var x = 1; x <= linesNum; x++) lineError[x] = 0;
                    getFilters();
                    createFiltersTable();
                    makeBinds();
                    setRFMute("GET" , bandsDB[bandIndex].No , " " )                    
                    setImop("GET" , bandsDB[bandIndex].No , " " )                    
                } 
            }); 
        });

        $( "#reload-button" ).unbind();
        $( "#reload-button" ).click( function ()
        {
           axellConfirm("info","Notice","Are you sure you want to reload RF settings? it will affect the RF coverage for few seconds", function () {
               $.blockUI({ 
                   fadeIn: 1000, 
                   timeout:   10000, 
                   onBlock: function() { 
                     api.exe({
                         cmd: "dobr_dingerd_kick "+(bandIndex+1),
                         dataType: 'text',
                         async: false,
                         onSuccess: function (o)
                         {
                         }
                     })
                   } 
               }); 
           })
        });

        $( "input[id^=operator_]" ).change( function (e)
        {
            console.log("this is for check : " ,this.value);

            setFilter(this.id.substring(9));
        });

        $( "input[id^=enabled_]" ).change( function (e)
        {
            var i = this.id.substring(8);
            //$( "#operator_"+i ).attr('disabled', !this.checked);
            //$( "#freq_start_"+i ).attr('disabled', !this.checked);
            //$( "#freq_stop_"+i ).attr('disabled', !this.checked);
            //$( "#max_power_dl_"+i ).attr('disabled', !this.checked);
            //$( "#power_delta_"+i ).attr('disabled', !this.checked);

            setFilter(this.id.substring(8));
        });

        $( "input[id^=imopEnable_]" ).change( function (e)
        {
            var i = this.id.substring(11);
            //$( "#operator_"+i ).attr('disabled', !this.checked);
            //$( "#freq_start_"+i ).attr('disabled', !this.checked);
            //$( "#freq_stop_"+i ).attr('disabled', !this.checked);
            //$( "#max_power_dl_"+i ).attr('disabled', !this.checked);
            //$( "#power_delta_"+i ).attr('disabled', !this.checked);

            setFilter(this.id.substring(11));
        });

        $( "input[id^=freq_start_]" ).change( function (e)
        {
            if (isNaN(parseFloat(this.value))) this.value = freqStart;
            if (this.value < freqStart) this.value = freqStart;
            if (this.value > freqStop) this.value = freqStop;

            var index = this.id.substring(11);
            var stop = $( "#freq_stop_"+index ).val();
            var bw = Math.round((parseFloat(stop) - parseFloat(this.value)) * 1000);
            var ftypes = getFilterType(bw);
            var type = '-';
            
            $( "#bw_"+index ).css('color', '');
            if (ftypes.length == 0)
                $( "#bw_"+index ).css('color', 'red');
            if (ftypes.length == 1)
            {
                type = ftypes[0];
                filtersDB[index]['Tech'] = type;
            }
            if (ftypes.length <= 1)
                $( "#bw_"+index ).text(bw + " (" + type[0] + ")");
            else
                chooseFilter(index, bw, ftypes);

            setFilter(index);
        });

        $( "input[id^=freq_stop_]" ).change( function (e)
        {
            if (isNaN(parseFloat(this.value))) this.value = freqStop;
            if (this.value < freqStart) this.value = freqStart;
            if (this.value > freqStop) this.value = freqStop;

            var index = this.id.substring(10);
            var start = $( "#freq_start_"+index ).val();
            var bw = Math.round((parseFloat(this.value) - parseFloat(start)) * 1000);
            var ftypes = getFilterType(bw);
            var type = '-';

            $( "#bw_"+index ).css('color', '');
            if (ftypes.length == 0)
                $( "#bw_"+index ).css('color', 'red');
            if (ftypes.length == 1)
            {
                type = ftypes[0];
                filtersDB[index]['Tech'] = type;
            }
            if (ftypes.length <= 1)
                $( "#bw_"+index ).text(bw + " (" + type[0] + ")");
            else
                chooseFilter(index, bw, ftypes);

            setFilter(index);
        });

        $( "select[id^=max_power_dl_]" ).change( function (e)
        {
            setFilter(this.id.substring(13));
        });
        
        $( "select[id^=max_gain_dl_]" ).change( function (e)
        {
            setFilter(this.id.substring(12));
        });
        
        $( "select[id^=power_delta_]" ).change( function (e)
        {
            setFilter(this.id.substring(12));
        });
        
        $( "select[id^=gain_delta_]" ).change( function (e)
        {
            setFilter(this.id.substring(11));
        });        
    }

    function setHoverEvents () {
        $( '.freq-indicator-bar').hover( function () {
            var number = $( this ).attr( 'data-number' );
            //var oper_key = $( this ).attr( 'data-number').substring(0,$( this ).attr( 'data-number').indexOf("_")-1);
            $( '.' +number).addClass( 'focused-row');
            //$( '#' + oper_key + '_legend').addClass( 'focused');
        }, function () {
            var number = $( this ).attr( 'data-number' );
            //var oper_key = $( this ).attr( 'data-number').substring(0,$( this ).attr( 'data-number').indexOf("_")-1);
            $( '.' +number).removeClass( 'focused-row');
            //$( '#' + oper_key + '_legend').removeClass( 'focused');
        });

        //revert highlight from table to bar
        $( '.table_row').hover( function () {
            var className = $( this ).attr( 'class');
            var number = className.substring(className.indexOf(" ")+1,className.length);
            //var oper_key = className.substring(className.indexOf(" ")+1,className.indexOf(" ")+2);
            $( '.freq-indicator-bar.' +number).addClass( 'focused');
            //$( '#' + oper_key + '_legend').addClass( 'focused');
        }, function () {
            var className = $( this ).attr( 'class');
            var number = className.substring(className.indexOf(" ")+1,className.length);
            //var oper_key = className.substring(className.indexOf(" ")+1,className.indexOf(" ")+2);
            $( '.freq-indicator-bar.' +number).removeClass( 'focused');
            //$( '#' + oper_key + '_legend').removeClass( 'focused');
        });
    }

    //this runs when the page is loaded and ready

    // check Transmission Enabled Changed
    $(document).on('click', '#disEnRFMute' , function() {
        isChanged = true;
    });
    $(document).on('click', '#disEnIMOP' , function() {
        isChanged = true;
    });

    $( document ).ready( function (e)
    {

        getFilters();
        createFiltersTable();
        makeBinds();
        setHoverEvents();
        setRFMute("GET" , bandsDB[bandIndex].No , " " );
        setImop("GET" , bandsDB[bandIndex].No , " " );

    });
});
