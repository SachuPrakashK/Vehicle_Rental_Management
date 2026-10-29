import type { Request, Response } from 'express';
import * as bikes from '../repositories/bike.repository.js';
import { AppError } from '../utils/app-error.js';
import { success } from '../utils/api-response.js';

const mapBike = (bike: bikes.BikeRow) => ({
  id: Number(bike.id),
  brand: bike.brand,
  model: bike.model,
  year: bike.year,
  color: bike.color,
  dailyRate: Number(bike.daily_rate),
  image: bike.image,
  registrationNumber: bike.registration_number,
  available: bike.available,
  status: bike.status,
});

export async function list(_request: Request, response: Response) {
  success(response, 200, 'Bikes retrieved successfully.', (await bikes.list()).map(mapBike));
}
export async function get(request: Request, response: Response) {
  const bike = await bikes.find(Number(request.params['id']));
  if (!bike) throw new AppError(404, 'Bike not found.');
  success(response, 200, 'Bike retrieved successfully.', mapBike(bike));
}
export async function create(request: Request, response: Response) {
  const bike = await bikes.create(request.body);
  success(response, 201, 'Bike created successfully.', mapBike(bike));
}
export async function update(request: Request, response: Response) {
  const bike = await bikes.update(Number(request.params['id']), request.body);
  if (!bike) throw new AppError(404, 'Bike not found.');
  success(response, 200, 'Bike updated successfully.', mapBike(bike));
}
export async function remove(request: Request, response: Response) {
  if (!(await bikes.remove(Number(request.params['id']))))
    throw new AppError(404, 'Bike not found.');
  success(response, 200, 'Bike deleted successfully.');
}
