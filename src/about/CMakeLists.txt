project(PICTALK)
set(BINARY "pictalk" CACHE INTERNAL "The name of the binary" FORCE)
set(VERSION "2.0.0" CACHE INTERNAL "The version" FORCE)


include(${H40_SOURCE_DIR}/cf/minifyJS.cmake)
set( JSSRCS 
     code
   )

 minifyJS( ${VERSION} "${JSSRCS}" )
