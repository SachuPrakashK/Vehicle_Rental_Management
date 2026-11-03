import { pool } from '../config/database.js';
import { AppError } from '../utils/app-error.js';
import type { NormalizedPosition } from './traccar.provider.js';

const recordColumns = `id,vehicle_ref "vehicleRef",vehicle_type "vehicleType",registration_number "registrationNumber",
maintenance_type "maintenanceType",description,scheduled_date "scheduledDate",completed_date "completedDate",
odometer_reading "odometerReading",estimated_cost::float8 "estimatedCost",actual_cost::float8 "actualCost",
service_provider "serviceProvider",status,notes,created_at "createdAt",updated_at "updatedAt"`;

export function calculateNextService(
  lastDate: string | null,
  intervalDays: number | null,
  lastOdometer: number | null,
  intervalKm: number | null,
) {
  return {
    nextDate:
      lastDate && intervalDays
        ? new Date(new Date(lastDate).getTime() + intervalDays * 86400000)
            .toISOString()
            .slice(0, 10)
        : null,
    nextOdometer: lastOdometer != null && intervalKm ? lastOdometer + intervalKm : null,
  };
}

export function calculateHealthScore(overdue: number, defects: number, hasRecords: boolean) {
  const score = Math.max(0, 100 - overdue * 25 - defects * 20 - (hasRecords ? 0 : 15));
  return {
    score,
    status:
      score >= 80 ? 'HEALTHY' : score >= 50 ? 'ATTENTION_RECOMMENDED' : 'MAINTENANCE_REQUIRED',
  } as const;
}

export async function maintenance() {
  return (
    await pool.query(
      `SELECT ${recordColumns} FROM fleet_maintenance_records ORDER BY scheduled_date DESC LIMIT 500`,
    )
  ).rows;
}

export async function createMaintenance(value: Record<string, unknown>, userId: string) {
  return (
    await pool.query(
      `INSERT INTO fleet_maintenance_records(vehicle_ref,vehicle_type,registration_number,maintenance_type,description,
       scheduled_date,odometer_reading,estimated_cost,actual_cost,service_provider,status,notes,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING ${recordColumns}`,
      [
        value['vehicleRef'],
        value['vehicleType'],
        value['registrationNumber'],
        value['maintenanceType'],
        value['description'],
        value['scheduledDate'],
        value['odometerReading'] ?? null,
        value['estimatedCost'] ?? null,
        value['actualCost'] ?? null,
        value['serviceProvider'] ?? null,
        value['status'],
        value['notes'] ?? null,
        userId,
      ],
    )
  ).rows[0];
}

export async function completeMaintenance(id: string, value: Record<string, unknown>) {
  const result = await pool.query(
    `UPDATE fleet_maintenance_records SET status='COMPLETED',completed_date=$2,odometer_reading=$3,
     actual_cost=$4,notes=COALESCE($5,notes),updated_at=now() WHERE id=$1 AND status NOT IN ('COMPLETED','CANCELLED')
     RETURNING ${recordColumns}`,
    [
      id,
      value['completedDate'],
      value['odometerReading'],
      value['actualCost'] ?? null,
      value['notes'] ?? null,
    ],
  );
  if (!result.rows[0]) throw new AppError(409, 'This maintenance record cannot be completed.');
  return result.rows[0];
}

export async function schedules() {
  return (
    await pool.query(
      `SELECT id,vehicle_ref "vehicleRef",vehicle_type "vehicleType",registration_number "registrationNumber",
       service_type "serviceType",interval_km "intervalKm",interval_days "intervalDays",last_service_date "lastServiceDate",
       last_service_odometer "lastServiceOdometer",next_due_date "nextDueDate",next_due_odometer "nextDueOdometer",
       reminder_threshold_days "reminderThresholdDays",reminder_threshold_km "reminderThresholdKm",is_active "isActive"
       FROM fleet_maintenance_schedules ORDER BY next_due_date NULLS LAST,registration_number`,
    )
  ).rows;
}

