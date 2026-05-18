# Kartalla — Toteutussuunnitelma

## Päätetyt asiat
- Kartta auki kaikille, lisääminen vaatii kirjautumisen
- Kaikki tapahtumat menevät moderointiin (pending → approved/rejected)
- Käyttäjälle sähköposti-ilmoitus kun tapahtuma hyväksytään
- Käyttäjällä oma listanäkymä omista tapahtumista (muokkaus, poisto)
- Sallitut: kaikki julkiset tapahtumat ml. poliittiset ja mielenosoitukset
- Kielletyt: yksityistilaisuudet, mainokset/verkkokaupat, laittomat

---

## Osa 1 — Tapahtumien lisääminen & moderointi

### 1. DB-migraatio (`003_add_status.sql`)
Ajetaan manuaalisesti Supabase SQL -editorissa.

```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS events_status_idx ON public.events (status);
CREATE INDEX IF NOT EXISTS events_submitted_by_idx ON public.events (submitted_by);

-- RLS: käyttäjä näkee vain omat pending/rejected tapahtumat + kaikki approved
DROP POLICY IF EXISTS "Kaikki voivat lukea tapahtumia" ON public.events;
CREATE POLICY "Luku: approved kaikille, omat kaikki"
  ON public.events FOR SELECT
  USING (
    status = 'approved'
    OR submitted_by = auth.uid()
  );

-- INSERT: kirjautuneet, status pakotetaan pending
DROP POLICY IF EXISTS "Kirjautuneet voivat lisätä tapahtumia" ON public.events;
CREATE POLICY "Kirjautuneet voivat lisätä tapahtumia"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND source = 'manual'
    AND status = 'pending'
    AND submitted_by = auth.uid()
  );

-- UPDATE/DELETE: vain omat pending-tapahtumat
CREATE POLICY "Käyttäjä voi muokata omia pending-tapahtumiaan"
  ON public.events FOR UPDATE
  USING (submitted_by = auth.uid() AND status = 'pending');

CREATE POLICY "Käyttäjä voi poistaa omia tapahtumiaan"
  ON public.events FOR DELETE
  USING (submitted_by = auth.uid() AND source = 'manual');
```

### 2. Kartan suodatus
`src/app/page.tsx` — lisätään `.eq('status', 'approved')` Supabase-kyselyyn.

### 3. Autentikointi (`/kirjaudu`)
- Sähköposti + salasana Supabase Authilla
- Rekisteröidy / Kirjaudu sisään
- Uloskirjautuminen navigaatiossa

### 4. Tapahtuman lisäyssivu (`/lisaa`)

Kolme välilehteä samalla sivulla:

**A) Manuaalinen lomake**
- Otsikko, kuvaus (vapaaehtoinen), kategoria
- Alkuaika, loppuaika (vapaaehtoinen)
- Paikan nimi, osoite → "Hae sijainti" -nappi (Nominatim-geocodaus)
- Tai klikkaa kartalta
- URL (vapaaehtoinen)
- Säännöt näkyvissä

**B) AI-avusteinen — yksi tai useampi tapahtuma**
- Kopioi template prompt -nappi
- Tekstikenttä AI:n vastauksen liittämiseen (JSON)
- Parse → esikatselu kortteina
- Voi poistaa yksittäisiä ennen tallennusta
- Tallenna kaikki -nappi

**Template prompt:**
```
Olet tapahtuma-assistentti kartalla.fi-palvelua varten.

Poimi alla olevasta tekstistä tai kuvasta tapahtumat ja palauta ne JSON-muodossa.
Etsi koordinaatit (lat, lng) osoitteen perusteella mahdollisimman tarkasti.

Säännöt:
- category: music | sports | food | culture | family | other
- starts_at ja ends_at ISO 8601: "2025-06-15T18:00:00"
- Jos loppuaika puuttuu: ends_at = null
- Jos URL puuttuu: url = null
- Palauta VAIN JSON-taulukko, ei muuta tekstiä

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
[LIITÄ TEKSTI TAI KUVA TÄHÄN]
```

**Säännöt (näkyy käyttäjälle):**
- ✅ Kaikki julkiset tapahtumat — myös poliittiset ja mielenosoitukset
- ❌ Yksityistilaisuudet (häät, syntymäpäivät)
- ❌ Mainokset tai verkkokaupat
- ❌ Laittomat tapahtumat
- Kaikki tapahtumat tarkistetaan ennen julkaisua (yleensä 24h sisällä)

