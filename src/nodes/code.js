require([ '/js/api.js', '/js/format.js' ], function ( api, format ) {
    //{{OPTIONS
    //** This specified how often the page should be refreshed
    var REFRESH_INTERVAL=5000;
    //** the message to be shown for every node state
    var NODE_STATE_MESSAGE = {
        STANDBY : 'This is a standby node in a redundant installation.' +
            'Currently the primary OMU site is communicating with the node why it is not accessible from here.' +
            'In order to view node it has to be accessed via the primary OMU.',
        RECEIVING: 'Required information to display node status and configuration is currently being received.' +
            'It may take a couple of minutes to receive them. Please refresh this page later.' +
            'Note: This page will automatically refresh every 30 seconds until all information is received.',
        UNSUPPORTED: 'Some products do not have the remote control features via the web. ' +
            'It is because of the nature of their architecture. Please use other control ' +
            'mechanisms like RMC or Telnet. Remote control of this node is not possible via Web access.',
        ERROR: 'Failed to retrieve required information from the node to display status and configurations.' +
            'Please verify communication status with node.'
    };
    //}}OPTIONS

    //** This is a flag that will be used when parsing the output of the nodes command (nodes command on slave and master has different formats)
    var isMaster=false;
    var isSlave=false;
    //**holds the result of the last "nodes -w" command so that we don't re-draw the screen unneccessarily
    var lastResult=null;

    var nodeParser = new format.Parser([
        //when the page is being shown on a master node
        'number:n serial status:c comm:c mode:q rack:s slot:s mdl:q tag:q version:q description:q state',
        //when the page is being shown on a master node
        'number:n serial status:c comm:c mdl:q tag:q versions:q state'
    ],true );

    //** lists all the nodes on the screen
    api.exe({
        cmd: 'nodesw',
        parser: nodeParser,
        interval: REFRESH_INTERVAL,
        callOnDiff: true,
        onSuccess: function ( o ) {
            //remove the button that controls the current node
            Handlebars.replaceTemplate( '#node-table-template', { nodes: o.parsedResults } );
            //remove the button that controls the current node
            api.exe({
                cmd: 'get nno',
                onSuccess: function ( o ) {
                    $( 'tr#node-' + o.ajaxdata + '-row .button').addClass( 'disabled' );
                }
            });
            //** event handler for the delete buttons
            $( '.node-delete-button' ).click( function () {
                if ( $( this).hasClass( 'disabled' ) ) {
                    return;
                }
                if ( confirm( "Are you sure you want to delete this node?" ) ) {
                    api.exe({
                        cmd: "act node delete " + $( this).attr( 'data-node-serial' ),
                        onSuccess: function ( o ) {
                            axellPopUp( 'Node removed. The list will be refreshed in a few seconds' );
                        },
                        onError: function ( o ) {
                            axellPopUp( 'Could not delete node: ' + o.errorThrown );
                        }
                    });
                }
            });
            //** event handler for the control buttons
            $( '.node-control-button' ).click( function () {
                if ( $( this).hasClass( 'disabled' ) ) {
                    return;
                }
                var state = $( this).attr( 'data-state' );
                //special processing for the READY node
                if ( state === 'READY' ) {
                    //we can browse to a node only if it doesn't have a communication error
                    if ( $( this).attr( 'data-comm' ) !== '1' ) {
                        window.location.href = '/nodes/' + $( this).attr( 'data-node-serial' );
                    } else {
                        axellPopUp( 'Node control page cannot be shown because of communication problem. ' +
                            'Please solve the communication problem and try again.' );
                    }
                } else {
                    axellPopUp( NODE_STATE_MESSAGE[ state ] );
                }
            });
        },
        onError: function ( o ) {
            axellPopUp( 'Could not get the list of nodes: ' + o.errorThrown );
            o.interval = 0;
        }
    });
});