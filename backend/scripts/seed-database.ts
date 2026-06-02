import path from 'path';
import sqlite3 from 'sqlite3';
import { faker } from '@faker-js/faker';

const dbPath = path.resolve(__dirname, '../data/database.sqlite');
const sqlite = sqlite3.verbose();

function openDatabase(filePath: string): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite.Database(filePath, sqlite3.OPEN_READWRITE, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function runQuery(db: sqlite3.Database, sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

const SERVICES = [
  'Corte de Pelo',
  'Manicura & Pedicura',
  'Masaje Terapéutico',
  'Consulta de Nutrición',
  'Sesión de Fisioterapia',
  'Asesoría Financiera',
  'Clase Particular',
  'Sesión Fotográfica',
  'Reparación de Ordenador',
  'Limpieza Profesional',
  'Tratamiento Facial',
  'Entrenamiento Personalizado',
];

const PAYMENT_METHODS = ['Efectivo', 'Tarjeta de Crédito', 'Transferencia Bancaria', 'Bizum'];

async function main() {
  console.log('Abriendo conexión con la base de datos...');
  const db = await openDatabase(dbPath);

  try {
    // Desactivar temporalmente claves foráneas para la limpieza y el sembrado masivo
    console.log('Desactivando claves foráneas...');
    await runQuery(db, 'PRAGMA foreign_keys = OFF;');

    console.log('Limpiando tablas de la base de datos...');
    await runQuery(db, 'DELETE FROM "payment";');
    await runQuery(db, 'DELETE FROM "appointment";');
    await runQuery(db, 'DELETE FROM "customer";');
    await runQuery(db, 'DELETE FROM "user";');
    await runQuery(db, 'DELETE FROM "business";');
    await runQuery(db, 'DELETE FROM sqlite_sequence;');

    console.log('Iniciando transacción de sembrado...');
    await runQuery(db, 'BEGIN TRANSACTION;');

    // 1. Insertar usuario administrador Carlos García
    console.log('Insertando usuario administrador...');
    const adminUserSql = `
      INSERT INTO "user" (id, name, lastName, birthDate, email, password, business, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    await runQuery(db, adminUserSql, [
      1,
      'Carlos',
      'García',
      '1990-05-15',
      'carlos@admin.com',
      'contraseña123',
      'admin',
      '2026-05-14 08:13:28',
    ]);

    let currentCustomerId = 1;
    let currentAppointmentId = 1;
    let currentPaymentId = 1;

    console.log('Generando 50 usuarios con 100 clientes, reservas y cobros cada uno...');

    // SQL Statements
    const userSql = `
      INSERT INTO "user" (id, name, lastName, birthDate, email, password, business, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const businessSql = `
      INSERT INTO "business" (businessID, name, email)
      VALUES (?, ?, ?);
    `;
    const customerSql = `
      INSERT INTO "customer" (id, name, phone, email, business, businessId)
      VALUES (?, ?, ?, ?, ?, ?);
    `;
    const appointmentSql = `
      INSERT INTO "appointment" (id, date, time, status, customerId, businessId, serviceName, customerName, businessName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const paymentSql = `
      INSERT INTO "payment" (id, amount, date, paymentMethod, appointmentId, customerId, businessId, status, notes, customerName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    for (let u = 1; u <= 50; u++) {
      const userId = u + 1; // ID 1 reservado para el admin
      const businessId = u;

      // Generar datos de usuario regular
      const userFirstName = faker.person.firstName();
      const userLastName = faker.person.lastName();
      const userEmail = faker.internet.email({ firstName: userFirstName, lastName: userLastName }).toLowerCase();
      // Asegurar que no contenga @admin por restricciones de negocio
      const safeUserEmail = userEmail.includes('@admin') ? userEmail.replace('@admin', '@company') : userEmail;
      
      const userPassword = faker.internet.password({ length: 8 });
      
      // Asegurar que no contenga 'admin' por restricciones de negocio
      let businessName = `${faker.company.name()} S.L.`;
      if (businessName.toLowerCase().includes('admin')) {
        businessName = businessName.replace(/admin/gi, 'Direct');
      }

      const userBirthDate = faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0];
      const userCreatedAt = faker.date.past({ years: 1 }).toISOString().replace('T', ' ').substring(0, 19);

      // Insertar usuario
      await runQuery(db, userSql, [userId, userFirstName, userLastName, userBirthDate, safeUserEmail, userPassword, businessName, userCreatedAt]);

      // Insertar negocio
      await runQuery(db, businessSql, [businessId, businessName, safeUserEmail]);

      // Guardar lista de clientes para este negocio para asociar con las reservas
      const customersForThisUser: Array<{ id: number; name: string }> = [];

      // Generar 100 clientes
      for (let c = 0; c < 100; c++) {
        const customerId = currentCustomerId++;
        const customerFirstName = faker.person.firstName();
        const customerLastName = faker.person.lastName();
        const customerFullName = `${customerFirstName} ${customerLastName}`;
        const customerPhone = faker.phone.number({ style: 'international' });
        const customerEmail = faker.internet.email({ firstName: customerFirstName, lastName: customerLastName }).toLowerCase();

        await runQuery(db, customerSql, [customerId, customerFullName, customerPhone, customerEmail, businessName, businessId]);

        customersForThisUser.push({ id: customerId, name: customerFullName });
      }

      // Generar 100 reservas y 100 cobros asociados
      for (let a = 0; a < 100; a++) {
        const appointmentId = currentAppointmentId++;
        const selectedCustomer = customersForThisUser[a]; // Relación biunívoca limpia
        
        const appointmentDate = faker.date.between({
          from: '2026-01-01',
          to: '2026-12-31'
        }).toISOString().split('T')[0];

        const hour = faker.number.int({ min: 8, max: 19 }).toString().padStart(2, '0');
        const minute = faker.helpers.arrayElement(['00', '15', '30', '45']);
        const appointmentTime = `${hour}:${minute}`;

        const rand = Math.random();
        const appointmentStatus = rand < 0.6 ? 'confirmed' : rand < 0.9 ? 'paid' : 'pending';
        const serviceName = faker.helpers.arrayElement(SERVICES);

        // Insertar reserva
        await runQuery(db, appointmentSql, [
          appointmentId,
          appointmentDate,
          appointmentTime,
          appointmentStatus,
          selectedCustomer.id,
          businessId,
          serviceName,
          selectedCustomer.name,
          businessName
        ]);

        // Generar 1 cobro asociado a esta reserva
        const paymentId = currentPaymentId++;
        const paymentAmount = parseFloat(faker.commerce.price({ min: 15, max: 180, dec: 2 }));
        const paymentDate = appointmentDate;
        const paymentMethod = faker.helpers.arrayElement(PAYMENT_METHODS);

        const prand = Math.random();
        const paymentStatus = prand < 0.8 ? 'completed' : prand < 0.9 ? 'pending' : prand < 0.95 ? 'cancelled' : 'refunded';
        const notes = faker.helpers.arrayElement([
          'Pago recibido correctamente',
          'Pago anticipado parcial',
          'Facturado a fin de mes',
          null,
          'Cobro en efectivo',
          'Pago Bizum verificado',
        ]);

        // Insertar cobro
        await runQuery(db, paymentSql, [
          paymentId,
          paymentAmount,
          paymentDate,
          paymentMethod,
          appointmentId,
          selectedCustomer.id,
          businessId,
          paymentStatus,
          notes,
          selectedCustomer.name
        ]);
      }
    }

    // Confirmar transacción
    console.log('Confirmando transacción en la base de datos...');
    await runQuery(db, 'COMMIT;');
    console.log('Sembrado de datos finalizado con éxito.');

  } catch (error) {
    console.error('Error durante el sembrado de datos:', error);
    console.log('Revirtiendo transacción...');
    try {
      await runQuery(db, 'ROLLBACK;');
    } catch (rbError) {
      console.error('Error al revertir la transacción:', rbError);
    }
    process.exit(1);
  } finally {
    // Reactivar claves foráneas
    console.log('Reactivando claves foráneas...');
    await runQuery(db, 'PRAGMA foreign_keys = ON;').catch((err) => {
      console.error('Error al reactivar claves foráneas:', err);
    });
    db.close();
    console.log('Conexión con la base de datos cerrada.');
  }
}

main();
