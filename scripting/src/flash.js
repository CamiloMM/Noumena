
// This code handles flash messages, i.e., notifications atop the page (in the navbar).
// Use them from node as req.flash('type', 'msg') where type is good|bad|cool|boring.

module.exports = function(utils, $, _) {
    // Cache for last encountered flash type.
    var lastFlashType;

    // Don't transverse the whole DOM every time.
    var navbar = $('#navbar');

    // Animate the flash messages.
    function animateFlash() {
        // When only one h1 remains, it is the title.
        if (navbar.children('h1').length < 2) {
            // This is in case we're removing outdated flash messages.
            return navbar
                .removeClass('flash')
                .children('h1')
                .css({opacity: 1, top: 0});
        }

        // Get last flash increment, to should prevent old messages from showing again.
        // (Can happen when navigating back if the browser caches pages, like Chrome.)
        var lastFlashStamp = +sessionStorage.getItem('lastFlashStamp');

        // The last h1 in the markup is the current flash.
        var h1 = navbar.children('h1').last();
        var increment = +h1.data('increment');

        if (increment <= lastFlashStamp) {
            navbar.removeClass(h1.data('flash-type'));
            h1.remove();
            return animateFlash();
        }

        // Set and get new types, where appropriate.
        if (lastFlashType) navbar.removeClass(lastFlashType);
        lastFlashType = h1.data('flash-type');
        navbar.addClass(lastFlashType);

        h1
            .css({opacity: 0, top: 20})
            .animate({opacity: 1, top: 0}, 300)
            .delay(4400)
            .animate({opacity: 0, top: -20}, 300, function() {
                h1.remove();
                sessionStorage.setItem('lastFlashStamp', increment);
                if (navbar.children('h1').length < 2)
                    restoreTitle();
                else
                    animateFlash();
            });
    }

    // Restore page title after last flash message.
    function restoreTitle() {
        navbar
            .removeClass('flash ' + lastFlashType)
            .children('h1')
            .css({opacity: 0, top: 20})
            .animate({opacity: 1, top: 0}, 500);
    }

    animateFlash();
}
