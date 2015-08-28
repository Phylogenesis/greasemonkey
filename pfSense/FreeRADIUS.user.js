// ==UserScript==
// @name        pfSense - Order FreeRADIUS Users
// @namespace   https://www.github.com/Phylogenesis/
// @include     https://localhost/pkg.php?xml=freeradius.xml
// @include     https://kemfxtfw02/pkg.php?xml=freeradius.xml
// @include     https://kemfxtfw02.kemball.co.uk/pkg.php?xml=freeradius.xml
// @version     1
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// ==/UserScript==

var $ = jQuery.noConflict(true);

function addNewUserButton() {
    var newUserDiv = $('<div id="newuser" />');

    newUserDiv
        .text('New User')
        .css({
            position:   'absolute',
            left:       '780px',
            top:        '55px',
            border:     '1px solid #ccc',
            background: '#eee',
            padding:    '5px',
            zIndex:     '99999',
            cursor:     'pointer'
        })
        .click(function () {
            location.href = 'https://localhost/pkg_edit.php?xml=freeradius.xml&id=99999';
        })
        .prependTo('body');
}

var users = $('tr[id*=id_]');
var table = $('table[summary=tabs]');

function sortUsers(field) {
    var sortedUsers = $.makeArray(users);

    sortedUsers.sort(
        function (a, b) {
            var aValue = $(a).find('td').eq(field).text(),
                bValue = $(b).find('td').eq(field).text();

            return aValue < bValue ? -1 : (aValue === bValue ? 0 : 1);
        }
    );

    $('tr[id*=id_]').detach();

    table.find('tr:eq(3)').after(sortedUsers);
}

$(
    function () {
        addNewUserButton();

        $('td.listhdrr').each(
            function () {
                if ($(this).text() === 'Username' || $(this).text() === 'Description') {
                    $(this)
                        .css('cursor', 'pointer')
                        .on(
                            'click',
                            function () {
                                switch ($(this).text()) {
                                    case 'Username':
                                        sortUsers(0);
                                        break;
                                    case 'Description':
                                        sortUsers(8);
                                        break;
                                }
                            }
                        );
                }
            }
        );
    }
);
