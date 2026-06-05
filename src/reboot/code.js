require([ '/js/lib/jquery.js', '/js/api.js' ], function ( $, api ) {

    //** it takes roughly 80-90 sec to reboot the controller
    var REBOOT_TIME = 90;

    //** Reboots the controller by executing the reboot command
    function rebootController ( force ){
        //execute the command (no callback)
        var $rebootProgressbar = $( '#reboot-progress-bar' );
        var progressbarVal = 0;
        $rebootProgressbar.progressbar({
            max:REBOOT_TIME,
            value: progressbarVal
        });
        api.exe({
            cmd: force? 'reboot force' : 'reboot',
            onSuccess: function () {
                $( '#reboot-in-progress-dialog').css( 'display', '' ).dialog();
                //start the counter
                setInterval( function () {
                    progressbarVal++;
                    if ( progressbarVal === REBOOT_TIME ) {
                        //ok, the reboot wait is over, refresh the page
                        window.location.reload();
                    } else {
                        $rebootProgressbar.progressbar( 'option', 'value', progressbarVal );
                    }
                }, 1000 );

            },
            onError: function () {
                axellPopUp( 'Reboot failed: ' + this.errorThrown );
            }
        });
    }

    $(function () {
        $( '#reboot-button' ).click( function () {
            if( confirm("Are you sure you want to reboot the controller?")){
                rebootController( $( '#forcerebootCbxc' ).prop( 'checked' ) );
            }
        });
    });
});