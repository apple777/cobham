require([ '/js/lib/handlebars.js', '/js/api.js'], function ( Handlebars, api ) {
    String.prototype.unquoted = function (){return this.replace (/(^")|("$)/g, '')}
    //adds a new row to the simulation table
    var count = 0;
    var corbs="1: 2:DZDL 3: 4:DZDN";
    
    function addRow(obj)
    {
       var cmdnumber=0;
       var cmdtxfmt=0;
       var cmdrxfmt=0;
       var cmdtxoffset=0;
       var cmdrxoffset=0;
       var label="";
       var type="";
       
       var resp = "";
        resp += "<tr>";
        resp += "<td class=\"action-cell\">" + obj.name + "</td>";
        resp += "</tr>";
        
        resp += "<tr>";
        resp += "<td class=\"action-cell\">";
        for(var i=0; i< obj.cmdlist[0].children.length; i++)
        {
            //resp += "<span>"+obj.data[0].children[i].nodeName+','+"</span>";            
            //resp += "<td class=\"action-cell\">";
            
            cmdnumber=obj.cmdlist[0].children[i].find("cmdnr").find("hex").textContent.unquoted();
            
            resp += "<a class=\"button "+obj.cmdlist[0].children[i].children[0].textContent.unquoted()+"Button\" "+
                    "data-serial=\""+obj.serial+"\" "+
                    "data-cmdnumber=\""+obj.cmdlist[0].children[i].children[2].children[0]textContent.unquoted()+"\" "+
                    "data-cmdtxfmt=\""+obj.cmdlist[0].children[i].children[3].textContent.unquoted()+"\" "+
                    "data-cmdrxfmt=\""+obj.cmdlist[0].children[i].children[4].textContent.unquoted()+"\" "+
                    "data-cmdtxoffset=\""+obj.cmdlist[0].children[i].children[5].textContent.unquoted()+"\" "+
                    "data-cmdrxoffset=\""+obj.cmdlist[0].children[i].children[6].textContent.unquoted()+"\" "+
                    "data-label=\""+obj.data[0].children[0].textContent.unquoted()+"\" "+
                    "data-type=\""+obj.data[0].children[1].textContent.unquoted()+"\">"+
                    obj.cmdlist[0].children[i].children[0].textContent.unquoted()+"</a>";
                                                   
            //resp += "</td>";
        }
        resp += "<input type=\"textarea\" id=\"txt_"+obj.serial+"_"+obj.data[0].children[0].textContent.unquoted()+"\" value=\"\"><br>";
        resp += "</td>";
        resp += "</td>";
        resp += "</tr>";
        return resp;
    }


   function loadXmlAndDraw(){
      $.ajax({
         type: "GET",
         url: "index.xml",
         cache: false,
         dataType: "xml",
         success: function(xml) {
            var tokens=corbs.split(" ");
            var serial="";
            var tmp=""
            var resp="<table>";
            console.log(corbs);
            console.log(tokens);
            for(var i=0; i<tokens.length; i++){
                
               index=tokens[i].split(":")[0];
               serial=tokens[i].split(":")[1];
               resp += "<td>";// + tokens[i];
               resp += "<table>";
               if(serial){
                  $(xml).find('object').each(function(){
                     var obj = {};
                     obj.name = $(this).find("name").first().text();
                     obj.serial=serial;
                     obj.transport = $(this).find("transport").text();
                     obj.data = $(this).find("data");
                     obj.cmdlist = $(this).find('command');

                     resp += addRow( obj );
                  });
               }
               /*else{
                  resp += "<tr>";
                  resp += "<td class=\"action-cell\"> - </td>";
                  resp += "</tr>";
               }*/
               resp += "</table>";
               resp += "</td>";

            }
            resp += "</table>";            
            $( '#sim-table-body' ).append(resp);
         }
      });

   }

   function drawHeading(){
      var tokens=corbs.split(" ");
      var serial="";
      var resp="";
      resp="<table id=\"piclist\">";
      resp += "<tr>";

      for(var i=0; i<tokens.length; i++){
         index=tokens[i].split(":")[0];
         serial=tokens[i].split(":")[1];
         
         resp += "<td class=\"action-cell\">" + (i+1).toString() + ":";
         if(serial){
            resp += serial;
         }else{
            resp += " - ";
         }
         resp += "</td>";
      }
      resp += "</tr>";
      resp += "</table>";    
      $( '#sim-table-body' ).append(resp);        
   }
   
   $(document).ready(function () {
      console.log("reading pics installed in system");
      api.exe({
                cmd:'picnames',
                onSuccess:function(o){
                   corbs=o.ajaxdata;
                   drawHeading();
                   loadXmlAndDraw();
                },
                onError:function(err){
                    axellPopUp(err.errorThrown);
                }
            });
      
      
      $(document).on( "click", ".GETButton", function() {
         //alert($(this).data('cmdnumber') +" "+ $(this).data('cmdtxfmt')+" "+ $(this).data('cmdrxfmt'));
         var id = '#txt_'+$(this).data('serial')+'_'+$(this).data('label');
         var offset=$(this).data('cmdrxoffset');
         api.exe({
             cmd:'pictalk -L socket 127.0.0.1 baud 115200 txfmt \"'+$(this).data('cmdtxfmt')+"\" txdata \"78,'"+$(this).data('serial')+"',0,"+$(this).data('cmdnumber')+"\" rxfmt \""+$(this).data('cmdrxfmt')+"\"",
             onSuccess:function(o){
                 //alert(o.ajaxdata);
                 var resp = o.ajaxdata;
                 
                 $(id).val(resp.split(",")[offset]);
             },
             onError:function(err){
                 axellPopUp(err.errorThrown);
             }
         })
      });

        $(document).on( "click", ".SETButton", function() {
           var id = '#txt_'+$(this).data('serial')+'_'+$(this).data('label');
           var data="";
           //if($(this).data('label') == "ASCII"){
              data=",'"+$(id).val()+"'";
           //}else{
           //   data=","+$(id).val();
           //}
           data = data.replace(/"/g, "");
           
           api.exe({
                cmd:'pictalk -L socket 127.0.0.1 baud 115200 txfmt \"'+$(this).data('cmdtxfmt')+"\" txdata \"78,'"+$(this).data('serial')+"',0,"+$(this).data('cmdnumber')+data+"\" rxfmt \""+$(this).data('cmdrxfmt')+"\"",
                onSuccess:function(o){
                    alert(o.ajaxdata);
                },
                onError:function(err){
                    axellPopUp(err.errorThrown);
                }
            })
        });
    });
});
