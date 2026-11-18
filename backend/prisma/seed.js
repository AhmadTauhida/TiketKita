import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({ quiet: true });

const DAY_MS = 24 * 60 * 60 * 1000;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

function describeDatabase(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname}`;
  } catch {
    return '(tidak dapat dibaca)';
  }
}

function requireConfirmation() {
  if (process.env.SEED_CONFIRM === 'yes') {
    return;
  }

  console.warn('');
  console.warn('PERINGATAN: seed akan MENGHAPUS SELURUH DATA pada tabel aplikasi.');
  console.warn(`Database tujuan: ${connectionString ? describeDatabase(connectionString) : '(belum diatur)'}`);
  console.warn('Jalankan ulang dengan SEED_CONFIRM=yes untuk melanjutkan.');
  console.warn('');
  process.exit(1);
}

function wibDate(daysFromNow, hour) {
  const target = new Date(Date.now() + daysFromNow * DAY_MS + WIB_OFFSET_MS);
  const year = target.getUTCFullYear();
  const month = String(target.getUTCMonth() + 1).padStart(2, '0');
  const day = String(target.getUTCDate()).padStart(2, '0');
  const time = String(hour).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T${time}:00:00+07:00`);
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

const categories = [
  { name: 'Seminar', icon: 'school', description: 'Seminar dan konferensi' },
  { name: 'Musik', icon: 'music_note', description: 'Konser dan pertunjukan musik' },
  { name: 'Workshop', icon: 'build', description: 'Workshop dan pelatihan' },
  { name: 'Kompetisi', icon: 'emoji_events', description: 'Kompetisi dan perlombaan' },
  { name: 'Festival', icon: 'festival', description: 'Festival dan pameran' },
];

