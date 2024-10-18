// utils/randomData.ts
export const getRandomAbout = (): string => {
  const aboutOptions = [
    'Это одно из лучших занятий, которое вы найдете в нашем городе!',
    'Здесь вы получите невероятный опыт и много полезных навыков.',
    'Идеально подходит для начинающих и продвинутых участников.',
    'Отличное место для обучения и развития навыков.',
    'Это занятие разработано для всех возрастов и уровней подготовки.',
  ];
  return aboutOptions[Math.floor(Math.random() * aboutOptions.length)];
};
