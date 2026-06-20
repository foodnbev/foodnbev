
ALTER TABLE public.projects DISABLE TRIGGER projects_restrict_updates;

UPDATE public.projects SET cover_image_url = v.url
FROM (VALUES
  ('93224f6a-a57d-485a-a188-29eefc36fb35'::uuid, 'https://www.foodmanufacture.co.uk/resizer/v2/L3LTWIPXWFHYJLVNQZFJQUDGZM.jpg?auth=19ef06c0ec783c14ba52d2231108a93a749971c7590b0150634fbeb0a43a3b02&width=1200&height=630&smart=true'),
  ('2088eafa-bf2d-447e-b5a0-4edc2613f24c'::uuid, 'https://ichef.bbci.co.uk/ace/branded_news/1200/cpsprodpb/c320/live/f115d570-f2bf-11ef-9a3d-a9193161aa19.jpg'),
  ('a0bf8122-c2ae-443b-aa11-2b052c23cb7f'::uuid, 'https://www.ziemann-holvrieka.com/wp-content/uploads/2023/07/Picture12.jpg'),
  ('aac7e975-ac1e-4895-a7ac-475aae745464'::uuid, 'https://www.ziemann-holvrieka.com/wp-content/uploads/2023/07/Picture12.jpg'),
  ('00131c10-8b08-40ea-a918-41dd3e2c5e8c'::uuid, 'https://ichef.bbci.co.uk/ace/branded_news/1200/cpsprodpb/c7ac/live/9b112130-a452-11f0-8a21-ff96e44d1cc2.jpg'),
  ('6dbb216a-142d-44cd-b56d-64048e1b8742'::uuid, 'https://www.celtic-renewables.com/wp-content/uploads/2026/03/IMG_3981-1-scaled.jpg'),
  ('3e2fcfac-7f81-45e5-a148-80f517c910cb'::uuid, 'https://www.foodnavigator.com/resizer/v2/LKA2PWWMGBCANKNIPAIS6Q3BU4.jpg?auth=0e376a66b7df296e54bde3d7afc6192d492262cab8dde348eab4746ad8d888df&width=1200&height=630&smart=true'),
  ('0b004f25-51e1-4e34-b4f0-104d75a1944a'::uuid, 'https://www.wmca.org.uk/media/tqwfa3c4/171025_freshways00005.jpg?anchor=center&mode=crop&width=1200&height=630&rnd=134055150488670000'),
  ('7ba479c1-2741-4c2b-b76e-eae5258c625d'::uuid, 'https://www.foodmanufacture.co.uk/resizer/v2/ZWRPVIOU5FFZDNBMUQZIKLLS24.jpg?auth=327b387f140f45e1b133d417e495c166a5c7a006383c9a364db5d95b4fdd5189&width=1200&height=630&smart=true'),
  ('80a25fdc-905f-477f-a035-d47438eaf194'::uuid, 'https://ichef.bbci.co.uk/news/1024/branded_news/642F/production/_128874652_gettyimages-1265235793.jpg'),
  ('78223562-d728-4321-9b19-589d5be9874f'::uuid, 'https://i2-prod.chroniclelive.co.uk/article23074598.ece/ALTERNATES/s1200d/0_SGP_NEC_230920GV08JPG.jpg'),
  ('db8730f3-fdd3-4d0a-bacf-12911836cddc'::uuid, 'https://ichef.bbci.co.uk/news/1024/branded_news/d270/live/d1d2e2e0-c6e3-11f0-8897-7bf2564e5296.jpg'),
  ('11e00ca7-cf93-4a98-8111-9df9ae9d800a'::uuid, 'https://mialgae.com/wp-content/uploads/2025/12/MiAlgae-45-scaled.jpg'),
  ('15d0d24d-4e91-48e4-a2ff-26a478bc13ab'::uuid, 'https://www.foodmanufacture.co.uk/resizer/v2/6F7F445LSRBVZFD3CZPUG6IEHM.JPG?auth=d8b6b58c0a6f2af97e5c51b41e8dd3da41200890ebacf0306f756a8b6b50394d&width=1200&height=630&smart=true'),
  ('27f93b11-d479-4e5f-aeea-59c947107d69'::uuid, 'https://i2-prod.manchestereveningnews.co.uk/article23466238.ece/ALTERNATES/s1200d/0_SAP_MEN_FACTORY__01JPG.jpg'),
  ('56363da5-cd93-487d-9417-386674758f57'::uuid, 'https://www.newsandstar.co.uk/resources/images/19700311.jpg?type=og-image'),
  ('423d5007-810d-4c30-8694-bfdcbd12e350'::uuid, 'https://i2-prod.liverpoolecho.co.uk/article32053029.ece/ALTERNATES/s1200d/0_JS283469605.jpg'),
  ('7ca65a21-50a8-456f-bc88-7e577e21b5b8'::uuid, 'https://ichef.bbci.co.uk/news/1024/branded_news/2cac/live/45c76b10-94af-11f0-84c8-99de564f0440.jpg'),
  ('cb1fd0f8-158c-4437-aaf8-8420d150896e'::uuid, 'https://www.puratos.co.uk/content/dam/united-kingdom/images/about-puratos/jobs/image%20%281%29.png/jcr%3Acontent/renditions/cq5dam.web.1280.1280.webp'),
  ('29f07dd4-2140-469f-87da-729ba135ce82'::uuid, 'https://suntorybeverageandfood-europe.com/media/vwblmvvh/factory.jpg')
) AS v(id, url)
WHERE public.projects.id = v.id;

ALTER TABLE public.projects ENABLE TRIGGER projects_restrict_updates;
