import { pool } from '../config/database.js';

export interface BikeRow {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string | null;
  daily_rate: string;
  image: string | null;
  registration_number: string;
  available: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface BikeWrite {
  brand: string;
  model: string;
  year: number;
  color?: string | null;
  dailyRate: number;
  image?: string | null;
  registrationNumber: string;
  available: boolean;
  status: BikeRow['status'];
}

const columns = `id,brand,model,year,color,daily_rate,image,registration_number,available,status`;

export async function list(): Promise<BikeRow[]> {
  return (await pool.query<BikeRow>(`SELECT ${columns} FROM bikes ORDER BY created_at DESC`)).rows;
}
export async function find(id: number): Promise<BikeRow | null> {
  return (
    (await pool.query<BikeRow>(`SELECT ${columns} FROM bikes WHERE id=$1`, [id])).rows[0] ?? null
  );
}
export async function create(value: BikeWrite): Promise<BikeRow> {
  return (
    await pool.query<BikeRow>(
      `INSERT INTO bikes(brand,model,year,color,daily_rate,image,registration_number,available,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${columns}`,
      [
        value.brand,
        value.model,
        value.year,
        value.color ?? null,
        value.dailyRate,
        value.image ?? null,
        value.registrationNumber,
        value.available,
        value.status,
      ],
    )
  ).rows[0]!;
}
export async function update(id: number, value: BikeWrite): Promise<BikeRow | null> {
  return (
    (
      await pool.query<BikeRow>(
        `UPDATE bikes SET brand=$2,model=$3,year=$4,color=$5,daily_rate=$6,image=$7,registration_number=$8,available=$9,status=$10,updated_at=now()
       WHERE id=$1 RETURNING ${columns}`,
        [
          id,
          value.brand,
          value.model,
          value.year,
          value.color ?? null,
          value.dailyRate,
          value.image ?? null,
          value.registrationNumber,
          value.available,
          value.status,
        ],
      )
    ).rows[0] ?? null
  );
}
export async function remove(id: number): Promise<boolean> {
  return (await pool.query('DELETE FROM bikes WHERE id=$1', [id])).rowCount === 1;
}
