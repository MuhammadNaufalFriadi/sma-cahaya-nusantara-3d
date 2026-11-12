export interface CharacterInfo {
  name: string;
  hairColor: number;
  jacketColor: number;
  skinColor: number;
  desc: string;
  intro: string;
}

export interface BuildingData {
  id: string;
  n: string;
  i: string;
  x: number;
  z: number;
  c: number;
  r?: number;
  dx?: number;
  dz?: number;
  doorL?: any;
  doorR?: any;
  isOpening?: number;
}

export interface TabData {
  t: string;
  h: string;
}

export interface ProfileSection {
  n: string;
  i: string;
  tabs: TabData[];
}

export interface SaveState {
  v: Record<string, number>;
  f: Record<string, number>;
  s: Record<string, number>;
  gate: number;
  night?: number;
}

export interface PPDBFormData {
  nama: string;
  nisn: string;
  jk: string;
  ttl: string;
  smp: string;
  nilai: string;
  jur1: string;
  jur2: string;
  jalur: string;
  ortu: string;
  wa: string;
  alamat: string;
  docs: {
    rapor: boolean;
    akta: boolean;
    kk: boolean;
    prestasi: boolean;
  };
}

