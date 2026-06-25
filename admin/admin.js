// WordPress styled Admin Panel Interaction
let currentConfig = {};
let allLeads = [];
let activeSection = 'dashboard';
let activeSubtab = 'home';
let activeMapPoint = null;
let mapVisualCountry = 'КАЗАХСТАН';
let isDragging = false;
let dragPin = null;

// Leaflet variables for Admin Map Editor
let adminMap = null;
let adminMarkers = {};
let tempMarker = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupCollapsibles();
    setupTabs();
    setupNavigation();
    setupImageUploadPreviews();
    setupMapDragAndDrop();
    setupCustomizerPreviewSync();
});

// AUTHENTICATION WALL
function checkAuth() {
    const session = localStorage.getItem('gc_admin_logged');
    if (session === 'true') {
        showAdminLayout();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminLayout').style.display = 'none';
}

function showAdminLayout() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminLayout').style.display = 'block';
    loadData();
}

function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');

    // Fetch config to verify password
    fetch('/api/config')
        .then(res => res.json())
        .then(config => {
            const correctPass = config.general?.admin_password || 'admin';
            if (password === correctPass) {
                localStorage.setItem('gc_admin_logged', 'true');
                errorMsg.style.display = 'none';
                document.getElementById('password').value = '';
                showAdminLayout();
            } else {
                errorMsg.style.display = 'block';
            }
        })
        .catch(err => {
            console.error(err);
            alert('Ошибка сервера при авторизации.');
        });
}

function handleLogout() {
    localStorage.removeItem('gc_admin_logged');
    showLoginScreen();
}

// NAVIGATION
function setupNavigation() {
    const items = document.querySelectorAll('.wp-sidebar .menu-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.dataset.target;
            switchTab(target);
        });
    });
}

function switchTab(target) {
    activeSection = target;
    
    // Update menu items in sidebar visually
    const items = document.querySelectorAll('.wp-sidebar .menu-item');
    items.forEach(i => {
        if (i.dataset.target === target) {
            i.classList.add('active');
        } else {
            i.classList.remove('active');
        }
    });

    const sections = document.querySelectorAll('.wp-content .content-section');
    sections.forEach(s => {
        if (s.id === `sec-${target}`) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });

    if (target === 'dashboard') {
        loadStats();
    } else if (target === 'page-editor') {
        populatePageEditor();
        syncCurrentFieldsToIframe();
    } else if (target === 'map-editor') {
        initAdminMap();
        renderPointsTable();
    } else if (target === 'leads') {
        loadLeadsList();
    } else if (target === 'settings') {
        populateSettings();
    }
}

// TABS FOR CONTENT EDITOR
function setupTabs() {
    const tabs = document.querySelectorAll('.wp-tabs-bar .wp-tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const subtab = tab.dataset.subtab;
            activeSubtab = subtab;
            
            const contents = document.querySelectorAll('#sec-page-editor .subtab-content');
            contents.forEach(c => {
                if (c.id === `sub-${subtab}`) {
                    c.classList.add('active');
                } else {
                    c.classList.remove('active');
                }
            });
        });
    });
}

// COLLAPSIBLES (ACCORDIONS)
function setupCollapsibles() {
    document.addEventListener('click', (e) => {
        const header = e.target.closest('.wp-collapsible-header');
        if (header) {
            const item = header.parentElement;
            item.classList.toggle('open');
        }
    });
}

// DATA LOAD AND POPULATE
function loadData() {
    fetch('/api/config')
        .then(res => res.json())
        .then(config => {
            currentConfig = config;
            loadStats();
            renderArticlesTable();
        })
        .catch(err => console.error(err));
}

