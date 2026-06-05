require([ '/js/api.js','/js/lib/jquery.js','/js/lib/jquery-ui.js'], function ( api,$ ) {

    var USERACCESS = $.cookie('userAccess');
    var MAX_OPERATORS = $.parseJSON($.cookie('operatorCook')).length;
    var REGION = localStorage.operatorRegion;
    var operator_list = $.parseJSON($.cookie('operatorCook'));
    var filter_quota_list = [];
    var topology_list = [];
    var default_operator_filter_quotas = [];
    var filter_quotas_rru = [];
    var filter_quotas_mtdi = [];
    var default_operator_cpri_quotas = [];
    var cpri_quotas_rru = [];
    var cpri_quotas_mtdi = [];
    var default_operator_rf_quotas = [];
    var bandList = [];
    var bandsList;
    var rf_quotas_rru = [];
    var rf_quotas_mtdi = [];
    var maxRFQuota = 100.0;
    var maxFilterQuota = 64;
    var maxCPRIQuota = 100.0;
    var filterIsChanged = false;
    var CPRIIsChanged = false;
    var RFIsChanged = false;
    var foundActiveProfile = false;


    function getFilterQuotaList() {
        //highlight wizard steps
        $('.wizard-step').removeClass('highlighted');
        $('#wizard-filtering').addClass('highlighted');
        topology_list = [];
        default_operator_filter_quotas = [];
        filter_quotas_rru = [];
        filter_quotas_mtdi = [];
        filter_quota_nodes = [];
        var topology_command = '';
        var default_quotas_cmd = '';
        var filter_quotas_rru_cmd = '';
        var filter_quotas_mtdi_cmd = '';
        for (var i = 0; i < operator_list.length; i++) {
            topology_command = 'topology -o ' + operator_list[0].SysName + ' --json';
            default_quotas_cmd += 'opset filterquota ' + operator_list[i].SysName + ' default';
            filter_quotas_rru_cmd += 'filterquota -o "' + operator_list[i].SysName + '" ALLOCATED RRU --json';
            filter_quotas_mtdi_cmd += 'filterquota -o "' + operator_list[i].SysName + '" ALLOCATED MTDI --json';
            if (i != operator_list.length - 1) {
                topology_command += " & ";
                default_quotas_cmd += " & ";
                filter_quotas_rru_cmd += " & ";
                filter_quotas_mtdi_cmd += " & ";
            }
        }
        api.exe({
            cmd: default_quotas_cmd,
            dataType: 'text',
            async: true,
            onSuccess: function (z) {
                var objects = z.ajaxdata.split('\n');
                for (var j = 0; j < objects.length; j++) {
                    if (objects[j].indexOf("quota") >= 0) {
                        var split_str = objects[j].split(' ');
                        var def_quota = parseInt(split_str[split_str.length - 1]);
                        default_operator_filter_quotas.push(def_quota);
                    }
                }
                api.exe({
                    cmd: topology_command,
                    dataType: 'text',
                    async: true,
                    onSuccess: function (k) {
                        var objects = k.ajaxdata.split('\n');
                        for (var j = 0; j < objects.length; j++) {
                            if (objects[j].indexOf("nodes") >= 0) {
                                var operator_nodes = JSON.parse(objects[j]);
                                var operator_nodes_rru_mtdi = _.filter(operator_nodes.nodes, function (num) {
                                    if (num['Node Type'].match("^RRU") || (num['Node Type'].match("^MTDI"))) {
                                        return num;
                                    }
                                    return null;
                                });
                                topology_list.push(operator_nodes_rru_mtdi);

                            }
                        }

                        api.exe({
                            cmd: filter_quotas_rru_cmd,
                            dataType: 'text',
                            async: true,
                            onSuccess: function (u) {
                                var objy = u.ajaxdata.split('\n');
                                var r = 0;
                                for (r = 0; r < objy.length; r++) {
                                    if (objy[r].indexOf("FILTERQUOTA") >= 0) {
                                        var new_obj = JSON.parse(objy[r]);
                                        filter_quotas_rru.push(new_obj);
                                    }
                                }
                                api.exe({
                                    cmd: filter_quotas_mtdi_cmd,
                                    dataType: 'text',
                                    async: true,
                                    onSuccess: function (g) {
                                        var objy = g.ajaxdata.split('\n');
                                        var r = 0;
                                        for (r = 0; r < objy.length; r++) {
                                            if (objy[r].indexOf("FILTERQUOTA") >= 0) {
                                                var new_obj = JSON.parse(objy[r]);
                                                filter_quotas_mtdi.push(new_obj);
                                            }
                                        }

                                        GenerateOperatorAllocationHeaders();
                                        GenerateOperatorAllocations();
                                        //not showing exceptions for now, waiting till the quota cmd is updated and become smarter
                                        //GenerateException();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    function getCPRIQuotaList() {
        //highlight wizard steps
        $('.wizard-step').removeClass('highlighted');
        $('#wizard-CPRI').addClass('highlighted');
        $('#wizard-end').addClass('highlighted');
        topology_list = [];
        default_operator_cpri_quotas = [];
        cpri_quotas_rru = [];
        cpri_quotas_mtdi = [];
        var topology_command = '';
        var default_cpri_quotas_cmd = '';
        var cpri_quotas_rru_cmd = '';
        var cpri_quotas_mtdi_cmd = '';
        for (var i = 0; i < operator_list.length; i++) {
            topology_command += 'topology -o ' + operator_list[i].SysName + ' --json';
            default_cpri_quotas_cmd += 'opset cpriquota ' + operator_list[i].SysName + ' default';
            cpri_quotas_rru_cmd += 'cpriquota -o ' + operator_list[i].SysName + ' ALLOCATED RRU --json';
            cpri_quotas_mtdi_cmd += 'cpriquota -o ' + operator_list[i].SysName + ' ALLOCATED MTDI --json';
            if (i != operator_list.length - 1) {
                topology_command += " & ";
                default_cpri_quotas_cmd += " & ";
                cpri_quotas_rru_cmd += " & ";
                cpri_quotas_mtdi_cmd += " & ";
            }
        }
        api.exe({
            cmd: default_cpri_quotas_cmd,
            dataType: 'text',
            async: true,
            onSuccess: function (z) {
                var objects = z.ajaxdata.split('\n');
                for (var j = 0; j < objects.length; j++) {
                    if (objects[j].indexOf("quota") >= 0) {
                        var split_str = objects[j].split(' ');
                        var def_quota = parseFloat(split_str[split_str.length - 1]);
                        default_operator_cpri_quotas.push(def_quota);
                    }
                }
                api.exe({
                    cmd: topology_command,
                    dataType: 'text',
                    onSuccess: function (k) {
                        var objects = k.ajaxdata.split('\n');
                        for (var j = 0; j < objects.length; j++) {
                            if (objects[j].indexOf("nodes") >= 0) {
                                var operator_nodes = JSON.parse(objects[j]);
                                var operator_nodes_rru_mtdi = _.filter(operator_nodes.nodes, function (num) {
                                    if (num['Node Type'].match("^RRU") || (num['Node Type'].match("^MTDI"))) {
                                        return num;
                                    }
                                    return null;
                                });
                                topology_list.push(operator_nodes_rru_mtdi);

                            }
                        }

                        api.exe({
                            cmd: cpri_quotas_rru_cmd,
                            dataType: 'text',
                            onSuccess: function (u) {
                                var objy = u.ajaxdata.split('\n');
                                var r = 0;
                                for (r = 0; r < objy.length; r++) {
                                    if (objy[r].indexOf("CPRIQUOTA") >= 0) {
                                        var new_obj = JSON.parse(objy[r]);
                                        cpri_quotas_rru.push(new_obj);
                                    }
                                }
                                api.exe({
                                    cmd: cpri_quotas_mtdi_cmd,
                                    dataType: 'text',
                                    onSuccess: function (g) {
                                        var objy = g.ajaxdata.split('\n');
                                        var r = 0;
                                        for (r = 0; r < objy.length; r++) {
                                            if (objy[r].indexOf("CPRIQUOTA") >= 0) {
                                                var new_obj = JSON.parse(objy[r]);
                                                cpri_quotas_mtdi.push(new_obj);
                                            }
                                        }
                                        //clear the table before appending data
                                        GenerateCPRIOperatorAllocationHeaders();
                                        GenerateCPRIOperatorAllocations();

                                        //not showing exceptions for now, waiting till the quota cmd is updated and become smarter
                                        //GenerateCPRIException();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    //RF level quota
    function getRFQuotaList() {
        //highlight wizard steps
        $('.wizard-step').removeClass('highlighted');
        $('#wizard-power').addClass('highlighted');
        //$('body').text('highlighted');
        console.log("get rf")
        topology_list = [];
        default_operator_rf_quotas = [];
        rf_quotas_rru = [];
        rf_quotas_mtdi = [];
        rf_quota_nodes = [];
        bandList = [];
        var topology_command = '';
        var default_rf_quotas_cmd = '';
        //find out which band an operator have
        //check in sector list

        api.exe({
            cmd: 'bands --json',
            dataType: 'json',
            async: false,
            onSuccess: function (o) {
                bandsList = o.ajaxdata.bands;
                $.each(o.ajaxdata.bands, function (i, band) {
                    bandList.push(band.Band);
                })
                $.each(operator_list, function (i, operator) {
                    //topology_command = 'topology -o ' + operator.SysName + ' --json';
                    $.each(bandList, function (j, band) {
                        default_rf_quotas_cmd += 'opset rfquota ' + operator.SysName +' default'+ ' ' + band;
                        if (i != operator_list.length - 1 && j === bandList.length - 1) {
                            default_rf_quotas_cmd += " & ";
                        }else if (i != operator_list.length - 1 && j != bandList.length - 1) {
                            default_rf_quotas_cmd += " & ";
                        }else if (i === operator_list.length - 1 && j != bandList.length - 1) {
                            default_rf_quotas_cmd += " & ";
                        }
                    })
                    if (i != operator_list.length - 1) {
                        topology_command += " & ";
                    }
                })
            },
            onError:function (err) {
                axellPopUp(err.errorThrown);
            }
        })
        api.exe({
            cmd: default_rf_quotas_cmd,
            dataType: 'text',
            async: false,
            onSuccess: function (z) {
                var objects = z.ajaxdata.split('\n');
                for (var j = 0; j < objects.length; j++) {
                    if (objects[j].indexOf("quota") >= 0) {
                        var split_str = objects[j].split(' ');
                        var regEx = new RegExp();
                        var def_quota = objects[j].match(/\d+\.\d{0,2}/);
                        default_operator_rf_quotas.push(Number(def_quota));
                    }
                }
                //console.log(default_operator_rf_quotas)
                GenerateRFOperatorAllocationHeaders();
                GenerateRFOperatorAllocations($('input[name="regions"]:radio:checked').val());

            },
            onError:function (err) {
                axellPopUp(err.errorThrown);
            }
        });
    }

    $(document).ready(function() {
        if (!localStorage.operatorRegion){
            //after logout and login setItem
            localStorage.operatorRegion = "AMER";
        }        
        // localStorage.operatorRegion getItem for render checkbox
        $('#filter').find("input[value='"+localStorage.operatorRegion+"']").prop('checked',true);
        console.log(document.referrer);
        if(document.referrer.indexOf('useradmin') !=-1){
            $('#back_to_useradmin').show();
        }
        //check if there is any profiles running
        var cmd ="";
        $.each(operator_list,function(i, operator){
            if(i < operator_list.length -1) {
                cmd += "RFROUTE -o "+operator.SysName+" PROFILES --json & ";
            }else{
                cmd += "RFROUTE -o "+operator.SysName+" PROFILES --json";
            }
        })
        api.exe({
            cmd:cmd,
            async:false,
            onSuccess:function(o){
                var profileList = o.ajaxdata.split("\n");
                profileList.pop();
                //in case there is error from parsing json value, set foundActiveProfile to false
                try{
                    $.each(profileList,function(k, profile){
                        if($.parseJSON(profile).Active !="disabled"){
                            foundActiveProfile = true;
                            return false;
                        }
                    })
                }catch(e){
                    console.log(e); //error in the above string(in this case,yes)!
                    foundActiveProfile = false;
                }
            },
            onError:function(err){
                console.log(err.errorThrown);
            }
        })
        //disable button save change
        $('#save-button').addClass('disabled');
        $('#add_dialog').hide();
        getRFQuotaList();
        //getFilterQuotaList();
        //getCPRIQuotaList();


        $( "#tabs" ).tabs({
            activate: function(event, ui) {
                topology_list = [];
                default_operator_filter_quotas = [];
                default_operator_cpri_quotas =[];
                default_operator_rf_quotas =[];
                cpri_quotas_rru = [];
                cpri_quotas_mtdi = [];
                if(ui.newPanel.attr("id") ==="tab-1"){ //this is RF quota tab
                    if (CPRIIsChanged){ //if switch tab with unsaved changes in cpri quota
                        axellConfirm("info","Notice","You have unsaved changes on CPRI quota. Do you want to save them?",function(){
                            saveCPRIQuota();
                            getRFQuotaList();
                        },function(){
                            getRFQuotaList();
                        })
                    }else if(filterIsChanged) { //if switch to rf quota tab but have unsaved change in filter quota
                        axellConfirm("info","Notice","You have unsaved changes on filter quota. Do you want to save them?",function(){
                            saveFilterQuota();
                            getRFQuotaList();
                        },function(){
                            getRFQuotaList();
                        })
                    }else
                    {
                        getRFQuotaList();
                    }
                }else if(ui.newPanel.attr("id") ==="tab-2"){//this is filter quota tab
                    if (RFIsChanged){ //if switch to filter quota tab with unsaved changes in RF quota
                        axellConfirm("info","Notice","You have unsaved changes on RF quota. Do you want to save them?",function(){
                            saveRFQuota();
                            getFilterQuotaList();
                        },function(){
                            getFilterQuotaList();
                        })
                    }else if (CPRIIsChanged){ //if switch to filter quota tab with unsaved changes in CPRI quota
                        axellConfirm("info","Notice","You have unsaved changes on CPRI quota. Do you want to save them?",function(){
                            saveCPRIQuota();
                            getFilterQuotaList();
                        },function(){
                            getFilterQuotaList();
                        })
                    }else{
                        getFilterQuotaList();
                    }
                }else if(ui.newPanel.attr("id") ==="tab-3" ) {//this is cpri quota tab
                    //change next button to done
                    $('#next-button').text('Done');
                    if (RFIsChanged){ //if switch to cpri quota tab with unsaved changes in RF quota
                        axellConfirm("info","Notice","You have unsaved changes on RF quota. Do you want to save them?",function(){
                            saveRFQuota();
                            getCPRIQuotaList();
                        },function(){
                            getCPRIQuotaList();
                        })
                    }else if (filterIsChanged){ //if switch to cpri quota tab with unsaved changes in filter quota
                        axellConfirm("info","Notice","You have unsaved changes on filter quota. Do you want to save them?",function(){
                            saveFilterQuota();
                            getCPRIQuotaList();
                        },function(){
                            getCPRIQuotaList();
                        })
                    }else{
                        getCPRIQuotaList();
                    }
                }
            }
        });

        //click on filter
        $('input[name="regions"]:radio').on('change',function(){
            GenerateRFOperatorAllocations($('input[name="regions"]:radio:checked').val());
        })


        //initilize dialog
        $('#add_dialog').dialog({
            width : 350,
            height:'auto',
            modal:true,
            resizable : false,
            autoOpen : false,
            buttons: {
                'Cancel': function () {
                    $(this).dialog('close');
                },
                'Add': function () {
                    //add exception command called
                    //show exception row
                    GenerateCPRIException();
                    $(this).dialog('close');
                }
            },
            open:function(){
                var autocompleteList =[];
                $.each(topology_list[0],function(i,node){
                    autocompleteList.push(node.ID +" - "+node.Location);

                })
                $( "#node_list_input" ).autocomplete({
                    source: autocompleteList
                });
            }

        });
        $('#add_btn').click(function(){
            $('#add_dialog').dialog('open');
        })
        $('#save-button').click(function(){
            if(!$(this).hasClass('disabled')) {
                if ($("ul.ui-tabs-nav li.ui-tabs-active a").attr("id") === "ui-id-2") {
                    saveFilterQuota();
                }else if($("ul.ui-tabs-nav li.ui-tabs-active a").attr("id") === "ui-id-3"){
                    saveCPRIQuota();
                }else if($("ul.ui-tabs-nav li.ui-tabs-active a").attr("id") === "ui-id-1"){
                    saveRFQuota();
                }
            }
        })
        $('#next-button').click(function(){
            if($(this).text() != "Done") {
                if ($("ul.ui-tabs-nav li.ui-tabs-active a").attr("id") === "ui-id-1") {
                    $("#tabs").tabs({ active: 1 });
                } else if ($("ul.ui-tabs-nav li.ui-tabs-active a").attr("id") === "ui-id-3") {
                    //it's in cpri tab, next doesn't go anywhere
                    //it should be disabled it

                } else if ($("ul.ui-tabs-nav li.ui-tabs-active a").attr("id") === "ui-id-2") {
                    $("#tabs").tabs({ active: 2 });
                }
            }else{
                window.location.href="/target";
            }
        })
        window.onbeforeunload = function(){
            if(CPRIIsChanged || filterIsChanged || RFIsChanged) {
                return "There is unsaved changes. Are you sure you want to leave this page?";
            }
        }
    });
    function saveCPRIQuota(){
        //save changes
        //set default quota for operator
        var default_quota = '';
        var node_quota = '';
        $('.default-cpri-slider').each(function (i) {
            if (i < $('.default-cpri-slider').length - 1) {
                default_quota += 'OPSET CPRIQUOTA ' + $(this).attr('operator') + ' DEFAULT ' + $(this).slider('value') + ' & ';
            } else {
                default_quota += 'OPSET CPRIQUOTA ' + $(this).attr('operator') + ' DEFAULT ' + $(this).slider('value');
            }
        })
        $('.node-cpri-slider').each(function (i) {
            if (i < $('.node-cpri-slider').length - 1) {
                node_quota += 'OPSET CPRIQUOTA ' + $(this).attr('operator') + ' ' + $(this).attr('node-id') + ' ' + $(this).slider('value') + ' & ';
            } else {
                node_quota += 'OPSET CPRIQUOTA ' + $(this).attr('operator') + ' ' + $(this).attr('node-id') + ' ' + $(this).slider('value')
            }
        })
        api.exe({
            cmd: default_quota,
            onSuccess: function () {
                //stay at this tab coz it's the last tab in wizard
                getCPRIQuotaList();
                $('#save-button').addClass('disabled');
                /*
                api.exe({
                    cmd: node_quota,
                    onSuccess: function () {
                        getCPRIQuotaList();
                    },
                    onError: function (e) {
                        console.log(e.errorThrown);
                    }
                })
                */
            },
            onError: function (e) {
                axellPopUp(e.errorThrown);
            }
        })
        //set back to false
        CPRIIsChanged = false;
    }
    function saveFilterQuota() {
        //save changes
        //set default quota for operator
        var default_quota = '';
        var node_quota = '';
        $('.default-filter-slider').each(function (i) {
            if (i < $('.default-filter-slider').length - 1) {
                default_quota += 'OPSET FILTERQUOTA ' + $(this).attr('operator') + ' DEFAULT ' + $(this).slider('value') + ' & ';
            } else {
                default_quota += 'OPSET FILTERQUOTA ' + $(this).attr('operator') + ' DEFAULT ' + $(this).slider('value');
            }
        })
        $('.node-filter-slider').each(function (i) {
            if (i < $('.node-filter-slider').length - 1) {
                node_quota += 'OPSET FILTERQUOTA ' + $(this).attr('operator') + ' ' + $(this).attr('node-id') + ' ' + $(this).slider('value') + ' & ';
            } else {
                node_quota += 'OPSET FILTERQUOTA ' + $(this).attr('operator') + ' ' + $(this).attr('node-id') + ' ' + $(this).slider('value')
            }
        })
        api.exe({
            cmd: default_quota,
            onSuccess: function () {
                //save current tab and move to next tab which is cpri
                //$( "#tabs" ).tabs({ active: 2 });
                $('#save-button').addClass('disabled');
                /*
                api.exe({
                    cmd: node_quota,
                    onSuccess: function () {
                        getFilterQuotaList();
                    },
                    onError: function (e) {
                        console.log(e.errorThrown);
                    }
                })*/
            },
            onError: function (e) {
                axellPopUp(e.errorThrown);
            }
        })
        //set back to false
        filterIsChanged = false;
    }
    function saveRFQuota() {
        //save changes
        //set default quota for operator
        console.log("save rf")
        var rf_quota = '';
        $('.default-rf-slider').each(function (i) {
            if (i < $('.default-rf-slider').length - 1) {
                rf_quota += 'OPSET RFQUOTA ' + $(this).attr('operator') + ' DEFAULT '+ $(this).attr('band')+' '+ $(this).slider('value') + ' & ';
            } else {
                rf_quota += 'OPSET RFQUOTA ' + $(this).attr('operator') + ' DEFAULT '+ $(this).attr('band')+' '+ $(this).slider('value');
            }
        })
        api.exe({
            cmd: rf_quota,
            onSuccess: function () {
                //save current tab and move to next tab which is filter quota
                //$( "#tabs" ).tabs({ active: 1 });
                $('#save-button').addClass('disabled');
            },
            onError: function (e) {
                axellPopUp(e.errorThrown);
            }
        })
        //set back to false
        RFIsChanged = false;
    }
    function GenerateOperatorAllocationHeaders()
    {
        var html_resp = '';
        html_resp += "<td id='operator_allocation_headers'>Default Operator Allocation</td>";
        for(var i=0; i < operator_list.length; i++ )
        {
            html_resp += "<td><div class=''></div> <b>"+operator_list[i].FullName+"</b></td>";
        }
        html_resp += "<td class='unused_filter_cap_cell'><div class='icon unused'></div><b>Unused</b></td><td class='delete_filter_cell'></td>";
        $('#operator_allocation_header').html(html_resp);
    }

    function GenerateOperatorAllocations()
    {
        var totalUsedCap =0;
        var html_resp = '';

        html_resp += "<td id='operator_allocations'></td>";
        for(var i=0; i < default_operator_filter_quotas.length; i++ ) {
            if (operator_list[i] != undefined) {
                html_resp += "<td><div id='default-filter-slider-" + i + "' class='default-filter-slider' operator=" + operator_list[i].SysName + "></div> " +
                    "<input id='default-filter-input-" + i + "' type='text' class='default-filter-input'/></td>";
            }
        }
        html_resp += "<td id='unused_filter_cap' class='unused_filter_cap_cell'></td><td></td>";
        $('#operator_allocations').html(html_resp);
        //set up slider
        $('.default-filter-slider').slider({
            range: "min",
            min: 0,
            max: maxFilterQuota,
            slide: function( event, ui ) {
                filterIsChanged =true;
                $('#save-button').removeClass('disabled');
                var allocatedCap= 0;
                $.each($(this).closest('tr').find('.ui-slider').not(this),function(){
                    allocatedCap += $(this).slider('value');
                })
                allocatedCap += ui.value;
                if (allocatedCap > maxFilterQuota) {
                    allocatedCap =maxFilterQuota;
                    return false;
                }else{
                    $(this).parent().find('.default-filter-input').val(ui.value);
                    $('#unused_filter_cap').text(maxFilterQuota-allocatedCap);
                }
            }
        })
        if(USERACCESS != "superuser" || foundActiveProfile){
            $( ".ui-slider" ).slider( "option", "disabled", true );
            $(".default-filter-input").attr('disabled','disabled');
            $('.unused_filter_cap_cell').remove();
        }
        var totalUsedCap=0;
        //update value for slider and input
        for(var i=0; i < default_operator_filter_quotas.length; i++ ){
            $("#default-filter-slider-" + i).slider('value', default_operator_filter_quotas[i] );
            $("#default-filter-input-" + i).val(default_operator_filter_quotas[i]);
            totalUsedCap +=default_operator_filter_quotas[i];
        }
        //update unused cap
        $('#unused_filter_cap').text(maxFilterQuota-totalUsedCap);
        //allocate by key in input box instead of sliding
        var prevFilterInput;
        $('.default-filter-input').focus(function(){
            prevFilterInput = $(this).val();
        }).change(function(){
            if($.isNumeric($(this).val())) {
                filterIsChanged = true;
                $('#save-button').removeClass('disabled');
                var allocatedCap = 0;
                $.each($(this).closest('tr').find('.ui-slider').not($(this).closest('td').find('.ui-slider')), function () {
                    allocatedCap += $(this).slider('value');
                })
                //if allocated more than total 64, alert
                if (Number($(this).val()) === parseInt($(this).val())) {
                    if ((maxFilterQuota - allocatedCap) < $(this).val()) {
                        axellPopUp('Please enter valid capacity in percentage');
                        $(this).closest('td').find('.ui-slider').slider('value', (maxFilterQuota - allocatedCap));
                        $(this).val(maxFilterQuota - allocatedCap);
                        $('#unused_filter_cap').text(0);
                    } else {
                        $(this).closest('td').find('.ui-slider').slider('value', $(this).val());
                        //add the keyed in value to allocated cap
                        allocatedCap += Number($(this).val());
                        $('#unused_filter_cap').text(maxFilterQuota - allocatedCap);
                    }
                } else {
                    axellPopUp("Please fill in integer number for filter quota");
                }
            }else{
                $(this).val(prevFilterInput);
                axellPopUp("Please fill in valid number for filtering quota");
            }
        })
    }

    function GenerateExceptionHeadings()
    {
        var html_resp = '<tr>';
        html_resp += "<th>Serial</th>";
        html_resp += "<th>Location Tag</th>";
        html_resp += "<th>Node Type</th>";
        for(var i=0; i < operator_list.length; i++ )
        {
            html_resp += "<th>"+operator_list[i].FullName+"</th>";
        }
        if(operator_list.length != MAX_OPERATORS)
        {
            var remaining = MAX_OPERATORS-operator_list.length;
            for(var j=0; j< remaining; j++)
            {
                html_resp += "<th>-</th>";
            }
        }
        html_resp += "<th>Unused</th><th></th></tr>";
        $('#dsp_data thead').append(html_resp);
    }

    function GenerateSerialListData(type) {
        var array_to_use = [];
        var html_resp ='';
        if (type == 'RRU') {
            array_to_use = filter_quotas_rru;
        }
        else if (type == 'MTDI') {
            array_to_use = filter_quotas_mtdi;
        }
        for (var i = 0; i < array_to_use[0].FILTERQUOTA.length; i++) {
            var node_html = '';
            var is_exception = false;
            node_html += "<tr>";
            var location_tag_text = '';
            for (var h = 0; h < topology_list.length; h++) {
                var location_tag = _.findWhere(topology_list[h], {ID: array_to_use[0].FILTERQUOTA[i].Node});
                if (location_tag != undefined) {
                    var xxx = 0;
                    location_tag_text = location_tag.Location;
                    break;
                }
                else {
                    location_tag_text = '-';
                }
            }

            node_html += "<td class='serial_cell'>" + array_to_use[0].FILTERQUOTA[i].Node + "</td>" +
                "<td class='loc_cell'>" + location_tag_text + "</td>" +
                "<td class='type_cell'>" + type + "</td>";
            for (var l = 0; l < MAX_OPERATORS; l++) {
                if (array_to_use[l]) {
                    if (default_operator_filter_quotas[l] != null) {
                        node_html += "<td><div id='filter-alloc-" + l + '-' + array_to_use[l].FILTERQUOTA[i].Node + "' class='slider-" + l + " node-filter-slider' operator='"+operator_list[l].SysName+"' node-id='"+array_to_use[l].FILTERQUOTA[i].Node+"'></div> " +
                            "<input id= 'filter-alloc-input-" + l + '-' + array_to_use[l].FILTERQUOTA[i].Node + "' type='text' class='filter_input'/></td>";
                    }
                }
            }
            node_html += "<td id='unused_filter_cap_"+array_to_use[0].FILTERQUOTA[i].Node+"' class='unused_filter_cap_cell'></td>";
            node_html += "<td id='delete_filter"+array_to_use[0].FILTERQUOTA[i].Node+"' class='delete_filter_cell'><a class='button' title='Delete Exception'><div class='icon clear'></div></a></td>";
            node_html += "</tr>";
            html_resp += node_html;
        }
        $('#dsp_data tbody').append(html_resp);
        //update value for slider and input
        for (var l = 0; l < MAX_OPERATORS; l++) {
            //set up slider
            $('.slider-' + l).slider({
                range: "min",
                min: 0,
                max: maxFilterQuota,
                slide: function( event, ui ) {
                    filterIsChanged =true;
                    $('#save-button').removeClass('disabled');
                    var allocatedCap= 0;
                    $.each($(this).closest('tr').find('.ui-slider').not(this),function(){
                        allocatedCap += $(this).slider('value');
                    })
                    allocatedCap += ui.value;
                    if (allocatedCap > maxFilterQuota) {
                        allocatedCap =maxFilterQuota;
                        return false;
                    }else{
                        $(this).parent().find('.filter_input').val(ui.value);
                        $(this).closest('tr').find('.unused_filter_cap_cell').text(maxFilterQuota-allocatedCap);
                    }
                }
            })
        }
        for (var i = 0; i < array_to_use[0].FILTERQUOTA.length; i++) {
            var totalAllocCap=0;
            for (var l = 0; l < MAX_OPERATORS; l++) {
                $("#filter-alloc-" + l + "-" + array_to_use[l].FILTERQUOTA[i].Node).slider('value', array_to_use[l].FILTERQUOTA[i].Quota );
                $("#filter-alloc-input-" + l + "-" + array_to_use[l].FILTERQUOTA[i].Node).val(array_to_use[l].FILTERQUOTA[i].Quota);
                totalAllocCap+=array_to_use[l].FILTERQUOTA[i].Quota;
            }
            //update unused cap
            $('#unused_filter_cap_'+array_to_use[0].FILTERQUOTA[i].Node).text(maxFilterQuota-totalAllocCap);
        }
        //key in number in input box instead of sliding
        $('.filter_input').change(function(){
            filterIsChanged=true;
            $('#save-button').removeClass('disabled');
            var allocatedCap =0;
            $.each($(this).closest('tr').find('.ui-slider').not($(this).closest('td').find('.ui-slider')),function(){
                allocatedCap += $(this).slider('value');
            })
            //if allocated more than total 100%, alert
            if((maxFilterQuota-allocatedCap) < $(this).val()){
                axellPopUp('Please enter valid filter capacity');
                $(this).closest('td').find('.ui-slider').slider('value',(maxFilterQuota-allocatedCap));
                $(this).val(maxFilterQuota-allocatedCap);
                $(this).closest('tr').find('.unused_filter_cap_cell').text(0);
            }else{
                $(this).closest('td').find('.ui-slider').slider('value',$(this).val());
                $(this).closest('tr').find('.unused_filter_cap_cell').text(maxFilterQuota-allocatedCap);
            }
        })
    }

    function GenerateCPRIOperatorAllocationHeaders()
    {
        var html_resp = '';
        html_resp += "<td id='operator_allocation_headers'>Default Operator Allocation</td>";
        for(var i=0; i < operator_list.length; i++ )
        {
            html_resp += "<td><div class=''></div> <b>"+operator_list[i].FullName+"</b></td>";
        }
        html_resp += "<td class='unused_cpri_cap_cell'><div class='icon unused'></div><b>Unused</b></td><td class='delete_cell'></td>";
        /*
         if(operator_list.length != MAX_OPERATORS)
         {
         var remaining = MAX_OPERATORS-operator_list.length;
         for(var j=0; j< remaining; j++)
         {
         html_resp += "<td>-</td>";
         }
         }*/
        $('#operator_cpri_allocation_header').html(html_resp);
    }

    function GenerateCPRIOperatorAllocations()
    {
        var totalUsedCap =0;
        var html_resp = '';
        html_resp += "<td id='operator_allocations'></td>";
        for(var i=0; i < default_operator_cpri_quotas.length; i++ ) {
            if (operator_list[i] != undefined) {
                html_resp += "<td><div id='default-cpri-slider-" + i + "' class='default-cpri-slider' operator='" + operator_list[i].SysName + "'></div> " +
                    "<input id='default-cpri-input-" + i + "' type='text' class='default-cpri-input'/>%</td>";

            }
        }
        html_resp += "<td id='unused_cpri_cap' class='unused_cpri_cap_cell'></td><td></td>";
        /*
         if(default_operator_cpri_quotas.length != MAX_OPERATORS)
         {
         var remaining = MAX_OPERATORS-default_operator_cpri_quotas.length;
         for(var j=0; j< remaining; j++)
         {
         html_resp += "<td>-</td>";
         }
         }*/
        $('#operator_cpri_allocations').html(html_resp);
        //set up slider
        $('.default-cpri-slider').slider({
            range: "min",
            min: 0,
            step:0.1,
            max: maxCPRIQuota,
            slide: function( event, ui ) {
                CPRIIsChanged =true;
                $('#save-button').removeClass('disabled');
                var allocatedCap= 0.0;
                $.each($(this).closest('tr').find('.ui-slider').not(this),function(){
                    allocatedCap += $(this).slider('value');
                })
                allocatedCap = (allocatedCap + ui.value).toFixed(1);
                if (allocatedCap > maxCPRIQuota) {
                    allocatedCap =maxCPRIQuota;
                    return false;
                }else{
                    $(this).parent().find('.default-cpri-input').val(ui.value);
                    $('#unused_cpri_cap').text((maxCPRIQuota-allocatedCap).toFixed(1)+"%");
                    /* don't need to update all the devices of that operator
                    var operatorIndex = $(this).attr('id').charAt($(this).attr('id').length-1);
                    for (var i = 0; i < cpri_quotas_rru[operatorIndex].CPRIQUOTA.length; i++) {
                        $("#cpri-alloc-" + operatorIndex + "-" + cpri_quotas_rru[operatorIndex].CPRIQUOTA[i].Node).slider('value', ui.value );
                        $("#cpri-alloc-input-" + operatorIndex + "-" + cpri_quotas_rru[operatorIndex].CPRIQUOTA[i].Node).val(ui.value);
                    }
                    for (var i = 0; i < cpri_quotas_mtdi[operatorIndex].CPRIQUOTA.length; i++) {
                        $("#cpri-alloc-" + operatorIndex + "-" + cpri_quotas_mtdi[operatorIndex].CPRIQUOTA[i].Node).slider('value', ui.value );
                        $("#cpri-alloc-input-" + operatorIndex + "-" + cpri_quotas_mtdi[operatorIndex].CPRIQUOTA[i].Node).val(ui.value);
                    }
                    */
                }
            }
        })
        if(USERACCESS != "superuser" || foundActiveProfile){
            $( ".ui-slider" ).slider( "option", "disabled", true );
            $(".default-cpri-input").attr('disabled','disabled');
            $('.unused_cpri_cap_cell').remove();
        }
        var totalUsedCap=0;
        //update value for slider and input
        for(var i=0; i < default_operator_cpri_quotas.length; i++ ){
            $("#default-cpri-slider-" + i).slider('value', default_operator_cpri_quotas[i] );
            $("#default-cpri-input-" + i).val(default_operator_cpri_quotas[i]);
            totalUsedCap +=default_operator_cpri_quotas[i];
        }
        //update unused cap
        $('#unused_cpri_cap').text((maxCPRIQuota-totalUsedCap).toFixed(1) +"%");
        //allocate by key in input box instead of sliding
        var prevCPRIInput;
        $('.default-cpri-input').focus(function(){
            prevCPRIInput = $(this).val();
        }).change(function(){
            if($.isNumeric($(this).val())) {
                CPRIIsChanged = true;
                $('#save-button').removeClass('disabled');
                var allocatedCap = 0;
                $.each($(this).closest('tr').find('.ui-slider').not($(this).closest('td').find('.ui-slider')), function () {
                    allocatedCap += $(this).slider('value');
                })
                //if allocated more than total 100%, alert
                if ((maxCPRIQuota - allocatedCap) < $(this).val()) {
                    axellPopUp('Please enter valid capacity in percentage');
                    $(this).closest('td').find('.ui-slider').slider('value', ((maxCPRIQuota - allocatedCap).toFixed(1)));
                    $(this).val((maxCPRIQuota - allocatedCap).toFixed(1));
                    $('#unused_cpri_cap').text(0 + "%");
                } else {
                    $(this).closest('td').find('.ui-slider').slider('value', $(this).val());
                    //add the keyed in value to allocated cap
                    allocatedCap += Number($(this).val());
                    $('#unused_cpri_cap').text((maxCPRIQuota - allocatedCap).toFixed(1) + "%");
                }
            }else{
                $(this).val(prevCPRIInput);
                axellPopUp("Please fill in a valid number for CPRI quota");
            }
        })
    }

    function GenerateCPRIException()
    {
        $('#cpri_table').empty();
        var html_resp = '<table class="type1" id="cpri_data"><caption>Exceptions</caption><tr>';
        html_resp += "<th class='serial_cell'><div class='icon id'></div> Serial</th>";
        html_resp += "<th class='loc_cell'><div class='icon location'></div> Location Tag</th>";
        html_resp += "<th class='type_cell'><div class='icon model'></div> Node Type</th>";
        for(var i=0; i < operator_list.length; i++ )
        {
            html_resp += "<th><div class=''></div> "+operator_list[i].FullName+"</th>";
        }
        html_resp += "<th class='unused_cpri_cap_cell'><div class='icon unused'></div> Unused</th>";
        html_resp += "<th class='delete_cell'></th>";
        var node_html = '';
        //display rru exception nodes
        for (var i = 0; i < cpri_quotas_rru[0].CPRIQUOTA.length; i++) {
            var node = _.findWhere(topology_list[0], {ID: cpri_quotas_rru[0].CPRIQUOTA[i].Node});
            if(node !=undefined) {
                node_html += "<tr>";
                node_html += "<td class='serial_cell'>" + node.ID + "</td>" +
                    "<td class='loc_cell'> " + node.Location + "</td>" +
                    "<td class='type_cell'> " + node["Node Type"] + "</td>";
                for (var l = 0; l < MAX_OPERATORS; l++) {
                    node_html += "<td><div id='cpri-alloc-" + l + '-' + cpri_quotas_rru[l].CPRIQUOTA[i].Node + "' class='slider-" + l + " node-cpri-slider' operator='"+operator_list[l].SysName+"' node-id='"+cpri_quotas_rru[l].CPRIQUOTA[i].Node+"'></div> " +
                        "<input id= 'cpri-alloc-input-" + l + '-' + cpri_quotas_rru[l].CPRIQUOTA[i].Node + "' type='text' class='cpri_input'/>%</td>";

                }
                node_html += "<td id='unused_cap_"+cpri_quotas_rru[0].CPRIQUOTA[i].Node+"' class='unused_cpri_cap_cell'></td>";
                node_html += "<td id='delete_"+cpri_quotas_rru[0].CPRIQUOTA[i].Node+"' class='delete_cell'><a class='button' title='Delete Exception'><div class='icon clear'></div></a></td>";
                node_html += "</tr>";
            }
        }
        //display mtdi exception nodes
        for (var i = 0; i < cpri_quotas_mtdi[0].CPRIQUOTA.length; i++) {
            var node = _.findWhere(topology_list[0], {ID: cpri_quotas_mtdi[0].CPRIQUOTA[i].Node});
            if(node !=undefined) {
                node_html += "<tr>";
                node_html += "<td class='serial_cell'>" + node.ID + "</td>" +
                    "<td class='loc_cell'> " + node.Location + "</td>" +
                    "<td class='type_cell'> " + node["Node Type"] + "</td>";
                for (var l = 0; l < MAX_OPERATORS; l++) {
                    node_html += "<td><div id='cpri-alloc-" + l + '-' + cpri_quotas_mtdi[l].CPRIQUOTA[i].Node + "' class='slider-" + l + " node-cpri-slider' operator='"+operator_list[l].SysName+"' node-id='"+cpri_quotas_mtdi[l].CPRIQUOTA[i].Node+"'></div> " +
                        "<input id= 'cpri-alloc-input-" + l + '-' + cpri_quotas_mtdi[l].CPRIQUOTA[i].Node + "' type='text' class='cpri_input'/>%</td>";

                }
                node_html += "<td id='unused_cap_"+cpri_quotas_mtdi[0].CPRIQUOTA[i].Node+"' class='unused_cpri_cap_cell'></td>";
                node_html += "<td id='delete_"+cpri_quotas_mtdi[0].CPRIQUOTA[i].Node+"' class='delete_cell'><a class='button' title='Delete Exception'><div class='icon clear'></div></a></td>";
                node_html += "</tr>";
            }
        }
        html_resp += node_html;
        $('#cpri_table').append(html_resp);
        //update value for slider and input
        for (var l = 0; l < MAX_OPERATORS; l++) {
            //set up slider
            $('.slider-' + l).slider({
                range: "min",
                min: 0,
                max: maxCPRIQuota,
                slide: function( event, ui ) {
                    CPRIIsChanged =true;
                    $('#save-button').removeClass('disabled');
                    var allocatedCap= 0;
                    $.each($(this).closest('tr').find('.ui-slider').not(this),function(){
                        allocatedCap += $(this).slider('value');
                    })
                    allocatedCap += ui.value;
                    if (allocatedCap > maxCPRIQuota) {
                        allocatedCap =maxCPRIQuota;
                        return false;
                    }else{
                        $(this).parent().find('.cpri_input').val(ui.value);
                        $(this).closest('tr').find('.unused_cpri_cap_cell').text(maxCPRIQuota-allocatedCap+"%");
                    }
                }
            })
        }

        for (var i = 0; i < cpri_quotas_rru[0].CPRIQUOTA.length; i++) {
            var totalAllocCap=0;
            for (var l = 0; l < MAX_OPERATORS; l++) {
                $("#cpri-alloc-" + l + "-" + cpri_quotas_rru[l].CPRIQUOTA[i].Node).slider('value', cpri_quotas_rru[l].CPRIQUOTA[i].Quota );
                $("#cpri-alloc-input-" + l + "-" + cpri_quotas_rru[l].CPRIQUOTA[i].Node).val(cpri_quotas_rru[l].CPRIQUOTA[i].Quota);
                totalAllocCap+=cpri_quotas_rru[l].CPRIQUOTA[i].Quota;
            }
            //update unused cap
            $('#unused_cap_'+cpri_quotas_rru[0].CPRIQUOTA[i].Node).text(maxCPRIQuota-totalAllocCap +"%");
        }
        for (var i = 0; i < cpri_quotas_rru[0].CPRIQUOTA.length; i++) {
            var totalAllocCap=0;
            for (var l = 0; l < MAX_OPERATORS; l++) {
                $("#cpri-alloc-" + l + "-" + cpri_quotas_mtdi[l].CPRIQUOTA[i].Node).slider('value', cpri_quotas_mtdi[l].CPRIQUOTA[i].Quota );
                $("#cpri-alloc-input-" + l + "-" + cpri_quotas_mtdi[l].CPRIQUOTA[i].Node).val(cpri_quotas_mtdi[l].CPRIQUOTA[i].Quota);
                totalAllocCap+=cpri_quotas_mtdi[l].CPRIQUOTA[i].Quota;
            }
            //update unused cap
            $('#unused_cap_'+cpri_quotas_rru[0].CPRIQUOTA[i].Node).text(maxCPRIQuota-totalAllocCap +"%");
        }

        //key in number in input box instead of sliding
        $('.cpri_input').change(function(){
            CPRIIsChanged =true;
            $('#save-button').removeClass('disabled');
            var allocatedCap =0;
            $.each($(this).closest('tr').find('.ui-slider').not($(this).closest('td').find('.ui-slider')),function(){
                allocatedCap += $(this).slider('value');
            })
            //if allocated more than total 100%, alert
            if((maxCPRIQuota-allocatedCap) < $(this).val()){
                axellPopUp('Please enter valid capacity in percentage');
                $(this).closest('td').find('.ui-slider').slider('value',(maxCPRIQuota-allocatedCap));
                $(this).val(maxCPRIQuota-allocatedCap);
                $(this).closest('tr').find('.unused_cpri_cap_cell').text(0+"%");
            }else{
                $(this).closest('td').find('.ui-slider').slider('value',$(this).val());
                $(this).closest('tr').find('.unused_cpri_cap_cell').text(maxCPRIQuota-allocatedCap+"%");
            }
        })
    }

    function GenerateException(){
        $('#filter_table').empty();
        var html_resp = '<table class="type1" id="filter_data"><caption>Exceptions</caption><tr>';
        html_resp += "<th class='serial_cell'><div class='icon id'></div> Serial</th>";
        html_resp += "<th class='loc_cell'><div class='icon location'></div> Location Tag</th>";
        html_resp += "<th class='type_cell'><div class='icon model'></div> Node Type</th>";
        for(var i=0; i < operator_list.length; i++ )
        {
            html_resp += "<th><div class=''></div> "+operator_list[i].FullName+"</th>";
        }
        html_resp += "<th class='unused_filter_cap_cell'><div class='icon unused'></div> Unused</th>";
        html_resp += "<th class='delete_filter_cell'></th>";
        var node_html = '';
        //display rru exception nodes
        for (var i = 0; i < filter_quotas_rru[0].FILTERQUOTA.length; i++) {
            var node = _.findWhere(topology_list[0], {ID: filter_quotas_rru[0].FILTERQUOTA[i].Node});
            if(node !=undefined) {
                node_html += "<tr>";
                node_html += "<td class='serial_cell'>" + node.ID + "</td>" +
                    "<td class='loc_cell'> " + node.Location + "</td>" +
                    "<td class='type_cell'> " + node["Node Type"] + "</td>";
                for (var l = 0; l < MAX_OPERATORS; l++) {
                    node_html += "<td><div id='filter-alloc-" + l + '-' + filter_quotas_rru[l].FILTERQUOTA[i].Node + "' class='slider-" + l + " node-filter-slider' operator='"+operator_list[l].SysName+"' node-id='"+filter_quotas_rru[l].FILTERQUOTA[i].Node+"'></div> " +
                        "<input id= 'filter-alloc-input-" + l + '-' + filter_quotas_rru[l].FILTERQUOTA[i].Node + "' type='text' class='filter_input'/></td>";

                }
                node_html += "<td id='unused_cap_"+filter_quotas_rru[0].FILTERQUOTA[i].Node+"' class='unused_filter_cap_cell'></td>";
                node_html += "<td id='delete_"+filter_quotas_rru[0].FILTERQUOTA[i].Node+"' class='delete_filter_cell'><a class='button' title='Delete Exception'><div class='icon clear'></div></a></td>";
                node_html += "</tr>";
            }
        }
        //display mtdi exception nodes
        for (var i = 0; i < filter_quotas_mtdi[0].FILTERQUOTA.length; i++) {
            var node = _.findWhere(topology_list[0], {ID: filter_quotas_mtdi[0].FILTERQUOTA[i].Node});
            if(node !=undefined) {
                node_html += "<tr>";
                node_html += "<td class='serial_cell'>" + node.ID + "</td>" +
                    "<td class='loc_cell'> " + node.Location + "</td>" +
                    "<td class='type_cell'> " + node["Node Type"] + "</td>";
                for (var l = 0; l < MAX_OPERATORS; l++) {
                    node_html += "<td><div id='filter-alloc-" + l + '-' + filter_quotas_mtdi[l].FILTERQUOTA[i].Node + "' class='slider-" + l + " node-filter-slider' operator='"+operator_list[l].SysName+"' node-id='"+filter_quotas_mtdi[l].FILTERQUOTA[i].Node+"'></div> " +
                        "<input id= 'filter-alloc-input-" + l + '-' + filter_quotas_mtdi[l].FILTERQUOTA[i].Node + "' type='text' class='filter_input'/></td>";

                }
                node_html += "<td id='unused_cap_"+filter_quotas_mtdi[0].FILTERQUOTA[i].Node+"' class='unused_filter_cap_cell'></td>";
                node_html += "<td id='delete_"+filter_quotas_mtdi[0].FILTERQUOTA[i].Node+"' class='delete_filter_cell'><a class='button' title='Delete Exception'><div class='icon clear'></div></a></td>";
                node_html += "</tr>";
            }
        }
        html_resp += node_html;
        $('#filter_table').append(html_resp);
        //update value for slider and input
        for (var l = 0; l < MAX_OPERATORS; l++) {
            //set up slider
            $('.slider-' + l).slider({
                range: "min",
                min: 0,
                max: maxFilterQuota,
                slide: function( event, ui ) {
                    filterIsChanged =true;
                    $('#save-button').removeClass('disabled');
                    var allocatedCap= 0;
                    $.each($(this).closest('tr').find('.ui-slider').not(this),function(){
                        allocatedCap += $(this).slider('value');
                    })
                    allocatedCap += ui.value;
                    if (allocatedCap > maxFilterQuota) {
                        allocatedCap =maxFilterQuota;
                        return false;
                    }else{
                        $(this).parent().find('.filter_input').val(ui.value);
                        $(this).closest('tr').find('.unused_filter_cap_cell').text(maxFilterQuota-allocatedCap);
                    }
                }
            })
        }

        for (var i = 0; i < filter_quotas_rru[0].FILTERQUOTA.length; i++) {
            var totalAllocCap=0;
            for (var l = 0; l < MAX_OPERATORS; l++) {
                $("#filter-alloc-" + l + "-" + filter_quotas_rru[l].FILTERQUOTA[i].Node).slider('value', filter_quotas_rru[l].FILTERQUOTA[i].Quota );
                $("#filter-alloc-input-" + l + "-" + filter_quotas_rru[l].FILTERQUOTA[i].Node).val(filter_quotas_rru[l].FILTERQUOTA[i].Quota);
                totalAllocCap+=filter_quotas_rru[l].FILTERQUOTA[i].Quota;
            }
            //update unused cap
            $('#unused_cap_'+filter_quotas_rru[0].FILTERQUOTA[i].Node).text(maxFilterQuota-totalAllocCap);
        }
        for (var i = 0; i < filter_quotas_mtdi[0].FILTERQUOTA.length; i++) {
            var totalAllocCap=0;
            for (var l = 0; l < MAX_OPERATORS; l++) {
                $("#filter-alloc-" + l + "-" + filter_quotas_mtdi[l].FILTERQUOTA[i].Node).slider('value', filter_quotas_mtdi[l].FILTERQUOTA[i].Quota );
                $("#filter-alloc-input-" + l + "-" + filter_quotas_mtdi[l].FILTERQUOTA[i].Node).val(filter_quotas_mtdi[l].FILTERQUOTA[i].Quota);
                totalAllocCap+=filter_quotas_mtdi[l].FILTERQUOTA[i].Quota;
            }
            //update unused cap
            $('#unused_cap_'+filter_quotas_mtdi[0].FILTERQUOTA[i].Node).text(maxFilterQuota-totalAllocCap);
        }

        //key in number in input box instead of sliding
        $('.filter_input').change(function(){
            filterIsChanged =true;
            $('#save-button').removeClass('disabled');
            var allocatedCap =0;
            $.each($(this).closest('tr').find('.ui-slider').not($(this).closest('td').find('.ui-slider')),function(){
                allocatedCap += $(this).slider('value');
            })
            //if allocated more than total 100%, alert
            if(Number($(this).val()) === parseInt($(this).val())) {
               if((maxCPRIQuota-allocatedCap) < $(this).val()){
                    axellPopUp('Please enter valid capacity in percentage');
                    $(this).closest('td').find('.ui-slider').slider('value',(maxFilterQuota-allocatedCap));
                    $(this).val(maxFilterQuota-allocatedCap);
                    $(this).closest('tr').find('.unused_filter_cap_cell').text(0);
                }else{
                    $(this).closest('td').find('.ui-slider').slider('value',$(this).val());
                    $(this).closest('tr').find('.unused_filter_cap_cell').text(maxFilterQuota-allocatedCap);
                }
            }else{
                axellPopUp("Please fill in integer number for filter quota");
            }
        })
    }

    function GenerateRFOperatorAllocationHeaders(){
        var html_resp = '';
        html_resp += "<td id='operator_rf_allocation_headers'>Default Operator Allocation Per Band</td>";
        for(var i=0; i < operator_list.length; i++ )
        {
            html_resp += "<td><div class=''></div> <b>"+operator_list[i].FullName+"</b></td>";
        }
        html_resp += "<td class='unused_rf_cap_cell'><div class='icon unused'></div><b>Unused</b></td><td class='delete_rf_cell'></td>";
        $('#operator_rf_allocation_header').html(html_resp);
    }


    function GenerateRFOperatorAllocations(chosenRegion){
        $('#operators_rf_content').empty();
        $('#legend').empty();
	var html_resp = '';
        for(var j =0; j< bandList.length; j++) {
		   var value = bandList[j];
         $.each(bandsList,function(index, val){
			 if(value == val.Band){
           if ((chosenRegion == "all") || (val.AMER == "1" && chosenRegion == "AMER") || (val.EMEA == "1" && chosenRegion == "EMEA") || (val.APAC == "1" && chosenRegion == "APAC")) {
			    html_resp += "<tr>";
             var desc = val.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "");
			    html_resp += "<td>"+desc+"</td>";
			    for (var i = 0; i < operator_list.length; i++) {
				html_resp += "<td><div id='default-rf-slider-" + i + '-' + j + "' class='default-rf-slider' operator=" + operator_list[i].SysName + " band=" + bandList[j] + "></div> " +
				    "<input id='default-rf-input-" + i + '-' + j + "' type='text' class='default-rf-input'/>%</td>";
			    }
			    html_resp += "<td id='unused_rf_cap_"+bandList[j]+"'  class='unused_rf_cap_cell'></td><td></td>";
           }
		    }
	      })
        }
        $('tbody#operator_rf_allocations').html(html_resp);

        //set up slider
        for(var j =0; j< bandList.length; j++) {
            $('.default-rf-slider').slider({
                range: "min",
                min: 0,
                step:0.1,
                max: maxRFQuota,
                slide: function (event, ui) {
                    RFIsChanged = true;
                    $('#save-button').removeClass('disabled');
                    var allocatedCap = 0;
                    $.each($(this).closest('tr').find('.ui-slider').not(this), function () {
                        allocatedCap += $(this).slider('value');
                    })
                    allocatedCap += ui.value;
                    if (allocatedCap > maxRFQuota) {
                        allocatedCap = maxRFQuota;
                        return false;
                    } else {
                        $(this).parent().find('.default-rf-input').val(ui.value);
                        $(this).closest('tr').find('.unused_rf_cap_cell').text((maxRFQuota - allocatedCap).toFixed(1) +"%");
                    }
                }
            })

            var totalUsedCap=0;
            //update value for slider and input
            for (var i = 0; i < operator_list.length; i++) {
                $("#default-rf-slider-" + i+"-"+j).slider('value', default_operator_rf_quotas[i*(bandList.length)+j]);
                $("#default-rf-input-" + i+"-"+j).val(default_operator_rf_quotas[i*(bandList.length)+j]);
                totalUsedCap +=default_operator_rf_quotas[i*(bandList.length)+j];
            }
            //update unused cap
            $('#unused_rf_cap_'+bandList[j]).text((maxRFQuota - totalUsedCap).toFixed(1)+"%");
            //only sysadmin can edit slider
            console.log(foundActiveProfile)
            if(USERACCESS != "superuser" || foundActiveProfile){
                $('.ui-slider').slider( "option", "disabled", true );
                $('.default-rf-input').attr('disabled','disabled');
                $('.unused_rf_cap_cell').remove();
            }

        }
        //allocate quota by key in input box instead of sliding
        var prevRFInput;
        $('.default-rf-input').focus(function(){
            prevRFInput = $(this).val();
        }).change(function(){
            if($.isNumeric($(this).val())) {
                RFIsChanged = true;
                $('#save-button').removeClass('disabled');
                var allocatedCap = 0;
                $.each($(this).closest('tr').find('.ui-slider').not($(this).closest('td').find('.ui-slider')), function () {
                    allocatedCap += Number($(this).slider('value'));
                })
                //
                //if allocated more than total 100%, alert
                if ((maxRFQuota - allocatedCap) < $(this).val()) {
                    axellPopUp('Please enter valid capacity in percentage');
                    $(this).closest('td').find('.ui-slider').slider('value', (maxRFQuota - allocatedCap).toFixed(1));
                    $(this).val((maxRFQuota - allocatedCap).toFixed(1));
                    $(this).closest('tr').find('.unused_rf_cap_cell').text("0%");
                } else {
                    $(this).closest('td').find('.ui-slider').slider('value', ($(this).val()));
                    allocatedCap += Number($(this).val());
                    $(this).closest('tr').find('.unused_rf_cap_cell').text((maxRFQuota - allocatedCap).toFixed(1) + "%");
                }
            }else{
                $(this).val(prevRFInput);
                axellPopUp("Please fill in a valid number for RF quota");
            }
        })
    }
});


