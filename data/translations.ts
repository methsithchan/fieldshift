export type LanguageCode = "en" | "si" | "ta";

export interface TranslationStrings {
  appTitle: string;
  appSubtitle: string;
  stepIndicator: (current: number, total: number) => string;
  back: string;
  next: string;
  viewResults: string;
  needHelp: string;
  helpSheetTitle: string;
  askQuestionPlaceholder: string;
  askButton: string;
  askingStatus: string;
  helpDisclaimer: string;
  
  // Role Selection (step 0)
  roleTitle: string;
  roleSubtitle: string;
  farmerRoleLabel: string;
  farmerRoleHint: string;
  researcherRoleLabel: string;
  researcherRoleHint: string;

  // Step 1: Language
  langStepTitle: string;
  langStepSubtitle: string;

  // Step 2: Location
  locStepTitle: string;
  locStepSubtitle: string;
  useMyLocation: string;
  locating: string;
  noStoreNotice: string;
  orSelectPreset: string;
  selectDistrictPrompt: string;
  locDeniedError: string;
  selectedLocation: string;
  outsideDryZoneWarning: string;

  // Step 3: Current Crops
  currentCropTitle: string;
  currentCropSubtitle: string;
  mahaLabel: string;
  yalaLabel: string;
  selectMahaPrompt: string;
  selectYalaPrompt: string;

  // Step 4: Considered Crops
  consideredCropTitle: string;
  consideredCropSubtitle: string;
  selectAnyHint: string;
  noneSelectedFallback: string;

  // Step 5: Results
  resultsTitle: string;
  resultsSubtitle: string;
  strategyATitle: string;
  strategyBTitle: string;
  strategyCTitle: string;
  currentRotationBadge: string;
  legumeAltBadge: string;
  diversifiedAltBadge: string;
  rainfallSummaryLabel: string;
  keyRisksLabel: string;
  noRisksIdentified: string;
  dataGapsLabel: string;
  noDataGaps: string;
  partialBadge: string;
  expertDetailsButton: string;
  restartWizard: string;

  // Static Screen Help Texts
  helpLanguage: string;
  helpLocation: string;
  helpCurrentCrop: string;
  helpConsideredCrops: string;
  helpResults: string;

  // Redesign Flow (Journo-style)
  journoLangTitle: string;
  journoLangSubtitle: string;
  journoRoleTitle: string;
  journoRoleSubtitle: string;
  journoRoleFarmer: string;
  journoRoleFarmerDesc: string;
  journoRoleResearcher: string;
  journoRoleResearcherDesc: string;
  journoLocTitle: string;
  journoLocSubtitle: string;
  journoUseMyLocation: string;
  journoLocating: string;
  journoOrSelectArea: string;
  journoNotStoredNote: string;
  journoCropTitle: string;
  journoCropSubtitle: string;
  journoCropSelectPlaceholder: string;
  journoContinueBtn: string;
  journoBackBtn: string;
  journoRainHeader: string;
  journoRainSubtitle: string;
  journoStrongestSeason: string;
  journoApproxSowingTime: string;
  journoIgnoresIrrigation: string;
  journoRainfallCoverageLabel: string;
  journoCoveredOfNeed: string;
  journoUnverifiedWaterNeed: string;
  journoHonestyAdvice: string;
  journoCrossBasisNote: string;
  journoSeeMoreBtn: string;
  journoChangeCropBtn: string;
  journoStartOverBtn: string;
  journoSeeMoreCloseBtn: string;
  journoForecastTitle: string;
  journoNext7DaysForecast: (mm: number) => string;
  journoUsualWeeklyRain: (mm: number, source: string) => string;
  journoForecastAttribution: string;
  journoSriLankaTimeLabel: string;

