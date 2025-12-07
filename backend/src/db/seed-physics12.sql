-- ============================================
-- Sample Data: Vật lý 12 THPT - Tổng ôn
-- Run after schema.sql
-- ============================================

-- Get admin user ID (created in schema.sql)
DO $$
DECLARE
    admin_id UUID;
    course_id UUID;
    lesson1_id UUID;
    lesson2_id UUID;
    lesson3_id UUID;
    lesson4_id UUID;
    exam1_id UUID;
    exam2_id UUID;
    wiki1_id UUID;
    wiki2_id UUID;
    wiki3_id UUID;
BEGIN
    -- Get admin user
    SELECT id INTO admin_id FROM users WHERE email = 'admin@neoedu.vn' LIMIT 1;
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Run schema.sql first.';
    END IF;

    -- ============================================
    -- COURSE: Vật lý 12 - Tổng ôn
    -- ============================================
    course_id := uuid_generate_v4();
    
    INSERT INTO courses (id, title, description, category, tags, instructor_id, duration, published)
    VALUES (
        course_id,
        'Vật lý 12 - Tổng ôn THPT Quốc gia',
        'Khóa học tổng ôn kiến thức Vật lý lớp 12, bao gồm các chủ đề: Dao động cơ, Sóng cơ, Sóng điện từ, Quang học, Vật lý hạt nhân. Phù hợp cho học sinh ôn thi THPT Quốc gia.',
        'Vật lý',
        ARRAY['Vật lý 12', 'THPT', 'Tổng ôn', 'Dao động', 'Sóng', 'Quang học'],
        admin_id,
        600, -- 10 hours
        true
    );

    -- ============================================
    -- LESSONS
    -- ============================================
    lesson1_id := uuid_generate_v4();
    lesson2_id := uuid_generate_v4();
    lesson3_id := uuid_generate_v4();
    lesson4_id := uuid_generate_v4();

    -- Lesson 1: Dao động điều hòa
    INSERT INTO lessons (id, course_id, title, description, content, duration, "order", type)
    VALUES (
        lesson1_id,
        course_id,
        'Chương 1: Dao động điều hòa',
        'Tìm hiểu về dao động điều hòa, các đại lượng đặc trưng và phương trình dao động.',
        '<h2>1. Định nghĩa dao động điều hòa</h2>
<p>Dao động điều hòa là dao động mà li độ của vật là một hàm cosin (hoặc sin) của thời gian.</p>
<p><strong>Phương trình:</strong> x = A.cos(ωt + φ)</p>

<h2>2. Các đại lượng đặc trưng</h2>
<ul>
  <li><strong>Biên độ A:</strong> Độ lệch cực đại khỏi vị trí cân bằng (đơn vị: m, cm)</li>
  <li><strong>Tần số góc ω:</strong> ω = 2πf = 2π/T (rad/s)</li>
  <li><strong>Chu kỳ T:</strong> Thời gian thực hiện một dao động toàn phần (s)</li>
  <li><strong>Tần số f:</strong> Số dao động trong 1 giây, f = 1/T (Hz)</li>
  <li><strong>Pha ban đầu φ:</strong> Xác định trạng thái dao động tại t=0</li>
</ul>

<h2>3. Vận tốc và gia tốc</h2>
<p><strong>Vận tốc:</strong> v = -ωA.sin(ωt + φ) = ωA.cos(ωt + φ + π/2)</p>
<p><strong>Gia tốc:</strong> a = -ω²x</p>

<h2>4. Công thức độc lập thời gian</h2>
<p>A² = x² + v²/ω²</p>',
        90,
        1,
        'text'
    );

    -- Lesson 2: Con lắc lò xo
    INSERT INTO lessons (id, course_id, title, description, content, duration, "order", type)
    VALUES (
        lesson2_id,
        course_id,
        'Chương 2: Con lắc lò xo',
        'Nghiên cứu dao động của con lắc lò xo nằm ngang và thẳng đứng.',
        '<h2>1. Con lắc lò xo nằm ngang</h2>
<p><strong>Chu kỳ:</strong> T = 2π√(m/k)</p>
<p>Trong đó: m là khối lượng vật (kg), k là độ cứng lò xo (N/m)</p>

<h2>2. Con lắc lò xo thẳng đứng</h2>
<p><strong>Độ giãn tại VTCB:</strong> Δl₀ = mg/k</p>
<p><strong>Chu kỳ:</strong> T = 2π√(Δl₀/g) = 2π√(m/k)</p>

<h2>3. Năng lượng dao động</h2>
<ul>
  <li><strong>Động năng:</strong> Wđ = ½mv² = ½mω²A²sin²(ωt + φ)</li>
  <li><strong>Thế năng:</strong> Wt = ½kx² = ½mω²A²cos²(ωt + φ)</li>
  <li><strong>Cơ năng:</strong> W = Wđ + Wt = ½kA² = ½mω²A² = const</li>
</ul>

<h2>4. Lực đàn hồi cực đại và cực tiểu</h2>
<p><strong>Con lắc ngang:</strong> Fmax = kA, Fmin = 0</p>
<p><strong>Con lắc đứng:</strong></p>
<ul>
  <li>Nếu A ≤ Δl₀: Fmax = k(Δl₀ + A), Fmin = k(Δl₀ - A)</li>
  <li>Nếu A > Δl₀: Fmax = k(Δl₀ + A), Fmin = 0</li>
</ul>',
        90,
        2,
        'text'
    );

    -- Lesson 3: Sóng cơ
    INSERT INTO lessons (id, course_id, title, description, content, duration, "order", type)
    VALUES (
        lesson3_id,
        course_id,
        'Chương 3: Sóng cơ và sóng âm',
        'Tìm hiểu về sóng cơ, các đại lượng đặc trưng và hiện tượng giao thoa sóng.',
        '<h2>1. Định nghĩa sóng cơ</h2>
<p>Sóng cơ là dao động cơ lan truyền trong môi trường vật chất.</p>
<p><strong>Phân loại:</strong></p>
<ul>
  <li><strong>Sóng ngang:</strong> Phương dao động vuông góc với phương truyền sóng</li>
  <li><strong>Sóng dọc:</strong> Phương dao động trùng với phương truyền sóng</li>
</ul>

<h2>2. Các đại lượng đặc trưng</h2>
<ul>
  <li><strong>Bước sóng λ:</strong> Khoảng cách giữa 2 điểm gần nhất dao động cùng pha</li>
  <li><strong>Vận tốc truyền sóng:</strong> v = λf = λ/T</li>
</ul>

<h2>3. Giao thoa sóng</h2>
<p><strong>Điều kiện:</strong> Hai nguồn cùng tần số, cùng pha hoặc lệch pha không đổi</p>
<p><strong>Cực đại:</strong> d₂ - d₁ = kλ (k = 0, ±1, ±2,...)</p>
<p><strong>Cực tiểu:</strong> d₂ - d₁ = (k + 0.5)λ</p>

<h2>4. Sóng dừng</h2>
<p><strong>Hai đầu cố định:</strong> l = n.λ/2</p>
<p><strong>Một đầu cố định, một đầu tự do:</strong> l = (2n+1).λ/4</p>',
        90,
        3,
        'text'
    );

    -- Lesson 4: Sóng điện từ
    INSERT INTO lessons (id, course_id, title, description, content, duration, "order", type)
    VALUES (
        lesson4_id,
        course_id,
        'Chương 4: Dao động và sóng điện từ',
        'Mạch dao động LC, sóng điện từ và ứng dụng trong truyền thông.',
        '<h2>1. Mạch dao động LC</h2>
<p><strong>Chu kỳ:</strong> T = 2π√(LC)</p>
<p><strong>Tần số:</strong> f = 1/(2π√(LC))</p>
<p><strong>Năng lượng:</strong> W = ½Li² + ½Cu² = ½LI₀² = ½CU₀²</p>

<h2>2. Điện từ trường</h2>
<p>Điện trường biến thiên sinh ra từ trường biến thiên và ngược lại.</p>
<p>Sóng điện từ là điện từ trường lan truyền trong không gian.</p>

<h2>3. Đặc điểm sóng điện từ</h2>
<ul>
  <li>Truyền được trong chân không với vận tốc c = 3×10⁸ m/s</li>
  <li>Là sóng ngang</li>
  <li>Mang năng lượng</li>
  <li>Tuân theo định luật phản xạ, khúc xạ</li>
</ul>

<h2>4. Thang sóng điện từ</h2>
<ul>
  <li>Sóng vô tuyến: λ > 1mm</li>
  <li>Tia hồng ngoại: 0.76μm < λ < 1mm</li>
  <li>Ánh sáng nhìn thấy: 0.38μm - 0.76μm</li>
  <li>Tia tử ngoại: 1nm - 0.38μm</li>
  <li>Tia X: 0.01nm - 1nm</li>
  <li>Tia gamma: λ < 0.01nm</li>
</ul>',
        90,
        4,
        'text'
    );

    -- ============================================
    -- EXAMS
    -- ============================================
    exam1_id := uuid_generate_v4();
    exam2_id := uuid_generate_v4();

    -- Exam 1: Dao động cơ
    INSERT INTO exams (id, title, description, course_id, duration_minutes, passing_score, max_attempts, shuffle_questions, is_published, created_by)
    VALUES (
        exam1_id,
        'Kiểm tra: Dao động cơ',
        'Bài kiểm tra kiến thức về dao động điều hòa, con lắc lò xo, con lắc đơn.',
        course_id,
        30,
        70,
        3,
        true,
        true,
        admin_id
    );

    -- Questions for Exam 1
    INSERT INTO exam_questions (exam_id, question_text, question_type, options, correct_answer, points, "order") VALUES
    (exam1_id, 'Dao động điều hòa là dao động có:', 'multiple-choice', 
     '["Biên độ thay đổi theo thời gian", "Li độ là hàm cosin hoặc sin của thời gian", "Chu kỳ thay đổi theo thời gian", "Tần số tăng dần theo thời gian"]',
     'Li độ là hàm cosin hoặc sin của thời gian', 1, 1),
    
    (exam1_id, 'Xét các phát biểu về dao động điều hòa:
a) Chu kỳ không phụ thuộc biên độ
b) Vận tốc cực đại tại vị trí biên
c) Gia tốc luôn ngược chiều li độ
d) Cơ năng bằng tổng động năng và thế năng', 'true-false', 
     NULL, 'ĐSĐĐ', 1, 2),
    
    (exam1_id, 'Một con lắc lò xo có k = 100 N/m, khối lượng 0.25 kg. Tần số dao động bằng bao nhiêu Hz?', 'multiple-choice',
     '["1/π Hz", "10/π Hz", "2/π Hz", "20/π Hz"]',
     '10/π Hz', 1, 3),
    
    (exam1_id, 'Trong dao động điều hòa, gia tốc luôn:', 'multiple-choice',
     '["Cùng chiều với li độ", "Ngược chiều với li độ", "Vuông góc với li độ", "Không phụ thuộc li độ"]',
     'Ngược chiều với li độ', 1, 4),
    
    (exam1_id, 'Cơ năng của con lắc lò xo dao động điều hòa bằng:', 'multiple-choice',
     '["½kA", "½kA²", "kA²", "2kA²"]',
     '½kA²', 1, 5),
    
    (exam1_id, 'Một vật dao động điều hòa với A=4cm, ω=5rad/s. Tại x=2cm, vận tốc bằng bao nhiêu cm/s? (Nhập số, VD: -10,5)', 'short-answer',
     NULL, '17,3', 2, 6),
    
    (exam1_id, 'Xét các phát biểu về con lắc lò xo:
a) Chu kỳ phụ thuộc khối lượng vật
b) Chu kỳ phụ thuộc biên độ dao động
c) Tần số phụ thuộc độ cứng lò xo
d) Năng lượng tỉ lệ với bình phương biên độ', 'true-false',
     NULL, 'ĐSĐĐ', 1, 7),
    
    (exam1_id, 'Một vật dao động điều hòa với biên độ 4 cm, tần số 2 Hz. Vận tốc cực đại của vật bằng:', 'multiple-choice',
     '["8π cm/s", "16π cm/s", "4π cm/s", "32π cm/s"]',
     '16π cm/s', 1, 8);

    -- Exam 2: Sóng cơ
    INSERT INTO exams (id, title, description, course_id, duration_minutes, passing_score, max_attempts, shuffle_questions, is_published, created_by)
    VALUES (
        exam2_id,
        'Kiểm tra: Sóng cơ và sóng âm',
        'Bài kiểm tra kiến thức về sóng cơ, giao thoa sóng, sóng dừng.',
        course_id,
        25,
        70,
        3,
        true,
        true,
        admin_id
    );

    -- Questions for Exam 2
    INSERT INTO exam_questions (exam_id, question_text, question_type, options, correct_answer, points, "order") VALUES
    (exam2_id, 'Sóng cơ là:', 'multiple-choice',
     '["Dao động cơ lan truyền trong chân không", "Dao động cơ lan truyền trong môi trường vật chất", "Sóng điện từ", "Sóng ánh sáng"]',
     'Dao động cơ lan truyền trong môi trường vật chất', 1, 1),
    
    (exam2_id, 'Bước sóng là khoảng cách giữa hai điểm gần nhất dao động cùng pha trên phương truyền sóng. Đúng hay sai?', 'true-false',
     NULL, 'true', 1, 2),
    
    (exam2_id, 'Công thức tính vận tốc truyền sóng là:', 'multiple-choice',
     '["v = λ/f", "v = λ.f", "v = f/λ", "v = λ + f"]',
     'v = λ.f', 1, 3),
    
    (exam2_id, 'Điều kiện để có giao thoa sóng là hai nguồn phải:', 'multiple-choice',
     '["Cùng biên độ", "Cùng tần số và hiệu số pha không đổi", "Cùng vận tốc", "Cùng pha ban đầu"]',
     'Cùng tần số và hiệu số pha không đổi', 1, 4),
    
    (exam2_id, 'Tại điểm cực đại giao thoa, hiệu đường đi bằng:', 'multiple-choice',
     '["kλ/2", "kλ", "(2k+1)λ/2", "kλ/4"]',
     'kλ', 1, 5),
    
    (exam2_id, 'Một sóng có tần số 50 Hz, bước sóng 2 m. Vận tốc truyền sóng bằng bao nhiêu m/s?', 'short-answer',
     NULL, '100', 2, 6);

    -- ============================================
    -- WIKI ARTICLES
    -- ============================================
    wiki1_id := uuid_generate_v4();
    wiki2_id := uuid_generate_v4();
    wiki3_id := uuid_generate_v4();

    INSERT INTO wikis (id, title, slug, content, excerpt, is_published, author_id) VALUES
    (wiki1_id, 'Công thức Vật lý 12: Dao động cơ', 'cong-thuc-dao-dong-co',
     '<h2>1. Phương trình dao động điều hòa</h2>
<p>x = A.cos(ωt + φ)</p>

<h2>2. Các công thức cơ bản</h2>
<table>
<tr><th>Đại lượng</th><th>Công thức</th></tr>
<tr><td>Tần số góc</td><td>ω = 2πf = 2π/T</td></tr>
<tr><td>Vận tốc</td><td>v = -ωA.sin(ωt + φ)</td></tr>
<tr><td>Vận tốc cực đại</td><td>v_max = ωA</td></tr>
<tr><td>Gia tốc</td><td>a = -ω²x</td></tr>
<tr><td>Gia tốc cực đại</td><td>a_max = ω²A</td></tr>
</table>

<h2>3. Con lắc lò xo</h2>
<p>T = 2π√(m/k)</p>
<p>f = (1/2π)√(k/m)</p>

<h2>4. Con lắc đơn</h2>
<p>T = 2π√(l/g)</p>

<h2>5. Năng lượng</h2>
<p>W = ½kA² = ½mω²A²</p>',
     'Tổng hợp các công thức quan trọng về dao động cơ trong chương trình Vật lý 12.',
     true, admin_id),

    (wiki2_id, 'Công thức Vật lý 12: Sóng cơ', 'cong-thuc-song-co',
     '<h2>1. Các đại lượng đặc trưng</h2>
<p><strong>Bước sóng:</strong> λ = v.T = v/f</p>
<p><strong>Vận tốc:</strong> v = λ.f</p>

<h2>2. Phương trình sóng</h2>
<p>u = A.cos(ωt - 2πx/λ)</p>

<h2>3. Giao thoa sóng</h2>
<p><strong>Cực đại:</strong> Δd = kλ (k = 0, ±1, ±2,...)</p>
<p><strong>Cực tiểu:</strong> Δd = (k + 0.5)λ</p>
<p><strong>Số cực đại:</strong> -S₁S₂/λ < k < S₁S₂/λ</p>

<h2>4. Sóng dừng</h2>
<p><strong>Hai đầu cố định:</strong> l = n.λ/2 (n = 1, 2, 3,...)</p>
<p><strong>Một đầu cố định:</strong> l = (2n+1).λ/4</p>',
     'Tổng hợp công thức về sóng cơ và các hiện tượng liên quan.',
     true, admin_id),

    (wiki3_id, 'Phương pháp giải bài tập Con lắc lò xo', 'phuong-phap-con-lac-lo-xo',
     '<h2>1. Xác định các đại lượng</h2>
<p>Bước 1: Đọc kỹ đề bài, xác định các đại lượng đã cho (m, k, A, x, v...)</p>
<p>Bước 2: Xác định đại lượng cần tìm</p>

<h2>2. Các dạng bài thường gặp</h2>

<h3>Dạng 1: Tính chu kỳ, tần số</h3>
<p>Áp dụng: T = 2π√(m/k), f = 1/T</p>

<h3>Dạng 2: Tìm vận tốc, gia tốc</h3>
<p>Dùng công thức: v = ±ω√(A² - x²)</p>
<p>Gia tốc: a = -ω²x</p>

<h3>Dạng 3: Năng lượng</h3>
<p>Cơ năng: W = ½kA²</p>
<p>Động năng: Wđ = ½mv²</p>
<p>Thế năng: Wt = ½kx²</p>

<h3>Dạng 4: Con lắc thẳng đứng</h3>
<p>Độ giãn VTCB: Δl₀ = mg/k</p>
<p>Lực đàn hồi: F = k|Δl₀ ± x|</p>

<h2>3. Lưu ý quan trọng</h2>
<ul>
<li>Đổi đơn vị về SI trước khi tính</li>
<li>Chú ý dấu của li độ và vận tốc</li>
<li>Với con lắc đứng, xét chiều dương hướng xuống</li>
</ul>',
     'Hướng dẫn chi tiết các bước giải bài tập về con lắc lò xo trong Vật lý 12.',
     true, admin_id);

    RAISE NOTICE 'Sample data inserted successfully!';
    RAISE NOTICE 'Created course: Vật lý 12 - Tổng ôn THPT Quốc gia';
    RAISE NOTICE 'Created 4 lessons, 2 exams, 3 wiki articles';

END $$;
