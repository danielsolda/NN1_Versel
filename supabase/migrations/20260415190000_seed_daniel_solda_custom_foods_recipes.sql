DO $$
DECLARE
  nutritionist_uuid uuid := '0de45791-e60f-492f-bc0c-e803865bd5c5';
  recipe_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Pão integral 100%'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Pão integral 100%', 'Cereais', 247, 13.0, 41.0, 4.2, 7.0, 430, nutritionist_uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Ovos mexidos cremosos'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Ovos mexidos cremosos', 'Proteínas', 154, 12.5, 1.2, 10.8, 0, 170, nutritionist_uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Frango grelhado temperado'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Frango grelhado temperado', 'Proteínas', 165, 31.0, 0, 3.6, 0, 74, nutritionist_uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Arroz integral cozido'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Arroz integral cozido', 'Carboidratos', 124, 2.6, 25.8, 1.0, 2.8, 5, nutritionist_uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Legumes no vapor coloridos'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Legumes no vapor coloridos', 'Vegetais', 35, 2.5, 6.5, 0.3, 3.0, 30, nutritionist_uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Iogurte natural'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Iogurte natural', 'Laticínios', 61, 3.5, 4.7, 3.3, 0, 46, nutritionist_uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Aveia em flocos'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Aveia em flocos', 'Cereais', 389, 16.9, 66.3, 6.9, 10.6, 2, nutritionist_uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Chia'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Chia', 'Sementes', 486, 16.5, 42.1, 30.7, 34.4, 16, nutritionist_uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Batata-doce assada'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Batata-doce assada', 'Tubérculos', 90, 2.0, 20.7, 0.1, 3.3, 36, nutritionist_uuid);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.taco_foods tf
    WHERE tf.nutritionist_id = nutritionist_uuid
      AND tf.description = 'Pasta de atum leve'
  ) THEN
    INSERT INTO public.taco_foods (description, category, calories, protein, carbs, fat, fiber, sodium, nutritionist_id)
    VALUES ('Pasta de atum leve', 'Proteínas', 116, 20.0, 1.0, 4.0, 0, 350, nutritionist_uuid);
  END IF;

  SELECT r.id INTO recipe_id
  FROM public.recipes r
  WHERE r.nutritionist_id = nutritionist_uuid
    AND r.title = 'Café proteico de foco';

  IF recipe_id IS NULL THEN
    INSERT INTO public.recipes (
      nutritionist_id,
      title,
      description,
      prep_time,
      servings,
      image_url,
      notes
    )
    VALUES (
      nutritionist_uuid,
      'Café proteico de foco',
      'Café da manhã equilibrado para dar energia estável no início do dia.',
      '10 min',
      '1 porção',
      '/meal-cafe-manha.jpg',
      'Misture os ovos, monte o pão com a banana e finalize com café sem açúcar.'
    )
    RETURNING id INTO recipe_id;

    INSERT INTO public.recipe_ingredients (
      recipe_id,
      food_name,
      quantity,
      unit,
      sort_order,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium
    )
    VALUES
      (recipe_id, 'Pão integral 100%', '2', 'fatias', 0, 140, 6.0, 24.0, 2.2, 4.0, 260),
      (recipe_id, 'Ovos mexidos cremosos', '2', 'unidades', 1, 144, 12.6, 1.0, 9.6, 0, 140),
      (recipe_id, 'Banana', '1', 'unidade', 2, 89, 1.1, 23.0, 0.3, 2.6, 1),
      (recipe_id, 'Café sem açúcar', '1', 'xícara', 3, 2, 0.0, 0.0, 0.0, 0.0, 0);
  END IF;

  SELECT r.id INTO recipe_id
  FROM public.recipes r
  WHERE r.nutritionist_id = nutritionist_uuid
    AND r.title = 'Almoço de treino equilibrado';

  IF recipe_id IS NULL THEN
    INSERT INTO public.recipes (
      nutritionist_id,
      title,
      description,
      prep_time,
      servings,
      image_url,
      notes
    )
    VALUES (
      nutritionist_uuid,
      'Almoço de treino equilibrado',
      'Almoço principal com proteína magra, carboidrato suficiente e boa oferta de fibras.',
      '20 min',
      '1 porção',
      '/meal-almoco.jpg',
      'Monte o prato com arroz, feijão, frango e salada. Finalize com azeite de oliva.'
    )
    RETURNING id INTO recipe_id;

    INSERT INTO public.recipe_ingredients (
      recipe_id,
      food_name,
      quantity,
      unit,
      sort_order,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium
    )
    VALUES
      (recipe_id, 'Arroz integral cozido', '4', 'colheres de sopa', 0, 120, 2.5, 25.0, 1.0, 2.5, 5),
      (recipe_id, 'Feijão', '1', 'concha', 1, 76, 4.8, 13.6, 0.5, 8.0, 2),
      (recipe_id, 'Frango grelhado temperado', '120', 'g', 2, 198, 37.0, 0.0, 4.3, 0.0, 90),
      (recipe_id, 'Salada de folhas', '1', 'prato', 3, 20, 1.0, 3.0, 0.2, 1.5, 10),
      (recipe_id, 'Azeite de oliva', '1', 'colher de chá', 4, 45, 0.0, 0.0, 5.0, 0.0, 0);
  END IF;

  SELECT r.id INTO recipe_id
  FROM public.recipes r
  WHERE r.nutritionist_id = nutritionist_uuid
    AND r.title = 'Jantar leve de recuperação';

  IF recipe_id IS NULL THEN
    INSERT INTO public.recipes (
      nutritionist_id,
      title,
      description,
      prep_time,
      servings,
      image_url,
      notes
    )
    VALUES (
      nutritionist_uuid,
      'Jantar leve de recuperação',
      'Jantar leve para recuperação e boa digestão antes do sono.',
      '25 min',
      '1 porção',
      '/meal-jantar.jpg',
      'Sirva o peixe com batata-doce e legumes no vapor. A abobrinha pode ser salteada rapidamente.'
    )
    RETURNING id INTO recipe_id;

    INSERT INTO public.recipe_ingredients (
      recipe_id,
      food_name,
      quantity,
      unit,
      sort_order,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium
    )
    VALUES
      (recipe_id, 'Peixe assado', '150', 'g', 0, 240, 32.0, 0.0, 11.0, 0.0, 110),
      (recipe_id, 'Batata-doce assada', '1', 'unidade média', 1, 112, 2.0, 26.0, 0.1, 3.8, 40),
      (recipe_id, 'Legumes no vapor coloridos', '1', 'porção', 2, 35, 2.5, 6.5, 0.3, 3.0, 30),
      (recipe_id, 'Abobrinha refogada', '1', 'porção', 3, 24, 1.1, 3.5, 0.5, 1.2, 25);
  END IF;

  SELECT r.id INTO recipe_id
  FROM public.recipes r
  WHERE r.nutritionist_id = nutritionist_uuid
    AND r.title = 'Lanche da manhã com iogurte e chia';

  IF recipe_id IS NULL THEN
    INSERT INTO public.recipes (
      nutritionist_id,
      title,
      description,
      prep_time,
      servings,
      image_url,
      notes
    )
    VALUES (
      nutritionist_uuid,
      'Lanche da manhã com iogurte e chia',
      'Lanche saciante com fibras e proteína para segurar a fome até o almoço.',
      '8 min',
      '1 porção',
      '/meal-lanche-manha.jpg',
      'Misture o iogurte com aveia e chia e finalize com banana e castanhas.'
    )
    RETURNING id INTO recipe_id;

    INSERT INTO public.recipe_ingredients (
      recipe_id,
      food_name,
      quantity,
      unit,
      sort_order,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium
    )
    VALUES
      (recipe_id, 'Iogurte natural', '1', 'pote', 0, 61, 3.5, 4.7, 3.3, 0.0, 46),
      (recipe_id, 'Aveia em flocos', '2', 'colheres de sopa', 1, 78, 3.4, 13.3, 1.4, 2.1, 0),
      (recipe_id, 'Chia', '1', 'colher de sopa', 2, 58, 2.0, 5.0, 3.7, 5.6, 3),
      (recipe_id, 'Banana', '1', 'unidade pequena', 3, 67, 0.8, 17.0, 0.2, 1.8, 1),
      (recipe_id, 'Castanhas', '1', 'punhado', 4, 90, 2.0, 3.0, 8.0, 1.0, 0);
  END IF;

  SELECT r.id INTO recipe_id
  FROM public.recipes r
  WHERE r.nutritionist_id = nutritionist_uuid
    AND r.title = 'Lanche da tarde com atum e folhas';

  IF recipe_id IS NULL THEN
    INSERT INTO public.recipes (
      nutritionist_id,
      title,
      description,
      prep_time,
      servings,
      image_url,
      notes
    )
    VALUES (
      nutritionist_uuid,
      'Lanche da tarde com atum e folhas',
      'Lanche prático para manter saciedade até o jantar.',
      '12 min',
      '1 porção',
      '/meal-lanche-tarde.jpg',
      'Recheie o pão com a pasta de atum, acrescente folhas e tomate e sirva imediatamente.'
    )
    RETURNING id INTO recipe_id;

    INSERT INTO public.recipe_ingredients (
      recipe_id,
      food_name,
      quantity,
      unit,
      sort_order,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sodium
    )
    VALUES
      (recipe_id, 'Pão integral 100%', '2', 'fatias', 0, 140, 6.0, 24.0, 2.2, 4.0, 260),
      (recipe_id, 'Pasta de atum leve', '3', 'colheres de sopa', 1, 120, 18.0, 1.0, 5.0, 0.0, 330),
      (recipe_id, 'Folhas verdes', '1', 'punhado', 2, 8, 0.5, 1.0, 0.1, 0.7, 5),
      (recipe_id, 'Tomate', '2', 'fatias', 3, 8, 0.4, 1.7, 0.1, 0.5, 2),
      (recipe_id, 'Cottage', '1', 'colher de sopa', 4, 24, 2.8, 0.8, 0.8, 0.0, 55);
  END IF;
END $$;