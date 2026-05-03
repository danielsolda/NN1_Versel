# NotionDiet — Nutrição Inteligente

Plataforma de gestão nutricional para nutricionistas e pacientes.

## Tecnologias

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## Desenvolvimento

```sh
npm install
npm run dev
```

## Supabase

O schema em `supabase/migrations` está preparado para o projeto novo com a tabela TACO vazia por padrão.

Para trocar de projeto:

1. Rode `supabase link --project-ref <novo-project-ref>`.
2. Atualize o arquivo `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do novo projeto.
3. Aplique as migrations com `supabase db push`.

A tabela `taco_foods` continua existindo para receber dados via API/sync, sem seed estático no banco.
