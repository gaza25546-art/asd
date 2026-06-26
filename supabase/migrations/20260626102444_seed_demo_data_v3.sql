/*
# Restore Demo Data v3

Restores all demo/example data that was lost from the database.
*/

-- Demo Auth User (password: demo1234)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'admin@dvsc.hu',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","email":"admin@dvsc.hu"}',
  'email',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Admin Profile
INSERT INTO profiles (id, display_name, avatar_url, favorite_player, bio, role, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'DVSC Admin',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  'Balazs Dzsudzsak',
  'Proud DVSC supporter since day one. Managing the fan portal.',
  'super_admin',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- News Articles
INSERT INTO news_articles (title, slug, excerpt, content, image_url, category, author, published_at, featured, status) VALUES
('DVSC Secures Champions League Spot After Dramatic Season Finale', 'dvsc-champions-league-spot', 'In a thrilling conclusion to the NB I season, DVSC has secured a spot in the Champions League qualification rounds...', 'In a thrilling conclusion to the NB I season, DVSC has secured a spot in the Champions League qualification rounds. The team showed incredible resilience throughout the campaign, with standout performances from key players like Balazs Dzsudzsak and the defensive line. The final match against Ferencvaros ended in a 2-1 victory that will be remembered for years to come. Fans celebrated long into the night at Nagyerdei Stadion.', 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=500&fit=crop', 'Match Report', 'DVSC Media', now() - interval '2 days', true, 'published'),
('New Signing: International Striker Joins Loki', 'new-striker-signing', 'DVSC has announced the signing of an exciting new striker who is expected to bolster the attack...', 'DVSC has announced the signing of an exciting new striker who is expected to bolster the attack for the upcoming season. The 24-year-old forward arrives from a top European league and brings pace, power, and clinical finishing ability. Manager expressed confidence that the new signing will adapt quickly to the Hungarian league and become a fan favorite at Nagyerdei Stadion.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop', 'Transfer', 'DVSC Media', now() - interval '5 days', false, 'published'),
('Nagyerdei Stadion Renovation Plans Unveiled', 'stadium-renovation-plans', 'The club has revealed ambitious plans to modernize Nagyerdei Stadion...', 'The club has revealed ambitious plans to modernize Nagyerdei Stadion, including expanded seating, improved facilities, and state-of-the-art training grounds. The renovation is expected to be completed by 2027 and will increase capacity to 25,000. This investment demonstrates the club commitment to providing world-class facilities for both players and supporters.', 'https://images.unsplash.com/photo-1577223625816-7546f13f4e2c?w=800&h=500&fit=crop', 'Club News', 'DVSC Media', now() - interval '7 days', false, 'published'),
('Youth Academy Produces Another National Team Player', 'youth-academy-national-team', 'Another DVSC academy graduate has been called up to the Hungarian national team...', 'Another DVSC academy graduate has been called up to the Hungarian national team, highlighting the club world-class youth development program. The 19-year-old midfielder has been in sensational form this season and caught the eye of national team selectors. This marks the 15th DVSC academy player to earn a national team cap in the past decade.', 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&h=500&fit=crop', 'Academy', 'DVSC Media', now() - interval '10 days', false, 'published')
ON CONFLICT (slug) DO NOTHING;

-- Forum Topics
INSERT INTO forum_topics (title, content, category, views, created_at) VALUES
('Who was your favorite DVSC player of all time?', 'Let discuss the legends who wore the red and white. For me, it has to be Dzsudzsak - that left foot was pure magic. What about you?', 'General', 42, now() - interval '1 day'),
('Match Thread: DVSC vs Ferencvaros', 'The big derby is here! Predictions? I am going with 2-1 to DVSC. Let''s get behind the team!', 'Match Day', 128, now() - interval '3 days'),
('Ticket Information for Next Season', 'Does anyone know when season tickets go on sale? I want to make sure I get my usual seat in the B stand.', 'General', 67, now() - interval '5 days'),
('Best Place to Eat Near the Stadium', 'Heading to the match this weekend. Where do you guys grab food before kickoff? Any local recommendations?', 'Off Topic', 23, now() - interval '7 days')
ON CONFLICT DO NOTHING;

-- Gallery Photos
INSERT INTO gallery_photos (title, image_url, author, category) VALUES
('Nagyerdei Stadion at Sunset', 'https://images.unsplash.com/photo-1577223625816-7546f13f4e2c?w=600&h=400&fit=crop', 'DVSC Fan', 'Stadium'),
('Team Celebrates Victory', 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&h=400&fit=crop', 'DVSC Media', 'Match Day'),
('Fans in the Stands', 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?w=600&h=400&fit=crop', 'LokiSzurkoló', 'Match Day'),
('Training Session', 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=400&fit=crop', 'DVSC Media', 'Training'),
('Derby Atmosphere', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop', 'DebrecenFan', 'Match Day'),
('Youth Team Match', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop', 'Academy Scout', 'Academy')
ON CONFLICT DO NOTHING;

-- History Timeline
INSERT INTO history_timeline (year, title, description, image_url) VALUES
('1902', 'Club Founded', 'Debreceni Vasutas Sport Club was founded, beginning a journey that would span over a century of Hungarian football history.', 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&h=300&fit=crop'),
('1943', 'First Major Trophy', 'DVSC won its first significant trophy, establishing itself as a force in Hungarian football.', NULL),
('1993', 'Return to Top Flight', 'After years in the lower divisions, DVSC earned promotion back to the Nemzeti Bajnoksag I.', NULL),
('2009', 'Champions League Group Stage', 'DVSC made history by reaching the UEFA Champions League group stage, the pinnacle of the club European achievements.', 'https://images.unsplash.com/photo-1577223625816-7546f13f4e2c?w=400&h=300&fit=crop'),
('2010', 'League and Cup Double', 'An unforgettable season as DVSC won both the league title and the Hungarian Cup.', NULL),
('2014', 'Europa League Campaign', 'DVSC qualified for the UEFA Europa League group stage, showcasing Hungarian football on the European stage.', NULL),
('2020', 'Nagyerdei Stadion Opening', 'The new Nagyerdei Stadion opened its doors, providing a modern home for the team and its supporters.', 'https://images.unsplash.com/photo-1577223625816-7546f13f4e2c?w=400&h=300&fit=crop')
ON CONFLICT DO NOTHING;

-- Trophies
INSERT INTO trophies (title, competition, season, image_url, description) VALUES
('NB I Champions', 'Nemzeti Bajnoksag I', '2009-2010', 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=300&h=400&fit=crop', 'First league title in the modern era, securing a historic Champions League qualification.'),
('NB I Champions', 'Nemzeti Bajnoksag I', '2011-2012', NULL, 'Dominant season with memorable victories over traditional rivals.'),
('NB I Champions', 'Nemzeti Bajnoksag I', '2013-2014', NULL, 'The team showed incredible consistency throughout the campaign.'),
('Magyar Kupa', 'Hungarian Cup', '2011-2012', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&h=400&fit=crop', 'A dramatic cup run culminating in victory at the national stadium.'),
('Magyar Kupa', 'Hungarian Cup', '2013-2014', NULL, 'Defended the cup title with a commanding final performance.'),
('Ligakupa', 'League Cup', '2010', NULL, 'The inaugural League Cup triumph.'),
('Szuperkupa', 'Super Cup', '2010', NULL, 'Claimed the Super Cup to complete a memorable double.')
ON CONFLICT DO NOTHING;

-- Legendary Players
INSERT INTO legendary_players (name, position, years, image_url, bio, achievements) VALUES
('Balazs Dzsudzsak', 'Left Winger', '2004-2011, 2020-', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=500&fit=crop', 'The club most iconic modern player. Dzsudzsak magical left foot and incredible vision made him a fan favorite. After starring in Europe top leagues, he returned to lead the team once more.', '100+ goals, Champions League group stage, National team captain'),
('Tibor Dombi', 'Right Back', '1993-2014', NULL, 'A one-club man who spent over two decades at DVSC. Dombi loyalty and consistent performances made him a legend. He played in more than 400 matches for the club.', '400+ appearances, 7 league titles'),
('Zoltan Kiss', 'Defender', '2000-2012', NULL, 'A rock at the heart of the defense during the club most successful period. Kiss leadership and aerial ability were crucial to multiple title wins.', '5 league titles, 200+ clean sheets'),
('Adam Szalai', 'Striker', '2007-2010', NULL, 'A powerful striker who developed at DVSC before moving to top European leagues. His physical presence and finishing ability terrorized defenses.', '30+ goals in a single season'),
('Laszlo Rezes', 'Midfielder', '2005-2015', NULL, 'The engine room of the team during its golden era. Rezes work rate and passing range made him indispensable.', '3 league titles, 250+ appearances')
ON CONFLICT DO NOTHING;

-- Additional Demo Fixtures (beyond API data)
INSERT INTO fixtures (competition, opponent, home_away, match_date, venue, status, dvsc_score, opponent_score) VALUES
('NB I', 'Ferencvaros', 'home', now() + interval '7 days', 'Nagyerdei Stadion', 'scheduled', NULL, NULL),
('NB I', 'Puskas Akademia', 'away', now() + interval '14 days', 'Pancho Arena', 'scheduled', NULL, NULL),
('Magyar Kupa', 'Kisvarda', 'home', now() + interval '21 days', 'Nagyerdei Stadion', 'scheduled', NULL, NULL),
('NB I', 'Ferencvaros', 'away', now() - interval '14 days', 'Groupama Arena', 'finished', 1, 2),
('NB I', 'Paks', 'home', now() - interval '21 days', 'Nagyerdei Stadion', 'finished', 3, 0),
('NB I', 'Zalaegerszeg', 'away', now() - interval '28 days', 'ZTE Arena', 'finished', 2, 2)
ON CONFLICT DO NOTHING;

-- Demo Squad Players (beyond API data)
INSERT INTO squad_players (name, position, number, nationality, image_url, bio, appearances, goals, assists) VALUES
('Balazs Dzsudzsak', 'Left Wing', 17, 'Hungary', 'https://r2.thesportsdb.com/images/media/player/thumb/tphc331605554853.jpg', 'Club captain and legendary winger', 245, 67, 89),
('Donat Barany', 'Striker', 9, 'Hungary', NULL, 'Young striker with great potential', 78, 32, 12),
('Jozsef Varga', 'Midfielder', 6, 'Hungary', NULL, 'Experienced midfielder and vice-captain', 198, 15, 34),
('Erik Kusnyir', 'Defender', 4, 'Hungary', NULL, 'Solid center-back', 112, 5, 2),
('Balazs Megyeri', 'Goalkeeper', 1, 'Hungary', NULL, 'Reliable shot-stopper', 89, 0, 1)
ON CONFLICT DO NOTHING;

-- Newsletter Subscribers
INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES
('fan1@example.com', now() - interval '10 days'),
('supporter@example.com', now() - interval '5 days')
ON CONFLICT (email) DO NOTHING;
