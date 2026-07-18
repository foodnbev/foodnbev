ALTER TABLE public.projects DISABLE TRIGGER USER;

UPDATE public.projects SET cover_image_url = 'https://i2-prod.derbytelegraph.co.uk/article7555950.ece/ALTERNATES/s1200d/0_GB_TEM_070922_moy.jpg' WHERE id = '7370b9c6-a186-4623-b280-24766f58cfa4';

UPDATE public.projects SET cover_image_url = 'https://www.falkirkherald.co.uk/webimg/b25lY21zOjc5ODMxMjcwLTM5MmEtNGZiNy1hYjdkLTg0MTNjYTAzNTRmNDpmNWRmODllYS1kMmQzLTQ0YWEtOTliNi03YzZiZmZhMGM1MmE=.jpg?width=1200&auto=webp&quality=75&crop=3:2,smart' WHERE id = '351e10a1-c5d2-41d8-8a30-dedf157c4852';

UPDATE public.projects SET cover_image_url = 'https://s3-eu-west-1.amazonaws.com/ifj/WEBFILES/000/823/274/2203975-823274.jpg' WHERE id = '1928ed33-ece0-4616-a48c-79df5e39a6dd';

UPDATE public.projects SET cover_image_url = 'https://businessplus.ie/wp-content/uploads/2025/01/Solar-Panels-Tom-Hyland.jpg' WHERE id = '39651e4d-45e6-41fe-930c-fd74b565540b';

ALTER TABLE public.projects ENABLE TRIGGER USER;