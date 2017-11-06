// ==UserScript==
// @name         Visualise OSM Changeset
// @namespace    https://github.com/Phylogenesis/
// @version      0.1
// @description  Adds a link to a changeset visualiser
// @author       Luke Jones
// @include      /^https?://(www\.)?openstreetmap\.org\/changeset\/\d+(#.*)?$/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let changesetId = document.querySelector('input[name=comment]').dataset.changesetId;

    let a = document.createElement('a');
    a.innerHTML = 'Visualise Changeset';
    a.style.cursor = 'pointer';

    a.addEventListener(
        'click',
        function () {
            let url = 'http://osmhv.openstreetmap.de/changeset.jsp?id=' + changesetId;
            window.open(url);
        }
    );

    let div = document.querySelector('.browse-section');
    let h4  = div.querySelector('h4');

    div.insertBefore(a, h4);
})();