  // Localized crop names
  crops: Record<string, string>;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationStrings> = {
  en: {
    appTitle: "Field Shift",
    appSubtitle: "Farmer Crop Rotation Guide",
    stepIndicator: (current, total) => `Step ${current} of ${total}`,
    back: "Back",
    next: "Next",
    viewResults: "View Crop Rotation Options",
    needHelp: "Need Help?",
    helpSheetTitle: "Farmer Support & Guidance",
    askQuestionPlaceholder: "Ask a question about this screen...",
    askButton: "Ask",
    askingStatus: "Consulting guide...",
    helpDisclaimer:
      "This guide does not prescribe pesticide, fertilizer dosage, or yield predictions. Please consult your local Agrarian Service Centre or Department of Agriculture extension officer for field-specific advice.",

    langStepTitle: "Choose Your Language",
    langStepSubtitle: "Select the language you want to use throughout the guide.",

    roleTitle: "Who are you?",
    roleSubtitle: "Choose your role to get started.",
    farmerRoleLabel: "🌾 I am a Farmer",
    farmerRoleHint: "Simple crop rotation guide",
    researcherRoleLabel: "🔬 I am a Researcher",
    researcherRoleHint: "Expert data, charts & soil analysis",

    locStepTitle: "Where is your farm?",
    locStepSubtitle: "We use 11 years of NASA satellite rainfall data for your area.",
    useMyLocation: "📍 Use My Location",
    locating: "Detecting location...",
    noStoreNotice: "Privacy note: We do not save or share your location. It is only used to look up local seasonal rainfall.",
    orSelectPreset: "Or choose an agricultural area:",
    selectDistrictPrompt: "Select an area preset",
    locDeniedError: "Could not access location. Please pick your area from the list below.",
    selectedLocation: "Selected location",
    outsideDryZoneWarning: "⚠️ Outside approximate Dry Zone: Research values come from Dry Zone stations; results elsewhere are directional only.",

    currentCropTitle: "What do you grow now?",
    currentCropSubtitle: "Pick your primary crop for the major Maha season and the minor Yala season.",
    mahaLabel: "Maha Season (Main monsoon: Oct – Mar)",
    yalaLabel: "Yala Season (Minor season: Apr – Sep)",
    selectMahaPrompt: "Select crop for Maha",
    selectYalaPrompt: "Select crop for Yala",

    consideredCropTitle: "Which other crops would you consider?",
    consideredCropSubtitle: "Choose one or more crops you are open to growing to explore alternatives.",
    selectAnyHint: "Tap to select or deselect crops:",
    noneSelectedFallback: "No other crops selected — showing recommended Dry Zone legume and cereal rotations.",

    resultsTitle: "Your Crop Rotation Options",
    resultsSubtitle: "Compare your current practice with resilient Dry Zone alternatives.",
    strategyATitle: "Strategy A: Your Current Rotation",
    strategyBTitle: "Strategy B: Legume Integration",
    strategyCTitle: "Strategy C: Diversified Rotation",
    currentRotationBadge: "Your Farm Baseline",
    legumeAltBadge: "Soil-Enriching Legume",
    diversifiedAltBadge: "Multi-Crop Resilient",
    rainfallSummaryLabel: "Rainfall Coverage",
    keyRisksLabel: "Agronomic Considerations & Risks",
    noRisksIdentified: "No specific high risks flagged under standard Dry Zone rainfall.",
    dataGapsLabel: "Information Gaps",
    noDataGaps: "Key seasonal water requirements documented.",
    partialBadge: "Partial data (not comparable)",
    expertDetailsButton: "📊 Open Expert Details (Interactive Map, Charts & Soil Form) →",
    restartWizard: "↻ Start Over",

    helpLanguage: "Select English, Sinhala, or Tamil. You can change your language at any time.",
    helpLocation: "Click 'Use My Location' for automatic GPS coordinates, or pick your nearest agricultural town from the list. This loads 11-year NASA weather observations for your area.",
    helpCurrentCrop: "Select what you usually plant in Maha (Oct–Mar) and Yala (Apr–Sep). This forms Strategy A to see how much seasonal rain naturally covers your crops.",
    helpConsideredCrops: "Select other crops suitable for the Dry Zone (such as green gram or cowpea) that you might want to try. The engine will build legume and diversified comparison strategies.",
    helpResults: "These cards compare rainfall coverage (whether rain alone meets crop water needs) and soil health. They are not yield predictions. Tap 'Open Expert Details' for full charts and soil tests.",

    journoLangTitle: "Choose language",
    journoLangSubtitle: "Select your preferred language",
    journoRoleTitle: "What is your role?",
    journoRoleSubtitle: "We tailor the guide to your needs",
    journoRoleFarmer: "Farmer",
    journoRoleFarmerDesc: "Simple rain timing & crop rotation guide",
    journoRoleResearcher: "Researcher",
    journoRoleResearcherDesc: "Expert climate data, charts & soil models",
    journoLocTitle: "Where is your farm?",
    journoLocSubtitle: "We use 11 years of NASA satellite rainfall data for your area",
    journoUseMyLocation: "📍 Use my location",
    journoLocating: "Finding your location...",
    journoOrSelectArea: "Or choose an area preset:",
    journoNotStoredNote: "🔒 Location is used only to fetch NASA rain data and is never stored or shared.",
    journoCropTitle: "Select your crop",
    journoCropSubtitle: "Pick one of the 5 verified Dry Zone crops",
    journoCropSelectPlaceholder: "Choose a crop...",
    journoContinueBtn: "Continue →",
    journoBackBtn: "← Back",
    journoRainHeader: "Rain-supported window",
    journoRainSubtitle: "11-year NASA satellite observation",
    journoStrongestSeason: "Strongest rain window",
    journoApproxSowingTime: "Sowing time",
    journoIgnoresIrrigation: "Assumes rainfed cultivation; ignores irrigation.",
    journoRainfallCoverageLabel: "Rainfall coverage",
    journoCoveredOfNeed: "covered by seasonal rain",
    journoUnverifiedWaterNeed: "Water requirement in mm unverified in reviewed Sri Lanka literature.",
    journoHonestyAdvice: "Supports farmers, does not replace local advice.",
    journoCrossBasisNote: "Note: Rice measures total requirement (including puddling and standing water); legume values measure crop water use only.",
    journoSeeMoreBtn: "See more details",
    journoChangeCropBtn: "Change crop",
    journoStartOverBtn: "Start over",
    journoSeeMoreCloseBtn: "Close details",
    journoForecastTitle: "7-Day Rainfall Forecast (Supplementary)",
    journoNext7DaysForecast: (mm: number) => `Next 7 days: about ${mm} mm (model forecast)`,
    journoUsualWeeklyRain: (mm: number, source: string) => `Usual: ${mm} mm per week, ${source}`,
    journoForecastAttribution: "Forecast: Meteomatics API (supplementary model) · Climatology: NASA POWER",
    journoSriLankaTimeLabel: "Sri Lanka Time (UTC+5:30)",

    crops: {
      rice: "Rice (Paddy)",
      green_gram: "Green Gram (Mung Bean)",
      cowpea: "Cowpea",
      black_gram: "Black Gram (Urad)",
      maize: "Maize (Corn)",
    },
  },

  si: {
    appTitle: "ෆීල්ඩ් ෂිෆ්ට් (Field Shift)",
    appSubtitle: "ගොවි බෝග මාරු මාර්ගෝපදේශය",
    stepIndicator: (current, total) => `පියවර ${current} / ${total}`,
    back: "ආපසු",
    next: "ඉදිරියට",
    viewResults: "බෝග මාරු විකල්ප බලන්න",
    needHelp: "උදව් අවශ්‍යද?",
    helpSheetTitle: "ගොවි උපකාර සහ මඟපෙන්වීම",
    askQuestionPlaceholder: "මෙම පියවර ගැන ප්‍රශ්නයක් අසන්න...",
    askButton: "අසන්න",
    askingStatus: "විමසමින් පවතී...",
    helpDisclaimer:
      "මෙම මඟපෙන්වීම කෘමිනාශක, පොහොර මාත්‍රා හෝ අස්වැන්න පිළිබඳ සහතික ලබා නොදේ. ක්ෂේත්‍ර උපදෙස් සඳහා කරුණාකර ඔබගේ ප්‍රදේශයේ ගොවිජන සේවා මධ්‍යස්ථානය හෝ කෘෂිකර්ම උපදේශකවරයා හමුවන්න.",

    langStepTitle: "ඔබගේ භාෂාව තෝරන්න",
    langStepSubtitle: "ඔබ භාවිතා කිරීමට කැමති භාෂාව තෝරන්න.",

    roleTitle: "ඔබ කවුද?",
    roleSubtitle: "ඔබේ භූමිකාව තෝරන්න.",
    farmerRoleLabel: "🌾 මම ගොවියෙකු",
    farmerRoleHint: "සරල බෝග මාරු මාර්ගෝපදේශය",
    researcherRoleLabel: "🔬 මම පර්යේෂකයෙකු",
    researcherRoleHint: "විශේෂඥ දත්ත, ප්‍රස්ථාර සහ පාංශු විශ්ලේෂණය",

    locStepTitle: "ඔබේ ගොවිපොළ පිහිටියේ කොහේද?",
    locStepSubtitle: "ඔබේ ප්‍රදේශය සඳහා වසර 11 ක නාසා (NASA) චන්ද්‍රිකා වැසි දත්ත භාවිත කෙරේ.",
    useMyLocation: "📍 මගේ වත්මන් ස්ථානය ගන්න",
    locating: "ස්ථානය සොයමින් පවතී...",
    noStoreNotice: "පෞද්ගලිකත්ව සටහන: අපි ඔබගේ ස්ථාන තොරතුරු ගබඩා නොකරමු. එය යොදාගන්නේ ප්‍රදේශයේ වැසි දත්ත ලබාගැනීමට පමණි.",
    orSelectPreset: "නැතහොත් කෘෂිකාර්මික ප්‍රදේශයක් තෝරන්න:",
    selectDistrictPrompt: "ප්‍රදේශයක් තෝරන්න",
    locDeniedError: "ස්ථානය ලබා ගැනීමට නොහැකි විය. කරුණාකර පහත ලැයිස්තුවෙන් ප්‍රදේශය තෝරන්න.",
    selectedLocation: "තෝරාගත් ස්ථානය",
    outsideDryZoneWarning: "⚠️ වියළි කලාපයෙන් පිටත: පර්යේෂණ දත්ත වියළි කලාපයට අදාළ බැවින් අනෙක් ප්‍රදේශ සඳහා දළ මඟපෙන්වීමක් පමණි.",

    currentCropTitle: "ඔබ දැන් වගා කරන්නේ මොනවාද?",
    currentCropSubtitle: "මහ කන්නය සහ යල කන්නය සඳහා ඔබ සාමාන්‍යයෙන් වගා කරන බෝග තෝරන්න.",
    mahaLabel: "මහ කන්නය (ප්‍රධාන වැසි කන්නය: ඔක්තෝබර් – මාර්තු)",
    yalaLabel: "යල කන්නය (සුළු කන්නය: අප්‍රේල් – සැප්තැම්බර්)",
    selectMahaPrompt: "මහ කන්නයට බෝගය තෝරන්න",
    selectYalaPrompt: "යල කන්නයට බෝගය තෝරන්න",

    consideredCropTitle: "ඔබ සලකා බැලීමට කැමති වෙනත් බෝග මොනවාද?",
    consideredCropSubtitle: "විකල්ප බෝග රටා ගවේෂණය කිරීම සඳහා ඔබ වගා කිරීමට කැමති බෝග තෝරන්න.",
    selectAnyHint: "තේරීමට හෝ ඉවත් කිරීමට බෝගය මත ස්පර්ශ කරන්න:",
    noneSelectedFallback: "වෙනත් බෝග තෝරා නැත — වියළි කලාපීය නිර්දේශිත රනිල සහ ධාන්‍ය බෝග රටා පෙන්වයි.",

    resultsTitle: "ඔබගේ බෝග මාරු විකල්ප",
    resultsSubtitle: "ඔබගේ වත්මන් වගාව දේශගුණයට ඔරොත්තු දෙන විකල්ප සමඟ සසඳන්න.",
    strategyATitle: "උපායමාර්ගය A: ඔබගේ වත්මන් වගාව",
    strategyBTitle: "උපායමාර්ගය B: රනිල බෝග එකතු කිරීම",
    strategyCTitle: "උපායමාර්ගය C: විවිධාංගීකරණය කළ වගාව",
    currentRotationBadge: "වත්මන් පදනම",
    legumeAltBadge: "පස සරු කරන රනිල බෝගය",
    diversifiedAltBadge: "විවිධ බෝග සංකලනය",
    rainfallSummaryLabel: "වර්ෂාපතන ආවරණය",
    keyRisksLabel: "කෘෂි අවදානම් සහ කරුණු",
    noRisksIdentified: "වියළි කලාපීය සාමාන්‍ය වර්ෂාපතනය යටතේ විශේෂිත අවදානම් නැත.",
    dataGapsLabel: "අවශ්‍ය තොරතුරු පරතරයන්",
    noDataGaps: "ප්‍රධාන ජල අවශ්‍යතා වාර්තා වී ඇත.",
    partialBadge: "අසම්පූර්ණ දත්ත (සැසඳිය නොහැක)",
    expertDetailsButton: "📊 විශේෂඥ විස්තර බලන්න (සිතියම, ප්‍රස්ථාර සහ පස් පරීක්ෂාව) →",
    restartWizard: "↻ මුල සිට ආරම්භ කරන්න",

    helpLanguage: "ඉංග්‍රීසි, සිංහල හෝ දෙමළ භාෂාව තෝරන්න. ඕනෑම මොහොතක භාෂාව මාරු කළ හැක.",
    helpLocation: "ස්වයංක්‍රීයව ස්ථානය ලබා ගැනීමට 'මගේ වත්මන් ස්ථානය ගන්න' ඔබන්න, නැතහොත් ලැයිස්තුවෙන් ළඟම නගරය තෝරන්න.",
    helpCurrentCrop: "මහ සහ යල කන්නවල ඔබ සාමාන්‍යයෙන් වගා කරන බෝගය තෝරන්න. වැසි ජලය ප්‍රමාණවත්දැයි මෙයින් ගණනය කෙරේ.",
    helpConsideredCrops: "මුං ඇට හෝ කවුපි වැනි ඔබ කැමති වෙනත් බෝග තෝරන්න. එමඟින් පස සරු කරන විකල්ප සකස් වේ.",
    helpResults: "මෙම කාඩ්පත් මඟින් වැසි ජලය ප්‍රමාණවත් බව සහ පාංශු සෞඛ්‍යය සසඳයි. මෙය අස්වැන්න පිළිබඳ පුරෝකථනයක් නොවේ.",

    journoLangTitle: "භාෂාව තෝරන්න",
    journoLangSubtitle: "ඔබ භාවිතා කිරීමට කැමති භාෂාව තෝරන්න",
    journoRoleTitle: "ඔබගේ භූමිකාව කුමක්ද?",
    journoRoleSubtitle: "ඔබගේ අවශ්‍යතාවය අනුව මඟපෙන්වීම සකසමු",
    journoRoleFarmer: "ගොවියෙකු",
    journoRoleFarmerDesc: "සරල වැසි කාලසටහන සහ බෝග මාරු මඟපෙන්වීම",
    journoRoleResearcher: "පර්යේෂකයෙකු",
    journoRoleResearcherDesc: "විශේෂඥ දේශගුණ දත්ත, ප්‍රස්ථාර සහ පාංශු ආකෘති",
    journoLocTitle: "ඔබේ ගොවිපොළ කොහේද?",
    journoLocSubtitle: "ඔබේ ප්‍රදේශය සඳහා වසර 11 ක නාසා වැසි දත්ත භාවිත කෙරේ",
    journoUseMyLocation: "📍 මගේ වත්මන් ස්ථානය",
    journoLocating: "ස්ථානය සොයමින් පවතී...",
    journoOrSelectArea: "නැතහොත් කෘෂිකාර්මික ප්‍රදේශයක් තෝරන්න:",
    journoNotStoredNote: "🔒 ඔබේ ස්ථානය නාසා දත්ත ලබාගැනීමට පමණක් භාවිත වන අතර කිසිසේත් ගබඩා නොකෙරේ.",
    journoCropTitle: "ඔබේ බෝගය තෝරන්න",
    journoCropSubtitle: "වියළි කලාපීය ප්‍රධාන බෝග 5 න් එකක් තෝරන්න",
    journoCropSelectPlaceholder: "බෝගයක් තෝරන්න...",
    journoContinueBtn: "ඉදිරියට →",
    journoBackBtn: "← ආපසු",
    journoRainHeader: "වැසි ආධාරක වගා කාලය",
    journoRainSubtitle: "වසර 11 ක නාසා චන්ද්‍රිකා නිරීක්ෂණ",
    journoStrongestSeason: "වැඩිම වැසි ආවරණයක් සහිත කන්නය",
    journoApproxSowingTime: "වපුරන කාලය",
    journoIgnoresIrrigation: "වැසි ජලයෙන් පමණක් වගා කරන බව උපකල්පනය කරයි; වාරි ජලය නොසලකයි.",
    journoRainfallCoverageLabel: "වැසි ආවරණය",
    journoCoveredOfNeed: "වැසි ජලයෙන් ආවරණය වේ",
    journoUnverifiedWaterNeed: "ශ්‍රී ලංකා පර්යේෂණ ලේඛනවල ජල අවශ්‍යතාවය (මි.මී.) තහවුරු කර නොමැත.",
    journoHonestyAdvice: "ගොවීන්ට මඟපෙන්වීමක් පමණි; ප්‍රාදේශීය කෘෂි උපදෙස් වෙනුවට භාවිත කළ නොහැක.",
    journoCrossBasisNote: "සටහන: වී සඳහා මඩ කිරීම ඇතුළු මුළු ජල අවශ්‍යතාවය ගණනය කරන අතර, රනිල බෝග සඳහා ශාකයේ ජල පරිභෝජනය පමණක් ගණනය කෙරේ.",
    journoSeeMoreBtn: "වැඩිදුර විස්තර බලන්න",
    journoChangeCropBtn: "බෝගය මාරු කරන්න",
    journoStartOverBtn: "මුල සිට අරඹන්න",
    journoSeeMoreCloseBtn: "විස්තර සඟවන්න",
    journoForecastTitle: "දින 7 ක වැසි පුරෝකථනය (අතිරේක)",
    journoNext7DaysForecast: (mm: number) => `ඉදිරි දින 7: මි.මී. ${mm} පමණ (ආකෘති පුරෝකථනය)`,
    journoUsualWeeklyRain: (mm: number, source: string) => `සාමාන්‍යය: සතියකට මි.මී. ${mm}, ${source}`,
    journoForecastAttribution: "පුරෝකථනය: Meteomatics API (අතිරේක ආකෘතිය) · දේශගුණය: NASA POWER",
    journoSriLankaTimeLabel: "ශ්‍රී ලංකා වේලාව (UTC+5:30)",

    crops: {
      rice: "වී (Paddy)",
      green_gram: "මුං ඇට (Green Gram)",
      cowpea: "කවුපි (Cowpea)",
      black_gram: "උඳු (Black Gram)",
      maize: "බඩ ඉරිඟු (Maize)",
    },
  },

  ta: {
    appTitle: "ஃபீல்ட் ஷிப்ட் (Field Shift)",
    appSubtitle: "விவசாய பயிர் சுழற்சி வழிகாட்டி",
    stepIndicator: (current, total) => `படி ${current} / ${total}`,
    back: "பின்செல்",
    next: "அடுத்து",
    viewResults: "பயிர் சுழற்சி தேர்வுகளைப் பார்க்கவும்",
    needHelp: "உதவி தேவையா?",
    helpSheetTitle: "விவசாயி உதவி மற்றும் வழிகாட்டல்",
    askQuestionPlaceholder: "இந்த படி குறித்து கேள்வி கேட்கவும்...",
    askButton: "கேட்க",
    askingStatus: "விசாரிப்பது...",
    helpDisclaimer:
      "இந்த வழிகாட்டி பூச்சிக்கொல்லி, உர அளவு அல்லது விளைச்சல் கணிப்புகளை வழங்காது. விரிவான ஆலோசனைக்கு உங்கள் கமநல சேவை மையம் அல்லது விவசாய அதிகாரியை அணுகவும்.",

    langStepTitle: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    langStepSubtitle: "பயன்படுத்த விரும்பும் மொழியைத் தேர்வுசெய்யவும்.",

    roleTitle: "நீங்கள் யார்?",
    roleSubtitle: "உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்.",
    farmerRoleLabel: "🌾 நான் ஒரு விவசாயி",
    farmerRoleHint: "எளிய பயிர் சுழற்சி வழிகாட்டி",
    researcherRoleLabel: "🔬 நான் ஒரு ஆராய்ச்சியாளர்",
    researcherRoleHint: "நிபுணர் தரவு, விளக்கப்படங்கள் மற்றும் மண் பகுப்பாய்வு",

    locStepTitle: "உங்கள் பண்ணை எங்குள்ளது?",
    locStepSubtitle: "உங்கள் பகுதிக்கான நாசாவின் 11 ஆண்டுகால மழைவீழ்ச்சி தரவு பயன்படுத்தப்படுகிறது.",
    useMyLocation: "📍 எனது அமைவிடத்தைப் பயன்படுத்தவும்",
    locating: "அமைவிடம் அறியப்படுகிறது...",
    noStoreNotice: "தனியுரிமைக் குறிப்பு: உங்கள் அமைவிடத்தை நாங்கள் சேமிப்பதில்லை. உள்ளூர் மழையளவை அறிய மட்டுமே இது பயன்படுகிறது.",
    orSelectPreset: "அல்லது விவசாயப் பகுதியைத் தேர்ந்தெடுக்கவும்:",
    selectDistrictPrompt: "ஒரு பகுதியைத் தேர்ந்தெடுக்கவும்",
    locDeniedError: "அமைவிடத்தை அறிய முடியவில்லை. கீழே உள்ள பட்டியலில் இருந்து தேர்ந்தெடுக்கவும்.",
    selectedLocation: "தேர்ந்தெடுக்கப்பட்ட இடம்",
    outsideDryZoneWarning: "⚠️ உலர் வலயத்திற்கு வெளியே: ஆராய்ச்சித் தகவல்கள் உலர் வலயத்திற்கு மட்டுமே உரியவை.",

    currentCropTitle: "தற்போது நீங்கள் என்ன பயிரிடுகிறீர்கள்?",
    currentCropSubtitle: "பெரும்போகம் (Maha) மற்றும் சிறுபோகம் (Yala) பயிர்களைத் தேர்ந்தெடுக்கவும்.",
    mahaLabel: "பெரும்போகம் (Maha: அக்டோபர் – மார்ச்)",
    yalaLabel: "சிறுபோகம் (Yala: ஏப்ரல் – செப்டம்பர்)",
    selectMahaPrompt: "பெரும்போகப் பயிரைத் தேர்ந்தெடுக்கவும்",
    selectYalaPrompt: "சிறுபோகப் பயிரைத் தேர்ந்தெடுக்கவும்",

    consideredCropTitle: "நீங்கள் பரிசீலிக்க விரும்பும் பிற பயிர்கள் யாவை?",
    consideredCropSubtitle: "மாற்று பயிர் சுழற்சிகளை ஆராய நீங்கள் பயிரிட விரும்பும் பயிர்களைத் தேர்வுசெய்யவும்.",
    selectAnyHint: "தேர்வு செய்ய பயிர்களைத் தொடவும்:",
    noneSelectedFallback: "பிற பயிர்கள் தேர்வு செய்யப்படவில்லை — பரிந்துரைக்கப்பட்ட பயறு மற்றும் தானிய சுழற்சிகள் காட்டப்படுகின்றன.",

    resultsTitle: "உங்கள் பயிர் சுழற்சி தேர்வுகள்",
    resultsSubtitle: "உங்கள் தற்போதைய முறையை உலர் வலய மாற்று வழிகளுடன் ஒப்பிட்டுப் பாருங்கள்.",
    strategyATitle: "திட்டம் A: உங்கள் தற்போதைய முறை",
    strategyBTitle: "திட்டம் B: பயறு வகை பயிர் ஒருங்கிணைப்பு",
    strategyCTitle: "திட்டம் C: பன்முகப்படுத்தப்பட்ட பயிர் முறை",
    currentRotationBadge: "உங்கள் பண்ணை அடிப்படை",
    legumeAltBadge: "மண்வளம் பெருக்கும் பயறு",
    diversifiedAltBadge: "பன்முகப் பயிர் முறை",
    rainfallSummaryLabel: "மழைவீழ்ச்சி தேவையை பூர்த்தி செய்தல்",
    keyRisksLabel: "விவசாய இடர்கள் மற்றும் குறிப்புகள்",
    noRisksIdentified: "வழக்கமான மழைவீழ்ச்சியின் கீழ் இடர்கள் ஏதும் குறிக்கப்படவில்லை.",
    dataGapsLabel: "தேவைப்படும் தகவல்கள்",
    noDataGaps: "முக்கிய நீர் தேவைகள் ஆவணப்படுத்தப்பட்டுள்ளன.",
    partialBadge: "பகுதித் தரவு (ஒப்பிட முடியாது)",
    expertDetailsButton: "📊 நிபுணர் விவரங்களைப் பார்க்க (வரைபடம், விளக்கப்படங்கள் மற்றும் மண் பரிசோதனை) →",
    restartWizard: "↻ மீண்டும் தொடங்க",

    helpLanguage: "ஆங்கிலம், சிங்களம் அல்லது தமிழ் மொழியைத் தேர்ந்தெடுக்கவும். எந்த நேரத்திலும் மாற்றலாம்.",
    helpLocation: "'எனது அமைவிடத்தைப் பயன்படுத்தவும்' என்பதை அழுத்தவும் அல்லது பட்டியலிலிருந்து அருகிலுள்ள ஊரைத் தேர்ந்தெடுக்கவும்.",
    helpCurrentCrop: "பெரும்போகம் மற்றும் சிறுபோகத்தில் நீங்கள் பொதுவாக பயிரிடும் பயிரைத் தேர்வுசெய்யவும்.",
    helpConsideredCrops: "பயறு அல்லது தட்டப்பயறு போன்ற நீங்கள் விரும்பும் மாற்றுப் பயிர்களைத் தேர்ந்தெடுக்கவும்.",
    helpResults: "இந்த அட்டைகள் மழைநீர் போதுமானதா மற்றும் மண் ஆரோக்கியத்தை ஒப்பிடுகின்றன. இது மகசூல் கணிப்பு அல்ல.",

    journoLangTitle: "மொழியைத் தேர்வுசெய்க",
    journoLangSubtitle: "உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்",
    journoRoleTitle: "உங்கள் பங்கு என்ன?",
    journoRoleSubtitle: "உங்கள் தேவைக்கு ஏற்ப வழிகாட்டியை அமைக்கிறோம்",
    journoRoleFarmer: "விவசாயி",
    journoRoleFarmerDesc: "எளிய மழைக்கால அட்டவணை மற்றும் பயிர் சுழற்சி வழிகாட்டி",
    journoRoleResearcher: "ஆராய்ச்சியாளர்",
    journoRoleResearcherDesc: "நிபுணர் வானிலை தரவு, விளக்கப்படங்கள் மற்றும் மண் மாதிரிகள்",
    journoLocTitle: "உங்கள் பண்ணை எங்குள்ளது?",
    journoLocSubtitle: "உங்கள் பகுதிக்கான 11 ஆண்டுகால நாசா மழைத் தரவைப் பயன்படுத்துகிறோம்",
    journoUseMyLocation: "📍 எனது இருப்பிடம்",
    journoLocating: "இருப்பிடம் கண்டறியப்படுகிறது...",
    journoOrSelectArea: "அல்லது ஒரு விவசாயப் பகுதியைத் தேர்வுசெய்யவும்:",
    journoNotStoredNote: "🔒 உங்கள் இருப்பிடம் நாசா தரவை வினவ மட்டுமே பயன்படுகிறது; ஒருபோதும் சேமிக்கப்படாது.",
    journoCropTitle: "பயிரைத் தேர்ந்தெடுக்கவும்",
    journoCropSubtitle: "சரிபார்க்கப்பட்ட 5 உலர் வலயப் பயிர்களில் ஒன்றைத் தேர்வுசெய்க",
    journoCropSelectPlaceholder: "ஒரு பயிரைத் தேர்ந்தெடுக்கவும்...",
    journoContinueBtn: "தொடரவும் →",
    journoBackBtn: "← பின்செல்",
    journoRainHeader: "மழை ஆதரவு சாகுபடி பருவம்",
    journoRainSubtitle: "11 ஆண்டுகால நாசா செயற்கைக்கோள் தரவு",
    journoStrongestSeason: "வலுவான மழை ஆதரவு பருவம்",
    journoApproxSowingTime: "விதைப்பு நேரம்",
    journoIgnoresIrrigation: "மானாவாரி சாகுபடியை அடிப்படையாகக் கொண்டது; நீர்ப்பாசனத்தைக் கணக்கில் கொள்ளாது.",
    journoRainfallCoverageLabel: "மழை நீர் பூர்த்தி",
    journoCoveredOfNeed: "பருவ மழையால் பூர்த்தி செய்யப்படுகிறது",
    journoUnverifiedWaterNeed: "ஆய்வு செய்யப்பட்ட இலங்கை ஆவணங்களில் நீர் தேவை (மிமீ) சரிபார்க்கப்படவில்லை.",
    journoHonestyAdvice: "விவசாயிகளுக்கு வழிகாட்டுதல் மட்டுமே; உள்ளூர் விவசாய ஆலோசனைகளுக்கு மாற்றாகாது.",
    journoCrossBasisNote: "குறிப்பு: நெல்லுக்கு நில தயாரிப்பு உட்பட மொத்தத் தேவை கணக்கிடப்படுகிறது; பயறு வகைகளுக்கு பயிர் நீர் பயன்பாடு மட்டுமே.",
    journoSeeMoreBtn: "கூடுதல் விவரங்களைப் பார்க்க",
    journoChangeCropBtn: "பயிரை மாற்றவும்",
    journoStartOverBtn: "மீண்டும் தொடங்க",
    journoSeeMoreCloseBtn: "விவரங்களை மூடு",
    journoForecastTitle: "7 நாள் மழை முன்னறிவிப்பு (துணை)",
    journoNext7DaysForecast: (mm: number) => `அடுத்த 7 நாட்கள்: சுமார் ${mm} மிமீ (மாதிரி முன்னறிவிப்பு)`,
    journoUsualWeeklyRain: (mm: number, source: string) => `வழக்கமானது: வாரத்திற்கு ${mm} மிமீ, ${source}`,
    journoForecastAttribution: "முன்னறிவிப்பு: Meteomatics API (துணை மாதிரி) · காலநிலை: NASA POWER",
    journoSriLankaTimeLabel: "இலங்கை நேரம் (UTC+5:30)",

    crops: {
      rice: "நெல் (Paddy)",
      green_gram: "பாசிப்பயறு (Green Gram)",
      cowpea: "தட்டப்பயறு (Cowpea)",
      black_gram: "உளுந்து (Black Gram)",
      maize: "மக்காச்சோளம் (Maize)",
    },
  },
};
