$( '.nothing-to-show' ).hide();

/*
 Simulation data:

 {"nodesw":"'0' 'AMLM' '1' '-' '' '-' '-' 'OMU-MkII-M' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"OMU 2.1.2.19\"' '' 'READY'\n'1' 'R5S1' '-' '1' 'ACTIVE' '1' '1' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'2' 'R5S2' '-' '1' 'ACTIVE' '1' '2' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'3' 'R5S3' '-' '1' 'ACTIVE' '1' '3' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'4' 'R6S1' '-' '1' 'ACTIVE' '1' '5' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'5' 'R6S2' '-' '1' 'ACTIVE' '1' '5' 'BSF3604-S' 'Repeater - Site Name' '\"2.0.6\" \"2.2.3.27\" \"BSF3604 2.0.1.31\"' '' 'READY'\n'6' 'ALSU' '0' '0' '' '1' '5' 'MBF-20-D-2307-2317-S' 'New F-DAS unit' 'SW03910AX9 -' '' 'READY'","get ola 1:1":"0 123304 070213 123355 070213 25 25 -31.7 2 \"Pilot tone adjusted to -31.7 dBm, procedure completed.\"","get ola 1:2":"0 100316 070213 100318 070213 25 25 -33.4 0 \"Pilot tone adjusted to -33.4 dBm, procedure completed.\"","get ola 1:3":"0 100329 070213 100331 070213 25 25 -32.2 0 \"Pilot tone adjusted to -32.2 dBm, procedure completed.\"","get ola 1:5":"0 100342 070213 100342 070213 25 25 -31.3 0 \"Pilot tone adjusted to -31.3 dBm, procedure completed.\"","@R5S3 get ola":"0 100410 070213 100435 070213 25 22 -31.7 1 \"Pilot tone adjusted to -31.7 dBm, procedure completed.\"","@R5S2 get ola":"0 100410 070213 100435 070213 25 22 -31.7 1 \"Pilot tone adjusted to -31.7 dBm, procedure completed.\"","@ALSU get ola":"0 100410 070213 100435 070213 25 22 -31.7 1 \"Pilot tone adjusted to -31.7 dBm, procedure completed.\"","@R6S2 get ola":"0 100410 070213 100435 070213 25 22 -31.7 1 \"Pilot tone adjusted to -31.7 dBm, procedure completed.\"","@R6S1 get ola":"0 100410 070213 100435 070213 25 22 -31.7 1 \"Pilot tone adjusted to -31.7 dBm, procedure completed.\"","@R5S1 get ola":"0 100410 070213 100435 070213 25 22 -31.7 1 \"Pilot tone adjusted to -31.7 dBm, procedure completed.\"","get fds 6 RFSETUP CONFIG 1":"1 2 3 4","get fds 6 RFSETUP CONFIG 2":"5 6 7 8","get fds 6 RFSETUP STATUS 1":"0 120000 130212 120100 130212 10 20 30 40 50 60 \"An status message\"","get fds 6 RFSETUP STATUS 2":"0 120000 130212 120100 130212 70 80 90 100 110 120 \"Another status message\"","act fds 6 RFSETUP START 1":" "}

 */