function loadStats() {
    // Total Leads
    fetch('/api/leads')
        .then(res => res.json())
        .then(leads => {
            allLeads = leads;
            document.getElementById('statLeads').textContent = leads.length;
            
            // Badge in sidebar
            const badge = document.getElementById('leadsBadge');
            if (leads.length > 0) {
                badge.textContent = leads.length;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }

            // Populate dashboard quick table
            const tbody = document.getElementById('recentLeadsTable');
            tbody.innerHTML = '';
            
            const recent = leads.slice(0, 5);
            if (recent.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">Нет входящих заявок.</td></tr>';
            } else {
                recent.forEach(lead => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${lead.name}</strong></td>
                        <td>${lead.phone}</td>
                        <td><span style="background:#e0f0ff; color:#0066cc; padding:2px 6px; border-radius:3px; font-size:11px;">${lead.type}</span></td>
                        <td>${lead.date}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        });

    // Map stats
    const pointsCount = currentConfig.map_points?.length || 0;
    document.getElementById('statPoints').textContent = pointsCount;

    // Unique cities count
    const cities = new Set(currentConfig.map_points?.map(p => p.city.toUpperCase()));
    document.getElementById('statCities').textContent = cities.size;

    // Telegram bot status
    const botStatus = document.getElementById('statTelegram');
    if (currentConfig.general?.telegram_bot_token && currentConfig.general?.telegram_chat_id) {
        botStatus.textContent = 'Подключен';
        botStatus.style.color = '#46b450';
        botStatus.style.fontWeight = '700';
    } else {
        botStatus.textContent = 'Отключен';
        botStatus.style.color = '#d63638';
        botStatus.style.fontWeight = '700';
    }
}

// POPULATE PAGE EDITOR FORMS
function populatePageEditor() {
    const form = document.getElementById('pageEditorForm');
    
    // Fill all home inputs
    for (const key in currentConfig.home) {
        const val = currentConfig.home[key];
        const input = form.querySelector(`[name="home.${key}"]`);
        
        if (input) {
            input.value = val;
        }

        // Check image preview
        const preview = document.getElementById(`preview-home-${key}`);
        if (preview && typeof val === 'string' && (val.endsWith('.png') || val.endsWith('.jpg') || val.endsWith('.jpeg') || val.endsWith('.svg') || val.startsWith('/images/') || val.startsWith('data:'))) {
            preview.src = val;
            preview.style.display = 'block';
        }
    }

    // Fill franchise inputs
    for (const key in currentConfig.franchise) {
        const val = currentConfig.franchise[key];
        const input = form.querySelector(`[name="franchise.${key}"]`);
        if (input) input.value = val;
    }

    // Fill partners inputs
    for (const key in currentConfig.partners) {
        const val = currentConfig.partners[key];
        const input = form.querySelector(`[name="partners.${key}"]`);
        if (input) input.value = val;
    }

    // Fill general inputs
    for (const key in currentConfig.general) {
        const val = currentConfig.general[key];
        const input = form.querySelector(`[name="general.${key}"]`);
        if (input) input.value = val;
    }

    // Fill links inputs
    for (const key in currentConfig.links) {
        const val = currentConfig.links[key];
        const input = form.querySelector(`[name="links.${key}"]`);
        if (input) input.value = val;
    }
}

// ASSET IMAGE FILE READ TO BASE64 AND UPLOAD
function setupImageUploadPreviews() {
    const fileInputs = document.querySelectorAll('#pageEditorForm input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const key = input.dataset.key;
            const preview = document.getElementById(`preview-${key.replace('.', '-')}`);

            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Data = event.target.result;
                
                // Show local loading state on preview
                if (preview) {
                    preview.src = base64Data;
                    preview.style.display = 'block';
                    preview.style.opacity = '0.5';
                }

                // Upload to backend
                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filename: file.name,
                            filedata: base64Data
                        })
                    });
                    const result = await res.json();
                    
                    if (result.status === 'success') {
                        // Update our config cache with returned public image url
                        const keys = key.split('.');
                        if (keys.length === 2) {
                            currentConfig[keys[0]][keys[1]] = result.url;
                        }

                        if (preview) {
                            preview.src = result.url;
                            preview.style.opacity = '1';
                        }
                        showToast('Изображение загружено!');
                        
                        // Live update visual customizer preview
                        const iframe = document.getElementById('customizerPreviewIframe');
                        if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({
                                type: 'customizer-update',
                                key: key,
                                value: result.url
                            }, '*');
                        }
                    } else {
                        alert('Не удалось загрузить изображение на сервер.');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Ошибка при соединении с сервером.');
                }
            };
            reader.readAsDataURL(file);
        });
    });
}

// SAVE PAGE EDITOR FORM
async function savePageContent(e) {
    e.preventDefault();
    const form = document.getElementById('pageEditorForm');
    
    // Read text values from form inputs and update currentConfig
    const inputs = form.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(input => {
        const name = input.name;
        if (!name) return;
        const keys = name.split('.');
        if (keys.length === 2) {
            currentConfig[keys[0]][keys[1]] = input.value;
        }
    });

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentConfig)
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast('Контент сохранен успешно!');
        } else {
            alert('Ошибка при сохранении контента.');
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка при соединении с сервером.');
    }
}

// MAP EDITOR - LEAFLET VISUAL INTEGRATION
function changeMapVisualCountry() {
    mapVisualCountry = document.getElementById('mapVisualCountry').value;
    renderVisualMap();
}