const events = [
  {
    title: 'Seminar Nasional Teknologi AI 2026',
    category: 'Seminar',
    status: 'UPCOMING',
    daysFromNow: 10,
    startHour: 9,
    durationHours: 6,
    organizer: 'Himpunan Informatika Nusantara',
    location: 'Auditorium Utama',
    address: 'Jl. Merdeka No. 10, Jakarta Pusat',
    description:
      'Seminar tahunan yang membahas perkembangan terkini kecerdasan buatan dan dampaknya bagi industri di Indonesia. Menghadirkan praktisi dan akademisi untuk berbagi wawasan serta studi kasus nyata.',
    slug: 'seminar-ai-2026',
    ticketTypes: [
      { name: 'Regular', price: 50000, quota: 200 },
      { name: 'VIP', price: 150000, quota: 50 },
    ],
  },
  {
    title: 'Seminar Karier Fresh Graduate',
    category: 'Seminar',
    status: 'UPCOMING',
    daysFromNow: 5,
    startHour: 10,
    durationHours: 3,
    organizer: 'Career Center Universitas Nusantara',
    location: 'Gedung Serbaguna',
    address: 'Jl. Pendidikan No. 25, Bandung',
    description:
      'Membantu lulusan baru memahami strategi mencari kerja dan membangun karier di era digital. Dilengkapi sesi tanya jawab bersama perekrut dan alumni.',
    slug: 'seminar-karier-fresh-graduate',
    ticketTypes: [{ name: 'Reguler', price: 0, quota: 300 }],
  },
  {
    title: 'Konferensi Startup Nusantara',
    category: 'Seminar',
    status: 'UPCOMING',
    daysFromNow: 21,
    startHour: 9,
    durationHours: 6,
    organizer: 'Komunitas Startup Indonesia',
    location: 'Convention Hall',
    address: 'Jl. Sudirman Kav. 5, Jakarta Selatan',
    description:
      'Konferensi yang mempertemukan pendiri startup, investor, dan talenta digital dari seluruh Indonesia. Membahas tren bisnis, pendanaan, dan pengembangan produk.',
    slug: 'konferensi-startup-nusantara',
    ticketTypes: [
      { name: 'Early Bird', price: 100000, quota: 100 },
      { name: 'Regular', price: 175000, quota: 300 },
      { name: 'VIP', price: 400000, quota: 50 },
    ],
  },
  {
    title: 'Konser Akustik Senja',
    category: 'Musik',
    status: 'UPCOMING',
    daysFromNow: 14,
    startHour: 17,
    durationHours: 3,
    organizer: 'Senja Musik Production',
    location: 'Amphitheater Kota',
    address: 'Jl. Taman Sari No. 8, Yogyakarta',
    description:
      'Konser akustik intim yang menampilkan musisi lokal dengan suasana senja yang hangat. Cocok dinikmati bersama teman dan keluarga.',
    slug: 'konser-akustik-senja',
    ticketTypes: [
      { name: 'Regular', price: 120000, quota: 500 },
      { name: 'VIP', price: 300000, quota: 100 },
    ],
  },
  {
    title: 'Festival Musik Kampus',
    category: 'Musik',
    status: 'UPCOMING',
    daysFromNow: 30,
    startHour: 15,
    durationHours: 6,
    organizer: 'Badan Eksekutif Mahasiswa',
    location: 'Lapangan Utama Kampus',
    address: 'Jl. Kampus Raya No. 1, Surabaya',
    description:
      'Festival musik tahunan yang menghadirkan band mahasiswa dan musisi tamu. Menjadi ajang kreativitas dan kebersamaan seluruh civitas akademika.',
    slug: 'festival-musik-kampus',
    ticketTypes: [
      { name: 'Regular', price: 85000, quota: 1000 },
      { name: 'VIP', price: 250000, quota: 200 },
    ],
  },
  {
    title: 'Malam Jazz di Taman Kota',
    category: 'Musik',
    status: 'UPCOMING',
    daysFromNow: 8,
    startHour: 19,
    durationHours: 2,
    organizer: 'Jazz Community Bandung',
    location: 'Taman Kota',
    address: 'Jl. Asia Afrika No. 12, Bandung',
    description:
      'Pertunjukan jazz terbuka dengan nuansa taman kota yang santai. Menampilkan trio jazz dan penyanyi tamu.',
    slug: 'malam-jazz-taman-kota',
    ticketTypes: [
      { name: 'Regular', price: 150000, quota: 150, availableStock: 3 },
      { name: 'VIP', price: 350000, quota: 40 },
    ],
  },
  {
    title: 'Workshop Flutter untuk Pemula',
    category: 'Workshop',
    status: 'UPCOMING',
    daysFromNow: 3,
    startHour: 9,
    durationHours: 4,
    organizer: 'Flutter Developer Community',
    location: 'Coworking Space Downtown',
    address: 'Jl. Gatot Subroto No. 40, Jakarta Selatan',
    description:
      'Workshop praktik membangun aplikasi mobile pertama dengan Flutter. Peserta dibimbing membuat aplikasi sederhana dari nol.',
    slug: 'workshop-flutter-pemula',
    ticketTypes: [
      { name: 'Early Bird', price: 50000, quota: 20, availableStock: 0 },
      { name: 'Regular', price: 75000, quota: 40 },
    ],
  },
  {
    title: 'Workshop UI/UX Design Sprint',
    category: 'Workshop',
    status: 'UPCOMING',
    daysFromNow: 12,
    startHour: 13,
    durationHours: 4,
    organizer: 'Designers Guild Indonesia',
    location: 'Studio Kreatif',
    address: 'Jl. Kemang Raya No. 18, Jakarta Selatan',
    description:
      'Sprint desain intensif untuk memecahkan masalah pengguna dalam satu hari. Membahas riset singkat, wireframe, dan prototipe.',
    slug: 'workshop-uiux-design-sprint',
    ticketTypes: [{ name: 'Regular', price: 100000, quota: 30 }],
  },
  {
    title: 'Lomba Hackathon Mahasiswa',
    category: 'Kompetisi',
    status: 'UPCOMING',
    daysFromNow: 18,
    startHour: 9,
    durationHours: 6,
    organizer: 'Asosiasi Mahasiswa Teknologi',
    location: 'Gedung Inovasi',
    address: 'Jl. Teknologi No. 7, Bogor',
    description:
      'Kompetisi membangun solusi digital dalam waktu terbatas bersama tim. Karya terbaik akan dinilai oleh juri industri.',
    slug: 'lomba-hackathon-mahasiswa',
    ticketTypes: [{ name: 'Regular', price: 25000, quota: 100 }],
  },
  {
    title: 'Kompetisi Esai Nasional',
    category: 'Kompetisi',
    status: 'UPCOMING',
    daysFromNow: 25,
    startHour: 10,
    durationHours: 3,
    organizer: 'Forum Literasi Nasional',
    location: 'Aula Perpustakaan',
    address: 'Jl. Literasi No. 3, Malang',
    description:
      'Kompetisi menulis esai untuk pelajar dan mahasiswa se-Indonesia. Mengangkat tema pendidikan dan perubahan sosial.',
    slug: 'kompetisi-esai-nasional',
    ticketTypes: [{ name: 'Regular', price: 30000, quota: 200 }],
  },
  {
    title: 'Festival Kuliner Nusantara',
    category: 'Festival',
    status: 'UPCOMING',
    daysFromNow: 16,
    startHour: 11,
    durationHours: 6,
    organizer: 'Sajian Nusantara',
    location: 'Alun-Alun Kota',
    address: 'Jl. Pahlawan No. 1, Semarang',
    description:
      'Festival yang menyajikan beragam kuliner khas dari berbagai daerah. Pengunjung dapat mencicipi hidangan sekaligus menikmati pertunjukan budaya.',
    slug: 'festival-kuliner-nusantara',
    ticketTypes: [
      { name: 'Regular', price: 20000, quota: 2000 },
      { name: 'VIP', price: 75000, quota: 200 },
    ],
  },
  {
    title: 'Pameran Seni Rupa Kontemporer',
    category: 'Festival',
    status: 'UPCOMING',
    daysFromNow: 40,
    startHour: 10,
    durationHours: 5,
    organizer: 'Galeri Seni Kontemporer',
    location: 'Galeri Nasional',
    address: 'Jl. Seni No. 9, Yogyakarta',
    description:
      'Pameran karya seniman kontemporer dengan beragam medium dan gagasan. Menghadirkan kurator tamu serta diskusi terbuka.',
    slug: 'pameran-seni-rupa-kontemporer',
    ticketTypes: [{ name: 'Regular', price: 35000, quota: 300 }],
  },
  {
    title: 'Konser Rock Reuni Akbar',
    category: 'Musik',
    status: 'UPCOMING',
    daysFromNow: 7,
    startHour: 19,
    durationHours: 4,
    organizer: 'Rock Legends Indonesia',
    location: 'Stadion Internasional',
    address: 'Jl. Olahraga No. 2, Jakarta Barat',
    description:
      'Konser reuni besar yang menampilkan musisi rock legendaris Indonesia. Menjadi perayaan musik bagi penggemar lintas generasi.',
    slug: 'konser-rock-reuni-akbar',
    ticketTypes: [
      { name: 'Regular', price: 200000, quota: 100, availableStock: 0 },
      { name: 'VIP', price: 500000, quota: 20, availableStock: 0 },
    ],
  },
  {
    title: 'Seminar Kewirausahaan Mahasiswa',
    category: 'Seminar',
    status: 'CANCELLED',
    daysFromNow: 9,
    startHour: 13,
    durationHours: 3,
    organizer: 'Pusat Kewirausahaan Kampus',
    location: 'Aula Fakultas Ekonomi',
    address: 'Jl. Kampus No. 15, Depok',
    description:
      'Seminar tentang membangun usaha sejak masa kuliah. Acara dibatalkan karena perubahan jadwal narasumber.',
    slug: 'seminar-kewirausahaan-mahasiswa',
    ticketTypes: [{ name: 'Regular', price: 40000, quota: 100 }],
  },
  {
    title: 'Workshop Fotografi Dasar',
    category: 'Workshop',
    status: 'COMPLETED',
    daysFromNow: -14,
    startHour: 9,
    durationHours: 5,
    organizer: 'Klub Fotografi Nusantara',
    location: 'Ruang Pelatihan Seni',
    address: 'Jl. Budaya No. 6, Solo',
    description:
      'Pelatihan dasar teknik fotografi, komposisi, dan pengolahan foto. Acara telah selesai dilaksanakan.',
    slug: 'workshop-fotografi-dasar',
    ticketTypes: [{ name: 'Regular', price: 60000, quota: 30 }],
  },
];

