const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const year = document.querySelector("#year");
const progressBar = document.querySelector("#scroll-progress-bar");
const backToTop = document.querySelector(".back-to-top");
const hero = document.querySelector(".hero");
const heroCopy = document.querySelector(".hero-copy");
const heroCard = document.querySelector(".hero-card");
const orbs = document.querySelectorAll(".bg-orb");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const sections = navLinks
  .map((link) => {
    const href = link.getAttribute("href") || "";
    if (!href.startsWith("#")) return null;
    return document.querySelector(href);
  })
  .filter(Boolean);
const counters = Array.from(document.querySelectorAll("[data-counter]"));
const carousels = Array.from(document.querySelectorAll("[data-carousel]"));
const testimonialRotators = Array.from(document.querySelectorAll("[data-testimonial-rotator]"));
const siteHeader = document.querySelector(".site-header");
const referenceForm = document.querySelector("#enviar-testimonio form");
let testimonialRotatorCleanup = [];

if (year) {
  year.textContent = new Date().getFullYear();
}

const syncHeaderOffset = () => {
  if (!siteHeader) return;
  const headerHeight = Math.ceil(siteHeader.getBoundingClientRect().height) + 8;
  document.documentElement.style.setProperty("--header-offset", `${headerHeight}px`);
};

syncHeaderOffset();
window.addEventListener("resize", syncHeaderOffset);

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const updateScrollProgress = () => {
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
};

const updateBackToTop = () => {
  if (!backToTop) return;
  backToTop.classList.toggle("is-visible", window.scrollY > 420);
};

const setActiveNavLink = (id) => {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", isActive);
  });
};

if (sections.length && "IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveNavLink(visible.target.id);
      }
    },
    {
      rootMargin: "-35% 0px -45% 0px",
      threshold: [0.1, 0.25, 0.5, 0.75]
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

updateScrollProgress();
updateBackToTop();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("scroll", updateBackToTop, { passive: true });
window.addEventListener("resize", updateScrollProgress);

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
}

