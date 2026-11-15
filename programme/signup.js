    const interestForm = document.getElementById('sib-form');
    const signupSection = document.querySelector('.signup');
    interestForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = interestForm.querySelector('.form-submit');
      const successMessage = document.getElementById('success-message');
      const errorMessage = document.getElementById('error-message');
      const originalButtonText = submitButton.textContent;

      successMessage.style.display = 'none';
      errorMessage.style.display = 'none';
      submitButton.disabled = true;
      submitButton.textContent = 'Envoi en cours…';

      try {
        const response = await fetch(interestForm.action, {
          method: 'POST',
          body: new FormData(interestForm),
          headers: { Accept: 'application/json' }
        });
        const result = await response.json();

        if (!response.ok || !result.success) throw new Error('Brevo rejected the subscription');

        Array.from(interestForm.children).forEach((element) => {
          if (element !== successMessage) element.style.display = 'none';
        });
        signupSection.classList.add('is-complete');
        successMessage.style.display = 'grid';
        successMessage.focus();
        interestForm.reset();
        document.dispatchEvent(new Event('newsletter:success'));
      } catch (error) {
        errorMessage.style.display = 'block';
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
