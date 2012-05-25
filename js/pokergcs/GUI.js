/**
 * File: GUI.js
 * Author: Jonathan Sawyer
 * Copyright: 2012, Poker Flat Research Range, University of Alaska Fairbanks
 * License: MIT License
 */

/**
 * Namespace: GUI
 *
 * Contains static methods for manipulating the larger GUI. Smaller GUI elements
 * that pertain to a particular class should be handled within the class.
 */
pokergcs.GUI = {
    /**
     * Method: resizeZoomBarLevels
     *
     * When the page loads or when the browser is resized, the zoom bar levels
     * are all at a fixed height. Resize the zoom bar level divs according to
     * to the resized height of the zoom bar. 16 divs are in the zoom bar.
     */
    resizeZoomBarLevels: function() {
        var size = $('appLayoutMapZoomBar').getDimensions();
        Array.each($('appLayoutMapZoomBar').children, function(el) {
            // 16 divs and 1 pixel size for the border
            el.style.height = size.height/16 - 1 + "px";
        });
    },
    
    /**
     * Method: setGUIZoomBarLevel
     *
     * When the page loads or when the user clicks on the zoom in or zoom out
     * buttons, set the appropriate class on the zoom bar element that
     * represents the zoom level.
     *
     * Parameters:
     * zoom - {integer} The current zoom level of the map
     */
    setGUIZoomBarLevel: function(zoom) {
        zoom = parseInt(zoom);
        if (zoom > 15) {
            zoom = 15;
        }
        else if (zoom < 0) {
            zoom = 0;
        }
        // Don't worry about efficiency: just walk through all elements
        // and set the class appropriately
        Array.each($('appLayoutMapZoomBar').children, function(el) {
            if (parseInt(el.getProperty('data-map-level')) == zoom) {
                el.addClass('highlight');
            }
            else {
                el.removeClass('highlight');
            }
        });
    },
    
    /**
     * Method: initMapZoomInOut
     *
     * Initialize the click events for the zoom in and out buttons as well as
     * initialize the click event for the individual zoom bar elements.
     */
    initMapZoomInOut: function() {
        $('appLayoutMapZoomIn').addEvent('click', function() {
            pokergcs.map.map.zoomIn();
            pokergcs.GUI.setGUIZoomBarLevel(pokergcs.map.map.zoom);
        });
        
        $('appLayoutMapZoomOut').addEvent('click', function() {
            pokergcs.map.map.zoomOut();
            pokergcs.GUI.setGUIZoomBarLevel(pokergcs.map.map.zoom);
        });
        
        Array.each($('appLayoutMapZoomBar').children, function(el) {
            el.addEvent('click', function() {
                var level = parseInt(el.getProperty('data-map-level'));
                pokergcs.map.map.zoomTo(level);
            });
        });
    },
    
    /**
     * Method: initSecondary
     *
     * Ties the secondary view to the window object as well as sets the click
     * event of the show/hide secondary button.
     */
    initSecondary: function() {
        var status = $('appLayoutStatusHideShowSecondary');
        var secondary = $('appLayoutSecondaryContainer');
        var mapContainer = $('appLayoutMapContainer');
        
        // Add to pokergcs namespace for reference later when hidden
        pokergcs.secondaryWidget = dijit.byId('appLayoutSecondaryContainer');
        
        // Hide/show the secondary container, either revealing the map or
        // showing the secondary container alongside it
        status.addEvent('click', function() {
            // We use CSS to determine the state of the buttons and elements
            if (secondary.hasClass('hidden')) {
                dijit.byId('appLayoutCenter').addChild(pokergcs.secondaryWidget);
                // TODO: Change the title
                $('appLayoutStatusHideShowSecondary').title = "Click hide secondary.";
            }
            else {
                dijit.byId('appLayoutCenter').removeChild(pokergcs.secondaryWidget);
                // TODO: Change the title
                $('appLayoutStatusHideShowSecondary').title = "Click to show secondary.";
            }
            
            // After the map is resized, we need to rerender it every time
            pokergcs.map.map.render('appLayoutMap');
            
            secondary.toggleClass('hidden');
            status.toggleClass('show');
            status.toggleClass('hide');
        });
        
        // Tie the secondary container's tab clicks to the selectChild event
        // and fire off this inline callback
        dojo.connect(dijit.byId("appLayoutSecondaryContainer"),
                     "selectChild",
                     function(child){
            Array.each(["Payload", "Statistics", "Settings"], function(el) {
                $('appButton'+el).removeClass('highlight');
            });
            $('appButton'+child.title).addClass('highlight');
            if (child.title == "Waypoints") {
                $('appButtonManual').removeClass('highlight');
            }
        });
    },
    
    /**
     * Method: initWindowResizeEvent
     *
     * Sets the resize window event.
     */
    initWindowResizeEvent: function() {
        window.addEvent('resize', function() {
            pokergcs.GUI.resizeZoomBarLevels();
        });
    },
    
    /**
     * Method: initAppButtonEvents
     */
    initAppButtonEvents: function() {
        // For these buttons, treat them normally
        Array.each(["Payload", "Statistics", "Settings"], function(el) {
            $('appButton'+el).addEvent('click', function() {
                Array.each($$('.appButton'), function(button) {
                    if (button.id == "appButtonManual" ||
                        button.id == "appButtonWaypoints" ) { return; }
                    button.removeClass('highlight');
                });
                this.addClass('highlight');
                if (el == "Manual") { return; }
                dijit.byId('appLayoutSecondaryContainer').selectChild(
                    dijit.byId('appLayout'+el+'Tab')
                );
            });
        });
        
        // Behavior changes when the manual flight mode and waypoint flight
        // modes are selected
        $('appButtonManual').addEvent('click', function() {
            if ($('appButtonWaypoints').hasClass('highlight')) {
                $('appButtonWaypoints').removeClass('highlight');
            }
            this.addClass('highlight');
        });
        
        $('appButtonWaypoints').addEvent('click', function() {
            $('appButtonManual').removeClass('highlight');
            $('appButtonPayload').removeClass('highlight');
            $('appButtonStatistics').removeClass('highlight');
            $('appButtonSettings').removeClass('highlight');
            this.addClass('highlight');
            dijit.byId('appLayoutSecondaryContainer').selectChild(
                dijit.byId('appLayoutWaypointsTab')
            );
        });
    },
};