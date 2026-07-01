// Floating WhatsApp button (added to every page)
  (function () {
    var wa = document.createElement('a');
    wa.href = 'https://wa.me/19297524123';
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.className = 'whatsapp-float';
    wa.setAttribute('aria-label', 'Chat with us on WhatsApp');
    wa.innerHTML = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16.001 3C9.382 3 4 8.382 4 15.001c0 2.385.694 4.61 1.99 6.547L4.06 28.93a.6.6 0 0 0 .733.731l7.488-1.92a11.94 11.94 0 0 0 3.72.59c6.619 0 12-5.382 12-12.001C28.001 8.382 22.62 3 16.001 3zm0 21.6a9.55 9.55 0 0 1-4.872-1.337l-.349-.207-4.434 1.137 1.16-4.323-.228-.355A9.566 9.566 0 0 1 6.4 15.001c0-5.302 4.299-9.6 9.601-9.6 5.301 0 9.6 4.298 9.6 9.6 0 5.301-4.299 9.599-9.6 9.599zm5.273-7.187c-.289-.144-1.71-.844-1.975-.94-.265-.096-.458-.144-.65.144-.193.289-.747.94-.916 1.133-.169.193-.337.217-.626.072-.289-.144-1.221-.45-2.326-1.435-.86-.766-1.44-1.713-1.609-2.002-.169-.289-.018-.446.13-.59.144-.144.337-.385.506-.578.169-.193.225-.337.337-.554.112-.217.057-.408-.034-.554-.09-.144-.69-1.659-.946-2.27-.25-.598-.503-.518-.69-.527-.169-.008-.36-.01-.554-.01-.193 0-.506.072-.771.36-.265.289-1.012 1.012-1.012 2.412 0 1.4.97 2.751 1.106 2.943.137.193 1.866 2.97 4.612 4.013 2.745 1.043 2.745.695 3.234.65.49-.046 1.71-.722 1.95-1.42.241-.698.241-1.297.169-1.42-.072-.122-.265-.193-.554-.337z"/></svg>';
    document.body.appendChild(wa);
  })();

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
      fbq('track', 'Lead', { value: 0, currency: 'USD' });
    }
  });
