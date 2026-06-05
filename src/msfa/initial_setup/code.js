/**
 * Created by Emerald on 18/12/14.
 */
require([ '/js/api.js','/js/lib/d3.min.js','/js/lib/jquery.js','/js/convert.js','/js/scheduler.js','/js/util.js','/js/lib/jquery-jsPlumb.js','/js/lib/jquery-ui.js','/js/lib/underscore.js','/js/lib/tipsy.js','/js/lib/jquery.blockUI.js' ],
    function ( api,d3,$,convert,scheduler,util) {
        var OPERATORS =[];
        var operatorList = [];
        var addedOperatorList=[];

       //clear current op
        $.removeCookie('currentOperator',{ path: '/' });
        $(document).ready(function(){
            $('header#header').hide();
            $(document).on('click','#apply-btn',function(){
                $.blockUI({
                    message: "Setting Device. Please Wait.",
                    fadeIn: 500,
                    timeout: 10000,
                    onBlock: function() {
                        sendCmd();
                    }
                })
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

        function sendCmd(){
            //check if all details have been filled in
            var opNameIsFilled =true;
            var operatorDescription = '';
            
            var configurationType
            
            var systemMode = document.getElementsByName("mode");
            var systemModeIndex;

            for(var i = 0; i < systemMode.length; i ++){
                if(systemMode[i].checked == true){
                    configurationType= systemMode[i].value;
                }
            }
            
            if(configurationType == "Switch"){
                systemModeIndex = 2;
                api.exe({
                    cmd:'msfa_settings set system Switch',
                })
            }
            else if (configurationType == "Transponder"){
                systemModeIndex = 1;
                api.exe({
                    cmd:'msfa_settings set system Transponder',
                })
            }
            else{
                systemModeIndex = 3;
                api.exe({
                    cmd:'msfa_settings set system TapperTransponder',
                })
            }
            
            if($('#operator_name').val() == ""){
                opNameIsFilled = false;
            }
            if($('#operator_description').val() != ""){
                operatorDescription = $('#operator_description').val();
            }
            else{
                operatorDescription = $('#operator_name').val();
            }

            if(!opNameIsFilled){
                axellPopUp("Please fill in a valid operator name. Operator name should be 5-25 characters long and only contain [a-z0-9-_], no space and uppercase is allowed");
            }
            else{
                var cmd ='opadd ' + $('#operator_name').val() + ' "' + operatorDescription + '"';
                api.exe({
                    cmd: cmd,
                    async:false,
                    onSuccess:function(){
                        var fpga_config_cmd = "fpga_config " + systemModeIndex + " 0 3 1";
                        api.exe({
                            cmd: fpga_config_cmd,
                            async:false,
                            onSuccess:function(){
                                window.location.href = '/target/';
                            },
                            onError:function(err){
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
