# Yamme Tee Web

Музыка и обложки хранятся в Supabase Storage.  
В git храним только мета: `public/tracks/_meta/*.json` и `public/tracks/releases.json`.

## Env

В `.env.local` должны быть:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Добавление Нового Релиза (Инкрементно)

1. Подготовьте папку релиза в `public/tracks/incoming/<имя-релиза>`.
2. Положите туда:
- аудио-файлы (`.mp3/.wav/.flac/.m4a/.aac/.ogg`)
- опционально 1 обложку (`.jpg/.jpeg/.png/.webp`)
3. Как называть файлы:
- используйте читаемые имена, например `01. intro.mp3`, `02. my city.mp3`
- номер в начале допустим, скрипт убирает его из `title` на сайте
- обложка: любой один файл изображения (берется первый по имени)
4. Создайте релиз и мета JSON:

```bash
npm run release:add -- \
  --source "public/tracks/incoming/my-release" \
  --id "my-release-2026" \
  --title "My Release" \
  --artist "Yamme Tee" \
  --date "2026-03-06" \
  --type "EP"
```

Что делает команда:
- копирует аудио в `public/tracks/audio/<releaseId>/...`
- копирует обложку в `public/tracks/covers/<releaseId>.<ext>` (или ставит `/favicon.svg`)
- создает `public/tracks/_meta/<releaseId>.json`
- добавляет релиз в `public/tracks/releases.json`

5. Залейте в Supabase только новый релиз:

```bash
npm run tracks:upload:supabase -- --release my-release-2026
```

Это загружает только ассеты релиза (`audio` + `cover`) и не трогает остальные.
6. После успешной загрузки удалите локальные медиа релиза (они уже в Supabase):

```bash
rm -rf public/tracks/audio/my-release-2026
rm -f public/tracks/covers/my-release-2026.*
rm -rf public/tracks/incoming/my-release
```

## Обновление Существующего Релиза (Например 50parts)

Если релиз уже есть и нужно добавить новые треки в конец треклиста:

1. Положите новые файлы в `public/tracks/incoming/50parts-new`.
2. Запустите:

```bash
npm run release:append -- \
  --source "public/tracks/incoming/50parts-new" \
  --id "50-parts-ep-18e8f682"
```

Опционально можно обновить мета поля в этом же запуске:
- `--title "..."`, `--artist "..."`, `--date "YYYY-MM-DD"`, `--type "EP|Single"`
- чтобы заменить обложку, положите файл картинки в папку и добавьте `--replace-cover`

3. Загрузите только этот релиз в Supabase:

```bash
npm run tracks:upload:supabase -- --release 50-parts-ep-18e8f682
```

Скрипт аплоада теперь пропускает отсутствующие локальные старые файлы и заливает только то, что реально есть локально (новые треки/новая обложка).

4. Очистите локальную временную папку:

```bash
rm -rf public/tracks/incoming/50parts-new
```

## Если Нужно Перезалить Вообще Все

```bash
npm run tracks:upload:supabase
```

## Нужно Ли Создавать JSON Руками

Нет, обычно не нужно.  
`npm run release:add` сам создает `public/tracks/_meta/<id>.json` и обновляет `public/tracks/releases.json`.

Ручной формат релиза (только если требуется правка):

```json
{
  "id": "my-release-2026",
  "title": "My Release",
  "artist": "Yamme Tee",
  "releaseType": "EP",
  "releaseDate": "2026-03-06",
  "cover": "/tracks/covers/my-release-2026.jpg",
  "tracks": [
    {
      "id": "track-id",
      "title": "Track Title",
      "artist": "Yamme Tee",
      "audio": "/tracks/audio/my-release-2026/track-id.mp3",
      "lyrics": ""
    }
  ]
}
```
