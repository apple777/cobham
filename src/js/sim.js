define( function () {
    //the key that is used to save the simulation data in localStorage
    var SIMULATION_KEY = 'sim.js:simulationData';

    //the simulation data is an object with commands as keys and results as values
    var simulationData = {};

    //** loads the simulation data from localStorage
    if ( localStorage[ SIMULATION_KEY ] ) {
        simulationData = JSON.parse( localStorage[ SIMULATION_KEY ] );
    }

    //** saves the simulation data in localStorage
    function save () {
        localStorage[ SIMULATION_KEY ] = JSON.stringify( simulationData );
    }

    //** adds a new pair of command, result to the simulation data. if the command exists, it updates the result
    function add ( command, result ) {
        if ( typeof command !== 'string' || command ==='' || typeof result !== 'string' ) {
            throw new Error( 'simulator.1: Both command and result should be strings and command should not be ' +
                'an empty string' );
        }
        simulationData[ command ] = result;
        save();
    }

    //** removes a command from the simulator
    function remove ( command ) {
        delete simulationData[ command ];
        save();
    }

    //** updates a command in the simulator
    function update ( oldCommand, newCommand, newResult ) {
        remove( oldCommand );
        add( newCommand, newResult );
    }

    //** gets the result for a specific command. If there is no result, it returns undefined
    function getResult ( command ) {
        return simulationData[ command ];
    }

    //** checks if the command exists in the current simulator
    function isSimulated ( command ) {
        return simulationData[ command ] ? true : false;
    }

    //** empties the simulation data table
    function empty () {
        simulationData = {};
        save();
    }

    //** returns an array of commands. if there is no command, returns an empty array
    function getCommands () {
        var ret = [];
        for ( var command in simulationData ) {
            ret.push( command );
        }
        ret.sort();
        return ret;
    }

    //** returns the savable data in JSON format
    function download () {
        return JSON.stringify( simulationData );
    }

    //** tris to convert the text as JSON and save it. If it can't save, it will throw a JSON error
    function upload ( text ) {
        //try parsing the text. it it fails, the simulationData will be untouched an an exception will be thrown
        simulationData = JSON.parse( text );
        save();
    }

    return {
        add:add,
        remove:remove,
        update:update,
        getResult:getResult,
        isSimulated:isSimulated,
        empty:empty,
        getCommands:getCommands,
        download:download,
        upload:upload
    }
});