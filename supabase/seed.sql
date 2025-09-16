-- Insert sample exercises
INSERT INTO public.exercises (name, description, instructions, difficulty_level, duration_minutes, repetitions, sets, category, equipment_needed) VALUES
('Shoulder Flexion', 'Basic shoulder mobility exercise', 'Slowly raise your arm forward to shoulder height, hold for 2 seconds, then lower slowly', 2, 10, 10, 3, 'shoulder', '{}'),
('Knee Extension', 'Strengthen quadriceps muscles', 'Sit in chair, slowly straighten knee, hold for 3 seconds, lower slowly', 3, 15, 12, 3, 'knee', '{"chair"}'),
('Ankle Circles', 'Improve ankle mobility', 'Sit comfortably, lift foot off ground, slowly rotate ankle in circles', 1, 5, 10, 2, 'ankle', '{}'),
('Wall Push-ups', 'Upper body strengthening', 'Stand arms length from wall, place palms against wall, push away and return', 2, 10, 8, 2, 'upper_body', '{}'),
('Heel Raises', 'Calf strengthening exercise', 'Stand with feet hip-width apart, slowly rise onto toes, hold 2 seconds, lower', 2, 8, 15, 3, 'lower_leg', '{}'),
('Neck Stretches', 'Improve neck mobility', 'Gently tilt head to each side, hold for 15 seconds', 1, 5, 4, 1, 'neck', '{}'),
('Hip Bridges', 'Strengthen glutes and core', 'Lie on back, knees bent, lift hips up, hold 3 seconds, lower', 3, 12, 12, 3, 'core', '{}'),
('Seated Spinal Twist', 'Improve spinal mobility', 'Sit tall, slowly rotate torso to one side, hold 10 seconds, return to center', 2, 8, 6, 2, 'spine', '{"chair"}');

-- Insert sample knowledge base articles
INSERT INTO public.knowledge_base (title, content, category, tags, status) VALUES
('Understanding Lower Back Pain', 'Lower back pain is one of the most common reasons people visit healthcare providers. It can range from a dull, constant ache to sudden, sharp pain...', 'conditions', '{"back pain", "lower back", "treatment"}', 'published'),
('Post-Surgery Recovery Guidelines', 'Recovery after surgery requires careful attention to healing processes. Here are general guidelines for optimal recovery...', 'recovery', '{"surgery", "recovery", "rehabilitation"}', 'published'),
('Benefits of Regular Exercise', 'Regular physical activity provides numerous health benefits including improved cardiovascular health, stronger muscles and bones...', 'wellness', '{"exercise", "health", "wellness"}', 'published'),
('Proper Posture Tips', 'Good posture is essential for preventing pain and injury. Here are key points for maintaining proper posture throughout the day...', 'prevention', '{"posture", "ergonomics", "prevention"}', 'published'),
('Managing Chronic Pain', 'Chronic pain affects millions of people worldwide. Effective management requires a comprehensive approach...', 'pain_management', '{"chronic pain", "management", "treatment"}', 'published');

-- Insert sample inventory items
INSERT INTO public.inventory (name, description, category, brand, condition, location, status) VALUES
('Ultrasound Machine', 'Therapeutic ultrasound device for deep tissue treatment', 'equipment', 'PhysioTech', 'excellent', 'Treatment Room 1', 'available'),
('Exercise Balls', 'Set of 5 stability balls for core strengthening', 'exercise', 'FitPro', 'good', 'Exercise Room', 'available'),
('Resistance Bands', 'Various resistance levels for strength training', 'exercise', 'TheraBand', 'good', 'Equipment Storage', 'available'),
('Hot/Cold Packs', 'Reusable therapeutic packs for pain management', 'therapy', 'MediTemp', 'excellent', 'Treatment Room 2', 'available'),
('Goniometer', 'Device for measuring joint range of motion', 'assessment', 'MedTools', 'good', 'Assessment Room', 'available'),
('TENS Unit', 'Transcutaneous electrical nerve stimulation device', 'equipment', 'PainRelief Pro', 'excellent', 'Treatment Room 1', 'available'),
('Parallel Bars', 'Adjustable parallel bars for gait training', 'equipment', 'RehabTech', 'good', 'Rehabilitation Gym', 'available'),
('Treatment Table', 'Electric height-adjustable treatment table', 'furniture', 'MedTable', 'excellent', 'Treatment Room 3', 'available');

-- Note: User data, patients, appointments, etc. will be created through the application
-- as they require proper authentication and user context