#!/usr/bin/env wsapi.cgi
---This file contains definitions for target commands specific to MSDH
---This file is loaded from target simlink in target web directory and 
---the list of functions defined in this file is added to lua environment
require "reqres"
require "libTarget_applua"

function defineCommand ( command, handler )
	if type(handler)=="function" then
		validCommands[command:lower()]=handler
	end
end

defineCommand('prepare_shard',function ( params )

   os.execute('/usr/sbin/axell/target/current/tests/prepare_shard > /tmp/log/prepare_shard.log &')
   return "Preparing Shard demo, the Shard will be ready in 5 minutes."
end)

--- the filterdump command (for BSR)
defineCommand('filterdump', function (params)
   return runbin('/usr/sbin/axell/target/current/cmd/filterdump '..params)
end)

---for retrieving filters quota                                      
defineCommand('filter_quota',function ( params )
    return runbin('/usr/sbin/axell/target/current/cmd/filter_quota '..params)
end)                  
                                                                                  
---for retrieving cpri quotas
defineCommand('cpri_quota',function ( params )
    return runbin('/usr/sbin/axell/target/current/cmd/cpri_quota '..params)
end)

defineCommand('node_registration', function (params)
    csv=splitQ(params)
	return appTargetAs.node_registration(getEnv("REMOTE_USER"),unpack(csv))
end)

defineCommand('portmap_registration', function (params)
    csv=splitQ(params)
	return appTargetAs.portmap_registration(getEnv("REMOTE_USER"),unpack(csv))
end)

defineCommand('enable_streams', function (params)
    csv=splitQ(params)
	return appTargetAs.enable_streams(getEnv("REMOTE_USER"),unpack(csv))
end)

defineCommand('enable_routings', function (params)
    csv=splitQ(params)
	return appTargetAs.enable_routings(getEnv("REMOTE_USER"),unpack(csv))
end)

defineCommand('rfranges_registration', function (params)
	return runbin('/usr/sbin/axell/target/current/sys/rfranges_registration '..params)
end)

defineCommand('refresh_connections', function (params)
        return runbin('/usr/sbin/axell/target/current/misc/refresh_connections'..params)
end)

--- posting a node's status inside MSDH-M
defineCommand('statuspost', function (params)
	return runbin('/usr/sbin/axell/target/current/sys/statuspost '..params)
end)

