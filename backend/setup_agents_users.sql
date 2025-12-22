-- =====================================================
-- SETUP AGENTES E USERS - CRMPLUSV7
-- Password pattern: {iniciais}crmtest (lowercase)
-- =====================================================

BEGIN;

-- 1. ATUALIZAR DADOS DOS AGENTES
-- --------------------------------
UPDATE agents SET 
    name = 'António Silva',
    email = 'asilva@imoveismais.pt'
WHERE id = 24;
UPDATE agents SET 
    name = 'Hugo Belo',
    email = 'hbelo@imoveismais.pt'
WHERE id = 25;
UPDATE agents SET 
    name = 'Bruno Libânio',
    email = 'blibanio@imoveismais.pt'
WHERE id = 26;
UPDATE agents SET 
    name = 'Nélson Neto',
    email = 'nneto@imoveismais.pt'
WHERE id = 27;
UPDATE agents SET 
    name = 'João Paiva',
    email = 'jpaiva@imoveismais.pt'
WHERE id = 28;
UPDATE agents SET 
    name = 'Marisa Barosa',
    email = 'arrendamentosleiria@imoveismais.pt'
WHERE id = 29;
UPDATE agents SET 
    name = 'Eduardo Coelho',
    email = 'ecoelho@imoveismais.pt'
WHERE id = 30;
UPDATE agents SET 
    name = 'João Silva',
    email = 'jsilva@imoveismais.pt'
WHERE id = 31;
UPDATE agents SET 
    name = 'Hugo Mota',
    email = 'hmota@imoveismais.pt'
WHERE id = 32;
UPDATE agents SET 
    name = 'João Pereira',
    email = 'jpereira@imoveismais.pt'
WHERE id = 33;
UPDATE agents SET 
    name = 'João Carvalho',
    email = 'jcarvalho@imoveismais.pt'
WHERE id = 34;
UPDATE agents SET 
    name = 'Tiago Vindima',
    email = 'tvindima@imoveismais.pt'
WHERE id = 35;
UPDATE agents SET 
    name = 'Mickael Soares',
    email = 'msoares@imoveismais.pt'
WHERE id = 36;
UPDATE agents SET 
    name = 'Paulo Rodrigues',
    email = 'prodrigues@imoveismais.pt'
WHERE id = 37;
UPDATE agents SET 
    name = 'Imóveis Mais Leiria',
    email = 'leiria@imoveismais.pt'
WHERE id = 38;
UPDATE agents SET 
    name = 'Nuno Faria',
    email = 'nfaria@imoveismais.pt'
WHERE id = 39;
UPDATE agents SET 
    name = 'Pedro Olaio',
    email = 'polaio@imoveismais.pt'
WHERE id = 40;
UPDATE agents SET 
    name = 'João Olaio',
    email = 'jolaio@imoveismais.pt'
WHERE id = 41;
UPDATE agents SET 
    name = 'Fábio Passos',
    email = 'fpassos@imoveismais.pt'
WHERE id = 42;

-- 2. CRIAR/ATUALIZAR USERS PARA CADA AGENTE
-- ------------------------------------------
-- Password: {iniciais em minúsculas}crmtest

