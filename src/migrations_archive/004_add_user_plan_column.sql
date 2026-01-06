ALTER TABLE users 
ADD COLUMN plan VARCHAR(20) DEFAULT 'standard' NOT NULL,
ADD COLUMN avatar_url VARCHAR(255),
ADD COLUMN badges TEXT[]; -- Array de textos para armazenar as badges

COMMENT ON COLUMN users.plan IS 'Nível do usuário: standard, premium, pro';

