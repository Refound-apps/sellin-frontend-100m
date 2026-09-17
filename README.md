# Sellin.cz Frontend

Moderní, rychlý a intuitivní frontend pro správu nabídek Sellin.cz.

## 🚀 Technologie

- **Next.js 16** - React framework s App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Moderní utility-first CSS framework
- **React 19** - Nejnovější verze React

## 📋 Předpoklady

- Node.js 20 nebo vyšší
- Backend běžící na `http://localhost:3300`

## 🛠️ Instalace a spuštění

### 1. Instalace závislostí

```bash
npm install
```

### 2. Konfigurace

Soubor `.env.local` je již vytvořen s výchozím nastavením:

```env
NEXT_PUBLIC_API_URL=http://localhost:3300
```

Pokud váš backend běží na jiné adrese, upravte tuto hodnotu.

### 3. Vývojový režim

```bash
npm run dev
```

Aplikace bude dostupná na `http://localhost:3000`

### 4. Build pro produkci

```bash
npm run build
npm run start
```

## 📁 Struktura projektu

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Domovská stránka
│   └── globals.css        # Globální styly
├── components/            # React komponenty
│   ├── OfferCard.tsx     # Karta jednotlivé nabídky
│   └── OffersList.tsx    # Seznam nabídek s paginací
├── lib/                   # Utility a pomocné funkce
│   ├── api.ts            # API komunikace
│   └── types.ts          # TypeScript typy
└── public/               # Statické soubory
```

## 🎨 Funkce

### ✅ Implementováno

- 📱 **Responzivní design** - Perfektní zobrazení na všech zařízeních
- 🖼️ **Karty nabídek** - Zobrazení obrázku, titulku a ceny
- 📄 **Nekonečné scrollování** - Načítání dalších nabídek tlačítkem
- ⚡ **Rychlé načítání** - Optimalizované obrázky s Next.js Image
- 🎯 **Moderní UI** - Čisté a intuitivní rozhraní s Tailwind CSS
- 🔄 **Chybové stavy** - Přehledné zobrazení chyb a loading stavů
- 💰 **Formátování ceny** - Správné zobrazení v českých korunách
- 📅 **Formátování data** - České formátování data vytvoření

### 🚧 Další funkce (připraveno k implementaci)

- 🔍 Vyhledávání a filtrování nabídek
- 📝 Detail nabídky s plným popisem
- ✏️ Editace nabídek
- ➕ Vytvoření nové nabídky
- 🗑️ Mazání nabídek
- 🔄 Obnovení nabídek na bazarech
- 👤 Přihlášení a autentizace
- 📊 Dashboard se statistikami

## 🔌 API Endpointy

Frontend komunikuje s následujícími API endpointy:

- `GET /api/offers?limit=20&offset=0` - Seznam nabídek
- `GET /api/offers/:id` - Detail nabídky

## 🎨 Design systém

### Barvy

- **Primary**: Blue-600 (#2563eb)
- **Success**: Green-600 (#16a34a)
- **Background**: Gray-50 - Gray-100 gradient
- **Text**: Gray-900

### Komponenty

- Zaoblené rohy (rounded-xl, rounded-lg)
- Jemné stíny (shadow-sm, shadow-xl)
- Smooth transitions (300ms)
- Hover efekty na všech interaktivních prvcích

## 🐛 Troubleshooting

### Backend není dostupný

Zkontrolujte, že backend běží:
```bash
cd ../backend
npm run dev
```

### CORS chyby

Ujistěte se, že backend má správně nakonfigurovaný CORS v `server.ts`.

### Obrázky se nenačítají

Zkontrolujte, že `preview_image` v databázi obsahuje platnou URL.

## 📝 Další kroky

1. **Spusťte backend**: `cd ../backend && npm run dev`
2. **Spusťte frontend**: `npm run dev`
3. **Otevřete prohlížeč**: `http://localhost:3000`

Enjoy! 🎉
