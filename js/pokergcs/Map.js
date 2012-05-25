/**
 * File: Map.js
 * Author: Jonathan Sawyer
 * Copyright: 2012, Poker Flat Research Range, University of Alaska Fairbanks
 * License: MIT License
 */

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
        // This map is for development purposes only -- don't worry about the
        // minute details of this yet. We will be creating our own mapping
        // solution when the time comes to fulfill the no-Internet requirement.
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
            // our coordinate system is the spherical mercator projection 
            center: new OpenLayers.LonLat(-16443720.03533, 9566079.5380357),
            zoom: 4
        });
        
        // Events //////////////////////////////////////////////////////////////
        
        this.map.events.register('zoomend',
                                 this.map.events,
                                 this.zoomendEvent)
        
        // Final initialization ////////////////////////////////////////////////
        
        // Since the map never zooms in or out, we must set the zoom bar level
        // manually.
        pokergcs.GUI.setGUIZoomBarLevel(this.map.zoom);
    },
    
    /**
     * Method: zoomendEvent
     *
     * Callback method for the 'zoomend' Map event. When the map is either
     * zoomed in or zoomed out, this callback is fired.
     *
     * Parameters:
     * evt - {OpenLayers.Events} The event object that is passed into the
     *       callback.
     */
    zoomendEvent: function(evt) {
        // evt
        //  +--- element (dom element -- unimportant)
        //  +--- object  (the OpenLayers.Map object referenced from the event)
        //  +--- type    ("zoomend")
        pokergcs.GUI.setGUIZoomBarLevel(evt.object.zoom);
    },
});