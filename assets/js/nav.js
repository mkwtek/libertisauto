// Shared navbar, injected into every page's #site-nav placeholder
// (index.html, about.html, and any page added later). To change the nav -
// add a link, adjust styling classes, fix a typo - edit the HTML string
// below ONCE, and every page picks up the change automatically. That's the
// whole point of this file: the About Us page's nav drifting out of sync
// with the homepage's is exactly the problem this solves.
//
// This is a plain JS template string rather than a fetch()'d separate
// nav.html file, on purpose: fetch() is blocked by the browser's own
// security rules when a page is opened directly from a folder (the
// file:// protocol) instead of served through something like Live Server
// or a real host - this way works identically either way, nothing extra
// to configure or remember.
//
// Every internal link below points to "./index.html#..." rather than a
// bare "#...". That's deliberate: Home, Questions, Reviews, and Contact
// only exist as sections on the homepage - about.html (and any future
// page) has none of them. A link to "./index.html#questions-section"
// still works correctly from index.html itself: since that resolves to
// the exact same page it's already on, the browser just treats it as an
// ordinary same-page jump, not a reload. That's what makes ONE shared
// version of this nav correct on every page at once, with no per-page
// variations needed.
//
// Reported bug (Sept 2026), worse on Safari/iPhone: reloading the page,
// or a fresh visitor opening a shared link to it, sometimes lands
// scrolled near the bottom of the page instead of the top or the intended
// section. Root cause: clicking a nav link used to rewrite the address
// bar's #hash via history.replaceState (further down this file, in
// scrollToTarget - search "This used to also call" for that removal) so
// the URL would reflect whichever section you'd last scrolled to. That
// meant an ordinary visit (click Contact, look around, hit refresh later)
// left something like ".../index.html#contact" sitting in the address
// bar, and browsers try to act on whatever #hash is in the URL on every
// load - reliably jumping back to that section on every later plain
// refresh, which reads as "refreshing sends me to the bottom of the page"
// even though the code is doing exactly what that hash says. That
// replaceState call has been removed for exactly this reason.
//
// Two more defensive fixes below, both run immediately, before anything
// else in this file (this script sits right at the very top of <body>,
// specifically so it runs before the browser gets a chance to act on the
// page's own initial #hash) - these matter for the cases that CAN still
// legitimately put a #hash in the URL (a visitor typing/sharing a direct
// link like ".../index.html#contact", or clicking one of the plain anchor
// buttons this file doesn't intercept, e.g. "Read More in FAQ's" further
// down the page, which the browser's own native anchor handling still
// updates the address bar for):
//
// 1) history.scrollRestoration = 'manual' stops the browser from silently
//    trying to restore whatever scroll position it remembers from last
//    time this exact history entry was open, instead of scrolling based
//    on the URL's actual current #hash (or lack of one). Safari especially
//    has been inconsistent about which remembered offset belongs to which
//    hash state when the URL changes without a new history entry.
//
// 2) Taking manual control of the INITIAL #hash scroll instead of
//    trusting each browser's native "jump to the fragment on load"
//    behavior. That native behavior can fire before this very script has
//    replaced the empty #site-nav placeholder with the real, much taller
//    sticky navbar just below - meaning the browser doesn't yet know how
//    tall the navbar actually is when it decides where "the top of that
//    section" is, and unlike a click (handled by this file's own code
//    further down, which already benefits from scroll-padding-top in
//    style.css), it doesn't get a second attempt once the navbar and any
//    images below it settle into their real, final layout.
//
//    Fix: immediately strip the hash from the visible URL before the
//    browser gets a chance to act on it, remember it, then scroll to it
//    ourselves - instantly, not smoothly, matching how a browser's own
//    native initial-load jump behaves - once the page (including images)
//    has actually finished loading and settled. See the "window.load"
//    listener further down this file for the second half of this.
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
var initialHash = window.location.hash ? window.location.hash.slice(1) : null;
if (initialHash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
}
//
// The <nav> below does NOT carry Bootstrap's "fixed-top" class, even
// though a normal Bootstrap navbar usually does - that class sets
// position:fixed, but this navbar deliberately uses position:sticky
// instead (see style.css, search for "NAVBAR POSITIONING" for the full
// reasoning). "fixed-top" used to be left in the markup alongside the
// sticky CSS override, which worked, but read as if the navbar were
// fixed when it wasn't - it's been removed here so the markup matches
// what actually happens. Everything fixed-top used to provide (pinning
// to the top, layering above the rest of the page) is set directly in
// style.css's nav.navbar rule now instead.
const SITE_NAV_HTML = `
    <nav class="navbar navbar-expand-lg bg-dark navbar-dark py-3 border-bottom border-secondary">
        <div class="container">
            <!-- aria-hidden on both icons: the link already has its own
                 aria-label ("Liberti's Auto Electric - Home") that says
                 everything a screen reader needs, so without this a screen
                 reader was also announcing "car icon" and "activity icon"
                 first - two extra, meaningless words before it ever got to
                 the actual name. These are purely decorative flourishes for
                 sighted users, same as any other icon-next-to-visible-text
                 pairing on this page. (The red activity icon's color was
                 also right at the edge of passing contrast against this
                 dark navbar background - moot now that it's hidden from
                 screen readers entirely, but worth knowing if it's ever
                 reused somewhere a person needs to actually read it as
                 text.) -->
            <a href="./index.html" class="navbar-brand" aria-label="Liberti's Auto Electric - Home">
                <span class="navbar-brand-icons"><i id="nav_car_in" class="bi bi-car-front-fill text-light animate__animated animate__lightSpeedInLeft" aria-hidden="true"></i><i id="navflash" class="bi bi-activity text-danger animate__animated animate__flash" aria-hidden="true"></i></span><span id="navlibertis" class="animate__animated animate__fadeIn">Liberti's <br class="brand-break">Auto Electric</span>
            </a>

            <button
                class="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navmenu"
                aria-controls="navmenu"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span class="hamburger-icon">
                    <span class="hamburger-bar"></span>
                    <span class="hamburger-bar"></span>
                    <span class="hamburger-bar"></span>
                </span>
            </button>

            <div class="collapse navbar-collapse" id="navmenu">
                <!-- aria-hidden="true" added to every icon below: each one
                     sits right next to its own visible text label ("Home",
                     "About Us", etc.), so a screen reader announcing the
                     icon too (e.g. "house door icon, Home") is just adding
                     noise, not information - the icon doesn't say anything
                     the text next to it doesn't already say on its own.

                     Icons use the "nav-icon" class (styled in style.css)
                     instead of Bootstrap's text-white-50 they used to carry -
                     that gave them a translucent white, unrelated to any
                     other color already in use on this navbar. nav-icon
                     matches them to the same solid grey the nav-link text
                     itself turns on hover, so the icons read as a
                     consistent, deliberate accent color next to the white
                     link text instead of a half-transparent white. -->
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a href="./index.html" id="navhome" class="nav-link animate__animated animate__fadeInRight"><i class="bi bi-house-door nav-icon" aria-hidden="true">&#160;</i> Home</a>
                    </li>
                    <li class="nav-item">
                        <a href="./index.html#about" id="navabout" class="nav-link animate__animated animate__fadeInRight"><i class="bi bi-info-circle nav-icon" aria-hidden="true">&#160;</i> About Us</a>
                    </li>
                    <li class="nav-item">
                        <a href="./index.html#questions-section" id="navquest" class="nav-link animate__animated animate__fadeInRight"><i class="bi bi-question-circle nav-icon" aria-hidden="true">&#160;</i> Questions</a>
                    </li>
                    <li class="nav-item">
                        <a href="./index.html#reviews" id="navrev" class="nav-link animate__animated animate__fadeInRight"><i class="bi bi-people-fill nav-icon" aria-hidden="true">&#160;</i> Reviews</a>
                    </li>
                    <li class="nav-item">
                        <a href="./index.html#contact" id="navcon" class="nav-link animate__animated animate__fadeInRight"><i class="bi bi-telephone nav-icon" aria-hidden="true"></i>&#160;<i class="bi bi-envelope-at nav-icon" aria-hidden="true">&#160;</i> Contact</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
`;