defineCommand('zone',function (params)
    csv=splitQ(params)
    return appTargetAs.zone(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('topology',function (params)
    csv=splitQ(params)
    return appTargetAs.topology(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('opaccess',function (params)
   csv=splitQ(params)
	return appTargetAs.opaccess(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('cellres',function (params)
   csv=splitQ(params)
	return appTargetAs.cellres(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('technologies',function (params)
   csv=splitQ(params)
	return appTargetAs.technologies(getEnv("REMOTE_USER"),unpack(csv))
end)

defineCommand('sector',function (params)
   csv=splitQ(params)
	return appTargetAs.sector(getEnv("REMOTE_USER"),unpack(csv))
end)

defineCommand('bands',function (params)
   csv=splitQ(params)
	return appTargetAs.bands(getEnv("REMOTE_USER"), unpack(csv))
end)

--defineCommand('rfroute',function (params)
--   csv=splitQ(params)
--	return appTargetAs.rfroute("sysadmin", unpack(csv)) --getEnv("REMOTE_USER")
--end)

defineCommand('rfroute',function (params)                           
   csv=splitQ(params)                           
        return runbin('/bin/nice -n -14 /usr/sbin/axell/target/current/cmd/rfroute '..params)       
end)   

--defineCommand('add_route_to_rcd_queue',function (params)
 --  csv=splitQ(params)
--	return appTargetAs.add_route_to_rcd_queue("sysadmin", unpack(csv)) --getEnv("REMOTE_USER")
--end)

defineCommand('add_route_to_rcd_queue',function (params)
    csv=splitQ(params)
    return runbin('/mnt/axell/sbin/target/current/cmd/add_route_to_rcd_queue '..params)
end)

defineCommand('rfnominal',function (params)
    csv=splitQ(params)
    return appTargetAs.rfnominal(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('connections',function (params)
   csv=splitQ(params)
	return appTargetAs.connections(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('rfranges',function (params)
   csv=splitQ(params)
	return appTargetAs.rfranges(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('operators',function (params)
    csv=splitQ(params)
    return appTargetAs.operators(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('sectgrp',function (params)
    csv=splitQ(params)
    return appTargetAs.sectgrp(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('opranges',function (params)
    csv=splitQ(params)
    return appTargetAs.opranges(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('mimobuddy',function (params)
    csv=splitQ(params)
    return appTargetAs.mimobuddy(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('libluatest',function (params)
    csv=splitQ(params)
    return appTargetAs.libluatest(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('filterquota',function (params)
    csv=splitQ(params)
    return appTargetAs.filterquota(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('cpriquota',function (params)
    csv=splitQ(params)
    return appTargetAs.cpriquota(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('opset',function (params)
    csv=splitQ(params)
    return appTargetAs.opset(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('msdhstatus',function (params)
    csv=splitQ(params)
    return appTargetAs.msdhstatus(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('rack',function (params)
    csv=splitQ(params)
    return appTargetAs.rack(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('rfschedule',function (params)
    csv=splitQ(params)
    return appTargetAs.rfschedule(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('rf_quota',function (params)
    csv=splitQ(params)
    return appTargetAs.rf_quota(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('freqblocks',function (params)
    csv=splitQ(params)
    return appTargetAs.freqblocks(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('maclookup',function ( params )
   return runbin('/usr/sbin/axell/target/current/cmd/maclookup '..params)
end)

---for retrieving profile schedules
defineCommand('profschedule',function ( params )
  return runbin('/usr/sbin/axell/target/current/cmd/profschedule '..params)
end)

defineCommand('apoi',function ( params )
  return runbin('/usr/sbin/axell/target/current/cmd/apoi '..params)
end)

defineCommand('node',function (params)
    csv=splitQ(params)
    return appTargetAs.node(getEnv("REMOTE_USER"), unpack(csv))
end)

defineCommand('opadd',function ( params )
  return runbin("su " .. username() .. " -s /bin/sh -c \'/usr/sbin/axell/target/current/cmd/opadd "..params.."\'")
end)

defineCommand('opdel',function ( params )
  return runbin("su " .. username() .. " -s /bin/sh -c \'/usr/sbin/axell/target/current/cmd/opdel "..params.."\'")
end)

defineCommand('enable_routings',function ( params )
  return runbin('/usr/sbin/axell/target/current/cmd/enable_routings '..params)
end)

defineCommand('clear_routing_alarm',function ( params )
  return runbin('/usr/sbin/axell/target/current/cmd/clear_routing_alarm '..params)
end)

defineCommand('credstat',function ( params )
  return runbin('/usr/sbin/axell/target/current/sys/credstat '..params)
end)

defineCommand('update_credentials',function ( params )
  return runbin('/usr/sbin/axell/target/current/sys/update_credentials '..params)
end)

defineCommand('deactivate_sfp',function (params)
	return runbin('/usr/sbin/axell/target/current/cmd/deactivate_sfp '..params)
end)

defineCommand('factory_reset_msdh',function (params)
    csv=splitQ(params)
    return runbin('/usr/sbin/axell/target/current/sys/factory_reset '..params)
end)

defineCommand('rfmeasurement',function (params)
    return runbin('/usr/sbin/axell/target/current/cmd/rfmeasurement '..params)
end)

defineCommand('change_serials_opers',function (params)
    return runbin('/usr/sbin/axell/target/current/cmd/change_serials_opers.sh '..params)
end)

defineCommand('delete_serials_opers',function (params)
    return runbin('/usr/sbin/axell/target/current/cmd/delete_serials_opers.sh '..params)
end)


