/**
 * Elige de dónde vienen los datos.
 *
 * Si .env tiene las credenciales de Supabase, la aplicación habla con Supabase:
 * datos compartidos entre el equipo, login institucional real y permisos
 * comprobados en el servidor.
 *
 * Si no las tiene, usa el almacén del navegador con datos de ejemplo. Sirve para
 * ver y probar la aplicación sin depender de nada, pero no se comparte con nadie.
 *
 * Las pantallas importan desde aquí y no saben cuál de las dos está activa. Esa
 * es la razón de que exista este archivo.
 */
import { supabaseConfigurado } from './supabase/client';
import * as authLocal from './authService';
import * as tasksLocal from './tasksService';
import * as authSupabase from './supabase/authService';
import * as tasksSupabase from './supabase/tasksService';

export const usandoSupabase = supabaseConfigurado();

export const authService = usandoSupabase ? authSupabase : authLocal;
export const tasksService = usandoSupabase ? tasksSupabase : tasksLocal;

/** Etiqueta para avisar en pantalla de dónde salen los datos. */
export const origenDeDatos = usandoSupabase ? 'supabase' : 'local';
