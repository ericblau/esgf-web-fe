/*****************************************************************************
 * Copyright � 2011 , UT-Battelle, LLC All rights reserved
 *
 * OPEN SOURCE LICENSE
 *
 * Subject to the conditions of this License, UT-Battelle, LLC (the
 * �Licensor�) hereby grants to any person (the �Licensee�) obtaining a copy
 * of this software and associated documentation files (the "Software"), a
 * perpetual, worldwide, non-exclusive, irrevocable copyright license to use,
 * copy, modify, merge, publish, distribute, and/or sublicense copies of the
 * Software.
 *
 * 1. Redistributions of Software must retain the above open source license
 * grant, copyright and license notices, this list of conditions, and the
 * disclaimer listed below.  Changes or modifications to, or derivative works
 * of the Software must be noted with comments and the contributor and
 * organization�s name.  If the Software is protected by a proprietary
 * trademark owned by Licensor or the Department of Energy, then derivative
 * works of the Software may not be distributed using the trademark without
 * the prior written approval of the trademark owner.
 *
 * 2. Neither the names of Licensor nor the Department of Energy may be used
 * to endorse or promote products derived from this Software without their
 * specific prior written permission.
 *
 * 3. The Software, with or without modification, must include the following
 * acknowledgment:
 *
 *    "This product includes software produced by UT-Battelle, LLC under
 *    Contract No. DE-AC05-00OR22725 with the Department of Energy.�
 *
 * 4. Licensee is authorized to commercialize its derivative works of the
 * Software.  All derivative works of the Software must include paragraphs 1,
 * 2, and 3 above, and the DISCLAIMER below.
 *
 *
 * DISCLAIMER
 *
 * UT-Battelle, LLC AND THE GOVERNMENT MAKE NO REPRESENTATIONS AND DISCLAIM
 * ALL WARRANTIES, BOTH EXPRESSED AND IMPLIED.  THERE ARE NO EXPRESS OR
 * IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE,
 * OR THAT THE USE OF THE SOFTWARE WILL NOT INFRINGE ANY PATENT, COPYRIGHT,
 * TRADEMARK, OR OTHER PROPRIETARY RIGHTS, OR THAT THE SOFTWARE WILL
 * ACCOMPLISH THE INTENDED RESULTS OR THAT THE SOFTWARE OR ITS USE WILL NOT
 * RESULT IN INJURY OR DAMAGE.  The user assumes responsibility for all
 * liabilities, penalties, fines, claims, causes of action, and costs and
 * expenses, caused by, resulting from or arising out of, in whole or in part
 * the use, storage or disposal of the SOFTWARE.
 *
 *
 ******************************************************************************/

/*
 * Author: 		Feiyi Wang <fwang2@ornl.gov>
 *
 * Created: 	October 12, 2010
 */

