export interface OfferCategoryItem {
  id: number;
  section: string;
  name: string;
  bazos_category: string;
  sbazar_category: string;
  facebook_category: string;
  bazos_sk_category: string;
}

export const DEFAULT_OFFER_CATEGORIES: OfferCategoryItem[] = [
  {
    "id": 1,
    "section": "Hudba",
    "name": "Světelná technika",
    "bazos_category": "Hudba;Světelná technika",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Ostatní",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Světelná technika"
  },
  {
    "id": 2,
    "section": "Ostatní",
    "name": "Sklo, keramika",
    "bazos_category": "Ostatní;Sklo, keramika",
    "sbazar_category": "Starožitnosti, hobby a umění;Keramika, sklo a porceln",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatní;Sklo, keramika"
  },
  {
    "id": 3,
    "section": "Sport",
    "name": "Běžkování",
    "bazos_category": "Sport;Běžkování",
    "sbazar_category": "Sport;Zimn sporty;B~ky",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Běžkování"
  },
  {
    "id": 4,
    "section": "PC",
    "name": "Spotřební materiál",
    "bazos_category": "PC;Spotřební materiál",
    "sbazar_category": "Elektro a potae;Potae;Ostatní",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Spotřební materiál"
  },
  {
    "id": 5,
    "section": "PC",
    "name": "Záložní zdroje",
    "bazos_category": "PC;Záložní zdroje",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Záložní zdroje"
  },
  {
    "id": 6,
    "section": "Motorky",
    "name": "Skútry",
    "bazos_category": "Motorky;Skútry",
    "sbazar_category": "Auto-moto;Motocykly;Sktry",
    "facebook_category": "Konky;Sport a outdoorov aktivity",
    "bazos_sk_category": "Motorky;Skútry"
  },
  {
    "id": 7,
    "section": "Ostatní",
    "name": "Mince, bankovky",
    "bazos_category": "Ostatní;Mince, bankovky",
    "sbazar_category": "Starožitnosti, hobby a umění;Numismatika a filatelie",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatní;Mince, bankovky"
  },
  {
    "id": 8,
    "section": "Dům a zahrada",
    "name": "Nářadí",
    "bazos_category": "Dům a zahrada;Nářadí",
    "sbazar_category": "Dom, byt a zahrada;Stavebnictví a nYad",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Nářadí"
  },
  {
    "id": 9,
    "section": "Nábytek",
    "name": "Skříně",
    "bazos_category": "Nábytek;Skříně",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;SkYn",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Skříně"
  },
  {
    "id": 10,
    "section": "Elektro",
    "name": "Ostatní drobné",
    "bazos_category": "Elektro;Ostatní drobné",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Ostatní domc spotřebiče",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Ostatní drobné"
  },
  {
    "id": 11,
    "section": "Nábytek",
    "name": "Lampy, osvětlení",
    "bazos_category": "Nábytek;Lampy, osvětlení",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Osvětlení",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Lampy, osvětlení"
  },
  {
    "id": 12,
    "section": "Foto",
    "name": "Datové kabely",
    "bazos_category": "Foto;Datové kabely",
    "sbazar_category": "Elektro a potae;Foto bazar;PYsluaenstv k fotoapartom",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Datové kabely"
  },
  {
    "id": 13,
    "section": "Foto",
    "name": "Zrcadlovky",
    "bazos_category": "Foto;Zrcadlovky",
    "sbazar_category": "Elektro a potae;Foto bazar;Zrcadlovky",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Zrcadlovky"
  },
  {
    "id": 14,
    "section": "Motorky",
    "name": "Chopper",
    "bazos_category": "Motorky;Chopper",
    "sbazar_category": "Auto-moto;Motocykly;",
    "facebook_category": "Vozidla;Motocykl",
    "bazos_sk_category": "Motorky;Chopper"
  },
  {
    "id": 15,
    "section": "Sport",
    "name": "Kempink",
    "bazos_category": "Sport;Kempink",
    "sbazar_category": "Sport;Letn sporty;Ostatní sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Kempink"
  },
  {
    "id": 16,
    "section": "Dům a zahrada",
    "name": "Klimatizace",
    "bazos_category": "Dům a zahrada;Klimatizace",
    "sbazar_category": "Dom, byt a zahrada;Vytpn, ohřev, chlazen;Klimatizace, tepeln ččerpadla",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Klimatizace"
  },
  {
    "id": 17,
    "section": "Nábytek",
    "name": "Koberce a podlah. krytina",
    "bazos_category": "Nábytek;Koberce a podlah. krytina",
    "sbazar_category": "Dom, byt a zahrada;Podlahy a koberce",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Koberce a podlah. krytina"
  },
  {
    "id": 18,
    "section": "Dům a zahrada",
    "name": "Radiátory",
    "bazos_category": "Dům a zahrada;Radiátory",
    "sbazar_category": "Dom, byt a zahrada;Vytpn, ohřev, chlazen;Kamna, kotle, krby, topen",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Radiátory"
  },
  {
    "id": 19,
    "section": "Sport",
    "name": "Vodní sporty, potápění",
    "bazos_category": "Sport;Vodní sporty, potápění",
    "sbazar_category": "Sport;Letn sporty;Ostatní sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Vodní sporty, potápění"
  },
  {
    "id": 20,
    "section": "Nábytek",
    "name": "Doplňky",
    "bazos_category": "Nábytek;Doplňky",
    "sbazar_category": "Dom, byt a zahrada;Bytov doplňky",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Doplňky"
  },
  {
    "id": 21,
    "section": "Reality",
    "name": "Hotely, penziony, restaurace",
    "bazos_category": "Reality;Hotely, penziony, restaurace",
    "sbazar_category": "Nemovitosti;Restaurace, hotely a penziony",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Hotely, penziony, restaurace"
  },
  {
    "id": 22,
    "section": "Mobily",
    "name": "Stolní telefony",
    "bazos_category": "Mobily;Stolní telefony",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobily ostatn",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Stolní telefony"
  },
  {
    "id": 23,
    "section": "Motorky",
    "name": "Enduro",
    "bazos_category": "Motorky;Enduro",
    "sbazar_category": "Auto-moto;Motocykly;Moto - ostatn",
    "facebook_category": "Konky;Sport a outdoorov aktivity",
    "bazos_sk_category": "Motocykle;Enduro"
  },
  {
    "id": 24,
    "section": "Mobily",
    "name": "Datové kabely",
    "bazos_category": "Mobily;Datové kabely",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobil pYsluaenstv",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Datové kabely"
  },
  {
    "id": 25,
    "section": "Sport",
    "name": "Míčové hry",
    "bazos_category": "Sport;Míčové hry",
    "sbazar_category": "Sport;Letn sporty;Ostatní sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Míčové hry"
  },
  {
    "id": 26,
    "section": "Dům a zahrada",
    "name": "Rostliny",
    "bazos_category": "Dům a zahrada;Rostliny",
    "sbazar_category": "Dom, byt a zahrada;Rostliny, sazenice a semena",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Rostliny"
  },
  {
    "id": 27,
    "section": "Auto",
    "name": "BMW",
    "bazos_category": "Auto;BMW",
    "sbazar_category": "Auto-moto;Osobní auta;BMW",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;BMW"
  },
  {
    "id": 28,
    "section": "Dům a zahrada",
    "name": "Malotraktory, kultivátory",
    "bazos_category": "Dům a zahrada;Malotraktory, kultivátory",
    "sbazar_category": "Dom, byt a zahrada;Zemědělská a lesn technika",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Malotraktory, kultivátory"
  },
  {
    "id": 29,
    "section": "Foto",
    "name": "Ostatní",
    "bazos_category": "Foto;Ostatní",
    "sbazar_category": "Elektro a potae;Foto bazar;Ostatní foto bazar",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Ostatní"
  },
  {
    "id": 30,
    "section": "Ostatní",
    "name": "Umělecké předměty",
    "bazos_category": "Ostatní;Umělecké předměty",
    "sbazar_category": "Starožitnosti, hobby a umění;Umn a umleck předměty",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatní;Umělecké předměty"
  },
  {
    "id": 31,
    "section": "Hudba",
    "name": "Hudebníci a skupiny",
    "bazos_category": "Hudba;Hudebníci a skupiny",
    "sbazar_category": "Hudba, knihy, hry a zbava;Kapely a muzikanti",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Hudebníci a skupiny"
  },
  {
    "id": 32,
    "section": "Elektro",
    "name": "Vysavače",
    "bazos_category": "Elektro;Vysavače",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Vysavae",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Vysavače"
  },
  {
    "id": 33,
    "section": "Hudba",
    "name": "Ostatní nástroje",
    "bazos_category": "Hudba;Ostatní nástroje",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Hudební nstroje",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Ostatní nástroje"
  },
  {
    "id": 34,
    "section": "Auto",
    "name": "Náhradní díly",
    "bazos_category": "Auto;Náhradní díly",
    "sbazar_category": "Auto-moto;Nhradn dly, kola a pYsluaenstv;Nhradn dly a pYsluaenstv",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Auto;Nhradn diely"
  },
  {
    "id": 35,
    "section": "PC",
    "name": "Software",
    "bazos_category": "PC;Software",
    "sbazar_category": "Elektro a potae;Potae;Software",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Software"
  },
  {
    "id": 36,
    "section": "Mobily",
    "name": "Paměťové karty",
    "bazos_category": "Mobily;Paměťové karty",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobil pYsluaenstv",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Paměťové karty"
  },
  {
    "id": 37,
    "section": "Auto",
    "name": "Autobusy",
    "bazos_category": "Auto;Autobusy",
    "sbazar_category": "Auto-moto;Ostatní auta",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Autobusy"
  },
  {
    "id": 38,
    "section": "Sport",
    "name": "Myslivost, lov",
    "bazos_category": "Sport;Myslivost, lov",
    "sbazar_category": "Sport;Letn sporty;Ostatní sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Myslivost, lov"
  },
  {
    "id": 39,
    "section": "PC",
    "name": "LCD monitory",
    "bazos_category": "PC;LCD monitory",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;LCD monitory"
  },
  {
    "id": 40,
    "section": "Elektro",
    "name": "Kávovary",
    "bazos_category": "Elektro;Kávovary",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Kvovary a pYekapvae",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Kávovary"
  },
  {
    "id": 41,
    "section": "Mobily",
    "name": "LG",
    "bazos_category": "Mobily;LG",
    "sbazar_category": "Elektro a potae;Mobil bazar;LG",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;LG"
  },
  {
    "id": 42,
    "section": "Ostatní",
    "name": "Starožitnosti",
    "bazos_category": "Ostatní;Starožitnosti",
    "sbazar_category": "Starožitnosti, hobby a umění;Ostatní staro~itnosti",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatní;Starožitnosti"
  },
  {
    "id": 43,
    "section": "Dům a zahrada",
    "name": "Vysavače, foukače",
    "bazos_category": "Dům a zahrada;Vysavače, foukače",
    "sbazar_category": "Dom, byt a zahrada;Stavebnictví a nYad",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Vysavače, foukače"
  },
  {
    "id": 44,
    "section": "Reality",
    "name": "Sklady",
    "bazos_category": "Reality;Sklady",
    "sbazar_category": "Nemovitosti;Haly",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Sklady"
  },
  {
    "id": 45,
    "section": "Auto",
    "name": "Pneumatiky, kola",
    "bazos_category": "Auto;Pneumatiky, kola",
    "sbazar_category": "Auto-moto;Nhradn dly, kola a pYsluaenstv;Kola a disky",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Auto;Pneumatiky, kolesá"
  },
  {
    "id": 46,
    "section": "PC",
    "name": "Kopírovací stroje",
    "bazos_category": "PC;Kopírovací stroje",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Kopírovací stroje"
  },
  {
    "id": 47,
    "section": "Nábytek",
    "name": "Zahradní nábytek",
    "bazos_category": "Nábytek;Zahradní nábytek",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Zahradn nbytek",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Zahradní nábytek"
  },
  {
    "id": 48,
    "section": "Auto",
    "name": "Renault",
    "bazos_category": "Auto;Renault",
    "sbazar_category": "Auto-moto;Osobní auta;Renault",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Renault"
  },
  {
    "id": 49,
    "section": "Motorky",
    "name": "Skútry sněžné",
    "bazos_category": "Motorky;Skútry sněžné",
    "sbazar_category": "Auto-moto;Motocykly;Sktry",
    "facebook_category": "Vozidla;Motocykl",
    "bazos_sk_category": "Motorky;Skútry sněžné"
  },
  {
    "id": 50,
    "section": "PC",
    "name": "PC, Počítače",
    "bazos_category": "PC;PC, Počítače",
    "sbazar_category": "Elektro a potae;Potae;PC Sestavy",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;PC, Počítače"
  },
  {
    "id": 51,
    "section": "Dům a zahrada",
    "name": "Míchačky",
    "bazos_category": "Dům a zahrada;Míchačky",
    "sbazar_category": "Dom, byt a zahrada;Stavebnictví a nYad",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Míchačky"
  },
  {
    "id": 52,
    "section": "Foto",
    "name": "Drony",
    "bazos_category": "Foto;Drony",
    "sbazar_category": "Elektro a potae;Foto bazar;Ostatní foto bazar",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Drony"
  },
  {
    "id": 53,
    "section": "Mobily",
    "name": "Ostatní",
    "bazos_category": "Mobily;Ostatní",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobily ostatn",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Ostatní"
  },
  {
    "id": 54,
    "section": "Hudba",
    "name": "Zvuková technika",
    "bazos_category": "Hudba;Zvuková technika",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Zvukov aparatura",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Zvuková technika"
  },
  {
    "id": 55,
    "section": "Auto",
    "name": "Mercedes-Benz",
    "bazos_category": "Auto;Mercedes-Benz",
    "sbazar_category": "Auto-moto;Osobní auta;Mercedes-Benz",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Mercedes-Benz"
  },
  {
    "id": 56,
    "section": "Sport",
    "name": "Golf",
    "bazos_category": "Sport;Golf",
    "sbazar_category": "Sport;Letn sporty;Ostatní sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Golf"
  },
  {
    "id": 57,
    "section": "Motorky",
    "name": "Oblečení, obuv, helmy",
    "bazos_category": "Motorky;Oblečení, obuv, helmy",
    "sbazar_category": "Auto-moto;Motocykly;Moto pYsluaenstv",
    "facebook_category": "Vozidla;Motocykl",
    "bazos_sk_category": "Motorky;Oblečení, obuv, helmy"
  },
  {
    "id": 58,
    "section": "Elektro",
    "name": "Fény, kulmy",
    "bazos_category": "Elektro;Fény, kulmy",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Ostatní domc spotřebiče",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Fény, kulmy"
  },
  {
    "id": 59,
    "section": "Foto",
    "name": "Baterie",
    "bazos_category": "Foto;Baterie",
    "sbazar_category": "Elektro a potae;Foto bazar;PYsluaenstv k fotoapartom",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Baterie"
  },
  {
    "id": 60,
    "section": "PC",
    "name": "Chladiče",
    "bazos_category": "PC;Chladiče",
    "sbazar_category": "Elektro a potae;Potae;Ostatní",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Chladiče"
  },
  {
    "id": 61,
    "section": "Elektro",
    "name": "Žehličky",
    "bazos_category": "Elektro;Žehličky",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;}ehliky",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Žehličky"
  },
  {
    "id": 62,
    "section": "Dům a zahrada",
    "name": "Bazény",
    "bazos_category": "Dům a zahrada;Bazény",
    "sbazar_category": "Dom, byt a zahrada;Bazny, sauny, vYivky, solria",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Bazény"
  },
  {
    "id": 63,
    "section": "Nábytek",
    "name": "Stoly",
    "bazos_category": "Nábytek;Stoly",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Jdeln stoly a židle",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Stoly"
  },
  {
    "id": 64,
    "section": "Elektro",
    "name": "Hifi systémy, rádia",
    "bazos_category": "Elektro;Hifi systémy, rádia",
    "sbazar_category": "Elektro a potae;Audio, video;Hifi",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Hifi systémy, rádia"
  },
  {
    "id": 65,
    "section": "Dům a zahrada",
    "name": "Zahradní technika",
    "bazos_category": "Dům a zahrada;Zahradní technika",
    "sbazar_category": "Dom, byt a zahrada;Zahrada",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Zahradní technika"
  },
  {
    "id": 66,
    "section": "Reality",
    "name": "Kanceláře",
    "bazos_category": "Reality;Kanceláře",
    "sbazar_category": "Nemovitosti;KancelYsk prostory",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Kanceláře"
  },
  {
    "id": 67,
    "section": "Mobily",
    "name": "Ostatní značky",
    "bazos_category": "Mobily;Ostatní značky",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobily ostatn",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Ostatní značky"
  },
  {
    "id": 68,
    "section": "Nábytek",
    "name": "Ostatní nábytek",
    "bazos_category": "Nábytek;Ostatní nábytek",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Ostatní nbytek a doplňky",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Ostatní nábytek"
  },
  {
    "id": 69,
    "section": "Foto",
    "name": "Objektivy",
    "bazos_category": "Foto;Objektivy",
    "sbazar_category": "Elektro a potae;Foto bazar;Objektivy",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Objektivy"
  },
  {
    "id": 70,
    "section": "Dům a zahrada",
    "name": "Ostatní",
    "bazos_category": "Dům a zahrada;Ostatní",
    "sbazar_category": "Dom, byt a zahrada;Zahrada",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Ostatní"
  },
  {
    "id": 71,
    "section": "Mobily",
    "name": "Baterie",
    "bazos_category": "Mobily;Baterie",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobil pYsluaenstv",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Baterie"
  },
  {
    "id": 72,
    "section": "Nábytek",
    "name": "Knihovny",
    "bazos_category": "Nábytek;Knihovny",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Komody a regly",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Knihovny"
  },
  {
    "id": 73,
    "section": "Sport",
    "name": "Lyžování",
    "bazos_category": "Sport;Lyžování",
    "sbazar_category": "Sport;Zimn sporty;Lyže",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Lyžování"
  },
  {
    "id": 74,
    "section": "Reality",
    "name": "Zahrady",
    "bazos_category": "Reality;Zahrady",
    "sbazar_category": "Nemovitosti;Prodej, pronjem zahrady",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Zahrady"
  },
  {
    "id": 75,
    "section": "Reality",
    "name": "Obchodní prostory",
    "bazos_category": "Reality;Obchodní prostory",
    "sbazar_category": "Nemovitosti;Ostatní nemovitosti",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Obchodní prostory"
  },
  {
    "id": 76,
    "section": "Nábytek",
    "name": "Matrace",
    "bazos_category": "Nábytek;Matrace",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Matrace a rošty",
    "facebook_category": "Dom a zahrada;Potřeby pro domcnost",
    "bazos_sk_category": "Nábytek;Matrace"
  },
  {
    "id": 77,
    "section": "Auto",
    "name": "Dodávky",
    "bazos_category": "Auto;Dodávky",
    "sbazar_category": "Auto-moto;Ostatní auta",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Dodávky"
  },
  {
    "id": 78,
    "section": "Elektro",
    "name": "Ostatní audio video",
    "bazos_category": "Elektro;Ostatní audio video",
    "sbazar_category": "Elektro a potae;Audio, video;Ostatní",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Ostatní audio video"
  },
  {
    "id": 79,
    "section": "Auto",
    "name": "Nissan",
    "bazos_category": "Auto;Nissan",
    "sbazar_category": "Auto-moto;Osobní auta;Nissan",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Nissan"
  },
  {
    "id": 80,
    "section": "Elektro",
    "name": "Sluchátka",
    "bazos_category": "Elektro;Sluchátka",
    "sbazar_category": "Elektro a potae;Audio, video;Sluchtka a mikrofony",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Sluchátka"
  },
  {
    "id": 81,
    "section": "Ostatní",
    "name": "Sběratelství",
    "bazos_category": "Ostatní;Sběratelství",
    "sbazar_category": "Starožitnosti, hobby a umění;Ostatní staro~itnosti",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatní;Sběratelství"
  },
  {
    "id": 82,
    "section": "PC",
    "name": "Wireless, WiFi",
    "bazos_category": "PC;Wireless, WiFi",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Wireless, WiFi"
  },
  {
    "id": 83,
    "section": "Auto",
    "name": "Škoda",
    "bazos_category": "Auto;Škoda",
    "sbazar_category": "Auto-moto;Nhradn dly, kola a pYsluaenstv",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Auto;Škoda"
  },
  {
    "id": 84,
    "section": "Motorky",
    "name": "Silniční motocykly",
    "bazos_category": "Motorky;Silniční motocykly",
    "sbazar_category": "Auto-moto;Motocykly;",
    "facebook_category": "Vozidla;Motocykl",
    "bazos_sk_category": "Motorky;Silniční motocykly"
  },
  {
    "id": 85,
    "section": "Elektro",
    "name": "Zvlhčovače vzduchu",
    "bazos_category": "Elektro;Zvlhčovače vzduchu",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Zvlhovae a istiky vzduchu",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Zvlhčovače vzduchu"
  },
  {
    "id": 86,
    "section": "Auto",
    "name": "Ford",
    "bazos_category": "Auto;Ford",
    "sbazar_category": "Auto-moto;Osobní auta;Ford",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Ford"
  },
  {
    "id": 87,
    "section": "Elektro",
    "name": "Sušičky",
    "bazos_category": "Elektro;Sušičky",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Sušičky",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Sušičky"
  },
  {
    "id": 88,
    "section": "Auto",
    "name": "Mazda",
    "bazos_category": "Auto;Mazda",
    "sbazar_category": "Auto-moto;Osobní auta;Mazda",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Mazda"
  },
  {
    "id": 89,
    "section": "Auto",
    "name": "Honda",
    "bazos_category": "Auto;Honda",
    "sbazar_category": "Auto-moto;Osobní auta;Honda",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Honda"
  },
  {
    "id": 90,
    "section": "Sport",
    "name": "Horská kola",
    "bazos_category": "Sport;Horská kola",
    "sbazar_category": "Sport;Letn sporty;Kola",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Horská kola"
  },
  {
    "id": 91,
    "section": "Mobily",
    "name": "Xiaomi",
    "bazos_category": "Mobily;Xiaomi",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobily ostatn",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Xiaomi"
  },
  {
    "id": 92,
    "section": "Elektro",
    "name": "Mrazáky",
    "bazos_category": "Elektro;Mrazáky",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Mrazky",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Mrazáky"
  },
  {
    "id": 93,
    "section": "Nábytek",
    "name": "Postele",
    "bazos_category": "Nábytek;Postele",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Postele",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Postele"
  },
  {
    "id": 94,
    "section": "Nábytek",
    "name": "Obývací stěny",
    "bazos_category": "Nábytek;Obývací stěny",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Obvac stny",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Obývací stěny"
  },
  {
    "id": 95,
    "section": "Hudba",
    "name": "Strunné nástroje",
    "bazos_category": "Hudba;Strunné nástroje",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Hudební nstroje",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Strunné nástroje"
  },
  {
    "id": 96,
    "section": "Mobily",
    "name": "Samsung",
    "bazos_category": "Mobily;Samsung",
    "sbazar_category": "Elektro a potae;Mobil bazar;Samsung",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Samsung"
  },
  {
    "id": 97,
    "section": "PC",
    "name": "Herní zařízení",
    "bazos_category": "PC;Herní zařízení",
    "sbazar_category": "Elektro a potae;Potae;Hern konzole",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Herní zařízení"
  },
  {
    "id": 98,
    "section": "Auto",
    "name": "Citroën",
    "bazos_category": "Auto;Citroën",
    "sbazar_category": "Auto-moto;Osobní auta;Citron",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Citroën"
  },
  {
    "id": 99,
    "section": "Elektro",
    "name": "Projektory",
    "bazos_category": "Elektro;Projektory",
    "sbazar_category": "Elektro a potae;Audio, video;Projektory",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Projektory"
  },
  {
    "id": 100,
    "section": "Nábytek",
    "name": "Křesla a gauče",
    "bazos_category": "Nábytek;Křesla a gauče",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Sedačky a sedací soupravy",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Křesla a gauče"
  },
  {
    "id": 101,
    "section": "Nábytek",
    "name": "Ložnice",
    "bazos_category": "Nábytek;Ložnice",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Ložnice",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Ložnice"
  },
  {
    "id": 102,
    "section": "Dům a zahrada",
    "name": "Pily",
    "bazos_category": "Dům a zahrada;Pily",
    "sbazar_category": "Dom, byt a zahrada;Stavebnictví a nYad",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Pily"
  },
  {
    "id": 103,
    "section": "Auto",
    "name": "Ostatní značky",
    "bazos_category": "Auto;Ostatní značky",
    "sbazar_category": "Auto-moto;Ostatní auta",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Ostatní značky"
  },
  {
    "id": 104,
    "section": "Sport",
    "name": "Silniční kola",
    "bazos_category": "Sport;Silniční kola",
    "sbazar_category": "Sport;Letn sporty;Kola",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Silniční kola"
  },
  {
    "id": 105,
    "section": "Dům a zahrada",
    "name": "Zahradní grily",
    "bazos_category": "Dům a zahrada;Zahradní grily",
    "sbazar_category": "Dom, byt a zahrada;Zahrada",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Zahradní grily"
  },
  {
    "id": 106,
    "section": "Dům a zahrada",
    "name": "Sněžná technika",
    "bazos_category": "Dům a zahrada;Sněžná technika",
    "sbazar_category": "Dom, byt a zahrada;Zemědělská a lesn technika",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Sněžná technika"
  },
  {
    "id": 107,
    "section": "Auto",
    "name": "Nákladní auta",
    "bazos_category": "Auto;Nákladní auta",
    "sbazar_category": "Auto-moto;Ostatní auta",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Nákladní auta"
  },
  {
    "id": 108,
    "section": "PC",
    "name": "Zvukové karty",
    "bazos_category": "PC;Zvukové karty",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Zvukové karty"
  },
  {
    "id": 109,
    "section": "Elektro",
    "name": "Ruční šlehače, mixéry",
    "bazos_category": "Elektro;Ruční šlehače, mixéry",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Kuchyňské roboty",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Ruční šlehače, mixéry"
  },
  {
    "id": 110,
    "section": "Motorky",
    "name": "Ostatní",
    "bazos_category": "Motorky;Ostatní",
    "sbazar_category": "Auto-moto;Motocykly;Ostatní motocykly",
    "facebook_category": "Konky;Sport a outdoorov aktivity",
    "bazos_sk_category": "Motorky;Ostatní"
  },
  {
    "id": 111,
    "section": "Hudba",
    "name": "DVD, CD, MC, LP",
    "bazos_category": "Hudba;DVD, CD, MC, LP",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudba a CD",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;DVD, CD, MC, LP"
  },
  {
    "id": 112,
    "section": "Nábytek",
    "name": "Sedací soupravy",
    "bazos_category": "Nábytek;Sedací soupravy",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Sedačky a sedací soupravy",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Sedací soupravy"
  },
  {
    "id": 113,
    "section": "PC",
    "name": "Skříně, zdroje",
    "bazos_category": "PC;Skříně, zdroje",
    "sbazar_category": "Elektro a potae;Potae;PC Sestavy",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Skříně, zdroje"
  },
  {
    "id": 114,
    "section": "PC",
    "name": "Herní konzole",
    "bazos_category": "PC;Herní konzole",
    "sbazar_category": "Elektro a potae;Potae;Hern konzole",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Herní konzole"
  },
  {
    "id": 115,
    "section": "Ostatní",
    "name": "Potraviny",
    "bazos_category": "Ostatní;Potraviny",
    "sbazar_category": "Starožitnosti, hobby a umění;Ostatní staro~itnosti",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatní;Potraviny"
  },
  {
    "id": 116,
    "section": "Mobily",
    "name": "Faxy",
    "bazos_category": "Mobily;Faxy",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobily ostatn",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Faxy"
  },
  {
    "id": 117,
    "section": "Auto",
    "name": "Audi",
    "bazos_category": "Auto;Audi",
    "sbazar_category": "Auto-moto;Osobní auta;Audi",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Audi"
  },
  {
    "id": 118,
    "section": "Foto",
    "name": "Videokamery",
    "bazos_category": "Foto;Videokamery",
    "sbazar_category": "Elektro a potae;Audio, video;Videokamery",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Videokamery"
  },
  {
    "id": 119,
    "section": "Auto",
    "name": "Dacia",
    "bazos_category": "Auto;Dacia",
    "sbazar_category": "Auto-moto;Osobní auta;Dacia",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Dacia"
  },
  {
    "id": 120,
    "section": "Mobily",
    "name": "Sony",
    "bazos_category": "Mobily;Sony",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobily ostatn",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Sony"
  },
  {
    "id": 121,
    "section": "Hudba",
    "name": "Smyčcové nástroje",
    "bazos_category": "Hudba;Smyčcové nástroje",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Hudební nstroje",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Smyčcové nástroje"
  },
  {
    "id": 122,
    "section": "Dům a zahrada",
    "name": "Dveře, vrata",
    "bazos_category": "Dům a zahrada;Dveře, vrata",
    "sbazar_category": "Dom, byt a zahrada;Stavebnictví a nYad",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Dveře, vrata"
  },
  {
    "id": 123,
    "section": "Auto",
    "name": "Veteráni",
    "bazos_category": "Auto;Veteráni",
    "sbazar_category": "Auto-moto;Veterni",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Veteráni"
  },
  {
    "id": 124,
    "section": "Elektro",
    "name": "Pračky",
    "bazos_category": "Elektro;Pračky",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Praky",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Pračky"
  },
  {
    "id": 125,
    "section": "PC",
    "name": "DVD, Blu-ray mechaniky",
    "bazos_category": "PC;DVD, Blu-ray mechaniky",
    "sbazar_category": "Elektro a potae;Potae",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;DVD, Blu-ray mechaniky"
  },
  {
    "id": 126,
    "section": "Hudba",
    "name": "Noty, texty",
    "bazos_category": "Hudba;Noty, texty",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudba a CD",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Noty, texty"
  },
  {
    "id": 127,
    "section": "PC",
    "name": "Klávesnice, myši",
    "bazos_category": "PC;Klávesnice, myši",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Klávesnice, myši"
  },
  {
    "id": 128,
    "section": "PC",
    "name": "Notebooky",
    "bazos_category": "PC;Notebooky",
    "sbazar_category": "Elektro a potae;Potae;Notebooky",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Notebooky"
  },
  {
    "id": 129,
    "section": "Hudba",
    "name": "Klávesové nástroje",
    "bazos_category": "Hudba;Klávesové nástroje",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Hudební nstroje",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Klávesové nástroje"
  },
  {
    "id": 130,
    "section": "Auto",
    "name": "Karavany, vozíky",
    "bazos_category": "Auto;Karavany, vozíky",
    "sbazar_category": "Auto-moto;Ostatní auta",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Auto;Karavany, vozky"
  },
  {
    "id": 131,
    "section": "Elektro",
    "name": "Digestoře",
    "bazos_category": "Elektro;Digestoře",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Digestoře",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Digestoře"
  },
  {
    "id": 132,
    "section": "Reality",
    "name": "Domy",
    "bazos_category": "Reality;Domy",
    "sbazar_category": "Nemovitosti;Prodej, pronjem domů",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Domy"
  },
  {
    "id": 133,
    "section": "Hudba",
    "name": "Bicí nástroje",
    "bazos_category": "Hudba;Bicí nástroje",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Hudební nstroje",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Bicí nástroje"
  },
  {
    "id": 134,
    "section": "Reality",
    "name": "Chalupy, Chaty",
    "bazos_category": "Reality;Chalupy, Chaty",
    "sbazar_category": "Nemovitosti;Chaty a chalupy",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Chalupy, Chaty"
  },
  {
    "id": 135,
    "section": "Auto",
    "name": "Hyundai",
    "bazos_category": "Auto;Hyundai",
    "sbazar_category": "Auto-moto;Osobní auta;Hyundai",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Hyundai"
  },
  {
    "id": 136,
    "section": "Mobily",
    "name": "HTC",
    "bazos_category": "Mobily;HTC",
    "sbazar_category": "Elektro a potae;Mobil bazar;HTC",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;HTC"
  },
  {
    "id": 137,
    "section": "Nábytek",
    "name": "Jídelní kouty",
    "bazos_category": "Nábytek;Jídelní kouty",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Jdeln stoly a židle",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Jídelní kouty"
  },
  {
    "id": 138,
    "section": "Sport",
    "name": "Snowboarding",
    "bazos_category": "Sport;Snowboarding",
    "sbazar_category": "Sport;Zimn sporty;Snowboardy",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Snowboarding"
  },
  {
    "id": 139,
    "section": "PC",
    "name": "Tablety, E-čtečky",
    "bazos_category": "PC;Tablety, E-čtečky",
    "sbazar_category": "Elektro a potae;Tabíláety a teky knih",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Tablety, E-čtečky"
  },
  {
    "id": 140,
    "section": "Auto",
    "name": "Náhradní díly užitkové",
    "bazos_category": "Auto;Náhradní díly užitkové",
    "sbazar_category": "Auto-moto;Nhradn dly, kola a pYsluaenstv;Nhradn dly a pYsluaenstv",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Auto;Náhradní díly užitkové"
  },
  {
    "id": 141,
    "section": "Elektro",
    "name": "Ledničky",
    "bazos_category": "Elektro;Ledničky",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Ledničky",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Ledničky"
  },
  {
    "id": 142,
    "section": "Dům a zahrada",
    "name": "Čerpadla",
    "bazos_category": "Dům a zahrada;Čerpadla",
    "sbazar_category": "Dom, byt a zahrada;Zahrada",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Čerpadla"
  },
  {
    "id": 143,
    "section": "Auto",
    "name": "Volvo",
    "bazos_category": "Auto;Volvo",
    "sbazar_category": "Auto-moto;Osobní auta;Volvo",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Volvo"
  },
  {
    "id": 144,
    "section": "Motorky",
    "name": "Čtyřkolky",
    "bazos_category": "Motorky;Čtyřkolky",
    "sbazar_category": "Auto-moto;tyřkolky",
    "facebook_category": "Konky;Sport a outdoorov aktivity",
    "bazos_sk_category": "Motocykle;`tvorkolky"
  },
  {
    "id": 145,
    "section": "Auto",
    "name": "Volkswagen",
    "bazos_category": "Auto;Volkswagen",
    "sbazar_category": "Auto-moto;Osobní auta;Volkswagen",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Volkswagen"
  },
  {
    "id": 146,
    "section": "Mobily",
    "name": "Chytré hodinky",
    "bazos_category": "Mobily;Chytré hodinky",
    "sbazar_category": "Elektro a potae;Mobil bazar;Chytr hodinky",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Chytré hodinky"
  },
  {
    "id": 147,
    "section": "PC",
    "name": "MP3 přehrávače",
    "bazos_category": "PC;MP3 přehrávače",
    "sbazar_category": "Elektro a potae;Audio, video;MP3 PYehrvae",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;MP3 přehrávače"
  },
  {
    "id": 148,
    "section": "Mobily",
    "name": "Motorola, Lenovo",
    "bazos_category": "Mobily;Motorola, Lenovo",
    "sbazar_category": "Elektro a potae;Mobil bazar;Motorola",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Motorola, Lenovo"
  },
  {
    "id": 149,
    "section": "Dům a zahrada",
    "name": "Stavební materiál",
    "bazos_category": "Dům a zahrada;Stavební materiál",
    "sbazar_category": "Dom, byt a zahrada;Stavebnictví a nYad",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Stavební materiál"
  },
  {
    "id": 150,
    "section": "Mobily",
    "name": "Huawei, Honor",
    "bazos_category": "Mobily;Huawei, Honor",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobily ostatn",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Huawei, Honor"
  },
  {
    "id": 151,
    "section": "PC",
    "name": "Hry",
    "bazos_category": "PC;Hry",
    "sbazar_category": "Elektro a potae;Potae;Hern konzole",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Hry"
  },
  {
    "id": 152,
    "section": "Auto",
    "name": "Havarovaná",
    "bazos_category": "Auto;Havarovaná",
    "sbazar_category": "Auto-moto;Bouraná auta",
    "facebook_category": "Vozidla;Jin",
    "bazos_sk_category": "Auto;Havarovaná"
  },
  {
    "id": 153,
    "section": "Sport",
    "name": "Rybářství",
    "bazos_category": "Sport;Rybářství",
    "sbazar_category": "Sport;RybYsk potYeby",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Rybářství"
  },
  {
    "id": 154,
    "section": "Reality",
    "name": "Garáže",
    "bazos_category": "Reality;Garáže",
    "sbazar_category": "Nemovitosti;Prodej, pronjem gar~",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Garáže"
  },
  {
    "id": 155,
    "section": "PC",
    "name": "Procesory",
    "bazos_category": "PC;Procesory",
    "sbazar_category": "Elektro a potae;Potae;PC Sestavy",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Procesory"
  },
  {
    "id": 156,
    "section": "Sport",
    "name": "Ostatní zimní",
    "bazos_category": "Sport;Ostatní zimní",
    "sbazar_category": "Sport;Zimn sporty;Lyžařské pYsluaenstv",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Ostatní zimní"
  },
  {
    "id": 157,
    "section": "Mobily",
    "name": "Kryty",
    "bazos_category": "Mobily;Kryty",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobil pYsluaenstv",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Kryty"
  },
  {
    "id": 158,
    "section": "Ostatní",
    "name": "Známky, pohledy",
    "bazos_category": "Ostatní;Známky, pohledy",
    "sbazar_category": "Starožitnosti, hobby a umění;Fotografie, plakty a pohlednice",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatní;Známky, pohledy"
  },
  {
    "id": 159,
    "section": "Mobily",
    "name": "Headsety",
    "bazos_category": "Mobily;Headsety",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobil pYsluaenstv",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Headsety"
  },
  {
    "id": 160,
    "section": "Ostatní",
    "name": "Modelářství",
    "bazos_category": "Ostatní;Modelářství",
    "sbazar_category": "Starožitnosti, hobby a umění;Hraky a modely",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatní;Modelářství"
  },
  {
    "id": 161,
    "section": "Sport",
    "name": "Fitness, jogging",
    "bazos_category": "Sport;Fitness, jogging",
    "sbazar_category": "Sport;Sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Fitness, jogging"
  },
  {
    "id": 162,
    "section": "Dům a zahrada",
    "name": "Sekačky",
    "bazos_category": "Dům a zahrada;Sekačky",
    "sbazar_category": "Dom, byt a zahrada;Zahrada",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Sekačky"
  },
  {
    "id": 163,
    "section": "Foto",
    "name": "Paměťové karty",
    "bazos_category": "Foto;Paměťové karty",
    "sbazar_category": "Elektro a potae;Foto bazar;PYsluaenstv k fotoapartom",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Paměťové karty"
  },
  {
    "id": 164,
    "section": "Reality",
    "name": "Ostatní",
    "bazos_category": "Reality;Ostatní",
    "sbazar_category": "Nemovitosti;Ostatní nemovitosti",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Ostatní"
  },
  {
    "id": 165,
    "section": "Sport",
    "name": "In-line, Skateboarding",
    "bazos_category": "Sport;In-line, Skateboarding",
    "sbazar_category": "Sport;Letn sporty;Kolekov brusle",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;In-line, Skateboarding"
  },
  {
    "id": 166,
    "section": "PC",
    "name": "Síťové prvky",
    "bazos_category": "PC;Síťové prvky",
    "sbazar_category": "Elektro a potae;Potae;Ostatní",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Síťové prvky"
  },
  {
    "id": 167,
    "section": "Sport",
    "name": "Fotbal",
    "bazos_category": "Sport;Fotbal",
    "sbazar_category": "Sport;Letn sporty;Fotbal",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Fotbal"
  },
  {
    "id": 168,
    "section": "Motorky",
    "name": "Mopedy",
    "bazos_category": "Motorky;Mopedy",
    "sbazar_category": "Auto-moto;Motocykly;Mopedy",
    "facebook_category": "Konky;Sport a outdoorov aktivity",
    "bazos_sk_category": "Motocykle;Mopedy"
  },
  {
    "id": 169,
    "section": "PC",
    "name": "GPS navigace",
    "bazos_category": "PC;GPS navigace",
    "sbazar_category": "Elektro a potae;Potae;GPS navigace",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;GPS navigace"
  },
  {
    "id": 170,
    "section": "Elektro",
    "name": "Epilátory, Depilátory",
    "bazos_category": "Elektro;Epilátory, Depilátory",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Ostatní domc spotřebiče",
    "facebook_category": "Rodina;Zdraví a krsa",
    "bazos_sk_category": "Elektro;Epilátory, Depilátory"
  },
  {
    "id": 171,
    "section": "Motorky",
    "name": "Minibike",
    "bazos_category": "Motorky;Minibike",
    "sbazar_category": "Auto-moto;Motocykly;",
    "facebook_category": "Vozidla;Motocykl",
    "bazos_sk_category": "Motorky;Minibike"
  },
  {
    "id": 172,
    "section": "Hudba",
    "name": "Ostatní",
    "bazos_category": "Hudba;Ostatní",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Ostatní",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Ostatní"
  },
  {
    "id": 173,
    "section": "Elektro",
    "name": "Nabíječky baterií",
    "bazos_category": "Elektro;Nabíječky baterií",
    "sbazar_category": "Elektro a potae;Ostatní elektro",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Nabíječky baterií"
  },
  {
    "id": 174,
    "section": "Elektro",
    "name": "Video, DVD přehrávače",
    "bazos_category": "Elektro;Video, DVD přehrávače",
    "sbazar_category": "Elektro a potae;Audio, video;DVD pYehrvae a rekordry",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Video, DVD přehrávače"
  },
  {
    "id": 175,
    "section": "Nábytek",
    "name": "Židle",
    "bazos_category": "Nábytek;Židle",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Jdeln stoly a židle",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Židle"
  },
  {
    "id": 176,
    "section": "Elektro",
    "name": "Autorádia",
    "bazos_category": "Elektro;Autorádia",
    "sbazar_category": "Elektro a potae;Audio, video;Hifi",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Elektro;Autorádia"
  },
  {
    "id": 177,
    "section": "Motorky",
    "name": "Tříkolky",
    "bazos_category": "Motorky;Tříkolky",
    "sbazar_category": "Auto-moto;Motocykly;Ostatní motocykly",
    "facebook_category": "Vozidla;Motocykl",
    "bazos_sk_category": "Motorky;Tříkolky"
  },
  {
    "id": 178,
    "section": "Motorky",
    "name": "Veteráni",
    "bazos_category": "Motorky;Veteráni",
    "sbazar_category": "Auto-moto;Motocykly;Veterni",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Motocykle;Veterny"
  },
  {
    "id": 179,
    "section": "Elektro",
    "name": "Televize",
    "bazos_category": "Elektro;Televize",
    "sbazar_category": "Elektro a potae;Televize",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Televize"
  },
  {
    "id": 180,
    "section": "Elektro",
    "name": "Ostatní - bílá",
    "bazos_category": "Elektro;Ostatní - bílá",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Ostatní domc spotřebiče",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Ostatní - bílá"
  },
  {
    "id": 181,
    "section": "Foto",
    "name": "Brašny a pouzdra",
    "bazos_category": "Foto;Brašny a pouzdra",
    "sbazar_category": "Elektro a potae;Foto bazar;PYsluaenstv k fotoapartom",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Brašny a pouzdra"
  },
  {
    "id": 182,
    "section": "Hudba",
    "name": "Koncerty",
    "bazos_category": "Hudba;Koncerty",
    "sbazar_category": "Hudba, knihy, hry a zbava;Vstupenky",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Koncerty"
  },
  {
    "id": 183,
    "section": "Elektro",
    "name": "Svítidla, lampy",
    "bazos_category": "Elektro;Svítidla, lampy",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Ostatní domc spotřebiče",
    "facebook_category": "Dom a zahrada;Potřeby pro domcnost",
    "bazos_sk_category": "Elektro;Svítidla, lampy"
  },
  {
    "id": 184,
    "section": "Reality",
    "name": "Podnájem, spolubydlící",
    "bazos_category": "Reality;Podnájem, spolubydlící",
    "sbazar_category": "Nemovitosti;Ostatní nemovitosti",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Podnájem, spolubydlící"
  },
  {
    "id": 185,
    "section": "Sport",
    "name": "Paintball, airsoft",
    "bazos_category": "Sport;Paintball, airsoft",
    "sbazar_category": "Sport;Letn sporty;Ostatní sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Paintball, airsoft"
  },
  {
    "id": 186,
    "section": "Sport",
    "name": "Ostatní cyklistika",
    "bazos_category": "Sport;Ostatní cyklistika",
    "sbazar_category": "Sport;Letn sporty;Kola",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Ostatní cyklistika"
  },
  {
    "id": 187,
    "section": "Auto",
    "name": "Tuning",
    "bazos_category": "Auto;Tuning",
    "sbazar_category": "Auto-moto;Nhradn dly, kola a pYsluaenstv",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Auto;Tuning"
  },
  {
    "id": 188,
    "section": "Elektro",
    "name": "Vysílačky",
    "bazos_category": "Elektro;Vysílačky",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Ostatní domc spotřebiče",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Vysílačky"
  },
  {
    "id": 189,
    "section": "Hudba",
    "name": "Dechové nástroje",
    "bazos_category": "Hudba;Dechové nástroje",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Hudební nstroje",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Dechové nástroje"
  },
  {
    "id": 190,
    "section": "Hudba",
    "name": "Zkušebny",
    "bazos_category": "Hudba;Zkušebny",
    "sbazar_category": "Hudba, knihy, hry a zbava;Hudební nstroje a pYsluaenstv;Ostatní",
    "facebook_category": "Konky;Hudební nstroje",
    "bazos_sk_category": "Hudba;Zkušebny"
  },
  {
    "id": 191,
    "section": "Reality",
    "name": "Byty",
    "bazos_category": "Reality;Byty",
    "sbazar_category": "Nemovitosti;Prodej, pronjem a vmna bytů",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Byty"
  },
  {
    "id": 192,
    "section": "Foto",
    "name": "Analogové fotoaparáty",
    "bazos_category": "Foto;Analogové fotoaparáty",
    "sbazar_category": "Elektro a potae;Foto bazar;Kompaktn fotoaparty",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Analogové fotoaparáty"
  },
  {
    "id": 193,
    "section": "Auto",
    "name": "Fiat",
    "bazos_category": "Auto;Fiat",
    "sbazar_category": "Auto-moto;Osobní auta;Fiat",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Fiat"
  },
  {
    "id": 194,
    "section": "Sport",
    "name": "Tenis, squash, badminton",
    "bazos_category": "Sport;Tenis, squash, badminton",
    "sbazar_category": "Sport;Letn sporty;Tenis",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Tenis, squash, badminton"
  },
  {
    "id": 195,
    "section": "Elektro",
    "name": "Reprosoustavy",
    "bazos_category": "Elektro;Reprosoustavy",
    "sbazar_category": "Elektro a potae;Audio, video;Reproduktory",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Reprosoustavy"
  },
  {
    "id": 196,
    "section": "Foto",
    "name": "Stativy",
    "bazos_category": "Foto;Stativy",
    "sbazar_category": "Elektro a potae;Foto bazar;Stativy",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Stativy"
  },
  {
    "id": 197,
    "section": "Auto",
    "name": "Seat",
    "bazos_category": "Auto;Seat",
    "sbazar_category": "Auto-moto;Osobní auta;Seat",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Seat"
  },
  {
    "id": 198,
    "section": "Reality",
    "name": "Pozemky",
    "bazos_category": "Reality;Pozemky",
    "sbazar_category": "Nemovitosti;Prodej, pronjem pozemků",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Pozemky"
  },
  {
    "id": 199,
    "section": "Dům a zahrada",
    "name": "Okna",
    "bazos_category": "Dům a zahrada;Okna",
    "sbazar_category": "Dom, byt a zahrada;Stavebnictví a nYad",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Okna"
  },
  {
    "id": 200,
    "section": "Auto",
    "name": "Mitsubishi",
    "bazos_category": "Auto;Mitsubishi",
    "sbazar_category": "Auto-moto;Osobní auta;Mitsubishi",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Auto;Mitsubishi"
  },
  {
    "id": 201,
    "section": "Dům a zahrada",
    "name": "Vybavení dílen",
    "bazos_category": "Dům a zahrada;Vybavení dílen",
    "sbazar_category": "Dom, byt a zahrada;Stavebnictví a nYad",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Vybavení dílen"
  },
  {
    "id": 202,
    "section": "Auto",
    "name": "Příslušenství",
    "bazos_category": "Auto;Příslušenství",
    "sbazar_category": "Auto-moto;Nhradn dly, kola a pYsluaenstv;Nhradn dly a pYsluaenstv",
    "facebook_category": "Konky;Autodly",
    "bazos_sk_category": "Auto;Prsluaenstvo"
  },
  {
    "id": 203,
    "section": "Motorky",
    "name": "Náhradní díly",
    "bazos_category": "Motorky;Náhradní díly",
    "sbazar_category": "Auto-moto;Motocykly;Nhradn dly na motorky",
    "facebook_category": "Vozidla;Motocykl",
    "bazos_sk_category": "Motorky;Náhradní díly"
  },
  {
    "id": 204,
    "section": "Auto",
    "name": "Peugeot",
    "bazos_category": "Auto;Peugeot",
    "sbazar_category": "Auto-moto;Osobní auta;Peugeot",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Peugeot"
  },
  {
    "id": 205,
    "section": "Auto",
    "name": "Suzuki",
    "bazos_category": "Auto;Suzuki",
    "sbazar_category": "Auto-moto;Osobní auta;Suzuki",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Suzuki"
  },
  {
    "id": 206,
    "section": "Auto",
    "name": "Opel",
    "bazos_category": "Auto;Opel",
    "sbazar_category": "Auto-moto;Osobní auta;Opel",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Opel"
  },
  {
    "id": 207,
    "section": "Mobily",
    "name": "Bezdrátové telefony",
    "bazos_category": "Mobily;Bezdrátové telefony",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobily ostatn",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Bezdrátové telefony"
  },
  {
    "id": 208,
    "section": "Elektro",
    "name": "Zesilovače",
    "bazos_category": "Elektro;Zesilovače",
    "sbazar_category": "Elektro a potae;Audio, video;Zesilovae",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Zesilovače"
  },
  {
    "id": 209,
    "section": "Mobily",
    "name": "HF Sady do auta",
    "bazos_category": "Mobily;HF Sady do auta",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobil pYsluaenstv",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;HF Sady do auta"
  },
  {
    "id": 210,
    "section": "Auto",
    "name": "Chevrolet",
    "bazos_category": "Auto;Chevrolet",
    "sbazar_category": "Auto-moto;Osobní auta;Chevrolet",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Chevrolet"
  },
  {
    "id": 211,
    "section": "Sport",
    "name": "Součástky a díly",
    "bazos_category": "Sport;Součástky a díly",
    "sbazar_category": "Sport;Sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Součástky a díly"
  },
  {
    "id": 212,
    "section": "Mobily",
    "name": "Apple",
    "bazos_category": "Mobily;Apple",
    "sbazar_category": "Elektro a potae;Mobil bazar;iPhone",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Apple"
  },
  {
    "id": 213,
    "section": "Mobily",
    "name": "Nabíječky",
    "bazos_category": "Mobily;Nabíječky",
    "sbazar_category": "Elektro a potae;Mobil bazar;Mobil pYsluaenstv",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Nabíječky"
  },
  {
    "id": 214,
    "section": "Motorky",
    "name": "Cestovní motocykly",
    "bazos_category": "Motorky;Cestovní motocykly",
    "sbazar_category": "Auto-moto;Motocykly;",
    "facebook_category": "Konky;Sport a outdoorov aktivity",
    "bazos_sk_category": "Motorky;Cestovní motocykly"
  },
  {
    "id": 215,
    "section": "PC",
    "name": "Grafické karty",
    "bazos_category": "PC;Grafické karty",
    "sbazar_category": "Elektro a potae;Potae;Ostatní",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Grafické karty"
  },
  {
    "id": 216,
    "section": "Foto",
    "name": "Blesky a osvětlení",
    "bazos_category": "Foto;Blesky a osvětlení",
    "sbazar_category": "Elektro a potae;Foto bazar;Blesky",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Blesky a osvětlení"
  },
  {
    "id": 217,
    "section": "Ostatní",
    "name": "Ostatní",
    "bazos_category": "Ostatní;Ostatní",
    "sbazar_category": "Starožitnosti, hobby a umění;Ostatní staro~itnosti",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatné;Ostatné"
  },
  {
    "id": 218,
    "section": "Elektro",
    "name": "Sporáky",
    "bazos_category": "Elektro;Sporáky",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Sporky",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Sporáky"
  },
  {
    "id": 219,
    "section": "PC",
    "name": "Tiskárny",
    "bazos_category": "PC;Tiskárny",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Tiskárny"
  },
  {
    "id": 220,
    "section": "PC",
    "name": "Základní desky",
    "bazos_category": "PC;Základní desky",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Základní desky"
  },
  {
    "id": 221,
    "section": "Auto",
    "name": "Mikrobusy",
    "bazos_category": "Auto;Mikrobusy",
    "sbazar_category": "Auto-moto;Ostatní auta",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Mikrobusy"
  },
  {
    "id": 222,
    "section": "Elektro",
    "name": "Myčky",
    "bazos_category": "Elektro;Myčky",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Myky",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Myčky"
  },
  {
    "id": 223,
    "section": "Sport",
    "name": "Turistika, horolezectví",
    "bazos_category": "Sport;Turistika, horolezectví",
    "sbazar_category": "Sport;Letn sporty;Horolezectv",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Turistika, horolezectví"
  },
  {
    "id": 224,
    "section": "Auto",
    "name": "Ostatní užitková",
    "bazos_category": "Auto;Ostatní užitková",
    "sbazar_category": "Auto-moto;Ostatní auta",
    "facebook_category": "Vozidla;Komern/pro pracovn použití",
    "bazos_sk_category": "Auto;Ostatní užitková"
  },
  {
    "id": 225,
    "section": "PC",
    "name": "Paměti",
    "bazos_category": "PC;Paměti",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Paměti"
  },
  {
    "id": 226,
    "section": "Elektro",
    "name": "Holicí strojky",
    "bazos_category": "Elektro;Holicí strojky",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Ostatní domc spotřebiče",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Elektro;Holicí strojky"
  },
  {
    "id": 227,
    "section": "Nábytek",
    "name": "Koupelny",
    "bazos_category": "Nábytek;Koupelny",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Koupelny",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Koupelny"
  },
  {
    "id": 228,
    "section": "PC",
    "name": "Modemy",
    "bazos_category": "PC;Modemy",
    "sbazar_category": "Elektro a potae;Potae;Ostatní",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Modemy"
  },
  {
    "id": 229,
    "section": "Sport",
    "name": "Koloběžky",
    "bazos_category": "Sport;Koloběžky",
    "sbazar_category": "Sport;Letn sporty;Koloběžky",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Koloběžky"
  },
  {
    "id": 230,
    "section": "Elektro",
    "name": "Mikrovlnné trouby",
    "bazos_category": "Elektro;Mikrovlnné trouby",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Mikrovlnn trouby",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Mikrovlnné trouby"
  },
  {
    "id": 231,
    "section": "Auto",
    "name": "Pick-up",
    "bazos_category": "Auto;Pick-up",
    "sbazar_category": "Auto-moto;Ostatní auta",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Pick-up"
  },
  {
    "id": 232,
    "section": "Ostatní",
    "name": "Zdraví a krása",
    "bazos_category": "Ostatní;Zdraví a krása",
    "sbazar_category": "Zdrav a krsa;Kosmetika a parfmy",
    "facebook_category": "Konky;Starožitnosti a sběratelství",
    "bazos_sk_category": "Ostatní;Zdraví a krása"
  },
  {
    "id": 233,
    "section": "Foto",
    "name": "Filtry",
    "bazos_category": "Foto;Filtry",
    "sbazar_category": "Elektro a potae;Foto bazar;PYsluaenstv k fotoapartom",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Filtry"
  },
  {
    "id": 234,
    "section": "Motorky",
    "name": "Skútry vodní",
    "bazos_category": "Motorky;Skútry vodní",
    "sbazar_category": "Auto-moto;Motocykly;Sktry",
    "facebook_category": "Vozidla;Motocykl",
    "bazos_sk_category": "Motorky;Skútry vodní"
  },
  {
    "id": 235,
    "section": "Foto",
    "name": "Digitální fotoaparáty",
    "bazos_category": "Foto;Digitální fotoaparáty",
    "sbazar_category": "Elektro a potae;Foto bazar;Kompaktn fotoaparty",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Digitální fotoaparáty"
  },
  {
    "id": 236,
    "section": "Auto",
    "name": "Alfa Romeo",
    "bazos_category": "Auto;Alfa Romeo",
    "sbazar_category": "Auto-moto;Osobní auta;Alfa Romeo",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Alfa Romeo"
  },
  {
    "id": 237,
    "section": "Dům a zahrada",
    "name": "Kotle, kamna, bojlery",
    "bazos_category": "Dům a zahrada;Kotle, kamna, bojlery",
    "sbazar_category": "Dom, byt a zahrada;Vytpn, ohřev, chlazen;Kamna, kotle, krby, topen",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Dům a zahrada;Kotle, kamna, bojlery"
  },
  {
    "id": 238,
    "section": "Sport",
    "name": "Hokej, bruslení",
    "bazos_category": "Sport;Hokej, bruslení",
    "sbazar_category": "Sport;Zimn sporty;Brusle na led",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Hokej, bruslení"
  },
  {
    "id": 239,
    "section": "PC",
    "name": "Scanery",
    "bazos_category": "PC;Scanery",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Scanery"
  },
  {
    "id": 240,
    "section": "Sport",
    "name": "Společenské hry",
    "bazos_category": "Sport;Společenské hry",
    "sbazar_category": "Sport;Letn sporty;Ostatní sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Společenské hry"
  },
  {
    "id": 241,
    "section": "Nábytek",
    "name": "Kuchyně",
    "bazos_category": "Nábytek;Kuchyně",
    "sbazar_category": "Dom, byt a zahrada;Nbytek;Kuchyně",
    "facebook_category": "Dom a zahrada;Nbytek",
    "bazos_sk_category": "Nábytek;Kuchyně"
  },
  {
    "id": 242,
    "section": "Reality",
    "name": "Nové projekty",
    "bazos_category": "Reality;Nové projekty",
    "sbazar_category": "Nemovitosti;Ostatní nemovitosti",
    "facebook_category": "Nemovitosti;Prodej",
    "bazos_sk_category": "Reality;Nové projekty"
  },
  {
    "id": 243,
    "section": "Sport",
    "name": "Skialpy",
    "bazos_category": "Sport;Skialpy",
    "sbazar_category": "Sport;Zimn sporty;Lyže",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Skialpy"
  },
  {
    "id": 244,
    "section": "Foto",
    "name": "Nabíječky baterií",
    "bazos_category": "Foto;Nabíječky baterií",
    "sbazar_category": "Elektro a potae;Foto bazar;PYsluaenstv k fotoapartom",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "Foto;Nabíječky baterií"
  },
  {
    "id": 245,
    "section": "Sport",
    "name": "Vše ostatní",
    "bazos_category": "Sport;Vše ostatní",
    "sbazar_category": "Sport;Sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Vše ostatní"
  },
  {
    "id": 246,
    "section": "PC",
    "name": "Hard disky, SSD",
    "bazos_category": "PC;Hard disky, SSD",
    "sbazar_category": "Elektro a potae;Potae;PC pYsluaenstv",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Hard disky, SSD"
  },
  {
    "id": 247,
    "section": "Sport",
    "name": "Letectví",
    "bazos_category": "Sport;Letectví",
    "sbazar_category": "Sport;Letn sporty;Ostatní sportovn vybaven",
    "facebook_category": "Konky;Sport a outdoorové aktivity",
    "bazos_sk_category": "Sport;Letectví"
  },
  {
    "id": 248,
    "section": "Auto",
    "name": "Kia",
    "bazos_category": "Auto;Kia",
    "sbazar_category": "Auto-moto;Osobní auta;Kia",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Kia"
  },
  {
    "id": 249,
    "section": "Auto",
    "name": "Toyota",
    "bazos_category": "Auto;Toyota",
    "sbazar_category": "Auto-moto;Osobní auta;Toyota",
    "facebook_category": "Vozidla;Auto/nkladn auto",
    "bazos_sk_category": "Auto;Toyota"
  },
  {
    "id": 250,
    "section": "Elektro",
    "name": "Šicí stroje",
    "bazos_category": "Elektro;Šicí stroje",
    "sbazar_category": "Dom, byt a zahrada;Domc spotřebiče;Ostatní domc spotřebiče",
    "facebook_category": "Dom a zahrada;Spotřebiče",
    "bazos_sk_category": "Elektro;Šicí stroje"
  },
  {
    "id": 251,
    "section": "Mobily",
    "name": "Nokia, Microsoft",
    "bazos_category": "Mobily;Nokia, Microsoft",
    "sbazar_category": "Elektro a potae;Mobil bazar;Nokia",
    "facebook_category": "Elektronika;Mobilní telefony",
    "bazos_sk_category": "Mobily;Nokia, Microsoft"
  },
  {
    "id": 252,
    "section": "Elektro",
    "name": "Domácí kina",
    "bazos_category": "Elektro;Domácí kina",
    "sbazar_category": "Elektro a potae;Audio, video;Reproduktory",
    "facebook_category": "Dom a zahrada;Potřeby pro domcnost",
    "bazos_sk_category": "Elektro;Domácí kina"
  },
  {
    "id": 253,
    "section": "Auto",
    "name": "Havarovaná užitková",
    "bazos_category": "Auto;Havarovaná užitková",
    "sbazar_category": "Auto-moto;Ostatní auta",
    "facebook_category": "Vozidla;Komern/pro pracovn použití",
    "bazos_sk_category": "Auto;Havarovaná užitková"
  },
  {
    "id": 254,
    "section": "PC",
    "name": "Ostatní",
    "bazos_category": "PC;Ostatní",
    "sbazar_category": "Elektro a potae;Potae;Ostatní",
    "facebook_category": "Elektronika;Elektronika a potae",
    "bazos_sk_category": "PC;Ostatní"
  }
];

export async function fetchOfferCategories(): Promise<OfferCategoryItem[]> {
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((c: any) => {
          const parts = (c.bazos || '').split(';');
          return {
            id: c.id,
            section: c.section || parts[0]?.trim() || 'Ostatní',
            name: c.name || parts[1]?.trim() || c.bazos,
            bazos_category: c.bazos,
            sbazar_category: c.sbazar || '',
            facebook_category: c.facebook || '',
            bazos_sk_category: c.bazossk || c.bazos || '',
          };
        });
      }
    }
  } catch {
    // fallback to DEFAULT_OFFER_CATEGORIES
  }
  return DEFAULT_OFFER_CATEGORIES;
}
