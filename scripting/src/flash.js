
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
        if (navbar.children('h1').length < 2) return;

        // The last h1 in the markup is the current flash.
        var h1 = navbar.children('h1').last();

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
