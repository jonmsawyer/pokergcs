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
     */
    setGUIZoomBarLevel: function(zoom) {
        zoom = parseInt(zoom);
        if (zoom > 16) {
            zoom = 16;
        }
        else if (zoom < 1) {
            zoom = 1;
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
                pokergcs.GUI.setGUIZoomBarLevel(pokergcs.map.map.zoom);
            });
        });
    },
    
    /**
     * Method: initPayload
     *
     * Ties the payload widget to the window object as well as sets the click
     * event of the show/hide payload button.
     */
    initPayload: function() {
        var status = $('appLayoutStatusHideShowPayload');
        var payload = $('appLayoutPayloadContainer');
        var mapContainer = $('appLayoutMapContainer');
        window.payloadWidget = dijit.byId('appLayoutPayloadContainer');
        status.addEvent('click', function() {
            if (payload.hasClass('hidden')) {
                dijit.byId('appLayoutCenter').addChild(window.payloadWidget);
                $('appLayoutStatusHideShowPayload').title = "Click hide payload.";
            }
            else {
                dijit.byId('appLayoutCenter').removeChild(window.payloadWidget);
                $('appLayoutStatusHideShowPayload').title = "Click to show payload.";
            }
            pokergcs.map.map.render('appLayoutMap');
            payload.toggleClass('hidden');
            status.toggleClass('show');
            status.toggleClass('hide');
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
};