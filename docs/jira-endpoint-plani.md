# Jira Entegrasyonu — Endpoint Planı

Kaynak Excel'ler:
- `RPA_Kapasite_Takipv2.xlsx` (sayfalar: Parametreler, İş_Listesi, Rapor, Kapasite, Listeler)
- `İş_Zekası_Takip_Sunum (2).xlsx` (sayfalar: Tümü, Parametreler, İş_Listesi, Rapor, Listeler, SR-INC)

Hedef Jira: `https://kazanciholding.atlassian.net` → **Jira Cloud**, yani
platform API `v3` + Jira Software (Agile) API `1.0` geçerli.

> **Durum:** API key henüz yok. Bu dokümandaki `customfield_XXXXX` id'leri
> tahmindir; key gelir gelmez **Faz 0 keşif** çağrıları çalıştırılıp gerçek
> id'lerle değiştirilmelidir. Diğer her şey (path'ler, sistem alan adları)
> kesindir.

---

## 0. Kimlik doğrulama

Tüm çağrılarda:

```
Authorization: Basic base64("<JIRA_ACCOUNT_EMAIL>:<JIRA_API_KEY>")
Accept: application/json
```

Projede karşılığı zaten hazır: `JiraProperties` (`jira.base-url`,
`jira.account-email`, `jira.api-key`) — [JiraProperties.java](src/main/java/com/aksa/capacityplanner/jiraintegration/config/JiraProperties.java).
`JIRA_ENABLED=true` yapıldığında `NoOpJiraGatewayAdapter` devre dışı kalır,
yerine yazılacak `JiraRestClientAdapter` devreye girer.

---

## 1. FAZ 0 — Keşif çağrıları (API key gelir gelmez ilk bunlar)

Bu 6 çağrı olmadan alan eşlemesi yapılamaz, çünkü Sektör/Departman/Sprint/
Story Points gibi alanların `customfield_` id'leri her Jira instance'ında farklıdır.

| # | Endpoint | Ne için |
|---|---|---|
| 0.1 | `GET /rest/api/3/myself` | Token doğrulama, accountId öğrenme |
| 0.2 | `GET /rest/api/3/project/search?maxResults=100` | Proje anahtarları. Excel'deki iş adları `CI9304`, `PRJ212`, `PRJ204` ile başlıyor → büyük ihtimalle proje key'leri **`CI`** ve **`PRJ`**. Bu çağrı ile doğrulanacak. |
| 0.3 | `GET /rest/api/3/field` | **En kritik çağrı.** Tüm sistem + custom alanların `id`/`name`/`schema` listesi. "Sektör", "Departman", "Sprint", "Story Points", "Team" alanlarının gerçek `customfield_XXXXX` id'leri burada. |
| 0.4 | `GET /rest/api/3/status` ve `GET /rest/api/3/statuscategory` | Jira statülerinin Excel `Listeler` sayfasındaki statülerle (Backlog, Analiz, Analiz Havuzu, Analiz Onayı, Geliştirme, Geliştirme Havuzu, UAT, Devam Ediyor, Canlı, Canlıda/Y, İptal, Beklemede, Müşteri Bekleniyor, Ön Analiz) eşleşme kontrolü |
| 0.5 | `GET /rest/agile/1.0/board?projectKeyOrId=CI` | Takımın board id'si (RPA ve İş Zekası için ayrı board olabilir) |
| 0.6 | `GET /rest/agile/1.0/board/{boardId}/configuration` | Board'un **estimation field**'ı (Story Points mi, Original Estimate mi) ve filtre id'si — "Efor / Toplam Tahmini Efor" kolonunun kaynağını bu belirler |

Ek (gerekirse):
- `GET /rest/api/3/issuetype` — CI / PRJ / SR / INC issue type ayrımı (BI dosyasındaki `SR-INC` sayfası için)
- `GET /rest/api/3/priority` — Excel `Öncelik` (Kritik/Yüksek/Orta/Düşük) eşlemesi
- `GET /rest/api/3/project/{projectKey}/components` — `Sektör`/`Departman` component olarak tutuluyorsa

---

