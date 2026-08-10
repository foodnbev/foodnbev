
ALTER TABLE public.projects DISABLE TRIGGER projects_restrict_updates;
UPDATE public.projects p SET cover_image_url = v.url
FROM (VALUES
  ('Müller UK & Ireland – Fruit Processing Redevelopment', 'https://www.foodmanufacture.co.uk/resizer/v2/QGBJFSZKFVBEDDAPDVINFA662U.png?auth=240694295513853fba49366f1172eafb8592d210aab0875c365de4deb04f8491&width=1200&height=630&smart=true'),
  ('Kellanova – £75m Wrexham Upgrade', 'https://ichef.bbci.co.uk/ace/branded_news/1200/cpsprodpb/3535/live/142c3620-8160-11ef-a217-b780a227dde7.jpg'),
  ('Geary''s Bakery (Jason''s Sourdough) – £36m Expansion', 'https://winvic.co.uk/wp-content/uploads/2019/01/C1259-Gearys-Bakery-Completion-Resize-1.jpg'),
  ('Meatly – Cultivated Meat Facility', 'https://plantbasednews.org/app/uploads/2026/06/meatly-cultivated-meat-factory-london-2.jpg'),
  ('Diageo – Fife Tank Farm Expansion', 'https://www.actemium.co.uk/app/uploads/sites/298/2026/02/Diageo-Fife-Spirits-Tank-Farm.png')
) AS v(name, url)
WHERE p.name = v.name;
ALTER TABLE public.projects ENABLE TRIGGER projects_restrict_updates;