if (counters.length && "IntersectionObserver" in window) {
  const animateCounter = (el) => {
    if (el.dataset.animated === "true") return;
    el.dataset.animated = "true";

    const target = Number(el.dataset.counter || 0);
    const suffix = el.dataset.suffix || "";
    const duration = 1100;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${value}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach((el) => {
    el.textContent = `${el.dataset.counter || 0}${el.dataset.suffix || ""}`;
  });
}

carousels.forEach((carousel) => {
  const track = carousel.querySelector("[data-carousel-track]");
  const prevBtn = carousel.querySelector("[data-carousel-prev]");
  const nextBtn = carousel.querySelector("[data-carousel-next]");
  const status = carousel.querySelector("[data-carousel-status]");
  const slides = track ? Array.from(track.children) : [];

  if (!track || !prevBtn || !nextBtn || !status || slides.length === 0) return;

  const getCurrentIndex = () => {
    const trackLeft = track.getBoundingClientRect().left;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - trackLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const updateCarouselUi = () => {
    const current = getCurrentIndex();
    status.textContent = `${current + 1} / ${slides.length}`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= slides.length - 1;
  };

  const getStep = () => {
    const firstSlide = slides[0];
    if (!firstSlide) return track.clientWidth;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return firstSlide.getBoundingClientRect().width + gap;
  };

  const scrollByStep = (direction) => {
    const step = getStep() * direction;
    track.scrollLeft = track.scrollLeft + step;
  };

  prevBtn.addEventListener("click", () => {
    scrollByStep(-1);
  });

  nextBtn.addEventListener("click", () => {
    scrollByStep(1);
  });

  track.addEventListener("scroll", updateCarouselUi, { passive: true });
  window.addEventListener("resize", updateCarouselUi);
  updateCarouselUi();
});

const buildReferenceFooter = (item) => {
  const displayName = item.nombre_visible || item.nombre_completo || "";
  const parts = [displayName, item.cargo, item.empresa, item.contexto_proyecto].filter(Boolean);
  return parts.join(" · ");
};

const renderReferencesFromJson = async () => {
  const grids = Array.from(document.querySelectorAll("[data-testimonial-grid]"));
  if (!grids.length) return;

  try {
    const response = await fetch("referencias.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar referencias.json");
    const data = await response.json();
    const source = Array.isArray(data) ? data : Array.isArray(data?.references) ? data.references : [];

    const references = source
      .filter((item) => item && (item.autorizado_publicacion === true || item.autorizado_publicacion === "Si"))
      .sort((a, b) => Number(Boolean(b.destacado)) - Number(Boolean(a.destacado)));

    if (!references.length) return;

    const cardsHtml = references.map((item) => {
      const comentario = String(item.comentario || "").trim();
      const footer = buildReferenceFooter(item);
      return `
        <article class="quote-card">
          <p>"${comentario.replace(/"/g, "&quot;")}"</p>
          <footer>${footer}</footer>
        </article>
      `;
    }).join("");

    grids.forEach((grid) => {
      grid.innerHTML = cardsHtml;
    });
  } catch (error) {
    // Fallback: keep static content if JSON is not available.
    console.warn(error);
  }
};

const destroyTestimonialRotators = () => {
  testimonialRotatorCleanup.forEach((fn) => fn());
  testimonialRotatorCleanup = [];
};

const initTestimonialRotators = () => {
  destroyTestimonialRotators();

  document.querySelectorAll("[data-testimonial-rotator]").forEach((rotator) => {
  const grid = rotator.querySelector(".testimonial-grid");
  const prevBtn = rotator.querySelector("[data-testimonial-prev]");
  const nextBtn = rotator.querySelector("[data-testimonial-next]");
  const status = rotator.querySelector("[data-testimonial-status]");
  const cards = grid ? Array.from(grid.querySelectorAll(".quote-card")) : [];

  if (!grid || !prevBtn || !nextBtn || !status || cards.length === 0) return;

  let page = 0;
  let timer = null;
  const autoplayMs = 10000;

  const getPageSize = () => (window.innerWidth <= 960 ? 1 : 2);
  const getPageCount = () => Math.max(1, Math.ceil(cards.length / getPageSize()));

  const render = () => {
    const pageSize = getPageSize();
    const pageCount = getPageCount();
    if (page >= pageCount) page = 0;

    const start = page * pageSize;
    const end = start + pageSize;

    cards.forEach((card, index) => {
      const visible = index >= start && index < end;
      card.classList.toggle("is-hidden", !visible);
      card.setAttribute("aria-hidden", String(!visible));
    });

    status.textContent = `${page + 1} / ${pageCount}`;
    prevBtn.disabled = pageCount <= 1;
    nextBtn.disabled = pageCount <= 1;
  };

  const go = (direction) => {
    const pageCount = getPageCount();
    if (pageCount <= 1) return;
    page = (page + direction + pageCount) % pageCount;
    render();
  };

  const stopAutoplay = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (getPageCount() <= 1) return;
    timer = setInterval(() => go(1), autoplayMs);
  };

  prevBtn.addEventListener("click", () => {
    go(-1);
    startAutoplay();
  });

  nextBtn.addEventListener("click", () => {
    go(1);
    startAutoplay();
  });

  const onMouseEnter = () => stopAutoplay();
  const onMouseLeave = () => startAutoplay();
  const onFocusIn = () => stopAutoplay();
  const onFocusOut = () => startAutoplay();
  const onResize = () => render();

  rotator.addEventListener("mouseenter", onMouseEnter);
  rotator.addEventListener("mouseleave", onMouseLeave);
  rotator.addEventListener("focusin", onFocusIn);
  rotator.addEventListener("focusout", onFocusOut);
  window.addEventListener("resize", onResize);

  render();
  startAutoplay();
  testimonialRotatorCleanup.push(() => {
    stopAutoplay();
    prevBtn.replaceWith(prevBtn.cloneNode(true));
    nextBtn.replaceWith(nextBtn.cloneNode(true));
    rotator.removeEventListener("mouseenter", onMouseEnter);
    rotator.removeEventListener("mouseleave", onMouseLeave);
    rotator.removeEventListener("focusin", onFocusIn);
    rotator.removeEventListener("focusout", onFocusOut);
    window.removeEventListener("resize", onResize);
  });
  });
};

renderReferencesFromJson().finally(() => {
  initTestimonialRotators();
});

if (referenceForm) {
  const feedback = referenceForm.querySelector("[data-form-feedback]");

  referenceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = referenceForm.querySelector('button[type="submit"]');
    const originalLabel = submitButton ? submitButton.textContent : "";
    const formData = new FormData(referenceForm);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    if (feedback) {
      feedback.textContent = "";
      feedback.classList.remove("is-success", "is-error");
    }

    try {
      const response = await fetch(referenceForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar el formulario");
      }

      referenceForm.reset();
      if (feedback) {
        feedback.textContent = "Referencia enviada para revisión.";
        feedback.classList.add("is-success");
      }
    } catch (error) {
      if (feedback) {
        feedback.textContent = "No fue posible enviar la referencia. Intenta nuevamente.";
        feedback.classList.add("is-error");
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
}

const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

if (!prefersReducedMotion && hasFinePointer && hero && heroCopy && heroCard) {
  let rafId = null;

  const resetHeroMotion = () => {
    heroCopy.style.transform = "";
    heroCard.style.transform = "";
    orbs.forEach((orb) => {
      orb.style.transform = "";
    });
  };

  hero.addEventListener("mousemove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
      heroCopy.style.transform = `translate3d(${x * -3}px, ${y * -2}px, 0)`;
      heroCard.style.transform = `translate3d(${x * 4}px, ${y * 3}px, 0)`;
      orbs.forEach((orb, index) => {
        const factor = index === 0 ? 5 : 7;
        orb.style.transform = `translate3d(${x * factor}px, ${y * factor}px, 0)`;
      });
    });
  });

  hero.addEventListener("mouseleave", resetHeroMotion);
}
