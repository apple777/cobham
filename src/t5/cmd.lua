#!/usr/bin/env wsapi.cgi
---This file contains definitions for target commands specific to MSDH
---This file is loaded from target simlink in target web directory and 
---the list of functions defined in this file is added to lua environment
require "reqres"
require "utils"
require "libapplua"
require "libAxshLua"
require "libavilua"
require "socket"
axsh.init()

function defineCommand ( command, handler )
	if type(handler)=="function" then
		validCommands[command:lower()]=handler
	end
end

--- the filterdump command (for BSR)
defineCommand('filterdump', function (params)
   return runbin('/usr/sbin/axell/target/current/cmd/filterdump '..params)
end)

--This is the faster version of alarmconfig --weblayout
defineCommand('pictalk',function (params)
   csv=splitQ(params)
	return app.pictalk(unpack(csv))
end)

defineCommand('picnames', function (params)
   local ser=""
   local serials=""
   for i=1,4 do
      ser=avi.fw_read_string("/etc/opt/axell/common/current/serials.conf","CORB"..i,5):match("^%w%w%w%w") or ""
      serials=serials..i..":"
      if(ser and ser ~= "")then
         serials=serials..ser..((i<4) and " " or "")
      else
         serials=serials..((i<4) and " " or "")
      end
   end
	return serials
end)
