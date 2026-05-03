WITH nutritionist AS (
  SELECT id AS nutritionist_id
  FROM auth.users
  WHERE lower(email) = 'contatodanielsolda@gmail.com'
  LIMIT 1
), seed_entries AS (
  SELECT *
  FROM (VALUES
    (
      'Beatriz Rocha Campos',
      DATE '2026-04-27',
      'Café da manhã',
      'Iogurte grego com morangos, aveia e chia para começar o dia com energia.',
      'https://images.pexels.com/photos/2271736/pexels-photo-2271736.jpeg?cs=srgb&dl=pexels-almapapi-2271736.jpg&fm=jpg',
      'Pré-treino leve',
      TIMESTAMPTZ '2026-04-27 07:20:00+00'
    ),
    (
      'Beatriz Rocha Campos',
      DATE '2026-04-27',
      'Jantar',
      'Salmão grelhado com arroz integral e legumes assados.',
      'https://images.pexels.com/photos/19615784/pexels-photo-19615784.jpeg?cs=srgb&dl=pexels-valeriya-19615784.jpg&fm=jpg',
      'Fechou o dia com proteína e fibras.',
      TIMESTAMPTZ '2026-04-27 20:10:00+00'
    ),
    (
      'Eduardo Lima Mendes',
      DATE '2026-04-26',
      'Almoço',
      'Frango grelhado, arroz, feijão e brócolis para a marmita do trabalho.',
      'https://images.pexels.com/photos/30635703/pexels-photo-30635703.jpeg?cs=srgb&dl=pexels-iara-melo-558346607-30635703.jpg&fm=jpg',
      'Sem improviso na rotina do escritório.',
      TIMESTAMPTZ '2026-04-26 12:35:00+00'
    ),
    (
      'Eduardo Lima Mendes',
      DATE '2026-04-26',
      'Lanche da tarde',
      'Sanduíche integral com peito de peru, queijo branco e uma maçã.',
      'https://images.pexels.com/photos/5852285/pexels-photo-5852285.jpeg?cs=srgb&dl=pexels-shkrabaanthony-5852285.jpg&fm=jpg',
      'Lanche rápido antes do treino.',
      TIMESTAMPTZ '2026-04-26 16:20:00+00'
    ),
    (
      'Juliana Siqueira Torres',
      DATE '2026-04-25',
      'Café da manhã',
      'Omelete com pão integral e mamão para começar o dia sem cair energia.',
      'https://images.pexels.com/photos/15319047/pexels-photo-15319047.jpeg?cs=srgb&dl=pexels-beyzahzah-89810429-15319047.jpg&fm=jpg',
      'Antes do treino da manhã.',
      TIMESTAMPTZ '2026-04-25 07:15:00+00'
    ),
    (
      'Juliana Siqueira Torres',
      DATE '2026-04-25',
      'Jantar',
      'Carne magra, batata-doce e salada para recuperar os treinos do dia.',
      'https://images.pexels.com/photos/5714337/pexels-photo-5714337.jpeg?cs=srgb&dl=pexels-karola-g-5714337.jpg&fm=jpg',
      'Refeição mais forte no fim do dia.',
      TIMESTAMPTZ '2026-04-25 19:40:00+00'
    ),
    (
      'Rafael Costa Menezes',
      DATE '2026-04-24',
      'Lanche da manhã',
      'Banana com iogurte natural e aveia para segurar a fome até o almoço.',
      'https://images.pexels.com/photos/8844553/pexels-photo-8844553.jpeg?cs=srgb&dl=pexels-yaroslav-shuraev-8844553.jpg&fm=jpg',
      'Lanche prático no trabalho.',
      TIMESTAMPTZ '2026-04-24 10:05:00+00'
    ),
    (
      'Rafael Costa Menezes',
      DATE '2026-04-24',
      'Almoço',
      'Frango com arroz integral, feijão e legumes para manter a massa magra.',
      'https://images.pexels.com/photos/33376827/pexels-photo-33376827.jpeg?cs=srgb&dl=pexels-iulian-sandu-294198313-33376827.jpg&fm=jpg',
      'Almoço simples e repetível.',
      TIMESTAMPTZ '2026-04-24 12:40:00+00'
    ),
    (
      'Camila Fernandes Lima',
      DATE '2026-04-23',
      'Café da manhã',
      'Overnight oats com chia, frutas e iogurte para controlar melhor a glicemia.',
      'https://images.pexels.com/photos/7460170/pexels-photo-7460170.jpeg?cs=srgb&dl=pexels-barczakshoots-7460170.jpg&fm=jpg',
      'Bem previsível e com fibras.',
      TIMESTAMPTZ '2026-04-23 07:30:00+00'
    ),
    (
      'Camila Fernandes Lima',
      DATE '2026-04-23',
      'Jantar',
      'Sopa de legumes com frango desfiado para uma noite leve.',
      'https://images.pexels.com/photos/36115189/pexels-photo-36115189.jpeg?cs=srgb&dl=pexels-barbara-atdxb-602688606-36115189.jpg&fm=jpg',
      'Jantar leve e fácil de repetir.',
      TIMESTAMPTZ '2026-04-23 19:25:00+00'
    )
  ) AS e(patient_name, entry_date, meal_type, description, photo_url, notes, created_at)
)
INSERT INTO public.food_diary_entries (
  patient_id,
  date,
  meal_type,
  description,
  photo_url,
  notes,
  created_at,
  updated_at
)
SELECT
  p.id,
  e.entry_date,
  e.meal_type,
  e.description,
  e.photo_url,
  e.notes,
  e.created_at,
  e.created_at
FROM seed_entries e
JOIN nutritionist n ON true
JOIN public.patients p
  ON p.nutritionist_id = n.nutritionist_id
 AND p.name = e.patient_name
WHERE NOT EXISTS (
  SELECT 1
  FROM public.food_diary_entries existing
  WHERE existing.patient_id = p.id
    AND existing.date = e.entry_date
    AND existing.meal_type = e.meal_type
);