import zipfile
import xml.etree.ElementTree as ET
import re
import json
import os
from datetime import datetime, timedelta
from urllib.parse import unquote_plus
from collections import defaultdict, Counter

EXCEL_PATH = '/Users/ducanmai/Desktop/Sellin - Sales pipeline.xlsx'
OUTPUT_JSON = '/Users/ducanmai/Projects/Sellin.cz/frontend/data/crm_leads.json'

def excel_date_to_str(val):
    if not val:
        return ''
    try:
        f = float(val)
        if 40000 <= f <= 50000:
            d = datetime(1899, 12, 30) + timedelta(days=f)
            return d.strftime('%d.%m.%Y')
    except:
        pass
    return str(val).strip()

def clean_phone(val):
    if not val:
        return ''
    val = str(val).strip()
    if 'E' in val or 'e' in val:
        try:
            val = str(int(float(val)))
        except:
            pass
    val = re.split(r'[,/;]', val)[0].strip()
    clean = re.sub(r'[^0-9+]', '', val)
    if clean.startswith('00'):
        clean = '+' + clean[2:]
    elif clean.startswith('420') and len(clean) == 12:
        clean = '+' + clean
    elif clean.startswith('421') and len(clean) == 12:
        clean = '+' + clean
    elif len(clean) == 9 and clean[0] in ['6', '7', '2', '3', '4', '5', '9']:
        clean = '+420' + clean
    return clean

def extract_bazos_phone_id(url):
    if not url:
        return None
    m = re.search(r'idphone=([0-9]+)', str(url))
    return m.group(1) if m else None

def extract_bazos_name(url):
    if not url:
        return None
    m = re.search(r'jmeno=([^&]+)', str(url))
    if m:
        try:
            return unquote_plus(m.group(1)).replace('+', ' ').strip()
        except:
            return m.group(1).replace('+', ' ').strip()
    return None

def normalize_domain(url):
    if not url:
        return ''
    url = str(url).strip().lower()
    url = re.sub(r'^https?://', '', url)
    url = re.sub(r'^www\.', '', url)
    url = re.split(r'[/?#;]', url)[0].strip()
    return url

def clean_company_name(name):
    if not name:
        return ''
    name = str(name).strip()
    # clean semicolon if any
    name = name.split(';')[0].strip()
    return name

