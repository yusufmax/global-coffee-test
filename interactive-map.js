// Interactive Leaflet Map Logic for Global Coffee
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map');
    const locationsGrid = document.querySelector('.locations-grid');
    const filterButtons = document.querySelectorAll('.map-filters .filter-btn');
    
    if (!mapContainer) return;

    // Inject CSS for custom pins, popups, and Leaflet overrides dynamically
    const style = document.createElement('style');
    style.textContent = `
        .map-pin {
            width: 14px;
            height: 14px;
            background: #FBB03B;
            border: 3px solid #1a1410;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(251, 176, 59, 0.6);
            transition: all 0.3s ease;
            position: relative;
        }
        .map-pin::after {
            content: '';
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            border: 1.5px solid #FBB03B;
            animation: pin-pulse 2s infinite;
            pointer-events: none;
            opacity: 0.6;
        }
        .map-pin:hover, .map-pin.active {
            background: #ffffff;
            border-color: #FBB03B;
            transform: scale(1.3);
        }
        .leaflet-container {
            background: #15110F !important;
            font-family: inherit;
        }
        /* Custom Popup styling */
        .leaflet-popup-content-wrapper {
            background: #1a1410 !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
            color: #ffffff !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6) !important;
            padding: 0 !important;
        }
        .leaflet-popup-content {
            margin: 12px 16px !important;
            font-size: 0.85rem !important;
            font-family: 'Inter', sans-serif !important;
        }
        .leaflet-popup-tip {
            background: #1a1410 !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .map-tooltip-city {
            font-weight: 700;
            color: #FBB03B;
            margin-bottom: 4px;
            text-transform: uppercase;
            font-family: 'Comfortaa', sans-serif;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
        }
        .map-tooltip-street {
            color: #ffffff;
            margin-bottom: 4px;
            font-weight: 500;
            line-height: 1.3;
        }
        .map-tooltip-hours {
            color: #8A8581;
            font-size: 0.75rem;
        }
        @keyframes pin-pulse {
            0% {
                transform: scale(0.9);
                opacity: 0.8;
            }
            70% {
                transform: scale(1.6);
                opacity: 0;
            }
            100% {
                transform: scale(1.6);
                opacity: 0;
            }
        }

        /* Hide default Leaflet controls or customize them */
        .leaflet-control-attribution {
            background: rgba(26, 22, 20, 0.6) !important;
            color: rgba(255, 255, 255, 0.3) !important;
        }
        .leaflet-control-attribution a {
            color: rgba(251, 176, 59, 0.5) !important;
        }

        /* Map controls styling */
        .map-controls {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 1000;
        }
        .map-control-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(26, 22, 20, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #ffffff;
            font-size: 1.3rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            transition: all 0.2s ease;
        }
        .map-control-btn:hover {
            background: #FBB03B;
            color: #1a1410;
            border-color: #FBB03B;
            transform: scale(1.05);
        }
        .map-control-btn:active {
            transform: scale(0.95);
        }
    `;
    document.head.appendChild(style);

    // Country centers for maps
    const countryCenters = {
        'КАЗАХСТАН': { center: [48.0196, 66.9237], zoom: 5 },
        'УЗБЕКИСТАН': { center: [41.3775, 64.5853], zoom: 6 },
        'ГРУЗИЯ': { center: [42.3185, 43.3569], zoom: 7.5 }
    };

    let currentCountry = 'КАЗАХСТАН';
    let mapPoints = [];
    const markers = {};

    // Initialize Leaflet Map
    const initialConf = countryCenters[currentCountry];
    const map = L.map('map', {
        center: initialConf.center,
        zoom: initialConf.zoom,
        zoomControl: false, // Use our custom styled buttons
        attributionControl: true
    });

    // Add Dark Mode Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // Add Custom Styled Zoom Controls
    const controls = document.createElement('div');
    controls.className = 'map-controls';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'map-control-btn';
    zoomInBtn.innerHTML = '+';
    zoomInBtn.title = 'Приблизить';
    zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        map.zoomIn();
    });

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'map-control-btn';
    zoomOutBtn.innerHTML = '−';
    zoomOutBtn.title = 'Отдалить';
    zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        map.zoomOut();
    });

    const resetBtn = document.createElement('button');
    resetBtn.className = 'map-control-btn';
    resetBtn.innerHTML = '⟲';
    resetBtn.title = 'Сбросить масштаб';
    resetBtn.style.fontSize = '1.1rem';
    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const conf = countryCenters[currentCountry];
        if (conf) {
            map.setView(conf.center, conf.zoom);
        }
    });

    controls.appendChild(zoomInBtn);
    controls.appendChild(zoomOutBtn);
    controls.appendChild(resetBtn);
    mapContainer.appendChild(controls);

    // Fetch config and initialize
    fetch('/api/config')
        .then(res => res.json())
        .then(config => {
            mapPoints = config.map_points || [];
            renderMap();
        })
        .catch(err => console.error('Error fetching map points:', err));

    // Render pins and address cards
    function renderMap() {
        // Remove existing markers
        for (const id in markers) {
            markers[id].remove();
            delete markers[id];
        }

        // Filter points by active country
        const filteredPoints = mapPoints.filter(p => p.country.toUpperCase() === currentCountry.toUpperCase());

        // Create markers
        filteredPoints.forEach(point => {
            if (point.lat && point.lng) {
                // Create custom divIcon for orange circle matching global coffee theme
                const customIcon = L.divIcon({
                    className: 'custom-leaflet-pin-wrapper',
                    html: `<div class="map-pin" data-id="${point.id}"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                });

                const tooltipHtml = `
                    <div class="map-tooltip-city">${point.city}</div>
                    <div class="map-tooltip-street">${point.street}</div>
                    <div class="map-tooltip-hours">График работы: ${point.hours}</div>
                `;

                const marker = L.marker([point.lat, point.lng], { icon: customIcon }).addTo(map);
                marker.bindPopup(tooltipHtml, {
                    offset: [0, -10]
                });

                marker.on('click', () => {
                    map.setView([point.lat, point.lng], 13);
                    highlightLocationCard(point.city, point.street);
                });

                markers[point.id] = marker;
            }
        });

        // Render location cards
        renderLocationCards(filteredPoints);
    }

    // Group locations by city and render cards
    function renderLocationCards(points) {
        if (!locationsGrid) return;
        locationsGrid.innerHTML = '';

        if (points.length === 0) {
            locationsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #8A8581; padding: 40px;">В этой стране пока нет открытых кофеен.</div>';
            return;
        }

        // Group points by city
        const cities = {};
        points.forEach(p => {
            const city = p.city.toUpperCase();
            if (!cities[city]) {
                cities[city] = [];
            }
            cities[city].push(p);
        });

        // Create cards
        Object.keys(cities).forEach(city => {
            const card = document.createElement('div');
            card.className = 'location-card';
            
            const cityTitle = document.createElement('h3');
            cityTitle.className = 'location-city';
            cityTitle.textContent = city;
            card.appendChild(cityTitle);

            cities[city].forEach(item => {
                const addressItem = document.createElement('div');
                addressItem.className = 'address-item';
                addressItem.dataset.id = item.id;
                addressItem.innerHTML = `
                    <div class="address-icon">
                        <img src="location.png" alt="Location" class="address-marker-icon">
                    </div>
                    <div class="address-info">
                        <p class="address-street">${item.street}</p>
                        <p class="address-hours">График работы: ${item.hours}</p>
                    </div>
                `;

                // Hovering address item highlights corresponding pin on the map
                addressItem.addEventListener('mouseenter', () => {
                    const marker = markers[item.id];
                    if (marker) {
                        const markerEl = marker.getElement();
                        if (markerEl) {
                            const pinEl = markerEl.querySelector('.map-pin');
                            if (pinEl) pinEl.classList.add('active');
                        }
                    }
                });
                addressItem.addEventListener('mouseleave', () => {
                    const marker = markers[item.id];
                    if (marker) {
                        const markerEl = marker.getElement();
                        if (markerEl) {
                            const pinEl = markerEl.querySelector('.map-pin');
                            if (pinEl) pinEl.classList.remove('active');
                        }
                    }
                });

                // Clicking address item pans & zooms into the pin and opens popup
                addressItem.addEventListener('click', () => {
                    const marker = markers[item.id];
                    if (marker) {
                        map.setView([item.lat, item.lng], 14);
                        marker.openPopup();
                    }
                });

                card.appendChild(addressItem);
            });

            locationsGrid.appendChild(card);
        });
    }

    // Highlight card when pin is clicked
    function highlightLocationCard(city, street) {
        if (!locationsGrid) return;
        const cards = locationsGrid.querySelectorAll('.location-card');
        cards.forEach(card => {
            const cityHeader = card.querySelector('.location-city');
            if (cityHeader && cityHeader.textContent.toUpperCase() === city.toUpperCase()) {
                const items = card.querySelectorAll('.address-item');
                items.forEach(item => {
                    const streetText = item.querySelector('.address-street');
                    if (streetText && streetText.textContent === street) {
                        item.style.backgroundColor = 'rgba(251, 176, 59, 0.15)';
                        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            item.style.backgroundColor = '';
                        }, 2500);
                    }
                });
            }
        });
    }

    // Filter button listeners
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCountry = btn.textContent.trim().toUpperCase();
                
                // Set map view to the country center
                const conf = countryCenters[currentCountry];
                if (conf) {
                    map.setView(conf.center, conf.zoom);
                }
                renderMap();
            });
        });
    }
});
