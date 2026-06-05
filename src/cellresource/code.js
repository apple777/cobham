require([ '/js/api.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js','/js/util.js','/js/lib/jquery-ui.js','/js/lib/jquery_cookie.js'],
    function (api, convert, console, _, $,util) {
        var SAFE_MARGIN = 60000;
        var WIDTH = 980;
        var MARGIN = 0;
        var $dialog;
        var params = getUrlParams ();
        var converter;
        var LOWERDL;
        var UPPERDL;
        var RANGELIST =[];
        var OPERATOR = $.cookie('currentOperator');
        var SECTORID = params.sectorid;
        var cellresLimits=[];
        var OPERATORLIST = $.parseJSON($.cookie('operatorCook'));
        var USERACCESS = $.cookie('userAccess');
        var selectedLib =[];
        var original_tags =[];
        var sectorInfo;
        var idEditDisable = [];

        function ValidateTagChange(this_data)
        {
            var cres_id = $(this_data).attr('id').replace('long_tag_','');
            cres_id = cres_id.replace('tag_','');
            var cres_obj = _.findWhere(original_tags,{ResID:cres_id});
            if($(this_data).val() === cres_obj.Tag)
            {
                $('#save_'+cres_id).hide();
            }
            else
            {
                $('#save_'+cres_id).show();
            }
        }

        $(document).ready(function(){
            //highlight wizard steps
            $('.wizard-step').removeClass('highlighted');
            $('#wizard-filters').addClass('highlighted');
            $('#wizard-end').addClass('highlighted');
            //if user is read only, disabled all functionalities
            $.each(OPERATORLIST, function(key, value){
                if(value.SysName === OPERATOR && USERACCESS ==="RO"){
                    $('#add_cellres').addClass('disabled');
                    $('#edit_sector_tag').addClass('disabled');
                    $('input').prop('disabled',true);
                }
            })
            //display sector details
            api.exe({
                cmd:'sector -o '+OPERATOR+ ' --json',
                dataType:'json',
                onSuccess:function(o){
                    $.each(o.ajaxdata.sector,function(index,sector){
                        if(sector.SectorID === SECTORID){
                            sectorInfo = sector;
//                            $('#sector-id').text(SECTORID);
                            $('#conn-type').text(sector["Conn"]);
                            $('#sector-tag').text(sector["Tag"]);
                            //$('#band-id').text("Frequency Indicator: "+ sector.Band);
                            LOWERDL = sector.LowerBandDL;
                            UPPERDL = sector.UpperBandDL;
                            OPERATOR = sector["Operator"];
                            $('#sector-bts-tag').text(sector["BTS Tag"]);
                            api.exe({
                                cmd:'operators --json',
                                dataType:'json',
                                onSuccess:function(o){
                                    $.each(o.ajaxdata.operators, function(key, value){
                                        if(value.SysName === sector.Operator){
                                            $('#operator_id').text(value.FullName);
                                        }
                                    })
                                }
                            })
                            configBand('#sector-band-freq-indicator',LOWERDL,UPPERDL);
                            converter = new convert.RangeConvertion( LOWERDL - SAFE_MARGIN, Number(UPPERDL) + SAFE_MARGIN, MARGIN, WIDTH - MARGIN );
                            api.exe({
                                cmd:'opranges -o '+sector.Operator+' --json',
                                dataType:'json',
                                onSuccess:function(o){
                                    $.each(o.ajaxdata.Rfrange,function(key, value){
                                        if(value.LowerDownLink >= LOWERDL && value.UpperDownLink <=UPPERDL){
                                            addRange('#sector-band-freq-indicator',value.LowerDownLink,value.UpperDownLink,key);
                                            RANGELIST.push(value);
                                        }
                                    })
                                }
                            })
                        }
                    })
                    reloadCellresTable();
                }
            })



            $('#cellres_table').hide();


            $('#add_cellres').click(function(){
                //append technology list
                if(!$(this).hasClass('disabled')){
                    showDialog();
                }
            })

            //dialog box
            $dialog = $( '#band-frequency-editor-contents' ).dialog({
                width : 450,
                height:550,
                resizable : false,
                autoOpen : false,
                open:function(){
                    $('#cellres-tag').val("");
                    $('#cellres-long-tag').val("");
                },
                buttons:{
                    'Cancel': function () {

                        $dialog.dialog( 'close' );
                    },
                    'Add' : function () {
                        var tech = $('#band-library-select option:selected').text();
                        var filterID = $('#band-library-select').val();
                        var bandwidth = (Number($stop.val() - $start.val()) *1000000).toFixed(0);
                        var center = ($center.val()*1000000).toFixed(0);
                        var tag = $('#cellres-tag').val();
                        var longTag = $('#cellres-long-tag').val();
                        var alcLevel = 0//as default, shmulik said it should be hidden for now //Number($('#alc-level').val());
                        var gainLevel = Number($('#gain-level').val());
                        var gainLevelEnabled = $( '#enable-gain-track').prop('checked') ? "ON" : "OFF";
                        var manualLevel = Number($('#manual-level').val());
                        var rxRefLevel = 0; //as default, shmulik said it should be hidden for now //Number($('#rx-ref-level').val());
                        //if tag and long tag =="" then add a space inside or else cmd.lua will complain
                        if(tag ===""){
                            tag =" ";
                        }
                        if(longTag ===""){
                            longTag =" ";
                        }
                        if($dialog.find('.erroneous').exists()){
                            axellPopUp('Please fill in correct range for cell resource');
                        }else if($start.val() === "" || $stop.val() === ""){
                            axellPopUp('Please fill in start and stop frequency range for cell resource');
                        }else if(!util.validateShortTag(tag)){
                            axellPopUp("Please enter a valid tag");
                        }else if(!util.validateTag(longTag)){
                            axellPopUp("Please enter a valid long tag");
                        }/*else if(alcLevel === "" || isNaN(alcLevel)){
                            axellPopUp("Please enter a valid ALC level");
                        }*/else if(gainLevel === "" || isNaN(gainLevel)){
                            axellPopUp("Please enter a valid gain level");
                        }else if(manualLevel === "" || isNaN(manualLevel)){
                            axellPopUp("Please enter a valid manual level");
                        }/*else if(rxRefLevel === "" || isNaN(rxRefLevel)){
                            axellPopUp("Please enter a valid Rx reference level");
                        }*/else if(bandwidth > _.max(selectedLib)){
                            axellPopUp("The bandwidth selected is not supported by the system. Please update the frequency range");
                        }else{
                            api.exe({
                              cmd:'check_cres_tag '+tag,
                              onSuccess:function(){
                                  var overlapped = false;
                                  $.each(cellresLimits,function(i,cellres){
                                      if($center.val() >= convert.hz2mhz(cellres.LowerDL) && $center.val()<= convert.hz2mhz(cellres.UpperDL)){
                                          overlapped = true;
                                      }
                                  })
                                  if(!overlapped){
                                      //if sector is not MIMO, then add normal cell res
                                      //if sector is MIMO then add MIMO cell res
                                      if($('#conn-type').text().indexOf("MIMO") === -1){
                                          api.exe({
                                              //CELLRES ADD <Operator> <SectID> <Tech> -freq <Filter ID> <Bandwidth> < Center Frequency > "<Tag>" "<Long Tag>"
                                              cmd:'CELLRES ADD '+OPERATOR+' '+SECTORID+' '+tech+ ' -freq ' +filterID+' '+bandwidth+' '+center+' '+alcLevel +' '+gainLevel +' ' + gainLevelEnabled + ' '+manualLevel +' '+rxRefLevel+' "'+tag+'" "'+longTag+'"',
                                              onSuccess:function(){
                                                  $dialog.dialog( 'close' );
                                                  reloadCellresTable();
                                                  //remove the freq indicator bar in freq bar
                                                  $('.freq-indicator-bar').remove();
                                              },
                                              onError:function(err){
                                                  if(err.errorThrown.indexOf('Error: Not enough filter quota available') >= 0)
                                                  {
                                                      axellPopUp('Error: Not enough filter quota available');
                                                  }else if(err.errorThrown.indexOf('Failed to synchronize') !=-1){
                                                      $dialog.dialog( 'close' );
                                                      axellPopUp('Cell resource is added successfully but it fails to sync with other remotes');
                                                      reloadCellresTable();
                                                      //remove the freq indicator bar in freq bar
                                                      $('.freq-indicator-bar').remove();
                                                  }
                                                  else
                                                  {
                                                      axellPopUp(err.errorThrown);
                                                  }
                                              }
                                          })
                                      }else{
                                          api.exe({
                                              //CELLRES ADD <Operator> <SectID> <Tech> -freq <Filter ID> <Bandwidth> < Center Frequency > --MIMO <MIMO usage>"<Tag>" "<Long Tag>"
                                              cmd:'CELLRES ADD '+OPERATOR+' '+SECTORID+' '+tech+ ' -freq ' +filterID+' '+bandwidth+' '+center+' '+alcLevel +' '+gainLevel + ' ' + gainLevelEnabled + ' ' +manualLevel +' '+rxRefLevel+ ' --MIMO '+$("input[name=mimo]:checked").val()+' "'+tag+'" "'+longTag+'"',
                                              onSuccess:function(){
                                                  $dialog.dialog( 'close' );
                                                  reloadCellresTable();
                                                  //remove the freq indicator bar in freq bar
                                                  $('.freq-indicator-bar').remove();
                                              },
                                              onError:function(err){
                                                  axellPopUp(err.errorThrown);
                                              }
                                          })
                                      }
                                  }else{
                                      axellPopUp('Input range is overlapped with existing cell resource. Please input other range');
                                  }
                              },
                              onError:function(err){
                                 axellPopUp(err.errorThrown);
                              }
                            })
                        }
                    }
                }
            });

            //if either sector tag or Bts tag is updated, enable save button
            //save button on click, save new tag
            var sectorTagChanged = false;
            var BTSTagChanged = false;
            $('#sector-tag').keyup(function() {
                $('#save_sector_tag').removeClass('disabled');
                sectorTagChanged =true;
            });
            $('#sector-bts-tag').keyup(function() {
                $('#save_sector_tag').removeClass('disabled');
                BTSTagChanged =true;
            });
            $('#edit_sector_tag').click(function() {
                if(!$(this).hasClass('disabled')) {
                    //change tag and long tag field to input text
                    var $editTagField = $('#sector-tag');
                    var $editLongTagField = $('#sector-bts-tag');
                    var tag = $editTagField.text();
                    var longTag = $editLongTagField.text();
                    var inputTag = $('<input class="sector-tag" type="text" />');
                    var inputLongTag = $('<input class="sector-bts-tag" type="text" />');
                    inputTag.val(tag);
                    inputLongTag.val(longTag);
                    $editTagField.html(inputTag);
                    $editLongTagField.html(inputLongTag);
                    $('#save_sector_tag').show();
                    $('#cancel_edit_sector_tag').show();
                    $('#edit_sector_tag').hide();
                }
            })

            $('#save_sector_tag').click(function() {
                var newTag = $('#sector-tag input').val();
                var newBTSTag = $('#sector-bts-tag input').val();
                if(!$(this).hasClass('disabled')){
                    if(sectorTagChanged){
                        if(util.validateTag(newTag) && util.validateTag(newBTSTag)) {
                            api.exe({
                                cmd: 'SECTOR -o ' + OPERATOR + ' TAG ' + SECTORID + ' "' + newTag + '"',
                                onSuccess: function () {
                                    $('#save_sector_tag').addClass('disabled');
                                    $('#sector-tag').text(newTag);
                                    $('#sector-bts-tag').text(newBTSTag);
                                    //update info of tag, in order to remember the new tag name if user cancel the edit action
                                    sectorInfo.Tag =  newTag;
                                    $('#edit_sector_tag').show();
                                    $('#save_sector_tag').hide();
                                    $('#cancel_edit_sector_tag').hide();
                                },
                                onError: function (err) {
                                    console.log(err.errorThrown);
                                }
                            })
                        }else{
                            axellPopUp("Please enter a valid tag");
                        }
                    }
                    if(BTSTagChanged){
                        if(util.validateTag(newTag) && util.validateTag(newBTSTag)) {
                            api.exe({
                                cmd: 'SECTOR -o ' + OPERATOR + ' BTSTAG ' + SECTORID + ' "' + newBTSTag + '"',
                                onSuccess: function () {
                                    $('#save_sector_tag').addClass('disabled');
                                    $('#sector-tag').text(newTag);
                                    $('#sector-bts-tag').text(newBTSTag);
                                    //update info of tag, in order to remember the new tag name if user cancel the edit action
                                    sectorInfo["BTS Tag"] =  newBTSTag;
                                    $('#edit_sector_tag').show();
                                    $('#save_sector_tag').hide();
                                    $('#cancel_edit_sector_tag').hide();
                                },
                                onError: function (err) {
                                    console.log(err.errorThrown);
                                }
                            })
                        }else{
                            axellPopUp("Please enter a valid tag");
                        }
                    }
                }
            })

            $('#cancel_edit_sector_tag').click(function() {
                $('#edit_sector_tag').show();
                $('#save_sector_tag').hide();
                $('#cancel_edit_sector_tag').hide();

                $('#sector-tag').text(sectorInfo.Tag);
                $('#sector-bts-tag').text(sectorInfo["BTS Tag"]);
            });
            /*
            $(document).on('click','.edit_cellres',function(){
                if(!$(this).hasClass('disabled')) {
                    var cell_res_id = $(this).attr('id');
                    cell_res_id = cell_res_id.replace('edit_', '');
                    $('#cancel_edit_' + cell_res_id).show();
                    $(this).hide();
                    $('#tag_' + cell_res_id).prop('disabled', false);
                    $('#long_tag_' + cell_res_id).prop('disabled', false);
                    $('#delete_' + cell_res_id).hide();
                }
            });

            $(document).on('click','.cancel_edit_cellres_tag',function(){
                var cell_res_id = $(this).attr('id');
                cell_res_id = cell_res_id.replace('cancel_edit_','');
                var cell_res_obj = _.findWhere(original_tags,{ResID: cell_res_id});
                if(cell_res_obj)
                {
                    $('#edit_'+cell_res_id).show();
                    $('#delete_'+cell_res_id).show();
                    $('#save_'+cell_res_id).hide();
                    $(this).hide();

                    $('#tag_'+cell_res_id).text(cell_res_obj.Tag);
                    $('#long_tag_'+cell_res_id).text(cell_res_obj["Long Tag"]);
                }
            });
            */
            var tagChanged = false;
            var longTagChanged = false;

            $(document).on('click','.edit_cellres',function(){
                var id = this.id;
                id = id.slice(id.indexOf("_")+1);
                var $this = $(this);
                if(!$(this).hasClass('disabled')) {
                    var $edit_dialog=$('#edit_cellres_dialog').dialog({
                        width : 450,
                        height: 550,
                        resizable : false,
                        autoOpen : false,
                        title: 'Edit Cell Resource',
                        open:function(){
                            var editDisable = false;
                            for(var i = 0; i < idEditDisable.length; i++) {
                              if(id == idEditDisable[i]){
                                 editDisable = true;
                                 break;
                              }  
                            }
                            if(editDisable){
                              $('#edit-cellres-tag').prop("disabled", true);
                              $('#edit-cellres-long-tag').prop("disabled", true);
                              $('#edit-band-edit-start').prop("disabled", true);
                              $('#edit-band-edit-stop').prop("disabled", true);
                              $('#edit-band-edit-center').prop("disabled", true);
                              $('#edit-band-span-select').prop("disabled", true);
                              $('#edit-band-library-select').prop("disabled", true);
                            }else{
                              $('#edit-cellres-tag').prop("disabled", false);
                              $('#edit-cellres-long-tag').prop("disabled", false);
                              $('#edit-band-edit-start').prop("disabled", false);
                              $('#edit-band-edit-stop').prop("disabled", false);
                              $('#edit-band-edit-center').prop("disabled", false);
                              $('#edit-band-span-select').prop("disabled", false);
                              $('#edit-band-library-select').prop("disabled", false);
                            }
                            //edit dialog
                            for(var i=-100; i<=100; i++) {
                                $('#edit-alc-level').append($("<option />").val((i / 10).toFixed(1)).text((i / 10).toFixed(1)));
                            }
                            for(var i=-200; i<=100; i++) {
                                $('#edit-gain-level').append($("<option />").val((i / 10).toFixed(1)).text((i / 10).toFixed(1)));
                            }
                            for(var i=-200; i<=300; i++) {
                                $('#edit-manual-level').append($("<option />").val((i / 10).toFixed(1)).text((i / 10).toFixed(1)));
                            }

                            $('#edit-cellres-tag').val($this.data('tag'));
                            $('#edit-cellres-long-tag').val($this.data('longtag'));
                            $( '#edit-alc-level option[value="'+$this.data('alc')+'"]' ).prop("selected", true);
                            $( '#edit-gain-level option[value="'+$this.data('gain')+'"]' ).prop("selected", true);
                            $( '#edit-manual-level option[value="'+$this.data('manual')+'"]' ).prop("selected", true);
                            if($this.data('track') == 1){
                                $( '#enable-gain-track-edit').prop("checked", true);
                            }
                            else{
                                $( '#enable-gain-track-edit').prop("checked", false);
                            }
                            
                            $('#edit-band-edit-start').val(($this.data('start')/1000000).toFixed(5));
                            $('#edit-band-edit-stop').val(($this.data('stop')/1000000).toFixed(5));
                            $('#edit-band-edit-center').val((($this.data('start')+$this.data('stop'))/2/1000000).toFixed(5));

                            api.exe({
                               cmd:'filterdump libraries',
                               onSuccess:function(o){
                                   var libraryList = o.ajaxdata.split("\n").map($.trim).filter(function(line) { return line != "" });
                                   var selectedValue;
                                   $('#edit-band-library-select').empty();
                                   $.each(libraryList,function(i, library){
                                       var lib = library.split(" ");
                                       if (lib[6] == $this.data('tech'))
                                          selectedValue = lib[1];
                                       $('#edit-band-library-select').append($('<option>', {
                                           value: lib[1],
                                           text : lib[6]
                                       }));
                                   })
                                   $('#edit-band-library-select option[value="'+selectedValue+'"]' ).prop("selected", true);

                                   api.exe({
                                        cmd:'filterdump filters ' + $('#edit-band-library-select option:selected').text(),
                                        async:false, //or else span lib will be duplicated
                                        onSuccess: function () {
                                            var thisLibrary = this;
                                            thisLibrary.filters = [];
                                            var parts = this.ajaxdata.match( /\d+/gi );
                                            for ( var p = 0 ; p < parts.length ; p++ ) {
                                                if ( parts[p] !== '-' ) {
                                                    thisLibrary.filters.push( Number( parts[p] ) );
                                                    selectedLib.push(Number( parts[p] ));
                                                } else {
                                                    //reached the end of the meaningful part of the output!
                                                    break;
                                                }
                                            }
                                            var selVal;
                                            $('#edit-band-span-select').empty();
                                            $.each(thisLibrary.filters,function(i,number){
                                                if (($('#edit-band-edit-stop').val()*1000000) - ($('#edit-band-edit-start').val()*1000000) == number)
                                                   selVal = convert.hz2mhz(number);
                                                $('#edit-band-span-select').append($('<option>', {
                                                    value: convert.hz2mhz(number),
                                                    text : convert.hz2mhz(number)
                                                }));
                                            })
                                            if (selVal != undefined)
                                             $('#edit-band-span-select option[value="'+selVal+'"]' ).prop("selected", true);
                                        }
                                   });
                               }
                            })
                        },
                        buttons: {
                            'Cancel': function () {
                                $edit_dialog.dialog('close');
                            },
                            'Save': function () {
                                //update cellres details
                                //save tag and long tag
                                var cellresID = $this.data('cellresid');
                                var tag =  $('#edit-cellres-tag').val();
                                var longTag =  $('#edit-cellres-long-tag').val();
                                var alcOffset =  $( '#edit-alc-level').val();
                                var gainLevel =  $( '#edit-gain-level').val();
                                var manualLevel =  $( '#edit-manual-level').val();
                                var gainLevelEnabled = $( '#enable-gain-track-edit').prop('checked') ? "ON" : "OFF";
                                var tech = $('#edit-band-library-select option:selected').text();
                                var filterID = $('#edit-band-library-select').val();
                                var bandwidth = ($('#edit-band-edit-stop').val()*1000000) - ($('#edit-band-edit-start').val()*1000000);
                                var center = $('#edit-band-edit-center').val()*1000000;
                                api.exe({
                                     cmd:'CELLRES EDIT '+OPERATOR+' '+cellresID+' '+SECTORID+' '+tech+ ' -freq ' +filterID+' '+bandwidth+' '+center,
                                     onSuccess:function(){
                                         if(util.validateShortTag(tag) && util.validateTag(longTag)) {
                                             api.exe({
                                                 cmd: 'CELLRES -o ' + OPERATOR + ' TAG  ' + cellresID + ' "' + tag + '" && ' +
                                                      'CELLRES -o ' + OPERATOR + ' LONGTAG '+cellresID+' "'+longTag+'" && ' +
                                                      'CELLRES -o ' + OPERATOR + ' ALCOFFSET '+cellresID+ ' '+alcOffset +' && ' +
                                                      'CELLRES -o ' + OPERATOR + ' ULGAINOFFSET '+cellresID+ ' '+gainLevel + ' ' + gainLevelEnabled +' && ' +
                                                      'CELLRES -o ' + OPERATOR + ' MANLEVEL '+cellresID+ ' '+manualLevel +' && ' +
                                                      'CELLRES -o ' + OPERATOR + ' TECH '+cellresID+ ' '+tech +' && ' +
                                                      'CELLRES -o ' + OPERATOR + ' FILTERID '+cellresID+ ' '+filterID +' && ' +
                                                      'CELLRES -o ' + OPERATOR + ' BANDWIDTH '+cellresID+ ' '+bandwidth +' && ' +
                                                      'CELLRES -o ' + OPERATOR + ' CENTER '+cellresID+ ' '+center,
                                                 onSuccess: function () {
                                                     reloadCellresTable();
                                                     $('.freq-indicator-bar').remove();
                                                     $edit_dialog.dialog('close');
                                                 },
                                                 onError: function (err) {
                                                     reloadCellresTable();
                                                     $('.freq-indicator-bar').remove();
                                                     axellPopUp(err.errorThrown);
                                                     $edit_dialog.dialog('close');
                                                 }
                                             })
                                         }else{
                                             reloadCellresTable();
                                             axellPopUp("Please enter a valid tag or long tag");
                                         }
                                     },
                                     onError:function(err){
                                          axellPopUp(err.errorThrown);
                                     }
                                })
                            }
                        }
                    })
                    $edit_dialog.dialog('open');
                    /*
                    var cell_res_id = $(this).attr('id');
                    cell_res_id = cell_res_id.replace('edit_', '');
                    //change tag and long tag field to input text
                    var $editTagField = $('#tag_' + cell_res_id);
                    var $editLongTagField = $('#long_tag_' + cell_res_id);
                    var tag = $editTagField.html();
                    var longTag = $editLongTagField.html();
                    var inputTag = $('<input class="cellres-tag-edit" cellresid="CRES_' + cell_res_id + '" type="text" />');
                    var inputLongTag = $('<input class="cellres-long-tag-edit" id="cellres-long-tag-edit_CRES_' + cell_res_id + '" type="text" />');
                    inputTag.val(tag);
                    inputLongTag.val(longTag);
                    $editTagField.html(inputTag);
                    $editLongTagField.html(inputLongTag);

                    $('#cancel_edit_' + cell_res_id).show();
                    $('#save_' + cell_res_id).show();
                    $('#save_' + cell_res_id).addClass('disabled');
                    $('#edit_' + cell_res_id).hide();
                    $('#delete_' + cell_res_id).hide();
                    //on input change then enable button saved
                    $('.cellres-tag-edit').keyup(function () {
                        $('#save_' + cell_res_id).removeClass('disabled');
                        tagChanged = true;
                    })
                    $('.cellres-long-tag-edit').keyup(function () {
                        $('#save_' + cell_res_id).removeClass('disabled');
                        longTagChanged = true;
                    })
                    */
                }
            })

            $('#edit-band-library-select').change(function(){
              api.exe({
                   cmd:'filterdump filters ' + $('#edit-band-library-select option:selected').text(),
                   async:false, //or else span lib will be duplicated
                   onSuccess: function () {
                       var thisLibrary = this;
                       thisLibrary.filters = [];
                       var parts = this.ajaxdata.match( /\d+/gi );
                       for ( var p = 0 ; p < parts.length ; p++ ) {
                           if ( parts[p] !== '-' ) {
                               thisLibrary.filters.push( Number( parts[p] ) );
                               selectedLib.push(Number( parts[p] ));
                           } else {
                               //reached the end of the meaningful part of the output!
                               break;
                           }
                       }
                       var selVal;
                       $('#edit-band-span-select').empty();
                       $.each(thisLibrary.filters,function(i,number){
                           if (($('#edit-band-edit-stop').val()*1000000) - ($('#edit-band-edit-start').val()*1000000) == number)
                              selVal = convert.hz2mhz(number);
                           $('#edit-band-span-select').append($('<option>', {
                               value: convert.hz2mhz(number),
                               text : convert.hz2mhz(number)
                           }));
                       })
                       if (selVal != undefined)
                        $('#edit-band-span-select option[value="'+selVal+'"]' ).prop("selected", true);
                   }
              });
            })

            $('#edit-band-span-select').change(function(){
               var span = Number($('#edit-band-span-select option:selected').text())*1000000;
               var start = (Number($('#edit-band-edit-center').val())*1000000) - (span/2);
               var stop = (Number($('#edit-band-edit-center').val())*1000000) + (span/2);
               $('#edit-band-edit-start').val((start/1000000).toFixed(5));
               $('#edit-band-edit-stop').val((stop/1000000).toFixed(5));
            })

            $('#edit-band-edit-start').change(function(){
               var span = Number($('#edit-band-span-select option:selected').text())*1000000;
               var stop = (Number($('#edit-band-edit-start').val())*1000000) + span;
               var center = (Number($('#edit-band-edit-start').val())*1000000) + (span/2);
               $('#edit-band-edit-center').val((center/1000000).toFixed(5));
               $('#edit-band-edit-stop').val((stop/1000000).toFixed(5));
            })

            /*
            $(document).on('click','.save_cellres_tag',function(){
                var cell_res_id = $(this).attr('id');
                cell_res_id = cell_res_id.replace('save_','');

                var newTag = $('#tag_'+cell_res_id+' input').val();
                var newLongTag = $('#long_tag_'+cell_res_id+' input').val();
                if(!$(this).hasClass('disabled')){
                    if(tagChanged){
                        if(util.validateTag(newTag) && util.validateTag(newLongTag)) {
                            api.exe({
                                cmd: 'CELLRES -o ' + OPERATOR + ' TAG  ' + cell_res_id + ' "' + newTag + '"',
                                onSuccess: function () {
                                    $('#tag_' + cell_res_id).text(newTag);
                                    $('#long_tag_' + cell_res_id).text(newLongTag);
                                },
                                onError: function (err) {
                                    reloadCellresTable();
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        }else{
                            reloadCellresTable();
                            axellPopUp("Please enter a valid tag");
                        }
                    }

                    if(longTagChanged){
                        if(util.validateTag(newTag) && util.validateTag(newLongTag)) {
                            api.exe({
                                cmd:'CELLRES -o '+OPERATOR+' LONGTAG '+cell_res_id+' "'+newLongTag+'"',
                                onSuccess:function(){
                                    $('#tag_'+cell_res_id).text(newTag);
                                    $('#long_tag_'+cell_res_id).text(newLongTag);
                                },
                                onError:function(err){
                                    reloadCellresTable();
                                    axellPopUp(err.errorThrown);
                                }
                            })
                        }else{
                            reloadCellresTable();
                            axellPopUp("Please enter a valid long tag");
                        }
                    }
                    var match = _.find(original_tags, function(cellres) { return cellres.ResID === cell_res_id })
                    if (match) {
                        match.Tag = newTag;
                        match["Long Tag"] = newLongTag
                    }
                    $('#cancel_edit_'+cell_res_id).hide();
                    $('#save_'+cell_res_id).hide();
                    $('#edit_'+cell_res_id).show();
                    $('#delete_'+cell_res_id).show();
                }

                /*
                api.exe({
                    cmd:'CELLRES -o '+OPERATOR+' TAG  '+cell_res_id+' "'+$('#tag_'+cell_res_id+' input').val()+'"',
                    onSuccess:function(){
                        api.exe({
                            cmd:'CELLRES -o '+OPERATOR+' LONGTAG '+cell_res_id+' "'+$('#long_tag_'+cell_res_id+' input').val()+'"',
                            onSuccess:function(){
                                reloadCellresTable();
                            },
                            onError:function(){
                                $("<p>Error executing CELLRES LONGTAG "+this.errorThrown+"</p>").dialog();
                            }
                        })
                        reloadCellresTable();
                    },
                    onError:function(){
                        $("<p>Error executing CELLRES TAG "+this.errorThrown+"</p>").dialog();
                    }
                });
                */
            /*
            });



            $(document).on('change', '.tag_input', function() {
                ValidateTagChange($(this));
            });

            $(document).on('keydown', '.tag_input', function() {
                ValidateTagChange($(this));
            });
             */

            //when click on delete cell resource button
            $(document).on('click','.delete_cellres',function(){
                var cellresID = $(this).attr('id').substring($(this).attr('id').indexOf('_')+1,$(this).attr('id').length);
                console.log(cellresID);
                if(!$(this).hasClass('disabled')){
                    axellConfirm("info","Notice",'Are you sure you want to delete cell resource ID: '+cellresID,function(){
                        console.log("delete please");
                        api.exe({
                            cmd:'CELLRES -o ' + OPERATOR +' DELETE '+ cellresID +' '+SECTORID,
                            onSuccess:function(){
                                //alert('Cell resource id '+cellresID +' deleted successfully');
                                reloadCellresTable();
                                //remove the freq indicator bar in freq bar
                                $('.freq-indicator-bar').remove();
                            },
                            onError:function(err){
                                axellPopUp(err.errorThrown);
                            }
                        })
                    })
                }else{

                }
            })
        })
        function showDialog(){
            console.log("show dialog")
            //check for libraries, append libraries to library dropdown menu
            api.exe({
                cmd:'filterdump libraries',
                onSuccess:function(o){
                    var libraryList = o.ajaxdata.split("\n").map($.trim).filter(function(line) { return line != "" });
                    $('#band-library-select').empty();

                    $.each(libraryList,function(i, library){
                        var lib = library.split(" ");
                        $('#band-library-select').append($('<option>', {
                            value: lib[1],
                            text : lib[6]
                        }));
                    })
                    Library ($('#band-library-select').val());
                }
            })


             //rf ranges - new code !!!!!!!!
                var rf_range_select = $( '#rf-range-select' );
                rf_range_select.html("");
                rf_range_select.append(new Option("None",100));
               $.each(RANGELIST, function(key, value){
                _tag = value.Tag;
               console.log(_tag)
                rf_range_select.append(new Option(_tag,key));
                });
               
               $('#rf-range-select').change(function() {
                 //alert( $('#rf-range-select').val() )
                 if( $('#rf-range-select').val()  > 99  )
                 {
                    //set empty range
                    $center.val((Number(convert.hz2mhz(LOWERDL))+ Number( $span.val() / 2 )).toFixed(5));
                    $stop.val( (Number( $center.val() ) + Number( $span.val() / 2 )).toFixed(5) );
                    $start.val((Number( $center.val() ) - Number( $span.val() / 2 )).toFixed(5) );
                    $('#cellres-tag').val(" ");
                    $('#cellres-long-tag').val(" ");
                    validateAll();
                 }
                 else
                 {
                   $start.val(convert.hz2mhz(Number( RANGELIST[  $('#rf-range-select').val() ].LowerDownLink).toFixed(5)));
                   $stop.val (convert.hz2mhz(Number( RANGELIST[  $('#rf-range-select').val() ].UpperDownLink).toFixed(5)));
                   $center.val((( Number( $start.val() ) + Number( $stop.val() ) ) / 2).toFixed(5) );
                    $('#cellres-tag').val( RANGELIST[  $('#rf-range-select').val() ].Tag);
                    $('#cellres-long-tag').val( RANGELIST[  $('#rf-range-select').val() ].Tag);
                   validateAll();
                     //update the range of hint
                     $( '.band-range-hint' ).text(convert.hz2mhz(Number( RANGELIST[  $('#rf-range-select').val() ].LowerDownLink).toFixed(5)) + '-' + convert.hz2mhz(Number( RANGELIST[  $('#rf-range-select').val() ].UpperDownLink).toFixed(5)));

                 }

               });  

            //alc
            var alc_level = $( '#alc-level' );
            for(var i=-100; i<=100; i++)
                alc_level.append($("<option />").val(i/10).text(i/10));
            $( '#alc-level option[value="0"]' ).prop("selected", true);
            var gain_level = $( '#gain-level' );
            for(var i=-200; i<=100; i++)
                gain_level.append($("<option />").val(i/10).text(i/10));
            $( '#gain-level option[value="0"]' ).prop("selected", true);
            var manual_level = $( '#manual-level' );
            for(var i=-200; i<=300; i++)
                manual_level.append($("<option />").val(i/10).text(i/10));
            $( '#manual-level option[value="0"]' ).prop("selected", true);
            var rx_ref_level = $( '#rx-ref-level' );
            for(var i=-200; i<=300; i++)
                rx_ref_level.append($("<option />").val(i/10).text(i/10));
            $( '#rx-ref-level option[value="0"]' ).prop("selected", true);

            //on keyup for start, stop, center input
            $start = $( '#band-edit-start' );
            $stop = $( '#band-edit-stop' );
            $center = $( '#band-edit-center' );
            $span = $( '#band-span-select' );
            $library = $( '#band-library-select' );
            //force numberic input accept only numeric and .
            util.numericInput($start);
            util.numericInput($stop);
            util.numericInput($center);
            validateAll();
            //event handler
            $start.keyup( function () {
                $stop.val((Number( $start.val() ) + Number( $span.val() )).toFixed(5));
                $center.val((( Number( $start.val() ) + Number( $stop.val() ) ) / 2).toFixed(5) );
                validateAll();
            });
            $stop.keyup( function () {
                $start.val((Number( $stop.val() ) - Number( $span.val())).toFixed(5) );
                $center.val((( Number( $start.val() ) + Number( $stop.val() ) ) / 2).toFixed(5) );
                validateAll();
            });
            $center.keyup( function () {
                $stop.val((Number( $center.val() ) + Number($span.val() / 2 )).toFixed(5) );
                $start.val((Number( $center.val() ) - Number($span.val() / 2 )).toFixed(5) );
                validateAll();
            });
            $span.change( function () {
                //$center.val((Number(convert.hz2mhz(LOWERDL))+ Number( $span.val() / 2 )).toFixed(5));
                $stop.val( (Number( $center.val() ) + Number( $span.val() / 2 )).toFixed(5) );
                $start.val((Number( $center.val() ) - Number( $span.val() / 2 )).toFixed(5) );
                validateAll();
            });

            $library.change(function(){
                console.log("on change");
                Library ($library.val());
            })
            $( '.band-range-hint' ).text(convert.hz2mhz(LOWERDL) + '-' + convert.hz2mhz(UPPERDL));
            $( '.validation-range' ).attr( 'min', convert.hz2mhz(LOWERDL) ).attr( 'max', convert.hz2mhz(UPPERDL) );
          
            
            //open the dialog
            $dialog.dialog( 'option', 'title', 'Add Cell Resource');
            $dialog.dialog( 'open');
            //if the sector is MIMO then display MIMO radiobutton
            if($('#conn-type').text().indexOf("MIMO") ===-1){
                $('.mimo-cellres').hide();
            }
        }

        function reloadCellresTable(){
            cellresLimits=[];
                //if cell resrouce found in active profile then disabled the delete button for that cellres
                api.exe({
                    cmd:'rfroute -o '+OPERATOR+' profiles --json',
                    dataType:'json',
                    onSuccess:function(e){
                        var activeRoute = e.ajaxdata.Active;
                        console.log(activeRoute);
                        api.exe({
                            cmd:'RFROUTE -o '+OPERATOR+' '+activeRoute+' --json',
                            //cmd:'add_route_to_rcd_queue '+OPERATOR+' '+activeRoute+' --json',
                            dataType:'json',
                            onSuccess:function(activeProfile){
                                api.exe({
                                    cmd:'cellres -o '+OPERATOR+' --json',
                                    dataType:'json',
                                    onSuccess:function(o){
                                        original_tags = [];
                                        idEditDisable.length = 0;
                                        $('#cellres_table tr').not('tr.header').remove();
                                        $.each(o.ajaxdata.cellres,function(key,value){
                                            if(value.SectorID === SECTORID){
                                                var strGainTrack = "Disable";
                                                if (value.UlGainTrack == 1)
                                                   strGainTrack = "Enable";
                                                //check if cell resource is used in active profile
                                                $('#cellres_table').append("<tr class='"+value.ResID.substring(value.ResID.indexOf('_')+1,value.ResID.length)+"-row table_row' data-number='"+value.ResID.substring(value.ResID.indexOf('_')+1,value.ResID.length)+"'>" +
                                                    // "<td>"+value.ResID.substring(value.ResID.indexOf('_')+1,value.ResID.length)+"</td>" +
                                                    //"<td><input class='tag_input' id='tag_"+value.ResID+"' disabled='true' value='"+value.Tag+"'/></td>" +
                                                    //"<td><input class='tag_input' id='long_tag_"+value.ResID+"' disabled='true' value='"+value['Long Tag']+"'/></td>" +
                                                    "<td><span id='tag_"+value.ResID+"'>"+value.Tag+"</span></td>" +
                                                    "<td><span id='long_tag_"+value.ResID+"'>"+value['Long Tag']+"</td>" +
                                                    "<td>"+value.Tech+"</td>" +
                                                    //"<td>"+value.AlcOffset+"</td>" +
                                                    "<td>"+strGainTrack+"</td>" +
                                                    "<td>"+value.StartCellresTxGain+"</td>" +
                                                    "<td>"+value.CellresManualLevel+"</td>" +
                                                    //"<td>"+value.StartRxRefLevel+"</td>" +
                                                    //"<td>"+value.MIMO+"</td>" +
                                                    "<td>"+convert.hz2mhz(value.StartDL,true)+"</td>" +
                                                    "<td>"+convert.hz2mhz(value.StopDL,true)+"</td>" +
                                                    "<td><a class='button edit_cellres' id='edit_"+value.ResID+"' data-cellresid = '"+value.ResID+"'data-tag='"+value.Tag+"' " +
                                                    "data-longTag='"+value["Long Tag"]+"' data-alc='"+value.AlcOffset+"' data-gain='"+value.StartCellresTxGain+"' data-manual='"+value.CellresManualLevel+"' data-track='"+value.UlGainTrack+"' data-start='"+value.StartDL+"' data-stop='"+value.StopDL+"' data-tech='"+value.Tech+"'>Edit</a>" +
                                                    "<a class='button cancel_edit_cellres_tag' id='cancel_edit_"+value.ResID+"'>Cancel</a>" +
                                                    "<a class='button delete_cellres' id='delete_"+value.ResID+"'>Delete</a><a class='button save_cellres_tag' id='save_"+value.ResID+"'>Save</a></td></tr>");
                                                $('#cellres_table').show();
                                                $('.cancel_edit_cellres_tag').hide();
                                                $('.save_cellres_tag').hide();
                                                addBand('.avail-range-indicator-bar', value.StartDL,value.StopDL,value.ResID.substring(value.ResID.indexOf('_')+1,value.ResID.length));
                                                setHoverEvents ();
                                                cellresLimits.push({"LowerDL":value.StartDL,"UpperDL":value.StopDL});
                                            }

                                            $.each(activeProfile.ajaxdata.Routes,function(key,cellres){
                                                if(cellres.CellRes === value.ResID){
                                                    $('#delete_'+value.ResID).addClass('disabled');
                                                    //$('#edit_'+value.ResID).addClass('disabled');
                                                    idEditDisable.push(value.ResID);
                                                }
                                            })
                                            //if user is read only, disabled all functionalities
                                            $.each(OPERATORLIST, function(key, value){
                                                if(value.SysName === OPERATOR && USERACCESS ==="RO"){
                                                    $('.delete_cellres').addClass('disabled');
                                                    $('.edit_cellres').addClass('disabled');
                                                }
                                            })
                                            original_tags.push({"ResID":value.ResID, "Tag":value.Tag, "Long Tag":value['Long Tag']})
                                        })
                                    }
                                })
                            }
                        })
                    },
                    onError:function(err){
                        console.log(err.errorThrown);
                    }
                })
        }

        function configBand(selector, start,stop){
            $(selector).append( '<div class="freq-indicator-range-min freq-indicator-range">' + convert.hz2mhz(start) + 'MHz</div>' );
            $(selector).append( '<div class="freq-indicator-range-max freq-indicator-range">' + convert.hz2mhz(stop) + 'MHz</div>' );
        }

        function addBand(selector, start,stop,key){
            var startPx = converter.convert( start );
            var stopPx = converter.convert( stop );
            //$(selector).append('<div class="ul-band-freq-indicator-bar band-freq-indicator-bar" data-number="' + (key+1) + '" data-du="uplink">' + (key+1) + '</div>');
            var target = $('<div id="freq-indicator-bar-'+key+'" class="freq-indicator-bar freq-indicator-bar" data-number="' + key + '"></div>');
            //console.log(startPx +" "+stopPx);
            target.width( stopPx - startPx )
                .attr( 'data-start', start)
                .attr( 'data-stop', stop )
                .attr( 'title', convert.hz2mhz(start,true) + '-' + convert.hz2mhz(stop,true) );
            target.addClass('disabled');
            //run through the list of avaialble ranges for that band and draw cell resource in there accordingly
            $(selector).each(function(){
                if($(this).attr('data-start')<=start && $(this).attr('data-stop')>=stop){
                    //console.log('add band');
                    $(this).append(target);
                    target.css( 'left', startPx - target.parent().position().left);
                }
            })
        }
        function addRange(selector, start,stop,key){
            var startPx = converter.convert( start );
            var stopPx = converter.convert( stop );
            //$(selector).append('<div class="ul-band-freq-indicator-bar band-freq-indicator-bar" data-number="' + (key+1) + '" data-du="uplink">' + (key+1) + '</div>');
            var target = $('<div id="avail-range-indicator-bar-'+key+'" class="avail-range-indicator-bar data-number="' + key + '"></div>');

            target.css( 'left', startPx ).width( stopPx - startPx )
                .attr( 'data-start', start)
                .attr( 'data-stop', stop )
                .attr( 'title', convert.hz2mhz(start,true) + '-' + convert.hz2mhz(stop,true) );
            target.addClass('disabled');
            $(selector).append(target);
        }

        function setHoverEvents () {
            console.log('set hover');
            $( '.freq-indicator-bar').hover( function () {
                console.log('on hover');
                var number = $( this ).attr( 'data-number' );
                $( '.' + number + '-row').addClass( 'focused-row');
            }, function () {
                var number = $( this ).attr( 'data-number' );
                $( '.' + number + '-row').removeClass( 'focused-row');
            });
            //revert highlight from table to bar
            $( '.table_row').hover( function () {
                var number = $( this ).attr( 'data-number' );
                //console.log( $( '#freq-indicator-bar-' + number));
                $( '#freq-indicator-bar-' + number).addClass( 'focused');
            }, function () {
                var className = $( this ).attr( 'class');
                var number = $( this ).attr( 'data-number' );
                $( '#freq-indicator-bar-' + number).removeClass( 'focused');
            });
        }

        //** an object that represents one library
        function Library ( nLib ) {
            var thisLibrary = this;
            thisLibrary.filters = [];
            // get the list of all filters
            api.exe({
                cmd:'filterdump filters ' + nLib,
                async:false, //or else span lib will be duplicated
                onSuccess: function () {
                    var parts = this.ajaxdata.match( /\d+/gi );
                    for ( var p = 0 ; p < parts.length ; p++ ) {
                        if ( parts[p] !== '-' ) {
                            thisLibrary.filters.push( Number( parts[p] ) );
                            selectedLib.push(Number( parts[p] ));
                        } else {
                            //reached the end of the meaningful part of the output!
                            break;
                        }
                    }
                    $('#band-span-select').empty();
                    $.each(thisLibrary.filters,function(i,number){
                        $('#band-span-select').append($('<option>', {
                            value: convert.hz2mhz(number),
                            text : convert.hz2mhz(number)
                        }));
                    })
                    $center.val((Number(convert.hz2mhz(LOWERDL))+ Number( $span.val() / 2 )).toFixed(5));
                    $stop.val( (Number( $center.val() ) + Number( $span.val() / 2 )).toFixed(5) );
                    $start.val((Number( $center.val() ) - Number( $span.val() / 2 )).toFixed(5) );
                    validateAll();
                    // SET NONE  RF RANGE
                    var rf_range_select = $( '#rf-range-select' );
                    rf_range_select.val("100");
                    $('#cellres-tag').val(" ");
                    $('#cellres-long-tag').val(" ");
                }
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
            var isOutofRange = false;
            var availRange=""
            //check if it is within the range it's supposed to be
            $.each(RANGELIST, function(key, value){
                var min = convert.hz2mhz(value.LowerDownLink);
                var max = convert.hz2mhz(value.UpperDownLink);
                if ( num >= min && max >= num ) {
                    isOutofRange=false;
                    return false;
                }else{
                    isOutofRange= true;
                    availRange +=min + " MHz - "+ max+" MHz\n";
                    return true;
                }
            })

            if ( isOutofRange) {
                $element.addClass( 'erroneous').attr( 'title', 'Out of available range. Available ranges are:'+availRange);
                return false;
            }else{
                //otherwise no error has been found
                $element.removeClass( 'erroneous').attr( 'title', '' );
                return true;
            }
        }

        //** validate all numerical edit boxes
        function validateAll () {
            validate( $start );
            validate( $stop );
            validate( $center );
            //validate span
            //check if bandwidth matches with the library's span list
            $.each(selectedLib,function(i,span){
                if((Number($stop.val() - $start.val()) *1000000).toFixed(0) == span){
                    $span.val(Number(span/1000000).toFixed(5));
                    $span.removeClass('erroneous');
                    return false; //break out of the if clause
                }else{
                    $span.addClass('erroneous');
                }
            })
        }

    })