var mdlProcessor = (function () {

    //** These constants are used for resolving the strings in MDL to the frequencies in MHz
    var MDL_FREQ = {
        '07': '700',
        '08': '850',
        '09': '900',
        '17': '1700',
        '18': '1800',
        '19': '1900',
        '21': '2100',
        '22': '2200',
        '26': '2600'
    }

    var MDL_UL = {
        'U': 'Upper',
        'L': 'Lower'
    }

    /* Spec:
     Reply for dual band units:
     MBF-20-D-<PowerRange1><Band1>[SubBand1]-<PowerRange2><Band2>[SubBand2]-S
     MBF-20-Q-<PowerRange1><Band1>[SubBand1]-<PowerRange2><Band2>[SubBand2][-<PowerRange3><Band3>[SubBand3]-<PowerRange4><Band4>[SubBand4]]-S
     */
    var mbf20dRegexp = /^MBF-20-D-(\d\d)(\d\d)(\w?)-(\d\d)(\d\d)(\w?)-S/i;
    var mbf20qRegexp = /^MBF-20-Q-(\d\d)(\d\d)(\w?)-(\d\d)(\d\d)(\w?)-(\d\d)(\d\d)(\w?)-(\d\d)(\d\d)(\w?)-S/i;

    function bandObject( nodeNumber, bandNumber, powerRange, band, subBandChar ) {
        return {
            nodeNumber: nodeNumber,
            bandNumber: bandNumber,
            powerRange: powerRange,
            frequency: MDL_FREQ[ band ] || '?',
            subBand: MDL_UL[ subBandChar.toUpperCase() ] || '',
            name: MDL_FREQ[ band ] + subBandChar
        }
    }

    //** processes the mdl to and returns information about the bands. Returns null if this is not a MBF20 node.
    function mdlProcessor ( nodeNumber, mdl ) {

        var parts = mdl.match( mbf20dRegexp );
        if ( parts ) {
            return [
                bandObject( nodeNumber, 1, parts[1], parts[2], parts[3] ),
                bandObject( nodeNumber, 2, parts[4], parts[5], parts[6] )
            ];
        } else {
            parts = mdl.match( mbf20qRegexp );
            if ( parts ) {
                return [
                    bandObject( nodeNumber, 1, parts[1], parts[2], parts[3] ),
                    bandObject( nodeNumber, 2, parts[4], parts[5], parts[6] ),
                    bandObject( nodeNumber, 3, parts[7], parts[8], parts[9] ),
                    bandObject( nodeNumber, 4, parts[10], parts[11], parts[12] )
                ];
            }
        }

        //couldn't parse the mdl with any of the regular expressions
        return null;
    }

    return mdlProcessor;
})();

//** does the actual RF Adjustment
function doRfa () {
    /* Algorithm:
    1. find the first row with a checked checkbox. If there is no more such row, exit
    2. mark it as 'in-progress'
    3. Start RFA
    4. Poll for RFA status and update the row until it is finished
    5. Unmark the row as 'in-progress'
    6. Go to step 1 and find the next row
     */

    //1. find the first row with a checked checkbox. If there is no more such row, exit
    var $tr = $( '.rfa-cbx:checked' ).parents( 'tr').first();
    if ( $tr.length === 0 ) {
        console.log( 'Nothing is selected. No adjustment will be done.' );
        return;
    }
    //2. mark it as 'in-progress'
    console.log( 'RFA in progress' );
    $tr.addClass( 'in-progress' );
    setButtonEnDis( '#adjust-btn', false );
    var nodeNumber = $tr.attr( 'data-node-number' );
    var bandNumber = $tr.attr( 'data-band-number' );
    $tr.find( '.rfa-cbx:checked' ).prop( 'checked', false );

    //3. Start RFA
    ax.api.exe({
        cmd: 'act fds ' + nodeNumber + ' RFSETUP START ' + bandNumber,
        onSuccess: function ( o ) {

            //4. Poll for RFA status and update the row until it is finished
            ax.api.exe({
                cmd: 'get fds ' + nodeNumber + ' RFSETUP STATUS ' + bandNumber,
                interval: 5000,
                parser: rfsetupStatusParser,
                onSuccess: function ( o ) {
                    if ( 'status' in o.parsedResults && o.parsedResults.status !== '2' ) {
                        //when the status is '2', it means the RFA is still in progress
                        processRfsetupStatus( $tr, o.parsedResults );
                        console.log( 'RFA is no more in progress' );
                        //5. Unmark the row as 'in-progress'
                        $tr.removeClass( 'in-progress' );
                        setButtonEnDis( '#adjust-btn', true );
                        delete o.interval;
                        //6. Go to step 1 and find the next row
                        doRfa();
                    }
                }
            });

        },
        onError: function ( o ) {
            console.error( 'Failed to start RF Adjustment: ' + o.errorThrown );
            //5. Unmark the row as 'in-progress'
            $tr.removeClass( 'in-progress' );
            setButtonEnDis( '#adjust-btn', true );
        }
    });
};

//processes the configuration that is returned as a result of the GET FDS RFSETUP CONFIG command
function processRfsetupConfig ( $tr, results ) {
    $tr.find( '.nominal-level-select' ).val( results.nominalPowerDelta );
    $tr.find( '.uplink-delta-select' ).val( results.ulDelta );
    $tr.attr( 'data-lower-threshold', results.lowerThreshold );
    $tr.attr( 'data-upper-threshold', results.upperThreshold );
}

