// ==UserScript==
// @name         A Mining Game: Fix minor issues
// @namespace    https://github.com/Phylogenesis/
// @version      0.2
// @description  Fixes some minor issues with the chat system and allows manual saving by clicking on the button in the top right
// @author       Luke Jones
// @include      /^http://trugul\.com/(index\.php)?$/
// @grant        none
// @downloadURL  https://github.com/Phylogenesis/greasemonkey/raw/master/AMGFixes.user.js
// ==/UserScript==

(function ($) {
    var AGame = {
        client:     undefined,
        username:   undefined,
        lastSubmit: undefined,
    };
    
    function updateRanks() {
        $.ajax({
            url:     'http://trugul.com/highscores/',
            async:   true,
            success: function (data) {
                var matches = /You are ranked #(\d+)/.exec(data);
                var rank = 'N/A'
                
                if (matches.length > 0) {
                    rank = matches[1];
                }
                
                $('#leaderboardRanking span.mainRank').text(rank);
            }
        });
        
        $.ajax({
            url:     'http://trugul.com/highscores/?order=prestige',
            async:   true,
            success: function (data) {
                var matches = /You are ranked #(\d+)/.exec(data);
                var rank = 'N/A'
                
                if (matches.length > 0) {
                    rank = matches[1];
                }
                
                $('#leaderboardRanking span.prestigeRank').text(rank);
            }
        });
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
        AGame.client   = io('http://5.189.137.117:469');
        AGame.username = $('#playerName').text();
            
        AGame.client.on(
            'gameVars',
            function (data) {
                var lastSubmit = data.gameVars.lastSubmit;
                
                if (AGame.lastSubmit !== lastSubmit) {
                    AGame.lastSubmit = lastSubmit;
                    updateRanks();
                }
            }
        );
        
        $('#quickdetails tr').prepend('<td id="leaderboardRanking" class="displaytext2" style="text-align: center; width: 70px;"><b>Ranking</b><br><span class="mainRank">&hellip;</span> | <span class="prestigeRank">&hellip;</span></td>');

        $('span.mainRank, span.prestigeRank').css('cursor', 'pointer');

        $('span.mainRank').click(function () {
            window.open('http://trugul.com/highscores/?user=' + AGame.username)
        });

        $('span.prestigeRank').click(function () {
            window.open('http://trugul.com/highscores/?order=prestige&user=' + AGame.username)
        });
    }, 5000);
})(jQuery);
    
