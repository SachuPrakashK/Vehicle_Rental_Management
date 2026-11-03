CREATE TABLE IF NOT EXISTS fleet_maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_ref varchar(100) NOT NULL,
  vehicle_type varchar(10) NOT NULL CHECK (vehicle_type IN ('CAR','BIKE')),
  registration_number varchar(30) NOT NULL,
  maintenance_type varchar(80) NOT NULL,
  description varchar(500) NOT NULL,
  scheduled_date timestamptz NOT NULL,
  completed_date timestamptz,
  odometer_reading integer CHECK (odometer_reading IS NULL OR odometer_reading >= 0),
  estimated_cost numeric(12,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  actual_cost numeric(12,2) CHECK (actual_cost IS NULL OR actual_cost >= 0),
  service_provider varchar(160),
  status varchar(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','DUE','IN_PROGRESS','COMPLETED','CANCELLED')),
  notes varchar(1000),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'COMPLETED') = (completed_date IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS fleet_maintenance_vehicle_idx ON fleet_maintenance_records(vehicle_ref, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS fleet_maintenance_status_date_idx ON fleet_maintenance_records(status, scheduled_date);

CREATE TABLE IF NOT EXISTS fleet_maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_ref varchar(100) NOT NULL,
  vehicle_type varchar(10) NOT NULL CHECK (vehicle_type IN ('CAR','BIKE')),
  registration_number varchar(30) NOT NULL,
  service_type varchar(80) NOT NULL,
  interval_km integer CHECK (interval_km IS NULL OR interval_km > 0),
  interval_days integer CHECK (interval_days IS NULL OR interval_days > 0),
  last_service_date date,
  last_service_odometer integer CHECK (last_service_odometer IS NULL OR last_service_odometer >= 0),
  next_due_date date,
  next_due_odometer integer CHECK (next_due_odometer IS NULL OR next_due_odometer >= 0),
  reminder_threshold_days integer NOT NULL DEFAULT 14 CHECK (reminder_threshold_days >= 0),
  reminder_threshold_km integer NOT NULL DEFAULT 1000 CHECK (reminder_threshold_km >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (interval_km IS NOT NULL OR interval_days IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS fleet_schedules_due_idx ON fleet_maintenance_schedules(is_active, next_due_date);

CREATE TABLE IF NOT EXISTS fleet_vehicle_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_ref varchar(100) NOT NULL,
  vehicle_type varchar(10) NOT NULL CHECK (vehicle_type IN ('CAR','BIKE')),
  registration_number varchar(30) NOT NULL,
  inspection_type varchar(20) NOT NULL CHECK (inspection_type IN ('PRE_RENTAL','POST_RENTAL','ROUTINE')),
  inspection_date timestamptz NOT NULL,
  odometer_reading integer CHECK (odometer_reading IS NULL OR odometer_reading >= 0),
  checklist_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  defects jsonb NOT NULL DEFAULT '[]'::jsonb,
  inspector_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status varchar(20) NOT NULL CHECK (status IN ('PASSED','ATTENTION','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fleet_inspections_vehicle_idx ON fleet_vehicle_inspections(vehicle_ref, inspection_date DESC);

CREATE TABLE IF NOT EXISTS fleet_telematics_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_ref varchar(100) NOT NULL,
  provider varchar(80) NOT NULL,
  external_device_id varchar(160) NOT NULL,
  device_status varchar(20) NOT NULL DEFAULT 'UNKNOWN' CHECK (device_status IN ('ONLINE','OFFLINE','STALE','UNKNOWN')),
  last_seen_at timestamptz,
  installed_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS fleet_device_provider_external_unique ON fleet_telematics_devices(provider, external_device_id);
CREATE UNIQUE INDEX IF NOT EXISTS fleet_device_active_vehicle_unique ON fleet_telematics_devices(vehicle_ref) WHERE is_active=true;

CREATE TABLE IF NOT EXISTS fleet_vehicle_locations (
  id bigserial PRIMARY KEY,
  vehicle_ref varchar(100) NOT NULL,
  device_id uuid NOT NULL REFERENCES fleet_telematics_devices(id) ON DELETE CASCADE,
  latitude numeric(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  speed numeric(8,2) CHECK (speed IS NULL OR speed >= 0),
  heading numeric(6,2) CHECK (heading IS NULL OR heading BETWEEN 0 AND 360),
  accuracy numeric(8,2) CHECK (accuracy IS NULL OR accuracy >= 0),
  ignition boolean,
  recorded_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  source varchar(80) NOT NULL,
  UNIQUE(device_id, recorded_at)
);
CREATE INDEX IF NOT EXISTS fleet_locations_vehicle_time_idx ON fleet_vehicle_locations(vehicle_ref, recorded_at DESC);

CREATE TABLE IF NOT EXISTS fleet_geofences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  description varchar(500),
  center_latitude numeric(9,6) NOT NULL CHECK (center_latitude BETWEEN -90 AND 90),
  center_longitude numeric(9,6) NOT NULL CHECK (center_longitude BETWEEN -180 AND 180),
  radius_meters integer NOT NULL CHECK (radius_meters BETWEEN 50 AND 100000),
  status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fleet_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_ref varchar(100),
  registration_number varchar(30),
  alert_type varchar(50) NOT NULL,
  severity varchar(20) NOT NULL CHECK (severity IN ('INFORMATION','WARNING','CRITICAL')),
  message varchar(500) NOT NULL,
  source_event_id varchar(180),
  status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
  acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes varchar(1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS fleet_alert_source_unique ON fleet_alerts(alert_type, source_event_id) WHERE source_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS fleet_alert_status_idx ON fleet_alerts(status, severity, created_at DESC);

CREATE TABLE IF NOT EXISTS fleet_health_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_ref varchar(100) NOT NULL,
  registration_number varchar(30) NOT NULL,
  health_score integer NOT NULL CHECK (health_score BETWEEN 0 AND 100),
  assessment_method varchar(40) NOT NULL,
  assessment_version varchar(20) NOT NULL,
  contributing_factors jsonb NOT NULL,
  data_completeness integer NOT NULL CHECK (data_completeness BETWEEN 0 AND 100),
  assessed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fleet_health_vehicle_time_idx ON fleet_health_assessments(vehicle_ref, assessed_at DESC);

INSERT INTO permissions(module,action,code,description) VALUES
('Fleet Intelligence','View Overview','fleet.overview.view','View Fleet Intelligence overview.'),
('Fleet Tracking','View','fleet.tracking.view','View latest authorized vehicle positions.'),
('Fleet Tracking','View History','fleet.tracking.history.view','View vehicle location history.'),
('Fleet Tracking','Manage Devices','fleet.tracking.devices.manage','Manage telematics device mappings.'),
('Vehicle Health','View','fleet.health.view','View vehicle health assessments.'),
('Vehicle Health','Assess','fleet.health.assess','Run rule-based vehicle health assessments.'),
('Fleet Maintenance','View','fleet.maintenance.view','View maintenance records and schedules.'),
('Fleet Maintenance','Create','fleet.maintenance.create','Create maintenance records and schedules.'),
('Fleet Maintenance','Edit','fleet.maintenance.edit','Edit maintenance records and schedules.'),
('Fleet Maintenance','Complete','fleet.maintenance.complete','Complete maintenance work orders.'),
('Fleet Maintenance','Delete','fleet.maintenance.delete','Delete maintenance records.'),
('Fleet Geofences','View','fleet.geofences.view','View fleet geofences.'),
('Fleet Geofences','Create','fleet.geofences.create','Create fleet geofences.'),
('Fleet Geofences','Edit','fleet.geofences.edit','Edit fleet geofences.'),
('Fleet Geofences','Delete','fleet.geofences.delete','Delete fleet geofences.'),
('Fleet Alerts','View','fleet.alerts.view','View fleet alerts.'),
('Fleet Alerts','Acknowledge','fleet.alerts.acknowledge','Acknowledge fleet alerts.'),
('Fleet Alerts','Resolve','fleet.alerts.resolve','Resolve fleet alerts.'),
('Fleet Analytics','View','fleet.analytics.view','View fleet analytics.'),
('Fleet Analytics','Export','fleet.analytics.export','Export fleet analytics.'),
('Fleet Predictions','View','fleet.predictions.view','View rule-based maintenance forecasts.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code LIKE 'fleet.%' WHERE r.code='SUPER_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code = ANY(ARRAY[
  'fleet.overview.view','fleet.health.view','fleet.health.assess','fleet.maintenance.view',
  'fleet.maintenance.create','fleet.maintenance.edit','fleet.maintenance.complete',
  'fleet.alerts.view','fleet.alerts.acknowledge','fleet.alerts.resolve','fleet.analytics.view',
  'fleet.predictions.view'
]) WHERE r.code='ADMIN' ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r JOIN permissions p ON p.code = ANY(ARRAY[
  'fleet.overview.view','fleet.health.view','fleet.maintenance.view','fleet.alerts.view'
]) WHERE r.code='STAFF' ON CONFLICT DO NOTHING;