// No DOMContentLoaded wait needed here: this script tag is placed directly
// after <div id="site-nav"></div> in the page, so by the time this line
// runs, the browser has already parsed and inserted that placeholder -
// injecting immediately (rather than waiting for the whole page to finish
// loading) means the nav appears with no flash or delay, exactly as if it
// had been written directly into the page.
//
// outerHTML, not innerHTML, and this matters for the navbar's sticky
// positioning (position:sticky, in style.css - search that file for
// "NAVBAR POSITIONING"): innerHTML would leave <nav> sitting INSIDE the
// <div id="site-nav"> wrapper, and that wrapper div has no content of its
// own besides the nav - so its box would end up exactly as tall as the
// navbar and nothing more. A sticky element can only stay pinned for as
// much extra height as its parent box gives it room to move within, so a
// parent that's the exact same height as the sticky child gives it
// nowhere to stick TO - the navbar would fall out of "stuck" mode within
// a pixel or two of scrolling and just scroll away normally, needing a
// full scroll back to the very top of the page to reappear. That exact
// symptom is what using outerHTML here fixes: it replaces the wrapper div
// itself with the navbar markup, so <nav> becomes a direct child of
// <body> instead - and <body> is as tall as the entire page, giving the
// sticky navbar all the room it needs to stay pinned through the whole
// scroll, top to bottom.
document.getElementById('site-nav').outerHTML = SITE_NAV_HTML;

