// Keep the footer copyright year current automatically so it never needs a
// manual update again. The "2026" in the HTML is just a fallback shown if,
// for any reason, this script doesn't run.
document.addEventListener('DOMContentLoaded', function () {
    var yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
});

// Note: an earlier version of this file also resized the testimonial
// carousel with JS on every slide change. That's gone now - it caused the
// page content below the carousel to shift on every slide, and touching the
// live slide element to measure it fought with Bootstrap's own slide
// animation (visible as a ghost/smear while sliding). The carousel now uses
// a fixed height with vertical centering, handled entirely in style.css -
// no JS needed for it at all.

// Note: the newsletter button briefly had a JS-driven "fade in, then
// pulse" entrance here (chaining two animate.css classes via
// animationend). Pulled it back out - the pulse's scale() transform
// interacting with the fade made it read as glitchy/unintentional rather
// than a deliberate effect. It's back to a single plain animate.css class
// with just a CSS animation-delay, the same pattern as every other
// animated element on the site (see #newsletterbtn in style.css) - no JS
// needed for it at all.

// Scroll-reveal: the "content fades/slides in as you scroll to it" effect
// common in WordPress page builders (Elementor, Divi, etc.). Everything
// above (hero, newsletter button, the 3 cards) animates once on page
// load, which only works because it's all near the top of the page -
// About Us, ASE Certified, testimonials, and Contact further down would
// have already finished "animating" (invisibly, off-screen) by the time
// anyone actually scrolls to them. This instead waits until each marked
// element scrolls into view, then plays one animate.css effect (from its
// data-aos attribute, e.g. data-aos="fadeInLeft") - once per element, not
// re-triggered every time you scroll past it again.
//
// Two patterns:
//   .scroll-reveal        - a single element that reveals itself.
//   .scroll-reveal-group  - a container (e.g. a whole row) that, the
//                           moment IT comes into view, reveals every
//                           .scroll-reveal-item inside it TOGETHER. Needed
//                           for side-by-side pairs like the About Us
//                           image+text: watching each column separately
//                           meant whichever one was a little shorter (and
//                           so sat centered a bit lower in the row) always
//                           crossed the trigger line slightly before the
//                           other, so they visibly played one after
//                           another instead of together. Watching the row
//                           as one unit and firing both children from that
//                           single event fixes that regardless of how
//                           their heights differ.
document.addEventListener('DOMContentLoaded', function () {
    var singleEls = document.querySelectorAll('.scroll-reveal');
    var groupEls = document.querySelectorAll('.scroll-reveal-group');
    if (!singleEls.length && !groupEls.length) {
        return;
    }

    function revealNow(el) {
        var effect = el.dataset.aos || 'fadeInUp';
        el.classList.add('animate__animated', 'animate__' + effect);
    }

    // Someone with "reduce motion" turned on at the OS/browser level has
    // said they don't want scroll/entrance animations - show everything
    // immediately instead of animating it in. (style.css covers the same
    // case if this script doesn't run at all.) Also the fallback if this
    // browser has no IntersectionObserver at all (very old browsers only).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        singleEls.forEach(function (el) {
            el.style.opacity = '1';
        });
        groupEls.forEach(function (el) {
            el.querySelectorAll('.scroll-reveal-item').forEach(function (child) {
                child.style.opacity = '1';
            });
        });
        return;
    }

    // threshold: 0.3 means 30% of the ELEMENT'S OWN area has to actually
    // be on screen before it counts as "visible" - this scales with each
    // element's own size, unlike a rootMargin-based fixed line across the
    // screen (tried previously at -20% and -50%), which different-height
    // elements near each other cross at inconsistent, uncoordinated
    // moments relative to how the page actually feels while scrolling.
    var options = { threshold: 0.3 };

    var singleObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
                return;
            }
            revealNow(entry.target);
            obs.unobserve(entry.target);
        });
    }, options);
    singleEls.forEach(function (el) {
        singleObserver.observe(el);
    });

    var groupObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.querySelectorAll('.scroll-reveal-item').forEach(revealNow);
            obs.unobserve(entry.target);
        });
    }, options);
    groupEls.forEach(function (el) {
        groupObserver.observe(el);
    });

    // Safety net: if anything is still hidden a while after the page
    // finishes loading (an observer that never fired for some reason, a
    // browser quirk, whatever), reveal it anyway rather than leaving
    // content permanently invisible.
    //
    // This was set to 4 SECONDS before, which was the real bug behind
    // "nothing below About Us ever animates" - anyone who spends more than
    // 4 seconds reading About Us before scrolling further (completely
    // normal) had every section below it force-revealed on this fixed
    // clock, instantly and with no animation, well before they actually
    // scrolled down to see it happen. 60 seconds is long enough that a
    // normal visitor scrolling through the page never hits it - the
    // observer reveals things as they're actually scrolled to - while
    // still catching a genuinely broken case eventually instead of
    // leaving something permanently invisible forever.
    window.setTimeout(function () {
        singleEls.forEach(function (el) {
            if (!el.classList.contains('animate__animated')) {
                singleObserver.unobserve(el);
                el.style.opacity = '1';
            }
        });
        groupEls.forEach(function (el) {
            var children = el.querySelectorAll('.scroll-reveal-item');
            var anyStillHidden = false;
            children.forEach(function (child) {
                if (!child.classList.contains('animate__animated')) {
                    anyStillHidden = true;
                }
            });
            if (anyStillHidden) {
                groupObserver.unobserve(el);
                children.forEach(function (child) {
                    child.style.opacity = '1';
                });
            }
        });
    }, 60000);
});

