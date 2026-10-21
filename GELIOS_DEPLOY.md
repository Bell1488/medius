# Деплой geliosobmen.ru

Инструкция для Ubuntu 22.04/24.04. Все команды выполняются на VPS из root-сессии. Войдите как `root` или выполните `su -` перед началом.

## 1. DNS

В DNS-панели домена создайте записи:

```text
A      @      IP_СЕРВЕРА
A      www    IP_СЕРВЕРА
```

Проверьте, что домен уже указывает на сервер:

```bash
dig +short geliosobmen.ru
dig +short www.geliosobmen.ru
```

## 2. Установка зависимостей

```bash
apt update
apt install -y nginx git curl ca-certificates ufw gnupg certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

## 3. Проект

```bash
mkdir -p /var/www/gelios
git clone https://github.com/Bell1488/obmenex.git /var/www/gelios
cd /var/www/gelios
npm ci
```

Если каталог уже существует, используйте `cd /var/www/gelios` и не выполняйте `git clone` повторно.

## 4. Переменные окружения

Создайте `/etc/gelios.env` и вставьте реальные значения:

```env
TELEGRAM_BOT_TOKEN=ТОКЕН_БОТА
TELEGRAM_CHAT_ID=ID_ГРУППЫ
SOCKS5H_PROXY=socks5h://user:password@proxy.example.com:1080
PORT=8787
VITE_YANDEX_METRIKA_ID=12345678
BANK_ADVANTAGE_PERCENT=2
RATE_UPDATE_INTERVAL_MS=3600000
```

`SOCKS5H_PROXY` можно удалить, если прокси не используется. Защитите файл:

```bash
chmod 600 /etc/gelios.env
```

Токен Telegram и пароль прокси не должны попадать в GitHub.

## 5. Сборка и запуск

```bash
cd /var/www/gelios
VITE_YANDEX_METRIKA_ID=12345678 npm run build
```

Создайте `/etc/systemd/system/gelios.service`:

```ini
[Unit]
Description=geliosobmen.ru website and lead API
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/var/www/gelios
EnvironmentFile=/etc/gelios.env
ExecStart=/usr/bin/node /var/www/gelios/server.mjs
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Активируйте сервис:

```bash
systemctl daemon-reload
systemctl enable --now gelios
systemctl status gelios
curl -I http://127.0.0.1:8787
```

## 6. Nginx

Создайте `/etc/nginx/sites-available/gelios`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name geliosobmen.ru www.geliosobmen.ru;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        client_max_body_size 32k;
    }
}
```

Включите конфигурацию:

```bash
ln -s /etc/nginx/sites-available/gelios /etc/nginx/sites-enabled/gelios
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 7. HTTPS и firewall

```bash
certbot --nginx -d geliosobmen.ru -d www.geliosobmen.ru
certbot renew --dry-run

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

Порт `8787` наружу открывать не нужно.

Проверка:

```bash
curl -I https://geliosobmen.ru
```

## 8. Обновление сайта

```bash
cd /var/www/gelios
git pull
npm ci
VITE_YANDEX_METRIKA_ID=12345678 npm run build
systemctl restart gelios
```

Логи приложения:

```bash
journalctl -u gelios -n 100 --no-pager
```

Подробная версия инструкции находится в [DEPLOYMENT.md](DEPLOYMENT.md).
