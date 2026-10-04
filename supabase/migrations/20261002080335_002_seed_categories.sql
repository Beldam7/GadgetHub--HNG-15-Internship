/*
# Seed GadgetHub Sample Data

Inserts categories and 24 realistic gadget products into the database.
Products include smartphones, laptops, tablets, smartwatches, earbuds,
headphones, speakers, gaming accessories, chargers, power banks, and smart home devices.

All products use real Pexels stock photography URLs.
Prices are in USD. Specifications are stored as JSONB.
*/

-- ============ CATEGORIES ============
INSERT INTO categories (name, slug, description, image_url)
VALUES
  ('Smartphones', 'smartphones', 'Latest smartphones with cutting-edge technology', 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Laptops', 'laptops', 'Portable and powerful laptops for every need', 'https://images.pexels.com/photos/8533587/pexels-photo-8533587.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Tablets', 'tablets', 'Versatile tablets for work and entertainment', 'https://images.pexels.com/photos/25809238/pexels-photo-25809238.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Smartwatches', 'smartwatches', 'Wearable tech for fitness and productivity', 'https://images.pexels.com/photos/267391/pexels-photo-267391.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Wireless Earbuds', 'wireless-earbuds', 'True wireless audio freedom', 'https://images.pexels.com/photos/33797659/pexels-photo-33797659.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Headphones', 'headphones', 'Premium over-ear and on-ear headphones', 'https://images.pexels.com/photos/210927/pexels-photo-210927.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Bluetooth Speakers', 'bluetooth-speakers', 'Portable speakers with powerful sound', 'https://images.pexels.com/photos/374110/pexels-photo-374110.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Gaming Accessories', 'gaming-accessories', 'Gaming gear for competitive edge', 'https://images.pexels.com/photos/7047612/pexels-photo-7047612.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Chargers & Power Banks', 'chargers-power-banks', 'Keep your devices powered anywhere', 'https://images.pexels.com/photos/4072683/pexels-photo-4072683.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Smart Home', 'smart-home', 'Connected devices for a smarter home', 'https://images.pexels.com/photos/22307556/pexels-photo-22307556.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Computer Accessories', 'computer-accessories', 'Enhance your workstation', 'https://images.pexels.com/photos/9020272/pexels-photo-9020272.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('Drones & Cameras', 'drones-cameras', 'Capture the world from new perspectives', 'https://images.pexels.com/photos/1336211/pexels-photo-1336211.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
ON CONFLICT (slug) DO NOTHING;
