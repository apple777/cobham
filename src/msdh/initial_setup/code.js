/**
 * Created by Emerald on 18/12/14.
 */
require([ '/js/api.js','/js/lib/d3.min.js','/js/lib/jquery.js','/js/convert.js','/js/scheduler.js','/js/util.js','/js/lib/jquery-jsPlumb.js','/js/lib/jquery-ui.js','/js/lib/underscore.js','/js/lib/tipsy.js' ],
    function ( api,d3,$,convert,scheduler,util) {
        var OPERATORS =[];
        var maxFilterQuota = 64;
        var maxCPRIQuota =100;
        var maxRFQuota =100;
        var operatorList = [];
        var addedOperatorList=[];
        var defaultFilterQuota;
        var defaultCPRIQuota;
        var defaultRFQuota;
        var isManuallyChanged = false;
        //clear current op
        $.removeCookie('currentOperator',{ path: '/' });
        $(document).ready(function(){
            //poll for operator every 3 second, if there's any operator detected, lead straight to topology page
            /*
            scheduler.add(sec(10),{
                cmd:'operators --json',
                dataType:'json',
                callOnDiff:true,
                onSuccess:function(o){
                    OPERATORS = o.ajaxdata.operators;
                    if(OPERATORS.length >0) {
                        setTimeout(function () {
                            window.location.href = '/target/';
                        }, 3000)
                    }
                }
            })
            */
            $('header#header').hide();
            $(document).on('focus', '#num_of_operator',function () {
                addedOperatorList=[];
                // Store the current value on focus and on change
                var previous_num_of_op = this.value;
                if(previous_num_of_op>0) {
                    for (var i = 1; i <= previous_num_of_op; i++) {
                        addedOperatorList.push({"SysName": $('#op_name_' + i).val(), "FullName": $('#op_desc_' + i).val(),
                            "default_filter": $('#op_default_filter_' + i).slider('value'), "default_cpri": $('#op_default_cpri_' + i).slider('value'),
                            "default_rf": $('#op_default_rf_' + i).slider('value')});
                    }
                }
            }).on('change', '#num_of_operator', function () {
                var num_of_op = $(this).val();
                //update default values
                defaultFilterQuota = Number(maxFilterQuota/num_of_op).toFixed(1);
                defaultCPRIQuota = Number(maxCPRIQuota/num_of_op).toFixed(1);
                defaultRFQuota = Number(maxRFQuota/num_of_op).toFixed(1);
                populateTable(num_of_op);
            })
            $(document).on('click','#apply-btn',function(){
                sendCmd();
            });

            //on event click on advanced button
            $('#advanced-btn').click(function(){
                if($(this).attr('flag') === "true") {
                    $(this).attr('flag', false);
                    $('.advanced').show();
                    $(this).text("Hide advanced settings");
                }else{
                    $(this).attr('flag', true);
                    $('.advanced').hide();
                    $(this).text("Show advanced settings");
                }
            })

        })

        function populateTable(numOp){
            $('#advanced-btn').show();
            $('#opadd_table').empty();
            var opTbl = '';
            opTbl += '<table class="type1"><caption>Operator Setup</caption>' +
                '<tr><th><div class=""></div> Operator Name <div class="icon help" title="Operator name should be 5-25 characters long and only contain [a-z0-9-_], no space and uppercase is allowed"></div></th>' +
                '<th class="advanced"><div class="icon tag"></div>Description <div class="icon help" title="Operator description can contain [a-z0-9-_]"></div></th>' +
                '<th class="advanced">Default Filter Quota <div class="icon help" title="System maximum filter quota is 64. This amount will be shared among all operators"></div></th>' +
                '<th class="advanced">Default CPRI Quota <div class="icon help" title="System maximum CPRI quota is 100%. This amount will be shared among all operators"></div></th>' +
                '<th class="advanced">Default RF Power Quota <div class="icon help" title="System maximum RF power quota is 100%. This amount will be applied to all available bands and shared among all operators"></div></th></tr>';
            for (var i = 1; i <= numOp; i++) {
                opTbl += '<tr>';
                opTbl += '<td><input id = "op_name_' + i + '" class="op_name_input" type="text"/></td>';
                opTbl += '<td class="advanced"><input id = "op_desc_' + i + '" class="op_desc_input" type="text"/></td>';
                opTbl += '<td class="advanced"><div id = "op_default_filter_' + i + '" class="op_default_filter"></div>' +
                    '<input id= "filter-alloc-input-' + i + '" type="text" class="filter_input" value=""/></td>';
                opTbl += '<td class="advanced"><div id = "op_default_cpri_' + i + '" class="op_default_cpri"></div>' +
                    '<input id= "cpri-alloc-input-' + i + '" type="text" class="cpri_input" value=""/>%</td>';
                opTbl += '<td class="advanced"><div id = "op_default_rf_' + i + '" class="op_default_rf"></div>' +
                    '<input id= "rf-alloc-input-' + i + '" type="text" class="rf_input" value=""/>%</td>';
                opTbl += '</tr>';
            }
            opTbl += '</table>';
            opTbl += '<div id="apply-btn-placeholder"><a id="apply-btn" class="button">Apply</a></div>';
            $('#opadd_table').append(opTbl);
            //hide advanced class
            if( $('#advanced-btn').attr('flag')==="true") {
                $('.advanced').hide();
            }else{
                $('.advanced').show();
            }

            //set up slider
            //for(var i=1; i<= numOp;i++) {
                $('.op_default_filter').slider({
                    range: "min",
                    min: 0,
                    max: maxFilterQuota,
                    slide: function (event, ui) {
                        isManuallyChanged = true; //set flag users make changes to quotas slider
                        var allocatedCap= 0;
                        $('.op_default_filter').not(this).each(function(){
                            allocatedCap += $(this).slider('value');
                        })
                        allocatedCap += ui.value;
                        if (allocatedCap > maxFilterQuota) {
                            allocatedCap =maxFilterQuota;
                            return false;
                        }else{
                            $(this).parent().find('.filter_input').val(ui.value);
                        }
                    }
                })
                $('.op_default_cpri').slider({
                    range: "min",
                    min: 0,
                    step:0.1,
                    max: maxCPRIQuota,
                    slide: function (event, ui) {
                        isManuallyChanged = true; //set flag users make changes to quotas slider
                        var allocatedCap= 0;
                        $('.op_default_cpri').not(this).each(function(){
                            allocatedCap += $(this).slider('value');
                        })
                        allocatedCap += ui.value;
                        if (allocatedCap > maxCPRIQuota) {
                            allocatedCap =maxCPRIQuota;
                            return false;
                        }else{
                            $(this).parent().find('.cpri_input').val(ui.value);
                        }
                    }
                })
                $('.op_default_rf').slider({
                    range: "min",
                    min: 0,
                    step:0.1,
                    max: maxRFQuota,
                    slide: function (event, ui) {
                        isManuallyChanged = true; //set flag users make changes to quotas slider
                        var allocatedCap= 0;
                        $('.op_default_rf').not(this).each(function(){
                            allocatedCap += $(this).slider('value');
                        })
                        allocatedCap += ui.value;
                        if (allocatedCap > maxRFQuota) {
                            allocatedCap = maxRFQuota;
                            return false;
                        }else{
                            $(this).parent().find('.rf_input').val(ui.value);
                        }
                    }
                })

            //}

            //if users made change to quota value, keep them and display them accordingly
            //if they haven't made any change, display default quota
            if(isManuallyChanged) {
                if(addedOperatorList.length>0) {
                    for (var i = 1; i <= numOp ; i++) {
                        if(i <=addedOperatorList.length) {
                            $('#op_name_' + i).val(addedOperatorList[i - 1].SysName);
                            $('#op_desc_' + i).val(addedOperatorList[i - 1].FullName);
                            $('#op_default_filter_' + i).slider('value', addedOperatorList[i - 1].default_filter);
                            $('#op_default_cpri_' + i).slider('value', addedOperatorList[i - 1].default_cpri);
                            $('#op_default_rf_' + i).slider('value', addedOperatorList[i - 1].default_rf);
                            $('#filter-alloc-input-' + i).val(addedOperatorList[i - 1].default_filter);
                            $('#cpri-alloc-input-' + i).val(addedOperatorList[i - 1].default_cpri);
                            $('#rf-alloc-input-' + i).val(addedOperatorList[i - 1].default_rf);
                        }else{
                            $('#op_default_filter_' + i).slider('value', 0);
                            $('#op_default_cpri_' + i).slider('value', 0);
                            $('#op_default_rf_' + i).slider('value', 0);
                            $('#filter-alloc-input-' + i).val(0);
                            $('#cpri-alloc-input-' + i).val(0);
                            $('#rf-alloc-input-' + i).val(0);
                        }
                    }
                }
            }else{
                $('.op_default_filter').slider('value', defaultFilterQuota);
                $('.op_default_cpri').slider('value', defaultCPRIQuota);
                $('.op_default_rf').slider('value', defaultRFQuota);
                $('.filter_input').val(defaultFilterQuota);
                $('.cpri_input').val(defaultCPRIQuota);
                $('.rf_input').val(defaultRFQuota);
            }
            //when user type in operator name, copy that into description
            $('.op_name_input').change(function(){
                $('#op_desc_'+$(this).attr('id').charAt($(this).attr('id').length-1)).val($(this).val());
            })
            //allocate by key in input box instead of sliding
            $('.filter_input').change(function(){
                isManuallyChanged = true; //set flag users make changes to quotas slider
                var allocatedCap =0;
                $.each($('.op_default_filter').not($(this).closest('td').find('.ui-slider')),function(){
                    allocatedCap += $(this).slider('value');
                })
                //if allocated more than total 64, alert
                if(Number($(this).val()) === parseInt($(this).val())) {
                    if ((maxFilterQuota - allocatedCap) < $(this).val()) {
                        axellPopUp('Please enter valid capacity in percentage');
                        $(this).closest('td').find('.ui-slider').slider('value', (maxFilterQuota - allocatedCap));
                        $(this).val(maxFilterQuota - allocatedCap);
                    } else {
                        $(this).closest('td').find('.ui-slider').slider('value', $(this).val());
                    }
                }else{
                    axellPopUp("Please fill in integer for filter quota");
                }
            })
            //allocate by key in input box instead of sliding
            $('.cpri_input').change(function(){
                isManuallyChanged = true; //set flag users make changes to quotas slider
                var allocatedCap =0;
                $.each($('.op_default_cpri').not($(this).closest('td').find('.ui-slider')),function(){
                    allocatedCap += $(this).slider('value').toFixed(1);
                })
                //if allocated more than total 64, alert
                if((maxCPRIQuota-allocatedCap) < Number($(this).val()).toFixed(1)){
                    axellPopUp('Please enter valid capacity in percentage');
                    $(this).closest('td').find('.ui-slider').slider('value',(maxCPRIQuota-allocatedCap).toFixed(1));
                    $(this).val((maxCPRIQuota-allocatedCap).toFixed(1));
                }else{
                    $(this).closest('td').find('.ui-slider').slider('value',Number($(this).val()).toFixed(1));
                }
            })
            //allocate by key in input box instead of sliding
            $('.rf_input').change(function(){
                isManuallyChanged = true; //set flag users make changes to quotas slider
                var allocatedCap =0;
                $.each($('.op_default_rf').not($(this).closest('td').find('.ui-slider')),function(){
                    allocatedCap += $(this).slider('value').toFixed(1);
                })
                //if allocated more than total 64, alert
                if((maxRFQuota-allocatedCap) < Number($(this).val()).toFixed(1)){
                    axellPopUp('Please enter valid power quota in percentage');
                    $(this).closest('td').find('.ui-slider').slider('value',(maxRFQuota-allocatedCap).toFixed(1));
                    $(this).val((maxRFQuota-allocatedCap).toFixed(1));
                }else{
                    $(this).closest('td').find('.ui-slider').slider('value',Number($(this).val()).toFixed(1));
                }
            })
        }
        function sendCmd(){
            //check if all details have been filled in
            var opNameIsFilled =true;
            $('.op_name_input').each(function(){
                if($(this).val() ==="" || !util.validateUser($(this).val())){
                    opNameIsFilled = false;
                }
            })
            var opDescIsFilled =true;
            $('.op_desc_input').each(function(){
                if($(this).val() ==="" || !util.validateTag($(this).val())){
                    opNameIsFilled = false;
                }
            })
            var defaultFilterIsFilled =true;
            $('.op_default_filter').each(function(){
                if($(this).slider('value')<0){
                    defaultFilterIsFilled = false;
                }
            })
            var defaultCPRIIsFilled =true;
            $('.op_default_cpri').each(function(){
                if($(this).slider('value')<0){
                    defaultCPRIIsFilled = false;
                }
            })
            var defaultRFIsFilled =true;
            $('.op_default_rf').each(function(){
                if($(this).slider('value')<0){
                    defaultRFIsFilled = false;
                }
            })
            if(!opNameIsFilled){
                axellPopUp("Please fill in a valid operator name. Operator name should be 5-25 characters long and only contain [a-z0-9-_], no space and uppercase is allowed");
            }else if(!opDescIsFilled){
                axellPopUp("Please fill in a valid operator description. Operator description can contain [a-z0-9-_]");
            }else if(!defaultFilterIsFilled){
                axellPopUp("Please set a valid default filter quota for operator");
            }else if(!defaultCPRIIsFilled){
                axellPopUp("Please set a valid default CPRI quota for operator");
            }else if(!defaultRFIsFilled){
                axellPopUp("Please set a valid default RF quota for operator");
            }else if(opDescIsFilled && opNameIsFilled && defaultFilterIsFilled && defaultCPRIIsFilled && defaultRFIsFilled){
                //console.log('send all cmd to back end to set up operators');
                operatorList =[];
                var cmd ='';
                for(var i =1; i<=$('#num_of_operator').val();i++) {
                    operatorList.push({"SysName":$('#op_name_' + i).val(),"FullName":$('#op_desc_' + i).val(),
                        "default_filter":$('#op_default_filter_'+i).slider('value'),"default_cpri":$('#op_default_cpri_'+i).slider('value'),
                        "default_rf":$('#op_default_rf_'+i).slider('value')});
                    if(i < $('#num_of_operator').val()) {
                        cmd += 'opadd ' + $('#op_name_' + i).val() + ' "' + $('#op_desc_' + i).val() + '" & ';
                    }else{
                        cmd += 'opadd ' + $('#op_name_' + i).val() + ' "' + $('#op_desc_' + i).val() + '"';
                    }
                }
                api.exe({
                    cmd: cmd,
                    async:false,
                    onSuccess:function(){
                        var filterquota='';
                        var cpriquota='';
                        var rfquota='';
                        var bandList =[];
                        api.exe({
                            cmd: 'bands --json',
                            dataType: 'json',
                            async: false,
                            onSuccess: function (o) {
                                $.each(o.ajaxdata.bands, function (i, band) {
                                    bandList.push(band.Band);
                                })
                                $.each(operatorList, function (i, operator) {
                                    //topology_command = 'topology -o ' + operator.SysName + ' --json';
                                    $.each(bandList, function (j, band) {
                                        rfquota += 'opset rfquota ' + operator.SysName +' default'+ ' ' + band +' '+operator.default_rf;
                                        if (i != operatorList.length - 1 && j === bandList.length - 1) {
                                            rfquota += " & ";
                                        }else if (i != operatorList.length - 1 && j != bandList.length - 1) {
                                            rfquota += " & ";
                                        }else if (i === operatorList.length - 1 && j != bandList.length - 1) {
                                            rfquota += " & ";
                                        }
                                    })
                                })
                            },
                            onError:function (err) {
                                axellPopUp(err.errorThrown);
                            }
                        })
                        for(var i =0; i<operatorList.length;i++) {
                            if(i < operatorList.length-1) {
                                filterquota +='opset filterquota ' + operatorList[i].SysName + ' default ' + operatorList[i].default_filter +" & ";
                                cpriquota +='opset cpriquota ' + operatorList[i].SysName + ' default ' + operatorList[i].default_cpri +" & ";
                            }else{
                                filterquota +='opset filterquota ' + operatorList[i].SysName + ' default ' + operatorList[i].default_filter +"";
                                cpriquota +='opset cpriquota ' + operatorList[i].SysName + ' default ' + operatorList[i].default_cpri +"";
                            }
                        }
                        api.exe({
                            cmd: filterquota,
                            async: false,
                            onSuccess: function () {
                                api.exe({
                                    cmd: cpriquota,
                                    async: false,
                                    onSuccess: function () {
                                        api.exe({
                                            cmd: rfquota,
                                            async: false,
                                            onSuccess: function () {
                                                //axellPopUp("Operators are set up successfully. You will be directed to the RF Settings page in a short while");
                                                //setTimeout(function () {
                                                    window.location.href = '/target/rfsettings/';
                                                //}, 3000)
                                            },
                                            onError: function (err) {
                                                axellPopUp(err.errorThrown);
                                            }
                                        })
                                    },
                                    onError: function (err) {
                                        axellPopUp(err.errorThrown);
                                    }
                                })
                            },
                            onError: function (err) {
                                axellPopUp(err.errorThrown);
                            }
                        })
                    },
                    onError:function(err){
                        axellPopUp(err.errorThrown);
                    }
                })

            }
        }
    })