function initAdminMap() {
    const container = document.getElementById('visualMapContainer');
    if (!container) return;
    
    if (!adminMap) {
        // Create Admin Leaflet Map
        adminMap = L.map('visualMapContainer', {
            center: [48.0196, 66.9237],
            zoom: 4.5,
            attributionControl: true
        });
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(adminMap);
        
        // Click map to place a new point
        adminMap.on('click', (e) => {
            const { lat, lng } = e.latlng;
            cancelPointEdit();
            
            document.getElementById('pointLat').value = lat.toFixed(6);
            document.getElementById('pointLng').value = lng.toFixed(6);
            document.getElementById('pointCountry').value = mapVisualCountry;
            
            // Place a temporary visual marker
            if (tempMarker) {
                tempMarker.setLatLng([lat, lng]);
            } else {
                const tempIcon = L.divIcon({
                    className: 'custom-leaflet-pin-wrapper',
                    html: `<div class="map-pin active" style="background: #ffffff; border-color: #FBB03B;"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                });
                tempMarker = L.marker([lat, lng], { icon: tempIcon }).addTo(adminMap);
            }
            
            document.getElementById('pointCity').focus();
        });
    } else {
        // Redraw container size if map was hidden
        setTimeout(() => {
            adminMap.invalidateSize();
        }, 100);
    }
    
    renderVisualMap();
}

function renderVisualMap() {
    if (!adminMap) return;
    
    // Remove existing markers
    for (const id in adminMarkers) {
        adminMarkers[id].remove();
        delete adminMarkers[id];
    }
    if (tempMarker) {
        tempMarker.remove();
        tempMarker = null;
    }
    
    const points = currentConfig.map_points || [];
    const filtered = points.filter(p => p.country.toUpperCase() === mapVisualCountry.toUpperCase());
    
    // Centers of countries
    const countryCenters = {
        'КАЗАХСТАН': { center: [48.0196, 66.9237], zoom: 5 },
        'УЗБЕКИСТАН': { center: [41.3775, 64.5853], zoom: 6 },
        'ГРУЗИЯ': { center: [42.3185, 43.3569], zoom: 7.5 }
    };
    
    const conf = countryCenters[mapVisualCountry.toUpperCase()];
    if (conf) {
        adminMap.setView(conf.center, conf.zoom);
    }
    
    // Inject marker styles for active status
    if (!document.getElementById('admin-map-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-map-styles';
        style.textContent = `
            .map-pin {
                width: 14px;
                height: 14px;
                background: #FBB03B;
                border: 3px solid #1a1410;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(251, 176, 59, 0.6);
            }
            .map-pin.active {
                background: #ffffff;
                border-color: #FBB03B;
                transform: scale(1.3);
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
            }
        `;
        document.head.appendChild(style);
    }

    filtered.forEach(point => {
        if (point.lat && point.lng) {
            const isActive = activeMapPoint && activeMapPoint.id === point.id;
            const pinClass = isActive ? 'map-pin active' : 'map-pin';
            
            const customIcon = L.divIcon({
                className: 'custom-leaflet-pin-wrapper',
                html: `<div class="${pinClass}" data-id="${point.id}"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });
            
            // Markers are draggable so user can adjust positions
            const marker = L.marker([point.lat, point.lng], {
                icon: customIcon,
                draggable: true
            }).addTo(adminMap);
            
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                selectPointForEdit(point);
            });
            
            // Drag markers to update coordinate inputs in real-time
            marker.on('drag', (e) => {
                const { lat, lng } = e.target.getLatLng();
                if (activeMapPoint && activeMapPoint.id === point.id) {
                    document.getElementById('pointLat').value = lat.toFixed(6);
                    document.getElementById('pointLng').value = lng.toFixed(6);
                }
            });
            
            // Save after drag end
            marker.on('dragend', async (e) => {
                const { lat, lng } = e.target.getLatLng();
                point.lat = parseFloat(lat.toFixed(6));
                point.lng = parseFloat(lng.toFixed(6));
                
                if (activeMapPoint && activeMapPoint.id === point.id) {
                    document.getElementById('pointLat').value = point.lat;
                    document.getElementById('pointLng').value = point.lng;
                }
                
                try {
                    await fetch('/api/config', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(currentConfig)
                    });
                    showToast('Координаты сохранены!');
                    renderPointsTable();
                } catch (err) {
                    console.error(err);
                }
            });
            
            adminMarkers[point.id] = marker;
        }
    });
}

function renderPointsTable() {
    const tbody = document.getElementById('allPointsTable');
    tbody.innerHTML = '';
    const points = currentConfig.map_points || [];
    
    if (points.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Нет зарегистрированных точек.</td></tr>';
        return;
    }

    points.forEach(point => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${point.id}</td>
            <td><strong>${point.country}</strong></td>
            <td>${point.city}</td>
            <td>${point.street}</td>
            <td>${point.hours}</td>
            <td>${point.lat ? point.lat.toFixed(6) : 'N/A'} / ${point.lng ? point.lng.toFixed(6) : 'N/A'}</td>
            <td>
                <button onclick="editPointFromTable(${point.id})" class="wp-button wp-button-secondary" style="padding:2px 8px; font-size:11px;">Правка</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function selectPointForEdit(point) {
    activeMapPoint = point;
    
    if (tempMarker) {
        tempMarker.remove();
        tempMarker = null;
    }
    
    // Highlight active marker class
    for (const id in adminMarkers) {
        const marker = adminMarkers[id];
        const markerEl = marker.getElement();
        if (markerEl) {
            const pinEl = markerEl.querySelector('.map-pin');
            if (pinEl) {
                if (parseInt(id) === point.id) {
                    pinEl.classList.add('active');
                } else {
                    pinEl.classList.remove('active');
                }
            }
        }
    }

    document.getElementById('mapFormTitle').textContent = 'Редактировать кофейню';
    document.getElementById('pointId').value = point.id;
    document.getElementById('pointCountry').value = point.country;
    document.getElementById('pointCity').value = point.city;
    document.getElementById('pointStreet').value = point.street;
    document.getElementById('pointHours').value = point.hours;
    document.getElementById('pointLat').value = point.lat;
    document.getElementById('pointLng').value = point.lng;

    document.getElementById('btnSavePoint').textContent = 'Сохранить точку';
    document.getElementById('btnDeletePoint').style.display = 'inline-block';
}

function editPointFromTable(id) {
    const point = currentConfig.map_points.find(p => p.id === id);
    if (!point) return;
    
    document.getElementById('mapVisualCountry').value = point.country.toUpperCase();
    mapVisualCountry = point.country.toUpperCase();
    renderVisualMap();

    selectPointForEdit(point);
    
    if (adminMap && point.lat && point.lng) {
        adminMap.setView([point.lat, point.lng], 13);
    }
    
    document.getElementById('sec-map-editor').scrollIntoView({ behavior: 'smooth' });
}

function cancelPointEdit() {
    activeMapPoint = null;
    document.getElementById('mapFormTitle').textContent = 'Добавить кофейню';
    document.getElementById('pointId').value = '';
    document.getElementById('pointCountry').value = mapVisualCountry;
    document.getElementById('pointCity').value = '';
    document.getElementById('pointStreet').value = '';
    document.getElementById('pointHours').value = '';
    document.getElementById('pointLat').value = '';
    document.getElementById('pointLng').value = '';

    document.getElementById('btnSavePoint').textContent = 'Создать точку';
    document.getElementById('btnDeletePoint').style.display = 'none';

    if (tempMarker) {
        tempMarker.remove();
        tempMarker = null;
    }

    for (const id in adminMarkers) {
        const marker = adminMarkers[id];
        const markerEl = marker.getElement();
        if (markerEl) {
            const pinEl = markerEl.querySelector('.map-pin');
            if (pinEl) pinEl.classList.remove('active');
        }
    }
}

function setupMapDragAndDrop() {
    // Math drag handlers are handled natively by Leaflet draggable events in initAdminMap
}

// SAVE OR CREATE MAP POINT
async function saveMapPoint(e) {
    e.preventDefault();
    const points = currentConfig.map_points || [];

    const idVal = document.getElementById('pointId').value;
    const country = document.getElementById('pointCountry').value;
    const city = document.getElementById('pointCity').value.toUpperCase();
    const street = document.getElementById('pointStreet').value;
    const hours = document.getElementById('pointHours').value;
    const lat = parseFloat(document.getElementById('pointLat').value);
    const lng = parseFloat(document.getElementById('pointLng').value);

    if (idVal) {
        // Edit existing point
        const pointId = parseInt(idVal);
        const pt = points.find(p => p.id === pointId);
        if (pt) {
            pt.country = country;
            pt.city = city;
            pt.street = street;
            pt.hours = hours;
            pt.lat = lat;
            pt.lng = lng;
        }
    } else {
        // Create new point
        const maxId = points.reduce((max, p) => p.id > max ? p.id : max, 0);
        const newPoint = {
            id: maxId + 1,
            country: country,
            city: city,
            street: street,
            hours: hours,
            lat: lat,
            lng: lng
        };
        points.push(newPoint);
    }

    currentConfig.map_points = points;

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentConfig)
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast('Точка на карте обновлена!');
            cancelPointEdit();
            renderVisualMap();
            renderPointsTable();
        } else {
            alert('Ошибка при сохранении точки.');
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка при соединении с сервером.');
    }
}