export async function createSchedule(value: Record<string, unknown>, userId: string) {
  const lastDate = value['lastServiceDate'] as string | null;
  const intervalDays = value['intervalDays'] as number | null;
  const lastOdometer = value['lastServiceOdometer'] as number | null;
  const intervalKm = value['intervalKm'] as number | null;
  const { nextDate, nextOdometer } = calculateNextService(
    lastDate,
    intervalDays,
    lastOdometer,
    intervalKm,
  );
  return (
    await pool.query(
      `INSERT INTO fleet_maintenance_schedules(vehicle_ref,vehicle_type,registration_number,service_type,interval_km,
       interval_days,last_service_date,last_service_odometer,next_due_date,next_due_odometer,reminder_threshold_days,
       reminder_threshold_km,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        value['vehicleRef'],
        value['vehicleType'],
        value['registrationNumber'],
        value['serviceType'],
        intervalKm,
        intervalDays,
        lastDate,
        lastOdometer,
        nextDate,
        nextOdometer,
        value['reminderThresholdDays'],
        value['reminderThresholdKm'],
        userId,
      ],
    )
  ).rows[0];
}

export async function inspections() {
  return (
    await pool.query(
      `SELECT id,vehicle_ref "vehicleRef",vehicle_type "vehicleType",registration_number "registrationNumber",
       inspection_type "inspectionType",inspection_date "inspectionDate",odometer_reading "odometerReading",
       checklist_results "checklistResults",defects,status,created_at "createdAt"
       FROM fleet_vehicle_inspections ORDER BY inspection_date DESC LIMIT 500`,
    )
  ).rows;
}

export async function createInspection(value: Record<string, unknown>, userId: string) {
  return (
    await pool.query(
      `INSERT INTO fleet_vehicle_inspections(vehicle_ref,vehicle_type,registration_number,inspection_type,inspection_date,
       odometer_reading,checklist_results,defects,inspector_id,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        value['vehicleRef'],
        value['vehicleType'],
        value['registrationNumber'],
        value['inspectionType'],
        value['inspectionDate'],
        value['odometerReading'] ?? null,
        JSON.stringify(value['checklistResults']),
        JSON.stringify(value['defects']),
        userId,
        value['status'],
      ],
    )
  ).rows[0];
}

export async function refreshDueAlerts() {
  await pool.query(
    `UPDATE fleet_maintenance_records SET status='DUE',updated_at=now()
     WHERE status='SCHEDULED' AND scheduled_date <= now()`,
  );
  await pool.query(
    `INSERT INTO fleet_alerts(vehicle_ref,registration_number,alert_type,severity,message,source_event_id)
     SELECT vehicle_ref,registration_number,'MAINTENANCE_OVERDUE','WARNING',
     'Scheduled maintenance is overdue.',id::text FROM fleet_maintenance_records
     WHERE status='DUE' ON CONFLICT (alert_type,source_event_id) WHERE source_event_id IS NOT NULL DO NOTHING`,
  );
}

