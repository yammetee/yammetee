import type { Language } from './i18n';

export type LegalDocKey = 'privacy' | 'terms' | 'cookies' | 'copyright';

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

interface LegalDocument {
  title: string;
  effectiveDateLabel: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_VERSION = '2026-03-10';

export const legalDocuments: Record<Language, Record<LegalDocKey, LegalDocument>> = {
  en: {
    privacy: {
      title: 'Privacy Policy',
      effectiveDateLabel: 'Effective date',
      effectiveDate: 'March 10, 2026',
      intro: 'This policy explains how Yamme Tee website collects, uses, stores, and protects personal data.',
      sections: [
        {
          heading: 'What we collect',
          paragraphs: [
            'We collect account data (email and password hash handled by Supabase Auth), profile data you provide, likes, comments, and technical logs required for website security and operation.',
          ],
        },
        {
          heading: 'Why we process data',
          paragraphs: [
            'Data is processed to create and maintain accounts, provide personalized features (likes, profile, wall), prevent abuse, and improve website performance.',
          ],
        },
        {
          heading: 'Cookies and analytics',
          paragraphs: [
            'Essential cookies are used for authentication and security. Optional analytics is enabled only after your consent.',
          ],
        },
        {
          heading: 'Data sharing',
          paragraphs: [
            'We use service providers (for example hosting and Supabase infrastructure) to process data on our behalf. We do not sell personal data.',
          ],
        },
        {
          heading: 'Retention and deletion',
          paragraphs: [
            'We keep data while your account is active or while needed for legal and security obligations. You can request account/data deletion via the contact listed below.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'Depending on your region, you may have rights to access, correct, export, or delete your personal data and to withdraw consent for optional processing.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            'For privacy requests, contact: yammetee46@gmail.com',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of Use',
      effectiveDateLabel: 'Effective date',
      effectiveDate: 'March 10, 2026',
      intro: 'By creating an account or using this website, you agree to these Terms of Use.',
      sections: [
        {
          heading: 'Accounts',
          paragraphs: [
            'You must provide accurate information and keep your account credentials secure. You are responsible for activity under your account.',
          ],
        },
        {
          heading: 'Allowed use',
          paragraphs: [
            'Do not use the website for unlawful, abusive, or harmful behavior, including attempts to bypass security or disrupt services.',
          ],
        },
        {
          heading: 'User content',
          paragraphs: [
            'If you post comments or profile content, you remain responsible for what you publish and must have the rights to publish it.',
          ],
        },
        {
          heading: 'Intellectual property',
          paragraphs: [
            'Music, branding, images, and website content are protected by copyright and related rights unless stated otherwise.',
          ],
        },
        {
          heading: 'Service changes',
          paragraphs: [
            'We may update, suspend, or discontinue parts of the website, and may update these Terms when needed.',
          ],
        },
        {
          heading: 'Limitation of liability',
          paragraphs: [
            'The service is provided as available. To the maximum extent allowed by law, we are not liable for indirect or consequential damages.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            'For legal questions, contact: yammetee46@gmail.com',
          ],
        },
      ],
    },
    cookies: {
      title: 'Cookie Policy',
      effectiveDateLabel: 'Effective date',
      effectiveDate: 'March 10, 2026',
      intro: 'This policy explains how cookies and similar technologies are used on the website.',
      sections: [
        {
          heading: 'Essential cookies',
          paragraphs: [
            'Essential cookies support login sessions, security checks, and fraud prevention. These are required for core functionality.',
          ],
        },
        {
          heading: 'Analytics cookies',
          paragraphs: [
            'Analytics helps us understand aggregated traffic and improve user experience. Analytics is used only if you accept it via the cookie banner.',
          ],
        },
        {
          heading: 'Managing your choice',
          paragraphs: [
            'You can reject optional analytics in the cookie banner. Browser settings can also be used to delete or block cookies.',
          ],
        },
        {
          heading: 'Contact',
          paragraphs: [
            'Questions about cookies: yammetee46@gmail.com',
          ],
        },
      ],
    },
    copyright: {
      title: 'Copyright & Takedown Policy',
      effectiveDateLabel: 'Effective date',
      effectiveDate: 'March 10, 2026',
      intro: 'We respect intellectual property rights and respond to valid copyright complaints.',
      sections: [
        {
          heading: 'Ownership',
          paragraphs: [
            'Unless specified otherwise, tracks, artwork, and branding on this website belong to Yamme Tee and/or authorized rightsholders.',
          ],
        },
        {
          heading: 'Notice of infringement',
          paragraphs: [
            'If you believe content infringes your rights, send a notice with your identity, proof of rights, exact URL, and a good-faith statement.',
          ],
        },
        {
          heading: 'Takedown process',
          paragraphs: [
            'After receiving a valid notice, we review it and may remove or restrict access to disputed content.',
          ],
        },
        {
          heading: 'Counter notice',
          paragraphs: [
            'If your content was removed by mistake, you may send a counter notice with supporting information.',
          ],
        },
        {
          heading: 'Copyright contact',
          paragraphs: [
            'Send notices to: yammetee46@gmail.com',
          ],
        },
      ],
    },
  },
  ru: {
    privacy: {
      title: 'Политика конфиденциальности',
      effectiveDateLabel: 'Дата вступления в силу',
      effectiveDate: '10 марта 2026',
      intro: 'Эта политика объясняет, как сайт Yamme Tee собирает, использует, хранит и защищает персональные данные.',
      sections: [
        {
          heading: 'Какие данные мы собираем',
          paragraphs: [
            'Мы собираем данные аккаунта (email и хэш пароля через Supabase Auth), данные профиля, лайки, комментарии и технические логи, необходимые для безопасности и работы сайта.',
          ],
        },
        {
          heading: 'Зачем мы обрабатываем данные',
          paragraphs: [
            'Данные обрабатываются для создания и поддержки аккаунтов, предоставления персональных функций (лайки, профиль, стена), предотвращения злоупотреблений и улучшения работы сайта.',
          ],
        },
        {
          heading: 'Cookie и аналитика',
          paragraphs: [
            'Обязательные cookie используются для авторизации и безопасности. Дополнительная аналитика включается только после вашего согласия.',
          ],
        },
        {
          heading: 'Передача данных',
          paragraphs: [
            'Мы используем сервис-провайдеров (например, хостинг и инфраструктуру Supabase), которые обрабатывают данные по нашему поручению. Мы не продаем персональные данные.',
          ],
        },
        {
          heading: 'Срок хранения и удаление',
          paragraphs: [
            'Мы храним данные, пока аккаунт активен или пока это требуется по закону и для безопасности. Вы можете запросить удаление аккаунта/данных по контактам ниже.',
          ],
        },
        {
          heading: 'Ваши права',
          paragraphs: [
            'В зависимости от юрисдикции вы можете иметь право на доступ, исправление, экспорт или удаление персональных данных, а также на отзыв согласия для необязательной обработки.',
          ],
        },
        {
          heading: 'Контакт',
          paragraphs: [
            'По вопросам приватности: yammetee46@gmail.com',
          ],
        },
      ],
    },
    terms: {
      title: 'Условия использования',
      effectiveDateLabel: 'Дата вступления в силу',
      effectiveDate: '10 марта 2026',
      intro: 'Создавая аккаунт или используя сайт, вы принимаете эти Условия использования.',
      sections: [
        {
          heading: 'Аккаунты',
          paragraphs: [
            'Вы обязуетесь предоставлять корректные данные и хранить учетные данные в безопасности. Вы несете ответственность за действия в вашем аккаунте.',
          ],
        },
        {
          heading: 'Допустимое использование',
          paragraphs: [
            'Запрещено использовать сайт для незаконной, оскорбительной или вредоносной деятельности, включая попытки обхода защиты и нарушения работы сервиса.',
          ],
        },
        {
          heading: 'Контент пользователей',
          paragraphs: [
            'Если вы публикуете комментарии или данные профиля, вы несете ответственность за этот контент и должны иметь права на его публикацию.',
          ],
        },
        {
          heading: 'Интеллектуальная собственность',
          paragraphs: [
            'Музыка, брендинг, изображения и контент сайта защищены авторским правом и смежными правами, если не указано иное.',
          ],
        },
        {
          heading: 'Изменения сервиса',
          paragraphs: [
            'Мы можем изменять, приостанавливать или прекращать работу отдельных частей сайта, а также обновлять эти Условия при необходимости.',
          ],
        },
        {
          heading: 'Ограничение ответственности',
          paragraphs: [
            'Сервис предоставляется по принципу «как есть». В максимально допустимой законом степени мы не отвечаем за косвенные убытки.',
          ],
        },
        {
          heading: 'Контакт',
          paragraphs: [
            'По юридическим вопросам: yammetee46@gmail.com',
          ],
        },
      ],
    },
    cookies: {
      title: 'Политика cookie',
      effectiveDateLabel: 'Дата вступления в силу',
      effectiveDate: '10 марта 2026',
      intro: 'Эта политика объясняет, как на сайте используются cookie и схожие технологии.',
      sections: [
        {
          heading: 'Обязательные cookie',
          paragraphs: [
            'Обязательные cookie обеспечивают сессии входа, проверки безопасности и защиту от злоупотреблений. Они нужны для базовой функциональности.',
          ],
        },
        {
          heading: 'Аналитические cookie',
          paragraphs: [
            'Аналитика помогает понимать агрегированный трафик и улучшать пользовательский опыт. Аналитика включается только при вашем согласии в баннере cookie.',
          ],
        },
        {
          heading: 'Управление выбором',
          paragraphs: [
            'Вы можете отказаться от необязательной аналитики в баннере cookie. Также можно удалить или заблокировать cookie в настройках браузера.',
          ],
        },
        {
          heading: 'Контакт',
          paragraphs: [
            'Вопросы по cookie: yammetee46@gmail.com',
          ],
        },
      ],
    },
    copyright: {
      title: 'Авторские права и порядок удаления контента',
      effectiveDateLabel: 'Дата вступления в силу',
      effectiveDate: '10 марта 2026',
      intro: 'Мы уважаем права интеллектуальной собственности и реагируем на обоснованные жалобы о нарушении авторских прав.',
      sections: [
        {
          heading: 'Правообладание',
          paragraphs: [
            'Если не указано иное, треки, обложки и бренд-материалы на сайте принадлежат Yamme Tee и/или уполномоченным правообладателям.',
          ],
        },
        {
          heading: 'Жалоба о нарушении',
          paragraphs: [
            'Если вы считаете, что контент нарушает ваши права, отправьте обращение с данными заявителя, подтверждением прав, точным URL и заявлением о добросовестности.',
          ],
        },
        {
          heading: 'Процедура удаления',
          paragraphs: [
            'После получения корректной жалобы мы проверяем ее и можем удалить или ограничить доступ к спорному контенту.',
          ],
        },
        {
          heading: 'Встречное уведомление',
          paragraphs: [
            'Если ваш контент удален по ошибке, вы можете направить встречное уведомление с подтверждающей информацией.',
          ],
        },
        {
          heading: 'Контакт по авторским правам',
          paragraphs: [
            'Отправляйте обращения на: yammetee46@gmail.com',
          ],
        },
      ],
    },
  },
};
