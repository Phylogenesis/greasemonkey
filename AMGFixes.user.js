// ==UserScript==
// @name         A Mining Game: Fix minor issues
// @namespace    https://github.com/Phylogenesis/
// @version      0.3.2
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
    
    function addSellValueDiv() {
        $('body').append('<div id="sellValue" />');
        
        $('#sellValue').append('<div id="sellValueTotal" class="clickable visible">Total Sell Value<span></span></div>');
        
        $('#sellValue').append('<div id="sellValueScientists" data-parent="sellValueTotal">Scientists<span></span></div>');
        
        $('#sellValue').append('<div id="sellValueSoldiers" class="clickable" data-parent="sellValueTotal">Army<span></span></div>');
        
        for (var soldier in items.soldiers) {
            $('#sellValue').append('<div id="sellValueSoldiers' + soldier + '" data-parent="sellValueSoldiers">' + items.soldiers[soldier].name + '<span></span></div>');
        }
        
        $('#sellValue').append('<div id="sellValueVillage" class="clickable" data-parent="sellValueTotal">Village<span></span></div>');
        
        for (var building in buildings) {
            $('#sellValue').append('<div id="sellValueVillage' + building + '" data-parent="sellValueVillage">' + buildings[building].name + '<span></span></div>');
        }
        
        $('#sellValue').css({
            position:   'fixed',
            color:      '#666',
            top:        '62px',
            left:       '10px',
            width:      '200px',
            zIndex:     9999999
        });
        
        $('#sellValue div').css({
            border:     '1px solid #666',
            marginTop:  '-1px',
            marginLeft: '0px',
            background: '#ddd',
            height:     '30px',
            lineHeight: '30px',
            padding:    '0 10px'
        });
        
        $('#sellValue span').css('float', 'right');
        $('#sellValue div.clickable').css('cursor', 'pointer');
        
        $('#sellValue').on(
            'selectstart',
            function (e) {
                e.preventDefault();
            }
        );
        
        $('head').append('<style type="text/css">#sellValue div { display: none; }</style>');
        $('head').append('<style type="text/css">#sellValue div.visible { display: block; }</style>');
        
        $('div.clickable').click(function (e) {
            var id = this.id;
            
            $('#sellValue div').each(function (index, div) {
                if ($(div).data('parent') === id) {
                    $(div).toggleClass('visible');
                }
            });
        });
        
        $('#sellValue div').each(function (index, div) {
            var parentMargin = parseInt($('#' + $(div).data('parent')).css('margin-left'), 10);
            
            $(div).css('margin-left', (parentMargin + 10) + 'px');
        });
    };
    
    function prettifyNumber(value) {
        var divisors = {
            Qi: 1e18,
            Qa: 1e15,
            T:  1e12,
            B:  1e9,
            M:  1e6,
            K:  1e3
        };
        
        for (var divisor in divisors) {
            if (value >= divisors[divisor]) {
                value /= divisors[divisor];
                return value.toFixed(1) + divisor;
            }
        }
        
        return value;
    }
    
    function calculateSellValue(data) {
        var scientistsTotal = 0;
        var baseValue       = 1000000;
        var multiplier      = 1.0005;
        for (var i = 0; i < game.scientists; i++) {
            scientistsTotal += (baseValue * Math.pow(multiplier, i));
        }
        scientistsTotal /= 4;
        $('#sellValueScientists span').text('$' + prettifyNumber(scientistsTotal));

        var soldiersTotal = 0;
        for (var soldier in items.soldiers) {
            var div          = $('#sellValueSoldiers' + soldier);
            var soldierValue = items.soldiers[soldier].sell * data.employedSoldiers[soldier];
            
            soldiersTotal += soldierValue;
            
            div.find('span').text('$' + prettifyNumber(soldierValue));
        }
        $('#sellValueSoldiers span').text('$' + prettifyNumber(soldiersTotal));
        
        var villageTotal = 0;
        for (var building in buildings) {
            var div           = $('#sellValueVillage' + building);
            var buildingValue = 0;
            
            if (data.village.formed) {
                var baseValue  = buildings[building].price;
                var multiplier = 1.2;
                
                for (var i = 0; i < data.village.buildings[building]; i++)
                {
                    buildingValue += baseValue * Math.pow(multiplier, i);
                }
                
                buildingValue /= 2;

                villageTotal += buildingValue;
            }
            
            div.find('span').text('$' + prettifyNumber(buildingValue));
        }
        $('#sellValueVillage span').text('$' + prettifyNumber(villageTotal));

        $('#sellValueTotal span').text('$' + prettifyNumber(scientistsTotal + soldiersTotal + villageTotal));
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
                        $('body').css('padding-bottom', '20px');
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
                
                calculateSellValue(data.gameVars);
            }
        );
        
        $('#quickdetails tr').prepend('<td id="leaderboardRanking" class="displaytext2"><b>Ranking</b><span class="mainRank" data-order="Money">&hellip;</span><span class="prestigeRank" data-order="Prestige">&hellip;</span></td>');
        
        $('#leaderboardRanking').css({
            textAlign: 'center',
            padding:   0
        });
        
        $('#leaderboardRanking b').css({
            display:      'block',
            borderBottom: '1px solid white',
            lineHeight:   '18px'
        });
        
        $('#leaderboardRanking span').css({
            display:    'inline-block',
            width:      '50px',
            cursor:     'pointer',
            lineHeight: '19px'
        });
        
        $('span.mainRank').css({
            borderRight:            '1px solid white',
            borderBottomLeftRadius: '5px'
        });

        $('span.prestigeRank').css({
            borderBottomRightRadius: '5px'
        });
        
        $('#leaderboardRanking span').hover(
            function () {
                $(this).css('background-color', '#8b8');
                $('#leaderboardRanking b').text($(this).data('order'));
            },
            function () {
                $(this).css('background-color', '');
                $('#leaderboardRanking b').text('Ranking');
            }
        );

        $('span.mainRank').click(function () {
            window.open('http://trugul.com/highscores/?user=' + AGame.username)
        });

        $('span.prestigeRank').click(function () {
            window.open('http://trugul.com/highscores/?order=prestige&user=' + AGame.username)
        });
        
        addSellValueDiv();
    }, 5000);
})(jQuery);