// DELETE ACTIVE MAP POINT
async function deleteActivePoint() {
    if (!activeMapPoint) return;
    if (!confirm('Вы действительно хотите удалить эту кофейню с карты?')) return;

    const points = currentConfig.map_points || [];
    currentConfig.map_points = points.filter(p => p.id !== activeMapPoint.id);

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentConfig)
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast('Кофейня удалена!');
            cancelPointEdit();
            renderVisualMap();
            renderPointsTable();
        } else {
            alert('Ошибка при удалении точки.');
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка при соединении с сервером.');
    }
}

// LEADS MANAGEMENT
function loadLeadsList() {
    fetch('/api/leads')
        .then(res => res.json())
        .then(leads => {
            allLeads = leads;
            filterLeads();
        });
}

function filterLeads() {
    const query = document.getElementById('leadSearch').value.toLowerCase();
    const tbody = document.getElementById('allLeadsTable');
    tbody.innerHTML = '';

    const filtered = allLeads.filter(lead => {
        return lead.name.toLowerCase().includes(query) || 
               lead.phone.toLowerCase().includes(query) ||
               lead.type.toLowerCase().includes(query) ||
               lead.message.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Ничего не найдено.</td></tr>';
        return;
    }

    filtered.forEach(lead => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${lead.id}</td>
            <td><strong>${lead.name}</strong></td>
            <td>${lead.phone}</td>
            <td><span style="background:#e0f0ff; color:#0066cc; padding:4px 8px; border-radius:3px; font-size:11px; font-weight:600;">${lead.type}</span></td>
            <td>${lead.page}</td>
            <td>${lead.date}</td>
            <td style="max-width:300px; word-wrap:break-word;">${lead.message || '<em style="color:#aaa;">Без сообщения</em>'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// TELEGRAM INTEGRATION AND SETTINGS
function populateSettings() {
    document.getElementById('tgBotToken').value = currentConfig.general?.telegram_bot_token || '';
    document.getElementById('tgChatId').value = currentConfig.general?.telegram_chat_id || '';
}

async function saveTelegramSettings(e) {
    e.preventDefault();
    if (!currentConfig.general) currentConfig.general = {};

    currentConfig.general.telegram_bot_token = document.getElementById('tgBotToken').value.trim();
    currentConfig.general.telegram_chat_id = document.getElementById('tgChatId').value.trim();

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentConfig)
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast('Настройки Telegram сохранены!');
            loadStats();
        } else {
            alert('Ошибка при сохранении настроек.');
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка при соединении с сервером.');
    }
}

async function testTelegramConnection() {
    const token = document.getElementById('tgBotToken').value.trim();
    const chatId = document.getElementById('tgChatId').value.trim();
    const resultDiv = document.getElementById('tgTestResult');

    if (!token || !chatId) {
        resultDiv.textContent = 'Ошибка: Заполните оба поля перед отправкой теста!';
        resultDiv.className = 'tg-test-result error';
        return;
    }

    resultDiv.textContent = 'Отправка тестового запроса...';
    resultDiv.className = 'tg-test-result';

    try {
        const res = await fetch('/api/lead/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                telegram_bot_token: token,
                telegram_chat_id: chatId
            })
        });
        const result = await res.json();
        
        if (result.sent_telegram) {
            resultDiv.textContent = 'Успех! Тестовое сообщение отправлено в ваш Telegram-чат.';
            resultDiv.className = 'tg-test-result success';
        } else {
            resultDiv.textContent = 'Ошибка! Проверьте правильность токена и ID, а также запущен ли бот.';
            resultDiv.className = 'tg-test-result error';
        }
    } catch (err) {
        console.error(err);
        resultDiv.textContent = 'Ошибка сети при отправке теста.';
        resultDiv.className = 'tg-test-result error';
    }
}

