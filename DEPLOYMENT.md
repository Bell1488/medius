# Деплой MediusObmen.cc на Ubuntu VPS

Код проекта хранится в GitHub: `https://github.com/Bell1488/medius.git`. Инструкция для Ubuntu 22.04/24.04.

## 1. DNS

Создайте DNS-записи `A @ IP_СЕРВЕРА` и `A www IP_СЕРВЕРА` (или `CNAME www mediusobmen.cc.`). Дождитесь обновления и проверьте:

```bash
dig +short mediusobmen.cc
dig +short www.mediusobmen.cc
```

## 2. Установка и клонирование из GitHub

Подключитесь по SSH под пользователем `root` и выполните все команды ниже от root:

```bash
apt update
apt install -y nginx git curl ca-certificates ufw gnupg certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
mkdir -p /var/www
git clone https://github.com/Bell1488/medius.git /var/www/medius
cd /var/www/medius
npm ci
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
VITE_YANDEX_METRIKA_ID=113791515 npm run build
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
User=root
Group=root
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

Если статус показывает `EADDRINUSE ... :::8787`, порт уже занят ранее запущенным Node-процессом. Остановите перезапуски сервиса, найдите владельца порта и проверьте команду процесса:

```bash
systemctl stop medius
ss -ltnp | grep ':8787'
fuser -v 8787/tcp
ps -fp PID_ИЗ_ВЫВОДА
```

Если это старый экземпляр этого проекта, завершите его и запустите systemd заново:

```bash
kill PID_ИЗ_ВЫВОДА
sleep 2
ss -ltnp | grep ':8787' || true
systemctl reset-failed medius
systemctl start medius
systemctl status medius --no-pager
```

Если после `kill` процесс снова появляется, старый сайт управляется отдельным systemd-сервисом. Найдите и отключите его:

```bash
systemctl list-units --type=service --all | grep -iE 'prorest|gelios|obmen'
systemctl status prorest --no-pager
systemctl stop prorest
systemctl disable prorest
fuser -v 8787/tcp
systemctl start medius
systemctl status medius --no-pager
```

Имя `prorest` замените на имя сервиса из первого вывода, если оно отличается. Отключайте старый сервис только если ProRest больше не должен работать на этом VPS.

Если порт занят другим приложением, оставьте его работающим и выберите свободный порт: измените `PORT` в `/etc/medius.env` и `proxy_pass` в конфигурации Nginx на тот же номер, затем выполните `systemctl daemon-reload && systemctl restart medius && nginx -t && systemctl reload nginx`.

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

Проверьте `curl -sS http://127.0.0.1:8787/api/rates`. Отправьте одну реальную тестовую заявку, убедитесь, что она пришла в Telegram, и проверьте Метрику. Рекламу включайте только после этого.

## Цели Яндекс Метрики

В счётчике `113791515` создайте JavaScript-цели с такими идентификаторами:

```text
lead_submit             отправка формы заявки
telegram_click          переход в Telegram менеджера или фиксация курса
phone_click             клик по номеру телефона
telegram_reviews_click  переход на канал с отзывами
telegram_clients_click  переход в чат клиентов
```

Параметр `source` передаётся автоматически для разбивки по месту клика (`hero`, `header_desktop`, `header_mobile`, `calculator`, `contact`, `footer`, `floating_button`). Для основной рекламной цели используй `lead_submit`; `telegram_click` можно добавить как дополнительную цель конверсии.

Для обновления из GitHub:

```bash
cd /var/www/medius
git remote set-url origin https://github.com/Bell1488/medius.git
git remote -v
git fetch origin
git pull --ff-only origin main
npm ci
VITE_YANDEX_METRIKA_ID=113791515 npm run build
systemctl restart medius
systemctl status medius --no-pager
```

Проверьте, что `git remote -v` показывает `https://github.com/Bell1488/medius.git`. Если каталог раньше клонировали из другого репозитория, одного `git pull` недостаточно: он продолжает получать код с прежнего `origin`.

После запуска сравните локальный ответ приложения с HTML из сборки:

```bash
curl -sS http://127.0.0.1:8787/ | grep -i '<title>'
grep -i '<title>' /var/www/medius/dist/index.html
```

В обоих выводах должно быть `MediusObmen.cc`. Если заголовки разные, сначала проверьте `git remote -v`, затем выполните fetch, fast-forward pull и production build.

Если локальный `dist` уже содержит Medius, а домен показывает другой сайт, проверьте backend и Nginx отдельно:

```bash
systemctl cat medius
curl -sS http://127.0.0.1:8787/ | grep -i '<title>'
curl -k -sS --resolve mediusobmen.cc:443:127.0.0.1 https://mediusobmen.cc/ | grep -i '<title>'
```

Первый `curl` должен показать Medius. Если он показывает ProRest, systemd запустил не тот `server.mjs` или старый процесс всё ещё занимает порт. Проверьте `ExecStart`, `WorkingDirectory` и `ss -ltnp | grep ':8787'`.

Если первый `curl` показывает Medius, а второй ProRest, запрос попадает в старый или дублирующий HTTPS-vhost. Найдите все активные конфигурации:

```bash
grep -RInE 'server_name|proxy_pass|listen .*443|default_server' /etc/nginx/sites-enabled /etc/nginx/conf.d
```

В vhost для `mediusobmen.cc` должен быть `proxy_pass http://127.0.0.1:8787;`. Старый vhost ProRest нужно отключить, если он больше не используется:

```bash
rm -f /etc/nginx/sites-enabled/prorest
nginx -t
systemctl reload nginx
```

Удаляйте только ссылку на фактически неиспользуемый файл после проверки его имени в выводе `grep`.

## Локальный запуск

В первом терминале запустите `npm run build`, затем `npm run server`. Во втором выполните `npm run dev -- --host 127.0.0.1` и откройте `http://127.0.0.1:5173`. Локальные заявки требуют Telegram-переменных; без них API вернёт `503`.
