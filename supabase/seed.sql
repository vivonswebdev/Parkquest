-- ============================================================================
-- ParkQuest — SEED DE DÉMONSTRATION (généré, ne pas modifier à la main)
-- Source : src/features/demo/*  ·  Générateur : scripts/generate-seed.ts
--
-- ⚠️ Toutes ces données sont des DONNÉES DE DÉMONSTRATION (is_demo_data = true).
-- Elles ne doivent jamais être présentées comme officielles sans validation
-- et autorisation du parc concerné (voir docs/DEMO_DATA_VALIDATION.md).
-- ============================================================================

begin;

insert into public.parks (id, slug, type, status, is_demo_data, country_code, city, timezone, default_locale, available_locales, location, boundary, default_zoom, brand_color, cover_image_url, is_free, is_pmr_friendly, tags) values
  ('00000001-0000-4000-8000-000000000001', 'plantentuin-meise', 'BOTANICAL_GARDEN', 'PUBLISHED', true, 'BE', 'Meise', 'Europe/Brussels', 'nl', array['fr', 'nl', 'en', 'es', 'de']::text[], extensions.st_setsrid(extensions.st_makepoint(4.3268, 50.9276), 4326)::extensions.geography, extensions.st_makeenvelope(4.3176, 50.9238, 4.3352, 50.9318, 4326)::extensions.geography, 15.6, '#19E6A2', '/demo/parks/meise.svg', false, true, array['botanical', 'family', 'photo', 'pmr', 'historic']::text[]),
  ('00000001-0000-4000-8000-000000000002', 'dendermonde-vallee-escaut', 'NATURAL_PARK', 'PUBLISHED', true, 'BE', 'Dendermonde', 'Europe/Brussels', 'nl', array['nl', 'fr', 'en']::text[], extensions.st_setsrid(extensions.st_makepoint(4.1016, 51.0286), 4326)::extensions.geography, extensions.st_makeenvelope(4.0920000000000005, 51.0226, 4.1112, 51.0346, 4326)::extensions.geography, 14.5, null, '/demo/parks/dendermonde.svg', true, false, array['nature', 'river', 'walk', 'free']::text[]),
  ('00000001-0000-4000-8000-000000000003', 'domaine-solvay-la-hulpe', 'HISTORIC_PARK', 'PUBLISHED', true, 'BE', 'La Hulpe', 'Europe/Brussels', 'fr', array['fr', 'nl', 'en']::text[], extensions.st_setsrid(extensions.st_makepoint(4.4313, 50.7303), 4326)::extensions.geography, extensions.st_makeenvelope(4.4217, 50.7243, 4.4409, 50.7363, 4326)::extensions.geography, 14.5, null, '/demo/parks/la-hulpe.svg', true, false, array['historic', 'castle', 'pond', 'forest', 'free']::text[]);

insert into public.park_translations (park_id, locale, name, tagline, description, practical_notes, accessibility_notes, transport_notes, rules) values
  ('00000001-0000-4000-8000-000000000001', 'fr', 'Plantentuin Meise', 'Jardin botanique · Meise, Belgique', 'Un vaste jardin botanique autour d''un château, avec des arbres remarquables, des serres et des jardins thématiques. Parfait pour une visite en famille.', 'Prévoyez de bonnes chaussures : certains chemins sont en gravier. Les chiens ne sont pas admis (donnée de démonstration).', 'Les allées principales sont accessibles en fauteuil. Certains sentiers en forêt sont en terre battue.', 'Bus depuis Bruxelles-Nord, arrêt « Plantentuin » (donnée de démonstration).', 'Restez sur les chemins, ne cueillez pas les plantes, emportez vos déchets. Pique-nique autorisé dans les zones prévues.'),
  ('00000001-0000-4000-8000-000000000001', 'nl', 'Plantentuin Meise', 'Botanische tuin · Meise, België', 'Een uitgestrekte botanische tuin rond een kasteel, met merkwaardige bomen, serres en thematuinen. Ideaal voor een gezinsbezoek.', 'Draag goede schoenen: sommige paden zijn in grind. Honden zijn niet toegelaten (demogegevens).', 'De hoofdpaden zijn toegankelijk met een rolstoel. Sommige bospaden zijn onverhard.', 'Bus vanaf Brussel-Noord, halte « Plantentuin » (demogegevens).', 'Blijf op de paden, pluk geen planten, neem je afval mee. Picknicken mag in de voorziene zones.'),
  ('00000001-0000-4000-8000-000000000001', 'en', 'Meise Botanic Garden', 'Botanic garden · Meise, Belgium', 'A vast botanic garden around a castle, with remarkable trees, glasshouses and themed gardens. Perfect for a family visit.', 'Wear good shoes: some paths are gravel. Dogs are not allowed (demo data).', 'Main paths are wheelchair accessible. Some woodland trails are unpaved.', 'Bus from Brussels-North, stop “Plantentuin” (demo data).', 'Stay on the paths, do not pick plants, take your litter home. Picnics allowed in designated areas.'),
  ('00000001-0000-4000-8000-000000000001', 'es', 'Jardín Botánico de Meise', 'Jardín botánico · Meise, Bélgica', 'Un gran jardín botánico alrededor de un castillo, con árboles notables, invernaderos y jardines temáticos.', null, null, null, null),
  ('00000001-0000-4000-8000-000000000001', 'de', 'Botanischer Garten Meise', 'Botanischer Garten · Meise, Belgien', 'Ein weitläufiger botanischer Garten rund um ein Schloss, mit bemerkenswerten Bäumen, Gewächshäusern und Themengärten.', null, null, null, null),
  ('00000001-0000-4000-8000-000000000002', 'fr', 'Dendermonde — Vallée de l''Escaut', 'Nature fluviale, promenades et patrimoine · Dendermonde, Belgique', null, null, null, null, null),
  ('00000001-0000-4000-8000-000000000002', 'nl', 'Dendermonde — Scheldevallei', 'Riviernatuur, wandelingen en erfgoed · Dendermonde, België', null, null, null, null, null),
  ('00000001-0000-4000-8000-000000000002', 'en', 'Dendermonde — Scheldt Valley', 'River nature, walks and heritage · Dendermonde, Belgium', null, null, null, null, null),
  ('00000001-0000-4000-8000-000000000003', 'fr', 'Domaine régional Solvay — Château de La Hulpe', 'Château, étangs, bois et rhododendrons · La Hulpe, Belgique', null, null, null, null, null),
  ('00000001-0000-4000-8000-000000000003', 'nl', 'Domein Solvay — Kasteel van Terhulpen', 'Kasteel, vijvers, bossen en rododendrons · Terhulpen, België', null, null, null, null, null),
  ('00000001-0000-4000-8000-000000000003', 'en', 'Solvay Regional Estate — La Hulpe Castle', 'Castle, ponds, woods and rhododendrons · La Hulpe, Belgium', null, null, null, null, null);

insert into public.park_practical_info (park_id, address_line, postal_code, website_url, ticket_url, phone, opening_hours, prices) values
  ('00000001-0000-4000-8000-000000000001', 'Nieuwelaan 38', '1860 Meise', 'https://www.plantentuinmeise.be', 'https://www.plantentuinmeise.be', null, '[{"days":[1,2,3,4,5,6,7],"open":"09:30","close":"18:00","season":"summer"},{"days":[1,2,3,4,5,6,7],"open":"09:30","close":"17:00","season":"winter"}]'::jsonb, '[{"label_key":"adult","amount":8,"currency":"EUR"},{"label_key":"senior","amount":7,"currency":"EUR"},{"label_key":"child","amount":2,"currency":"EUR"},{"label_key":"free","amount":0,"currency":"EUR"}]'::jsonb);

insert into public.spot_categories (id, park_id, key, icon, color, sort_order) values
  ('00000002-0000-4000-8000-000000000001', null, 'remarkable-trees', 'tree-deciduous', '#19E6A2', 1),
  ('00000002-0000-4000-8000-000000000002', null, 'flowers', 'flower-2', '#F28DB2', 2),
  ('00000002-0000-4000-8000-000000000003', null, 'gardens', 'sprout', '#8AF4C9', 3),
  ('00000002-0000-4000-8000-000000000004', null, 'history', 'landmark', '#F4C95D', 4),
  ('00000002-0000-4000-8000-000000000005', null, 'viewpoints', 'mountain', '#9DB8FF', 5),
  ('00000002-0000-4000-8000-000000000006', null, 'water', 'waves', '#5CC8FF', 6),
  ('00000002-0000-4000-8000-000000000007', null, 'glasshouses', 'warehouse', '#C9A7FF', 7);

insert into public.spot_category_translations (category_id, locale, name) values
  ('00000002-0000-4000-8000-000000000001', 'fr', 'Arbres remarquables'),
  ('00000002-0000-4000-8000-000000000001', 'nl', 'Merkwaardige bomen'),
  ('00000002-0000-4000-8000-000000000001', 'en', 'Remarkable trees'),
  ('00000002-0000-4000-8000-000000000001', 'es', 'Árboles notables'),
  ('00000002-0000-4000-8000-000000000001', 'de', 'Bemerkenswerte Bäume'),
  ('00000002-0000-4000-8000-000000000002', 'fr', 'Fleurs'),
  ('00000002-0000-4000-8000-000000000002', 'nl', 'Bloemen'),
  ('00000002-0000-4000-8000-000000000002', 'en', 'Flowers'),
  ('00000002-0000-4000-8000-000000000002', 'es', 'Flores'),
  ('00000002-0000-4000-8000-000000000002', 'de', 'Blumen'),
  ('00000002-0000-4000-8000-000000000003', 'fr', 'Jardins thématiques'),
  ('00000002-0000-4000-8000-000000000003', 'nl', 'Thematuinen'),
  ('00000002-0000-4000-8000-000000000003', 'en', 'Themed gardens'),
  ('00000002-0000-4000-8000-000000000003', 'es', 'Jardines temáticos'),
  ('00000002-0000-4000-8000-000000000003', 'de', 'Themengärten'),
  ('00000002-0000-4000-8000-000000000004', 'fr', 'Histoire'),
  ('00000002-0000-4000-8000-000000000004', 'nl', 'Geschiedenis'),
  ('00000002-0000-4000-8000-000000000004', 'en', 'History'),
  ('00000002-0000-4000-8000-000000000004', 'es', 'Historia'),
  ('00000002-0000-4000-8000-000000000004', 'de', 'Geschichte'),
  ('00000002-0000-4000-8000-000000000005', 'fr', 'Points de vue'),
  ('00000002-0000-4000-8000-000000000005', 'nl', 'Uitkijkpunten'),
  ('00000002-0000-4000-8000-000000000005', 'en', 'Viewpoints'),
  ('00000002-0000-4000-8000-000000000005', 'es', 'Miradores'),
  ('00000002-0000-4000-8000-000000000005', 'de', 'Aussichtspunkte'),
  ('00000002-0000-4000-8000-000000000006', 'fr', 'Eau'),
  ('00000002-0000-4000-8000-000000000006', 'nl', 'Water'),
  ('00000002-0000-4000-8000-000000000006', 'en', 'Water'),
  ('00000002-0000-4000-8000-000000000006', 'es', 'Agua'),
  ('00000002-0000-4000-8000-000000000006', 'de', 'Wasser'),
  ('00000002-0000-4000-8000-000000000007', 'fr', 'Serres'),
  ('00000002-0000-4000-8000-000000000007', 'nl', 'Serres'),
  ('00000002-0000-4000-8000-000000000007', 'en', 'Glasshouses'),
  ('00000002-0000-4000-8000-000000000007', 'es', 'Invernaderos'),
  ('00000002-0000-4000-8000-000000000007', 'de', 'Gewächshäuser');

insert into public.spots (id, park_id, slug, kind, status, is_demo_data, location, discovery_radius_m, scientific_name, facts, cover_image_url, is_pmr_accessible, points_value, sort_order) values
  ('00000003-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'sequoia-geant', 'TREE', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32505, 50.92845), 4326)::extensions.geography, 35, 'Sequoiadendron giganteum', '{"origin_key":"north_america","planted_year":1923,"height_m":38,"girth_m":7.2}'::jsonb, '/demo/spots/sequoia.svg', true, 10, 1),
  ('00000003-0000-4000-8000-000000000002', '00000001-0000-4000-8000-000000000001', 'chene-remarquable', 'TREE', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32365, 50.92705), 4326)::extensions.geography, 35, 'Quercus robur', '{"origin_key":"europe","planted_year":1850,"height_m":27,"girth_m":5.1}'::jsonb, '/demo/spots/oak.svg', true, 10, 2),
  ('00000003-0000-4000-8000-000000000003', '00000001-0000-4000-8000-000000000001', 'magnolia', 'FLOWER', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32615, 50.92615), 4326)::extensions.geography, 30, 'Magnolia × soulangeana', '{"origin_key":"asia","bloom_months":[3,4]}'::jsonb, '/demo/spots/magnolia.svg', true, 10, 3),
  ('00000003-0000-4000-8000-000000000004', '00000001-0000-4000-8000-000000000001', 'jardin-des-roses', 'GARDEN', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32905, 50.92585), 4326)::extensions.geography, 45, null, '{"bloom_months":[6,7,8,9]}'::jsonb, '/demo/spots/roses.svg', true, 10, 4),
  ('00000003-0000-4000-8000-000000000005', '00000001-0000-4000-8000-000000000001', 'point-de-vue', 'VIEWPOINT', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.33055, 50.92735), 4326)::extensions.geography, 40, null, '{}'::jsonb, '/demo/spots/viewpoint.svg', false, 10, 5),
  ('00000003-0000-4000-8000-000000000006', '00000001-0000-4000-8000-000000000001', 'pavillon-historique', 'HISTORIC', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32885, 50.92875), 4326)::extensions.geography, 40, null, '{"built_year":1890}'::jsonb, '/demo/spots/pavilion.svg', true, 10, 6),
  ('00000003-0000-4000-8000-000000000007', '00000001-0000-4000-8000-000000000001', 'ginkgo', 'TREE', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32415, 50.92945), 4326)::extensions.geography, 30, 'Ginkgo biloba', '{"origin_key":"asia","height_m":21}'::jsonb, '/demo/spots/ginkgo.svg', null, 10, 7),
  ('00000003-0000-4000-8000-000000000008', '00000001-0000-4000-8000-000000000001', 'cedre-du-liban', 'TREE', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32195, 50.92795), 4326)::extensions.geography, 35, 'Cedrus libani', '{"origin_key":"middle_east","height_m":25}'::jsonb, '/demo/spots/cedar.svg', null, 10, 8),
  ('00000003-0000-4000-8000-000000000009', '00000001-0000-4000-8000-000000000001', 'hetre-pourpre', 'TREE', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32745, 50.92985), 4326)::extensions.geography, 35, 'Fagus sylvatica f. purpurea', '{"origin_key":"europe","height_m":24}'::jsonb, '/demo/spots/beech.svg', null, 10, 9),
  ('00000003-0000-4000-8000-00000000000a', '00000001-0000-4000-8000-000000000001', 'etang', 'WATER', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32825, 50.92665), 4326)::extensions.geography, 60, null, '{}'::jsonb, '/demo/spots/pond.svg', true, 10, 10),
  ('00000003-0000-4000-8000-00000000000b', '00000001-0000-4000-8000-000000000001', 'grandes-serres', 'BUILDING', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32575, 50.92905), 4326)::extensions.geography, 50, null, '{}'::jsonb, '/demo/spots/glasshouse.svg', true, 10, 11),
  ('00000003-0000-4000-8000-00000000000c', '00000001-0000-4000-8000-000000000001', 'bambouseraie', 'PLANT', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.32475, 50.92535), 4326)::extensions.geography, 35, 'Phyllostachys sp.', '{"origin_key":"asia"}'::jsonb, '/demo/spots/bamboo.svg', null, 10, 12);

insert into public.spot_translations (spot_id, locale, name, label, summary, about, fun_fact, directions, origin) values
  ('00000003-0000-4000-8000-000000000001', 'fr', 'Séquoia géant', 'Arbre remarquable', 'Un géant venu des montagnes de Californie.', 'Le séquoia géant est l''un des plus grands êtres vivants de la planète. Son écorce épaisse et spongieuse le protège des incendies. Celui-ci aurait été planté il y a une centaine d''années.', 'Les séquoias géants peuvent vivre plus de 3 000 ans !', 'Depuis l''entrée, suivez l''allée principale puis prenez à gauche après la grande pelouse.', 'Californie, États-Unis'),
  ('00000003-0000-4000-8000-000000000001', 'nl', 'Mammoetboom', 'Merkwaardige boom', 'Een reus uit de bergen van Californië.', 'De mammoetboom is een van de grootste levende wezens op aarde. Zijn dikke, sponsachtige schors beschermt hem tegen bosbranden. Deze boom zou zo''n honderd jaar geleden geplant zijn.', 'Mammoetbomen kunnen meer dan 3 000 jaar oud worden!', 'Volg vanaf de ingang de hoofddreef en sla links af na het grote grasveld.', 'Californië, Verenigde Staten'),
  ('00000003-0000-4000-8000-000000000001', 'en', 'Giant sequoia', 'Remarkable tree', 'A giant from the mountains of California.', 'The giant sequoia is one of the largest living things on Earth. Its thick, spongy bark protects it from wildfires. This one is said to have been planted about a hundred years ago.', 'Giant sequoias can live for more than 3,000 years!', 'From the entrance, follow the main avenue and turn left after the large lawn.', 'California, USA'),
  ('00000003-0000-4000-8000-000000000001', 'es', 'Secuoya gigante', 'Árbol notable', null, null, null, null, 'California, EE. UU.'),
  ('00000003-0000-4000-8000-000000000001', 'de', 'Riesenmammutbaum', 'Bemerkenswerter Baum', null, null, null, null, 'Kalifornien, USA'),
  ('00000003-0000-4000-8000-000000000002', 'fr', 'Chêne remarquable', 'Arbre remarquable', 'Un chêne pédonculé plus que centenaire.', 'Le chêne pédonculé abrite des centaines d''espèces d''insectes, d''oiseaux et de champignons. Ses glands, portés par un long pédoncule, lui donnent son nom.', 'Un seul grand chêne peut accueillir plus de 2 000 espèces vivantes.', 'Continuez sur le chemin forestier jusqu''à la clairière.', 'Europe'),
  ('00000003-0000-4000-8000-000000000002', 'nl', 'Merkwaardige eik', 'Merkwaardige boom', 'Een zomereik van meer dan honderd jaar oud.', 'De zomereik biedt onderdak aan honderden soorten insecten, vogels en paddenstoelen. Zijn eikels hangen aan een lange steel.', 'Eén grote eik kan meer dan 2 000 levende soorten herbergen.', 'Volg het bospad tot aan de open plek.', 'Europa'),
  ('00000003-0000-4000-8000-000000000002', 'en', 'Remarkable oak', 'Remarkable tree', 'A pedunculate oak over a hundred years old.', 'The pedunculate oak shelters hundreds of species of insects, birds and fungi. Its acorns hang from a long stalk, which gives the tree its name.', 'A single large oak can host more than 2,000 living species.', 'Follow the woodland path to the clearing.', 'Europe'),
  ('00000003-0000-4000-8000-000000000002', 'es', 'Roble notable', 'Árbol notable', null, null, null, null, 'Europa'),
  ('00000003-0000-4000-8000-000000000002', 'de', 'Bemerkenswerte Eiche', 'Bemerkenswerter Baum', null, null, null, null, 'Europa'),
  ('00000003-0000-4000-8000-000000000003', 'fr', 'Magnolia', 'Floraison de printemps', 'Des fleurs géantes avant même les feuilles.', 'Les magnolias sont parmi les plus anciennes plantes à fleurs. Ils existaient déjà avant l''apparition des abeilles : ce sont des coléoptères qui les pollinisaient !', 'Les magnolias existent depuis environ 95 millions d''années.', 'Longez la pelouse vers le sud, le magnolia est au bord de l''allée.', 'Asie (hybride horticole)'),
  ('00000003-0000-4000-8000-000000000003', 'nl', 'Magnolia', 'Voorjaarsbloei', 'Reusachtige bloemen nog vóór de bladeren.', 'Magnolia''s behoren tot de oudste bloeiende planten. Ze bestonden al vóór de bijen: kevers bestoven ze!', 'Magnolia''s bestaan al zo''n 95 miljoen jaar.', 'Volg het grasveld naar het zuiden, de magnolia staat langs het pad.', 'Azië (tuinhybride)'),
  ('00000003-0000-4000-8000-000000000003', 'en', 'Magnolia', 'Spring bloom', 'Huge flowers even before the leaves appear.', 'Magnolias are among the oldest flowering plants. They existed before bees did — beetles pollinated them!', 'Magnolias have existed for about 95 million years.', 'Walk south along the lawn; the magnolia stands by the path.', 'Asia (garden hybrid)'),
  ('00000003-0000-4000-8000-000000000003', 'es', 'Magnolia', 'Floración de primavera', null, null, null, null, null),
  ('00000003-0000-4000-8000-000000000003', 'de', 'Magnolie', 'Frühlingsblüte', null, null, null, null, null),
  ('00000003-0000-4000-8000-000000000004', 'fr', 'Jardin des roses', 'Jardin thématique', 'Des dizaines de variétés de roses parfumées.', 'Ce jardin présente des roses anciennes et modernes. Approchez-vous : chaque variété a un parfum différent, du citron à l''épice.', 'Il existe plus de 30 000 variétés de roses cultivées.', 'Traversez le petit pont puis suivez les arceaux fleuris.', null),
  ('00000003-0000-4000-8000-000000000004', 'nl', 'Rozentuin', 'Thematuin', 'Tientallen geurende rozenrassen.', 'Deze tuin toont oude en moderne rozen. Kom dichterbij: elk ras heeft een andere geur, van citroen tot kruiden.', 'Er bestaan meer dan 30 000 gekweekte rozenrassen.', 'Steek het bruggetje over en volg de bloemenbogen.', null),
  ('00000003-0000-4000-8000-000000000004', 'en', 'Rose garden', 'Themed garden', 'Dozens of fragrant rose varieties.', 'This garden showcases old and modern roses. Come closer: every variety smells different, from lemon to spice.', 'There are more than 30,000 cultivated rose varieties.', 'Cross the small bridge and follow the flowering arches.', null),
  ('00000003-0000-4000-8000-000000000004', 'es', 'Jardín de rosas', 'Jardín temático', null, null, null, null, null),
  ('00000003-0000-4000-8000-000000000004', 'de', 'Rosengarten', 'Themengarten', null, null, null, null, null),
  ('00000003-0000-4000-8000-000000000005', 'fr', 'Point de vue', 'Panorama', 'Une vue dégagée sur l''étang et le château.', 'Depuis cette petite butte, on embrasse du regard l''étang, les grands arbres et la silhouette du château. Le meilleur moment : fin d''après-midi.', 'Les photographes appellent la lumière de fin de journée « l''heure dorée ».', 'Montez le sentier en pente douce à droite de la roseraie.', null),
  ('00000003-0000-4000-8000-000000000005', 'nl', 'Uitkijkpunt', 'Panorama', 'Een weids zicht op de vijver en het kasteel.', 'Vanaf deze kleine heuvel overzie je de vijver, de grote bomen en het silhouet van het kasteel. Beste moment: laat in de namiddag.', 'Fotografen noemen het licht aan het eind van de dag het « gouden uur ».', 'Neem het zacht hellende pad rechts van de rozentuin.', null),
  ('00000003-0000-4000-8000-000000000005', 'en', 'Viewpoint', 'Panorama', 'An open view over the pond and the castle.', 'From this small hill you can take in the pond, the tall trees and the castle''s silhouette. Best time: late afternoon.', 'Photographers call the light at the end of the day the “golden hour”.', 'Climb the gently sloping trail to the right of the rose garden.', null),
  ('00000003-0000-4000-8000-000000000005', 'es', 'Mirador', 'Panorama', null, null, null, null, null),
  ('00000003-0000-4000-8000-000000000005', 'de', 'Aussichtspunkt', 'Panorama', null, null, null, null, null),
  ('00000003-0000-4000-8000-000000000006', 'fr', 'Pavillon historique (démo)', 'Lieu historique — à confirmer', 'Un lieu d''exemple pour illustrer les fiches « histoire ».', 'Ce spot est un exemple fictif. Il sera remplacé par un bâtiment historique réel du domaine, avec un texte validé par l''équipe du jardin.', 'Les fiches histoire peuvent afficher dates, architectes et anecdotes validées.', 'Revenez vers l''allée principale, le pavillon est sur la droite.', null),
  ('00000003-0000-4000-8000-000000000006', 'nl', 'Historisch paviljoen (demo)', 'Historische plek — te bevestigen', 'Een voorbeeldplek om de « geschiedenis »-fiches te tonen.', 'Deze plek is fictief. Ze wordt vervangen door een echt historisch gebouw van het domein, met een tekst gevalideerd door het tuinteam.', 'Geschiedenisfiches kunnen gevalideerde data, architecten en anekdotes tonen.', 'Ga terug naar de hoofddreef, het paviljoen ligt rechts.', null),
  ('00000003-0000-4000-8000-000000000006', 'en', 'Historic pavilion (demo)', 'Historic place — to be confirmed', 'A sample place to illustrate “history” cards.', 'This spot is fictional. It will be replaced by a real historic building on the estate, with text validated by the garden team.', 'History cards can show validated dates, architects and anecdotes.', 'Head back to the main avenue; the pavilion is on the right.', null),
  ('00000003-0000-4000-8000-000000000006', 'es', 'Pabellón histórico (demo)', 'Lugar histórico — por confirmar', null, null, null, null, null),
  ('00000003-0000-4000-8000-000000000006', 'de', 'Historischer Pavillon (Demo)', 'Historischer Ort — zu bestätigen', null, null, null, null, null),
  ('00000003-0000-4000-8000-000000000007', 'fr', 'Ginkgo', 'Fossile vivant', 'Un arbre qui a connu les dinosaures.', 'Le ginkgo existait déjà il y a plus de 200 millions d''années. Ses feuilles en éventail deviennent jaune or en automne.', 'Des ginkgos ont survécu à Hiroshima en 1945 et poussent encore.', null, 'Chine'),
  ('00000003-0000-4000-8000-000000000007', 'nl', 'Ginkgo', 'Levend fossiel', 'Een boom die de dinosaurussen heeft gekend.', 'De ginkgo bestond al meer dan 200 miljoen jaar geleden. Zijn waaiervormige bladeren kleuren goudgeel in de herfst.', 'Ginkgo''s overleefden Hiroshima in 1945 en groeien er nog steeds.', null, 'China'),
  ('00000003-0000-4000-8000-000000000007', 'en', 'Ginkgo', 'Living fossil', 'A tree that knew the dinosaurs.', 'The ginkgo already existed more than 200 million years ago. Its fan-shaped leaves turn golden in autumn.', 'Ginkgos survived Hiroshima in 1945 and still grow there.', null, 'China'),
  ('00000003-0000-4000-8000-000000000008', 'fr', 'Cèdre du Liban', 'Conifère majestueux', 'Des branches étagées comme des plateaux.', null, null, null, 'Moyen-Orient'),
  ('00000003-0000-4000-8000-000000000008', 'nl', 'Libanonceder', 'Majestueuze conifeer', 'Takken in etages, als dienbladen.', null, null, null, 'Midden-Oosten'),
  ('00000003-0000-4000-8000-000000000008', 'en', 'Cedar of Lebanon', 'Majestic conifer', 'Tiered branches like trays.', null, null, null, 'Middle East'),
  ('00000003-0000-4000-8000-000000000009', 'fr', 'Hêtre pourpre', 'Arbre remarquable', 'Un feuillage couleur prune.', null, null, null, 'Europe'),
  ('00000003-0000-4000-8000-000000000009', 'nl', 'Bruine beuk', 'Merkwaardige boom', 'Pruimkleurig gebladerte.', null, null, null, 'Europa'),
  ('00000003-0000-4000-8000-000000000009', 'en', 'Copper beech', 'Remarkable tree', 'Plum-coloured foliage.', null, null, null, 'Europe'),
  ('00000003-0000-4000-8000-00000000000a', 'fr', 'Étang', 'Milieu aquatique', 'Canards, nénuphars et libellules.', null, null, null, null),
  ('00000003-0000-4000-8000-00000000000a', 'nl', 'Vijver', 'Waterrijk gebied', 'Eenden, waterlelies en libellen.', null, null, null, null),
  ('00000003-0000-4000-8000-00000000000a', 'en', 'Pond', 'Wetland', 'Ducks, water lilies and dragonflies.', null, null, null, null),
  ('00000003-0000-4000-8000-00000000000b', 'fr', 'Grandes serres', 'Plantes exotiques', 'Un voyage sous les tropiques, à l''abri.', null, null, null, null),
  ('00000003-0000-4000-8000-00000000000b', 'nl', 'Grote serres', 'Exotische planten', 'Een reis naar de tropen, beschut.', null, null, null, null),
  ('00000003-0000-4000-8000-00000000000b', 'en', 'Great glasshouses', 'Exotic plants', 'A trip to the tropics, under glass.', null, null, null, null),
  ('00000003-0000-4000-8000-00000000000c', 'fr', 'Bambouseraie', 'Plantes étonnantes', 'Des tiges qui poussent à vue d''œil.', null, null, null, 'Asie'),
  ('00000003-0000-4000-8000-00000000000c', 'nl', 'Bamboebos', 'Verrassende planten', 'Stengels die zienderogen groeien.', null, null, null, 'Azië'),
  ('00000003-0000-4000-8000-00000000000c', 'en', 'Bamboo grove', 'Surprising plants', 'Stems that grow before your eyes.', null, null, null, 'Asia');

insert into public.spot_category_relations (spot_id, category_id) values
  ('00000003-0000-4000-8000-000000000001', '00000002-0000-4000-8000-000000000001'),
  ('00000003-0000-4000-8000-000000000002', '00000002-0000-4000-8000-000000000001'),
  ('00000003-0000-4000-8000-000000000003', '00000002-0000-4000-8000-000000000002'),
  ('00000003-0000-4000-8000-000000000004', '00000002-0000-4000-8000-000000000002'),
  ('00000003-0000-4000-8000-000000000004', '00000002-0000-4000-8000-000000000003'),
  ('00000003-0000-4000-8000-000000000005', '00000002-0000-4000-8000-000000000005'),
  ('00000003-0000-4000-8000-000000000006', '00000002-0000-4000-8000-000000000004'),
  ('00000003-0000-4000-8000-000000000007', '00000002-0000-4000-8000-000000000001'),
  ('00000003-0000-4000-8000-000000000008', '00000002-0000-4000-8000-000000000001'),
  ('00000003-0000-4000-8000-000000000009', '00000002-0000-4000-8000-000000000001'),
  ('00000003-0000-4000-8000-00000000000a', '00000002-0000-4000-8000-000000000006'),
  ('00000003-0000-4000-8000-00000000000b', '00000002-0000-4000-8000-000000000007'),
  ('00000003-0000-4000-8000-00000000000c', '00000002-0000-4000-8000-000000000003');

insert into public.trails (id, park_id, slug, status, is_demo_data, difficulty, duration_min, distance_m, audiences, themes, is_pmr_accessible, pmr_partial, cover_image_url, completion_points, sort_order) values
  ('00000004-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'arbres-remarquables', 'PUBLISHED', true, 'EASY', 45, 1800, array['FAMILY', 'KIDS', 'CURIOUS']::text[], array['ESSENTIALS', 'TREES', 'FLOWERS', 'PHOTO']::text[], false, true, '/demo/trails/remarkable-trees.svg', 20, 1);

insert into public.trail_translations (trail_id, locale, name, summary, description, accessibility_notes) values
  ('00000004-0000-4000-8000-000000000001', 'fr', 'Découverte des arbres remarquables', '6 spots, des géants venus du monde entier.', 'Une boucle facile pour découvrir les arbres les plus impressionnants du jardin, une floraison spectaculaire et un joli point de vue. Idéal en famille.', 'Partiellement accessible : le point de vue est sur une butte en terre (donnée de démonstration).'),
  ('00000004-0000-4000-8000-000000000001', 'nl', 'Ontdekking van merkwaardige bomen', '6 spots, reuzen uit de hele wereld.', 'Een makkelijke lus langs de indrukwekkendste bomen van de tuin, een spectaculaire bloei en een mooi uitzicht. Ideaal voor gezinnen.', 'Gedeeltelijk toegankelijk: het uitkijkpunt ligt op een aarden heuvel (demogegevens).'),
  ('00000004-0000-4000-8000-000000000001', 'en', 'Remarkable trees discovery', '6 spots, giants from all over the world.', 'An easy loop to discover the garden''s most impressive trees, a spectacular bloom and a lovely viewpoint. Ideal for families.', 'Partially accessible: the viewpoint is on an earth mound (demo data).'),
  ('00000004-0000-4000-8000-000000000001', 'es', 'Descubrimiento de árboles notables', '6 puntos, gigantes de todo el mundo.', null, null),
  ('00000004-0000-4000-8000-000000000001', 'de', 'Entdeckung bemerkenswerter Bäume', '6 Spots, Riesen aus aller Welt.', null, null);

insert into public.trail_spots (trail_id, spot_id, position) values
  ('00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000001', 1),
  ('00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000002', 2),
  ('00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000003', 3),
  ('00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000004', 4),
  ('00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000005', 5),
  ('00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000006', 6);

insert into public.trail_segments (id, trail_id, from_spot_id, to_spot_id, position, geometry) values
  ('00000005-0000-4000-8000-000000000001', '00000004-0000-4000-8000-000000000001', null, '00000003-0000-4000-8000-000000000001', 1, extensions.st_setsrid(extensions.st_geomfromtext('LINESTRING(4.3271 50.9296, 4.326631 50.929494, 4.326212 50.929353, 4.325845 50.929179, 4.325529 50.92897, 4.325264 50.928727, 4.32505 50.92845)'), 4326)::extensions.geography),
  ('00000005-0000-4000-8000-000000000002', '00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000002', 2, extensions.st_setsrid(extensions.st_geomfromtext('LINESTRING(4.32505 50.92845, 4.324941 50.92817, 4.324782 50.927909, 4.324574 50.927666, 4.324316 50.927442, 4.324008 50.927237, 4.32365 50.92705)'), 4326)::extensions.geography),
  ('00000005-0000-4000-8000-000000000003', '00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000002', '00000003-0000-4000-8000-000000000003', 3, extensions.st_setsrid(extensions.st_geomfromtext('LINESTRING(4.32365 50.92705, 4.323967 50.926796, 4.324323 50.926583, 4.32472 50.926413, 4.325157 50.926283, 4.325633 50.926196, 4.32615 50.92615)'), 4326)::extensions.geography),
  ('00000005-0000-4000-8000-000000000004', '00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000003', '00000003-0000-4000-8000-000000000004', 4, extensions.st_setsrid(extensions.st_geomfromtext('LINESTRING(4.32615 50.92615, 4.32666 50.926197, 4.327159 50.926205, 4.327648 50.926174, 4.328126 50.926105, 4.328593 50.925997, 4.32905 50.92585)'), 4326)::extensions.geography),
  ('00000005-0000-4000-8000-000000000005', '00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000004', '00000003-0000-4000-8000-000000000005', 5, extensions.st_setsrid(extensions.st_geomfromtext('LINESTRING(4.32905 50.92585, 4.329467 50.926037, 4.329817 50.92625, 4.3301 50.926487, 4.330317 50.92675, 4.330467 50.927037, 4.33055 50.92735)'), 4326)::extensions.geography),
  ('00000005-0000-4000-8000-000000000006', '00000004-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000005', '00000003-0000-4000-8000-000000000006', 6, extensions.st_setsrid(extensions.st_geomfromtext('LINESTRING(4.33055 50.92735, 4.330142 50.927527, 4.329784 50.927726, 4.329476 50.927948, 4.329218 50.928193, 4.329009 50.92846, 4.32885 50.92875)'), 4326)::extensions.geography);

insert into public.trail_segment_translations (segment_id, locale, instruction) values
  ('00000005-0000-4000-8000-000000000001', 'fr', 'Depuis l''entrée, suivez l''allée principale puis prenez à gauche après la grande pelouse.'),
  ('00000005-0000-4000-8000-000000000001', 'nl', 'Volg vanaf de ingang de hoofddreef en sla links af na het grote grasveld.'),
  ('00000005-0000-4000-8000-000000000001', 'en', 'From the entrance, follow the main avenue and turn left after the large lawn.'),
  ('00000005-0000-4000-8000-000000000002', 'fr', 'Continuez sur le chemin forestier jusqu''à la clairière.'),
  ('00000005-0000-4000-8000-000000000002', 'nl', 'Volg het bospad tot aan de open plek.'),
  ('00000005-0000-4000-8000-000000000002', 'en', 'Follow the woodland path to the clearing.'),
  ('00000005-0000-4000-8000-000000000003', 'fr', 'Continuez tout droit, puis tournez à droite après la fontaine.'),
  ('00000005-0000-4000-8000-000000000003', 'nl', 'Ga rechtdoor en sla rechtsaf na de fontein.'),
  ('00000005-0000-4000-8000-000000000003', 'en', 'Go straight on, then turn right after the fountain.'),
  ('00000005-0000-4000-8000-000000000004', 'fr', 'Traversez le petit pont puis suivez les arceaux fleuris.'),
  ('00000005-0000-4000-8000-000000000004', 'nl', 'Steek het bruggetje over en volg de bloemenbogen.'),
  ('00000005-0000-4000-8000-000000000004', 'en', 'Cross the small bridge and follow the flowering arches.'),
  ('00000005-0000-4000-8000-000000000005', 'fr', 'Montez le sentier en pente douce à droite de la roseraie.'),
  ('00000005-0000-4000-8000-000000000005', 'nl', 'Neem het zacht hellende pad rechts van de rozentuin.'),
  ('00000005-0000-4000-8000-000000000005', 'en', 'Climb the gently sloping trail to the right of the rose garden.'),
  ('00000005-0000-4000-8000-000000000006', 'fr', 'Redescendez vers l''allée principale, le pavillon est sur la droite.'),
  ('00000005-0000-4000-8000-000000000006', 'nl', 'Daal af naar de hoofddreef, het paviljoen ligt rechts.'),
  ('00000005-0000-4000-8000-000000000006', 'en', 'Walk back down to the main avenue; the pavilion is on the right.');

insert into public.facilities (id, park_id, type, status, is_demo_data, location, is_pmr_accessible, details, sort_order) values
  ('00000006-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', 'ENTRANCE', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3271, 50.9296), 4326)::extensions.geography, true, '{}'::jsonb, 1),
  ('00000006-0000-4000-8000-000000000002', '00000001-0000-4000-8000-000000000001', 'PARKING', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3285, 50.9306), 4326)::extensions.geography, null, '{"capacity":250,"free":true}'::jsonb, 2),
  ('00000006-0000-4000-8000-000000000003', '00000001-0000-4000-8000-000000000001', 'PARKING_PMR', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3276, 50.9301), 4326)::extensions.geography, true, '{"spaces":8}'::jsonb, 3),
  ('00000006-0000-4000-8000-000000000004', '00000001-0000-4000-8000-000000000001', 'BIKE_PARKING', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3281, 50.9299), 4326)::extensions.geography, null, '{"spaces":60}'::jsonb, 4),
  ('00000006-0000-4000-8000-000000000005', '00000001-0000-4000-8000-000000000001', 'TOILETS', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3262, 50.9289), 4326)::extensions.geography, null, '{}'::jsonb, 5),
  ('00000006-0000-4000-8000-000000000006', '00000001-0000-4000-8000-000000000001', 'TOILETS_PMR', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3264, 50.9288), 4326)::extensions.geography, true, '{}'::jsonb, 6),
  ('00000006-0000-4000-8000-000000000007', '00000001-0000-4000-8000-000000000001', 'CAFE', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3268, 50.92895), 4326)::extensions.geography, true, '{}'::jsonb, 7),
  ('00000006-0000-4000-8000-000000000008', '00000001-0000-4000-8000-000000000001', 'BENCH', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3255, 50.9266), 4326)::extensions.geography, null, '{}'::jsonb, 8),
  ('00000006-0000-4000-8000-000000000009', '00000001-0000-4000-8000-000000000001', 'WATER', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3259, 50.9279), 4326)::extensions.geography, null, '{}'::jsonb, 9),
  ('00000006-0000-4000-8000-00000000000a', '00000001-0000-4000-8000-000000000001', 'VIEWPOINT', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.33055, 50.92735), 4326)::extensions.geography, null, '{}'::jsonb, 10),
  ('00000006-0000-4000-8000-00000000000b', '00000001-0000-4000-8000-000000000001', 'PUBLIC_TRANSPORT', 'PUBLISHED', true, extensions.st_setsrid(extensions.st_makepoint(4.3262, 50.9309), 4326)::extensions.geography, null, '{}'::jsonb, 11);

insert into public.facility_translations (facility_id, locale, name, description) values
  ('00000006-0000-4000-8000-000000000001', 'fr', 'Entrée principale', null),
  ('00000006-0000-4000-8000-000000000001', 'nl', 'Hoofdingang', null),
  ('00000006-0000-4000-8000-000000000001', 'en', 'Main entrance', null),
  ('00000006-0000-4000-8000-000000000002', 'fr', 'Parking visiteurs', null),
  ('00000006-0000-4000-8000-000000000002', 'nl', 'Bezoekersparking', null),
  ('00000006-0000-4000-8000-000000000002', 'en', 'Visitor car park', null),
  ('00000006-0000-4000-8000-000000000003', 'fr', 'Parking PMR', null),
  ('00000006-0000-4000-8000-000000000003', 'nl', 'Parking voor mindervaliden', null),
  ('00000006-0000-4000-8000-000000000003', 'en', 'Accessible parking', null),
  ('00000006-0000-4000-8000-000000000004', 'fr', 'Parking vélos', null),
  ('00000006-0000-4000-8000-000000000004', 'nl', 'Fietsenstalling', null),
  ('00000006-0000-4000-8000-000000000004', 'en', 'Bike parking', null),
  ('00000006-0000-4000-8000-000000000005', 'fr', 'Toilettes', null),
  ('00000006-0000-4000-8000-000000000005', 'nl', 'Toiletten', null),
  ('00000006-0000-4000-8000-000000000005', 'en', 'Toilets', null),
  ('00000006-0000-4000-8000-000000000006', 'fr', 'Toilettes PMR', null),
  ('00000006-0000-4000-8000-000000000006', 'nl', 'Aangepast toilet', null),
  ('00000006-0000-4000-8000-000000000006', 'en', 'Accessible toilets', null),
  ('00000006-0000-4000-8000-000000000007', 'fr', 'Café du jardin', null),
  ('00000006-0000-4000-8000-000000000007', 'nl', 'Tuincafé', null),
  ('00000006-0000-4000-8000-000000000007', 'en', 'Garden café', null),
  ('00000006-0000-4000-8000-000000000008', 'fr', 'Banc ombragé', null),
  ('00000006-0000-4000-8000-000000000008', 'nl', 'Schaduwrijke bank', null),
  ('00000006-0000-4000-8000-000000000008', 'en', 'Shaded bench', null),
  ('00000006-0000-4000-8000-000000000009', 'fr', 'Point d''eau potable', null),
  ('00000006-0000-4000-8000-000000000009', 'nl', 'Drinkwaterpunt', null),
  ('00000006-0000-4000-8000-000000000009', 'en', 'Drinking water', null),
  ('00000006-0000-4000-8000-00000000000a', 'fr', 'Belvédère', null),
  ('00000006-0000-4000-8000-00000000000a', 'nl', 'Belvedère', null),
  ('00000006-0000-4000-8000-00000000000a', 'en', 'Lookout', null),
  ('00000006-0000-4000-8000-00000000000b', 'fr', 'Arrêt de bus (démo)', null),
  ('00000006-0000-4000-8000-00000000000b', 'nl', 'Bushalte (demo)', null),
  ('00000006-0000-4000-8000-00000000000b', 'en', 'Bus stop (demo)', null);

insert into public.quizzes (id, park_id, spot_id, status, is_demo_data, points_value, sort_order) values
  ('00000007-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000001', 'PUBLISHED', true, 10, 1),
  ('00000007-0000-4000-8000-000000000002', '00000001-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000002', 'PUBLISHED', true, 10, 2),
  ('00000007-0000-4000-8000-000000000003', '00000001-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000003', 'PUBLISHED', true, 10, 3),
  ('00000007-0000-4000-8000-000000000004', '00000001-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000007', 'PUBLISHED', true, 10, 4);

insert into public.quiz_translations (quiz_id, locale, question, explanation) values
  ('00000007-0000-4000-8000-000000000001', 'fr', 'De quel continent vient cet arbre ?', 'Le séquoia géant pousse naturellement en Californie, en Amérique du Nord.'),
  ('00000007-0000-4000-8000-000000000001', 'nl', 'Van welk continent komt deze boom?', 'De mammoetboom groeit van nature in Californië, Noord-Amerika.'),
  ('00000007-0000-4000-8000-000000000001', 'en', 'Which continent does this tree come from?', 'The giant sequoia grows naturally in California, North America.'),
  ('00000007-0000-4000-8000-000000000001', 'es', '¿De qué continente viene este árbol?', null),
  ('00000007-0000-4000-8000-000000000001', 'de', 'Von welchem Kontinent stammt dieser Baum?', null),
  ('00000007-0000-4000-8000-000000000002', 'fr', 'Comment s''appellent les fruits du chêne ?', 'Ce sont les glands, dont se régalent geais et écureuils.'),
  ('00000007-0000-4000-8000-000000000002', 'nl', 'Hoe heten de vruchten van de eik?', 'Eikels — een feestmaal voor gaaien en eekhoorns.'),
  ('00000007-0000-4000-8000-000000000002', 'en', 'What are the oak''s fruits called?', 'Acorns — a feast for jays and squirrels.'),
  ('00000007-0000-4000-8000-000000000003', 'fr', 'Quels insectes pollinisaient les premiers magnolias ?', 'Les coléoptères : les magnolias sont apparus avant les abeilles.'),
  ('00000007-0000-4000-8000-000000000003', 'nl', 'Welke insecten bestoven de eerste magnolia''s?', 'Kevers: magnolia''s verschenen vóór de bijen.'),
  ('00000007-0000-4000-8000-000000000003', 'en', 'Which insects pollinated the first magnolias?', 'Beetles: magnolias appeared before bees.'),
  ('00000007-0000-4000-8000-000000000004', 'fr', 'Quelle forme ont les feuilles du ginkgo ?', 'Elles sont en éventail, souvent fendues au milieu.'),
  ('00000007-0000-4000-8000-000000000004', 'nl', 'Welke vorm hebben ginkgobladeren?', 'Waaiervormig, vaak in het midden ingesneden.'),
  ('00000007-0000-4000-8000-000000000004', 'en', 'What shape are ginkgo leaves?', 'Fan-shaped, often split in the middle.');

insert into public.quiz_answers (id, quiz_id, is_correct, position) values
  ('00000008-0000-4000-8000-000000000001', '00000007-0000-4000-8000-000000000001', false, 1),
  ('00000008-0000-4000-8000-000000000002', '00000007-0000-4000-8000-000000000001', true, 2),
  ('00000008-0000-4000-8000-000000000003', '00000007-0000-4000-8000-000000000001', false, 3),
  ('00000008-0000-4000-8000-000000000004', '00000007-0000-4000-8000-000000000002', true, 1),
  ('00000008-0000-4000-8000-000000000005', '00000007-0000-4000-8000-000000000002', false, 2),
  ('00000008-0000-4000-8000-000000000006', '00000007-0000-4000-8000-000000000002', false, 3),
  ('00000008-0000-4000-8000-000000000007', '00000007-0000-4000-8000-000000000003', false, 1),
  ('00000008-0000-4000-8000-000000000008', '00000007-0000-4000-8000-000000000003', false, 2),
  ('00000008-0000-4000-8000-000000000009', '00000007-0000-4000-8000-000000000003', true, 3),
  ('00000008-0000-4000-8000-00000000000a', '00000007-0000-4000-8000-000000000004', true, 1),
  ('00000008-0000-4000-8000-00000000000b', '00000007-0000-4000-8000-000000000004', false, 2),
  ('00000008-0000-4000-8000-00000000000c', '00000007-0000-4000-8000-000000000004', false, 3);

insert into public.quiz_answer_translations (answer_id, locale, label) values
  ('00000008-0000-4000-8000-000000000001', 'fr', 'Europe'),
  ('00000008-0000-4000-8000-000000000001', 'nl', 'Europa'),
  ('00000008-0000-4000-8000-000000000001', 'en', 'Europe'),
  ('00000008-0000-4000-8000-000000000001', 'es', 'Europa'),
  ('00000008-0000-4000-8000-000000000001', 'de', 'Europa'),
  ('00000008-0000-4000-8000-000000000002', 'fr', 'Amérique du Nord'),
  ('00000008-0000-4000-8000-000000000002', 'nl', 'Noord-Amerika'),
  ('00000008-0000-4000-8000-000000000002', 'en', 'North America'),
  ('00000008-0000-4000-8000-000000000002', 'es', 'América del Norte'),
  ('00000008-0000-4000-8000-000000000002', 'de', 'Nordamerika'),
  ('00000008-0000-4000-8000-000000000003', 'fr', 'Asie'),
  ('00000008-0000-4000-8000-000000000003', 'nl', 'Azië'),
  ('00000008-0000-4000-8000-000000000003', 'en', 'Asia'),
  ('00000008-0000-4000-8000-000000000003', 'es', 'Asia'),
  ('00000008-0000-4000-8000-000000000003', 'de', 'Asien'),
  ('00000008-0000-4000-8000-000000000004', 'fr', 'Des glands'),
  ('00000008-0000-4000-8000-000000000004', 'nl', 'Eikels'),
  ('00000008-0000-4000-8000-000000000004', 'en', 'Acorns'),
  ('00000008-0000-4000-8000-000000000005', 'fr', 'Des faînes'),
  ('00000008-0000-4000-8000-000000000005', 'nl', 'Beukennootjes'),
  ('00000008-0000-4000-8000-000000000005', 'en', 'Beechnuts'),
  ('00000008-0000-4000-8000-000000000006', 'fr', 'Des cônes'),
  ('00000008-0000-4000-8000-000000000006', 'nl', 'Kegels'),
  ('00000008-0000-4000-8000-000000000006', 'en', 'Cones'),
  ('00000008-0000-4000-8000-000000000007', 'fr', 'Les abeilles'),
  ('00000008-0000-4000-8000-000000000007', 'nl', 'Bijen'),
  ('00000008-0000-4000-8000-000000000007', 'en', 'Bees'),
  ('00000008-0000-4000-8000-000000000008', 'fr', 'Les papillons'),
  ('00000008-0000-4000-8000-000000000008', 'nl', 'Vlinders'),
  ('00000008-0000-4000-8000-000000000008', 'en', 'Butterflies'),
  ('00000008-0000-4000-8000-000000000009', 'fr', 'Les coléoptères'),
  ('00000008-0000-4000-8000-000000000009', 'nl', 'Kevers'),
  ('00000008-0000-4000-8000-000000000009', 'en', 'Beetles'),
  ('00000008-0000-4000-8000-00000000000a', 'fr', 'En éventail'),
  ('00000008-0000-4000-8000-00000000000a', 'nl', 'Waaiervormig'),
  ('00000008-0000-4000-8000-00000000000a', 'en', 'Fan-shaped'),
  ('00000008-0000-4000-8000-00000000000b', 'fr', 'En aiguille'),
  ('00000008-0000-4000-8000-00000000000b', 'nl', 'Naaldvormig'),
  ('00000008-0000-4000-8000-00000000000b', 'en', 'Needle-like'),
  ('00000008-0000-4000-8000-00000000000c', 'fr', 'En cœur'),
  ('00000008-0000-4000-8000-00000000000c', 'nl', 'Hartvormig'),
  ('00000008-0000-4000-8000-00000000000c', 'en', 'Heart-shaped');

insert into public.challenges (id, park_id, spot_id, type, status, is_demo_data, requires_photo, points_value, target_value, sort_order) values
  ('00000009-0000-4000-8000-000000000001', '00000001-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000001', 'PHOTO', 'PUBLISHED', true, true, 20, null, 1),
  ('00000009-0000-4000-8000-000000000002', '00000001-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000002', 'OBSERVATION', 'PUBLISHED', true, false, 20, null, 2),
  ('00000009-0000-4000-8000-000000000003', '00000001-0000-4000-8000-000000000001', null, 'WALK', 'PUBLISHED', true, false, 20, 1000, 3),
  ('00000009-0000-4000-8000-000000000004', '00000001-0000-4000-8000-000000000001', null, 'QUIZ_STREAK', 'PUBLISHED', true, false, 20, 2, 4),
  ('00000009-0000-4000-8000-000000000005', '00000001-0000-4000-8000-000000000001', '00000003-0000-4000-8000-000000000005', 'PHOTO', 'PUBLISHED', true, true, 20, null, 5);

insert into public.challenge_translations (challenge_id, locale, title, instructions) values
  ('00000009-0000-4000-8000-000000000001', 'fr', 'Prends une photo de la feuille en contre-jour.', 'Place-toi face au soleil et laisse la lumière traverser le feuillage.'),
  ('00000009-0000-4000-8000-000000000001', 'nl', 'Maak een foto van het blad in tegenlicht.', 'Ga met je gezicht naar de zon en laat het licht door het blad schijnen.'),
  ('00000009-0000-4000-8000-000000000001', 'en', 'Take a backlit photo of a leaf.', 'Face the sun and let the light shine through the foliage.'),
  ('00000009-0000-4000-8000-000000000001', 'es', 'Haz una foto de la hoja a contraluz.', null),
  ('00000009-0000-4000-8000-000000000001', 'de', 'Fotografiere ein Blatt im Gegenlicht.', null),
  ('00000009-0000-4000-8000-000000000002', 'fr', 'Trouve un gland ou une feuille de chêne au sol.', 'Observe-le, puis laisse-le sur place pour les animaux.'),
  ('00000009-0000-4000-8000-000000000002', 'nl', 'Zoek een eikel of eikenblad op de grond.', 'Bekijk het en laat het liggen voor de dieren.'),
  ('00000009-0000-4000-8000-000000000002', 'en', 'Find an acorn or an oak leaf on the ground.', 'Look at it, then leave it for the animals.'),
  ('00000009-0000-4000-8000-000000000003', 'fr', 'Marcher 1 km dans le parc', null),
  ('00000009-0000-4000-8000-000000000003', 'nl', 'Wandel 1 km in het park', null),
  ('00000009-0000-4000-8000-000000000003', 'en', 'Walk 1 km in the park', null),
  ('00000009-0000-4000-8000-000000000004', 'fr', 'Réussir 2 quiz', null),
  ('00000009-0000-4000-8000-000000000004', 'nl', 'Beantwoord 2 quizzen juist', null),
  ('00000009-0000-4000-8000-000000000004', 'en', 'Pass 2 quizzes', null),
  ('00000009-0000-4000-8000-000000000005', 'fr', 'Prendre une photo nature depuis le point de vue', null),
  ('00000009-0000-4000-8000-000000000005', 'nl', 'Maak een natuurfoto vanaf het uitkijkpunt', null),
  ('00000009-0000-4000-8000-000000000005', 'en', 'Take a nature photo from the viewpoint', null);

insert into public.badges (id, park_id, key, icon, criteria, threshold, sort_order) values
  ('0000000a-0000-4000-8000-000000000001', null, 'premier-pas', 'footprints', 'SPOTS_DISCOVERED', 1, 1),
  ('0000000a-0000-4000-8000-000000000002', null, 'explorateur', 'compass', 'SPOTS_DISCOVERED', 10, 2),
  ('0000000a-0000-4000-8000-000000000003', null, 'detective', 'search', 'QUIZZES_PASSED', 5, 3),
  ('0000000a-0000-4000-8000-000000000004', null, 'photographe', 'camera', 'PHOTOS_APPROVED', 10, 4),
  ('0000000a-0000-4000-8000-000000000005', null, 'grand-marcheur', 'route', 'DISTANCE_M', 10000, 5),
  ('0000000a-0000-4000-8000-000000000006', null, 'maitre-botaniste', 'leaf', 'SPOTS_DISCOVERED', 50, 6),
  ('0000000a-0000-4000-8000-000000000007', null, 'boucle-bouclee', 'flag', 'TRAILS_COMPLETED', 1, 7);

insert into public.badge_translations (badge_id, locale, name, description) values
  ('0000000a-0000-4000-8000-000000000001', 'fr', 'Premier pas', 'Découvrir son premier spot.'),
  ('0000000a-0000-4000-8000-000000000001', 'nl', 'Eerste stap', 'Je eerste spot ontdekken.'),
  ('0000000a-0000-4000-8000-000000000001', 'en', 'First step', 'Discover your first spot.'),
  ('0000000a-0000-4000-8000-000000000001', 'es', 'Primer paso', null),
  ('0000000a-0000-4000-8000-000000000001', 'de', 'Erster Schritt', null),
  ('0000000a-0000-4000-8000-000000000002', 'fr', 'Explorateur', 'Découvrir 10 spots.'),
  ('0000000a-0000-4000-8000-000000000002', 'nl', 'Ontdekkingsreiziger', '10 spots ontdekken.'),
  ('0000000a-0000-4000-8000-000000000002', 'en', 'Explorer', 'Discover 10 spots.'),
  ('0000000a-0000-4000-8000-000000000002', 'es', 'Explorador', null),
  ('0000000a-0000-4000-8000-000000000002', 'de', 'Entdecker', null),
  ('0000000a-0000-4000-8000-000000000003', 'fr', 'Détective', 'Réussir 5 quiz.'),
  ('0000000a-0000-4000-8000-000000000003', 'nl', 'Detective', '5 quizzen juist beantwoorden.'),
  ('0000000a-0000-4000-8000-000000000003', 'en', 'Detective', 'Pass 5 quizzes.'),
  ('0000000a-0000-4000-8000-000000000003', 'es', 'Detective', null),
  ('0000000a-0000-4000-8000-000000000003', 'de', 'Detektiv', null),
  ('0000000a-0000-4000-8000-000000000004', 'fr', 'Photographe', '10 photos validées.'),
  ('0000000a-0000-4000-8000-000000000004', 'nl', 'Fotograaf', '10 goedgekeurde foto''s.'),
  ('0000000a-0000-4000-8000-000000000004', 'en', 'Photographer', '10 approved photos.'),
  ('0000000a-0000-4000-8000-000000000004', 'es', 'Fotógrafo', null),
  ('0000000a-0000-4000-8000-000000000004', 'de', 'Fotograf', null),
  ('0000000a-0000-4000-8000-000000000005', 'fr', 'Grand marcheur', 'Parcourir 10 km.'),
  ('0000000a-0000-4000-8000-000000000005', 'nl', 'Grote wandelaar', '10 km wandelen.'),
  ('0000000a-0000-4000-8000-000000000005', 'en', 'Great walker', 'Walk 10 km.'),
  ('0000000a-0000-4000-8000-000000000005', 'es', 'Gran caminante', null),
  ('0000000a-0000-4000-8000-000000000005', 'de', 'Großer Wanderer', null),
  ('0000000a-0000-4000-8000-000000000006', 'fr', 'Maître botaniste', '50 découvertes.'),
  ('0000000a-0000-4000-8000-000000000006', 'nl', 'Meester-botanicus', '50 ontdekkingen.'),
  ('0000000a-0000-4000-8000-000000000006', 'en', 'Master botanist', '50 discoveries.'),
  ('0000000a-0000-4000-8000-000000000006', 'es', 'Maestro botánico', null),
  ('0000000a-0000-4000-8000-000000000006', 'de', 'Meisterbotaniker', null),
  ('0000000a-0000-4000-8000-000000000007', 'fr', 'Boucle bouclée', 'Terminer un premier parcours.'),
  ('0000000a-0000-4000-8000-000000000007', 'nl', 'Rondje rond', 'Een eerste route afwerken.'),
  ('0000000a-0000-4000-8000-000000000007', 'en', 'Loop closed', 'Complete your first trail.');

insert into public.article_categories (id, key, sort_order) values
  ('0000000c-0000-4000-8000-000000000001', 'trees', 1),
  ('0000000c-0000-4000-8000-000000000002', 'botany', 2),
  ('0000000c-0000-4000-8000-000000000003', 'family', 3);

insert into public.articles (id, park_id, category_id, slug, status, is_demo_data, cover_image_url, reading_minutes, published_at) values
  ('0000000b-0000-4000-8000-000000000001', null, '0000000c-0000-4000-8000-000000000001', 'reconnaitre-un-chene', 'PUBLISHED', true, '/demo/spots/oak.svg', 5, '2026-09-01T09:00:00Z'),
  ('0000000b-0000-4000-8000-000000000002', null, '0000000c-0000-4000-8000-000000000002', 'plantes-exotiques-des-serres', 'PUBLISHED', true, '/demo/spots/glasshouse.svg', 7, '2026-09-08T09:00:00Z'),
  ('0000000b-0000-4000-8000-000000000003', null, '0000000c-0000-4000-8000-000000000003', '5-jeux-en-famille-dans-un-parc', 'PUBLISHED', true, '/demo/trails/remarkable-trees.svg', 4, '2026-09-15T09:00:00Z');

insert into public.article_translations (article_id, locale, title, excerpt, body_md) values
  ('0000000b-0000-4000-8000-000000000001', 'fr', 'Comment reconnaître un chêne ?', 'Feuilles lobées, glands, écorce crevassée : trois indices infaillibles.', '## 1. Les feuilles
Les feuilles du chêne ont des **lobes arrondis**, comme des vagues sur les bords.

## 2. Les glands
En automne, cherchez les **glands** au sol. Chez le chêne pédonculé, ils pendent au bout d''une longue tige.

## 3. L''écorce
Sur un vieux chêne, l''écorce est **épaisse et profondément crevassée**.

> Astuce famille : ramassez une feuille tombée et comparez-la aux arbres voisins !'),
  ('0000000b-0000-4000-8000-000000000001', 'nl', 'Hoe herken je een eik?', 'Gelobde bladeren, eikels, gegroefde schors: drie onfeilbare aanwijzingen.', '## 1. De bladeren
Eikenbladeren hebben **afgeronde lobben**, als golfjes langs de rand.

## 2. De eikels
Zoek in de herfst naar **eikels** op de grond.

## 3. De schors
Bij een oude eik is de schors **dik en diep gegroefd**.'),
  ('0000000b-0000-4000-8000-000000000001', 'en', 'How to recognise an oak?', 'Lobed leaves, acorns, furrowed bark: three sure-fire clues.', '## 1. The leaves
Oak leaves have **rounded lobes**, like waves along the edge.

## 2. The acorns
In autumn, look for **acorns** on the ground.

## 3. The bark
On an old oak, the bark is **thick and deeply furrowed**.'),
  ('0000000b-0000-4000-8000-000000000002', 'fr', 'Les plantes exotiques des serres', 'Cactus, orchidées, plantes carnivores : un tour du monde sous verre.', 'Les serres recréent des **climats du monde entier** : désert, forêt tropicale, montagne.

- **Cactus** : ils stockent l''eau dans leurs tiges.
- **Orchidées** : certaines imitent des insectes pour attirer leurs pollinisateurs.
- **Plantes carnivores** : elles complètent leur alimentation avec des insectes.'),
  ('0000000b-0000-4000-8000-000000000002', 'nl', 'De exotische planten van de serres', 'Cactussen, orchideeën, vleesetende planten: een wereldreis onder glas.', 'Serres bootsen **klimaten van over de hele wereld** na: woestijn, regenwoud, gebergte.'),
  ('0000000b-0000-4000-8000-000000000002', 'en', 'The exotic plants of the glasshouses', 'Cacti, orchids, carnivorous plants: a world tour under glass.', 'Glasshouses recreate **climates from all over the world**: desert, rainforest, mountains.'),
  ('0000000b-0000-4000-8000-000000000003', 'fr', '5 jeux à faire en famille dans un parc', 'Chasse aux couleurs, bingo nature, détective des feuilles…', '1. **Chasse aux couleurs** : trouvez quelque chose de rouge, jaune, violet…
2. **Bingo nature** : un écureuil, un champignon, une plume.
3. **Détective des feuilles** : combien de formes différentes ?
4. **Le silence des oiseaux** : une minute d''écoute, combien de chants ?
5. **Mesure un géant** : combien d''enfants pour faire le tour d''un tronc ?'),
  ('0000000b-0000-4000-8000-000000000003', 'nl', '5 spelletjes voor het hele gezin in een park', 'Kleurenjacht, natuurbingo, bladerdetective…', '1. **Kleurenjacht**
2. **Natuurbingo**
3. **Bladerdetective**
4. **Vogelstilte**
5. **Meet een reus**'),
  ('0000000b-0000-4000-8000-000000000003', 'en', '5 family games to play in a park', 'Colour hunt, nature bingo, leaf detective…', '1. **Colour hunt**
2. **Nature bingo**
3. **Leaf detective**
4. **Bird silence**
5. **Measure a giant**');

commit;
