export const dictionaries = {
  en: {
    navigation: {
      tracks: 'Tracks',
      videos: 'Videos',
      about: 'About',
      wall: 'Wall',
    },
    tracks: {
      title: 'Tracks',
      description: 'My music tracks.',
      loading: 'Loading tracks...',
      lyrics: 'Lyrics',
    },
    videos: {
      title: 'Videos',
      description: 'List of videos will be here.',
    },
    about: {
      title: 'About Me',
      description: 'Information about Yamme Tee.',
    },
    wall: {
      title: 'Your Opinion',
      description: 'Hey there! I\'d love to hear what you think about my music. Share your opinion or suggestions below! 😊',
      name: 'Name',
      comment: 'Comment',
      submit: 'Add',
      submitting: 'Adding...',
      success: 'Comment added successfully!',
      duplicate: 'You can only leave one comment.',
      error: 'Failed to add comment.',
      fillFields: 'Please fill in all fields.',
      public: 'Public',
      anonymous: 'Anonymous',
      cancel: 'Cancel',
      note: 'Note: You can only leave one comment per person. Be careful with what you write.',
    },
  },
  ru: {
    navigation: {
      tracks: 'Треки',
      videos: 'Видео',
      about: 'Обо мне',
      wall: 'Стена',
    },
    tracks: {
      title: 'Треки',
      description: 'Мои музыкальные треки.',
      loading: 'Загрузка треков...',
      lyrics: 'Текст песни',
    },
    videos: {
      title: 'Видео',
      description: 'Здесь будет список видео.',
    },
    about: {
      title: 'Обо мне',
      description: 'Информация о Yamme Tee.',
    },
    wall: {
      title: 'Ваше мнение',
      description: 'Привет! Мне очень интересно узнать, что вы думаете о моей музыке. Поделитесь своим мнением или пожеланиями ниже! 😊',
      name: 'Имя',
      comment: 'Комментарий',
      submit: 'Добавить',
      submitting: 'Добавление...',
      success: 'Комментарий добавлен успешно!',
      duplicate: 'Вы можете оставить только один комментарий.',
      error: 'Не удалось добавить комментарий.',
      fillFields: 'Пожалуйста, заполните все поля.',
      public: 'Публичный',
      anonymous: 'Анонимный',
      cancel: 'Отмена',
      note: 'Примечание: Вы можете оставить только один комментарий на человека. Будьте осторожны с тем, что пишете.',
    },
  },
};

export type Language = 'en' | 'ru';
export type Dictionary = typeof dictionaries.en;