const users = [
  {
    name: 'Demo User',
    email: 'demo@tiketkita.test',
    password: 'Demo1234',
    phone: '081234567890',
  },
  {
    name: 'Pengguna Kedua',
    email: 'user2@tiketkita.test',
    password: 'Demo1234',
    phone: '081298765432',
  },
];

async function main() {
  requireConfirmation();

  if (!connectionString) {
    console.error('DIRECT_URL atau DATABASE_URL belum diatur.');
    process.exit(1);
  }

  console.log(`Database tujuan: ${describeDatabase(connectionString)}`);
  console.log('Menghapus data lama dan mengisi seed baru...');

  const adapter = new PrismaPg(connectionString);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.ticket.deleteMany();
        await tx.payment.deleteMany();
        await tx.bookingDetail.deleteMany();
        await tx.booking.deleteMany();
        await tx.ticketType.deleteMany();
        await tx.event.deleteMany();
        await tx.category.deleteMany();
        await tx.user.deleteMany();

        const categoryIds = new Map();
        for (const category of categories) {
          const created = await tx.category.create({ data: category });
          categoryIds.set(created.name, created.id);
        }

        let ticketTypeCount = 0;
        for (const { ticketTypes, category, daysFromNow, startHour, durationHours, slug, ...event } of events) {
          const eventDate = wibDate(daysFromNow, startHour);
          ticketTypeCount += ticketTypes.length;

          await tx.event.create({
            data: {
              ...event,
              categoryId: categoryIds.get(category),
              eventDate,
              endDate: addHours(eventDate, durationHours),
              imageUrl: `https://picsum.photos/seed/${slug}/800/450`,
              ticketTypes: {
                create: ticketTypes.map(({ availableStock, ...type }) => ({
                  ...type,
                  availableStock: availableStock ?? type.quota,
                })),
              },
            },
          });
        }

        const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
        for (const user of users) {
          await tx.user.create({
            data: {
              name: user.name,
              email: user.email,
              phone: user.phone,
              password: await bcrypt.hash(user.password, rounds),
            },
          });
        }

        console.log(
          `Seed selesai: ${categories.length} kategori, ${events.length} acara, ${ticketTypeCount} jenis tiket, ${users.length} pengguna.`,
        );
      },
      { maxWait: 10000, timeout: 60000 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Seed gagal:', error.message);
  process.exit(1);
});
