# Короткая памятка (все команды от root)

Полная инструкция находится в [DEPLOYMENT.md](DEPLOYMENT.md).

Репозиторий:

```text
https://github.com/Bell1488/medius.git
```

Ключевые команды на VPS:

```bash
git clone https://github.com/Bell1488/medius.git /var/www/medius
cd /var/www/medius
npm ci
VITE_YANDEX_METRIKA_ID=113791515 npm run build
systemctl restart medius
```

Секреты Telegram хранятся только в `/etc/medius.env`, не в GitHub. Systemd-сервис запускается от `root`, как и весь процесс деплоя.