// PASSWORD MANAGEMENT
async function savePasswordSettings(e) {
    e.preventDefault();
    const pass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('passwordError');

    if (pass !== confirm) {
        errorDiv.style.display = 'block';
        return;
    }

    errorDiv.style.display = 'none';
    if (!currentConfig.general) currentConfig.general = {};
    currentConfig.general.admin_password = pass;

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentConfig)
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast('Пароль успешно изменен!');
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            alert('Ошибка при изменении пароля.');
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка сети.');
    }
}

// VISUAL PAGE CUSTOMIZER LOGIC
function changeCustomizerPage() {
    const select = document.getElementById('customizerPageSelect');
    if (!select) return;
    
    const pagePath = select.value;
    const iframe = document.getElementById('customizerPreviewIframe');
    if (iframe) {
        iframe.src = pagePath;
    }
    
    const label = document.getElementById('previewUrlLabel');
    if (label) {
        label.textContent = pagePath.replace('/', '');
    }
    
    // Switch active editor form section based on selected page
    let subtab = 'home';
    if (pagePath.includes('franchise')) {
        subtab = 'franchise';
    } else if (pagePath.includes('partners')) {
        subtab = 'partners';
    }
    
    // Update subtab visuals
    const tabs = document.querySelectorAll('.wp-tabs-bar .wp-tab-btn');
    tabs.forEach(t => {
        if (t.dataset.subtab === subtab) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });

    const contents = document.querySelectorAll('#sec-page-editor .subtab-content');
    contents.forEach(c => {
        if (c.id === `sub-${subtab}`) {
            c.classList.add('active');
        } else {
            c.classList.remove('active');
        }
    });

    activeSubtab = subtab;
}

function setPreviewSize(device) {
    const container = document.querySelector('.preview-iframe-container');
    if (!container) return;
    
    container.classList.remove('device-desktop', 'device-tablet', 'device-mobile');
    container.classList.add(`device-${device}`);
    
    // Update button states
    const buttons = document.querySelectorAll('.preview-device-toolbar .device-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(device)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function setupCustomizerPreviewSync() {
    const form = document.getElementById('pageEditorForm');
    if (!form) return;
    
    // Attach listener for real-time key/input updates
    form.addEventListener('input', (e) => {
        const input = e.target;
        const name = input.name;
        if (!name) return;
        
        // Post content message to nested iframe
        const iframe = document.getElementById('customizerPreviewIframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'customizer-update',
                key: name,
                value: input.value
            }, '*');
        }
    });

    // Broadcast current settings once iframe fully loads
    const iframe = document.getElementById('customizerPreviewIframe');
    if (iframe) {
        iframe.addEventListener('load', () => {
            syncCurrentFieldsToIframe();
        });
    }

    // Listen to selection messages from the iframe (visual click-to-edit)
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'visual-editor-select') {
            selectInputInSidebar(event.data.key);
        }
    });
}

function selectInputInSidebar(key) {
    const form = document.getElementById('pageEditorForm');
    if (!form) return;

    // Find the input/textarea field matching the key
    const input = form.querySelector(`[name="${key}"], [data-key="${key}"]`);
    if (!input) {
        console.warn('Customizer input field not found for key:', key);
        return;
    }

    // Expand any parent collapsible accordion container if closed
    let parent = input.parentElement;
    while (parent && parent !== form) {
        if (parent.classList.contains('wp-collapsible-item')) {
            parent.classList.add('open');
        }
        parent = parent.parentElement;
    }

    // Scroll into view
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Focus the input
    setTimeout(() => {
        input.focus();
        
        // Highlight flash effect
        input.classList.add('visual-highlight');
        setTimeout(() => {
            input.classList.remove('visual-highlight');
        }, 1500);
    }, 300);
}

function syncCurrentFieldsToIframe() {
    const form = document.getElementById('pageEditorForm');
    if (!form) return;
    const inputs = form.querySelectorAll('input[type="text"], textarea');
    const iframe = document.getElementById('customizerPreviewIframe');
    
    if (iframe && iframe.contentWindow) {
        inputs.forEach(input => {
            const name = input.name;
            if (!name) return;
            iframe.contentWindow.postMessage({
                type: 'customizer-update',
                key: name,
                value: input.value
            }, '*');
        });
    }
}