## 2. FAZ 1 — Güncel (aktif) sprint'i çekme

Excel `Parametreler` sayfasındaki **Sprint No / Sprint ID / İki Haftalık Dönem No**
ve **Plan Başlangıç / Dönem Bitiş** tarihlerinin karşılığı.

| # | Endpoint | Dönen veri |
|---|---|---|
| 1.1 | `GET /rest/agile/1.0/board/{boardId}/sprint?state=active` | **Güncel sprint.** `state` = `future` \| `active` \| `closed` |
| 1.2 | `GET /rest/agile/1.0/sprint/{sprintId}` | `id`, `name`, `state`, `startDate`, `endDate`, `completeDate`, `goal` |
| 1.3 | `GET /rest/agile/1.0/sprint/{sprintId}/issue?fields=...` | Sprint içindeki tüm issue'lar (sayfalı: `startAt`/`maxResults`) |
| 1.4 | `GET /rest/agile/1.0/board/{boardId}/backlog` | Sprint'e alınmamış işler → Excel'deki `Backlog` statülü satırlar |
| 1.5 | `GET /rest/agile/1.0/board/{boardId}/issue` | Board'daki tüm issue'lar (sprint filtresi olmadan) |

Eşleme:

| Excel alanı | Jira kaynağı |
|---|---|
| Sprint No / Sprint ID | `sprint.id` / `sprint.name` |
| İki Haftalık Dönem No | `sprint.name` içinden parse ya da uygulama tarafı sayaç |
| Plan Başlangıç Tarihi | `sprint.startDate` |
| Dönem Bitiş Tarihi | `sprint.endDate` |
| Takım Adı | `board.name` — ya da uygulamadaki `teams.name` |

---

## 3. FAZ 2 — İş listesi (ana veri çekimi)

> ⚠️ Eski `GET/POST /rest/api/3/search` **kaldırıldı**. Yeni endpoint
> `search/jql` ve sayfalama `startAt` yerine **`nextPageToken`** ile yapılıyor;
> yanıtta `total` alanı dönmüyor.

