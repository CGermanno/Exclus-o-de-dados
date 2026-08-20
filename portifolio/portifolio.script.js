(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js-enabled");

  const header = document.querySelector("[data-header]");
  const progressBar = document.querySelector(".scroll-progress span");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let ticking = false;

  const updateScrollUI = () => {
    const scrollTop = window.scrollY || root.scrollTop;
    const scrollable = Math.max(root.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(scrollTop / scrollable, 0), 1);

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    if (header) {
      header.classList.toggle("is-scrolled", scrollTop > 24);
    }

    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollUI);
      ticking = true;
    }
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  updateScrollUI();

  const navLinks = [
    ...document.querySelectorAll(".nav-links a[href^='#'], .nav-contact[href^='#']")
  ];
  const observedSections = [
    ...new Set(
      navLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean)
    )
  ];

  if ("IntersectionObserver" in window && observedSections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        navLinks.forEach((link) => {
          const isCurrent = link.getAttribute("href") === `#${visible.target.id}`;
          link.classList.toggle("is-active", isCurrent);

          if (isCurrent) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      {
        rootMargin: "-24% 0px -62% 0px",
        threshold: [0, 0.12, 0.35]
      }
    );

    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  const revealItems = [...document.querySelectorAll("[data-reveal]")];

  if ("IntersectionObserver" in window && !reducedMotion.matches && revealItems.length) {
    root.classList.add("reveal-enabled");

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -9% 0px",
        threshold: 0.08
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const galleries = [...document.querySelectorAll("[data-gallery]")];

  galleries.forEach((gallery) => {
    const track = gallery.querySelector("[data-gallery-track]");
    const previous = gallery.querySelector("[data-gallery-prev]");
    const next = gallery.querySelector("[data-gallery-next]");

    if (!track || !previous || !next) return;

    let galleryTicking = false;

    const getStep = () => {
      const firstShot = track.querySelector(".project-shot");
      if (!firstShot) return track.clientWidth;

      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0");
      return firstShot.getBoundingClientRect().width + gap;
    };

    const updateGalleryButtons = () => {
      const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
      const hasOverflow = maxScroll > 3;

      previous.disabled = !hasOverflow || track.scrollLeft <= 3;
      next.disabled = !hasOverflow || track.scrollLeft >= maxScroll - 3;
      galleryTicking = false;
    };

    const requestGalleryUpdate = () => {
      if (!galleryTicking) {
        window.requestAnimationFrame(updateGalleryButtons);
        galleryTicking = true;
      }
    };

    const moveGallery = (direction) => {
      track.scrollBy({
        left: getStep() * direction,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    };

    previous.addEventListener("click", () => moveGallery(-1));
    next.addEventListener("click", () => moveGallery(1));

    track.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      moveGallery(event.key === "ArrowRight" ? 1 : -1);
    });

    track.addEventListener("scroll", requestGalleryUpdate, { passive: true });

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(requestGalleryUpdate);
      resizeObserver.observe(track);
    } else {
      window.addEventListener("resize", requestGalleryUpdate, { passive: true });
    }

    updateGalleryButtons();
  });
})();