// TOAST HELPER
function showToast(message) {
    const toast = document.getElementById('toastNotification');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// ARTICLES MANAGEMENT SECTION
// ==========================================
let currentArticleBlocks = [];

function renderArticlesTable() {
    const tbody = document.getElementById('allArticlesTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const articles = currentConfig.articles || [];
    if (articles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Нет созданных статей.</td></tr>';
        return;
    }

    const getImgUrl = (src) => {
        if (!src) return '';
        if (src.startsWith('http') || src.startsWith('/') || src.startsWith('images/') || src.startsWith('news/')) return src;
        return '../news/' + src;
    };

    articles.forEach(art => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${getImgUrl(art.image)}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;"></td>
            <td><strong>${art.title}</strong><br><small style="color: #646970;">ID: ${art.id}</small></td>
            <td><span class="wp-badge" style="background:#e0f0ff; color:#0056b3; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${art.category || 'Событие'}</span></td>
            <td>${art.date || ''}</td>
            <td>${art.author || ''}</td>
            <td>${art.views || 0}</td>
            <td>
                <div style="display: flex; gap: 6px;">
                    <button type="button" onclick="editArticleForm('${art.id}')" class="wp-button wp-button-secondary" style="padding: 2px 8px; font-size: 11px;">Правка</button>
                    <button type="button" onclick="deleteArticle('${art.id}')" class="wp-button wp-button-danger" style="padding: 2px 8px; font-size: 11px;">Удалить</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function createNewArticleForm() {
    document.getElementById('articlesListView').style.display = 'none';
    document.getElementById('articleEditView').style.display = 'block';
    
    document.getElementById('articleEditorTitle').textContent = 'Добавить новую статью';
    document.getElementById('articleFormId').value = '';
    document.getElementById('articleForm').reset();
    
    // Clear images previews
    document.getElementById('previewArticleImage').style.display = 'none';
    document.getElementById('previewArticleImage').src = '';
    document.getElementById('previewArticleAvatar').style.display = 'none';
    document.getElementById('previewArticleAvatar').src = '';

    // Clear blocks
    currentArticleBlocks = [
        { type: 'paragraph', text: '' }
    ];
    renderArticleBlocks();
}

function editArticleForm(id) {
    const articles = currentConfig.articles || [];
    const art = articles.find(a => a.id === id);
    if (!art) return;

    document.getElementById('articlesListView').style.display = 'none';
    document.getElementById('articleEditView').style.display = 'block';
    document.getElementById('articleEditorTitle').textContent = 'Редактировать статью';

    document.getElementById('articleFormId').value = art.id;
    document.getElementById('articleTitle').value = art.title || '';
    document.getElementById('articleCategory').value = art.category || '';
    document.getElementById('articleSubtitle').value = art.subtitle || '';
    document.getElementById('articleDate').value = art.date || '';
    document.getElementById('articleAuthor').value = art.author || '';
    document.getElementById('articleViews').value = art.views || 0;
    document.getElementById('articleReadTime').value = art.read_time || '';
    
    // Image fields
    document.getElementById('articleImage').value = art.image || '';
    document.getElementById('articleAvatar').value = art.avatar || '';

    const getImgUrl = (src) => {
        if (!src) return '';
        if (src.startsWith('http') || src.startsWith('/') || src.startsWith('images/') || src.startsWith('news/')) return src;
        return '../news/' + src;
    };

    // Previews
    if (art.image) {
        document.getElementById('previewArticleImage').src = getImgUrl(art.image);
        document.getElementById('previewArticleImage').style.display = 'block';
    } else {
        document.getElementById('previewArticleImage').style.display = 'none';
    }

    if (art.avatar) {
        document.getElementById('previewArticleAvatar').src = getImgUrl(art.avatar);
        document.getElementById('previewArticleAvatar').style.display = 'block';
    } else {
        document.getElementById('previewArticleAvatar').style.display = 'none';
    }

    // Key facts
    const facts = art.key_facts || [];
    for (let i = 1; i <= 4; i++) {
        const fact = facts[i - 1] || { label: '', value: '' };
        document.getElementById(`articleFactLabel${i}`).value = fact.label || '';
        document.getElementById(`articleFactValue${i}`).value = fact.value || '';
    }

    // Tags
    document.getElementById('articleTags').value = (art.tags || []).join(', ');

    // Blocks
    currentArticleBlocks = JSON.parse(JSON.stringify(art.content || []));
    renderArticleBlocks();
}

function cancelArticleEdit() {
    document.getElementById('articlesListView').style.display = 'block';
    document.getElementById('articleEditView').style.display = 'none';
}

async function uploadArticleImage(type) {
    const fileInput = document.getElementById(type === 'image' ? 'articleImageFile' : 'articleAvatarFile');
    const file = fileInput.files[0];
    if (!file) return;

    const preview = document.getElementById(type === 'image' ? 'previewArticleImage' : 'previewArticleAvatar');
    const textInput = document.getElementById(type === 'image' ? 'articleImage' : 'articleAvatar');

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64Data = event.target.result;
        
        if (preview) {
            preview.src = base64Data;
            preview.style.display = 'block';
            preview.style.opacity = '0.5';
        }

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name, filedata: base64Data })
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                textInput.value = result.url;
                if (preview) {
                    preview.src = result.url;
                    preview.style.opacity = '1';
                }
                showToast('Изображение успешно загружено!');
            } else {
                alert('Не удалось загрузить изображение: ' + result.error);
                if (preview) preview.style.opacity = '1';
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка при загрузке изображения.');
            if (preview) preview.style.opacity = '1';
        }
    };
    reader.readAsDataURL(file);
}

