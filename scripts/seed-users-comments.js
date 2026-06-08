/**
 * Seed script: 10 fake users + reviews rải vào các locations có sẵn
 * Chạy: node scripts/seed-users-comments.js
 *
 * Logic:
 *   1. Upsert 10 fake users (role=user, password='123')
 *   2. Lấy tất cả locations từ DB
 *   3. Mỗi location → rải 2-4 reviews (rating + comment) từ user ngẫu nhiên
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/connectionDB');
const initModels = require('../src/models/init-models');

const { User, Review, Location } = initModels(sequelize);

// ── Fake users ───────────────────────────────────────────────────────────────

const FAKE_USERS = [
  { username: 'nguyen_minh_tuan',  email: 'minhtuan.nguyen88@gmail.com'  },
  { username: 'le_thi_hong_nhung', email: 'hongnhung.le2001@gmail.com'   },
  { username: 'pham_bao_long',     email: 'baolong.pham95@gmail.com'     },
  { username: 'tran_khanh_linh',   email: 'khanhlinh.tran99@gmail.com'   },
  { username: 'hoang_duc_thinh',   email: 'ducthinhhoang@gmail.com'      },
  { username: 'vo_thi_thu_ha',     email: 'thuha.vo2003@gmail.com'       },
  { username: 'nguyen_quoc_bao',   email: 'quocbao.ng97@gmail.com'       },
  { username: 'dang_thi_my_linh',  email: 'mylinh.dang2000@gmail.com'    },
  { username: 'bui_van_khoa',      email: 'vankhoa.bui92@gmail.com'      },
  { username: 'do_ngoc_anh',       email: 'ngocanh.do2002@gmail.com'     },
];

// ── Pool comment cho review (tiếng Việt tự nhiên) ───────────────────────────

// Comment theo từng mức rating để tự nhiên hơn
const COMMENTS_BY_RATING = {
  5: [
    'Tuyệt vời! Đây là một trong những địa điểm đẹp nhất mình từng ghé thăm. Cảnh quan, không khí và con người đều rất ấn tượng.',
    'Không có gì để chê cả! Nơi này xứng đáng 5 sao, mình chắc chắn sẽ quay lại.',
    'Trải nghiệm hoàn hảo từ đầu đến cuối. Nếu chưa đến đây thì bạn đang bỏ lỡ một điều tuyệt vời lắm đó.',
    'Đẹp hơn mình tưởng rất nhiều! Kiến trúc, không gian và lịch sử nơi đây thực sự đáng để khám phá.',
    'Mình đã đến nhiều địa điểm nhưng nơi này vẫn để lại ấn tượng sâu nhất. 5 sao xứng đáng!',
    'Một địa điểm mà mình sẽ giới thiệu cho tất cả bạn bè. Hoàn toàn xứng đáng với danh tiếng của nó.',
  ],
  4: [
    'Địa điểm rất đẹp và có chiều sâu văn hóa. Trừ một chút vấn đề về chỗ đỗ xe thì mọi thứ đều ổn.',
    'Trải nghiệm tốt, không khí yên tĩnh và thoáng mát. Sẽ ghé lại vào mùa khác để xem có gì khác biệt không.',
    'Khá hài lòng với chuyến thăm lần này. Nơi đây có nhiều điểm thú vị để khám phá, chỉ cần thêm biển chỉ dẫn là hoàn hảo.',
    'Đẹp và ý nghĩa, mình học được nhiều điều về lịch sử địa phương. Nên tổ chức thêm các hoạt động tương tác.',
    'Điểm đến xứng đáng với 4 sao. Nhân viên thân thiện, cảnh quan đẹp, chỉ cần cải thiện thêm vệ sinh khu vực.',
  ],
  3: [
    'Địa điểm ổn, không quá xuất sắc nhưng cũng đáng ghé thăm nếu bạn có dịp đi qua.',
    'Trải nghiệm bình thường, không có gì quá nổi bật nhưng cũng không đến nỗi tệ. Phù hợp cho chuyến đi gia đình.',
    'Tạm ổn, mình kỳ vọng nhiều hơn dựa trên những gì nghe nói nhưng thực tế thì chỉ ở mức trung bình.',
    'Cần cải thiện thêm về cơ sở hạ tầng và thông tin hướng dẫn, nhưng về tổng thể vẫn đáng để ghé thăm.',
  ],
  2: [
    'Thất vọng một chút so với kỳ vọng. Cơ sở vật chất xuống cấp, cần được đầu tư thêm.',
    'Nơi đây có tiềm năng nhưng hiện tại chưa được khai thác tốt. Hy vọng sẽ được cải thiện trong tương lai.',
    'Chưa hài lòng với dịch vụ. Giá vé khá cao so với những gì được trải nghiệm thực tế.',
  ],
  1: [
    'Rất thất vọng với chuyến thăm lần này. Địa điểm không được bảo dưỡng tốt và thiếu thông tin hướng dẫn.',
    'Không tương xứng với sự nổi tiếng. Quá đông người và thiếu tổ chức, mình sẽ không quay lại.',
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Trọng số rating: 5★ nhiều nhất, 1★ ít nhất (thực tế hơn)
 * Phân phối: 5→35%, 4→30%, 3→20%, 2→10%, 1→5%
 */
function randomRating() {
  const r = Math.random();
  if (r < 0.35) return 5;
  if (r < 0.65) return 4;
  if (r < 0.85) return 3;
  if (r < 0.95) return 2;
  return 1;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await sequelize.authenticate();
  console.log('✅ DB connected\n');

  // ── 1. Upsert 10 fake users ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('123', 10);
  console.log('👤 Upserting 10 fake users...');

  const seededUsers = [];
  for (const u of FAKE_USERS) {
    const existing = await User.findOne({ where: { email: u.email } });
    if (existing) {
      console.log(`  ⚠️  Skip (exists): ${u.email} (id=${existing.id})`);
      seededUsers.push(existing);
    } else {
      const user = await User.create({
        username: u.username,
        email: u.email,
        password_hash: passwordHash,
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
      });
      console.log(`  ✅ Created: ${u.username} (id=${user.id})`);
      seededUsers.push(user);
    }
  }

  // ── 2. Lấy tất cả locations ──────────────────────────────────────────────
  const locations = await Location.findAll({ attributes: ['id'] });
  if (locations.length === 0) {
    console.log('\n⚠️  Không có location nào trong DB. Thoát.');
    await sequelize.close();
    return;
  }
  console.log(`\n📍 Found ${locations.length} locations.`);
  console.log('\n💬 Seeding reviews...');

  // ── 3. Rải reviews vào mỗi location ─────────────────────────────────────
  let totalReviews = 0;

  for (const loc of locations) {
    const numReviews = randomBetween(2, 4);

    // Shuffle users để không trùng reviewer trong cùng 1 location
    const shuffled = [...seededUsers].sort(() => Math.random() - 0.5);
    const reviewers = shuffled.slice(0, numReviews);

    for (const reviewer of reviewers) {
      const rating = randomRating();
      const commentPool = COMMENTS_BY_RATING[rating];

      await Review.create({
        user_id:     reviewer.id,
        location_id: loc.id,
        rating,
        comment: pick(commentPool),
      });
      totalReviews++;
    }

    process.stdout.write(`  Location #${loc.id}: ${numReviews} reviews\n`);
  }

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Users upserted  : ${seededUsers.length}`);
  console.log(`   Reviews created : ${totalReviews}`);
  console.log(`\n📋 Login info cho tất cả fake users:`);
  console.log(`   Password: 123`);
  FAKE_USERS.forEach(u => console.log(`   ${u.email}`));

  await sequelize.close();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
