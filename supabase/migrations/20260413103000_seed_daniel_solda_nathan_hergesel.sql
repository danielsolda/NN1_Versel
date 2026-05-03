DO $$
DECLARE
  nutritionist_id uuid := '0de45791-e60f-492f-bc0c-e803865bd5c5';
  patient_id uuid := 'bbd21941-1a4c-4905-b74f-c4bd89670231';
  image_base text := 'https://vxnzorcqubrqphogsgqq.supabase.co/storage/v1/object/public/meal-images/seed/daniel-solda';
  plan_id uuid;
  meal_id uuid;
  option_id uuid;
  goal_id uuid;
  hydration_goal_id uuid;
  vegetables_goal_id uuid;
  protein_goal_id uuid;
  weight_goal_id uuid;
BEGIN
  INSERT INTO public.meal_plans (nutritionist_id, patient_id, title, notes)
  VALUES (
    nutritionist_id,
    patient_id,
    'Plano Ajuste - Dias de Treino',
    'Versão ajustada por Daniel Soldá para Nathan Hergesel nos dias de treino, com mais carboidrato no café da manhã e no almoço e jantar leve.'
  )
  RETURNING id INTO plan_id;

  INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
  VALUES (
    plan_id,
    'Café da manhã',
    'qualitativa',
    '07:00',
    'Casa',
    'Café da manhã com energia estável para iniciar o dia e apoiar o treino.',
    0
  )
  RETURNING id INTO meal_id;

  INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order)
  VALUES (meal_id, image_base || '/meal-cafe-manha.jpg', 'Café da manhã do plano de treino', 0);

  INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
  VALUES (meal_id, 'Opção principal', image_base || '/option-cafe2.jpg', 0)
  RETURNING id INTO option_id;

  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  VALUES
    (option_id, 'Pão integral', '2', 'fatias', false, 0),
    (option_id, 'Ovos mexidos', '2', 'unidades', false, 1),
    (option_id, 'Banana', '1', 'unidade', false, 2),
    (option_id, 'Café sem açúcar', '1', 'xícara', false, 3);

  INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
  VALUES (
    plan_id,
    'Almoço',
    'qualitativa',
    '12:30',
    'Trabalho',
    'Almoço principal com proteína magra, carboidrato suficiente e boa oferta de fibras.',
    1
  )
  RETURNING id INTO meal_id;

  INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order)
  VALUES (meal_id, image_base || '/meal-almoco.jpg', 'Almoço do plano de treino', 0);

  INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
  VALUES (meal_id, 'Opção principal', image_base || '/option-almoco2.jpg', 0)
  RETURNING id INTO option_id;

  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  VALUES
    (option_id, 'Arroz integral', '4', 'colheres de sopa', false, 0),
    (option_id, 'Feijão', '1', 'concha', false, 1),
    (option_id, 'Frango grelhado', '120', 'g', false, 2),
    (option_id, 'Salada de folhas', '1', 'prato', false, 3),
    (option_id, 'Azeite de oliva', '1', 'colher de chá', false, 4);

  INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
  VALUES (
    plan_id,
    'Jantar',
    'qualitativa',
    '20:00',
    'Casa',
    'Jantar leve para recuperação e boa digestão antes do sono.',
    2
  )
  RETURNING id INTO meal_id;

  INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order)
  VALUES (meal_id, image_base || '/meal-jantar.jpg', 'Jantar do plano de treino', 0);

  INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
  VALUES (meal_id, 'Opção principal', image_base || '/option-jantar2.jpg', 0)
  RETURNING id INTO option_id;

  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  VALUES
    (option_id, 'Peixe assado', '150', 'g', false, 0),
    (option_id, 'Batata-doce', '1', 'unidade média', false, 1),
    (option_id, 'Legumes no vapor', '1', 'porção', false, 2),
    (option_id, 'Abobrinha refogada', '1', 'porção', false, 3);

  INSERT INTO public.meal_plans (nutritionist_id, patient_id, title, notes)
  VALUES (
    nutritionist_id,
    patient_id,
    'Plano Base - Rotina e Saciedade',
    'Plano de manutenção elaborado por Daniel Soldá para Nathan Hergesel, com foco em rotina, saciedade e constância.'
  )
  RETURNING id INTO plan_id;

  INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
  VALUES (
    plan_id,
    'Café da manhã',
    'qualitativa',
    '07:30',
    'Casa',
    'Café da manhã base para manter energia estável e reduzir fome ao longo da manhã.',
    0
  )
  RETURNING id INTO meal_id;

  INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order)
  VALUES (meal_id, image_base || '/meal-cafe-manha.jpg', 'Café da manhã do plano base', 0);

  INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
  VALUES (meal_id, 'Opção principal', image_base || '/option-cafe1.jpg', 0)
  RETURNING id INTO option_id;

  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  VALUES
    (option_id, 'Omelete de ovos', '2', 'ovos', false, 0),
    (option_id, 'Pão integral', '2', 'fatias', false, 1),
    (option_id, 'Iogurte natural', '1', 'pote', false, 2),
    (option_id, 'Mamão', '1', 'fatia', false, 3);

  INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
  VALUES (
    plan_id,
    'Almoço',
    'qualitativa',
    '12:30',
    'Trabalho',
    'Almoço equilibrado para sustentar foco, treino e recuperação sem pesar no final da tarde.',
    1
  )
  RETURNING id INTO meal_id;

  INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order)
  VALUES (meal_id, image_base || '/meal-almoco.jpg', 'Almoço do plano base', 0);

  INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
  VALUES (meal_id, 'Opção principal', image_base || '/option-almoco1.jpg', 0)
  RETURNING id INTO option_id;

  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  VALUES
    (option_id, 'Arroz integral', '4', 'colheres de sopa', false, 0),
    (option_id, 'Feijão', '1', 'concha', false, 1),
    (option_id, 'Carne magra', '120', 'g', false, 2),
    (option_id, 'Salada colorida', '1', 'prato', false, 3),
    (option_id, 'Legumes grelhados', '1', 'porção', false, 4);

  INSERT INTO public.meals (meal_plan_id, name, type, time, location, description, sort_order)
  VALUES (
    plan_id,
    'Jantar',
    'qualitativa',
    '19:30',
    'Casa',
    'Jantar mais leve, com proteína suficiente e boa oferta de fibras para encerrar o dia.',
    2
  )
  RETURNING id INTO meal_id;

  INSERT INTO public.meal_images (meal_id, image_url, caption, sort_order)
  VALUES (meal_id, image_base || '/meal-jantar.jpg', 'Jantar do plano base', 0);

  INSERT INTO public.meal_options (meal_id, name, image_url, sort_order)
  VALUES (meal_id, 'Opção principal', image_base || '/option-jantar1.jpg', 0)
  RETURNING id INTO option_id;

  INSERT INTO public.meal_food_items (meal_option_id, food_name, quantity, unit, is_substitute, sort_order)
  VALUES
    (option_id, 'Frango desfiado', '120', 'g', false, 0),
    (option_id, 'Quinoa', '1', 'porção', false, 1),
    (option_id, 'Legumes assados', '1', 'porção', false, 2),
    (option_id, 'Folhas verdes', '1', 'prato', false, 3);

  INSERT INTO public.patient_goals (patient_id, nutritionist_id, title, description, category, status, target_value, current_value, unit, deadline)
  VALUES (
    patient_id,
    nutritionist_id,
    'Hidratação diária',
    'Bater a meta de água com garrafa de 500ml ao longo do dia e reforço no pré-treino.',
    'habito',
    'ativa',
    '2.5',
    '1.8',
    'L',
    '2026-05-15'
  )
  RETURNING id INTO hydration_goal_id;

  INSERT INTO public.patient_goals (patient_id, nutritionist_id, title, description, category, status, target_value, current_value, unit, deadline)
  VALUES (
    patient_id,
    nutritionist_id,
    'Vegetais em todas as refeições principais',
    'Garantir presença de fibras e micronutrientes no almoço e jantar com variedade de cores.',
    'nutricional',
    'ativa',
    '5',
    '3',
    'porções',
    '2026-05-31'
  )
  RETURNING id INTO vegetables_goal_id;

  INSERT INTO public.patient_goals (patient_id, nutritionist_id, title, description, category, status, target_value, current_value, unit, deadline)
  VALUES (
    patient_id,
    nutritionist_id,
    'Proteína distribuída no dia',
    'Espalhar proteína entre café da manhã, almoço, lanche e jantar para melhorar saciedade e recuperação.',
    'nutricional',
    'ativa',
    '130',
    '108',
    'g',
    '2026-05-20'
  )
  RETURNING id INTO protein_goal_id;

  INSERT INTO public.patient_goals (patient_id, nutritionist_id, title, description, category, status, target_value, current_value, unit, deadline)
  VALUES (
    patient_id,
    nutritionist_id,
    'Peso-alvo com consistência',
    'Acompanhar a redução gradual de peso sem cortes agressivos, preservando rotina e performance.',
    'peso',
    'ativa',
    '74',
    '78',
    'kg',
    '2026-06-30'
  )
  RETURNING id INTO weight_goal_id;

  INSERT INTO public.goal_daily_checks (goal_id, patient_id, check_date)
  VALUES
    (hydration_goal_id, patient_id, '2026-04-11'),
    (hydration_goal_id, patient_id, '2026-04-12'),
    (vegetables_goal_id, patient_id, '2026-04-13'),
    (protein_goal_id, patient_id, '2026-04-12'),
    (weight_goal_id, patient_id, '2026-04-13');
END
$$;