function addContentBlock(type) {
    if (type === 'paragraph') {
        currentArticleBlocks.push({ type: 'paragraph', text: '' });
    } else if (type === 'heading') {
        currentArticleBlocks.push({ type: 'heading', text: '' });
    } else if (type === 'quote') {
        currentArticleBlocks.push({ type: 'quote', text: '', author: '' });
    } else if (type === 'stats') {
        currentArticleBlocks.push({
            type: 'stats',
            items: [
                { value: '', label: '' }
            ]
        });
    } else if (type === 'timeline') {
        currentArticleBlocks.push({
            type: 'timeline',
            title: 'Вехи истории',
            events: [
                { year: '', text: '' }
            ]
        });
    }
    renderArticleBlocks();
}

function deleteBlock(idx) {
    currentArticleBlocks.splice(idx, 1);
    renderArticleBlocks();
}

function moveBlock(idx, dir) {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= currentArticleBlocks.length) return;
    
    // Swap
    const temp = currentArticleBlocks[idx];
    currentArticleBlocks[idx] = currentArticleBlocks[targetIdx];
    currentArticleBlocks[targetIdx] = temp;
    
    renderArticleBlocks();
}

function updateBlockValue(idx, key, val) {
    currentArticleBlocks[idx][key] = val;
}

function updateStatItemValue(blockIdx, itemIdx, key, val) {
    currentArticleBlocks[blockIdx].items[itemIdx][key] = val;
}

function addStatItem(blockIdx) {
    currentArticleBlocks[blockIdx].items.push({ value: '', label: '' });
    renderArticleBlocks();
}

function deleteStatItem(blockIdx, itemIdx) {
    currentArticleBlocks[blockIdx].items.splice(itemIdx, 1);
    renderArticleBlocks();
}

function updateTimelineEventValue(blockIdx, eventIdx, key, val) {
    currentArticleBlocks[blockIdx].events[eventIdx][key] = val;
}

function addTimelineEvent(blockIdx) {
    currentArticleBlocks[blockIdx].events.push({ year: '', text: '' });
    renderArticleBlocks();
}

function deleteTimelineEvent(blockIdx, eventIdx) {
    currentArticleBlocks[blockIdx].events.splice(eventIdx, 1);
    renderArticleBlocks();
}

function renderArticleBlocks() {
    const container = document.getElementById('articleBlocksContainer');
    if (!container) return;
    container.innerHTML = '';

    if (currentArticleBlocks.length === 0) {
        container.innerHTML = '<p style="color: #646970; text-align:center; padding: 20px;">Нет блоков. Добавьте текстовый блок или другие элементы ниже.</p>';
        return;
    }

    currentArticleBlocks.forEach((block, idx) => {
        const div = document.createElement('div');
        div.className = 'builder-block';
        div.dataset.type = block.type;

        let blockName = 'Блок';
        let bodyHtml = '';

        if (block.type === 'paragraph') {
            blockName = 'Текст (Абзац)';
            bodyHtml = `
                <textarea placeholder="Введите текст абзаца..." oninput="updateBlockValue(${idx}, 'text', this.value)" required rows="4">${block.text || ''}</textarea>
            `;
        } else if (block.type === 'heading') {
            blockName = 'Подзаголовок (H2)';
            bodyHtml = `
                <input type="text" placeholder="Введите текст подзаголовка..." value="${block.text || ''}" oninput="updateBlockValue(${idx}, 'text', this.value)" required>
            `;
        } else if (block.type === 'quote') {
            blockName = 'Цитата основателя/эксперта';
            bodyHtml = `
                <textarea placeholder="Текст цитаты..." oninput="updateBlockValue(${idx}, 'text', this.value)" required rows="2" style="margin-bottom:10px;">${block.text || ''}</textarea>
                <input type="text" placeholder="Автор цитаты (Напр. Максим Фролов)" value="${block.author || ''}" oninput="updateBlockValue(${idx}, 'author', this.value)">
            `;
        } else if (block.type === 'stats') {
            blockName = 'Показатели / Статистика (Stats)';
            let itemsHtml = '';
            (block.items || []).forEach((item, itemIdx) => {
                itemsHtml += `
                    <div class="builder-sub-item">
                        <div class="builder-sub-item-header">
                            <span>Показатель #${itemIdx + 1}</span>
                            <button type="button" class="builder-sub-item-delete" onclick="deleteStatItem(${idx}, ${itemIdx})">Удалить</button>
                        </div>
                        <div class="form-row" style="margin-bottom:0;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="font-size:11px;">Значение (Напр. 300)</label>
                                <input type="text" placeholder="300" value="${item.value || ''}" oninput="updateStatItemValue(${idx}, ${itemIdx}, 'value', this.value)" required style="margin-bottom:0;">
                            </div>
                            <div class="form-group" style="margin-bottom:0;">
                                <label style="font-size:11px;">Описание (Напр. точек сети)</label>
                                <input type="text" placeholder="точек сети" value="${item.label || ''}" oninput="updateStatItemValue(${idx}, ${itemIdx}, 'label', this.value)" required style="margin-bottom:0;">
                            </div>
                        </div>
                    </div>
                `;
            });
            bodyHtml = `
                <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:10px;">
                    ${itemsHtml}
                </div>
                <button type="button" class="wp-button wp-button-secondary" onclick="addStatItem(${idx})" style="font-size:11px; padding:3px 10px;">+ Добавить показатель</button>
            `;
        } else if (block.type === 'timeline') {
            blockName = 'Временная шкала истории (Timeline)';
            let eventsHtml = '';
            (block.events || []).forEach((ev, evIdx) => {
                eventsHtml += `
                    <div class="builder-sub-item">
                        <div class="builder-sub-item-header">
                            <span>Событие #${evIdx + 1}</span>
                            <button type="button" class="builder-sub-item-delete" onclick="deleteTimelineEvent(${idx}, ${evIdx})">Удалить</button>
                        </div>
                        <div class="form-row" style="margin-bottom:0;">
                            <div class="form-group" style="margin-bottom:0; flex:1;">
                                <label style="font-size:11px;">Год (Напр. 2016)</label>
                                <input type="text" placeholder="2016" value="${ev.year || ''}" oninput="updateTimelineEventValue(${idx}, ${evIdx}, 'year', this.value)" required style="margin-bottom:0;">
                            </div>
                            <div class="form-group" style="margin-bottom:0; flex:4;">
                                <label style="font-size:11px;">Событие (Напр. Открытие первой точки)</label>
                                <input type="text" placeholder="Открытие первой точки..." value="${ev.text || ''}" oninput="updateTimelineEventValue(${idx}, ${evIdx}, 'text', this.value)" required style="margin-bottom:0;">
                            </div>
                        </div>
                    </div>
                `;
            });
            bodyHtml = `
                <div class="form-group">
                    <label>Заголовок шкалы</label>
                    <input type="text" value="${block.title || 'Вехи истории'}" oninput="updateBlockValue(${idx}, 'title', this.value)" required>
                </div>
                <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:10px;">
                    ${eventsHtml}
                </div>
                <button type="button" class="wp-button wp-button-secondary" onclick="addTimelineEvent(${idx})" style="font-size:11px; padding:3px 10px;">+ Добавить событие истории</button>
            `;
        }

        div.innerHTML = `
            <div class="builder-block-header">
                <span>${blockName}</span>
                <div class="builder-block-controls">
                    <button type="button" onclick="moveBlock(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>▲</button>
                    <button type="button" onclick="moveBlock(${idx}, 1)" ${idx === currentArticleBlocks.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>▼</button>
                    <button type="button" onclick="deleteBlock(${idx})" style="color:#d63638; border-color:#f8b0b0;">✕</button>
                </div>
            </div>
            <div class="builder-block-body">
                ${bodyHtml}
            </div>
        `;
        container.appendChild(div);
    });
}

