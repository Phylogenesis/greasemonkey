// ==UserScript==
// @name        pfSense - Order FreeRADIUS Users
// @namespace   https://www.github.com/Phylogenesis/
// @include     https://localhost/pkg.php?xml=freeradius.xml
// @include     https://kemfxtfw02/pkg.php?xml=freeradius.xml
// @include     https://kemfxtfw02.kemball.co.uk/pkg.php?xml=freeradius.xml
// @version     1.04
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @downloadURL https://github.com/Phylogenesis/greasemonkey/raw/master/pfSense/FreeRADIUS.user.js
// ==/UserScript==

var $ = jQuery.noConflict(true);

function addNewUserButton() {
    var newUserDiv = $('<div id="newuser" />');

    newUserDiv
        .html('<p style="margin-top: 4px;">New User</p>')
        .css({
            position:   'absolute',
            top:        '50px',
            border:     '1px solid #ccc',
            background: '#eee',
            padding:    '5px',
            zIndex:     '99999',
            cursor:     'pointer',
            height:     '26px'
        })
        .click(function () {
            $(this)
                .html('<table><tr><td>First: </td><td><input id="addUserFirst" type="text" size="6" /></td><td>Last: </td><td><input id="addUserLast" type="text" size="6" /></td><td>Password: </td><td><input id="addUserPassword" type="password" size="5" /></td></tr></table>')
                .css({
                    left:   (850 - $(this).outerWidth()) + 'px',
                    cursor: 'inherit'
                })
                .off('click');
            
            $('#addUserFirst').focus();
            
            $('#addUserFirst, #addUserLast, #addUserPassword').keypress(
                function (e) {
                    if (e.keyCode == 13) {
                        var first    = $('#addUserFirst').val();
                        var last     = $('#addUserLast').val();
                        var password = $('#addUserPassword').val();
                        
                        if (first !== '' && last !== '' && password !== '') {
                            $('#addUserFirst').prop('disabled', true);
                            $('#addUserLast').prop('disabled', true);
                            $('#addUserPassword').prop('disabled', true);
                            
                            addUser(first, last, password);
                        }
                    }
                }
            );
        })
        .prependTo('body')
        .css('left', (850 - newUserDiv.outerWidth()) + 'px');
}

function getCSRFToken() {
    var html = $.ajax({
        method: 'GET',
        url:    '/pkg_edit.php?xml=freeradius.xml&id=99999',
        async:  false
    });
    
    var matches = /var csrfMagicToken = "(.*?)";var csrfMagicName = "(.*?)";/.exec(html.responseText);
    
    return { name: matches[2], value: matches[1] };
}

function addUser(first, last, password) {
    var username = first.toLowerCase().substring(0, 1) + last.toLowerCase();
    
    var postParameters = {
        Submit:                              'Save',
        description:                         last + ', ' + first,
        id:                                  99999,
        varusersacctinteriminterval:         undefined,
        varusersamountoftime:                undefined,
        varuserscheckitemsadditionaloptions: undefined,
        varusersexpiration:                  undefined,
        varusersframedipaddress:             undefined,
        varusersframedipnetmask:             undefined,
        varusersframedroute:                 undefined,
        varuserslogintime:                   undefined,
        varusersmaxbandwidthdown:            undefined,
        varusersmaxbandwidthup:              undefined,
        varusersmaxtotaloctets:              undefined,
        varusersmaxtotaloctetstimerange:     'daily',
        varuserspassword:                    password,
        varuserspasswordencryption:          'MD5-Password',
        varuserspointoftime:                 'Daily',
        varusersreplyitemsadditionaloptions: undefined,
        varuserssessiontimeout:              undefined,
        varuserssimultaneousconnect:         undefined,
        varuserstopadditionaloptions:        undefined,
        varusersusername:                    username,
        varusersvlanid:                      undefined,
        varuserswisprredirectionurl:         undefined,
        xml:                                 'freeradius.xml'
    };
    
    var csrfToken = getCSRFToken();
    postParameters[csrfToken.name] = csrfToken.value;
    
    $.ajax({
        method: 'POST',
        url:    '/pkg_edit.php',
        data:   postParameters,
        async:  false
    });
    
    location.reload();
}

var users = $('tr[id*=id_]');
var table = $('table[summary=tabs]');

function sortUsers(field) {
    var sortedUsers = $.makeArray(users);

    sortedUsers.sort(
        function (a, b) {
            var aValue = $(a).find('td').eq(field).text();
            var bValue = $(b).find('td').eq(field).text();

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
