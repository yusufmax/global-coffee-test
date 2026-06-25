// Dynamic site content loader / hydration with Customizer live message injection support
document.addEventListener('DOMContentLoaded', () => {
    let path = window.location.pathname;
    if (path.endsWith('/') && path.length > 1) {
        path = path.slice(0, -1);
    }
    const pageName = path.split('/').pop() || 'index.html';

    function fetchConfig() {
        return fetch('/api/config')
            .then(res => {
                if (!res.ok) throw new Error('API config failed');
                return res.json();
            })
            .catch(() => {
                console.log('Falling back to static config.json');
                return fetch('/config.json').then(res => res.json());
            });
    }

    fetchConfig()
        .then(config => {
            hydrateGeneral(config);
            hydrateLinks(config.links);
            if (pageName === 'index.html' || pageName === '' || pageName === 'index') {
                hydrateHomePage(config);
            } else if (pageName === 'franchise.html' || pageName === 'franchise') {
                hydrateFranchisePage(config.franchise);
            } else if (pageName === 'partners.html' || pageName === 'partners') {
                hydratePartnersPage(config.partners);
            } else if (pageName === 'news.html' || pageName === 'news') {
                hydrateNewsPage(config);
            } else if (pageName === 'article.html' || pageName === 'article') {
                hydrateArticlePage(config);
            }
        })
        .catch(err => console.error('Error hydrating site:', err));

    function setElementText(selector, text, key) {
        if (!text) return;
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.innerHTML = text.replace(/\n/g, '<br>');
            if (key) el.setAttribute('data-edit-key', key);
        });
    }

    function setElementImage(selector, src, key) {
        if (!src) return;
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.src = src;
            if (key) el.setAttribute('data-edit-key', key);
        });
    }

    function hydrateGeneral(config) {
        const gen = config.general || {};
        if (gen.phone) {
            const phoneLinks = document.querySelectorAll('.phone-link, .mobile-menu-phone');
            phoneLinks.forEach(link => {
                const span = link.querySelector('span');
                if (span) {
                    span.textContent = gen.phone;
                    span.setAttribute('data-edit-key', 'general.phone');
                } else {
                    link.textContent = gen.phone;
                    link.setAttribute('data-edit-key', 'general.phone');
                }
                link.href = `tel:${gen.phone.replace(/[^\d+]/g, '')}`;
            });

            const footerPhoneText = document.querySelectorAll('.footer-contact-item a[href^="tel:"]');
            footerPhoneText.forEach(a => {
                a.textContent = gen.phone;
                a.setAttribute('data-edit-key', 'general.phone');
                a.href = `tel:${gen.phone.replace(/[^\d+]/g, '')}`;
            });
        }

        if (gen.email) {
            const footerEmails = document.querySelectorAll('.footer-contact-item a[href^="mailto:"]');
            footerEmails.forEach(a => {
                a.textContent = gen.email;
                a.setAttribute('data-edit-key', 'general.email');
                a.href = `mailto:${gen.email}`;
            });
        }
    }

    function hydrateLinks(links) {
        if (!links) return;

        // 1. Social Links in footer
        const socialContainer = document.querySelector('.social-links');
        if (socialContainer) {
            let html = '';
            if (links.instagram) {
                html += `
                    <a href="${links.instagram}" target="_blank" class="footer-social-link" data-edit-key="links.instagram">
                        <img src="instagram.png" alt="Instagram">
                    </a>
                `;
            }
            if (links.telegram) {
                html += `
                    <a href="${links.telegram}" target="_blank" class="footer-social-link" data-edit-key="links.telegram">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; display: block; filter: invert(98%) sepia(21%) saturate(233%) hue-rotate(323deg) brightness(103%) contrast(101%);">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.84 8.7L15.11 16.85C14.98 17.43 14.64 17.57 14.15 17.3L11.52 15.36L10.25 16.58C10.11 16.72 9.99 16.84 9.72 16.84L9.91 14.14L14.83 9.7C15.04 9.51 14.79 9.4 14.51 9.59L8.43 13.42L5.81 12.6C5.24 12.42 5.23 12.03 5.93 11.76L16.14 7.82C16.61 7.65 17.02 7.93 16.84 8.7Z" fill="currentColor"/>
                        </svg>
                    </a>
                `;
            }
            if (links.whatsapp) {
                html += `
                    <a href="${links.whatsapp}" target="_blank" class="footer-social-link" data-edit-key="links.whatsapp">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; display: block; filter: invert(98%) sepia(21%) saturate(233%) hue-rotate(323deg) brightness(103%) contrast(101%);">
                            <path d="M12.004 2C6.48 2 2 6.48 2 12C2 13.96 2.57 15.79 3.56 17.34L2.02 22L6.82 20.78C8.32 21.57 10.11 22 12.004 22C17.528 22 22.008 17.52 22.008 12C22.008 6.48 17.528 2 12.004 2ZM17.15 15.39C16.94 15.99 16.03 16.48 15.41 16.54C14.88 16.59 14.19 16.62 11.87 15.66C8.9 14.43 6.98 11.4 6.83 11.2C6.69 11 5.65 9.63 5.65 8.21C5.65 6.79 6.37 6.1 6.66 5.8C6.89 5.56 7.28 5.46 7.64 5.46C7.76 5.46 7.87 5.47 7.97 5.47C8.26 5.48 8.41 5.5 8.6 5.96C8.84 6.54 9.43 7.98 9.5 8.13C9.57 8.28 9.64 8.48 9.54 8.68C9.44 8.88 9.36 8.98 9.21 9.15C9.06 9.32 8.92 9.46 8.77 9.64C8.63 9.77 8.47 9.92 8.65 10.23C8.83 10.53 9.45 11.55 10.36 12.36C11.53 13.4 12.5 13.73 12.82 13.86C13.14 13.99 13.33 13.96 13.51 13.75C13.69 13.54 14.29 12.84 14.49 12.54C14.69 12.24 14.89 12.29 15.19 12.4C15.49 12.51 17.09 13.3 17.41 13.46C17.73 13.62 17.94 13.7 18.02 13.84C18.1 13.98 18.1 14.68 17.89 15.28L17.15 15.39Z" fill="currentColor"/>
                        </svg>
                    </a>
                `;
            }
            socialContainer.innerHTML = html;
        }

        // 2. iOS and Android App links
        const iosLinks = document.querySelectorAll('.btn-store-mobile.ios, .btn-store-img:nth-child(1), a[class*="ios"]');
        iosLinks.forEach(link => {
            if (links.ios_app) {
                link.href = links.ios_app;
                link.setAttribute('data-edit-key', 'links.ios_app');
            }
        });

        const androidLinks = document.querySelectorAll('.btn-store-mobile.android, .btn-store-img:nth-child(2), a[class*="android"]');
        androidLinks.forEach(link => {
            if (links.android_app) {
                link.href = links.android_app;
                link.setAttribute('data-edit-key', 'links.android_app');
            }
        });

        // 3. Presentation links
        const presLinks = document.querySelectorAll('.btn-white');
        presLinks.forEach(link => {
            if (link.textContent.includes('презентацию')) {
                if (links.franchise_presentation) {
                    link.href = links.franchise_presentation;
                    link.setAttribute('data-edit-key', 'links.franchise_presentation');
                }
            }
        });

        // 4. Privacy policy links
        const allAnchors = document.querySelectorAll('footer a, .footer-bottom a');
        allAnchors.forEach(a => {
            if (a.textContent.includes('Политика конфиденциальности')) {
                if (links.privacy_policy) {
                    a.href = links.privacy_policy;
                    a.setAttribute('data-edit-key', 'links.privacy_policy');
                }
            }
        });

        // 5. Franchise page nav links
        const franchiseLinks = document.querySelectorAll('a[href="franchise.html"], a[href="/franchise.html"], a[href="franchise"], a[href="/franchise"], .mobile-menu-link[href*="franchise"]');
        franchiseLinks.forEach(link => {
            if (links.nav_franchise) {
                link.href = links.nav_franchise;
                link.setAttribute('data-edit-key', 'links.nav_franchise');
            }
        });

        // 6. Partners page nav links
        const partnersLinks = document.querySelectorAll('a[href="partners.html"], a[href="/partners.html"], a[href="partners"], a[href="/partners"], .mobile-menu-link[href*="partners"]');
        partnersLinks.forEach(link => {
            if (links.nav_partners) {
                link.href = links.nav_partners;
                link.setAttribute('data-edit-key', 'links.nav_partners');
            }
        });

        // 7. News page nav links
        const newsLinks = document.querySelectorAll('a[href="news.html"], a[href="/news.html"], a[href="news"], a[href="/news"], .mobile-menu-link[href*="news"]');
        newsLinks.forEach(link => {
            if (links.nav_news) {
                link.href = links.nav_news;
                link.setAttribute('data-edit-key', 'links.nav_news');
            }
        });
    }

    function hydrateHomePage(config) {
        const home = config.home;
        if (!home) return;

        setElementText('.map-section .map-title', home.hero_title, 'home.hero_title');
        setElementText('.map-section .map-subtitle', home.hero_subtitle, 'home.hero_subtitle');

        // Slide 1 (О нас)
        const slide1 = document.querySelector('.about-slider-track .about-slide:nth-child(1)');
        if (slide1) {
            const title = slide1.querySelector('.about-title');
            if (title) {
                title.textContent = home.about_title_1;
                title.setAttribute('data-edit-key', 'home.about_title_1');
            }
            const desc = slide1.querySelector('.about-text-content > p');
            if (desc) {
                desc.textContent = home.about_desc_1;
                desc.setAttribute('data-edit-key', 'home.about_desc_1');
            }
            const bulletsList = slide1.querySelector('.item-details ul');
            if (bulletsList && home.about_bullets_1) {
                bulletsList.innerHTML = home.about_bullets_1
                    .split('\n')
                    .map(b => `<li style="margin-bottom: 5px;">${b}</li>`)
                    .join('');
                bulletsList.setAttribute('data-edit-key', 'home.about_bullets_1');
            }
            const img = slide1.querySelector('.about-image-wrapper img');
            if (img) {
                img.src = home.about_image_1;
                img.setAttribute('data-edit-key', 'home.about_image_1');
            }
        }

        // Slide 2 (Партнёры)
        const slide2 = document.querySelector('.about-slider-track .about-slide:nth-child(2)');
        if (slide2) {
            const title = slide2.querySelector('.about-title');
            if (title) {
                title.textContent = home.about_title_2;
                title.setAttribute('data-edit-key', 'home.about_title_2');
            }
            const desc = slide2.querySelector('.about-list-item:nth-child(3) p, .about-list-item[style*="margin-top"] p');
            if (desc) {
                desc.textContent = home.about_desc_2;
                desc.setAttribute('data-edit-key', 'home.about_desc_2');
            }
            const list = slide2.querySelector('.item-details ul');
            if (list && home.about_bullets_2) {
                list.innerHTML = home.about_bullets_2
                    .split('\n')
                    .map(b => `<li style="margin-bottom: 10px; position: relative; padding-left: 20px;"><span style="position: absolute; left: 0; color: #D4A373;">•</span> ${b}</li>`)
                    .join('');
                list.setAttribute('data-edit-key', 'home.about_bullets_2');
            }
            const img = slide2.querySelector('.about-image-wrapper img');
            if (img) {
                img.src = home.about_image_2;
                img.setAttribute('data-edit-key', 'home.about_image_2');
            }
        }

        // Slide 3 (Бизнес)
        const slide3 = document.querySelector('.about-slider-track .about-slide:nth-child(3)');
        if (slide3) {
            const title = slide3.querySelector('.about-title');
            if (title) {
                title.textContent = home.about_title_3;
                title.setAttribute('data-edit-key', 'home.about_title_3');
            }
            const bullets = slide3.querySelectorAll('.about-list-item p');
            if (bullets.length >= 2) {
                bullets[0].textContent = home.about_desc_3_1;
                bullets[0].setAttribute('data-edit-key', 'home.about_desc_3_1');
                bullets[1].textContent = home.about_desc_3_2;
                bullets[1].setAttribute('data-edit-key', 'home.about_desc_3_2');
            }
            const img = slide3.querySelector('.about-image-wrapper img');
            if (img) {
                img.src = home.about_image_3;
                img.setAttribute('data-edit-key', 'home.about_image_3');
            }
        }

        // Slide 4 (Новинки)
        const slide4 = document.querySelector('.about-slider-track .about-slide:nth-child(4)');
        if (slide4) {
            const title = slide4.querySelector('.about-title');
            if (title) {
                title.textContent = home.about_title_4;
                title.setAttribute('data-edit-key', 'home.about_title_4');
            }
            const bullets = slide4.querySelectorAll('.about-list-item p');
            if (bullets.length >= 2) {
                bullets[0].textContent = home.about_desc_4_1;
                bullets[0].setAttribute('data-edit-key', 'home.about_desc_4_1');
                bullets[1].textContent = home.about_desc_4_2;
                bullets[1].setAttribute('data-edit-key', 'home.about_desc_4_2');
            }
            const img = slide4.querySelector('.about-image-wrapper img');
            if (img) {
                img.src = home.about_image_4;
                img.setAttribute('data-edit-key', 'home.about_image_4');
            }
        }

        setElementText('.app-section .section-title', home.app_title, 'home.app_title');
        setElementText('.app-section .section-subtitle', home.app_subtitle, 'home.app_subtitle');
        setElementText('.app-text-info p', home.app_desc, 'home.app_desc');
        setElementImage('.app-main-card img', home.app_image_left, 'home.app_image_left');
        setElementImage('.app-secondary-card img:not(.btn-store-img img)', home.app_image_right, 'home.app_image_right');

        setElementText('.franchise-section .franchise-title', home.franchise_title, 'home.franchise_title');
        setElementText('.franchise-section .franchise-desc', home.franchise_desc, 'home.franchise_desc');
        const galleryItems = document.querySelectorAll('.franchise-gallery .gallery-item img');
        if (galleryItems.length >= 2) {
            galleryItems[0].src = home.franchise_gallery_1;
            galleryItems[0].setAttribute('data-edit-key', 'home.franchise_gallery_1');
            galleryItems[1].src = home.franchise_gallery_2;
            galleryItems[1].setAttribute('data-edit-key', 'home.franchise_gallery_2');
        }

        setElementText('.news-section .franchise-title', home.news_title, 'home.news_title');
        setElementText('.news-section .franchise-desc', home.news_desc, 'home.news_desc');
        
        // Hydrate homepage news dynamically from config.articles
        const articles = config.articles || [];
        const getImgUrl = (src) => {
            if (!src) return '';
            if (src.startsWith('http') || src.startsWith('/')) return src;
            if (src.startsWith('images/') || src.startsWith('news/')) return '/' + src;
            return '/news/' + src;
        };

        // Desktop main card
        const mainCard = document.querySelector('.news-section .news-main-card');
        if (mainCard && articles[0]) {
            setElementText('.news-section .news-main-card .main-news-title', articles[0].title, 'articles.0.title');
            setElementText('.news-section .news-main-card .main-news-subtitle', articles[0].subtitle, 'articles.0.subtitle');
            setElementText('.news-section .news-main-card .author span', articles[0].author, 'articles.0.author');
            setElementImage('.news-section .news-main-card .author .avatar', getImgUrl(articles[0].avatar), 'articles.0.avatar');
            setElementImage('.news-section .news-main-card .main-news-image img', getImgUrl(articles[0].image), 'articles.0.image');
            const btn = mainCard.querySelector('.btn-orange');
            if (btn) btn.href = `article.html?id=${articles[0].id}`;
        }

        // Desktop mini cards
        const mCards = document.querySelectorAll('.news-section .news-sidebar .mini-news-card');
        if (mCards.length >= 2) {
            if (articles[1]) {
                const titleEl = mCards[0].querySelector('h4');
                if (titleEl) {
                    titleEl.textContent = articles[1].title;
                    titleEl.setAttribute('data-edit-key', 'articles.1.title');
                }
                const imgEl = mCards[0].querySelector('.mini-img img');
                if (imgEl) {
                    imgEl.src = getImgUrl(articles[1].image);
                    imgEl.setAttribute('data-edit-key', 'articles.1.image');
                }
                const btn = mCards[0].querySelector('.arrow-btn');
                if (btn) btn.href = `article.html?id=${articles[1].id}`;
            }
            if (articles[2]) {
                const titleEl = mCards[1].querySelector('h4');
                if (titleEl) {
                    titleEl.textContent = articles[2].title;
                    titleEl.setAttribute('data-edit-key', 'articles.2.title');
                }
                const imgEl = mCards[1].querySelector('.mini-img img');
                if (imgEl) {
                    imgEl.src = getImgUrl(articles[2].image);
                    imgEl.setAttribute('data-edit-key', 'articles.2.image');
                }
                const btn = mCards[1].querySelector('.arrow-btn');
                if (btn) btn.href = `article.html?id=${articles[2].id}`;
            }
        }

        // Desktop partner card
        const partnerCard = document.querySelector('.news-section .news-sidebar .partner-news-card');
        if (partnerCard && articles[3]) {
            const titleEl = partnerCard.querySelector('h4');
            if (titleEl) {
                titleEl.textContent = articles[3].title;
                titleEl.setAttribute('data-edit-key', 'articles.3.title');
            }
            const partnerDesc = partnerCard.querySelector('p');
            if (partnerDesc) {
                partnerDesc.textContent = articles[3].subtitle || articles[3].title;
                partnerDesc.setAttribute('data-edit-key', 'articles.3.subtitle');
            }
            const partnerImg = partnerCard.querySelector('.partner-logos img, .partner-group img');
            if (partnerImg) {
                partnerImg.src = getImgUrl(articles[3].image);
                partnerImg.setAttribute('data-edit-key', 'articles.3.image');
            }
            const btn = partnerCard.querySelector('.arrow-btn');
            if (btn) btn.href = `article.html?id=${articles[3].id}`;
        }

        // Mobile slider cards
        const mobileSlides = document.querySelectorAll('.news-section .news-mobile-slide');
        mobileSlides.forEach((slide, idx) => {
            const article = articles[idx];
            if (!article) return;
            
            const mMain = slide.querySelector('.news-main-card');
            if (mMain) {
                const titleEl = mMain.querySelector('.main-news-title');
                if (titleEl) titleEl.textContent = article.title;
                const subtitleEl = mMain.querySelector('.main-news-subtitle');
                if (subtitleEl) subtitleEl.textContent = article.subtitle;
                const imgEl = mMain.querySelector('.main-news-image img');
                if (imgEl) imgEl.src = getImgUrl(article.image);
                const btn = mMain.querySelector('.btn-orange');
                if (btn) btn.href = `article.html?id=${article.id}`;
            }

            const mMini = slide.querySelector('.mini-news-card');
            if (mMini) {
                const titleEl = mMini.querySelector('h4');
                if (titleEl) titleEl.textContent = article.title;
                const imgEl = mMini.querySelector('.mini-img img');
                if (imgEl) imgEl.src = getImgUrl(article.image);
                const btn = mMini.querySelector('.arrow-btn');
                if (btn) btn.href = `article.html?id=${article.id}`;
            }

            const mPartner = slide.querySelector('.partner-news-card');
            if (mPartner) {
                const titleEl = mPartner.querySelector('h4');
                if (titleEl) titleEl.textContent = article.title;
                const descEl = mPartner.querySelector('.partner-content p');
                if (descEl) descEl.textContent = article.subtitle || article.title;
                const imgEl = mPartner.querySelector('.partner-logos img');
                if (imgEl) imgEl.src = getImgUrl(article.image);
                const btn = mPartner.querySelector('.arrow-btn');
                if (btn) btn.href = `article.html?id=${article.id}`;
            }
        });

        setElementText('.contact-section .franchise-title', home.contact_founders_title, 'home.contact_founders_title');
        setElementText('.contact-section .franchise-desc', home.contact_founders_desc, 'home.contact_founders_desc');

        setElementText('.partnership-section .partnership-title', home.partnership_title, 'home.partnership_title');
        setElementText('.partnership-section .partnership-subtitle', home.partnership_subtitle, 'home.partnership_subtitle');
        setElementText('.partnership-left-text-card .partnership-desc', home.partnership_desc, 'home.partnership_desc');
        setElementImage('.partnership-left-img-wrapper img', home.partnership_image_left, 'home.partnership_image_left');
        setElementImage('.partnership-right-img-wrapper img', home.partnership_image_right, 'home.partnership_image_right');

        setElementText('.quality-section .quality-title', home.quality_title, 'home.quality_title');
        setElementText('.quality-section .quality-subtitle', home.quality_subtitle, 'home.quality_subtitle');
        setElementImage('.quality-image-wrapper img', home.quality_image, 'home.quality_image');

        setElementText('.partners-section .section-title', home.partners_title, 'home.partners_title');
    }

    function hydrateFranchisePage(franchise) {
        if (!franchise) return;
        setElementText('.partners-hero .section-title', franchise.hero_title, 'franchise.hero_title');
        setElementText('.partners-hero .section-subtitle', franchise.hero_subtitle, 'franchise.hero_subtitle');
    }

    function hydratePartnersPage(partners) {
        if (!partners) return;
        setElementText('.partners-hero .section-title', partners.hero_title, 'partners.hero_title');
        setElementText('.partners-hero .section-subtitle', partners.hero_subtitle, 'partners.hero_subtitle');
    }

    function hydrateNewsPage(config) {
        const home = config.home;
        if (!home) return;
        const articles = config.articles || [];

        const prependNews = (src) => {
            if (!src) return '';
            if (src.startsWith('news/') || src.startsWith('http') || src.startsWith('/') || src.startsWith('images/')) return src;
            return 'news/' + src;
        };

        // News Hero
        setElementText('.news-hero-text h1', home.news_title, 'home.news_title');
        setElementText('.news-hero-text p', home.news_desc, 'home.news_desc');

        // Main Card
        if (articles[0]) {
            setElementText('.news-main-card .main-news-title', articles[0].title, 'articles.0.title');
            setElementText('.news-main-card .main-news-subtitle', articles[0].subtitle, 'articles.0.subtitle');
            setElementText('.news-main-card .author span', articles[0].author, 'articles.0.author');
            setElementImage('.news-main-card .author .avatar', prependNews(articles[0].avatar), 'articles.0.avatar');
            setElementImage('.news-main-card .main-news-image img', prependNews(articles[0].image), 'articles.0.image');
            const btn = document.querySelector('.news-main-card .btn-orange');
            if (btn) btn.href = `article.html?id=${articles[0].id}`;
        }

        // Sidebar
        const miniCards = document.querySelectorAll('.news-sidebar .mini-news-card');
        if (miniCards.length >= 2) {
            if (articles[1]) {
                const card1Title = miniCards[0].querySelector('h4');
                if (card1Title) {
                    card1Title.textContent = articles[1].title;
                    card1Title.setAttribute('data-edit-key', 'articles.1.title');
                }
                const card1Img = miniCards[0].querySelector('.mini-img img');
                if (card1Img) {
                    card1Img.src = prependNews(articles[1].image);
                    card1Img.setAttribute('data-edit-key', 'articles.1.image');
                }
                const btn = miniCards[0].querySelector('.arrow-btn');
                if (btn) btn.href = `article.html?id=${articles[1].id}`;
            }

            if (articles[2]) {
                const card2Title = miniCards[1].querySelector('h4');
                if (card2Title) {
                    card2Title.textContent = articles[2].title;
                    card2Title.setAttribute('data-edit-key', 'articles.2.title');
                }
                const card2Img = miniCards[1].querySelector('.mini-img img');
                if (card2Img) {
                    card2Img.src = prependNews(articles[2].image);
                    card2Img.setAttribute('data-edit-key', 'articles.2.image');
                }
                const btn = miniCards[1].querySelector('.arrow-btn');
                if (btn) btn.href = `article.html?id=${articles[2].id}`;
            }
        }

        const partnerCard = document.querySelector('.news-sidebar .partner-news-card');
        if (partnerCard && articles[3]) {
            const partnerTitle = partnerCard.querySelector('h4');
            if (partnerTitle) {
                partnerTitle.textContent = articles[3].title;
                partnerTitle.setAttribute('data-edit-key', 'articles.3.title');
            }
            const partnerDesc = partnerCard.querySelector('p');
            if (partnerDesc) {
                partnerDesc.textContent = articles[3].subtitle || articles[3].title;
                partnerDesc.setAttribute('data-edit-key', 'articles.3.subtitle');
            }
            const partnerImg = partnerCard.querySelector('.partner-logos img, .partner-group img');
            if (partnerImg) {
                partnerImg.src = prependNews(articles[3].image);
                partnerImg.setAttribute('data-edit-key', 'articles.3.image');
            }
            const btn = partnerCard.querySelector('.arrow-btn');
            if (btn) btn.href = `article.html?id=${articles[3].id}`;
        }

        // Earlier section
        const earlierGrid = document.querySelector('.earlier-grid');
        if (earlierGrid && articles.length > 4) {
            earlierGrid.innerHTML = '';
            const emojis = ['🎉', '⭐', '🥇', '🌐', '☕', '📢', '🔥'];
            articles.slice(4).forEach((art, idx) => {
                const emoji = emojis[idx % emojis.length];
                const card = document.createElement('div');
                card.className = 'earlier-card';
                card.innerHTML = `
                    <div class="earlier-emoji">${emoji}</div>
                    <div class="earlier-card-content">
                        <h3>${art.title}</h3>
                        <p>${art.subtitle || ''}</p>
                    </div>
                    <a href="article.html?id=${art.id}" class="arrow-btn" aria-label="Читать"><img src="news/arrow right.svg" alt="arrow"></a>
                `;
                earlierGrid.appendChild(card);
            });
        }
    }

    function hydrateArticlePage(config) {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        const articles = config.articles || [];
        const article = articles.find(a => a.id === articleId) || articles[0];

        const container = document.getElementById('article-page-content');
        if (!container) return;

        if (!article) {
            container.innerHTML = `
                <div class="article-error">
                    <h2>Статья не найдена</h2>
                    <p>Запрашиваемая вами страница не существует или была перенесена.</p>
                    <a href="news.html" class="btn-orange" style="display:inline-block; text-decoration:none; padding: 12px 30px; border-radius:12px;">Вернуться к новостям</a>
                </div>
            `;
            return;
        }

        // Set metadata
        document.title = article.title + ' — Global Coffee';
        const breadcrumbCurrent = document.getElementById('breadcrumb-current');
        if (breadcrumbCurrent) {
            breadcrumbCurrent.textContent = article.title;
        }
        const metaDesc = document.getElementById('meta-desc');
        if (metaDesc) {
            metaDesc.content = article.subtitle || article.title;
        }

        const getImgUrl = (src) => {
            if (!src) return '';
            if (src.startsWith('http') || src.startsWith('/')) return src;
            if (src.startsWith('images/') || src.startsWith('news/')) return '/' + src;
            return '/news/' + src;
        };

        // Key facts sidebar card
        let factsHtml = '';
        if (article.key_facts && article.key_facts.length > 0) {
            factsHtml = `
                <div class="sidebar-card">
                    <h3 class="sidebar-card-title">Ключевые факты</h3>
                    <div class="facts-list">
                        ${article.key_facts.map(f => `
                            <div class="fact-item">
                                <span class="fact-label">${f.label}</span>
                                <span class="fact-value">${f.value}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Tags sidebar card
        let tagsHtml = '';
        if (article.tags && article.tags.length > 0) {
            tagsHtml = `
                <div class="sidebar-card">
                    <h3 class="sidebar-card-title">Теги</h3>
                    <div class="sidebar-tags">
                        ${article.tags.map(t => `<a href="#" class="sidebar-tag">#${t}</a>`).join('')}
                    </div>
                </div>
            `;
        }

        // Similar articles
        const similarArticles = articles.filter(a => a.id !== article.id).slice(0, 3);
        let similarHtml = '';
        if (similarArticles.length > 0) {
            similarHtml = `
                <div class="sidebar-card">
                    <h3 class="sidebar-card-title">
                        Похожие новости
                        <div class="nav-arrows">
                            <button class="nav-arrow" onclick="window.location.href='article.html?id=${similarArticles[0].id}'">←</button>
                            <button class="nav-arrow" onclick="window.location.href='article.html?id=${similarArticles[similarArticles.length - 1].id}'">→</button>
                        </div>
                    </h3>
                    <div class="similar-list">
                        ${similarArticles.map(sa => `
                            <a href="article.html?id=${sa.id}" class="similar-item">
                                <span class="similar-meta">${sa.category || 'Новость'} • ${sa.date}</span>
                                <span class="similar-title">${sa.title}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Article body blocks
        let bodyHtml = '';
        if (article.content && Array.isArray(article.content)) {
            article.content.forEach(block => {
                if (block.type === 'paragraph') {
                    bodyHtml += `<p>${block.text}</p>`;
                } else if (block.type === 'heading') {
                    bodyHtml += `<h2>${block.text}</h2>`;
                } else if (block.type === 'quote') {
                    bodyHtml += `
                        <blockquote class="article-quote">
                            ${block.text}
                            ${block.author ? `<span class="article-quote-author">${block.author}</span>` : ''}
                        </blockquote>
                    `;
                } else if (block.type === 'stats') {
                    bodyHtml += `
                        <div class="article-stats-grid">
                            ${(block.items || []).map(item => `
                                <div class="article-stat-card">
                                    <div class="article-stat-value">${item.value}</div>
                                    <div class="article-stat-label">${item.label}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                } else if (block.type === 'timeline') {
                    bodyHtml += `
                        <div class="article-timeline-container">
                            <h3 class="article-timeline-title">${block.title || 'Вехи истории'}</h3>
                            <div class="article-timeline">
                                ${(block.events || []).map(ev => `
                                    <div class="timeline-event">
                                        <div class="timeline-dot"></div>
                                        <div class="timeline-year">${ev.year}</div>
                                        <div class="timeline-text">${ev.text}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            });
        }

        window.copyArticleLink = function() {
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Ссылка скопирована в буфер обмена!');
            }).catch(err => {
                console.error(err);
            });
        };

        container.innerHTML = `
            <div class="article-layout">
                <!-- Left Column -->
                <article class="article-main">
                    <span class="article-tag">${article.category || 'Событие'}</span>
                    <h1 class="article-title">${article.title}</h1>
                    
                    <div class="article-meta">
                        <div class="meta-author">
                            <img src="${getImgUrl(article.avatar)}" alt="${article.author || 'Автор'}" class="avatar">
                            <span>${article.author || 'Global Coffee'}</span>
                        </div>
                        <div class="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>${article.date || 'Недавно'}</span>
                        </div>
                        <div class="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>${article.views || 4823} просмотров</span>
                        </div>
                        <div class="meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>${article.read_time || '5 мин чтения'}</span>
                        </div>
                    </div>
                    
                    <div class="article-cover">
                        <img src="${getImgUrl(article.image)}" alt="${article.title}">
                    </div>
                    
                    <div class="article-body">
                        ${bodyHtml}
                    </div>
                    
                    <div class="article-share">
                        <span class="share-label">Понравилась статья? Поделитесь:</span>
                        <div class="share-buttons">
                            <a href="https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}" target="_blank" class="share-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;">
                                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.84 8.7L15.11 16.85C14.98 17.43 14.64 17.57 14.15 17.3L11.52 15.36L10.25 16.58C10.11 16.72 9.99 16.84 9.72 16.84L9.91 14.14L14.83 9.7C15.04 9.51 14.79 9.4 14.51 9.59L8.43 13.42L5.81 12.6C5.24 12.42 5.23 12.03 5.93 11.76L16.14 7.82C16.61 7.65 17.02 7.93 16.84 8.7Z"/>
                                </svg> Telegram
                            </a>
                            <a href="https://vk.com/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(article.title)}" target="_blank" class="share-btn">
                                ВКонтакте
                            </a>
                            <button onclick="window.copyArticleLink()" class="share-btn">
                                Копировать ссылку
                            </button>
                        </div>
                    </div>
                </article>
                
                <!-- Right Column -->
                <aside class="article-sidebar">
                    <!-- Key Facts -->
                    ${factsHtml}
                    
                    <!-- Partner CTA -->
                    <div class="partner-cta-card">
                        <h3>Хотите стать партнером?</h3>
                        <p>Откройте собственную прибыльную кофейню в составе международной сети Global Coffee.</p>
                        <a href="franchise.html" class="partner-cta-btn">Узнать подробнее</a>
                    </div>
                    
                    <!-- Similar News -->
                    ${similarHtml}
                    
                    <!-- Tags -->
                    ${tagsHtml}
                </aside>
            </div>
        `;
    }

    // Expose dynamic updates to window object for Live visual editing communication
    window.updateConfigField = function(key, value) {
        const keys = key.split('.');
        if (keys.length < 2) return;

        const section = keys[0];
        const field = keys[1];

        if (section === 'general') {
            if (field === 'phone') {
                const phoneLinks = document.querySelectorAll('.phone-link, .mobile-menu-phone');
                phoneLinks.forEach(link => {
                    const span = link.querySelector('span');
                    if (span) span.textContent = value;
                    else link.textContent = value;
                    link.href = `tel:${value.replace(/[^\d+]/g, '')}`;
                });
                const footerPhones = document.querySelectorAll('.footer-contact-item a[href^="tel:"]');
                footerPhones.forEach(a => {
                    a.textContent = value;
                    a.href = `tel:${value.replace(/[^\d+]/g, '')}`;
                });
            } else if (field === 'email') {
                const footerEmails = document.querySelectorAll('.footer-contact-item a[href^="mailto:"]');
                footerEmails.forEach(a => {
                    a.textContent = value;
                    a.href = `mailto:${value}`;
                });
            }
        } else if (section === 'links') {
            if (field === 'instagram') {
                const instaLinks = document.querySelectorAll('.social-links a[data-edit-key="links.instagram"], .footer-social-link[data-edit-key="links.instagram"]');
                instaLinks.forEach(link => link.href = value);
            } else if (field === 'telegram') {
                const tgLinks = document.querySelectorAll('.social-links a[data-edit-key="links.telegram"], .footer-social-link[data-edit-key="links.telegram"]');
                tgLinks.forEach(link => link.href = value);
            } else if (field === 'whatsapp') {
                const waLinks = document.querySelectorAll('.social-links a[data-edit-key="links.whatsapp"], .footer-social-link[data-edit-key="links.whatsapp"]');
                waLinks.forEach(link => link.href = value);
            } else if (field === 'ios_app') {
                const iosLinks = document.querySelectorAll('.btn-store-mobile.ios, .btn-store-img:nth-child(1), a[class*="ios"]');
                iosLinks.forEach(link => link.href = value);
            } else if (field === 'android_app') {
                const androidLinks = document.querySelectorAll('.btn-store-mobile.android, .btn-store-img:nth-child(2), a[class*="android"]');
                androidLinks.forEach(link => link.href = value);
            } else if (field === 'franchise_presentation') {
                const presLinks = document.querySelectorAll('.btn-white');
                presLinks.forEach(link => {
                    if (link.textContent.includes('презентацию')) {
                        link.href = value;
                    }
                });
            } else if (field === 'privacy_policy') {
                const allAnchors = document.querySelectorAll('footer a, .footer-bottom a');
                allAnchors.forEach(a => {
                    if (a.textContent.includes('Политика конфиденциальности')) {
                        a.href = value;
                    }
                });
            } else if (field === 'nav_franchise') {
                const franchiseLinks = document.querySelectorAll('a[href="franchise.html"], a[href="/franchise.html"], a[href="franchise"], a[href="/franchise"], .mobile-menu-link[href*="franchise"]');
                franchiseLinks.forEach(link => link.href = value);
            } else if (field === 'nav_partners') {
                const partnersLinks = document.querySelectorAll('a[href="partners.html"], a[href="/partners.html"], a[href="partners"], a[href="/partners"], .mobile-menu-link[href*="partners"]');
                partnersLinks.forEach(link => link.href = value);
            }
        } else if (section === 'home') {
            if (field === 'hero_title') setElementText('.map-section .map-title', value);
            else if (field === 'hero_subtitle') setElementText('.map-section .map-subtitle', value);
            
            // About Slide 1
            else if (field === 'about_title_1') {
                const el = document.querySelector('.about-slider-track .about-slide:nth-child(1) .about-title');
                if (el) el.textContent = value;
            } else if (field === 'about_desc_1') {
                const el = document.querySelector('.about-slider-track .about-slide:nth-child(1) .about-text-content > p');
                if (el) el.textContent = value;
            } else if (field === 'about_bullets_1') {
                const el = document.querySelector('.about-slider-track .about-slide:nth-child(1) .item-details ul');
                if (el) {
                    el.innerHTML = value.split('\n').map(b => `<li style="margin-bottom: 5px;">${b}</li>`).join('');
                }
            } else if (field === 'about_image_1') {
                setElementImage('.about-slider-track .about-slide:nth-child(1) .about-image-wrapper img', value);
            }
            
            // About Slide 2
            else if (field === 'about_title_2') {
                const el = document.querySelector('.about-slider-track .about-slide:nth-child(2) .about-title');
                if (el) el.textContent = value;
            } else if (field === 'about_desc_2') {
                const el = document.querySelector('.about-slider-track .about-slide:nth-child(2) .about-list-item:nth-child(3) p, .about-slider-track .about-slide:nth-child(2) .about-list-item[style*="margin-top"] p');
                if (el) el.textContent = value;
            } else if (field === 'about_bullets_2') {
                const el = document.querySelector('.about-slider-track .about-slide:nth-child(2) .item-details ul');
                if (el) {
                    el.innerHTML = value.split('\n').map(b => `<li style="margin-bottom: 10px; position: relative; padding-left: 20px;"><span style="position: absolute; left: 0; color: #D4A373;">•</span> ${b}</li>`).join('');
                }
            } else if (field === 'about_image_2') {
                setElementImage('.about-slider-track .about-slide:nth-child(2) .about-image-wrapper img', value);
            }
            
            // About Slide 3
            else if (field === 'about_title_3') {
                const el = document.querySelector('.about-slider-track .about-slide:nth-child(3) .about-title');
                if (el) el.textContent = value;
            } else if (field === 'about_desc_3_1') {
                const el = document.querySelectorAll('.about-slider-track .about-slide:nth-child(3) .about-list-item p');
                if (el.length >= 1) el[0].textContent = value;
            } else if (field === 'about_desc_3_2') {
                const el = document.querySelectorAll('.about-slider-track .about-slide:nth-child(3) .about-list-item p');
                if (el.length >= 2) el[1].textContent = value;
            } else if (field === 'about_image_3') {
                setElementImage('.about-slider-track .about-slide:nth-child(3) .about-image-wrapper img', value);
            }
            
            // About Slide 4
            else if (field === 'about_title_4') {
                const el = document.querySelector('.about-slider-track .about-slide:nth-child(4) .about-title');
                if (el) el.textContent = value;
            } else if (field === 'about_desc_4_1') {
                const el = document.querySelectorAll('.about-slider-track .about-slide:nth-child(4) .about-list-item p');
                if (el.length >= 1) el[0].textContent = value;
            } else if (field === 'about_desc_4_2') {
                const el = document.querySelectorAll('.about-slider-track .about-slide:nth-child(4) .about-list-item p');
                if (el.length >= 2) el[1].textContent = value;
            } else if (field === 'about_image_4') {
                setElementImage('.about-slider-track .about-slide:nth-child(4) .about-image-wrapper img', value);
            }
            
            // App Section
            else if (field === 'app_title') setElementText('.app-section .section-title', value);
            else if (field === 'app_subtitle') setElementText('.app-section .section-subtitle', value);
            else if (field === 'app_desc') setElementText('.app-text-info p', value);
            else if (field === 'app_image_left') setElementImage('.app-main-card img', value);
            else if (field === 'app_image_right') setElementImage('.app-secondary-card img:not(.btn-store-img img)', value);

            // Franchise Section
            else if (field === 'franchise_title') setElementText('.franchise-section .franchise-title', value);
            else if (field === 'franchise_desc') setElementText('.franchise-section .franchise-desc', value);
            else if (field === 'franchise_gallery_1') {
                const el = document.querySelectorAll('.franchise-gallery .gallery-item img');
                if (el.length >= 1) el[0].src = value;
            } else if (field === 'franchise_gallery_2') {
                const el = document.querySelectorAll('.franchise-gallery .gallery-item img');
                if (el.length >= 2) el[1].src = value;
            }

            // News Section
            else if (field === 'news_title') setElementText('.news-section .franchise-title', value);
            else if (field === 'news_desc') setElementText('.news-section .franchise-desc', value);
            else if (field === 'news_main_title') setElementText('.news-main-card .main-news-title', value);
            else if (field === 'news_main_subtitle') setElementText('.news-main-card .main-news-subtitle', value);
            else if (field === 'news_main_author') setElementText('.news-main-card .author span', value);
            else if (field === 'news_main_avatar') setElementImage('.news-main-card .author .avatar', value);
            else if (field === 'news_main_image') setElementImage('.news-main-card .main-news-image img', value);
            
            else if (field === 'news_item_1_title') {
                const el = document.querySelector('.news-sidebar .mini-news-card:nth-child(1) h4');
                if (el) el.textContent = value;
            } else if (field === 'news_item_1_image') {
                const el = document.querySelector('.news-sidebar .mini-news-card:nth-child(1) .mini-img img');
                if (el) el.src = value;
            } else if (field === 'news_item_2_title') {
                const el = document.querySelector('.news-sidebar .mini-news-card:nth-child(2) h4');
                if (el) el.textContent = value;
            } else if (field === 'news_item_2_image') {
                const el = document.querySelector('.news-sidebar .mini-news-card:nth-child(2) .mini-img img');
                if (el) el.src = value;
            }

            else if (field === 'news_partner_title') {
                const el = document.querySelector('.news-sidebar .partner-news-card h4');
                if (el) el.textContent = value;
            } else if (field === 'news_partner_desc') {
                const el = document.querySelector('.news-sidebar .partner-news-card p');
                if (el) el.textContent = value;
            } else if (field === 'news_partner_image') {
                const el = document.querySelector('.news-sidebar .partner-news-card .partner-logos img');
                if (el) el.src = value;
            }

            // Contact Founders
            else if (field === 'contact_founders_title') setElementText('.contact-section .franchise-title', value);
            else if (field === 'contact_founders_desc') setElementText('.contact-section .franchise-desc', value);

            // Partnership
            else if (field === 'partnership_title') setElementText('.partnership-section .partnership-title', value);
            else if (field === 'partnership_subtitle') setElementText('.partnership-section .partnership-subtitle', value);
            else if (field === 'partnership_desc') setElementText('.partnership-left-text-card .partnership-desc', value);
            else if (field === 'partnership_image_left') setElementImage('.partnership-left-img-wrapper img', value);
            else if (field === 'partnership_image_right') setElementImage('.partnership-right-img-wrapper img', value);

            // Quality
            else if (field === 'quality_title') setElementText('.quality-section .quality-title', value);
            else if (field === 'quality_subtitle') setElementText('.quality-section .quality-subtitle', value);
            else if (field === 'quality_image') setElementImage('.quality-image-wrapper img', value);

            // Partners title
            else if (field === 'partners_title') setElementText('.partners-section .section-title', value);
        } else if (section === 'franchise') {
            if (field === 'hero_title') setElementText('.partners-hero .section-title', value);
            else if (field === 'hero_subtitle') setElementText('.partners-hero .section-subtitle', value);
        } else if (section === 'partners') {
            if (field === 'hero_title') setElementText('.partners-hero .section-title', value);
            else if (field === 'hero_subtitle') setElementText('.partners-hero .section-subtitle', value);
        }
    };

    // Listen to messages from the parent window (WordPress customizer panel)
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'customizer-update') {
            window.updateConfigField(event.data.key, event.data.value);
        }
    });

    // Click-to-edit listener for admin visual customizer
    if (window.self !== window.top) {
        // We are inside an iframe (visual editor mode)
        // Add visual indicator styles for editable elements
        const editStyle = document.createElement('style');
        editStyle.textContent = `
            [data-edit-key] {
                cursor: pointer !important;
                position: relative;
                transition: outline 0.15s ease, box-shadow 0.15s ease;
            }
            [data-edit-key]:hover {
                outline: 2px dashed #3582c4 !important;
                outline-offset: 2px;
                box-shadow: 0 0 8px rgba(53, 130, 196, 0.4);
            }
            [data-edit-key].active-editing {
                outline: 2px solid #FBB03B !important;
                outline-offset: 2px;
                box-shadow: 0 0 12px rgba(251, 176, 59, 0.6);
            }
        `;
        document.head.appendChild(editStyle);

        // Intercept clicks on editable items
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-edit-key]');
            if (target) {
                e.preventDefault();
                e.stopPropagation();
                
                // Clear previous editing outline
                document.querySelectorAll('.active-editing').forEach(el => el.classList.remove('active-editing'));
                target.classList.add('active-editing');
                
                const key = target.getAttribute('data-edit-key');
                window.parent.postMessage({
                    type: 'visual-editor-select',
                    key: key
                }, '*');
            }
        }, true); // Use capture phase to intercept click before other scripts
    }
});
