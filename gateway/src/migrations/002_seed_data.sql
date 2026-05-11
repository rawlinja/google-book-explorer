-- Seed data for google-book-explorer
-- Sample books with metadata

INSERT INTO books (volume_id, title, authors, categories, description, metadata) VALUES
(
  'hyperion-1989',
  'Hyperion',
  ARRAY['Dan Simmons'],
  ARRAY['Science Fiction', 'Space Opera'],
  'A sweeping tale of galactic empire, artificial intelligence, and human destiny. The Hyperion Cantos is a masterpiece of science fiction, combining multiple narrative perspectives with complex world-building.',
  '{"publishedDate": "1989-05-26", "pageCount": 482, "language": "en", "publisher": "Doubleday"}'
),
(
  'foundation-1951',
  'Foundation',
  ARRAY['Isaac Asimov'],
  ARRAY['Science Fiction', 'Hard Science Fiction'],
  'The classic Foundation series begins with a tale of psychohistory and the fall and rise of galactic civilizations. A groundbreaking work that explores the implications of predicting the future.',
  '{"publishedDate": "1951-06-01", "pageCount": 255, "language": "en", "publisher": "Gnome Press"}'
),
(
  'dune-1965',
  'Dune',
  ARRAY['Frank Herbert'],
  ARRAY['Science Fiction', 'Space Opera', 'Dystopian'],
  'The epic story of young Paul Atreides on the desert planet Arrakis. A richly detailed world with complex politics, ecology, and prophecy. One of the most influential science fiction novels ever written.',
  '{"publishedDate": "1965-06-01", "pageCount": 688, "language": "en", "publisher": "Ace Books"}'
),
(
  'neuromancer-1984',
  'Neuromancer',
  ARRAY['William Gibson'],
  ARRAY['Science Fiction', 'Cyberpunk', 'Hard Science Fiction'],
  'The book that defined cyberpunk. A hacker, a cyborg, and an AI navigate the digital and physical worlds in a noir-inspired future. Prescient and influential.',
  '{"publishedDate": "1984-07-01", "pageCount": 271, "language": "en", "publisher": "Ace Books"}'
),
(
  'endgame-clarke-1994',
  'Rendezvous with Rama',
  ARRAY['Arthur C. Clarke'],
  ARRAY['Science Fiction', 'Hard Science Fiction', 'First Contact'],
  'An enormous cylindrical object enters the solar system. Scientists and explorers investigate this mysterious alien vessel. A masterpiece of hard science fiction and wonder.',
  '{"publishedDate": "1973-06-01", "pageCount": 246, "language": "en", "publisher": "Harcourt Brace Jovanovich"}'
);

-- Get the IDs of inserted books for chunking
WITH book_ids AS (
  SELECT id, title FROM books
)
INSERT INTO book_chunks (book_id, chunk_index, content, embedding) VALUES
-- Hyperion chunks
(
  (SELECT id FROM books WHERE volume_id = 'hyperion-1989'),
  0,
  'The Hyperion Cantos is a sprawling science fiction epic that explores themes of time, consciousness, and humanity. The story follows seven pilgrims traveling to the Time Tomb on the planet Hyperion. Each brings their own reasons, hopes, and secrets to this dangerous journey.',
  NULL
),
(
  (SELECT id FROM books WHERE volume_id = 'hyperion-1989'),
  1,
  'Hyperion is a world of contrasts: technologically advanced human enclaves exist alongside ancient mysteries and alien presences. The Time Tomb stands as a monument to forces beyond human understanding, drawing seekers from across known space.',
  NULL
),
-- Foundation chunks
(
  (SELECT id FROM books WHERE volume_id = 'foundation-1951'),
  0,
  'Foundation begins at the end of the Galactic Empire. Hari Seldon, a mathematician, has developed psychohistory - a method to predict the future actions of large populations. He foresees the empire''s collapse and works to establish the Four Foundations to preserve knowledge.',
  NULL
),
(
  (SELECT id FROM books WHERE volume_id = 'foundation-1951'),
  1,
  'The Foundation is established on the remote planet Terminus as a scientific research center. It must survive the chaos of the collapsing empire using intelligence and strategy rather than military force. Four centuries of history unfold as the Foundation grows in power and influence.',
  NULL
),
-- Dune chunks
(
  (SELECT id FROM books WHERE volume_id = 'dune-1965'),
  0,
  'Arrakis, the desert planet, is the source of melange - the most valuable substance in the universe. This spice extends human life, enables space travel, and grants extraordinary mental powers. The great houses of the Landsraad fight for control of Arrakis and its wealth.',
  NULL
),
(
  (SELECT id FROM books WHERE volume_id = 'dune-1965'),
  1,
  'Paul Atreides, son of Duke Leto, is sent to Arrakis as part of a political maneuver. But fate has other plans. His Bene Gesserit training, his desert survival skills, and his connection to the Fremen people set him on a path toward a destiny he never sought.',
  NULL
),
-- Neuromancer chunks
(
  (SELECT id FROM books WHERE volume_id = 'neuromancer-1984'),
  0,
  'Case is a washed-up computer hacker in a dystopian future. He is rescued from certain death by Molly, a cyborg assassin with razor-sharp reflexes and retractable claws. Together they are hired by an AI named Wintermute for a mysterious job that could change the course of human and artificial intelligence.',
  NULL
),
(
  (SELECT id FROM books WHERE volume_id = 'neuromancer-1984'),
  1,
  'The sprawling metropolis of Chiba City serves as the first stop in their journey. Neon lights reflect off rain-slicked streets. Technology and humanity merge in ways both beautiful and terrifying. The virtual realm of cyberspace opens new frontiers and dangers.',
  NULL
),
-- Rendezvous with Rama chunks
(
  (SELECT id FROM books WHERE volume_id = 'endgame-clarke-1994'),
  0,
  'An interstellar probe, Rama, enters the solar system. Its origin and purpose are unknown. The spacecraft Endeavour is dispatched to make contact and explore this mysterious vessel. What they discover challenges everything humanity knows about the universe.',
  NULL
),
(
  (SELECT id FROM books WHERE volume_id = 'endgame-clarke-1994'),
  1,
  'Rama is a perfectly engineered cylinder, rotating to create artificial gravity. Inside, a world awaits - vast chambers, mysterious machinery, and evidence of a sophisticated alien civilization. The exploration team must solve the mysteries of Rama before it leaves the solar system.',
  NULL
);
