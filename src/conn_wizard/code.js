require([ '/js/api.js', '/js/convert.js', '/js/console.js', '/js/lib/underscore.js', '/js/lib/jquery.js','/js/lib/jquery-jsPlumb.js','/js/convert.js','/js/lib/jquery-ui.js','/js/lib/jquery.maphilight.js','/js/lib/jquery_cookie.js'],
    function (api, convert, console, _, $) {
        var SECTORLOWERDL;
        var SECTORUPPERDL;
        var params = getUrlParams ();
        var SECTORBAND = params.band;
        var CONNTYPE = params.conntype;
        var SECTORID = params.sectorid;
        var VIRTUAL = JSON.parse(params.virtual);
        var OPERATOR = $.cookie('currentOperator');
        var sectorList = [];
        var unocupiedSlotList =[];
        var APOIid;
        var MTDIid;
        var MSDHid;
        var APOIportNo;
        var MSDHportNo;
        var APOIinputSlotNo;
        var APOIoutputSlotNo;
        var MTDIportNo;
        var MTDIinputSlotNo;
        var APOIid_MIMO;
        var MTDIid_MIMO;
        var APOIportNo_MIMO;
        var APOIinputSlotNo_MIMO;
        var APOIoutputSlotNo_MIMO;
        var MTDIportNo_MIMO;
        var MTDIinputSlotNo_MIMO;
        var faultyColor ="ff0000";
        var highlightedColor="00b422";
        var defaultHighlightColor ="0074e6";
        var occupiedPort_2 = [];
        var topo=[];
        var bandList=[];

        api.exe({
           cmd:'bands --json',
           dataType:'json',
           onSuccess:function(o){
               bandList = o.ajaxdata.bands;
           }  
        });
    
//#00b422, 1a8dff

        //jsplumb variables
        var firstInstance = jsPlumb.getInstance();
        //define default settings for plumb

        firstInstance.importDefaults({
            Container:"APOI_display_table",
            DragOptions : {
                cursor: "pointer",
                zIndex:2000
            }
        });
        var secondInstance = jsPlumb.getInstance();
        //define default settings for plumb

        secondInstance.importDefaults({
            Container:"mimo_APOI_display_table",
            DragOptions : {
                cursor: "pointer",
                zIndex:2001
            }
        });

        $(document).ready(function(){
            api.exe({
                cmd:'sector -o '+OPERATOR+' --json',
                dataType:'json',
                onSuccess:function(o){
                    sectorList = o.ajaxdata.sector;
                    $.each(o.ajaxdata.sector, function(key, sector){
                        if(sector.SectorID === SECTORID){
                            SECTORLOWERDL = sector.LowerBandDL;
                            SECTORUPPERDL = sector.UpperBandDL;
                        }
                    })
                    //populate sector id, tag
//                    $('#sector_id').text(SECTORID);
                    $('#sector_tag').text(_.findWhere(sectorList,{"SectorID":SECTORID}).Tag);
                    $('#bts_tag').text(_.findWhere(sectorList,{"SectorID":SECTORID})["BTS Tag"]);
//                    $('#sector_id2').text(SECTORID);
                    $('#sector_tag2').text(_.findWhere(sectorList,{"SectorID":SECTORID}).Tag);
                    $('#bts_tag2').text(_.findWhere(sectorList,{"SectorID":SECTORID})["BTS Tag"]);
                    
                    var foundAvailablePorts =false;
                    //disable save button until complete connection wizard
                    $('#save').addClass('disabled');
                    $('.APOI_display').add($('.MTDI_display')).add($('.mimo_APOI_display')).add($('.mimo_MTDI_display')).add($('.mimo')).hide();
                    $('#instruction1').add($('#instruction2')).add($('#instruction3')).add($('#instruction4')).add($('#instruction5'))
                        .add($('#instruction6')).add($('#instruction7')).add($('#instruction8')).add($('#instruction9')).hide();
                    $('.conn_panel_header').hide();
                    $('#guide_tool_DL').hide();
                    $('#guide_tool_UL').hide();

                    //populate sector id, band, rf interface in configuration table
                    /*
                    $('#sector_id').text(SECTORID);
                    $('#sector_tag').text(_.findWhere(sectorList,{"SectorID":SECTORID}).Tag);
                    $('#bts_tag').text(_.findWhere(sectorList,{"SectorID":SECTORID})["BTS Tag"]);
                    */
                    var desc;
                    $.each(bandList, function (i, value) {
                        if(value.Band == SECTORBAND){
                           desc = value.FullName.replace("MHz ", "").replace("Band", "").replace("BAND", "");
                        }
                    })
                    $('#band_id').text(desc);
                    $('#band_id2').text(desc);
                    $('#conn_type').text(CONNTYPE);

                    unocupiedSlotList = [];
                    
                    if (VIRTUAL)
                    {
                       api.exe({
                           cmd: "topology -o " + OPERATOR + " --json",
                           dataType: 'json',
                           async: false,
                           onSuccess: function (o) {
                               $.each(o.ajaxdata.nodes, function (i, top) {
                                   topo[i] = top;
                             })

                             connToMSDH();
                           }
                       })
                    }
                    else
                    {
                       //get APOI and MTDI slot that within chosen frequency band and unoccupied by other connections
                       api.exe({
                           cmd:'rfranges --json',
                           dataType:'json',
                           onSuccess:function(o){
                               var data = o.ajaxdata;
                               var availNode=[];

                               //verify which slot in APOI and MTDI is within frequency range with added sector
                               $.each(data.nodes, function(index, node){
                                   if(node.NodeType.indexOf("MTDI") != -1 || node.NodeType.indexOf("APOI") != -1){
                                       var availRange =[];
                                       $.each(node.Ranges, function(key, range){
                                           if(SECTORBAND === range.Type) {
                                               if (SECTORLOWERDL >= range.LowerDL && SECTORUPPERDL <= range.UpperDL) {
                                                   availRange.push(range.Band);
                                               }
                                           }
                                       })
                                       availNode.push({"ID":node.ID,"NodeType":node.NodeType,"Tag":node.Tag,"Ranges":availRange});
                                   }
                               })
                               console.log(availNode);

                               //running through connections cmd to check which slot in found slot above has already been occupied
                               api.exe({
                                   cmd:'connections -o '+OPERATOR+' --json',
                                   async:false,
                                   dataType:'json',
                                   onSuccess:function(o){
                                       var rfConn = o.ajaxdata.rf_connections;
                                       var occupiedList =[];

                                       $.each(availNode,function(i,node){
                                           var occupiedRangeList = [];
                                           $.each(node.Ranges, function(j,range){
                                               var occupiedPort=[];
                                               var tempOccupiedPort=[];
                                               $.each(rfConn, function (key, rfconn){
                                                   if(rfconn.Type === 'DUPL'){
                                                       $.each(rfconn.conn, function (key, conn){
                                                           if(conn.To.indexOf(node.ID+':'+range+':SECT-DL1') !=-1 || conn.To.indexOf(node.ID+':'+range+':SECT-DL2') !=-1
                                                               ||conn.To.indexOf(node.ID+':'+range+':DL1') !=-1 || conn.To.indexOf(node.ID+':'+range+':DL2') !=-1){
                                                               if(conn.ToType.indexOf('MTDI') != -1){
                                                                   if(tempOccupiedPort.indexOf(conn.To.substring(conn.To.length-1)) == -1){
                                                                       tempOccupiedPort.push(conn.To.substring(conn.To.length-1));
                                                                   }
                                                                   else{
                                                                       occupiedPort.push(conn.To.substring(conn.To.length-1));
                                                                   }
                                                               }
                                                               else {
                                                                   occupiedPort.push(conn.To.substring(conn.To.length-1));
                                                               }
                                                           }
                                                       })
                                                   }
                                                   else {
                                                       $.each(rfconn.conn, function (key, conn){
                                                           if(conn.To.indexOf(node.ID+':'+range+':SECT-DL1') !=-1 || conn.To.indexOf(node.ID+':'+range+':SECT-DL2') !=-1
                                                               ||conn.To.indexOf(node.ID+':'+range+':DL1') !=-1 || conn.To.indexOf(node.ID+':'+range+':DL2') !=-1){
                                                               occupiedPort.push(conn.To.substring(conn.To.length-1));
                                                           }
                                                       })
                                                   }
                                               })
                                               //remove port 2 in APOI by adding them to occupied Port
                                               /*
                                               if(node["NodeType"].indexOf("APOI") != -1){
                                                   occupiedPort.push("2");
                                               }*/
                                               occupiedRangeList.push({"Band":range,"Port":occupiedPort});
                                           })

                                           occupiedList.push({"ID":node.ID,"Ranges":occupiedRangeList});
                                       })
                                       //find out unoccupied slot and port to highlight on image map
                                       $.each(availNode,function(nodekey, availnode){
                                           $.each(occupiedList,function(nodekey, slot){
                                               if(availnode.ID === slot.ID){
                                                   var unoccupiedRangeList =[];
                                                   $.each(availnode.Ranges,function(key, range){
                                                       $.each(slot.Ranges,function(key, slotRange){
                                                           if(range === slotRange.Band){
                                                               var unocupiedPortList = _.difference(["1","2"],slotRange.Port );
                                                               unoccupiedRangeList.push({"Band":range,"Port":unocupiedPortList});
                                                               //if found port then carry on, or else display msg and send user back to main page
                                                               if(unocupiedPortList.length>0){
                                                                   foundAvailablePorts=true;
                                                               }
                                                           }
                                                       })
                                                   })
                                                   //console.log(unoccupiedRangeList);
                                                   unocupiedSlotList.push({"ID":availnode.ID,"NodeType":availnode.NodeType,"Tag":availnode.Tag,"Ranges":unoccupiedRangeList});
                                               }
                                           })
                                       })
                                       //if connection type is duplex, force user to choose connection to APOI
                                       //if not user can choose either connect to APOI or MTDI
                                       console.log(unocupiedSlotList)
                                       if(foundAvailablePorts) { //if found port then carry on, or else display msg and send user back to main page
   //                                        if (CONNTYPE.indexOf("DUPL") != -1) {
   //                                            connToAPOI();
   //                                        } else {
                                               var foundAPOIAvailPort = false;
                                               var foundMTDIAvailPort = false;
                                               $.each(unocupiedSlotList, function(key,value) {
                                                   $.each(value.Ranges, function (index, range) {
                                                       if (range.Port.length > 0 && value.NodeType.indexOf("APOI") != -1) {
                                                           foundAPOIAvailPort = true;
                                                       }else if (range.Port.length > 0 && value.NodeType.indexOf("MTDI") != -1) {
                                                           foundMTDIAvailPort =true;
                                                       }
                                                   })
                                               })

                                               if(foundAPOIAvailPort){ //} && foundMTDIAvailPort){
                                                   step1();
                                               }else if(!foundAPOIAvailPort && foundMTDIAvailPort){
                                                   MTDI_instruct(false);
                                                   connToMTDI();
                                               }else{
                                                   axellPopUp("There is no available MTDI device with correct ranges in the system or all ports have been fully occupied. <br>You will be redirected to main page shortly");
                                                   setTimeout(function(){
                                                       window.location.href = "/target";
                                                   },5000)
                                               }
   //                                        }
                                       }else{
                                           axellPopUp("There is no available device in the system or all ports have been fully occupied. <br>You will be redirected to main page shortly");
                                           setTimeout(function(){
                                               window.location.href = "/target";
                                           },5000)
                                       }
                                   }
                               })

                           }
                       })
                    }
                }
            })
            
            //when cancel ask if user is sure
            // ask user if they want to delete added sector
            //if yes delete the sector, no go straight to topology page and they have option to go back to conn_wizard from sidebar
            $('#cancel').click(function(){
                axellConfirm("info","Notice",'Are you sure you want to cancel setting up BTS port connection wizard ?',function(){
                    axellConfirm("alert","Warning",'Do you want to delete the BTS port you just added ?',function(){
                        api.exe({
                            cmd:'SECTOR -o '+OPERATOR+' DELETE ' + SECTORID,
                            dataType:'text',
                            onSuccess:function(){
                                window.location = '/target';
                            },
                            onError:function(o){
                                axellPopUp(o.errorThrown);
                            }
                        })
                    },function(){
                        window.location = '/target';
                    });
                },null);
            })
            //when save
            //going through all usecase:  DLUL,DUPL, MIMO, DUPLMIMO
            $('#save').click(function(){
                console.log("save");
                var s2a_cmd;
                var a2m_cmd1;
                var a2m_cmd2;
                var s2m_cmd;
                var s2msdh_cmd;
                if (VIRTUAL){
                    s2msdh_cmd = 'CONNECTIONS -o '+OPERATOR+' ADD -s2msdh '+ SECTORID+' '+ MSDHid +' '+MSDHportNo;
                }else if(CONNTYPE === "DLUL"){
                    s2a_cmd = 'CONNECTIONS -o '+OPERATOR+' ADD -s2a '+ SECTORID+' '+ APOIid +' '+APOIportNo +' ' +APOIinputSlotNo;
                    s2m_cmd ='CONNECTIONS -o '+OPERATOR+' ADD -s2m '+ 'DLUL ' + SECTORID+' '+ MTDIid +' '+MTDIportNo +' ' +MTDIinputSlotNo;
                    a2m_cmd1 = 'CONNECTIONS -o '+OPERATOR+' ADD -a2m DLUL '+ APOIid+' '+APOIportNo + ' ' + APOIinputSlotNo + ' '+ MTDIid +' '+MTDIportNo+' ' +MTDIinputSlotNo;
                }else if (CONNTYPE === "DUPL"){
                    s2a_cmd = 'CONNECTIONS -o '+OPERATOR+' ADD -s2a '+ SECTORID+' '+ APOIid +' '+APOIportNo +' ' +APOIinputSlotNo + ' DUPLEX';
                    s2m_cmd ='CONNECTIONS -o '+OPERATOR+' ADD -s2m '+ 'DUPL ' + SECTORID+' '+ MTDIid +' '+MTDIportNo +' ' +MTDIinputSlotNo;
                    //non mimo need to connect apoi to mtdi once
                    a2m_cmd1 = 'CONNECTIONS -o '+OPERATOR+' ADD -a2m DUPL '+ APOIid+' '+APOIportNo +' ' + 1 + ' '+ MTDIid +' '+MTDIportNo+' ' +MTDIinputSlotNo;
                }else if (CONNTYPE === "MIMO"){
                    //CONNECTIONS ADD -s2a SECT_5 CFKD 3 2 -MIMO CFKD 4 2
                    s2a_cmd = 'CONNECTIONS -o '+OPERATOR+' ADD -s2a '+ SECTORID+' '+ APOIid +' '+APOIportNo +' ' +APOIinputSlotNo + ' -MIMO '+ APOIid_MIMO+' '+APOIportNo_MIMO+' '+APOIinputSlotNo_MIMO;
                    //CONNECTIONS ADD -s2m SECT_10 BMMX 1:2 1 -MIMO BMMX 2:2 2
                    s2m_cmd ='CONNECTIONS -o '+OPERATOR+' ADD -s2m '+ 'MIMO ' +SECTORID+' '+ MTDIid +' '+MTDIportNo +' ' +MTDIinputSlotNo+ ' -MIMO '+MTDIid_MIMO +' '+MTDIportNo_MIMO+' '+MTDIinputSlotNo_MIMO;
                    //connect from apoi to sector, in MIMO case, need to send 2 commands
                    a2m_cmd1 = 'CONNECTIONS -o '+OPERATOR+' ADD -a2m MIMO '+ APOIid+' '+APOIportNo +' ' + APOIinputSlotNo + ' '+ MTDIid +' '+MTDIportNo+' ' +MTDIinputSlotNo;
                    a2m_cmd2 = 'CONNECTIONS -o '+OPERATOR+' ADD -a2m MIMO '+ APOIid_MIMO+' '+APOIportNo_MIMO +' ' + APOIinputSlotNo + ' '+ MTDIid_MIMO +' '+MTDIportNo_MIMO+' ' +MTDIinputSlotNo_MIMO;
                }else if (CONNTYPE === "MIMODUPL"){
                    //CONNECTIONS ADD -s2a SECT_6 CFKD 5 1 DUPLEX -MIMO CFKD 6 1
                    s2a_cmd = 'CONNECTIONS -o '+OPERATOR+' ADD -s2a '+ SECTORID+' '+ APOIid +' '+APOIportNo +' ' +APOIinputSlotNo + ' DUPLEX -MIMO '+ APOIid_MIMO+' '+APOIportNo_MIMO+' '+APOIinputSlotNo_MIMO;
                    s2m_cmd ='CONNECTIONS -o '+OPERATOR+' ADD -s2m '+ 'MIDU ' + SECTORID+' '+ MTDIid +' '+MTDIportNo +' ' +MTDIinputSlotNo+ ' -MIMO '+MTDIid_MIMO +' '+MTDIportNo_MIMO+' '+MTDIinputSlotNo_MIMO;
                    //connect from apoi to sector, in MIMO case, need to send 2 commands
                    a2m_cmd1 = 'CONNECTIONS -o '+OPERATOR+' ADD -a2m MIDU '+ APOIid+' '+APOIportNo +' ' + APOIinputSlotNo + ' '+ MTDIid +' '+MTDIportNo+' ' +MTDIinputSlotNo;
                    a2m_cmd2 = 'CONNECTIONS -o '+OPERATOR+' ADD -a2m MIDU '+ APOIid_MIMO+' ' + APOIinputSlotNo + ' '+APOIportNo_MIMO +' '+ MTDIid_MIMO +' '+MTDIportNo_MIMO+' ' +MTDIinputSlotNo_MIMO;
                }
                //console.log(APOIid +" "+MTDIid+" "+APOIid_MIMO+" "+MTDIid_MIMO);
                api.exe({
                   cmd:'CELLRES CHECK '+OPERATOR+' '+SECTORID+' '+MTDIid,
                   onSuccess:function(){
                      if (VIRTUAL){
                        api.exe({
                           cmd:s2msdh_cmd,
                           onSuccess:function(){
                               console.log('Connection from BTS port to MSDH has been added successfully');
                               addSuccessfully();
                           },
                           onError:function(){
                               axellPopUp('Error add connection from BTS port to MSDH: '+this.errorThrown);
                           }
                        })
                      }else if(CONNTYPE.indexOf('MIMO') != -1){
                          if (APOIid !=undefined && MTDIid !=undefined && APOIid_MIMO !=undefined && MTDIid_MIMO !=undefined){
                              api.exe({
                                  cmd:s2a_cmd,
                                  onSuccess:function(){
                                      console.log('Connection from BTS port to APOI has been added successfully');
                                      api.exe({
                                          cmd:a2m_cmd1,
                                          onSuccess:function(){
                                              console.log('Connection from BTS port to APOI and APOI to MTDI has been added successfully');
                                              //window.location='/target/cellresource/index.html?sectorid='+SECTORID+'&band='+BAND;
                                          },
                                          onError:function(){
                                              axellPopUp('Error add connection from APOI to MTDI: '+this.errorThrown);
                                          }
                                      })
                                      api.exe({
                                          cmd:a2m_cmd2,
                                          onSuccess:function(){
                                              console.log('Connection from BTS port to APOI and APOI to MTDI has been added successfully');
                                              addSuccessfully();
                                          },
                                          onError:function(){
                                              axellPopUp('Error add connection from APOI to MTDI: '+this.errorThrown);
                                          }
                                      })
                                  },
                                  onError:function(){
                                      axellPopUp('Error add connection from BTS port to APOI: '+this.errorThrown);
                                  }
                              })
                          }else if ((APOIid ===undefined && MTDIid !=undefined && APOIid_MIMO === undefined && MTDIid_MIMO !=undefined)){
                              api.exe({
                                  cmd:s2m_cmd,
                                  onSuccess:function(){
                                      console.log('Connection from BTS port to MTDI has been added successfully');
                                      addSuccessfully();
                                  },
                                  onError:function(){
                                      axellPopUp('Error add connection from BTS port to MTDI: '+this.errorThrown);
                                  }
                              })

                          }else if ((APOIid !=undefined && MTDIid !=undefined && APOIid_MIMO != undefined && MTDIid_MIMO ===undefined)){
                              api.exe({
                                  cmd:s2a_cmd,
                                  onSuccess:function(){
                                      console.log('Connection from BTS port to APOI has been added successfully');
                                      api.exe({
                                          cmd:a2m_cmd1,
                                          onSuccess:function(){
                                              console.log('Connection from BTS port to APOI and APOI to MTDI has been added successfully');
                                              addSuccessfully();
                                          },
                                          onError:function(){
                                              axellPopUp('Error add connection from APOI to MTDI: '+this.errorThrown);
                                          }
                                      })
                                  },
                                  onError:function(){
                                      axellPopUp('Error add connection from BTS port to APOI: '+this.errorThrown);
                                  }
                              })
                          }else if ((APOIid !=undefined && MTDIid ===undefined && APOIid_MIMO != undefined && MTDIid_MIMO !=undefined)){
                              api.exe({
                                  cmd:s2a_cmd,
                                  onSuccess:function(){
                                      console.log('Connection from BTS port to APOI has been added successfully');
                                      api.exe({
                                          cmd:a2m_cmd2,
                                          onSuccess:function(){
                                              console.log('Connection from BTS port to APOI and APOI to MTDI has been added successfully');
                                              addSuccessfully();
                                          },
                                          onError:function(){
                                              axellPopUp('Error add connection from APOI to MTDI: '+this.errorThrown);
                                          }
                                      })
                                  },
                                  onError:function(){
                                      axellPopUp('Error add connection from BTS port to APOI: '+this.errorThrown);
                                  }
                              })
                          }else if ((APOIid !=undefined && MTDIid ===undefined && APOIid_MIMO != undefined && MTDIid_MIMO ===undefined)){
                              api.exe({
                                  cmd:s2a_cmd,
                                  onSuccess:function(){
                                      console.log('Connection from BTS port to APOI has been added successfully');
                                      addSuccessfully();
                                  },
                                  onError:function(){
                                      axellPopUp('Error add connection from BTS port to APOI: '+this.errorThrown);
                                  }
                              })
                          }
                      }else{
                          if(APOIid != undefined && MTDIid !=undefined){
                              api.exe({
                                  cmd:s2a_cmd,
                                  onSuccess:function(){
                                      console.log('Connection from BTS port to APOI has been added successfully');
                                      api.exe({
                                          cmd:a2m_cmd1,
                                          onSuccess:function(){
                                              console.log('Connection from BTS port to APOI and APOI to MTDI has been added successfully');
                                              addSuccessfully();
                                          },
                                          onError:function(){
                                              axellPopUp('Error add connection from APOI to MTDI: '+this.errorThrown);
                                          }
                                      })
                                  },
                                  onError:function(){
                                      axellPopUp('Error add connection from BTS port to APOI: '+this.errorThrown);
                                  }
                              })
                          }else if(APOIid != undefined && MTDIid === undefined){
                              api.exe({
                                  cmd:s2a_cmd,
                                  onSuccess:function(){
                                      console.log('Connection from BTS port to APOI has been added successfully');
                                      addSuccessfully();
                                  },
                                  onError:function(){
                                      axellPopUp('Error add connection from BTS port to APOI: '+this.errorThrown);
                                  }
                              })
                          }else if(APOIid === undefined && MTDIid != undefined){
                              api.exe({
                                  cmd:s2m_cmd,
                                  onSuccess:function(){
                                      console.log('Connection from BTS port to MTDI has been added successfully');
                                      addSuccessfully();
                                  },
                                  onError:function(){
                                      axellPopUp('Error add connection from BTS port to MTDI: '+this.errorThrown);
                                  }
                              })
                          }
                      }
                   },
                   onError:function(err){
                        axellPopUp(err.errorThrown);
                   }
                })
            })
        })
        //when add connection successfully ask them if they want to continute add cell resource to sector
        function addSuccessfully(){
            //axellConfirm("info","Notice",'BTS port connections have been added successfully. Do you want to add cell resources to BTS port?',function(){
                window.location='/target/cellresource/index.html?sectorid='+SECTORID;
            /*},function(){
                window.location='/target';
            });*/
        }

        //run in MIMO case, mimimize first mimo connection
        function minimize(){
            $(document).off("click",'.icon.minmaxbutton')
                .on("click",'.icon.minmaxbutton',function(){
                if($(this).hasClass('maximize')){
                    if(APOIid != undefined){
                        $('.APOI_display').show();
                        $('#guide_tool_DL').add($('#guide_tool_UL')).show();
                    }
                    if(MTDIid !=undefined){
                        $('.MTDI_display').show();
                    }
                    firstInstance.show($('#APOI_model'),true);
                    firstInstance.show($('#MTDI_model'),true);
                    firstInstance.repaintEverything();
                    secondInstance.repaintEverything();
                    $(this).addClass("minimize").removeClass("maximize");

                    showGuideTool();
                    showMIMOGuideTool();
                }else if($(this).hasClass('minimize')){
                    $(this).addClass("maximize").removeClass("minimize");
                    $('.APOI_display').add($('.MTDI_display')).hide()
                    firstInstance.hide($('#APOI_model'),true);
                    firstInstance.hide($('#MTDI_model'),true);
                    secondInstance.repaintEverything();
                    $('#guide_tool_DL').add($('#guide_tool_UL')).hide();
                    showMIMOGuideTool();
                }
            })
        }
        //first step to let user choose either APOI or MTDI to connect to
        function step1(){
            $('#instruction_txt1').append('<b>Would you like to connect the BTS port to APOI or MTDI?</b> ');
            $('#instruction_txt1').append('<select id="APOI_MTDI_select"><option value="">Select</option><option value="APOI">Axell Point of Interface</option><option value="MTDI">Multi Technology Digital Interface</option></select>');
            $('#instruction1').show();
            setInstructionStt(1);
            $(document).on('change','#APOI_MTDI_select',function(){
                $('#guide_tool_UL').hide();
                $('#guide_tool_DL').hide();
                firstInstance.detachEveryConnection();
                firstInstance.deleteEveryEndpoint();
                secondInstance.detachEveryConnection();
                secondInstance.deleteEveryEndpoint();
                $('.APOI_conn_info').empty();
                $('.MTDI_conn_info').empty();
                $('.mimo_APOI_conn_info').empty();
                $('.mimo_MTDI_conn_info').empty();
                if($('#APOI_MTDI_select').val() === "APOI"){
                    $('#instruction2').add($('#instruction3')).add($('#instruction4')).add($('#instruction5'))
                        .add($('#instruction6')).add($('#instruction7')).add($('#instruction8')).add($('#instruction9')).hide();
                    $('.MTDI_display').hide();
                    $('.mimo_MTDI_display').hide();
                    $('#conn_panel').add($('#mimo_conn_panel')).hide();
                    connToAPOI();
                }else if($('#APOI_MTDI_select').val() === "MTDI"){
                    $('#instruction2').add($('#instruction3')).add($('#instruction4')).add($('#instruction5'))
                        .add($('#instruction6')).add($('#instruction7')).add($('#instruction8')).add($('#instruction9')).hide();
                    $('.APOI_display').hide();
                    $('.mimo_APOI_display').hide();
                    $('#conn_panel').add($('#mimo_conn_panel')).hide();
                    MTDI_instruct(false);
                    connToMTDI();
                }
            })
        }

        //go through the step that connect from sector to APOI
        function connToMSDH(){
            $('.wizard-step').removeClass('highlighted');
            $('#wizard-msdh').addClass('highlighted');

            $('#instruction_txt2').empty();
            $('#instruction_txt2').append('<span><b>Please choose the MSDH that you want to connect the BTS port to: </b></span>');
            var MSDHSelect ="<select id='MSDH_select'><option value=''>Select</option>";
            for (i = 0; i < topo.length; i++)
            {
               if (topo[i]["Node Type"].indexOf("MSDH") != -1)
               {
                  MSDHSelect += "<option value="+topo[i]["ID"]+">"+topo[i]["Tag"]+' - '+topo[i]["ID"]+"</option>";
               }
            }
            MSDHSelect +="</select>";
            $('#instruction_txt2').append(MSDHSelect);
            $('#instruction2').show();
            setInstructionStt(2);

            $(document).on('change','#MSDH_select',function(){
               MSDHid = $('#MSDH_select').val();

               var rfConn=[];
               var conn=[];
               var portOccuped=[];
               api.exe({
                  cmd: "connections -o " + OPERATOR + " --json",
                  dataType: 'json',
                  async: false,
                  onSuccess: function (o) {
                      $.each(o.ajaxdata.rf_connections, function (i, top) {
                          rfConn[i] = top;
                          var to = rfConn[i].conn[0]["To"].split(":");
                          if (to[0] == MSDHid)
                              portOccuped[to[1]] = true;
                      })
                      $.each(o.ajaxdata.connections, function (i, top) {
                          conn[i] = top;
                          var to = conn[i]["Node X"].split(":");
                          if (to[0] == MSDHid)
                              portOccuped[to[2]] = true;
                      })

                      $('#instruction_txt3').empty();
                      $('#instruction_txt3').append("<br><b>Please choose port of the MSDH to connect: </b>");
                      var MSDHPortSelect ="<select id='MSDHPort_select'><option value=''>Select</option>";
                      for (i = 1; i <= 16; i++)
                      {
                        if (portOccuped[i] == undefined)
                           MSDHPortSelect += "<option value="+i+">"+i+"</option>";
                      }
                      MSDHPortSelect +="</select>";
                      $('#instruction_txt3').append(MSDHPortSelect);
                      $('#instruction3').show();
                      setInstructionStt(3);
                  }
               })
            })

            $(document).on('change','#MSDHPort_select',function(){
               MSDHportNo = $('#MSDHPort_select').val();
               setInstructionStt(4);
               $('#save').removeClass('disabled');
            })
        }

        //go through the step that connect from sector to APOI
        function connToAPOI(){
            //highlight wizard steps
            $('.wizard-step').removeClass('highlighted');
            $('#wizard-apoi').addClass('highlighted');

            $('#instruction_txt2').empty();
            $('#instruction_txt2').append('<span><b>Please choose the APOI that you want to connect the BTS port to: </b></span>');
            var APOISelect ="<select id='APOI_select'><option value=''>Select</option>";
            var foundAPOIAvail = false;
            $.each(unocupiedSlotList, function(key,value){
                var foundAvailPort=false;
                $.each(value.Ranges,function(index,range){
                    if(range.Port.length > 0 && value.NodeType.indexOf("APOI") !=-1){
                        foundAvailPort = true;
                    }
                })
                if(foundAvailPort){
                    APOISelect += "<option value="+value.ID+">"+value.Tag+' - '+value.ID+"</option>";
                    foundAPOIAvail = true;
                }
            })
            APOISelect +="</select>";
            if(!foundAPOIAvail){
                axellPopUp('No APOI port within this frequency range available. You will be redirected to main page shortly');
                setTimeout(function(){
                    window.location.href = "/target";
                },5000)
            }else{
                $('#instruction_txt2').append(APOISelect);
                $('#instruction2').show();
                setInstructionStt(2);
            }
            $(document).on('change','#APOI_select',function(){
                //hide guide tool
                $('#guide_tool_UL').add($('#guide_tool_DL')).hide();
                //hide MTDI image and ports
                $('.MTDI_display').hide();
                //hide further step instruction
                $('#instruction4').add($('#instruction5')).add($('#instruction6')).add($('#instruction7')).add($('#instruction8')).add($('#instruction9')).hide();

                //hide mimo display
                $('#mimo_conn_panel').add($('.mimo_APOI_display')).add($('.mimo_MTDI_display')).hide();

                //append next step instruction
                $('#instruction_txt3').empty();
                $('#instruction_txt3').append("<br><b>Please choose port of the APOI to connect</b>");
                $('#instruction3').show();
                setInstructionStt(3);

                //refresh info in config table
                $('.APOI_conn_info').empty();
                $('.MTDI_conn_info').empty();

                //delete connection line if drawn
                firstInstance.detachEveryConnection();
                firstInstance.deleteEveryEndpoint();
                secondInstance.detachEveryConnection();
                secondInstance.deleteEveryEndpoint();

                //if user choose one of the APOI, do the MIMOTest and show APOI model, highlight available slot and port in imagemap
                if($('#APOI_select').val() != ""){
                    $('#conn_panel').show();
                    $('.APOI_display').show();
                    $('#selected_APOI').html($('#APOI_select').val());
                    APOIid = $('#APOI_select').val();
                    //var selectedNode = getNodePortDetails($('#APOI_select').val());
                    var selectedNode = _.findWhere(unocupiedSlotList,{ID: $('#APOI_select').val()});
                    monitorAvailableSlot(selectedNode,true);
                    //console.log(selectedNode);
                    //don't really need MIMOTest for the first connection
                    /*
                    if(CONNTYPE.indexOf('MIMO') != -1){
                        MIMOTest(selectedNode,false);
                    }else{*/

                    //}
                    connAPOIToMTDI();
                }else{
                    $('#conn_panel').add($('#mimo_conn_panel')).hide();
                    $('.APOI_display').hide();
                }
            })
        }

        //go through the step that connect straight from sector to MTDI (not going through APOI, in case of non DUPL)
        function connToMTDI(){
            $(document).on('change','#MTDI_select',function(){
                //$('#MTDI_ID').html($('#MTDI_select').val());
                $('.MTDI_conn_info').empty();

                //if user choose one of the MTDI then show MTDI model
                if($('#MTDI_select').val() != ""){
                    $('#conn_panel').show();
                    $('.MTDI_display').show();
                    //display MTDI id in config table
                    $('#selected_MTDI').html($('#MTDI_select').val());
                    //assign MTDI id to variable for later save function
                    MTDIid = $('#MTDI_select').val();

                    //append new instruction
                    $('#instruction_txt5').empty();
                    $('#instruction_txt5').append("<br><b>Please choose uplink and downlink port of the MTDI to connect</b>");
                    //hide the rest of the instruction
                    $('#instruction6').add($('#instruction7')).add($('#instruction8')).add($('#instruction9')).hide();

                    //hide mimo display
                    $('#mimo_conn_panel').add($('.mimo_APOI_display')).add($('.mimo_MTDI_display')).hide();

                    $('#instruction5').show();
                    setInstructionStt(5);
                    //show guide tool to connect sector to APOI
                    showGuideTool();

                    var selectedNode = _.findWhere(unocupiedSlotList,{ID: $('#MTDI_select').val()});
                    //perform mimo test
                    //then hilight slot and port in MTDI image map
                    monitorAvailableSlot(selectedNode,false);

                    //don't really need MIMOTest for the first connection
                    /*
                    if(CONNTYPE.indexOf('MIMO') != -1){
                        MIMOTest(selectedNode,false);
                    }else{*/
                        //set flag is connected from APOI to false

                    //}
                }else{
                    $('#conn_panel').add($('#mimo_conn_panel')).hide();
                    $('.MTDI_display').hide();
                }
            })
        }

        //go through process that connect from APOI to MTDI
        function connAPOIToMTDI(){
            $(document).on('change','#MTDI_select',function(){
                $('.MTDI_conn_info').empty();
                //if user choose one of MTDI
                if($('#MTDI_select').val() != ""){
                    $('.MTDI_display').show();
                    //display MTDI id in config table
                    $('#selected_MTDI').html($('#MTDI_select').val());
                    //assign MTDI id to variable for later save function
                    MTDIid = $('#MTDI_select').val();

                    //delete connection line if drawn
                    firstInstance.detachEveryConnection();
                    firstInstance.deleteEveryEndpoint();
                    secondInstance.detachEveryConnection();
                    secondInstance.deleteEveryEndpoint();

                    //append new instruction
                    $('#instruction_txt5').empty();
                    $('#instruction_txt5').append("<br><b>Please choose uplink and downlink port of the MTDI to connect</b>");

                    //hide the rest of the instruction
                    $('#instruction6').add($('#instruction7')).add($('#instruction8')).add($('#instruction9')).hide();
                    //hide mimo display
                    $('#mimo_conn_panel').add($('.mimo_APOI_display')).add($('.mimo_MTDI_display')).hide();

                    $('#instruction5').show();
                    setInstructionStt(5);
                    //update guide tool position
                    showGuideTool();

                    var selectedNode = _.findWhere(unocupiedSlotList,{ID: $('#MTDI_select').val()});
                    monitorAvailableSlot(selectedNode,true);
                    //don't really need MIMOTest for the first connection
                    /*
                    if(CONNTYPE.indexOf('MIMO') != -1){
                        MIMOTest(selectedNode,true);
                        //monitorAvailableSlot(selectedNode,true);
                    }else{*/
                        //set flag is connected from APOI to true
                        monitorAvailableSlot(selectedNode,true);
                    //}

                }else{
                    $('.MTDI_display').hide();
                    $('#mimo_conn_panel').hide();
                }
            })
        }

        //connect from sector to APOI, second connection for MIMO
        function connToAPOI_MIMO(){
            $('#instruction_txt6').empty();
            $('#instruction_txt6').append('<span><b>Please choose another APOI that you want to connect the BTS port to (MIMO): </b></span>');
            var APOISelect ="<select id='mimo_APOI_select'><option value=''>Select</option>";
            var foundAPOIAvail = false;

            //filter out the slot that has been connected from the first connection
            $.each(unocupiedSlotList, function(key,value){
                var foundAvailPort=false;
                $.each(value.Ranges,function(index,range){
                    if(range.Port.length > 0 && value.NodeType.indexOf("APOI") !=-1){
                        $.each(value.Ranges,function(index, range){
                            if(range.Band != APOIportNo){
                                foundAvailPort = true;
                            }
                        })
                    }
                })
                if(foundAvailPort){
                    APOISelect += "<option value="+value.ID+">"+value.Tag+' - '+value.ID+"</option>";
                    foundAPOIAvail = true;
                }
            })
            APOISelect +="</select>";
            $('#instruction_txt6').append(APOISelect);

            if(!foundAPOIAvail){
                axellPopUp('No APOI port available for MIMO found');
            }else{
                $('#instruction6').show();
                setInstructionStt(6);
                //update guide tool position
                showGuideTool();

                //repaint connection line after append new line on top
                firstInstance.repaintEverything();
            }

            $(document).on('change','#mimo_APOI_select',function(){
                $('#MIMO-guide_tool_DL').add($('#MIMO-guide_tool_UL')).hide();
                //hide MTDI image and ports
                $('.mimo_MTDI_display').hide();
                //hide further step instruction
                $('#instruction7').add( $('#instruction8')).add( $('#instruction9')).hide();
                //append next step instruction
                $('#instruction_txt7').empty();
                $('#instruction_txt7').append("<br><b>Please choose port of the APOI to connect (MIMO)</b>");
                $('#instruction7').show();
                setInstructionStt(7);
                //show guide tool to connect sector to APOI
                showGuideTool();

                //repaint connection line after append new line on top
                firstInstance.repaintEverything();

                //refresh info in config table
                $('.mimo_APOI_conn_info').empty();
                $('.mimo_MTDI_conn_info').empty();

                //delete the second connection line if drawn
                secondInstance.detachEveryConnection();
                secondInstance.deleteEveryEndpoint();

                if($('#mimo_APOI_select').val() != ""){
                    $('#mimo_conn_panel').show();

                    //hide first connection pane
                    //append maximize and minimize icon to header of first connection pane
                    //function to maximize and minimize section
                    firstInstance.hide($("#APOI_model"),true);
                    firstInstance.hide($("#MTDI_model"),true);
                    $('#guide_tool_DL').add($('#guide_tool_UL')).hide();
                    $('.APOI_display').add($('.MTDI_display')).hide();
                    $('div.minmaxbutton').remove();
                    $('#conn_panel').prepend('<div class="icon minmaxbutton maximize"></div>');
                    minimize();

                    //show mimo display model
                    $('.mimo').show();
                    $('.mimo_APOI_display').show();
                    //add info in config table
                    $('#mimo_selected_APOI').html($('#mimo_APOI_select').val());
                    //save this variable for save function
                    APOIid_MIMO = $('#mimo_APOI_select').val();
                    //perform mimo test and highlight slot and port in image map
                    var selectedNode = _.findWhere(unocupiedSlotList,{ID: $('#mimo_APOI_select').val()});
                    //if(CONNTYPE.indexOf('MIMO') != -1){
                        MIMOTest(selectedNode);
                    /*
                    }else{
                        monitorAvailableSlot(selectedNode,true);
                    }*/
                    //continue to perform connection from APOI to MTDI
                    connAPOIToMTDI_MIMO();
                }else{
                    $('#mimo_conn_panel').hide();
                    $('.mimo').hide();
                    $('.mimo_APOI_display').hide();
                }
            })
        }

        //connect from sector to MTDI MIMO
        function connToMTDI_MIMO(){
            $(document).on('change','#mimo_MTDI_select',function(){
                //$('#MTDI_ID').html($('#MTDI_select').val());
                $('.mimo_MTDI_conn_info').empty();
                if($('#mimo_MTDI_select').val() != ""){
                    $('#mimo_conn_panel').show();
                    //hide first connection pane
                    //append maximize and minimize icon to header of first connection pane
                    //function to maximize and minimize section
                    firstInstance.hide($("#APOI_model"),true);
                    firstInstance.hide($("#MTDI_model"),true);
                    $('#guide_tool_DL').add($('#guide_tool_UL')).hide();
                    $('.APOI_display').add($('.MTDI_display')).hide();
                    $('#conn_panel').prepend('<div class="icon minmaxbutton maximize"></div>');
                    minimize();

                    $('.mimo_MTDI_display').show();
                    $('#mimo_selected_MTDI').html($('#mimo_MTDI_select').val());
                    MTDIid_MIMO = $('#mimo_MTDI_select').val();
                    $('#instruction_txt9').empty();
                    $('#instruction_txt9').append("<br><b>Please choose uplink and downlink port of the MTDI to connect (MIMO):</b>");
                    $('#instruction9').show();
                    setInstructionStt(9);
                    showGuideTool();
                    showMIMOGuideTool();

                    //repaint connection line after append new line on top
                    firstInstance.repaintEverything();

                    var selectedNode = _.findWhere(unocupiedSlotList,{ID: $('#mimo_MTDI_select').val()});
                    //filter out the chosen MTDI slot for this time round
                    var selectedNode = _.findWhere(unocupiedSlotList,{ID: $('#mimo_MTDI_select').val()});
                    var availableSlot=[];
                    var availNodePort;
                    //filter out the chosen MTDI slot for this time round
                    $.each(selectedNode.Ranges,function(i, range){
                        if(range.Band != MTDIportNo){
                            availableSlot.push(range);
                        }
                    })
                    availNodePort = {"ID":selectedNode.ID,"NodeType":selectedNode.NodeType,"Tag":selectedNode.Tag,"Ranges":availableSlot};

                    monitorAvailableSlot_MIMO(availNodePort,false);
                    //don't need MIMOTest for MTDI
                    /*
                    if(CONNTYPE.indexOf('MIMO') != -1){
                        MIMOTest(selectedNode,false,MTDIportNo);
                    }else{*/

                    //}
                }else{
                    $('#mimo_conn_panel').hide();
                    $('.mimo_MTDI_display').hide();
                }
            })
        }

        //connect from APOI to MTDI
        function connAPOIToMTDI_MIMO(){
            $(document).on('change','#mimo_MTDI_select',function(){
                //$('#guide_tool_UL').hide();
                //$('#guide_tool_DL').hide();
                $('.mimo_MTDI_conn_info').empty();
                //$('#MTDI_ID').html($('#MTDI_select').val());
                if($('#mimo_MTDI_select').val() != ""){
                    $('.mimo_MTDI_display').show();
                    $('#mimo_selected_MTDI').html($('#mimo_MTDI_select').val());
                    MTDIid_MIMO = $('#mimo_MTDI_select').val();
                    secondInstance.detachEveryConnection();
                    secondInstance.deleteEveryEndpoint();
                    $('#instruction_txt9').empty();
                    $('#instruction_txt9').append("<br><b>Please choose uplink and downlink port of the MTDI to connect</b>");
                    $('#instruction9').show();
                    setInstructionStt(9);
                    //update guide tool position
                    showGuideTool();
                    showMIMOGuideTool();

                    //repaint connection line after append new line on top
                    firstInstance.repaintEverything();
                    //var selectedNode = getNodePortDetails($('#mimo_MTDI_select').val());
                    var selectedNode = _.findWhere(unocupiedSlotList,{ID: $('#mimo_MTDI_select').val()});
                    var availableSlot=[];
                    var availNodePort;
                    //filter out the chosen MTDI slot for this time round
                    $.each(selectedNode.Ranges,function(i, range){
                        if(range.Band != MTDIportNo){
                            availableSlot.push(range);
                        }
                    })
                    availNodePort = {"ID":selectedNode.ID,"NodeType":selectedNode.NodeType,"Tag":selectedNode.Tag,"Ranges":availableSlot};

                    monitorAvailableSlot_MIMO(availNodePort,true);

                    //don't need MIMOTest for MTDI
                    /*
                    if(CONNTYPE.indexOf('MIMO') != -1){
                        MIMOTest(selectedNode,true, MTDIportNo);
                        //monitorAvailableSlot(selectedNode,true);
                    }else{
                        monitorAvailableSlot_MIMO(selectedNode,true);
                    }*/

                }else{
                    $('.mimo_MTDI_display').hide();
                }
            })
        }
        //function to perform mimo test in case of MIMO connection type
        //realized that there's no point to perform MIMO test in backend, so do it in front end instead
        /*
        function MIMOTest(node, isFromAPOI,selectedSlot){
            //console.log(isFromAPOI);
            var availRange=[];
            var availNodePort;
            var cmd ="CONNECTIONS MIMOTEST "+SECTORID+" "+ node.ID;
            $.each(node.Ranges, function(index, value){
                cmd += " "+ value.Band;
            })
            api.exe({
                cmd:cmd,
                onSuccess:function(o){
                    var ret = o.ajaxdata.split(' ');
                    $.each(ret, function(index, value){
                        if(value !=0){
                            availRange.push(node.Ranges[index]);
                        }
                    })
                    //console.log(availRange);
                    //console.log(selectedSlot);
                    //console.log(MTDIid);
                    availRange= _.filter(availRange, function(num){
                        if(selectedSlot != undefined && ((node.ID === APOIid) ||(node.ID === MTDIid))){
                            //console.log(num);
                            if(num.Band !=selectedSlot){
                                return num;
                            }
                        }else{
                            return num;
                        }

                    });
                    availNodePort = {"ID":node.ID,"NodeType":node.NodeType,"Tag":node.Tag,"Ranges":availRange};
                    //console.log(availNodePort);
                    //if selected slot is not undefined --> second time choosing APOI or MTDI ---> call mimo functions
                    if(selectedSlot != undefined && !isFromAPOI){
                        monitorAvailableSlot_MIMO(availNodePort,false);
                    }else if(selectedSlot != undefined && isFromAPOI){
                        monitorAvailableSlot_MIMO(availNodePort,true);
                    }
                    //if selected slot === undefined --> first time choosing APOI or MTDI --> pass isMIMO = false to monitor Available Slot
                    else if(selectedSlot === undefined && !isFromAPOI){
                        monitorAvailableSlot(availNodePort,false,false); //monitorAvailableSlot(portList, isFromAPOI, isMIMO)
                    }else{
                        monitorAvailableSlot(availNodePort,true,false);
                    }
                }
            })
        }
        */

        //MIMOTest in front end
        //going through connections list, block APOI slot that has connected to same MTDI slot in the first connection
        function MIMOTest(node){
            var availableSlot=[];
            var availNodePort;
            var removedAPOISlot;
            if(MTDIportNo === undefined){
                $.each(node.Ranges,function(i, range){
                    if(range.Band != APOIportNo){
                        availableSlot.push(range);
                    }
                })
                availNodePort = {"ID":node.ID,"NodeType":node.NodeType,"Tag":node.Tag,"Ranges":availableSlot};
            }else{
                api.exe({
                    cmd:'CONNECTIONS -o '+OPERATOR+' --json',
                    async:false,
                    dataType:'json',
                    onSuccess:function(o){
                        var connectionList = o.ajaxdata;
                        var foundConn = false;
                        $.each(connectionList.rf_connections, function(key, value){
                            $.each(_.where(value.conn,{FromType: "APOI-S"}),function(i,conn){
                                if(conn.To.substring(0,4) === MTDIid && conn.From.substring(0,4) === node.ID){
                                    if(conn.To.substring(5,8) === MTDIportNo){
                                        removedAPOISlot = conn.From.substring(5,6);
                                    }
                                    foundConn = true;
                                }
                            })
                        })
                        if(!foundConn){
                            $.each(node.Ranges,function(i, range){
                                if(range.Band != APOIportNo){
                                    availableSlot.push(range);
                                }
                            })
                            availNodePort = {"ID":node.ID,"NodeType":node.NodeType,"Tag":node.Tag,"Ranges":availableSlot};
                        }else{
                            $.each(node.Ranges,function(i, range){
                                if(range.Band != APOIportNo && range.Band !=removedAPOISlot){
                                    availableSlot.push(range);
                                }
                            })
                            availNodePort = {"ID":node.ID,"NodeType":node.NodeType,"Tag":node.Tag,"Ranges":availableSlot};
                        }
                    }
                })
            }
            monitorAvailableSlot_MIMO(availNodePort,false);
        }

        //function to highlight available slot and port of APOI and MTDI in image model for MIMO
        function monitorAvailableSlot_MIMO(portList,isFromAPOI){
            if(portList.NodeType.indexOf("APOI")!=-1){
                $('#mimo_APOI_model').maphilight({strokeColor:'808080',strokeWidth:0,fillColor:faultyColor,fillOpacity: 0.3});
            }else if(portList.NodeType.indexOf("MTDI")!=-1){
                $('#mimo_MTDI_model').maphilight({strokeColor:'808080',strokeWidth:0,fillColor:faultyColor,fillOpacity: 0.3});
            }
            //call this to refresh image map avaiable slot and port
            //in case user switch from one to another APOI/ MTDI
            unhilightEverything(portList.NodeType,true);

            $.each(portList.Ranges,function(key, ranges){
                var range = ranges.Band.replace(/:/g, '-');
                $.each(ranges.Port,function(key, port){
                    var connList = getConnList(portList.NodeType,port);
                    $.each(connList,function(index,ID){
                        $('#MIMO-'+range+'-'+ID).addClass('available');
                        //pre highlight available slots
                        fillColor($('#MIMO-'+range+'-'+ID), 0.7,defaultHighlightColor,true);

                    })
                })
            })
            //update color when mouseover and mouseout
            $(document).off('mouseover','area').on('mouseover','area',function(){
                //in MTDI case, highlight both UL and DL port
                if($(this).hasClass('available')){
                    if(CONNTYPE.indexOf('DUPL') !=-1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.7,highlightedColor,true,true);
                    }
                    fillColor($(this), 0.7,highlightedColor,true);
                }else{
                    if(CONNTYPE.indexOf('DUPL') !=-1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.3,faultyColor,false,true);
                    }
                    fillColor($(this), 0.3,faultyColor,false);
                }
                //if port has class highlighted --> keep it highlighted when roll over and out
                if($(this).hasClass('highlighted')){
                    if(CONNTYPE.indexOf('DUPL') != -1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.7,highlightedColor,true,true);
                    }
                    fillColor($(this), 0.7,highlightedColor,true);
                }

            })
            $(document).off('mouseout','area').on('mouseout','area',function(){
                if($(this).hasClass('available')){
                    if(CONNTYPE.indexOf('DUPL') !=-1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.7,defaultHighlightColor,true,true);
                    }
                    fillColor($(this), 0.7,defaultHighlightColor,true);
                }else{
                    if(CONNTYPE.indexOf('DUPL') !=-1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.3,faultyColor,false,true);
                    }
                    fillColor($(this), 0.3,faultyColor,false);
                }
                //if port has class highlighted --> keep it highlighted when roll over and out
                if($(this).hasClass('highlighted')){
                    if(CONNTYPE.indexOf('DUPL') != -1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.7,highlightedColor,true,true);
                    }
                    fillColor($(this), 0.7,highlightedColor,true);
                }
            })
            //perform whatever triggered by click event on MTDI and APOI port
            slotOnClicked(isFromAPOI,true);

        }
        //function to highlight available slot and port of APOI and MTDI in image model
        function monitorAvailableSlot(portList,isFromAPOI,isMIMO){
            if(portList.NodeType.indexOf("APOI")!=-1){
                $('#APOI_model').maphilight({strokeColor:'808080',strokeWidth:0,fillColor:faultyColor,fillOpacity: 0.3});

            }else if(portList.NodeType.indexOf("MTDI")!=-1){
                $('#MTDI_model').maphilight({strokeColor:'808080',strokeWidth:0,fillColor:faultyColor,fillOpacity: 0.3});

            }
            unhilightEverything(portList.NodeType,isMIMO);
            $.each(portList.Ranges,function(key, ranges){
                var range = ranges.Band.replace(/:/g, '-');
                $.each(ranges.Port,function(key, port){
                    var connList = getConnList(portList.NodeType,port);
                    $.each(connList,function(index,ID){
                        //pre highlight available slots
                        $('#'+range+'-'+ID).addClass('available');
                        fillColor($('#'+range+'-'+ID), 0.7,defaultHighlightColor,true);
                    })
                })
            })
            //update color when mouseover and mouseout
            $(document).off('mouseover','area').on('mouseover','area',function(){
                //in MTDI case, highlight both UL and DL port
                if($(this).hasClass('available')){
                    if(CONNTYPE.indexOf('DUPL') !=-1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.7,highlightedColor,true,false);
                    }
                    fillColor($(this), 0.7,highlightedColor,true);
                }else{
                    if(CONNTYPE.indexOf('DUPL') !=-1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.3,faultyColor,false,false);
                    }
                    fillColor($(this), 0.3,faultyColor,false);
                }
                //if port has class highlighted --> keep it highlighted when roll over and out
                if($(this).hasClass('highlighted')){
                    if(CONNTYPE.indexOf('DUPL') != -1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.7,highlightedColor,true,false);
                    }
                    fillColor($(this), 0.7,highlightedColor,true);
                }
            })
            $(document).off('mouseout','area').on('mouseout','area',function(){
                if($(this).hasClass('available')){
                    if(CONNTYPE.indexOf('DUPL') !=-1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.7,defaultHighlightColor,true,false);
                    }
                    fillColor($(this), 0.7,defaultHighlightColor,true);
                }else{
                    if(CONNTYPE.indexOf('DUPL') !=-1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.3,faultyColor,false,false);
                    }
                    fillColor($(this), 0.3,faultyColor,false);
                }
                //if port has class highlighted --> keep it highlighted when roll over and out
                if($(this).hasClass('highlighted')){
                    if(CONNTYPE.indexOf('DUPL') != -1 && portList.NodeType.indexOf('APOI')!=-1){

                    }else{
                        highlightSiblingPort($(this),0.7,highlightedColor,true,false);
                    }
                    fillColor($(this), 0.7,highlightedColor,true);
                }
            })
            //perform whatever triggered by click event on MTDI and APOI port
            slotOnClicked(isFromAPOI,isMIMO);

        }
        //function to route different click event to different function
        //and make sure clicked slot is being aware of (highlight different color only perform when click other slot)
        function slotOnClicked(isFromAPOI,isMIMO){
            $(document).off('click','area').on('click','area',function(e){
                e.preventDefault();
                if($(this).hasClass('available')){ //prevent user click on unavailable slot
                    if(!$(this).hasClass('clicked')){
                        if($(this).parent().attr('name').indexOf("APOI") != -1){
                            if(isMIMO){
                                selectAPOIPort_MIMO($(this));
                            }else{
                                selectAPOIPort($(this));
                            }
                        }else if($(this).parent().attr('name').indexOf("MTDI") != -1) {
                            if(isMIMO){
                                selectMTDIPort_MIMO($(this),isFromAPOI);
                            }else{
                                selectMTDIPort($(this),isFromAPOI);
                            }
                        }
                        $(this).addClass('clicked');
                        $('#'+getSlot($(this).attr('title'))+"-"+getSiblingPort($(this).attr('title'))).addClass('clicked');
                    }
                    $(this).siblings().not(this).not($('#'+getSlot($(this).attr('title'))+"-"+getSiblingPort($(this).attr('title')))).removeClass('clicked');
                }
            })
        }
        //display pointer arrow to APOI port to connect sector into
        function showGuideTool(){
            $('#guide_tool_UL').empty();
            $('#guide_tool_DL').empty();

            var imgPos = $('#APOI_model').parent().position();
            var itemUL = $('#'+$('#APOI_input_port').text()+'-'+$('#APOI_input_conn_UL').text());
            var itemDL = $('#'+$('#APOI_input_port').text()+'-'+$('#APOI_input_conn_DL').text());
            var xyPosUL=[];
            var xyPosDL=[];

            if(itemDL.attr('coords') !=undefined && itemUL.attr('coords') !=undefined){
                xyPosUL = itemUL.attr('coords').split(',');
                xyPosDL = itemDL.attr('coords').split(',');
            }
            if(CONNTYPE.indexOf("DUPL") === -1){
                //highlight 2 ports
                itemDL.addClass('highlighted');
                itemUL.addClass('highlighted');
                fillColor(itemUL,0.7,highlightedColor,true);
                fillColor(itemDL,0.7,highlightedColor,true);

                if(itemDL.attr('id') !=undefined && itemDL.attr('id').indexOf('DL1') !=-1){
                    $('#guide_tool_DL').append('<div><div id="down_arrow" class="icon downlink-white"></div>Connect downlink BTS port here</div>');
                    $('#guide_tool_DL').css({top: Number(xyPosDL[1])+ Number(imgPos.top) -50, left: Number(xyPosDL[0])});
                    $('#guide_tool_UL').append('<div><div id="down_arrow_up" class="icon downlink-white"></div>Connect uplink BTS port here</div>');
                    $('#guide_tool_UL').css({top: Number(xyPosUL[1])+Number(imgPos.top)-50, left: Number(xyPosUL[0])-120});
                }else if(itemDL.attr('id') !=undefined && itemDL.attr('id').indexOf('DL2') !=-1){
                    $('#guide_tool_DL').append('<div><div id="down_arrow" class="icon downlink-white"></div>Connect downlink BTS port here</div>');
                    $('#guide_tool_DL').css({top: Number(xyPosDL[1])+Number(imgPos.top)-50, left: Number(xyPosDL[0])});
                    $('#guide_tool_UL').append('<div><div id="up_arrow_up" class="icon uplink-white"></div>Connect uplink BTS port here</div>');
                    $('#guide_tool_UL').css({top: Number(xyPosUL[1])+Number(imgPos.top) +30, left: Number(xyPosUL[0])-120});
                }
                $('#guide_tool_DL').show();
                $('#guide_tool_UL').show();
            }else{
                //highlight 2 ports
                itemDL.addClass('highlighted');
                fillColor(itemDL,0.7,highlightedColor,true);
                $('#guide_tool_DL').append('<div><div id="down_arrow" class="icon downlink-white"></div>Connect uplink/ downlink BTS port here</div>');
                $('#guide_tool_DL').css({top: Number(xyPosDL[1])+Number(imgPos.top) -50, left: Number(xyPosDL[0])});
                $('#guide_tool_DL').show();
            }
        }
        //display pointer arrow to APOI port to connect sector into
        function showMIMOGuideTool(){
            $('#MIMO-guide_tool_UL').empty();
            $('#MIMO-guide_tool_DL').empty();
            var imgPos = $('#mimo_APOI_model').parent().position();
            var mimo_itemUL = $('#MIMO-'+$('#mimo_APOI_input_port').text()+'-'+$('#mimo_APOI_input_conn_UL').text());
            var mimo_itemDL = $('#MIMO-'+$('#mimo_APOI_input_port').text()+'-'+$('#mimo_APOI_input_conn_DL').text());
            var mimo_xyPosUL=[];
            var mimo_xyPosDL=[];

            if(mimo_itemDL.attr('coords') !=undefined && mimo_itemUL.attr('coords') !=undefined){
                mimo_xyPosUL = mimo_itemUL.attr('coords').split(',');
                mimo_xyPosDL = mimo_itemDL.attr('coords').split(',');
            }
            if(CONNTYPE.indexOf("DUPL") === -1){
                //highlight 2 ports
                mimo_itemDL.addClass('highlighted');
                mimo_itemUL.addClass('highlighted');
                fillColor(mimo_itemUL,0.7,highlightedColor,true);
                fillColor(mimo_itemDL,0.7,highlightedColor,true);
                if(mimo_itemDL.attr('id') !=undefined && mimo_itemDL.attr('id').indexOf('DL1') !=-1){
                    $('#MIMO-guide_tool_DL').append('<div><div id="MIMO-down_arrow" class="icon downlink-white"></div>Connect downlink BTS port here</div>');
                    $('#MIMO-guide_tool_DL').css({top: Number(mimo_xyPosDL[1])+ Number(imgPos.top) -50, left: Number(mimo_xyPosDL[0])});
                    $('#MIMO-guide_tool_UL').append('<div><div id="MIMO-down_arrow_up" class="icon downlink-white"></div>Connect uplink BTS port here</div>');
                    $('#MIMO-guide_tool_UL').css({top: Number(mimo_xyPosUL[1])+ Number(imgPos.top) -50, left: Number(mimo_xyPosUL[0])-120});
                }else if(mimo_itemDL.attr('id') !=undefined && mimo_itemDL.attr('id').indexOf('DL2') !=-1){
                    $('#MIMO-guide_tool_DL').append('<div><div id="MIMO-down_arrow" class="icon downlink-white"></div>Connect downlink BTS port here</div>');
                    $('#MIMO-guide_tool_DL').css({top: Number(mimo_xyPosDL[1])+ Number(imgPos.top) -50, left: Number(mimo_xyPosDL[0])});
                    $('#MIMO-guide_tool_UL').append('<div><div id="MIMO-up_arrow_up" class="icon uplink-white"></div>Connect uplink BTS port here</div>');
                    $('#MIMO-guide_tool_UL').css({top: Number(mimo_xyPosUL[1])+ Number(imgPos.top) +30, left: Number(mimo_xyPosUL[0])-120});
                }
                $('#MIMO-guide_tool_DL').show();
                $('#MIMO-guide_tool_UL').show();
            }else{
                //highlight 1 port for duplex
                mimo_itemDL.addClass('highlighted');
                fillColor(mimo_itemDL,0.7,highlightedColor,true);
                $('#MIMO-guide_tool_DL').append('<div><div id="MIMO-down_arrow" class="icon downlink-white"></div>Connect uplink/ downlink BTS port here</div>');
                $('#MIMO-guide_tool_DL').css({top: Number(mimo_xyPosDL[1])+ Number(imgPos.top) -50, left: Number(mimo_xyPosDL[0])});
                $('#MIMO-guide_tool_DL').show();
            }
        }

        //perform tasks when click on APOI port (non mimo case)
        function selectAPOIPort(item){
            $('#guide_tool_UL').empty();
            $('#guide_tool_DL').empty();
            firstInstance.detachEveryConnection();
            firstInstance.deleteEveryEndpoint();
            secondInstance.detachEveryConnection();
            secondInstance.deleteEveryEndpoint();
            //unhighlight already highlighted slot if highlighted
            unhilight(item.attr('title'),'APOI',false);
            //if chose APOI slot, refresh the MTDI Instruction display
            $('#instruction4').hide();

            //display instruction for connecting to MTDI
            var APOI_band = getSlot(item.attr('title'));

            //blink(APOI_band+"-UL1");
            //blink(APOI_band+"-DL1");
            /*
            $('#'+APOI_band+'-DL1').addClass('highlighted');
            $('#'+APOI_band+'-UL1').addClass('highlighted');
            fillColor($('#'+APOI_band+'-DL1'),0.7,highlightedColor,true);
            fillColor($('#'+APOI_band+'-UL1'),0.7,highlightedColor,true);
            */

            //display info in config table
            $('#APOI_input_port').html(getSlot(item.attr('title')));
            //if not duplex, display input and output downlink / uplink
            if(CONNTYPE.indexOf('DUPL') === -1){
                if(item.attr('title').indexOf("UL") != -1){
                    $('#APOI_input_conn_UL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
                    $('#APOI_input_conn_DL').html(getSiblingPort(item.attr('title')));
                }else{
                    $('#APOI_input_conn_DL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
                    $('#APOI_input_conn_UL').html(getSiblingPort(item.attr('title')));
                }
                //if duplex display input and output downlink
            }else{
                $('#APOI_input_conn_UL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
                $('#APOI_input_conn_DL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
            }

            APOIportNo = $('#APOI_input_port').text();
            APOIinputSlotNo = $('#APOI_input_conn_DL').text().substring($('#APOI_input_conn_DL').text().length-1, $('#APOI_input_conn_DL').text().length);
            APOIoutputSlotNo= $('#APOI_output_conn_DL').text().substring($('#APOI_output_conn_DL').text().length-1, $('#APOI_output_conn_DL').text().length);

            $('#APOI_output_conn_DL').html("DL"+APOIinputSlotNo);
            $('#APOI_output_conn_UL').html("UL"+APOIinputSlotNo);

            //show guide tool to connect sector to APOI
            showGuideTool();

            //check if APOI has been already connected to an MTDI
            //if no, prompt for mtdi connection from apoi
            /** Combined case for APOI:
             * if an APOI has the upper slot already connected to an MTDI,
             * then don't prompt for the connection from the lower slot of the APOI to a MTDI anymore
            **/
            api.exe({
                cmd:'connections -o '+OPERATOR+' --json',
                dataType:'json',
                onSuccess:function(o){
                    var portNum;
                    if(CONNTYPE ==="DUPL" || CONNTYPE==="MIMODUPL"){
                        portNum = 1;
                    }else if(CONNTYPE ==="DLUL" || CONNTYPE ==="MIMO"){
                        portNum = APOIinputSlotNo;
                    }
                    
                    var from1 = APOIid+":"+APOIportNo+":DL"+portNum;
                    var from2 = APOIid+":"+APOIportNo+":UL"+portNum;
                    var isAPOIConnected = false;
                    $.each(o.ajaxdata.rf_connections, function(key, rfconn){
                        $.each(rfconn.conn,function(index, conn){
                            if(conn.From ===from1 || conn.From === from2){
                                //prompt for mtdi connection
                                isAPOIConnected = true;
                            }
                        })
                    })
                    if(!isAPOIConnected){
                        MTDI_instruct(true);
                    }else{
                        if(CONNTYPE.indexOf('MIMO') != -1){
                            //append next step instruction
                            connToAPOI_MIMO();
                        }else{
                            setInstructionStt(4);
                            $('#save').removeClass('disabled');
                        }
                    }
                },
                onError:function(err){
                    console.log("Error executing connections --json "+ this.errorThrown);
                }
            })
        }
        //perform tasks when click on MTDI port (non mimo case)
        function selectMTDIPort(item,isFromAPOI){
            var MTDI_band = getSlot(item.attr('title'));
            $('#MTDI_input_port').html(getSlot(item.attr('title')));

            //update information in configuration table
            if(item.attr('id').indexOf('UL') != -1){
                $('#MTDI_input_conn_DL').html(getSiblingPort(item.attr('title')));
                $('#MTDI_input_conn_UL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
            }else{
                $('#MTDI_input_conn_UL').html(getSiblingPort(item.attr('title')));
                $('#MTDI_input_conn_DL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
            }
            MTDIportNo = $('#MTDI_input_port').text().replace(/-/g, ':');
            MTDIinputSlotNo = $('#MTDI_input_conn_DL').text().substring($('#MTDI_input_conn_DL').text().length-1, $('#MTDI_input_conn_DL').text().length);


            //if user choose this port to connect APOI to then draw the connection between APOI ports and MTDI ports
            if(isFromAPOI){
                var MTDI_input =  [item.attr('id'), MTDI_band+'-'+getSiblingPort(item.attr('title'))];
                firstInstance.detachEveryConnection();
                firstInstance.deleteEveryEndpoint();
                secondInstance.detachEveryConnection();
                secondInstance.deleteEveryEndpoint();
                $.each(MTDI_input, function(index, port){
                    var APOI_band = APOIportNo;
                    var coords1;
                    var APOIPortNumber;
                    if(CONNTYPE === 'DLUL'){
                        APOIPortNumber = APOIinputSlotNo;
                    }
                    else{
                        APOIPortNumber = 1;
                    }
                    if(port.indexOf('UL')===-1){
                        coords1 = $('#'+APOI_band+'-DL'+APOIPortNumber).attr('coords').split(',');
                    }else{
                        coords1 = $('#'+APOI_band+'-UL'+APOIPortNumber).attr('coords').split(',');
                    }
                    var x1 = coords1[0]/800;
                    var y1 = coords1[1]/218;
                    var coords2 = $('#'+port).attr('coords').split(',');
                    var x2 = coords2[0]/800;
                    var y2 = coords2[1]/77;

                    var source = firstInstance.addEndpoint('APOI_model',{anchor:[x1,y1,-1,0]});
                    var target = firstInstance.addEndpoint('MTDI_model',{anchor:[x2,y2,0,-1]});
                    firstInstance.connect({
                        source:source,
                        target:target,
                        detachable:false,
                        endpoint:[ "Dot", { radius:5 } ],
                        endpointStyle : { fillStyle: '#0066cc'},
                        paintStyle:{
                            lineWidth:5,
                            strokeStyle:'#0066cc',
                            outlineColor:'#595959'
                        },
                        connector: ["Bezier", { curviness:75} ]
                    });
                })
                if(CONNTYPE.indexOf('MIMO') != -1){
                    //append next step instruction
                    connToAPOI_MIMO();
                }else{
                    $('#save').removeClass('disabled');
                };
            }else{
                //unhighlight already highlighted slot if highlighted
                unhilight(item.attr('title'),'MTDI',false);

                //blink(item.attr('id'));
                //blink(getSlot(item.attr('title'))+'-'+getSiblingPort(item.attr('title')));
                $('#'+item.attr('id')).addClass('highlighted');
                $('#'+getSlot(item.attr('title'))+'-'+getSiblingPort(item.attr('title'))).addClass('highlighted');
                fillColor($('#'+item.attr('id')),0.7,highlightedColor,true);
                fillColor($('#'+getSlot(item.attr('title'))+'-'+getSiblingPort(item.attr('title'))),0.7,highlightedColor,true);

                if(CONNTYPE.indexOf('MIMO') != -1){
                    //append next step instruction
                    MTDI_instruct_MIMO();
                    connToMTDI_MIMO();
                }else{
                    $('#save').removeClass('disabled');
                };
            }
            $('#instruction5_stt').removeClass('icon ok_disabled').addClass('icon ok');

        }

        //perform tasks when click on APOI port (mimo case)
        function selectAPOIPort_MIMO(item){
            secondInstance.detachEveryConnection();
            secondInstance.deleteEveryEndpoint();
            //unhighlight already highlighted slot if highlighted
            unhilight(item.attr('title'),'APOI',true);
            //if chose APOI slot, refresh the MTDI Instruction display
            $('#instruction8').hide();
            //display instruction for connecting to MTDI
            var APOI_band = getSlot(item.attr('title'));

            //blink("MIMO-"+APOI_band+"-UL1");
            //blink("MIMO-"+APOI_band+"-DL1");
            /*
            $('#MIMO-'+APOI_band+'-DL1').addClass('highlighted');
            $('#MIMO-'+APOI_band+'-UL1').addClass('highlighted');
            fillColor($('#MIMO-'+APOI_band+'-DL1'),0.7,highlightedColor,true);
            fillColor($('#MIMO-'+APOI_band+'-UL1'),0.7,highlightedColor,true);
            */
            //display info in config table
            $('#mimo_APOI_input_port').html(getSlot(item.attr('title')));
            if(item.attr('title').indexOf("UL") != -1){
                $('#mimo_APOI_input_conn_UL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
                $('#mimo_APOI_input_conn_DL').html(getSiblingPort(item.attr('title')));
            }else{
                $('#mimo_APOI_input_conn_DL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
                $('#mimo_APOI_input_conn_UL').html(getSiblingPort(item.attr('title')));
            }
            $('#mimo_APOI_output_conn_DL').html("DL1");
            $('#mimo_APOI_output_conn_UL').html("UL1");
            APOIportNo_MIMO = $('#mimo_APOI_input_port').text();
            APOIinputSlotNo_MIMO = $('#mimo_APOI_input_conn_DL').text().substring($('#mimo_APOI_input_conn_DL').text().length-1, $('#mimo_APOI_input_conn_DL').text().length);
            APOIoutputSlotNo_MIMO= $('#mimo_APOI_output_conn_DL').text().substring($('#mimo_APOI_output_conn_DL').text().length-1, $('#mimo_APOI_output_conn_DL').text().length);;

            //show guide tool to connect sector to APOI
            showMIMOGuideTool();

            //check if APOI has been already connected to an MTDI
            //if no, prompt for mtdi connection from apoi
            api.exe({
                cmd:'connections -o '+OPERATOR+' --json',
                dataType:'json',
                onSuccess:function(o){
                    var from1 = APOIid_MIMO+":"+APOIportNo_MIMO+":DL1";
                    var from2 = APOIid_MIMO+":"+APOIportNo_MIMO+":UL1";
                    var isAPOIConnected = false;
                    $.each(o.ajaxdata.rf_connections, function(key, rfconn){
                        $.each(rfconn.conn,function(index, conn){
                            if(conn.From ===from1 || conn.From === from2){
                                //prompt for mtdi connection
                                isAPOIConnected = true;
                            }
                        })
                    })
                    if(!isAPOIConnected){
                        MTDI_instruct_MIMO(true);
                    }else{
                        setInstructionStt(8);
                        $('#save').removeClass('disabled');
                    }
                },
                onError:function(){
                    console.log("Error executing connections --json "+ this.errorThrown);
                }
            })
        }

        //perform tasks when click on MTDI port ( mimo case)
        function selectMTDIPort_MIMO(item,isFromAPOI){

            var MTDI_band = getSlot(item.attr('title'));
            $('#mimo_MTDI_input_port').html(getSlot(item.attr('title')));

            //update information in configuration table
            if(item.attr('id').indexOf('UL') != -1){
                $('#mimo_MTDI_input_conn_DL').html(getSiblingPort(item.attr('title')));
                $('#mimo_MTDI_input_conn_UL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
            }else{
                $('#mimo_MTDI_input_conn_UL').html(getSiblingPort(item.attr('title')));
                $('#mimo_MTDI_input_conn_DL').html(item.attr('title').substring(item.attr('title').indexOf(":")+1,item.attr('title').length));
            }
            MTDIportNo_MIMO = $('#mimo_MTDI_input_port').text().replace(/-/g, ':');
            MTDIinputSlotNo_MIMO = $('#mimo_MTDI_input_conn_DL').text().substring($('#mimo_MTDI_input_conn_DL').text().length-1, $('#mimo_MTDI_input_conn_DL').text().length);

            //if user choose this port to connect APOI to then draw the connection between APOI ports and MTDI ports
            if(isFromAPOI){
                var MTDI_input =  [item.attr('id'), MTDI_band+'-'+getSiblingPort(item.attr('title'))];
                secondInstance.detachEveryConnection();
                secondInstance.deleteEveryEndpoint();
                $.each(MTDI_input, function(index, port){
                    var port =port.replace(/MIMO:/g, '');
                    var APOI_band = APOIportNo_MIMO;
                    var coords1;
                    if(port.indexOf('UL')===-1){
                        coords1 = $('#'+APOI_band+'-DL1').attr('coords').split(',');
                    }else{
                        coords1 = $('#'+APOI_band+'-UL1').attr('coords').split(',');
                    }
                    var x1 = coords1[0]/800;
                    var y1 = coords1[1]/218;
                    var coords2 = $('#'+port).attr('coords').split(',');
                    var x2 = coords2[0]/800;
                    var y2 = coords2[1]/77;

                    var source = secondInstance.addEndpoint('mimo_APOI_model',{anchor:[x1,y1,-1,0]});
                    var target = secondInstance.addEndpoint('mimo_MTDI_model',{anchor:[x2,y2,0,-1]});
                    secondInstance.connect({
                        source:source,
                        target:target,
                        detachable:false,
                        endpoint:[ "Dot", { radius:5 } ],
                        endpointStyle : { fillStyle: '#0066cc'},
                        paintStyle:{
                            lineWidth:5,
                            strokeStyle:'#0066cc',
                            outlineColor:'#595959'
                        },
                        connector: ["Bezier", { curviness:75} ]
                    });
                })
            }else{
                //unhighlight already highlighted slot if highlighted
                unhilight(item.attr('title'),'MTDI',true);
                //blink(item.attr('id'));
                //blink("MIMO-"+getSlot(item.attr('title'))+'-'+getSiblingPort(item.attr('title')));
                $('#'+item.attr('id')).addClass('highlighted');
                $('#MIMO-'+getSlot(item.attr('title'))+'-'+getSiblingPort(item.attr('title'))).addClass('highlighted');
                fillColor($('#'+item.attr('id')),0.7,highlightedColor,true);
                fillColor($('#MIMO-'+getSlot(item.attr('title'))+'-'+getSiblingPort(item.attr('title'))),0.7,highlightedColor,true);
            }
            $('#instruction9_stt').removeClass('icon ok_disabled').addClass('icon ok');
            $('#save').removeClass('disabled');
        }

        //unhighlight the already highlighted slot if user change decision by clicking another port
        function unhilight(clickedPortID,nodeType,isMIMO){
            var connList= getConnList(nodeType);
            if(nodeType === 'APOI'){
                for(var i =1; i<=8;i++){
                    $.each(connList,function(index,ID){
                        if(!isMIMO){
                            if($('#'+i+'-'+ID).hasClass('highlighted')){
                                $('#'+i+'-'+ID).removeClass('highlighted');
                                if($('#'+i+'-'+ID).attr('id') != clickedPortID){
                                    fillColor($('#'+i+'-'+ID),0.7,defaultHighlightColor,true);
                                }
                            }
                        }else{
                            if($('#MIMO-'+i+'-'+ID).hasClass('highlighted')){
                                $('#MIMO-'+i+'-'+ID).removeClass('highlighted');
                                if($('#MIMO-'+i+'-'+ID).attr('id') != clickedPortID){
                                    fillColor($('#MIMO-'+i+'-'+ID),0.7,defaultHighlightColor,true);
                                }
                            }
                        }
                    })
                }

            }else{
                for (var j =1;j<=2;j++){
                    for(var i =1; i<=4;i++){
                        var range = j+"-"+i;
                        $.each(connList,function(index,ID){
                            if(!isMIMO){
                                if($('#'+range+'-'+ID).hasClass('highlighted')){
                                    $('#'+range+'-'+ID).removeClass('highlighted');
                                    if($('#'+range+'-'+ID).attr('id') != clickedPortID){
                                        fillColor($('#'+range+'-'+ID),0.7,defaultHighlightColor,true);
                                    }
                                }
                            }else{
                                if($('#MIMO-'+range+'-'+ID).hasClass('highlighted')){
                                    $('#MIMO-'+range+'-'+ID).removeClass('highlighted');
                                    if($('#MIMO-'+range+'-'+ID).attr('id') != clickedPortID){
                                        fillColor($('#MIMO-'+range+'-'+ID),0.7,defaultHighlightColor,true);
                                    }
                                }
                            }
                        })
                    }
                }
            }
        }


        //highlight both UL and DL port so when rollover DL==> highlight UL as well and vice versa
        function highlightSiblingPort(item,opacity,highlightedColor,alwaysOn,isMIMO){
            var port = getSlot(item.attr('title'));
            var sibPort = getSiblingPort(item.attr('title'));
            if(isMIMO){
                //if sibling has class available then highlight
                //if not it may be dupl case
                fillColor($('#MIMO-'+port+'-'+sibPort), opacity,highlightedColor,alwaysOn);
            }else{
                fillColor($('#'+port+'-'+sibPort), opacity,highlightedColor,alwaysOn);
            }
        }
        //function used to refresh higlighted slot and port on image map
        function unhilightEverything(nodeType,isMIMO){
            //console.log("unhighlight");
            var connList = getConnList(nodeType);
            //console.log(connList);
            var range;
            if(nodeType.indexOf("APOI") != -1){
                if(isMIMO){
                    for(var i =1;i<=8;i++){
                        range = i;
                        $.each(connList,function(index,ID){
                            var data = $('#MIMO-'+range+'-'+ID).data('maphilight') || {};
                            data.alwaysOn = false;
                            $('#MIMO-'+range+'-'+ID).data('maphilight', data).trigger('alwaysOn.maphilight');
                            //remove available class when change apoi / mtdi model
                            $('#MIMO-'+range+'-'+ID).removeClass('available highlighted clicked');
                        })
                    }
                }else{
                    for(var i =1;i<=8;i++){
                        range = i;
                        $.each(connList,function(index,ID){
                            var data = $('#'+range+'-'+ID).data('maphilight') || {};
                            data.alwaysOn = false;
                            $('#'+range+'-'+ID).data('maphilight', data).trigger('alwaysOn.maphilight');
                            //remove available class when change apoi / mtdi model
                            $('#'+range+'-'+ID).removeClass('available highlighted clicked');
                        })
                    }
                }

            }else if (nodeType.indexOf("MTDI") != -1){
                if(isMIMO){
                    for (var j =1;j<=2;j++){
                        for(var i =1; i<=4;i++){
                            range = j+"-"+i;
                            $.each(connList,function(index,ID){
                                var data = $('#MIMO-'+range+'-'+ID).data('maphilight') || {};
                                data.alwaysOn = false;
                                $('#MIMO-'+range+'-'+ID).data('maphilight', data).trigger('alwaysOn.maphilight');
                                //remove available class when change apoi / mtdi model
                                $('#MIMO-'+range+'-'+ID).removeClass('available highlighted clicked');
                            })
                        }
                    }
                }else{
                    for (var j =1;j<=2;j++){
                        for(var i =1; i<=4;i++){
                            range = j+"-"+i;
                            $.each(connList,function(index,ID){
                                var data = $('#'+range+'-'+ID).data('maphilight') || {};
                                data.alwaysOn = false;
                                $('#'+range+'-'+ID).data('maphilight', data).trigger('alwaysOn.maphilight');
                                //remove available class when change apoi / mtdi model
                                $('#'+range+'-'+ID).removeClass('available highlighted clicked');
                            })
                        }
                    }
                }

            }
        }

        //this SUCKS :((
        function blink(item){
            var counter = 0, over_out = true;
            var interval_ix = window.setInterval(function(){
                if(over_out){
                    $('#'+item).trigger('mouseover');
                } else {
                    $('#'+item).trigger('mouseout');
                }
                over_out = !over_out;
                if(++counter > 200){
                    window.clearInterval(interval_ix);
                }
            }, 300);
        }

        //function to fill color for image map area
        function fillColor(item,opacity, fillColor,alwaysOn){
            var d = item.data('maphilight') || {};
            d.alwaysOn = alwaysOn;
            d.fillOpacity=opacity;
            d.fillColor=fillColor;
            item.data('maphilight', d).trigger('alwaysOn.maphilight');
        }
        //set the ok tick for each instruction
        function setInstructionStt(index){
            for(var i =1;i<index;i++){
                $('#instruction'+i+'_stt').removeClass('icon ok_disabled').addClass('icon ok');
            }
            for(var i =index;i<=9;i++){
                $('#instruction'+i+'_stt').removeClass('icon ok').addClass('icon ok_disabled');
            }
        }
        //display instruction to choose MTDI
        function MTDI_instruct(isFromAPOI){
            //highlight wizard steps
            $('.wizard-step').removeClass('highlighted');
            $('#wizard-mtdi').addClass('highlighted');
            console.log("connect with mtdi");
            $('#instruction_txt4').empty();
            if(isFromAPOI){
                $('#instruction_txt4').append('<span><b>Please choose the MTDI that you want to connect the APOI to: </b></span>');
            }else{
                $('#instruction_txt4').append('<span><b>Please choose the MTDI that you want to connect to: </b></span>');
            }
            var MTDISelect ="<select id='MTDI_select'><option value=''>Select</option>";
            var foundMTDIAvail = false;
            var availNode=[];
            
            if(isFromAPOI){
            
                unocupiedSlotList=[];

                api.exe({
                    cmd:'rfranges --json',
                    dataType:'json',
                    onSuccess:function(o){
                        var data = o.ajaxdata;

                        //verify which slot in APOI and MTDI is within frequency range with added sector
                        $.each(data.nodes, function(index, node){
                            if(node.NodeType.indexOf("MTDI") != -1 || node.NodeType.indexOf("APOI") != -1){
                                var availRange =[];
                                $.each(node.Ranges, function(key, range){
                                    if(SECTORBAND === range.Type) {
                                        if (SECTORLOWERDL >= range.LowerDL && SECTORUPPERDL <= range.UpperDL) {
                                            availRange.push(range.Band);
                                        }
                                    }
                                })
                                availNode.push({"ID":node.ID,"NodeType":node.NodeType,"Tag":node.Tag,"Ranges":availRange});
                            }
                        })
                        //running through connections cmd to check which slot in found slot above has already been occupied
                        api.exe({
                            cmd:'connections -o '+OPERATOR+' --json',
                            async:false,
                            dataType:'json',
                            onSuccess:function(o){
                                var rfConn = o.ajaxdata.rf_connections;
                                var occupiedList =[];

                                $.each(availNode,function(i,node){
                                    var occupiedRangeList = [];
                                    $.each(node.Ranges, function(j,range){
                                        var occupiedPort=[];
                                        var tempOccupiedPort=[];
                                        $.each(rfConn, function (key, rfconn){
                                            if(rfconn.Type === 'DUPL'){
                                                $.each(rfconn.conn, function (key, conn){
                                                    if(conn.To.indexOf(node.ID+':'+range+':SECT-DL1') !=-1 || conn.To.indexOf(node.ID+':'+range+':SECT-DL2') !=-1 ||conn.To.indexOf(node.ID+':'+range+':DL1') !=-1 || conn.To.indexOf(node.ID+':'+range+':DL2') !=-1){
                                                        occupiedPort.push(conn.To.substring(conn.To.length-1));
                                                    }
                                                })
                                            }
                                            else {
                                                $.each(rfconn.conn, function (key, conn){
                                                    if(conn.To.indexOf(node.ID+':'+range+':SECT-DL1') !=-1 || conn.To.indexOf(node.ID+':'+range+':SECT-DL2') !=-1
                                                        ||conn.To.indexOf(node.ID+':'+range+':DL1') !=-1 || conn.To.indexOf(node.ID+':'+range+':DL2') !=-1){
                                                        occupiedPort.push(conn.To.substring(conn.To.length-1));
                                                    }
                                                })
                                            }
                                        })
                                        //remove port 2 in APOI by adding them to occupied Port
                                        /*
                                        if(node["NodeType"].indexOf("APOI") != -1){
                                            occupiedPort.push("2");
                                        }*/
                                        occupiedRangeList.push({"Band":range,"Port":occupiedPort});
                                    })

                                    occupiedList.push({"ID":node.ID,"Ranges":occupiedRangeList});
                                })
                                //find out unoccupied slot and port to highlight on image map
                                $.each(availNode,function(nodekey, availnode){
                                    $.each(occupiedList,function(nodekey, slot){
                                        if(availnode.ID === slot.ID){
                                            var unoccupiedRangeList =[];
                                            $.each(availnode.Ranges,function(key, range){
                                                $.each(slot.Ranges,function(key, slotRange){
                                                    if(range === slotRange.Band){
                                                        var unocupiedPortList = _.difference(["1","2"],slotRange.Port );
                                                        unoccupiedRangeList.push({"Band":range,"Port":unocupiedPortList});
                                                        //if found port then carry on, or else display msg and send user back to main page
                                                        if(unocupiedPortList.length>0){
                                                            foundAvailablePorts=true;
                                                        }
                                                    }
                                                })
                                            })
                                            //console.log(unoccupiedRangeList);
                                            unocupiedSlotList.push({"ID":availnode.ID,"NodeType":availnode.NodeType,"Tag":availnode.Tag,"Ranges":unoccupiedRangeList});
                                        }
                                    })
                                })
                            }
                        })            



                        $.each(unocupiedSlotList, function(key,value){
                            var foundAvailPort=false;
                            $.each(value.Ranges,function(index,range){
                                if(range.Port.length > 0 && value.NodeType.indexOf("MTDI") !=-1){
                                    foundAvailPort = true;
                                }
                            })
                            if(foundAvailPort){
                                MTDISelect += "<option value="+value.ID+">"+value.Tag+' - '+value.ID+"</option>";
                                foundMTDIAvail = true;
                            }
                        })
                        MTDISelect +="</select>";
                        if(!foundMTDIAvail){
                            axellPopUp('No MTDI port within this frequency range available');
                        }else{
                            $('#instruction_txt4').append(MTDISelect);
                            $('#instruction4').show();
                            setInstructionStt(4);
                            //update show guide tool
                            showGuideTool();
                        }
                    }
                })
            }
            else {
                $.each(unocupiedSlotList, function(key,value){
                    var foundAvailPort=false;
                    $.each(value.Ranges,function(index,range){
                        if(range.Port.length > 0 && value.NodeType.indexOf("MTDI") !=-1){
                            foundAvailPort = true;
                        }
                    })
                    if(foundAvailPort){
                        MTDISelect += "<option value="+value.ID+">"+value.Tag+' - '+value.ID+"</option>";
                        foundMTDIAvail = true;
                    }
                })
                MTDISelect +="</select>";
                if(!foundMTDIAvail){
                    axellPopUp('No MTDI port within this frequency range available');
                }else{
                    $('#instruction_txt4').append(MTDISelect);
                    $('#instruction4').show();
                    setInstructionStt(4);
                    //update show guide tool
                    showGuideTool();
                }
            }
        }
        //display instruction to choose MTDI for MIMO
        function MTDI_instruct_MIMO(isFromAPOI){
            $('#instruction_txt8').empty();
            if(isFromAPOI){
                $('#instruction_txt8').append('<span><b>Please choose the MTDI that you want to connect the APOI to (MIMO):</b></span>');
            }else{
                $('#instruction_txt8').append('<span><b>Please choose the MTDI that you want to connect to (MIMO):</b></span>');
            }
            var MTDISelect ="<select id='mimo_MTDI_select'><option value=''>Select</option>";
            var foundMTDIAvail = false;
            
            $.each(unocupiedSlotList, function(key,value){
                var foundAvailPort=false;
                $.each(value.Ranges,function(index,range){
                    //run through the node list if there is port available
                    if(range.Port.length > 0 && value.NodeType.indexOf("MTDI") !=-1){
                        $.each(value.Ranges,function(index, range){
                            //should not allow connection to same slot as previous connection (gonna break MIMO)
                            //if slot is not the same as the chosen MTDI slot in previous connection then set flag to true
                            if(range.Band != MTDIportNo){
                                foundAvailPort = true;
                            }
                        })
                    }
                })
                if(foundAvailPort){
                    MTDISelect += "<option value="+value.ID+">"+value.Tag+' - '+value.ID+"</option>";
                    foundMTDIAvail = true;
                }
            })

            MTDISelect +="</select>";
            if(!foundMTDIAvail){
                axellPopUp('No MTDI port available for MIMO found');
            }else{
                $('.mimo').show();
                $('#instruction_txt8').append(MTDISelect);
                $('#instruction8').show();
                setInstructionStt(8);
                //update guide tool position
                showGuideTool();
                showMIMOGuideTool();
                //repaint connection line after append new line on top
                firstInstance.repaintEverything();
            }

        }
        //hard code of port ID list for APOI and MTDI
        function getConnList(nodeType,port){
            var connList;
            if(nodeType.indexOf("APOI") != -1){
                if(port === "1"){
                    if(CONNTYPE ==="DUPL" || CONNTYPE==="MIMODUPL"){
                        connList=['SECT-DL1'];
                    }else if(CONNTYPE ==="DLUL" || CONNTYPE ==="MIMO"){
                        connList=['SECT-UL1','SECT-DL1'];
                    }
                }else if(port === "2"){
                    if(CONNTYPE ==="DUPL" || CONNTYPE==="MIMODUPL"){
                        connList=['SECT-DL2'];
                    }else if(CONNTYPE ==="DLUL" || CONNTYPE ==="MIMO"){
                        connList=['SECT-UL2','SECT-DL2'];
                    }
                }else{
                    connList=['SECT-UL1','SECT-DL1','SECT-UL2','SECT-DL2'];
                }
            }else if(nodeType.indexOf("MTDI") != -1){
                if(port === "1"){
                    connList= ['DL1','UL1'];
                }else if(port === "2"){
                    connList= ['UL2','DL2'];
                }else{
                    connList= ['DL1','UL1','UL2','DL2'];
                }

            }
            return connList;
        }

        //get slot of APOI or MTDI from title attribute
        //APOI :   4:SECT-DL1  --> slot 4
        //MTDI :   1-1:UL1   --> slot 1-1
        function getSlot(portID){
            var port;
            port = portID.substring(0, portID.indexOf(":"));
            return port;
        }
        //get other uplink/ downlink port
        function getSiblingPort(portID){
            var sibPort;
            var ULDL;
            if(portID.indexOf("UL") != -1){
                ULDL = "DL";
                sibPort = portID.substring(portID.indexOf(':')+1,portID.indexOf('UL'))+ULDL+portID.substring(portID.length-1,portID.length);
            }else{
                ULDL ="UL";
                sibPort = portID.substring(portID.indexOf(':')+1,portID.indexOf('DL'))+ULDL+portID.substring(portID.length-1,portID.length);
            }
            return sibPort;
        }

    })