-- António Silva (asilva@imoveismais.pt) - pass: ascrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('asilva@imoveismais.pt', '$2b$12$3GQXChYlP0r1zdqaJuWAvuKcBOJnMArWhXKRYAenJqOBZLcmDYwLW', 'agent', 24, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Hugo Belo (hbelo@imoveismais.pt) - pass: hbcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('hbelo@imoveismais.pt', '$2b$12$WpU9rtVGKDXqfH7zfItanegwLe8suvi5je5hVVsj2wFWMuZzIF/sC', 'agent', 25, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Bruno Libânio (blibanio@imoveismais.pt) - pass: blcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('blibanio@imoveismais.pt', '$2b$12$cOnIeFJbzL3AZvms8qTvkOqII6nnvdBFnsZOqlyIp42CShxkgmmm6', 'agent', 26, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Nélson Neto (nneto@imoveismais.pt) - pass: nncrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('nneto@imoveismais.pt', '$2b$12$fcSw5vz2jK9UFwKyYXtYnu1hXZqfz.E3x7qy.EPX7K1dl4IyWCEbG', 'agent', 27, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- João Paiva (jpaiva@imoveismais.pt) - pass: jpcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('jpaiva@imoveismais.pt', '$2b$12$DpcDcNtI2c9epZZaQD0VuOMhbRaGARE58HEB6Ir704Wq6WsyPBQ4G', 'agent', 28, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Marisa Barosa (arrendamentosleiria@imoveismais.pt) - pass: mbcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('arrendamentosleiria@imoveismais.pt', '$2b$12$dCPzks6i1QDWF7Wba6YJmu3Ev7uBFecU5cKu7htTASvZ.UifTWSke', 'agent', 29, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Eduardo Coelho (ecoelho@imoveismais.pt) - pass: eccrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('ecoelho@imoveismais.pt', '$2b$12$ToA0aJbx7IHOLiBFSFmn5e7e26R0IZexR6NRAIaFyru3ctGE.znc6', 'agent', 30, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- João Silva (jsilva@imoveismais.pt) - pass: jscrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('jsilva@imoveismais.pt', '$2b$12$AAjOIeBLQzbUH52ADczsZuxeizqQN/nF5QZIte5IS7.QFcCz8r87K', 'agent', 31, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Hugo Mota (hmota@imoveismais.pt) - pass: hmcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('hmota@imoveismais.pt', '$2b$12$X./SSd9S7TZEJ8Zvk4BSveySJ27PEFG.ivymINI4B5q9KNrPDEdCC', 'agent', 32, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- João Pereira (jpereira@imoveismais.pt) - pass: jpecrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('jpereira@imoveismais.pt', '$2b$12$illSRvtG3es8r/M.tpE21u/g8gtyu5jjiTmfpNL0TY0DH..ltrvgy', 'agent', 33, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- João Carvalho (jcarvalho@imoveismais.pt) - pass: jccrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('jcarvalho@imoveismais.pt', '$2b$12$gUnZV2PiEBCQh7Y/gp5UcO1ZhuTEEMEcjEIn/OSNNi9VhyNUL1opm', 'agent', 34, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Tiago Vindima (tvindima@imoveismais.pt) - pass: tvcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('tvindima@imoveismais.pt', '$2b$12$ViTWGA9RX5OHFNGdKnYJeupGwbhw7zqB4.s/P7DsTPmbpmUZivtVK', 'agent', 35, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Mickael Soares (msoares@imoveismais.pt) - pass: mscrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('msoares@imoveismais.pt', '$2b$12$MhY3TigfirVRyDZUz6UTVu3A.R48MzAA6DUN4xZnwG8OATbXp7jIm', 'agent', 36, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Paulo Rodrigues (prodrigues@imoveismais.pt) - pass: prcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('prodrigues@imoveismais.pt', '$2b$12$h/1mc5m0mG6e82iia2lQguGkX7zk/J8xqWdO.Wik.qsKZhneDWvpi', 'agent', 37, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Imóveis Mais Leiria (leiria@imoveismais.pt) - pass: ilcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('leiria@imoveismais.pt', '$2b$12$XPwNY/nabsB0JLBC/4KdjuwAGh72ZYyMGOYEotnk8QmLVHSBl6bfq', 'agent', 38, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Nuno Faria (nfaria@imoveismais.pt) - pass: nfcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('nfaria@imoveismais.pt', '$2b$12$bRuHnUcbNeUj0jGBH3wUk.jVmLHk/JGTncZSEwQ.I2fKTLUDuiJ2K', 'agent', 39, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Pedro Olaio (polaio@imoveismais.pt) - pass: pocrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('polaio@imoveismais.pt', '$2b$12$7kwSVy5LZ/8B/e2rSdKfOOTn6XuByMifajxNGB..jvjRiSXmeyfhq', 'agent', 40, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- João Olaio (jolaio@imoveismais.pt) - pass: jocrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('jolaio@imoveismais.pt', '$2b$12$V9/wmxf8bLqiVwA/05pM2OQ6GLq5J6i.urjfhL5J.aUrO9KJuVu/C', 'agent', 41, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

-- Fábio Passos (fpassos@imoveismais.pt) - pass: fpcrmtest
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('fpassos@imoveismais.pt', '$2b$12$uDeLDp664SrFqE0MvPLSE.Y104gV9D2qxVQGARP68Z0qShngOcX7q', 'agent', 42, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;

COMMIT;

-- =====================================================
-- RESUMO DE LOGINS CRIADOS:
-- =====================================================
-- António Silva             | asilva@imoveismais.pt               | ascrmtest
-- Hugo Belo                 | hbelo@imoveismais.pt                | hbcrmtest
-- Bruno Libânio             | blibanio@imoveismais.pt             | blcrmtest
-- Nélson Neto               | nneto@imoveismais.pt                | nncrmtest
-- João Paiva                | jpaiva@imoveismais.pt               | jpcrmtest
-- Marisa Barosa             | arrendamentosleiria@imoveismais.pt  | mbcrmtest
-- Eduardo Coelho            | ecoelho@imoveismais.pt              | eccrmtest
-- João Silva                | jsilva@imoveismais.pt               | jscrmtest
-- Hugo Mota                 | hmota@imoveismais.pt                | hmcrmtest
-- João Pereira              | jpereira@imoveismais.pt             | jpecrmtest
-- João Carvalho             | jcarvalho@imoveismais.pt            | jccrmtest
-- Tiago Vindima             | tvindima@imoveismais.pt             | tvcrmtest
-- Mickael Soares            | msoares@imoveismais.pt              | mscrmtest
-- Paulo Rodrigues           | prodrigues@imoveismais.pt           | prcrmtest
-- Imóveis Mais Leiria       | leiria@imoveismais.pt               | ilcrmtest
-- Nuno Faria                | nfaria@imoveismais.pt               | nfcrmtest
-- Pedro Olaio               | polaio@imoveismais.pt               | pocrmtest
-- João Olaio                | jolaio@imoveismais.pt               | jocrmtest
-- Fábio Passos              | fpassos@imoveismais.pt              | fpcrmtest