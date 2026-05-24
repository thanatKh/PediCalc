// App-level constants — fixed regardless of which hospital is selected
// logoForPdf / themeColor on each hospital entry are used only in the PDF
export const APP_LOGO  = '/logo-pedicale.PNG';
export const APP_COLOR = '#0d6e6e'; // brand teal — always used for web UI chrome

export const HOSPITALS = {
  kabinburi: {
    id:          'kabinburi',
    nameTh:      'โรงพยาบาลกบินทร์บุรี',
    nameEn:      'Kabinburi Hospital',
    shortName:   'Kabinburi Hospital',
    logo:        '/logo-kabinburi.PNG',
    logoSidebar: '/logo-kabinburi-white.PNG',
    logoForPdf:  '/logo-kabinburi.PNG',
    themeColor:  '#0d6e6e',
    sidebarBg:   '#0d6e6e',
  },
  abhaibhubejhr: {
    id:          'abhaibhubejhr',
    nameTh:      'โรงพยาบาลเจ้าพระยาอภัยภูเบศร',
    nameEn:      'Chaophraya Abhaibhubejhr Hospital',
    shortName:   'Abhaibhubejhr Hospital',
    logo:        '/logo-abhaibhubejhr.png',
    logoSidebar: '/logo-abhaibhubejhr-white.png',
    logoForPdf:  '/logo-abhaibhubejhr.png',
    themeColor:  '#c2590a',
    sidebarBg:   '#c2590a',
  },
};

export const DEFAULT_HOSPITAL_ID = 'kabinburi';
