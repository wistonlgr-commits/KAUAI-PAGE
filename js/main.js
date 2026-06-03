document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. LENIS SMOOTH SCROLL INITIALIZATION
  // ==========================================================================
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Sync GSAP ScrollTrigger with Lenis
  gsap.registerPlugin(ScrollTrigger);
  
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0, 0);


  // ==========================================================================
  // 2. THEME TOGGLE LOGIC (LIGHT / DARK)
  // ==========================================================================
  const themeToggle = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;

  // Check LocalStorage or OS preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'light' || (!savedTheme && !systemPrefersDark)) {
    htmlElement.classList.replace('dark-mode', 'light-mode');
    htmlElement.setAttribute('data-theme', 'light');
  }

  themeToggle.addEventListener('click', () => {
    const isDark = htmlElement.classList.contains('dark-mode');
    if (isDark) {
      htmlElement.classList.replace('dark-mode', 'light-mode');
      htmlElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.classList.replace('light-mode', 'dark-mode');
      htmlElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });


  // ==========================================================================
  // 3. OVERLAY MENU LOGIC
  // ==========================================================================
  const menuBtn = document.getElementById('menuBtn');
  const overlayMenu = document.getElementById('overlayMenu');
  const menuLinks = document.querySelectorAll('.menu-link');
  let isMenuOpen = false;

  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
    menuBtn.setAttribute('aria-expanded', isMenuOpen);
    overlayMenu.setAttribute('aria-hidden', !isMenuOpen);
    if (isMenuOpen) { lenis.stop(); } else { lenis.start(); }
  };

  if (menuBtn) { menuBtn.addEventListener('click', toggleMenu); }

  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (isMenuOpen) toggleMenu();
      const targetId = link.getAttribute('href');
      if (targetId !== '#') {
        lenis.scrollTo(targetId, {
          offset: -100, // Account for fixed header
          duration: 1.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      }
    });
  });


  // ==========================================================================
  // 4. GSAP SCROLL ANIMATIONS
  // ==========================================================================

  // A. Hero Animation (Plays on Load)
  const tlHero = gsap.timeline();
  tlHero.fromTo('.hero-title .title-line', 
    { y: 100, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: "power4.out", delay: 0.2 }
  )
  .fromTo('.gsap-fade-up', 
    { y: 40, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" }, 
    "-=0.8"
  );

  // B. Scroll Reveal for standard sections
  const fadeElements = document.querySelectorAll('section:not(.section-hero) .gsap-fade-up');
  fadeElements.forEach(el => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none reverse"
      },
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out"
    });
  });

  // C. Huge Marquee Infinite Scroll
  const marquees = document.querySelectorAll('.marquee-track');
  marquees.forEach(track => {
    gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 20,
      repeat: -1
    });
  });

  // D. TESTIMONIALS - HORIZONTAL PINNED SCROLL (CRÍTICO)
  const testiSection = document.getElementById('testimonials');
  const testiTrack = document.getElementById('testiTrack');
  
  if (testiSection && testiTrack) {
    // Determine how far to slide. Track width minus viewport width.
    const getScrollAmount = () => -(testiTrack.scrollWidth - window.innerWidth);
    
    gsap.to(testiTrack, {
      x: getScrollAmount,
      ease: "none",
      scrollTrigger: {
        trigger: testiSection,
        start: "top top", // When top of section hits top of viewport
        end: () => `+=${testiTrack.scrollWidth}`, // Scroll distance equals total width
        pin: true, // Freeze vertical scroll
        scrub: 1,  // Smoothly tie horizontal movement to scroll
        invalidateOnRefresh: true // Recalculate on resize
      }
    });
  }


  // ==========================================================================
  // 5. HOVER REVEAL LOGIC (SERVICES)
  // ==========================================================================
  const hoverContainer = document.getElementById('hoverRevealContainer');
  const hoverInner = document.getElementById('hoverRevealInner');
  const hoverTriggers = document.querySelectorAll('.hover-trigger');

  if (hoverContainer && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener('mousemove', (e) => {
      gsap.to(hoverContainer, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.5,
        ease: "power3.out"
      });
    });

    hoverTriggers.forEach(trigger => {
      trigger.addEventListener('mouseenter', () => {
        const color = trigger.getAttribute('data-color') || '#1D4ED8';
        hoverInner.style.backgroundColor = color;
        hoverContainer.classList.add('active');
        hoverContainer.setAttribute('aria-hidden', 'false');
      });

      trigger.addEventListener('mouseleave', () => {
        hoverContainer.classList.remove('active');
        hoverContainer.setAttribute('aria-hidden', 'true');
      });
    });
  }


  // ==========================================================================
  // 6. MAGNETIC BUTTON LOGIC (FOOTER)
  // ==========================================================================
  const magneticWrap = document.getElementById('magneticWrap');
  const magneticBtn = document.getElementById('magneticBtn');

  if (magneticWrap && magneticBtn && window.matchMedia("(pointer: fine)").matches) {
    const btnText = magneticBtn.querySelector('span');

    magneticWrap.addEventListener('mousemove', (e) => {
      const rect = magneticWrap.getBoundingClientRect();
      const h = rect.width / 2;
      
      const x = e.clientX - rect.left - h;
      const y = e.clientY - rect.top - h;

      // Move the button itself
      gsap.to(magneticBtn, {
        x: x * 0.4,
        y: y * 0.4,
        duration: 0.4,
        ease: "power3.out"
      });

      // Move the text slightly more for a parallax effect
      gsap.to(btnText, {
        x: x * 0.2,
        y: y * 0.2,
        duration: 0.4,
        ease: "power3.out"
      });
    });

    magneticWrap.addEventListener('mouseleave', () => {
      gsap.to([magneticBtn, btnText], {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.3)"
      });
    });
  }

  // Refresh ScrollTrigger after loading ensures correct calculations
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

});
