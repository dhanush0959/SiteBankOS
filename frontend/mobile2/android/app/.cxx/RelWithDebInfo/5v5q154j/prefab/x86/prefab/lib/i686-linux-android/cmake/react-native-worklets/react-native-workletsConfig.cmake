if(NOT TARGET react-native-worklets::worklets)
add_library(react-native-worklets::worklets SHARED IMPORTED)
set_target_properties(react-native-worklets::worklets PROPERTIES
    IMPORTED_LOCATION "C:/Projects/SiteBank/node_modules/react-native-worklets/android/build/intermediates/cxx/RelWithDebInfo/4b1c4o2r/obj/x86/libworklets.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Projects/SiteBank/node_modules/react-native-worklets/android/build/prefab-headers/worklets"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

