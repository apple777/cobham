require(['/js/api.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js', '/js/util.js','/js/lib/jquery_cookie.js','/js/handlebars-helpers.js','/js/lib/knockout.js','/js/lib/jquery-ui.js','/js/lib/jquery-jsPlumb.js'],
    function ( api, convert, console, _, $,util) {
        var SAFE_MARGIN = 60000;
        var WIDTH = 980;
        var MARGIN = 0;
        var LOWERDL;
        var UPPERDL;
        var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
        var USERACCESS = $.cookie('userAccess');
        var oprangeUnavailable = true;
        var bandList;
        var oprangesList;
        var registeredRfrangeList=[];
        var virtual;
        //refresh operator cookie
        function getBandDetails(data,band){
            var band;
            $.each(data, function(key, value){
                if(value.Band === band){
                    band = value;
                }
            })
            return band;
        }

	function validateUserData()
	{
		var sect_params ="";
        if($('#operator_list').val() !="")
        {
            sect_params = $('#operator_list').val()+" ";
        }
        else
        {
            axellPopUp("Error: No Operator Selected");
            return null;
        }
		if($('#band-select').val())
		{
			sect_params +=  $('#band-select').val() + " ";
		}
		else
		{
			axellPopUp("Error: No Band Selected");
			return null;
		}
		if($('#conn_type_table :radio:checked').val())
		{
			sect_params += $('#conn_type_table :radio:checked').val() + " ";
		}
		else
		{
			axellPopUp("Error: No Connection Type Selected");
			return null;
		}
        if($('#sector-tag').val() != "" && util.validateTag($('#sector-tag').val()))
        {
            var sector_tag = $('#sector-tag').val().replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
            sect_params +=  "\""+ sector_tag +"\"" + " ";
        }
        else
        {
            axellPopUp("Error: Invalid BTS Port Tag Specified");
            return null;
        }
        if($('#sector-bts-tag').val() != "" && util.validateTag($('#sector-bts-tag').val()))
        {
            var sector_tag = $('#sector-bts-tag').val().replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
            sect_params +=  "\""+ sector_tag +"\"";
        }
        else
        {
            axellPopUp("Error: Invalid Base Station Tag Specified");
            return null;
        }
        if(!oprangeUnavailable){
            axellPopUp("No available range assigned to this operator. <br>Please go to main menu -> RF Management or click <a href='/target/rfsettings/'>here</a>to allocate RF range to operators ");
            return null;
        }

		return sect_params;
	}
        function configBand(selector, start,stop){
            if(start != undefined && stop !=undefined) {
                $(selector).append('<div class="freq-indicator-range-min freq-indicator-range">' + convert.hz2mhz(start) + 'MHz</div>');
                $(selector).append('<div class="freq-indicator-range-max freq-indicator-range">' + convert.hz2mhz(stop) + 'MHz</div>');
            }
        }
        function addBand(selector, start,stop,key){
            var startPx = converter.convert( start );
            var stopPx = converter.convert( stop );
            //$(selector).append('<div class="ul-band-freq-indicator-bar band-freq-indicator-bar" data-number="' + (key+1) + '" data-du="uplink">' + (key+1) + '</div>');
            var target = $('<div id="freq-indicator-bar-'+key+'" class="freq-indicator-bar freq-indicator-bar" data-number="' + key + '"></div>');

            target.css( 'left', startPx ).width( stopPx - startPx )
                .attr( 'data-start', start)
                .attr( 'data-stop', stop )
                .attr( 'title', convert.hz2mhz(start,true) + '-' + convert.hz2mhz(stop,true) );
            target.addClass('disabled');
            $(selector).append(target);
        }
        $(document).ready(function(){
            var parameters = location.search.substring(1).split("&");
            if (parameters.length > 1)
               virtual = true; 
            else
               virtual = false;

            if (virtual)
               $('#conn_type_table').hide();

            //high light wizard step
            $('.wizard-step').removeClass('highlighted');
            $('#wizard-start').addClass('highlighted');
            $('#wizard-bts-port').addClass('highlighted');
            //if there is no band register to the system, not allow user to add sector
            api.exe({
                cmd:'bands --json',
                dataType:'json',
                onSuccess:function(o){
                    bandList = o.ajaxdata.bands;
                    api.exe({
                        cmd: 'rfranges --json',
                        dataType: 'json',
                        onSuccess: function (e) {
                            var rfrangeList = e.ajaxdata.nodes;
                            $.each(rfrangeList, function (key, node) {
                                if(node.NodeType.indexOf("MTDI") != -1){
                                    $.each(node.Ranges,function(i, range){
                                        $.each(bandList, function (key, band) {
                                            if (range.Type === band.Band) {
                                                registeredRfrangeList.push({"Band":band.Band,"FullName":band.FullName,"LowerDownLink":band.LowerDL,"UpperDownLink":band.UpperDL,"Duplex":band.Duplex})
                                            }
                                        })

                                    })
                                }
                            })
                            if (virtual)
                            {
                               $('#band-select').append($('<option>', {
                                 value: "",
                                 text: "Select"
                               }));
                               $.each(bandList, function (key, band) {
                                 $('#band-select').append($('<option>', {
                                     value: band.Band,
                                     text: band.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "")
                                 }));
                               })
                            }
                            else
                            {
                               registeredRfrangeList = registeredRfrangeList.uniqueObjects();
                               if(registeredRfrangeList.length>0) {
                                   $('#band-select').append($('<option>', {
                                       value: "",
                                       text: "Select"
                                   }));
                                   $.each(registeredRfrangeList, function (key, band) {
                                       $('#band-select').append($('<option>', {
                                           value: band.Band,
                                           text: band.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "")
                                       }));
                                   })
                               } else {
                                   axellPopUp("BTS port cannot be added when there is no valid hardware registered in the system.<br>You will be redirected to the main page in a short while");
                                   setTimeout(function () {
                                       window.location.href = "/target";
                                   }, 10000);
                               }
                            }
                        }
                    })
                }
            })

            //display operator list
            if(OPERATORLIST.length>1){
                $('#operator_list').append($('<option>', {
                    value: "",
                    text : "Select Operator"
                }));
            }
            $.each(OPERATORLIST, function(key, value){
                $('#operator_list').append($('<option>', {
                    value: value.SysName,
                    text : value.FullName
                }));
            })
            if($.cookie('currentOperator') !=null) {
                $('#operator_list option[value=' + $.cookie('currentOperator') + ']').attr("selected", "selected");
            }else{
                $('#operator_list option[value=' + $('#operator_list select:first').val() + ']').attr("selected", "selected");
                $.cookie('currentOperator', $('#operator_list').val(), { expires: 7, path: '/' });
            }

            //if user is read only, disabled all functionalities
            $.each(OPERATORLIST, function(key, value){
                if(value.SysName === $('#operator_list').val() && USERACCESS !="superuser"){
                    $('#add').addClass('disabled');
                }
            })
            //if change operator list, recheck access of user
            $('#operator_list').change(function(){
                $('#add').removeClass('disabled');
                $('#band-select option[value=""]').attr("selected", "selected");
                $('#band-freq-indicator').empty();
                //reset current operator cookie, if chang operator at this point
                $.removeCookie('currentOperator');
                $.cookie('currentOperator', $('#operator_list').val(), { expires: 7, path: '/' });
                $.each(OPERATORLIST, function(key, value){
                    if(value.SysName === $('#operator_list').val() && USERACCESS ==="RO"){
                        $('#add').addClass('disabled');
                    }
                })
            })
            $('#band-select').change(function () {
                if ($('#operator_list').val() != "") {
                    $('#band-freq-indicator').empty();
                    var band = getBandDetails(bandList, $(this).val());
                    LOWERDL = band.LowerDL;
                    UPPERDL = band.UpperDL;
                    configBand('#band-freq-indicator', LOWERDL, UPPERDL);
                    converter = new convert.RangeConvertion(LOWERDL - SAFE_MARGIN, Number(UPPERDL) + SAFE_MARGIN, MARGIN, WIDTH - MARGIN);
                    api.exe({
                        cmd:"opranges -o "+$('#operator_list').val()+ " --json",
                        dataType:'json',
                        onSuccess:function(o) {
                            oprangesList = o.ajaxdata.Rfrange;
                            if (oprangesList.length > 0) {
                                $.each(oprangesList, function (key, value) {
                                    if (value.Band === band.Band) {
                                        //console.log('add band');
                                        addBand('#band-freq-indicator', value.LowerDownLink, value.UpperDownLink, key);
                                        oprangeUnavailable = true;
                                    }
                                })
                            } else {
                                axellPopUp("There is no available range assigned to this operator");
                            }
                        }
                    })
                } else {
                    axellPopUp('Please chooose the operator');
                }
            })

            $('#add').click(function(){
                /*if(confirm("You have added sector successfully. Please add connections to sector")){
                    window.location = '/conn_wizard/index.html?lower=2620000000&upper=2690000000';
                }*/
                if(!$(this).hasClass('disabled')){
                    var user_data = validateUserData();
                    if(user_data != null)
                    {
                        api.exe({
                            cmd:'SECTOR ADD ' + user_data,
                            dataType:'text',
                            onSuccess:function(o){
                                var newSectorID = o.ajaxdata.split(' ')[1];
                                //console.log(newSectorID);
                                //set cookie for operator
                                window.location = '/target/conn_wizard/index.html?sectorid='+newSectorID+'&band='+$('#band-select').val()+'&conntype='+$('#conn_type_table :radio:checked').val()+'&virtual='+virtual;
                            },
                            onError:function(o){
                                axellPopUp(o.errorThrown);
                            }
                        })
                    }
                }
            })
            $('#cancel').click(function(){
                window.location.reload();
            })
        })
    })
