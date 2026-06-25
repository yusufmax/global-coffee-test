import http.server
import socketserver
import os
import json
import base64
import urllib.request
import urllib.parse
from datetime import datetime

PORT = 3000

CONFIG_FILE = 'config.json'
LEADS_FILE = 'leads.json'

def get_default_config():
    return {
        "general": {
            "phone": "+ 7 707 191 34 34",
            "email": "globalcoffee.team@yandex.kz",
            "telegram_bot_token": "",
            "telegram_chat_id": "",
            "admin_password": "admin"
        },
        "map_points": [
            {"id": 1, "country": "КАЗАХСТАН", "city": "Г. АСТАНА", "street": "Мангилик ел, 55а, блок С", "hours": "08:00 - 23:00", "x": 42.0, "y": 38.0},
            {"id": 2, "country": "КАЗАХСТАН", "city": "Г. АСТАНА", "street": "Кенесары, 45", "hours": "08:00 - 22:00", "x": 43.5, "y": 42.0},
            {"id": 3, "country": "КАЗАХСТАН", "city": "Г. ТАРАЗ", "street": "Тауке хана, 37", "hours": "24/7", "x": 38.0, "y": 48.0},
            {"id": 4, "country": "КАЗАХСТАН", "city": "Г. ТАРАЗ", "street": "Абая, 117", "hours": "07:30 - 01:00", "x": 39.5, "y": 50.0},
            {"id": 5, "country": "КАЗАХСТАН", "city": "Г. ШЫМКЕНТ", "street": "Кунаева, 38", "hours": "08:00 - 01:00", "x": 36.0, "y": 52.0},
            {"id": 6, "country": "КАЗАХСТАН", "city": "Г. ШЫМКЕНТ", "street": "Тауке хана, 155", "hours": "24/7", "x": 37.5, "y": 54.0},
            {"id": 7, "country": "КАЗАХСТАН", "city": "Г. АТЫРАУ", "street": "Сатпаева, 46/1", "hours": "24/7", "x": 22.0, "y": 42.0},
            {"id": 8, "country": "КАЗАХСТАН", "city": "Г. АТЫРАУ", "street": "ул. Жарбосынова, 85", "hours": "08:00 - 01:00", "x": 23.5, "y": 44.0},
            {"id": 9, "country": "КАЗАХСТАН", "city": "Г. КЫЗЫЛОРДА", "street": "Абая, 62", "hours": "24/7", "x": 29.0, "y": 46.0},
            {"id": 10, "country": "КАЗАХСТАН", "city": "Г. КЫЗЫЛОРДА", "street": "Байтурсынова, 48А", "hours": "08:00 - 01:00", "x": 30.5, "y": 48.0},
            {"id": 11, "country": "КАЗАХСТАН", "city": "Г. СЕМЕЙ", "street": "Шакарима, 40а", "hours": "24/7", "x": 53.0, "y": 40.0},
            {"id": 12, "country": "КАЗАХСТАН", "city": "Г. СЕМЕЙ", "street": "Мухамеджанова, 23Б", "hours": "24/7", "x": 54.5, "y": 42.0},
            {"id": 13, "country": "КАЗАХСТАН", "city": "Г. КАРАГАНДЫ", "street": "Ашимова, 21", "hours": "08:00 - 00:00", "x": 44.0, "y": 43.0},
            {"id": 14, "country": "КАЗАХСТАН", "city": "Г. КАРАГАНДЫ", "street": "ЦУМ", "hours": "08:00 - 23:00", "x": 45.5, "y": 45.0},
            {"id": 15, "country": "КАЗАХСТАН", "city": "Г. АКТАУ", "street": "6-й мкр., 40/1", "hours": "08:00 - 00:00", "x": 19.0, "y": 48.0},
            {"id": 16, "country": "КАЗАХСТАН", "city": "Г. АКТАУ", "street": "15-й мкр., ЖК \"Оазис\"", "hours": "08:00 - 01:00", "x": 20.5, "y": 50.0},
            {"id": 17, "country": "УЗБЕКИСТАН", "city": "Г. ТАШКЕНТ", "street": "ул. Амира Темура, 60", "hours": "08:00 - 23:00", "x": 40.0, "y": 55.0},
            {"id": 18, "country": "ГРУЗИЯ", "city": "Г. ТБИЛИСИ", "street": "пр. Руставели, 12", "hours": "09:00 - 22:00", "x": 15.0, "y": 35.0}
        ],
        "home": {
            "hero_title": "Мы уже завариваем ваш любимый напиток",
            "hero_subtitle": "Выберите ближайший к вам Global Coffee.",
            "about_title_1": "Почему мы?",
            "about_desc_1": "Мы — про качественный кофе и сервис в формате \"у дома\". Глобальная сеть с едиными стандартами и локальным подходом.",
            "about_bullets_1": "10 лет на рынке\nболее 300 кофеен\nкофе, который всегда рядом\nбренд с понятной философией",
            "about_image_1": "Rectangle 3.png",
            
            "about_title_2": "Почему партнёры растут вместе с нами",
            "about_bullets_2": "единая стратегия развития сети\nмасштабируемая бизнес-модель\nподдержка на старте и в росте\nпонятная логика: сначала стабильность — потом масштаб",
            "about_desc_2": "Мы заинтересованы в сильных партнёрах, потому что рост каждого усиливает всю сеть.",
            "about_image_2": "slider1.png",
            
            "about_title_3": "Запусти прибыльный бизнес с лидером рынка",
            "about_desc_3_1": "Наша франшиза — это не просто право на название. Это вход в работающую систему кофейного бизнеса, выстроенную на 10-летнем практическом опыте.",
            "about_desc_3_2": "Мы передаём партнёрам ключевое — интеллектуальную модель управления кофейней: продуманную экономику, чёткие процессы и решения, которые уже приносят результат в действующих точках сети.",
            "about_image_3": "slide3.png",
            
            "about_title_4": "Вкусы момента",
            "about_desc_4_1": "Каждый сезон — это новые вкусы, новые эмоции и новые причины для гостей возвращаться снова и снова.",
            "about_desc_4_2": "Мы внимательно следим за мировыми трендами кофейной индустрии, анализируем спрос и тестируем рецептуры, прежде чем они появляются в меню.",
            "about_image_4": "slide4.png",
            
            "app_title": "Бесплатный кофе — наш язык любви",
            "app_subtitle": "Регистрируйся в программе лояльности и получай кофе в подарок снова и снова! И это ещё не всё!",
            "app_desc": "Скачайте приложение Global Coffee. Копите бесплатные стаканы и бонусы! Воспользуйтесь системой предоплаты, чтобы напитки были готовы к вашему визиту. Ожидание в очереди – в прошлом. Не пропускайте наши акции и будьте в курсе новостей.",
            "app_image_left": "Rectangle 78.png",
            "app_image_right": "Rectangle 14.png",
            
            "franchise_title": "Начни зарабатывать с Global Coffee!",
            "franchise_desc": "Открывай кофейню под ключ — с обучением, поддержкой и готовыми инструментами.\nУже 240+ кофеен в 3 странах. Твоя — следующая. Пора начинать своё дело вместе с профессионалами!",
            "franchise_gallery_1": "Rectangle 16.png",
            "franchise_gallery_2": "Rectangle 18.png",
            
            "news_title": "Всегда на волне кофейных событий",
            "news_desc": "Читайте свежие новости Global Coffee — от запусков новых кофеен до акций и идей для вдохновения. Оставайтесь в курсе и будьте частью нашей истории!",
            "news_main_title": "2026 год стал юбилейным для Global Coffee",
            "news_main_subtitle": "Бренду исполняется 10 лет, и в этом же году открывается 300-я точка сети...",
            "news_main_author": "Фролов М.",
            "news_main_avatar": "Image-60.png",
            "news_main_image": "Rectangle 49.png",
            
            "news_item_1_title": "Global Coffee был приглашён в состав жюри профессионального чемпионата Barista Cup",
            "news_item_1_image": "Rectangle 52.png",
            "news_item_2_title": "Global Coffee покоряет мир. Сегодня нас выбирают уже в 3 странах",
            "news_item_2_image": "Rectangle 54.png",
            "news_partner_title": "Мы — партнеры Digital Kazakhstan",
            "news_partner_desc": "В марте 2026 года в Шымкенте пройдет форум, объединяющий региональные и globalные технологические экосистемы...",
            "news_partner_image": "Rectangle 55.png",
            
            "contact_founders_title": "Напишите письмо основателям\nGlobal Coffee",
            "contact_founders_desc": "Ваше обращение, идея или пожелание обязательно будет услышано.",
            
            "partnership_title": "Ваш бренд в руках гостей, когда им особенно хорошо",
            "partnership_subtitle": "Тысячи касаний ежедневно + аналитика, чтобы измерить каждое из них.",
            "partnership_desc": "Разместите свой бренд там, где его точно заметят в уютный момент с чашкой кофе. Рекламируйтесь через тепло, которое действительно чувствуется.",
            "partnership_image_left": "Rectangle 38.png",
            "partnership_image_right": "Rectangle 34.png",
            
            "quality_title": "Идеальный эспрессо! Секреты мастерства!",
            "quality_subtitle": "Обучайте и сертифицируйте ваших бариста в нашей школе. Уникальный навык, авторская методика.\nМы обучили свыше 250 + франчайзи их сотрудников. Единственная школа бариста в Шымкенте.",
            "quality_image": "baristas.png",
            
            "partners_title": "Наши партнёры"
        },
        "franchise": {
            "hero_title": "Франшиза Global Coffee",
            "hero_subtitle": "Открой свою прибыльную кофейню"
        },
        "partners": {
            "hero_title": "Партнёрам Global Coffee",
            "hero_subtitle": "Наша команда помогает подобрать формат, который будет работать именно на вашу цель — от охвата до прямых продаж. Global Coffee — место, где бренды становятся ближе к людям."
        },
        "links": {
            "instagram": "https://www.instagram.com/global_coffee_uz/",
            "telegram": "https://t.me/globalcoffee",
            "whatsapp": "https://wa.me/77071913434",
            "ios_app": "https://apps.apple.com/app/global-coffee",
            "android_app": "https://play.google.com/store/apps/details?id=globalcoffee",
            "franchise_presentation": "#",
            "privacy_policy": "/privacy",
            "nav_franchise": "/franchise",
            "nav_partners": "/partners"
        }
    }

