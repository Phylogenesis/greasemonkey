// ==UserScript==
// @name         A Mining Game: GBStats Bot
// @namespace    https://github.com/Phylogenesis/
// @version      0.1.13
// @description  Runs a bot that tracks global boss stats in A Mining Game
// @author       Luke Jones
// @include      /^http://trugul\.com/(index\.php)?$/
// @grant        none
// @downloadURL  https://github.com/Phylogenesis/greasemonkey/raw/master/GBStats.user.js
// ==/UserScript==

GBStats = {
    // How many global bosses to track.
    // Maximum limit depends on the browser's localStorage settings
    MAX_HISTORY:   1000,
    
    // How many people to report in the summary messages.
    SUMMARY_COUNT: 5,
    
    client:        undefined,
    
    globalBosses:  [],
    playerList:    [],
    
    subscribers:   {
        summary:  [],
        personal: []
    },
    
    showCommands: function () {
        GBStats.sendToGlobalChat('Type "#gbstats subscribe" to receive summary reports and "#gbstats subscribe personal" to receive personal reports. Type "#gbstats" on its own to receive a one-off personal report.');
    },
    
    joinGlobalBoss: function () {
        GBStats.client.emit('globalbossToggleLobby', true);
    },
    
    lastGlobalBoss: function () {
        return GBStats.globalBosses[GBStats.globalBosses.length - 1];
    },
    
    generateSubscriptionMessages() {
        GBStats.outputSummary();
        GBStats.sendToSubscribers('summary', 'Type "#gbstats unsubscribe" to unsubscribe from these messages');
        
        var personalSubscribers = GBStats.subscribers.personal;
        
        for (var i = 0; i < personalSubscribers.length; i++) {
            if (GBStats.playerList.filter(function (player) { return player === personalSubscribers[i]; }).length > 0) {
                for (var user in GBStats.lastGlobalBoss().end.data.players) {
                    if (GBStats.lastGlobalBoss().end.data.players[user].username === personalSubscribers[i]) {
                        GBStats.outputPersonal(personalSubscribers[i]);
                        
                        GBStats.sendToPrivateChat(
                            personalSubscribers[i],
                            'Type "#gbstats unsubscribe personal" to unsubscribe from these messages'
                        );
                    }
                }
            }
        }
    },
    
    outputSummary: function (outputToGlobalChat) {
        var lastGlobalBoss = GBStats.lastGlobalBoss();
        
        var bossName       = lastGlobalBoss.start.data.name;
        var bossHP         = lastGlobalBoss.start.data.startingHP;
        var bossDuration   = (lastGlobalBoss.end.timestamp - lastGlobalBoss.start.timestamp) / 1000;
        
        var outputFunction = outputToGlobalChat ? GBStats.sendToGlobalChat : function (message) { GBStats.sendToSubscribers('summary', message); };

        var message;

        message =
            'Global Boss Stats (' +
            'Name: ' + bossName + ', ' +
            'Health: ' + Math.round(bossHP) + ' HP, ' + 
            'Duration: ' + Math.round(bossDuration) + 's' +
            ')';

        outputFunction(message);

        var attackers = [];

        for (var attacker in lastGlobalBoss.end.data.players) {
            /*
            if (attacker === '6815') {
                lastGlobalBoss.end.data.players[attacker].attacks = Math.floor(Math.random() * 1e9);
            }
            */
            
            attackers.push(lastGlobalBoss.end.data.players[attacker]);
        }

        attackers.sort(function (a, b) { return b.attacks - a.attacks; });
        
        var topClickers = attackers.slice(0, GBStats.SUMMARY_COUNT).map(
            function (attacker) {
                return attacker.username + ' (' + attacker.attacks + ', ' + (attacker.attacks / bossDuration).toFixed(1) + '/s)';
            }
        );
                
        message = 'Top Clickers: ' + topClickers.join(', ');

        outputFunction(message);

        attackers.sort(function (a, b) { return b.damageDealt - a.damageDealt; });

        var topDamage = attackers.slice(0, GBStats.SUMMARY_COUNT).map(
            function (attacker) {
                return attacker.username + ' (' + attacker.damageDealt + ', ' + (attacker.damageDealt / bossHP * 100).toFixed(1) + '%)';
            }
        );
                
        message = 'Top Damage: ' + topDamage.join(', ');

        outputFunction(message);
    },
    
    logSummary: function () {
        var lastGlobalBoss = GBStats.lastGlobalBoss();
        
        console.log('Global Boss (Started: ' + (new Date(lastGlobalBoss.start.timestamp)).toLocaleTimeString() + ')');
        
        console.groupCollapsed();
        console.log('   ID  Username        Level   Clicks  Damage');
        console.log('-----  --------        -----   ------  ------');
        
        var attackers = lastGlobalBoss.end.data.players;
        
        for (var attacker in attackers) {
            var userid   = attackers[attacker].userid;
            var username = attackers[attacker].username;
            var level    = attackers[attacker].level;
            var clicks   = attackers[attacker].attacks;
            var damage   = attackers[attacker].damageDealt;
            
            console.log(
                (" ".repeat(5) + userid).slice(-5) + "  " +
                (username + " ".repeat(16)).substring(0, 16) +
                (" ".repeat(5) + level).slice(-5) + "   " +
                (" ".repeat(6) + clicks).slice(-6) + "  " +
                (" ".repeat(6) + damage).slice(-6)
            );
        }
        
        console.groupEnd();
    },
    
    outputPersonal: function (requester, requestee) {
        requestee = requestee || requester;
        
        var lastGlobalBoss = GBStats.lastGlobalBoss();

        var attackers = lastGlobalBoss.end.data.players;

        for (var attacker in attackers) {
            if (attackers[attacker].username.toUpperCase() === requestee.toUpperCase()) {
                var bossDuration = (lastGlobalBoss.end.timestamp - lastGlobalBoss.start.timestamp) / 1000;

                GBStats.sendToPrivateChat(
                    requester,
                    'Global Boss (' + (new Date(GBStats.lastGlobalBoss().start.timestamp)).toLocaleTimeString() + ') ' +
                    'User: ' + attackers[attacker].username + ', ' +
                    'Level: ' + attackers[attacker].level + ', ' +
                    'Clicks: ' + attackers[attacker].attacks + ' (' + (attackers[attacker].attacks / bossDuration).toFixed(1) + '/s), ' +
                    'Damage: ' + attackers[attacker].damageDealt
                );

                return;
            }
        }

        GBStats.sendToPrivateChat(requester, ' User ' + requestee + ' did not take part in the last global boss.');
    },
    
    parseMessage: function (data) {
        if (/^#gbstats/i.test(data.message)) {
            var requester = data.username;
            var command   = data.message.split(' ')[1] || '';
            var list      = data.message.split(' ')[2] || '';

            switch (command.toLowerCase()) {
                case "summary":
                    if (requester === 'Phylogenesis') {
                        GBStats.outputSummary(true);
                    }
                    break;
                case "commands":
                    if (requester === 'Phylogenesis') {
                        GBStats.showCommands();
                    }
                    break;
                case "subscribe":
                    switch (list.toLowerCase()) {
                        case 'personal':
                        case 'summary':
                            GBStats.addSubscriber(list, requester);
                            break;
                        default:
                            GBStats.addSubscriber('summary', requester);
                            break;
                    }
                    break;
                case "unsubscribe":
                    switch (list.toLowerCase()) {
                        case 'personal':
                        case 'summary':
                            GBStats.removeSubscriber(list, requester);
                            break;
                        default:
                            GBStats.removeSubscriber('summary', requester);
                            break;
                    }
                    break;
                case "fastclickers":
                    if (['Phylogenesis', 'Sause01', 'lanza'].indexOf(requester) !== -1 && list >= 20) {
                        var clickers = GBStats.fastClickers(list);
                        
                        clickers.forEach(
                            function (player) {
                                GBStats.sendToPrivateChat(
                                    requester,
                                    'Date/Time: ' + (new Date(player.timestamp)).toString() + ', ' +
                                    'Player: ' + player.player.username + ', ' +
                                    player.player.attacks + ' attacks in ' + player.duration.toFixed(2) + 's ' + '(' + (player.player.attacks / player.duration).toFixed(1) + 'cps)'
                                );
                            }
                        );
                    }
                    break;
                default:
                    GBStats.outputPersonal(requester, command);
                    break;
            }
        }
    },
    
    addSubscriber: function (list, user) {
        if (GBStats.subscribers[list].filter(function (player) { return player === user; }).length === 0) {
            GBStats.subscribers[list].push(user);
            GBStats.updateSubscriberList();
            
            GBStats.sendToPrivateChat(user, 'Added you to the ' + list + ' subscription list');
        } else {
            GBStats.sendToPrivateChat(user, 'You are already in the ' + list + ' subscription list');
        }
    },
    
    removeSubscriber: function (list, user) {
        if (GBStats.subscribers[list].filter(function (player) { return player === user; }).length > 0) {
            GBStats.subscribers[list] = GBStats.subscribers[list].filter(function (subscriber) { return subscriber !== user; });
            GBStats.updateSubscriberList();
            
            GBStats.sendToPrivateChat(user, 'Removed you from the ' + list + ' subscription list');
        } else {
            GBStats.sendToPrivateChat(user, 'You are not in the ' + list + ' subscription list');
        }
    },
    
    loadGlobalBosses: function () {
        GBStats.globalBosses = JSON.parse(localStorage.GBStatsGlobalBosses);
    },
    
    updateGlobalBosses: function () {
        localStorage.GBStatsGlobalBosses = JSON.stringify(GBStats.globalBosses.slice(-GBStats.MAX_HISTORY));
    },
    
    loadSubscriberList: function () {
        GBStats.subscribers = JSON.parse(localStorage.GBStatsSubscribers);
    },
    
    updateSubscriberList: function () {
        localStorage.GBStatsSubscribers = JSON.stringify(GBStats.subscribers);
    },
    
    sendToGlobalChat: function (message) {
        GBStats.client.emit(
            'general_chat_message',
            message
        );
    },
    
    sendToPrivateChat: function (user, message) {
        GBStats.client.emit(
            'private_chat_message',
            {
                to:      user,
                message: message
            }
        );
    },
    
    sendToSubscribers: function (list, message) {
        var subscribers = GBStats.subscribers[list];
        
        for (var i = 0; i < subscribers.length; i++) {
            if (GBStats.playerList.filter(function (player) { return player === subscribers[i]; }).length > 0) {
                GBStats.sendToPrivateChat(subscribers[i], message);
            }
        }
    },
    
    setupClient: function (client) {
        GBStats.client = client;
        
        GBStats.loadSubscriberList();
        GBStats.loadGlobalBosses();

        client
            .removeListener('popup')
            .removeListener('sent_private_message')
            .removeListener('private_chat_message')
            .on('matchBegin', function (data) {
                var timestamp = (new Date()).toLocaleTimeString();

                GBStats.globalBosses.push({
                    start: {
                        timestamp: (new Date()).getTime(),
                        data:      data
                    }
                });
            })
            .on('matchEnd', function (data) {
                var timestamp = (new Date()).toLocaleTimeString();

                GBStats.lastGlobalBoss().end = {
                    timestamp: (new Date()).getTime(),
                    data:      data
                };

                GBStats.updateGlobalBosses();
                GBStats.generateSubscriptionMessages();
                
                GBStats.logSummary();
            })
            .on('general_chat_message', function (data) {
                GBStats.parseMessage(data);
            })
            .on('private_chat_message', function (data) {
                GBStats.parseMessage(data);
            })
            .on('player_list', function (data) {
                var players = data.players;

                GBStats.playerList = [];

                for (var i = 0; i < players.length; i++) {
                    GBStats.playerList.push(players[i].username); 
                }
            });
        
        document.title = '[GBStats] A Mining Game';
    },
    
    fastClickers: function (limit) {
        var clickers = [];
        
        GBStats.globalBosses.forEach(
            function (gb, index) {
                if (gb.start && gb.end) {
                    var duration = (gb.end.timestamp - gb.start.timestamp) / 1000;
                    
                    for (var player in gb.end.data.players) {
                        if (gb.end.data.players[player].attacks / duration >= limit) {
                            clickers.push({
                                index:     index,
                                timestamp: new Date(gb.start.timestamp),
                                duration:  duration,
                                player:    gb.end.data.players[player]
                            });
                        }
                    }
                }
            }
        );
            
        return clickers;
    }
};

setTimeout(
    function () {
        GBStats.setupClient(io('http://5.189.137.117:469'));
    },
    5000
);

setInterval(
    function () {
        if ($('a[name="globalBoss-join"]').length !== 0 && $('div[name="globalBossContainer"]:visible').length === 0) {
            GBStats.joinGlobalBoss();
        }
    },
    5000
);

setInterval(
    function () {
        var currentTime = new Date();
        
        if (currentTime.getMinutes() === 0) {
            GBStats.sendToGlobalChat('Global Boss Tracker is running.');
            GBStats.showCommands();
        }
    },
    60000
);
