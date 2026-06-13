const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Medical Categories
  const categories = [
    { name: 'Lab Report', slug: 'lab-report' },
    { name: 'Prescription', slug: 'prescription' },
    { name: 'Imaging Report', slug: 'imaging-report' },
    { name: 'Discharge Summary', slug: 'discharge-summary' },
    { name: 'Vaccination Certificate', slug: 'vaccine-certificate' }
  ];

  console.log('Seeding Medical Categories...');
  for (const cat of categories) {
    await prisma.medicalCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
  }

  // 2. Seed Permissions
  const permissions = [
    'READ_RECORDS',
    'WRITE_RECORDS',
    'DELETE_RECORDS',
    'MANAGE_ACCESS',
    'VIEW_AUDIT_LOGS',
    'MANAGE_DELEGATES',
    'ACCESS_EMERGENCY_DATA',
    'ADMIN_DASHBOARD'
  ];

  console.log('Seeding Permissions...');
  const permissionObjects = {};
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { name: perm },
      update: {},
      create: { name: perm }
    });
    permissionObjects[perm] = p;
  }

  // 3. Seed Roles
  const roles = [
    { name: 'PATIENT', perms: ['READ_RECORDS', 'WRITE_RECORDS', 'DELETE_RECORDS', 'MANAGE_ACCESS', 'MANAGE_DELEGATES'] },
    { name: 'DOCTOR', perms: ['READ_RECORDS', 'WRITE_RECORDS'] },
    { name: 'HOSPITAL', perms: ['READ_RECORDS', 'WRITE_RECORDS'] },
    { name: 'CAREGIVER', perms: ['READ_RECORDS'] },
    { name: 'ADMIN', perms: permissions } // Admin gets everything
  ];

  console.log('Seeding Roles and Mapping Permissions...');
  for (const r of roles) {
    const roleObj = await prisma.roleModel.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name }
    });

    // Link permissions
    for (const permName of r.perms) {
      const permObj = permissionObjects[permName];
      
      // Check if RolePermission already exists
      const existingLink = await prisma.rolePermission.findFirst({
        where: {
          roleId: roleObj.id,
          permissionId: permObj.id
        }
      });

      if (!existingLink) {
        await prisma.rolePermission.create({
          data: {
            roleId: roleObj.id,
            permissionId: permObj.id
          }
        });
      }
    }
  }

  // 4. Seed Default Admin User
  console.log('Seeding Default Admin User...');
  const adminEmail = 'admin@medihist.local';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: passwordHash,
        role: 'ADMIN'
      }
    });

    // Create Admin user-role relationship
    const adminRole = await prisma.roleModel.findUnique({ where: { name: 'ADMIN' } });
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });

    // Create encrypted Profile
    const { encrypt } = require('../src/services/cryptoService');
    await prisma.profile.create({
      data: {
        userId: adminUser.id,
        fullName: 'System Administrator',
        dob: encrypt('1980-01-01'),
        gender: encrypt('Other'),
        bloodGroup: encrypt('O+'),
        height: encrypt('175cm'),
        weight: encrypt('75kg'),
        emergencyContact: encrypt('+1555000999'),
        address: encrypt('MediHist Head Office'),
        insuranceInfo: encrypt('Corporate Admin Policy'),
        healthId: 'MH-ADMIN-0000'
      }
    });
    console.log(`✅ Seeding Admin User finished. Email: ${adminEmail}, Password: AdminPass123!`);
  } else {
    console.log('ℹ️ Admin user already exists. Skipping...');
  }

  console.log('🌱 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