| # | Endpoint | Not |
|---|---|---|
| 3.1 | `POST /rest/api/3/search/jql` | Ana çekim. Body: `{ "jql": "...", "fields": [...], "maxResults": 100, "nextPageToken": "..." }` |
| 3.2 | `GET /rest/api/3/search/jql?jql=...&fields=...&maxResults=100` | Aynısının GET hali (kısa sorgular için) |
| 3.3 | `POST /rest/api/3/search/approximate-count` | Toplam kayıt sayısı (`total` artık 3.1'de dönmediği için) |
| 3.4 | `GET /rest/api/3/issue/{issueIdOrKey}?fields=...&expand=changelog,renderedFields` | Tek issue detayı |
| 3.5 | `POST /rest/api/3/issue/bulkfetch` | ≤100 issue key ile toplu detay çekimi |

Örnek JQL'ler:

```
project in (CI, PRJ) AND sprint in openSprints() ORDER BY priority DESC
project in (CI, PRJ) AND statusCategory != Done
project = CI AND updated >= -14d
sprint = 1234
```

Çekilecek `fields` listesi (payload'ı küçültmek için mutlaka daraltılmalı):

```
summary, status, priority, assignee, issuetype, components, labels,
timeoriginalestimate, timeestimate, timespent, aggregatetimespent,
aggregatetimeoriginalestimate, created, updated, resolutiondate, parent,
subtasks, customfield_XXXXX (Sektör), customfield_XXXXX (Departman),
customfield_XXXXX (Story Points), customfield_XXXXX (Sprint)
```

---

## 4. FAZ 3 — Efor / worklog (kişi bazlı kırılım)

Bu, Excel'deki en kritik ve Jira'da **doğrudan karşılığı olmayan** kısım.
Excel'de tek satırda `Anıl Analiz`, `Anıl Geliştirme`, `Pelinsu Analiz`,
`Müge Efor`, `Müge Gerçekleşen Efor` gibi **kişi × iş** kırılımı var.
Jira'da bir issue'nun tek `assignee`'si vardır. İki çözüm yolu:

**Yol A — Worklog bazlı (gerçekleşen efor için doğru yol):**

| # | Endpoint | Dönen veri |
|---|---|---|
| 4.1 | `GET /rest/api/3/issue/{issueIdOrKey}/worklog?startAt=0&maxResults=100` | `author.accountId`, `timeSpentSeconds`, `started` → kişi bazlı **Gerçekleşen Efor** |
| 4.2 | `GET /rest/api/3/worklog/updated?since={epochMillis}` | Delta senkronizasyon için değişen worklog id'leri |
| 4.3 | `POST /rest/api/3/worklog/list` | Body `{"ids":[...]}` — ≤1000 worklog'u tek çağrıda çekme |

**Yol B — Alt görev (subtask) bazlı (planlanan efor kırılımı için):**

| # | Endpoint | Not |
|---|---|---|
| 4.4 | `GET /rest/api/3/issue/{key}?fields=subtasks` veya JQL `parent = CI-9304` | Her alt görevin kendi `assignee` + `timeoriginalestimate` değeri → Excel'deki `<Kişi> Analiz` / `<Kişi> Geliştirme` kolonları |

> **Karar gerekiyor:** RPA Excel'indeki `Anıl Analiz` / `Anıl Geliştirme` ayrımı,
> Jira'da (a) alt görev olarak mı, (b) worklog kategorisi olarak mı, yoksa
> (c) hiç tutulmayıp sadece Excel'de mi var? Faz 0.2/0.5 sonrası gerçek bir
> issue'ya bakılarak netleşecek. Eğer Tempo Timesheets kuruluysa kişi × iş ×
> gün kırılımı için Tempo'nun kendi API'si (`/rest/tempo-timesheets/4/worklogs`)
> daha uygun olur.

---

## 5. FAZ 4 — Kişiler (takım üyeleri)

| # | Endpoint | Not |
|---|---|---|
| 5.1 | `GET /rest/api/3/user/search?query={ad veya email}` | Excel'deki Anıl, Burak, Osman, Pelinsu, Atakan, Şevket / Müge, Emrah, Ece Sena, Batuhan isimlerinin `accountId` karşılığı |
| 5.2 | `GET /rest/api/3/user?accountId={id}` | Tek kullanıcı detayı |
| 5.3 | `GET /rest/api/3/user/assignable/search?project=CI&maxResults=100` | Projede iş atanabilen kişiler = takım listesi |
| 5.4 | `GET /rest/api/3/users/search?startAt=0&maxResults=1000` | Tüm kullanıcılar (izin gerektirir) |

Eşleme: `accountId` → `team_members` tablosuna yeni bir `jira_account_id` kolonu
eklenmeli (şu an yok — [TeamMember.java](src/main/java/com/aksa/capacityplanner/team/domain/TeamMember.java)).

---

## 6. FAZ 5 — Statü geçişleri ve kapanış tarihi

Excel `Rapor` sayfasındaki *"1 Haziran'dan İtibaren Tamamlanan/Düşen Efor"* ve
projedeki `WorkItem.closedDate` alanı için gerekli.

| # | Endpoint | Not |
|---|---|---|
| 6.1 | `GET /rest/api/3/issue/{key}/changelog?startAt=0&maxResults=100` | Statü geçiş geçmişi → hangi tarihte "Canlı"ya geçti |
| 6.2 | `GET /rest/api/3/issue/{key}?expand=changelog` | Aynı bilgi, issue detayıyla birlikte |
| 6.3 | JQL: `status CHANGED TO ("Canlı","Canlıda/Y","İptal") DURING ("2026-06-01","2026-08-11")` | Tek sorguda dönem içinde kapanan işler |
| 6.4 | `fields=resolutiondate` | Resolution kullanılıyorsa daha ucuz alternatif |

---

## 7. Excel alanı → Jira kaynağı tam eşleme tablosu

### 7.1 RPA `İş_Listesi` sayfası

| Excel kolonu | Jira kaynağı | Endpoint |
|---|---|---|
| Sektör | `customfield_XXXXX` **veya** `components` / `labels` | 3.1 (`fields`) — id'si 0.3'ten |
| Departman | `customfield_XXXXX` **veya** `components` | 3.1 |
| İş Adı | `summary` | 3.1 |
| Statü | `status.name` | 3.1 |
| Öncelik | `priority.name` | 3.1 |
| Efor (planlanan) | `timeoriginalestimate` **veya** Story Points (`customfield_XXXXX`) | 3.1 + 0.6 |
| `<Kişi> Analiz` / `<Kişi> Geliştirme` | subtask `assignee` + `timeoriginalestimate` **veya** worklog `author` | 4.1 / 4.4 |
| Not | `description` (ADF) veya `GET /rest/api/3/issue/{key}/comment` | 3.4 |
| Kazanç (Yıllık Saat) | ❌ Jira'da yok | Uygulama tarafı custom field (`team_custom_field_definitions`) |
| Kazanç (Yıllık Adam Gün) | ❌ türetilmiş (saat / 7) | Hesaplama |
| FTE | ❌ türetilmiş | Hesaplama |

### 7.2 İş Zekası `Tümü` / `İş_Listesi` sayfası

| Excel kolonu | Jira kaynağı | Endpoint |
|---|---|---|
| Sektör | `customfield_XXXXX` / `components` | 3.1 |
| İş Adı | `key` + `summary` (Excel'de `CI9304-...` formatında birleşik) | 3.1 |
| Toplam Tahmini Efor | `aggregatetimeoriginalestimate` (alt görevler dahil) | 3.1 |
| Toplam Gerçekleşen Efor | `aggregatetimespent` | 3.1 |
| Statü | `status.name` | 3.1 |
| `<Kişi> Efor` | subtask assignee bazlı estimate | 4.4 |
| `<Kişi> Gerçekleşen Efor` | worklog `author.accountId` bazlı toplam | 4.1 / 4.3 |
| `SR-INC` sayfası (SR / INC satırları) | `issuetype in ("Service Request","Incident")` JQL | 3.1 — JSM projesiyse `/rest/servicedeskapi/request` |

### 7.3 `Kapasite` sayfası — **Jira'da karşılığı YOK**

Bu sayfanın tamamı uygulama tarafında hesaplanır, zaten
[CapacityCalculationService.java](src/main/java/com/aksa/capacityplanner/capacity/domain/CapacityCalculationService.java)
içinde birebir implemente edilmiş durumda.

| Excel kolonu | Kaynak |
|---|---|
| Rol, Kişi | `team_members` (+ 5.1 ile `accountId` eşlemesi) |
| Kapasite Başlangıç / Dönem Bitiş | `teams` + sprint tarihleri (1.2) |
| Dönem Toplam İş Günü | `TargetWorkDaysCalculator` |
| İzin | `leave_periods` tablosu (Jira'da yok; Tempo varsa `/rest/tempo-...`) |
| Rapor Tarihi | Uygulama parametresi |
| Geçen / Kalan İş Günü | `DateRange.businessDays()` |
| Bakım Oranı | `teams.maintenance_allocation_percent` |
| Bakım Hariç Kalan Kapasite | Hesaplama |

### 7.4 `Parametreler` ve `Listeler` sayfaları

| Excel alanı | Kaynak | Endpoint |
|---|---|---|
| Plan Başlangıç / Dönem Bitiş | `sprint.startDate` / `sprint.endDate` | 1.2 |
| Sprint No / İki Haftalık Dönem No | `sprint.id` / `sprint.name` | 1.1 |
| Takım Adı | `board.name` / `teams.name` | 0.5 |
| Rapor Tarihi | Uygulama | — |
| Bakım/SR Oranı | `teams` | — |
| Şirket İş Günü (145) | `TargetWorkDaysCalculator` | — |
| Tamamlanan/Düşen Statüler | `status_options.counts_as_completed` + Jira statü listesi | 0.4 |
| `Listeler`: Statü | `GET /rest/api/3/status` | 0.4 |
| `Listeler`: Öncelik | `GET /rest/api/3/priority` | 0.x |
| `Listeler`: Sektör | Custom field `allowedValues` → `GET /rest/api/3/field/{fieldId}/context/{contextId}/option` | 0.3 |

---

## 8. Öncelik sırası — özet endpoint listesi

```
# Faz 0 — Keşif (API key gelir gelmez)
GET  /rest/api/3/myself
GET  /rest/api/3/project/search?maxResults=100
GET  /rest/api/3/field
GET  /rest/api/3/status
GET  /rest/api/3/statuscategory
GET  /rest/api/3/priority
GET  /rest/api/3/issuetype
GET  /rest/agile/1.0/board?projectKeyOrId={KEY}
GET  /rest/agile/1.0/board/{boardId}/configuration

# Faz 1 — Güncel sprint
GET  /rest/agile/1.0/board/{boardId}/sprint?state=active
GET  /rest/agile/1.0/sprint/{sprintId}
GET  /rest/agile/1.0/sprint/{sprintId}/issue?fields=...
GET  /rest/agile/1.0/board/{boardId}/backlog

# Faz 2 — İş listesi
POST /rest/api/3/search/jql
POST /rest/api/3/search/approximate-count
GET  /rest/api/3/issue/{issueIdOrKey}?fields=...&expand=changelog
POST /rest/api/3/issue/bulkfetch

# Faz 3 — Efor / worklog
GET  /rest/api/3/issue/{issueIdOrKey}/worklog
GET  /rest/api/3/worklog/updated?since={epochMillis}
POST /rest/api/3/worklog/list

# Faz 4 — Kişiler
GET  /rest/api/3/user/search?query=...
GET  /rest/api/3/user/assignable/search?project={KEY}

# Faz 5 — Statü geçişleri
GET  /rest/api/3/issue/{key}/changelog
```

---

## 9. Teknik notlar

- **Sayfalama:** `search/jql` → `nextPageToken` (cursor). Agile API (`/rest/agile/1.0/...`)
  hâlâ `startAt` + `maxResults` + `isLast` kullanıyor. İki farklı sayfalama
  mantığı gerekiyor.
- **Rate limit:** Jira Cloud 429 + `Retry-After` header döner. Exponential
  backoff şart; `WebClient`/`RestClient` üzerine bir retry filtresi eklenmeli.
- **`description` alanı ADF (Atlassian Document Format) JSON'dur**, düz metin
  değil. Düz metin isteniyorsa `expand=renderedFields` (HTML) kullanılmalı.
- **Delta sync:** her seferinde tüm projeyi çekmek yerine
  `updated >= -{n}d` JQL'i + `/worklog/updated` ile artımlı senkron yapılmalı;
  mevcut RabbitMQ akışı ([JiraSyncRequestConsumer.java](src/main/java/com/aksa/capacityplanner/jiraintegration/adapter/JiraSyncRequestConsumer.java))
  buna uygun.
- **Kod tarafında gereken değişiklikler:**
  - `JiraGatewayPort` şu an sadece `fetchIssues(JiraFetchQuery)` sunuyor —
    sprint, worklog, field ve user çekimi için yeni metotlar gerekiyor.
  - `WorkItem`'da `actualEffortDays` (gerçekleşen efor) alanı yok; BI takımı
    için şart.
  - `team_members`'a `jira_account_id` kolonu gerekiyor.
  - Takıma özgü alan eşlemesi (`Sektör` → hangi `customfield_`) için
    `team_custom_field_definitions` tablosuna `jira_field_id` kolonu
    eklenmesi en temiz çözüm.

---

## Kaynaklar

- [Jira Cloud platform REST API v3 — Issue Search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/)
- [Jira Software Cloud REST API — Board](https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/)
- [Jira Software Cloud REST API — Sprint](https://developer.atlassian.com/cloud/jira/software/rest/api-group-sprint/)
- [Run JQL search query using Jira Cloud REST API](https://confluence.atlassian.com/jirakb/run-jql-search-query-using-jira-cloud-rest-api-1289424308.html)
- [Atlassian REST API search endpoints deprecation](https://docs.adaptavist.com/sr4jc/latest/release-notes/breaking-changes/atlassian-rest-api-search-endpoints-deprecation)
