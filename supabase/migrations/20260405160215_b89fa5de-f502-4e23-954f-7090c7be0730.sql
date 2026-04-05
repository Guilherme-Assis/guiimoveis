
ALTER TABLE public.profiles ADD COLUMN cpf text UNIQUE;

CREATE UNIQUE INDEX idx_profiles_cpf ON public.profiles (cpf) WHERE cpf IS NOT NULL;