export async function overview(includeMaintenanceDetails = false) {
  await refreshDueAlerts();
  const [
    maintenanceCounts,
    alerts,
    costs,
    tracked,
    maintenanceStatus,
    upcomingMaintenance,
    fleetHealth,
  ] = await Promise.all([
    pool.query(`SELECT count(*) FILTER (WHERE status IN ('SCHEDULED','DUE','IN_PROGRESS'))::int "openMaintenance",
      count(*) FILTER (WHERE status='DUE')::int "overdueMaintenance" FROM fleet_maintenance_records`),
    pool.query(`SELECT count(*) FILTER (WHERE status!='RESOLVED')::int "openAlerts",
      count(*) FILTER (WHERE status!='RESOLVED' AND severity='CRITICAL')::int "criticalAlerts" FROM fleet_alerts`),
    pool.query(
      `SELECT COALESCE(sum(actual_cost),0)::float8 "maintenanceCost" FROM fleet_maintenance_records WHERE status='COMPLETED'`,
    ),
    pool.query(
      `SELECT count(*)::int "trackedVehicles" FROM fleet_telematics_devices WHERE is_active=true`,
    ),
    pool.query(`WITH known AS (
      SELECT vehicle_ref FROM fleet_maintenance_records UNION SELECT vehicle_ref FROM fleet_maintenance_schedules
      UNION SELECT vehicle_ref FROM fleet_vehicle_inspections
    ), flags AS (
      SELECT k.vehicle_ref,
        EXISTS(SELECT 1 FROM fleet_maintenance_records r WHERE r.vehicle_ref=k.vehicle_ref AND r.status='IN_PROGRESS') "underMaintenance",
        EXISTS(SELECT 1 FROM fleet_maintenance_records r WHERE r.vehicle_ref=k.vehicle_ref AND r.status='DUE') OR
          EXISTS(SELECT 1 FROM fleet_maintenance_schedules s WHERE s.vehicle_ref=k.vehicle_ref AND s.is_active=true AND s.next_due_date < current_date) overdue,
        EXISTS(SELECT 1 FROM fleet_maintenance_schedules s WHERE s.vehicle_ref=k.vehicle_ref AND s.is_active=true
          AND s.next_due_date BETWEEN current_date AND current_date + s.reminder_threshold_days) "dueSoon"
      FROM known k
    ) SELECT count(*)::int "knownVehicles",
      count(*) FILTER (WHERE "underMaintenance")::int "underMaintenance",
      count(*) FILTER (WHERE NOT "underMaintenance" AND overdue)::int overdue,
      count(*) FILTER (WHERE NOT "underMaintenance" AND NOT overdue AND "dueSoon")::int "dueSoon",
      count(*) FILTER (WHERE NOT "underMaintenance" AND NOT overdue AND NOT "dueSoon")::int healthy
      FROM flags`),
    includeMaintenanceDetails
      ? pool.query(`SELECT s.vehicle_ref "vehicleRef",s.registration_number "registrationNumber",s.service_type "serviceType",
      s.next_due_date "dueDate",s.next_due_odometer "dueOdometer",NULL::int "remainingKm",
      CASE WHEN s.next_due_date < current_date THEN 'OVERDUE'
           WHEN s.next_due_date <= current_date + s.reminder_threshold_days THEN 'DUE_SOON'
           ELSE 'PLANNED' END status
      FROM fleet_maintenance_schedules s WHERE s.is_active=true AND s.next_due_date IS NOT NULL
      ORDER BY CASE WHEN s.next_due_date < current_date THEN 0
                    WHEN s.next_due_date <= current_date + s.reminder_threshold_days THEN 1 ELSE 2 END,
               s.next_due_date LIMIT 8`)
      : Promise.resolve({ rows: [] }),
    pool.query(`WITH latest AS (SELECT DISTINCT ON (vehicle_ref) vehicle_ref,health_score,data_completeness
      FROM fleet_health_assessments ORDER BY vehicle_ref,assessed_at DESC)
      SELECT round(avg(health_score))::int "averageScore",count(*)::int "assessedVehicles",
      round(avg(data_completeness))::int "averageCompleteness" FROM latest`),
  ]);
  return {
    ...maintenanceCounts.rows[0],
    ...alerts.rows[0],
    ...costs.rows[0],
    ...tracked.rows[0],
    maintenanceStatus: maintenanceStatus.rows[0],
    upcomingMaintenance: upcomingMaintenance.rows,
    fleetHealth: fleetHealth.rows[0],
  };
}

export async function health() {
  const result = await pool.query<{
    vehicleRef: string;
    registrationNumber: string;
    overdue: number;
    defects: number;
    records: number;
  }>(`SELECT vehicles.vehicle_ref "vehicleRef",vehicles.registration_number "registrationNumber",
    COALESCE(m.overdue,0)::int overdue,COALESCE(i.defects,0)::int defects,COALESCE(m.records,0)::int records
    FROM (SELECT vehicle_ref,registration_number FROM fleet_maintenance_records UNION
          SELECT vehicle_ref,registration_number FROM fleet_vehicle_inspections) vehicles
    LEFT JOIN (SELECT vehicle_ref,count(*) FILTER (WHERE status='DUE') overdue,count(*) records
      FROM fleet_maintenance_records GROUP BY vehicle_ref) m ON m.vehicle_ref=vehicles.vehicle_ref
    LEFT JOIN (SELECT vehicle_ref,count(*) FILTER (WHERE status IN ('FAILED','ATTENTION')) defects
      FROM fleet_vehicle_inspections GROUP BY vehicle_ref) i ON i.vehicle_ref=vehicles.vehicle_ref`);
  const assessments = result.rows.map((row) => {
    const assessment = calculateHealthScore(row.overdue, row.defects, !!row.records);
    return {
      ...row,
      healthScore: assessment.score,
      status: assessment.status,
      method: 'RULE_BASED',
      version: '1.0',
      dataCompleteness: row.records ? 70 : 30,
      factors: { overdueMaintenance: row.overdue, openInspectionDefects: row.defects },
    };
  });
  await Promise.all(
    assessments.map((assessment) =>
      pool.query(
        `INSERT INTO fleet_health_assessments(vehicle_ref,registration_number,health_score,assessment_method,
         assessment_version,contributing_factors,data_completeness)
         SELECT $1,$2,$3,$4,$5,$6,$7 WHERE NOT EXISTS (
           SELECT 1 FROM fleet_health_assessments WHERE vehicle_ref=$1 AND health_score=$3
           AND contributing_factors=$6::jsonb AND assessed_at >= current_date
         )`,
        [
          assessment.vehicleRef,
          assessment.registrationNumber,
          assessment.healthScore,
          assessment.method,
          assessment.version,
          JSON.stringify(assessment.factors),
          assessment.dataCompleteness,
        ],
      ),
    ),
  );
  return assessments;
}

