// ==UserScript==
// @name         A Mining Game: Fix minor issues
// @namespace    https://github.com/Phylogenesis/
// @version      0.1.5
// @description  Fixes some minor issues with the chat system and allows manual saving by clicking on the button in the top right
// @author       Luke Jones
// @include      /^http://trugul\.com/(index\.php)?$/
// @grant        none
// @downloadURL  https://github.com/Phylogenesis/greasemonkey/raw/master/AMGFixes.user.js
// ==/UserScript==

(function ($) {
    var AGame = {
        client: undefined
    };
    
    $(document).on(
        'click',
        'div.tabs a',
        function () {
            setTimeout(
                function () {
                    if ($('div.chat-room-message-container:visible').length > 0) {
                        $('div.chat-room-message-container').scrollTop($('div.chat-room-message-container')[0].scrollHeight);
                        $('body').css('padding-bottom', $('div.popout').outerHeight() + 'px');
                    } else {
                        $('body').css('padding-bottom', 0);
                    }
                },
                100
            );
        }
    );

    $(document).on(
        'click',
        'ul.navbar-right a',
        function (e) {
            if (AGame.client) {
                AGame.client.emit('save');
            }
            
            e.preventDefault();
        }
    );
    
    setTimeout(function () {
        AGame.client = io('http://5.189.137.117:469');
    }, 5000);
})(jQuery);
    
