export interface Equipo {
  id: number;
  idc: string;
  nombre: string;
  grupo: string;
  bandera_url: string;
}

export interface Partido {
  id: string;
  fase: string;
  equipo_a: string;
  equipo_b: string;
  goles_a: number | null;
  goles_b: number | null;
  fecha_limite: string;
  // Relaciones cargadas desde Supabase (joins)
  equipos_a: Equipo;
  equipos_b: Equipo;
}

export interface Prode {
  partido_id: string;
  goles_a: number | string;
  goles_b: number | string;
}