
// This code handles flash messages, i.e., notifications atop the page (in the navbar).

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
        var elem = navbar.children('h1').last();

        // Set and get new types, where appropriate.
        if (lastFlashType) navbar.removeClass(lastFlashType);
        lastFlashType = elem.data('flash-type');
        navbar.addClass(lastFlashType);

        elem
            .css({opacity: 0, top: 20})
            .animate({opacity: 1, top: 0}, 500)
            .delay(4000)
            .animate({opacity: 0, top: -20}, 500, function() {
                elem.remove();
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
