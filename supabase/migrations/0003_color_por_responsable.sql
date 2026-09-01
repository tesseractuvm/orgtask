-- ============================================================================
-- OrgTask · Color por responsable
--
-- Como ejecutarlo: panel de Supabase, SQL Editor, pegar todo y correr.
-- Requiere haber corrido antes 0001_esquema_inicial.sql y 0002_politicas_seguridad.sql.
-- Es seguro correrlo dos veces.
--
-- Por que existe esta migracion
--
-- El brief lo repite en tres secciones distintas: "El color identifica al
-- responsable de la tarea, no al area". El esquema inicial guardaba el color en
-- la tabla areas, que respondia a la pregunta equivocada: dos tareas de la
-- misma area de personas distintas salian del mismo color.
--
-- El color pasa entonces al perfil. La columna color_token guarda el nombre del
-- color y no su hex, por la misma razon que en areas: cambiar la paleta no debe
-- obligar a tocar la base de datos.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. La columna
-- ----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists color_token text not null default 'gris';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_color_valido'
  ) then
    alter table public.profiles
      add constraint profiles_color_valido check (
        color_token in (
          'amarillo', 'rosado', 'azul', 'verde', 'lila',
          'magenta', 'cafe', 'gris', 'calipso', 'naranjo'
        )
      );
  end if;
end
$$;

comment on column public.profiles.color_token is
  'Color con el que se identifica a la persona en el tablero. El brief asigna '
  'uno por integrante del piloto. Se guarda el nombre, no el hex.';


-- ----------------------------------------------------------------------------
-- 2. El color no se cambia solo
--
-- Igual que el rol y el area, el color es un identificador que asigna quien
-- administra usuarios: si cada persona pudiera elegir el suyo, dos podrian
-- terminar del mismo color y el tablero dejaria de distinguirlas.
--
-- Se reescribe el disparador de 0002 agregando color_token a la lista.
-- ----------------------------------------------------------------------------

create or replace function public.profiles_proteger_campos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- La Edge Function de administracion usa la clave privilegiada y no pasa por aqui
  if auth.uid() is null then
    return new;
  end if;

  if new.role        is distinct from old.role
     or new.area_id     is distinct from old.area_id
     or new.is_admin    is distinct from old.is_admin
     or new.is_active   is distinct from old.is_active
     or new.email       is distinct from old.email
     or new.color_token is distinct from old.color_token
  then
    raise exception
      'El rol, el area, el color, el correo y el estado de la cuenta los cambia quien administra usuarios.';
  end if;

  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- 3. Colores del equipo del piloto
--
-- Los asigna el brief, seccion 3. Se aplican por correo para que la migracion
-- funcione tanto si las cuentas ya existen como si se crean despues con el seed.
-- ----------------------------------------------------------------------------

update public.profiles set color_token = v.color
  from (values
    ('daniel.tello@uvm.cl',            'naranjo'),
    ('francisca.tapia@uvm.cl',         'amarillo'),
    ('catalina.tamayo@uvm.cl',         'rosado'),
    ('javier.moya@uvm.cl',             'azul'),
    ('juan.caneo@uvm.cl',              'verde'),
    ('makarena.ibaceta@uvm.cl',        'lila'),
    ('teresa.urzua@uvm.cl',            'magenta'),
    ('jean.munoz@uvm.cl',              'cafe'),
    ('gabriel.marschhausen@uvm.cl',    'gris'),
    ('javiera.alvarez@uvm.cl',         'calipso')
  ) as v(email, color)
 where lower(public.profiles.email) = v.email;
