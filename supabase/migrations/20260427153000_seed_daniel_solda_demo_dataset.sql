-- Demo seed for Daniel Soldá with five distinct patients, plans, appointments, goals and posts.
DO $$
DECLARE
  nutritionist_uuid uuid := '0de45791-e60f-492f-bc0c-e803865bd5c5';
  v_patient_id uuid;
  v_plan_id uuid;
  v_meal_id uuid;
  v_option_id uuid;
  v_breakfast_image text;
  v_lunch_image text;
  v_dinner_image text;
BEGIN
  INSERT INTO public.nutritionists (
    user_id,
    full_name,
    phone,
    crn,
    specialty,
    avatar_url,
    cover_url,
    bio
  )
  VALUES (
    nutritionist_uuid,
    'Daniel Soldá',
    '(51) 99911-2244',
    'CRN-2/17342',
    'Nutrição esportiva e composição corporal',
    'https://images.pexels.com/photos/32160037/pexels-photo-32160037.jpeg?cs=srgb&dl=pexels-konrads-photo-32160037.jpg&fm=jpg',
    'https://images.pexels.com/photos/15319040/pexels-photo-15319040.jpeg?cs=srgb&dl=pexels-beyzahzah-89810429-15319040.jpg&fm=jpg',
    'Atendimento focado em performance, emagrecimento e adesão prática à rotina.'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    crn = EXCLUDED.crn,
    specialty = EXCLUDED.specialty,
    avatar_url = EXCLUDED.avatar_url,
    cover_url = EXCLUDED.cover_url,
    bio = EXCLUDED.bio,
    updated_at = now();

  -- Paciente 1: Beatriz Rocha Campos
  v_breakfast_image := 'https://images.pexels.com/photos/2271736/pexels-photo-2271736.jpeg?cs=srgb&dl=pexels-almapapi-2271736.jpg&fm=jpg';
  v_lunch_image := 'https://images.pexels.com/photos/5852274/pexels-photo-5852274.jpeg?cs=srgb&dl=pexels-shkrabaanthony-5852274.jpg&fm=jpg';
  v_dinner_image := 'https://images.pexels.com/photos/19615784/pexels-photo-19615784.jpeg?cs=srgb&dl=pexels-valeriya-19615784.jpg&fm=jpg';

  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE nutritionist_id = nutritionist_uuid
    AND name = 'Beatriz Rocha Campos';

  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (
      nutritionist_id,
      name,
      email,
      phone,
      cpf,
      birthdate,
      notes,
      address,
      weight,
      height,
      goal,
      allergies,
      medical_conditions
    )
    VALUES (
      nutritionist_uuid,
      'Beatriz Rocha Campos',
      'beatriz.rocha@example.com',
      '(11) 98721-3304',
      '223.451.670-08',
      '1992-08-14',
      'Treina pilates 3x por semana e corre aos fins de semana.',
      'Rua das Acácias, 145 - Curitiba/PR',
      68.4,
      1.65,
      'Reduzir gordura corporal sem perder energia',
      'Lactose leve',
      'Tendência a anemia leve'
    )
    RETURNING id INTO v_patient_id;
  END IF;

  SELECT id INTO v_plan_id
  FROM public.meal_plans
  WHERE nutritionist_id = nutritionist_uuid
    AND patient_id = v_patient_id
    AND title = 'Plano - Definição inteligente';

  IF v_plan_id IS NULL THEN
    INSERT INTO public.meal_plans (
      nutritionist_id,
      patient_id,
      title,
      notes
    )
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      'Plano - Definição inteligente',
      'Déficit leve, proteína alta e carboidrato distribuído ao redor dos treinos.'
    )
    RETURNING id INTO v_plan_id;
  END IF;

  SELECT id INTO v_meal_id
  FROM public.meals
  WHERE meal_plan_id = v_plan_id
    AND name = 'Café da manhã';

  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (
      meal_plan_id,
      name,
      type,
      time,
      location,
      description,
      sort_order
    )
    VALUES (
      v_plan_id,
      'Café da manhã',
      'qualitativa',
      '07:10',
      'Casa',
      'Café da manhã com proteína e saciedade.',
      0
    )
    RETURNING id INTO v_meal_id;
  END IF;

  SELECT id INTO v_option_id
  FROM public.meal_options
  WHERE meal_id = v_meal_id
    AND name = 'Opção principal';

  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_breakfast_image, 0)
    RETURNING id INTO v_option_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.meal_images mi
    WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0
  ) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order)
    VALUES (v_meal_id, v_breakfast_image, 'Café da manhã da Beatriz', 0);
  END IF;

  INSERT INTO public.meal_food_items (
    meal_option_id,
    food_name,
    quantity,
    unit,
    is_substitute,
    sort_order
  )
  SELECT
    v_option_id,
    item.food_name,
    item.quantity,
    item.unit,
    false,
    item.sort_order
  FROM (
    VALUES
      ('Ovos mexidos', '2', 'unidades', 0),
      ('Aveia em flocos', '4', 'colheres de sopa', 1),
      ('Banana', '1', 'unidade', 2),
      ('Café sem açúcar', '1', 'xícara', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.meal_food_items mfi
    WHERE mfi.meal_option_id = v_option_id
      AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id
  FROM public.meals
  WHERE meal_plan_id = v_plan_id
    AND name = 'Almoço';

  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (
      meal_plan_id,
      name,
      type,
      time,
      location,
      description,
      sort_order
    )
    VALUES (
      v_plan_id,
      'Almoço',
      'qualitativa',
      '12:45',
      'Trabalho',
      'Almoço colorido com proteína magra.',
      1
    )
    RETURNING id INTO v_meal_id;
  END IF;

  SELECT id INTO v_option_id
  FROM public.meal_options
  WHERE meal_id = v_meal_id
    AND name = 'Opção principal';

  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_lunch_image, 0)
    RETURNING id INTO v_option_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.meal_images mi
    WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0
  ) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order)
    VALUES (v_meal_id, v_lunch_image, 'Almoço da Beatriz', 0);
  END IF;

  INSERT INTO public.meal_food_items (
    meal_option_id,
    food_name,
    quantity,
    unit,
    is_substitute,
    sort_order
  )
  SELECT
    v_option_id,
    item.food_name,
    item.quantity,
    item.unit,
    false,
    item.sort_order
  FROM (
    VALUES
      ('Arroz integral cozido', '4', 'colheres de sopa', 0),
      ('Frango grelhado temperado', '120', 'g', 1),
      ('Legumes no vapor coloridos', '1', 'porção', 2),
      ('Salada de folhas', '1', 'prato', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.meal_food_items mfi
    WHERE mfi.meal_option_id = v_option_id
      AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id
  FROM public.meals
  WHERE meal_plan_id = v_plan_id
    AND name = 'Jantar';

  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (
      meal_plan_id,
      name,
      type,
      time,
      location,
      description,
      sort_order
    )
    VALUES (
      v_plan_id,
      'Jantar',
      'qualitativa',
      '19:45',
      'Casa',
      'Jantar leve para fechar o dia.',
      2
    )
    RETURNING id INTO v_meal_id;
  END IF;

  SELECT id INTO v_option_id
  FROM public.meal_options
  WHERE meal_id = v_meal_id
    AND name = 'Opção principal';

  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_dinner_image, 0)
    RETURNING id INTO v_option_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.meal_images mi
    WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0
  ) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order)
    VALUES (v_meal_id, v_dinner_image, 'Jantar da Beatriz', 0);
  END IF;

  INSERT INTO public.meal_food_items (
    meal_option_id,
    food_name,
    quantity,
    unit,
    is_substitute,
    sort_order
  )
  SELECT
    v_option_id,
    item.food_name,
    item.quantity,
    item.unit,
    false,
    item.sort_order
  FROM (
    VALUES
      ('Peixe assado', '140', 'g', 0),
      ('Batata-doce assada', '1', 'unidade média', 1),
      ('Abobrinha refogada', '1', 'porção', 2),
      ('Azeite de oliva', '1', 'colher de chá', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.meal_food_items mfi
    WHERE mfi.meal_option_id = v_option_id
      AND mfi.sort_order = item.sort_order
  );

  INSERT INTO public.patient_goals (
    patient_id,
    nutritionist_id,
    title,
    description,
    category,
    status,
    target_value,
    current_value,
    unit,
    deadline,
    completed_at
  )
  SELECT
    v_patient_id,
    nutritionist_uuid,
    g.title,
    g.description,
    g.category,
    g.status,
    g.target_value,
    g.current_value,
    g.unit,
    g.deadline,
    g.completed_at::timestamptz
  FROM (
    VALUES
      ('Hidratação diária', 'Bater 2,4 L por dia com reforço no treino.', 'habito'::public.goal_category, 'concluida'::public.goal_status, '2.4', '2.4', 'L', DATE '2026-05-20', TIMESTAMPTZ '2026-04-24 18:00:00+00'),
      ('Redução de cintura', 'Reduzir 4 cm sem perder energia para o treino.', 'medida'::public.goal_category, 'ativa'::public.goal_status, '4', '1.5', 'cm', DATE '2026-06-15', NULL)
  ) AS g(title, description, category, status, target_value, current_value, unit, deadline, completed_at)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.patient_goals pg
    WHERE pg.patient_id = v_patient_id
      AND pg.title = g.title
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.patient_id = v_patient_id
      AND a.date = DATE '2026-05-03'
      AND a.time_start = TIME '08:30'
  ) THEN
    INSERT INTO public.appointments (
      nutritionist_id,
      patient_id,
      date,
      time_start,
      time_end,
      status,
      notes
    )
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      DATE '2026-05-03',
      TIME '08:30',
      TIME '09:00',
      'agendada',
      'Primeira revisão do plano com foco em adesão.'
    );
  END IF;

  -- Paciente 2: Eduardo Vinícius Alves
  v_breakfast_image := 'https://images.pexels.com/photos/7460170/pexels-photo-7460170.jpeg?cs=srgb&dl=pexels-barczakshoots-7460170.jpg&fm=jpg';
  v_lunch_image := 'https://images.pexels.com/photos/5852457/pexels-photo-5852457.jpeg?cs=srgb&dl=pexels-shkrabaanthony-5852457.jpg&fm=jpg';
  v_dinner_image := 'https://images.pexels.com/photos/842545/pexels-photo-842545.jpeg?cs=srgb&dl=pexels-valeriya-842545.jpg&fm=jpg';

  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE nutritionist_id = nutritionist_uuid
    AND name = 'Eduardo Vinícius Alves';

  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (
      nutritionist_id,
      name,
      email,
      phone,
      cpf,
      birthdate,
      notes,
      address,
      weight,
      height,
      goal,
      allergies,
      medical_conditions
    )
    VALUES (
      nutritionist_uuid,
      'Eduardo Vinícius Alves',
      'eduardo.alves@example.com',
      '(41) 99654-1188',
      '345.782.910-21',
      '1986-02-09',
      'Musculação 4x por semana e trabalho em home office.',
      'Av. Sete de Setembro, 2100 - Florianópolis/SC',
      92.8,
      1.80,
      'Reduzir gordura abdominal e manter força',
      'Castanhas',
      'Pressão levemente elevada'
    )
    RETURNING id INTO v_patient_id;
  END IF;

  SELECT id INTO v_plan_id
  FROM public.meal_plans
  WHERE nutritionist_id = nutritionist_uuid
    AND patient_id = v_patient_id
    AND title = 'Plano - Performance e perda de gordura';

  IF v_plan_id IS NULL THEN
    INSERT INTO public.meal_plans (nutritionist_id, patient_id, title, notes)
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      'Plano - Performance e perda de gordura',
      'Rotina prática com refeições simples, saciedade alta e proteína consistente.'
    )
    RETURNING id INTO v_plan_id;
  END IF;

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Café da manhã';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Café da manhã', 'qualitativa', '06:50', 'Casa', 'Café da manhã com energia estável para segurar a fome.', 0)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_breakfast_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_breakfast_image, 'Café da manhã do Eduardo', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Iogurte natural', '1', 'pote', 0),
      ('Aveia em flocos', '4', 'colheres de sopa', 1),
      ('Chia', '1', 'colher de sopa', 2),
      ('Morangos', '1', 'xícara', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Almoço';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Almoço', 'qualitativa', '12:30', 'Trabalho', 'Almoço prático e rico em proteína para apoiar o treino.', 1)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_lunch_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_lunch_image, 'Almoço do Eduardo', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Arroz integral cozido', '4', 'colheres de sopa', 0),
      ('Carne magra', '140', 'g', 1),
      ('Legumes assados', '1', 'porção', 2),
      ('Salada de folhas', '1', 'prato', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Jantar';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Jantar', 'qualitativa', '20:00', 'Casa', 'Jantar leve, com proteína e vegetais, para fechar o dia sem exagero.', 2)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_dinner_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_dinner_image, 'Jantar do Eduardo', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Salmão', '130', 'g', 0),
      ('Quinoa', '1', 'porção', 1),
      ('Brócolis', '1', 'porção', 2),
      ('Azeite de oliva', '1', 'colher de chá', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  INSERT INTO public.patient_goals (
    patient_id,
    nutritionist_id,
    title,
    description,
    category,
    status,
    target_value,
    current_value,
    unit,
    deadline,
    completed_at
  )
  SELECT v_patient_id, nutritionist_uuid, g.title, g.description, g.category, g.status, g.target_value, g.current_value, g.unit, g.deadline, g.completed_at::timestamptz
  FROM (
    VALUES
      ('Peso-alvo', 'Reduzir o peso sem perder força nos treinos.', 'peso'::public.goal_category, 'ativa'::public.goal_status, '88', '92.8', 'kg', DATE '2026-07-01', NULL),
      ('Passos diários', 'Bater a meta de movimento em dias úteis.', 'habito'::public.goal_category, 'ativa'::public.goal_status, '8000', '5600', 'passos', DATE '2026-05-31', NULL)
  ) AS g(title, description, category, status, target_value, current_value, unit, deadline, completed_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.patient_goals pg WHERE pg.patient_id = v_patient_id AND pg.title = g.title
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.appointments a WHERE a.patient_id = v_patient_id AND a.date = DATE '2026-05-06' AND a.time_start = TIME '14:30'
  ) THEN
    INSERT INTO public.appointments (nutritionist_id, patient_id, date, time_start, time_end, status, notes)
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      DATE '2026-05-06',
      TIME '14:30',
      TIME '15:00',
      'pendente',
      'Consulta online para ajustar rotina e distribuição de carboidratos.'
    );
  END IF;

  -- Paciente 3: Juliana Pereira Nunes
  v_breakfast_image := 'https://images.pexels.com/photos/19559056/pexels-photo-19559056.jpeg?cs=srgb&dl=pexels-aysenurhamra-68268085-19559056.jpg&fm=jpg';
  v_lunch_image := 'https://images.pexels.com/photos/29269831/pexels-photo-29269831.jpeg?cs=srgb&dl=pexels-diet-guide-2072911832-29269831.jpg&fm=jpg';
  v_dinner_image := 'https://images.pexels.com/photos/3184188/pexels-photo-3184188.jpeg?cs=srgb&dl=pexels-fauxels-3184188.jpg&fm=jpg';

  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE nutritionist_id = nutritionist_uuid
    AND name = 'Juliana Pereira Nunes';

  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (
      nutritionist_id,
      name,
      email,
      phone,
      cpf,
      birthdate,
      notes,
      address,
      weight,
      height,
      goal,
      allergies,
      medical_conditions
    )
    VALUES (
      nutritionist_uuid,
      'Juliana Pereira Nunes',
      'juliana.nunes@example.com',
      '(31) 99512-4470',
      '489.216.730-90',
      '1998-11-23',
      'Corredora amadora, treinos alternados e foco em energia estável.',
      'Rua Maranhão, 88 - Belo Horizonte/MG',
      59.1,
      1.68,
      'Melhorar performance na corrida de 10 km',
      'Glúten leve',
      'Ferritina baixa'
    )
    RETURNING id INTO v_patient_id;
  END IF;

  SELECT id INTO v_plan_id
  FROM public.meal_plans
  WHERE nutritionist_id = nutritionist_uuid
    AND patient_id = v_patient_id
    AND title = 'Plano - Performance para corrida';

  IF v_plan_id IS NULL THEN
    INSERT INTO public.meal_plans (nutritionist_id, patient_id, title, notes)
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      'Plano - Performance para corrida',
      'Carboidrato distribuído ao redor dos treinos, ferro reforçado e jantar leve.'
    )
    RETURNING id INTO v_plan_id;
  END IF;

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Café da manhã';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Café da manhã', 'qualitativa', '06:40', 'Casa', 'Café da manhã com energia para o primeiro treino do dia.', 0)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_breakfast_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_breakfast_image, 'Café da manhã da Juliana', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Tapioca', '2', 'colheres', 0),
      ('Ovos', '2', 'unidades', 1),
      ('Mamão', '1', 'fatia', 2),
      ('Café', '1', 'xícara', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Almoço';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Almoço', 'qualitativa', '12:20', 'Trabalho', 'Almoço com carboidrato e ferro para sustentar a corrida.', 1)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_lunch_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_lunch_image, 'Almoço da Juliana', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Macarrão integral', '1', 'prato', 0),
      ('Frango grelhado temperado', '120', 'g', 1),
      ('Salada de folhas', '1', 'prato', 2),
      ('Frutas vermelhas', '1', 'xícara', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Jantar';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Jantar', 'qualitativa', '19:40', 'Casa', 'Jantar simples para recuperação e digestão leve.', 2)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_dinner_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_dinner_image, 'Jantar da Juliana', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Arroz integral cozido', '4', 'colheres de sopa', 0),
      ('Peixe assado', '140', 'g', 1),
      ('Legumes no vapor coloridos', '1', 'porção', 2),
      ('Abacate', '3', 'colheres', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  INSERT INTO public.patient_goals (
    patient_id,
    nutritionist_id,
    title,
    description,
    category,
    status,
    target_value,
    current_value,
    unit,
    deadline,
    completed_at
  )
  SELECT v_patient_id, nutritionist_uuid, g.title, g.description, g.category, g.status, g.target_value, g.current_value, g.unit, g.deadline, g.completed_at::timestamptz
  FROM (
    VALUES
      ('Corrida de 10 km abaixo de 58 min', 'Buscar uma corrida mais constante sem perder potência.', 'outro'::public.goal_category, 'ativa'::public.goal_status, '58', '61', 'min', DATE '2026-07-01', NULL),
      ('Aumentar ferritina', 'Subir a reserva de ferro para sustentar os treinos.', 'nutricional'::public.goal_category, 'ativa'::public.goal_status, '24', '17', 'ng/mL', DATE '2026-06-15', NULL)
  ) AS g(title, description, category, status, target_value, current_value, unit, deadline, completed_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.patient_goals pg WHERE pg.patient_id = v_patient_id AND pg.title = g.title
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.appointments a WHERE a.patient_id = v_patient_id AND a.date = DATE '2026-05-09' AND a.time_start = TIME '11:00'
  ) THEN
    INSERT INTO public.appointments (nutritionist_id, patient_id, date, time_start, time_end, status, notes)
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      DATE '2026-05-09',
      TIME '11:00',
      TIME '11:40',
      'agendada',
      'Revisar suplementação e pré-treino antes das provas.'
    );
  END IF;

  -- Paciente 4: Rafael Costa Menezes
  v_breakfast_image := 'https://images.pexels.com/photos/11425936/pexels-photo-11425936.jpeg?cs=srgb&dl=pexels-daka-11425936.jpg&fm=jpg';
  v_lunch_image := 'https://images.pexels.com/photos/30635714/pexels-photo-30635714.jpeg?cs=srgb&dl=pexels-iara-melo-558346607-30635714.jpg&fm=jpg';
  v_dinner_image := 'https://images.pexels.com/photos/36115189/pexels-photo-36115189.jpeg?cs=srgb&dl=pexels-barbara-atdxb-602688606-36115189.jpg&fm=jpg';

  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE nutritionist_id = nutritionist_uuid
    AND name = 'Rafael Costa Menezes';

  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (
      nutritionist_id,
      name,
      email,
      phone,
      cpf,
      birthdate,
      notes,
      address,
      weight,
      height,
      goal,
      allergies,
      medical_conditions
    )
    VALUES (
      nutritionist_uuid,
      'Rafael Costa Menezes',
      'rafael.costa@example.com',
      '(51) 99780-5531',
      '612.805.490-14',
      '1990-04-02',
      'Almoça fora alguns dias e precisa de opções práticas para o trabalho.',
      'Rua dos Andradas, 705 - Porto Alegre/RS',
      84.3,
      1.82,
      'Ganhar massa com rotina simples',
      'Nenhuma',
      'Refluxo ocasional'
    )
    RETURNING id INTO v_patient_id;
  END IF;

  SELECT id INTO v_plan_id
  FROM public.meal_plans
  WHERE nutritionist_id = nutritionist_uuid
    AND patient_id = v_patient_id
    AND title = 'Plano - Ganho de massa com praticidade';

  IF v_plan_id IS NULL THEN
    INSERT INTO public.meal_plans (nutritionist_id, patient_id, title, notes)
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      'Plano - Ganho de massa com praticidade',
      'Estratégia com refeições simples, densidade calórica moderada e consistência.'
    )
    RETURNING id INTO v_plan_id;
  END IF;

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Café da manhã';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Café da manhã', 'qualitativa', '07:00', 'Casa', 'Café da manhã reforçado para o ganho de massa.', 0)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_breakfast_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_breakfast_image, 'Café da manhã do Rafael', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Omelete de ovos', '3', 'ovos', 0),
      ('Pão integral', '2', 'fatias', 1),
      ('Iogurte natural', '1', 'pote', 2),
      ('Mamão', '1', 'fatia', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Almoço';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Almoço', 'qualitativa', '12:30', 'Trabalho', 'Almoço prático com proteína, arroz e legumes.', 1)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_lunch_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_lunch_image, 'Almoço do Rafael', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Arroz integral cozido', '4', 'colheres de sopa', 0),
      ('Feijão', '1', 'concha', 1),
      ('Carne magra', '150', 'g', 2),
      ('Legumes assados', '1', 'porção', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Jantar';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Jantar', 'qualitativa', '20:10', 'Casa', 'Jantar simples, calórico na medida certa e fácil de repetir.', 2)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_dinner_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_dinner_image, 'Jantar do Rafael', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Frango grelhado temperado', '150', 'g', 0),
      ('Batata-doce assada', '1', 'unidade média', 1),
      ('Salada de folhas', '1', 'prato', 2),
      ('Azeite de oliva', '1', 'colher de chá', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  INSERT INTO public.patient_goals (
    patient_id,
    nutritionist_id,
    title,
    description,
    category,
    status,
    target_value,
    current_value,
    unit,
    deadline,
    completed_at
  )
  SELECT v_patient_id, nutritionist_uuid, g.title, g.description, g.category, g.status, g.target_value, g.current_value, g.unit, g.deadline, g.completed_at::timestamptz
  FROM (
    VALUES
      ('Proteína diária', 'Bater proteína suficiente sem precisar complicar a rotina.', 'nutricional'::public.goal_category, 'ativa'::public.goal_status, '140', '118', 'g', DATE '2026-06-10', NULL),
      ('Peso-alvo', 'Subir peso com controle e sem desconforto gastrointestinal.', 'peso'::public.goal_category, 'ativa'::public.goal_status, '86', '84.3', 'kg', DATE '2026-08-01', NULL)
  ) AS g(title, description, category, status, target_value, current_value, unit, deadline, completed_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.patient_goals pg WHERE pg.patient_id = v_patient_id AND pg.title = g.title
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.appointments a WHERE a.patient_id = v_patient_id AND a.date = DATE '2026-05-13' AND a.time_start = TIME '18:20'
  ) THEN
    INSERT INTO public.appointments (nutritionist_id, patient_id, date, time_start, time_end, status, notes)
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      DATE '2026-05-13',
      TIME '18:20',
      TIME '19:00',
      'agendada',
      'Check-in de hipertrofia e ajuste de carboidratos do jantar.'
    );
  END IF;

  -- Paciente 5: Camila Fernandes Lima
  v_breakfast_image := 'https://images.pexels.com/photos/33376827/pexels-photo-33376827.jpeg?cs=srgb&dl=pexels-iulian-sandu-294198313-33376827.jpg&fm=jpg';
  v_lunch_image := 'https://images.pexels.com/photos/5852285/pexels-photo-5852285.jpeg?cs=srgb&dl=pexels-shkrabaanthony-5852285.jpg&fm=jpg';
  v_dinner_image := 'https://images.pexels.com/photos/34507149/pexels-photo-34507149.jpeg?cs=srgb&dl=pexels-viridianaor-34507149.jpg&fm=jpg';

  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE nutritionist_id = nutritionist_uuid
    AND name = 'Camila Fernandes Lima';

  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (
      nutritionist_id,
      name,
      email,
      phone,
      cpf,
      birthdate,
      notes,
      address,
      weight,
      height,
      goal,
      allergies,
      medical_conditions
    )
    VALUES (
      nutritionist_uuid,
      'Camila Fernandes Lima',
      'camila.lima@example.com',
      '(21) 99210-8841',
      '772.194.560-02',
      '1994-09-17',
      'Trabalho híbrido e faz almoço fora de casa três vezes por semana.',
      'Rua Voluntários da Pátria, 420 - Rio de Janeiro/RJ',
      73.6,
      1.70,
      'Melhorar glicemia e manter constância',
      'Mariscos',
      'Resistência à insulina'
    )
    RETURNING id INTO v_patient_id;
  END IF;

  SELECT id INTO v_plan_id
  FROM public.meal_plans
  WHERE nutritionist_id = nutritionist_uuid
    AND patient_id = v_patient_id
    AND title = 'Plano - Controle glicêmico e constância';

  IF v_plan_id IS NULL THEN
    INSERT INTO public.meal_plans (nutritionist_id, patient_id, title, notes)
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      'Plano - Controle glicêmico e constância',
      'Carboidratos escolhidos com mais fibra, refeições previsíveis e lanches estruturados.'
    )
    RETURNING id INTO v_plan_id;
  END IF;

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Café da manhã';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Café da manhã', 'qualitativa', '07:20', 'Casa', 'Café da manhã com mais fibra para reduzir picos de glicemia.', 0)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_breakfast_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_breakfast_image, 'Café da manhã da Camila', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Aveia em flocos', '4', 'colheres de sopa', 0),
      ('Chia', '1', 'colher de sopa', 1),
      ('Iogurte natural', '1', 'pote', 2),
      ('Morangos', '1', 'xícara', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Almoço';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Almoço', 'qualitativa', '12:20', 'Trabalho', 'Almoço com fibras, proteína e carboidrato de absorção mais lenta.', 1)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_lunch_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_lunch_image, 'Almoço da Camila', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Salmão', '120', 'g', 0),
      ('Arroz integral cozido', '4', 'colheres de sopa', 1),
      ('Salada de folhas', '1', 'prato', 2),
      ('Abobrinha refogada', '1', 'porção', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  SELECT id INTO v_meal_id FROM public.meals WHERE meal_plan_id = v_plan_id AND name = 'Jantar';
  IF v_meal_id IS NULL THEN
    INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
    VALUES (v_plan_id, 'Jantar', 'qualitativa', '19:30', 'Casa', 'Jantar leve para ajudar na estabilidade glicêmica.', 2)
    RETURNING id INTO v_meal_id;
  END IF;
  SELECT id INTO v_option_id FROM public.meal_options WHERE meal_id = v_meal_id AND name = 'Opção principal';
  IF v_option_id IS NULL THEN
    INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
    VALUES (v_meal_id, 'Opção principal', v_dinner_image, 0)
    RETURNING id INTO v_option_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.meal_images mi WHERE mi.meal_id = v_meal_id AND mi.sort_order = 0) THEN
    INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order) VALUES (v_meal_id, v_dinner_image, 'Jantar da Camila', 0);
  END IF;
  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  SELECT v_option_id, item.food_name, item.quantity, item.unit, false, item.sort_order
  FROM (
    VALUES
      ('Sopa de legumes', '1', 'tigela', 0),
      ('Frango desfiado', '120', 'g', 1),
      ('Grão-de-bico', '1', 'porção', 2),
      ('Folhas verdes', '1', 'prato', 3)
  ) AS item(food_name, quantity, unit, sort_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.meal_food_items mfi WHERE mfi.meal_option_id = v_option_id AND mfi.sort_order = item.sort_order
  );

  INSERT INTO public.patient_goals (
    patient_id,
    nutritionist_id,
    title,
    description,
    category,
    status,
    target_value,
    current_value,
    unit,
    deadline,
    completed_at
  )
  SELECT v_patient_id, nutritionist_uuid, g.title, g.description, g.category, g.status, g.target_value, g.current_value, g.unit, g.deadline, g.completed_at::timestamptz
  FROM (
    VALUES
      ('Glicemia de jejum abaixo de 100', 'Diminuir as oscilações ao longo do dia com refeições mais previsíveis.', 'outro'::public.goal_category, 'ativa'::public.goal_status, '100', '112', 'mg/dL', DATE '2026-06-20', NULL),
      ('Fibra diária', 'Chegar a 25 g por dia com alimentos mais integrais e vegetais.', 'nutricional'::public.goal_category, 'ativa'::public.goal_status, '25', '18', 'g', DATE '2026-05-30', NULL)
  ) AS g(title, description, category, status, target_value, current_value, unit, deadline, completed_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.patient_goals pg WHERE pg.patient_id = v_patient_id AND pg.title = g.title
  );

  IF NOT EXISTS (
    SELECT 1 FROM public.appointments a WHERE a.patient_id = v_patient_id AND a.date = DATE '2026-05-15' AND a.time_start = TIME '08:10'
  ) THEN
    INSERT INTO public.appointments (nutritionist_id, patient_id, date, time_start, time_end, status, notes)
    VALUES (
      nutritionist_uuid,
      v_patient_id,
      DATE '2026-05-15',
      TIME '08:10',
      TIME '08:50',
      'pendente',
      'Consulta para reforçar escolhas fora de casa e lanches da tarde.'
    );
  END IF;

