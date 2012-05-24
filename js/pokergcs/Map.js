/**
 * Class: Map
 *
 * Manipulates the map.
 */
pokergcs.Map = Class({
    /**
     * Property: map
     * Hold the OpenLayers map object
     */
    map: null,
    
    /**
     * Constructor
     */
    initialize: function() {
        this.map = new OpenLayers.Map({
            div: "appLayoutMap",
            theme: null,
            controls: [
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.TouchNavigation({
                  dragPanOptions: {
                      enableKinetic: true
                  }
                }),
                new OpenLayers.Control.ZoomPanel()
            ],
            layers: [
                new OpenLayers.Layer.OSM("OpenStreetMap", null, {
                  transitionEffect: "resize"
                })
            ],
            center: new OpenLayers.LonLat(0, 0),
            zoom: 1
        });
        
        pokergcs.GUI.setGUIZoomBarLevel(this.map.zoom);
    },
});