def main():
    print(f'Loading Excel file from {EXCEL_PATH}...')
    with zipfile.ZipFile(EXCEL_PATH) as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = {'d': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in tree.findall('d:si', ns):
                shared_strings.append(''.join(si.itertext()))
                
        rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rel_map = {rel.attrib['Id']: rel.attrib['Target'] for rel in rels_tree}
        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheet_map = {
            sheet.attrib['name']: rel_map[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            for sheet in wb_tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheets/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')
        }

        def get_val(c):
            t = c.attrib.get('t')
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            if v is None or v.text is None:
                is_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
                if is_elem is not None:
                    return ''.join(is_elem.itertext())
                return ''
            if t == 's':
                idx = int(v.text)
                return shared_strings[idx] if idx < len(shared_strings) else ''
            return v.text

        def parse_cell_ref(r):
            m = re.match(r'([A-Z]+)(\d+)', r)
            return m.group(1), int(m.group(2))

        def get_sheet_rows(name):
            if name not in sheet_map:
                return []
            target = sheet_map[name]
            if not target.startswith('xl/'):
                target = 'xl/' + target
            tree = ET.fromstring(z.read(target))
            rows = tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
            res = []
            for r in rows:
                r_dict = {}
                for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    col, _ = parse_cell_ref(c.attrib['r'])
                    val = get_val(c)
                    if val:
                        r_dict[col] = val.strip()
                if r_dict:
                    res.append((int(r.attrib.get('r', 0)), r_dict))
            return res

        leads = {}
        phone_to_id = {}
        bazos_to_id = {}
        domain_to_id = {}
        name_to_id = {}
        next_id = 1

        def find_lead_id(phone, bazos_id, domain, name):
            if bazos_id and bazos_id in bazos_to_id:
                return bazos_to_id[bazos_id]
            if phone and len(phone) >= 9 and phone in phone_to_id:
                return phone_to_id[phone]
            if domain and len(domain) > 3 and domain in domain_to_id:
                return domain_to_id[domain]
            if name and len(name) > 4 and name.lower() in name_to_id:
                return name_to_id[name.lower()]
            return None

        def upsert_lead(data, origin_sheet):
            nonlocal next_id
            phone = clean_phone(data.get('phone', ''))
            bazos_id = data.get('bazos_phone_id')
            domain = normalize_domain(data.get('website', ''))
            name = clean_company_name(data.get('name', ''))

            lead_id = find_lead_id(phone, bazos_id, domain, name)
            
            if lead_id is None:
                lead_id = next_id
                next_id += 1
                leads[lead_id] = {
                    'id': lead_id,
                    'name': name or (f'Bazoš prodejce #{bazos_id}' if bazos_id else domain or 'Neznámý kontakt'),
                    'company_name': data.get('company_name', '') or name,
                    'contact_person': data.get('contact_person', ''),
                    'phone': phone,
                    'email': data.get('email', '').strip().lower(),
                    'website': data.get('website', '').strip(),
                    'bazos_url': data.get('bazos_url', '').strip(),
                    'bazos_phone_id': bazos_id or '',
                    'category': data.get('category', 'Ostatní'),
                    'source': data.get('source', 'Bazoš CZ'),
                    'stage': data.get('stage', 'lead'),
                    'tier': data.get('tier', 3),
                    'notes': data.get('notes', ''),
                    'response': data.get('response', ''),
                    'first_call_date': data.get('first_call_date', ''),
                    'onboarding_date': data.get('onboarding_date', ''),
                    'offers_count': data.get('offers_count', 0),
                    'location': data.get('location', 'ČR'),
                    'tags': list(set(data.get('tags', []))),
                    'origin_sheets': [origin_sheet]
                }
            else:
                l = leads[lead_id]
                if origin_sheet not in l['origin_sheets']:
                    l['origin_sheets'].append(origin_sheet)
                existing_tags = set(l['tags'])
                for t in data.get('tags', []):
                    existing_tags.add(t)
                l['tags'] = list(existing_tags)
                
                if not l['phone'] and phone:
                    l['phone'] = phone
                if not l['email'] and data.get('email'):
                    l['email'] = data.get('email').strip().lower()
                if not l['website'] and data.get('website'):
                    l['website'] = data.get('website').strip()
                if not l['bazos_url'] and data.get('bazos_url'):
                    l['bazos_url'] = data.get('bazos_url').strip()
                if not l['bazos_phone_id'] and bazos_id:
                    l['bazos_phone_id'] = bazos_id
                if not l['contact_person'] and data.get('contact_person'):
                    l['contact_person'] = data.get('contact_person')
                if (l['name'].startswith('Bazoš prodejce') or not l['name']) and name and not name.startswith('Bazoš'):
                    l['name'] = name
                if not l['company_name'] and data.get('company_name'):
                    l['company_name'] = data.get('company_name')
                if data.get('category') and data.get('category') != 'Ostatní' and (l['category'] == 'Ostatní' or l['category'] == 'Bazary & Zastavárny'):
                    l['category'] = data.get('category')
                if data.get('tier') and data.get('tier') < l['tier']:
                    l['tier'] = data.get('tier')
                
                stage_order = {'won': 7, 'onboarding': 6, 'trial': 5, 'warm': 4, 'contacted': 3, 'lost': 2, 'lead': 1}
                current_prio = stage_order.get(l['stage'], 1)
                new_prio = stage_order.get(data.get('stage', 'lead'), 1)
                if new_prio > current_prio:
                    l['stage'] = data['stage']
                    
                if data.get('response') and (not l['response'] or l['response'] == '-'):
                    l['response'] = data['response']
                if data.get('first_call_date') and not l['first_call_date']:
                    l['first_call_date'] = data['first_call_date']
                if data.get('onboarding_date') and not l['onboarding_date']:
                    l['onboarding_date'] = data['onboarding_date']
                if data.get('offers_count') and data['offers_count'] > l['offers_count']:
                    l['offers_count'] = data['offers_count']
                if data.get('notes'):
                    if not l['notes']:
                        l['notes'] = data['notes']
                    elif data['notes'] not in l['notes']:
                        l['notes'] = l['notes'] + ' | ' + data['notes']

            if phone and len(phone) >= 9:
                phone_to_id[phone] = lead_id
            if bazos_id:
                bazos_to_id[bazos_id] = lead_id
            if domain and len(domain) > 3:
                domain_to_id[domain] = lead_id
            if name and len(name) > 4:
                name_to_id[name.lower()] = lead_id

        # --- 1. CORE PIPELINE SHEETS ---
        print('1/6 Parsing Core Pipeline sheets (Onboarding, 32022, Electronics, contacted, 40+, warm, volumers)...')
        
        # 1.1 Onboarding
        for _, r in get_sheet_rows('Onboarding')[1:]:
            lead_url = r.get('A', '')
            bazos_id = extract_bazos_phone_id(lead_url)
            tier_val = 3
            try:
                tier_val = int(float(r.get('B', 3)))
            except:
                pass
            dom = r.get('C', '')
            tel_raw = r.get('D', '')
            email, phone, contact_person, name, website = '', '', '', '', ''
            for cand in [dom, tel_raw]:
                if not cand: continue
                if '@' in cand: email = cand
                elif '(' in cand and ')' in cand:
                    m = re.match(r'([0-9+.\sE]+)\s*\((.*?)\)', cand)
                    if m:
                        phone = clean_phone(m.group(1))
                        contact_person = m.group(2).strip()
                elif re.search(r'^[0-9+.\sE]{8,}$', cand):
                    phone = clean_phone(cand)
                elif '.' in cand and not cand.endswith('.'):
                    website = cand
                    name = cand
                else:
                    name = cand
                    
            resp = r.get('F', '')
            onb = r.get('G', '')
            f24 = r.get('H', '')
            trial = r.get('I', '')
            closed = r.get('J', '')
            invoiced = r.get('K', '')
            note = r.get('M', '')
            
            combined_notes = []
            if note: combined_notes.append(note)
            if f24 and f24 != '-': combined_notes.append(f'24-48h: {excel_date_to_str(f24)}')
            if trial and trial != '-': combined_notes.append(f'Trial: {excel_date_to_str(trial)}')
            if closed and closed != '-': combined_notes.append(f'Uzavření: {excel_date_to_str(closed)}')
            if invoiced and invoiced != '-': combined_notes.append(f'Fakturace: {excel_date_to_str(invoiced)}')
            
            stage = 'lead'
            resp_l, onb_l, closed_l = resp.lower(), onb.lower(), closed.lower()
            if (invoiced and invoiced != '-') or 'win' in closed_l or '250 eur' in resp_l:
                stage = 'won'
            elif 'done' in onb_l or 'vystavil' in onb_l or 'live' in onb_l or 'onboarding' in onb_l:
                stage = 'onboarding'
            elif 'trial' in resp_l or 'trial' in trial.lower():
                stage = 'trial'
            elif 'cant reach' in onb_l or 'lost' in closed_l or 'ne ' in resp_l:
                stage = 'lost'
            elif resp or r.get('E'):
                stage = 'contacted'
                
            category = 'Bazary & Zastavárny'
            name_l = (name + ' ' + dom).lower()
            if any(x in name_l for x in ['electro', 'mobil', 'telefon', 'apple', 'pc']):
                category = 'Elektronika & Apple'
            elif any(x in name_l for x in ['bílá', 'spotřebič']):
                category = 'Elektrospotřebiče'
            elif any(x in name_l for x in ['car', 'auto', 'moto']):
                category = 'Automoto & Autodíly'
            elif any(x in name_l for x in ['pneu', 'kola']):
                category = 'Pneumatiky & Kola'
            elif 'nábytek' in name_l:
                category = 'Nábytek & Bydlení'

            upsert_lead({
                'name': name or (f'Bazoš prodejce #{bazos_id}' if bazos_id else 'Onboarding kontakt'),
                'company_name': name,
                'contact_person': contact_person,
                'phone': phone,
                'email': email,
                'website': website,
                'bazos_url': lead_url if 'bazos' in lead_url else '',
                'bazos_phone_id': bazos_id,
                'category': category,
                'source': 'Bazoš CZ',
                'stage': stage,
                'tier': tier_val,
                'notes': ' | '.join(combined_notes),
                'response': resp,
                'first_call_date': excel_date_to_str(r.get('E', '')),
                'onboarding_date': excel_date_to_str(onb),
                'tags': ['Pipeline', 'Onboarding'],
            }, 'Onboarding')

        # 1.2 32022
        for _, r in get_sheet_rows('32022')[3:]:
            url = r.get('A', '')
            bazos_id = extract_bazos_phone_id(url)
            bazos_name = extract_bazos_name(url)
            tier_val = 3
            try:
                tier_val = int(float(r.get('B', 3)))
            except:
                pass
            contact_phone = clean_phone(r.get('C', ''))
            person_role = r.get('D', '')
            contact_person = ''
            if person_role:
                m = re.match(r'(.*?)\s*\((.*?)\)', person_role)
                contact_person = m.group(1).strip() if m else person_role
                
            m1 = excel_date_to_str(r.get('E', ''))
            resp = r.get('F', '')
            c1 = excel_date_to_str(r.get('K', ''))
            pot = r.get('L', '').lower()
            notes = r.get('M', '')
            
            stage = 'lead'
            if 'invest' in resp.lower():
                stage = 'won'
            elif 'want to see' in resp.lower() or 'yes' in pot:
                stage = 'warm'
            elif 'callback' in notes.lower():
                stage = 'warm'
            elif pot == 'no' or 'not ideal' in notes.lower():
                stage = 'lost'
            elif c1 or m1 or resp:
                stage = 'contacted'
            
            name = bazos_name or (normalize_domain(url) if 'bazos' not in url else '')
            upsert_lead({
                'name': name or f'Bazoš prodejce #{bazos_id}',
                'company_name': name,
                'contact_person': contact_person,
                'phone': contact_phone,
                'website': url if 'bazos' not in url else '',
                'bazos_url': url if 'bazos' in url else '',
                'bazos_phone_id': bazos_id,
                'category': 'Elektronika & Apple',
                'source': 'Bazoš CZ' if 'bazos' in url else 'Web outreach',
                'stage': stage,
                'tier': tier_val,
                'notes': notes,
                'response': resp,
                'first_call_date': c1 or m1,
                'tags': ['32022 Kampaň', 'Elektronika'],
            }, '32022')

        # 1.3 Electronics leads
        for _, r in get_sheet_rows('Electronics leads')[2:]:
            lead_url = r.get('A', '')
            bazos_id = extract_bazos_phone_id(lead_url)
            tier_val = 3
            try:
                tier_val = int(float(r.get('B', 3)))
            except:
                pass
            dom = r.get('C', '')
            tel = clean_phone(r.get('D', ''))
            c1 = excel_date_to_str(r.get('E', ''))
            resp = r.get('F', '')
            notes = r.get('N', '')
            stage = 'lead'
            if 'trial' in resp.lower():
                stage = 'trial'
            elif c1 or resp:
                stage = 'contacted'
            cat = 'Elektrospotřebiče' if 'spotřebič' in (dom + ' ' + notes).lower() or 'bílá' in dom.lower() else 'Elektronika & Apple'
            upsert_lead({
                'name': dom or f'Bazoš prodejce #{bazos_id}',
                'company_name': dom,
                'phone': tel,
                'bazos_url': lead_url,
                'bazos_phone_id': bazos_id,
                'category': cat,
                'source': 'Bazoš CZ',
                'stage': stage,
                'tier': tier_val,
                'notes': notes,
                'response': resp,
                'first_call_date': c1,
                'tags': ['Electronics leads'],
            }, 'Electronics leads')

        # 1.4 contacted
        for _, r in get_sheet_rows('contacted')[3:]:
            lead_url = r.get('A', '')
            bazos_id = extract_bazos_phone_id(lead_url)
            tier_val = 3
            try:
                tier_val = int(float(r.get('B', 3)))
            except:
                pass
            dom = r.get('C', '')
            tel = clean_phone(r.get('D', ''))
            c1 = excel_date_to_str(r.get('E', ''))
            resp = r.get('F', '')
            note = r.get('M', '')
            stage = 'contacted' if (c1 or resp) else 'lead'
            upsert_lead({
                'name': dom or f'Bazoš prodejce #{bazos_id}',
                'phone': tel,
                'bazos_url': lead_url,
                'bazos_phone_id': bazos_id,
                'category': 'Bazary & Zastavárny',
                'source': 'Bazoš CZ',
                'stage': stage,
                'tier': tier_val,
                'notes': note,
                'response': resp,
                'first_call_date': c1,
                'tags': ['Osloveno'],
            }, 'contacted')

        # 1.5 40+
        for _, r in get_sheet_rows('40+')[1:]:
            lead_url = r.get('A', '')
            bazos_id = extract_bazos_phone_id(lead_url)
            c1_flag = r.get('E', '')
            stage = 'contacted' if c1_flag == '1' else 'lead'
            upsert_lead({
                'name': f'Bazoš prodejce #{bazos_id}',
                'bazos_url': lead_url,
                'bazos_phone_id': bazos_id,
                'category': 'Bazary & Zastavárny',
                'source': 'Bazoš CZ',
                'stage': stage,
                'offers_count': 40,
                'tags': ['40+ nabídek'],
            }, '40+')

        # 1.6 warm, later & volumers
        for _, r in get_sheet_rows('warm, later'):
            lead_url = r.get('A', '')
            bazos_id = extract_bazos_phone_id(lead_url)
            date_followup = r.get('F', '')
            upsert_lead({
                'name': f'Bazoš prodejce #{bazos_id}',
                'bazos_url': lead_url,
                'bazos_phone_id': bazos_id,
                'category': 'Bazary & Zastavárny',
                'source': 'Bazoš CZ',
                'stage': 'warm',
                'notes': f'Follow-up: {date_followup}',
                'tags': ['Warm follow-up'],
            }, 'warm, later')

        for _, r in get_sheet_rows('volumers'):
            lead_url = r.get('A', '')
            bazos_id = extract_bazos_phone_id(lead_url)
            note = r.get('F', '')
            stage = 'lost' if 'smazany' in note.lower() or 'konkurence' in note.lower() else 'lead'
            upsert_lead({
                'name': f'Bazoš prodejce #{bazos_id}',
                'bazos_url': lead_url,
                'bazos_phone_id': bazos_id,
                'category': 'Bazary & Zastavárny',
                'source': 'Bazoš CZ',
                'stage': stage,
                'notes': note,
                'tags': ['Velkoprodejce'],
            }, 'volumers')

        # --- 2. BAZOŠ CATEGORIZED SEGMENTS (>40 offers) ---
        print('2/6 Parsing Bazos >40 segmented sheets...')
        bazos_seg_sheets = [
            ('Bazos id 0-10K & offers>40 & av', 'C'),
            ('Bazos id 10-20K & offers>40 & a', 'C'),
            ('Bazos id 20k-30k & offers>40 & ', 'C'),
            ('Bazos id 30-40K & offers>40 & a', 'C'),
            ('Bazos id 50-60K & offers>40 & a', 'E'),
            ('Bazos id 60-80K & offers>40 & a', None),
            ('Bazos id 80-100K & offers>40 & ', None),
            ('Prague, 40+, 3K+', None),
        ]
        cat_map = {
            'kolo příslušenství': 'Cyklo & Sport',
            'autokola': 'Pneumatiky & Kola',
            'pneu': 'Pneumatiky & Kola',
            'spotřebiče': 'Elektrospotřebiče',
            'sochy': 'Nábytek & Bydlení',
            'bazar': 'Bazary & Zastavárny',
            'pc': 'Elektronika & Apple',
            'hračky': 'Ostatní',
            'moto příslušenství': 'Automoto & Autodíly',
            'nábytek spotřebiče': 'Nábytek & Bydlení',
            'auto': 'Automoto & Autodíly',
            'auto-moto': 'Automoto & Autodíly',
            'autobudíky': 'Automoto & Autodíly',
            'pneu autokola': 'Pneumatiky & Kola',
            'automotory': 'Automoto & Autodíly',
            'autodíly': 'Automoto & Autodíly',
        }
        for s_name, cat_col in bazos_seg_sheets:
            for _, r in get_sheet_rows(s_name):
                lead_url = r.get('A', '')
                if not lead_url or 'bazos' not in lead_url:
                    continue
                bazos_id = extract_bazos_phone_id(lead_url)
                raw_cat = (r.get(cat_col, '') if cat_col else '').lower().strip()
                cat = cat_map.get(raw_cat, 'Bazary & Zastavárny')
                loc = 'Praha' if 'prague' in s_name.lower() else 'ČR'
                upsert_lead({
                    'name': f'Bazoš prodejce #{bazos_id}',
                    'bazos_url': lead_url,
                    'bazos_phone_id': bazos_id,
                    'category': cat,
                    'source': 'Bazoš CZ',
                    'stage': 'lead',
                    'offers_count': 40,
                    'location': loc,
                    'tags': ['40+ nabídek', f'Segment: {raw_cat or "Bazoš"}'],
                }, s_name)

        # --- 3. FIRMY.CZ DIRECTORIES ---
        print('3/6 Parsing Firmy.cz B2B directories (Automoto, Pneu, Apple, Elektro, Nábytek, Bazary)...')
        # 3.1 Pneu
        for _, r in get_sheet_rows('firmy.cz pneu'):
            line = r.get('A', '')
            parts = line.split(';')
            c_name = parts[0].strip() if len(parts) > 0 else ''
            tel = parts[1].strip() if len(parts) > 1 else ''
            web = parts[2].strip() if len(parts) > 2 else ''
            if c_name:
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'category': 'Pneumatiky & Kola',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Pneuservis'],
                }, 'firmy.cz pneu')

        # 3.2 Použité pneu
        for _, r in get_sheet_rows('firmy.cz pouzite pneu'):
            c_name = r.get('A', '')
            tel = r.get('B', '')
            web = r.get('C', '')
            if c_name:
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'category': 'Pneumatiky & Kola',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Pneu bazar'],
                }, 'firmy.cz pouzite pneu')

        # 3.3 Autovrakoviste
        for _, r in get_sheet_rows('firmy.cz autovrakoviste'):
            c_name = r.get('A', '')
            tel = r.get('C', '')
            web = r.get('D', '')
            email = r.get('H', '') if '@' in r.get('H', '') else ''
            offers_raw = r.get('J', 0)
            offers = 0
            try:
                offers = int(float(offers_raw))
            except:
                pass
            if c_name:
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'email': email,
                    'offers_count': offers,
                    'category': 'Automoto & Autodíly',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Autovrakoviště'],
                }, 'firmy.cz autovrakoviste')

        # 3.4 Autodíly
        for _, r in get_sheet_rows('firmy.cz autodily'):
            c_name = r.get('A', '')
            bazos_url = r.get('E', '')
            web = r.get('F', '')
            if c_name:
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'website': web,
                    'bazos_url': bazos_url if 'bazos' in bazos_url else '',
                    'category': 'Automoto & Autodíly',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Autodíly'],
                }, 'firmy.cz autodily')

        # 3.5 Apple
        for _, r in get_sheet_rows('firmy.cz apple'):
            c_name = r.get('A', '')
            tel = r.get('B', '')
            web = r.get('C', '')
            if c_name:
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'category': 'Elektronika & Apple',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Apple servis & prodej'],
                }, 'firmy.cz apple')

        # 3.6 Elektrospotrebice
        for _, r in get_sheet_rows('firmy.cz  elektrospotrebice (ba'):
            c_name = r.get('A', '')
            tel = r.get('B', '')
            web = r.get('C', '')
            email = r.get('F', '') if '@' in r.get('F', '') else ''
            if c_name and c_name != 'E-shop platform':
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'email': email,
                    'category': 'Elektrospotřebiče',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Bílé elektro & spotřebiče'],
                }, 'firmy.cz  elektrospotrebice (ba')

        # 3.7 Eshop Elektronika
        for _, r in get_sheet_rows('firmy.cz  eshop elektronika (ba'):
            c_name = r.get('A', '')
            tel = r.get('B', '')
            web = r.get('C', '')
            if c_name and c_name != 'E-shop platform':
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'category': 'Elektronika & Apple',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Elektronika & PC'],
                }, 'firmy.cz  eshop elektronika (ba')

        # 3.8 Eshop Automoto
        for _, r in get_sheet_rows('firmy.cz - eshop automoto (baza'):
            c_name = r.get('A', '')
            tel = r.get('B', '')
            web = r.get('C', '')
            if c_name and c_name != 'E-shop platform':
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'category': 'Automoto & Autodíly',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Automoto e-shop'],
                }, 'firmy.cz - eshop automoto (baza')

        # 3.9 Nabytek
        for _, r in get_sheet_rows('firmy.cz  nabytek (bazar) - Vie'):
            c_name = r.get('A', '')
            tel = r.get('B', '')
            web = r.get('C', '')
            if c_name and c_name != 'E-shop platform':
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'category': 'Nábytek & Bydlení',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Nábytek bazar'],
                }, 'firmy.cz  nabytek (bazar) - Vie')

        # 3.10 Bazary CR
        for _, r in get_sheet_rows('firmy.cz bazar CR'):
            c_name = r.get('A', '')
            tel = r.get('B', '')
            web = r.get('C', '')
            pot = r.get('H', '')
            if c_name:
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'notes': f'Potenciál: {pot}' if pot else '',
                    'category': 'Bazary & Zastavárny',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Bazar ČR'],
                }, 'firmy.cz bazar CR')

        # 3.11 Bazary Praha
        for _, r in get_sheet_rows('firmy.cz bazary praha'):
            c_name = r.get('A', '')
            tel = r.get('B', '')
            web = r.get('C', '')
            if c_name:
                upsert_lead({
                    'name': c_name,
                    'company_name': c_name,
                    'phone': tel,
                    'website': web,
                    'location': 'Praha',
                    'category': 'Bazary & Zastavárny',
                    'source': 'Firmy.cz',
                    'stage': 'lead',
                    'tags': ['Firmy.cz', 'Bazar Praha'],
                }, 'firmy.cz bazary praha')

        # --- 4. BAZOŠ HISTORICAL DATE LISTS ---
        print('4/6 Parsing Bazos date lists (SK bazos, 0-300K, batches)...')
        # 4.1 SK bazos
        for _, r in get_sheet_rows('20.10. leads bazos.sk 0 - 2.5m'):
            lead_url = r.get('A', '')
            if lead_url and 'bazos' in lead_url:
                bazos_id = extract_bazos_phone_id(lead_url)
                upsert_lead({
                    'name': f'Bazoš.sk prodejce #{bazos_id}',
                    'bazos_url': lead_url,
                    'bazos_phone_id': bazos_id,
                    'location': 'SK',
                    'category': 'Bazary & Zastavárny',
                    'source': 'Bazoš SK',
                    'stage': 'lead',
                    'tags': ['Bazoš SK'],
                }, '20.10. leads bazos.sk 0 - 2.5m')

        # 4.2 17.3.2023 leads bazos 0-300K
        for _, r in get_sheet_rows('17.3.2023 leads bazos 0-300K'):
            lead_url = r.get('A', '')
            if lead_url and 'bazos' in lead_url:
                bazos_id = extract_bazos_phone_id(lead_url)
                upsert_lead({
                    'name': f'Bazoš prodejce #{bazos_id}',
                    'bazos_url': lead_url,
                    'bazos_phone_id': bazos_id,
                    'category': 'Bazary & Zastavárny',
                    'source': 'Bazoš CZ',
                    'stage': 'lead',
                    'tags': ['Bazoš CZ 0-300K'],
                }, '17.3.2023 leads bazos 0-300K')

        # 4.3 Date batches with status notes
        date_sheets = [
            ('20.10. 2m - 4m leads bazos', 'F'),
            ('29.8. leads', 'F'),
            ('279 leads', 'G'),
            ('31.8. leads 2m - 3.5m', 'F'),
            ('0 - 100K  29.7.', 'F'),
            ('100K-4M  29.7.', 'F'),
            ('20.10. - 0 - 2M leads bazos', None),
            ('279 leads2', None),
        ]
        for s_name, note_col in date_sheets:
            for _, r in get_sheet_rows(s_name):
                lead_url = r.get('A', '')
                if not lead_url or 'bazos' not in lead_url:
                    continue
                bazos_id = extract_bazos_phone_id(lead_url)
                val_note = r.get(note_col, '') if note_col else ''
                c1_flag = r.get('E', '')
                stage = 'lead'
                email = ''
                note = ''
                if val_note:
                    if '@' in val_note:
                        email = val_note
                    elif 'reality' in val_note.lower():
                        stage = 'lost'
                        note = 'Reality (vyřazeno)'
                    elif 'probere' in val_note.lower():
                        stage = 'warm'
                        note = val_note
                    elif 'auto' in val_note.lower():
                        note = 'Auto'
                    else:
                        note = val_note
                if c1_flag == '1' and stage == 'lead':
                    stage = 'contacted'
                upsert_lead({
                    'name': f'Bazoš prodejce #{bazos_id}',
                    'bazos_url': lead_url,
                    'bazos_phone_id': bazos_id,
                    'email': email,
                    'category': 'Automoto & Autodíly' if note == 'Auto' else 'Bazary & Zastavárny',
                    'source': 'Bazoš CZ',
                    'stage': stage,
                    'notes': note,
                    'tags': ['Dávka Bazoš'],
                }, s_name)

        # --- 5. E-SHOP LISTS ---
        print('5/6 Parsing E-shop lists (Sheet42, eshop list FB, eshopy)...')
        # 5.1 Sheet42 (Bike & Moto shops)
        for _, r in get_sheet_rows('Sheet42'):
            web = r.get('A', '')
            if web:
                dom = normalize_domain(web)
                upsert_lead({
                    'name': dom,
                    'company_name': dom,
                    'website': web,
                    'category': 'Cyklo & Sport',
                    'source': 'E-shopy',
                    'stage': 'lead',
                    'tags': ['Kolo & Moto e-shopy'],
                }, 'Sheet42')

        # 5.2 eshop list FB (bought)
        for _, r in get_sheet_rows('eshop list FB (bought)'):
            web = r.get('A', '')
            if web and '.' in web and not web.startswith('Celkem'):
                dom = normalize_domain(web)
                upsert_lead({
                    'name': dom,
                    'company_name': dom,
                    'website': web,
                    'category': 'E-shopy',
                    'source': 'E-shop FB databáze',
                    'stage': 'lead',
                    'tags': ['FB e-shop import'],
                }, 'eshop list FB (bought)')

        # 5.3 eshopy directories
        for _, r in get_sheet_rows('eshopy'):
            web = r.get('A', '')
            if web and '.' in web and not web.startswith('Seznamy'):
                dom = normalize_domain(web)
                upsert_lead({
                    'name': dom,
                    'company_name': dom,
                    'website': web,
                    'category': 'E-shopy',
                    'source': 'Katalog e-shopů',
                    'stage': 'lead',
                    'tags': ['E-shop katalog'],
                }, 'eshopy')

    # Convert all to clean list
    leads_list = list(leads.values())
    print(f'\nTotal consolidated unique leads: {len(leads_list)}')

    # Stats
    stage_counts = Counter(l['stage'] for l in leads_list)
    cat_counts = Counter(l['category'] for l in leads_list)
    src_counts = Counter(l['source'] for l in leads_list)

    print('\nStage counts:')
    for st, cnt in stage_counts.most_common():
        print(f'  {st:15}: {cnt}')

    print('\nCategory counts:')
    for cat, cnt in cat_counts.most_common():
        print(f'  {cat:25}: {cnt}')

    print('\nSource counts:')
    for src, cnt in src_counts.most_common():
        print(f'  {src:25}: {cnt}')

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(leads_list, f, ensure_ascii=False)
    print(f'\nSaved consolidated leads JSON to {OUTPUT_JSON} (File size: {os.path.getsize(OUTPUT_JSON)/1024/1024:.2f} MB)')

if __name__ == '__main__':
    main()
