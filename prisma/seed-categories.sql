-- Seed categories for Pamaptor
-- Safe to run multiple times (upsert via ON CONFLICT)

INSERT INTO "Category" (id, slug, label, color, "order", "isActive", "createdAt", "updatedAt")
VALUES
  -- Tindak Pidana
  (gen_random_uuid()::text, 'MURDER',             'Tindak Pidana Pembunuhan',                                    '#dc2626',  1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ASSAULT',            'Tindak Pidana Penganiayaan',                                  '#ef4444',  2, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'MOB_VIOLENCE',       'Tindak Pidana Pengeroyokan',                                  '#f97316',  3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'GROUP_FIGHT',        'Tindak Pidana Penyerangan dan Perkelahian Berkelompok (Tawuran)', '#fb923c', 4, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'UNLAWFUL_DETENTION', 'Tindak Pidana Penyekapan',                                    '#f59e0b',  5, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'KIDNAPPING',         'Tindak Pidana Penculikan',                                    '#eab308',  6, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'HOSTAGE',            'Tindak Pidana Penyanderaan',                                  '#ca8a04',  7, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SEXUAL_ASSAULT',     'Tindak Pidana Pencabulan',                                    '#ec4899',  8, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'RAPE',               'Tindak Pidana Perkosaan',                                     '#db2777',  9, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'EXTORTION',          'Tindak Pidana Perundungan',                                   '#a855f7', 10, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'DOMESTIC_VIOLENCE',  'Tindak Pidana Kekerasan dalam Rumah Tangga',                  '#9333ea', 11, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'THEFT',              'Tindak Pidana Pencurian',                                     '#f43f5e', 12, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'THEFT_AGGRAVATED',   'Tindak Pidana Pencurian dengan Pemberatan',                   '#e11d48', 13, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'VEHICLE_THEFT',      'Tindak Pidana Pencurian Kendaraan Bermotor',                  '#be123c', 14, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'LIVESTOCK_THEFT',    'Tindak Pidana Pencurian Ternak',                              '#9f1239', 15, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'HOUSE_THEFT',        'Tindak Pidana Pencurian pada Rumah Kosong',                   '#881337', 16, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'ROBBERY',            'Tindak Pidana Pencurian dengan Kekerasan',                    '#7f1d1d', 17, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'EXTORTION_VIOLENT',  'Tindak Pidana Pemerasan dengan Kekerasan',                    '#6b21a8', 18, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'VANDALISM_WORSHIP',  'Tindak Pidana Perusakan Tempat Ibadah',                       '#1d4ed8', 19, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'VANDALISM_ELECTRIC', 'Tindak Pidana Perusakan Bangunan Listrik',                    '#1e40af', 20, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'VANDALISM_TRAFFIC',  'Tindak Pidana Perusakan Bangunan Lalu Lintas Umum',           '#1e3a8a', 21, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'VANDALISM_BUILDING', 'Tindak Pidana Perusakan Gedung',                              '#1e3a5f', 22, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'VANDALISM_PROPERTY', 'Tindak Pidana Perusakan dan Penghancuran Barang',             '#164e63', 23, true, NOW(), NOW()),
  -- Peristiwa
  (gen_random_uuid()::text, 'BOMB_THREAT',        'Peristiwa Ancaman Bom',                                       '#dc2626', 24, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'TRAFFIC_ACCIDENT',   'Peristiwa Kecelakaan Lalu Lintas',                            '#f97316', 25, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'HIT_AND_RUN',        'Peristiwa Kecelakaan Lalu Lintas Tabrak Lari',                '#ea580c', 26, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PUBLIC_TRANSPORT_ACCIDENT', 'Peristiwa Kecelakaan Angkutan Umum',                   '#c2410c', 27, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'FIRE',               'Peristiwa Kebakaran',                                         '#eab308', 28, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'EARTHQUAKE',         'Peristiwa Gempa Bumi',                                        '#a16207', 29, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'FLOOD',              'Peristiwa Banjir',                                            '#3b82f6', 30, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'LANDSLIDE',          'Peristiwa Tanah Longsor',                                     '#92400e', 31, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'FOUND_BODY',         'Peristiwa Penemuan Mayat',                                    '#374151', 32, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'FOOD_POISONING',     'Peristiwa Keracunan Makanan',                                 '#15803d', 33, true, NOW(), NOW()),
  -- Program
  (gen_random_uuid()::text, 'MBG',                'MBG',                                                          '#0ea5e9', 34, true, NOW(), NOW()),
  -- Lainnya
  (gen_random_uuid()::text, 'OTHERS',             'Lainnya',                                                      '#6b7280', 99, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET
  label      = EXCLUDED.label,
  color      = EXCLUDED.color,
  "order"    = EXCLUDED."order",
  "updatedAt" = NOW();
