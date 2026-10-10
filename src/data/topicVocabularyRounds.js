/**
 * Multi-round vocabulary pools for thematic learning sets in LexiGrow.
 * When a student completes Round 1 of a topic, Round 2 generates fresh words
 * for that topic so the student can continuously advance their vocabulary.
 */

export const TOPIC_VOCABULARY_ROUNDS = {
  'daily-life': [
    {
      round: 1,
      name: 'Vòng 1: Lịch trình & Hiệu suất',
      promptTopic: 'Write a short paragraph (60–100 words) describing your daily routines and how you commute to work or school.',
      words: [
        {
          _id: 'w_routine',
          word: 'routine',
          ipa: '/ruːˈtiːn/',
          partOfSpeech: 'noun',
          level: 'A2',
          meaning: 'Thói quen hàng ngày',
          meaningVi: 'Thói quen, công việc hoặc lịch trình đều đặn hàng ngày',
          collocations: [
            { phrase: 'daily routine', meaning: 'lịch trình hàng ngày' },
            { phrase: 'morning routine', meaning: 'thói quen buổi sáng' }
          ],
          exampleSentence: 'I try to stick to my daily routine even on weekends.',
          exampleTranslation: 'Tôi cố gắng duy trì thói quen hàng ngày ngay cả vào cuối tuần.'
        },
        {
          _id: 'w_commute',
          word: 'commute',
          ipa: '/kəˈmjuːt/',
          partOfSpeech: 'verb',
          level: 'A2',
          meaning: 'Đi lại làm việc/học',
          meaningVi: 'Đi lại đều đặn giữa nhà và nơi làm việc hoặc trường học',
          collocations: [
            { phrase: 'commute to work', meaning: 'đi làm hàng ngày' },
            { phrase: 'daily commute', meaning: 'chặng đường đi lại mỗi ngày' }
          ],
          exampleSentence: 'It takes me 30 minutes to commute to work by bus.',
          exampleTranslation: 'Tôi mất 30 phút để đi làm bằng xe buýt.'
        },
        {
          _id: 'w_productive',
          word: 'productive',
          ipa: '/prəˈdʌktɪv/',
          partOfSpeech: 'adjective',
          level: 'A2',
          meaning: 'Năng suất, hiệu quả',
          meaningVi: 'Năng suất, có hiệu quả làm việc cao',
          collocations: [
            { phrase: 'productive day', meaning: 'ngày làm việc năng suất' },
            { phrase: 'stay productive', meaning: 'duy trì hiệu suất làm việc' }
          ],
          exampleSentence: 'Focusing on one task at a time helps me stay productive.',
          exampleTranslation: 'Tập trung vào từng việc giúp tôi duy trì năng suất.'
        },
        {
          _id: 'w_efficient',
          word: 'efficient',
          ipa: '/ɪˈfɪʃnt/',
          partOfSpeech: 'adjective',
          level: 'A2',
          meaning: 'Tiết kiệm thời gian',
          meaningVi: 'Hiệu quả, tiết kiệm thời gian và tài nguyên',
          collocations: [
            { phrase: 'efficient workflow', meaning: 'quy trình làm việc hiệu quả' },
            { phrase: 'energy efficient', meaning: 'tiết kiệm năng lượng' }
          ],
          exampleSentence: 'We implemented a more efficient way to manage project tasks.',
          exampleTranslation: 'Chúng tôi đã áp dụng cách hiệu quả hơn để quản lý công việc dự án.'
        }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Kỷ luật & Quản lý thời gian',
      promptTopic: 'Write a short paragraph (60–100 words) discussing how you prioritize your daily tasks, stay punctual, and manage your habits.',
      words: [
        {
          _id: 'w_prioritize',
          word: 'prioritize',
          ipa: '/praɪˈɔːrətaɪz/',
          partOfSpeech: 'verb',
          level: 'B1',
          meaning: 'Ưu tiên việc quan trọng',
          meaningVi: 'Ưu tiên, đặt lên hàng đầu',
          collocations: [
            { phrase: 'prioritize tasks', meaning: 'ưu tiên các nhiệm vụ' },
            { phrase: 'prioritize health', meaning: 'đặt sức khỏe lên hàng đầu' }
          ],
          exampleSentence: 'I prioritize urgent tasks in the morning to stay productive.',
          exampleTranslation: 'Tôi ưu tiên các nhiệm vụ khẩn cấp vào buổi sáng để duy trì năng suất.'
        },
        {
          _id: 'w_punctual',
          word: 'punctual',
          ipa: '/ˈpʌŋktʃuəl/',
          partOfSpeech: 'adjective',
          level: 'A2',
          meaning: 'Đúng giờ, kỷ luật',
          meaningVi: 'Đúng giờ, chấp hành nghiêm túc thời gian',
          collocations: [
            { phrase: 'punctual arrival', meaning: 'đến đúng giờ' },
            { phrase: 'stay punctual', meaning: 'luôn giữ đúng giờ' }
          ],
          exampleSentence: 'Being punctual shows respect for other people’s time.',
          exampleTranslation: 'Đúng giờ thể hiện sự tôn trọng thời gian của người khác.'
        },
        {
          _id: 'w_habitual',
          word: 'habitual',
          ipa: '/həˈbɪtʃuəl/',
          partOfSpeech: 'adjective',
          level: 'B1',
          meaning: 'Thuộc về thói quen',
          meaningVi: 'Theo thói quen, diễn ra đều đặn thường nhật',
          collocations: [
            { phrase: 'habitual routine', meaning: 'thói quen sinh hoạt đều đặn' },
            { phrase: 'habitual behavior', meaning: 'hành vi theo thói quen' }
          ],
          exampleSentence: 'Morning exercise has become a habitual part of my daily routine.',
          exampleTranslation: 'Tập thể dục buổi sáng đã trở thành một phần thói quen trong sinh hoạt hàng ngày của tôi.'
        },
        {
          _id: 'w_multitask',
          word: 'multitask',
          ipa: '/ˈmʌltitæsk/',
          partOfSpeech: 'verb',
          level: 'B1',
          meaning: 'Làm nhiều việc cùng lúc',
          meaningVi: 'Xử lý nhiều việc đồng thời',
          collocations: [
            { phrase: 'ability to multitask', meaning: 'khả năng xử lý nhiều việc' },
            { phrase: 'multitask effectively', meaning: 'đa nhiệm hiệu quả' }
          ],
          exampleSentence: 'Trying to multitask constantly can reduce the overall quality of work.',
          exampleTranslation: 'Cố gắng làm nhiều việc cùng lúc liên tục có thể làm giảm chất lượng công việc.'
        }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Cân bằng công việc & Cuộc sống',
      promptTopic: 'Write a short paragraph (60–100 words) sharing strategies to avoid procrastination and maintain a healthy work-life balance.',
      words: [
        {
          _id: 'w_procrastinate',
          word: 'procrastinate',
          ipa: '/prəˈkræstɪneɪt/',
          partOfSpeech: 'verb',
          level: 'B2',
          meaning: 'Trì hoãn, chần chừ',
          meaningVi: 'Trì hoãn, chậm trễ thực hiện việc cần làm',
          collocations: [
            { phrase: 'tendency to procrastinate', meaning: 'xu hướng trì hoãn' },
            { phrase: 'stop procrastinating', meaning: 'ngừng chần chừ' }
          ],
          exampleSentence: 'Setting short deadlines helps me stop procrastinating on important projects.',
          exampleTranslation: 'Đặt hạn chót ngắn giúp tôi không còn trì hoãn các dự án quan trọng.'
        },
        {
          _id: 'w_workload',
          word: 'workload',
          ipa: '/ˈwɜːrkloʊd/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Khối lượng công việc',
          meaningVi: 'Khối lượng công việc phải đảm nhận',
          collocations: [
            { phrase: 'heavy workload', meaning: 'khối lượng công việc nặng nề' },
            { phrase: 'manage workload', meaning: 'quản lý khối lượng công việc' }
          ],
          exampleSentence: 'Planning ahead allows students to manage a heavy academic workload.',
          exampleTranslation: 'Lên kế hoạch trước giúp học sinh quản lý được khối lượng học tập nặng.'
        },
        {
          _id: 'w_well_being',
          word: 'well-being',
          ipa: '/ˈwel biːɪŋ/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Sức khỏe & sự an lạc',
          meaningVi: 'Tình trạng khỏe mạnh, hạnh phúc và an vui',
          collocations: [
            { phrase: 'mental well-being', meaning: 'sức khỏe tinh thần' },
            { phrase: 'overall well-being', meaning: 'sự an lành toàn diện' }
          ],
          exampleSentence: 'Getting adequate sleep is essential for physical and mental well-being.',
          exampleTranslation: 'Ngủ đủ giấc là điều cần thiết cho sức khỏe thể chất và tinh thần.'
        },
        {
          _id: 'w_leisure',
          word: 'leisure',
          ipa: '/ˈliːʒər/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Thời gian thư giãn',
          meaningVi: 'Thời gian rảnh rỗi, nghỉ ngơi thư giãn',
          collocations: [
            { phrase: 'leisure activity', meaning: 'hoạt động giải trí khi rảnh' },
            { phrase: 'at one’s leisure', meaning: 'khi rảnh rỗi' }
          ],
          exampleSentence: 'Reading novels is my favorite leisure activity during rainy days.',
          exampleTranslation: 'Đọc tiểu thuyết là hoạt động giải trí yêu thích của tôi trong những ngày mưa.'
        }
      ]
    }
  ],

  'travel': [
    {
      round: 1,
      name: 'Vòng 1: Lịch trình & Điểm đến',
      promptTopic: 'Write a short paragraph (60–100 words) describing a travel experience or future travel plan.',
      words: [
        {
          _id: 'w_itinerary',
          word: 'itinerary',
          ipa: '/aɪˈtɪnəreri/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Lịch trình chuyến đi',
          meaningVi: 'Lịch trình, kế hoạch tuyến đường cho chuyến đi',
          collocations: [
            { phrase: 'travel itinerary', meaning: 'lịch trình du lịch' },
            { phrase: 'planned itinerary', meaning: 'lịch trình đã lên kế hoạch' }
          ],
          exampleSentence: 'Our travel itinerary includes visiting historical museums and local markets.',
          exampleTranslation: 'Lịch trình du lịch của chúng tôi bao gồm tham quan các bảo tàng lịch sử và chợ địa phương.'
        },
        {
          _id: 'w_accommodation',
          word: 'accommodation',
          ipa: '/əˌkɑːməˈdeɪʃn/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Nơi lưu trú, chỗ ở',
          meaningVi: 'Chỗ ở, phòng nghỉ khi đi du lịch',
          collocations: [
            { phrase: 'book accommodation', meaning: 'đặt chỗ ở' },
            { phrase: 'hotel accommodation', meaning: 'phòng khách sạn lưu trú' }
          ],
          exampleSentence: 'It is advisable to book accommodation well in advance during peak season.',
          exampleTranslation: 'Nên đặt chỗ ở trước trong mùa du lịch cao điểm.'
        },
        {
          _id: 'w_landmark',
          word: 'landmark',
          ipa: '/ˈlændmɑːrk/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Địa danh nổi tiếng',
          meaningVi: 'Cột mốc, địa danh nổi tiếng dễ nhận biết',
          collocations: [
            { phrase: 'famous landmark', meaning: 'địa danh nổi tiếng' },
            { phrase: 'historical landmark', meaning: 'di tích lịch sử tiêu biểu' }
          ],
          exampleSentence: 'The Eiffel Tower is the most recognizable landmark in Paris.',
          exampleTranslation: 'Tháp Eiffel là địa danh dễ nhận biết nhất ở Paris.'
        }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Trải nghiệm & Cảnh quan ngoạn mục',
      promptTopic: 'Write a short paragraph (60–100 words) about visiting an exciting destination with breathtaking scenery and hospitable service.',
      words: [
        {
          _id: 'w_destination',
          word: 'destination',
          ipa: '/ˌdestɪˈneɪʃn/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Điểm đến du lịch',
          meaningVi: 'Điểm đến, nơi dự định tới thăm',
          collocations: [
            { phrase: 'popular destination', meaning: 'điểm đến nổi tiếng' },
            { phrase: 'final destination', meaning: 'điểm đến cuối cùng' }
          ],
          exampleSentence: 'Da Nang is a premier travel destination for beach lovers.',
          exampleTranslation: 'Đà Nẵng là điểm đến hàng đầu cho những người yêu biển.'
        },
        {
          _id: 'w_excursion',
          word: 'excursion',
          ipa: '/ɪkˈskɜːrʒn/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Chuyến dã ngoại ngắn',
          meaningVi: 'Chuyến du ngoạn hoặc dã ngoại ngắn ngày',
          collocations: [
            { phrase: 'day excursion', meaning: 'chuyến dã ngoại trong ngày' },
            { phrase: 'boat excursion', meaning: 'chuyến du ngoạn bằng thuyền' }
          ],
          exampleSentence: 'We joined a boat excursion to explore secluded limestone caves.',
          exampleTranslation: 'Chúng tôi tham gia chuyến du ngoạn bằng thuyền để khám phá các hang đá vôi biệt lập.'
        },
        {
          _id: 'w_hospitality',
          word: 'hospitality',
          ipa: '/ˌhɑːspɪˈtæləti/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Lòng hiếu khách',
          meaningVi: 'Lòng hiếu khách, sự đón tiếp nồng hậu',
          collocations: [
            { phrase: 'warm hospitality', meaning: 'lòng hiếu khách ấm áp' },
            { phrase: 'hospitality industry', meaning: 'ngành dịch vụ khách sạn - du lịch' }
          ],
          exampleSentence: 'Visitors are always touched by the warm hospitality of local villagers.',
          exampleTranslation: 'Du khách luôn xúc động trước lòng hiếu khách ấm áp của người dân làng.'
        },
        {
          _id: 'w_breathtaking',
          word: 'breathtaking',
          ipa: '/ˈbreθteɪkɪŋ/',
          partOfSpeech: 'adjective',
          level: 'B2',
          meaning: 'Đẹp ngoạn mục',
          meaningVi: 'Đẹp ngoạn mục, choáng ngợp đến nghẹt thở',
          collocations: [
            { phrase: 'breathtaking view', meaning: 'khung cảnh đẹp ngoạn mục' },
            { phrase: 'breathtaking scenery', meaning: 'cảnh sắc tuyệt mỹ' }
          ],
          exampleSentence: 'From the mountain summit, we admired a breathtaking panorama of the valley.',
          exampleTranslation: 'Từ đỉnh núi, chúng tôi chiêm ngưỡng toàn cảnh thung lũng đẹp ngoạn mục.'
        }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Khám phá & Đam mê xê dịch',
      promptTopic: 'Write a short paragraph (60–100 words) about a backpacking journey, overcoming travel fatigue, and collecting meaningful souvenirs.',
      words: [
        {
          _id: 'w_souvenir',
          word: 'souvenir',
          ipa: '/ˌsuːvəˈnɪr/',
          partOfSpeech: 'noun',
          level: 'A2',
          meaning: 'Quà lưu niệm',
          meaningVi: 'Đồ lưu niệm để ghi nhớ chuyến đi',
          collocations: [
            { phrase: 'buy souvenirs', meaning: 'mua đồ lưu niệm' },
            { phrase: 'meaningful souvenir', meaning: 'món quà lưu niệm ý nghĩa' }
          ],
          exampleSentence: 'I bought handcrafted pottery as a souvenir from the ancient village.',
          exampleTranslation: 'Tôi đã mua đồ gốm thủ công làm quà lưu niệm từ ngôi làng cổ.'
        },
        {
          _id: 'w_backpacking',
          word: 'backpacking',
          ipa: '/ˈbækpækɪŋ/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Du lịch bụi, phượt',
          meaningVi: 'Hình thức du lịch tự túc, mang ba lô khám phá',
          collocations: [
            { phrase: 'backpacking trip', meaning: 'chuyến du lịch bụi' },
            { phrase: 'go backpacking', meaning: 'đi phượt khám phá' }
          ],
          exampleSentence: 'Backpacking across Southeast Asia teaches travelers self-reliance.',
          exampleTranslation: 'Đi phượt khắp Đông Nam Á rèn luyện cho du khách tính tự lập.'
        },
        {
          _id: 'w_wanderlust',
          word: 'wanderlust',
          ipa: '/ˈwɑːndərlʌst/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Đam mê xê dịch',
          meaningVi: 'Niềm khát khao mãnh liệt được đi du lịch, khám phá thế giới',
          collocations: [
            { phrase: 'spirit of wanderlust', meaning: 'tinh thần đam mê xê dịch' },
            { phrase: 'fuel wanderlust', meaning: 'thổi bùng niềm đam mê khám phá' }
          ],
          exampleSentence: 'Stunning travel documentaries fueled her lifelong wanderlust.',
          exampleTranslation: 'Những thước phim tài liệu du lịch tuyệt đẹp đã thổi bùng niềm đam mê xê dịch suốt đời của cô ấy.'
        },
        {
          _id: 'w_expedition',
          word: 'expedition',
          ipa: '/ˌekspəˈdɪʃn/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Chuyến thám hiểm',
          meaningVi: 'Cuộc thám hiểm có tổ chức với mục đích khám phá',
          collocations: [
            { phrase: 'scientific expedition', meaning: 'chuyến thám hiểm khoa học' },
            { phrase: 'mountain expedition', meaning: 'cuộc thám hiểm leo núi' }
          ],
          exampleSentence: 'The scientific expedition ventured deep into the tropical rainforest.',
          exampleTranslation: 'Đoàn thám hiểm khoa học đã tiến sâu vào khu rừng mưa nhiệt đới.'
        }
      ]
    }
  ],

  'hobbies': [
    {
      round: 1,
      name: 'Vòng 1: Thú vui thường ngày',
      promptTopic: 'Write a short paragraph (60–100 words) sharing your favorite hobby and why you enjoy it.',
      words: [
        {
          _id: 'w_photography',
          word: 'photography',
          ipa: '/fəˈtɑːɡrəfi/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Nhiếp ảnh',
          meaningVi: 'Nghệ thuật và kỹ thuật chụp ảnh',
          collocations: [
            { phrase: 'digital photography', meaning: 'nhiếp ảnh kỹ thuật số' },
            { phrase: 'photography hobby', meaning: 'sở thích chụp ảnh' }
          ],
          exampleSentence: 'Photography allows me to capture beautiful moments in nature.',
          exampleTranslation: 'Nhiếp ảnh giúp tôi lưu giữ những khoảnh khắc tuyệt đẹp của thiên nhiên.'
        },
        {
          _id: 'w_gardening',
          word: 'gardening',
          ipa: '/ˈɡɑːrdnɪŋ/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Làm vườn, trồng cây',
          meaningVi: 'Hoạt động chăm sóc và vun trồng cây cối trong vườn',
          collocations: [
            { phrase: 'gardening tools', meaning: 'dụng cụ làm vườn' },
            { phrase: 'gardening hobby', meaning: 'thú vui làm vườn' }
          ],
          exampleSentence: 'Gardening is a relaxing activity that helps reduce stress after work.',
          exampleTranslation: 'Làm vườn là hoạt động thư thái giúp giảm căng thẳng sau giờ làm.'
        },
        {
          _id: 'w_cooking',
          word: 'cooking',
          ipa: '/ˈkʊkɪŋ/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Nghệ thuật nấu ăn',
          meaningVi: 'Kỹ năng chuẩn bị và chế biến món ăn ngon',
          collocations: [
            { phrase: 'cooking skills', meaning: 'kỹ năng nấu nướng' },
            { phrase: 'cooking class', meaning: 'lớp học nấu ăn' }
          ],
          exampleSentence: 'Improving my cooking skills helped me eat healthier meals at home.',
          exampleTranslation: 'Cải thiện kỹ năng nấu ăn giúp tôi có những bữa ăn lành mạnh hơn tại nhà.'
        }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Nghệ thuật & Đam mê sáng tạo',
      promptTopic: 'Write a short paragraph (60–100 words) about how craftsmanship, creativity, and enthusiasm make hobbies fulfilling.',
      words: [
        {
          _id: 'w_craftsmanship',
          word: 'craftsmanship',
          ipa: '/ˈkræftsmənʃɪp/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Tay nghề thủ công',
          meaningVi: 'Kỹ năng thủ công tinh xảo, tay nghề điêu luyện',
          collocations: [
            { phrase: 'skilled craftsmanship', meaning: 'tay nghề thủ công khéo léo' },
            { phrase: 'traditional craftsmanship', meaning: 'nghề thủ công truyền thống' }
          ],
          exampleSentence: 'Handmade wooden furniture showcases exceptional craftsmanship.',
          exampleTranslation: 'Đồ nội thất gỗ thủ công thể hiện tay nghề khéo léo xuất sắc.'
        },
        {
          _id: 'w_enthusiast',
          word: 'enthusiast',
          ipa: '/ɪnˈθuːziæst/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Người say mê',
          meaningVi: 'Người có lòng đam mê nhiệt huyết với một lĩnh vực',
          collocations: [
            { phrase: 'fitness enthusiast', meaning: 'người đam mê thể hình' },
            { phrase: 'art enthusiast', meaning: 'người say mê nghệ thuật' }
          ],
          exampleSentence: 'As a passionate music enthusiast, he attends classical concerts every month.',
          exampleTranslation: 'Là một người say mê âm nhạc, anh ấy tham dự các buổi hòa nhạc cổ điển hàng tháng.'
        },
        {
          _id: 'w_pastime',
          word: 'pastime',
          ipa: '/ˈpæstaɪm/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Trò tiêu khiển, thú vui',
          meaningVi: 'Thú vui giải trí để thư giãn trong thời gian rảnh',
          collocations: [
            { phrase: 'favorite pastime', meaning: 'thú vui yêu thích' },
            { phrase: 'pleasant pastime', meaning: 'trò tiêu khiển thú vị' }
          ],
          exampleSentence: 'Playing chess with my grandfather remains my favorite weekend pastime.',
          exampleTranslation: 'Chơi cờ vua với ông nội vẫn là thú tiêu khiển cuối tuần yêu thích nhất của tôi.'
        },
        {
          _id: 'w_creativity',
          word: 'creativity',
          ipa: '/ˌkriːeɪˈtɪvəti/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Sức sáng tạo',
          meaningVi: 'Khả năng sáng tạo ra những ý tưởng độc đáo mới mẻ',
          collocations: [
            { phrase: 'foster creativity', meaning: 'nuôi dưỡng sức sáng tạo' },
            { phrase: 'artistic creativity', meaning: 'óc sáng tạo nghệ thuật' }
          ],
          exampleSentence: 'Painting allows young learners to express their vivid creativity freely.',
          exampleTranslation: 'Hội họa cho phép các bạn trẻ tự do thể hiện óc sáng tạo sống động của mình.'
        }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Tác phẩm & Triển lãm nghệ thuật',
      promptTopic: 'Write a short paragraph (60–100 words) about attending an art exhibition and creating your own masterpiece.',
      words: [
        {
          _id: 'w_masterpiece',
          word: 'masterpiece',
          ipa: '/ˈmæstərpiːs/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Kiệt tác nghệ thuật',
          meaningVi: 'Tác phẩm xuất sắc nhất, kiệt tác nghệ thuật',
          collocations: [
            { phrase: 'artistic masterpiece', meaning: 'kiệt tác nghệ thuật' },
            { phrase: 'create a masterpiece', meaning: 'sáng tạo nên kiệt tác' }
          ],
          exampleSentence: 'The Mona Lisa is celebrated worldwide as Leonardo’s greatest masterpiece.',
          exampleTranslation: 'Bức họa Mona Lisa được cả thế giới tôn vinh là kiệt tác vĩ đại nhất của Leonardo.'
        },
        {
          _id: 'w_exhibition',
          word: 'exhibition',
          ipa: '/ˌeksɪˈbɪʃn/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Buổi triển lãm',
          meaningVi: 'Cuộc trưng bày tác phẩm nghệ thuật trước công chúng',
          collocations: [
            { phrase: 'art exhibition', meaning: 'triển lãm mỹ thuật' },
            { phrase: 'hold an exhibition', meaning: 'tổ chức buổi triển lãm' }
          ],
          exampleSentence: 'The museum hosted an exhibition of modern watercolor paintings.',
          exampleTranslation: 'Bảo tàng đã tổ chức một cuộc triển lãm tranh màu nước hiện đại.'
        },
        {
          _id: 'w_recreation',
          word: 'recreation',
          ipa: '/ˌrekriˈeɪʃn/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Sự tiêu khiển giải trí',
          meaningVi: 'Hoạt động tiêu khiển giúp thư giãn và phục hồi năng lượng',
          collocations: [
            { phrase: 'outdoor recreation', meaning: 'hoạt động giải trí ngoài trời' },
            { phrase: 'recreation area', meaning: 'khu vui chơi giải trí' }
          ],
          exampleSentence: 'Hiking in fresh mountain air is wonderful for health and recreation.',
          exampleTranslation: 'Đi bộ đường dài trong không khí núi trong lành rất tuyệt vời cho sức khỏe và giải trí.'
        },
        {
          _id: 'w_pottery',
          word: 'pottery',
          ipa: '/ˈpɑːtəri/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Nghề làm gốm sứ',
          meaningVi: 'Nghệ thuật nhào nặn và nung gốm sứ thủ công',
          collocations: [
            { phrase: 'pottery workshop', meaning: 'xưởng làm gốm' },
            { phrase: 'handcrafted pottery', meaning: 'gốm sứ thủ công' }
          ],
          exampleSentence: 'Molding clay during a weekend pottery workshop felt deeply therapeutic.',
          exampleTranslation: 'Tạo hình đất sét trong buổi học gốm cuối tuần mang lại cảm giác xoa dịu tâm trí sâu sắc.'
        }
      ]
    }
  ],

  'technology': [
    {
      round: 1,
      name: 'Vòng 1: Đổi mới & Kết nối số',
      promptTopic: 'Write a short paragraph (60–100 words) discussing modern technology, collaboration, and digital innovation.',
      words: [
        {
          _id: 'w_innovation',
          word: 'innovation',
          ipa: '/ˌɪnəˈveɪʃn/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Đổi mới công nghệ',
          meaningVi: 'Sự đổi mới, sáng kiến công nghệ tiên phong',
          collocations: [
            { phrase: 'technological innovation', meaning: 'đổi mới công nghệ' },
            { phrase: 'foster innovation', meaning: 'thúc đẩy sự đổi mới' }
          ],
          exampleSentence: 'Technological innovation has transformed the way people communicate.',
          exampleTranslation: 'Đổi mới công nghệ đã biến đổi cách mọi người giao tiếp.'
        },
        {
          _id: 'w_collaboration',
          word: 'collaboration',
          ipa: '/kəˌlæbəˈreɪʃn/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Hợp tác làm việc nhóm',
          meaningVi: 'Sự cộng tác, làm việc nhóm hiệu quả',
          collocations: [
            { phrase: 'online collaboration', meaning: 'hợp tác trực tuyến' },
            { phrase: 'close collaboration', meaning: 'sự cộng tác chặt chẽ' }
          ],
          exampleSentence: 'Modern digital tools encourage close collaboration among remote teams.',
          exampleTranslation: 'Các công cụ số hiện đại thúc đẩy sự hợp tác chặt chẽ giữa các đội ngũ từ xa.'
        },
        {
          _id: 'w_accessible',
          word: 'accessible',
          ipa: '/əkˈsesəbl/',
          partOfSpeech: 'adjective',
          level: 'B1',
          meaning: 'Dễ tiếp cận, tiện dụng',
          meaningVi: 'Dễ tiếp cận, có thể sử dụng rộng rãi và thuận tiện',
          collocations: [
            { phrase: 'easily accessible', meaning: 'dễ dàng tiếp cận' },
            { phrase: 'make accessible', meaning: 'làm cho có thể tiếp cận được' }
          ],
          exampleSentence: 'Cloud computing makes learning materials accessible from any connected device.',
          exampleTranslation: 'Điện toán đám mây giúp tài liệu học tập có thể tiếp cận từ bất kỳ thiết bị kết nối nào.'
        },
        {
          _id: 'w_revolutionize',
          word: 'revolutionize',
          ipa: '/ˌrevəˈluːʃənaɪz/',
          partOfSpeech: 'verb',
          level: 'B2',
          meaning: 'Cách mạng hóa, đột phá',
          meaningVi: 'Cách mạng hóa, thay đổi triệt để diện mạo',
          collocations: [
            { phrase: 'revolutionize industry', meaning: 'cách mạng hóa ngành công nghiệp' },
            { phrase: 'revolutionize education', meaning: 'tạo đột phá trong giáo dục' }
          ],
          exampleSentence: 'Artificial intelligence will revolutionize how students acquire complex skills.',
          exampleTranslation: 'Trí tuệ nhân tạo sẽ cách mạng hóa cách học sinh tiếp thu những kỹ năng phức tạp.'
        }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Tự động hóa & An ninh mạng',
      promptTopic: 'Write a short paragraph (60–100 words) explaining how automation, algorithms, and cybersecurity safeguard modern digital infrastructure.',
      words: [
        {
          _id: 'w_automation',
          word: 'automation',
          ipa: '/ˌɔːtəˈmeɪʃn/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Tự động hóa thông minh',
          meaningVi: 'Hệ thống tự động hóa vận hành không cần thao tác thủ công',
          collocations: [
            { phrase: 'process automation', meaning: 'tự động hóa quy trình' },
            { phrase: 'industrial automation', meaning: 'tự động hóa công nghiệp' }
          ],
          exampleSentence: 'Workflow automation frees knowledge workers from repetitive administrative chores.',
          exampleTranslation: 'Tự động hóa quy trình giúp người lao động thoát khỏi các tác vụ hành chính lặp đi lặp lại.'
        },
        {
          _id: 'w_cybersecurity',
          word: 'cybersecurity',
          ipa: '/ˈsaɪbərsɪkjʊrəti/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'An ninh mạng, bảo mật',
          meaningVi: 'Biện pháp bảo vệ an toàn cho hệ thống mạng và dữ liệu số',
          collocations: [
            { phrase: 'cybersecurity measures', meaning: 'các biện pháp an ninh mạng' },
            { phrase: 'robust cybersecurity', meaning: 'hệ thống bảo mật mạng vững chắc' }
          ],
          exampleSentence: 'Enterprises invest heavily in robust cybersecurity to prevent data breaches.',
          exampleTranslation: 'Các doanh nghiệp đầu tư mạnh vào an ninh mạng vững chắc để ngăn chặn rò rỉ dữ liệu.'
        },
        {
          _id: 'w_algorithm',
          word: 'algorithm',
          ipa: '/ˈælɡərɪðəm/',
          partOfSpeech: 'noun',
          level: 'B1',
          meaning: 'Thuật toán tính toán',
          meaningVi: 'Quy trình thuật toán logic xử lý dữ liệu và bài toán',
          collocations: [
            { phrase: 'search algorithm', meaning: 'thuật toán tìm kiếm' },
            { phrase: 'complex algorithm', meaning: 'thuật toán phức tạp' }
          ],
          exampleSentence: 'Recommendation algorithms curate personalized study materials for each learner.',
          exampleTranslation: 'Các thuật toán gợi ý tuyển chọn tài liệu học tập cá nhân hóa cho từng người học.'
        },
        {
          _id: 'w_infrastructure',
          word: 'infrastructure',
          ipa: '/ˈɪnfrəstrʌktʃər/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Cơ sở hạ tầng số',
          meaningVi: 'Cơ sở hạ tầng phần cứng, mạng và hệ thống cốt lõi',
          collocations: [
            { phrase: 'digital infrastructure', meaning: 'cơ sở hạ tầng kỹ thuật số' },
            { phrase: 'critical infrastructure', meaning: 'hạ tầng trọng yếu' }
          ],
          exampleSentence: 'Upgrading high-speed network infrastructure accelerates economic digitalization.',
          exampleTranslation: 'Nâng cấp cơ sở hạ tầng mạng tốc độ cao thúc đẩy nhanh tiến trình chuyển đổi số nền kinh tế.'
        }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Công nghệ tiên phong & Đột phá',
      promptTopic: 'Write a short paragraph (60–100 words) exploring cutting-edge breakthroughs in artificial intelligence and scalable systems.',
      words: [
        {
          _id: 'w_cutting_edge',
          word: 'cutting-edge',
          ipa: '/ˌkʌtɪŋ ˈedʒ/',
          partOfSpeech: 'adjective',
          level: 'B2',
          meaning: 'Tiên tiến nhất, tối tân',
          meaningVi: 'Hiện đại và tiên tiến hàng đầu trong công nghệ',
          collocations: [
            { phrase: 'cutting-edge technology', meaning: 'công nghệ tiên tiến nhất' },
            { phrase: 'cutting-edge research', meaning: 'nghiên cứu mũi nhọn hàng đầu' }
          ],
          exampleSentence: 'The laboratory develops cutting-edge technologies to enhance human health.',
          exampleTranslation: 'Phòng thí nghiệm phát triển những công nghệ tiên tiến nhất nhằm nâng cao sức khỏe con người.'
        },
        {
          _id: 'w_breakthrough',
          word: 'breakthrough',
          ipa: '/ˈbreɪkθruː/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Bước đột phá vĩ đại',
          meaningVi: 'Phát minh, phát hiện mang tính bước ngoặt đột phá',
          collocations: [
            { phrase: 'major breakthrough', meaning: 'bước đột phá lớn' },
            { phrase: 'scientific breakthrough', meaning: 'đột phá khoa học' }
          ],
          exampleSentence: 'Deep learning represents a monumental breakthrough in artificial intelligence.',
          exampleTranslation: 'Học sâu là một bước đột phá kỳ vĩ trong lĩnh vực trí tuệ nhân tạo.'
        },
        {
          _id: 'w_scalability',
          word: 'scalability',
          ipa: '/ˌskeɪləˈbɪləti/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Khả năng mở rộng',
          meaningVi: 'Khả năng mở rộng quy mô hệ thống khi lưu lượng tăng trưởng',
          collocations: [
            { phrase: 'system scalability', meaning: 'khả năng mở rộng của hệ thống' },
            { phrase: 'ensure scalability', meaning: 'đảm bảo tính mở rộng quy mô' }
          ],
          exampleSentence: 'Cloud architecture guarantees the seamless scalability of our educational platform.',
          exampleTranslation: 'Kiến trúc đám mây đảm bảo khả năng mở rộng mượt mà cho nền tảng giáo dục của chúng tôi.'
        },
        {
          _id: 'w_data_driven',
          word: 'data-driven',
          ipa: '/ˈdeɪtə drɪvn/',
          partOfSpeech: 'adjective',
          level: 'B2',
          meaning: 'Dựa trên dữ liệu',
          meaningVi: 'Được định hướng và quyết định dựa trên phân tích dữ liệu thực tế',
          collocations: [
            { phrase: 'data-driven decisions', meaning: 'quyết định dựa trên dữ liệu' },
            { phrase: 'data-driven insights', meaning: 'thông tin chuyên sâu từ dữ liệu' }
          ],
          exampleSentence: 'LexiGrow uses data-driven learning paths to strengthen vocabulary retention.',
          exampleTranslation: 'LexiGrow sử dụng lộ trình học tập dựa trên dữ liệu để củng cố khả năng ghi nhớ từ vựng.'
        }
      ]
    }
  ],

  'environment': [
    {
      round: 1,
      name: 'Vòng 1: Sinh thái & Phát triển bền vững',
      promptTopic: 'Write a short paragraph (60–100 words) about environmental protection, ecosystems, and sustainable development.',
      words: [
        {
          _id: 'w_sustainable',
          word: 'sustainable',
          ipa: '/səˈsteɪnəbl/',
          partOfSpeech: 'adjective',
          level: 'B2',
          meaning: 'Bền vững, xanh',
          meaningVi: 'Bền vững, thân thiện với môi trường lâu dài',
          collocations: [
            { phrase: 'sustainable development', meaning: 'phát triển bền vững' },
            { phrase: 'sustainable energy', meaning: 'năng lượng bền vững' }
          ],
          exampleSentence: 'Adopting sustainable lifestyle habits protects natural resources for future generations.',
          exampleTranslation: 'Áp dụng thói quen sống bền vững bảo vệ tài nguyên thiên nhiên cho các thế hệ tương lai.'
        },
        {
          _id: 'w_biodiversity',
          word: 'biodiversity',
          ipa: '/ˌbaɪoʊdaɪˈvɜːrsəti/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Đa dạng sinh học',
          meaningVi: 'Sự phong phú, đa dạng giống loài sinh học trong tự nhiên',
          collocations: [
            { phrase: 'preserve biodiversity', meaning: 'bảo tồn đa dạng sinh học' },
            { phrase: 'rich biodiversity', meaning: 'sự đa dạng sinh học phong phú' }
          ],
          exampleSentence: 'Conserving virgin rainforests is essential to preserve rich biodiversity.',
          exampleTranslation: 'Bảo tồn các khu rừng mưa nguyên sinh là điều cốt yếu để duy trì sự đa dạng sinh học phong phú.'
        },
        {
          _id: 'w_ecosystem',
          word: 'ecosystem',
          ipa: '/ˈiːkoʊsɪstəm/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Hệ sinh thái tự nhiên',
          meaningVi: 'Hệ sinh thái liên kết giữa sinh vật và môi trường sống',
          collocations: [
            { phrase: 'fragile ecosystem', meaning: 'hệ sinh thái dễ tổn thương' },
            { phrase: 'healthy ecosystem', meaning: 'hệ sinh thái lành mạnh' }
          ],
          exampleSentence: 'Industrial pollution disrupts the fragile marine ecosystem significantly.',
          exampleTranslation: 'Ô nhiễm công nghiệp làm xáo trộn nghiêm trọng hệ sinh thái biển dễ tổn thương.'
        }
      ]
    },
    {
      round: 2,
      name: 'Vòng 2: Bảo tồn & Giảm phát thải khí nhà kính',
      promptTopic: 'Write a short paragraph (60–100 words) discussing conservation efforts, renewable energy adoption, and curtailing greenhouse emissions.',
      words: [
        {
          _id: 'w_conservation',
          word: 'conservation',
          ipa: '/ˌkɑːnsərˈveɪʃn/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Bảo tồn thiên nhiên',
          meaningVi: 'Sự bảo tồn và bảo vệ tài nguyên thiên nhiên, động vật hoang dã',
          collocations: [
            { phrase: 'wildlife conservation', meaning: 'bảo tồn động vật hoang dã' },
            { phrase: 'energy conservation', meaning: 'tiết kiệm năng lượng' }
          ],
          exampleSentence: 'Effective wildlife conservation projects prevent rare species from dying out.',
          exampleTranslation: 'Các dự án bảo tồn động vật hoang dã hiệu quả giúp các loài quý hiếm không bị tuyệt chủng.'
        },
        {
          _id: 'w_renewable',
          word: 'renewable',
          ipa: '/rɪˈnuːəbl/',
          partOfSpeech: 'adjective',
          level: 'B1',
          meaning: 'Năng lượng tái tạo',
          meaningVi: 'Tái tạo được, nguồn năng lượng sạch vô tận',
          collocations: [
            { phrase: 'renewable energy', meaning: 'năng lượng tái tạo' },
            { phrase: 'renewable resources', meaning: 'nguồn tài nguyên tái tạo' }
          ],
          exampleSentence: 'Transitioning to renewable solar energy drastically cuts carbon pollution.',
          exampleTranslation: 'Chuyển đổi sang năng lượng mặt trời tái tạo giúp cắt giảm mạnh mẽ ô nhiễm carbon.'
        },
        {
          _id: 'w_emissions',
          word: 'emissions',
          ipa: '/ɪˈmɪʃnz/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Khí thải ô nhiễm',
          meaningVi: 'Khí thải độc hại xả ra môi trường',
          collocations: [
            { phrase: 'greenhouse gas emissions', meaning: 'khí thải nhà kính' },
            { phrase: 'zero emissions', meaning: 'không phát thải' }
          ],
          exampleSentence: 'Nations worldwide pledge to reduce industrial emissions by fifty percent.',
          exampleTranslation: 'Các quốc gia trên thế giới cam kết giảm năm mươi phần trăm lượng khí thải công nghiệp.'
        },
        {
          _id: 'w_deforestation',
          word: 'deforestation',
          ipa: '/diːˌfɔːrɪˈsteɪʃn/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Nạn tàn phá rừng',
          meaningVi: 'Sự phá rừng quy mô lớn làm mất cân bằng sinh thái',
          collocations: [
            { phrase: 'halt deforestation', meaning: 'chấm dứt nạn phá rừng' },
            { phrase: 'illegal deforestation', meaning: 'nạn phá rừng trái phép' }
          ],
          exampleSentence: 'Rampant deforestation threatens indigenous wildlife and worsens global warming.',
          exampleTranslation: 'Nạn phá rừng tràn lan đe dọa động vật hoang dã bản địa và làm trầm trọng thêm sự nóng lên toàn cầu.'
        }
      ]
    },
    {
      round: 3,
      name: 'Vòng 3: Dấu chân carbon & Khủng hoảng khí hậu',
      promptTopic: 'Write a short paragraph (60–100 words) on shrinking individual carbon footprints, preventing contamination, and resource preservation.',
      words: [
        {
          _id: 'w_carbon_footprint',
          word: 'carbon footprint',
          ipa: '/ˌkɑːrbən ˈfʊtprɪnt/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Dấu chân carbon',
          meaningVi: 'Tổng lượng khí thải carbon do một cá nhân hoặc tổ chức tạo ra',
          collocations: [
            { phrase: 'reduce carbon footprint', meaning: 'giảm dấu chân carbon' },
            { phrase: 'track carbon footprint', meaning: 'theo dõi dấu chân carbon' }
          ],
          exampleSentence: 'Commuting by bicycle helps eco-conscious citizens reduce their carbon footprint.',
          exampleTranslation: 'Đi lại bằng xe đạp giúp các công dân có ý thức sinh thái giảm bớt dấu chân carbon của mình.'
        },
        {
          _id: 'w_contamination',
          word: 'contamination',
          ipa: '/kənˌtæmɪˈneɪʃn/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Sự ô nhiễm độc hại',
          meaningVi: 'Tình trạng ô nhiễm đất, nước hoặc không khí bởi chất độc',
          collocations: [
            { phrase: 'water contamination', meaning: 'sự ô nhiễm nguồn nước' },
            { phrase: 'prevent contamination', meaning: 'ngăn chặn sự ô nhiễm' }
          ],
          exampleSentence: 'Strict sewage treatment rules prevent chemical contamination of local rivers.',
          exampleTranslation: 'Quy chuẩn xử lý nước thải nghiêm ngặt giúp ngăn ngừa ô nhiễm hóa chất ở các dòng sông địa phương.'
        },
        {
          _id: 'w_preservation',
          word: 'preservation',
          ipa: '/ˌprezərˈveɪʃn/',
          partOfSpeech: 'noun',
          level: 'B2',
          meaning: 'Sự gìn giữ bảo tồn',
          meaningVi: 'Việc giữ gìn nguyên trạng cảnh quan thiên nhiên và môi trường',
          collocations: [
            { phrase: 'environmental preservation', meaning: 'bảo tồn môi trường tự nhiên' },
            { phrase: 'habitat preservation', meaning: 'gìn giữ sinh cảnh sống' }
          ],
          exampleSentence: 'The preservation of national parks guarantees a sanctuary for endangered fauna.',
          exampleTranslation: 'Việc bảo tồn các vườn quốc gia đảm bảo nơi trú ẩn an toàn cho quần thể động vật nguy cấp.'
        },
        {
          _id: 'w_depletion',
          word: 'depletion',
          ipa: '/dɪˈpliːʃn/',
          partOfSpeech: 'noun',
          level: 'C1',
          meaning: 'Sự cạn kiệt tài nguyên',
          meaningVi: 'Sự suy kiệt, cạn kiệt các nguồn tài nguyên thiên nhiên',
          collocations: [
            { phrase: 'resource depletion', meaning: 'sự cạn kiệt tài nguyên' },
            { phrase: 'ozone depletion', meaning: 'suy giảm tầng ozone' }
          ],
          exampleSentence: 'Overfishing causes rapid depletion of marine populations across ocean trenches.',
          exampleTranslation: 'Đánh bắt quá mức dẫn đến sự cạn kiệt nhanh chóng các quần thể sinh vật biển.'
        }
      ]
    }
  ]
}

/**
 * Helper to get the active vocabulary round for a topic set.
 * If round exceeds available rounds, wraps around or advances gracefully.
 */
export function getTopicRound(slug, roundNumber = 1) {
  const rounds = TOPIC_VOCABULARY_ROUNDS[slug] || []
  if (!rounds.length) return null
  const idx = Math.max(0, (roundNumber - 1) % rounds.length)
  return rounds[idx]
}
