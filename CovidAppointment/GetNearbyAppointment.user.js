// ==UserScript==
// @name         Get Nearby COVID Appointment
// @namespace    http://www.github.com/Phylogenesis/
// @version      0.1.1
// @description  Refreshes appointment screen every 10 seconds until a nearby appointment shows up (<=20 miles). Then plays a sound every 5 seconds so that the user is alerted.
// @author       Luke Jones
// @match        https://www.nhs.uk/book-a-coronavirus-vaccination/book/Appointment/Index/*
// @icon         https://www.google.com/s2/favicons?domain=www.nhs.uk
// @grant        none
// @downloadURL  https://github.com/Phylogenesis/greasemonkey/raw/master/CovidAppointment/GetNearbyAppointment.user.js
// ==/UserScript==

(function() {
    'use strict';

    let nearestDistance = 1000;

    try {
        nearestDistance = parseFloat(document.querySelector('.distance').innerText);
    }
    catch {}

    if (nearestDistance > 20) {
        window.setTimeout(
            () => location.reload(),
            10000
        );
    } else {
        let alert = new Audio('https://freesound.org/data/previews/91/91926_7037-lq.mp3');
        alert.play();

        window.setInterval(
            () => alert.play(),
            5000
        );
    }
})();