// Load Google's recaptcha script only once someone actually opens the
// newsletter modal, instead of on every single page visit regardless of
// whether they ever touch it. recaptcha/api.js used to sit directly inside
// the modal's HTML (see index.html, search "g-recaptcha") with no such
// guard - meaning every visitor downloaded and ran a fairly heavy piece of
// third-party Google code before they'd even seen the sign-up form, let
// alone decided to use it.
//
// This only matters on index.html, the only page with a #newsletter modal
// - about.html loads this same app.js file, so the "if" here is what keeps
// this a harmless no-op there instead of throwing an error looking for an
// element that doesn't exist on that page.
//
// How it works: recaptcha's own script scans the page for any
// ".g-recaptcha" element and fills it in automatically as soon as the
// script finishes loading - that div has been sitting in the HTML the
// whole time either way, so all this needs to do is add the <script> tag
// itself at the right moment (Bootstrap's "show.bs.modal" event, which
// fires right as the modal starts opening) rather than have it already
// sitting in the page from the start. The "already loaded" check keeps
// this from adding a second copy of the script if someone closes and
// reopens the modal more than once in the same visit.
var newsletterModalEl = document.getElementById('newsletter');
if (newsletterModalEl) {
    newsletterModalEl.addEventListener('show.bs.modal', function () {
        if (document.querySelector('script[src="https://www.google.com/recaptcha/api.js"]')) {
            return;
        }
        var recaptchaScript = document.createElement('script');
        recaptchaScript.src = 'https://www.google.com/recaptcha/api.js';
        document.body.appendChild(recaptchaScript);
    });
}

