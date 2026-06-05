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
      const href = link.getAttribute('href');
      const isSamePage = href && href.startsWith('#');

      if (isSamePage) {
        // Ancla interna: prevent default + smooth scroll
        e.preventDefault();
        if (isMenuOpen) toggleMenu();
        lenis.scrollTo(href, {
          offset: -100,
          duration: 1.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        // Página externa: cierra menú y deja navegar normalmente
        if (isMenuOpen) toggleMenu();
        // Sin preventDefault → el navegador navega al href
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
  // 5. HOVER REVEAL — VIDEO solo en zona de contenido (no en padding del li)
  // ==========================================================================
  const hoverContainer  = document.getElementById('hoverRevealContainer');
  const hoverVideo      = document.getElementById('hoverRevealVideo');
  // CLAVE: el trigger es el div .hli-content, NO el li completo.
  // Así el video solo aparece cuando el cursor está sobre el texto,
  // no en las zonas de padding superior/inferior del ítem (zonas rojas).
  const videoTriggers   = document.querySelectorAll('.video-hover-trigger .hli-content');

  if (hoverContainer && hoverVideo && window.matchMedia('(pointer: fine)').matches) {

    // El contenedor sigue al ratón con GSAP suavizado
    window.addEventListener('mousemove', (e) => {
      gsap.to(hoverContainer, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.55,
        ease: 'power3.out'
      });
    });

    videoTriggers.forEach(contentEl => {
      // Sube al li padre para leer el atributo data-video
      const videoSrc = contentEl.closest('.video-hover-trigger').getAttribute('data-video');

      contentEl.addEventListener('mouseenter', () => {
        if (hoverVideo.getAttribute('src') !== videoSrc) {
          hoverVideo.src = videoSrc;
          hoverVideo.load();
          hoverVideo.play().catch(() => {});
        }
        hoverContainer.classList.add('active');
        hoverContainer.setAttribute('aria-hidden', 'false');
      });

      contentEl.addEventListener('mouseleave', () => {
        hoverContainer.classList.remove('active');
        hoverContainer.setAttribute('aria-hidden', 'true');
      });
    });
  }


  // ==========================================================================
  // 5b. VIDEO EXPANSIVO — GSAP ScrollTrigger BIDIRECCIONAL
  //     Fase 1 (50%):  40vw  → 100vw  /  border-radius 40px → 0px
  //     Fase 2 (50%): 100vw  →  40vw  /  border-radius  0px → 40px
  //     scrub: true  garantiza que siga el scroll en ambas direcciones
  // ==========================================================================
  const expandingSection = document.getElementById('expanding-video');
  const expandingWrap    = document.getElementById('expandingVideoWrap');

  if (expandingSection && expandingWrap) {
    const tlExpand = gsap.timeline({
      scrollTrigger: {
        trigger: expandingSection,
        // La sección ocupa 80vh; queremos que la animación cubra todo el scroll de ella
        start: 'top bottom',    // empieza cuando el tope de la sección entra por abajo
        end:   'bottom top',    // termina cuando el fondo de la sección sale por arriba
        scrub: 1.2,             // lag suave atado a Lenis
        invalidateOnRefresh: true
      }
    });

    // Fase EXPAND: de pequeño a pantalla completa (primeras 2/3 del scroll)
    tlExpand.fromTo(expandingWrap,
      { width: '40vw',  borderRadius: '40px' },
      { width: '100vw', borderRadius: '0px',  ease: 'power2.inOut', duration: 2 }
    )
    // Fase RETRACT: vuelve a su tamaño original (tercio final del scroll)
    .to(expandingWrap,
      { width: '40vw',  borderRadius: '40px', ease: 'power2.inOut', duration: 2 }
    );
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

  // ==========================================================================
  // 7. CUSTOM CURSOR — Sigue al ratón con GSAP + crece en hover
  // ==========================================================================
  const cursor = document.getElementById('customCursor');

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    // Movimiento suave con GSAP
    window.addEventListener('mousemove', (e) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.15,
        ease: 'power2.out'
      });
    });

    // Crece al pasar por encima de a, button
    const hoverables = document.querySelectorAll('a, button, .huge-list-item');
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });

    // Ocultar cursor al salir de la ventana
    document.addEventListener('mouseleave', () => gsap.to(cursor, { opacity: 0, duration: 0.3 }));
    document.addEventListener('mouseenter', () => gsap.to(cursor, { opacity: 1, duration: 0.3 }));
  }

  // ==========================================================================
  // 8. MOSAICO 4 PILARES — Flip animación izquierda/derecha según dirección
  // ==========================================================================
  const pillars = document.querySelectorAll('.pillar');

  pillars.forEach(pillar => {
    let exitTimer = null;

    pillar.addEventListener('mouseenter', (e) => {
      // Cancelar timer de salida si existe
      if (exitTimer) { clearTimeout(exitTimer); exitTimer = null; }

      const rect = pillar.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;

      // Detectar desde qué lado entra el cursor
      if (e.clientX <= midX) {
        // Cursor viene del lado izquierdo: back entra desde la izquierda
        pillar.classList.add('from-left');
        pillar.classList.remove('from-right');
      } else {
        // Cursor viene del lado derecho: back entra desde la derecha
        pillar.classList.remove('from-left');
        pillar.classList.add('from-right');
      }

      pillar.classList.add('is-active');
    });

    pillar.addEventListener('mouseleave', () => {
      pillar.classList.remove('is-active');
      // Limpiar clases de dirección después de que termine la transición (0.55s)
      exitTimer = setTimeout(() => {
        pillar.classList.remove('from-left', 'from-right');
      }, 600);
    });
  });

  // Refresh ScrollTrigger after loading ensures correct calculations
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

});
