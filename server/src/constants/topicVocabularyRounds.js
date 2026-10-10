/**
 * Multi-round vocabulary pools for thematic learning sets in LexiGrow backend.
 */

export const TOPIC_VOCABULARY_ROUNDS = {
  'daily-life': [
    {
      round: 1,
      name: 'Vòng 1: Lịch trình & Hiệu suất',
      promptTopic: 'Write a short paragraph (60–100 words) describing your daily routines and how you commute to work or school.',
      words: [
        { word: 'routine', definitionVi: 'Thói quen, công việc hàng ngày', ipa: '/ruːˈtiːn/', partOfSpeech: 'noun', level: 'A2' },
        { word: 'commute', definitionVi: 'Đi lại đều đặn giữa nhà và nơi làm/học', ipa: '/kəˈmjuːt/', partOfSpeech: 'verb', level: 'A2' },
        { word: 'productive', definitionVi: 'Năng suất, có hiệu quả làm việc cao', ipa: '/prəˈdʌktɪv/', partOfSpeech: 'adjective', level: 'A2' },
        { word: 'efficient', definitionVi: 'Hiệu quả, tiết kiệm thời gian và tài nguyên', ipa: '/ɪˈfɪʃnt/', partOfSpeech: 'adjective', level: 'A2' }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Kỷ luật & Quản lý thời gian',
      promptTopic: 'Write a short paragraph (60–100 words) discussing how you prioritize your daily tasks, stay punctual, and manage your habits.',
      words: [
        { word: 'prioritize', definitionVi: 'Ưu tiên, đặt lên hàng đầu', ipa: '/praɪˈɔːrətaɪz/', partOfSpeech: 'verb', level: 'B1' },
        { word: 'punctual', definitionVi: 'Đúng giờ, chấp hành nghiêm túc thời gian', ipa: '/ˈpʌŋktʃuəl/', partOfSpeech: 'adjective', level: 'A2' },
        { word: 'habitual', definitionVi: 'Theo thói quen, diễn ra đều đặn thường nhật', ipa: '/həˈbɪtʃuəl/', partOfSpeech: 'adjective', level: 'B1' },
        { word: 'multitask', definitionVi: 'Xử lý nhiều việc đồng thời', ipa: '/ˈmʌltitæsk/', partOfSpeech: 'verb', level: 'B1' }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Cân bằng công việc & Cuộc sống',
      promptTopic: 'Write a short paragraph (60–100 words) sharing strategies to avoid procrastination and maintain a healthy work-life balance.',
      words: [
        { word: 'procrastinate', definitionVi: 'Trì hoãn, chậm trễ thực hiện việc cần làm', ipa: '/prəˈkræstɪneɪt/', partOfSpeech: 'verb', level: 'B2' },
        { word: 'workload', definitionVi: 'Khối lượng công việc phải đảm nhận', ipa: '/ˈwɜːrkloʊd/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'well-being', definitionVi: 'Tình trạng khỏe mạnh, hạnh phúc và an vui', ipa: '/ˈwel biːɪŋ/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'leisure', definitionVi: 'Thời gian rảnh rỗi, nghỉ ngơi thư giãn', ipa: '/ˈliːʒər/', partOfSpeech: 'noun', level: 'B1' }
      ]
    }
  ],
  'travel': [
    {
      round: 1,
      name: 'Vòng 1: Lịch trình & Điểm đến',
      promptTopic: 'Write a short paragraph (60–100 words) describing a travel experience or future travel plan.',
      words: [
        { word: 'itinerary', definitionVi: 'Lịch trình, kế hoạch chuyến đi', ipa: '/aɪˈtɪnəreri/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'accommodation', definitionVi: 'Chỗ ở, phòng nghỉ lưu trú', ipa: '/əˌkɑːməˈdeɪʃn/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'landmark', definitionVi: 'Địa danh nổi tiếng, cột mốc', ipa: '/ˈlændmɑːrk/', partOfSpeech: 'noun', level: 'B1' }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Trải nghiệm & Cảnh quan ngoạn mục',
      promptTopic: 'Write a short paragraph (60–100 words) about visiting an exciting destination with breathtaking scenery and hospitable service.',
      words: [
        { word: 'destination', definitionVi: 'Điểm đến du lịch', ipa: '/ˌdestɪˈneɪʃn/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'excursion', definitionVi: 'Chuyến dã ngoại ngắn ngày', ipa: '/ɪkˈskɜːrʒn/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'hospitality', definitionVi: 'Lòng hiếu khách, dịch vụ khách hàng', ipa: '/ˌhɑːspɪˈtæləti/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'breathtaking', definitionVi: 'Đẹp ngoạn mục, choáng ngợp', ipa: '/ˈbreθteɪkɪŋ/', partOfSpeech: 'adjective', level: 'B2' }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Khám phá & Đam mê xê dịch',
      promptTopic: 'Write a short paragraph (60–100 words) about a backpacking journey, overcoming travel fatigue, and collecting meaningful souvenirs.',
      words: [
        { word: 'souvenir', definitionVi: 'Quà lưu niệm chuyến đi', ipa: '/ˌsuːvəˈnɪr/', partOfSpeech: 'noun', level: 'A2' },
        { word: 'backpacking', definitionVi: 'Du lịch bụi, phượt tự túc', ipa: '/ˈbækpækɪŋ/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'wanderlust', definitionVi: 'Niềm khát khao đam mê du lịch khám phá', ipa: '/ˈwɑːndərlʌst/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'expedition', definitionVi: 'Cuộc thám hiểm khám phá', ipa: '/ˌekspəˈdɪʃn/', partOfSpeech: 'noun', level: 'B2' }
      ]
    }
  ],
  'hobbies': [
    {
      round: 1,
      name: 'Vòng 1: Thú vui thường ngày',
      promptTopic: 'Write a short paragraph (60–100 words) sharing your favorite hobby and why you enjoy it.',
      words: [
        { word: 'photography', definitionVi: 'Nhiếp ảnh, nghệ thuật chụp ảnh', ipa: '/fəˈtɑːɡrəfi/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'gardening', definitionVi: 'Làm vườn, chăm sóc cây cối', ipa: '/ˈɡɑːrdnɪŋ/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'cooking', definitionVi: 'Nghệ thuật ẩm thực, nấu nướng', ipa: '/ˈkʊkɪŋ/', partOfSpeech: 'noun', level: 'B1' }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Nghệ thuật & Đam mê sáng tạo',
      promptTopic: 'Write a short paragraph (60–100 words) about how craftsmanship, creativity, and enthusiasm make hobbies fulfilling.',
      words: [
        { word: 'craftsmanship', definitionVi: 'Tay nghề thủ công khéo léo, tinh xảo', ipa: '/ˈkræftsmənʃɪp/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'enthusiast', definitionVi: 'Người say mê, nhiệt huyết', ipa: '/ɪnˈθuːziæst/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'pastime', definitionVi: 'Trò tiêu khiển, thú vui giải trí', ipa: '/ˈpæstaɪm/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'creativity', definitionVi: 'Sức sáng tạo, óc sáng tác', ipa: '/ˌkriːeɪˈtɪvəti/', partOfSpeech: 'noun', level: 'B1' }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Tác phẩm & Triển lãm nghệ thuật',
      promptTopic: 'Write a short paragraph (60–100 words) about attending an art exhibition and creating your own masterpiece.',
      words: [
        { word: 'masterpiece', definitionVi: 'Kiệt tác nghệ thuật xuất sắc', ipa: '/ˈmæstərpiːs/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'exhibition', definitionVi: 'Buổi triển lãm trưng bày nghệ thuật', ipa: '/ˌeksɪˈbɪʃn/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'recreation', definitionVi: 'Hoạt động tiêu khiển, tái tạo năng lượng', ipa: '/ˌrekriˈeɪʃn/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'pottery', definitionVi: 'Nghệ thuật làm đồ gốm sứ', ipa: '/ˈpɑːtəri/', partOfSpeech: 'noun', level: 'B1' }
      ]
    }
  ],
  'technology': [
    {
      round: 1,
      name: 'Vòng 1: Đổi mới & Kết nối số',
      promptTopic: 'Write a short paragraph (60–100 words) discussing modern technology, collaboration, and digital innovation.',
      words: [
        { word: 'innovation', definitionVi: 'Sự đổi mới, sáng kiến công nghệ tiên phong', ipa: '/ˌɪnəˈveɪʃn/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'collaboration', definitionVi: 'Sự cộng tác, làm việc nhóm hiệu quả', ipa: '/kəˌlæbəˈreɪʃn/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'accessible', definitionVi: 'Dễ tiếp cận, tiện dụng', ipa: '/əkˈsesəbl/', partOfSpeech: 'adjective', level: 'B1' },
        { word: 'revolutionize', definitionVi: 'Cách mạng hóa, thay đổi triệt để diện mạo', ipa: '/ˌrevəˈluːʃənaɪz/', partOfSpeech: 'verb', level: 'B2' }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Tự động hóa & An ninh mạng',
      promptTopic: 'Write a short paragraph (60–100 words) explaining how automation, algorithms, and cybersecurity safeguard modern digital infrastructure.',
      words: [
        { word: 'automation', definitionVi: 'Tự động hóa thông minh', ipa: '/ˌɔːtəˈmeɪʃn/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'cybersecurity', definitionVi: 'An ninh mạng, bảo vệ hệ thống và dữ liệu số', ipa: '/ˈsaɪbərsɪkjʊrəti/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'algorithm', definitionVi: 'Thuật toán tính toán và giải quyết bài toán', ipa: '/ˈælɡərɪðəm/', partOfSpeech: 'noun', level: 'B1' },
        { word: 'infrastructure', definitionVi: 'Cơ sở hạ tầng kỹ thuật số cốt lõi', ipa: '/ˈɪnfrəstrʌktʃər/', partOfSpeech: 'noun', level: 'B2' }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Công nghệ tiên phong & Đột phá',
      promptTopic: 'Write a short paragraph (60–100 words) exploring cutting-edge breakthroughs in artificial intelligence and scalable systems.',
      words: [
        { word: 'cutting-edge', definitionVi: 'Hiện đại và tiên tiến hàng đầu', ipa: '/ˌkʌtɪŋ ˈedʒ/', partOfSpeech: 'adjective', level: 'B2' },
        { word: 'breakthrough', definitionVi: 'Bước đột phá mang tính bước ngoặt', ipa: '/ˈbreɪkθruː/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'scalability', definitionVi: 'Khả năng mở rộng quy mô hệ thống', ipa: '/ˌskeɪləˈbɪləti/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'data-driven', definitionVi: 'Được định hướng dựa trên dữ liệu', ipa: '/ˈdeɪtə drɪvn/', partOfSpeech: 'adjective', level: 'B2' }
      ]
    }
  ],
  'environment': [
    {
      round: 1,
      name: 'Vòng 1: Sinh thái & Phát triển bền vững',
      promptTopic: 'Write a short paragraph (60–100 words) about environmental protection, ecosystems, and sustainable development.',
      words: [
        { word: 'sustainable', definitionVi: 'Bền vững, bảo vệ môi trường lâu dài', ipa: '/səˈsteɪnəbl/', partOfSpeech: 'adjective', level: 'B2' },
        { word: 'biodiversity', definitionVi: 'Đa dạng sinh học, sự phong phú giống loài', ipa: '/ˌbaɪoʊdaɪˈvɜːrsəti/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'ecosystem', definitionVi: 'Hệ sinh thái tự nhiên', ipa: '/ˈiːkoʊsɪstəm/', partOfSpeech: 'noun', level: 'B2' }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Bảo tồn & Giảm phát thải khí nhà kính',
      promptTopic: 'Write a short paragraph (60–100 words) discussing conservation efforts, renewable energy adoption, and curtailing greenhouse emissions.',
      words: [
        { word: 'conservation', definitionVi: 'Sự bảo tồn tài nguyên thiên nhiên và động vật hoang dã', ipa: '/ˌkɑːnsərˈveɪʃn/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'renewable', definitionVi: 'Năng lượng tái tạo sạch, không cạn kiệt', ipa: '/rɪˈnuːəbl/', partOfSpeech: 'adjective', level: 'B1' },
        { word: 'emissions', definitionVi: 'Khí thải nhà kính độc hại', ipa: '/ɪˈmɪʃnz/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'deforestation', definitionVi: 'Nạn tàn phá rừng diện rộng', ipa: '/diːˌfɔːrɪˈsteɪʃn/', partOfSpeech: 'noun', level: 'B2' }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Dấu chân carbon & Khủng hoảng khí hậu',
      promptTopic: 'Write a short paragraph (60–100 words) on shrinking individual carbon footprints, preventing contamination, and resource preservation.',
      words: [
        { word: 'carbon footprint', definitionVi: 'Tổng lượng khí thải carbon cá nhân tạo ra', ipa: '/ˌkɑːrbən ˈfʊtprɪnt/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'contamination', definitionVi: 'Sự ô nhiễm độc hại bởi hóa chất', ipa: '/kənˌtæmɪˈneɪʃn/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'preservation', definitionVi: 'Sự gìn giữ nguyên trạng cảnh quan thiên nhiên', ipa: '/ˌprezərˈveɪʃn/', partOfSpeech: 'noun', level: 'B2' },
        { word: 'depletion', definitionVi: 'Sự suy kiệt, cạn kiệt tài nguyên thiên nhiên', ipa: '/dɪˈpliːʃn/', partOfSpeech: 'noun', level: 'C1' }
      ]
    }
  ]
}

export function getTopicRoundBackend(slug, roundNumber = 1) {
  const rounds = TOPIC_VOCABULARY_ROUNDS[slug] || []
  if (!rounds.length) return null
  const idx = Math.max(0, (roundNumber - 1) % rounds.length)
  return rounds[idx]
}
