import { initReactI18next, useTranslation } from 'react-i18next';
import i18n from 'i18next';
import yaml from 'js-yaml';

import deYaml from '../assets/lang/de.yaml?raw';
import enYaml from '../assets/lang/en.yaml?raw';
import frYaml from '../assets/lang/fr.yaml?raw';
import jpYaml from '../assets/lang/jp.yaml?raw';
import cnYaml from '../assets/lang/cn.yaml?raw';

import esYaml from '../assets/lang/es.yaml?raw';
import itYaml from '../assets/lang/it.yaml?raw';
import ptYaml from '../assets/lang/pt.yaml?raw';
import nlYaml from '../assets/lang/nl.yaml?raw';
import uaYaml from '../assets/lang/ua.yaml?raw';
import ruYaml from '../assets/lang/ru.yaml?raw';

interface ResourceLanguage {
  [key: string]: any;
}

interface Resources {
  [key: string]: ResourceLanguage;
}

const resources: Resources = {
  de: { translation: yaml.load(deYaml) },
  en: { translation: yaml.load(enYaml) },
  fr: { translation: yaml.load(frYaml) },
  es: { translation: yaml.load(esYaml) },
  it: { translation: yaml.load(itYaml) },
  pt: { translation: yaml.load(ptYaml) },
  nl: { translation: yaml.load(nlYaml) },
  jp: { translation: yaml.load(jpYaml) },
  cn: { translation: yaml.load(cnYaml) },
  ua: { translation: yaml.load(uaYaml) },
  ru: { translation: yaml.load(ruYaml) },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'de',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const useTranslationProvider = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return { t, i18n, changeLanguage };
};

export default i18n;
