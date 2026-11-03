import { pool } from '../config/database.js';

export async function seedSmartFleetDemoData(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      INSERT INTO fleet_maintenance_records(
        id,vehicle_ref,vehicle_type,registration_number,maintenance_type,description,scheduled_date,
        completed_date,odometer_reading,estimated_cost,actual_cost,service_provider,status,notes
      ) VALUES
        ('10000000-0000-4000-8000-000000000001','demo-car-001','CAR','KA01AB1234','Engine service',
         'Engine oil, oil filter, and air filter replacement.',now() - interval '62 days',now() - interval '61 days',
         48200,8500,8120,'Bengaluru Auto Care','COMPLETED','Completed after standard inspection.'),
        ('10000000-0000-4000-8000-000000000002','demo-car-002','CAR','KA05MN7788','Brake inspection',
         'Inspect brake pads, discs, fluid level, and braking response.',now() - interval '5 days',NULL,
         71350,6200,NULL,'Fleetline Service Hub','DUE','Front brake pads require replacement.'),
        ('10000000-0000-4000-8000-000000000003','demo-bike-001','BIKE','KA03BX4412','Chain and tyre service',
         'Adjust chain tension and inspect both tyres.',now() + interval '4 days',NULL,
         18600,2400,NULL,'MotoWorks Bengaluru','SCHEDULED','Customer bookings blocked during service window.'),
        ('10000000-0000-4000-8000-000000000004','demo-car-003','CAR','KA51EV2026','Battery diagnostics',
         'Run battery health, charging, and electrical-system diagnostics.',now() - interval '1 day',NULL,
         32900,4800,NULL,'EV Care Centre','IN_PROGRESS','Diagnostics currently in progress.'),
        ('10000000-0000-4000-8000-000000000005','demo-bike-002','BIKE','KA02QR9081','Periodic service',
         'Oil change, brake adjustment, and safety inspection.',now() - interval '124 days',now() - interval '123 days',
         24400,3100,2980,'MotoWorks Bengaluru','COMPLETED','No additional repairs required.')
      ON CONFLICT (id) DO UPDATE SET
        scheduled_date=EXCLUDED.scheduled_date,completed_date=EXCLUDED.completed_date,status=EXCLUDED.status,
        odometer_reading=EXCLUDED.odometer_reading,estimated_cost=EXCLUDED.estimated_cost,
        actual_cost=EXCLUDED.actual_cost,updated_at=now()
    `);
    await client.query(`
      INSERT INTO fleet_maintenance_schedules(
        id,vehicle_ref,vehicle_type,registration_number,service_type,interval_km,interval_days,
        last_service_date,last_service_odometer,next_due_date,next_due_odometer,reminder_threshold_days,
        reminder_threshold_km,is_active
      ) VALUES
        ('20000000-0000-4000-8000-000000000001','demo-car-001','CAR','KA01AB1234','Engine service',10000,180,
         current_date - 160,48200,current_date + 20,58200,14,1000,true),
        ('20000000-0000-4000-8000-000000000002','demo-car-002','CAR','KA05MN7788','Brake inspection',15000,180,
         current_date - 192,56350,current_date - 12,71350,14,1200,true),
        ('20000000-0000-4000-8000-000000000003','demo-bike-001','BIKE','KA03BX4412','Chain and tyre service',5000,90,
         current_date - 82,13600,current_date + 8,18600,14,500,true),
        ('20000000-0000-4000-8000-000000000004','demo-car-003','CAR','KA51EV2026','Battery diagnostics',12000,365,
         current_date - 330,20900,current_date + 35,32900,21,1000,true),
        ('20000000-0000-4000-8000-000000000005','demo-bike-002','BIKE','KA02QR9081','Periodic service',6000,120,
         current_date - 123,24400,current_date - 3,30400,10,600,true)
      ON CONFLICT (id) DO UPDATE SET
        last_service_date=EXCLUDED.last_service_date,next_due_date=EXCLUDED.next_due_date,
        last_service_odometer=EXCLUDED.last_service_odometer,next_due_odometer=EXCLUDED.next_due_odometer,
        is_active=true,updated_at=now()
    `);
    await client.query(`
      INSERT INTO fleet_vehicle_inspections(
        id,vehicle_ref,vehicle_type,registration_number,inspection_type,inspection_date,
        odometer_reading,checklist_results,defects,status
      ) VALUES
        ('30000000-0000-4000-8000-000000000001','demo-car-001','CAR','KA01AB1234','ROUTINE',now() - interval '7 days',
         49110,'{"lights":"PASS","brakes":"PASS","tyres":"PASS"}','[]','PASSED'),
        ('30000000-0000-4000-8000-000000000002','demo-car-002','CAR','KA05MN7788','POST_RENTAL',now() - interval '2 days',
         71480,'{"lights":"PASS","brakes":"ATTENTION","tyres":"PASS"}','["Front brake pad wear"]','ATTENTION'),
        ('30000000-0000-4000-8000-000000000003','demo-bike-001','BIKE','KA03BX4412','PRE_RENTAL',now() - interval '1 day',
         18640,'{"lights":"PASS","brakes":"PASS","tyres":"ATTENTION"}','["Rear tyre pressure low"]','ATTENTION'),
        ('30000000-0000-4000-8000-000000000004','demo-car-003','CAR','KA51EV2026','ROUTINE',now() - interval '3 days',
         32900,'{"lights":"PASS","brakes":"PASS","battery":"ATTENTION"}','["Battery capacity below target"]','ATTENTION'),
        ('30000000-0000-4000-8000-000000000005','demo-bike-002','BIKE','KA02QR9081','POST_RENTAL',now() - interval '4 days',
         24720,'{"lights":"PASS","brakes":"PASS","tyres":"PASS"}','[]','PASSED')
      ON CONFLICT (id) DO UPDATE SET
        inspection_date=EXCLUDED.inspection_date,odometer_reading=EXCLUDED.odometer_reading,
        checklist_results=EXCLUDED.checklist_results,defects=EXCLUDED.defects,status=EXCLUDED.status
    `);
    await client.query(`
      INSERT INTO fleet_health_assessments(
        id,vehicle_ref,registration_number,health_score,assessment_method,assessment_version,
        contributing_factors,data_completeness,assessed_at
      ) VALUES
        ('40000000-0000-4000-8000-000000000001','demo-car-001','KA01AB1234',96,'RULE_BASED','1.0',
         '{"overdueMaintenance":0,"openInspectionDefects":0}',90,now()),
        ('40000000-0000-4000-8000-000000000002','demo-car-002','KA05MN7788',55,'RULE_BASED','1.0',
         '{"overdueMaintenance":1,"openInspectionDefects":1}',85,now()),
        ('40000000-0000-4000-8000-000000000003','demo-bike-001','KA03BX4412',80,'RULE_BASED','1.0',
         '{"overdueMaintenance":0,"openInspectionDefects":1}',75,now()),
        ('40000000-0000-4000-8000-000000000004','demo-car-003','KA51EV2026',72,'RULE_BASED','1.0',
         '{"overdueMaintenance":0,"openInspectionDefects":1}',88,now()),
        ('40000000-0000-4000-8000-000000000005','demo-bike-002','KA02QR9081',75,'RULE_BASED','1.0',
         '{"overdueMaintenance":1,"openInspectionDefects":0}',82,now())
      ON CONFLICT (id) DO UPDATE SET
        health_score=EXCLUDED.health_score,contributing_factors=EXCLUDED.contributing_factors,
        data_completeness=EXCLUDED.data_completeness,assessed_at=now()
    `);
    await client.query(`
      INSERT INTO fleet_telematics_devices(
        id,vehicle_ref,provider,external_device_id,device_status,last_seen_at,is_active
      ) VALUES
        ('50000000-0000-4000-8000-000000000001','demo-car-001','SIMULATOR','demo-car-001','ONLINE',now(),true),
        ('50000000-0000-4000-8000-000000000002','demo-car-002','SIMULATOR','demo-car-002','ONLINE',now(),true),
        ('50000000-0000-4000-8000-000000000003','demo-bike-001','SIMULATOR','demo-bike-001','ONLINE',now(),true),
        ('50000000-0000-4000-8000-000000000004','demo-car-003','SIMULATOR','demo-car-003','STALE',now() - interval '35 minutes',true)
      ON CONFLICT (provider,external_device_id) DO UPDATE SET
        device_status=EXCLUDED.device_status,last_seen_at=EXCLUDED.last_seen_at,is_active=true,updated_at=now()
    `);
    await client.query(`DELETE FROM fleet_vehicle_locations WHERE vehicle_ref LIKE 'demo-%'`);
    await client.query(`
      INSERT INTO fleet_vehicle_locations(
        vehicle_ref,device_id,latitude,longitude,speed,heading,accuracy,ignition,recorded_at,source
      ) VALUES
        ('demo-car-001','50000000-0000-4000-8000-000000000001',12.971599,77.594566,34,82,5,true,now() - interval '2 minutes','SIMULATOR'),
        ('demo-car-002','50000000-0000-4000-8000-000000000002',12.935192,77.624481,18,210,6,true,now() - interval '4 minutes','SIMULATOR'),
        ('demo-bike-001','50000000-0000-4000-8000-000000000003',13.035542,77.597100,42,145,4,true,now() - interval '1 minute','SIMULATOR'),
        ('demo-car-003','50000000-0000-4000-8000-000000000004',12.914142,77.641151,0,0,8,false,now() - interval '35 minutes','SIMULATOR')
    `);
    await client.query(`
      INSERT INTO fleet_geofences(
        id,name,description,center_latitude,center_longitude,radius_meters,status
      ) VALUES
        ('60000000-0000-4000-8000-000000000001','Central Bengaluru Zone',
         'Primary operating area for city rentals.',12.971599,77.594566,8500,'ACTIVE'),
        ('60000000-0000-4000-8000-000000000002','Airport Service Zone',
         'Vehicle handover and service boundary near Kempegowda airport.',13.198635,77.706593,5000,'ACTIVE'),
        ('60000000-0000-4000-8000-000000000003','Workshop Perimeter',
         'Maintenance workshop staging area.',12.914142,77.641151,900,'INACTIVE')
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name,description=EXCLUDED.description,center_latitude=EXCLUDED.center_latitude,
        center_longitude=EXCLUDED.center_longitude,radius_meters=EXCLUDED.radius_meters,status=EXCLUDED.status,
        updated_at=now()
    `);
    await client.query(`
      INSERT INTO fleet_alerts(
        id,vehicle_ref,registration_number,alert_type,severity,message,source_event_id,status,
        acknowledged_at,resolved_at,resolution_notes,created_at
      ) VALUES
        ('70000000-0000-4000-8000-000000000001','demo-car-002','KA05MN7788','MAINTENANCE_OVERDUE','WARNING',
         'Brake inspection is overdue by 5 days.','demo-maintenance-overdue-001','OPEN',NULL,NULL,NULL,now() - interval '5 days'),
        ('70000000-0000-4000-8000-000000000002','demo-car-003','KA51EV2026','BATTERY_HEALTH','CRITICAL',
         'Battery health is below the operational threshold.','demo-battery-health-001','ACKNOWLEDGED',now() - interval '2 hours',NULL,NULL,now() - interval '1 day'),
        ('70000000-0000-4000-8000-000000000003','demo-bike-001','KA03BX4412','INSPECTION_DEFECT','INFORMATION',
         'Rear tyre pressure requires attention before the next booking.','demo-inspection-001','OPEN',NULL,NULL,NULL,now() - interval '8 hours'),
        ('70000000-0000-4000-8000-000000000004','demo-car-001','KA01AB1234','GEOFENCE_EXIT','WARNING',
         'Vehicle returned to the approved operating zone.','demo-geofence-001','RESOLVED',now() - interval '2 days',
         now() - interval '1 day','Vehicle location verified.',now() - interval '3 days')
      ON CONFLICT (id) DO UPDATE SET
        severity=EXCLUDED.severity,message=EXCLUDED.message,status=EXCLUDED.status,
        acknowledged_at=EXCLUDED.acknowledged_at,resolved_at=EXCLUDED.resolved_at,
        resolution_notes=EXCLUDED.resolution_notes,created_at=EXCLUDED.created_at
    `);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
