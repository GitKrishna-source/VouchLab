import bcrypt from 'bcryptjs';
import { db, initDatabase } from './database.js';
import { logAudit } from '../services/auditChain.js';

export async function seedDatabase(isReset = false) {
  // Ensure tables exist first
  initDatabase();

  if (isReset) {
    console.log('🔄 Resetting database tables for demo...');
    db.exec(`
      DELETE FROM audit_log;
      DELETE FROM notifications;
      DELETE FROM incidents;
      DELETE FROM condition_reports;
      DELETE FROM bookings;
      DELETE FROM signoffs;
      DELETE FROM quiz_attempts;
      DELETE FROM quiz_questions;
      DELETE FROM quizzes;
      DELETE FROM certificates;
      DELETE FROM passports;
      DELETE FROM resource_requirements;
      DELETE FROM resources;
      DELETE FROM users;
      DELETE FROM fairness_config;
    `);
    // Re-ensure default fairness config
    initDatabase();
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0 && !isReset) {
    console.log('Database already populated; skipping seed.');
    return;
  }

  console.log('🌱 Seeding demo data with realistic campus scenarios...');

  const passwordHash = await bcrypt.hash('demo1234', 10);

  // 1. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, category, department, phone, verified_status, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const student1Id = insertUser.run(
    'Keerat Gujral',
    'student1@demo.edu',
    passwordHash,
    'user',
    'academic_project',
    'B.Tech CSE',
    '+1 (555) 019-2831',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  ).lastInsertRowid;

  const student2Id = insertUser.run(
    'Rohan Mehta',
    'student2@demo.edu',
    passwordHash,
    'user',
    'research',
    'B.Tech ME',
    '+1 (555) 019-4822',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  ).lastInsertRowid;

  const student3Id = insertUser.run(
    'Simran Kaur',
    'student3@demo.edu',
    passwordHash,
    'user',
    'startup_creator',
    'Design & Robotics',
    '+1 (555) 019-7264',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
  ).lastInsertRowid;

  const owner1Id = insertUser.run(
    'Dr. Vikram Rao',
    'owner1@demo.edu',
    passwordHash,
    'owner',
    'academic_project',
    'Fabrication Lab Director',
    '+1 (555) 019-9901',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  ).lastInsertRowid;

  const owner2Id = insertUser.run(
    'Prof. Sarah Jenkins',
    'owner2@demo.edu',
    passwordHash,
    'owner',
    'research',
    'Media Arts & Optics Lab',
    '+1 (555) 019-8812',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80'
  ).lastInsertRowid;

  const manager1Id = insertUser.run(
    'Aman Singh',
    'manager1@demo.edu',
    passwordHash,
    'manager',
    'academic_project',
    'Innovation Hub Lab Manager',
    '+1 (555) 019-6123',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80'
  ).lastInsertRowid;

  const manager2Id = insertUser.run(
    'Neha Sharma',
    'manager2@demo.edu',
    passwordHash,
    'manager',
    'research',
    'Electronics Lab Supervisor',
    '+1 (555) 019-5511',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80'
  ).lastInsertRowid;

  const adminId = insertUser.run(
    'Campus Facilities Admin',
    'admin@demo.edu',
    passwordHash,
    'admin',
    'academic_project',
    'Campus Central Infrastructure',
    '+1 (555) 019-1000',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80'
  ).lastInsertRowid;

  logAudit({
    actor_id: adminId,
    actor_name: 'Campus Facilities Admin',
    actor_role: 'admin',
    action: 'INITIAL_SYSTEM_SEED',
    entity_type: 'system',
    entity_id: 1,
    payload: { message: 'Initialized demo users and lab roles' }
  });

  // 2. Insert Resources
  const insertResource = db.prepare(`
    INSERT INTO resources (
      name, category, description, location, owner_id, manager_id,
      image_url, availability_hours, rules, access_conditions, deposit, max_session_hours, monthly_cap_hours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const laserCutterId = insertResource.run(
    'Laser Cutter (Universal PLS6.150D)',
    'Equipment',
    'High-precision 60W CO2 laser cutter for acrylic, wood, cardboard, and textiles. Dual exhaust system and air assist.',
    'Innovation Lab, Room 104',
    owner1Id,
    manager1Id,
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    JSON.stringify({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], open: '09:00', close: '18:00' }),
    'Eye protection mandatory. No PVC, vinyl or chlorine-emitting materials. Always monitor cutting process.',
    'For enrolled engineering, architecture, and design students with safety clearance.',
    25,
    3,
    15
  ).lastInsertRowid;

  const printer3DId = insertResource.run(
    '3D Printer (Ultimaker S5 Dual Extruder)',
    'Equipment',
    'Industrial-grade dual extrusion 3D printer with active bed leveling and PVA water-soluble support compatibility.',
    'Innovation Lab, Block B',
    owner1Id,
    manager1Id,
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    JSON.stringify({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], open: '08:00', close: '20:00' }),
    'Submit G-code sliced with approved Cura profiles only. Clean build plate after removal.',
    'Open to all verified campus members for project prototyping.',
    10,
    6,
    30
  ).lastInsertRowid;

  const dslrId = insertResource.run(
    'DSLR Camera (Canon EOS R5 + 24-70mm f/2.8)',
    'Equipment',
    '45MP full-frame mirrorless camera with RF 24-70mm f/2.8L IS USM lens, 2x batteries, charger, and 128GB CFexpress card.',
    'Media Lab, Block A',
    owner2Id,
    manager1Id,
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    JSON.stringify({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], open: '09:00', close: '17:00' }),
    'Must keep lens hood and UV filter attached. Do not shoot in heavy rain without protective housing.',
    'For academic media projects, thesis work, and authorized campus events.',
    50,
    8,
    25
  ).lastInsertRowid;

  const oscilloscopeId = insertResource.run(
    'Digital Oscilloscope (Tektronix 4-Channel 200MHz)',
    'Tools',
    '4-channel digital storage oscilloscope with 1 GS/s sample rate and USB waveform capture.',
    'Electronics Lab, Room 204',
    owner1Id,
    manager2Id,
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
    JSON.stringify({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], open: '09:00', close: '19:00' }),
    'Ensure ground clips are connected properly before probing high voltages.',
    'Electronics and electrical engineering students.',
    0,
    4,
    20
  ).lastInsertRowid;

  const electronicsLabId = insertResource.run(
    'Electronics Prototyping Lab (Block B)',
    'Labs',
    'Fully equipped space with 8 ESD-safe benches, power supplies, function generators, multimeters, and fume extractors.',
    'Block B, 2nd Floor',
    owner1Id,
    manager2Id,
    'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=800&q=80',
    JSON.stringify({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], open: '08:00', close: '21:00' }),
    'ESD wristbands must be worn at soldering stations. Keep benches clean.',
    'Open to verified STEM students.',
    0,
    5,
    40
  ).lastInsertRowid;

  const projectRoomId = insertResource.run(
    'Collaborative Project Room 102',
    'Rooms',
    'Acoustic collaborative room with 65-inch 4K presentation display, dual whiteboards, and seating for 8.',
    'Main Building, Ground Floor',
    owner2Id,
    manager1Id,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    JSON.stringify({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], open: '08:00', close: '22:00' }),
    'Leave whiteboard cleaned and cables organized.',
    'Open to all verified campus student teams.',
    0,
    3,
    15
  ).lastInsertRowid;

  const vrHeadsetId = insertResource.run(
    'VR Developer Kit (Meta Quest Pro)',
    'Equipment',
    'Mixed reality headset with eye tracking, color passthrough, and developer touch controllers.',
    'HCI & XR Lab, Room 302',
    owner2Id,
    manager1Id,
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80',
    JSON.stringify({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], open: '10:00', close: '18:00' }),
    'Wipe face cushion with alcohol-free sanitizing wipes after use. Charge controllers in dock.',
    'Students enrolled in XR / Game Design or approved project.',
    30,
    4,
    20
  ).lastInsertRowid;

  const solderingId = insertResource.run(
    'Soldering Station (Weller Digital ESD-Safe)',
    'Tools',
    'Microprocessor-controlled soldering station with precision tips, brass wool cleaner, and fume suction arm.',
    'Electronics Lab, Bench 4',
    owner1Id,
    manager2Id,
    'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80',
    JSON.stringify({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], open: '09:00', close: '19:00' }),
    'Turn off iron when not in hand. Fume extractor must be running.',
    'Requires soldering safety signoff.',
    0,
    3,
    15
  ).lastInsertRowid;

  logAudit({
    actor_id: adminId,
    actor_name: 'Campus Facilities Admin',
    actor_role: 'admin',
    action: 'RESOURCES_SEEDED',
    entity_type: 'resource',
    entity_id: laserCutterId,
    payload: { total_resources: 8 }
  });

  // 3. Declare Requirements for Resources
  const insertReq = db.prepare(`
    INSERT INTO resource_requirements (resource_id, type, title, description, config)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Laser Cutter Requirements (3 requirements):
  const laserQuizReqId = insertReq.run(
    laserCutterId,
    'quiz',
    'Laser Cutter Safety & Fire Protocol Quiz',
    'Covers beam safety, emergency power cutoff, air ventilation, and non-cuttable toxic plastics.',
    JSON.stringify({ pass_percentage: 80 })
  ).lastInsertRowid;

  const laserSessionReqId = insertReq.run(
    laserCutterId,
    'supervised_session',
    '1 Supervised Operation Session',
    'Complete one 30-minute hands-on cutting run with a lab manager present.',
    JSON.stringify({ required_sessions: 1 })
  ).lastInsertRowid;

  const laserSignoffReqId = insertReq.run(
    laserCutterId,
    'signoff',
    'Lab Director Endorsement Sign-Off',
    'Faculty lab director authorization for independent cutter operation.',
    '{}'
  ).lastInsertRowid;

  // 3D Printer Requirements (2 requirements):
  const printerQuizReqId = insertReq.run(
    printer3DId,
    'quiz',
    '3D Printing & Filament Handling Quiz',
    'Slicing parameters, bed leveling safety, and temperature monitoring.',
    JSON.stringify({ pass_percentage: 75 })
  ).lastInsertRowid;

  const printerMembershipReqId = insertReq.run(
    printer3DId,
    'membership',
    'Verified Student Status',
    'Active student enrolled in current academic term.',
    JSON.stringify({ required_role: 'student' })
  ).lastInsertRowid;

  // DSLR Camera Requirements:
  const dslrCertReqId = insertReq.run(
    dslrId,
    'certificate',
    'Basic Photography Equipment Training Certificate',
    'Upload your workshop completion certificate from the Media Department.',
    '{}'
  ).lastInsertRowid;

  const dslrMembershipReqId = insertReq.run(
    dslrId,
    'membership',
    'Verified Project Purpose Required',
    'For enrolled students working on documented academic or portfolio work.',
    JSON.stringify({ required_role: 'student' })
  ).lastInsertRowid;

  // VR Headset Requirement:
  const vrQuizReqId = insertReq.run(
    vrHeadsetId,
    'quiz',
    'VR Hardware Handling & Care Quiz',
    'Lens protection, tether safety, and controller battery management.',
    JSON.stringify({ pass_percentage: 80 })
  ).lastInsertRowid;

  // Soldering Station Requirement:
  const solderCertReqId = insertReq.run(
    solderingId,
    'certificate',
    'Soldering Safety Certification',
    'Safety verification certificate issued by the Electronics Workshop.',
    '{}'
  ).lastInsertRowid;

  // 4. Create Quiz Questions for Quizzes
  const insertQuiz = db.prepare('INSERT INTO quizzes (resource_id, requirement_id, title, pass_percentage) VALUES (?, ?, ?, ?)');
  const insertQ = db.prepare('INSERT INTO quiz_questions (quiz_id, question, options, correct_option_index, explanation) VALUES (?, ?, ?, ?, ?)');

  // Laser Cutter Safety Quiz
  const laserQuizId = insertQuiz.run(laserCutterId, laserQuizReqId, 'Laser Cutter Safety & Fire Protocol Quiz', 80).lastInsertRowid;

  insertQ.run(
    laserQuizId,
    'Which of the following materials is STRICTLY FORBIDDEN in the laser cutter due to toxic chlorine gas?',
    JSON.stringify(['Cast Acrylic (PMMA)', 'Plywood / MDF', 'Polyvinyl Chloride (PVC / Vinyl)', 'Cotton / Denim']),
    2,
    'PVC and vinyl release hydrochloric acid gas when laser-cut, which damages the optics and lungs.'
  );

  insertQ.run(
    laserQuizId,
    'What should you do immediately if you observe a persistent open flame inside the cutting chamber?',
    JSON.stringify([
      'Open the lid immediately to blow on the flame',
      'Press the Emergency Stop button and alert the lab supervisor',
      'Increase the exhaust speed and wait for it to burn out',
      'Take a picture for the project report'
    ]),
    1,
    'Opening the lid feeds oxygen into the fire. Press the Emergency Stop and notify the supervisor immediately.'
  );

  insertQ.run(
    laserQuizId,
    'Can you leave the laser cutter unattended while a 20-minute cut job is executing?',
    JSON.stringify([
      'Yes, if you stay within earshot in the hallway',
      'Yes, if the air assist is on',
      'No, you must maintain visual monitoring of the cut at all times',
      'Yes, as long as the supervisor is in the building'
    ]),
    2,
    'Laser cutters present rapid fire risks; continuous visual monitoring is mandatory for the entire run.'
  );

  insertQ.run(
    laserQuizId,
    'Before starting a job, which system MUST be verified as powered ON and flowing?',
    JSON.stringify([
      'The fume extraction exhaust and compressed air assist',
      'The laboratory radio',
      'The overhead floodlights',
      'The 3D printer bed heater'
    ]),
    0,
    'Exhaust evacuates fumes and air assist prevents flare-ups at the laser focal point.'
  );

  // 3D Printing Fundamentals Quiz
  const printerQuizId = insertQuiz.run(printer3DId, printerQuizReqId, '3D Printing Fundamentals Quiz', 75).lastInsertRowid;

  insertQ.run(
    printerQuizId,
    'What is the standard nozzle and bed temperature for PLA filament?',
    JSON.stringify(['200-215°C nozzle, 50-60°C bed', '260-280°C nozzle, 110°C bed', '150°C nozzle, 20°C bed', '300°C nozzle, 100°C bed']),
    0,
    'Standard PLA prints smoothly between 200°C and 215°C with a heated bed around 55-60°C.'
  );

  insertQ.run(
    printerQuizId,
    'Why is it critical to check the first layer during the first 3 minutes of printing?',
    JSON.stringify([
      'To check the color',
      'To verify bed adhesion and avoid spaghetti failure / nozzle blobs',
      'To measure room temperature',
      'To pause and take photos'
    ]),
    1,
    '90% of print failures happen due to poor first layer adhesion.'
  );

  // 5. Pre-Built Demo Scenario 1:
  // Student 1 (Keerat Gujral) is missing EXACTLY ONE requirement for the Laser Cutter:
  // Keerat has completed the Supervised Session (past booking) and has the Sign-off,
  // but has NOT YET taken the Laser Safety Quiz!
  // When Keerat opens Laser Cutter detail, the live checklist shows:
  // - Laser Safety Quiz: MISSING (Red) -> Take Quiz button!
  // - 1 Supervised Session: MET (Green)
  // - Lab Director Sign-off: MET (Green)

  // Give Keerat the signoff:
  db.prepare(`
    INSERT INTO signoffs (user_id, requirement_id, resource_id, requested_at, status, approved_by, approved_at, notes)
    VALUES (?, ?, ?, datetime('now', '-5 days'), 'approved', ?, datetime('now', '-4 days'), 'Passed in-person briefing.')
  `).run(student1Id, laserSignoffReqId, laserCutterId, owner1Id);

  // Give Keerat a completed past booking to fulfill the 1 supervised session requirement:
  const pastSessionBookingId = db.prepare(`
    INSERT INTO bookings (
      resource_id, user_id, start_time, end_time, purpose, project_category,
      status, score, decision_reason, checked_in_at, returned_at
    ) VALUES (
      ?, ?, datetime('now', '-7 days'), datetime('now', '-7 days', '+2 hours'),
      'Supervised introductory session on plywood cutting', 'academic_project',
      'completed', 35.0, 'Completed with manager supervision', datetime('now', '-7 days'), datetime('now', '-7 days', '+2 hours')
    )
  `).run(laserCutterId, student1Id).lastInsertRowid;

  // Give Keerat passport badge for 3D printer:
  db.prepare(`
    INSERT INTO passports (user_id, badge_key, title, description)
    VALUES (?, ?, ?, ?)
  `).run(student1Id, `req_${printerQuizReqId}`, '3D Printing Fundamentals', 'Passed certification exam with 100% score.');

  db.prepare(`
    INSERT INTO quiz_attempts (user_id, quiz_id, score, passed, answers, attempted_at)
    VALUES (?, ?, 100, 1, '{"1":0,"2":1}', datetime('now', '-10 days'))
  `).run(student1Id, printerQuizId);

  // 6. Pre-Built Demo Scenario 2: Fair-Share Overlapping Competition
  // Tomorrow at 14:00 - 16:00:
  // Student 1 (Keerat Gujral) and Student 2 (Rohan Mehta) are competing for the 3D Printer slot!
  // Rohan Mehta used 14 hours in the last 30 days and waited 3 days.
  // Keerat Gujral used 2 hours and waited 1 day.
  // We record past usage for Rohan to give him 14 hours used:
  db.prepare(`
    INSERT INTO bookings (
      resource_id, user_id, start_time, end_time, purpose, project_category,
      status, score, checked_in_at, returned_at
    ) VALUES 
      (?, ?, datetime('now', '-15 days'), datetime('now', '-15 days', '+8 hours'), 'Chassis structural iteration 1', 'research', 'completed', 20.0, datetime('now', '-15 days'), datetime('now', '-15 days', '+8 hours')),
      (?, ?, datetime('now', '-8 days'), datetime('now', '-8 days', '+6 hours'), 'Chassis structural iteration 2', 'research', 'completed', 20.0, datetime('now', '-8 days'), datetime('now', '-8 days', '+6 hours'))
  `).run(printer3DId, student2Id, printer3DId, student2Id);

  // Rohan also took the 3D printer quiz
  db.prepare(`
    INSERT INTO quiz_attempts (user_id, quiz_id, score, passed, answers, attempted_at)
    VALUES (?, ?, 85, 1, '{"1":0,"2":1}', datetime('now', '-12 days'))
  `).run(student2Id, printerQuizId);

  db.prepare(`
    INSERT INTO passports (user_id, badge_key, title, description)
    VALUES (?, ?, ?, ?)
  `).run(student2Id, `req_${printerQuizReqId}`, '3D Printing Fundamentals', 'Passed certification exam.');

  // Conflicting booking requests for tomorrow:
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const slotStart = `${tomorrowStr}T14:00:00`;
  const slotEnd = `${tomorrowStr}T16:00:00`;

  // Keerat's request (Academic project bonus: +30, 2 hrs used: -4, wait 1 day: +10 -> Score ~36)
  const keeratBookingId = db.prepare(`
    INSERT INTO bookings (
      resource_id, user_id, start_time, end_time, purpose, project_category,
      status, waitlist_position, score, score_breakdown, decision_reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 1, 36.0, ?, ?, datetime('now', '-1 day'))
  `).run(
    printer3DId,
    student1Id,
    slotStart,
    slotEnd,
    'Senior Capstone Project - Robotic gripper prototype fabrication',
    'academic_project',
    JSON.stringify({
      formula: 'score = (waiting_days × 10) - (hours_used_30d × 2) + category_bonus',
      waiting_days: 1.0,
      w_wait: 10.0,
      wait_contribution: 10.0,
      hours_used_last_30_days: 2.0,
      w_usage: 2.0,
      usage_penalty: 4.0,
      project_category: 'academic_project',
      category_bonus: 30.0,
      final_score: 36.0
    }),
    'Ranked #1 (Recommended for Approval): Fair-share score 36.0. Priority breakdown: 2.0 hrs used this month, 1.0 days waited, +30 Academic Project bonus.'
  ).lastInsertRowid;

  // Rohan's request (Research bonus: +20, 14 hrs used: -28, wait 3 days: +30 -> Score ~22)
  const rohanBookingId = db.prepare(`
    INSERT INTO bookings (
      resource_id, user_id, start_time, end_time, purpose, project_category,
      status, waitlist_position, score, score_breakdown, decision_reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'waitlisted', 2, 22.0, ?, ?, datetime('now', '-3 days'))
  `).run(
    printer3DId,
    student2Id,
    slotStart,
    slotEnd,
    'Aerospace Research Lab - Drone airfoil test prints',
    'research',
    JSON.stringify({
      formula: 'score = (waiting_days × 10) - (hours_used_30d × 2) + category_bonus',
      waiting_days: 3.0,
      w_wait: 10.0,
      wait_contribution: 30.0,
      hours_used_last_30_days: 14.0,
      w_usage: 2.0,
      usage_penalty: 28.0,
      project_category: 'research',
      category_bonus: 20.0,
      final_score: 22.0
    }),
    'Placed #2 in queue (score 22.0): you used 14.0 hrs this month; applicant ahead (Keerat Gujral) has score 36.0 with higher academic project priority.'
  ).lastInsertRowid;

  logAudit({
    actor_id: student1Id,
    actor_name: 'Keerat Gujral',
    actor_role: 'user',
    action: 'BOOKING_REQUESTED',
    entity_type: 'booking',
    entity_id: keeratBookingId,
    payload: { resource_id: printer3DId, slotStart, slotEnd, score: 36.0, rank: 1 }
  });

  logAudit({
    actor_id: student2Id,
    actor_name: 'Rohan Mehta',
    actor_role: 'user',
    action: 'BOOKING_REQUESTED',
    entity_type: 'booking',
    entity_id: rohanBookingId,
    payload: { resource_id: printer3DId, slotStart, slotEnd, score: 22.0, rank: 2 }
  });

  // 7. Pre-Built Demo Scenario 3: Completed booking with Before/After condition diff (scratch on DSLR)
  // Student 3 (Simran Kaur) borrowed the DSLR Camera yesterday
  // Checkin condition had no scratches; return condition had a scratch on the lens body!
  const dslrBookingId = db.prepare(`
    INSERT INTO bookings (
      resource_id, user_id, start_time, end_time, purpose, project_category,
      status, score, checked_in_at, returned_at, created_at
    ) VALUES (
      ?, ?, datetime('now', '-2 days'), datetime('now', '-1 day'),
      'Graduation ceremony photography assignment', 'academic_project',
      'returned', 30.0, datetime('now', '-2 days'), datetime('now', '-1 day'), datetime('now', '-3 days')
    )
  `).run(dslrId, student3Id).lastInsertRowid;

  // Check-in report (clean condition)
  db.prepare(`
    INSERT INTO condition_reports (booking_id, type, user_id, is_working, has_scratches, missing_parts, cleanliness, notes, photos, created_at)
    VALUES (?, 'checkin', ?, 1, 0, 0, 5, 'Camera body, lens elements, and battery in pristine condition.', ?, datetime('now', '-2 days'))
  `).run(
    dslrBookingId,
    student3Id,
    JSON.stringify([
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=400&q=80'
    ])
  );

  // Return report (scratch detected on outer barrel)
  db.prepare(`
    INSERT INTO condition_reports (booking_id, type, user_id, is_working, has_scratches, missing_parts, cleanliness, notes, photos, created_at)
    VALUES (?, 'return', ?, 1, 1, 0, 4, 'Equipment fully functional, but noticed a superficial scratch on the zoom ring collar during evening packdown.', ?, datetime('now', '-1 day'))
  `).run(
    dslrBookingId,
    student3Id,
    JSON.stringify([
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=400&q=80'
    ])
  );

  // Incident record with AI summary
  const dslrIncidentId = db.prepare(`
    INSERT INTO incidents (
      booking_id, resource_id, reported_by, title, description,
      severity, status, ai_summary, ai_suggested_severity, resolution_notes, resolved_by, resolved_at, photos, created_at
    ) VALUES (
      ?, ?, ?, 'Surface Scratch on DSLR Zoom Ring',
      'Return inspection diff flagged new cosmetic scratch on 24-70mm lens body.',
      'medium', 'resolved',
      'AI Analysis: Visual diff flagged cosmetic abrasion on outer lens barrel. Optical elements and autofocus motors tested fully functional. Suggested severity: Medium (non-critical).',
      'medium',
      'Inspected by Prof. Sarah Jenkins: Cosmetic wear verified, optical glass clean and collimated. No repair charge assessed; logged to equipment maintenance record.',
      ?, datetime('now', '-18 hours'),
      ?, datetime('now', '-1 day')
    )
  `).run(
    dslrBookingId,
    dslrId,
    student3Id,
    owner2Id,
    JSON.stringify([
      'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=400&q=80'
    ])
  ).lastInsertRowid;

  logAudit({
    actor_id: student3Id,
    actor_name: 'Simran Kaur',
    actor_role: 'user',
    action: 'CHECKIN_COMPLETED',
    entity_type: 'booking',
    entity_id: dslrBookingId,
    payload: { is_working: 1, has_scratches: 0, missing_parts: 0, cleanliness: 5 }
  });

  logAudit({
    actor_id: student3Id,
    actor_name: 'Simran Kaur',
    actor_role: 'user',
    action: 'RETURN_COMPLETED',
    entity_type: 'booking',
    entity_id: dslrBookingId,
    payload: { is_working: 1, has_scratches: 1, missing_parts: 0, cleanliness: 4, diff_flagged: true }
  });

  logAudit({
    actor_id: owner2Id,
    actor_name: 'Prof. Sarah Jenkins',
    actor_role: 'owner',
    action: 'INCIDENT_RESOLVED',
    entity_type: 'incident',
    entity_id: dslrIncidentId,
    payload: { resolution_notes: 'Cosmetic wear verified, no repair charge assessed.' }
  });

  // 8. Pre-Built Demo Scenario 4: Overdue Booking
  // Oscilloscope was checked out yesterday morning and was supposed to be returned 4 hours ago:
  const overdueBookingId = db.prepare(`
    INSERT INTO bookings (
      resource_id, user_id, start_time, end_time, purpose, project_category,
      status, checked_in_at, created_at
    ) VALUES (
      ?, ?, datetime('now', '-18 hours'), datetime('now', '-4 hours'),
      'Audio amplifier frequency response analysis', 'academic_project',
      'overdue', datetime('now', '-18 hours'), datetime('now', '-24 hours')
    )
  `).run(oscilloscopeId, student2Id).lastInsertRowid;

  db.prepare(`
    INSERT INTO condition_reports (booking_id, type, user_id, is_working, has_scratches, missing_parts, cleanliness, notes, photos, created_at)
    VALUES (?, 'checkin', ?, 1, 0, 0, 5, 'Probes and power supply tested operational', ?, datetime('now', '-18 hours'))
  `).run(overdueBookingId, student2Id, JSON.stringify(['https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&q=80']));

  logAudit({
    actor_id: student2Id,
    actor_name: 'Rohan Mehta',
    actor_role: 'user',
    action: 'BOOKING_OVERDUE_FLAGGED',
    entity_type: 'booking',
    entity_id: overdueBookingId,
    payload: { elapsed_hours: 4, resource_name: 'Digital Oscilloscope' }
  });

  // 9. Initial In-App Notifications
  const insertNotif = db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)');

  insertNotif.run(
    student1Id,
    'Welcome to ShareSpace! 🎓',
    'Your campus account is active. Check your Eligibility Passport to start booking lab equipment.',
    'info',
    '/passport'
  );

  insertNotif.run(
    student1Id,
    'Laser Cutter Pre-Requisites ℹ️',
    'You are 1 requirement away from full Laser Cutter certification. Complete the safety quiz to unlock bookings.',
    'warning',
    `/resources/${laserCutterId}`
  );

  insertNotif.run(
    student2Id,
    '⚠️ Overdue Equipment Alert',
    'Your reservation for Digital Oscilloscope ended 4 hours ago. Please check in and return the item immediately.',
    'danger',
    `/bookings/${overdueBookingId}`
  );

  insertNotif.run(
    owner1Id,
    'New Competing Booking Requests',
    `2 students are competing for the 3D Printer tomorrow. Check the ranked recommendation queue.`,
    'info',
    '/owner/requests'
  );

  console.log('✅ Demo database seeded successfully with all 5 core scenarios.');
}

// Direct execution support
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase(true).then(() => {
    console.log('Seed finished.');
    process.exit(0);
  });
}
