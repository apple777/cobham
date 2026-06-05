require(['/js/api.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js','/js/lib/handlebars.js','/js/handlebars-helpers.js','/js/lib/jquery-ui.js','/js/lib/jquery-jsPlumb.js'],
    function ( api, convert, console, _, $,Handlebars) {

        var $dialog;
        var $APOIconnectiondialog;
        var $MTDIconnectiondialog;
        var SAFE_MARGIN = 60000;
        var WIDTH = 980;
        var MARGIN = 40;
        var band_700_freq_list ={
            "bts_band_range":{
                "start":700000000,
                "stop":780000000
            },
            "band_freq":[
                {
                    "start":705000000,
                    "stop":720000000,
                    "center":712500000,
                    "span":15000000
                },
                {
                    "start":730000000,
                    "stop":750000000,
                    "center":740000000,
                    "span":10000000
                }]
        }
        function getBandDetails(data,band){
            var band;
            $.each(data, function(key, value){
                if(value.Band === band){
                    band = value;
                }
            })
            return band;
        }
        $(document).ready(function(){
            //display band select
            api.exe({
                cmd:'bands --json',
                dataType:'json',
                onSuccess:function(o){
                    $('#band-select').append($('<option>', {
                        value: "",
                        text : "Select"
                    }));
                    $.each(o.ajaxdata.bands, function(key, value){
                        $('#band-select').append($('<option>', {
                            value: value.Band,
                            text : value.FullName
                        }));

                    })
                    $('#band-select').change(function(){
                        var band = getBandDetails(o.ajaxdata.bands,$(this).val());
                        $('#startDL').val(band.LowerDL);
                        $('#stopDL').val(band.UpperDL);
                        $('#duplex').val(band.Duplex);
                    })
                }
            })

            api.exe({
                cmd:'sector --json',
                dataType:'json',
                onSuccess:function(o){
                    $('#sector-id').val("SECT_"+ o.ajaxdata.sector.length);
                }
            })

            $('#add').click(function(){
                /*if(confirm("You have added sector successfully. Please add connections to sector")){
                    window.location = '/conn_wizard/index.html?lower=2620000000&upper=2690000000';
                }*/
		var sect_params = "teliphone ";
		sect_params +=  $('#band-select').val() + " ";
		sect_params +=  $('#startDL').text() + " ";
		sect_params +=  $('#stopDL').text() + " ";
		sect_params +=  $('#duplex').text() + " ";
		sect_params += $('#conn_type_table :radio:checked').val() + " ";
		sect_params +=  $('#sector-tag').text() + " ";
		sect_params +=  $('#sector-bts-tag').text() + " ";
	        api.exe({
                cmd:'SECTOR ADD ' + sect_params,
                dataType:'json',
                onSuccess:function(o){
                    axellPopUp("Please Redirect Me To Add Connections");
                }
            })
            })

            /* display list of available sector
            api.exe({
                cmd:'sector --json',
                dataType:'json',
                onSuccess:function(o){
                    console.log(o.ajaxdata);
                    $.each(o.ajaxdata.sector, function(key, value){
                        $('#sector_list_select').append($('<option>', {
                            value: value.SectorID,
                            text : value.Tag
                        }));

                    })
                }
            })
            */
            /*
            $('#sector_content li').on('click', function(){
                $('.band_details').hide();
                $.each($('.freq-indicator-bar'),function(){
                    $('.freq-indicator-bar').addClass('disabled');
                })
            });

            $('.band_details').hide();
            $('#view_port').click(function(){
                if($('#sector-connections').val() === "APOI"){
                    $APOIconnectiondialog.dialog( 'open' );
                }else if($('#sector-connections').val() === "MTDI"){
                    $MTDIconnectiondialog.dialog( 'open' );
                }else{
                    axellPopUp("Please choose the connection type");
                }
            })
            $('#sector-connections').change(function(){
                if($(this).val() === "APOI"){
                    $APOIconnectiondialog.dialog( 'open' );
                }else if($(this).val() === "MTDI"){
                    $MTDIconnectiondialog.dialog( 'open' );
                }
            })

            displayBTSBand('#bts-freq-indicator');
            var APOIposition =  $('#sector-APOI').position();
            var MTDIposition =  $('#sector-APOI').position();

            for(var j =1; j<=8;j++){
                $('#sector-APOI').append('<div id="sector-APOIport-'+j+'" class="port" title="APOI port '+ j+'"></div>');
                $('#sector-APOIport-'+j).css('top',APOIposition.top+80+'px');
                $('#sector-APOIport-'+j).css('left',APOIposition.left+15+j*55+j+'px');

                $('#sector-MTDI').append('<div id="sector-MTDIport-'+j+'" class="port" title="MTDI port '+ j+'"></div>');
                $('#sector-MTDIport-'+j).css('top',MTDIposition.top+80+'px');
                $('#sector-MTDIport-'+j).css('left',MTDIposition.left+15+j*55+j+'px');
            }

            $.each($('.band-indicator-bar'),function(){
                $('.band-indicator-bar').addClass('disabled');
            })

            $('.band-indicator-bar').click(function(){
                $('#sector-band-freq-indicator').empty();
                $.each($('.band-indicator-bar'),function(){
                    $('.band-indicator-bar').addClass('disabled');
                })
                $('.band_details').show();
                $('caption#band_config_caption').text('Frequency '+$(this).text()+' Configuration');
                $(this).removeClass('disabled');

                //populate band frequency indicator from json data
                configBand('#sector-band-freq-indicator',band_700_freq_list["bts_band_range"]["start"],band_700_freq_list["bts_band_range"]["stop"]);
                $('#sector-band-freq-indicator').attr('data-count',band_700_freq_list["band_freq"].length);

                $.each(band_700_freq_list["band_freq"],function(key, value){
                    addBand('#sector-band-freq-indicator', value.start,value.stop,key);
                })
            })

            $('.port').click(function(){
                $('.port').css('border','3px solid green');
                $('#'+$(this).parent().attr('id')+'-connection-port-number').text($(this).attr('title'));
                $(this).css('border','3px solid yellowgreen');
            })

            $('.button.config-band-btn').click(function(){
                $('#'+$(this).attr('sector-id')+'-band-freq-indicator').empty();
                var start = $('#'+$(this).attr('sector-id')+'-band-start').val();
                var stop = $('#'+$(this).attr('sector-id')+'-band-stop').val();
                if(start !="" && stop !=""){
                    configBand('#'+$(this).attr('sector-id')+'-band-freq-indicator',start,stop);
                }else{
                    axellPopUp("Please fill in start and stop frequency of the band");
                }
            })

            $('.button.add-band-btn').click(function(){
                $dialog.dialog( 'option', 'title', $(this).closest('table').find('caption').text());
                $dialog.dialog( 'open' );
            })

            //dialog box
            $dialog = $( '#band-frequency-editor-contents' ).dialog({
                width : 450,
                resizable : false,
                autoOpen : false,
                buttons:{
                    'Cancel': function () {
                        $dialog.dialog( 'close' );
                    },
                    'OK' : function () {
                        console.log("OK")
                    }
                }
            });

            $APOIconnectiondialog = $( '#APOI_connection_select_content' ).dialog({
                width : 700,
                resizable : false,
                autoOpen : false,
                buttons:{
                    'Cancel': function () {
                        $APOIconnectiondialog.dialog( 'close' );
                    },
                    'OK' : function () {
                        $APOIconnectiondialog.dialog( 'close' );
                    }
                }
            });
            $MTDIconnectiondialog = $( '#MTDI_connection_select_content' ).dialog({
                width : 700,
                resizable : false,
                autoOpen : false,
                buttons:{
                    'Cancel': function () {
                        $MTDIconnectiondialog.dialog( 'close' );
                    },
                    'OK' : function () {
                        $MTDIconnectiondialog.dialog( 'close' );
                    }
                }
            });
            */

        })
        /*
        function displayBTSBand(selector){
            $(selector).width(WIDTH);
            api.exe({
                cmd:"get bbf",
                onSuccess:function(o){
                    var bandList = o.ajaxdata.split(" ");
                    var ratio = (WIDTH - (bandList.length*50)) / (bandList[bandList.length-1] - bandList[0]);
                    $.each(bandList,function(key, value){
                        if(key >0){
                            var marginLeft = (value - bandList[key-1]) * ratio;
                            console.log("margin left "+ marginLeft);
                        }else{
                            var marginLeft =0;
                        }
                        $(selector).append('<div id="band-'+(key+1)+'-indicator" class="band-indicator-bar disabled">'+value+' MHz</div>');
                        $('#band-'+(key+1)+'-indicator').css('margin-left',marginLeft);
                    })
                }
            })
        }

        function configBand(selector, start,stop){
            $(selector).append( '<div class="band-freq-indicator-range-ul-min band-freq-indicator-range">' + start + 'MHz</div>' );
            $(selector).append( '<div class="band-freq-indicator-range-ul-max band-freq-indicator-range">' + stop + 'MHz</div>' );
        }

        function addBand(selector, start,stop,key){
            var converter = new convert.RangeConvertion( band_700_freq_list["bts_band_range"]["start"] - SAFE_MARGIN, band_700_freq_list["bts_band_range"]["stop"] + SAFE_MARGIN, MARGIN, WIDTH - MARGIN );
            var startPx = converter.convert( start );
            var stopPx = converter.convert( stop );
            //$(selector).append('<div class="ul-band-freq-indicator-bar band-freq-indicator-bar" data-number="' + (key+1) + '" data-du="uplink">' + (key+1) + '</div>');
            var target = $('<div class="ul-band-freq-indicator-bar band-freq-indicator-bar" data-number="' + (key+1) + '" data-du="uplink">' + (key+1) + '</div>');

            console.log(target);
            target.css( 'left', startPx ).width( stopPx - startPx )
                .attr( 'data-start', start)
                .attr( 'data-stop', stop )
                .attr( 'title', start + '-' + stop );
            target.addClass('disabled');
            $(selector).append(target);
        }
        */
    })
