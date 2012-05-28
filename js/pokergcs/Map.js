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
     * Property: waypointControls
     * Hold the waypoint controls for the map
     */
    waypointControls: null,
    
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
        
        var waypointDirectLayer = new OpenLayers.Layer.Vector("Waypoint Direct Layer");
        var waypointAreaLayer = new OpenLayers.Layer.Vector("Waypoint Area Layer");
        
        this.map.addLayers([waypointDirectLayer, waypointAreaLayer]);
        //this.map.addControl(new OpenLayers.Control.MousePosition());
        
        this.waypointControls = {
            line: new OpenLayers.Control.DrawFeature(waypointDirectLayer,
                OpenLayers.Handler.Path),
            polygon: new OpenLayers.Control.DrawFeature(waypointAreaLayer,
                OpenLayers.Handler.Polygon),
        };
        
        for (var key in this.waypointControls) {
            this.map.addControl(this.waypointControls[key]);
        }
        
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
    
    /**
     * Method: toggleWaypointControl
     *
     * Toggle the waypoint control
     *
     * Parameters:
     * element - {DOM element} The waypoint add button that was clicked
     */
    toggleWaypointControl: function(element) {
        if (element.hasClass('disabled')) { return; }
        if (element.id == "waypointsDirectAdd") {
            pokergcs.GUI.normalizeAreaWaypoints();
            element.addClass('highlight').addClass('disabled');
            $('waypointsDirectDone').removeClass('disabled');
        }
        else if (element.id == "waypointsAreaAdd") {
            pokergcs.GUI.normalizeDirectWaypoints();
            element.addClass('highlight').addClass('disabled');
            $('waypointsAreaDone').removeClass('disabled');
        }
        for (var key in this.waypointControls) {
            var control = this.waypointControls[key];
            if (element.getProperty('data-draw') == key &&
                element.hasClass('highlight')) {
                control.activate();
            }
            else {
                control.deactivate();
            }
        }
    },
    
    /**
     * Method: confirmWaypointList
     *
     * Confirm the waypoint list
     */
    confirmWaypointList: function(element) {
        if (element.hasClass('disabled')) { return; }
        if (element.id == "waypointsDirectDone") {
            element.addClass('highlight').addClass('disabled');
            $('waypointsDirectGo').removeClass('disabled');
        }
        else if (element.id == "waypointsAreaDone") {
            element.addClass('highlight').addClass('disabled');
            $('waypointsAreaGo').removeClass('disabled');
        }
        for (var key in this.waypointControls) {
            var control = this.waypointControls[key];
            if (element.getProperty('data-draw') == key &&
                element.hasClass('highlight')) {
                control.finishSketch();
            }
            control.deactivate();
        }
        
    },
    
    /**
     * Method: activateWaypointList
     *
     * Activate the waypoint list
     *
     * Parameters:
     * element - {DOM element} The waypoint "go" button was clicked
     */
    activateWaypointList: function(element) {
        if (element.hasClass('disabled')) { return; }
    },
});