//the parser that is used to parse the output of the rfsetup status command
var rfsetupStatusParser = new ax.Parser([
    'dash:-',
    'status:c startTime:t startDate:d stopTime:t stopDate:d initDlAtten:n resDlAtten:n ' +
        'ulDelta:n resOutputPower:n nAttenIter:n nSatIter:n resStr:Q'
]);

//processes the status information that is returned as the result of the GET FDS RFSETUP STATUS command
function processRfsetupStatus ( $tr, results ) {
    setLedColor( $tr.find('.status-led'), results.status );
    $tr.find('.downlink-attenuation-val').text( results.resDlAtten );
    $tr.find('.output-power-level-val').text( results.resOutputPower || '-' );
    $tr.find('.status-cell').text( results.resStr );
    $tr.find('.time-date-val').text( results.stopDate + ' ' + results.stopTime );
}

//update the tables row-by-row.
function updateData() {
    /*
     output power level can be read from (FDS SLV - Compact message with snapshot levels)
     downlink attenuation is read from FDS ATD
     nominal level is read from FDS PDN (the value is already multiplied by 10 to make it integer)
     setting the parameters is done via FDS RFSETUP CONFIG command
     */

    $('.node-panel').each(function () {

        var $nodePanel = $(this);
        var nodeNumber = $nodePanel.attr('data-node-number');
        $('.band-row', $nodePanel).each(function () {
            var $bandRow = $(this);
            var bandNumber = $bandRow.attr('data-band-number');
            //get the minimal level, uplink delta, lower and upper thresholds from RFSETUP CONFIG
            ax.api.exe({
                cmd:'get fds ' + nodeNumber + ' RFSETUP CONFIG ' + bandNumber,
                parse:'nominalPowerDelta:n ulDelta:n lowerThreshold:n upperThreshold:n',
                onSuccess:function (o) {
                    processRfsetupConfig( $bandRow, o.parsedResults );
                }
            });
            /*
             all the other things from RFSETUP STATUS
             <Status>
             <Start Time>
             <Start Date>
             <Stop Time>
             <Stop Date>
             <Initial DL Attenuation>
             <Resulting DL Attenuation>
             <UL Delta>
             <Resulting Output Power>
             <NumberOfAttenuationIterations>
             <NumberOfSaturationIterations>
             <Result String>
             */
            ax.api.exe({
                cmd:'get fds ' + nodeNumber + ' RFSETUP STATUS ' + bandNumber,
                parse:'status:c startTime:t startDate:d stopTime:t stopDate:d initDlAtten:n resDlAtten:n ' +
                    'ulDelta:n resOutputPower:n nAttenIter:n nSatIter:n resStr:Q',
                onSuccess:function ( o ) {
                    processRfsetupStatus( $bandRow, o.parsedResults );
                }
            });
        });
    });
}

//event handler for when the select all button is clicked
$( '#select-all-btn' ).click( function () {
    $( ':checkbox' ).prop( 'checked', true );
});

//event handler for when the select none button is clicked
$( '#select-none-btn' ).click( function () {
    $( ':checkbox' ).prop( 'checked', false );
});

//event handler for when the adjust button is clicked
$( '#adjust-btn' ).click( function () {
    doRfa();
});

//get the list of nodes and find the FDAS nodes from it (because only FDAS nodes have RFA). Then draw the page.
ax.api.exe({
    cmd: 'nodesw',
    parse: 'number serial status comm mode:q rack slot mdl:q tag:q versions:q description:q state',
    onSuccess: function () {
        //process the list of nodes and remove the ones that don't contain any FDAS units. Besides assign the bands property to nodes too.
        var nodesWithFdas = _.filter( this.parsedResults, function ( node ) {
            var bands = mdlProcessor( node.number, node.mdl );
            if ( bands ) {
                node.bands = bands;
                return true;
            } else {
                return false;
            }
        });

        if ( nodesWithFdas.length === 0 ) {
            $( '.nothing-to-show' ).show();
        } else {
            console.log( 'Nodes with MBF-20 connected to them (and augmented with data from MDL parsing): ' + JSON.stringify( nodesWithFdas ) );
            var template = Handlebars.compile( $( '#layout').html() );
            $( '#layout' ).remove();
            $( '.pagecontainer' ).append( template( nodesWithFdas ) );
            updateData();
        }
    },
    onError: function () {
        $( '.nothing-to-show' ).show();
    }
});