// Contact form ("Send Us a Message" modal): submit it with fetch instead of
// letting the browser do a plain HTML POST. A plain POST works fine and
// still reaches Formspree either way, but it also navigates the whole page
// away to Formspree's own generic "Thanks! The form was submitted
// successfully." page on formspree.io - visibly leaving the site. This
// intercepts that submit, sends the exact same data in the background, and
// swaps in a "Thank you!" message right here in the modal instead (same
// show/hide-a-sibling-div pattern as .row-form/.row-success on the
// newsletter form above) so a visitor never leaves the page at all.
//
// The submit button lives in the modal-footer, outside <form id="form1">
// itself, wired up via its form="form1" attribute - clicking it still
// fires this form's "submit" event same as a button inside the form would.
var contactForm = document.getElementById('form1');
if (contactForm) {
    var contactFormWrap = document.querySelector('.contact-row-form');
    var contactSuccessWrap = document.querySelector('.contact-row-success');
    var contactSubmitBtn = document.getElementById('contactSubmitBtn');

    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (contactSubmitBtn) {
            contactSubmitBtn.disabled = true;
            contactSubmitBtn.textContent = 'Sending...';
        }

        fetch(contactForm.action, {
            method: 'POST',
            body: new FormData(contactForm),
            headers: { 'Accept': 'application/json' }
        }).then(function (response) {
            if (!response.ok) {
                throw new Error('Formspree returned an error response');
            }
            if (contactFormWrap) {
                contactFormWrap.style.display = 'none';
            }
            if (contactSuccessWrap) {
                contactSuccessWrap.style.display = '';
            }
            if (contactSubmitBtn) {
                contactSubmitBtn.style.display = 'none';
            }
            contactForm.reset();
        }).catch(function () {
            // Formspree unreachable, or it rejected the submission (e.g. the
            // receiving email was never verified in Formspree's dashboard).
            // Left as a plain alert rather than a styled inline error - this
            // is the rare/unexpected path, not the one worth polishing.
            window.alert("Sorry, something went wrong sending your message. Please call us instead at (408) 263-3339.");
            if (contactSubmitBtn) {
                contactSubmitBtn.disabled = false;
                contactSubmitBtn.textContent = 'Submit';
            }
        });
    });

    // Bootstrap doesn't destroy/recreate this modal's contents between
    // opens, it just shows/hides the same DOM - without this, closing the
    // modal after a successful send and reopening it to send a second
    // message would still be stuck showing "Thank you!" instead of the
    // form. Resets back to the input form each time the modal is closed.
    var messageModalEl = document.getElementById('messageModal');
    if (messageModalEl) {
        messageModalEl.addEventListener('hidden.bs.modal', function () {
            if (contactFormWrap) {
                contactFormWrap.style.display = '';
            }
            if (contactSuccessWrap) {
                contactSuccessWrap.style.display = 'none';
            }
            if (contactSubmitBtn) {
                contactSubmitBtn.style.display = '';
                contactSubmitBtn.disabled = false;
                contactSubmitBtn.textContent = 'Submit';
            }
        });
    }
}

// Customer reviews carousel: stop auto-advancing for good the moment a
// visitor manually swipes it or taps a control (an arrow or one of the dot
// indicators), instead of letting it keep auto-rotating underneath them
// while they're clearly already reading it by hand. Slowing the per-review
// timing (see index.html, each .carousel-item's own data-bs-interval) is
// the main fix for testers reporting it moves too fast to read - this is
// a second layer on top of that: once someone shows they're in control of
// it, it should stay that way for the rest of their visit, not silently
// resume auto-advancing out from under them a minute later.
//
// Selectors updated (Sept 2026) to match each review's own in-flow
// .review-nav copy of the arrows/dots (see index.html and style.css) -
// there are 3 copies in the DOM now, one per review, but only the one
// belonging to the currently-visible review is ever actually visible/
// clickable at a time, so querying all of them and attaching a once-only
// listener to each is equivalent to the single shared bar this replaced.
var reviewsCarouselEl = document.getElementById('carouselExampleControls');
if (reviewsCarouselEl) {
    reviewsCarouselEl.addEventListener('touchstart', stopReviewsAutoplay, { once: true });
    reviewsCarouselEl.querySelectorAll('.review-nav-arrow, .review-dots button').forEach(function (control) {
        control.addEventListener('click', stopReviewsAutoplay, { once: true });
    });
}
function stopReviewsAutoplay() {
    bootstrap.Carousel.getOrCreateInstance(reviewsCarouselEl).pause();
}
