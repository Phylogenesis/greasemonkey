// ==UserScript==
// @name         Amend OSM's context menu
// @include      /^https?:\/\/(www\.)?openstreetmap\.org\//
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function getTileImage(x, y) {
        return document.querySelector('img[src*="' + x + '/' + y + '.png"]');
    }

    function getTileCoordsFromLatLng(map, latlng) {
        var tileSize   = L.point(256, 256);
        var pixelPoint = map.project(latlng, map.getZoom()).floor();
        return pixelPoint.unscaleBy(tileSize).floor();
    }

    OSM.originalInitializeContextMenu = OSM.initializeContextMenu;

    OSM.initializeContextMenu = function (map) {
        OSM.originalInitializeContextMenu(map);

        document.styleSheets[0].insertRule('.fade-tile { opacity: 0.25 !important; }');

        var fadedTiles = [];

        var deleteFadedTile = function (x, y, z) {
            fadedTiles = fadedTiles.filter(function (coords) {
                return x !== coords.x || y !== coords.y || z !== coords.z;
            });
        };

        var addFadedTile = function (x, y, z) {
            fadedTiles.push({ x: x, y: y, z: z });
        };

        var isFaded = function (x, y, z) {
            return fadedTiles.filter(function (coords) {
                return coords.x === x && coords.y === y && coords.z === z;
            }).length > 0;
        };

        var osmLayer = map._layers[28];

        osmLayer.on(
            'tileload',
            function (e) {
                if (isFaded(e.coords.x, e.coords.y, e.coords.z)) {
                    e.tile.classList.add('fade-tile');
                }
            }
        );

        var gridLayer = L.tileLayer(
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH4QYWECc3laArfgAAAmJJREFUeNrt1EERADAMw7B0N/6UMwYjUAmCH54kDbDSTZK2IwXscyQAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAAADAAwAMADAAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAAAMADAAwAMAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAAwAAAAwAMADAA4OMBErQF/4rHnUEAAAAASUVORK5CYII=',
            { opacity: 0.25, maxZoom: 19 }
        );

        map.contextmenu.addItem({
            separator: true
        });

        map.contextmenu.addItem({
            text: 'View tile in new window',
            callback: function (e) {
                var coords  = getTileCoordsFromLatLng(map, e.latlng);
                var img     = getTileImage(coords.x, coords.y);
                window.open(img.src);
            }
        });

        map.contextmenu.addItem({
            text: 'Reload tile',
            callback: function (e) {
                var coords  = getTileCoordsFromLatLng(map, e.latlng);
                var img     = getTileImage(coords.x, coords.y);
                img.src = img.src.split('?')[0] + '?_=' + Math.floor(Math.random() * 1000000);
                deleteFadedTile(coords.x, coords.y, coords.z);
                img.classList.remove('fade-tile');
            }
        });

        map.contextmenu.addItem({
            text: 'Tile status',
            callback: function (e) {
                var coords  = getTileCoordsFromLatLng(map, e.latlng);
                var img     = getTileImage(coords.x, coords.y);
                var tileUrl = img.src.split('?')[0] + '/status';

                $.get(
                    tileUrl,
                    function (response) {
                        alert(response.trim());
                    }
                );
            }
        });

        map.contextmenu.addItem({
            text: 'Mark as dirty',
            callback: function (e) {
                var coords  = getTileCoordsFromLatLng(map, e.latlng);
                var img     = getTileImage(coords.x, coords.y);
                var tileUrl = img.src.split('?')[0] + '/dirty';

                $.get(
                    tileUrl,
                    function (response) {
                        addFadedTile(coords.x, coords.y, coords.z);
                        img.classList.add('fade-tile');
                    }
                );
            }
        });

        map.contextmenu.addItem({
            separator: true
        });

        map.contextmenu.addItem({
            text: 'Toggle tile borders',
            callback: function () {
                if (Object.values(map._layers).indexOf(gridLayer) === -1) {
                    gridLayer.addTo(map);
                } else {
                    gridLayer.remove();
                }
            }
        });
    };
})();
