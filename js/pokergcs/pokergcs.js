pokergcs = {};

// Anonymous function to load the pokergcs Classes into the pokergcs Namespace.
(function() {
    var scriptName = "pokergcs.js";
    
    // Get the location of this script (e.g., "/js/pokergcs/")
    // Adapted from OpenLayers 2.11
    var r = new RegExp("(^|(.*?\\/))(" + scriptName + ")(\\?|$)"),
        s = document.getElementsByTagName('script'),
        src, m, l = "";
    for(var i=0, len=s.length; i<len; i++) {
        src = s[i].getAttribute('src');
        if(src) {
            var m = src.match(r);
            if(m) {
                l = m[1];
                break;
            }
        }
    }
    
    var jsFiles = [
        "GUI.js",
        "Map.js",
        "Waypoint.js",
    ];
    
    // use "parser-inserted scripts" for guaranteed execution order
    // http://hsivonen.iki.fi/script-execution/
    // Adapted from OpenLayers 2.11
    var scriptTags = new Array(jsFiles.length);
    var host = l;
    for (var i=0, len=jsFiles.length; i<len; i++) {
        scriptTags[i] = "<script src='" + host + jsFiles[i] +
                               "'></script>"; 
    }
    if (scriptTags.length > 0) {
        document.write(scriptTags.join(""));
    }
})();

dojo.ready(function() {
    // init
    pokergcs.map = new pokergcs.Map();
    pokergcs.GUI.initPayload();
    pokergcs.GUI.initWindowResizeEvent();
    pokergcs.GUI.initMapZoomInOut();
    
    // do more stuff, non init
    pokergcs.GUI.resizeZoomBarLevels();
});