// Auto-close the mobile dropdown once a nav link is clicked, instead of
// making someone tap the "X"/hamburger themselves afterward. Bootstrap's
// own Collapse API (from bootstrap.bundle.min.js) handles this rather than
// us toggling a class by hand, so the closing animation and the toggler's
// aria-expanded state stay exactly in sync with how Bootstrap opens it.
//
// FIXES A REAL BUG: clicking a same-page link (About Us, Questions,
// Reviews, Contact) while the mobile menu was open used to let two things
// happen on top of each other - Bootstrap's menu-closing animation, and
// the browser's own smooth-scroll to that section - because the old code
// just called hide() and let the browser handle the click's normal jump-
// to-section behavior at the very same time. On a real phone, those two
// competing animations threw the scroll off and it landed well past
// where the section actually starts - measured directly, on a 390px-wide
// screen the target section's top edge ended up over 200px ABOVE the top
// of the screen (scrolled straight past its heading) instead of landing
// where html's scroll-padding-top says it should. This one wasn't
// visible on desktop, which is what made it easy to miss before: at
// desktop widths the menu is never actually open in the first place (see
// below), so there was nothing for the scroll to compete with there -
// but simply calling hide() on it was NOT the harmless no-op it looked
// like either - see the desktop branch below for why calling it there
// unconditionally caused the exact same kind of misfire, just a smaller,
// easier-to-miss one.
//
// Fix: intercept the click instead of letting the browser jump
// immediately. If the mobile menu is actually open (checked via
// #navmenu's own "show" class, the same class Bootstrap itself uses to
// mean "fully open"), close it FIRST and wait for Bootstrap's own
// "hidden.bs.collapse" event - fired only once the close animation has
// completely finished - before scrolling. That guarantees the two
// animations never run at the same time, so the scroll always lands
// exactly where it should. At desktop widths, #navmenu's "show" class is
// never set in the first place (the toggle button that would add it is
// hidden via CSS there, so nobody ever clicks it) - hide() is skipped
// entirely rather than called "just in case", and the page scrolls
// immediately since there's no menu to wait on.
//
// Note on timing: this line runs immediately, synchronously, right after
// the nav markup above is injected - same as the rest of this file, no
// DOMContentLoaded wait needed since #navmenu already exists in the DOM by
// this point. bootstrap.bundle.min.js itself is loaded further down the
// page (after this script tag), so the `bootstrap` global isn't defined
// yet at this exact line - but that's fine, since we're only ATTACHING the
// click listeners now. The actual bootstrap.Collapse call inside each
// listener doesn't run until a real person clicks a link, by which point
// the whole page - including that script - has already finished loading.
var navmenuEl = document.getElementById('navmenu');
if (navmenuEl) {
    navmenuEl.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function (event) {
            // Home ("./index.html", no "#section") and any link pointing to
            // a section that doesn't exist on THIS page (e.g. clicking
            // "About Us" while actually on about.html, which has no
            // #about of its own) both fall through to the browser's normal
            // click behavior untouched - there's no on-page scroll for
            // this script to manage in either case, just an ordinary page
            // navigation.
            var hash = link.getAttribute('href').split('#')[1];
            var target = hash ? document.getElementById(hash) : null;
            if (!target) {
                return;
            }
            event.preventDefault();

            function scrollToTarget() {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // This used to also call history.replaceState(null, '', '#'
                // + hash) here, to keep the address bar in sync with which
                // section was showing. Removed (Sept 2026): that's exactly
                // what caused the "refresh randomly/reliably lands scrolled
                // near the bottom" bug - clicking around the nav left a
                // #hash sitting in the address bar (e.g. "#contact"), and
                // a later plain page refresh with that hash still present
                // triggers this file's own initial-hash-scroll logic further
                // up, or the browser's own native one, EVERY time, not just
                // when a visitor actually meant to deep-link there. Losing
                // "the address bar reflects whichever section you last
                // scrolled to via the nav" is a minor cosmetic downgrade,
                // not a functional one - direct #hash links (typed, shared,
                // or from a plain anchor like the "Read More in FAQ's"
                // buttons, which aren't handled by this file at all) still
                // work correctly, they just don't linger in the address bar
                // afterward waiting to cause this on a later plain refresh.
            }

            if (navmenuEl.classList.contains('show')) {
                navmenuEl.addEventListener('hidden.bs.collapse', function () {
                    // The setTimeout here (even at 0ms) is doing real work,
                    // not padding for safety - measured directly, calling
                    // scrollToTarget() straight from this event still
                    // landed on the same wrong, too-far-down spot as
                    // before. "hidden.bs.collapse" fires the moment
                    // Bootstrap considers the close animation done, but a
                    // couple of its own cleanup steps (clearing the
                    // dropdown's leftover inline height among them) run
                    // right AFTER that event fires, not before it - so
                    // code reacting to the event immediately, in the same
                    // tick (including from requestAnimationFrame, tested
                    // and confirmed still too early), can still catch the
                    // page a half-moment before it's actually done
                    // settling into its final, post-close layout.
                    // setTimeout(fn, 0) queues this for the NEXT tick,
                    // after that cleanup has definitely run, so the
                    // section's real resting position is what actually
                    // gets scrolled to.
                    setTimeout(scrollToTarget, 0);
                }, { once: true });
                bootstrap.Collapse.getOrCreateInstance(navmenuEl).hide();
            } else {
                scrollToTarget();
            }
        });
    });
}