export async function alerts() {
  await refreshDueAlerts();
  return (
    await pool.query(`SELECT id,vehicle_ref "vehicleRef",registration_number "registrationNumber",alert_type "alertType",
    severity,message,status,acknowledged_at "acknowledgedAt",resolved_at "resolvedAt",created_at "createdAt"
    FROM fleet_alerts ORDER BY status,created_at DESC LIMIT 500`)
  ).rows;
}

export async function updateAlert(
  id: string,
  action: 'ACKNOWLEDGED' | 'RESOLVED',
  userId: string,
  notes?: string | null,
) {
  const result = await pool.query(
    `UPDATE fleet_alerts SET status=$2,acknowledged_by=COALESCE(acknowledged_by,$3),
    acknowledged_at=COALESCE(acknowledged_at,now()),resolved_at=CASE WHEN $2='RESOLVED' THEN now() ELSE resolved_at END,
    resolution_notes=CASE WHEN $2='RESOLVED' THEN $4 ELSE resolution_notes END WHERE id=$1 RETURNING *`,
    [id, action, userId, notes ?? null],
  );
  if (!result.rows[0]) throw new AppError(404, 'Fleet alert not found.');
  return result.rows[0];
}

export async function latestLocations(providerConfigured: boolean) {
  const positions = (
    await pool.query(`SELECT DISTINCT ON (l.vehicle_ref) l.vehicle_ref "vehicleRef",d.device_status "deviceStatus",
    l.latitude::float8,l.longitude::float8,l.speed::float8,l.heading::float8,l.accuracy::float8,l.recorded_at "recordedAt",l.source
    FROM fleet_vehicle_locations l JOIN fleet_telematics_devices d ON d.id=l.device_id
    ORDER BY l.vehicle_ref,l.recorded_at DESC`)
  ).rows;
  return { providerConfigured, mode: providerConfigured ? 'TRACCAR' : 'SIMULATION', positions };
}

export async function ingestProviderPositions(positions: NormalizedPosition[]) {
  for (const position of positions) {
    const device = (
      await pool.query<{ id: string; vehicleRef: string }>(
        `SELECT id,vehicle_ref "vehicleRef" FROM fleet_telematics_devices
         WHERE provider='TRACCAR' AND external_device_id=$1 AND is_active=true`,
        [position.externalDeviceId],
      )
    ).rows[0];
    if (!device) continue;
    await storePosition(device.id, device.vehicleRef, position, 'TRACCAR');
    await pool.query(
      `UPDATE fleet_telematics_devices SET device_status='ONLINE',last_seen_at=$2,updated_at=now() WHERE id=$1`,
      [device.id, position.recordedAt],
    );
  }
  await pool.query(
    `UPDATE fleet_telematics_devices SET device_status='OFFLINE',updated_at=now()
     WHERE provider='TRACCAR' AND is_active=true AND (last_seen_at IS NULL OR last_seen_at < now() - interval '15 minutes')`,
  );
}

export async function ingestSimulation(value: Record<string, unknown>) {
  let device = (
    await pool.query<{ id: string }>(
      `SELECT id FROM fleet_telematics_devices WHERE provider='SIMULATOR' AND external_device_id=$1`,
      [value['vehicleRef']],
    )
  ).rows[0];
  if (!device)
    device = (
      await pool.query<{ id: string }>(
        `INSERT INTO fleet_telematics_devices(vehicle_ref,provider,external_device_id,device_status,last_seen_at)
    VALUES($1,'SIMULATOR',$1,'ONLINE',now()) RETURNING id`,
        [value['vehicleRef']],
      )
    ).rows[0]!;
  await storePosition(
    device.id,
    String(value['vehicleRef']),
    {
      externalDeviceId: String(value['vehicleRef']),
      latitude: Number(value['latitude']),
      longitude: Number(value['longitude']),
      speed: Number(value['speed'] ?? 0),
      heading: Number(value['heading'] ?? 0),
      accuracy: 5,
      ignition: true,
      recordedAt: String(value['recordedAt'] ?? new Date().toISOString()),
    },
    'SIMULATOR',
  );
  return { simulated: true };
}

