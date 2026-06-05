/*
Simulation data:

 {"nodesw":"'0' 'AMLM' '1' '-' '' '-' '-' 'OMU-MkII-M' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"OMU 2.1.2.19\"' '' 'READY'\n'1' 'R5S1' '-' '1' 'ACTIVE' '1' '1' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'2' 'R5S2' '-' '1' 'ACTIVE' '1' '2' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'3' 'R5S3' '-' '1' 'ACTIVE' '1' '3' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'4' 'R6S1' '-' '1' 'ACTIVE' '1' '5' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'5' 'R6S2' '-' '1' 'ACTIVE' '1' '6' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'6' 'ALSU' '0' '0' '' '1' '7' 'MBF-20-D-2307-2317-S' 'New F-DAS unit' 'SW03910AX9 -' '' 'READY'","get ola 1:1":"0 123304 070213 123355 070213 25 25 -31.7 2 \"Pilot tone adjusted to -31.7 dBm, procedure completed.\"","get ola 1:2":"0 100316 070213 100318 070213 25 25 -33.4 0 \"Pilot tone adjusted to -33.4 dBm, procedure completed.\"","get ola 1:3":"0 100329 070213 100331 070213 25 25 -32.2 0 \"Pilot tone adjusted to -32.2 dBm, procedure completed.\"","get ola 1:5":"0 100342 070213 100342 070213 25 25 -31.3 0 \"Pilot tone adjusted to -31.3 dBm, procedure completed.\"","get ola 1:6":"0 100354 070213 100359 070213 25 25 -33.1 0 \"Pilot tone adjusted to -33.1 dBm, procedure completed.\"","get ola 1:7":"0 100410 070213 100435 070213 25 22 -31.7 1 \"Pilot tone adjusted to -31.7 dBm, procedure completed.\""}

*/

/*
 * There are mainly 3 commands used in this page:
 * 1. optoadjustments: returns a table of the current status of the opto-loss adjustment in all fiber optic module
 * 2. ACT OLA <LIST>: starts opto-loss adjustment on one or more fiber optic modules in the format of RACK:SLOT where RACK and SLOT are integer numbers
 * 3. GET OLA PROGRESS: returns 0 or 1 to indicate if there is an opto-loss adjustment already in progress (1) or the system is ready to start the opto-loss adjustment algorithm (0)
 */

/*
Hamed:

instead of optoadjustments, you can use the following attributes:

Uplink OLA status:
GET OLA <rack>:<slot> (see p43 of spec)

Downlink OLA status:
GET FDS <unit> OLA (see p84 of the spec)

Martin:
 [13-02-07 4:22:09 PM] Martin Wetterholm WORK: DL belongs to the repeater, UL to the OMU
 [13-02-07 4:22:15 PM] Martin Wetterholm WORK: DL for FDAS also for OMU
 */

//adjust the OLA for all the nodes. Note: this function will be interrupted when the page is unloaded
function olaRows () {
    $( 'tr').each( function ( index, element ) {
        olaRow( $( element ) );
    });
}

function olaRow ( $tr ) {
    if ( $tr.hasClass( 'ola-row' ) && $tr.find( '.ola-cbx:checked' ).length ) {
        var cmd;
        if ( $tr.hasClass( 'opto-row' ) ) {
            //OLA uplink: 'ACT OLA <rack>:<slot>'
            cmd = 'act ola ' + $tr.attr( 'data-rack' ) + ':' + $tr.attr( 'data-slot' );
        } else if ( $tr.hasClass( 'node-row' ) ) {
            //OLA downlink:
            //check if it is a FDS unit (the mdl for FDS units starts with MBF-20 in it)
            if ( /^MBF-20/i.test( $tr.attr( 'data-mdl' ) ) ) {
                //'@node-number ACT FDS OLA'
                cmd = '@' + $tr.attr( 'data-serial' ) + ' act fds ola';
            } else {
                //'@node-number ACT OLA'
                cmd = '@' + $tr.attr( 'data-serial' ) + ' act ola';
            }
        }
        $tr.find( '.ola-cbx').prop( 'checked', false );
        ax.api.exe({
            cmd: cmd,
            onAlways: function ( o ) {
                getRow( $tr );
            }
        });
    }
}

//event handler for the adjust button
$( '#adjust-button').click( function () {
    if ( !$( this).hasClass( 'disabled' ) ) {
        olaRows();
    }
});

$( '#select-all-ola-cbx' ).prop( 'checked', false ).change( 'change', function () {
    $( ':checkbox:not([disabled])' ).prop( 'checked', $( this ).is( ':checked' ) );
});

$( '#select-all-ul-ola-cbx' ).prop( 'checked', false ).change( 'change', function () {
    $( '.ul-ola-cbx:not([disabled])' ).prop( 'checked', $( this ).is( ':checked' ) );
});

$( '#select-all-dl-ola-cbx' ).prop( 'checked', false ).change( 'change', function () {
    $( '.dl-ola-cbx:not([disabled])' ).prop( 'checked', $( this ).is( ':checked' ) );
});

