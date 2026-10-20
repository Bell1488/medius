# Деплой obmenex.pro на Ubuntu VPS

Инструкция рассчитана на Ubuntu 22.04/24.04. Проект запускается одним Node.js-сервером: он раздает production-сборку `dist` и принимает заявки на `/api/leads`.

Домен проекта: `obmenex.pro`. Перед началом направьте DNS-записи домена на IP вашего VPS.

## 0. DNS до настройки HTTPS

В панели регистратора создайте записи:

```text
A      @      SERVER_IP
A      www    SERVER_IP
```

Вместо `SERVER_IP` укажите публичный IPv4-адрес сервера. Если провайдер не разрешает вторую A-запись, используйте `CNAME www -> obmenex.pro.`. Дождитесь обновления DNS и проверьте его с компьютера:

```bash
dig +short obmenex.pro
dig +short www.obmenex.pro
```

Обе команды должны вернуть IP VPS. Только после этого запускайте Certbot в разделе 9.

## 1. Установка Node.js и Nginx

Команда NodeSource должна содержать символ `|`. Без него скрипт не выполняется.

```bash
apt update
apt install -y nginx git curl ca-certificates ufw gnupg

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

node -v
npm -v
```

Если команда NodeSource не отвечает, проверьте сеть:

```bash
curl -I https://deb.nodesource.com
```

## 2. Пользователь приложения

```bash
useradd --system \
  --home /var/www/obmenex \
  --shell /usr/sbin/nologin \
  obmenex

mkdir -p /var/www/obmenex
chown -R obmenex:obmenex /var/www/obmenex
```

## 3. Загрузка проекта

```bash
git clone https://github.com/Bell1488/obmenex.git /var/www/obmenex
chown -R obmenex:obmenex /var/www/obmenex

cd /var/www/obmenex
runuser -u obmenex -- npm ci
```

## 4. Telegram и SOCKS5H

Создайте Telegram-бота через `@BotFather`, добавьте его в рабочую группу и выдайте право отправлять сообщения.

ID группы обычно имеет вид `-1001234567890`. После сообщения в группе его можно проверить через:

```text
https://api.telegram.org/botВАШ_ТОКЕН/getUpdates
```

Создайте файл окружения:

```bash
nano /etc/obmenex.env
```

Содержимое:

```env
TELEGRAM_BOT_TOKEN=123456789:ВАШ_ТОКЕН
TELEGRAM_CHAT_ID=-1001234567890
SOCKS5H_PROXY=socks5h://user:password@proxy.example.com:1080
PORT=8787
VITE_YANDEX_METRIKA_ID=12345678
BANK_ADVANTAGE_PERCENT=2
RATE_UPDATE_INTERVAL_MS=3600000
```

Для прокси без авторизации:

```env
SOCKS5H_PROXY=socks5h://proxy.example.com:1080
```

Сохраните файл и защитите его:

```bash
chmod 600 /etc/obmenex.env
```

Если в пароле прокси есть `@`, `:`, `/`, `?` или `#`, символы нужно URL-кодировать.

Токен Telegram и SOCKS5-прокси нельзя добавлять в GitHub или frontend.

Курс ЦБ РФ загружается сервером из `https://www.cbr.ru/scripts/XML_daily.asp` и кэшируется на один час. Если задан `BANK_RATE_URL`, сервер ожидает JSON с полями `buyCnyRub` и `sellCnyRub` и использует их как банковский ориентир. `BANK_ADVANTAGE_PERCENT=2` делает клиентский курс на 2% выгоднее этого ориентира. При недоступном или некорректном банковском источнике используется курс ЦБ РФ.

## 5. Production-сборка

`VITE_YANDEX_METRIKA_ID` встраивается в frontend во время сборки:

```bash
cd /var/www/obmenex

runuser -u obmenex -- env \
  VITE_YANDEX_METRIKA_ID=12345678 \
  npm run build
```

Проверьте результат:

```bash
ls -la /var/www/obmenex/dist
```

## 6. Systemd-сервис

Создайте файл:

```bash
nano /etc/systemd/system/obmenex.service
```

Вставьте:

```ini
[Unit]
Description=obmenex.pro website and lead API
After=network.target

[Service]
Type=simple
User=obmenex
Group=obmenex
WorkingDirectory=/var/www/obmenex
EnvironmentFile=/etc/obmenex.env
ExecStart=/usr/bin/node /var/www/obmenex/server.mjs
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Проверьте путь Node.js:

```bash
which node
```

Если путь отличается от `/usr/bin/node`, исправьте `ExecStart`.

Запустите приложение:

```bash
systemctl daemon-reload
systemctl enable obmenex
systemctl start obmenex
systemctl status obmenex
```

Логи:

```bash
journalctl -u obmenex -f
```

Ожидаемый лог:

```text
obmenex.pro server listening on :8787 via SOCKS5H
```

## 7. Проверка Node-сервера

```bash
curl -I http://127.0.0.1:8787
```

Проверка API без отправки реальной заявки:

```bash
curl -i -X POST http://127.0.0.1:8787/api/leads \
  -H "Content-Type: application/json" \
  -d '{}'
```

Ожидаемый ответ: `400 Bad Request`.

## 8. Nginx

Создайте конфигурацию:

```bash
nano /etc/nginx/sites-available/obmenex
```

Содержимое:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name obmenex.pro www.obmenex.pro;

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

Активируйте сайт:

```bash
ln -s /etc/nginx/sites-available/obmenex /etc/nginx/sites-enabled/obmenex
nginx -t
systemctl reload nginx
```

Если мешает стандартный сайт Nginx:

```bash
unlink /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 9. HTTPS

```bash
apt install -y certbot python3-certbot-nginx

certbot --nginx \
  -d obmenex.pro \
  -d www.obmenex.pro
```

Проверка продления сертификата:

```bash
certbot renew --dry-run
```

## 10. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

Порт `8787` наружу открывать не нужно.

## 11. Проверка сайта

```bash
curl -I https://obmenex.pro
```

Проверьте в браузере:

```text
https://obmenex.pro
https://obmenex.pro/privacy.html
```

Затем отправьте тестовую заявку и проверьте Telegram-группу.

## 12. Обновление проекта

```bash
cd /var/www/obmenex

runuser -u obmenex -- git pull
runuser -u obmenex -- npm ci

runuser -u obmenex -- env \
  VITE_YANDEX_METRIKA_ID=12345678 \
  npm run build

systemctl restart obmenex
systemctl status obmenex
```

После изменения только backend достаточно выполнить:

```bash
systemctl restart obmenex
```

## 13. Диагностика

```bash
systemctl status obmenex
journalctl -u obmenex -n 100 --no-pager
nginx -t
systemctl status nginx
ss -tulpn | grep -E '80|443|8787'
test -f /var/www/obmenex/dist/index.html && echo OK
```

Основные файлы:

```text
/var/www/obmenex/server.mjs
/var/www/obmenex/dist
/etc/obmenex.env
/etc/systemd/system/obmenex.service
/etc/nginx/sites-available/obmenex
```
