# Kartalla — Tapahtumien lisääminen & moderointi

## Ominaisuudet

### 1. DB-migraatio
Lisätään `status`-kenttä events-tauluun.

```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';

ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- Vanhat tapahtumat (LinkedEvents ym. sync) pysyvät approved
-- Uudet käyttäjien lisäämät tulevat pending-tilaan
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events (status);
```

Supabase SQL -editorissa ajettava manuaalisesti (`supabase/migrations/003_add_status.sql`).

---

### 2. Kartan suodatus
`src/app/page.tsx` — Supabase-haku suodattaa vain `status = 'approved'` tapahtumat.
Pieni muutos olemassa olevaan kyselyyn.

---

### 3. Tapahtuman lisäyssivu (`/lisaa`)

Kolme välilehteä:

**A) Manuaalinen lomake**
- Otsikko, kuvaus, kategoria, alkuaika, loppuaika
- Paikan nimi, osoite
- Klikkaa kartalta sijainti (kuten nyt) TAI syötä osoite → geocodaus Nominatimilla
- URL (vapaaehtoinen)
- Säännöt näkyvissä lomakkeen alapuolella

**B) AI-avusteinen (yksi tapahtuma)**
- "Kopioi tämä ohje tekoälyllesi" -nappi (kopioi template promptin)
- Tekstikenttä johon liitetään AI:n palauttama JSON
- Parse → esikatselu → vahvista

**C) AI-avusteinen (useampi kerralla)**
- Sama kuin B, mutta JSON on taulukko `[{...}, {...}]`
- Esikatselu listaa kaikki tapahtumat
- Voi poistaa yksittäisiä ennen tallennusta

**Template prompt** (käyttäjä kopioi tämän ChatGPT:hen / Claudeen):
```
Olet tapahtuma-assistentti kartalla.fi-palvelua varten.

Tehtäväsi: poimi alla olevasta tekstistä tai kuvasta tapahtumat ja palauta ne
JSON-muodossa. Etsi koordinaatit (lat, lng) Google Maps -haulla osoitteen perusteella.

Säännöt:
- category on AINA yksi näistä: music, sports, food, culture, family, other
- starts_at ja ends_at ISO 8601 -muodossa: "2025-06-15T18:00:00"
- Jos loppuaika puuttuu, jätä ends_at null
- Jos URL puuttuu, jätä null
- Palauta VAIN JSON-taulukko, ei selityksiä

[
  {
    "title": "Tapahtuman nimi",
    "description": "Lyhyt kuvaus tai null",
    "location_name": "Paikan nimi",
    "address": "Katuosoite, Kaupunki",
    "lat": 60.1699,
    "lng": 24.9384,
    "category": "music",
    "starts_at": "2025-06-15T18:00:00",
    "ends_at": "2025-06-15T22:00:00",
    "url": null
  }
]

Tässä ovat tapahtuman tiedot:
[KÄYTTÄJÄ LIITTÄÄ TÄHÄN TEKSTIN TAI KUVAN]
```

**Säännöt käyttäjälle (näkyy lomakkeessa):**
- ✅ Kaikki julkiset tapahtumat sallitaan — myös poliittiset ja mielenosoitukset
- ❌ Yksityistilaisuudet (häät, syntymäpäivät, yms.)
- ❌ Mainokset tai verkkokaupat
- ❌ Laittomat tapahtumat
- Kaikki tapahtumat tarkistetaan ennen julkaisua

---

### 4. Admin-sivu (`/admin`)

Suojattu: vain sinä pääset sinne (kovakoodattu sähköposti tai env var `ADMIN_EMAIL`).

Näkymä:
- Lista `pending`-tapahtumista (vanhin ensin)
- Per tapahtuma: kaikki tiedot + sijainti pienellä kartalla
- Napit: **Hyväksy** / **Hylkää**
- Hylätessä: vapaaehtoinen syy (ei näy käyttäjälle toistaiseksi)
- Näkyy myös `approved` ja `rejected` tapahtumat filtterillä

---

### 5. Autentikointi

Supabase Auth on jo käytössä. Lisätään:
- Kirjaudu sisään / Rekisteröidy -sivu (`/kirjaudu`)
- Sähköposti + salasana (yksinkertaisin)
- Tapahtuman lisääminen vaatii kirjautumisen

RLS-muutos: `INSERT` sallitaan kirjautuneille, `status` pakotetaan `pending`-tilaan
(admin-reitti voi asettaa `approved` service role -avaimella).

---

## Toteutusjärjestys

1. `003_add_status.sql` — migraatio (ajo Supabase-dashboardissa)
2. Kartan suodatus (`status = 'approved'`)
3. Auth-sivu (`/kirjaudu`)
4. Lisäyssivu (`/lisaa`) — ensin manuaalinen, sitten AI-välilehdet
5. Admin-sivu (`/admin`)

---

## Tiedostot joita luodaan/muutetaan

| Tiedosto | Muutos |
|----------|--------|
| `supabase/migrations/003_add_status.sql` | Uusi |
| `src/app/page.tsx` | Lisää `.eq('status', 'approved')` kyselyyn |
| `src/app/lisaa/page.tsx` | Uusi — lisäyssivu |
| `src/components/AddEventForm.tsx` | Uusi — manuaalinen lomake |
| `src/components/AiImport.tsx` | Uusi — AI JSON -liitä |
| `src/app/admin/page.tsx` | Uusi — moderointinäkymä |
| `src/app/kirjaudu/page.tsx` | Uusi — kirjautuminen |
| `src/lib/geocode.ts` | Uusi — Nominatim-geocodaus |

---

## Avoimet kysymykset

- Ilmoitetaanko käyttäjälle sähköpostilla kun tapahtuma hyväksytään? (Supabase voi lähettää)
- Näytetäänkö käyttäjälle lista omista lisäyksistään ja niiden tilasta?
- Saako kirjautumaton käyttäjä nähdä kartan? (Oletus: kyllä, vain lisääminen vaatii kirjautumisen)
