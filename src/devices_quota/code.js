require([ '/js/api.js','/js/convert.js','/js/util.js','/js/lib/jquery_cookie.js' ], function ( api, convert,util) {
    var OPERATORS = [];
    var TOPOLOGY = [];

    var FiltersQuota = [];
    
    var CPRIQuota = [];
    
    var maxFilterQuota = 64;
    var maxCPRIQuota = 100.0;
    var FilterIsChanged = false;
    
    var default_operator_rf_quotas = 0;
    var USERACCESS = $.cookie('userAccess');
    
    // sorting function
    var sort_by = function(field, reverse, primer){
        var key = function (x) {return primer ? primer(x[field]) : x[field]};

        return function (a,b) {
            var A = key(a), B = key(b);
            return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1,1][+!!reverse];                  
        }
    }

    
    // get system topology (without APOIs)
    function getTopology(){
        var command = "topology --json";
        api.exe({
            cmd: command, //'topology --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.nodes, function (i, top) {
                    if((top['Node Type'].indexOf("APOI") == -1) && (top['Node Type'].indexOf("MSDH") == -1))
                        TOPOLOGY.push(top);
              })
            }
        })
    }
    
    
    // get active operators
    function getOperators(){
        var command = "operators --json";
        api.exe({
            cmd: command, //'operators --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.operators, function (i, oper) {
                    OPERATORS.push(oper);
              })
            }
        })
    }
    
    
    // create device config header
    function createDeviceHeader(device_id){
        var device_header = "<tr id='" + device_id + "_header' class='default'>"
        device_header += "<td> </td>";
        for(var i=0; i < OPERATORS.length; i++ )
        {
            device_header += "<td><div class=''></div> <b>"+OPERATORS[i].FullName+"</b></td>";
        }
        device_header += "<td class='unused_rf_cap_cell'><div class='icon unused'></div><b>Unused</b></td>";
        device_header += "</tr>";
        return device_header;
    }
    
    
    // create device filters sliders
    function createDeviceFilters( device_id ){
        filter_slider_html = "<tr><td><b>Filter</b></td>";
        for (var i = 0; i < OPERATORS.length; i++) {
            var operator_name = OPERATORS[i].SysName;

            filter_slider_html += "<td><div id='default-filter-slider-" + device_id + '-' + operator_name + "' class='default-filter-slider' title=" + operator_name + "-" + device_id + "></div>" +
            "<input id='default-filter-input-" + device_id + '-' + operator_name + "' type='text' class='default-filter-input' /> [ 64 ]</td> ";
        }
        filter_slider_html += "<td id='unused_filter_cap_"+device_id+"'  class='unused_filter_cap_cell'></td></tr>";
        
        return filter_slider_html;
    }
    
    // create device CPRI sliders
    function createDeviceCPRI (device_id){
        cpri_slider_html = "<tr><td><b>CPRI</b></td>";
        for (var i = 0; i < OPERATORS.length; i++) {
            var operator_name = OPERATORS[i].SysName;
            cpri_slider_html += "<td><div id='default-cpri-slider-" + device_id + '-' + operator_name + "' class='default-cpri-slider' title=" + operator_name + "-" + device_id + "></div>" +
            "<input id='default-cpri-input-" + device_id + '-' + operator_name + "' type='text' class='default-cpri-input'/> [ % ]</td> ";
        }
        cpri_slider_html += "<td id='unused_cpri_cap_"+device_id+"'  class='unused_cpri_cap_cell'></td></tr>";

        return cpri_slider_html;

    }

    function updateFilters (){
        for (var j = 0; j < TOPOLOGY.length; j ++){
            var device_id = TOPOLOGY[j]['ID'];
            var allocatedCapability = 0;
            for (var i = 0; i < OPERATORS.length; i++) {
                var operator_name = OPERATORS[i].SysName;

                var filter_quota = getFilterQuotas(device_id, operator_name);

                $("#default-filter-slider-" + device_id+"-"+operator_name).slider('value', filter_quota);
                $("#default-filter-input-" + device_id+"-"+operator_name).val(filter_quota);
                allocatedCapability += parseFloat(filter_quota);

            }
            $("#unused_filter_cap_" + device_id).text(maxFilterQuota - allocatedCapability);            
        }
    }

    
    function updateCPRI (){
        for (var j = 0; j < TOPOLOGY.length; j ++){
            var device_id = TOPOLOGY[j]['ID'];
            var allocatedCapability = 0;
            for (var i = 0; i < OPERATORS.length; i++) {
                var operator_name = OPERATORS[i].SysName;

                var cpri_quota = getCPRIQuotas(device_id, operator_name);

                $("#default-cpri-slider-" + device_id+"-"+operator_name).slider('value', cpri_quota);
                $("#default-cpri-input-" + device_id+"-"+operator_name).val(cpri_quota);
                allocatedCapability += parseFloat(cpri_quota);

            }
            $("#unused_cpri_cap_" + device_id).text(maxCPRIQuota - allocatedCapability);            
        }
    }

    // minimize/maximize device sliders 
    $(document).off("click",'.icon.minmaxbutton')
        .on("click",'.icon.minmaxbutton',function(){
            var ID = $(this).parent().attr('id');
            if($(this).hasClass('maximize')){
                $('#'+ID+'_table').show();
                $(this).removeClass('maximize').addClass('minimize');
            }else{
                $('#'+ID+'_table').hide();
                $(this).addClass('maximize').removeClass('minimize');
        }
    })
    
    //click on filter
    $('input[name="devices_type"]:radio').on('change',function(){
        var device_types = $('input[name="devices_type"]:radio:checked').val();
        var command = "topology --json";
        api.exe({
            cmd: command, //'topology --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.nodes, function (i, top) {
                    if(top['Node Type'].indexOf("APOI") == -1){
                        if(device_types == 'All'){
                            $('#' + top['ID']).show();
                            $('#' + top['ID'] + '_button').removeClass('minimize').addClass('maximize');
                            $('#' + top['ID'] + '_table').hide();
                        }
                        else if(top['Node Type'].indexOf(device_types) == -1){
                            $('#' + top['ID']).hide();
                            $('#' + top['ID'] + '_table').hide();
                        }
                        else{
                            $('#' + top['ID']).show();
                            $('#' + top['ID'] + '_button').removeClass('minimize').addClass('maximize');
                            $('#' + top['ID'] + '_table').hide();
                        }
                    }
              })
            }
        })
        
    })
    
    function readFilterQuotas(operator){
        var command = "filter_quota -o " + operator + " ALLOCATED MTDI --json";
        api.exe({
            cmd: command, //'topology --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.FILTERQUOTA, function (i, quota) {
                    FiltersQuota.push({"Operator": operator, "Node": quota['Node'], "Quota": quota['Quota']});
//                    FiltersQuota[FiltersQuotaIndex++] = operator + "," + quota['Node'] + "," + quota['Quota'];
              })
            }
        })
        command = "filter_quota -o " + operator + " ALLOCATED RRU --json";
        api.exe({
            cmd: command, //'topology --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.FILTERQUOTA, function (i, quota) {
                    FiltersQuota.push({"Operator": operator, "Node": quota['Node'], "Quota": quota['Quota']});
//                    FiltersQuota[FiltersQuotaIndex++] = operator + "," + quota['Node'] + "," + quota['Quota'];
              })
            }
        })
        FiltersQuota = FiltersQuota.uniqueObjects();
    }
    
    function getFilterQuotas(device_id, operator){
        var filter_quota = _.findWhere(FiltersQuota,{Operator:operator, Node:device_id});
        if(filter_quota != null){
            return filter_quota.Quota;
        }
        return -1;
    }
        
    function readCPRIQuotas(operator){
        var command = "cpri_quota -o " + operator + " ALLOCATED MTDI --json";
        api.exe({
            cmd: command, //'topology --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.CPRIQUOTA, function (i, quota) {
                    CPRIQuota.push({"Operator": operator, "Node": quota['Node'], "Quota": quota['Quota']});
//                    CPRIQuota[CPRIQuotaIndex++] = operator + "," + quota['Node'] + "," + quota['Quota'];
              })
            }
        })
        command = "cpri_quota -o " + operator + " ALLOCATED RRU --json";
        api.exe({
            cmd: command, //'topology --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                $.each(o.ajaxdata.CPRIQUOTA, function (i, quota) {
                    CPRIQuota.push({"Operator": operator, "Node": quota['Node'], "Quota": quota['Quota']});
//                    CPRIQuota[CPRIQuotaIndex++] = operator + "," + quota['Node'] + "," + quota['Quota'];
              })
            }
        })
        CPRIQuota = CPRIQuota.uniqueObjects();
    }
    
    function getCPRIQuotas(device_id, operator){
        var cpri_quota = _.findWhere(CPRIQuota,{Operator:operator, Node:device_id});
        if(cpri_quota != null){
            return cpri_quota.Quota;
        }
        return -1;
    }
        

    function saveQuotas(device_id){
        var ret=false;
        for (var i = 0; i < OPERATORS.length; i++) {
            var operator_name = OPERATORS[i].SysName;
            
            var data = document.getElementById("default-filter-input-" + device_id+"-"+operator_name).value;
            var quota = getFilterQuotas(device_id, operator_name)
            if(parseInt(quota) > parseInt(data)){
            
                var command = "opset FILTERQUOTA " + operator_name + " " + device_id + " " + data;
                api.exe({
                    cmd: command, 
                    async: false,
                    onSuccess: function() { 
                        ret= true ; 
                        for(var j = 0; j < FiltersQuota.length; j ++){
                            if((FiltersQuota[j].Operator == operator_name) && (FiltersQuota[j].Node == device_id) && (FiltersQuota[j].Quota == quota)){
                                FiltersQuota[j].Quota = data;
                            }
                        }
                    },
                    onError:function(err){
                        axellPopUp(err.errorThrown);
                    },
                    onFailure: function() {
                        axellPopUp("Failed saving filter value for " + operator_name + " for device "+ device_id + " (" + data + ")");
                    }
                })
            }
        }
        for (var i = 0; i < OPERATORS.length; i++) {
            var operator_name = OPERATORS[i].SysName;
            
            var data = document.getElementById("default-cpri-input-" + device_id+"-"+operator_name).value;
            var quota = getCPRIQuotas(device_id, operator_name);
            if(parseInt(quota) > parseInt(data)){
            
                var command = "opset CPRIQUOTA " + operator_name + " " + device_id + " " + data;
                api.exe({
                    cmd: command, 
                    async: false,
                    onSuccess: function() { 
                        ret= true ; 
                        for(var j = 0; j < CPRIQuota.length; j ++){
                            if((CPRIQuota[j].Operator == operator_name) && (CPRIQuota[j].Node == device_id) && (CPRIQuota[j].Quota == quota)){
                                CPRIQuota[j].Quota = data;
                            }
                        }
                    },
                    onError:function(err){
                        axellPopUp(err.errorThrown);
                    },
                    onFailure: function() {
                        axellPopUp("Failed saving CPRI value for " + operator_name + " for device "+ device_id + " (" + data + ")");
                    }
                })
            }
        }
        
        FiltersQuota = FiltersQuota.uniqueObjects();
        CPRIQuota = CPRIQuota.uniqueObjects();
        
        for (var i = 0; i < OPERATORS.length; i++) {
            var operator_name = OPERATORS[i].SysName;
            
            var data = document.getElementById("default-filter-input-" + device_id+"-"+operator_name).value;
            var quota = getFilterQuotas(device_id, operator_name)
            
            if(parseInt(quota) < parseInt(data)){
            
                var command = "opset FILTERQUOTA " + operator_name + " " + device_id + " " + data;
                api.exe({
                    cmd: command, 
                    async: false,
                    onSuccess: function() { 
                        ret= true ; 
                        for(var j = 0; j < FiltersQuota.length; j ++){
                            if((FiltersQuota[j].Operator == operator_name) && (FiltersQuota[j].Node == device_id) && (FiltersQuota[j].Quota == quota)){
                                FiltersQuota[j].Quota = data;
                            }
                        }
                    },
                    onError:function(err){
                        axellPopUp(err.errorThrown);
                    },
                    onFailure: function() {
                        axellPopUp("Failed saving filter value for " + operator_name + " for device "+ device_id + " (" + data + ")");
                    }
                })
            }
        }
        for (var i = 0; i < OPERATORS.length; i++) {
            var operator_name = OPERATORS[i].SysName;
            
            var data = document.getElementById("default-cpri-input-" + device_id+"-"+operator_name).value;
            var quota = getCPRIQuotas(device_id, operator_name);
            if(parseInt(quota) < parseInt(data)){
            
                var command = "opset CPRIQUOTA " + operator_name + " " + device_id + " " + data;
                api.exe({
                    cmd: command, 
                    async: false,
                    onSuccess: function() { 
                        ret= true ; 
                        for(var j = 0; j < CPRIQuota.length; j ++){
                            if((CPRIQuota[j].Operator == operator_name) && (CPRIQuota[j].Node == device_id) && (CPRIQuota[j].Quota == quota)){
                                CPRIQuota[j].Quota = data;
                            }
                        }
                    },
                    onError:function(err){
                        axellPopUp(err.errorThrown);
                    },
                    onFailure: function() {
                        axellPopUp("Failed saving CPRI value for " + operator_name + " for device "+ device_id + " (" + data + ")");
                    }
                })
            }
        }
        
        FiltersQuota = FiltersQuota.uniqueObjects();
        CPRIQuota = CPRIQuota.uniqueObjects();
        
        return ret;
    }
    
    $(document).ready(function() {
        //disable button save change
        $('#save-button').addClass('disabled');

        getTopology();
        getOperators();
        
        $('#filter').find("input[value='All']").prop('checked',true);
        
        TOPOLOGY.sort(sort_by('Node Type',1,function(ee){return ee.toUpperCase()}))
        
        for(var device_num = 0; device_num < TOPOLOGY.length; device_num ++){
            
            var device_id = TOPOLOGY[device_num]['ID'];

            var dev_section = '<div id ="' + device_id + '" class ="table_header"><div id="'+ device_id +'_button" class="icon minmaxbutton maximize"></div>' + device_id + ' (' + TOPOLOGY[device_num]['Node Type']+').     Tag: ' + TOPOLOGY[device_num]['Tag'] + '.     Location: ' + TOPOLOGY[device_num]['Location'] +'.     IP: ' + TOPOLOGY[device_num]['IP'] +'</div>';

            dev_section += '<table id="' + device_id +'_table" class="type1">'
            device_config = dev_section;
            device_config += createDeviceHeader(device_id);
            device_config += createDeviceFilters(device_id);
            device_config += createDeviceCPRI(device_id);
            device_config += '</table>';
            
            $('#devices_contents').append(device_config);
            $('#' + device_id + '_table').hide();
            
        }
            $('.default-filter-slider').slider({
                range: "min",
                min: 0,
                step:1,
                max: maxFilterQuota,
                slide: function (event, ui) {
                    FilterIsChanged = true;
                    if((USERACCESS ==="RW")||(USERACCESS ==="superuser")){
                        $('#save-button').removeClass('disabled');
                    }                    
                    var allocatedCap = 0;
                    $.each($(this).closest('tr').find('.ui-slider').not(this), function () {
                        allocatedCap += $(this).slider('value');
                    })
                    allocatedCap += ui.value;
                    if (allocatedCap > maxFilterQuota) {
                        allocatedCap = maxFilterQuota;
                        return false;
                    } else {
                        var cont = $(this).parent().find('.default-filter-input-').context.title;
                        $(this).parent().find('.default-filter-input').val(ui.value);
                        $(this).closest('tr').find('.unused_filter_cap_cell').text((maxFilterQuota - allocatedCap).toFixed(1));
                    }
                }
            })
        
            $('.default-cpri-slider').slider({
                range: "min",
                min: 0,
                step:1,
                max: maxCPRIQuota,
                slide: function (event, ui) {
                    FilterIsChanged = true;
                    if((USERACCESS ==="RW")||(USERACCESS ==="superuser")){
                        $('#save-button').removeClass('disabled');
                    }
                    var allocatedCap = 0;
                    $.each($(this).closest('tr').find('.ui-slider').not(this), function () {
                        allocatedCap += $(this).slider('value');
                    })
                    allocatedCap += ui.value;
                    if (allocatedCap > maxCPRIQuota) {
                        allocatedCap = maxCPRIQuota;
                        return false;
                    } else {
                        var cont = $(this).parent().find('.default-cpri-input-').context.title;
                        $(this).parent().find('.default-cpri-input').val(ui.value);
                        $(this).closest('tr').find('.unused_cpri_cap_cell').text(maxCPRIQuota - allocatedCap);
                    }
                }
            })
            
            
            
            $('.default-filter-input').focus(function(){ prevRFInput = $(this).val(); }).change(function(){
                if($.isNumeric($(this).val())) {
                    RFIsChanged = true;
                    if((USERACCESS ==="RW")||(USERACCESS ==="superuser")){
                        $('#save-button').removeClass('disabled');
                    }
                    var allocatedCap = 0;
                    $.each($(this).closest('tr').find('.ui-slider').not($(this).closest('td').find('.ui-slider')), function () {
                        allocatedCap += Number($(this).slider('value'));
                    })

                    var input_value;
                    //if allocated more than total 64, alert
                    if (Number($(this).val()) === parseInt($(this).val())) {
                        input_value = parseInt($(this).val());
                    } else {
                        axellPopUp("Please fill in integer number for filter quota");
                        var float_value = parseFloat($(this).val());
                        input_value = Math.floor(float_value);
                    }

                    if ((maxFilterQuota - allocatedCap) < input_value) {
                        axellPopUp('Please enter valid filter capacity.');
                        $(this).closest('td').find('.ui-slider').slider('value', (maxFilterQuota - allocatedCap).toFixed(1));
                        $(this).val((maxFilterQuota - allocatedCap).toFixed(1));
                        $(this).closest('td').find('.default-filter-input').val(maxFilterQuota - allocatedCap);
                        $(this).closest('tr').find('.unused_filter_cap_cell').text("0");
                    } else {
                        $(this).closest('td').find('.ui-slider').slider('value', (input_value));
                        allocatedCap += Number(input_value);
                        $(this).closest('td').find('.default-filter-input').val(input_value);
                        $(this).closest('tr').find('.unused_filter_cap_cell').text((maxFilterQuota - allocatedCap).toFixed(1));
                    }

                }else{
                    $(this).val(prevRFInput);
                    axellPopUp("Please fill in a valid number for Filter quota");
                }
            })

            $('.default-cpri-input').focus(function(){ prevCPRIInput = $(this).val(); }).change(function(){
                if($.isNumeric($(this).val())) {
                    CPRIIsChanged = true;
                    if((USERACCESS ==="RW")||(USERACCESS ==="superuser")){
                        $('#save-button').removeClass('disabled');    
                    }
                    var allocatedCap = 0;
                    $.each($(this).closest('tr').find('.ui-slider').not($(this).closest('td').find('.ui-slider')), function () {
                        allocatedCap += Number($(this).slider('value'));
                    })
                    //
                    //if allocated more than total 100%, alert
                    if ((maxCPRIQuota - allocatedCap) < $(this).val()) {
                        axellPopUp('Please enter valid capacity in percentage');
                        $(this).closest('td').find('.ui-slider').slider('value', (maxCPRIQuota - allocatedCap).toFixed(1));
                        $(this).val((maxCPRIQuota - allocatedCap).toFixed(1));
                        $(this).closest('tr').find('.unused_cpri_cap_cell').text("0");
                    } else {
                        $(this).closest('td').find('.ui-slider').slider('value', ($(this).val()));
                        allocatedCap += Number($(this).val());
                        $(this).closest('tr').find('.unused_cpri_cap_cell').text((maxCPRIQuota - allocatedCap).toFixed(1));
                    }
                }else{
                    $(this).val(prevCPRIInput);
                    axellPopUp("Please fill in a valid number for CPRI quota");
                }
            })

            $('#save-button').click(function(){
                if(!$(this).hasClass('disabled')) {
                    var acc=false;
                    for(var device_num = 0; device_num < TOPOLOGY.length; device_num ++){

                        var device_id = TOPOLOGY[device_num]['ID'];
                        acc = saveQuotas(device_id);
                    }
                    if(acc == true){
                        for(var i=0; i < OPERATORS.length; i++ )
                        {
                            readFilterQuotas(OPERATORS[i].FullName);
                            readCPRIQuotas(OPERATORS[i].FullName);
                        }
                    }
                }
                $('#save-button').addClass('disabled');                
            })
            
            for(var i=0; i < OPERATORS.length; i++ )
            {
                readFilterQuotas(OPERATORS[i].FullName);
                readCPRIQuotas(OPERATORS[i].FullName);
            }


            
            updateFilters();
            updateCPRI();
        
        
    });
});
