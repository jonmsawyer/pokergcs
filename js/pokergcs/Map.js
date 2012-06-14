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
        if (element.id == "waypointsDirectGo") {
            element.addClass('highlight').addClass('disabled');
            Array.each(['Back', 'Stop', 'Play', 'Pause', 'Forward'],
                function(el) {
                    $('waypointsDirect'+el).removeClass('disabled');
                });
            var control
        }
        else if (element.id == "waypointsAreaGo") {
            element.addClass('highlight').addClass('disabled');
            Array.each(['Back', 'Stop', 'Play', 'Pause', 'Forward'],
                function(el) {
                    $('waypointsArea'+el).removeClass('disabled');
                });
        }
        for (var key in this.waypointControls) {
            var control = this.waypointControls[key];
            if (element.getProperty('data-draw') == key &&
                element.hasClass('highlight')) {
                    this.jsonPoints(
                        control.layer.features[0].geometry.components,
                        key,
                        now.addWaypoints
                    );
            }
        }
    },
    
    /**
     * Method: jsonPoints
     *
     * Compile a list of points into a JSON object and fire the callback with
     * the JSON object as its argument: callback(JSONObject)
     *
     * Parameters:
     * points - {Array} A list of {OpenLayers.Geometry.Point}s
     * key - {String} One of 'line' or 'polygon'
     * callback - {function} The callback to fire when data is done forming
     */
    jsonPoints: function(points, key, callback) {
        ob = {type: key, points: []}
        if (key == "polygon") {
            points = points[0].components;
        }
        Array.each(points, function(el) {
            ob.points.push([el.x, el.y]);
        });
        callback(JSON.stringify(ob));
    },
    
    /**
     * Method: addClientWaypoints
     *
     * Adds a json string of waypoints to the direct waypoint mode line layer.
     *
     * Paramters:
     * wp_json - {JSON formatted string} Looks like
     *           '{"type":"line|area","points":[[0,0],[0,0],...]}'
     */
    addClientWaypoints: function(wp_json) {
        var ob = JSON.decode(wp_json);
        if (ob.type == "line") {
            var points = [];
            Array.each(ob.points, function(el) {
                points.push(new OpenLayers.Geometry.Point(el[0], el[1]))
            })
            var line_string = new OpenLayers.Geometry.LineString(points);
            var feature_vector = new OpenLayers.Feature.Vector(line_string);
            this.waypointControls["line"].layer.removeAllFeatures();
            this.waypointControls["line"].layer.addFeatures(feature_vector);
        }
        else if (ob.type == "polygon") {
            var points = [];
            Array.each(ob.points, function(el) {
                points.push(new OpenLayers.Geometry.Point(el[0], el[1]));
            });
            var linear_ring = new OpenLayers.Geometry.LinearRing(points);
            var polygon = new OpenLayers.Geometry.Polygon(linear_ring);
            var feature_vector = new OpenLayers.Feature.Vector(polygon);
            this.waypointControls["polygon"].layer.removeAllFeatures();
            this.waypointControls["polygon"].layer.addFeatures(feature_vector);
        }
    }
});
