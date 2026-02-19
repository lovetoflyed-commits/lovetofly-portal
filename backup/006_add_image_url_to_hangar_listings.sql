-- Migration: Adiciona coluna image_url para armazenar o caminho da imagem do hangar
ALTER TABLE hangar_listings ADD COLUMN image_url VARCHAR(255);
