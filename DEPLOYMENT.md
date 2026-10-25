# Деплой MediusObmen.cc на Ubuntu VPS

Код проекта хранится в GitHub: `https://github.com/Bell1488/medius.git`. Инструкция для Ubuntu 22.04/24.04.

## 1. DNS

Создайте DNS-записи `A @ IP_СЕРВЕРА` и `A www IP_СЕРВЕРА` (или `CNAME www mediusobmen.cc.`). Дождитесь обновления и проверьте:

```bash
dig +short mediusobmen.cc
dig +short www.mediusobmen.cc
```

## 2. Установка и клонирование из GitHub

Подключитесь по SSH, перейдите в root-сессию (`sudo -i`) и выполните:

```bash
apt update
apt install -y nginx git curl ca-certificates ufw gnupg certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
mkdir -p /var/www
git clone https://github.com/Bell1488/medius.git /var/www/medius
cd /var/www/medius
npm ci
id -u medius >/dev/null 2>&1 || useradd --system --home-dir /var/www/medius --shell /usr/sbin/nologin medius
chown -R medius:medius /var/www/medius
```

Для приватного GitHub-репозитория настройте deploy key. Не помещайте токен GitHub в URL или файлы проекта.

## 3. Переменные окружения

Создайте `/etc/medius.env`:

```env
TELEGRAM_BOT_TOKEN=ТОКЕН_БОТА
TELEGRAM_CHAT_ID=-1001234567890
PORT=8787
BANK_ADVANTAGE_PERCENT=2
RATE_UPDATE_INTERVAL_MS=3600000
# SOCKS5H_PROXY=socks5h://user:password@host:1080
```

Заполните реальные данные Telegram; строку с прокси включайте только если она нужна. Затем закройте доступ к файлу: `chown root:root /etc/medius.env && chmod 600 /etc/medius.env`. Секреты не коммитьте в GitHub.

## 4. Сборка

ID Метрики передаётся на этапе сборки frontend:

```bash
cd /var/www/medius
VITE_YANDEX_METRIKA_ID=113716616 npm run build
chown -R medius:medius /var/www/medius
test -f dist/index.html && echo "Сборка готова"
```

## 5. systemd

Создайте `/etc/systemd/system/medius.service`:

```ini
[Unit]
Description=MediusObmen.cc website and lead API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=medius
Group=medius
WorkingDirectory=/var/www/medius
EnvironmentFile=/etc/medius.env
ExecStart=/usr/bin/node /var/www/medius/server.mjs
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Проверьте путь Node командой `command -v node` и при необходимости измените `ExecStart`. Затем:

```bash
systemctl daemon-reload
systemctl enable --now medius
systemctl status medius --no-pager
journalctl -u medius -n 100 --no-pager
```

## 6. Nginx

Создайте `/etc/nginx/sites-available/medius`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name mediusobmen.cc www.mediusobmen.cc;
    client_max_body_size 32k;
    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
```

Активируйте сайт:

```bash
ln -sfn /etc/nginx/sites-available/medius /etc/nginx/sites-enabled/medius
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## 7. HTTPS и firewall

Только после настройки DNS выпустите сертификат и откройте порты:

```bash
certbot --nginx -d mediusobmen.cc -d www.mediusobmen.cc
certbot renew --dry-run
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

Порт `8787` наружу не открывайте. Проверьте `curl -I https://mediusobmen.cc` и `curl -I https://mediusobmen.cc/privacy.html`.

## 8. Проверка и обновление

Проверьте `curl -sS http://127.0.0.1:8787/api/rates`. Отправьте одну реальную тестовую заявку, убедитесь, что она пришла в Telegram, и проверьте Метрику: счётчик и цели `lead_submit`, `telegram_click`, `phone_click`. Рекламу включайте только после этого.

Для обновления из GitHub:

```bash
cd /var/www/medius
git pull --ff-only origin main
npm ci
VITE_YANDEX_METRIKA_ID=113716616 npm run build
chown -R medius:medius /var/www/medius
systemctl restart medius
systemctl status medius --no-pager
```

## Локальный запуск

В первом терминале запустите `npm run build`, затем `npm run server`. Во втором выполните `npm run dev -- --host 127.0.0.1` и откройте `http://127.0.0.1:5173`. Локальные заявки требуют Telegram-переменных; без них API вернёт `503`.
