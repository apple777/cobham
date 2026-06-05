require([ '/js/api.js','/js/lib/jquery.js','/js/lib/jquery-ui.js'], function ( api,$ ) {

    var USERACCESS = $.cookie('userAccess');
    var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
    var bandList = [];
    var techList =[];
    var data=[]
    var unSaved = false;
    var dl_alc_max_value = 0.0;
    var ul_alc_max_value = 0.0;
    var ul_gain_max_value = 0.0;
    var dl_alc_min_value = -10.0;
    var ul_alc_min_value = -10.0;
    var ul_gain_min_value = -10.0;
    $(document).ready(function() {
        $('#save-button').addClass('disabled');
        //display operator list
        if(OPERATORLIST.length >0) {
            $.each(OPERATORLIST, function (key, value) {
                $('#operator_name').append($('<option>', {
                    value: value.SysName,
                    text: value.FullName
                }));
            });
        }
        $('#operator_name').change(function(){
            if(unSaved) {
                axellConfirm("info","Notice","There is unsaved changes. Are you sure you want to leave this page?", function () {
                    reloadData();
                })
            }else{
                reloadData();
            }
        })
        reloadData();
        $('#save-button').click(function(){
            if(!$(this).hasClass('disabled')){
                saveAll();
            }
        })

        window.onbeforeunload = function(){
            if(unSaved) {
                return "There is unsaved changes. Are you sure you want to leave this page?";
            }
        }
        if(USERACCESS =="RO"){
            $('#save-button').addClass('disabled');
        }
    })

    function reloadData(){
        $('#save-button').addClass('disabled');
        unSaved = false;
        api.exe({
            cmd:'bands --json',
            dataType:'json',
            onSuccess:function(o){
                bandList = o.ajaxdata.bands;
                //get value to table
                api.exe({
                    cmd:'rfnominal -o '+$('#operator_name').val() +' --json',
                    dataType:'json',
                    onSuccess:function(o){
                        data = o.ajaxdata;
                        formRRUTable(bandList,data);
                        formMTDITable(bandList,data);
                    }
                })
            }
        })
    }

    function saveAll(){
        //save changes
        var rru_list = '';
        var mtdi_list = '';
        //rfnominal -o oper2 rru 2600 lte 90 50
        //save for rru
        $('.rru.offset_cell').each(function (i) {
            if (i < $('.rru.offset_cell').length - 1) {
                rru_list += 'rfnominal -o ' +  $('#operator_name').val() + ' rru '+ $(this).attr('band')+' '+ $(this).find('.dl_alc_offset.ui-slider').slider('value')*10 +' '+ $(this).find('.ul_gain_offset.ui-slider').slider('value')*10 + ' & ';
            } else {
                rru_list += 'rfnominal -o ' +  $('#operator_name').val() + ' rru '+ $(this).attr('band')+' '+ $(this).find('.dl_alc_offset.ui-slider').slider('value')*10 +' '+ $(this).find('.ul_gain_offset.ui-slider').slider('value')*10;
            }
        })
        $('.mtdi.offset_cell').each(function (i) {
            if (i < $('.mtdi.offset_cell').length - 1) {
                mtdi_list += 'rfnominal -o ' +  $('#operator_name').val() + ' mtdi '+ $(this).attr('band')+' '+ $(this).find('.ul_alc_offset.ui-slider').slider('value')*10 + ' & ';
            } else {
                mtdi_list += 'rfnominal -o ' +  $('#operator_name').val() + ' mtdi '+ $(this).attr('band')+' '+ $(this).find('.ul_alc_offset.ui-slider').slider('value')*10;
            }
        })
        api.exe({
            cmd: rru_list +' & '+ mtdi_list,
            onSuccess: function () {
                reloadData()
                $('#save-button').addClass('disabled');
            },
            onError: function (e) {
                console.log(e.errorThrown);
            }
        })
        unSaved = false;
    }


    function formRRUTable(bandList,data){
        $('#rru_rfnominal_plcholder').empty();
        var html ="<table id='rru_table' class='rf_nominal_table type1'>";
        html +="<tr><th>Band</th><th>DL ALC Offset <div class='icon help' title='Downlink ALC offset is number of dB below maximum operator level (the nominal ALC level), which a cell resource in idRemote downlink path should be adjusted towards'></div></th>" +
            "<th>UL Gain Offset <div class='icon help' title='Uplink gain offset is the offset in dB, which the uplink gain should be set to, compared to the downlink gain. Offset < 0 means higher gain in uplink than downlink' ></div></th></tr>";
        $.each(bandList,function(k, band){
            html += "<tr class='rru offset_cell' band='"+band.Band+"'><th title='"+band.FullName+"'>"+band.Band+"</th>";
            html += "<td><div class='dl_alc'>" +
                "<div id='dl_alc_"+band.Band+"_slider' class='dl_alc_offset'></div>" +
                "<input id='dl_alc_"+band.Band+"_input' class='dl_alc_offset_input' type='text'/> dB</div></td>" +
                    "<td><div class='ul_gain'>" +
                "<div id='ul_gain_"+band.Band+"_slider' class='ul_gain_offset'></div>" +
                "<input id='ul_gain_"+band.Band+"_input' class='ul_gain_offset_input' type='text'/> dB</div></td>";
            html += "</tr>";
        })
        html +="</table>";
        $('#rru_rfnominal_plcholder').append(html);

        $('.dl_alc_offset').slider({
            range: "min",
            step:0.1,
            min: dl_alc_min_value,
            max: dl_alc_max_value,
            slide: function( event, ui ) {
                $('#save-button').removeClass('disabled');
                unSaved = true;
                $(this).parent().find('.dl_alc_offset_input').val(ui.value.toFixed(1));
            }
        })
        $('.ul_gain_offset').slider({
            range: "min",
            step:0.1,
            min: ul_gain_min_value,
            max: ul_gain_max_value,
            slide: function( event, ui ) {
                $('#save-button').removeClass('disabled');
                unSaved = true;
                $(this).parent().find('.ul_gain_offset_input').val(ui.value.toFixed(1));
            }
        })
        //set value to slider and input
        $.each(data.RRU,function(i,level){
            $('#dl_alc_'+level.Band+'_slider').slider('value', (level.DL_ALC_Offset/10).toFixed(1));
            $('#ul_gain_'+level.Band+'_slider').slider('value', (level.UL_Gain_Offset/10).toFixed(1));
            $('#dl_alc_'+level.Band+'_input').val((level.DL_ALC_Offset/10).toFixed(1))
            $('#ul_gain_'+level.Band+'_input').val((level.UL_Gain_Offset/10).toFixed(1));
        })
        //allocate quota by key in input box instead of sliding
        $('.ul_gain_offset_input').change(function(){
            $('#save-button').removeClass('disabled');
            unSaved = true;
            //if allocated more than total 100%, alert
            if(Number($(this).val()) >ul_gain_max_value || Number($(this).val()) < ul_gain_min_value || isNaN($(this).val())){
                axellPopUp('Please enter valid level');
                $(this).val(ul_gain_min_value);
                $(this).closest('td').find('.ul_gain_offset.ui-slider').slider('value',ul_gain_min_value);
            }else{
                $(this).closest('td').find('.ul_gain_offset.ui-slider').slider('value',$(this).val());
            }
        })

        $('.dl_alc_offset_input').change(function(){
            $('#save-button').removeClass('disabled');
            unSaved = true;
            //if allocated more than total 100%, alert
            if(Number($(this).val()) >dl_alc_max_value || Number($(this).val()) < dl_alc_min_value || isNaN($(this).val())){
                axellPopUp('Please enter valid level');
                $(this).val(dl_alc_min_value);
                $(this).closest('td').find('.dl_alc_offset.ui-slider').slider('value',dl_alc_min_value);
            }else{
                $(this).closest('td').find('.dl_alc_offset.ui-slider').slider('value',$(this).val());
            }
        })

        //if RO user, disable slider and input field
        if(USERACCESS =="RO"){
            $('.ui-slider').slider('option','disabled',true);
            $('input').attr('disabled',true);
        }
    }


    function formMTDITable(bandList,data){
        $('#mtdi_rfnominal_plcholder').empty();
        var html ="<table id='mtdi_table' class='rf_nominal_table type1'>";
        html +="<tr><th>Band</th><th>UL ALC Offset <div class='icon help' title='Uplink ALC offset is number of dB below maximum operator level (the nominal ALC level), which a cell resource in MTDI uplink path should be adjusted towards.'></div></th><th></th></tr>";
        $.each(bandList,function(k, band){
            html += "<tr><th title='"+band.FullName+"'>"+band.Band+"</th>";
            html += "<td class='mtdi offset_cell' band='"+band.Band+"'><div class='ul_alc'>" +
                "<div id='ul_alc_"+band.Band+"_slider' class='ul_alc_offset'></div>" +
                "<input id='ul_alc_"+band.Band+"_input' class='ul_alc_offset_input' type='text'/> dB</div></td><td></td>";
            html += "</tr>";
        })
        html +="</table>";
        $('#mtdi_rfnominal_plcholder').append(html);

        $('.ul_alc_offset').slider({
            range: "min",
            step:0.1,
            min: ul_alc_min_value,
            max: ul_alc_max_value,
            slide: function( event, ui ) {
                $('#save-button').removeClass('disabled');
                unSaved = true;
                $(this).parent().find('.ul_alc_offset_input').val(ui.value.toFixed(1));
            }
        })
        //set value to slider and input
        $.each(data.MTDI,function(i,level){
            $('#ul_alc_'+level.Band+'_slider').slider('value', (level.UL_ALC_Offset/10).toFixed(1));
            $('#ul_alc_'+level.Band+'_input').val((level.UL_ALC_Offset/10).toFixed(1))
        })
        $('.ul_alc_offset_input').change(function(){
            $('#save-button').removeClass('disabled');
            unSaved = true;
            //if allocated more than total 100%, alert
            if(Number($(this).val()) >ul_alc_max_value || Number($(this).val()) < ul_alc_min_value || isNaN($(this).val())){
                axellPopUp('Please enter valid level');
                $(this).val(ul_alc_min_value);
                $(this).closest('td').find('.ui-slider').slider('value',ul_alc_min_value);
            }else{
                $(this).closest('td').find('.ui-slider').slider('value',$(this).val());
            }
        })
        //if RO user, disable slider and input field
        if(USERACCESS =="RO"){
            $('.ui-slider').slider('option','disabled',true);
            $('input').attr('disabled',true);
        }
    }

});