function slugify(text) {
    const cyr = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
    };
    let s = text.toString().toLowerCase().trim();
    let res = '';
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (cyr[c] !== undefined) res += cyr[c];
        else res += c;
    }
    return res
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w-]+/g, '')        // Remove all non-word chars
        .replace(/--+/g, '-')           // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

async function saveArticle(event) {
    event.preventDefault();
    
    const formId = document.getElementById('articleFormId').value;
    const title = document.getElementById('articleTitle').value.trim();
    const category = document.getElementById('articleCategory').value.trim();
    const subtitle = document.getElementById('articleSubtitle').value.trim();
    const date = document.getElementById('articleDate').value.trim();
    const author = document.getElementById('articleAuthor').value.trim();
    const views = parseInt(document.getElementById('articleViews').value) || 0;
    const readTime = document.getElementById('articleReadTime').value.trim();
    const image = document.getElementById('articleImage').value.trim();
    const avatar = document.getElementById('articleAvatar').value.trim();
    
    // Key facts
    const keyFacts = [];
    for (let i = 1; i <= 4; i++) {
        const label = document.getElementById(`articleFactLabel${i}`).value.trim();
        const value = document.getElementById(`articleFactValue${i}`).value.trim();
        if (label && value) {
            keyFacts.push({ label, value });
        }
    }

    // Tags
    const tagsRaw = document.getElementById('articleTags').value;
    const tags = tagsRaw.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

    let articleId = formId;
    let isNew = false;
    
    if (!articleId) {
        isNew = true;
        articleId = slugify(title);
        // Ensure unique slug
        const articles = currentConfig.articles || [];
        let tempId = articleId;
        let counter = 1;
        while (articles.some(a => a.id === tempId)) {
            tempId = `${articleId}-${counter}`;
            counter++;
        }
        articleId = tempId;
    }

    const articleData = {
        id: articleId,
        title,
        category,
        subtitle,
        date,
        author,
        avatar,
        image,
        views,
        read_time: readTime,
        key_facts: keyFacts,
        tags,
        content: currentArticleBlocks
    };

    if (!currentConfig.articles) {
        currentConfig.articles = [];
    }

    if (isNew) {
        currentConfig.articles.push(articleData);
    } else {
        const idx = currentConfig.articles.findIndex(a => a.id === articleId);
        if (idx !== -1) {
            currentConfig.articles[idx] = articleData;
        } else {
            currentConfig.articles.push(articleData);
        }
    }

    // Save to API
    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentConfig)
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast('Статья успешно сохранена!');
            cancelArticleEdit();
            renderArticlesTable();
        } else {
            alert('Ошибка сохранения: ' + result.error);
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка при сохранении статьи на сервере.');
    }
}

async function deleteArticle(id) {
    if (!confirm('Вы уверены, что хотите удалить эту статью?')) return;
    
    if (!currentConfig.articles) return;
    
    currentConfig.articles = currentConfig.articles.filter(a => a.id !== id);

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentConfig)
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast('Статья успешно удалена!');
            renderArticlesTable();
        } else {
            alert('Ошибка удаления: ' + result.error);
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка при удалении статьи на сервере.');
    }
}
