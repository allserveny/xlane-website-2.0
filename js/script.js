// Hamburger
  function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('open');
  }

  // FAQ
  function toggleFAQ(btn) {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  }

  // HQ Rental booking widget is loaded via external script

  function submitContact() {
    document.getElementById('contactForm').style.display = 'none';
    document.getElementById('contactSuccess').style.display = 'block';
  }

  // Meta Pixel: treat clicks on any "Book Now / Reserve a Car" link as a Lead
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href="book.html"]');
    if (link && typeof fbq !== 'undefined') {
      fbq('track', 'Lead');
    }
  });
