CREATE DATABASE IF NOT EXISTS  garage_db;

USE garage_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lastname VARCHAR(255) NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'client') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



INSERT INTO users (lastname, firstname, email, password, role) VALUES ('VroumVroum', 'Garagiste', 'garagiste@vroumvroum.fr', '$2a$08$K1WDAEAfMUsXmYGQJffEXuA47ZBqAQdxglvZW2MPFvpY/zbAvwqZO', 'admin');
INSERT INTO users (lastname, firstname, email, password, role) VALUES ('Elric', 'Edward', 'edward.elric@alchem.fma', '$2a$08$K1WDAEAfMUsXmYGQJffEXuA47ZBqAQdxglvZW2MPFvpY/zbAvwqZO', 'client');

-- Table des véhicules
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    client_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Données de test pour les véhicules
INSERT INTO vehicles (license_plate, brand, model, year, client_id) VALUES ('AB-123-CD', 'Renault', 'Clio', 2020, 2);
INSERT INTO vehicles (license_plate, brand, model, year, client_id) VALUES ('EF-456-GH', 'Peugeot', '208', 2019, 2);
INSERT INTO vehicles (license_plate, brand, model, year, client_id) VALUES ('IJ-789-KL', 'Citroën', 'C3', 2021, NULL);
INSERT INTO vehicles (license_plate, brand, model, year, client_id) VALUES ('MN-012-OP', 'Volkswagen', 'Golf', 2018, NULL);
INSERT INTO vehicles (license_plate, brand, model, year, client_id) VALUES ('QR-345-ST', 'Toyota', 'Yaris', 2022, 2);