/*
                     <Status> is status of last measurement, 0 means adjustments were successfully completed, 1 means
                              adjustments failed.

                 <Start Time> is on the format HHMMSS DDMMYY, where HHMMSS is the time with 24 hours notation, and
                              DDMMYY is the date for when last measurement started.

                  <Stop Time> is on the format HHMMSS DDMMYY, where HHMMSS is the time with 24 hours notation, and
                              DDMMYY is the date for when last measurement finished.

        <Initial Attenuation> is the attenuation set before starting the adjustment routine.

      <Resulting Attenuation> is the attenuation that was set when routine was completed.

 <Resulting Pilot Tone Level> indicates the received pilot tone level in dBm * 10 when adjustment was completed (for
                              optimal performance, pilot tone should be adjusted to -32.0 dBm).

         <NumberOfIterations> indicates number of iterations (Set Attenuation- Read Pilot Tone Level) that was needed to
                              complete adjustment.

              <Result String> is a quoted string containing additional information about measurement or reason for
                              failure.
 */

var olaParser = new ax.Parser([
    'dash:-',
    'status:n startTime:d startDate:t stopTime:d stopDate:t initAtten:n resAtten:n pilot:n nIter:n resStr:Q'
]);

//** updates a row from ajax calls
function getRow ( $tr ) {
    if ( $tr.hasClass( 'ola-row' ) ) {
        var cmd;
        if ( $tr.hasClass( 'opto-row' ) ) {
            //OLA uplink: 'GET OLA <rack>:<slot>'
            cmd = 'get ola ' + $tr.attr( 'data-rack' ) + ':' + $tr.attr( 'data-slot' );
        } else if ( $tr.hasClass( 'node-row' ) ) {
            //OLA downlink:
            //check if it is a FDS unit (the mdl for FDS units starts with MBF-20 in it)
            if ( /^MBF-20/i.test( $tr.attr( 'data-mdl' ) ) ) {
                //'@node-number GET FDS OLA'
                cmd = '@' + $tr.attr( 'data-serial' ) + ' get fds ola';
            } else {
                //'@node-number GET OLA'
                cmd = '@' + $tr.attr( 'data-serial' ) + ' get ola';
            }
        }
        ax.api.exe({
            cmd: cmd,
            parser: olaParser,
            onSuccess: function ( o ) {
                $tr.find( '.ola-cbx').prop( 'disabled', false );
                //check if it was a simple dash
                var results = o.parsedResults;
                if ( results.dash ) {
                    //this is a dash. Nothing special to process really
                    $tr.find( '.status-led' ).led( 'option', 'color', 'grey' );
                    $tr.find( '.message-cell' ).text( 'OLA has not been done' );
                } else {
                    if ( results.status === 2 ) {
                        $tr.addClass( 'in-progress' );
                        $tr.find( '.message-cell' ).text( results.resStr );
                        //check this row again in 2 seconds
                        setTimeout( function () { getRow( $tr ) }, 2000 );
                    } else {
                        $tr.removeClass( 'in-progress' );
                        $tr.find( '.message-cell' ).text( results.resStr );
                        $tr.find( '.result-attenuation-cell' ).text( results.resAtten );
                        $tr.find( '.pilot-cell' ).text( results.pilot );
                        $tr.find( '.stop-cell' ).text( results.stopDate + ' ' + results.stopTime );
                        $tr.find( '.status-led' ).led( 'option', 'color', results.status );
                    }
                }
            },
            onError: function ( o ) {
                //if there was an error, remove the in-progress flag, show a red led and the error message
                $tr.removeClass( 'in-progress' );
                $tr.find( '.status-led' ).led( 'option', 'color', 'red' );
                $tr.find( '.message-cell' ).text( o.errorThrown );
            }
        });
    }
}

//gets the status information that wasn't int he 'nodesw' command and shows it in the rows
function getRows () {
    //update all rows that present an opto
    $( 'tr' ).each( function () {
        getRow( $( this ) );
    });
}

//draw the page template
ax.api.exe({
    cmd: 'nodesw',
    parse: 'number:n serial status:c comm:n mode:q rack:s slot:s mdl:q tag:q versions:q description:q state',
    onSuccess: function ( o ) {
        /*
        The layout is like this:
        layoutData = {
            optos = [
                {//opto1
                    rack: 1,
                    slot: 2,
                    nodes: [
                        {
                            number: 1,
                            serial: 'BLAH',
                            mdl: 'MBF-40',
                            tag: 'Repeater Tag',
                            status: 0,
                            comm: 0,
                            ...
                            isLast: true //only for the last node of every opto
                        }
                    ]
                },
                {
                    ... another opto ...
                }
            ]
        }
         */
        var layoutData = {
            optos: []
        };

        var nodes = _.filter( o.parsedResults, function ( node ) {
            return _.isFinite( node.rack ) && _.isFinite( node.slot );
        });
        _.each( nodes, function ( node ) {
            var opto = null;
            //try to find an opto with this rack/slot already in the array
            for ( var o = 0; o < layoutData.optos.length; o++ ) {
                if ( layoutData.optos[ o ].rack === node.rack && layoutData.optos[ o ].slot === node.slot ) {
                    opto = layoutData.optos[ o ];
                    break;
                }
            }
            //if opto is not found yet, make a new one and put it in the layout data
            if ( !opto ) {
                opto = {
                    rack: node.rack,
                    slot: node.slot,
                    nodes: []
                };
                layoutData.optos.push( opto );
            }
            opto.nodes.push( node );
        });
        //add the isLast flag to the last node of every opto
        _.each( layoutData.optos, function ( opto ) {
            _.last( opto.nodes ).isLast = true;
        });
        Handlebars.replaceTemplate( '#ola-template', layoutData );
        //ok now that the template is built up, fill it with the information about the nodes and optos
        getRows();
    }
});