END $$;

INSERT INTO public.posts (nutritionist_id, image_url, caption, created_at)
SELECT
  '0de45791-e60f-492f-bc0c-e803865bd5c5',
  p.image_url,
  p.caption,
  p.created_at
FROM (
  VALUES
    ('https://images.pexels.com/photos/15319019/pexels-photo-15319019.jpeg?cs=srgb&dl=pexels-beyzahzah-89810429-15319019.jpg&fm=jpg', 'Beatriz: proteína no café, prato colorido no almoço e jantar leve para manter a constância.', TIMESTAMPTZ '2026-04-18 08:00:00+00'),
    ('https://images.pexels.com/photos/30635703/pexels-photo-30635703.jpeg?cs=srgb&dl=pexels-iara-melo-558346607-30635703.jpg&fm=jpg', 'Eduardo: marmitas práticas e proteína distribuída para perder gordura sem cair rendimento.', TIMESTAMPTZ '2026-04-20 09:00:00+00'),
    ('https://images.pexels.com/photos/15319047/pexels-photo-15319047.jpeg?cs=srgb&dl=pexels-beyzahzah-89810429-15319047.jpg&fm=jpg', 'Juliana: mais carboidrato bem distribuído e ferro em dia para sustentar os treinos.', TIMESTAMPTZ '2026-04-22 10:30:00+00'),
    ('https://images.pexels.com/photos/5714337/pexels-photo-5714337.jpeg?cs=srgb&dl=pexels-karola-g-5714337.jpg&fm=jpg', 'Rafael: rotina simples vence plano perfeito quando o foco é ganhar massa.', TIMESTAMPTZ '2026-04-24 12:15:00+00'),
    ('https://images.pexels.com/photos/8844553/pexels-photo-8844553.jpeg?cs=srgb&dl=pexels-yaroslav-shuraev-8844553.jpg&fm=jpg', 'Camila: previsibilidade e fibra para ajudar no controle glicêmico do dia a dia.', TIMESTAMPTZ '2026-04-26 18:45:00+00')
) AS p(image_url, caption, created_at)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.posts existing
  WHERE existing.nutritionist_id = '0de45791-e60f-492f-bc0c-e803865bd5c5'
    AND existing.caption = p.caption
);