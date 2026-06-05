#!/usr/bin/env wsapi.cgi

module(..., package.seeall)

require 'wsapi.request_stream'
require 'wsapi.response'
require 'ltn12'


function run(wsapi_env)
  local request = wsapi.request_stream.new(wsapi_env)
  local response = wsapi.response.new(200, { ["Content-Type"]= "text/plain" })
  fullFileName = '/tmp/upload'
  local file_sink, err = ltn12.sink.file( io.open(fullFileName, "wb") )
  if not file_sink then
    response.status = 500
    response:write("Unable to save file to disk")
    return response:finish()
  end
  --  o Table containing decoded (name, file) and raw (headers) mime header data
  --  o String value containing a chunk of the file data
  --  o Boolean which indicates wheather the current chunk is the last one (eof)
  local readBytes = 0
  local mimeHeaders
  local callback = function( headers, chunk, last )
    if not mimeHeaders then
      mimeHeaders = headers
    end
    readBytes = readBytes + #chunk
    file_sink(chunk)
    if last then
      file_sink(nil)
    end
  end
  request:parse_message_body( callback )
  os.execute('rm /tmp/*.tar.z')
  os.execute('mv /tmp/upload /tmp/'..request.params.firmware)
  response:write(tostring(readBytes))
  return response:finish()
end

