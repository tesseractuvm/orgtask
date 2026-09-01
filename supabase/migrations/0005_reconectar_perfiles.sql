-- ============================================================================
-- OrgTask · Reconectar los perfiles con sus cuentas
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Es seguro correrlo dos veces.
--
-- ----------------------------------------------------------------------------
-- Por que existe esta migracion
--
-- Sintoma: la aplicacion dice "Conectado a Supabase", acepta la contrasena, y
-- justo despues responde "Tu cuenta existe pero no tiene perfil asignado".
--
-- Eso significa que el ingreso funciono: Supabase Auth reconocio el correo y la
-- contrasena. Lo que falta es la fila de public.profiles, que es donde viven el
-- nombre, el area, el rol y el color. Sin ella la aplicacion no sabe quien es
-- esa persona ni que puede hacer.
--
-- Como se llego a esto: profiles.id apunta a auth.users(id) con on delete
-- cascade. Al borrar y volver a crear una cuenta de autenticacion, su perfil se
-- fue con ella, y la cuenta nueva nacio con un id distinto. Queda entonces una
-- cuenta que puede entrar pero no tiene perfil.
--
-- Esta migracion recorre las diez personas del piloto y, para cada cuenta de
-- autenticacion que exista sin perfil, lo crea con los datos del brief. A las
-- que ya tienen perfil les corrige nombre, area, rol y color por si quedaron
-- desalineados. No borra ni recrea cuentas.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Quitar perfiles huerfanos
--
-- Un perfil cuyo correo es el de alguien del equipo pero cuyo id ya no
-- corresponde a ninguna cuenta de autenticacion no le sirve a nadie: nadie
-- puede iniciar sesion con el, y ocupa el correo, que es unico. Estorba para
-- crear el perfil bueno, asi que se quita.
-- ----------------------------------------------------------------------------

delete from public.profiles p
 where not exists (
   select 1 from auth.users u where u.id = p.id
 );


-- ----------------------------------------------------------------------------
-- 2. Crear o corregir el perfil de cada persona
--
-- La lista es la del brief, seccion 3. El id sale de auth.users, que es la
-- unica fuente valida: profiles.id tiene que ser exactamente el mismo.
-- ----------------------------------------------------------------------------

insert into public.profiles (
  id, full_name, email, area_id, role, color_token, is_admin, is_active
)
select
  u.id,
  v.nombre,
  lower(u.email),
  (select a.id from public.areas a where a.code = v.area),
  v.rol::public.user_role,
  v.color,
  v.admin,
  true
from (values
  ('daniel.tello@uvm.cl',         'Daniel Tello',         null,       'director',    'naranjo',  false),
  ('francisca.tapia@uvm.cl',      'Francisca Tapia',      'CPYG',     'lider',       'amarillo', false),
  ('catalina.tamayo@uvm.cl',      'Catalina Tamayo',      'CPYG',     'colaborador', 'rosado',   false),
  ('javier.moya@uvm.cl',          'Javier Moya',          'CPYG',     'colaborador', 'azul',     true),
  ('juan.caneo@uvm.cl',           'Juan Pablo Caneo',     'RYVE',     'lider',       'verde',    false),
  ('makarena.ibaceta@uvm.cl',     'Macarena Ibaceta',     'RYVE',     'colaborador', 'lila',     false),
  ('teresa.urzua@uvm.cl',         'Teresita Urzúa',       'RYVE',     'colaborador', 'magenta',  false),
  ('jean.munoz@uvm.cl',           'Juan Carlos Muñoz',    'DEPORTES', 'lider',       'cafe',     false),
  ('gabriel.marschhausen@uvm.cl', 'Gabriel Marschhausen', 'DEPORTES', 'colaborador', 'gris',     false),
  ('javiera.alvarez@uvm.cl',      'Javiera Álvarez',      'DEPORTES', 'colaborador', 'calipso',  false)
) as v(correo, nombre, area, rol, color, admin)
join auth.users u on lower(u.email) = v.correo
on conflict (id) do update set
  full_name   = excluded.full_name,
  email       = excluded.email,
  area_id     = excluded.area_id,
  role        = excluded.role,
  color_token = excluded.color_token,
  is_admin    = excluded.is_admin,
  is_active   = true,
  updated_at  = now();


-- ----------------------------------------------------------------------------
-- 3. Comprobacion
--
-- perfil_ok tiene que salir true en las diez filas. Si alguna sale en false,
-- esa cuenta de autenticacion no existe todavia y hay que crearla con
-- public.admin_crear_cuenta (migracion 0004).
-- ----------------------------------------------------------------------------

select
  u.email,
  (p.id is not null) as perfil_ok,
  p.role,
  p.color_token,
  p.is_admin,
  p.is_active,
  coalesce(a.code, 'las tres') as area
from auth.users u
left join public.profiles p on p.id = u.id
left join public.areas    a on a.id = p.area_id
order by p.is_admin desc nulls last, u.email;
