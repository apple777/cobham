require( [ '/js/api.js' ], function ( api ) {
	var USERACCESS = $.cookie("userAccess");

	var dataChanged = false;
		
	/**
     * Sets all the alarm descriptions from the edit boxes
     */
    function wait(ms)
    {
        var d = new Date();
        var d2 = null;
        do { d2 = new Date(); }
        while(d2-d < ms);
    }

    function saveEverything(){
        for ( var i = 1 ; i <= 4 ; i++ ) {
            var desc = $( "#ext" + i + "desc" ).val();
			var value = $('input[name=ext' + i + 'pin]:checked').val();
			var command = "measurements set ext " + i + " " + value + " " + desc;
			api.exe({
				cmd: command,
				onSuccess: function (o) {
				}
			})
            wait(1500); 
		}
    }

	function set_check_box_and_description(ext_num, val, description){
		if(val == "1"){
			$( "#ext" + ext_num + "hi" ).prop( "checked", true  ).data( "original-val", true  );
			$( "#ext" + ext_num + "lo" ).prop( "checked", false ).data( "original-val", false );
		}
		else{
			$( "#ext" + ext_num + "hi" ).prop( "checked", false ).data( "original-val", false );
			$( "#ext" + ext_num + "lo" ).prop( "checked", true  ).data( "original-val", true  );
		}
		$( "#ext" + ext_num + "desc" ).val( description ).data( "original-val", description );

	}
    /**
     * This function loads the EXT attribute and sets up the GUI accordingly
     * Loads all the alarm descriptions into the edit boxes
     */
    function loadEverything(){
        var command;
        
        command = "measurements get ext";
        
        api.exe({
			cmd: command,
			dataType: 'json',
			async: false,
			onSuccess: function (o) {
				var Externals = o.ajaxdata;
				set_check_box_and_description(1, Externals.EX1_POL, Externals.EX1_DESC);
				set_check_box_and_description(2, Externals.EX2_POL, Externals.EX2_DESC);
				set_check_box_and_description(3, Externals.EX3_POL, Externals.EX3_DESC);
				set_check_box_and_description(4, Externals.EX4_POL, Externals.EX4_DESC);
			}
        })
    }


    /**
     * This is called when the apply button is pressed
     */
    function onApplyButton(){
        $.blockUI({ 
            fadeIn: 1000, 
            timeout:   2000, 
            onBlock: function() { 
                saveEverything();
            } 
        }); 
    }

    /** An event listener that is called whenever the contents of the edit boxes are changed */
    function onDataChange ( e ) {
        //check if the data is changed from the original value that is loaded from the controller
        for ( var i = 1; i <= 4 ; i++ ) {
            if(
                ( $( "#ext" + i + "desc" ).data( "original-val" ) !== $( "#ext" + i + "desc" ).val() ) ||
                ( $( "#ext" + i + "hi"   ).data( "original-val" ) !== $( "#ext" + i + "hi" ).prop( "checked" ) ) ||
                ( $( "#ext" + i + "lo"   ).data( "original-val" ) !== $( "#ext" + i + "lo" ).prop( "checked" ) )
            ) {
                dataChanged = true;
                break;
            }
        }
        console.log( "Data validation result: " + dataChanged );
    }
    /**
     * This runs when the page is loaded and ready
     */
    $(function(e) {
        $( '#apply-button' ).click(function(){
            if(!$(this).hasClass('disabled')){
                onApplyButton();
            }
        });
        $( ".ead-edit" ).change( onDataChange );
        $( ".ext-radio" ).change( onDataChange );
        loadEverything();
        //if user is not sysadmin, disabled all functionalities
        if(USERACCESS !="superuser"){
            $( '#apply-button').addClass('disabled');
            $('.ext-radio').attr('disabled',true);
            $('.ead-edit').attr('disabled',true);
        }
    });
});