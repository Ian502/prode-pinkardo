export interface Equipo {
  id: string;
  nombre: string;
  grupo: string;
  bandera_url: string;
}

export interface Partido {
  id: string;
  fase: string;
  equipo_local_id: string;
  equipo_visita_id: string;
  goles_a: number | null;
  goles_b: number | null;
  fecha_limite: string;
  // Relaciones cargadas desde Supabase (joins)
  equipos_a: Equipo;
  equipos_b: Equipo;
}

export interface Prediccion {
  partido_id: string;
  prediccion_a: number | string;
  prediccion_b: number | string;
}