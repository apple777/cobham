#!/usr/bin/env wsapi.cgi
---This file contains definitions for target commands specific to RRU
---This file is loaded from target symlink in target web directory and 
---the list of functions defined in this file is added to lua environment
require "reqres"
require "libTarget_applua"

function defineCommand ( command, handler )
	if type(handler)=="function" then
		validCommands[command:lower()]=handler
	end
end

defineCommand('rrustatus',function (params)
   return runbin('/usr/sbin/axell/common/current/cmd/alarms '.. 'status --json')
end)

defineCommand('rflevels',function (params)
   csv=splitQ(params)
	return appTargetAs.rflevels(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('cellres',function (params)
   csv=splitQ(params)
	return appTargetAs.cellres(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('bands',function (params)
   csv=splitQ(params)
	return appTargetAs.bands(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('enable_streams', function (params)
    csv=splitQ(params)
	return appTargetAs.enable_streams(getEnv("REMOTE_USER"),unpack(csv))
end)

defineCommand('enable_routings', function (params)
    csv=splitQ(params)
	return appTargetAs.enable_routings(getEnv("REMOTE_USER"),unpack(csv))
end)

--- the sync_cellre_sdr command
defineCommand('sync_cellres_sdr', function (params)
	return runbin('/usr/sbin/axell/target/current/sys/sync_cellres_sdr '..params)
end)

--- the sync_cellre_sdr command
defineCommand('operators', function (params)
	csv=splitQ(params)
	return appTargetAs.operators(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('enable_routings',function ( params )
  return runbin('/usr/sbin/axell/target/current/cmd/enable_routings '..params)
end)

defineCommand('update_credentials',function ( params )
  return runbin('/usr/sbin/axell/target/current/sys/update_credentials '..params)
end)

defineCommand('sync_rf_from_master',function ( params )
  return runbin('/usr/sbin/axell/target/current/sys/sync_rf_from_master '..params)
end)

defineCommand('deactivate_sfp',function (params)
	return runbin('/usr/sbin/axell/target/current/cmd/deactivate_sfp '..params)
end)