async function storePosition(
  deviceId: string,
  vehicleRef: string,
  position: NormalizedPosition,
  source: 'SIMULATOR' | 'TRACCAR',
) {
  const location = (
    await pool.query<{ id: string }>(
      `INSERT INTO fleet_vehicle_locations(vehicle_ref,device_id,latitude,longitude,speed,heading,accuracy,ignition,recorded_at,source)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(device_id,recorded_at) DO NOTHING RETURNING id`,
      [
        vehicleRef,
        deviceId,
        position.latitude,
        position.longitude,
        position.speed,
        position.heading,
        position.accuracy,
        position.ignition,
        position.recordedAt,
        source,
      ],
    )
  ).rows[0];
  if (!location) return;
  const geofences = (
    await pool.query<{ id: string; name: string; inside: boolean }>(
      `SELECT id,name,(6371000 * 2 * asin(sqrt(
        power(sin(radians($1-center_latitude)/2),2) + cos(radians(center_latitude))*cos(radians($1))*
        power(sin(radians($2-center_longitude)/2),2)))) <= radius_meters inside
       FROM fleet_geofences WHERE status='ACTIVE'`,
      [position.latitude, position.longitude],
    )
  ).rows;
  for (const geofence of geofences.filter((item) => !item.inside)) {
    await pool.query(
      `INSERT INTO fleet_alerts(vehicle_ref,alert_type,severity,message,source_event_id)
       VALUES($1,'GEOFENCE_EXIT','WARNING',$2,$3) ON CONFLICT (alert_type,source_event_id) WHERE source_event_id IS NOT NULL DO NOTHING`,
      [
        vehicleRef,
        `Vehicle moved outside ${geofence.name}.`,
        `${location.id}:${geofence.id}:OUTSIDE`,
      ],
    );
  }
}

export async function forecasts() {
  return (
    await pool.query(
      `SELECT vehicle_ref "vehicleRef",registration_number "registrationNumber",service_type "serviceType",
       next_due_date "nextDueDate",next_due_odometer "nextDueOdometer",
       CASE WHEN next_due_date IS NOT NULL AND next_due_date <= current_date THEN 'OVERDUE'
            WHEN next_due_date IS NOT NULL AND next_due_date <= current_date + reminder_threshold_days THEN 'DUE_SOON'
            ELSE 'PLANNED' END "forecastStatus",
       'DETERMINISTIC_INTERVAL' method
       FROM fleet_maintenance_schedules WHERE is_active=true ORDER BY next_due_date NULLS LAST`,
    )
  ).rows;
}

export async function geofences() {
  return (
    await pool.query(`SELECT id,name,description,center_latitude::float8 "centerLatitude",center_longitude::float8 "centerLongitude",
    radius_meters "radiusMeters",status,created_at "createdAt" FROM fleet_geofences ORDER BY name`)
  ).rows;
}

export async function createGeofence(value: Record<string, unknown>, userId: string) {
  return (
    await pool.query(
      `INSERT INTO fleet_geofences(name,description,center_latitude,center_longitude,radius_meters,status,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        value['name'],
        value['description'] ?? null,
        value['centerLatitude'],
        value['centerLongitude'],
        value['radiusMeters'],
        value['status'],
        userId,
      ],
    )
  ).rows[0];
}

export async function analytics() {
  return (
    await pool.query(`SELECT registration_number "registrationNumber",count(*)::int "serviceCount",
    COALESCE(sum(actual_cost),0)::float8 "maintenanceCost",
    COALESCE(sum(EXTRACT(EPOCH FROM (COALESCE(completed_date,now())-scheduled_date))/86400) FILTER (WHERE status='COMPLETED'),0)::float8 "downtimeDays"
    FROM fleet_maintenance_records GROUP BY registration_number ORDER BY "maintenanceCost" DESC`)
  ).rows;
}
