# Деплой geliosobmen.ru на Ubuntu VPS

Инструкция рассчитана на Ubuntu 22.04/24.04. Все команды выполняются из root-сессии. Проект запускается одним Node.js-сервером: он раздает production-сборку `dist` и принимает заявки на `/api/leads`.

Домен проекта: `geliosobmen.ru`. Перед началом направьте DNS-записи домена на IP вашего VPS.

## 0. DNS до настройки HTTPS

В панели регистратора создайте записи:

```text
A      @      SERVER_IP
A      www    SERVER_IP
```

Вместо `SERVER_IP` укажите публичный IPv4-адрес сервера. Если провайдер не разрешает вторую A-запись, используйте `CNAME www -> geliosobmen.ru.`. Дождитесь обновления DNS и проверьте его с компьютера:

```bash
dig +short geliosobmen.ru
dig +short www.geliosobmen.ru
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

## 2. Каталог приложения

```bash
mkdir -p /var/www/gelios
```

## 3. Загрузка проекта

```bash
git clone https://github.com/Bell1488/obmenex.git /var/www/gelios
cd /var/www/gelios
npm ci
```

## 4. Telegram и SOCKS5H

Создайте Telegram-бота через `@BotFather`, добавьте его в рабочую группу и выдайте право отправлять сообщения.

ID группы обычно имеет вид `-1001234567890`. После сообщения в группе его можно проверить через:

```text
https://api.telegram.org/botВАШ_ТОКЕН/getUpdates
```

Создайте файл окружения:

```bash
nano /etc/gelios.env
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
chmod 600 /etc/gelios.env
```

Если в пароле прокси есть `@`, `:`, `/`, `?` или `#`, символы нужно URL-кодировать.

Токен Telegram и SOCKS5-прокси нельзя добавлять в GitHub или frontend.

Курс ЦБ РФ загружается сервером из `https://www.cbr.ru/scripts/XML_daily.asp` и кэшируется на один час. Если задан `BANK_RATE_URL`, сервер ожидает JSON с полями `buyCnyRub` и `sellCnyRub` и использует их как банковский ориентир. `BANK_ADVANTAGE_PERCENT=2` делает клиентский курс на 2% выгоднее этого ориентира. При недоступном или некорректном банковском источнике используется курс ЦБ РФ.

## 5. Production-сборка

`VITE_YANDEX_METRIKA_ID` встраивается в frontend во время сборки:

```bash
cd /var/www/gelios

VITE_YANDEX_METRIKA_ID=12345678 npm run build
```

Проверьте результат:

```bash
ls -la /var/www/gelios/dist
```

## 6. Systemd-сервис

Создайте файл:

```bash
nano /etc/systemd/system/gelios.service
```

Вставьте:

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

Проверьте путь Node.js:

```bash
which node
```

Если путь отличается от `/usr/bin/node`, исправьте `ExecStart`.

Запустите приложение:

```bash
systemctl daemon-reload
systemctl enable gelios
systemctl start gelios
systemctl status gelios
```

Логи:

```bash
journalctl -u gelios -f
```

Ожидаемый лог:

```text
geliosobmen.ru server listening on :8787 via SOCKS5H
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
nano /etc/nginx/sites-available/gelios
```

Содержимое:

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

Активируйте сайт:

```bash
ln -s /etc/nginx/sites-available/gelios /etc/nginx/sites-enabled/gelios
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
  -d geliosobmen.ru \
  -d www.geliosobmen.ru
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
curl -I https://geliosobmen.ru
```

Проверьте в браузере:

```text
https://geliosobmen.ru
https://geliosobmen.ru/privacy.html
```

Затем отправьте тестовую заявку и проверьте Telegram-группу.

## 12. Обновление проекта

```bash
cd /var/www/gelios

git pull
npm ci
VITE_YANDEX_METRIKA_ID=12345678 npm run build

systemctl restart gelios
systemctl status gelios
```

После изменения только backend достаточно выполнить:

```bash
systemctl restart gelios
```

## 13. Диагностика

```bash
systemctl status gelios
journalctl -u gelios -n 100 --no-pager
nginx -t
systemctl status nginx
ss -tulpn | grep -E '80|443|8787'
test -f /var/www/gelios/dist/index.html && echo OK
```

Основные файлы:

```text
/var/www/gelios/server.mjs
/var/www/gelios/dist
/etc/gelios.env
/etc/systemd/system/gelios.service
/etc/nginx/sites-available/gelios
```