// Reported symptom (real phone, not desktop testing): right after tapping
// the hamburger to open the mobile menu, part of the right side of the
// screen briefly goes blank white for a second or two, then the page
// snaps back to its correct full width on its own with no further
// interaction needed.
//
// The likely cause: opening this menu adds a few hundred pixels of page
// height all at once (going from a collapsed navbar to the full open
// dropdown). Some mobile browsers can briefly mis-render the page after a
// sudden, large height change like that - the page's true layout is
// correct the whole time, the browser just hasn't repainted it correctly
// yet - and they catch up and repaint correctly a moment later on their
// own, which matches "fixes itself after a second or two" exactly.
//
// The fix below is a standard, low-risk trick for exactly this situation:
// scroll the page by 1 pixel and immediately back by 1 pixel. That's too
// small to see or feel, but scrolling is one of the few things that
// reliably forces a mobile browser to double check its own layout right
// away, instead of waiting until whatever it was waiting for anyway.
//
// "shown.bs.collapse" is a Bootstrap event that fires once the menu has
// fully finished opening (the slide-down animation is done) - not the
// instant it's clicked, since Bootstrap needs the menu at its real final
// height first for this nudge to matter.
//
// One honest caveat: this can only be confirmed on an actual phone -
// there's no way to reproduce a real mobile browser's rendering behavior
// in ordinary desktop testing (Chrome DevTools' device emulation included
// - it doesn't have this quirk at all, it's specific to real mobile
// browsers). If this doesn't fully clear up the white flash, that's
// useful information pointing at something else, not a sign this
// particular fix was wrong to try.
navmenuEl.addEventListener('shown.bs.collapse', function () {
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
});

