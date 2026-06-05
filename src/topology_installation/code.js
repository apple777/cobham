require([ '/js/api.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js','/js/lib/jquery-ui.js','/js/lib/jquery-jsPlumb.js','/js/lib/jquery.zoomooz.js' ],
    function ( api, convert, console, _, $) {
        var NUM_OF_BTS = 6;
        var NUM_OF_APOI = 4;
        var NUM_OF_MTDI = 4;
        var NUM_OF_MSDH = 6;
        var NUM_OF_RRU = 32;
        var PAGE_WIDTH = $(window).width()*0.9;
        var WIDTH_OF_BTS = PAGE_WIDTH*0.05;
        var WIDTH_OF_APOI = PAGE_WIDTH*0.1;
        var WIDTH_OF_MTDI = PAGE_WIDTH*0.1;
        var WIDTH_OF_MSDH = PAGE_WIDTH*0.1;
        var WIDTH_OF_RRU = PAGE_WIDTH*0.03;
        var LEFT_OFFSET = 300;

        var BTS_APOI_connections=[];
        var APOI_MTDI_connections=[];
        var BTSFullConnect = true;
        var APOIFullConnect = true;

        var MSDH_RRU_connections = [
            {"location":"buildingA","source":"MSDH_1", "target":"RRU_1"},
            {"location":"buildingA","source":"MSDH_1", "target":"RRU_2"},
            {"location":"buildingA",'source':"MSDH_1", 'target':"RRU_3"},
            {"location":"buildingA",'source':"MSDH_2", 'target':"RRU_4"},
            {"location":"buildingA",'source':"MSDH_2", 'target':"RRU_5"},
            {"location":"buildingA",'source':"MSDH_2", 'target':"RRU_6"},
            {"location":"buildingB",'source':"MSDH_3", 'target':"RRU_7"},
            {"location":"buildingB",'source':"MSDH_3", 'target':"RRU_8"},
            {"location":"buildingB",'source':"MSDH_3", 'target':"RRU_9"},
            {"location":"buildingB",'source':"MSDH_4", 'target':"RRU_10"},
            {"location":"buildingB",'source':"MSDH_4", 'target':"RRU_11"},
            {"location":"buildingC",'source':"MSDH_5", 'target':"RRU_12"},
            {"location":"buildingC",'source':"MSDH_5", 'target':"RRU_13"},
            {"location":"buildingC",'source':"MSDH_5", 'target':"RRU_14"},
            {"location":"buildingC",'source':"MSDH_6", 'target':"RRU_15"},
            {"location":"buildingC",'source':"MSDH_6", 'target':"RRU_16"},
            {"location":"buildingC",'source':"MSDH_6", 'target':"RRU_17"},
            {"location":"buildingC",'source':"MSDH_6", 'target':"RRU_18"},
            {"location":"buildingA",'source':"MSDH_1", 'target':"RRU_19"},
            {"location":"buildingA",'source':"MSDH_1", 'target':"RRU_20"},
            {"location":"buildingA",'source':"MSDH_2", 'target':"RRU_21"},
            {"location":"buildingA",'source':"MSDH_2", 'target':"RRU_22"},
            {"location":"buildingA",'source':"MSDH_2", 'target':"RRU_23"},
            {"location":"buildingB",'source':"MSDH_3", 'target':"RRU_24"},
            {"location":"buildingB",'source':"MSDH_3", 'target':"RRU_25"},
            {"location":"buildingB",'source':"MSDH_3", 'target':"RRU_26"},
            {"location":"buildingB",'source':"MSDH_4", 'target':"RRU_27"},
            {"location":"buildingB",'source':"MSDH_4", 'target':"RRU_28"},
            {"location":"buildingB",'source':"MSDH_4", 'target':"RRU_29"},
            {"location":"buildingC",'source':"MSDH_5", 'target':"RRU_30"},
            {"location":"buildingC",'source':"MSDH_5", 'target':"RRU_31"},
            {"location":"buildingC",'source':"MSDH_6", 'target':"RRU_32"}
        ]

        //jsplumb variables
        var firstInstance = jsPlumb.getInstance();
        //define default settings for plumb

        firstInstance.importDefaults({
            Container:"main_content",
            DragOptions : {
                cursor: "pointer",
                zIndex:2000
            },
            Endpoint:[ "Dot", { radius:5 } ],
            EndpointStyle : { fillStyle: "#91278f"},
            PaintStyle:{
                lineWidth:3,
                strokeStyle:"#91278f"
            },
            Connector:[ "Straight"]
        });
        var dropOptionClass = {
            hoverClass:"dropHover",
            activeClass:"dragActive"
        };
        /* create end point for BTS APOI MTDI
        var BTSEndpoint = {
            endpoint:[ "Dot", { radius:5 } ],
            endpointStyle : { fillStyle: "#861717"},
            connector:[ "Straight"],
            scope:"BTS_APOI",
            detachable:false,
            isSource:true,
            maxConnections: 1
        };
        var APOIEndpoint = {
            endpoint:[ "Dot", { radius:5 } ],
            endpointStyle : { fillStyle: "#861717"},
            connector:[ "Straight"],
            scope:"BTS_APOI",
            isTarget:true,
            reattach:true,
            maxConnections: 16,
            dropOptions: dropOptionClass,
            onMaxConnections:function(info, originalEvent) {
                console.log("user tried to drop connection", info.connection, "on element", info.element, "with max connections", info.maxConnections);
            },
            beforeDrop: function(event)
            {
                console.log("connections between "+ event.sourceId+ " and "+ event.targetId );
                BTSConnections.push(event.sourceId);
                if(BTSConnections.length==6){
                    BTSFullConnect=true;
                    drawConnections();
                }
                return true;
            }
        };
        var APOISourceEndpoint = {
            endpoint:[ "Dot", { radius:5 } ],
            endpointStyle : { fillStyle: "#91278f"},
            connector:[ "Straight"],
            scope:"APOI_MTDI",
            isSource:true,
            detachable:false,
            maxConnections: 16,
            beforeDrop: function(event)
            {
                console.log("connections between "+ event.sourceId+ " and "+ event.targetId );
                return true;
            }
        };
        var MTDITargetEndpoint = {
            endpoint:[ "Dot", { radius:5 } ],
            endpointStyle : { fillStyle: "#91278f"},
            connector:[ "Straight"],
            scope:"APOI_MTDI",
            isTarget:true,
            reattach:true,
            maxConnections: 16,
            dropOptions: dropOptionClass,
            beforeDrop: function(event)
            {
                console.log("connections between "+ event.sourceId+ " and "+ event.targetId );
                APOIConnections.push(event.sourceId);
                if(APOIConnections.length==6){
                    APOIFullConnect=true;
                    drawConnections();
                }
                return true;
            }
        };
        */

        //function draw BTS
        function drawBTS(){
            drawDevices ("BTS", NUM_OF_BTS, WIDTH_OF_BTS,60, 10);

            //connection BTS to APOI
            $('.BTS_item').each(function()
            {
                //firstInstance.addEndpoint(this, {anchor:"BottomCenter"},BTSEndpoint);

                firstInstance.makeSource(this, {
                    Endpoint:[ "Dot", { radius:5 } ],
                    anchor: "BottomCenter",
                    connectorOverlays:[
                        [ "Label", {
                            label : "",
                            id : "",
                            location: 1,
                            cssClass: 'drag'

                        } ]
                    ],
                    connector: "Straight",
                    maxConnections: 1
                });
            });

            //on mouse over
            $('.BTS_unit_item').mouseover(function(){
                $('.item_info').append("<p>"+$(this).attr('id')+"</p>");
                $('.item_info').css({top: $(this).position().top+30, left: $(this).position().left+120, position:'absolute'});
                $('.item_info').show();
            });
            $('.BTS_unit_item').mouseout(function(){
                $('.item_info').hide();
                $('.item_info').empty();
            });
        }

        function addBTS(){
            $('#addBTS_dialog').dialog({
                resizable: false,
                height:140,
                modal: true,
                buttons: {
                    Cancel: function() {
                        $( this ).dialog( "close" );
                    },
                    "Add BTS": function() {
                        $('.BTS_unit_item').remove();
                        NUM_OF_BTS=NUM_OF_BTS+1;
                        drawBTS();
                        setTimeout(function() {
                            firstInstance.repaintEverything();
                        }, 200);
                        $( this ).dialog( "close" );
                    }
                }
            });
        }
        //connect MTDI to MSDH
        function drawConnections(){
            if(BTSFullConnect && APOIFullConnect){
                var mtdi1 = firstInstance.addEndpoint('MTDI_1',{anchor:"BottomCenter"});
                var mtdi2 = firstInstance.addEndpoint('MTDI_2',{anchor:"BottomCenter"});
                var mtdi3 = firstInstance.addEndpoint('MTDI_3',{anchor:"BottomCenter"});
                var mtdi4 = firstInstance.addEndpoint('MTDI_4',{anchor:"BottomCenter"});
                var msdh1 = firstInstance.addEndpoint('MSDH_1',{anchor:"TopCenter"});
                var msdh2 = firstInstance.addEndpoint('MSDH_2',{anchor:"TopCenter"});
                var msdh3 = firstInstance.addEndpoint('MSDH_3',{anchor:"TopCenter"});
                var msdh4 = firstInstance.addEndpoint('MSDH_4',{anchor:"TopCenter"});
                var msdh5 = firstInstance.addEndpoint('MSDH_5',{anchor:"TopCenter"});
                var msdh6 = firstInstance.addEndpoint('MSDH_6',{anchor:"TopCenter"});

                firstInstance.connect({
                    source:mtdi1,
                    target:msdh1,
                    detachable:false
                });

                firstInstance.connect({
                    source:mtdi2,
                    target:msdh2,
                    detachable:false
                });
                firstInstance.connect({
                    source:mtdi3,
                    target:msdh3,
                    detachable:false
                });
                firstInstance.connect({
                    source:mtdi4,
                    target:msdh4,
                    detachable:false
                });
                firstInstance.connect({
                    source:mtdi3,
                    target:msdh5,
                    detachable:false
                });
                firstInstance.connect({
                    source:mtdi4,
                    target:msdh6,
                    detachable:false
                });

                //connect MSDH to RRU
                $.each(MSDH_RRU_connections, function(key, value){
                    var rru = firstInstance.addEndpoint(value.target,{anchor:"TopCenter"});
                    firstInstance.connect({
                        source:value.source,
                        target:rru,
                        detachable:false,
                        Connector:["Bezier", { curviness:70 }],
                        hoverPaintStyle:{strokeStyle:"#257c17"}
                    });
                })

                //make RRU draggable within RRU container
                firstInstance.draggable($('.RRU_unit_item'), { containment: $('#RRU_container') });

                //create droppable zone for RRU

                $('.droppable').droppable({
                    drop: function(event, ui) {
                        var pos = ui.draggable.position();
                        axellPopUp('New location: ' + $(this).attr("id")+ ', top: ' + pos.top+ ', left: ' + pos.left);
                        ui.draggable.attr('location', $(this).attr("id"));
                    }
                });
            }

        }

        function drawDevices (descriptor, numOfDevice, widthOfDevice,ledOffsetLeft, ledOffsetTop){
            for(var i =1; i <= numOfDevice; i++){
                $('#'+descriptor+'_container').append('<div id="'+descriptor+'_'+i+'_unit_container" class="APOI_unit_item"/></div>');
                $('#'+descriptor+'_'+i+'_unit_container').append('<img id="'+descriptor+'_' + i +'" class="'+descriptor+'_item" src="../images/icons/'+descriptor+'_icon.png"/>');
                $('#'+descriptor+'_'+i+'_unit_container').append('<div id="'+descriptor+'_' + i +'_led" class="led round green"></div>');
                $('#'+descriptor+'_'+i+'_led').css('position', 'absolute');
                $('#'+descriptor+'_'+i+'_led').css('left', ledOffsetLeft+'px');
                $('#'+descriptor+'_'+i+'_led').css('top',ledOffsetTop+'px');
                $('#'+descriptor+'_'+i+'_unit_container').css('margin-right', ((PAGE_WIDTH - LEFT_OFFSET - numOfDevice * widthOfDevice) / numOfDevice /2)+'px');
                $('#'+descriptor+'_'+i+'_unit_container').css('margin-left', ((PAGE_WIDTH - LEFT_OFFSET - numOfDevice * widthOfDevice) / numOfDevice /2)+'px');
            }
        }

        $(document).ready(function() {
            //draw BTS
            drawBTS();

            //draw APOI
            drawDevices ("APOI", NUM_OF_APOI, WIDTH_OF_APOI,140, 20);

            //draw MTDI
            drawDevices ("MTDI", NUM_OF_MTDI, WIDTH_OF_MTDI,140, 25);

            //draw MSDH
            drawDevices ("MSDH", NUM_OF_MSDH, WIDTH_OF_MSDH,140, 15);

            //draw RRU and add RRU LED
            $.each(MSDH_RRU_connections,function(key, value){
                $('#'+value.location).append('<div id="'+value.target+'_unit_container" class="RRU_unit_item"></div>');
                $("#"+value.target+"_unit_container").append('<img id="'+ value.target +'" class="RRU_item" src="../images/icons/RRU_icon.png"/>');
                $("#"+value.target+"_unit_container").append('<div id="' + value.target +'_led" class="led round green"></div>');
                $('#' + value.target +'_led').css('position', 'absolute');
                $('#' + value.target +'_led').css('left', '10px');
                $('#' + value.target +'_led').css('top','5px');
            })


            $('.icon.minmaxbutton').click(function(){
                if($(this).hasClass('minimize')){
                    $(this).parent().parent().find('.contents').hide();
                    $(this).removeClass("minimize").addClass("maximize");
                    $.each($(this).parent().parent().find('.contents').children(), function(){
                        firstInstance.hide($(this).find('img').attr('id'),true);
                    })
                }else if($(this).hasClass('maximize')){
                    $(this).parent().parent().find('.contents').show();
                    $(this).addClass("minimize").removeClass("maximize");
                    $.each($(this).parent().parent().find('.contents').children(), function(){
                        firstInstance.show($(this).find('img').attr('id'),true);
                        firstInstance.repaint($(this).find('img').attr('id'));
                    })
                }
                firstInstance.repaintEverything();
            })


            $('#add_btn').click(function(){
                addBTS();
            })
            //let's try out jsplump
            firstInstance.bind("ready", function() {
                setTimeout(function() {
                    firstInstance.repaintEverything();
                }, 200);

               $('.APOI_item').each(function()
                {
                    //firstInstance.addEndpoint(this,{anchor:"TopCenter"},APOIEndpoint);
                    //firstInstance.addEndpoint(this,{anchor:"BottomCenter"},APOISourceEndpoint);

                    firstInstance.makeTarget(this, {
                        Endpoint:[ "Dot", { radius:5 } ],
                        anchor: "TopCenter",
                        maxConnections: -1,
                        reattach:true,
                        beforeDrop: function(event)
                        {
                            console.log("connections between "+ event.sourceId+ " and "+ event.targetId );
                            BTSConnections.push(event.sourceId);
                            if(BTSConnections.length==6){
                                BTSFullConnect=true;
                                drawConnections();
                            }
                            return true;
                        }
                    });
                });

                //connection APOI to MTDI
                $('.APOI_item').each(function()
                {
                    //firstInstance.addEndpoint(this,{anchor:"BottomCenter"},APOISourceEndpoint);

                    firstInstance.makeSource(this, {
                        Endpoint:[ "Dot", { radius:5 } ],
                        anchor: "BottomCenter",
                        connectorOverlays:[
                            [ "Label", {
                                label : "",
                                id : "",
                                location: 1,
                                cssClass: 'drag'

                            } ]
                        ],
                        connector: "Straight",
                        maxConnections: -1
                    });

                });


                $('.MTDI_item').each(function()
                {
                    //firstInstance.addEndpoint(this,{anchor:"TopCenter"},MTDITargetEndpoint);
                    firstInstance.makeTarget(this, {
                        Endpoint:[ "Dot", { radius:5 } ],
                        anchor: "TopCenter",
                        maxConnections: -1,
                        reattach:true,
                        beforeDrop: function(event)
                        {
                            console.log("connections between "+ event.sourceId+ " and "+ event.targetId );
                            APOIConnections.push(event.sourceId);
                            if(APOIConnections.length==4){
                                APOIFullConnect=true;
                                drawConnections();
                            }
                            return true;
                        }
                    });
                });
            });
        });

        $(window).resize(function() {
            firstInstance.repaintEverything();
        });
    })
