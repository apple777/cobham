define([ '/js/lib/jquery.js' ], function ( $ ) {

    //** the width (or height) of one icon
    var ICON_SIZE = 20;
    var BAND_ICON_SIZE = 25;
    var BAND_ICON_HEIGHT = 15;
    var isIncluded = false;

    //** all icon names are defined here according to their row and column order from icons.ai (Adobe Illustrator) vector file
    var LIST_OF_ICONS = [
        //row 0
        ['', 'error', 'info', 'warning', 'help', 'ok', 'ok_disabled' ],
        //row 1
        ['setting_small', 'error2', 'info2', 'warning2', 'help2' ],
        //row 2
        ['status_tabicon', 'systemnodes', 'configuration_tabicon', 'alarms_tabicon', 'logs_tabicon', 'terminal_tabicon', 'home-link-icon', 'nodes-link-icon', 'logs-link-icon', 'system-information-link-icon', 'external-alarms-link-icon', 'password-link-icon', 'date-and-time-link-icon','snmp-link-icon','route-setup-icon','sector-icon','rfsettings-icon','access_control','user_admin','preferences' ],
        //row 3
        ['refresh', 'newwindow', 'maximize', 'minimize', 'status', 'close', 'ethernet-link-icon', 'communication-link-icon', 'axell-shell-link-icon', 'reboot-link-icon', 'alarm-thresholds-link-icon', 'about-link-icon', 'logout-link-icon', 'help-link-icon', 'freq-center-white', 'freq-span-white', 'freq-start-white', 'freq-stop-white','statistic','backup_restore', 'maximize2', 'minimize2'],
        //row 4
        ['upload', 'reboot', 'toolbar-back', 'toolbar-refresh', 'toolbar-help', 'flag.green', 'flag.yellow', 'flag.red', 'unknown', 'add', 'remove', '', 'zoom-in', 'zoom-out', 'zoom-reset', 'uplink-white', 'downlink-white', 'save-white', 'left-white', 'right-white' ],
        //row 5
        ['attenuation', 'rack_antenna', 'antenna1', 'antenna2', '', 'logout', 'edit', 'externalalarm', 'controller', 'circuitboard', 'trigger-high', 'trigger-low', 'current-peak', 'peak-hold-diagram', 'clear-peak-hold-data', 'raster-wave','slide-in','slide-out','sectgrp','zone' ],
        //row 6
        ['uplink', 'downlink', 'laser', 'commux', 'apply', 'communication', 'temperature', 'firmware', 'leftrightarrow', 'updownarrow', 'duck', 'mimo', 'mimo_buddy','highlighted_mimo_buddy','filter','apoi','rfnominal','rack-white' ],
        //row 7
        ['uparrow', 'downarrow', 'leftarrow', 'rightarrow', 'input', 'output', 'splitter', 'combiner', 'levelcontrol', 'pointofinterface', 'roundtrip', 'roundtrip.r0', 'roundtrip.r1', 'roundtrip.r2', 'roundtrip.r3', 'roundtrip.r4', 'roundtrip.r5','clock','clock-white','recovered-clock-white' ],
        //row 8
        ['power', 'power1', 'power2', 'power3', 'power4', 'power5', 'power6', 'power7', 'power8', 'showhidehelp', 'userdemote','m-up','s-up','m-init','s-init','m-down','s-down','m-err','s-err','linkstate'],
        //row 9
        ['nobattery', 'batteryfull', 'batteryhalf', 'batteryempty', 'batterycharging', 'battery', 'battery2', 'expandall', 'collapseall', 'collapseexpand', 'relay', 'aem', 'acknowledge', 'acknowledge-all','install','switch','activity','activity-white','clock-link','clock-hops' ],
        //row 10
        ['rack_psu1', 'rack_psu2', 'stop', 'noentry', 'rack', '', 'separator1', 'separator2', 'backarrow', 'forwardarrow', 'below-nominal', 'above-nominal', 'send-alarm','','','','switch1','switch2','processor','ethernet'],
        //row 11
        ['rxopto', 'txopto', 'greenprompt', 'nodes', 'number', 'optolossadjustment', 'communicationled.off', 'communicationled.sending', 'communicationled.processing', 'communicationled.error','powerinput', '','current1','current2','init','down','up','view','magnifying_glass' ],
        //row 12
        ['rack_communication', 'rack_firmware', 'rack_temp', 'rack_power', 'rack_power1', 'rack_power2', 'rack_power3', 'rack_power4', 'rack_power5', 'rack_power6', 'rack_battery', 'prompt','capacity','remote','remote-power','system-mute','user-mute','adc','dac' ],
        //row 13
        ['ext1', 'ext2', 'ext3', 'ext4', 'rack_backuppower', 'unlock', 'lock', 'tag', 'id', 'model','sector_config','scheduler','dsp-over-capacity','cpri-over-capacity','mimo-conflict','overlap-conflict','rf-conflict' ],
        //row 14
        ['logs_critical', 'logs_major', 'logs_minor', 'logs_warning', 'logs_indeterminate', 'logs_cleared','loading-white','','','','operator','location','ip','software-version','operator-white','m-lost','s-lost','m-estb','s-estb' ],
        //row 15
        ['saturation', 'amplifier', 'rfadjust', 'rfadjustbtn', '', 'pilotsynth', 'pilotsynthreceived', 'attribute_r', 'attribute_w', 'attribute_x','redcross','vswr','map','add-map','setting','setting-changed' ],
        //row 16
        ['radio', 'mutedradio', 'door', 'rcvquality', 'amplifierpower', 'ola', 'alarm', 'olacompensation', 'mcpa', '', 'rfa','deactivated' ],
        //row 17
        ['axelllogocolor', 'axelllogogrey', 'advancedmode', 'basicmode', 'first', 'previous', 'next', 'last', 'clear', 'save', 'radio-white', 'rf-input', 'rf-output' ],
        //row 18
        ['unused', 'used', 'unchecked', 'checked', 'select-all', 'unselect-all', 'noise', 'popup-close', 'freq-range', 'synth', 'freq-center', 'freq-span', 'freq-start', 'freq-stop' ],
        //row 19
        ['saturation-no', 'saturation-yes', 'saturation-error', 'gain', 'radio-board', 'return-loss', '', 'satval', 'autocomplete', 'type', 'specanalyzer-white' ],
        //row 20
        ['saturation-off', 'door-white', 'rcvquality-white', 'rack_commux', 'editwhite', 'unlock-white', 'lock-white', 'more', 'less', 'license-white', 'license-hw-white', 'license', 'license-hw', 'specanalyzer' ]
    ];
    var BAND_TECH_ICON=['GSM','LTE','WCDMA'];

    /**
     * creates all the icon positioning rules that are going to be put in the stylesheet
     * @return {string} the textual representation of CSS selectors needed for icons
     */
    function generateStyleSheet () {
        var ret = '.icon{ width:' + ICON_SIZE + 'px;height:' + ICON_SIZE + 'px; } /*general icon size*/';
        for( var r = 0; r < LIST_OF_ICONS.length; r++ ) {
            for( var c = 0; c < LIST_OF_ICONS[ r ].length; c++ ) {
                var iconName = LIST_OF_ICONS[ r ][ c ];
                if ( iconName ) {
                    ret += '.icon.' + iconName + '{ background-position: ' + ( c * -ICON_SIZE ) + 'px ' + ( r * -ICON_SIZE ) + 'px; } /*r' + r + ', c' + c + '*/\n';
                }
            }
        }
        ret +='.band_icon{ width:' + BAND_ICON_SIZE + 'px;height:' + BAND_ICON_HEIGHT + 'px; } /*band icon size*/';
        var r =0;
        for( var c = 0; c < BAND_TECH_ICON.length; c++ ) {
            var iconName = BAND_TECH_ICON[ c ];
            if ( iconName ) {
                ret += '.band_icon.' + iconName + '{ background-position: ' + ( c * -BAND_ICON_SIZE ) + 'px ' + ( r * -BAND_ICON_SIZE ) + 'px; } /*r' + r + ', c' + c + '*/\n';
            }
        }
        return ret;
    }

    //** add the icons to the current page
    function addToPage () {
        if ( !isIncluded ) {
            $( '<style type="text/css">' + generateStyleSheet() + '</style>' ).appendTo( 'head' );
            isIncluded = true;
        }
    }

    return {
        addToPage : addToPage
    }
});