### 5. Oma tapahtumalista (`/omat`)
- Lista käyttäjän omista tapahtumista
- Status-badge: "Odottaa hyväksyntää" / "Hyväksytty" / "Hylätty"
- Hylätyssä näkyy syy jos annettu
- Muokkaa (vain pending) / Poista -napit
- Linkki lisäyssivulle jos ei ole tapahtumia

### 6. Sähköposti-ilmoitus hyväksynnästä
Supabase Edge Function tai API-reitti joka lähettää sähköpostin kun admin hyväksyy.
Supabase SMTP:llä (tai Resend, ilmainen 3000 viestiä/kk).

**Viesti:**
> Hei! Tapahtumasi "[nimi]" on hyväksytty ja näkyy nyt kartalla.
> Näytä tapahtuma: https://kartalla.fi

### 7. Admin-sivu (`/admin`)
Suojattu `ADMIN_EMAIL` env varilla.

- Lista pending-tapahtumista (vanhin ensin)
- Per tapahtuma: kaikki tiedot + pieni karttaesikatseluu
- Hyväksy → status = approved + lähetä sähköposti
- Hylkää → status = rejected + vapaaehtoinen syy
- Filtteri: pending / approved / rejected
- Näkyy myös käyttäjän sähköposti

---

## Osa 2 — Karttatiilet (Map tiles)

### Ongelma
CartoCDN (nykyinen) on ilmainen mutta rajoitettu — ei sovellu kaupalliseen käyttöön suurilla käyttäjämäärillä.

### Ratkaisu: Maptiler
- **Ilmainen taso:** 100 000 latausta/kk (riittää alussa hyvin)
- **Maksettu:** ~10€/kk kun käyttäjämäärä kasvaa
- Rekisteröidy: https://www.maptiler.com/
- Luo API-avain
- Lisää Verceliin: `NEXT_PUBLIC_MAPTILER_KEY`

**Muutos `MapClient.tsx`:**
```tsx
// Ennen:
url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

// Jälkeen:
url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`}
```

Vaihtoehtoisesti: **Mapbox** (50 000 latausta/kk ilmaiseksi).

---

## Osa 3 — Domain

### Hanki .fi-domain
Suositellut rekisteröijät Suomessa:
- **Louhi.net** (~15€/vuosi)
- **Domainmaailma.fi** (~12€/vuosi)
- **Namecheap** (~10€/vuosi, kansainvälinen)

Rekisteröinti vaatii: nimi + osoite. Ei tarvitse yritystä.

### Yhdistä Verceliin
1. Osta domain rekisteröijältä
2. Vercel → projektisi → Settings → Domains → lisää domain
3. Vercel näyttää DNS-asetukset (yleensä kaksi A-tietuetta tai CNAME)
4. Mene rekisteröijäsi DNS-hallintaan ja lisää ne
5. Propagaatio: 5 min – 24h

### Suositeltava nimi
Esim. `kartalla.fi` tai `tapahtumat.fi` tai jokin lyhyempi.
Tarkista saatavuus ennen rekisteröintiä.

---

## Toteutusjärjestys

### Vaihe 1 — Perusta (tehdään ensin)
1. DB-migraatio `003_add_status.sql`
2. Kartan suodatus (`approved` only)
3. Auth-sivu (`/kirjaudu`)
4. Lisäyssivu manuaalinen lomake (`/lisaa`)
5. Oma tapahtumalista (`/omat`)
6. Admin-sivu (`/admin`)

### Vaihe 2 — AI-import
7. AI-välilehti lisäyssivulle
8. Template prompt UI

### Vaihe 3 — Infrastruktuuri
9. Domain hankinta + Vercel-yhdistys
10. Maptiler-siirtymä (ennen julkaisua)
11. Sähköposti-ilmoitukset (Resend)

---

## Tiedostot

| Tiedosto | Muutos |
|----------|--------|
| `supabase/migrations/003_add_status.sql` | Uusi |
| `src/app/page.tsx` | `.eq('status', 'approved')` |
| `src/app/kirjaudu/page.tsx` | Uusi |
| `src/app/lisaa/page.tsx` | Uusi |
| `src/components/AddEventForm.tsx` | Uusi |
| `src/components/AiImport.tsx` | Uusi |
| `src/app/omat/page.tsx` | Uusi |
| `src/app/admin/page.tsx` | Uusi |
| `src/app/api/admin/approve/route.ts` | Uusi |
| `src/app/api/admin/reject/route.ts` | Uusi |
| `src/lib/geocode.ts` | Uusi — Nominatim |
| `src/lib/email.ts` | Uusi — Resend |
| `src/components/MapClient.tsx` | Maptiler URL |
