-- ============================================
-- SEED DATA - Test Books & Admin User
-- ============================================

-- Create admin user in auth.users first
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  phone,
  phone_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  NULL,
  '',
  '94771234567',
  NOW(),
  '{"provider": "phone", "providers": ["phone"]}',
  '{"display_name": "Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create admin profile
INSERT INTO public.users (
  id,
  phone,
  display_name,
  role,
  language_preference,
  is_first_login
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '94771234567',
  'Admin User',
  'admin',
  'en',
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- Insert test books
INSERT INTO public.books (
  id,
  title_en,
  title_si,
  description_en,
  description_si,
  author_en,
  author_si,
  price_lkr,
  is_free,
  free_preview_chapters,
  is_published,
  published_at,
  total_chapters
) VALUES 
(
  'b1000001-0000-0000-0000-000000000001',
  'The Village by the River',
  'ගඟ අද්දර ගම',
  'A heartwarming tale of life in a small Sri Lankan village, where traditions meet modernity.',
  'කුඩා ශ්‍රී ලාංකික ගමක ජීවිතය පිළිබඳ හදවත් උණුසුම් කතාවක්.',
  'Kamal Perera',
  'කමල් පෙරේරා',
  1500.00,
  FALSE,
  2,
  TRUE,
  NOW(),
  12
),
(
  'b1000001-0000-0000-0000-000000000002',
  'Monsoon Dreams',
  'මෝසම් සිහින',
  'A romantic story set during the monsoon season in the hill country of Sri Lanka.',
  'ශ්‍රී ලංකාවේ කඳුකර ප්‍රදේශයේ මෝසම් සමයේ සිදුවන ආදර කතාවක්.',
  'Nimali Fernando',
  'නිමාලි ප්‍රනාන්දු',
  1200.00,
  FALSE,
  2,
  TRUE,
  NOW(),
  8
),
(
  'b1000001-0000-0000-0000-000000000003',
  'The Tea Plucker''s Daughter',
  'තේ කොළ කඩන්නියගේ දුව',
  'An inspiring story of a young woman who rises from humble beginnings in the tea estates.',
  'තේ වතු වල සරල ආරම්භයකින් නැඟී සිටින තරුණියකගේ ආශ්වාදජනක කතාව.',
  'Saman Wickramasinghe',
  'සමන් වික්‍රමසිංහ',
  1800.00,
  FALSE,
  2,
  TRUE,
  NOW(),
  15
),
(
  'b1000001-0000-0000-0000-000000000004',
  'Echoes of Anuradhapura',
  'අනුරාධපුර දෝංකාර',
  'A historical fiction exploring the ancient kingdom of Anuradhapura through the eyes of a young monk.',
  'තරුණ භික්ෂුවකගේ ඇසින් අනුරාධපුර පුරාණ රාජධානිය ගවේෂණය කරන ඓතිහාසික ප්‍රබන්ධයකි.',
  'Priyantha Kumara',
  'ප්‍රියන්ත කුමාර',
  2000.00,
  FALSE,
  2,
  TRUE,
  NOW(),
  20
),
(
  'b1000001-0000-0000-0000-000000000005',
  'Free Sample: Folk Tales',
  'නොමිලේ: ජන කතා',
  'A free collection of traditional Sri Lankan folk tales for all ages.',
  'සියලු වයස් කාණ්ඩ සඳහා සම්ප්‍රදායික ශ්‍රී ලාංකික ජන කතා එකතුවක්.',
  'Various Authors',
  'විවිධ කතුවරුන්',
  0.00,
  TRUE,
  99,
  TRUE,
  NOW(),
  5
)
ON CONFLICT (id) DO NOTHING;

-- Add sample chapters for each book
INSERT INTO public.chapters (id, book_id, chapter_number, title_en, title_si, content, word_count, estimated_reading_time)
VALUES
-- The Village by the River - Chapters
('c1000001-0001-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000001', 1, 'Dawn by the River', 'ගඟ අද්දර අරුණෝදය', 
'The morning mist hung low over the Mahaweli River as Siri opened his eyes. The familiar sounds of the village waking up – roosters crowing, mothers calling children, the distant temple bell – filled the cool air.

He stretched on his mat, watching the first rays of sunlight filter through the woven palm walls of their small home. Today was special. Today, his father would take him to the paddy fields for the first time.

"Siri! Come, the rice is ready," his mother called from the kitchen, where smoke curled up from the clay hearth.

The village of Galwewa had been his whole world for twelve years. Nestled in a bend of the great river, surrounded by emerald rice paddies and coconut groves, it was a place where time moved slowly, measured not by clocks but by the rhythm of the seasons.

He splashed water on his face from the clay pot by the door and looked out at the river. It flowed past their village like a great silver serpent, carrying with it the stories of a thousand years.',
850, 4),

('c1000001-0001-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000001', 2, 'The Paddy Fields', 'කුඹුර', 
'The walk to the paddy fields took them past the ancient bo tree where the village elders gathered each evening. Siri''s father, Bandara, walked ahead with the sure steps of a man who had made this journey ten thousand times.

"You see how the water catches the light?" Bandara pointed to the flooded fields ahead. "That is not just water, son. That is our life. Our ancestors have tended these fields for generations."

Siri nodded, though he only half understood. The fields stretched before them like a mirror reflecting the morning sky, broken only by the tender green shoots of rice pushing up through the water.

Other farmers were already at work, their sarongs tucked up, bent over the plants. They called out greetings to Bandara, curious glances falling on young Siri.

"Is this the day then?" old Podi Mahattaya asked, leaning on his mammoty. "The boy joins the fields?"

"It is time," Bandara replied simply.

Siri felt a surge of pride. He was no longer just a child playing by the river. Today, he would begin to learn the ancient art that had sustained his people since the time of the kings.',
720, 3),

-- Monsoon Dreams - Chapters  
('c1000002-0001-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000002', 1, 'The First Rains', 'පළමු වැස්ස', 
'Kamala stood at the window of the tea factory office, watching the clouds gather over the distant mountains. The air was thick with anticipation – that peculiar heaviness that comes before the monsoon breaks.

She had returned to Nuwara Eliya three months ago, after five years in Colombo. The city had given her an education, a career in accounting, and a broken engagement. The hills had given her back her peace.

"The rains will come tonight," said old Ranjith, the factory supervisor, joining her at the window. "I can feel it in my bones."

The tea estate spread out below them in neat green rows, the pluckers moving through them like colorful birds in their bright clothes. This had been her grandfather''s estate once, before it was sold to the company. Now she managed its books, a strange twist of fate that felt somehow right.

A cool wind swept through the window, carrying the scent of tea and approaching rain. Kamala closed her eyes and breathed deeply. Whatever she had lost in Colombo, she had found something else here in these misty hills.',
680, 3),

('c1000002-0001-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000002', 2, 'The Stranger', 'නුහුරු මිනිසා', 
'He arrived with the rain.

Kamala first saw him standing under the eaves of the factory, shaking water from his jacket. A stranger – rare enough in these parts, where everyone knew everyone for three generations back.

"Can I help you?" she asked, stepping out of the office.

He turned, and she noticed his eyes first – dark and thoughtful, with a hint of something she couldn''t quite name. Sadness, perhaps, or searching.

"I''m looking for the estate manager," he said. "I''m the new agricultural consultant. Amal. Amal Jayawardena."

The company had mentioned someone coming. She hadn''t expected him so soon, or in such weather.

"The manager is in Colombo this week. I''m Kamala, the accounts manager. You''ll have to make do with me for now."

He smiled then, and it changed his whole face. "I think I can manage that."

The rain hammered on the tin roof above them, and somewhere in the distance, thunder rolled across the mountains. Kamala told herself the shiver that ran through her was from the cold.',
620, 3),

-- Free Folk Tales - Chapters
('c1000005-0001-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000005', 1, 'The Clever Jackal', 'හොර හිවලා', 
'Long ago, in a forest near Sigiriya, there lived a jackal who was known throughout the land for his cleverness. While other animals relied on strength or speed, the jackal used only his wits.

One day, a great drought came to the forest. The rivers dried up, the ponds turned to mud, and all the animals grew desperate with thirst.

Deep in the forest, there was one well that still held water. But it was guarded by a fierce leopard who allowed no one to drink.

"What shall we do?" cried the deer.
"We will die of thirst!" wailed the monkeys.
"Perhaps," said the clever jackal, "there is a way."

That night, while the leopard slept, the jackal crept to the well. But he did not drink. Instead, he began to sing in a loud voice.

The leopard woke with a roar. "Who dares disturb my sleep?"

"Oh great leopard," said the jackal, "I bring terrible news. The king of the jungle has declared that whoever drinks from this well first tomorrow morning shall rule the entire forest."

The leopard''s eyes grew wide with greed...',
580, 3),

('c1000005-0001-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000005', 2, 'The Grateful Cobra', 'කෘතඥ නයා',
'In the time of King Dutugemunu, there lived a poor farmer named Banda who had nothing but a small plot of land and a kind heart.

One evening, while walking home from his fields, Banda heard a strange sound coming from a thorn bush. Looking closer, he found a cobra trapped in the thorns, bleeding from many wounds.

Most men would have run away, or killed the snake. But Banda felt pity for the creature.

"Do not be afraid," he said softly. "I will help you."

Working carefully, he freed the cobra from the thorns and wrapped its wounds with leaves. The snake looked at him with its ancient eyes, then slithered away into the darkness.

Banda thought nothing more of it until, one month later, he found a precious gem lying at his doorstep. And the month after that, another. And another.

His neighbors grew suspicious of his sudden wealth. "Where does a poor farmer get such gems?" they whispered.

But Banda knew. Late at night, he had seen a shadow at his door – the cobra, keeping its silent promise of gratitude.',
540, 2),

-- The Tea Plucker's Daughter - Chapters
('c1000003-0001-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000003', 1, 'Before Dawn', 'අරුණ උදාවට පෙර',
'The alarm did not wake Malini. She was already awake, lying in the darkness of the line room, listening to her mother''s breathing beside her.

At sixteen, Malini had learned to wake before the estate siren. In the tea estates of Hatton, time was measured in leaves – how many you could pluck before the morning mist burned away, how many before your fingers grew numb with cold.

She slipped out of bed quietly, her bare feet finding the familiar cold of the concrete floor. Through the small window, she could see the first gray light touching the mountains.

Her mother stirred. "Already up?"

"The best leaves are picked early, Amma."

It was something her grandmother used to say, before the coughing took her. Three generations of women in her family had worked these fields, their fingers stained green with tea.

But Malini wanted more. In the pocket of her worn dress, hidden from everyone, was a letter. An acceptance letter. A chance.

Today, she would tell her mother. Today, everything would change.',
520, 3),

('c1000003-0001-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000003', 2, 'The Letter', 'ලිපිය',
'The tea bushes were wet with dew as Malini made her way up the slope. Around her, other pluckers were already at work, their nimble fingers dancing over the bushes.

"Two leaves and a bud," her mother had taught her. "Always two leaves and a bud."

But Malini''s mind was not on the leaves today. The letter burned in her pocket like a coal.

A scholarship. A full scholarship to the school in Kandy. Room, board, books – everything paid for. All she had to do was say yes.

But how could she leave? Her mother''s wages alone would not be enough. The line room rent, the food, the medicine for her younger brother''s asthma – it all depended on Malini''s contribution.

"You''re slow today," called out Kamala, the kangani''s daughter, from the next row. "Dreaming of boys?"

Malini forced a smile. "Just tired."

But she was not tired. She was terrified. Terrified of staying. Terrified of leaving. Terrified of the choice that lay before her like two paths diverging in the misty mountains.',
480, 2),

('c1000003-0001-0000-0000-000000000003', 'b1000001-0000-0000-0000-000000000003', 3, 'Mother''s Hands', 'අම්මාගේ අත්',
'That evening, Malini found her mother sitting on the steps of the line room, soaking her hands in a basin of warm water. The fingers were swollen, the joints enlarged from years of plucking.

"Amma, I need to tell you something."

Her mother looked up, and in that moment, Malini saw how old she had become. Forty-two years old, but she could pass for sixty. The estate aged you like that.

Malini pulled out the letter. Her mother could not read, but she recognized the official seal, the typed words that meant something important.

"What is this?"

"A scholarship, Amma. To the convent school in Kandy. They will pay for everything."

Silence stretched between them like the mist between the mountains. Then her mother reached out with her work-worn hands and took the letter.

"Read it to me."

And as Malini read, she watched her mother''s face. The fear. The pride. The terrible, beautiful hope that no amount of hard work had ever managed to crush.',
450, 2),

('c1000003-0001-0000-0000-000000000004', 'b1000001-0000-0000-0000-000000000003', 4, 'The Decision', 'තීරණය',
'"You will go."

Malini stared at her mother. "But Amma, the money—"

"I said you will go." Her mother''s voice was firm, the same voice she used when bargaining with the estate shop. "Your grandmother picked tea. I pick tea. But you—" She paused, her voice catching. "You will not pick tea."

"How will you manage?"

"I managed before you were born. I will manage after you leave."

But Malini knew the truth. She had seen the account book, the careful columns her mother kept despite not knowing how to read. The numbers did not lie.

"I could work during holidays—"

"You will study during holidays. You will study so hard that one day, you will buy me a house with a garden. A real house, not a line room."

Her mother smiled then, and Malini saw the girl she must have been once, before the tea fields and the hard life.

"Promise me," her mother said.

"I promise, Amma."

It was a promise that would take years to keep. But sitting there in the fading light, holding her mother''s calloused hands, Malini meant every word.',
520, 3),

('c1000003-0001-0000-0000-000000000005', 'b1000001-0000-0000-0000-000000000003', 5, 'Leaving Home', 'ගෙදරින් යාම',
'The bus to Kandy left at six in the morning. Malini stood at the estate junction with her small bag, watching the mist rise from the tea fields for what might be the last time in months.

Her mother had woken early to make her favorite – string hoppers with coconut sambol and a boiled egg. A feast by their standards.

"You have everything? The letter? The directions?"

"Yes, Amma."

"And you remember Mrs. Perera''s address? She will meet you at the bus station."

"Yes, Amma."

Her mother pressed something into her hand. A small roll of notes – her savings, Malini realized. Money that should have gone to the shop, to medicine, to a hundred small necessities.

"Amma, I can''t—"

"For emergencies only. Keep it hidden."

The bus appeared around the bend, its headlights cutting through the morning mist. Other passengers began to gather – workers heading to town, a few students like herself.

"Make me proud," her mother whispered, pulling her close. "Make all of us proud."

As the bus pulled away, Malini watched her mother grow smaller and smaller until she was just another figure among the tea bushes, another woman in the endless green.',
540, 3)

ON CONFLICT (id) DO NOTHING;