$(document).ready(function(){

    var map, geocoder, infowindow;
    var num_of_markers = 0;
    var max_of_markers = 3;
    var bounds;
    var cbounds = new google.maps.LatLngBounds();
    var markerGroup = new Array(max_of_markers);
    var poly;


    function clearAreaChoice() {

        $("input:radio").attr('checked', false);

    }

    function clearMarkers() {
        for (var i=0; i < max_of_markers; i++) {
            if (markerGroup[i])
                markerGroup[i].setMap(null);
                markerGroup[i] = null;
        }

        num_of_markers = 0;

        // close info window
        if (infowindow)
        {
            infowindow.close();
    }
        if (poly)
            poly.setMap(null);


        // clear marker area content
        $("#markers").html("");
        $("#areaSelected").html("");


        clearAreaChoice();
    }



    function addMarker(location) {
        if (num_of_markers < max_of_markers) {

            // create a new marker
            var marker = new google.maps.Marker({
                draggable: true,
                position: location,
                map: map
            });

            markerGroup[num_of_markers] = marker;
            num_of_markers += 1;


            google.maps.event.addListener(marker, "dragstart", function() {
                if (infowindow)
                    infowindow.close();

            });

            google.maps.event.addListener(marker, 'dragend', function() {
                //alert("number of marker:" + num_of_markers);
                if (poly)
                    poly.setMap(null);

                clearAreaChoice();
                refreshMarkers();
            });

            return marker;

        } else {
            jMsg("warn", "Max markers reached, please clear markers first!", 5000);
            return null;
        }

    }

    function appendMarker(marker, i) {
        var content = '[' + i + '] ' + 'lat ' +
                marker.getPosition().lat().toFixed(2) + ' , ' +
                'lon ' +
                marker.getPosition().lng().toFixed(2) + "<br />";

        $("#markers").append(content);

        if ($("#markers").is(":hidden"))
            $("#markers").slideToggle('fast');
    }

    $('div#showOptions').click(function() {
        $('div#search_wrapper').html("");
        $('div#optionPane').slideToggle(
                'fast',  function() {
            if ($(this).is(':hidden'))
                     $('div#showOptions').html('<a href="#">Show Options</a>');
                 else
            $('div#showOptions').html('<a href="#">Hide Options</a>');
        });
    });

    function placeMarker(location) {
        var marker = addMarker(location);
        if (marker != null ) {
            appendMarker(marker,  num_of_markers);
        }
    }

    /**
     * initialize maps
     */
    function display_map () {
        var mapDiv = document.getElementById('map_canvas');
        var latlng = new google.maps.LatLng(37.09, -95.71);
        var options = {
            center: latlng,
            zoom: 4,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        // check to see if we already have a map object
        if (!map) {
            map = new google.maps.Map(mapDiv, options);
        }

        google.maps.event.addListener(map, 'click', function(e) {
            if (poly)
                poly.setMap(null);
            clearAreaChoice();
            placeMarker(e.latLng);
        });
    };


    $("input[name='mapGroup']").change(function() {
        if ($("input[name='mapGroup']:checked").val() == '2dmap') {
            //$("div#3dmapPane").hide();
            $("div#mapPane").toggle('fast', display_map);
        } else {
            $("div#mapPane").hide();
            //$("div#3dmapPane").toggle('fast');
        }
    });

    $("#geoloc input[name='location']").keypress(function(e) {
        if (e.keyCode == 13) {
            var address = $(this).val();
            getCoordinates(address);
            // clear the field
            $(this).val('');
            return false;
        }
    });

    $('#marker_fieldset input[name="clear_markers"]').click(function(e) {

        clearMarkers();
        clearAreaChoice();
    });

    function updateInfo(pos) {
        var content = '<div class="infowindow"> Lat: ' + pos.lat().toFixed(4) + "<br />";
        content += "Lng:" + pos.lng().toFixed(4) + "</div>";
        infowindow.setContent(content);
    }

    function dispInfo(marker) {
        var pos = marker.getPosition();
        var content = '<div class="infowindow"> ';
        content += "Lat: " + pos.lat().toFixed(4) + "<br />";
        content += "Lng:" + pos.lng().toFixed(4) + "</div>";
        if (!infowindow) {
            infowindow = new google.maps.InfoWindow();

        }
        infowindow.setContent(content);
        infowindow.open(map, marker);
    }

    function getCoordinates(address) {
        if (!geocoder) {
            geocoder = new google.maps.Geocoder();
        }

        // Creating GeocoderRequest object
        var geocoderRequest = {
                address: address
        };



        // Making the Geocode request
        geocoder.geocode(geocoderRequest, function(results, status) {
            // check status
            if (status == google.maps.GeocoderStatus.OK) {
                // center the map on the returned location
                map.setCenter(results[0].geometry.location);
            }

            var marker = addMarker(results[0].geometry.location);

            if (marker != null) {

                // check if we have a info window
                if (!infowindow) {
                    infowindow = new google.maps.InfoWindow();

                }

                // create contents
                var content = '<div class="infowindow"> <p class="legend">'
                    + results[0].formatted_address + '</p>'
                content += "Lat: " + results[0].geometry.location.lat() + '<br />';
                content += "Lng: " + results[0].geometry.location.lng();
                content += "</div>"

                // Adding the content
                infowindow.setContent(content);

                // Open the infowindows
                infowindow.open(map, marker);

                // refresh info to panel
                appendMarker(marker,  num_of_markers);



            }
        });

    }



    /**
     * Output each marker's geolocation information
     *
     */

    function refreshMarkers() {

        $("#markers").html("");
        for (var i=0; i < num_of_markers; i++) {
            appendMarker(markerGroup[i], i+1);
        }

    }


    rad = function(x) { return x*Math.PI/180;}

    // credit: stackflow
    // Haversine formula
    dist = function(p1, p2) {

          var R = 6371; // earth's mean radius in km
          var dLat  = rad(p2.lat() - p1.lat());
          var dLong = rad(p2.lng() - p1.lng());

          var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) * Math.sin(dLong/2) * Math.sin(dLong/2);
          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          var d = R * c;

          return d.toFixed(3);

    }


    function drawCircle(marker, radius, nodes) {
        var center = marker.getPosition();
        var latConv = dist(center, new google.maps.LatLng(center.lat() + 0.1, center.lng()))*10;
        var lngConv = dist(center, new google.maps.LatLng(center.lat(), center.lng() + 0.1))*10;
        // loop
        var points = [];
        var step = parseInt(360/nodes) || 40;
        for (var i = 0; i <= 360; i+= step) {
            var pint = new google.maps.LatLng( center.lat() + (radius/latConv * Math.cos(i * Math.PI/180)),
                    center.lng() + (radius/lngConv * Math.sin(i * Math.PI/180)));
            points.push(pint);
            cbounds.extend(pint);
        }

        points.push(points[0]); // close circle

        poly = new google.maps.Polygon({
            paths: points,
            fillColor: "#0055ff",
            fillOpacity: 0.35,
            strokeWeight: 2
        });

        if (infowindow)
            infowindow.close();

        poly.setMap(map);
        map.fitBounds(cbounds);

        //since the circle can be resized, Im placing the call to this method here
        setGeographicRadiusConstraint();
    }

    function draw_rect() {
        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();

        // need to double check on this
        var se = new google.maps.LatLng(sw.lat(), ne.lng());
        var nw = new google.maps.LatLng(ne.lat(), sw.lng());

        var points = [ne, se, sw, nw];
        poly = new google.maps.Polygon({
            paths: points,
            fillColor: "#0055ff",
            fillOpacity: 0.35,
            strokeWeight: 2
        });


        poly.setMap(map);
        map.fitBounds(bounds);
    }


    function getBoundingBox() {
        bounds = new google.maps.LatLngBounds()
        for (var i=0; i < num_of_markers; i++) {
            var marker = markerGroup[i];
            if (marker)
                bounds.extend(marker.getPosition());
        }
        if (infowindow)
            infowindow.close();

        // draw rectangle
        draw_rect();




        // put out something
        $("#areaSelected").html('<p class="legend"> Bounding Box </p> + '
                + bounds.toString());

        if ($("#areaSelected").is(":hidden"))
            $("#areaSelected").slideToggle('fast');
    }

    function redraw_circle() {
        if (poly)
            poly.setMap(null);

        radius = $("input[name='radius']").val();
        quality = $("input[name='quality']").val();
        drawCircle(markerGroup[0], radius, quality);
    }

    //this event will be taken out soon
    //right now it acts as a guard so that the user cannot perform and overlaps query with a radius search (unimplemented)
    $("input[name='searchType']").change(function(e) {
        var searchType = $("input[name='searchType']").val();
        //alert("changing search type to " + searchType);

    });

    $("input[name='areaGroup']").change(function(e) {

        if ($("input[name='areaGroup']:checked").val() == 'square') {

            if (num_of_markers < 2) {
                jMsg("warn", "Please define at least two markers!", 5000);
                $(this).attr('checked', false);
                return false;
            }
            getBoundingBox();
            setGeographicConstraint();
            //do the submit here?

        } else {
            if (num_of_markers != 1) {
                alert("Please define ONE marker, center of interest!")
                $(this).attr('checked', false);
                return false;
            }


            if ($("#circleInputs").is(":hidden"))
                $("#circleInputs").slideToggle('fast');

            // put out something
            $("#areaSelected").html('<p class="legend"> Center of Interest </p> + '
                    + markerGroup[0].getPosition().toString());


            if ($("#areaSelected").is(":hidden"))
                $("#areaSelected").slideToggle('fast');


            redraw_circle();

        }
    });

    $('input[name="redraw_circle"]').click(function(e) {

        redraw_circle();

    });





    function setGeographicConstraint() {

        swapGeoSearchType("BoundingBox");


        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();

        //this is the min long
        var swLng = sw.lng();

        //this is the min lat
        var swLat = sw.lat();

        //this is the max long
        var neLng = ne.lng();

        //this is the max lat
        var neLat = ne.lat();

        //var searchForm = document.getElementById("geo-form");
        var searchForm = document.getElementById("search-form");
        var wdinput = searchForm["west_degrees"];
        wdinput.value = swLng;
        var edinput = searchForm["east_degrees"];
        edinput.value = neLng;
        var sdinput = searchForm["south_degrees"];
        sdinput.value = swLat;
        var ndinput = searchForm["north_degrees"];
        ndinput.value = neLat;

        //geosearch();
    }


    /*
     * This function essentially does the same as addGeograpichConstraint, only
     * now the cbounds are used.
     */
    function setGeographicRadiusConstraint() {

        swapGeoSearchType("Radius");

        var sw = cbounds.getSouthWest();
        var ne = cbounds.getNorthEast();

        //this is the min long
        var swLng = sw.lng();

        //this is the min lat
        var swLat = sw.lat();

        //this is the max long
        var neLng = ne.lng();

        //this is the max lat
        var neLat = ne.lat();

        //var searchForm = document.getElementById("geo-form");
        var searchForm = document.getElementById("search-form");
        var wdinput = searchForm["west_degrees"];
        wdinput.value = swLng;
        var edinput = searchForm["east_degrees"];
        edinput.value = neLng;
        var sdinput = searchForm["south_degrees"];
        sdinput.value = swLat;
        var ndinput = searchForm["north_degrees"];
        ndinput.value = neLat;

    }

    function swapGeoSearchType(type)
    {
        var searchForm = document.getElementById("search-form");
        var whichGeo = searchForm["whichGeo"];
        whichGeo.value = type;
    }

});