// Reported symptom: tapping the "X" to close the mobile menu, the
// retract-upward animation visibly paused for a moment partway through,
// then finished on its own. This was FIRST guessed to be the same class of
// mobile-only repaint quirk as the open-side white-flash fix above, and a
// matching scrollBy nudge was added here on that theory - but the person
// who reported it then confirmed the pause reproduces in plain Chrome
// DevTools too, which that theory could never explain (the open-side
// quirk genuinely doesn't reproduce outside a real phone - this one does,
// so it was never the same bug).
//
// Measuring the actual close animation frame-by-frame (not guessing)
// found the real cause, and it had nothing to do with mobile rendering at
// all: it's a plain CSS box-model limit. See style.css, search
// "IMPORTANT: this padding lives on .navbar-nav" for the full
// explanation and the fix (moving the open-dropdown's top/bottom padding
// off the element Bootstrap actually animates) - that's what actually
// fixes the pause.
//
// This scrollBy nudge is kept only as a harmless leftover safety net, on
// the same reasoning as the confirmed open-side fix above (in case some
// real mobile browser also briefly mis-renders after this particular
// height change) - it is NOT what fixes the reported pause, that's the
// CSS change. "hidden.bs.collapse" fires once Bootstrap's own closing
// animation has fully finished - separate from (and unrelated to) the
// other "hidden.bs.collapse" listener earlier in this file, which only
// attaches itself temporarily, once, and only when a nav LINK (not the
// "X") is what closed the menu. Both listeners fire independently without
// conflicting.
navmenuEl.addEventListener('hidden.bs.collapse', function () {
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
});

// Second half of the initial-#hash fix at the very top of this file: that
// code already stripped any #hash the page was opened with out of the
// visible URL before the browser could act on it. Now that the whole page
// (images included) has actually finished loading, scroll to it ourselves
// - deliberately, once, with the layout fully settled - instead of
// leaving it to each browser's own native (and here, unreliable) jump-to-
// fragment-on-load behavior. behavior: 'auto' (instant), not 'smooth', to
// match what a normal initial-load anchor jump looks like - this is a
// fresh page load, not a click a visitor just made, so an animated scroll
// here would just read as slow rather than as feedback for anything.
// scroll-padding-top (style.css) still applies to scrollIntoView() the
// same as it does for the click-based version of this further up, so this
// lands with the section's own heading clear of the sticky navbar too.
if (initialHash) {
    window.addEventListener('load', function () {
        window.setTimeout(function () {
            var target = document.getElementById(initialHash);
            if (target) {
                target.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
            history.replaceState(null, '', '#' + initialHash);
        }, 50);
    });
}
