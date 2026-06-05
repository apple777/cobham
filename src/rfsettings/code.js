require([ '/js/api.js','/js/convert.js','/js/util.js','/js/lib/jquery_cookie.js' ], function ( api, convert,util) {
    var SAFE_MARGIN = 60000;
    var MAXWIDTH = 980;
    var MARGIN = 0;
    var USERACCESS = $.cookie('userAccess');
    var OPERATORS = $.parseJSON($.cookie('operatorCook'));
    //localStorage.operatorRegion setItem - set default item
    var REGION = localStorage.operatorRegion;
    var COLORLEGEND = ['#C1F7BB','#F7BBBB','#BBF6F7','#F7F1BB','#1A4FC9','#C9A21A','#1AC9A9','#C9391A'];
    var $add_range_dialog;
    var $edit_range_dialog;

    /*
     Americas 700/850/1700/1900
     EMEA 800/900/1800/2100/2600
     APAC  900/1800/2100/2600
    */
    //hard code band by region

    $(document).ready(function() {
        var referrer =  document.referrer;
        //if comes from initial setup page, display message tell them to add rf setting for each operator
        if(referrer.indexOf('initial_setup') != -1){
            axellPopUp("Operators added successfully. Please configure RF ranges for each operator");
        }
        if(referrer.indexOf('useradmin') !=-1){
            $('#back_to_useradmin').show();
        }
        //highlight wizard steps
        $('.wizard-step').removeClass('highlighted');
        $('#wizard-spectrum').addClass('highlighted');
        $('#next').click(function(){
            window.location.href = "/target/quotas";
        })

        $('#add_opranges_dialog').hide();
        //if operator list have not been updated, call operator to update the list
        if(OPERATORS.length === 0){
            api.exe({
                cmd:'operators --json',
                onSuccess:function(o) {
                    var operatorList = $.parseJSON(o.ajaxdata);
                    var OPERATOR = [];
                    $.each(operatorList.operators, function (key, value) {
                        OPERATOR.push(value);
                    })
                    OPERATORS = OPERATOR;
                }
            })
        }


        //init add/edit range dialog
        $add_range_dialog =$( '#add_opranges_dialog' ).dialog({
            width : 450,
            height:250,
            resizable : false,
            autoOpen : false,
            buttons:{
                'Cancel': function () {
                    $add_range_dialog.dialog( 'close' );
                },
                'Add' : function () {
                    var isOverlapped;
                    //call add command
                    var lowerDL = Number($('#range-start').val())*1000000;
                    var upperDL = Number($('#range-stop').val())*1000000;
                    var duplex = Number($('#duplex').val())*1000000;
                    //checking for overlapped
                    $.each(OPERATORS,function(index, operator){
                        $.each(operator.Ranges,function(key, value){
                            //console.log(lowerDL +" "+ value.LowerDownLink);
                            //console.log(upperDL +" "+ value.UpperDownLink);
			                   if(value.Band == "2301" || value.Band == "2302"){
                                isOverlapped = false;
			                   }
                            else if(operator.SysName == $('#operator-select').val()){
                                isOverlapped = false;
			                   }
                            else if((lowerDL > value.LowerDownLink  && lowerDL < value.UpperDownLink)||
                                (lowerDL >= value.LowerDownLink  && upperDL <= value.UpperDownLink)||
                                (upperDL > value.LowerDownLink  && upperDL < value.UpperDownLink)||
                                (lowerDL <= value.LowerDownLink  && upperDL >= value.UpperDownLink)) {
                                isOverlapped = true;
                                return false;
                            }else{
                                isOverlapped = false;
                            }
                        })
                        return false;
                    })
                    if($('#operator-select').val()===""){
                        alert('Please choose the operator you want to add RF range to');
                    }else if($('#freq-tag').val()===""){
                        alert('Please fill in a tag for the RF range');
                    }else if($add_range_dialog.find('.erroneous').exists()){
                        alert('Please fill in correct range');
                    }else if($('#range-start').val() === ""){
                        alert('Please fill in start and stop range');
                    }else if($('#range-stop').val() === ""){
                        alert('Please fill in start and stop range');
                    }else{
                        if(!isOverlapped){
                            api.exe({
                                //OPRANGES ADD 725100000 727800000 2100000
                                 cmd:'opranges -o '+$('#operator-select').val()+' add '+ $(this).data('band')+' '+lowerDL +' '+upperDL+' '+duplex+' "'+$('#freq-tag').val()+'"',
                                 onSuccess:function(){
                                     //reload table and bar
                                     loadOpranges($('input[name="regions"]:radio:checked').val());
                                     $add_range_dialog.dialog( 'close' );
                                     //new code -> next time tag field will be empty 
                                      $( '#freq-tag').val("");
                                 },
                                 onError:function(err){
                                    axellPopUp(err.errorThrown);
                                 }

                            })
                        }else{
                            alert('Range specified is overlapped with one of the existing ranges');
                        }

                    }
                }
            }
        })

        $edit_range_dialog =$( '#edit_opranges_dialog' ).dialog({
            width : 450,
            height:250,
            resizable : false,
            autoOpen : false,
            buttons:{
                'Cancel': function () {
                    $(this).dialog( 'close' );
                },
                'Save' : function () {
                    //call add command
                    var lowerDL = Number($('#edit-range-start').val())*1000000;
                    var upperDL = Number($('#edit-range-stop').val())*1000000;
                    var duplex = Number($('#edit-duplex').val())*1000000;

                    if($edit_range_dialog.find('.erroneous').exists()){
                        alert('Please field in correct range');
                    }else if($('#edit-range-start').val() === ""){
                        alert('Please fill in start and stop range');
                    }else if($('#edit-range-stop').val() === ""){
                        alert('Please fill in start and stop range');
                    }else{
                            api.exe({
                                cmd:'opranges -o '+$('#edit-operator-select').val()+' update '+ $(this).data('range') +' '+$(this).data('band')+' '+lowerDL +' '+upperDL+' '+duplex+' "'+$('#edit-freq-tag').val()+'"',
                                onSuccess:function(){
                                    //reload table and bar
                                    loadOpranges($('input[name="regions"]:radio:checked').val());
                                    $edit_range_dialog.dialog( 'close' );
                                },
                                onError:function(){
                                    alert(this.errorThrown);
                                    $edit_range_dialog.dialog( 'close' );
                                }
                            })

                    }
                }
            }
        })

        //display opranges bar and table
        if (!localStorage.operatorRegion){
            //after logout and login setItem
            localStorage.operatorRegion = "AMER";
        }
        loadOpranges(localStorage.operatorRegion);
        //loadOpranges($('input[name="regions"]:radio:checked').val());
        $(document).off("click",'.icon.minmaxbutton')
            .on("click",'.icon.minmaxbutton',function(){
                var band = $(this).parent().attr('id');
                if($(this).hasClass('maximize')){
                    $('#'+band+'-freq-indicator').show();
                    $('#'+band+'_ranges').show();
                    $(this).removeClass('maximize').addClass('minimize');
                }else{
                    $('#'+band+'-freq-indicator').hide();
                    $('#'+band+'_ranges').hide();
                    $(this).addClass('maximize').removeClass('minimize');
                }
            })
        //click on filter
        //console.log($('input[name="regions"]:radio:checked').val());
        $('input[name="regions"]:radio').on('change',function(){
            loadOpranges($('input[name="regions"]:radio:checked').val());
        })

        $(document).on("click",'.delete_opranges',function(){
            var rangeIndex = $(this).attr('range-id');
            var operator = $(this).attr('operator');
            var band = $(this).attr('band-id');
            console.log('delete range '+ rangeIndex +" of operator "+operator);
            //check if there is any sector found within this range before allowing for deleting
            api.exe({
                cmd:'sector -o '+operator+' --json',
                async:false,//need to disable asynchronous so that this check is perform before everything is appended to DOM
                dataType:'json',
                onSuccess:function(o) {
                    //go through sector list of that operator, check if there is any sector found in the range
                    //if yes, disable delete button
                    if(_.contains(_.pluck(o.ajaxdata.sector, "Band"),band)){
                        var sectList = _.pluck(_.filter(o.ajaxdata.sector,function(sect){
                            if(sect.Band == band) {
                                return sect.SectorID
                            }
                        }),"SectorID");
                        axellPopUp("The range cannot be deleted. It is used by following BTS port(s): "+sectList);
                    }else{
                        axellConfirm("info","Notice",'Are you sure you want to delete range '+rangeIndex +' of '+ _.where(OPERATORS,{"Sysname":operator}),function(){
                            api.exe({
                                cmd:'opranges -o '+operator+' remove '+rangeIndex,
                                onSuccess:function(){
                                    console.log('Delete range successfully');
                                    loadOpranges($('input[name="regions"]:radio:checked').val());
                                },
                                onError:function(){
                                    console.log('Error executing: opranges -o '+operator+' remove '+rangeIndex +': '+this.errorThrown);
                                }
                            })
                        },$add_range_dialog.dialog('close'));
                    }
                }
            })

        })

        $(document).on("click",'.edit_opranges',function(){
            var bandID = $(this).attr('band-id');
            var rangeID = $(this).attr('range-id');
            var start = $(this).attr('start');
            var stop = $(this).attr('stop');
            var tag = $(this).attr('tag');
            var operator = $(this).attr('operator');
            showAddRangeDialog(bandID,true,start,stop,tag,rangeID,operator);
        })


        $(document).on("click",'.add_opranges',function(){
            var bandID = $(this).attr('band-id');
            showAddRangeDialog(bandID,false);
        })

    });

    function showAddRangeDialog(band,isEdit,start,stop,tag,range,operator){
        var bandList =[];
        var rfBlock =[];
        api.exe({
            cmd:'bands --json',
            async:false,
            dataType:'json',
            onSuccess:function(o){
                bandList = o.ajaxdata;
            }
        })
        //in case of edit
        if(isEdit){
            $edit_range_dialog.dialog('option', 'title', 'Edit Operator RF Range');
            $edit_range_dialog.data('band', band);
            $edit_range_dialog.data('range', range);
            $edit_range_dialog.data('isEdit', isEdit);
            $( '#edit-range-start' ).val(start);
            $( '#edit-range-stop' ).val(stop);
            $( '#edit-freq-tag' ).val(tag);
            //display operator list
            $('#edit-operator-select').empty();
            if(OPERATORS.length>1) {
                $('#edit-operator-select').append($('<option>', {
                    value: "",
                    text: 'Select'
                }));
            }
            $.each(OPERATORS,function(key, value){
                $('#edit-operator-select').append($('<option>', {
                    value: value.SysName,
                    text : value.FullName
                }));
            })
            $('#edit-operator-select').val(operator);

            //display rfblock select
            $('#edit-freqblock-select').empty();
            $('#edit-freqblock-select').append($('<option>', {
                value: "99",
                text: 'None'
            }));
            //get rfblock of the selected band and operator
            api.exe({
                cmd: 'freqblocks -o ' + operator + ' ' + band + ' --json',
                dataType: 'json',
                onSuccess: function (o) {
                    rfBlock =[];
                    rfBlock = o.ajaxdata.FreqBlocks;
                    $.each(rfBlock, function (key, value) {
                        console.log(convert.hz2mhz(value.LowerDownLink) );
                        console.log(start);
                        console.log(convert.hz2mhz(value.LowerDownLink) === start)
                        $('#edit-freqblock-select').append($('<option>', {
                            value: value.index,
                            text: value.FilterName
                        }));
                        if(convert.hz2mhz(value.LowerDownLink) === start && convert.hz2mhz(value.UpperDownLink)===stop){
                            $('#edit-freqblock-select').val(value.index);
                        }
                    })
                },
                onError: function (err) {
                    axellPopUp(err.errorThrown);
                }
            })
            //on event of change rfblock
            $('#edit-freqblock-select').unbind('change').bind('change',function(){
                
                $( '#edit-range-start').val(convert.hz2mhz(_.findWhere(rfBlock,{"index":Number($(this).val())}).LowerDownLink));
                $( '#edit-range-stop').val(convert.hz2mhz(_.findWhere(rfBlock,{"index":Number($(this).val())}).UpperDownLink));
                $( '#edit-freq-tag').val( _.findWhere(rfBlock,{"index":Number($(this).val())}).FilterName);
            })
            $.each(bandList.bands,function(key, value){
                if(value.Band === band){
                    $( '.band-range-hint' ).text(convert.hz2mhz(value.LowerDL) + '-' + convert.hz2mhz(value.UpperDL));
                    $( '.validation-range' ).attr( 'min', convert.hz2mhz(value.LowerDL) ).attr( 'max', convert.hz2mhz(value.UpperDL) );
                    $('#edit-duplex').val(convert.hz2mhz(value.Duplex));
                    var desc = value.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "");
                    $('#band-id').text(desc);
                }
            })
            $start = $( '#edit-range-start' );
            $stop = $( '#edit-range-stop' );
            // validateAll(); Stoopid Fredrik complains on validating alphas at start!
            //force numberic input accept only numeric and .
            util.numericInput($start);
            util.numericInput($stop);
            //event handler
            $start.keyup( function () {
                validateAll();
            });
            $stop.keyup( function () {
                validateAll();
            });
            $('#edit-operator-select').attr("disabled",true);
            $edit_range_dialog.dialog('open');
        }else {
            $add_range_dialog.dialog('option', 'title', 'Add Operator RF Range');
            $add_range_dialog.data('band', band);
            $add_range_dialog.data('isEdit', isEdit);
            //display operator list
            $('#operator-select').empty();
            if(OPERATORS.length>1) {
                $('#operator-select').append($('<option>', {
                    value: "",
                    text: 'Select'
                }));
            }
            $.each(OPERATORS,function(key, value){
                $('#operator-select').append($('<option>', {
                    value: value.SysName,
                    text : value.FullName
                }));
            })
            //display rfblock select
            $('#freqblock-select').empty();
            $('#freqblock-select').append($('<option>', {
                value: "99",
                text: 'None'
            }));
            //in case there is only one operator, show rfblock for it
            if($('#operator-select').val() !="") {
                api.exe({
                    cmd: 'freqblocks -o ' + $('#operator-select').val() + ' ' + band + ' --json',
                    dataType: 'json',
                    onSuccess: function (o) {
                        rfBlock =[];
                        rfBlock = o.ajaxdata.FreqBlocks;
                        $.each(rfBlock, function (key, value) {
                            $('#freqblock-select').append($('<option>', {
                                value: value.index,
                                text: value.FilterName
                            }));
                        })
                    },
                    onError: function (err) {
                        axellPopUp(err.errorThrown);
                    }
                })
            }

            //get rfblock of the selected band
            $('#operator-select').unbind('change').bind('change',function(){
                $('#freqblock-select').empty();
                $('#freqblock-select').append($('<option>', {
                    value: "99",
                    text: 'None'
                }));
                if($(this).val() !="") {
                    api.exe({
                        cmd: 'freqblocks -o ' + $('#operator-select').val() + ' ' + band + ' --json',
                        dataType: 'json',
                        onSuccess: function (o) {
                            rfBlock =[];
                            rfBlock = o.ajaxdata.FreqBlocks;
                            $.each(rfBlock, function (key, value) {
                                $('#freqblock-select').append($('<option>', {
                                    value: value.index,
                                    text: value.FilterName
                                }));
                            })
                        },
                        onError: function (err) {
                            axellPopUp(err.errorThrown);
                        }
                    })
                }
            })
            //on event of change rfblock
            $('#freqblock-select').unbind('change').bind('change',function(){
                if( $( '#freqblock-select').val() == 99)//None option 
                {
                  $( '#freq-tag').val("");
                  $( '#range-start').val("");
                  $( '#range-stop').val("");

                }
                else {
                $( '#range-start').val(convert.hz2mhz(_.findWhere(rfBlock,{"index":Number($(this).val())}).LowerDownLink));
                $( '#range-stop').val(convert.hz2mhz( _.findWhere(rfBlock,{"index":Number($(this).val())}).UpperDownLink));
                $('#freq-tag').val( _.findWhere(rfBlock,{"index":Number($(this).val())}).FilterName);
                }
            })
            $.each(bandList.bands,function(key, value){
                if(value.Band === band){
                    $( '.band-range-hint' ).text(convert.hz2mhz(value.LowerDL) + '-' + convert.hz2mhz(value.UpperDL));
                    $( '.validation-range' ).attr( 'min', convert.hz2mhz(value.LowerDL) ).attr( 'max', convert.hz2mhz(value.UpperDL) );
                    $('#duplex').val(convert.hz2mhz(value.Duplex));
                    var desc = value.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "");
                    $('#band-id').text(desc);
                }
            })

            $start = $( '#range-start' );
            $stop = $( '#range-stop' );
            // validateAll(); Stoopid Fredrik complains on validating alphas at start!
            //force numberic input accept only numeric and .
            util.numericInput($start);
            util.numericInput($stop);
            //event handler
            $start.keyup( function () {
                validateAll();
            });
            $stop.keyup( function () {
                validateAll();
            });
            $( '#range-start' ).val("");
            $( '#range-stop' ).val("");
            $add_range_dialog.dialog('open');
        }
    }

    function loadOpranges(chosenRegion){
        $('#freq_range_contents').empty();
        $('#legend').empty();
        api.exe({
            cmd:'bands --json',
            dataType:'json',
            onSuccess:function(o){
                var bandList = o.ajaxdata.bands;
                $.each(OPERATORS, function(key, operator){
                    api.exe({
                        cmd:'opranges -o '+ operator.SysName+' --json',
                        async:false,
                        dataType:'json',
                        onSuccess:function(e){
                            var oprangesList = e.ajaxdata.Rfrange;
                            _.extend(operator, {"Ranges":oprangesList});

                            //display legend for operator ranges' color if multi user
                            if(OPERATORS.length>1){
                                $('#legend').append('<div id="'+key+'_legend" class="legend_color"></div><span>'+operator.FullName+'</span>');
                            }
                        }
                    })
                })
                $.each(bandList,function(index1,band){
                    var operatorRangeList=[];
                    $.each(OPERATORS,function(index2,ranges){
                        var rangeList =[];
                        $.each(ranges.Ranges, function(index3, range){
                            if(band.Band === range.Band){
                                rangeList.push(range);
                            }
                        })
                        operatorRangeList.push({"Operator":ranges.SysName,"FullName":ranges.FullName,"Ranges":rangeList});
                    })
                    _.extend(band, {"Operators":operatorRangeList});
                })
                //console.log(bandList);

                //find the maximum range that max width represents
                var maxRangeItem = _.max(bandList, function(band){ return band.UpperDL - band.LowerDL; });
                var maxRange = maxRangeItem.UpperDL - maxRangeItem.LowerDL;
                var corrFactorAlreadySet = false;
                // localStorage.operatorRegion setItem according click for render checkbox
                localStorage.setItem("operatorRegion", chosenRegion);
                // localStorage.operatorRegion getItem for render checkbox
                $('#filter').find("input[value='"+localStorage.operatorRegion+"']").prop('checked',true);
                $.each(bandList,function(index, value){
                    //filter out by region
                     if ((chosenRegion == "all") || (value.AMER == "1" && chosenRegion == "AMER") || (value.EMEA == "1" && chosenRegion == "EMEA") || (value.APAC == "1" && chosenRegion == "APAC")) {
                         //draw the whole band and scale accordingly
                         var corrFactorSet = false;
                         var desc = value.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "");
                         var band_header = '<div id ="' + value.Band + '" class ="table_header"><div class="icon minmaxbutton maximize"></div>' + desc;
                         if (USERACCESS === "superuser") {
                             band_header += '<div id ="add_oprange_' + value.Band + '" band-id = "'+value.Band+'" class="add_opranges"><div class="icon add" ></div> Add Ranges</div>'
                             if (((value.Band == 2301) || (value.Band == 2302)) && (!corrFactorAlreadySet))
                             {
                                 band_header += '<select style="float:right;margin-right:20px" id="selCorrFactor"></select><label style="float:right">Correction Factor:</label>'
                                 corrFactorSet = true;
                                 corrFactorAlreadySet = true;
                             }
                         }
                         band_header += '</div>';
                         $('#freq_range_contents').append(band_header);
                         if (corrFactorSet)
                         {
                              for (i = 0; i <= 6; i++)
                              {
                                 $('#selCorrFactor').append($('<option>', {
                                      value: i,
                                      text: i
                                 }))
                              }
                              api.exe({
                                 cmd: "correction_factor GET",
                                 dataType: 'text',
                                 async: false,
                                 onSuccess: function (o) {
                                    var corrFactor = o.ajaxdata.split("=");
                                    $('#selCorrFactor').val(corrFactor[1]);
                                 }
                              })

                              $("#selCorrFactor").change(function(){
                                 api.exe({
                                    cmd: "correction_factor SET " + $('#selCorrFactor').val(),
                                    dataType: 'text',
                                    async: false,
                                    onSuccess: function (o) {
                                       console.log(o.ajaxdata);
                                    }
                                 })
                              })
                         }
                         $('#freq_range_contents').append('<div id ="' + value.Band + '-freq-indicator" class="freq-indicator"></div>');

                         //scale freq indicator to the band that has maximum range
                         // indicatorWidth count 300 width for range-max val 
                         indicatorWidth = Number((MAXWIDTH / maxRange) * (value.UpperDL - value.LowerDL));
                         $('#' + value.Band + '-freq-indicator').css('width', (MAXWIDTH / maxRange) * (value.UpperDL - value.LowerDL));
                         configBand('#' + value.Band + '-freq-indicator', value.LowerDL, value.UpperDL, indicatorWidth);
                         converter = new convert.RangeConvertion(value.LowerDL - SAFE_MARGIN, Number(value.UpperDL) + SAFE_MARGIN, MARGIN, (MAXWIDTH / maxRange) * (value.UpperDL - value.LowerDL) - MARGIN);
                         var html = "";
                         //loop through operators list and add ranges of each operator into each band
                         html = '<table id="' + value.Band + '_ranges" class="type1"><tr><th><div class="" ></div> Operator</th><th>Tag</th>' +
                             '<th><div class="icon downlink" ></div> Lower Downlink [MHz]</th><th><div class="icon downlink" ></div> Upper Downlink [MHz]</th><th></th>';
                         html += '</tr>';
                         $.each(value.Operators, function (key, operator) {
                             if (operator.Ranges.length > 0) {
                                 $.each(operator.Ranges, function (key2, range) {
                                     addBand('#' + value.Band + '-freq-indicator', range.LowerDownLink, range.UpperDownLink, key + '-range' + key2 + '-' + value.Band);
                                     html += '<tr class="table_row ' + key + '-range' + key2 + '-' + value.Band + '-row"><td>' + operator.FullName + '</td><td>' + range.Tag + '</td><td>' + convert.hz2mhz(range.LowerDownLink) + '</td>' +
                                         '<td>' + convert.hz2mhz(range.UpperDownLink) + '</td>';

                                     if (USERACCESS === 'superuser') {
                                         html += '<td><div class="button-col"><a class="button delete_opranges" id="delete_' + key + '-range' + range.index + '-' + value.Band + '" ' +
                                             'range-id = "' + range.index + '" band-id="' + value.Band + '" start="' + convert.hz2mhz(range.LowerDownLink) + '" stop="' + convert.hz2mhz(range.UpperDownLink) + '"' +
                                             'operator ="' + operator.Operator + '">Delete</a> ' +
                                             '<a class="button edit_opranges" id="edit_' + key + '-range' + range.index + '-' + value.Band + '" tag="' +range.Tag+'"'+
                                             'range-id = "' + range.index + '" band-id="' + value.Band + '" start="' + convert.hz2mhz(range.LowerDownLink) + '" stop="' + convert.hz2mhz(range.UpperDownLink) + '"' +
                                             'operator ="' + operator.Operator + '">Edit</a></div></td>';
                                         html += '</tr>';
                                     } else {
                                         html += '</tr>';
                                     }
                                 })
                             }

                         })
                         html += '</table>';
                         console.log("append here")
                         $('#freq_range_contents').append(html);
                         setHoverEvents();
                         setRangeColor();
                         var count = 0;
                         $.each(value.Operators, function (key, operator) {
                             if (operator.Ranges.length != 0) {
                                 count++;
                             }
                         })
                         if (count > 0) {
                             $('#' + value.Band).find('.icon').removeClass('maximize').addClass('minimize');
                             $('#' + value.Band + '_ranges').show();
                             $('#' + value.Band + '-freq-indicator').show();
                         } else {
                             $('#' + value.Band + '_ranges').hide();
                             $('#' + value.Band + '-freq-indicator').hide();
                         }
                     }
                })
            }
        })
    }

    function setRangeColor(){
        $('.freq-indicator-bar.disabled').each(function(){
            var colorIndex = $(this).attr('data-number').substring(0,1);
            $(this).css('background-color',COLORLEGEND[colorIndex]);
        })
        $('.legend_color').each(function(){
            var colorIndex = $(this).attr('id').substring(0,1);
            $(this).css('background-color',COLORLEGEND[colorIndex]);
        })
    }

    function configBand(selector, start,stop,indicatorWidth){
        $(selector).append( '<div class="freq-indicator-range-min freq-indicator-range">' + convert.hz2mhz(start) + 'MHz</div>' );
        if(indicatorWidth < 300 ){
            $(selector).append( '<div class="freq-indicator-range-max freq-indicator-range" style="right: -140px;">' + convert.hz2mhz(stop) + 'MHz</div>' );            
        }else{
            $(selector).append( '<div class="freq-indicator-range-max freq-indicator-range">' + convert.hz2mhz(stop) + 'MHz</div>' );
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
    function setHoverEvents () {
        $( '.freq-indicator-bar').hover( function () {
            var number = $( this ).attr( 'data-number' );
            var oper_key = $( this ).attr( 'data-number').substring(0,1);
            $( '.' + number + '-row').addClass( 'focused-row');
            $( '#' + oper_key + '_legend').addClass( 'focused');
        }, function () {
            var number = $( this ).attr( 'data-number' );
            var oper_key = $( this ).attr( 'data-number').substring(0,1);
            $( '.' + number + '-row').removeClass( 'focused-row');
            $( '#' + oper_key + '_legend').removeClass( 'focused');
        });

        //revert highlight from table to bar
        $( '.table_row').hover( function () {
            var className = $( this ).attr( 'class');
            var number = className.substring(className.indexOf(" ")+1,className.length-4);
            var oper_key = className.substring(className.indexOf(" ")+1,className.indexOf(" ")+2);
            $( '#freq-indicator-bar-' + number).addClass( 'focused');
            $( '#' + oper_key + '_legend').addClass( 'focused');
        }, function () {
            var className = $( this ).attr( 'class');
            var number = className.substring(className.indexOf(" ")+1,className.length-4);
            var oper_key = className.substring(className.indexOf(" ")+1,className.indexOf(" ")+2);
            $( '#freq-indicator-bar-' + number).removeClass( 'focused');
            $( '#' + oper_key + '_legend').removeClass( 'focused');
        });

    }

    //** validates a numerical edit box to see if it actually contains a number and is within the range
    function validate ( $element ) {
        //check to see if it's possible to convert it to a number
        var num = Number( $element.val() );
        if ( !_.isFinite( num ) ) {
            $element.addClass( 'erroneous').attr( 'title', 'Could not convert ' + $element.val() + ' to number.' );
            return false;
        }
        //check if it is within the range it's supposed to be
        var min = Number( $element.attr( 'min' ) );
        var max = Number( $element.attr( 'max' ) );
        if ( num < min || max < num ) {
            $element.addClass( 'erroneous').attr( 'title', 'Out of range. It should be between ' + min + ' to ' + max );
            return false;
        }
        //otherwise no error has been found
        $element.removeClass( 'erroneous').attr( 'title', '' );
        return true;
    }

    //** validate all numerical edit boxes
    function validateAll () {
        validate( $start );
        validate( $stop );
    }
});

