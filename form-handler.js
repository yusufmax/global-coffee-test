// Unified Lead Form Handler & Telegram Bot integration
document.addEventListener('DOMContentLoaded', () => {
    let activeCategory = 'ПАРТНЕРЫ'; // Default for partners page

    // Detect active page
    const pageName = window.location.pathname.split('/').pop() || 'index.html';

    // Hook into tab selection if they exist
    const originalSelectFormTab = window.selectFormTab;
    window.selectFormTab = function(index) {
        if (originalSelectFormTab) {
            originalSelectFormTab(index);
        }
        const categories = ['ИНВЕСТОРЫ', 'ФРАНЧАЙЗИ', 'ПАРТНЕРЫ'];
        activeCategory = categories[index] || 'ПАРТНЕРЫ';
    };

    // Override page form submission
    window.handleFormSubmit = function(event) {
        event.preventDefault();
        const form = event.target;
        const nameInput = form.querySelector('input[placeholder="Имя"], #user-name');
        const phoneInput = form.querySelector('input[placeholder="Телефон"]');
        const checkbox = form.querySelector('#custom-form-checkbox');
        
        if (!nameInput || !phoneInput) return;

        const name = nameInput.value;
        const phone = phoneInput.value;

        // Submit via AJAX
        submitLeadToServer({
            name: name,
            phone: phone,
            type: activeCategory,
            message: '',
            page: pageName === 'index.html' ? 'Главная' : (pageName === 'franchise.html' ? 'Франшиза' : 'Партнерам')
        }).then(success => {
            if (success) {
                // If successModal is present, show it (e.g. franchise.html)
                const successModal = document.getElementById('successModal');
                if (successModal) {
                    successModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                } else {
                    alert(`Спасибо, ${name}! Ваша заявка успешно отправлена. Наши менеджеры свяжутся с вами в ближайшее время.`);
                }
                form.reset();
                // Reset custom checkmark if exists
                const checkmark = document.getElementById('custom-form-checkmark');
                if (checkmark) checkmark.style.display = 'none';
            } else {
                alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.');
            }
        });
    };

    // Override franchise.html request modal submission
    window.submitRequest = function() {
        const modal = document.getElementById('requestModal');
        if (!modal) return;

        const nameInput = modal.querySelector('input[placeholder="Имя"]');
        const phoneInput = modal.querySelector('input[placeholder="Телефон"]');
        
        if (!nameInput || !phoneInput) return;

        const name = nameInput.value;
        const phone = phoneInput.value;

        if (!name || !phone) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        submitLeadToServer({
            name: name,
            phone: phone,
            type: 'ЗАПРОС ИЗ МОДАЛА (ФРАНШИЗА)',
            message: '',
            page: 'Франшиза'
        }).then(success => {
            modal.style.display = 'none';
            if (success) {
                const s = document.getElementById('successModal');
                if (s) {
                    s.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                } else {
                    alert(`Спасибо, ${name}! Ваша заявка успешно отправлена.`);
                }
                nameInput.value = '';
                phoneInput.value = '';
            } else {
                alert('Произошла ошибка при отправке заявки.');
            }
        });
    };

    // Helper to send lead data to the python server
    async function submitLeadToServer(leadData) {
        try {
            const response = await fetch('/api/lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leadData)
            });
            const result = await response.json();
            return result.status === 'success';
        } catch (err) {
            console.error('Error submitting lead:', err);
            return false;
        }
    }

    // Dynamic Contact Modal for index.html contact buttons
    createContactModal();

    function createContactModal() {
        // Find elements with btn-contact, managers action, or footer partner button
        const contactButtons = document.querySelectorAll('.btn-contact, a[href="#"].btn-orange, .footer-partner-btn');
        if (contactButtons.length === 0) return;

        // CSS styles for modal
        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .dynamic-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(8px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            .dynamic-modal-overlay.open {
                opacity: 1;
                visibility: visible;
            }
            .dynamic-modal-card {
                background: #1a1410;
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 24px;
                padding: 40px;
                width: 90%;
                max-width: 460px;
                position: relative;
                box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                transform: translateY(20px);
                transition: all 0.3s ease;
            }
            .dynamic-modal-overlay.open .dynamic-modal-card {
                transform: translateY(0);
            }
            .dynamic-modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                font-size: 1.5rem;
                cursor: pointer;
                transition: color 0.2s;
            }
            .dynamic-modal-close:hover {
                color: #ffffff;
            }
            .dynamic-modal-title {
                font-family: 'Comfortaa', sans-serif;
                font-size: 1.8rem;
                font-weight: 700;
                color: #FFF5E1;
                margin-bottom: 10px;
                text-align: center;
            }
            .dynamic-modal-subtitle {
                color: #8A8581;
                font-size: 0.9rem;
                margin-bottom: 30px;
                text-align: center;
                line-height: 1.4;
            }
            .dynamic-modal-form {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .dynamic-modal-input {
                width: 100%;
                background: transparent;
                border: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.15);
                padding: 12px 0;
                color: #ffffff;
                font-size: 1.05rem;
                outline: none;
                transition: border-color 0.3s;
                font-family: 'Inter', sans-serif;
                box-sizing: border-box;
            }
            .dynamic-modal-input:focus {
                border-color: #FBB03B;
            }
            .dynamic-modal-textarea {
                width: 100%;
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                padding: 12px;
                color: #ffffff;
                font-size: 0.95rem;
                outline: none;
                min-height: 80px;
                resize: vertical;
                font-family: 'Inter', sans-serif;
                box-sizing: border-box;
            }
            .dynamic-modal-textarea:focus {
                border-color: #FBB03B;
            }
            .dynamic-modal-submit {
                background: #FBB03B;
                color: #000000;
                font-family: 'Inter', sans-serif;
                font-weight: 700;
                padding: 16px;
                border-radius: 12px;
                border: none;
                cursor: pointer;
                font-size: 1.05rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: all 0.3s;
                box-shadow: 0 10px 20px rgba(251, 176, 59, 0.2);
            }
            .dynamic-modal-submit:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 30px rgba(251, 176, 59, 0.3);
            }
            .dynamic-modal-checkbox-label {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                cursor: pointer;
                font-size: 0.8rem;
                color: #8A8581;
                line-height: 1.4;
            }
            .dynamic-modal-checkbox {
                margin-top: 3px;
                accent-color: #FBB03B;
            }
        `;
        document.head.appendChild(modalStyle);

        // Create HTML structure
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'dynamic-modal-overlay';
        
        const card = document.createElement('div');
        card.className = 'dynamic-modal-card';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'dynamic-modal-close';
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = () => closeModal();
        
        const title = document.createElement('h2');
        title.className = 'dynamic-modal-title';
        title.textContent = 'Связаться с нами';
        
        const subtitle = document.createElement('p');
        subtitle.className = 'dynamic-modal-subtitle';
        subtitle.textContent = 'Оставьте контакты, и основатели сети или менеджеры ответят вам лично.';
        
        const form = document.createElement('form');
        form.className = 'dynamic-modal-form';
        form.onsubmit = handleModalSubmit;
        
        form.innerHTML = `
            <input type="text" placeholder="Ваше имя" required class="dynamic-modal-input">
            <input type="tel" placeholder="Номер телефона" required class="dynamic-modal-input">
            <textarea placeholder="Ваше сообщение, идея или предложение" class="dynamic-modal-textarea"></textarea>
            <label class="dynamic-modal-checkbox-label">
                <input type="checkbox" required checked class="dynamic-modal-checkbox">
                <span>Я соглашаюсь с условиями обработки персональных данных.</span>
            </label>
            <button type="submit" class="dynamic-modal-submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                Отправить письмо
            </button>
        `;
        
        card.appendChild(closeBtn);
        card.appendChild(title);
        card.appendChild(subtitle);
        card.appendChild(form);
        modalOverlay.appendChild(card);
        document.body.appendChild(modalOverlay);

        // Bind clicks to open modal
        contactButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Determine form type from button context
                let customTitle = 'Связаться с нами';
                let customCategory = 'ОБРАТНАЯ СВЯЗЬ';

                if (btn.classList.contains('btn-contact') || btn.closest('.contact-section')) {
                    customTitle = 'Письмо основателям';
                    customCategory = 'ПИСЬМО ОСНОВАТЕЛЯМ';
                } else if (btn.closest('.franchise-section')) {
                    customTitle = 'Связаться с менеджером';
                    customCategory = 'ФРАНШИЗА (КОНТАКТ)';
                } else if (btn.closest('.quality-section')) {
                    customTitle = 'Заявка на обучение';
                    customCategory = 'ЗАЯВКА НА ОБУЧЕНИЕ';
                } else if (btn.classList.contains('footer-partner-btn') || btn.textContent.trim() === 'Стать партнёром') {
                    customTitle = 'Стать партнёром';
                    customCategory = 'ЗАЯВКА (ПАРТНЕР)';
                }

                title.textContent = customTitle;
                form.dataset.category = customCategory;
                
                openModal();
            });
        });

        // Modal triggers
        function openModal() {
            modalOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function closeModal() {
            modalOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }

        // Close on click outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        // Form submit handler
        function handleModalSubmit(e) {
            e.preventDefault();
            const inputs = form.querySelectorAll('.dynamic-modal-input');
            const name = inputs[0].value;
            const phone = inputs[1].value;
            const message = form.querySelector('.dynamic-modal-textarea').value;
            const category = form.dataset.category || 'ОБРАТНАЯ СВЯЗЬ';

            submitLeadToServer({
                name: name,
                phone: phone,
                type: category,
                message: message,
                page: 'Главная'
            }).then(success => {
                closeModal();
                if (success) {
                    alert(`Спасибо, ${name}! Ваша заявка успешно отправлена.`);
                    form.reset();
                } else {
                    alert('Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз.');
                }
            });
        }
    }
});