def send_telegram_message(token, chat_id, message):
    if not token or not chat_id:
        print("Telegram bot configuration is incomplete.")
        return False
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = urllib.parse.urlencode({
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML"
        }).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            return res_json.get("ok", False)
    except Exception as e:
        print("Failed to send Telegram message:", e)
        return False

def update_subscribers(token):
    if not token:
        return []
    subscribers = set()
    
    SUBSCRIBERS_FILE = 'tg_subscribers.json'
    if os.path.exists(SUBSCRIBERS_FILE):
        try:
            with open(SUBSCRIBERS_FILE, 'r', encoding='utf-8') as f:
                stored = json.load(f)
                subscribers.update(stored)
        except Exception:
            pass
            
    # Fetch updates from Telegram to catch anyone who sent /start
    try:
        url = f"https://api.telegram.org/bot{token}/getUpdates"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            if res_json.get("ok"):
                for update in res_json.get("result", []):
                    # check normal message
                    message = update.get("message")
                    if message:
                        chat = message.get("chat")
                        if chat and "id" in chat:
                            subscribers.add(chat["id"])
                    
                    # check edited message or other updates
                    my_chat_member = update.get("my_chat_member")
                    if my_chat_member:
                        chat = my_chat_member.get("chat")
                        if chat and "id" in chat:
                            subscribers.add(chat["id"])
                            
                    # check callback query or anything else
                    callback_query = update.get("callback_query")
                    if callback_query and callback_query.get("message"):
                        chat = callback_query["message"].get("chat")
                        if chat and "id" in chat:
                            subscribers.add(chat["id"])
    except Exception as e:
        print("Failed to get Telegram updates:", e)
        
    subscribers_list = list(subscribers)
    try:
        with open(SUBSCRIBERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(subscribers_list, f, ensure_ascii=False, indent=2)
    except Exception:
        pass
        
    return subscribers_list

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Clean URLs mapping: /franchise -> franchise.html, etc.
        parsed = urllib.parse.urlparse(path)
        clean = parsed.path.rstrip('/')
        if clean == '/franchise':
            path = '/franchise.html'
        elif clean == '/partners':
            path = '/partners.html'
        elif clean == '/privacy':
            path = '/privacy.html'
        elif clean == '/news':
            path = '/news.html'
        elif clean == '/article':
            path = '/article.html'

        default_path = super().translate_path(path)
        if not os.path.exists(default_path) and not os.path.isdir(default_path):
            basename = os.path.basename(default_path)
            basename = urllib.parse.unquote(basename)
            alt_path = os.path.join(os.getcwd(), 'images', basename)
            if os.path.exists(alt_path):
                return alt_path
        return default_path

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path_str = parsed_path.path
        
        # Redirect clean URL requests with trailing slashes to clean URL without trailing slash
        if path_str in ['/franchise/', '/partners/', '/privacy/', '/news/', '/article/']:
            self.send_response(301)
            self.send_header('Location', path_str.rstrip('/'))
            self.end_headers()
            return

        if parsed_path.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if not os.path.exists(CONFIG_FILE):
                cfg = get_default_config()
                with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                    json.dump(cfg, f, ensure_ascii=False, indent=2)
            else:
                try:
                    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                        cfg = json.load(f)
                except Exception:
                    cfg = get_default_config()
            
            self.wfile.write(json.dumps(cfg, ensure_ascii=False).encode('utf-8'))
            return
            
        elif parsed_path.path == '/api/leads':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            leads = []
            if os.path.exists(LEADS_FILE):
                try:
                    with open(LEADS_FILE, 'r', encoding='utf-8') as f:
                        leads = json.load(f)
                except Exception:
                    pass
            self.wfile.write(json.dumps(leads, ensure_ascii=False).encode('utf-8'))
            return

        super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path in ['/api/config', '/api/lead', '/api/upload', '/api/lead/test']:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid JSON"}).encode('utf-8'))
                return

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            if parsed_path.path == '/api/config':
                with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
                
            elif parsed_path.path == '/api/lead':
                leads = []
                if os.path.exists(LEADS_FILE):
                    try:
                        with open(LEADS_FILE, 'r', encoding='utf-8') as f:
                            leads = json.load(f)
                    except Exception:
                        pass
                
                lead = {
                    "id": len(leads) + 1,
                    "name": data.get("name", ""),
                    "phone": data.get("phone", ""),
                    "type": data.get("type", "General Lead"),
                    "message": data.get("message", ""),
                    "page": data.get("page", ""),
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                leads.insert(0, lead)
                
                with open(LEADS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(leads, f, ensure_ascii=False, indent=2)
                
                # Fetch config for Telegram
                cfg = get_default_config()
                if os.path.exists(CONFIG_FILE):
                    try:
                        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                            cfg = json.load(f)
                    except Exception:
                        pass
                
                tg_token = cfg.get("general", {}).get("telegram_bot_token", "")
                tg_chat_id = cfg.get("general", {}).get("telegram_chat_id", "")
                
                tg_message = (
                    f"<b>⚡️ Новая заявка на сайте Global Coffee!</b>\n\n"
                    f"👤 <b>Имя:</b> {lead['name']}\n"
                    f"📞 <b>Телефон:</b> {lead['phone']}\n"
                    f"🏷 <b>Категория:</b> {lead['type']}\n"
                    f"📄 <b>Страница:</b> {lead['page']}\n"
                    f"⏰ <b>Время:</b> {lead['date']}"
                )
                if lead['message']:
                    tg_message += f"\n✉️ <b>Сообщение:</b> {lead['message']}"
                
                # Retrieve and update subscribers who started/messaged the bot
                subscribers = update_subscribers(tg_token)
                
                # Also include configured chat ID
                if tg_chat_id:
                    try:
                        val = int(tg_chat_id)
                        if val not in subscribers:
                            subscribers.append(val)
                    except ValueError:
                        if tg_chat_id not in subscribers:
                            subscribers.append(tg_chat_id)
                
                sent_tg = False
                for chat_id in subscribers:
                    if send_telegram_message(tg_token, chat_id, tg_message):
                        sent_tg = True
                        
                self.wfile.write(json.dumps({"status": "success", "sent_telegram": sent_tg}).encode('utf-8'))
                
            elif parsed_path.path == '/api/lead/test':
                tg_token = data.get("telegram_bot_token", "")
                tg_chat_id = data.get("telegram_chat_id", "")
                tg_message = "<b>🔔 Тестовое сообщение от панели управления Global Coffee!</b>\n\nСоединение с ботом успешно настроено."
                
                subscribers = update_subscribers(tg_token)
                if tg_chat_id:
                    try:
                        val = int(tg_chat_id)
                        if val not in subscribers:
                            subscribers.append(val)
                    except ValueError:
                        if tg_chat_id not in subscribers:
                            subscribers.append(tg_chat_id)
                
                sent_tg = False
                for chat_id in subscribers:
                    if send_telegram_message(tg_token, chat_id, tg_message):
                        sent_tg = True
                        
                self.wfile.write(json.dumps({"status": "success" if sent_tg else "failed", "sent_telegram": sent_tg}).encode('utf-8'))
                
            elif parsed_path.path == '/api/upload':
                filename = data.get("filename", "upload.png")
                filedata = data.get("filedata", "")
                
                if "," in filedata:
                    filedata = filedata.split(",", 1)[1]
                
                try:
                    uploads_dir = os.path.join(os.getcwd(), 'images', 'uploads')
                    os.makedirs(uploads_dir, exist_ok=True)
                    
                    name_part, ext_part = os.path.splitext(filename)
                    name_part = "".join(c for c in name_part if c.isalnum() or c in ['-', '_'])
                    unique_filename = f"{name_part}_{int(datetime.now().timestamp())}{ext_part}"
                    filepath = os.path.join(uploads_dir, unique_filename)
                    
                    with open(filepath, 'wb') as f:
                        f.write(base64.b64decode(filedata))
                    
                    self.wfile.write(json.dumps({"status": "success", "url": f"/images/uploads/{unique_filename}"}).encode('utf-8'))
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        super().do_POST()

# To prevent port conflicts, allow port reuse
socketserver.TCPServer.allow_reuse_address = True

while True:
    try:
        with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
            print(f"Serving at http://localhost:{PORT}")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 48:  # Address already in use on macOS
            print(f"Port {PORT} is in use, trying {PORT + 1}...")
            PORT += 1
        else:
            raise e
