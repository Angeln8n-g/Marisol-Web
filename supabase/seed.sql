-- ==============================================================================
-- SEED DATA: Catálogo Completo de Inventario, Insumos Odontológicos y Bandejas Clínicas
-- Clínica Dental Dra. Marisol García
-- ==============================================================================

-- 1. Categorías Odontológicas Especializadas
INSERT INTO inventory_categories (id, name, item_type, description)
VALUES
  ('c881277d-b0da-416a-b9c4-68982187acb1', 'Instrumental Rotatorio y Equipos', 'tool', 'Piezas de mano, turbinas, micromotores, lámparas LED y equipos mayores'),
  ('e787f188-68cd-4c41-af18-d2723274e1e5', 'Materiales Restauradores y Resinas', 'consumable_clinical', 'Composites, ionómeros, sistemas adhesivos, ácidos grabadores y pulidores'),
  ('3ffd1727-c6cd-47d7-9c93-485686b311bb', 'Anestésicos y Quirúrgicos', 'consumable_clinical', 'Anestésicos locales, agujas, bisturíes, suturas y hemostáticos'),
  ('434d6c52-d39c-4cce-a41d-7fafeef9c221', 'Bioseguridad y Protección', 'consumable_clinical', 'Guantes, mascarillas, barreras, eyectores y control de esterilización'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Endodoncia y Obturación', 'consumable_clinical', 'Limas rotatorias, irrigantes, conos de gutapercha y selladores biocerámicos'),
  ('b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', 'Periodoncia y Profilaxis', 'consumable_clinical', 'Pastas profilácticas, copas de goma, barnices y ultrasonido'),
  ('c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', 'Prótesis e Impresiones', 'consumable_clinical', 'Alginatos, siliconas de adición, cementos duales y provisionales'),
  ('8aac26a4-1bab-42be-8cd6-afe7d5f12d64', 'Papelería y Oficina', 'consumable_admin', 'Formularios, recetas, papel membretado y consumibles administrativos'),
  ('6179378e-aadc-4bdf-8f5f-df92548092bc', 'Artículos de Limpieza e Higiene General', 'consumable_admin', 'Desinfectantes hospitalarios, jabón quirúrgico y toallas desechables')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  item_type = EXCLUDED.item_type,
  description = EXCLUDED.description;

-- 2. Artículos de Inventario (Materiales Clínicos, Instrumental y Equipamiento)
-- Sede Centro (06af045e-9aa0-4244-9aa9-e749b24298e4) y Sede Norte (59ab24f5-909a-41c2-bc26-c9b259379286)
INSERT INTO inventory_items (
  id, clinic_id, category_id, name, code, item_type, unit,
  current_stock, minimum_stock, cost_price, brand, serial_number,
  location_room, status, is_active
)
VALUES
  -- ANESTÉSICOS & QUIRÚRGICOS
  (
    '11111111-0001-4000-8000-000000000001',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Anestesia Mepivacaína 2% con Epinefrina 1:100.000',
    'ANES-MEPI-01',
    'consumable_clinical',
    'caja',
    18, 5, 850.00,
    'Septodont (Scandonest)',
    NULL,
    'Gabinete 1 - Refrigerador Farmacia',
    'active', true
  ),
  (
    '11111111-0001-4000-8000-000000000002',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Anestesia Articaína 4% con Epinefrina 1:100.000',
    'ANES-ARTI-02',
    'consumable_clinical',
    'caja',
    12, 4, 1150.00,
    'Septodont (Septanest)',
    NULL,
    'Gabinete 1 - Refrigerador Farmacia',
    'active', true
  ),
  (
    '11111111-0001-4000-8000-000000000003',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Gel Anestésico Tópico Benzocaína 20% Cereza',
    'ANES-TOP-03',
    'consumable_clinical',
    'frasco',
    8, 3, 420.00,
    'Denti-Care',
    NULL,
    'Módulo Dental Central',
    'active', true
  ),
  (
    '11111111-0001-4000-8000-000000000004',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Agujas Dentales Desechables Cortas 30G (100 uds)',
    'AGU-CORT-30G',
    'consumable_clinical',
    'caja',
    25, 6, 380.00,
    'Septoject',
    NULL,
    'Cajón Instrumental A-1',
    'active', true
  ),
  (
    '11111111-0001-4000-8000-000000000005',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Agujas Dentales Desechables Largas 27G (100 uds)',
    'AGU-LARG-27G',
    'consumable_clinical',
    'caja',
    20, 5, 390.00,
    'Septoject',
    NULL,
    'Cajón Instrumental A-1',
    'active', true
  ),
  (
    '11111111-0001-4000-8000-000000000006',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Hojas de Bisturí Quirúrgico Estéril #15 (100 uds)',
    'CIR-BIST-15',
    'consumable_clinical',
    'caja',
    10, 3, 620.00,
    'Swann-Morton',
    NULL,
    'Bandeja Quirúrgica B-2',
    'active', true
  ),
  (
    '11111111-0001-4000-8000-000000000007',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Sutura Reabsorbible Vicryl 4-0 Aguja Curva (36 sobres)',
    'SUT-VIC-40',
    'consumable_clinical',
    'caja',
    6, 2, 1950.00,
    'Ethicon',
    NULL,
    'Bandeja Quirúrgica B-2',
    'active', true
  ),
  (
    '11111111-0001-4000-8000-000000000008',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Sutura Seda Negra 3-0 Aguja Triangular (36 sobres)',
    'SUT-SED-30',
    'consumable_clinical',
    'caja',
    8, 3, 1100.00,
    'Tagum',
    NULL,
    'Bandeja Quirúrgica B-2',
    'active', true
  ),
  (
    '11111111-0001-4000-8000-000000000009',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Esponjas Hemostáticas de Colágeno Gelfoam',
    'CIR-HEMO-01',
    'consumable_clinical',
    'caja',
    5, 2, 1450.00,
    'Pfizer Gelfoam',
    NULL,
    'Bandeja Quirúrgica B-2',
    'active', true
  ),
  (
    '11111111-0001-4000-8000-000000000010',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '3ffd1727-c6cd-47d7-9c93-485686b311bb',
    'Gasas Estériles Odontológicas 5x5 cm (200 paquetes)',
    'BIO-GAS-5X5',
    'consumable_clinical',
    'paquete',
    15, 5, 450.00,
    'Hospital Care',
    NULL,
    'Almacén Central Estéril',
    'active', true
  ),

  -- MATERIALES RESTAURADORES Y RESINAS
  (
    '11111111-0002-4000-8000-000000000001',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Resina Nanohíbrida Filtek Z250 Tono A1 (4g)',
    'RES-Z250-A1',
    'consumable_clinical',
    'jeringa',
    7, 3, 1350.00,
    '3M ESPE',
    NULL,
    'Organizador de Resinas Box 1',
    'active', true
  ),
  (
    '11111111-0002-4000-8000-000000000002',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Resina Nanohíbrida Filtek Z250 Tono A2 (4g)',
    'RES-Z250-A2',
    'consumable_clinical',
    'jeringa',
    14, 4, 1350.00,
    '3M ESPE',
    NULL,
    'Organizador de Resinas Box 1',
    'active', true
  ),
  (
    '11111111-0002-4000-8000-000000000003',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Resina Nanohíbrida Filtek Z250 Tono A3 (4g)',
    'RES-Z250-A3',
    'consumable_clinical',
    'jeringa',
    10, 3, 1350.00,
    '3M ESPE',
    NULL,
    'Organizador de Resinas Box 1',
    'active', true
  ),
  (
    '11111111-0002-4000-8000-000000000004',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Resina Fluida Filtek Supreme Flowable A2 (2g)',
    'RES-FLOW-A2',
    'consumable_clinical',
    'jeringa',
    6, 2, 1100.00,
    '3M ESPE',
    NULL,
    'Organizador de Resinas Box 1',
    'active', true
  ),
  (
    '11111111-0002-4000-8000-000000000005',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Sistema Adhesivo Universal Single Bond Universal (5ml)',
    'ADH-3M-SBU',
    'consumable_clinical',
    'frasco',
    8, 2, 2850.00,
    '3M ESPE',
    NULL,
    'Organizador de Resinas Box 1',
    'active', true
  ),
  (
    '11111111-0002-4000-8000-000000000006',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Ácido Grabador Fosfórico 37% con Puntas (12g)',
    'ACI-FOSF-37',
    'consumable_clinical',
    'jeringa',
    12, 3, 580.00,
    'Prime Dent',
    NULL,
    'Organizador de Resinas Box 1',
    'active', true
  ),
  (
    '11111111-0002-4000-8000-000000000007',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Ionómero de Vidrio de Restauración Ketac Molar',
    'ION-KETAC-MOL',
    'consumable_clinical',
    'caja',
    4, 2, 3200.00,
    '3M ESPE',
    NULL,
    'Estante Restauradores',
    'active', true
  ),
  (
    '11111111-0002-4000-8000-000000000008',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Discos de Pulido y Acabado Sof-Lex Surtidos (240 uds)',
    'PUL-SOF-LEX',
    'consumable_clinical',
    'caja',
    5, 2, 2400.00,
    '3M ESPE',
    NULL,
    'Cajón Pulido y Acabado',
    'active', true
  ),
  (
    '11111111-0002-4000-8000-000000000009',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Dique de Goma Azul Sin Látex (36 hojas)',
    'AIS-DIQ-GOM',
    'consumable_clinical',
    'caja',
    9, 3, 750.00,
    'Sanctuary Dental',
    NULL,
    'Cajón Aislamiento',
    'active', true
  ),
  (
    '11111111-0002-4000-8000-000000000010',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'e787f188-68cd-4c41-af18-d2723274e1e5',
    'Sistema de Matrices Seccionales y Anillos Palodent Plus',
    'MAT-PALO-PLUS',
    'consumable_clinical',
    'set',
    3, 1, 4600.00,
    'Dentsply Sirona',
    NULL,
    'Cajón Aislamiento',
    'active', true
  ),

  -- ENDODONCIA Y OBTURACIÓN
  (
    '11111111-0003-4000-8000-000000000001',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Limas Rotatorias NiTi ProTaper Gold Surtidas SX-F3 (6 uds)',
    'ENDO-PRO-GOLD',
    'consumable_clinical',
    'blister',
    11, 3, 2150.00,
    'Dentsply Maillefer',
    NULL,
    'Gabinete Endodoncia',
    'active', true
  ),
  (
    '11111111-0003-4000-8000-000000000002',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Hipoclorito de Sodio 5.25% para Irrigación Endodóntica (Galón)',
    'ENDO-HIPO-GAL',
    'consumable_clinical',
    'galon',
    4, 2, 650.00,
    'Química Dental RD',
    NULL,
    'Almacén Químicos',
    'active', true
  ),
  (
    '11111111-0003-4000-8000-000000000003',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'EDTA Líquido Quelante al 17% (100ml)',
    'ENDO-EDTA-100',
    'consumable_clinical',
    'frasco',
    5, 2, 890.00,
    'Vista Dental',
    NULL,
    'Gabinete Endodoncia',
    'active', true
  ),
  (
    '11111111-0003-4000-8000-000000000004',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Conos de Gutapercha Cónica Calibre 25 .04 (60 uds)',
    'ENDO-GUTA-25',
    'consumable_clinical',
    'caja',
    8, 3, 720.00,
    'Meta Biomed',
    NULL,
    'Gabinete Endodoncia',
    'active', true
  ),
  (
    '11111111-0003-4000-8000-000000000005',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Cemento Sellador Biocerámico BioRoot RCS (Caja)',
    'ENDO-BIOROOT',
    'consumable_clinical',
    'caja',
    3, 1, 5800.00,
    'Septodont',
    NULL,
    'Gabinete Endodoncia',
    'active', true
  ),

  -- PERIODONCIA Y PROFILAXIS
  (
    '11111111-0004-4000-8000-000000000001',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    'Pasta Profiláctica con Flúor Sabor Menta (200g)',
    'PRO-PAST-200',
    'consumable_clinical',
    'frasco',
    10, 3, 520.00,
    'PreviDent',
    NULL,
    'Cajón Profilaxis',
    'active', true
  ),
  (
    '11111111-0004-4000-8000-000000000002',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    'Copas de Goma para Profilaxis con Pestillo (100 uds)',
    'PRO-COP-100',
    'consumable_clinical',
    'caja',
    6, 2, 450.00,
    'Kerr TotalCare',
    NULL,
    'Cajón Profilaxis',
    'active', true
  ),
  (
    '11111111-0004-4000-8000-000000000003',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    'Barniz de Flúor al 5% Colgate Duraphat (10ml)',
    'PRO-DURAPH-10',
    'consumable_clinical',
    'tubo',
    7, 2, 1250.00,
    'Colgate Oral Care',
    NULL,
    'Cajón Profilaxis',
    'active', true
  ),
  (
    '11111111-0004-4000-8000-000000000004',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    'Gel de Blanqueamiento Dental Peróxido de Hidrógeno 35%',
    'BLANQ-GEL-35',
    'consumable_clinical',
    'jeringa',
    6, 2, 2800.00,
    'Philips Zoom Whitespeed',
    NULL,
    'Refrigerador Farmacia',
    'active', true
  ),
  (
    '11111111-0004-4000-8000-000000000005',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    'Barrera Gingival Fotocurable Líquida (Jeringa 1.2ml)',
    'BLANQ-BARR-GIN',
    'consumable_clinical',
    'jeringa',
    8, 2, 680.00,
    'SDI Pola Dam',
    NULL,
    'Refrigerador Farmacia',
    'active', true
  ),

  -- BIOSEGURIDAD Y PROTECCIÓN
  (
    '11111111-0005-4000-8000-000000000001',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '434d6c52-d39c-4cce-a41d-7fafeef9c221',
    'Guantes de Nitrilo Quirúrgico Sin Polvo Talla M (100 uds)',
    'BIO-GUAN-NIT-M',
    'consumable_clinical',
    'caja',
    35, 10, 480.00,
    'Supermax Aurelia',
    NULL,
    'Almacén Central Bioseguridad',
    'active', true
  ),
  (
    '11111111-0005-4000-8000-000000000002',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '434d6c52-d39c-4cce-a41d-7fafeef9c221',
    'Mascarillas Quirúrgicas de 3 Capas Termoselladas (50 uds)',
    'BIO-MASC-3P',
    'consumable_clinical',
    'caja',
    40, 10, 260.00,
    'Medi-Grip',
    NULL,
    'Almacén Central Bioseguridad',
    'active', true
  ),
  (
    '11111111-0005-4000-8000-000000000003',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '434d6c52-d39c-4cce-a41d-7fafeef9c221',
    'Baberos Dentales Desechables Plastificados (500 uds)',
    'BIO-BAB-DES',
    'consumable_clinical',
    'paquete',
    6, 2, 1100.00,
    'Crosstex',
    NULL,
    'Almacén Central Bioseguridad',
    'active', true
  ),
  (
    '11111111-0005-4000-8000-000000000004',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '434d6c52-d39c-4cce-a41d-7fafeef9c221',
    'Eyectores de Saliva Desechables Transparentes (100 uds)',
    'BIO-EYEC-SAL',
    'consumable_clinical',
    'paquete',
    22, 6, 220.00,
    'Euronda Monoart',
    NULL,
    'Almacén Central Bioseguridad',
    'active', true
  ),
  (
    '11111111-0005-4000-8000-000000000005',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    '434d6c52-d39c-4cce-a41d-7fafeef9c221',
    'Bolsas para Esterilización en Autoclave 90x230mm (200 uds)',
    'BIO-BOLS-AUTOC',
    'consumable_clinical',
    'caja',
    10, 3, 560.00,
    'Medicom Safe-Seal',
    NULL,
    'Área de Esterilización',
    'active', true
  ),

  -- HERRAMIENTAS & EQUIPAMIENTO CLÍNICO (tool)
  (
    '11111111-0006-4000-8000-000000000001',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'c881277d-b0da-416a-b9c4-68982187acb1',
    'Autoclave de Vapor Clase B 18 Litros Digital',
    'EQ-AUTOC-18L',
    'tool',
    'unidad',
    1, 1, 245000.00,
    'W&H (Lisa 500)',
    'SN-WH-LISA-9981',
    'Central de Esterilización',
    'active', true
  ),
  (
    '11111111-0006-4000-8000-000000000002',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'c881277d-b0da-416a-b9c4-68982187acb1',
    'Lámpara de Fotocurado LED Inalámbrica 1500 mW/cm²',
    'EQ-LAMP-FOTO-01',
    'tool',
    'unidad',
    3, 1, 16500.00,
    'Woodpecker (O-Light)',
    'SN-WOOD-OL-4041',
    'Box Odontológico 1 y 2',
    'active', true
  ),
  (
    '11111111-0006-4000-8000-000000000003',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'c881277d-b0da-416a-b9c4-68982187acb1',
    'Turbina de Alta Velocidad Neumática con Luz LED Push Button',
    'EQ-TURB-ALTA-01',
    'tool',
    'unidad',
    4, 2, 14200.00,
    'NSK (Pana-Max Plus)',
    'SN-NSK-PMX-7720',
    'Bandeja Instrumental Quirúrgico',
    'active', true
  ),
  (
    '11111111-0006-4000-8000-000000000004',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'c881277d-b0da-416a-b9c4-68982187acb1',
    'Unidad Dental de Profilaxis por Ultrasonido Cavitron UDS-J',
    'EQ-CAVIT-ULTRA',
    'tool',
    'unidad',
    2, 1, 28000.00,
    'Woodpecker Dental',
    'SN-WP-UDS-8819',
    'Box Odontológico 1',
    'active', true
  ),
  (
    '11111111-0006-4000-8000-000000000005',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'c881277d-b0da-416a-b9c4-68982187acb1',
    'Motor de Endodoncia Inalámbrico con Localizador Apical Integrado',
    'EQ-ENDO-MOTOR',
    'tool',
    'unidad',
    2, 1, 48500.00,
    'Dentsply Maillefer (X-Smart Plus)',
    'SN-DENT-XS-5521',
    'Gabinete Endodoncia',
    'active', true
  ),
  (
    '11111111-0006-4000-8000-000000000006',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'c881277d-b0da-416a-b9c4-68982187acb1',
    'Lámpara de Blanqueamiento Dental Profesional LED Zoom',
    'EQ-BLANQ-ZOOM',
    'tool',
    'unidad',
    1, 1, 95000.00,
    'Philips Zoom Whitespeed',
    'SN-PH-ZM-3301',
    'Box Odontológico 2 (Estética)',
    'active', true
  ),
  (
    '11111111-0006-4000-8000-000000000007',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'c881277d-b0da-416a-b9c4-68982187acb1',
    'Compresor de Aire Dental Libre de Aceite 50L Silencioso',
    'EQ-COMPR-50L',
    'tool',
    'unidad',
    1, 1, 75000.00,
    'Cattani Dental Air',
    'SN-CAT-50L-1102',
    'Cuarto de Máquinas y Compresores',
    'active', true
  ),
  (
    '11111111-0006-4000-8000-000000000008',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'c881277d-b0da-416a-b9c4-68982187acb1',
    'Sensor Radiográfico Digital Intraoral CMOS Tamaño 2',
    'EQ-RAD-SENSOR',
    'tool',
    'unidad',
    2, 1, 135000.00,
    'Carestream Dental (RVG 5200)',
    'SN-CS-RVG-2022',
    'Sala de Radiología Digital',
    'active', true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  current_stock = EXCLUDED.current_stock,
  cost_price = EXCLUDED.cost_price,
  status = EXCLUDED.status;

-- 3. Lotes Clínicos con Algoritmo FEFO (First Expired, First Out)
INSERT INTO inventory_batches (
  id, item_id, batch_number, initial_quantity, current_quantity,
  expiration_date, received_date, status
)
VALUES
  -- Lotes de Mepivacaína (un lote próximo a vencer a 45 días para alertar en la UI)
  (
    '22222222-0001-4000-8000-000000000001',
    '11111111-0001-4000-8000-000000000001',
    'LOT-MEPI-2026-SOON',
    10, 4,
    CURRENT_DATE + INTERVAL '42 days',
    CURRENT_DATE - INTERVAL '180 days',
    'active'
  ),
  (
    '22222222-0001-4000-8000-000000000002',
    '11111111-0001-4000-8000-000000000001',
    'LOT-MEPI-2027-VIG',
    20, 14,
    CURRENT_DATE + INTERVAL '480 days',
    CURRENT_DATE - INTERVAL '30 days',
    'active'
  ),
  -- Lotes de Articaína
  (
    '22222222-0001-4000-8000-000000000003',
    '11111111-0001-4000-8000-000000000002',
    'LOT-ARTI-2027-A',
    15, 12,
    CURRENT_DATE + INTERVAL '520 days',
    CURRENT_DATE - INTERVAL '20 days',
    'active'
  ),
  -- Lotes de Resina Filtek Z250 A2
  (
    '22222222-0002-4000-8000-000000000001',
    '11111111-0002-4000-8000-000000000002',
    'LOT-Z250-A2-VIG',
    15, 14,
    CURRENT_DATE + INTERVAL '360 days',
    CURRENT_DATE - INTERVAL '40 days',
    'active'
  ),
  -- Lotes de Gel Blanqueamiento (un lote crítico que vence en 35 días)
  (
    '22222222-0004-4000-8000-000000000001',
    '11111111-0004-4000-8000-000000000004',
    'LOT-ZOOM-2026-EXP',
    5, 2,
    CURRENT_DATE + INTERVAL '35 days',
    CURRENT_DATE - INTERVAL '90 days',
    'active'
  ),
  (
    '22222222-0004-4000-8000-000000000002',
    '11111111-0004-4000-8000-000000000004',
    'LOT-ZOOM-2027-NEW',
    6, 4,
    CURRENT_DATE + INTERVAL '400 days',
    CURRENT_DATE - INTERVAL '15 days',
    'active'
  ),
  -- Lotes de Adhesivo Universal
  (
    '22222222-0002-4000-8000-000000000002',
    '11111111-0002-4000-8000-000000000005',
    'LOT-SBU-3M-2027',
    10, 8,
    CURRENT_DATE + INTERVAL '600 days',
    CURRENT_DATE - INTERVAL '10 days',
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  current_quantity = EXCLUDED.current_quantity,
  expiration_date = EXCLUDED.expiration_date;

-- 4. Servicios Técnicos y Mantenimiento de Equipos
INSERT INTO equipment_maintenance (
  id, item_id, clinic_id, maintenance_type, title,
  technician_name, technician_contact, scheduled_date, completed_date,
  cost, findings, actions_taken, next_maintenance_date, status
)
VALUES
  (
    '33333333-0001-4000-8000-000000000001',
    '11111111-0006-4000-8000-000000000001',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'preventive',
    'Calibración Semestral y Test de Hermeticidad Autoclave W&H',
    'Ing. Rafael Castillo (Dental Tech Dominicana)',
    '809-555-4090',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '30 days',
    4500.00,
    'Presión y temperatura dentro de parámetros ISO 13060. Test de vacío y ciclo de vapor B superados.',
    'Limpieza ultrasónica de cámara de condensación y sustitución de filtro bacteriológico.',
    CURRENT_DATE + INTERVAL '150 days',
    'completed'
  ),
  (
    '33333333-0001-4000-8000-000000000002',
    '11111111-0006-4000-8000-000000000007',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'preventive',
    'Mantenimiento de Filtros y Purga Compresor Cattani',
    'Servicios Biomédicos del Caribe',
    '809-555-8811',
    CURRENT_DATE + INTERVAL '15 days',
    NULL,
    3800.00,
    NULL,
    NULL,
    CURRENT_DATE + INTERVAL '195 days',
    'scheduled'
  ),
  (
    '33333333-0001-4000-8000-000000000003',
    '11111111-0006-4000-8000-000000000003',
    '06af045e-9aa0-4244-9aa9-e749b24298e4',
    'corrective',
    'Cambio de Rotor Cerámico y O-Rings Turbina NSK',
    'Ing. Rafael Castillo (Dental Tech Dominicana)',
    '809-555-4090',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '5 days',
    2800.00,
    'Vibración anormal y baja presión por desgaste de baleros cerámicos.',
    'Instalación de cartucho de repuesto original NSK y lubricación técnica.',
    CURRENT_DATE + INTERVAL '180 days',
    'completed'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status;

-- 5. BANDEJAS CLÍNICAS POR PROCEDIMIENTO (procedure_supplies)
-- Vincula los procedimientos odontológicos existentes con sus materiales e instrumental

-- A. Profilaxis (9b90049d-8eb0-4f1b-ab48-a18add7dec77)
INSERT INTO procedure_supplies (procedure_id, item_id, quantity, is_optional, notes)
VALUES
  ('9b90049d-8eb0-4f1b-ab48-a18add7dec77', '11111111-0004-4000-8000-000000000001', 0.1, false, 'Pasta profiláctica con flúor (dosis estándar 5g)'),
  ('9b90049d-8eb0-4f1b-ab48-a18add7dec77', '11111111-0004-4000-8000-000000000002', 1.0, false, 'Copa de goma desechable para contra-ángulo'),
  ('9b90049d-8eb0-4f1b-ab48-a18add7dec77', '11111111-0005-4000-8000-000000000003', 1.0, false, 'Babero protector impermeable'),
  ('9b90049d-8eb0-4f1b-ab48-a18add7dec77', '11111111-0005-4000-8000-000000000004', 1.0, false, 'Eyector de saliva desechable'),
  ('9b90049d-8eb0-4f1b-ab48-a18add7dec77', '11111111-0004-4000-8000-000000000003', 0.1, true, 'Barniz de flúor si hay hipersensibilidad dentinaria'),
  ('9b90049d-8eb0-4f1b-ab48-a18add7dec77', '11111111-0006-4000-8000-000000000004', 1.0, false, 'Unidad de Ultrasonido Cavitron estéril')
ON CONFLICT (procedure_id, item_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  is_optional = EXCLUDED.is_optional,
  notes = EXCLUDED.notes;

-- B. Estética Dental y Diseño de Sonrisa / Resina Compuesta (d561c53b-bf9e-4dcc-862d-d578ec648519)
INSERT INTO procedure_supplies (procedure_id, item_id, quantity, is_optional, notes)
VALUES
  ('d561c53b-bf9e-4dcc-862d-d578ec648519', '11111111-0001-4000-8000-000000000001', 1.0, false, '1 carpule de anestesia local infiltrativa'),
  ('d561c53b-bf9e-4dcc-862d-d578ec648519', '11111111-0001-4000-8000-000000000004', 1.0, false, 'Aguja corta desechable 30G'),
  ('d561c53b-bf9e-4dcc-862d-d578ec648519', '11111111-0002-4000-8000-000000000009', 1.0, false, 'Hoja de dique de goma para aislamiento absoluto'),
  ('d561c53b-bf9e-4dcc-862d-d578ec648519', '11111111-0002-4000-8000-000000000006', 0.2, false, 'Grabado con ácido fosfórico 37% por 15 segundos'),
  ('d561c53b-bf9e-4dcc-862d-d578ec648519', '11111111-0002-4000-8000-000000000005', 0.1, false, 'Adhesivo Single Bond Universal'),
  ('d561c53b-bf9e-4dcc-862d-d578ec648519', '11111111-0002-4000-8000-000000000002', 0.25, false, 'Resina nanohíbrida tono A2 (dosis ~1g)'),
  ('d561c53b-bf9e-4dcc-862d-d578ec648519', '11111111-0002-4000-8000-000000000008', 2.0, false, 'Discos Sof-Lex para contorneado y brillo final'),
  ('d561c53b-bf9e-4dcc-862d-d578ec648519', '11111111-0006-4000-8000-000000000002', 1.0, false, 'Lámpara de fotocurado LED'),
  ('d561c53b-bf9e-4dcc-862d-d578ec648519', '11111111-0006-4000-8000-000000000003', 1.0, false, 'Turbina de alta velocidad esterilizada')
ON CONFLICT (procedure_id, item_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  is_optional = EXCLUDED.is_optional,
  notes = EXCLUDED.notes;

-- C. Endodoncia (61c8d13b-5636-49d8-8afc-ed1c6c7bec87)
INSERT INTO procedure_supplies (procedure_id, item_id, quantity, is_optional, notes)
VALUES
  ('61c8d13b-5636-49d8-8afc-ed1c6c7bec87', '11111111-0001-4000-8000-000000000002', 1.0, false, 'Articaína 4% bloqueo troncular o infiltrativo'),
  ('61c8d13b-5636-49d8-8afc-ed1c6c7bec87', '11111111-0001-4000-8000-000000000005', 1.0, false, 'Aguja larga 27G para troncular'),
  ('61c8d13b-5636-49d8-8afc-ed1c6c7bec87', '11111111-0002-4000-8000-000000000009', 1.0, false, 'Dique de goma para aislamiento estricto'),
  ('61c8d13b-5636-49d8-8afc-ed1c6c7bec87', '11111111-0003-4000-8000-000000000001', 1.0, false, 'Juego de limas rotatorias ProTaper Gold'),
  ('61c8d13b-5636-49d8-8afc-ed1c6c7bec87', '11111111-0003-4000-8000-000000000002', 0.05, false, 'Hipoclorito de sodio 5.25% para irrigación continua'),
  ('61c8d13b-5636-49d8-8afc-ed1c6c7bec87', '11111111-0003-4000-8000-000000000003', 0.1, false, 'Quelante EDTA para remover barrillo dentinario'),
  ('61c8d13b-5636-49d8-8afc-ed1c6c7bec87', '11111111-0003-4000-8000-000000000004', 3.0, false, 'Conos de gutapercha calibre según conductometría'),
  ('61c8d13b-5636-49d8-8afc-ed1c6c7bec87', '11111111-0003-4000-8000-000000000005', 0.1, false, 'Cemento sellador biocerámico BioRoot'),
  ('61c8d13b-5636-49d8-8afc-ed1c6c7bec87', '11111111-0006-4000-8000-000000000005', 1.0, false, 'Motor de Endodoncia con Localizador Apical')
ON CONFLICT (procedure_id, item_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  is_optional = EXCLUDED.is_optional,
  notes = EXCLUDED.notes;

-- D. Implantes Dentales / Cirugía (08997e93-b09d-4415-bdb2-84bdbc8973b5)
INSERT INTO procedure_supplies (procedure_id, item_id, quantity, is_optional, notes)
VALUES
  ('08997e93-b09d-4415-bdb2-84bdbc8973b5', '11111111-0001-4000-8000-000000000002', 2.0, false, '2 carpules de Articaína 4%'),
  ('08997e93-b09d-4415-bdb2-84bdbc8973b5', '11111111-0001-4000-8000-000000000006', 1.0, false, 'Hoja de bisturí #15 estéril'),
  ('08997e93-b09d-4415-bdb2-84bdbc8973b5', '11111111-0001-4000-8000-000000000007', 1.0, false, 'Sutura reabsorbible Vicryl 4-0'),
  ('08997e93-b09d-4415-bdb2-84bdbc8973b5', '11111111-0001-4000-8000-000000000009', 1.0, true, 'Esponja de colágeno Gelfoam si se requiere hemostasia'),
  ('08997e93-b09d-4415-bdb2-84bdbc8973b5', '11111111-0001-4000-8000-000000000010', 2.0, false, '2 paquetes de gasas estériles para campo quirúrgico'),
  ('08997e93-b09d-4415-bdb2-84bdbc8973b5', '11111111-0005-4000-8000-000000000001', 2.0, false, 'Guantes estériles quirúrgicos cirujano + asistente')
ON CONFLICT (procedure_id, item_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  is_optional = EXCLUDED.is_optional,
  notes = EXCLUDED.notes;

-- E. Blanqueamiento Dental LED (55777498-eeb3-41b9-9b23-d92be0aee477)
INSERT INTO procedure_supplies (procedure_id, item_id, quantity, is_optional, notes)
VALUES
  ('55777498-eeb3-41b9-9b23-d92be0aee477', '11111111-0004-4000-8000-000000000004', 1.0, false, 'Jeringa de peróxido de hidrógeno al 35%'),
  ('55777498-eeb3-41b9-9b23-d92be0aee477', '11111111-0004-4000-8000-000000000005', 1.0, false, 'Barrera gingival fotocurable líquida'),
  ('55777498-eeb3-41b9-9b23-d92be0aee477', '11111111-0005-4000-8000-000000000003', 1.0, false, 'Babero impermeable protector'),
  ('55777498-eeb3-41b9-9b23-d92be0aee477', '11111111-0006-4000-8000-000000000006', 1.0, false, 'Lámpara de Blanqueamiento LED Zoom Whitespeed')
ON CONFLICT (procedure_id, item_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  is_optional = EXCLUDED.is_optional,
  notes = EXCLUDED.notes;
